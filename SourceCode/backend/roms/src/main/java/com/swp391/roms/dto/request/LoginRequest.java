package com.swp391.roms.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Yêu cầu đăng nhập tài khoản nhân viên")
public class LoginRequest {

    @NotBlank(message = "Username không được để trống")
    @Size(min = 4, max = 30, message = "Username phải từ 4 đến 30 ký tự")
    @Pattern(regexp = "^[a-zA-Z0-9_.-]+$", message = "Username chỉ được chứa chữ cái, chữ số và các dấu _, ., -")
    @Schema(description = "Tên đăng nhập của nhân viên", example = "waiter")
    private String username;

    @NotBlank(message = "Password không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có tối thiểu 6 ký tự")
    @Schema(description = "Mật khẩu tài khoản", example = "123456")
    private String password;
}
