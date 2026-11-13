package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.UpdateRestaurantProfileRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.RestaurantProfileResponse;
import com.romsteam.roms.service.RestaurantProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class RestaurantProfileController {

    private final RestaurantProfileService restaurantProfileService;

    /**
     * 1. GET /api/public/restaurant/profile
     * Lấy thông tin cấu hình nhà hàng công khai (dành cho Landing Page, Điện thoại khách quét QR, POS, KDS)
     */
    @GetMapping("/api/public/restaurant/profile")
    public ResponseEntity<ApiResponse<RestaurantProfileResponse>> getPublicProfile() {
        RestaurantProfileResponse profile = restaurantProfileService.getProfile();
        return ResponseEntity.ok(ApiResponse.success(profile, "Lấy thông tin thương hiệu nhà hàng thành công!"));
    }

    /**
     * 2. PUT /api/admin/restaurant/profile
     * Quản lý cập nhật thông tin thương hiệu, thông tin quán, WiFi và số tài khoản ngân hàng
     */
    @PutMapping("/api/admin/restaurant/profile")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<RestaurantProfileResponse>> updateProfile(
            @Valid @RequestBody UpdateRestaurantProfileRequest request
    ) {
        RestaurantProfileResponse updated = restaurantProfileService.updateProfile(request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật thông tin thương hiệu nhà hàng thành công!"));
    }
}
