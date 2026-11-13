package com.romsteam.roms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO trả về thông tin chi tiết một món ăn đặt trước trong đơn đặt bàn
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationItemResponse {

    // ID của bản ghi ReservationItem
    private Long id;

    // Thông tin món ăn
    private Long menuItemId;
    private String menuItemName;
    private String sku;
    private String imageUrl;
    private String categoryName;

    // Đơn giá tại thời điểm đặt
    private BigDecimal unitPrice;

    // Số lượng đặt
    private Integer quantity;

    // Thành tiền của món này (unitPrice * quantity)
    private BigDecimal subtotal;

    // Ghi chú của khách hoặc quản lý
    private String note;
}
