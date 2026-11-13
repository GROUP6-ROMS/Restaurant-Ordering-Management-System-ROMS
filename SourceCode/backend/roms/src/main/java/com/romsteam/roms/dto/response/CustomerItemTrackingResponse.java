package com.romsteam.roms.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerItemTrackingResponse {
    private Long orderItemId;
    private Long menuItemId;
    private String name;
    private String imageUrl;
    private BigDecimal price;
    private Integer quantity;
    private BigDecimal subtotal;
    private String note;
    private String status; // PENDING, COOKING, READY, SERVED, CANCELLED
    private String statusText;
    private String prepTime;
    private String station;
}
