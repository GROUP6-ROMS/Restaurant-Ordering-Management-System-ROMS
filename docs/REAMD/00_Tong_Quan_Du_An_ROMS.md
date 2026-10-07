# 🔍 Phân Tích Sâu Dự Án ROMS — Báo Cáo Kỹ Thuật Cao Cấp

> **Ngày phân tích:** 30/09/2026 | **Phân tích bởi:** Senior Software Engineer (AI)  
> **Dự án:** Restaurant Ordering Management System (ROMS)  
> **Repo:** `duongtrong06tk-rgb/Restaurant-Ordering-Management-System-ROMS-`

---

## 1. Tổng Quan Cấu Trúc Dự Án

```
Restaurant-Ordering-Management-System-ROMS-/
├── README.md                    ← Kế hoạch dự án đầy đủ (~260 dòng)
├── docs/
│   └── UI_DESIGN_FREEZE_SPEC.md ← Biên bản khóa thiết kế 18 màn hình
└── SourceCode/
    ├── backend/
    │   └── roms/                ← Spring Boot project (Maven)
    │       ├── pom.xml
    │       └── src/
    │           ├── main/
    │           │   ├── java/com/romsteam/roms/
    │           │   │   └── RomsApplication.java   ← Entry point duy nhất
    │           │   └── resources/
    │           │       └── application.properties ← Chỉ có app name
    │           └── test/
    │               └── java/com/romsteam/roms/
    │                   └── RomsApplicationTests.java
    └── frontend/                ← THƯ MỤC TRỐNG — chưa khởi tạo
```

---

## 2. Đánh Giá Từng Layer

### 2.1 Tài Liệu (README + Design Spec)

| Hạng mục | Chất lượng | Nhận xét |
|:---------|:----------:|:---------|
| Problem Statement | ✅ Tốt | 3 góc nhìn: Customer, Kitchen, Management |
| Business Rules (BR) | ✅ Xuất sắc | 17 BR chi tiết, có implementation hint |
| Functional Requirements | ✅ Tốt | 16 FR đầy đủ, có Actor và Priority |
| Non-Functional Requirements | ✅ Tốt | 5 nhóm NFR, có số đo cụ thể |
| Order State Machine | ✅ Rõ ràng | `PENDING→CONFIRMED→PREPARING→READY→SERVED` |
| UI Design Freeze Spec | ✅ Rõ ràng | 18 màn hình, route map, API mapping |
| API Contract | ⚠️ Sơ lược | Chỉ có trong bảng UI Freeze, chưa có OpenAPI spec |
| ERD / Database Schema | ❌ Thiếu | Chưa có file ERD hoặc migration script |

**Nhận xét:** Tài liệu ở mức rất cao so với bối cảnh sinh viên SWP391. README thể hiện tư duy hệ thống tốt. Tuy nhiên, thiếu ERD và API contract là rào cản lớn để bắt đầu code song song.

---

### 2.2 Backend (Spring Boot)

**Stack hiện tại:**
- Spring Boot **4.1.1** + Java **21**
- Chỉ có 2 dependency: `spring-boot-starter` + `spring-boot-starter-test`
- `application.properties`: chỉ có `spring.application.name=roms`

> [!CAUTION]
> **Backend ở trạng thái skeleton hoàn toàn** — chỉ có entry point `RomsApplication.java`. Chưa có bất kỳ package nào: controller, service, repository, entity, config, dto, exception.

**Các dependency thiếu nghiêm trọng theo yêu cầu hệ thống:**

| Dependency cần thêm | Lý do |
|:--------------------|:------|
| `spring-boot-starter-web` | REST API |
| `spring-boot-starter-data-jpa` | ORM / Repository layer |
| `spring-boot-starter-security` | JWT + RBAC |
| `spring-boot-starter-validation` | Input validation (NFR-S05) |
| `mssql-jdbc` (Microsoft SQL Server) | Database driver |
| `io.jsonwebtoken:jjwt` | JWT generation/validation |
| `springdoc-openapi-starter-webmvc-ui` | Swagger UI (NFR-M02) |
| `lombok` | Boilerplate reduction |

**Spring Boot 4.1.1** — Đây là phiên bản rất mới (Spring Boot 4.x yêu cầu Java 21+). Cần xác nhận team có đủ familiarity với Spring Boot 4.x vs 3.x, vì 4.x vẫn đang còn mới trong cộng đồng.

---

### 2.3 Frontend

> [!CAUTION]
> **Thư mục `frontend/` hoàn toàn trống.** Không có file nào. Chưa khởi tạo React project.

Theo UI Design Freeze Spec, frontend cần React với:
- 18 màn hình đã được freeze
- Routing: React Router với các path đã định sẵn
- Color palette: `#D32F2F`, `#FF6F00`, `#2E7D32`
- Typography: Plus Jakarta Sans & Inter/Be Vietnam Pro
- Mobile-first (Customer), Tablet/Desktop (Staff)

---

### 2.4 Database

> [!CAUTION]
> **Không có bất kỳ file database nào:** không có ERD, không có SQL migration, không có seed script.

Theo NFR-M04, cần seed data: ≥10 bàn, ≥3 category, ≥15 món, ≥3 tài khoản staff.

---

### 2.5 Testing

Chỉ có `RomsApplicationTests.java` với test rỗng `contextLoads()`. Chưa có unit test thực tế.

---

## 3. Phân Tích Domain Model (Từ Tài Liệu)

Dựa trên README và Business Rules, domain model dự kiến:

```
┌─────────────┐    1:N    ┌──────────────────┐
│    Table    │──────────▶│  DiningSession   │
│ (AVAILABLE, │           │ (ACTIVE,         │
│  OCCUPIED,  │           │  COMPLETED,      │
│  DIRTY,     │           │  CANCELLED)      │
│  RESERVED)  │           └────────┬─────────┘
└─────────────┘                    │ 1:N
       ▲                           ▼
       │                    ┌──────────────┐
┌──────────────┐            │    Order     │
│ Reservation  │            │ (PENDING,    │
│              │            │  CONFIRMED,  │
└──────────────┘            │  PREPARING,  │
                            │  READY,      │
┌─────────────┐             │  SERVED,     │
│  MenuItem   │             │  CANCELLED,  │
│  (Category) │             │  REJECTED)   │
└──────┬──────┘             └──────┬───────┘
       │ N:M                       │ 1:N
       ▼                           ▼
┌──────────────┐          ┌────────────────┐
│   OrderItem  │◀─────────│   OrderItem    │
│ (unit_price  │          │ (snapshot price│
│  snapshot)   │          │  BR-17)        │
└──────────────┘          └────────────────┘

┌──────────────┐    ┌──────────────┐
│     Bill     │    │     User     │
│ (per session)│    │ (MANAGER,    │
└──────────────┘    │  WAITER,     │
                    │  KITCHEN,    │
                    │  CASHIER)    │
                    └──────────────┘
```

**Business entity trung tâm:** `DiningSession` (BR-01 đến BR-16 đều liên quan)

---

## 4. Phân Tích API Contract (Từ UI Freeze Spec)

| Nhóm | Endpoints đã xác định |
|:-----|:----------------------|
| Auth | `POST /api/v1/auth/login`, `POST /api/v1/auth/logout` |
| QR/Table | `POST /api/v1/tables/verify-qr`, `GET /api/v1/tables/available-slots` |
| Session | `POST /api/v1/sessions/init-or-join` |
| Menu | `GET /api/v1/categories`, `GET /api/v1/menu-items` |
| Order | `POST /api/v1/orders`, `GET /api/v1/sessions/{id}/orders`, `POST /api/v1/orders/{id}/cancel`, `POST /api/v1/orders/waiter-take`, `PATCH /api/v1/orders/{id}/serve` |
| Kitchen | `GET /api/v1/kitchen/orders`, `PATCH /api/v1/kitchen/orders/{id}/status`, `SSE /api/v1/kitchen/stream` |
| Bill | `GET /api/v1/bills/session/{sessionId}`, `POST /api/v1/bills/checkout-cash`, `POST /api/v1/bills/checkout-vnpay`, `GET /api/v1/bills/history`, `GET /api/v1/bills/{id}/print` |
| Waiter | `GET /api/v1/waiter/floor-plan`, `POST /api/v1/tables/{id}/clean`, `POST /api/v1/reservations/check-in`, `GET /api/v1/tables/{id}/active-session`, `POST /api/v1/tables/{id}/transfer`, `PATCH /api/v1/tables/{id}/status` |
| Reservations | `POST /api/v1/reservations`, `GET /api/v1/reservations/check-in` |
| Service Req | `POST /api/v1/service-requests` |
| Admin | `GET/POST /api/v1/admin/users`, `PUT /api/v1/admin/users/{id}`, `GET/POST /api/v1/categories`, `GET/POST/PUT /api/v1/menu-items`, `PATCH /api/v1/menu-items/{id}/availability` |
| Dashboard | `GET /api/v1/admin/dashboard/kpi`, `GET /api/v1/admin/dashboard/revenue-chart`, `GET /api/v1/admin/dashboard/top-dishes` |
| Shifts | `POST /api/v1/shifts/open`, `POST /api/v1/shifts/close`, `GET /api/v1/shifts/current-summary` |

> [!NOTE]
> KDS dùng **SSE** (`/api/v1/kitchen/stream`) — đây là lựa chọn tốt hơn WebSocket thuần cho use case one-way push từ server xuống.

---

## 5. Rủi Ro Kỹ Thuật (Risk Assessment)

| # | Rủi ro | Mức độ | Khuyến nghị |
|:--|:-------|:------:|:------------|
| R1 | Backend skeleton, thiếu toàn bộ dependency | 🔴 Cao | Bổ sung pom.xml ngay trong tuần này |
| R2 | Frontend hoàn toàn trống | 🔴 Cao | Khởi tạo Vite + React project ngay |
| R3 | Không có ERD / Schema | 🔴 Cao | Thiết kế ERD trước khi code Entity |
| R4 | Spring Boot 4.x — ecosystem mới, ít tài liệu tiếng Việt | 🟡 Trung bình | Downgrade về 3.4.x nếu gặp khó |
| R5 | SSE cho KDS — cần xử lý reconnect, timeout | 🟡 Trung bình | Test kỹ, có fallback polling |
| R6 | QR HMAC-SHA256 — crypto implementation | 🟡 Trung bình | Unit test bắt buộc (NFR-M05) |
| R7 | VNPay integration — cần sandbox key | 🟡 Trung bình | Bắt đầu với Cash, VNPay sau |
| R8 | Idempotency Key cho Order — phức tạp | 🟡 Trung bình | Dùng unique constraint DB + Redis nếu cần |
| R9 | Optimistic Locking (`@Version`) — cần test concurrency | 🟡 Trung bình | Test với 2 thread đồng thời |
| R10 | Frontend trống nhưng đã freeze 18 màn hình — áp lực UI | 🟡 Trung bình | Dùng component library (shadcn/Ant Design) |
| R11 | Reservation auto-release Scheduler (NFR-R06) | 🟢 Thấp | `@Scheduled` trong Spring Boot |

---

## 6. Đánh Giá Tổng Thể

### ✅ Điểm mạnh
- **Tài liệu Business xuất sắc** — README, BR, FR, NFR đều rất chuyên nghiệp
- **Domain model rõ ràng** — `DiningSession` là trung tâm đúng
- **UI/UX đã freeze** — không còn scope creep từ design
- **API surface xác định** qua UI Freeze Spec

### ❌ Điểm yếu / Khoảng trống nghiêm trọng
- **Backend = skeleton rỗng** — chỉ có entry point, 0 business code
- **Frontend = thư mục trống** — chưa khởi tạo project
- **Không có ERD** — rào cản lớn nhất để bắt đầu code
- **pom.xml thiếu 8+ dependency** quan trọng
- **application.properties trống** — chưa có DB config, JWT config, v.v.

---

## 7. Roadmap Kỹ Thuật Đề Xuất (4 tuần đầu)

### Tuần 1 — Nền Tảng (Foundation)
```
[Backend]
- Bổ sung đầy đủ pom.xml dependencies
- Cấu hình application.properties (DB, JWT, logging)
- Thiết kế ERD → tạo Entity classes với JPA annotations
- Cấu hình SecurityConfig (JWT Filter, RBAC)
- Seed data script

[Frontend]
- Khởi tạo Vite + React project
- Cài đặt React Router, Axios, State management (Zustand/Context)
- Thiết lập design tokens (màu, font theo spec)
- Login screen (SCR-01)
```

### Tuần 2 — Core Flow 1: QR → Session → Menu
```
[Backend]
- QR token generator + HMAC-SHA256 validator
- Table API (CRUD + verify-qr)
- DiningSession API (init-or-join)
- Category + MenuItem API (public GET)

[Frontend]
- Table Welcome Screen (SCR-09)
- Customer Mobile Menu (SCR-10)
```

### Tuần 3 — Core Flow 2: Cart → Order → Kitchen
```
[Backend]
- Order API (POST với Idempotency Key)
- Order State Machine service
- Kitchen API + SSE stream
- Order cancel API (BR-05)

[Frontend]
- Customer Cart (SCR-12)
- Customer Order Tracking (SCR-11)
- KDS Screen (SCR-15)
```

### Tuần 4 — Core Flow 3: Staff → Bill → Payment
```
[Backend]
- Waiter floor plan + table management
- Bill aggregation (BR-09, BR-10, BR-16)
- Cash payment + Session close
- Basic Manager APIs

[Frontend]
- Waiter Terminal (SCR-05, SCR-06)
- POS Checkout (SCR-02)
- Admin Menu Management (SCR-22)
```

---

## 8. Cấu Trúc Package Backend Đề Xuất

```
com.romsteam.roms/
├── RomsApplication.java
├── config/
│   ├── SecurityConfig.java
│   ├── JwtConfig.java
│   └── OpenApiConfig.java
├── controller/
│   ├── AuthController.java
│   ├── TableController.java
│   ├── SessionController.java
│   ├── MenuController.java
│   ├── OrderController.java
│   ├── KitchenController.java
│   ├── WaiterController.java
│   ├── BillController.java
│   ├── ReservationController.java
│   └── AdminController.java
├── service/
│   ├── AuthService.java
│   ├── QrTokenService.java       ← HMAC-SHA256
│   ├── SessionService.java
│   ├── OrderService.java
│   ├── OrderStateMachine.java    ← Core business logic
│   ├── KitchenService.java
│   ├── BillService.java
│   └── ReservationScheduler.java ← @Scheduled
├── repository/
│   ├── UserRepository.java
│   ├── TableRepository.java
│   ├── DiningSessionRepository.java
│   ├── OrderRepository.java
│   ├── OrderItemRepository.java
│   ├── MenuItemRepository.java
│   ├── CategoryRepository.java
│   ├── BillRepository.java
│   └── ReservationRepository.java
├── entity/
│   ├── User.java
│   ├── Table.java
│   ├── DiningSession.java        ← @Version for optimistic locking
│   ├── Order.java                ← @Version for optimistic locking
│   ├── OrderItem.java
│   ├── MenuItem.java
│   ├── Category.java
│   ├── Bill.java
│   ├── BillItem.java
│   └── Reservation.java
├── dto/
│   ├── request/
│   └── response/
├── exception/
│   ├── GlobalExceptionHandler.java
│   ├── BusinessException.java
│   └── ResourceNotFoundException.java
├── security/
│   ├── JwtFilter.java
│   ├── JwtUtil.java
│   └── UserDetailsServiceImpl.java
└── enums/
    ├── OrderStatus.java           ← PENDING, CONFIRMED, PREPARING, READY, SERVED, CANCELLED, REJECTED
    ├── SessionStatus.java         ← ACTIVE, COMPLETED, CANCELLED
    ├── TableStatus.java           ← AVAILABLE, OCCUPIED, DIRTY, RESERVED
    └── UserRole.java              ← MANAGER, WAITER, KITCHEN, CASHIER
```

---

*Báo cáo kết thúc. Dự án có tài liệu tốt nhưng codebase gần như trắng. Ưu tiên tuyệt đối: khởi động code trong tuần này.*
