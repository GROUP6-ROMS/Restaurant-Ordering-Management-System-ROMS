package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.Min;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OpenTableRequest {
    @Min(value = 1, message = "Số lượng khách tối thiểu là 1 người")
    private Integer guestCount;
    private String note;
}
