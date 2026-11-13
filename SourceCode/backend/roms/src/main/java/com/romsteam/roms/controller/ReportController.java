package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.ReportTimeframe;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.BestsellerDishResponse;
import com.romsteam.roms.dto.response.ReportSummaryResponse;
import com.romsteam.roms.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /**
     * GET /api/admin/reports/summary
     * Lấy toàn bộ dữ liệu tổng hợp cho trang Báo Cáo & Vận Hành
     * Yêu cầu phân quyền: Chỉ tài khoản có vai trò Quản lý (MANAGER) mới được xem
     */
    @GetMapping("/summary")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ReportSummaryResponse>> getReportSummary(
            @RequestParam(defaultValue = "TODAY") ReportTimeframe timeframe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        ReportSummaryResponse summary = reportService.getReportSummary(timeframe, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(summary, "Lấy dữ liệu báo cáo vận hành thành công!"));
    }

    /**
     * GET /api/admin/reports/bestsellers
     * Lấy danh sách các món ăn bán chạy nhất theo khoảng thời gian
     */
    @GetMapping("/bestsellers")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<BestsellerDishResponse>>> getTopBestsellers(
            @RequestParam(defaultValue = "TODAY") ReportTimeframe timeframe,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        List<BestsellerDishResponse> list = reportService.getTopBestsellers(timeframe, limit, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách món bán chạy thành công!"));
    }

    /**
     * GET /api/admin/reports/export/excel (hoặc /api/admin/reports/export/csv)
     * Tải xuống file báo cáo Excel chuyên nghiệp (.xls định dạng bảng biểu, màu sắc và định dạng số)
     */
    @GetMapping({"/export/excel", "/export/csv"})
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<byte[]> exportReportExcel(
            @RequestParam(defaultValue = "TODAY") ReportTimeframe timeframe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        byte[] excelData = reportService.exportReportExcel(timeframe, startDate, endDate);

        String filename = "ROMS_BaoCaoDoanhThu_" + timeframe + "_" + LocalDate.now() + ".xls";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.ms-excel; charset=UTF-8"))
                .body(excelData);
    }
}
