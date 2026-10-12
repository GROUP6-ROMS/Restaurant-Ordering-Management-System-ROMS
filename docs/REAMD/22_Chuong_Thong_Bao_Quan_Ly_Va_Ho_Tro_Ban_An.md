# BƯỚC 22: CHUÔNG THÔNG BÁO QUẢN TRỊ TRUNG TÂM & TIẾP NHẬN YÊU CẦU HỖ TRỢ BÀN ĂN, ĐẶT BÀN MỚI (FULL-STACK)

---

## I. TỔNG QUAN & MỤC TIÊU NGHIỆP VỤ

Trong mô hình vận hành nhà hàng F&B thông minh ROMS (Restaurant Ordering Management System), Quản lý nhà hàng (Manager/Admin) cần bao quát toàn bộ hoạt động của các phân khu bàn ăn mà không phải liên tục chuyển qua lại giữa các màn hình khác nhau. 

Tính năng **Chuông Thông Báo Quản Trị Trung Tâm (Admin Notification Center)** được tích hợp trực tiếp trên Header thanh điều hướng của toàn bộ phân hệ Quản lý (`AdminLayout.jsx`), giúp Quản lý tức thì tiếp nhận 2 nhóm sự kiện quan trọng nhất theo thời gian thực:
1. **Thông báo Bàn ăn cần nhân viên hỗ trợ (`TABLE_ASSISTANCE`):**
   - Khách hàng tại bàn bấm chuông gọi phục vụ hoặc yêu cầu khăn lạnh, thêm đá (`ServiceRequest` ở trạng thái `PENDING`).
   - Hiển thị rõ số bàn, tên phân khu, nội dung yêu cầu cụ thể và thời gian khách bấm chuông.
   - Quản lý có thể nhấp **"Đã Xử Lý"** trực tiếp trên popover hoặc bấm **"Sơ Đồ Bàn"** để điều phối nhân viên phục vụ chạy bàn.
2. **Thông báo Có bàn đặt mới (`NEW_RESERVATION`):**
   - Thực khách vừa gửi yêu cầu đặt chỗ trực tuyến qua website ROMS (`Reservation` ở trạng thái `PENDING`).
   - Hiển thị đầy đủ thông tin: Tên khách hàng, Số điện thoại, Số lượng khách, Giờ & ngày hẹn, Phân khu mong muốn và Ghi chú.
   - Quản lý có thể nhấp **"Duyệt & Xếp Bàn"** $\rightarrow$ Hệ thống tự động chuyển ngay sang Sơ đồ bàn (`/admin/tables`) và kích hoạt mở Modal Xếp Bàn để Quản lý chọn bàn trống phù hợp cho khách.
3. **Cơ chế Cảnh báo Trực quan & Âm thanh:**
   - **Huy hiệu số lượng (Badge):** Hiển thị tổng số thông báo đang chờ xử lý màu đỏ nổi bật.
   - **Hiệu ứng rung chuông (Shake Animation):** Rung lắc nhẹ khi có thông báo mới phát sinh.
   - **Âm báo dịu nhẹ (Web Audio Chime):** Phát âm thanh chuông ấm áp tổng hợp qua Web Audio API (tần số 659Hz - 880Hz - 1174Hz) giúp Quản lý nhận biết ngay kể cả khi đang xem báo cáo hoặc làm việc khác.
   - **Đồng bộ thời gian thực (Real-time Polling 4s + BroadcastChannel):** Cập nhật tức thì giữa các tab trình duyệt.
   - **Nút "Test Chuông":** Hỗ trợ Quản lý kiểm tra nhanh tính năng chuông tại chỗ chỉ với 1 click.

---

## II. KIẾN TRÚC TẦNG BACKEND (SPRING BOOT 3 + RESTFUL API)

### 1. DTOs: Đối Tượng Truyền Nhận Dữ Liệu

#### A. DTO Thông Báo Chi Tiết `AdminNotificationItemResponse.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/response/AdminNotificationItemResponse.java`

```java
package com.romsteam.roms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO đại diện cho một thông báo gửi tới Quản lý nhà hàng
 * Phân loại:
 * - TABLE_ASSISTANCE: Khách tại bàn bấm chuông cần nhân viên hỗ trợ
 * - NEW_RESERVATION: Thực khách đặt bàn trực tuyến mới cần Quản lý xác nhận & xếp bàn
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminNotificationItemResponse {

    // Khóa định danh của thông báo (ví dụ: "REQ-12" hoặc "RES-5")
    private String id;

    // ID nguyên bản trong CSDL
    private Long sourceId;

    // Loại thông báo: "TABLE_ASSISTANCE" | "NEW_RESERVATION"
    private String notificationType;

    // Tiêu đề ngắn gọn hiển thị trên thông báo
    private String title;

    // Nội dung chi tiết của thông báo
    private String message;

    // Thông tin bàn ăn (nếu là thông báo bàn gọi hỗ trợ)
    private Long tableId;
    private String tableNumber;
    private String tableName;
    private String zone;
    private String zoneName;

    // Thông tin đặt bàn (nếu là thông báo đặt bàn trực tuyến)
    private Long reservationId;
    private String bookingCode;
    private String customerName;
    private String customerPhone;
    private Integer guestCount;
    private String requestedZone;
    private String requestedZoneName;
    private String reservationTime;

    // Thời gian phát sinh thông báo
    private LocalDateTime createdAt;
    private String createdAtFormatted;
    private String timeAgo;

    // Trạng thái: "PENDING"
    private String status;
}
```

#### B. DTO Tổng Hợp `AdminNotificationSummaryResponse.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/response/AdminNotificationSummaryResponse.java`

```java
package com.romsteam.roms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminNotificationSummaryResponse {

    private int totalCount;
    private int assistanceCount;
    private int reservationCount;

    private List<AdminNotificationItemResponse> items;
    private List<AdminNotificationItemResponse> assistanceItems;
    private List<AdminNotificationItemResponse> reservationItems;
}
```

#### C. DTO Khách Hàng Gọi Phục Vụ `CustomerCallWaiterRequest.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/request/CustomerCallWaiterRequest.java`

```java
package com.romsteam.roms.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerCallWaiterRequest {

    @Builder.Default
    private String requestType = "CALL_WAITER";

    private String note;
}
```

---

### 2. Service Layer: Xử Lý Logic Nghiệp Vụ

#### A. Interface `NotificationService.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/NotificationService.java`

```java
package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.CustomerCallWaiterRequest;
import com.romsteam.roms.dto.response.AdminNotificationItemResponse;
import com.romsteam.roms.dto.response.AdminNotificationSummaryResponse;

public interface NotificationService {

    AdminNotificationSummaryResponse getAdminNotifications();

    void resolveAssistanceRequest(Long requestId);

    AdminNotificationItemResponse createCustomerAssistanceRequest(Long tableId, CustomerCallWaiterRequest request);

    AdminNotificationItemResponse createTestAssistanceRequest(Long tableId, String note);
}
```

#### B. Lớp Triển Khai `NotificationServiceImpl.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/serviceImpl/NotificationServiceImpl.java`
- **Nguyên lý:**
  1. Quét bảng `service_requests` tìm các bản ghi có `status = 'PENDING'` $\rightarrow$ Ánh xạ sang các đối tượng thông báo `TABLE_ASSISTANCE`.
  2. Quét bảng `reservations` tìm các đơn đặt có `status = PENDING` $\rightarrow$ Ánh xạ sang các đối tượng thông báo `NEW_RESERVATION`.
  3. Ghép danh sách và sắp xếp theo `createdAt` mới nhất lên đầu.
  4. Hỗ trợ phương thức `formatTimeAgo()` thân thiện ("Vừa xong", "2 phút trước", "1 giờ trước").
  5. Cung cấp API `createCustomerAssistanceRequest()` để khách hàng tại bàn lưu chuông gọi thật vào CSDL.

---

### 3. Controller Layer: RESTful Endpoints

#### A. Controller Quản Lý `AdminNotificationController.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/controller/AdminNotificationController.java`
- **Endpoints:**
  - `GET /api/admin/notifications`: Lấy tổng hợp và danh sách thông báo chưa xử lý.
  - `PATCH /api/admin/notifications/assistance/{id}/resolve`: Đánh dấu đã xử lý yêu cầu hỗ trợ bàn.
  - `POST /api/admin/notifications/test-assistance`: Kích hoạt chuông thông báo thử nghiệm.

#### B. Controller Thực Khách `CustomerTableController.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/controller/CustomerTableController.java`
- **Endpoints:**
  - `POST /api/customer/tables/{id}/call`: Tiếp nhận yêu cầu gọi nhân viên hỗ trợ từ bàn ăn.

---

## III. GIAO DIỆN FRONTEND (REACT + VITE + TAILWIND/CSS)

### 1. API Client `notificationApi.js`
- **File:** `SourceCode/frontend/src/api/notificationApi.js`

```javascript
import axiosClient from './axiosClient';

export const notificationApi = {
  getAdminNotifications: () => axiosClient.get('/admin/notifications'),
  resolveAssistance: (requestId) => axiosClient.patch(`/admin/notifications/assistance/${requestId}/resolve`),
  createTestAssistance: (data) => axiosClient.post('/admin/notifications/test-assistance', data || {}),
  customerCallWaiter: (tableId, data) => axiosClient.post(`/customer/tables/${tableId}/call`, data || {})
};
```

---

### 2. Component Chuông Thông Báo `NotificationBell.jsx`
- **File:** `SourceCode/frontend/src/components/common/NotificationBell.jsx`
- **Điểm nổi bật:**
  - **Tích hợp Web Audio API Synthesizer:** Tự động phát âm báo hai tần số hài hòa khi xuất hiện thông báo mới.
  - **Animation rung chuông (Keyframe Shake):** Rung chuông 0.75s khi có thông báo mới.
  - **Dropdown Popover đa tính năng:**
    - Tab "Tất Cả", "Cần Hỗ Trợ", "Bàn Đặt Mới" kèm huy hiệu đếm số lượng.
    - Nút "Test Chuông" để kiểm tra tính năng ngay lập tức.
    - Nút "Làm mới" với hiệu ứng xoay tròn.
    - Với bàn gọi hỗ trợ: Hiển thị bàn, khu vực, lý do gọi, nút "Đã Xử Lý" (xử lý tức thì) và nút "Sơ Đồ Bàn".
    - Với đơn đặt bàn: Hiển thị tên khách, SĐT, số khách, giờ hẹn, nút "Duyệt & Xếp Bàn" (điều hướng sang sơ đồ bàn và tự động mở modal duyệt).
  - **Đồng bộ thời gian thực:** Polling ngầm mỗi 4 giây và kết nối `subscribeRealtimeEvents` qua `BroadcastChannel`.

---

### 3. Tích Hợp Vào Header Quản Trị `AdminLayout.jsx`
- **File:** `SourceCode/frontend/src/components/layout/AdminLayout.jsx`
- **Vị trí:** Đặt tại Header bên cạnh đồng hồ và profile người dùng, xuất hiện xuyên suốt mọi trang:
  - `/admin/reports` (Báo Cáo & Vận Hành)
  - `/admin/tables` (Sơ Đồ Bàn & Khu Vực)
  - `/admin/menu` (Thực Đơn & Món Ăn)
  - `/admin/staff` (Nhân Sự & Phân Ca)

---

### 4. Kết Nối Thực Tế Tại Phía Khách Hàng
- **`CustomerMenuPage.jsx`:** Nút "Gọi phục vụ" gọi API `notificationApi.customerCallWaiter()` và phát sự kiện `broadcastRealtimeEvent({ type: 'CALL_WAITER' })`.
- **`CustomerTrackingPage.jsx`:** Cả 2 nút "Gọi phục vụ" và "Thêm Đá, Khăn lạnh" đều gửi yêu cầu trực tiếp vào CSDL và kích hoạt chuông của Quản lý tức thì.

---

## IV. QUY TRÌNH KIỂM THỬ (TESTING WORKFLOW)

1. **Khởi chạy ứng dụng:**
   - Backend Spring Boot chạy trên cổng `8080`.
   - Frontend React chạy trên cổng `5173`.
2. **Kịch bản 1: Kiểm tra Bàn gọi hỗ trợ:**
   - Mở giao diện Quản lý tại `http://localhost:5173/admin/tables` hoặc `/admin/reports`.
   - Bấm nút chuông trên Header $\rightarrow$ Nhấp nút **"Test Chuông"** (hoặc mở tab khách hàng tại `http://localhost:5173/dining/menu` và bấm "Gọi phục vụ").
   - **Kết quả:** Chuông Quản trị rung nhẹ, phát âm thanh chime và hiển thị badge đỏ. Danh sách hiển thị ngay "Bàn T01 cần hỗ trợ".
   - Bấm nút **"Đã Xử Lý"** $\rightarrow$ Yêu cầu biến mất khỏi danh sách và số lượng giảm về 0.
3. **Kịch bản 2: Kiểm tra Đơn đặt bàn mới:**
   - Mở trang đặt bàn khách hàng tại `http://localhost:5173/reservation` và gửi 1 phiếu đặt bàn mới.
   - **Kết quả:** Chuông Quản trị lập tức nhảy thông báo "Đơn đặt bàn mới: [Tên khách]".
   - Nhấp nút **"Duyệt & Xếp Bàn"** $\rightarrow$ Hệ thống điều hướng ngay tới Sơ đồ bàn và tự động mở Modal Xếp Bàn cho Quản lý chọn bàn trống.

---

*Tài liệu hoàn thiện 100% Full-Stack, đồng bộ kiến trúc giữa Backend và Frontend ROMS.*
