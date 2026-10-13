package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO đại diện cho một món ăn đặt trước trong đơn đặt bàn
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationItemRequest {

    // ID món ăn trong thực đơn (menu_item_id)
    @NotNull(message = "ID món ăn không được để trống")
    private Long menuItemId;

    // Số lượng đặt (tối thiểu 1 phần)
    @NotNull(message = "Số lượng món không được để trống")
    @Min(value = 1, message = "Số lượng món tối thiểu là 1 phần")
    private Integer quantity;

    // Ghi chú riêng cho món (ví dụ: "Ít cay", "Ăn trước", v.v.)
    private String note;
}
