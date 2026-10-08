package com.romsteam.roms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO đại diện cho các chỉ số đo lường hiệu quả (KPIs) của nhà hàng
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiReportResponse {

    // Tổng doanh thu thực tế thu về từ các hóa đơn đã thanh toán (PAID)
    private BigDecimal totalRevenue;

    // Tỷ lệ tăng/giảm doanh thu so với kỳ trước (Ví dụ: "+16.4%", "-5.2%")
    private String revenueTrend;

    // Tổng số lượt bàn đã hoàn thành phục vụ
    private Long totalTables;

    // Tổng số lượt thực khách đã dùng bữa (tính từ guestCount của các phiên ăn)
    private Long totalGuests;

    // Giá trị trung bình trên mỗi bàn (AOV = totalRevenue / totalTables)
    private BigDecimal averageOrderValue;

    // Tỷ lệ tăng/giảm giá trị trung bình trên bàn so với kỳ trước (Ví dụ: "+4.2%")
    private String aovTrend;

    // Thời gian phục vụ trung bình một bàn (tính theo phút)
    private Double avgServiceDurationMinutes;

    // Tổng số lượng hóa đơn thanh toán thành công
    private Long totalBills;
}