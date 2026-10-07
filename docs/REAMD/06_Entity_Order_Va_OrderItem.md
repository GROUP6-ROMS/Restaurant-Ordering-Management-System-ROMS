# BƯỚC 06: TẠO ENUM TRẠNG THÁI & ENTITY ORDER, ORDERITEM (SỬ DỤNG LOMBOK)

## 1. Bước Này Làm Gì?
- Tạo các enum trạng thái: `OrderStatus` (trạng thái đợt gọi món) và `OrderItemStatus` (trạng thái từng món ăn).
- Tạo entity `Order` ánh xạ vào bảng `orders` (đại diện cho một đợt khách ấn nút gửi gọi món).
- Tạo entity `OrderItem` ánh xạ vào bảng `order_items` (chi tiết từng món ăn/đồ uống trong đợt gọi).
- **Sử dụng Lombok:** Thêm `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` loại bỏ hoàn toàn các constructor và getter/setter thủ công.
- **Điều phối trạm phục vụ (`targetStation`):**
  - Món ăn (`targetStation = "KITCHEN"`) chuyển vào màn hình KDS Bếp (`PENDING` -> `COOKING` -> `READY`).
  - Đồ uống đóng lon/chai sẵn (`targetStation = "WAITER"`) chuyển về Phục vụ lấy từ tủ mát (`WAITER_PREP` -> `SERVED`).

---

## 2. Các File Code & Chức Năng

### File 1: `OrderStatus.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/enums/OrderStatus.java`
- **Chức năng:** Định nghĩa các trạng thái của một đợt gọi món.

```java
package com.romsteam.roms.enums;

public enum OrderStatus {
    SUBMITTED,  // Khách vừa ấn gửi món từ điện thoại hoặc phục vụ tạo order
    CONFIRMED,  // Hệ thống đã ghi nhận và chuyển lệnh chế biến
    COOKING,    // Bếp đang thực hiện nấu các món trong đợt
    COMPLETED,  // Toàn bộ các món trong đợt đã được phục vụ ra bàn
    CANCELLED   // Đợt gọi món bị hủy bỏ hoàn toàn
}
```

---

### File 2: `OrderItemStatus.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/enums/OrderItemStatus.java`
- **Chức năng:** Định nghĩa các trạng thái chế biến và phục vụ của từng món ăn.

```java
package com.romsteam.roms.enums;

public enum OrderItemStatus {
    PENDING,      // Đang chờ xử lý
    COOKING,      // Bếp đang chế biến món ăn
    WAITER_PREP,  // Phục vụ đang chuẩn bị nước uống đóng lon/chai sẵn
    READY,        // Món đã hoàn thành, sẵn sàng mang ra bàn
    SERVED,       // Đã bưng ra bàn cho khách
    CANCELLED     // Món bị hủy (hết nguyên liệu hoặc khách yêu cầu đổi món)
}
```

---

### File 3: `Order.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/entity/Order.java`
- **Chức năng:** Đại diện cho bảng `orders`, lưu trữ từng đợt khách gọi món trong phiên ăn.

```java
package com.romsteam.roms.entity;

import com.romsteam.roms.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// Khai báo Entity đại diện cho bảng đợt gọi món
@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    // Khóa chính đợt gọi món
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Khóa ngoại trỏ sang phiên ăn: Một phiên ăn có thể gọi nhiều đợt món khác nhau
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private DiningSession session;

    // Khóa ngoại trỏ sang nhân viên tiếp nhận đơn (null nếu do khách tự quét QR đặt)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private Staff staff;

    // Mã đơn gọi món hiển thị thân thiện (ví dụ: "ORD-20261004-001")
    @Column(name = "order_code", nullable = false, unique = true, length = 50)
    private String orderCode;

    // Tổng tiền của riêng đợt gọi món này
    @Builder.Default
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    // Trạng thái tổng quát của đợt order
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OrderStatus status = OrderStatus.SUBMITTED;

    // Ghi chú chung của đợt gọi món (ví dụ: "Làm nhanh giúp bàn đang vội")
    @Column(name = "note", length = 255)
    private String note;

    // Thời điểm khách bấm gửi gọi món
    @Column(name = "order_time", nullable = false)
    private LocalDateTime orderTime;

    // Quan hệ 1 - Nhiều: Một đợt gọi món có danh sách nhiều món chi tiết (OrderItem)
    @Builder.Default
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    // Thời điểm tạo bản ghi
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm cập nhật bản ghi gần nhất
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Helper method tiện ích quản lý quan hệ 2 chiều
    public void addOrderItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }
}
```

---

### File 4: `OrderItem.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/entity/OrderItem.java`
- **Chức năng:** Đại diện cho bảng `order_items`, lưu từng món chi tiết trong đợt gọi món cùng số lượng, đơn giá và trạng thái chế biến tại bếp hoặc phục vụ.

```java
package com.romsteam.roms.entity;

import com.romsteam.roms.enums.OrderItemStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// Khai báo Entity đại diện cho bảng chi tiết món được gọi
@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    // Khóa chính chi tiết món
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Khóa ngoại liên kết ngược lại đợt gọi món (Order)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // Khóa ngoại trỏ sang món ăn trong thực đơn (MenuItem)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    // Số lượng món khách gọi (ví dụ: 2 phần, 3 chai)
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    // Đơn giá tại thời điểm gọi món (Snapshot giá)
    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    // Thành tiền của dòng món này: subtotal = quantity * unitPrice
    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    // Ghi chú riêng cho món này (ví dụ: "Ít cay", "Không hành", "Kèm ly đá")
    @Column(name = "note", length = 255)
    private String note;

    // Trạm tiếp nhận: "KITCHEN" (Bếp KDS) hoặc "WAITER" (Đồ uống đóng lon/chai giao Phục vụ)
    @Builder.Default
    @Column(name = "target_station", nullable = false, length = 20)
    private String targetStation = "KITCHEN";

    // Trạng thái: PENDING, COOKING, WAITER_PREP, READY, SERVED, CANCELLED
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OrderItemStatus status = OrderItemStatus.PENDING;

    // Thời điểm bắt đầu chế biến
    @Column(name = "cooking_start_time")
    private LocalDateTime cookingStartTime;

    // Thời điểm hoàn thành chế biến
    @Column(name = "cooking_finish_time")
    private LocalDateTime cookingFinishTime;

    // Thời điểm tạo bản ghi
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm cập nhật bản ghi gần nhất
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```
