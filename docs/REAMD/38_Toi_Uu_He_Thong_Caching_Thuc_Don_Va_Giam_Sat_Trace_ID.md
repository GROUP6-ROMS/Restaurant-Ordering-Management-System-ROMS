# BƯỚC 38: TỐI ƯU HÓA HỆ THỐNG, CACHING THỰC ĐƠN & GIÁM SÁT TRACE ID (GIAI ĐOẠN 5)

> **Mục tiêu:** Nâng cấp toàn diện hiệu năng và năng lực vận hành hệ thống ROMS trong giai đoạn cao điểm:
> 1. **High-Performance In-Memory Caching (Spring Cache & Caffeine):** Tối ưu hóa truy vấn Thực đơn Menu (`/api/customer/dining/menu`) và Danh mục Categories, giảm thiểu 95%+ tải đọc vào CSDL SQL Server, phản hồi trong `< 5ms`.
> 2. **Cơ chế Cache Eviction tức thì:** Tự động xóa sạch Cache (`@CacheEvict`) khi Quản lý thêm/sửa/xóa món ăn hoặc danh mục, và tự động thu hồi Cache ngay khi món ăn chạm ngưỡng hết hàng (86'd - out of stock).
> 3. **End-to-End Observability & Global Trace ID:** Triển khai `TraceIdFilter` chèn mã định danh vết `roms-xxxx` vào SLF4J `MDC` (`%X{traceId}`), gắn vào Response Header `X-Trace-Id`, tự động đưa vào `ApiResponse<T>`, giúp toàn bộ log và phản hồi client đều có thể truy vết chéo chính xác 100%.
> 4. **Giám sát Sức Khỏe Vận Hành (Spring Boot Actuator):** Xây dựng Custom Health Indicator `RestaurantOperationalHealthIndicator` cung cấp bức tranh vận hành thời gian thực tại endpoint `/actuator/health` (số bàn đang phục vụ, phiên ăn active, số món đang nấu tại Bếp).
> 5. **Frontend Error Tracing:** Frontend `axiosClient.js` tự động bắt `X-Trace-Id` từ mọi response và error, ghi log cảnh báo và sẵn sàng hiển thị mã tra cứu khi phát sinh sự cố.

---

## 1. Kiến Trúc Kỹ Thuật (Architecture & Flow)

```
[Khách Hàng Quét QR / POS / Waiter]
                │
                ▼ (HTTP Request mang hoặc tự sinh 'X-Trace-Id: roms-xxx')
     ┌────────────────────────────────────────────────────────┐
     │ 1. TraceIdFilter (Ordered.HIGHEST_PRECEDENCE)          │
     │    - Trích xuất / sinh mã traceId = "roms-" + UUID     │
     │    - Gán vào SLF4J MDC.put("traceId", traceId)         │
     │    - Gán vào Response Header "X-Trace-Id"              │
     └────────────────────────────────────────────────────────┘
                │
                ▼
     ┌────────────────────────────────────────────────────────┐
     │ 2. SecurityFilterChain (Spring Security 6)             │
     │    - Cho phép công khai: /actuator/**, /api/customer...│
     │    - Expose Headers: X-Trace-Id, Authorization         │
     └────────────────────────────────────────────────────────┘
                │
                ▼
     ┌────────────────────────────────────────────────────────┐
     │ 3. Controller & Service Caching Layer (Caffeine)       │
     │    - getCustomerMenu(): Kiểm tra Cache "customerMenu"  │
     │      + Hit: Trả về dữ liệu RAM tức thì (<5ms)          │
     │      + Miss: Đọc SQL Server -> Nạp vào RAM (TTL 60s)   │
     │    - Cập nhật Món/Danh mục/Hết hàng: @CacheEvict       │
     └────────────────────────────────────────────────────────┘
                │
                ▼
     ┌────────────────────────────────────────────────────────┐
     │ 4. ApiResponse & GlobalExceptionHandler                │
     │    - Tự động lấy MDC.get("traceId") gán vào JSON data  │
     │    - Ghi log định dạng: [timestamp] [traceId] LEVEL... │
     └────────────────────────────────────────────────────────┘
```

---

## 2. Chi Tiết Các Tệp Mã Nguồn Đã Xây Dựng & Nâng Cấp

### 2.1. Cấu hình Dependencies (`pom.xml`)
Bổ sung 3 thư viện chuẩn cho hệ thống Enterprise:
- `spring-boot-starter-cache`: Hạ tầng Cache trừu tượng hóa của Spring.
- `com.github.ben-manes.caffeine:caffeine`: Thư viện In-Memory Cache hiệu năng cao nhất hiện nay trên JVM.
- `spring-boot-starter-actuator`: Hệ thống đo kiểm và giám sát metrics, healthcheck chuẩn Production.

### 2.2. Cấu hình Cache (`CacheConfig.java`)
- **Vị trí:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/config/CacheConfig.java`
- Khởi tạo `CaffeineCacheManager` với các vùng nhớ:
  - `"customerMenu"`: Lưu cấu trúc cây danh mục và món ăn đang bán.
  - `"categories"`: Lưu danh sách danh mục phục vụ lọc nhanh.
- Thiết lập: `initialCapacity(20)`, `maximumSize(500)`, `expireAfterWrite(60, TimeUnit.SECONDS)`, `recordStats()`.

### 2.3. Bộ Lọc Định Danh Vết Toàn Cục (`TraceIdFilter.java`)
- **Vị trí:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/security/TraceIdFilter.java`
- Kế thừa `OncePerRequestFilter`, gắn `@Order(Ordered.HIGHEST_PRECEDENCE)`.
- Đọc `X-Trace-Id` từ client nếu có, hoặc tự động sinh mã dạng `roms-` + 12 ký tự ngẫu nhiên.
- Đưa vào `MDC.put("traceId", traceId)` và gắn vào header phản hồi `response.setHeader("X-Trace-Id", traceId)`.
- Khối `finally { MDC.remove("traceId"); }` dọn dẹp sạch sẽ, chống Memory Leak trong Thread Pool.

### 2.4. Nâng Cấp `ApiResponse.java` & `GlobalExceptionHandler.java`
- **`ApiResponse.java`:**
  - Bổ sung thuộc tính `private String traceId;`
  - Tự động lấy `MDC.get("traceId")` trong Constructor và các static factory method (`success`, `error`).
- **`GlobalExceptionHandler.java`:**
  - Tích hợp `@Slf4j` và `MDC`.
  - Mọi exception (AppException, Validation, 404, 403, 500) đều được log rõ ràng kèm `[TraceID: ...]`, giúp truy vết log terminal chính xác tức thì.

### 2.5. Chỉ Số Sức Khỏe Vận Hành (`RestaurantOperationalHealthIndicator.java`)
- **Vị trí:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/actuator/RestaurantOperationalHealthIndicator.java`
- Triển khai `HealthIndicator` của Spring Boot Actuator.
- Trích xuất realtime:
  - `totalTables`: Tổng số bàn kinh doanh.
  - `occupiedTables`: Số bàn đang có khách ăn.
  - `availableTables`: Số bàn trống sẵn sàng đón khách.
  - `activeDiningSessions`: Số phiên ăn đang diễn ra.
  - `cookingDishesInKitchen`: Số món ăn đang cần Bếp chế biến (`PENDING`, `COOKING`).

### 2.6. Tích Hợp `@Cacheable` và `@CacheEvict`
- **`CustomerDiningServiceImpl.java`:**
  - `@Cacheable(value = "customerMenu", key = "'active_catalog'")` trên `getCustomerMenu()`.
  - Trong `orderItems()`: Khi món ăn bị đặt đến hết hàng (`isAvailable = false`), tự động kích hoạt `cacheManager.getCache("customerMenu").clear()`.
- **`MenuServiceImpl.java`:**
  - `@Cacheable(value = "categories", key = "'all_active'")` trên `getAllCategories()`.
  - `@CacheEvict(value = {"customerMenu", "categories"}, allEntries = true)` trên các phương thức: `createMenuItem`, `updateMenuItem`, `toggleMenuItemAvailability`, `deleteMenuItem`, `createCategory`, `updateCategory`, `deleteCategory`.

### 2.7. Cấu hình Frontend Axios Client (`axiosClient.js`)
- **Vị trí:** `SourceCode/frontend/src/api/axiosClient.js`
- Response Interceptor tự động đọc header `X-Trace-Id` hoặc `data.traceId`.
- Gắn vào đối tượng `error.traceId` và ghi console warning: `[ROMS Trace: roms-xxx] Lỗi API ...`.

---

## 3. Kiểm Thử Tự Động Toàn Diện (Automated Verification)

Tạo bộ kiểm thử tự động tại `src/test/java/com/romsteam/roms/observability/ObservabilityAndCachingTest.java` bao gồm 5 kịch bản:
1. `testTraceIdFilterGeneratesNewId`: Tự động sinh `roms-xxxx` và gán vào header khi client không truyền.
2. `testTraceIdFilterPreservesClientTraceId`: Bảo toàn traceId do Client truyền lên.
3. `testApiResponsePicksUpTraceId`: Xác nhận `ApiResponse` thành công và thất bại đều chứa `traceId`.
4. `testRestaurantOperationalHealthIndicator`: Xác nhận Actuator trả về `UP` và đầy đủ các chỉ số vận hành nhà hàng.
5. `testMenuCachingAndEviction`: Xác nhận lưu cache thực đơn và xóa cache tự động khi thêm mới danh mục.

---

## 4. Hướng Dẫn Kiểm Tra Thực Tế (Verification Runbook)

### 4.1. Kiểm tra Actuator Health Endpoint
Gửi request GET:
```bash
curl -X GET http://localhost:8080/actuator/health
```
Phản hồi mẫu:
```json
{
  "status": "UP",
  "components": {
    "restaurantOperational": {
      "status": "UP",
      "details": {
        "operationalStatus": "RESTAURANT_ONLINE",
        "totalTables": 18,
        "occupiedTables": 4,
        "availableTables": 12,
        "activeDiningSessions": 4,
        "cookingDishesInKitchen": 7,
        "healthCheckTime": "2026-10-19T11:20:00"
      }
    }
  }
}
```

### 4.2. Kiểm tra Header X-Trace-Id & Format Console Log
Gửi request GET thực đơn:
```bash
curl -i -X GET http://localhost:8080/api/customer/dining/menu
```
Header trả về:
```http
HTTP/1.1 200 OK
X-Trace-Id: roms-7f8a9b1c2d3e
Content-Type: application/json
```
Console log backend tự động hiển thị:
```text
2026-10-19 11:20:15.123 [roms-7f8a9b1c2d3e] INFO  c.r.r.s.s.CustomerDiningServiceImpl - Customer accessed menu catalog
```
