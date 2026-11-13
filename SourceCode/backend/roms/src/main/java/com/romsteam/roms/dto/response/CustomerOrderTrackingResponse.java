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
public class CustomerOrderTrackingResponse {
    private Long tableId;
    private String tableNumber;
    private String tableName;
    private Long sessionId;
    private String sessionToken;
    private String tableStatus;
    private Integer guestCount;
    private LocalDateTime startTime;
    private String startTimeFormatted;
    private Boolean hasActiveSession;
    private BigDecimal totalAmount;
    private BigDecimal vatAmount;
    private BigDecimal grandTotal;
    private Integer totalItems;
    private Integer servedItems;
    private Integer cookingItems;
    private Integer readyItems;
    private Integer pendingItems;
    private List<CustomerBatchResponse> batches;
}
