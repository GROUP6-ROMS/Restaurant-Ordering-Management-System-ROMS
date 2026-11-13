package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.CreateReservationRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.ReservationResponse;
import com.romsteam.roms.dto.response.ZoneResponse;
import com.romsteam.roms.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller công khai dành cho thực khách đặt bàn trước trên trang web ROMS
 */
@RestController
@RequestMapping("/api/customer/reservations")
@RequiredArgsConstructor
public class CustomerReservationController {

    private final ReservationService reservationService;

    /**
     * 1. Lấy danh sách các phân khu bàn ăn động từ CSDL
     * GET /api/customer/reservations/zones
     */
    @GetMapping("/zones")
    public ResponseEntity<ApiResponse<List<ZoneResponse>>> getActiveZones() {
        List<ZoneResponse> zones = reservationService.getActiveZones();
        return ResponseEntity.ok(ApiResponse.success(zones, "Lấy danh sách khu vực bàn thành công"));
    }

    /**
     * 2. Thực khách gửi yêu cầu đặt bàn (trạng thái PENDING)
     * POST /api/customer/reservations
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ReservationResponse>> createReservation(
            @Valid @RequestBody CreateReservationRequest request) {
        ReservationResponse response = reservationService.createCustomerReservation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Yêu cầu đặt bàn của bạn đã được tiếp nhận! Quản lý sẽ gọi điện xác nhận trong ít phút."));
    }

    /**
     * 3. Thực khách tra cứu tiến độ / trạng thái đơn đặt bàn bằng Mã đặt chỗ hoặc Số điện thoại
     * GET /api/customer/reservations/lookup?code=RES-...&phone=0912...
     */
    @GetMapping("/lookup")
    public ResponseEntity<ApiResponse<ReservationResponse>> lookupReservation(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String phone) {
        ReservationResponse response = reservationService.lookupReservation(code, phone);
        return ResponseEntity.ok(ApiResponse.success(response, "Tra cứu thông tin đơn đặt bàn thành công"));
    }
}
