package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO nhận dữ liệu từ form Modal Thêm Món Ăn Mới
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateMenuItemRequest {

    @NotBlank(message = "Tên món ăn không được để trống!")
    private String name;

    @NotBlank(message = "Mã SKU định danh món ăn không được để trống!")
    private String sku;

    @NotNull(message = "Vui lòng chọn danh mục cho món ăn!")
    private Long categoryId;

    @NotNull(message = "Giá bán niêm yết không được để trống!")
    @DecimalMin(value = "0.0", message = "Giá bán phải lớn hơn hoặc bằng 0đ!")
    private BigDecimal price;

    @NotNull(message = "Giá vốn nguyên liệu không được để trống!")
    @DecimalMin(value = "0.0", message = "Giá vốn phải lớn hơn hoặc bằng 0đ!")
    private BigDecimal costPrice;

    private String station; // "KITCHEN" (mặc định) hoặc "WAITER"

    private String tag; // Ví dụ: "Bestseller", "Món Mới"

    private String description;

    private String imageUrl;

    private Integer displayOrder;

    private Integer dailyStock; // Định mức mở bán trong ngày (ví dụ: 50 phần)
}
