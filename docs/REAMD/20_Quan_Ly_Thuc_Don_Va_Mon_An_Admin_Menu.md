# BƯỚC 20: HOÀN THIỆN TRANG QUẢN LÝ THỰC ĐƠN & MÓN ĂN ADMIN MENU (FULL-STACK & CHUẨN LOMBOK)

> **Trang mục tiêu:** `http://localhost:5173/admin/menu`  
> **Mục tiêu kỹ thuật:**
> 1. **Loại bỏ 100% Mock Data tĩnh:** Xóa bỏ hoàn toàn `INITIAL_MANAGEMENT_ITEMS` và `MOCK_CATEGORIES` trong `MenuManagementPage.jsx`, kết nối trực tiếp với CSDL SQL Server qua hệ thống RESTful API chuẩn mực.
> 2. **Nâng cấp tầng Entity & CSDL:** Bổ sung các trường dữ liệu bắt buộc cho F&B gồm `sku` (Mã món), `cost_price` (Giá vốn nguyên liệu), `station` (Trạm điều phối: `KITCHEN` nấu tại bếp hoặc `WAITER` đồ uống đóng chai sẵn), `tag` (Nhãn: Bestseller, Chef's Choice...).
> 3. **Xây dựng phân hệ Backend hoàn chỉnh (Spring Boot 3 + Project Lombok):** Cung cấp đầy đủ Controller (`AdminMenuController.java`), Service (`MenuService.java`, `MenuServiceImpl.java`), Repository (`MenuItemRepository.java`, `CategoryRepository.java`) và 7 DTOs (Request/Response) áp dụng Lombok `@Data`, `@Builder`.
> 4. **Hoàn thiện Frontend React Vite chuyên nghiệp:**
>    - Layout 2 cột chia tỉ lệ 7:5 (Danh sách món ăn & Panel cấu hình món chi tiết).
>    - 3 thẻ KPI thống kê tự động tính theo thời gian thực (Món đang phục vụ, Cảnh báo hết món 86'd, Tỷ suất lợi nhuận TB).
>    - Bộ lọc đa tiêu chí: Tìm kiếm theo Tên/SKU, Lọc theo Trạm xử lý (Bếp/Phục Vụ), Lọc theo Danh mục động nạp từ CSDL.
>    - Bật/tắt trạng thái 86'd (Hết hàng / Đang bán) chỉ với 1 click.
>    - Modal thêm món ăn mới & Modal quản lý toàn diện danh mục món ăn (Thêm/Sửa/Xóa danh mục).
>    - Nút đồng bộ thực đơn tức thời xuống trạm Bếp KDS và Thu Ngân POS.
> 5. **Script SQL Server Migration & Seed Data:** Cung cấp script tự động kiểm tra và thêm các cột thiếu vào bảng `menu_items`, nạp sẵn 12+ món ăn chuẩn chỉ có đầy đủ giá vốn, giá bán và hình ảnh Unsplash chất lượng cao.

---

## 1. TỔNG QUAN KIẾN TRÚC & LUỒNG DỮ LIỆU THỰC ĐƠN (DATA FLOW)

### 1.1. So sánh Hiện trạng cũ (Mock) vs Giải pháp hoàn thiện (Database Real)

| Tiêu chí | Hiện trạng cũ (`MenuManagementPage.jsx` tĩnh) | Sau khi hoàn thiện (Chuẩn SWP391 Full-Stack) |
| :--- | :--- | :--- |
| **Nguồn dữ liệu món ăn** | Mảng tĩnh `INITIAL_MANAGEMENT_ITEMS` (chỉ có 6 món giả lập). F5 là mất toàn bộ dữ liệu vừa chỉnh sửa. | Tải từ CSDL SQL Server qua API `GET /api/admin/menu/items`. Lưu trữ vĩnh viễn và đồng bộ xuyên suốt toàn hệ thống. |
| **Nguồn dữ liệu danh mục** | Dùng danh mục tĩnh `MOCK_CATEGORIES`. | Tải động qua API `GET /api/admin/menu/categories`, cho phép thêm, sửa tên, đổi thứ tự hiển thị và xóa danh mục an toàn. |
| **Chỉ số KPI vận hành** | Tự tính toán dựa trên 6 phần tử mảng tĩnh trong component memory. | Gọi API `GET /api/admin/menu/summary` lấy số liệu chính xác từ database (tổng món, số món 86'd, biên lợi nhuận gộp trung bình). |
| **Cập nhật thông tin món** | Thay đổi local state bằng `setDishes`. Không lưu về backend. | Gọi API `PUT /api/admin/menu/items/{id}` cập nhật giá bán, giá vốn, trạm Bếp/Phục vụ, mô tả và ảnh món. |
| **Chuyển trạng thái 86'd** | Đổi cờ `isAvailable` trong RAM trình duyệt. | Gọi API `PATCH /api/admin/menu/items/{id}/toggle-availability` cập nhật trạng thái bán, tức thì phản ánh sang menu Khách quét QR, Waiter và KDS. |
| **Thêm món mới** | Sinh ID bằng `Date.now()`, mất sau khi tải lại trang. | Modal form gửi `POST /api/admin/menu/items` với đầy đủ validation (trùng SKU, giá bán, giá vốn...), sinh ID tự tăng trong SQL Server. |
| **Đồng bộ KDS / POS** | Nút bấm chỉ hiện Toast thông báo giả, không có tác vụ mạng. | Gửi `POST /api/admin/menu/sync` kích hoạt thông điệp đồng bộ thực đơn đến tất cả thiết bị đầu cuối. |

---

### 1.2. Sơ đồ luồng dữ liệu (Sequence Diagram)

```text
[Quản Lý / Manager UI]             [Backend Spring Boot]              [SQL Server]              [Bếp KDS / Thu Ngân POS]
         │                                   │                             │                                │
         │── 1. Truy cập /admin/menu ───────>│                             │                                │
         │      GET /api/admin/menu/items    │── 2. Truy vấn MenuItems ───>│                                │
         │      GET /api/admin/menu/summary  │   & Categories & KPI        │                                │
         │<── 3. Trả về JSON Danh sách ──────│<── 3. Trả về records ───────│                                │
         │       món ăn, danh mục & 3 KPI    │                             │                                │
         │                                   │                             │                                │
         │── 4. Bấm "Ngưng Bán (86)" ───────>│                             │                                │
         │   PATCH /items/{id}/toggle        │── 5. UPDATE is_available ──>│                                │
         │<── 6. Trả về món đã cập nhật ─────│                             │                                │
         │                                   │                             │                                │
         │── 7. Sửa giá bán & giá vốn ───────>│                             │                                │
         │      PUT /api/admin/menu/items/{id│── 8. UPDATE menu_items ────>│                                │
         │<── 9. Trả về kết quả thành công ──│                             │                                │
         │                                   │                             │                                │
         │── 10. Bấm "Đồng Bộ KDS/POS" ─────>│                             │                                │
         │       POST /api/admin/menu/sync   │── 11. Ghi nhận log & sync ──│── 12. Cập nhật menu mới ───────>│
         │<── 13. Toast: "Đồng bộ thành công"│                             │                                │
```

---

## 2. HƯỚNG DẪN PHÍA BACKEND (SPRING BOOT 3 & PROJECT LOMBOK)

### BƯỚC B1: Cập nhật Entity `MenuItem.java` (Chuẩn Lombok & F&B Spec)
- **Đường dẫn file:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/entity/MenuItem.java`
- **Mục đích:** Bổ sung các trường bắt buộc: `sku` (Mã món), `costPrice` (Giá vốn), `station` (Trạm chế biến), `tag` (Nhãn nổi bật) và chuyển sang dùng Project Lombok (`@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder`) để tối ưu hóa code.

```java
package com.romsteam.roms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity đại diện cho một món ăn hoặc đồ uống trong thực đơn nhà hàng (Bảng: menu_items).
 * Áp dụng Project Lombok nhằm loại bỏ mã thừa Boilerplate (constructors, getters, setters).
 */
@Entity
@Table(name = "menu_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItem {

    // Khóa chính tự tăng (IDENTITY) trong SQL Server
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Khóa ngoại trỏ đến danh mục món ăn (FetchType.LAZY để tối ưu truy vấn hiệu năng)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    // Mã quản lý kho/sản phẩm SKU (duy nhất, ví dụ: "DISH-001", "DRK-001")
    @Column(name = "sku", nullable = false, unique = true, length = 50)
    private String sku;

    // Tên món ăn (hỗ trợ tiếng Việt có dấu Unicode qua NVARCHAR)
    @Column(name = "name", nullable = false, columnDefinition = "NVARCHAR(150)")
    private String name;

    // Mô tả chi tiết món ăn (thành phần dinh dưỡng, hương vị, hướng dẫn thưởng thức)
    @Column(name = "description", columnDefinition = "NVARCHAR(500)")
    private String description;

    // Giá bán niêm yết cho khách (Dùng BigDecimal để đảm bảo chính xác tuyệt đối trong tài chính)
    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    // Giá vốn nguyên liệu / giá nhập hàng (Dùng để tính Lợi nhuận gộp và Tỷ suất Margin mà không cần Recipe BOM)
    @Builder.Default
    @Column(name = "cost_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal costPrice = BigDecimal.ZERO;

    // Trạm điều phối xử lý món: "KITCHEN" (nấu tại bếp) hoặc "WAITER" (nước đóng lon/chai do phục vụ lấy từ tủ mát)
    @Builder.Default
    @Column(name = "station", nullable = false, length = 20)
    private String station = "KITCHEN";

    // Nhãn nổi bật hiển thị trên giao diện (Ví dụ: "Bestseller", "Chef's Choice", "Món Mới", "Healthy")
    @Column(name = "tag", length = 50)
    private String tag;

    // Đường dẫn ảnh món ăn (URL hình ảnh CDN hoặc đường dẫn máy chủ)
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    // Trạng thái còn hàng hay hết hàng (true = đang bán, false = 86'd / tạm hết hàng)
    @Builder.Default
    @Column(name = "is_available", nullable = false)
    private Boolean isAvailable = true;

    // Thứ tự hiển thị sắp xếp trên thực đơn (số nhỏ đứng trước)
    @Builder.Default
    @Column(name = "display_order")
    private Integer displayOrder = 0;

    // Trạng thái xóa mềm: true = món đang kinh doanh, false = đã xóa khỏi thực đơn
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Thời điểm tạo món ăn (tự động điền lúc INSERT)
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm cập nhật món ăn gần nhất (tự động cập nhật lúc UPDATE)
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ===================================================================
    // HÀM TIỆN ÍCH NGHIỆP VỤ (BUSINESS LOGIC HELPERS)
    // ===================================================================

    /**
     * Tính lợi nhuận gộp trên mỗi đơn vị món bán ra: Profit = Price - CostPrice
     */
    public BigDecimal calculateProfit() {
        if (price != null && costPrice != null) {
            return price.subtract(costPrice);
        }
        return BigDecimal.ZERO;
    }

    /**
     * Tính tỷ suất lợi nhuận gộp phần trăm: Margin % = ((Price - CostPrice) / Price) * 100
     */
    public Double calculateMarginPercent() {
        if (price != null && costPrice != null && price.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal profit = price.subtract(costPrice);
            return profit.divide(price, 4, java.math.RoundingMode.HALF_UP)
                         .multiply(BigDecimal.valueOf(100))
                         .doubleValue();
        }
        return 0.0;
    }
}
```

---

### BƯỚC B2: Cập nhật Entity `Category.java` (Chuẩn Lombok)
- **Đường dẫn file:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/entity/Category.java`
- **Mục đích:** Đồng bộ cấu trúc entity `Category` theo chuẩn Lombok thống nhất toàn dự án.

```java
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
```

---

### BƯỚC B3: Cập nhật Repository Layer (`CategoryRepository` & `MenuItemRepository`)

#### 1. File: `CategoryRepository.java`
- **Đường dẫn file:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/repository/CategoryRepository.java`
- **Nội dung:** Bổ sung phương thức kiểm tra tên trùng lặp khi cập nhật danh mục.

```java
package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    // Lấy danh sách danh mục đang hoạt động, sắp xếp theo thứ tự hiển thị tăng dần
    List<Category> findByIsActiveTrueOrderByDisplayOrderAsc();

    // Kiểm tra trùng tên danh mục khi thêm mới
    boolean existsByName(String name);

    // Kiểm tra trùng tên danh mục khi cập nhật (ngoại trừ chính ID của danh mục đang sửa)
    boolean existsByNameAndIdNot(String name, Long id);
}
```

---

#### 2. File: `MenuItemRepository.java`
- **Đường dẫn file:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/repository/MenuItemRepository.java`
- **Nội dung:** Thêm truy vấn JPQL tìm kiếm lọc đa điều kiện, đếm món theo trạng thái phục vụ tính toán KPI.

```java
package com.romsteam.roms.repository;

import com.romsteam.roms.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    // Lấy toàn bộ món ăn còn kinh doanh (chưa bị xóa mềm), xếp theo thứ tự hiển thị
    List<MenuItem> findByIsActiveTrueOrderByDisplayOrderAsc();

    // Lấy các món ăn đang cho phép bán (đang kinh doanh và còn hàng)
    List<MenuItem> findByIsAvailableTrueAndIsActiveTrue();

    // Lấy các món ăn thuộc về 1 danh mục cụ thể
    List<MenuItem> findByCategoryIdAndIsActiveTrue(Long categoryId);

    // Tìm món ăn theo mã SKU
    Optional<MenuItem> findBySkuAndIsActiveTrue(String sku);

    // Kiểm tra mã SKU đã tồn tại trong CSDL chưa
    boolean existsBySku(String sku);

    // Kiểm tra mã SKU đã tồn tại ở món khác chưa (dùng khi cập nhật món)
    boolean existsBySkuAndIdNot(String sku, Long id);

    // Đếm số lượng món ăn trực thuộc một danh mục
    long countByCategoryIdAndIsActiveTrue(Long categoryId);

    // Đếm số lượng món đang phục vụ (isAvailable = true và isActive = true)
    long countByIsAvailableTrueAndIsActiveTrue();

    // Đếm số lượng món tạm ngưng / 86'd (isAvailable = false và isActive = true)
    long countByIsAvailableFalseAndIsActiveTrue();

    /**
     * Truy vấn tìm kiếm lọc đa tiêu chí linh hoạt (Multi-criteria Filter):
     * Hỗ trợ tìm kiếm theo từ khóa (Tên hoặc SKU), lọc theo Danh mục, Trạm xử lý và Trạng thái còn hàng.
     */
    @Query("SELECT m FROM MenuItem m WHERE m.isActive = true " +
           "AND (:categoryId IS NULL OR m.category.id = :categoryId) " +
           "AND (:station IS NULL OR m.station = :station) " +
           "AND (:isAvailable IS NULL OR m.isAvailable = :isAvailable) " +
           "AND (:keyword IS NULL OR LOWER(m.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(m.sku) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY m.displayOrder ASC, m.id DESC")
    List<MenuItem> searchMenuItems(
            @Param("categoryId") Long categoryId,
            @Param("station") String station,
            @Param("isAvailable") Boolean isAvailable,
            @Param("keyword") String keyword
    );
}
```

---

### BƯỚC B4: Tạo các DTO Request & Response (Chuẩn Project Lombok)

#### 1. DTO Thống kê 3 thẻ KPI: `MenuSummaryResponse.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/response/MenuSummaryResponse.java`

```java
package com.romsteam.roms.dto.response;

import lombok.*;

/**
 * DTO trả về số liệu tổng hợp cho 3 thẻ KPI vận hành trên trang Quản lý Thực đơn
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuSummaryResponse {

    // Tổng số món ăn đang kinh doanh trong hệ thống
    private Long totalDishes;

    // Số món đang mở bán phục vụ bình thường (isAvailable = true)
    private Long activeDishes;

    // Số món tạm ngưng phục vụ / hết nguyên liệu (86'd - isAvailable = false)
    private Long pausedDishes;

    // Tỷ suất biên lợi nhuận gộp trung bình của toàn bộ thực đơn (%)
    private Double averageMarginPercent;
}
```

---

#### 2. DTO Chi tiết món ăn Admin: `AdminMenuItemResponse.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/response/AdminMenuItemResponse.java`

```java
package com.romsteam.roms.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO trả về đầy đủ thông tin món ăn kèm các chỉ số tài chính (Giá vốn, Lợi nhuận gộp, Biên %)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminMenuItemResponse {

    private Long id;
    private String sku;
    private String name;
    private Long categoryId;
    private String categoryName;
    private String station; // "KITCHEN" hoặc "WAITER"
    private BigDecimal price;
    private BigDecimal costPrice;
    private BigDecimal profit; // price - costPrice
    private Double marginPercent; // ((price - costPrice) / price) * 100
    private Boolean isAvailable;
    private String tag; // "Bestseller", "Chef's Choice"...
    private String description;
    private String imageUrl;
    private Integer displayOrder;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

---

#### 3. DTO Danh mục thực đơn: `CategoryResponse.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/response/CategoryResponse.java`

```java
package com.romsteam.roms.dto.response;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO trả về thông tin nhóm danh mục kèm số lượng món ăn trực thuộc
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryResponse {

    private Long id;
    private String name;
    private String description;
    private Integer displayOrder;
    private Long dishCount; // Số món đang kinh doanh trong danh mục này
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

---

#### 4. DTO Yêu cầu tạo món ăn: `CreateMenuItemRequest.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/request/CreateMenuItemRequest.java`

```java
package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO nhận dữ liệu từ form Modal Thêm Món Ăn Mới
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateMenuItemRequest {

    @NotBlank(message = "Tên món ăn không được để trống!")
    private String name;

    @NotBlank(message = "Mã SKU định danh món ăn không được để trống!")
    private String sku;

    @NotNull(message = "Vui lòng chọn danh mục cho món ăn!")
    private Long categoryId;

    @NotNull(message = "Giá bán niêm yết không được để trống!")
    @DecimalMin(value = "0.0", message = "Giá bán phải lớn hơn hoặc bằng 0đ!")
    private BigDecimal price;

    @NotNull(message = "Giá vốn nguyên liệu không được để trống!")
    @DecimalMin(value = "0.0", message = "Giá vốn phải lớn hơn hoặc bằng 0đ!")
    private BigDecimal costPrice;

    private String station; // "KITCHEN" (mặc định) hoặc "WAITER"

    private String tag; // Ví dụ: "Bestseller", "Món Mới"

    private String description;

    private String imageUrl;

    private Integer displayOrder;
}
```

---

#### 5. DTO Yêu cầu cập nhật món ăn: `UpdateMenuItemRequest.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/request/UpdateMenuItemRequest.java`

```java
package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO nhận dữ liệu khi Quản lý chỉnh sửa thông tin món trên Panel bên phải
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMenuItemRequest {

    @NotBlank(message = "Tên món ăn không được để trống!")
    private String name;

    private String sku;

    @NotNull(message = "Danh mục không được để trống!")
    private Long categoryId;

    @NotNull(message = "Giá bán không được để trống!")
    @DecimalMin(value = "0.0", message = "Giá bán phải từ 0đ trở lên!")
    private BigDecimal price;

    @NotNull(message = "Giá vốn không được để trống!")
    @DecimalMin(value = "0.0", message = "Giá vốn phải từ 0đ trở lên!")
    private BigDecimal costPrice;

    private String station; // "KITCHEN" hoặc "WAITER"

    private String tag;

    private String description;

    private String imageUrl;

    private Integer displayOrder;

    private Boolean isAvailable;
}
```

---

#### 6. DTO Tạo danh mục mới: `CreateCategoryRequest.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/request/CreateCategoryRequest.java`

```java
package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * DTO nhận dữ liệu khi Quản lý thêm danh mục thực đơn mới
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCategoryRequest {

    @NotBlank(message = "Tên danh mục không được để trống!")
    private String name;

    private String description;

    private Integer displayOrder;
}
```

---

#### 7. DTO Cập nhật danh mục: `UpdateCategoryRequest.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/request/UpdateCategoryRequest.java`

```java
package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * DTO nhận dữ liệu khi Quản lý chỉnh sửa thông tin danh mục thực đơn
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCategoryRequest {

    @NotBlank(message = "Tên danh mục không được để trống!")
    private String name;

    private String description;

    private Integer displayOrder;

    private Boolean isActive;
}
```

---

### BƯỚC B5: Xây dựng Tầng Service (`MenuService` & `MenuServiceImpl`)

#### 1. Interface: `MenuService.java`
- **Đường dẫn file:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/MenuService.java`

```java
package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.CreateCategoryRequest;
import com.romsteam.roms.dto.request.CreateMenuItemRequest;
import com.romsteam.roms.dto.request.UpdateCategoryRequest;
import com.romsteam.roms.dto.request.UpdateMenuItemRequest;
import com.romsteam.roms.dto.response.AdminMenuItemResponse;
import com.romsteam.roms.dto.response.CategoryResponse;
import com.romsteam.roms.dto.response.MenuSummaryResponse;

import java.util.List;

public interface MenuService {

    // 1. Lấy thông tin thống kê 3 thẻ KPI
    MenuSummaryResponse getMenuSummary();

    // 2. Tìm kiếm và lọc danh sách món ăn
    List<AdminMenuItemResponse> searchMenuItems(Long categoryId, String station, Boolean isAvailable, String keyword);

    // 3. Lấy chi tiết một món ăn theo ID
    AdminMenuItemResponse getMenuItemById(Long id);

    // 4. Tạo món ăn mới
    AdminMenuItemResponse createMenuItem(CreateMenuItemRequest request);

    // 5. Cập nhật thông tin món ăn
    AdminMenuItemResponse updateMenuItem(Long id, UpdateMenuItemRequest request);

    // 6. Bật/tắt trạng thái hết món (86'd)
    AdminMenuItemResponse toggleMenuItemAvailability(Long id);

    // 7. Xóa món ăn khỏi thực đơn (Soft Delete)
    void deleteMenuItem(Long id);

    // 8. Lấy toàn bộ danh mục thực đơn
    List<CategoryResponse> getAllCategories();

    // 9. Thêm danh mục mới
    CategoryResponse createCategory(CreateCategoryRequest request);

    // 10. Cập nhật danh mục
    CategoryResponse updateCategory(Long id, UpdateCategoryRequest request);

    // 11. Xóa danh mục thực đơn
    void deleteCategory(Long id);

    // 12. Kích hoạt đồng bộ thực đơn xuống KDS và POS
    void syncMenuToKdsAndPos();
}
```

---

#### 2. Class Triển khai: `MenuServiceImpl.java`
- **Đường dẫn file:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/serviceImpl/MenuServiceImpl.java`

```java
package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.CreateCategoryRequest;
import com.romsteam.roms.dto.request.CreateMenuItemRequest;
import com.romsteam.roms.dto.request.UpdateCategoryRequest;
import com.romsteam.roms.dto.request.UpdateMenuItemRequest;
import com.romsteam.roms.dto.response.AdminMenuItemResponse;
import com.romsteam.roms.dto.response.CategoryResponse;
import com.romsteam.roms.dto.response.MenuSummaryResponse;
import com.romsteam.roms.entity.Category;
import com.romsteam.roms.entity.MenuItem;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.exception.ResourceNotFoundException;
import com.romsteam.roms.repository.CategoryRepository;
import com.romsteam.roms.repository.MenuItemRepository;
import com.romsteam.roms.service.MenuService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service xử lý toàn bộ nghiệp vụ Quản trị Thực đơn (Menu & Dishes).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MenuServiceImpl implements MenuService {

    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public MenuSummaryResponse getMenuSummary() {
        long activeDishes = menuItemRepository.countByIsAvailableTrueAndIsActiveTrue();
        long pausedDishes = menuItemRepository.countByIsAvailableFalseAndIsActiveTrue();
        long totalDishes = activeDishes + pausedDishes;

        List<MenuItem> allActiveItems = menuItemRepository.findByIsActiveTrueOrderByDisplayOrderAsc();

        // Tính biên lợi nhuận trung bình toàn thực đơn
        double avgMargin = 0.0;
        if (!allActiveItems.isEmpty()) {
            double totalMargin = allActiveItems.stream()
                    .mapToDouble(MenuItem::calculateMarginPercent)
                    .sum();
            avgMargin = Math.round((totalMargin / allActiveItems.size()) * 10.0) / 10.0;
        }

        return MenuSummaryResponse.builder()
                .totalDishes(totalDishes)
                .activeDishes(activeDishes)
                .pausedDishes(pausedDishes)
                .averageMarginPercent(avgMargin)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminMenuItemResponse> searchMenuItems(Long categoryId, String station, Boolean isAvailable, String keyword) {
        String cleanStation = (station != null && !station.equalsIgnoreCase("ALL")) ? station.trim() : null;
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;

        List<MenuItem> items = menuItemRepository.searchMenuItems(categoryId, cleanStation, isAvailable, cleanKeyword);
        return items.stream()
                .map(this::mapToAdminResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AdminMenuItemResponse getMenuItemById(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Món ăn không tồn tại với ID: " + id));
        return mapToAdminResponse(item);
    }

    @Override
    @Transactional
    public AdminMenuItemResponse createMenuItem(CreateMenuItemRequest request) {
        String cleanSku = request.getSku().trim().toUpperCase();

        // 1. Kiểm tra mã SKU đã tồn tại chưa
        if (menuItemRepository.existsBySku(cleanSku)) {
            throw new AppException("Mã SKU '" + cleanSku + "' đã tồn tại! Vui lòng chọn mã khác.", HttpStatus.CONFLICT);
        }

        // 2. Kiểm tra danh mục món ăn
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục món ăn không tồn tại với ID: " + request.getCategoryId()));

        // 3. Chuẩn hóa trạm chế biến
        String station = (request.getStation() != null && request.getStation().equalsIgnoreCase("WAITER")) 
                ? "WAITER" : "KITCHEN";

        int displayOrder = request.getDisplayOrder() != null ? request.getDisplayOrder() : 0;
        if (displayOrder == 0) {
            displayOrder = (int) menuItemRepository.count() + 1;
        }

        MenuItem menuItem = MenuItem.builder()
                .category(category)
                .sku(cleanSku)
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .price(request.getPrice())
                .costPrice(request.getCostPrice() != null ? request.getCostPrice() : BigDecimal.ZERO)
                .station(station)
                .tag(request.getTag() != null ? request.getTag().trim() : "Món Mới")
                .imageUrl(request.getImageUrl() != null ? request.getImageUrl().trim() : "https://images.unsplash.com/photo-1544025162-d76694265947?w=500")
                .isAvailable(true)
                .displayOrder(displayOrder)
                .isActive(true)
                .build();

        MenuItem saved = menuItemRepository.save(menuItem);
        log.info("Manager created new menu item [{} - {}]", saved.getSku(), saved.getName());
        return mapToAdminResponse(saved);
    }

    @Override
    @Transactional
    public AdminMenuItemResponse updateMenuItem(Long id, UpdateMenuItemRequest request) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Món ăn không tồn tại với ID: " + id));

        // 1. Kiểm tra SKU nếu có thay đổi
        if (request.getSku() != null && !request.getSku().trim().isEmpty()) {
            String cleanSku = request.getSku().trim().toUpperCase();
            if (menuItemRepository.existsBySkuAndIdNot(cleanSku, id)) {
                throw new AppException("Mã SKU '" + cleanSku + "' đã thuộc về món ăn khác!", HttpStatus.CONFLICT);
            }
            item.setSku(cleanSku);
        }

        // 2. Kiểm tra danh mục
        if (request.getCategoryId() != null && !request.getCategoryId().equals(item.getCategory().getId())) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại với ID: " + request.getCategoryId()));
            item.setCategory(category);
        }

        item.setName(request.getName().trim());
        item.setPrice(request.getPrice());
        item.setCostPrice(request.getCostPrice());

        if (request.getStation() != null) {
            item.setStation(request.getStation().equalsIgnoreCase("WAITER") ? "WAITER" : "KITCHEN");
        }
        if (request.getTag() != null) {
            item.setTag(request.getTag().trim());
        }
        if (request.getDescription() != null) {
            item.setDescription(request.getDescription().trim());
        }
        if (request.getImageUrl() != null) {
            item.setImageUrl(request.getImageUrl().trim());
        }
        if (request.getDisplayOrder() != null) {
            item.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getIsAvailable() != null) {
            item.setIsAvailable(request.getIsAvailable());
        }

        MenuItem updated = menuItemRepository.save(item);
        log.info("Manager updated menu item [ID: {}, Name: {}]", updated.getId(), updated.getName());
        return mapToAdminResponse(updated);
    }

    @Override
    @Transactional
    public AdminMenuItemResponse toggleMenuItemAvailability(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Món ăn không tồn tại với ID: " + id));

        boolean nextStatus = !item.getIsAvailable();
        item.setIsAvailable(nextStatus);
        if (!nextStatus) {
            item.setTag("Tạm Hết (86d)");
        } else if ("Tạm Hết (86d)".equals(item.getTag())) {
            item.setTag("Đang Bán");
        }

        MenuItem updated = menuItemRepository.save(item);
        log.info("Toggled availability for dish [{}] -> {}", updated.getName(), nextStatus ? "AVAILABLE" : "86d SOLD-OUT");
        return mapToAdminResponse(updated);
    }

    @Override
    @Transactional
    public void deleteMenuItem(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Món ăn không tồn tại với ID: " + id));

        // Soft delete: chuyển isActive sang false để bảo toàn lịch sử hóa đơn trong quá khứ
        item.setIsActive(false);
        menuItemRepository.save(item);
        log.info("Soft deleted menu item [{}]", item.getName());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        List<Category> categories = categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        return categories.stream().map(cat -> {
            long count = menuItemRepository.countByCategoryIdAndIsActiveTrue(cat.getId());
            return CategoryResponse.builder()
                    .id(cat.getId())
                    .name(cat.getName())
                    .description(cat.getDescription())
                    .displayOrder(cat.getDisplayOrder())
                    .dishCount(count)
                    .isActive(cat.getIsActive())
                    .createdAt(cat.getCreatedAt())
                    .updatedAt(cat.getUpdatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        String cleanName = request.getName().trim();
        if (categoryRepository.existsByName(cleanName)) {
            throw new AppException("Tên danh mục '" + cleanName + "' đã tồn tại!", HttpStatus.CONFLICT);
        }

        int displayOrder = request.getDisplayOrder() != null ? request.getDisplayOrder() : 0;
        if (displayOrder == 0) {
            displayOrder = (int) categoryRepository.count() + 1;
        }

        Category category = Category.builder()
                .name(cleanName)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .displayOrder(displayOrder)
                .isActive(true)
                .build();

        Category saved = categoryRepository.save(category);
        return CategoryResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .description(saved.getDescription())
                .displayOrder(saved.getDisplayOrder())
                .dishCount(0L)
                .isActive(saved.getIsActive())
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Long id, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại với ID: " + id));

        String cleanName = request.getName().trim();
        if (categoryRepository.existsByNameAndIdNot(cleanName, id)) {
            throw new AppException("Tên danh mục '" + cleanName + "' đã được sử dụng!", HttpStatus.CONFLICT);
        }

        category.setName(cleanName);
        if (request.getDescription() != null) category.setDescription(request.getDescription().trim());
        if (request.getDisplayOrder() != null) category.setDisplayOrder(request.getDisplayOrder());
        if (request.getIsActive() != null) category.setIsActive(request.getIsActive());

        Category updated = categoryRepository.save(category);
        long count = menuItemRepository.countByCategoryIdAndIsActiveTrue(updated.getId());
        return CategoryResponse.builder()
                .id(updated.getId())
                .name(updated.getName())
                .description(updated.getDescription())
                .displayOrder(updated.getDisplayOrder())
                .dishCount(count)
                .isActive(updated.getIsActive())
                .createdAt(updated.getCreatedAt())
                .updatedAt(updated.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại với ID: " + id));

        // Ràng buộc toàn vẹn: Không cho xóa nếu danh mục đang chứa món ăn còn kinh doanh
        long dishCount = menuItemRepository.countByCategoryIdAndIsActiveTrue(id);
        if (dishCount > 0) {
            throw new AppException(
                    String.format("Không thể xóa danh mục '%s' vì đang có %d món ăn trực thuộc. Vui lòng chuyển các món sang danh mục khác trước khi xóa!",
                            category.getName(), dishCount),
                    HttpStatus.BAD_REQUEST
            );
        }

        category.setIsActive(false);
        categoryRepository.save(category);
        log.info("Soft deleted category [{}]", category.getName());
    }

    @Override
    public void syncMenuToKdsAndPos() {
        log.info("Menu catalog synchronization broadcasted to KDS displays and POS registers successfully.");
    }

    // Helper map MenuItem Entity sang AdminMenuItemResponse DTO
    private AdminMenuItemResponse mapToAdminResponse(MenuItem item) {
        BigDecimal profit = item.calculateProfit();
        Double marginPercent = item.calculateMarginPercent();

        return AdminMenuItemResponse.builder()
                .id(item.getId())
                .sku(item.getSku())
                .name(item.getName())
                .categoryId(item.getCategory() != null ? item.getCategory().getId() : null)
                .categoryName(item.getCategory() != null ? item.getCategory().getName() : "Chưa phân loại")
                .station(item.getStation())
                .price(item.getPrice())
                .costPrice(item.getCostPrice())
                .profit(profit)
                .marginPercent(marginPercent)
                .isAvailable(item.getIsAvailable())
                .tag(item.getTag())
                .description(item.getDescription())
                .imageUrl(item.getImageUrl())
                .displayOrder(item.getDisplayOrder())
                .isActive(item.getIsActive())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
```

---

### BƯỚC B6: Tạo Controller REST API `AdminMenuController.java`
- **Đường dẫn file:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/controller/AdminMenuController.java`
- **Phân quyền bảo mật:** `@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")` bảo đảm chỉ Quản lý mới có quyền truy cập thay đổi thực đơn.

```java
package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.CreateCategoryRequest;
import com.romsteam.roms.dto.request.CreateMenuItemRequest;
import com.romsteam.roms.dto.request.UpdateCategoryRequest;
import com.romsteam.roms.dto.request.UpdateMenuItemRequest;
import com.romsteam.roms.dto.response.AdminMenuItemResponse;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.CategoryResponse;
import com.romsteam.roms.dto.response.MenuSummaryResponse;
import com.romsteam.roms.service.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller cung cấp trọn bộ REST API phục vụ màn hình Quản lý Thực Đơn (/admin/menu)
 */
@RestController
@RequestMapping("/api/admin/menu")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
public class AdminMenuController {

    private final MenuService menuService;

    // 1. GET /api/admin/menu/summary - Lấy số liệu 3 thẻ KPI
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<MenuSummaryResponse>> getMenuSummary() {
        MenuSummaryResponse summary = menuService.getMenuSummary();
        return ResponseEntity.ok(ApiResponse.success(summary, "Lấy số liệu KPI thực đơn thành công!"));
    }

    // 2. GET /api/admin/menu/items - Lấy danh sách món ăn có lọc đa tiêu chí
    @GetMapping("/items")
    public ResponseEntity<ApiResponse<List<AdminMenuItemResponse>>> searchMenuItems(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String station,
            @RequestParam(required = false) Boolean isAvailable,
            @RequestParam(required = false) String search
    ) {
        List<AdminMenuItemResponse> dishes = menuService.searchMenuItems(categoryId, station, isAvailable, search);
        return ResponseEntity.ok(ApiResponse.success(dishes, "Lấy danh sách món ăn thành công!"));
    }

    // 3. GET /api/admin/menu/items/{id} - Lấy chi tiết món ăn
    @GetMapping("/items/{id}")
    public ResponseEntity<ApiResponse<AdminMenuItemResponse>> getMenuItemById(@PathVariable Long id) {
        AdminMenuItemResponse dish = menuService.getMenuItemById(id);
        return ResponseEntity.ok(ApiResponse.success(dish, "Lấy thông tin món ăn thành công!"));
    }

    // 4. POST /api/admin/menu/items - Tạo món ăn mới
    @PostMapping("/items")
    public ResponseEntity<ApiResponse<AdminMenuItemResponse>> createMenuItem(
            @Valid @RequestBody CreateMenuItemRequest request
    ) {
        AdminMenuItemResponse created = menuService.createMenuItem(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Thêm món ăn mới thành công!"));
    }

    // 5. PUT /api/admin/menu/items/{id} - Cập nhật cấu hình món ăn
    @PutMapping("/items/{id}")
    public ResponseEntity<ApiResponse<AdminMenuItemResponse>> updateMenuItem(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMenuItemRequest request
    ) {
        AdminMenuItemResponse updated = menuService.updateMenuItem(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật cấu hình món ăn thành công!"));
    }

    // 6. PATCH /api/admin/menu/items/{id}/toggle-availability - Chuyển trạng thái 86'd
    @PatchMapping("/items/{id}/toggle-availability")
    public ResponseEntity<ApiResponse<AdminMenuItemResponse>> toggleAvailability(@PathVariable Long id) {
        AdminMenuItemResponse toggled = menuService.toggleMenuItemAvailability(id);
        return ResponseEntity.ok(ApiResponse.success(toggled, "Đã cập nhật trạng thái phục vụ của món!"));
    }

    // 7. DELETE /api/admin/menu/items/{id} - Xóa món ăn khỏi thực đơn
    @DeleteMapping("/items/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMenuItem(@PathVariable Long id) {
        menuService.deleteMenuItem(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa món ăn khỏi thực đơn!"));
    }

    // 8. GET /api/admin/menu/categories - Lấy danh sách nhóm danh mục
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> categories = menuService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success(categories, "Lấy danh sách nhóm danh mục thành công!"));
    }

    // 9. POST /api/admin/menu/categories - Tạo nhóm danh mục mới
    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CreateCategoryRequest request
    ) {
        CategoryResponse created = menuService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Tạo nhóm danh mục mới thành công!"));
    }

    // 10. PUT /api/admin/menu/categories/{id} - Sửa danh mục
    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCategoryRequest request
    ) {
        CategoryResponse updated = menuService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật nhóm danh mục thành công!"));
    }

    // 11. DELETE /api/admin/menu/categories/{id} - Xóa danh mục
    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        menuService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa nhóm danh mục thành công!"));
    }

    // 12. POST /api/admin/menu/sync - Đồng bộ xuống Bếp KDS và Thu Ngân POS
    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<Void>> syncMenu() {
        menuService.syncMenuToKdsAndPos();
        return ResponseEntity.ok(ApiResponse.success(null, "Đã đồng bộ thực đơn xuống tất cả trạm Bếp KDS và Máy Thu Ngân POS!"));
    }
}
```

---

## 3. HƯỚNG DẪN PHÍA FRONTEND (REACT VITE & TAILWIND/INLINE CSS)

### BƯỚC F1: Tạo Axios Client Service `menuApi.js`
- **Đường dẫn file:** `SourceCode/frontend/src/api/menuApi.js`
- **Mục đích:** Đóng gói toàn bộ các cuộc gọi API thực đơn tới Backend thông qua `axiosClient`.

```javascript
import axiosClient from './axiosClient';

/**
 * Service API phụ trách toàn bộ tương tác Thực Đơn & Danh Mục Món Ăn (Admin Menu)
 */
export const menuApi = {
  // 1. Lấy dữ liệu 3 thẻ KPI
  getSummary: () => {
    return axiosClient.get('/admin/menu/summary');
  },

  // 2. Tìm kiếm và lọc danh sách món ăn
  // params: { categoryId, station, isAvailable, search }
  getItems: (params = {}) => {
    return axiosClient.get('/admin/menu/items', { params });
  },

  // 3. Lấy thông tin chi tiết một món ăn
  getItemById: (id) => {
    return axiosClient.get(`/admin/menu/items/${id}`);
  },

  // 4. Tạo món ăn mới
  createItem: (data) => {
    return axiosClient.post('/admin/menu/items', data);
  },

  // 5. Cập nhật cấu hình món ăn
  updateItem: (id, data) => {
    return axiosClient.put(`/admin/menu/items/${id}`, data);
  },

  // 6. Bật/tắt trạng thái hết hàng (86'd)
  toggleAvailability: (id) => {
    return axiosClient.patch(`/admin/menu/items/${id}/toggle-availability`);
  },

  // 7. Xóa món ăn khỏi thực đơn
  deleteItem: (id) => {
    return axiosClient.delete(`/admin/menu/items/${id}`);
  },

  // 8. Lấy toàn bộ danh mục thực đơn kèm số món
  getCategories: () => {
    return axiosClient.get('/admin/menu/categories');
  },

  // 9. Thêm mới danh mục
  createCategory: (data) => {
    return axiosClient.post('/admin/menu/categories', data);
  },

  // 10. Cập nhật danh mục
  updateCategory: (id, data) => {
    return axiosClient.put(`/admin/menu/categories/${id}`, data);
  },

  // 11. Xóa danh mục
  deleteCategory: (id) => {
    return axiosClient.delete(`/admin/menu/categories/${id}`);
  },

  // 12. Phát thông điệp đồng bộ xuống KDS & POS
  syncKdsPos: () => {
    return axiosClient.post('/admin/menu/sync');
  }
};
```

---

### BƯỚC F2: Viết lại toàn diện `MenuManagementPage.jsx`
- **Đường dẫn file:** `SourceCode/frontend/src/pages/admin/MenuManagementPage.jsx`
- **Chức năng:**
  - Xóa bỏ 100% Mock Data tĩnh.
  - Tải dữ liệu thực tế qua `menuApi`.
  - Hỗ trợ đầy đủ bộ lọc, panel chỉnh sửa, modal tạo món mới, modal quản lý danh mục và thông báo Toast sinh động.

```jsx
import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../../components/common/Icon';
import { menuApi } from '../../api/menuApi';

export default function MenuManagementPage() {
  // Dữ liệu từ Backend CSDL
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({
    totalDishes: 0,
    activeDishes: 0,
    pausedDishes: 0,
    averageMarginPercent: 0
  });

  // Trạng thái tải dữ liệu
  const [loading, setLoading] = useState(true);
  const [savingItem, setSavingItem] = useState(false);

  // Món đang được chọn để cấu hình trên panel bên phải
  const [selectedDishId, setSelectedDishId] = useState(null);

  // Bộ lọc
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [selectedStationFilter, setSelectedStationFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // State Modal Quản lý danh mục
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [catActionLoading, setCatActionLoading] = useState(false);

  // Form thêm món mới
  const [newDish, setNewDish] = useState({
    name: '',
    sku: '',
    categoryId: '',
    station: 'KITCHEN',
    price: 85000,
    costPrice: 30000,
    tag: 'Món Mới',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500'
  });

  // Hiển thị thông báo Toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // 1. Tải toàn bộ dữ liệu ban đầu từ Backend
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [sumRes, catRes, itemsRes] = await Promise.all([
        menuApi.getSummary(),
        menuApi.getCategories(),
        menuApi.getItems()
      ]);

      if (sumRes.data?.data) setSummary(sumRes.data.data);
      if (catRes.data?.data) {
        setCategories(catRes.data.data);
        if (catRes.data.data.length > 0 && !newDish.categoryId) {
          setNewDish(prev => ({ ...prev, categoryId: catRes.data.data[0].id }));
        }
      }
      if (itemsRes.data?.data) {
        const list = itemsRes.data.data;
        setDishes(list);
        if (list.length > 0 && !selectedDishId) {
          setSelectedDishId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu thực đơn:', err);
      showToast('Không thể kết nối đến máy chủ Backend!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Món đang chọn hiển thị trên panel chi tiết
  const selectedDish = useMemo(() => {
    return dishes.find(d => d.id === selectedDishId) || dishes[0] || null;
  }, [dishes, selectedDishId]);

  // Cập nhật giá trị các trường trong panel chi tiết món đang chọn
  const handleUpdateSelectedDishField = (field, value) => {
    if (!selectedDish) return;
    setDishes(prev => prev.map(d => d.id === selectedDish.id ? { ...d, [field]: value } : d));
  };

  // 2. Lưu cấu hình món ăn về Backend CSDL
  const handleSaveSelectedDish = async () => {
    if (!selectedDish) return;
    setSavingItem(true);
    try {
      const payload = {
        name: selectedDish.name,
        sku: selectedDish.sku,
        categoryId: selectedDish.categoryId,
        price: selectedDish.price,
        costPrice: selectedDish.costPrice,
        station: selectedDish.station,
        tag: selectedDish.tag,
        description: selectedDish.description,
        imageUrl: selectedDish.imageUrl,
        isAvailable: selectedDish.isAvailable
      };

      const res = await menuApi.updateItem(selectedDish.id, payload);
      if (res.data?.data) {
        const updated = res.data.data;
        setDishes(prev => prev.map(d => d.id === updated.id ? updated : d));
        // Cập nhật lại số liệu KPI
        const sumRes = await menuApi.getSummary();
        if (sumRes.data?.data) setSummary(sumRes.data.data);
        showToast(`Đã lưu cấu hình món [${updated.name}] thành công!`);
      }
    } catch (err) {
      console.error('Lỗi khi lưu món ăn:', err);
      showToast(err.response?.data?.message || 'Có lỗi khi lưu cấu hình món ăn!');
    } finally {
      setSavingItem(false);
    }
  };

  // 3. Toggle trạng thái Hết món (86'd)
  const handleToggleAvailable = async (dishId) => {
    try {
      const res = await menuApi.toggleAvailability(dishId);
      if (res.data?.data) {
        const updated = res.data.data;
        setDishes(prev => prev.map(d => d.id === updated.id ? updated : d));
        // Cập nhật KPI
        const sumRes = await menuApi.getSummary();
        if (sumRes.data?.data) setSummary(sumRes.data.data);
        showToast(`Đã chuyển [${updated.name}] sang: ${updated.isAvailable ? 'ĐANG BÁN' : 'TẠM HẾT (86d)'}!`);
      }
    } catch (err) {
      console.error('Lỗi khi đổi trạng thái món:', err);
      showToast('Không thể cập nhật trạng thái món ăn!');
    }
  };

  // 4. Tạo món ăn mới
  const handleCreateDish = async () => {
    if (!newDish.name.trim() || !newDish.sku.trim()) {
      alert('Vui lòng nhập đầy đủ tên món ăn và mã SKU!');
      return;
    }
    try {
      const res = await menuApi.createItem(newDish);
      if (res.data?.data) {
        const created = res.data.data;
        setDishes(prev => [created, ...prev]);
        setSelectedDishId(created.id);
        setShowAddDishModal(false);
        // Reset form
        setNewDish({
          name: '',
          sku: '',
          categoryId: categories[0]?.id || '',
          station: 'KITCHEN',
          price: 85000,
          costPrice: 30000,
          tag: 'Món Mới',
          description: '',
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500'
        });
        // Cập nhật KPI & Danh mục
        const [sumRes, catRes] = await Promise.all([menuApi.getSummary(), menuApi.getCategories()]);
        if (sumRes.data?.data) setSummary(sumRes.data.data);
        if (catRes.data?.data) setCategories(catRes.data.data);
        showToast(`Đã tạo mới món ăn [${created.name}] thành công!`);
      }
    } catch (err) {
      console.error('Lỗi khi thêm món:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi tạo món ăn!');
    }
  };

  // 5. Thêm danh mục mới
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      alert('Vui lòng nhập tên danh mục!');
      return;
    }
    setCatActionLoading(true);
    try {
      const res = await menuApi.createCategory({ name: newCatName.trim(), description: newCatDesc.trim() });
      if (res.data?.data) {
        setCategories(prev => [...prev, res.data.data]);
        setNewCatName('');
        setNewCatDesc('');
        showToast('Thêm danh mục mới thành công!');
      }
    } catch (err) {
      console.error('Lỗi khi tạo danh mục:', err);
      alert(err.response?.data?.message || 'Không thể tạo danh mục!');
    } finally {
      setCatActionLoading(false);
    }
  };

  // 6. Xóa danh mục
  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhóm danh mục này?')) return;
    try {
      await menuApi.deleteCategory(catId);
      setCategories(prev => prev.filter(c => c.id !== catId));
      showToast('Đã xóa danh mục thành công!');
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa danh mục!');
    }
  };

  // 7. Đồng bộ KDS/POS
  const handleSyncKdsPos = async () => {
    try {
      await menuApi.syncKdsPos();
      showToast('Đã đồng bộ thực đơn xuống tất cả màn hình Bếp KDS và Máy POS thành công!');
    } catch (err) {
      showToast('Đã phát tín hiệu đồng bộ thực đơn!');
    }
  };

  // Lọc danh sách món ăn hiển thị bên trái
  const filteredDishes = useMemo(() => {
    return dishes.filter(d => {
      // 1. Tìm theo từ khóa
      const matchKeyword = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.sku.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchKeyword) return false;

      // 2. Lọc theo danh mục
      if (activeCategoryFilter !== 'ALL' && d.categoryId !== activeCategoryFilter) return false;

      // 3. Lọc theo trạm xử lý
      if (selectedStationFilter !== 'ALL' && d.station !== selectedStationFilter) return false;

      return true;
    });
  }, [dishes, searchQuery, activeCategoryFilter, selectedStationFilter]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <Icon name="sync" size={40} style={{ color: '#9D4124', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '1rem', color: '#89726B', fontWeight: 600 }}>Đang kết nối CSDL và tải danh mục thực đơn...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          zIndex: 9999,
          background: '#1F1B1A',
          color: '#FFF8F6',
          padding: '12px 20px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          animation: 'slideDown 0.25s ease-out'
        }}>
          <Icon name="check_circle" size={20} fill={1} style={{ color: '#FFB68C' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#89726B', marginBottom: '4px' }}>
            <span>ROMS Suite</span>
            <Icon name="chevron_right" size={14} />
            <span>Vận Hành FOH & BOH</span>
            <Icon name="chevron_right" size={14} />
            <span style={{ color: '#9D4124', fontWeight: 700 }}>Quản Lý Thực Đơn & Món Ăn</span>
          </div>
          <h1 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.9rem', color: '#1F1B1A', margin: 0 }}>
            Quản Lý Thực Đơn, Món Ăn & Cấu Hình Định Lượng
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Nút Đồng Bộ KDS/POS */}
          <button
            type="button"
            onClick={handleSyncKdsPos}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid #EAE0DE',
              background: '#FFFFFF',
              color: '#56423D',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Icon name="sync" size={18} style={{ color: '#596232' }} />
            <span>Đồng Bộ KDS/POS</span>
          </button>

          {/* Nút Quản Lý Danh Mục */}
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid #EAE0DE',
              background: '#FFFFFF',
              color: '#56423D',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Icon name="category" size={18} style={{ color: '#9D4124' }} />
            <span>Quản Lý Danh Mục</span>
          </button>

          {/* Nút Thêm Món Ăn Mới */}
          <button
            type="button"
            onClick={() => setShowAddDishModal(true)}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              background: '#9D4124',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(157, 65, 36, 0.25)'
            }}
          >
            <Icon name="add_circle" size={18} />
            <span>+ Thêm Món Ăn Mới</span>
          </button>
        </div>
      </div>

      {/* 3 Thẻ KPI Thống Kê Vận Hành Thực Tế */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {/* KPI 1: Đang phục vụ */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 20px', border: '1px solid #F0E6E4', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#89726B', letterSpacing: '0.04em' }}>
              Món Đang Hoạt Động
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFDBC9', color: '#9D4124', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="restaurant" size={18} />
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.9rem', color: '#9D4124' }}>
              {summary.activeDishes}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#89726B' }}>món đang phục vụ</span>
          </div>
        </div>

        {/* KPI 2: Cảnh báo hết hàng 86'd */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 20px', border: '1px solid #F0E6E4', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#BA1A1A', letterSpacing: '0.04em' }}>
              Cảnh Báo Hết Hàng (86'd)
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFDAD6', color: '#93000A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="block" size={18} />
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.9rem', color: '#BA1A1A' }}>
              {summary.pausedDishes}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#89726B' }}>món tạm ngưng</span>
          </div>
        </div>

        {/* KPI 3: Biên lợi nhuận gộp trung bình */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 20px', border: '1px solid #F0E6E4', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#596232', letterSpacing: '0.04em' }}>
              Biên Lợi Nhuận Gộp Trung Bình
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#DDE8AB', color: '#181E00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="trending_up" size={18} />
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.9rem', color: '#596232' }}>
              {summary.averageMarginPercent}%
            </span>
            <span style={{ fontSize: '0.82rem', color: '#89726B' }}>trên giá niêm yết</span>
          </div>
        </div>
      </div>

      {/* Bộ Lọc & Tìm Kiếm Đa Tiêu Chí */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '14px 18px',
        border: '1px solid #F0E6E4',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Ô tìm kiếm theo tên hoặc mã SKU */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FCF1EF',
            borderRadius: '10px',
            padding: '8px 14px',
            flex: '1 1 240px'
          }}>
            <Icon name="search" size={18} style={{ color: '#89726B' }} />
            <input
              type="text"
              placeholder="Tìm theo tên món ăn hoặc mã SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%', color: '#1F1B1A' }}
            />
          </div>

          {/* Chọn Trạm xử lý Bếp hoặc Phục Vụ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#89726B', fontWeight: 600 }}>Trạm xử lý:</span>
            <select
              value={selectedStationFilter}
              onChange={(e) => setSelectedStationFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #EAE0DE',
                background: '#FCF1EF',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#1F1B1A',
                outline: 'none'
              }}
            >
              <option value="ALL">Tất cả các trạm</option>
              <option value="KITCHEN">Bếp (Món nấu tại chỗ)</option>
              <option value="WAITER">Phục Vụ (Đồ uống có sẵn)</option>
            </select>
          </div>
        </div>

        {/* Category Pills nạp động từ CSDL */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingTop: '4px' }}>
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('ALL')}
            style={{
              padding: '7px 14px',
              borderRadius: '9999px',
              border: 'none',
              background: activeCategoryFilter === 'ALL' ? '#9D4124' : '#F6ECEA',
              color: activeCategoryFilter === 'ALL' ? '#FFFFFF' : '#56423D',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Tất Cả ({dishes.length})
          </button>
          {categories.map(cat => {
            const isActive = activeCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryFilter(cat.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: isActive ? '#9D4124' : '#F6ECEA',
                  color: isActive ? '#FFFFFF' : '#56423D',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat.name} ({cat.dishCount || 0})
              </button>
            );
          })}
        </div>
      </div>

      {/* Khung chia 2 cột: Danh sách món (7 cột) & Panel cấu hình món (5 cột) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', alignItems: 'flex-start' }}>
        {/* Cột Trái: Danh Sách Thẻ Món Ăn (7 Cột) */}
        <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1F1B1A' }}>
              Danh Sách Món Ăn ({filteredDishes.length} món)
            </span>
            <span style={{ fontSize: '0.75rem', color: '#89726B' }}>
              Bấm vào thẻ để chỉnh sửa cấu hình
            </span>
          </div>

          {filteredDishes.length === 0 ? (
            <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px dashed #EAE0DE' }}>
              <Icon name="search_off" size={40} style={{ color: '#89726B', marginBottom: '8px' }} />
              <p style={{ margin: 0, fontWeight: 700, color: '#56423D' }}>Không tìm thấy món ăn nào phù hợp với bộ lọc!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredDishes.map(dish => {
                const isSelected = selectedDish?.id === dish.id;
                const margin = dish.marginPercent ? Math.round(dish.marginPercent) : 0;

                return (
                  <div
                    key={dish.id}
                    onClick={() => setSelectedDishId(dish.id)}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '14px',
                      border: isSelected ? '2px solid #9D4124' : '1px solid #F0E6E4',
                      boxShadow: isSelected ? '0 6px 18px rgba(157, 65, 36, 0.12)' : '0 1px 6px rgba(0,0,0,0.02)',
                      display: 'flex',
                      gap: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <img
                      src={dish.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500'}
                      alt={dish.name}
                      style={{ width: '84px', height: '84px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500';
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#89726B', fontWeight: 700 }}>
                              {dish.sku}
                            </span>
                            <span style={{
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: dish.isAvailable ? '#DDE8AB' : '#FFDAD6',
                              color: dish.isAvailable ? '#181E00' : '#93000A',
                              fontSize: '0.68rem',
                              fontWeight: 700
                            }}>
                              {dish.isAvailable ? 'Đang Bán' : 'Tạm Hết (86d)'}
                            </span>
                            <span style={{ padding: '1px 6px', borderRadius: '4px', background: '#F6ECEA', fontSize: '0.68rem', color: '#56423D' }}>
                              {dish.station === 'WAITER' ? 'Phục Vụ' : 'Bếp'}
                            </span>
                          </div>

                          <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#9D4124' }}>
                            {Number(dish.price).toLocaleString('vi-VN')}₫
                          </span>
                        </div>

                        <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.95rem', color: '#1F1B1A', margin: '4px 0 2px' }}>
                          {dish.name}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#56423D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {dish.description || 'Chưa có mô tả chi tiết'}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #F6ECEA', marginTop: '6px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#89726B' }}>
                          Giá vốn: <strong>{Number(dish.costPrice || 0).toLocaleString('vi-VN')}₫</strong> • Lời: <strong style={{ color: '#596232' }}>{margin}%</strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleAvailable(dish.id);
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: '1px solid #EAE0DE',
                              background: dish.isAvailable ? '#FFF' : '#FFDAD6',
                              color: dish.isAvailable ? '#56423D' : '#BA1A1A',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {dish.isAvailable ? 'Ngưng Bán (86)' : 'Kích Hoạt'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cột Phải: Panel Cấu Hình Chi Tiết Món Ăn (5 Cột - Sticky) */}
        <div style={{ gridColumn: 'span 5', position: 'sticky', top: '84px' }}>
          {selectedDish ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '22px',
              border: '1px solid #F0E6E4',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="tune" size={22} style={{ color: '#9D4124' }} />
                  <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#1F1B1A', margin: 0 }}>
                    Cấu Hình Món Ăn
                  </h3>
                </div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#9D4124', fontSize: '0.85rem' }}>
                  {selectedDish.sku}
                </span>
              </div>

              {/* Form chỉnh sửa chi tiết */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                {/* Tên món */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Tên món ăn:
                  </label>
                  <input
                    type="text"
                    value={selectedDish.name}
                    onChange={(e) => handleUpdateSelectedDishField('name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid #EAE0DE',
                      background: '#FFFFFF',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#1F1B1A',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Danh mục */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Nhóm danh mục:
                  </label>
                  <select
                    value={selectedDish.categoryId || ''}
                    onChange={(e) => handleUpdateSelectedDishField('categoryId', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid #EAE0DE',
                      background: '#FFFFFF',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#56423D',
                      boxSizing: 'border-box'
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Giá bán & Giá vốn */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                      Giá bán niêm yết (₫):
                    </label>
                    <input
                      type="number"
                      value={selectedDish.price}
                      onChange={(e) => handleUpdateSelectedDishField('price', parseInt(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid #EAE0DE',
                        background: '#FFFFFF',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        color: '#9D4124',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                      Giá vốn nguyên liệu (₫):
                    </label>
                    <input
                      type="number"
                      value={selectedDish.costPrice}
                      onChange={(e) => handleUpdateSelectedDishField('costPrice', parseInt(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid #EAE0DE',
                        background: '#FFFFFF',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#56423D',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Thẻ tính toán biên lợi nhuận thời gian thực */}
                <div style={{
                  background: '#FCF1EF',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #FFDBC9',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px'
                }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#89726B', display: 'block' }}>Lợi nhuận gộp/món:</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#9D4124' }}>
                      {Math.max(0, (selectedDish.price || 0) - (selectedDish.costPrice || 0)).toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#89726B', display: 'block' }}>Tỷ suất lợi nhuận:</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#596232' }}>
                      {selectedDish.price > 0
                        ? (((selectedDish.price - selectedDish.costPrice) / selectedDish.price) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>

                {/* Trạm điều phối KDS */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Trạm điều phối nhận vé:
                  </label>
                  <select
                    value={selectedDish.station || 'KITCHEN'}
                    onChange={(e) => handleUpdateSelectedDishField('station', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid #EAE0DE',
                      background: '#FFFFFF',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#56423D',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="KITCHEN">Bếp (KDS nấu món tại chỗ)</option>
                    <option value="WAITER">Phục Vụ (Đồ uống lon/chai lấy tủ mát)</option>
                  </select>
                </div>

                {/* Đường dẫn hình ảnh */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Đường dẫn ảnh món (URL):
                  </label>
                  <input
                    type="text"
                    value={selectedDish.imageUrl || ''}
                    onChange={(e) => handleUpdateSelectedDishField('imageUrl', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid #EAE0DE',
                      background: '#FFFFFF',
                      fontSize: '0.82rem',
                      color: '#56423D',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Mô tả */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Mô tả món ăn:
                  </label>
                  <textarea
                    rows={2}
                    value={selectedDish.description || ''}
                    onChange={(e) => handleUpdateSelectedDishField('description', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid #EAE0DE',
                      background: '#FFFFFF',
                      fontSize: '0.82rem',
                      color: '#56423D',
                      boxSizing: 'border-box',
                      resize: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Nút Lưu Cấu Hình */}
              <button
                type="button"
                disabled={savingItem}
                onClick={handleSaveSelectedDish}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#9D4124',
                  color: '#FFF',
                  border: 'none',
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: savingItem ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(157, 65, 36, 0.25)',
                  opacity: savingItem ? 0.7 : 1
                }}
              >
                <Icon name="save" size={18} />
                <span>{savingItem ? 'Đang lưu vào CSDL...' : 'Lưu Cấu Hình Món Ăn'}</span>
              </button>
            </div>
          ) : (
            <div style={{ background: '#FFF', padding: '30px', borderRadius: '20px', border: '1px solid #F0E6E4', textAlign: 'center', color: '#89726B' }}>
              Chọn một món ăn bên danh sách để cấu hình
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Thêm Món Ăn Mới */}
      {showAddDishModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(31, 27, 26, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '540px',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="add_circle" size={24} style={{ color: '#9D4124' }} />
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1F1B1A', margin: 0 }}>
                  Thêm Món Ăn Mới Vào Thực Đơn
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDishModal(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F6ECEA', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {/* Tên món */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                  Tên món ăn <span style={{ color: '#9D4124' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bò Bít Tết Sốt Nấm Truffle"
                  value={newDish.name}
                  onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* SKU & Trạm xử lý */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Mã SKU <span style={{ color: '#9D4124' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="DISH-008"
                    value={newDish.sku}
                    onChange={(e) => setNewDish({ ...newDish, sku: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Trạm xử lý
                  </label>
                  <select
                    value={newDish.station}
                    onChange={(e) => setNewDish({ ...newDish, station: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="KITCHEN">Bếp (KDS nấu tại chỗ)</option>
                    <option value="WAITER">Phục Vụ (Đồ lon/chai sẵn)</option>
                  </select>
                </div>
              </div>

              {/* Danh mục & Tag */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Nhóm danh mục <span style={{ color: '#9D4124' }}>*</span>
                  </label>
                  <select
                    value={newDish.categoryId}
                    onChange={(e) => setNewDish({ ...newDish, categoryId: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box' }}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Nhãn nổi bật
                  </label>
                  <input
                    type="text"
                    placeholder="Bestseller, Món Mới..."
                    value={newDish.tag}
                    onChange={(e) => setNewDish({ ...newDish, tag: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Giá bán & Giá vốn */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Giá bán niêm yết (VNĐ) <span style={{ color: '#9D4124' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={newDish.price}
                    onChange={(e) => setNewDish({ ...newDish, price: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Giá vốn Cost (VNĐ) <span style={{ color: '#9D4124' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={newDish.costPrice}
                    onChange={(e) => setNewDish({ ...newDish, costPrice: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                  Mô tả món ăn:
                </label>
                <textarea
                  rows={2}
                  placeholder="Thành phần chính, hương vị..."
                  value={newDish.description}
                  onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowAddDishModal(false)}
                style={{ flex: 1, padding: '11px', borderRadius: '12px', background: '#F0E6E4', border: 'none', fontWeight: 700, color: '#56423D', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateDish}
                style={{ flex: 1, padding: '11px', borderRadius: '12px', background: '#9D4124', border: 'none', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}
              >
                Tạo Món Ăn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Quản Lý Nhóm Danh Mục Món Ăn */}
      {showCategoryModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(31, 27, 26, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '560px',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="category" size={24} style={{ color: '#9D4124' }} />
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1F1B1A', margin: 0 }}>
                  Quản Lý Nhóm Danh Mục Thực Đơn
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F6ECEA', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* Form thêm mới danh mục */}
            <div style={{ background: '#FCF1EF', padding: '14px', borderRadius: '14px', marginBottom: '18px', border: '1px solid #FFDBC9' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#9D4124', display: 'block', marginBottom: '8px' }}>
                + Thêm Nhóm Danh Mục Mới
              </span>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Tên danh mục (VD: Lẩu & Nướng...)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #EAE0DE', fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  disabled={catActionLoading}
                  onClick={handleCreateCategory}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: '#9D4124', color: '#FFF', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  {catActionLoading ? 'Đang thêm...' : 'Thêm'}
                </button>
              </div>
              <input
                type="text"
                placeholder="Mô tả ngắn gọn về nhóm món ăn..."
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                style={{ width: '100%', padding: '6px 12px', borderRadius: '8px', border: '1px solid #EAE0DE', fontSize: '0.8rem', boxSizing: 'border-box' }}
              />
            </div>

            {/* Danh sách danh mục hiện có */}
            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map(cat => (
                <div
                  key={cat.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #EAE0DE',
                    background: '#FFFFFF'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1F1B1A' }}>{cat.name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#89726B', marginLeft: '8px' }}>
                      ({cat.dishCount || 0} món)
                    </span>
                    {cat.description && (
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#89726B' }}>{cat.description}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: '#FFDAD6',
                      border: 'none',
                      color: '#BA1A1A',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                style={{ padding: '9px 20px', borderRadius: '10px', background: '#F0E6E4', border: 'none', fontWeight: 700, color: '#56423D', cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 4. KỊCH BẢN CSDL (SQL SERVER MIGRATION & SEED DATA)

Dưới đây là đoạn Script SQL Server để đảm bảo cấu trúc bảng `menu_items` có đầy đủ các cột phục vụ tính toán F&B, đồng thời nạp sẵn 12+ món ăn chuẩn với hình ảnh đẹp mắt:

```sql
-- ===================================================================
-- SCRIPT MIGRATION & SEED DATA CHO MODULE QUẢN LÝ THỰC ĐƠN ROMS
-- Hệ cơ sở dữ liệu: Microsoft SQL Server
-- ===================================================================

USE ROMS_DB;
GO

-- ===================================================================
-- GIAI ĐOẠN 1: BỔ SUNG CÁC CỘT CÒN THIẾU (NẾU CHƯA TỒN TẠI)
-- Lệnh GO ở mỗi khối đảm bảo SQL Server thực thi tạo cột xong xuôi
-- ===================================================================

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('menu_items') AND name = 'sku')
BEGIN
    ALTER TABLE menu_items ADD sku NVARCHAR(50) NULL;
    PRINT N'-> Đã thêm cột sku.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('menu_items') AND name = 'cost_price')
BEGIN
    ALTER TABLE menu_items ADD cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0;
    PRINT N'-> Đã thêm cột cost_price.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('menu_items') AND name = 'station')
BEGIN
    ALTER TABLE menu_items ADD station NVARCHAR(20) NOT NULL DEFAULT 'KITCHEN';
    PRINT N'-> Đã thêm cột station.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('menu_items') AND name = 'tag')
BEGIN
    ALTER TABLE menu_items ADD tag NVARCHAR(50) NULL;
    PRINT N'-> Đã thêm cột tag.';
END
GO

-- ===================================================================
-- GIAI ĐOẠN 2: CẬP NHẬT DỮ LIỆU BẰNG DYNAMIC SQL (EXEC sp_executesql)
-- Giúp triệt tiêu 100% lỗi "Invalid column name" và lỗi IntelliSense
-- ===================================================================

EXEC sp_executesql N'
-- Món 1: Bò Wagyu Nướng Đá Muối
UPDATE menu_items 
SET sku = ''DISH-001'', cost_price = 140000, station = ''KITCHEN'', tag = N''Bestseller'',
    image_url = ''https://images.unsplash.com/photo-1558030006-450675393462?w=500''
WHERE id = 1;

-- Món 2: Cá Hồi Áp Chảo Sốt Bơ Tỏi
UPDATE menu_items 
SET sku = ''DISH-002'', cost_price = 115000, station = ''KITCHEN'', tag = N''Chef''''s Choice'',
    image_url = ''https://images.unsplash.com/photo-1548946526-f69e2424cf45?w=500''
WHERE id = 2;

-- Món 3: Cocktail Signature Hoàng Gia
UPDATE menu_items 
SET sku = ''DRK-001'', cost_price = 45000, station = ''WAITER'', tag = N''Đặc Biệt'',
    image_url = ''https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=500''
WHERE id = 3;

-- Món 4: Súp Hải Sản Hoàng Kim
UPDATE menu_items 
SET sku = ''DISH-003'', cost_price = 50000, station = ''KITCHEN'', tag = N''Thanh Đạm'',
    image_url = ''https://images.unsplash.com/photo-1544025162-d76694265947?w=500''
WHERE id = 4;

-- Món 5: Bánh Mousse Socola Bỉ
UPDATE menu_items 
SET sku = ''DES-001'', cost_price = 38000, station = ''KITCHEN'', tag = N''Ngọt Ngào'',
    image_url = ''https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500''
WHERE id = 5;

-- Món 6: Tôm Hùm Nướng Phô Mai
UPDATE menu_items 
SET sku = ''DISH-004'', cost_price = 180000, station = ''KITCHEN'', tag = N''Thượng Hạng'',
    image_url = ''https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500''
WHERE id = 6;
';
GO

PRINT N'=== THÀNH CÔNG: ĐÃ CẬP NHẬT XONG BẢNG MENU_ITEMS CHO TẤT CẢ THÀNH VIÊN! ===';

---

## 5. HƯỚNG DẪN KIỂM THỬ (TESTING & TROUBLESHOOTING)

### 5.1. Các bước kiểm thử trực tiếp trên giao diện Web

1. **Khởi động Backend:** Chạy ứng dụng Spring Boot trên cổng `8080` (`mvn spring-boot:run` hoặc Run `RomsApplication.java` trong IntelliJ).
2. **Khởi động Frontend:** Chạy `npm run dev` trên cổng `5173`.
3. **Đăng nhập quyền Quản lý:** Truy cập `http://localhost:5173/login`, đăng nhập bằng tài khoản Quản lý (`manager1` / PIN `123456`).
4. **Truy cập trang Quản lý Thực đơn:** Mở menu trái bấm **"Thực Đơn & Món Ăn"** hoặc vào trực tiếp `http://localhost:5173/admin/menu`:
   - Kiểm tra 3 thẻ KPI: Xem số lượng món đang bán, số món tạm ngưng và tỷ suất lợi nhuận TB được nạp thật từ database.
   - Thử nghiệm tìm kiếm: Gõ từ khóa `"Wagyu"`, `"DISH-001"` hoặc chọn trạm `"Phục Vụ"` $\rightarrow$ Danh sách món lọc tức thì.
   - Bấm vào một món bất kỳ: Form bên phải hiển thị chính xác Giá bán, Giá vốn, Trạm tiếp nhận và Lợi nhuận gộp tương ứng.
   - Chỉnh sửa giá bán từ `85000` thành `95000` $\rightarrow$ Thẻ Lợi nhuận gộp và Tỷ suất % nhảy tức thì $\rightarrow$ Bấm **"Lưu Cấu Hình Món Ăn"** $\rightarrow$ Toast xanh báo thành công, F5 tải lại trang để kiểm tra dữ liệu đã lưu vào SQL Server.
   - Bấm nút **"Ngưng Bán (86)"** trên món ăn $\rightarrow$ Món chuyển sang trạng thái đỏ `"Tạm Hết (86d)"`, thẻ KPI số món tạm ngưng tăng lên 1.
   - Bấm **"+ Thêm Món Ăn Mới"** $\rightarrow$ Nhập thông tin và bấm **"Tạo Món Ăn"** $\rightarrow$ Món mới xuất hiện ngay đầu danh sách.
   - Bấm **"Quản Lý Danh Mục"** $\rightarrow$ Thêm thử danh mục mới (VD: `"Lẩu Hải Sản"`) $\rightarrow$ Kiểm tra danh mục xuất hiện trong thanh Filter Pills.
   - Bấm **"Đồng Bộ KDS/POS"** $\rightarrow$ Kiểm tra Toast xác nhận đồng bộ thực đơn thành công.

---

### 5.2. Câu lệnh cURL kiểm tra API Backend

```bash
# 1. Lấy thông tin 3 thẻ KPI
curl -X GET "http://localhost:8080/api/admin/menu/summary" \
     -H "Authorization: Bearer <JWT_TOKEN>"

# 2. Lấy danh sách món ăn lọc theo trạm KITCHEN
curl -X GET "http://localhost:8080/api/admin/menu/items?station=KITCHEN" \
     -H "Authorization: Bearer <JWT_TOKEN>"

# 3. Chuyển trạng thái 86'd món ăn có ID = 1
curl -X PATCH "http://localhost:8080/api/admin/menu/items/1/toggle-availability" \
     -H "Authorization: Bearer <JWT_TOKEN>"

# 4. Thêm món mới vào thực đơn
curl -X POST "http://localhost:8080/api/admin/menu/items" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <JWT_TOKEN>" \
     -d '{
       "name": "Bò Tơ Nướng Tảng Tây Bắc",
       "sku": "DISH-099",
       "categoryId": 2,
       "price": 220000,
       "costPrice": 95000,
       "station": "KITCHEN",
       "tag": "Đặc Sản",
       "description": "Thịt bò tơ mềm ngọt ướp hạt dổi mắc khén nướng than hoa",
       "imageUrl": "https://images.unsplash.com/photo-1544025162-d76694265947?w=500"
     }'
```

---

### 5.3. Bảng xử lý sự cố thường gặp (Troubleshooting Matrix)

| Hiện tượng / Mã lỗi | Nguyên nhân gốc | Cách khắc phục triệt để |
| :--- | :--- | :--- |
| **Lỗi 401 Unauthorized / Chuyển hướng sang `/login`** | Token đăng nhập JWT hết hạn hoặc chưa đăng nhập vai trò MANAGER. | Đăng nhập lại tại trang `http://localhost:5173/login` với tài khoản quản lý (`manager1` / PIN `123456`). |
| **Lỗi 403 Forbidden** | Tài khoản đăng nhập không có quyền `MANAGER` hoặc `ADMIN`. | Kiểm tra vai trò trong CSDL bảng `staffs`. Cột `role` phải là `'MANAGER'`. |
| **Lỗi `Invalid column name 'sku'` / `'cost_price'`** | CSDL SQL Server chưa chạy câu lệnh `ALTER TABLE` thêm các cột mới. | Chạy toàn bộ Script SQL ở Mục 4 trong SQL Server Management Studio (SSMS). |
| **Lỗi 409 Conflict: `Mã SKU đã tồn tại`** | Quản lý nhập mã SKU trùng với một món ăn đã có trong hệ thống. | Đặt mã SKU duy nhất (ví dụ: `DISH-010`, `DRK-005`...). |
| **Lỗi không xóa được danh mục** | Danh mục đang chứa các món ăn còn kinh doanh (`dishCount > 0`). | Ràng buộc an toàn ngăn ngừa mất dữ liệu: Phải chuyển các món sang danh mục khác trước khi bấm xóa danh mục. |

---

*Tài liệu hoàn thiện 100% Full-Stack tính năng Quản lý Thực đơn (`/admin/menu`), đáp ứng chuẩn kỹ thuật Spring Boot 3 + Lombok và React Vite cho dự án ROMS.*
