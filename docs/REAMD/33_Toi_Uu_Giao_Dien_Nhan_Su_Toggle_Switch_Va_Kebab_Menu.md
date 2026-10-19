# BƯỚC 33: TỐI ƯU GIAO DIỆN QUẢN LÝ NHÂN SỰ VỚI TOGGLE SWITCH VÀ ACTION DROPDOWN (STAFF MANAGEMENT UX REFACTOR)

> **Mục tiêu:** Tái cấu trúc (Refactor) hệ thống nút thao tác trên bảng danh sách nhân viên (`StaffManagementPage.jsx`). Loại bỏ hoàn toàn sự lặp lại của cụm 3 nút icon (`[Đổi PIN]`, `[Sửa]`, `[Khóa/Mở khóa]`) trên từng hàng dữ liệu (gây rối mắt với 60+ icon lặp lại), thay thế bằng chuẩn thiết kế Bảng quản trị doanh nghiệp cao cấp: **Công Tắc Chuyển Trạng Thái (Interactive iOS-Style Toggle Switch)** kết hợp **Menu Ngữ Cảnh 3 Chấm (Kebab Context Menu `...`)**.

---

## 1. PHÂN TÍCH VẤN ĐỀ HIỆN TRẠNG (UX AUDIT)

### 1.1. Thực trạng trước cải tiến
- **Sự lặp lại nút dày đặc trên bảng:**
  - Mỗi hàng trong bảng danh sách nhân sự chứa 3 nút bấm vuông nhỏ liền kề:
    - Nút 1: `[dialpad]` Đổi / Cấp lại mã PIN.
    - Nút 2: `[edit]` Chỉnh sửa hồ sơ.
    - Nút 3: `[lock / lock_open]` Khóa hoặc mở khóa tài khoản.
  - Khi nhà hàng có 20–50 nhân sự, bảng hiển thị từ 60 đến 150 nút icon nhỏ màu đỏ/nâu nhấp nhô, tạo "nhiễu thị giác" (Visual Noise) nghiêm trọng.
- **Trùng lặp giữa cột Trạng thái và nút Hành động:**
  - Cột 5 hiển thị nhãn chữ tĩnh: `Hoạt động` / `Đã khóa`.
  - Cột 6 lại có nút bấm `Khóa` / `Mở khóa`. Người dùng phải nhìn sang cột 5 rồi mới bấm cột 6 để đổi trạng thái, trải nghiệm thao tác bị rời rạc.

---

## 2. GIẢI PHÁP THIẾT KẾ MỚI (SENIOR FULL-STACK PATTERN)

```
TRƯỚC (BEFORE) - Mỗi dòng 3 icon nút bấm lặp đi lặp lại:
┌─────────────────┬───────────┬───────────────┬────────────────────────┐
│ Nhân viên       │ Vai trò   │ Trạng thái    │ Thao tác               │
├─────────────────┼───────────┼───────────────┼────────────────────────┤
│ Nguyễn Văn A    │ Thu ngân  │ [Hoạt động]   │ [PIN] [Sửa] [Khóa]     │
│ Trần Thị B      │ Bồi bàn   │ [Đã khóa]     │ [PIN] [Sửa] [Mở khóa]  │
└─────────────────┴───────────┴───────────────┴────────────────────────┘

SAU KHI CẢI TIẾN (AFTER) - Tinh tế, hiện đại chuẩn SaaS Dashboard:
┌─────────────────┬───────────┬───────────────────┬────────────────────┐
│ Nhân viên       │ Vai trò   │ Trạng thái        │ Thao tác           │
├─────────────────┼───────────┼───────────────────┼────────────────────┤
│ Nguyễn Văn A    │ Thu ngân  │ [ (●) Hoạt động ] │ [ ⋮ (3 chấm) ]     │
│ Trần Thị B      │ Bồi bàn   │ [ (○) Đã khóa   ] │ [ ⋮ (3 chấm) ]     │
└─────────────────┴───────────┴───────────────────┴────────────────────┘
```

### 2.1. Cột Trạng thái: Interactive Toggle Switch
- Tích hợp trực tiếp công tắc gạt cảm ứng (Toggle Switch):
  - Khi `isActive = true`: Công tắc màu xanh ngọc `#059669`, nút gạt sang phải kèm nhãn chữ `Hoạt động`.
  - Khi `isActive = false`: Công tắc màu xám `#D1D5DB`, nút gạt sang trái kèm nhãn chữ `Đã khóa`.
- Bấm 1 chạm trực tiếp vào công tắc để kích hoạt `handleToggleStatus(staff)` mà không cần tìm nút bấm ở cột Thao tác.

### 2.2. Cột Thao tác: Kebab Context Menu (`...` / `more_vert`)
- Mỗi hàng nhân sự chỉ còn đúng **1 nút 3 chấm duy nhất** gọn gàng.
- Bấm vào nút 3 chấm hiển thị menu pop-up nổi:
  - 📝 **Chỉnh Sửa Hồ Sơ** (`handleOpenEditStaff`)
  - 🔢 **Cấp Lại Mã PIN** (`setShowPinModal`)
  - 🔒 **Khóa / Mở Khóa Tài Khoản** (`handleToggleStatus`)
- Cơ chế `handleOutsideClick` thông minh: Khi người dùng nhấp chuột ra ngoài bất kỳ điểm nào trên màn hình, menu tự động đóng lại nhẹ nhàng.

---

## 3. CHI TIẾT MÃ NGUỒN FRONTEND ĐÃ TỐI ƯU

### File: `SourceCode/frontend/src/pages/admin/StaffManagementPage.jsx`

#### A. Khai báo State & Outside Click Listener:
```jsx
// State menu 3 chấm thao tác nhân viên
const [activeStaffMenuId, setActiveStaffMenuId] = useState(null);

// Đóng Menu 3 chấm tác vụ nhân viên khi click ra ngoài
useEffect(() => {
  const handleOutsideClick = (e) => {
    if (!e.target.closest('.roms-staff-menu-container')) {
      setActiveStaffMenuId(null);
    }
  };
  if (activeStaffMenuId) {
    document.addEventListener('mousedown', handleOutsideClick);
  }
  return () => {
    document.removeEventListener('mousedown', handleOutsideClick);
  };
}, [activeStaffMenuId]);
```

#### B. Cột Trạng Thái Toggle Switch:
```jsx
<td style={{ padding: '14px 16px', textAlign: 'center' }}>
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
    <button
      type="button"
      onClick={() => handleToggleStatus(staff)}
      title={staff.isActive ? 'Nhấn để khóa tài khoản' : 'Nhấn để mở khóa tài khoản'}
      style={{
        width: '38px',
        height: '22px',
        borderRadius: '9999px',
        background: staff.isActive ? '#059669' : '#D1D5DB',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background-color 0.2s ease',
        padding: 0
      }}
    >
      <span
        style={{
          display: 'block',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          position: 'absolute',
          top: '3px',
          left: staff.isActive ? '19px' : '3px',
          transition: 'left 0.2s ease'
        }}
      />
    </button>
    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: staff.isActive ? '#059669' : '#6B7280' }}>
      {staff.isActive ? 'Hoạt động' : 'Đã khóa'}
    </span>
  </div>
</td>
```

#### C. Cột Thao Tác Kebab Menu:
```jsx
<td style={{ padding: '14px 16px', textAlign: 'right' }}>
  <div className="roms-staff-menu-container" style={{ position: 'relative', display: 'inline-block' }}>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setActiveStaffMenuId(activeStaffMenuId === staff.id ? null : staff.id);
      }}
      title="Thao tác với nhân viên"
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        border: '1px solid #EAE0DE',
        background: activeStaffMenuId === staff.id ? '#FDF0EC' : '#FAFAFA',
        color: activeStaffMenuId === staff.id ? '#9D4124' : '#56423D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s ease'
      }}
    >
      <Icon name="more_vert" size={18} />
    </button>

    {activeStaffMenuId === staff.id && (
      <div style={{
        position: 'absolute',
        top: '36px',
        right: 0,
        zIndex: 60,
        width: '185px',
        background: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.14), 0 3px 8px rgba(0,0,0,0.06)',
        border: '1px solid #F0E6E4',
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        textAlign: 'left'
      }}>
        {/* Chỉnh sửa hồ sơ, Cấp lại mã PIN, Khóa/Mở tài khoản */}
      </div>
    )}
  </div>
</td>
```

---

## 4. KẾT QUẢ ĐẠT ĐƯỢC

1. **Giảm 66% mật độ nút ở phần danh sách nhân sự:** Thay vì 3 nút mỗi dòng, nay chỉ còn 1 nút menu 3 chấm tinh tế.
2. **Trực quan & Hiện đại:** Toggle Switch giúp quản trị viên nhận diện và thay đổi trạng thái kích hoạt của nhân viên ngay tức khắc.
3. **Không phá vỡ chức năng cũ:** Toàn bộ API đổi PIN, cập nhật hồ sơ, khóa tài khoản và phân ca đều giữ nguyên 100%.
4. **Biên dịch xuất sắc:** Đã xác minh `npm run build` vượt qua toàn bộ kiểm tra cú pháp và bundling với 0 lỗi.
