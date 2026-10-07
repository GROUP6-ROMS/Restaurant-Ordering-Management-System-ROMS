# BƯỚC 05: TẠO ENTITY CATEGORY & MENUITEM (SỬ DỤNG LOMBOK)

## 1. Bước Này Làm Gì?
- Tạo entity `Category` ánh xạ vào bảng `categories` (danh mục thực đơn: Khai vị, Món chính, Đồ uống đóng chai...).
- Tạo entity `MenuItem` ánh xạ vào bảng `menu_items` (món ăn và đồ uống đóng chai sẵn kèm giá bán, giá vốn `costPrice`, phân trạm chế biến `station`).
- **Sử dụng Lombok:** Thêm `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` loại bỏ toàn bộ mã constructors, getters, setters thừa.
- **Nghiệp vụ quan trọng:**
  - **Bỏ Recipe BOM:** Không dùng định lượng nguyên liệu phức tạp, quản lý chi phí trực tiếp qua giá vốn `costPrice` và giá bán `price` (`BigDecimal`).
  - **Bỏ Quầy Bar:** Chỉ phục vụ nước đóng chai/lon sẵn. Trường `station` nhận 2 giá trị: `"KITCHEN"` (món nấu tại bếp) hoặc `"WAITER"` (nước đóng chai phục vụ lấy ngay).

---

## 2. Các File Code & Chức Năng

### File 1: `Category.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/entity/Category.java`
- **Chức năng:** Quản lý nhóm danh mục món ăn trong thực đơn.

```java
package com.romsteam.roms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

// Khai báo Entity đại diện cho bảng danh mục món ăn
@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    // Khóa chính danh mục
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tên danh mục (ví dụ: "Khai Vị", "Món Chính", "Tráng Miệng", "Đồ Uống Đóng Chai") - Duy nhất
    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    // Mô tả ngắn gọn về danh mục
    @Column(name = "description", length = 255)
    private String description;

    // Thứ tự hiển thị danh mục trên menu
    @Builder.Default
    @Column(name = "display_order")
    private Integer displayOrder = 0;

    // Trạng thái danh mục: true = đang hiển thị, false = ẩn khỏi menu
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Thời điểm tạo danh mục
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm sửa đổi danh mục gần nhất
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

---

### File 2: `MenuItem.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/entity/MenuItem.java`
- **Chức năng:** Quản lý từng món ăn hoặc đồ uống đóng lon/chai sẵn.

```java
package com.romsteam.roms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// Khai báo Entity đại diện cho bảng món ăn
@Entity
@Table(name = "menu_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItem {

    // Khóa chính tự tăng
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Khóa ngoại trỏ đến danh mục (@ManyToOne)
    // FetchType.LAZY: Tối ưu hiệu năng, chỉ load Category khi gọi menuItem.getCategory()
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    // Mã định danh sản phẩm SKU (ví dụ: "DISH-001", "DRK-001")
    @Column(name = "sku", nullable = false, unique = true, length = 50)
    private String sku;

    // Tên món ăn (ví dụ: "Bò bít tết sốt tiêu đen", "Coca-Cola Sleek Lon 320ml")
    @Column(name = "name", nullable = false, length = 150)
    private String name;

    // Mô tả chi tiết món ăn
    @Column(name = "description", length = 500)
    private String description;

    // Giá bán niêm yết cho khách (BigDecimal tránh lỗi làm tròn số thực)
    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    // Giá vốn nguyên liệu / nhập hàng (THAY THẾ CHO RECIPE BOM)
    // Lợi nhuận gộp tính trực tiếp: profit = price - costPrice
    @Column(name = "cost_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal costPrice;

    // Trạm xử lý món ăn: "KITCHEN" (nấu tại bếp) hoặc "WAITER" (nước đóng lon/chai phục vụ lấy từ tủ mát)
    @Builder.Default
    @Column(name = "station", nullable = false, length = 20)
    private String station = "KITCHEN";

    // Nhãn nổi bật (ví dụ: "Bestseller", "Healthy", "Chef's Choice", "Tinh Khiết")
    @Column(name = "tag", length = 50)
    private String tag;

    // Đường dẫn hình ảnh món ăn
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    // Trạng thái còn món hay hết món: true = còn hàng, false = hết hàng (hiển thị sold-out)
    @Builder.Default
    @Column(name = "is_available", nullable = false)
    private Boolean isAvailable = true;

    // Thứ tự hiển thị món ăn trong danh mục
    @Builder.Default
    @Column(name = "display_order")
    private Integer displayOrder = 0;

    // Món ăn có đang được kinh doanh không
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Thời điểm tạo món ăn
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm cập nhật món ăn gần nhất
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ===================================================================
    // HELPER BUSINESS METHOD
    // ===================================================================

    // Tính lợi nhuận gộp trên mỗi đơn vị món bán ra
    public BigDecimal getProfitMargin() {
        if (price != null && costPrice != null) {
            return price.subtract(costPrice);
        }
        return BigDecimal.ZERO;
    }
}
```
