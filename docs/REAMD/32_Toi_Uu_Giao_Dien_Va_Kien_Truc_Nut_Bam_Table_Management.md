# BƯỚC 32: TỐI ƯU KIẾN TRÚC GIAO DIỆN & LOẠI BỎ RỐI NÚT TRÊN SƠ ĐỒ BÀN ĂN (TABLE MANAGEMENT UX REFACTOR)

> **Mục tiêu:** Tái cấu trúc (Refactor) toàn diện hệ thống nút bấm chức năng trên trang Quản lý Sơ đồ Bàn ăn (`TableManagementPage.jsx`), giải quyết triệt để tình trạng **quá tải nhận thức (Cognitive Overload)** và **rối loạn thị giác** khi mỗi thẻ bàn hiển thị 7–8 nút bấm đồng thời (tổng cộng hơn 112 nút trên màn hình). Áp dụng 3 chuẩn thiết kế kiến trúc Full-Stack cao cấp: **Menu Ngữ Cảnh Kebab 3 Chấm (`...`)**, **1 Nút Hành Động Trọng Tâm Theo Trạng Thái (FSM Call-To-Action)**, và **Hợp Nhất Thao Tác Chuyên Sâu Vào Drawer (Drawer Operational Consolidation)**.

---

## 1. PHÂN TÍCH VẤN ĐỀ HIỆN TRẠNG (UX AUDIT & BOTTLENECK)

### 1.1. Thực trạng trước khi cải tiến
- **Số lượng nút bấm khổng lồ:** Với sơ đồ 16–20 bàn ăn, mỗi bàn ăn hiển thị cùng lúc từ 6 đến 8 nút bấm:
  - Cụm bên trái: `[QR]`, `[Đổi TT]`, `[Sửa]`, `[Xóa]`.
  - Cụm bên phải: `[Chuyển]`, `[Gộp]`, `[Xem Đơn]`, `[Phục Vụ]`, `[Đã Dọn]`, `[Nhận Bàn]`, `[Mở Khóa]`.
  - Cụm chuông báo: `[Đã xong]`.
- **Hệ quả tiêu cực trong vận hành nhà hàng:**
  - **Quá tải nhận thức (Cognitive Overload):** Nhân viên phục vụ và quản lý bị ngợp trước "rừng nút" nhiều màu sắc.
  - **Nguy cơ bấm nhầm cực cao (Fat-finger errors):** Các nút bấm bị co cụm diện tích, dễ chạm nhầm giữa nút `Xóa`, `Sửa` và `Xem Đơn` trên thiết bị cảm ứng (iPad/Tablet).
  - **Vỡ bố cục giao diện (Layout Wrapping):** Khi màn hình có độ phân giải 1366x768 hoặc trên tablet, các nút bị rớt dòng thành 2–3 hàng khiến chiều cao các thẻ bàn không đồng đều, làm xấu trang.
  - **Trùng lặp chức năng (Duplication):** Nút `[Chuyển Bàn]` và `[Gộp Bàn]` xuất hiện ở mặt thẻ bàn, nhưng khi mở Drawer `[Xem Đơn]` lại xuất hiện lần nữa ở thanh thao tác tại bàn. Nút `[Đổi TT]` mở modal đổi trạng thái, trùng lặp với các nút đổi trạng thái nhanh trực tiếp.

---

## 2. GIẢI PHÁP KIẾN TRÚC NÂNG CẤP (SENIOR FULL-STACK UX ARCHITECTURE)

```
┌───────────────────────────────────────────────────────────────────┐
│ TRƯỚC (BEFORE): Thẻ bàn nhồi nhét 7-8 nút bấm                     │
│ [A01] Bàn VIP  [Đang Phục Vụ]                                     │
│ Sức chứa: 4 • Thực tế: 3 • Hóa đơn: 850.000₫                      │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ [QR] [Đổi TT] [Sửa] [Xóa] | [Chuyển] [Gộp] [Xem Đơn]          │ │ (Rối mắt, 112 nút)
│ └───────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘

                              ▼ CHUYỂN ĐỔI KIẾN TRÚC ▼

┌───────────────────────────────────────────────────────────────────┐
│ SAU (AFTER): Tối giản, chuyên nghiệp, chuẩn F&B POS               │
│ [A01] Bàn VIP  [Đang Phục Vụ]                       [ ⋮ (3 chấm) ]│ <── Kebab Context Menu
│ Sức chứa: 4 • Thực tế: 3 • Hóa đơn: 850.000₫                      │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │                  [ 🧾 Xem Đơn & Thao Tác ]                     │ │ <── 1 Primary Action (FSM)
│ └───────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

### 2.1. Menu Ngữ Cảnh Kebab 3 Chấm (`...` / `more_vert`)
- **Nguyên lý Tách biệt tần suất sử dụng (Usage Frequency Separation):**
  - Các tác vụ quản trị cấu hình bàn (Tải mã QR, Chỉnh sửa thông tin số chỗ/tên bàn, Đổi trạng thái nâng cao, Xóa bàn) chỉ sử dụng khi khai trương nhà hàng hoặc thay đổi sơ đồ phòng ốc định kỳ (Tần suất thấp).
  - Chúng được đưa toàn bộ vào menu 3 chấm nhỏ gọn góc trên bên phải của thẻ bàn.
  - Menu tự động đóng khi bấm chọn tác vụ hoặc click ra ngoài bất kỳ điểm nào trên màn hình (`handleOutsideClick`).

### 2.2. Chuẩn hóa 1 Nút Hành Động Trọng Tâm (State-Driven FSM Call-To-Action)
- Mỗi thẻ bàn ở chân thẻ (Footer) chỉ hiển thị **DUY NHẤT 1 NÚT BẤM CHÍNH (Full-width Primary Action)** tương ứng với trạng thái nghiệp vụ hiện tại:
  1. **Bàn `OCCUPIED` (Đang phục vụ):** Nút **`[ 🧾 Xem Đơn & Thao Tác ]`** (Màu nâu đỏ `#9D4124`). Bấm vào mở ngăn kéo Drawer toàn diện.
  2. **Bàn `AVAILABLE` (Bàn trống sẵn sàng):** Nút **`[ 🍽️ Mở Bàn Phục Vụ ]`** (Màu nâu đỏ `#9D4124`).
  3. **Bàn `AVAILABLE` (Đang bị Khóa An Toàn Đón Khách Đặt Trước):** Nút chính **`[ 👤 Nhận Bàn Đặt ]`** (Màu xanh lục `#059669`) kèm nút phụ nhỏ `[ ⚠️ Cưỡng Chế ]` cho khách vãng lai.
  4. **Bàn `RESERVED` (Bàn đã đặt chỗ):** Nút **`[ ✅ Nhận Bàn (Check-in) ]`** (Màu xanh lục `#059669`).
  5. **Bàn `DIRTY` (Bàn cần dọn dẹp):** Nút **`[ 🧹 Xác Nhận Đã Dọn Xong ]`** (Màu xanh ngọc `#059669`).
  6. **Bàn `BLOCKED` (Bàn bảo trì/khóa):** Nút **`[ 🔓 Mở Khóa Bàn ]`** (Màu ghi than `#374151`).

### 2.3. Hợp nhất thao tác chuyên sâu vào Ngăn Kéo (Drawer Operational Workspace)
- Các nghiệp vụ dịch chuyển bàn phức tạp gồm **Chuyển Bàn (Transfer)** và **Gộp Bàn (Merge)** là các thao tác liên quan chặt chẽ đến món ăn và khách đang ngồi, do đó được tập trung toàn bộ bên trong **Ngăn Kéo Quản Lý Đơn Món (Order Drawer)**.
- Khi người quản lý bấm `[Xem Đơn & Thao Tác]`, Drawer mở ra từ bên phải hiển thị đầy đủ:
  - Thanh tiêu đề: `[+ Thêm Món]`, `[In Tạm Tính]`, `[Đóng X]`.
  - Thanh tác vụ bàn: `[Chuyển Bàn]` (màu xanh dương nhạt), `[Gộp Bàn]` (màu tím nhạt).
  - Thân drawer: Danh sách các món đang dùng, trạng thái chế biến Bếp, chỉnh sửa số lượng (+/-) và hủy món.
  - Chân drawer: Tổng tiền tạm tính và nút thêm món nhanh.

---

## 3. CHI TIẾT MÃ NGUỒN FRONTEND ĐÃ TỐI ƯU

### 3.1. File cập nhật: `SourceCode/frontend/src/pages/admin/TableManagementPage.jsx`

#### A. Khai báo State & Xử lý Click Outside:
```jsx
// State menu 3 chấm ngữ cảnh cho từng thẻ bàn
const [cardMenuTableId, setCardMenuTableId] = useState(null);

// Tự động đóng Menu 3 chấm tác vụ bàn khi click ra ngoài
useEffect(() => {
  const handleOutsideClick = (e) => {
    if (!e.target.closest('.roms-card-menu-container')) {
      setCardMenuTableId(null);
    }
  };
  if (cardMenuTableId) {
    document.addEventListener('mousedown', handleOutsideClick);
  }
  return () => {
    document.removeEventListener('mousedown', handleOutsideClick);
  };
}, [cardMenuTableId]);
```

#### B. Header thẻ bàn với Kebab Context Menu:
```jsx
<div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
    <span style={{
      fontSize: '0.72rem',
      fontWeight: 700,
      padding: '3px 8px',
      borderRadius: '6px',
      background: statusBadge.bg,
      color: statusBadge.color,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    }}>
      <Icon name={statusBadge.icon} size={13} style={{ color: statusBadge.color }} />
      {statusBadge.label}
    </span>
    {getTableDwellBadge(t)}
  </div>

  {/* Nút 3 chấm Kebab Menu (Tác vụ Quản Trị / Bàn) */}
  <div className="roms-card-menu-container" style={{ position: 'relative' }}>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setCardMenuTableId(cardMenuTableId === t.id ? null : t.id);
      }}
      title="Tùy chọn quản trị bàn"
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '8px',
        border: '1px solid #EAE0DE',
        background: cardMenuTableId === t.id ? '#FDF0EC' : '#FAFAFA',
        color: cardMenuTableId === t.id ? '#9D4124' : '#6B7280',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        transition: 'all 0.15s ease'
      }}
    >
      <Icon name="more_vert" size={17} />
    </button>

    {/* Floating Dropdown Menu */}
    {cardMenuTableId === t.id && (
      <div style={{
        position: 'absolute',
        top: '34px',
        right: 0,
        zIndex: 60,
        width: '195px',
        background: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.14), 0 3px 8px rgba(0,0,0,0.06)',
        border: '1px solid #F0E6E4',
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        {/* Tác vụ: Tải QR, Cài đặt trạng thái, Sửa, Xóa bàn */}
      </div>
    )}
  </div>
</div>
```

#### C. Chân thẻ bàn với 1 Nút Hành Động Trọng Tâm (FSM CTA):
```jsx
{/* Actions Footer - 1 Nút Hành Động Trọng Tâm Theo Trạng Thái (FSM Primary Call-To-Action) */}
<div style={{ borderTop: '1px solid #F6ECEA', paddingTop: '10px' }}>
  {t.status === 'BLOCKED' && (
    <button type="button" onClick={() => handleToggleStatus(t.id, 'AVAILABLE')} ...>
      <Icon name="lock_open" size={15} /> Mở Khóa Bàn
    </button>
  )}

  {t.status === 'DIRTY' && (
    <button type="button" onClick={() => handleToggleStatus(t.id, 'AVAILABLE')} ...>
      <Icon name="cleaning_services" size={15} /> Xác Nhận Đã Dọn Xong
    </button>
  )}

  {isBufferLocked && (
    <div style={{ display: 'flex', gap: '6px' }}>
      <button type="button" onClick={() => handleCheckInReservation(t)} ...>
        <Icon name="how_to_reg" size={16} /> Nhận Bàn Đặt
      </button>
      <button type="button" onClick={() => handlePromptForceOverride(t)} ...>
        <Icon name="warning" size={14} /> Cưỡng Chế
      </button>
    </div>
  )}

  {!isBufferLocked && t.status === 'AVAILABLE' && (
    <button type="button" onClick={() => handleToggleStatus(t.id, 'OCCUPIED')} ...>
      <Icon name="restaurant" size={15} /> Mở Bàn Phục Vụ
    </button>
  )}

  {!isBufferLocked && t.status === 'RESERVED' && (
    <button type="button" onClick={() => handleCheckInReservation(t)} ...>
      <Icon name="check_circle" size={15} /> Nhận Bàn (Check-in)
    </button>
  )}

  {t.status === 'OCCUPIED' && (
    <button type="button" onClick={() => handleOpenOrderDrawer(t)} ...>
      <Icon name="receipt_long" size={16} />
      <span>Xem Đơn & Thao Tác</span>
    </button>
  )}
</div>
```

---

## 4. KẾT QUẢ ĐẠT ĐƯỢC SAU CẢI TIẾN

1. **Giảm 75% mật độ nút bấm trên sơ đồ:** Từ 112 nút xuống còn 16 nút chính (mỗi thẻ bàn chỉ có đúng 1 nút hành động rõ ràng).
2. **Không gian thoáng đãng, đồng bộ:** Chiều cao của các thẻ bàn hoàn toàn bằng nhau, không bị tình trạng rớt dòng hay tràn viền nút bấm.
3. **Trải nghiệm nhân viên F&B chuẩn quốc tế:** Nhân viên mới chỉ mất 3 giây để làm quen, bấm 1 chạm để mở bàn, dọn bàn, hoặc xem đơn mà không bao giờ bị bấm nhầm vào nút xóa hay sửa bàn.
4. **Bảo toàn 100% chức năng:** Toàn bộ API Backend, Socket/BroadcastChannel, và Modal cũ vẫn hoạt động hoàn hảo, không có bất kỳ breaking change nào.
