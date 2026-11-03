# BƯỚC 02: TẠO ENUM USERROLE, ENUM SHIFTTYPE & ENTITY STAFF (SỬ DỤNG LOMBOK)

## 1. Bước Này Làm Gì?
- Tạo enum `UserRole` đại diện cho các vai trò của nhân viên trong quán: `MANAGER`, `WAITER`, `KITCHEN`, `CASHIER`.
- Tạo enum `ShiftType` đại diện cho 2 ca làm việc chuẩn trong ngày (`MORNING`: 06:00 - 14:00, `EVENING`: 14:00 - 22:00) kèm logic kiểm tra khung giờ hợp lệ (cho phép vào ca trước giờ mở ca 15 phút). Không cần ca `FULL_DAY` vì nhân viên làm cả ngày sẽ được xếp 2 ca (Ca Sáng và Ca Tối) trong bảng `staff_schedules`.
- Tạo entity `Staff` ánh xạ vào bảng `staffs` trong CSDL để quản lý tài khoản nhân viên, mã PIN 6 số băm BCrypt, vai trò (`role`) và trạng thái đang trong ca (`isOnShift`). **Lưu ý:** Không lưu ca làm việc trên bảng `staffs` vì toàn bộ lịch làm việc được chuẩn hóa lưu trữ trong bảng riêng `staff_schedules`.
- **Sử dụng Lombok:** Dùng các annotation `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` để loại bỏ toàn bộ boilerplate code.
- **Quy tắc quan trọng về xác thực:** 
  1. Nhân viên đăng nhập vào ca làm việc bằng **Tên đăng nhập / Mã nhân viên (`username`)** và **Mã PIN 6 chữ số (`pinCode`)**, **HOÀN TOÀN KHÔNG SỬ DỤNG PASSWORD**.
  2. **Ràng buộc phân ca đa ngày (Multi-day Shift Enforcement):** Ngoại trừ `MANAGER` (luôn được phép đăng nhập), mọi nhân viên khác (`WAITER`, `KITCHEN`, `CASHIER`) **bắt buộc phải có lịch làm việc trong ngày hôm nay (`LocalDate.now()`)** trong bảng `staff_schedules` và **chỉ được đăng nhập trong khung giờ ca trực** (cho phép sớm hơn 15 phút).

---

## 2. Các File Code & Chức Năng

### File 1: `UserRole.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/entity/enums/UserRole.java`
- **Chức năng:** Định nghĩa 4 vai trò của nhân viên nhà hàng (đã loại bỏ quầy Bar, chỉ phục vụ đồ uống đóng lon/chai sẵn).

```java
package com.romsteam.roms.entity.enums;

public enum UserRole {
    MANAGER,  // Quản lý: toàn quyền xem báo cáo, quản lý nhân sự, duyệt chốt ca, phân ca
    WAITER,   // Phục vụ: xem sơ đồ bàn, nhận order tại bàn, nhận đồ uống mang ra bàn
    KITCHEN,  // Bếp: xem hàng đợi KDS, cập nhật tiến độ nấu món ăn
    CASHIER   // Thu ngân: thanh toán hóa đơn, in bill, chốt ca tiền mặt
}
```

---

### File 2: `ShiftType.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/entity/enums/ShiftType.java`
- **Chức năng:** Định nghĩa các ca làm việc chuẩn trong ngày và phương thức kiểm tra giờ vào ca hợp lệ (cho phép trước 15 phút).

```java
package com.romsteam.roms.entity.enums;

import java.time.LocalTime;

public enum ShiftType {
    MORNING("Ca Sáng", LocalTime.of(6, 0), LocalTime.of(14, 0)),
    EVENING("Ca Tối", LocalTime.of(14, 0), LocalTime.of(22, 0));

    private final String label;
    private final LocalTime startTime;
    private final LocalTime endTime;

    ShiftType(String label, LocalTime startTime, LocalTime endTime) {
        this.label = label;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public String getLabel() { return label; }
    public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; }

    /**
     * Kiểm tra thời gian hiện tại có hợp lệ để vào ca:
     * Cho phép đăng nhập trước thời gian mở ca 15 phút, và trước thời gian kết thúc ca.
     */
    public boolean isWithinShift(LocalTime now) {
        if (startTime == null || endTime == null) return false;
        LocalTime allowStartTime = startTime.minusMinutes(15);
        return !now.isBefore(allowStartTime) && !now.isAfter(endTime);
    }
}
```

---

### File 3: `Staff.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/entity/Staff.java`
- **Chức năng:** Đại diện cho bảng `staffs` trong SQL Server, lưu thông tin tài khoản đăng nhập (Username và Mã PIN 6 số đã băm BCrypt), vai trò (`role`) và trạng thái đang trong ca trực (`isOnShift`).

```java
package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "staffs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tên đăng nhập / Mã nhân viên (ví dụ: MGR-001, EMP-001)
    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    // Mã PIN 6 chữ số băm BCrypt (không dùng password thông thường)
    @Column(name = "pin_code", nullable = false, length = 255)
    private String pinCode;

    // Họ và tên đầy đủ nhân viên (hỗ trợ tiếng Việt Unicode)
    @Column(name = "full_name", nullable = false, columnDefinition = "NVARCHAR(100)")
    private String fullName;

    // Số điện thoại liên hệ
    @Column(name = "phone", length = 15)
    private String phone;

    // Vai trò (MANAGER, WAITER, KITCHEN, CASHIER)
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private UserRole role;

    // Trạng thái tài khoản (true = hoạt động, false = khóa/nghỉ việc)
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Trạng thái thực tế có đang trực trong ca hay không (true sau khi login, false sau khi logout)
    @Builder.Default
    @Column(name = "is_on_shift", nullable = false, columnDefinition = "BIT DEFAULT 0")
    private Boolean isOnShift = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```
