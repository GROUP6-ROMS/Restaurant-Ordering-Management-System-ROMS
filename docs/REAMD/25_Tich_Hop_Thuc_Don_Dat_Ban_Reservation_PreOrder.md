# BƯỚC 25: TÍCH HỢP THỰC ĐƠN ĐỘNG CHO TÍNH NĂNG ĐẶT TRƯỚC MÓN ĂN KHI ĐẶT BÀN (RESERVATION PRE-ORDER)

> **Mục tiêu:** Xóa bỏ hoàn toàn mã giả `MOCK_MENU_ITEMS` và `MOCK_CATEGORIES` tại Bước 3 trong quy trình Đặt bàn trực tuyến (`ReservationPage.jsx`), đưa 100% dữ liệu thực đơn từ Database SQL Server vào phục vụ thực khách:
> 1. **Liên thông danh mục & món ăn động (`customerApi.getCustomerMenu`):** Tải danh sách nhóm món (Khai vị, Món chính, Tráng miệng, Đồ uống...) cùng hình ảnh, giá bán và mô tả món được quản lý trong CSDL vào giao diện đặt bàn.
> 2. **Tìm kiếm & Phân loại linh hoạt:** Cho phép khách hàng tìm món theo tên hoặc mô tả, lọc theo từng nhóm danh mục, tăng/giảm số lượng và nhập ghi chú riêng cho từng món (ví dụ: "chín vừa", "ít sốt").
> 3. **Tự động tính toán tổng chi phí đặt trước:** Đồng bộ tổng số phần món và số tiền dự kiến vào phiếu xác nhận đặt bàn để Bếp chủ động chuẩn bị nguyên liệu trước giờ khách đến.
> 
> **Cam kết kỹ thuật:** Code sạch, bảo toàn UX responsive cao cấp, kiểm tra `npm run build` thành công 100%.

---

## 1. TỔNG QUAN KIẾN TRÚC LIÊN THÔNG (PRE-ORDER INTEGRATION)

```text
[Khách Hàng Đặt Bàn]                  [Frontend ReservationPage]                [Backend ROMS API]
        │                                        │                                       │
        │── 1. Chọn ngày, giờ & số lượng khách ──>│                                       │
        │── 2. Chọn khu vực bàn (CSL) ───────────>│                                       │
        │                                        │── 3. GET /api/customer/dining/menu ──>│
        │                                        │<── 4. Trả về Categories & Items ──────│
        │<── 5. Hiển thị thực đơn động Bước 3 ───│                                       │
        │── 6. Chọn món & thêm ghi chú chế biến ─>│                                       │
        │── 7. Điền thông tin & Bấm "Đặt bàn" ──>│── 8. POST /api/customer/reservations ─>│
        │                                        │      (kèm danh sách món pre-order)    │
        │<── 9. Nhận mã đặt bàn (Booking Code) ──│<── 10. 201 Created: ReservationResponse
```

---

## 2. CÁC ĐIỂM NÂNG CẤP KỸ THUẬT CHÍNH

### 2.1. Loại bỏ hoàn toàn Mock Data
- **Trước khi nâng cấp:**
  ```javascript
  import { MOCK_CATEGORIES, MOCK_MENU_ITEMS } from '../../mock/mockData';
  ```
  Dữ liệu tĩnh cố định trong file JavaScript khiến các món ăn mới thêm bởi Quản trị viên (Admin) không xuất hiện khi khách đặt bàn.
- **Sau khi nâng cấp:**
  ```javascript
  import { customerApi } from '../../api/customerApi';
  ```
  Nạp trực tiếp từ CSDL qua endpoint `GET /api/customer/dining/menu`, đảm bảo tính thống nhất dữ liệu trên toàn hệ thống nhà hàng.

### 2.2. Xử lý State & Effect tải thực đơn
```javascript
const [menuCategories, setMenuCategories] = useState([]);
const [menuDishes, setMenuDishes] = useState([]);
const [isLoadingMenu, setIsLoadingMenu] = useState(true);

useEffect(() => {
  const fetchMenu = async () => {
    try {
      setIsLoadingMenu(true);
      const res = await customerApi.getCustomerMenu();
      if (res.success && res.data) {
        setMenuCategories(res.data.map(c => ({ id: c.categoryId, name: c.categoryName })));
        const flatDishes = [];
        res.data.forEach(c => {
          if (c.items) {
            c.items.forEach(item => {
              flatDishes.push({
                id: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
                categoryId: c.categoryId,
                categoryName: c.categoryName,
                isAvailable: item.isAvailable
              });
            });
          }
        });
        setMenuDishes(flatDishes);
      }
    } catch (err) {
      console.error('Không thể tải thực đơn từ CSDL cho pre-order:', err);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  fetchMenu();
}, []);
```

### 2.3. Trải nghiệm người dùng (UX) tối ưu
- Hiển thị Skeleton/Spinner xoay mượt mà khi dữ liệu đang tải.
- Hiển thị Empty State nếu bộ lọc tìm kiếm không có kết quả phù hợp.
- Tự động fallback ảnh chuẩn nếu món ăn chưa có ảnh trong CSDL.

---

## 3. KẾT QUẢ KIỂM THỬ BUILD TOÀN BỘ FRONTEND
```text
vite v8.3.2 building client environment for production...
✓ 119 modules transformed.
rendering chunks...
dist/index.html                       1.35 kB │ gzip:   0.73 kB
dist/assets/roms-logo-CJQ5PwFS.svg   12.89 kB │ gzip:   4.66 kB
dist/assets/index-Duxt0tFh.css       13.86 kB │ gzip:   3.76 kB
dist/assets/index-DppvFUjZ.js       950.78 kB │ gzip: 221.15 kB
✓ built in 375ms
```
Hoàn tất 100% việc dọn sạch Mock Data trong luồng Đặt bàn trước (Milestone 3)!
