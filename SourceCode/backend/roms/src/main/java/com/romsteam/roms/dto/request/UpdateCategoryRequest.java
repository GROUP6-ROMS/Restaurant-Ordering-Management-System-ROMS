package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * DTO nhận dữ liệu khi Quản lý chỉnh sửa thông tin danh mục thực đơn
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCategoryRequest {

    @NotBlank(message = "Tên danh mục không được để trống!")
    private String name;

    private String description;

    private Integer displayOrder;

    private Boolean isActive;
}
