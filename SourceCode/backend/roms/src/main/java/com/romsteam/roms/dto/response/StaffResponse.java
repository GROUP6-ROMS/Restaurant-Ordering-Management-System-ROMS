package com.romsteam.roms.dto.response;

import com.romsteam.roms.entity.enums.UserRole;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffResponse {

    private Long id;
    private String username;
    private String fullName;
    private String phone;
    private UserRole role;
    private String roleLabel;
    private Boolean isActive;
    private Boolean isOnShift;
    private String currentShift;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
