package com.romsteam.roms.controller;

import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.service.RestaurantTableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/customer/tables")
@RequiredArgsConstructor
public class CustomerTableController {

    private final RestaurantTableService tableService;

    // POST /api/customer/tables/verify-qr - Xác thực mã token khi khách quét QR
    @PostMapping("/verify-qr")
    public ResponseEntity<ApiResponse<TableResponse>> verifyQrToken(@RequestBody Map<String, String> request) {
        String token = request.get("qrToken");
        TableResponse table = tableService.verifyQrToken(token);
        return ResponseEntity.ok(ApiResponse.success(table, "Bàn ăn hợp lệ! Đang kết nối phiên gọi món..."));
    }
}
