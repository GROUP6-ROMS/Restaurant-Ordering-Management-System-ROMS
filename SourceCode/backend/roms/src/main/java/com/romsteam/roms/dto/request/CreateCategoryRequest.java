package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * DTO nhận dữ liệu khi Quản lý thêm danh mục thực đơn mới
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCategoryRequest {

    @NotBlank(message = "Tên danh mục không được để trống!")
    private String name;

    private String description;

    private Integer displayOrder;
}
