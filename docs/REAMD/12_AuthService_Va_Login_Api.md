# BƯỚC 12: XÂY DỰNG AUTH SERVICE & API ĐĂNG NHẬP (SỬ DỤNG LOMBOK)

## 1. Bước Này Làm Gì?
- Tạo DTO `LoginRequest` (nhận `username` - Mã nhân viên và `pinCode` - Mã PIN 6 số; **hoàn toàn không dùng password**) và `LoginResponse` (trả về token JWT cùng thông tin nhân viên).
- Tạo DTO `VerifyManagerPinRequest` phục vụ nghiệp vụ Quản lý phê duyệt chốt ca / hủy món bằng mã PIN 6 số.
- Xây dựng `AuthService` và `AuthServiceImpl` xử lý logic xác thực nhân viên qua Spring Security `AuthenticationManager`.
- Tạo `AuthController` với các endpoint:
  - `POST /api/auth/login`: Đăng nhập ca trực bằng Mã nhân viên và Mã PIN 6 số.
  - `POST /api/auth/verify-manager-pin`: Quản lý xác nhận phê duyệt chốt ca thu ngân.
- **Sử dụng Lombok:**
  - Áp dụng `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` cho tất cả các DTO Request / Response.
  - Áp dụng `@RequiredArgsConstructor` cho `AuthServiceImpl` và `AuthController` để tự động tiêm phụ thuộc (Dependency Injection) qua constructor ngắn gọn, sạch sẽ.

---

## 2. Các File Code & Chức Năng

### File 1: `LoginRequest.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/dto/request/LoginRequest.java`
- **Chức năng:** Chứa thông tin đăng nhập ca trực gồm Tên đăng nhập (Mã nhân viên) và Mã PIN 6 số. Không dùng mật khẩu thông thường.

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

    // Tên đăng nhập / Mã nhân viên (ví dụ: MGR-084, EMP-8812, KDS-001, CSH-002)
    @NotBlank(message = "Tên đăng nhập không được để trống")
    private String username;

    // Mã PIN ca trực (bắt buộc đúng 6 chữ số, không dùng password)
    @NotBlank(message = "Mã PIN không được để trống")
    @Pattern(regexp = "^\\d{6}$", message = "Mã PIN phải gồm đúng 6 chữ số")
    private String pinCode;
}
```

---

### File 2: `VerifyManagerPinRequest.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/dto/request/VerifyManagerPinRequest.java`
- **Chức năng:** Dùng khi Thu ngân chốt ca tiền mặt hoặc hủy order cần Quản lý xác thực phê duyệt.

```java
package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyManagerPinRequest {

    @NotBlank(message = "Mã quản lý không được để trống")
    private String managerUsername;

    @NotBlank(message = "Mã PIN xác nhận không được để trống")
    @Pattern(regexp = "^\\d{6}$", message = "Mã PIN quản lý phải gồm đúng 6 chữ số")
    private String pinCode;

    // Lý do cần xác thực (ví dụ: "CASHIER_SHIFT_CLOSING", "CANCEL_ORDER_ITEM")
    private String reason;
}
```

---

### File 3: `LoginResponse.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/dto/response/LoginResponse.java`
- **Chức năng:** Đóng gói chuỗi Token JWT và thông tin cơ bản của nhân viên trả về cho Frontend lưu vào localStorage/AuthContext.

```java
package com.romsteam.roms.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private String token;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long id;
    private String username;
    private String fullName;
    private String role; // MANAGER, WAITER, KITCHEN, CASHIER
}
```

---

### File 4: `AuthService.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/service/AuthService.java`
- **Chức năng:** Khai báo phương thức đăng nhập và phương thức xác thực PIN Quản lý.

```java
package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.LoginRequest;
import com.romsteam.roms.dto.request.VerifyManagerPinRequest;
import com.romsteam.roms.dto.response.LoginResponse;

public interface AuthService {

    // Xử lý xác thực đăng nhập bằng username + pinCode 6 số và trả về JWT
    LoginResponse login(LoginRequest request);

    // Xác thực mã PIN Quản lý khi chốt ca tiền mặt hoặc thực hiện thao tác đặc quyền
    boolean verifyManagerPin(VerifyManagerPinRequest request);
}
```

---

### File 5: `AuthServiceImpl.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/service/serviceImpl/AuthServiceImpl.java`
- **Chức năng:** Cài đặt logic xác thực: đối chiếu username & pinCode qua AuthenticationManager, sinh JWT token và kiểm tra quyền Quản lý. Sử dụng `@RequiredArgsConstructor` để tự động tiêm dependencies.

```java
package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.LoginRequest;
import com.romsteam.roms.dto.request.VerifyManagerPinRequest;
import com.romsteam.roms.dto.response.LoginResponse;
import com.romsteam.roms.entity.Staff;
import com.romsteam.roms.enums.UserRole;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.repository.StaffRepository;
import com.romsteam.roms.security.JwtTokenProvider;
import com.romsteam.roms.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final StaffRepository staffRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Override
    public LoginResponse login(LoginRequest request) {
        try {
            // 1. Thực hiện xác thực username và pinCode qua AuthenticationManager
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPinCode()
                    )
            );

            // 2. Lưu thông tin xác thực vào SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 3. Sinh token JWT
            String token = jwtTokenProvider.generateToken(authentication);

            // 4. Lấy thông tin nhân viên từ CSDL để trả về frontend
            Staff staff = staffRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new AppException("Nhân viên không tồn tại", HttpStatus.NOT_FOUND));

            // 5. Đóng gói vào LoginResponse
            return LoginResponse.builder()
                    .token(token)
                    .tokenType("Bearer")
                    .id(staff.getId())
                    .username(staff.getUsername())
                    .fullName(staff.getFullName())
                    .role(staff.getRole().name())
                    .build();

        } catch (BadCredentialsException e) {
            // Ném ngoại lệ nếu sai tên đăng nhập hoặc mã PIN
            throw new AppException("Sai tên đăng nhập hoặc mã PIN!", HttpStatus.UNAUTHORIZED);
        }
    }

    @Override
    public boolean verifyManagerPin(VerifyManagerPinRequest request) {
        // 1. Tìm thông tin Quản lý theo username
        Staff manager = staffRepository.findByUsername(request.getManagerUsername())
                .orElseThrow(() -> new AppException("Không tìm thấy tài khoản quản lý", HttpStatus.NOT_FOUND));

        // 2. Kiểm tra tài khoản có đúng là vai trò MANAGER không
        if (manager.getRole() != UserRole.MANAGER) {
            throw new AppException("Tài khoản này không có quyền Quản lý để phê duyệt!", HttpStatus.FORBIDDEN);
        }

        // 3. Kiểm tra mã PIN 6 số có khớp không
        if (!passwordEncoder.matches(request.getPinCode(), manager.getPinCode())) {
            throw new AppException("Mã PIN Quản lý không chính xác!", HttpStatus.UNAUTHORIZED);
        }

        return true;
    }
}
```

---

### File 6: `AuthController.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/controller/AuthController.java`
- **Chức năng:** REST Controller cung cấp endpoint đăng nhập ca trực và xác thực mã PIN Quản lý.

```java
package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.LoginRequest;
import com.romsteam.roms.dto.request.VerifyManagerPinRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.LoginResponse;
import com.romsteam.roms.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth") // Tiền tố endpoint xác thực (đã permitAll trong SecurityConfig)
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // Endpoint đăng nhập ca trực bằng Username & Mã PIN 6 số: POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đăng nhập ca làm việc thành công!"));
    }

    // Endpoint xác thực Mã PIN 6 số của Quản lý (khi Thu ngân chốt ca): POST /api/auth/verify-manager-pin
    @PostMapping("/verify-manager-pin")
    public ResponseEntity<ApiResponse<Boolean>> verifyManagerPin(@Valid @RequestBody VerifyManagerPinRequest request) {
        boolean isValid = authService.verifyManagerPin(request);
        return ResponseEntity.ok(ApiResponse.success(isValid, "Xác thực quản lý phê duyệt thành công!"));
    }
}
```
