# BƯỚC 10: TẠO APIRESPONSE & GLOBALEXCEPTIONHANDLER (SỬ DỤNG LOMBOK)

## 1. Bước Này Làm Gì?
- Tạo cấu trúc phản hồi chuẩn `ApiResponse<T>` để tất cả API gửi về cho frontend (Web Admin, POS thu ngân, Mobile khách) đều có chung định dạng JSON nhất quán.
- Tạo custom exception `AppException` và bộ xử lý ngoại lệ tập trung `GlobalExceptionHandler` bắt lỗi validation và lỗi nghiệp vụ.
- **Sử dụng Lombok:** Thêm `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` trên `ApiResponse<T>` và `@Getter` trên `AppException`.

---

## 2. Các File Code & Chức Năng

### File 1: `ApiResponse.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/dto/response/ApiResponse.java`
- **Chức năng:** Khuôn mẫu chung đóng gói dữ liệu trả về cho mọi HTTP response.

```java
package com.romsteam.roms.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;

// @JsonInclude: Chỉ serialize ra JSON các trường không mang giá trị null
@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {

    // Cờ trạng thái request: true = thành công, false = thất bại
    private boolean success;

    // Câu thông báo thân thiện cho người dùng (ví dụ: "Đăng nhập thành công", "Món ăn không tồn tại")
    private String message;

    // Dữ liệu payload thực tế trả về cho frontend (chứa đối tượng kiểu T)
    private T data;

    // Danh sách chi tiết lỗi nếu có (dành cho validation form hoặc debug)
    private Object errors;

    // Thời điểm máy chủ sinh ra phản hồi này
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    // ===================================================================
    // STATIC FACTORY METHODS (TIỆN ÍCH GỌI NHANH Ở CONTROLLER)
    // ===================================================================

    // Trả về kết quả thành công có dữ liệu payload và thông điệp
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Trả về kết quả thành công chỉ có dữ liệu payload (thông điệp mặc định)
    public static <T> ApiResponse<T> success(T data) {
        return success(data, "Thao tác thành công");
    }

    // Trả về kết quả thất bại chỉ có câu thông báo lỗi
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Trả về kết quả thất bại kèm theo danh sách chi tiết các trường bị lỗi
    public static <T> ApiResponse<T> error(String message, Object errors) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .errors(errors)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
```

---

### File 2: `AppException.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/exception/AppException.java`
- **Chức năng:** Lớp ngoại lệ tự định nghĩa dùng để ném ra khi vi phạm các quy tắc nghiệp vụ trong Service.

```java
package com.romsteam.roms.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

// Kế thừa RuntimeException: Unchecked Exception
@Getter
public class AppException extends RuntimeException {

    // Mã trạng thái HTTP tương ứng muốn trả về cho client (400, 404, 409...)
    private final HttpStatus httpStatus;

    // Constructor nhận thông điệp lỗi và mã trạng thái HTTP
    public AppException(String message, HttpStatus httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
    }

    // Constructor nhận thông điệp lỗi (mặc định HTTP 400 BAD REQUEST)
    public AppException(String message) {
        super(message);
        this.httpStatus = HttpStatus.BAD_REQUEST;
    }
}
```

---

### File 3: `GlobalExceptionHandler.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/exception/GlobalExceptionHandler.java`
- **Chức năng:** Bộ lọc bắt lỗi toàn cục bằng `@RestControllerAdvice`.

```java
package com.romsteam.roms.exception;

import com.romsteam.roms.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Xử lý ngoại lệ nghiệp vụ AppException do lập trình viên chủ động ném ra
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Object>> handleAppException(AppException ex) {
        ApiResponse<Object> response = ApiResponse.error(ex.getMessage());
        return new ResponseEntity<>(response, ex.getHttpStatus());
    }

    // 2. Xử lý ngoại lệ Validation (@Valid trên DTO thất bại)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        ApiResponse<Object> response = ApiResponse.error("Dữ liệu đầu vào không hợp lệ", errors);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    // 3. Xử lý tất cả các ngoại lệ không mong muốn còn lại (Lỗi 500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGlobalException(Exception ex) {
        ApiResponse<Object> response = ApiResponse.error("Đã xảy ra lỗi hệ thống: " + ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```
