# BƯỚC 29: NÂNG CẤP TOÀN DIỆN NGĂN KÉO QUẢN LÝ ĐƠN MÓN TẠI BÀN (ORDER DRAWER FULL OPERATIONS)

---

## I. TỔNG QUAN & MỤC TIÊU NGHIỆP VỤ

Trong quy trình vận hành nhà hàng F&B thực tế tại sảnh, Quản lý nhà hàng (Floor Manager) thường xuyên phải trực tiếp can thiệp vào các đơn món ăn của bàn đang dùng bữa (`OCCUPIED`):
1. **Khách gọi thêm món trực tiếp:** Khách không muốn quét lại mã QR trên bàn mà gọi thẳng Quản lý hoặc Nhân viên đang đứng cạnh để thêm đồ ăn, đồ uống.
2. **Khách muốn điều chỉnh số lượng:** Khách muốn tăng thêm phần hoặc giảm bớt số lượng món khi thấy ăn không hết.
3. **Khách muốn hủy món:** Món ăn chế biến quá lâu, khách có việc gấp phải về, bếp báo hết nguyên liệu, hoặc nhân viên order nhầm bàn $\rightarrow$ Cần quy trình Hủy món có ghi nhận lý do rõ ràng để đối soát thất thoát nguyên vật liệu.
4. **Khách xin in phiếu tạm tính (Pre-check Bill):** Khách muốn kiểm tra lại danh sách các món đã dùng và tổng số tiền trước khi thanh toán tại bàn hoặc quầy Thu ngân.

Trước đây, ngăn kéo (Drawer) tại trang Sơ đồ bàn (`TableManagementPage.jsx`) chỉ mang tính chất **Xem thụ động (Read-only)**. Bước nâng cấp 29 biến Drawer thành **Trạm điều phối đơn món toàn năng tại bàn** với các tính năng vượt trội:
- **Xem toàn diện danh sách món:** Trạng thái từng món (Chờ bếp `PENDING`, Đang nấu `COOKING`, Sẵn sàng `READY`, Đã lên bàn `SERVED`, Đã hủy `CANCELLED`), ghi chú chế biến, đợt gọi món.
- **Thêm món mới trực tiếp từ Thực đơn (Add Items Modal):** Modal 2 cột trực quan cho phép tìm kiếm món ăn, lọc theo danh mục, chọn số lượng, nhập ghi chú chế biến và gửi gọi món vào bàn ngay tức thì.
- **Tăng / Giảm số lượng (+ / -):** Thao tác 1-click cập nhật số lượng món và tự động tính lại tổng tiền bàn ăn. Nếu giảm về 0, hệ thống chuyển hướng thông minh sang quy trình Hủy món.
- **Hủy món có lý do (Void Item Modal):** Chọn lý do hủy chuẩn hóa (Khách đổi ý, Hết nguyên liệu, Lên món quá lâu, Nhầm bàn, Lý do khác), tự động trừ tiền món khỏi hóa đơn và gạch ngang món trên danh sách.
- **Xem trước & In phiếu tạm tính chuẩn nhiệt K80 (Pre-check Bill):** Hiển thị mẫu phiếu tạm tính nhiệt 80mm với đầy đủ logo nhà hàng, thông tin bàn, số khách, giờ vào, chi tiết món, thuế VAT 8%, tổng cộng; nút in trực tiếp `window.print()` tích hợp CSS `@media print` không bị lẫn giao diện web.

---

## II. KIẾN TRÚC TẦNG BACKEND (SPRING BOOT 3)

### 1. Nâng Cấp DTO `TableOrdersResponse.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/response/TableOrdersResponse.java`
- Bổ sung `menuItemId` và `orderId` vào class nội bộ `OrderItemDetail`:

```java
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemDetail {
        private Long orderItemId;
        private Long menuItemId;        // ID món ăn trong thực đơn
        private Long orderId;           // ID đợt gọi món
        private String orderCode;       // Thuộc đợt gọi nào (Đợt 1, Đợt 2)
        private String itemName;        // Tên món (Bò nướng, Trà đào...)
        private String imageUrl;
        private Integer quantity;       // Số lượng
        private BigDecimal unitPrice;   // Đơn giá
        private BigDecimal subtotal;    // Thành tiền
        private String note;            // Ghi chú ("Ít đá", "Không hành")
        private String status;          // PENDING, COOKING, READY, SERVED, CANCELLED
        private String statusText;      // Tiếng Việt hiển thị
    }
```

---

### 2. Interface Nghiệp Vụ `RestaurantTableService.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/RestaurantTableService.java`
- Bổ sung 3 phương thức nghiệp vụ quản lý món tại bàn:

```java
    // 11. Quản lý thêm món trực tiếp vào bàn ăn
    TableOrdersResponse addItemsToTable(Long tableId, WaiterAddOrderRequest request);

    // 12. Quản lý điều chỉnh số lượng món ăn tại bàn
    TableOrdersResponse updateOrderItemQuantity(Long orderItemId, Integer quantity);

    // 13. Quản lý hủy món ăn tại bàn kèm lý do
    TableOrdersResponse cancelOrderItem(Long orderItemId, String reason);
```

---

### 3. Triển Khai Nghiệp Vụ `RestaurantTableServiceImpl.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/serviceImpl/RestaurantTableServiceImpl.java`
- Inject thêm `OrderItemRepository` và `MenuItemRepository`.
- **Thêm món vào bàn (`addItemsToTable`):**
  - Tự động lấy phiên ăn `DiningSession` hiện tại hoặc khởi tạo phiên mới nếu bàn chưa có phiên.
  - Phân loại món: Đồ uống $\rightarrow$ trạng thái `READY` (quầy pha chế / tủ mát); Món xào nấu $\rightarrow$ `COOKING` đẩy sang Bếp KDS.
  - Cập nhật bàn sang trạng thái `OCCUPIED`.
  - Trả về cấu trúc `TableOrdersResponse` mới nhất.
- **Điều chỉnh số lượng món (`updateOrderItemQuantity`):**
  - Kiểm tra món chưa bị hủy (`CANCELLED`).
  - Cập nhật số lượng mới: `subtotal = unitPrice * quantity`.
  - Tính toán lại tổng tiền `Order.totalAmount` cho toàn bộ các món còn hiệu lực.
- **Hủy món ăn kèm lý do (`cancelOrderItem`):**
  - Chuyển trạng thái món sang `OrderItemStatus.CANCELLED`.
  - Gắn nhãn ghi chú: `"[HỦY BỞI QUẢN LÝ: " + reason + "]"`.
  - Trừ tiền món khỏi `Order.totalAmount`. Nếu toàn bộ món trong đơn bị hủy, chuyển trạng thái `Order` thành `CANCELLED`.

---

### 4. Controller API `AdminTableController.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/controller/AdminTableController.java`
- Bổ sung 3 REST endpoints chuẩn mực:

```java
    // 11. POST /api/admin/tables/{tableId}/add-items - Quản lý gọi thêm món trực tiếp vào bàn
    @PostMapping("/{tableId}/add-items")
    public ResponseEntity<ApiResponse<TableOrdersResponse>> addItemsToTable(
            @PathVariable Long tableId,
            @Valid @RequestBody WaiterAddOrderRequest request) {
        TableOrdersResponse response = tableService.addItemsToTable(tableId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã thêm món vào bàn thành công!"));
    }

    // 12. PATCH /api/admin/tables/items/{orderItemId}/quantity - Quản lý điều chỉnh số lượng món ăn
    @PatchMapping("/items/{orderItemId}/quantity")
    public ResponseEntity<ApiResponse<TableOrdersResponse>> updateOrderItemQuantity(
            @PathVariable Long orderItemId,
            @RequestBody Map<String, Integer> payload) {
        Integer quantity = payload != null ? payload.get("quantity") : 1;
        TableOrdersResponse response = tableService.updateOrderItemQuantity(orderItemId, quantity);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã cập nhật số lượng món thành công!"));
    }

    // 13. POST /api/admin/tables/items/{orderItemId}/cancel - Quản lý hủy món ăn tại bàn kèm lý do
    @PostMapping("/items/{orderItemId}/cancel")
    public ResponseEntity<ApiResponse<TableOrdersResponse>> cancelOrderItem(
            @PathVariable Long orderItemId,
            @RequestBody(required = false) Map<String, String> payload) {
        String reason = payload != null ? payload.get("reason") : "Quản lý hủy";
        TableOrdersResponse response = tableService.cancelOrderItem(orderItemId, reason);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã hủy món ăn tại bàn thành công!"));
    }
```

---

## III. KIẾN TRÚC TẦNG FRONTEND (REACT VITE)

### 1. Service API `tableApi.js`
- **File:** `SourceCode/frontend/src/api/tableApi.js`
- Tích hợp 3 hàm gọi API:
  - `addItemsToTable(tableId, data)`
  - `updateOrderItemQuantity(orderItemId, quantity)`
  - `cancelOrderItem(orderItemId, reason)`

---

### 2. Giao Diện Ngăn Kéo `TableManagementPage.jsx`

#### A. Header Drawer:
- Hiển thị mã bàn, tên bàn, khu vực, số khách thực tế, thời gian vào bàn và thời lượng đã ngồi.
- 2 Nút thao tác nhanh trên Header:
  - 🛎️ **`[ + Thêm Món ]`**: Mở modal chọn món nhanh.
  - 🖨️ **`[ In Tạm Tính ]`**: Mở modal xem trước và in phiếu tạm tính.
  - ❌ Nút đóng ngăn kéo.

#### B. Danh Sách Món Ăn Tương Tác:
- Tên món, đơn giá, mã đợt gọi món (`ORD-T101-xxx`).
- Badge trạng thái món phân biệt màu:
  - Chờ bếp: Màu vàng cam (`#FEF3C7`, chữ `#92400E`)
  - Đang nấu: Màu cam đậm (`#FFEDD5`, chữ `#9A3412`)
  - Sẵn sàng: Màu xanh dương (`#DBEAFE`, chữ `#1E40AF`)
  - Đã lên bàn: Màu xanh lá (`#DCFCE7`, chữ `#166534`)
  - Đã hủy: Nền xám (`#E5E7EB`, chữ `#6B7280`), tên món và thành tiền có gạch ngang (`line-through`).
- **Nút điều chỉnh số lượng `[-]` và `[+]`**:
  - Bấm `+`: Tăng số lượng món lên 1, tự động tính lại tổng tiền.
  - Bấm `-`: Giảm số lượng món xuống 1. Nếu giảm về 0, chuyển sang modal xác nhận Hủy món.
- **Nút `Hủy món` (icon thùng rác đỏ)**: Mở modal xác nhận hủy món.

#### C. Modal Thêm Món Vào Bàn 2 Cột (`showAddOrderModal`):
- **Cột Trái (Thực đơn nhà hàng):**
  - Thanh tìm kiếm theo tên hoặc mã SKU.
  - Thanh trượt danh mục món ăn (Tất cả, Khai vị, Món chính, Đồ uống...).
  - Thẻ món ăn hiển thị ảnh, tên, danh mục, giá bán và nút *"Chọn"* / *"Thêm (x)"*.
- **Cột Phải (Đợt món chuẩn bị gọi):**
  - Danh sách các món đã chọn, nút tăng giảm (+/-), ô nhập ghi chú chế biến riêng cho từng món.
  - Ô nhập ghi chú chung cho đợt gọi (vd: *"Khách đang vội, ưu tiên làm sớm"*).
  - Tạm tính đợt gọi này.
  - Nút **"Gửi Gọi Món Vào Bàn"**: Gửi payload xuống API backend và phát tán sự kiện thời gian thực `NEW_ORDER_CREATED`.

#### D. Modal Xác Nhận Hủy Món (`voidModalItem`):
- Hiển thị tên món, số lượng, thành tiền món bị hủy.
- Danh sách 5 lý do hủy tiêu chuẩn:
  1. *Khách đổi ý / không dùng nữa*
  2. *Bếp báo hết nguyên liệu chế biến*
  3. *Chế biến quá lâu / Khách phải chờ*
  4. *Nhân viên bấm nhầm bàn*
  5. *Lý do khác (kích hoạt ô textarea tự nhập)*
- Nút bấm **"Xác Nhận Hủy Món"**: Gửi lý do xuống API, cập nhật danh sách món và phát tán sự kiện `TABLE_UPDATE`.

#### E. Modal Xem Trước & In Phiếu Tạm Tính Khổ Nhiệt K80 (`showPreCheckBillModal`):
- Vùng chứa in ấn với định danh `#thermal-receipt-print` chuẩn khổ 80mm.
- Đầy đủ tiêu đề nhà hàng, hotline, tên bàn, số khách, giờ vào, giờ in phiếu.
- Bảng danh sách món, cộng tiền món, thuế VAT 8%, chiết khấu giảm giá và **TỔNG CỘNG**.
- Nút **"In Ra Máy Nhiệt K80"**: Gọi `cashierApi.markDraftPrinted(tableId)` để gắn tag `[DRAFT_PRINTED]` và kích hoạt `window.print()`.
- Tích hợp khối CSS `@media print` ẩn toàn bộ các thành phần UI khác của trang web khi in.

---

## IV. QUY TRÌNH KIỂM THỬ (TESTING & VERIFICATION)

1. **Xem Đơn Món Tại Bàn:**
   - Tại trang `/admin/tables`, tìm một bàn đang phục vụ (`OCCUPIED`) $\rightarrow$ Bấm nút **"Xem Đơn"** hoặc click vào dòng *"Hóa đơn hiện tại"*.
   - Ngăn kéo Order Drawer trượt ra từ cạnh phải, hiển thị đầy đủ thông tin bàn, 3 ô KPI tiến độ (Chờ bếp / Đang nấu / Đã lên bàn) và danh sách chi tiết các món đã gọi.
2. **Gọi Thêm Món Vào Bàn:**
   - Bấm nút **"+ Thêm Món"** trên Drawer.
   - Modal 2 cột mở ra: Chọn 1 món ăn bất kỳ và 1 đồ uống, tăng số lượng, nhập ghi chú *"Ít ngọt"*.
   - Bấm **"Gửi Gọi Món Vào Bàn"**.
   - Drawer cập nhật tức thì danh sách món mới, tổng tiền bàn ăn tăng lên tương ứng.
3. **Chỉnh Sửa Số Lượng:**
   - Nhấn nút `+` tại món vừa thêm $\rightarrow$ Số lượng tăng lên, thành tiền và tổng tạm tính cập nhật trong tích tắc.
   - Nhấn nút `-` giảm số lượng.
4. **Hủy Món Ăn:**
   - Bấm nút **"Hủy món"** tại một đĩa món.
   - Modal xác nhận xuất hiện $\rightarrow$ Chọn *"Khách đổi ý / không dùng nữa"* $\rightarrow$ Bấm *"Xác Nhận Hủy Món"*.
   - Món ăn chuyển sang trạng thái đã hủy (gạch ngang tên, thành tiền 0đ), tổng hóa đơn bàn ăn tự động trừ đi số tiền tương ứng.
5. **In Phiếu Tạm Tính:**
   - Bấm nút **"In Tạm Tính"** trên Drawer.
   - Mẫu hóa đơn nhiệt K80 hiển thị chi tiết $\rightarrow$ Bấm *"In Ra Máy Nhiệt K80"*.
   - Hộp thoại in trình duyệt kích hoạt chuẩn xác với khổ giấy hóa đơn 80mm.
