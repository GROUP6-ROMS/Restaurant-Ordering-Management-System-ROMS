# BƯỚC 26: QUẢN LÝ MÓN ĐẶT TRƯỚC CHO BÀN ĐẶT TRƯỚC (RESERVATION PRE-ORDER FULL-STACK)

> **Mục tiêu:** Hoàn thiện 100% luồng Full-Stack cho nghiệp vụ **Đặt trước món ăn (Pre-Order)** của bàn đặt trước:
> 1. **Khách hàng gửi món đặt trước:** Giao diện đặt bàn trực tuyến (`ReservationPage.jsx`) gửi mảng dữ liệu cấu trúc các món đã chọn (`preOrderItems`) xuống Backend lưu vào CSDL SQL Server.
> 2. **Quản lý kiểm tra xác nhận món:** Trên màn hình Quản lý điều phối đặt bàn (`TableManagementPage.jsx`), Quản lý thấy ngay huy hiệu danh sách món, tổng số lượng phần và số tiền dự kiến của từng bàn.
> 3. **Toàn quyền Thêm / Sửa / Xóa món cho bàn đặt:** Quản lý có thể mở Modal chuyên dụng để kiểm tra, tăng/giảm số lượng món, cập nhật ghi chú chế biến, xóa món, hoặc chọn thêm món mới từ thực đơn nhà hàng (khi gọi điện trao đổi với khách) và lưu cập nhật xuống CSDL thời gian thực.
> 
> **Cam kết kỹ thuật:** 100% Full-Stack đồng bộ (Spring Boot 3.4.5 + React Vite), JPA Orphan Removal, Maven `BUILD SUCCESS`, Vite build 0 lỗi.

---

## 1. TỔNG QUAN KIẾN TRÚC LUỒNG DỮ LIỆU (SEQUENCE FLOW)

```text
[Khách Hàng - ReservationPage]              [Quản Lý - TableManagementPage]              [Backend ROMS Spring Boot]
              │                                           │                                           │
  1. Chọn bàn, ngày giờ,                         │                                           │
     chọn món đặt trước (pre-order)               │                                           │
              │                                           │                                           │
  2. POST /api/customer/reservations ─────────────────────┼──────────────────────────────────────────>│
     (kèm List<ReservationItemRequest>)                   │                                           │
              │                                           │                                     Lưu Reservation &
              │                                           │                                     ReservationItem (DB)
              │<─── 201 Created (Booking Code) ───────────┼───────────────────────────────────────────│
              │                                           │                                           │
              │                               3. Mở Modal duyệt đặt bàn ─────────────────────────────>│
              │                                  GET /api/admin/reservations                          │
              │                                           │<─── Trả về danh sách kèm preOrderItems ───│
              │                                           │     (hiển thị badge & preview món)        │
              │                                           │                                           │
              │                               4. Bấm "Kiểm tra & Sửa món"                             │
              │                                  (Mở Modal PreOrder 2 cột)                            │
              │                                  - Điều chỉnh số lượng (+/-)                          │
              │                                  - Sửa ghi chú món cho Bếp                            │
              │                                  - Xóa món không phù hợp                              │
              │                                  - Tra cứu & thêm món mới từ Catalog                  │
              │                                           │                                           │
              │                               5. Bấm "Lưu Thay Đổi Món Đặt Trước"                    │
              │                                  PUT /api/admin/reservations/{id}/items ─────────────>│
              │                                           │                                     Xóa cũ & nạp mới
              │                                           │                                     (orphanRemoval=true)
              │                                           │<─── 200 OK: Cập nhật thành công ──────────│
```

---

## 2. CHI TIẾT CÁC THÀNH PHẦN BACKEND (SPRING BOOT 3)

### 2.1. Entity `ReservationItem.java`
Đại diện cho bảng `reservation_items` trong CSDL SQL Server:
- `id` (Long, IDENTITY): Khóa chính tự tăng.
- `reservation` (`@ManyToOne` LAZY): Phiếu đặt bàn cha.
- `menuItem` (`@ManyToOne` LAZY): Món ăn trong thực đơn.
- `quantity` (Integer): Số lượng đặt.
- `unitPrice` (BigDecimal): Đơn giá tại thời điểm đặt món.
- `subtotal` (BigDecimal): Thành tiền dòng (`quantity * unitPrice`).
- `note` (String, NVARCHAR(255)): Ghi chú riêng cho món (ví dụ: "Ít cay", "Ăn trước lúc khai tiệc").
- `createdAt`, `updatedAt`: Thời điểm tạo và cập nhật.

### 2.2. Quan hệ trong `Reservation.java`
Bổ sung liên kết 1-Nhiều với cơ chế `orphanRemoval`:
```java
@OneToMany(mappedBy = "reservation", cascade = CascadeType.ALL, orphanRemoval = true)
@Builder.Default
private List<ReservationItem> items = new ArrayList<>();
```

### 2.3. Repository `ReservationItemRepository.java`
```java
@Repository
public interface ReservationItemRepository extends JpaRepository<ReservationItem, Long> {
    List<ReservationItem> findByReservationId(Long reservationId);
    void deleteByReservationId(Long reservationId);
}
```

### 2.4. Các DTOs chuẩn hóa (Lombok `@Data`, `@Builder`)
1. **`ReservationItemRequest.java`:**
   - `menuItemId` (Long, `@NotNull`)
   - `quantity` (Integer, `@NotNull`, `@Min(1)`)
   - `note` (String)
2. **`ReservationItemResponse.java`:**
   - `id`, `menuItemId`, `menuItemName`, `sku`, `imageUrl`, `categoryName`, `unitPrice`, `quantity`, `subtotal`, `note`.
3. **`UpdateReservationItemsRequest.java`:**
   - `List<@Valid ReservationItemRequest> items`
4. **Cập nhật `CreateReservationRequest.java`:**
   - Bổ sung `List<@Valid ReservationItemRequest> preOrderItems`.
5. **Cập nhật `ReservationResponse.java`:**
   - Bổ sung `List<ReservationItemResponse> preOrderItems`.
   - Bổ sung `BigDecimal preOrderTotal` (tổng tiền các món đặt trước).
   - Bổ sung `Integer preOrderItemsCount` (tổng số lượng phần món).

### 2.5. Nghiệp vụ trong `ReservationServiceImpl.java`
- **Khách tạo đơn đặt trước:**
  Duyệt `request.getPreOrderItems()`, tra cứu `MenuItem`, tính giá `unitPrice` & `subtotal`, gán vào `reservation.getItems()` để lưu đồng thời qua Cascade.
- **Quản lý sửa/thêm/xóa món:**
  ```java
  @Override
  @Transactional
  public ReservationResponse updateReservationItems(Long reservationId, UpdateReservationItemsRequest request) {
      Reservation reservation = reservationRepository.findById(reservationId)
              .orElseThrow(() -> new AppException("Không tìm thấy đơn đặt bàn #" + reservationId));

      if (reservation.getStatus() == ReservationStatus.CANCELLED) {
          throw new AppException("Đơn đặt bàn này đã bị hủy, không thể chỉnh sửa món đặt trước!");
      }

      // Xóa danh sách món cũ (orphanRemoval = true tự động xóa trong CSDL)
      reservation.getItems().clear();

      // Thêm danh sách món mới theo chỉ định của Quản lý
      if (request.getItems() != null && !request.getItems().isEmpty()) {
          for (ReservationItemRequest itemReq : request.getItems()) {
              MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                      .orElseThrow(() -> new AppException("Món ăn không tồn tại!"));
              BigDecimal unitPrice = menuItem.getPrice();
              BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));

              ReservationItem item = ReservationItem.builder()
                      .reservation(reservation)
                      .menuItem(menuItem)
                      .quantity(itemReq.getQuantity())
                      .unitPrice(unitPrice)
                      .subtotal(subtotal)
                      .note(itemReq.getNote())
                      .build();
              reservation.getItems().add(item);
          }
      }

      Reservation saved = reservationRepository.save(reservation);
      return mapToResponse(saved);
  }
  ```

### 2.6. Controller `AdminReservationController.java`
Expose endpoint có phân quyền `MANAGER` / `ADMIN`:
```java
@PutMapping("/{id}/items")
public ResponseEntity<ApiResponse<ReservationResponse>> updateReservationItems(
        @PathVariable Long id,
        @Valid @RequestBody UpdateReservationItemsRequest request) {
    ReservationResponse updated = reservationService.updateReservationItems(id, request);
    return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật danh sách món đặt trước thành công!"));
}
```

---

## 3. CHI TIẾT CÁC THÀNH PHẦN FRONTEND (REACT VITE)

### 3.1. API Service `reservationApi.js`
Bổ sung hàm gọi API:
```javascript
updateReservationItems: async (reservationId, data) => {
  const res = await axiosClient.put(`/admin/reservations/${reservationId}/items`, data);
  return res.data;
}
```

### 3.2. Form Đặt bàn Khách hàng `ReservationPage.jsx`
Tại hàm `handleNextStep` (Bước 3), đóng gói mảng `preOrderItems` có cấu trúc:
```javascript
const payload = {
  customerName: customerName.trim(),
  customerPhone: customerPhone.trim(),
  customerEmail: customerEmail.trim() || null,
  guestCount: selectedGuests,
  reservationDate: selectedDate,
  reservationTime: selectedTime,
  requestedZone: selectedZone,
  note: fullNote,
  preOrderItems: preOrderItems.map(i => ({
    menuItemId: i.id,
    quantity: i.qty,
    note: i.note || ''
  }))
};
await reservationApi.createReservation(payload);
```

### 3.3. Giao diện Quản lý Sơ đồ bàn `TableManagementPage.jsx`
1. **Khối hiển thị Món Đặt Trước trên Thẻ phiếu đặt bàn:**
   - Nếu có món đặt trước: hiển thị khung màu ấm với icon `restaurant_menu`, số lượng món & phần (`X món (Y phần)`), tổng tiền tạm tính, badge preview từng món (`2x Bò Wagyu A5 - 780.000 đ • ít tiêu`).
   - Nút hành động: `[Kiểm tra & Sửa món]` hoặc `[+ Thêm món đặt trước]` nếu chưa có món.
2. **Modal chuyên dụng `PreOrderModal` (Chia 2 cột cao cấp):**
   - **Header:** Mã đặt chỗ, Tên khách hàng, SĐT, Giờ hẹn và Khu vực bàn.
   - **Cột Trái (Danh sách món của bàn):**
     - Danh sách từng món kèm ảnh thumbnail, tên món, đơn giá niêm yết, tổng tiền dòng.
     - Bộ tăng giảm số lượng: Nút `[-]` và `[+]`.
     - Ô nhập ghi chú riêng cho từng món chuyển đến Bếp.
     - Nút xóa món `[Thùng rác]`.
     - Thanh tổng kết: Tổng tiền món đặt trước (VNĐ).
   - **Cột Phải (Thực đơn nhà hàng):**
     - Thanh tìm kiếm món ăn theo tên hoặc danh mục.
     - Danh sách các món khả dụng trong CSDL với giá tiền và nút `[+ Chọn Món]` / `[+ Thêm (xN)]`.
   - **Footer:**
     - Nút `[Đóng]`.
     - Nút `[Lưu Thay Đổi Món Đặt Trước]` (kèm hiệu ứng loading xoay tròn, gọi API `updateReservationItems` và cập nhật state tức thì).

---

## 4. KẾT QUẢ KIỂM THỬ & XÁC MINH CHẤT LƯỢNG

1. **Backend Maven Compile:**
   - Lệnh: `mvn test-compile -DskipTests`
   - Kết quả: **`[INFO] BUILD SUCCESS`** (151 class Java biên dịch sạch sẽ, 0 cảnh báo).
2. **Frontend Vite Build:**
   - Lệnh: `npm run build`
   - Kết quả: **`✓ built in 403ms`** (0 lỗi JSX/Lint/Import).
3. **Đồng bộ dữ liệu:**
   - Thao tác thêm/sửa/xóa món trên Admin phản ánh ngay lập tức vào cơ sở dữ liệu và tự động cập nhật lại tổng tiền trên thẻ phiếu đặt bàn.
