package com.romsteam.roms.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerCallServiceRequest {
    private Long tableId;
    private String tableNumber;
    private String requestType; // CALL_WAITER, CALL_WATER, REQUEST_BILL, REQUEST_CLEAN
    private String note;
}
