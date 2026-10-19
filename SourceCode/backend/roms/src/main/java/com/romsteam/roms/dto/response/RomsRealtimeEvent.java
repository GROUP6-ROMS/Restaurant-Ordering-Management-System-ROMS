package com.romsteam.roms.dto.response;

import lombok.*;

/**
 * DTO đại diện cho một gói tin sự kiện thời gian thực (Realtime Event)
 * được truyền tải qua WebSocket STOMP Message Broker tới các trạm làm việc
 * (Bếp KDS, Thu ngân POS, Phục vụ sảnh, Khách hàng tại bàn).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RomsRealtimeEvent {

    // Loại sự kiện: TABLE_UPDATE, ORDER_NEW, ORDER_UPDATE, SERVICE_REQUEST, PAYMENT_REQUEST, BILL_PAID, SHIFT_CLOSED
    private String type;

    // ID bàn liên quan
    private Long tableId;

    // Số hiệu / tên bàn (vd: Bàn 01, Bàn VIP)
    private String tableNumber;

    // Trạng thái mới (AVAILABLE, OCCUPIED, DINING, DIRTY, CALLING, DRAFT_PRINTED, COOKING, READY, SERVED)
    private String status;

    // Tải trọng dữ liệu bổ sung chi tiết (order items, bill preview, request details...)
    private Object payload;

    // Ghi chú bổ sung
    private String note;

    // Dấu thời gian phát sự kiện (Epoch milliseconds)
    @Builder.Default
    private Long timestamp = System.currentTimeMillis();
}
