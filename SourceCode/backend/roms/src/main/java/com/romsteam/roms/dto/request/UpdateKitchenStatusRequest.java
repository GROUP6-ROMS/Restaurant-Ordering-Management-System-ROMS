package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * DTO nhận yêu cầu đổi trạng thái món hoặc đơn hàng từ màn hình bếp
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateKitchenStatusRequest {

    // Trạng thái đích: COOKING, READY, CANCELLED
    @NotBlank(message = "Trạng thái mới không được để trống")
    private String status;
}
