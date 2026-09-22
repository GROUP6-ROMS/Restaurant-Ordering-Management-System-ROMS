# TÀI LIỆU THUYẾT TRÌNH DỰ ÁN & BÁO CÁO RDS (REQUIREMENT & DESIGN SPECIFICATION)
## DỰ ÁN: RESTAURANT ORDERING MANAGEMENT SYSTEM (ROMS)
**Môn học:** SWP391 — Software Development Project | **Đại học FPT**  
**File thuyết trình Tiếng Việt:** `Documents/ROMS_Project_and_RDS_Overview_VN.pptx` (và `Documents/ROMS_Bao_Cao_Tong_Quan_va_RDS_Tieng_Viet.pptx`)  
**File thuyết trình Tiếng Anh:** `Documents/ROMS_Project_and_RDS_Overview.pptx`  
**Bộ nhận diện & Màu chủ đề:** Logo gốc `Documents/ROMS_Logo_Exact.svg` — Terracotta Burnt Orange (`#BD593A`), Deep Charcoal (`#221C1A`), Warm Amber (`#D9822B`), Ivory Background (`#FCFBF6`).  
**Tập hình ảnh minh họa:** Trích xuất nguyên bản từ `Documents/rds_images/` (`image1.png` → `image13.png`).

---

# PHẦN 1: CẤU TRÚC VÀ NỘI DUNG SLIDE DECK (TIẾNG ANH)

Slide deck được thiết kế theo tỷ lệ chuẩn **16:9 Widescreen**, định dạng Card layout cao cấp với dải màu Terracotta đồng bộ với logo thương hiệu ROMS. Dưới đây là nội dung chi tiết của 17 Slide trong file PowerPoint `ROMS_Project_and_RDS_Overview.pptx`:

---

### Slide 1: Title Slide (Dark Luxury Espresso Theme)
- **Top Badge:** `SWP391 — SOFTWARE DEVELOPMENT PROJECT | OVERVIEW & RDS REVIEW`
- **Main Title:** `ROMS — Restaurant Ordering Management System`
- **Subtitle:** `Comprehensive Project Overview & Requirements and Design Specification (RDS) Milestone Presentation`
- **Brand Visual:** `image1.png` (ROMS Vector Brand Identity)
- **Project Metadata:**
  - *Institution:* FPT University Da Nang | Course: SWP391 | Term: Fall 2026
  - *Team Members:* Dương Trong (Team Lead) | Phạm Minh Đức (Backend Lead) | Ngô Viết Bảo Huy (Frontend Lead)
  - *Core Tech Stack:* Spring Boot 3 + Spring Security (RBAC) + React + Microsoft SQL Server + STOMP WebSocket

---

### Slide 2: Industry Context & Problem Statement
- **Category:** `1. PROJECT OVERVIEW`
- **Title:** `Pain Points in Traditional Restaurant Operations`
- **Subtitle:** `Critical bottlenecks observed in peak-hour F&B operations necessitating digital automation`
- **3 Structured Problem Columns:**
  - **Column 1 — Diner & Guest Pains:** Peak hour delays (10-15m wait for menus); verbal miscommunication of customization notes (e.g. no onions); zero visibility into live stock/photos; awkward waving for bill delivery.
  - **Column 2 — Kitchen & Chef Pains:** Wet, stained or lost paper tickets; illegible handwriting causing food remake waste; lack of queue priority ordering; unannounced stock-outs causing customer disputes.
  - **Column 3 — Management & Audit Pains:** Revenue leakage from untracked voids/cancellations; no real-time table turnover metrics; labor misallocation (staff spend 70% of time running paper tickets); vacant reserved tables due to lack of automated no-show policies.

---

### Slide 3: Project Scope & Core Architecture Philosophy
- **Category:** `1. PROJECT OVERVIEW`
- **Title:** `Project Scope & Architectural Philosophy`
- **Subtitle:** `Defining MVP boundaries for a 3-person team over a 6-week SWP391 development lifecycle`
- **Left Card — Scope Matrix:**
  - *Core Must-Have (100% Target):* Staff Auth & RBAC; Table & HMAC QR Verification; Dining Session Lifecycle; Menu CRUD; Batch Cart & Order Placement (Idempotency Key); Kitchen Display System (KDS); Waiter Floor Table Map; Cashier Billing & 8% VAT Settlement; Table Reservation & Auto Check-in.
  - *Explicit Out-of-Scope:* Multi-tenant SaaS (strictly 1 restaurant); Native Mobile App (pure mobile web); Online Pre-payments / Deposits; Customer Loyalty Points.
- **Right Card — Core Philosophy:**
  - *1. Dining Session as the Central Heart:* Tables are physical furniture; Dining Sessions are the temporal core binding diners, batch orders, and the final bill.
  - *2. QR Code is an Entry Point, Not the Product:* QR simply provides secure entry into a session.
  - *3. Quality Over Quantity:* Delivering robust concurrency guards (optimistic locking, deduplication) over fragile feature bloat.

---

### Slide 4: System Actors & Role-Based Access Control (RBAC)
- **Category:** `2. REQUIREMENTS SPECIFICATION`
- **Title:** `System Actors & Operational Roles`
- **Subtitle:** `Clear separation of duties across 5 human roles and 1 automated system actor`
- **6 Grid Cards:**
  1. **Customer (External):** Mobile web diner; scans QR to join session, browses menu, places batch orders, tracks milestones, calls staff.
  2. **Waiter (Front-of-House):** Monitors live floor map; opens walk-in sessions; orders on guest behalf; serves READY dishes; handles calls.
  3. **Kitchen Staff (Back-of-House):** Operates KDS touchscreen; acknowledges tickets; advances milestones (`CONFIRMED` → `PREPARING` → `READY`); rejects items with reason.
  4. **Cashier (Front-of-House):** Audits served items; applies tax/discounts; settles payments via Cash / VietQR; completes dining sessions.
  5. **Restaurant Manager (Admin):** Manages staff accounts & RBAC; configures table layouts & HMAC QR codes; maintains catalog; reviews sales analytics.
  6. **System Background Actor (Automated):** Validates HMAC signatures; brokers WebSocket events; listens to payment IPNs; runs 5-min cron no-show auto-release.

---

### Slide 5: Front-of-House Use Cases (Customer & Waiter)
- **Category:** `2. REQUIREMENTS SPECIFICATION`
- **Title:** `Front-of-House Use Cases: Customer & Waiter`
- **Subtitle:** `Empowering diners with self-service ordering while equipping waiters with real-time floor tools`
- **Left Column Highlights:** UC-09 (Scan QR & Enter Session), UC-13 & UC-15 (Menu Browsing & Shared Cart), UC-16 (Batch Order Placement with UUID v4 Idempotency Key), UC-18 & UC-19 (Live Status Tracking & Pre-preparation Cancellation), UC-10 & UC-17 (Floor Map & On-behalf Ordering), UC-24 & UC-25 (One-tap In-dining Service Call).
- **Right Column Embedded Diagrams:**
  - Top: `image2.png` *(Customer Use Case Diagram)*
  - Bottom: `image3.png` *(Waiter & Floor Service Use Case Diagram)*

---

### Slide 6: Back-of-House & Management Use Cases
- **Category:** `2. REQUIREMENTS SPECIFICATION`
- **Title:** `Back-of-House & Management Use Cases`
- **Subtitle:** `Kitchen Display System (KDS), Cashier Settlement, and Administrative Governance`
- **Left Column Highlights:** UC-20 to UC-22 (KDS Queue, Preparation Milestones, Item Rejection with Reason), UC-31 (Automated Beverage Bypass Router), UC-26 (Bill Aggregation & Settle Payment via Cash/VietQR), UC-07 & UC-08 (Table Management & HMAC QR Export), UC-27 (Table Reservation & Auto-release), UC-28 (Sales Analytics Dashboard).
- **Right Column Embedded Diagrams:**
  - Top: `image4.png` *(Kitchen & Cashier Use Case Diagram)*
  - Bottom: `image5.png` *(Manager & System Use Case Diagram)*

---

### Slide 7: End-to-End Operational Screens Flow
- **Category:** `2. REQUIREMENTS SPECIFICATION`
- **Title:** `End-to-End Screens Flow & Diner Journey`
- **Subtitle:** `Complete operational flow mapping customer actions to kitchen preparation and cashier settlement`
- **Prominent Visual:** `image6.png` *(Screens Flow Diagram: SCR-01 to SCR-18)*
- **Right Column Journey Milestones:**
  - *Step 1: QR Scan & Entry:* Verifies HMAC token → opens SCR-09 Welcome.
  - *Step 2: Menu & Batch Cart:* Browses SCR-10 Menu → customizes dish notes in SCR-11 Cart.
  - *Step 3: Idempotent Submission:* Order sent with UUID v4 header → dispatched to KDS.
  - *Step 4: KDS Cooking Queue:* Chefs advance milestones on SCR-13 KDS to READY.
  - *Step 5: Floor Serving:* Waiters deliver dishes and update status to SERVED.
  - *Step 6: Checkout & Settlement:* SCR-17 Cashier consolidates SERVED items → Cash/VietQR payment → Session CLOSED.

---

### Slide 8: System High-Level Architecture & Layered Packages
- **Category:** `3. SYSTEM DESIGN (RDS)`
- **Title:** `System High-Level Architecture & Code Packages`
- **Subtitle:** `Spring Boot 3 enterprise layered architecture enforcing strict separation of concerns`
- **Prominent Visual:** `image8.png` *(Code Packages Architecture Diagram: com.roms.*)*
- **Right Package Highlights:**
  - `com.roms.config`: SecurityFilterChain, JwtAuthenticationFilter, CORS, Swagger OpenAPI 3.
  - `com.roms.controller`: REST API presentation layer with DTO validation.
  - `com.roms.service & impl`: Business logic, `@Transactional`, State Machine validation, HMAC verification.
  - `com.roms.repository`: Spring Data JPA with JPQL queries and `@Version` optimistic locking.
  - `com.roms.websocket` & `cron`: STOMP message broker and background cron workers.
  - `Frontend (React)`: Mobile-first Customer UI, Tablet KDS, Desktop Admin portal.

---

### Slide 9: Relational Database Design (ERD)
- **Category:** `3. SYSTEM DESIGN (RDS)`
- **Title:** `Relational Database Design (11 Core Tables)`
- **Subtitle:** `Enterprise relational schema centered around Dining Sessions with foreign key integrity and audit logs`
- **Prominent Visual:** `image7.png` *(Relational Database Schema Diagram - 11 Entities)*
- **Right Schema Highlights:**
  - `dining_sessions (Hub)`: Central hub connecting tables, batch orders, and final bills.
  - `orders` vs `order_items`: Orders represent submission batches; order_items represent individual dish state machines with optimistic lock versioning.
  - `Snapshot Pricing`: `order_items.unit_price` captures historical order prices, preventing retroactive bill changes.
  - `audit_logs`: Immutable trail capturing item rejections, cancellations, and table transfers.
  - `reservations`: Advance booking records with scheduled arrival timestamps and table links.

---

### Slide 10: Critical Business Rules & Order State Machine
- **Category:** `3. SYSTEM DESIGN (RDS)`
- **Title:** `Business Rules & Strict Order State Machine`
- **Subtitle:** `Rigorous state validation engines preventing illegal transitions and eliminating concurrency races`
- **Left Column — State Machine Engine:**
  - Happy Path: `CONFIRMED` → `PREPARING` → `READY` → `SERVED`.
  - Self-Cancellation (BR-05): Allowed ONLY before reaching `PREPARING`.
  - Item Rejection (UC-22): Chef transitions `CONFIRMED` → `REJECTED` with mandatory reason.
  - Drink Bypass (FN-03): Items with `is_drink = 1` bypass kitchen queue directly to `READY`.
- **Right Column — Key Business Rules:**
  - *BR-01 & BR-02:* 1 active session per table; multiple diners participate in the same session.
  - *BR-08 & BR-16:* Session CANNOT checkout if any item is in intermediate state (`PREPARING`, `READY`).
  - *BR-10:* Cancelled and rejected items are excluded from the Bill.
  - *BR-13 & BR-15:* Reserved tables cannot be assigned to walk-ins during the 45-min pre-booking window.

---

### Slide 11: Non-UI Infrastructure & Security Architecture
- **Category:** `3. SYSTEM DESIGN (RDS)`
- **Title:** `Non-UI Functions & Security Architecture`
- **Subtitle:** `Cryptographic integrity, concurrency deduplication, real-time messaging, and cron schedulers`
- **4 Architecture Cards:**
  1. **FN-01: HMAC-SHA256 QR Verification:** Cryptographic token calculated from `table_id` + server secret key prevents URL tampering and spoofing.
  2. **FN-04: Idempotency Key & Dedup Service:** UUID v4 header per order placement blocks duplicate tickets caused by network retry or double-click.
  3. **Real-Time WebSocket / STOMP Broker:** Subscribed channels (`/topic/table/{id}`, `/topic/kitchen`) deliver instant status notifications.
  4. **FN-05 & FN-07: Background Cron Schedulers:** 5-minute cron releases no-show reservations after 20 minutes; 00:05 nightly cron aggregates sales metrics.

---

### Slide 12: Customer In-Dining Experience (UI & Interaction)
- **Category:** `4. PROTOTYPE & USER INTERACTION`
- **Title:** `Customer In-Dining Experience: QR Entry, Menu & Cart`
- **Subtitle:** `Pure responsive mobile web application requiring zero mobile app installation`
- **Left Embedded Mockups:**
  - `image10.png` *(SCR-09: Mobile QR Welcome Landing)*
  - `image11.png` *(SCR-10 & SCR-11: Digital Menu, Customization & Shared Cart)*
- **Right Interaction Highlights:**
  - Zero App Download Friction: Scans QR with native phone camera → opens mobile web.
  - Verified Table Number & Active Session: Shows current diner occupancy.
  - Categorized Menu: High-resolution images, real-time out-of-stock badges, search filter.
  - Special Preparation Notes: Diners add custom cooking notes (e.g. "ít cay", "không hành").
  - Shared Collaborative Cart: Real-time synchronization across diners at the same table.

---

### Slide 13: Operations Experience: Kitchen KDS & Floor Table Map
- **Category:** `4. PROTOTYPE & USER INTERACTION`
- **Title:** `Operations Experience: Kitchen KDS & Floor Table Map`
- **Subtitle:** `Real-time visual touch interfaces built for kitchen efficiency and floor coordination`
- **Top Embedded Mockups:**
  - Left: `image12.png` *(Kitchen Display System — KDS Touchscreen)*
  - Right: `image13.png` *(Real-Time Floor Table Map & Reservation Management)*
- **Bottom Operational Summary:**
  - *KDS Ticket Cards:* Ticket cards ordered by timestamp; elapsed preparation timer; 1-tap milestone progression (`CONFIRMED` → `PREPARING` → `READY`); color alerts for tickets > 15 mins.
  - *Live Table Map:* Color-coded floor status (`AVAILABLE` Green, `OCCUPIED` Red, `RESERVED` Amber, `CLEANING` Gray); 1-tap session initialization and reservation check-in.

---

### Slide 14: Staff Authentication & Role-Based Governance
- **Category:** `4. PROTOTYPE & USER INTERACTION`
- **Title:** `Staff Authentication & Role-Based Governance`
- **Subtitle:** `Secure access control, role-based authorization, and executive analytics oversight`
- **Left Embedded Mockup:** `image9.png` *(Staff Authentication & Assigned Role Dashboard)*
- **Right Administrative Highlights:**
  - *Role-Based Staff Authentication:* Staff authenticate via username/password verified securely via BCrypt. System validates credentials and enforces strict role-based access control (RBAC).
  - *Dynamic Role Redirection:* Automatic routing based on role (Waiter → Floor Map; Kitchen → KDS; Cashier → Billing; Manager → Full Portal).
  - *Brute-Force Login Protection:* Max 5 failed logins per minute per IP address.
  - *Executive Analytics:* Daily net sales, table turnover ratios, kitchen prep duration, and top dishes.

---

### Slide 15: Non-Functional Requirements & Engineering Standards
- **Category:** `5. ENGINEERING QUALITY & MILESTONES`
- **Title:** `Non-Functional Requirements (NFR) & Quality Goals`
- **Subtitle:** `Measurable engineering benchmarks ensuring enterprise-grade performance and security`
- **4 Benchmark Cards:**
  - *Performance:* API latency < 500 ms; QR verification < 300 ms; KDS sync < 2 s; 50 concurrent users.
  - *Security:* HMAC-SHA256 QR validation; Strict RBAC authorization; BCrypt password hashing (10 rounds); Jakarta Validation.
  - *Usability:* Mobile-first (360px-414px); 10-inch tablet KDS readable from 60 cm; Vietnamese friendly error toasts.
  - *Reliability & Concurrency:* Idempotency deduplication; JPA `@Version` Optimistic Locking; 99% uptime.

---

### Slide 16: Milestone Progress, Sprint Plan & Risk Mitigation
- **Category:** `5. ENGINEERING QUALITY & MILESTONES`
- **Title:** `Sprint Roadmap & Proactive Risk Management`
- **Subtitle:** `Tracking development progress against official SWP391 course milestones and mitigation strategies`
- **Left Column — Sprint Roadmap:**
  - Sprints 1-2 (Done): SRS v1.0, Use Cases, Analysis Diagrams (Milestone M1).
  - Sprint 3 (Current): Complete RDS Document, 11-table ERD, API Specs (Milestone M2).
  - Sprints 4-5 (Active / Next): Customer End-to-End Ordering & Kitchen KDS (Milestones M3 & M4).
  - Sprints 6-7 (Upcoming): Cashier Billing, Table Reservation & Concurrency Testing (Milestones M5 & M6).
  - Sprint 8 (Final): Deployment, seed data & defense rehearsal (Milestone M7).
- **Right Column — Risk Mitigation:**
  - Strict Scope Control: Banned multi-tenant, loyalty points, and AI upsells.
  - WebSocket Fallback: HTTP 2-second polling fallback if STOMP WebSocket encounters network proxy blocks.
  - Concurrency Proof: Automated unit tests with logs verifying Idempotency & Optimistic Locking.

---

### Slide 17: Summary & Academic Q&A Session
- **Category:** `CONCLUSION`
- **Title:** `ROMS — Empowering Smart Restaurant Operations`
- **Subtitle:** `Thank You for Your Attention! Open floor for feedback & architectural suggestions`
- **Key Takeaways:** Completed RDS specifications; 11-table relational model centered on Dining Sessions; verified security and concurrency safeguards.

---

# PHẦN 2: KỊCH BẢN THUYẾT TRÌNH TIẾNG VIỆT (WORD-FOR-WORD SCRIPT)
*(Dành cho sinh viên: Học thuộc toàn bộ câu chữ dưới đây để tự tin đứng trước hội đồng giảng viên môn SWP391. Kịch bản được phân chia rõ ràng theo từng slide, có kèm chỉ dẫn hành động cử chỉ và điểm nhấn giọng).*

---

### [MỞ ĐẦU — TRƯỚC KHI BẮT ĐẦU VÀO SLIDE]
> **Hành động:** Đứng thẳng lưng, mỉm cười tự tin, hướng ánh mắt về phía các thầy cô trong hội đồng, cúi đầu nhẹ chào ban giám khảo.

*"Em xin kính chào quý thầy cô trong hội đồng thẩm định dự án môn SWP391. Em tên là **Dương Trong**, đại diện cho nhóm phát triển dự án ROMS gồm 3 thành viên: em chịu trách nhiệm Team Lead, bạn **Phạm Minh Đức** phụ trách Backend Lead, và bạn **Ngô Viết Bảo Huy** phụ trách Frontend Lead.*

*Hôm nay, nhóm chúng em xin phép được trình bày bài **báo cáo sơ lược tổng quan về dự án và đặc tả thiết kế kỹ thuật — Requirements & Design Specification (RDS)** của hệ thống **ROMS — Restaurant Ordering Management System**.*

*Mục tiêu của buổi báo cáo hôm nay không phải là bài bảo vệ hoàn thiện sản phẩm cuối kỳ, mà là để báo cáo cột mốc kiến trúc, chứng minh tính khả thi trong thiết kế nghiệp vụ, cơ sở dữ liệu và công nghệ cốt lõi của nhóm trước khi bước vào giai đoạn hoàn thiện mã nguồn. Sau đây em xin phép được bắt đầu!"*

---

### [SLIDE 1: TITLE SLIDE]
> **Hành động:** Chỉ tay nhẹ về phía slide tiêu đề trên màn chiếu.

*"Thưa thầy cô, dự án của nhóm em mang tên **ROMS**, viết tắt của **Restaurant Ordering Management System** — Hệ thống quản lý và gọi món thông minh tại bàn dành cho nhà hàng ẩm thực.*

*Dự án được xây dựng trên nền tảng công nghệ chính quy của doanh nghiệp: **Spring Boot 3** kết hợp bảo mật phân quyền **Spring Security**, cơ sở dữ liệu **Microsoft SQL Server**, giao diện người dùng **React**, và cơ chế đồng bộ thời gian thực qua **WebSocket STOMP**."*

---

### [SLIDE 2: PAIN POINTS IN TRADITIONAL RESTAURANT OPERATIONS]
> **Hành động:** [Chuyển sang Slide 2] Nhìn về phía thầy cô, giọng trầm xuống để tạo sự đồng cảm về vấn đề thực tế.

*"Thưa thầy cô, xuất phát điểm của dự án ROMS bắt nguồn từ những bài toán thực tế vô cùng nhức nhối trong vận hành nhà hàng truyền thống, đặc biệt vào các khung giờ cao điểm:*

* **Về phía khách hàng:** Khách bước vào quán giờ cao điểm thường phải chờ từ 10 đến 15 phút chỉ để nhân viên mang menu giấy ra. Khi gọi món, những yêu cầu ghi chú như 'không hành, ít cay' rất dễ bị nhân viên quên hoặc truyền đạt sai. Đến lúc tính tiền, khách phải vẫy tay gọi nhân viên phục vụ rất bất tiện.
* **Về phía nhà bếp:** Bếp truyền thống phụ thuộc hoàn toàn vào những tờ phiếu order bằng giấy. Giấy order rất dễ bị ướt, dính dầu mỡ hoặc thất lạc. Chữ viết tay của phục vụ nhiều khi quá ẩu khiến đầu bếp nấu sai món. Đặc biệt, bếp không có màn hình hiển thị thứ tự ưu tiên món nào vào trước để làm trước.
* **Về phía quản lý:** Nhà hàng đối mặt với nguy cơ thất thoát doanh thu từ các món bị hủy miệng không qua kiểm soát, không nắm bắt được tỷ lệ xoay vòng bàn theo thời gian thực, và các bàn đặt trước thường bị bỏ trống lãng phí do không có cơ chế tự động giải phóng bàn khi khách không đến.*

*Chính vì vậy, ROMS ra đời để số hóa toàn diện quy trình này thành một luồng khép kín thời gian thực."*

---

### [SLIDE 3: PROJECT SCOPE & ARCHITECTURAL PHILOSOPHY]
> **Thời lượng chuẩn:** 2 phút 00 giây – 2 phút 30 giây.  
> **Phong thái:** Đĩnh đạc, dứt khoát, ánh mắt tự tin nhìn thẳng vào các thầy cô phản biện; giọng điệu mang tính định hướng kiến trúc (Architectural Conviction).  
> **Cử chỉ:** Chỉ tay sang cột bên trái **Scope Matrix**, sau đó di chuyển tay sang cột bên phải **Core Philosophy** khi chuyển luận điểm.

*(Mở đầu chuyển ý từ Slide 2 sang Slide 3)*  
*"Kính thưa các thầy cô trong hội đồng, từ những bài toán vận hành nhức nhối vừa nêu ở Slide 2, câu hỏi lớn nhất đặt ra cho nhóm phát triển là: **Làm thế nào để giải quyết triệt để các vấn đề này trong giới hạn một đồ án môn học 6 tuần với nhân sự chỉ vỏn vẹn 3 thành viên?** [Nghỉ 1 giây]*

*Câu trả lời của nhóm em nằm trọn vẹn trong Slide số 3 này: **Xác định ranh giới MVP chuẩn xác và kiên định với triết lý thiết kế hướng chất lượng.**"*

*(Chỉ tay vào Card bên trái — Scope Matrix)*  
*"Thưa thầy cô, đối với một đồ án SWP391, sai lầm lớn nhất của sinh viên thường là 'feature creep' — vẽ ra quá nhiều tính năng rồi cuối kỳ nộp sản phẩm chắp vá, lỗi tè le khi demo. Nhóm em quán triệt một tuyên ngôn hành động ngay từ ngày đầu:*  
> **'Thà làm một tập tính năng vừa đủ nhưng chạy mượt mà 100%, bảo mật chuẩn chỉ và xử lý xung đột đồng thời (concurrency) tận gốc, còn hơn ôm đồm một đống tính năng nửa vời rồi crash trên sân khấu.'**

*Chính vì vậy, nhóm em phân định ranh giới Scope cực kỳ dứt khoát thành hai phần rõ rệt:*

* **Thứ nhất — Về phần Core Must-Have (Cam kết hoàn thiện 100%):** Nhóm tập trung tối đa nguồn lực vào đúng 8 mắt xích tạo nên **một chu trình vận hành khép kín (End-to-End Operational Loop)**:
  1. Xác thực và phân quyền nhân viên chuẩn RBAC;
  2. Định danh và bảo vệ bàn ăn bằng mã QR có **chữ ký số HMAC-SHA256** chống giả mạo;
  3. Quản lý trọn vẹn vòng đời một **Dining Session**;
  4. Quản lý thực đơn và danh mục món ăn;
  5. Giỏ hàng và đặt món theo đợt (Batch Ordering) có **khóa Idempotency Key** chống bấm đúp;
  6. Màn hình điều phối bếp **KDS** theo hàng đợi thời gian thực;
  7. Bản đồ bàn trực quan cho nhân viên phục vụ sảnh;
  8. Tổng hợp hóa đơn, tính thuế VAT 8% theo chuẩn kế toán Việt Nam, thanh toán **Dynamic VietQR**, và cơ chế đặt bàn trước tự động giải phóng bàn nếu khách không đến.

* **Thứ hai — Về phần Out-of-Scope (Chủ động cắt bỏ có tính toán):** Để bảo vệ tiến độ và chất lượng kỹ thuật, nhóm em **từ chối 4 tính năng** thường gây bẫy thời gian:
  1. *Không làm hệ thống chuỗi Multi-tenant:* ROMS được thiết kế tối ưu hóa chuyên sâu cho một nhà hàng độc lập quy mô 20–50 bàn. Chúng em không muốn lãng phí 2 tuần vào việc thiết lập tenant isolation và sharding cơ sở dữ liệu.
  2. *Không làm ứng dụng di động cài đặt (Native Mobile App):* Trong ngành F&B thực tế, không có thực khách nào muốn tải một app 100MB chỉ để gọi 2 cốc nước và một đĩa mì. Nhóm dồn 100% nỗ lực vào **Mobile Web Responsive** — khách chỉ cần mở camera quét là gọi món ngay lập tức, triệt tiêu mọi ma sát trải nghiệm.
  3. *Không làm cổng nạp tiền cọc / trung gian thanh toán trực tuyến phức tạp:* Văn hóa ẩm thực Việt Nam là thanh toán sau khi dùng bữa. Nhóm sử dụng giải pháp **VietQR động chuyển khoản 24/7 trực tiếp vào tài khoản nhà hàng**, vừa thực tế, vừa không mất phí cổng trung gian.
  4. *Không làm tích điểm thành viên (Loyalty Points):* Tránh làm phình to mô hình dữ liệu để tập trung toàn lực kiểm thử độ ổn định của luồng đặt món."*

*(Chỉ tay sang Card bên phải — Core Philosophy)*  
*"Bên cạnh ranh giới phạm vi, linh hồn của dự án ROMS nằm ở **3 Triết lý Kiến trúc cốt lõi** bên phải màn hình:*

* **Triết lý 1: 'Dining Session' là trái tim trung tâm của toàn bộ hệ thống.**  
  *Thưa thầy cô, đây là sự khác biệt giữa tư duy làm bài tập và tư duy thiết kế phần mềm thực tế. Nếu thiết kế sơ sài, người ta sẽ gắn đơn hàng trực tiếp vào Bàn (`Table`). Nhưng Bàn ăn chỉ là một vật thể vật lý vô tri ngoài đời thực. Thực thể mang tính sống còn là **Dining Session (Phiên dùng bữa)**.  
  Một bàn có thể có nhiều người cùng ngồi quét mã; trong 2 tiếng ngồi ăn, khách có thể gọi 3 đợt món khác nhau; và cuối cùng thu ngân chỉ thu đúng một hóa đơn. Toàn bộ logic ràng buộc ai được đặt món, bếp nấu cho ai, và thu ngân in hóa đơn nào... đều xoay quanh vòng đời của Dining Session từ lúc OPEN đến CLOSED. Thiết kế này giúp hệ thống sẵn sàng xử lý mượt mà các tình huống đổi bàn, gộp bàn mà không bao giờ bị loạn đơn.*

* **Triết lý 2: Mã QR chỉ là cánh cổng vào (Entry Point), tuyệt đối không phải là sản phẩm.**  
  *Nhiều người lầm tưởng mã QR chỉ là một đường link dẫn tới trang web tĩnh. Với ROMS, mã QR là một cơ chế xác thực vị trí vật lý. Đường link QR chứa mã bàn kết hợp với chữ ký bảo mật **HMAC-SHA256**. Khách không thể ngồi ở nhà tự gõ `tableId=5` hay chụp ảnh mã QR cũ mang về nhà để đặt món phá hoại nhà hàng.*

* **Triết lý 3: Chất lượng kỹ thuật hơn số lượng tính năng (Quality over Quantity).**  
  *Nhóm em ưu tiên dành chất xám để giải quyết các bài toán hóc búa về tính toàn vẹn dữ liệu: Làm sao để mạng chập chờn khách bấm 5 lần nút Đặt món mà bếp chỉ nhận 1 đơn? Đó là nhờ **Idempotency Key**. Làm sao để hai phục vụ cùng chỉnh sửa một bàn không bị ghi đè dữ liệu? Đó là nhờ cơ chế **Optimistic Locking (`@Version`)**. Đó chính là đẳng cấp kỹ thuật mà nhóm hướng tới trong đồ án này.*

*(Câu kết dứt khoát, mở đường sang Slide 4)*  
*Và để hiện thực hóa triết lý kiến trúc cùng phạm vi nghiệp vụ khép kín này, hệ thống phân chia trách nhiệm và quyền hạn của từng con người trong nhà hàng ra sao? Em xin kính mời quý thầy cô cùng theo dõi **Slide số 4: System Actors & Role-Based Access Control**!"*

---

### [SLIDE 4: SYSTEM ACTORS & ROLE-BASED ACCESS CONTROL]
> **Hành động:** [Chuyển sang Slide 4] Hướng mắt vào 6 khối vai trò trên màn hình.

*"Về mặt người dùng, hệ thống ROMS phân định rạch ròi trách nhiệm của **5 tác nhân con người** và **1 tác nhân hệ thống tự động** tuân thủ chuẩn Role-Based Access Control:
1. **Customer (Khách hàng):** Chỉ cần dùng trình duyệt điện thoại quét mã QR tại bàn để tham gia phiên ăn, xem thực đơn số, đặt món và theo dõi tiến độ nấu nướng.
2. **Waiter (Nhân viên phục vụ):** Quan sát bản đồ bàn, mở phiên ăn cho khách vãng lai, hỗ trợ đặt món giúp khách, và bưng bê các món đã hoàn thành.
3. **Kitchen Staff (Đầu bếp):** Thao tác trực tiếp trên màn hình cảm ứng KDS, xác nhận nấu, báo món đã xong hoặc từ chối món nếu hết nguyên liệu kèm lý do bắt buộc.
4. **Cashier (Thu ngân):** Kiểm tra các món đã phục vụ, tổng hợp hóa đơn, thu tiền mặt hoặc quét mã chuyển khoản VietQR, sau đó đóng phiên ăn để giải phóng bàn.
5. **Restaurant Manager (Quản lý):** Cấu hình khu vực bàn, xuất mã QR bảo mật, cập nhật giá món ăn và theo dõi báo cáo doanh thu.
6. **System (Tác nhân nền tự động):** Chạy ngầm để kiểm tra tính toàn vẹn chữ ký HMAC của mã QR, điều phối gói tin WebSocket, và chạy Cron Job tự động hủy bàn đặt trước nếu khách không đến sau 20 phút."*

---

### [SLIDE 5: FRONT-OF-HOUSE USE CASES (CUSTOMER & WAITER)]
> **Hành động:** [Chuyển sang Slide 5] Chỉ tay sang sơ đồ Use Case `image2.png` ở trên và `image3.png` ở dưới bên tay phải.

*"Trên màn hình là sơ đồ Use Case chi tiết dành cho khối nghiệp vụ sảnh tiệc:
* Nhìn vào **Sơ đồ Use Case Khách hàng** phía trên, điểm mấu chốt nằm ở **UC-09 (Quét QR và khởi tạo Session)** và **UC-16 (Gửi đợt gọi món Batch Ordering)**. Khi khách bấm gửi món, hệ thống gửi kèm một mã định danh duy nhất gọi là **Idempotency Key (UUID v4)** lên server để ngăn chặn triệt để lỗi mạng khiến khách bấm hai lần sinh ra hai đơn hàng trùng lặp.
* Khách cũng có quyền tự hủy món qua **UC-19**, nhưng hệ thống khóa cứng nghiệp vụ: Khách chỉ được hủy khi món còn ở trạng thái PENDING hoặc CONFIRMED. Một khi nhà bếp đã chuyển sang PREPARING (đang nấu), hệ thống sẽ từ chối lệnh hủy để tránh lãng phí nguyên liệu.
* Phía dưới là **Sơ đồ Use Case Phục vụ**, nhân viên có thể theo dõi trực tiếp trạng thái bàn (UC-10), gọi món hộ khách già hoặc khách không rành công nghệ (UC-17), và nhận cảnh báo khi khách bấm chuông gọi hỗ trợ (UC-25)."*

---

### [SLIDE 6: BACK-OF-HOUSE & MANAGEMENT USE CASES]
> **Hành động:** [Chuyển sang Slide 6] Chỉ tay vào 2 sơ đồ `image4.png` và `image5.png`.

*"Tiếp theo là sơ đồ Use Case của khối hậu cần nhà bếp và quản trị điều hành:
* Nhìn vào **Sơ đồ KDS và Thu ngân**, Use Case **UC-20 đến UC-22** thể hiện vòng đời thao tác của đầu bếp trên màn hình KDS. Khi phát hiện hết nguyên liệu, đầu bếp bấm từ chối món (UC-22) và bắt buộc phải nhập lý do từ chối. Ngay lập tức, thông báo sẽ đẩy về điện thoại của khách hàng để chọn món khác.
* Đặc biệt, hệ thống có tính năng tự động định tuyến đồ uống **UC-31**: Những món được gắn cờ là đồ uống đóng chai (is_drink = 1) sẽ **bỏ qua hàng đợi nấu của nhà bếp**, chuyển thẳng sang trạng thái READY để nhân viên phục vụ mang ra bàn ngay lập tức.
* Phía dưới là **Sơ đồ Quản lý**, cung cấp tính năng quản lý tài khoản nhân viên, thiết lập sơ đồ bàn, xuất mã QR bảo mật, và xem bảng phân tích doanh thu bán hàng qua UC-28."*

---

### [SLIDE 7: END-TO-END SCREENS FLOW]
> **Hành động:** [Chuyển sang Slide 7] Dùng tay rà từ trái qua phải trên sơ đồ luồng màn hình `image6.png`.

*"Kính thưa thầy cô, đây là sơ đồ **End-to-End Screens Flow** mô tả toàn bộ hành trình trải nghiệm người dùng từ lúc bước chân vào quán đến khi thanh toán ra về:
1. **Bước 1:** Khách ngồi vào bàn, quét mã QR trên bàn. Hệ thống giải mã token chữ ký số và đưa khách vào màn hình Chào mừng **SCR-09**.
2. **Bước 2:** Khách chọn món trên thực đơn số **SCR-10**, thêm yêu cầu tùy biến vào giỏ hàng chung **SCR-11**, và bấm Gửi gọi món.
3. **Bước 3:** Đơn món lập tức hiển thị trên màn hình bếp KDS **SCR-13**. Đầu bếp bấm xác nhận nấu và hoàn thành món.
4. **Bước 4:** Món chuyển sang trạng thái READY, nhân viên phục vụ bưng ra bàn và cập nhật thành SERVED.
5. **Bước 5:** Khi dùng bữa xong, khách yêu cầu thanh toán. Thu ngân mở màn hình **SCR-17**, hệ thống tự động gom tất cả các món SERVED thành một hóa đơn duy nhất, tính thuế VAT 8%, xuất mã VietQR để khách quét chuyển khoản, và tự động đóng phiên ăn giải phóng bàn về trạng thái Trống."*

---

### [SLIDE 8: SYSTEM ARCHITECTURE & CODE PACKAGES]
> **Hành động:** [Chuyển sang Slide 8] Chỉ tay vào sơ đồ phân lớp package `image8.png`.

*"Về mặt kiến trúc kỹ thuật phía Backend, nhóm em tuân thủ nghiêm ngặt chuẩn **Spring Boot Layered Architecture** (Kiến trúc phân lớp), phân chia rõ ràng trách nhiệm giữa các package:
* `com.roms.config`: Chứa các cấu hình hạ tầng như bộ lọc bảo mật `SecurityFilterChain`, bộ lọc JWT, cấu hình CORS, và tài liệu OpenAPI Swagger.
* `com.roms.controller`: Lớp tiếp nhận API RESTful, thực hiện validate dữ liệu đầu vào qua DTO và kiểm tra quyền hạn RBAC của endpoint.
* `com.roms.dto`: Tách biệt hoàn toàn `request` và `response` DTO, tuyệt đối không để lộ cấu trúc Entity của cơ sở dữ liệu ra bên ngoài client.
* `com.roms.service`: Trái tim nghiệp vụ, quản lý ranh giới giao dịch `@Transactional`, kiểm tra luật chuyển đổi trạng thái State Machine, và xác thực chữ ký số HMAC.
* `com.roms.repository`: Tầng truy xuất dữ liệu Spring Data JPA, hỗ trợ khóa lạc quan **Optimistic Locking (`@Version`)** để xử lý xung đột đồng thời.
* `com.roms.websocket` & `cron`: Chịu trách nhiệm đồng bộ thời gian thực qua kênh STOMP và các tác vụ hẹn giờ tự động chạy nền."*

---

### [SLIDE 9: RELATIONAL DATABASE DESIGN (ERD)]
> **Hành động:** [Chuyển sang Slide 9] Chỉ tay vào sơ đồ ERD `image7.png`, đặc biệt nhấn mạnh vào bảng `dining_sessions` ở giữa.

*"Thưa thầy cô, trên màn hình là sơ đồ quan hệ thực thể **ERD gồm 11 bảng cốt lõi** được thiết kế chuẩn hóa và tối ưu cho hiệu năng:
* Điểm sáng tạo lớn nhất trong thiết kế cơ sở dữ liệu của nhóm em chính là bảng **`dining_sessions`**. Nó đóng vai trò là Hub trung tâm, liên kết giữa `dining_tables`, danh sách các đợt gọi món `orders`, và hóa đơn cuối cùng `bills`. Thiết kế này cho phép 1 bàn có thể có nhiều khách cùng gọi món theo nhiều đợt khác nhau, nhưng toàn bộ doanh thu chỉ chốt về 1 hóa đơn duy nhất khi thanh toán.
* Mối quan hệ giữa `orders` và **`order_items`**: Mỗi lần khách nhấn 'Đặt món' sẽ sinh ra 1 bản ghi trong bảng `orders`. Từng món ăn bên trong sẽ được lưu ở bảng `order_items` — đây chính là thực thể chạy State Machine cho nhà bếp.
* Đặc biệt, trong bảng `order_items`, nhóm em lưu trường **`unit_price` dạng Snapshot Price**. Nghĩa là giá tiền được lưu cứng tại thời điểm khách đặt món. Nếu sau đó người quản lý có chỉnh sửa giá trên bảng thực đơn `food_items`, thì hóa đơn của bàn đang ăn vẫn giữ nguyên giá cũ đúng với lúc họ gọi món, tuân thủ chặt chẽ nghiệp vụ kiểm toán kế toán.
* Bảng **`audit_logs`** được thiết kế bất biến để lưu vết toàn bộ các hành động nhạy cảm như đầu bếp từ chối món, quản lý hủy món, hoặc chuyển bàn để phục vụ công tác hậu kiểm."*

---

### [SLIDE 10: CRITICAL BUSINESS RULES & ORDER STATE MACHINE]
> **Hành động:** [Chuyển sang Slide 10] Giọng đanh thép, rõ ràng khi nói về State Machine và Business Rules.

*"Một hệ thống đặt món nhà hàng muốn chạy ổn định bắt buộc phải có một cỗ máy trạng thái (State Machine) chuẩn mực. Ở cột bên trái:
* **Vòng đời chuẩn của món ăn:** Đi qua 4 nấc tuyến tính: `CONFIRMED` → `PREPARING` → `READY` → `SERVED`. Backend sẽ chặn đứng mọi hành vi nhảy cóc trạng thái bất hợp lệ.
* **Quy tắc hủy món (BR-05):** Khách hàng chỉ được phép hủy món khi món đang ở trạng thái PENDING hoặc CONFIRMED. Một khi bếp bấm chuyển sang PREPARING, nút Hủy trên điện thoại khách sẽ lập tức bị vô hiệu hóa.
* **Quy tắc hoàn tất phiên ăn (BR-08 & BR-16):** Thu ngân không thể đóng phiên thanh toán nếu trong bàn vẫn còn món ăn đang ở trạng thái dở dang như PREPARING hoặc READY. Bắt buộc tất cả món ăn phải ở trạng thái kết thúc (SERVED, hoặc đã bị HỦY/TỪ CHỐI) thì mới được xuất hóa đơn.
* **Quy tắc tính tiền (BR-09 & BR-10):** Hóa đơn chỉ tính tổng tiền của những món có trạng thái là SERVED. Các món bị Hủy hoặc Từ chối tự động loại khỏi hóa đơn với giá 0 đồng."*

---

### [SLIDE 11: NON-UI FUNCTIONS & SECURITY ARCHITECTURE]
> **Hành động:** [Chuyển sang Slide 11] Nhìn vào thầy cô giám khảo phản biện kỹ thuật, nhấn mạnh các giải pháp bảo mật và chịu tải.

*"Bên cạnh giao diện người dùng, tài liệu RDS của nhóm em đặc biệt chú trọng vào **4 cơ chế kỹ thuật Non-UI chạy ngầm** vô cùng quan trọng:
1. **Xác thực mã QR bằng HMAC-SHA256 (FN-01):** Mã QR dán tại bàn không phải là đường link tĩnh lộ `tableId`. Mã QR chứa một token băm mã hóa kết hợp `table_id` với một Secret Key phía Server. Kẻ xấu dù có cố tình thay đổi số bàn trên URL trình duyệt cũng sẽ bị backend phát hiện sai chữ ký số và từ chối truy cập ngay lập tức.
2. **Xử lý trùng lặp đơn hàng qua Idempotency Key (FN-04):** Khi khách bấm đặt món trên điện thoại, nếu mạng 4G chập chờn hoặc khách vô tình double-click, Backend sẽ kiểm tra Idempotency Key (UUID v4) trong Header. Nếu request trùng lặp gửi lên, hệ thống sẽ chặn đứng, đảm bảo không bao giờ bị nhân đôi đơn vào bếp.
3. **Đồng bộ thời gian thực qua WebSocket/STOMP:** Giúp bếp nhận đơn ngay tức khắc khi khách bấm gửi món, và điện thoại khách tự động cập nhật trạng thái 'Đã nấu xong' mà không cần phải F5 tải lại trang.
4. **Hẹn giờ hủy bàn tự động (FN-05):** Cron Job quét mỗi 5 phút một lần. Nếu khách đặt bàn trước mà quá giờ hẹn 20 phút vẫn chưa đến check-in, hệ thống sẽ tự động hủy lịch đặt và mở lại bàn cho khách vãng lai."*

---

### [SLIDE 12: CUSTOMER EXPERIENCE PROTOTYPE]
> **Hành động:** [Chuyển sang Slide 12] Chỉ vào hai hình ảnh mockup di động `image10.png` và `image11.png`.

*"Trên màn hình là hình ảnh giao diện thực tế của khách hàng:
* Hình bên trái **SCR-09** là trang chào mừng ngay sau khi khách quét mã QR. Giao diện hiển thị rõ ràng số bàn đã được xác thực, số lượng khách đang ngồi, và nút bấm tham gia gọi món.
* Hình bên phải **SCR-10 & SCR-11** là thực đơn số và giỏ hàng. Khách có thể xem ảnh món ăn sắc nét, lọc theo danh mục món khai vị, món chính, đồ uống; xem tình trạng còn hàng; tùy chọn ghi chú nấu nướng; và quan sát tổng tiền giỏ hàng chung của cả bàn được đồng bộ liên tục."*

---

### [SLIDE 13: KITCHEN KDS & FLOOR TABLE MAP PROTOTYPE]
> **Hành động:** [Chuyển sang Slide 13] Chỉ tay vào giao diện màn hình KDS `image12.png` và bản đồ bàn `image13.png`.

*"Đây là giao diện làm việc của bộ phận vận hành:
* Hình bên trái là **màn hình bếp KDS** hiển thị trên máy tính bảng hoặc màn hình cảm ứng chuyên dụng trong bếp. Các đơn món được hiển thị dưới dạng thẻ (Ticket Cards) có đồng hồ đếm thời gian từ lúc nhận đơn. Đầu bếp chỉ cần 1 chạm để chuyển trạng thái sang Đang nấu hoặc Đã xong. Các đơn chờ quá 15 phút sẽ tự động đổi màu cảnh báo để bếp ưu tiên nấu trước.
* Hình bên phải là **Bản đồ bàn thời gian thực** dành cho nhân viên phục vụ và quản lý. Các bàn được mã hóa màu sắc trực quan: Màu xanh lá là bàn trống sẵn sàng; màu đỏ là bàn đang có khách ăn; màu vàng cam là bàn đã có lịch đặt trước; màu xám là bàn đang dọn dẹp."*

---

### [SLIDE 14: STAFF AUTHENTICATION & ROLE DASHBOARD]
> **Hành động:** [Chuyển sang Slide 14] Chỉ vào giao diện đăng nhập và Dashboard `image9.png`.

*"Hình ảnh trên màn hình minh họa giao diện xác thực và bảng điều khiển quản trị:
* Nhân viên đăng nhập trực tiếp bằng tài khoản và mật khẩu nội bộ được băm bảo mật an toàn bằng thuật toán **BCrypt**. Hệ thống xác thực danh tính tức thì và kích hoạt phân quyền vai trò (RBAC) theo ca làm việc.
* Hệ thống tự động điều hướng thông minh theo quyền: Phục vụ vào thẳng Bản đồ bàn, Đầu bếp vào thẳng KDS, Thu ngân vào thẳng Hóa đơn, và Quản lý vào trang Dashboard thống kê doanh thu trong ngày, số lượng món bán chạy nhất và tỷ lệ lấp đầy bàn."*

---

### [SLIDE 15: NON-FUNCTIONAL REQUIREMENTS & QUALITY GOALS]
> **Hành động:** [Chuyển sang Slide 15] Giọng đĩnh đạc, tự tin vào các tiêu chuẩn chất lượng kỹ thuật.

*"Để đảm bảo phần mềm hoạt động trơn tru trong môi trường thực tế, tài liệu RDS của nhóm em cam kết 4 bộ chỉ số phi chức năng có thể đo lường được:
* **Hiệu năng (Performance):** Thời gian phản hồi API trung bình dưới 500ms; thời gian xác thực mã QR dưới 300ms; độ trễ cập nhật đơn hàng lên KDS dưới 2 giây; hệ thống chịu tải mượt mà với 50 người dùng đồng thời trong giờ cao điểm của 1 nhà hàng.
* **Bảo mật (Security):** Toàn bộ API nội bộ được kiểm soát chặt chẽ theo phân quyền RBAC; mật khẩu nhân viên băm muối bằng BCrypt; giới hạn Brute-force tối đa 5 lần đăng nhập sai/phút trên một địa chỉ IP.
* **Khả năng sử dụng (Usability):** Giao diện khách hàng thiết kế chuẩn Mobile-First cho màn hình điện thoại từ 360px đến 414px; giao diện KDS font chữ tối thiểu 16px đọc rõ từ khoảng cách 60cm; toàn bộ thông báo lỗi hiển thị bằng tiếng Việt thân thiện, tuyệt đối không văng mã lỗi 500 hay Stack Trace ra màn hình.
* **Độ tin cậy (Reliability):** Áp dụng khóa lạc quan `@Version` để ngăn chặn hai nhân viên cùng chỉnh sửa một đơn hàng cùng lúc."*

---

### [SLIDE 16: MILESTONE PROGRESS & RISK MITIGATION]
> **Hành động:** [Chuyển sang Slide 16] Chỉ vào lộ trình các Sprint và chiến lược quản trị rủi ro.

*"Về tiến độ triển khai môn học SWP391:
* Nhóm em đã hoàn thành xuất sắc Sprint 1 và Sprint 2 với tài liệu SRS và phân tích Use Case được phê duyệt ở Milestone M1.
* Hiện tại ở Sprint 3, nhóm đã hoàn thành trọn vẹn tài liệu thiết kế RDS với 11 bảng ERD, kiến trúc gói Spring Boot và đặc tả API để nghiệm thu Milestone M2.
* Trong các Sprint 4 và Sprint 5 tiếp theo, nhóm sẽ tập trung cao độ code luồng đặt món khách hàng End-to-End và màn hình bếp KDS để demo thực tế trước hội đồng.
* Nhóm cũng đã chuẩn bị sẵn các phương án phòng ngừa rủi ro kỹ thuật: Nếu môi trường mạng demo gặp sự cố chặn cổng WebSocket STOMP, hệ thống đã được lập trình sẵn cơ chế **HTTP Polling dự phòng chu kỳ 2 giây** để đảm bảo buổi demo luôn diễn ra mượt mà."*

---

### [SLIDE 17: SUMMARY & Q&A SESSION]
> **Hành động:** [Chuyển sang Slide 17] Cúi đầu nhẹ, nở nụ cười tươi, hai tay mở rộng hướng về phía hội đồng.

*"Kính thưa quý thầy cô, tóm lại, thông qua bài thuyết trình tổng quan dự án và tài liệu RDS ngày hôm nay, nhóm ROMS chúng em đã định hình được một nền móng kiến trúc kỹ thuật vững chắc: từ mô hình dữ liệu tập trung vào Dining Session, quy trình cỗ máy trạng thái đơn hàng nghiêm ngặt, cho đến các cơ chế xử lý đồng thời và bảo mật mã QR.

Nhóm chúng em xin chân thành cảm ơn quý thầy cô đã lắng nghe. Chúng em rất mong nhận được những lời nhận xét, đóng góp quý báu và các câu hỏi phản biện từ thầy cô để nhóm hoàn thiện sản phẩm một cách tốt nhất trong các Sprint tiếp theo. Em xin trân trọng cảm ơn!"*

---

# PHẦN 3: BỘ CÂU HỎI VẤN ĐÁP (Q&A) HỘI ĐỒNG SWP391 THƯỜNG HỎI & CÁCH TRẢ LỜI ĐIỂM 10

Dưới đây là 10 câu hỏi hóc búa nhất mà các giảng viên môn SWP391 Đại học FPT thường xuyên chất vấn trong các buổi thẩm định RDS / Architecture, kèm câu trả lời chuẩn xác nhất:

#### Câu 1: Tại sao trong database các em lại tách ra bảng `dining_sessions` mà không lưu trực tiếp `table_id` vào bảng `orders` và `bills`?
* **Cách trả lời ăn trọn điểm:**  
  *"Thưa thầy/cô, đây là quyết định kiến trúc cốt lõi của nhóm em. Nếu lưu trực tiếp `table_id` vào `orders` hay `bills`, hệ thống sẽ gặp bế tắc khi giải quyết bài toán thời gian (temporal data). Bàn ăn là thực thể vật lý cố định, nhưng một bàn trong một ngày sẽ đón hàng chục lượt khách khác nhau. Hơn nữa, một nhóm khách vào ăn có thể gọi món làm 3-4 đợt khác nhau (`orders`). Nếu gắn trực tiếp vào bàn, khi tính tiền chúng ta sẽ không biết những order nào thuộc về lượt khách hiện tại, order nào là của lượt khách trước đó. Bảng `dining_sessions` đại diện cho một 'phiên dùng bữa' độc nhất. Nhiều khách cùng quét QR vào bàn sẽ cùng tham gia vào 1 session_id, nhiều đợt gọi món cùng thuộc 1 session_id, và khi tính tiền, hóa đơn `bills` chỉ cần tổng hợp đúng session_id đó là xong. Sau khi thanh toán, session chuyển sang CLOSED và bàn lại sẵn sàng cho một session mới."*

#### Câu 2: Giả sử khách hàng chụp ảnh mã QR tại bàn mang về nhà, hôm sau họ quét mã QR đó thì có đặt món được không? Hệ thống ngăn chặn việc này như thế nào?
* **Cách trả lời ăn trọn điểm:**  
  *"Thưa thầy/cô, hệ thống của nhóm em chặn đứng trường hợp này bằng 2 tầng bảo vệ:  
  Tầng 1 là **Business Rule BR-01 & BR-11**: Khách hàng chỉ có thể đặt món khi bàn đó đang có một Dining Session ở trạng thái `ACTIVE`. Khi khách đã ăn xong và thanh toán ngày hôm trước, session đó đã bị đóng (`CLOSED`). Nếu hôm sau ở nhà quét lại, hệ thống kiểm tra bàn hiện tại chưa có phiên ăn active hoặc phiên ăn cũ đã đóng thì sẽ không cho phép vào giao diện đặt món.  
  Tầng 2 là **Chữ ký số HMAC-SHA256**: Mã QR chứa chữ ký điện tử mã hóa `table_id` và `secret_key` từ phía server. Khách không thể tự ý sửa đổi URL để hack sang bàn khác. Hơn nữa, nếu muốn nâng cao bảo mật, trong mỗi phiên ăn mới mở, hệ thống hoàn toàn có thể sinh thêm một `session_token` động nhúng vào phiên đó, khiến mã QR cũ chụp về nhà trở nên vô giá trị."*

#### Câu 3: Nếu 2 người cùng ngồi một bàn và cùng bấm 'Đặt món' một lúc, hoặc 1 người bị mạng chậm bấm đúp 2 lần vào nút 'Đặt món', hệ thống xử lý như thế nào để không bị nhân đôi đơn hàng?
* **Cách trả lời ăn trọn điểm:**  
  *"Thưa thầy/cô, nhóm em xử lý bằng kỹ thuật **Idempotency Key (FN-04)** kết hợp **Database Transaction**:  
  Khi khách hàng nhấn nút gửi giỏ hàng, Frontend sẽ tạo ra một mã định danh ngẫu nhiên duy nhất theo chuẩn UUID v4 gắn vào Header của Request gọi là `Idempotency-Key`. Phía Backend, trước khi tạo order, hệ thống sẽ kiểm tra xem mã key này đã được xử lý trong vòng 2 phút gần nhất chưa. Nếu khách bấm đúp do mạng lag, request thứ hai gửi lên có cùng Idempotency Key sẽ bị hệ thống phát hiện và chặn lại ngay, trả về kết quả của request đầu tiên mà không tạo thêm order mới.  
  Còn trường hợp 2 người khác nhau cùng ngồi một bàn bấm đặt món, họ sẽ mang 2 Idempotency Key khác nhau và tạo ra 2 đợt order riêng biệt (ví dụ Order #101 và Order #102), nhưng cả 2 order này đều trỏ chung về cùng 1 `session_id`, do đó đầu bếp vẫn nhận đủ món và khi tính tiền cả 2 order đều được gom chung vào 1 hóa đơn mà không hề bị mất mát hay xung đột dữ liệu."*

#### Câu 4: Khách hàng đang đặt món mà muốn đổi ý hủy món thì hệ thống xử lý ra sao? Có cho khách hủy tùy ý không?
* **Cách trả lời ăn trọn điểm:**  
  *"Thưa thầy/cô, hệ thống **tuyệt đối không cho khách hủy món tùy ý**, mà tuân theo cỗ máy trạng thái nghiêm ngặt theo quy tắc **BR-05**:  
  Khách hàng chỉ có thể tự bấm hủy món khi món ăn đó đang ở trạng thái `PENDING` (chờ bếp nhận) hoặc `CONFIRMED` (mới nhận đơn). Một khi đầu bếp trên màn hình KDS đã bấm nút bắt đầu nấu và chuyển trạng thái sang `PREPARING`, Backend sẽ khóa chức năng hủy món của khách hàng. Nếu khách vẫn gửi request hủy lên, server sẽ trả về lỗi HTTP 400 Bad Request kèm thông báo 'Món ăn đã được chế biến, không thể tự hủy'. Nếu khách có lý do đặc biệt muốn hủy, bắt buộc phải báo nhân viên phục vụ hoặc quản lý sử dụng quyền đặc biệt (Void Item - UC-29) kèm lý do giải trình để ghi vào bảng `audit_logs`."*

#### Câu 5: Tại sao trong bảng `order_items` lại cần lưu trường `unit_price` trong khi bảng `food_items` đã có trường `price` rồi? Như vậy có bị dư thừa dữ liệu (redundancy) không?
* **Cách trả lời ăn trọn điểm:**  
  *"Thưa thầy/cô, đây là kỹ thuật **Snapshot Data** bắt buộc trong thiết kế phần mềm thương mại và kế toán, không phải là dư thừa dữ liệu xấu.  
  Nếu chúng ta không lưu `unit_price` ở `order_items` mà mỗi lần tính tiền lại `JOIN` sang bảng `food_items` để lấy giá, thì giả sử hôm nay khách gọi món Bò Bít Tết giá 100.000đ. Đúng lúc khách đang ăn, người quản lý vào cập nhật giá món ăn trên Menu tăng lên 150.000đ. Khi khách ra thanh toán, hóa đơn sẽ bị tính nhầm thành 150.000đ, gây tranh cãi và sai lệch sổ sách kế toán.  
  Trường `unit_price` trong `order_items` dùng để 'chụp lại' chính xác giá tiền của món ăn tại đúng thời điểm khách đặt món, đảm bảo tính toàn vẹn dữ liệu tài chính lịch sử."*

#### Câu 6: Hai nhân viên phục vụ cùng lúc bấm cập nhật trạng thái của một món ăn hoặc một bàn ăn thì giải quyết xung đột đồng thời (concurrency) thế nào?
* **Cách trả lời ăn trọn điểm:**  
  *"Thưa thầy/cô, nhóm em sử dụng cơ chế **Khóa lạc quan — Optimistic Locking** của JPA thông qua annotation `@Version` trên các thực thể `OrderItem` và `DiningTable`.  
  Mỗi bản ghi sẽ có một cột số nguyên `version`. Khi 2 nhân viên cùng đọc bản ghi có `version = 1`, người thứ nhất bấm cập nhật thành công, database sẽ tăng `version` lên 2. Khi người thứ hai bấm cập nhật sau đó một phần nghìn giây, câu lệnh UPDATE kèm điều kiện `WHERE version = 1` sẽ không tìm thấy bản ghi nữa, Spring Boot sẽ ném ra ngoại lệ `OptimisticLockException`. Hệ thống sẽ bắt ngoại lệ này và trả về thông báo thân thiện cho nhân viên thứ hai: 'Dữ liệu đã được cập nhật bởi một người khác, vui lòng làm mới giao diện', ngăn chặn hoàn toàn việc dữ liệu bị ghi đè mất kiểm soát (Lost Update)."*

#### Câu 7: Tại sao nhóm lại tự tin chọn WebSocket STOMP mà không dùng Polling? Nhỡ lên bảo vệ mạng của trường chặn WebSocket thì sao?
* **Cách trả lời ăn trọn điểm:**  
  *"Thưa thầy/cô, nhóm em chọn **WebSocket với giao thức STOMP over SockJS** vì đây là giải pháp tối ưu nhất cho bài toán nhà bếp KDS: bếp cần nhận thông báo đơn hàng tức thì (độ trễ dưới vài trăm mili-giây) mà không cần liên tục gửi hàng nghìn request HTTP gây quá tải server như Polling truyền thống.  
  Tuy nhiên, nhận thức được rủi ro mạng chập chờn hoặc tường lửa của trường có thể chặn kết nối WebSocket, nhóm em đã xây dựng sẵn kiến trúc **Dự phòng hai lớp (Fallback Architecture)**:  
  Thư viện SockJS ở Frontend sẽ tự động thử kết nối WebSocket trước; nếu phát hiện bị chặn cổng, SockJS sẽ tự động hạ cấp xuống HTTP Long-Polling. Đồng thời, ở tầng ứng dụng, nhóm em đã viết sẵn cơ chế tự động Polling chu kỳ 2 giây một lần để nếu rớt mạng WebSocket hoàn toàn thì hệ thống vẫn cập nhật trạng thái bình thường mà không ảnh hưởng đến buổi bảo vệ."*

#### Câu 8: Món đồ uống (is_drink = 1) được xử lý khác món ăn thường như thế nào trong luồng nghiệp vụ?
* **Cách trả lời ăn trọn điểm:**  
  *"Thưa thầy/cô, đây là tính năng **FN-03 (Beverage Bypass Router)** trong tài liệu RDS. Trong thực tế nhà hàng, các loại đồ uống như Coca, Bia đóng lon hay nước suối không cần đầu bếp chế biến trong bếp nóng.  
  Nếu đẩy đồ uống vào hàng đợi KDS của bếp sẽ gây rác màn hình và làm chậm thời gian phục vụ. Do đó, khi khách đặt một món có cờ `is_drink = 1`, hệ thống sẽ tự động tách món này ra khỏi hàng đợi của bếp, tự động gán trạng thái là `READY` (sẵn sàng phục vụ), và bắn ngay một thông báo đẩy đến điện thoại/máy tính bảng của nhân viên phục vụ để họ lấy đồ uống từ tủ mát mang ra bàn cho khách ngay lập tức."*

#### Câu 9: Tính năng đặt bàn trước (Reservation) được đồng bộ với khách vãng lai (Walk-in) như thế nào để tránh xung đột xếp trùng bàn?
* **Cách trả lời ăn trọn điểm:**  
  *"Thưa thầy/cô, nhóm em giải quyết bằng quy tắc nghiệp vụ **BR-13 và BR-15**:  
  Khi khách đặt bàn trước thành công cho một khung giờ nhất định (ví dụ 19:00), hệ thống sẽ tính toán cửa sổ bảo vệ trước 45 phút (tức là 18:15). Đúng 18:15, trạng thái của bàn đó trên bản đồ bàn sẽ tự động chuyển sang màu vàng cam — `RESERVED`.  
  Khi nhân viên phục vụ xếp chỗ cho khách vãng lai, hệ thống sẽ kiểm tra: nếu bàn đang có trạng thái `RESERVED` thì nút 'Mở phiên ăn' sẽ bị vô hiệu hóa, nhân viên không thể cấp bàn này cho khách vãng lai được.  
  Đồng thời, hệ thống có Cron Job quét mỗi 5 phút: nếu đến 19:20 (tức quá giờ hẹn 20 phút) mà khách đặt bàn vẫn chưa đến check-in, hệ thống sẽ tự động chuyển trạng thái đơn đặt bàn thành `EXPIRED` (quá hạn) và trả bàn về trạng thái `AVAILABLE` (xanh lá) để đón khách khác."*

#### Câu 10: Nếu có khách ăn xong trốn không trả tiền hoặc khách chuyển bàn thì hệ thống ghi nhận thế nào để không thất thoát doanh thu?
* **Cách trả lời ăn trọn điểm:**  
  *"Thưa thầy/cô, hệ thống xử lý qua 2 tính năng trong RDS:  
  1. **Trường hợp chuyển bàn (UC-30):** Nhân viên phục vụ hoặc thu ngân có thể thực hiện thao tác Chuyển bàn (Table Transfer). Hệ thống sẽ cập nhật trường `table_id` trong `dining_sessions` hiện tại sang bàn mới, giải phóng bàn cũ về trạng thái CLEANING và đánh dấu bàn mới thành OCCUPIED. Toàn bộ các món đã gọi vẫn giữ nguyên trong session đó mà không phải tạo lại từ đầu.  
  2. **Trường hợp bất khả kháng hủy đơn/bùng tiền:** Nhân viên bình thường không có quyền xóa order. Chỉ có tài khoản Quản lý (Manager) mới có quyền sử dụng chức năng **Void Item / Force Close Session (UC-29)**. Khi quản lý bấm hủy, hệ thống bắt buộc phải nhập lý do hủy (ví dụ: 'Khách bỏ về', 'Món hỏng') và toàn bộ thông tin người thực hiện, thời gian, giá trị thất thoát đều được ghi bất biến vào bảng **`audit_logs`** để đối soát tài chính cuối ca."*

---
*(Hết tài liệu thuyết trình & Kịch bản tiếng Việt)*
