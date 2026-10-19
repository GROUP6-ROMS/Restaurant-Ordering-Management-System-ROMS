package com.romsteam.roms.controller;

import com.romsteam.roms.dto.response.RomsRealtimeEvent;
import com.romsteam.roms.service.RealtimeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

/**
 * Controller tiếp nhận các tin nhắn STOMP gửi lên từ Frontend client (/app/broadcast)
 * và phân phối lại tới các topic tương ứng.
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class RealtimeBroadcastController {

    private final RealtimeService realtimeService;

    @MessageMapping("/broadcast")
    public void handleClientBroadcast(@Payload RomsRealtimeEvent event) {
        log.info("[WS STOMP INCOMING] Nhận broadcast từ client: type={}, tableId={}", event.getType(), event.getTableId());

        if (event.getType() == null) return;

        switch (event.getType()) {
            case "TABLE_UPDATE" -> realtimeService.notifyTableUpdate(event.getTableId(), event.getTableNumber(), event.getStatus(), event.getNote());
            case "ORDER_NEW", "KITCHEN_UPDATE" -> realtimeService.notifyKitchenOrder(null, event.getTableNumber(), event.getStatus(), event.getPayload());
            case "ORDER_UPDATE" -> realtimeService.notifyOrderStatus(null, event.getTableId(), event.getTableNumber(), event.getStatus(), event.getPayload());
            case "SERVICE_REQUEST", "CALL_WAITER", "PAYMENT_REQUEST" -> realtimeService.notifyServiceRequest(null, event.getTableId(), event.getTableNumber(), event.getType(), event.getNote());
            case "BILL_PAID" -> realtimeService.notifyPaymentUpdate(null, event.getTableId(), event.getTableNumber(), "BILL_PAID", event.getPayload());
            default -> realtimeService.publish("/topic/tables", event);
        }
    }
}
