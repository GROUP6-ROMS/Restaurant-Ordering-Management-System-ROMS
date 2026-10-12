package com.romsteam.roms.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerBatchResponse {
    private Long orderId;
    private String orderCode;
    private String orderTimeFormatted;
    private LocalDateTime orderTime;
    private String status;
    private String note;
    private BigDecimal totalAmount;
    private List<CustomerItemTrackingResponse> items;
}
