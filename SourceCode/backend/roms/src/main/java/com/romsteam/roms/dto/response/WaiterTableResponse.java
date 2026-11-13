package com.romsteam.roms.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

/**
 * DTO dữ liệu bàn chi tiết trả về cho màn hình Waiter Floor Plan Terminal
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaiterTableResponse {
    private Long id;
    private String tableNumber;     // "01", "T-01"
    private String name;            // "Bàn 01", "Sen Vàng"
    private String zone;            // "ZONE_1", "ZONE_2", "VIP"
    private String zoneName;        // "Tầng 1 - Sảnh Chính"
    private Integer capacity;       // Sức chứa (ghế)
    private Integer actualGuests;   // Số khách thực tế đang ngồi
    private String status;          // "AVAILABLE", "OCCUPIED", "CALLING", "FOOD_READY", "AWAITING_PAYMENT", "DIRTY", "RESERVED"
    private String statusNote;      // Ghi chú trạng thái nhanh (VD: "Đang ăn & chờ phở áp chảo")
    private String duration;        // Thời gian đã ngồi (VD: "45 phút")
    private Long durationMinutes;   // Số phút đã ngồi (để sắp xếp cảnh báo)
    private BigDecimal orderTotal;  // Tổng tiền tạm tính hiện tại
    private String reservationInfo; // Thông tin khách đặt trước (Tên + SĐT)
    private String reservedTime;    // Thời gian đặt hẹn (VD: "19:30")
    private String blockedReason;   // Lý do khóa bàn / bảo trì
    private String qrToken;         // Mã token định danh QR Order của bàn

    // Cờ chuông gọi hỗ trợ khẩn
    private Boolean calling;
    private String callNote;        // VD: "Yêu cầu thêm đá lạnh & đũa muỗng"
    private String callTime;        // VD: "2 phút trước"
    private Long activeRequestId;   // ID của chuông gọi để bấm xử lý

    // Thống kê tiến độ món ăn
    private Integer totalItems;
    private Integer readyItems;     // Số món bếp đã nấu xong chờ bưng
    private Integer cookingItems;   // Số món bếp đang nấu
    private Integer servedItems;    // Số món đã lên bàn

    // Danh sách món tóm tắt hiển thị trên Drawer
    private List<WaiterOrderItemDTO> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WaiterOrderItemDTO {
        private Long orderItemId;
        private String name;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private String status;      // "COOKING", "READY", "SERVED", "WAITER_PENDING"
        private String note;
    }
}
