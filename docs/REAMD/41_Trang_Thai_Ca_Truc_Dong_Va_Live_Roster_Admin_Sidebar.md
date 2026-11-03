# BƯỚC 41: XÂY DỰNG TRẠNG THÁI CA TRỰC ĐỘNG & POPUP LIVE ROSTER NHÂN SỰ (FULL-STACK)

> **Màn hình áp dụng:** Sidebar góc trái của phân hệ Quản trị Admin ROMS Suite (`/admin/tables`, `/admin/reports`, `/admin/menu`, `/admin/staff`).  
> **Người sử dụng:** Quản lý nhà hàng (Manager / Admin).  
> **Mục tiêu bài học & thực hành:**  
> 1. Xóa bỏ 100% dữ liệu tĩnh (hardcode `"8 Nhân sự đang online"`, `"Ca Tối: 17:00 - 23:00"`).  
> 2. Tự động nhận diện Ca trực hiện tại (`MORNING`, `EVENING`, `CLOSED`) và tính toán tiến độ thời gian thực theo đồng hồ hệ thống.  
> 3. Lấy số lượng nhân sự trực ca thực tế từ Backend Database qua trường `isOnShift`.  
> 4. Xây dựng Flyout Popover xem nhanh danh sách nhân sự (Live Roster) phân loại theo vai trò (Quản lý, Thu ngân, Phục vụ bàn, Bếp) kèm bộ lọc và điều hướng nhanh.  
> 5. Hiểu sâu cơ chế kết hợp giữa **Polling định kỳ ngầm** và **WebSocket Realtime Event**.

---

## MỤC LỤC BÀI HỌC
1. [Kiến trúc dữ liệu & Luồng vận hành Backend](#1-kiến-trúc-dữ-liệu--luồng-vận-hành-backend)
2. [Tùy chọn Backend: Phát sự kiện WebSocket khi Login / Logout](#2-tùy-chọn-backend-phát-sự-kiện-websocket-khi-login--logout)
3. [Tạo Component Frontend: `ShiftStatusWidget.jsx`](#3-tạo-component-frontend-shiftstatuswidgetjsx)
4. [Tích hợp Component vào `AdminLayout.jsx`](#4-tích-hợp-component-vào-adminlayoutjsx)
5. [Phân tích chuyên sâu kiến thức lập trình (Học & Hiểu)](#5-phân-tích-chuyên-sâu-kiến-thức-lập-trình-học--hiểu)
6. [Kịch bản kiểm thử & Nghiệm thu (Test Scenarios)](#6-kịch-bản-kiểm-thử--nghiệm-thu-test-scenarios)

---

## 1. KIẾN TRÚC DỮ LIỆU & LUỒNG VẬN HÀNH BACKEND

Trước khi bắt tay vào code, bạn cần nắm rõ cách hệ thống ROMS quản lý ca trực và trạng thái nhân viên:

```
+-----------------------------------------------------------------------------------+
| SQL Server DB (staffs table)                                                      |
|   - id: BIGINT                                                                    |
|   - username: NVARCHAR ("MGR-001", "WTR-002")                                     |
|   - role: NVARCHAR ("MANAGER", "WAITER", "KITCHEN", "CASHIER")                    |
|   - is_on_shift: BIT (true khi đăng nhập PIN thành công, false khi logout)        |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| Backend Spring Boot                                                               |
|   - StaffRepository.countByIsOnShiftTrue(): Đếm số nhân sự đang trực               |
|   - AdminStaffController.getAllStaff(): Trả về danh sách nhân viên + isOnShift     |
|   - AdminStaffController.getStaffSummary(): Trả về onlineStaff, totalStaff        |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ REST API / WebSocket
+-----------------------------------------------------------------------------------+
| Frontend React (AdminLayout -> ShiftStatusWidget)                                 |
|   - Đồng hồ thời gian thực: Xác định Ca Sáng / Ca Tối / Nghỉ Ca                   |
|   - Tính % tiến độ ca & thời gian còn lại                                        |
|   - Hiển thị số lượng nhân sự online thực tế                                      |
|   - Click mở Popover xem chi tiết từng người đang có mặt                          |
+-----------------------------------------------------------------------------------+
```

### 1.1. Enum ca làm việc: `ShiftType.java`
Vị trí: `SourceCode/backend/roms/src/main/java/com/romsteam/roms/entity/enums/ShiftType.java`
- `MORNING`: Ca Sáng từ `06:00` đến `14:00`.
- `EVENING`: Ca Tối từ `14:00` đến `22:00`.
- Ngoài 2 khung giờ này: Nhà hàng đóng cửa nghỉ ca (`22:00` đến `06:00` sáng hôm sau).

### 1.2. Trạng thái trong ca của nhân viên: `Staff.java`
Vị trí: `SourceCode/backend/roms/src/main/java/com/romsteam/roms/entity/Staff.java`
- Trường `isOnShift` (`Boolean`, mặc định `false`):
  - Khi nhân viên nhập mã PIN 6 số đăng nhập qua `AuthServiceImpl.login()` $\rightarrow$ `staff.setIsOnShift(true)`.
  - Khi nhân viên bấm đăng xuất qua `AuthServiceImpl.logout()` hoặc Thu ngân chốt ca két tiền $\rightarrow$ `staff.setIsOnShift(false)`.

### 1.3. Các REST API sẵn có phục vụ hiển thị
- `GET /api/admin/staff/summary`: Lấy số lượng tổng quan (`totalStaff`, `onlineStaff`, `waiterCount`, `kitchenCount`, `cashierCount`, `managerCount`).
- `GET /api/admin/staff`: Lấy toàn bộ danh sách nhân viên kèm trường `isOnShift` để lọc danh sách người thực tế đang trực.

---

## 2. TÙY CHỌN BACKEND: PHÁT SỰ KIỆN WEBSOCKET KHI LOGIN / LOGOUT

*(Bước này là tùy chọn nâng cao. Nếu bạn chưa muốn sửa Backend ngay, widget Frontend vẫn tự động cập nhật chính xác nhờ cơ chế Polling 25 giây một lần. Nếu muốn hệ thống cập nhật tức thì 0ms qua WebSocket, bạn làm thêm bước này).*

### File cần chỉnh sửa:
📁 `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/serviceImpl/AuthServiceImpl.java`

#### Thao tác:
Tìm hàm `login(...)` và hàm `logout(...)`, tiêm `RealtimeService` để phát thông báo WebSocket đến topic `/topic/staff` mỗi khi có nhân viên vào/ra ca:

```java
// 1. Thêm import sự kiện thời gian thực ở đầu file AuthServiceImpl.java
import com.romsteam.roms.dto.response.RomsRealtimeEvent;
import com.romsteam.roms.service.RealtimeService;

// 2. Trong lớp AuthServiceImpl, khai báo thêm dependency final:
private final RealtimeService realtimeService;

// 3. CẬP NHẬT CONSTRUCTOR (Bắt buộc để tránh lỗi: Field 'realtimeService' might not have been initialized):
// Thêm tham số RealtimeService realtimeService vào hàm khởi tạo AuthServiceImpl(...) (khoảng dòng 72-82):
public AuthServiceImpl(AuthenticationManager authenticationManager,
                       StaffRepository staffRepository,
                       StaffScheduleRepository staffScheduleRepository,
                       JwtTokenProvider jwtTokenProvider,
                       PasswordEncoder passwordEncoder,
                       RealtimeService realtimeService) { // <-- THÊM THAM SỐ NÀY
    this.authenticationManager = authenticationManager;
    this.staffRepository = staffRepository;
    this.staffScheduleRepository = staffScheduleRepository;
    this.jwtTokenProvider = jwtTokenProvider;
    this.passwordEncoder = passwordEncoder;
    this.realtimeService = realtimeService;           // <-- THÊM DÒNG GÁN NÀY
}

// 4. Trong hàm login(...), ngay sau dòng staffRepository.save(staff); (khoảng dòng 180):
staff.setIsOnShift(true);
staffRepository.save(staff);

// Phát sự kiện WebSocket thông báo nhân viên vừa đăng nhập vào ca
realtimeService.publish("/topic/staff", RomsRealtimeEvent.builder()
        .type("STAFF_LOGIN")
        .status("ONLINE")
        .note("Nhân viên " + staff.getFullName() + " đã đăng nhập vào ca trực")
        .payload(staff.getUsername())
        .build());

// 5. Trong hàm logout(...), ngay sau dòng staff.setIsOnShift(false); (khoảng dòng 240):
staff.setIsOnShift(false);
staffRepository.save(staff);

// Phát sự kiện WebSocket thông báo nhân viên vừa rời ca trực
realtimeService.publish("/topic/staff", RomsRealtimeEvent.builder()
        .type("STAFF_LOGOUT")
        .status("OFFLINE")
        .note("Nhân viên " + staff.getFullName() + " đã kết thúc ca trực")
        .payload(staff.getUsername())
        .build());
```

### 2.2. Đăng ký kênh WebSocket `/topic/staff` ở Frontend:
Mở file:
📁 `SourceCode/frontend/src/utils/realtimeSync.js` (khoảng dòng 164 - 171)

Thêm kênh `'/topic/staff'` vào danh sách `topics` để trình duyệt tự động nhận tín hiệu ngay khi có người vào/ra ca:
```javascript
      // 1. Subscribe 6 topic nghiệp vụ cốt lõi
      const topics = [
        '/topic/tables',
        '/topic/kitchen',
        '/topic/service-requests',
        '/topic/orders',
        '/topic/pos',
        '/topic/staff' // <-- THÊM DÒNG NÀY ĐỂ NHẬN SỰ KIỆN LOGIN / LOGOUT TỨC THÌ
      ];
```

---

## 3. TẠO COMPONENT FRONTEND: `ShiftStatusWidget.jsx`

Tạo mới file:
📁 **`SourceCode/frontend/src/components/admin/ShiftStatusWidget.jsx`**

Sao chép toàn bộ mã nguồn có chú thích chi tiết dưới đây:

```jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../common/Icon';
import { staffApi } from '../../api/staffApi';
import { subscribeRealtimeEvents } from '../../utils/realtimeSync';

/**
 * ===================================================================
 * 1. BẢNG MÀU & BIỂU TƯỢNG VAI TRÒ CHUẨN THIẾT KẾ ROMS SUITE
 * ===================================================================
 * Giúp avatar và nhãn vai trò hiển thị đồng bộ màu sắc với trang Quản lý nhân sự
 */
const ROLE_CONFIG = {
  MANAGER: {
    label: 'Quản Lý',
    icon: 'manage_accounts',
    bg: '#FCF1EF',
    color: '#9D4124',
    badgeBg: '#9D4124',
    badgeColor: '#FFFFFF'
  },
  CASHIER: {
    label: 'Thu Ngân',
    icon: 'point_of_sale',
    bg: '#FFF3E0',
    color: '#753400',
    badgeBg: '#FFDBC9',
    badgeColor: '#753400'
  },
  WAITER: {
    label: 'Phục Vụ',
    icon: 'table_restaurant',
    bg: '#F1F8E9',
    color: '#181E00',
    badgeBg: '#DDE8AB',
    badgeColor: '#181E00'
  },
  KITCHEN: {
    label: 'Bếp / KDS',
    icon: 'skillet',
    bg: '#FFEBEE',
    color: '#93000A',
    badgeBg: '#FFDAD6',
    badgeColor: '#93000A'
  }
};

/**
 * ===================================================================
 * 2. THUẬT TOÁN NHẬN DIỆN CA TRỰC ĐỘNG THEO THỜI GIAN THỰC
 * ===================================================================
 * Quy đổi giờ hiện tại ra tổng số phút trong ngày để so sánh:
 * - Ca Sáng:  06:00 (360 phút)  -> 14:00 (840 phút)  = 480 phút
 * - Ca Tối:   14:00 (840 phút)  -> 22:00 (1320 phút) = 480 phút
 * - Nghỉ Ca:  22:00 -> 06:00 hôm sau
 */
export const calculateShiftInfo = (date = new Date()) => {
  // Lấy tổng số phút từ 00:00 của ngày hôm nay
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  const morningStart = 6 * 60;   // 06:00
  const morningEnd = 14 * 60;    // 14:00
  const eveningStart = 14 * 60;  // 14:00
  const eveningEnd = 22 * 60;    // 22:00

  // TRƯỜNG HỢP 1: Đang trong CA SÁNG (06:00 - 14:00)
  if (currentMinutes >= morningStart && currentMinutes < morningEnd) {
    const elapsed = currentMinutes - morningStart; // Số phút ca đã trôi qua
    const duration = morningEnd - morningStart;    // Tổng thời lượng ca (480 phút)
    const progress = Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100)));
    const remaining = morningEnd - currentMinutes; // Số phút còn lại
    const remH = Math.floor(remaining / 60);
    const remM = remaining % 60;
    const isEndingSoon = remaining <= 30;          // Cảnh báo nếu còn dưới 30 phút

    return {
      type: 'MORNING',
      name: 'Ca Sáng',
      timeRange: '06:00 - 14:00',
      isActive: true,
      isEndingSoon,
      progress,
      remainingText: `Còn ${remH > 0 ? `${remH}h ` : ''}${remM}m`,
      statusText: isEndingSoon ? 'Sắp hết ca' : 'Đang hoạt động',
      statusColor: isEndingSoon ? '#D97706' : '#596232', // Vàng cam nếu sắp hết ca, xanh lá nếu bình thường
      dotClass: isEndingSoon ? '' : 'pulse-dot'          // Hiệu ứng nhịp thở CSS
    };
  }

  // TRƯỜNG HỢP 2: Đang trong CA TỐI (14:00 - 22:00)
  if (currentMinutes >= eveningStart && currentMinutes < eveningEnd) {
    const elapsed = currentMinutes - eveningStart;
    const duration = eveningEnd - eveningStart;
    const progress = Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100)));
    const remaining = eveningEnd - currentMinutes;
    const remH = Math.floor(remaining / 60);
    const remM = remaining % 60;
    const isEndingSoon = remaining <= 30;

    return {
      type: 'EVENING',
      name: 'Ca Tối',
      timeRange: '14:00 - 22:00',
      isActive: true,
      isEndingSoon,
      progress,
      remainingText: `Còn ${remH > 0 ? `${remH}h ` : ''}${remM}m`,
      statusText: isEndingSoon ? 'Sắp giao ca' : 'Đang hoạt động',
      statusColor: isEndingSoon ? '#D97706' : '#596232',
      dotClass: isEndingSoon ? '' : 'pulse-dot'
    };
  }

  // TRƯỜNG HỢP 3: NGOÀI GIỜ CA TRỰC (22:00 - 06:00)
  return {
    type: 'CLOSED',
    name: 'Nghỉ Ca',
    timeRange: '22:00 - 06:00',
    isActive: false,
    isEndingSoon: false,
    progress: 0,
    remainingText: 'Ngoài giờ trực',
    statusText: 'Đã đóng ca',
    statusColor: '#89726B', // Màu xám trầm
    dotClass: ''
  };
};

/**
 * ===================================================================
 * 3. COMPONENT CHÍNH: ShiftStatusWidget
 * ===================================================================
 */
export default function ShiftStatusWidget({ currentTime = new Date() }) {
  const navigate = useNavigate();
  const widgetRef = useRef(null);   // Tham chiếu đến thẻ widget ở sidebar
  const popoverRef = useRef(null);  // Tham chiếu đến hộp Popover Live Roster

  // State quản lý đóng/mở popover
  const [isOpen, setIsOpen] = useState(false);
  // State quản lý trạng thái tải dữ liệu
  const [loading, setLoading] = useState(false);
  // Danh sách toàn bộ nhân sự đang online (isOnShift === true)
  const [onlineStaffList, setOnlineStaffList] = useState([]);
  // Tổng số nhân sự có trong nhà hàng
  const [totalStaffCount, setTotalStaffCount] = useState(0);
  // Bộ lọc vai trò đang chọn trong popover ('ALL', 'WAITER', 'KITCHEN', 'CASHIER', 'MANAGER')
  const [activeRoleFilter, setActiveRoleFilter] = useState('ALL');

  // Tính toán ca trực hiện tại theo prop currentTime truyền từ Layout
  const shiftInfo = calculateShiftInfo(currentTime);

  /**
   * Gọi API Backend lấy danh sách nhân viên thực tế
   * @param {boolean} isSilent - Nếu là true (polling ngầm), không bật spinner làm phiền mắt
   */
  const fetchStaffStatus = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await staffApi.getAllStaff();
      if (res?.data?.success && Array.isArray(res.data.data)) {
        const all = res.data.data;
        setTotalStaffCount(all.length);
        // Lọc những nhân sự có cờ isOnShift = true (đã login vào ca trực)
        const onShift = all.filter(s => s.isOnShift);
        setOnlineStaffList(onShift);
      }
    } catch (err) {
      console.warn('[ShiftStatusWidget] Không thể tải trạng thái nhân sự:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // 1. Tự động tải dữ liệu lần đầu & thiết lập chu kỳ Polling ngầm mỗi 25 giây
  useEffect(() => {
    fetchStaffStatus(false);
    const timer = setInterval(() => fetchStaffStatus(true), 25000);
    return () => clearInterval(timer);
  }, [fetchStaffStatus]);

  // 2. Lắng nghe WebSocket Realtime STOMP (khi có sự kiện login, logout, chốt ca)
  useEffect(() => {
    const unsubscribe = subscribeRealtimeEvents((event) => {
      if (
        event?.type === 'STAFF_LOGIN' ||
        event?.type === 'STAFF_LOGOUT' ||
        event?.type === 'SHIFT_CLOSED'
      ) {
        // Cập nhật lại số lượng ngay lập tức 0 delay
        fetchStaffStatus(true);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [fetchStaffStatus]);

  // 3. Xử lý đóng Popover khi Click chuột ra ngoài hoặc nhấn phím ESC
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        widgetRef.current &&
        !widgetRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Thống kê số lượng theo từng vai trò phục vụ thanh bộ lọc
  const roleCounts = {
    ALL: onlineStaffList.length,
    MANAGER: onlineStaffList.filter(s => s.role === 'MANAGER').length,
    WAITER: onlineStaffList.filter(s => s.role === 'WAITER').length,
    KITCHEN: onlineStaffList.filter(s => s.role === 'KITCHEN').length,
    CASHIER: onlineStaffList.filter(s => s.role === 'CASHIER').length
  };

  // Danh sách nhân sự sau khi lọc theo vai trò
  const filteredStaff = activeRoleFilter === 'ALL'
    ? onlineStaffList
    : onlineStaffList.filter(s => s.role === activeRoleFilter);

  return (
    <div style={{ position: 'relative' }}>
      {/* ===================================================================
          A. THẺ WIDGET HIỂN THỊ CHÍNH (NẰM Ở CUỐI SIDEBAR TRÁI)
          =================================================================== */}
      <div
        ref={widgetRef}
        onClick={() => setIsOpen(prev => !prev)}
        role="button"
        tabIndex={0}
        title="Bấm để xem chi tiết danh sách nhân sự đang trực ca"
        style={{
          background: '#FFFFFF',
          padding: '12px 14px',
          borderRadius: '14px',
          border: isOpen ? '1.5px solid #9D4124' : '1px solid #EAE0DE',
          boxShadow: isOpen
            ? '0 6px 18px rgba(157, 65, 36, 0.12)'
            : '0 2px 6px rgba(0, 0, 0, 0.02)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '#C58F80';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '#EAE0DE';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        {/* Hàng 1: Tiêu đề + Chấm đèn tín hiệu nhịp thở */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.72rem', color: '#89726B', fontWeight: 700, textTransform: 'uppercase' }}>
            Trạng thái ca trực
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              className={shiftInfo.dotClass}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: shiftInfo.statusColor,
                display: 'inline-block'
              }}
            />
          </div>
        </div>

        {/* Hàng 2: Số lượng nhân sự Online thực tế từ Backend + Mũi tên */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1F1B1A' }}>
            {onlineStaffList.length} Nhân sự đang online
          </div>
          <Icon
            name={isOpen ? 'expand_more' : 'chevron_right'}
            size={18}
            style={{ color: '#89726B', transition: 'transform 0.2s' }}
          />
        </div>

        {/* Hàng 3: Tên ca & Khung giờ tự động + Thời gian còn lại */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
          <div style={{ fontSize: '0.73rem', color: shiftInfo.statusColor, fontWeight: 600 }}>
            {shiftInfo.name}: {shiftInfo.timeRange}
          </div>
          <span style={{ fontSize: '0.68rem', color: '#89726B' }}>
            {shiftInfo.remainingText}
          </span>
        </div>

        {/* Hàng 4: Thanh tiến độ ca trực (Shift Progress Bar mỏng tinh tế) */}
        {shiftInfo.isActive && (
          <div style={{
            width: '100%',
            height: '3px',
            background: '#F0E7E5',
            borderRadius: '999px',
            marginTop: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${shiftInfo.progress}%`,
              height: '100%',
              background: shiftInfo.isEndingSoon ? '#D97706' : '#596232',
              transition: 'width 0.4s ease'
            }} />
          </div>
        )}
      </div>

      {/* ===================================================================
          B. FLYOUT POPOVER: XEM NHANH DANH SÁCH NHÂN SỰ ĐANG TRỰC
          =================================================================== */}
      {isOpen && (
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            left: '252px',
            bottom: '20px',
            width: '360px',
            maxHeight: '520px',
            background: '#FFFFFF',
            borderRadius: '18px',
            border: '1.5px solid #EAE0DE',
            boxShadow: '0 16px 40px rgba(44, 34, 30, 0.18)',
            zIndex: 1050,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {/* 1. Header của Popover */}
          <div style={{
            padding: '14px 16px',
            background: '#FFF8F6',
            borderBottom: '1px solid #EAE0DE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#FCF1EF',
                color: '#9D4124',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon name="badge" size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1F1B1A' }}>
                  Nhân Sự Ca Hiện Tại
                </div>
                <div style={{ fontSize: '0.7rem', color: '#89726B' }}>
                  {shiftInfo.name} ({shiftInfo.timeRange}) • {shiftInfo.statusText}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* Nút làm mới danh sách */}
              <button
                type="button"
                onClick={() => fetchStaffStatus(false)}
                title="Làm mới danh sách nhân sự"
                disabled={loading}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#89726B',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon name="refresh" size={18} style={{ transform: loading ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s' }} />
              </button>
              {/* Nút đóng popover */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Đóng cửa sổ"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#89726B',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          </div>

          {/* 2. Thanh lọc vai trò (Filter Chips) */}
          <div style={{
            padding: '10px 14px',
            borderBottom: '1px solid #F0E7E5',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            background: '#FFFFFF'
          }}>
            {[
              { key: 'ALL', label: `Tất cả (${roleCounts.ALL})` },
              { key: 'WAITER', label: `Phục vụ (${roleCounts.WAITER})` },
              { key: 'KITCHEN', label: `Bếp (${roleCounts.KITCHEN})` },
              { key: 'CASHIER', label: `Thu ngân (${roleCounts.CASHIER})` },
              { key: 'MANAGER', label: `Quản lý (${roleCounts.MANAGER})` }
            ].map(tab => {
              const active = activeRoleFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveRoleFilter(tab.key)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    border: active ? '1px solid #9D4124' : '1px solid #EAE0DE',
                    background: active ? '#9D4124' : '#FBF7F6',
                    color: active ? '#FFFFFF' : '#56423D',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 3. Danh sách nhân sự trực tuyến (Cuộn mượt) */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '280px'
          }}>
            {loading && onlineStaffList.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#89726B', fontSize: '0.8rem' }}>
                Đang tải dữ liệu nhân sự...
              </div>
            ) : filteredStaff.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center' }}>
                <Icon name="group_off" size={32} style={{ color: '#C58F80', marginBottom: '6px' }} />
                <div style={{ fontSize: '0.8rem', color: '#56423D', fontWeight: 600 }}>
                  Không có nhân sự nào đang trực
                </div>
                <div style={{ fontSize: '0.72rem', color: '#89726B', marginTop: '2px' }}>
                  {activeRoleFilter === 'ALL'
                    ? 'Chưa có nhân viên nào đăng nhập trong ca này.'
                    : 'Không có nhân sự nào thuộc vai trò này đang online.'}
                </div>
              </div>
            ) : (
              filteredStaff.map((staff) => {
                const roleCfg = ROLE_CONFIG[staff.role] || ROLE_CONFIG.WAITER;
                // Lấy 2 ký tự viết tắt họ tên để làm Avatar
                const initials = (staff.fullName || staff.username || 'NV')
                  .split(' ')
                  .filter(Boolean)
                  .map(w => w[0])
                  .slice(-2)
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    key={staff.id || staff.username}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      background: '#FFF8F6',
                      border: '1px solid #F0E6E4'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Avatar tròn ký tự viết tắt */}
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: roleCfg.badgeBg,
                        color: roleCfg.badgeColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        flexShrink: 0
                      }}>
                        {initials}
                      </div>

                      {/* Họ tên, Mã nhân viên và Vai trò */}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1F1B1A' }}>
                          {staff.fullName || staff.username}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#89726B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{staff.username}</span>
                          <span>•</span>
                          <span style={{ color: roleCfg.color, fontWeight: 600 }}>{roleCfg.label}</span>
                        </div>
                      </div>
                    </div>

                    {/* Huy hiệu Online xanh lá */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      background: '#F1F8E9',
                      color: '#2E7D32',
                      fontSize: '0.68rem',
                      fontWeight: 700
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2E7D32' }} />
                      <span>Online</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 4. Footer của Popover: Nút mở lịch phân ca */}
          <div style={{
            padding: '10px 14px',
            borderTop: '1px solid #EAE0DE',
            background: '#FFF8F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.72rem', color: '#89726B' }}>
              Tổng nhân sự: <strong>{totalStaffCount}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/admin/staff'); // Chuyển thẳng sang trang Quản lý nhân sự & Phân ca
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#9D4124',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
            >
              <span>Xem Lịch Phân Ca</span>
              <Icon name="arrow_forward" size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 4. TÍCH HỢP COMPONENT VÀO `AdminLayout.jsx`

Mở file:
📁 **`SourceCode/frontend/src/components/layout/AdminLayout.jsx`**

### 4.1. Thêm Import Component
Tìm dòng import gần đầu file (khoảng dòng 7 - 8):
```jsx
import RestaurantProfileModal from '../admin/RestaurantProfileModal';
```

Thêm ngay bên dưới:
```jsx
import ShiftStatusWidget from '../admin/ShiftStatusWidget';
```

---

### 4.2. Thay thế khối mã tĩnh bằng Component động
Tìm đến cuối phần thẻ `<aside>` (khoảng dòng 250 - 263):

**Đoạn code CŨ cần thay:**
```jsx
          {/* Bottom Shift Status */}
          <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: '14px', border: '1px solid #EAE0DE' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: '#89726B', fontWeight: 700, textTransform: 'uppercase' }}>Trạng thái ca trực</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#596232', display: 'inline-block' }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1F1B1A' }}>
              8 Nhân sự đang online
            </div>
            <div style={{ fontSize: '0.72rem', color: '#596232', marginTop: '2px' }}>
              Ca Tối: 17:00 - 23:00
            </div>
          </div>
```

**Thay thế BẰNG đoạn code MỚI:**
```jsx
          {/* Bottom Shift Status (Động theo giờ thực & xem nhanh Live Roster) */}
          <ShiftStatusWidget currentTime={currentTime} />
```

*(Lưu ý: Biến `currentTime` đã có sẵn trong `AdminLayout` và cập nhật từng giây bằng `setInterval`, khi truyền vào component sẽ tự động phản hồi mà không tốn thêm bộ nhớ).*

---

## 5. PHÂN TÍCH CHUYÊN SÂU KIẾN THỨC LẬP TRÌNH (HỌC & HIỂU)

### 5.1. Thuật toán quy đổi phút để kiểm tra khung giờ trong ngày
Tại sao không dùng `getHours()` đơn thuần?  
Nếu ca trực bắt đầu vào `05:45` hoặc kết thúc vào `14:00`, việc so sánh đơn thuần bằng `hours` sẽ gặp khó khăn khi xử lý phút. Quy đổi:
$$\text{currentMinutes} = \text{hours} \times 60 + \text{minutes}$$
Ví dụ:
- `14:30` $\rightarrow 14 \times 60 + 30 = 870$ phút.
- So sánh `870 >= 840 (14:00) && 870 < 1320 (22:00)` $\rightarrow$ Xác định tức thì thuộc **Ca Tối**.
- Tiến độ ca: $\text{Progress} = \frac{\text{elapsed}}{\text{duration}} \times 100\%$.

### 5.2. Kỹ thuật Click-Outside với `useRef`
Khi mở Flyout Popover, làm thế nào để người dùng click chuột ra bất cứ đâu bên ngoài thì Popover tự đóng?
```javascript
const handleClickOutside = (e) => {
  // Nếu click KHÔNG nằm trong popover VÀ KHÔNG nằm trong widget kích hoạt
  if (
    isOpen &&
    popoverRef.current &&
    !popoverRef.current.contains(e.target) &&
    widgetRef.current &&
    !widgetRef.current.contains(e.target)
  ) {
    setIsOpen(false);
  }
};
```
Phương pháp này an toàn, tối ưu hiệu năng và là chuẩn mực trong thiết kế giao diện React.

### 5.3. Chiến lược kết hợp: Polling nhẹ + WebSocket Realtime
- **Polling ngầm 25 giây/lần:** Đảm bảo dữ liệu không bao giờ bị lệch quá 25 giây dù mạng chập chờn hay WebSocket tạm ngắt. Sử dụng cờ `isSilent = true` để không kích hoạt biểu tượng quay tải gây giật mắt người dùng.
- **WebSocket STOMP:** Lắng nghe kênh `realtimeSync`. Khi nhân viên bấm đăng nhập hoặc đăng xuất, Backend phát thông báo $\rightarrow$ Frontend nhận sự kiện và gọi `fetchStaffStatus(true)` ngay lập tức.

---

## 6. KỊCH BẢN KIỂM THỬ & NGHIỆM THU (TEST SCENARIOS)

Sau khi lưu các file, bạn hãy kiểm thử qua các kịch bản sau:

| STT | Kịch bản kiểm thử | Thao tác thực hiện | Kết quả mong đợi |
|:---:|:---|:---|:---|
| **1** | **Kiểm tra ca trực theo giờ thực** | Mở trình duyệt vào lúc 18:15 chiều | Widget hiển thị `Ca Tối: 14:00 - 22:00`, thời gian còn lại khoảng `Còn 3h 45m`, thanh tiến độ xanh lá hiển thị khoảng 53%. |
| **2** | **Kiểm tra số lượng online** | Mở thêm 1 tab ẩn danh, đăng nhập tài khoản phục vụ `EMP-001` (PIN `123456`) | Tab Quản trị admin tự động tăng con số `{onlineStaffList.length} Nhân sự đang online`. |
| **3** | **Kiểm tra Popover tương tác** | Click vào thẻ widget ở góc trái sidebar | Popover Live Roster mở ra với hiệu ứng fade-in, hiển thị danh sách nhân sự online kèm avatar, mã nhân viên và vai trò. |
| **4** | **Kiểm tra bộ lọc vai trò** | Bấm vào các chip `Phục vụ`, `Bếp`, `Thu ngân` trong popover | Danh sách lọc tức thì chỉ hiển thị nhân sự thuộc vai trò đó. |
| **5** | **Kiểm tra phím tắt & Click Outside** | Bấm phím `Escape` hoặc click chuột ra màn hình bàn ăn | Popover tự động đóng lại mượt mà. |
| **6** | **Kiểm tra nút chuyển trang** | Bấm nút `[Xem Lịch Phân Ca]` trong popover | Popover đóng lại và trình duyệt chuyển ngay sang trang `/admin/staff`. |

---
*Chúc bạn thực hành thành công và làm chủ trọn vẹn kiến thức Full-stack của tính năng này!*
