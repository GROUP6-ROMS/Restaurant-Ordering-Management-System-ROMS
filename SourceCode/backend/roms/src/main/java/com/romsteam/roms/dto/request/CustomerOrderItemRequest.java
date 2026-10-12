package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerOrderItemRequest {
    @NotNull(message = "ID món ăn không được để trống")
    private Long menuItemId;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng món tối thiểu là 1")
    private Integer quantity;

    private String note;
}
