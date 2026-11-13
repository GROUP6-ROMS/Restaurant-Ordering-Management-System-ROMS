package com.romsteam.roms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO đại diện cho một bản ghi hóa đơn trong Sổ Kế Toán Bán Hàng Chi Tiết
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceAuditDetailResponse {

    // ID hóa đơn
    private Long id;

    // Mã hóa đơn (Ví dụ: "BILL-20261019-1024")
    private String billCode;

    // Thời điểm thanh toán (định dạng "HH:mm dd/MM/yyyy")
    private String paymentTime;

    // Tên bàn ăn (Ví dụ: "Bàn 06")
    private String tableName;

    // Khu vực (Ví dụ: "Tầng 1 - Sảnh Chính")
    private String zoneName;

    // Thu ngân thực hiện thu tiền
    private String cashierName;

    // Tiền hàng trước thuế & giảm giá (VND)
    private BigDecimal subtotal;

    // Tiền giảm giá (VND)
    private BigDecimal discountAmount;

    // Tiền thuế VAT (VND)
    private BigDecimal taxAmount;

    // Tiền thanh toán thực tế cuối cùng (VND)
    private BigDecimal finalAmount;

    // Phương thức thanh toán ("CASH", "BANK_TRANSFER", "CARD")
    private String paymentMethod;

    // Nhãn phương thức tiếng Việt ("Tiền mặt", "VietQR", "Thẻ")
    private String paymentMethodLabel;

    // Số lượng món ăn trong hóa đơn
    private Integer itemsCount;

    // Ghi chú hóa đơn
    private String note;
}
