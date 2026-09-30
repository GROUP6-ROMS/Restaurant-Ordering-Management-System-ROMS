# TÀI LIỆU BẢNG QUYẾT ĐỊNH QUY TẮC NGHIỆP VỤ AUTHENTICATION & PHÂN QUYỀN (RBAC)
## DỰ ÁN: ROMS (RESTAURANT ORDERING MANAGEMENT SYSTEM) — MÔN HỌC SWP391
### CĂN CỨ TIÊU CHUẨN THIẾT KẾ: THEO FORM CHUẨN BẢNG QUYẾT ĐỊNH KIỂM THỬ PHẦN MỀM (FPT UNIVERSITY)
**Tài liệu tham chiếu:**
- [README.md](file:///d:/Documents/Ki_5/SWP391/Restaurant-Ordering-Management-System-ROMS-/README.md) (FR-01, NFR-S01..S07, BR-07)
- [RDS Document.docx](file:///d:/Documents/Ki_5/SWP391/Restaurant-Ordering-Management-System-ROMS-/docs/RDS%20Document.docx) (Section 3.1 DB Design, UC-01 Staff Login, UC-03 Change Password, Table 4 Screen Authorization)
- [Exercise_BangQuyetDinh_DE200109.docx](file:///d:/Documents/Ki_5/SWP391/Restaurant-Ordering-Management-System-ROMS-/docs/Exercise_BangQuyetDinh_DE200109.docx) (Form mẫu bảng quyết định chuẩn môn Kiểm thử phần mềm)

---

## MỤC LỤC
1. [BÀI TOÁN 1: Xác Thực Đăng Nhập & Phòng Chống Brute-Force (Staff Login & Lockout)](#bài-toán-1-xác-thực-đăng-nhập--phòng-chống-brute-force)
2. [BÀI TOÁN 2: Xác Thực Token JWT & Bộ Lọc Bảo Mật (JwtAuthenticationFilter)](#bài-toán-2-xác-thực-token-jwt--bộ-lọc-bảo-mật)
3. [BÀI TOÁN 3: Phân Quyền Truy Cập Theo Vai Trò (Role-Based Access Control - RBAC)](#bài-toán-3-phân-quyền-truy-cập-theo-vai-trò)
4. [BÀI TOÁN 4: Đổi Mật Khẩu Tài Khoản Nhân Viên (Change Password - UC-03)](#bài-toán-4-đổi-mật-khẩu-tài-khoản-nhân-viên)
5. [TỔNG HỢP MA TRẬN ÁNH XẠ KIỂM THỬ VỚI SOURCE CODE (TRACEABILITY MATRIX)](#tổng-hợp-ma-trận-ánh-xạ-kiểm-thử-với-source-code)

---

<a name="bài-toán-1-xác-thực-đăng-nhập--phòng-chống-brute-force"></a>
## BÀI TOÁN 1: Xác Thực Đăng Nhập & Phòng Chống Brute-Force (Staff Login & Lockout)

### 1. Mô tả bài toán
Nhân viên nhà hàng (Manager, Waiter, Chef, Cashier) truy cập giao diện đăng nhập (`SCR-01`) và gửi thông tin xác thực lên API `POST /api/v1/auth/login`. Hệ thống tiếp nhận `username` và `password`, tiến hành kiểm tra cú pháp, tra cứu tài khoản trong cơ sở dữ liệu, kiểm tra trạng thái hoạt động, thời gian khóa tài khoản tạm thời do brute-force, đối chiếu mật khẩu băm BCrypt, và thực thi các hành động phản hồi phù hợp.

### 2. Quy tắc nghiệp vụ (Business Rules)
- **BR-L01 (Kiểm tra cú pháp đầu vào):** `username` bắt buộc nhập, độ dài từ 4–30 ký tự, chỉ chứa ký tự chữ, số và `_`, `.`, `-`; `password` bắt buộc nhập, độ dài tối thiểu 6 ký tự. Nếu không thỏa mãn $\rightarrow$ Báo lỗi validation cú pháp (HTTP 400 Bad Request) và dừng xử lý.
- **BR-L02 (Tài khoản tồn tại & Chống User Enumeration):** Nếu `username` không tồn tại trong hệ thống $\rightarrow$ Trả về thông báo lỗi chung *"Tên đăng nhập hoặc mật khẩu không chính xác"* (HTTP 401 Unauthorized), ghi nhận nhật ký `LOGIN_FAILED`.
- **BR-L03 (Khóa tạm thời do Brute-Force):** Nếu tài khoản đang trong thời gian bị khóa (`locked_until > now()`) $\rightarrow$ Từ chối đăng nhập ngay lập tức với mã HTTP 423 Locked, thông báo số phút còn lại mà không kiểm tra mật khẩu.
- **BR-L04 (Tự động mở khóa khi hết hạn):** Nếu thời gian khóa đã qua (`locked_until <= now()`) $\rightarrow$ Hệ thống tự động chuyển `status = ACTIVE`, xóa `locked_until`, đặt lại `failed_attempts = 0` và tiếp tục quy trình xác thực mật khẩu.
- **BR-L05 (Trạng thái hoạt động của tài khoản):** Nếu tài khoản có trạng thái `INACTIVE` (nhân viên đã nghỉ việc) $\rightarrow$ Từ chối đăng nhập với thông báo *"Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản lý"* (HTTP 401 Unauthorized), ghi log `LOGIN_FAILED`.
- **BR-L06 (Đăng nhập thành công):** Mật khẩu khớp với hash BCrypt $\rightarrow$ Đặt lại `failed_attempts = 0`, xóa `locked_until`, ghi log `LOGIN_SUCCESS`, phát hành JWT Bearer Token có thời hạn 8 giờ (28,800 giây theo NFR-S01), trả về HTTP 200 OK kèm hồ sơ nhân viên.
- **BR-L07 (Sai mật khẩu lần 1 đến 4):** Mật khẩu không khớp $\rightarrow$ Tăng biến đếm `failed_attempts += 1`, ghi log `LOGIN_FAILED`, trả về HTTP 401 kèm cảnh báo số lần thử còn lại: `(5 - failed_attempts)`.
- **BR-L08 (Sai mật khẩu lần thứ 5 liên tiếp):** Tăng `failed_attempts = 5` $\rightarrow$ Tự động khóa tài khoản trong 15 phút (`status = LOCKED`, `locked_until = now() + 15 phút`), ghi log an ninh `ACCOUNT_LOCKED`, trả về HTTP 423 Locked.

### 3. Xác định Điều kiện (Conditions) và Hành động (Actions)
#### a. Các điều kiện:
- **C1:** Cú pháp input hợp lệ (`username` 4–30 ký tự, `password` $\ge 6$) `[T / F]`
- **C2:** `username` tồn tại trong Database `[T / F]`
- **C3:** Tài khoản đang bị khóa tạm thời (`locked_until > now()`) `[T / F]`
- **C4:** Khóa tạm thời đã hết hạn (`locked_until <= now()`) `[T / F]`
- **C5:** Trạng thái tài khoản hoạt động (`status == ACTIVE`) `[T / F]`
- **C6:** Mật khẩu khớp với mã băm BCrypt (`passwordEncoder.matches`) `[T / F]`
- **C7:** Số lần đăng nhập sai tích lũy trước đó (`failed_attempts`) `[0..3 / 4 / ≥5]`

#### b. Các hành động tương ứng:
- **A1:** Phản hồi HTTP 200 OK + JWT Token 8h + Hồ sơ nhân viên
- **A2:** Phản hồi HTTP 400 Bad Request (Danh sách lỗi validation chi tiết)
- **A3:** Phản hồi HTTP 401 Unauthorized ("Tên đăng nhập hoặc mật khẩu không chính xác")
- **A4:** Phản hồi HTTP 401 Unauthorized ("Tài khoản đã bị vô hiệu hóa")
- **A5:** Phản hồi HTTP 423 Locked ("Tài khoản đã bị tạm khóa...")
- **A6:** Tự động mở khóa: gán `status=ACTIVE`, xóa `locked_until`, reset đếm = 0
- **A7:** Tăng biến đếm `failed_attempts += 1`
- **A8:** Khóa tài khoản: `status=LOCKED`, gán `locked_until = now() + 15 phút`
- **A9:** Ghi nhật ký audit log (`LOGIN_SUCCESS` / `LOGIN_FAILED` / `ACCOUNT_LOCKED`)

---

### 4. Bảng quyết định đầy đủ (Full Decision Table)

| Conditions | Rule 1 | Rule 2 | Rule 3 | Rule 4 | Rule 5 | Rule 6 | Rule 7 | Rule 8 | Rule 9 | Rule 10 | Rule 11 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **C1: Cú pháp hợp lệ** | F | T | T | T | T | T | T | T | T | T | T |
| **C2: User tồn tại** | - | F | T | T | T | T | T | T | T | T | T |
| **C3: Đang bị khóa** | - | - | T | F | F | F | F | F | F | F | F |
| **C4: Khóa đã hết hạn** | - | - | - | T | T | F | F | F | F | F | F |
| **C5: Status ACTIVE** | - | - | - | - | - | F | T | T | T | T | T |
| **C6: Pass khớp BCrypt** | - | - | - | T | F | - | T | F | F | F | F |
| **C7: failed_attempts** | - | - | - | - | 0 | - | 0–4 | 0 | 1–3 | 4 | $\ge 5$ |
| **Actions** | | | | | | | | | | | |
| **A1: HTTP 200 OK + JWT** | | | | X | | | X | | | | |
| **A2: HTTP 400 Bad Request** | X | | | | | | | | | | |
| **A3: HTTP 401 Sai pass** | | X | | | X | | | X | X | | |
| **A4: HTTP 401 Inactive** | | | | | | X | | | | | |
| **A5: HTTP 423 Locked** | | | X | | | | | | | X | X |
| **A6: Tự động mở khóa** | | | | X | X | | | | | | |
| **A7: failed_attempts += 1** | | | | | X | | | X | X | X | |
| **A8: Khóa 15 phút** | | | | | | | | | | X | |
| **A9: Ghi Audit Log** | | LOGIN_FAILED | | LOGIN_SUCCESS | LOGIN_FAILED | LOGIN_FAILED | LOGIN_SUCCESS | LOGIN_FAILED | LOGIN_FAILED | ACCOUNT_LOCKED | |

---

### 5. Bảng quyết định rút gọn (Reduced Decision Table)
**Nhận xét rút gọn:**
- Khi **C1 = F**, dữ liệu vi phạm cú pháp $\rightarrow$ các điều kiện C2..C7 không cần xét, luôn ra A2.
- Khi **C2 = F**, username không tồn tại $\rightarrow$ các điều kiện C3..C7 không cần xét, luôn ra A3.
- Khi **C3 = T**, tài khoản đang bị khóa $\rightarrow$ không cần kiểm tra mật khẩu C6, luôn ra A5.
- Khi **C5 = F**, tài khoản bị vô hiệu hóa $\rightarrow$ không cần kiểm tra mật khẩu, luôn ra A4.
- Gộp các trường hợp sai mật khẩu lần 1 đến 4 (R8 và R9) thành một Rule chung vì cùng dẫn đến hành vi tăng đếm và cảnh báo lần thử còn lại.

| Conditions | Rule A (Input lỗi) | Rule B (Không tồn tại) | Rule C (Đang khóa) | Rule D (Hết hạn khóa - Pass đúng) | Rule E (Hết hạn khóa - Pass sai) | Rule F (Vô hiệu hóa) | Rule G (Đăng nhập đúng) | Rule H (Sai pass lần 1..4) | Rule I (Sai pass lần 5) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **C1: Cú pháp hợp lệ** | **F** | **T** | **T** | **T** | **T** | **T** | **T** | **T** | **T** |
| **C2: User tồn tại** | **-** | **F** | **T** | **T** | **T** | **T** | **T** | **T** | **T** |
| **C3: Đang bị khóa** | **-** | **-** | **T** | **F** | **F** | **F** | **F** | **F** | **F** |
| **C4: Khóa đã hết hạn** | **-** | **-** | **-** | **T** | **T** | **F** | **F** | **F** | **F** |
| **C5: Status ACTIVE** | **-** | **-** | **-** | **-** | **-** | **F** | **T** | **T** | **T** |
| **C6: Pass khớp BCrypt**| **-** | **-** | **-** | **T** | **F** | **-** | **T** | **F** | **F** |
| **C7: failed_attempts** | **-** | **-** | **-** | **-** | **0** | **-** | **0–4** | **0–3** | **4** |
| **Actions** | | | | | | | | | |
| **Kết quả HTTP** | **400** | **401** | **423** | **200** | **401** | **401** | **200** | **401** | **423** |
| **Hành động xử lý** | Báo lỗi cú pháp | Báo sai credentials | Báo phút khóa | Mở khóa + Cấp JWT | Mở khóa + Đếm=1 | Báo liên hệ quản lý | Cấp JWT 8h + Reset đếm | Tăng đếm + Báo lần còn | Khóa 15m + Báo lỗi 423 |
| **Audit Log Action** | Không | `LOGIN_FAILED` | Không | `LOGIN_SUCCESS` | `LOGIN_FAILED` | `LOGIN_FAILED` | `LOGIN_SUCCESS` | `LOGIN_FAILED` | `ACCOUNT_LOCKED` |
| **Mã Test Case** | **TC-L01, TC-L02** | **TC-L03** | **TC-L04** | **TC-L05** | **TC-L06** | **TC-L07** | **TC-L08** | **TC-L09** | **TC-L10** |

---

### 6. Bảng thiết kế Test Cases chi tiết (Kèm dữ liệu kiểm thử & giá trị biên)

| Mã TC | Rule áp dụng | Username nhập | Password nhập | Trạng thái DB trước khi test | Kết quả mong đợi (Expected Output) | Trạng thái DB sau khi test |
| :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| **TC-L01** | Rule A | `""` (Rỗng) | `""` (Rỗng) | N/A | HTTP 400 Bad Request: Báo lỗi `@NotBlank` cho cả 2 trường | Không đổi |
| **TC-L02** | Rule A | `"adm"` (3 ký tự - biên dưới) | `"12345"` (5 ký tự - biên dưới) | N/A | HTTP 400 Bad Request: Username 4-30 ký tự, Password $\ge 6$ ký tự | Không đổi |
| **TC-L03** | Rule B | `"non_exist_user"` | `"123456"` | Không có trong bảng `users` | HTTP 401 Unauthorized: *"Tên đăng nhập hoặc mật khẩu không chính xác"* | Ghi log `LOGIN_FAILED` |
| **TC-L04** | Rule C | `"waiter"` | `"123456"` | `status = LOCKED`, `locked_until = now() + 10m` | HTTP 423 Locked: *"Tài khoản đã bị tạm khóa... thử lại sau 10 phút"* | Không đổi |
| **TC-L05** | Rule D | `"waiter"` | `"123456"` | `status = LOCKED`, `locked_until = now() - 1m` | HTTP 200 OK + JWT Token + Profile | `status = ACTIVE`, `failed_attempts = 0`, xóa `locked_until` |
| **TC-L06** | Rule E | `"waiter"` | `"wrongpass"` | `status = LOCKED`, `locked_until = now() - 1m` | HTTP 401: Mở khóa nhưng sai pass, báo còn 4 lần thử | `status = ACTIVE`, `failed_attempts = 1` |
| **TC-L07** | Rule F | `"inactive_staff"` | `"123456"` | `status = INACTIVE` | HTTP 401 Unauthorized: *"Tài khoản đã bị vô hiệu hóa"* | Ghi log `LOGIN_FAILED` |
| **TC-L08** | Rule G | `"waiter"` | `"123456"` | `status = ACTIVE`, `failed_attempts = 0` | HTTP 200 OK + `accessToken` thời hạn 28800s + User info | `failed_attempts = 0`, ghi log `LOGIN_SUCCESS` |
| **TC-L09** | Rule H | `"waiter"` | `"wrong123"` | `status = ACTIVE`, `failed_attempts = 0` | HTTP 401 Unauthorized: *"Bạn còn 4 lần thử trước khi bị khóa"* | `failed_attempts = 1`, ghi log `LOGIN_FAILED` |
| **TC-L10** | Rule I | `"waiter"` | `"wrong123"` | `status = ACTIVE`, `failed_attempts = 4` | HTTP 423 Locked: *"Nhập sai 5 lần, tài khoản bị tạm khóa 15 phút"* | `status = LOCKED`, `locked_until = now() + 15m`, log `ACCOUNT_LOCKED` |

---

<a name="bài-toán-2-xác-thực-token-jwt--bộ-lọc-bảo-mật"></a>
## BÀI TOÁN 2: Xác Thực Token JWT & Bộ Lọc Bảo Mật (`JwtAuthenticationFilter`)

### 1. Mô tả bài toán
Mỗi HTTP Request gửi đến hệ thống đều phải đi qua `JwtAuthenticationFilter`. Bộ lọc có nhiệm vụ kiểm tra URL đích, trích xuất chuỗi JWT Bearer token từ header `Authorization`, xác minh chữ ký số HMAC-SHA256, kiểm tra thời hạn sử dụng token (8 giờ cho nhân viên) và tính nguyên vẹn của tài khoản trong database để quyết định nạp quyền vào `SecurityContextHolder`.

### 2. Quy tắc nghiệp vụ (Business Rules)
- **BR-J01 (Public Whitelist):** Nếu endpoint thuộc danh mục công khai (`/api/v1/auth/login`, `/swagger-ui/**`, `/v3/api-docs/**`) $\rightarrow$ Cho phép đi qua trực tiếp mà không cần header Authorization.
- **BR-J02 (Missing/Invalid Authorization Header):** Nếu endpoint yêu cầu bảo vệ nhưng request không có header `Authorization` hoặc không bắt đầu bằng `"Bearer "` $\rightarrow$ Bị chặn tại filter với mã HTTP 401 Unauthorized.
- **BR-J03 (Invalid Digital Signature):** Chữ ký HMAC-SHA256 của token không khớp với khóa bí mật (`jwtSecret`) $\rightarrow$ Bị từ chối với mã HTTP 401 Unauthorized.
- **BR-J04 (Expired Token):** Token có thời gian phát hành quá 8 giờ ($> 28,800,000$ ms) $\rightarrow$ Bị từ chối với mã HTTP 401 Unauthorized.
- **BR-J05 (Malformed Token):** Chuỗi token bị rách, sai định dạng Base64URL hoặc thiếu phần payload $\rightarrow$ Bị từ chối với mã HTTP 401 Unauthorized.
- **BR-J06 (User Status in DB):** Tài khoản được định danh trong token đã bị xóa hoặc chuyển sang `INACTIVE`/`LOCKED` trong DB $\rightarrow$ Bị từ chối với mã HTTP 401 Unauthorized.
- **BR-J07 (Token Valid):** Token thỏa mãn tất cả các điều kiện trên $\rightarrow$ Nạp thông tin nhân viên (`UserPrincipal`) và vai trò (`GrantedAuthority`) vào `SecurityContextHolder`, cho phép tiếp tục luồng xử lý.

### 3. Xác định Điều kiện (Conditions) và Hành động (Actions)
#### a. Các điều kiện:
- **C1:** Endpoint thuộc danh mục công khai (Public URL) `[T / F]`
- **C2:** Request có header `Authorization: Bearer <token>` `[T / F]`
- **C3:** Chữ ký số HMAC-SHA256 hợp lệ `[T / F]`
- **C4:** Token còn hạn sử dụng ($< 8$ giờ) `[T / F]`
- **C5:** Định dạng token nguyên vẹn (Không malformed) `[T / F]`
- **C6:** User trong DB tồn tại và `status = ACTIVE` `[T / F]`

#### b. Các hành động:
- **A1:** Bỏ qua xác thực, chuyển tiếp request trực tiếp
- **A2:** Nạp `UserPrincipal` và quyền hạn vào `SecurityContextHolder`
- **A3:** Chặn request, phản hồi HTTP 401 Unauthorized (kèm thông điệp lỗi JSON)

---

### 4. Bảng quyết định đầy đủ (Full Decision Table)

| Conditions | Rule 1 | Rule 2 | Rule 3 | Rule 4 | Rule 5 | Rule 6 | Rule 7 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **C1: Public URL** | **T** | **F** | **F** | **F** | **F** | **F** | **F** |
| **C2: Có header Bearer** | - | **F** | **T** | **T** | **T** | **T** | **T** |
| **C3: Chữ ký HMAC đúng**| - | - | **F** | **T** | **T** | **T** | **T** |
| **C4: Token còn hạn** | - | - | - | **F** | **T** | **T** | **T** |
| **C5: Không malformed** | - | - | - | - | **F** | **T** | **T** |
| **C6: User trong DB ACTIVE** | - | - | - | - | - | **F** | **T** |
| **Actions** | | | | | | | |
| **A1: Chuyển tiếp trực tiếp** | **X** | | | | | | |
| **A2: Nạp SecurityContext** | | | | | | | **X** |
| **A3: Chặn HTTP 401** | | **X** | **X** | **X** | **X** | **X** | |

---

### 5. Bảng quyết định rút gọn & Test Cases

| Rule rút gọn | Tình huống kiểm thử | Conditions chính | Hành động mong đợi | Mã Test Case |
| :---: | :--- | :--- | :--- | :---: |
| **Rule J-A** | Truy cập endpoint public `/api/v1/auth/login` | C1 = T | Bỏ qua filter, xử lý login bình thường | **TC-J01** |
| **Rule J-B** | Gọi endpoint bảo vệ nhưng không gửi header Authorization | C1 = F, C2 = F | HTTP 401 Unauthorized | **TC-J02** |
| **Rule J-C** | Gửi token bị sai chữ ký (ký bằng secret key khác) | C2 = T, C3 = F | HTTP 401 Unauthorized (Invalid Signature) | **TC-J03** |
| **Rule J-D** | Gửi token đã phát hành quá 8 giờ (hết hạn) | C3 = T, C4 = F | HTTP 401 Unauthorized (Expired Token) | **TC-J04** |
| **Rule J-E** | Gửi chuỗi token giả rách (`"abc.def"`) | C2 = T, C5 = F | HTTP 401 Unauthorized (Malformed Token) | **TC-J05** |
| **Rule J-F** | Token đúng nhưng user trong DB đã chuyển `INACTIVE` | C5 = T, C6 = F | HTTP 401 Unauthorized (User Disabled) | **TC-J06** |
| **Rule J-G** | Token hợp lệ hoàn toàn | C1..C6 = T | HTTP 200 OK + Trả về dữ liệu được bảo vệ | **TC-J07** |

---

<a name="bài-toán-3-phân-quyền-truy-cập-theo-vai-trò"></a>
## BÀI TOÁN 3: Phân Quyền Truy Cập Theo Vai Trò (Role-Based Access Control - RBAC)

### 1. Mô tả bài toán
Sau khi người dùng được xác thực danh tính qua JWT, hệ thống kiểm soát quyền hạn tại từng API thông qua annotation `@PreAuthorize`. Mỗi nhóm vai trò (`ROLE_MANAGER`, `ROLE_WAITER`, `ROLE_CHEF`, `ROLE_CASHIER`, `Anonymous`) chỉ được phép thực thi các tác vụ thuộc phạm vi nghiệp vụ được phân công theo tài liệu **RDS Section 2.3 Table 4 (Screen Authorization)**.

### 2. Quy tắc nghiệp vụ (Business Rules)
- **BR-R01 (Toàn quyền Quản lý):** `ROLE_MANAGER` có quyền truy cập toàn bộ các phân hệ trong hệ thống nhà hàng: Nhân sự, Thực đơn, Bàn, Bếp KDS, Quầy POS, Doanh thu.
- **BR-R02 (Phạm vi Phục vụ - Waiter):** `ROLE_WAITER` được truy cập Sơ đồ bàn (`SCR-05`), Chi tiết gọi món tại bàn (`SCR-06`), Chuyển bàn (`SCR-07`). Bị từ chối (HTTP 403 Forbidden) khi gọi API Bếp KDS, POS Thu ngân, hoặc Quản trị Admin.
- **BR-R03 (Phạm vi Bếp - Chef):** `ROLE_CHEF` được truy cập KDS Bếp (`SCR-15`), Nhận nấu món, Đánh dấu món xong, Từ chối món (`SCR-16`). Bị từ chối (HTTP 403 Forbidden) khi gọi API Sơ đồ bàn, Thu ngân, hoặc Quản trị Admin.
- **BR-R04 (Phạm vi Thu ngân - Cashier):** `ROLE_CASHIER` được truy cập Quầy POS (`SCR-02`), In hóa đơn (`SCR-03`), Chốt két tiền đóng ca (`SCR-04`). Bị từ chối (HTTP 403 Forbidden) khi gọi API Bếp KDS hoặc Quản trị Admin.
- **BR-R05 (Chưa đăng nhập - Anonymous):** Người dùng chưa xác thực bị từ chối với mã HTTP 401 Unauthorized khi truy cập bất kỳ endpoint nghiệp vụ nào.

### 3. Xác định Điều kiện và Hành động
- **C1: Vai trò của người dùng** `[Manager, Waiter, Chef, Cashier, Anonymous]`
- **C2: Phân hệ tài nguyên được gọi** `[Auth/Public, Staff Admin, Table/Floor, Kitchen KDS, Cashier POS, Analytics Dashboard]`
- **Hành động:** `ALLOW (200 OK)` | `DENY 403 (Forbidden)` | `DENY 401 (Unauthorized)`

---

### 4. Bảng quyết định phân quyền RBAC (Extended Entry Decision Table)

| Rule | C1: Vai trò người dùng | C2: Phân hệ tài nguyên gọi đến | Action: Mã HTTP trả về | Action: Quyền truy cập |
| :---: | :--- | :--- | :---: | :---: |
| **R-R01** | Bất kỳ ai / Anonymous | Endpoint Login (`/api/v1/auth/login`) | **200 OK** | **ALLOW** |
| **R-R02** | Anonymous (Chưa đăng nhập) | Bất kỳ endpoint bảo vệ nào | **401 Unauthorized** | **DENY** |
| **R-R03** | `ROLE_MANAGER` | Quản trị nhân sự (`/api/v1/admin/users`) | **200 OK** | **ALLOW** |
| **R-R04** | `ROLE_MANAGER` | Quản trị thực đơn (`/api/v1/menu-items`) | **200 OK** | **ALLOW** |
| **R-R05** | `ROLE_MANAGER` | Sơ đồ bàn (`/api/v1/tables`, `/floor-plan`) | **200 OK** | **ALLOW** |
| **R-R06** | `ROLE_MANAGER` | KDS Bếp (`/api/v1/kitchen/orders`) | **200 OK** | **ALLOW** |
| **R-R07** | `ROLE_MANAGER` | POS Thu ngân (`/api/v1/bills/*`) | **200 OK** | **ALLOW** |
| **R-R08** | `ROLE_MANAGER` | Dashboard báo cáo (`/admin/dashboard/*`) | **200 OK** | **ALLOW** |
| **R-R09** | `ROLE_WAITER` | Sơ đồ bàn & Gọi món (`/waiter/*`, `/tables`) | **200 OK** | **ALLOW** |
| **R-R10** | `ROLE_WAITER` | Quản trị nhân sự (`/admin/users`) | **403 Forbidden** | **DENY** |
| **R-R11** | `ROLE_WAITER` | KDS Bếp (`/kitchen/orders`) | **403 Forbidden** | **DENY** |
| **R-R12** | `ROLE_WAITER` | Quầy POS Thu ngân (`/bills/*`, `/shifts/*`) | **403 Forbidden** | **DENY** |
| **R-R13** | `ROLE_CHEF` | KDS Bếp & Cập nhật món (`/kitchen/*`) | **200 OK** | **ALLOW** |
| **R-R14** | `ROLE_CHEF` | Quản trị nhân sự (`/admin/users`) | **403 Forbidden** | **DENY** |
| **R-R15** | `ROLE_CHEF` | Sơ đồ bàn & Gọi món (`/waiter/*`) | **403 Forbidden** | **DENY** |
| **R-R16** | `ROLE_CHEF` | POS Thu ngân & Két tiền (`/bills/*`) | **403 Forbidden** | **DENY** |
| **R-R17** | `ROLE_CASHIER` | Quầy POS & Két tiền (`/bills/*`, `/shifts/*`) | **200 OK** | **ALLOW** |
| **R-R18** | `ROLE_CASHIER` | Quản trị nhân sự (`/admin/users`) | **403 Forbidden** | **DENY** |
| **R-R19** | `ROLE_CASHIER` | KDS Bếp (`/kitchen/*`) | **403 Forbidden** | **DENY** |
| **R-R20** | `ROLE_CASHIER` | Gọi món tại bàn (`/waiter/tables/{id}/order`)| **403 Forbidden** | **DENY** |

---

<a name="bài-toán-4-đổi-mật-khẩu-tài-khoản-nhân-viên"></a>
## BÀI TOÁN 4: Đổi Mật Khẩu Tài Khoản Nhân Viên (Change Password - UC-03)

### 1. Mô tả bài toán
Nhân viên chủ động đổi mật khẩu hoặc bắt buộc phải đổi mật khẩu trong lần đầu đăng nhập khi cờ `must_change_password = true`. Người dùng gửi thông tin gồm: mật khẩu hiện tại (`currentPassword`), mật khẩu mới (`newPassword`), và xác nhận mật khẩu mới (`confirmPassword`).

### 2. Quy tắc nghiệp vụ (Business Rules)
- **BR-P01 (Xác thực mật khẩu hiện tại):** Mật khẩu hiện tại phải trùng khớp với mật khẩu đang lưu trong cơ sở dữ liệu. Nếu sai $\rightarrow$ Báo lỗi mật khẩu cũ không đúng (HTTP 400).
- **BR-P02 (Độ dài mật khẩu mới):** Mật khẩu mới phải có độ dài tối thiểu 6 ký tự. Nếu $< 6$ ký tự $\rightarrow$ Báo lỗi validation (HTTP 400).
- **BR-P03 (Xác nhận mật khẩu):** `confirmPassword` phải trùng khớp từng ký tự với `newPassword`. Nếu không khớp $\rightarrow$ Báo lỗi xác nhận mật khẩu không trùng khớp (HTTP 400).
- **BR-P04 (Không trùng mật khẩu cũ):** Mật khẩu mới không được trùng với mật khẩu hiện tại. Nếu trùng $\rightarrow$ Báo lỗi mật khẩu mới phải khác mật khẩu cũ (HTTP 400).
- **BR-P05 (Cập nhật thành công):** Khi tất cả điều kiện thỏa mãn $\rightarrow$ Băm mật khẩu mới bằng BCrypt, cập nhật vào DB, gán `must_change_password = false`, ghi log `PASSWORD_CHANGED`, trả về HTTP 200 OK.

### 3. Bảng quyết định rút gọn (Reduced Decision Table)

| Conditions | Rule P1 (Sai pass cũ) | Rule P2 (Pass mới ngắn) | Rule P3 (Không khớp xác nhận) | Rule P4 (Trùng pass cũ) | Rule P5 (Thành công) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **C1: Mật khẩu cũ khớp DB** | **F** | **T** | **T** | **T** | **T** |
| **C2: Mật khẩu mới $\ge 6$ ký tự** | **-** | **F** | **T** | **T** | **T** |
| **C3: confirmPassword == newPassword** | **-** | **-** | **F** | **T** | **T** |
| **C4: newPassword != currentPassword** | **-** | **-** | **-** | **F** | **T** |
| **Actions** | | | | | |
| **HTTP Status Code** | **400 Bad Request** | **400 Bad Request** | **400 Bad Request** | **400 Bad Request** | **200 OK** |
| **Thông báo kết quả** | "Mật khẩu cũ không chính xác" | "Mật khẩu mới tối thiểu 6 ký tự" | "Xác nhận mật khẩu không khớp" | "Mật khẩu mới phải khác mật khẩu cũ" | "Đổi mật khẩu thành công" |
| **Cập nhật Hash BCrypt mới vào DB** | Không | Không | Không | Không | **Có (Update)** |
| **Gán cờ must_change_password = false**| Không | Không | Không | Không | **Có** |
| **Mã Test Case** | **TC-P01** | **TC-P02** | **TC-P03** | **TC-P04** | **TC-P05** |

---

<a name="tổng-hợp-ma-trận-ánh-xạ-kiểm-thử-với-source-code"></a>
## TỔNG HỢP MA TRẬN ÁNH XẠ KIỂM THỬ VỚI SOURCE CODE (TRACEABILITY MATRIX)

Toàn bộ các quy tắc trong 4 Bài toán Bảng quyết định trên được hiện thực hóa và kiểm chứng tự động qua **32 test cases** trong dự án Spring Boot Backend:

| Bài toán | Rule | Tên Test Case trong mã nguồn | File kiểm thử tương ứng | Trạng thái thực thi |
| :---: | :---: | :--- | :--- | :---: |
| **Bài toán 1** | Rule A | `testLogin_Validation_BlankFields()` | `AuthControllerIntegrationTest.java` | ✅ PASSED (100%) |
| **Bài toán 1** | Rule A | `testLogin_Validation_ShortPassword()` | `AuthControllerIntegrationTest.java` | ✅ PASSED (100%) |
| **Bài toán 1** | Rule B | `testLogin_UserNotFound()` | `AuthServiceTest.java` | ✅ PASSED (100%) |
| **Bài toán 1** | Rule C | `testLogin_AccountAlreadyLocked()` | `AuthServiceTest.java` | ✅ PASSED (100%) |
| **Bài toán 1** | Rule D | `testLogin_AccountLockExpired_AutoUnlocks()` | `AuthServiceTest.java` | ✅ PASSED (100%) |
| **Bài toán 1** | Rule E | `testLogin_InvalidPassword_IncrementsFailedAttempts()` | `AuthServiceTest.java` | ✅ PASSED (100%) |
| **Bài toán 1** | Rule F | `testLogin_InactiveAccount()` | `AuthControllerIntegrationTest.java` | ✅ PASSED (100%) |
| **Bài toán 1** | Rule G | `testLogin_Success()` | `AuthControllerIntegrationTest.java` | ✅ PASSED (100%) |
| **Bài toán 1** | Rule H | `testLogin_WrongPassword()` | `AuthControllerIntegrationTest.java` | ✅ PASSED (100%) |
| **Bài toán 1** | Rule I | `testLogin_AccountLockoutOnFifthFailure()` | `AuthServiceTest.java` | ✅ PASSED (100%) |
| **Bài toán 2** | Rule J-A | `testLogin_Success()` (Public route) | `AuthControllerIntegrationTest.java` | ✅ PASSED (100%) |
| **Bài toán 2** | Rule J-B | `testGetMe_WithoutToken()` | `AuthControllerIntegrationTest.java` | ✅ PASSED (100%) |
| **Bài toán 2** | Rule J-C | `testValidateToken_InvalidSignature()` | `JwtTokenProviderTest.java` | ✅ PASSED (100%) |
| **Bài toán 2** | Rule J-D | `testValidateToken_Expired()` | `JwtTokenProviderTest.java` | ✅ PASSED (100%) |
| **Bài toán 2** | Rule J-E | `testValidateToken_Malformed()` | `JwtTokenProviderTest.java` | ✅ PASSED (100%) |
| **Bài toán 2** | Rule J-G | `testGetMe_WithValidJwt()` | `AuthControllerIntegrationTest.java` | ✅ PASSED (100%) |
| **Bài toán 3** | R-R03..R08| `testManager_CanAccessManagerEndpoint()` | `RbacAuthorizationIntegrationTest.java` | ✅ PASSED (100%) |
| **Bài toán 3** | R-R09 | `testWaiter_CanAccessWaiterEndpoint()` | `RbacAuthorizationIntegrationTest.java` | ✅ PASSED (100%) |
| **Bài toán 3** | R-R10 | `testWaiter_CannotAccessManagerEndpoint()` | `RbacAuthorizationIntegrationTest.java` | ✅ PASSED (100%) |
| **Bài toán 3** | R-R13 | `testChef_CanAccessChefEndpoint()` | `RbacAuthorizationIntegrationTest.java` | ✅ PASSED (100%) |
| **Bài toán 3** | R-R16 | `testChef_CannotAccessCashierEndpoint()` | `RbacAuthorizationIntegrationTest.java` | ✅ PASSED (100%) |
| **Bài toán 3** | R-R17 | `testCashier_CanAccessCashierEndpoint()` | `RbacAuthorizationIntegrationTest.java` | ✅ PASSED (100%) |
| **Bài toán 3** | R-R19 | `testCashier_CannotAccessChefEndpoint()` | `RbacAuthorizationIntegrationTest.java` | ✅ PASSED (100%) |
| **Bài toán 3** | R-R02 | `testUnauthenticated_Rejected()` | `RbacAuthorizationIntegrationTest.java` | ✅ PASSED (100%) |

---

## 6. Ý NGHĨA HỌC THUẬT & GIÁ TRỊ THỰC TIỄN CHO ĐỒ ÁN SWP391

1. **Chuẩn hóa phương pháp luận (Formal Testing Methodology):** Việc áp dụng đúng kỹ thuật Decision Table (Bảng quyết định) từ môn Kiểm thử phần mềm giúp tài liệu SRS/RDS của nhóm đạt chuẩn kiểm định chất lượng cao nhất, tránh được lỗi "thiếu test case" hoặc "bỏ sót nhánh ngoại lệ".
2. **Bảo vệ kỹ thuật thuyết phục (Defensible Design):** Khi Hội đồng phản biện SWP391 đặt câu hỏi về an toàn bảo mật (*"Nếu nhập sai 5 lần thì sao?", "Nếu token hết hạn thì backend xử lý thế nào?", "Làm sao đảm bảo bồi bàn không bấm thanh toán hoặc hủy món của bếp?"*), nhóm có thể trình chiếu ngay tài liệu này cùng kết quả chạy xanh của 32 unit/integration tests để chứng minh 100% tính đúng đắn.
