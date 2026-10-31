package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePayOsPaymentRequest {

    @NotNull(message = "tableId không được để trống")
    private Long tableId;

    private String discountType; // "PERCENT" hoặc "AMOUNT"
    private BigDecimal discountValue;
    private BigDecimal taxRate; // Mặc định 8% nếu null
    private String note;
    private Boolean forceCheckout;
    private String managerPin;
}
