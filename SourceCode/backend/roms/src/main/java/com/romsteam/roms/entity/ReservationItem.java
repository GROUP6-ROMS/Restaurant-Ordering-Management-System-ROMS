package com.romsteam.roms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity đại diện cho món ăn đặt trước gắn với một phiếu đặt bàn (reservations).
 * Cho phép khách hàng đặt món trước hoặc Quản lý thêm/sửa/xóa món khi kiểm tra xác nhận.
 */
@Entity
@Table(name = "reservation_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationItem {

    // Khóa chính tự tăng
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Liên kết với phiếu đặt bàn (Reservation)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    // Liên kết với món ăn trong thực đơn (MenuItem)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    // Số lượng món đặt
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    // Đơn giá tại thời điểm đặt món
    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    // Thành tiền: subtotal = quantity * unitPrice
    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    // Ghi chú riêng cho món (ví dụ: "Ít cay", "Ăn trước lúc khai tiệc", v.v.)
    @Column(name = "note", columnDefinition = "NVARCHAR(255)")
    private String note;

    // Thời điểm tạo
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm cập nhật
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
