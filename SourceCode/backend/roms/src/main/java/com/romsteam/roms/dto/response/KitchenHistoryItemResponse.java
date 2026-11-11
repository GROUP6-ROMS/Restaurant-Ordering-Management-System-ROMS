package com.romsteam.roms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenHistoryItemResponse {
    private Long id;
    private Long menuItemId;
    private String orderCode;
    private String name;
    private String imageUrl;
    private Integer quantity;
    private String note;
    private Boolean isRush;
    private String status;
    private String statusText;
    private LocalDateTime orderTime;
    private LocalDateTime completedTime;
}
