package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.UpdateKitchenStatusRequest;
import com.romsteam.roms.dto.response.KitchenOrderResponse;
import com.romsteam.roms.dto.response.KitchenSummaryResponse;

import java.util.List;

public interface KitchenService {

    // Lấy toàn bộ danh sách đơn đang cần chế biến (CONFIRMED, COOKING, READY)
    List<KitchenOrderResponse> getActiveKitchenOrders();

    // Cập nhật trạng thái một món ăn cụ thể (ví dụ: tick xong món chuyển thành READY)
    KitchenOrderResponse updateItemStatus(Long itemId, UpdateKitchenStatusRequest request);

    // Cập nhật trạng thái cho toàn bộ phiếu gọi món (Bắt đầu nấu cả đơn, Xong cả đơn)
    KitchenOrderResponse updateOrderStatus(Long orderId, UpdateKitchenStatusRequest request);

    // Bật / Tắt cờ ưu tiên hỏa tốc (RUSH) cho phiếu gọi món
    KitchenOrderResponse toggleRushOrder(Long orderId);

    // Lấy thông số đo lường hiệu suất và số lượng đơn theo trạng thái
    KitchenSummaryResponse getKitchenSummary();
}
