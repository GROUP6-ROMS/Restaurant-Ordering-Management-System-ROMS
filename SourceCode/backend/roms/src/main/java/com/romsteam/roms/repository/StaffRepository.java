package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Staff;
import com.romsteam.roms.entity.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {

    // Tim nhan vien theo username de xu ly dang nhap Spring Security & JWT
    Optional<Staff> findByUsername(String username);

    // Kiem tra username da ton tai chua khi tao moi tai khoan
    boolean existsByUsername(String username);

    // Loc danh sach nhan vien theo vai tro (vi du: lay tat ca Waiter, hoac Kitchen)
    List<Staff> findByRole(UserRole role);
}

