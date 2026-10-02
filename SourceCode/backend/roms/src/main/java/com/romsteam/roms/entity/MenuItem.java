package com.romsteam.roms.entity;

// Entity đại diện cho một món ăn hoặc thức uống trong thực đơn.

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "menu_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // KHÓA NGOẠI: Nhiều món ăn thuộc về 1 Danh mục
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    // Tên món ăn (ví dụ: "Bò Bít Tết Sốt Tiêu", "Trà Đào Cam Sả")
    @Column(name = "name", nullable = false, length = 150)
    private String name;

    // Mô tả thành phần, cách chế biến
    @Column(name = "description", length = 500)
    private String description;

    // Giá bán niêm yết hiện tại (Dùng BigDecimal - độ chính xác 12 số, 2 số thập phân)
    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    // Đường dẫn ảnh món ăn để hiển thị trên màn hình khách chọn món
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    // Trạng thái còn hàng hay hết hàng (Hết hàng thì khách không bấm gọi được - Quy tắc BR-04)
    @Builder.Default
    @Column(name = "is_available", nullable = false)
    private Boolean isAvailable = true;

    // Trạng thái kinh doanh: true = đang bán, false = ngưng kinh doanh món này
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
