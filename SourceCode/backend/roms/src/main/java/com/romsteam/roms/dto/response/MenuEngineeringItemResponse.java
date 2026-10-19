package com.romsteam.roms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO đại diện cho một món ăn trong Ma Trận Kỹ Thuật Thực Đơn (Menu Engineering / BCG Matrix)
 * Phân loại theo 4 nhóm: STAR (Ngôi sao), PLOWHORSE (Ngựa cày), PUZZLE (Câu đố), DOG (Kém hiệu quả)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuEngineeringItemResponse {

    // Mã ID món ăn
    private Long dishId;

    // Tên món ăn
    private String dishName;

    // Danh mục
    private String categoryName;

    // Giá bán niêm yết (VND)
    private BigDecimal price;

    // Giá vốn nguyên liệu (VND)
    private BigDecimal costPrice;

    // Tiền lãi gộp trên 1 phần = price - costPrice (VND)
    private BigDecimal marginPerItem;

    // Tỷ suất lợi nhuận gộp trên 1 phần (%)
    private BigDecimal marginPercent;

    // Tổng số lượng phần đã bán trong kỳ
    private Integer totalSold;

    // Tổng doanh thu đem lại (VND)
    private BigDecimal totalRevenue;

    // Tổng lợi nhuận gộp đem lại = totalSold * marginPerItem (VND)
    private BigDecimal totalGrossProfit;

    // Phân loại ma trận: "STAR", "PLOWHORSE", "PUZZLE", "DOG"
    private String classification;

    // Nhãn phân loại tiếng Việt: "🌟 Ngôi Sao", "🐴 Ngựa Cày", "🧩 Câu Đố", "🐕 Kém Hiệu Quả"
    private String classificationLabel;

    // Đề xuất chiến lược vận hành (Recommendation)
    private String recommendation;
}
