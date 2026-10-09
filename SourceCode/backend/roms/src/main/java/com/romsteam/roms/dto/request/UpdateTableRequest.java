package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTableRequest {

    // Mã bàn cập nhật (ví dụ: "T-01", "VIP-02") - Bắt buộc
    @NotBlank(message = "Mã bàn không được để trống")
    private String tableNumber;

    // Tên bàn hiển thị (ví dụ: "Bàn T-01", "Phòng Hoàng Gia")
    private String name;

    // Khu vực: "ZONE_1" (Sảnh chính), "ZONE_2" (Ban công), "VIP" (Phòng VIP)
    @NotBlank(message = "Khu vực không được để trống")
    private String zone;

    // Sức chứa số ghế ngồi (từ 1 đến 50 người)
    @NotNull(message = "Sức chứa không được để trống")
    @Min(value = 1, message = "Sức chứa tối thiểu từ 1 người trở lên")
    @Max(value = 50, message = "Sức chứa tối đa không quá 50 người")
    private Integer capacity;
}
