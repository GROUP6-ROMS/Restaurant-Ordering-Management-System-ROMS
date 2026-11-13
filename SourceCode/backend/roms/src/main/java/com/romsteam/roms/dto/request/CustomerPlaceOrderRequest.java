package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerPlaceOrderRequest {
    private Long tableId;
    private String tableNumber;
    private Integer guestCount;
    private String orderNote;

    @NotNull(message = "Danh sách món không được để trống")
    @NotEmpty(message = "Vui lòng chọn ít nhất 1 món ăn")
    private List<CustomerOrderItemRequest> items;
}
