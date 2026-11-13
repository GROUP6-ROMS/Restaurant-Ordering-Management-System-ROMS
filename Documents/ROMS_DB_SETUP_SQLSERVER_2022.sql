-- ====================================================================================================
-- PROJECT: RESTAURANT ORDERING MANAGEMENT SYSTEM (ROMS)
-- COURSE: SWP391 - FPT UNIVERSITY (SE1847 - GROUP 6)
-- TARGET DBMS: MICROSOFT SQL SERVER 2022
-- DESCRIPTION: COMPLETE DDL SCRIPT WITH FULL NVARCHAR UNICODE SUPPORT,
--              COMPOSITE INDEXES, SA LOGIN CONFIGURATION, AND INTEGRITY CONSTRAINTS.
-- ====================================================================================================

-- ====================================================================================================
-- PHẦN 1: CẤU HÌNH TÀI KHOẢN SA (SYSADMIN) VÀ BẢO MẬT HỆ THỐNG
-- ====================================================================================================
USE master;
GO

-- 1.1. Cấu hình mật khẩu, vô hiệu hóa policy hết hạn và kích hoạt tài khoản 'sa'
IF EXISTS (SELECT name FROM sys.server_principals WHERE name = 'sa')
BEGIN
    ALTER LOGIN [sa] WITH 
        PASSWORD = N'RomsPass123@2026', 
        CHECK_POLICY = OFF, 
        CHECK_EXPIRATION = OFF;
    ALTER LOGIN [sa] ENABLE;
    PRINT N'>> [BẢO MẬT] Đã cập nhật mật khẩu và kích hoạt tài khoản SA thành công: sa / RomsPass123@2026';
END
ELSE
BEGIN
    CREATE LOGIN [sa] WITH 
        PASSWORD = N'RomsPass123@2026', 
        CHECK_POLICY = OFF, 
        CHECK_EXPIRATION = OFF;
    ALTER SERVER ROLE [sysadmin] ADD MEMBER [sa];
    PRINT N'>> [BẢO MẬT] Đã tạo mới tài khoản SA và cấp quyền sysadmin: sa / RomsPass123@2026';
END
GO

-- ====================================================================================================
-- PHẦN 2: KHỞI TẠO CƠ SỞ DỮ LIỆU ROMS_DB
-- ====================================================================================================
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ROMS_DB')
BEGIN
    CREATE DATABASE ROMS_DB COLLATE SQL_Latin1_General_CP1_CI_AS;
    PRINT N'>> Đã tạo mới cơ sở dữ liệu ROMS_DB.';
END
ELSE
BEGIN
    PRINT N'>> Cơ sở dữ liệu ROMS_DB đã tồn tại sẵn.';
END
GO

USE ROMS_DB;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- Gán quyền db_owner cho tài khoản sa trên ROMS_DB
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = N'sa')
BEGIN
    -- sa mặc định là dbo trong database
    ALTER AUTHORIZATION ON DATABASE::ROMS_DB TO [sa];
END
GO

-- ====================================================================================================
-- PHẦN 3: DỌN DẸP BẢNG CŨ THEO THỨ TỰ RÀNG BUỘC PHÂN CẤP (DROP CON TRƯỚC - CHA SAU)
-- ====================================================================================================
DROP TABLE IF EXISTS reservation_items;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS service_requests;
DROP TABLE IF EXISTS bills;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS dining_sessions;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS staff_schedules;
DROP TABLE IF EXISTS staffs;
DROP TABLE IF EXISTS restaurant_tables;
DROP TABLE IF EXISTS zones;
DROP TABLE IF EXISTS restaurant_profiles;
GO

-- ====================================================================================================
-- PHẦN 4: ĐỊNH NGHĨA CÁC BẢNG (100% NVARCHAR CHO DỮ LIỆU CHỨA DẤU TIẾNG VIỆT)
-- ====================================================================================================

-- 1. BẢNG THÔNG TIN NHÀ HÀNG & THIẾT LẬP THANH TOÁN
CREATE TABLE restaurant_profiles (
    id BIGINT IDENTITY(1,1) NOT NULL,
    name NVARCHAR(150) NOT NULL,                      -- Tên nhà hàng (Tiếng Việt)
    brand_name NVARCHAR(150) NULL,                   -- Tên thương hiệu
    tagline NVARCHAR(255) NULL,                      -- Slogan / Khẩu hiệu
    address NVARCHAR(255) NULL,                      -- Địa chỉ nhà hàng
    phone VARCHAR(30) NOT NULL,
    tax_code VARCHAR(30) NULL,
    wifi_name NVARCHAR(100) NULL,                    -- Tên Wifi
    wifi_password NVARCHAR(100) NULL,
    footer_message NVARCHAR(255) NULL,               -- Lời chào/Cảm ơn in chân hóa đơn
    logo_url NVARCHAR(500) NULL,
    bank_account_name NVARCHAR(100) NULL,            -- Tên chủ tài khoản ngân hàng thụ hưởng
    bank_account_number VARCHAR(50) NULL,
    bank_name NVARCHAR(100) NULL,                    -- Tên ngân hàng (e.g., Ngân hàng TMCP Quân Đội - MBBank)
    bank_bin VARCHAR(20) NULL,                       -- Mã BIN ngân hàng VietQR
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_restaurant_profiles_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NULL,

    CONSTRAINT PK_restaurant_profiles PRIMARY KEY CLUSTERED (id)
);
GO

-- 2. BẢNG PHÂN KHU BÀN ĂN (ZONES)
CREATE TABLE zones (
    id BIGINT IDENTITY(1,1) NOT NULL,
    zone_code VARCHAR(50) NOT NULL,
    name NVARCHAR(100) NOT NULL,                     -- Tên khu vực (e.g., 'Khu Trong Nhà', 'Sân Vườn Tầng 2')
    description NVARCHAR(255) NULL,                  -- Mô tả khu vực
    display_order INT NOT NULL CONSTRAINT DF_zones_display_order DEFAULT 0,
    is_active BIT NOT NULL CONSTRAINT DF_zones_is_active DEFAULT 1,
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_zones_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NULL,

    CONSTRAINT PK_zones PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_zones_zone_code UNIQUE (zone_code)
);
GO

-- 3. BẢNG BÀN ĂN (RESTAURANT TABLES)
CREATE TABLE restaurant_tables (
    id BIGINT IDENTITY(1,1) NOT NULL,
    table_number NVARCHAR(30) NOT NULL,              -- Mã bàn hiển thị (e.g., 'Bàn 01', 'T-VIP-01')
    name NVARCHAR(100) NULL,                         -- Tên thân thiện của bàn
    zone NVARCHAR(50) NOT NULL CONSTRAINT DF_tables_zone DEFAULT N'Khu Vực 1',
    capacity INT NOT NULL,
    status VARCHAR(20) NOT NULL CONSTRAINT DF_tables_status DEFAULT 'AVAILABLE',
    blocked_reason NVARCHAR(255) NULL,               -- Lý do tạm khóa bàn (e.g., 'Hỏng chân bàn đang bảo trì')
    reservation_info NVARCHAR(255) NULL,             -- Tên khách / Ghi chú đặt trước
    reserved_time NVARCHAR(50) NULL,                 -- Giờ hẹn khách đến
    qr_token NVARCHAR(255) NULL,                     -- Chuỗi bảo mật định danh URL quét mã QR
    is_active BIT NOT NULL CONSTRAINT DF_tables_is_active DEFAULT 1,
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_tables_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NULL,

    CONSTRAINT PK_restaurant_tables PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_tables_table_number UNIQUE (table_number),
    CONSTRAINT CK_tables_capacity CHECK (capacity > 0 AND capacity <= 50),
    CONSTRAINT CK_tables_status CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'DIRTY', 'RESERVED', 'BLOCKED'))
);
GO

-- 4. BẢNG TÀI KHOẢN NHÂN VIÊN & BẢO MẬT MÃ PIN (STAFFS)
CREATE TABLE staffs (
    id BIGINT IDENTITY(1,1) NOT NULL,
    username VARCHAR(50) NOT NULL,                   -- Mã đăng nhập (MGR-001, EMP-001, KDS-001, CSH-001)
    pin_code VARCHAR(255) NOT NULL,                  -- BCrypt hash của mã PIN 6 số (123456)
    full_name NVARCHAR(100) NOT NULL,                -- Họ và tên đầy đủ (Dương Trong, Phạm Minh Đức, Ngô Viết Bảo Huy)
    phone VARCHAR(15) NULL,
    email NVARCHAR(100) NULL,
    role VARCHAR(20) NOT NULL,
    is_active BIT NOT NULL CONSTRAINT DF_staffs_is_active DEFAULT 1,
    is_on_shift BIT NOT NULL CONSTRAINT DF_staffs_is_on_shift DEFAULT 0,
    failed_pin_attempts INT NOT NULL CONSTRAINT DF_staffs_failed_attempts DEFAULT 0,
    locked_at DATETIME2(7) NULL,
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_staffs_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NULL,

    CONSTRAINT PK_staffs PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_staffs_username UNIQUE (username),
    CONSTRAINT CK_staffs_role CHECK (role IN ('MANAGER', 'WAITER', 'KITCHEN', 'CASHIER')),
    CONSTRAINT CK_staffs_failed_attempts CHECK (failed_pin_attempts >= 0),
    CONSTRAINT CK_staffs_phone CHECK (phone IS NULL OR (LEN(phone) >= 9 AND LEN(phone) <= 15))
);
GO

-- 5. BẢNG PHÂN CA LÀM VIỆC NHÂN VIÊN (STAFF SCHEDULES)
CREATE TABLE staff_schedules (
    id BIGINT IDENTITY(1,1) NOT NULL,
    staff_id BIGINT NOT NULL,
    work_date DATE NOT NULL,
    shift_type VARCHAR(30) NOT NULL,
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_staff_schedules_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NULL,

    CONSTRAINT PK_staff_schedules PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_staff_schedules_staff FOREIGN KEY (staff_id) REFERENCES staffs(id) ON DELETE CASCADE,
    CONSTRAINT UQ_staff_date_shift UNIQUE (staff_id, work_date, shift_type),
    CONSTRAINT CK_staff_schedules_shift CHECK (shift_type IN ('MORNING', 'EVENING'))
);
GO

-- 6. BẢNG DANH MỤC THỰC ĐƠN (CATEGORIES)
CREATE TABLE categories (
    id BIGINT IDENTITY(1,1) NOT NULL,
    name NVARCHAR(100) NOT NULL,                     -- Tên danh mục (e.g., 'Món Khai Vị', 'Món Nướng Đặc Biệt', 'Đồ Uống')
    description NVARCHAR(255) NULL,                  -- Mô tả danh mục
    display_order INT NOT NULL CONSTRAINT DF_categories_display_order DEFAULT 0,
    is_active BIT NOT NULL CONSTRAINT DF_categories_is_active DEFAULT 1,
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_categories_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NULL,

    CONSTRAINT PK_categories PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_categories_name UNIQUE (name)
);
GO

-- 7. BẢNG MÓN ĂN & ĐỒ UỐNG (MENU ITEMS)
CREATE TABLE menu_items (
    id BIGINT IDENTITY(1,1) NOT NULL,
    category_id BIGINT NOT NULL,
    sku VARCHAR(50) NOT NULL,
    name NVARCHAR(150) NOT NULL,                     -- Tên món có dấu (e.g., 'Phở Bò Tái Lăn', 'Bò Lúc Lắc Khoai Tây')
    description NVARCHAR(500) NULL,                  -- Mô tả chi tiết món ăn & nguyên liệu
    price DECIMAL(12,2) NOT NULL,
    cost_price DECIMAL(12,2) NOT NULL CONSTRAINT DF_menu_items_cost DEFAULT 0.00,
    station NVARCHAR(20) NOT NULL CONSTRAINT DF_menu_items_station DEFAULT N'KITCHEN',
    tag NVARCHAR(50) NULL,                           -- Nhãn phân loại (e.g., 'Món Bán Chạy', 'Món Mới', 'Cay')
    image_url NVARCHAR(500) NULL,
    is_available BIT NOT NULL CONSTRAINT DF_menu_items_available DEFAULT 1,
    daily_stock INT NULL,
    remaining_stock INT NULL,
    display_order INT NOT NULL CONSTRAINT DF_menu_items_display_order DEFAULT 0,
    is_active BIT NOT NULL CONSTRAINT DF_menu_items_active DEFAULT 1,
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_menu_items_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NULL,

    CONSTRAINT PK_menu_items PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_menu_items_sku UNIQUE (sku),
    CONSTRAINT FK_menu_items_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT CK_menu_items_price CHECK (price >= 0),
    CONSTRAINT CK_menu_items_cost_price CHECK (cost_price >= 0),
    CONSTRAINT CK_menu_items_station CHECK (station IN (N'KITCHEN', N'BAR')),
    CONSTRAINT CK_menu_items_stock CHECK ((daily_stock IS NULL OR daily_stock >= 0) AND (remaining_stock IS NULL OR remaining_stock >= 0))
);
GO

-- 8. BẢNG PHIÊN ĂN TẠI BÀN (DINING SESSIONS)
CREATE TABLE dining_sessions (
    id BIGINT IDENTITY(1,1) NOT NULL,
    table_id BIGINT NOT NULL,
    session_token VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CONSTRAINT DF_dining_sessions_status DEFAULT 'ACTIVE',
    guest_count INT NULL,
    note NVARCHAR(255) NULL,                         -- Ghi chú phiên ăn (e.g., 'Bàn tổ chức tiệc sinh nhật')
    start_time DATETIME2(7) NOT NULL CONSTRAINT DF_dining_sessions_start DEFAULT SYSUTCDATETIME(),
    end_time DATETIME2(7) NULL,
    version BIGINT NOT NULL CONSTRAINT DF_dining_sessions_version DEFAULT 0, -- Kiểm soát đồng thời Optimistic Locking JPA
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_dining_sessions_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NULL,

    CONSTRAINT PK_dining_sessions PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_dining_sessions_token UNIQUE (session_token),
    CONSTRAINT FK_dining_sessions_table FOREIGN KEY (table_id) REFERENCES restaurant_tables(id),
    CONSTRAINT CK_dining_sessions_status CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED', 'CANCALLED')),
    CONSTRAINT CK_dining_sessions_guest CHECK (guest_count IS NULL OR (guest_count > 0 AND guest_count <= 50)),
    CONSTRAINT CK_dining_sessions_time CHECK (end_time IS NULL OR end_time >= start_time)
);
GO

-- 9. BẢNG ĐỢT GỌI MÓN (ORDERS)
CREATE TABLE orders (
    id BIGINT IDENTITY(1,1) NOT NULL,
    session_id BIGINT NOT NULL,
    staff_id BIGINT NULL,                            -- NULL nếu thực khách tự đặt qua QR
    order_code VARCHAR(50) NOT NULL,
    note NVARCHAR(255) NULL,                         -- Ghi chú đợt gọi món (e.g., 'Làm nhanh cho khách uống thuốc')
    order_time DATETIME2(7) NOT NULL CONSTRAINT DF_orders_order_time DEFAULT SYSUTCDATETIME(),
    status VARCHAR(20) NOT NULL CONSTRAINT DF_orders_status DEFAULT 'SUBMITTED',
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_orders_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NULL,

    CONSTRAINT PK_orders PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_orders_order_code UNIQUE (order_code),
    CONSTRAINT FK_orders_session FOREIGN KEY (session_id) REFERENCES dining_sessions(id) ON DELETE CASCADE,
    CONSTRAINT FK_orders_staff FOREIGN KEY (staff_id) REFERENCES staffs(id),
    CONSTRAINT CK_orders_status CHECK (status IN ('SUBMITTED', 'CONFIRMED', 'COOKING', 'READY', 'SERVED', 'CANCELLED', 'PENDING', 'PREPARING'))
);
GO

-- 10. BẢNG CHI TIẾT TỪNG MÓN TRONG ĐỢT GỌI (ORDER ITEMS)
CREATE TABLE order_items (
    id BIGINT IDENTITY(1,1) NOT NULL,
    order_id BIGINT NOT NULL,
    menu_item_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    note NVARCHAR(255) NULL,                         -- Ghi chú khẩu vị món (e.g., 'Không hành tây, nhiều nước béo')
    status VARCHAR(20) NOT NULL CONSTRAINT DF_order_items_status DEFAULT 'PENDING',
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_order_items_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NULL,

    CONSTRAINT PK_order_items PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT FK_order_items_menu_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
    CONSTRAINT CK_order_items_quantity CHECK (quantity > 0 AND quantity <= 100),
    CONSTRAINT CK_order_items_unit_price CHECK (unit_price >= 0),
    CONSTRAINT CK_order_items_subtotal CHECK (subtotal >= 0),
    CONSTRAINT CK_order_items_status CHECK (status IN ('PENDING', 'COOKING', 'READY', 'SERVED', 'CANCELLED'))
);
GO

-- 11. BẢNG HÓA ĐƠN THANH TOÁN (BILLS / POS SETTLEMENT)
CREATE TABLE bills (
    id BIGINT IDENTITY(1,1) NOT NULL,
    session_id BIGINT NOT NULL,
    cashier_id BIGINT NULL,
    bill_code VARCHAR(50) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL CONSTRAINT DF_bills_tax DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL CONSTRAINT DF_bills_discount DEFAULT 0.00,
    final_amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(30) NULL,
    status VARCHAR(20) NOT NULL CONSTRAINT DF_bills_status DEFAULT 'UNPAID',
    payment_time DATETIME2(7) NULL,
    note NVARCHAR(255) NULL,                         -- Ghi chú thanh toán / lý do giảm giá
    payos_order_code BIGINT NULL,
    payos_payment_link_id VARCHAR(100) NULL,
    payos_qr_code NVARCHAR(1000) NULL,
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_bills_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NULL,

    CONSTRAINT PK_bills PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_bills_session UNIQUE (session_id),
    CONSTRAINT UQ_bills_bill_code UNIQUE (bill_code),
    CONSTRAINT UQ_bills_payos_order_code UNIQUE (payos_order_code),
    CONSTRAINT FK_bills_session FOREIGN KEY (session_id) REFERENCES dining_sessions(id),
    CONSTRAINT FK_bills_cashier FOREIGN KEY (cashier_id) REFERENCES staffs(id),
    CONSTRAINT CK_bills_status CHECK (status IN ('UNPAID', 'PAID', 'CANCELLED')),
    CONSTRAINT CK_bills_payment_method CHECK (payment_method IS NULL OR payment_method IN ('CASH', 'BANK_TRANSFER', 'CARD')),
    CONSTRAINT CK_bills_amounts CHECK (subtotal >= 0 AND tax_amount >= 0 AND discount_amount >= 0 AND final_amount >= 0)
);
GO

-- 12. BẢNG YÊU CẦU DỊCH VỤ / PHỤC VỤ TẠI BÀN (SERVICE REQUESTS)
CREATE TABLE service_requests (
    id BIGINT IDENTITY(1,1) NOT NULL,
    table_id BIGINT NOT NULL,
    session_id BIGINT NULL,
    staff_id BIGINT NULL,
    request_type NVARCHAR(100) NOT NULL,             -- Loại yêu cầu (e.g., 'Xin thêm đá lạnh', 'Mang thìa đũa', 'Gọi tính tiền')
    note NVARCHAR(255) NULL,                         -- Chi tiết yêu cầu từ khách
    status VARCHAR(20) NOT NULL CONSTRAINT DF_service_requests_status DEFAULT 'PENDING',
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_service_requests_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NULL,

    CONSTRAINT PK_service_requests PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_service_requests_table FOREIGN KEY (table_id) REFERENCES restaurant_tables(id),
    CONSTRAINT FK_service_requests_session FOREIGN KEY (session_id) REFERENCES dining_sessions(id),
    CONSTRAINT FK_service_requests_staff FOREIGN KEY (staff_id) REFERENCES staffs(id),
    CONSTRAINT CK_service_requests_status CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'))
);
GO

-- 13. BẢNG ĐẶT BÀN TRƯỚC TRỰC TUYẾN (RESERVATIONS)
CREATE TABLE reservations (
    id BIGINT IDENTITY(1,1) NOT NULL,
    booking_code VARCHAR(50) NULL,
    table_id BIGINT NULL,
    requested_zone NVARCHAR(50) NULL,                -- Khu vực khách mong muốn ngồi
    customer_name NVARCHAR(100) NOT NULL,            -- Họ tên người đặt bàn (Tiếng Việt)
    customer_phone VARCHAR(15) NOT NULL,
    customer_email NVARCHAR(100) NULL,
    guest_count INT NOT NULL,
    reservation_time DATETIME2(7) NOT NULL,
    status VARCHAR(20) NOT NULL CONSTRAINT DF_reservations_status DEFAULT 'PENDING',
    note NVARCHAR(255) NULL,                         -- Ghi chú đặt chỗ (e.g., 'Cần góc yên tĩnh để tiếp đối tác')
    cancel_reason NVARCHAR(255) NULL,                -- Lý do hủy đơn đặt
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_reservations_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NULL,

    CONSTRAINT PK_reservations PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_reservations_booking_code UNIQUE (booking_code),
    CONSTRAINT FK_reservations_table FOREIGN KEY (table_id) REFERENCES restaurant_tables(id),
    CONSTRAINT CK_reservations_guest_count CHECK (guest_count > 0 AND guest_count <= 100),
    CONSTRAINT CK_reservations_status CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'))
);
GO

-- 14. BẢNG MÓN ĂN GỌI TRƯỚC THEO ĐƠN ĐẶT BÀN (RESERVATION ITEMS)
CREATE TABLE reservation_items (
    id BIGINT IDENTITY(1,1) NOT NULL,
    reservation_id BIGINT NOT NULL,
    menu_item_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    note NVARCHAR(255) NULL,                         -- Ghi chú chuẩn bị trước cho món
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_reservation_items_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(7) NULL,

    CONSTRAINT PK_reservation_items PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_reservation_items_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    CONSTRAINT FK_reservation_items_menu_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
    CONSTRAINT CK_reservation_items_quantity CHECK (quantity > 0 AND quantity <= 100),
    CONSTRAINT CK_reservation_items_unit_price CHECK (unit_price >= 0),
    CONSTRAINT CK_reservation_items_subtotal CHECK (subtotal >= 0)
);
GO

-- ====================================================================================================
-- PHẦN 5: CHỈ MỤC TỐI ƯU TRUY VẤN (BAO GỒM COMPOSITE INDEX THEO YÊU CẦU)
-- ====================================================================================================

-- 5.1. COMPOSITE INDEX QUAN TRỌNG TRÊN dining_sessions (table_id, status)
-- Giúp tăng tốc vượt trội khi kiểm tra bàn có đang có phiên ăn ACTIVE không (Floor Plan & Quét QR)
CREATE NONCLUSTERED INDEX IX_dining_sessions_table_id_status 
ON dining_sessions (table_id, status)
INCLUDE (session_token, guest_count, start_time);
GO

-- 5.2. Các chỉ mục bổ trợ truy vấn thời gian thực khác
CREATE NONCLUSTERED INDEX IX_restaurant_tables_status_zone ON restaurant_tables (status, zone);
CREATE NONCLUSTERED INDEX IX_restaurant_tables_qr_token ON restaurant_tables (qr_token) WHERE qr_token IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_menu_items_cat_active ON menu_items (category_id, is_active, is_available);
CREATE NONCLUSTERED INDEX IX_orders_session_id ON orders (session_id);
CREATE NONCLUSTERED INDEX IX_orders_status_time ON orders (status, order_time);
CREATE NONCLUSTERED INDEX IX_order_items_order_status ON order_items (order_id, status);
CREATE NONCLUSTERED INDEX IX_bills_payment_time_status ON bills (payment_time, status) WHERE status = 'PAID';
CREATE NONCLUSTERED INDEX IX_reservations_time_status ON reservations (reservation_time, status);
GO

-- ====================================================================================================
-- PHẦN 6: KIỂM TRA TÍNH TOÀN VẸN CỦA DỮ LIỆU UNICODE VỚI TIẾNG VIỆT
-- ====================================================================================================
PRINT '=============================================================================================';
PRINT '  >> KHỞI TẠO THÀNH CÔNG HỆ THỐNG CƠ SỞ DỮ LIỆU ROMS_DB TRÊN SQL SERVER 2022!';
PRINT '  >> Đã cấu hình tài khoản SA: sa / RomsPass123@2026';
PRINT '  >> Đã hỗ trợ 100% NVARCHAR Unicode cho toàn bộ các trường tiếng Việt có dấu.';
PRINT '  >> Đã tạo Composite Index: IX_dining_sessions_table_id_status (table_id, status).';
PRINT '=============================================================================================';
GO
