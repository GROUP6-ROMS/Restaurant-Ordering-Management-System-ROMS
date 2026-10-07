package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.LoginRequest;
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
}
