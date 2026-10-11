package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO nhận dữ liệu khi Thu ngân bấm "Thanh toán & In hóa đơn"
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashierCheckoutRequest {

    // Phương thức thanh toán: CASH, BANK_TRANSFER, CARD
    @NotNull(message = "Phương thức thanh toán là bắt buộc!")
    private String paymentMethod;

    // Loại giảm giá: NONE, PERCENT, AMOUNT
    @Builder.Default
    private String discountType = "NONE";

    // Giá trị giảm giá: số % (ví dụ 10) hoặc số tiền VNĐ (ví dụ 50000)
    @Builder.Default
    private BigDecimal discountValue = BigDecimal.ZERO;

    // Thuế VAT (mặc định 8%)
    @Builder.Default
    private BigDecimal taxRate = BigDecimal.valueOf(8.0);

    // Tiền khách đưa khi thanh toán tiền mặt (CASH)
    private BigDecimal cashGiven;

    // Cho phép chốt thanh toán khi còn món đang nấu hoặc bàn chưa bấm yêu cầu
    private Boolean forceCheckout;

    // Mã PIN Quản lý (khi có giảm giá lớn > 30% hoặc > 200.000đ)
    private String managerPin;

    // Ghi chú của thu ngân (Ví dụ: "Khách VIP thẻ vàng", "Tiền thừa bo lại")
    private String note;
}
