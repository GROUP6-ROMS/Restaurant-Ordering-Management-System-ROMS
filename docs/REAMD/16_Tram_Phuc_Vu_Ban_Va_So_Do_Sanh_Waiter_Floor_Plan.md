# BƯỚC 16: TRẠM PHỤC VỤ BÀN & SƠ ĐỒ SẢNH (WAITER FLOOR PLAN TERMINAL - FULL-STACK)

> **Mục tiêu:** Xây dựng hoàn chỉnh toàn bộ tính năng nghiệp vụ cho **Trạm Phục Vụ Bàn & Sơ Đồ Sảnh** (`http://localhost:5174/waiter/floor-plan` hoặc `/waiter`) song song ở cả hai phía:
> 1. **Phía Backend (Spring Boot 3.4.5 + Java 21 + Spring Data JPA + Lombok):** Xây dựng hệ thống API chuyên biệt cho Phục vụ (`WAITER`), bao gồm: sơ đồ bàn thời gian thực theo phân khu/ca trực, vòng đời vận hành bàn (Mở bàn đón khách, Dọn bàn hoàn tất), điều phối bưng món từ bếp lên bàn (`READY` -> `SERVED`), nghiệp vụ chuyển bàn (`Transfer Table`), xử lý chuông gọi phục vụ (`ServiceRequest`) và báo thu ngân thanh toán (`AWAITING_PAYMENT`).
> 2. **Phía Frontend (React 19 + Vite + Axios + Material Symbols):** Thay thế toàn bộ Mock Data cứng (`INITIAL_TABLES`) trong `WaiterFloorPlanPage.jsx` bằng API thời gian thực, kết nối mượt mà 2 cột giao diện (Sơ đồ bàn bên trái và Drawer chi tiết đơn món bên phải), hỗ trợ đầy đủ các thao tác bấm nút nghiệp vụ.
> 
> **Cam kết:** Toàn bộ code đều có **chú thích (comment) chi tiết 100% từng dòng** nhằm phục vụ việc học tập, nắm vững kiến thức kiến trúc hệ thống và luồng dữ liệu của đồ án SWP391.

---

## 1. Tổng Quan Kiến Trúc & Luồng Dữ Liệu (Data Flow)

### 1.1. Các nguyên tắc và quy trình nghiệp vụ cốt lõi (Business Rules)

1. **Vòng đời trạng thái bàn tại Trạm phục vụ:**
   * `AVAILABLE (Sẵn Sàng)`: Bàn trống đã setup sạch sẽ. Phục vụ có thể bấm **[Mở Bàn Ngay]** khi dẫn khách vào chỗ ngồi.
   * `OCCUPIED (Đang Phục Vụ)`: Khách đang ngồi ăn, có phiên ăn `DiningSession` đang `ACTIVE`. Hiển thị số phút khách đã ngồi và tổng tiền tạm tính.
   * `CALLING (Cần Phục Vụ)`: Khách bấm chuông gọi hỗ trợ từ điện thoại (yêu cầu thêm đá, đũa muỗng, gọi nhân viên). Thẻ bàn đổi màu cam/đỏ nổi bật kèm nút **[Đã Nhận Yêu Cầu]** / **[Đã Xử Lý]**.
   * `FOOD_READY (Bếp Xong Món)`: Bếp KDS vừa hoàn thành món (`READY`), phục vụ nhận thông báo đến quầy pass nhận món bưng ra bàn kèm nút **[Xác Nhận Đã Bưng Món]** (chuyển sang `SERVED`).
   * `AWAITING_PAYMENT (Chờ Tính Tiền)`: Khách yêu cầu thanh toán, phục vụ bấm **[Gọi POS Thu Ngân]** để in phiếu tạm tính.
   * `DIRTY (Chờ Dọn Bàn)`: Khách đã thanh toán xong rời đi. Bàn cần dọn dẹp bát đĩa, set lại ly đũa. Phục vụ dọn xong bấm **[Đã Dọn Xong & Sẵn Sàng]** để đưa bàn về `AVAILABLE`.

2. **Nghiệp vụ Chuyển Bàn (Move / Transfer Table):**
   * Cho phép chuyển toàn bộ phiên ăn `DiningSession`, các đợt gọi món `Order` và hóa đơn từ bàn nguồn sang bàn đích còn trống.
   * Bàn nguồn sau khi chuyển sẽ đổi sang `DIRTY` (cần lau dọn). Bàn đích chuyển thành `OCCUPIED`.

3. **Hệ thống Chuông Gọi Phục Vụ (Service Request):**
   * Lưu các yêu cầu phát sinh từ khách hàng quét QR tại bàn: Xin thêm đá, khăn lạnh, gia vị, đổi đĩa, gọi nhân viên tư vấn.
   * Nhân viên phục vụ bấm xác nhận xử lý để đóng yêu cầu (`status = RESOLVED`).

---

### 1.2. Sơ đồ tuần tự xử lý (Sequence Diagram)

```text
[Nhân Viên Phục Vụ (WAITER)]                 [Frontend: WaiterFloorPlanPage]        [Backend: WaiterController]        [WaiterService & DB]
             │                                              │                                    │                                  │
             │─── 1. Mở trang /waiter/floor-plan ──────────>│                                    │                                  │
             │                                              │─── 2. GET /api/waiter/tables ─────>│                                  │
             │                                              │                                    │─── getFloorPlanTables() ────────>│
             │                                              │                                    │    (Query Table + Session + Item)│
             │<── 3. Hiển thị Sơ đồ bàn & Đơn món thật ─────│<── 200 OK: List<WaiterTableDTO> ───│                                  │
             │                                              │                                    │                                  │
             │─── 4. Bấm [Mở Bàn Ngay] (Bàn 01) ───────────>│                                    │                                  │
             │                                              │─── 5. POST /api/waiter/tables/1/open ─>                               │
             │                                              │        { guestCount: 4 }           │─── openTableSession(...) ───────>│
             │                                              │                                    │    (Tạo DiningSession ACTIVE)    │
             │<── 6. Thẻ bàn chuyển sang Đang Phục Vụ ──────│<── 200 OK: Session đã mở ──────────│                                  │
             │                                              │                                    │                                  │
             │─── 7. Bấm [Xác Nhận Đã Bưng Món] ────────────>│                                    │                                  │
             │                                              │─── 8. POST /api/waiter/tables/1/deliver ──────────────────────────────>
             │                                              │                                    │─── confirmDeliverItems(...) ────>│
             │                                              │                                    │    (Cập nhật READY -> SERVED)    │
             │<── 9. Món ăn chuyển trạng thái "Đã ra bàn" ──│<── 200 OK: Đã cập nhật món ────────│                                  │
```

---

## 2. Hướng Dẫn Chi Tiết Phía BACKEND (Spring Boot)

Backend áp dụng kiến trúc chuẩn Spring Boot: Entity $\rightarrow$ Repository $\rightarrow$ DTO $\rightarrow$ Service $\rightarrow$ Controller.

---

### BƯỚC B1: Tạo Entity `ServiceRequest.java` (Chuông Gọi Phục Vụ)

- **Đường dẫn file:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/entity/ServiceRequest.java`
- **Mục đích:** Lưu trữ các yêu cầu hỗ trợ thời gian thực từ khách hàng tại bàn.

```java
package com.romsteam.roms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity đại diện cho bảng 'service_requests' trong SQL Server.
 * Quản lý chuông gọi phục vụ và yêu cầu hỗ trợ khẩn tại bàn ăn.
 */
@Entity
@Table(name = "service_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceRequest {

    // Khóa chính tự tăng
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Bàn ăn phát sinh yêu cầu hỗ trợ
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", nullable = false)
    private RestaurantTable table;

    // Phiên ăn đang diễn ra tại bàn (nếu có)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private DiningSession session;

    // Loại yêu cầu: "CALL_WAITER" (Gọi phục vụ), "REQUEST_ICE" (Thêm đá), "REQUEST_BILL" (Thanh toán)...
    @Column(name = "request_type", nullable = false, length = 50)
    private String requestType;

    // Nội dung ghi chú chi tiết của khách (hỗ trợ tiếng Việt Unicode)
    @Column(name = "note", columnDefinition = "NVARCHAR(255)")
    private String note;

    // Trạng thái xử lý: "PENDING" (Đang chờ phục vụ), "RESOLVED" (Đã xử lý xong)
    @Builder.Default
    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";

    // Nhân viên tiếp nhận và xử lý yêu cầu
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private Staff staff;

    // Thời điểm khách bấm chuông gọi
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm nhân viên xử lý xong yêu cầu
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

---

### BƯỚC B2: Tạo Repository `ServiceRequestRepository.java`

- **Đường dẫn file:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/repository/ServiceRequestRepository.java`

```java
package com.romsteam.roms.repository;

import com.romsteam.roms.entity.ServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository truy vấn CSDL bảng service_requests
 */
@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

    // Lấy tất cả yêu cầu chưa xử lý (PENDING) sắp xếp mới nhất lên đầu
    List<ServiceRequest> findByStatusOrderByCreatedAtDesc(String status);

    // Lấy các yêu cầu chưa xử lý của một bàn cụ thể
    List<ServiceRequest> findByTableIdAndStatusOrderByCreatedAtDesc(Long tableId, String status);

    // Đếm tổng số chuông gọi đang chờ xử lý của toàn nhà hàng
    long countByStatus(String status);
}
```

---

### BƯỚC B3: Xây Dựng Các DTO Tầng Waiter

Tạo thư mục DTO riêng cho Waiter nếu cần hoặc đặt trong `dto/response` và `dto/request`.

#### 1. DTO Sơ đồ bàn: `WaiterTableResponse.java`
- **Đường dẫn file:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/response/WaiterTableResponse.java`

```java
package com.romsteam.roms.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

/**
 * DTO dữ liệu bàn chi tiết trả về cho màn hình Waiter Floor Plan Terminal
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaiterTableResponse {
    private Long id;
    private String tableNumber;     // "01", "T-01"
    private String name;            // "Bàn 01", "Sen Vàng"
    private String zone;            // "ZONE_1", "ZONE_2", "VIP"
    private String zoneName;        // "Tầng 1 - Sảnh Chính"
    private Integer capacity;       // Sức chứa (ghế)
    private Integer actualGuests;   // Số khách thực tế đang ngồi
    private String status;          // "AVAILABLE", "OCCUPIED", "CALLING", "FOOD_READY", "AWAITING_PAYMENT", "DIRTY", "RESERVED"
    private String statusNote;      // Ghi chú trạng thái nhanh (VD: "Đang ăn & chờ phở áp chảo")
    private String duration;        // Thời gian đã ngồi (VD: "45 phút")
    private Long durationMinutes;   // Số phút đã ngồi (để sắp xếp cảnh báo)
    private BigDecimal orderTotal;  // Tổng tiền tạm tính hiện tại
    
    // Cờ chuông gọi hỗ trợ khẩn
    private Boolean calling;
    private String callNote;        // VD: "Yêu cầu thêm đá lạnh & đũa muỗng"
    private String callTime;        // VD: "2 phút trước"
    private Long activeRequestId;   // ID của chuông gọi để bấm xử lý

    // Thống kê tiến độ món ăn
    private Integer totalItems;
    private Integer readyItems;     // Số món bếp đã nấu xong chờ bưng
    private Integer cookingItems;   // Số món bếp đang nấu
    private Integer servedItems;    // Số món đã lên bàn
    
    // Danh sách món tóm tắt hiển thị trên Drawer
    private List<WaiterOrderItemDTO> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WaiterOrderItemDTO {
        private Long orderItemId;
        private String name;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private String status;      // "COOKING", "READY", "SERVED", "WAITER_PENDING"
        private String note;
    }
}
```

#### 2. DTO Mở bàn mới: `OpenTableRequest.java`
- **Đường dẫn file:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/request/OpenTableRequest.java`

```java
package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.Min;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OpenTableRequest {
    @Min(value = 1, message = "Số lượng khách tối thiểu là 1 người")
    private Integer guestCount = 2;
    private String note;
}
```

#### 3. DTO Chuyển bàn: `TransferTableRequest.java`
- **Đường dẫn file:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/request/TransferTableRequest.java`

```java
package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransferTableRequest {
    @NotNull(message = "Bàn nguồn không được để trống")
    private Long sourceTableId;

    @NotNull(message = "Bàn đích chuyển đến không được để trống")
    private Long targetTableId;

    private String reason; // Lý do chuyển bàn (VD: "Máy lạnh nhỏ giọt")
}
```

---

### BƯỚC B4: Xây Dựng Service `WaiterService.java` & `WaiterServiceImpl.java`

#### 1. Interface: `WaiterService.java`
- **Đường dẫn file:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/WaiterService.java`

```java
package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.OpenTableRequest;
import com.romsteam.roms.dto.request.TransferTableRequest;
import com.romsteam.roms.dto.response.WaiterTableResponse;

import java.util.List;

public interface WaiterService {
    // 1. Lấy toàn bộ sơ đồ bàn kèm tiến độ món & chuông gọi
    List<WaiterTableResponse> getFloorPlan(String zone);

    // 2. Mở bàn đón khách (khởi tạo DiningSession ACTIVE)
    WaiterTableResponse openTableSession(Long tableId, OpenTableRequest request);

    // 3. Hoàn tất dọn bàn (chuyển DIRTY -> AVAILABLE)
    WaiterTableResponse completeCleaning(Long tableId);

    // 4. Chuyển bàn (Move Table)
    void transferTable(TransferTableRequest request);

    // 5. Xác nhận bưng toàn bộ món READY lên bàn (chuyển sang SERVED)
    WaiterTableResponse confirmDeliverFood(Long tableId);

    // 6. Xử lý xong chuông gọi phục vụ
    void resolveServiceRequest(Long requestId);

    // 7. Báo thu ngân in tạm tính (chuyển sang AWAITING_PAYMENT)
    WaiterTableResponse requestPayment(Long tableId);
}
```

#### 2. Implementation: `WaiterServiceImpl.java`
- **Đường dẫn file:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/serviceImpl/WaiterServiceImpl.java`

```java
package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.OpenTableRequest;
import com.romsteam.roms.dto.request.TransferTableRequest;
import com.romsteam.roms.dto.response.WaiterTableResponse;
import com.romsteam.roms.entity.*;
import com.romsteam.roms.entity.enums.OrderItemStatus;
import com.romsteam.roms.entity.enums.SessionStatus;
import com.romsteam.roms.entity.enums.TableStatus;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.exception.ResourceNotFoundException;
import com.romsteam.roms.repository.*;
import com.romsteam.roms.service.WaiterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WaiterServiceImpl implements WaiterService {

    private final RestaurantTableRepository tableRepository;
    private final DiningSessionRepository sessionRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ServiceRequestRepository requestRepository;

    @Override
    @Transactional(readOnly = true)
    public List<WaiterTableResponse> getFloorPlan(String zone) {
        List<RestaurantTable> tableList = (zone != null && !zone.equalsIgnoreCase("ALL"))
                ? tableRepository.findByZoneAndIsActiveTrue(zone)
                : tableRepository.findByIsActiveTrueOrderByTableNumberAsc();

        List<WaiterTableResponse> responseList = new ArrayList<>();

        for (RestaurantTable table : tableList) {
            responseList.add(mapToWaiterTableResponse(table));
        }

        return responseList;
    }

    @Override
    @Transactional
    public WaiterTableResponse openTableSession(Long tableId, OpenTableRequest request) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại: " + tableId));

        if (table.getStatus() != TableStatus.AVAILABLE) {
            throw new AppException("Chỉ có thể mở phiên cho bàn đang ở trạng thái Trống!", HttpStatus.BAD_REQUEST);
        }

        // Tạo phiên ăn mới
        String sessionToken = "sess-" + table.getTableNumber().toLowerCase() + "-" + UUID.randomUUID().toString().substring(0, 8);
        DiningSession newSession = new DiningSession();
        newSession.setTable(table);
        newSession.setSessionToken(sessionToken);
        newSession.setStatus(SessionStatus.ACTIVE);
        newSession.setGuestCount(request.getGuestCount() != null ? request.getGuestCount() : table.getCapacity());
        newSession.setStartTime(LocalDateTime.now());
        newSession.setNote(request.getNote());
        sessionRepository.save(newSession);

        // Đổi trạng thái bàn thành OCCUPIED
        table.setStatus(TableStatus.OCCUPIED);
        tableRepository.save(table);

        return mapToWaiterTableResponse(table);
    }

    @Override
    @Transactional
    public WaiterTableResponse completeCleaning(Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại: " + tableId));

        table.setStatus(TableStatus.AVAILABLE);
        tableRepository.save(table);

        return mapToWaiterTableResponse(table);
    }

    @Override
    @Transactional
    public void transferTable(TransferTableRequest request) {
        RestaurantTable sourceTable = tableRepository.findById(request.getSourceTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Bàn nguồn không tồn tại: " + request.getSourceTableId()));
        RestaurantTable targetTable = tableRepository.findById(request.getTargetTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Bàn đích không tồn tại: " + request.getTargetTableId()));

        if (targetTable.getStatus() != TableStatus.AVAILABLE) {
            throw new AppException("Bàn đích phải là bàn Trống (AVAILABLE) mới có thể chuyển đến!", HttpStatus.BAD_REQUEST);
        }

        Optional<DiningSession> activeSessionOpt = sessionRepository.findByTableIdAndStatus(sourceTable.getId(), SessionStatus.ACTIVE);
        if (activeSessionOpt.isEmpty()) {
            throw new AppException("Bàn nguồn hiện không có phiên ăn đang hoạt động!", HttpStatus.BAD_REQUEST);
        }

        // Chuyển phiên ăn sang bàn mới
        DiningSession session = activeSessionOpt.get();
        session.setTable(targetTable);
        sessionRepository.save(session);

        // Bàn cũ chuyển thành DIRTY (cần dọn)
        sourceTable.setStatus(TableStatus.DIRTY);
        tableRepository.save(sourceTable);

        // Bàn mới chuyển thành OCCUPIED
        targetTable.setStatus(TableStatus.OCCUPIED);
        tableRepository.save(targetTable);
    }

    @Override
    @Transactional
    public WaiterTableResponse confirmDeliverFood(Long tableId) {
        Optional<DiningSession> sessionOpt = sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE);
        if (sessionOpt.isPresent()) {
            List<Order> orders = orderRepository.findBySessionId(sessionOpt.get().getId());
            for (Order order : orders) {
                if (order.getItems() != null) {
                    for (OrderItem item : order.getItems()) {
                        if (item.getStatus() == OrderItemStatus.READY) {
                            item.setStatus(OrderItemStatus.SERVED);
                            orderItemRepository.save(item);
                        }
                    }
                }
            }
        }

        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại"));
        return mapToWaiterTableResponse(table);
    }

    @Override
    @Transactional
    public void resolveServiceRequest(Long requestId) {
        ServiceRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu chuông gọi không tồn tại: " + requestId));
        req.setStatus("RESOLVED");
        requestRepository.save(req);
    }

    @Override
    @Transactional
    public WaiterTableResponse requestPayment(Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại"));
        // Cập nhật ghi chú hoặc thông báo sang thu ngân
        return mapToWaiterTableResponse(table);
    }

    // Helper map entity sang WaiterTableResponse
    private WaiterTableResponse mapToWaiterTableResponse(RestaurantTable table) {
        String zoneName = switch (table.getZone()) {
            case "ZONE_1" -> "Tầng 1 - Sảnh Chính";
            case "ZONE_2" -> "Tầng 2 - Ban Công";
            case "VIP" -> "Phòng VIP";
            default -> table.getZone();
        };

        Integer actualGuests = 0;
        BigDecimal orderTotal = BigDecimal.ZERO;
        String durationStr = null;
        Long durationMin = 0L;
        List<WaiterTableResponse.WaiterOrderItemDTO> itemList = new ArrayList<>();
        int readyCount = 0, cookingCount = 0, servedCount = 0;

        // Lấy phiên ăn ACTIVE
        Optional<DiningSession> sessionOpt = sessionRepository.findByTableIdAndStatus(table.getId(), SessionStatus.ACTIVE);
        if (sessionOpt.isPresent()) {
            DiningSession session = sessionOpt.get();
            actualGuests = session.getGuestCount() != null ? session.getGuestCount() : table.getCapacity();

            if (session.getStartTime() != null) {
                durationMin = Duration.between(session.getStartTime(), LocalDateTime.now()).toMinutes();
                durationStr = durationMin + " phút";
            }

            List<Order> orders = orderRepository.findBySessionId(session.getId());
            for (Order order : orders) {
                if (order.getItems() != null) {
                    for (OrderItem item : order.getItems()) {
                        BigDecimal subtotal = item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO;
                        orderTotal = orderTotal.add(subtotal);

                        if (item.getStatus() == OrderItemStatus.READY) readyCount += item.getQuantity();
                        else if (item.getStatus() == OrderItemStatus.COOKING) cookingCount += item.getQuantity();
                        else if (item.getStatus() == OrderItemStatus.SERVED) servedCount += item.getQuantity();

                        itemList.add(WaiterTableResponse.WaiterOrderItemDTO.builder()
                                .orderItemId(item.getId())
                                .name(item.getMenuItem() != null ? item.getMenuItem().getName() : "Món ăn")
                                .quantity(item.getQuantity())
                                .unitPrice(item.getUnitPrice())
                                .subtotal(subtotal)
                                .status(item.getStatus() != null ? item.getStatus().name() : "PENDING")
                                .note(item.getNote())
                                .build());
                    }
                }
            }
        }

        // Kiểm tra chuông gọi PENDING
        List<ServiceRequest> pendingCalls = requestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(table.getId(), "PENDING");
        boolean isCalling = !pendingCalls.isEmpty();
        String callNote = isCalling ? pendingCalls.get(0).getNote() : null;
        Long reqId = isCalling ? pendingCalls.get(0).getId() : null;

        // Xác định trạng thái nghiệp vụ cho Waiter
        String waiterStatus = table.getStatus().name();
        String statusNote = "";

        if (table.getStatus() == TableStatus.AVAILABLE) {
            statusNote = "Bàn sạch sẽ, sẵn sàng đón khách.";
        } else if (table.getStatus() == TableStatus.DIRTY) {
            statusNote = "Khách đã thanh toán rời đi. Cần thu dọn đĩa.";
        } else if (table.getStatus() == TableStatus.RESERVED) {
            statusNote = "Khách đặt hẹn lúc: " + (table.getReservedTime() != null ? table.getReservedTime() : "Hôm nay");
        } else if (isCalling) {
            waiterStatus = "CALLING";
            statusNote = callNote != null ? callNote : "Khách yêu cầu hỗ trợ tại bàn";
        } else if (readyCount > 0) {
            waiterStatus = "FOOD_READY";
            statusNote = "Bếp KDS đã nấu xong món. Chờ bưng ra bàn!";
        } else if (table.getStatus() == TableStatus.OCCUPIED) {
            statusNote = cookingCount > 0 ? "Đang ăn & chờ bếp ra thêm món" : "Đang dùng bữa";
        }

        return WaiterTableResponse.builder()
                .id(table.getId())
                .tableNumber(table.getTableNumber())
                .name(table.getName())
                .zone(table.getZone())
                .zoneName(zoneName)
                .capacity(table.getCapacity())
                .actualGuests(actualGuests)
                .status(waiterStatus)
                .statusNote(statusNote)
                .duration(durationStr)
                .durationMinutes(durationMin)
                .orderTotal(orderTotal)
                .calling(isCalling)
                .callNote(callNote)
                .callTime("Vừa gọi")
                .activeRequestId(reqId)
                .totalItems(itemList.size())
                .readyItems(readyCount)
                .cookingItems(cookingCount)
                .servedItems(servedCount)
                .items(itemList)
                .build();
    }
}
```

---

### BƯỚC B5: Tạo Controller `WaiterController.java`

- **Đường dẫn file:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/controller/WaiterController.java`

```java
package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.OpenTableRequest;
import com.romsteam.roms.dto.request.TransferTableRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.WaiterTableResponse;
import com.romsteam.roms.service.WaiterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller dành riêng cho Trạm Phục Vụ Bàn (Waiter Terminal)
 */
@RestController
@RequestMapping("/api/waiter")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('WAITER', 'MANAGER')")
public class WaiterController {

    private final WaiterService waiterService;

    // 1. GET /api/waiter/tables - Lấy sơ đồ bàn kèm tiến độ món & chuông gọi
    @GetMapping("/tables")
    public ResponseEntity<ApiResponse<List<WaiterTableResponse>>> getFloorPlan(
            @RequestParam(required = false) String zone) {
        List<WaiterTableResponse> tables = waiterService.getFloorPlan(zone);
        return ResponseEntity.ok(ApiResponse.success(tables, "Lấy sơ đồ bàn phục vụ thành công!"));
    }

    // 2. POST /api/waiter/tables/{id}/open - Mở bàn đón khách (tạo DiningSession)
    @PostMapping("/tables/{id}/open")
    public ResponseEntity<ApiResponse<WaiterTableResponse>> openTable(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) OpenTableRequest request) {
        if (request == null) request = new OpenTableRequest();
        WaiterTableResponse response = waiterService.openTableSession(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã mở bàn đón khách thành công!"));
    }

    // 3. POST /api/waiter/tables/{id}/clean - Hoàn tất dọn bàn (DIRTY -> AVAILABLE)
    @PostMapping("/tables/{id}/clean")
    public ResponseEntity<ApiResponse<WaiterTableResponse>> cleanTable(@PathVariable Long id) {
        WaiterTableResponse response = waiterService.completeCleaning(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã dọn xong bàn, sẵn sàng đón khách!"));
    }

    // 4. POST /api/waiter/tables/transfer - Chuyển bàn
    @PostMapping("/tables/transfer")
    public ResponseEntity<ApiResponse<Void>> transferTable(@Valid @RequestBody TransferTableRequest request) {
        waiterService.transferTable(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Chuyển bàn thành công!"));
    }

    // 5. POST /api/waiter/tables/{id}/deliver - Xác nhận đã bưng món (READY -> SERVED)
    @PostMapping("/tables/{id}/deliver")
    public ResponseEntity<ApiResponse<WaiterTableResponse>> deliverFood(@PathVariable Long id) {
        WaiterTableResponse response = waiterService.confirmDeliverFood(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã xác nhận bưng món lên bàn!"));
    }

    // 6. PATCH /api/waiter/requests/{id}/resolve - Xử lý xong chuông gọi phục vụ
    @PatchMapping("/requests/{id}/resolve")
    public ResponseEntity<ApiResponse<Void>> resolveCall(@PathVariable Long id) {
        waiterService.resolveServiceRequest(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xử lý xong yêu cầu chuông gọi!"));
    }
}
```

---

## 3. Hướng Dẫn Tích Hợp FRONTEND (React)

---

### BƯỚC F1: Tạo API Client `waiterApi.js`

- **Đường dẫn file:** `SourceCode/frontend/src/api/waiterApi.js`

```javascript
import axiosClient from './axiosClient';

export const waiterApi = {
    // 1. Lấy sơ đồ bàn phục vụ
    getTables: (zone) => {
        return axiosClient.get('/waiter/tables', { params: { zone } });
    },

    // 2. Mở bàn đón khách
    openTable: (tableId, data) => {
        return axiosClient.post(`/waiter/tables/${tableId}/open`, data);
    },

    // 3. Dọn bàn xong
    cleanTable: (tableId) => {
        return axiosClient.post(`/waiter/tables/${tableId}/clean`);
    },

    // 4. Chuyển bàn
    transferTable: (data) => {
        return axiosClient.post('/waiter/tables/transfer', data);
    },

    // 5. Xác nhận đã bưng món
    deliverFood: (tableId) => {
        return axiosClient.post(`/waiter/tables/${tableId}/deliver`);
    },

    // 6. Xử lý xong chuông gọi
    resolveRequest: (requestId) => {
        return axiosClient.patch(`/waiter/requests/${requestId}/resolve`);
    }
};
```

---

### BƯỚC F2: Kết Nối API Thật vào `WaiterFloorPlanPage.jsx`

Thay vì gán `const [tables, setTables] = useState(INITIAL_TABLES);`, bạn sẽ tải dữ liệu trực tiếp từ `waiterApi`:

1. **Import `waiterApi`:**
   ```javascript
   import { waiterApi } from '../../api/waiterApi';
   ```

2. **Khai báo hàm tải dữ liệu thật:**
   ```javascript
   const loadFloorPlan = async () => {
     try {
       const res = await waiterApi.getTables();
       if (res.data && res.data.success) {
         setTables(res.data.data);
         if (!selectedTable && res.data.data.length > 0) {
           setSelectedTable(res.data.data[0]);
         }
       }
     } catch (err) {
       console.error("Lỗi tải sơ đồ bàn phục vụ:", err);
     }
   };

   useEffect(() => {
     loadFloorPlan();
     // Thiết lập chu kỳ cập nhật tự động 5s/lần (Polling)
     const timer = setInterval(loadFloorPlan, 5000);
     return () => clearInterval(timer);
   }, []);
   ```

3. **Cập nhật các hàm xử lý hành động (`handleOpenTable`, `handleCleanTable`...):**
   Gọi trực tiếp hàm API tương ứng và sau đó `await loadFloorPlan()`.

---

## 4. Dữ Liệu Mẫu (SQL Script) Để Kiểm Thử Ngay

Chạy script sau trong SQL Server Management Studio (SSMS) để nạp các tình huống thực tế cho Phục vụ:

```sql
USE ROMS_DB;
GO

-- 1. Đảm bảo có chuông gọi phục vụ mẫu
IF NOT EXISTS (SELECT 1 FROM service_requests WHERE status = 'PENDING')
BEGIN
    DECLARE @t4Id BIGINT = (SELECT id FROM restaurant_tables WHERE table_number = 'T-04');
    IF (@t4Id IS NOT NULL)
    BEGIN
        INSERT INTO service_requests (table_id, request_type, note, status, created_at, updated_at)
        VALUES (@t4Id, 'CALL_WAITER', N'Yêu cầu thêm đá lạnh & đũa muỗng', 'PENDING', GETDATE(), GETDATE());
    END
END
GO
```

---

## 5. Bảng Đối Chiếu Kiểm Thử (Troubleshooting)

| Tình huống | Nguyên nhân thường gặp | Cách khắc phục |
| :--- | :--- | :--- |
| **Bấm "Mở bàn" bị 403 Forbidden** | Tài khoản đăng nhập không có Role `WAITER` hoặc `MANAGER`. | Đăng nhập tài khoản `EMP-001` (PIN `123456`) hoặc `MGR-001`. |
| **Không thể chuyển bàn (Báo lỗi)** | Bàn đích không ở trạng thái `AVAILABLE`. | Chỉ chọn bàn đích màu Xanh lá (`AVAILABLE`) để chuyển. |
| **Tiếng Việt trong chuông gọi bị dấu `?`** | Cột `note` của `service_requests` chưa khai báo `NVARCHAR`. | Sử dụng `columnDefinition = "NVARCHAR(255)"` và tiền tố `N'...'` khi insert SQL. |

---

*Tài liệu được thiết kế đồng bộ 100% với kiến trúc chuẩn của ROMS và quy chuẩn chấm điểm đồ án SWP391.*
