# ROMS — Restaurant Ordering Management System
## Hệ Thống Quản Lý & Gọi Món Nhà Hàng Thông Minh (Real-Time At-Table QR Ordering & Online Table Reservation)

> **Môn học:** SWP391 — Software Development Project | **Học kỳ:** Fall 2026 | **Đại học FPT**  
> **Môi trường Live Production:** [http://roms-restaurant.duckdns.org/](http://roms-restaurant.duckdns.org/)  
> **Kiến trúc hệ sinh thái:** Microservices-ready Monolith (Spring Boot 3 + Java 21, React 19 + Vite 8, MS SQL Server 2022, Docker Compose, GitHub Actions CI/CD)

---

## 👥 Danh Sách Thành Viên Nhóm Phát Triển (Team ROMS)

| STT | Họ và Tên | Mã Sinh Viên | Vai Trò | Trách Nhiệm Chính | GitHub |
|:---:|---|:---:|:---:|---|:---:|
| **1** | **Dương Trong** | **DE200109** | **Team Leader** | Kiến trúc hệ thống Full-Stack, Database Schema & Concurrency Guards, CI/CD Pipeline, Security RBAC & VietQR PayOS Settlement. | `@duogtrog06tk` |
| **2** | **Phạm Minh Đức** | **DE200053** | **Team Member** | Backend Services, Tối ưu hóa Caching Caffeine, Báo cáo & Thống kê Doanh thu (Reports & Analytics), Quản lý Thực đơn (Menu Management). | `@ducminh14-cmd` |
| **3** | **Ngô Viết Bảo Huy** | **DE200066** | **Team Member** | Frontend Web Apps, Màn hình điều phối Bếp KDS, Trạm phục vụ bàn Waiter Terminal, Kiểm thử tự động (Automated Testing) & Báo cáo đồ án. | `@ngo17574-ops` |

---

## 🚀 Giới Thiệu Dự Án & Giải Pháp Công Nghệ

ROMS giải quyết triệt để 3 điểm nghẽn nghiêm trọng tại các nhà hàng trong giờ cao điểm:
1. **Khách hàng:** Quét mã QR tại bàn để tự xem thực đơn điện tử, thêm món theo nhiều đợt (**Batch Ordering**), theo dõi tiến độ nấu trực tiếp từ bếp và gọi nhân viên phục vụ không cần vẫy tay.
2. **Nhà bếp (KDS):** Màn hình bếp hiển thị trực quan theo thời gian thực (WebSocket STOMP), phân luồng chế biến thông minh (`CONFIRMED` $\rightarrow$ `COOKING` $\rightarrow$ `READY`), tính năng 1-chạm báo hết món (**86'd**) khóa order tức thì toàn hệ thống.
3. **Thu ngân & Quản trị:** Chốt bill tự động 1-chạm, thanh toán linh hoạt (Tiền mặt / VietQR động PayOS), phân ca làm việc (Live Shift Roster), quản lý đặt bàn trực tuyến với cơ chế khóa bàn an toàn chống trùng giờ (**Buffer Time Lock 45 phút**).

---

## 🛠️ Ngăn Xếp Công Nghệ (Technology Stack)

### Backend (Spring Boot 3.4.x - Java 21 LTS)
- **Framework:** Spring Boot 3, Spring Security 6 (Stateless JWT + Staff PIN BCrypt), Spring Data JPA, Spring WebSocket (STOMP Broker).
- **Database:** Microsoft SQL Server 2022 Developer (chạy trên Docker Container, volume vĩnh viễn).
- **Hiệu năng & Giám sát:** Caching Caffeine in-memory (<5ms), TraceId MDC Filter (`roms-xxxx`), Spring Boot Actuator (`/actuator/health`).

### Frontend (React 19 + Vite 8)
- **Engine:** React 19, Vite 8, React Router v7, Axios, Lucide Icons, Canvas QR Code.
- **Real-Time:** STOMP over SockJS + Web BroadcastChannel Event Bus (<5ms sync giữa các tab cùng trình duyệt).
- **Linter & Code Quality:** Oxlint (siêu nhanh, 0 warnings/errors).

### DevOps & Infrastructure
- **CI/CD:** GitHub Actions với 3 stages tự động (Backend CI Java 21, Frontend CI Node 20, VPS SSH Continuous Deployment).
- **Production Server:** Ubuntu Cloud VPS (`222.255.184.250`), Nginx Reverse Proxy, Docker Compose.

---

## 📦 Hướng Dẫn Khởi Chạy Nhanh (Local Development)

### 1. Khởi động Cơ sở dữ liệu (Docker)
```bash
docker compose up -d database db-init
```

### 2. Chạy Backend (Spring Boot)
```bash
cd SourceCode/backend/roms
mvn clean spring-boot:run
```
*API & Swagger sẵn sàng tại:* `http://localhost:8080`

### 3. Chạy Frontend (React Vite)
```bash
cd SourceCode/frontend
npm install
npm run dev
```
*Giao diện người dùng tại:* `http://localhost:5173`

---

## 🧪 Kiểm Thử Tự Động (Automated Testing)
```bash
# Kiểm thử toàn diện Backend (55/55 test cases)
cd SourceCode/backend/roms
mvn clean test

# Kiểm tra cú pháp Frontend
cd SourceCode/frontend
npm run lint
```
