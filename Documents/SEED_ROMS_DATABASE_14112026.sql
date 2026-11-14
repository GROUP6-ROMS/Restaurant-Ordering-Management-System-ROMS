-- =====================================================================
-- ROMS MASTER DATABASE SEEDING SCRIPT FOR SWP391 DEFENSE (14/11/2026)
-- Designed for Team Lead: Dương Trong (Group 6 - Đại học FPT)
-- =====================================================================
USE ROMS_DB;
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

-- 1. CHUẨN HÓA 4 TÀI KHOẢN NHÂN VIÊN CHÍNH (PIN: 123456)

IF EXISTS (SELECT 1 FROM staffs WHERE username = 'MGR-001')
BEGIN
    UPDATE staffs
    SET full_name = N'Dương Trong', role = 'MANAGER', pin_code = '$2a$10$7GmFAwcfusJekdJb9QtZmepV7O0CcMV7PqbXducivujQ2e0qtykUO',
        email = 'roms.service.restaurant@gmail.com', phone = '0905982428', is_active = 1, is_on_shift = 0, failed_pin_attempts = 0
    WHERE username = 'MGR-001';
END
ELSE
BEGIN
    INSERT INTO staffs (username, full_name, role, pin_code, email, phone, is_active, is_on_shift, failed_pin_attempts, created_at, updated_at)
    VALUES ('MGR-001', N'Dương Trong', 'MANAGER', '$2a$10$7GmFAwcfusJekdJb9QtZmepV7O0CcMV7PqbXducivujQ2e0qtykUO', 'roms.service.restaurant@gmail.com', '0905982428', 1, 0, 0, GETDATE(), GETDATE());
END


IF EXISTS (SELECT 1 FROM staffs WHERE username = 'EMP-001')
BEGIN
    UPDATE staffs
    SET full_name = N'Phạm Minh Đức', role = 'WAITER', pin_code = '$2a$10$7GmFAwcfusJekdJb9QtZmepV7O0CcMV7PqbXducivujQ2e0qtykUO',
        email = 'ducpm.swp391@gmail.com', phone = '0905123456', is_active = 1, is_on_shift = 0, failed_pin_attempts = 0
    WHERE username = 'EMP-001';
END
ELSE
BEGIN
    INSERT INTO staffs (username, full_name, role, pin_code, email, phone, is_active, is_on_shift, failed_pin_attempts, created_at, updated_at)
    VALUES ('EMP-001', N'Phạm Minh Đức', 'WAITER', '$2a$10$7GmFAwcfusJekdJb9QtZmepV7O0CcMV7PqbXducivujQ2e0qtykUO', 'ducpm.swp391@gmail.com', '0905123456', 1, 0, 0, GETDATE(), GETDATE());
END


IF EXISTS (SELECT 1 FROM staffs WHERE username = 'KDS-001')
BEGIN
    UPDATE staffs
    SET full_name = N'Ngô Viết Bảo Huy', role = 'KITCHEN', pin_code = '$2a$10$7GmFAwcfusJekdJb9QtZmepV7O0CcMV7PqbXducivujQ2e0qtykUO',
        email = 'huynvb.swp391@gmail.com', phone = '0905982428', is_active = 1, is_on_shift = 0, failed_pin_attempts = 0
    WHERE username = 'KDS-001';
END
ELSE
BEGIN
    INSERT INTO staffs (username, full_name, role, pin_code, email, phone, is_active, is_on_shift, failed_pin_attempts, created_at, updated_at)
    VALUES ('KDS-001', N'Ngô Viết Bảo Huy', 'KITCHEN', '$2a$10$7GmFAwcfusJekdJb9QtZmepV7O0CcMV7PqbXducivujQ2e0qtykUO', 'huynvb.swp391@gmail.com', '0905982428', 1, 0, 0, GETDATE(), GETDATE());
END


IF EXISTS (SELECT 1 FROM staffs WHERE username = 'CSH-001')
BEGIN
    UPDATE staffs
    SET full_name = N'Đỗ Võ Thanh Trung', role = 'CASHIER', pin_code = '$2a$10$7GmFAwcfusJekdJb9QtZmepV7O0CcMV7PqbXducivujQ2e0qtykUO',
        email = 'trungdvt.swp391@gmail.com', phone = '0905789123', is_active = 1, is_on_shift = 0, failed_pin_attempts = 0
    WHERE username = 'CSH-001';
END
ELSE
BEGIN
    INSERT INTO staffs (username, full_name, role, pin_code, email, phone, is_active, is_on_shift, failed_pin_attempts, created_at, updated_at)
    VALUES ('CSH-001', N'Đỗ Võ Thanh Trung', 'CASHIER', '$2a$10$7GmFAwcfusJekdJb9QtZmepV7O0CcMV7PqbXducivujQ2e0qtykUO', 'trungdvt.swp391@gmail.com', '0905789123', 1, 0, 0, GETDATE(), GETDATE());
END

-- 2. CHUẨN HÓA 3 PHÂN KHU (ZONE_1, ZONE_2, VIP) & XÓA VĨNH VIỄN ZONE RÁC

UPDATE zones SET is_active = 1, name = N'Tầng 1 - Sảnh Chính' WHERE zone_code = 'ZONE_1';
UPDATE zones SET is_active = 1, name = N'Tầng 2 - Ban Công & Sân Vườn' WHERE zone_code = 'ZONE_2';
UPDATE zones SET is_active = 1, name = N'Phòng VIP Riêng Tư' WHERE zone_code = 'VIP';
DELETE FROM zones WHERE zone_code NOT IN ('ZONE_1', 'ZONE_2', 'VIP');

-- 3. LÀM SẠCH CÁC BẢNG GIAO DỊCH TEST ĐỂ CHUẨN BỊ BƠM DỮ LIỆU CHUẨN

DELETE FROM service_requests;
DELETE FROM reservation_items;
DELETE FROM reservations;
DELETE FROM bills;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM dining_sessions;

-- 4. THIẾT LẬP ĐÚNG 10 BÀN ĂN CHIA ĐỀU 3 KHU VỰC & XÓA VĨNH VIỄN CÁC BÀN RÁC

DELETE FROM restaurant_tables 
WHERE table_number NOT IN ('T-01','T-02','T-03','T-04','B-01','B-02','B-03','VIP-01','VIP-02','VIP-03');


IF EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'T-01')
BEGIN
    UPDATE restaurant_tables
    SET name = N'T-01', zone = 'ZONE_1', status = 'AVAILABLE', capacity = 4,
        qr_token = 'qr-t-01-a9f8e7d6', blocked_reason = NULL, reservation_info = NULL,
        reserved_time = NULL, is_active = 1, updated_at = GETDATE()
    WHERE table_number = 'T-01';
END
ELSE
BEGIN
    INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, blocked_reason, reservation_info, reserved_time, qr_token, is_active, created_at, updated_at)
    VALUES ('T-01', N'T-01', 'ZONE_1', 4, 'AVAILABLE', NULL, NULL, NULL, 'qr-t-01-a9f8e7d6', 1, GETDATE(), GETDATE());
END


IF EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'T-02')
BEGIN
    UPDATE restaurant_tables
    SET name = N'T-02', zone = 'ZONE_1', status = 'AVAILABLE', capacity = 4,
        qr_token = 'qr-t-02-b8e7d6c5', blocked_reason = NULL, reservation_info = NULL,
        reserved_time = NULL, is_active = 1, updated_at = GETDATE()
    WHERE table_number = 'T-02';
END
ELSE
BEGIN
    INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, blocked_reason, reservation_info, reserved_time, qr_token, is_active, created_at, updated_at)
    VALUES ('T-02', N'T-02', 'ZONE_1', 4, 'AVAILABLE', NULL, NULL, NULL, 'qr-t-02-b8e7d6c5', 1, GETDATE(), GETDATE());
END


IF EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'T-03')
BEGIN
    UPDATE restaurant_tables
    SET name = N'T-03', zone = 'ZONE_1', status = 'OCCUPIED', capacity = 2,
        qr_token = 'qr-t-03-c7d6c5b4', blocked_reason = NULL, reservation_info = NULL,
        reserved_time = NULL, is_active = 1, updated_at = GETDATE()
    WHERE table_number = 'T-03';
END
ELSE
BEGIN
    INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, blocked_reason, reservation_info, reserved_time, qr_token, is_active, created_at, updated_at)
    VALUES ('T-03', N'T-03', 'ZONE_1', 2, 'OCCUPIED', NULL, NULL, NULL, 'qr-t-03-c7d6c5b4', 1, GETDATE(), GETDATE());
END


IF EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'T-04')
BEGIN
    UPDATE restaurant_tables
    SET name = N'T-04', zone = 'ZONE_1', status = 'DIRTY', capacity = 6,
        qr_token = 'qr-t-04-d6c5b4a3', blocked_reason = NULL, reservation_info = NULL,
        reserved_time = NULL, is_active = 1, updated_at = GETDATE()
    WHERE table_number = 'T-04';
END
ELSE
BEGIN
    INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, blocked_reason, reservation_info, reserved_time, qr_token, is_active, created_at, updated_at)
    VALUES ('T-04', N'T-04', 'ZONE_1', 6, 'DIRTY', NULL, NULL, NULL, 'qr-t-04-d6c5b4a3', 1, GETDATE(), GETDATE());
END


IF EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'B-01')
BEGIN
    UPDATE restaurant_tables
    SET name = N'B-01', zone = 'ZONE_2', status = 'OCCUPIED', capacity = 4,
        qr_token = 'qr-b-01-e5b4a392', blocked_reason = NULL, reservation_info = NULL,
        reserved_time = NULL, is_active = 1, updated_at = GETDATE()
    WHERE table_number = 'B-01';
END
ELSE
BEGIN
    INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, blocked_reason, reservation_info, reserved_time, qr_token, is_active, created_at, updated_at)
    VALUES ('B-01', N'B-01', 'ZONE_2', 4, 'OCCUPIED', NULL, NULL, NULL, 'qr-b-01-e5b4a392', 1, GETDATE(), GETDATE());
END


IF EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'B-02')
BEGIN
    UPDATE restaurant_tables
    SET name = N'B-02', zone = 'ZONE_2', status = 'AVAILABLE', capacity = 2,
        qr_token = 'qr-b-02-f4a39281', blocked_reason = NULL, reservation_info = NULL,
        reserved_time = NULL, is_active = 1, updated_at = GETDATE()
    WHERE table_number = 'B-02';
END
ELSE
BEGIN
    INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, blocked_reason, reservation_info, reserved_time, qr_token, is_active, created_at, updated_at)
    VALUES ('B-02', N'B-02', 'ZONE_2', 2, 'AVAILABLE', NULL, NULL, NULL, 'qr-b-02-f4a39281', 1, GETDATE(), GETDATE());
END


IF EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'B-03')
BEGIN
    UPDATE restaurant_tables
    SET name = N'B-03', zone = 'ZONE_2', status = 'BLOCKED', capacity = 6,
        qr_token = 'qr-b-03-03928170', blocked_reason = N'Bảo trì hệ thống quạt thông gió & đèn rọi', reservation_info = NULL,
        reserved_time = NULL, is_active = 1, updated_at = GETDATE()
    WHERE table_number = 'B-03';
END
ELSE
BEGIN
    INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, blocked_reason, reservation_info, reserved_time, qr_token, is_active, created_at, updated_at)
    VALUES ('B-03', N'B-03', 'ZONE_2', 6, 'BLOCKED', N'Bảo trì hệ thống quạt thông gió & đèn rọi', NULL, NULL, 'qr-b-03-03928170', 1, GETDATE(), GETDATE());
END


IF EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'VIP-01')
BEGIN
    UPDATE restaurant_tables
    SET name = N'VIP-01', zone = 'VIP', status = 'AVAILABLE', capacity = 8,
        qr_token = 'qr-vip-01-12817069', blocked_reason = NULL, reservation_info = NULL,
        reserved_time = NULL, is_active = 1, updated_at = GETDATE()
    WHERE table_number = 'VIP-01';
END
ELSE
BEGIN
    INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, blocked_reason, reservation_info, reserved_time, qr_token, is_active, created_at, updated_at)
    VALUES ('VIP-01', N'VIP-01', 'VIP', 8, 'AVAILABLE', NULL, NULL, NULL, 'qr-vip-01-12817069', 1, GETDATE(), GETDATE());
END


IF EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'VIP-02')
BEGIN
    UPDATE restaurant_tables
    SET name = N'VIP-02', zone = 'VIP', status = 'RESERVED', capacity = 10,
        qr_token = 'qr-vip-02-21706958', blocked_reason = NULL, reservation_info = N'Anh Tuấn FPT (0912.345.678)',
        reserved_time = N'16:00', is_active = 1, updated_at = GETDATE()
    WHERE table_number = 'VIP-02';
END
ELSE
BEGIN
    INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, blocked_reason, reservation_info, reserved_time, qr_token, is_active, created_at, updated_at)
    VALUES ('VIP-02', N'VIP-02', 'VIP', 10, 'RESERVED', NULL, N'Anh Tuấn FPT (0912.345.678)', N'16:00', 'qr-vip-02-21706958', 1, GETDATE(), GETDATE());
END


IF EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'VIP-03')
BEGIN
    UPDATE restaurant_tables
    SET name = N'VIP-03', zone = 'VIP', status = 'AVAILABLE', capacity = 12,
        qr_token = 'qr-vip-03-30695847', blocked_reason = NULL, reservation_info = NULL,
        reserved_time = NULL, is_active = 1, updated_at = GETDATE()
    WHERE table_number = 'VIP-03';
END
ELSE
BEGIN
    INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, blocked_reason, reservation_info, reserved_time, qr_token, is_active, created_at, updated_at)
    VALUES ('VIP-03', N'VIP-03', 'VIP', 12, 'AVAILABLE', NULL, NULL, NULL, 'qr-vip-03-30695847', 1, GETDATE(), GETDATE());
END

-- 5. KÍCH HOẠT THỰC ĐƠN MÓN ĂN & CẬP NHẬT TỒN KHO

UPDATE menu_items
SET is_available = 1, daily_stock = 50, remaining_stock = 50, is_active = 1
WHERE id <= 26;

-- 6. TẠO DỮ LIỆU LỊCH SỬ TỪ 01/11/2026 ĐẾN 13/11/2026 CHO BÁO CÁO & THỐNG KÊ

INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-03-0100-0001', 'COMPLETED', 2, '2026-11-01 13:45:25', '2026-11-01 14:29:25', '2026-11-01 13:45:25', '2026-11-01 14:29:25'
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_id_2 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_2, 'ORD-20261101-0001', 3000.00, 'CONFIRMED', '2026-11-01 13:45:25', '2026-11-01 13:45:25', '2026-11-01 13:45:25');
DECLARE @o_id_2 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_2, 25, 1, 2000.00, 2000.00, 'SERVED', '2026-11-01 13:45:25', '2026-11-01 14:29:25');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_2, 23, 1, 1000.00, 1000.00, 'SERVED', '2026-11-01 13:45:25', '2026-11-01 14:29:25');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_2, 'BILL-20261101-0001', 3000.00, 0, 0, 3000.00, 'CASH', 'PAID', '2026-11-01 14:29:25', '2026-11-01 14:29:25', '2026-11-01 14:29:25');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-02-0101-0002', 'COMPLETED', 3, '2026-11-01 12:11:24', '2026-11-01 12:53:24', '2026-11-01 12:11:24', '2026-11-01 12:53:24'
FROM restaurant_tables WHERE table_number = 'VIP-02';
DECLARE @s_id_3 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_3, 'ORD-20261101-0002', 21000.00, 'CONFIRMED', '2026-11-01 12:11:24', '2026-11-01 12:11:24', '2026-11-01 12:11:24');
DECLARE @o_id_3 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_3, 9, 1, 5000.00, 5000.00, 'SERVED', '2026-11-01 12:11:24', '2026-11-01 12:53:24');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_3, 12, 2, 3000.00, 6000.00, 'SERVED', '2026-11-01 12:11:24', '2026-11-01 12:53:24');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_3, 5, 2, 5000.00, 10000.00, 'SERVED', '2026-11-01 12:11:24', '2026-11-01 12:53:24');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_3, 'BILL-20261101-0002', 21000.00, 0, 0, 21000.00, 'CASH', 'PAID', '2026-11-01 12:53:24', '2026-11-01 12:53:24', '2026-11-01 12:53:24');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-01-0102-0003', 'COMPLETED', 3, '2026-11-01 18:27:49', '2026-11-01 19:27:49', '2026-11-01 18:27:49', '2026-11-01 19:27:49'
FROM restaurant_tables WHERE table_number = 'B-01';
DECLARE @s_id_4 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_4, 'ORD-20261101-0003', 20000.00, 'CONFIRMED', '2026-11-01 18:27:49', '2026-11-01 18:27:49', '2026-11-01 18:27:49');
DECLARE @o_id_4 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_4, 25, 1, 2000.00, 2000.00, 'SERVED', '2026-11-01 18:27:49', '2026-11-01 19:27:49');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_4, 13, 1, 3500.00, 3500.00, 'SERVED', '2026-11-01 18:27:49', '2026-11-01 19:27:49');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_4, 5, 2, 5000.00, 10000.00, 'SERVED', '2026-11-01 18:27:49', '2026-11-01 19:27:49');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_4, 7, 1, 4500.00, 4500.00, 'SERVED', '2026-11-01 18:27:49', '2026-11-01 19:27:49');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_4, 'BILL-20261101-0003', 20000.00, 0, 0, 20000.00, 'CASH', 'PAID', '2026-11-01 19:27:49', '2026-11-01 19:27:49', '2026-11-01 19:27:49');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-02-0103-0004', 'COMPLETED', 2, '2026-11-01 19:24:36', '2026-11-01 20:34:36', '2026-11-01 19:24:36', '2026-11-01 20:34:36'
FROM restaurant_tables WHERE table_number = 'T-02';
DECLARE @s_id_5 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_5, 'ORD-20261101-0004', 7000.00, 'CONFIRMED', '2026-11-01 19:24:36', '2026-11-01 19:24:36', '2026-11-01 19:24:36');
DECLARE @o_id_5 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_5, 21, 2, 1500.00, 3000.00, 'SERVED', '2026-11-01 19:24:36', '2026-11-01 20:34:36');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_5, 2, 2, 2000.00, 4000.00, 'SERVED', '2026-11-01 19:24:36', '2026-11-01 20:34:36');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_5, 'BILL-20261101-0004', 7000.00, 0, 0, 7000.00, 'BANK_TRANSFER', 'PAID', '2026-11-01 20:34:36', '2026-11-01 20:34:36', '2026-11-01 20:34:36');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-01-0104-0005', 'COMPLETED', 3, '2026-11-01 20:45:31', '2026-11-01 21:40:31', '2026-11-01 20:45:31', '2026-11-01 21:40:31'
FROM restaurant_tables WHERE table_number = 'B-01';
DECLARE @s_id_6 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_6, 'ORD-20261101-0005', 17500.00, 'CONFIRMED', '2026-11-01 20:45:31', '2026-11-01 20:45:31', '2026-11-01 20:45:31');
DECLARE @o_id_6 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_6, 23, 1, 1000.00, 1000.00, 'SERVED', '2026-11-01 20:45:31', '2026-11-01 21:40:31');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_6, 4, 1, 3500.00, 3500.00, 'SERVED', '2026-11-01 20:45:31', '2026-11-01 21:40:31');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_6, 7, 2, 4500.00, 9000.00, 'SERVED', '2026-11-01 20:45:31', '2026-11-01 21:40:31');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_6, 10, 1, 4000.00, 4000.00, 'SERVED', '2026-11-01 20:45:31', '2026-11-01 21:40:31');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_6, 'BILL-20261101-0005', 17500.00, 0, 0, 17500.00, 'BANK_TRANSFER', 'PAID', '2026-11-01 21:40:31', '2026-11-01 21:40:31', '2026-11-01 21:40:31');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-01-0105-0006', 'COMPLETED', 3, '2026-11-01 20:43:40', '2026-11-01 21:51:40', '2026-11-01 20:43:40', '2026-11-01 21:51:40'
FROM restaurant_tables WHERE table_number = 'VIP-01';
DECLARE @s_id_7 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_7, 'ORD-20261101-0006', 17500.00, 'CONFIRMED', '2026-11-01 20:43:40', '2026-11-01 20:43:40', '2026-11-01 20:43:40');
DECLARE @o_id_7 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_7, 3, 1, 2500.00, 2500.00, 'SERVED', '2026-11-01 20:43:40', '2026-11-01 21:51:40');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_7, 1, 2, 3000.00, 6000.00, 'SERVED', '2026-11-01 20:43:40', '2026-11-01 21:51:40');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_7, 2, 1, 2000.00, 2000.00, 'SERVED', '2026-11-01 20:43:40', '2026-11-01 21:51:40');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_7, 4, 2, 3500.00, 7000.00, 'SERVED', '2026-11-01 20:43:40', '2026-11-01 21:51:40');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_7, 'BILL-20261101-0006', 17500.00, 0, 0, 17500.00, 'CASH', 'PAID', '2026-11-01 21:51:40', '2026-11-01 21:51:40', '2026-11-01 21:51:40');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-01-0106-0007', 'COMPLETED', 4, '2026-11-01 13:29:27', '2026-11-01 14:36:27', '2026-11-01 13:29:27', '2026-11-01 14:36:27'
FROM restaurant_tables WHERE table_number = 'VIP-01';
DECLARE @s_id_8 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_8, 'ORD-20261101-0007', 9000.00, 'CONFIRMED', '2026-11-01 13:29:27', '2026-11-01 13:29:27', '2026-11-01 13:29:27');
DECLARE @o_id_8 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_8, 7, 1, 4500.00, 4500.00, 'SERVED', '2026-11-01 13:29:27', '2026-11-01 14:36:27');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_8, 6, 1, 4500.00, 4500.00, 'SERVED', '2026-11-01 13:29:27', '2026-11-01 14:36:27');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_8, 'BILL-20261101-0007', 9000.00, 0, 0, 9000.00, 'CASH', 'PAID', '2026-11-01 14:36:27', '2026-11-01 14:36:27', '2026-11-01 14:36:27');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-04-0107-0008', 'COMPLETED', 4, '2026-11-01 11:06:40', '2026-11-01 12:04:40', '2026-11-01 11:06:40', '2026-11-01 12:04:40'
FROM restaurant_tables WHERE table_number = 'T-04';
DECLARE @s_id_9 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_9, 'ORD-20261101-0008', 13500.00, 'CONFIRMED', '2026-11-01 11:06:40', '2026-11-01 11:06:40', '2026-11-01 11:06:40');
DECLARE @o_id_9 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_9, 3, 2, 2500.00, 5000.00, 'SERVED', '2026-11-01 11:06:40', '2026-11-01 12:04:40');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_9, 9, 1, 5000.00, 5000.00, 'SERVED', '2026-11-01 11:06:40', '2026-11-01 12:04:40');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_9, 25, 1, 2000.00, 2000.00, 'SERVED', '2026-11-01 11:06:40', '2026-11-01 12:04:40');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_9, 20, 1, 1500.00, 1500.00, 'SERVED', '2026-11-01 11:06:40', '2026-11-01 12:04:40');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_9, 'BILL-20261101-0008', 13500.00, 0, 0, 13500.00, 'CASH', 'PAID', '2026-11-01 12:04:40', '2026-11-01 12:04:40', '2026-11-01 12:04:40');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-01-0108-0009', 'COMPLETED', 2, '2026-11-01 11:46:10', '2026-11-01 12:26:10', '2026-11-01 11:46:10', '2026-11-01 12:26:10'
FROM restaurant_tables WHERE table_number = 'T-01';
DECLARE @s_id_10 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_10, 'ORD-20261101-0009', 22500.00, 'CONFIRMED', '2026-11-01 11:46:10', '2026-11-01 11:46:10', '2026-11-01 11:46:10');
DECLARE @o_id_10 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_10, 7, 1, 4500.00, 4500.00, 'SERVED', '2026-11-01 11:46:10', '2026-11-01 12:26:10');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_10, 10, 2, 4000.00, 8000.00, 'SERVED', '2026-11-01 11:46:10', '2026-11-01 12:26:10');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_10, 12, 1, 3000.00, 3000.00, 'SERVED', '2026-11-01 11:46:10', '2026-11-01 12:26:10');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_10, 13, 2, 3500.00, 7000.00, 'SERVED', '2026-11-01 11:46:10', '2026-11-01 12:26:10');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_10, 'BILL-20261101-0009', 22500.00, 0, 0, 22500.00, 'CASH', 'PAID', '2026-11-01 12:26:10', '2026-11-01 12:26:10', '2026-11-01 12:26:10');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-01-0109-0010', 'COMPLETED', 3, '2026-11-01 13:14:14', '2026-11-01 14:17:14', '2026-11-01 13:14:14', '2026-11-01 14:17:14'
FROM restaurant_tables WHERE table_number = 'T-01';
DECLARE @s_id_11 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_11, 'ORD-20261101-0010', 14000.00, 'CONFIRMED', '2026-11-01 13:14:14', '2026-11-01 13:14:14', '2026-11-01 13:14:14');
DECLARE @o_id_11 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_11, 5, 1, 5000.00, 5000.00, 'SERVED', '2026-11-01 13:14:14', '2026-11-01 14:17:14');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_11, 21, 2, 1500.00, 3000.00, 'SERVED', '2026-11-01 13:14:14', '2026-11-01 14:17:14');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_11, 1, 2, 3000.00, 6000.00, 'SERVED', '2026-11-01 13:14:14', '2026-11-01 14:17:14');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_11, 'BILL-20261101-0010', 14000.00, 0, 0, 14000.00, 'BANK_TRANSFER', 'PAID', '2026-11-01 14:17:14', '2026-11-01 14:17:14', '2026-11-01 14:17:14');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-03-0110-0011', 'COMPLETED', 2, '2026-11-01 11:05:19', '2026-11-01 11:49:19', '2026-11-01 11:05:19', '2026-11-01 11:49:19'
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_id_12 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_12, 'ORD-20261101-0011', 21500.00, 'CONFIRMED', '2026-11-01 11:05:19', '2026-11-01 11:05:19', '2026-11-01 11:05:19');
DECLARE @o_id_12 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_12, 8, 2, 4000.00, 8000.00, 'SERVED', '2026-11-01 11:05:19', '2026-11-01 11:49:19');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_12, 4, 1, 3500.00, 3500.00, 'SERVED', '2026-11-01 11:05:19', '2026-11-01 11:49:19');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_12, 9, 2, 5000.00, 10000.00, 'SERVED', '2026-11-01 11:05:19', '2026-11-01 11:49:19');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_12, 'BILL-20261101-0011', 21500.00, 0, 0, 21500.00, 'BANK_TRANSFER', 'PAID', '2026-11-01 11:49:19', '2026-11-01 11:49:19', '2026-11-01 11:49:19');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-02-0200-0012', 'COMPLETED', 2, '2026-11-02 20:43:19', '2026-11-02 21:49:19', '2026-11-02 20:43:19', '2026-11-02 21:49:19'
FROM restaurant_tables WHERE table_number = 'VIP-02';
DECLARE @s_id_13 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_13, 'ORD-20261102-0012', 17000.00, 'CONFIRMED', '2026-11-02 20:43:19', '2026-11-02 20:43:19', '2026-11-02 20:43:19');
DECLARE @o_id_13 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_13, 2, 1, 2000.00, 2000.00, 'SERVED', '2026-11-02 20:43:19', '2026-11-02 21:49:19');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_13, 13, 2, 3500.00, 7000.00, 'SERVED', '2026-11-02 20:43:19', '2026-11-02 21:49:19');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_13, 10, 2, 4000.00, 8000.00, 'SERVED', '2026-11-02 20:43:19', '2026-11-02 21:49:19');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_13, 'BILL-20261102-0012', 17000.00, 0, 0, 17000.00, 'BANK_TRANSFER', 'PAID', '2026-11-02 21:49:19', '2026-11-02 21:49:19', '2026-11-02 21:49:19');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-03-0201-0013', 'COMPLETED', 3, '2026-11-02 11:43:39', '2026-11-02 12:27:39', '2026-11-02 11:43:39', '2026-11-02 12:27:39'
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_id_14 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_14, 'ORD-20261102-0013', 18000.00, 'CONFIRMED', '2026-11-02 11:43:39', '2026-11-02 11:43:39', '2026-11-02 11:43:39');
DECLARE @o_id_14 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_14, 10, 2, 4000.00, 8000.00, 'SERVED', '2026-11-02 11:43:39', '2026-11-02 12:27:39');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_14, 12, 2, 3000.00, 6000.00, 'SERVED', '2026-11-02 11:43:39', '2026-11-02 12:27:39');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_14, 2, 2, 2000.00, 4000.00, 'SERVED', '2026-11-02 11:43:39', '2026-11-02 12:27:39');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_14, 'BILL-20261102-0013', 18000.00, 0, 0, 18000.00, 'BANK_TRANSFER', 'PAID', '2026-11-02 12:27:39', '2026-11-02 12:27:39', '2026-11-02 12:27:39');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-01-0202-0014', 'COMPLETED', 2, '2026-11-02 12:35:47', '2026-11-02 13:42:47', '2026-11-02 12:35:47', '2026-11-02 13:42:47'
FROM restaurant_tables WHERE table_number = 'B-01';
DECLARE @s_id_15 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_15, 'ORD-20261102-0014', 6000.00, 'CONFIRMED', '2026-11-02 12:35:47', '2026-11-02 12:35:47', '2026-11-02 12:35:47');
DECLARE @o_id_15 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_15, 20, 1, 1500.00, 1500.00, 'SERVED', '2026-11-02 12:35:47', '2026-11-02 13:42:47');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_15, 21, 1, 1500.00, 1500.00, 'SERVED', '2026-11-02 12:35:47', '2026-11-02 13:42:47');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_15, 12, 1, 3000.00, 3000.00, 'SERVED', '2026-11-02 12:35:47', '2026-11-02 13:42:47');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_15, 'BILL-20261102-0014', 6000.00, 0, 0, 6000.00, 'CASH', 'PAID', '2026-11-02 13:42:47', '2026-11-02 13:42:47', '2026-11-02 13:42:47');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-01-0203-0015', 'COMPLETED', 3, '2026-11-02 11:18:31', '2026-11-02 12:22:31', '2026-11-02 11:18:31', '2026-11-02 12:22:31'
FROM restaurant_tables WHERE table_number = 'T-01';
DECLARE @s_id_16 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_16, 'ORD-20261102-0015', 14500.00, 'CONFIRMED', '2026-11-02 11:18:31', '2026-11-02 11:18:31', '2026-11-02 11:18:31');
DECLARE @o_id_16 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_16, 13, 1, 3500.00, 3500.00, 'SERVED', '2026-11-02 11:18:31', '2026-11-02 12:22:31');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_16, 8, 2, 4000.00, 8000.00, 'SERVED', '2026-11-02 11:18:31', '2026-11-02 12:22:31');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_16, 12, 1, 3000.00, 3000.00, 'SERVED', '2026-11-02 11:18:31', '2026-11-02 12:22:31');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_16, 'BILL-20261102-0015', 14500.00, 0, 0, 14500.00, 'BANK_TRANSFER', 'PAID', '2026-11-02 12:22:31', '2026-11-02 12:22:31', '2026-11-02 12:22:31');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-01-0204-0016', 'COMPLETED', 3, '2026-11-02 19:19:47', '2026-11-02 20:05:47', '2026-11-02 19:19:47', '2026-11-02 20:05:47'
FROM restaurant_tables WHERE table_number = 'B-01';
DECLARE @s_id_17 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_17, 'ORD-20261102-0016', 9000.00, 'CONFIRMED', '2026-11-02 19:19:47', '2026-11-02 19:19:47', '2026-11-02 19:19:47');
DECLARE @o_id_17 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_17, 23, 2, 1000.00, 2000.00, 'SERVED', '2026-11-02 19:19:47', '2026-11-02 20:05:47');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_17, 1, 1, 3000.00, 3000.00, 'SERVED', '2026-11-02 19:19:47', '2026-11-02 20:05:47');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_17, 10, 1, 4000.00, 4000.00, 'SERVED', '2026-11-02 19:19:47', '2026-11-02 20:05:47');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_17, 'BILL-20261102-0016', 9000.00, 0, 0, 9000.00, 'CASH', 'PAID', '2026-11-02 20:05:47', '2026-11-02 20:05:47', '2026-11-02 20:05:47');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-01-0205-0017', 'COMPLETED', 4, '2026-11-02 19:10:22', '2026-11-02 20:02:22', '2026-11-02 19:10:22', '2026-11-02 20:02:22'
FROM restaurant_tables WHERE table_number = 'B-01';
DECLARE @s_id_18 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_18, 'ORD-20261102-0017', 21000.00, 'CONFIRMED', '2026-11-02 19:10:22', '2026-11-02 19:10:22', '2026-11-02 19:10:22');
DECLARE @o_id_18 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_18, 1, 1, 3000.00, 3000.00, 'SERVED', '2026-11-02 19:10:22', '2026-11-02 20:02:22');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_18, 8, 2, 4000.00, 8000.00, 'SERVED', '2026-11-02 19:10:22', '2026-11-02 20:02:22');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_18, 5, 2, 5000.00, 10000.00, 'SERVED', '2026-11-02 19:10:22', '2026-11-02 20:02:22');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_18, 'BILL-20261102-0017', 21000.00, 0, 0, 21000.00, 'BANK_TRANSFER', 'PAID', '2026-11-02 20:02:22', '2026-11-02 20:02:22', '2026-11-02 20:02:22');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-02-0206-0018', 'COMPLETED', 4, '2026-11-02 12:22:50', '2026-11-02 12:59:50', '2026-11-02 12:22:50', '2026-11-02 12:59:50'
FROM restaurant_tables WHERE table_number = 'VIP-02';
DECLARE @s_id_19 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_19, 'ORD-20261102-0018', 14000.00, 'CONFIRMED', '2026-11-02 12:22:50', '2026-11-02 12:22:50', '2026-11-02 12:22:50');
DECLARE @o_id_19 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_19, 5, 1, 5000.00, 5000.00, 'SERVED', '2026-11-02 12:22:50', '2026-11-02 12:59:50');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_19, 1, 2, 3000.00, 6000.00, 'SERVED', '2026-11-02 12:22:50', '2026-11-02 12:59:50');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_19, 12, 1, 3000.00, 3000.00, 'SERVED', '2026-11-02 12:22:50', '2026-11-02 12:59:50');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_19, 'BILL-20261102-0018', 14000.00, 0, 0, 14000.00, 'BANK_TRANSFER', 'PAID', '2026-11-02 12:59:50', '2026-11-02 12:59:50', '2026-11-02 12:59:50');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-02-0207-0019', 'COMPLETED', 3, '2026-11-02 13:49:29', '2026-11-02 14:24:29', '2026-11-02 13:49:29', '2026-11-02 14:24:29'
FROM restaurant_tables WHERE table_number = 'T-02';
DECLARE @s_id_20 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_20, 'ORD-20261102-0019', 18000.00, 'CONFIRMED', '2026-11-02 13:49:29', '2026-11-02 13:49:29', '2026-11-02 13:49:29');
DECLARE @o_id_20 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_20, 4, 1, 3500.00, 3500.00, 'SERVED', '2026-11-02 13:49:29', '2026-11-02 14:24:29');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_20, 6, 1, 4500.00, 4500.00, 'SERVED', '2026-11-02 13:49:29', '2026-11-02 14:24:29');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_20, 5, 2, 5000.00, 10000.00, 'SERVED', '2026-11-02 13:49:29', '2026-11-02 14:24:29');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_20, 'BILL-20261102-0019', 18000.00, 0, 0, 18000.00, 'CASH', 'PAID', '2026-11-02 14:24:29', '2026-11-02 14:24:29', '2026-11-02 14:24:29');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-02-0208-0020', 'COMPLETED', 2, '2026-11-02 18:52:30', '2026-11-02 20:05:30', '2026-11-02 18:52:30', '2026-11-02 20:05:30'
FROM restaurant_tables WHERE table_number = 'T-02';
DECLARE @s_id_21 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_21, 'ORD-20261102-0020', 24000.00, 'CONFIRMED', '2026-11-02 18:52:30', '2026-11-02 18:52:30', '2026-11-02 18:52:30');
DECLARE @o_id_21 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_21, 3, 2, 2500.00, 5000.00, 'SERVED', '2026-11-02 18:52:30', '2026-11-02 20:05:30');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_21, 8, 1, 4000.00, 4000.00, 'SERVED', '2026-11-02 18:52:30', '2026-11-02 20:05:30');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_21, 1, 2, 3000.00, 6000.00, 'SERVED', '2026-11-02 18:52:30', '2026-11-02 20:05:30');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_21, 6, 2, 4500.00, 9000.00, 'SERVED', '2026-11-02 18:52:30', '2026-11-02 20:05:30');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_21, 'BILL-20261102-0020', 24000.00, 0, 0, 24000.00, 'CASH', 'PAID', '2026-11-02 20:05:30', '2026-11-02 20:05:30', '2026-11-02 20:05:30');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-04-0300-0021', 'COMPLETED', 2, '2026-11-03 11:25:47', '2026-11-03 12:15:47', '2026-11-03 11:25:47', '2026-11-03 12:15:47'
FROM restaurant_tables WHERE table_number = 'T-04';
DECLARE @s_id_22 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_22, 'ORD-20261103-0021', 15000.00, 'CONFIRMED', '2026-11-03 11:25:47', '2026-11-03 11:25:47', '2026-11-03 11:25:47');
DECLARE @o_id_22 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_22, 23, 2, 1000.00, 2000.00, 'SERVED', '2026-11-03 11:25:47', '2026-11-03 12:15:47');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_22, 13, 2, 3500.00, 7000.00, 'SERVED', '2026-11-03 11:25:47', '2026-11-03 12:15:47');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_22, 1, 2, 3000.00, 6000.00, 'SERVED', '2026-11-03 11:25:47', '2026-11-03 12:15:47');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_22, 'BILL-20261103-0021', 15000.00, 0, 0, 15000.00, 'CASH', 'PAID', '2026-11-03 12:15:47', '2026-11-03 12:15:47', '2026-11-03 12:15:47');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-01-0301-0022', 'COMPLETED', 2, '2026-11-03 18:55:49', '2026-11-03 20:00:49', '2026-11-03 18:55:49', '2026-11-03 20:00:49'
FROM restaurant_tables WHERE table_number = 'B-01';
DECLARE @s_id_23 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_23, 'ORD-20261103-0022', 16500.00, 'CONFIRMED', '2026-11-03 18:55:49', '2026-11-03 18:55:49', '2026-11-03 18:55:49');
DECLARE @o_id_23 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_23, 3, 2, 2500.00, 5000.00, 'SERVED', '2026-11-03 18:55:49', '2026-11-03 20:00:49');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_23, 8, 1, 4000.00, 4000.00, 'SERVED', '2026-11-03 18:55:49', '2026-11-03 20:00:49');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_23, 6, 1, 4500.00, 4500.00, 'SERVED', '2026-11-03 18:55:49', '2026-11-03 20:00:49');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_23, 12, 1, 3000.00, 3000.00, 'SERVED', '2026-11-03 18:55:49', '2026-11-03 20:00:49');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_23, 'BILL-20261103-0022', 16500.00, 0, 0, 16500.00, 'CASH', 'PAID', '2026-11-03 20:00:49', '2026-11-03 20:00:49', '2026-11-03 20:00:49');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-02-0302-0023', 'COMPLETED', 4, '2026-11-03 13:43:36', '2026-11-03 14:48:36', '2026-11-03 13:43:36', '2026-11-03 14:48:36'
FROM restaurant_tables WHERE table_number = 'T-02';
DECLARE @s_id_24 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_24, 'ORD-20261103-0023', 20500.00, 'CONFIRMED', '2026-11-03 13:43:36', '2026-11-03 13:43:36', '2026-11-03 13:43:36');
DECLARE @o_id_24 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_24, 4, 1, 3500.00, 3500.00, 'SERVED', '2026-11-03 13:43:36', '2026-11-03 14:48:36');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_24, 5, 2, 5000.00, 10000.00, 'SERVED', '2026-11-03 13:43:36', '2026-11-03 14:48:36');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_24, 13, 2, 3500.00, 7000.00, 'SERVED', '2026-11-03 13:43:36', '2026-11-03 14:48:36');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_24, 'BILL-20261103-0023', 20500.00, 0, 0, 20500.00, 'BANK_TRANSFER', 'PAID', '2026-11-03 14:48:36', '2026-11-03 14:48:36', '2026-11-03 14:48:36');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-01-0303-0024', 'COMPLETED', 2, '2026-11-03 18:32:15', '2026-11-03 19:28:15', '2026-11-03 18:32:15', '2026-11-03 19:28:15'
FROM restaurant_tables WHERE table_number = 'B-01';
DECLARE @s_id_25 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_25, 'ORD-20261103-0024', 15000.00, 'CONFIRMED', '2026-11-03 18:32:15', '2026-11-03 18:32:15', '2026-11-03 18:32:15');
DECLARE @o_id_25 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_25, 7, 2, 4500.00, 9000.00, 'SERVED', '2026-11-03 18:32:15', '2026-11-03 19:28:15');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_25, 6, 1, 4500.00, 4500.00, 'SERVED', '2026-11-03 18:32:15', '2026-11-03 19:28:15');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_25, 21, 1, 1500.00, 1500.00, 'SERVED', '2026-11-03 18:32:15', '2026-11-03 19:28:15');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_25, 'BILL-20261103-0024', 15000.00, 0, 0, 15000.00, 'CASH', 'PAID', '2026-11-03 19:28:15', '2026-11-03 19:28:15', '2026-11-03 19:28:15');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-02-0304-0025', 'COMPLETED', 3, '2026-11-03 18:32:17', '2026-11-03 19:28:17', '2026-11-03 18:32:17', '2026-11-03 19:28:17'
FROM restaurant_tables WHERE table_number = 'T-02';
DECLARE @s_id_26 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_26, 'ORD-20261103-0025', 18000.00, 'CONFIRMED', '2026-11-03 18:32:17', '2026-11-03 18:32:17', '2026-11-03 18:32:17');
DECLARE @o_id_26 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_26, 1, 2, 3000.00, 6000.00, 'SERVED', '2026-11-03 18:32:17', '2026-11-03 19:28:17');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_26, 8, 2, 4000.00, 8000.00, 'SERVED', '2026-11-03 18:32:17', '2026-11-03 19:28:17');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_26, 2, 2, 2000.00, 4000.00, 'SERVED', '2026-11-03 18:32:17', '2026-11-03 19:28:17');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_26, 'BILL-20261103-0025', 18000.00, 0, 0, 18000.00, 'BANK_TRANSFER', 'PAID', '2026-11-03 19:28:17', '2026-11-03 19:28:17', '2026-11-03 19:28:17');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-01-0305-0026', 'COMPLETED', 2, '2026-11-03 20:49:15', '2026-11-03 21:41:15', '2026-11-03 20:49:15', '2026-11-03 21:41:15'
FROM restaurant_tables WHERE table_number = 'B-01';
DECLARE @s_id_27 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_27, 'ORD-20261103-0026', 17000.00, 'CONFIRMED', '2026-11-03 20:49:15', '2026-11-03 20:49:15', '2026-11-03 20:49:15');
DECLARE @o_id_27 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_27, 20, 2, 1500.00, 3000.00, 'SERVED', '2026-11-03 20:49:15', '2026-11-03 21:41:15');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_27, 4, 2, 3500.00, 7000.00, 'SERVED', '2026-11-03 20:49:15', '2026-11-03 21:41:15');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_27, 13, 2, 3500.00, 7000.00, 'SERVED', '2026-11-03 20:49:15', '2026-11-03 21:41:15');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_27, 'BILL-20261103-0026', 17000.00, 0, 0, 17000.00, 'BANK_TRANSFER', 'PAID', '2026-11-03 21:41:15', '2026-11-03 21:41:15', '2026-11-03 21:41:15');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-03-0306-0027', 'COMPLETED', 4, '2026-11-03 18:25:44', '2026-11-03 19:15:44', '2026-11-03 18:25:44', '2026-11-03 19:15:44'
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_id_28 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_28, 'ORD-20261103-0027', 9000.00, 'CONFIRMED', '2026-11-03 18:25:44', '2026-11-03 18:25:44', '2026-11-03 18:25:44');
DECLARE @o_id_28 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_28, 5, 1, 5000.00, 5000.00, 'SERVED', '2026-11-03 18:25:44', '2026-11-03 19:15:44');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_28, 25, 2, 2000.00, 4000.00, 'SERVED', '2026-11-03 18:25:44', '2026-11-03 19:15:44');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_28, 'BILL-20261103-0027', 9000.00, 0, 0, 9000.00, 'BANK_TRANSFER', 'PAID', '2026-11-03 19:15:44', '2026-11-03 19:15:44', '2026-11-03 19:15:44');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-01-0307-0028', 'COMPLETED', 2, '2026-11-03 18:13:30', '2026-11-03 19:20:30', '2026-11-03 18:13:30', '2026-11-03 19:20:30'
FROM restaurant_tables WHERE table_number = 'B-01';
DECLARE @s_id_29 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_29, 'ORD-20261103-0028', 11000.00, 'CONFIRMED', '2026-11-03 18:13:30', '2026-11-03 18:13:30', '2026-11-03 18:13:30');
DECLARE @o_id_29 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_29, 3, 1, 2500.00, 2500.00, 'SERVED', '2026-11-03 18:13:30', '2026-11-03 19:20:30');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_29, 8, 1, 4000.00, 4000.00, 'SERVED', '2026-11-03 18:13:30', '2026-11-03 19:20:30');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_29, 7, 1, 4500.00, 4500.00, 'SERVED', '2026-11-03 18:13:30', '2026-11-03 19:20:30');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_29, 'BILL-20261103-0028', 11000.00, 0, 0, 11000.00, 'BANK_TRANSFER', 'PAID', '2026-11-03 19:20:30', '2026-11-03 19:20:30', '2026-11-03 19:20:30');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-02-0400-0029', 'COMPLETED', 3, '2026-11-04 13:07:43', '2026-11-04 14:07:43', '2026-11-04 13:07:43', '2026-11-04 14:07:43'
FROM restaurant_tables WHERE table_number = 'VIP-02';
DECLARE @s_id_30 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_30, 'ORD-20261104-0029', 14000.00, 'CONFIRMED', '2026-11-04 13:07:43', '2026-11-04 13:07:43', '2026-11-04 13:07:43');
DECLARE @o_id_30 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_30, 9, 1, 5000.00, 5000.00, 'SERVED', '2026-11-04 13:07:43', '2026-11-04 14:07:43');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_30, 23, 1, 1000.00, 1000.00, 'SERVED', '2026-11-04 13:07:43', '2026-11-04 14:07:43');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_30, 10, 2, 4000.00, 8000.00, 'SERVED', '2026-11-04 13:07:43', '2026-11-04 14:07:43');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_30, 'BILL-20261104-0029', 14000.00, 0, 0, 14000.00, 'BANK_TRANSFER', 'PAID', '2026-11-04 14:07:43', '2026-11-04 14:07:43', '2026-11-04 14:07:43');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-02-0401-0030', 'COMPLETED', 2, '2026-11-04 19:13:18', '2026-11-04 19:54:18', '2026-11-04 19:13:18', '2026-11-04 19:54:18'
FROM restaurant_tables WHERE table_number = 'VIP-02';
DECLARE @s_id_31 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_31, 'ORD-20261104-0030', 15000.00, 'CONFIRMED', '2026-11-04 19:13:18', '2026-11-04 19:13:18', '2026-11-04 19:13:18');
DECLARE @o_id_31 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_31, 9, 1, 5000.00, 5000.00, 'SERVED', '2026-11-04 19:13:18', '2026-11-04 19:54:18');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_31, 7, 1, 4500.00, 4500.00, 'SERVED', '2026-11-04 19:13:18', '2026-11-04 19:54:18');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_31, 3, 1, 2500.00, 2500.00, 'SERVED', '2026-11-04 19:13:18', '2026-11-04 19:54:18');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_31, 12, 1, 3000.00, 3000.00, 'SERVED', '2026-11-04 19:13:18', '2026-11-04 19:54:18');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_31, 'BILL-20261104-0030', 15000.00, 0, 0, 15000.00, 'CASH', 'PAID', '2026-11-04 19:54:18', '2026-11-04 19:54:18', '2026-11-04 19:54:18');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-03-0402-0031', 'COMPLETED', 4, '2026-11-04 12:45:20', '2026-11-04 13:26:20', '2026-11-04 12:45:20', '2026-11-04 13:26:20'
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_id_32 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_32, 'ORD-20261104-0031', 26000.00, 'CONFIRMED', '2026-11-04 12:45:20', '2026-11-04 12:45:20', '2026-11-04 12:45:20');
DECLARE @o_id_32 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_32, 1, 1, 3000.00, 3000.00, 'SERVED', '2026-11-04 12:45:20', '2026-11-04 13:26:20');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_32, 7, 2, 4500.00, 9000.00, 'SERVED', '2026-11-04 12:45:20', '2026-11-04 13:26:20');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_32, 12, 2, 3000.00, 6000.00, 'SERVED', '2026-11-04 12:45:20', '2026-11-04 13:26:20');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_32, 8, 2, 4000.00, 8000.00, 'SERVED', '2026-11-04 12:45:20', '2026-11-04 13:26:20');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_32, 'BILL-20261104-0031', 26000.00, 0, 0, 26000.00, 'CASH', 'PAID', '2026-11-04 13:26:20', '2026-11-04 13:26:20', '2026-11-04 13:26:20');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-01-0403-0032', 'COMPLETED', 2, '2026-11-04 18:40:30', '2026-11-04 19:53:30', '2026-11-04 18:40:30', '2026-11-04 19:53:30'
FROM restaurant_tables WHERE table_number = 'T-01';
DECLARE @s_id_33 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_33, 'ORD-20261104-0032', 22500.00, 'CONFIRMED', '2026-11-04 18:40:30', '2026-11-04 18:40:30', '2026-11-04 18:40:30');
DECLARE @o_id_33 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_33, 20, 1, 1500.00, 1500.00, 'SERVED', '2026-11-04 18:40:30', '2026-11-04 19:53:30');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_33, 7, 2, 4500.00, 9000.00, 'SERVED', '2026-11-04 18:40:30', '2026-11-04 19:53:30');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_33, 4, 2, 3500.00, 7000.00, 'SERVED', '2026-11-04 18:40:30', '2026-11-04 19:53:30');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_33, 9, 1, 5000.00, 5000.00, 'SERVED', '2026-11-04 18:40:30', '2026-11-04 19:53:30');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_33, 'BILL-20261104-0032', 22500.00, 0, 0, 22500.00, 'BANK_TRANSFER', 'PAID', '2026-11-04 19:53:30', '2026-11-04 19:53:30', '2026-11-04 19:53:30');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-01-0404-0033', 'COMPLETED', 2, '2026-11-04 19:47:19', '2026-11-04 20:37:19', '2026-11-04 19:47:19', '2026-11-04 20:37:19'
FROM restaurant_tables WHERE table_number = 'T-01';
DECLARE @s_id_34 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_34, 'ORD-20261104-0033', 8000.00, 'CONFIRMED', '2026-11-04 19:47:19', '2026-11-04 19:47:19', '2026-11-04 19:47:19');
DECLARE @o_id_34 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_34, 3, 2, 2500.00, 5000.00, 'SERVED', '2026-11-04 19:47:19', '2026-11-04 20:37:19');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_34, 23, 1, 1000.00, 1000.00, 'SERVED', '2026-11-04 19:47:19', '2026-11-04 20:37:19');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_34, 25, 1, 2000.00, 2000.00, 'SERVED', '2026-11-04 19:47:19', '2026-11-04 20:37:19');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_34, 'BILL-20261104-0033', 8000.00, 0, 0, 8000.00, 'BANK_TRANSFER', 'PAID', '2026-11-04 20:37:19', '2026-11-04 20:37:19', '2026-11-04 20:37:19');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-01-0405-0034', 'COMPLETED', 4, '2026-11-04 19:15:49', '2026-11-04 19:59:49', '2026-11-04 19:15:49', '2026-11-04 19:59:49'
FROM restaurant_tables WHERE table_number = 'T-01';
DECLARE @s_id_35 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_35, 'ORD-20261104-0034', 15000.00, 'CONFIRMED', '2026-11-04 19:15:49', '2026-11-04 19:15:49', '2026-11-04 19:15:49');
DECLARE @o_id_35 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_35, 9, 2, 5000.00, 10000.00, 'SERVED', '2026-11-04 19:15:49', '2026-11-04 19:59:49');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_35, 3, 2, 2500.00, 5000.00, 'SERVED', '2026-11-04 19:15:49', '2026-11-04 19:59:49');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_35, 'BILL-20261104-0034', 15000.00, 0, 0, 15000.00, 'BANK_TRANSFER', 'PAID', '2026-11-04 19:59:49', '2026-11-04 19:59:49', '2026-11-04 19:59:49');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-03-0406-0035', 'COMPLETED', 4, '2026-11-04 12:17:12', '2026-11-04 13:04:12', '2026-11-04 12:17:12', '2026-11-04 13:04:12'
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_id_36 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_36, 'ORD-20261104-0035', 23500.00, 'CONFIRMED', '2026-11-04 12:17:12', '2026-11-04 12:17:12', '2026-11-04 12:17:12');
DECLARE @o_id_36 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_36, 1, 2, 3000.00, 6000.00, 'SERVED', '2026-11-04 12:17:12', '2026-11-04 13:04:12');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_36, 6, 1, 4500.00, 4500.00, 'SERVED', '2026-11-04 12:17:12', '2026-11-04 13:04:12');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_36, 8, 1, 4000.00, 4000.00, 'SERVED', '2026-11-04 12:17:12', '2026-11-04 13:04:12');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_36, 7, 2, 4500.00, 9000.00, 'SERVED', '2026-11-04 12:17:12', '2026-11-04 13:04:12');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_36, 'BILL-20261104-0035', 23500.00, 0, 0, 23500.00, 'BANK_TRANSFER', 'PAID', '2026-11-04 13:04:12', '2026-11-04 13:04:12', '2026-11-04 13:04:12');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-01-0407-0036', 'COMPLETED', 3, '2026-11-04 12:27:37', '2026-11-04 13:36:37', '2026-11-04 12:27:37', '2026-11-04 13:36:37'
FROM restaurant_tables WHERE table_number = 'VIP-01';
DECLARE @s_id_37 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_37, 'ORD-20261104-0036', 13500.00, 'CONFIRMED', '2026-11-04 12:27:37', '2026-11-04 12:27:37', '2026-11-04 12:27:37');
DECLARE @o_id_37 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_37, 10, 1, 4000.00, 4000.00, 'SERVED', '2026-11-04 12:27:37', '2026-11-04 13:36:37');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_37, 13, 1, 3500.00, 3500.00, 'SERVED', '2026-11-04 12:27:37', '2026-11-04 13:36:37');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_37, 12, 2, 3000.00, 6000.00, 'SERVED', '2026-11-04 12:27:37', '2026-11-04 13:36:37');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_37, 'BILL-20261104-0036', 13500.00, 0, 0, 13500.00, 'BANK_TRANSFER', 'PAID', '2026-11-04 13:36:37', '2026-11-04 13:36:37', '2026-11-04 13:36:37');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-01-0500-0037', 'COMPLETED', 3, '2026-11-05 12:08:49', '2026-11-05 13:18:49', '2026-11-05 12:08:49', '2026-11-05 13:18:49'
FROM restaurant_tables WHERE table_number = 'VIP-01';
DECLARE @s_id_38 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_38, 'ORD-20261105-0037', 15500.00, 'CONFIRMED', '2026-11-05 12:08:49', '2026-11-05 12:08:49', '2026-11-05 12:08:49');
DECLARE @o_id_38 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_38, 7, 1, 4500.00, 4500.00, 'SERVED', '2026-11-05 12:08:49', '2026-11-05 13:18:49');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_38, 12, 2, 3000.00, 6000.00, 'SERVED', '2026-11-05 12:08:49', '2026-11-05 13:18:49');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_38, 9, 1, 5000.00, 5000.00, 'SERVED', '2026-11-05 12:08:49', '2026-11-05 13:18:49');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_38, 'BILL-20261105-0037', 15500.00, 0, 0, 15500.00, 'CASH', 'PAID', '2026-11-05 13:18:49', '2026-11-05 13:18:49', '2026-11-05 13:18:49');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-01-0501-0038', 'COMPLETED', 4, '2026-11-05 19:17:50', '2026-11-05 20:17:50', '2026-11-05 19:17:50', '2026-11-05 20:17:50'
FROM restaurant_tables WHERE table_number = 'B-01';
DECLARE @s_id_39 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_39, 'ORD-20261105-0038', 4000.00, 'CONFIRMED', '2026-11-05 19:17:50', '2026-11-05 19:17:50', '2026-11-05 19:17:50');
DECLARE @o_id_39 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_39, 3, 1, 2500.00, 2500.00, 'SERVED', '2026-11-05 19:17:50', '2026-11-05 20:17:50');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_39, 21, 1, 1500.00, 1500.00, 'SERVED', '2026-11-05 19:17:50', '2026-11-05 20:17:50');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_39, 'BILL-20261105-0038', 4000.00, 0, 0, 4000.00, 'BANK_TRANSFER', 'PAID', '2026-11-05 20:17:50', '2026-11-05 20:17:50', '2026-11-05 20:17:50');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-04-0502-0039', 'COMPLETED', 4, '2026-11-05 13:20:38', '2026-11-05 14:26:38', '2026-11-05 13:20:38', '2026-11-05 14:26:38'
FROM restaurant_tables WHERE table_number = 'T-04';
DECLARE @s_id_40 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_40, 'ORD-20261105-0039', 15000.00, 'CONFIRMED', '2026-11-05 13:20:38', '2026-11-05 13:20:38', '2026-11-05 13:20:38');
DECLARE @o_id_40 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_40, 20, 2, 1500.00, 3000.00, 'SERVED', '2026-11-05 13:20:38', '2026-11-05 14:26:38');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_40, 8, 2, 4000.00, 8000.00, 'SERVED', '2026-11-05 13:20:38', '2026-11-05 14:26:38');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_40, 2, 2, 2000.00, 4000.00, 'SERVED', '2026-11-05 13:20:38', '2026-11-05 14:26:38');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_40, 'BILL-20261105-0039', 15000.00, 0, 0, 15000.00, 'CASH', 'PAID', '2026-11-05 14:26:38', '2026-11-05 14:26:38', '2026-11-05 14:26:38');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-02-0503-0040', 'COMPLETED', 2, '2026-11-05 18:25:13', '2026-11-05 19:33:13', '2026-11-05 18:25:13', '2026-11-05 19:33:13'
FROM restaurant_tables WHERE table_number = 'VIP-02';
DECLARE @s_id_41 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_41, 'ORD-20261105-0040', 2500.00, 'CONFIRMED', '2026-11-05 18:25:13', '2026-11-05 18:25:13', '2026-11-05 18:25:13');
DECLARE @o_id_41 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_41, 23, 1, 1000.00, 1000.00, 'SERVED', '2026-11-05 18:25:13', '2026-11-05 19:33:13');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_41, 21, 1, 1500.00, 1500.00, 'SERVED', '2026-11-05 18:25:13', '2026-11-05 19:33:13');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_41, 'BILL-20261105-0040', 2500.00, 0, 0, 2500.00, 'CASH', 'PAID', '2026-11-05 19:33:13', '2026-11-05 19:33:13', '2026-11-05 19:33:13');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-04-0504-0041', 'COMPLETED', 4, '2026-11-05 19:41:27', '2026-11-05 20:56:27', '2026-11-05 19:41:27', '2026-11-05 20:56:27'
FROM restaurant_tables WHERE table_number = 'T-04';
DECLARE @s_id_42 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_42, 'ORD-20261105-0041', 25000.00, 'CONFIRMED', '2026-11-05 19:41:27', '2026-11-05 19:41:27', '2026-11-05 19:41:27');
DECLARE @o_id_42 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_42, 2, 2, 2000.00, 4000.00, 'SERVED', '2026-11-05 19:41:27', '2026-11-05 20:56:27');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_42, 1, 1, 3000.00, 3000.00, 'SERVED', '2026-11-05 19:41:27', '2026-11-05 20:56:27');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_42, 10, 2, 4000.00, 8000.00, 'SERVED', '2026-11-05 19:41:27', '2026-11-05 20:56:27');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_42, 9, 2, 5000.00, 10000.00, 'SERVED', '2026-11-05 19:41:27', '2026-11-05 20:56:27');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_42, 'BILL-20261105-0041', 25000.00, 0, 0, 25000.00, 'BANK_TRANSFER', 'PAID', '2026-11-05 20:56:27', '2026-11-05 20:56:27', '2026-11-05 20:56:27');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-02-0505-0042', 'COMPLETED', 4, '2026-11-05 12:54:14', '2026-11-05 13:43:14', '2026-11-05 12:54:14', '2026-11-05 13:43:14'
FROM restaurant_tables WHERE table_number = 'VIP-02';
DECLARE @s_id_43 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_43, 'ORD-20261105-0042', 12500.00, 'CONFIRMED', '2026-11-05 12:54:14', '2026-11-05 12:54:14', '2026-11-05 12:54:14');
DECLARE @o_id_43 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_43, 20, 1, 1500.00, 1500.00, 'SERVED', '2026-11-05 12:54:14', '2026-11-05 13:43:14');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_43, 12, 1, 3000.00, 3000.00, 'SERVED', '2026-11-05 12:54:14', '2026-11-05 13:43:14');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_43, 2, 2, 2000.00, 4000.00, 'SERVED', '2026-11-05 12:54:14', '2026-11-05 13:43:14');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_43, 10, 1, 4000.00, 4000.00, 'SERVED', '2026-11-05 12:54:14', '2026-11-05 13:43:14');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_43, 'BILL-20261105-0042', 12500.00, 0, 0, 12500.00, 'BANK_TRANSFER', 'PAID', '2026-11-05 13:43:14', '2026-11-05 13:43:14', '2026-11-05 13:43:14');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-04-0506-0043', 'COMPLETED', 3, '2026-11-05 12:43:12', '2026-11-05 13:37:12', '2026-11-05 12:43:12', '2026-11-05 13:37:12'
FROM restaurant_tables WHERE table_number = 'T-04';
DECLARE @s_id_44 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_44, 'ORD-20261105-0043', 5000.00, 'CONFIRMED', '2026-11-05 12:43:12', '2026-11-05 12:43:12', '2026-11-05 12:43:12');
DECLARE @o_id_44 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_44, 13, 1, 3500.00, 3500.00, 'SERVED', '2026-11-05 12:43:12', '2026-11-05 13:37:12');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_44, 20, 1, 1500.00, 1500.00, 'SERVED', '2026-11-05 12:43:12', '2026-11-05 13:37:12');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_44, 'BILL-20261105-0043', 5000.00, 0, 0, 5000.00, 'BANK_TRANSFER', 'PAID', '2026-11-05 13:37:12', '2026-11-05 13:37:12', '2026-11-05 13:37:12');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-04-0507-0044', 'COMPLETED', 2, '2026-11-05 12:42:32', '2026-11-05 13:42:32', '2026-11-05 12:42:32', '2026-11-05 13:42:32'
FROM restaurant_tables WHERE table_number = 'T-04';
DECLARE @s_id_45 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_45, 'ORD-20261105-0044', 10000.00, 'CONFIRMED', '2026-11-05 12:42:32', '2026-11-05 12:42:32', '2026-11-05 12:42:32');
DECLARE @o_id_45 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_45, 20, 2, 1500.00, 3000.00, 'SERVED', '2026-11-05 12:42:32', '2026-11-05 13:42:32');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_45, 8, 1, 4000.00, 4000.00, 'SERVED', '2026-11-05 12:42:32', '2026-11-05 13:42:32');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_45, 12, 1, 3000.00, 3000.00, 'SERVED', '2026-11-05 12:42:32', '2026-11-05 13:42:32');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_45, 'BILL-20261105-0044', 10000.00, 0, 0, 10000.00, 'BANK_TRANSFER', 'PAID', '2026-11-05 13:42:32', '2026-11-05 13:42:32', '2026-11-05 13:42:32');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-02-0508-0045', 'COMPLETED', 4, '2026-11-05 20:28:14', '2026-11-05 21:11:14', '2026-11-05 20:28:14', '2026-11-05 21:11:14'
FROM restaurant_tables WHERE table_number = 'B-02';
DECLARE @s_id_46 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_46, 'ORD-20261105-0045', 16500.00, 'CONFIRMED', '2026-11-05 20:28:14', '2026-11-05 20:28:14', '2026-11-05 20:28:14');
DECLARE @o_id_46 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_46, 4, 1, 3500.00, 3500.00, 'SERVED', '2026-11-05 20:28:14', '2026-11-05 21:11:14');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_46, 5, 2, 5000.00, 10000.00, 'SERVED', '2026-11-05 20:28:14', '2026-11-05 21:11:14');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_46, 21, 2, 1500.00, 3000.00, 'SERVED', '2026-11-05 20:28:14', '2026-11-05 21:11:14');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_46, 'BILL-20261105-0045', 16500.00, 0, 0, 16500.00, 'CASH', 'PAID', '2026-11-05 21:11:14', '2026-11-05 21:11:14', '2026-11-05 21:11:14');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-01-0509-0046', 'COMPLETED', 4, '2026-11-05 20:09:15', '2026-11-05 20:45:15', '2026-11-05 20:09:15', '2026-11-05 20:45:15'
FROM restaurant_tables WHERE table_number = 'VIP-01';
DECLARE @s_id_47 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_47, 'ORD-20261105-0046', 19000.00, 'CONFIRMED', '2026-11-05 20:09:15', '2026-11-05 20:09:15', '2026-11-05 20:09:15');
DECLARE @o_id_47 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_47, 21, 2, 1500.00, 3000.00, 'SERVED', '2026-11-05 20:09:15', '2026-11-05 20:45:15');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_47, 5, 1, 5000.00, 5000.00, 'SERVED', '2026-11-05 20:09:15', '2026-11-05 20:45:15');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_47, 1, 1, 3000.00, 3000.00, 'SERVED', '2026-11-05 20:09:15', '2026-11-05 20:45:15');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_47, 10, 2, 4000.00, 8000.00, 'SERVED', '2026-11-05 20:09:15', '2026-11-05 20:45:15');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_47, 'BILL-20261105-0046', 19000.00, 0, 0, 19000.00, 'BANK_TRANSFER', 'PAID', '2026-11-05 20:45:15', '2026-11-05 20:45:15', '2026-11-05 20:45:15');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-01-0510-0047', 'COMPLETED', 4, '2026-11-05 18:27:43', '2026-11-05 19:14:43', '2026-11-05 18:27:43', '2026-11-05 19:14:43'
FROM restaurant_tables WHERE table_number = 'VIP-01';
DECLARE @s_id_48 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_48, 'ORD-20261105-0047', 17500.00, 'CONFIRMED', '2026-11-05 18:27:43', '2026-11-05 18:27:43', '2026-11-05 18:27:43');
DECLARE @o_id_48 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_48, 7, 2, 4500.00, 9000.00, 'SERVED', '2026-11-05 18:27:43', '2026-11-05 19:14:43');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_48, 10, 1, 4000.00, 4000.00, 'SERVED', '2026-11-05 18:27:43', '2026-11-05 19:14:43');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_48, 20, 1, 1500.00, 1500.00, 'SERVED', '2026-11-05 18:27:43', '2026-11-05 19:14:43');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_48, 21, 2, 1500.00, 3000.00, 'SERVED', '2026-11-05 18:27:43', '2026-11-05 19:14:43');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_48, 'BILL-20261105-0047', 17500.00, 0, 0, 17500.00, 'BANK_TRANSFER', 'PAID', '2026-11-05 19:14:43', '2026-11-05 19:14:43', '2026-11-05 19:14:43');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-03-0511-0048', 'COMPLETED', 4, '2026-11-05 18:27:48', '2026-11-05 19:20:48', '2026-11-05 18:27:48', '2026-11-05 19:20:48'
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_id_49 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_49, 'ORD-20261105-0048', 12000.00, 'CONFIRMED', '2026-11-05 18:27:48', '2026-11-05 18:27:48', '2026-11-05 18:27:48');
DECLARE @o_id_49 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_49, 4, 2, 3500.00, 7000.00, 'SERVED', '2026-11-05 18:27:48', '2026-11-05 19:20:48');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_49, 3, 2, 2500.00, 5000.00, 'SERVED', '2026-11-05 18:27:48', '2026-11-05 19:20:48');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_49, 'BILL-20261105-0048', 12000.00, 0, 0, 12000.00, 'CASH', 'PAID', '2026-11-05 19:20:48', '2026-11-05 19:20:48', '2026-11-05 19:20:48');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-02-0600-0049', 'COMPLETED', 2, '2026-11-06 12:37:45', '2026-11-06 13:46:45', '2026-11-06 12:37:45', '2026-11-06 13:46:45'
FROM restaurant_tables WHERE table_number = 'VIP-02';
DECLARE @s_id_50 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_50, 'ORD-20261106-0049', 16000.00, 'CONFIRMED', '2026-11-06 12:37:45', '2026-11-06 12:37:45', '2026-11-06 12:37:45');
DECLARE @o_id_50 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_50, 5, 2, 5000.00, 10000.00, 'SERVED', '2026-11-06 12:37:45', '2026-11-06 13:46:45');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_50, 12, 2, 3000.00, 6000.00, 'SERVED', '2026-11-06 12:37:45', '2026-11-06 13:46:45');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_50, 'BILL-20261106-0049', 16000.00, 0, 0, 16000.00, 'BANK_TRANSFER', 'PAID', '2026-11-06 13:46:45', '2026-11-06 13:46:45', '2026-11-06 13:46:45');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-02-0601-0050', 'COMPLETED', 2, '2026-11-06 18:41:39', '2026-11-06 19:41:39', '2026-11-06 18:41:39', '2026-11-06 19:41:39'
FROM restaurant_tables WHERE table_number = 'B-02';
DECLARE @s_id_51 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_51, 'ORD-20261106-0050', 11000.00, 'CONFIRMED', '2026-11-06 18:41:39', '2026-11-06 18:41:39', '2026-11-06 18:41:39');
DECLARE @o_id_51 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_51, 20, 2, 1500.00, 3000.00, 'SERVED', '2026-11-06 18:41:39', '2026-11-06 19:41:39');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_51, 23, 1, 1000.00, 1000.00, 'SERVED', '2026-11-06 18:41:39', '2026-11-06 19:41:39');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_51, 4, 2, 3500.00, 7000.00, 'SERVED', '2026-11-06 18:41:39', '2026-11-06 19:41:39');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_51, 'BILL-20261106-0050', 11000.00, 0, 0, 11000.00, 'CASH', 'PAID', '2026-11-06 19:41:39', '2026-11-06 19:41:39', '2026-11-06 19:41:39');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-01-0602-0051', 'COMPLETED', 4, '2026-11-06 18:23:47', '2026-11-06 19:32:47', '2026-11-06 18:23:47', '2026-11-06 19:32:47'
FROM restaurant_tables WHERE table_number = 'B-01';
DECLARE @s_id_52 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_52, 'ORD-20261106-0051', 8000.00, 'CONFIRMED', '2026-11-06 18:23:47', '2026-11-06 18:23:47', '2026-11-06 18:23:47');
DECLARE @o_id_52 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_52, 2, 1, 2000.00, 2000.00, 'SERVED', '2026-11-06 18:23:47', '2026-11-06 19:32:47');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_52, 12, 2, 3000.00, 6000.00, 'SERVED', '2026-11-06 18:23:47', '2026-11-06 19:32:47');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_52, 'BILL-20261106-0051', 8000.00, 0, 0, 8000.00, 'BANK_TRANSFER', 'PAID', '2026-11-06 19:32:47', '2026-11-06 19:32:47', '2026-11-06 19:32:47');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-01-0603-0052', 'COMPLETED', 4, '2026-11-06 20:09:34', '2026-11-06 20:52:34', '2026-11-06 20:09:34', '2026-11-06 20:52:34'
FROM restaurant_tables WHERE table_number = 'B-01';
DECLARE @s_id_53 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_53, 'ORD-20261106-0052', 18500.00, 'CONFIRMED', '2026-11-06 20:09:34', '2026-11-06 20:09:34', '2026-11-06 20:09:34');
DECLARE @o_id_53 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_53, 12, 2, 3000.00, 6000.00, 'SERVED', '2026-11-06 20:09:34', '2026-11-06 20:52:34');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_53, 6, 1, 4500.00, 4500.00, 'SERVED', '2026-11-06 20:09:34', '2026-11-06 20:52:34');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_53, 8, 2, 4000.00, 8000.00, 'SERVED', '2026-11-06 20:09:34', '2026-11-06 20:52:34');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_53, 'BILL-20261106-0052', 18500.00, 0, 0, 18500.00, 'BANK_TRANSFER', 'PAID', '2026-11-06 20:52:34', '2026-11-06 20:52:34', '2026-11-06 20:52:34');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-01-0604-0053', 'COMPLETED', 3, '2026-11-06 11:11:21', '2026-11-06 12:00:21', '2026-11-06 11:11:21', '2026-11-06 12:00:21'
FROM restaurant_tables WHERE table_number = 'T-01';
DECLARE @s_id_54 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_54, 'ORD-20261106-0053', 22500.00, 'CONFIRMED', '2026-11-06 11:11:21', '2026-11-06 11:11:21', '2026-11-06 11:11:21');
DECLARE @o_id_54 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_54, 4, 1, 3500.00, 3500.00, 'SERVED', '2026-11-06 11:11:21', '2026-11-06 12:00:21');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_54, 1, 2, 3000.00, 6000.00, 'SERVED', '2026-11-06 11:11:21', '2026-11-06 12:00:21');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_54, 3, 2, 2500.00, 5000.00, 'SERVED', '2026-11-06 11:11:21', '2026-11-06 12:00:21');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_54, 8, 2, 4000.00, 8000.00, 'SERVED', '2026-11-06 11:11:21', '2026-11-06 12:00:21');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_54, 'BILL-20261106-0053', 22500.00, 0, 0, 22500.00, 'CASH', 'PAID', '2026-11-06 12:00:21', '2026-11-06 12:00:21', '2026-11-06 12:00:21');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-02-0605-0054', 'COMPLETED', 3, '2026-11-06 20:42:19', '2026-11-06 21:45:19', '2026-11-06 20:42:19', '2026-11-06 21:45:19'
FROM restaurant_tables WHERE table_number = 'B-02';
DECLARE @s_id_55 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_55, 'ORD-20261106-0054', 10000.00, 'CONFIRMED', '2026-11-06 20:42:19', '2026-11-06 20:42:19', '2026-11-06 20:42:19');
DECLARE @o_id_55 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_55, 25, 1, 2000.00, 2000.00, 'SERVED', '2026-11-06 20:42:19', '2026-11-06 21:45:19');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_55, 12, 1, 3000.00, 3000.00, 'SERVED', '2026-11-06 20:42:19', '2026-11-06 21:45:19');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_55, 5, 1, 5000.00, 5000.00, 'SERVED', '2026-11-06 20:42:19', '2026-11-06 21:45:19');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_55, 'BILL-20261106-0054', 10000.00, 0, 0, 10000.00, 'BANK_TRANSFER', 'PAID', '2026-11-06 21:45:19', '2026-11-06 21:45:19', '2026-11-06 21:45:19');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-01-0606-0055', 'COMPLETED', 4, '2026-11-06 11:33:38', '2026-11-06 12:25:38', '2026-11-06 11:33:38', '2026-11-06 12:25:38'
FROM restaurant_tables WHERE table_number = 'T-01';
DECLARE @s_id_56 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_56, 'ORD-20261106-0055', 28000.00, 'CONFIRMED', '2026-11-06 11:33:38', '2026-11-06 11:33:38', '2026-11-06 11:33:38');
DECLARE @o_id_56 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_56, 6, 2, 4500.00, 9000.00, 'SERVED', '2026-11-06 11:33:38', '2026-11-06 12:25:38');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_56, 7, 2, 4500.00, 9000.00, 'SERVED', '2026-11-06 11:33:38', '2026-11-06 12:25:38');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_56, 8, 1, 4000.00, 4000.00, 'SERVED', '2026-11-06 11:33:38', '2026-11-06 12:25:38');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_56, 1, 2, 3000.00, 6000.00, 'SERVED', '2026-11-06 11:33:38', '2026-11-06 12:25:38');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_56, 'BILL-20261106-0055', 28000.00, 0, 0, 28000.00, 'CASH', 'PAID', '2026-11-06 12:25:38', '2026-11-06 12:25:38', '2026-11-06 12:25:38');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-01-0607-0056', 'COMPLETED', 3, '2026-11-06 11:35:11', '2026-11-06 12:24:11', '2026-11-06 11:35:11', '2026-11-06 12:24:11'
FROM restaurant_tables WHERE table_number = 'B-01';
DECLARE @s_id_57 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_57, 'ORD-20261106-0056', 11000.00, 'CONFIRMED', '2026-11-06 11:35:11', '2026-11-06 11:35:11', '2026-11-06 11:35:11');
DECLARE @o_id_57 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_57, 8, 1, 4000.00, 4000.00, 'SERVED', '2026-11-06 11:35:11', '2026-11-06 12:24:11');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_57, 20, 1, 1500.00, 1500.00, 'SERVED', '2026-11-06 11:35:11', '2026-11-06 12:24:11');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_57, 3, 1, 2500.00, 2500.00, 'SERVED', '2026-11-06 11:35:11', '2026-11-06 12:24:11');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_57, 21, 2, 1500.00, 3000.00, 'SERVED', '2026-11-06 11:35:11', '2026-11-06 12:24:11');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_57, 'BILL-20261106-0056', 11000.00, 0, 0, 11000.00, 'BANK_TRANSFER', 'PAID', '2026-11-06 12:24:11', '2026-11-06 12:24:11', '2026-11-06 12:24:11');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-01-0608-0057', 'COMPLETED', 4, '2026-11-06 20:36:33', '2026-11-06 21:38:33', '2026-11-06 20:36:33', '2026-11-06 21:38:33'
FROM restaurant_tables WHERE table_number = 'B-01';
DECLARE @s_id_58 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_58, 'ORD-20261106-0057', 16000.00, 'CONFIRMED', '2026-11-06 20:36:33', '2026-11-06 20:36:33', '2026-11-06 20:36:33');
DECLARE @o_id_58 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_58, 4, 2, 3500.00, 7000.00, 'SERVED', '2026-11-06 20:36:33', '2026-11-06 21:38:33');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_58, 6, 2, 4500.00, 9000.00, 'SERVED', '2026-11-06 20:36:33', '2026-11-06 21:38:33');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_58, 'BILL-20261106-0057', 16000.00, 0, 0, 16000.00, 'BANK_TRANSFER', 'PAID', '2026-11-06 21:38:33', '2026-11-06 21:38:33', '2026-11-06 21:38:33');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-01-0609-0058', 'COMPLETED', 3, '2026-11-06 20:17:23', '2026-11-06 21:27:23', '2026-11-06 20:17:23', '2026-11-06 21:27:23'
FROM restaurant_tables WHERE table_number = 'VIP-01';
DECLARE @s_id_59 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_59, 'ORD-20261106-0058', 6000.00, 'CONFIRMED', '2026-11-06 20:17:23', '2026-11-06 20:17:23', '2026-11-06 20:17:23');
DECLARE @o_id_59 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_59, 20, 2, 1500.00, 3000.00, 'SERVED', '2026-11-06 20:17:23', '2026-11-06 21:27:23');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_59, 21, 2, 1500.00, 3000.00, 'SERVED', '2026-11-06 20:17:23', '2026-11-06 21:27:23');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_59, 'BILL-20261106-0058', 6000.00, 0, 0, 6000.00, 'BANK_TRANSFER', 'PAID', '2026-11-06 21:27:23', '2026-11-06 21:27:23', '2026-11-06 21:27:23');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-01-0700-0059', 'COMPLETED', 4, '2026-11-07 11:37:22', '2026-11-07 12:24:22', '2026-11-07 11:37:22', '2026-11-07 12:24:22'
FROM restaurant_tables WHERE table_number = 'VIP-01';
DECLARE @s_id_60 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_60, 'ORD-20261107-0059', 5500.00, 'CONFIRMED', '2026-11-07 11:37:22', '2026-11-07 11:37:22', '2026-11-07 11:37:22');
DECLARE @o_id_60 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_60, 21, 1, 1500.00, 1500.00, 'SERVED', '2026-11-07 11:37:22', '2026-11-07 12:24:22');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_60, 2, 2, 2000.00, 4000.00, 'SERVED', '2026-11-07 11:37:22', '2026-11-07 12:24:22');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_60, 'BILL-20261107-0059', 5500.00, 0, 0, 5500.00, 'CASH', 'PAID', '2026-11-07 12:24:22', '2026-11-07 12:24:22', '2026-11-07 12:24:22');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-04-0701-0060', 'COMPLETED', 3, '2026-11-07 18:47:24', '2026-11-07 19:57:24', '2026-11-07 18:47:24', '2026-11-07 19:57:24'
FROM restaurant_tables WHERE table_number = 'T-04';
DECLARE @s_id_61 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_61, 'ORD-20261107-0060', 4500.00, 'CONFIRMED', '2026-11-07 18:47:24', '2026-11-07 18:47:24', '2026-11-07 18:47:24');
DECLARE @o_id_61 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_61, 21, 1, 1500.00, 1500.00, 'SERVED', '2026-11-07 18:47:24', '2026-11-07 19:57:24');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_61, 12, 1, 3000.00, 3000.00, 'SERVED', '2026-11-07 18:47:24', '2026-11-07 19:57:24');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_61, 'BILL-20261107-0060', 4500.00, 0, 0, 4500.00, 'BANK_TRANSFER', 'PAID', '2026-11-07 19:57:24', '2026-11-07 19:57:24', '2026-11-07 19:57:24');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-01-0702-0061', 'COMPLETED', 2, '2026-11-07 18:17:11', '2026-11-07 19:23:11', '2026-11-07 18:17:11', '2026-11-07 19:23:11'
FROM restaurant_tables WHERE table_number = 'VIP-01';
DECLARE @s_id_62 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_62, 'ORD-20261107-0061', 12000.00, 'CONFIRMED', '2026-11-07 18:17:11', '2026-11-07 18:17:11', '2026-11-07 18:17:11');
DECLARE @o_id_62 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_62, 5, 1, 5000.00, 5000.00, 'SERVED', '2026-11-07 18:17:11', '2026-11-07 19:23:11');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_62, 9, 1, 5000.00, 5000.00, 'SERVED', '2026-11-07 18:17:11', '2026-11-07 19:23:11');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_62, 25, 1, 2000.00, 2000.00, 'SERVED', '2026-11-07 18:17:11', '2026-11-07 19:23:11');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_62, 'BILL-20261107-0061', 12000.00, 0, 0, 12000.00, 'CASH', 'PAID', '2026-11-07 19:23:11', '2026-11-07 19:23:11', '2026-11-07 19:23:11');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-02-0703-0062', 'COMPLETED', 2, '2026-11-07 18:18:45', '2026-11-07 19:18:45', '2026-11-07 18:18:45', '2026-11-07 19:18:45'
FROM restaurant_tables WHERE table_number = 'VIP-02';
DECLARE @s_id_63 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_63, 'ORD-20261107-0062', 13000.00, 'CONFIRMED', '2026-11-07 18:18:45', '2026-11-07 18:18:45', '2026-11-07 18:18:45');
DECLARE @o_id_63 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_63, 12, 2, 3000.00, 6000.00, 'SERVED', '2026-11-07 18:18:45', '2026-11-07 19:18:45');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_63, 13, 2, 3500.00, 7000.00, 'SERVED', '2026-11-07 18:18:45', '2026-11-07 19:18:45');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_63, 'BILL-20261107-0062', 13000.00, 0, 0, 13000.00, 'BANK_TRANSFER', 'PAID', '2026-11-07 19:18:45', '2026-11-07 19:18:45', '2026-11-07 19:18:45');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-02-0704-0063', 'COMPLETED', 4, '2026-11-07 19:30:34', '2026-11-07 20:25:34', '2026-11-07 19:30:34', '2026-11-07 20:25:34'
FROM restaurant_tables WHERE table_number = 'B-02';
DECLARE @s_id_64 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_64, 'ORD-20261107-0063', 16500.00, 'CONFIRMED', '2026-11-07 19:30:34', '2026-11-07 19:30:34', '2026-11-07 19:30:34');
DECLARE @o_id_64 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_64, 10, 1, 4000.00, 4000.00, 'SERVED', '2026-11-07 19:30:34', '2026-11-07 20:25:34');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_64, 12, 2, 3000.00, 6000.00, 'SERVED', '2026-11-07 19:30:34', '2026-11-07 20:25:34');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_64, 9, 1, 5000.00, 5000.00, 'SERVED', '2026-11-07 19:30:34', '2026-11-07 20:25:34');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_64, 21, 1, 1500.00, 1500.00, 'SERVED', '2026-11-07 19:30:34', '2026-11-07 20:25:34');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_64, 'BILL-20261107-0063', 16500.00, 0, 0, 16500.00, 'CASH', 'PAID', '2026-11-07 20:25:34', '2026-11-07 20:25:34', '2026-11-07 20:25:34');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-04-0705-0064', 'COMPLETED', 3, '2026-11-07 18:12:43', '2026-11-07 19:17:43', '2026-11-07 18:12:43', '2026-11-07 19:17:43'
FROM restaurant_tables WHERE table_number = 'T-04';
DECLARE @s_id_65 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_65, 'ORD-20261107-0064', 11500.00, 'CONFIRMED', '2026-11-07 18:12:43', '2026-11-07 18:12:43', '2026-11-07 18:12:43');
DECLARE @o_id_65 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_65, 12, 1, 3000.00, 3000.00, 'SERVED', '2026-11-07 18:12:43', '2026-11-07 19:17:43');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_65, 25, 2, 2000.00, 4000.00, 'SERVED', '2026-11-07 18:12:43', '2026-11-07 19:17:43');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_65, 23, 1, 1000.00, 1000.00, 'SERVED', '2026-11-07 18:12:43', '2026-11-07 19:17:43');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_65, 4, 1, 3500.00, 3500.00, 'SERVED', '2026-11-07 18:12:43', '2026-11-07 19:17:43');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_65, 'BILL-20261107-0064', 11500.00, 0, 0, 11500.00, 'CASH', 'PAID', '2026-11-07 19:17:43', '2026-11-07 19:17:43', '2026-11-07 19:17:43');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-04-0706-0065', 'COMPLETED', 2, '2026-11-07 18:11:50', '2026-11-07 19:15:50', '2026-11-07 18:11:50', '2026-11-07 19:15:50'
FROM restaurant_tables WHERE table_number = 'T-04';
DECLARE @s_id_66 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_66, 'ORD-20261107-0065', 17000.00, 'CONFIRMED', '2026-11-07 18:11:50', '2026-11-07 18:11:50', '2026-11-07 18:11:50');
DECLARE @o_id_66 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_66, 13, 2, 3500.00, 7000.00, 'SERVED', '2026-11-07 18:11:50', '2026-11-07 19:15:50');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_66, 9, 2, 5000.00, 10000.00, 'SERVED', '2026-11-07 18:11:50', '2026-11-07 19:15:50');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_66, 'BILL-20261107-0065', 17000.00, 0, 0, 17000.00, 'BANK_TRANSFER', 'PAID', '2026-11-07 19:15:50', '2026-11-07 19:15:50', '2026-11-07 19:15:50');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-03-0707-0066', 'COMPLETED', 2, '2026-11-07 13:28:32', '2026-11-07 14:24:32', '2026-11-07 13:28:32', '2026-11-07 14:24:32'
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_id_67 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_67, 'ORD-20261107-0066', 11500.00, 'CONFIRMED', '2026-11-07 13:28:32', '2026-11-07 13:28:32', '2026-11-07 13:28:32');
DECLARE @o_id_67 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_67, 20, 1, 1500.00, 1500.00, 'SERVED', '2026-11-07 13:28:32', '2026-11-07 14:24:32');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_67, 5, 2, 5000.00, 10000.00, 'SERVED', '2026-11-07 13:28:32', '2026-11-07 14:24:32');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_67, 'BILL-20261107-0066', 11500.00, 0, 0, 11500.00, 'CASH', 'PAID', '2026-11-07 14:24:32', '2026-11-07 14:24:32', '2026-11-07 14:24:32');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-01-0708-0067', 'COMPLETED', 4, '2026-11-07 19:05:41', '2026-11-07 19:44:41', '2026-11-07 19:05:41', '2026-11-07 19:44:41'
FROM restaurant_tables WHERE table_number = 'T-01';
DECLARE @s_id_68 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_68, 'ORD-20261107-0067', 8000.00, 'CONFIRMED', '2026-11-07 19:05:41', '2026-11-07 19:05:41', '2026-11-07 19:05:41');
DECLARE @o_id_68 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_68, 23, 2, 1000.00, 2000.00, 'SERVED', '2026-11-07 19:05:41', '2026-11-07 19:44:41');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_68, 21, 2, 1500.00, 3000.00, 'SERVED', '2026-11-07 19:05:41', '2026-11-07 19:44:41');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_68, 20, 2, 1500.00, 3000.00, 'SERVED', '2026-11-07 19:05:41', '2026-11-07 19:44:41');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_68, 'BILL-20261107-0067', 8000.00, 0, 0, 8000.00, 'CASH', 'PAID', '2026-11-07 19:44:41', '2026-11-07 19:44:41', '2026-11-07 19:44:41');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-02-0709-0068', 'COMPLETED', 2, '2026-11-07 18:41:50', '2026-11-07 19:21:50', '2026-11-07 18:41:50', '2026-11-07 19:21:50'
FROM restaurant_tables WHERE table_number = 'B-02';
DECLARE @s_id_69 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_69, 'ORD-20261107-0068', 11000.00, 'CONFIRMED', '2026-11-07 18:41:50', '2026-11-07 18:41:50', '2026-11-07 18:41:50');
DECLARE @o_id_69 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_69, 21, 2, 1500.00, 3000.00, 'SERVED', '2026-11-07 18:41:50', '2026-11-07 19:21:50');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_69, 10, 2, 4000.00, 8000.00, 'SERVED', '2026-11-07 18:41:50', '2026-11-07 19:21:50');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_69, 'BILL-20261107-0068', 11000.00, 0, 0, 11000.00, 'BANK_TRANSFER', 'PAID', '2026-11-07 19:21:50', '2026-11-07 19:21:50', '2026-11-07 19:21:50');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-01-0800-0069', 'COMPLETED', 2, '2026-11-08 18:38:32', '2026-11-08 19:20:32', '2026-11-08 18:38:32', '2026-11-08 19:20:32'
FROM restaurant_tables WHERE table_number = 'B-01';
DECLARE @s_id_70 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_70, 'ORD-20261108-0069', 9000.00, 'CONFIRMED', '2026-11-08 18:38:32', '2026-11-08 18:38:32', '2026-11-08 18:38:32');
DECLARE @o_id_70 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_70, 10, 1, 4000.00, 4000.00, 'SERVED', '2026-11-08 18:38:32', '2026-11-08 19:20:32');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_70, 25, 1, 2000.00, 2000.00, 'SERVED', '2026-11-08 18:38:32', '2026-11-08 19:20:32');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_70, 20, 2, 1500.00, 3000.00, 'SERVED', '2026-11-08 18:38:32', '2026-11-08 19:20:32');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_70, 'BILL-20261108-0069', 9000.00, 0, 0, 9000.00, 'BANK_TRANSFER', 'PAID', '2026-11-08 19:20:32', '2026-11-08 19:20:32', '2026-11-08 19:20:32');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-02-0801-0070', 'COMPLETED', 3, '2026-11-08 11:12:37', '2026-11-08 12:01:37', '2026-11-08 11:12:37', '2026-11-08 12:01:37'
FROM restaurant_tables WHERE table_number = 'VIP-02';
DECLARE @s_id_71 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_71, 'ORD-20261108-0070', 10000.00, 'CONFIRMED', '2026-11-08 11:12:37', '2026-11-08 11:12:37', '2026-11-08 11:12:37');
DECLARE @o_id_71 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_71, 23, 2, 1000.00, 2000.00, 'SERVED', '2026-11-08 11:12:37', '2026-11-08 12:01:37');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_71, 8, 2, 4000.00, 8000.00, 'SERVED', '2026-11-08 11:12:37', '2026-11-08 12:01:37');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_71, 'BILL-20261108-0070', 10000.00, 0, 0, 10000.00, 'CASH', 'PAID', '2026-11-08 12:01:37', '2026-11-08 12:01:37', '2026-11-08 12:01:37');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-01-0802-0071', 'COMPLETED', 3, '2026-11-08 12:51:41', '2026-11-08 13:46:41', '2026-11-08 12:51:41', '2026-11-08 13:46:41'
FROM restaurant_tables WHERE table_number = 'VIP-01';
DECLARE @s_id_72 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_72, 'ORD-20261108-0071', 9500.00, 'CONFIRMED', '2026-11-08 12:51:41', '2026-11-08 12:51:41', '2026-11-08 12:51:41');
DECLARE @o_id_72 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_72, 3, 2, 2500.00, 5000.00, 'SERVED', '2026-11-08 12:51:41', '2026-11-08 13:46:41');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_72, 6, 1, 4500.00, 4500.00, 'SERVED', '2026-11-08 12:51:41', '2026-11-08 13:46:41');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_72, 'BILL-20261108-0071', 9500.00, 0, 0, 9500.00, 'CASH', 'PAID', '2026-11-08 13:46:41', '2026-11-08 13:46:41', '2026-11-08 13:46:41');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-02-0803-0072', 'COMPLETED', 4, '2026-11-08 20:11:36', '2026-11-08 21:09:36', '2026-11-08 20:11:36', '2026-11-08 21:09:36'
FROM restaurant_tables WHERE table_number = 'T-02';
DECLARE @s_id_73 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_73, 'ORD-20261108-0072', 22000.00, 'CONFIRMED', '2026-11-08 20:11:36', '2026-11-08 20:11:36', '2026-11-08 20:11:36');
DECLARE @o_id_73 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_73, 21, 2, 1500.00, 3000.00, 'SERVED', '2026-11-08 20:11:36', '2026-11-08 21:09:36');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_73, 7, 2, 4500.00, 9000.00, 'SERVED', '2026-11-08 20:11:36', '2026-11-08 21:09:36');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_73, 2, 1, 2000.00, 2000.00, 'SERVED', '2026-11-08 20:11:36', '2026-11-08 21:09:36');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_73, 8, 2, 4000.00, 8000.00, 'SERVED', '2026-11-08 20:11:36', '2026-11-08 21:09:36');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_73, 'BILL-20261108-0072', 22000.00, 0, 0, 22000.00, 'CASH', 'PAID', '2026-11-08 21:09:36', '2026-11-08 21:09:36', '2026-11-08 21:09:36');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-01-0804-0073', 'COMPLETED', 3, '2026-11-08 18:23:45', '2026-11-08 19:21:45', '2026-11-08 18:23:45', '2026-11-08 19:21:45'
FROM restaurant_tables WHERE table_number = 'VIP-01';
DECLARE @s_id_74 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_74, 'ORD-20261108-0073', 12000.00, 'CONFIRMED', '2026-11-08 18:23:45', '2026-11-08 18:23:45', '2026-11-08 18:23:45');
DECLARE @o_id_74 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_74, 12, 2, 3000.00, 6000.00, 'SERVED', '2026-11-08 18:23:45', '2026-11-08 19:21:45');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_74, 21, 1, 1500.00, 1500.00, 'SERVED', '2026-11-08 18:23:45', '2026-11-08 19:21:45');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_74, 7, 1, 4500.00, 4500.00, 'SERVED', '2026-11-08 18:23:45', '2026-11-08 19:21:45');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_74, 'BILL-20261108-0073', 12000.00, 0, 0, 12000.00, 'BANK_TRANSFER', 'PAID', '2026-11-08 19:21:45', '2026-11-08 19:21:45', '2026-11-08 19:21:45');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-01-0805-0074', 'COMPLETED', 3, '2026-11-08 18:16:13', '2026-11-08 19:02:13', '2026-11-08 18:16:13', '2026-11-08 19:02:13'
FROM restaurant_tables WHERE table_number = 'B-01';
DECLARE @s_id_75 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_75, 'ORD-20261108-0074', 20500.00, 'CONFIRMED', '2026-11-08 18:16:13', '2026-11-08 18:16:13', '2026-11-08 18:16:13');
DECLARE @o_id_75 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_75, 4, 2, 3500.00, 7000.00, 'SERVED', '2026-11-08 18:16:13', '2026-11-08 19:02:13');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_75, 7, 1, 4500.00, 4500.00, 'SERVED', '2026-11-08 18:16:13', '2026-11-08 19:02:13');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_75, 5, 1, 5000.00, 5000.00, 'SERVED', '2026-11-08 18:16:13', '2026-11-08 19:02:13');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_75, 25, 2, 2000.00, 4000.00, 'SERVED', '2026-11-08 18:16:13', '2026-11-08 19:02:13');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_75, 'BILL-20261108-0074', 20500.00, 0, 0, 20500.00, 'CASH', 'PAID', '2026-11-08 19:02:13', '2026-11-08 19:02:13', '2026-11-08 19:02:13');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-04-0806-0075', 'COMPLETED', 4, '2026-11-08 20:12:36', '2026-11-08 21:15:36', '2026-11-08 20:12:36', '2026-11-08 21:15:36'
FROM restaurant_tables WHERE table_number = 'T-04';
DECLARE @s_id_76 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_76, 'ORD-20261108-0075', 24000.00, 'CONFIRMED', '2026-11-08 20:12:36', '2026-11-08 20:12:36', '2026-11-08 20:12:36');
DECLARE @o_id_76 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_76, 12, 2, 3000.00, 6000.00, 'SERVED', '2026-11-08 20:12:36', '2026-11-08 21:15:36');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_76, 9, 2, 5000.00, 10000.00, 'SERVED', '2026-11-08 20:12:36', '2026-11-08 21:15:36');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_76, 10, 2, 4000.00, 8000.00, 'SERVED', '2026-11-08 20:12:36', '2026-11-08 21:15:36');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_76, 'BILL-20261108-0075', 24000.00, 0, 0, 24000.00, 'BANK_TRANSFER', 'PAID', '2026-11-08 21:15:36', '2026-11-08 21:15:36', '2026-11-08 21:15:36');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-02-0807-0076', 'COMPLETED', 2, '2026-11-08 18:22:30', '2026-11-08 19:13:30', '2026-11-08 18:22:30', '2026-11-08 19:13:30'
FROM restaurant_tables WHERE table_number = 'B-02';
DECLARE @s_id_77 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_77, 'ORD-20261108-0076', 13500.00, 'CONFIRMED', '2026-11-08 18:22:30', '2026-11-08 18:22:30', '2026-11-08 18:22:30');
DECLARE @o_id_77 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_77, 23, 2, 1000.00, 2000.00, 'SERVED', '2026-11-08 18:22:30', '2026-11-08 19:13:30');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_77, 6, 1, 4500.00, 4500.00, 'SERVED', '2026-11-08 18:22:30', '2026-11-08 19:13:30');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_77, 9, 1, 5000.00, 5000.00, 'SERVED', '2026-11-08 18:22:30', '2026-11-08 19:13:30');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_77, 2, 1, 2000.00, 2000.00, 'SERVED', '2026-11-08 18:22:30', '2026-11-08 19:13:30');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_77, 'BILL-20261108-0076', 13500.00, 0, 0, 13500.00, 'BANK_TRANSFER', 'PAID', '2026-11-08 19:13:30', '2026-11-08 19:13:30', '2026-11-08 19:13:30');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-02-0808-0077', 'COMPLETED', 4, '2026-11-08 20:45:20', '2026-11-08 21:54:20', '2026-11-08 20:45:20', '2026-11-08 21:54:20'
FROM restaurant_tables WHERE table_number = 'B-02';
DECLARE @s_id_78 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_78, 'ORD-20261108-0077', 12000.00, 'CONFIRMED', '2026-11-08 20:45:20', '2026-11-08 20:45:20', '2026-11-08 20:45:20');
DECLARE @o_id_78 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_78, 8, 1, 4000.00, 4000.00, 'SERVED', '2026-11-08 20:45:20', '2026-11-08 21:54:20');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_78, 2, 1, 2000.00, 2000.00, 'SERVED', '2026-11-08 20:45:20', '2026-11-08 21:54:20');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_78, 25, 1, 2000.00, 2000.00, 'SERVED', '2026-11-08 20:45:20', '2026-11-08 21:54:20');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_78, 10, 1, 4000.00, 4000.00, 'SERVED', '2026-11-08 20:45:20', '2026-11-08 21:54:20');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_78, 'BILL-20261108-0077', 12000.00, 0, 0, 12000.00, 'BANK_TRANSFER', 'PAID', '2026-11-08 21:54:20', '2026-11-08 21:54:20', '2026-11-08 21:54:20');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-03-0900-0078', 'COMPLETED', 2, '2026-11-09 11:43:16', '2026-11-09 12:51:16', '2026-11-09 11:43:16', '2026-11-09 12:51:16'
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_id_79 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_79, 'ORD-20261109-0078', 10000.00, 'CONFIRMED', '2026-11-09 11:43:16', '2026-11-09 11:43:16', '2026-11-09 11:43:16');
DECLARE @o_id_79 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_79, 12, 1, 3000.00, 3000.00, 'SERVED', '2026-11-09 11:43:16', '2026-11-09 12:51:16');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_79, 7, 1, 4500.00, 4500.00, 'SERVED', '2026-11-09 11:43:16', '2026-11-09 12:51:16');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_79, 3, 1, 2500.00, 2500.00, 'SERVED', '2026-11-09 11:43:16', '2026-11-09 12:51:16');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_79, 'BILL-20261109-0078', 10000.00, 0, 0, 10000.00, 'CASH', 'PAID', '2026-11-09 12:51:16', '2026-11-09 12:51:16', '2026-11-09 12:51:16');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-02-0901-0079', 'COMPLETED', 3, '2026-11-09 12:16:18', '2026-11-09 13:31:18', '2026-11-09 12:16:18', '2026-11-09 13:31:18'
FROM restaurant_tables WHERE table_number = 'T-02';
DECLARE @s_id_80 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_80, 'ORD-20261109-0079', 9500.00, 'CONFIRMED', '2026-11-09 12:16:18', '2026-11-09 12:16:18', '2026-11-09 12:16:18');
DECLARE @o_id_80 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_80, 25, 1, 2000.00, 2000.00, 'SERVED', '2026-11-09 12:16:18', '2026-11-09 13:31:18');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_80, 23, 1, 1000.00, 1000.00, 'SERVED', '2026-11-09 12:16:18', '2026-11-09 13:31:18');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_80, 3, 1, 2500.00, 2500.00, 'SERVED', '2026-11-09 12:16:18', '2026-11-09 13:31:18');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_80, 2, 2, 2000.00, 4000.00, 'SERVED', '2026-11-09 12:16:18', '2026-11-09 13:31:18');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_80, 'BILL-20261109-0079', 9500.00, 0, 0, 9500.00, 'BANK_TRANSFER', 'PAID', '2026-11-09 13:31:18', '2026-11-09 13:31:18', '2026-11-09 13:31:18');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-01-0902-0080', 'COMPLETED', 2, '2026-11-09 18:10:21', '2026-11-09 18:54:21', '2026-11-09 18:10:21', '2026-11-09 18:54:21'
FROM restaurant_tables WHERE table_number = 'VIP-01';
DECLARE @s_id_81 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_81, 'ORD-20261109-0080', 16000.00, 'CONFIRMED', '2026-11-09 18:10:21', '2026-11-09 18:10:21', '2026-11-09 18:10:21');
DECLARE @o_id_81 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_81, 4, 2, 3500.00, 7000.00, 'SERVED', '2026-11-09 18:10:21', '2026-11-09 18:54:21');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_81, 7, 2, 4500.00, 9000.00, 'SERVED', '2026-11-09 18:10:21', '2026-11-09 18:54:21');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_81, 'BILL-20261109-0080', 16000.00, 0, 0, 16000.00, 'BANK_TRANSFER', 'PAID', '2026-11-09 18:54:21', '2026-11-09 18:54:21', '2026-11-09 18:54:21');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-02-0903-0081', 'COMPLETED', 4, '2026-11-09 12:34:10', '2026-11-09 13:38:10', '2026-11-09 12:34:10', '2026-11-09 13:38:10'
FROM restaurant_tables WHERE table_number = 'B-02';
DECLARE @s_id_82 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_82, 'ORD-20261109-0081', 10500.00, 'CONFIRMED', '2026-11-09 12:34:10', '2026-11-09 12:34:10', '2026-11-09 12:34:10');
DECLARE @o_id_82 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_82, 12, 2, 3000.00, 6000.00, 'SERVED', '2026-11-09 12:34:10', '2026-11-09 13:38:10');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_82, 21, 1, 1500.00, 1500.00, 'SERVED', '2026-11-09 12:34:10', '2026-11-09 13:38:10');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_82, 1, 1, 3000.00, 3000.00, 'SERVED', '2026-11-09 12:34:10', '2026-11-09 13:38:10');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_82, 'BILL-20261109-0081', 10500.00, 0, 0, 10500.00, 'CASH', 'PAID', '2026-11-09 13:38:10', '2026-11-09 13:38:10', '2026-11-09 13:38:10');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-02-0904-0082', 'COMPLETED', 2, '2026-11-09 20:45:28', '2026-11-09 21:30:28', '2026-11-09 20:45:28', '2026-11-09 21:30:28'
FROM restaurant_tables WHERE table_number = 'T-02';
DECLARE @s_id_83 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_83, 'ORD-20261109-0082', 10000.00, 'CONFIRMED', '2026-11-09 20:45:28', '2026-11-09 20:45:28', '2026-11-09 20:45:28');
DECLARE @o_id_83 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_83, 12, 1, 3000.00, 3000.00, 'SERVED', '2026-11-09 20:45:28', '2026-11-09 21:30:28');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_83, 4, 2, 3500.00, 7000.00, 'SERVED', '2026-11-09 20:45:28', '2026-11-09 21:30:28');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_83, 'BILL-20261109-0082', 10000.00, 0, 0, 10000.00, 'CASH', 'PAID', '2026-11-09 21:30:28', '2026-11-09 21:30:28', '2026-11-09 21:30:28');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-02-0905-0083', 'COMPLETED', 3, '2026-11-09 20:36:24', '2026-11-09 21:38:24', '2026-11-09 20:36:24', '2026-11-09 21:38:24'
FROM restaurant_tables WHERE table_number = 'VIP-02';
DECLARE @s_id_84 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_84, 'ORD-20261109-0083', 16000.00, 'CONFIRMED', '2026-11-09 20:36:24', '2026-11-09 20:36:24', '2026-11-09 20:36:24');
DECLARE @o_id_84 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_84, 9, 2, 5000.00, 10000.00, 'SERVED', '2026-11-09 20:36:24', '2026-11-09 21:38:24');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_84, 25, 1, 2000.00, 2000.00, 'SERVED', '2026-11-09 20:36:24', '2026-11-09 21:38:24');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_84, 8, 1, 4000.00, 4000.00, 'SERVED', '2026-11-09 20:36:24', '2026-11-09 21:38:24');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_84, 'BILL-20261109-0083', 16000.00, 0, 0, 16000.00, 'BANK_TRANSFER', 'PAID', '2026-11-09 21:38:24', '2026-11-09 21:38:24', '2026-11-09 21:38:24');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-02-0906-0084', 'COMPLETED', 2, '2026-11-09 18:35:23', '2026-11-09 19:21:23', '2026-11-09 18:35:23', '2026-11-09 19:21:23'
FROM restaurant_tables WHERE table_number = 'VIP-02';
DECLARE @s_id_85 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_85, 'ORD-20261109-0084', 26000.00, 'CONFIRMED', '2026-11-09 18:35:23', '2026-11-09 18:35:23', '2026-11-09 18:35:23');
DECLARE @o_id_85 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_85, 6, 2, 4500.00, 9000.00, 'SERVED', '2026-11-09 18:35:23', '2026-11-09 19:21:23');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_85, 12, 1, 3000.00, 3000.00, 'SERVED', '2026-11-09 18:35:23', '2026-11-09 19:21:23');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_85, 9, 1, 5000.00, 5000.00, 'SERVED', '2026-11-09 18:35:23', '2026-11-09 19:21:23');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_85, 7, 2, 4500.00, 9000.00, 'SERVED', '2026-11-09 18:35:23', '2026-11-09 19:21:23');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_85, 'BILL-20261109-0084', 26000.00, 0, 0, 26000.00, 'BANK_TRANSFER', 'PAID', '2026-11-09 19:21:23', '2026-11-09 19:21:23', '2026-11-09 19:21:23');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-01-0907-0085', 'COMPLETED', 3, '2026-11-09 19:24:25', '2026-11-09 20:18:25', '2026-11-09 19:24:25', '2026-11-09 20:18:25'
FROM restaurant_tables WHERE table_number = 'B-01';
DECLARE @s_id_86 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_86, 'ORD-20261109-0085', 11000.00, 'CONFIRMED', '2026-11-09 19:24:25', '2026-11-09 19:24:25', '2026-11-09 19:24:25');
DECLARE @o_id_86 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_86, 1, 1, 3000.00, 3000.00, 'SERVED', '2026-11-09 19:24:25', '2026-11-09 20:18:25');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_86, 10, 2, 4000.00, 8000.00, 'SERVED', '2026-11-09 19:24:25', '2026-11-09 20:18:25');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_86, 'BILL-20261109-0085', 11000.00, 0, 0, 11000.00, 'BANK_TRANSFER', 'PAID', '2026-11-09 20:18:25', '2026-11-09 20:18:25', '2026-11-09 20:18:25');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-02-0908-0086', 'COMPLETED', 3, '2026-11-09 11:20:13', '2026-11-09 12:05:13', '2026-11-09 11:20:13', '2026-11-09 12:05:13'
FROM restaurant_tables WHERE table_number = 'B-02';
DECLARE @s_id_87 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_87, 'ORD-20261109-0086', 10500.00, 'CONFIRMED', '2026-11-09 11:20:13', '2026-11-09 11:20:13', '2026-11-09 11:20:13');
DECLARE @o_id_87 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_87, 21, 2, 1500.00, 3000.00, 'SERVED', '2026-11-09 11:20:13', '2026-11-09 12:05:13');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_87, 23, 1, 1000.00, 1000.00, 'SERVED', '2026-11-09 11:20:13', '2026-11-09 12:05:13');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_87, 25, 2, 2000.00, 4000.00, 'SERVED', '2026-11-09 11:20:13', '2026-11-09 12:05:13');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_87, 3, 1, 2500.00, 2500.00, 'SERVED', '2026-11-09 11:20:13', '2026-11-09 12:05:13');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_87, 'BILL-20261109-0086', 10500.00, 0, 0, 10500.00, 'BANK_TRANSFER', 'PAID', '2026-11-09 12:05:13', '2026-11-09 12:05:13', '2026-11-09 12:05:13');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-03-0909-0087', 'COMPLETED', 4, '2026-11-09 11:33:22', '2026-11-09 12:17:22', '2026-11-09 11:33:22', '2026-11-09 12:17:22'
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_id_88 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_88, 'ORD-20261109-0087', 10500.00, 'CONFIRMED', '2026-11-09 11:33:22', '2026-11-09 11:33:22', '2026-11-09 11:33:22');
DECLARE @o_id_88 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_88, 1, 2, 3000.00, 6000.00, 'SERVED', '2026-11-09 11:33:22', '2026-11-09 12:17:22');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_88, 6, 1, 4500.00, 4500.00, 'SERVED', '2026-11-09 11:33:22', '2026-11-09 12:17:22');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_88, 'BILL-20261109-0087', 10500.00, 0, 0, 10500.00, 'BANK_TRANSFER', 'PAID', '2026-11-09 12:17:22', '2026-11-09 12:17:22', '2026-11-09 12:17:22');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-02-0910-0088', 'COMPLETED', 3, '2026-11-09 13:36:26', '2026-11-09 14:23:26', '2026-11-09 13:36:26', '2026-11-09 14:23:26'
FROM restaurant_tables WHERE table_number = 'B-02';
DECLARE @s_id_89 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_89, 'ORD-20261109-0088', 8000.00, 'CONFIRMED', '2026-11-09 13:36:26', '2026-11-09 13:36:26', '2026-11-09 13:36:26');
DECLARE @o_id_89 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_89, 25, 1, 2000.00, 2000.00, 'SERVED', '2026-11-09 13:36:26', '2026-11-09 14:23:26');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_89, 12, 1, 3000.00, 3000.00, 'SERVED', '2026-11-09 13:36:26', '2026-11-09 14:23:26');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_89, 1, 1, 3000.00, 3000.00, 'SERVED', '2026-11-09 13:36:26', '2026-11-09 14:23:26');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_89, 'BILL-20261109-0088', 8000.00, 0, 0, 8000.00, 'BANK_TRANSFER', 'PAID', '2026-11-09 14:23:26', '2026-11-09 14:23:26', '2026-11-09 14:23:26');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-02-0911-0089', 'COMPLETED', 2, '2026-11-09 12:08:35', '2026-11-09 12:44:35', '2026-11-09 12:08:35', '2026-11-09 12:44:35'
FROM restaurant_tables WHERE table_number = 'VIP-02';
DECLARE @s_id_90 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_90, 'ORD-20261109-0089', 10000.00, 'CONFIRMED', '2026-11-09 12:08:35', '2026-11-09 12:08:35', '2026-11-09 12:08:35');
DECLARE @o_id_90 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_90, 20, 2, 1500.00, 3000.00, 'SERVED', '2026-11-09 12:08:35', '2026-11-09 12:44:35');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_90, 23, 1, 1000.00, 1000.00, 'SERVED', '2026-11-09 12:08:35', '2026-11-09 12:44:35');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_90, 1, 2, 3000.00, 6000.00, 'SERVED', '2026-11-09 12:08:35', '2026-11-09 12:44:35');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_90, 'BILL-20261109-0089', 10000.00, 0, 0, 10000.00, 'BANK_TRANSFER', 'PAID', '2026-11-09 12:44:35', '2026-11-09 12:44:35', '2026-11-09 12:44:35');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-03-1000-0090', 'COMPLETED', 4, '2026-11-10 19:06:31', '2026-11-10 19:47:31', '2026-11-10 19:06:31', '2026-11-10 19:47:31'
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_id_91 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_91, 'ORD-20261110-0090', 11000.00, 'CONFIRMED', '2026-11-10 19:06:31', '2026-11-10 19:06:31', '2026-11-10 19:06:31');
DECLARE @o_id_91 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_91, 3, 2, 2500.00, 5000.00, 'SERVED', '2026-11-10 19:06:31', '2026-11-10 19:47:31');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_91, 23, 2, 1000.00, 2000.00, 'SERVED', '2026-11-10 19:06:31', '2026-11-10 19:47:31');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_91, 25, 2, 2000.00, 4000.00, 'SERVED', '2026-11-10 19:06:31', '2026-11-10 19:47:31');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_91, 'BILL-20261110-0090', 11000.00, 0, 0, 11000.00, 'CASH', 'PAID', '2026-11-10 19:47:31', '2026-11-10 19:47:31', '2026-11-10 19:47:31');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-02-1001-0091', 'COMPLETED', 4, '2026-11-10 18:51:45', '2026-11-10 19:27:45', '2026-11-10 18:51:45', '2026-11-10 19:27:45'
FROM restaurant_tables WHERE table_number = 'T-02';
DECLARE @s_id_92 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_92, 'ORD-20261110-0091', 17500.00, 'CONFIRMED', '2026-11-10 18:51:45', '2026-11-10 18:51:45', '2026-11-10 18:51:45');
DECLARE @o_id_92 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_92, 4, 1, 3500.00, 3500.00, 'SERVED', '2026-11-10 18:51:45', '2026-11-10 19:27:45');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_92, 10, 2, 4000.00, 8000.00, 'SERVED', '2026-11-10 18:51:45', '2026-11-10 19:27:45');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_92, 12, 2, 3000.00, 6000.00, 'SERVED', '2026-11-10 18:51:45', '2026-11-10 19:27:45');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_92, 'BILL-20261110-0091', 17500.00, 0, 0, 17500.00, 'BANK_TRANSFER', 'PAID', '2026-11-10 19:27:45', '2026-11-10 19:27:45', '2026-11-10 19:27:45');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-01-1002-0092', 'COMPLETED', 3, '2026-11-10 19:06:40', '2026-11-10 20:07:40', '2026-11-10 19:06:40', '2026-11-10 20:07:40'
FROM restaurant_tables WHERE table_number = 'VIP-01';
DECLARE @s_id_93 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_93, 'ORD-20261110-0092', 13000.00, 'CONFIRMED', '2026-11-10 19:06:40', '2026-11-10 19:06:40', '2026-11-10 19:06:40');
DECLARE @o_id_93 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_93, 12, 1, 3000.00, 3000.00, 'SERVED', '2026-11-10 19:06:40', '2026-11-10 20:07:40');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_93, 9, 2, 5000.00, 10000.00, 'SERVED', '2026-11-10 19:06:40', '2026-11-10 20:07:40');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_93, 'BILL-20261110-0092', 13000.00, 0, 0, 13000.00, 'BANK_TRANSFER', 'PAID', '2026-11-10 20:07:40', '2026-11-10 20:07:40', '2026-11-10 20:07:40');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-02-1003-0093', 'COMPLETED', 3, '2026-11-10 18:23:25', '2026-11-10 19:36:25', '2026-11-10 18:23:25', '2026-11-10 19:36:25'
FROM restaurant_tables WHERE table_number = 'B-02';
DECLARE @s_id_94 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_94, 'ORD-20261110-0093', 11000.00, 'CONFIRMED', '2026-11-10 18:23:25', '2026-11-10 18:23:25', '2026-11-10 18:23:25');
DECLARE @o_id_94 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_94, 7, 2, 4500.00, 9000.00, 'SERVED', '2026-11-10 18:23:25', '2026-11-10 19:36:25');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_94, 23, 2, 1000.00, 2000.00, 'SERVED', '2026-11-10 18:23:25', '2026-11-10 19:36:25');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_94, 'BILL-20261110-0093', 11000.00, 0, 0, 11000.00, 'CASH', 'PAID', '2026-11-10 19:36:25', '2026-11-10 19:36:25', '2026-11-10 19:36:25');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-03-1004-0094', 'COMPLETED', 3, '2026-11-10 12:47:17', '2026-11-10 13:37:17', '2026-11-10 12:47:17', '2026-11-10 13:37:17'
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_id_95 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_95, 'ORD-20261110-0094', 18000.00, 'CONFIRMED', '2026-11-10 12:47:17', '2026-11-10 12:47:17', '2026-11-10 12:47:17');
DECLARE @o_id_95 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_95, 5, 2, 5000.00, 10000.00, 'SERVED', '2026-11-10 12:47:17', '2026-11-10 13:37:17');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_95, 25, 2, 2000.00, 4000.00, 'SERVED', '2026-11-10 12:47:17', '2026-11-10 13:37:17');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_95, 20, 1, 1500.00, 1500.00, 'SERVED', '2026-11-10 12:47:17', '2026-11-10 13:37:17');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_95, 3, 1, 2500.00, 2500.00, 'SERVED', '2026-11-10 12:47:17', '2026-11-10 13:37:17');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_95, 'BILL-20261110-0094', 18000.00, 0, 0, 18000.00, 'BANK_TRANSFER', 'PAID', '2026-11-10 13:37:17', '2026-11-10 13:37:17', '2026-11-10 13:37:17');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-02-1005-0095', 'COMPLETED', 3, '2026-11-10 12:37:18', '2026-11-10 13:35:18', '2026-11-10 12:37:18', '2026-11-10 13:35:18'
FROM restaurant_tables WHERE table_number = 'VIP-02';
DECLARE @s_id_96 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_96, 'ORD-20261110-0095', 14000.00, 'CONFIRMED', '2026-11-10 12:37:18', '2026-11-10 12:37:18', '2026-11-10 12:37:18');
DECLARE @o_id_96 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_96, 25, 2, 2000.00, 4000.00, 'SERVED', '2026-11-10 12:37:18', '2026-11-10 13:35:18');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_96, 23, 2, 1000.00, 2000.00, 'SERVED', '2026-11-10 12:37:18', '2026-11-10 13:35:18');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_96, 10, 2, 4000.00, 8000.00, 'SERVED', '2026-11-10 12:37:18', '2026-11-10 13:35:18');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_96, 'BILL-20261110-0095', 14000.00, 0, 0, 14000.00, 'BANK_TRANSFER', 'PAID', '2026-11-10 13:35:18', '2026-11-10 13:35:18', '2026-11-10 13:35:18');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-02-1006-0096', 'COMPLETED', 2, '2026-11-10 13:12:45', '2026-11-10 14:04:45', '2026-11-10 13:12:45', '2026-11-10 14:04:45'
FROM restaurant_tables WHERE table_number = 'VIP-02';
DECLARE @s_id_97 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_97, 'ORD-20261110-0096', 17500.00, 'CONFIRMED', '2026-11-10 13:12:45', '2026-11-10 13:12:45', '2026-11-10 13:12:45');
DECLARE @o_id_97 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_97, 13, 1, 3500.00, 3500.00, 'SERVED', '2026-11-10 13:12:45', '2026-11-10 14:04:45');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_97, 10, 2, 4000.00, 8000.00, 'SERVED', '2026-11-10 13:12:45', '2026-11-10 14:04:45');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_97, 12, 2, 3000.00, 6000.00, 'SERVED', '2026-11-10 13:12:45', '2026-11-10 14:04:45');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_97, 'BILL-20261110-0096', 17500.00, 0, 0, 17500.00, 'BANK_TRANSFER', 'PAID', '2026-11-10 14:04:45', '2026-11-10 14:04:45', '2026-11-10 14:04:45');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-02-1007-0097', 'COMPLETED', 4, '2026-11-10 13:47:44', '2026-11-10 14:54:44', '2026-11-10 13:47:44', '2026-11-10 14:54:44'
FROM restaurant_tables WHERE table_number = 'B-02';
DECLARE @s_id_98 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_98, 'ORD-20261110-0097', 11500.00, 'CONFIRMED', '2026-11-10 13:47:44', '2026-11-10 13:47:44', '2026-11-10 13:47:44');
DECLARE @o_id_98 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_98, 7, 1, 4500.00, 4500.00, 'SERVED', '2026-11-10 13:47:44', '2026-11-10 14:54:44');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_98, 2, 1, 2000.00, 2000.00, 'SERVED', '2026-11-10 13:47:44', '2026-11-10 14:54:44');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_98, 3, 2, 2500.00, 5000.00, 'SERVED', '2026-11-10 13:47:44', '2026-11-10 14:54:44');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_98, 'BILL-20261110-0097', 11500.00, 0, 0, 11500.00, 'BANK_TRANSFER', 'PAID', '2026-11-10 14:54:44', '2026-11-10 14:54:44', '2026-11-10 14:54:44');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-03-1008-0098', 'COMPLETED', 2, '2026-11-10 13:45:23', '2026-11-10 14:45:23', '2026-11-10 13:45:23', '2026-11-10 14:45:23'
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_id_99 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_99, 'ORD-20261110-0098', 7000.00, 'CONFIRMED', '2026-11-10 13:45:23', '2026-11-10 13:45:23', '2026-11-10 13:45:23');
DECLARE @o_id_99 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_99, 21, 2, 1500.00, 3000.00, 'SERVED', '2026-11-10 13:45:23', '2026-11-10 14:45:23');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_99, 10, 1, 4000.00, 4000.00, 'SERVED', '2026-11-10 13:45:23', '2026-11-10 14:45:23');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_99, 'BILL-20261110-0098', 7000.00, 0, 0, 7000.00, 'CASH', 'PAID', '2026-11-10 14:45:23', '2026-11-10 14:45:23', '2026-11-10 14:45:23');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-01-1100-0099', 'COMPLETED', 3, '2026-11-11 12:55:15', '2026-11-11 14:02:15', '2026-11-11 12:55:15', '2026-11-11 14:02:15'
FROM restaurant_tables WHERE table_number = 'T-01';
DECLARE @s_id_100 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_100, 'ORD-20261111-0099', 12500.00, 'CONFIRMED', '2026-11-11 12:55:15', '2026-11-11 12:55:15', '2026-11-11 12:55:15');
DECLARE @o_id_100 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_100, 2, 1, 2000.00, 2000.00, 'SERVED', '2026-11-11 12:55:15', '2026-11-11 14:02:15');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_100, 20, 2, 1500.00, 3000.00, 'SERVED', '2026-11-11 12:55:15', '2026-11-11 14:02:15');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_100, 1, 1, 3000.00, 3000.00, 'SERVED', '2026-11-11 12:55:15', '2026-11-11 14:02:15');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_100, 6, 1, 4500.00, 4500.00, 'SERVED', '2026-11-11 12:55:15', '2026-11-11 14:02:15');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_100, 'BILL-20261111-0099', 12500.00, 0, 0, 12500.00, 'BANK_TRANSFER', 'PAID', '2026-11-11 14:02:15', '2026-11-11 14:02:15', '2026-11-11 14:02:15');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-02-1101-0100', 'COMPLETED', 4, '2026-11-11 19:32:48', '2026-11-11 20:19:48', '2026-11-11 19:32:48', '2026-11-11 20:19:48'
FROM restaurant_tables WHERE table_number = 'B-02';
DECLARE @s_id_101 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_101, 'ORD-20261111-0100', 14000.00, 'CONFIRMED', '2026-11-11 19:32:48', '2026-11-11 19:32:48', '2026-11-11 19:32:48');
DECLARE @o_id_101 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_101, 3, 1, 2500.00, 2500.00, 'SERVED', '2026-11-11 19:32:48', '2026-11-11 20:19:48');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_101, 6, 1, 4500.00, 4500.00, 'SERVED', '2026-11-11 19:32:48', '2026-11-11 20:19:48');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_101, 25, 1, 2000.00, 2000.00, 'SERVED', '2026-11-11 19:32:48', '2026-11-11 20:19:48');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_101, 9, 1, 5000.00, 5000.00, 'SERVED', '2026-11-11 19:32:48', '2026-11-11 20:19:48');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_101, 'BILL-20261111-0100', 14000.00, 0, 0, 14000.00, 'CASH', 'PAID', '2026-11-11 20:19:48', '2026-11-11 20:19:48', '2026-11-11 20:19:48');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-03-1102-0101', 'COMPLETED', 2, '2026-11-11 19:54:13', '2026-11-11 20:41:13', '2026-11-11 19:54:13', '2026-11-11 20:41:13'
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_id_102 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_102, 'ORD-20261111-0101', 25000.00, 'CONFIRMED', '2026-11-11 19:54:13', '2026-11-11 19:54:13', '2026-11-11 19:54:13');
DECLARE @o_id_102 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_102, 21, 2, 1500.00, 3000.00, 'SERVED', '2026-11-11 19:54:13', '2026-11-11 20:41:13');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_102, 5, 2, 5000.00, 10000.00, 'SERVED', '2026-11-11 19:54:13', '2026-11-11 20:41:13');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_102, 25, 2, 2000.00, 4000.00, 'SERVED', '2026-11-11 19:54:13', '2026-11-11 20:41:13');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_102, 10, 2, 4000.00, 8000.00, 'SERVED', '2026-11-11 19:54:13', '2026-11-11 20:41:13');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_102, 'BILL-20261111-0101', 25000.00, 0, 0, 25000.00, 'BANK_TRANSFER', 'PAID', '2026-11-11 20:41:13', '2026-11-11 20:41:13', '2026-11-11 20:41:13');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-02-1103-0102', 'COMPLETED', 2, '2026-11-11 13:40:29', '2026-11-11 14:46:29', '2026-11-11 13:40:29', '2026-11-11 14:46:29'
FROM restaurant_tables WHERE table_number = 'T-02';
DECLARE @s_id_103 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_103, 'ORD-20261111-0102', 14500.00, 'CONFIRMED', '2026-11-11 13:40:29', '2026-11-11 13:40:29', '2026-11-11 13:40:29');
DECLARE @o_id_103 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_103, 3, 2, 2500.00, 5000.00, 'SERVED', '2026-11-11 13:40:29', '2026-11-11 14:46:29');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_103, 5, 1, 5000.00, 5000.00, 'SERVED', '2026-11-11 13:40:29', '2026-11-11 14:46:29');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_103, 7, 1, 4500.00, 4500.00, 'SERVED', '2026-11-11 13:40:29', '2026-11-11 14:46:29');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_103, 'BILL-20261111-0102', 14500.00, 0, 0, 14500.00, 'BANK_TRANSFER', 'PAID', '2026-11-11 14:46:29', '2026-11-11 14:46:29', '2026-11-11 14:46:29');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-02-1104-0103', 'COMPLETED', 4, '2026-11-11 18:08:19', '2026-11-11 19:09:19', '2026-11-11 18:08:19', '2026-11-11 19:09:19'
FROM restaurant_tables WHERE table_number = 'B-02';
DECLARE @s_id_104 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_104, 'ORD-20261111-0103', 6000.00, 'CONFIRMED', '2026-11-11 18:08:19', '2026-11-11 18:08:19', '2026-11-11 18:08:19');
DECLARE @o_id_104 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_104, 25, 2, 2000.00, 4000.00, 'SERVED', '2026-11-11 18:08:19', '2026-11-11 19:09:19');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_104, 2, 1, 2000.00, 2000.00, 'SERVED', '2026-11-11 18:08:19', '2026-11-11 19:09:19');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_104, 'BILL-20261111-0103', 6000.00, 0, 0, 6000.00, 'CASH', 'PAID', '2026-11-11 19:09:19', '2026-11-11 19:09:19', '2026-11-11 19:09:19');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-02-1105-0104', 'COMPLETED', 3, '2026-11-11 11:53:13', '2026-11-11 12:36:13', '2026-11-11 11:53:13', '2026-11-11 12:36:13'
FROM restaurant_tables WHERE table_number = 'VIP-02';
DECLARE @s_id_105 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_105, 'ORD-20261111-0104', 13000.00, 'CONFIRMED', '2026-11-11 11:53:13', '2026-11-11 11:53:13', '2026-11-11 11:53:13');
DECLARE @o_id_105 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_105, 2, 2, 2000.00, 4000.00, 'SERVED', '2026-11-11 11:53:13', '2026-11-11 12:36:13');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_105, 7, 2, 4500.00, 9000.00, 'SERVED', '2026-11-11 11:53:13', '2026-11-11 12:36:13');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_105, 'BILL-20261111-0104', 13000.00, 0, 0, 13000.00, 'BANK_TRANSFER', 'PAID', '2026-11-11 12:36:13', '2026-11-11 12:36:13', '2026-11-11 12:36:13');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-01-1106-0105', 'COMPLETED', 3, '2026-11-11 18:30:45', '2026-11-11 19:43:45', '2026-11-11 18:30:45', '2026-11-11 19:43:45'
FROM restaurant_tables WHERE table_number = 'VIP-01';
DECLARE @s_id_106 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_106, 'ORD-20261111-0105', 15000.00, 'CONFIRMED', '2026-11-11 18:30:45', '2026-11-11 18:30:45', '2026-11-11 18:30:45');
DECLARE @o_id_106 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_106, 6, 2, 4500.00, 9000.00, 'SERVED', '2026-11-11 18:30:45', '2026-11-11 19:43:45');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_106, 1, 2, 3000.00, 6000.00, 'SERVED', '2026-11-11 18:30:45', '2026-11-11 19:43:45');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_106, 'BILL-20261111-0105', 15000.00, 0, 0, 15000.00, 'BANK_TRANSFER', 'PAID', '2026-11-11 19:43:45', '2026-11-11 19:43:45', '2026-11-11 19:43:45');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-02-1107-0106', 'COMPLETED', 3, '2026-11-11 12:50:42', '2026-11-11 13:27:42', '2026-11-11 12:50:42', '2026-11-11 13:27:42'
FROM restaurant_tables WHERE table_number = 'T-02';
DECLARE @s_id_107 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_107, 'ORD-20261111-0106', 14000.00, 'CONFIRMED', '2026-11-11 12:50:42', '2026-11-11 12:50:42', '2026-11-11 12:50:42');
DECLARE @o_id_107 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_107, 23, 2, 1000.00, 2000.00, 'SERVED', '2026-11-11 12:50:42', '2026-11-11 13:27:42');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_107, 4, 2, 3500.00, 7000.00, 'SERVED', '2026-11-11 12:50:42', '2026-11-11 13:27:42');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_107, 9, 1, 5000.00, 5000.00, 'SERVED', '2026-11-11 12:50:42', '2026-11-11 13:27:42');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_107, 'BILL-20261111-0106', 14000.00, 0, 0, 14000.00, 'CASH', 'PAID', '2026-11-11 13:27:42', '2026-11-11 13:27:42', '2026-11-11 13:27:42');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-03-1108-0107', 'COMPLETED', 3, '2026-11-11 20:51:18', '2026-11-11 21:51:18', '2026-11-11 20:51:18', '2026-11-11 21:51:18'
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_id_108 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_108, 'ORD-20261111-0107', 8500.00, 'CONFIRMED', '2026-11-11 20:51:18', '2026-11-11 20:51:18', '2026-11-11 20:51:18');
DECLARE @o_id_108 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_108, 6, 1, 4500.00, 4500.00, 'SERVED', '2026-11-11 20:51:18', '2026-11-11 21:51:18');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_108, 3, 1, 2500.00, 2500.00, 'SERVED', '2026-11-11 20:51:18', '2026-11-11 21:51:18');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_108, 21, 1, 1500.00, 1500.00, 'SERVED', '2026-11-11 20:51:18', '2026-11-11 21:51:18');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_108, 'BILL-20261111-0107', 8500.00, 0, 0, 8500.00, 'BANK_TRANSFER', 'PAID', '2026-11-11 21:51:18', '2026-11-11 21:51:18', '2026-11-11 21:51:18');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-01-1109-0108', 'COMPLETED', 4, '2026-11-11 19:23:19', '2026-11-11 20:27:19', '2026-11-11 19:23:19', '2026-11-11 20:27:19'
FROM restaurant_tables WHERE table_number = 'T-01';
DECLARE @s_id_109 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_109, 'ORD-20261111-0108', 6000.00, 'CONFIRMED', '2026-11-11 19:23:19', '2026-11-11 19:23:19', '2026-11-11 19:23:19');
DECLARE @o_id_109 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_109, 25, 2, 2000.00, 4000.00, 'SERVED', '2026-11-11 19:23:19', '2026-11-11 20:27:19');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_109, 23, 2, 1000.00, 2000.00, 'SERVED', '2026-11-11 19:23:19', '2026-11-11 20:27:19');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_109, 'BILL-20261111-0108', 6000.00, 0, 0, 6000.00, 'BANK_TRANSFER', 'PAID', '2026-11-11 20:27:19', '2026-11-11 20:27:19', '2026-11-11 20:27:19');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-02-1110-0109', 'COMPLETED', 2, '2026-11-11 20:40:25', '2026-11-11 21:47:25', '2026-11-11 20:40:25', '2026-11-11 21:47:25'
FROM restaurant_tables WHERE table_number = 'T-02';
DECLARE @s_id_110 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_110, 'ORD-20261111-0109', 5500.00, 'CONFIRMED', '2026-11-11 20:40:25', '2026-11-11 20:40:25', '2026-11-11 20:40:25');
DECLARE @o_id_110 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_110, 21, 1, 1500.00, 1500.00, 'SERVED', '2026-11-11 20:40:25', '2026-11-11 21:47:25');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_110, 8, 1, 4000.00, 4000.00, 'SERVED', '2026-11-11 20:40:25', '2026-11-11 21:47:25');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_110, 'BILL-20261111-0109', 5500.00, 0, 0, 5500.00, 'BANK_TRANSFER', 'PAID', '2026-11-11 21:47:25', '2026-11-11 21:47:25', '2026-11-11 21:47:25');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-04-1200-0110', 'COMPLETED', 4, '2026-11-12 11:10:37', '2026-11-12 11:47:37', '2026-11-12 11:10:37', '2026-11-12 11:47:37'
FROM restaurant_tables WHERE table_number = 'T-04';
DECLARE @s_id_111 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_111, 'ORD-20261112-0110', 7000.00, 'CONFIRMED', '2026-11-12 11:10:37', '2026-11-12 11:10:37', '2026-11-12 11:10:37');
DECLARE @o_id_111 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_111, 1, 2, 3000.00, 6000.00, 'SERVED', '2026-11-12 11:10:37', '2026-11-12 11:47:37');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_111, 23, 1, 1000.00, 1000.00, 'SERVED', '2026-11-12 11:10:37', '2026-11-12 11:47:37');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_111, 'BILL-20261112-0110', 7000.00, 0, 0, 7000.00, 'BANK_TRANSFER', 'PAID', '2026-11-12 11:47:37', '2026-11-12 11:47:37', '2026-11-12 11:47:37');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-03-1201-0111', 'COMPLETED', 3, '2026-11-12 13:53:39', '2026-11-12 14:57:39', '2026-11-12 13:53:39', '2026-11-12 14:57:39'
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_id_112 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_112, 'ORD-20261112-0111', 6500.00, 'CONFIRMED', '2026-11-12 13:53:39', '2026-11-12 13:53:39', '2026-11-12 13:53:39');
DECLARE @o_id_112 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_112, 20, 1, 1500.00, 1500.00, 'SERVED', '2026-11-12 13:53:39', '2026-11-12 14:57:39');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_112, 9, 1, 5000.00, 5000.00, 'SERVED', '2026-11-12 13:53:39', '2026-11-12 14:57:39');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_112, 'BILL-20261112-0111', 6500.00, 0, 0, 6500.00, 'CASH', 'PAID', '2026-11-12 14:57:39', '2026-11-12 14:57:39', '2026-11-12 14:57:39');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-03-1202-0112', 'COMPLETED', 3, '2026-11-12 13:25:15', '2026-11-12 14:37:15', '2026-11-12 13:25:15', '2026-11-12 14:37:15'
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_id_113 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_113, 'ORD-20261112-0112', 23000.00, 'CONFIRMED', '2026-11-12 13:25:15', '2026-11-12 13:25:15', '2026-11-12 13:25:15');
DECLARE @o_id_113 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_113, 10, 2, 4000.00, 8000.00, 'SERVED', '2026-11-12 13:25:15', '2026-11-12 14:37:15');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_113, 6, 2, 4500.00, 9000.00, 'SERVED', '2026-11-12 13:25:15', '2026-11-12 14:37:15');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_113, 1, 2, 3000.00, 6000.00, 'SERVED', '2026-11-12 13:25:15', '2026-11-12 14:37:15');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_113, 'BILL-20261112-0112', 23000.00, 0, 0, 23000.00, 'BANK_TRANSFER', 'PAID', '2026-11-12 14:37:15', '2026-11-12 14:37:15', '2026-11-12 14:37:15');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-01-1203-0113', 'COMPLETED', 3, '2026-11-12 18:52:29', '2026-11-12 20:02:29', '2026-11-12 18:52:29', '2026-11-12 20:02:29'
FROM restaurant_tables WHERE table_number = 'T-01';
DECLARE @s_id_114 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_114, 'ORD-20261112-0113', 7000.00, 'CONFIRMED', '2026-11-12 18:52:29', '2026-11-12 18:52:29', '2026-11-12 18:52:29');
DECLARE @o_id_114 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_114, 4, 1, 3500.00, 3500.00, 'SERVED', '2026-11-12 18:52:29', '2026-11-12 20:02:29');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_114, 20, 1, 1500.00, 1500.00, 'SERVED', '2026-11-12 18:52:29', '2026-11-12 20:02:29');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_114, 25, 1, 2000.00, 2000.00, 'SERVED', '2026-11-12 18:52:29', '2026-11-12 20:02:29');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_114, 'BILL-20261112-0113', 7000.00, 0, 0, 7000.00, 'BANK_TRANSFER', 'PAID', '2026-11-12 20:02:29', '2026-11-12 20:02:29', '2026-11-12 20:02:29');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-02-1204-0114', 'COMPLETED', 3, '2026-11-12 13:42:46', '2026-11-12 14:36:46', '2026-11-12 13:42:46', '2026-11-12 14:36:46'
FROM restaurant_tables WHERE table_number = 'B-02';
DECLARE @s_id_115 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_115, 'ORD-20261112-0114', 4000.00, 'CONFIRMED', '2026-11-12 13:42:46', '2026-11-12 13:42:46', '2026-11-12 13:42:46');
DECLARE @o_id_115 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_115, 3, 1, 2500.00, 2500.00, 'SERVED', '2026-11-12 13:42:46', '2026-11-12 14:36:46');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_115, 20, 1, 1500.00, 1500.00, 'SERVED', '2026-11-12 13:42:46', '2026-11-12 14:36:46');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_115, 'BILL-20261112-0114', 4000.00, 0, 0, 4000.00, 'BANK_TRANSFER', 'PAID', '2026-11-12 14:36:46', '2026-11-12 14:36:46', '2026-11-12 14:36:46');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-02-1205-0115', 'COMPLETED', 2, '2026-11-12 12:14:18', '2026-11-12 13:13:18', '2026-11-12 12:14:18', '2026-11-12 13:13:18'
FROM restaurant_tables WHERE table_number = 'T-02';
DECLARE @s_id_116 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_116, 'ORD-20261112-0115', 14000.00, 'CONFIRMED', '2026-11-12 12:14:18', '2026-11-12 12:14:18', '2026-11-12 12:14:18');
DECLARE @o_id_116 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_116, 25, 2, 2000.00, 4000.00, 'SERVED', '2026-11-12 12:14:18', '2026-11-12 13:13:18');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_116, 5, 2, 5000.00, 10000.00, 'SERVED', '2026-11-12 12:14:18', '2026-11-12 13:13:18');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_116, 'BILL-20261112-0115', 14000.00, 0, 0, 14000.00, 'BANK_TRANSFER', 'PAID', '2026-11-12 13:13:18', '2026-11-12 13:13:18', '2026-11-12 13:13:18');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-02-1206-0116', 'COMPLETED', 3, '2026-11-12 19:53:31', '2026-11-12 21:02:31', '2026-11-12 19:53:31', '2026-11-12 21:02:31'
FROM restaurant_tables WHERE table_number = 'VIP-02';
DECLARE @s_id_117 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_117, 'ORD-20261112-0116', 19500.00, 'CONFIRMED', '2026-11-12 19:53:31', '2026-11-12 19:53:31', '2026-11-12 19:53:31');
DECLARE @o_id_117 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_117, 10, 2, 4000.00, 8000.00, 'SERVED', '2026-11-12 19:53:31', '2026-11-12 21:02:31');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_117, 6, 2, 4500.00, 9000.00, 'SERVED', '2026-11-12 19:53:31', '2026-11-12 21:02:31');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_117, 3, 1, 2500.00, 2500.00, 'SERVED', '2026-11-12 19:53:31', '2026-11-12 21:02:31');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_117, 'BILL-20261112-0116', 19500.00, 0, 0, 19500.00, 'CASH', 'PAID', '2026-11-12 21:02:31', '2026-11-12 21:02:31', '2026-11-12 21:02:31');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-01-1207-0117', 'COMPLETED', 3, '2026-11-12 20:29:50', '2026-11-12 21:18:50', '2026-11-12 20:29:50', '2026-11-12 21:18:50'
FROM restaurant_tables WHERE table_number = 'B-01';
DECLARE @s_id_118 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_118, 'ORD-20261112-0117', 31000.00, 'CONFIRMED', '2026-11-12 20:29:50', '2026-11-12 20:29:50', '2026-11-12 20:29:50');
DECLARE @o_id_118 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_118, 5, 2, 5000.00, 10000.00, 'SERVED', '2026-11-12 20:29:50', '2026-11-12 21:18:50');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_118, 13, 2, 3500.00, 7000.00, 'SERVED', '2026-11-12 20:29:50', '2026-11-12 21:18:50');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_118, 25, 2, 2000.00, 4000.00, 'SERVED', '2026-11-12 20:29:50', '2026-11-12 21:18:50');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_118, 9, 2, 5000.00, 10000.00, 'SERVED', '2026-11-12 20:29:50', '2026-11-12 21:18:50');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_118, 'BILL-20261112-0117', 31000.00, 0, 0, 31000.00, 'BANK_TRANSFER', 'PAID', '2026-11-12 21:18:50', '2026-11-12 21:18:50', '2026-11-12 21:18:50');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-02-1300-0118', 'COMPLETED', 2, '2026-11-13 12:44:28', '2026-11-13 13:34:28', '2026-11-13 12:44:28', '2026-11-13 13:34:28'
FROM restaurant_tables WHERE table_number = 'VIP-02';
DECLARE @s_id_119 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_119, 'ORD-20261113-0118', 20500.00, 'CONFIRMED', '2026-11-13 12:44:28', '2026-11-13 12:44:28', '2026-11-13 12:44:28');
DECLARE @o_id_119 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_119, 9, 1, 5000.00, 5000.00, 'SERVED', '2026-11-13 12:44:28', '2026-11-13 13:34:28');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_119, 8, 2, 4000.00, 8000.00, 'SERVED', '2026-11-13 12:44:28', '2026-11-13 13:34:28');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_119, 12, 1, 3000.00, 3000.00, 'SERVED', '2026-11-13 12:44:28', '2026-11-13 13:34:28');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_119, 7, 1, 4500.00, 4500.00, 'SERVED', '2026-11-13 12:44:28', '2026-11-13 13:34:28');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_119, 'BILL-20261113-0118', 20500.00, 0, 0, 20500.00, 'CASH', 'PAID', '2026-11-13 13:34:28', '2026-11-13 13:34:28', '2026-11-13 13:34:28');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-02-1301-0119', 'COMPLETED', 3, '2026-11-13 18:27:26', '2026-11-13 19:24:26', '2026-11-13 18:27:26', '2026-11-13 19:24:26'
FROM restaurant_tables WHERE table_number = 'T-02';
DECLARE @s_id_120 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_120, 'ORD-20261113-0119', 9000.00, 'CONFIRMED', '2026-11-13 18:27:26', '2026-11-13 18:27:26', '2026-11-13 18:27:26');
DECLARE @o_id_120 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_120, 3, 2, 2500.00, 5000.00, 'SERVED', '2026-11-13 18:27:26', '2026-11-13 19:24:26');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_120, 8, 1, 4000.00, 4000.00, 'SERVED', '2026-11-13 18:27:26', '2026-11-13 19:24:26');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_120, 'BILL-20261113-0119', 9000.00, 0, 0, 9000.00, 'CASH', 'PAID', '2026-11-13 19:24:26', '2026-11-13 19:24:26', '2026-11-13 19:24:26');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-01-1302-0120', 'COMPLETED', 2, '2026-11-13 18:15:28', '2026-11-13 18:52:28', '2026-11-13 18:15:28', '2026-11-13 18:52:28'
FROM restaurant_tables WHERE table_number = 'T-01';
DECLARE @s_id_121 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_121, 'ORD-20261113-0120', 15000.00, 'CONFIRMED', '2026-11-13 18:15:28', '2026-11-13 18:15:28', '2026-11-13 18:15:28');
DECLARE @o_id_121 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_121, 21, 2, 1500.00, 3000.00, 'SERVED', '2026-11-13 18:15:28', '2026-11-13 18:52:28');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_121, 2, 2, 2000.00, 4000.00, 'SERVED', '2026-11-13 18:15:28', '2026-11-13 18:52:28');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_121, 1, 2, 3000.00, 6000.00, 'SERVED', '2026-11-13 18:15:28', '2026-11-13 18:52:28');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_121, 23, 2, 1000.00, 2000.00, 'SERVED', '2026-11-13 18:15:28', '2026-11-13 18:52:28');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_121, 'BILL-20261113-0120', 15000.00, 0, 0, 15000.00, 'BANK_TRANSFER', 'PAID', '2026-11-13 18:52:28', '2026-11-13 18:52:28', '2026-11-13 18:52:28');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-03-1303-0121', 'COMPLETED', 2, '2026-11-13 13:34:16', '2026-11-13 14:09:16', '2026-11-13 13:34:16', '2026-11-13 14:09:16'
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_id_122 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_122, 'ORD-20261113-0121', 19000.00, 'CONFIRMED', '2026-11-13 13:34:16', '2026-11-13 13:34:16', '2026-11-13 13:34:16');
DECLARE @o_id_122 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_122, 6, 2, 4500.00, 9000.00, 'SERVED', '2026-11-13 13:34:16', '2026-11-13 14:09:16');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_122, 4, 2, 3500.00, 7000.00, 'SERVED', '2026-11-13 13:34:16', '2026-11-13 14:09:16');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_122, 21, 2, 1500.00, 3000.00, 'SERVED', '2026-11-13 13:34:16', '2026-11-13 14:09:16');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_122, 'BILL-20261113-0121', 19000.00, 0, 0, 19000.00, 'CASH', 'PAID', '2026-11-13 14:09:16', '2026-11-13 14:09:16', '2026-11-13 14:09:16');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-02-1304-0122', 'COMPLETED', 4, '2026-11-13 13:14:16', '2026-11-13 14:12:16', '2026-11-13 13:14:16', '2026-11-13 14:12:16'
FROM restaurant_tables WHERE table_number = 'T-02';
DECLARE @s_id_123 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_123, 'ORD-20261113-0122', 10000.00, 'CONFIRMED', '2026-11-13 13:14:16', '2026-11-13 13:14:16', '2026-11-13 13:14:16');
DECLARE @o_id_123 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_123, 2, 2, 2000.00, 4000.00, 'SERVED', '2026-11-13 13:14:16', '2026-11-13 14:12:16');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_123, 8, 1, 4000.00, 4000.00, 'SERVED', '2026-11-13 13:14:16', '2026-11-13 14:12:16');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_123, 25, 1, 2000.00, 2000.00, 'SERVED', '2026-11-13 13:14:16', '2026-11-13 14:12:16');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_123, 'BILL-20261113-0122', 10000.00, 0, 0, 10000.00, 'BANK_TRANSFER', 'PAID', '2026-11-13 14:12:16', '2026-11-13 14:12:16', '2026-11-13 14:12:16');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-04-1305-0123', 'COMPLETED', 3, '2026-11-13 11:15:17', '2026-11-13 11:52:17', '2026-11-13 11:15:17', '2026-11-13 11:52:17'
FROM restaurant_tables WHERE table_number = 'T-04';
DECLARE @s_id_124 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_124, 'ORD-20261113-0123', 15500.00, 'CONFIRMED', '2026-11-13 11:15:17', '2026-11-13 11:15:17', '2026-11-13 11:15:17');
DECLARE @o_id_124 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_124, 20, 1, 1500.00, 1500.00, 'SERVED', '2026-11-13 11:15:17', '2026-11-13 11:52:17');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_124, 13, 1, 3500.00, 3500.00, 'SERVED', '2026-11-13 11:15:17', '2026-11-13 11:52:17');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_124, 6, 1, 4500.00, 4500.00, 'SERVED', '2026-11-13 11:15:17', '2026-11-13 11:52:17');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_124, 12, 2, 3000.00, 6000.00, 'SERVED', '2026-11-13 11:15:17', '2026-11-13 11:52:17');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_124, 'BILL-20261113-0123', 15500.00, 0, 0, 15500.00, 'CASH', 'PAID', '2026-11-13 11:52:17', '2026-11-13 11:52:17', '2026-11-13 11:52:17');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-01-1306-0124', 'COMPLETED', 3, '2026-11-13 13:14:33', '2026-11-13 14:03:33', '2026-11-13 13:14:33', '2026-11-13 14:03:33'
FROM restaurant_tables WHERE table_number = 'T-01';
DECLARE @s_id_125 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_125, 'ORD-20261113-0124', 17000.00, 'CONFIRMED', '2026-11-13 13:14:33', '2026-11-13 13:14:33', '2026-11-13 13:14:33');
DECLARE @o_id_125 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_125, 4, 2, 3500.00, 7000.00, 'SERVED', '2026-11-13 13:14:33', '2026-11-13 14:03:33');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_125, 9, 2, 5000.00, 10000.00, 'SERVED', '2026-11-13 13:14:33', '2026-11-13 14:03:33');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_125, 'BILL-20261113-0124', 17000.00, 0, 0, 17000.00, 'BANK_TRANSFER', 'PAID', '2026-11-13 14:03:33', '2026-11-13 14:03:33', '2026-11-13 14:03:33');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-02-1307-0125', 'COMPLETED', 4, '2026-11-13 20:29:26', '2026-11-13 21:33:26', '2026-11-13 20:29:26', '2026-11-13 21:33:26'
FROM restaurant_tables WHERE table_number = 'B-02';
DECLARE @s_id_126 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_126, 'ORD-20261113-0125', 19500.00, 'CONFIRMED', '2026-11-13 20:29:26', '2026-11-13 20:29:26', '2026-11-13 20:29:26');
DECLARE @o_id_126 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_126, 9, 2, 5000.00, 10000.00, 'SERVED', '2026-11-13 20:29:26', '2026-11-13 21:33:26');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_126, 20, 1, 1500.00, 1500.00, 'SERVED', '2026-11-13 20:29:26', '2026-11-13 21:33:26');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_126, 10, 1, 4000.00, 4000.00, 'SERVED', '2026-11-13 20:29:26', '2026-11-13 21:33:26');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_126, 25, 2, 2000.00, 4000.00, 'SERVED', '2026-11-13 20:29:26', '2026-11-13 21:33:26');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_126, 'BILL-20261113-0125', 19500.00, 0, 0, 19500.00, 'BANK_TRANSFER', 'PAID', '2026-11-13 21:33:26', '2026-11-13 21:33:26', '2026-11-13 21:33:26');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-03-1308-0126', 'COMPLETED', 4, '2026-11-13 20:46:25', '2026-11-13 21:25:25', '2026-11-13 20:46:25', '2026-11-13 21:25:25'
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_id_127 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_127, 'ORD-20261113-0126', 9000.00, 'CONFIRMED', '2026-11-13 20:46:25', '2026-11-13 20:46:25', '2026-11-13 20:46:25');
DECLARE @o_id_127 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_127, 20, 2, 1500.00, 3000.00, 'SERVED', '2026-11-13 20:46:25', '2026-11-13 21:25:25');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_127, 1, 2, 3000.00, 6000.00, 'SERVED', '2026-11-13 20:46:25', '2026-11-13 21:25:25');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_127, 'BILL-20261113-0126', 9000.00, 0, 0, 9000.00, 'CASH', 'PAID', '2026-11-13 21:25:25', '2026-11-13 21:25:25', '2026-11-13 21:25:25');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-02-1309-0127', 'COMPLETED', 2, '2026-11-13 19:53:29', '2026-11-13 21:05:29', '2026-11-13 19:53:29', '2026-11-13 21:05:29'
FROM restaurant_tables WHERE table_number = 'B-02';
DECLARE @s_id_128 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_128, 'ORD-20261113-0127', 15000.00, 'CONFIRMED', '2026-11-13 19:53:29', '2026-11-13 19:53:29', '2026-11-13 19:53:29');
DECLARE @o_id_128 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_128, 12, 2, 3000.00, 6000.00, 'SERVED', '2026-11-13 19:53:29', '2026-11-13 21:05:29');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_128, 2, 1, 2000.00, 2000.00, 'SERVED', '2026-11-13 19:53:29', '2026-11-13 21:05:29');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_128, 7, 1, 4500.00, 4500.00, 'SERVED', '2026-11-13 19:53:29', '2026-11-13 21:05:29');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_128, 3, 1, 2500.00, 2500.00, 'SERVED', '2026-11-13 19:53:29', '2026-11-13 21:05:29');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_128, 'BILL-20261113-0127', 15000.00, 0, 0, 15000.00, 'BANK_TRANSFER', 'PAID', '2026-11-13 21:05:29', '2026-11-13 21:05:29', '2026-11-13 21:05:29');


INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-vip-01-1310-0128', 'COMPLETED', 2, '2026-11-13 20:42:14', '2026-11-13 21:32:14', '2026-11-13 20:42:14', '2026-11-13 21:32:14'
FROM restaurant_tables WHERE table_number = 'VIP-01';
DECLARE @s_id_129 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_id_129, 'ORD-20261113-0128', 17500.00, 'CONFIRMED', '2026-11-13 20:42:14', '2026-11-13 20:42:14', '2026-11-13 20:42:14');
DECLARE @o_id_129 BIGINT = SCOPE_IDENTITY();


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_129, 21, 2, 1500.00, 3000.00, 'SERVED', '2026-11-13 20:42:14', '2026-11-13 21:32:14');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_129, 6, 1, 4500.00, 4500.00, 'SERVED', '2026-11-13 20:42:14', '2026-11-13 21:32:14');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_129, 4, 2, 3500.00, 7000.00, 'SERVED', '2026-11-13 20:42:14', '2026-11-13 21:32:14');


INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, created_at, updated_at)
VALUES (@o_id_129, 12, 1, 3000.00, 3000.00, 'SERVED', '2026-11-13 20:42:14', '2026-11-13 21:32:14');


INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, created_at, updated_at)
VALUES (@s_id_129, 'BILL-20261113-0128', 17500.00, 0, 0, 17500.00, 'BANK_TRANSFER', 'PAID', '2026-11-13 21:32:14', '2026-11-13 21:32:14', '2026-11-13 21:32:14');

-- 7. DỮ LIỆU ĐẶC BIỆT CHO NGÀY 13/11 & 14/11/2026

-- Hóa đơn hoàn tất sáng 13/11 để test ngay hôm nay (Hiển thị Lịch sử KDS ngay lập tức)
INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-02-13morning-01', 'COMPLETED', 2, '2026-11-13 08:15:00', '2026-11-13 09:00:00', '2026-11-13 08:15:00', '2026-11-13 09:00:00'
FROM restaurant_tables WHERE table_number = 'T-02';
DECLARE @s_m13_1 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_m13_1, 'ORD-20261113-0099', 4000.00, 'CONFIRMED', '2026-11-13 08:20:00', '2026-11-13 08:20:00', '2026-11-13 08:20:00');
DECLARE @o_m13_1 BIGINT = SCOPE_IDENTITY();

INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, note, created_at, updated_at)
VALUES (@o_m13_1, 2, 1, 2000.00, 2000.00, 'SERVED', N'Ăn sáng giòn', '2026-11-13 08:20:00', '2026-11-13 08:35:00'),
       (@o_m13_1, 25, 1, 2000.00, 2000.00, 'SERVED', N'Ít ngọt', '2026-11-13 08:20:00', '2026-11-13 08:30:00');

INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, note, created_at, updated_at)
VALUES (@s_m13_1, 'BILL-20261113-0099', 4000.00, 0, 0, 4000.00, 'CASH', 'PAID', '2026-11-13 09:00:00', N'Khách trả tiền mặt đủ', '2026-11-13 09:00:00', '2026-11-13 09:00:00');

-- 7.1. HAI ĐƠN ĂN SÁNG ĐÃ HOÀN TẤT CHO NGÀY 14/11 (Hiển thị tab Lịch sử KDS, Chốt ca sáng Thu ngân, Báo cáo Hôm nay)

-- Hóa đơn sáng 1 (Tiền mặt - CASH): Bàn T-02
INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-t-02-14morning-01', 'COMPLETED', 2, '2026-11-14 08:15:00', '2026-11-14 09:00:00', '2026-11-14 08:15:00', '2026-11-14 09:00:00'
FROM restaurant_tables WHERE table_number = 'T-02';
DECLARE @s_m1 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_m1, 'ORD-20261114-0001', 4000.00, 'CONFIRMED', '2026-11-14 08:20:00', '2026-11-14 08:20:00', '2026-11-14 08:20:00');
DECLARE @o_m1 BIGINT = SCOPE_IDENTITY();

INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, note, created_at, updated_at)
VALUES (@o_m1, 2, 1, 2000.00, 2000.00, 'SERVED', N'Ăn sáng giòn', '2026-11-14 08:20:00', '2026-11-14 08:35:00'),
       (@o_m1, 25, 1, 2000.00, 2000.00, 'SERVED', N'Ít ngọt', '2026-11-14 08:20:00', '2026-11-14 08:30:00');

INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, note, created_at, updated_at)
VALUES (@s_m1, 'BILL-20261114-0001', 4000.00, 0, 0, 4000.00, 'CASH', 'PAID', '2026-11-14 09:00:00', N'Khách trả tiền mặt đủ', '2026-11-14 09:00:00', '2026-11-14 09:00:00');


-- Hóa đơn sáng 2 (Chuyển khoản - BANK_TRANSFER): Bàn B-02
INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, created_at, updated_at)
SELECT id, 'sess-b-02-14morning-02', 'COMPLETED', 2, '2026-11-14 09:15:00', '2026-11-14 10:15:00', '2026-11-14 09:15:00', '2026-11-14 10:15:00'
FROM restaurant_tables WHERE table_number = 'B-02';
DECLARE @s_m2 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_m2, 'ORD-20261114-0002', 7500.00, 'CONFIRMED', '2026-11-14 09:20:00', '2026-11-14 09:20:00', '2026-11-14 09:20:00');
DECLARE @o_m2 BIGINT = SCOPE_IDENTITY();

INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, note, created_at, updated_at)
VALUES (@o_m2, 3, 1, 2500.00, 2500.00, 'SERVED', N'Súp nóng', '2026-11-14 09:20:00', '2026-11-14 09:40:00'),
       (@o_m2, 4, 1, 3500.00, 3500.00, 'SERVED', N'Cá hồi tươi', '2026-11-14 09:20:00', '2026-11-14 09:45:00'),
       (@o_m2, 20, 1, 1500.00, 1500.00, 'SERVED', N'Nhiều đào', '2026-11-14 09:20:00', '2026-11-14 09:30:00');

INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, note, created_at, updated_at)
VALUES (@s_m2, 'BILL-20261114-0002', 7500.00, 0, 0, 7500.00, 'BANK_TRANSFER', 'PAID', '2026-11-14 10:15:00', N'Thanh toán VietQR PayOS thành công', '2026-11-14 10:15:00', '2026-11-14 10:15:00');


-- 7.2. BÀN T-03 (OCCUPIED): Khách đang ăn dở được 40 phút, Thu ngân mở POS xem được ngay Tạm tính
UPDATE restaurant_tables SET status = 'OCCUPIED', blocked_reason = NULL, reservation_info = NULL, reserved_time = NULL WHERE table_number = 'T-03';

INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, created_at, updated_at)
SELECT id, 'sess-t-03-active-eating', 'ACTIVE', 2, DATEADD(minute, -40, GETDATE()), DATEADD(minute, -40, GETDATE()), DATEADD(minute, -40, GETDATE())
FROM restaurant_tables WHERE table_number = 'T-03';
DECLARE @s_t03 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_t03, 'ORD-20261114-0003', 7500.00, 'CONFIRMED', DATEADD(minute, -35, GETDATE()), DATEADD(minute, -35, GETDATE()), DATEADD(minute, -35, GETDATE()));
DECLARE @o_t03 BIGINT = SCOPE_IDENTITY();

INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, note, created_at, updated_at)
VALUES (@o_t03, 1, 1, 3000.00, 3000.00, 'SERVED', N'Đã lên bàn cho khách', DATEADD(minute, -35, GETDATE()), DATEADD(minute, -20, GETDATE())),
       (@o_t03, 6, 1, 4500.00, 4500.00, 'COOKING', N'Bếp đang làm món chính', DATEADD(minute, -35, GETDATE()), DATEADD(minute, -35, GETDATE()));

INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, status, created_at, updated_at)
VALUES (@s_t03, 'BILL-20261114-0003', 7500.00, 0, 0, 7500.00, 'UNPAID', DATEADD(minute, -35, GETDATE()), DATEADD(minute, -35, GETDATE()));


-- 7.3. BÀN B-01 (OCCUPIED): Màn hình KDS hiển thị thẻ đang nấu 12 phút (có món RUSH VÀNG sắp trễ SLA 15 phút) & Chuông đỏ Waiter
UPDATE restaurant_tables SET status = 'OCCUPIED', blocked_reason = NULL, reservation_info = NULL, reserved_time = NULL WHERE table_number = 'B-01';

INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, created_at, updated_at)
SELECT id, 'sess-b-01-active-kds', 'ACTIVE', 4, DATEADD(minute, -18, GETDATE()), DATEADD(minute, -18, GETDATE()), DATEADD(minute, -18, GETDATE())
FROM restaurant_tables WHERE table_number = 'B-01';
DECLARE @s_b01 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_b01, 'ORD-20261114-0004', 11500.00, 'COOKING', DATEADD(minute, -12, GETDATE()), DATEADD(minute, -12, GETDATE()), DATEADD(minute, -12, GETDATE()));
DECLARE @o_b01 BIGINT = SCOPE_IDENTITY();

INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, note, created_at, updated_at)
VALUES (@o_b01, 5, 1, 5000.00, 5000.00, 'COOKING', N'HỎA TỐC: Bò Wagyu làm tái vừa (Medium Rare)', DATEADD(minute, -12, GETDATE()), DATEADD(minute, -10, GETDATE())),
       (@o_b01, 1, 1, 3000.00, 3000.00, 'PENDING', N'Sốt cam để riêng chén nhỏ', DATEADD(minute, -12, GETDATE()), DATEADD(minute, -12, GETDATE())),
       (@o_b01, 13, 1, 3500.00, 3500.00, 'READY', N'Nấu xong, chờ Waiter bưng ra', DATEADD(minute, -12, GETDATE()), DATEADD(minute, -2, GETDATE()));

-- Tạo chuông gọi phục vụ nhấp nháy đỏ cho bàn B-01 (gọi 2 phút trước)
INSERT INTO service_requests (table_id, session_id, request_type, note, status, created_at)
SELECT id, @s_b01, 'CALL_WAITER', N'Xin thêm 1 xô đá lạnh & khăn ướt', 'PENDING', DATEADD(minute, -2, GETDATE())
FROM restaurant_tables WHERE table_number = 'B-01';


-- 7.4. BÀN T-02 (OCCUPIED): Khách mới vào 5 phút, vé KDS XANH 03:00, có món READY cho Waiter bưng ra
UPDATE restaurant_tables SET status = 'OCCUPIED', blocked_reason = NULL, reservation_info = NULL, reserved_time = NULL WHERE table_number = 'T-02';

INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, created_at, updated_at)
SELECT id, 'sess-t-02-new-active', 'ACTIVE', 3, DATEADD(minute, -5, GETDATE()), DATEADD(minute, -5, GETDATE()), DATEADD(minute, -5, GETDATE())
FROM restaurant_tables WHERE table_number = 'T-02';
DECLARE @s_t02 BIGINT = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, order_time, created_at, updated_at)
VALUES (@s_t02, 'ORD-20261114-0005', 6500.00, 'COOKING', DATEADD(minute, -3, GETDATE()), DATEADD(minute, -3, GETDATE()), DATEADD(minute, -3, GETDATE()));
DECLARE @o_t02 BIGINT = SCOPE_IDENTITY();

INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, note, created_at, updated_at)
VALUES (@o_t02, 2, 2, 2000.00, 4000.00, 'COOKING', N'Làm ít cay cho bé', DATEADD(minute, -3, GETDATE()), DATEADD(minute, -3, GETDATE())),
       (@o_t02, 20, 1, 1500.00, 1500.00, 'READY', N'Nhiều đá', DATEADD(minute, -3, GETDATE()), DATEADD(minute, -1, GETDATE())),
       (@o_t02, 21, 1, 1000.00, 1000.00, 'PENDING', N'Uống sau ăn', DATEADD(minute, -3, GETDATE()), DATEADD(minute, -3, GETDATE()));

INSERT INTO bills (session_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, status, created_at, updated_at)
VALUES (@s_t02, 'BILL-20261114-0005', 6500.00, 0, 0, 6500.00, 'UNPAID', DATEADD(minute, -3, GETDATE()), DATEADD(minute, -3, GETDATE()));


-- 7.5. BÀN T-04 (DIRTY) & BÀN B-03 (BLOCKED)
UPDATE restaurant_tables SET status = 'DIRTY', blocked_reason = NULL, reservation_info = NULL, reserved_time = NULL WHERE table_number = 'T-04';
UPDATE restaurant_tables SET status = 'BLOCKED', blocked_reason = N'Bảo trì hệ thống quạt thông gió & đèn rọi', reservation_info = NULL, reserved_time = NULL WHERE table_number = 'B-03';


-- 7.6. BÀN VIP-02 (RESERVED): Đang trong khung Khóa An Toàn (+30 phút nữa khách đến)
DECLARE @vip_time DATETIME2 = DATEADD(minute, 30, GETDATE());
DECLARE @vip_time_str NVARCHAR(50) = FORMAT(@vip_time, 'HH:mm');

UPDATE restaurant_tables 
SET status = 'RESERVED', 
    reservation_info = N'Anh Tuấn FPT (0912345678 - 6 khách)', 
    reserved_time = N'Hôm nay lúc ' + @vip_time_str, 
    blocked_reason = NULL 
WHERE table_number = 'VIP-02';


-- =====================================================================
-- 8. DỮ LIỆU ĐẶT BÀN LỊCH SỬ TOÀN DIỆN (21 RESERVATIONS TỪ 01/11 ĐẾN 17/11)
-- Phục vụ hoàn hảo các bộ lọc: Hôm Nay | Tuần Này | Tháng Này | Tất Cả
-- =====================================================================

-- 8.1. Đơn bàn VIP-02 đang được khóa an toàn (Hôm nay lúc +30 phút)
INSERT INTO reservations (booking_code, table_id, requested_zone, customer_name, customer_phone, customer_email, guest_count, reservation_time, status, note, created_at, updated_at)
SELECT 'RES-20261114-001', id, 'VIP', N'Anh Tuấn FPT', '0912345678', 'tuan.fpt@gmail.com', 6, @vip_time, 'CONFIRMED', N'Tiệc sinh nhật tiếp khách, cần phòng riêng đẹp', DATEADD(hour, -4, GETDATE()), DATEADD(hour, -3, GETDATE())
FROM restaurant_tables WHERE table_number = 'VIP-02';

-- 8.2. Đơn PENDING tối nay (Hôm nay 19:30)
INSERT INTO reservations (booking_code, table_id, requested_zone, customer_name, customer_phone, customer_email, guest_count, reservation_time, status, note, created_at, updated_at)
VALUES ('RES-20261114-8888', NULL, 'ZONE_1', N'Chị Ngọc Mai', '0905998877', 'mai.ngoc@gmail.com', 4, '2026-11-14 19:30:00', 'PENDING', N'Cần bàn gần cửa sổ, ghế em bé', DATEADD(hour, -2, GETDATE()), DATEADD(hour, -2, GETDATE()));

-- 8.3. Lịch sử Tuần trước & Đầu tháng 11 (Quá khứ: COMPLETED & CANCELLED)
INSERT INTO reservations (booking_code, table_id, requested_zone, customer_name, customer_phone, customer_email, guest_count, reservation_time, status, cancel_reason, note, created_at, updated_at)
SELECT 'RES-20261102-1011', id, 'ZONE_1', N'Trần Văn Nam', '0905111222', 'nam.tran@gmail.com', 4, '2026-11-02 18:30:00', 'COMPLETED', NULL, N'Tiệc sinh nhật gia đình', '2026-11-02 10:00:00', '2026-11-02 20:30:00' FROM restaurant_tables WHERE table_number = 'T-01';

INSERT INTO reservations (booking_code, table_id, requested_zone, customer_name, customer_phone, customer_email, guest_count, reservation_time, status, cancel_reason, note, created_at, updated_at)
SELECT 'RES-20261103-2022', id, 'ZONE_2', N'Lê Thị Thảo', '0905222333', 'thao.le@gmail.com', 2, '2026-11-03 19:00:00', 'COMPLETED', NULL, N'Bàn lãng mạn cho cặp đôi', '2026-11-03 12:00:00', '2026-11-03 21:00:00' FROM restaurant_tables WHERE table_number = 'B-02';

INSERT INTO reservations (booking_code, table_id, requested_zone, customer_name, customer_phone, customer_email, guest_count, reservation_time, status, cancel_reason, note, created_at, updated_at)
SELECT 'RES-20261104-3033', id, 'VIP', N'Nguyễn Văn Hùng', '0905333444', 'hung.nguyen@gmail.com', 8, '2026-11-04 12:00:00', 'COMPLETED', NULL, N'Tiếp khách công ty FPT', '2026-11-04 09:00:00', '2026-11-04 14:00:00' FROM restaurant_tables WHERE table_number = 'VIP-01';

INSERT INTO reservations (booking_code, table_id, requested_zone, customer_name, customer_phone, customer_email, guest_count, reservation_time, status, cancel_reason, note, created_at, updated_at)
VALUES ('RES-20261105-4044', NULL, 'ZONE_1', N'Vũ Quốc Bảo', '0905444555', 'bao.vu@gmail.com', 4, '2026-11-05 20:00:00', 'CANCELLED', N'Khách bận lịch công tác đột xuất', N'Khách đặt tiệc cuối tuần', '2026-11-05 11:00:00', '2026-11-05 16:00:00');

INSERT INTO reservations (booking_code, table_id, requested_zone, customer_name, customer_phone, customer_email, guest_count, reservation_time, status, cancel_reason, note, created_at, updated_at)
SELECT 'RES-20261106-5055', id, 'ZONE_1', N'Đỗ Mai Linh', '0905555666', 'linh.do@gmail.com', 6, '2026-11-06 18:00:00', 'COMPLETED', NULL, N'Họp mặt bạn bè đại học', '2026-11-06 09:00:00', '2026-11-06 20:30:00' FROM restaurant_tables WHERE table_number = 'T-02';

INSERT INTO reservations (booking_code, table_id, requested_zone, customer_name, customer_phone, customer_email, guest_count, reservation_time, status, cancel_reason, note, created_at, updated_at)
SELECT 'RES-20261107-6066', id, 'VIP', N'Hoàng Kim Ngân', '0905666777', 'ngan.hoang@gmail.com', 10, '2026-11-07 19:30:00', 'COMPLETED', NULL, N'Tiệc kỷ niệm ngày cưới', '2026-11-07 14:00:00', '2026-11-07 22:00:00' FROM restaurant_tables WHERE table_number = 'VIP-03';

INSERT INTO reservations (booking_code, table_id, requested_zone, customer_name, customer_phone, customer_email, guest_count, reservation_time, status, cancel_reason, note, created_at, updated_at)
VALUES ('RES-20261108-7077', NULL, 'ZONE_2', N'Phan Thanh Tùng', '0905777888', 'tung.phan@gmail.com', 4, '2026-11-08 19:00:00', 'CANCELLED', N'Tự động hủy do Quản lý mở cưỡng chế bàn cho khách vãng lai (Khách quá giờ hẹn / No-Show)', N'Ăn tối chủ nhật', '2026-11-08 15:00:00', '2026-11-08 19:45:00');

INSERT INTO reservations (booking_code, table_id, requested_zone, customer_name, customer_phone, customer_email, guest_count, reservation_time, status, cancel_reason, note, created_at, updated_at)
SELECT 'RES-20261109-8088', id, 'ZONE_1', N'Bùi Đức Thắng', '0905888999', 'thang.bui@gmail.com', 2, '2026-11-09 18:30:00', 'COMPLETED', NULL, N'Ăn tối đầu tuần', '2026-11-09 10:00:00', '2026-11-09 20:00:00' FROM restaurant_tables WHERE table_number = 'T-03';

-- 8.4. Lịch sử Tuần này (10/11 đến 13/11)
INSERT INTO reservations (booking_code, table_id, requested_zone, customer_name, customer_phone, customer_email, guest_count, reservation_time, status, cancel_reason, note, created_at, updated_at)
SELECT 'RES-20261110-9099', id, 'ZONE_2', N'Đặng Thùy Dung', '0905999000', 'dung.dang@gmail.com', 4, '2026-11-10 19:00:00', 'COMPLETED', NULL, N'Gia đình sum họp', '2026-11-10 11:00:00', '2026-11-10 21:00:00' FROM restaurant_tables WHERE table_number = 'B-01';

INSERT INTO reservations (booking_code, table_id, requested_zone, customer_name, customer_phone, customer_email, guest_count, reservation_time, status, cancel_reason, note, created_at, updated_at)
SELECT 'RES-20261111-1111', id, 'VIP', N'Ngô Anh Quân', '0905123987', 'quan.ngo@gmail.com', 8, '2026-11-11 12:30:00', 'COMPLETED', NULL, N'Liên hoan phòng ban', '2026-11-11 08:30:00', '2026-11-11 14:30:00' FROM restaurant_tables WHERE table_number = 'VIP-01';

INSERT INTO reservations (booking_code, table_id, requested_zone, customer_name, customer_phone, customer_email, guest_count, reservation_time, status, cancel_reason, note, created_at, updated_at)
VALUES ('RES-20261112-2222', NULL, 'ZONE_1', N'Phạm Quỳnh Chi', '0905234876', 'chi.pham@gmail.com', 6, '2026-11-12 19:30:00', 'CANCELLED', N'Khách đổi sang cơ sở khác', N'Tiệc sinh nhật', '2026-11-12 14:00:00', '2026-11-12 17:30:00');

INSERT INTO reservations (booking_code, table_id, requested_zone, customer_name, customer_phone, customer_email, guest_count, reservation_time, status, cancel_reason, note, created_at, updated_at)
SELECT 'RES-20261113-3333', id, 'ZONE_1', N'Hồ Minh Trí', '0905345765', 'tri.ho@gmail.com', 4, '2026-11-13 19:00:00', 'COMPLETED', NULL, N'Gặp mặt đối tác', '2026-11-13 15:00:00', '2026-11-13 21:00:00' FROM restaurant_tables WHERE table_number = 'T-02';

-- 8.5. Đơn tương lai (16/11 - 17/11)
INSERT INTO reservations (booking_code, table_id, requested_zone, customer_name, customer_phone, customer_email, guest_count, reservation_time, status, cancel_reason, note, created_at, updated_at)
VALUES ('RES-20261116-4444', NULL, 'VIP', N'Lê Cẩm Tú', '0905456654', 'tu.le@gmail.com', 8, '2026-11-16 18:30:00', 'PENDING', NULL, N'Tiệc sinh nhật 8 người, phòng VIP', '2026-11-14 10:00:00', '2026-11-14 10:00:00');

INSERT INTO reservations (booking_code, table_id, requested_zone, customer_name, customer_phone, customer_email, guest_count, reservation_time, status, cancel_reason, note, created_at, updated_at)
SELECT 'RES-20261116-5555', id, 'ZONE_2', N'Võ Văn Kiệt', '0905567543', 'kiet.vo@gmail.com', 2, '2026-11-16 19:00:00', 'CONFIRMED', NULL, N'Kỷ niệm 1 năm yêu nhau', '2026-11-14 09:30:00', '2026-11-14 10:30:00' FROM restaurant_tables WHERE table_number = 'B-02';

INSERT INTO reservations (booking_code, table_id, requested_zone, customer_name, customer_phone, customer_email, guest_count, reservation_time, status, cancel_reason, note, created_at, updated_at)
VALUES ('RES-20261117-6666', NULL, 'ZONE_1', N'Trương Mỹ Hạnh', '0905678432', 'hanh.truong@gmail.com', 6, '2026-11-17 19:30:00', 'PENDING', NULL, N'Họp mặt cuối tuần', '2026-11-14 11:00:00', '2026-11-14 11:00:00');


PRINT N'>>> ROMS MASTER DATABASE SEEDED & REFRESHED CLEANLY WITH DYNAMIC DATA! <<<';
