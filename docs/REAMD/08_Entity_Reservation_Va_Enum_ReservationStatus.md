# BƯỚC 08: TẠO ENUM TRẠNG THÁI & ENTITY RESERVATION, RESERVATIONITEM (SỬ DỤNG LOMBOK)

## 1. Bước Này Làm Gì?
- Tạo enum `ReservationStatus` đại diện cho vòng đời yêu cầu đặt bàn trực tuyến: `PENDING`, `CONFIRMED`, `SEATED`, `CANCELLED`.
- Tạo entity `Reservation` ánh xạ vào bảng `reservations` (thông tin khách đặt bàn trước kèm tổng tiền đặt món trước `preOrderTotal`).
- Tạo entity `ReservationItem` ánh xạ vào bảng `reservation_items` (lưu trữ danh sách món ăn/nước uống khách đặt trước để nhà hàng chuẩn bị sẵn nguyên liệu, tránh đợi lâu khi khách tới).
- **Sử dụng Lombok:** Thêm `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` loại bỏ hoàn toàn các constructor và getter/setter thủ công.

---

## 2. Các File Code & Chức Năng

### File 1: `ReservationStatus.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/enums/ReservationStatus.java`
- **Chức năng:** Định nghĩa các trạng thái của yêu cầu đặt bàn.

```java
package com.romsteam.roms.enums;

public enum ReservationStatus {
    PENDING,    // Khách vừa gửi yêu cầu đặt bàn trực tuyến từ Landing Page
    CONFIRMED,  // Nhân viên đã liên hệ xác nhận và xếp bàn trước
    SEATED,     // Khách đã tới nhà hàng và được dẫn vào bàn ăn
    CANCELLED   // Khách gọi điện báo hủy hoặc vắng mặt quá giờ hẹn (No-show)
}
```

---

### File 2: `Reservation.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/entity/Reservation.java`
- **Chức năng:** Quản lý thông tin đặt bàn của khách và danh sách món ăn đặt trước (Pre-order).

```java
package com.romsteam.roms.entity;

import com.romsteam.roms.enums.ReservationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// Khai báo Entity đại diện cho bảng đặt bàn
@Entity
@Table(name = "reservations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation {

    // Khóa chính yêu cầu đặt bàn
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Khóa ngoại trỏ sang bàn được xếp (Có thể null khi mới PENDING, được gán khi CONFIRMED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id")
    private RestaurantTable table;

    // Họ tên khách hàng đặt bàn
    @Column(name = "customer_name", nullable = false, length = 100)
    private String customerName;

    // Số điện thoại liên hệ của khách
    @Column(name = "customer_phone", nullable = false, length = 15)
    private String customerPhone;

    // Email liên hệ của khách (để gửi email xác nhận đặt bàn thành công)
    @Column(name = "customer_email", length = 100)
    private String customerEmail;

    // Số lượng khách dự kiến tới dùng bữa
    @Column(name = "guest_count", nullable = false)
    private Integer guestCount;

    // Thời điểm khách hẹn tới dùng bữa
    @Column(name = "reservation_time", nullable = false)
    private LocalDateTime reservationTime;

    // Trạng thái yêu cầu đặt bàn: PENDING, CONFIRMED, SEATED, CANCELLED
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ReservationStatus status = ReservationStatus.PENDING;

    // Yêu cầu đặc biệt của khách (ví dụ: "Cần ghế trẻ em, bàn gần cửa sổ...")
    @Column(name = "note", length = 255)
    private String note;

    // Lý do hủy bàn (nếu trạng thái là CANCELLED)
    @Column(name = "cancel_reason", length = 255)
    private String cancelReason;

    // Tổng tiền của các món đặt trước (Pre-order)
    @Builder.Default
    @Column(name = "pre_order_total", precision = 12, scale = 2)
    private BigDecimal preOrderTotal = BigDecimal.ZERO;

    // Danh sách các món ăn khách đã đặt trước (tránh phải chờ đợi lên món lâu)
    @Builder.Default
    @OneToMany(mappedBy = "reservation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReservationItem> preOrderItems = new ArrayList<>();

    // Thời điểm tạo đơn đặt bàn
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm cập nhật đơn đặt bàn gần nhất
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Helper method tiện ích thêm món đặt trước
    public void addPreOrderItem(ReservationItem item) {
        preOrderItems.add(item);
        item.setReservation(this);
    }
}
```

---

### File 3: `ReservationItem.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/entity/ReservationItem.java`
- **Chức năng:** Đại diện cho bảng `reservation_items`, lưu trữ từng món chi tiết khách đặt trước.

```java
package com.romsteam.roms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// Khai báo Entity đại diện cho bảng món ăn đặt trước
@Entity
@Table(name = "reservation_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationItem {

    // Khóa chính
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Khóa ngoại liên kết ngược lại đơn đặt bàn (Reservation)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    // Khóa ngoại trỏ sang món ăn trong thực đơn (MenuItem)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    // Số lượng món khách đặt trước
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    // Đơn giá tại thời điểm đặt trước
    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    // Thành tiền: subtotal = quantity * unitPrice
    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    // Ghi chú cho món đặt trước (ví dụ: "Ăn cay vừa", "Không hành lá")
    @Column(name = "note", length = 255)
    private String note;

    // Thời điểm tạo bản ghi
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
```
