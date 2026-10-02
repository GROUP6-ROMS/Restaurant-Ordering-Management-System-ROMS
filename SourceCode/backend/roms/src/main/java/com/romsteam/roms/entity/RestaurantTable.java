package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.TableStatus;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_table")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Số bàn hoặc tên bàn (ví dụ: "Bàn 01", "Bàn 10", "VIP 1") - Duy nhất
    @Column(name = "table_number", nullable = false, unique = true, length = 30)
    private String tableNumber;

    // Sức chứa số lượng khách tối đa của bàn (ví dụ: 4 chỗ, 8 chỗ)
    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    // Trạng thái hiện tại của bàn (AVAILABLE, OCCUPIED, DIRTY, RESERVED)
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TableStatus status = TableStatus.AVAILABLE;

    // Token bảo mật gắn trên QR Code của bàn này (chống gian lận)
    @Column(name = "qr_token", length = 255)
    private String qrToken;

    // Trạng thái sử dụng của bàn: true = đang phục vụ, false = tạm ngưng/bảo trì
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
