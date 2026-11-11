package com.romsteam.roms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenHistoryTableResponse {
    private Long tableId;
    private String tableNumber;
    private String tableName;
    private String zoneName;
    private Integer totalItems;
    private Integer readyItems;
    private Integer servedItems;
    private List<KitchenHistoryItemResponse> items;
}
