package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.AssignTableReservationRequest;
import com.romsteam.roms.dto.request.CancelReservationRequest;
import com.romsteam.roms.dto.request.CreateReservationRequest;
import com.romsteam.roms.dto.response.ReservationResponse;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.dto.response.ZoneResponse;
import com.romsteam.roms.entity.Reservation;
import com.romsteam.roms.entity.RestaurantTable;
import com.romsteam.roms.entity.enums.ReservationStatus;
import com.romsteam.roms.entity.enums.TableStatus;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.repository.ReservationRepository;
import com.romsteam.roms.repository.RestaurantTableRepository;
import com.romsteam.roms.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
                .build();

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
                    desc = "Cách âm tuyệt đối, nội thất hoàng gia, thích hợp tiếp khách đối tác và tiệc gia đình thân mật.";
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

        // Lấy các bàn AVAILABLE, ưu tiên đúng zone và sức chứa >= guestCount
        List<RestaurantTable> tables = tableRepository.findAvailableTablesForReservation(
                res.getRequestedZone(),
                res.getGuestCount()
        );

        // Nếu khu vực khách chọn không còn bàn trống, trả về toàn bộ bàn AVAILABLE còn lại để Quản lý linh hoạt tư vấn đổi khu vực
        if (tables.isEmpty()) {
            tables = tableRepository.findAvailableTablesForReservation(null, res.getGuestCount());
        }

        return tables.stream().map(t -> TableResponse.builder()
                .id(t.getId())
                .code(t.getTableNumber())
                .tableNumber(t.getTableNumber())
                .name(t.getName())
                .zone(t.getZone())
                .capacity(t.getCapacity())
                .status(t.getStatus())
                .isActive(t.getIsActive())
                .build()
        ).collect(Collectors.toList());
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
                .createdAt(r.getCreatedAt())
                .build();
    }
}
