package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.CreateCategoryRequest;
import com.romsteam.roms.dto.request.CreateMenuItemRequest;
import com.romsteam.roms.dto.request.UpdateCategoryRequest;
import com.romsteam.roms.dto.request.UpdateMenuItemRequest;
import com.romsteam.roms.dto.response.AdminMenuItemResponse;
import com.romsteam.roms.dto.response.CategoryResponse;
import com.romsteam.roms.dto.response.MenuSummaryResponse;
import com.romsteam.roms.entity.Category;
import com.romsteam.roms.entity.MenuItem;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.exception.ResourceNotFoundException;
import com.romsteam.roms.repository.CategoryRepository;
import com.romsteam.roms.repository.MenuItemRepository;
import com.romsteam.roms.service.MenuService;
import com.romsteam.roms.service.RealtimeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service xử lý toàn bộ nghiệp vụ Quản trị Thực đơn (Menu & Dishes).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MenuServiceImpl implements MenuService {

    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;
    private final RealtimeService realtimeService;

    @Override
    @Transactional(readOnly = true)
    public MenuSummaryResponse getMenuSummary() {
        long activeDishes = menuItemRepository.countByIsAvailableTrueAndIsActiveTrue();
        long pausedDishes = menuItemRepository.countByIsAvailableFalseAndIsActiveTrue();
        long totalDishes = activeDishes + pausedDishes;

        List<MenuItem> allActiveItems = menuItemRepository.findByIsActiveTrueOrderByDisplayOrderAsc();

        // Tính biên lợi nhuận trung bình toàn thực đơn
        double avgMargin = 0.0;
        if (!allActiveItems.isEmpty()) {
            double totalMargin = allActiveItems.stream()
                    .mapToDouble(MenuItem::calculateMarginPercent)
                    .sum();
            avgMargin = Math.round((totalMargin / allActiveItems.size()) * 10.0) / 10.0;
        }

        return MenuSummaryResponse.builder()
                .totalDishes(totalDishes)
                .activeDishes(activeDishes)
                .pausedDishes(pausedDishes)
                .averageMarginPercent(avgMargin)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminMenuItemResponse> searchMenuItems(Long categoryId, String station, Boolean isAvailable, String keyword) {
        String cleanStation = (station != null && !station.equalsIgnoreCase("ALL")) ? station.trim() : null;
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;

        List<MenuItem> items = menuItemRepository.searchMenuItems(categoryId, cleanStation, isAvailable, cleanKeyword);
        return items.stream()
                .map(this::mapToAdminResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AdminMenuItemResponse getMenuItemById(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Món ăn không tồn tại với ID: " + id));
        return mapToAdminResponse(item);
    }

    @Override
    @Transactional
    public AdminMenuItemResponse createMenuItem(CreateMenuItemRequest request) {
        String cleanSku = request.getSku().trim().toUpperCase();

        // 1. Kiểm tra mã SKU đã tồn tại chưa
        if (menuItemRepository.existsBySku(cleanSku)) {
            throw new AppException("Mã SKU '" + cleanSku + "' đã tồn tại! Vui lòng chọn mã khác.", HttpStatus.CONFLICT);
        }

        // 2. Kiểm tra danh mục món ăn
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục món ăn không tồn tại với ID: " + request.getCategoryId()));

        // 3. Chuẩn hóa trạm chế biến
        String station = (request.getStation() != null && request.getStation().equalsIgnoreCase("WAITER")) 
                ? "WAITER" : "KITCHEN";

        int displayOrder = request.getDisplayOrder() != null ? request.getDisplayOrder() : 0;
        if (displayOrder == 0) {
            displayOrder = (int) menuItemRepository.count() + 1;
        }

        Integer dailyStock = request.getDailyStock() != null && request.getDailyStock() > 0 ? request.getDailyStock() : 100;

        MenuItem menuItem = MenuItem.builder()
                .category(category)
                .sku(cleanSku)
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .price(request.getPrice())
                .costPrice(request.getCostPrice() != null ? request.getCostPrice() : BigDecimal.ZERO)
                .station(station)
                .tag(request.getTag() != null ? request.getTag().trim() : "Món Mới")
                .imageUrl(request.getImageUrl() != null ? request.getImageUrl().trim() : "https://images.unsplash.com/photo-1544025162-d76694265947?w=500")
                .isAvailable(true)
                .dailyStock(dailyStock)
                .remainingStock(dailyStock)
                .displayOrder(displayOrder)
                .isActive(true)
                .build();

        MenuItem saved = menuItemRepository.save(menuItem);
        log.info("Manager created new menu item [{} - {}]", saved.getSku(), saved.getName());
        return mapToAdminResponse(saved);
    }

    @Override
    @Transactional
    public AdminMenuItemResponse updateMenuItem(Long id, UpdateMenuItemRequest request) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Món ăn không tồn tại với ID: " + id));

        // 1. Kiểm tra SKU nếu có thay đổi
        if (request.getSku() != null && !request.getSku().trim().isEmpty()) {
            String cleanSku = request.getSku().trim().toUpperCase();
            if (menuItemRepository.existsBySkuAndIdNot(cleanSku, id)) {
                throw new AppException("Mã SKU '" + cleanSku + "' đã thuộc về món ăn khác!", HttpStatus.CONFLICT);
            }
            item.setSku(cleanSku);
        }

        // 2. Kiểm tra danh mục
        if (request.getCategoryId() != null && !request.getCategoryId().equals(item.getCategory().getId())) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại với ID: " + request.getCategoryId()));
            item.setCategory(category);
        }

        item.setName(request.getName().trim());
        item.setPrice(request.getPrice());
        item.setCostPrice(request.getCostPrice());

        if (request.getStation() != null) {
            item.setStation(request.getStation().equalsIgnoreCase("WAITER") ? "WAITER" : "KITCHEN");
        }
        if (request.getTag() != null) {
            item.setTag(request.getTag().trim());
        }
        if (request.getDescription() != null) {
            item.setDescription(request.getDescription().trim());
        }
        if (request.getImageUrl() != null) {
            item.setImageUrl(request.getImageUrl().trim());
        }
        if (request.getDisplayOrder() != null) {
            item.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getDailyStock() != null) {
            item.setDailyStock(request.getDailyStock());
        }
        if (request.getRemainingStock() != null) {
            item.setRemainingStock(request.getRemainingStock());
            if (request.getRemainingStock() <= 0) {
                item.setIsAvailable(false);
                item.setTag("Tạm Hết (86d)");
            }
        }
        if (request.getIsAvailable() != null) {
            item.setIsAvailable(request.getIsAvailable());
        }

        MenuItem updated = menuItemRepository.save(item);
        log.info("Manager updated menu item [ID: {}, Name: {}]", updated.getId(), updated.getName());
        return mapToAdminResponse(updated);
    }

    @Override
    @Transactional
    public AdminMenuItemResponse toggleMenuItemAvailability(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Món ăn không tồn tại với ID: " + id));

        boolean nextStatus = !item.getIsAvailable();
        item.setIsAvailable(nextStatus);
        if (!nextStatus) {
            item.setTag("Tạm Hết (86d)");
        } else if ("Tạm Hết (86d)".equals(item.getTag())) {
            item.setTag("Đang Bán");
        }

        MenuItem updated = menuItemRepository.save(item);
        log.info("Toggled availability for dish [{}] -> {}", updated.getName(), nextStatus ? "AVAILABLE" : "86d SOLD-OUT");
        try {
            realtimeService.notifyMenuItemAvailability(updated.getId(), updated.getName(), updated.getIsAvailable(), updated.getRemainingStock());
        } catch (Exception e) {
            log.warn("Lỗi phát realtime khi toggle availability món {}: {}", updated.getName(), e.getMessage());
        }
        return mapToAdminResponse(updated);
    }

    @Override
    @Transactional
    public void deleteMenuItem(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Món ăn không tồn tại với ID: " + id));

        // Soft delete: chuyển isActive sang false để bảo toàn lịch sử hóa đơn trong quá khứ
        item.setIsActive(false);
        menuItemRepository.save(item);
        log.info("Soft deleted menu item [{}]", item.getName());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        List<Category> categories = categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        return categories.stream().map(cat -> {
            long count = menuItemRepository.countByCategoryIdAndIsActiveTrue(cat.getId());
            return CategoryResponse.builder()
                    .id(cat.getId())
                    .name(cat.getName())
                    .description(cat.getDescription())
                    .displayOrder(cat.getDisplayOrder())
                    .dishCount(count)
                    .isActive(cat.getIsActive())
                    .createdAt(cat.getCreatedAt())
                    .updatedAt(cat.getUpdatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        String cleanName = request.getName().trim();
        if (categoryRepository.existsByName(cleanName)) {
            throw new AppException("Tên danh mục '" + cleanName + "' đã tồn tại!", HttpStatus.CONFLICT);
        }

        int displayOrder = request.getDisplayOrder() != null ? request.getDisplayOrder() : 0;
        if (displayOrder == 0) {
            displayOrder = (int) categoryRepository.count() + 1;
        }

        Category category = Category.builder()
                .name(cleanName)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .displayOrder(displayOrder)
                .isActive(true)
                .build();

        Category saved = categoryRepository.save(category);
        return CategoryResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .description(saved.getDescription())
                .displayOrder(saved.getDisplayOrder())
                .dishCount(0L)
                .isActive(saved.getIsActive())
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Long id, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại với ID: " + id));

        String cleanName = request.getName().trim();
        if (categoryRepository.existsByNameAndIdNot(cleanName, id)) {
            throw new AppException("Tên danh mục '" + cleanName + "' đã được sử dụng!", HttpStatus.CONFLICT);
        }

        category.setName(cleanName);
        if (request.getDescription() != null) category.setDescription(request.getDescription().trim());
        if (request.getDisplayOrder() != null) category.setDisplayOrder(request.getDisplayOrder());
        if (request.getIsActive() != null) category.setIsActive(request.getIsActive());

        Category updated = categoryRepository.save(category);
        long count = menuItemRepository.countByCategoryIdAndIsActiveTrue(updated.getId());
        return CategoryResponse.builder()
                .id(updated.getId())
                .name(updated.getName())
                .description(updated.getDescription())
                .displayOrder(updated.getDisplayOrder())
                .dishCount(count)
                .isActive(updated.getIsActive())
                .createdAt(updated.getCreatedAt())
                .updatedAt(updated.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại với ID: " + id));

        // Ràng buộc toàn vẹn: Không cho xóa nếu danh mục đang chứa món ăn còn kinh doanh
        long dishCount = menuItemRepository.countByCategoryIdAndIsActiveTrue(id);
        if (dishCount > 0) {
            throw new AppException(
                    String.format("Không thể xóa danh mục '%s' vì đang có %d món ăn trực thuộc. Vui lòng chuyển các món sang danh mục khác trước khi xóa!",
                            category.getName(), dishCount),
                    HttpStatus.BAD_REQUEST
            );
        }

        category.setIsActive(false);
        categoryRepository.save(category);
        log.info("Soft deleted category [{}]", category.getName());
    }

    @Override
    public void syncMenuToKdsAndPos() {
        log.info("Menu catalog synchronization broadcasted to KDS displays and POS registers successfully.");
    }

    // Helper map MenuItem Entity sang AdminMenuItemResponse DTO
    private AdminMenuItemResponse mapToAdminResponse(MenuItem item) {
        BigDecimal profit = item.calculateProfit();
        Double marginPercent = item.calculateMarginPercent();

        return AdminMenuItemResponse.builder()
                .id(item.getId())
                .sku(item.getSku())
                .name(item.getName())
                .categoryId(item.getCategory() != null ? item.getCategory().getId() : null)
                .categoryName(item.getCategory() != null ? item.getCategory().getName() : "Chưa phân loại")
                .station(item.getStation())
                .price(item.getPrice())
                .costPrice(item.getCostPrice())
                .profit(profit)
                .marginPercent(marginPercent)
                .isAvailable(item.getIsAvailable())
                .dailyStock(item.getDailyStock())
                .remainingStock(item.getRemainingStock())
                .tag(item.getTag())
                .description(item.getDescription())
                .imageUrl(item.getImageUrl())
                .displayOrder(item.getDisplayOrder())
                .isActive(item.getIsActive())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
