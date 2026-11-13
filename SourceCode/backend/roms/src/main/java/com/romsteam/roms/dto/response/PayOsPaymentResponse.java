package com.romsteam.roms.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayOsPaymentResponse {
    private Long orderCode;
    private BigDecimal amount;
    private String description;
    private String qrCode;
    private String checkoutUrl;
    private String paymentLinkId;
    private String status;
    private String accountNumber;
    private String accountName;
    private String bankName;
    private String bankBin;
    private String billCode;
    private Long tableId;
    private String tableNumber;
}
