package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.ReportTimeframe;
import com.romsteam.roms.dto.response.BestsellerDishResponse;
import com.romsteam.roms.dto.response.ReportSummaryResponse;

import java.time.LocalDate;
import java.util.List;

public interface ReportService {

    /**
     * Lấy toàn bộ số liệu tổng hợp cho trang Báo Cáo & Vận Hành
     * @param timeframe Khoảng thời gian cần lọc (TODAY, YESTERDAY, WEEK, MONTH, CUSTOM)
     * @param startDate Ngày bắt đầu (áp dụng khi timeframe = CUSTOM)
     * @param endDate Ngày kết thúc (áp dụng khi timeframe = CUSTOM)
     * @return Đối tượng ReportSummaryResponse chứa đầy đủ KPIs, biểu đồ, tỷ trọng thanh toán và top món
     */
    ReportSummaryResponse getReportSummary(ReportTimeframe timeframe, LocalDate startDate, LocalDate endDate);

    /**
     * Lấy danh sách Top món ăn bán chạy nhất theo khoảng thời gian
     * @param timeframe Khoảng thời gian
     * @param limit Số lượng món tối đa cần lấy (Ví dụ: 5 món, 10 món)
     * @param startDate Ngày bắt đầu tùy chỉnh
     * @param endDate Ngày kết thúc tùy chỉnh
     * @return Danh sách BestsellerDishResponse
     */
    List<BestsellerDishResponse> getTopBestsellers(ReportTimeframe timeframe, int limit, LocalDate startDate, LocalDate endDate);

    /**
     * Xuất dữ liệu báo cáo sang định dạng CSV UTF-8 có BOM (mở trực tiếp bằng Microsoft Excel không lỗi font tiếng Việt)
     * @param timeframe Khoảng thời gian lọc
     * @param startDate Ngày bắt đầu tùy chỉnh
     * @param endDate Ngày kết thúc tùy chỉnh
     * @return Mảng byte chứa nội dung file CSV
     */
    byte[] exportReportCsv(ReportTimeframe timeframe, LocalDate startDate, LocalDate endDate);
}