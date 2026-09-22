# NỘI DUNG SLIDE THUYẾT TRÌNH TIẾNG VIỆT (17 SLIDES)
## DỰ ÁN: RESTAURANT ORDERING MANAGEMENT SYSTEM (ROMS)
**Môn học:** SWP391 — Software Development Project | **Đại học FPT Đà Nẵng**  
**File PowerPoint hoàn chỉnh:**  
1. `Documents/ROMS_Project_and_RDS_Overview_VN.pptx`  
2. `Documents/ROMS_Bao_Cao_Tong_Quan_va_RDS_Tieng_Viet.pptx`  

---

### Slide 1: Trang Tiêu Đề (Dark Luxury Espresso Theme)
- **Huy hiệu trên cùng:** `SWP391 - ĐỒ ÁN PHÁT TRIỂN PHẦN MỀM | TỔNG QUAN & BÁO CÁO RDS`
- **Tiêu đề chính:** `ROMS: Hệ Thống Quản Lý Gọi Món Nhà Hàng Thông Minh`
- **Tiêu đề phụ:** `Báo Cáo Tổng Quan Dự Án & Đặc Tả Thiết Kế Kỹ Thuật (RDS Milestone Presentation)`
- **Hình ảnh nhận diện:** `image1.png` (Logo nhận diện thương hiệu ROMS)
- **Thông tin đồ án:**
  - *Đơn vị:* Đại học FPT Đà Nẵng | Mã môn: SWP391 | Học kỳ: Fall 2026
  - *Thành viên nhóm:* Dương Trong (Team Lead) | Phạm Minh Đức (Backend Lead) | Ngô Viết Bảo Huy (Frontend Lead)
  - *Công nghệ cốt lõi:* Spring Boot 3 + Spring Security (RBAC) + React + Microsoft SQL Server + STOMP WebSocket

---

### Slide 2: Bối Cảnh Thực Tế & Điểm Nghẽn Vận Hành
- **Phân mục:** `1. TỔNG QUAN DỰ ÁN`
- **Tiêu đề:** `Các Điểm Nghẽn Trong Vận Hành Nhà Hàng Truyền Thống`
- **Phụ đề:** `Những bất cập nghiêm trọng trong giờ cao điểm thúc đẩy nhu cầu tự động hóa số quy trình`
- **3 Cột Vấn Đề Thực Tế:**
  - **Cột 1 — Khó Khăn Của Thực Khách:**
    - Chờ đợi giờ cao điểm: Thực khách phải đợi 10–15 phút chỉ để gọi nhân viên và nhận menu giấy.
    - Sai lệch ghi chú món: Yêu cầu riêng (như không hành, ít đá) dễ bị quên hoặc truyền đạt sai khi nói miệng.
    - Thiếu tính minh bạch: Khách không biết món nào còn hay hết, không thấy hình ảnh món và thời gian chờ.
    - Bất tiện khi tính tiền: Phải vẫy tay gọi thanh toán nhiều lần và chờ in bill lâu làm giảm trải nghiệm.
  - **Cột 2 — Khó Khăn Của Nhà Bếp:**
    - Hỗn loạn phiếu giấy: Phiếu order dễ ướt, dính dầu mỡ hoặc thất lạc, gây nhầm lẫn và lãng phí nấu lại.
    - Chữ viết tay khó đọc: Chữ viết vội của phục vụ khiến bếp nấu sai món, dẫn đến khiếu nại của khách.
    - Xáo trộn thứ tự ra món: Bếp khó xác định đơn nào vào trước để làm trước, gây chậm trễ cho khách vào sớm.
    - Hết món không báo trước: Món hết giữa ca nhưng sảnh không biết kịp thời, dẫn đến hủy đơn khó chịu.
  - **Cột 3 — Khó Khăn Của Quản Lý & Kiểm Toán:**
    - Thất thoát doanh thu: Các trường hợp tự hủy món hoặc hủy miệng không kiểm soát gây thất thoát nội bộ.
    - Thiếu dữ liệu thời gian thực: Quản lý không nắm được tỷ lệ lấp đầy bàn, tốc độ ra món và lượt xoay vòng bàn.
    - Lãng phí nhân sự: Phục vụ mất tới 70% thời gian chỉ để chạy đi đưa menu và ghi order thủ công.
    - Đặt bàn thiếu kiểm soát: Không có cơ chế tự hủy khi khách trễ; bàn đặt bị bỏ trống dù khách vãng lai đang chờ.

---

### Slide 3: Phạm Vi Dự Án & Triết Lý Kiến Trúc Cốt Lõi
- **Phân mục:** `1. TỔNG QUAN DỰ ÁN`
- **Tiêu đề:** `Phạm Vi Dự Án & Triết Lý Kiến Trúc Cốt Lõi`
- **Phụ đề:** `Xác định ranh giới MVP chuẩn xác cho đồ án SWP391 (3 thành viên / 6 tuần)`
- **Card Trái — Ranh Giới Phạm Vi Hệ Thống (Scope Matrix):**
  - *Tính Năng Cốt Lõi Bắt Buộc (Cam kết hoàn thiện 100% khi bảo vệ):*
    - ✔ Xác thực nhân viên & Phân quyền chuẩn RBAC
    - ✔ Quản lý bàn & Xác thực mã QR bằng chữ ký số HMAC-SHA256
    - ✔ Quản lý trọn vẹn vòng đời Phiên dùng bữa (Dining Session)
    - ✔ Quản lý danh mục thực đơn số & Phân loại món ăn (CRUD)
    - ✔ Giỏ hàng chung & Đặt món theo đợt (Khóa Idempotency Key)
    - ✔ Màn hình bếp KDS theo hàng đợi thời gian thực & Máy trạng thái
    - ✔ Bản đồ bàn trực quan cho phục vụ & Bưng món ra bàn
    - ✔ Thu ngân tổng hợp hóa đơn, tính thuế VAT 8% & Thanh toán VietQR
    - ✔ Đặt bàn trước & Tự động hủy bàn nếu khách không đến (No-show)
  - *Tính Năng Chủ Động Loại Bỏ (Explicit Out-of-Scope):*
    - ✖ Hệ thống chuỗi Multi-tenant (Chỉ tối ưu cho 1 nhà hàng độc lập)
    - ✖ App di động cài đặt (Tập trung 100% vào Mobile Web Responsive)
    - ✖ Nạp tiền cọc online (Thanh toán trực tiếp tại quầy khi kết thúc bữa ăn)
    - ✖ Tích điểm thành viên & Khuyến mãi phức tạp (Tránh phình to phạm vi)
- **Card Phải — Triết Lý Kiến Trúc Cốt Lõi:**
  - *1. 'Dining Session' Là Trái Tim Của Hệ Thống:* Bàn ăn chỉ là vật thể vật lý. 'Dining Session' (Phiên dùng bữa) mới là thực thể thời gian cốt lõi gắn kết nhiều thực khách cùng ngồi, các đợt gọi món theo đợt, và duy nhất một hóa đơn thanh toán.
  - *2. Mã QR Chỉ Là Cổng Vào Bảo Mật, Không Phải Sản Phẩm:* Quét mã QR chỉ nhằm thiết lập kết nối được bảo vệ bằng mật mã HMAC tới phiên ăn đang hoạt động. Giá trị cốt lõi nằm ở quy trình xử lý đơn hàng thời gian thực khép kín phía sau.

---

### Slide 4: Các Tác Nhân Hệ Thống & Phân Quyền Vai Trò (RBAC)
- **Phân mục:** `2. ĐẶC TẢ YÊU CẦU NGHIỆP VỤ`
- **Tiêu đề:** `Các Tác Nhân Hệ Thống & Phân Quyền Vai Trò (RBAC)`
- **Phụ đề:** `Phân định rạch ròi trách nhiệm của 5 vai trò con người và 1 tác nhân hệ thống tự động`
- **6 Khối Vai Trò:**
  1. **Khách Hàng (Customer):** Quét QR để vào phiên ăn; xem thực đơn số kèm trạng thái còn món; gửi đơn đặt món theo đợt; theo dõi tiến độ nấu; bấm chuông gọi phục vụ hỗ trợ.
  2. **Nhân Viên Phục Vụ (Waiter):** Theo dõi bản đồ bàn trực tiếp; mở phiên ăn cho khách vãng lai; đặt món hộ khách; bưng bê món đã nấu xong (READY); nhận yêu cầu gọi phục vụ.
  3. **Đầu Bếp (Kitchen Staff):** Thao tác trên màn hình cảm ứng KDS; tiếp nhận đơn; cập nhật tiến độ nấu (CONFIRMED → PREPARING → READY); từ chối món hết nguyên liệu kèm lý do.
  4. **Thu Ngân (Cashier):** Kiểm tra các món đã phục vụ; áp thuế VAT/giảm giá; thu tiền mặt hoặc quét mã VietQR động; đóng phiên dùng bữa để giải phóng bàn về trống.
  5. **Quản Lý Nhà Hàng (Manager):** Quản lý tài khoản nhân viên & phân quyền; thiết lập sơ đồ bàn & xuất mã QR bảo mật; cập nhật món ăn & giá cả; xem báo cáo doanh thu chi tiết.
  6. **Tác Nhân Hệ Thống (System Actor):** Xác thực chữ ký số HMAC; điều phối gói tin WebSocket thời gian thực; nhận thông báo thanh toán; chạy Cron Job tự hủy bàn đặt quá giờ 20 phút.

---

### Slide 5: Use Case Khối Sảnh: Khách Hàng & Phục Vụ
- **Phân mục:** `2. ĐẶC TẢ YÊU CẦU NGHIỆP VỤ`
- **Tiêu đề:** `Use Case Khối Sảnh: Khách Hàng & Phục Vụ`
- **Phụ đề:** `Trao quyền tự phục vụ cho khách hàng song song với công cụ hỗ trợ thời gian thực cho nhân viên`
- **Cột Trái — Đặc Tả Tính Năng Khối Sảnh:**
  - `UC-09: Quét QR & Tham Gia Phiên Ăn:` Xác thực chữ ký HMAC-SHA256. Tự động tham gia phiên ăn đang mở hoặc nhắc phục vụ mở bàn. Ngăn chặn chiếm đoạt phiên từ xa.
  - `UC-13 & UC-15: Xem Menu & Giỏ Hàng Chung:` Menu phân loại trực quan kèm trạng thái còn món. Thêm món, điền ghi chú (vd: 'ít đá', 'không hành') và xem tổng tiền tạm tính chung của bàn.
  - `UC-16: Gửi Đợt Gọi Món (Batch Ordering):` Gửi đợt đặt món kèm khóa Idempotency Key (UUID v4). Ngăn chặn tạo trùng đơn khi mạng giật lag. Phát ngay lập tức lên màn hình bếp KDS.
  - `UC-18 & UC-19: Theo Dõi & Tự Hủy Món:` Theo dõi tiến độ nấu trực tiếp. Khách chỉ được tự hủy khi món ở trạng thái PENDING/CONFIRMED; khóa hủy khi bếp đã bắt đầu nấu (PREPARING).
  - `UC-10 & UC-17: Hỗ Trợ Phục Vụ Tại Bàn:` Phục vụ theo dõi bản đồ bàn trực tiếp, đặt món hộ khách lớn tuổi/khách vãng lai, và nhận thông báo bưng món đã xong ra bàn (UC-23).
  - `UC-24 & UC-25: Chuông Gọi Phục Vụ Hỗ Trợ:` Một chạm để gọi hỗ trợ (xin thêm đá, nước, dụng cụ, tính tiền). Phục vụ nhận ngay thông báo đẩy trên thiết bị cầm tay khu vực.
- **Cột Phải — Sơ Đồ Use Case:**
  - Phía trên: `image2.png` *(Sơ đồ Use Case Khách Hàng: UC-09 đến UC-19)*
  - Phía dưới: `image3.png` *(Sơ đồ Use Case Nhân Viên Phục Vụ: UC-10, UC-17, UC-23, UC-25)*

---

### Slide 6: Use Case Khối Nhà Bếp, Thu Ngân & Quản Lý
- **Phân mục:** `2. ĐẶC TẢ YÊU CẦU NGHIỆP VỤ`
- **Tiêu đề:** `Use Case Khối Nhà Bếp, Thu Ngân & Quản Lý`
- **Phụ đề:** `Hệ thống màn hình bếp (KDS), thanh toán hóa đơn và quản trị hệ thống`
- **Cột Trái — Đặc Tả Khối Bếp & Quản Trị:**
  - `UC-20 đến UC-22: Vòng Đời Món Ăn Trên KDS:` Hàng đợi phiếu order cảm ứng sắp xếp theo thời gian gửi. Bếp chuyển trạng thái (CONFIRMED → PREPARING → READY). Từ chối món hết nguyên liệu kèm lý do bắt buộc.
  - `UC-31: Tự Động Định Tuyến Đồ Uống:` Đồ uống đóng chai sẵn (is_drink = 1) tự động bỏ qua hàng đợi bếp, chuyển thẳng sang READY để phục vụ lấy mang ra bàn ngay.
  - `UC-26: Xuất Hóa Đơn & Quyết Toán:` Thu ngân gom toàn bộ món đã phục vụ (SERVED). Áp thuế VAT 8%. Thanh toán Tiền mặt hoặc VietQR động. Chuyển phiên sang CLOSED để giải phóng bàn.
  - `UC-07 & UC-08: Quản Lý Bàn & Xuất Mã QR:` Quản lý cấu hình khu vực bàn, số bàn, số lượng ghế, và xuất file in mã QR có chữ ký số HMAC bảo mật.
  - `UC-27: Nghiệp Vụ Đặt Bàn Trước:` Khách đặt bàn trước; hệ thống tự khóa bàn 45 phút trước giờ hẹn. Tiến trình ngầm tự động hủy và nhả bàn nếu khách trễ quá 20 phút.
  - `UC-28: Thống Kê & Báo Cáo Doanh Thu:` Bảng điều khiển trực quan tính toán doanh thu thuần trong ngày, số lượng đơn hàng, tỷ lệ quay vòng bàn và danh sách món bán chạy nhất.
- **Cột Phải — Sơ Đồ Use Case:**
  - Phía trên: `image4.png` *(Sơ đồ Use Case Nhà Bếp & Thu Ngân: UC-20 đến UC-26)*
  - Phía dưới: `image5.png` *(Sơ đồ Use Case Quản Lý & Tác Nhân Hệ Thống: UC-05 đến UC-28)*

---

### Slide 7: Luồng Chuyển Màn Hình & Hành Trình Thực Khách
- **Phân mục:** `2. ĐẶC TẢ YÊU CẦU NGHIỆP VỤ`
- **Tiêu đề:** `Luồng Chuyển Màn Hình & Hành Trình Thực Khách`
- **Phụ đề:** `Quy trình nghiệp vụ hoàn chỉnh kết nối hành động của khách hàng, nhà bếp và thu ngân`
- **Sơ đồ trực quan:** `image6.png` *(Sơ Đồ Luồng Màn Hình: SCR-01 đến SCR-18)*
- **Cột Phải — Các Cột Mốc Hành Trình:**
  - `Bước 1: Quét QR & Vào Phiên:` Khách quét QR tại bàn. Hệ thống xác thực chữ ký HMAC và mở màn hình Chào mừng SCR-09.
  - `Bước 2: Xem Menu & Tạo Giỏ Hàng:` Khách duyệt thực đơn SCR-10, tùy biến ghi chú món ăn và thêm vào giỏ hàng chung bàn SCR-11.
  - `Bước 3: Gửi Đơn Hàng An Toàn:` Gửi đơn kèm header UUID v4 duy nhất. Backend tạo Order và lập tức đẩy món lên màn hình bếp KDS.
  - `Bước 4: Bếp Nhận Đơn & Nấu Món:` Đầu bếp nhận ticket trên SCR-13 KDS, xác nhận nấu và chuyển món sang trạng thái READY khi hoàn thành.
  - `Bước 5: Phục Vụ Bưng Món Ra Bàn:` Nhân viên phục vụ bưng món ra đúng bàn và cập nhật trạng thái món thành SERVED (Đã phục vụ).
  - `Bước 6: Tính Tiền & Thanh Toán:` Khách yêu cầu tính tiền. Thu ngân (SCR-17) tổng hợp các món đã phục vụ, thu tiền mặt/VietQR và nhả bàn.

---

### Slide 8: Kiến Trúc Tổng Thể & Phân Phối Package Mã Nguồn
- **Phân mục:** `3. THIẾT KẾ HỆ THỐNG (RDS)`
- **Tiêu đề:** `Kiến Trúc Tổng Thể & Phân Phối Package Mã Nguồn`
- **Phụ đề:** `Kiến trúc phân lớp chuẩn doanh nghiệp trên Spring Boot 3 đảm bảo phân tách rõ ràng trách nhiệm`
- **Sơ đồ trực quan:** `image8.png` *(Sơ Đồ Phân Lớp Package Mã Nguồn: com.roms.*)*
- **Cột Phải — Cấu Trúc Phân Lớp Backend:**
  - `com.roms.config:` Cấu hình hạ tầng: Bộ lọc bảo mật SecurityFilterChain, JWT Filter, phân quyền CORS, tài liệu OpenAPI 3.
  - `com.roms.controller:` Tầng tiếp nhận REST API: Kiểm tra phân quyền truy cập endpoint và kiểm thực dữ liệu qua DTO.
  - `com.roms.dto:` Tách biệt hoàn toàn Request và Response DTO, bảo vệ cấu trúc Entity bên trong khỏi lộ ra ngoài client.
  - `com.roms.service & impl:` Trái tim nghiệp vụ: Ranh giới giao dịch @Transactional, kiểm duyệt máy trạng thái món, kiểm tra HMAC.
  - `com.roms.repository:` Tầng dữ liệu Spring Data JPA: Viết truy vấn JPQL và hỗ trợ khóa lạc quan (@Version) chống xung đột.
  - `com.roms.websocket:` Bộ điều phối tin nhắn STOMP qua WebSocket phát sự kiện thời gian thực (/topic/table, /topic/kitchen).
  - `com.roms.cron:` Các tác vụ nền định kỳ: Cron 5 phút tự nhả bàn trễ hẹn và Cron nửa đêm tổng hợp số liệu doanh thu.

---

### Slide 9: Thiết Kế Cơ Sở Dữ Liệu Quan Hệ (11 Bảng Cốt Lõi)
- **Phân mục:** `3. THIẾT KẾ HỆ THỐNG (RDS)`
- **Tiêu đề:** `Thiết Kế Cơ Sở Dữ Liệu Quan Hệ (11 Bảng Cốt Lõi)`
- **Phụ đề:** `Mô hình dữ liệu quan hệ lấy Dining Session làm trung tâm với toàn vẹn khóa ngoại và nhật ký kiểm toán`
- **Sơ đồ trực quan:** `image7.png` *(Sơ Đồ Cơ Sở Dữ Liệu Quan Hệ: ERD - 11 Bảng)*
- **Cột Phải — Điểm Nhấn Thiết Kế Database:**
  - `dining_sessions (Trục Trung Tâm):` Trục trung tâm kết nối dining_tables, orders và bills. Mỗi bàn chỉ có duy nhất 1 phiên hoạt động (BR-01).
  - `orders và order_items:` orders đại diện cho từng đợt gửi món. order_items là từng món ăn riêng lẻ có máy trạng thái và khóa lạc quan.
  - `Lưu Giá Snapshot (Snapshot Pricing):` order_items.unit_price lưu giá món tại thời điểm đặt, bảo vệ hóa đơn quá khứ không bị đổi khi menu đổi giá (BR-17).
  - `audit_logs (Nhật Ký Kiểm Toán):` Bảng ghi vết bất biến lưu lại các hành động từ chối món, hủy món, chuyển bàn kèm mã người dùng và lý do.
  - `reservations (Quản Lý Đặt Bàn):` Lưu lịch đặt bàn trước, số lượng khách, thời gian dự kiến đến và liên kết khóa ngoại với dining_tables.

---

### Slide 10: Quy Tắc Nghiệp Vụ & Máy Trạng Thái Đơn Hàng
- **Phân mục:** `3. THIẾT KẾ HỆ THỐNG (RDS)`
- **Tiêu đề:** `Quy Tắc Nghiệp Vụ & Máy Trạng Thái Đơn Hàng`
- **Phụ đề:** `Công cụ kiểm thực trạng thái chặt chẽ ngăn chặn nhảy cóc nghiệp vụ và triệt tiêu xung đột dữ liệu`
- **Cột Trái — Máy Trạng Thái Món Ăn (Order Item):**
  - `Quy Trình Chuẩn Tuyến Tính (Happy Path):` CONFIRMED → PREPARING → READY → SERVED: Tuyến tính nghiêm ngặt. Tuyệt đối không nhảy cóc trạng thái (không thể nhảy thẳng từ CONFIRMED sang SERVED).
  - `Khách Tự Hủy Món (BR-05):` Khách CHỈ được tự hủy khi món ở trạng thái PENDING hoặc CONFIRMED. Khi đầu bếp đã chuyển sang PREPARING (đang nấu), hệ thống khóa quyền hủy.
  - `Bếp Từ Chối Món (UC-22):` Đầu bếp chỉ được chuyển CONFIRMED → REJECTED khi hết nguyên liệu và BẮT BUỘC phải nhập lý do từ chối.
  - `Tự Động Bỏ Qua Bếp Cho Đồ Uống (FN-03):` Món có cờ is_drink = 1 tự động bỏ qua hàng đợi bếp, nhảy thẳng sang READY để nhân viên bưng phục vụ ngay.
  - `Quản Lý Hủy Món Ngoại Lệ (UC-29):` Quản lý có quyền hủy món ở bất kỳ bước nào trong trường hợp đặc biệt, kèm ghi nhận bắt buộc vào audit_logs.
- **Cột Phải — Quy Tắc Nghiệp Vụ Cốt Lõi:**
  - `BR-01 & BR-02 (Phiên Ăn Duy Nhất):` Mỗi bàn chỉ có duy nhất MỘT phiên dùng bữa hoạt động tại một thời điểm, nhưng nhiều thực khách có thể cùng tham gia.
  - `BR-08 & BR-16 (Khóa Thanh Toán):` Phiên ăn KHÔNG THỂ thanh toán nếu còn món ở trạng thái trung gian (PENDING, CONFIRMED, PREPARING, READY). Tất cả món phải là SERVED, CANCELLED hoặc REJECTED.
  - `BR-09 & BR-10 (Quy Tắc Tính Bill):` Hóa đơn CHỈ tính tiền những món có trạng thái SERVED. Các món đã hủy hoặc bị từ chối được loại trừ hoàn toàn (0 VNĐ).
  - `BR-11 (Bảo Mật Mã QR):` Hệ thống từ chối truy cập nếu chữ ký số HMAC không khớp hoặc không trỏ tới một phiên ăn đang ACTIVE.
  - `BR-13 & BR-15 (Toàn Vẹn Đặt Bàn):` Bàn đã đặt trước (RESERVED) không được xếp cho khách vãng lai trong khoảng 45 phút trước giờ hẹn. Lịch đặt bắt buộc ở tương lai.

---

### Slide 11: Các Chức Năng Phi Giao Diện & Kiến Trúc Bảo Mật
- **Phân mục:** `3. THIẾT KẾ HỆ THỐNG (RDS)`
- **Tiêu đề:** `Các Chức Năng Phi Giao Diện & Kiến Trúc Bảo Mật`
- **Phụ đề:** `Toàn vẹn mật mã, chống trùng lặp dữ liệu đồng thời, truyền tin thời gian thực và tiến trình tự động`
- **4 Khối Kiến Trúc Kỹ Thuật:**
  1. **FN-01: Xác Thực Mã QR Bằng HMAC-SHA256 (Bảo Mật & Chống Giả Mạo):** Mỗi mã QR tại bàn chứa một chữ ký HMAC-SHA256 tính từ table_id và khóa bí mật server. Backend xác thực chữ ký trên từng request, ngăn chặn triệt để hành vi đổi URL đặt món quậy phá từ xa.
  2. **FN-04: Khóa Idempotency Key & Chống Trùng Đơn (Xử Lý Đồng Thời):** Mỗi request đặt món gửi kèm header Idempotency-Key (UUID v4). Nếu mạng di động chập chờn truyền lại hoặc khách bấm đúp nút 'Gửi', backend sẽ từ chối đơn lặp, đảm bảo không bao giờ bị nhân đôi đơn hàng.
  3. **Đồng Bộ Thời Gian Thực Qua WebSocket / STOMP (Hạ Tầng Thông Báo Đẩy):** Các kênh theo dõi (/topic/table/{id}, /topic/kitchen, /topic/waiter) truyền cập nhật tức thì lên màn hình bếp khi có đơn mới, và báo về điện thoại khách khi món READY hoặc SERVED.
  4. **FN-05 & FN-07: Các Tiến Trình Cron Tự Động Chạy Ngầm:** Cron 5 phút quét lịch đặt bàn; nếu khách trễ >20 phút chưa check-in, bàn tự động nhả về trạng thái AVAILABLE. Cron nửa đêm 00:05 tự động tổng hợp số liệu bán hàng phục vụ báo cáo dashboard tức thì.

---

### Slide 12: Trải Nghiệm Khách Hàng Tại Bàn: Quét QR, Xem Menu & Giỏ Hàng
- **Phân mục:** `4. NGUYÊN MẪU & TƯƠNG TÁC NGƯỜI DÙNG`
- **Tiêu đề:** `Trải Nghiệm Khách Hàng Tại Bàn: Quét QR, Xem Menu & Giỏ Hàng`
- **Phụ đề:** `Ứng dụng Web Responsive di động hoàn chỉnh, không yêu cầu cài đặt thêm app`
- **Ảnh Mockup bên trái:**
  - `image10.png` *(SCR-09: Màn Hình Chào Mừng Khi Quét QR)*
  - `image11.png` *(SCR-10 & SCR-11: Thực Đơn Số & Giỏ Hàng Chung)*
- **Cột Phải — Điểm Nhấn Trải Nghiệm Khách Hàng:**
  - `Trải Nghiệm Không Cần Cài Đặt Ứng Dụng:` Khách chỉ cần mở camera mặc định trên điện thoại để quét mã QR tại bàn. Hệ thống lập tức tải giao diện web tối ưu cho di động mà không cần tải app.
  - `Định Danh Bàn & Tham Gia Phiên Dùng Bữa:` Hiển thị số bàn đã được xác thực, cho phép khách tham gia vào phiên ăn đang có hoặc bắt đầu dùng bữa cùng số lượng thực khách.
  - `Duyệt Thực Đơn Số Đẹp Mắt Theo Phân Loại:` Món ăn được trình bày sinh động kèm hình ảnh chất lượng cao, giá niêm yết, độ cay và nhãn báo hết hàng. Hỗ trợ tìm kiếm và lọc theo danh mục nhanh chóng.
  - `Tùy Biến Món & Ghi Chú Riêng Cho Nhà Bếp:` Khách dễ dàng chọn tùy chọn món và nhập ghi chú nấu nướng cụ thể cho đầu bếp (ví dụ: 'không hành tây', 'ít cay', 'nhiều đá').
  - `Giỏ Hàng Chung Bàn Đồng Bộ Thời Gian Thực:` Nhiều khách cùng ngồi tại một bàn có thể xem chung một giỏ hàng, điều chỉnh số lượng và cùng gửi đợt đặt món một cách mượt mà.

---

### Slide 13: Trải Nghiệm Vận Hành: Màn Hình Bếp KDS & Sơ Đồ Bàn Trực Tiếp
- **Phân mục:** `4. NGUYÊN MẪU & TƯƠNG TÁC NGƯỜI DÙNG`
- **Tiêu đề:** `Trải Nghiệm Vận Hành: Màn Hình Bếp KDS & Sơ Đồ Bàn Trực Tiếp`
- **Phụ đề:** `Giao diện cảm ứng trực quan thời gian thực giúp tối ưu năng suất bếp và điều phối sảnh`
- **Ảnh Mockup phía trên:**
  - Bên trái: `image12.png` *(Màn Hình Cảm Ứng Bếp KDS)*
  - Bên phải: `image13.png` *(Sơ Đồ Bàn Trực Tiếp & Quản Lý Đặt Bàn)*
- **Khối Tính Năng Vận Hành Thời Gian Thực:**
  - `Thẻ đơn hàng KDS:` Hàng đợi ticket thời gian thực kèm đồng hồ đếm thời gian nấu; 1 chạm để chuyển trạng thái (CONFIRMED → PREPARING → READY); cảnh báo đổi màu tự động cho đơn quá 15 phút.
  - `Sơ đồ bàn trực tiếp:` Màu sắc trực quan (Xanh: Trống, Đỏ: Đang có khách, Vàng: Đã đặt trước, Xám: Đang dọn). Phục vụ thao tác 1 chạm để mở bàn, chuyển bàn hoặc check-in khách đặt trước.

---

### Slide 14: Xác Thực Nhân Viên & Phân Quyền Quản Trị
- **Phân mục:** `4. NGUYÊN MẪU & TƯƠNG TÁC NGƯỜI DÙNG`
- **Tiêu đề:** `Xác Thực Nhân Viên & Phân Quyền Quản Trị`
- **Phụ đề:** `Kiểm soát truy cập an toàn, phân quyền theo vai trò và báo cáo phân tích quản trị`
- **Ảnh Mockup bên trái:** `image9.png` *(Đăng Nhập Nhân Viên & Bảng Điều Khiển Theo Vai Trò)*
- **Cột Phải — Cơ Chế Quản Trị Hệ Thống:**
  - `Xác Thực Tài Khoản & Phân Quyền (RBAC):` Nhân viên đăng nhập trực tiếp bằng username/mật khẩu được băm bảo mật BCrypt. Hệ thống xác thực danh tính và kích hoạt quyền truy cập tương ứng với vai trò ca làm việc.
  - `Điều Hướng Giao Diện Động Theo Vai Trò:` Phục vụ tự động chuyển đến Sơ đồ bàn; Bếp chuyển đến màn hình KDS; Thu ngân chuyển đến Thu ngân; Quản lý chuyển đến Cổng quản trị.
  - `Chống Tấn Công Dò Mật Khẩu (Brute-Force):` Giới hạn số lần đăng nhập sai tối đa 5 lần/phút trên mỗi địa chỉ IP, tạm thời khóa và trả về lỗi HTTP 429 Too Many Requests.
  - `Bảng Thống Kê Phân Tích Doanh Thu:` Biểu đồ thời gian thực về doanh thu thuần trong ngày, tỷ lệ lấp đầy bàn, thời gian nấu trung bình của bếp và các món mang lại doanh thu cao nhất.

---

### Slide 15: Yêu Cầu Phi Chức Năng (NFR) & Tiêu Chuẩn Chất Lượng
- **Phân mục:** `5. CHẤT LƯỢNG KỸ THUẬT & CỘT MỐC DỰ ÁN`
- **Tiêu đề:** `Yêu Cầu Phi Chức Năng (NFR) & Tiêu Chuẩn Chất Lượng`
- **Phụ đề:** `Các chỉ số kỹ thuật định lượng đảm bảo hiệu năng và độ an toàn đạt chuẩn doanh nghiệp`
- **4 Khối Chỉ Số Chuẩn Mực:**
  - *Chỉ Số Hiệu Năng (Performance):*
    - Thời gian phản hồi API: < 500 ms cho các API cốt lõi (menu, giỏ hàng, đặt món).
    - Tốc độ xác thực QR: < 300 ms trên luồng quét bàn quan trọng.
    - Đồng bộ đơn lên KDS: < 2 giây qua giao thức STOMP WebSocket.
    - Tải đồng thời mục tiêu: 50 người dùng đồng thời không bị suy giảm hiệu năng.
  - *Tiêu Chuẩn Bảo Mật (Security):*
    - Mã QR mật mã: Chữ ký HMAC-SHA256 kiểm tra trên mọi request vào bàn.
    - Phân quyền RBAC: Kiểm soát chặt chẽ quyền hạn vai trò trên từng API nội bộ.
    - Lưu trữ mật khẩu: Băm muối bằng giải thuật BCrypt với 10 rounds.
    - Kiểm thực đầu vào: Sử dụng annotation Jakarta Validation trên mọi DTO.
  - *Khả Năng Sử Dụng & Giao Diện (Usability):*
    - Giao diện khách hàng Mobile-First: Tối ưu cho màn hình điện thoại từ 360px - 414px.
    - Màn hình KDS dễ đọc: Tối ưu tablet 10-inch, font tối thiểu 16px đọc rõ từ 60 cm.
    - Thông báo lỗi tiếng Việt: Toast thông báo thân thiện, không trả lỗi 500 kỹ thuật.
    - Xác nhận hành động: Hộp thoại xác nhận cho hành động không thể đảo ngược (hủy/chốt bill).
  - *Độ Tin Cậy & Xử Lý Đồng Thời:*
    - Cam kết Idempotency: Header UUID v4 loại trừ hoàn toàn việc tạo trùng đơn.
    - Khóa lạc quan: JPA @Version bảo vệ dữ liệu khi nhiều người sửa trạng thái món.
    - Thời gian hoạt động: Đạt độ sẵn sàng 99% trong giờ mở cửa (09:00 - 22:00).
    - Tiến trình tự động: Cron 5 phút đảm bảo không bỏ sót bàn đặt quá giờ hẹn.

---

### Slide 16: Lộ Trình Sprint & Quản Trị Rủi Ro Chủ Động
- **Phân mục:** `5. CHẤT LƯỢNG KỸ THUẬT & CỘT MỐC DỰ ÁN`
- **Tiêu đề:** `Lộ Trình Sprint & Quản Trị Rủi Ro Chủ Động`
- **Phụ đề:** `Theo dõi tiến độ phát triển bám sát các cột mốc SWP391 và chiến lược giảm thiểu rủi ro`
- **Cột Trái — Tiến Độ Sprint & Sản Phẩm Bàn Giao:**
  - `Sprint 1-2 (Đã Hoàn Thành):` Xác định tầm nhìn, phạm vi, Use Case, sơ đồ phân tích & hoạt động. Sản phẩm bàn giao: Tài liệu SRS v1.0 & Analysis.
  - `Sprint 3 (Cột Mốc Hiện Tại):` Thiết kế ERD (11 bảng), đặc tả API, kiến trúc Spring Boot. Sản phẩm bàn giao: Tài liệu đặc tả kỹ thuật RDS hoàn chỉnh.
  - `Sprint 4 (Trọng Tâm Kế Tiếp):` Luồng gọi món khách hàng (QR → Bàn → Session → Menu → Giỏ hàng → Đặt món). Demo Cột mốc M3.
  - `Sprint 5 (Trọng Tâm Tiếp Theo):` Màn hình cảm ứng bếp KDS & Luồng phục vụ bưng món sảnh. Demo Cột mốc M4.
  - `Sprint 6-7 (Kế Hoạch Tiếp Theo):` Thu ngân xuất hóa đơn (Tiền mặt/VietQR), Đặt bàn trước, Kiểm thử tải đồng thời & Khóa lạc quan. Bàn giao: Báo cáo Test.
  - `Sprint 8 (Giai Đoạn Về Đích):` Triển khai lên máy chủ Cloud, nạp dữ liệu mẫu, viết hướng dẫn sử dụng và tổng duyệt bảo vệ đồ án cuối kỳ.
- **Cột Phải — Chiến Lược Quản Trị Rủi Ro:**
  - `Rủi ro 1: Bùng nổ tính năng ngoài tầm kiểm soát:` Tuân thủ nghiêm ngặt bảng Scope Matrix. Các tính năng ngoài phạm vi (multi-tenant, tích điểm, AI) bị cấm tuyệt đối cho đến khi luồng gọi món - thanh toán ổn định 100%.
  - `Rủi ro 2: Khó chứng minh xử lý đồng thời (Concurrency):` Viết sẵn unit test tự động và log rõ ràng cho 2 kịch bản: Chống đặt trùng đơn (Idempotency Key) và Chống ghi đè trạng thái cùng lúc (Optimistic Locking @Version).
  - `Rủi ro 3: Lỗ hổng bảo mật tại mã QR để bàn:` Xác thực chữ ký số HMAC-SHA256 bảo đảm mọi hành vi cố tình sửa số bàn trên URL quét mã đều bị hệ thống chặn đứng với mã lỗi HTTP 403.

---

### Slide 17: Tổng Kết & Phiên Hỏi Đáp Học Thuật (Q&A)
- **Phân mục:** `TỔNG KẾT & PHẢN HỒI`
- **Tiêu đề chính:** `ROMS: HỆ THỐNG QUẢN LÝ GỌI MÓN NHÀ HÀNG THÔNG MINH`
- **Lời tri ân:** `Xin Chân Thành Cảm Ơn Quý Thầy Cô & Hội Đồng!`
- **Tổng Kết Dự Án & Kết Quả Đạt Được Đến Hiện Tại:**
  - ✔ Hoàn thành bộ đặc tả yêu cầu & thiết kế kỹ thuật (RDS) toàn diện với 31 Use Case chuẩn mực.
  - ✔ Thiết kế mô hình dữ liệu quan hệ 11 bảng vững chắc, lấy mô hình trục trung tâm Dining Session làm hạt nhân.
  - ✔ Hiện thực hóa các cơ chế bảo mật & xử lý đồng thời: Xác thực QR bằng HMAC, khóa Idempotency và Khóa lạc quan.
  - ✔ Lộ trình triển khai Sprint rõ ràng, bám sát từng cột mốc đánh giá của môn học SWP391.
- **Lời mời góp ý:** `Nhóm chúng em rất mong nhận được những câu hỏi chất vấn, ý kiến đóng góp và định hướng từ Quý Thầy Cô!`
