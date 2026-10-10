package com.romsteam.roms.dto.response;

import lombok.*;

/**
 * DTO trả về số liệu tổng hợp cho 3 thẻ KPI vận hành trên trang Quản lý Thực đơn
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuSummaryResponse {

    // Tổng số món ăn đang kinh doanh trong hệ thống
    private Long totalDishes;

    // Số món đang mở bán phục vụ bình thường (isAvailable = true)
    private Long activeDishes;

    // Số món tạm ngưng phục vụ / hết nguyên liệu (86'd - isAvailable = false)
    private Long pausedDishes;

    // Tỷ suất biên lợi nhuận gộp trung bình của toàn bộ thực đơn (%)
    private Double averageMarginPercent;
}
