package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.response.RomsRealtimeEvent;
import com.romsteam.roms.service.RealtimeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class RealtimeServiceImpl implements RealtimeService {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void publish(String destination, RomsRealtimeEvent event) {
        try {
            if (event.getTimestamp() == null) {
                event.setTimestamp(System.currentTimeMillis());
            }
            messagingTemplate.convertAndSend(destination, event);
            log.info("[WS STOMP] Đã phát sự kiện '{}' tới topic '{}': tableId={}, status={}",
                    event.getType(), destination, event.getTableId(), event.getStatus());
        } catch (Exception e) {
            log.warn("[WS STOMP] Lỗi khi phát sự kiện tới '{}': {}", destination, e.getMessage());
        }
    }

    @Override
    public void notifyTableUpdate(Long tableId, String tableNumber, String status, String note) {
        RomsRealtimeEvent event = RomsRealtimeEvent.builder()
                .type("TABLE_UPDATE")
                .tableId(tableId)
                .tableNumber(tableNumber)
                .status(status)
                .note(note)
                .build();

        // 1. Phát tới topic chung của sơ đồ bàn (Phục vụ, Thu ngân, Admin)
        publish("/topic/tables", event);

        // 2. Phát tới kênh riêng của bàn (Khách hàng đang dùng bữa tại bàn này)
        if (tableId != null) {
            publish("/topic/dining/" + tableId, event);
        }
    }

    @Override
    public void notifyKitchenOrder(Long orderId, String tableNumber, String action, Object data) {
        String eventType = "ORDER_NEW".equalsIgnoreCase(action) ? "NEW_ORDER_CREATED" : "ORDER_UPDATE";
        RomsRealtimeEvent event = RomsRealtimeEvent.builder()
                .type(eventType)
                .tableNumber(tableNumber)
                .status(action)
                .payload(data)
                .note("Đơn order bàn " + tableNumber + " (" + action + ")")
                .build();

        // Phát tới Bếp KDS và kênh orders
        publish("/topic/kitchen", event);
        publish("/topic/orders", event);
    }

    @Override
    public void notifyOrderStatus(Long orderId, Long tableId, String tableNumber, String status, Object itemsData) {
        RomsRealtimeEvent event = RomsRealtimeEvent.builder()
                .type("ORDER_UPDATE")
                .tableId(tableId)
                .tableNumber(tableNumber)
                .status(status)
                .payload(itemsData)
                .note("Món ăn bàn " + tableNumber + " chuyển trạng thái: " + status)
                .build();

        publish("/topic/orders", event);
        publish("/topic/kitchen", event);
        if (tableId != null) {
            publish("/topic/dining/" + tableId, event);
        }
    }

    @Override
    public void notifyServiceRequest(Long requestId, Long tableId, String tableNumber, String requestType, String note) {
        String eventType;
        if ("RESOLVED".equalsIgnoreCase(note)) {
            eventType = "SERVICE_REQUEST_RESOLVED";
        } else if ("BILL".equalsIgnoreCase(requestType)) {
            eventType = "PAYMENT_REQUEST";
        } else {
            eventType = "CALL_WAITER";
        }

        RomsRealtimeEvent event = RomsRealtimeEvent.builder()
                .type(eventType)
                .tableId(tableId)
                .tableNumber(tableNumber)
                .status("RESOLVED".equalsIgnoreCase(note) ? "RESOLVED" : "PENDING")
                .note(note != null ? note : "Yêu cầu: " + requestType)
                .payload(requestType)
                .build();

        publish("/topic/service-requests", event);
        publish("/topic/tables", event);
        if ("BILL".equalsIgnoreCase(requestType) || "PAYMENT_REQUEST".equals(eventType)) {
            publish("/topic/pos", event);
        }
    }

    @Override
    public void notifyPaymentUpdate(Long billId, Long tableId, String tableNumber, String paymentStatus, Object billData) {
        RomsRealtimeEvent event = RomsRealtimeEvent.builder()
                .type("BILL_PAID".equalsIgnoreCase(paymentStatus) ? "BILL_PAID" : "PAYMENT_REQUEST")
                .tableId(tableId)
                .tableNumber(tableNumber)
                .status(paymentStatus)
                .payload(billData)
                .build();

        publish("/topic/pos", event);
        publish("/topic/tables", event);
        if (tableId != null) {
            publish("/topic/dining/" + tableId, event);
        }
    }

    @Override
    public void notifyMenuItemAvailability(Long menuItemId, String menuItemName, Boolean isAvailable, Integer remainingStock) {
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("id", menuItemId);
        data.put("name", menuItemName);
        data.put("isAvailable", isAvailable);
        data.put("remainingStock", remainingStock != null ? remainingStock : 0);

        RomsRealtimeEvent event = RomsRealtimeEvent.builder()
                .type("MENU_AVAILABILITY_CHANGED")
                .status(Boolean.TRUE.equals(isAvailable) ? "AVAILABLE" : "OUT_OF_STOCK")
                .payload(data)
                .note("Món " + menuItemName + (Boolean.TRUE.equals(isAvailable) ? " đã mở bán lại" : " đã hết hàng (86'd)"))
                .build();

        publish("/topic/kitchen", event);
        publish("/topic/orders", event);
        publish("/topic/tables", event);
    }
}
