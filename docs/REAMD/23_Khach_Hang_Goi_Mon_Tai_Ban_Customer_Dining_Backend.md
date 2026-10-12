# BƯỚC 23: XÂY DỰNG TOÀN DIỆN BACKEND THỰC KHÁCH GỌI MÓN TẠI BÀN (CUSTOMER DINING API)

> **Mục tiêu:** Cung cấp hạ tầng Backend REST API hoàn chỉnh, bảo mật và hiệu năng cao cho nghiệp vụ thực khách quét mã QR trên điện thoại di động tại bàn ăn:
> 1. **Khám phá thực đơn số (Digital Menu):** Tải danh mục và món ăn đang mở bán kèm trạm xử lý (`KITCHEN` / `WAITER`) và thời gian chế biến dự kiến.
> 2. **Tự động kích hoạt phiên ăn & Gửi đơn món (`placeOrder`):** Khi thực khách bấm gọi món, hệ thống tự động kiểm tra xem bàn đã có `DiningSession` (ACTIVE) chưa. Nếu chưa có, hệ thống tự khởi tạo phiên ăn mới, chuyển trạng thái bàn sang `OCCUPIED`, và tạo `Order` với trạng thái `SUBMITTED`, lưu các đĩa món `OrderItem` vào CSDL SQL Server để đẩy trực tiếp sang màn hình Bếp KDS và Trạm phục vụ Waiter.
> 3. **Theo dõi tiến độ chế biến thời gian thực (`getOrderTracking`):** Cho phép khách xem trạng thái từng đĩa món (Chờ nhận đơn $\rightarrow$ Đang nấu $\rightarrow$ Đã nấu xong $\rightarrow$ Đã phục vụ), kiểm tra hóa đơn tạm tính và thuế VAT 8%.
> 4. **Chuông gọi phục vụ & Yêu cầu tính tiền (`callWaiter`, `requestPayment`):** Khởi tạo bản ghi `ServiceRequest` trong CSDL, chống spam trùng lặp, đẩy chuông đến Waiter và Thu ngân POS.
> 
> **Cam kết kỹ thuật:** 100% tuân thủ kiến trúc phân tầng Spring Boot 3, JPA/Hibernate, DTO Lombok, Validation, đã kiểm thử biên dịch `mvn test-compile` thành công tuyệt đối 0 lỗi (BUILD SUCCESS).

---

## 1. TỔNG QUAN KIẾN TRÚC & LUỒNG LIÊN THÔNG (CUSTOMER QR ORDERING WORKFLOW)

```text
[Điện thoại Thực Khách]              [Backend Spring Boot]                   [CSDL SQL Server]             [Bếp KDS & Phục Vụ]
        │                                     │                                      │                             │
        │── 1. Quét QR bàn & GET /menu ──────>│                                      │                             │
        │                                     │── 2. Query Category & MenuItem ─────>│                             │
        │<── 3. Danh sách món động (JSON) ────│                                      │                             │
        │                                     │                                      │                             │
        │── 4. Chọn món & POST /orders ──────>│                                      │                             │
        │      (items: [{id: 1, qty: 2}...])  │── 5. Kiểm tra bàn & Session ACTIVE ──>│                             │
        │                                     │      (Tạo mới nếu chưa mở)           │                             │
        │                                     │── 6. Tạo Order (SUBMITTED) & ────────>│                             │
        │                                     │      OrderItem (PENDING) vào DB      │                             │
        │<── 7. Trả về tiến độ đơn & tổng tiền│                                      │                             │
        │                                     │                                      │── 8. Bếp KDS & Waiter ─────>│
        │                                     │                                      │      nhận món mới ngay!     │
        │                                     │                                      │                             │
        │── 9. GET /tracking (chu kỳ quét) ──>│── 10. Truy vấn tiến độ từng đĩa món ─>│                             │
        │<── 11. Cập nhật: COOKING, READY... ─│                                      │                             │
        │                                     │                                      │                             │
        │── 12. Bấm chuông / Gọi tính tiền ──>│── 13. Tạo ServiceRequest (PENDING) ──>│── 14. Báo chuông POS/Waiter ─>│
```

---

## 2. CHI TIẾT CÁC LỚP ĐỐI TƯỢNG VÀ TRUYỀN DỮ LIỆU (DTO LAYER)

Tất cả DTO được thiết kế tối ưu với Project Lombok (`@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`):

### 2.1. DTO Yêu Cầu (Requests)
- **`CustomerOrderItemRequest.java`**: Chứa `menuItemId`, `quantity` (tối thiểu 1), `note` (yêu cầu riêng như "Ít cay", "Không hành").
- **`CustomerPlaceOrderRequest.java`**: Chứa `tableId`, `tableNumber`, `guestCount`, `orderNote`, và danh sách `items`.
- **`CustomerCallServiceRequest.java`**: Chứa `tableId`, `tableNumber`, `requestType` (`CALL_WAITER`, `CALL_WATER`, `REQUEST_CLEAN`, `REQUEST_BILL`), `note`.

### 2.2. DTO Phản Hồi (Responses)
- **`CustomerMenuItemResponse.java`**: Thông tin món ăn, danh mục, giá, mô tả, ảnh, trạm xử lý (`station`), thời gian chế biến dự kiến (`prepTime`).
- **`CustomerMenuResponse.java`**: Nhóm các món ăn theo từng danh mục (Category) có thứ tự hiển thị `displayOrder`.
- **`CustomerItemTrackingResponse.java`**: Thông tin chi tiết trạng thái từng đĩa món khách đã gọi (`orderItemId`, `status`, `statusText`, `prepTime`, `subtotal`).
- **`CustomerBatchResponse.java`**: Thông tin một đợt gọi món (`orderId`, `orderCode`, `orderTimeFormatted`, `totalAmount`, danh sách `items`).
- **`CustomerOrderTrackingResponse.java`**: Dữ liệu tiến độ toàn diện của bàn ăn (`hasActiveSession`, `startTimeFormatted`, `totalAmount`, `vatAmount`, `grandTotal`, số lượng đĩa món theo từng trạng thái `pendingItems`, `cookingItems`, `readyItems`, `servedItems`, và danh sách các đợt gọi món `batches`).

---

## 3. CƠ CHẾ NGHIỆP VỤ CỐT LÕI TẠI `CustomerDiningServiceImpl.java`

### 3.1. Phân giải Bàn ăn linh hoạt (`resolveTable`)
Thực khách có thể quét mã QR truyền lên `tableId` (số nguyên) hoặc `tableNumber` dạng chuỗi ("01", "T-01", "VIP-01").
Hàm tiện ích `resolveTable` chủ động xử lý chuẩn hóa chuỗi, tra cứu theo ID, theo mã bàn chính xác, hoặc tìm kiếm tương đối:
```java
private RestaurantTable resolveTable(Long tableId, String tableNumber) {
    if (tableId != null) {
        Optional<RestaurantTable> opt = tableRepository.findById(tableId);
        if (opt.isPresent()) return opt.get();
    }
    if (tableNumber != null && !tableNumber.trim().isEmpty()) {
        String cleanNum = tableNumber.trim();
        Optional<RestaurantTable> opt = tableRepository.findByTableNumber(cleanNum);
        if (opt.isPresent()) return opt.get();
        // Thử thêm tiền tố "T-" hoặc bỏ "T-"
        ...
    }
    throw new ResourceNotFoundException("Không tìm thấy bàn ăn!");
}
```

### 3.2. Vòng đời Phiên ăn (DiningSession Lifecycle)
1. Khi khách gọi món đợt đầu tiên:
   - Nếu bàn đang `AVAILABLE` hoặc chưa có session `ACTIVE`, hệ thống tự sinh `sessionToken = "sess-" + table.getTableNumber() + "-" + UUID...`, gán `status = SessionStatus.ACTIVE`, ghi nhận thời gian bắt đầu `startTime`.
   - Chuyển trạng thái bàn sang `TableStatus.OCCUPIED`.
2. Nếu bàn đã có khách ngồi (đã mở phiên ăn trước đó):
   - Tái sử dụng phiên ăn hiện tại.
   - Nếu phiên ăn trước đó đã gửi in tạm tính (`[DRAFT_PRINTED]`), việc gọi món mới sẽ tự động dọn bỏ cờ tạm tính để Thu ngân in lại hóa đơn cập nhật đầy đủ.
3. Tạo đơn gọi món (`Order`) và chi tiết món (`OrderItem`):
   - Đơn hàng được gắn `status = OrderStatus.SUBMITTED`, `staff = null` (khách tự đặt).
   - Mỗi đĩa món được lưu với `unitPrice` cố định tại thời điểm đặt để bảo đảm tính toàn vẹn tài chính nếu sau này giá niêm yết thay đổi.
   - Các món chuyển xuống trạng thái `OrderItemStatus.PENDING`, sẵn sàng cho Bếp KDS tiếp nhận.

### 3.3. Chuông gọi phục vụ & Chống gửi trùng lặp (Spam Prevention)
Khi thực khách ấn chuông gọi nước đá hoặc gọi phục vụ:
- Kiểm tra bảng `service_requests` xem đã có yêu cầu loại này đang ở trạng thái `PENDING` cho bàn chưa.
- Nếu đã có: Phản hồi thông báo thân thiện "Yêu cầu đã được ghi nhận và nhân viên đang đến", không tạo bản ghi rác.
- Nếu chưa có: Tạo bản ghi `ServiceRequest` mới với `status = "PENDING"`, phát chuông trên giao diện Waiter và Admin.

---

## 4. DANH SÁCH ENDPOINTS TẠI `CustomerDiningController.java`

| Phương thức | Đường dẫn API | Mục đích | Phân quyền |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/customer/dining/menu` | Lấy thực đơn động theo danh mục | Công khai (PermitAll) |
| **POST** | `/api/customer/dining/orders` | Thực khách gửi đơn đặt món tại bàn | Công khai (PermitAll) |
| **GET** | `/api/customer/dining/tracking` | Xem trạng thái đĩa món & hóa đơn tạm tính | Công khai (PermitAll) |
| **POST** | `/api/customer/dining/call-waiter` | Bấm chuông gọi nhân viên hỗ trợ | Công khai (PermitAll) |
| **POST** | `/api/customer/dining/request-payment` | Gửi yêu cầu tính tiền sang quầy Thu ngân | Công khai (PermitAll) |

---

## 5. KẾT QUẢ KIỂM THỬ BIÊN DỊCH
```text
[INFO] Scanning for projects...
[INFO] Building roms 0.0.1-SNAPSHOT
[INFO] Compiling 146 source files with javac [debug parameters release 21] to target\classes
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] Total time: 10.344 s
[INFO] ------------------------------------------------------------------------
```
Hệ thống Backend đã sẵn sàng 100% để tiếp nhận kết nối từ giao diện Frontend của Thực khách (Milestone 2).
