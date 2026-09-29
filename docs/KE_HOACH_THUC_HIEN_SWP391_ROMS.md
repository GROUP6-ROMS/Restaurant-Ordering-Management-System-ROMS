# BẢN KẾ HOẠCH TÁC CHIẾN SWP391 — CHIẾN LƯỢC BACKEND-FIRST
## DỰ ÁN: ROMS (Restaurant Ordering Management System)
### CĂN CỨ THIẾT KẾ: STITCH PROJECT ID `8715052598064593406` (BASELINE v1.0.0)

---

> **Giảng viên hướng dẫn / Reviewer cao cấp:** Bộ môn Kỹ thuật Phần mềm (Software Engineering) — Trường Đại học FPT  
> **Chiến lược tiếp cận:** **BACKEND-FIRST (Xây móng Backend vững chắc trước → Ghép Frontend sau)**  
> **Quy mô nhân sự:** 03 Kỹ sư sinh viên (Phân công Vertical API Slices & T-shaped Skills)  
> **Tổng thời gian:** 06 Tuần Code nước rút (36 ngày làm việc: Thứ Hai → Thứ Bảy, Chủ Nhật Code Review & Merge)

---

## 1. ĐÁNH GIÁ CHIẾN LƯỢC TỪ GIẢNG VIÊN CAO CẤP SWP391

Chào các em,

Thầy **hoàn toàn ủng hộ và đánh giá rất cao** quyết định chuyển sang chiến lược **"Backend-First"** của nhóm. Đây là tư duy chuẩn chỉ của các kỹ sư phần mềm chuyên nghiệp:

1. **Xây móng trước, dựng nhà sau:** Hệ thống ROMS có nghiệp vụ cực kỳ phức tạp (Order State Machine, Dining Session gom bàn, Token HMAC chống giả mạo QR, Idempotency Key chống đặt trùng, Optimistic Locking, Billing & Thanh toán). Nếu làm Frontend song song khi Backend chưa ổn định, các em sẽ phải mock data liên tục, sau này ghép vào sẽ sinh ra hàng tá lỗi ngầm.
2. **Không còn "Demo ảo":** Nhiều nhóm bị Hội đồng đánh trượt vì giao diện bấm rất mượt nhưng F12 lên toàn lỗi 500 hoặc dữ liệu ảo hardcode. Với Backend-First, 100% API được kiểm thử thông qua Swagger UI, Postman Collection và Unit Test trước. Khi nối Frontend vào, hệ thống là một sản phẩm chạy thật 100%.
3. **Frontend tiến độ thần tốc ở giai đoạn sau:** Vì giao diện 18 màn hình trên **Stitch (`8715052598064593406`)** đã được **Khóa cứng (Design Freeze)**, các em đã biết chính xác từng màn hình cần API gì, DTO trường dữ liệu nào. Khi Backend đã trả ra JSON chuẩn, việc cắt React và gắn API sẽ chỉ mất khoảng 2 tuần là xong toàn bộ.

---

## 2. PHÂN KỲ CHIẾN LƯỢC (3 GIAI ĐOẠN)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 1: BACKEND CORE & API ENGINE (Tuần 1 → Tuần 3 | Ngày 01 → Ngày 18)                │
│ • Thiết lập DB MS SQL Server, Docker Compose, Base Spring Boot, Security JWT                │
│ • Hoàn thiện 100% RESTful APIs: Dining Session, QR HMAC, Menu, Order State Machine,         │
│   KDS, Waiter, Cashier Billing, VNPay Sandbox, Shift Handover, Reservation, Admin           │
│ • Nghiệm thu bằng: Postman Collection (Green 100%) + Swagger UI + JUnit Test Concurrency    │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 2: FRONTEND REACT & API INTEGRATION (Tuần 4 → Tuần 5 | Ngày 19 → Ngày 30)         │
│ • Cắt 18 màn hình từ Stitch Project 8715052598064593406 sang React Component sống           │
│ • Tuần 4: Customer Mobile Flow (QR, Menu, Cart, Tracking) + Kitchen KDS Terminal             │
│ • Tuần 5: Waiter Terminal, Cashier POS, Két tiền đóng ca, Manager Dashboard Admin           │
│ • Đấu nối trực tiếp với live API Backend (đã kiểm thử ở Giai đoạn 1)                        │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 3: ĐÓNG GÓI DOCKER, TEST ĐỒNG THỜI & TẬP DƯỢT BẢO VỆ (Tuần 6 | Ngày 31 → Ngày 36) │
│ • Chạy trơn tru Kịch bản Demo 9 bước (Golden Flow)                                          │
│ • Đóng gói Docker Compose 1-lệnh chạy trọn gói (MS SQL + Backend + Frontend Nginx)          │
│ • Hoàn thiện báo cáo SWP391 và Tập dượt phản biện Hội đồng (Mock Defense)                   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. PHÂN CHIA VAI TRÒ 3 THÀNH VIÊN THEO CHIẾN LƯỢC BACKEND-FIRST

| Thành viên | Trọng tâm Giai đoạn 1: Backend APIs | Trọng tâm Giai đoạn 2: Frontend Screens | Trọng tâm Giai đoạn 3: Testing & Defense |
| :--- | :--- | :--- | :--- |
| **Thành viên 1**<br>*(Team Lead / Core Architect)* | - Base Architecture, Docker Compose, Security JWT, RBAC.<br>- **Core Engine:** Dining Session, Order State Machine.<br>- Module Bếp: KDS APIs, SSE/WebSocket Event Stream.<br>- Concurrency: Idempotency Key, Optimistic Locking (`@Version`). | - Setup khung React Vite, Axios Client, Auth Context.<br>- `SCR-01` Staff Login Screen.<br>- `SCR-15` Kitchen Display System (KDS) kèm âm thanh chuông & timer. | - Đóng gói Docker production (Multi-stage build).<br>- Viết Concurrency Unit Test (Race Conditions, Duplicate Order).<br>- Điều phối bảo vệ kỹ thuật. |
| **Thành viên 2**<br>*(Customer Experience Engineer)* | - Thuật toán sinh/kiểm tra mã QR HMAC-SHA256 Token.<br>- Menu & Category APIs, Upload ảnh món ăn.<br>- Cart Validation, Batch Order Placement API.<br>- Customer Order Tracking API, Đặt bàn trước (Reservation) & Scheduler auto-release no-show. | - `Landing Page` ROMS Homepage.<br>- `Reservation` Trang Đặt Bàn Trực Tuyến.<br>- `SCR-09` Table Welcome Screen.<br>- `SCR-10` Customer Mobile Menu.<br>- `SCR-12` Customer Mobile Cart.<br>- `SCR-11` Customer Order Tracking. | - Tối ưu UI Mobile-First (360-414px), kiểm thử responsive.<br>- Viết User Manual cho Khách hàng.<br>- Phụ trách kịch bản demo trên điện thoại di động thật. |
| **Thành viên 3**<br>*(Staff Operations & Billing)* | - Thiết kế Schema MS SQL Server DDL & Master Seed Data.<br>- Quản lý Bàn, Sơ đồ sảnh Waiter, Chuyển bàn.<br>- Billing Aggregation (tổng hợp bill, chặn tính tiền BR-16).<br>- Thanh toán Tiền mặt + Tích hợp VNPay Sandbox Webhook IPN.<br>- Quản lý Két tiền đóng ca (Shift Handover), Admin CRUD Nhân sự & Thực đơn, Dashboard Analytics. | - `SCR-05` Waiter Terminal & Sơ đồ sảnh.<br>- `SCR-06` Chi tiết đơn & Gọi món tại bàn.<br>- `SCR-07` Chuyển bàn & Đổi trạng thái.<br>- `SCR-02` POS Terminal Thu Ngân.<br>- `SCR-03` Hóa đơn & Lịch sử POS.<br>- `SCR-04` Két tiền ca.<br>- `SCR-21` Nhân sự, `SCR-22` Menu, `SCR-24` Dashboard. | - Xây dựng bộ Seed Data demo (12 bàn, 20 món ăn, 4 user).<br>- Kiểm thử kịch bản thanh toán VNPay và tiền mặt.<br>- Chuẩn bị tài liệu Database Document (ERD, Data Dictionary). |

---

## 4. KẾ HOẠCH CHI TIẾT TỪNG NGÀY (DAY-BY-DAY PLAN)

---

### GIAI ĐOẠN 1: XÂY DỰNG 100% BACKEND CORE & API ENGINE (NGÀY 01 → 18)

#### Tuần 1: Thiết Lập Nền Tảng, Database, Security & Quản Trị Nhân Sự
* **Ngày 01 (Thứ Hai) — Khởi tạo môi trường Backend & Schema Database:**
  * **TV 1:** Khởi tạo Spring Boot 3.x trong `SourceCode/backend` (Dependencies: Web, Security, JPA, MS SQL, Lombok, Validation, JJWT). Cấu hình Base Response DTO (`ApiResponse<T>`) và Global Exception Handler (`@RestControllerAdvice`).
  * **TV 2:** Cấu hình Swagger/OpenAPI 3.0 (`springdoc-openapi`), tạo trang tài liệu API tại `/swagger-ui.html`. Tạo DTO mẫu cho toàn dự án.
  * **TV 3:** Viết file `SourceCode/docker-compose.yml` chạy MS SQL Server 2022. Viết file script khởi tạo bảng DDL `docs/schema_roms.sql` (toàn bộ 10 bảng: `roles`, `users`, `tables`, `categories`, `menu_items`, `dining_sessions`, `orders`, `order_items`, `bills`, `reservations`).
  * *DoD:* Chạy `docker compose up` lên MS SQL; Chạy Spring Boot kết nối thành công DB; Mở Swagger UI hiển thị không lỗi.
* **Ngày 02 (Thứ Ba) — JPA Entities, Repositories & Optimistic Locking:**
  * **TV 1:** Viết Entities & Repositories cho `User`, `Role`, `DiningSession`. Thêm trường `@Version private Long version` cho `DiningSession`.
  * **TV 2:** Viết Entities & Repositories cho `Category`, `MenuItem`, `Reservation`.
  * **TV 3:** Viết Entities & Repositories cho `Table`, `Order`, `OrderItem`, `Bill`. Thêm trường `@Version private Long version` cho `Order` (phục vụ NFR-R03).
  * *DoD:* Hibernate tự động validate schema với MS SQL Server không văng lỗi mapping.
* **Ngày 03 (Thứ Tư) — Spring Security & JWT Authentication:**
  * **TV 1:** Cấu hình `SecurityFilterChain` (Stateless, BCryptPasswordEncoder), viết `JwtTokenProvider` (sinh & verify staff token 8h, customer token 4h), `JwtAuthenticationFilter`.
  * **TV 2:** Viết API `POST /api/v1/auth/login` (nhận username/password, kiểm tra mã hoá BCrypt, trả về JWT + User Info + Role).
  * **TV 3:** Viết script seed data 4 tài khoản mặc định (`admin`, `cashier`, `waiter`, `chef`) với password mã hoá. Viết API `POST /api/v1/auth/logout`.
  * *DoD:* Dùng Postman login với `waiter/123456` nhận mã 200 OK + JWT Token; Thử token giả nhận 401 Unauthorized.
* **Ngày 04 (Thứ Năm) — Phân Quyền RBAC & Quản Lý Nhân Sự (SCR-21):**
  * **TV 1:** Thiết lập Annotation phân quyền `@PreAuthorize("hasRole('MANAGER')")` cho các endpoint quản trị.
  * **TV 2:** Viết API `GET /api/v1/admin/users` (danh sách nhân viên kèm phân trang, tìm kiếm theo tên/role).
  * **TV 3:** Viết API `POST /api/v1/admin/users` (tạo nhân viên mới), `PUT /api/v1/admin/users/{id}` (cập nhật thông tin/role), `PATCH /api/v1/admin/users/{id}/reset-password`.
  * *DoD:* Dùng token Manager gọi API tạo nhân viên mới thành công; Dùng token Waiter gọi nhận lỗi 403 Forbidden.
* **Ngày 05 (Thứ Sáu) — Quản Lý Bàn & Phân Khu Sảnh (SCR-05):**
  * **TV 1:** Viết `TableService` quản lý trạng thái bàn (`AVAILABLE`, `OCCUPIED`, `DIRTY`, `RESERVED`).
  * **TV 2:** Viết API `GET /api/v1/tables` (danh sách bàn theo khu vực Tầng 1, Tầng 2, Sân vườn).
  * **TV 3:** Viết API `POST /api/v1/tables` (tạo bàn), `PUT /api/v1/tables/{id}` (sửa số ghế/tên bàn), `PATCH /api/v1/tables/{id}/status` (chuyển trạng thái dọn dẹp `DIRTY` → `AVAILABLE`).
  * *DoD:* Tạo 12 bàn mẫu trong DB; Test chuyển trạng thái bàn qua API phản hồi < 100ms.
* **Ngày 06 (Thứ Bảy) — Quản Lý Danh Mục & Thực Đơn (SCR-22):**
  * **TV 1:** Viết service upload và lưu trữ hình ảnh món ăn cục bộ (`/uploads/images`), sinh URL tĩnh.
  * **TV 2:** Viết API `GET /api/v1/categories`, `POST /api/v1/categories`, `PUT /api/v1/categories/{id}`.
  * **TV 3:** Viết APIs cho Món ăn: `GET /api/v1/menu-items` (kèm lọc category, tìm kiếm), `POST /api/v1/menu-items`, `PUT /api/v1/menu-items/{id}`, `PATCH /api/v1/menu-items/{id}/availability` (bật/tắt còn/hết hàng nhanh chóng).
  * *DoD:* Thêm được 15 món ăn mẫu có ảnh vào DB; Gọi Postman lấy menu phân nhóm chuẩn xác.

---

#### Tuần 2: Phân Hệ Khách Hàng (QR Security, Dining Session, Giỏ Hàng & Đặt Món)
* **Ngày 07 (Thứ Hai) — Thuật toán Mã QR HMAC-SHA256 & Bàn (FR-02, NFR-S02):**
  * **TV 1:** Viết `QrSecurityService`: Sinh chuỗi token mã hóa HMAC-SHA256 từ `tableId + salt + secretKey`.
  * **TV 2:** Viết API `POST /api/v1/tables/verify-qr`: Tiếp nhận `tableId` và `token`, kiểm tra tính toàn vẹn (từ chối mã giả mạo hoặc hết hạn).
  * **TV 3:** Viết API `GET /api/v1/tables/{id}/qr-code`: Trả về hình ảnh mã QR (dạng base64 hoặc PNG) để Manager in ra dán tại bàn.
  * *DoD:* Sinh token cho Bàn 04; Xác thực token đúng trả về hợp lệ; Đổi 1 ký tự trên token trả về lỗi 403 Invalid QR Token.
* **Ngày 08 (Thứ Ba) — Dining Session Engine (Trái tim hệ thống - BR-01, BR-02, BR-03):**
  * **TV 1:** Cài đặt `DiningSessionService.initOrJoinSession(tableId)`:
    * Kiểm tra: Nếu bàn đang có Session `ACTIVE` → trả về `sessionId` hiện tại (để nhiều khách cùng bàn dùng chung - BR-02).
    * Nếu chưa có → tạo Session mới, lưu thời gian bắt đầu `opened_at`, chuyển trạng thái bàn sang `OCCUPIED` (BR-01).
    * Đảm bảo tính Transactional chống mở 2 session song song trên 1 bàn.
  * **TV 2:** Viết API `POST /api/v1/sessions/join` trả về JWT Session Token cho khách hàng.
  * **TV 3:** Viết API `GET /api/v1/sessions/{id}` lấy thông tin tổng quan phiên ăn của bàn.
  * *DoD:* Bắn 2 request join bàn 05 cùng lúc → Cả 2 đều nhận về cùng 1 `sessionId` duy nhất, không tạo session rác.
* **Ngày 09 (Thứ Tư) — API Thực Đơn Khách & Tối Ưu Tốc Độ Tải (NFR-P01, NFR-P04):**
  * **TV 1:** Tối ưu hóa truy vấn SQL lấy Menu: Viết câu lệnh JOIN Category + MenuItem có đánh chỉ mục (Index) trên `category_id` và `is_available`.
  * **TV 2:** Viết API `GET /api/v1/customer/menu`: Trả về danh sách món ăn chỉ lấy các món đang bán (`is_available = true`), định dạng giá tiền chuẩn.
  * **TV 3:** Viết Unit Test kiểm tra tính đúng đắn của Menu Service.
  * *DoD:* Query menu trả về kết quả trong vòng dưới 50ms trên máy dev.
* **Ngày 10 (Thứ Năm) — Batch Order Placement & Idempotency Key Engine (FR-06, NFR-R02):**
  * **TV 1:** Viết `OrderService.createBatchOrder()`:
    * Lưu snapshot đơn giá món tại thời điểm đặt (`order_items.unit_price`) thỏa mãn BR-17.
    * Kiểm tra `idempotencyKey`: Lưu key vào cache/bảng tạm. Nếu phát hiện key trùng lặp trong vòng 10 giây (do mạng chậm khách bấm đúp) → Chặn tạo order mới, trả về order cũ.
  * **TV 2:** Viết DTO validation BR-04: Đơn hàng bắt buộc có ít nhất 1 món, số lượng từng món > 0, món ăn phải đang còn hàng.
  * **TV 3:** Tạo quan hệ gán `order.session_id` chính xác với Dining Session đang mở (BR-14).
  * *DoD:* Dùng Postman bắn cùng 1 payload kèm `idempotencyKey = "uuid-123"` 2 lần liên tục → Chỉ có 1 Order được tạo vào DB.
* **Ngày 11 (Thứ Sáu) — Khách Theo Dõi Đơn Hàng & Hủy Món (SCR-11, FR-07, BR-05):**
  * **TV 1:** Viết API `GET /api/v1/sessions/{id}/orders`: Lấy toàn bộ các mẻ order của bàn, gom nhóm chi tiết theo từng món và trạng thái (`PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `SERVED`).
  * **TV 2:** Viết API `POST /api/v1/orders/{orderId}/cancel` (Khách tự hủy đơn):
    * Kiểm tra nghiêm ngặt BR-05: Chỉ cho phép hủy khi Order ở trạng thái `PENDING`.
    * Nếu Order đã chuyển sang `PREPARING` → Từ chối với mã 400 Bad Request: *"Bếp đã bắt đầu nấu, quý khách không thể hủy món!"*.
  * **TV 3:** Viết API `POST /api/v1/service-requests` (Khách gọi nhân viên - FR-11: lấy nước, lấy đá, tính tiền).
  * *DoD:* Tạo order mới → Hủy thành công; Cập nhật status order thành PREPARING → Gọi API hủy nhận lỗi 400 như thiết kế.
* **Ngày 12 (Thứ Bảy) — Đặt Bàn Trước (Reservation) & Scheduler Tự Hủy (FR-14, BR-13, BR-15, NFR-R06):**
  * **TV 1:** Viết Spring Scheduled Task (`@Scheduled(cron = "0 * * * * *")` chạy mỗi 60 giây): Quét các đặt bàn quá 20 phút mà khách không đến (No-show) → Tự động hủy và chuyển bàn về `AVAILABLE`.
  * **TV 2:** Viết API `POST /api/v1/reservations`: Kiểm tra BR-15 (thời gian đặt phải ở tương lai), kiểm tra bàn trống không trùng lịch.
  * **TV 3:** Viết API `POST /api/v1/reservations/{id}/check-in`: Nhân viên bấm check-in khi khách đến → tự động mở Session và gán bàn.
  * *DoD:* Đặt bàn trước; Đổi thời gian quá 20 phút → Scheduler chạy và tự chuyển status reservation thành `CANCELLED_NO_SHOW`.

---

#### Tuần 3: Phân Hệ Bếp (KDS), Bồi Bàn & Thu Ngân POS (Thanh Toán & Két Tiền)
* **Ngày 13 (Thứ Hai) — Order State Machine Engine (BR-06, BR-07):**
  * **TV 1:** Cài đặt bộ máy kiểm soát trạng thái Order nghiêm ngặt:
    * Luồng chuẩn: `PENDING` → `CONFIRMED` → `PREPARING` → `READY` → `SERVED`.
    * Luồng hủy/từ chối: `PENDING` → `CANCELLED` hoặc `REJECTED`.
    * Chặn đứng mọi hành vi nhảy cóc (ví dụ `PENDING` nhảy thẳng lên `SERVED` văng `IllegalStateTransitionException`).
  * **TV 2:** Viết bộ Unit Test 15 test cases bao phủ toàn bộ các chuyển đổi hợp lệ và bất hợp lệ của State Machine.
  * **TV 3:** Phân quyền API: Chỉ Chef được gọi cập nhật `PREPARING`/`READY`; Chỉ Waiter được gọi cập nhật `CONFIRMED`/`SERVED`.
  * *DoD:* Test suite State Machine pass 100%; Gọi API nhảy trạng thái sai trả về mã lỗi 422 Unprocessable Entity.
* **Ngày 14 (Thứ Ba) — KDS Backend APIs & Real-time Event Stream (SCR-15, NFR-P03):**
  * **TV 1:** Triển khai Server-Sent Events (SSE) `/api/v1/kitchen/stream` hoặc API Polling tối ưu: Bất cứ khi nào có Order mới hoặc đổi trạng thái, event được bắn về KDS ngay lập tức.
  * **TV 2:** Viết API `GET /api/v1/kitchen/orders`: Lấy danh sách món đang chờ nấu, sắp xếp theo thời gian đặt cũ nhất lên trước (FIFO).
  * **TV 3:** Viết API `PATCH /api/v1/kitchen/orders/{id}/status`: Bếp nhận đơn, bấm bắt đầu nấu, bấm nấu xong.
  * *DoD:* Tạo đơn hàng mới từ Postman → Client SSE nhận được payload đơn hàng mới trong vòng dưới 1 giây.
* **Ngày 15 (Thứ Tư) — Bồi Bàn Sơ Đồ Bàn & Chuyển Bàn (SCR-05, SCR-06, SCR-07):**
  * **TV 1:** Viết nghiệp vụ chuyển bàn `TableService.transferTable(fromTableId, toTableId)`: Kiểm tra bàn đích phải `AVAILABLE`; chuyển toàn bộ Session và Orders sang bàn mới; Bàn cũ chuyển sang `DIRTY`.
  * **TV 2:** Viết API `GET /api/v1/waiter/floor-plan`: Trả về sơ đồ toàn bộ bàn kèm thời gian khách ngồi, số món đang chờ nấu, thông báo gọi phục vụ.
  * **TV 3:** Viết API `POST /api/v1/orders/waiter-take`: Cho phép bồi bàn tạo order hộ khách tại bàn. Viết API `PATCH /api/v1/orders/{id}/serve` (đánh dấu đã bưng món ra bàn).
  * *DoD:* Chuyển bàn 01 sang bàn 03 thành công; Bàn 01 chuyển xám DIRTY; Bàn 03 giữ nguyên session và danh sách món.
* **Ngày 16 (Thứ Năm) — Billing Aggregation & Chặn Thanh Toán (SCR-02, BR-08, BR-09, BR-10, BR-16):**
  * **TV 1:** Viết `BillingService.generateBill(sessionId)`:
    * Tổng hợp toàn bộ Order có status `SERVED` (bỏ qua món hủy).
    * Áp dụng BR-16: Chặn cứng thanh toán nếu trong Session còn món đang `PENDING`, `CONFIRMED`, `PREPARING`, `READY`. Ném ngoại lệ `SessionHasUnfinishedOrdersException`.
  * **TV 2:** Viết API `GET /api/v1/bills/session/{sessionId}`: Trả về chi tiết tạm tính, tiền món, VAT 8%, tổng cộng.
  * **TV 3:** Viết API `POST /api/v1/bills/checkout-cash`: Thanh toán tiền mặt, nhập tiền khách đưa, tính tiền thừa, cập nhật Bill `PAID`, đóng Session `COMPLETED`, chuyển Bàn `DIRTY`.
  * *DoD:* Bàn còn món đang nấu gọi checkout nhận 400 Bad Request; Khi tất cả món đã SERVED, checkout tiền mặt thành công.
* **Ngày 17 (Thứ Sáu) — Cổng Thanh Toán VNPay Sandbox & Quản Lý Két Tiền (SCR-04, FR-13, NFR-S08):**
  * **TV 1:** Viết `VnPayService`: Tạo URL thanh toán VNPay và sinh chuỗi mã VietQR động kèm checksum HMAC-SHA512.
  * **TV 2:** Viết Webhook IPN `GET /api/v1/payment/vnpay-callback`: Xác thực chữ ký VNPay, kiểm tra số tiền khớp với hóa đơn, tự động đóng phiên và bàn.
  * **TV 3:** Viết `ShiftHandoverService` (SCR-04): API mở ca `POST /api/v1/shifts/open`, API đóng ca `POST /api/v1/shifts/close` (đếm tiền mặt thực tế, kiểm tra chênh lệch doanh thu hệ thống).
  * *DoD:* Gọi API VNPay sinh URL thanh toán hợp lệ; Giả lập gọi Webhook IPN thành công → Hoá đơn chuyển sang `PAID`.
* **Ngày 18 (Thứ Bảy) — Dashboard Báo Cáo Doanh Thu & Tổng Duyệt Backend (SCR-24, Milestone Backend Complete):**
  * **TV 1:** Chạy toàn bộ bộ test suite JUnit (State Machine, Token Validator, Concurrency).
  * **TV 2:** Export toàn bộ Postman Collection có test scripts tự động kiểm tra status code 200/201.
  * **TV 3:** Viết các câu query JPA thống kê cho Dashboard: Doanh thu theo ngày/tháng, số lượng đơn, top 5 món bán chạy nhất (`SCR-24`).
  * *DoD:* **MILESTONE BACKEND HOÀN THÀNH 100%**: Swagger UI có đầy đủ 45 endpoints; Postman chạy Runner pass 100%; Database lưu trữ chuẩn chỉ.

---

### GIAI ĐOẠN 2: FRONTEND REACT & GHÉP NỐI LIVE API (NGÀY 19 → 30)

#### Tuần 4: Khung Frontend, Giao Diện Khách Hàng (QR Mobile) & Bếp (KDS)
* **Ngày 19 (Thứ Hai) — Khởi tạo React & Khung Thư Viện Dùng Chung:**
  * **TV 1:** Khởi tạo React (Vite) trong `SourceCode/frontend`, cấu hình TailwindCSS tokens theo bảng màu Stitch (`#D32F2F`, `#FF6F00`, `#2E7D32`), cài đặt Lucide-react, Axios, React Router.
  * **TV 2:** Viết Axios Interceptor (tự động gắn JWT Token, bắt lỗi 401 redirect Login, toast error message tiếng Việt). Tạo `AuthContext` và `CartContext`.
  * **TV 3:** Cắt giao diện **SCR-01 Staff Login Screen**: Đăng nhập nhân viên, lưu token vào localStorage, phân quyền redirect theo Role.
  * *DoD:* Đăng nhập tài khoản thật từ Backend → Chuyển hướng đúng trang theo quyền.
* **Ngày 20 (Thứ Ba) — Cắt Giao Diện Mobile Khách Hàng (SCR-09, SCR-10):**
  * **TV 1:** Hỗ trợ xử lý đọc query param `?token=...&tableId=...` và gọi API xác thực QR.
  * **TV 2:** Cắt giao diện **SCR-09 Table Welcome Screen** (Màn chào đón bàn) và **SCR-10 Customer Mobile Menu** (Menu số, cuộn mượt, tab lọc danh mục, chi tiết món).
  * **TV 3:** Xây dựng component Thẻ món ăn (`DishCard`), hiển thị ảnh món, giá tiền định dạng VND, nút Thêm vào giỏ.
  * *DoD:* Mở giao diện trên Chrome giả lập điện thoại di động: Quét QR hợp lệ hiện trang Chào mừng → Bấm gọi món hiện Menu đầy đủ dữ liệu từ Backend.
* **Ngày 21 (Thứ Tư) — Cắt Giao Diện Giỏ Hàng & Gửi Đơn (SCR-12):**
  * **TV 1:** Kiểm tra xử lý sinh UUID Idempotency Key trên Frontend khi mở giỏ hàng.
  * **TV 2:** Cắt giao diện **SCR-12 Customer Mobile Cart**: Danh sách món trong giỏ, nút +/- tăng giảm số lượng, ô nhập ghi chú món (*"Ít cay, không hành"*), tổng tiền tạm tính.
  * **TV 3:** Tích hợp nút "Gửi đơn hàng" gọi API `POST /api/v1/orders`, hiển thị loading spinner và chuyển trang khi gửi đơn thành công.
  * *DoD:* Chọn 2 món vào giỏ, nhập ghi chú, bấm Gửi đơn → Backend nhận và lưu đúng dữ liệu.
* **Ngày 22 (Thứ Năm) — Cắt Giao Diện Khách Theo Dõi Đơn & Gọi Phục Vụ (SCR-11):**
  * **TV 1:** Cài đặt cơ chế Polling 3 giây tự động tải lại trạng thái đơn hàng.
  * **TV 2:** Cắt giao diện **SCR-11 Customer Table & Order Tracking**: Tiến trình nấu từng món, nút "Hủy món" (có dialog xác nhận), nút "Gọi nhân viên" (nước, đá, tính tiền).
  * **TV 3:** Xử lý điều kiện hiển thị: Nếu món đã chuyển `PREPARING` thì nút Hủy tự động ẩn.
  * *DoD:* Khách gửi đơn xong thấy trạng thái Đang chờ; Thử bấm hủy món thành công khi bếp chưa nhận.
* **Ngày 23 (Thứ Sáu) — Cắt Giao Diện Kitchen Display System (SCR-15):**
  * **TV 1:** Cắt giao diện **SCR-15 Kitchen Display System (KDS)** theo đúng thiết kế Stitch: Dark mode (`#1A1412`), vé Kanban ticket, hiển thị rõ số bàn và ghi chú món.
  * **TV 2:** Tích hợp chuông âm thanh (audio alert) kêu "ting ting" khi có order mới đổ về bếp.
  * **TV 3:** Xây dựng Component bộ đếm thời gian nấu (Timer đếm giây). Bấm nút `Bắt đầu nấu` và `Nấu xong` gọi trực tiếp API Backend.
  * *DoD:* Khách đặt món trên điện thoại → Màn hình KDS lập tức nổi vé mới kèm tiếng chuông; Bếp bấm nút chuyển trạng thái mượt mà.
* **Ngày 24 (Thứ Bảy) — Cắt Giao Diện Landing Page & Đặt Bàn Online:**
  * **TV 1 & 3:** Kiểm tra rà soát và fix các lỗi hiển thị giữa Khách hàng và KDS.
  * **TV 2:** Cắt giao diện **Landing Page** giới thiệu nhà hàng và **Trang Đặt Bàn Trực Tuyến - ROMS Reservation** (chọn ngày, giờ, số khách, vị trí bàn).
  * *DoD:* Đặt bàn online thành công, dữ liệu được ghi nhận vào hệ thống.

---

#### Tuần 5: Bồi Bàn, Thu Ngân POS, Két Tiền & Quản Trị Admin
* **Ngày 25 (Thứ Hai) — Cắt Giao Diện Waiter Terminal & Sơ Đồ Bàn (SCR-05):**
  * **TV 1:** Tích hợp polling cập nhật trạng thái bàn trên sơ đồ sảnh.
  * **TV 2:** Hiển thị thông báo khi có khách bấm nút gọi phục vụ trên `SCR-05`.
  * **TV 3:** Cắt giao diện **SCR-05 Waiter Terminal**: Sơ đồ lưới các bàn với màu sắc chỉ báo rõ ràng (Xanh = Trống, Xanh dương = Có khách, Xám = Cần dọn, Cam = Đã đặt), lọc theo khu vực.
  * *DoD:* Bồi bàn đăng nhập thấy toàn bộ sơ đồ bàn thực tế của nhà hàng.
* **Ngày 26 (Thứ Ba) — Chi Tiết Đơn Tại Bàn & Chuyển Bàn (SCR-06, SCR-07):**
  * **TV 1:** Tích hợp API chuyển bàn và kiểm tra cập nhật realtime.
  * **TV 2:** Cắt modal **SCR-07 Chuyển Bàn & Đổi Trạng Thái**: Chọn bàn nguồn, chọn bàn đích trống, bấm xác nhận chuyển.
  * **TV 3:** Cắt giao diện **SCR-06 Chi Tiết Đơn Đang Phục Vụ Tại Bàn**: Bồi bàn xem chi tiết món, gọi thêm món hộ khách, bấm nút "Đã bưng món" (`SERVED`).
  * *DoD:* Thao tác chuyển bàn và phục vụ món diễn ra trơn tru trên giao diện bồi bàn.
* **Ngày 27 (Thứ Tư) — Cắt Giao Diện Thu Ngân POS & Thanh Toán Tiền Mặt (SCR-02, SCR-03):**
  * **TV 1:** Xử lý bắt lỗi BR-16: Nếu bàn còn món đang nấu, giao diện POS hiển thị cảnh báo đỏ và khóa nút thanh toán.
  * **TV 2:** Xây dựng Component hoá đơn in nhiệt 80mm xem trước (**SCR-03 POS Invoice**).
  * **TV 3:** Cắt giao diện **SCR-02 POS Terminal Quầy Thu Ngân**: Danh sách bàn chờ tính tiền, chi tiết hóa đơn, popup thanh toán tiền mặt (nhập tiền khách đưa → tự tính tiền thừa).
  * *DoD:* Thu ngân chọn bàn 05, nhập tiền khách đưa, bấm hoàn tất thanh toán → Hóa đơn hiển thị để in, bàn chuyển sang xám Cần dọn dẹp.
* **Ngày 28 (Thứ Năm) — Tích Hợp Popup Quét Mã VNPay QR Trên POS (FR-13):**
  * **TV 1:** Tích hợp polling kiểm tra trạng thái hoá đơn sau khi mở popup VNPay.
  * **TV 2:** Tạo Component Modal hiển thị mã VietQR động kèm số tiền và logo ngân hàng.
  * **TV 3:** Xử lý luồng: Khi quét thanh toán thành công → Modal tự đóng, phát âm thanh báo thành công và in hóa đơn.
  * *DoD:* Bấm thanh toán VNPay → Quét mã test sandbox → Hệ thống tự động xác nhận thanh toán thành công.
* **Ngày 29 (Thứ Sáu) — Cắt Giao Diện Két Tiền Đóng Ca & Quản Trị Nhân Sự (SCR-04, SCR-21):**
  * **TV 1:** Tích hợp API phân quyền cho các trang quản trị.
  * **TV 2:** Cắt giao diện **SCR-21 Quản Lý Nhân Sự & Phân Quyền**: Danh sách nhân viên, modal thêm nhân viên mới, nút reset mật khẩu.
  * **TV 3:** Cắt giao diện **SCR-04 Cash Drawer & Shift Handover Close**: Bảng nhập số lượng từng mệnh giá tiền mặt (500k, 200k, 100k,...) để kiểm két cuối ca.
  * *DoD:* Thu ngân đóng ca nhập tiền thành công; Manager thêm được tài khoản nhân viên mới trên giao diện.
* **Ngày 30 (Thứ Bảy) — Cắt Giao Diện Quản Lý Thực Đơn & Dashboard Báo Cáo (SCR-22, SCR-24):**
  * **TV 1:** Rà soát và hoàn thiện toàn bộ kết nối giữa Frontend và Backend.
  * **TV 2:** Cắt giao diện **SCR-22 Quản Lý Thực Đơn**: Bảng danh sách món, thêm/sửa món, tải ảnh lên, công tắc bật/tắt còn hàng.
  * **TV 3:** Cắt giao diện **SCR-24 Báo Cáo & Hiệu Suất Vận Hành**: Tích hợp Recharts vẽ biểu đồ doanh thu theo thời gian, thẻ KPI doanh thu ngày, top 5 món bán chạy.
  * *DoD:* **HOÀN THÀNH 100% GIAO DIỆN & TÍCH HỢP TOÀN BỘ 18 MÀN HÌNH STITCH VỚI LIVE API**.

---

### GIAI ĐOẠN 3: ĐÓNG GÓI DOCKER, TEST ĐỒNG THỜI & BẢO VỆ (NGÀY 31 → 36)

* **Ngày 31 (Thứ Hai) — Đóng gói Docker Compose trọn gói (Deployment):**
  * **TV 1:** Viết `Dockerfile` nhiều tầng cho Backend (build jar bằng Maven/Gradle) và Frontend (build bundle bằng Node và phục vụ bằng Nginx).
  * **TV 2 & 3:** Kiểm tra lệnh `docker compose up -d` trên máy tính khác: Khởi chạy MS SQL + Backend API + Frontend Web chỉ với 1 câu lệnh duy nhất.
  * *DoD:* Hệ thống chạy độc lập hoàn toàn trên Docker môi trường production.
* **Ngày 32 (Thứ Ba) — Nạp Bộ Dữ Liệu Demo "Sạch & Đẹp" (Master Seed Data):**
  * **TV 3 (Chủ trì):** Viết script SQL nạp đầy đủ dữ liệu thực tế: 12 bàn ăn, 4 danh mục, 20 món ăn có hình ảnh rõ nét, 4 tài khoản nhân viên, các hoá đơn cũ trong quá khứ để Dashboard hiển thị biểu đồ đẹp mắt.
  * **TV 1 & 2:** Kiểm tra hiển thị dữ liệu trên tất cả các màn hình.
  * *DoD:* Mở hệ thống lên nhìn như một nhà hàng đang vận hành kinh doanh thật sự.
* **Ngày 33 (Thứ Tư) — Kiểm Thử Concurrency & Viết Test Report:**
  * **TV 1:** Chạy test script bắn đồng thời 50 request tạo đơn và update trạng thái để lấy log chứng minh Optimistic Locking và Idempotency Key hoạt động thật.
  * **TV 2 & 3:** Tổng hợp ảnh chụp kết quả kiểm thử vào tài liệu **Test Report** theo đúng mẫu của ĐH FPT.
  * *DoD:* Test Report hoàn chỉnh, có bằng chứng xử lý xung đột dữ liệu.
* **Ngày 34 (Thứ Năm) — Hoàn Thiện Bộ Tài Liệu Dự Án SWP391:**
  * **TV 1:** Hoàn thiện Architecture Document (Sơ đồ kiến trúc tầng, Sequence Diagram).
  * **TV 2:** Hoàn thiện User Manual (Hướng dẫn sử dụng Khách hàng & Nhân viên).
  * **TV 3:** Hoàn thiện Database Document (ERD chuẩn, Data Dictionary).
  * *DoD:* Bộ tài liệu dự án hoàn chỉnh, chuẩn chỉ bìa và định dạng.
* **Ngày 35 (Thứ Sáu) — Tập Dượt Kịch Bản Demo 9 Bước (Golden Flow):**
  * **Cả 3 thành viên:** Tập dượt demo không ngừng nghỉ luồng 9 bước:
    `Quét QR Bàn 04` → `Vào Session` → `Chọn món kèm ghi chú` → `Gửi đơn` → `Bếp KDS ting ting chuông, bấm nấu` → `Bồi bàn bưng món, bấm SERVED` → `Khách thấy trạng thái cập nhật` → `Thu ngân in bill thanh toán VNPay QR` → `Bàn đóng, Manager xem Dashboard`.
  * *DoD:* Cả nhóm phối hợp demo nhịp nhàng dưới 10 phút, không vấp một lỗi nào.
* **Ngày 36 (Thứ Bảy) — Tập Dượt Phản Biện Hội Đồng (Mock Defense) & Chốt Sản Phẩm:**
  * **Cả 3 thành viên:** Tập trả lời các câu hỏi xoáy của Giảng viên về Concurrency, JWT Expiry, State Machine, HMAC Token.
  * Đóng gói mã nguồn, tạo release tag `v1.0.0-final` trên GitHub, chuẩn bị slide thuyết trình 15 trang.
  * *DoD:* SẴN SÀNG 100% BƯỚC VÀO PHÒNG BẢO VỆ CHÍNH THỨC VỚI MỤC TIÊU ĐIỂM 9.5+.

---

*Kế hoạch này là kim chỉ nam tác chiến của nhóm. Hãy bắt đầu ngay với Ngày 01 của Giai đoạn 1!*
