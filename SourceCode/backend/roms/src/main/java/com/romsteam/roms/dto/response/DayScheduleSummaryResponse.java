package com.romsteam.roms.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DayScheduleSummaryResponse {

    private LocalDate workDate;
    private List<StaffScheduleResponse> morningShift;
    private List<StaffScheduleResponse> eveningShift;
    private int totalMorning;
    private int totalEvening;
}
