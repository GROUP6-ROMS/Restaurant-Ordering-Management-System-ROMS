package com.romsteam.roms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO thống kê doanh thu và tỷ lệ theo từng phương thức thanh toán
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethodDistributionResponse {

    // Tên mã phương thức (CASH, BANK_TRANSFER, CARD)
    private String method;

    // Nhãn tiếng Việt thân thiện hiển thị trên giao diện
    private String label;

    // Tổng số tiền thanh toán bằng phương thức này (VND)
    private BigDecimal totalAmount;

    // Tỷ lệ phần trăm đóng góp vào tổng doanh thu (Ví dụ: 68%)
    private Integer percentage;

    // Tổng số lượt hóa đơn áp dụng phương thức này
    private Long billCount;
}