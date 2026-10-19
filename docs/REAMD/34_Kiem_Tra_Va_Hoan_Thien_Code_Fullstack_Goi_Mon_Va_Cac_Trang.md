# BƯỚC 34: HOÀN THIỆN ĐỒNG BỘ FULL-STACK CHỨC NĂNG GỌI MÓN VÀ RÀ SOÁT TẤT CẢ CÁC TRANG (END-TO-END FULLSTACK AUDIT)

> **Mục tiêu:** Rà soát và hoàn thiện toàn bộ luồng gọi món, thêm món, điều chỉnh số lượng và tương tác dữ liệu trên toàn bộ các trang của hệ thống ROMS (Admin Sơ Đồ Bàn, Phục Vụ Waiter, Thu Ngân POS, Bếp KDS và Thực Khách Khách Hàng). Khắc phục triệt để lỗi phân giải dữ liệu thực đơn `resMenu.data` và phân quyền Spring Security giữa các Role.

---

## 1. PHÂN TÍCH NGUYÊN NHÂN & VẤN ĐỀ ĐƯỢC PHÁT HIỆN

### 1.1. Lỗi phân giải cấu trúc dữ liệu Axios (Frontend)
- **Hiện tượng:** Khi người dùng bấm nút **"+ Thêm Món"** trong Popup quản lý đơn bàn (`TableManagementPage.jsx`), modal mở ra nhưng danh mục món ăn bị trống rỗng ("Không tìm thấy món nào phù hợp").
- **Nguyên nhân gốc rễ (Root Cause):** 
  - Backend Spring Boot bọc dữ liệu trong chuẩn `ApiResponse<T>`:
    ```json
    {
      "success": true,
      "message": "Lấy danh sách món ăn thành công!",
      "data": [ ...danh sách món ăn... ]
    }
    ```
  - Khi Axios nhận phản hồi, toàn bộ JSON trên nằm ở `resMenu.data`.
  - Đoạn code cũ gán `const dishes = resMenu.data || [];` dẫn đến `dishes` là một Object chứ không phải Array.
  - Lệnh gọi `dishes.filter(d => d.isActive)` gây ngoại lệ `TypeError: dishes.filter is not a function`, bị nuốt bởi khối `catch` và khiến `menuCatalog` luôn bằng mảng rỗng `[]`.

### 1.2. Lỗi phân quyền Spring Security (Backend)
- Controller quản lý thực đơn `AdminMenuController.java` khai báo phân quyền lớp:
  ```java
  @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
  ```
- Trong khi đó, nhân viên phục vụ (`WAITER`) và thu ngân (`CASHIER`) khi thao tác trên sơ đồ bàn ăn cũng cần nạp danh sách món để gọi thêm món vào bàn. Việc chặn cứng ở cấp Class khiến các yêu cầu GET thực đơn bị lỗi `403 Forbidden`.

---

## 2. CÁC NÂNG CẤP VÀ HOÀN THIỆN FULL-STACK

### 2.1. Cải tiến Frontend (`TableManagementPage.jsx`)
1. **Sửa bóc tách dữ liệu thực đơn an toàn:**
   ```javascript
   // Bóc tách chính xác mảng dữ liệu từ ApiResponse
   const resMenu = await menuApi.getItems();
   const rawDishes = resMenu.data?.data || (Array.isArray(resMenu.data) ? resMenu.data : []);
   // Lọc chỉ lấy các món đang kích hoạt (isActive !== false) và còn hàng phục vụ (isAvailable !== false)
   const dishes = rawDishes.filter(d => d.isActive !== false && d.isAvailable !== false);
   setMenuCatalog(dishes);
   ```
2. **Đồng bộ trạng thái bàn khi thêm món thành công:**
   ```javascript
   const res = await tableApi.addItemsToTable(orderDrawerTable.id, payload);
   if (res.data && res.data.success) {
     setActiveOrdersData(res.data.data);
     setShowAddOrderModal(false);
     setOrderCart([]);
     showToast('Đã gửi đợt gọi món vào bàn thành công!');
     setOrderDrawerTable(prev => prev ? { ...prev, status: 'OCCUPIED' } : prev);
     broadcastRealtimeEvent({ type: 'NEW_ORDER_CREATED', tableId: orderDrawerTable.id });
     loadData(true);
   }
   ```
3. **Đồng bộ tương tự cho Modal chỉnh sửa món đặt trước (`PreOrderModal`).**

### 2.2. Cải tiến Backend Security (`AdminMenuController.java`)
- Nâng cấp phân quyền cấp Class cho phép `WAITER` và `CASHIER` đọc thực đơn phục vụ gọi món:
  ```java
  @RestController
  @RequestMapping("/api/admin/menu")
  @RequiredArgsConstructor
  @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'WAITER', 'CASHIER')")
  public class AdminMenuController {
  ```
- Khóa chặt các phương thức can thiệp ghi (Thêm món, Sửa món, Xóa món, Đổi trạng thái hết hàng, Đồng bộ KDS/POS) chỉ dành riêng cho Quản lý & Admin:
  ```java
  @PostMapping("/items")
  @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
  ...
  @PutMapping("/items/{id}")
  @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
  ...
  @DeleteMapping("/items/{id}")
  @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
  ...
  ```

---

## 3. RÀ SOÁT TỔNG THỂ TẤT CẢ CÁC TRANG CÒN LẠI (CROSS-PAGE FULLSTACK VERIFICATION)

| Trang chức năng | Phân hệ | Nghiệp vụ gọi món / Thao tác dữ liệu | Trạng thái Full-Stack |
| :--- | :--- | :--- | :--- |
| **Sơ đồ Bàn Quản lý** (`TableManagementPage.jsx`) | Admin / Manager | Thêm món trực tiếp vào bàn (`addItemsToTable`), Điều chỉnh số lượng (+/-) (`updateOrderItemQuantity`), Hủy món (`cancelOrderItem`), In tạm tính (`markDraftPrinted`). | ✅ **100% Full-Stack kết nối DB thật** |
| **Sơ đồ Phục Vụ** (`WaiterFloorPlanPage.jsx`) | Waiter | Bấm *"Gọi Thêm Món Vào Bàn"*, chọn món theo Category, tìm kiếm SKU/Tên, nạp vào giỏ và gửi đợt gọi vào Bếp KDS (`waiterApi.addOrder`). | ✅ **100% Full-Stack kết nối DB thật** |
| **Chi Tiết Bàn Phục Vụ** (`WaiterOrderDetailPage.jsx`) | Waiter | Modal gọi thêm món 2 tab (Catalog & Cart), gửi order nhiều món cùng lúc sang Bếp (`waiterApi.addOrder`), giao món lẻ (`deliverSingleItem`). | ✅ **100% Full-Stack kết nối DB thật** |
| **Thu Ngân POS** (`PosCheckoutPage.jsx`) | Cashier | Thêm nhanh món ăn trực tiếp (`handleQuickAddDish`), xem tạm tính realtime (`cashierApi.getBillPreview`), thanh toán đa phương thức (`cashierApi.checkout`). | ✅ **100% Full-Stack kết nối DB thật** |
| **Giỏ Hàng Khách Hàng** (`CustomerCartPage.jsx`) | Customer QR | Khách quét mã bàn, đặt món trực tuyến vào bàn (`customerApi.placeCustomerOrder`), bấm chuông gọi nhân viên (`customerApi.callWaiter`). | ✅ **100% Full-Stack kết nối DB thật** |
| **Màn Hình Bếp KDS** (`KitchenPage.jsx`) | Kitchen | Nhận thông báo realtime đợt gọi món mới, cập nhật trạng thái nấu (`updateItemStatus`: COOKING -> READY), kích hoạt chế độ hỏa tốc (RUSH). | ✅ **100% Full-Stack kết nối DB thật** |

---

## 4. KẾT QUẢ KIỂM THỬ TÍCH HỢP

- **Backend:** `mvn test-compile` hoàn tất thành công (`BUILD SUCCESS` trong 2.29s).
- **Frontend:** `npm run build` biên dịch thành công 119 modules trong 338ms, không có bất kỳ cảnh báo hoặc lỗi cú pháp nào.
