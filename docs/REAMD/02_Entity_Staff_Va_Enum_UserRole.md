# BƯỚC 02: TẠO ENUM USERROLE & ENTITY STAFF (SỬ DỤNG LOMBOK)

## 1. Bước Này Làm Gì?
- Tạo enum `UserRole` đại diện cho các vai trò của nhân viên trong quán: `MANAGER`, `WAITER`, `KITCHEN`, `CASHIER`.
- Tạo entity `Staff` ánh xạ vào bảng `staffs` trong CSDL để quản lý tài khoản nhân viên đăng nhập.
- **Sử dụng Lombok:** Dùng các annotation `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` để loại bỏ toàn bộ boilerplate code (constructors, getters, setters).
- **Quy tắc quan trọng về xác thực:** Nhân viên đăng nhập vào ca làm việc bằng **Tên đăng nhập / Mã nhân viên (`username`)** và **Mã PIN 6 chữ số (`pinCode`)**, **HOÀN TOÀN KHÔNG SỬ DỤNG PASSWORD**. Mã PIN 6 số được băm mã hóa bằng thuật toán BCrypt trước khi lưu trữ trong CSDL.

---

## 2. Các File Code & Chức Năng

### File 1: `UserRole.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/enums/UserRole.java`
- **Chức năng:** Định nghĩa 4 vai trò của nhân viên nhà hàng (đã loại bỏ quầy Bar, chỉ phục vụ đồ uống đóng lon/chai sẵn).

```java
package com.romsteam.roms.enums;

public enum UserRole {
    MANAGER,  // Quản lý: toàn quyền xem báo cáo, quản lý nhân sự, duyệt chốt ca, phân ca
    WAITER,   // Phục vụ: xem sơ đồ bàn, nhận order tại bàn, nhận đồ uống mang ra bàn
    KITCHEN,  // Bếp: xem hàng đợi KDS, cập nhật tiến độ nấu món ăn
    CASHIER   // Thu ngân: thanh toán hóa đơn, in bill, chốt ca tiền mặt
}
```

---

### File 2: `Staff.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/entity/Staff.java`
- **Chức năng:** Đại diện cho bảng `staffs` trong SQL Server, lưu thông tin tài khoản đăng nhập (Username và Mã PIN 6 số đã băm BCrypt) và vai trò của nhân viên. Sử dụng Lombok tinh gọn mã nguồn.

```java
package com.romsteam.roms.entity;

import com.romsteam.roms.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

// Khai báo lớp này là một Entity tương ứng với bảng staffs trong CSDL
@Entity
@Table(name = "staffs") // Tên bảng lưu trữ trong SQL Server
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Staff {

    // Khóa chính tự tăng (IDENTITY trong SQL Server)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tên đăng nhập / Mã nhân viên (bắt buộc, duy nhất, ví dụ: "MGR-084", "EMP-8812", "KDS-001", "CSH-002")
    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    // Mã PIN 6 chữ số đã mã hóa theo chuẩn BCrypt (bắt buộc, dùng để đăng nhập ca trực, KHÔNG dùng password)
    // Độ dài 255 ký tự để chứa chuỗi hash BCrypt an toàn
    @Column(name = "pin_code", nullable = false, length = 255)
    private String pinCode;

    // Họ và tên đầy đủ của nhân viên
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    // Số điện thoại liên hệ
    @Column(name = "phone", length = 15)
    private String phone;

    // Vai trò của nhân viên (lưu dưới dạng chuỗi trong DB: MANAGER, WAITER, KITCHEN, CASHIER)
    // LƯU Ý: Hệ thống không có quầy Bar, chỉ có đúng 4 vai trò này.
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private UserRole role;

    // Trạng thái tài khoản: true = đang làm việc, false = đã nghỉ việc hoặc bị khóa tài khoản
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Thời điểm tạo tài khoản (Hibernate tự động điền giá trị lúc thực hiện lệnh INSERT)
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm sửa đổi thông tin gần nhất (Hibernate tự động cập nhật lúc chạy lệnh UPDATE)
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```
