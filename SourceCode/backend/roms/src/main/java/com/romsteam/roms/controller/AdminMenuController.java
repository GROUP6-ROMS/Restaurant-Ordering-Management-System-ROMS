package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.CreateCategoryRequest;
import com.romsteam.roms.dto.request.CreateMenuItemRequest;
import com.romsteam.roms.dto.request.UpdateCategoryRequest;
import com.romsteam.roms.dto.request.UpdateMenuItemRequest;
import com.romsteam.roms.dto.response.AdminMenuItemResponse;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.CategoryResponse;
import com.romsteam.roms.dto.response.MenuSummaryResponse;
import com.romsteam.roms.service.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller cung cấp trọn bộ REST API phục vụ màn hình Quản lý Thực Đơn (/admin/menu)
 */
@RestController
@RequestMapping("/api/admin/menu")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'WAITER', 'CASHIER')")
public class AdminMenuController {

    private final MenuService menuService;

    // 1. GET /api/admin/menu/summary - Lấy số liệu 3 thẻ KPI
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<MenuSummaryResponse>> getMenuSummary() {
        MenuSummaryResponse summary = menuService.getMenuSummary();
        return ResponseEntity.ok(ApiResponse.success(summary, "Lấy số liệu KPI thực đơn thành công!"));
    }

    // 2. GET /api/admin/menu/items - Lấy danh sách món ăn có lọc đa tiêu chí
    @GetMapping("/items")
    public ResponseEntity<ApiResponse<List<AdminMenuItemResponse>>> searchMenuItems(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String station,
            @RequestParam(required = false) Boolean isAvailable,
            @RequestParam(required = false) String search
    ) {
        List<AdminMenuItemResponse> dishes = menuService.searchMenuItems(categoryId, station, isAvailable, search);
        return ResponseEntity.ok(ApiResponse.success(dishes, "Lấy danh sách món ăn thành công!"));
    }

    // 3. GET /api/admin/menu/items/{id} - Lấy chi tiết món ăn
    @GetMapping("/items/{id}")
    public ResponseEntity<ApiResponse<AdminMenuItemResponse>> getMenuItemById(@PathVariable Long id) {
        AdminMenuItemResponse dish = menuService.getMenuItemById(id);
        return ResponseEntity.ok(ApiResponse.success(dish, "Lấy thông tin món ăn thành công!"));
    }

    // 4. POST /api/admin/menu/items - Tạo món ăn mới
    @PostMapping("/items")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AdminMenuItemResponse>> createMenuItem(
            @Valid @RequestBody CreateMenuItemRequest request
    ) {
        AdminMenuItemResponse created = menuService.createMenuItem(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Thêm món ăn mới thành công!"));
    }

    // 5. PUT /api/admin/menu/items/{id} - Cập nhật cấu hình món ăn
    @PutMapping("/items/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AdminMenuItemResponse>> updateMenuItem(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMenuItemRequest request
    ) {
        AdminMenuItemResponse updated = menuService.updateMenuItem(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật cấu hình món ăn thành công!"));
    }

    // 6. PATCH /api/admin/menu/items/{id}/toggle-availability - Chuyển trạng thái 86'd
    @PatchMapping("/items/{id}/toggle-availability")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AdminMenuItemResponse>> toggleAvailability(@PathVariable Long id) {
        AdminMenuItemResponse toggled = menuService.toggleMenuItemAvailability(id);
        return ResponseEntity.ok(ApiResponse.success(toggled, "Đã cập nhật trạng thái phục vụ của món!"));
    }

    // 7. DELETE /api/admin/menu/items/{id} - Xóa món ăn khỏi thực đơn
    @DeleteMapping("/items/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteMenuItem(@PathVariable Long id) {
        menuService.deleteMenuItem(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa món ăn khỏi thực đơn!"));
    }

    // 8. GET /api/admin/menu/categories - Lấy danh sách nhóm danh mục
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> categories = menuService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success(categories, "Lấy danh sách nhóm danh mục thành công!"));
    }

    // 9. POST /api/admin/menu/categories - Tạo nhóm danh mục mới
    @PostMapping("/categories")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CreateCategoryRequest request
    ) {
        CategoryResponse created = menuService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Tạo nhóm danh mục mới thành công!"));
    }

    // 10. PUT /api/admin/menu/categories/{id} - Sửa danh mục
    @PutMapping("/categories/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCategoryRequest request
    ) {
        CategoryResponse updated = menuService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật nhóm danh mục thành công!"));
    }

    // 11. DELETE /api/admin/menu/categories/{id} - Xóa danh mục
    @DeleteMapping("/categories/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        menuService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa nhóm danh mục thành công!"));
    }

    // 12. POST /api/admin/menu/sync - Đồng bộ xuống Bếp KDS và Thu Ngân POS
    @PostMapping("/sync")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> syncMenu() {
        menuService.syncMenuToKdsAndPos();
        return ResponseEntity.ok(ApiResponse.success(null, "Đã đồng bộ thực đơn xuống tất cả trạm Bếp KDS và Máy Thu Ngân POS!"));
    }
}
