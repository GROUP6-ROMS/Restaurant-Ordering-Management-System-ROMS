package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTableRequest {

    // Mã bàn (ví dụ: "T-11", "VIP-04") - Bắt buộc
    @NotBlank(message = "Mã bàn không được để trống")
    private String tableNumber;

    // Tên bàn hiển thị (ví dụ: "Bàn T-11", "Sen Vàng 2")
    private String name;

    // Khu vực: "ZONE_1" (Sảnh chính), "ZONE_2" (Ban công), "VIP" (Phòng VIP)
    @NotBlank(message = "Khu vực không được để trống")
    private String zone;

    // Sức chứa khách tối thiểu 1 người
    @NotNull(message = "Sức chứa không được để trống")
    @Min(value = 1, message = "Sức chứa tối thiểu từ 1 người trở lên")
    private Integer capacity;
}
