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
| Frontend | React (hoặc công nghệ nhóm thống nhất) |
| API | RESTful API |

> Ghi chú: kiến trúc real-time (Order status, KDS) cần chọn công nghệ cụ thể trong Sprint 3 — ví dụ WebSocket (STOMP over SockJS trong Spring) hoặc Server-Sent Events, tùy độ quen thuộc của nhóm với Spring ecosystem.

---

## 4. Phạm vi (Scope MVP)

### MUST HAVE

1. Authentication
2. Role-based Authorization
3. Table Management
4. QR/Table Identification
5. Menu
6. Food Management
7. Category Management
8. Cart
9. Order
10. Dining Session
11. Kitchen Order Processing
12. Staff Order/Table Management
13. Billing
14. Basic Payment
15. Basic Manager Dashboard

### SHOULD HAVE

1. Reservation
2. Check-in
3. Customer Service Request
4. Real-time Order Status
5. Food Recommendation

### FUTURE (ngoài scope môn học)

Multi-restaurant, Multi-branch, SaaS subscription, Advanced AI recommendation, Loyalty program, Advanced inventory, Advanced promotion, Mobile application, Online deposit, Advanced analytics.


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
| **FR-16** | **Sales & Revenue Dashboard:** View daily/monthly revenue metrics, order counts, and top-selling dishes. | Manager | Must Have |
| **FR-17** | **System Settings Management:** Manager cấu hình các tham số vận hành của hệ thống — thời gian khóa bàn trước giờ Reservation, thời gian auto-release khi no-show, và các tham số tương tự phát sinh sau này. Giá trị mặc định áp dụng nếu chưa cấu hình. | Manager | Should Have |

## 7. Quy tắc nghiệp vụ quan trọng (Business Rules)

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

**Order State Machine:** `PENDING → CONFIRMED → PREPARING → READY → SERVED`, với `REJECTED`/`CANCELLED` là trạng thái ngoại lệ. Backend phải kiểm tra tính hợp lệ của mọi transition — không cho chuyển trạng thái tùy ý (ví dụ không cho `PREPARING → CANCELLED` trực tiếp nếu không có rule phù hợp).

**Conflict scenarios cần xử lý thật:**

- Hai khách cùng đặt món tại một bàn → 2 order riêng, cùng 1 Dining Session, không duplicate dữ liệu.
- Duplicate Order do double-click/mạng chậm → dùng Idempotency Key/Unique Request ID.
- Hai Staff cùng update một Order → transaction/optimistic locking/version.
- Reservation vs Walk-in → không assign bàn RESERVED cho khách vãng lai.
- Payment timeout → verify lại trạng thái thanh toán, tránh double payment.

---

## 8. Kịch bản Demo

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

## 9. Timeline theo Sprint

| Sprint | Nội dung chính | Deliverable |
|------|------------------|-------------|
| 1 | Requirement: Vision, Scope, Actor, FR/NFR, Business Rules, Use Case List | SRS v1 |
| 2 | Analysis: Use Case Diagram + Spec, Activity Diagram, Domain Model, Conflict Scenarios | Analysis Document |
| 3 | Architecture & Database: ERD, API Design, Auth Design | Design Document |
| 4 | Customer Core: QR → Table → Dining Session → Menu → Cart → Order | Demo: khách đặt món end-to-end |
| 5 | Kitchen & Staff: order lifecycle, KDS, phục vụ, service request | Demo: Kitchen → Staff luồng đầy đủ |
| 6 | Manager & Billing: CRUD quản lý, Reservation, Billing, Payment, Dashboard | Demo: thanh toán → Dining Session COMPLETED |
| 7 | Testing: functional, role permission, state transition, concurrency (duplicate order, optimistic locking), security | Test Report |
| 8 | Deployment & Defense: deploy, seed data, tài liệu, demo script, tập dượt bảo vệ | Final Package + Presentation |

---

## 10. Thứ tự ưu tiên kỹ thuật (không đảo ngược)

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

## 11. Milestone nghiệm thu

- **M1 (cuối Sprint 2):** SRS + Use Case + Domain Model được duyệt.
- **M2 (cuối Sprint 3):** ERD + API design hoàn chỉnh, review được kiến trúc trước khi code.
- **M3 (cuối Sprint 4):** Demo thật — khách quét QR, đặt món, order vào hệ thống. Đây là mốc sống còn của dự án.
- **M4 (cuối Sprint 5):** Demo luồng Kitchen nhận order → Staff phục vụ.
- **M5 (cuối Sprint 6):** Demo trọn vẹn: QR → Order → Kitchen → Staff → Bill → Payment → Completed.
- **M6 (cuối Sprint 7):** Test report, chứng minh xử lý được ít nhất 2 conflict scenario thật.
- **M7 (cuối Sprint 8):** Bảo vệ.

---

## 12. Rủi ro chính & biện pháp

| Rủi ro | Biện pháp |
|--------|-----------|
| Scope 15 module MUST HAVE quá tải so với thời gian | Nếu tới cuối Sprint 4 chưa demo được luồng Customer end-to-end, xin giảm scope ngay (gộp Category vào Food Management, hoãn Dashboard) thay vì cố ôm hết |
| Real-time (WebSocket) tốn effort ngoài dự kiến | Làm polling đơn giản trước (Customer tự refresh trạng thái mỗi vài giây), nâng cấp WebSocket/STOMP sau nếu còn thời gian |
| Concurrency chỉ "nói trên giấy", không implement thật | Bắt buộc code + test thật cho Duplicate Order và 1 case optimistic locking, đưa vào Test Report có bằng chứng (log, test case) |
| QR/Table token bị làm giả hoặc bypass | Backend validate token mọi request, không tin dữ liệu frontend gửi lên |
| Thiếu NFR cụ thể trong SRS | Bổ sung ít nhất: số concurrent user mục tiêu, response time kỳ vọng, JWT expiry/rate limit cơ bản |
| Không rõ phân công cá nhân | Lập bảng phân công theo module ngay từ Sprint 1, cập nhật mỗi sprint |

---

## 13. Phân công vai trò (mẫu — điền theo nhóm thực tế)

| Thành viên | Module phụ trách chính | Module hỗ trợ |
|-----------|------------------------|----------------|
| _(điền tên)_ | Auth + Role-based Authorization | Testing |
| _(điền tên)_ | Table + QR + Dining Session | Documentation |
| _(điền tên)_ | Menu + Category + Cart + Order | Kitchen module |
| _(điền tên)_ | Kitchen Processing + Staff module | Real-time |
| _(điền tên)_ | Billing + Payment + Dashboard | Deployment |

---

## Tiêu chí tự đánh giá trước khi nộp

- [ ] Có thể demo end-to-end: QR → Order → Kitchen → Staff → Bill → Payment mà không lỗi
- [ ] Mọi transition trạng thái Order được backend kiểm tra hợp lệ (không cho nhảy trạng thái tùy ý)
- [ ] Có ít nhất 2 conflict scenario được xử lý thật và có test case chứng minh
- [ ] SRS có bảng NFR cụ thể (không chỉ functional requirement)
- [ ] Có bảng phân công cá nhân theo module, cập nhật đến sprint cuối
- [ ] Tài liệu tách rõ MUST/SHOULD/FUTURE, không có feature "làm nửa vời" trong bản nộp
