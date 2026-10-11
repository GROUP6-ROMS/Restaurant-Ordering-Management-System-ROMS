package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateZoneRequest {

    @NotBlank(message = "Tên khu vực không được để trống!")
    @Size(max = 100, message = "Tên khu vực tối đa 100 ký tự!")
    private String name;

    @Size(max = 255, message = "Mô tả tối đa 255 ký tự!")
    private String description;

    private Integer displayOrder;
}
