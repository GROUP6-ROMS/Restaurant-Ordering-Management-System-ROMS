package com.romsteam.roms.dto.request;

import com.romsteam.roms.entity.enums.ShiftType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignShiftRequest {

    @NotNull(message = "ID nhân viên không được để trống")
    private Long staffId;

    @NotNull(message = "Ngày làm việc không được để trống")
    private LocalDate workDate;

    @NotNull(message = "Loại ca làm việc không được để trống")
    private ShiftType shiftType;
}
