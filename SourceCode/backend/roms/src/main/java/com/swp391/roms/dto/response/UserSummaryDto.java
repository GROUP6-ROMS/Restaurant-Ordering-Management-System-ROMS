package com.swp391.roms.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông tin tóm tắt của nhân viên sau khi đăng nhập")
public class UserSummaryDto {

    @Schema(description = "ID người dùng", example = "1")
    private Long id;

    @Schema(description = "Tên đăng nhập", example = "waiter")
    private String username;

    @Schema(description = "Họ và tên nhân viên", example = "Nguyễn Văn Bồi Bàn")
    private String fullName;

    @Schema(description = "Email nhân viên", example = "waiter@roms.com")
    private String email;

    @Schema(description = "Số điện thoại", example = "0987654321")
    private String phone;

    @Schema(description = "Vai trò trong hệ thống", example = "ROLE_WAITER")
    private String role;

    @Schema(description = "Trạng thái tài khoản", example = "ACTIVE")
    private String status;
}
