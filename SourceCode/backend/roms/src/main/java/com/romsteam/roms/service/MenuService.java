package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.CreateCategoryRequest;
import com.romsteam.roms.dto.request.CreateMenuItemRequest;
import com.romsteam.roms.dto.request.UpdateCategoryRequest;
import com.romsteam.roms.dto.request.UpdateMenuItemRequest;
import com.romsteam.roms.dto.response.AdminMenuItemResponse;
import com.romsteam.roms.dto.response.CategoryResponse;
import com.romsteam.roms.dto.response.MenuSummaryResponse;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

public interface MenuService {

    // 1. Lấy thông tin thống kê 3 thẻ KPI
    MenuSummaryResponse getMenuSummary();

    // 2. Tìm kiếm và lọc danh sách món ăn
    List<AdminMenuItemResponse> searchMenuItems(Long categoryId, String station, Boolean isAvailable, String keyword);

    // 3. Lấy chi tiết một món ăn theo ID
    AdminMenuItemResponse getMenuItemById(Long id);

    // 4. Tạo món ăn mới
    AdminMenuItemResponse createMenuItem(CreateMenuItemRequest request);

    // 5. Cập nhật thông tin món ăn
    AdminMenuItemResponse updateMenuItem(Long id, UpdateMenuItemRequest request);

    // 6. Bật/tắt trạng thái hết món (86'd)
    AdminMenuItemResponse toggleMenuItemAvailability(Long id);

    // 7. Xóa món ăn khỏi thực đơn (Soft Delete)
    void deleteMenuItem(Long id);

    // 8. Lấy toàn bộ danh mục thực đơn
    List<CategoryResponse> getAllCategories();

    // 9. Thêm danh mục mới
    CategoryResponse createCategory(CreateCategoryRequest request);

    // 10. Cập nhật danh mục
    CategoryResponse updateCategory(Long id, UpdateCategoryRequest request);

    // 11. Xóa danh mục thực đơn
    void deleteCategory(Long id);

    // 12. Kích hoạt đồng bộ thực đơn xuống KDS và POS
    void syncMenuToKdsAndPos();

    // 13. Tải lên hình ảnh món ăn từ thiết bị máy tính hoặc điện thoại
    String uploadDishImage(MultipartFile file);
}
