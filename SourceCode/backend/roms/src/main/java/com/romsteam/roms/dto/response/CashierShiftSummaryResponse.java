package com.romsteam.roms.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO tổng hợp số liệu doanh thu thực tế theo ca làm việc phục vụ đối soát két tiền
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashierShiftSummaryResponse {

    private String shiftType;           // "MORNING", "EVENING"
    private String shiftName;           // "Ca Sáng (06:00 - 14:00)"
    private LocalDate workDate;
    private String cashierUsername;
    private String cashierFullName;

    private Long totalBillsCount;       // Tổng số hóa đơn đã thanh toán
    private BigDecimal totalRevenue;    // Tổng doanh thu thực tế
    private BigDecimal cashRevenue;     // Doanh thu tiền mặt (CASH)
    private BigDecimal bankRevenue;     // Doanh thu chuyển khoản (BANK_TRANSFER)
    private BigDecimal cardRevenue;     // Doanh thu quẹt thẻ (CARD)

    // Tiền mặt lý thuyết phải có trong két = Tiền đầu ca (nếu có) + cashRevenue
    private BigDecimal theoreticalDrawerCash;
}
