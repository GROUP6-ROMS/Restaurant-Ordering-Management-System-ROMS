-- ================================================================================================
-- KỊCH BẢN SINH DỮ LIỆU KIỂM THỬ TOÀN DIỆN CHO DỰ ÁN ROMS (RESTAURANT ORDERING & MANAGEMENT SYSTEM)
-- Hệ quản trị CSDL: Microsoft SQL Server (Phiên bản 2017+)
-- CSDL mục tiêu: ROMS_DB
-- ================================================================================================

USE ROMS_DB;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

PRINT N'--------------------------------------------------------------------------------';
PRINT N'BƯỚC 1: XÓA DỮ LIỆU CŨ THEO ĐÚNG THỨ TỰ RÀNG BUỘC KHÓA NGOẠI (FOREIGN KEYS)...';
PRINT N'--------------------------------------------------------------------------------';

-- 1. Xóa các bảng con phụ thuộc sâu nhất
DELETE FROM service_requests;
DELETE FROM reservation_items;
DELETE FROM reservations;
DELETE FROM bills;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM dining_sessions;
DELETE FROM staff_schedules;
DELETE FROM menu_items;
DELETE FROM categories;
DELETE FROM restaurant_tables;
DELETE FROM staffs;
DELETE FROM zones;

-- 2. Reset khóa chính tự tăng (IDENTITY) về 0 để dữ liệu mới bắt đầu từ ID 1
DBCC CHECKIDENT ('service_requests', RESEED, 0);
DBCC CHECKIDENT ('reservation_items', RESEED, 0);
DBCC CHECKIDENT ('reservations', RESEED, 0);
DBCC CHECKIDENT ('bills', RESEED, 0);
DBCC CHECKIDENT ('order_items', RESEED, 0);
DBCC CHECKIDENT ('orders', RESEED, 0);
DBCC CHECKIDENT ('dining_sessions', RESEED, 0);
DBCC CHECKIDENT ('staff_schedules', RESEED, 0);
DBCC CHECKIDENT ('menu_items', RESEED, 0);
DBCC CHECKIDENT ('categories', RESEED, 0);
DBCC CHECKIDENT ('restaurant_tables', RESEED, 0);
DBCC CHECKIDENT ('staffs', RESEED, 0);
DBCC CHECKIDENT ('zones', RESEED, 0);

PRINT N'==> Đã xóa sạch dữ liệu cũ và reset IDENTITY thành công!';

PRINT N'--------------------------------------------------------------------------------';
PRINT N'BƯỚC 2: CHÈN DANH MỤC PHÂN KHU BÀN (ZONES)...';
PRINT N'--------------------------------------------------------------------------------';

SET IDENTITY_INSERT zones ON;
INSERT INTO zones (id, zone_code, name, description, display_order, is_active, created_at, updated_at) VALUES
(1, 'ZONE_1', N'Tầng 1 - Sảnh Chính', N'Không gian hiện đại, âm nhạc du dương, điều hòa mát rượi, lý tưởng cho gia đình và nhóm bạn', 1, 1, GETDATE(), GETDATE()),
(2, 'ZONE_2', N'Tầng 2 - Ban Công & Sân Vườn', N'Tầm nhìn phố cổ thoáng đãng, lãng mạn về đêm, gió trời tự nhiên cho cặp đôi và tiệc ngoài trời', 2, 1, GETDATE(), GETDATE()),
(3, 'VIP',    N'Phòng VIP Riêng Tư', N'Không gian riêng tư, ấm cúng, cách âm tốt, phục vụ tiệc gia đình và đối tác', 3, 1, GETDATE(), GETDATE());
SET IDENTITY_INSERT zones OFF;

PRINT N'==> Đã chèn 3 phân khu bàn (ZONE_1, ZONE_2, VIP).';

PRINT N'--------------------------------------------------------------------------------';
PRINT N'BƯỚC 3: CHÈN DANH SÁCH NHÂN SỰ & TÀI KHOẢN CA TRỰC (STAFFS)...';
PRINT N'(Lưu ý: Mật khẩu mã PIN mặc định của toàn bộ nhân viên là 123456)';
PRINT N'--------------------------------------------------------------------------------';

-- Chuỗi BCrypt Hash cho PIN 123456: $2a$10$mmAQG4aK9I1ErPf33jRj5uYUccfmbaNkTvoj8bfJTNWjWqqsmfh92
DECLARE @PIN_123456 VARCHAR(255) = '$2a$10$mmAQG4aK9I1ErPf33jRj5uYUccfmbaNkTvoj8bfJTNWjWqqsmfh92';

SET IDENTITY_INSERT staffs ON;
INSERT INTO staffs (id, username, pin_code, full_name, phone, role, is_active, is_on_shift, created_at, updated_at) VALUES
-- 1. Quản lý (MANAGER)
(1, 'MGR-001', @PIN_123456, N'Dương Trong', '0901000001', 'MANAGER', 1, 1, GETDATE(), GETDATE()),
(2, 'MGR-002', @PIN_123456, N'Trần Anh Thư',  '0901000002', 'MANAGER', 1, 0, GETDATE(), GETDATE()),

-- 2. Phục vụ bàn (WAITER)
(3, 'EMP-001', @PIN_123456, N'Phạm Minh Đức',   '0902000001', 'WAITER', 1, 1, GETDATE(), GETDATE()),
(4, 'EMP-002', @PIN_123456, N'Lê Hoàng Nam',    '0902000002', 'WAITER', 1, 1, GETDATE(), GETDATE()),
(5, 'EMP-003', @PIN_123456, N'Vũ Thị Mai',     '0902000003', 'WAITER', 1, 0, GETDATE(), GETDATE()),

-- 3. Bếp trưởng & Bếp chính (KITCHEN)
(6, 'KDS-001', @PIN_123456, N'Ngô Viết Bảo Huy', '0903000001', 'KITCHEN', 1, 1, GETDATE(), GETDATE()),
(7, 'KDS-002', @PIN_123456, N'Đặng Quốc Tuấn', '0903000002', 'KITCHEN', 1, 1, GETDATE(), GETDATE()),

-- 4. Thu ngân (CASHIER)
(8, 'CSH-001', @PIN_123456, N'Đỗ Võ Thanh Trung', '0904000001', 'CASHIER', 1, 1, GETDATE(), GETDATE()),
(9, 'CSH-002', @PIN_123456, N'Nguyễn Thùy Linh',  '0904000002', 'CASHIER', 1, 0, GETDATE(), GETDATE());
SET IDENTITY_INSERT staffs OFF;

PRINT N'==> Đã chèn 9 tài khoản nhân viên đầy đủ 4 phân quyền.';

PRINT N'--------------------------------------------------------------------------------';
PRINT N'BƯỚC 4: CHÈN LỊCH PHÂN CA TRỰC HÔM NAY (STAFF_SCHEDULES)...';
PRINT N'--------------------------------------------------------------------------------';

-- Tự động sinh ca trực sáng (MORNING) và tối (EVENING) cho TOÀN BỘ nhân viên từ quá khứ 3 ngày đến 30 ngày tiếp theo
DECLARE @Offset INT = -3;
WHILE @Offset <= 30
BEGIN
    DECLARE @TargetDate DATE = DATEADD(DAY, @Offset, CAST(GETDATE() AS DATE));
    
    INSERT INTO staff_schedules (staff_id, work_date, shift_type, created_at, updated_at)
    SELECT s.id, @TargetDate, 'MORNING', GETDATE(), GETDATE()
    FROM staffs s
    WHERE s.is_active = 1
      AND NOT EXISTS (
          SELECT 1 FROM staff_schedules sc
          WHERE sc.staff_id = s.id AND sc.work_date = @TargetDate AND sc.shift_type = 'MORNING'
      );

    INSERT INTO staff_schedules (staff_id, work_date, shift_type, created_at, updated_at)
    SELECT s.id, @TargetDate, 'EVENING', GETDATE(), GETDATE()
    FROM staffs s
    WHERE s.is_active = 1
      AND NOT EXISTS (
          SELECT 1 FROM staff_schedules sc
          WHERE sc.staff_id = s.id AND sc.work_date = @TargetDate AND sc.shift_type = 'EVENING'
      );

    SET @Offset = @Offset + 1;
END;

PRINT N'==> Đã chèn lịch phân ca trực tự động toàn diện (MORNING & EVENING) cho toàn bộ nhân sự.';

PRINT N'--------------------------------------------------------------------------------';
PRINT N'BƯỚC 5: CHÈN SƠ ĐỒ BÀN ĂN NHÀ HÀNG (RESTAURANT_TABLES)...';
PRINT N'--------------------------------------------------------------------------------';

SET IDENTITY_INSERT restaurant_tables ON;
INSERT INTO restaurant_tables (id, table_number, name, zone, capacity, status, blocked_reason, reservation_info, reserved_time, qr_token, is_active, created_at, updated_at) VALUES
-- TẦNG 1: SẢNH CHÍNH (ZONE_1) - 10 bàn
(1,  'T-01', N'Bàn T-01 Cửa Kính',   'ZONE_1', 4,  'OCCUPIED',  NULL, NULL, NULL, 'TOKEN-QR-T01-A9F8E7', 1, GETDATE(), GETDATE()),
(2,  'T-02', N'Bàn T-02 Sảnh Giữa',  'ZONE_1', 4,  'AVAILABLE', NULL, NULL, NULL, 'TOKEN-QR-T02-B8E7D6', 1, GETDATE(), GETDATE()),
(3,  'T-03', N'Bàn T-03 Cạnh Quầy',  'ZONE_1', 2,  'AVAILABLE', NULL, NULL, NULL, 'TOKEN-QR-T03-C7D6C5', 1, GETDATE(), GETDATE()),
(4,  'T-04', N'Bàn T-04 Sofa Lớn',   'ZONE_1', 6,  'OCCUPIED',  NULL, NULL, NULL, 'TOKEN-QR-T04-D6C5B4', 1, GETDATE(), GETDATE()),
(5,  'T-05', N'Bàn T-05 Giữa Sảnh',  'ZONE_1', 4,  'DIRTY',     NULL, NULL, NULL, 'TOKEN-QR-T05-E5B4A3', 1, GETDATE(), GETDATE()),
(6,  'T-06', N'Bàn T-06 Đôi Cặp',    'ZONE_1', 2,  'AVAILABLE', NULL, NULL, NULL, 'TOKEN-QR-T06-F4A392', 1, GETDATE(), GETDATE()),
(7,  'T-07', N'Bàn T-07 Gia Đình',   'ZONE_1', 8,  'AVAILABLE', NULL, NULL, NULL, 'TOKEN-QR-T07-039281', 1, GETDATE(), GETDATE()),
(8,  'T-08', N'Bàn T-08 Nhóm Bạn',   'ZONE_1', 6,  'RESERVED',  NULL, N'Khách: Nguyễn Minh Tuấn (0912345678)', N'19:30', 'TOKEN-QR-T08-128170', 1, GETDATE(), GETDATE()),
(9,  'T-09', N'Bàn T-09 Cửa Sổ',     'ZONE_1', 4,  'AVAILABLE', NULL, NULL, NULL, 'TOKEN-QR-T09-217069', 1, GETDATE(), GETDATE()),
(10, 'T-10', N'Bàn T-10 Góc Trong',  'ZONE_1', 4,  'BLOCKED',   N'Bảo trì hệ thống điều hòa & đèn chiếu', NULL, NULL, 'TOKEN-QR-T10-306958', 1, GETDATE(), GETDATE()),

-- TẦNG 2: BAN CÔNG & SÂN VƯỜN (ZONE_2) - 6 bàn
(11, 'B-01', N'Ban Công 01 View Phố','ZONE_2', 4,  'OCCUPIED',  NULL, NULL, NULL, 'TOKEN-QR-B01-495847', 1, GETDATE(), GETDATE()),
(12, 'B-02', N'Ban Công 02 Góc Cây', 'ZONE_2', 4,  'AVAILABLE', NULL, NULL, NULL, 'TOKEN-QR-B02-584736', 1, GETDATE(), GETDATE()),
(13, 'B-03', N'Ban Công 03 Lãng Mạn','ZONE_2', 2,  'AVAILABLE', NULL, NULL, NULL, 'TOKEN-QR-B03-673625', 1, GETDATE(), GETDATE()),
(14, 'B-04', N'Ban Công 04 Nhóm Bạn','ZONE_2', 6,  'AVAILABLE', NULL, NULL, NULL, 'TOKEN-QR-B04-762514', 1, GETDATE(), GETDATE()),
(15, 'B-05', N'Ban Công 05 Sân Vườn','ZONE_2', 4,  'DIRTY',     NULL, NULL, NULL, 'TOKEN-QR-B05-851403', 1, GETDATE(), GETDATE()),
(16, 'B-06', N'Ban Công 06 Đôi Cặp', 'ZONE_2', 2,  'RESERVED',  NULL, N'Khách: Trần Thảo Ly (0987654321)', N'20:00', 'TOKEN-QR-B06-940392', 1, GETDATE(), GETDATE()),

-- PHÒNG VIP RIÊNG TƯ (VIP) - 2 phòng
(17, 'VIP-01', N'Phòng VIP Tiệc Gia Đình 1', 'VIP', 10, 'OCCUPIED',  NULL, NULL, NULL, 'TOKEN-QR-VIP01-039281', 1, GETDATE(), GETDATE()),
(18, 'VIP-02', N'Phòng VIP Hội Nghị & Đối Tác 2', 'VIP', 12, 'AVAILABLE', NULL, NULL, NULL, 'TOKEN-QR-VIP02-128170', 1, GETDATE(), GETDATE());
SET IDENTITY_INSERT restaurant_tables OFF;

PRINT N'==> Đã chèn 18 bàn ăn phủ đều 3 khu vực với đầy đủ các trạng thái thực tế.';

PRINT N'--------------------------------------------------------------------------------';
PRINT N'BƯỚC 6: CHÈN DANH MỤC THỰC ĐƠN (CATEGORIES)...';
PRINT N'--------------------------------------------------------------------------------';

SET IDENTITY_INSERT categories ON;
INSERT INTO categories (id, name, description, display_order, is_active, created_at, updated_at) VALUES
(1, N'Khai Vị & Salad',       N'Các món khai vị thanh mát, đánh thức vị giác trước bữa tiệc', 1, 1, GETDATE(), GETDATE()),
(2, N'Món Bò & Steak Thượng Hạng', N'Thịt bò Wagyu và Angus nhập khẩu áp chảo trên lửa than hồng', 2, 1, GETDATE(), GETDATE()),
(3, N'Hải Sản Tươi Sống',     N'Hải sản cao cấp chế biến theo công thức Địa Trung Hải tinh tế', 3, 1, GETDATE(), GETDATE()),
(4, N'Mì Ý & Cơm Niêu Đặc Sản', N'Mì Ý làm thủ công trong ngày kết hợp các loại sốt đậm đà', 4, 1, GETDATE(), GETDATE()),
(5, N'Tráng Miệng Tinh Tế',   N'Bánh ngọt phong cách Pháp và kem gelato mát lạnh', 5, 1, GETDATE(), GETDATE()),
(6, N'Đồ Uống & Rượu Vang',   N'Rượu vang tuyển chọn, nước ép trái cây tươi và nước đóng lon cao cấp', 6, 1, GETDATE(), GETDATE());
SET IDENTITY_INSERT categories OFF;

PRINT N'==> Đã chèn 6 nhóm danh mục thực đơn ẩm thực.';

PRINT N'--------------------------------------------------------------------------------';
PRINT N'BƯỚC 7: CHÈN CÁC MÓN ĂN VÀ ĐỒ UỐNG (MENU_ITEMS)...';
PRINT N'--------------------------------------------------------------------------------';

SET IDENTITY_INSERT menu_items ON;
INSERT INTO menu_items (id, category_id, sku, name, description, price, cost_price, station, tag, image_url, is_available, display_order, is_active, created_at, updated_at) VALUES
-- Nhóm 1: Khai Vị & Salad
(1, 1, 'APP-001', N'Salad Ức Vịt Xông Khói Sốt Cam', N'Xà lách Romaine hữu cơ, ức vịt xông khói áp chảo, phô mai Feta và sốt cam bưởi tươi mát', 135000, 48000, 'KITCHEN', N'Bestseller', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600', 1, 1, 1, GETDATE(), GETDATE()),
(2, 1, 'APP-002', N'Bánh Mì Bơ Tỏi Nướng Phô Mai', N'Bánh mì baguette giòn rụm nướng bơ tỏi thơm lừng phủ phô mai Mozzarella béo ngậy', 85000, 28000, 'KITCHEN', N'Món Ăn', 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=600', 1, 2, 1, GETDATE(), GETDATE()),
(3, 1, 'APP-003', N'Súp Kem Bí Đỏ Hạt Dẻ Cười', N'Bí đỏ hồ lô ninh nhuyễn cùng kem tươi béo nhẹ, trang trí hạt dẻ cười rang muối', 95000, 32000, 'KITCHEN', N'Chef''s Choice', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600', 1, 3, 1, GETDATE(), GETDATE()),
(4, 1, 'APP-004', N'Tartare Cá Hồi Na Uy Trứng Muối', N'Cá hồi tươi phi lê hạt lựu, sốt chanh vàng, bơ sáp và bánh quy giòn ăn kèm', 185000, 75000, 'KITCHEN', N'Healthy', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600', 1, 4, 1, GETDATE(), GETDATE()),

-- Nhóm 2: Món Bò & Steak Thượng Hạng
(5, 2, 'STK-001', N'Bò Wagyu A5 Nướng Đá Nóng 200g', N'Bò Wagyu Nhật Bản vân mỡ cẩm thạch tuyệt hảo nướng trên phiến đá núi lửa 300 độ C', 790000, 380000, 'KITCHEN', N'Bestseller', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600', 1, 5, 1, GETDATE(), GETDATE()),
(6, 2, 'STK-002', N'Thăn Ngoại Bò Úc Black Angus 250g', N'Thăn bò Úc nướng chín vừa mọng nước dùng kèm sốt tiêu đen Phú Quốc và măng tây áp chảo', 395000, 165000, 'KITCHEN', N'Chef''s Choice', 'https://images.unsplash.com/photo-1558030006-450675393462?w=600', 1, 6, 1, GETDATE(), GETDATE()),
(7, 2, 'STK-003', N'Sườn Cừu Nướng Lá Hương Thảo', N'Sườn cừu non New Zealand ướp hương thảo và tỏi nướng mộc mạc thơm lừng', 420000, 180000, 'KITCHEN', N'Món Mới', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600', 1, 7, 1, GETDATE(), GETDATE()),
(8, 2, 'STK-004', N'Bò Hầm Rượu Vang Đỏ Bourgogne', N'Thịt bắp bò hầm nhừ trong sốt vang đỏ Pháp cùng nấm hương và cà rốt bi', 285000, 110000, 'KITCHEN', N'Món Ăn', 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=600', 1, 8, 1, GETDATE(), GETDATE()),

-- Nhóm 3: Hải Sản Tươi Sống
(9,  3, 'SEA-001', N'Tôm Hùm Nướng Bơ Tỏi Phô Mai', N'Nửa con tôm hùm Canada nướng đẫm sốt bơ tỏi và phủ phô mai Parmesan đút lò', 580000, 260000, 'KITCHEN', N'Bestseller', 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=600', 1, 9, 1, GETDATE(), GETDATE()),
(10, 3, 'SEA-002', N'Cá Hồi Áp Chảo Sốt Bơ Chanh', N'Cá hồi Na Uy da giòn thịt mềm ngậy quyện sốt bơ chanh vàng cùng khoai tây nghiền', 295000, 125000, 'KITCHEN', N'Chef''s Choice', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600', 1, 10, 1, GETDATE(), GETDATE()),
(11, 3, 'SEA-003', N'Mực Ống Nướng Sa Tế Mật Ong', N'Mực ống tươi dày thịt khứa hoa nướng sa tế mật ong rừng giòn ngọt cay dịu', 195000, 75000, 'KITCHEN', N'Món Ăn', 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600', 1, 11, 1, GETDATE(), GETDATE()),

-- Nhóm 4: Mì Ý & Cơm Niêu
(12, 4, 'PAS-001', N'Mì Ý Sốt Bò Bằm Bologna Cổ Điển', N'Sợi mì spaghetti tươi kết hợp nước sốt bò bằm cà chua hầm chậm suốt 6 giờ', 165000, 55000, 'KITCHEN', N'Bestseller', 'https://images.unsplash.com/photo-1621996346565-e3d5d6281292?w=600', 1, 12, 1, GETDATE(), GETDATE()),
(13, 4, 'PAS-002', N'Mì Ý Hải Sản Cay Sốt Pesto', N'Mì dẹt Tagliatelle trộn sốt lá húng tây hạt thông Pesto cùng tôm sú và mực nang', 225000, 85000, 'KITCHEN', N'Chef''s Choice', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600', 1, 13, 1, GETDATE(), GETDATE()),
(14, 4, 'PAS-003', N'Cơm Risotto Nấm Truffle Đen', N'Cơm gạo Ý Arborio nấu cùng nấm đùi gà, bơ Pháp và sốt nấm Truffle đen quý hiếm', 245000, 95000, 'KITCHEN', N'Món Mới', 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=600', 1, 14, 1, GETDATE(), GETDATE()),

-- Nhóm 5: Tráng Miệng
(15, 5, 'DES-001', N'Bánh Tiramisu Truyền Thống Ý', N'Bánh ngón tay nhúng cà phê espresso đậm đà quyện kem phô mai Mascarpone rắc cacao', 85000, 25000, 'KITCHEN', N'Bestseller', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600', 1, 15, 1, GETDATE(), GETDATE()),
(16, 5, 'DES-002', N'Bánh Mousse Chanh Leo Vải Thiều', N'Lớp mousse chua dịu thanh tao cân bằng hoàn hảo với thạch vải ngọt ngào', 75000, 22000, 'KITCHEN', N'Healthy', 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600', 1, 16, 1, GETDATE(), GETDATE()),
(17, 5, 'DES-003', N'Kem Gelato Vani Madagascar & Dâu', N'Hai viên kem Ý thủ công mát lạnh đậm hương vani tự nhiên và sốt dâu tươi', 65000, 18000, 'WAITER', N'Món Ăn', 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=600', 1, 17, 1, GETDATE(), GETDATE()),

-- Nhóm 6: Đồ Uống & Rượu Vang (Trạm WAITER lấy trực tiếp từ tủ mát)
(18, 6, 'DRK-001', N'Rượu Vang Đỏ Cabernet Sauvignon (Chai)', N'Vang đỏ Chile đậm vị trái cây chín mọng, hậu vị chát êm ái thích hợp dùng kèm Steak', 650000, 320000, 'WAITER', N'Bestseller', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600', 1, 18, 1, GETDATE(), GETDATE()),
(19, 6, 'DRK-002', N'Rượu Vang Trắng Sauvignon Blanc (Ly)', N'Hương thơm cam chanh và khoáng chất tươi mới, lý tưởng kết hợp cùng hải sản', 120000, 45000, 'WAITER', N'Đồ Uống', 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=600', 1, 19, 1, GETDATE(), GETDATE()),
(20, 6, 'DRK-003', N'Trà Đào Cam Sả Tươi Mát', N'Trà đen ủ lạnh ngâm sả tươi, cam vàng và miếng đào ngâm giòn ngọt thơm lừng', 55000, 15000, 'WAITER', N'Bestseller', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600', 1, 20, 1, GETDATE(), GETDATE()),
(21, 6, 'DRK-004', N'Nước Ép Dưa Hấu Bạc Hà Nguyên Chất', N'Dưa hấu đỏ tươi ép chậm nguyên chất không đường thêm vài lá bạc hà the mát', 50000, 12000, 'WAITER', N'Healthy', 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=600', 1, 21, 1, GETDATE(), GETDATE()),
(22, 6, 'DRK-005', N'Bia Thủ Công IPA Jasmine Hops (Chai)', N'Bia thủ công vị đắng hoa bia hoa nhài đậm đà 6.2% độ cồn', 85000, 38000, 'WAITER', N'Đồ Uống', 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600', 1, 22, 1, GETDATE(), GETDATE()),
(23, 6, 'DRK-006', N'Coca Cola Lon 330ml', N'Nước ngọt có gas ướp lạnh kèm ly đá chanh tươi', 28000, 9000, 'WAITER', N'Đồ Uống', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600', 1, 23, 1, GETDATE(), GETDATE()),
(24, 6, 'DRK-007', N'Nước Khoáng Tự Nhiên San Pellegrino 500ml', N'Nước khoáng có gas nhập khẩu từ Ý trong chai thủy tinh sang trọng', 60000, 24000, 'WAITER', N'Đồ Uống', 'https://images.unsplash.com/photo-1559839914-ba2ae6143c72?w=600', 1, 24, 1, GETDATE(), GETDATE()),
(25, 6, 'DRK-008', N'Cà Phê Muối Kem Béo Phong Cách Huế', N'Cà phê phin truyền thống thơm lừng kết hợp lớp kem sữa muối mặn mòi độc đáo', 45000, 12000, 'WAITER', N'Món Mới', 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600', 1, 25, 1, GETDATE(), GETDATE()),
(26, 2, 'STK-005', N'Bò Nướng Tảng Tomahawk 1kg (Tạm Hết Hàng)', N'Sườn bò Tomahawk khổng lồ 1kg dành cho đại tiệc 4-6 người', 1890000, 950000, 'KITCHEN', N'Chef''s Choice', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600', 0, 26, 1, GETDATE(), GETDATE());
SET IDENTITY_INSERT menu_items OFF;

PRINT N'==> Đã chèn 26 món ăn và đồ uống với đầy đủ giá vốn, giá bán, trạm KITCHEN/WAITER và ảnh minh họa.';

PRINT N'--------------------------------------------------------------------------------';
PRINT N'BƯỚC 8: CHÈN CÁC PHIÊN ĂN TẠI BÀN (DINING_SESSIONS)...';
PRINT N'--------------------------------------------------------------------------------';

SET IDENTITY_INSERT dining_sessions ON;
INSERT INTO dining_sessions (id, table_id, session_token, status, guest_count, note, start_time, end_time, version, created_at, updated_at) VALUES
-- 1. Phiên ăn đang diễn ra tại Bàn T-01 (ACTIVE)
(1, 1, 'SESSION-T01-ACTIVE-8821', 'ACTIVE', 3, N'Khách gọi món qua mã QR tại bàn, ăn ít cay', DATEADD(MINUTE, -45, GETDATE()), NULL, 1, DATEADD(MINUTE, -45, GETDATE()), GETDATE()),

-- 2. Phiên ăn đang diễn ra tại Bàn T-04 (ACTIVE)
(2, 4, 'SESSION-T04-ACTIVE-9932', 'ACTIVE', 5, N'Nhóm liên hoan công ty, dùng nhiều đồ uống', DATEADD(MINUTE, -70, GETDATE()), NULL, 2, DATEADD(MINUTE, -70, GETDATE()), GETDATE()),

-- 3. Phiên ăn đang diễn ra tại Ban Công B-01 (ACTIVE)
(3, 11, 'SESSION-B01-ACTIVE-3344', 'ACTIVE', 2, N'Cặp đôi kỷ niệm ngày cưới, cần phục vụ nến', DATEADD(MINUTE, -30, GETDATE()), NULL, 1, DATEADD(MINUTE, -30, GETDATE()), GETDATE()),

-- 4. Phiên ăn đang diễn ra tại Phòng VIP-01 (ACTIVE)
(4, 17, 'SESSION-VIP01-ACTIVE-5566', 'ACTIVE', 8, N'Tiếp khách đối tác ngân hàng, cần ra món chuẩn giờ', DATEADD(MINUTE, -90, GETDATE()), NULL, 3, DATEADD(MINUTE, -90, GETDATE()), GETDATE()),

-- 5. Phiên ăn tại Bàn T-05 vừa ăn xong, đã tính tiền đang dọn bàn (COMPLETED)
(5, 5, 'SESSION-T05-COMPLETED-1122', 'COMPLETED', 4, N'Khách đã thanh toán và rời bàn', DATEADD(HOUR, -2, GETDATE()), DATEADD(MINUTE, -10, GETDATE()), 1, DATEADD(HOUR, -2, GETDATE()), DATEADD(MINUTE, -10, GETDATE())),

-- 6. Phiên ăn lịch sử ngày hôm qua tại Bàn T-02 (COMPLETED)
(6, 2, 'SESSION-T02-HIST-YESTERDAY', 'COMPLETED', 4, N'Bữa tối gia đình', DATEADD(DAY, -1, GETDATE()), DATEADD(MINUTE, 90, DATEADD(DAY, -1, GETDATE())), 1, DATEADD(DAY, -1, GETDATE()), DATEADD(DAY, -1, GETDATE()));
SET IDENTITY_INSERT dining_sessions OFF;

PRINT N'==> Đã chèn 6 phiên ăn (4 bàn đang phục vụ ACTIVE, 2 bàn lịch sử COMPLETED).';

PRINT N'--------------------------------------------------------------------------------';
PRINT N'BƯỚC 9: CHÈN CÁC ĐỢT GỌI MÓN (ORDERS) & CHI TIẾT ĐĨA MÓN (ORDER_ITEMS)...';
PRINT N'--------------------------------------------------------------------------------';

-- 9.1. Đợt gọi món cho Phiên 1 (Bàn T-01)
SET IDENTITY_INSERT orders ON;
INSERT INTO orders (id, session_id, staff_id, order_code, total_amount, status, note, order_time, created_at, updated_at) VALUES
(1, 1, 3, 'ORD-20261013-0001', 1160000, 'COOKING', N'Khách gọi đợt 1 qua QR, làm nhanh giúp', DATEADD(MINUTE, -40, GETDATE()), DATEADD(MINUTE, -40, GETDATE()), GETDATE()),
(2, 1, 3, 'ORD-20261013-0002', 110000,  'CONFIRMED', N'Gọi thêm nước uống', DATEADD(MINUTE, -15, GETDATE()), DATEADD(MINUTE, -15, GETDATE()), GETDATE()),

-- Đợt gọi món cho Phiên 2 (Bàn T-04)
(3, 2, 3, 'ORD-20261013-0003', 1455000, 'SERVED', N'Gọi đợt đầu đầy đủ', DATEADD(MINUTE, -65, GETDATE()), DATEADD(MINUTE, -65, GETDATE()), GETDATE()),

-- Đợt gọi món cho Phiên 3 (Bàn B-01)
(4, 3, 4, 'ORD-20261013-0004', 1195000, 'COOKING', N'Bàn ban công kỷ niệm ngày cưới', DATEADD(MINUTE, -25, GETDATE()), DATEADD(MINUTE, -25, GETDATE()), GETDATE()),

-- Đợt gọi món cho Phiên 4 (Phòng VIP-01)
(5, 4, 5, 'ORD-20261013-0005', 3890000, 'COOKING', N'Thực đơn cao cấp tiếp khách VIP', DATEADD(MINUTE, -80, GETDATE()), DATEADD(MINUTE, -80, GETDATE()), GETDATE()),

-- Đợt gọi món cho Phiên 5 (Bàn T-05 - Đã thanh toán)
(6, 5, 3, 'ORD-20261013-0006', 975000,  'SERVED', N'Đã dùng xong bữa', DATEADD(HOUR, -2, GETDATE()), DATEADD(HOUR, -2, GETDATE()), DATEADD(MINUTE, -15, GETDATE()));
SET IDENTITY_INSERT orders OFF;

-- 9.2. Chi tiết các món (order_items)
SET IDENTITY_INSERT order_items ON;
INSERT INTO order_items (id, order_id, menu_item_id, quantity, unit_price, subtotal, note, status, created_at, updated_at) VALUES
-- Món đợt 1 (Bàn T-01)
(1, 1, 1,  1, 135000, 135000, N'Ít sốt cam', 'SERVED', DATEADD(MINUTE, -40, GETDATE()), GETDATE()),
(2, 1, 5,  1, 790000, 790000, N'Đá thật nóng chín vừa Medium', 'COOKING', DATEADD(MINUTE, -40, GETDATE()), GETDATE()),
(3, 1, 12, 1, 165000, 165000, N'Thêm nhiều phô mai bào', 'READY', DATEADD(MINUTE, -40, GETDATE()), GETDATE()),
(4, 1, 20, 2, 55000,  110000, N'Ít ngọt nhiều đá', 'SERVED', DATEADD(MINUTE, -40, GETDATE()), GETDATE()),

-- Món đợt 2 gọi thêm (Bàn T-01)
(5, 2, 23, 2, 28000,  56000,  N'Ướp lạnh', 'PENDING', DATEADD(MINUTE, -15, GETDATE()), GETDATE()),
(6, 2, 21, 1, 50000,  50000,  N'Không đường', 'COOKING', DATEADD(MINUTE, -15, GETDATE()), GETDATE()),

-- Món đợt 3 (Bàn T-04)
(7, 3, 6,  2, 395000, 790000, N'Chín vừa Medium Rare', 'SERVED', DATEADD(MINUTE, -65, GETDATE()), GETDATE()),
(8, 3, 13, 2, 225000, 450000, N'Cay vừa', 'SERVED', DATEADD(MINUTE, -65, GETDATE()), GETDATE()),
(9, 3, 22, 2, 85000,  170000, N'Kèm ly lạnh', 'SERVED', DATEADD(MINUTE, -65, GETDATE()), GETDATE()),

-- Món đợt 4 (Ban Công B-01)
(10, 4, 10, 1, 295000, 295000, N'Da thật giòn', 'COOKING', DATEADD(MINUTE, -25, GETDATE()), GETDATE()),
(11, 4, 18, 1, 650000, 650000, N'Mở nắp vang trước 15 phút', 'SERVED', DATEADD(MINUTE, -25, GETDATE()), GETDATE()),
(12, 4, 15, 2, 85000,  170000, N'Trang trí chữ Kỷ Niệm Ngày Cưới', 'PENDING', DATEADD(MINUTE, -25, GETDATE()), GETDATE()),

-- Món đợt 5 (Phòng VIP-01)
(13, 5, 5,  2, 790000, 1580000, N'Wagyu A5 nướng chín tới', 'COOKING', DATEADD(MINUTE, -80, GETDATE()), GETDATE()),
(14, 5, 9,  2, 580000, 1160000, N'Tôm hùm phô mai đút lò', 'COOKING', DATEADD(MINUTE, -80, GETDATE()), GETDATE()),
(15, 5, 14, 2, 245000, 490000,  N'Risotto nấm Truffle đen', 'READY', DATEADD(MINUTE, -80, GETDATE()), GETDATE()),
(16, 5, 18, 1, 650000, 650000,  N'Vang đỏ cao cấp', 'SERVED', DATEADD(MINUTE, -80, GETDATE()), GETDATE()),

-- Món đợt 6 (Bàn T-05 đã thanh toán)
(17, 6, 6,  2, 395000, 790000, NULL, 'SERVED', DATEADD(HOUR, -2, GETDATE()), DATEADD(MINUTE, -15, GETDATE())),
(18, 6, 12, 1, 165000, 165000, NULL, 'SERVED', DATEADD(HOUR, -2, GETDATE()), DATEADD(MINUTE, -15, GETDATE()));
SET IDENTITY_INSERT order_items OFF;

PRINT N'==> Đã chèn 6 đợt order và 18 dòng chi tiết món liên thông trạm Bếp KDS & Bồi bàn.';

PRINT N'--------------------------------------------------------------------------------';
PRINT N'BƯỚC 10: CHÈN HÓA ĐƠN THANH TOÁN (BILLS)...';
PRINT N'--------------------------------------------------------------------------------';

SET IDENTITY_INSERT bills ON;
INSERT INTO bills (id, session_id, cashier_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, note, created_at, updated_at) VALUES
-- 1. Hóa đơn của Bàn T-05 (Đã thanh toán xong qua chuyển khoản VietQR)
(1, 5, 8, 'BILL-20261013-0001', 975000, 78000, 50000, 1003000, 'BANK_TRANSFER', 'PAID', DATEADD(MINUTE, -15, GETDATE()), N'Khách thanh toán quét mã VietQR ngân hàng', DATEADD(MINUTE, -20, GETDATE()), DATEADD(MINUTE, -15, GETDATE())),

-- 2. Hóa đơn của Bàn T-02 hôm qua (Đã thanh toán tiền mặt)
(2, 6, 8, 'BILL-20261012-0088', 1250000, 100000, 0, 1350000, 'CASH', 'PAID', DATEADD(DAY, -1, GETDATE()), N'Thanh toán tiền mặt đủ', DATEADD(DAY, -1, GETDATE()), DATEADD(DAY, -1, GETDATE())),

-- 3. Hóa đơn tạm tính hiện tại của Bàn T-04 (UNPAID - đang dùng bữa)
(3, 2, NULL, 'BILL-20261013-0002', 1455000, 116400, 0, 1571400, NULL, 'UNPAID', NULL, N'Phiếu tạm tính tại bàn', GETDATE(), GETDATE());
SET IDENTITY_INSERT bills OFF;

PRINT N'==> Đã chèn hóa đơn thanh toán mẫu (PAID và UNPAID).';

PRINT N'--------------------------------------------------------------------------------';
PRINT N'BƯỚC 11: CHÈN PHIẾU ĐẶT BÀN TRỰC TUYẾN (RESERVATIONS)...';
PRINT N'--------------------------------------------------------------------------------';

SET IDENTITY_INSERT reservations ON;
INSERT INTO reservations (id, booking_code, table_id, requested_zone, customer_name, customer_phone, customer_email, guest_count, reservation_time, status, note, cancel_reason, created_at, updated_at) VALUES
-- 1. Đơn PENDING: Mới đặt online, chờ Quản lý bấm gọi điện xác nhận & xếp bàn
(1, 'RES-20261013-1001', NULL, 'ZONE_1', N'Lê Văn Thắng', '0934112233', 'thang.le@gmail.com', 4, DATEADD(HOUR, 3, GETDATE()), 'PENDING', N'Đặt bàn sinh nhật có em bé, cần chuẩn bị ghế nôi', NULL, DATEADD(MINUTE, -20, GETDATE()), GETDATE()),

-- 2. Đơn PENDING: Cần phòng VIP chiều tối nay
(2, 'RES-20261013-1002', NULL, 'VIP', N'Bà Hoàng Kim Oanh', '0908889999', 'oanh.hk@corporation.vn', 8, DATEADD(HOUR, 5, GETDATE()), 'PENDING', N'Tiệc gặp gỡ hội đồng quản trị công ty, ăn món Âu', NULL, DATEADD(MINUTE, -10, GETDATE()), GETDATE()),

-- 3. Đơn CONFIRMED: Quản lý đã gọi điện và đã xếp giữ chỗ tại Bàn T-08 (19:30 tối nay)
(3, 'RES-20261013-8821', 8, 'ZONE_1', N'Nguyễn Minh Tuấn', '0912345678', 'tuan.nguyen@fpt.com.vn', 6, DATEADD(HOUR, 4, GETDATE()), 'CONFIRMED', N'Bàn kỷ niệm gia đình, dọn sẵn khăn trải bàn', NULL, DATEADD(HOUR, -2, GETDATE()), GETDATE()),

-- 4. Đơn CONFIRMED: Đã giữ chỗ Ban Công B-06 (20:00 tối nay)
(4, 'RES-20261013-7732', 16, 'ZONE_2', N'Trần Thảo Ly', '0987654321', 'ly.tran@techcombank.com.vn', 2, DATEADD(HOUR, 6, GETDATE()), 'CONFIRMED', N'Cặp đôi lãng mạn cạnh lan can view đẹp', NULL, DATEADD(HOUR, -3, GETDATE()), GETDATE()),

-- 5. Đơn COMPLETED: Khách đặt trước trưa nay và đã đến nhận bàn ăn xong
(5, 'RES-20261013-5511', 1, 'ZONE_1', N'Hoàng Trọng Nghĩa', '0919223344', 'nghia.hoang@gmail.com', 3, DATEADD(HOUR, -1, GETDATE()), 'COMPLETED', N'Khách đã check-in vào bàn T-01 dùng bữa', NULL, DATEADD(HOUR, -5, GETDATE()), GETDATE()),

-- 6. Đơn CANCELLED: Khách bận đột xuất báo hủy
(6, 'RES-20261013-0099', NULL, 'ZONE_2', N'Vũ Đình Hưng', '0945678901', 'hung.vd@gmail.com', 4, DATEADD(HOUR, 2, GETDATE()), 'CANCELLED', N'Khách gọi báo hoãn công tác đột xuất', N'Khách hàng chủ động báo hoãn lịch', DATEADD(HOUR, -4, GETDATE()), GETDATE());
SET IDENTITY_INSERT reservations OFF;

PRINT N'==> Đã chèn 6 phiếu đặt bàn với đủ 4 trạng thái (PENDING, CONFIRMED, COMPLETED, CANCELLED).';

PRINT N'--------------------------------------------------------------------------------';
PRINT N'BƯỚC 12: CHÈN DANH SÁCH MÓN ĐẶT TRƯỚC (RESERVATION_ITEMS)...';
PRINT N'--------------------------------------------------------------------------------';

SET IDENTITY_INSERT reservation_items ON;
INSERT INTO reservation_items (id, reservation_id, menu_item_id, quantity, unit_price, subtotal, note, created_at, updated_at) VALUES
-- Món đặt trước cho Phiếu 1 (Đơn PENDING của anh Lê Văn Thắng)
(1, 1, 1, 1, 135000, 135000, N'Salad ít chua', GETDATE(), GETDATE()),
(2, 1, 6, 2, 395000, 790000, N'Bò Úc chín vừa Medium', GETDATE(), GETDATE()),
(3, 1, 12, 1, 165000, 165000, N'Mì Ý cho bé', GETDATE(), GETDATE()),
(4, 1, 20, 2, 55000,  110000, N'Trà đào cam sả ít ngọt', GETDATE(), GETDATE()),

-- Món đặt trước cho Phiếu 2 (Đơn VIP PENDING của bà Hoàng Kim Oanh)
(5, 2, 5, 3, 790000, 2370000, N'Wagyu A5 nướng đá', GETDATE(), GETDATE()),
(6, 2, 9, 2, 580000, 1160000, N'Tôm hùm phô mai đút lò', GETDATE(), GETDATE()),
(7, 2, 18, 2, 650000, 1300000, N'Rượu vang đỏ Cabernet Sauvignon ướp lạnh sẵn', GETDATE(), GETDATE()),

-- Món đặt trước cho Phiếu 3 (Đơn CONFIRMED Bàn T-08 của anh Nguyễn Minh Tuấn)
(8, 3, 4, 1, 185000, 185000, N'Tartare cá hồi tươi', GETDATE(), GETDATE()),
(9, 3, 6, 3, 395000, 1185000, N'Thịt bò nướng chín kỹ Well-done', GETDATE(), GETDATE()),
(10, 3, 13, 2, 225000, 450000, N'Mì hải sản không cay', GETDATE(), GETDATE()),

-- Món đặt trước cho Phiếu 4 (Đơn CONFIRMED Bàn B-06 của chị Trần Thảo Ly)
(11, 4, 10, 2, 295000, 590000, N'Cá hồi áp chảo thơm bơ', GETDATE(), GETDATE()),
(12, 4, 15, 2, 85000,  170000, N'Tiramisu ăn tráng miệng sau bữa', GETDATE(), GETDATE());
SET IDENTITY_INSERT reservation_items OFF;

PRINT N'==> Đã chèn 12 món ăn đặt trước (pre-order) gắn với các phiếu đặt bàn.';

PRINT N'--------------------------------------------------------------------------------';
PRINT N'BƯỚC 13: CHÈN CHUÔNG GỌI PHỤC VỤ TẠI BÀN (SERVICE_REQUESTS)...';
PRINT N'--------------------------------------------------------------------------------';

SET IDENTITY_INSERT service_requests ON;
INSERT INTO service_requests (id, table_id, session_id, request_type, note, status, staff_id, created_at, updated_at) VALUES
-- 1. Bàn T-01 vừa bấm chuông: Gọi phục vụ (PENDING - Sẽ làm rung chuông & hiện badge đỏ trên Header Admin)
(1, 1, 1, 'CALL_WAITER', N'Khách gọi phục vụ bàn T-01 cần hỗ trợ thêm chén đĩa', 'PENDING', NULL, DATEADD(MINUTE, -2, GETDATE()), GETDATE()),

-- 2. Bàn T-04 vừa bấm chuông: Xin thêm đá & khăn ướt (PENDING)
(2, 4, 2, 'REQUEST_ICE', N'Bàn T-04 xin thêm một xô đá và 4 khăn lạnh', 'PENDING', NULL, DATEADD(MINUTE, -5, GETDATE()), GETDATE()),

-- 3. Ban Công B-01 bấm chuông: Xin hóa đơn thanh toán (RESOLVED - Nhân viên đã tiếp nhận)
(3, 11, 3, 'REQUEST_BILL', N'Khách chuẩn bị thanh toán', 'RESOLVED', 4, DATEADD(MINUTE, -20, GETDATE()), DATEADD(MINUTE, -18, GETDATE())),

-- 4. Bàn T-02 yêu cầu lịch sử (RESOLVED)
(4, 2, NULL, 'CALL_WAITER', N'Tư vấn món steak đặc biệt', 'RESOLVED', 3, DATEADD(HOUR, -3, GETDATE()), DATEADD(HOUR, -3, GETDATE()));
SET IDENTITY_INSERT service_requests OFF;

PRINT N'==> Đã chèn 4 yêu cầu phục vụ khẩn tại bàn (2 PENDING kích hoạt chuông âm báo).';

COMMIT TRANSACTION;
PRINT N'--------------------------------------------------------------------------------';
PRINT N'HOÀN TẤT: ĐÃ SINH TOÀN BỘ DỮ LIỆU MẪU THÀNH CÔNG VÀ AN TOÀN CHO TOÀN BỘ HỆ THỐNG!';
PRINT N'--------------------------------------------------------------------------------';
GO