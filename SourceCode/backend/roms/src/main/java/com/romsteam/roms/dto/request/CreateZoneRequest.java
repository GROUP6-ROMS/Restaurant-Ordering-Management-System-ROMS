package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateZoneRequest {

    @NotBlank(message = "Mã khu vực không được để trống!")
    @Size(max = 50, message = "Mã khu vực tối đa 50 ký tự!")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Mã khu vực chỉ được chứa chữ cái, số, gạch dưới hoặc gạch nối (ví dụ: ZONE_3, ROOFTOP)!")
    private String zoneCode;

    @NotBlank(message = "Tên khu vực không được để trống!")
    @Size(max = 100, message = "Tên khu vực tối đa 100 ký tự!")
    private String name;

    @Size(max = 255, message = "Mô tả tối đa 255 ký tự!")
    private String description;

    private Integer displayOrder;
}
