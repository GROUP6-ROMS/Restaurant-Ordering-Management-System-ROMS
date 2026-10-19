# BƯỚC 37: HÀNG RÀO KIỂM THỬ TỰ ĐỘNG & BẢO ĐẢM TOÀN VẸN NGHIỆP VỤ (AUTOMATED TESTING SUITE & CONCURRENCY CONFLICT SCENARIOS)

---

## I. TỔNG QUAN & MỤC TIÊU NGHIỆP VỤ (PHASE 4: AUTOMATED TESTING SUITE)

### 1. Bối Cảnh & Tầm Quan Trọng Trong Đồ Án SWP391
Trong một hệ thống Quản lý và Đặt món Nhà hàng thời gian thực (**ROMS - Restaurant Ordering Management System**), việc kiểm thử thủ công qua giao diện không thể bao quát được các tình huống tranh chấp dữ liệu khốc liệt trong giờ cao điểm:
- **Nhiều thực khách quét mã QR tại cùng một bàn** và bấm *"Đặt món"* đồng thời tại cùng một phần nghìn giây.
- **Xung đột trạng thái phiên ăn:** Khách bấm đặt thêm món đúng lúc Thu ngân đang xuất hóa đơn chốt bàn.
- **Ràng buộc nghiệp vụ khắt khe:** Chặn thanh toán hóa đơn khi còn món đang nấu (`unservedCount > 0`), bắt buộc mã PIN Quản lý khi chiết khấu lớn (`> 30%` hoặc `> 200.000₫`), và cơ chế Khóa an toàn bàn đặt trước (**Buffer Time Lock** trước 60 phút).

**Giai đoạn 4** thiết lập hàng rào kiểm thử tự động toàn diện (**Automated Test Suite**) với **26 test cases** tự động chạy độc lập qua **JUnit 5, Mockito và H2 In-Memory Database**, giải quyết triệt để tiêu chí kiểm thử bắt buộc của đồ án SWP391:
> *"Có ít nhất 2 conflict scenario được xử lý thật và có test case chứng minh tự động."*

---

## II. KIẾN TRÚC & DANH MỤC CÁC BỘ TEST SUITE

Hệ thống kiểm thử được tổ chức tại thư mục `SourceCode/backend/roms/src/test/java/com/romsteam/roms/`:

```
src/test/
├── resources/
│   └── application.properties                <-- Cấu hình H2 in-memory DB chạy test siêu tốc
└── java/com/romsteam/roms/
    ├── RomsApplicationTests.java             <-- Test tải ngữ cảnh Spring Boot Context
    ├── concurrency/
    │   └── OrderConcurrencyTest.java         <-- 2 Kịch bản tranh chấp Concurrency SWP391 (SpringBootTest)
    └── service/
        ├── KitchenServiceTest.java           <-- Unit Test State Machine Bếp KDS (5 tests)
        ├── CashierServiceTest.java           <-- Unit Test Tính tiền POS, VAT 8%, PIN Quản lý (8 tests)
        ├── RestaurantTableServiceTest.java   <-- Unit Test Buffer Lock & Sức chứa bàn (6 tests)
        └── ReservationServiceTest.java       <-- Unit Test Đặt bàn trước & Chặn ngày quá khứ (4 tests)
```

---

## III. CHI TIẾT 2 KỊCH BẢN TRANH CHẤP CONCURRENCY (SWP391 CRITICAL MILESTONE)

File kiểm thử: `SourceCode/backend/roms/src/test/java/com/romsteam/roms/concurrency/OrderConcurrencyTest.java`

### 1. Conflict Scenario 1: Hai Thực Khách Cùng Bàn Quét QR & Đặt Món Đồng Thời
- **Mô phỏng thực tế:** Tại Bàn T-09, Thực khách A và Thực khách B cùng truy cập menu qua QR code. Cả 2 chọn món và bấm *"Xác nhận đặt món"* vào đúng cùng 1 thời điểm.
- **Kỹ thuật kiểm thử:** Sử dụng `ExecutorService (2 threads)` phối hợp `CountDownLatch(1)` để kích hoạt 2 request gửi đồng thời xuống `customerDiningService.placeOrder()`:
  - Khách A đặt: 2 phần Gỏi Cuốn Tôm Thịt (100.000₫).
  - Khách B đặt: 1 phần Bún Chả Hà Nội (80.000₫).
- **Kết quả kiểm chứng:**
  1. **Bảo toàn tính duy nhất của phiên ăn:** Cả 2 Order đều gắn chính xác vào cùng 1 `DiningSession` duy nhất của bàn T-09. Không sinh ra phiên ăn thừa.
  2. **Giải quyết triệt để lỗi xung đột mã đơn (`order_code`):** Hệ thống sinh mã đơn kèm hậu tố ngẫu nhiên chống va chạm chỉ mục `UNIQUE` khi 2 đơn sinh ra cùng mili-giây.
  3. **Khấu trừ tồn kho chuẩn xác (Stock Integrity):** Món Gỏi Cuốn giảm từ 10 xuống 8 phần, Bún Chả giảm từ 10 xuống 9 phần mà không bị tình trạng Lost Update.
  4. **Tổng hợp hóa đơn đầy đủ:** API `getOrderTracking` tổng hợp chính xác 2 đợt gọi với tổng tiền $100.000 + 80.000 = 180.000₫$.

### 2. Conflict Scenario 2: Khóa Lạc Quan (@Version) Trên `DiningSession`
- **Mô phỏng thực tế:** Hai giao dịch đồng thời cố gắng cập nhật ghi chú của cùng một phiên ăn mà không thông qua đồng bộ tuần tự.
- **Cơ chế kỹ thuật:** Trường `@Version private Long version;` trên Entity `DiningSession`:
  - Giao dịch 1 đọc phiên bản $v0$, cập nhật ghi chú và commit thành công $\rightarrow$ version tự động tăng lên $v1$.
  - Giao dịch 2 (vẫn giữ bản snapshot cũ $v0$) cố gắng ghi đè dữ liệu lên phiên ăn $\rightarrow$ Hibernate phát hiện phiên bản trong DB ($v1$) lệch với snapshot ($v0$) và lập tức ném ra ngoại lệ `ObjectOptimisticLockingFailureException`.
- **Kết quả kiểm chứng:** Test case bắt được ngoại lệ `ObjectOptimisticLockingFailureException` và xác nhận dữ liệu của Giao dịch 1 được bảo vệ an toàn 100%.

---

## IV. BỘ UNIT TESTS CÁC SERVICE NGHIỆP VỤ NÒNG CỐT

### 1. `KitchenServiceTest.java` (5 Test Cases)
- **Kiểm thử chuyển trạng thái tuần tự của đơn hàng (Order State Machine):**
  1. Món ăn đầu tiên chuyển sang `COOKING` $\rightarrow$ Toàn bộ đơn hàng tự động chuyển sang `COOKING` và bắn WebSocket STOMP tới Phục vụ.
  2. Mọi món ăn hoàn tất `READY` $\rightarrow$ Trạng thái đơn hàng tự động chuyển sang `READY`.
  3. Hủy 1 món ăn $\rightarrow$ Tổng tiền đơn hàng được tự động tính lại (loại trừ món đã hủy).
  4. Hủy toàn bộ món ăn $\rightarrow$ Trạng thái đơn hàng tự động chuyển sang `CANCELLED`.
  5. Cập nhật món không tồn tại $\rightarrow$ Ném `ResourceNotFoundException`.

### 2. `CashierServiceTest.java` (8 Test Cases)
- **Kiểm thử nghiệp vụ tính tiền & chốt hóa đơn POS:**
  1. `getBillPreview`: Tính toán tiền hàng, tự động tính **VAT 8%** theo quy tắc làm tròn `RoundingMode.HALF_UP`.
  2. Đếm chính xác số lượng món chưa phục vụ (`unservedCount > 0`).
  3. **Chặn thanh toán:** Nếu bàn còn món đang chế biến (`COOKING`/`PENDING`) và không có cờ `forceCheckout = true` $\rightarrow$ Ném `AppException` (HTTP 400).
  4. **Cho phép thanh toán cưỡng chế:** Nếu có `forceCheckout = true`, cho phép chốt hóa đơn, tự động đóng session và chuyển bàn sang `DIRTY`.
  5. **Chống thanh toán trùng lặp:** Phiên ăn đã có hóa đơn $\rightarrow$ Ném `AppException` (HTTP 409 CONFLICT).
  6. **Phê duyệt giảm giá lớn:** Mức chiết khấu $> 30\%$ hoặc $> 200.000₫$ bắt buộc phải có mã PIN Quản lý 6 số; từ chối nếu thiếu PIN hoặc PIN sai.
  7. Giảm giá lớn có mã PIN Quản lý hợp lệ $\rightarrow$ Phê duyệt thành công.
  8. Thanh toán tiền mặt mà khách đưa thiếu tiền $\rightarrow$ Ném ngoại lệ báo rõ số tiền còn thiếu.

### 3. `RestaurantTableServiceTest.java` (6 Test Cases)
- **Kiểm thử sơ đồ bàn & Khóa an toàn Buffer Time Lock:**
  1. **Buffer Lock kích hoạt:** Trong vòng 60 phút trước giờ hẹn của khách đặt trước `CONFIRMED`, từ chối xếp khách vãng lai (`OCCUPIED`) $\rightarrow$ Ném ngoại lệ cảnh báo an toàn.
  2. Cho phép Quản lý mở bàn nếu bật cờ `forceOverride = true`.
  3. Cho phép mở bàn bình thường nếu giờ khách đặt còn xa (`> 60 phút`).
  4. Chặn đổi trạng thái bàn `OCCUPIED` sang `AVAILABLE` nếu bàn còn đơn món chưa thanh toán POS.
  5. Chặn giảm sức chứa bàn xuống dưới số lượng khách đang ngồi ăn thực tế.
  6. Hủy món tại bàn: Cập nhật `CANCELLED`, ghi lý do hủy vào `note`, trừ tiền và tự động cập nhật trạng thái đơn.

### 4. `ReservationServiceTest.java` (4 Test Cases)
- **Kiểm thử đặt bàn trực tuyến:**
  1. Từ chối đặt bàn cho thời gian trong quá khứ (Quy tắc BR-15).
  2. Đặt bàn thành công trong tương lai với trạng thái `PENDING`, cấp mã `RES-YYYYMMDD-XXXX` và lưu đúng giá vốn/giá bán các món đặt trước.
  3. Quản lý gán bàn trống: Cập nhật `Reservation` sang `CONFIRMED` và `RestaurantTable` sang `RESERVED`.
  4. Chặn xếp bàn nếu bàn được chọn không ở trạng thái trống (`AVAILABLE`).

---

## V. KẾT QUẢ CHẠY TOÀN BỘ HỆ THỐNG KIỂM THỬ (TEST EXECUTION REPORT)

Lệnh thực thi kiểm thử toàn bộ dự án:
```bash
mvn clean test
```

Kết quả thực tế ghi nhận:
```text
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.romsteam.roms.concurrency.OrderConcurrencyTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0 -- in OrderConcurrencyTest
[INFO] Running com.romsteam.roms.RomsApplicationTests
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0 -- in RomsApplicationTests
[INFO] Running com.romsteam.roms.service.CashierServiceTest
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0 -- in CashierServiceTest
[INFO] Running com.romsteam.roms.service.KitchenServiceTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0 -- in KitchenServiceTest
[INFO] Running com.romsteam.roms.service.ReservationServiceTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0 -- in ReservationServiceTest
[INFO] Running com.romsteam.roms.service.RestaurantTableServiceTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0 -- in RestaurantTableServiceTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 26, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  35.360 s
```

> 🎯 **Kết luận:** Hệ thống đạt tỷ lệ **100% Pass (26/26 test cases)**, đáp ứng trọn vẹn tiêu chuẩn đánh giá khắt khe nhất của đồ án tốt nghiệp SWP391.
