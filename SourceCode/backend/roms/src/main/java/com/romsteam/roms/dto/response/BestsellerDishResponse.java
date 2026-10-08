package com.romsteam.roms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO đại diện cho món ăn bán chạy nhất trong kỳ báo cáo
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BestsellerDishResponse {

    // Mã ID của món ăn trong thực đơn
    private Long id;

    // Thứ hạng bán chạy (1, 2, 3, 4, 5...)
    private Integer rank;

    // Tên món ăn (Ví dụ: "Bò Wagyu Nướng Đá Muối")
    private String name;

    // Tên danh mục của món (Ví dụ: "Món Chính", "Khai Vị", "Đồ Uống")
    private String category;

    // Tổng số lượng phần/suất đã bán ra trong kỳ
    private Integer sold;

    // Tổng doanh thu mà món ăn này đem lại (VND)
    private BigDecimal revenue;

    // Tỷ lệ tăng trưởng doanh số so với kỳ trước (Ví dụ: "+18%")
    private String trend;
}