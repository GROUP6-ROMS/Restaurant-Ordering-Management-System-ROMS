package com.romsteam.roms.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffSummaryResponse {

    private long totalStaff;
    private long onlineStaff;
    private long waiterCount;
    private long kitchenCount;
    private long cashierCount;
    private long managerCount;
}
