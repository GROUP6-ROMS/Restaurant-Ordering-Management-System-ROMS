package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.CustomerCallServiceRequest;
import com.romsteam.roms.dto.request.CustomerPlaceOrderRequest;
import com.romsteam.roms.dto.response.CustomerMenuResponse;
import com.romsteam.roms.dto.response.CustomerOrderTrackingResponse;

import java.util.List;
import java.util.Map;

public interface CustomerDiningService {
    // 1. Lấy danh mục và thực đơn món ăn đang phục vụ
    List<CustomerMenuResponse> getCustomerMenu();

    // 2. Thực khách gửi đơn gọi món tại bàn
    CustomerOrderTrackingResponse placeOrder(CustomerPlaceOrderRequest request);

    // 3. Theo dõi tiến độ đĩa món và phiên bàn ăn thời gian thực
    CustomerOrderTrackingResponse getOrderTracking(Long tableId, String tableNumber);

    // 4. Bấm chuông gọi phục vụ / yêu cầu phục vụ
    Map<String, Object> callWaiter(CustomerCallServiceRequest request);

    // 5. Yêu cầu tính tiền từ bàn ăn
    Map<String, Object> requestPayment(Long tableId, String tableNumber, String paymentMethod);
}
