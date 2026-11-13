package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CopyScheduleRequest {

    @NotNull(message = "Ngày nguồn không được để trống")
    private LocalDate fromDate;

    @NotNull(message = "Ngày đích không được để trống")
    private LocalDate toDate;
}
