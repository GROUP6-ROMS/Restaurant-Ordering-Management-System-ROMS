package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.CloseEmptySessionRequest;
import com.romsteam.roms.dto.request.MergeTableRequest;
import com.romsteam.roms.dto.request.OpenTableRequest;
import com.romsteam.roms.dto.request.TransferTableRequest;
import com.romsteam.roms.dto.request.WaiterAddOrderRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.WaiterMenuItemResponse;
import com.romsteam.roms.dto.response.WaiterTableResponse;
import com.romsteam.roms.dto.response.ZoneResponse;
import com.romsteam.roms.service.WaiterService;
import com.romsteam.roms.service.ZoneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller dành riêng cho Trạm Phục Vụ Bàn (Waiter Terminal)
 */
@RestController
@RequestMapping("/api/waiter")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('WAITER', 'MANAGER', 'KITCHEN', 'CASHIER')")
public class WaiterController {

    private final WaiterService waiterService;
    private final ZoneService zoneService;

    // 0. GET /api/waiter/zones - Lấy danh sách các khu vực bàn động
    @GetMapping("/zones")
    public ResponseEntity<ApiResponse<List<ZoneResponse>>> getZones() {
        List<ZoneResponse> zones = zoneService.getAllZones();
        return ResponseEntity.ok(ApiResponse.success(zones, "Lấy danh sách khu vực thành công!"));
    }

    // 1. GET /api/waiter/tables - Lấy sơ đồ bàn kèm tiến độ món & chuông gọi
    @GetMapping("/tables")
    public ResponseEntity<ApiResponse<List<WaiterTableResponse>>> getFloorPlan(
            @RequestParam(required = false) String zone) {
        List<WaiterTableResponse> tables = waiterService.getFloorPlan(zone);
        return ResponseEntity.ok(ApiResponse.success(tables, "Lấy sơ đồ bàn phục vụ thành công!"));
    }

    // 2. POST /api/waiter/tables/{id}/open - Mở bàn đón khách (tạo DiningSession)
    @PostMapping("/tables/{id}/open")
    public ResponseEntity<ApiResponse<WaiterTableResponse>> openTable(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) OpenTableRequest request) {
        if (request == null) request = new OpenTableRequest();
        WaiterTableResponse response = waiterService.openTableSession(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã mở bàn đón khách thành công!"));
    }

    // 2.1. POST /api/waiter/tables/{id}/cancel-reservation - Hủy đặt bàn (RESERVED -> AVAILABLE)
    @PostMapping("/tables/{id}/cancel-reservation")
    public ResponseEntity<ApiResponse<WaiterTableResponse>> cancelReservation(@PathVariable Long id) {
        WaiterTableResponse response = waiterService.cancelReservation(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã hủy đặt bàn thành công!"));
    }

    // 3. POST /api/waiter/tables/{id}/clean - Hoàn tất dọn bàn (DIRTY -> AVAILABLE)
    @PostMapping("/tables/{id}/clean")
    public ResponseEntity<ApiResponse<WaiterTableResponse>> cleanTable(@PathVariable Long id) {
        WaiterTableResponse response = waiterService.completeCleaning(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã dọn xong bàn, sẵn sàng đón khách!"));
    }

    // 4. POST /api/waiter/tables/transfer - Chuyển bàn
    @PostMapping("/tables/transfer")
    public ResponseEntity<ApiResponse<Void>> transferTable(@Valid @RequestBody TransferTableRequest request) {
        waiterService.transferTable(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Chuyển bàn thành công!"));
    }

    // 4.1. POST /api/waiter/tables/merge - Gộp bàn
    @PostMapping("/tables/merge")
    public ResponseEntity<ApiResponse<Void>> mergeTables(@Valid @RequestBody MergeTableRequest request) {
        waiterService.mergeTables(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Gộp bàn thành công!"));
    }

    // 5. POST /api/waiter/tables/{id}/deliver - Xác nhận đã bưng toàn bộ món READY (READY -> SERVED)
    @PostMapping("/tables/{id}/deliver")
    public ResponseEntity<ApiResponse<WaiterTableResponse>> deliverFood(@PathVariable Long id) {
        WaiterTableResponse response = waiterService.confirmDeliverFood(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã xác nhận bưng món lên bàn!"));
    }

    // 5.1. POST /api/waiter/tables/{id}/items/{itemId}/deliver - Xác nhận bưng từng đĩa món riêng lẻ (READY -> SERVED)
    @PostMapping("/tables/{id}/items/{itemId}/deliver")
    public ResponseEntity<ApiResponse<WaiterTableResponse>> deliverSingleItem(
            @PathVariable Long id,
            @PathVariable Long itemId) {
        WaiterTableResponse response = waiterService.confirmDeliverSingleItem(id, itemId);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã xác nhận bưng món lên bàn!"));
    }

    // 6. PATCH /api/waiter/requests/{id}/resolve - Xử lý xong chuông gọi phục vụ
    @PatchMapping("/requests/{id}/resolve")
    public ResponseEntity<ApiResponse<Void>> resolveCall(@PathVariable Long id) {
        waiterService.resolveServiceRequest(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xử lý xong yêu cầu chuông gọi!"));
    }

    // 7. POST /api/waiter/tables/{id}/orders - Nhân viên phục vụ gọi thêm món tại bàn (Lưu thật CSDL)
    @PostMapping("/tables/{id}/orders")
    public ResponseEntity<ApiResponse<WaiterTableResponse>> addOrderToTable(
            @PathVariable Long id,
            @Valid @RequestBody WaiterAddOrderRequest request) {
        WaiterTableResponse response = waiterService.addOrderToTable(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã gửi đợt gọi món vào Bếp thành công!"));
    }

    // 8. POST /api/waiter/tables/{id}/request-payment - Yêu cầu tính tiền / Báo sang POS Thu ngân
    @PostMapping("/tables/{id}/request-payment")
    public ResponseEntity<ApiResponse<WaiterTableResponse>> requestPayment(@PathVariable Long id) {
        WaiterTableResponse response = waiterService.requestPayment(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã gửi yêu cầu thanh toán tới Quầy Thu Ngân!"));
    }

    // 9. GET /api/waiter/menu - Lấy danh mục món ăn thực tế từ CSDL
    @GetMapping("/menu")
    public ResponseEntity<ApiResponse<List<WaiterMenuItemResponse>>> getMenuCatalog() {
        List<WaiterMenuItemResponse> menu = waiterService.getMenuCatalog();
        return ResponseEntity.ok(ApiResponse.success(menu, "Lấy danh mục thực đơn thành công!"));
    }

    // 10. POST /api/waiter/tables/{id}/close-empty - Đóng phiên ăn bàn trống (0đ / khách rời đi)
    @PostMapping("/tables/{id}/close-empty")
    public ResponseEntity<ApiResponse<WaiterTableResponse>> closeEmptySession(
            @PathVariable Long id,
            @RequestBody(required = false) CloseEmptySessionRequest request) {
        WaiterTableResponse response = waiterService.closeEmptySession(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã đóng phiên bàn trống và giải phóng bàn thành công!"));
    }
}
