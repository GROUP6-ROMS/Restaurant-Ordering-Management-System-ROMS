package com.romsteam.roms.repository;

import com.romsteam.roms.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    // Lay cac mon an thuoc ve 1 danh muc cu the
    List<MenuItem> findByCategoryIdAndIsActiveTrue(Long categoryId);

    // BR-04: Lay cac mon dang cho phep ban (dang bat kinh doanh va con hang)
    List<MenuItem> findByIsAvailableTrueAndIsActiveTrue();
}
