package com.romsteam.roms.repository;

import com.romsteam.roms.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    // Lấy các món ăn thuộc về 1 danh mục cụ thể
    List<MenuItem> findByCategoryIdAndIsActiveTrue(Long categoryId);

    // BR-04: Lấy các món đang cho phép bán (đang bật kinh doanh và còn hàng)
    List<MenuItem> findByIsAvailableTrueAndIsActiveTrue();
}
