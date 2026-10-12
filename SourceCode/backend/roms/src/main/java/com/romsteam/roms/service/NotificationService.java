package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.CustomerCallWaiterRequest;
import com.romsteam.roms.dto.response.AdminNotificationItemResponse;
import com.romsteam.roms.dto.response.AdminNotificationSummaryResponse;

public interface NotificationService {

    /**
     * Lấy toàn bộ thông báo đang chờ xử lý cho Quản lý (Bàn gọi hỗ trợ + Đơn đặt bàn mới)
     */
    AdminNotificationSummaryResponse getAdminNotifications();

    /**
     * Quản lý hoặc nhân viên đánh dấu đã xử lý xong yêu cầu hỗ trợ tại bàn
     */
    void resolveAssistanceRequest(Long requestId);

    /**
     * Khách hàng tại bàn gửi yêu cầu gọi nhân viên hỗ trợ
     */
    AdminNotificationItemResponse createCustomerAssistanceRequest(Long tableId, CustomerCallWaiterRequest request);

    /**
     * Tạo thông báo thử nghiệm nhanh để Quản lý kiểm tra chuông
     */
    AdminNotificationItemResponse createTestAssistanceRequest(Long tableId, String note);
}
