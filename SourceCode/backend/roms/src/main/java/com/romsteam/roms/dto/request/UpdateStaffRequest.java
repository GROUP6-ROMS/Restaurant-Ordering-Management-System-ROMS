package com.romsteam.roms.dto.request;

import com.romsteam.roms.entity.enums.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateStaffRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    private String phone;

    @NotNull(message = "Vai trò không được để trống")
    private UserRole role;

    private Boolean isActive;
}
