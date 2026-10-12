package com.romsteam.roms.controller;

import com.romsteam.roms.dto.response.AdminNotificationItemResponse;
import com.romsteam.roms.dto.response.AdminNotificationSummaryResponse;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller cung cấp dữ liệu chuông thông báo trung tâm cho Quản lý nhà hàng (Admin/Manager)
 * Theo dõi trực tiếp:
 * 1. Bàn ăn cần nhân viên hỗ trợ (khách bấm chuông tại bàn)
 * 2. Yêu cầu đặt bàn trực tuyến mới cần Quản lý xác nhận & xếp bàn
 */
@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'WAITER', 'CASHIER')")
public class AdminNotificationController {

    private final NotificationService notificationService;

    /**
     * 1. GET /api/admin/notifications - Lấy danh sách và số lượng thông báo chưa xử lý
     */
    @GetMapping
    public ResponseEntity<ApiResponse<AdminNotificationSummaryResponse>> getNotifications() {
        AdminNotificationSummaryResponse summary = notificationService.getAdminNotifications();
        return ResponseEntity.ok(ApiResponse.success(summary, "Lấy dữ liệu thông báo thành công"));
    }

    /**
     * 2. PATCH /api/admin/notifications/assistance/{id}/resolve - Đánh dấu đã xử lý yêu cầu hỗ trợ tại bàn
     */
    @PatchMapping("/assistance/{id}/resolve")
    public ResponseEntity<ApiResponse<Void>> resolveAssistanceRequest(@PathVariable Long id) {
        notificationService.resolveAssistanceRequest(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xử lý xong yêu cầu hỗ trợ tại bàn"));
    }

    /**
     * 3. POST /api/admin/notifications/test-assistance - Tạo thông báo thử nghiệm nhanh để Quản lý test chuông
     */
    @PostMapping("/test-assistance")
    public ResponseEntity<ApiResponse<AdminNotificationItemResponse>> createTestAssistance(
            @RequestBody(required = false) Map<String, Object> body) {
        Long tableId = null;
        String note = "Khách tại bàn vừa bấm chuông gọi nhân viên hỗ trợ";
        if (body != null) {
            if (body.get("tableId") != null) {
                try {
                    tableId = Long.valueOf(body.get("tableId").toString());
                } catch (Exception ignored) {}
            }
            if (body.get("note") != null) {
                note = body.get("note").toString();
            }
        }
        AdminNotificationItemResponse item = notificationService.createTestAssistanceRequest(tableId, note);
        return ResponseEntity.ok(ApiResponse.success(item, "Đã kích hoạt thông báo bàn gọi hỗ trợ thử nghiệm"));
    }
}
