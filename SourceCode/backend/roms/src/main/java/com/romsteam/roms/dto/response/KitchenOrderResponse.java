package com.romsteam.roms.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO đại diện cho một phiếu gọi món (Order Ticket) hiển thị trên màn hình Bếp KDS
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenOrderResponse {

    // ID đơn hàng
    private Long id;

    // Mã đơn hiển thị (Ví dụ: "ORD-T01-1234")
    private String orderCode;

    // ID bàn ăn
    private Long tableId;

    // Số bàn (Ví dụ: "T-01", "B-03", "VIP-01")
    private String tableNumber;

    // Tên bàn hiển thị
    private String tableName;

    // Tên khu vực (Ví dụ: "Tầng 1 - Sảnh Chính", "Ban Công")
    private String zoneName;

    // Tên nhân viên tiếp nhận đơn (hoặc "Khách quét QR")
    private String staffName;

    // Trạng thái tổng quát của đơn: CONFIRMED, COOKING, READY, SERVED
    private String status;

    // Ghi chú chung của toàn bộ đơn
    private String note;

    // Cờ đánh dấu đơn ưu tiên khẩn cấp (Hỏa tốc)
    private Boolean isRush;

    // Thời điểm gửi vào bếp
    private LocalDateTime startedAt;

    // Số giây đã trôi qua kể từ khi gửi vào bếp
    private Long elapsedSeconds;

    // Danh sách các món ăn trong phiếu bếp
    private List<KitchenOrderItemResponse> items;
}
