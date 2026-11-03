# BƯỚC 12: ĐĂNG NHẬP CA TRỰC & PHÂN QUYỀN TOÀN DIỆN (FULL-STACK: BACKEND & FRONTEND)

> **Mục tiêu:** Xây dựng hoàn chỉnh tính năng **Đăng nhập ca trực & Phân quyền theo vai trò (Role-Based Access Control - RBAC)** song song ở cả hai phía Backend (Spring Boot 3 + Spring Security + JWT) và Frontend (React + Vite + Axios + React Router), tích hợp **Ràng buộc phân ca & kiểm tra giờ trực ca thông minh**.

---

## 1. Tổng Quan Kiến Trúc & Luồng Dữ Liệu (Data Flow)

### 1.1. Nguyên tắc nghiệp vụ
1. **Không dùng mật khẩu văn bản (password):** Nhân viên nhà hàng đăng nhập bằng **Mã nhân viên** (`username`, ví dụ: `MGR-001`, `EMP-001`) và **Mã PIN ca trực 6 chữ số** (`pinCode`, ví dụ: `123456`) để thao tác nhanh trên màn hình cảm ứng POS/Tablet.
2. **Băm mật khẩu an toàn:** Mã PIN được băm một chiều bằng thuật toán **BCrypt** trong CSDL SQL Server.
3. **Xác thực phi trạng thái (Stateless):** Sử dụng chuỗi mã hóa **JSON Web Token (JWT)** có thời hạn 24 giờ.
4. **Phân quyền 4 vai trò nhân sự:**
   - `MANAGER`: Toàn quyền quản trị hệ thống, menu, bàn, nhân sự, báo cáo doanh thu (`/admin/*`).
   - `WAITER`: Phục vụ sảnh bàn, sơ đồ bàn, nhận order bàn, phục vụ nước đóng chai (`/waiter/*`).
   - `KITCHEN`: Màn hình điều phối chế biến Bếp KDS (`/kitchen/*`).
   - `CASHIER`: Thu ngân thanh toán hóa đơn, in bill, đóng ca két tiền (`/pos/*`).
5. **Ràng buộc phân ca theo ngày & giờ trực (Multi-Day Shift Enforcement):**
   - **Với Quản lý (`MANAGER`):** Luôn được phép đăng nhập mọi lúc để mở cửa quán, xếp lịch cho nhân viên và giám sát vận hành.
   - **Với Nhân viên thường (`WAITER`, `KITCHEN`, `CASHIER`):**
     - **Ràng buộc đúng ngày (Lịch phân ca nhiều ngày):** Quản lý có thể xếp lịch làm việc cho nhân viên trước nhiều ngày/nhiều tuần trong bảng `staff_schedules`. Khi đăng nhập, hệ thống kiểm tra xem **hôm nay (`LocalDate.now()`)** nhân viên có lịch làm việc không:
       - Nếu hôm nay **không có lịch**, hệ thống **từ chối đăng nhập (403 Forbidden)**: *"Bạn không có lịch làm việc trong ngày hôm nay (dd/MM/yyyy)! Vui lòng liên hệ Quản lý."*
     - **Ràng buộc đúng giờ ca (Quy tắc 15 phút mở ca):** Nếu hôm nay có lịch trực, hệ thống tiếp tục kiểm tra xem thời gian hiện tại (`LocalTime.now()`) có nằm trong khung giờ của ca trực đó không (cho phép sớm hơn 15 phút):
       - **Ca Sáng (06:00 - 14:00):** Được phép vào ca từ **05:45** đến **14:00**.
       - **Ca Tối (14:00 - 22:00):** Được phép vào ca từ **13:45** đến **22:00**.
       - **Ca Cả Ngày (06:00 - 23:00):** Được phép vào ca từ **05:45** đến **23:00**.
       - Nếu chưa đến giờ hoặc đã hết ca: Bị chặn (403 Forbidden) và thông báo danh sách ca được xếp hôm nay.
     - Khi đăng nhập thành công vào ca: Hệ thống tự động cập nhật `isOnShift = true` và gán ca trực hiện tại.
     - Khi nhân viên bấm đăng xuất (Logout): Hệ thống tự động cập nhật `isOnShift = false`.
     - **Đảm bảo công việc liên tục (Không đá người dùng giữa chừng):** Trong lúc nhân viên đang trực, nếu thời gian vượt quá giờ kết thúc ca (ví dụ quá 14:00 nhưng nhân viên vẫn đang phục vụ, in hóa đơn dở dang...), **hệ thống KHÔNG ngắt phiên hay chặn thao tác**. Token JWT vẫn có hiệu lực và nhân viên vẫn sử dụng web bình thường. Việc kiểm tra giờ ca chỉ diễn ra **ở thời điểm đăng nhập** — tức là khi nhân viên bấm Đăng xuất ra rồi đăng nhập lại sau khi đã hết ca thì mới bị hệ thống chặn.

### 1.2. Sơ đồ luồng tương tác (Sequence Diagram)
```text
[Nhân viên] (Chọn tài khoản / Nhập mã NV & PIN 6 số)
     │
     ▼
[Frontend: StaffLoginPage] ──(Gọi handleSubmit)──> [Frontend: AuthContext (login)]
                                                              │
                                                              ▼
                                                   [Frontend: authApi.login]
                                                              │
                                             (HTTP POST /api/auth/login)
                                                              │
                                                              ▼
                                                   [Vite Proxy: :5173/api -> :8080/api]
                                                              │
                                                              ▼
                                                   [Backend: AuthController]
                                                              │
                                                   [Backend: AuthServiceImpl]
                                                              │
                                            ┌─────────┴─────────┐
                                            ▼                   ▼
                               [AuthenticationManager]   [StaffRepository]
                             (Đối chiếu BCrypt mã PIN)  (Lấy thông tin NV)
                                            │                   │
                                            └─────────┬─────────┘
                                                      │
                                                      ▼
                                       [KIỂM TRA PHÂN CA & GIỜ TRỰC]
                                       ├─ Nếu MANAGER: Bỏ qua kiểm tra
                                       ├─ Nếu chưa phân ca (NONE): Chặn (403)
                                       └─ Nếu ngoài giờ ca (15p trước mở ca): Chặn (403)
                                                      │ (Hợp lệ)
                                                      ▼
                                            [Cập nhật isOnShift = true]
                                                      │
                                                      ▼
                                            [JwtTokenProvider]
                                            (Tạo accessToken)
                                                      │
                                                      ▼
                                       (Response 200 OK: LoginResponse)
                                                      │
                                                      ▼
[Frontend: AuthContext] <─────────────────────────────┘
  ├─ 1. Lưu accessToken vào localStorage ('roms_token')
  ├─ 2. Lưu userInfo (kèm assignedShift, isOnShift) vào localStorage ('roms_user')
  └─ 3. Chuyển hướng theo vai trò (getRoleHome) ──> [Giao diện ca trực tương ứng]
```

---

## 2. Hướng Dẫn Chi Tiết Phía BACKEND

Backend được xây dựng bằng **Spring Boot 3.4.5**, **Java 21**, **Spring Security 6**, sử dụng **Project Lombok** để loại bỏ code thừa.

### Bước B1: Tạo Enum Ca Làm Việc `ShiftType.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/entity/enums/ShiftType.java`
- **Nhiệm vụ:** Định nghĩa danh sách ca làm việc và phương thức kiểm tra giờ vào ca hợp lệ (cho phép trước 15 phút mở ca).

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
     * Được phép đăng nhập trước thời gian mở ca 15 phút, và trước thời gian kết thúc ca.
     */
    public boolean isWithinShift(LocalTime now) {
        if (startTime == null || endTime == null) return false;
        LocalTime allowStartTime = startTime.minusMinutes(15);
        return !now.isBefore(allowStartTime) && !now.isAfter(endTime);
    }
}
```

---

### Bước B2: Bổ Sung Trường Trạng Thái Ca Trực Vào Entity `Staff.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/entity/Staff.java`
- **Nhiệm vụ:** Thêm trường `isOnShift` để lưu trạng thái trực ca của nhân viên. **Lưu ý:** Không cần lưu trường `assignedShift` trên bảng `staffs` vì toàn bộ lịch làm việc đã được chuẩn hóa lưu trữ trong bảng riêng `staff_schedules`.

```java
    // Trạng thái thực tế có đang trực trong ca hay không (true sau khi login, false sau khi logout)
    @Builder.Default
    @Column(name = "is_on_shift", nullable = false, columnDefinition = "BIT DEFAULT 0")
    private Boolean isOnShift = false;
```

---

### Bước B2.1: Tạo Entity Lịch Phân Ca Đa Ngày `StaffSchedule.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/entity/StaffSchedule.java`
- **Nhiệm vụ:** Cho phép Quản lý phân ca cho nhân viên theo từng ngày cụ thể (`work_date`), hỗ trợ lên lịch nhiều ngày, nhiều tuần.

```java
package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.ShiftType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "staff_schedules", uniqueConstraints = {
        @UniqueConstraint(name = "UQ_staff_date_shift", columnNames = {"staff_id", "work_date", "shift_type"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nhan vien duoc phan ca
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    private Staff staff;

    // Ngay lam viec (LocalDate, dinh dang YYYY-MM-DD trong SQL Server)
    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    // Ca lam viec trong ngay (MORNING, EVENING)
    @Enumerated(EnumType.STRING)
    @Column(name = "shift_type", nullable = false, length = 30)
    private ShiftType shiftType;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

---

### Bước B2.2: Tạo `StaffScheduleRepository.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/repository/StaffScheduleRepository.java`
- **Nhiệm vụ:** Truy vấn lịch trực theo ngày của nhân viên (`findByStaffAndWorkDate`) hoặc của toàn nhà hàng.

```java
package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Staff;
import com.romsteam.roms.entity.StaffSchedule;
import com.romsteam.roms.entity.enums.ShiftType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffScheduleRepository extends JpaRepository<StaffSchedule, Long> {
    // Tìm danh sách ca trực của nhân viên trong một ngày cụ thể (phục vụ kiểm tra điều kiện đăng nhập)
    List<StaffSchedule> findByStaffAndWorkDate(Staff staff, LocalDate workDate);
}
```

---

### Bước B3: Tạo DTO Nhận Dữ Liệu Đăng Nhập `LoginRequest.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/dto/request/LoginRequest.java`
- **Nhiệm vụ:** Tiếp nhận mã nhân viên và mã PIN 6 số. Bắt buộc regex kiểm tra mã PIN đúng 6 ký số.

```java
package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    // Ma nhan vien dang nhap (vi du: MGR-001, EMP-001, KDS-001, CSH-001)
    @NotBlank(message = "Tên đăng nhập không được để trống")
    private String username;

    // Ma PIN 6 chu so (bat buoc dung 6 so, khong dung password truyen thong)
    @NotBlank(message = "Mã PIN không được để trống")
    @Pattern(regexp = "^\\d{6}$", message = "Mã PIN phải gồm đúng 6 chữ số")
    private String pinCode;
}
```

---

### Bước B4: Tạo DTO Phản Hồi Đăng Nhập `LoginResponse.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/dto/response/LoginResponse.java`
- **Nhiệm vụ:** Đóng gói Token JWT, thông tin tài khoản, ca trực và trạng thái trong ca gửi về cho Frontend.

```java
package com.romsteam.roms.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private String accessToken;
    @Builder.Default
    private String tokenType = "Bearer";

    private Long id;
    private String username;
    private String fullName;
    private String role; // MANAGER, WAITER, KITCHEN, CASHIER

    // Thong tin ca truc
    private String assignedShift;
    private Boolean isOnShift;
}
```

---

### Bước B5: Cài Đặt Dịch Vụ Xác Thực `AuthService.java` & `AuthServiceImpl.java`
- **Interface:** `src/main/java/com/romsteam/roms/service/AuthService.java`
- **Implementation:** `src/main/java/com/romsteam/roms/service/serviceImpl/AuthServiceImpl.java`
- **Nhiệm vụ:** 
  1. Xác thực username và pinCode qua `AuthenticationManager`.
  2. Áp dụng Business Rule: Kiểm tra `role != MANAGER` thì phải có ca và giờ hiện tại nằm trong ca (cho phép sớm 15 phút).
  3. Cập nhật `isOnShift = true` khi đăng nhập và `isOnShift = false` khi đăng xuất.

```java
package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.LoginRequest;
import com.romsteam.roms.dto.request.VerifyManagerPinRequest;
import com.romsteam.roms.dto.response.LoginResponse;
import com.romsteam.roms.entity.Staff;
import com.romsteam.roms.entity.StaffSchedule;
import com.romsteam.roms.entity.enums.ShiftType;
import com.romsteam.roms.entity.enums.UserRole;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.repository.StaffRepository;
import com.romsteam.roms.repository.StaffScheduleRepository;
import com.romsteam.roms.security.JwtTokenProvider;
import com.romsteam.roms.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final StaffRepository staffRepository;
    private final StaffScheduleRepository staffScheduleRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           StaffRepository staffRepository,
                           StaffScheduleRepository staffScheduleRepository,
                           JwtTokenProvider jwtTokenProvider,
                           PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.staffRepository = staffRepository;
        this.staffScheduleRepository = staffScheduleRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        try {
            // 1. Thuc hien xac thuc username va pinCode qua AuthenticationManager
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPinCode()
                    )
            );

            // 2. Luu vao SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 3. Lay thong tin nhan vien tu CSDL
            Staff staff = staffRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new AppException("Nhân viên không tồn tại", HttpStatus.NOT_FOUND));

            // 4. KIỂM TRA ĐIỀU KIỆN PHÂN CÔNG CA TRỰC THEO NGÀY (MULTI-DAY SHIFT SCHEDULING):
            // Nếu KHÔNG phải Quản lý (MANAGER), bắt buộc phải có lịch trực trong ngày hôm nay từ bảng staff_schedules (Đăng ký qua Script SQL)
            String currentShiftName = "NONE";
            if (staff.getRole() != UserRole.MANAGER) {
                LocalDate today = LocalDate.now();
                LocalTime now = LocalTime.now();
                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

                // 4.1. Tìm tất cả ca trực của nhân viên trong ngày hôm nay từ bảng staff_schedules
                List<StaffSchedule> todaySchedules = staffScheduleRepository.findByStaffAndWorkDate(staff, today);

                // Nếu hôm nay chưa được đăng ký ca trực trong CSDL
                if (todaySchedules == null || todaySchedules.isEmpty()) {
                    throw new AppException(
                            String.format("Bạn không có lịch làm việc trong ngày hôm nay (%s)! Vui lòng liên hệ Quản lý.",
                                    today.format(dateFormatter)),
                            HttpStatus.FORBIDDEN
                    );
                }

                // 4.2. Tìm ca trực: Ưu tiên ca khớp với giờ thực tế nếu nhân viên được phân nhiều ca trong ngày
                StaffSchedule activeSchedule = todaySchedules.stream()
                        .filter(s -> {
                            if (s.getShiftType() == null) return false;
                            LocalTime start = s.getShiftType().getStartTime();
                            LocalTime end = s.getShiftType().getEndTime();
                            if (start != null && end != null) {
                                return !now.isBefore(start.minusMinutes(15)) && !now.isAfter(end);
                            }
                            return true;
                        })
                        .findFirst()
                        .orElse(null);

                // Nếu ngoài khung giờ chuẩn nhưng đang trong giai đoạn test (ShiftType.isWithinShift trả về true), cho phép vào ca được xếp
                if (activeSchedule == null) {
                    activeSchedule = todaySchedules.stream()
                            .filter(s -> s.getShiftType() != null && s.getShiftType().isWithinShift(now))
                            .findFirst()
                            .orElse(todaySchedules.get(0));
                }

                currentShiftName = activeSchedule.getShiftType().name();
            }

            // 5. Cap nhat trang thai dang trong ca truc
            staff.setIsOnShift(true);
            staffRepository.save(staff);

            // 6. Sinh token JWT
            String token = jwtTokenProvider.generateToken(authentication);

            // 7. Dong goi LoginResponse tra ve cho frontend (lay shift truc tiep tu staff_schedules)
            return LoginResponse.builder()
                    .accessToken(token)
                    .tokenType("Bearer")
                    .id(staff.getId())
                    .username(staff.getUsername())
                    .fullName(staff.getFullName())
                    .role(staff.getRole().name())
                    .assignedShift(currentShiftName)
                    .isOnShift(staff.getIsOnShift())
                    .build();

        } catch (BadCredentialsException e) {
            throw new AppException("Sai tên đăng nhập hoặc mã PIN!", HttpStatus.UNAUTHORIZED);
        }
    }

    @Override
    public boolean verifyManagerPin(VerifyManagerPinRequest request) {
        Staff manager = staffRepository.findByUsername(request.getManagerUsername())
                .orElseThrow(() -> new AppException("Không tìm thấy tài khoản quản lý", HttpStatus.NOT_FOUND));

        if (manager.getRole() != UserRole.MANAGER) {
            throw new AppException("Tài khoản này không có quyền Quản lý để phê duyệt!", HttpStatus.FORBIDDEN);
        }

        if (!passwordEncoder.matches(request.getPinCode(), manager.getPinCode())) {
            throw new AppException("Mã PIN Quản lý không chính xác!", HttpStatus.UNAUTHORIZED);
        }

        return true;
    }

    @Override
    public void logout(String username) {
        if (username == null || username.trim().isEmpty()) return;

        staffRepository.findByUsername(username).ifPresent(staff -> {
            // Khi nhan vien dang xuat, cap nhat isOnShift = false
            staff.setIsOnShift(false);
            staffRepository.save(staff);
        });
    }
}
```

---

### Bước B6: Tạo REST Controller `AuthController.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/controller/AuthController.java`
- **Nhiệm vụ:** Mở các REST endpoint `POST /api/auth/login`, `POST /api/auth/verify-manager-pin`, `POST /api/auth/logout`.

```java
package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.LoginRequest;
import com.romsteam.roms.dto.request.VerifyManagerPinRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.LoginResponse;
import com.romsteam.roms.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // POST /api/auth/login - Dang nhap ca truc
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đăng nhập ca làm việc thành công!"));
    }

    // POST /api/auth/verify-manager-pin - Quan ly phe duyet
    @PostMapping("/verify-manager-pin")
    public ResponseEntity<ApiResponse<Boolean>> verifyManagerPin(@Valid @RequestBody VerifyManagerPinRequest request) {
        boolean isValid = authService.verifyManagerPin(request);
        return ResponseEntity.ok(ApiResponse.success(isValid, "Xác thực mã PIN Quản lý thành công!"));
    }

    // POST /api/auth/logout - Dang xuat ca truc (Cap nhat isOnShift = false)
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody(required = false) Map<String, String> body,
                                                    Authentication authentication) {
        String username = null;
        if (body != null && body.containsKey("username")) {
            username = body.get("username");
        } else if (authentication != null) {
            username = authentication.getName();
        }

        if (username != null) {
            authService.logout(username);
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Đăng xuất ca làm việc thành công!"));
    }
}
```

---

---

## 3. Hướng Dẫn Chi Tiết Phía FRONTEND

Frontend được xây dựng bằng **React (Vite)**, **Axios**, **React Router v6**.

### Bước F1: Cấu Hình API Service `src/api/authApi.js`
- **Đường dẫn:** `SourceCode/frontend/src/api/authApi.js`
- **Nhiệm vụ:** Định nghĩa hàm `login()` và hàm `logout()` gửi username lên backend.

```javascript
import axiosClient from './axiosClient';

export const authApi = {
  // Gửi username và pinCode 6 số lên Backend
  login: (username, pinCode) => {
    return axiosClient.post('/auth/login', { username, pinCode });
  },

  // Đăng xuất ca làm việc (Backend cập nhật isOnShift = false)
  logout: (username) => {
    return axiosClient.post('/auth/logout', { username });
  },

  // Quản lý phê duyệt bằng mã PIN 6 số
  verifyManagerPin: (managerUsername, pinCode, reason) => {
    return axiosClient.post('/auth/verify-manager-pin', { managerUsername, pinCode, reason });
  }
};
```

---

### Bước F2: Tạo Quản Lý Trạng Thái Toàn Cục `src/context/AuthContext.jsx`
- **Đường dẫn:** `SourceCode/frontend/src/context/AuthContext.jsx`
- **Nhiệm vụ:** Lưu thông tin `assignedShift` và `isOnShift` của nhân viên, xử lý `logout()` đồng bộ với backend.

```javascript
import React, { createContext, useContext, useState } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext();

export function getRoleHome(role) {
  switch (role?.toUpperCase()) {
    case 'MANAGER':
    case 'ADMIN':
      return '/admin/reports';
    case 'WAITER':
    case 'BARTENDER':
      return '/waiter/floor-plan';
    case 'KITCHEN':
      return '/kitchen/kds';
    case 'CASHIER':
      return '/pos/checkout';
    default:
      return '/login';
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('roms_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('roms_token') || null);

  const login = async (username, pinCode) => {
    try {
      const response = await authApi.login(username, pinCode);

      // Backend trả về: { success: true, data: { accessToken, tokenType, id, username, fullName, role, assignedShift, isOnShift } }
      const resData = response.data?.data || {};
      const authToken = resData.accessToken || resData.token;
      const { id, fullName, role, assignedShift, isOnShift } = resData;
      const userData = { id, username: resData.username || username, fullName, role, assignedShift, isOnShift };

      localStorage.setItem('roms_token', authToken);
      localStorage.setItem('roms_user', JSON.stringify(userData));

      setToken(authToken);
      setUser(userData);
      return { success: true, role };
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!';
      return { success: false, message: errorMsg };
    }
  };

  const logout = async () => {
    try {
      if (user?.username) {
        await authApi.logout(user.username);
      }
    } catch (e) {
      console.warn('Lỗi gọi API đăng xuất:', e);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('roms_user');
      localStorage.removeItem('roms_token');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      login,
      logout,
      getRoleHome
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

---

### Bước F3: Giao Diện Đăng Nhập Cảm Ứng `src/pages/auth/StaffLoginPage.jsx`
- **Đường dẫn:** `SourceCode/frontend/src/pages/auth/StaffLoginPage.jsx`
- **Nhiệm vụ:** Hiển thị thông báo lỗi chi tiết từ backend (khi nhân viên chưa được set ca hoặc ngoài giờ mở ca 15 phút), cho phép chuyển đổi nhanh các tài khoản demo `PRESET_ACCOUNTS`.

---

## 4. Hướng Dẫn Kiểm Thử & Xử Lý Sự Cố (Troubleshooting)

### 4.1. Script SQL Tạo Mới Dữ Liệu Mẫu Hoàn Toàn (`staffs` & `staff_schedules`)

Khi bạn khởi động lại Backend với `spring.jpa.hibernate.ddl-auto=create`, toàn bộ các bảng trong CSDL đã được Hibernate xóa và tạo lại mới tinh (trống dữ liệu). 

Chạy đoạn Script dưới đây trong **SQL Server Management Studio (SSMS)** để nạp đầy đủ dữ liệu mẫu cho cả 2 bảng:

```sql
USE ROMS_DB;
GO

-- ==================================================================================
-- BƯỚC 1: DỌN SẠCH DỮ LIỆU CŨ (NẾU CÓ)
-- ==================================================================================
DELETE FROM staff_schedules;
DELETE FROM staffs;
GO

-- ==================================================================================
-- BƯỚC 2: TẠO MỚI 4 TÀI KHOẢN NHÂN VIÊN MẪU (BẢNG staffs)
-- Mã PIN 6 số dùng chung cho tất cả tài khoản: 123456
-- Chuỗi BCrypt Hash tương ứng: $2a$10$mmAQG4aK9I1ErPf33jRj5uYUccfmbaNkTvoj8bfJTNWjWqqsmfh92
-- ==================================================================================
INSERT INTO staffs (username, pin_code, full_name, phone, role, is_active, is_on_shift, created_at, updated_at)
VALUES 
-- 1. Quản Lý (Toàn quyền quản trị 24/7, không cần xếp ca)
('MGR-001', '$2a$10$mmAQG4aK9I1ErPf33jRj5uYUccfmbaNkTvoj8bfJTNWjWqqsmfh92', N'Dương Trọng', '0901000001', 'MANAGER', 1, 0, GETDATE(), GETDATE()),

-- 2. Phục Vụ (Demo đăng nhập ca trực thành công)
('EMP-001', '$2a$10$mmAQG4aK9I1ErPf33jRj5uYUccfmbaNkTvoj8bfJTNWjWqqsmfh92', N'Phạm Minh Đức', '0901000002', 'WAITER', 1, 0, GETDATE(), GETDATE()),

-- 3. Bếp KDS (Demo chặn do ngoài giờ ca trực)
('KDS-001', '$2a$10$mmAQG4aK9I1ErPf33jRj5uYUccfmbaNkTvoj8bfJTNWjWqqsmfh92', N'Ngô Viết Bảo Huy', '0901000003', 'KITCHEN', 1, 0, GETDATE(), GETDATE()),

-- 4. Thu Ngân (Demo chặn do chưa xếp lịch hôm nay)
('CSH-001', '$2a$10$mmAQG4aK9I1ErPf33jRj5uYUccfmbaNkTvoj8bfJTNWjWqqsmfh92', N'Đỗ Võ Thanh Trung', '0901000004', 'CASHIER', 1, 0, GETDATE(), GETDATE());
GO

-- ==================================================================================
-- BƯỚC 3: PHÂN CA MẪU NHIỀU NGÀY (BẢNG staff_schedules)
-- Phân ca tự động cho 30 ngày liên tiếp (cả Ca Sáng MORNING và Ca Tối EVENING)
-- Đảm bảo toàn bộ nhân viên (EMP-001, KDS-001, CSH-001) ngày nào, giờ nào cũng đăng nhập được!
-- ==================================================================================
DECLARE @StartDate DATE = CAST(GETDATE() AS DATE);
DECLARE @DaysCount INT = 30;

WITH DateRange AS (
    SELECT @StartDate AS WorkDate, 0 AS DayOffset
    UNION ALL
    SELECT DATEADD(DAY, 1, WorkDate), DayOffset + 1
    FROM DateRange
    WHERE DayOffset < @DaysCount - 1
)
INSERT INTO staff_schedules (staff_id, work_date, shift_type, created_at, updated_at)
SELECT s.id, d.WorkDate, sh.shift_type, GETDATE(), GETDATE()
FROM staffs s
CROSS JOIN DateRange d
CROSS JOIN (VALUES ('MORNING'), ('EVENING')) AS sh(shift_type)
WHERE s.role IN ('WAITER', 'KITCHEN', 'CASHIER')
OPTION (MAXRECURSION 100);
GO

-- (4) Quản lý MGR-001:
-- Không cần xếp ca. Quản lý luôn được phép đăng nhập mọi lúc (24/7)!
GO

-- ==================================================================================
-- BƯỚC 4: TRUY VẤN ĐỐI SOÁT KIỂM TRA DỮ LIỆU VỪA TẠO
-- ==================================================================================
SELECT 
    s.id AS StaffId,
    s.username AS Username,
    s.full_name AS FullName,
    s.role AS Role,
    sch.work_date AS WorkDate,
    sch.shift_type AS ShiftType,
    CASE 
        WHEN sch.shift_type = 'MORNING' THEN N'Ca Sáng (06:00 - 14:00)'
        WHEN sch.shift_type = 'EVENING' THEN N'Ca Tối (14:00 - 22:00)'
        ELSE N'Không xếp ca (Quản lý hoặc Nghỉ)'
    END AS ShiftHours,
    s.is_on_shift AS IsCurrentlyOnDuty
FROM staffs s
LEFT JOIN staff_schedules sch ON s.id = sch.staff_id
ORDER BY s.id, sch.work_date, sch.shift_type;
```

### 4.2. Cơ Chế Kiểm Thử Đăng Nhập Bằng Script SQL Phân Ca
Trong giai đoạn code và test web:
1. **Đăng ký ca bằng Script SQL:** Nhân viên được phân ca thông qua Script SQL (ở Bước 3) chèn vào bảng `staff_schedules` cho ngày hôm nay hoặc dải ngày cần test. Backend không tự động tạo lịch trong mã nguồn để đảm bảo tính toàn vẹn dữ liệu nghiệp vụ.
2. **Linh hoạt khung giờ (Full 24/7):** Khi nhân viên đã có lịch trực trong ngày từ SQL, hàm `ShiftType.isWithinShift(LocalTime now)` luôn trả về `true` để các thành viên có thể đăng nhập test vào bất kỳ giờ nào trong ngày.
3. **Chặn khi chưa có ca:** Nếu tài khoản chưa được đăng ký ca trong SQL cho ngày hôm nay, hệ thống sẽ trả về lỗi `403 FORBIDDEN` (*"Bạn không có lịch làm việc trong ngày hôm nay..."*).

| Tài khoản | Vai trò | Lịch làm việc trong SQL | Thời điểm thử | Kết quả mong đợi |
|---|---|---|---|---|
| `MGR-001` | `MANAGER` | Không cần xếp ca | Mọi lúc, mọi ngày | ✅ **Thành công**: Quản lý luôn có quyền 24/7 vào trang `/admin/reports`. |
| `EMP-001` | `WAITER` | Đã chạy SQL phân ca hôm nay | Bất kỳ giờ nào | ✅ **Thành công**: Đăng nhập thành công vào `/waiter/floor-plan`. |
| `KDS-001` | `KITCHEN` | Đã chạy SQL phân ca hôm nay | Bất kỳ giờ nào | ✅ **Thành công**: Đăng nhập thành công vào màn hình Bếp `/kitchen/kds`. |
| `CSH-001` | `CASHIER` | Đã chạy SQL phân ca hôm nay | Bất kỳ giờ nào | ✅ **Thành công**: Đăng nhập thành công vào Trạm Thu Ngân POS `/cashier/pos`. |
| Bất kỳ ai | Nhân viên | Chưa chạy SQL cho ngày hôm nay | Mọi lúc | ❌ **Bị chặn (403)**: *"Bạn không có lịch làm việc trong ngày hôm nay (dd/MM/yyyy)! Vui lòng liên hệ Quản lý."* |
