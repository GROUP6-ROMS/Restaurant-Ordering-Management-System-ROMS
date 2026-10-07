package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.CreateTableRequest;
import com.romsteam.roms.dto.request.UpdateTableStatusRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.TableOrdersResponse;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.dto.response.TableSummaryResponse;
import com.romsteam.roms.entity.enums.TableStatus;
import com.romsteam.roms.service.RestaurantTableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/tables")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'WAITER')")
public class AdminTableController {

    private final RestaurantTableService tableService;

    // 1. GET /api/admin/tables/summary - Lấy 5 thẻ chỉ số KPI
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<TableSummaryResponse>> getTableSummary() {
        TableSummaryResponse summary = tableService.getTableSummary();
        return ResponseEntity.ok(ApiResponse.success(summary, "Lấy dữ liệu thống kê bàn thành công!"));
    }

    // 2. GET /api/admin/tables - Lấy danh sách bàn kèm bộ lọc và tìm kiếm
    @GetMapping
    public ResponseEntity<ApiResponse<List<TableResponse>>> getTables(
            @RequestParam(required = false) String zone,
            @RequestParam(required = false) TableStatus status,
            @RequestParam(required = false) String search) {
        List<TableResponse> tables = tableService.getTables(zone, status, search);
        return ResponseEntity.ok(ApiResponse.success(tables, "Lấy danh sách bàn thành công!"));
    }

    // 3. GET /api/admin/tables/{id} - Lấy chi tiết 1 bàn
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TableResponse>> getTableById(@PathVariable Long id) {
        TableResponse table = tableService.getTableById(id);
        return ResponseEntity.ok(ApiResponse.success(table, "Lấy chi tiết bàn thành công!"));
    }

    // 4. POST /api/admin/tables - Thêm bàn mới (Chỉ Quản lý)
    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<TableResponse>> createTable(@Valid @RequestBody CreateTableRequest request) {
        TableResponse newTable = tableService.createTable(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(newTable, "Thêm bàn mới thành công!"));
    }

    // 5. PATCH /api/admin/tables/{id}/status - Đổi trạng thái bàn (Khóa, Mở, Đặt chỗ)
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TableResponse>> updateTableStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTableStatusRequest request) {
        TableResponse updated = tableService.updateTableStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật trạng thái bàn thành công!"));
    }

    // 6. POST /api/admin/tables/{id}/refresh-qr - Đổi mã QR mới cho bàn
    @PostMapping("/{id}/refresh-qr")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<TableResponse>> refreshQrToken(@PathVariable Long id) {
        TableResponse updated = tableService.refreshQrToken(id);
        return ResponseEntity.ok(ApiResponse.success(updated, "Đã làm mới mã QR token cho bàn thành công!"));
    }

    // 7. DELETE /api/admin/tables/{id} - Xóa bàn ăn
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteTable(@PathVariable Long id) {
        tableService.deleteTable(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa bàn ăn thành công!"));
    }
    // 8. GET /api/admin/tables/{id}/orders - Xem nhanh toàn bộ món đang phục vụ tại bàn
    @GetMapping("/{id}/orders")
    public ResponseEntity<ApiResponse<TableOrdersResponse>> getTableOrders(@PathVariable Long id) {
        TableOrdersResponse ordersResponse = tableService.getTableActiveOrders(id);
        return ResponseEntity.ok(ApiResponse.success(ordersResponse, "Lấy danh sách món tại bàn thành công!"));
    }
}
