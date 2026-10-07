package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Staff;
import com.romsteam.roms.entity.StaffSchedule;
import com.romsteam.roms.entity.enums.ShiftType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffScheduleRepository extends JpaRepository<StaffSchedule, Long> {
    // Tìm danh sách ca trực của nhân viên trong một ngày cụ thể (phục vụ kiểm tra điều kiện đăng nhập)
    List<StaffSchedule> findByStaffAndWorkDate(Staff staff, LocalDate workDate);
}
