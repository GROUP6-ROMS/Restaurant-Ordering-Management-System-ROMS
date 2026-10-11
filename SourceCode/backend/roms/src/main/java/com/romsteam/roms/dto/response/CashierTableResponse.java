package com.romsteam.roms.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO trả về thông tin bàn ăn hiển thị trên lưới bàn của Thu ngân POS
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashierTableResponse {

    private Long id;
    private String code;            // Ví dụ: "T-01", "B-02", "VIP-01"
    private String name;            // Ví dụ: "Bàn 01", "Phòng VIP 01"
    private String zone;            // "ZONE_1", "ZONE_2", "VIP"
    private String zoneName;        // "Tầng 1 - Sảnh Chính"
    private Integer capacity;
    private Integer guestCount;

    // Trạng thái hiển thị POS: AVAILABLE, DINING, PAYMENT_REQUEST, DRAFT_PRINTED, DIRTY
    private String status;
    private String statusText;      // "Y/c Thanh Toán", "Đang ăn", "Đã in tạm tính"
    private String timeIn;          // "12:15"
    private Long durationMinutes;   // 35

    private Long sessionId;
    private String orderCode;       // "ORD-T01-8842"
    private BigDecimal orderTotal;  // Tổng tiền tạm tính trước thuế & chiết khấu
    private Integer totalItemsCount;
    private Boolean isCallingBill;  // true nếu Waiter vừa bấm chuông yêu cầu tính tiền
    private Long serviceRequestId;

    // Danh sách món ăn chi tiết đang phục vụ tại bàn
    private List<CashierOrderItemDTO> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CashierOrderItemDTO {
        private Long orderItemId;
        private String name;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private String status;      // COOKING, READY, SERVED
        private String note;
    }
}
