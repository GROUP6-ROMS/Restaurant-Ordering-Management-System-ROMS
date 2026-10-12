package com.romsteam.roms.dto.response;

import com.romsteam.roms.entity.enums.ShiftType;
import com.romsteam.roms.entity.enums.UserRole;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffScheduleResponse {

    private Long id;
    private Long staffId;
    private String username;
    private String fullName;
    private String phone;
    private UserRole role;
    private String roleLabel;
    private Boolean isOnShift;
    private LocalDate workDate;
    private ShiftType shiftType;
    private String shiftLabel;
    private LocalTime startTime;
    private LocalTime endTime;
}
