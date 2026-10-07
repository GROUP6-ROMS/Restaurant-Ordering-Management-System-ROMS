# Kế hoạch dự án — ROMS (Restaurant Ordering Management System)


---

## 1. Problem Statement

- Customer Pain: Khách vào giờ cao điểm phải đợi nhân viên mang menu, gọi món dễ bị quên nhầm, muốn gọi thêm đá/nước hay tính tiền phải vẫy tay rát cả cổ.
- Kitchen Pain: Tờ phiếu gọi món bằng giấy bị ướt, mất, hoặc chữ nhân viên quá xấu dẫn đến làm sai món, chậm món. Bếp không biết món nào vào trước/sau để ưu tiên.
- Management Pain: Không kiểm soát được doanh thu thực tế theo thời gian thực, thất thoát nguyên liệu, không đánh giá được hiệu suất phục vụ của nhân viên.

## 2. Tầm nhìn dự án

ROMS là hệ thống quản lý nhà hàng số hóa toàn bộ quy trình: **Customer → Table → Dining Session → Order → Kitchen → Staff → Bill → Management**, bắt đầu từ việc khách quét QR tại bàn. 

Hệ thống chuyển đổi mô hình gọi món truyền thống sang mô hình tự phục vụ thông minh qua QR, kết nối trực tiếp Khách hàng - Bếp - Nhân viên trên một nền tảng thời gian thực."

Nguyên tắc cốt lõi xuyên suốt kế hoạch:

- QR chỉ là **entry point**, không phải toàn bộ sản phẩm.
- **Dining Session** là business concept trung tâm (trái tim của hệ thống) — 1 bàn có 1 session active, nhiều khách/nhiều order thuộc cùng 1 session, tổng hợp thành 1 bill.
- Phạm vi SWP391: **1 nhà hàng duy nhất**, multi-tenant nằm ngoài scope.
- Ưu tiên **core ổn định > nhiều feature dở dang**.

---

## 3. Công nghệ dự kiến

| Layer | Công nghệ |
|-------|-----------|
| Backend | Java, Spring Boot, Spring Security, Spring Data JPA |
| Database | Microsoft SQL Server |
| Frontend | React |
| API | RESTful API |

> Ghi chú: kiến trúc real-time (Order status, KDS) cần chọn công nghệ cụ thể trong Sprint 3 — ví dụ WebSocket (STOMP over SockJS trong Spring) hoặc Server-Sent Events, tùy độ quen thuộc của nhóm với Spring ecosystem.

---

## 4. Phạm vi (Scope MVP)

> **Nhóm 3 người — Scope đã được tái cơ cấu để khớp với capacity thực tế (~6 tuần code).**
> Nguyên tắc: hoàn thành ít tính năng nhưng chạy thật, hơn là nhiều tính năng làm nửa vời.

### CORE MUST HAVE (bắt buộc hoàn thành 100%)

1. Authentication + Role-based Authorization (RBAC)
2. Table Management
3. QR / Table Identification & Token Validation
4. Dining Session Management (create / join / close)
5. Menu + Category Management (CRUD)
6. Cart + Order (full lifecycle + State Machine đầy đủ)
7. Kitchen Order Processing — Kitchen Display System (KDS)
8. Staff Order & Table Management
9. Billing + Payment (Cash — bắt buộc; VNPay — nếu còn thời gian)
10. **Reservation + Staff Check-in** ← _core feature ngang hàng với QR_

### SHOULD HAVE (làm nếu hoàn thành CORE trước Sprint 6)

1. Real-time Order Status — polling 2 giây (không cần WebSocket)
2. VNPay QR Payment
3. Basic Manager Dashboard (3–4 metric: doanh thu ngày/tháng, top món, trạng thái bàn)
4. Customer Service Request — đơn giản: 1 nút "Gọi nhân viên", không cần phân loại

### CẮT KHỎI SCOPE (không làm trong môn học này)

- Food Recommendation / Upsell
- System Settings Management (tham số hardcode trong `application.properties`)
- Voucher / Discount
- Multi-restaurant, Multi-branch, SaaS subscription, Loyalty program, Mobile app, Advanced analytics, Online deposit


---

## 5. Actor
| Actor | Type | Description |
|:---|:---:|:---|
| **Customer** | External | In-dining diner; scans table QR code to join dining session, browses digital menu, places batch orders, tracks live dish status, and requests service. |
| **Waiter** | Internal | Floor staff; initiates sessions for walk-ins, takes orders on behalf of guests, monitors live table map, acknowledges service calls, and delivers ready dishes. |
| **Kitchen Staff** | Internal | Chef/Cook; views kitchen queue on KDS touchscreen, advances cooking milestones (`CONFIRMED` → `PREPARING` → `READY`), and triggers food pickup alerts. |
| **Cashier** | Internal | Checkout operator; audits served items in session, applies vouchers, settles payments via cash or dynamic VNPay QR, and completes dining sessions. |
| **Manager** | Internal | Restaurant administrator; manages staff accounts/RBAC, designs floor layouts, exports table QRs, maintains menu catalog, and inspects revenue analytics. |
| **System** | Automated | Background services; verifies HMAC-SHA256 QR tokens, brokers real-time WebSocket events, handles payment IPN webhooks, and auto-releases no-show reservations. |


## 6. Functional Requirements (FR)
| ID | Feature / Requirement | Actor | Priority |
|:---|:---|:---:|:---:|
| **FR-01** | **Staff Authentication & RBAC:** Login/logout with role-based access (Waiter, Kitchen, Cashier, Manager). | Staff | Must Have |
| **FR-02** | **Table QR Verification:** Scan table QR to validate cryptographic token and resolve table identity. | Customer | Must Have |
| **FR-03** | **Dining Session Management:** Initialize or join an active session; sync shared cart across diners at the same table. | Customer, System | Must Have |
| **FR-04** | **Digital Menu Browsing:** View categorized food and drinks with prices, images, and live availability. | Customer | Must Have |
| **FR-05** | **Cart Management:** Add/remove items, adjust quantities, and enter special cooking notes. | Customer | Must Have |
| **FR-06** | **Batch Order Placement:** Submit orders with Idempotency Key to prevent duplicate submissions on network lag. | Customer, Waiter | Must Have |
| **FR-07** | **Real-Time Order Tracking:** Track live dish cooking milestones (`CONFIRMED` → `PREPARING` → `READY` → `SERVED`). | Customer | Should Have |
| **FR-08** | **Customer Order Cancellation:** Self-cancel dishes before preparation starts; auto-lock once status reaches `PREPARING`. | Customer | Must Have |
| **FR-09** | **Kitchen Display System (KDS):** Display queue, update cooking milestones, and trigger food pickup alerts. | Kitchen Staff | Must Have |
| **FR-10** | **Real-Time Table Map:** Monitor live floor map with visual table statuses (`AVAILABLE`, `OCCUPIED`, `DIRTY`, `RESERVED`). | Waiter, Manager | Must Have |
| **FR-11** | **Waiter Service Request:** Page floor staff for in-dining assistance (water, ice, utensils, checkout call). | Customer, Waiter | Should Have |
| **FR-12** | **Bill Aggregation:** Aggregate all served items in session, apply tax, and calculate voucher discounts. | Cashier, System | Must Have |
| **FR-13** | **Payment Settlement:** Process payment via Cash or dynamic VNPay QR, print receipt, and close session. | Cashier | Must Have |
| **FR-14** | **Table Reservation:** Book tables in advance; lock table 45m prior and auto-release after 20m no-show. | Customer, System | Should Have |
| **FR-15** | **Menu & Stock Management:** CRUD menu items, toggle out-of-stock flags, and manage categories. | Manager | Must Have |
| **FR-16** | **Sales & Revenue Dashboard:** View daily/monthly revenue metrics, order counts, and top-selling dishes. | Manager | Should Have |

---

## 7. Non-Functional Requirements (NFR)

> Phạm vi áp dụng: **1 nhà hàng duy nhất**, triển khai nội bộ, phục vụ đồng thời tối đa ~50 người dùng trong giờ cao điểm (khách + staff).

### 7.1 Performance

| ID | Yêu cầu | Mục tiêu đo được | Ghi chú |
|:---|:--------|:-----------------|:--------|
| NFR-P01 | API response time — luồng thông thường (menu, order, session) | **< 500 ms** ở mức tải bình thường | Đo tại server, không tính network của client |
| NFR-P02 | QR token validation response | **< 300 ms** | Critical path — khách đứng ở bàn chờ |
| NFR-P03 | Kitchen Display System (KDS) cập nhật trạng thái order mới | **< 2 s** (polling interval) | Polling 2s hoặc WebSocket nếu triển khai real-time |
| NFR-P04 | Trang menu load lần đầu (First Contentful Paint) | **< 3 s** trên 4G mobile | Tối ưu ảnh món ăn, lazy load |
| NFR-P05 | Báo cáo doanh thu (Dashboard query) | **< 3 s** | Query có thể nặng — thêm index nếu cần |
| NFR-P06 | Hệ thống xử lý được | **50 concurrent users** mà không degradation | Giờ cao điểm của 1 nhà hàng thực tế |

### 7.2 Security

| ID | Yêu cầu | Chi tiết |
|:---|:--------|:---------|
| NFR-S01 | Authentication | JWT (JSON Web Token); Staff token hết hạn sau **8 giờ** (1 ca làm việc); Customer session token hết hạn sau **4 giờ** |
| NFR-S02 | QR Token Integrity | QR chứa HMAC-SHA256 signature. Backend validate token mọi request — không tin `tableId`/`sessionId` do Frontend tự gửi |
| NFR-S03 | Role-Based Access Control | Mọi API endpoint phải kiểm tra role trước khi xử lý. Customer không được gọi API của Staff/Manager và ngược lại |
| NFR-S04 | Brute-force Protection | Giới hạn **5 lần login thất bại / phút** per IP — trả về HTTP 429 Too Many Requests |
| NFR-S05 | Input Validation | Validate toàn bộ input phía Backend (không tin Frontend). Sử dụng Spring Validation + JPA Parameterized Query để chống SQL Injection |
| NFR-S06 | Transport Security | **HTTPS bắt buộc** trên môi trường production/demo. HTTP chỉ dùng trong localhost dev |
| NFR-S07 | Password Storage | Mật khẩu Staff được hash bằng **BCrypt** (salt rounds ≥ 10). Không lưu plaintext |
| NFR-S08 | VNPay Webhook Integrity | Xác thực chữ ký HMAC-SHA512 trên mọi IPN callback từ VNPay trước khi xử lý payment |

### 7.3 Usability

| ID | Yêu cầu | Chi tiết |
|:---|:--------|:---------|
| NFR-U01 | Mobile-first cho Customer UI | Giao diện order của khách phải usable trên màn hình 360px–414px (điện thoại phổ thông). Không cần zoom, không bị overflow |
| NFR-U02 | KDS readable trên tablet | Kitchen Display System phải hiển thị rõ trên tablet 10" ở khoảng cách ~60 cm. Font size tối thiểu 16px cho tên món, 20px cho order ID |
| NFR-U03 | Error message thân thiện | Mọi lỗi phía Client phải hiển thị message tiếng Việt rõ ràng — không show raw HTTP status code hoặc stack trace |
| NFR-U04 | Hành động quan trọng cần xác nhận | Các hành động không thể hoàn tác (hủy order, thanh toán, đóng session) phải có bước xác nhận (confirm dialog) |
| NFR-U05 | Thời gian phản hồi cảm nhận | Mọi action của user phải có phản hồi visual (loading spinner, toast notification) trong vòng **200 ms** |

### 7.4 Reliability & Availability

| ID | Yêu cầu | Chi tiết |
|:---|:--------|:---------|
| NFR-R01 | Uptime trong giờ hoạt động | **99% uptime** trong khung giờ nhà hàng mở cửa (ví dụ 09:00–22:00) |
| NFR-R02 | Idempotency cho Order | Duplicate Order do double-click hoặc mạng chậm phải bị phát hiện và chặn qua Idempotency Key — không tạo order trùng |
| NFR-R03 | Concurrency control | Các thao tác đồng thời trên cùng 1 Order (2 staff cùng update status) phải dùng **Optimistic Locking** (`@Version` trong JPA) |
| NFR-R04 | Database backup | Backup database hàng ngày. Có thể restore về trạng thái trong vòng 24 giờ gần nhất |
| NFR-R05 | Graceful error handling | Backend không crash khi gặp lỗi đơn lẻ — trả về HTTP 4xx/5xx có structured error body thay vì unhandled exception |
| NFR-R06 | Reservation auto-release | Scheduler chạy mỗi **60 giây** để kiểm tra và auto-release reservation no-show. Không được bỏ sót dù server vừa restart |

### 7.5 Maintainability

| ID | Yêu cầu | Chi tiết |
|:---|:--------|:---------|
| NFR-M01 | Codebase structure | Backend theo chuẩn Layered Architecture: Controller → Service → Repository. Không viết business logic trong Controller hoặc Repository |
| NFR-M02 | API documentation | Tất cả API endpoint phải có Swagger/OpenAPI annotation để tự sinh tài liệu. Accessible tại `/swagger-ui.html` |
| NFR-M03 | Environment configuration | Mọi thông tin nhạy cảm (DB password, JWT secret, VNPay key) phải đọc từ **environment variable hoặc `application.properties`** — không hardcode trong source code |
| NFR-M04 | Seed data | Có script seed data đủ để demo ngay sau khi deploy: ≥ 10 bàn, ≥ 3 category, ≥ 15 món ăn, ≥ 3 tài khoản staff (1 Manager, 1 Waiter, 1 Kitchen) |
| NFR-M05 | Test coverage | Bắt buộc có unit test cho: Order State Machine transitions, QR token validation, Business Rules quan trọng (BR-01, BR-05, BR-08). Mục tiêu coverage ≥ 60% service layer |

---

## 8. Quy tắc nghiệp vụ quan trọng (Business Rules)

| Mã | Loại | Quy tắc | Implementation / Validation |
|----|------|---------|-----------------------------|
| BR-01 | Constraints | Một Table chỉ có một Active Dining Session tại một thời điểm | DB Constraint/Transaction: table_id + status = ACTIVE là duy nhất. Chặn mở Session mới khi bàn đang có Session ACTIVE. |
| BR-02 | Facts | Một Dining Session có thể có nhiều Customer | Nhiều thiết bị cùng quét QR tại một bàn sẽ tham gia cùng session_id. |
| BR-03 | Constraints | Một Customer chỉ có thể tham gia một Active Dining Session tại một thời điểm. | Backend kiểm tra customer_id hoặc session token trước khi join Session mới. |
| BR-04 | Constraints | Một Order phải chứa ít nhất một món hợp lệ và đang được phép bán. | Validate items.size() > 0; kiểm tra từng Menu Item có is_available = true. Nếu hệ thống triển khai stock management trong MVP thì kiểm tra thêm stock > 0 |
| BR-05 | Constraints | Customer chỉ được hủy Order trước khi Order chuyển sang PREPARING. | Backend chỉ cho Customer cancel khi Order còn ở trạng thái cho phép, tối thiểu là PENDING. Nếu status >= PREPARING, request bị từ chối. |
| BR-06 | Constraints | Order chỉ được chuyển trạng thái theo State Machine đã định nghĩa, không được nhảy cóc trạng thái. | Backend validate mọi transition. Không cho phép chuyển trạng thái tùy ý, ví dụ PENDING → SERVED. |
| BR-07 | Constraints | Chỉ Staff có quyền phù hợp mới được thay đổi Order status. | Áp dụng RBAC: Customer tạo/hủy Order theo rule; Chef xử lý PREPARING/READY; Waiter xử lý CONFIRMED/SERVED. |
| BR-08 | Constraints | Dining Session chỉ được hoàn thành khi tất cả Order liên quan đã ở trạng thái kết thúc. | Checkout phải kiểm tra tất cả Order thuộc Session đều ở SERVED, CANCELLED hoặc REJECTED. |
| BR-09 | Computations | Một Bill thuộc về một Dining Session và được tính dựa trên các Order hợp lệ phải thanh toán trong Session. | Tổng hợp các Order có trạng thái SERVED thuộc session_id để tính Bill. |
| BR-10 | Constraints | Order CANCELLED hoặc REJECTED không được tính tiền. | Bill chỉ lấy các Order payable, ví dụ WHERE session_id = ? AND status = 'SERVED'. |
| BR-11 | Constraints | Customer chỉ được truy cập Session khi QR hợp lệ và liên kết với Table/Session đang hoạt động. | Backend xác thực QR token. Không tin tableId hoặc sessionId do Frontend tự gửi. Từ chối QR giả mạo hoặc không còn hợp lệ. |
| BR-12 | Action Enablers | Món được Recommendation/Upsell không được tự động thêm vào Cart. Customer phải xác nhận. | UI hiển thị Recommendation/Combo; chỉ thêm vào Cart sau khi Customer thực hiện action xác nhận như Add this item. |
| BR-13 | Constraints | Bàn đang RESERVED trong thời gian Reservation không được cấp cho khách Walk-in. | Khi assign Table, Backend kiểm tra Reservation đang active. Nếu Table đang RESERVED thì từ chối Walk-in assignment. |
| BR-14 | Constraints | Mỗi Order bắt buộc thuộc chính xác một Dining Session. | Order phải có session_id hợp lệ. Không cho phép tạo Order không thuộc Session hoặc đồng thời thuộc nhiều Session. |
| BR-15 | Constraints | Một Reservation chỉ được tạo cho thời điểm trong tương lai, không được đặt bàn cho thời gian đã qua. | Backend validate `reservation_time > LocalDateTime.now()`. Reject ngay với HTTP 400 nếu đặt bàn trong quá khứ. |
| BR-16 | Constraints | Dining Session chỉ được chuyển sang COMPLETED khi không còn Order nào ở trạng thái trung gian (PENDING, CONFIRMED, PREPARING, READY) trong Session đó. | Checkout endpoint kiểm tra: `COUNT(orders WHERE status NOT IN ['SERVED','CANCELLED','REJECTED']) = 0`. Từ chối close session nếu còn món đang nấu. |
| BR-17 | Computations | Giá tính trên Bill là giá tại thời điểm Order được tạo (snapshot price), không phải giá hiện tại của MenuItem. | `order_items.unit_price` lưu giá tại lúc add vào order. Nếu Manager thay đổi giá MenuItem sau đó, Bill đã tạo không bị ảnh hưởng. |

**Order State Machine:** `PENDING → CONFIRMED → PREPARING → READY → SERVED`, với `REJECTED`/`CANCELLED` là trạng thái ngoại lệ. Backend phải kiểm tra tính hợp lệ của mọi transition — không cho chuyển trạng thái tùy ý (ví dụ không cho `PREPARING → CANCELLED` trực tiếp nếu không có rule phù hợp).

**Conflict scenarios cần xử lý thật:**

- Hai khách cùng đặt món tại một bàn → 2 order riêng, cùng 1 Dining Session, không duplicate dữ liệu.
- Duplicate Order do double-click/mạng chậm → dùng Idempotency Key/Unique Request ID.
- Hai Staff cùng update một Order → transaction/optimistic locking/version.
- Reservation vs Walk-in → không assign bàn RESERVED cho khách vãng lai.
- Payment timeout → verify lại trạng thái thanh toán, tránh double payment.

---

## 9. Kịch bản Demo

Demo theo một câu chuyện liền mạch, không mở rời rạc từng CRUD:

1. **Customer đến nhà hàng** → quét QR tại Table 05.
2. **Hệ thống xác định Table 05** → tạo hoặc tham gia Dining Session.
3. **Customer xem menu** → chọn Burger + Cola.
4. **Customer Place Order** → Kitchen nhận Order #1001.
5. **Kitchen xử lý:** CONFIRMED → PREPARING → READY.
6. **Customer thấy trạng thái order cập nhật real-time.**
7. **Staff phục vụ** → order chuyển SERVED.
8. **Customer yêu cầu Bill.**
9. **Payment** → Dining Session chuyển COMPLETED.

**Demo mở rộng (nếu Should Have hoàn thành):**
- Reservation → Check-in → Dining Session → QR Ordering.
- Customer: "Tôi muốn món cay dưới 100k" → hệ thống gợi ý 3–5 món phù hợp (rule-based).

---

## 10. Quy chuẩn lập trình Full-Stack & Ràng buộc tài liệu Markdown cho Team & AI

> ⚠️ **RÀNG BUỘC BẮT BUỘC (MANDATORY CODING & DOCUMENTATION RULE):**  
> Nhóm phát triển gồm nhiều thành viên (và các AI Agent hỗ trợ từng thành viên). Để đảm bảo tính đồng bộ kiến trúc tuyệt đối, tránh tình trạng "Backend một đằng, Frontend một nẻo":
>
> 1. **BẮT BUỘC TẠO/CẬP NHẬT FILE MD HƯỚNG DẪN FULL-STACK:**  
>    Khi code bất kỳ chức năng nào (Quản lý bàn, Menu thực đơn, Giỏ hàng & Gọi món, Điều phối Bếp KDS, Thanh toán Bill, Đặt bàn trước...), thành viên hoặc AI Agent phụ trách **BẮT BUỘC** phải tạo hoặc cập nhật một file hướng dẫn markdown `.md` tương ứng trong thư mục `docs/REAMD/`.
> 2. **HƯỚNG DẪN ĐỒNG THỜI CẢ BACKEND & FRONTEND:**  
>    - **Backend:** Liệt kê đầy đủ Entity, DTO (Lombok), Repository, Service, Controller, Validation, Phân quyền endpoint.
>    - **Frontend:** Liệt kê đầy đủ Axios API service, State/Context, Components/Pages giao diện, Form validation, Xử lý gọi API.
>    - **Luồng dữ liệu (Data Flow):** Mô tả rõ ràng request từ màn hình nào gửi sang endpoint nào và trả về kết quả gì.
>    - **Test & Troubleshooting:** Hướng dẫn kiểm thử cURL / Postman / SQL mẫu và bảng các lỗi thường gặp.
> 3. **ĐỒNG BỘ 100% VỚI CODE THỰC TẾ:** Mọi tên biến, tên trường DTO/Entity, endpoint URL trong file `.md` phải trùng khớp 100% với code thật trong thư mục `SourceCode/`. Tuyệt đối không viết tài liệu giả định lệch với code.
> 4. **CẬP NHẬT MỤC LỤC TỔNG:** Cập nhật dòng tương ứng vào Bảng Mục lục trong [docs/REAMD/README.md](docs/REAMD/README.md).

---

## 11. Thứ tự ưu tiên kỹ thuật (không đảo ngược)

```
1. Requirement             8. Reservation
2. Database + Architecture 9. Dashboard
3. QR + Table + Session   10. Testing
4. Menu + Cart + Order    11. Deployment
5. Kitchen                12. Documentation
6. Staff                  13. Defense
7. Billing/Payment
```

Không làm Reservation/Dashboard/Chatbot trước khi luồng Order lõi (bước 3–7) chạy ổn định end-to-end.

---

## 12. Milestone nghiệm thu

- **M1 (cuối Sprint 2):** SRS + Use Case + Domain Model được duyệt.
- **M-FREEZE (30/09/2026):** 🔒 **UI/UX Design Freeze (Baseline v1.0.0)** — Chính thức khóa 18 màn hình từ Stitch Project `8715052598064593406`. Chi tiết xem tại: **[docs/UI_DESIGN_FREEZE_SPEC.md](file:///d:/Documents/Ki_5/SWP391/Restaurant-Ordering-Management-System-ROMS-/docs/UI_DESIGN_FREEZE_SPEC.md)**.
- **M2 (cuối Sprint 3):** ERD + API design hoàn chỉnh, review được kiến trúc trước khi code.
- **M3 (cuối Sprint 4):** Demo thật — khách quét QR, đặt món, order vào hệ thống. Đây là mốc sống còn của dự án.
- **M4 (cuối Sprint 5):** Demo luồng Kitchen nhận order → Staff phục vụ.
- **M5 (cuối Sprint 6):** Demo trọn vẹn: QR → Order → Kitchen → Staff → Bill → Payment → Completed.
- **M6 (cuối Sprint 7):** Test report, chứng minh xử lý được ít nhất 2 conflict scenario thật.
- **M7 (cuối Sprint 8):** Bảo vệ.

---

## Tiêu chí tự đánh giá trước khi nộp

- [ ] Có thể demo end-to-end: QR → Order → Kitchen → Staff → Bill → Payment mà không lỗi
- [ ] Mọi transition trạng thái Order được backend kiểm tra hợp lệ (không cho nhảy trạng thái tùy ý)
- [ ] Có ít nhất 2 conflict scenario được xử lý thật và có test case chứng minh
- [ ] SRS có bảng NFR cụ thể (không chỉ functional requirement)
- [ ] Có bảng phân công cá nhân theo module, cập nhật đến sprint cuối
- [ ] Tài liệu tách rõ MUST/SHOULD/FUTURE, không có feature "làm nửa vời" trong bản nộp
