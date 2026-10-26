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
import com.romsteam.roms.entity.enums.ReservationStatus;
import com.romsteam.roms.entity.enums.TableStatus;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.repository.MenuItemRepository;
import com.romsteam.roms.repository.ReservationRepository;
import com.romsteam.roms.repository.RestaurantTableRepository;
import com.romsteam.roms.service.ReservationService;
import com.romsteam.roms.service.RestaurantTableService;
import lombok.RequiredArgsConstructor;
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
            for (ReservationItemRequest itemReq : request.getPreOrderItems()) {
                if (itemReq.getMenuItemId() == null || itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                    continue;
                }
                MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                        .orElseThrow(() -> new AppException("Món ăn ID #" + itemReq.getMenuItemId() + " không tồn tại trong hệ thống!"));
                if (!menuItem.getIsActive()) {
                    throw new AppException("Món '" + menuItem.getName() + "' hiện không còn kinh doanh!");
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
        return mapToResponse(saved);
    }

    // ===================================================================
    // 2. LẤY DANH SÁCH PHÂN KHU ĐỘNG TỪ DATABASE
    // ===================================================================
    @Override
    @Transactional(readOnly = true)
    public List<ZoneResponse> getActiveZones() {
        // Lấy danh sách các zone có bàn đang hoạt động
        List<String> distinctZones = tableRepository.findDistinctActiveZones();
        if (distinctZones.isEmpty()) {
            distinctZones = Arrays.asList("ZONE_1", "ZONE_2", "VIP");
        }

        List<ZoneResponse> results = new ArrayList<>();
        for (String zoneCode : distinctZones) {
            long total = tableRepository.countByZoneAndIsActiveTrue(zoneCode);
            long available = tableRepository.findByZoneAndStatusAndIsActiveTrue(zoneCode, TableStatus.AVAILABLE).size();

            // Định nghĩa tên hiển thị và mô tả theo từng phân khu
            String zoneName;
            String desc;
            String badge;

            switch (zoneCode) {
                case "ZONE_2":
                    zoneName = "Ban Công & Sân Vườn - Tầng 2";
                    desc = "Tầm nhìn thoáng đãng nhìn ra phố cổ, gió trời tự nhiên lãng mạn cho cặp đôi và nhóm bạn.";
                    badge = "View đẹp";
                    break;
                case "VIP":
                    zoneName = "Phòng Riêng VIP Sang Trọng";
                    desc = "Cách âm tốt, không gian riêng tư ấm cúng, thích hợp họp mặt đối tác, liên hoan và tiệc gia đình thân mật.";
                    badge = "Riêng tư";
                    break;
                case "ZONE_1":
                default:
                    zoneName = "Sảnh Chính - Tầng 1";
                    desc = "Không gian ấm cúng, thiết kế hiện đại với dàn đèn nghệ thuật và âm nhạc du dương.";
                    badge = "Phổ biến";
                    break;
            }

            results.add(ZoneResponse.builder()
                    .zoneCode(zoneCode)
                    .zoneName(zoneName)
                    .description(desc)
                    .badge(badge)
                    .totalTables(total)
                    .availableTables(available)
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

        // Lấy toàn bộ các bàn đang trống (AVAILABLE) đang hoạt động trong nhà hàng
        List<RestaurantTable> tables = tableRepository.findByStatusAndIsActiveTrue(TableStatus.AVAILABLE);

        final String reqZone = res.getRequestedZone();
        final int guests = res.getGuestCount() != null ? res.getGuestCount() : 1;

        // Ưu tiên sắp xếp:
        // 1. Các bàn thuộc đúng phân khu khách yêu cầu lên đầu
        // 2. Bàn có sức chứa phù hợp (capacity >= số khách)
        // 3. Sắp xếp tự nhiên theo số bàn (tableNumber)
        tables.sort((t1, t2) -> {
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

        return tables.stream().map(t -> {
            String zName = "Sảnh Chính";
            if ("ZONE_2".equals(t.getZone())) zName = "Ban Công";
            else if ("VIP".equals(t.getZone())) zName = "Phòng VIP";

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

        if (table.getStatus() != TableStatus.AVAILABLE) {
            throw new AppException("Bàn " + table.getTableNumber() + " hiện không ở trạng thái trống (Đang là " + table.getStatus() + ")!");
        }

        // 1. Cập nhật thông tin phiếu đặt
        reservation.setTable(table);
        reservation.setStatus(ReservationStatus.CONFIRMED);

        // 2. Cập nhật thông tin bàn ăn thành RESERVED
        table.setStatus(TableStatus.RESERVED);
        table.setReservationInfo("Khách: " + reservation.getCustomerName() + " (" + reservation.getCustomerPhone() + ")");
        table.setReservedTime(reservation.getReservationTime().format(TIME_FORMATTER) + " ngày " + reservation.getReservationTime().format(DATE_FORMATTER));

        tableRepository.save(table);
        Reservation updated = reservationRepository.save(reservation);

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
            if (table.getStatus() == TableStatus.RESERVED) {
                table.setStatus(TableStatus.AVAILABLE);
                table.setReservationInfo(null);
                table.setReservedTime(null);
                tableRepository.save(table);
            }
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelReason(request.getCancelReason());

        Reservation saved = reservationRepository.save(reservation);
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

        String zoneName;
        if ("ZONE_2".equals(r.getRequestedZone())) {
            zoneName = "Ban Công & Sân Vườn";
        } else if ("VIP".equals(r.getRequestedZone())) {
            zoneName = "Phòng VIP";
        } else {
            zoneName = "Sảnh Chính";
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
}
