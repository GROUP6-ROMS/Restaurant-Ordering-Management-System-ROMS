package com.romsteam.roms.dto.response;

import lombok.*;

/**
 * DTO thống kê nhanh số liệu cho thanh Metric trên đầu màn hình KDS
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenSummaryResponse {

    // Tổng số đơn đang cần chế biến
    private Integer totalActiveOrders;

    // Số đơn đang chờ tiếp nhận (CONFIRMED / PENDING)
    private Integer pendingOrders;

    // Số đơn đang nấu (COOKING)
    private Integer cookingOrders;

    // Số đơn đã nấu xong chờ phục vụ ra bưng (READY)
    private Integer readyOrders;

    // Thời gian ra món trung bình (Ví dụ: "11m 45s")
    private String avgPrepTime;

    // Hiệu suất hoàn thành đúng hạn SLA (%)
    private Double performanceRate;
}
