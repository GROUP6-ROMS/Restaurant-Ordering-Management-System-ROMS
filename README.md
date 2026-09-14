# Kế hoạch dự án — ROMS (Restaurant Ordering Management System)


---

## 1. Tầm nhìn dự án

ROMS là hệ thống quản lý nhà hàng số hóa toàn bộ quy trình: **Customer → Table → Dining Session → Order → Kitchen → Staff → Bill → Management**, bắt đầu từ việc khách quét QR tại bàn.

Nguyên tắc cốt lõi xuyên suốt kế hoạch:

- QR chỉ là **entry point**, không phải toàn bộ sản phẩm.
- **Dining Session** là business concept trung tâm — 1 bàn có 1 session active, nhiều khách/nhiều order thuộc cùng 1 session, tổng hợp thành 1 bill.
- Phạm vi SWP391: **1 nhà hàng duy nhất**, multi-tenant nằm ngoài scope.
- Ưu tiên **core ổn định > nhiều feature dở dang**.

---

## 2. Công nghệ dự kiến

| Layer | Công nghệ |
|-------|-----------|
| Backend | Java, Spring Boot, Spring Security, Spring Data JPA |
| Database | Microsoft SQL Server |
| Frontend | React (hoặc công nghệ nhóm thống nhất) |
| API | RESTful API |

> Ghi chú: kiến trúc real-time (Order status, KDS) cần chọn công nghệ cụ thể trong Sprint 3 — ví dụ WebSocket (STOMP over SockJS trong Spring) hoặc Server-Sent Events, tùy độ quen thuộc của nhóm với Spring ecosystem.

---

## 3. Phạm vi (Scope MVP)

### 3.1 MUST HAVE

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

### 3.2 SHOULD HAVE

1. Reservation
2. Check-in
3. Customer Service Request
4. Real-time Order Status
5. Food Recommendation

### 3.3 FUTURE (ngoài scope môn học)

Multi-restaurant, Multi-branch, SaaS subscription, Advanced AI recommendation, Loyalty program, Advanced inventory, Advanced promotion, Mobile application, Online deposit, Advanced analytics.


---

## 4. Quy tắc nghiệp vụ quan trọng (Business Rules)

| Mã | Quy tắc |
|----|---------|
| BR-01 | Một Table chỉ có một Active Dining Session tại một thời điểm |
| BR-02 | Một Dining Session có thể có nhiều Customer |
| BR-03 | Mỗi Order phải thuộc một Dining Session |
| BR-04 | QR phải được backend xác thực (không tin tableId thô từ frontend) |
| BR-05 | Customer không được cancel Order sau khi Order đã chuyển sang PREPARING |
| BR-06 | Chỉ Role được phân quyền mới được phép thay đổi từng trạng thái Order |
| BR-07 | Bàn RESERVED không được assign cho Walk-in trong thời gian reservation |
| BR-08 | Dining Session không thể hoàn thành khi vẫn còn Order đang active |
| BR-09 | Bill thuộc về một Dining Session, tổng hợp từ toàn bộ Order trong session đó |
| BR-10 | Customer phải xác nhận recommendation trước khi món được thêm vào cart |

**Order State Machine:** `PENDING → CONFIRMED → PREPARING → READY → SERVED → COMPLETED`, với `REJECTED`/`CANCELLED` là trạng thái ngoại lệ. Backend phải kiểm tra tính hợp lệ của mọi transition — không cho chuyển trạng thái tùy ý (ví dụ không cho `PREPARING → CANCELLED` trực tiếp nếu không có rule phù hợp).

**Conflict scenarios cần xử lý thật:**

- Hai khách cùng đặt món tại một bàn → 2 order riêng, cùng 1 Dining Session, không duplicate dữ liệu.
- Duplicate Order do double-click/mạng chậm → dùng Idempotency Key/Unique Request ID.
- Hai Staff cùng update một Order → transaction/optimistic locking/version.
- Reservation vs Walk-in → không assign bàn RESERVED cho khách vãng lai.
- Payment timeout → verify lại trạng thái thanh toán, tránh double payment.

---

## 5. Kịch bản Demo

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

## 6. Timeline theo Sprint

| Sprint | Nội dung chính | Deliverable |
|--------|------|------------------|-------------|
| 1 | Requirement: Vision, Scope, Actor, FR/NFR, Business Rules, Use Case List | SRS v1 |
| 2 | Analysis: Use Case Diagram + Spec, Activity Diagram, Domain Model, Conflict Scenarios | Analysis Document |
| 3 | Architecture & Database: ERD, API Design, Auth Design | Design Document |
| 4 | Customer Core: QR → Table → Dining Session → Menu → Cart → Order | Demo: khách đặt món end-to-end |
| 5 | Kitchen & Staff: order lifecycle, KDS, phục vụ, service request | Demo: Kitchen → Staff luồng đầy đủ |
| 6 | Manager & Billing: CRUD quản lý, Reservation, Billing, Payment, Dashboard | Demo: thanh toán → Dining Session COMPLETED |
| 7 | Testing: functional, role permission, state transition, concurrency (duplicate order, optimistic locking), security | Test Report |
| 8 | Deployment & Defense: deploy, seed data, tài liệu, demo script, tập dượt bảo vệ | Final Package + Presentation |

---

## 7. Thứ tự ưu tiên kỹ thuật (không đảo ngược)

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

## 8. Milestone nghiệm thu

- **M1 (cuối Sprint 2):** SRS + Use Case + Domain Model được duyệt.
- **M2 (cuối Sprint 3):** ERD + API design hoàn chỉnh, review được kiến trúc trước khi code.
- **M3 (cuối Sprint 4):** Demo thật — khách quét QR, đặt món, order vào hệ thống. Đây là mốc sống còn của dự án.
- **M4 (cuối Sprint 5):** Demo luồng Kitchen nhận order → Staff phục vụ.
- **M5 (cuối Sprint 6):** Demo trọn vẹn: QR → Order → Kitchen → Staff → Bill → Payment → Completed.
- **M6 (cuối Sprint 7):** Test report, chứng minh xử lý được ít nhất 2 conflict scenario thật.
- **M7 (cuối Sprint 8):** Bảo vệ.

---

## 9. Rủi ro chính & biện pháp

| Rủi ro | Biện pháp |
|--------|-----------|
| Scope 15 module MUST HAVE quá tải so với thời gian | Nếu tới cuối Sprint 4 chưa demo được luồng Customer end-to-end, xin giảm scope ngay (gộp Category vào Food Management, hoãn Dashboard) thay vì cố ôm hết |
| Real-time (WebSocket) tốn effort ngoài dự kiến | Làm polling đơn giản trước (Customer tự refresh trạng thái mỗi vài giây), nâng cấp WebSocket/STOMP sau nếu còn thời gian |
| Concurrency chỉ "nói trên giấy", không implement thật | Bắt buộc code + test thật cho Duplicate Order và 1 case optimistic locking, đưa vào Test Report có bằng chứng (log, test case) |
| QR/Table token bị làm giả hoặc bypass | Backend validate token mọi request, không tin dữ liệu frontend gửi lên |
| Thiếu NFR cụ thể trong SRS | Bổ sung ít nhất: số concurrent user mục tiêu, response time kỳ vọng, JWT expiry/rate limit cơ bản |
| Không rõ phân công cá nhân | Lập bảng phân công theo module ngay từ Sprint 1, cập nhật mỗi sprint |

---

## 10. Phân công vai trò (mẫu — điền theo nhóm thực tế)

| Thành viên | Module phụ trách chính | Module hỗ trợ |
|-----------|------------------------|----------------|
| _(điền tên)_ | Auth + Role-based Authorization | Testing |
| _(điền tên)_ | Table + QR + Dining Session | Documentation |
| _(điền tên)_ | Menu + Category + Cart + Order | Kitchen module |
| _(điền tên)_ | Kitchen Processing + Staff module | Real-time |
| _(điền tên)_ | Billing + Payment + Dashboard | Deployment |

---

## 11. Tiêu chí tự đánh giá trước khi nộp

- [ ] Có thể demo end-to-end: QR → Order → Kitchen → Staff → Bill → Payment mà không lỗi
- [ ] Mọi transition trạng thái Order được backend kiểm tra hợp lệ (không cho nhảy trạng thái tùy ý)
- [ ] Có ít nhất 2 conflict scenario được xử lý thật và có test case chứng minh
- [ ] SRS có bảng NFR cụ thể (không chỉ functional requirement)
- [ ] Có bảng phân công cá nhân theo module, cập nhật đến sprint cuối
- [ ] Tài liệu tách rõ MUST/SHOULD/FUTURE, không có feature "làm nửa vời" trong bản nộp
