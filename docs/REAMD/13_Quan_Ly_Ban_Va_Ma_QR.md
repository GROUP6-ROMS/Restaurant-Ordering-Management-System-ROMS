# BƯỚC 13: QUẢN LÝ BÀN ĂN & MÃ QR (SỬ DỤNG LOMBOK)

## 1. Bước Này Làm Gì?
- Xây dựng các DTO quản lý bàn ăn (`CreateTableRequest`, `UpdateTableStatusRequest`, `TableResponse`).
- Xây dựng `RestaurantTableService` và `RestaurantTableServiceImpl` xử lý toàn bộ nghiệp vụ về bàn ăn: tạo bàn theo khu vực (`zone`), đổi trạng thái bàn (AVAILABLE, OCCUPIED, DIRTY, RESERVED, BLOCKED), sinh mã bí mật `qrToken` (UUID) để in tem QR dán trên bàn.
- Cung cấp API quản trị bàn ăn cho nhân viên (`/api/tables`) và API công khai cho khách quét QR kiểm tra bàn hợp lệ (`/api/customer/tables/verify-qr`).
- **Sử dụng Lombok:**
  - Áp dụng `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` cho tất cả các DTO.
  - Áp dụng `@RequiredArgsConstructor` cho `RestaurantTableServiceImpl`, `RestaurantTableController`, `CustomerTableController`.

---

## 2. Các File Code & Chức Năng

### File 1: `CreateTableRequest.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/dto/request/CreateTableRequest.java`
- **Chức năng:** DTO nhận thông tin thêm bàn mới từ quản lý.

```java
package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTableRequest {

    // Số hiệu hoặc tên bàn (ví dụ: "Bàn 01", "VIP 1") - Bắt buộc nhập
    @NotBlank(message = "Tên bàn không được để trống")
    private String tableNumber;

    // Khu vực: "ZONE_1" (Sảnh chính), "ZONE_2" (Ban công), "VIP" (Phòng VIP)
    @NotBlank(message = "Khu vực bàn không được để trống")
    private String zone;

    // Sức chứa tối đa số lượng khách của bàn (tối thiểu 1 người)
    @NotNull(message = "Sức chứa không được để trống")
    @Min(value = 1, message = "Sức chứa của bàn phải từ 1 người trở lên")
    private Integer capacity;
}
```

---

### File 2: `UpdateTableStatusRequest.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/dto/request/UpdateTableStatusRequest.java`
- **Chức năng:** DTO cập nhật trạng thái bàn (mở bàn AVAILABLE, khóa bàn BLOCKED kèm lý do, đặt bàn RESERVED kèm giờ hẹn).

```java
package com.romsteam.roms.dto.request;

import com.romsteam.roms.enums.TableStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTableStatusRequest {

    @NotNull(message = "Trạng thái bàn không được để trống")
    private TableStatus status; // AVAILABLE, OCCUPIED, DIRTY, RESERVED, BLOCKED

    // Lý do khóa bàn khi status = BLOCKED (ví dụ: "Bảo trì hệ thống đèn & thông gió")
    private String blockedReason;

    // Thông tin khách đặt trước khi status = RESERVED (ví dụ: "Chị Mai - 0982xxx")
    private String reservationInfo;

    // Giờ hẹn đến của khách khi status = RESERVED (ví dụ: "20:00")
    private String reservedTime;
}
```

---

### File 3: `TableResponse.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/dto/response/TableResponse.java`
- **Chức năng:** DTO trả về thông tin bàn ăn cho giao diện sơ đồ bàn POS, phục vụ và khách quét QR.

```java
package com.romsteam.roms.dto.response;

import com.romsteam.roms.enums.TableStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableResponse {

    private Long id;
    private String tableNumber;
    private String zone;
    private Integer capacity;
    private TableStatus status;
    private String blockedReason;
    private String reservationInfo;
    private String reservedTime;
    private String qrToken;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

---

### File 4: `RestaurantTableService.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/service/RestaurantTableService.java`
- **Chức năng:** Interface khai báo các hàm nghiệp vụ quản lý bàn và mã QR.

```java
package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.CreateTableRequest;
import com.romsteam.roms.dto.request.UpdateTableStatusRequest;
import com.romsteam.roms.dto.response.TableResponse;

import java.util.List;

public interface RestaurantTableService {

    List<TableResponse> getAllTables();

    List<TableResponse> getAvailableTables();

    TableResponse getTableById(Long id);

    TableResponse createTable(CreateTableRequest request);

    TableResponse updateTableStatus(Long id, UpdateTableStatusRequest request);

    TableResponse generateQrToken(Long id);

    TableResponse verifyQrToken(String qrToken);

    void deleteTable(Long id);
}
```

---

### File 5: `RestaurantTableServiceImpl.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/service/serviceImpl/RestaurantTableServiceImpl.java`
- **Chức năng:** Triển khai logic quản lý bàn ăn, kiểm tra trùng số bàn, tự động sinh UUID mã QR token khi tạo bàn mới.

```java
package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.CreateTableRequest;
import com.romsteam.roms.dto.request.UpdateTableStatusRequest;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.entity.RestaurantTable;
import com.romsteam.roms.enums.TableStatus;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.repository.RestaurantTableRepository;
import com.romsteam.roms.service.RestaurantTableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RestaurantTableServiceImpl implements RestaurantTableService {

    private final RestaurantTableRepository tableRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TableResponse> getAllTables() {
        return tableRepository.findByIsActive(true)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TableResponse> getAvailableTables() {
        return tableRepository.findByStatus(TableStatus.AVAILABLE)
                .stream()
                .filter(RestaurantTable::getIsActive)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TableResponse getTableById(Long id) {
        RestaurantTable table = findTableById(id);
        return mapToResponse(table);
    }

    @Override
    @Transactional
    public TableResponse createTable(CreateTableRequest request) {
        if (tableRepository.findByTableNumber(request.getTableNumber()).isPresent()) {
            throw new AppException("Số bàn '" + request.getTableNumber() + "' đã tồn tại!", HttpStatus.CONFLICT);
        }

        RestaurantTable table = RestaurantTable.builder()
                .tableNumber(request.getTableNumber())
                .zone(request.getZone())
                .capacity(request.getCapacity())
                .status(TableStatus.AVAILABLE)
                .qrToken(UUID.randomUUID().toString())
                .isActive(true)
                .build();

        RestaurantTable saved = tableRepository.save(table);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TableResponse updateTableStatus(Long id, UpdateTableStatusRequest request) {
        RestaurantTable table = findTableById(id);
        table.setStatus(request.getStatus());

        if (request.getStatus() == TableStatus.BLOCKED) {
            table.setBlockedReason(request.getBlockedReason());
        } else if (request.getStatus() == TableStatus.RESERVED) {
            table.setReservationInfo(request.getReservationInfo());
            table.setReservedTime(request.getReservedTime());
        } else {
            table.setBlockedReason(null);
            table.setReservationInfo(null);
            table.setReservedTime(null);
        }

        RestaurantTable updated = tableRepository.save(table);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public TableResponse generateQrToken(Long id) {
        RestaurantTable table = findTableById(id);
        table.setQrToken(UUID.randomUUID().toString());
        RestaurantTable updated = tableRepository.save(table);
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public TableResponse verifyQrToken(String qrToken) {
        RestaurantTable table = tableRepository.findByQrToken(qrToken)
                .orElseThrow(() -> new AppException("Mã QR không hợp lệ hoặc bàn không tồn tại!", HttpStatus.NOT_FOUND));

        if (!table.getIsActive() || table.getStatus() == TableStatus.BLOCKED) {
            throw new AppException("Bàn này hiện đang tạm ngưng phục vụ!", HttpStatus.BAD_REQUEST);
        }

        return mapToResponse(table);
    }

    @Override
    @Transactional
    public void deleteTable(Long id) {
        RestaurantTable table = findTableById(id);
        table.setIsActive(false);
        tableRepository.save(table);
    }

    private RestaurantTable findTableById(Long id) {
        return tableRepository.findById(id)
                .orElseThrow(() -> new AppException("Không tìm thấy bàn với ID: " + id, HttpStatus.NOT_FOUND));
    }

    private TableResponse mapToResponse(RestaurantTable table) {
        return TableResponse.builder()
                .id(table.getId())
                .tableNumber(table.getTableNumber())
                .zone(table.getZone())
                .capacity(table.getCapacity())
                .status(table.getStatus())
                .blockedReason(table.getBlockedReason())
                .reservationInfo(table.getReservationInfo())
                .reservedTime(table.getReservedTime())
                .qrToken(table.getQrToken())
                .isActive(table.getIsActive())
                .createdAt(table.getCreatedAt())
                .updatedAt(table.getUpdatedAt())
                .build();
    }
}
```

---

### File 6: `RestaurantTableController.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/controller/RestaurantTableController.java`
- **Chức năng:** Cung cấp các REST API quản lý bàn ăn cho nhân viên thu ngân, phục vụ và quản lý.

```java
package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.CreateTableRequest;
import com.romsteam.roms.dto.request.UpdateTableStatusRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.service.RestaurantTableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tables")
@RequiredArgsConstructor
public class RestaurantTableController {

    private final RestaurantTableService tableService;

    // 1. Lấy danh sách tất cả các bàn đang hoạt động
    @GetMapping
    public ResponseEntity<ApiResponse<List<TableResponse>>> getAllTables() {
        List<TableResponse> tables = tableService.getAllTables();
        return ResponseEntity.ok(ApiResponse.success(tables, "Lấy danh sách bàn thành công!"));
    }

    // 2. Lấy danh sách các bàn đang trống (AVAILABLE)
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<TableResponse>>> getAvailableTables() {
        List<TableResponse> tables = tableService.getAvailableTables();
        return ResponseEntity.ok(ApiResponse.success(tables, "Lấy danh sách bàn trống thành công!"));
    }

    // 3. Lấy thông tin chi tiết bàn theo ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TableResponse>> getTableById(@PathVariable Long id) {
        TableResponse table = tableService.getTableById(id);
        return ResponseEntity.ok(ApiResponse.success(table, "Lấy thông tin bàn thành công!"));
    }

    // 4. Tạo bàn mới
    @PostMapping
    public ResponseEntity<ApiResponse<TableResponse>> createTable(@Valid @RequestBody CreateTableRequest request) {
        TableResponse table = tableService.createTable(request);
        return new ResponseEntity<>(ApiResponse.success(table, "Tạo bàn mới thành công!"), HttpStatus.CREATED);
    }

    // 5. Cập nhật trạng thái bàn (Khóa bàn BLOCKED, Đặt bàn RESERVED...)
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TableResponse>> updateTableStatus(@PathVariable Long id, @Valid @RequestBody UpdateTableStatusRequest request) {
        TableResponse table = tableService.updateTableStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(table, "Cập nhật trạng thái bàn thành công!"));
    }

    // 6. Sinh lại mã QR Token mới cho bàn
    @PostMapping("/{id}/generate-qr")
    public ResponseEntity<ApiResponse<TableResponse>> generateQrToken(@PathVariable Long id) {
        TableResponse table = tableService.generateQrToken(id);
        return ResponseEntity.ok(ApiResponse.success(table, "Sinh mã QR mới thành công!"));
    }

    // 7. Xóa / ẩn bàn (Soft Delete)
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTable(@PathVariable Long id) {
        tableService.deleteTable(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Ẩn bàn thành công!"));
    }
}
```

---

### File 7: `CustomerTableController.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/controller/CustomerTableController.java`
- **Chức năng:** Endpoint công khai dành cho khách hàng: khi quét mã QR dán trên mặt bàn, web khách gọi API này để xác thực bàn.

```java
package com.romsteam.roms.controller;

import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.service.RestaurantTableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer/tables")
@RequiredArgsConstructor
public class CustomerTableController {

    private final RestaurantTableService tableService;

    // Xác thực mã QR khi khách quét tại bàn
    @GetMapping("/verify-qr")
    public ResponseEntity<ApiResponse<TableResponse>> verifyQrCode(@RequestParam("qrToken") String qrToken) {
        TableResponse table = tableService.verifyQrToken(qrToken);
        return ResponseEntity.ok(ApiResponse.success(table, "Xác thực mã QR bàn ăn thành công!"));
    }
}
```
