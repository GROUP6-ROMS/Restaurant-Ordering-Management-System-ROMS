package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.BatchKitchenItemRushRequest;
import com.romsteam.roms.dto.request.BatchKitchenItemStatusRequest;
import com.romsteam.roms.dto.request.UpdateKitchenStatusRequest;
import com.romsteam.roms.dto.response.KitchenHistoryTableResponse;
import com.romsteam.roms.dto.response.KitchenOrderResponse;
import com.romsteam.roms.dto.response.KitchenSummaryResponse;

import java.util.List;

public interface KitchenService {

    // Lấy toàn bộ danh sách đơn đang cần chế biến (CONFIRMED, COOKING, READY)
    List<KitchenOrderResponse> getActiveKitchenOrders();

    // Cập nhật trạng thái một món ăn cụ thể (ví dụ: tick xong món chuyển thành READY)
    KitchenOrderResponse updateItemStatus(Long itemId, UpdateKitchenStatusRequest request);

    // Cập nhật trạng thái hàng loạt cho nhiều món ăn được chọn
    List<KitchenOrderResponse> batchUpdateItemStatus(BatchKitchenItemStatusRequest request);

    // Bật / Tắt ưu tiên hỏa tốc RUSH cho nhiều món ăn được chọn
    List<KitchenOrderResponse> batchToggleItemRush(BatchKitchenItemRushRequest request);

    // Cập nhật trạng thái cho toàn bộ phiếu gọi món
    KitchenOrderResponse updateOrderStatus(Long orderId, UpdateKitchenStatusRequest request);

    // Bật / Tắt cờ ưu tiên hỏa tốc (RUSH) cho phiếu gọi món
    KitchenOrderResponse toggleRushOrder(Long orderId);

    // Lấy thông số đo lường hiệu suất và số lượng đơn theo trạng thái
    KitchenSummaryResponse getKitchenSummary();

    // Lấy lịch sử các món đã nấu trong ngày gom nhóm theo bàn
    List<KitchenHistoryTableResponse> getTodayCookingHistory();
}
