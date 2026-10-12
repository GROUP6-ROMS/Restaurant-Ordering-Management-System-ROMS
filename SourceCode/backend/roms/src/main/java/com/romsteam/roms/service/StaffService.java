package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.*;
import com.romsteam.roms.dto.response.*;
import com.romsteam.roms.entity.enums.ShiftType;
import com.romsteam.roms.entity.enums.UserRole;

import java.time.LocalDate;
import java.util.List;

public interface StaffService {

    // 1. Quản lý Hồ sơ Nhân sự
    List<StaffResponse> getAllStaff(String search, UserRole role, Boolean isActive);

    StaffResponse getStaffById(Long id);

    StaffResponse createStaff(CreateStaffRequest request);

    StaffResponse updateStaff(Long id, UpdateStaffRequest request);

    void changePin(Long id, ChangeStaffPinRequest request);

    StaffResponse toggleActiveStatus(Long id);

    StaffSummaryResponse getStaffSummary();

    // 2. Quản lý Phân ca Trực (Shift Scheduling)
    DayScheduleSummaryResponse getDaySchedule(LocalDate date);

    List<StaffScheduleResponse> getSchedulesBetween(LocalDate startDate, LocalDate endDate);

    StaffScheduleResponse assignShift(AssignShiftRequest request);

    void removeShift(Long scheduleId);

    void removeShiftByDetails(Long staffId, LocalDate workDate, ShiftType shiftType);

    int copySchedule(LocalDate fromDate, LocalDate toDate);
}
