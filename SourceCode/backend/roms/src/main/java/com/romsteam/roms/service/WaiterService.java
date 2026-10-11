package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.OpenTableRequest;
import com.romsteam.roms.dto.request.TransferTableRequest;
import com.romsteam.roms.dto.request.WaiterAddOrderRequest;
import com.romsteam.roms.dto.response.WaiterMenuItemResponse;
import com.romsteam.roms.dto.response.WaiterTableResponse;

import java.util.List;

public interface WaiterService {
    // 1. Lấy toàn bộ sơ đồ bàn kèm tiến độ món & chuông gọi
    List<WaiterTableResponse> getFloorPlan(String zone);

    // 2. Mở bàn đón khách (khởi tạo DiningSession ACTIVE)
    WaiterTableResponse openTableSession(Long tableId, OpenTableRequest request);

    // 3. Hoàn tất dọn bàn (chuyển DIRTY -> AVAILABLE)
    WaiterTableResponse completeCleaning(Long tableId);

    // 4. Chuyển bàn (Move Table)
    void transferTable(TransferTableRequest request);

    // 5. Xác nhận bưng toàn bộ món READY lên bàn (chuyển sang SERVED)
    WaiterTableResponse confirmDeliverFood(Long tableId);

    // 6. Xử lý xong chuông gọi phục vụ
    void resolveServiceRequest(Long requestId);

    // 7. Báo thu ngân in tạm tính (chuyển sang AWAITING_PAYMENT)
    WaiterTableResponse requestPayment(Long tableId);

    // 8. Gọi thêm món cho bàn đang phục vụ (Tạo Order & OrderItem thật vào CSDL)
    WaiterTableResponse addOrderToTable(Long tableId, WaiterAddOrderRequest request);

    // 9. Lấy danh mục thực đơn món ăn từ CSDL cho Waiter
    List<WaiterMenuItemResponse> getMenuCatalog();

    // 10. Hủy đặt bàn (RESERVED -> AVAILABLE)
    WaiterTableResponse cancelReservation(Long tableId);

    // 11. Xác nhận bưng từng đĩa món riêng lẻ (READY -> SERVED)
    WaiterTableResponse confirmDeliverSingleItem(Long tableId, Long orderItemId);

    // 12. Đóng phiên ăn bàn trống (0đ) khi khách không dùng món hoặc mở nhầm bàn
    WaiterTableResponse closeEmptySession(Long tableId, com.romsteam.roms.dto.request.CloseEmptySessionRequest request);
}
