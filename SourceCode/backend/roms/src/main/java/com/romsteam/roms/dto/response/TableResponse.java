package com.romsteam.roms.dto.response;

import com.romsteam.roms.entity.enums.TableStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableResponse {

    private Long id;
    private String code;          // Mã bàn (tableNumber)
    private String tableNumber;   // Mã bàn (alias)
    private String name;          // Tên bàn hiển thị
    private String zone;          // ZONE_1, ZONE_2, VIP
    private String zoneName;      // Tầng 1 - Sảnh Chính, Tầng 2 - Ban Công, Phòng VIP
    private Integer capacity;     // Sức chứa tối đa
    private TableStatus status;   // AVAILABLE, OCCUPIED, DIRTY, RESERVED, BLOCKED
    private String statusText;    // Văn bản tiếng Việt: Đang Phục Vụ, Bàn Trống, Đã Đặt...

    // Thông tin vận hành thời gian thực (nếu đang OCCUPIED)
    private Integer guests;           // Số khách thực tế đang ngồi
    private BigDecimal currentBill;   // Hóa đơn hiện tại (VND)
    private String timeIn;            // Thời gian vào ngồi (ví dụ: "18:45")
    private Long durationMinutes;     // Số phút đã ngồi dùng bữa
    private Long activeSessionId;     // ID phiên ăn đang diễn ra

    // Thông tin nếu bàn Đã Đặt hoặc Khóa
    private String reservationInfo;
    private String reservedTime;
    private String blockedReason;

    // ===================================================================
    // Khóa An Toàn Cho Bàn Đặt Trước (Buffer Time Lock)
    // ===================================================================
    private Boolean isBufferLocked;                  // true nếu bàn đang trong khung thời gian khóa an toàn
    private Long bufferLockMinutesRemaining;         // Số phút còn lại đến giờ khách hẹn (âm nếu đã quá giờ)
    private String bufferLockTargetTime;             // "19:30 (14/10)"
    private String bufferLockCustomer;               // "Anh Hoàng (0909123456) - 4 khách"
    private Long bufferLockReservationId;            // ID đơn đặt bàn
    private String bufferLockBookingCode;            // Mã đặt bàn (RES-20261014-...)
    private Integer bufferLockPreOrderCount;         // Số lượng món ăn khách đã đặt trước
    private Integer bufferLockGuestCount;            // Số lượng khách đặt

    // Thông tin chuông gọi phục vụ / yêu cầu thanh toán PENDING (nếu có)
    private Long pendingServiceRequestId;
    private String pendingServiceRequestType;        // "CALL_WAITER", "BILL", "REQUEST_ICE", etc.
    private String pendingServiceRequestNote;        // Ghi chú yêu cầu của khách
    private String pendingServiceRequestCreatedAt;   // Giờ tạo yêu cầu "19:05"
    private Long pendingServiceRequestElapsedMinutes;// Số phút đã trôi qua kể từ khi khách bấm chuông
    private Integer pendingServiceRequestCount;      // Tổng số yêu cầu đang chờ xử lý của bàn

    // Mã QR Code dán tại bàn
    private String qrToken;
    private String qrUrl;         // Link ảnh hoặc link điều hướng quét QR

    private Boolean isActive;
    private LocalDateTime updatedAt;
}
