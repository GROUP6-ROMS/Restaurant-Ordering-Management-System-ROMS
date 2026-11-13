package com.romsteam.roms.dto.response;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO trả về thông tin nhóm danh mục kèm số lượng món ăn trực thuộc
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryResponse {

    private Long id;
    private String name;
    private String description;
    private Integer displayOrder;
    private Long dishCount; // Số món đang kinh doanh trong danh mục này
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
