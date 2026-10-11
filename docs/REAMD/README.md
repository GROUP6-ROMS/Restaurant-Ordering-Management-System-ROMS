# MỤC LỤC TÀI LIỆU HƯỚNG DẪN XÂY DỰNG DỰ ÁN ROMS (FULL-STACK & CHUẨN LOMBOK)

> Thư mục tổng hợp các bước hướng dẫn code dự án **ROMS** (Spring Boot 3.4.5, Java 21, Spring Data JPA, Spring Security 6, SQL Server, **Project Lombok** & **React Vite Frontend**).  
> **Nguyên tắc:** Mỗi file chỉ tập trung mô tả **bước đó làm gì** và **các file code làm gì**, áp dụng **Project Lombok** (`@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder`, `@RequiredArgsConstructor`) để loại bỏ hoàn toàn các mã thừa boilerplate.

---

## 🚨 QUY TẮC BẮT BUỘC KHI PHÁT TRIỂN TÍNH NĂNG (DÀNH CHO TEAM & CÁC AGENT AI)

> ⚠️ **ĐIỀU KHOẢN RÀNG BUỘC (MANDATORY AI CODING RULE):**  
> Khi bất kỳ thành viên nào (hoặc **AI Agent** hỗ trợ thành viên đó) thực hiện lập trình hoặc chỉnh sửa bất kỳ tính năng nào trong dự án ROMS (ví dụ: Quản lý bàn & QR, Menu thực đơn, Giỏ hàng & Gọi món, Màn hình bếp KDS, Thanh toán Bill, Đặt bàn trước...), **BẮT BUỘC PHẢI TUÂN THỦ 4 QUY TẮC SAU:**

1. **BẮT BUỘC TẠO/CẬP NHẬT FILE HƯỚNG DẪN `.md` THEO TỪNG BƯỚC:**
   - Mỗi tính năng mới phải có file tài liệu `.md` tương ứng trong thư mục `docs/REAMD/` (đặt tên theo số thứ tự và tên chức năng, ví dụ: `13_Quan_Ly_Ban_Va_Ma_QR.md`, `15_Quan_Ly_Thuc_Don_Menu.md`...).
2. **HƯỚNG DẪN SONG SONG CẢ HAI PHÍA (FULL-STACK: BACKEND & FRONTEND):**
   - **Phía Backend:** Liệt kê đầy đủ Entity, DTO (Lombok `@Data`, `@Builder`), Repository, Service, Controller, Logic nghiệp vụ, Validation, Phân quyền endpoint.
   - **Phía Frontend:** Liệt kê đầy đủ Axios API service, State/Context, Components/Pages giao diện, Form validation, Xử lý gọi API và phản hồi giao diện.
   - **Luồng dữ liệu (Data Flow / Sequence):** Mô tả rõ ràng request từ màn hình nào gửi sang endpoint nào và trả về kết quả gì.
   - **Hướng dẫn Test & Xử lý sự cố (Troubleshooting):** Có câu lệnh test (cURL / Postman / Query SQL mẫu) và bảng các lỗi thường gặp.
3. **ĐỒNG BỘ 100% VỚI MÃ NGUỒN THỰC TẾ:**
   - Tuyệt đối không viết tài liệu giả lập hoặc lệch với code thật. Tên thuộc tính trong DTO, tên trường CSDL, tên route Frontend và URL API trong tài liệu `.md` phải trùng khớp 100% với file code trong `SourceCode/backend/` và `SourceCode/frontend/`.
4. **CẬP NHẬT BẢNG MỤC LỤC TỔNG:**
   - Sau khi hoàn thành chức năng và file hướng dẫn, phải cập nhật một dòng tương ứng vào Bảng Mục lục bên dưới trong file này.

---

## 📋 Danh Sách Các Bước Hướng Dẫn:

| STT | File hướng dẫn | Bước đó làm gì & Các file code tạo ra (Full-Stack & Chuẩn Lombok) |
|:---:|:---|:---|
| **00** | [00_Tong_Quan_Du_An_ROMS.md](00_Tong_Quan_Du_An_ROMS.md) | Phân tích toàn diện kiến trúc dự án, 17 Business Rules, 16 Functional Requirements và 5 nhóm NFR. |
| **01** | [01_Khoi_Tao_Pom_Va_Properties.md](01_Khoi_Tao_Pom_Va_Properties.md) | Cấu hình dependencies trong `pom.xml` (bổ sung **Project Lombok**), kết nối SQL Server trong `application.properties` và cấu trúc thư mục package. |
| **02** | [02_Entity_Staff_Va_Enum_UserRole.md](02_Entity_Staff_Va_Enum_UserRole.md) | Quản lý nhân viên: `UserRole.java` (4 vai trò: MANAGER, WAITER, KITCHEN, CASHIER), Entity `Staff.java` (Lombok `@Getter`, `@Setter`, `@Builder`, đăng nhập bằng `username` + `pinCode` 6 số băm BCrypt, **không dùng password**). |
| **03** | [03_Entity_RestaurantTable_Va_Enum_TableStatus.md](03_Entity_RestaurantTable_Va_Enum_TableStatus.md) | Quản lý bàn ăn & mã QR: `TableStatus.java`, Entity `RestaurantTable.java` (Lombok, phân khu ZONE_1, ZONE_2, VIP, trạng thái `BLOCKED` khóa bàn, `RESERVED` giữ chỗ). |
| **04** | [04_Entity_DiningSession_Va_Enum_SessionStatus.md](04_Entity_DiningSession_Va_Enum_SessionStatus.md) | Quản lý phiên ăn tại bàn: `SessionStatus.java` và Entity `DiningSession.java` (Lombok, token phiên, khóa lạc quan `@Version`). |
| **05** | [05_Entity_Category_Va_MenuItem.md](05_Entity_Category_Va_MenuItem.md) | Quản lý thực đơn: Entity `Category.java` và `MenuItem.java` (Lombok; Bỏ Recipe BOM; thêm giá vốn `costPrice`, biên lợi nhuận, phân trạm KITCHEN/WAITER, đồ uống đóng chai sẵn). |
| **06** | [06_Entity_Order_Va_OrderItem.md](06_Entity_Order_Va_OrderItem.md) | Quản lý gọi món & điều phối: `Order.java`, `OrderItem.java` (Lombok; Điều phối đồ ăn vào KITCHEN, đồ uống đóng chai sẵn về WAITER qua `targetStation`, `WAITER_PREP`). |
| **07** | [07_Entity_Bill_Va_PaymentMethod.md](07_Entity_Bill_Va_PaymentMethod.md) | Quản lý hóa đơn & thanh toán: `PaymentMethod.java`, `BillStatus.java`, Entity `Bill.java` (Lombok; Thu ngân chốt ca cần Quản lý duyệt qua PIN 6 số). |
| **08** | [08_Entity_Reservation_Va_Enum_ReservationStatus.md](08_Entity_Reservation_Va_Enum_ReservationStatus.md) | Quản lý đặt bàn trực tuyến: `ReservationStatus.java`, Entity `Reservation.java`, `ReservationItem.java` (Lombok; hỗ trợ đặt món trước `preOrderTotal`). |
| **09** | [09_Repository_Layer_Spring_Data_JPA.md](09_Repository_Layer_Spring_Data_JPA.md) | Tầng truy vấn CSDL: Tạo 9 interface Repository kế thừa `JpaRepository` với các hàm Derived Query chuẩn xác theo tên thuộc tính Entity. |
| **10** | [10_ApiResponse_Va_GlobalExceptionHandler.md](10_ApiResponse_Va_GlobalExceptionHandler.md) | Chuẩn hóa API & Bắt lỗi: `ApiResponse<T>` (Lombok `@Getter`, `@Setter`, `@Builder`), `AppException` (`@Getter`), bộ xử lý lỗi toàn cục `GlobalExceptionHandler`. |
| **11** | [11_Spring_Security_Va_JWT_Authentication.md](11_Spring_Security_Va_JWT_Authentication.md) | Bảo mật & Phân quyền: Cầu nối `UserDetailsServiceImpl.java` (Lombok `@RequiredArgsConstructor`, nạp `pinCode`), `JwtAuthenticationFilter.java` (`@RequiredArgsConstructor`), `JwtUtils.java` và `SecurityConfig.java`. |
| **12** | [12_AuthService_Va_Login_Api.md](12_AuthService_Va_Login_Api.md) | **Full-Stack (Backend + Frontend)**: Đăng nhập ca trực & Phân quyền RBAC. Backend (DTOs, Service, Controller, Security JWT, Lombok) và Frontend (Vite Proxy, Axios Client, AuthContext, StaffLoginPage, ProtectedRoute). |
| **13** | [13_Quan_Ly_Ban_Va_Ma_QR.md](13_Quan_Ly_Ban_Va_Ma_QR.md) | **Full-Stack (Backend + Frontend)**: Quản lý sơ đồ bàn & mã QR: 5 thẻ KPI thống kê, DTOs (`CreateTableRequest`, `UpdateTableStatusRequest`, `TableSummaryResponse`, `TableResponse`), `RestaurantTableServiceImpl`, Controllers (`AdminTableController`, `CustomerTableController`), Seed data 18 bàn SQL Server và `tableApi.js`. |
| **14** | [14_Khoi_Tao_Va_Kien_Truc_Frontend.md](14_Khoi_Tao_Va_Kien_Truc_Frontend.md) | Khởi tạo và kiến trúc tổng quan Frontend React Vite + TailwindCSS. |
| **15** | [15_Bao_Cao_Doanh_Thu_Va_Van_Hanh_Reports_Analytics.md](15_Bao_Cao_Doanh_Thu_Va_Van_Hanh_Reports_Analytics.md) | **Full-Stack (Backend & Frontend)**: Báo cáo Doanh thu & Vận hành (`http://localhost:5173/admin/reports`). Backend (DTOs, Repository JPQL, ReportService, ReportController) và Frontend (reportApi, Bộ lọc thời gian linh hoạt, Biểu đồ khung giờ, Phân bổ thanh toán, Top món bán chạy, Xuất Excel UTF-8 & In Báo cáo). |
| **16** | [16_Dat_Ban_Truoc_Customer_Va_Quan_Ly_Reservation.md](16_Dat_Ban_Truoc_Customer_Va_Quan_Ly_Reservation.md) | **Full-Stack (Backend & Frontend)**: Đặt bàn trước trực tuyến (`http://localhost:5173/reservation`) & Điều phối xếp bàn (`/admin/reservations`). Date Picker chọn ngày cụ thể, khung giờ/số khách đại diện kèm nhập tùy ý, danh sách khu vực động từ DB, quy trình Quản lý gọi điện thoại xác nhận theo SĐT và xếp bàn trống. |
| **17** | [17_Hoan_Thien_Ma_QR_Va_In_Tem_Ban_Toan_Dien.md](17_Hoan_Thien_Ma_QR_Va_In_Tem_Ban_Toan_Dien.md) | **Full-Stack**: Hoàn thiện in tem mã QR cho toàn bộ bàn ăn, quản lý token bàn và định tuyến khách hàng. |
| **18** | [18_Hoan_Thien_Goi_Mon_Tai_Ban_Va_Van_Hanh_Waiter.md](18_Hoan_Thien_Goi_Mon_Tai_Ban_Va_Van_Hanh_Waiter.md) | **Full-Stack (Backend & Frontend)**: Nghiệp vụ trạm phục vụ bàn (Waiter Floor Plan), mở bàn, gọi thêm món tại bàn, bảo toàn dữ liệu qua polling 5s, chuyển bàn và yêu cầu thanh toán POS. |
| **19** | [19_Hoan_Thien_Man_Hinh_Bep_KDS_Va_Lien_Thong_Don_Mon.md](19_Hoan_Thien_Man_Hinh_Bep_KDS_Va_Lien_Thong_Don_Mon.md) | **Full-Stack (Backend & Frontend)**: Màn hình Bếp KDS (Kitchen Display System), xóa bỏ 100% Mock, liên thông đơn món Waiter $\leftrightarrow$ KDS $\leftrightarrow$ POS, tick hoàn thành từng món, ưu tiên Hỏa Tốc (RUSH), chuông âm báo Web Audio Chime, polling 5s và Script SQL sinh dữ liệu test phong phú. |
| **20** | [20_Hoan_Thien_Tram_Thu_Ngan_POS_Va_Thanh_Toan_Hoa_Don.md](20_Hoan_Thien_Tram_Thu_Ngan_POS_Va_Thanh_Toan_Hoa_Don.md) | **Full-Stack (Backend & Frontend)**: Trạm Thu Ngân POS (Cashier Terminal), xóa bỏ 100% Mock, liên thông tiếp nhận yêu cầu tính tiền từ Waiter, xem tạm tính, in phiếu tạm tính, giảm giá, VietQR động chuẩn NAPAS, chốt bill lưu CSDL, tự động đóng phiên và chuyển bàn DIRTY, Lịch sử hóa đơn, Đối soát két tiền và Bàn giao ca có Quản lý duyệt PIN. |

---

*Tài liệu được tinh gọn với Project Lombok, đồng bộ và cập nhật tương thích 100% giữa Backend Spring Boot và Frontend React ROMS.*


