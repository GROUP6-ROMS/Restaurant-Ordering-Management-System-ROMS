package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.LoginRequest;
import com.romsteam.roms.dto.request.RequestOtpRequest;
import com.romsteam.roms.dto.request.ResetPinRequest;
import com.romsteam.roms.dto.request.VerifyManagerPinRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.LoginResponse;
import com.romsteam.roms.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // POST /api/auth/login - Dang nhap ca truc
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đăng nhập ca làm việc thành công!"));
    }

    // POST /api/auth/verify-manager-pin - Quan ly phe duyet
    @PostMapping("/verify-manager-pin")
    public ResponseEntity<ApiResponse<Boolean>> verifyManagerPin(@Valid @RequestBody VerifyManagerPinRequest request) {
        boolean isValid = authService.verifyManagerPin(request);
        return ResponseEntity.ok(ApiResponse.success(isValid, "Xác thực mã PIN Quản lý thành công!"));
    }

    // POST /api/auth/logout - Dang xuat ca truc (Cap nhat isOnShift = false)
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody(required = false) Map<String, String> body,
                                                    Authentication authentication) {
        String username = null;
        if (body != null && body.containsKey("username")) {
            username = body.get("username");
        } else if (authentication != null) {
            username = authentication.getName();
        }

        if (username != null) {
            authService.logout(username);
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Đăng xuất ca làm việc thành công!"));
    }

    // POST /api/auth/heartbeat - Duy trì phiên làm việc và tự động đồng bộ trạng thái ca trực (isOnShift = true)
    @PostMapping("/heartbeat")
    public ResponseEntity<ApiResponse<Map<String, Object>>> heartbeat(
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        String username = null;
        if (body != null && body.containsKey("username")) {
            username = body.get("username");
        } else if (authentication != null) {
            username = authentication.getName();
        }

        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Không tìm thấy thông tin phiên làm việc", org.springframework.http.HttpStatus.UNAUTHORIZED.value()));
        }

        Map<String, Object> response = authService.heartbeat(username);
        return ResponseEntity.ok(ApiResponse.success(response, "Duy trì phiên làm việc thành công!"));
    }

    // POST /api/auth/forgot-pin/request-otp - Yeu cau ma OTP dat lai ma PIN Quan ly
    @PostMapping("/forgot-pin/request-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> requestPinResetOtp(@Valid @RequestBody RequestOtpRequest request) {
        Map<String, Object> result = authService.requestPinResetOtp(request);
        return ResponseEntity.ok(ApiResponse.success(result, "Yêu cầu mã xác thực OTP thành công!"));
    }

    // POST /api/auth/forgot-pin/reset - Dat lai ma PIN bang OTP hoac Master Recovery Key
    @PostMapping("/forgot-pin/reset")
    public ResponseEntity<ApiResponse<Void>> resetPinWithOtpOrRecoveryKey(@Valid @RequestBody ResetPinRequest request) {
        authService.resetPinWithOtpOrRecoveryKey(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Đặt lại mã PIN thành công! Bạn có thể sử dụng mã PIN mới để đăng nhập."));
    }
}
