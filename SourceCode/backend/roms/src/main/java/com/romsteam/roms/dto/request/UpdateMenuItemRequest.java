package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO nhận dữ liệu khi Quản lý chỉnh sửa thông tin món trên Panel bên phải
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMenuItemRequest {

    @NotBlank(message = "Tên món ăn không được để trống!")
    private String name;

    private String sku;

    @NotNull(message = "Danh mục không được để trống!")
    private Long categoryId;

    @NotNull(message = "Giá bán không được để trống!")
    @DecimalMin(value = "0.0", message = "Giá bán phải từ 0đ trở lên!")
    private BigDecimal price;

    @NotNull(message = "Giá vốn không được để trống!")
    @DecimalMin(value = "0.0", message = "Giá vốn phải từ 0đ trở lên!")
    private BigDecimal costPrice;

    private String station; // "KITCHEN" hoặc "WAITER"

    private String tag;

    private String description;

    private String imageUrl;

    private Integer displayOrder;

    private Boolean isAvailable;

    private Integer dailyStock;

    private Integer remainingStock;
}
