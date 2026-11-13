package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.AssignTableReservationRequest;
import com.romsteam.roms.dto.request.CancelReservationRequest;
import com.romsteam.roms.dto.request.UpdateReservationItemsRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.ReservationResponse;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.entity.enums.ReservationStatus;
import com.romsteam.roms.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller dành riêng cho Quản lý nhà hàng tiếp nhận và điều phối đặt bàn
 */
@RestController
@RequestMapping("/api/admin/reservations")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class AdminReservationController {

    private final ReservationService reservationService;

    /**
     * 1. Lấy danh sách phiếu đặt bàn kèm bộ lọc trạng thái, ngày hẹn và tìm kiếm
     * GET /api/admin/reservations?status=PENDING&date=2026-10-09&keyword=0909
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getReservations(
            @RequestParam(required = false) ReservationStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String keyword) {
        List<ReservationResponse> list = reservationService.getReservations(status, date, keyword);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách phiếu đặt bàn thành công"));
    }

    /**
     * 2. Lấy thông tin chi tiết của 1 phiếu đặt bàn
     * GET /api/admin/reservations/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReservationResponse>> getReservationById(@PathVariable Long id) {
        ReservationResponse res = reservationService.getReservationById(id);
        return ResponseEntity.ok(ApiResponse.success(res, "Lấy chi tiết đơn đặt bàn thành công"));
    }

    /**
     * 3. Gợi ý các bàn ăn trống phù hợp để Quản lý chọn xếp bàn
     * GET /api/admin/reservations/{id}/available-tables
     */
    @GetMapping("/{id}/available-tables")
    public ResponseEntity<ApiResponse<List<TableResponse>>> getAvailableTables(@PathVariable Long id) {
        List<TableResponse> tables = reservationService.getAvailableTablesForReservation(id);
        return ResponseEntity.ok(ApiResponse.success(tables, "Lấy danh sách bàn khả dụng thành công"));
    }

    /**
     * 4. Quản lý xác nhận cuộc gọi và xếp bàn cho khách
     * PUT /api/admin/reservations/{id}/assign-table
     */
    @PutMapping("/{id}/assign-table")
    public ResponseEntity<ApiResponse<ReservationResponse>> assignTable(
            @PathVariable Long id,
            @Valid @RequestBody AssignTableReservationRequest request) {
        ReservationResponse updated = reservationService.assignTableToReservation(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Xếp bàn và xác nhận giữ chỗ thành công cho khách hàng!"));
    }

    /**
     * 5. Quản lý từ chối hoặc hủy đơn đặt bàn
     * PUT /api/admin/reservations/{id}/cancel
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<ReservationResponse>> cancelReservation(
            @PathVariable Long id,
            @Valid @RequestBody CancelReservationRequest request) {
        ReservationResponse cancelled = reservationService.cancelReservation(id, request);
        return ResponseEntity.ok(ApiResponse.success(cancelled, "Đã cập nhật hủy đơn đặt bàn thành công"));
    }

    /**
     * 6. Quản lý kiểm tra và cập nhật (thêm / sửa / xóa) danh sách món đặt trước của bàn
     * PUT /api/admin/reservations/{id}/items
     */
    @PutMapping("/{id}/items")
    public ResponseEntity<ApiResponse<ReservationResponse>> updateReservationItems(
            @PathVariable Long id,
            @Valid @RequestBody UpdateReservationItemsRequest request) {
        ReservationResponse updated = reservationService.updateReservationItems(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật danh sách món đặt trước thành công!"));
    }

    /**
     * 7. Quản lý check-in đón khách đặt bàn vào ngồi ăn (chuyển sang COMPLETED, mở DiningSession, nạp món đặt trước)
     * POST /api/admin/reservations/{id}/check-in
     */
    @PostMapping("/{id}/check-in")
    public ResponseEntity<ApiResponse<ReservationResponse>> checkInReservation(@PathVariable Long id) {
        ReservationResponse res = reservationService.checkInReservation(id);
        return ResponseEntity.ok(ApiResponse.success(res, "Check-in đón khách đặt bàn thành công! Đã mở phiên ăn và nạp món đặt trước vào hệ thống."));
    }
}
