package com.romsteam.roms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity đại diện cho nhóm danh mục thực đơn (Bảng: categories).
 * Ví dụ: "Khai Vị", "Món Chính & Đặc Sản", "Đồ Uống Đóng Chai", "Tráng Miệng".
 */
@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    // Khóa chính tự tăng
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tên danh mục món ăn (duy nhất, hỗ trợ tiếng Việt có dấu)
    @Column(name = "name", nullable = false, unique = true, columnDefinition = "NVARCHAR(100)")
    private String name;

    // Mô tả ngắn gọn về nhóm món ăn
    @Column(name = "description", columnDefinition = "NVARCHAR(255)")
    private String description;

    // Thứ tự hiển thị danh mục trên menu khách hàng
    @Builder.Default
    @Column(name = "display_order")
    private Integer displayOrder = 0;

    // Trạng thái hiển thị: true = đang hoạt động, false = tạm ẩn danh mục
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Thời điểm tạo danh mục
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm cập nhật danh mục gần nhất
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
