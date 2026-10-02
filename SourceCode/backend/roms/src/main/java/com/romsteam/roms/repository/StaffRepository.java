package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Staff;
import com.romsteam.roms.entity.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
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
}

