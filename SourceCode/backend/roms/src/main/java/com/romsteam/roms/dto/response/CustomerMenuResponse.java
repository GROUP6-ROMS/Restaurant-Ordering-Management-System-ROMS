package com.romsteam.roms.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerMenuResponse {
    private Long categoryId;
    private String categoryName;
    private Integer displayOrder;
    private List<CustomerMenuItemResponse> items;
}
