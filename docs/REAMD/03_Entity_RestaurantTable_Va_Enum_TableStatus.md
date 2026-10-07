# BƯỚC 03: TẠO ENUM TABLESTATUS & ENTITY RESTAURANTTABLE (SỬ DỤNG LOMBOK)

## 1. Bước Này Làm Gì?
- Tạo enum `TableStatus` đại diện cho trạng thái của bàn ăn: `AVAILABLE`, `OCCUPIED`, `DIRTY`, `RESERVED`, `BLOCKED`.
- Tạo entity `RestaurantTable` ánh xạ vào bảng `restaurant_tables` (đặt tên tránh từ khóa cấm `TABLE` trong SQL) để quản lý bàn, phân khu và mã QR token.
- **Sử dụng Lombok:** Thêm `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` để loại bỏ mã boilerplate.

---

## 2. Các File Code & Chức Năng

### File 1: `TableStatus.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/enums/TableStatus.java`
- **Chức năng:** Định nghĩa các trạng thái của bàn ăn.

```java
package com.romsteam.roms.enums;

public enum TableStatus {
    AVAILABLE,  // Bàn trống, sẵn sàng tiếp nhận khách mới
    OCCUPIED,   // Đang có khách ngồi ăn (phiên ăn ACTIVE)
    DIRTY,      // Khách vừa thanh toán rời đi, bàn chưa dọn (cần phục vụ dọn dẹp)
    RESERVED,   // Đã có khách đặt trước (kèm thời gian đặt và thông tin liên hệ)
    BLOCKED     // Bàn bị khóa/tạm ngưng phục vụ (kèm lý do bảo trì, hỏng hóc...)
}
```

---

### File 2: `RestaurantTable.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/entity/RestaurantTable.java`
- **Chức năng:** Đại diện cho bảng `restaurant_tables`, lưu số bàn, khu vực, sức chứa khách, trạng thái bàn, lý do khóa bàn hoặc thông tin đặt trước, và chuỗi mã bí mật QR Code.

```java
package com.romsteam.roms.entity;

import com.romsteam.roms.enums.TableStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

// Khai báo Entity đại diện cho bảng bàn ăn
@Entity
@Table(name = "restaurant_tables") // Tránh dùng từ 'table' vì là từ khóa cấm trong SQL
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantTable {

    // Khóa chính của bàn
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Số hiệu hoặc mã bàn (ví dụ: "T-01", "VIP-01") - Duy nhất, không trùng lặp
    @Column(name = "table_number", nullable = false, unique = true, length = 30)
    private String tableNumber;

    // Khu vực đặt bàn (ví dụ: "ZONE_1" - Tầng 1 Sảnh Chính, "ZONE_2" - Ban Công, "VIP" - Phòng VIP)
    // Lưu ý: Hệ thống đã xóa bỏ khu vực Quầy Bar
    @Builder.Default
    @Column(name = "zone", nullable = false, length = 50)
    private String zone = "ZONE_1";

    // Sức chứa số lượng khách tối đa của bàn (ví dụ: 4 chỗ, 8 chỗ)
    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    // Trạng thái hiện tại của bàn (AVAILABLE, OCCUPIED, DIRTY, RESERVED, BLOCKED)
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TableStatus status = TableStatus.AVAILABLE;

    // Lý do khóa bàn khi status = BLOCKED (ví dụ: "Bảo trì hệ thống đèn & thông gió")
    @Column(name = "blocked_reason", length = 255)
    private String blockedReason;

    // Thông tin khách đặt trước khi status = RESERVED (ví dụ: "Chị Mai - 0982xxx")
    @Column(name = "reservation_info", length = 255)
    private String reservationInfo;

    // Giờ hẹn đến của khách đặt trước (ví dụ: "20:00" hoặc DateTime)
    @Column(name = "reserved_time", length = 50)
    private String reservedTime;

    // Mã token bí mật gắn với mã QR dán trên bàn (chống khách ở nhà tự đoán URL vào đặt món)
    @Column(name = "qr_token", length = 255)
    private String qrToken;

    // Bàn có đang mở phục vụ không (true = đang dùng, false = ngưng sử dụng)
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Thời điểm tạo bàn trong hệ thống
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm cập nhật trạng thái bàn gần nhất
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```
