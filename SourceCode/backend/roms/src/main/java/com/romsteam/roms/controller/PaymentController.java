package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.CreatePayOsPaymentRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.PayOsPaymentResponse;
import com.romsteam.roms.service.PayOsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment/payos")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payment Management - PayOS", description = "Các API thanh toán VietQR động thời gian thực qua cổng Open Banking payOS")
public class PaymentController {

    private final PayOsService payOsService;

    /**
     * 1. POST /api/payment/payos/create-link
     * Tạo mã QR chuyển khoản động chuẩn VietQR NAPAS 24/7
     */
    @PostMapping("/create-link")
    @PreAuthorize("hasAnyRole('CASHIER', 'MANAGER', 'ADMIN', 'WAITER', 'CUSTOMER')")
    @Operation(summary = "Tạo mã VietQR thanh toán động cho bàn ăn")
    public ResponseEntity<ApiResponse<PayOsPaymentResponse>> createPaymentLink(
            @Valid @RequestBody CreatePayOsPaymentRequest request,
            Authentication authentication) {
        String username = (authentication != null) ? authentication.getName() : null;
        PayOsPaymentResponse response = payOsService.createPaymentLink(request.getTableId(), request, username);
        return ResponseEntity.ok(ApiResponse.success(response, "Khởi tạo mã VietQR thanh toán thành công!"));
    }

    /**
     * 2. POST /api/payment/payos/webhook
     * Webhook công khai từ payOS gọi khi tài khoản ngân hàng nhận được tiền
     */
    @PostMapping("/webhook")
    @Operation(summary = "Webhook tự động từ payOS khi khách chuyển khoản thành công")
    public ResponseEntity<Map<String, Object>> handleWebhook(@RequestBody Map<String, Object> webhookPayload) {
        log.info("[PaymentController] Tiếp nhận Webhook từ payOS");
        Map<String, Object> result = payOsService.handleWebhook(webhookPayload);
        return ResponseEntity.ok(result);
    }

    /**
     * 3. GET /api/payment/payos/status/{orderCode}
     * Tra cứu trạng thái đơn hàng (Polling dự phòng và kiểm tra tức thì)
     */
    @GetMapping("/status/{orderCode}")
    @PreAuthorize("hasAnyRole('CASHIER', 'MANAGER', 'ADMIN', 'WAITER', 'CUSTOMER')")
    @Operation(summary = "Kiểm tra trạng thái thanh toán đơn hàng payOS")
    public ResponseEntity<ApiResponse<PayOsPaymentResponse>> checkPaymentStatus(@PathVariable Long orderCode) {
        PayOsPaymentResponse response = payOsService.checkPaymentStatus(orderCode);
        return ResponseEntity.ok(ApiResponse.success(response, "Truy vấn trạng thái thanh toán thành công!"));
    }
}
