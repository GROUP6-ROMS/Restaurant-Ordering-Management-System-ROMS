package com.romsteam.roms.dto.request;

import com.romsteam.roms.entity.enums.UserRole;
import jakarta.validation.constraints.Email;
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

    @Email(message = "Địa chỉ email không hợp lệ")
    private String email;

    @NotNull(message = "Vai trò không được để trống")
    private UserRole role;

    private Boolean isActive;
}
