package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.*;
import com.romsteam.roms.dto.response.*;
import com.romsteam.roms.entity.enums.ShiftType;
import com.romsteam.roms.entity.enums.UserRole;
import com.romsteam.roms.service.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller trọn bộ REST API phục vụ màn hình Quản Lý Nhân Sự & Phân Ca (/admin/staff)
 */
@RestController
@RequestMapping("/api/admin/staff")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class AdminStaffController {

    private final StaffService staffService;

    // ===================================================================
    // 1. QUẢN LÝ HỒ SƠ NHÂN SỰ
    // ===================================================================

    // 1.1. GET /api/admin/staff/summary - Lấy số liệu 6 thẻ KPI tổng quan nhân sự
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<StaffSummaryResponse>> getStaffSummary() {
        StaffSummaryResponse summary = staffService.getStaffSummary();
        return ResponseEntity.ok(ApiResponse.success(summary, "Lấy số liệu KPI nhân sự thành công!"));
    }

    // 1.2. GET /api/admin/staff - Lấy danh sách nhân viên có tìm kiếm & lọc theo vai trò, trạng thái
    @GetMapping
    public ResponseEntity<ApiResponse<List<StaffResponse>>> getAllStaff(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) Boolean isActive
    ) {
        List<StaffResponse> staffList = staffService.getAllStaff(search, role, isActive);
        return ResponseEntity.ok(ApiResponse.success(staffList, "Lấy danh sách nhân viên thành công!"));
    }

    // 1.3. GET /api/admin/staff/{id} - Lấy chi tiết thông tin một nhân viên
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StaffResponse>> getStaffById(@PathVariable Long id) {
        StaffResponse staff = staffService.getStaffById(id);
        return ResponseEntity.ok(ApiResponse.success(staff, "Lấy thông tin nhân viên thành công!"));
    }

    // 1.4. POST /api/admin/staff - Tạo mới tài khoản nhân viên (Mã PIN được băm BCrypt)
    @PostMapping
    public ResponseEntity<ApiResponse<StaffResponse>> createStaff(@Valid @RequestBody CreateStaffRequest request) {
        StaffResponse created = staffService.createStaff(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Thêm nhân viên mới thành công!"));
    }

    // 1.5. PUT /api/admin/staff/{id} - Cập nhật hồ sơ nhân viên (Họ tên, SĐT, Vai trò, Trạng thái)
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StaffResponse>> updateStaff(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStaffRequest request
    ) {
        StaffResponse updated = staffService.updateStaff(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật hồ sơ nhân viên thành công!"));
    }

    // 1.6. PUT /api/admin/staff/{id}/pin - Đổi / Reset mã PIN 6 số cho nhân viên
    @PutMapping("/{id}/pin")
    public ResponseEntity<ApiResponse<Void>> changePin(
            @PathVariable Long id,
            @Valid @RequestBody ChangeStaffPinRequest request
    ) {
        staffService.changePin(id, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Đổi mã PIN nhân viên thành công!"));
    }

    // 1.7. PATCH /api/admin/staff/{id}/toggle-status - Khóa / Mở khóa tài khoản nhân viên
    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<StaffResponse>> toggleActiveStatus(@PathVariable Long id) {
        StaffResponse updated = staffService.toggleActiveStatus(id);
        String msg = Boolean.TRUE.equals(updated.getIsActive())
                ? "Đã kích hoạt lại tài khoản nhân viên!"
                : "Đã tạm khóa tài khoản nhân viên!";
        return ResponseEntity.ok(ApiResponse.success(updated, msg));
    }

    // 1.8. PATCH /api/admin/staff/{id}/unlock - Quản lý mở khóa tài khoản nhân viên bị khóa do nhập sai PIN 5 lần
    @PatchMapping("/{id}/unlock")
    public ResponseEntity<ApiResponse<StaffResponse>> unlockStaff(@PathVariable Long id) {
        StaffResponse updated = staffService.unlockStaff(id);
        return ResponseEntity.ok(ApiResponse.success(updated, "Đã mở khóa tài khoản và đặt lại số lần thử mã PIN!"));
    }

    // ===================================================================
    // 2. QUẢN LÝ PHÂN CA TRỰC (SHIFT SCHEDULING)
    // ===================================================================

    // 2.1. GET /api/admin/staff/schedules - Lấy toàn bộ phân ca của một ngày (Ca Sáng & Ca Tối)
    @GetMapping("/schedules")
    public ResponseEntity<ApiResponse<DayScheduleSummaryResponse>> getDaySchedule(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        DayScheduleSummaryResponse daySchedule = staffService.getDaySchedule(date);
        return ResponseEntity.ok(ApiResponse.success(daySchedule, "Lấy lịch phân ca ngày thành công!"));
    }

    // 2.2. GET /api/admin/staff/schedules/range - Lấy phân ca theo khoảng ngày (cho tuần / tháng)
    @GetMapping("/schedules/range")
    public ResponseEntity<ApiResponse<List<StaffScheduleResponse>>> getSchedulesBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        List<StaffScheduleResponse> schedules = staffService.getSchedulesBetween(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(schedules, "Lấy lịch phân ca theo khoảng ngày thành công!"));
    }

    // 2.3. POST /api/admin/staff/schedules - Phân ca cho nhân viên vào ngày & ca cụ thể
    @PostMapping("/schedules")
    public ResponseEntity<ApiResponse<StaffScheduleResponse>> assignShift(
            @Valid @RequestBody AssignShiftRequest request
    ) {
        StaffScheduleResponse assigned = staffService.assignShift(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(assigned, "Phân ca làm việc cho nhân viên thành công!"));
    }

    // 2.4. DELETE /api/admin/staff/schedules/{id} - Xóa phân ca theo ID bản ghi
    @DeleteMapping("/schedules/{id}")
    public ResponseEntity<ApiResponse<Void>> removeShift(@PathVariable Long id) {
        staffService.removeShift(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã hủy ca trực của nhân viên!"));
    }

    // 2.5. DELETE /api/admin/staff/schedules - Xóa phân ca theo thông tin chi tiết (staffId, workDate, shiftType)
    @DeleteMapping("/schedules")
    public ResponseEntity<ApiResponse<Void>> removeShiftByDetails(
            @RequestParam Long staffId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate workDate,
            @RequestParam ShiftType shiftType
    ) {
        staffService.removeShiftByDetails(staffId, workDate, shiftType);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã hủy ca trực của nhân viên!"));
    }

    // 2.6. POST /api/admin/staff/schedules/copy - Sao chép toàn bộ lịch phân ca từ một ngày sang ngày khác
    @PostMapping("/schedules/copy")
    public ResponseEntity<ApiResponse<Integer>> copySchedule(
            @Valid @RequestBody CopyScheduleRequest request
    ) {
        int count = staffService.copySchedule(request.getFromDate(), request.getToDate());
        return ResponseEntity.ok(ApiResponse.success(count, "Đã sao chép thành công " + count + " phân ca làm việc!"));
    }
}
