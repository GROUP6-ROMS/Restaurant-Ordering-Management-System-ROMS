package com.romsteam.roms.dto.response;

import com.romsteam.roms.entity.enums.ReservationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO trả về thông tin chi tiết của một phiếu đặt bàn
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

    // Danh sách các món ăn thực khách đặt trước (hoặc Quản lý đã chỉnh sửa)
    private List<ReservationItemResponse> preOrderItems;

    // Tổng tiền dự kiến của các món đặt trước
    private BigDecimal preOrderTotal;

    // Tổng số lượng phần món ăn đặt trước
    private Integer preOrderItemsCount;

    // Thời gian tạo
    private LocalDateTime createdAt;
}
