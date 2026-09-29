# BẢN KẾ HOẠCH TÁC CHIẾN SWP391 — DỰ ÁN ROMS
## (Restaurant Ordering Management System)

> **Giảng viên hướng dẫn / Reviewer cao cấp:** Bộ môn Kỹ thuật Phần mềm (Software Engineering) — Trường Đại học FPT  
> **Căn cứ thiết kế:** UI/UX Stitch Project ID `8715052598064593406`  
> **Quy mô nhân sự:** 03 Kỹ sư sinh viên (Phân công Vertical Slices & T-shaped Skills)  
> **Thời gian thực thi:** 06 Tuần Code nước rút (36 ngày làm việc: Thứ Hai → Thứ Bảy, Chủ Nhật Code Review & Merge)

---

## LỜI NHẮN NHỦ TỪ GIẢNG VIÊN CAO CẤP SWP391

Chào các em,

Với tư cách là giảng viên hướng dẫn môn **SWP391**, thầy đã chứng kiến hàng chục nhóm sinh viên làm đề tài Quản lý Nhà hàng / Cafe. Có nhóm điểm 9.5 xuất sắc, nhưng cũng có không ít nhóm nhận điểm F ngay tại Hội đồng chấm thi cuối kỳ. Lý do trượt môn không bao giờ là do các em thiếu ý tưởng, mà nằm ở 4 "tử huyệt" kinh điển:
1. **Scope quá dàn trải nhưng rỗng ruột:** Nhận làm cả chục tính năng (voucher, chatbot AI, loyalty, đa chi nhánh) nhưng luồng gọi món cơ bản nhất lại bị crash, không thanh toán được.
2. **"Code dồn cuối kỳ" & Merge Conflict đẫm máu:** 3 người code độc lập không có API Contract chuẩn, tuần cuối gộp nhánh Git bị xung đột dữ liệu, DB mỗi người một kiểu.
3. **Phân chia không công bằng (1 người gánh team):** Hội đồng FPT chỉ cần mở Git Insight xem số lượng Commit, Pull Request và hỏi xoáy vào code 2 câu là biết ngay ai không làm, dẫn đến việc đánh rớt cá nhân.
4. **Không chứng minh được kỹ thuật chuyên sâu:** Không giải thích được Concurrency (2 khách cùng bấm nút đặt món, 2 nhân viên cùng cập nhật trạng thái bàn), dữ liệu bị nhảy cóc không theo State Machine.

Bộ UI/UX trên **Stitch (Project ID: `8715052598064593406`)** của nhóm các em đã được thiết kế rất chỉn chu, hiện đại (Tone màu Crimson Red `#D32F2F`, layout chuẩn công nghiệp từ KDS, POS, Waiter đến Mobile QR). Đây là lợi thế cạnh tranh cực lớn! Nhiệm vụ của các em bây giờ là biến 18 màn hình này thành một hệ thống sống, chạy mượt mà, đúng chuẩn kỹ nghệ phần mềm.

Thầy lập bản kế hoạch tác chiến **chi tiết đến từng ngày** cho 3 bạn dưới đây. Yêu cầu toàn đội tuân thủ kỷ luật sắt, không đốt cháy giai đoạn.

---

## 1. PHÂN CHIA VAI TRÒ & RANH GIỚI TRÁCH NHIỆM (3 THÀNH VIÊN)

Để bảo đảm cả 3 bạn đều có điểm **Coding, Architecture, Testing** đồng đều trước hội đồng, nhóm sẽ chia theo **Vertical Slices (Lát cắt chức năng dọc)** kết hợp với nghiệp vụ lõi (Actor):

```
                   ┌───────────────────────────────────────────────┐
                   │               ROMS CORE PLATFORM              │
                   └───────────────────────┬───────────────────────┘
                                           │
          ┌────────────────────────────────┼────────────────────────────────┐
          ▼                                ▼                                ▼
  【THÀNH VIÊN 1】                  【THÀNH VIÊN 2】                  【THÀNH VIÊN 3】
Team Leader & Core Architect       Customer Experience Engineer      Staff Operations & Billing
 • Base Platform & Docker           • Customer Mobile Web (QR Scan)   • Waiter Operations Terminal
 • Security (JWT + RBAC)            • Dining Session Join/Verify      • Table Map & Floor Management
 • Order State Machine Engine       • Menu Catalog & Food Details     • Cashier POS & Billing
 • Kitchen Display System (KDS)     • Cart & Batch Order Placement    • Cash / VNPay Sandbox Gateway
 • Concurrency & Idempotency        • Guest Order Tracking (Live)     • Shift Handover & Close
 • Real-time (SSE/WebSocket)        • Online Table Reservation        • Menu & Staff Admin CRUD
```

### Chi tiết phân công:

| Thành viên | Trách nhiệm chính | Trách nhiệm hỗ trợ & Quality Assurance |
| :--- | :--- | :--- |
| **Thành viên 1**<br>*(Team Lead / Core Architect)* | - Khởi tạo Project (Spring Boot, React, Docker Compose, MS SQL).<br>- Authentication & Authorization (Spring Security + JWT, Bcrypt).<br>- **Trái tim hệ thống:** Dining Session Engine & Order State Machine.<br>- Module Bếp: **Kitchen Display System (KDS)**.<br>- Kỹ thuật sâu: Idempotency Key, Optimistic Locking (`@Version`), WebSocket/SSE Broker. | - Review Pull Request của toàn nhóm.<br>- Viết Unit Test cho State Machine & Concurrency.<br>- Quản lý CI/CD & Deploy demo server. |
| **Thành viên 2**<br>*(Customer Experience Engineer)* | - Luồng thực khách (Customer Mobile-First UI 360-414px).<br>- Xác thực mã QR mã hoá HMAC-SHA256 Token.<br>- Giao diện Menu số, Lọc danh mục, Chi tiết món, Ghi chú món.<br>- Giỏ hàng phiên ăn, Gửi đơn hàng loạt (Batch Order).<br>- Màn hình theo dõi tiến độ món nấu thời gian thực.<br>- Phân hệ Đặt bàn trực tuyến (**ROMS Reservation**). | - Đảm bảo UX di động mượt mà, không giật lag.<br>- Tối ưu hình ảnh món ăn (CDN/Local WebP, Lazy Load).<br>- Viết Unit Test luồng QR Validator & Cart Logic. |
| **Thành viên 3**<br>*(Staff Operations & Billing)* | - Màn hình Trạm phục vụ bàn của Bồi bàn (**Waiter Terminal**).<br>- Sơ đồ sảnh & Trạng thái bàn (Available, Occupied, Dirty, Reserved).<br>- Nghiệp vụ Đổi bàn, Gộp bàn, Mở bàn thủ công cho khách vãng lai.<br>- Màn hình Thu ngân (**Cashier POS Terminal**), In hóa đơn, Tách/Gộp bill.<br>- Cổng thanh toán: Tiền mặt (Cash) + Sandbox VNPay QR.<br>- Quản lý két tiền đầu/cuối ca (**Shift Handover**).<br>- CRUD Menu, CRUD Danh mục, CRUD Nhân viên (Admin). | - Thiết kế Database Migrations (Liquibase / Flyway / DDL).<br>- Viết Seed Data thực tế (≥ 10 bàn, 15 món, 4 tài khoản staff).<br>- Viết Unit Test luồng tính tiền & thanh toán bill. |

---

## 2. MA TRẬN ÁNH XẠ MÀN HÌNH TỪ STITCH PROJECT `8715052598064593406`

| Mã màn hình Stitch | Tên màn hình trên Stitch Design | Phụ trách chính | Module liên quan |
| :--- | :--- | :---: | :--- |
| `Logo Emblem` | ROMS Logo Transparent Emblem | Cả nhóm | Brand Identity Asset |
| `SCR-01` | Staff Login Screen | **TV 1** | Security / Auth UI |
| `SCR-15` | Kitchen Display System (KDS) - Redesigned | **TV 1** | Kitchen Back-of-House |
| `SCR-09` | Table Welcome Screen (Mobile Guest) | **TV 2** | QR Scanning Landing |
| `SCR-10` | Customer Mobile Menu | **TV 2** | Menu Browsing |
| `SCR-12` | Customer Mobile Cart | **TV 2** | Cart & Item Notes |
| `SCR-11` | Customer Table & Order Tracking | **TV 2** | Live Order Progress Tracking |
| `Reservation` | Trang Đặt Bàn Trực Tuyến - ROMS Reservation | **TV 2** | Advance Table Booking |
| `Landing Page` | ROMS - Smart Restaurant Landing Page | **TV 2** | Public Homepage & Brand Showcase |
| `SCR-05` | ROMS Waiter Terminal - Trạm Phục Vụ Bàn & Sơ Đồ Sảnh | **TV 3** | Floor Plan & Service Station |
| `SCR-06` | Chi Tiết Đơn Đang Phục Vụ & Gọi Món Tại Bàn | **TV 3** | Waiter Table Inspection & In-place Order |
| `SCR-07` | Chuyển Bàn & Đổi Trạng Thái Bàn | **TV 3** | Table Operations & Transfer |
| `SCR-02` | POS Terminal - Quầy Thu Ngân ROMS | **TV 3** | Billing & Checkout |
| `SCR-03` | POS Invoice & Order History | **TV 3** | Receipt Generation & History Log |
| `SCR-04` | Cash Drawer & Shift Handover Close | **TV 3** | Shift Cash Audit & Handover |
| `SCR-21` | Quản Lý Nhân Sự, Phân Quyền & Phân Ca Làm Việc | **TV 3** | Staff Admin Management |
| `SCR-22` | Quản Lý Thực Đơn, Món Ăn & Cấu Hình Định Lượng | **TV 3** | Menu Catalog Management |
| `SCR-24` | Báo Cáo & Hiệu Suất Vận Hành | **TV 3** | Manager Revenue Dashboard |

---

## 3. QUY TRÌNH LÀM VIỆC & KỶ LUẬT GIT (BẮT BUỘC ĐỂ ĐẠT ĐIỂM TỐI ĐA)

1. **Nhánh Git chuẩn Gitflow:**
   - `main`: Chỉ chứa code đã deploy chạy ổn định, không push trực tiếp.
   - `develop`: Nhánh tích hợp chính sau mỗi tuần.
   - Nhánh tính năng: `feat/kds-order-queue` (TV1), `feat/customer-qr-menu` (TV2), `feat/pos-checkout` (TV3).
2. **Quy tắc Commit Message:** Bắt buộc chuẩn Conventional Commits:
   - `feat: implement order status transition state machine`
   - `fix: resolve optimistic locking failure on concurrent order update`
   - `test: add unit test for HMAC token verification`
3. **Daily Standup:** Mỗi ngày 15 phút (21:30 - 21:45) họp Discord/Meet:
   - *Hôm nay đã code xong file/API nào?*
   - *Ngày mai sẽ code những gì?*
   - *Có đang bị vướng (blocker) ở API hay DB nào không?*

---

## 4. KẾ HOẠCH TÁC CHIẾN TỪNG NGÀY (6 TUẦN — 36 NGÀY CODE)

---

### TUẦN 1 (NGÀY 01 → NGÀY 06): THIẾT LẬP NỀN TẢNG, DATABASE, SECURITY & MOCK API CONTRACTS

> **Mục tiêu tuần:** Xây dựng khung xương Backend & Frontend sạch sẽ. Hoàn thành toàn bộ Schema DB trên SQL Server, chạy Docker Compose 1 lệnh lên ngay. Thông luồng Đăng nhập JWT + Phân quyền RBAC.

#### Ngày 01 (Thứ Hai): Khởi tạo dự án & Môi trường Docker
* **Thành viên 1 (Lead):**
  - Khởi tạo Spring Boot 3.x project tại `SourceCode/backend` (Dependencies: Spring Web, Spring Security, Spring Data JPA, MS SQL Driver, Lombok, MapStruct, Validation, JJWT).
  - Viết `SourceCode/docker-compose.yml` chạy MS SQL Server 2022 và backend/frontend container.
  - Setup Global Exception Handler (`@RestControllerAdvice`) và chuẩn hoá Base Response DTO (`ApiResponse<T>`: code, message, data, timestamp).
* **Thành viên 2:**
  - Khởi tạo React (Vite + JavaScript/TypeScript) tại `SourceCode/frontend`.
  - Cài đặt Axios, React Router Dom, Lucide-react icons, TailwindCSS/Vanilla tokens tương thích thiết kế Stitch (`#D32F2F`, Plus Jakarta Sans, Inter).
  - Cấu hình Axios Client interceptor (tự gắn JWT Bearer token vào Header, bắt mã 401/403 để redirect).
* **Thành viên 3:**
  - Viết file script khởi tạo bảng database `docs/schema_roms.sql` (bảng: `roles`, `users`, `tables`, `categories`, `menu_items`, `dining_sessions`, `orders`, `order_items`, `bills`, `reservations`).
  - Thiết lập khóa ngoại, ràng buộc UNIQUE, CHECK constraints theo chuẩn RDS.
* **DoD (Nghiệm thu cuối ngày):** Chạy `docker compose up` chạy được MS SQL Server; Frontend chạy `npm run dev` hiển thị trang Blank với CSS font chữ chuẩn Stitch; Backend compile không lỗi.

#### Ngày 02 (Thứ Ba): JPA Entities & Base Repositories
* **Thành viên 1:**
  - Tạo các JPA Entity: `User`, `Role` (Waiter, Kitchen, Cashier, Manager), `DiningSession` (status: `ACTIVE`, `COMPLETED`, `CANCELLED`).
  - Cấu hình Spring Data JPA Repositories tương ứng.
* **Thành viên 2:**
  - Tạo các JPA Entity: `MenuItem`, `Category`, `Reservation`.
  - Tạo Repositories: `MenuItemRepository`, `CategoryRepository`, `ReservationRepository`.
* **Thành viên 3:**
  - Tạo các JPA Entity: `Table` (status: `AVAILABLE`, `OCCUPIED`, `DIRTY`, `RESERVED`), `Order`, `OrderItem`, `Bill`.
  - Thêm cột `@Version private Long version` trong `Order` và `DiningSession` để phục vụ **Optimistic Locking** chống xung đột đồng thời.
* **DoD:** Backend khởi động tự động map các entity xuống DB SQL Server thành công không lỗi Hibernate dialect.

#### Ngày 03 (Thứ Tư): Authentication & Spring Security JWT (SCR-01)
* **Thành viên 1:**
  - Cấu hình `SecurityFilterChain`: CSRF disable, Stateless Session, JWT Authentication Filter.
  - Viết `JwtTokenProvider`: sinh và xác thực Staff Token (hết hạn 8 giờ), Customer Token (4 giờ).
  - API `POST /api/v1/auth/login` (Xác thực username/password với BCrypt, trả về JWT + thông tin User & Role).
* **Thành viên 2:**
  - Thiết kế cấu trúc thư mục Frontend: `components/`, `pages/`, `services/`, `context/` (`AuthContext`, `CartContext`).
  - Xây dựng PrivateRoute component chặn quyền truy cập theo Role.
* **Thành viên 3:**
  - Viết Script Seed Data ban đầu: Tạo 4 tài khoản thử nghiệm (`admin`, `cashier`, `waiter`, `chef`) với password mã hoá BCrypt.
  - Cắt giao diện **SCR-01 Staff Login Screen** trên React dựa theo mã HTML/CSS từ Stitch (Crimson Red button, form đăng nhập, logo ROMS).
* **DoD:** Mở trang Login trên trình duyệt, nhập `waiter/123456`, backend trả về JWT 200 OK, Frontend lưu token vào localStorage và chuyển sang route tương ứng.

#### Ngày 04 (Thứ Năm): Quản trị Bàn & Thuật toán sinh mã QR HMAC (FR-02)
* **Thành viên 1:**
  - Viết `QrCodeService`: Thuật toán sinh mã QR chứa HMAC-SHA256 Token gồm `tableId + salt + secretKey`.
  - API `GET /api/v1/tables/{id}/qr-token` và API `POST /api/v1/tables/verify-qr` xác thực tính toàn vẹn của mã QR (chống giả mạo URL).
* **Thành viên 2:**
  - Tạo trang kiểm thử quét mã QR trên Mobile Client: đọc query param `?token=...&tableId=...` và gọi API xác thực.
  - Xây dựng **SCR-09 Table Welcome Screen** (Màn chào mừng khách: Tên nhà hàng ROMS, Số bàn, Nút "Bắt đầu gọi món").
* **Thành viên 3:**
  - Viết Service + Controller quản lý Bàn: `GET /api/v1/tables`, `POST /api/v1/tables`, `PUT /api/v1/tables/{id}/status`.
  - Tạo 12 bàn mẫu trong Database (Khu vực Tầng 1, Tầng 2).
* **DoD:** Quét/truy cập link QR bàn 05 hợp lệ → hiển thị màn hình Chào mừng bàn 05; Sửa token trên URL → hệ thống báo lỗi 403 Forbidden "Mã QR không hợp lệ hoặc đã hết hạn".

#### Ngày 05 (Thứ Sáu): CRUD Danh mục & Thực đơn Menu (FR-04, FR-15)
* **Thành viên 1:**
  - Viết DTO và Mapper cho Menu/Category (MapStruct).
  - Hỗ trợ API upload hình ảnh món ăn lưu trữ cục bộ/static folder và trả về URL ảnh.
* **Thành viên 2:**
  - Viết API Client lấy danh sách món ăn theo Category.
  - Xây dựng component Thẻ món ăn (`DishCard`) có hình ảnh, giá tiền định dạng VND (`145.000 ₫`), nhãn hết món/còn món.
* **Thành viên 3:**
  - Viết APIs CRUD Menu Backend:
    * `GET /api/v1/categories`, `POST /api/v1/categories`
    * `GET /api/v1/menu-items`, `POST /api/v1/menu-items`, `PUT /api/v1/menu-items/{id}`
    * `PATCH /api/v1/menu-items/{id}/availability` (Bật/tắt trạng thái còn/hết hàng nhanh chóng).
* **DoD:** Thêm được 15 món ăn mẫu vào DB (Phở, Cơm chiên, Burger, Nước ngọt, Bia) kèm danh mục; gọi Postman trả về danh sách có cấu trúc.

#### Ngày 06 (Thứ Bảy): Review Sprint 3 & Chốt API Contract
* **Cả 3 thành viên:**
  - Tích hợp Swagger / OpenAPI (`/swagger-ui/index.html`) ghi chú đầy đủ mô tả Request/Response.
  - Kiểm tra toàn bộ mã nguồn Tuần 1, format code chuẩn Google Java Style và ESLint.
  - Họp Review tuần 1, chuẩn bị bước vào giai đoạn cài đặt nghiệp vụ lõi (Sprint 4).
* **DoD:** Dự án merge thành công vào nhánh `develop`, không có conflict. Swagger UI hiển thị đủ các endpoint Auth, Table, Menu.

---

### TUẦN 2 (NGÀY 07 → NGÀY 12): CUSTOMER CORE — PHIÊN ĂN, MENU SỐ, GIỎ HÀNG & GỬI ORDER ĐỒNG THỜI

> **Mục tiêu tuần:** Hoàn thành luồng Khách hàng tự phục vụ (Mobile-First). Khách quét mã QR → tham gia Dining Session → chọn món vào Giỏ hàng → Đặt món với Idempotency Key an toàn.

#### Ngày 07 (Thứ Hai): Quản lý Dining Session (BR-01, BR-02, BR-03)
* **Thành viên 1:**
  - Viết `DiningSessionService`:
    * Khách quét QR: nếu bàn chưa có session active → tự động tạo Session mới (`status = ACTIVE`).
    * Nếu bàn đã có session active → trả về session hiện tại để các khách cùng bàn dùng chung.
    * Đảm bảo BR-01: 1 Bàn chỉ có duy nhất 1 Active Session tại một thời điểm (Transactional Lock).
  - API `POST /api/v1/sessions/init-or-join`.
* **Thành viên 2:**
  - Tích hợp API Init/Join Session vào **SCR-09 Table Welcome Screen**.
  - Lưu `sessionId` và `sessionToken` vào SessionStorage để dùng cho toàn bộ các thao tác sau.
* **Thành viên 3:**
  - Viết API `GET /api/v1/tables/{id}/active-session` phục vụ cho nhân viên kiểm tra bàn đang có khách hay trống.
  - Viết Unit Test kiểm tra tính duy nhất của Active Session trên một bàn.
* **DoD:** Dùng 2 điện thoại/tab ẩn danh cùng truy cập QR Bàn 01 → cả 2 đều nhận về cùng 1 `sessionId`.

#### Ngày 08 (Thứ Ba): Giao diện Menu số trên Mobile (SCR-10)
* **Thành viên 1:**
  - Tối ưu hóa query Menu: Viết query lấy danh sách món kèm Category chỉ với 1 lệnh SQL (tránh N+1 query problem).
* **Thành viên 2:**
  - Cắt giao diện **SCR-10 Customer Mobile Menu** dựa trên Stitch HTML:
    * Thanh tìm kiếm món ăn nhanh.
    * Thanh trượt ngang lọc danh mục (`Khai vị`, `Món chính`, `Đồ uống`, `Tráng miệng`).
    * Danh sách món ăn cuộn mượt mà trên Mobile (360px - 414px).
    * Modal xem chi tiết món ăn và nút "Thêm vào giỏ hàng".
* **Thành viên 3:**
  - Hỗ trợ xây dựng bộ dữ liệu hình ảnh món ăn chất lượng cao, resize chuẩn kích thước hiển thị.
* **DoD:** Màn hình Menu hiển thị đẹp mắt trên Chrome Mobile DevTools, lọc danh mục tức thì không giật lag.

#### Ngày 09 (Thứ Tư): Quản lý Giỏ hàng (Cart Context & Local State) (SCR-12)
* **Thành viên 1:**
  - Viết DTO `OrderCreateRequest` (gồm: `sessionId`, `idempotencyKey`, danh sách `orderItems` [menuItemId, quantity, specialNotes]).
  - Viết validator kiểm tra BR-04: Giỏ hàng phải có ít nhất 1 món và các món đều đang `is_available = true`.
* **Thành viên 2:**
  - Xây dựng `CartContext` trên React: thêm món, xóa món, tăng giảm số lượng (+/- stepper).
  - Cắt giao diện **SCR-12 Customer Mobile Cart**:
    * Hiển thị danh sách món đã chọn, ô nhập ghi chú đặc biệt cho từng món (ví dụ: *“Không hành, ít cay”*).
    * Thanh Bottom Bar cố định hiển thị: Tổng số món, Tổng tạm tính, Nút lớn "Xác nhận gửi đơn".
* **Thành viên 3:**
  - Viết logic kiểm tra số lượng món không vượt quá giới hạn hợp lý (ví dụ: max 50 phần/món).
* **DoD:** Thêm 3 món vào giỏ, bấm tăng giảm số lượng, nhập ghi chú, reload trang giỏ hàng vẫn giữ nguyên dữ liệu.

#### Ngày 10 (Thứ Năm): Đặt món theo mẻ (Batch Order) & Idempotency Key (FR-06, NFR-R02)
* **Thành viên 1:**
  - Viết nghiệp vụ `OrderService.createBatchOrder()`:
    * Lưu snapshot đơn giá món tại thời điểm đặt (`order_items.unit_price`) thỏa mãn BR-17.
    * Trạng thái khởi tạo của Order là `PENDING`.
    * **Xử lý Idempotency:** Lưu và kiểm tra `idempotencyKey`. Nếu khách bị lag bấm đúp 2 lần liên tục trong 5 giây, backend từ chối tạo order trùng, trả về order đã tạo trước đó.
* **Thành viên 2:**
  - Xây dựng logic sinh UUID v4 cho `idempotencyKey` khi mở giỏ hàng.
  - Xử lý tương tác khi bấm nút: disable nút, hiển thị spinner loading, gọi API `POST /api/v1/orders`.
* **Thành viên 3:**
  - Tự động đổi trạng thái bàn sang `OCCUPIED` ngay khi đơn hàng đầu tiên của phiên ăn được tạo thành công.
* **DoD:** Bấm nút Gửi đơn hàng → DB tạo bản ghi Order (status `PENDING`) và các OrderItem tương ứng; Thử double click nhanh → chỉ có đúng 1 Order được tạo.

#### Ngày 11 (Thứ Sáu): Theo dõi đơn hàng thời gian thực (SCR-11, FR-07, BR-05)
* **Thành viên 1:**
  - Viết API `GET /api/v1/sessions/{id}/orders` (lấy toàn bộ các mẻ order của bàn kèm trạng thái chi tiết).
  - Viết API `POST /api/v1/orders/{orderId}/cancel` (Khách hủy đơn): Áp dụng nghiêm ngặt BR-05: chỉ cho phép hủy khi order còn ở trạng thái `PENDING`. Nếu đã chuyển sang `PREPARING` trở đi → trả về 400 Bad Request.
* **Thành viên 2:**
  - Cắt giao diện **SCR-11 Customer Table & Order Tracking**:
    * Hiển thị tiến trình món ăn theo các bước: `Đã gửi` → `Bếp nhận` → `Đang nấu` → `Đã ra món`.
    * Nút "Hủy món" kèm popup xác nhận (Confirm dialog). Nếu trạng thái đã là `Đang nấu`, nút Hủy tự động ẩn hoặc bị mờ.
    * Cài đặt Polling 3 giây/lần tự động cập nhật trạng thái đơn hàng.
* **Thành viên 3:**
  - Bổ sung nút "Gọi nhân viên" (**Customer Service Request** — FR-11): Khách bấm nút → tạo thông báo cho phục vụ.
* **DoD:** Khách đặt đơn thành công tự động chuyển sang trang Tracking; bấm Hủy đơn khi món chưa nấu thành công; nếu đổi status trong DB thành PREPARING thì client không hủy được nữa.

#### Ngày 12 (Thứ Bảy): Milestone M3 — Test Demo Luồng Khách End-to-End
* **Cả 3 thành viên:**
  - Tiến hành nghiệm thu Milestone M3 nội bộ:
    1. Quét QR bàn 05 trên mobile thật.
    2. Xem menu, thêm Mì xào bò + Coca vào giỏ hàng.
    3. Gửi Order.
    4. Kiểm tra Database thấy Session active, Table occupied, Order PENDING.
    5. Màn hình tracking hiển thị đúng danh sách món vừa đặt.
* **DoD:** Luồng khách hàng hoàn thành 100%, không phát sinh bất kỳ lỗi console hay lỗi 500 nào.

---

### TUẦN 3 (NGÀY 13 → NGÀY 18): KITCHEN (KDS) & WAITER OPERATIONS — XƯƠNG SỐNG VẬN HÀNH

> **Mục tiêu tuần:** Kết nối Bếp và Nhân viên chạy mượt mà. KDS hiển thị order tức thì, đầu bếp bấm chuyển trạng thái; Nhân viên sàn quản lý sơ đồ bàn trực quan trên máy tính bảng/desktop.

#### Ngày 13 (Thứ Hai): Order State Machine Engine (BR-06, BR-07, BR-16)
* **Thành viên 1:**
  - Xây dựng Enum `OrderStatus`: `PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `SERVED`, `CANCELLED`, `REJECTED`.
  - Cài đặt State Machine Validator: Định nghĩa rõ các chuyển đổi trạng thái hợp lệ:
    * `PENDING` → `CONFIRMED` (hoặc `CANCELLED`, `REJECTED`)
    * `CONFIRMED` → `PREPARING`
    * `PREPARING` → `READY`
    * `READY` → `SERVED`
    * Chặn đứng mọi hành vi nhảy cóc trạng thái (ví dụ `PENDING` nhảy thẳng lên `SERVED`).
* **Thành viên 2:**
  - Viết Unit Test cho Order State Machine: Viết 10 test case bao phủ toàn bộ các trường hợp chuyển đổi hợp lệ và bất hợp lệ.
* **Thành viên 3:**
  - Phân quyền endpoint theo Role (RBAC): Chỉ Chef được gọi API chuyển `PREPARING`/`READY`; Chỉ Waiter được gọi API chuyển `CONFIRMED`/`SERVED`.
* **DoD:** Chạy test suite `OrderStateMachineTest` pass 100%; Gọi API nhảy trạng thái sai trả về mã lỗi 422 Unprocessable Entity kèm thông báo tiếng Việt.

#### Ngày 14 (Thứ Ba): Cắt giao diện Kitchen Display System (SCR-15)
* **Thành viên 1:**
  - Viết API cho KDS: `GET /api/v1/kitchen/orders` (lấy danh sách đơn đang chờ xử lý, sắp xếp theo thời gian đặt cũ nhất lên trước FIFO).
  - API `PATCH /api/v1/kitchen/orders/{id}/status` (chuyển trạng thái nấu).
* **Thành viên 2:**
  - Cắt giao diện **SCR-15 Kitchen Display System (KDS)** theo đúng thiết kế Stitch:
    * Giao diện Dark theme chống chói mắt trong bếp (`#1A1412`).
    * Dạng thẻ Kanban Ticket: Tiêu đề số bàn nổi bật, bộ đếm thời gian nấu trôi qua (Elapsed Cook Timer: `12:45`).
    * Danh sách món và ghi chú đặc biệt hiển thị chữ màu cam nổi bật (`#D97706`).
* **Thành viên 3:**
  - Xây dựng component bộ đếm thời gian nhảy giây trực tiếp trên KDS Card: Nếu món nấu quá 15 phút, thẻ tự động đổi viền đỏ cảnh báo quá giờ.
* **DoD:** Màn hình KDS load danh sách order thực từ backend; hiển thị chuẩn xác bàn, món, ghi chú, timer chạy từng giây.

#### Ngày 15 (Thứ Tư): KDS Tương tác thời gian thực & Cảnh báo chuông
* **Thành viên 1:**
  - Triển khai cơ chế đồng bộ KDS: Sử dụng Server-Sent Events (SSE) hoặc Polling interval 2 giây (`NFR-P03`) để KDS tự động cập nhật khi có order mới mà không cần F5.
* **Thành viên 2:**
  - Tích hợp hiệu ứng âm thanh (beep notification) khi có mẻ order mới đổ về bếp.
  - Tích hợp nút bấm chuyển trạng thái trực tiếp trên KDS: Bấm `Bắt đầu nấu` (`PREPARING`) → Bấm `Nấu xong` (`READY`).
* **Thành viên 3:**
  - Cập nhật màn hình Tracking của khách hàng (`SCR-11`): Khi bếp bấm `PREPARING`, màn hình khách tự động nhảy sang "Bếp đang nấu".
* **DoD:** Mở 2 cửa sổ (1 bên khách bấm Đặt món, 1 bên KDS) → Sau 2 giây KDS tự hiện vé món mới và kêu tiếng chuông; Bếp bấm nút → Khách thấy trạng thái đổi ngay lập tức.

#### Ngày 16 (Thứ Năm): Waiter Terminal — Sơ đồ sảnh & Trạng thái bàn (SCR-05, FR-10)
* **Thành viên 1:**
  - Viết API `GET /api/v1/waiter/floor-plan`: Trả về toàn bộ danh sách bàn kèm trạng thái (`AVAILABLE`, `OCCUPIED`, `DIRTY`, `RESERVED`), tổng số món chưa phục vụ, thời gian khách đã ngồi.
* **Thành viên 2:**
  - Viết API đổi nhanh trạng thái bàn: `POST /api/v1/tables/{id}/clean` (dọn bàn xong chuyển từ `DIRTY` → `AVAILABLE`).
* **Thành viên 3:**
  - Cắt giao diện **SCR-05 ROMS Waiter Terminal - Trạm Phục Vụ Bàn & Sơ Đồ Sảnh**:
    * Sơ đồ lưới các bàn với màu sắc chỉ báo rõ ràng (Xanh lá = Trống, Xanh dương = Có khách, Xám = Cần dọn, Cam = Đã đặt).
    * Thanh thông báo góc trên nhận tin gọi phục vụ từ khách.
    * Bộ lọc khu vực (Tầng 1, Sân vườn, Tầng 2).
* **DoD:** Nhân viên đăng nhập vào thấy toàn cảnh sơ đồ nhà hàng; bàn nào đang có khách ăn hiện rõ thời gian và số lượng món.

#### Ngày 17 (Thứ Sáu): Chi tiết phục vụ bàn, Thêm món tại bàn & Chuyển bàn (SCR-06, SCR-07)
* **Thành viên 1:**
  - Viết nghiệp vụ chuyển bàn (`TableService.transferTable()`): Chuyển toàn bộ Dining Session từ Bàn A sang Bàn B (chỉ cho phép chuyển sang bàn đang `AVAILABLE`). Bàn A trở về `DIRTY`.
* **Thành viên 2:**
  - Cắt giao diện **SCR-07 Chuyển Bàn & Đổi Trạng Thái Bàn**: Modal chọn bàn đích, hiển thị lý do chuyển và nút xác nhận.
* **Thành viên 3:**
  - Cắt giao diện **SCR-06 Chi Tiết Đơn Đang Phục Vụ & Gọi Món Tại Bàn**:
    * Bồi bàn có thể gọi món hộ khách trực tiếp tại màn hình này.
    * Nút đánh dấu "Đã ra món" (`SERVED`) khi bê món từ bếp ra cho khách.
* **DoD:** Bồi bàn mở chi tiết bàn 01, bấm phục vụ món; thực hiện thao tác chuyển từ Bàn 01 sang Bàn 03 thành công, session và order được chuyển nguyên vẹn.

#### Ngày 18 (Thứ Bảy): Milestone M4 — Test Demo Luồng Bếp & Phục vụ
* **Cả 3 thành viên:**
  - Hợp nhất và test chuỗi kịch bản M4:
    1. Khách đặt 2 món (Burger + Trà đào).
    2. KDS nhận vé, bếp bấm `PREPARING` → `READY`.
    3. Waiter Terminal nhận tín hiệu món sẵn sàng mang ra bàn.
    4. Bồi bàn bấm `SERVED`.
    5. Khách thấy món của mình đã báo phục vụ thành công.
* **DoD:** Luồng kết nối Khách - Bếp - Phục vụ chạy thông suốt 100%.

---

### TUẦN 4 (NGÀY 19 → NGÀY 24): CASHIER POS, THANH TOÁN (CASH/VNPAY) & QUẢN TRỊ ADMIN

> **Mục tiêu tuần:** Hoàn tất chu trình khép kín của nhà hàng: Tổng hợp hoá đơn (Bill Aggregation) → Thanh toán Tiền mặt / VNPay QR → Đóng phiên ăn (Session COMPLETED) → Quản lý két tiền ca & CRUD Menu Admin.

#### Ngày 19 (Thứ Hai): Tổng hợp Bill & Kiểm tra điều kiện đóng phiên (BR-08, BR-09, BR-10, BR-16)
* **Thành viên 1:**
  - Viết `BillingService.generateBill(sessionId)`:
    * Thống kê toàn bộ món có trạng thái `SERVED` (bỏ qua món hủy `CANCELLED`).
    * Tính tổng tiền món, VAT (8% hoặc 10%), tổng thanh toán cuối.
    * Áp dụng nghiêm ngặt BR-16: Chặn thanh toán nếu trong phiên còn bất kỳ món nào đang ở trạng thái dang dở (`PENDING`, `CONFIRMED`, `PREPARING`, `READY`).
* **Thành viên 2:**
  - Hỗ trợ xây dựng giao diện hiển thị thông báo chặn thanh toán kèm danh sách món chưa hoàn thành.
* **Thành viên 3:**
  - Viết API `GET /api/v1/bills/session/{sessionId}` và `POST /api/v1/bills/checkout`.
  - Cắt giao diện **SCR-02 POS Terminal - Quầy Thu Ngân ROMS**:
    * Cột bên trái: Danh sách các bàn đang chờ thanh toán.
    * Cột bên phải: Chi tiết phiếu thanh toán từng món, số lượng, thành tiền, tổng cộng.
* **DoD:** Mở thu ngân bàn 02: nếu còn món đang nấu → báo lỗi không cho tính tiền; nếu tất cả món đã SERVED → hiển thị hóa đơn tính toán chính xác 100%.

#### Ngày 20 (Thứ Ba): Thanh toán Tiền mặt & In hoá đơn (SCR-03, FR-13)
* **Thành viên 1:**
  - Viết nghiệp vụ đóng phiên ăn (`DiningSessionService.completeSession()`):
    * Cập nhật Bill status = `PAID`, payment_method = `CASH`.
    * Cập nhật Session status = `COMPLETED`, lưu thời gian kết thúc `closed_at`.
    * Tự động chuyển trạng thái Bàn sang `DIRTY` (chờ dọn dẹp).
* **Thành viên 2:**
  - Xây dựng component hoá đơn in nhiệt chuẩn 80mm (Receipt Preview): hiển thị logo ROMS, ngày giờ, số bàn, danh sách món, tiền khách đưa, tiền thừa thối lại.
* **Thành viên 3:**
  - Cắt giao diện popup thanh toán tiền mặt trên **SCR-02**: Nhập số tiền khách đưa → tự động tính tiền thừa thối lại.
  - Tích hợp trang **SCR-03 POS Invoice & Order History** (Xem lại lịch sử các hóa đơn đã thanh toán trong ngày).
* **DoD:** Thu ngân chọn thanh toán tiền mặt bàn 05, khách đưa 500k, bill 350k → hiện tiền thừa 150k → bấm Xác nhận → Bàn chuyển xám DIRTY, session đóng, in được hóa đơn xem trước.

#### Ngày 21 (Thứ Tư): Tích hợp Thanh toán VNPay Sandbox QR Code (FR-13, NFR-S08)
* **Thành viên 1:**
  - Viết `VnPayService`: Tạo URL thanh toán VNPay và sinh mã VietQR động theo tiêu chuẩn checksum HMAC-SHA512.
  - Viết endpoint tiếp nhận Webhook IPN từ VNPay: `GET /api/v1/payment/vnpay-callback` (kiểm tra chữ ký bảo mật, cập nhật hoá đơn sang `PAID` và đóng session tự động).
* **Thành viên 2:**
  - Tích hợp hiển thị mã QR VNPay trên màn hình Khách hàng hoặc màn hình Thu ngân.
  - Cài đặt cơ chế Polling kiểm tra trạng thái thanh toán: Khi khách quét app ngân hàng thanh toán thành công → màn hình tự chuyển sang "Thanh toán thành công! Cảm ơn quý khách".
* **Thành viên 3:**
  - Hỗ trợ giả lập các case lỗi thanh toán: Timeout, khách hủy giao dịch trên app ngân hàng.
* **DoD:** Bấm chọn VNPay → hiện mã QR → quét bằng app ngân hàng sandbox test → tiền trừ, webhook nổ, hệ thống tự động hoàn tất hoá đơn và đóng phiên.

#### Ngày 22 (Thứ Năm): Quản lý Két tiền & Đóng ca làm việc (SCR-04)
* **Thành viên 1:**
  - Viết Entity `ShiftHandover`: số tiền mặt đầu ca, doanh thu tiền mặt trong ca, doanh thu chuyển khoản, tiền thực tế đếm được cuối ca, chênh lệch.
* **Thành viên 2:**
  - Viết API `POST /api/v1/shifts/open`, `POST /api/v1/shifts/close`, `GET /api/v1/shifts/current-summary`.
* **Thành viên 3:**
  - Cắt giao diện **SCR-04 Cash Drawer & Shift Handover Close**:
    * Bảng kiểm đếm các mệnh giá tiền mặt Việt Nam (500k, 200k, 100k, 50k, 20k, 10k).
    * Báo cáo tổng kết ca thu ngân trước khi bàn giao cho ca sau.
* **DoD:** Thu ngân kết ca, nhập số lượng tờ tiền → hệ thống tính tổng thực tế so với doanh thu phần mềm, ghi nhận nhật ký ca đóng.

#### Ngày 23 (Thứ Sáu): Phân hệ Quản trị Admin — Menu & Nhân sự (SCR-21, SCR-22)
* **Thành viên 1:**
  - Phân quyền nghiêm ngặt các route Admin (`@PreAuthorize("hasRole('MANAGER')")`).
* **Thành viên 2:**
  - Cắt giao diện **SCR-22 Quản Lý Thực Đơn, Món Ăn & Cấu Hình**:
    * Bảng danh sách món ăn, tìm kiếm, lọc theo category.
    * Modal thêm/sửa món ăn, tải ảnh lên, cập nhật giá bán, bật/tắt hiển thị.
* **Thành viên 3:**
  - Cắt giao diện **SCR-21 Quản Lý Nhân Sự, Phân Quyền & Phân Ca Làm Việc**:
    * Bảng danh sách nhân viên: Họ tên, Username, Số điện thoại, Vai trò (Waiter, Chef, Cashier, Manager).
    * Modal thêm mới nhân viên và reset mật khẩu.
* **DoD:** Đăng nhập tài khoản Manager: thêm được món mới vào thực đơn, tạo được tài khoản nhân viên mới và dùng tài khoản đó đăng nhập ngay lập tức.

#### Ngày 24 (Thứ Bảy): Milestone M5 — Nghiệm thu Toàn trình (End-to-End Core)
* **Cả 3 thành viên:**
  - Thực hiện kịch bản Demo hoàn chỉnh số 1 (Golden Flow 9 bước):
    `Quét QR` → `Vào Session` → `Chọn món` → `Gửi đơn` → `Bếp KDS nấu` → `Bồi bàn phục vụ` → `Thu ngân tính tiền Cash/VNPay` → `Đóng bàn`.
* **DoD:** Toàn bộ chu trình vận hành hoàn hảo không lỗi, hoàn thành 100% các tính năng CORE MUST HAVE.

---

### TUẦN 5 (NGÀY 25 → NGÀY 30): RESERVATION, DASHBOARD & TESTING BẢO MẬT/ĐỒNG THỜI

> **Mục tiêu tuần:** Hoàn thiện tính năng Đặt bàn trước (Reservation), Dashboard báo cáo doanh thu; Viết Unit/Integration Test xử lý Concurrency (Optimistic Locking, Duplicate Orders) chứng minh năng lực kỹ thuật trước Hội đồng.

#### Ngày 25 (Thứ Hai): Đặt bàn trực tuyến (ROMS Reservation) (FR-14, BR-13, BR-15)
* **Thành viên 1:**
  - Viết `ReservationService`:
    * Kiểm tra BR-15: Thời gian đặt bàn bắt buộc trong tương lai.
    * Kiểm tra bàn trống trong khung giờ khách chọn.
    * Lập Scheduler chạy nền mỗi 60 giây (`NFR-R06`): tự động hủy đặt bàn và giải phóng bàn nếu khách quá giờ hẹn 20 phút mà không đến (No-show auto-release).
* **Thành viên 2:**
  - Cắt giao diện **Trang Đặt Bàn Trực Tuyến - ROMS Reservation**:
    * Form chọn: Ngày đặt, Giờ đặt, Số lượng khách, Thông tin người đặt (Tên, SĐT, Ghi chú).
    * Chọn vị trí bàn mong muốn.
* **Thành viên 3:**
  - Viết tính năng Check-in tại quầy: Khi khách đặt bàn đến nơi, Bồi bàn tra cứu SĐT → bấm "Check-in" → tự động mở Dining Session và gán bàn.
* **DoD:** Đặt bàn lúc 19:00 thành công; bàn hiển thị trạng thái `RESERVED` trên Waiter Terminal; Chạy scheduler test auto-release hoạt động trơn tru.

#### Ngày 26 (Thứ Ba): Manager Dashboard Báo cáo Doanh thu (SCR-24, FR-16)
* **Thành viên 1:**
  - Viết các câu truy vấn thống kê tổng hợp hiệu năng cao (JPA Aggregation / Native Query):
    * Tổng doanh thu hôm nay / tuần này / tháng này.
    * Tổng số lượt đơn hàng và số lượt phiên ăn.
    * Top 5 món bán chạy nhất (Top-selling dishes).
* **Thành viên 2:**
  - Tích hợp thư viện biểu đồ nhẹ (Recharts / Chart.js) vào Frontend.
* **Thành viên 3:**
  - Cắt giao diện **SCR-24 Báo Cáo & Hiệu Suất Vận Hành**:
    * 4 thẻ thống kê số liệu nổi bật (KPI Metric cards).
    * Biểu đồ đường biểu diễn doanh thu theo thời gian.
    * Biểu đồ tròn cơ cấu doanh thu theo Danh mục món.
* **DoD:** Màn hình Dashboard load số liệu tính toán chuẩn xác từ database thực tế, thời gian tải trang < 1 giây.

#### Ngày 27 (Thứ Tư): Kiểm thử xử lý Đồng thời & Xung đột (Concurrency Testing) (NFR-R02, NFR-R03)
* **Thành viên 1:**
  - Viết bài test JUnit mô phỏng **Duplicate Order Attack**: Sử dụng `ExecutorService` bắn 20 request tạo order đồng thời với cùng 1 Idempotency Key → Khẳng định chỉ duy nhất 1 order được tạo vào DB.
* **Thành viên 2:**
  - Viết bài test mô phỏng **Optimistic Locking Conflict**: 2 luồng cùng đọc 1 Order version 1 và cùng cố gắng cập nhật status khác nhau → Luồng thứ 2 văng `OptimisticLockingFailureException` và được hệ thống xử lý trả về thông báo lỗi lịch sự, không crash server.
* **Thành viên 3:**
  - Viết bài test **Conflict Reservation vs Walk-in**: Cố tình xếp khách vãng lai vào bàn đang có trạng thái `RESERVED` → Backend chặn đứng thành công theo BR-13.
* **DoD:** Toàn bộ các bài test Concurrency chạy pass 100%, xuất log rõ ràng làm bằng chứng đưa vào Báo cáo Kiểm thử (Test Report).

#### Ngày 28 (Thứ Năm): Kiểm thử Bảo mật, Ranh giới phân quyền & Validate dữ liệu
* **Thành viên 1:**
  - Kiểm thử tấn công SQL Injection và XSS: Đảm bảo mọi tham số truyền vào đều được parameterized query và sanitize.
  - Kiểm thử Token giả mạo: Gửi request với QR token sai chữ ký HMAC → Backend từ chối truy cập 403.
* **Thành viên 2:**
  - Rà soát toàn bộ form phía Frontend: Thêm validation thông báo tiếng Việt (Số điện thoại không đúng định dạng, số lượng món âm, tên trống,...).
* **Thành viên 3:**
  - Kiểm thử chéo phân quyền (Role Escalation):
    * Dùng Token của Waiter để gọi API Xóa món ăn của Manager → Phải nhận 403 Forbidden.
    * Dùng Token của Khách hàng để gọi API Xem báo cáo doanh thu → Phải nhận 403 Forbidden.
* **DoD:** Biên bản kiểm thử bảo mật không còn lỗ hổng phân quyền nghiêm trọng nào.

#### Ngày 29 (Thứ Sáu): Cross-Testing & Bug Hunting Chéo Nhóm
* **Cả 3 thành viên đổi vai kiểm thử chéo:**
  - **TV 1** đóng vai Khách hàng khó tính: cố tình hủy đơn khi bếp đang nấu, đặt 0 món, nhập ghi chú 1000 ký tự.
  - **TV 2** đóng vai Bồi bàn: chuyển bàn liên tục, vừa chuyển bàn vừa thanh toán.
  - **TV 3** đóng vai Đầu bếp: bấm nhảy cóc trạng thái món, ngắt mạng khi đang xác nhận.
  - Lập bảng danh sách bug (Bug Log): Ghi nhận mức độ nghiêm trọng (Blocker, Critical, Minor) và phân công fix ngay trong ngày.
* **DoD:** Tất cả các bug mức Blocker và Critical được fix triệt để.

#### Ngày 30 (Thứ Bảy): Milestone M6 — Chốt Code Freeze & Test Report
* **Cả 3 thành viên:**
  - Hoàn thiện tài liệu **Test Report** (chụp ảnh màn hình các ca test thành công, test case xử lý xung đột đồng thời).
  - Khóa nhánh code (Code Freeze) các tính năng mới, chỉ cho phép sửa lỗi giao diện và tinh chỉnh nội dung.
* **DoD:** Test Report hoàn chỉnh; Toàn bộ codebase ổn định trên nhánh `develop`.

---

### TUẦN 6 (NGÀY 31 → NGÀY 36): ĐÓNG GÓI DOCKER, SEED DATA CHUẨN, SCRIPT DEMO & TẬP DƯỢT BẢO VỆ

> **Mục tiêu tuần:** Đóng gói sản phẩm chạy mượt mà trong 1 click. Chuẩn bị bộ dữ liệu demo lung linh. Tập dượt kịch bản thuyết trình và phản biện các câu hỏi "xoáy" của Giảng viên FPT.

#### Ngày 31 (Thứ Hai): Hoàn thiện Dockerfile & Deployment một chạm
* **Thành viên 1:**
  - Viết `Dockerfile` nhiều tầng (Multi-stage build) cho Backend Spring Boot (tối ưu kích thước image).
  - Viết `Dockerfile` với Nginx phục vụ Frontend React build production bundle.
  - Cập nhật `docker-compose.yml`: Chỉ cần gõ lệnh `docker compose up -d` là khởi chạy trọn vẹn: MS SQL Server + Backend API + Frontend Web + Nginx Reverse Proxy.
* **Thành viên 2 & 3:**
  - Test clone repository sang máy tính thứ 2 (hoặc máy trắng) và chạy thử `docker compose up` xem có chạy lên ngay không.
* **DoD:** Hệ thống dựng lên hoàn chỉnh trên máy khác trong vòng dưới 3 phút mà không cần cài thêm môi trường ngoài Docker.

#### Ngày 32 (Thứ Ba): Chuẩn bị Bộ Dữ Liệu Demo "Sạch & Đẹp" (Seed Data)
* **Thành viên 3 (Phụ trách chính):**
  - Viết script `seed_master_data.sql` tạo dữ liệu nhà hàng như thật:
    * 12 Bàn ăn được phân bổ đẹp mắt theo Tầng 1, Tầng 2, VIP Room.
    * 4 Danh mục: Khai vị, Món chính, Đồ uống, Tráng miệng.
    * 20 Món ăn có hình ảnh chụp thực tế rõ nét, mô tả hấp dẫn, giá tiền chuẩn.
    * 4 Tài khoản nhân viên với đầy đủ vai trò.
    * Một vài hóa đơn cũ trong quá khứ để màn hình Dashboard hiển thị biểu đồ có số liệu sống động.
* **Thành viên 1 & 2:**
  - Rà soát kiểm tra hiển thị trên giao diện sau khi nạp seed data.
* **DoD:** Chạy script nạp DB → Mở web lên nhìn như một nhà hàng đang kinh doanh thực tế, không có chỗ nào bị trống dữ liệu hay ảnh vỡ.

#### Ngày 33 (Thứ Tư): Xây dựng Kịch bản Demo Liền mạch (Golden Demo Story)
* **Cả 3 thành viên:**
  - Thống nhất **Kịch bản Demo 9 bước** không mở CRUD rời rạc:
    1. **Bối cảnh:** Mở đầu bằng Landing Page giới thiệu nhà hàng ROMS.
    2. **Khách hàng đến:** Quét mã QR tại Bàn 04 (hiển thị trên màn hình di động/tablet).
    3. **Chọn món:** Khách lướt menu, chọn 1 Phần Bò Nướng Tảng + 1 Nước Cam ép, ghi chú "Không đá", bấm Đặt món.
    4. **Bếp tiếp nhận:** Chuyển sang màn hình KDS, vé món bàn 04 nổi chuông ting ting, đầu bếp bấm `Nhận đơn` → `Đang nấu`.
    5. **Khách theo dõi:** Màn hình điện thoại khách tự động cập nhật trạng thái "Bếp đang nấu".
    6. **Bếp hoàn tất & Phục vụ:** Bếp bấm `Nấu xong`; Bồi bàn tại trạm Waiter Terminal thấy thông báo món sẵn sàng → mang ra bàn và bấm `Đã phục vụ`.
    7. **Gọi thêm món:** Khách gọi thêm 1 phần Tráng miệng Flan caramel.
    8. **Thanh toán:** Khách yêu cầu tính tiền. Thu ngân mở POS Bàn 04, hệ thống kiểm tra đủ điều kiện đóng bill → Khách chọn quét mã VNPay QR → Quét thanh toán thành công → Hóa đơn in ra, Bàn chuyển trạng thái Cần dọn dẹp.
    9. **Quản trị viên:** Manager mở Dashboard kiểm tra doanh thu vừa tăng thêm, xem báo cáo hiệu suất phục vụ.
* **DoD:** Cả nhóm chạy thử kịch bản này trôi chảy từ đầu đến cuối trong thời gian 7 - 10 phút.

#### Ngày 34 (Thứ Năm): Hoàn thiện Tài liệu Báo cáo SWP391
* **Thành viên 1:**
  - Tổng hợp Architecture Document: Sơ đồ kiến trúc tầng (Layered Architecture), Sơ đồ tuần tự (Sequence Diagram) luồng Đặt món và Thanh toán, Bảng phân công chi tiết cá nhân.
* **Thành viên 2:**
  - Hoàn thiện User Manual (Hướng dẫn sử dụng dành cho Khách hàng và Hướng dẫn sử dụng cho Bếp/Nhân viên).
* **Thành viên 3:**
  - Hoàn thiện Database Document (ERD chuẩn, từ điển dữ liệu Data Dictionary giải thích từng bảng/cột).
* **DoD:** Bộ tài liệu báo cáo (.docx / .pdf) định dạng chuyên nghiệp theo chuẩn mẫu của ĐH FPT.

#### Ngày 35 (Thứ Sáu): Tập dượt Phản biện (Mock Defense trước Giảng viên)
* **Cả 3 thành viên:**
  - Đóng vai Hội đồng chấm thi FPT hỏi xoáy vào các câu hỏi kinh điển:
    * *Câu 1 (Hỏi TV1):* "Nếu 2 khách cùng ngồi tại 1 bàn và cùng bấm gửi giỏ hàng một lúc thì hệ thống của em xử lý thế nào để không bị lỗi dữ liệu?" *(Trả lời: Nhờ Idempotency Key và cơ chế gom Order theo cùng 1 Dining Session ID duy nhất đang ACTIVE trên bàn).*
    * *Câu 2 (Hỏi TV2):* "Làm sao em ngăn được người ngoài không ngồi ở quán nhưng tự gõ link đặt món phá hoại nhà hàng?" *(Trả lời: QR Token có mã hoá HMAC-SHA256 kèm salt và secret key, backend kiểm tra hợp lệ mới cho phép truy cập).*
    * *Câu 3 (Hỏi TV3):* "Nếu bàn còn món đang nấu dở mà thu ngân lỡ tay bấm thanh toán đóng bàn thì sao?" *(Trả lời: Quy tắc nghiệp vụ BR-16 đã chặn cứng tại backend, hệ thống trả về lỗi 400 Bad Request và liệt kê các món chưa hoàn thành).*
* **DoD:** Cả 3 thành viên đều trả lời lưu loát, tự tin chỉ ra được đúng đoạn code và bảng DB giải quyết vấn đề.

#### Ngày 36 (Thứ Bảy): Tổng duyệt lần cuối & Đóng gói sản phẩm nộp Hội đồng
* **Cả 3 thành viên:**
  - Nộp source code lên GitHub, tạo Release tag `v1.0.0-final-defense`.
  - Chuẩn bị slide thuyết trình (tối đa 15 slides, tập trung vào Vấn đề - Giải pháp - Kiến trúc - Demo - Kết quả đạt được).
  - Sao lưu 1 bản backup Database và 1 video quay sẵn toàn bộ kịch bản demo (phòng trường hợp hôm bảo vệ mạng hội trường bị chập chờn).
* **DoD:** Mọi thứ sẵn sàng 100% cho ngày bảo vệ chính thức.

---

## 5. BẢNG TIÊU CHÍ NGHIỆM THU TỰ ĐÁNH GIÁ TRƯỚC KHI BẢO VỆ

Nhóm chỉ được phép bước vào phòng bảo vệ khi tự tích đủ tất cả các ô dưới đây:

- [ ] **Demo sống (Live Demo):** Chạy được kịch bản 9 bước từ Quét QR đến In hóa đơn đóng phiên mà không bị crash, không cần mở database sửa tay.
- [ ] **Kiểm soát trạng thái nghiêm ngặt:** Thử chuyển trạng thái Order nhảy cóc qua Postman và bị Backend chặn lại thành công (BR-06).
- [ ] **Bằng chứng xử lý đồng thời:** Có log hoặc unit test chứng minh xử lý được Duplicate Order và Optimistic Locking (NFR-R02, NFR-R03).
- [ ] **Đồng đều Commit:** Git Insight thể hiện biểu đồ commit của cả 3 thành viên đều đặn xuyên suốt 6 tuần, không có hiện tượng một người commit hộ toàn bộ dự án.
- [ ] **NFR được đáp ứng:** Giao diện mobile responsive tốt trên kích thước 360px - 414px; KDS cỡ chữ lớn nhìn rõ từ khoảng cách 1 mét.
- [ ] **Tài liệu đầy đủ:** SRS, Design Doc, Test Report và User Guide được xuất bản hoàn chỉnh.

---

*Chúc 3 kỹ sư tương lai của Đại học FPT giữ vững kỷ luật, tác chiến kiên cường và mang về điểm số xuất sắc nhất cho môn học SWP391!*
