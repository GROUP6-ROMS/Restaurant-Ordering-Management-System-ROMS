package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.LoginRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.LoginResponse;
import com.romsteam.roms.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth") // Tien to endpoint xac thuc (da permitAll trong SecurityConfig)
public class AuthController {

    private final AuthService authService;

    // Tiem AuthService qua constructor
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Endpoint dang nhap he thong: POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Dang nhap thanh cong!"));
    }
}
