package com.romsteam.roms.dto.response;

import lombok.*;

import java.math.BigDecimal;

/**
 * DTO trả về thông tin món ăn từ CSDL cho Trạm Phục Vụ (Waiter Terminal)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaiterMenuItemResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private String category;
    private Long categoryId;
    private Boolean isAvailable;
}
