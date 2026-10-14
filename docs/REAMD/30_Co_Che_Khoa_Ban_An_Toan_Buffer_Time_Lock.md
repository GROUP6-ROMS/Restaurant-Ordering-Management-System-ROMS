# BƯỚC 30: CƠ CHẾ KHÓA BÀN AN TOÀN CHO BÀN ĐẶT TRƯỚC (BUFFER TIME LOCK & 1-CLICK CHECK-IN)

---

## I. TỔNG QUAN & MỤC TIÊU NGHIỆP VỤ

### 1. Vấn Đề Thực Tế Trong Vận Hành Nhà Hàng F&B
Trong hoạt động nhà hàng hàng ngày, việc điều phối giữa **Khách đặt bàn trước (Reservation)** và **Khách vãng lai đến đột xuất (Walk-in Guests)** luôn là một trong những điểm nghẽn dễ gây ra xung đột và giảm uy tín nghiêm trọng nhất:
- **Tình huống rủi ro:** Khách hàng A đặt trước bàn B02 vào lúc **19:30** tối nay (đã được Quản lý duyệt và giữ chỗ). Tuy nhiên vào lúc **18:45**, một đoàn khách vãng lai 4 người bước vào quán. Nhân viên phục vụ hoặc quản lý ca thấy bàn B02 vẫn đang trống (`AVAILABLE`) liền xếp ngay cho khách vãng lai ngồi vào ăn.
- **Hậu quả:** Thời gian dùng bữa trung bình của một bàn ăn thường kéo dài từ 60 – 90 phút. Đến đúng 19:30, khách đặt A cùng gia đình đến nhà hàng thì bàn B02 vẫn đang dở bữa, không thể yêu cầu khách vãng lai đứng dậy nhường bàn $\rightarrow$ Khách đặt trước bức xúc, khiếu nại, nhà hàng mất khách và uy tín phục vụ.

### 2. Giải Pháp: Cơ Chế Khóa Bàn An Toàn (Buffer Time Lock)
Bước nâng cấp 30 xây dựng một cơ chế tự động bảo vệ bàn ăn từ Backend đến Frontend:
1. **Khung thời gian Khóa An Toàn (Buffer Time Window):**
   - Khi một bàn được gán cho đơn đặt bàn trạng thái `CONFIRMED` với giờ hẹn $T_{res}$ (ví dụ: `19:30`):
   - Hệ thống tự động kích hoạt chế độ **Khóa An Toàn (Buffer Locked)** trong khoảng từ $T_{res} - 60$ phút đến $T_{res} + 45$ phút (thời gian chờ tối đa trước khi ghi nhận No-show).
2. **Chặn mở bàn vãng lai trái phép ở Backend:**
   - Bất kỳ thao tác chuyển bàn sang `OCCUPIED` (mở bàn đón khách) trong khung khóa an toàn sẽ bị Backend từ chối ngay lập tức (`400 Bad Request`) kèm thông báo chi tiết danh tính khách đặt và thời gian còn lại.
   - Chỉ cho phép mở nếu Quản lý chủ động truyền cờ `forceOverride = true` (Mở cưỡng chế có kiểm soát).
3. **Thao tác 1-Click "Nhận Bàn Đặt" (Check-in Reservation):**
   - Khi khách đặt bàn đến nhà hàng, Quản lý chỉ cần bấm 1 click nút **"Nhận Bàn Đặt"** ngay trên mặt thẻ bàn.
   - Hệ thống tự động:
     - Chuyển trạng thái đơn đặt bàn sang `COMPLETED`.
     - Chuyển trạng thái bàn sang `OCCUPIED`.
     - Mở phiên ăn mới (`DiningSession`) với đúng số lượng khách đặt.
     - **Tự động nạp toàn bộ các món đặt trước (`preOrderItems`)** thành đợt gọi món (`Order` & `OrderItem`) gắn vào phiên ăn để Bếp nhận đơn chuẩn bị ngay, không cần nhân viên phải nhập tay lại từ đầu!

---

## II. KIẾN TRÚC TẦNG BACKEND (SPRING BOOT 3 & SPRING DATA JPA)

### 1. Nâng Cấp DTO `TableResponse.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/response/TableResponse.java`
- Bổ sung nhóm thuộc tính phản ánh trạng thái Khóa An Toàn thời gian thực:

```java
    // ===================================================================
    // Khóa An Toàn Cho Bàn Đặt Trước (Buffer Time Lock)
    // ===================================================================
    private Boolean isBufferLocked;                  // true nếu bàn đang trong khung thời gian khóa an toàn
    private Long bufferLockMinutesRemaining;         // Số phút còn lại đến giờ khách hẹn (âm nếu đã quá giờ)
    private String bufferLockTargetTime;             // "19:30 (14/10)"
    private String bufferLockCustomer;               // "Anh Hoàng (0909123456) - 4 khách"
    private Long bufferLockReservationId;            // ID đơn đặt bàn
    private String bufferLockBookingCode;            // Mã đặt bàn (RES-20261014-...)
    private Integer bufferLockPreOrderCount;         // Số lượng món ăn khách đã đặt trước
    private Integer bufferLockGuestCount;            // Số lượng khách đặt
```

---

### 2. Nâng Cấp DTO `UpdateTableStatusRequest.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/request/UpdateTableStatusRequest.java`
- Bổ sung cờ cho phép Quản lý mở bàn cưỡng chế trong trường hợp ngoại lệ:

```java
    // Cho phép mở bàn cưỡng chế cho khách vãng lai dù đang trong khung Buffer Lock của bàn đặt trước
    private Boolean forceOverride;
```

---

### 3. Tầng Truy Vấn CSDL `ReservationRepository.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/repository/ReservationRepository.java`
- Bổ sung phương thức tìm kiếm phiếu đặt đã gán cho bàn theo trạng thái:

```java
    // Tìm kiếm đơn đặt bàn đã gán cho bàn ăn theo trạng thái (sắp xếp theo giờ hẹn tăng dần)
    List<Reservation> findByTableIdAndStatusOrderByReservationTimeAsc(Long tableId, ReservationStatus status);
```

---

### 4. Giao Diện Nghiệp Vụ `RestaurantTableService.java` & `ReservationService.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/RestaurantTableService.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/ReservationService.java`

```java
// Trong RestaurantTableService.java:
TableResponse checkInReservationForTable(Long tableId, Long reservationId);

// Trong ReservationService.java:
ReservationResponse checkInReservation(Long reservationId);
```

---

### 5. Triển Khai Nghiệp Vụ `RestaurantTableServiceImpl.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/serviceImpl/RestaurantTableServiceImpl.java`

#### a. Kiểm Tra Khóa An Toàn Khi Đổi Trạng Thái Bàn (`updateTableStatus`):
```java
        // Kiểm tra Khóa An Toàn Đón Khách Đặt Trước (Buffer Time Lock)
        if (targetStatus == TableStatus.OCCUPIED && (request.getForceOverride() == null || !request.getForceOverride())) {
            LocalDateTime now = LocalDateTime.now();
            List<Reservation> confirmedList = reservationRepository.findByTableIdAndStatusOrderByReservationTimeAsc(id, ReservationStatus.CONFIRMED);
            if (confirmedList != null && !confirmedList.isEmpty()) {
                for (Reservation r : confirmedList) {
                    if (r.getReservationTime() == null) continue;
                    LocalDateTime startLock = r.getReservationTime().minusMinutes(60);
                    LocalDateTime endLock = r.getReservationTime().plusMinutes(45);
                    if (now.isAfter(startLock) && now.isBefore(endLock)) {
                        long diff = java.time.Duration.between(now, r.getReservationTime()).toMinutes();
                        String timeStr = r.getReservationTime().format(DateTimeFormatter.ofPattern("HH:mm"));
                        String prompt = diff > 0 ? ("còn " + diff + " phút nữa") : ("đã đến giờ hẹn");
                        throw new AppException(
                                "BÀN ĐANG ĐƯỢC KHÓA AN TOÀN! Bàn này đang giữ chỗ cho khách đặt: " +
                                r.getCustomerName() + " (" + r.getCustomerPhone() + " - " + r.getGuestCount() + " khách) lúc " +
                                timeStr + " (" + prompt + "). Không thể xếp khách vãng lai trừ khi Quản lý chọn 'Mở cưỡng chế'!",
                                HttpStatus.BAD_REQUEST
                        );
                    }
                }
            }
        }
```

#### b. Ánh Xạ Dữ Liệu Thời Gian Thực (`mapToTableResponse`):
```java
        Boolean isBufferLocked = false;
        Long bufferLockMinutesRemaining = null;
        String bufferLockTargetTime = null;
        String bufferLockCustomer = null;
        Long bufferLockReservationId = null;
        String bufferLockBookingCode = null;
        Integer bufferLockPreOrderCount = 0;
        Integer bufferLockGuestCount = null;

        List<Reservation> confirmedReservations = reservationRepository.findByTableIdAndStatusOrderByReservationTimeAsc(table.getId(), ReservationStatus.CONFIRMED);
        if (confirmedReservations != null && !confirmedReservations.isEmpty()) {
            LocalDateTime nowTime = LocalDateTime.now();
            for (Reservation r : confirmedReservations) {
                if (r.getReservationTime() == null) continue;
                LocalDateTime startLock = r.getReservationTime().minusMinutes(60);
                LocalDateTime endLock = r.getReservationTime().plusMinutes(45);

                boolean inBufferWindow = nowTime.isAfter(startLock) && nowTime.isBefore(endLock);
                boolean isReservedState = (table.getStatus() == TableStatus.RESERVED);

                if (inBufferWindow || isReservedState) {
                    isBufferLocked = true;
                    bufferLockReservationId = r.getId();
                    bufferLockBookingCode = r.getBookingCode();
                    bufferLockMinutesRemaining = java.time.Duration.between(nowTime, r.getReservationTime()).toMinutes();
                    bufferLockTargetTime = r.getReservationTime().format(DateTimeFormatter.ofPattern("HH:mm"));
                    bufferLockCustomer = r.getCustomerName() + " (" + r.getCustomerPhone() + ")";
                    bufferLockGuestCount = r.getGuestCount();
                    if (r.getItems() != null) {
                        bufferLockPreOrderCount = r.getItems().stream()
                                .mapToInt(it -> it.getQuantity() != null ? it.getQuantity() : 0)
                                .sum();
                    }
                    break;
                }
            }
        }
```

#### c. Tiếp Nhận Đón Khách & Tự Động Nạp Món (`checkInReservationForTable`):
```java
    @Override
    @Transactional
    public TableResponse checkInReservationForTable(Long tableId, Long reservationId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại: " + tableId));

        Reservation reservation = (reservationId != null)
                ? reservationRepository.findById(reservationId).orElseThrow(...)
                : reservationRepository.findByTableIdAndStatusOrderByReservationTimeAsc(tableId, ReservationStatus.CONFIRMED).get(0);

        // 1. Mở phiên ăn mới
        String sessionToken = "sess-" + table.getTableNumber().toLowerCase() + "-" + UUID.randomUUID().toString().substring(0, 8);
        DiningSession session = new DiningSession();
        session.setTable(table);
        session.setSessionToken(sessionToken);
        session.setStatus(SessionStatus.ACTIVE);
        session.setGuestCount(reservation.getGuestCount());
        session.setStartTime(LocalDateTime.now());
        session.setNote("Khách đặt trước: " + reservation.getCustomerName() + " (" + reservation.getBookingCode() + ")");
        session = diningSessionRepository.save(session);

        // 2. Chuyển đổi các món đặt trước thành Order và OrderItem
        if (reservation.getItems() != null && !reservation.getItems().isEmpty()) {
            Order newOrder = new Order();
            newOrder.setSession(session);
            newOrder.setOrderCode("ORD-PRE-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + (1000 + new Random().nextInt(9000)));
            newOrder.setOrderTime(LocalDateTime.now());
            newOrder.setNote("Món đặt trước - Đơn #" + reservation.getBookingCode());

            List<OrderItem> orderItems = new ArrayList<>();
            BigDecimal totalAmount = BigDecimal.ZERO;
            boolean hasCookingItems = false;

            for (ReservationItem resItem : reservation.getItems()) {
                OrderItem oi = new OrderItem();
                oi.setOrder(newOrder);
                oi.setMenuItem(resItem.getMenuItem());
                oi.setQuantity(resItem.getQuantity());
                oi.setUnitPrice(resItem.getUnitPrice());
                oi.setSubtotal(resItem.getSubtotal());
                oi.setStatus(isDrink ? OrderItemStatus.READY : OrderItemStatus.PENDING);
                if (!isDrink) hasCookingItems = true;
                orderItems.add(oi);
                totalAmount = totalAmount.add(resItem.getSubtotal());
            }

            newOrder.setStatus(hasCookingItems ? OrderStatus.CONFIRMED : OrderStatus.READY);
            newOrder.setTotalAmount(totalAmount);
            newOrder.setItems(orderItems);
            orderRepository.save(newOrder);
        }

        // 3. Hoàn tất phiếu đặt & cập nhật bàn
        reservation.setStatus(ReservationStatus.COMPLETED);
        reservationRepository.save(reservation);

        table.setStatus(TableStatus.OCCUPIED);
        table.setReservationInfo(null);
        table.setReservedTime(null);
        return mapToTableResponse(tableRepository.save(table));
    }
```

---

### 6. Controller Endpoints
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/controller/AdminTableController.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/controller/AdminReservationController.java`

| HTTP Method | Endpoint URL | Mục Đích Nghiệp Vụ | Phân Quyền |
|:---:|:---|:---|:---:|
| `POST` | `/api/admin/tables/{tableId}/check-in-reservation` | Quản lý 1-click check-in đón khách đặt bàn trực tiếp từ sơ đồ bàn | `MANAGER, ADMIN` |
| `POST` | `/api/admin/reservations/{id}/check-in` | Quản lý check-in từ danh sách đơn đặt bàn | `MANAGER, ADMIN` |
| `PATCH` | `/api/admin/tables/{id}/status` | Đổi trạng thái bàn (kèm kiểm tra khóa an toàn & cờ `forceOverride`) | `MANAGER, ADMIN` |

---

## III. KIẾN TRÚC TẦNG FRONTEND (REACT VITE)

### 1. Cập Nhật API Services
- **File:** `SourceCode/frontend/src/api/tableApi.js`
- **File:** `SourceCode/frontend/src/api/reservationApi.js`

```javascript
// tableApi.js:
checkInReservation: (tableId, reservationId) => {
    const url = reservationId 
        ? `/admin/tables/${tableId}/check-in-reservation?reservationId=${reservationId}`
        : `/admin/tables/${tableId}/check-in-reservation`;
    return axiosClient.post(url);
}

// reservationApi.js:
checkIn: async (reservationId) => {
    const res = await axiosClient.post(`/admin/reservations/${reservationId}/check-in`);
    return res.data;
}
```

---

### 2. Giao Diện Thẻ Bàn Sơ Đồ Quản Lý (`TableManagementPage.jsx`)
- **File:** `SourceCode/frontend/src/pages/admin/TableManagementPage.jsx`

#### a. Hiệu Ứng Trực Quan Trên Thẻ Bàn:
- Khi bàn rơi vào trạng thái `isBufferLocked`:
  - Viền thẻ bàn đổi sang màu hổ phách vàng cam: `border: 2px solid #F59E0B`.
  - Hiệu ứng phát sáng nhẹ: `boxShadow: 0 0 14px rgba(245, 158, 11, 0.22)`.
  - Hiển thị Banner cảnh báo đếm ngược:
    - Biểu tượng đồng hồ khóa: `lock_clock`.
    - Thông tin giờ hẹn: `Khóa Đón Khách [19:30]`.
    - Tag số lượng món đặt trước: `🛒 3 món`.
    - Đếm ngược: `• Còn 25 phút` (màu hổ phách) hoặc `• Trễ 10p` (màu đỏ).

#### b. Cụm Nút Thao Tác Thông Minh:
- Thay vì nút "Phục Vụ" thông thường, hệ thống tách làm 2 hành động:
  1. **Nút chính "Nhận Bàn Đặt" (Xanh lục `#059669`):** 1-click mở Modal xác nhận đón khách, nạp toàn bộ món vào Bếp.
  2. **Nút phụ "Cưỡng Chế" (Vàng cảnh báo `#FEF3C7`):** Cho phép Quản lý can thiệp mở bàn cho khách vãng lai khi chấp nhận rủi ro trùng lịch.

#### c. Modal Xác Nhận Check-In Đón Khách (`CheckInModal`):
- Hiển thị đầy đủ Họ tên, Số điện thoại, Mã đặt bàn, Giờ hẹn và tóm tắt số lượng món đặt trước.
- Ghi chú hướng dẫn rõ ràng: *"Thao tác này sẽ chuyển phiếu đặt sang COMPLETED, chuyển bàn sang Đang Phục Vụ (OCCUPIED) và tự động đẩy món xuống Bếp."*

#### d. Modal Cảnh Báo Mở Cưỡng Chế (`ForceOverrideModal`):
- Nêu rõ nguy cơ: *"Khách vãng lai ăn chưa xong khi khách đặt đến $\rightarrow$ Nguy cơ thiếu bàn"*.
- Nút bấm xác nhận: *"Tôi hiểu rủi ro — Mở Cho Khách"*.

#### e. Tích Hợp Vào Modal Cài Đặt Trạng Thái Bàn (`StatusModal`):
- Khi Quản lý mở modal đổi trạng thái và chọn `OCCUPIED` trên bàn đang bị khóa an toàn, hệ thống hiển thị hộp cảnh báo màu vàng kèm checkbox:
  `[ ] Xác nhận Mở Cưỡng Chế (Force Override)`
- Nếu chưa tích chọn mà bấm Lưu, hệ thống nhắc nhở và ngăn chặn thao tác nhầm lẫn.

---

## IV. BẢNG TỔNG HỢP KIỂM THỬ THỰC TẾ (TEST RESULTS)

| Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Kết Quả Thực Tế | Trạng Thái |
|:---|:---|:---|:---:|
| **1. Khách vãng lai vào ngồi trong khung Buffer Lock (Chưa Override)** | Bàn B02 có khách đặt lúc 19:30 (hiện là 19:05). Bấm Phục Vụ. | Backend trả về lỗi 400 Bad Request, Frontend hiển thị Toast: *"BÀN ĐANG ĐƯỢC KHÓA AN TOÀN!..."* | ✅ **ĐẠT** |
| **2. Quản lý mở cưỡng chế khách vãng lai** | Bàn B02 Buffer Lock, bấm "Cưỡng Chế" $\rightarrow$ Xác nhận rủi ro. | Bàn chuyển sang `OCCUPIED`, note ghi nhận: *"Quản lý mở cưỡng chế bỏ qua khóa an toàn đặt bàn"*. | ✅ **ĐẠT** |
| **3. Khách đặt bàn đến đúng giờ & Check-in 1-Click** | Bàn B02 có đơn đặt `RES-20261014-8821` kèm 2 món bò nướng. Bấm "Nhận Bàn Đặt". | Đơn đặt chuyển `COMPLETED`, bàn sang `OCCUPIED`, Order mới được tạo với 2 món chuyển thẳng sang Bếp `PENDING`. | ✅ **ĐẠT** |
| **4. Hiển thị đếm ngược trên Sơ đồ bàn** | Khách hẹn 19:30, đồng hồ hệ thống 19:10. | Thẻ bàn viền cam, hiển thị: *"Khóa Đón Khách [19:30] • Còn 20 phút"*. | ✅ **ĐẠT** |
| **5. Biên dịch Frontend & Backend** | `mvn test-compile` & `npm run build` | **BUILD SUCCESS** (0 warnings, 0 errors). | ✅ **ĐẠT** |
