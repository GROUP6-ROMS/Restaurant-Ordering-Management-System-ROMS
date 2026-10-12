package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Staff;
import com.romsteam.roms.entity.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {

    // Tìm nhân viên theo username để xử lý đăng nhập Spring Security & JWT
    Optional<Staff> findByUsername(String username);

    // Kiểm tra username đã tồn tại chưa khi tạo mới tài khoản
    boolean existsByUsername(String username);

    // Lọc danh sách nhân viên theo vai trò (ví dụ: lấy tất cả Waiter, hoặc Kitchen)
    List<Staff> findByRole(UserRole role);

    // Đếm số lượng nhân viên theo vai trò
    long countByRole(UserRole role);

    // Đếm số nhân viên đang trực ca (isOnShift = true)
    long countByIsOnShiftTrue();

    // Tìm kiếm đa năng theo từ khóa (username, fullName, phone)
    @Query("SELECT s FROM Staff s WHERE " +
           "(:keyword IS NULL OR LOWER(s.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(s.username) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR s.phone LIKE CONCAT('%', :keyword, '%')) " +
           "AND (:role IS NULL OR s.role = :role) " +
           "AND (:isActive IS NULL OR s.isActive = :isActive) " +
           "ORDER BY s.id ASC")
    List<Staff> searchStaff(@Param("keyword") String keyword,
                            @Param("role") UserRole role,
                            @Param("isActive") Boolean isActive);
}
