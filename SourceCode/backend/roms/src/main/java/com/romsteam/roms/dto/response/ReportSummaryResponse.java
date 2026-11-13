package com.romsteam.roms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO tổng hợp toàn bộ số liệu thống kê cho trang Báo Cáo & Vận Hành
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportSummaryResponse {

    // Khoảng thời gian đang xem báo cáo (TODAY, YESTERDAY, WEEK, MONTH, CUSTOM)
    private String timeframe;

    // Ngày bắt đầu thực tế của kỳ báo cáo (định dạng dd/MM/yyyy)
    private String startDate;

    // Ngày kết thúc thực tế của kỳ báo cáo (định dạng dd/MM/yyyy)
    private String endDate;

    // Khối 4 chỉ số KPI tổng hợp
    private KpiReportResponse kpi;

    // Danh sách doanh thu theo từng khung giờ trong ngày
    private List<HourlyRevenueResponse> hourlyData;

    // Nhãn khung giờ cao điểm nhất (Ví dụ: "18:00 - 19:30")
    private String peakHourLabel;

    // Doanh thu đạt được trong khung giờ cao điểm nhất (VND)
    private BigDecimal peakHourRevenue;

    // Cơ cấu phân bổ phương thức thanh toán
    private List<PaymentMethodDistributionResponse> paymentMethods;

    // Danh sách các món ăn bán chạy nhất
    private List<BestsellerDishResponse> bestsellers;

    // Phân tích doanh thu và đối soát theo Ca trực (Ca Sáng vs Ca Tối)
    private List<ShiftRevenueResponse> shiftBreakdown;

    // Ma trận Kỹ thuật Thực đơn (BCG Menu Engineering Matrix)
    private List<MenuEngineeringItemResponse> menuEngineering;

    // Sổ chi tiết hóa đơn kế toán
    private List<InvoiceAuditDetailResponse> invoiceAudit;
}
