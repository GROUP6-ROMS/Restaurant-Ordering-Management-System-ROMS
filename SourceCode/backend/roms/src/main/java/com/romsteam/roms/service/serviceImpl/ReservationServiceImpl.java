package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.AssignTableReservationRequest;
import com.romsteam.roms.dto.request.CancelReservationRequest;
import com.romsteam.roms.dto.request.CreateReservationRequest;
import com.romsteam.roms.dto.request.ReservationItemRequest;
import com.romsteam.roms.dto.request.UpdateReservationItemsRequest;
import com.romsteam.roms.dto.response.ReservationItemResponse;
import com.romsteam.roms.dto.response.ReservationResponse;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.dto.response.ZoneResponse;
import com.romsteam.roms.entity.MenuItem;
import com.romsteam.roms.entity.Reservation;
import com.romsteam.roms.entity.ReservationItem;
import com.romsteam.roms.entity.RestaurantTable;
import com.romsteam.roms.entity.Zone;
import com.romsteam.roms.entity.enums.ReservationStatus;
import com.romsteam.roms.entity.enums.TableStatus;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.repository.MenuItemRepository;
import com.romsteam.roms.repository.ReservationRepository;
import com.romsteam.roms.repository.RestaurantTableRepository;
import com.romsteam.roms.repository.ZoneRepository;
import com.romsteam.roms.service.EmailService;
import com.romsteam.roms.service.ReservationService;
import com.romsteam.roms.service.RestaurantTableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final RestaurantTableRepository tableRepository;
    private final MenuItemRepository menuItemRepository;
    private final RestaurantTableService tableService;
    private final ZoneRepository zoneRepository;
    private final EmailService emailService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    // ===================================================================
    // 1. KHÁCH HÀNG TẠO YÊU CẦU ĐẶT BÀN TRỰC TUYẾN
    // ===================================================================
    @Override
    @Transactional
    public ReservationResponse createCustomerReservation(CreateReservationRequest request) {
        // 1. Parse ngày và giờ đặt bàn
        LocalDate date = LocalDate.parse(request.getReservationDate());
        LocalTime time = LocalTime.parse(request.getReservationTime());
        LocalDateTime reservationDateTime = LocalDateTime.of(date, time);

        // Kiểm tra thời gian đặt bàn không được ở trong quá khứ
        if (reservationDateTime.isBefore(LocalDateTime.now())) {
            throw new AppException("Thời gian đặt bàn không hợp lệ! Vui lòng chọn thời gian từ hiện tại trở đi.");
        }

        // Kiểm tra khung giờ mở cửa nhận khách đặt bàn (RULE-RESV-03: 07:00 - 21:30)
        LocalTime openingTime = LocalTime.of(7, 0);
        LocalTime closingTime = LocalTime.of(21, 30);
        if (time.isBefore(openingTime) || time.isAfter(closingTime)) {
            throw new AppException("Nhà hàng chỉ phục vụ đặt bàn trong khung giờ từ 07:00 đến 21:30 hàng ngày. Quý khách vui lòng chọn khung giờ trong khoảng này!");
        }

        // Kiểm tra số lượng khách đặt bàn trực tuyến theo RULE-RESV-01 & RULE-RESV-02: từ 1 đến 20 khách
        if (request.getGuestCount() == null || request.getGuestCount() < 1 || request.getGuestCount() > 20) {
            throw new AppException("Số lượng khách đặt trực tuyến phải từ 1 đến 20 người. Với đoàn từ 21 khách trở lên, quý khách vui lòng liên hệ hotline để được phục vụ tiệc riêng!");
        }

        // 2. Sinh mã đặt chỗ duy nhất (Ví dụ: RES-20261009-4821)
        String dateStr = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String bookingCode;
        Random random = new Random();
        do {
            int randomNum = 1000 + random.nextInt(9000);
            bookingCode = "RES-" + dateStr + "-" + randomNum;
        } while (reservationRepository.existsByBookingCode(bookingCode));

        // 3. Khởi tạo bản ghi Reservation với trạng thái PENDING (chưa gán bàn)
        Reservation reservation = Reservation.builder()
                .bookingCode(bookingCode)
                .customerName(request.getCustomerName().trim())
                .customerPhone(request.getCustomerPhone().trim())
                .customerEmail(request.getCustomerEmail() != null ? request.getCustomerEmail().trim() : null)
                .guestCount(request.getGuestCount())
                .reservationTime(reservationDateTime)
                .requestedZone(request.getRequestedZone())
                .status(ReservationStatus.PENDING) // Luôn khởi tạo là PENDING chờ Quản lý gọi điện
                .note(request.getNote() != null ? request.getNote().trim() : null)
                .table(null) // Chưa gán bàn lúc khách mới gửi yêu cầu
                .items(new ArrayList<>())
                .build();

        // 4. Đính kèm các món ăn đặt trước (nếu có)
        if (request.getPreOrderItems() != null && !request.getPreOrderItems().isEmpty()) {
            java.util.Map<Long, Integer> requestedQtyByDish = new java.util.HashMap<>();
            for (ReservationItemRequest itemReq : request.getPreOrderItems()) {
                if (itemReq.getMenuItemId() == null || itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                    continue;
                }
                MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                        .orElseThrow(() -> new AppException("Món ăn ID #" + itemReq.getMenuItemId() + " không tồn tại trong hệ thống!"));
                if (!menuItem.getIsActive()) {
                    throw new AppException("Món '" + menuItem.getName() + "' hiện không còn kinh doanh!");
                }
                if (!Boolean.TRUE.equals(menuItem.getIsAvailable()) ||
                        (menuItem.getRemainingStock() != null && menuItem.getRemainingStock() <= 0)) {
                    throw new AppException("Món '" + menuItem.getName() + "' hiện đã tạm ngưng phục vụ hoặc hết hàng, vui lòng chọn món khác!", HttpStatus.BAD_REQUEST);
                }
                int totalRequested = requestedQtyByDish.merge(itemReq.getMenuItemId(), itemReq.getQuantity(), Integer::sum);
                if (menuItem.getRemainingStock() != null && totalRequested > menuItem.getRemainingStock()) {
                    throw new AppException("Món '" + menuItem.getName() + "' hiện chỉ còn lại " + menuItem.getRemainingStock() + " phần, vui lòng giảm số lượng đặt trước!", HttpStatus.BAD_REQUEST);
                }
                BigDecimal unitPrice = menuItem.getPrice();
                BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));

                ReservationItem item = ReservationItem.builder()
                        .reservation(reservation)
                        .menuItem(menuItem)
                        .quantity(itemReq.getQuantity())
                        .unitPrice(unitPrice)
                        .subtotal(subtotal)
                        .note(itemReq.getNote() != null ? itemReq.getNote().trim() : null)
                        .build();
                reservation.getItems().add(item);
            }
        }

        Reservation saved = reservationRepository.save(reservation);

        // Gửi email tiếp nhận đơn đặt bàn tới khách hàng (nếu có email)
        if (saved.getCustomerEmail() != null && !saved.getCustomerEmail().trim().isEmpty()) {
            emailService.sendReservationCreatedEmail(saved);
        }

        return mapToResponse(saved);
    }

    // ===================================================================
    // 2. LẤY DANH SÁCH PHÂN KHU ĐỘNG TỪ DATABASE
    // ===================================================================
    @Override
    @Transactional(readOnly = true)
    public List<ZoneResponse> getActiveZones() {
        // Lấy danh sách các khu vực đang hoạt động từ bảng zones theo thứ tự hiển thị
        List<Zone> activeZones = zoneRepository.findByIsActiveTrueOrderByDisplayOrderAsc();

        // Fallback an toàn nếu database chưa có bản ghi nào trong bảng zones
        if (activeZones.isEmpty()) {
            List<String> distinctZones = tableRepository.findDistinctActiveZones();
            if (distinctZones.isEmpty()) {
                distinctZones = Arrays.asList("ZONE_1", "ZONE_2", "VIP");
            }

            List<ZoneResponse> fallbackResults = new ArrayList<>();
            for (String zoneCode : distinctZones) {
                long total = tableRepository.countByZoneAndIsActiveTrue(zoneCode);
                long available = tableRepository.findByZoneAndStatusAndIsActiveTrue(zoneCode, TableStatus.AVAILABLE).size();

                String zName = "ZONE_2".equals(zoneCode) ? "Ban Công & Sân Vườn - Tầng 2" :
                               "VIP".equals(zoneCode) ? "Phòng Riêng VIP Sang Trọng" : "Sảnh Chính - Tầng 1";
                String desc = "ZONE_2".equals(zoneCode) ? "Tầm nhìn thoáng đãng nhìn ra phố cổ, gió trời tự nhiên lãng mạn cho cặp đôi và nhóm bạn." :
                              "VIP".equals(zoneCode) ? "Cách âm tốt, không gian riêng tư ấm cúng, thích hợp họp mặt đối tác, liên hoan và tiệc gia đình thân mật." :
                              "Không gian ấm cúng, thiết kế hiện đại với dàn đèn nghệ thuật và âm nhạc du dương.";
                String badge = "ZONE_2".equals(zoneCode) ? "View đẹp" : "VIP".equals(zoneCode) ? "Riêng tư" : "Phổ biến";

                fallbackResults.add(ZoneResponse.builder()
                        .zoneCode(zoneCode)
                        .name(zName)
                        .zoneName(zName)
                        .description(desc)
                        .badge(badge)
                        .totalTables(total)
                        .tableCount(total)
                        .availableTables(available)
                        .isActive(true)
                        .build());
            }
            return fallbackResults;
        }

        // Tải danh sách khu vực động thực tế từ CSDL
        List<ZoneResponse> results = new ArrayList<>();
        for (Zone zone : activeZones) {
            long total = tableRepository.countByZoneAndIsActiveTrue(zone.getZoneCode());
            long available = tableRepository.findByZoneAndStatusAndIsActiveTrue(zone.getZoneCode(), TableStatus.AVAILABLE).size();

            // Xác định huy hiệu (badge) phù hợp
            String badge = null;
            String lowerName = zone.getName() != null ? zone.getName().toLowerCase() : "";
            if ("ZONE_1".equalsIgnoreCase(zone.getZoneCode()) || lowerName.contains("sảnh")) {
                badge = "Phổ biến";
            } else if ("ZONE_2".equalsIgnoreCase(zone.getZoneCode()) || lowerName.contains("ban công") || lowerName.contains("sân vườn")) {
                badge = "View đẹp";
            } else if ("VIP".equalsIgnoreCase(zone.getZoneCode()) || lowerName.contains("vip")) {
                badge = "Riêng tư";
            }

            String desc = zone.getDescription();
            if (desc == null || desc.trim().isEmpty()) {
                desc = "Không gian phục vụ hiện đại, tiện nghi, ẩm thực tinh hoa của nhà hàng ROMS.";
            }

            results.add(ZoneResponse.builder()
                    .id(zone.getId())
                    .zoneCode(zone.getZoneCode())
                    .name(zone.getName())
                    .zoneName(zone.getName())
                    .description(desc)
                    .badge(badge)
                    .displayOrder(zone.getDisplayOrder())
                    .totalTables(total)
                    .tableCount(total)
                    .availableTables(available)
                    .isActive(zone.getIsActive())
                    .createdAt(zone.getCreatedAt())
                    .updatedAt(zone.getUpdatedAt())
                    .build());
        }

        return results;
    }

    // ===================================================================
    // 3. QUẢN LÝ XEM DANH SÁCH ĐẶT BÀN
    // ===================================================================
    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> getReservations(ReservationStatus status, LocalDate date, String keyword) {
        List<Reservation> list;
        if (keyword != null && !keyword.trim().isEmpty()) {
            list = reservationRepository.searchReservations(status, keyword.trim());
        } else if (status != null) {
            list = reservationRepository.findByStatusOrderByReservationTimeAsc(status);
        } else {
            list = reservationRepository.findAll().stream()
                    .sorted(Comparator.comparing(Reservation::getReservationTime))
                    .collect(Collectors.toList());
        }

        // Lọc theo ngày nếu có
        if (date != null) {
            list = list.stream()
                    .filter(r -> r.getReservationTime().toLocalDate().equals(date))
                    .collect(Collectors.toList());
        }

        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ===================================================================
    // 4. LẤY CHI TIẾT ĐƠN ĐẶT BÀN
    // ===================================================================
    @Override
    @Transactional(readOnly = true)
    public ReservationResponse getReservationById(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new AppException("Không tìm thấy thông tin đơn đặt bàn mã #" + id));
        return mapToResponse(reservation);
    }

    // ===================================================================
    // 5. GỢI Ý DANH SÁCH BÀN TRỐNG ĐỂ QUẢN LÝ XẾP BÀN
    // ===================================================================
    @Override
    @Transactional(readOnly = true)
    public List<TableResponse> getAvailableTablesForReservation(Long reservationId) {
        Reservation res = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException("Không tìm thấy đơn đặt bàn #" + reservationId));

        // Lấy toàn bộ các bàn đang hoạt động trong nhà hàng (không bị khóa bảo trì BLOCKED)
        List<RestaurantTable> allActiveTables = tableRepository.findAll().stream()
                .filter(t -> Boolean.TRUE.equals(t.getIsActive()) && t.getStatus() != TableStatus.BLOCKED)
                .collect(Collectors.toList());

        // Nghiệp vụ đa đặt bàn (Trùng giờ & Không trùng giờ):
        // Lọc bàn khả dụng: Loại bỏ các bàn đã có đơn đặt CONFIRMED bị trùng khung giờ an toàn (cách nhau dưới 120 phút trên cùng ngày)
        LocalDate targetDate = res.getReservationTime().toLocalDate();

        List<RestaurantTable> availableTables = allActiveTables.stream()
                .filter(table -> {
                    List<Reservation> existingList = reservationRepository
                            .findByTableIdAndStatusOrderByReservationTimeAsc(table.getId(), ReservationStatus.CONFIRMED);
                    if (existingList == null || existingList.isEmpty()) return true;

                    for (Reservation existing : existingList) {
                        if (existing.getId().equals(res.getId())) continue;
                        if (existing.getReservationTime() == null) continue;
                        if (existing.getReservationTime().toLocalDate().equals(targetDate)) {
                            long diffMinutes = Math.abs(java.time.Duration.between(
                                    res.getReservationTime(), existing.getReservationTime()).toMinutes());
                            if (diffMinutes < 120) {
                                // Xung đột lịch đặt bàn trong vòng 2 tiếng
                                return false;
                            }
                        }
                    }
                    return true;
                })
                .collect(Collectors.toList());

        final String reqZone = res.getRequestedZone();
        final int guests = res.getGuestCount() != null ? res.getGuestCount() : 1;

        // Ưu tiên sắp xếp:
        // 1. Các bàn thuộc đúng phân khu khách yêu cầu lên đầu
        // 2. Bàn có sức chứa phù hợp (capacity >= số khách)
        // 3. Sắp xếp tự nhiên theo số bàn (tableNumber)
        availableTables.sort((t1, t2) -> {
            boolean t1Zone = reqZone != null && reqZone.equalsIgnoreCase(t1.getZone());
            boolean t2Zone = reqZone != null && reqZone.equalsIgnoreCase(t2.getZone());
            if (t1Zone != t2Zone) {
                return t1Zone ? -1 : 1;
            }

            boolean t1Fit = t1.getCapacity() != null && t1.getCapacity() >= guests;
            boolean t2Fit = t2.getCapacity() != null && t2.getCapacity() >= guests;
            if (t1Fit != t2Fit) {
                return t1Fit ? -1 : 1;
            }

            String num1 = t1.getTableNumber() != null ? t1.getTableNumber() : "";
            String num2 = t2.getTableNumber() != null ? t2.getTableNumber() : "";
            return num1.compareToIgnoreCase(num2);
        });

        return availableTables.stream().map(t -> {
            String zName = resolveZoneName(t.getZone());

            return TableResponse.builder()
                    .id(t.getId())
                    .code(t.getTableNumber())
                    .tableNumber(t.getTableNumber())
                    .name(t.getName())
                    .zone(t.getZone())
                    .zoneName(zName)
                    .capacity(t.getCapacity())
                    .status(t.getStatus())
                    .isActive(t.getIsActive())
                    .build();
        }).collect(Collectors.toList());
    }

    // ===================================================================
    // 6. QUẢN LÝ XÁC NHẬN & XẾP BÀN
    // ===================================================================
    @Override
    @Transactional
    public ReservationResponse assignTableToReservation(Long reservationId, AssignTableReservationRequest request) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException("Không tìm thấy đơn đặt bàn #" + reservationId));

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new AppException("Đơn đặt bàn này đã bị hủy, không thể xếp bàn!");
        }

        RestaurantTable table = tableRepository.findById(request.getTableId())
                .orElseThrow(() -> new AppException("Không tìm thấy bàn ăn mang ID #" + request.getTableId()));

        if (table.getStatus() == TableStatus.BLOCKED) {
            throw new AppException("Bàn " + table.getTableNumber() + " đang tạm khóa bảo trì thiết bị, không thể xếp bàn!", HttpStatus.BAD_REQUEST);
        }

        // KIỂM TRA XUNG ĐỘT KHUNG GIỜ VỚI CÁC ĐƠN ĐẶT BÀN KHÁC TRÊN CÙNG BÀN (TRÙNG GIỜ & KHÔNG TRÙNG GIỜ)
        List<Reservation> existingConfirmed = reservationRepository
                .findByTableIdAndStatusOrderByReservationTimeAsc(table.getId(), ReservationStatus.CONFIRMED);

        if (existingConfirmed != null && !existingConfirmed.isEmpty()) {
            LocalDate targetDate = reservation.getReservationTime().toLocalDate();
            for (Reservation existing : existingConfirmed) {
                if (existing.getId().equals(reservation.getId())) continue;
                if (existing.getReservationTime() == null) continue;
                if (existing.getReservationTime().toLocalDate().equals(targetDate)) {
                    long diffMinutes = Math.abs(java.time.Duration.between(
                            reservation.getReservationTime(), existing.getReservationTime()).toMinutes());
                    if (diffMinutes < 120) {
                        String timeStr = existing.getReservationTime().format(TIME_FORMATTER);
                        throw new AppException(
                                "Xung đột lịch đặt bàn! Bàn " + table.getTableNumber() + " đã có đơn đặt của khách " +
                                existing.getCustomerName() + " (" + existing.getCustomerPhone() + ") lúc " + timeStr +
                                " (cách giờ hẹn dưới 120 phút). Vui lòng chọn bàn khác hoặc khung giờ cách nhau tối thiểu 2 tiếng!",
                                HttpStatus.BAD_REQUEST
                        );
                    }
                }
            }
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lockStart = reservation.getReservationTime().minusMinutes(60);
        LocalDateTime lockEnd = reservation.getReservationTime().plusMinutes(45);
        boolean isNowInLockWindow = (now.isEqual(lockStart) || now.isAfter(lockStart))
                && (now.isEqual(lockEnd) || now.isBefore(lockEnd));

        // Nếu giờ hẹn nằm ngay trong khung khóa đón khách hiện tại mà bàn đang có khách ngồi ăn (OCCUPIED):
        if (isNowInLockWindow && table.getStatus() == TableStatus.OCCUPIED) {
            throw new AppException("Bàn " + table.getTableNumber() + " hiện đang có khách ngồi ăn, không thể nhận khách đặt ngay lúc này!", HttpStatus.BAD_REQUEST);
        }

        // 1. Cập nhật thông tin phiếu đặt
        reservation.setTable(table);
        reservation.setStatus(ReservationStatus.CONFIRMED);

        // 2. Cập nhật thông tin bàn ăn:
        table.setReservationInfo(reservation.getCustomerName() + " (" + reservation.getCustomerPhone() + ")");
        table.setReservedTime(reservation.getReservationTime().format(TIME_FORMATTER) + " ngày " + reservation.getReservationTime().format(DATE_FORMATTER));

        if (isNowInLockWindow) {
            table.setStatus(TableStatus.RESERVED);
        } else {
            // Nếu chưa tới khung giờ khóa an toàn (> 60 phút):
            // Bàn giữ nguyên trạng thái hiện tại (AVAILABLE) để tiếp tục đón khách vãng lai các ca trước
            if (table.getStatus() == null) {
                table.setStatus(TableStatus.AVAILABLE);
            }
        }

        tableRepository.save(table);
        Reservation updated = reservationRepository.save(reservation);

        // 3. Gửi email xác nhận kèm số bàn và hướng dẫn cho khách hàng (nếu có email)
        if (updated.getCustomerEmail() != null && !updated.getCustomerEmail().trim().isEmpty()) {
            String zoneName = resolveZoneName(table.getZone());
            emailService.sendReservationConfirmedEmail(updated, table.getTableNumber(), zoneName);
        }

        return mapToResponse(updated);
    }

    // ===================================================================
    // 7. QUẢN LÝ HỦY ĐƠN ĐẶT BÀN
    // ===================================================================
    @Override
    @Transactional
    public ReservationResponse cancelReservation(Long reservationId, CancelReservationRequest request) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException("Không tìm thấy đơn đặt bàn #" + reservationId));

        // Giải phóng bàn nếu trước đó đã được xếp bàn
        if (reservation.getTable() != null) {
            RestaurantTable table = reservation.getTable();
            List<Reservation> remainingConfirmed = reservationRepository
                    .findByTableIdAndStatusOrderByReservationTimeAsc(table.getId(), ReservationStatus.CONFIRMED)
                    .stream()
                    .filter(r -> !r.getId().equals(reservation.getId()))
                    .collect(Collectors.toList());

            if (remainingConfirmed.isEmpty()) {
                if (table.getStatus() == TableStatus.RESERVED) {
                    table.setStatus(TableStatus.AVAILABLE);
                }
                table.setReservationInfo(null);
                table.setReservedTime(null);
            } else {
                Reservation next = remainingConfirmed.get(0);
                table.setReservationInfo(next.getCustomerName() + " (" + next.getCustomerPhone() + ")");
                table.setReservedTime(next.getReservationTime().format(TIME_FORMATTER) + " ngày " + next.getReservationTime().format(DATE_FORMATTER));
            }
            tableRepository.save(table);
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelReason(request.getCancelReason());

        Reservation saved = reservationRepository.save(reservation);

        // Gửi email thông báo hủy bàn cho khách hàng (nếu có email)
        if (saved.getCustomerEmail() != null && !saved.getCustomerEmail().trim().isEmpty()) {
            emailService.sendReservationCancelledEmail(saved, request.getCancelReason());
        }

        return mapToResponse(saved);
    }

    // ===================================================================
    // 8. QUẢN LÝ KIỂM TRA & CẬP NHẬT MÓN ĐẶT TRƯỚC (THÊM / SỬA / XÓA)
    // ===================================================================
    @Override
    @Transactional
    public ReservationResponse updateReservationItems(Long reservationId, UpdateReservationItemsRequest request) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException("Không tìm thấy đơn đặt bàn #" + reservationId));

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new AppException("Đơn đặt bàn này đã bị hủy, không thể chỉnh sửa món đặt trước!");
        }

        if (reservation.getStatus() == ReservationStatus.COMPLETED) {
            throw new AppException("Đơn đặt bàn này đã hoàn tất check-in, không thể chỉnh sửa món đặt trước!");
        }

        // Xóa danh sách món cũ (orphanRemoval = true sẽ xóa các row tương ứng trong CSDL)
        reservation.getItems().clear();

        // Thêm danh sách món mới theo chỉ định của Quản lý
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (ReservationItemRequest itemReq : request.getItems()) {
                if (itemReq.getMenuItemId() == null || itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                    continue;
                }
                MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                        .orElseThrow(() -> new AppException("Món ăn ID #" + itemReq.getMenuItemId() + " không tồn tại trong hệ thống!"));
                if (!menuItem.getIsActive()) {
                    throw new AppException("Món '" + menuItem.getName() + "' hiện không còn kinh doanh!");
                }
                if (!Boolean.TRUE.equals(menuItem.getIsAvailable()) ||
                        (menuItem.getRemainingStock() != null && menuItem.getRemainingStock() <= 0)) {
                    throw new AppException("Món '" + menuItem.getName() + "' hiện đã tạm ngưng phục vụ hoặc hết hàng, vui lòng chọn món khác!", HttpStatus.BAD_REQUEST);
                }
                BigDecimal unitPrice = menuItem.getPrice();
                BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));

                ReservationItem item = ReservationItem.builder()
                        .reservation(reservation)
                        .menuItem(menuItem)
                        .quantity(itemReq.getQuantity())
                        .unitPrice(unitPrice)
                        .subtotal(subtotal)
                        .note(itemReq.getNote() != null ? itemReq.getNote().trim() : null)
                        .build();
                reservation.getItems().add(item);
            }
        }

        Reservation saved = reservationRepository.save(reservation);

        // Gửi email tiếp nhận đơn đặt bàn tới khách hàng (nếu có email)
        if (saved.getCustomerEmail() != null && !saved.getCustomerEmail().trim().isEmpty()) {
            emailService.sendReservationCreatedEmail(saved);
        }

        return mapToResponse(saved);
    }

    // ===================================================================
    // 9. QUẢN LÝ XÁC NHẬN KHÁCH ĐẶT ĐÃ ĐẾN VÀ CHECK-IN (1-CLICK CHECK-IN)
    // ===================================================================
    @Override
    @Transactional
    public ReservationResponse checkInReservation(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException("Không tìm thấy đơn đặt bàn #" + reservationId));

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new AppException("Đơn đặt bàn này đã bị hủy, không thể check-in!");
        }

        if (reservation.getStatus() == ReservationStatus.COMPLETED) {
            throw new AppException("Đơn đặt bàn này đã hoàn tất check-in trước đó!");
        }

        if (reservation.getTable() == null) {
            throw new AppException("Đơn đặt bàn chưa được xếp bàn! Vui lòng xếp bàn trước khi check-in.");
        }

        RestaurantTable table = reservation.getTable();
        tableService.checkInReservationForTable(table.getId(), reservation.getId());

        Reservation refreshed = reservationRepository.findById(reservationId).orElse(reservation);
        return mapToResponse(refreshed);
    }

    // ===================================================================
    // HÀM HELPER CHUYỂN ĐỔI ENTITY SANG DTO RESPONSE
    // ===================================================================
    private ReservationResponse mapToResponse(Reservation r) {
        String statusLabel;
        switch (r.getStatus()) {
            case PENDING:
                statusLabel = "Chờ Quản lý gọi điện";
                break;
            case CONFIRMED:
                statusLabel = "Đã xếp bàn & Giữ chỗ";
                break;
            case COMPLETED:
                statusLabel = "Khách đã đến & Check-in";
                break;
            case CANCELLED:
                statusLabel = "Đã hủy đơn";
                break;
            default:
                statusLabel = r.getStatus().name();
        }

        String zoneName = null;
        if (r.getRequestedZone() != null && zoneRepository != null) {
            zoneName = zoneRepository.findByZoneCode(r.getRequestedZone())
                    .map(Zone::getName)
                    .orElse(null);
        }
        if (zoneName == null) {
            if ("ZONE_2".equals(r.getRequestedZone())) {
                zoneName = "Ban Công & Sân Vườn";
            } else if ("VIP".equals(r.getRequestedZone())) {
                zoneName = "Phòng VIP";
            } else if ("ZONE_1".equals(r.getRequestedZone())) {
                zoneName = "Sảnh Chính";
            } else {
                zoneName = r.getRequestedZone() != null ? r.getRequestedZone() : "Sảnh Chính";
            }
        }

        List<ReservationItemResponse> preOrderResponses = new ArrayList<>();
        BigDecimal preOrderTotal = BigDecimal.ZERO;
        int preOrderCount = 0;

        if (r.getItems() != null && !r.getItems().isEmpty()) {
            for (ReservationItem item : r.getItems()) {
                BigDecimal sub = item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO;
                preOrderTotal = preOrderTotal.add(sub);
                preOrderCount += (item.getQuantity() != null ? item.getQuantity() : 0);

                MenuItem m = item.getMenuItem();
                preOrderResponses.add(ReservationItemResponse.builder()
                        .id(item.getId())
                        .menuItemId(m != null ? m.getId() : null)
                        .menuItemName(m != null ? m.getName() : "Món không xác định")
                        .sku(m != null ? m.getSku() : null)
                        .imageUrl(m != null ? m.getImageUrl() : null)
                        .categoryName(m != null && m.getCategory() != null ? m.getCategory().getName() : null)
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .subtotal(sub)
                        .note(item.getNote())
                        .build());
            }
        }

        return ReservationResponse.builder()
                .id(r.getId())
                .bookingCode(r.getBookingCode())
                .tableId(r.getTable() != null ? r.getTable().getId() : null)
                .tableNumber(r.getTable() != null ? r.getTable().getTableNumber() : null)
                .tableName(r.getTable() != null ? r.getTable().getName() : null)
                .tableCapacity(r.getTable() != null ? r.getTable().getCapacity() : null)
                .requestedZone(r.getRequestedZone())
                .requestedZoneName(zoneName)
                .customerName(r.getCustomerName())
                .customerPhone(r.getCustomerPhone())
                .customerEmail(r.getCustomerEmail())
                .guestCount(r.getGuestCount())
                .reservationTime(r.getReservationTime())
                .formattedDate(r.getReservationTime().format(DATE_FORMATTER))
                .formattedTime(r.getReservationTime().format(TIME_FORMATTER))
                .status(r.getStatus())
                .statusLabel(statusLabel)
                .note(r.getNote())
                .cancelReason(r.getCancelReason())
                .preOrderItems(preOrderResponses)
                .preOrderTotal(preOrderTotal)
                .preOrderItemsCount(preOrderCount)
                .createdAt(r.getCreatedAt())
                .build();
    }

    // ===================================================================
    // 10. THỰC KHÁCH TRA CỨU TIẾN ĐỘ ĐƠN ĐẶT BÀN THEO MÃ ĐẶT CHỖ HOẶC SĐT
    // ===================================================================
    @Override
    @Transactional(readOnly = true)
    public ReservationResponse lookupReservation(String bookingCode, String phone) {
        if ((bookingCode == null || bookingCode.trim().isEmpty()) && (phone == null || phone.trim().isEmpty())) {
            throw new AppException("Vui lòng cung cấp Mã đặt chỗ hoặc Số điện thoại để tra cứu!", HttpStatus.BAD_REQUEST);
        }

        Optional<Reservation> resOpt = Optional.empty();
        if (bookingCode != null && !bookingCode.trim().isEmpty()) {
            resOpt = reservationRepository.findByBookingCode(bookingCode.trim().toUpperCase());
        }

        if (resOpt.isEmpty() && phone != null && !phone.trim().isEmpty()) {
            List<Reservation> byPhone = reservationRepository.findByCustomerPhoneOrderByReservationTimeDesc(phone.trim());
            if (!byPhone.isEmpty()) {
                resOpt = Optional.of(byPhone.get(0));
            }
        }

        Reservation res = resOpt.orElseThrow(() -> new AppException("Không tìm thấy thông tin đơn đặt bàn với thông tin cung cấp!", HttpStatus.NOT_FOUND));
        return mapToResponse(res);
    }

    // ===================================================================
    // HELPER: PHÂN GIẢI TÊN PHÂN KHU TỪ MÃ KHU VỰC
    // ===================================================================
    private String resolveZoneName(String zoneCode) {
        if (zoneCode == null) return "Khu vực tiêu chuẩn";
        return zoneRepository.findByZoneCode(zoneCode)
                .map(Zone::getName)
                .orElse(switch (zoneCode.trim().toUpperCase()) {
                    case "ZONE_1" -> "Tầng 1 - Sảnh Chính";
                    case "ZONE_2" -> "Tầng 2 - Ban Công";
                    case "VIP" -> "Phòng VIP";
                    default -> zoneCode;
                });
    }
}
