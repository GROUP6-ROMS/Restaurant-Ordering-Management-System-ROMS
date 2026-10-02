package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.OrderStatus;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // KHÓA NGOẠI: Order này thuộc về phiên ăn nào (Bắt buộc - BR-14)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private DiningSession session;

    // Mã đơn hiển thị cho Bếp dễ nhìn (ví dụ: "ORD-1001", "ORD-1002")
    @Column(name = "order_number", nullable = false, unique = true, length = 50)
    private String orderNumber;

    // Trạng thái đơn hàng: PENDING -> CONFIRMED -> PREPARING -> READY -> SERVED
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    // Khóa chống gửi trùng đơn (NFR-R02) khi mạng chậm hoặc khách double click
    @Column(name = "idempotency_key", unique = true, length = 100)
    private String idempotencyKey;

    // Tổng tiền của riêng đợt gọi món này (Tổng tiền các món con)
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    // Ghi chú chung của đợt gọi món (ví dụ: "Nấu nhanh giúp tôi")
    @Column(name = "note", length = 255)
    private String note;

    // QUAN HỆ 1-N: Một Order gồm nhiều món chi tiết (OrderItem)
    // CascadeType.ALL: Khi lưu Order thì tự động lưu toàn bộ OrderItem bên trong
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    // Khóa lạc quan chống xung đột khi 2 nhân viên cùng cập nhật trạng thái đơn (NFR-R03)
    @Version
    @Column(name = "version")
    private Long version;
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Hàm tiện ích: Giúp thêm món vào Order dễ dàng và tự gán quan hệ 2 chiều
    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }
}
