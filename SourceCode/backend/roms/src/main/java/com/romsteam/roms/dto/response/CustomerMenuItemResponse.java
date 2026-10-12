package com.romsteam.roms.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerMenuItemResponse {
    private Long id;
    private Long categoryId;
    private String categoryName;
    private String sku;
    private String name;
    private String description;
    private BigDecimal price;
    private String station;
    private String tag;
    private String imageUrl;
    private Boolean isAvailable;
    private String prepTime;
}
