# SỔ TAY HƯỚNG DẪN VẬN HÀNH SERVER VPS & TRUY VẤN CƠ SỞ DỮ LIỆU
## Hệ Thống Quản Lý & Gọi Món Nhà Hàng ROMS (Restaurant Ordering Management System)

> **Mục đích tài liệu:** Cung cấp hướng dẫn toàn diện, từng bước và dễ tra cứu dành cho nhóm phát triển và vận hành hệ thống ROMS: từ việc SSH vào Server VPS, kéo mã nguồn (Git Pull), quản lý vòng đời Docker Container, cho đến kết nối và truy vấn trực tiếp Cơ sở dữ liệu Microsoft SQL Server 2022.

---

## 📌 PHẦN 1: BẢNG TRA CỨU THÔNG SỐ HỆ THỐNG (CHEATSHEET)

| Thông Số | Giá Trị Cấu Hình | Ghi Chú |
| :--- | :--- | :--- |
| **Địa chỉ IP VPS** | `222.255.184.250` | Máy chủ đám mây Linux Ubuntu |
| **Tên miền công khai** | `http://roms-restaurant.duckdns.org` | Tên miền trỏ về IP VPS |
| **Tài khoản SSH** | `root` | Quyền quản trị cao nhất |
| **Mật khẩu SSH** | `Romsswp391!@` | Dùng khi đăng nhập SSH Terminal |
| **Thư mục dự án trên VPS** | `~/Restaurant-Ordering-Management-System-ROMS-` | Đường dẫn chứa mã nguồn và docker-compose |
| **Cơ sở dữ liệu (DBMS)** | Microsoft SQL Server 2022 Developer | Chạy trong Docker Container `roms-database` |
| **Cổng CSDL (DB Port)** | `1433` | Chỉ mở nội bộ `127.0.0.1` (Đã đóng ra Internet công khai để bảo mật) |
| **Tên CSDL (Database)** | `ROMS_DB` | Chứa toàn bộ bảng, khóa ngoại, dữ liệu seed |
| **Tài khoản SA Database** | `sa` | Quản trị viên CSDL SQL Server |
| **Mật khẩu SA Database** | `RomsPass123@2026` | Mật khẩu kết nối JDBC và SSMS |
| **Múi giờ máy chủ (Timezone)** | `Asia/Ho_Chi_Minh` (GMT+7) | Đồng bộ cho cả Docker, JVM và Database |

---

## 🖥️ PHẦN 2: HƯỚNG DẪN TRUY CẬP & VẬN HÀNH SERVER VPS

### 2.1. Đăng nhập SSH vào máy chủ
Mở **PowerShell** hoặc **Command Prompt** (hoặc công cụ như *MobaXterm / PuTTY / VS Code Remote SSH*) trên máy tính của bạn:

```bash
ssh root@222.255.184.250
```

* Khi hệ thống yêu cầu mật khẩu (`root@222.255.184.250's password:`):
* Nhập (hoặc chuột phải dán): **`Romsswp391!@`** rồi nhấn **Enter**.
*(Lưu ý: Màn hình Linux bảo mật sẽ không hiển thị ký tự hay dấu chấm tròn, bạn chỉ cần dán đúng rồi nhấn Enter).*

### 2.2. Di chuyển vào thư mục dự án
Sau khi đăng nhập thành công vào VPS:
```bash
cd ~/Restaurant-Ordering-Management-System-ROMS-
```

Kiểm tra trạng thái các file hiện tại:
```bash
git status
```

### 2.3. Quy trình kéo code mới nhất từ GitHub (Git Pull)
Để cập nhật mã nguồn mới nhất từ nhánh `develop`:
```bash
git pull origin develop
```

> [!NOTE]
> **Xử lý nếu GitHub yêu cầu xác thực tài khoản (Khi Repo ở chế độ Private):**
> 1. Khi hỏi `Username for 'https://github.com':` 👉 Nhập tên GitHub (ví dụ: `duongtrong06tk-rgb`).
> 2. Khi hỏi `Password for 'https://...':` 👉 Dán mã **Personal Access Token (PAT)** dạng `ghp_...`.
> 
> **Mẹo lưu Token vĩnh viễn (đã cấu hình sẵn trên VPS):**
> ```bash
> git remote set-url origin https://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@github.com/duongtrong06tk-rgb/Restaurant-Ordering-Management-System-ROMS-.git
> ```
> Khi cấu hình link này, lệnh `git pull origin develop` sẽ chạy tự động mà không bao giờ hỏi mật khẩu nữa.

---

## 🐳 PHẦN 3: ĐIỀU KHIỂN & VẬN HÀNH DOCKER CONTAINER

Hệ thống ROMS được điều phối hoàn chỉnh bằng Docker Compose với 3 dịch vụ chính:
1. `roms-database`: Microsoft SQL Server 2022.
2. `roms-backend`: Spring Boot 3 (Java 21 LTS).
3. `roms-frontend`: React Vite + Production Nginx.

### 3.1. Các lệnh triển khai thường dùng

#### A. Khởi động lại và build mới bản cập nhật (Sau khi `git pull`):
```bash
docker compose down
docker compose up -d --build
```
> [!IMPORTANT]
> **Lệnh `docker compose down` có làm mất dữ liệu không?**
> **HOÀN TOÀN KHÔNG.** Dữ liệu CSDL được lưu an toàn tại Docker Volume vĩnh viễn (`roms-mssql-data`). Lệnh `down` chỉ dừng tiến trình phần mềm. Tuyệt đối **KHÔNG** gõ thêm cờ `-v` (`docker compose down -v`) vì cờ `-v` mới là lệnh xóa volume dữ liệu.

#### B. Xem trạng thái sống/chết của các container:
```bash
docker compose ps
```
*Kết quả lý tưởng:* Cả 3 container `roms-database`, `roms-backend`, `roms-frontend` đều hiển thị trạng thái `Up (healthy)`.

#### C. Xem log hệ thống thời gian thực (Để theo dõi hoặc bắt lỗi):
* **Xem log Backend (Spring Boot):**
  ```bash
  docker compose logs -f backend --tail 100
  ```
  *(Nhấn `Ctrl + C` để thoát màn hình log).*

* **Xem log Frontend (Nginx Web Server):**
  ```bash
  docker compose logs -f frontend --tail 100
  ```

* **Xem log Database (SQL Server Engine):**
  ```bash
  docker compose logs -f database --tail 100
  ```

#### D. Khởi động lại riêng lẻ từng dịch vụ (Không cần tắt toàn bộ):
```bash
# Khởi động lại riêng Backend
docker compose restart backend

# Khởi động lại riêng Frontend
docker compose restart frontend

# Khởi động lại riêng Database
docker compose restart database
```

#### E. Kiểm tra nhanh sức khỏe hệ thống (Health Check):
```bash
curl -s http://localhost:8080/actuator/health | jq .
# hoặc kiểm tra từ bên ngoài:
curl -s http://roms-restaurant.duckdns.org/actuator/health
```

#### F. Kiểm tra múi giờ chuẩn trong container Backend:
```bash
docker exec -it roms-backend date
```
*Kết quả chuẩn phải kết thúc bằng `+07` hoặc `ICT` (Ví dụ: `Fri Oct 30 16:50:00 +07 2026`).*

---

## 🗄️ PHẦN 4: KẾT NỐI & TRUY VẤN TRỰC TIẾP CƠ SỞ DỮ LIỆU (SQL SERVER)

> [!NOTE]
> **Bảo mật CSDL (Issue #28):** Để ngăn chặn các cuộc tấn công Brute-force mật khẩu SA từ bot mạng Internet, cổng `1433` của SQL Server đã được đóng ra bên ngoài và chỉ lắng nghe trên `127.0.0.1` của VPS. Khi cần kết nối từ máy tính cá nhân bằng SSMS / DBeaver / DataGrip / sqlcmd, bạn chỉ cần mở **SSH Tunnel** an toàn.

---

### PHƯƠNG THỨC 1: Kết nối bằng Giao diện trực quan (SSMS / DBeaver / DataGrip) qua SSH Tunnel
*Khuyên dùng khi bạn làm việc trên máy tính cá nhân để xem bảng, sửa dữ liệu bằng chuột.*

1. **Bước 1: Mở SSH Tunnel từ máy tính cá nhân** (chạy trên PowerShell / Terminal):
   ```bash
   ssh -L 1433:localhost:1433 root@222.255.184.250
   ```
   *(Nhập mật khẩu `Romsswp391!@` và giữ cửa sổ terminal này chạy trong lúc làm việc).*

2. **Bước 2: Mở phần mềm Microsoft SQL Server Management Studio (SSMS)**:
   - **Server type:** `Database Engine`
   - **Server name:** `localhost,1433` *(hoặc `127.0.0.1,1433`)*
   - **Authentication:** `SQL Server Authentication`
   - **Login:** `sa`
   - **Password:** `RomsPass123@2026`
   - Bấm vào nút **Options >>**:
     - Tích chọn ô: **`Trust server certificate`** *(Bắt buộc để tránh lỗi chứng chỉ SSL)*
     - Tab *Connection Properties* $\rightarrow$ Connect to database: chọn `ROMS_DB`.
   - Nhấn **Connect**.

---

### PHƯƠNG THỨC 2: Truy vấn qua `sqlcmd` (thông qua SSH Tunnel)
Khi SSH Tunnel đang mở (`ssh -L 1433:localhost:1433 root@222.255.184.250`):

```powershell
sqlcmd.exe -S localhost,1433 -U sa -P "RomsPass123@2026" -d ROMS_DB -C -l 30 -Q "SELECT TOP 10 id, table_number, name, status FROM restaurant_tables;"
```

---

### PHƯƠNG THỨC 3: Truy vấn ngay bên trong Terminal VPS
Khi đang SSH trong máy chủ VPS, bạn có thể tương tác trực tiếp với container CSDL:

#### A. Chạy truy vấn 1 câu lệnh nhanh:
```bash
docker exec -it roms-database /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "RomsPass123@2026" -C -d ROMS_DB -Q "SELECT TOP 10 id, table_number, name, status FROM restaurant_tables;"
```

#### B. Mở giao diện dòng lệnh SQL tương tác liên tục (Interactive CLI):
```bash
docker exec -it roms-database /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "RomsPass123@2026" -C -d ROMS_DB
```
Khi màn hình hiện `1>`, bạn có thể gõ các câu lệnh SQL tự do. Để thực thi câu lệnh, gõ `GO` rồi Enter:
```sql
1> SELECT COUNT(*) AS TotalOrders FROM orders;
2> GO
3> QUIT
```

---

### 4.2. Các câu lệnh SQL hữu ích thường dùng để cứu hộ dữ liệu (Troubleshooting Queries)

#### 1. Kiểm tra trạng thái toàn bộ bàn ăn:
```sql
SELECT id, table_number, name, zone, status, capacity, qr_token 
FROM restaurant_tables 
ORDER BY id ASC;
```

#### 2. Cứu hộ bàn bị kẹt trạng thái (Ví dụ reset bàn B-02 về AVAILABLE):
```sql
-- Cập nhật phiên ăn về COMPLETED
UPDATE dining_sessions 
SET status = 'COMPLETED', end_time = GETDATE() 
WHERE table_id = 12 AND status = 'ACTIVE';

-- Cập nhật trạng thái bàn về Trống
UPDATE restaurant_tables 
SET status = 'AVAILABLE' 
WHERE table_id = 12;
```

#### 3. Kiểm tra các đơn hàng đang chờ bếp chế biến:
```sql
SELECT o.id, o.order_code, t.table_number, o.status, o.total_amount, o.created_at
FROM orders o
LEFT JOIN dining_sessions s ON o.session_id = s.id
LEFT JOIN restaurant_tables t ON s.table_id = t.id
WHERE o.status IN ('SUBMITTED', 'CONFIRMED', 'COOKING')
ORDER BY o.created_at DESC;
```

#### 4. Kiểm tra danh sách nhân viên và mã PIN:
```sql
SELECT id, staff_code, full_name, role, is_active, failed_pin_attempts 
FROM staffs;
```

#### 5. Mở khóa tài khoản nhân viên bị nhập sai PIN quá 5 lần:
```sql
UPDATE staffs 
SET is_active = 1, failed_pin_attempts = 0 
WHERE staff_code = 'CSH-001';
```

---

## 💾 PHẦN 5: SAO LƯU (BACKUP) & PHỤC HỒI (RESTORE) CƠ SỞ DỮ LIỆU

### 5.1. Tạo bản sao lưu dự phòng (Full Backup)
Khi đang SSH trên VPS, chạy lệnh:
```bash
# 1. Ra lệnh cho SQL Server sao lưu database vào file .bak
docker exec -it roms-database /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "RomsPass123@2026" -C -Q "BACKUP DATABASE [ROMS_DB] TO DISK = '/var/opt/mssql/backup_roms_$(date +%Y%m%d).bak' WITH FORMAT, INIT, NAME = 'Full Backup of ROMS_DB';"

# 2. Copy file sao lưu từ trong container ra thư mục ngoài VPS
docker cp roms-database:/var/opt/mssql/backup_roms_$(date +%Y%m%d).bak ~/backup_roms_$(date +%Y%m%d).bak

# 3. Kiểm tra file backup
ls -lh ~/backup_roms_*.bak
```

### 5.2. Tải bản backup về máy tính cá nhân
Mở PowerShell trên máy tính cá nhân (không phải trên VPS) và chạy lệnh `scp`:
```powershell
scp root@222.255.184.250:~/backup_roms_20261030.bak C:\Users\Dell\Downloads\
```

---

## 🚨 PHẦN 6: CẨM NANG XỬ LÝ SỰ CỐ NHANH (TROUBLESHOOTING FAQs)

### Sự cố 1: Máy chủ báo hết ổ cứng (`No space left on device`)
* **Nguyên nhân:** Docker lưu lại các bản image build cũ qua nhiều lần cập nhật.
* **Cách xử lý:** Chạy lệnh dọn rác an toàn của Docker:
  ```bash
  docker system prune -f
  ```
  *(Lệnh này chỉ xóa các image thừa không dùng đến, không chạm vào database volume).*

### Sự cố 2: Trang web bị quay tròn hoặc báo lỗi `502 Bad Gateway`
* **Nguyên nhân:** Container Backend bị crash hoặc đang trong 40 giây khởi động ban đầu.
* **Cách kiểm tra:**
  ```bash
  docker compose ps
  docker compose logs --tail 50 backend
  ```
* Nếu thấy lỗi Out Of Memory (OOM), khởi động lại:
  ```bash
  docker compose restart backend
  ```

### Sự cố 3: Trình duyệt vẫn hiển thị giao diện cũ sau khi server đã cập nhật
* **Nguyên nhân:** Trình duyệt lưu đệm (Browser Cache) các file Javascript/CSS cũ.
* **Cách xử lý:** Nhấn tổ hợp phím **`Ctrl + Shift + R`** (hoặc mở bằng tab ẩn danh `Ctrl + Shift + N`) để ép trình duyệt tải file mới nhất từ máy chủ.

---
*Tài liệu được biên soạn và chuẩn hóa bởi ROMS Engineering & DevOps Team.*
