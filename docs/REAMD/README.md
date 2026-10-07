# MỤC LỤC TÀI LIỆU HƯỚNG DẪN XÂY DỰNG BACKEND ROMS (CHUẨN LOMBOK)

> Thư mục tổng hợp các bước hướng dẫn code Backend dự án **ROMS** (Spring Boot 3.4.5, Java 21, Spring Data JPA, Spring Security 6, SQL Server, **Project Lombok**).  
> **Nguyên tắc:** Mỗi file chỉ tập trung mô tả **bước đó làm gì** và **các file code làm gì**, áp dụng **Project Lombok** (`@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder`, `@RequiredArgsConstructor`) để loại bỏ hoàn toàn các mã thừa boilerplate.

---

## 📋 Danh Sách Các Bước Hướng Dẫn:

| STT | File hướng dẫn | Bước đó làm gì & Các file code tạo ra (Sử dụng Lombok) |
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
| **09** | [09_Repository_Layer_Spring_Data_JPA.md](09_Repository_Layer_Spring_Data_JPA.md) | Tầng truy vấn CSDL: Tạo 9 interface Repository kế thừa `JpaRepository` với các hàm Derived Query phục vụ nghiệp vụ. |
| **10** | [10_ApiResponse_Va_GlobalExceptionHandler.md](10_ApiResponse_Va_GlobalExceptionHandler.md) | Chuẩn hóa API & Bắt lỗi: `ApiResponse<T>` (Lombok `@Getter`, `@Setter`, `@Builder`), `AppException` (`@Getter`), bộ xử lý lỗi toàn cục `GlobalExceptionHandler`. |
| **11** | [11_Spring_Security_Va_JWT_Authentication.md](11_Spring_Security_Va_JWT_Authentication.md) | Bảo mật & Phân quyền: Cầu nối `UserDetailsServiceImpl.java` (Lombok `@RequiredArgsConstructor`, nạp `pinCode`), `JwtAuthenticationFilter.java` (`@RequiredArgsConstructor`), `JwtUtils.java` và `SecurityConfig.java`. |
| **12** | [12_AuthService_Va_Login_Api.md](12_AuthService_Va_Login_Api.md) | Xác thực & Đăng nhập ca trực: DTOs `LoginRequest`, `LoginResponse`, `VerifyManagerPinRequest` (Lombok `@Data`, `@Builder`), `AuthServiceImpl` và `AuthController` (`@RequiredArgsConstructor`). |
| **13** | [13_Quan_Ly_Ban_Va_Ma_QR.md](13_Quan_Ly_Ban_Va_Ma_QR.md) | Nghiệp vụ Quản lý bàn & QR: DTOs `CreateTableRequest`, `UpdateTableStatusRequest`, `TableResponse` (Lombok `@Data`), `RestaurantTableServiceImpl` và Controllers (`@RequiredArgsConstructor`). |
| **14** | [14_Khoi_Tao_Va_Kien_Truc_Frontend.md](14_Khoi_Tao_Va_Kien_Truc_Frontend.md) | Khởi tạo và kiến trúc tổng quan Frontend React Vite + TailwindCSS. |

---

*Tài liệu được tinh gọn với Project Lombok, đồng bộ và cập nhật tương thích 100% với Frontend ROMS.*
