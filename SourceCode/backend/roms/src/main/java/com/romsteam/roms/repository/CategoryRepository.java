package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    // Lấy danh sách danh mục đang hoạt động, sắp xếp theo thứ tự hiển thị tăng dần
    List<Category> findByIsActiveTrueOrderByDisplayOrderAsc();

    // Kiểm tra trùng tên danh mục khi thêm mới
    boolean existsByName(String name);

    // Kiểm tra trùng tên danh mục khi cập nhật (ngoại trừ chính ID của danh mục đang sửa)
    boolean existsByNameAndIdNot(String name, Long id);
}

