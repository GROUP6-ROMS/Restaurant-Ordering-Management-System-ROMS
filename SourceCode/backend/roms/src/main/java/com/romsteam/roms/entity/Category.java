package com.romsteam.roms.entity;

// Entity đại diện cho danh mục món ăn (Khai vị, Món chính, Đồ uống...).

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tên danh mục (ví dụ: "Món Khai Vị", "Đồ Uống") - Không được trùng
    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    // Mô tả ngắn về danh mục
    @Column(name = "description", length = 255)
    private String description;

    // Thứ tự hiển thị trên Menu (ví dụ: 1 = Khai vị hiển thị đầu tiên, 2 = Món chính...)
    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    // Trạng thái: true = đang hiển thị trên menu, false = ẩn danh mục
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