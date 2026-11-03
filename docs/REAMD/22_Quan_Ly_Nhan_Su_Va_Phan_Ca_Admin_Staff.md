# HƯỚNG DẪN CODE FULL-STACK: QUẢN LÝ NHÂN SỰ & PHÂN CA TRỰC (ADMIN STAFF & ROSTER SCHEDULING)

> **Màn hình triển khai:** `http://localhost:5173/admin/staff`  
> **Bộ phận sử dụng:** Quản lý nhà hàng (Manager / Admin)  
> **Mục tiêu:** Xóa bỏ 100% Mock Data, kết nối Full-Stack chuẩn RESTful API giữa Spring Boot 3 và React Vite để quản lý toàn diện hồ sơ nhân viên, bảo mật mã PIN 6 số băm BCrypt, quản lý phân ca trực theo ngày (`MORNING` & `EVENING`), hỗ trợ sao chép ca trực nhanh và đồng bộ thời gian thực đến các trạm phục vụ Waiter, Kitchen KDS và Thu ngân POS.

---

## 1. TỔNG QUAN KIẾN TRÚC & QUY TRÌNH NGHIỆP VỤ

### 1.1. Bối cảnh & Vai trò của Nhân sự trong ROMS
Trong hệ thống quản lý nhà hàng ROMS:
- Mọi nhân viên (`WAITER`, `KITCHEN`, `CASHIER`) đăng nhập vào ca trực bằng **Mã nhân viên / Username** và **Mã PIN 6 số** (không dùng mật khẩu văn bản thông thường).
- **Ràng buộc phân ca đa ngày (Multi-day Shift Enforcement):** Trừ Quản lý (`MANAGER`), các nhân viên khác **bắt buộc phải có lịch làm việc trong ngày hôm nay (`LocalDate.now()`)** trong bảng `staff_schedules` và chỉ được đăng nhập trong khung giờ ca trực (cho phép vào trước 15 phút).
- Trước đây, lịch trực phải nạp thủ công bằng SQL script. Tính năng này cho phép Quản lý:
  1. Xem thống kê KPI nhân sự thời gian thực (Tổng nhân lực, Đang trực ca, Phục vụ, Bếp, Thu ngân).
  2. Xem lịch phân ca của từng ngày với Date Stepper & Date Picker linh hoạt.
  3. Thêm nhân sự vào Ca Sáng (06:00 - 14:00) hoặc Ca Chiều/Tối (14:00 - 22:00) theo từng vai trò.
  4. Hủy ca trực hoặc sao chép toàn bộ lịch trực từ ngày hôm trước chỉ với 1 click.
  5. Quản lý hồ sơ nhân viên: Tìm kiếm, lọc theo vai trò, thêm mới, sửa thông tin, đổi mã PIN, khóa/mở khóa tài khoản.

---

## 2. THIẾT KẾ DỮ LIỆU & CƠ SỞ DỮ LIỆU (DATABASE MODEL)

### 2.1. Enum `UserRole` & `ShiftType`
- `UserRole.java`: `MANAGER`, `WAITER`, `KITCHEN`, `CASHIER`.
- `ShiftType.java`:
  - `MORNING`: Ca Sáng (06:00 - 14:00).
  - `EVENING`: Ca Tối (14:00 - 22:00).
  - Có hàm kiểm tra thời gian hợp lệ `isWithinShift(LocalTime now)` cho phép đăng nhập trước 15 phút.

### 2.2. Entity `Staff.java` (Bảng `staffs`)
```java
@Entity
@Table(name = "staffs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "pin_code", nullable = false, length = 255)
    private String pinCode; // Băm BCrypt

    @Column(name = "full_name", nullable = false, columnDefinition = "NVARCHAR(100)")
    private String fullName;

    @Column(name = "phone", length = 15)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private UserRole role;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "is_on_shift", nullable = false, columnDefinition = "BIT DEFAULT 0")
    private Boolean isOnShift = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

### 2.3. Entity `StaffSchedule.java` (Bảng `staff_schedules`)
```java
@Entity
@Table(name = "staff_schedules", uniqueConstraints = {
    @UniqueConstraint(name = "UQ_staff_date_shift", columnNames = {"staff_id", "work_date", "shift_type"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StaffSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    private Staff staff;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "shift_type", nullable = false, length = 30)
    private ShiftType shiftType;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

---

## 3. THIẾT KẾ BACKEND (SPRING BOOT 3 & SPRING DATA JPA)

### 3.1. DTO Requests & Responses
1. **Requests:**
   - `CreateStaffRequest`: `username`, `pinCode` (6 số), `fullName`, `phone`, `role`.
   - `UpdateStaffRequest`: `fullName`, `phone`, `role`, `isActive`.
   - `ChangeStaffPinRequest`: `newPinCode` (regex 6 chữ số).
   - `AssignShiftRequest`: `staffId`, `workDate`, `shiftType`.
   - `CopyScheduleRequest`: `fromDate`, `toDate`.
2. **Responses:**
   - `StaffResponse`: Thông tin nhân viên, nhãn vai trò tiếng Việt (`roleLabel`), ca trực ngày hôm nay (`currentShift`).
   - `StaffSummaryResponse`: 6 chỉ số KPI (`totalStaff`, `onlineStaff`, `waiterCount`, `kitchenCount`, `cashierCount`, `managerCount`).
   - `StaffScheduleResponse`: Bản ghi phân ca kèm thông tin nhân sự và giờ ca trực.
   - `DayScheduleSummaryResponse`: Tổng hợp ca sáng (`morningShift`) và ca tối (`eveningShift`) theo ngày.

### 3.2. Repository Layer
- **`StaffRepository`:**
  - `Optional<Staff> findByUsername(String username);`
  - `boolean existsByUsername(String username);`
  - `long countByRole(UserRole role);`
  - `long countByIsOnShiftTrue();`
  - `List<Staff> searchStaff(@Param("keyword") String keyword, @Param("role") UserRole role, @Param("isActive") Boolean isActive);`
- **`StaffScheduleRepository`:**
  - `List<StaffSchedule> findByStaffAndWorkDate(Staff staff, LocalDate workDate);`
  - `List<StaffSchedule> findByWorkDateWithStaff(@Param("workDate") LocalDate workDate);`
  - `boolean existsByStaffAndWorkDateAndShiftType(Staff staff, LocalDate workDate, ShiftType shiftType);`
  - `void deleteByStaffIdAndWorkDateAndShiftType(Long staffId, LocalDate workDate, ShiftType shiftType);`

### 3.3. Service Layer (`StaffService` & `StaffServiceImpl`)
- `getAllStaff(...)`: Lấy danh sách nhân viên kèm trạng thái ca trực hôm nay.
- `createStaff(...)`: Kiểm tra username duy nhất, băm PIN 6 số với `BCryptPasswordEncoder`, lưu DB.
- `updateStaff(...)`: Cập nhật họ tên, SĐT, vai trò, trạng thái hoạt động.
- `changePin(...)`: Đổi mã PIN, băm BCrypt.
- `toggleActiveStatus(...)`: Khóa/mở khóa tài khoản (nếu khóa thì tự động tắt `isOnShift`).
- `getStaffSummary(...)`: Tính toán 6 thẻ KPI.
- `getDaySchedule(...)`: Lấy danh sách ca trực theo ngày, phân nhóm thành Ca Sáng và Ca Tối.
- `assignShift(...)`: Kiểm tra nhân viên có active không, chống phân trùng ca, lưu lịch trực.
- `removeShift(...)`: Xóa phân ca.
- `copySchedule(...)`: Sao chép lịch từ ngày nguồn sang ngày đích (tự động bỏ qua các ca đã tồn tại).

### 3.4. Controller Layer (`AdminStaffController`)
- Đường dẫn cơ sở: `/api/admin/staff`
- Phân quyền: `@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")`
- Danh sách endpoints:
  - `GET /api/admin/staff/summary` — Lấy KPI tổng quan.
  - `GET /api/admin/staff` — Lọc danh sách nhân viên (`search`, `role`, `isActive`).
  - `GET /api/admin/staff/{id}` — Xem chi tiết nhân viên.
  - `POST /api/admin/staff` — Tạo nhân viên mới.
  - `PUT /api/admin/staff/{id}` — Sửa thông tin nhân viên.
  - `PUT /api/admin/staff/{id}/pin` — Đổi mã PIN 6 số.
  - `PATCH /api/admin/staff/{id}/toggle-status` — Khóa/mở khóa tài khoản.
  - `GET /api/admin/staff/schedules?date=YYYY-MM-DD` — Xem phân ca ngày.
  - `POST /api/admin/staff/schedules` — Phân ca trực.
  - `DELETE /api/admin/staff/schedules/{id}` — Hủy ca trực theo ID.
  - `POST /api/admin/staff/schedules/copy` — Sao chép phân ca từ ngày này sang ngày khác.

---

## 4. THIẾT KẾ FRONTEND (REACT VITE & TAILWIND CSS)

### 4.1. Axios API Client (`src/api/staffApi.js`)
Được bọc trong `axiosClient` tự động đính kèm `Bearer Token` của Manager:
```javascript
import axiosClient from './axiosClient';

export const staffApi = {
    getSummary: () => axiosClient.get('/admin/staff/summary'),
    getAllStaff: (params) => axiosClient.get('/admin/staff', { params }),
    getStaffById: (id) => axiosClient.get(`/admin/staff/${id}`),
    createStaff: (data) => axiosClient.post('/admin/staff', data),
    updateStaff: (id, data) => axiosClient.put(`/admin/staff/${id}`, data),
    changePin: (id, newPinCode) => axiosClient.put(`/admin/staff/${id}/pin`, { newPinCode }),
    toggleStatus: (id) => axiosClient.patch(`/admin/staff/${id}/toggle-status`),
    getDaySchedule: (date) => axiosClient.get('/admin/staff/schedules', { params: { date } }),
    getScheduleRange: (startDate, endDate) => axiosClient.get('/admin/staff/schedules/range', { params: { startDate, endDate } }),
    assignShift: (data) => axiosClient.post('/admin/staff/schedules', data),
    removeShift: (id) => axiosClient.delete(`/admin/staff/schedules/${id}`),
    removeShiftByDetails: (staffId, workDate, shiftType) => axiosClient.delete('/admin/staff/schedules', { params: { staffId, workDate, shiftType } }),
    copySchedule: (fromDate, toDate) => axiosClient.post('/admin/staff/schedules/copy', { fromDate, toDate })
};
export default staffApi;
```

### 4.2. Giao diện `StaffManagementPage.jsx` (`/admin/staff`)
Trang quản lý gồm 2 Tab chính:
1. **Tab 1: Lịch Phân Ca & Điều Phối (Roster Schedule)**
   - **Date Stepper:** Chuyển ngày trước/sau, date picker chọn ngày trực tiếp, nút "Về hôm nay".
   - **Thao tác sao chép:** Nút "Sao chép ca từ hôm qua" để tự động áp dụng phân ca liền kề.
   - 🖨️ **In Lịch Tuần (A4):**
     - Nút "In Lịch Tuần (A4)" tích hợp ngay trên thanh công cụ điều phối ca trực.
     - Modal xem trước & in ấn toàn diện:
       - **Bộ điều hướng tuần:** Chuyển "Tuần trước", "Tuần sau", "Về tuần này" (tự động tính Thứ Hai -> Chủ Nhật).
       - **Bộ lọc vai trò:** Lọc theo Quản lý, Thu ngân, Phục vụ, Bếp hoặc Tất cả.
       - **2 chế độ xem:**
         1. *Bảng Ma Trận (Matrix View - Chuẩn A4 Ngang):* Hàng là danh sách nhân viên, cột là 7 ngày trong tuần, hiển thị rõ ca Sáng / Tối / Cả ngày / OFF kèm tổng ca trong tuần và thống kê quân số từng ca mỗi ngày.
         2. *Lưới 7 Ngày (Cards Grid View):* Chia 7 khối ngày chi tiết danh sách nhân sự từng ca.
       - **Chuẩn in A4 Landscape:** Tự động ẩn modal header/controls qua `@media print`, hiển thị tiêu đề nhà hàng, mã biểu mẫu `BM-NS-04/ROMS`, bảng biểu nét rõ, ghi chú quy định ca trực và 3 ô chữ ký phê duyệt (Người lập lịch, Điều phối bếp, Giám đốc chi nhánh).
   - **Ca Sáng (06:00 - 14:00) & Ca Tối (14:00 - 22:00):**
     - Hiển thị danh sách nhân sự được chia thành 4 cột vai trò: Quản lý, Thu ngân, Phục vụ, Bếp.
     - Nút xóa nhanh `(x)` để rút nhân sự khỏi ca trực.
     - Dropdown chọn nhanh các nhân sự đang rảnh trong ca để phân công ngay lập tức.
2. **Tab 2: Hồ Sơ & Danh Sách Nhân Viên (Roster Table)**
   - Tìm kiếm realtime theo tên, mã NV, SĐT.
   - Lọc theo vai trò (`MANAGER`, `CASHIER`, `WAITER`, `KITCHEN`) và trạng thái (`ONLINE`, `OFFLINE`, `ACTIVE`, `LOCKED`).
   - Bảng nhân viên hiển thị Avatar viết tắt, vai trò, trạng thái trực ca, ca làm việc hôm nay, trạng thái tài khoản.
   - Các nút thao tác:
     - 🔢 **Đổi PIN:** Mở modal nhập mã PIN 6 số mới.
     - ✏️ **Sửa hồ sơ:** Mở modal cập nhật họ tên, SĐT, vai trò, trạng thái.
     - 🔒 **Khóa / Mở khóa:** Đổi trạng thái `isActive` ngay trên danh sách.

---

## 5. HƯỚNG DẪN TEST & KIỂM THỬ TÍNH NĂNG

### 5.1. Kiểm thử cURL API mẫu
1. **Lấy KPI tổng quan nhân sự:**
```bash
curl -X GET "http://localhost:8080/api/admin/staff/summary" \
     -H "Authorization: Bearer <MANAGER_JWT_TOKEN>"
```

2. **Tạo nhân viên mới:**
```bash
curl -X POST "http://localhost:8080/api/admin/staff" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <MANAGER_JWT_TOKEN>" \
     -d '{
       "username": "EMP-9999",
       "pinCode": "123456",
       "fullName": "Trần Văn Thử Nghiệm",
       "phone": "0987654321",
       "role": "WAITER"
     }'
```

3. **Phân ca trực cho nhân viên:**
```bash
curl -X POST "http://localhost:8080/api/admin/staff/schedules" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <MANAGER_JWT_TOKEN>" \
     -d '{
       "staffId": 3,
       "workDate": "2026-10-12",
       "shiftType": "MORNING"
     }'
```

4. **Sao chép lịch hôm qua sang hôm nay:**
```bash
curl -X POST "http://localhost:8080/api/admin/staff/schedules/copy" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <MANAGER_JWT_TOKEN>" \
     -d '{
       "fromDate": "2026-10-11",
       "toDate": "2026-10-12"
     }'
```

### 5.2. Câu lệnh SQL kiểm tra dữ liệu
```sql
-- 1. Xem danh sách nhân viên
SELECT id, username, full_name, phone, role, is_active, is_on_shift FROM staffs;

-- 2. Xem các ca trực đã phân trong ngày hôm nay
SELECT s.id, st.username, st.full_name, st.role, s.work_date, s.shift_type
FROM staff_schedules s
JOIN staffs st ON s.staff_id = st.id
WHERE s.work_date = CAST(GETDATE() AS DATE)
ORDER BY s.shift_type, st.role;
```

---

## 6. BẢNG MÃ LỖI & XỬ LÝ SỰ CỐ (TROUBLESHOOTING)

| Mã lỗi HTTP / Sự cố | Nguyên nhân | Cách khắc phục |
|:---|:---|:---|
| `400 BAD_REQUEST` | Mã PIN không đủ 6 chữ số hoặc chứa ký tự chữ. | Nhập chính xác 6 ký tự số (ví dụ: `123456`). |
| `400 BAD_REQUEST` | Phân ca cho nhân viên đang bị khóa (`isActive = false`). | Mở khóa tài khoản nhân viên trước khi phân ca. |
| `409 CONFLICT` | Tên đăng nhập / Mã nhân viên đã tồn tại. | Đổi mã nhân viên khác (ví dụ: `EMP-8846`). |
| `409 CONFLICT` | Nhân viên đã có lịch trực ca đó trong ngày. | Không thể phân trùng ca, chọn ca khác hoặc nhân viên khác. |
| `403 FORBIDDEN` | Tài khoản đăng nhập không có quyền `MANAGER` hoặc `ADMIN`. | Đăng nhập bằng tài khoản Quản lý (`MGR-001`). |
| `Trắng màn hình web (Blank Screen)` | `TypeError: staffList.filter is not a function` do lưu thẳng `res.data` (ApiResponse bọc ngoài) thay vì bóc tách `res.data.data`. | Luôn bóc tách dữ liệu chuẩn `res?.data?.data !== undefined ? res.data.data : res?.data` và bọc kiểm tra phòng vệ `safeStaffList = Array.isArray(staffList) ? staffList : []`. |

---

## 7. TÍNH NĂNG XUẤT FILE EXCEL (.XLS) ĐỊNH DẠNG ĐẸP CHUẨN ROMS

### 7.1. Tổng quan tính năng
Chức năng cho phép Quản lý tải bảng phân công ca trực 7 ngày trong tuần về máy tính dưới định dạng tệp Microsoft Excel (`.xls`) với giao diện chuyên nghiệp, màu sắc đồng bộ nhận diện thương hiệu ROMS và đầy đủ số liệu thống kê.

**Vị trí nút bấm:**
1. **Thanh công cụ phân ca chính:** Nút `[Xuất Excel Tuần]` (Màu xanh lá emerald / viền đậm).
2. **Hộp thoại In Lịch Tuần (A4):** Nút `[Xuất File Excel (.xls)]` nằm ngay cạnh nút In / Xuất PDF.

### 7.2. Cấu trúc và định dạng bảng tính Excel
Tệp Excel được thiết kế chuẩn mực với 4 phần nội dung:
- **Phần 1: Banner tiêu đề & Thông tin biểu mẫu:**
  - Tiêu đề chính: `HỆ THỐNG QUẢN LÝ NHÀ HÀNG ROMS - BẢNG PHÂN CÔNG LỊCH TRỰC NHÂN SỰ THEO TUẦN` (Nền `#9D4124`, chữ trắng, in hoa, cỡ chữ 16pt).
  - Phụ đề: Áp dụng từ Thứ Hai đến Chủ Nhật, Chi nhánh Quận 1, Mã biểu mẫu `BM-NS-04/ROMS`.
  - Thông tin thời điểm xuất, người lập bảng, tổng số lượng nhân sự và tổng số ca trực.
- **Phần 2: Ma trận phân ca 7 ngày chi tiết:**
  - Các cột: `STT`, `Mã NV`, `Họ và Tên`, `Số Điện Thoại`, `Vai Trò`, `Thứ Hai` đến `Chủ Nhật`, `Tổng Ca`.
  - Badge vai trò có màu sắc riêng biệt: Quản lý (`#FCF1EF`), Thu ngân (`#FFF3E0`), Phục vụ (`#F1F8E9`), Bếp (`#FFEBEE`).
  - Ô phân ca có màu sắc trực quan:
    - Ca Sáng (06:00 - 14:00): Nền vàng hổ phách nhạt `#FFF8E1`, chữ cam đậm.
    - Ca Tối (14:00 - 22:00): Nền đá xám ấm `#EFEBE9`, chữ nâu đậm.
    - Trực cả 2 ca (Sáng + Tối): Nền cam `#FFE0B2`, chữ cam đậm.
    - Ngày nghỉ (OFF): Nền xám `#FAFAFA`, chữ nghiêng màu xám.
  - Hàng tổng kết cuối bảng:
    - `Tổng NV Ca Sáng (06:00 - 14:00)` từng ngày và toàn tuần.
    - `Tổng NV Ca Tối (14:00 - 22:00)` từng ngày và toàn tuần.
    - `Tổng Lượt Trực Trong Ngày (Cả 2 Ca)` từng ngày và tổng số ca toàn tuần (`#9D4124`).
- **Phần 3: Bảng tổng hợp cơ cấu nhân lực theo vai trò:**
  - Thống kê số lượng nhân sự, tổng số ca trực và tỷ trọng đóng góp (%) của từng bộ phận: Quản lý, Thu ngân, Phục vụ bàn, Bếp & KDS.
- **Phần 4: Quy chế vận hành & 3 ô chữ ký phê duyệt:**
  - Ghi chú 3 điều quy định ca trực (giờ có mặt trước 15p, quy định đổi ca báo trước 24h, kỷ luật ca trực).
  - 3 ô chữ ký: `NGƯỜI LẬP BẢNG LỊCH` (Quản lý ca), `ĐIỀU PHỐI BẾP` (Bếp trưởng Lead), `GIÁM ĐỐC CHI NHÁNH` (Ban Quản Trị ROMS).

### 7.3. Điểm kỹ thuật nổi bật
1. **Chống lỗi font tiếng Việt 100%:** Sử dụng tiền tố nhị phân UTF-8 BOM (`new Uint8Array([0xEF, 0xBB, 0xBF])`) giúp Microsoft Excel trên cả Windows và macOS mở tệp không bao giờ bị lỗi dấu tiếng Việt hay hiển thị ký tự lạ `??`.
2. **Không làm mất số 0 đầu:** Thuộc tính CSS chuyên dụng của Excel `mso-number-format: "\@"` được áp dụng cho cột Mã NV và Số điện thoại (`09xx...`), đảm bảo Excel coi dữ liệu là Text và không tự biến thành số khoa học.
3. **Cố định chiều rộng cột:** Sử dụng thẻ `<col width="...">` giúp bảng tính khi mở ra trong Excel tự động căn độ rộng vừa vặn cho từng cột, tránh việc tên nhân viên hoặc nhãn ca bị cắt ngắn (`###`).

---

## 8. TỐI ƯU CƠ CHẾ PHÂN CA THEO TỪNG VAI TRÒ CHUYÊN TRÁCH (ROLE-BASED ASSIGNMENT)

### 8.1. Vấn đề của cơ chế cũ khi quy mô nhân sự lớn
Khi nhà hàng có hàng chục nhân viên (20 - 50+ nhân sự) thuộc nhiều bộ phận khác nhau (Quản lý, Thu ngân, Bếp, Phục vụ), việc dùng chung 1 dropdown phân ca ở đầu ca trực sẽ gây ra:
- Danh sách dài, khó tìm kiếm và dễ chọn nhầm nhân viên khác bộ phận (ví dụ: muốn tìm Phục vụ nhưng dropdown lẫn lộn cả Bếp và Quản lý).
- Không kiểm soát được trực quan số lượng nhân sự còn khả dụng của từng bộ phận.
- Nguy cơ chọn nhầm nhân sự đang bị tạm khóa tài khoản (`isActive = false`).

### 8.2. Giải pháp phân ca chuyên biệt theo từng Role
Đã tối ưu hóa giao diện phân ca tại cả **Ca Sáng (06:00 - 14:00)** và **Ca Chiều / Tối (14:00 - 22:00)**:
1. **Thanh tiêu đề ca:** Hiển thị số lượng nhân sự đang trực và 4 badge thống kê nhanh số lượng của từng bộ phận (Quản lý, Thu ngân, Phục vụ, Bếp), kèm nút `[+ Phân ca sáng]` / `[+ Phân ca tối]`.
2. **Tại từng thẻ bộ phận (Role Card):**
   - Đặt nút bấm hành động `[Phân ca {Role} ({Số lượng NV sẵn sàng})]` với màu sắc nhận diện thương hiệu ROMS.
   - Khi bấm vào nút, mở **Pop-up Modal Phân Ca Chuyên Dụng (Modal 5)**.

---

## 9. HỘP THOẠI POP-UP PHÂN CA CHO NHÂN VIÊN VỚI TÌM KIẾM THEO TÊN (POP-UP ASSIGN MODAL)

### 9.1. Tổng quan trải nghiệm người dùng (UX/UI Workflow)
Khi quản lý nhà hàng bấm vào nút phân ca tại bất kỳ bộ phận nào hoặc trên thanh tiêu đề ca, hệ thống hiển thị **Hộp thoại Pop-up Phân Ca Nhân Viên** chuyên nghiệp với các thành phần:
1. **Bộ chuyển đổi linh hoạt (Shift & Role Switcher):**
   - Chuyển đổi nhanh giữa **Ca Sáng (06:00 - 14:00)** và **Ca Tối (14:00 - 22:00)** ngay trong pop-up.
   - Các nút Tab vai trò: `Tất cả vai trò`, `Quản lý`, `Thu ngân`, `Phục vụ`, `Đầu bếp/KDS`.
2. **Khung tìm kiếm thông minh theo từ khóa (Real-time Name Search Box):**
   - Cho phép nhập từ khóa bất kỳ (ví dụ: *"An"*, *"Linh"*, *"Văn"*, mã nhân viên, hoặc số điện thoại).
   - Hệ thống lọc tức thì không phân biệt hoa thường (`toLowerCase()`), chỉ giữ lại các nhân viên có tên chứa từ khóa.
   - Có nút `[X]` để xóa nhanh từ khóa tìm kiếm và hiển thị số lượng nhân sự phù hợp.
3. **Dropdown chọn nhân viên được lọc:**
   - Dropdown tự động cập nhật danh sách các nhân viên thỏa mãn cả 4 điều kiện:
     1. `s.isActive === true` (Đang hoạt động bình thường, tuyệt đối không cho phép tài khoản bị khóa).
     2. `!assignedStaffIds.includes(s.id)` (Chưa được phân công trong ca trực đang chọn).
     3. Khớp với vai trò đã chọn (hoặc tất cả vai trò nếu chọn "Tất cả").
     4. Tên nhân viên chứa từ khóa tìm kiếm (nếu có nhập vào ô tìm kiếm).
   - Hiển thị rõ: Họ và tên, Mã nhân viên, Vai trò và Số điện thoại.
4. **Card xem trước nhân viên (Selected Staff Preview Card):**
   - Khi người dùng chọn một nhân viên trong dropdown, một thẻ xem trước sẽ xuất hiện ngay bên dưới hiển thị Avatar với màu sắc nhận diện vai trò, họ tên, mã số, số điện thoại và huy hiệu "Đang hoạt động".
5. **Nút hành động "Thêm Vào Ca Trực":**
   - Nút `[+ Thêm Vào Ca Trực]` màu cam đất ROMS `#9D4124`, tự động kích hoạt khi có nhân viên được chọn.
   - Khi bấm thêm, hệ thống gọi API `staffApi.assignShift`, hiển thị Toast thông báo thành công và cập nhật lại ca trực theo thời gian thực.
   - Hộp thoại vẫn giữ nguyên mở và tự động reset dropdown về mặc định để quản lý có thể tiếp tục phân ca cho nhân viên tiếp theo mà không cần phải mở lại pop-up nhiều lần.
6. **Danh sách nhân sự đã có trong ca trực (Live Roster in Modal):**
   - Ở chân pop-up, hiển thị danh sách các nhân viên hiện đã được phân vào ca này kèm nút `[Hủy ca]` giúp quản lý kiểm soát tổng thể và điều chỉnh nhân sự tức thì.



