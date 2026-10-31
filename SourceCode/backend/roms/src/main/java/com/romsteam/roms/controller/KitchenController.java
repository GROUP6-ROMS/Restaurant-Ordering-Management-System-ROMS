package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.UpdateKitchenStatusRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.KitchenOrderResponse;
import com.romsteam.roms.dto.response.KitchenSummaryResponse;
import com.romsteam.roms.dto.response.AdminMenuItemResponse;
import com.romsteam.roms.service.KitchenService;
import com.romsteam.roms.service.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller phục vụ Màn hình Bếp KDS (Kitchen Display System)
 * Được bảo vệ nghiêm ngặt: Chỉ nhân viên KITCHEN hoặc Quản lý (MANAGER) mới có quyền truy cập
 */
@RestController
@RequestMapping("/api/kitchen")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('KITCHEN', 'MANAGER', 'WAITER', 'CASHIER')")
public class KitchenController {

    private final KitchenService kitchenService;
    private final MenuService menuService;

    /**
     * 1. Lấy toàn bộ danh sách các đơn đang cần chế biến
     * GET /api/kitchen/orders
     */
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<KitchenOrderResponse>>> getActiveOrders() {
        List<KitchenOrderResponse> orders = kitchenService.getActiveKitchenOrders();
        return ResponseEntity.ok(ApiResponse.success(orders, "Lấy danh sách đơn chế biến thành công"));
    }

    /**
     * 2. Cập nhật trạng thái từng món ăn riêng lẻ (tick hoàn thành READY)
     * PATCH /api/kitchen/items/{itemId}/status
     */
    @PatchMapping("/items/{itemId}/status")
    public ResponseEntity<ApiResponse<KitchenOrderResponse>> updateItemStatus(
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateKitchenStatusRequest request) {
        KitchenOrderResponse updated = kitchenService.updateItemStatus(itemId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật trạng thái món thành công"));
    }

    /**
     * 3. Cập nhật trạng thái cho cả đơn hàng (Nấu tất cả / Xong tất cả)
     * PATCH /api/kitchen/orders/{orderId}/status
     */
    @PatchMapping("/orders/{orderId}/status")
    public ResponseEntity<ApiResponse<KitchenOrderResponse>> updateOrderStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateKitchenStatusRequest request) {
        KitchenOrderResponse updated = kitchenService.updateOrderStatus(orderId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật trạng thái đơn thành công"));
    }

    /**
     * 4. Bật / Tắt trạng thái ưu tiên Hỏa Tốc (RUSH)
     * PATCH /api/kitchen/orders/{orderId}/rush
     */
    @PatchMapping("/orders/{orderId}/rush")
    public ResponseEntity<ApiResponse<KitchenOrderResponse>> toggleRush(
            @PathVariable Long orderId) {
        KitchenOrderResponse updated = kitchenService.toggleRushOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật trạng thái ưu tiên đơn thành công"));
    }

    /**
     * 5. Lấy số liệu đo lường hiệu suất bếp
     * GET /api/kitchen/summary
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<KitchenSummaryResponse>> getSummary() {
        KitchenSummaryResponse summary = kitchenService.getKitchenSummary();
        return ResponseEntity.ok(ApiResponse.success(summary, "Lấy thông số hiệu suất bếp thành công"));
    }

    /**
     * 6. Lấy danh sách thực đơn để Bếp quản lý trạng thái Tạm Hết (86'd)
     * GET /api/kitchen/menu-items
     */
    @GetMapping("/menu-items")
    public ResponseEntity<ApiResponse<List<AdminMenuItemResponse>>> getKitchenMenuItems() {
        List<AdminMenuItemResponse> dishes = menuService.searchMenuItems(null, null, null, null);
        return ResponseEntity.ok(ApiResponse.success(dishes, "Lấy danh sách món cho Bếp thành công"));
    }

    /**
     * 7. Bật / Tắt trạng thái 86'd (Tạm hết / Mở bán) trực tiếp từ màn hình Bếp
     * PATCH /api/kitchen/items/{itemId}/availability
     */
    @PatchMapping("/items/{itemId}/availability")
    public ResponseEntity<ApiResponse<AdminMenuItemResponse>> toggleItemAvailability(
            @PathVariable Long itemId) {
        AdminMenuItemResponse updated = menuService.toggleMenuItemAvailability(itemId);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật trạng thái món thành công"));
    }
}
