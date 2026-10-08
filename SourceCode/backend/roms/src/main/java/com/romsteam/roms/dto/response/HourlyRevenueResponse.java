package com.romsteam.roms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO chứa số liệu doanh thu và số lượt bàn theo từng khung giờ trong ngày
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HourlyRevenueResponse {

    // Nhãn khung giờ (Ví dụ: "10:00 - 11:00", "11:00 - 12:00", "18:00 - 19:30")
    private String hour;

    // Số lượng đơn hàng (order) phát sinh trong khung giờ này
    private Integer orders;

    // Số lượng bàn có phát sinh thanh toán trong khung giờ này
    private Integer tables;

    // Tổng doanh thu thu được trong khung giờ này (VND)
    private BigDecimal revenue;

    // Tỷ lệ phần trăm doanh thu so với khung giờ đạt doanh thu cao nhất (0% - 100%)
    private Integer pct;
}