package com.romsteam.roms.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

/**
 * DTO nhận dữ liệu khi Nhân viên phục vụ (Waiter) gọi thêm món tại bàn ăn
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaiterAddOrderRequest {

    // Danh sách các món ăn gọi thêm trong đợt này (không được để trống)
    @NotEmpty(message = "Danh sách món gọi thêm không được để trống!")
    @Valid
    private List<WaiterOrderItemRequest> items;

    // Ghi chú chung của đợt gọi món (ví dụ: "Khách đang vội, ưu tiên làm sớm")
    private String note;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WaiterOrderItemRequest {

        // ID món ăn trong bảng menu_items
        @NotNull(message = "ID món ăn là bắt buộc!")
        private Long menuItemId;

        // Số lượng gọi thêm (tối thiểu là 1)
        @NotNull(message = "Số lượng không được để trống!")
        @Min(value = 1, message = "Số lượng gọi món phải từ 1 trở lên!")
        private Integer quantity;

        // Ghi chú chi tiết cho món (ví dụ: "Ít cay", "Không hành", "Ướp lạnh kèm đá")
        private String note;
    }
}
