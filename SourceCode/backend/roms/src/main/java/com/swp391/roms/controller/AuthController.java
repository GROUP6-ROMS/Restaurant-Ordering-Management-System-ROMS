package com.swp391.roms.controller;

import com.swp391.roms.common.dto.ApiResponse;
import com.swp391.roms.dto.request.LoginRequest;
import com.swp391.roms.dto.response.LoginResponse;
import com.swp391.roms.dto.response.UserSummaryDto;
import com.swp391.roms.security.UserPrincipal;
import com.swp391.roms.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Các API xác thực, đăng nhập, đăng xuất và thông tin phiên làm việc nhân sự")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập tài khoản nhân viên", description = "Xác thực nhân viên (Manager, Waiter, Chef, Cashier) qua username/password và trả về JWT Bearer Token có thời hạn 8 giờ")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Đăng nhập thành công, trả về JWT Token và thông tin user"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Dữ liệu đầu vào không hợp lệ"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Sai tài khoản hoặc mật khẩu"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "423", description = "Tài khoản bị tạm khóa 15 phút do nhập sai 5 lần")
    })
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest) {
        String ipAddress = getClientIp(servletRequest);
        LoginResponse response = authService.login(request, ipAddress);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    @PostMapping("/logout")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Đăng xuất tài khoản", description = "Hủy phiên làm việc và ghi nhận audit log đăng xuất")
    public ResponseEntity<ApiResponse<String>> logout(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            HttpServletRequest servletRequest) {
        String ipAddress = getClientIp(servletRequest);
        String username = userPrincipal != null ? userPrincipal.getUsername() : "anonymous";
        authService.logout(username, ipAddress);
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", "Session closed successfully"));
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Lấy thông tin tài khoản hiện tại", description = "Truy xuất hồ sơ nhân viên đang đăng nhập dựa trên JWT Bearer token")
    public ResponseEntity<ApiResponse<UserSummaryDto>> getMe(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserSummaryDto userSummary = authService.getMe(userPrincipal.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tài khoản thành công", userSummary));
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
