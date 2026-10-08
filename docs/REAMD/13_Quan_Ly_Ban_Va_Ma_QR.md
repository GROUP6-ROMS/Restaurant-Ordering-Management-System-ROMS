# BƯỚC 13: XÂY DỰNG BACKEND CHO MÀN HÌNH "SƠ ĐỒ BÀN & QUẢN LÝ KHU VỰC" (CHUẨN LOMBOK)

> **Mục tiêu:** Xây dựng trọn vẹn toàn bộ nghiệp vụ Backend (Spring Boot 3 + Spring Data JPA + Spring Security + Lombok) để cấp dữ liệu thật và xử lý toàn bộ các hành động trên màn hình **"Sơ Đồ Bàn & Quản Lý Khu Vực"** (`/admin/tables`), bao gồm: 5 thẻ KPI thống kê thời gian thực, danh sách bàn theo khu vực/trạng thái, thêm bàn mới, đổi trạng thái bàn (Khóa/Mở/Đặt chỗ), sinh mã QR token và xuất mã QR.

---

## 1. TỔNG QUAN NGHIỆP VỤ & SƠ ĐỒ LUỒNG DỮ LIỆU

### 1.1. Khảo sát các chức năng trên màn hình giao diện
Khi đối chiếu với giao diện thực tế của màn hình Quản lý bàn ăn, Backend cần đáp ứng:

1. **5 Thẻ KPI Thống Kê Tổng Quan (Real-time Metric Cards):**
   - **Tổng Số Bàn:** Đếm tổng số bàn đang mở kinh doanh và tổng sức chứa (ví dụ: *18 bàn - 92 chỗ*).
   - **Đang Phục Vụ:** Đếm số bàn có trạng thái `OCCUPIED` và tổng số khách thực tế đang ngồi.
   - **Bàn Trống Sẵn Sàng:** Đếm số bàn có trạng thái `AVAILABLE`.
   - **Bàn Đã Đặt Trước:** Đếm số bàn có trạng thái `RESERVED`.
   - **Đã Khóa / Bảo Trì:** Đếm số bàn có trạng thái `BLOCKED`.

2. **Bộ Lọc Phân Khu & Tìm Kiếm (Tabs & Search Filter):**
   - Lọc theo phân khu: `ALL` (Tất cả), `ZONE_1` (Tầng 1 - Sảnh Chính), `ZONE_2` (Tầng 2 - Ban Công), `VIP` (Phòng VIP).
   - Lọc theo trạng thái: `ALL`, `AVAILABLE`, `OCCUPIED`, `RESERVED`, `DIRTY`, `BLOCKED`.
   - Tìm kiếm theo từ khóa (Mã bàn `code` hoặc Tên bàn `name`).

3. **Thông Tin Chi Tiết Từng Thẻ Bàn (Table Card Data):**
   - Mã hiệu bàn (`code`), Tên bàn (`name`), Khu vực (`zone`), Sức chứa bàn (`capacity`).
   - Nếu `OCCUPIED`: Hiển thị số khách thực tế (`guests`) và **Hóa đơn hiện tại (`currentBill`)** liên kết với phiên ăn `DiningSession`.
   - Nếu `RESERVED`: Hiển thị thông tin khách đặt (`reservationInfo`) và giờ hẹn (`reservedTime`).
   - Nếu `BLOCKED`: Hiển thị lý do tạm ngưng phục vụ (`blockedReason`).

4. **Các Thao Tác Nghiệp Vụ (Actions & Modals):**
   - **Thêm Bàn Mới (`POST /api/admin/tables`):** Nhập mã, tên, khu vực, sức chứa. Hệ thống kiểm tra trùng mã và tự động sinh chuỗi bí mật `qrToken` (UUID).
   - **Đổi Trạng Thái Bàn (`PATCH /api/admin/tables/{id}/status`):** Chuyển đổi giữa các trạng thái kèm cập nhật lý do bảo trì hoặc thông tin đặt hẹn.
   - **Tái Tạo Mã QR (`POST /api/admin/tables/{id}/refresh-qr`):** Đổi chuỗi token bảo mật mới khi tem dán tại bàn bị rò rỉ.
   - **Xác Thực Khách Quét QR (`POST /api/customer/tables/verify-qr`):** API công khai cho khách quét mã tại bàn kiểm tra tính hợp lệ trước khi gọi món.

---

### 1.2. Sơ đồ tuần tự xử lý (Sequence Diagram)
```text
[Manager trên Web Admin]                     [Backend: AdminTableController]         [RestaurantTableService]         [SQL Server / Repository]
         │                                                  │                                  │                                  │
         │─── 1. GET /api/admin/tables/summary ────────────>│                                  │                                  │
         │                                                  │─── getTableSummary() ───────────>│                                  │
         │                                                  │                                  │─── Đếm countByStatus & sum ─────>│
         │<── 2. Trả về 5 thẻ KPI (Tổng, Phục vụ, Trống..) ──│<── DTO TableSummaryResponse ────│                                  │
         │                                                  │                                  │                                  │
         │─── 3. GET /api/admin/tables?zone=...&status=... ─>│                                  │                                  │
         │                                                  │─── getAllTables(...) ───────────>│                                  │
         │                                                  │                                  │─── Query danh sách & JOIN Bill ─>│
         │<── 4. Danh sách TableResponse (kèm bill, QR) ────│<── List<TableResponse> ─────────│                                  │
         │                                                  │                                  │                                  │
         │─── 5. PATCH /api/admin/tables/1/status (BLOCKED) │                                  │                                  │
         │       { status: "BLOCKED", blockedReason: "..." }│─── updateTableStatus(...) ──────>│                                  │
         │                                                  │                                  │─── Cập nhật trạng thái bàn ─────>│
         │<── 6. 200 OK: Trạng thái bàn đã cập nhật ────────│<── TableResponse mới ────────────│                                  │
```

---

## 2. HƯỚNG DẪN CODE CHI TIẾT TỪNG BƯỚC

---

### BƯỚC 1: SỬA ENUM `TableStatus.java`

- **Đường dẫn file:** `src/main/java/com/romsteam/roms/entity/enums/TableStatus.java`
- **Nhiệm vụ:** Định nghĩa 5 trạng thái bàn, bổ sung `BLOCKED` (bàn tạm khóa/bảo trì) và sửa lỗi chính tả `REVERVED` thành `RESERVED`.

```java
package com.romsteam.roms.entity.enums;

/**
 * Trạng thái của một bàn ăn trong nhà hàng ROMS.
 */
public enum TableStatus {
    AVAILABLE,  // Bàn trống sẵn sàng đón khách
    OCCUPIED,   // Bàn đang có khách ngồi ăn (phiên ăn ACTIVE)
    DIRTY,      // Khách đã thanh toán rời đi, bàn chờ nhân viên dọn dẹp
    RESERVED,   // Bàn đã có khách đặt trước (kèm giờ hẹn và thông tin liên hệ)
    BLOCKED     // Bàn tạm khóa / bảo trì trang thiết bị
}
```

---

### BƯỚC 2: CẬP NHẬT ENTITY `RestaurantTable.java` (CHUẨN LOMBOK)

- **Đường dẫn file:** `src/main/java/com/romsteam/roms/entity/RestaurantTable.java`
- **Nhiệm vụ:** Cập nhật Entity với Lombok, bổ sung các trường: `name` (Tên hiển thị), `zone` (Phân khu), `blockedReason` (Lý do bảo trì), `reservationInfo` (Thông tin người đặt), `reservedTime` (Giờ hẹn đến).

```java
package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.TableStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity đại diện cho bảng bàn ăn trong nhà hàng.
 * Tên bảng là 'restaurant_tables' để tránh trùng từ khóa hệ thống của SQL Server.
 */
@Entity
@Table(name = "restaurant_tables")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantTable {

    // Khóa chính tự tăng
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mã bàn hiển thị (ví dụ: "T-01", "B-01", "VIP-01") - Duy nhất, không được trùng
    @Column(name = "table_number", nullable = false, unique = true, length = 30)
    private String tableNumber;

    // Tên bàn hiển thị thân thiện (ví dụ: "Bàn T-01", "Ban Công 01", "Hoàng Gia")
    @Column(name = "name", length = 100)
    private String name;

    // Phân khu vực: "ZONE_1" (Sảnh chính), "ZONE_2" (Ban công), "VIP" (Phòng VIP)
    @Builder.Default
    @Column(name = "zone", nullable = false, length = 50)
    private String zone = "ZONE_1";

    // Sức chứa số lượng khách tối đa của bàn (ví dụ: 2, 4, 6, 8, 12 chỗ)
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

    // Thông tin khách đặt trước khi status = RESERVED (ví dụ: "Chị Mai (0982xxx)")
    @Column(name = "reservation_info", length = 255)
    private String reservationInfo;

    // Giờ hẹn khách đến khi status = RESERVED (ví dụ: "20:00" hoặc "Đặt lúc 20:30")
    @Column(name = "reserved_time", length = 50)
    private String reservedTime;

    // Chuỗi mã token bí mật gắn với mã QR dán trên mặt bàn
    @Column(name = "qr_token", length = 255)
    private String qrToken;

    // Bàn có đang mở kinh doanh không (true = mở, false = ẩn khỏi hệ thống)
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

---

### BƯỚC 3: MỞ RỘNG TẦNG REPOSITORY `RestaurantTableRepository.java`

- **Đường dẫn file:** `src/main/java/com/romsteam/roms/repository/RestaurantTableRepository.java`
- **Nhiệm vụ:** Bổ sung các câu truy vấn thống kê KPI và lọc bàn theo phân khu, trạng thái, từ khóa tìm kiếm.

```java
package com.romsteam.roms.repository;

import com.romsteam.roms.entity.RestaurantTable;
import com.romsteam.roms.entity.enums.TableStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {

    // Tìm bàn theo mã hiệu (ví dụ: "T-01")
    Optional<RestaurantTable> findByTableNumber(String tableNumber);

    // Kiểm tra xem mã bàn đã tồn tại chưa (tránh trùng khi thêm mới)
    boolean existsByTableNumber(String tableNumber);

    // Xác thực mã bí mật gắn trong QR Code khi khách quét bàn
    Optional<RestaurantTable> findByQrToken(String qrToken);

    // Lọc danh sách bàn theo trạng thái (AVAILABLE, OCCUPIED...)
    List<RestaurantTable> findByStatusAndIsActiveTrue(TableStatus status);

    // Lọc danh sách bàn theo phân khu (ZONE_1, ZONE_2, VIP)
    List<RestaurantTable> findByZoneAndIsActiveTrue(String zone);

    // Lọc danh sách bàn theo cả phân khu và trạng thái
    List<RestaurantTable> findByZoneAndStatusAndIsActiveTrue(String zone, TableStatus status);

    // Lấy toàn bộ bàn đang mở kinh doanh
    List<RestaurantTable> findByIsActiveTrueOrderByTableNumberAsc();

    // Tìm kiếm bàn theo từ khóa (Mã bàn hoặc Tên bàn)
    @Query("SELECT t FROM RestaurantTable t WHERE t.isActive = true AND " +
           "(LOWER(t.tableNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(t.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY t.tableNumber ASC")
    List<RestaurantTable> searchTables(@Param("keyword") String keyword);

    // ===================================================================
    // CÁC HÀM TRUY VẤN PHỤC VỤ 5 THẺ KPI THỐNG KÊ TRÊN ĐẦU TRANG
    // ===================================================================

    // Đếm số lượng bàn theo trạng thái cụ thể
    long countByStatusAndIsActiveTrue(TableStatus status);

    // Đếm tổng số bàn theo từng phân khu
    long countByZoneAndIsActiveTrue(String zone);

    // Tính tổng số chỗ ngồi (sức chứa) của toàn bộ các bàn đang hoạt động
    @Query("SELECT COALESCE(SUM(t.capacity), 0) FROM RestaurantTable t WHERE t.isActive = true")
    Integer sumTotalCapacity();
}
```

---

### BƯỚC 4: TẠO CÁC FILE DTO (DATA TRANSFER OBJECTS)

Toàn bộ các DTO được trang bị Project Lombok (`@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`).

#### 4.1. DTO Thêm bàn mới: `CreateTableRequest.java`
- **Đường dẫn file:** `src/main/java/com/romsteam/roms/dto/request/CreateTableRequest.java`

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

    // Mã bàn (ví dụ: "T-11", "VIP-04") - Bắt buộc
    @NotBlank(message = "Mã bàn không được để trống")
    private String tableNumber;

    // Tên bàn hiển thị (ví dụ: "Bàn T-11", "Sen Vàng 2")
    private String name;

    // Khu vực: "ZONE_1" (Sảnh chính), "ZONE_2" (Ban công), "VIP" (Phòng VIP)
    @NotBlank(message = "Khu vực không được để trống")
    private String zone;

    // Sức chứa khách tối thiểu 1 người
    @NotNull(message = "Sức chứa không được để trống")
    @Min(value = 1, message = "Sức chứa tối thiểu từ 1 người trở lên")
    private Integer capacity;
}
```

---

#### 4.2. DTO Cập nhật trạng thái bàn: `UpdateTableStatusRequest.java`
- **Đường dẫn file:** `src/main/java/com/romsteam/roms/dto/request/UpdateTableStatusRequest.java`

```java
package com.romsteam.roms.dto.request;

import com.romsteam.roms.entity.enums.TableStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTableStatusRequest {

    // Trạng thái mới (AVAILABLE, OCCUPIED, DIRTY, RESERVED, BLOCKED)
    @NotNull(message = "Trạng thái bàn không được để trống")
    private TableStatus status;

    // Lý do khóa bàn khi status = BLOCKED
    private String blockedReason;

    // Thông tin khách đặt khi status = RESERVED
    private String reservationInfo;

    // Giờ hẹn đến khi status = RESERVED
    private String reservedTime;

    // Số lượng khách thực tế khi chuyển sang OCCUPIED
    private Integer guestsCount;
}
```

---

#### 4.3. DTO Thống kê 5 thẻ KPI: `TableSummaryResponse.java`
- **Đường dẫn file:** `src/main/java/com/romsteam/roms/dto/response/TableSummaryResponse.java`

```java
package com.romsteam.roms.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableSummaryResponse {

    // Thẻ 1: Tổng số bàn & tổng số chỗ ngồi
    private Long totalTables;
    private Integer totalSeats;

    // Thẻ 2: Bàn đang phục vụ & số khách thực tế đang ngồi
    private Long occupiedTables;
    private Integer occupiedGuests;

    // Thẻ 3: Bàn trống sẵn sàng đón khách
    private Long availableTables;

    // Thẻ 4: Bàn đã đặt trước
    private Long reservedTables;

    // Thẻ 5: Bàn đang khóa / bảo trì
    private Long blockedTables;
}
```

---

#### 4.4. DTO Phản hồi chi tiết bàn: `TableResponse.java`
- **Đường dẫn file:** `src/main/java/com/romsteam/roms/dto/response/TableResponse.java`

```java
package com.romsteam.roms.dto.response;

import com.romsteam.roms.entity.enums.TableStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableResponse {

    private Long id;
    private String code;          // Mã bàn (tableNumber)
    private String name;          // Tên bàn hiển thị
    private String zone;          // ZONE_1, ZONE_2, VIP
    private String zoneName;      // Tầng 1 - Sảnh Chính, Tầng 2 - Ban Công, Phòng VIP
    private Integer capacity;     // Sức chứa tối đa
    private TableStatus status;   // AVAILABLE, OCCUPIED, DIRTY, RESERVED, BLOCKED
    private String statusText;    // Văn bản tiếng Việt: Đang Phục Vụ, Bàn Trống, Đã Đặt...
    
    // Thông tin vận hành thời gian thực (nếu đang OCCUPIED)
    private Integer guests;           // Số khách thực tế đang ngồi
    private BigDecimal currentBill;   // Hóa đơn hiện tại (VND)
    private String timeIn;            // Thời gian vào ngồi (ví dụ: "18:45")
    private Long activeSessionId;     // ID phiên ăn đang diễn ra

    // Thông tin nếu bàn Đã Đặt hoặc Khóa
    private String reservationInfo;
    private String reservedTime;
    private String blockedReason;

    // Mã QR Code dán tại bàn
    private String qrToken;
    private String qrUrl;         // Link ảnh hoặc link điều hướng quét QR

    private Boolean isActive;
    private LocalDateTime updatedAt;
}
```

---

### BƯỚC 5: TẦNG DỊCH VỤ NGHIỆP VỤ (SERVICE LAYER)

#### 5.1. Interface: `RestaurantTableService.java`
- **Đường dẫn file:** `src/main/java/com/romsteam/roms/service/RestaurantTableService.java`

```java
package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.CreateTableRequest;
import com.romsteam.roms.dto.request.UpdateTableStatusRequest;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.dto.response.TableSummaryResponse;
import com.romsteam.roms.entity.enums.TableStatus;

import java.util.List;

public interface RestaurantTableService {

    // 1. Lấy dữ liệu 5 thẻ KPI thống kê
    TableSummaryResponse getTableSummary();

    // 2. Lấy danh sách bàn kèm bộ lọc phân khu, trạng thái và tìm kiếm
    List<TableResponse> getTables(String zone, TableStatus status, String keyword);

    // 3. Lấy thông tin chi tiết một bàn
    TableResponse getTableById(Long id);

    // 4. Thêm bàn mới
    TableResponse createTable(CreateTableRequest request);

    // 5. Cập nhật trạng thái bàn (Khóa, Mở, Đặt chỗ, Dọn dẹp)
    TableResponse updateTableStatus(Long id, UpdateTableStatusRequest request);

    // 6. Tái tạo mã QR Token mới cho bàn
    TableResponse refreshQrToken(Long id);

    // 7. Xác thực mã QR Token khi khách quét điện thoại
    TableResponse verifyQrToken(String qrToken);

    // 8. Xóa bàn (chặn xóa nếu bàn đang có khách)
    void deleteTable(Long id);
}
```

---

#### 5.2. Triển khai logic chi tiết: `RestaurantTableServiceImpl.java`
- **Đường dẫn file:** `src/main/java/com/romsteam/roms/service/serviceImpl/RestaurantTableServiceImpl.java`
- **Nhiệm vụ:**
  - Tự động sinh `UUID` làm mã token QR bí mật.
  - Chuyển đổi mã phân khu sang tên hiển thị tiếng Việt (`ZONE_1` -> `Tầng 1 - Sảnh Chính`).
  - Liên kết với Repository `DiningSession` và `Order` để lấy số khách thực tế và hóa đơn hiện tại (`currentBill`).

```java
package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.CreateTableRequest;
import com.romsteam.roms.dto.request.UpdateTableStatusRequest;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.dto.response.TableSummaryResponse;
import com.romsteam.roms.entity.DiningSession;
import com.romsteam.roms.entity.Order;
import com.romsteam.roms.entity.RestaurantTable;
import com.romsteam.roms.entity.enums.SessionStatus;
import com.romsteam.roms.entity.enums.TableStatus;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.exception.ResourceNotFoundException;
import com.romsteam.roms.repository.DiningSessionRepository;
import com.romsteam.roms.repository.OrderRepository;
import com.romsteam.roms.repository.RestaurantTableRepository;
import com.romsteam.roms.service.RestaurantTableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RestaurantTableServiceImpl implements RestaurantTableService {

    private final RestaurantTableRepository tableRepository;
    private final DiningSessionRepository diningSessionRepository;
    private final OrderRepository orderRepository;

    // ===================================================================
    // 1. TÍNH TOÁN DỮ LIỆU 5 THẺ KPI THỐNG KÊ
    // ===================================================================
    @Override
    @Transactional(readOnly = true)
    public TableSummaryResponse getTableSummary() {
        long totalTables = tableRepository.count();
        int totalSeats = tableRepository.sumTotalCapacity();

        long occupiedTables = tableRepository.countByStatusAndIsActiveTrue(TableStatus.OCCUPIED);
        long availableTables = tableRepository.countByStatusAndIsActiveTrue(TableStatus.AVAILABLE);
        long reservedTables = tableRepository.countByStatusAndIsActiveTrue(TableStatus.RESERVED);
        long blockedTables = tableRepository.countByStatusAndIsActiveTrue(TableStatus.BLOCKED);

        // Tính tổng số khách thực tế đang ngồi từ các phiên ăn ACTIVE
        List<DiningSession> activeSessions = diningSessionRepository.findByStatus(SessionStatus.ACTIVE);
        int occupiedGuests = activeSessions.stream()
                .mapToInt(s -> s.getGuestCount() != null ? s.getGuestCount() : 0)
                .sum();

        return TableSummaryResponse.builder()
                .totalTables(totalTables)
                .totalSeats(totalSeats)
                .occupiedTables(occupiedTables)
                .occupiedGuests(occupiedGuests)
                .availableTables(availableTables)
                .reservedTables(reservedTables)
                .blockedTables(blockedTables)
                .build();
    }

    // ===================================================================
    // 2. LẤY DANH SÁCH BÀN KÈM BỘ LỌC VÀ TÌM KIẾM
    // ===================================================================
    @Override
    @Transactional(readOnly = true)
    public List<TableResponse> getTables(String zone, TableStatus status, String keyword) {
        List<RestaurantTable> tables;

        if (keyword != null && !keyword.trim().isEmpty()) {
            tables = tableRepository.searchTables(keyword.trim());
        } else if (zone != null && !zone.equalsIgnoreCase("ALL") && status != null) {
            tables = tableRepository.findByZoneAndStatusAndIsActiveTrue(zone, status);
        } else if (zone != null && !zone.equalsIgnoreCase("ALL")) {
            tables = tableRepository.findByZoneAndIsActiveTrue(zone);
        } else if (status != null) {
            tables = tableRepository.findByStatusAndIsActiveTrue(status);
        } else {
            tables = tableRepository.findByIsActiveTrueOrderByTableNumberAsc();
        }

        return tables.stream()
                .map(this::mapToTableResponse)
                .collect(Collectors.toList());
    }

    // ===================================================================
    // 3. CHI TIẾT MỘT BÀN ĂN
    // ===================================================================
    @Override
    @Transactional(readOnly = true)
    public TableResponse getTableById(Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn ăn không tồn tại với ID: " + id));
        return mapToTableResponse(table);
    }

    // ===================================================================
    // 4. THÊM BÀN ĂN MỚI
    // ===================================================================
    @Override
    @Transactional
    public TableResponse createTable(CreateTableRequest request) {
        String cleanCode = request.getTableNumber().trim().toUpperCase();

        // Kiểm tra trùng mã bàn
        if (tableRepository.existsByTableNumber(cleanCode)) {
            throw new AppException("Mã bàn '" + cleanCode + "' đã tồn tại trong hệ thống!", HttpStatus.CONFLICT);
        }

        String displayName = (request.getName() != null && !request.getName().trim().isEmpty())
                ? request.getName().trim()
                : "Bàn " + cleanCode;

        // Sinh mã bí mật QR Code ngẫu nhiên
        String generatedQrToken = "qr-" + cleanCode.toLowerCase() + "-" + UUID.randomUUID().toString().substring(0, 8);

        RestaurantTable newTable = RestaurantTable.builder()
                .tableNumber(cleanCode)
                .name(displayName)
                .zone(request.getZone())
                .capacity(request.getCapacity())
                .status(TableStatus.AVAILABLE)
                .qrToken(generatedQrToken)
                .isActive(true)
                .build();

        RestaurantTable saved = tableRepository.save(newTable);
        return mapToTableResponse(saved);
    }

    // ===================================================================
    // 5. CẬP NHẬT TRẠNG THÁI BÀN (KHÓA, MỞ, ĐẶT CHỖ, DỌN DẸP)
    // ===================================================================
    @Override
    @Transactional
    public TableResponse updateTableStatus(Long id, UpdateTableStatusRequest request) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn ăn không tồn tại với ID: " + id));

        TableStatus targetStatus = request.getStatus();

        // Không cho phép tự ý chuyển bàn OCCUPIED sang AVAILABLE nếu phiên ăn chưa kết thúc
        if (table.getStatus() == TableStatus.OCCUPIED && targetStatus == TableStatus.AVAILABLE) {
            Optional<DiningSession> activeSession = diningSessionRepository.findByTableIdAndStatus(id, SessionStatus.ACTIVE);
            if (activeSession.isPresent()) {
                throw new AppException("Bàn đang có khách ngồi ăn và chưa hoàn tất thanh toán hóa đơn!", HttpStatus.BAD_REQUEST);
            }
        }

        table.setStatus(targetStatus);

        // Xử lý các thông tin phụ thuộc theo trạng thái đích
        if (targetStatus == TableStatus.BLOCKED) {
            table.setBlockedReason(request.getBlockedReason() != null ? request.getBlockedReason() : "Bảo trì thiết bị");
            table.setReservationInfo(null);
            table.setReservedTime(null);
        } else if (targetStatus == TableStatus.RESERVED) {
            table.setReservationInfo(request.getReservationInfo());
            table.setReservedTime(request.getReservedTime() != null ? request.getReservedTime() : "Đặt lúc 19:30");
            table.setBlockedReason(null);
        } else if (targetStatus == TableStatus.AVAILABLE || targetStatus == TableStatus.DIRTY) {
            table.setBlockedReason(null);
            table.setReservationInfo(null);
            table.setReservedTime(null);
        }

        RestaurantTable updated = tableRepository.save(table);
        return mapToTableResponse(updated);
    }

    // ===================================================================
    // 6. TÁI TẠO MÃ QR CODE CHO BÀN (REFRESH TOKEN)
    // ===================================================================
    @Override
    @Transactional
    public TableResponse refreshQrToken(Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn ăn không tồn tại với ID: " + id));

        // Sinh token mới
        String newToken = "qr-" + table.getTableNumber().toLowerCase() + "-" + UUID.randomUUID().toString().substring(0, 8);
        table.setQrToken(newToken);
        RestaurantTable updated = tableRepository.save(table);
        return mapToTableResponse(updated);
    }

    // ===================================================================
    // 7. XÁC THỰC MÃ QR KHI KHÁCH QUÉT ĐIỆN THOẠI
    // ===================================================================
    @Override
    @Transactional(readOnly = true)
    public TableResponse verifyQrToken(String qrToken) {
        if (qrToken == null || qrToken.trim().isEmpty()) {
            throw new AppException("Mã QR token không hợp lệ!", HttpStatus.BAD_REQUEST);
        }

        RestaurantTable table = tableRepository.findByQrToken(qrToken.trim())
                .orElseThrow(() -> new AppException("Mã QR không đúng hoặc bàn không tồn tại!", HttpStatus.NOT_FOUND));

        if (!table.getIsActive()) {
            throw new AppException("Bàn ăn này hiện đang tạm ngưng phục vụ!", HttpStatus.FORBIDDEN);
        }

        return mapToTableResponse(table);
    }

    // ===================================================================
    // 8. XÓA BÀN ĂN
    // ===================================================================
    @Override
    @Transactional
    public void deleteTable(Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn ăn không tồn tại với ID: " + id));

        if (table.getStatus() == TableStatus.OCCUPIED) {
            throw new AppException("Không thể xóa bàn đang có khách phục vụ!", HttpStatus.CONFLICT);
        }

        // Soft-delete: đổi isActive sang false để bảo toàn lịch sử hóa đơn
        table.setIsActive(false);
        tableRepository.save(table);
    }

    // ===================================================================
    // HÀM HELPER: ÁNH XẠ ENTITY SANG DTO VÀ TÍNH TIỀN HÓA ĐƠN THỜI GIAN THỰC
    // ===================================================================
    private TableResponse mapToTableResponse(RestaurantTable table) {
        String zoneName = switch (table.getZone()) {
            case "ZONE_1" -> "Tầng 1 - Sảnh Chính";
            case "ZONE_2" -> "Tầng 2 - Ban Công";
            case "VIP" -> "Phòng VIP";
            default -> table.getZone();
        };

        String statusText = switch (table.getStatus()) {
            case AVAILABLE -> "Bàn Trống";
            case OCCUPIED -> "Đang Phục Vụ";
            case DIRTY -> "Cần Dọn";
            case RESERVED -> "Đã Đặt";
            case BLOCKED -> "Đã Khóa / Bảo Trì";
        };

        // Khởi tạo các giá trị vận hành thời gian thực
        Integer guests = 0;
        BigDecimal currentBill = BigDecimal.ZERO;
        String timeIn = null;
        Long activeSessionId = null;

        // Nếu bàn đang OCCUPIED -> tìm phiên ăn ACTIVE để lấy thông tin khách và tổng tiền
        if (table.getStatus() == TableStatus.OCCUPIED) {
            Optional<DiningSession> sessionOpt = diningSessionRepository.findByTableIdAndStatus(table.getId(), SessionStatus.ACTIVE);
            if (sessionOpt.isPresent()) {
                DiningSession session = sessionOpt.get();
                activeSessionId = session.getId();
                guests = session.getGuestCount() != null ? session.getGuestCount() : table.getCapacity();
                if (session.getStartTime() != null) {
                    timeIn = session.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm"));
                }

                // Tính tổng hóa đơn từ tất cả các đơn hàng thuộc phiên ăn này
                List<Order> orders = orderRepository.findBySessionId(session.getId());
                currentBill = orders.stream()
                        .map(Order::getTotalAmount)
                        .filter(amount -> amount != null)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            }
        }

        // Tạo URL ảnh mã QR (sử dụng API QR server chuẩn hoặc domain hệ thống)
        String qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" +
                "https://roms.restaurant/dining/welcome?table=" + table.getId() + "%26token=" + table.getQrToken();

        return TableResponse.builder()
                .id(table.getId())
                .code(table.getTableNumber())
                .name(table.getName())
                .zone(table.getZone())
                .zoneName(zoneName)
                .capacity(table.getCapacity())
                .status(table.getStatus())
                .statusText(statusText)
                .guests(guests)
                .currentBill(currentBill)
                .timeIn(timeIn)
                .activeSessionId(activeSessionId)
                .reservationInfo(table.getReservationInfo())
                .reservedTime(table.getReservedTime())
                .blockedReason(table.getBlockedReason())
                .qrToken(table.getQrToken())
                .qrUrl(qrUrl)
                .isActive(table.getIsActive())
                .updatedAt(table.getUpdatedAt())
                .build();
    }
}
```

---

### BƯỚC 6: TẦNG CONTROLLER (REST API CONTROLLERS)

#### 6.1. Controller Quản trị viên: `AdminTableController.java`
- **Đường dẫn file:** `src/main/java/com/romsteam/roms/controller/AdminTableController.java`
- **Nhiệm vụ:** Cung cấp toàn bộ các API cho màn hình Quản lý sơ đồ bàn, yêu cầu đăng nhập với quyền `MANAGER` hoặc `WAITER`.

```java
package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.CreateTableRequest;
import com.romsteam.roms.dto.request.UpdateTableStatusRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.dto.response.TableSummaryResponse;
import com.romsteam.roms.entity.enums.TableStatus;
import com.romsteam.roms.service.RestaurantTableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/tables")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'WAITER')")
public class AdminTableController {

    private final RestaurantTableService tableService;

    // 1. GET /api/admin/tables/summary - Lấy 5 thẻ chỉ số KPI
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<TableSummaryResponse>> getTableSummary() {
        TableSummaryResponse summary = tableService.getTableSummary();
        return ResponseEntity.ok(ApiResponse.success(summary, "Lấy dữ liệu thống kê bàn thành công!"));
    }

    // 2. GET /api/admin/tables - Lấy danh sách bàn kèm bộ lọc và tìm kiếm
    @GetMapping
    public ResponseEntity<ApiResponse<List<TableResponse>>> getTables(
            @RequestParam(required = false) String zone,
            @RequestParam(required = false) TableStatus status,
            @RequestParam(required = false) String search) {
        List<TableResponse> tables = tableService.getTables(zone, status, search);
        return ResponseEntity.ok(ApiResponse.success(tables, "Lấy danh sách bàn thành công!"));
    }

    // 3. GET /api/admin/tables/{id} - Lấy chi tiết 1 bàn
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TableResponse>> getTableById(@PathVariable Long id) {
        TableResponse table = tableService.getTableById(id);
        return ResponseEntity.ok(ApiResponse.success(table, "Lấy chi tiết bàn thành công!"));
    }

    // 4. POST /api/admin/tables - Thêm bàn mới (Chỉ Quản lý)
    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<TableResponse>> createTable(@Valid @RequestBody CreateTableRequest request) {
        TableResponse newTable = tableService.createTable(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(newTable, "Thêm bàn mới thành công!"));
    }

    // 5. PATCH /api/admin/tables/{id}/status - Đổi trạng thái bàn (Khóa, Mở, Đặt chỗ)
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TableResponse>> updateTableStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTableStatusRequest request) {
        TableResponse updated = tableService.updateTableStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật trạng thái bàn thành công!"));
    }

    // 6. POST /api/admin/tables/{id}/refresh-qr - Đổi mã QR mới cho bàn
    @PostMapping("/{id}/refresh-qr")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<TableResponse>> refreshQrToken(@PathVariable Long id) {
        TableResponse updated = tableService.refreshQrToken(id);
        return ResponseEntity.ok(ApiResponse.success(updated, "Đã làm mới mã QR token cho bàn thành công!"));
    }

    // 7. DELETE /api/admin/tables/{id} - Xóa bàn ăn
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteTable(@PathVariable Long id) {
        tableService.deleteTable(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa bàn ăn thành công!"));
    }
}
```

---

#### 6.2. Controller Khách hàng: `CustomerTableController.java`
- **Đường dẫn file:** `src/main/java/com/romsteam/roms/controller/CustomerTableController.java`
- **Nhiệm vụ:** API công khai (`permitAll`) cho phép thực khách quét mã QR kiểm tra bàn ăn.

```java
package com.romsteam.roms.controller;

import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.service.RestaurantTableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/customer/tables")
@RequiredArgsConstructor
public class CustomerTableController {

    private final RestaurantTableService tableService;

    // POST /api/customer/tables/verify-qr - Xác thực mã token khi khách quét QR
    @PostMapping("/verify-qr")
    public ResponseEntity<ApiResponse<TableResponse>> verifyQrToken(@RequestBody Map<String, String> request) {
        String token = request.get("qrToken");
        TableResponse table = tableService.verifyQrToken(token);
        return ResponseEntity.ok(ApiResponse.success(table, "Bàn ăn hợp lệ! Đang kết nối phiên gọi món..."));
    }
}
```

---

## 3. FILE KẾT NỐI API PHÍA FRONTEND (`tableApi.js`)

Để màn hình React gọi dữ liệu thật từ Backend, tạo file `tableApi.js` tại thư mục Frontend:
- **Đường dẫn file:** `SourceCode/frontend/src/api/tableApi.js`

```javascript
import axiosClient from './axiosClient';

export const tableApi = {
  // Lấy 5 thẻ thống kê KPI
  getSummary: () => {
    return axiosClient.get('/admin/tables/summary');
  },

  // Lấy danh sách bàn theo bộ lọc khu vực, trạng thái và tìm kiếm
  getTables: (params) => {
    return axiosClient.get('/admin/tables', { params });
  },

  // Thêm bàn mới
  createTable: (data) => {
    return axiosClient.post('/admin/tables', data);
  },

  // Cập nhật trạng thái bàn (Khóa bàn, Đặt trước, Bàn trống...)
  updateStatus: (id, data) => {
    return axiosClient.patch(`/admin/tables/${id}/status`, data);
  },

  // Làm mới mã QR Token
  refreshQr: (id) => {
    return axiosClient.post(`/admin/tables/${id}/refresh-qr`);
  },

  // Xóa bàn
  deleteTable: (id) => {
    return axiosClient.delete(`/admin/tables/${id}`);
  },

  // Khách hàng xác thực QR code
  verifyCustomerQr: (qrToken) => {
    return axiosClient.post('/customer/tables/verify-qr', { qrToken });
  }
};
```

---

## 4. SCRIPT SEED DATA SQL SERVER (TÀI KHOẢN NHÂN VIÊN & 18 BÀN ĂN)

Chạy câu lệnh SQL dưới đây trong SQL Server Management Studio (SSMS) trên database `ROMS_DB` để nạp tài khoản Quản lý (`MGR-001` / `MGR-084`, PIN: `123456`) và 18 bàn giống hệt hình ảnh giao diện:

```sql
USE ROMS_DB;
GO

-- 0. TÀI KHOẢN NHÂN VIÊN & QUẢN LÝ (Mã PIN mặc định: 123456)
IF NOT EXISTS (SELECT 1 FROM staffs WHERE username = 'MGR-001')
BEGIN
    INSERT INTO staffs (username, pin_code, full_name, phone, role, assigned_shift, is_active, is_on_shift, created_at, updated_at)
    VALUES 
    ('MGR-001', '$2a$10$S54LLsuXA..UcmPplI/1YemU5NTdvnaN40Xe9dPkCexC6gZRRY9wy', N'Dương Trọng', '0901234567', 'MANAGER', 'NONE', 1, 0, GETDATE(), GETDATE()),
    ('MGR-084', '$2a$10$S54LLsuXA..UcmPplI/1YemU5NTdvnaN40Xe9dPkCexC6gZRRY9wy', N'Trần Anh Thư', '0901234584', 'MANAGER', 'NONE', 1, 0, GETDATE(), GETDATE()),
    ('EMP-001', '$2a$10$S54LLsuXA..UcmPplI/1YemU5NTdvnaN40Xe9dPkCexC6gZRRY9wy', N'Phạm Minh Đức', '0902345678', 'WAITER', 'FULL_DAY', 1, 0, GETDATE(), GETDATE()),
    ('KDS-001', '$2a$10$S54LLsuXA..UcmPplI/1YemU5NTdvnaN40Xe9dPkCexC6gZRRY9wy', N'Ngô Viết Bảo Huy', '0903456789', 'KITCHEN', 'FULL_DAY', 1, 0, GETDATE(), GETDATE()),
    ('CSH-001', '$2a$10$S54LLsuXA..UcmPplI/1YemU5NTdvnaN40Xe9dPkCexC6gZRRY9wy', N'Đỗ Võ Thanh Trung', '0904567890', 'CASHIER', 'FULL_DAY', 1, 0, GETDATE(), GETDATE());
END
GO

-- Xóa dữ liệu cũ nếu muốn nạp lại danh sách bàn từ đầu
DELETE FROM restaurant_tables;
GO

-- 1. KHU VỰC TẦNG 1 - SẢNH CHÍNH (ZONE_1: 10 bàn)
INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, blocked_reason, reservation_info, reserved_time, qr_token, is_active, created_at, updated_at) VALUES
('T-01', N'Bàn T-01', 'ZONE_1', 4, 'OCCUPIED', NULL, NULL, NULL, 'qr-t01-token-8841', 1, GETDATE(), GETDATE()),
('T-02', N'Bàn T-02', 'ZONE_1', 2, 'AVAILABLE', NULL, NULL, NULL, 'qr-t02-token-8842', 1, GETDATE(), GETDATE()),
('T-03', N'Bàn T-03', 'ZONE_1', 4, 'OCCUPIED', NULL, NULL, NULL, 'qr-t03-token-8843', 1, GETDATE(), GETDATE()),
('T-04', N'Bàn T-04', 'ZONE_1', 6, 'RESERVED', NULL, N'Đặt lúc 20:00', '20:00', 'qr-t04-token-8844', 1, GETDATE(), GETDATE()),
('T-05', N'Bàn T-05', 'ZONE_1', 4, 'DIRTY', NULL, NULL, NULL, 'qr-t05-token-8845', 1, GETDATE(), GETDATE()),
('T-06', N'Bàn T-06', 'ZONE_1', 4, 'AVAILABLE', NULL, NULL, NULL, 'qr-t06-token-8846', 1, GETDATE(), GETDATE()),
('T-07', N'Bàn T-07', 'ZONE_1', 8, 'AVAILABLE', NULL, NULL, NULL, 'qr-t07-token-8847', 1, GETDATE(), GETDATE()),
('T-08', N'Bàn T-08', 'ZONE_1', 2, 'OCCUPIED', NULL, NULL, NULL, 'qr-t08-token-8848', 1, GETDATE(), GETDATE()),
('T-09', N'Bàn T-09', 'ZONE_1', 4, 'OCCUPIED', NULL, NULL, NULL, 'qr-t09-token-8849', 1, GETDATE(), GETDATE()),
('T-10', N'Bàn T-10', 'ZONE_1', 4, 'AVAILABLE', NULL, NULL, NULL, 'qr-t10-token-8850', 1, GETDATE(), GETDATE());

-- 2. KHU VỰC TẦNG 2 - BAN CÔNG (ZONE_2: 5 bàn)
INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, blocked_reason, reservation_info, reserved_time, qr_token, is_active, created_at, updated_at) VALUES
('B-01', N'Ban Công 01', 'ZONE_2', 4, 'OCCUPIED', NULL, NULL, NULL, 'qr-b01-token-8851', 1, GETDATE(), GETDATE()),
('B-02', N'Ban Công 02', 'ZONE_2', 4, 'AVAILABLE', NULL, NULL, NULL, 'qr-b02-token-8852', 1, GETDATE(), GETDATE()),
('B-03', N'Ban Công 03', 'ZONE_2', 2, 'BLOCKED', N'Bảo trì hệ thống đèn & thông gió', NULL, NULL, 'qr-b03-token-8853', 1, GETDATE(), GETDATE()),
('B-04', N'Ban Công 04', 'ZONE_2', 6, 'RESERVED', NULL, N'Chị Mai (0982xxx)', '20:30', 'qr-b04-token-8854', 1, GETDATE(), GETDATE()),
('B-05', N'Ban Công 05', 'ZONE_2', 4, 'OCCUPIED', NULL, NULL, NULL, 'qr-b05-token-8855', 1, GETDATE(), GETDATE());

-- 3. KHU VỰC PHÒNG VIP (VIP: 3 bàn)
INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, blocked_reason, reservation_info, reserved_time, qr_token, is_active, created_at, updated_at) VALUES
('VIP-01', N'Hoàng Gia', 'VIP', 12, 'OCCUPIED', NULL, NULL, NULL, 'qr-vip01-token-8856', 1, GETDATE(), GETDATE()),
('VIP-02', N'Thượng Uyển', 'VIP', 8, 'AVAILABLE', NULL, NULL, NULL, 'qr-vip02-token-8857', 1, GETDATE(), GETDATE()),
('VIP-03', N'Sen Vàng', 'VIP', 10, 'RESERVED', NULL, N'Anh Tuấn (0912xxx)', '21:00', 'qr-vip03-token-8858', 1, GETDATE(), GETDATE());

GO
```

---

## 5. HƯỚNG DẪN KIỂM THỬ API BẰNG CURL

### 5.1. Bước 1: Đăng nhập lấy Bearer Token
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "MGR-084", "pinCode": "123456"}'
```
*Copy chuỗi `accessToken` trả về từ JSON response.*

### 5.2. Bước 2: Gọi API lấy 5 thẻ thống kê KPI
```bash
curl -X GET http://localhost:8080/api/admin/tables/summary \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 5.3. Bước 3: Lấy danh sách bàn theo khu vực Tầng 1
```bash
curl -X GET "http://localhost:8080/api/admin/tables?zone=ZONE_1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 5.4. Bước 4: Khóa bàn bảo trì
```bash
curl -X PATCH http://localhost:8080/api/admin/tables/2/status \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "BLOCKED", "blockedReason": "Sửa chữa điều hòa"}'
```

---

## 6. BẢNG XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING)

| Hiện tượng lỗi | Nguyên nhân | Cách khắc phục |
|:---|:---|:---|
| **401 Unauthorized** khi gọi API admin bàn | Chưa truyền header `Authorization: Bearer <token>` hoặc token hết hạn. | Gọi lại API `/api/auth/login` lấy token mới và kiểm tra interceptor của Axios. |
| **403 Forbidden** khi thêm bàn mới | Tài khoản đang đăng nhập có vai trò không phải `MANAGER`. | Kiểm tra role trong database của nhân viên, chỉ `MANAGER` mới được thêm bàn. |
| **409 Conflict** khi tạo bàn mới | Số bàn (`tableNumber`) đã tồn tại trong CSDL. | Kiểm tra mã bàn nhập vào, đặt mã bàn mới không trùng lặp (ví dụ: `T-11`). |
| **Lỗi tên cột SQL `table`** | Dùng từ khóa cấm trong câu lệnh SQL thủ công. | Đảm bảo tên bảng là `restaurant_tables` theo đúng entity `@Table(name = "restaurant_tables")`. |
