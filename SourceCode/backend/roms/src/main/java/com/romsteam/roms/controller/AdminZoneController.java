package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.CreateZoneRequest;
import com.romsteam.roms.dto.request.UpdateZoneRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.ZoneResponse;
import com.romsteam.roms.service.ZoneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/zones")
@RequiredArgsConstructor
public class AdminZoneController {

    private final ZoneService zoneService;

    // 1. GET /api/admin/zones - Lấy danh sách tất cả khu vực kèm số lượng bàn
    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'WAITER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<ZoneResponse>>> getAllZones() {
        List<ZoneResponse> zones = zoneService.getAllZones();
        return ResponseEntity.ok(ApiResponse.success(zones, "Lấy danh sách khu vực thành công!"));
    }

    // 2. GET /api/admin/zones/{id} - Lấy chi tiết 1 khu vực
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'WAITER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ZoneResponse>> getZoneById(@PathVariable Long id) {
        ZoneResponse zone = zoneService.getZoneById(id);
        return ResponseEntity.ok(ApiResponse.success(zone, "Lấy chi tiết khu vực thành công!"));
    }

    // 3. POST /api/admin/zones - Thêm khu vực mới (Chỉ Quản lý)
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ZoneResponse>> createZone(@Valid @RequestBody CreateZoneRequest request) {
        ZoneResponse newZone = zoneService.createZone(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(newZone, "Thêm khu vực mới thành công!"));
    }

    // 4. PUT /api/admin/zones/{id} - Chỉnh sửa khu vực (Chỉ Quản lý)
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ZoneResponse>> updateZone(
            @PathVariable Long id,
            @Valid @RequestBody UpdateZoneRequest request) {
        ZoneResponse updated = zoneService.updateZone(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật khu vực thành công!"));
    }

    // 5. DELETE /api/admin/zones/{id} - Xóa khu vực (Chỉ Quản lý)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteZone(@PathVariable Long id) {
        zoneService.deleteZone(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa khu vực thành công!"));
    }
}
