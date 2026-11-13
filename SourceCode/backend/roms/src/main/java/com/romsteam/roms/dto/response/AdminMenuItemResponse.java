package com.romsteam.roms.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO trả về đầy đủ thông tin món ăn kèm các chỉ số tài chính (Giá vốn, Lợi nhuận gộp, Biên %)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminMenuItemResponse {

    private Long id;
    private String sku;
    private String name;
    private Long categoryId;
    private String categoryName;
    private String station; // "KITCHEN" hoặc "WAITER"
    private BigDecimal price;
    private BigDecimal costPrice;
    private BigDecimal profit; // price - costPrice
    private Double marginPercent; // ((price - costPrice) / price) * 100
    private Boolean isAvailable;
    private Integer dailyStock;
    private Integer remainingStock;
    private String tag; // "Bestseller", "Chef's Choice"...
    private String description;
    private String imageUrl;
    private Integer displayOrder;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
