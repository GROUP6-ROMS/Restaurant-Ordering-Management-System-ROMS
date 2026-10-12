package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.CustomerCallServiceRequest;
import com.romsteam.roms.dto.request.CustomerPlaceOrderRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.CustomerMenuResponse;
import com.romsteam.roms.dto.response.CustomerOrderTrackingResponse;
import com.romsteam.roms.service.CustomerDiningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller phục vụ toàn bộ luồng thực khách dùng bữa tại bàn quét mã QR:
 * - Xem thực đơn phân loại trực tiếp từ CSDL
 * - Đặt món tại bàn (tự động khởi tạo phiên ăn và gửi sang Bếp KDS)
 * - Theo dõi tiến độ đĩa món thời gian thực (Pending, Cooking, Ready, Served)
 * - Bấm chuông gọi phục vụ / yêu cầu hỗ trợ
 * - Yêu cầu tính tiền gửi sang quầy Thu ngân POS
 */
@RestController
@RequestMapping("/api/customer/dining")
@RequiredArgsConstructor
public class CustomerDiningController {

    private final CustomerDiningService customerDiningService;

    /**
     * 1. Lấy toàn bộ danh mục thực đơn và món ăn đang phục vụ
     * GET /api/customer/dining/menu
     */
    @GetMapping("/menu")
    public ResponseEntity<ApiResponse<List<CustomerMenuResponse>>> getCustomerMenu() {
        List<CustomerMenuResponse> menu = customerDiningService.getCustomerMenu();
        return ResponseEntity.ok(ApiResponse.success(menu, "Lấy danh mục thực đơn thành công"));
    }

    /**
     * 2. Thực khách gửi đơn gọi món tại bàn
     * POST /api/customer/dining/orders
     */
    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<CustomerOrderTrackingResponse>> placeOrder(
            @Valid @RequestBody CustomerPlaceOrderRequest request) {
        CustomerOrderTrackingResponse response = customerDiningService.placeOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Đặt món thành công! Đơn hàng đã được chuyển tới Bếp & Bar."));
    }

    /**
     * 3. Theo dõi tiến độ đĩa món và hóa đơn tạm tính theo bàn
     * GET /api/customer/dining/tracking?tableId=1&tableNumber=01
     */
    @GetMapping("/tracking")
    public ResponseEntity<ApiResponse<CustomerOrderTrackingResponse>> getOrderTracking(
            @RequestParam(required = false) Long tableId,
            @RequestParam(required = false) String tableNumber) {
        CustomerOrderTrackingResponse response = customerDiningService.getOrderTracking(tableId, tableNumber);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin tiến độ món ăn thành công"));
    }

    /**
     * 4. Bấm chuông gọi nhân viên phục vụ tại bàn
     * POST /api/customer/dining/call-waiter
     */
    @PostMapping("/call-waiter")
    public ResponseEntity<ApiResponse<Map<String, Object>>> callWaiter(
            @RequestBody CustomerCallServiceRequest request) {
        Map<String, Object> result = customerDiningService.callWaiter(request);
        return ResponseEntity.ok(ApiResponse.success(result, (String) result.getOrDefault("message", "Đã gửi yêu cầu tới phục vụ")));
    }

    /**
     * 5. Yêu cầu tính tiền gửi tới quầy Thu ngân POS
     * POST /api/customer/dining/request-payment?tableId=1&tableNumber=01&paymentMethod=BANK_TRANSFER
     */
    @PostMapping("/request-payment")
    public ResponseEntity<ApiResponse<Map<String, Object>>> requestPayment(
            @RequestParam(required = false) Long tableId,
            @RequestParam(required = false) String tableNumber,
            @RequestParam(required = false, defaultValue = "CASH") String paymentMethod) {
        Map<String, Object> result = customerDiningService.requestPayment(tableId, tableNumber, paymentMethod);
        return ResponseEntity.ok(ApiResponse.success(result, (String) result.getOrDefault("message", "Đã gửi yêu cầu tính tiền")));
    }
}
