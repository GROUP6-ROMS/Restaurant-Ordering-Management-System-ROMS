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
@Schema(description = "Kết quả phản hồi đăng nhập thành công")
public class LoginResponse {

    @Schema(description = "JWT Access Token dùng cho các request tiếp theo", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String accessToken;

    @Schema(description = "Loại token", example = "Bearer")
    @Builder.Default
    private String tokenType = "Bearer";

    @Schema(description = "Thời gian hết hạn tính bằng giây (8 giờ = 28,800s)", example = "28800")
    private long expiresIn;

    @Schema(description = "Thông tin chi tiết của nhân viên")
    private UserSummaryDto user;
}
