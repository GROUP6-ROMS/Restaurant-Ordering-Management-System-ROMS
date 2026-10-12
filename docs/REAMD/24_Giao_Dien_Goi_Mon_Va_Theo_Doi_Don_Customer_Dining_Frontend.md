# BƯỚC 24: HOÀN THIỆN GIAO DIỆN THỰC KHÁCH GỌI MÓN VÀ THEO DÕI ĐƠN HÀNG THỜI GIAN THỰC (CUSTOMER DINING FRONTEND)

> **Mục tiêu:** Xóa bỏ hoàn toàn mã giả (Mock Data) và các hàm giả lập `setTimeout` trong toàn bộ luồng trải nghiệm khách hàng quét mã QR tại bàn (Mobile Customer Dining Flow):
> 1. **Khám phá thực đơn số (`CustomerMenuPage.jsx`):** Tải 100% danh mục và danh sách món ăn động từ CSDL thật qua `customerApi.getCustomerMenu()`. Đồng bộ số lượng món trong giỏ hàng, thông tin số bàn, số khách và rung chuông gọi phục vụ.
> 2. **Gửi đơn gọi món vào Bếp KDS (`CustomerCartPage.jsx`):** Gửi đơn hàng thật xuống Backend `POST /api/customer/dining/orders`, tự động kích hoạt phiên ăn, tạo đĩa món trong CSDL SQL Server và phát sự kiện `broadcastRealtimeEvent('NEW_ORDER_CREATED')` sang Bếp KDS và Waiter mà không cần reload trang.
> 3. **Theo dõi tiến độ chế biến thời gian thực (`CustomerTrackingPage.jsx`):** Xóa bỏ mảng mock tĩnh, hiển thị trực quan các đợt gọi món (Đợt 1, Đợt 2...), trạng thái từng đĩa món (`Chờ nhận đơn`, `Đang nấu`, `Đã nấu xong - Chờ bưng`, `Đã phục vụ`), bảng kê hóa đơn tạm tính và tính năng gửi yêu cầu thanh toán (`Chuyển khoản VietQR`, `Tiền mặt`, `Quẹt thẻ POS`) sang quầy Thu ngân POS.
> 
> **Cam kết chất lượng:** Giao diện chuẩn Mobile Responsive, hiệu ứng micro-animations mượt mà, kiểm tra build `npm run build` thành công tuyệt đối 0 lỗi.

---

## 1. TỔNG QUAN KIẾN TRÚC LUỒNG THỰC KHÁCH (CUSTOMER MOBILE FLOW)

```text
[Quét mã QR Bàn Ăn]
        │
        ▼
[TableWelcomePage.jsx] ────> Xác thực mã token bàn qua API ────> Lưu session vào CartContext
        │
        ▼
[CustomerMenuPage.jsx] ────> Tải Menu động từ CSDL ────────────> Chọn món & ghi chú riêng
        │
        ▼
[CustomerCartPage.jsx] ────> Kiểm tra giỏ hàng & VAT ──────────> Bấm "Gửi Đơn Vào Bếp"
        │                                                               │
        │                                                               ├──> Lưu Order & OrderItem vào DB
        │                                                               └──> Broadcast: NEW_ORDER_CREATED
        ▼
[CustomerTrackingPage.jsx] <── Polling 6s & Realtime Listen ──── Cập nhật tiến độ đĩa món
        │
        ├──> Nút "Gọi phục vụ" & "Xin đá / Khăn" ───────────────> Báo chuông Waiter
        └──> Nút "Yêu cầu thanh toán" (VietQR, Tiền mặt, Thẻ) ──> Báo chuông Thu Ngân POS
```

---

## 2. XÂY DỰNG API CLIENT CHO THỰC KHÁCH (`customerApi.js`)

File: `SourceCode/frontend/src/api/customerApi.js`

```javascript
import axiosClient from './axiosClient';

export const customerApi = {
    // 1. Lấy toàn bộ danh mục thực đơn và món ăn đang mở bán
    getCustomerMenu: async () => {
        const response = await axiosClient.get('/customer/dining/menu');
        return response.data;
    },

    // 2. Thực khách gửi đơn gọi món tại bàn
    placeCustomerOrder: async (orderData) => {
        const response = await axiosClient.post('/customer/dining/orders', orderData);
        return response.data;
    },

    // 3. Theo dõi tiến độ đĩa món và hóa đơn tạm tính theo bàn
    getOrderTracking: async (tableId, tableNumber) => {
        const response = await axiosClient.get('/customer/dining/tracking', {
            params: { tableId, tableNumber }
        });
        return response.data;
    },

    // 4. Bấm chuông gọi nhân viên phục vụ / xin nước / dọn bàn
    callWaiter: async (data) => {
        const response = await axiosClient.post('/customer/dining/call-waiter', data);
        return response.data;
    },

    // 5. Yêu cầu tính tiền gửi sang quầy Thu ngân POS
    requestPayment: async (tableId, tableNumber, paymentMethod = 'CASH') => {
        const response = await axiosClient.post('/customer/dining/request-payment', null, {
            params: { tableId, tableNumber, paymentMethod }
        });
        return response.data;
    },

    // 6. Xác thực mã QR bàn ăn khi thực khách quét vào
    verifyTableQr: async (qrToken) => {
        const response = await axiosClient.post('/customer/tables/verify-qr', { qrToken });
        return response.data;
    }
};

export default customerApi;
```

---

## 3. CẢI TIẾN TRANG THỰC ĐƠN (`CustomerMenuPage.jsx`)

1. **Loại bỏ Mock Data tĩnh:** Thay `MOCK_CATEGORIES` và `MOCK_MENU_ITEMS` bằng dữ liệu động từ API `customerApi.getCustomerMenu()`.
2. **Hiển thị thông tin bàn thật:** Đọc `tableInfo?.tableNumber` và `tableInfo?.guestCount` từ `CartContext`, không còn hardcode `Bàn T05`.
3. **Chuông gọi phục vụ thật:** Gọi `customerApi.callWaiter` gửi trực tiếp yêu cầu sang CSDL và phát sóng sự kiện qua `broadcastRealtimeEvent`.

---

## 4. CẢI TIẾN TRANG GIỎ HÀNG (`CustomerCartPage.jsx`)

1. **Gửi đơn hàng thật vào CSDL:**
   - Đóng gói dữ liệu gồm `tableId`, `tableNumber`, `guestCount`, `orderNote`, danh sách món `items` (`menuItemId`, `quantity`, `note`).
   - Gọi `customerApi.placeCustomerOrder(payload)`.
2. **Kích hoạt Realtime Broadcast:**
   - Ngay khi đơn hàng được tạo, phát sự kiện:
     ```javascript
     broadcastRealtimeEvent({
       type: 'NEW_ORDER_CREATED',
       tableId: tableInfo?.tableId,
       tableNumber: tableInfo?.tableNumber
     });
     ```
   - Màn hình Bếp KDS và Waiter tự động cập nhật ngay tức thì mà không cần tải lại trang.

---

## 5. CẢI TIẾN TRANG THEO DÕI ĐƠN HÀNG (`CustomerTrackingPage.jsx`)

1. **Khử hoàn toàn Mock Batches tĩnh:** Nạp danh sách đợt món và đĩa món từ `customerApi.getOrderTracking(tableId, tableNumber)`.
2. **Cơ chế Dual-Sync (Polling + Event-Driven):**
   - Polling 6 giây một lần để đảm bảo cập nhật trạng thái mới nhất từ Bếp.
   - Kết hợp `subscribeRealtimeEvents` để refresh ngay khi Bếp đổi trạng thái đĩa món sang `COOKING`, `READY`, hoặc Waiter bấm `SERVED`.
3. **Modal Yêu Cầu Thanh Toán Đa Kênh:**
   - Cho phép khách chọn `Chuyển khoản VietQR` (`BANK_TRANSFER`), `Tiền mặt tại bàn` (`CASH`), hoặc `Quẹt thẻ POS` (`CREDIT_CARD`).
   - Gửi yêu cầu qua `customerApi.requestPayment` tạo `ServiceRequest` (loại `BILL`) thông báo đến màn hình Thu ngân POS.

---

## 6. KẾT QUẢ KIỂM THỬ BUNDLE FRONTEND
```text
vite v8.3.2 building client environment for production...
✓ 120 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                       1.35 kB │ gzip:   0.73 kB
dist/assets/roms-logo-CJQ5PwFS.svg   12.89 kB │ gzip:   4.66 kB
dist/assets/index-Duxt0tFh.css       13.86 kB │ gzip:   3.76 kB
dist/assets/index-CUG0Tkqj.js       954.79 kB │ gzip: 222.74 kB
✓ built in 373ms
```
Toàn bộ luồng khách hàng dùng bữa tại bàn đã hoàn thiện Full-stack 100%!
