# BƯỚC 39: ĐÓNG GÓI DOCKER CONTAINERIZATION & SẴN SÀNG TRIỂN KHAI PRODUCTION (GIAI ĐOẠN 6)

> **Mục tiêu:** Đóng gói toàn bộ hệ thống ROMS thành các container độc lập theo tiêu chuẩn Enterprise DevOps:
> 1. **Multi-Stage Build Spring Boot Dockerfile:** Tách biệt môi trường build (Maven + JDK 21) và runtime (Eclipse Temurin JRE 21 Alpine siêu nhẹ), chạy dưới quyền `non-root user` (`romsuser`) chuẩn DevSecOps.
> 2. **Multi-Stage Build React Vite Dockerfile:** Biên dịch mã nguồn React Vite thành static assets và phân phối qua web server `nginx:alpine` hiệu năng cao.
> 3. **Production Nginx Reverse Proxy (`nginx.conf`):** Xử lý định tuyến SPA (`try_files $uri $uri/ /index.html;`), triệt tiêu 100% lỗi CORS bằng cách proxy `/api/` về Backend, duy trì kết nối WebSocket STOMP thời gian thực (`/ws-roms/`), nén Gzip và cache static assets.
> 4. **Orchestration Với Docker Compose (`docker-compose.yml`):** Tự động điều phối toàn bộ dịch vụ kèm cơ chế Healthcheck qua endpoint `/actuator/health` đã tạo ở Bước 38.
> 5. **Kịch Bản 1-Click Khởi Chạy Trên Windows:** Tạo file `run-docker.bat` và `stop-docker.bat` giúp khởi chạy toàn bộ dự án mà không cần cài đặt Node.js hay Java trên máy trạm.

---

## 1. Mô Hình Kiến Trúc Container (Docker Architecture)

```
                            TRÌNH DUYỆT / KHÁCH HÀNG / THU NGÂN / BẾP
                                               │
                                               ▼ (Port 80 / 5173)
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ CONTAINER: roms-frontend (Nginx 1.27 Alpine)                                                │
│                                                                                             │
│  ├── /usr/share/nginx/html (React Dist minified static assets)                              │
│  │                                                                                          │
│  └── /etc/nginx/conf.d/default.conf                                                         │
│        ├── location /              --> Phục vụ SPA React (try_files fallback index.html)    │
│        ├── location /api/          --> Reverse Proxy sang http://backend:8080/api/          │
│        ├── location /ws-roms/      --> Reverse Proxy WebSocket STOMP (HTTP/1.1 Upgrade)     │
│        └── location /actuator/     --> Reverse Proxy sang http://backend:8080/actuator/     │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                 Mạng nội bộ: roms-net (Bridge)
                                               │
                                               ▼ (Port 8080)
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ CONTAINER: roms-backend (Eclipse Temurin JRE 21 Alpine)                                     │
│                                                                                             │
│  - User: romsuser (Non-root, an toàn DevSecOps)                                             │
│  - In-Memory Caching: Caffeine (customerMenu, categories)                                   │
│  - Observability: SLF4J MDC Trace ID (X-Trace-Id)                                           │
│  - Healthcheck: wget http://localhost:8080/actuator/health                                  │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                 host.docker.internal:1433
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ CSDL MICROSOFT SQL SERVER 2022 (HOST MACHINE HOẶC CONTAINER DB)                             │
│ Database: ROMS_DB (Unicode tiếng Việt, bảng, khóa ngoại, dữ liệu seed đầy đủ)               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Chi Tiết Các Tệp Mã Nguồn Đã Xây Dựng

### 2.1. Backend Multi-Stage Dockerfile (`SourceCode/backend/roms/Dockerfile`)
```dockerfile
# STAGE 1: BUILD STAGE
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# STAGE 2: RUNTIME STAGE
FROM eclipse-temurin:21-jre-alpine AS runner
RUN apk add --no-cache curl wget
RUN addgroup -S romsgroup && adduser -S romsuser -G romsgroup
WORKDIR /app
COPY --from=builder /build/target/roms-*.jar app.jar
RUN chown -R romsuser:romsgroup /app
USER romsuser
EXPOSE 8080
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Dfile.encoding=UTF-8"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

### 2.2. Frontend Production Nginx Config (`SourceCode/frontend/nginx.conf`)
- Cấu hình nén Gzip cho text, js, css, json, svg.
- `location /`: SPA routing tránh lỗi 404 khi người dùng refresh các trang nội bộ.
- `location /api/`: Chuyển tiếp sang backend container, triệt tiêu 100% lỗi CORS.
- `location /ws-roms/` & `location /ws-roms-native/`: Duy trì kết nối WebSocket STOMP realtime cho Bếp KDS và Bồi bàn.
- `location /actuator/`: Chuyển tiếp endpoint kiểm tra sức khỏe hệ thống.

### 2.3. Frontend Multi-Stage Dockerfile (`SourceCode/frontend/Dockerfile`)
```dockerfile
# STAGE 1: BUILD STAGE
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# STAGE 2: PRODUCTION STAGE
FROM nginx:1.27-alpine AS runner
RUN rm -rf /etc/nginx/conf.d/*
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2.4. File Điều Phối `docker-compose.yml` (Thư Mục Gốc)
- **`backend` service:** Tự động kết nối tới SQL Server trên máy tính qua `host.docker.internal:1433`, kích hoạt healthcheck kiểm tra `/actuator/health` mỗi 15 giây.
- **`frontend` service:** Phụ thuộc vào `backend` (`condition: service_healthy`), ánh xạ cổng `80` và cổng `5173`.
- **Mạng `roms-net`:** Cô lập an toàn giữa các container.

### 2.5. Kịch Bản 1-Click Trên Windows (`run-docker.bat` & `stop-docker.bat`)
- `run-docker.bat`: Tự động kiểm tra Docker Desktop, mở Docker Desktop nếu đang tắt, sau đó chạy `docker compose up -d --build`.
- `stop-docker.bat`: Dừng và thu hồi các container khi không sử dụng qua `docker compose down`.

---

## 3. Hướng Dẫn Thao Tác Chạy Hệ Thống

### 3.1. Khởi Chạy 1-Click
Chỉ cần nhấp đúp chuột vào file:
```text
run-docker.bat
```
Hoặc mở Terminal tại thư mục gốc và gõ:
```bash
docker compose up -d --build
```

### 3.2. Truy Cập Các Dịch Vụ
- **Giao diện Web Khách Hàng & Quản Trị:**  
  `http://localhost` (hoặc `http://localhost:5173`)
- **Tài liệu Swagger REST API:**  
  `http://localhost:8080/swagger-ui.html`
- **Chỉ số Sức Khỏe Vận Hành Actuator:**  
  `http://localhost:8080/actuator/health`

### 3.3. Dừng Hệ Thống
Nhấp đúp chuột vào file:
```text
stop-docker.bat
```
Hoặc gõ lệnh:
```bash
docker compose down
```

---

## 4. Bảng Đối Soát Trạng Thái Các Container

| Container Name | Image | Port Mapping | Healthcheck | Vai trò |
|:---|:---|:---|:---|:---|
| `roms-backend` | `roms-backend:latest` | `8080:8080` | `GET /actuator/health` | API xử lý nghiệp vụ F&B, Caching, Token JWT, Realtime STOMP |
| `roms-frontend` | `roms-frontend:latest` | `80:80`, `5173:80` | Phụ thuộc Backend `healthy` | Nginx Web Server, SPA React, Reverse Proxy |
