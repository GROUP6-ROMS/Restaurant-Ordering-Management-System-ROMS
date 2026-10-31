package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.CreatePayOsPaymentRequest;
import com.romsteam.roms.dto.response.PayOsPaymentResponse;

import java.util.Map;

/**
 * Service quản lý tích hợp thanh toán VietQR động qua cổng payOS (Open Banking NAPAS 24/7).
 */
public interface PayOsService {

    /**
     * 1. Tạo link và mã VietQR thanh toán động cho bàn ăn
     */
    PayOsPaymentResponse createPaymentLink(Long tableId, CreatePayOsPaymentRequest request, String cashierUsername);

    /**
     * 2. Xử lý Webhook tự động khi khách hàng chuyển khoản thành công
     */
    Map<String, Object> handleWebhook(Map<String, Object> webhookPayload);

    /**
     * 3. Tra cứu trạng thái thanh toán theo orderCode (Polling fallback)
     */
    PayOsPaymentResponse checkPaymentStatus(Long orderCode);

    /**
     * 4. Xác thực chữ ký số HMAC-SHA256 của Webhook dữ liệu gửi từ payOS
     */
    boolean verifyWebhookSignature(Map<String, Object> data, String signature);
}
