package com.romsteam.roms.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO hiển thị danh sách hóa đơn lịch sử và chi tiết in lại hóa đơn (Reprint)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashierInvoiceResponse {

    private Long id;
    private String billCode;        // "BILL-20261010-0012"
    private String tableName;       // "Bàn 01"
    private String zoneName;        // "Tầng 1 - Sảnh chính"
    private String cashierName;     // "Hoàng Hải Yến (#CSH-001)"
    private String shiftName;       // "Ca Sáng" / "Ca Tối"
    private LocalDateTime paymentTime;
    private String paymentTimeFormatted; // "12:45 10/10/2026"

    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;

    private String paymentMethod;   // "CASH", "BANK_TRANSFER", "CARD"
    private String paymentMethodLabel; // "Tiền mặt", "VietQR Chuyển khoản", "Thẻ POS"
    private String status;          // "PAID", "CANCELLED"
    private String statusLabel;     // "Đã thanh toán"
    private String note;

    private Boolean isReprint;      // Đánh dấu đây là bản in lại (Reprint)
    private String reprintNotice;   // Thông điệp in lại cảnh báo

    private Integer itemsCount;
    private String itemsSummary;    // "Phở Bò x2, Nem Rán, Trà Đào..."
    private List<InvoiceItemDTO> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvoiceItemDTO {
        private String name;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
    }
}
