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
5. **Ràng buộc phân ca & giờ trực (Shift Enforcement):**
   - **Với Quản lý (`MANAGER`):** Luôn được phép đăng nhập mọi lúc để mở cửa quán, phân ca nhân sự và giám sát vận hành.
   - **Với Nhân viên thường (`WAITER`, `KITCHEN`, `CASHIER`):**
     - Bắt buộc phải được Quản lý phân công ca làm việc (`assignedShift != NONE`). Nếu chưa được phân ca, hệ thống **từ chối đăng nhập (403 Forbidden)** và thông báo: *"Bạn chưa được phân công ca làm việc hôm nay! Vui lòng liên hệ Quản lý."*
     - **Quy tắc 15 phút mở ca:** Nhân viên chỉ được phép đăng nhập **trước giờ mở ca 15 phút** cho đến khi hết ca:
       - **Ca Sáng (06:00 - 14:00):** Được phép vào ca từ **05:45** đến **14:00**.
       - **Ca Tối (14:00 - 22:00):** Được phép vào ca từ **13:45** đến **22:00**.
       - **Ca Cả Ngày (06:00 - 23:00):** Được phép vào ca từ **05:45** đến **23:00** (dùng cho ca gãy/chạy demo).
     - Nếu ngoài khung giờ ca, hệ thống **từ chối đăng nhập** và hiển thị thông báo chi tiết khung giờ.
     - Khi đăng nhập thành công vào ca: Hệ thống tự động cập nhật `isOnShift = true`.
     - Khi nhân viên bấm đăng xuất (Logout): Hệ thống tự động cập nhật `isOnShift = false`.

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
    NONE("Chưa phân ca", null, null),
    MORNING("Ca Sáng", LocalTime.of(6, 0), LocalTime.of(14, 0)),
    EVENING("Ca Tối", LocalTime.of(14, 0), LocalTime.of(22, 0)),
    FULL_DAY("Ca Cả Ngày", LocalTime.of(6, 0), LocalTime.of(23, 0));

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

### Bước B2: Bổ Sung Trường Phân Ca Vào Entity `Staff.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/entity/Staff.java`
- **Nhiệm vụ:** Thêm 2 trường `assignedShift` và `isOnShift` để lưu ca làm việc và trạng thái trực ca của nhân viên.

```java
    // Ca lam viec duoc Quan ly phan cong (NONE, MORNING, EVENING, FULL_DAY)
    @Enumerated(EnumType.STRING)
    @Column(name = "assigned_shift", length = 30)
    @Builder.Default
    private ShiftType assignedShift = ShiftType.NONE;

    // Trang thai thuc te co dang trong ca lam viec hay khong
    @Builder.Default
    @Column(name = "is_on_shift", nullable = false)
    private Boolean isOnShift = false;
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
import com.romsteam.roms.entity.enums.ShiftType;
import com.romsteam.roms.entity.enums.UserRole;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.repository.StaffRepository;
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

import java.time.LocalTime;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final StaffRepository staffRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           StaffRepository staffRepository,
                           JwtTokenProvider jwtTokenProvider,
                           PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.staffRepository = staffRepository;
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

            // 4. KIEM TRA DIEU KIEN PHAN CONG CA TRUC:
            // Neu KHONG phai Quan ly (MANAGER), bat buoc phai duoc phan cong ca va trong khung gio ca truc
            if (staff.getRole() != UserRole.MANAGER) {
                ShiftType shift = staff.getAssignedShift();
                if (shift == null || shift == ShiftType.NONE) {
                    throw new AppException("Bạn chưa được phân công ca làm việc hôm nay! Vui lòng liên hệ Quản lý.", HttpStatus.FORBIDDEN);
                }

                LocalTime now = LocalTime.now();
                if (!shift.isWithinShift(now)) {
                    String message = String.format(
                            "Chưa đến hoặc đã hết ca làm việc của bạn (Ca %s: %s - %s). Bạn chỉ được đăng nhập trước giờ mở ca 15 phút!",
                            shift.getLabel(),
                            shift.getStartTime(),
                            shift.getEndTime()
                    );
                    throw new AppException(message, HttpStatus.FORBIDDEN);
                }
            }

            // 5. Cap nhat trang thai dang trong ca truc
            staff.setIsOnShift(true);
            staffRepository.save(staff);

            // 6. Sinh token JWT
            String token = jwtTokenProvider.generateToken(authentication);

            // 7. Dong goi LoginResponse tra ve cho frontend
            return LoginResponse.builder()
                    .accessToken(token)
                    .tokenType("Bearer")
                    .id(staff.getId())
                    .username(staff.getUsername())
                    .fullName(staff.getFullName())
                    .role(staff.getRole().name())
                    .assignedShift(staff.getAssignedShift() != null ? staff.getAssignedShift().name() : "NONE")
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

### 4.1. Tạo Dữ Liệu Phân Ca Trong SQL Server
Để kiểm tra tính năng phân ca, chạy các câu lệnh SQL Server sau:

```sql
-- 1. Quản lý (luôn vào được không giới hạn ca):
UPDATE staffs SET assigned_shift = 'NONE' WHERE username = 'MGR-001';

-- 2. Phục vụ - Gán Ca Tối (14:00 - 22:00, được vào từ 13:45):
UPDATE staffs SET assigned_shift = 'EVENING' WHERE username = 'EMP-001';

-- 3. Bếp - Gán Ca Sáng (06:00 - 14:00, được vào từ 05:45):
UPDATE staffs SET assigned_shift = 'MORNING' WHERE username = 'KDS-001';

-- 4. Thu ngân - Chưa được phân ca (để test trường hợp bị chặn):
UPDATE staffs SET assigned_shift = 'NONE' WHERE username = 'CSH-001';

-- 5. Ca Cả Ngày linh hoạt (06:00 - 23:00, dùng khi muốn test bất kỳ lúc nào):
-- UPDATE staffs SET assigned_shift = 'FULL_DAY' WHERE username = 'EMP-001';
```

### 4.2. Kịch Bản Kiểm Thử Đăng Nhập Thực Tế
| Tài khoản | Vai trò | Ca gán | Thời điểm thử | Kết quả mong đợi |
|---|---|---|---|---|
| `MGR-001` | `MANAGER` | Bất kỳ | Mọi lúc | ✅ **Thành công**: Vào trang `/admin/reports`. |
| `CSH-001` | `CASHIER` | `NONE` | Mọi lúc | ❌ **Bị chặn (403)**: *"Bạn chưa được phân công ca làm việc hôm nay! Vui lòng liên hệ Quản lý."* |
| `KDS-001` | `KITCHEN` | `MORNING` | Lúc 16:50 (chiều) | ❌ **Bị chặn (403)**: *"Chưa đến hoặc đã hết ca làm việc của bạn (Ca Ca Sáng: 06:00 - 14:00)..."* |
| `EMP-001` | `WAITER` | `EVENING` | Lúc 16:50 (chiều) | ✅ **Thành công**: Nằm trong khoảng 13:45 - 22:00, `isOnShift = true`, vào `/waiter/floor-plan`. |
| `EMP-001` | `WAITER` | `EVENING` | Bấm Đăng xuất | ✅ **Thành công**: Hệ thống cập nhật `isOnShift = false` trong CSDL. |
