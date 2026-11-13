package com.romsteam.roms.dto.response;

import lombok.*;

import java.math.BigDecimal;

/**
 * DTO đại diện cho một món ăn chi tiết hiển thị trong ticket của Bếp KDS
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenOrderItemResponse {

    // ID bản ghi OrderItem
    private Long id;

    // ID món ăn trong menu
    private Long menuItemId;

    // Tên món ăn (Ví dụ: "Bò Wagyu Nướng Đá", "Mì Ý Sốt Bò Bằm")
    private String name;

    // Ảnh món ăn
    private String imageUrl;

    // Số lượng khách gọi
    private Integer quantity;

    // Đơn giá
    private BigDecimal unitPrice;

    // Ghi chú đặc biệt gửi cho bếp (Ví dụ: "Không hành", "Ít cay", "Ăn kèm sốt tiêu")
    private String note;

    // Trạng thái chế biến: PENDING, COOKING, READY, SERVED, CANCELLED
    private String status;

    // Trạng thái tiếng Việt thân thiện
    private String statusText;

    // Cờ ưu tiên hỏa tốc từng món
    private Boolean isRush;
}
