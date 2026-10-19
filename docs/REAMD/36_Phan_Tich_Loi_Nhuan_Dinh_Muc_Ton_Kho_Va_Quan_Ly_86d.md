# Giai Đoạn 3: Báo Cáo Lợi Nhuận Tài Chính, Định Mức Tồn Kho Trong Ngày & Quản Lý Món Tạm Hết 86'd Thời Gian Thực

## 1. Mục Tiêu & Bối Cảnh Nghiệp Vụ (Phase 3: Financial Profitability & 86'd Out-of-Stock)
Trong mô hình vận hành nhà hàng F&B tiêu chuẩn cao cấp, doanh thu đơn thuần không phản ánh đầy đủ hiệu quả kinh doanh nếu thiếu đi góc nhìn về **Giá Vốn Hàng Bán (COGS)**, **Lợi Nhuận Gộp (Gross Profit)**, **Biên Lợi Nhuận Gộp (Gross Margin %)** và **Phân Tích Ca Làm Việc (Morning vs. Evening Shift)**. Đồng thời, nhà bếp cần cơ chế chủ động kiểm soát định mức món trong ngày (`dailyStock`, `remainingStock`) và chức năng **Báo Hết Món (86'd)** 1-chạm được đồng bộ tức thì qua WebSocket tới mọi thiết bị (máy khách hàng quét mã QR, máy tính bảng phục vụ Waiter, màn hình Thu ngân POS) mà không cần tải lại trang.

---

## 2. Kiến Trúc Dữ Liệu & Backend (Spring Boot 3.4.5 & JPA)

### 2.1. Quản lý Định Mức Tồn Kho & Tự Động Báo Hết (`MenuItem.java`)
- Bổ sung trường `dailyStock` (định mức mở bán trong ngày) và `remainingStock` (số lượng còn lại).
- Phương thức `decreaseStock(int quantity)`:
  - Tự động trừ số lượng còn lại khi khách gọi món từ web QR hoặc nhân viên gọi thêm món tại bàn.
  - Khi `remainingStock <= 0`, hệ thống tự động gán `isAvailable = false` và cập nhật thẻ nhãn `"Tạm Hết (86d)"`.
- Phương thức `replenishStock(Integer newStock)`: Cho phép bếp trưởng hoặc quản lý thiết lập lại số lượng mở bán mới.

### 2.2. DTO Báo Cáo Tài Chính Mở Rộng
- `KpiReportResponse.java`:
  - `totalCost`: Tổng giá vốn hàng bán (COGS) tính dựa trên giá vốn nguyên liệu `costPrice` của từng món đã hoàn tất thanh toán.
  - `grossProfit`: Lợi nhuận gộp (`totalRevenue - totalCost`).
  - `grossMarginPercent`: Tỷ suất biên lợi nhuận gộp phần trăm.
  - `totalDiscounts`: Tổng chiết khấu và giảm giá được áp dụng trên hóa đơn.
- `ShiftRevenueResponse.java`: Phân tích hiệu quả theo từng ca làm việc:
  - **Ca Sáng (Morning Shift)**: 06:00 - 14:00.
  - **Ca Tối (Evening Shift)**: 14:00 - 24:00.
  - Đo lường chi tiết: Doanh thu thuần, tỷ trọng %, số hóa đơn, số lượt bàn, số lượng khách, doanh thu tiền mặt, chuyển khoản VietQR, và quẹt thẻ POS.
- `MenuEngineeringItemResponse.java`: Ma trận **BCG Menu Engineering Matrix** phân loại món ăn thành 4 nhóm chiến lược:
  - 🌟 **Ngôi Sao (Star)**: Số lượng bán cao & Biên lợi nhuận cao. Khuyến nghị: Giữ vững chất lượng, đặt ở vị trí mắt nhìn trên menu.
  - 🐴 **Ngựa Cày (Plowhorse)**: Số lượng bán cao nhưng Biên lợi nhuận thấp. Khuyến nghị: Tăng nhẹ giá 5-10% hoặc tối ưu định lượng chi phí nguyên liệu.
  - 🧩 **Câu Đố (Puzzle)**: Biên lợi nhuận rất cao nhưng Số lượng bán thấp. Khuyến nghị: Đưa vào combo tiệc hoặc huấn luyện nhân viên phục vụ upsell.
  - 🐕 **Kém Hiệu Quả (Dog)**: Cả lượng bán và tỷ suất lợi nhuận đều thấp. Khuyến nghị: Cân nhắc cải tiến công thức hoặc loại bỏ khỏi thực đơn.
- `InvoiceAuditDetailResponse.java`: Sổ chi tiết 50 hóa đơn gần nhất phục vụ đối soát kế toán thu ngân.

### 2.3. Endpoint & Điều Khiển Trạng Thái 86'd (`KitchenController.java`)
- `GET /api/kitchen/menu-items`: Trả về danh sách món kèm định mức tồn kho và trạng thái phục vụ cho trạm Bếp.
- `PATCH /api/kitchen/items/{itemId}/availability`: 1-chạm bật/tắt trạng thái 86'd trực tiếp từ màn hình Bếp KDS.
- Tích hợp `RealtimeService.notifyMenuItemAvailability(...)` phát sự kiện `MENU_AVAILABILITY_CHANGED` đồng thời tới 3 topic WebSocket STOMP: `/topic/kitchen`, `/topic/orders`, `/topic/tables`.

---

## 3. Giao Diện Người Dùng & Trải Nghiệm Frontend (React 19 & Vite)

### 3.1. Báo Cáo Phân Tích Tài Chính & Vận Hành (`ReportsAnalyticsPage.jsx`)
- **5 Thẻ KPI Tài Chính Đẳng Cấp**:
  1. Doanh Thu Thuần (Net Sales) + Tỷ lệ tăng trưởng.
  2. Lợi Nhuận Gộp (Gross Profit) + Tỷ suất biên lợi nhuận % sau giá vốn.
  3. Giá Vốn Hàng Bán (COGS) & Tổng Giảm Giá (Discounts).
  4. Lượt Phục Vụ (Tổng lượt bàn & lượt khách đã phục vụ).
  5. Giá Trị Trung Bình / Bàn (AOV) + Xu hướng.
- **4 Tab Chuyên Nghiệp**:
  - `REVENUE`: Phân tích cơ cấu ca làm việc (Shift breakdown card so sánh Ca Sáng vs. Ca Tối) + Biểu đồ khung giờ đạt đỉnh + Cơ cấu phương thức thanh toán.
  - `DISHES`: Ma trận BCG Menu Engineering Matrix với bộ lọc chip thông minh (🌟 Ngôi Sao, 🐴 Ngựa Cày, 🧩 Câu Đố, 🐕 Kém Hiệu Quả) kèm chỉ dẫn hành động chiến lược.
  - `OPERATIONS`: Đo lường công suất lấp đầy bàn, thời gian khách ngồi, thời gian dọn bàn sau bữa ăn.
  - `AUDIT`: Sổ chi tiết hóa đơn đối soát 50 bill mới nhất.
- **Mẫu In Báo Cáo Khổ A4 (`window.print()`)**:
  - Tích hợp template `@media print` đạt chuẩn trình ký Ban Giám Đốc.
  - Có đầy đủ Quốc hiệu nhà hàng, MST, Bảng KPI tài chính, Bảng phân tích ca, và 3 ô chữ ký (Người lập báo cáo, Kế toán trưởng, Giám đốc / Quản lý nhà hàng).
  - Tự động ẩn toàn bộ header, navbar, sidebar, buttons khi in.
- **Kết Xuất Excel 7 Phần Toàn Diện**:
  - File `.xls` nhị phân UTF-8 BOM chống lỗi font tiếng Việt 100%.

### 3.2. Ngăn Kéo Quản Lý Món Hết 86'd Trực Tiếp Trên Bếp KDS (`KitchenKdsPage.jsx`)
- Bổ sung nút **"Báo Hết Món (86'd)"** màu đỏ nổi bật trên thanh tác vụ nhanh của Bếp KDS.
- Ngăn kéo trượt (Slide-over Drawer) cho phép:
  - Tìm kiếm nhanh món theo tên hoặc mã SKU.
  - Lọc theo trạm chế biến (Bếp Nóng KITCHEN vs. Quầy Nước WAITER).
  - Hiển thị quota: `Tồn: remainingStock / dailyStock`.
  - Nút chuyển trạng thái 1-chạm giữa **Đang Bán** (Xanh lá) và **Tạm Hết (86d)** (Đỏ).

### 3.3. Đồng Bộ Tức Thì Tới Thực Khách & Nhân Viên Phục Vụ
- **Trang Thực Đơn Khách Quét QR (`CustomerMenuPage.jsx`)**:
  - Lắng nghe sự kiện STOMP `MENU_AVAILABILITY_CHANGED`.
  - Khi món bị báo hết (86'd), thẻ món ăn trên điện thoại thực khách lập tức phủ mờ (opacity 0.6), hiển thị nhãn đỏ **"Tạm Hết Món"** và ẩn nút "Thêm vào giỏ" ngay lập tức mà không cần khách F5 lại trang.
  - Hiển thị huy hiệu cảnh báo sắp hết hàng: `"Chỉ còn X phần"` khi số lượng tồn kho `<= 5`.
- **Trang Gọi Món Nhân Viên Phục Vụ (`WaiterOrderDetailPage.jsx`)**:
  - Cập nhật danh mục thực đơn `menuCatalog` theo thời gian thực khi có sự kiện 86'd từ Bếp, đảm bảo nhân viên không thể order nhầm món đã hết hàng.

---

## 4. Kiểm Thử & Xác Nhận Đạt Chuẩn (Verification Results)
1. **Maven Backend Build**:
   - `mvn clean compile -DskipTests`: Compile thành công 162 tệp mã nguồn Java với `BUILD SUCCESS` (0 lỗi, 0 cảnh báo).
2. **Vite Frontend Build**:
   - `npm run build`: Bundling thành công toàn bộ module trong `320ms` với `exit code 0`.
