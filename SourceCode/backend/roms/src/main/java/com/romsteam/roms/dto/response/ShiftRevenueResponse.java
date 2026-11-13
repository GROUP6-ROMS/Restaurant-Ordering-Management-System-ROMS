package com.romsteam.roms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO đại diện cho doanh thu và hiệu suất theo Ca làm việc (Morning / Evening Shift)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftRevenueResponse {

    // Loại ca: "MORNING" hoặc "EVENING"
    private String shiftType;

    // Tên ca hiển thị: "Ca Sáng (06:00 - 14:00)" hoặc "Ca Tối (14:00 - 22:00)"
    private String shiftName;

    // Tổng số lượng hóa đơn hoàn tất thanh toán trong ca
    private Long billsCount;

    // Tổng doanh thu thực tế thu về trong ca (VND)
    private BigDecimal revenue;

    // Doanh thu tiền mặt (CASH)
    private BigDecimal cashRevenue;

    // Doanh thu chuyển khoản ngân hàng / VietQR (BANK_TRANSFER)
    private BigDecimal bankRevenue;

    // Doanh thu quẹt thẻ POS (CARD)
    private BigDecimal cardRevenue;

    // Tổng số lượt bàn phục vụ
    private Long tablesServed;

    // Tổng số khách phục vụ
    private Long guestsServed;

    // Tỷ trọng doanh thu của ca so với tổng doanh thu ngày (%)
    private Integer percentage;
}
