# BƯỚC 31: QUẢN LÝ CHUYỂN BÀN & GỘP BÀN TRÊN SƠ ĐỒ BÀN (TABLE TRANSFER & MERGE)

> **Mục tiêu:** Xây dựng giải pháp Full-Stack toàn diện cho nghiệp vụ **Chuyển Bàn (Table Transfer)** và **Gộp Bàn (Table Merge)** trên sơ đồ quản trị nhà hàng (`TableManagementPage.jsx`). Đảm bảo đầy đủ nút bấm trực quan trên từng thẻ bàn `OCCUPIED`, thanh thao tác nhanh bên trong Ngăn Kéo Đơn Món (Order Drawer) và 2 Modal Pop-up tương tác chuyên nghiệp phục vụ quản lý và nhân viên phục vụ.

---

## 1. TỔNG QUAN NGHIỆP VỤ (BUSINESS RULES)

### 1.1. Chuyển Bàn (Table Transfer)
- **Kịch bản thực tế:** Khách hàng đang ngồi ăn tại Bàn A muốn chuyển sang Bàn B (do máy lạnh quá lạnh, nước nhỏ giọt, muốn chuyển sang bàn view ban công, hoặc bàn rung lắc...).
- **Quy tắc điều kiện:**
  - **Bàn nguồn (Source Table):** Phải ở trạng thái `OCCUPIED` và có phiên ăn đang hoạt động (`DiningSession` có trạng thái `ACTIVE`).
  - **Bàn đích (Target Table):** Phải ở trạng thái `AVAILABLE` (Bàn trống).
  - **Khóa an toàn (Buffer Lock Protection):** Nếu Bàn đích đang trong khung giờ khóa an toàn cho đơn đặt bàn trước (trong vòng 60 phút), hệ thống sẽ chặn chuyển để tránh xung đột lịch đặt bàn.
  - **Dịch chuyển dữ liệu:**
    - Phiên ăn (`DiningSession`) của Bàn nguồn được gán sang Bàn đích: `session.setTable(targetTable)`.
    - Ghi nhận lịch sử chuyển bàn vào ghi chú phiên ăn: `[CHUYỂN TỪ BÀN A SANG BÀN B lúc HH:mm (Lý do: ...)]`.
    - Toàn bộ chuông gọi phục vụ / yêu cầu thanh toán (`ServiceRequest`) đang `PENDING` của Bàn nguồn được chuyển sang Bàn đích.
    - Bàn đích chuyển trạng thái sang `OCCUPIED`.
    - Bàn nguồn chuyển sang trạng thái `DIRTY` (Cần dọn dẹp) theo lựa chọn của Quản lý để nhân viên chạy bàn đến dọn dẹp, chuẩn bị cho lượt khách tiếp theo.

---

### 1.2. Gộp Bàn (Table Merge)
- **Kịch bản thực tế:** Hai nhóm khách đi chung hoặc người quen tình cờ gặp nhau tại nhà hàng, muốn ngồi chung bàn và thanh toán chung trên 1 hóa đơn tổng hợp duy nhất.
- **Quy tắc điều kiện:**
  - Cả **Bàn nguồn (Source Table)** và **Bàn đích (Target Table)** đều phải đang ở trạng thái `OCCUPIED` và có `DiningSession` ở trạng thái `ACTIVE`.
  - Không được phép gộp một bàn vào chính nó (`sourceTableId != targetTableId`).
  - **Dịch chuyển và hợp nhất dữ liệu:**
    - Toàn bộ đơn gọi món (`Order`) thuộc phiên ăn bàn nguồn được chuyển sang phiên ăn bàn đích: `order.setSession(targetSession)`. Ghi chú đơn được gắn thẻ `[Gộp từ Bàn A]`.
    - Số lượng khách được cộng dồn vào bàn đích: `targetSession.guestCount += sourceSession.guestCount`.
    - Toàn bộ yêu cầu phục vụ `PENDING` của bàn nguồn chuyển sang bàn đích.
    - Phiên ăn của bàn nguồn (`sourceSession`) được đóng lại với trạng thái `COMPLETED`, ghi chú: `[ĐÃ GỘP VÀO BÀN B lúc HH:mm]`.
    - Bàn nguồn chuyển trạng thái sang `DIRTY` (hoặc `AVAILABLE`).
    - Bàn đích giữ nguyên trạng thái `OCCUPIED`, hóa đơn hiện tại (`currentBill`) tự động hiển thị tổng tiền kết hợp của cả hai bàn.

---

## 2. KIẾN TRÚC BACKEND (SPRING BOOT 3 & LOMBOK)

### 2.1. Các DTOs Request
#### `TransferTableRequest.java`
*Vị trí:* `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/request/TransferTableRequest.java`
```java
package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferTableRequest {
    @NotNull(message = "Bàn nguồn không được để trống")
    private Long sourceTableId;

    @NotNull(message = "Bàn đích chuyển đến không được để trống")
    private Long targetTableId;

    private String reason; // Lý do chuyển bàn (VD: "Máy lạnh nhỏ giọt")

    @Builder.Default
    private Boolean markSourceDirty = true; // Đánh dấu bàn cũ Cần dọn (DIRTY)
}
```

#### `MergeTableRequest.java`
*Vị trí:* `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/request/MergeTableRequest.java`
```java
package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MergeTableRequest {
    @NotNull(message = "Bàn nguồn (bàn cần gộp) không được để trống")
    private Long sourceTableId;

    @NotNull(message = "Bàn đích (bàn chính giữ lại) không được để trống")
    private Long targetTableId;

    private String reason; // Lý do gộp bàn

    @Builder.Default
    private Boolean markSourceDirty = true; // Đánh dấu bàn nguồn sau khi gộp thành Cần dọn (DIRTY)
}
```

---

### 2.2. Service Layer: `RestaurantTableService.java` & `RestaurantTableServiceImpl.java`
- Khai báo và hiện thực 2 phương thức:
  - `TableResponse transferTable(TransferTableRequest request)`: Kiểm tra ràng buộc bàn nguồn, bàn đích, buffer lock, dịch chuyển session và service requests, cập nhật trạng thái hai bàn.
  - `TableResponse mergeTables(MergeTableRequest request)`: Kiểm tra 2 bàn `OCCUPIED`, chuyển toàn bộ `Order` từ `sourceSession` sang `targetSession`, gộp số lượng khách, đóng `sourceSession`, chuyển `ServiceRequest`, cập nhật trạng thái bàn nguồn thành `DIRTY`.
- Đồng bộ bổ sung phương thức tương ứng tại `WaiterService.java` và `WaiterServiceImpl.java` để Trạm phục vụ bàn (Waiter Terminal) cũng có thể gộp bàn linh hoạt.

---

### 2.3. Controller Layer: `AdminTableController.java` & `WaiterController.java`
*Vị trí:* `SourceCode/backend/roms/src/main/java/com/romsteam/roms/controller/AdminTableController.java`
```java
// POST /api/admin/tables/transfer - Quản lý chuyển bàn
@PostMapping("/transfer")
public ResponseEntity<ApiResponse<TableResponse>> transferTable(@Valid @RequestBody TransferTableRequest request) {
    TableResponse response = tableService.transferTable(request);
    return ResponseEntity.ok(ApiResponse.success(response, "Chuyển bàn thành công!"));
}

// POST /api/admin/tables/merge - Quản lý gộp bàn
@PostMapping("/merge")
public ResponseEntity<ApiResponse<TableResponse>> mergeTables(@Valid @RequestBody MergeTableRequest request) {
    TableResponse response = tableService.mergeTables(request);
    return ResponseEntity.ok(ApiResponse.success(response, "Gộp bàn thành công!"));
}
```

---

## 3. KIẾN TRÚC FRONTEND (REACT VITE & TAILWINDCSS / INLINE STYLES)

### 3.1. Cập Nhật API Service: `tableApi.js`
*Vị trí:* `SourceCode/frontend/src/api/tableApi.js`
```javascript
// Quản lý chuyển bàn (Table Transfer)
transferTable: (data) => {
    return axiosClient.post('/admin/tables/transfer', data);
},

// Quản lý gộp bàn (Table Merge)
mergeTables: (data) => {
    return axiosClient.post('/admin/tables/merge', data);
},
```

---

### 3.2. Nút Bấm Thao Tác Trực Tiếp Trên Mặt Thẻ Bàn (`TableManagementPage.jsx`)
Trên mỗi thẻ bàn có trạng thái `OCCUPIED`, giao diện hiển thị trọn bộ 3 nút thao tác:
1. **Nút 🔄 Chuyển (Xanh dương - `#EFF6FF`, viền `#BFDBFE`):** Mở Modal Chuyển Bàn cho bàn hiện tại.
2. **Nút 🔗 Gộp (Tím nhẹ - `#FAF5FF`, viền `#E9D5FF`):** Mở Modal Gộp Bàn vào bàn khác.
3. **Nút 📋 Xem Đơn (Đỏ gạch - `#9D4124`):** Mở Ngăn Kéo Quản Lý Đơn Món (Order Drawer).

---

### 3.3. Thanh Thao Tác Nhanh Bên Trong Ngăn Kéo (Order Drawer)
Ngay dưới Header của Drawer, khi Quản lý đang theo dõi danh sách món ăn của bàn, thanh công cụ xuất hiện với 2 nút:
- **🔄 Chuyển Bàn:** Gọi `handleOpenTransferModal(orderDrawerTable)`
- **🔗 Gộp Bàn:** Gọi `handleOpenMergeModal(orderDrawerTable)`

Giúp Quản lý thao tác tức thì mà không cần phải tắt ngăn kéo để tìm lại bàn trên sơ đồ.

---

### 3.4. Modal Pop-up 1: Chuyển Bàn (`TransferTableModal`)
- **Tóm tắt bàn nguồn:** Mã bàn, Tên hiển thị, Khu vực, Số khách và Hóa đơn hiện tại.
- **Bộ lọc khu vực (Zone Filter Pills):** Lọc danh sách bàn trống theo *Tất cả khu vực*, *Tầng 1*, *Tầng 2*, *Phòng VIP*.
- **Lưới chọn bàn đích:**
  - Chỉ hiển thị các bàn `AVAILABLE` và không bị khóa an toàn (Buffer Lock).
  - Hiển thị sức chứa, mã bàn, tên bàn và cảnh báo nếu sức chứa nhỏ hơn số khách hiện tại (`⚠️ Nhỏ hơn XK`).
  - Lựa chọn bàn bằng Radio/Card click mượt mà.
- **Dropdown chọn lý do chuyển:**
  - Khách yêu cầu đổi vị trí bàn
  - Máy lạnh / Quạt nhỏ giọt hoặc quá lạnh
  - Muốn đổi sang bàn view đẹp / ngoài trời
  - Bàn rung lắc / hỏng thiết bị
  - Gia đình có trẻ nhỏ cần bàn rộng hơn
  - Lý do khác... (hiển thị ô input nhập tùy biến).
- **Tùy chọn bàn cũ:** Checkbox `[x] Đánh dấu bàn cũ thành "Cần Dọn Dẹp" (DIRTY)`.

---

### 3.5. Modal Pop-up 2: Gộp Bàn (`MergeTableModal`)
- **Tóm tắt bàn nguồn:** Thông tin bàn sẽ được gộp đi và đóng phiên.
- **Danh sách bàn phục vụ khác (Target Table):** Liệt kê các bàn `OCCUPIED` khác trong nhà hàng kèm số khách và tổng tiền hiện tại.
- **Dự báo kết quả thời gian thực (Realtime Preview):**
  - Khi chọn một bàn đích, hệ thống tự động tính toán và hiển thị:
    - **Tổng số khách sau gộp:** `Khách bàn A + Khách bàn B = Tổng khách`.
    - **Tổng tiền hóa đơn sau gộp:** `Tiền bàn A + Tiền bàn B = Tổng hóa đơn`.
    - Thông báo rõ ràng: Mọi món ăn từ bàn nguồn sẽ chuyển sang bàn đích và phiên ăn bàn nguồn sẽ tự động đóng.
- **Dropdown chọn lý do gộp bàn:**
  - Khách đi chung nhóm, muốn ngồi cùng và tính 1 hóa đơn
  - Khách quen / bạn bè gặp nhau muốn gộp bàn
  - Gộp tiệc / liên hoan công ty
  - Khác...
- **Tùy chọn bàn nguồn:** Checkbox `[x] Đánh dấu bàn cũ thành "Cần Dọn Dẹp" (DIRTY)`.

---

## 4. KẾT QUẢ KIỂM THỬ & TÍCH HỢP HỆ THỐNG

1. **Kiểm thử biên dịch Backend (Maven):**
   - Lệnh: `mvn test-compile` tại `SourceCode/backend/roms`.
   - Kết quả: **BUILD SUCCESS**, 152 files biên dịch thành công 100%.
2. **Kiểm thử đóng gói Frontend (Vite):**
   - Lệnh: `npm run build` tại `SourceCode/frontend`.
   - Kết quả: **built in 747ms**, 0 lỗi cú pháp hoặc cảnh báo runtime.
3. **Đồng bộ thời gian thực (Realtime Sync):**
   - Phát sự kiện `TABLE_TRANSFER` và `TABLE_MERGE` qua `broadcastRealtimeEvent`, giúp mọi màn hình trạm (Admin, Waiter, Cashier) cập nhật trạng thái bàn và hóa đơn ngay tức thì.
