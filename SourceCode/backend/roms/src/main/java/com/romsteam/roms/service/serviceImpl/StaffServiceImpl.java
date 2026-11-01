package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.*;
import com.romsteam.roms.dto.response.*;
import com.romsteam.roms.entity.Staff;
import com.romsteam.roms.entity.StaffSchedule;
import com.romsteam.roms.entity.enums.ShiftType;
import com.romsteam.roms.entity.enums.UserRole;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.repository.StaffRepository;
import com.romsteam.roms.repository.StaffScheduleRepository;
import com.romsteam.roms.service.RealtimeService;
import com.romsteam.roms.service.StaffService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaffServiceImpl implements StaffService {

    private final StaffRepository staffRepository;
    private final StaffScheduleRepository staffScheduleRepository;
    private final PasswordEncoder passwordEncoder;
    private final RealtimeService realtimeService;

    // ===================================================================
    // 1. QUẢN LÝ HỒ SƠ NHÂN SỰ
    // ===================================================================

    @Override
    @Transactional(readOnly = true)
    public List<StaffResponse> getAllStaff(String search, UserRole role, Boolean isActive) {
        String keyword = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        List<Staff> staffList = staffRepository.searchStaff(keyword, role, isActive);

        LocalDate today = LocalDate.now();
        return staffList.stream()
                .map(s -> mapToStaffResponse(s, today))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public StaffResponse getStaffById(Long id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new AppException("Nhân viên không tồn tại", HttpStatus.NOT_FOUND));
        return mapToStaffResponse(staff, LocalDate.now());
    }

    @Override
    @Transactional
    public StaffResponse createStaff(CreateStaffRequest request) {
        if (staffRepository.existsByUsername(request.getUsername().trim())) {
            throw new AppException("Tên đăng nhập / Mã nhân viên '" + request.getUsername() + "' đã tồn tại!", HttpStatus.CONFLICT);
        }

        Staff staff = Staff.builder()
                .username(request.getUsername().trim())
                .pinCode(passwordEncoder.encode(request.getPinCode().trim()))
                .fullName(request.getFullName().trim())
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .role(request.getRole())
                .isActive(true)
                .isOnShift(false)
                .build();

        Staff saved = staffRepository.save(staff);
        log.info("Manager created new staff: ID={}, username={}, role={}", saved.getId(), saved.getUsername(), saved.getRole());
        return mapToStaffResponse(saved, LocalDate.now());
    }

    @Override
    @Transactional
    public StaffResponse updateStaff(Long id, UpdateStaffRequest request) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new AppException("Nhân viên không tồn tại", HttpStatus.NOT_FOUND));

        staff.setFullName(request.getFullName().trim());
        staff.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        staff.setRole(request.getRole());
        if (request.getIsActive() != null) {
            staff.setIsActive(request.getIsActive());
            if (Boolean.TRUE.equals(request.getIsActive())) {
                staff.resetFailedAttempts();
            }
        }

        Staff updated = staffRepository.save(staff);
        log.info("Manager updated staff: ID={}, fullName={}, role={}, isActive={}", updated.getId(), updated.getFullName(), updated.getRole(), updated.getIsActive());
        return mapToStaffResponse(updated, LocalDate.now());
    }

    @Override
    @Transactional
    public void changePin(Long id, ChangeStaffPinRequest request) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new AppException("Nhân viên không tồn tại", HttpStatus.NOT_FOUND));

        staff.setPinCode(passwordEncoder.encode(request.getNewPinCode().trim()));
        // Khi Quản lý cấp lại mã PIN, tự động mở khóa tài khoản và đặt lại số lần nhập sai
        staff.unlock();
        staffRepository.save(staff);
        log.info("Manager reset PIN code and unlocked staff ID={}", id);
    }

    @Override
    @Transactional
    public StaffResponse toggleActiveStatus(Long id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new AppException("Nhân viên không tồn tại", HttpStatus.NOT_FOUND));

        boolean newStatus = !Boolean.TRUE.equals(staff.getIsActive());
        staff.setIsActive(newStatus);
        if (!newStatus) {
            staff.setIsOnShift(false);
        } else {
            // Khi mở khóa lại, đặt lại số lần nhập sai PIN về 0
            staff.resetFailedAttempts();
        }

        Staff saved = staffRepository.save(staff);
        log.info("Manager toggled active status for staff ID={} -> {}", id, newStatus);
        return mapToStaffResponse(saved, LocalDate.now());
    }

    @Override
    @Transactional
    public StaffResponse unlockStaff(Long id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new AppException("Nhân viên không tồn tại", HttpStatus.NOT_FOUND));

        staff.unlock();
        Staff saved = staffRepository.save(staff);
        log.info("Manager unlocked staff ID={}, reset failed attempts to 0", id);
        return mapToStaffResponse(saved, LocalDate.now());
    }

    @Override
    @Transactional(readOnly = true)
    public StaffSummaryResponse getStaffSummary() {
        return StaffSummaryResponse.builder()
                .totalStaff(staffRepository.count())
                .onlineStaff(staffRepository.countByIsOnShiftTrue())
                .waiterCount(staffRepository.countByRole(UserRole.WAITER))
                .kitchenCount(staffRepository.countByRole(UserRole.KITCHEN))
                .cashierCount(staffRepository.countByRole(UserRole.CASHIER))
                .managerCount(staffRepository.countByRole(UserRole.MANAGER))
                .build();
    }

    // ===================================================================
    // 2. QUẢN LÝ PHÂN CA TRỰC (SHIFT SCHEDULING)
    // ===================================================================

    @Override
    @Transactional(readOnly = true)
    public DayScheduleSummaryResponse getDaySchedule(LocalDate date) {
        LocalDate targetDate = (date != null) ? date : LocalDate.now();
        List<StaffSchedule> schedules = staffScheduleRepository.findByWorkDateWithStaff(targetDate);

        List<StaffScheduleResponse> morningList = new ArrayList<>();
        List<StaffScheduleResponse> eveningList = new ArrayList<>();

        for (StaffSchedule s : schedules) {
            StaffScheduleResponse resp = mapToScheduleResponse(s);
            if (s.getShiftType() == ShiftType.MORNING) {
                morningList.add(resp);
            } else if (s.getShiftType() == ShiftType.EVENING) {
                eveningList.add(resp);
            }
        }

        return DayScheduleSummaryResponse.builder()
                .workDate(targetDate)
                .morningShift(morningList)
                .eveningShift(eveningList)
                .totalMorning(morningList.size())
                .totalEvening(eveningList.size())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffScheduleResponse> getSchedulesBetween(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new AppException("Khoảng ngày không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        return staffScheduleRepository.findByWorkDateBetweenWithStaff(startDate, endDate).stream()
                .map(this::mapToScheduleResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public StaffScheduleResponse assignShift(AssignShiftRequest request) {
        Staff staff = staffRepository.findById(request.getStaffId())
                .orElseThrow(() -> new AppException("Nhân viên không tồn tại", HttpStatus.NOT_FOUND));

        if (!Boolean.TRUE.equals(staff.getIsActive())) {
            throw new AppException("Không thể phân ca cho nhân viên đang bị khóa tài khoản!", HttpStatus.BAD_REQUEST);
        }

        if (staffScheduleRepository.existsByStaffAndWorkDateAndShiftType(staff, request.getWorkDate(), request.getShiftType())) {
            throw new AppException("Nhân viên [" + staff.getFullName() + "] đã có lịch trực ca " + request.getShiftType().getLabel() + " vào ngày này rồi!", HttpStatus.CONFLICT);
        }

        StaffSchedule schedule = StaffSchedule.builder()
                .staff(staff)
                .workDate(request.getWorkDate())
                .shiftType(request.getShiftType())
                .build();

        StaffSchedule saved = staffScheduleRepository.save(schedule);
        log.info("Assigned shift: staffId={}, date={}, shift={}", staff.getId(), request.getWorkDate(), request.getShiftType());
        return mapToScheduleResponse(saved);
    }

    @Override
    @Transactional
    public void removeShift(Long scheduleId) {
        StaffSchedule schedule = staffScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new AppException("Bản ghi phân ca không tồn tại", HttpStatus.NOT_FOUND));
        staffScheduleRepository.delete(schedule);
        log.info("Deleted schedule ID={}", scheduleId);
    }

    @Override
    @Transactional
    public void removeShiftByDetails(Long staffId, LocalDate workDate, ShiftType shiftType) {
        staffScheduleRepository.deleteByStaffIdAndWorkDateAndShiftType(staffId, workDate, shiftType);
        log.info("Deleted schedule by details: staffId={}, date={}, shift={}", staffId, workDate, shiftType);
    }

    @Override
    @Transactional
    public int copySchedule(LocalDate fromDate, LocalDate toDate) {
        if (fromDate.equals(toDate)) {
            throw new AppException("Ngày nguồn và ngày đích không được trùng nhau!", HttpStatus.BAD_REQUEST);
        }

        List<StaffSchedule> sourceSchedules = staffScheduleRepository.findByWorkDateWithStaff(fromDate);
        if (sourceSchedules.isEmpty()) {
            throw new AppException("Ngày nguồn (" + fromDate + ") chưa có dữ liệu phân ca nào để sao chép!", HttpStatus.BAD_REQUEST);
        }

        int copiedCount = 0;
        for (StaffSchedule source : sourceSchedules) {
            boolean exists = staffScheduleRepository.existsByStaffAndWorkDateAndShiftType(source.getStaff(), toDate, source.getShiftType());
            if (!exists && Boolean.TRUE.equals(source.getStaff().getIsActive())) {
                StaffSchedule newSchedule = StaffSchedule.builder()
                        .staff(source.getStaff())
                        .workDate(toDate)
                        .shiftType(source.getShiftType())
                        .build();
                staffScheduleRepository.save(newSchedule);
                copiedCount++;
            }
        }

        log.info("Copied {} schedule records from {} to {}", copiedCount, fromDate, toDate);
        return copiedCount;
    }

    // ===================================================================
    // HELPER MAPPERS
    // ===================================================================

    private StaffResponse mapToStaffResponse(Staff s, LocalDate today) {
        List<StaffSchedule> todaySchedules = staffScheduleRepository.findByStaffAndWorkDate(s, today);
        String shiftInfo = formatShiftInfo(todaySchedules);

        boolean isLocked = s.isLocked();
        return StaffResponse.builder()
                .id(s.getId())
                .username(s.getUsername())
                .fullName(s.getFullName())
                .phone(s.getPhone())
                .email(s.getEmail())
                .role(s.getRole())
                .roleLabel(getRoleLabel(s.getRole()))
                .isActive(s.getIsActive())
                .isOnShift(s.getIsOnShift())
                .failedPinAttempts(s.getFailedPinAttempts() != null ? s.getFailedPinAttempts() : 0)
                .isLocked(isLocked)
                .lockedAt(s.getLockedAt())
                .currentShift(shiftInfo)
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }

    private StaffScheduleResponse mapToScheduleResponse(StaffSchedule s) {
        Staff staff = s.getStaff();
        return StaffScheduleResponse.builder()
                .id(s.getId())
                .staffId(staff.getId())
                .username(staff.getUsername())
                .fullName(staff.getFullName())
                .phone(staff.getPhone())
                .role(staff.getRole())
                .roleLabel(getRoleLabel(staff.getRole()))
                .isOnShift(staff.getIsOnShift())
                .workDate(s.getWorkDate())
                .shiftType(s.getShiftType())
                .shiftLabel(s.getShiftType().getLabel())
                .startTime(s.getShiftType().getStartTime())
                .endTime(s.getShiftType().getEndTime())
                .build();
    }

    private String getRoleLabel(UserRole role) {
        if (role == null) return "Không xác định";
        return switch (role) {
            case MANAGER -> "Quản Lý";
            case CASHIER -> "Thu Ngân";
            case WAITER -> "Phục Vụ";
            case KITCHEN -> "Bếp";
        };
    }

    private String formatShiftInfo(List<StaffSchedule> schedules) {
        if (schedules == null || schedules.isEmpty()) {
            return "Nghỉ ca / Chưa phân ca";
        }
        boolean hasMorning = schedules.stream().anyMatch(s -> s.getShiftType() == ShiftType.MORNING);
        boolean hasEvening = schedules.stream().anyMatch(s -> s.getShiftType() == ShiftType.EVENING);

        if (hasMorning && hasEvening) {
            return "Cả 2 Ca (Sáng & Tối)";
        } else if (hasMorning) {
            return "Ca Sáng (06:00 - 14:00)";
        } else {
            return "Ca Chiều / Tối (14:00 - 22:00)";
        }
    }

    @Override
    @Transactional
    public StaffResponse toggleShiftStatus(Long id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new AppException("Nhân viên không tồn tại", HttpStatus.NOT_FOUND));

        boolean newStatus = !Boolean.TRUE.equals(staff.getIsOnShift());
        staff.setIsOnShift(newStatus);
        Staff saved = staffRepository.save(staff);

        if (realtimeService != null) {
            try {
                realtimeService.publish("/topic/staff", RomsRealtimeEvent.builder()
                        .type(newStatus ? "STAFF_LOGIN" : "STAFF_LOGOUT")
                        .status(newStatus ? "ONLINE" : "OFFLINE")
                        .note("Quản lý đã chuyển trạng thái ca của " + staff.getFullName() + ": " + (newStatus ? "Trực ca" : "Ngoại tuyến"))
                        .payload(staff.getUsername())
                        .build());
            } catch (Exception e) {
                log.warn("[Realtime] Không thể phát sự kiện toggleShiftStatus: {}", e.getMessage());
            }
        }

        return mapToStaffResponse(saved, LocalDate.now());
    }

    @Override
    @Transactional
    public int resetAllShifts(String currentManagerUsername) {
        List<Staff> staffList = staffRepository.findAll();
        int count = 0;
        for (Staff s : staffList) {
            // Không ngắt phiên của chính quản lý đang thực hiện thao tác
            if (currentManagerUsername != null && currentManagerUsername.equalsIgnoreCase(s.getUsername())) {
                continue;
            }
            if (Boolean.TRUE.equals(s.getIsOnShift())) {
                s.setIsOnShift(false);
                staffRepository.save(s);
                count++;
            }
        }

        if (realtimeService != null) {
            try {
                realtimeService.publish("/topic/staff", RomsRealtimeEvent.builder()
                        .type("SHIFT_CLOSED")
                        .status("OFFLINE")
                        .note("Quản lý đã đặt lại toàn bộ ca trực (" + count + " nhân sự về Ngoại tuyến)")
                        .payload("RESET_ALL")
                        .build());
            } catch (Exception e) {
                log.warn("[Realtime] Không thể phát sự kiện resetAllShifts: {}", e.getMessage());
            }
        }

        log.info("Manager {} reset {} staffs to off-shift", currentManagerUsername, count);
        return count;
    }
}
