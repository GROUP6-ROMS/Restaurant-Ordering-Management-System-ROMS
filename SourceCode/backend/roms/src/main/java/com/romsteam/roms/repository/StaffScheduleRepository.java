package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Staff;
import com.romsteam.roms.entity.StaffSchedule;
import com.romsteam.roms.entity.enums.ShiftType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffScheduleRepository extends JpaRepository<StaffSchedule, Long> {

    // Tìm danh sách ca trực của nhân viên trong một ngày cụ thể (fetch staff để tránh N+1)
    @EntityGraph(attributePaths = {"staff"})
    List<StaffSchedule> findByStaffAndWorkDate(Staff staff, LocalDate workDate);

    // Lấy tất cả phân ca trong một ngày cụ thể (có join fetch Staff để tránh N+1)
    @Query("SELECT s FROM StaffSchedule s JOIN FETCH s.staff WHERE s.workDate = :workDate ORDER BY s.shiftType ASC, s.staff.fullName ASC")
    List<StaffSchedule> findByWorkDateWithStaff(@Param("workDate") LocalDate workDate);

    // Lấy tất cả phân ca trong khoảng ngày
    @Query("SELECT s FROM StaffSchedule s JOIN FETCH s.staff WHERE s.workDate BETWEEN :startDate AND :endDate ORDER BY s.workDate ASC, s.shiftType ASC")
    List<StaffSchedule> findByWorkDateBetweenWithStaff(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // Kiểm tra xem nhân viên đã được phân ca đó trong ngày đó chưa
    boolean existsByStaffAndWorkDateAndShiftType(Staff staff, LocalDate workDate, ShiftType shiftType);

    // Tìm một bản ghi phân ca cụ thể
    @EntityGraph(attributePaths = {"staff"})
    Optional<StaffSchedule> findByStaffAndWorkDateAndShiftType(Staff staff, LocalDate workDate, ShiftType shiftType);

    // Xoá phân ca cụ thể theo staff, date, shiftType
    @Modifying
    @Query("DELETE FROM StaffSchedule s WHERE s.staff.id = :staffId AND s.workDate = :workDate AND s.shiftType = :shiftType")
    void deleteByStaffIdAndWorkDateAndShiftType(@Param("staffId") Long staffId,
                                                @Param("workDate") LocalDate workDate,
                                                @Param("shiftType") ShiftType shiftType);

    // Lấy tất cả phân ca của một nhân viên (fetch staff để tránh N+1)
    @EntityGraph(attributePaths = {"staff"})
    List<StaffSchedule> findByStaffId(Long staffId);
}
