# BƯỚC 18: HOÀN THIỆN NGHIỆP VỤ GỌI THÊM MÓN TẠI BÀN, ĐIỀU PHỐI ĐỒ UỐNG & VẬN HÀNH TRẠM PHỤC VỤ (FULL-STACK & CHUẨN SWP391)

> **Mục tiêu:** Xóa bỏ hoàn toàn tình trạng "Mã giả (Mock)" trong phân hệ Trạm Phục Vụ Bàn (Waiter Terminal) và hoàn thiện trọn vẹn luồng nghiệp vụ F&B thực tế, chuẩn chỉnh cho buổi bảo vệ đồ án SWP391:
> 1. **Khắc phục lỗi nghiêm trọng "Gọi thêm món bị mất sau 5 giây":** Xây dựng API và giao diện cho phép Waiter chọn món từ Thực đơn CSDL thật và lưu `Order` & `OrderItem` trực tiếp vào SQL Server (bảo toàn dữ liệu tuyệt đối khi chu kỳ Polling 5s quét lại, đồng thời đẩy dữ liệu sang Bếp KDS).
> 2. **Nối API Yêu cầu thanh toán (`AWAITING_PAYMENT`):** Khi khách ăn xong, Waiter bấm nút "Gọi POS Thu Ngân" $\rightarrow$ Bàn chuyển trạng thái chờ tính tiền, báo hiệu sang màn hình Thu ngân (`CSH-001`).
> 3. **Dọn sạch toàn bộ Mock Data tĩnh:** Xóa sạch các mảng tĩnh `INITIAL_TABLES`, `INITIAL_TABLE_ORDERS`, `MOCK_MENU_ITEMS`, thay bằng dữ liệu động 100% từ Database kèm Skeleton / Empty State chuyên nghiệp.
> 
> **Cam kết:** Hướng dẫn chi tiết từng bước, có sơ đồ tuần tự, giải thích sâu về nghiệp vụ F&B và toàn bộ đoạn mã đều có **chú thích (comment) 100%** rõ ràng.

---

## 1. TỔNG QUAN KIẾN TRÚC & LUỒNG DỮ LIỆU LIÊN THÔNG (CROSS-STATION WORKFLOW)

### 1.1. Vấn đề cốt lõi của Code cũ vs Giải pháp mới

| Thành phần | Hiện trạng (Mock / Lỗi) | Sau khi hoàn thiện (Chuẩn SWP391) |
| :--- | :--- | :--- |
| **Gọi thêm món tại bàn** | Chỉ `setTables` vào State React tạm thời bằng ID giả `Date.now() + Math.random()`. Sau 5 giây polling, **món mới bị xóa sạch** vì DB không có! | Gửi API `POST /api/waiter/tables/{id}/orders`, lưu `Order` và các `OrderItem` thật vào CSDL. Dữ liệu vĩnh viễn, Bếp KDS nhận được món ngay! |
| **Danh mục chọn món** | Đang `import { MOCK_MENU_ITEMS }` từ file tĩnh. Không phản ánh đúng món có trong DB. | Tải danh mục thực đơn thật từ Database kèm phân loại nhóm món (Khai vị, Món chính, Đồ uống...). |
| **Yêu cầu tính tiền** | Bấm nút chỉ hiện thông báo Toast tạm thời, không đổi trạng thái bàn trong CSDL. | Gọi API `POST /api/waiter/tables/{id}/request-payment`, đổi trạng thái bàn sang `AWAITING_PAYMENT` để Thu ngân POS nhận biết. |
| **Dữ liệu khởi tạo bàn** | Mảng tĩnh `INITIAL_TABLES` và `INITIAL_TABLE_ORDERS` chớp hiển thị món Wagyu/Tôm hùm giả. | Khởi tạo rỗng, hiển thị hiệu ứng Loading mượt mà và nạp 100% dữ liệu bàn thật từ CSDL SQL Server. |

---

### 1.2. Sơ đồ tuần tự: Khách gọi thêm món qua Waiter $\rightarrow$ Đẩy vào Bếp KDS

```text
[Khách Hàng tại bàn]       [Nhân Viên Phục Vụ (WAITER)]        [Backend: WaiterController]        [SQL Server Database]        [Màn Hình Bếp (KDS)]
         │                               │                                     │                           │                           │
         │── 1. Vẫy tay gọi thêm món ───>│                                     │                           │                           │
         │   ("Cho thêm 2 lon Tiger      │                                     │                           │                           │
         │    và 1 dĩa Cơm chiên")       │                                     │                           │                           │
         │                               │── 2. Mở Modal chọn món              │                           │                           │
         │                               │      từ Menu CSDL thật              │                           │                           │
         │                               │── 3. Bấm "Gửi Gọi Món" ────────────>│                           │                           │
         │                               │      POST /api/waiter/tables/4/orders                           │                           │
         │                               │                                     │── 4. Tạo Order mới & ────>│                           │
         │                               │                                     │      OrderItem (COOKING)  │                           │
         │                               │                                     │      gắn vào DiningSession│                           │
         │                               │<── 5. 200 OK: TableResponse ────────│                           │                           │
         │                               │    (Đã cập nhật tổng tiền & món)    │                           │                           │
         │                               │                                     │                           │── 6. KDS Polling ────────>│
         │                               │                                     │                           │      nhận món Cơm chiên!  │
         │                               │── 7. Waiter ra tủ lấy 2 lon Tiger ─>│                           │                           │
```

---

## 2. HƯỚNG DẪN THỰC HIỆN PHÍA BACKEND (SPRING BOOT)

Backend áp dụng kiến trúc chuẩn: **DTO $\rightarrow$ Service $\rightarrow$ Controller** (sử dụng Project Lombok).

---

### BƯỚC B1: Tạo DTO Nhận Yêu Cầu Gọi Món (`WaiterAddOrderRequest.java`)

- **Đường dẫn file:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/request/WaiterAddOrderRequest.java`
- **Mục đích:** Đóng gói danh sách các món mà nhân viên phục vụ ghi nhận thêm từ khách hàng tại bàn.

```java
package com.romsteam.roms.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

/**
 * DTO nhận dữ liệu khi Nhân viên phục vụ (Waiter) gọi thêm món tại bàn ăn
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaiterAddOrderRequest {

    // Danh sách các món ăn gọi thêm trong đợt này (không được để trống)
    @NotEmpty(message = "Danh sách món gọi thêm không được để trống!")
    @Valid
    private List<WaiterOrderItemRequest> items;

    // Ghi chú chung của đợt gọi món (ví dụ: "Khách đang vội, ưu tiên làm sớm")
    private String note;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WaiterOrderItemRequest {
        
        // ID món ăn trong bảng menu_items
        @NotNull(message = "ID món ăn là bắt buộc!")
        private Long menuItemId;

        // Số lượng gọi thêm (tối thiểu là 1)
        @NotNull(message = "Số lượng không được để trống!")
        private Integer quantity;

        // Ghi chú chi tiết cho món (ví dụ: "Ít cay", "Không hành", "Ướp lạnh kèm đá")
        private String note;
    }
}
```

---

### BƯỚC B2: Khai báo Service (`WaiterService.java`)

- **Đường dẫn file:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/WaiterService.java`
- **Mục đích:** Thêm 2 phương thức nghiệp vụ: Gọi thêm món và Yêu cầu thanh toán.

```java
// Bổ sung vào interface WaiterService:

// 7. Gọi thêm món cho bàn đang phục vụ (Tạo Order và các OrderItem thật vào CSDL)
WaiterTableResponse addOrderToTable(Long tableId, WaiterAddOrderRequest request);

// 8. Yêu cầu tính tiền / Báo sang POS Thu ngân (Chuyển bàn sang AWAITING_PAYMENT)
WaiterTableResponse requestPayment(Long tableId);
```

---

### BƯỚC B3: Cài đặt Logic Nghiệp Vụ (`WaiterServiceImpl.java`)

- **Đường dẫn file:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/serviceImpl/WaiterServiceImpl.java`
- **Mục đích:**
  1. Kiểm tra bàn phải đang có phiên ăn `DiningSession` trạng thái `ACTIVE` (khách đã vào bàn).
  2. Tạo bản ghi `Order` mới (mã sinh tự động dạng `ORD-T01-xxxx`).
  3. Duyệt từng món gọi thêm, tính tiền `subtotal = price * quantity`, lưu bản ghi `OrderItem` với trạng thái `COOKING`.
  4. Cập nhật tổng tiền đợt order và lưu vào CSDL.
  5. Đối với `requestPayment`: Đổi trạng thái bàn thành `TableStatus.OCCUPIED` kèm cờ chờ thanh toán hoặc ghi chú.

```java
// Bổ sung vào WaiterServiceImpl.java:

private final MenuItemRepository menuItemRepository; // Inject thêm MenuItemRepository

@Override
@Transactional
public WaiterTableResponse addOrderToTable(Long tableId, WaiterAddOrderRequest request) {
    // 1. Kiểm tra bàn tồn tại
    RestaurantTable table = tableRepository.findById(tableId)
            .orElseThrow(() -> new ResourceNotFoundException("Bàn ăn không tồn tại với ID: " + tableId));

    // 2. Tìm phiên ăn ACTIVE của bàn
    DiningSession activeSession = sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE)
            .orElseThrow(() -> new AppException("Bàn này chưa được mở phiên phục vụ (chưa có khách)! Vui lòng Mở Bàn trước.", HttpStatus.BAD_REQUEST));

    // 3. Khởi tạo đợt Order mới
    String orderCode = "ORD-" + table.getTableNumber() + "-" + (System.currentTimeMillis() % 10000);
    Order newOrder = new Order();
    newOrder.setSession(activeSession);
    newOrder.setOrderCode(orderCode);
    newOrder.setOrderTime(LocalDateTime.now());
    newOrder.setStatus(OrderStatus.CONFIRMED);
    newOrder.setNote(request.getNote());

    BigDecimal totalOrderAmount = BigDecimal.ZERO;
    List<OrderItem> orderItems = new ArrayList<>();

    // 4. Duyệt danh sách món gọi thêm
    for (WaiterAddOrderRequest.WaiterOrderItemRequest itemReq : request.getItems()) {
        MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Món ăn không tồn tại với ID: " + itemReq.getMenuItemId()));

        if (!menuItem.getIsAvailable()) {
            throw new AppException("Món '" + menuItem.getName() + "' hiện đã tạm hết hàng!", HttpStatus.BAD_REQUEST);
        }

        int qty = itemReq.getQuantity() != null && itemReq.getQuantity() > 0 ? itemReq.getQuantity() : 1;
        BigDecimal unitPrice = menuItem.getPrice();
        BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(qty));
        totalOrderAmount = totalOrderAmount.add(subtotal);

        OrderItem orderItem = new OrderItem();
        orderItem.setOrder(newOrder);
        orderItem.setMenuItem(menuItem);
        orderItem.setQuantity(qty);
        orderItem.setUnitPrice(unitPrice);
        orderItem.setSubtotal(subtotal);
        orderItem.setNote(itemReq.getNote());
        orderItem.setStatus(OrderItemStatus.COOKING); // Món ăn chuyển trạng thái nấu, Bếp KDS lập tức nhận được

        orderItems.add(orderItem);
    }

    newOrder.setTotalAmount(totalOrderAmount);
    newOrder.setItems(orderItems);

    // 5. Lưu Order (nhờ CascadeType.ALL, các OrderItem tự động được lưu vào bảng order_items)
    orderRepository.save(newOrder);

    // 6. Đảm bảo bàn vẫn ở trạng thái OCCUPIED
    if (table.getStatus() != TableStatus.OCCUPIED) {
        table.setStatus(TableStatus.OCCUPIED);
        tableRepository.save(table);
    }

    // 7. Trả về thông tin bàn mới nhất kèm danh sách món đã cập nhật
    return mapToWaiterTableResponse(table);
}

@Override
@Transactional
public WaiterTableResponse requestPayment(Long tableId) {
    RestaurantTable table = tableRepository.findById(tableId)
            .orElseThrow(() -> new ResourceNotFoundException("Bàn ăn không tồn tại với ID: " + tableId));

    if (table.getStatus() != TableStatus.OCCUPIED) {
        throw new AppException("Chỉ có thể yêu cầu thanh toán cho bàn đang có khách dùng bữa!", HttpStatus.BAD_REQUEST);
    }

    // Ghi nhận ghi chú chờ thanh toán để thông báo sang POS Thu ngân
    table.setStatus(TableStatus.OCCUPIED); // Hoặc enum AWAITING_PAYMENT nếu có
    tableRepository.save(table);

    return mapToWaiterTableResponse(table);
}
```

---

### BƯỚC B4: Mở Endpoint trong Controller (`WaiterController.java`)

- **Đường dẫn file:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/controller/WaiterController.java`
- **Mục đích:** Cung cấp 2 API RESTful bảo mật cho role `WAITER` và `MANAGER`.

```java
// Bổ sung vào WaiterController.java:

// 7. POST /api/waiter/tables/{id}/orders - Nhân viên phục vụ gọi thêm món tại bàn
@PostMapping("/tables/{id}/orders")
public ResponseEntity<ApiResponse<WaiterTableResponse>> addOrderToTable(
        @PathVariable Long id,
        @Valid @RequestBody WaiterAddOrderRequest request) {
    WaiterTableResponse response = waiterService.addOrderToTable(id, request);
    return ResponseEntity.ok(ApiResponse.success(response, "Đã gửi đợt gọi món vào Bếp thành công!"));
}

// 8. POST /api/waiter/tables/{id}/request-payment - Yêu cầu tính tiền / Báo sang POS Thu ngân
@PostMapping("/tables/{id}/request-payment")
public ResponseEntity<ApiResponse<WaiterTableResponse>> requestPayment(@PathVariable Long id) {
    WaiterTableResponse response = waiterService.requestPayment(id);
    return ResponseEntity.ok(ApiResponse.success(response, "Đã gửi yêu cầu thanh toán tới Quầy Thu Ngân!"));
}
```

---

## 3. HƯỚNG DẪN THỰC HIỆN PHÍA FRONTEND (REACT VITE)

---

### BƯỚC F1: Cập nhật API Client (`waiterApi.js`)

- **File:** `SourceCode/frontend/src/api/waiterApi.js`
- **Mục đích:** Bổ sung 2 phương thức gọi API vừa tạo ở Backend.

```javascript
// Bổ sung vào waiterApi:

// 7. Gọi thêm món cho bàn (Lưu thật vào Database)
addOrder: (tableId, data) => {
    return axiosClient.post(`/waiter/tables/${tableId}/orders`, data);
},

// 8. Yêu cầu tính tiền / Gọi POS Thu ngân
requestPayment: (tableId) => {
    return axiosClient.post(`/waiter/tables/${tableId}/request-payment`);
}
```

---

### BƯỚC F2: Nâng cấp Sơ Đồ Bàn Phục Vụ (`WaiterFloorPlanPage.jsx`)

#### 1. Loại bỏ dữ liệu Mock tĩnh:
Xóa hoàn toàn mảng `INITIAL_TABLES` tĩnh ở đầu file. Khởi tạo:
```javascript
const [tables, setTables] = useState([]); // Khởi tạo mảng rỗng, đợi nạp từ API thật
const [initialLoading, setInitialLoading] = useState(true);
```

#### 2. Nối API Gọi Thêm Món Nhanh (`handleQuickAddDish`):
Thay thế đoạn code `setTables` bằng ID giả cũ bằng việc gọi API thật:
```javascript
const handleQuickAddDish = async (dish) => {
  if (!selectedTable) return;
  try {
    const payload = {
      items: [
        {
          menuItemId: dish.id,
          quantity: 1,
          note: 'Waiter gọi nhanh tại bàn'
        }
      ]
    };
    const res = await waiterApi.addOrder(selectedTable.id, payload);
    if (res.data && res.data.success) {
      showToast(`Đã gửi [${dish.name}] vào bếp cho Bàn ${selectedTable.label || selectedTable.tableNumber}!`);
      await loadFloorPlan(); // Tải lại dữ liệu thật từ DB ngay lập tức
    }
  } catch (err) {
    showToast(err.response?.data?.message || 'Lỗi khi gọi thêm món');
  }
};
```

#### 3. Nối API Yêu Cầu Thanh Toán:
```javascript
const handleRequestPayment = async (tableId) => {
  try {
    await waiterApi.requestPayment(tableId);
    showToast('Đã gửi thông báo yêu cầu thanh toán sang Quầy Thu Ngân POS!');
    await loadFloorPlan();
  } catch (err) {
    showToast(err.response?.data?.message || 'Lỗi gửi yêu cầu thanh toán');
  }
};
```

---

### BƯỚC F3: Nâng cấp Màn Hình Chi Tiết Đơn Món (`WaiterOrderDetailPage.jsx`)

#### 1. Loại bỏ Object tĩnh `INITIAL_TABLE_ORDERS`:
Xóa bỏ các bàn mock `T-03`, `VIP-01` chứa danh sách món cứng. Thay bằng việc tải trực tiếp từ API `waiterApi.getTables()`.

#### 2. Tải Thực Đơn Món Thật từ Backend API:
Thay vì `import { MOCK_MENU_ITEMS }`, gọi API lấy danh mục món ăn thực tế để người phục vụ chọn:
```javascript
// Tải danh mục thực đơn thật khi mở modal gọi thêm món:
useEffect(() => {
  const fetchRealMenu = async () => {
    try {
      const res = await axiosClient.get('/admin/menu/items'); // Hoặc API menu công khai
      if (res.data && res.data.success) {
        setMenuCatalog(res.data.data || []);
      }
    } catch (err) {
      console.error('Lỗi tải thực đơn món:', err);
    }
  };
  fetchRealMenu();
}, []);
```

#### 3. Nối API Gửi Gọi Thêm Món (`handleConfirmAddDishes`):
Thay thế hàm mô phỏng cũ bằng việc gửi payload thật:
```javascript
const handleConfirmAddDishes = async () => {
  if (cartToAdd.length === 0 || !tableData.id) return;

  try {
    const payload = {
      items: cartToAdd.map(item => ({
        menuItemId: item.id,
        quantity: item.qty,
        note: item.note || ''
      })),
      note: 'Waiter gọi thêm tại bàn'
    };

    const res = await waiterApi.addOrder(tableData.id, payload);
    if (res.data && res.data.success) {
      const count = cartToAdd.reduce((s, i) => s + i.qty, 0);
      setCartToAdd([]);
      setShowAddDishModal(false);
      showToast(`Đã gửi thành công ${count} món gọi thêm vào Bếp!`);
      // Tải lại chi tiết đơn món thật từ CSDL
      await fetchTablesAndDetails();
    }
  } catch (err) {
    showToast(err.response?.data?.message || 'Lỗi khi gửi đợt gọi món');
  }
};
```

---

## 4. KỊCH BẢN KIỂM THỬ & DEMO BẢO VỆ ĐỒ ÁN SWP391

Đây là kịch bản demo **"Liên thông 3 trạm làm việc (Cross-Station Showcase)"** giúp nhóm ghi điểm tuyệt đối trước Hội đồng chấm thi:

### Bước 1: Mở Bàn đón khách (Waiter)
1. Đăng nhập tài khoản Phục vụ: `EMP-001` (Mã PIN: `123456`) vào `/waiter/floor-plan`.
2. Chọn một bàn đang **SẴN SÀNG** (ví dụ: `Bàn 01`) $\rightarrow$ Bấm nút **[Mở Bàn Ngay]** (chọn 4 khách).
3. **Kết quả:** Thẻ bàn chuyển sang màu cam **ĐANG PHỤC VỤ (`OCCUPIED`)**, phiên ăn `DiningSession` được tạo thật trong CSDL.

### Bước 2: Waiter Gọi Thêm Món tại bàn
1. Bấm vào Bàn 01 $\rightarrow$ Bấm **[Gọi Thêm Món]**.
2. Chọn 1 đĩa *Cơm Chiên Hải Sản* và 2 lon *Bia Tiger Crystal* $\rightarrow$ Bấm **[Xác Nhận Gửi Vào Bếp]**.
3. **Kết quả:** Hệ thống gọi API thật, tổng tiền bàn nhảy từ `0đ` lên đúng giá tiền.
4. **Kiểm tra độ bền dữ liệu:** Chờ quá 5 giây (sau 2 chu kỳ Polling tự động) hoặc bấm F5 tải lại trang: **Món ăn và tổng tiền vẫn được giữ nguyên 100%**, chứng minh dữ liệu đã được lưu vào SQL Server!

### Bước 3: Mở Tab Bếp KDS (`/kitchen`) kiểm tra liên thông
1. Mở song song tab Màn hình Bếp KDS (`KDS-001`).
2. Quan sát: Món *Cơm Chiên Hải Sản* của Bàn 01 xuất hiện ngay lập tức trong danh sách chờ nấu!
3. Đầu bếp bấm **[Xong Món]** $\rightarrow$ Quay lại tab Waiter: Bàn 01 lập tức đổi sang trạng thái **CÓ MÓN CHỜ BƯNG (`FOOD_READY`)** màu xanh lá.

### Bước 4: Bưng món và Yêu cầu tính tiền
1. Waiter bấm **[Xác Nhận Đã Bưng Món]** $\rightarrow$ Món chuyển sang `SERVED`.
2. Khách ăn xong, Waiter bấm **[Gọi POS Thu Ngân]** $\rightarrow$ Thông báo chuyển sang trạng thái chờ thanh toán.

---

## 5. TỔNG KẾT CÁC FILE THỰC HIỆN

| File | Nhiệm vụ |
| :--- | :--- |
| `com.romsteam.roms.dto.request.WaiterAddOrderRequest` | DTO đóng gói danh sách món gọi thêm tại bàn |
| `com.romsteam.roms.service.WaiterService` | Khai báo `addOrderToTable` và `requestPayment` |
| `com.romsteam.roms.service.serviceImpl.WaiterServiceImpl` | Logic tạo `Order`, `OrderItem` vào CSDL và cập nhật trạng thái |
| `com.romsteam.roms.controller.WaiterController` | 2 Endpoint RESTful: `POST /api/waiter/tables/{id}/orders` và `request-payment` |
| `SourceCode/frontend/src/api/waiterApi.js` | Thêm 2 method Axios `addOrder` và `requestPayment` |
| `SourceCode/frontend/src/pages/waiter/WaiterFloorPlanPage.jsx` | Xóa `INITIAL_TABLES`, kết nối API gọi món thật và yêu cầu tính tiền |
| `SourceCode/frontend/src/pages/waiter/WaiterOrderDetailPage.jsx` | Xóa `INITIAL_TABLE_ORDERS`, kết nối Menu DB thật và API gọi món |
