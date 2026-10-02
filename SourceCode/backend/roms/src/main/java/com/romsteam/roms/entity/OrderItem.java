package com.romsteam.roms.entity.enums;

import com.romsteam.roms.entity.MenuItem;
import com.romsteam.roms.entity.Order;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;
/**
 * Entity chi tiết từng món ăn trong một Order (Món gì, số lượng bao nhiêu, giá lúc gọi).
 */
@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // KHÓA NGOẠI: Món này nằm trong Order nào
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    // KHÓA NGOẠI: Món ăn gốc trong Menu
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;
    // Số lượng món đặt (ví dụ: 2 cốc coca, 1 đĩa bò)
    @Column(name = "quantity", nullable = false)
    private Integer quantity;
    // GIÁ CHỤP NHANH (SNAPSHOT PRICE - BR-17): Lưu giá món tại thời điểm bấm đặt món!
    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;
    // Thành tiền = quantity * unitPrice
    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;
    // Ghi chú riêng cho món này (ví dụ: "Không bỏ hành", "Ít đường nhiều đá")
    @Column(name = "note", length = 255)
    private String note;
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
