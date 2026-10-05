package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    // Lay danh muc dang hoat dong, sap xep theo thu tu hien thi tu nho den lon
    List<Category> findByIsActiveTrueOrderByDisplayOrderAsc();

    // Kiem tra trung ten danh muc khi them moi
    boolean existsByName(String name);
}
