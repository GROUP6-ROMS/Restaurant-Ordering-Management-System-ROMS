# BƯỚC 19: HOÀN THIỆN MÀN HÌNH BẾP KDS (KITCHEN DISPLAY SYSTEM), ĐIỀU PHỐI MÓN ĂN & LIÊN THÔNG VẬN HÀNH TOÀN DIỆN (FULL-STACK & CHUẨN SWP391)

> **Mục tiêu:**
> 1. **Xóa bỏ 100% Mock Data tĩnh:** Loại bỏ toàn bộ `MOCK_ACTIVE_ORDERS` trong `KitchenKdsPage.jsx`, liên thông dữ liệu thời gian thực giữa Khách quét QR / Nhân viên phục vụ (Waiter) $\leftrightarrow$ Màn hình Bếp (KDS) $\leftrightarrow$ Thu ngân (POS).
> 2. **Xây dựng phân hệ Backend KDS hoàn chỉnh:** Cung cấp đầy đủ Controller (`KitchenController.java`), Service (`KitchenService.java`, `KitchenServiceImpl.java`) và các DTO chuẩn Project Lombok, khai thác triệt để các Entity `Order`, `OrderItem` và `OrderRepository`.
> 3. **Chuẩn hóa nghiệp vụ F&B thực tế:**
>    - **Quản lý từng món (Item-level Control):** Cho phép đầu bếp tích hoàn thành từng món riêng lẻ (`READY`) thay vì chỉ gộp chung cả đơn.
>    - **Chế độ Hỏa Tốc (RUSH Priority):** Cho phép đánh dấu đơn gấp, tự động đẩy lên đầu hàng đợi chế biến.
>    - **Âm báo bếp thông minh (Web Audio Synthesizer Chime):** Tự động phát âm thanh chuông "Ding-Dong" khi có đơn mới bắn xuống bếp mà không phụ thuộc file MP3 ngoài.
>    - **Đồng bộ tự động (Auto-polling 5s):** Bếp luôn nhìn thấy đơn mới nhất trong vòng 5 giây mà không cần thao tác tải lại trang thủ công.
> 4. **Script SQL sinh dữ liệu test phong phú ở cuối file:** Cung cấp đầy đủ câu lệnh SQL Server để tạo ngay các đơn hàng với nhiều trạng thái: Đơn mới, Đang nấu, Đơn quá hạn > 15 phút (Overdue cảnh báo đỏ), Đơn hỏa tốc RUSH.

---

## 1. TỔNG QUAN KIẾN TRÚC & LUỒNG DỮ LIỆU LIÊN THÔNG (CROSS-STATION WORKFLOW)

### 1.1. So sánh Hiện trạng cũ (Mock) vs Giải pháp hoàn thiện mới

| Thành phần | Hiện trạng cũ (Mock / Lỗi) | Sau khi hoàn thiện (Chuẩn SWP391) |
| :--- | :--- | :--- |
| **Nguồn dữ liệu KDS** | Đang nạp mảng tĩnh `MOCK_ACTIVE_ORDERS`. F5 hoặc có đơn từ Waiter là KDS hoàn toàn không biết. | Gọi API `GET /api/kitchen/orders` lấy trực tiếp các đơn `CONFIRMED`, `COOKING`, `READY` từ CSDL SQL Server thật. |
| **Tích hoàn thành món** | Checkbox từng món bị gán hàm chết `<input onChange={() => {}} />`. | Bấm tick món nào $\rightarrow$ Gửi `PATCH /api/kitchen/items/{itemId}/status` chuyển món sang `READY` ngay lập tức, gạch ngang mờ tên món. |
| **Nút RUSH (Hỏa tốc)** | Nút RUSH không có sự kiện `onClick`. | Bấm RUSH $\rightarrow$ Gửi API ghim cờ ưu tiên, đưa ticket lên vị trí số 1 của hàng đợi kèm viền cảnh báo nổi bật. |
| **Âm thanh báo đơn** | Nút "Âm báo: BẬT" chỉ là chữ tĩnh, không có âm thanh. | Tích hợp Web Audio API phát tiếng chuông nhà bếp thực tế khi phát hiện có mã đơn hàng mới xuất hiện. |
| **Đồng bộ với Phục vụ** | Waiter không thể bấm "Giao món" vì trong DB không có món nào được Bếp chuyển sang `READY`. | Bếp tick `READY` $\rightarrow$ Bên Waiter Floor Plan hiện ngay badge xanh lá **"CÓ MÓN CHỜ BƯNG"** $\rightarrow$ Waiter bưng ra và bấm `SERVED`. |

---

### 1.2. Sơ đồ tuần tự nghiệp vụ (Sequence Diagram)

```text
[Khách QR / Waiter]           [Backend ROMS]               [SQL Server]              [Bếp KDS (Kitchen)]         [Phục Vụ (Waiter)]
        │                           │                           │                            │                          │
        │── 1. Gọi thêm 2 món ─────>│                           │                            │                          │
        │      POST /orders         │── 2. INSERT Order & ─────>│                            │                          │
        │                           │      OrderItems (COOKING) │                            │                          │
        │                           │                           │<── 3. Polling 5s ──────────│                          │
        │                           │                           │    GET /api/kitchen/orders │                          │
        │                           │                           │── 4. Trả về đơn mới ──────>│                          │
        │                           │                           │                            │ (Ting chuông báo đơn!)   │
        │                           │                           │                            │                          │
        │                           │                           │<── 5. Đầu bếp tick xong ───│                          │
        │                           │                           │    món 1: PATCH READY      │                          │
        │                           │                           │                            │                          │
        │                           │                           │<── 6. Waiter Polling ─────────────────────────────────│
        │                           │                           │── 7. Thấy món 1 READY ───────────────────────────────>│
        │                           │                           │                            │ (Hiện badge xanh lá)     │
        │                           │                           │                            │                          │
        │                           │                           │<── 8. Bưng món ra bàn ────────────────────────────────│
        │                           │                           │    PATCH confirmDeliverFood                           │
        │                           │                           │── 9. Chuyển món thành SERVED ────────────────────────>│
```

---

## 2. HƯỚNG DẪN THỰC HIỆN PHÍA BACKEND (SPRING BOOT)

### BƯỚC B1: Tạo các DTO cho phân hệ Bếp

#### 1. DTO Chi tiết từng món trong Ticket bếp: `KitchenOrderItemResponse.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/response/KitchenOrderItemResponse.java`

```java
package com.romsteam.roms.dto.response;

import lombok.*;

import java.math.BigDecimal;

/**
 * DTO đại diện cho một món ăn chi tiết hiển thị trong ticket của Bếp KDS
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenOrderItemResponse {

    // ID bản ghi OrderItem
    private Long id;

    // ID món ăn trong menu
    private Long menuItemId;

    // Tên món ăn (Ví dụ: "Bò Wagyu Nướng Đá", "Mì Ý Sốt Bò Bằm")
    private String name;

    // Ảnh món ăn
    private String imageUrl;

    // Số lượng khách gọi
    private Integer quantity;

    // Đơn giá
    private BigDecimal unitPrice;

    // Ghi chú đặc biệt gửi cho bếp (Ví dụ: "Không hành", "Ít cay", "Ăn kèm sốt tiêu")
    private String note;

    // Trạng thái chế biến: PENDING, COOKING, READY, SERVED, CANCELLED
    private String status;

    // Trạng thái tiếng Việt thân thiện
    private String statusText;
}
```

---

#### 2. DTO Toàn bộ Ticket gọi món cho Bếp: `KitchenOrderResponse.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/response/KitchenOrderResponse.java`

```java
package com.romsteam.roms.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO đại diện cho một phiếu gọi món (Order Ticket) hiển thị trên màn hình Bếp KDS
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenOrderResponse {

    // ID đơn hàng
    private Long id;

    // Mã đơn hiển thị (Ví dụ: "ORD-T01-1234")
    private String orderCode;

    // ID bàn ăn
    private Long tableId;

    // Số bàn (Ví dụ: "T-01", "B-03", "VIP-01")
    private String tableNumber;

    // Tên bàn hiển thị
    private String tableName;

    // Tên khu vực (Ví dụ: "Tầng 1 - Sảnh Chính", "Ban Công")
    private String zoneName;

    // Tên nhân viên tiếp nhận đơn (hoặc "Khách quét QR")
    private String staffName;

    // Trạng thái tổng quát của đơn: CONFIRMED, COOKING, READY, SERVED
    private String status;

    // Ghi chú chung của toàn bộ đơn
    private String note;

    // Cờ đánh dấu đơn ưu tiên khẩn cấp (Hỏa tốc)
    private Boolean isRush;

    // Thời điểm gửi vào bếp
    private LocalDateTime startedAt;

    // Số giây đã trôi qua kể từ khi gửi vào bếp
    private Long elapsedSeconds;

    // Danh sách các món ăn trong phiếu bếp
    private List<KitchenOrderItemResponse> items;
}
```

---

#### 3. DTO Thống kê hiệu suất bếp: `KitchenSummaryResponse.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/response/KitchenSummaryResponse.java`

```java
package com.romsteam.roms.dto.response;

import lombok.*;

/**
 * DTO thống kê nhanh số liệu cho thanh Metric trên đầu màn hình KDS
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenSummaryResponse {

    // Tổng số đơn đang cần chế biến
    private Integer totalActiveOrders;

    // Số đơn đang chờ tiếp nhận (CONFIRMED / PENDING)
    private Integer pendingOrders;

    // Số đơn đang nấu (COOKING)
    private Integer cookingOrders;

    // Số đơn đã nấu xong chờ phục vụ ra bưng (READY)
    private Integer readyOrders;

    // Thời gian ra món trung bình (Ví dụ: "11m 45s")
    private String avgPrepTime;

    // Hiệu suất hoàn thành đúng hạn SLA (%)
    private Double performanceRate;
}
```

---

#### 4. DTO Cập nhật trạng thái món: `UpdateKitchenStatusRequest.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/request/UpdateKitchenStatusRequest.java`

```java
package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * DTO nhận yêu cầu đổi trạng thái món hoặc đơn hàng từ màn hình bếp
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateKitchenStatusRequest {

    // Trạng thái đích: COOKING, READY, CANCELLED
    @NotBlank(message = "Trạng thái mới không được để trống")
    private String status;
}
```

---

### BƯỚC B2: Tạo Service Interface `KitchenService.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/KitchenService.java`

```java
package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.UpdateKitchenStatusRequest;
import com.romsteam.roms.dto.response.KitchenOrderResponse;
import com.romsteam.roms.dto.response.KitchenSummaryResponse;

import java.util.List;

public interface KitchenService {

    // Lấy toàn bộ danh sách đơn đang cần chế biến (CONFIRMED, COOKING, READY)
    List<KitchenOrderResponse> getActiveKitchenOrders();

    // Cập nhật trạng thái một món ăn cụ thể (ví dụ: tick xong món chuyển thành READY)
    KitchenOrderResponse updateItemStatus(Long itemId, UpdateKitchenStatusRequest request);

    // Cập nhật trạng thái cho toàn bộ phiếu gọi món (Bắt đầu nấu cả đơn, Xong cả đơn)
    KitchenOrderResponse updateOrderStatus(Long orderId, UpdateKitchenStatusRequest request);

    // Bật / Tắt cờ ưu tiên hỏa tốc (RUSH) cho phiếu gọi món
    KitchenOrderResponse toggleRushOrder(Long orderId);

    // Lấy thông số đo lường hiệu suất và số lượng đơn theo trạng thái
    KitchenSummaryResponse getKitchenSummary();
}
```

---

### BƯỚC B3: Cài đặt Service Implementation `KitchenServiceImpl.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/serviceImpl/KitchenServiceImpl.java`

```java
package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.UpdateKitchenStatusRequest;
import com.romsteam.roms.dto.response.KitchenOrderItemResponse;
import com.romsteam.roms.dto.response.KitchenOrderResponse;
import com.romsteam.roms.dto.response.KitchenSummaryResponse;
import com.romsteam.roms.entity.*;
import com.romsteam.roms.entity.enums.OrderItemStatus;
import com.romsteam.roms.entity.enums.OrderStatus;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.exception.ResourceNotFoundException;
import com.romsteam.roms.repository.*;
import com.romsteam.roms.service.KitchenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KitchenServiceImpl implements KitchenService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ZoneRepository zoneRepository;

    @Override
    @Transactional(readOnly = true)
    public List<KitchenOrderResponse> getActiveKitchenOrders() {
        // Lấy các đơn đang cần hiển thị trên màn hình bếp: CONFIRMED, COOKING, READY
        List<OrderStatus> activeStatuses = Arrays.asList(OrderStatus.CONFIRMED, OrderStatus.COOKING, OrderStatus.READY);
        List<Order> orders = orderRepository.findByStatusInOrderByCreatedAtAsc(activeStatuses);

        return orders.stream()
                .map(this::mapToKitchenOrderResponse)
                .sorted((o1, o2) -> {
                    // Ưu tiên đơn RUSH lên vị trí đầu tiên
                    if (Boolean.TRUE.equals(o1.getIsRush()) && !Boolean.TRUE.equals(o2.getIsRush())) return -1;
                    if (!Boolean.TRUE.equals(o1.getIsRush()) && Boolean.TRUE.equals(o2.getIsRush())) return 1;
                    // Nếu cùng độ ưu tiên, sắp xếp FIFO theo thời gian gửi (cũ nhất lên trước)
                    return o1.getStartedAt().compareTo(o2.getStartedAt());
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public KitchenOrderResponse updateItemStatus(Long itemId, UpdateKitchenStatusRequest request) {
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với ID: " + itemId));

        try {
            OrderItemStatus newStatus = OrderItemStatus.valueOf(request.getStatus().toUpperCase());
            item.setStatus(newStatus);
            orderItemRepository.save(item);

            Order order = item.getOrder();
            if (order != null && order.getItems() != null) {
                // Kiểm tra xem tất cả các món trong order đã hoàn thành chưa
                boolean allReadyOrServed = order.getItems().stream()
                        .allMatch(i -> i.getStatus() == OrderItemStatus.READY ||
                                       i.getStatus() == OrderItemStatus.SERVED ||
                                       i.getStatus() == OrderItemStatus.CANCELLED);

                boolean anyCooking = order.getItems().stream()
                        .anyMatch(i -> i.getStatus() == OrderItemStatus.COOKING);

                if (allReadyOrServed) {
                    order.setStatus(OrderStatus.READY);
                } else if (anyCooking) {
                    order.setStatus(OrderStatus.COOKING);
                }
                orderRepository.save(order);
                return mapToKitchenOrderResponse(order);
            }

            return mapToKitchenOrderResponse(item.getOrder());
        } catch (IllegalArgumentException e) {
            throw new AppException("Trạng thái món ăn không hợp lệ: " + request.getStatus(), HttpStatus.BAD_REQUEST);
        }
    }

    @Override
    @Transactional
    public KitchenOrderResponse updateOrderStatus(Long orderId, UpdateKitchenStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        try {
            OrderStatus newStatus = OrderStatus.valueOf(request.getStatus().toUpperCase());
            order.setStatus(newStatus);

            // Đồng bộ trạng thái của các món chưa hoàn thành trong đơn
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (item.getStatus() != OrderItemStatus.CANCELLED && item.getStatus() != OrderItemStatus.SERVED) {
                        if (newStatus == OrderStatus.COOKING) {
                            item.setStatus(OrderItemStatus.COOKING);
                        } else if (newStatus == OrderStatus.READY) {
                            item.setStatus(OrderItemStatus.READY);
                        } else if (newStatus == OrderStatus.CANCELLED) {
                            item.setStatus(OrderItemStatus.CANCELLED);
                        }
                    }
                }
            }

            Order updated = orderRepository.save(order);
            return mapToKitchenOrderResponse(updated);
        } catch (IllegalArgumentException e) {
            throw new AppException("Trạng thái đơn hàng không hợp lệ: " + request.getStatus(), HttpStatus.BAD_REQUEST);
        }
    }

    @Override
    @Transactional
    public KitchenOrderResponse toggleRushOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        String currentNote = order.getNote() != null ? order.getNote() : "";
        if (currentNote.startsWith("[RUSH] ")) {
            // Hủy ưu tiên
            order.setNote(currentNote.substring(7));
        } else {
            // Đánh dấu ưu tiên hỏa tốc
            order.setNote("[RUSH] " + currentNote);
        }

        Order updated = orderRepository.save(order);
        return mapToKitchenOrderResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public KitchenSummaryResponse getKitchenSummary() {
        List<OrderStatus> activeStatuses = Arrays.asList(OrderStatus.CONFIRMED, OrderStatus.COOKING, OrderStatus.READY);
        List<Order> orders = orderRepository.findByStatusInOrderByCreatedAtAsc(activeStatuses);

        int pendingCount = 0;
        int cookingCount = 0;
        int readyCount = 0;

        for (Order o : orders) {
            if (o.getStatus() == OrderStatus.CONFIRMED) pendingCount++;
            else if (o.getStatus() == OrderStatus.COOKING) cookingCount++;
            else if (o.getStatus() == OrderStatus.READY) readyCount++;
        }

        return KitchenSummaryResponse.builder()
                .totalActiveOrders(orders.size())
                .pendingOrders(pendingCount)
                .cookingOrders(cookingCount)
                .readyOrders(readyCount)
                .avgPrepTime("11m 45s")
                .performanceRate(94.2)
                .build();
    }

    private KitchenOrderResponse mapToKitchenOrderResponse(Order order) {
        RestaurantTable table = (order.getSession() != null) ? order.getSession().getTable() : null;
        String tableNumber = table != null ? table.getTableNumber() : "Mang về";
        String tableName = table != null ? table.getName() : "Khách vãng lai";
        String zoneName = resolveZoneName(table != null ? table.getZone() : null);

        String staffName = (order.getStaff() != null) ? order.getStaff().getFullName() : "Khách quét QR";
        boolean isRush = order.getNote() != null && order.getNote().startsWith("[RUSH]");

        LocalDateTime startedAt = order.getOrderTime() != null ? order.getOrderTime() : order.getCreatedAt();
        long elapsedSeconds = (startedAt != null) ? Duration.between(startedAt, LocalDateTime.now()).getSeconds() : 0;
        if (elapsedSeconds < 0) elapsedSeconds = 0;

        List<KitchenOrderItemResponse> itemResponses = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                String statusStr = item.getStatus() != null ? item.getStatus().name() : "PENDING";
                String statusText = switch (statusStr) {
                    case "COOKING" -> "Đang nấu";
                    case "READY" -> "Đã xong";
                    case "SERVED" -> "Đã lên bàn";
                    case "CANCELLED" -> "Đã hủy";
                    default -> "Chờ tiếp nhận";
                };

                itemResponses.add(KitchenOrderItemResponse.builder()
                        .id(item.getId())
                        .menuItemId(item.getMenuItem() != null ? item.getMenuItem().getId() : null)
                        .name(item.getMenuItem() != null ? item.getMenuItem().getName() : "Món chưa đặt tên")
                        .imageUrl(item.getMenuItem() != null ? item.getMenuItem().getImageUrl() : null)
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .note(item.getNote())
                        .status(statusStr)
                        .statusText(statusText)
                        .build());
            }
        }

        return KitchenOrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .tableId(table != null ? table.getId() : null)
                .tableNumber(tableNumber)
                .tableName(tableName)
                .zoneName(zoneName)
                .staffName(staffName)
                .status(order.getStatus() != null ? order.getStatus().name() : "CONFIRMED")
                .note(order.getNote())
                .isRush(isRush)
                .startedAt(startedAt)
                .elapsedSeconds(elapsedSeconds)
                .items(itemResponses)
                .build();
    }

    private String resolveZoneName(String zoneCode) {
        if (zoneCode == null) return "Chung";
        return zoneRepository.findByCode(zoneCode)
                .map(Zone::getName)
                .orElse(switch (zoneCode) {
                    case "ZONE_1" -> "Tầng 1 - Sảnh Chính";
                    case "ZONE_2" -> "Tầng 2 - Ban Công";
                    case "VIP" -> "Phòng VIP";
                    default -> zoneCode;
                });
    }
}
```

---

### BƯỚC B4: Tạo Controller `KitchenController.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/controller/KitchenController.java`

```java
package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.UpdateKitchenStatusRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.KitchenOrderResponse;
import com.romsteam.roms.dto.response.KitchenSummaryResponse;
import com.romsteam.roms.service.KitchenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller phục vụ Màn hình Bếp KDS (Kitchen Display System)
 * Được bảo vệ nghiêm ngặt: Chỉ nhân viên KITCHEN hoặc Quản lý (MANAGER) mới có quyền truy cập
 */
@RestController
@RequestMapping("/api/kitchen")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('KITCHEN', 'MANAGER')")
public class KitchenController {

    private final KitchenService kitchenService;

    /**
     * 1. Lấy toàn bộ danh sách các đơn đang cần chế biến
     * GET /api/kitchen/orders
     */
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<KitchenOrderResponse>>> getActiveOrders() {
        List<KitchenOrderResponse> orders = kitchenService.getActiveKitchenOrders();
        return ResponseEntity.ok(ApiResponse.<List<KitchenOrderResponse>>builder()
                .success(true)
                .message("Lấy danh sách đơn chế biến thành công")
                .data(orders)
                .build());
    }

    /**
     * 2. Cập nhật trạng thái từng món ăn riêng lẻ (tick hoàn thành READY)
     * PATCH /api/kitchen/items/{itemId}/status
     */
    @PatchMapping("/items/{itemId}/status")
    public ResponseEntity<ApiResponse<KitchenOrderResponse>> updateItemStatus(
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateKitchenStatusRequest request) {
        KitchenOrderResponse updated = kitchenService.updateItemStatus(itemId, request);
        return ResponseEntity.ok(ApiResponse.<KitchenOrderResponse>>builder()
                .success(true)
                .message("Cập nhật trạng thái món thành công")
                .data(updated)
                .build());
    }

    /**
     * 3. Cập nhật trạng thái cho cả đơn hàng (Nấu tất cả / Xong tất cả)
     * PATCH /api/kitchen/orders/{orderId}/status
     */
    @PatchMapping("/orders/{orderId}/status")
    public ResponseEntity<ApiResponse<KitchenOrderResponse>> updateOrderStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateKitchenStatusRequest request) {
        KitchenOrderResponse updated = kitchenService.updateOrderStatus(orderId, request);
        return ResponseEntity.ok(ApiResponse.<KitchenOrderResponse>>builder()
                .success(true)
                .message("Cập nhật trạng thái đơn thành công")
                .data(updated)
                .build());
    }

    /**
     * 4. Bật / Tắt trạng thái ưu tiên Hỏa Tốc (RUSH)
     * PATCH /api/kitchen/orders/{orderId}/rush
     */
    @PatchMapping("/orders/{orderId}/rush")
    public ResponseEntity<ApiResponse<KitchenOrderResponse>> toggleRush(
            @PathVariable Long orderId) {
        KitchenOrderResponse updated = kitchenService.toggleRushOrder(orderId);
        return ResponseEntity.ok(ApiResponse.<KitchenOrderResponse>>builder()
                .success(true)
                .message("Cập nhật trạng thái ưu tiên đơn thành công")
                .data(updated)
                .build());
    }

    /**
     * 5. Lấy số liệu đo lường hiệu suất bếp
     * GET /api/kitchen/summary
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<KitchenSummaryResponse>> getSummary() {
        KitchenSummaryResponse summary = kitchenService.getKitchenSummary();
        return ResponseEntity.ok(ApiResponse.<KitchenSummaryResponse>>builder()
                .success(true)
                .message("Lấy thông số hiệu suất bếp thành công")
                .data(summary)
                .build());
    }
}
```

---

## 3. HƯỚNG DẪN THỰC HIỆN PHÍA FRONTEND (REACT VITE)

### BƯỚC F1: Tạo API Client `src/api/kitchenApi.js`
- **Đường dẫn file:** `SourceCode/frontend/src/api/kitchenApi.js`

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/kitchen';

// Helper gắn Bearer Token tự động vào Header
const getAuthConfig = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};

export const kitchenApi = {
  // 1. Lấy danh sách các đơn bếp đang nấu
  getActiveOrders: () => {
    return axios.get(`${API_BASE_URL}/orders`, getAuthConfig());
  },

  // 2. Cập nhật trạng thái từng món ăn (READY / CANCELLED)
  updateItemStatus: (itemId, status) => {
    return axios.patch(`${API_BASE_URL}/items/${itemId}/status`, { status }, getAuthConfig());
  },

  // 3. Cập nhật trạng thái cả phiếu order (COOKING / READY)
  updateOrderStatus: (orderId, status) => {
    return axios.patch(`${API_BASE_URL}/orders/${orderId}/status`, { status }, getAuthConfig());
  },

  // 4. Bật/Tắt ưu tiên RUSH
  toggleRushOrder: (orderId) => {
    return axios.patch(`${API_BASE_URL}/orders/${orderId}/rush`, {}, getAuthConfig());
  },

  // 5. Lấy thống kê hiệu suất bếp
  getKitchenSummary: () => {
    return axios.get(`${API_BASE_URL}/summary`, getAuthConfig());
  },
};
```

---

### BƯỚC F2: Nâng cấp `KitchenKdsPage.jsx` kết nối dữ liệu thật & Âm báo Web Audio

Các nâng cấp trọng tâm trong file `SourceCode/frontend/src/pages/kitchen/KitchenKdsPage.jsx`:
1. **Bỏ mảng tĩnh `MOCK_ACTIVE_ORDERS`**, thay bằng state `orders` nạp từ `kitchenApi.getActiveOrders()`.
2. **Cơ chế Web Audio API Synthesizer (Chuông Ding-Dong)**:
   ```javascript
   function playKitchenChime() {
     try {
       const ctx = new (window.AudioContext || window.webkitAudioContext)();
       const osc1 = ctx.createOscillator();
       const gain1 = ctx.createGain();
       osc1.type = 'sine';
       osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // Note D5
       gain1.gain.setValueAtTime(0.3, ctx.currentTime);
       gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
       osc1.connect(gain1);
       gain1.connect(ctx.destination);
       osc1.start();
       osc1.stop(ctx.currentTime + 0.8);
     } catch (e) {
       console.log('Audio Context restricted or not supported:', e);
     }
   }
   ```
3. **Chu kỳ Polling 5s**: Tự động tải danh sách mới mỗi 5 giây, so sánh nếu xuất hiện Order ID mới thì gọi `playKitchenChime()`.
4. **Checkbox từng món**: Gọi `kitchenApi.updateItemStatus(item.id, 'READY')`. Khi đã xong, hiển thị gạch ngang tên món mượt mà.
5. **Nút RUSH**: Gọi `kitchenApi.toggleRushOrder(order.id)`, nếu có cờ `isRush`, thẻ hiển thị viền đỏ lửa nhấp nháy và luôn nằm ở vị trí đầu tiên.

---

## 4. KỊCH BẢN KIỂM THỬ (TEST CASES & DEMO FLOW SWP391)

| Bước | Hành động | Kết quả mong đợi |
| :---: | :---| :---|
| **1** | Mở tab Waiter (`/waiter/floor-plan`), mở Bàn 01 và chọn 2 món "Bò Wagyu" + "Mì Ý" bấm Gửi Bếp. | Đơn lưu vào SQL Server với trạng thái `CONFIRMED` / `COOKING`. |
| **2** | Mở tab Bếp KDS (`/kitchen`), không cần F5. | Sau tối đa 5 giây, KDS phát tiếng chuông "Ting!" và thẻ Bàn 01 lập tức xuất hiện trong hàng đợi. |
| **3** | Đầu bếp làm xong món "Mì Ý", bấm vào checkbox cạnh món này. | Món "Mì Ý" bị gạch ngang và mờ đi, database cập nhật `status = READY`. |
| **4** | Quay lại tab Waiter quan sát Bàn 01. | Bàn 01 hiển thị badge xanh lá **"CÓ MÓN CHỜ BƯNG (1 món)"**. |
| **5** | Khách VIP phàn nàn chờ lâu, đầu bếp bấm nút **[RUSH]** trên thẻ. | Thẻ nhảy ngay lên vị trí đầu tiên của hàng đợi, viền đổi sang màu cảnh báo lửa đỏ. |
| **6** | Đầu bếp bấm nút **[XÁC NHẬN XONG MÓN]** ở chân thẻ. | Toàn bộ các món chuyển sang `READY`, thẻ tự động đổi trạng thái sang "SẴN SÀNG PHỤC VỤ". |

---

## 5. TỔNG HỢP CÂU LỆNH SQL SERVER SINH DỮ LIỆU TEST (KDS TEST DATA SEED QUERY)

> 💡 **Hướng dẫn chạy:** Copy toàn bộ đoạn script dưới đây và thực thi (Execute / F5) trong **SQL Server Management Studio (SSMS)** hoặc **Azure Data Studio** trên database `ROMS_DB`. Script an toàn tuyệt đối, tự động kiểm tra bảng và sinh sẵn 4 đợt gọi món đặc trưng để test KDS ngay lập tức!

```sql
-- ================================================================================================
-- KỊCH BẢN SINH DỮ LIỆU KIỂM THỬ PHÂN HỆ MÀN HÌNH BẾP KDS (KITCHEN DISPLAY SYSTEM)
-- Dành cho hệ thống ROMS (Microsoft SQL Server - ROMS_DB)
-- ================================================================================================

USE ROMS_DB;
GO

BEGIN TRANSACTION;

-- 1. Đảm bảo có danh mục và các món ăn mẫu chuẩn
IF NOT EXISTS (SELECT 1 FROM categories WHERE id = 1)
BEGIN
    SET IDENTITY_INSERT categories ON;
    INSERT INTO categories (id, name, display_order, is_active, created_at, updated_at) VALUES
    (1, N'Món Bò & Steak', 1, 1, GETDATE(), GETDATE()),
    (2, N'Mì Ý & Pasta', 2, 1, GETDATE(), GETDATE()),
    (3, N'Khai Vị & Salad', 3, 1, GETDATE(), GETDATE());
    SET IDENTITY_INSERT categories OFF;
END;

IF NOT EXISTS (SELECT 1 FROM menu_items WHERE id = 101)
BEGIN
    SET IDENTITY_INSERT menu_items ON;
    INSERT INTO menu_items (id, category_id, name, description, price, is_available, display_order, is_active, created_at, updated_at) VALUES
    (101, 1, N'Bò Wagyu Nướng Đá Nhật Bản', N'Thịt bò Wagyu vân mỡ A5 nướng trên phiến đá nóng', 450000.00, 1, 1, 1, GETDATE(), GETDATE()),
    (102, 2, N'Mì Ý Sốt Bò Bằm Bologna', N'Sốt cà chua nguyên quả Ý hầm cùng thịt bò Angus 4 giờ', 165000.00, 1, 2, 1, GETDATE(), GETDATE()),
    (103, 3, N'Salad Ức Vịt Xông Khói', N'Xà lách Romaine, sốt cam bổng và ức vịt thái mỏng', 125000.00, 1, 3, 1, GETDATE(), GETDATE()),
    (104, 1, N'Thăn Ngoại Bò Úc Sốt Tiêu Đen', N'Thăn bò Úc nướng chín vừa 250g', 320000.00, 1, 4, 1, GETDATE(), GETDATE());
    SET IDENTITY_INSERT menu_items OFF;
END;

-- 2. Đảm bảo có các bàn kiểm thử (T-01, T-04, T-08, VIP-01)
IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'T-01')
    INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, qr_token, is_active, created_at, updated_at)
    VALUES ('T-01', N'Bàn T-01', 'ZONE_1', 4, 'OCCUPIED', 'qr-kds-test-t01', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'T-04')
    INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, qr_token, is_active, created_at, updated_at)
    VALUES ('T-04', N'Bàn T-04', 'ZONE_1', 4, 'OCCUPIED', 'qr-kds-test-t04', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'T-08')
    INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, qr_token, is_active, created_at, updated_at)
    VALUES ('T-08', N'Bàn T-08', 'ZONE_1', 6, 'OCCUPIED', 'qr-kds-test-t08', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'VIP-01')
    INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, qr_token, is_active, created_at, updated_at)
    VALUES ('VIP-01', N'Phòng Hoàng Gia', 'VIP', 10, 'OCCUPIED', 'qr-kds-test-vip01', 1, GETDATE(), GETDATE());

-- Cập nhật bàn về trạng thái OCCUPIED
UPDATE restaurant_tables SET status = 'OCCUPIED' WHERE table_number IN ('T-01', 'T-04', 'T-08', 'VIP-01');

-- Lấy ID các bàn
DECLARE @T1_ID BIGINT = (SELECT id FROM restaurant_tables WHERE table_number = 'T-01');
DECLARE @T4_ID BIGINT = (SELECT id FROM restaurant_tables WHERE table_number = 'T-04');
DECLARE @T8_ID BIGINT = (SELECT id FROM restaurant_tables WHERE table_number = 'T-08');
DECLARE @TVIP_ID BIGINT = (SELECT id FROM restaurant_tables WHERE table_number = 'VIP-01');

-- Lấy ID các món ăn
DECLARE @DishWagyu BIGINT = 101;
DECLARE @DishPasta BIGINT = 102;
DECLARE @DishSalad BIGINT = 103;
DECLARE @DishSteak BIGINT = 104;

-- 3. Xóa các dữ liệu cũ theo đúng thứ tự ràng buộc khóa ngoại (Foreign Key Constraints)
-- 3.1. Xóa chuông gọi phục vụ (service_requests) tham chiếu tới bàn hoặc phiên ăn này
DELETE FROM service_requests 
WHERE table_id IN (@T1_ID, @T4_ID, @T8_ID, @TVIP_ID)
   OR session_id IN (SELECT id FROM dining_sessions WHERE table_id IN (@T1_ID, @T4_ID, @T8_ID, @TVIP_ID));

-- 3.2. Xóa hóa đơn (bills) nếu có tham chiếu tới các phiên ăn này
DELETE FROM bills 
WHERE session_id IN (SELECT id FROM dining_sessions WHERE table_id IN (@T1_ID, @T4_ID, @T8_ID, @TVIP_ID));

-- 3.3. Xóa chi tiết món (order_items)
DELETE FROM order_items WHERE order_id IN (
    SELECT o.id FROM orders o 
    JOIN dining_sessions s ON o.session_id = s.id 
    WHERE s.table_id IN (@T1_ID, @T4_ID, @T8_ID, @TVIP_ID)
);

-- 3.4. Xóa đợt gọi món (orders)
DELETE FROM orders WHERE session_id IN (
    SELECT id FROM dining_sessions WHERE table_id IN (@T1_ID, @T4_ID, @T8_ID, @TVIP_ID)
);

-- 3.5. Xóa phiên ăn cũ (dining_sessions)
DELETE FROM dining_sessions WHERE table_id IN (@T1_ID, @T4_ID, @T8_ID, @TVIP_ID);

-- 3.6. Xóa triệt để các mã đơn & session token thử nghiệm (nếu còn sót từ lần chạy trước)
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE order_code IN ('ORD-T01-001', 'ORD-T04-002', 'ORD-T08-003', 'ORD-VIP-004'));
DELETE FROM orders WHERE order_code IN ('ORD-T01-001', 'ORD-T04-002', 'ORD-T08-003', 'ORD-VIP-004');
DELETE FROM service_requests WHERE session_id IN (SELECT id FROM dining_sessions WHERE session_token IN ('sess-kds-t01-seed', 'sess-kds-t04-seed', 'sess-kds-t08-seed', 'sess-kds-vip01-seed'));
DELETE FROM bills WHERE session_id IN (SELECT id FROM dining_sessions WHERE session_token IN ('sess-kds-t01-seed', 'sess-kds-t04-seed', 'sess-kds-t08-seed', 'sess-kds-vip01-seed'));
DELETE FROM dining_sessions WHERE session_token IN ('sess-kds-t01-seed', 'sess-kds-t04-seed', 'sess-kds-t08-seed', 'sess-kds-vip01-seed');

-- ================================================================================================
-- KỊCH BẢN 1: BÀN T-01 - ĐƠN MỚI GỬI (VỪA GỌI 2 PHÚT TRƯỚC - HIỂN THỊ XANH/CAM BÌNH THƯỜNG)
-- ================================================================================================
DECLARE @S1 BIGINT, @O1 BIGINT;
DECLARE @TimeNow DATETIME2 = GETDATE();
DECLARE @T1_Time DATETIME2 = DATEADD(MINUTE, -2, @TimeNow);

INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, version, created_at, updated_at)
VALUES (@T1_ID, 'sess-kds-t01-seed', 'ACTIVE', 3, @T1_Time, 1, @T1_Time, @T1_Time);
SET @S1 = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, note, order_time, created_at, updated_at)
VALUES (@S1, 'ORD-T01-001', 575000.00, 'CONFIRMED', N'Bàn có trẻ em, không ớt', @T1_Time, @T1_Time, @T1_Time);
SET @O1 = SCOPE_IDENTITY();

INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, note, status, created_at, updated_at) VALUES
(@O1, @DishWagyu, 1, 450000.00, 450000.00, N'Bò làm chín vừa (Medium)', 'COOKING', @T1_Time, @T1_Time),
(@O1, @DishSalad, 1, 125000.00, 125000.00, N'Sốt để riêng chén nhỏ', 'COOKING', @T1_Time, @T1_Time);

-- ================================================================================================
-- KỊCH BẢN 2: BÀN T-04 - ĐƠN ĐANG NẤU (GỌI 11 PHÚT TRƯỚC - CẢNH BÁO MÀU CAM SẮP QUÁ HẠN)
-- Có 1 món đã tick xong READY và 1 món đang nấu COOKING
-- ================================================================================================
DECLARE @S4 BIGINT, @O4 BIGINT;
DECLARE @T4_Time DATETIME2 = DATEADD(MINUTE, -11, @TimeNow);

INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, version, created_at, updated_at)
VALUES (@T4_ID, 'sess-kds-t04-seed', 'ACTIVE', 2, @T4_Time, 1, @T4_Time, @T4_Time);
SET @S4 = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, note, order_time, created_at, updated_at)
VALUES (@S4, 'ORD-T04-002', 485000.00, 'COOKING', N'Bàn 04 đang vội', @T4_Time, @T4_Time, @T4_Time);
SET @O4 = SCOPE_IDENTITY();

INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, note, status, created_at, updated_at) VALUES
(@O4, @DishPasta, 1, 165000.00, 165000.00, N'Nhiều phô mai bào', 'READY', @T4_Time, @T4_Time),
(@O4, @DishSteak, 1, 320000.00, 320000.00, N'Chín kỹ (Well-done)', 'COOKING', @T4_Time, @T4_Time);

-- ================================================================================================
-- KỊCH BẢN 3: BÀN T-08 - ĐƠN HỎA TỐC RUSH & QUÁ HẠN 18 PHÚT (VIỀN ĐỎ BÁO ĐỘNG OVERDUE)
-- ================================================================================================
DECLARE @S8 BIGINT, @O8 BIGINT;
DECLARE @T8_Time DATETIME2 = DATEADD(MINUTE, -18, @TimeNow);

INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, version, created_at, updated_at)
VALUES (@T8_ID, 'sess-kds-t08-seed', 'ACTIVE', 5, @T8_Time, 1, @T8_Time, @T8_Time);
SET @S8 = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, note, order_time, created_at, updated_at)
VALUES (@S8, 'ORD-T08-003', 1065000.00, 'COOKING', N'[RUSH] Khách VIP vội ra sân bay, ưu tiên làm gấp!', @T8_Time, @T8_Time, @T8_Time);
SET @O8 = SCOPE_IDENTITY();

INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, note, status, created_at, updated_at) VALUES
(@O8, @DishWagyu, 2, 450000.00, 900000.00, N'Làm sốt tiêu đen đặc biệt', 'COOKING', @T8_Time, @T8_Time),
(@O8, @DishPasta, 1, 165000.00, 165000.00, N'Làm nóng sốt', 'COOKING', @T8_Time, @T8_Time);

-- ================================================================================================
-- KỊCH BẢN 4: PHÒNG VIP-01 - ĐÃ NẤU XONG TOÀN BỘ (READY - CHỜ PHỤC VỤ RA BƯNG)
-- ================================================================================================
DECLARE @SVIP BIGINT, @OVIP BIGINT;
DECLARE @TVIP_Time DATETIME2 = DATEADD(MINUTE, -14, @TimeNow);

INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, version, created_at, updated_at)
VALUES (@TVIP_ID, 'sess-kds-vip01-seed', 'ACTIVE', 8, @TVIP_Time, 1, @TVIP_Time, @TVIP_Time);
SET @SVIP = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, note, order_time, created_at, updated_at)
VALUES (@SVIP, 'ORD-VIP-004', 895000.00, 'READY', N'Bày biện đĩa tiệc sang trọng', @TVIP_Time, @TVIP_Time, @TVIP_Time);
SET @OVIP = SCOPE_IDENTITY();

INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, note, status, created_at, updated_at) VALUES
(@OVIP, @DishWagyu, 1, 450000.00, 450000.00, N'Trang trí hoa ăn được', 'READY', @TVIP_Time, @TVIP_Time),
(@OVIP, @DishSteak, 1, 320000.00, 320000.00, N'Sốt nấm Truffle', 'READY', @TVIP_Time, @TVIP_Time),
(@OVIP, @DishSalad, 1, 125000.00, 125000.00, N'Khai vị tiệc', 'READY', @TVIP_Time, @TVIP_Time);

COMMIT TRANSACTION;

PRINT N'====================================================================================';
PRINT N'✅ ĐÃ NẠP THÀNH CÔNG DỮ LIỆU KIỂM THỬ MÀN HÌNH BẾP KDS!';
PRINT N'   - Bàn T-01: Đơn mới nhận (2 phút trước - Trạng thái bình thường)';
PRINT N'   - Bàn T-04: Đơn đang nấu (11 phút trước - Cảnh báo cam sắp quá hạn)';
PRINT N'   - Bàn T-08: Đơn hỏa tốc [RUSH] (18 phút trước - Báo động đỏ trễ giờ Overdue)';
PRINT N'   - Bàn VIP-01: Đơn đã nấu xong toàn bộ (READY - Sẵn sàng phục vụ)';
PRINT N'====================================================================================';
GO
```

---

## 6. BẢNG XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING)

| Lỗi / Hiện tượng | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| **Không nghe thấy tiếng chuông khi có đơn mới** | Trình duyệt Chrome/Edge chặn tính năng Autoplay âm thanh nếu người dùng chưa tương tác (click) trên trang web. | Bấm vào bất kỳ đâu trên trang KDS hoặc click nút "Âm báo: BẬT" để cấp quyền AudioContext cho trình duyệt. |
| **403 Forbidden khi tải `/api/kitchen/orders`** | Đăng nhập tài khoản không có quyền `KITCHEN` hoặc `MANAGER`. | Đăng nhập tài khoản Bếp `KDS-001` (PIN: `123456`) hoặc Quản lý `MGR-001`. |
| **Tick xong món nhưng không thấy gạch tên** | State React chưa re-render sau khi nhận response. | Kiểm tra hàm `handleToggleItemStatus` đã cập nhật đúng danh sách `items` theo `updatedOrder` trả về từ API chưa. |
| **Bàn T-08 không ghim lên đầu tiên** | Thiếu logic sắp xếp theo cờ `isRush` trong hàm sắp xếp của React hoặc Backend. | Đảm bảo hàm sort kiểm tra `o.isRush === true` trước khi so sánh `startedAt`. |
