package com.romsteam.roms.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ZoneResponse {

    private Long id;
    private String zoneCode;
    private String name;
    private String description;
    private Integer displayOrder;
    private Long tableCount;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
