package com.romsteam.roms.dto.request;

/**
 * Enum quy định các mốc khoảng thời gian thống kê báo cáo
 */
public enum ReportTimeframe {
    // Thống kê trong ngày hôm nay (00:00:00 - 23:59:59)
    TODAY,

    // Thống kê trong ngày hôm qua (00:00:00 - 23:59:59 của ngày hôm trước)
    YESTERDAY,

    // Thống kê trong 7 ngày gần nhất (từ 7 ngày trước đến hiện tại)
    WEEK,

    // Thống kê trong tháng hiện tại (từ ngày 01 đến ngày cuối tháng)
    MONTH,

    // Thống kê theo khoảng ngày tùy chỉnh do Quản lý tự chọn trên lịch (startDate - endDate)
    CUSTOM
}