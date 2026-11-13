package com.romsteam.roms.service;

import com.romsteam.roms.dto.response.RomsRealtimeEvent;

/**
 * Service quản lý phát thông báo thời gian thực qua WebSocket STOMP
 */
public interface RealtimeService {

    // 1. Phát sự kiện chung tới một topic chỉ định
    void publish(String destination, RomsRealtimeEvent event);

    // 2. Thông báo thay đổi trạng thái bàn (Sơ đồ sảnh, Thu ngân, Khách tại bàn)
    void notifyTableUpdate(Long tableId, String tableNumber, String status, String note);

    // 3. Thông báo đơn món mới gửi xuống Bếp KDS hoặc cập nhật chế biến
    void notifyKitchenOrder(Long orderId, String tableNumber, String action, Object data);

    // 4. Thông báo cập nhật trạng thái món ăn (COOKING, READY, SERVED, CANCELLED)
    void notifyOrderStatus(Long orderId, Long tableId, String tableNumber, String status, Object itemsData);

    // 5. Thông báo chuông gọi phục vụ / yêu cầu tính tiền
    void notifyServiceRequest(Long requestId, Long tableId, String tableNumber, String requestType, String note);

    // 6. Thông báo thanh toán hóa đơn / in phiếu tạm tính / giải phóng bàn
    void notifyPaymentUpdate(Long billId, Long tableId, String tableNumber, String paymentStatus, Object billData);

    // 7. Thông báo chuyển đổi trạng thái phục vụ / hết món 86'd
    void notifyMenuItemAvailability(Long menuItemId, String menuItemName, Boolean isAvailable, Integer remainingStock);
}
