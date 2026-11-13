# ROMS — Restaurant Ordering Management System
## Hệ Thống Quản Lý & Gọi Món Nhà Hàng Thông Minh (Real-Time At-Table QR Ordering & Online Table Reservation)

[![Spring Boot 3.4.5](https://img.shields.io/badge/Spring_Boot-3.4.5-brightgreen.svg?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java 21 LTS](https://img.shields.io/badge/Java-21_LTS-orange.svg?logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![React 19](https://img.shields.io/badge/React-19-blue.svg?logo=react&logoColor=white)](https://react.dev/)
[![Vite 8](https://img.shields.io/badge/Vite-8-purple.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![MS SQL Server 2022](https://img.shields.io/badge/Database-MS_SQL_Server_2022-red.svg?logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)
[![Docker Compose](https://img.shields.io/badge/Deploy-Docker_Compose-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF.svg?logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![Unit & Integration Tests](https://img.shields.io/badge/JUnit_5-81%2F81_Passed-success.svg?logo=junit5&logoColor=white)](https://junit.org/)
[![License MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> 🎓 **Đồ án Tốt nghiệp / Môn học:** SWP391 — Software Development Project  
> 🏛️ **Học kỳ:** Fall 2026 | **Đại học FPT Cần Thơ**  
> 🌐 **Môi trường Live Production:** [http://roms-restaurant.duckdns.org/](http://roms-restaurant.duckdns.org/) *(IP VPS: `222.255.184.250`)*  
> 🩺 **Hệ Thống Giám Sát Realtime (Health Metric):** [http://roms-restaurant.duckdns.org/actuator/health](http://roms-restaurant.duckdns.org/actuator/health)

---

## 📑 Mục Lục Điều Hướng (Table of Contents)
- [1. Danh Sách Thành Viên & Phân Công](#-1-danh-sách-thành-viên--phân-công)
- [2. Giới Thiệu Dự Án & Vấn Đề Giải Quyết](#-2-giới-thiệu-dự-án--vấn-đề-giải-quyết)
- [3. Các Phân Hệ Chức Năng Cốt Lõi (Core Modules)](#-3-các-phân-hệ-chức-năng-cốt-lõi-core-modules)
- [4. Kiến Trúc Kỹ Thuật Chuyên Sâu (Deep Technical Highlights)](#-4-kiến-trúc-kỹ-thuật-chuyên-sâu-deep-technical-highlights)
- [5. Sơ Đồ Thiết Kế Hệ Thống (Architecture & Diagrams)](#-5-sơ-đồ-thiết-kế-hệ-thống-architecture--diagrams)
- [6. Ngăn Xếp Công Nghệ (Technology Stack)](#-6-ngăn-xếp-công-nghệ-technology-stack)
- [7. Hướng Dẫn Cài Đặt & Khởi Chạy (Local Setup)](#-7-hướng-dẫn-cài-đặt--khởi-chạy-local-setup)
- [8. Tài Khoản Trực Ca Thử Nghiệm (Demo Accounts)](#-8-tài-khoản-trực-ca-thử-nghiệm-demo-accounts)
- [9. Kiểm Thử Tự Động & Đảm Bảo Chất Lượng (QA & Testing)](#-9-kiểm-thử-tự-động--đảm-bảo-chất-lượng-qa--testing)
- [10. Pipeline CI/CD & Hạ Tầng Cloud VPS](#-10-pipeline-cicd--hạ-tầng-cloud-vps)
- [11. Cam Kết Học Thuật & Đánh Giá Chuẩn SWP391](#-11-cam-kết-học-thuật--đánh-giá-chuẩn-swp391)

---

## 👥 1. Danh Sách Thành Viên & Phân Công

| STT | Họ và Tên | Mã Sinh Viên | Vai Trò | Trách Nhiệm Kỹ Thuật Chính | GitHub Handle |
|:---:|---|:---:|:---:|---|:---:|
| **1** | **Dương Trong** | **DE200109** | **Team Leader** | • Kiến trúc Full-Stack, Thiết kế Database Relational & Migration DDL.<br>• Kiểm soát Concurrency: Pessimistic Write Lock, Idempotency Guards.<br>• Phân quyền RBAC Stateless JWT & Bảo mật Staff PIN BCrypt.<br>• Tích hợp Cổng thanh toán VietQR PayOS Webhook & CI/CD Cloud VPS. | [`@duogtrog06tk`](https://github.com/duogtrog06tk) |
| **2** | **Phạm Minh Đức** | **DE200053** | **Backend Lead** | • Xây dựng nghiệp vụ Quản lý Thực đơn (Menu Management & Daily Stock).<br>• Phân hệ Thu ngân POS, Đối soát két tiền & Chốt ca (*Shift Settlement*).<br>• Tối ưu bộ nhớ đệm In-memory Caching Caffeine (<5ms latency).<br>• Báo cáo Doanh thu & Thống kê tài chính (*Reports & BI Analytics*). | [`@ducminh14-cmd`](https://github.com/ducminh14-cmd) |
| **3** | **Ngô Viết Bảo Huy** | **DE200066** | **Frontend & QA Lead** | • Xây dựng Giao diện Điều phối Bếp KDS & Trạm Phục Vụ Waiter Mobile.<br>• Hệ thống Chuông Gọi Phục Vụ & WebSocket STOMP Event Bus.<br>• Tích hợp Trợ lý Gọi món AI (*ROMS Bot Multi-Model Failover*).<br>• Bộ kiểm thử tự động 81/81 Test Cases (JUnit 5, Mockito, Spring Test). | [`@ngo17574-ops`](https://github.com/ngo17574-ops) |

---

## 💡 2. Giới Thiệu Dự Án & Vấn Đề Giải Quyết

Trong ngành F&B hiện đại, các nhà hàng truyền thống thường xuyên đối mặt với **3 điểm nghẽn nghiêm trọng** trong giờ cao điểm:
1. **Quá tải phục vụ:** Khách hàng phải chờ đợi lâu để gọi nhân viên mang menu giấy, việc gọi thêm món theo nhiều đợt (*Batch Ordering*) dễ bị nhân viên ghi chép sót hoặc nhầm lẫn món.
2. **Sai lệch & trễ thông tin giữa Sảnh và Bếp:** Bếp nấu xong không biết bàn nào cần ưu tiên; món đã hết nguyên liệu nhưng nhân viên vẫn nhận order của khách dẫn đến việc phải hủy món và gây ức chế.
3. **Thất thoát dòng tiền & Chậm chốt ca:** Thu ngân giao ca không đối soát được tiền mặt đầu ca, tiền thu trong ca và chênh lệch két; báo cáo doanh thu không phân tách rõ rệt theo ca làm việc của từng nhân viên.

**Giải pháp của ROMS (Restaurant Ordering Management System):**  
ROMS là một nền tảng chuyển đổi số toàn diện kết nối liền mạch **6 đầu mối vận hành**: **Thực khách tại bàn (QR Scan) ➔ Trợ lý ảo AI ➔ Nhân viên phục vụ (Mobile Floor Plan) ➔ Bếp KDS (Touchscreen) ➔ Thu ngân POS ➔ Bảng điều khiển Quản trị (Manager)** thông qua cơ chế truyền thông thời gian thực **WebSocket STOMP** với độ trễ dưới 5ms.

---

## 🎯 3. Các Phân Hệ Chức Năng Cốt Lõi (Core Modules)

### 3.1. Phân Hệ Thực Khách Tại Bàn (Dine-in Customer Portal)
* **Quét mã QR thông minh tại bàn:** Nhận diện số bàn động, tự động gán vào phiên phục vụ đang hoạt động (*Active Dining Session*).
* **Gọi món đa đợt (Batch Ordering):** Khách có thể đặt món liên tục theo từng lượt dùng bữa mà không bị ghi đè hay mất các món đã gọi trước đó.
* **Theo dõi tiến độ nấu Realtime:** Khách quan sát trạng thái từng đĩa món theo thời gian thực: `Chờ tiếp nhận (PENDING)` ➔ `Bếp đang nấu (COOKING)` ➔ `Món đã xong (READY)` ➔ `Đã lên bàn (SERVED)`.
* **Trợ lý AI Hỗ Trợ Gọi Món (ROMS Bot):** Tích hợp Google Gemini với cơ chế **Multi-Model Failover** (`gemini-flash-lite-latest` ➔ `gemini-3.5-flash-lite` ➔ `gemini-3.1-flash-lite`) cùng bộ phân tích ngữ cảnh dự phòng Rule-based khi mất mạng:
  - Tư vấn thực đơn theo ngân sách (ví dụ: *"Gợi ý bữa ăn dưới 300k cho 2 người"*).
  - Tự động lọc trừ các món đã có trong giỏ hàng để tránh gợi ý trùng.
  - Loại bỏ hoàn toàn các món đã hết hàng (`remainingStock <= 0` hoặc `isAvailable = false`).
* **Bấm chuông gọi phục vụ kỹ thuật số:** Yêu cầu hỗ trợ khẩn cấp, xin thêm đá, khăn lạnh hoặc bấm chuông xin thanh toán trực tiếp từ điện thoại.
* **Thanh toán VietQR động PayOS:** Tự động tạo mã QR chuyển khoản chính xác từng xu kèm mã hóa đơn, tiền vào tài khoản webhook kích hoạt đóng bàn lập tức.

### 3.2. Phân Hệ Đặt Bàn Trực Tuyến (Online Reservation Portal)
* **Quy trình đặt bàn 4 bước chuyên nghiệp:** Chọn ngày dùng bữa, chọn khung giờ phục vụ chuẩn (**07:00 - 21:30**), số lượng khách (1-20 người), và chọn khu vực (Sảnh chính, Tầng lửng, Phòng VIP).
* **Đặt trước món ăn (Pre-ordering):** Cho phép chọn trước các món đặc sản để bếp chuẩn bị nguyên liệu chu đáo trước giờ khách đến.
* **Mã đặt chỗ duy nhất (Booking Code):** Định dạng chuẩn `RES-yyyyMMdd-xxxx` hỗ trợ tra cứu lịch sử đặt bàn và kiểm tra trạng thái phê duyệt qua SĐT.
* **Khóa bàn đệm an toàn (Buffer Time Lock):** Tự động khóa bàn từ **T-60 phút** đến **T+45 phút** xung quanh giờ hẹn, ngăn chặn nhân viên xếp nhầm khách vãng lai (*Walk-in*) vào bàn đã được đặt trước.

### 3.3. Trạm Điều Phối Bếp KDS (Kitchen Display System)
* **Bảng điều phối cảm ứng trực quan:** Tách biệt các đơn món theo từng bàn và từng món với mã màu chuẩn công nghiệp:
  - `Vàng cam`: Đơn mới gửi từ khách (*ORDER_NEW*).
  - `Xanh dương`: Bếp đang nấu (*COOKING*).
  - `Xanh lá`: Món đã xong, chờ nhân viên bưng lên bàn (*READY*).
* **Phân luồng trạm chế biến tự động:** Tự động định tuyến món xào nấu về trạm Bếp (`KITCHEN`) và các món nước đóng lon/chai về trạm Phục vụ (`WAITER`) lấy từ tủ mát.
* **Nút khẩn cấp 1-chạm báo hết món (86'd Quick Sold-Out):** Bếp trưởng bấm 1 nút là món ăn lập tức bị khóa trên toàn bộ thực đơn điện thoại khách và POS, ngăn chặn việc nhận thêm order món không thể phục vụ.
* **Âm thanh Ding-Dong Web Audio API:** Chuông âm thanh êm ái tự động vang lên mỗi khi có đơn món mới xuất hiện.

### 3.4. Trạm Phục Vụ Bàn (Waiter Mobile Terminal)
* **Sơ đồ bàn tương tác theo thời gian thực (Interactive Floor Plan):** Màu sắc bàn biểu diễn trực quan: `Trống (Xanh)`, `Có khách (Đỏ cam)`, `Cần dọn dẹp (Xám)` và `Đang rung chuông gọi (Nhấp nháy vàng)`.
* **Thông báo món sẵn sàng bưng:** Nhận tín hiệu STOMP tức thời khi Bếp bấm `READY`, nhân viên mang món ra bàn và bấm xác nhận `Đã lên bàn (SERVED)` để đồng bộ thanh tiến độ trên điện thoại thực khách.
* **Xử lý chuông gọi phục vụ 1-chạm:** Hiển thị rõ bàn nào đang cần nước đá, cần khăn hay xin hóa đơn kèm đồng hồ đếm số phút chờ của khách.

### 3.5. Thu Ngân POS & Chốt Ca (Cashier Point-Of-Sale)
* **Thanh toán đa phương thức:** Tiền mặt, Thẻ tín dụng/POS, và Quét mã VietQR động tự động khớp bill.
* **In phiếu tạm tính & Hóa đơn nhiệt:** Hỗ trợ áp mã giảm giá Voucher, tích điểm VIP, tính thuế VAT tự động.
* **Đối soát két tiền & Chốt ca chuẩn F&B (Shift Settlement):**
  - Quản lý 2 ca làm việc tiêu chuẩn: **Ca Sáng (06:00 - 14:00)** và **Ca Tối (14:00 - 22:00)**.
  - Nhập tiền lẻ đầu ca (*Opening Float*), kiểm đếm mệnh giá tiền mặt (*Denomination Counter*), tự động tính chênh lệch thừa/thiếu tiền két (*Cash Variance*).
  - Áp dụng cơ chế **Night Settlement Grace Window** (quét bao quát đến 05:59 sáng hôm sau) đảm bảo các đơn thanh toán ăn khuya hoặc kiểm đếm muộn của ca tối không bao giờ bị thất thoát.
  - Yêu cầu Quản lý nhập mã PIN BCrypt để phê duyệt chốt ca và in Biên bản bàn giao ca.

### 3.6. Bảng Điều Khiển Quản Trị Nhà Hàng (Manager Portal)
* **Quản lý Thực đơn & Tồn kho suất ăn:** Cấu hình linh hoạt món ăn bán theo định mức suất ngày (`dailyStock`) hoặc bán tự do theo kho (`null`), tự động kích hoạt mở bán lại khi quản lý bù thêm suất mới.
* **Thiết kế Sơ đồ Bàn & Xuất Standee QR:** Cho phép thêm/sửa/xóa bàn, khu vực và **xuất file PDF Standee mã QR để bàn chuẩn in ấn cao cấp**.
* **Phân ca làm việc tuần (Live Shift Scheduling):** Xếp ca nhân sự linh hoạt theo vai trò (Quản lý, Bếp, Thu ngân, Phục vụ), tính năng 1-chạm sao chép lịch phân ca giữa các ngày trong tuần.
* **Báo cáo & Phân tích Doanh thu Thông minh (BI Analytics):** Biểu đồ doanh thu ngày/tuần/tháng, phân tích cơ cấu doanh thu theo ca (*Shift Breakdown*), tỷ trọng phương thức thanh toán, top món bán chạy và xuất file in ấn báo cáo tài chính.
* **Chuông thông báo Quản lý đa năng:** Giám sát các bàn đang gọi hỗ trợ và đơn đặt bàn trực tuyến mới, tích hợp công tắc **Bật/Tắt chuông âm thanh (Mute)** phục vụ thuyết trình và tự động tắt tiếng ngoài giờ (22h - 06h).

---

## ⚙️ 4. Kiến Trúc Kỹ Thuật Chuyên Sâu (Deep Technical Highlights)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ROMS FULL-STACK ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [CLIENT LAYER]                                                                 │
│  ├── Thực Khách (Mobile Web)   --> Quét QR Bàn, Đặt Món, AI Chatbot             │
│  ├── Khách Đặt Bàn (Public)    --> Đặt Bàn 07:00-21:30, Pre-Order Món           │
│  ├── Phục Vụ (Waiter Mobile)   --> Sơ Đồ Bàn, Nhận Chuông Gọi, Bưng Món         │
│  ├── Bếp KDS (Touch Screen)    --> Tiếp Nhận Order, Đổi Trạng Thái, 86'd Món    │
│  ├── Thu Ngân POS (Desktop)    --> Tạm Tính, VietQR PayOS, Chốt Két Theo Ca     │
│  └── Quản Lý (Admin Portal)    --> Menu, Phân Ca, Standee PDF, Báo Cáo BI       │
│                                      │                                          │
│                        REST API / STOMP WebSocket                               │
│                                      ▼                                          │
│  [SECURITY & GATEWAY LAYER]                                                     │
│  ├── Stateless JWT Authentication + Staff PIN Lockout Protection (BCrypt)       │
│  ├── Role-Based Access Control: MANAGER | CASHIER | WAITER | KITCHEN            │
│  └── TraceId MDC Logging Filter (Mã vết request `roms-xxxx` cho Observability)   │
│                                      │                                          │
│  [CORE APPLICATION SERVICES]         ▼                                          │
│  ├── DiningSession Lifecycle Engine (Check-in ➔ Batch Orders ➔ Pay ➔ Dirty)     │
│  ├── Pessimistic Concurrency Guard (PESSIMISTIC_WRITE Lock trên MenuItem)       │
│  ├── Night Settlement Grace Window (Chốt ca tài chính 14:00 - 05:59 sáng)       │
│  ├── Google Gemini AI Engine with Multi-Model Failover & Context Filter         │
│  ├── VietQR PayOS Dynamic Settlement Webhook Engine                             │
│  └── In-Memory Multi-Tier Cache (Caffeine Cache: customerMenu, categories)      │
│                                      │                                          │
│  [DATA & PERSISTENCE LAYER]          ▼                                          │
│  └── Microsoft SQL Server 2022 (Dockerized Database Engine)                     │
│      ├── High-performance Indexes on session, order_items, bills, bookings      │
│      └── ACID Compliance for Financial & Inventory Integrity                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1. Kiểm Soát Tranh Chấp Tồn Kho Cực Đại (Pessimistic Concurrency Control)
* Để giải quyết bài toán **Race Condition** khi hàng chục thực khách tại các bàn khác nhau cùng bấm đặt 1 suất ăn cuối cùng tại cùng một tích tắc ($t_0$):
* Hệ thống sử dụng khóa ghi bi quan cấp độ hàng cơ sở dữ liệu:
  ```java
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT m FROM MenuItem m WHERE m.id = :id AND m.isActive = true")
  Optional<MenuItem> findByIdForUpdate(@Param("id") Long id);
  ```
* Cơ chế này đảm bảo transaction của khách hàng đầu tiên chiếm độc quyền dòng dữ liệu để trừ tồn kho; transaction thứ hai đọc được tồn kho bằng 0 sẽ lập tức nhận thông báo từ chối lịch sự, triệt tiêu 100% rủi ro bán vượt định mức (*Overselling*).

### 4.2. Bộ Nhớ Đệm Hiệu Năng Cao (In-Memory Caffeine Cache)
* Thực đơn nhà hàng được hàng trăm thực khách truy cập đồng thời để xem món. ROMS tích hợp **Caffeine Caching** trực tiếp trên RAM máy chủ:
  - Cache Hit trả kết quả trong **<5ms**, giảm 92% tải truy vấn xuống CSDL SQL Server.
  - Tự động xóa bộ nhớ đệm (*Cache Eviction*) ngay khi Quản lý cập nhật giá món, hết hàng hoặc thay đổi định mức:
  ```java
  @CacheEvict(value = {"customerMenu", "categories"}, allEntries = true)
  ```

### 4.3. Kiến Trúc Giám Sát & Truy Vết (Observability & MDC Logging)
* Mỗi request HTTP đi qua hệ thống đều được cấp phát một mã định danh duy nhất `TraceId` (định dạng `roms-xxxxxxxx-xxxx`).
* Mã `TraceId` được gắn vào header phản hồi `X-Trace-Id` và ghi vào log toàn hệ thống thông qua `MDC (Mapped Diagnostic Context)`, giúp đội ngũ kỹ thuật truy vết chính xác nguồn gốc lỗi của bất kỳ hóa đơn nào trong vòng 3 giây.
* Endpoint `/actuator/health` được tích hợp **RestaurantOperationalHealthIndicator** giám sát realtime: số bàn đang phục vụ, số phiên ăn hoạt động, và số lượng món đang nấu trên bếp.

---

## 🗺️ 5. Sơ Đồ Thiết Kế Hệ Thống (Architecture & Diagrams)

Tất cả sơ đồ kiến trúc chuẩn UML và ERD chất lượng cao (4K) được lưu trữ trực tiếp trong thư mục [`slide/`](slide/):

* **Sơ đồ Thực thể Mối quan hệ (ERD Relational Database):**  
  👉 Xem chi tiết tại: [`slide/erd/ROMS_ERD_Full_Relational_EN_4K.png`](slide/erd/ROMS_ERD_Full_Relational_EN_4K.png)  
  *(Mô hình quan hệ chuẩn hóa 3NF: Bàn ăn, Phiên ăn, Đơn gọi món, Món ăn, Hóa đơn, Nhân sự, Phân ca trực và Phiếu đặt bàn)*
* **Sơ đồ Phân rã Gói chức năng (Package Architecture Diagram):**  
  👉 Xem chi tiết tại: [`slide/package/ROMS_Package_Diagram_Colored_EN_4K.png`](slide/package/ROMS_Package_Diagram_Colored_EN_4K.png)  
  *(Kiến trúc phân tầng: Controller ➔ Service ➔ Repository ➔ Entity ➔ DTO ➔ Config ➔ Actuator)*
* **Sơ đồ Luồng Màn Hình Nghiệp Vụ (Screen Flow Diagrams):**  
  👉 Luồng Đặt món tại bàn: [`slide/screenflow/ROMS_ScreenFlow_Ordering_EN_4K.png`](slide/screenflow/ROMS_ScreenFlow_Ordering_EN_4K.png)  
  👉 Luồng Đặt bàn trực tuyến: [`slide/screenflow/ROMS_ScreenFlow_Reservation_EN_4K.png`](slide/screenflow/ROMS_ScreenFlow_Reservation_EN_4K.png)  
  👉 Luồng Vận hành tổng thể: [`slide/screenflow/ROMS_ScreenFlow_Overall_EN_4K.png`](slide/screenflow/ROMS_ScreenFlow_Overall_EN_4K.png)

---

## 💻 6. Ngăn Xếp Công Nghệ (Technology Stack)

| Thành phần | Công nghệ chính | Phiên bản | Mục đích & Trách nhiệm |
|---|---|---|---|
| **Backend Core** | **Spring Boot** | `3.4.5` | Framework xử lý nghiệp vụ chính, Dependency Injection, REST APIs |
| **Ngôn ngữ nền tảng** | **Java (LTS)** | `Java 21` | Tận dụng Virtual Threads, Pattern Matching, Record Classes, Strong Typing |
| **Bảo mật & Định danh** | **Spring Security** | `6.4.x` | Stateless JWT Authentication, BCrypt Hash mã PIN nhân viên |
| **Cơ sở dữ liệu** | **Microsoft SQL Server** | `2022 Dev` | Hệ quản trị CSDL quan hệ chính (RDBMS), hỗ trợ ACID, T-SQL, Row-level Locking |
| **Truyền thông Realtime** | **Spring WebSocket** | `STOMP` | Broker đẩy sự kiện đồng bộ tức thời giữa Khách ➔ Bếp ➔ Waiter ➔ Thu ngân |
| **Bộ nhớ đệm (Cache)** | **Caffeine Cache** | `3.1.x` | In-memory cache tốc độ cao cho danh mục thực đơn và chuyên mục món |
| **Frontend Framework** | **React** | `19.x` | Xây dựng giao diện Single-Page Application (SPA) phản hồi mượt mà |
| **Build Tool Frontend** | **Vite** | `8.3.x` | Bundler thế hệ mới với Hot Module Replacement (HMR) cực nhanh |
| **Giao tiếp API** | **Axios** | `1.7.x` | Xử lý HTTP requests, tự động gắn Bearer Token và xử lý lỗi tập trung |
| **Hạ tầng Ảo hóa** | **Docker & Docker Compose** | `v2` | Đóng gói môi trường Backend, Frontend (Nginx), Database độc lập |
| **Tự động hóa CI/CD** | **GitHub Actions** | `v4` | Tự động hóa Build, Test, Lint và Deploy liên tục lên VPS qua SSH |
| **Máy chủ Đám mây** | **Ubuntu Cloud VPS** | `24.04 LTS` | Máy chủ lưu trữ Production (`222.255.184.250`), Nginx Reverse Proxy |

---

## 🛠️ 7. Hướng Dẫn Cài Đặt & Khởi Chạy (Local Setup)

### Yêu cầu tiên quyết (Prerequisites):
- **JDK:** Java 21 LTS trở lên.
- **Node.js:** Node.js v20.x hoặc v22.x và npm v10.x.
- **Docker:** Docker Desktop đã cài đặt và đang chạy.

### Bước 1: Clone mã nguồn từ GitHub
```bash
git clone https://github.com/GROUP6-ROMS/Restaurant-Ordering-Management-System-ROMS.git
cd Restaurant-Ordering-Management-System-ROMS
```

### Bước 2: Khởi động Cơ sở dữ liệu SQL Server với Docker Compose
```bash
docker compose up -d database db-init
```
*Lệnh trên sẽ khởi chạy MSSQL Server 2022 tại port `1433` và tự động kích hoạt container `db-init` tạo sẵn CSDL `ROMS_DB`.*

### Bước 3: Khởi chạy Backend Spring Boot
```bash
cd SourceCode/backend/roms

# Sử dụng Maven Wrapper đi kèm sẵn:
./mvnw clean spring-boot:run

# (Trên Windows PowerShell):
.\mvnw.cmd clean spring-boot:run
```
*Backend Spring Boot sẽ khởi động tại:* `http://localhost:8080`  
*Kiểm tra sức khỏe dịch vụ:* `http://localhost:8080/actuator/health`

### Bước 4: Khởi chạy Frontend React Vite
Mở một cửa sổ Terminal mới:
```bash
cd SourceCode/frontend

# Cài đặt thư viện dependencies:
npm install

# Khởi chạy máy chủ phát triển Vite:
npm run dev
```
*Frontend sẽ sẵn sàng phục vụ tại:* `http://localhost:5173`

---

## 🔑 8. Tài Khoản Trực Ca Thử Nghiệm (Demo Accounts)

Tại màn hình đăng nhập Nhân viên (`/staff/login`), bạn có thể sử dụng các tài khoản direct-fill cấu hình sẵn:

| Vai Trò Phục Vụ | Mã Nhân Viên | Mã PIN Mặc Định | Họ và Tên | Mục Đích Trải Nghiệm Demo |
|---|:---:|:---:|---|---|
| **Quản Lý (Manager)** | `MGR-001` | `123456` | Dương Trong | Toàn quyền Quản trị: Menu, Phân ca, Standee QR PDF, Duyệt chốt ca, Báo cáo BI |
| **Nhân Viên Phục Vụ (Waiter)** | `EMP-001` | `123456` | Phạm Minh Đức | Sơ đồ bàn, Mở bàn, Tiếp nhận chuông gọi hỗ trợ, Bưng món lên bàn |
| **Đầu Bếp (Kitchen KDS)** | `KDS-001` | `123456` | Ngô Viết Bảo Huy | Tiếp nhận order từ khách, Nấu món, Báo hoàn tất món, Nút ngắt bán 86'd |
| **Thu Ngân (Cashier POS)** | `CSH-001` | `123456` | Đỗ Võ Thanh Trung | Thu ngân, In hóa đơn tạm tính, VietQR động, Đối soát két tiền & Chốt ca |

---

## 🧪 9. Kiểm Thử Tự Động & Đảm Bảo Chất Lượng (QA & Testing)

Hệ thống được áp dụng phương pháp kiểm thử tự động nghiêm ngặt ở cả 2 đầu Backend và Frontend:

### 9.1. Backend Automated Testing (JUnit 5 + Mockito)
Hệ thống sở hữu bộ kiểm thử đơn vị và kiểm thử tích hợp toàn diện gồm **81/81 Test Cases vượt qua 100%**:
- `OrderConcurrencyTest`: Kiểm tra tải đồng thời, chống Race Condition khi nhiều thread tranh chấp tồn kho món ăn.
- `CashierServiceTest`: Kiểm tra tính toàn vẹn của nghiệp vụ hóa đơn, áp mã giảm giá và đối soát két chốt ca.
- `CustomerAiServiceTest`: Kiểm tra Model Failover của Gemini API và logic phản hồi dự phòng thông minh.
- `ReservationServiceTest`: Kiểm tra ràng buộc khung giờ đặt bàn 07:00 - 21:30 và khóa bàn đệm an toàn.
- `RestaurantTableServiceTest`: Kiểm tra vòng đời bàn ăn, chuyển bàn, gộp bàn và mở phiên.
- `AuthPinLockTest`: Kiểm tra cơ chế khóa tài khoản khi nhập sai mã PIN 5 lần và khôi phục qua email OTP.

```bash
# Thực thi toàn bộ 81 bài kiểm thử Backend:
cd SourceCode/backend/roms
./mvnw clean test

# Kết quả: Tests run: 81, Failures: 0, Errors: 0, Skipped: 0 (BUILD SUCCESS)
```

### 9.2. Frontend Code Quality & Linting
```bash
cd SourceCode/frontend
npm run build
```
*Frontend được tối ưu hóa Bundle, build thành công sạch sẽ trong **<500ms** với dung lượng nén Gzip tối ưu.*

---

## 🚀 10. Pipeline CI/CD & Hạ Tầng Cloud VPS

Hệ thống tích hợp quy trình **Continuous Integration & Continuous Deployment (CI/CD)** hoàn toàn tự động thông qua **GitHub Actions**:

```
[Git Push / Merge PR to `develop`]
               │
               ▼
   [STAGE 1: BACKEND CI]
   ├── Setup Java 21 LTS (Temurin)
   ├── Build with Maven & Run 81/81 JUnit Tests
   └── Verify Code Quality
               │
               ▼
   [STAGE 2: FRONTEND CI]
   ├── Setup Node.js v20.x
   ├── npm install & Vite Production Build
   └── Asset Validation
               │
               ▼
   [STAGE 3: CD DEPLOYMENT TO VPS]
   ├── Secure SSH Execution to Cloud VPS (`222.255.184.250`)
   ├── Git Fast-Forward Pull on Branch `develop`
   ├── Docker Compose Build: Backend (Java 21 JRE) + Frontend (Nginx 1.27)
   ├── Docker Compose Up -d Recreate Containers (Zero-Downtime Migration)
   └── Automated Health Probe verification: `/actuator/health` ➔ `UP`
```

---

## 📜 11. Cam Kết Học Thuật & Đánh Giá Chuẩn SWP391

* Đồ án được thiết kế, phân tích và lập trình bởi các thành viên nhóm ROMS phục vụ môn học **SWP391 — Software Development Project** tại **Trường Đại học FPT**.
* Toàn bộ kiến trúc CSDL, logic dịch vụ, mã nguồn frontend và kịch bản triển khai containerized đều được nhóm tự chủ xây dựng và nghiệm thu thực tế trên máy chủ Cloud VPS.
* Nhóm cam kết tuân thủ nghiêm ngặt chuẩn mực liêm chính học thuật (*Academic Integrity*), sẵn sàng trình bày và phản biện mọi khía cạnh kỹ thuật trước Hội đồng Đánh giá Đồ án.

---

<p align="center">
  <b>Developed with dedication by Team ROMS — Fall 2026</b><br>
  <sub>FPT University Can Tho Campus</sub>
</p>
