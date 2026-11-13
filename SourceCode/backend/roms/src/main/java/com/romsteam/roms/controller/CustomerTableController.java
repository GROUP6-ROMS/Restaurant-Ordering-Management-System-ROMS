package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.CustomerCallWaiterRequest;
import com.romsteam.roms.dto.response.AdminNotificationItemResponse;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.service.NotificationService;
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
    private final NotificationService notificationService;

    // POST /api/customer/tables/verify-qr - Xác thực mã token khi khách quét QR
    @PostMapping("/verify-qr")
    public ResponseEntity<ApiResponse<TableResponse>> verifyQrToken(@RequestBody Map<String, String> request) {
        String token = request.get("qrToken");
        TableResponse table = tableService.verifyQrToken(token);
        return ResponseEntity.ok(ApiResponse.success(table, "Bàn ăn hợp lệ! Đang kết nối phiên gọi món..."));
    }

    // POST /api/customer/tables/{id}/call - Khách bấm chuông gọi nhân viên hỗ trợ tại bàn
    @PostMapping("/{id}/call")
    public ResponseEntity<ApiResponse<AdminNotificationItemResponse>> callWaiter(
            @PathVariable Long id,
            @RequestBody(required = false) CustomerCallWaiterRequest request) {
        AdminNotificationItemResponse response = notificationService.createCustomerAssistanceRequest(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã gửi yêu cầu tới nhân viên phục vụ và Quản lý!"));
    }
}
