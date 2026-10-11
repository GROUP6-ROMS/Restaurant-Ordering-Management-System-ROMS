package com.romsteam.roms.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO chi tiết hóa đơn tạm tính của bàn phục vụ việc in Pre-bill và tính tiền
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashierBillPreviewResponse {

    private Long tableId;
    private String tableCode;
    private String tableName;
    private String zoneName;
    private Integer guestCount;
    private String timeIn;
    private Long durationMinutes;

    private Long sessionId;
    private String billCode;        // Dự kiến: "BILL-YYYYMMDD-XXXX"
    private BigDecimal subtotal;    // Tổng tiền món ăn (chỉ tính món không hủy)
    private BigDecimal taxRate;     // 8.0 (%)
    private BigDecimal taxAmount;   // subtotal * 0.08
    private BigDecimal discountAmount;
    private BigDecimal finalAmount; // subtotal + taxAmount - discountAmount

    private Integer unservedCount;      // Số món chưa hoàn thành (PENDING/COOKING)
    private Boolean hasPaymentRequest;  // Bàn đã có khách/phục vụ gửi yêu cầu thanh toán
    private Boolean isDraftPrinted;     // Đã từng in phiếu tạm tính

    private List<CashierBillItemDetail> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CashierBillItemDetail {
        private Long orderItemId;
        private String itemName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private String note;
        private String status;
    }
}
