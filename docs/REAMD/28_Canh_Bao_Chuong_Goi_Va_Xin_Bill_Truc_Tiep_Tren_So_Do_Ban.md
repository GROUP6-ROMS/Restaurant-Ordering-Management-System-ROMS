# BƯỚC 28: CẢNH BÁO CHUÔNG GỌI PHỤC VỤ & YÊU CẦU THANH TOÁN TRỰC TIẾP TRÊN THẺ BÀN ĂN (FULL-STACK)

---

## I. TỔNG QUAN & MỤC TIÊU NGHIỆP VỤ

Trong vận hành nhà hàng F&B giờ cao điểm, Quản lý nhà hàng (Floor Manager) thường xuyên quan sát toàn bộ sảnh ăn qua màn hình **Sơ đồ bàn (`/admin/tables`)**. Khi thực khách tại bàn quét mã QR bấm:
- **"Gọi phục vụ"**, **"Xin thêm đá"**, **"Xin thêm nước"**, **"Yêu cầu dọn bàn"**
- Hoặc **"Yêu cầu thanh toán" (Xin bill)**

Nếu các yêu cầu này chỉ xuất hiện ở chuông chung trên Header, Quản lý phải click mở popover mới biết được, dẫn đến việc khó bao quát ngay bàn nào ở phân khu nào đang cần hỗ trợ khẩn cấp.

**Tính năng Cảnh Báo Chuông Gọi & Xin Bill Trực Tiếp Trên Thẻ Bàn** giải quyết triệt để vấn đề này với các mục tiêu:
1. **Hiệu ứng thị giác trực tiếp trên mặt Thẻ Bàn (Visual Table Card Alerts):**
   - **Thẻ bàn nhấp nháy viền nổi bật (Pulsing Glow Animation):**
     - Viền màu cam (`#F59E0B`) cho các yêu cầu Gọi phục vụ, xin đá, xin nước.
     - Viền màu tím (`#8B5CF6`) cho yêu cầu Thanh toán (Xin bill).
   - **Hộp thông báo động ngay trên thẻ bàn (Alert Box):**
     - Icon nhận diện loại yêu cầu (`notifications_active`, `payments`, `ac_unit`, `water_drop`...).
     - Tiêu đề ngắn gọn: *"Khách yêu cầu tính tiền"*, *"Khách xin thêm đá"*, *"Khách gọi phục vụ"*.
     - Ghi chú cụ thể của khách (nếu có) và thời gian trôi qua (*"2 phút trước"*, *"Lúc 19:15"*).
     - Badge số lượng nếu bàn có nhiều hơn 1 yêu cầu (`+1`, `+2`).
2. **Nút Thao Tác 1-Click "Đã Xong" Tại Thẻ Bàn:**
   - Quản lý sau khi điều phối nhân viên phục vụ hoặc xác nhận xong có thể bấm nút **"Đã xong"** trực tiếp trên thẻ bàn.
   - Hệ thống tự động chuyển trạng thái `ServiceRequest` từ `PENDING` sang `RESOLVED`. Chuông tắt, thẻ bàn lập tức trở về trạng thái bình thường.
3. **Banner Cảnh Báo Tổng Hợp & Lọc Riêng Các Bàn Cần Hỗ Trợ:**
   - Xuất hiện banner đầu trang: *"Có X bàn ăn đang gửi chuông gọi phục vụ / yêu cầu thanh toán!"*.
   - Nút bấm **"Lọc riêng các bàn này"** (tương ứng tùy chọn `statusFilter = 'ALERT'`) giúp Quản lý lọc tức thì các bàn cần can thiệp trong tích tắc.
4. **Đồng Bộ Thời Gian Thực Đa Kênh (<5ms):**
   - Kết hợp Polling nền 6 giây với `BroadcastChannel` và `localStorage StorageEvent` (`subscribeRealtimeEvents`), đảm bảo ngay khi khách bấm chuông tại điện thoại, thẻ bàn trên màn hình Quản lý nhấp nháy ngay lập tức mà không cần reload trang.

---

## II. KIẾN TRÚC TẦNG BACKEND (SPRING BOOT 3 + RESTFUL API)

### 1. Nâng Cấp DTO `TableResponse.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/response/TableResponse.java`
- Bổ sung 6 trường thông tin về yêu cầu hỗ trợ thời gian thực:

```java
    // Thông tin chuông gọi phục vụ / yêu cầu thanh toán PENDING (nếu có)
    private Long pendingServiceRequestId;
    private String pendingServiceRequestType;        // "CALL_WAITER", "BILL", "REQUEST_ICE", etc.
    private String pendingServiceRequestNote;        // Ghi chú yêu cầu của khách
    private String pendingServiceRequestCreatedAt;   // Giờ tạo yêu cầu "19:05"
    private Long pendingServiceRequestElapsedMinutes;// Số phút đã trôi qua kể từ khi khách bấm chuông
    private Integer pendingServiceRequestCount;      // Tổng số yêu cầu đang chờ xử lý của bàn
```

---

### 2. Interface Nghiệp Vụ `RestaurantTableService.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/RestaurantTableService.java`
- Khai báo 2 phương thức xử lý yêu cầu phục vụ cho Quản lý:

```java
    // 9. Quản lý xác nhận đã xử lý chuông gọi phục vụ
    void resolveServiceRequest(Long requestId);

    // 10. Quản lý xác nhận đã xử lý toàn bộ chuông gọi của 1 bàn
    void resolveAllRequestsForTable(Long tableId);
```

---

### 3. Triển Khai Nghiệp Vụ `RestaurantTableServiceImpl.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/serviceImpl/RestaurantTableServiceImpl.java`
- Inject `ServiceRequestRepository`.
- Trong hàm `mapToTableResponse(RestaurantTable table)`: Quét danh sách `ServiceRequest` ở trạng thái `PENDING` của bàn và đóng gói vào `TableResponse`:

```java
        // Kiểm tra xem bàn có yêu cầu phục vụ / xin tính tiền đang PENDING không
        Long pendingServiceRequestId = null;
        String pendingServiceRequestType = null;
        String pendingServiceRequestNote = null;
        String pendingServiceRequestCreatedAt = null;
        Long pendingServiceRequestElapsedMinutes = 0L;
        Integer pendingServiceRequestCount = 0;

        List<ServiceRequest> pendingRequests = serviceRequestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(table.getId(), "PENDING");
        if (pendingRequests != null && !pendingRequests.isEmpty()) {
            pendingServiceRequestCount = pendingRequests.size();
            ServiceRequest latestReq = pendingRequests.get(0);
            pendingServiceRequestId = latestReq.getId();
            pendingServiceRequestType = latestReq.getRequestType();
            pendingServiceRequestNote = latestReq.getNote();
            if (latestReq.getCreatedAt() != null) {
                pendingServiceRequestCreatedAt = latestReq.getCreatedAt().format(DateTimeFormatter.ofPattern("HH:mm"));
                pendingServiceRequestElapsedMinutes = Math.max(0, java.time.Duration.between(latestReq.getCreatedAt(), LocalDateTime.now()).toMinutes());
            }
        }
```

- Triển khai 2 phương thức hoàn tất yêu cầu:

```java
    @Override
    @Transactional
    public void resolveServiceRequest(Long requestId) {
        ServiceRequest req = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu phục vụ không tồn tại với ID: " + requestId));
        req.setStatus("RESOLVED");
        serviceRequestRepository.save(req);
    }

    @Override
    @Transactional
    public void resolveAllRequestsForTable(Long tableId) {
        List<ServiceRequest> pendingRequests = serviceRequestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(tableId, "PENDING");
        for (ServiceRequest req : pendingRequests) {
            req.setStatus("RESOLVED");
            serviceRequestRepository.save(req);
        }
    }
```

---

### 4. Controller API `AdminTableController.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/controller/AdminTableController.java`
- Bổ sung 2 endpoint chuẩn REST cho phân hệ Quản lý:

```java
    // 9. PATCH /api/admin/tables/requests/{id}/resolve - Quản lý xác nhận đã xử lý chuông gọi phục vụ
    @PatchMapping("/requests/{id}/resolve")
    public ResponseEntity<ApiResponse<Void>> resolveServiceRequest(@PathVariable Long id) {
        tableService.resolveServiceRequest(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xử lý xong yêu cầu tại bàn!"));
    }

    // 10. PATCH /api/admin/tables/{tableId}/resolve-all-requests - Quản lý xác nhận xử lý toàn bộ yêu cầu của bàn
    @PatchMapping("/{tableId}/resolve-all-requests")
    public ResponseEntity<ApiResponse<Void>> resolveAllRequestsForTable(@PathVariable Long tableId) {
        tableService.resolveAllRequestsForTable(tableId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xử lý xong toàn bộ yêu cầu của bàn!"));
    }
```

---

## III. KIẾN TRÚC TẦNG FRONTEND (REACT VITE)

### 1. Service API `tableApi.js`
- **File:** `SourceCode/frontend/src/api/tableApi.js`
- Bổ sung các hàm gọi API xử lý chuông:

```javascript
    // Quản lý xác nhận đã xử lý chuông gọi phục vụ
    resolveServiceRequest: (requestId) => {
        return axiosClient.patch(`/admin/tables/requests/${requestId}/resolve`);
    },

    // Quản lý xử lý toàn bộ chuông gọi của 1 bàn
    resolveAllTableRequests: (tableId) => {
        return axiosClient.patch(`/admin/tables/${tableId}/resolve-all-requests`);
    },
```

---

### 2. Giao Diện Sơ Đồ Bàn Quản Lý `TableManagementPage.jsx`
- **File:** `SourceCode/frontend/src/pages/admin/TableManagementPage.jsx`

#### A. Đăng ký nhận sự kiện Realtime & Bộ lọc bàn gọi chuông:
```javascript
  // Lắng nghe sự kiện đồng bộ thời gian thực từ chuông gọi phục vụ, xin thanh toán và đơn món
  useEffect(() => {
    const unsubscribe = subscribeRealtimeEvents((event) => {
      if (
        event?.type === 'CALL_WAITER' ||
        event?.type === 'PAYMENT_REQUEST' ||
        event?.type === 'SERVICE_REQUEST_RESOLVED' ||
        event?.type === 'TABLE_UPDATE' ||
        event?.type === 'NEW_ORDER_CREATED'
      ) {
        loadData(true);
      }
    });
    return unsubscribe;
  }, []);

  // Danh sách các bàn đang có chuông gọi phục vụ hoặc yêu cầu thanh toán PENDING
  const tablesWithAlert = tables.filter(t => (t.pendingServiceRequestCount && t.pendingServiceRequestCount > 0) || !!t.pendingServiceRequestId);
```

#### B. CSS Keyframe Animations Nhấp Nháy:
```jsx
      <style>{`
        @keyframes romsPulseService {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.5); }
          50% { box-shadow: 0 0 16px 4px rgba(245, 158, 11, 0.35); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.5); }
        }
        @keyframes romsPulseBill {
          0% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.5); }
          50% { box-shadow: 0 0 16px 4px rgba(124, 58, 237, 0.35); }
          100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.5); }
        }
      `}</style>
```

#### C. Thẻ Bàn Ăn Nhấp Nháy & Nút Bấm Xử Lý:
```jsx
{hasAlert && alertConfig && (
  <div
    style={{
      background: alertConfig.badgeBg,
      border: `1.5px solid ${alertConfig.badgeBorder}`,
      borderRadius: '12px',
      padding: '8px 10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
      <div style={{
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: alertConfig.badgeColor,
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
      }}>
        <Icon name={alertConfig.icon} size={18} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: '0.78rem',
          fontWeight: 800,
          color: alertConfig.badgeColor,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>{alertConfig.title}</span>
          {t.pendingServiceRequestCount > 1 && (
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: '8px',
              background: alertConfig.badgeColor,
              color: '#FFFFFF'
            }}>
              +{t.pendingServiceRequestCount - 1}
            </span>
          )}
        </div>
        <div style={{
          fontSize: '0.72rem',
          color: '#4B5563',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginTop: '1px'
        }}>
          {t.pendingServiceRequestNote
            ? t.pendingServiceRequestNote
            : (t.pendingServiceRequestElapsedMinutes > 0
                ? `${t.pendingServiceRequestElapsedMinutes} phút trước`
                : (t.pendingServiceRequestCreatedAt ? `Lúc ${t.pendingServiceRequestCreatedAt}` : 'Vừa gọi'))
          }
        </div>
      </div>
    </div>

    <button
      type="button"
      onClick={(e) => handleResolveServiceRequest(t, e)}
      title="Xác nhận đã xử lý xong yêu cầu này"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '5px 9px',
        borderRadius: '8px',
        background: alertConfig.btnBg,
        color: '#FFFFFF',
        border: 'none',
        fontSize: '0.72rem',
        fontWeight: 800,
        cursor: 'pointer',
        flexShrink: 0,
        boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
        transition: 'all 0.15s ease'
      }}
    >
      <Icon name="check" size={13} />
      Đã xong
    </button>
  </div>
)}
```

---

### 3. Phân Hệ Thực Khách (Customer Dining): Tách Biệt Nút "Xin Đá" & "Gọi Phục Vụ"

Để giảm thiểu hiểu lầm và giúp nhà hàng phân công chính xác công việc (phụ bàn mang đá, quản lý/waiter giải đáp thắc mắc), hệ thống đã tách rời hoàn toàn nút **"Xin đá"** và **"Gọi nhân viên"** trên các màn hình của khách hàng:

#### A. Trang Thực Đơn Gọi Món (`CustomerMenuPage.jsx`):
- Tại thanh tiêu đề bàn ăn (Table Header Bar), thay vì 1 nút gọi phục vụ đơn điệu, hệ thống bố trí **2 nút bấm riêng biệt kiểu Pill button sang trọng**:
  - 🧊 **`[ Xin đá ]`**: Trực tiếp gửi yêu cầu với mã `REQUEST_ICE`, ghi chú mặc định *"Khách xin thêm đá lạnh"*.
  - 🛎️ **`[ Gọi phục vụ ]`**: Gửi yêu cầu với mã `CALL_WAITER`, ghi chú *"Khách gọi nhân viên hỗ trợ"*.
- Cả hai nút đều có trạng thái loading độc lập, hiệu ứng nhấn nảy (`active:scale-95`) và thông báo Toast xác nhận sau khi gửi.

#### B. Trang Theo Dõi Tiến Độ Món Ăn (`CustomerTrackingPage.jsx`):
- Thanh hỗ trợ nhanh (Quick Assistance Bar) phân tách thành 2 nút bấm thao tác nhanh:
  - 🧊 **"Xin thêm đá"** (`REQUEST_ICE`)
  - 🛎️ **"Gọi nhân viên"** (`CALL_WAITER`)

#### C. Menu Trợ Giúp Nhanh Trên Header Chung (`CustomerLayout.jsx`):
- Khi thực khách nhấn vào biểu tượng **Chuông hỗ trợ** ở góc trên phải Header, giao diện kích hoạt **Bottom Action Sheet Modal** với 4 lựa chọn tức thì:
  1. 🧊 **Xin thêm đá** (`REQUEST_ICE`)
  2. 🛎️ **Gọi nhân viên** (`CALL_WAITER`)
  3. 💧 **Nước lọc / Khăn lạnh** (`CALL_WATER`)
  4. 🥢 **Chén đĩa / Đũa muỗng** (`REQUEST_CUTLERY`)
- Khi thực khách chọn bất kỳ mục nào, hệ thống gọi API `customerApi.callWaiter`, đồng thời phát tán sự kiện thời gian thực `CALL_WAITER` qua `BroadcastChannel` và `localStorage`, kích hoạt thẻ bàn trên màn hình Quản lý nhấp nháy tức thì.

---

## IV. QUY TRÌNH KIỂM THỬ (TESTING & VERIFICATION)

1. **Khách hàng bấm chuông tại bàn:**
   - Mở màn hình khách gọi món `http://localhost:5173/dining/menu?table=1&token=...`.
   - Bấm nút **"Gọi phục vụ"** $\rightarrow$ chọn *"Xin thêm đá"* hoặc bấm **"Yêu cầu thanh toán"** $\rightarrow$ chọn *"Tiền mặt"*.
2. **Kiểm tra phản hồi trên màn hình Quản lý (`/admin/tables`):**
   - Không cần reload trang, Thẻ Bàn T1-01 lập tức **nhấp nháy viền cam/tím**, hiển thị hộp cảnh báo *"Khách xin thêm đá"* hoặc *"Khách yêu cầu tính tiền"*.
   - Xuất hiện Banner cảnh báo đầu trang: *"Có 1 bàn ăn đang gửi chuông gọi phục vụ / yêu cầu thanh toán!"*.
   - Dropdown trạng thái hiển thị thêm mục: `🔔 Bàn cần hỗ trợ / Xin bill (1)`.
3. **Thao tác xử lý 1-click:**
   - Quản lý nhấp nút **"Đã xong"** ngay trên Thẻ Bàn.
   - Thẻ bàn tắt nhấp nháy, hộp cảnh báo biến mất, toast thông báo *"Đã xử lý xong yêu cầu hỗ trợ cho bàn T1-01!"*, sự kiện `SERVICE_REQUEST_RESOLVED` được đồng bộ sang tất cả các màn hình khác.
