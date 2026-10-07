# BƯỚC 04: TẠO ENUM SESSIONSTATUS & ENTITY DININGSESSION (SỬ DỤNG LOMBOK)

## 1. Bước Này Làm Gì?
- Tạo enum `SessionStatus` đại diện cho vòng đời phiên ăn tại bàn (`ACTIVE`, `COMPLETED`, `CANCELLED`).
- Tạo entity `DiningSession` ánh xạ vào bảng `dining_sessions`. Đây là đối tượng trung tâm gắn kết Bàn ăn - Các đợt gọi món - Hóa đơn thanh toán.
- **Sử dụng Lombok:** Thêm `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` để loại bỏ toàn bộ boilerplate getters/setters/constructors.

---

## 2. Các File Code & Chức Năng

### File 1: `SessionStatus.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/enums/SessionStatus.java`
- **Chức năng:** Định nghĩa 3 trạng thái phiên ăn.

```java
package com.romsteam.roms.enums;

public enum SessionStatus {
    ACTIVE,     // Khách đang ngồi ăn tại bàn, có thể xem menu và gửi thêm order
    COMPLETED,  // Thu ngân đã bấm thanh toán hóa đơn, phiên ăn kết thúc
    CANCELLED   // Phiên ăn bị hủy bỏ (ví dụ: mở nhầm bàn hoặc khách có việc gấp về ngay)
}
```

---

### File 2: `DiningSession.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/entity/DiningSession.java`
- **Chức năng:** Quản lý phiên khách ngồi ăn tại bàn, token phiên của khách, số lượng khách, thời gian bắt đầu/kết thúc và khóa lạc quan `@Version`.

```java
package com.romsteam.roms.entity;

import com.romsteam.roms.enums.SessionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

// Khai báo Entity đại diện cho bảng phiên ăn
@Entity
@Table(name = "dining_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiningSession {

    // Khóa chính phiên ăn
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Khóa ngoại trỏ sang bảng bàn ăn: Nhiều phiên ăn diễn ra tại 1 bàn ở các thời điểm khác nhau
    // FetchType.LAZY: Chỉ tải thông tin bàn khi thực sự gọi getTable() để tăng tốc độ truy vấn
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", nullable = false)
    private RestaurantTable table;

    // Token định danh phiên ăn cấp cho điện thoại của khách sau khi quét QR (lưu ở localStorage)
    @Column(name = "session_token", nullable = false, unique = true, length = 100)
    private String sessionToken;

    // Trạng thái phiên ăn: ACTIVE, COMPLETED, CANCELLED
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SessionStatus status = SessionStatus.ACTIVE;

    // Số lượng khách thực tế ngồi tại bàn
    @Column(name = "guest_count")
    private Integer guestCount;

    // Ghi chú chung của cả bàn (ví dụ: "Có trẻ em, không ăn cay")
    @Column(name = "note", length = 255)
    private String note;

    // Thời điểm bắt đầu phiên ăn (lúc khách quét QR hoặc nhân viên mở bàn)
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    // Thời điểm kết thúc phiên ăn (sau khi thu ngân thanh toán xong)
    @Column(name = "end_time")
    private LocalDateTime endTime;

    // Khóa lạc quan (Optimistic Locking): Tự tăng số phiên bản khi UPDATE,
    // chống xung đột khi 2 người cùng thao tác đồng thời (khách đặt món cùng lúc thu ngân đóng bàn)
    @Version
    @Column(name = "version")
    private Long version;

    // Thời điểm ghi nhận vào CSDL
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm cập nhật dữ liệu gần nhất
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```
