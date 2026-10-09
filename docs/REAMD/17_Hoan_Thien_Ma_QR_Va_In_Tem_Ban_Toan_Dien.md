# BƯỚC 17: HOÀN THIỆN MÃ QR THỰC TẾ, TRANG IN TEM BÀN KHỔ A4 & XÁC THỰC KHÁCH HÀNG (FULL-STACK & PRODUCTION-READY)

> **Mục tiêu:** Nâng cấp toàn diện phân hệ Mã QR từ trạng thái mô phỏng (Mock / Placeholder) lên hoạt động thực tế 100% (Production-Ready) ở cả 2 phía:
> 1. **Phía Backend (Spring Boot 3.4.5 + Java 21 + Lombok):** Cấu hình linh hoạt Domain/IP mạng LAN thật (`192.168.0.92:5173` hoặc `localhost:5173`) thay cho domain ảo `roms.restaurant`, giúp camera điện thoại thật quét được mã QR; hoàn thiện API kiểm tra mã QR token (`POST /api/customer/tables/verify-qr`).
> 2. **Phía Frontend (React 19 + Vite + CSS Print):**
>    - **Trang Quản trị (`TableManagementPage.jsx`):** Nâng cấp nút *"Xuất Tất Cả Mã QR"* thành **Modal In Tem Bàn Toàn Nhà Hàng (Batch QR Print Sheet)** đạt chuẩn in ấn khổ giấy A4 (mỗi tờ 6 tem dán bàn gồm Logo ROMS, Mã bàn to, Phân khu, Ảnh QR nét cao, Hướng dẫn 3 bước, Thông tin WiFi), hỗ trợ in trực tiếp hoặc bấm **Save as PDF**.
>    - **Trang Chào Bàn Khách Hàng (`TableWelcomePage.jsx`):** Kết nối API xác thực mã QR thật với Backend; chặn truy cập nếu mã QR cũ đã bị quản lý đổi mới hoặc bàn ăn đang bị khóa.
> 
> **Cam kết:** Tài liệu hướng dẫn chi tiết từng bước, có sơ đồ luồng, giải thích nguyên lý thiết kế và toàn bộ đoạn mã đều có **chú thích (comment) 100%** rõ ràng.

---

## 1. TỔNG QUAN KIẾN TRÚC & LUỒNG DỮ LIỆU THỰC TẾ

### 1.1. So sánh Hiện trạng (Mock) vs Mục tiêu (Thật)

| Thành phần | Hiện trạng (Mock) | Sau khi nâng cấp (Thật 100%) |
| :--- | :--- | :--- |
| **URL mã hóa trong QR** | `https://roms.restaurant/dining/welcome?...` (Domain ảo, điện thoại quét báo lỗi) | `http://192.168.0.92:5173/dining/welcome?...` (IP thật trong Wi-Fi LAN hoặc `localhost:5173`, điện thoại quét mở ngay trang gọi món) |
| **Nút "Xuất Tất Cả Mã QR"** | Chỉ hiện thông báo `toast` giả lập, không xuất file | Mở Modal **Print Sheet A4** hiển thị lưới 20 tem bàn dán bàn chuyên nghiệp, bấm nút kích hoạt `window.print()` lưu PDF hoặc in ấn ngay |
| **Modal xem QR từng bàn** | Chỉ có ảnh QR và nút đổi token | Thêm nút **"Mở Thử Nghiệm Gọi Món"** (click test trực tiếp trên máy) và công tắc chọn Base URL (IP Wi-Fi vs Localhost) |
| **Trang Chào Bàn (`TableWelcomePage`)** | Đọc param URL mà không kiểm tra token với Backend | Gọi API `verify-qr` kiểm tra CSDL thật; nếu token sai hoặc hết hạn sẽ hiển thị màn hình cảnh báo không cho vào |

---

### 1.2. Sơ đồ tuần tự xử lý luồng Quét QR & In Tem (Sequence Diagram)

```text
=== LUỒNG 1: QUẢN TRỊ VIÊN IN TEM BÀN & XUẤT PDF A4 ===
[Quản Lý (Web Admin)]               [TableManagementPage]               [Trình Duyệt Browser Print]
        │                                    │                                    │
        │─── 1. Bấm "Xuất Tất Cả Mã QR" ────>│                                    │
        │                                    │─── 2. Hiển thị Modal Sheet A4 ────>│
        │                                    │    (Lưới 20 tem: Logo, QR, WiFi)   │
        │─── 3. Bấm "In Ngay / Lưu PDF" ────>│                                    │
        │                                    │─── 4. window.print() ─────────────>│
        │<── 5. Hộp thoại in / Save as PDF ──│<── Áp dụng CSS @media print ───────│

=== LUỒNG 2: THỰC KHÁCH DÙNG ĐIỆN THOẠI QUÉT QR GỌI MÓN ===
[Thực Khách (Điện thoại)]         [Trình duyệt Mobile]         [Backend: CustomerTableController]    [Database SQL Server]
        │                                  │                                    │                         │
        │─── 1. Quét mã QR trên bàn ──────>│                                    │                         │
        │    (Mở link 192.168.0.92:5173)   │                                    │                         │
        │                                  │─── 2. POST /api/customer/tables/verify-qr ──────────────────>│
        │                                  │        { qrToken: "qr-b01-token" } │                         │
        │                                  │                                    │─── findByQrToken(...) ──>│
        │                                  │<── 3. 200 OK: TableResponse ───────│<── Bàn hợp lệ & Active ─│
        │<── 4. Màn hình Chào bàn mở ra ───│    (Tên bàn: B-01, Sức chứa: 4 chỗ)│                         │
        │    (Sẵn sàng chọn món vào giỏ)   │                                    │                         │
```

---

## 2. HƯỚNG DẪN THỰC HIỆN TỪNG BƯỚC

---

### BƯỚC 1: CẤU HÌNH BASE URL TRONG BACKEND (SPRING BOOT)

#### 1.1. Thêm cấu hình địa chỉ Frontend trong `application.properties`
- **File:** `SourceCode/backend/roms/src/main/resources/application.properties`
- **Mục đích:** Khai báo địa chỉ Frontend để Backend sinh mã QR chính xác. Khi phát triển cục bộ và test trên điện thoại cùng mạng Wi-Fi, đặt là IP Wi-Fi của máy tính (`192.168.0.92:5173`).

```properties
# ===================================================================
# CẤU HÌNH ĐỊA CHỈ TRUY CẬP FRONTEND (DÙNG ĐỂ SINH LINK TRONG MÃ QR)
# ===================================================================
# Khi test trên điện thoại cùng mạng Wi-Fi: dùng IP máy tính (vd: http://192.168.0.92:5173)
# Khi chỉ test trên trình duyệt máy tính: dùng http://localhost:5173
app.frontend.url=http://192.168.0.92:5173
```

#### 1.2. Cập nhật `RestaurantTableServiceImpl.java` để sinh URL thật
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/serviceImpl/RestaurantTableServiceImpl.java`
- **Mục đích:** Inject giá trị `@Value("${app.frontend.url:http://localhost:5173}")` và thay thế domain ảo `https://roms.restaurant` bằng giá trị cấu hình thực tế.

```java
// Khai báo thuộc tính nhận Base URL từ application.properties
@Value("${app.frontend.url:http://localhost:5173}")
private String frontendBaseUrl;

// Trong hàm mapToTableResponse (dòng ~323):
// Tạo link gọi món thực tế dẫn tới màn hình chào bàn của khách
String targetDiningUrl = frontendBaseUrl + "/dining/welcome?table=" + table.getId() + "&token=" + table.getQrToken();

// Mã hóa URL để đưa vào dịch vụ sinh ảnh QR ma trận 2D
String qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" +
        URLEncoder.encode(targetDiningUrl, StandardCharsets.UTF_8);
```

---

### BƯỚC 2: NÂNG CẤP GIAO DIỆN QUẢN TRỊ (`TableManagementPage.jsx`)

#### 2.1. Thêm State Quản lý In Tem Hàng Loạt
Trong `SourceCode/frontend/src/pages/admin/TableManagementPage.jsx`:
```javascript
// State mở/đóng Modal Xem & In Tem Bàn Hàng Loạt (Khổ A4)
const [showBatchQrModal, setShowBatchQrModal] = useState(false);

// State chọn chế độ Base URL cho mã QR (LAN IP hoặc Localhost)
const [qrHostMode, setQrHostMode] = useState('LAN'); // 'LAN' hoặc 'LOCALHOST'
```

#### 2.2. Nâng cấp nút "Xuất Tất Cả Mã QR" trên Toolbar
Thay thế hàm gọi `showToast` mô phỏng bằng việc mở Modal in tem chuyên nghiệp:
```jsx
<button
  type="button"
  onClick={() => setShowBatchQrModal(true)}
  title="Mở bảng in tem mã QR toàn bộ các bàn trong nhà hàng (Khổ A4)"
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '12px',
    background: '#FFFFFF',
    border: '1px solid #EAE0DE',
    fontWeight: 700,
    fontSize: '0.85rem',
    color: '#56423D',
    cursor: 'pointer'
  }}
>
  <Icon name="print" size={18} />
  Xuất & In Tất Cả Mã QR
</button>
```

#### 2.3. Xây dựng Modal In Tem Bàn Khổ A4 (`BatchQrPrintModal`)
Modal này bao gồm:
1. **Thanh điều khiển đầu trang:**
   - Nút **"In Ngay / Lưu PDF (A4)"** (`window.print()`).
   - Bộ lọc xem theo phân khu (Tất cả, Tầng 1, Tầng 2, VIP).
   - Nút Đóng.
2. **Khu vực xem trước bản in (Print Sheet Preview):**
   - Định dạng kích thước mô phỏng chuẩn trang giấy A4.
   - Lưới bố trí tem bàn: Mỗi trang 6 tem (2 cột x 3 hàng), vừa vặn để in ra giấy decal rồi cắt dán lên từng bàn.
   - Mỗi tem bàn gồm:
     - Header: Logo ROMS + "QUÉT MÃ GỌI MÓN".
     - Center: Mã hiệu bàn to rõ (`T-01`), Tên bàn & Sức chứa.
     - Ảnh QR chất lượng cao (300x300).
     - Footer: 3 bước hướng dẫn thực khách + Mật khẩu WiFi nhà hàng (`WiFi: dine2025`).
3. **Đoạn mã CSS `@media print`:**
   - Khi bấm lệnh In của trình duyệt, tự động ẩn toàn bộ header, sidebar, nút bấm; chỉ giữ lại duy nhất khung tem bàn, ngắt trang chuẩn xác sau mỗi 6 tem.

#### 2.4. Bổ sung nút "Mở Thử Nghiệm Gọi Món" trong Modal QR đơn lẻ
Tại `MODAL 1: XEM VÀ IN MÃ QR CỦA BÀN`, bổ sung nút giúp người quản trị có thể click mở trực tiếp link gọi món trên tab mới mà không cần điện thoại quét:
```jsx
<a
  href={`/dining/welcome?table=${selectedQrTable.id}&token=${selectedQrTable.qrToken}`}
  target="_blank"
  rel="noopener noreferrer"
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    width: '100%',
    padding: '10px',
    borderRadius: '10px',
    background: '#FDF7F5',
    border: '1px dashed #9D4124',
    color: '#9D4124',
    fontSize: '0.8rem',
    fontWeight: 700,
    textDecoration: 'none',
    marginTop: '12px'
  }}
>
  <Icon name="open_in_new" size={16} />
  Mở Thử Nghiệm Gọi Món (Tab Mới)
</a>
```

---

### BƯỚC 3: KẾT NỐI XÁC THỰC MÃ QR THẬT CHO THỰC KHÁCH (`TableWelcomePage.jsx`)

#### 3.1. Thêm hàm gọi API xác thực trong `tableApi.js`
- **File:** `SourceCode/frontend/src/api/tableApi.js`
```javascript
// Xác thực mã QR token khi khách quét điện thoại vào bàn
verifyQr: (qrToken) => {
    return axiosClient.post('/customer/tables/verify-qr', { qrToken });
}
```

#### 3.2. Cập nhật `TableWelcomePage.jsx`
- **File:** `SourceCode/frontend/src/pages/customer/TableWelcomePage.jsx`
- **Nghiệp vụ thực hiện:**
  1. Khi vừa tải trang, lấy `token` từ URL parameter (`searchParams.get('token')`).
  2. Hiển thị trạng thái `isVerifying = true` (Đang kiểm tra bàn...).
  3. Gọi `tableApi.verifyQr(tokenParam)`:
     - **Thành công (200 OK):** Nhận về thông tin bàn thực tế từ CSDL (`code`, `name`, `zoneName`, `capacity`), cập nhật số khách mặc định và lưu vào `CartContext`.
     - **Thất bại (400 / 404 / 403):** Chuyển sang màn hình cảnh báo lỗi:
       > ⚠️ *"Mã QR này không hợp lệ hoặc đã bị thay đổi! Vui lòng liên hệ nhân viên hoặc quét lại mã mới tại bàn."*
       Kèm nút *"Gọi nhân viên hỗ trợ"* và nút *"Thử lại"*.

---

## 3. HƯỚNG DẪN TEST & KIỂM THỬ THỰC TẾ

### 3.1. Kiểm thử trên Máy tính (Desktop Localhost)
1. Đăng nhập vào trang Quản lý bàn: `http://localhost:5173/admin/tables` (Mã PIN: `123456`).
2. Bấm nút **"Xuất & In Tất Cả Mã QR"** ở thanh công cụ trên cùng.
   - Quan sát: Modal hiển thị bản in toàn bộ 20 tem bàn rõ ràng.
   - Bấm **"In Ngay / Lưu PDF"**: Chọn đích đến là **Save as PDF** để tải tệp PDF về máy.
3. Bấm nút **QR** trên bàn bất kỳ (ví dụ: `B-01`):
   - Bấm nút **"Mở Thử Nghiệm Gọi Món"**: Trình duyệt mở tab mới vào `/dining/welcome?table=29&token=qr-b01-...`.
   - Quan sát: Hệ thống tự động xác thực với Backend và hiển thị đúng tên bàn *"B-01 - Ban Công 01"*.

### 3.2. Kiểm thử trên Điện thoại thật (Mobile via Wi-Fi)
1. Đảm bảo điện thoại và máy tính kết nối **cùng một mạng Wi-Fi** (hoặc phát Wi-Fi Hotspot từ điện thoại cho máy tính).
2. Kiểm tra IP máy tính: `192.168.0.92`.
3. Bật camera trên điện thoại, quét mã QR hiển thị trên màn hình máy tính (hoặc trên tem PDF đã in).
4. Điện thoại nhận diện liên kết `http://192.168.0.92:5173/dining/welcome?table=...&token=...` và mở trực tiếp trang chào bàn trên trình duyệt điện thoại.
5. Kiểm tra trường hợp bảo mật: Trên trang Admin, bấm nút **"Đổi Token"** cho bàn đó.
   - Thử tải lại trang trên điện thoại: Hệ thống lập tức báo lỗi *"Mã QR đã hết hạn"*, ngăn chặn hành vi sử dụng mã cũ trái phép.

---

## 4. TỔNG KẾT CÁC FILE ĐƯỢC TẠO HOẶC CHỈNH SỬA

| File | Thay đổi chính |
| :--- | :--- |
| `SourceCode/backend/roms/src/main/resources/application.properties` | Bổ sung cấu hình `app.frontend.url` trỏ về IP Wi-Fi/Localhost |
| `SourceCode/backend/roms/.../RestaurantTableServiceImpl.java` | Sử dụng `frontendBaseUrl` khi sinh chuỗi URL trong mã QR |
| `SourceCode/frontend/src/api/tableApi.js` | Thêm hàm `verifyQr(qrToken)` gọi `POST /api/customer/tables/verify-qr` |
| `SourceCode/frontend/src/pages/admin/TableManagementPage.jsx` | Thêm Modal In Tem Bàn Hàng Loạt Khổ A4, nút test link trực tiếp, print CSS |
| `SourceCode/frontend/src/pages/customer/TableWelcomePage.jsx` | Nối API xác thực `verifyQr`, hiển thị thông tin bàn thật từ DB & cảnh báo token sai |
| `docs/REAMD/17_Hoan_Thien_Ma_QR_Va_In_Tem_Ban_Toan_Dien.md` | File tài liệu hướng dẫn kỹ thuật chuẩn này |
| `docs/REAMD/README.md` | Cập nhật mục lục tài liệu bước 17 |
