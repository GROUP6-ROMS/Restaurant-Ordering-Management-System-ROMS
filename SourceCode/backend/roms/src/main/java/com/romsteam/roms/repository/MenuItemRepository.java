package com.romsteam.roms.repository;

import com.romsteam.roms.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    // Lấy toàn bộ món ăn còn kinh doanh (chưa bị xóa mềm), xếp ưu tiên món không khoá lên đầu
    @Query("SELECT m FROM MenuItem m WHERE m.isActive = true " +
           "ORDER BY CASE WHEN (m.isAvailable = true AND (m.remainingStock IS NULL OR m.remainingStock > 0)) THEN 0 ELSE 1 END ASC, " +
           "m.displayOrder ASC, m.id DESC")
    List<MenuItem> findByIsActiveTrueOrderByDisplayOrderAsc();

    // Lấy các món ăn đang cho phép bán (đang kinh doanh và còn hàng), ưu tiên còn tồn kho lên đầu
    @Query("SELECT m FROM MenuItem m WHERE m.isActive = true AND m.isAvailable = true " +
           "ORDER BY CASE WHEN (m.remainingStock IS NULL OR m.remainingStock > 0) THEN 0 ELSE 1 END ASC, " +
           "m.displayOrder ASC, m.id DESC")
    List<MenuItem> findByIsAvailableTrueAndIsActiveTrue();

    // Lấy các món ăn thuộc về 1 danh mục cụ thể
    List<MenuItem> findByCategoryIdAndIsActiveTrue(Long categoryId);

    // Tìm món ăn theo mã SKU
    Optional<MenuItem> findBySkuAndIsActiveTrue(String sku);

    // Kiểm tra mã SKU đã tồn tại trong CSDL chưa
    boolean existsBySku(String sku);

    // Kiểm tra mã SKU đã tồn tại ở món khác chưa (dùng khi cập nhật món)
    boolean existsBySkuAndIdNot(String sku, Long id);

    // Đếm số lượng món ăn trực thuộc một danh mục
    long countByCategoryIdAndIsActiveTrue(Long categoryId);

    // Đếm số lượng món đang phục vụ (isAvailable = true và isActive = true)
    long countByIsAvailableTrueAndIsActiveTrue();

    // Đếm số lượng món tạm ngưng / 86'd (isAvailable = false và isActive = true)
    long countByIsAvailableFalseAndIsActiveTrue();

    /**
     * Truy vấn tìm kiếm lọc đa tiêu chí linh hoạt (Multi-criteria Filter):
     * Hỗ trợ tìm kiếm theo từ khóa (Tên hoặc SKU), lọc theo Danh mục, Trạm xử lý và Trạng thái còn hàng.
     */
    @Query("SELECT m FROM MenuItem m WHERE m.isActive = true " +
           "AND (:categoryId IS NULL OR m.category.id = :categoryId) " +
           "AND (:station IS NULL OR m.station = :station) " +
           "AND (:isAvailable IS NULL OR m.isAvailable = :isAvailable) " +
           "AND (:keyword IS NULL OR LOWER(m.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(m.sku) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY CASE WHEN (m.isAvailable = true AND (m.remainingStock IS NULL OR m.remainingStock > 0)) THEN 0 ELSE 1 END ASC, m.displayOrder ASC, m.id DESC")
    List<MenuItem> searchMenuItems(
            @Param("categoryId") Long categoryId,
            @Param("station") String station,
            @Param("isAvailable") Boolean isAvailable,
            @Param("keyword") String keyword
    );
}

