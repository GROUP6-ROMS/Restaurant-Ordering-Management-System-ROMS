package com.romsteam.roms.dto.response;

import com.romsteam.roms.entity.enums.ReservationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO trả về thông tin chi tiết của một phiếu đặt bà   n
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponse {

    // Khóa chính
    private Long id;

    // Mã đặt chỗ hiển thị (Ví dụ: "RES-20261009-8821")
    private String bookingCode;

    // Thông tin bàn ăn đã được xếp (nếu có)
    private Long tableId;
    private String tableNumber;
    private String tableName;
    private Integer tableCapacity;

    // Phân khu khách mong muốn
    private String requestedZone;
    private String requestedZoneName;

    // Thông tin liên hệ của khách hàng
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private Integer guestCount;

    // Ngày và giờ hẹn đến
    private LocalDateTime reservationTime;
    private String formattedDate;
    private String formattedTime;

    // Trạng thái phiếu đặt: PENDING, CONFIRMED, COMPLETED, CANCELLED
    private ReservationStatus status;
    private String statusLabel;

    // Ghi chú của khách & Lý do hủy
    private String note;
    private String cancelReason;

    // Thời gian tạo
    private LocalDateTime createdAt;
}
