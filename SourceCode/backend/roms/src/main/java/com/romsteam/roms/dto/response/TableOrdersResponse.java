package com.romsteam.roms.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableOrdersResponse {
    private Long tableId;
    private String tableNumber;
    private String tableName;
    private String zoneName;

    // Thông tin phiên ăn
    private Long sessionId;
    private String sessionToken;
    private Integer guestCount;
    private String timeIn;        // Giờ vào: "18:30"
    private Long durationMinutes; // Đã ngồi bao nhiêu phút

    // Thống kê món
    private Integer totalItems;
    private Integer pendingItems; // Chờ làm
    private Integer cookingItems; // Đang nấu
    private Integer readyItems;   // Đã xong chờ mang ra
    private Integer servedItems;  // Đã lên bàn

    private BigDecimal totalAmount; // Tổng tiền tạm tính

    // Danh sách các món chi tiết
    private List<OrderItemDetail> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemDetail {
        private Long orderItemId;
        private String orderCode;       // Thuộc đợt gọi nào (Đợt 1, Đợt 2)
        private String itemName;        // Tên món (Bò nướng, Trà đào...)
        private String imageUrl;
        private Integer quantity;       // Số lượng
        private BigDecimal unitPrice;   // Đơn giá
        private BigDecimal subtotal;    // Thành tiền
        private String note;            // Ghi chú ("Ít đá", "Không hành")
        private String status;          // PENDING, COOKING, READY, SERVED, CANCELLED
        private String statusText;      // Tiếng Việt hiển thị
    }
}