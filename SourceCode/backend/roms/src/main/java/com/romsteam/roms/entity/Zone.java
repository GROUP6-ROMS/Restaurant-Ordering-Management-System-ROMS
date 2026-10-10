package com.romsteam.roms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity đại diện cho khu vực / phân khu bàn trong nhà hàng (Zone).
 */
@Entity
@Table(name = "zones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Zone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mã khu vực viết hoa không dấu (ví dụ: ZONE_1, ZONE_2, VIP, ROOFTOP) - Duy nhất
    @Column(name = "zone_code", nullable = false, unique = true, length = 50)
    private String zoneCode;

    // Tên hiển thị thân thiện (ví dụ: "Tầng 1 - Sảnh Chính", "Sân Thượng BBQ")
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    // Mô tả đặc điểm không gian
    @Column(name = "description", length = 255)
    private String description;

    // Thứ tự hiển thị trên thanh tab
    @Builder.Default
    @Column(name = "display_order")
    private Integer displayOrder = 0;

    // Trạng thái hoạt động
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
