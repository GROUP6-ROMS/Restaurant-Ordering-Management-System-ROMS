# 14. KHỞI TẠO VÀ KIẾN TRÚC FRONTEND HỆ THỐNG ROMS (REACT + VITE)

---

## 1. TỔNG QUAN KIẾN TRÚC FRONTEND

Dự án Frontend của ROMS (**Restaurant Ordering Management System**) được xây dựng theo định hướng **Enterprise-grade Web Application**, tối ưu hóa cho cả thiết bị di động (Mobile-First cho khách quét mã QR tại bàn) và màn hình lớn/tablet (POS Thu ngân, KDS Bếp, Floor Plan Phục vụ).

### Công nghệ cốt lõi
- **Build Tool**: Vite v8 (siêu nhẹ, Hot Module Replacement dưới 1 giây).
- **Library**: React 19 (Component-based, JSX thuần túy, dễ bảo trì và phân công nhóm).
- **Styling**: Vanilla CSS với **ROMS Design System** chuẩn công nghiệp (Tone màu Crimson Red `#D32F2F`, Amber `#FF6F00`, Forest Green `#2E7D32`, Glassmorphism, Responsive CSS Grid & Flexbox).
- **Routing**: `react-router-dom` v6 (tách biệt luồng khách hàng `/dining` và luồng nhân viên `/waiter`, `/kitchen`, `/pos`).
- **Icons**: `lucide-react` (icon hiện đại, nhẹ, đồng bộ giao diện).
- **Mock Service Architecture**: Tích hợp sẵn `src/mock/mockData.js`, lưu trữ trạng thái phiên ăn và giỏ hàng qua `localStorage`, cho phép **chạy thử nghiệm và demo toàn bộ 4 phân hệ ngay lập tức** mà không cần đợi kết nối cơ sở dữ liệu backend.

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN (`SourceCode/frontend`)

```text
SourceCode/frontend/
├── index.html                     # HTML goc voi font Plus Jakarta Sans & Inter
├── package.json                   # Dependencies: react, react-router-dom, lucide-react, axios
├── vite.config.js                 # Cau hinh Vite dev server
└── src/
    ├── main.jsx                   # Entry point React
    ├── App.jsx                    # Root component boc AuthProvider & CartProvider
    ├── index.css                  # ROMS Design System (Bien mau, Dark theme, Utility classes)
    ├── mock/
    │   └── mockData.js            # Du lieu mau cho mon an, danh muc, ban an, don hang KDS
    ├── context/
    │   ├── AuthContext.jsx        # Context xac thuc & chuyen doi vai tro nhan vien (Waiter/Kitchen/Cashier)
    │   └── CartContext.jsx        # Context gio hang, ban an hien tai, tinh tong tien va VAT
    ├── components/
    │   └── layout/
    │       ├── CustomerLayout.jsx # Layout di dong cho thuc khach (Header ban an + Bottom navigation)
    │       └── StaffLayout.jsx    # Layout nhan vien (Sidebar thao tac + Topbar dong ho so)
    ├── routes/
    │   └── AppRoutes.jsx          # Dinh tuyen tap trung cho toan bo cac phan he
    └── pages/
        ├── public/
        │   ├── LandingPage.jsx    # Trang chu gioi thieu & link nhanh toi cac phan he
        │   └── ReservationPage.jsx# Form dat ban online cho khach hang
        ├── customer/
        │   ├── TableWelcomePage.jsx    # SCR-09: Khach quet ma QR & chon so nguoi an
        │   ├── CustomerMenuPage.jsx    # SCR-10: Thuc don mon an, loc category, popup ghi chu
        │   ├── CustomerCartPage.jsx    # SCR-12: Xem lai gio hang, ghi chu mon, xac nhan gui bep
        │   └── CustomerTrackingPage.jsx# SCR-11: Theo doi tien do nau mon (Milestone Tracker)
        ├── waiter/
        │   └── WaiterFloorPlanPage.jsx # SCR-05: So do ban an truc quan, trang thai ban, xem QR
        ├── kitchen/
        │   └── KitchenKdsPage.jsx      # SCR-15: Man hinh bep KDS, dong ho dem thoi gian nau
        └── cashier/
            └── PosCheckoutPage.jsx     # SCR-02: Man hinh thu ngan POS, thanh toan VietQR/Tien mat
```

---

## 3. CÁCH KHỞI ĐỘNG VÀ VẬN HÀNH

### Bước 1: Mở Terminal tại thư mục Frontend
```bash
cd SourceCode/frontend
```

### Bước 2: Cài đặt thư viện (nếu cài mới)
```bash
npm install
```

### Bước 3: Khởi chạy Dev Server
```bash
npm run dev
```

Server sẽ khởi chạy tại: **`http://localhost:5173/`**

---

## 4. BẢNG DANH MỤC ĐƯỜNG DẪN TRẢI NGHIỆM HỆ THỐNG

| Phân hệ | Đường dẫn truy cập | Mô tả nghiệp vụ |
| :--- | :--- | :--- |
| **Cổng trung tâm** | `http://localhost:5173/` | Trang điều hướng nhanh đến tất cả các phân hệ và tài liệu |
| **Đặt bàn trực tuyến** | `http://localhost:5173/reservation` | Khách đặt chỗ trước, chọn giờ, số khách và ghi chú |
| **Khách quét QR Bàn 5** | `http://localhost:5173/dining/welcome?table=5&token=table-05-secret-token` | Mô phỏng hành vi khách quét tem QR tại Bàn 05 |
| **Thực đơn thực khách** | `http://localhost:5173/dining/menu` | Xem danh mục, tìm kiếm món, thêm món vào giỏ với ghi chú |
| **Giỏ hàng gọi món** | `http://localhost:5173/dining/cart` | Kiểm tra giỏ hàng, bảng kê VAT và bấm "Gửi đơn xuống Bếp" |
| **Theo dõi món ăn** | `http://localhost:5173/dining/orders/tracking` | Thanh tiến trình 4 chặng: Đã gửi -> Đang nấu -> Lên bàn -> Hoàn tất |
| **Sơ đồ bàn (Phục vụ)** | `http://localhost:5173/waiter/floor-plan` | Xem trực quan 10 bàn ăn, đổi trạng thái bàn, xem mã QR bàn |
| **Màn hình Bếp (KDS)** | `http://localhost:5173/kitchen/kds` | Bếp nhận đơn tức thì, bấm "Bắt đầu nấu" và "Hoàn tất ra món" |
| **Thu ngân (POS)** | `http://localhost:5173/pos/checkout` | Chọn bàn thanh toán, áp dụng mã giảm giá, quét VietQR / Tiền mặt |

---

## 5. ĐIỂM NỔI BẬT CỦA BẢN THIẾT KẾ
1. **Khớp 100% với Frozen Specification (`UI_DESIGN_FREEZE_SPEC.md`)**: Màu sắc nhận diện, định dạng mã số bàn, luồng gọi món và thanh toán đều tuân thủ thiết kế đã chốt.
2. **Khách hàng gọi món không cần đăng nhập**: Luồng định danh dựa trên URL Token của bàn ăn, trải nghiệm quét mã cực nhanh.
3. **Phân quyền nhân viên tích hợp trên thanh Topbar**: Nhân viên có thể linh hoạt chuyển đổi giữa Phục vụ bàn, Bếp trưởng, Thu ngân để kiểm thử nghiệp vụ liền mạch.
