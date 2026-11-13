package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.CustomerCallWaiterRequest;
import com.romsteam.roms.dto.response.AdminNotificationItemResponse;
import com.romsteam.roms.dto.response.AdminNotificationSummaryResponse;
import com.romsteam.roms.entity.Reservation;
import com.romsteam.roms.entity.RestaurantTable;
import com.romsteam.roms.entity.ServiceRequest;
import com.romsteam.roms.entity.Zone;
import com.romsteam.roms.entity.enums.ReservationStatus;
import com.romsteam.roms.entity.enums.TableStatus;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.exception.ResourceNotFoundException;
import com.romsteam.roms.repository.ReservationRepository;
import com.romsteam.roms.repository.RestaurantTableRepository;
import com.romsteam.roms.repository.ServiceRequestRepository;
import com.romsteam.roms.repository.ZoneRepository;
import com.romsteam.roms.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final ServiceRequestRepository requestRepository;
    private final ReservationRepository reservationRepository;
    private final RestaurantTableRepository tableRepository;
    private final ZoneRepository zoneRepository;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE_TIME_FMT = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    @Override
    @Transactional(readOnly = true)
    public AdminNotificationSummaryResponse getAdminNotifications() {
        // 1. Lấy tất cả các yêu cầu hỗ trợ tại bàn đang PENDING
        List<ServiceRequest> pendingRequests = requestRepository.findByStatusOrderByCreatedAtDesc("PENDING");
        List<AdminNotificationItemResponse> assistanceItems = pendingRequests.stream()
                .map(this::mapServiceRequestToNotification)
                .collect(Collectors.toList());

        // 2. Lấy tất cả các đơn đặt bàn trực tuyến đang PENDING (chờ duyệt & xếp bàn)
        List<Reservation> pendingReservations = reservationRepository.findByStatusOrderByReservationTimeAsc(ReservationStatus.PENDING);
        List<AdminNotificationItemResponse> reservationItems = pendingReservations.stream()
                .map(this::mapReservationToNotification)
                .collect(Collectors.toList());

        // 3. Ghép toàn bộ và sắp xếp mới nhất lên đầu
        List<AdminNotificationItemResponse> allItems = new ArrayList<>();
        allItems.addAll(assistanceItems);
        allItems.addAll(reservationItems);
        allItems.sort(Comparator.comparing(
                AdminNotificationItemResponse::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())
        ));

        return AdminNotificationSummaryResponse.builder()
                .totalCount(allItems.size())
                .assistanceCount(assistanceItems.size())
                .reservationCount(reservationItems.size())
                .items(allItems)
                .assistanceItems(assistanceItems)
                .reservationItems(reservationItems)
                .build();
    }

    @Override
    @Transactional
    public void resolveAssistanceRequest(Long requestId) {
        ServiceRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu hỗ trợ không tồn tại #" + requestId));
        req.setStatus("RESOLVED");
        requestRepository.save(req);
        log.info("Quản lý đã giải quyết yêu cầu hỗ trợ #{} của bàn {}", requestId, req.getTable().getTableNumber());
    }

    @Override
    @Transactional
    public AdminNotificationItemResponse createCustomerAssistanceRequest(Long tableId, CustomerCallWaiterRequest request) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn ăn #" + tableId));

        String note = (request != null && request.getNote() != null && !request.getNote().trim().isEmpty())
                ? request.getNote().trim()
                : "Khách gọi nhân viên hỗ trợ";

        String reqType = (request != null && request.getRequestType() != null)
                ? request.getRequestType()
                : "CALL_WAITER";

        ServiceRequest serviceRequest = ServiceRequest.builder()
                .table(table)
                .requestType(reqType)
                .note(note)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        ServiceRequest saved = requestRepository.save(serviceRequest);
        log.info("Khách tại bàn {} đã bấm chuông gọi phục vụ: {}", table.getTableNumber(), note);
        return mapServiceRequestToNotification(saved);
    }

    @Override
    @Transactional
    public AdminNotificationItemResponse createTestAssistanceRequest(Long tableId, String note) {
        RestaurantTable table;
        if (tableId != null) {
            table = tableRepository.findById(tableId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn ăn #" + tableId));
        } else {
            // Lấy bàn đầu tiên đang hoạt động
            List<RestaurantTable> allTables = tableRepository.findAll();
            if (allTables.isEmpty()) {
                throw new AppException("Chưa có bàn ăn nào trong hệ thống!", HttpStatus.BAD_REQUEST);
            }
            table = allTables.get(0);
        }

        String msg = (note != null && !note.trim().isEmpty())
                ? note.trim()
                : "Khách tại bàn yêu cầu nhân viên hỗ trợ thêm nước và đá";

        ServiceRequest testReq = ServiceRequest.builder()
                .table(table)
                .requestType("CALL_WAITER")
                .note(msg)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        ServiceRequest saved = requestRepository.save(testReq);
        log.info("Đã tạo yêu cầu hỗ trợ thử nghiệm cho bàn {}", table.getTableNumber());
        return mapServiceRequestToNotification(saved);
    }

    // ===================================================================
    // HELPER MAPPERS
    // ===================================================================

    private AdminNotificationItemResponse mapServiceRequestToNotification(ServiceRequest req) {
        RestaurantTable t = req.getTable();
        String zoneName = resolveZoneName(t.getZone());
        LocalDateTime created = req.getCreatedAt() != null ? req.getCreatedAt() : LocalDateTime.now();

        return AdminNotificationItemResponse.builder()
                .id("REQ-" + req.getId())
                .sourceId(req.getId())
                .notificationType("TABLE_ASSISTANCE")
                .title("Bàn " + t.getTableNumber() + " cần hỗ trợ")
                .message(req.getNote() != null ? req.getNote() : "Khách yêu cầu hỗ trợ tại bàn")
                .tableId(t.getId())
                .tableNumber(t.getTableNumber())
                .tableName(t.getName())
                .zone(t.getZone())
                .zoneName(zoneName)
                .createdAt(created)
                .createdAtFormatted(created.format(DATE_TIME_FMT))
                .timeAgo(formatTimeAgo(created))
                .status(req.getStatus())
                .build();
    }

    private AdminNotificationItemResponse mapReservationToNotification(Reservation res) {
        LocalDateTime created = res.getCreatedAt() != null ? res.getCreatedAt() : LocalDateTime.now();
        String zoneName = resolveZoneName(res.getRequestedZone());
        String resTimeStr = res.getReservationTime() != null ? res.getReservationTime().format(DATE_TIME_FMT) : "Chưa xác định";

        String message = String.format("%d khách • Hẹn %s • %s%s",
                res.getGuestCount() != null ? res.getGuestCount() : 2,
                res.getReservationTime() != null ? res.getReservationTime().format(TIME_FMT) : "Hôm nay",
                zoneName,
                (res.getNote() != null && !res.getNote().isEmpty()) ? " • Ghi chú: " + res.getNote() : ""
        );

        return AdminNotificationItemResponse.builder()
                .id("RES-" + res.getId())
                .sourceId(res.getId())
                .notificationType("NEW_RESERVATION")
                .title("Đơn đặt bàn mới: " + res.getCustomerName())
                .message(message)
                .reservationId(res.getId())
                .bookingCode(res.getBookingCode())
                .customerName(res.getCustomerName())
                .customerPhone(res.getCustomerPhone())
                .guestCount(res.getGuestCount())
                .requestedZone(res.getRequestedZone())
                .requestedZoneName(zoneName)
                .reservationTime(resTimeStr)
                .createdAt(created)
                .createdAtFormatted(created.format(DATE_TIME_FMT))
                .timeAgo(formatTimeAgo(created))
                .status(res.getStatus() != null ? res.getStatus().name() : "PENDING")
                .build();
    }

    private String resolveZoneName(String zoneCode) {
        if (zoneCode == null || zoneCode.trim().isEmpty()) {
            return "Khu vực chung";
        }
        return zoneRepository.findByZoneCode(zoneCode)
                .map(Zone::getName)
                .orElseGet(() -> {
                    if ("ZONE_1".equalsIgnoreCase(zoneCode)) return "Sảnh Chính";
                    if ("ZONE_2".equalsIgnoreCase(zoneCode)) return "Ban Công & Sân Vườn";
                    if ("VIP".equalsIgnoreCase(zoneCode)) return "Phòng VIP";
                    return zoneCode;
                });
    }

    private String formatTimeAgo(LocalDateTime time) {
        if (time == null) return "Vừa xong";
        Duration duration = Duration.between(time, LocalDateTime.now());
        long seconds = Math.max(0, duration.getSeconds());
        if (seconds < 60) {
            return "Vừa xong";
        }
        long minutes = seconds / 60;
        if (minutes < 60) {
            return minutes + " phút trước";
        }
        long hours = minutes / 60;
        if (hours < 24) {
            return hours + " giờ trước";
        }
        long days = hours / 24;
        if (days < 7) {
            return days + " ngày trước";
        }
        return time.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }
}
