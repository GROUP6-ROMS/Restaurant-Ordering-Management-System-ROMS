# BIÊN BẢN KHÓA THIẾT KẾ GIAO DIỆN (UI/UX DESIGN FREEZE SPECIFICATION)
## DỰ ÁN: ROMS — RESTAURANT ORDERING MANAGEMENT SYSTEM
### MÃ DỰ ÁN STITCH: `8715052598064593406` | PHIÊN BẢN CƠ SỞ: BASELINE v1.0.0

---

> **Phê duyệt bởi:** Giảng viên cao cấp hướng dẫn bộ môn SWP391 — Đại học FPT  
> **Thời điểm có hiệu lực:** Ngày 30/09/2026  
> **Trạng thái:** 🔒 **LOCKED & FROZEN (ĐÃ KHÓA HOÀN TOÀN)**  
> **Nguyên tắc:** Kể từ thời điểm này, **chặn đứng 100% việc thêm màn hình mới (Zero Scope Creep Policy)**. Toàn bộ tài nguyên được chuyển giao sang giai đoạn lập trình (Implementation Phase).

---

## 1. QUYẾT ĐỊNH KHÓA THIẾT KẾ (DESIGN FREEZE SIGN-OFF)

Sau khi rà soát toàn bộ 18 màn hình/assets được thiết kế trên hệ thống **Stitch Project ID: `8715052598064593406`**, Giảng viên hướng dẫn cùng toàn bộ 03 thành viên nhóm phát triển chính thức thống nhất:

1. Bộ giao diện hiện tại đã **đáp ứng đầy đủ 100%** các yêu cầu chức năng (FR-01 đến FR-16) và quy tắc nghiệp vụ (BR-01 đến BR-17) theo tài liệu SRS.
2. Thiết kế đạt chuẩn thẩm mỹ cao cấp (Bảng màu nhận diện Crimson Red `#D32F2F`, Amber Orange `#FF6F00`, Forest Green `#2E7D32`; Typography: Plus Jakarta Sans & Inter/Be Vietnam Pro; Bố cục chuẩn Mobile, Tablet và Desktop).
3. **Chính thức đóng băng (Freeze) cấu trúc trang và danh mục màn hình.** Mọi yêu cầu phát sinh giao diện mới đều bị từ chối; các trạng thái vi mô (loading, empty, error, confirmation popup) sẽ được giải quyết dưới dạng Component/Modal lồng trong các màn hình sẵn có.

---

## 2. DANH MỤC 18 MÀN HÌNH CHÍNH THỨC ĐƯỢC ĐÓNG BĂNG (FROZEN SCREEN INVENTORY)

Dưới đây là danh mục cơ sở (Baseline) cố định. Khi lập trình Frontend React, các thành viên bắt buộc phải bám sát cấu trúc Route, Component và API được quy định trong bảng này:

### NHÓM 1: CÔNG CỘNG & ĐẶT BÀN TRƯỚC (PUBLIC & RESERVATION)
| Mã màn hình | Tên màn hình Stitch | Route Frontend (React) | Thiết bị | Người phụ trách | API Backend kết nối |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `Asset` | ROMS Logo Transparent Emblem | `/assets/logo.svg` | SVG | TV 2 | Dùng chung toàn hệ thống |
| `Landing` | ROMS - Smart Restaurant Landing Page | `/` | Desktop | TV 2 | Static / Public info |
| `Reservation` | Trang Đặt Bàn Trực Tuyến - ROMS Reservation | `/reservation` | Desktop/Mobile | TV 2 | `POST /api/v1/reservations`<br>`GET /api/v1/tables/available-slots` |

### NHÓM 2: TRẢI NGHIỆM THỰC KHÁCH QUÉT QR TẠI BÀN (CUSTOMER MOBILE QR)
| Mã màn hình | Tên màn hình Stitch | Route Frontend (React) | Thiết bị | Người phụ trách | API Backend kết nối |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `SCR-09` | Table Welcome Screen | `/dining/welcome?table=...&token=...` | Mobile | TV 2 | `POST /api/v1/tables/verify-qr`<br>`POST /api/v1/sessions/init-or-join` |
| `SCR-10` | Customer Mobile Menu | `/dining/menu` | Mobile | TV 2 | `GET /api/v1/categories`<br>`GET /api/v1/menu-items` |
| `SCR-12` | Customer Mobile Cart | `/dining/cart` | Mobile | TV 2 | `POST /api/v1/orders` *(Idempotency Key)* |
| `SCR-11` | Customer Table & Order Tracking | `/dining/orders/tracking` | Mobile | TV 2 | `GET /api/v1/sessions/{id}/orders`<br>`POST /api/v1/orders/{id}/cancel`<br>`POST /api/v1/service-requests` |

### NHÓM 3: BỘ PHẬN BẾP (KITCHEN BACK-OF-HOUSE)
| Mã màn hình | Tên màn hình Stitch | Route Frontend (React) | Thiết bị | Người phụ trách | API Backend kết nối |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `SCR-15` | Kitchen Display System (KDS) - Redesigned | `/kitchen/kds` | Desktop/Tablet | TV 1 | `GET /api/v1/kitchen/orders`<br>`PATCH /api/v1/kitchen/orders/{id}/status`<br>`SSE /api/v1/kitchen/stream` |

### NHÓM 4: BỘ PHẬN PHỤC VỤ SÀN (WAITER FLOOR SERVICE)
| Mã màn hình | Tên màn hình Stitch | Route Frontend (React) | Thiết bị | Người phụ trách | API Backend kết nối |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `SCR-05` | ROMS Waiter Terminal - Trạm Phục Vụ & Sơ Đồ Sảnh | `/waiter/floor-plan` | Desktop/Tablet | TV 3 | `GET /api/v1/waiter/floor-plan`<br>`POST /api/v1/tables/{id}/clean`<br>`POST /api/v1/reservations/check-in` |
| `SCR-06` | Chi Tiết Đơn Đang Phục Vụ & Gọi Món Tại Bàn | `/waiter/tables/{id}/order` | Desktop/Tablet | TV 3 | `GET /api/v1/tables/{id}/active-session`<br>`POST /api/v1/orders/waiter-take`<br>`PATCH /api/v1/orders/{id}/serve` |
| `SCR-07` | Chuyển Bàn & Đổi Trạng Thái Bàn | `/waiter/tables/{id}/transfer` | Modal/Desktop | TV 3 | `POST /api/v1/tables/{id}/transfer`<br>`PATCH /api/v1/tables/{id}/status` |

### NHÓM 5: THU NGÂN & KÉT TIỀN (CASHIER & BILLING POS)
| Mã màn hình | Tên màn hình Stitch | Route Frontend (React) | Thiết bị | Người phụ trách | API Backend kết nối |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `SCR-02` | POS Terminal - Quầy Thu Ngân ROMS | `/pos/checkout` | Desktop | TV 3 | `GET /api/v1/bills/session/{sessionId}`<br>`POST /api/v1/bills/checkout-cash`<br>`POST /api/v1/bills/checkout-vnpay` |
| `SCR-03` | POS Invoice & Order History | `/pos/invoices` | Desktop | TV 3 | `GET /api/v1/bills/history`<br>`GET /api/v1/bills/{id}/print` |
| `SCR-04` | Cash Drawer & Shift Handover Close | `/pos/shift-handover` | Desktop | TV 3 | `POST /api/v1/shifts/open`<br>`POST /api/v1/shifts/close`<br>`GET /api/v1/shifts/current-summary` |

### NHÓM 6: QUẢN TRỊ VIÊN & XÁC THỰC (ADMINISTRATION & AUTH)
| Mã màn hình | Tên màn hình Stitch | Route Frontend (React) | Thiết bị | Người phụ trách | API Backend kết nối |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `SCR-01` | Staff Login Screen | `/login` | Desktop | TV 1 | `POST /api/v1/auth/login`<br>`POST /api/v1/auth/logout` |
| `SCR-21` | Quản Lý Nhân Sự, Phân Quyền & Phân Ca | `/admin/staff` | Desktop | TV 3 | `GET /api/v1/admin/users`<br>`POST /api/v1/admin/users`<br>`PUT /api/v1/admin/users/{id}` |
| `SCR-22` | Quản Lý Thực Đơn, Món Ăn & Cấu Hình | `/admin/menu` | Desktop | TV 3 | `GET/POST /api/v1/categories`<br>`GET/POST/PUT /api/v1/menu-items`<br>`PATCH /api/v1/menu-items/{id}/availability` |
| `SCR-24` | Báo Cáo & Hiệu Suất Vận Hành | `/admin/dashboard` | Desktop | TV 3 | `GET /api/v1/admin/dashboard/kpi`<br>`GET /api/v1/admin/dashboard/revenue-chart`<br>`GET /api/v1/admin/dashboard/top-dishes` |

---

## 3. NGUYÊN TẮC THỰC THI SAU KHI KHÓA THIẾT KẾ (DESIGN FREEZE RULES)

1. **Quy tắc Bất di bất dịch (Immutable Scope):**
   * Không một thành viên nào được tự ý thêm màn hình mới hoặc đề xuất tính năng mới (không thêm voucher giảm giá, không thêm tích điểm thành viên, không thêm chatbot).
   * Mọi màn hình trên Frontend React phải tuân thủ đúng bảng màu (`#D32F2F`, `#FF6F00`, `#2E7D32`), kích thước font chữ và bố cục đã chốt trên Stitch.
2. **Quy tắc xử lý Micro-States (Trạng thái con):**
   * Các trạng thái lỗi (QR sai, mất mạng), trạng thái rỗng (Giỏ hàng trống, Bếp hết đơn), popup xác nhận (Hủy món, Thanh toán) **bắt buộc được thiết kế dưới dạng Component lồng (Modal / Alert / Toast)** bên trong 18 màn hình trên.
3. **Chuyển giao quyền ưu tiên:**
   * 100% thời gian của 3 thành viên từ ngày 01 đến ngày 36 sẽ tập trung vào: **Xây dựng Database SQL Server → Lập trình Spring Boot Backend → Tích hợp React Frontend → Viết Unit Test & Kiểm thử Concurrency**.

---

*Biên bản này có giá trị ràng buộc cam kết tiến độ và chất lượng cho toàn bộ đồ án SWP391 của nhóm.*
