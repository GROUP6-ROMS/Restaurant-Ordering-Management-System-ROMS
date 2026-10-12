package com.romsteam.roms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO đại diện cho một thông báo gửi tới Quản lý nhà hàng
 * Phân loại:
 * - TABLE_ASSISTANCE: Khách tại bàn bấm chuông cần nhân viên hỗ trợ
 * - NEW_RESERVATION: Thực khách đặt bàn trực tuyến mới cần Quản lý xác nhận & xếp bàn
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminNotificationItemResponse {

    // Khóa định danh của thông báo (ví dụ: "REQ-12" hoặc "RES-5")
    private String id;

    // ID nguyên bản trong CSDL
    private Long sourceId;

    // Loại thông báo: "TABLE_ASSISTANCE" | "NEW_RESERVATION"
    private String notificationType;

    // Tiêu đề ngắn gọn hiển thị trên thông báo
    private String title;

    // Nội dung chi tiết của thông báo
    private String message;

    // Thông tin bàn ăn (nếu là thông báo bàn gọi hỗ trợ)
    private Long tableId;
    private String tableNumber;
    private String tableName;
    private String zone;
    private String zoneName;

    // Thông tin đặt bàn (nếu là thông báo đặt bàn trực tuyến)
    private Long reservationId;
    private String bookingCode;
    private String customerName;
    private String customerPhone;
    private Integer guestCount;
    private String requestedZone;
    private String requestedZoneName;
    private String reservationTime;

    // Thời gian phát sinh thông báo
    private LocalDateTime createdAt;
    private String createdAtFormatted;
    private String timeAgo;

    // Trạng thái: "PENDING"
    private String status;
}
