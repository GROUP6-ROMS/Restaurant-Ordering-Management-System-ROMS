# BƯỚC 16: ĐẶT BÀN TRƯỚC VÀ ĐIỀU PHỐI GIỮ CHỖ (FULL-STACK: CUSTOMER & QUẢN LÝ RESERVATION)

> **Mục tiêu:** Xây dựng hoàn chỉnh tính năng **Đặt Bàn Trước Trực Tuyến** cho Khách hàng (`http://localhost:5173/reservation`) và quy trình **Tiếp Nhận Yêu Cầu, Xác Nhận Qua Điện Thoại & Xếp Bàn** dành cho Quản lý nhà hàng (`http://localhost:5173/admin/reservations`) song song ở cả hai phía:
> 1. **Phía Khách Hàng (Customer Reservation Flow):**
>    - **Ngày dùng bữa:** Chọn ngày cụ thể qua Date Picker HTML5 (`<input type="date" min={today} />`), không dùng các nút ngày đại diện cố định.
>    - **Khung giờ:** Cung cấp các khung giờ đại diện phổ biến (`11:30`, `12:00`, `18:00`, `19:00`, `20:00`) kèm nút "Giờ khác" cho phép nhập giờ mong muốn qua ô chọn giờ (`<input type="time" />`).
>    - **Số lượng khách:** Cung cấp các nút số khách đại diện (`2`, `4`, `6`, `8`, `10` khách) kèm nút "Số khác" cho phép nhập số khách cụ thể (`<input type="number" min="1" max="50" />`).
>    - **Khu vực bàn:** Tự động lấy danh sách phân khu động từ CSDL (`GET /api/customer/reservations/zones`), hiển thị tên khu vực, mô tả, huy hiệu và số bàn phục vụ.
>    - **Xác nhận giữ chỗ:** Gửi yêu cầu đặt bàn với trạng thái `PENDING` (chưa gán số bàn) về hệ thống và hiển thị thông báo: Quản lý sẽ liên hệ trực tiếp qua số điện thoại của khách để xác nhận và xếp bàn.
> 2. **Phía Quản Lý (Manager Coordination & Table Assignment):**
>    - **Tích hợp trực tiếp trên Sơ Đồ Bàn & Quản Lý Khu Vực (`/admin/tables`):** Nút "Duyệt & Set Bàn Đặt" kèm huy hiệu (Badge) số lượng đơn `PENDING` màu đỏ thời gian thực; Thanh Alert Banner cảnh báo nổi bật khi có đơn đặt bàn đang chờ; Modal duyệt danh sách đặt bàn (xem số điện thoại khách để gọi điện thoại trao đổi thủ công) và trực tiếp chọn bất kỳ bàn nào còn trống (`AVAILABLE`) trên sơ đồ (kèm dropdown lọc bàn theo phân khu linh hoạt) để gán cho khách. Khi xếp bàn thành công, bàn trên sơ đồ lập tức chuyển sang trạng thái `RESERVED` màu cam kèm tên khách và giờ hẹn.
>    - **Màn hình Quản lý Đặt bàn chuyên sâu (`/admin/reservations`):** Theo dõi danh sách yêu cầu chờ duyệt (`PENDING`), đã xếp bàn (`CONFIRMED`), đã check-in (`COMPLETED`) và đã hủy (`CANCELLED`). Quản lý xem số điện thoại khách trên bảng và tiến hành gọi điện thoại thủ công để xác nhận.
>    - **Tính năng Xác nhận & Xếp bàn:** Sau khi đã gọi điện thoại xác nhận thủ công với khách, Quản lý có thể chọn bất kỳ bàn trống (`AVAILABLE`) nào trong hệ thống (không bị ràng buộc bởi số khách hay khu vực, có dropdown lọc bàn theo khu vực) -> Cập nhật đơn đặt sang `CONFIRMED` và bàn sang `RESERVED` (kèm thông tin khách hẹn).
> 
> **Cam kết:** Toàn bộ mã nguồn Backend (Spring Boot 3.4.5, Java 21, JPA, Lombok) và Frontend (React 19, Vite, Axios) đều có **chú thích (comment) chi tiết 100% từng dòng**.

---

## 1. Tổng Quan Kiến Trúc & Luồng Dữ Liệu (Workflow & Sequence Diagram)

### 1.1. Các nguyên tắc nghiệp vụ cốt lõi (Business Rules)

1. **Khởi tạo yêu cầu đặt bàn (`PENDING`):**
   - Khách hàng đặt bàn trực tuyến không tự ý chỉ định mã bàn cụ thể (như Bàn 01 hay VIP-02) mà chỉ được chọn **Khu vực mong muốn** (`requestedZone`), **Ngày**, **Giờ** và **Số lượng khách**.
   - Khi bấm "Xác Nhận Giữ Chỗ", hệ thống tạo bản ghi `Reservation` với trạng thái `PENDING`, mã đặt chỗ duy nhất (ví dụ: `RES-20261009-8821`), trường `table_id = NULL`.
   - Ngày giờ hẹn (`reservationTime`) phải từ thời điểm hiện tại trở đi (không cho phép chọn thời gian trong quá khứ).

2. **Quy trình Quản lý gọi điện thoại xác nhận thủ công (Manual Phone Confirmation):**
   - Quản lý nhà hàng là người trực tiếp kiểm tra tính xác thực của thông tin đặt chỗ bằng cách xem số điện thoại hiển thị trên màn hình và sử dụng điện thoại thực tế để gọi điện thoại trao đổi, xác nhận trực tiếp với khách hàng (không cần nút gọi trên phần mềm).

3. **Gán bàn & Chuyển trạng thái (`CONFIRMED` & `RESERVED`):**
   - Sau khi trao đổi và chốt thông tin thành công qua điện thoại, Quản lý nhấn **"Xác Nhận & Xếp Bàn"**.
   - Hệ thống hiển thị toàn bộ các bàn đang trống (`TableStatus.AVAILABLE`). Quản lý có toàn quyền lựa chọn bất kỳ bàn nào còn trống trong khung giờ đó mà không bị gò bó bởi số lượng khách hay khu vực yêu cầu ban đầu (có kèm dropdown lọc bàn theo từng phân khu để tìm kiếm nhanh).
   - Khi Quản lý chọn bàn:
     - `Reservation.status` chuyển thành `CONFIRMED`, `Reservation.table` trỏ tới bàn đã chọn.
     - `RestaurantTable.status` chuyển thành `TableStatus.RESERVED`.
     - `RestaurantTable.reservationInfo` được ghi nhận: `"Khách: [Tên khách] ([SĐT])"`.
     - `RestaurantTable.reservedTime` được ghi nhận: `"[Giờ:Phút] ngày [Ngày/Tháng]"`.

4. **Hủy yêu cầu đặt bàn (`CANCELLED`):**
   - Nếu gọi điện không liên lạc được nhiều lần hoặc khách hàng thông báo đổi ý hủy bàn, Quản lý nhấn **"Hủy Đơn"**, nhập lý do hủy (`cancelReason`).
   - Nếu đơn đó đã từng được xếp bàn, hệ thống tự động giải phóng bàn đó về lại trạng thái `AVAILABLE`.

---

### 1.2. Sơ đồ tuần tự tương tác (Sequence Diagram)

```text
[Khách Hàng (Customer)]                 [Backend API]                    [Quản Lý (Manager)]
         │                                    │                                    │
         │─── 1. Xem trang /reservation ─────>│                                    │
         │<── 2. Trả danh sách Zone từ DB ────│                                    │
         │                                    │                                    │
         │─── 3. Điền Form (Ngày, Giờ khác,   │                                    │
         │       Số khách khác, SĐT, Note) ──>│                                    │
         │─── 4. Bấm "Xác Nhận Giữ Chỗ" ─────>│                                    │
         │                                    │── Tạo Reservation (status=PENDING, │
         │                                    │   table=null, mã RES-XXXX)         │
         │<── 5. Thông báo gửi yêu cầu OK, ───│                                    │
         │       chờ Quản lý gọi điện SĐT     │                                    │
         │                                    │                                    │
         │                                    │<── 6. Quản lý mở /admin/reservations
         │                                    │─── 7. Trả danh sách đơn PENDING ──>│
         │                                    │                                    │
         │<══════ 8. QUẢN LÝ GỌI ĐIỆN THOẠI THỦ CÔNG XÁC NHẬN VỚI KHÁCH ══════>│
         │                                    │                                    │
         │                                    │<── 9. Quản lý chọn bàn trống &     │
         │                                    │       bấm "Xác Nhận & Xếp Bàn" ────│
         │                                    │                                    │
         │                                    │── Cập nhật Reservation = CONFIRMED │
         │                                    │── Cập nhật Table = RESERVED        │
         │                                    │─── 10. Báo xếp bàn thành công ────>│
```

---

## 2. Hướng Dẫn Chi Tiết Phía BACKEND (Spring Boot 3.4.5 + Java 21 + Lombok)

---

### Bước B1: Cập Nhật Entity `Reservation.java` Bổ Sung Mã Đặt Chỗ & Khu Vực Yêu Cầu

- **File cần chỉnh sửa:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/entity/Reservation.java`
- **Mục đích:** Bổ sung trường `bookingCode` (mã đặt chỗ định dạng `RES-YYYYMMDD-XXXX`) và trường `requestedZone` (khu vực bàn khách mong muốn khi gửi đơn `PENDING`). Sử dụng Project Lombok để mã nguồn gọn gàng, loại bỏ boilerplate.

```java
package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.ReservationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity đại diện cho bảng phiếu đặt bàn trước (reservations).
 * Áp dụng đầy đủ annotation Lombok để tự động sinh Getter, Setter, Builder và Constructor.
 */
@Entity
@Table(name = "reservations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation {

    // Khóa chính tự tăng của phiếu đặt bàn
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mã đặt chỗ duy nhất hiển thị cho khách và quản lý tra cứu (Ví dụ: "RES-20261009-8821")
    @Column(name = "booking_code", unique = true, length = 50)
    private String bookingCode;

    // Bàn ăn được chỉ định giữ chỗ (để NULL khi khách mới gửi đơn PENDING chờ quản lý xếp bàn)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id")
    private RestaurantTable table;

    // Phân khu khách mong muốn ngồi (lấy từ danh sách Zone trong CSDL: ZONE_1, ZONE_2, VIP...)
    @Column(name = "requested_zone", length = 50)
    private String requestedZone;

    // Họ tên người liên hệ đặt bàn
    @Column(name = "customer_name", nullable = false, columnDefinition = "NVARCHAR(100)")
    private String customerName;

    // Số điện thoại liên hệ xác nhận đặt bàn (Quản lý sẽ bấm gọi số này)
    @Column(name = "customer_phone", nullable = false, length = 15)
    private String customerPhone;

    // Email nhận thông tin xác nhận đặt bàn (tùy chọn)
    @Column(name = "customer_email", length = 100)
    private String customerEmail;

    // Số lượng khách trong đoàn
    @Column(name = "guest_count", nullable = false)
    private Integer guestCount;

    // Thời điểm khách hẹn đến dùng bữa tại nhà hàng
    @Column(name = "reservation_time", nullable = false)
    private LocalDateTime reservationTime;

    // Trạng thái phiếu đặt bàn: PENDING, CONFIRMED, COMPLETED, CANCELLED
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ReservationStatus status = ReservationStatus.PENDING;

    // Ghi chú đặc biệt của khách (Ví dụ: "Ghế em bé", "Tiệc sinh nhật", "Bàn gần cửa sổ"...)
    @Column(name = "note", columnDefinition = "NVARCHAR(255)")
    private String note;

    // Lý do hủy đặt bàn (khi khách hủy hoặc quản lý từ chối)
    @Column(name = "cancel_reason", columnDefinition = "NVARCHAR(255)")
    private String cancelReason;

    // Thời điểm khách gửi đơn đặt bàn lên hệ thống
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm cập nhật trạng thái phiếu đặt gần nhất
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

---

### Bước B2: Tạo Các DTO Request & Response Cho Chức Năng Đặt Bàn

Tạo các file DTO trong thư mục `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/`:

#### 1. DTO Khách Hàng Gửi Yêu Cầu Đặt Bàn `CreateReservationRequest.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/request/CreateReservationRequest.java`

```java
package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO nhận dữ liệu từ Form đặt bàn của Khách hàng
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReservationRequest {

    // Họ tên khách hàng
    @NotBlank(message = "Vui lòng nhập họ và tên của bạn")
    private String customerName;

    // Số điện thoại liên hệ (chuẩn 10 số di động Việt Nam)
    @NotBlank(message = "Vui lòng nhập số điện thoại liên hệ")
    @Pattern(regexp = "^(0[3|5|7|8|9])[0-9]{8}$", message = "Số điện thoại không hợp lệ (cần 10 chữ số)")
    private String customerPhone;

    // Email liên hệ (không bắt buộc)
    private String customerEmail;

    // Số lượng khách trong đoàn (tối thiểu 1 khách)
    @NotNull(message = "Vui lòng chỉ định số lượng khách")
    @Min(value = 1, message = "Số lượng khách tối thiểu là 1 người")
    private Integer guestCount;

    // Ngày dùng bữa (Định dạng YYYY-MM-DD, chọn từ Date Picker)
    @NotBlank(message = "Vui lòng chọn ngày dùng bữa")
    private String reservationDate;

    // Khung giờ dùng bữa (Định dạng HH:mm, ví dụ 19:00 hoặc 18:45)
    @NotBlank(message = "Vui lòng chọn hoặc nhập khung giờ dùng bữa")
    private String reservationTime;

    // Khu vực bàn mong muốn (ZONE_1, ZONE_2, VIP... lấy từ CSDL)
    @NotBlank(message = "Vui lòng chọn khu vực bàn mong muốn")
    private String requestedZone;

    // Ghi chú thêm của khách
    private String note;
}
```

#### 2. DTO Quản Lý Gán Bàn `AssignTableReservationRequest.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/request/AssignTableReservationRequest.java`

```java
package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO Quản lý gửi lên để xếp bàn cụ thể cho đơn đặt bàn
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignTableReservationRequest {

    // ID của bàn ăn được chọn để gán cho khách
    @NotNull(message = "Vui lòng chọn bàn ăn để xếp cho khách")
    private Long tableId;

    // Ghi chú nội bộ của Quản lý khi gọi điện xếp bàn
    private String adminNote;
}
```

#### 3. DTO Hủy Đơn Đặt Bàn `CancelReservationRequest.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/request/CancelReservationRequest.java`

```java
package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO nhận lý do hủy đơn đặt bàn
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelReservationRequest {

    // Lý do hủy (ví dụ: "Khách gọi báo hoãn lịch", "Gọi 3 cuộc không nhấc máy"...)
    @NotBlank(message = "Vui lòng nhập lý do hủy đặt bàn")
    private String cancelReason;
}
```

#### 4. DTO Thông Tin Khu Vực Lấy Từ CSDL `ZoneResponse.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/response/ZoneResponse.java`

```java
package com.romsteam.roms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO trả về danh sách phân khu bàn được tải động từ Database và thông tin quản trị
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZoneResponse {

    private Long id;

    // Mã định danh phân khu lưu trong CSDL (ZONE_1, ZONE_2, VIP)
    private String zoneCode;

    // Tên phân khu
    private String name;

    // Tên phân khu hiển thị đẹp trên giao diện đặt bàn (Ví dụ: "Sảnh Chính - Tầng 1")
    private String zoneName;

    // Mô tả trải nghiệm không gian
    private String description;

    // Thứ tự hiển thị
    private Integer displayOrder;

    // Huy hiệu nổi bật (Ví dụ: "Phổ biến", "View đẹp", "Riêng tư")
    private String badge;

    // Tổng số bàn thuộc khu vực này trong CSDL
    private Long totalTables;
    private Long tableCount;

    // Số bàn hiện đang trống và sẵn sàng phục vụ
    private Long availableTables;

    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

#### 5. DTO Chi Tiết Đơn Đặt Bàn `ReservationResponse.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/response/ReservationResponse.java`

```java
package com.romsteam.roms.dto.response;

import com.romsteam.roms.entity.enums.ReservationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO trả về thông tin chi tiết của một phiếu đặt bàn
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponse {

    // Khóa chính
    private Long id;

    // Mã đặt chỗ hiển thị (Ví dụ: "RES-20261009-8821")
    private String bookingCode;

    // Thông tin bàn ăn đã được xếp (nếu có)
    private Long tableId;
    private String tableNumber;
    private String tableName;
    private Integer tableCapacity;

    // Phân khu khách mong muốn
    private String requestedZone;
    private String requestedZoneName;

    // Thông tin liên hệ của khách hàng
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private Integer guestCount;

    // Ngày và giờ hẹn đến
    private LocalDateTime reservationTime;
    private String formattedDate;
    private String formattedTime;

    // Trạng thái phiếu đặt: PENDING, CONFIRMED, COMPLETED, CANCELLED
    private ReservationStatus status;
    private String statusLabel;

    // Ghi chú của khách & Lý do hủy
    private String note;
    private String cancelReason;

    // Thời gian tạo
    private LocalDateTime createdAt;
}
```

---

### Bước B3: Cập Nhật Repository `ReservationRepository.java` & `RestaurantTableRepository.java`

#### 1. Cập nhật `ReservationRepository.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/repository/ReservationRepository.java`

```java
package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Reservation;
import com.romsteam.roms.entity.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    // Tìm kiếm phiếu đặt chỗ theo mã đặt chỗ
    Optional<Reservation> findByBookingCode(String bookingCode);

    // Kiểm tra xem mã đặt chỗ đã tồn tại chưa (để tránh trùng lặp mã sinh ngẫu nhiên)
    boolean existsByBookingCode(String bookingCode);

    // Tìm kiếm theo số điện thoại khách hàng
    List<Reservation> findByCustomerPhoneOrderByReservationTimeDesc(String customerPhone);

    // Lọc danh sách đặt bàn theo trạng thái (Ví dụ: PENDING để Quản lý duyệt)
    List<Reservation> findByStatusOrderByReservationTimeAsc(ReservationStatus status);

    // Lọc theo khoảng thời gian dùng bữa
    List<Reservation> findByReservationTimeBetweenOrderByReservationTimeAsc(LocalDateTime start, LocalDateTime end);

    // Tìm kiếm theo từ khóa (Mã đặt chỗ, Tên khách hoặc SĐT)
    @Query("SELECT r FROM Reservation r WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:keyword IS NULL OR LOWER(r.customerName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " r.customerPhone LIKE CONCAT('%', :keyword, '%') OR " +
           " LOWER(r.bookingCode) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY r.reservationTime ASC")
    List<Reservation> searchReservations(@Param("status") ReservationStatus status,
                                         @Param("keyword") String keyword);

    // Đếm số lượng đơn đặt bàn theo trạng thái
    long countByStatus(ReservationStatus status);
}
```

#### 2. Bổ sung hàm vào `RestaurantTableRepository.java`
- **File:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/repository/RestaurantTableRepository.java`
- Bổ sung 2 hàm sau vào interface:

```java
    // Lấy danh sách toàn bộ các mã phân khu DISTINCT đang hoạt động trong CSDL
    @Query("SELECT DISTINCT t.zone FROM RestaurantTable t WHERE t.isActive = true ORDER BY t.zone ASC")
    List<String> findDistinctActiveZones();

    // Tìm các bàn trống (AVAILABLE) thuộc khu vực cụ thể và có sức chứa đủ cho số khách yêu cầu
    @Query("SELECT t FROM RestaurantTable t WHERE t.isActive = true AND t.status = 'AVAILABLE' AND " +
           "(:zone IS NULL OR t.zone = :zone) AND t.capacity >= :minCapacity " +
           "ORDER BY t.capacity ASC, t.tableNumber ASC")
    List<RestaurantTable> findAvailableTablesForReservation(@Param("zone") String zone,
                                                            @Param("minCapacity") Integer minCapacity);
```

---

### Bước B4: Tạo Service `ReservationService.java` & `ReservationServiceImpl.java`

#### 1. Interface Service `ReservationService.java`
- **Tạo mới tại:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/ReservationService.java`

```java
package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.AssignTableReservationRequest;
import com.romsteam.roms.dto.request.CancelReservationRequest;
import com.romsteam.roms.dto.request.CreateReservationRequest;
import com.romsteam.roms.dto.response.ReservationResponse;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.dto.response.ZoneResponse;
import com.romsteam.roms.entity.enums.ReservationStatus;

import java.time.LocalDate;
import java.util.List;

public interface ReservationService {

    // 1. Khách hàng gửi yêu cầu đặt chỗ trực tuyến (tạo đơn trạng thái PENDING)
    ReservationResponse createCustomerReservation(CreateReservationRequest request);

    // 2. Lấy danh sách phân khu bàn thực tế từ CSDL để hiển thị lên form đặt bàn
    List<ZoneResponse> getActiveZones();

    // 3. Quản lý xem danh sách đặt bàn (hỗ trợ lọc theo trạng thái, ngày hẹn, từ khóa tìm kiếm)
    List<ReservationResponse> getReservations(ReservationStatus status, LocalDate date, String keyword);

    // 4. Lấy chi tiết một đơn đặt bàn theo ID
    ReservationResponse getReservationById(Long id);

    // 5. Gợi ý danh sách bàn trống khả dụng để Quản lý chọn xếp bàn cho khách
    List<TableResponse> getAvailableTablesForReservation(Long reservationId);

    // 6. Quản lý xác nhận đặt bàn và gán bàn ăn cụ thể cho khách
    ReservationResponse assignTableToReservation(Long reservationId, AssignTableReservationRequest request);

    // 7. Quản lý hủy đơn đặt bàn (hoặc khách gọi hủy)
    ReservationResponse cancelReservation(Long reservationId, CancelReservationRequest request);
}
```

#### 2. Lớp Triển Khai `ReservationServiceImpl.java`
- **Tạo mới tại:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/impl/ReservationServiceImpl.java`

```java
package com.romsteam.roms.service.impl;

import com.romsteam.roms.dto.request.AssignTableReservationRequest;
import com.romsteam.roms.dto.request.CancelReservationRequest;
import com.romsteam.roms.dto.request.CreateReservationRequest;
import com.romsteam.roms.dto.response.ReservationResponse;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.dto.response.ZoneResponse;
import com.romsteam.roms.entity.Reservation;
import com.romsteam.roms.entity.RestaurantTable;
import com.romsteam.roms.entity.enums.ReservationStatus;
import com.romsteam.roms.entity.enums.TableStatus;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.repository.ReservationRepository;
import com.romsteam.roms.repository.RestaurantTableRepository;
import com.romsteam.roms.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final RestaurantTableRepository tableRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    // ===================================================================
    // 1. KHÁCH HÀNG TẠO YÊU CẦU ĐẶT BÀN TRỰC TUYẾN
    // ===================================================================
    @Override
    @Transactional
    public ReservationResponse createCustomerReservation(CreateReservationRequest request) {
        // 1. Parse ngày và giờ đặt bàn
        LocalDate date = LocalDate.parse(request.getReservationDate());
        LocalTime time = LocalTime.parse(request.getReservationTime());
        LocalDateTime reservationDateTime = LocalDateTime.of(date, time);

        // Kiểm tra thời gian đặt bàn không được ở trong quá khứ
        if (reservationDateTime.isBefore(LocalDateTime.now())) {
            throw new AppException("Thời gian đặt bàn không hợp lệ! Vui lòng chọn thời gian từ hiện tại trở đi.");
        }

        // 2. Sinh mã đặt chỗ duy nhất (Ví dụ: RES-20261009-4821)
        String dateStr = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String bookingCode;
        Random random = new Random();
        do {
            int randomNum = 1000 + random.nextInt(9000);
            bookingCode = "RES-" + dateStr + "-" + randomNum;
        } while (reservationRepository.existsByBookingCode(bookingCode));

        // 3. Khởi tạo bản ghi Reservation với trạng thái PENDING (chưa gán bàn)
        Reservation reservation = Reservation.builder()
                .bookingCode(bookingCode)
                .customerName(request.getCustomerName().trim())
                .customerPhone(request.getCustomerPhone().trim())
                .customerEmail(request.getCustomerEmail() != null ? request.getCustomerEmail().trim() : null)
                .guestCount(request.getGuestCount())
                .reservationTime(reservationDateTime)
                .requestedZone(request.getRequestedZone())
                .status(ReservationStatus.PENDING) // Luôn khởi tạo là PENDING chờ Quản lý gọi điện
                .note(request.getNote() != null ? request.getNote().trim() : null)
                .table(null) // Chưa gán bàn lúc khách mới gửi yêu cầu
                .build();

        Reservation saved = reservationRepository.save(reservation);
        return mapToResponse(saved);
    }

    // ===================================================================
    // 2. LẤY DANH SÁCH PHÂN KHU ĐỘNG TỪ DATABASE
    // ===================================================================
    @Override
    @Transactional(readOnly = true)
    public List<ZoneResponse> getActiveZones() {
        // Lấy danh sách các zone có bàn đang hoạt động
        List<String> distinctZones = tableRepository.findDistinctActiveZones();
        if (distinctZones.isEmpty()) {
            distinctZones = Arrays.asList("ZONE_1", "ZONE_2", "VIP");
        }

        List<ZoneResponse> results = new ArrayList<>();
        for (String zoneCode : distinctZones) {
            long total = tableRepository.countByZoneAndIsActiveTrue(zoneCode);
            long available = tableRepository.findByZoneAndStatusAndIsActiveTrue(zoneCode, TableStatus.AVAILABLE).size();

            // Định nghĩa tên hiển thị và mô tả theo từng phân khu
            String zoneName;
            String desc;
            String badge;

            switch (zoneCode) {
                case "ZONE_2":
                    zoneName = "Ban Công & Sân Vườn - Tầng 2";
                    desc = "Tầm nhìn thoáng đãng nhìn ra phố cổ, gió trời tự nhiên lãng mạn cho cặp đôi và nhóm bạn.";
                    badge = "View đẹp";
                    break;
                case "VIP":
                    zoneName = "Phòng Riêng VIP Sang Trọng";
                    desc = "Cách âm tuyệt đối, nội thất hoàng gia, thích hợp tiếp khách đối tác và tiệc gia đình thân mật.";
                    badge = "Riêng tư";
                    break;
                case "ZONE_1":
                default:
                    zoneName = "Sảnh Chính - Tầng 1";
                    desc = "Không gian ấm cúng, thiết kế hiện đại với dàn đèn nghệ thuật và âm nhạc du dương.";
                    badge = "Phổ biến";
                    break;
            }

            results.add(ZoneResponse.builder()
                    .zoneCode(zoneCode)
                    .zoneName(zoneName)
                    .description(desc)
                    .badge(badge)
                    .totalTables(total)
                    .availableTables(available)
                    .build());
        }

        return results;
    }

    // ===================================================================
    // 3. QUẢN LÝ XEM DANH SÁCH ĐẶT BÀN
    // ===================================================================
    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> getReservations(ReservationStatus status, LocalDate date, String keyword) {
        List<Reservation> list;
        if (keyword != null && !keyword.trim().isEmpty()) {
            list = reservationRepository.searchReservations(status, keyword.trim());
        } else if (status != null) {
            list = reservationRepository.findByStatusOrderByReservationTimeAsc(status);
        } else {
            list = reservationRepository.findAll().stream()
                    .sorted(Comparator.comparing(Reservation::getReservationTime))
                    .collect(Collectors.toList());
        }

        // Lọc theo ngày nếu có
        if (date != null) {
            list = list.stream()
                    .filter(r -> r.getReservationTime().toLocalDate().equals(date))
                    .collect(Collectors.toList());
        }

        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ===================================================================
    // 4. LẤY CHI TIẾT ĐƠN ĐẶT BÀN
    // ===================================================================
    @Override
    @Transactional(readOnly = true)
    public ReservationResponse getReservationById(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new AppException("Không tìm thấy thông tin đơn đặt bàn mã #" + id));
        return mapToResponse(reservation);
    }

    // ===================================================================
    // 5. GỢI Ý DANH SÁCH BÀN TRỐNG ĐỂ QUẢN LÝ XẾP BÀN
    // ===================================================================
    @Override
    @Transactional(readOnly = true)
    public List<TableResponse> getAvailableTablesForReservation(Long reservationId) {
        Reservation res = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException("Không tìm thấy đơn đặt bàn #" + reservationId));

        // Lấy toàn bộ các bàn đang trống (AVAILABLE) đang hoạt động trong nhà hàng
        // Quản lý có thể linh hoạt chọn bất kỳ bàn nào còn trống mà không bị ràng buộc sức chứa hay khu vực
        List<RestaurantTable> tables = tableRepository.findByStatusAndIsActiveTrue(TableStatus.AVAILABLE);
        tables.sort(Comparator.comparing(RestaurantTable::getTableNumber));

        return tables.stream().map(t -> {
            String zName = "Sảnh Chính";
            if ("ZONE_2".equals(t.getZone())) zName = "Ban Công";
            else if ("VIP".equals(t.getZone())) zName = "Phòng VIP";

            return TableResponse.builder()
                    .id(t.getId())
                    .code(t.getTableNumber())
                    .tableNumber(t.getTableNumber())
                    .name(t.getName())
                    .zone(t.getZone())
                    .zoneName(zName)
                    .capacity(t.getCapacity())
                    .status(t.getStatus())
                    .isActive(t.getIsActive())
                    .build();
        }).collect(Collectors.toList());
    }

    // ===================================================================
    // 6. QUẢN LÝ XÁC NHẬN & XẾP BÀN
    // ===================================================================
    @Override
    @Transactional
    public ReservationResponse assignTableToReservation(Long reservationId, AssignTableReservationRequest request) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException("Không tìm thấy đơn đặt bàn #" + reservationId));

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new AppException("Đơn đặt bàn này đã bị hủy, không thể xếp bàn!");
        }

        RestaurantTable table = tableRepository.findById(request.getTableId())
                .orElseThrow(() -> new AppException("Không tìm thấy bàn ăn mang ID #" + request.getTableId()));

        if (table.getStatus() != TableStatus.AVAILABLE) {
            throw new AppException("Bàn " + table.getTableNumber() + " hiện không ở trạng thái trống (Đang là " + table.getStatus() + ")!");
        }

        // 1. Cập nhật thông tin phiếu đặt
        reservation.setTable(table);
        reservation.setStatus(ReservationStatus.CONFIRMED);

        // 2. Cập nhật thông tin bàn ăn thành RESERVED
        table.setStatus(TableStatus.RESERVED);
        table.setReservationInfo("Khách: " + reservation.getCustomerName() + " (" + reservation.getCustomerPhone() + ")");
        table.setReservedTime(reservation.getReservationTime().format(TIME_FORMATTER) + " ngày " + reservation.getReservationTime().format(DATE_FORMATTER));

        tableRepository.save(table);
        Reservation updated = reservationRepository.save(reservation);

        return mapToResponse(updated);
    }

    // ===================================================================
    // 7. QUẢN LÝ HỦY ĐƠN ĐẶT BÀN
    // ===================================================================
    @Override
    @Transactional
    public ReservationResponse cancelReservation(Long reservationId, CancelReservationRequest request) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException("Không tìm thấy đơn đặt bàn #" + reservationId));

        // Giải phóng bàn nếu trước đó đã được xếp bàn
        if (reservation.getTable() != null) {
            RestaurantTable table = reservation.getTable();
            if (table.getStatus() == TableStatus.RESERVED) {
                table.setStatus(TableStatus.AVAILABLE);
                table.setReservationInfo(null);
                table.setReservedTime(null);
                tableRepository.save(table);
            }
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelReason(request.getCancelReason());

        Reservation saved = reservationRepository.save(reservation);
        return mapToResponse(saved);
    }

    // ===================================================================
    // HÀM HELPER CHUYỂN ĐỔI ENTITY SANG DTO RESPONSE
    // ===================================================================
    private ReservationResponse mapToResponse(Reservation r) {
        String statusLabel;
        switch (r.getStatus()) {
            case PENDING:
                statusLabel = "Chờ Quản lý gọi điện";
                break;
            case CONFIRMED:
                statusLabel = "Đã xếp bàn & Giữ chỗ";
                break;
            case COMPLETED:
                statusLabel = "Khách đã đến & Check-in";
                break;
            case CANCELLED:
                statusLabel = "Đã hủy đơn";
                break;
            default:
                statusLabel = r.getStatus().name();
        }

        String zoneName;
        if ("ZONE_2".equals(r.getRequestedZone())) {
            zoneName = "Ban Công & Sân Vườn";
        } else if ("VIP".equals(r.getRequestedZone())) {
            zoneName = "Phòng VIP";
        } else {
            zoneName = "Sảnh Chính";
        }

        return ReservationResponse.builder()
                .id(r.getId())
                .bookingCode(r.getBookingCode())
                .tableId(r.getTable() != null ? r.getTable().getId() : null)
                .tableNumber(r.getTable() != null ? r.getTable().getTableNumber() : null)
                .tableName(r.getTable() != null ? r.getTable().getName() : null)
                .tableCapacity(r.getTable() != null ? r.getTable().getCapacity() : null)
                .requestedZone(r.getRequestedZone())
                .requestedZoneName(zoneName)
                .customerName(r.getCustomerName())
                .customerPhone(r.getCustomerPhone())
                .customerEmail(r.getCustomerEmail())
                .guestCount(r.getGuestCount())
                .reservationTime(r.getReservationTime())
                .formattedDate(r.getReservationTime().format(DATE_FORMATTER))
                .formattedTime(r.getReservationTime().format(TIME_FORMATTER))
                .status(r.getStatus())
                .statusLabel(statusLabel)
                .note(r.getNote())
                .cancelReason(r.getCancelReason())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
```

---

### Bước B5: Tạo Controllers `CustomerReservationController.java` & `AdminReservationController.java`

#### 1. Controller Công Khai Cho Khách Hàng `CustomerReservationController.java`
- **Tạo mới tại:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/controller/CustomerReservationController.java`
- Đường dẫn: `/api/customer/reservations/**` (đã được cấu hình `permitAll()` trong `SecurityConfig.java`).

```java
package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.CreateReservationRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.ReservationResponse;
import com.romsteam.roms.dto.response.ZoneResponse;
import com.romsteam.roms.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller công khai dành cho thực khách đặt bàn trước trên trang web ROMS
 */
@RestController
@RequestMapping("/api/customer/reservations")
@RequiredArgsConstructor
public class CustomerReservationController {

    private final ReservationService reservationService;

    /**
     * 1. Lấy danh sách các phân khu bàn ăn động từ CSDL
     * GET /api/customer/reservations/zones
     */
    @GetMapping("/zones")
    public ResponseEntity<ApiResponse<List<ZoneResponse>>> getActiveZones() {
        List<ZoneResponse> zones = reservationService.getActiveZones();
        return ResponseEntity.ok(ApiResponse.success(zones, "Lấy danh sách khu vực bàn thành công"));
    }

    /**
     * 2. Thực khách gửi yêu cầu đặt bàn (trạng thái PENDING)
     * POST /api/customer/reservations
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ReservationResponse>> createReservation(
            @Valid @RequestBody CreateReservationRequest request) {
        ReservationResponse response = reservationService.createCustomerReservation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Yêu cầu đặt bàn của bạn đã được tiếp nhận! Quản lý sẽ gọi điện xác nhận trong ít phút."));
    }
}
```

#### 2. Controller Quản Trị Cho Quản Lý & Thu Ngân `AdminReservationController.java`
- **Tạo mới tại:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/controller/AdminReservationController.java`
- Đường dẫn: `/api/admin/reservations/**` (Bảo mật JWT, chỉ role `MANAGER` hoặc `ADMIN`).

```java
package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.AssignTableReservationRequest;
import com.romsteam.roms.dto.request.CancelReservationRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.ReservationResponse;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.entity.enums.ReservationStatus;
import com.romsteam.roms.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller dành riêng cho Quản lý nhà hàng tiếp nhận và điều phối đặt bàn
 */
@RestController
@RequestMapping("/api/admin/reservations")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
public class AdminReservationController {

    private final ReservationService reservationService;

    /**
     * 1. Lấy danh sách phiếu đặt bàn kèm bộ lọc trạng thái, ngày hẹn và tìm kiếm
     * GET /api/admin/reservations?status=PENDING&date=2026-10-09&keyword=0909
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getReservations(
            @RequestParam(required = false) ReservationStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String keyword) {
        List<ReservationResponse> list = reservationService.getReservations(status, date, keyword);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách phiếu đặt bàn thành công"));
    }

    /**
     * 2. Lấy thông tin chi tiết của 1 phiếu đặt bàn
     * GET /api/admin/reservations/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReservationResponse>> getReservationById(@PathVariable Long id) {
        ReservationResponse res = reservationService.getReservationById(id);
        return ResponseEntity.ok(ApiResponse.success(res, "Lấy chi tiết đơn đặt bàn thành công"));
    }

    /**
     * 3. Gợi ý các bàn ăn trống phù hợp để Quản lý chọn xếp bàn
     * GET /api/admin/reservations/{id}/available-tables
     */
    @GetMapping("/{id}/available-tables")
    public ResponseEntity<ApiResponse<List<TableResponse>>> getAvailableTables(@PathVariable Long id) {
        List<TableResponse> tables = reservationService.getAvailableTablesForReservation(id);
        return ResponseEntity.ok(ApiResponse.success(tables, "Lấy danh sách bàn khả dụng thành công"));
    }

    /**
     * 4. Quản lý xác nhận cuộc gọi và xếp bàn cho khách
     * PUT /api/admin/reservations/{id}/assign-table
     */
    @PutMapping("/{id}/assign-table")
    public ResponseEntity<ApiResponse<ReservationResponse>> assignTable(
            @PathVariable Long id,
            @Valid @RequestBody AssignTableReservationRequest request) {
        ReservationResponse updated = reservationService.assignTableToReservation(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Xếp bàn và xác nhận giữ chỗ thành công cho khách hàng!"));
    }

    /**
     * 5. Quản lý từ chối hoặc hủy đơn đặt bàn
     * PUT /api/admin/reservations/{id}/cancel
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<ReservationResponse>> cancelReservation(
            @PathVariable Long id,
            @Valid @RequestBody CancelReservationRequest request) {
        ReservationResponse cancelled = reservationService.cancelReservation(id, request);
        return ResponseEntity.ok(ApiResponse.success(cancelled, "Đã cập nhật hủy đơn đặt bàn thành công"));
    }
}
```

---

## 3. Hướng Dẫn Chi Tiết Phía FRONTEND (React 19 + Vite + Axios)

---

### Bước F1: Tạo File API Client `reservationApi.js`

- **Tạo mới tại:** `SourceCode/frontend/src/api/reservationApi.js`
- **Mục đích:** Đóng gói toàn bộ các cuộc gọi API liên quan đến đặt bàn ở cả phía khách hàng và phía quản lý.

```javascript
import axiosClient from './axiosClient';

/**
 * Service API cho chức năng Đặt bàn trước (Reservation)
 */
export const reservationApi = {
  // 1. Khách hàng lấy danh sách phân khu bàn động từ Database
  getZones: async () => {
    const res = await axiosClient.get('/customer/reservations/zones');
    return res.data;
  },

  // 2. Khách hàng gửi đơn yêu cầu đặt bàn trực tuyến (PENDING)
  createReservation: async (data) => {
    const res = await axiosClient.post('/customer/reservations', data);
    return res.data;
  },

  // 3. Quản lý lấy danh sách đơn đặt bàn (hỗ trợ lọc status, date, keyword)
  getAdminReservations: async (params) => {
    const res = await axiosClient.get('/admin/reservations', { params });
    return res.data;
  },

  // 4. Quản lý lấy danh sách bàn trống khả dụng để xếp bàn cho đơn cụ thể
  getAvailableTablesForReservation: async (reservationId) => {
    const res = await axiosClient.get(`/admin/reservations/${reservationId}/available-tables`);
    return res.data;
  },

  // 5. Quản lý xác nhận cuộc gọi và gán bàn cho khách
  assignTable: async (reservationId, data) => {
    const res = await axiosClient.put(`/admin/reservations/${reservationId}/assign-table`, data);
    return res.data;
  },

  // 6. Quản lý hủy đơn đặt bàn kèm lý do
  cancelReservation: async (reservationId, data) => {
    const res = await axiosClient.put(`/admin/reservations/${reservationId}/cancel`, data);
    return res.data;
  }
};

export default reservationApi;
```

---

### Bước F2: Nâng Cấp Trang Đặt Bàn Khách Hàng `ReservationPage.jsx`

- **File cần chỉnh sửa:** `SourceCode/frontend/src/pages/public/ReservationPage.jsx`
- **Các nâng cấp quan trọng theo đúng yêu cầu:**
  1. **Ngày dùng bữa:** Bỏ hoàn toàn các nút ngày đại diện (`21/09`, `22/09`...). Thay bằng ô chọn ngày Date Picker chuẩn HTML5 `<input type="date" min={today} ... />` có hiển thị Thứ và Ngày/Tháng định dạng tiếng Việt rõ ràng.
  2. **Khung giờ dùng bữa:** Giữ lại các khung giờ đại diện cao điểm (`11:30`, `12:00`, `18:00`, `19:00`, `20:00`) + nút **"Khung giờ khác..."** mở ra ô nhập giờ `<input type="time" ... />` giúp khách chọn chính xác từng phút mong muốn.
  3. **Số lượng khách:** Giữ các nút đại diện (`2`, `4`, `6`, `8`, `10` khách) + nút **"Số khác..."** mở ra ô nhập số người `<input type="number" min="1" max="50" ... />`.
  4. **Khu vực bàn:** Thay thế mảng mock data bằng `useEffect` gọi `reservationApi.getZones()` lấy danh sách phân khu thực tế từ CSDL.
  5. **Xác nhận giữ chỗ:** Gọi `reservationApi.createReservation()`, hiển thị modal xác nhận kèm mã đặt chỗ và thông điệp: Quản lý sẽ gọi điện xác nhận trong vòng 5-10 phút.

Dưới đây là mã nguồn hoàn chỉnh của `ReservationPage.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import RomsLogo from '../../components/common/RomsLogo';
import { reservationApi } from '../../api/reservationApi';
import { MOCK_CATEGORIES, MOCK_MENU_ITEMS } from '../../mock/mockData';

// Helper component hiển thị icon Material Symbols
function Icon({ name, size = 20, fill = 0, style = {} }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: `${size}px`,
        fontVariationSettings: `'FILL' ${fill}, 'wght' 500, 'GRAD' 0, 'opsz' 24`,
        verticalAlign: 'middle',
        lineHeight: 1,
        ...style
      }}
    >
      {name}
    </span>
  );
}

export default function ReservationPage() {
  // Lấy ngày hôm nay định dạng YYYY-MM-DD làm giá trị tối thiểu cho Date Picker
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Quản lý trạng thái bước đặt chỗ (1 -> 4)
  const [currentStep, setCurrentStep] = useState(1);

  // 2. Ngày dùng bữa: Chọn ngày cụ thể (mặc định hôm nay)
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // 3. Khung giờ: Giờ đại diện + chế độ nhập giờ khác
  const representativeTimes = ['11:30', '12:00', '18:00', '19:00', '20:00'];
  const [selectedTime, setSelectedTime] = useState('19:00');
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState('19:30');

  // 4. Số lượng khách: Số đại diện + chế độ nhập số khác
  const representativeGuests = [2, 4, 6, 8, 10];
  const [selectedGuests, setSelectedGuests] = useState(4);
  const [isCustomGuests, setIsCustomGuests] = useState(false);
  const [customGuestInput, setCustomGuestInput] = useState(5);

  // 5. Khu vực bàn: Nạp động từ Database qua API
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('ZONE_1');
  const [selectedZoneName, setSelectedZoneName] = useState('Sảnh Chính');
  const [isLoadingZones, setIsLoadingZones] = useState(true);

  // 6. Pre-order món ăn trước (tùy chọn)
  const [preOrderItems, setPreOrderItems] = useState([]);
  const [menuCatFilter, setMenuCatFilter] = useState('ALL');
  const [menuSearch, setMenuSearch] = useState('');

  // 7. Thông tin liên hệ của khách hàng
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialNote, setSpecialNote] = useState('');

  // 8. Trạng thái gửi đơn đặt bàn
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingCode, setBookingCode] = useState('');

  // Nạp danh sách khu vực bàn từ database khi component mount
  useEffect(() => {
    const fetchZones = async () => {
      try {
        setIsLoadingZones(true);
        const res = await reservationApi.getZones();
        if (res.data && res.data.length > 0) {
          setZones(res.data);
          setSelectedZone(res.data[0].zoneCode);
          setSelectedZoneName(res.data[0].zoneName);
        }
      } catch (err) {
        console.error('Không thể tải khu vực từ CSDL, sử dụng danh sách mặc định:', err);
        // Fallback an toàn nếu backend chưa sẵn sàng
        const fallbackZones = [
          { zoneCode: 'ZONE_1', zoneName: 'Sảnh Chính - Tầng 1', description: 'Không gian ấm cúng, thiết kế hiện đại', badge: 'Phổ biến', availableTables: 6 },
          { zoneCode: 'ZONE_2', zoneName: 'Ban Công - Tầng 2', description: 'Tầm nhìn thoáng đãng nhìn ra phố cổ', badge: 'View đẹp', availableTables: 4 },
          { zoneCode: 'VIP', zoneName: 'Phòng Riêng VIP', description: 'Cách âm tuyệt đối, thích hợp tiếp khách sang trọng', badge: 'Riêng tư', availableTables: 2 }
        ];
        setZones(fallbackZones);
        setSelectedZone('ZONE_1');
        setSelectedZoneName(fallbackZones[0].zoneName);
      } finally {
        setIsLoadingZones(false);
      }
    };
    fetchZones();
  }, []);

  // Xử lý chọn khung giờ
  const handleSelectPresetTime = (time) => {
    setIsCustomTime(false);
    setSelectedTime(time);
  };

  const handleApplyCustomTime = (e) => {
    const timeVal = e.target.value;
    setCustomTimeInput(timeVal);
    setSelectedTime(timeVal);
  };

  // Xử lý chọn số lượng khách
  const handleSelectPresetGuests = (guests) => {
    setIsCustomGuests(false);
    setSelectedGuests(guests);
  };

  const handleApplyCustomGuests = (e) => {
    const val = parseInt(e.target.value, 10) || 1;
    setCustomGuestInput(val);
    setSelectedGuests(val);
  };

  // Pre-order handlers
  const handleAddDish = (dish) => {
    setPreOrderItems(prev => {
      const existing = prev.find(i => i.id === dish.id);
      if (existing) {
        return prev.map(i => i.id === dish.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...dish, qty: 1, note: '' }];
    });
  };

  const handleUpdateDishQty = (dishId, delta) => {
    setPreOrderItems(prev => {
      return prev.map(i => {
        if (i.id === dishId) {
          const next = i.qty + delta;
          return next > 0 ? { ...i, qty: next } : null;
        }
        return i;
      }).filter(Boolean);
    });
  };

  const handleUpdateDishNote = (dishId, note) => {
    setPreOrderItems(prev => prev.map(i => i.id === dishId ? { ...i, note } : i));
  };

  const preOrderTotal = preOrderItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalDishesCount = preOrderItems.reduce((sum, item) => sum + item.qty, 0);

  // Xử lý điều hướng các bước và gửi đơn
  const handleNextStep = async (e) => {
    if (e) e.preventDefault();
    if (currentStep === 1) {
      if (!selectedDate) {
        alert('Vui lòng chọn ngày dùng bữa!');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Xác thực form thông tin khách
      if (!customerName.trim()) {
        alert('Vui lòng nhập Họ và tên của bạn!');
        return;
      }
      const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
      if (!customerPhone.trim() || !phoneRegex.test(customerPhone.trim())) {
        alert('Vui lòng nhập số điện thoại hợp lệ (10 chữ số, ví dụ: 0901234567)!');
        return;
      }

      try {
        setIsSubmitting(true);

        // Tạo chuỗi ghi chú tổng hợp (kèm danh sách món đặt trước nếu có)
        let fullNote = specialNote.trim();
        if (preOrderItems.length > 0) {
          const preOrderSummary = preOrderItems.map(i => `${i.qty}x ${i.name}`).join(', ');
          fullNote = fullNote ? `${fullNote} | Đặt món trước: ${preOrderSummary}` : `Đặt món trước: ${preOrderSummary}`;
        }

        const payload = {
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || null,
          guestCount: selectedGuests,
          reservationDate: selectedDate,
          reservationTime: selectedTime,
          requestedZone: selectedZone,
          note: fullNote
        };

        // Gửi API xuống Backend
        const res = await reservationApi.createReservation(payload);

        if (res.data) {
          setBookingCode(res.data.bookingCode);
          setIsSuccess(true);
        }
      } catch (err) {
        console.error('Lỗi khi gửi yêu cầu đặt bàn:', err);
        const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu đặt bàn. Vui lòng thử lại!';
        alert(errMsg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const filteredMenuItems = MOCK_MENU_ITEMS.filter(d => {
    if (menuCatFilter !== 'ALL' && d.categoryId !== menuCatFilter) return false;
    if (menuSearch.trim() !== '') {
      return d.name.toLowerCase().includes(menuSearch.toLowerCase());
    }
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F6', color: '#1F1B1A', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Header Navigation Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 248, 246, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #F0E6E4'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          height: '76px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <RomsLogo size={42} showText={true} textSubtitle="Culinary Experience" />
          </Link>

          <Link
            to="/"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#56423D',
              fontWeight: 700,
              fontSize: '0.88rem'
            }}
          >
            <Icon name="arrow_back" size={18} />
            <span>Về Trang Chủ</span>
          </Link>
        </div>
      </header>

      {/* 2. Top Banner & 4-Step Stepper */}
      <section style={{ background: '#FCF1EF', padding: '40px 24px 30px', borderBottom: '1px solid #EAE0DE' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FFDBC9',
            color: '#753400',
            padding: '4px 14px',
            borderRadius: '9999px',
            fontWeight: 700,
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '10px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9D4124' }} />
            Hệ thống đặt bàn & điều phối thông minh
          </div>

          <h1 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '2.4rem', color: '#1F1B1A', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Đặt Bàn & Giữ Chỗ Trực Tuyến Tại <span style={{ color: '#9D4124' }}>ROMS</span>
          </h1>
          <p style={{ fontSize: '1rem', color: '#56423D', margin: 0, maxWidth: '680px' }}>
            Chọn trước ngày giờ, số khách và không gian yêu thích. Quản lý sẽ liên hệ trực tiếp qua số điện thoại để tư vấn và xếp vị trí bàn ưng ý nhất cho quý khách.
          </p>

          {/* Stepper (4 Steps) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginTop: '30px' }}>
            {[
              { step: 1, title: 'Ngày, Giờ & Số Khách' },
              { step: 2, title: 'Khu Vực Bàn Ăn' },
              { step: 3, title: 'Gọi Món Trước (Tùy chọn)' },
              { step: 4, title: 'Xác Nhận Giữ Chỗ' }
            ].map(s => {
              const isActive = currentStep === s.step;
              const isPast = currentStep > s.step;
              return (
                <div
                  key={s.step}
                  onClick={() => isPast && setCurrentStep(s.step)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    background: isActive ? '#FFFFFF' : '#F6ECEA',
                    border: isActive ? '2px solid #9D4124' : '1px solid transparent',
                    boxShadow: isActive ? '0 4px 14px rgba(157, 65, 36, 0.15)' : 'none',
                    cursor: isPast ? 'pointer' : 'default',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isActive || isPast ? '#9D4124' : '#EAE0DE',
                    color: isActive || isPast ? '#FFFFFF' : '#89726B',
                    fontFamily: "'Epilogue', sans-serif",
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {isPast ? <Icon name="check" size={16} /> : s.step}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: isActive ? '#9D4124' : '#89726B', fontWeight: 700, textTransform: 'uppercase' }}>
                      Bước {s.step}
                    </div>
                    <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Main Form & Summary Rail */}
      <section style={{ maxWidth: '1280px', margin: '40px auto 80px', padding: '0 24px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '30px', alignItems: 'flex-start' }}>
          {/* Left Form Flow (8 cols) */}
          <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* ============================================================== */}
            {/* STEP 1: CHỌN NGÀY CỤ THỂ, KHUNG GIỜ & SỐ LƯỢNG KHÁCH             */}
            {/* ============================================================== */}
            {currentStep === 1 && (
              <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '28px', border: '1px solid #F0E6E4', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFDBC9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9D4124' }}>
                    <Icon name="calendar_today" size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                      1. Chọn ngày, giờ & số lượng khách
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#89726B' }}>Lựa chọn chính xác thời điểm bạn muốn ghé thăm nhà hàng ROMS</span>
                  </div>
                </div>

                {/* Date Selection: BỘ CHỌN NGÀY CỤ THỂ (DATE PICKER) */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <Icon name="event" size={18} style={{ color: '#9D4124' }} />
                    Ngày dùng bữa cụ thể: <span style={{ color: '#9D4124' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="date"
                      min={todayStr}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      style={{
                        padding: '13px 18px',
                        borderRadius: '14px',
                        border: '1.5px solid #EAE0DE',
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#1F1B1A',
                        background: '#FFF8F6',
                        outline: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                      }}
                    />
                    <div style={{ fontSize: '0.88rem', color: '#56423D', background: '#FCF1EF', padding: '12px 18px', borderRadius: '14px', border: '1px solid #FFDBC9' }}>
                      Đã chọn: <strong style={{ color: '#9D4124' }}>
                        {new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Time Selection: KHUNG GIỜ ĐẠI DIỆN + NHẬP GIỜ KHÁC */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="schedule" size={18} style={{ color: '#9D4124' }} />
                      Khung giờ dùng bữa: <span style={{ color: '#9D4124' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#89726B' }}>
                      {isCustomTime ? 'Đang nhập giờ tùy chọn' : 'Đang chọn giờ đại diện'}
                    </span>
                  </div>

                  {/* Danh sách nút giờ đại diện */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '12px' }}>
                    {representativeTimes.map(t => {
                      const isSel = !isCustomTime && selectedTime === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleSelectPresetTime(t)}
                          style={{
                            padding: '12px 8px',
                            borderRadius: '12px',
                            border: isSel ? '2px solid #9D4124' : '1px solid #EAE0DE',
                            background: isSel ? '#9D4124' : '#FFF8F6',
                            color: isSel ? '#FFFFFF' : '#1F1B1A',
                            fontFamily: "'Epilogue', sans-serif",
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {t}
                        </button>
                      );
                    })}

                    {/* Nút bật chế độ nhập giờ khác */}
                    <button
                      type="button"
                      onClick={() => setIsCustomTime(true)}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '12px',
                        border: isCustomTime ? '2px solid #9D4124' : '1px dashed #9D4124',
                        background: isCustomTime ? '#FFDBC9' : '#FFFFFF',
                        color: '#9D4124',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Icon name="edit_calendar" size={16} /> Giờ khác
                    </button>
                  </div>

                  {/* Ô nhập giờ tùy ý (nếu chọn Giờ khác) */}
                  {isCustomTime && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFF8F6', padding: '12px 16px', borderRadius: '14px', border: '1px solid #FFDBC9' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#56423D' }}>
                        Nhập giờ mong muốn của bạn:
                      </span>
                      <input
                        type="time"
                        value={customTimeInput}
                        onChange={handleApplyCustomTime}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '10px',
                          border: '1.5px solid #9D4124',
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: '#9D4124',
                          background: '#FFFFFF',
                          outline: 'none'
                        }}
                      />
                      <span style={{ fontSize: '0.78rem', color: '#89726B' }}>
                        (Nhà hàng mở cửa phục vụ từ 10:00 đến 22:30 mỗi ngày)
                      </span>
                    </div>
                  )}
                </div>

                {/* Guest Count: SỐ KHÁCH ĐẠI DIỆN + NHẬP SỐ KHÁCH KHÁC */}
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="groups" size={18} style={{ color: '#9D4124' }} />
                      Số lượng khách: <span style={{ color: '#9D4124' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#89726B' }}>
                      {isCustomGuests ? 'Đang nhập số khách tùy chọn' : 'Đang chọn số khách đại diện'}
                    </span>
                  </div>

                  {/* Danh sách nút số khách đại diện */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '12px' }}>
                    {representativeGuests.map(g => {
                      const isSel = !isCustomGuests && selectedGuests === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => handleSelectPresetGuests(g)}
                          style={{
                            padding: '12px 6px',
                            borderRadius: '12px',
                            border: isSel ? '2px solid #9D4124' : '1px solid #EAE0DE',
                            background: isSel ? '#9D4124' : '#FFF8F6',
                            color: isSel ? '#FFFFFF' : '#1F1B1A',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Icon name="person" size={20} />
                          <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{g} người</span>
                        </button>
                      );
                    })}

                    {/* Nút bật chế độ nhập số khách khác */}
                    <button
                      type="button"
                      onClick={() => setIsCustomGuests(true)}
                      style={{
                        padding: '12px 6px',
                        borderRadius: '12px',
                        border: isCustomGuests ? '2px solid #9D4124' : '1px dashed #9D4124',
                        background: isCustomGuests ? '#FFDBC9' : '#FFFFFF',
                        color: '#9D4124',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Icon name="add" size={20} />
                      <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>Số khác</span>
                    </button>
                  </div>

                  {/* Ô nhập số lượng khách tùy ý (nếu chọn Số khác) */}
                  {isCustomGuests && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFF8F6', padding: '12px 16px', borderRadius: '14px', border: '1px solid #FFDBC9' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#56423D' }}>
                        Nhập số lượng khách chính xác:
                      </span>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={customGuestInput}
                        onChange={handleApplyCustomGuests}
                        style={{
                          width: '80px',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1.5px solid #9D4124',
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: '#9D4124',
                          background: '#FFFFFF',
                          outline: 'none',
                          textAlign: 'center'
                        }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A' }}>khách</span>
                      <span style={{ fontSize: '0.78rem', color: '#89726B' }}>
                        (Đoàn tiệc trên 20 khách vui lòng ghi chú thêm nhu cầu trang trí hoặc set menu)
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  style={{
                    width: '100%',
                    padding: '15px',
                    borderRadius: '16px',
                    background: '#9D4124',
                    color: '#FFF',
                    border: 'none',
                    fontFamily: "'Epilogue', sans-serif",
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 18px rgba(157, 65, 36, 0.3)'
                  }}
                >
                  <span>Tiếp tục chọn khu vực</span>
                  <Icon name="arrow_forward" size={18} />
                </button>
              </div>
            )}

            {/* ============================================================== */}
            {/* STEP 2: CHỌN KHU VỰC BÀN ĂN (LOAD ĐỘNG TỪ CSDL DATABASE)          */}
            {/* ============================================================== */}
            {currentStep === 2 && (
              <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '28px', border: '1px solid #F0E6E4', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFDBC9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9D4124' }}>
                    <Icon name="storefront" size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                      2. Chọn khu vực bàn ngồi (Từ CSDL Nhà Hàng)
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#89726B' }}>Các khu vực bàn ăn thực tế đang mở phục vụ tại nhà hàng ROMS</span>
                  </div>
                </div>

                {isLoadingZones ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#89726B' }}>
                    <Icon name="sync" size={32} style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ margin: '8px 0 0', fontSize: '0.88rem' }}>Đang nạp danh sách khu vực bàn từ CSDL...</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                    {zones.map(z => {
                      const isSel = selectedZone === z.zoneCode;
                      return (
                        <div
                          key={z.zoneCode}
                          onClick={() => {
                            setSelectedZone(z.zoneCode);
                            setSelectedZoneName(z.zoneName);
                          }}
                          style={{
                            padding: '18px 20px',
                            borderRadius: '18px',
                            border: isSel ? '2px solid #9D4124' : '1px solid #EAE0DE',
                            background: isSel ? '#FFF8F6' : '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                            boxShadow: isSel ? '0 4px 14px rgba(157, 65, 36, 0.1)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              border: isSel ? '6px solid #9D4124' : '2px solid #C4B5B0',
                              background: '#FFFFFF',
                              flexShrink: 0
                            }} />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#1F1B1A' }}>
                                  {z.zoneName}
                                </span>
                                {z.badge && (
                                  <span style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: isSel ? '#FFDBC9' : '#F6ECEA',
                                    color: isSel ? '#9D4124' : '#56423D'
                                  }}>
                                    {z.badge}
                                  </span>
                                )}
                              </div>
                              <p style={{ margin: 0, fontSize: '0.8rem', color: '#89726B', lineHeight: 1.4 }}>
                                {z.description}
                              </p>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.78rem', color: '#596232', fontWeight: 700, background: '#EFF5D3', padding: '4px 10px', borderRadius: '8px' }}>
                              {z.availableTables ? `${z.availableTables} bàn trống` : 'Sẵn sàng xếp bàn'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    style={{
                      padding: '14px 24px',
                      borderRadius: '16px',
                      background: '#F0E6E4',
                      color: '#56423D',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer'
                    }}
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '16px',
                      background: '#9D4124',
                      color: '#FFF',
                      border: 'none',
                      fontFamily: "'Epilogue', sans-serif",
                      fontWeight: 800,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 6px 18px rgba(157, 65, 36, 0.3)'
                    }}
                  >
                    <span>Tiếp tục chọn món (Tùy chọn)</span>
                    <Icon name="arrow_forward" size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* STEP 3: PRE-ORDER GỌI MÓN TRƯỚC (TÙY CHỌN)                       */}
            {/* ============================================================== */}
            {currentStep === 3 && (
              <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '28px', border: '1px solid #F0E6E4', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFDBC9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9D4124' }}>
                      <Icon name="restaurant_menu" size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                          3. Đặt trước món ăn (Pre-order)
                        </h2>
                        <span style={{ fontSize: '0.72rem', background: '#FEF3C7', color: '#78350F', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                          Tùy chọn
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#89726B' }}>
                        Bếp sẽ sơ chế và nấu chuẩn bị ngay khi bạn tới bàn, tiết kiệm 15-20 phút chờ đợi
                      </span>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.82rem', color: '#9D4124', fontWeight: 700, background: '#FFF8F6', border: '1px solid #FFDBC9', padding: '6px 12px', borderRadius: '10px' }}>
                    Đã chọn: <b>{totalDishesCount} phần</b> ({preOrderTotal.toLocaleString('vi-VN')}₫)
                  </span>
                </div>

                {/* Filter and Search */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px', background: '#FFF8F6', border: '1px solid #EAE0DE', borderRadius: '12px', padding: '8px 12px' }}>
                    <Icon name="search" size={18} style={{ color: '#89726B' }} />
                    <input
                      type="text"
                      placeholder="Tìm món ngon khai vị, steak, vang..."
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                    <button
                      type="button"
                      onClick={() => setMenuCatFilter('ALL')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '10px',
                        border: 'none',
                        background: menuCatFilter === 'ALL' ? '#9D4124' : '#F6ECEA',
                        color: menuCatFilter === 'ALL' ? '#FFFFFF' : '#56423D',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Tất cả
                    </button>
                    {MOCK_CATEGORIES.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setMenuCatFilter(c.id)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '10px',
                          border: 'none',
                          background: menuCatFilter === c.id ? '#9D4124' : '#F6ECEA',
                          color: menuCatFilter === c.id ? '#FFFFFF' : '#56423D',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dishes Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', maxHeight: '400px', overflowY: 'auto', marginBottom: '22px', paddingRight: '4px' }}>
                  {filteredMenuItems.map(dish => {
                    const selected = preOrderItems.find(i => i.id === dish.id);
                    return (
                      <div
                        key={dish.id}
                        style={{
                          background: selected ? '#FFF8F6' : '#FFFFFF',
                          borderRadius: '16px',
                          border: selected ? '2px solid #9D4124' : '1px solid #F0E6E4',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '10px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <img
                            src={dish.imageUrl}
                            alt={dish.name}
                            style={{ width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
                          />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h4 style={{ margin: 0, fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.9rem', color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {dish.name}
                            </h4>
                            <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#89726B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {dish.description}
                            </p>
                          </div>
                        </div>

                        {selected && (
                          <input
                            type="text"
                            placeholder="Ghi chú (chín vừa, ít sốt...)"
                            value={selected.note || ''}
                            onChange={(e) => handleUpdateDishNote(dish.id, e.target.value)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid #EAE0DE',
                              background: '#FFFFFF',
                              fontSize: '0.72rem',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px dashed #F6ECEA' }}>
                          <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.95rem', color: '#9D4124' }}>
                            {dish.price.toLocaleString('vi-VN')}₫
                          </span>

                          {selected ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleUpdateDishQty(dish.id, -1)}
                                style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #EAE0DE', background: '#F6ECEA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}
                              >
                                -
                              </button>
                              <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{selected.qty}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateDishQty(dish.id, 1)}
                                style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', background: '#9D4124', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddDish(dish)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '8px',
                                border: '1px solid #9D4124',
                                background: '#FFF8F6',
                                color: '#9D4124',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Icon name="add" size={16} /> Chọn Món
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pre-order Navigation */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    style={{
                      padding: '14px 20px',
                      borderRadius: '16px',
                      background: '#F0E6E4',
                      color: '#56423D',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer'
                    }}
                  >
                    Quay lại
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '16px',
                      background: '#FFF8F6',
                      color: '#9D4124',
                      border: '1.5px solid #FFDBC9',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      cursor: 'pointer'
                    }}
                  >
                    Bỏ qua & Gọi món tại bàn
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    style={{
                      flex: 1.5,
                      padding: '14px',
                      borderRadius: '16px',
                      background: '#9D4124',
                      color: '#FFF',
                      border: 'none',
                      fontFamily: "'Epilogue', sans-serif",
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 6px 18px rgba(157, 65, 36, 0.3)'
                    }}
                  >
                    <span>
                      {totalDishesCount > 0 ? `Xác nhận ${totalDishesCount} món & Tiếp tục` : 'Tiếp tục điền thông tin'}
                    </span>
                    <Icon name="arrow_forward" size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* STEP 4: ĐIỀN THÔNG TIN KHÁCH & XÁC NHẬN GIỮ CHỖ (SUBMIT PENDING)  */}
            {/* ============================================================== */}
            {currentStep === 4 && (
              <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '28px', border: '1px solid #F0E6E4', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFDBC9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9D4124' }}>
                    <Icon name="person" size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                      4. Thông tin người đặt bàn & xác nhận
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#89726B' }}>
                      Quản lý nhà hàng sẽ gọi điện tới số này để xác nhận yêu cầu và sắp xếp vị trí bàn
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '6px' }}>
                      Họ và tên của bạn <span style={{ color: '#9D4124' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '13px 16px',
                        borderRadius: '14px',
                        border: '1.5px solid #EAE0DE',
                        fontSize: '0.92rem',
                        color: '#1F1B1A',
                        background: '#FFF8F6',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '6px' }}>
                        Số điện thoại nhận cuộc gọi xác nhận <span style={{ color: '#9D4124' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="090xxxxxxx (10 số)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '13px 16px',
                          borderRadius: '14px',
                          border: '1.5px solid #EAE0DE',
                          fontSize: '0.92rem',
                          color: '#1F1B1A',
                          background: '#FFF8F6',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '6px' }}>
                        Email nhận xác nhận (tùy chọn)
                      </label>
                      <input
                        type="email"
                        placeholder="email@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '13px 16px',
                          borderRadius: '14px',
                          border: '1.5px solid #EAE0DE',
                          fontSize: '0.92rem',
                          color: '#1F1B1A',
                          background: '#FFF8F6',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '6px' }}>
                      Ghi chú đặc biệt cho nhà hàng (Khẩu vị, tiệc sinh nhật, kỷ niệm...):
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ví dụ: Kỷ niệm ngày cưới, chuẩn bị ghế trẻ em, không ăn hành tây..."
                      value={specialNote}
                      onChange={(e) => setSpecialNote(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '14px',
                        border: '1.5px solid #EAE0DE',
                        fontSize: '0.88rem',
                        color: '#1F1B1A',
                        background: '#FFF8F6',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '16px',
                      background: '#F0E6E4',
                      color: '#56423D',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer'
                    }}
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleNextStep}
                    style={{
                      flex: 2,
                      padding: '15px',
                      borderRadius: '16px',
                      background: isSubmitting ? '#C4B5B0' : '#9D4124',
                      color: '#FFF',
                      border: 'none',
                      fontFamily: "'Epilogue', sans-serif",
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 8px 24px rgba(157, 65, 36, 0.35)'
                    }}
                  >
                    {isSubmitting ? (
                      <span>Đang gửi yêu cầu...</span>
                    ) : (
                      <>
                        <Icon name="check_circle" size={22} fill={1} />
                        <span>Xác Nhận Giữ Chỗ Ngay</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Summary Card (4 cols) */}
          <div style={{ gridColumn: 'span 4', position: 'sticky', top: '96px' }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '24px',
              border: '1px solid #F0E6E4',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Icon name="receipt_long" size={22} style={{ color: '#9D4124' }} />
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#1F1B1A', margin: 0 }}>
                  Tóm Tắt Đặt Chỗ
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', paddingBottom: '16px', borderBottom: '1px dashed #EAE0DE' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#89726B' }}>Ngày dùng bữa:</span>
                  <span style={{ fontWeight: 800, color: '#9D4124' }}>
                    {new Date(selectedDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#89726B' }}>Khung giờ hẹn:</span>
                  <span style={{ fontWeight: 800, color: '#9D4124' }}>{selectedTime}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#89726B' }}>Số lượng khách:</span>
                  <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{selectedGuests} khách</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#89726B' }}>Khu vực mong muốn:</span>
                  <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{selectedZoneName}</span>
                </div>
                {customerName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#89726B' }}>Người đặt:</span>
                    <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{customerName}</span>
                  </div>
                )}
              </div>

              {/* Pre-order breakdown in summary rail */}
              {preOrderItems.length > 0 && (
                <div style={{ padding: '14px 0', borderBottom: '1px dashed #EAE0DE' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1F1B1A' }}>
                      Món Đặt Trước ({totalDishesCount}):
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#9D4124' }}>
                      {preOrderTotal.toLocaleString('vi-VN')}₫
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                    {preOrderItems.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#56423D' }}>
                        <span>{item.qty}x {item.name}</span>
                        <span style={{ fontWeight: 600 }}>{(item.price * item.qty).toLocaleString('vi-VN')}₫</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Policy note */}
              <div style={{ background: '#FFF8F6', padding: '12px 14px', borderRadius: '14px', marginTop: '16px', border: '1px solid #F6ECEA' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#596232', fontWeight: 700, fontSize: '0.78rem', marginBottom: '4px' }}>
                  <Icon name="phone_in_talk" size={16} /> Quy trình xác nhận ROMS
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#56423D', lineHeight: 1.45 }}>
                  Sau khi bạn nhấn xác nhận, yêu cầu sẽ được chuyển đến <strong>Quản lý ca trực</strong>. Quản lý sẽ gọi điện đến SĐT của bạn trong ít phút để kiểm tra vị trí bàn trống và xếp bàn tốt nhất.
                </p>
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.78rem', color: '#89726B' }}>
                Hotline hỗ trợ trực tiếp: <strong style={{ color: '#9D4124' }}>1900 8924</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. MODAL THÔNG BÁO XÁC NHẬN GIỮ CHỖ THÀNH CÔNG (CHỜ QUẢN LÝ GỌI ĐIỆN) */}
      {/* ==================================================================== */}
      {isSuccess && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(31, 27, 26, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '540px',
            borderRadius: '28px',
            padding: '36px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#DDE8AB',
              color: '#596232',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Icon name="phone_callback" size={40} fill={1} />
            </div>

            <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#1F1B1A', margin: '0 0 8px' }}>
              Yêu Cầu Đã Gửi Tới Quản Lý!
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#56423D', margin: '0 0 20px', lineHeight: 1.5 }}>
              Cảm ơn quý khách <strong>{customerName}</strong>. Nhà hàng đã ghi nhận yêu cầu giữ chỗ của quý khách.
            </p>

            {/* Hộp thông báo quản lý gọi điện */}
            <div style={{
              background: '#FFF8F6',
              padding: '16px',
              borderRadius: '16px',
              border: '1.5px solid #FFDBC9',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left'
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FFDBC9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9D4124', flexShrink: 0 }}>
                <Icon name="phone_in_talk" size={22} />
              </div>
              <div style={{ fontSize: '0.82rem', color: '#56423D' }}>
                Quản lý nhà hàng sẽ gọi điện thoại tới số <strong style={{ color: '#9D4124', fontSize: '0.95rem' }}>{customerPhone}</strong> trong vòng <strong>5-10 phút</strong> để xác nhận và sắp xếp vị trí bàn ưng ý nhất cho bạn!
              </div>
            </div>

            {/* Chi tiết phiếu đặt chỗ */}
            <div style={{ background: '#FAF5F4', padding: '16px 18px', borderRadius: '18px', border: '1px dashed #C4B5B0', marginBottom: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#89726B' }}>Mã đặt chỗ tra cứu:</span>
                <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, color: '#9D4124', fontSize: '1.1rem' }}>{bookingCode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#89726B' }}>Thời gian hẹn:</span>
                <span style={{ fontWeight: 700 }}>
                  {selectedTime} • {new Date(selectedDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#89726B' }}>Số khách & Khu vực:</span>
                <span style={{ fontWeight: 700 }}>{selectedGuests} khách • {selectedZoneName}</span>
              </div>

              {preOrderItems.length > 0 && (
                <div style={{ borderTop: '1px dashed #EAE0DE', paddingTop: '8px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#89726B' }}>Món đặt trước ({totalDishesCount} phần):</span>
                    <span style={{ fontWeight: 800, color: '#9D4124' }}>{preOrderTotal.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#56423D', fontStyle: 'italic' }}>
                    {preOrderItems.map(i => `${i.qty}x ${i.name}`).join(', ')}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Link
                to="/"
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '16px',
                  background: '#F0E6E4',
                  color: '#56423D',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  display: 'inline-block'
                }}
              >
                Về Trang Chủ
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  setCurrentStep(1);
                  setPreOrderItems([]);
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '16px',
                  background: '#9D4124',
                  color: '#FFFFFF',
                  border: 'none',
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(157, 65, 36, 0.3)'
                }}
              >
                Đặt Thêm Bàn Khác
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Bước F3: Tích Hợp Chức Năng Duyệt & Set Bàn Đặt Trực Tiếp Vào Trang Sơ Đồ Bàn & Quản Lý Khu Vực (`TableManagementPage.jsx`)

- **File cập nhật:** `SourceCode/frontend/src/pages/admin/TableManagementPage.jsx`
- **Mục đích:** Giúp Quản lý nhà hàng tối ưu hóa luồng làm việc thực tế: theo dõi tức thì các yêu cầu đặt bàn trực tuyến mới gửi từ website ngay trên sơ đồ bàn, gọi điện thoại xác nhận trực tiếp cho khách qua số điện thoại hiển thị trên màn hình, và trực quan chọn bàn ăn trống (`AVAILABLE`) phù hợp trên sơ đồ để gán cho khách mà không cần phải chuyển sang màn hình khác.
- **Các thành phần được triển khai:**
  1. **Tích hợp API và Polling đồng bộ:**
     - Gọi `reservationApi.getAdminReservations()` trong `loadData()` và vòng lặp tự động cập nhật mỗi 6 giây (`useEffect`), tự động đếm số đơn có trạng thái `PENDING` để cập nhật huy hiệu cảnh báo.
  2. **Nút Thao Tác Header & Huy Hiệu (Badge) Đơn Chờ:**
     - Nút **"Duyệt & Set Bàn Đặt"** trên thanh Quick Actions Header với icon `event_seat`.
     - Badge màu đỏ hiển thị chính xác số lượng đơn `PENDING` đang chờ xếp bàn.
  3. **Thanh Cảnh Báo Nổi Bật (Real-time Alert Banner):**
     - Tự động xuất hiện ngay dưới Header khi có đơn `PENDING` (`pendingReservationsCount > 0`).
     - Thông báo trực quan: *"Có X yêu cầu đặt bàn trực tuyến mới cần được gọi xác nhận & xếp bàn!"* kèm nút *"Xem Danh Sách & Xếp Bàn Ngay"*.
  4. **Modal 1: Phiếu Đặt Bàn & Điều Phối Xếp Bàn (`showReservationModal`):**
     - Tab lọc: "Chờ Xếp Bàn" (`PENDING`), "Đã Xếp Bàn" (`CONFIRMED`), "Đã Hủy" (`CANCELLED`), "Tất Cả".
     - Thanh tìm kiếm theo Tên khách, Số điện thoại hoặc Mã đặt chỗ (`bookingCode`).
     - Thẻ thông tin từng phiếu đặt: Mã đặt chỗ, Thời gian tạo, Badge trạng thái, Tên khách hàng, Số điện thoại (hiển thị rõ nét kèm icon để quản lý/nhân viên chủ động gọi điện xác nhận ngoài thực tế), Giờ hẹn, Ngày hẹn, Số lượng khách, Khu vực mong muốn, Ghi chú của khách.
     - Với đơn `CONFIRMED`: Thẻ xanh lá hiển thị thông tin bàn đã xếp (Mã bàn, Tên bàn, Sức chứa) kèm nút "Đổi Bàn".
     - Với đơn `CANCELLED`: Thẻ đỏ hiển thị lý do hủy.
     - Với đơn `PENDING`: Nút "Từ Chối / Hủy", nút "Set Bàn / Xếp Bàn Cho Khách" (`#9D4124`) (đã bỏ nút gọi trên giao diện web do nhân viên liên hệ khách bằng điện thoại thực tế).
  5. **Modal 2: Gợi Ý & Chọn Bàn Khả Dụng Để Gán (`showAssignModal`):**
     - Gọi API `GET /api/admin/reservations/{id}/available-tables` để tải toàn bộ các bàn đang ở trạng thái trống (`AVAILABLE`) trong nhà hàng. Quản lý có thể chọn bất kỳ bàn trống nào mà không bắt buộc phải đúng số lượng khách hay khu vực ban đầu.
     - **Dropdown lọc bàn theo khu vực (`assignZoneFilter`):** Cho phép xem "Tất Cả Khu Vực" hoặc lọc theo từng khu vực cụ thể (Sảnh Chính, Ban Công, VIP, Sân Vườn...) kèm số lượng bàn trống của khu vực đó.
     - Lưới chọn bàn trực quan (Mã bàn, Tên bàn, Sức chứa, Khu vực) dạng card có viền cam nổi bật khi được chọn, kèm huy hiệu nhận diện gợi ý (`✓ Đúng khu vực yêu cầu`, `✓ Sức chứa phù hợp`) để quản lý tham khảo.
     - Ô nhập ghi chú nội bộ của Quản lý (`assignAdminNote`).
     - Khi bấm "Xác Nhận Xếp Bàn & Giữ Chỗ", gọi API `PUT /api/admin/reservations/{id}/assign-table`:
       - Đơn đặt bàn chuyển sang `CONFIRMED`.
       - Bàn ăn trên sơ đồ chuyển ngay sang màu cam `RESERVED` với thông tin khách và thời gian hẹn.
       - Cập nhật lại số liệu 5 thẻ KPI và sơ đồ bàn thời gian thực.
  6. **Modal 3: Xác Nhận Hủy Đơn Đặt Bàn (`showCancelResModal`):**
     - Cho phép chọn lý do nhanh hoặc nhập lý do hủy cụ thể.
     - Gọi API `PUT /api/admin/reservations/{id}/cancel` để cập nhật trạng thái `CANCELLED` và tự động giải phóng bàn nếu trước đó đã được gán.

#### Chi tiết các đoạn mã bổ sung vào `TableManagementPage.jsx`:

```jsx
// 1. Import Service API Đặt Bàn
import { reservationApi } from '../../api/reservationApi';

// 2. Khai báo State Quản Lý & Set Bàn Cho Đơn Đặt Bàn
const [reservations, setReservations] = useState([]);
const [pendingReservationsCount, setPendingReservationsCount] = useState(0);
const [showReservationModal, setShowReservationModal] = useState(false);
const [resStatusFilter, setResStatusFilter] = useState('PENDING'); // 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'ALL'
const [resSearchTerm, setResSearchTerm] = useState('');
const [resLoading, setResLoading] = useState(false);

// State Modal Xếp Bàn (Set Bàn)
const [showAssignModal, setShowAssignModal] = useState(false);
const [selectedResForAssign, setSelectedResForAssign] = useState(null);
const [availableTablesForAssign, setAvailableTablesForAssign] = useState([]);
const [selectedAssignTableId, setSelectedAssignTableId] = useState('');
const [assignAdminNote, setAssignAdminNote] = useState('');
const [assignZoneFilter, setAssignZoneFilter] = useState('ALL'); // Dropdown lọc bàn theo khu vực ('ALL' | tên zone)
const [assignLoading, setAssignLoading] = useState(false);

// State Modal Hủy Đơn Đặt Bàn
const [showCancelResModal, setShowCancelResModal] = useState(false);
const [selectedResForCancel, setSelectedResForCancel] = useState(null);
const [cancelResReason, setCancelResReason] = useState('Khách hàng yêu cầu hủy / Không liên lạc được');
const [cancelResLoading, setCancelResLoading] = useState(false);

// 3. Hàm Tải Dữ Liệu & Đồng Bộ Đơn Đặt Bàn (Được gọi trong loadData & polling 6s)
const loadReservations = async () => {
  try {
    setResLoading(true);
    const res = await reservationApi.getAdminReservations();
    const list = res.data || [];
    setReservations(list);
    const pendingCount = list.filter(r => r.status === 'PENDING').length;
    setPendingReservationsCount(pendingCount);
  } catch (err) {
    console.warn('Lỗi tải danh sách đặt bàn:', err);
  } finally {
    setResLoading(false);
  }
};

// 4. Mở Modal Xếp Bàn & Gợi Ý Bàn Trống Khả Dụng
const handleOpenAssignModal = async (resItem) => {
  setSelectedResForAssign(resItem);
  setSelectedAssignTableId('');
  setAssignAdminNote('');
  setAssignZoneFilter('ALL');
  setShowAssignModal(true);
  setAssignLoading(true);
  try {
    const res = await reservationApi.getAvailableTablesForReservation(resItem.id);
    const availableList = res.data || [];
    setAvailableTablesForAssign(availableList);
    if (availableList.length > 0) {
      // Ưu tiên gợi ý chọn bàn cùng khu vực khách yêu cầu nếu có, hoặc bàn đầu tiên
      const matched = availableList.find(t => t.zone === resItem.requestedZone);
      setSelectedAssignTableId(matched ? String(matched.id) : String(availableList[0].id));
    }
  } catch (err) {
    console.error('Lỗi lấy danh sách bàn khả dụng:', err);
    showToast('Không thể lấy danh sách bàn trống khả dụng!');
  } finally {
    setAssignLoading(false);
  }
};

// 5. Xác Nhận Xếp Bàn Cho Đơn Đặt Bàn (Gán bàn & Chuyển trạng thái bàn sang RESERVED)
const handleConfirmAssignTable = async () => {
  if (!selectedResForAssign || !selectedAssignTableId) {
    showToast('Vui lòng chọn một bàn ăn trống để xếp cho khách!');
    return;
  }
  try {
    setAssignLoading(true);
    const payload = {
      tableId: Number(selectedAssignTableId),
      adminNote: assignAdminNote.trim() || undefined
    };
    const res = await reservationApi.assignTable(selectedResForAssign.id, payload);
    if (res.success || res.data) {
      showToast(`Đã xếp bàn thành công cho khách hàng ${selectedResForAssign.customerName}!`);
      setShowAssignModal(false);
      setSelectedResForAssign(null);
      await loadReservations();
      await loadData(true);
    }
  } catch (err) {
    console.error('Lỗi xếp bàn:', err);
    const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi xếp bàn!';
    showToast(errMsg);
  } finally {
    setAssignLoading(false);
  }
};

// 6. Xử Lý Hủy Đơn Đặt Bàn
const handleConfirmCancelRes = async () => {
  if (!selectedResForCancel) return;
  try {
    setCancelResLoading(true);
    const res = await reservationApi.cancelReservation(selectedResForCancel.id, {
      cancelReason: cancelResReason.trim() || 'Quản lý hủy yêu cầu'
    });
    if (res.success || res.data) {
      showToast(`Đã hủy phiếu đặt bàn của ${selectedResForCancel.customerName}!`);
      setShowCancelResModal(false);
      setSelectedResForCancel(null);
      await loadReservations();
      await loadData(true);
    }
  } catch (err) {
    console.error('Lỗi hủy phiếu đặt bàn:', err);
    const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn đặt bàn!';
    showToast(errMsg);
  } finally {
    setCancelResLoading(false);
  }
};
```

---

### Bước F3.1: Màn Hình Quản Lý Đặt Bàn Chuyên Sâu `ReservationsPage.jsx`

- **Tạo mới tại:** `SourceCode/frontend/src/pages/admin/ReservationsPage.jsx`
- **Mục đích:** Cung cấp giao diện làm việc dạng bảng chuyên sâu cho Quản lý nhà hàng:
  - Xem danh sách yêu cầu đặt bàn dạng bảng với các tab phân loại: `TẤT CẢ`, `CHỜ XÁC NHẬN (PENDING)`, `ĐÃ XẾP BÀN (CONFIRMED)`, `ĐÃ HỦY (CANCELLED)`.
  - Hiển thị rõ số điện thoại và thông tin để Quản lý gọi điện thoại thủ công xác nhận với khách trước khi xếp bàn.
  - **Nút "Xếp Bàn":** Bật modal chọn bất kỳ bàn trống khả dụng (`AVAILABLE`) với dropdown lọc theo khu vực -> Gán bàn và chuyển trạng thái sang `CONFIRMED`.
  - **Nút "Hủy Yêu Cầu":** Nhập lý do (ví dụ không nghe máy, khách đổi ý) và cập nhật `CANCELLED`.

```jsx
import React, { useState, useEffect } from 'react';
import Icon from '../../components/common/Icon';
import { reservationApi } from '../../api/reservationApi';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING'); // Mặc định hiển thị đơn cần duyệt
  const [dateFilter, setDateFilter] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Modal Xếp bàn
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRes, setSelectedRes] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Modal Hủy đơn
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelResId, setCancelResId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Hàm tải dữ liệu danh sách đơn đặt bàn
  const fetchReservations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      if (searchKeyword.trim()) params.keyword = searchKeyword.trim();

      const res = await reservationApi.getAdminReservations(params);
      if (res.data) {
        setReservations(res.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách đặt bàn:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [statusFilter, dateFilter]);

  // Mở modal xếp bàn
  const handleOpenAssignModal = async (resItem) => {
    setSelectedRes(resItem);
    setSelectedTableId('');
    setAssignModalOpen(true);
    try {
      const res = await reservationApi.getAvailableTablesForReservation(resItem.id);
      if (res.data) {
        setAvailableTables(res.data);
        if (res.data.length > 0) {
          setSelectedTableId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách bàn khả dụng:', err);
      alert('Không thể tải danh sách bàn trống khả dụng!');
    }
  };

  // Xác nhận xếp bàn
  const handleConfirmAssign = async () => {
    if (!selectedTableId) {
      alert('Vui lòng chọn một bàn trống để xếp cho khách!');
      return;
    }
    try {
      setAssigning(true);
      await reservationApi.assignTable(selectedRes.id, { tableId: selectedTableId });
      alert(`Đã xếp bàn thành công cho khách hàng ${selectedRes.customerName}!`);
      setAssignModalOpen(false);
      fetchReservations();
    } catch (err) {
      console.error('Lỗi khi xếp bàn:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xếp bàn!');
    } finally {
      setAssigning(false);
    }
  };

  // Mở modal hủy đơn
  const handleOpenCancelModal = (resId) => {
    setCancelResId(resId);
    setCancelReason('Gọi điện khách không nhấc máy sau 3 lần');
    setCancelModalOpen(true);
  };

  // Xác nhận hủy đơn
  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy đơn đặt bàn!');
      return;
    }
    try {
      setCancelling(true);
      await reservationApi.cancelReservation(cancelResId, { cancelReason: cancelReason.trim() });
      alert('Đã cập nhật hủy đơn đặt bàn thành công!');
      setCancelModalOpen(false);
      fetchReservations();
    } catch (err) {
      console.error('Lỗi khi hủy đơn:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn!');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* 1. Header Page */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: "'Epilogue', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#1F1B1A', margin: '0 0 6px' }}>
            Điều Phối Đặt Bàn & Giữ Chỗ
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#89726B' }}>
            Tiếp nhận yêu cầu từ khách trực tuyến, gọi điện xác nhận và xếp bàn ăn thực tế
          </p>
        </div>

        <button
          onClick={fetchReservations}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            background: '#FFFFFF',
            border: '1.5px solid #EAE0DE',
            color: '#56423D',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <Icon name="refresh" size={18} />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* 2. Filter Bar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '16px 20px',
        border: '1px solid #F0E6E4',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Tabs Trạng thái */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'PENDING', label: 'Chờ Quản Lý Gọi Điện', icon: 'phone_in_talk', countColor: '#9D4124' },
            { key: 'CONFIRMED', label: 'Đã Xếp Bàn', icon: 'check_circle', countColor: '#596232' },
            { key: 'CANCELLED', label: 'Đã Hủy', icon: 'cancel', countColor: '#89726B' },
            { key: 'ALL', label: 'Tất Cả Đơn', icon: 'list_alt', countColor: '#1F1B1A' }
          ].map(tab => {
            const isSel = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '12px',
                  border: isSel ? '2px solid #9D4124' : '1px solid transparent',
                  background: isSel ? '#FFF8F6' : '#FCF1EF',
                  color: isSel ? '#9D4124' : '#56423D',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon name={tab.icon} size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Date Filter & Search Input */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFF8F6', padding: '6px 12px', borderRadius: '12px', border: '1px solid #EAE0DE' }}>
            <Icon name="calendar_today" size={18} style={{ color: '#89726B' }} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', fontWeight: 600, color: '#1F1B1A' }}
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#89726B' }}
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFF8F6', padding: '8px 14px', borderRadius: '12px', border: '1px solid #EAE0DE', minWidth: '240px' }}>
            <Icon name="search" size={18} style={{ color: '#89726B' }} />
            <input
              type="text"
              placeholder="Tìm theo Tên, SĐT, Mã đơn..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchReservations()}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* 3. Bảng Danh Sách Đặt Bàn */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        border: '1px solid #F0E6E4',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#89726B' }}>
            <Icon name="sync" size={36} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ margin: '10px 0 0', fontWeight: 700 }}>Đang tải dữ liệu đơn đặt bàn...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#89726B' }}>
            <Icon name="event_busy" size={48} style={{ color: '#C4B5B0', marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 6px', color: '#1F1B1A' }}>Không có yêu cầu đặt bàn nào</h3>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Hiện chưa có đơn đặt bàn nào thỏa mãn điều kiện lọc trên.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#FAF5F4', borderBottom: '1px solid #EAE0DE', color: '#56423D', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '16px 20px' }}>Mã Đơn & Giờ Hẹn</th>
                <th style={{ padding: '16px 20px' }}>Khách Hàng & SĐT Liên Hệ</th>
                <th style={{ padding: '16px 20px' }}>Số Khách & Khu Vực</th>
                <th style={{ padding: '16px 20px' }}>Bàn Đã Xếp</th>
                <th style={{ padding: '16px 20px' }}>Trạng Thái</th>
                <th style={{ padding: '16px 20px' }}>Ghi Chú</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(res => {
                const isPending = res.status === 'PENDING';
                const isConfirmed = res.status === 'CONFIRMED';
                const isCancelled = res.status === 'CANCELLED';

                return (
                  <tr key={res.id} style={{ borderBottom: '1px solid #F0E6E4', transition: 'background 0.15s ease' }}>
                    {/* Mã & Giờ hẹn */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, color: '#9D4124', fontSize: '0.92rem' }}>
                        {res.bookingCode}
                      </div>
                      <div style={{ fontWeight: 700, color: '#1F1B1A', marginTop: '2px' }}>
                        {res.formattedTime} • {res.formattedDate}
                      </div>
                    </td>

                    {/* Khách hàng & SĐT liên hệ */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 800, color: '#1F1B1A' }}>{res.customerName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <Icon name="call" size={16} style={{ color: '#9D4124' }} />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#56423D', fontWeight: 700, fontSize: '0.9rem' }}>
                          {res.customerPhone}
                        </span>
                      </div>
                    </td>

                    {/* Số khách & Khu vực mong muốn */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 800, color: '#1F1B1A' }}>{res.guestCount} khách</div>
                      <div style={{ fontSize: '0.78rem', color: '#89726B', marginTop: '2px' }}>
                        {res.requestedZoneName || res.requestedZone}
                      </div>
                    </td>

                    {/* Bàn đã xếp */}
                    <td style={{ padding: '16px 20px' }}>
                      {res.tableNumber ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#FFF8F6',
                          border: '1.5px solid #FFDBC9',
                          color: '#9D4124',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontWeight: 800
                        }}>
                          <Icon name="table_restaurant" size={16} />
                          {res.tableNumber} {res.tableName ? `(${res.tableName})` : ''}
                        </span>
                      ) : (
                        <span style={{ color: '#89726B', fontStyle: 'italic', fontSize: '0.82rem' }}>
                          Chưa xếp bàn
                        </span>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        background: isPending ? '#FEF3C7' : isConfirmed ? '#EFF5D3' : '#F6ECEA',
                        color: isPending ? '#B45309' : isConfirmed ? '#596232' : '#89726B'
                      }}>
                        {res.statusLabel}
                      </span>
                    </td>

                    {/* Ghi chú */}
                    <td style={{ padding: '16px 20px', maxWidth: '200px' }}>
                      <div style={{ fontSize: '0.78rem', color: '#56423D', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {res.note || (isCancelled ? `Lý do hủy: ${res.cancelReason}` : 'Không có ghi chú')}
                      </div>
                    </td>

                    {/* Thao tác */}
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(res)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '8px 14px',
                              borderRadius: '10px',
                              background: '#9D4124',
                              color: '#FFFFFF',
                              border: 'none',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              boxShadow: '0 4px 10px rgba(157, 65, 36, 0.2)'
                            }}
                          >
                            <Icon name="check" size={16} />
                            <span>Xếp Bàn</span>
                          </button>
                        )}

                        {!isCancelled && (
                          <button
                            type="button"
                            onClick={() => handleOpenCancelModal(res.id)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '10px',
                              background: '#FFFFFF',
                              color: '#BA1A1A',
                              border: '1px solid #FFDAD6',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            Hủy Đơn
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 4. MODAL XẾP BÀN ĂN CHO KHÁCH (CHỌN BÀN TRỐNG AVAILABLE)              */}
      {/* ==================================================================== */}
      {assignModalOpen && selectedRes && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(31, 27, 26, 0.6)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '560px',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="table_restaurant" size={24} style={{ color: '#9D4124' }} />
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', margin: 0, color: '#1F1B1A' }}>
                  Xác Nhận & Xếp Bàn Cho Khách
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#89726B' }}
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            {/* Thông tin tóm tắt đơn đặt */}
            <div style={{ background: '#FFF8F6', padding: '14px 16px', borderRadius: '14px', border: '1px solid #FFDBC9', marginBottom: '20px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Khách hàng: <strong>{selectedRes.customerName}</strong> ({selectedRes.customerPhone})</span>
                <span style={{ color: '#9D4124', fontWeight: 800 }}>{selectedRes.guestCount} người</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#56423D' }}>
                <span>Giờ hẹn: <strong>{selectedRes.formattedTime} • {selectedRes.formattedDate}</strong></span>
                <span>Khu vực mong muốn: <strong>{selectedRes.requestedZoneName}</strong></span>
              </div>
            </div>

            {/* Chọn bàn ăn khả dụng */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '8px' }}>
                Chọn bàn ăn đang trống phù hợp: <span style={{ color: '#9D4124' }}>*</span>
              </label>

              {availableTables.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', background: '#FCF1EF', borderRadius: '12px', color: '#BA1A1A', fontWeight: 700, fontSize: '0.88rem' }}>
                  Không còn bàn trống nào đủ sức chứa ({selectedRes.guestCount} chỗ) tại thời điểm này!
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
                  {availableTables.map(t => {
                    const isSel = String(selectedTableId) === String(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTableId(t.id)}
                        style={{
                          padding: '12px',
                          borderRadius: '12px',
                          border: isSel ? '2px solid #9D4124' : '1px solid #EAE0DE',
                          background: isSel ? '#FFF8F6' : '#FFFFFF',
                          cursor: 'pointer',
                          textAlign: 'center',
                          boxShadow: isSel ? '0 4px 10px rgba(157, 65, 36, 0.15)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1rem', color: isSel ? '#9D4124' : '#1F1B1A' }}>
                          {t.tableNumber}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#56423D', marginTop: '2px' }}>
                          {t.name || t.zone}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#596232', fontWeight: 800, marginTop: '4px' }}>
                          {t.capacity} chỗ ngồi
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  background: '#F0E6E4',
                  color: '#56423D',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={assigning || availableTables.length === 0}
                onClick={handleConfirmAssign}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '14px',
                  background: assigning || availableTables.length === 0 ? '#C4B5B0' : '#9D4124',
                  color: '#FFFFFF',
                  border: 'none',
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: assigning || availableTables.length === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(157, 65, 36, 0.3)'
                }}
              >
                {assigning ? 'Đang lưu...' : 'Xác Nhận & Xếp Bàn Này'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. MODAL HỦY ĐƠN ĐẶT BÀN                                              */}
      {/* ==================================================================== */}
      {cancelModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(31, 27, 26, 0.6)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '460px',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.25)'
          }}>
            <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: '0 0 12px', color: '#BA1A1A' }}>
              Xác Nhận Hủy Đơn Đặt Bàn
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#56423D', margin: '0 0 16px' }}>
              Vui lòng nhập lý do hủy đơn (để lưu vào lịch sử theo dõi chất lượng vận hành):
            </p>

            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ví dụ: Gọi điện 3 lần không liên lạc được, khách báo hủy lịch..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1.5px solid #EAE0DE',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '20px',
                resize: 'none'
              }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#F0E6E4', color: '#56423D', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#BA1A1A', color: '#FFFFFF', border: 'none', fontWeight: 800, cursor: 'pointer' }}
              >
                {cancelling ? 'Đang hủy...' : 'Xác Nhận Hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Bước F4: Cập Nhật Route & Thanh Điều Hướng Quản Trị

#### 1. Cập nhật `AppRoutes.jsx`
- **File:** `SourceCode/frontend/src/routes/AppRoutes.jsx`
- Import component:
```javascript
import ReservationsPage from '../pages/admin/ReservationsPage';
```
- Khai báo route bên trong nhánh `/admin`:
```javascript
        <Route path="reservations" element={<ReservationsPage />} />
```

#### 2. Cập nhật Sidebar trong `AdminLayout.jsx`
- **File:** `SourceCode/frontend/src/components/layout/AdminLayout.jsx`
- Bổ sung menu item vào mảng `navItems`:
```javascript
    {
      path: '/admin/reservations',
      label: 'Đặt Bàn & Giữ Chỗ',
      icon: 'book_online'
    },
```

---

## 4. Hướng Dẫn Kiểm Thử & Chạy Thử Toàn Trình (Verification & Testing)

### 4.1. Câu Lệnh SQL Bổ Sung Cột & Tạo Dữ Liệu Mẫu

Chạy câu lệnh sau trong SQL Server Management Studio (SSMS) trên database `ROMS_DB`:

```sql
-- 1. Bổ sung 2 cột mới vào bảng reservations nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('reservations') AND name = 'booking_code')
BEGIN
    ALTER TABLE reservations ADD booking_code NVARCHAR(50) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('reservations') AND name = 'requested_zone')
BEGIN
    ALTER TABLE reservations ADD requested_zone NVARCHAR(50) NULL;
END;

-- 2. Phân ca làm việc Full 24h (staff_schedules) cho hôm nay và ngày mai
-- Giúp nhóm test đăng nhập duyệt và xử lý đặt bàn bất kỳ lúc nào trong ngày (24/7)
DECLARE @TodayDate DATE = CAST(GETDATE() AS DATE);
DECLARE @TomorrowDate DATE = DATEADD(DAY, 1, @TodayDate);
DECLARE @EmpId BIGINT = (SELECT TOP 1 id FROM staffs WHERE username = 'EMP-001');
DECLARE @KdsId BIGINT = (SELECT TOP 1 id FROM staffs WHERE username = 'KDS-001');
DECLARE @CshId BIGINT = (SELECT TOP 1 id FROM staffs WHERE username = 'CSH-001');

-- (A) Phục vụ EMP-001 (Ca Sáng MORNING 00:00-14:00 & Ca Tối EVENING 14:00-24:00)
IF @EmpId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM staff_schedules WHERE staff_id = @EmpId AND work_date = @TodayDate AND shift_type = 'MORNING')
    INSERT INTO staff_schedules (staff_id, work_date, shift_type, created_at, updated_at) VALUES (@EmpId, @TodayDate, 'MORNING', GETDATE(), GETDATE());
IF @EmpId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM staff_schedules WHERE staff_id = @EmpId AND work_date = @TodayDate AND shift_type = 'EVENING')
    INSERT INTO staff_schedules (staff_id, work_date, shift_type, created_at, updated_at) VALUES (@EmpId, @TodayDate, 'EVENING', GETDATE(), GETDATE());
IF @EmpId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM staff_schedules WHERE staff_id = @EmpId AND work_date = @TomorrowDate AND shift_type = 'MORNING')
    INSERT INTO staff_schedules (staff_id, work_date, shift_type, created_at, updated_at) VALUES (@EmpId, @TomorrowDate, 'MORNING', GETDATE(), GETDATE());
IF @EmpId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM staff_schedules WHERE staff_id = @EmpId AND work_date = @TomorrowDate AND shift_type = 'EVENING')
    INSERT INTO staff_schedules (staff_id, work_date, shift_type, created_at, updated_at) VALUES (@EmpId, @TomorrowDate, 'EVENING', GETDATE(), GETDATE());

-- (B) Bếp KDS-001
IF @KdsId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM staff_schedules WHERE staff_id = @KdsId AND work_date = @TodayDate AND shift_type = 'MORNING')
    INSERT INTO staff_schedules (staff_id, work_date, shift_type, created_at, updated_at) VALUES (@KdsId, @TodayDate, 'MORNING', GETDATE(), GETDATE());
IF @KdsId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM staff_schedules WHERE staff_id = @KdsId AND work_date = @TodayDate AND shift_type = 'EVENING')
    INSERT INTO staff_schedules (staff_id, work_date, shift_type, created_at, updated_at) VALUES (@KdsId, @TodayDate, 'EVENING', GETDATE(), GETDATE());

-- (C) Thu ngân CSH-001
IF @CshId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM staff_schedules WHERE staff_id = @CshId AND work_date = @TodayDate AND shift_type = 'MORNING')
    INSERT INTO staff_schedules (staff_id, work_date, shift_type, created_at, updated_at) VALUES (@CshId, @TodayDate, 'MORNING', GETDATE(), GETDATE());
IF @CshId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM staff_schedules WHERE staff_id = @CshId AND work_date = @TodayDate AND shift_type = 'EVENING')
    INSERT INTO staff_schedules (staff_id, work_date, shift_type, created_at, updated_at) VALUES (@CshId, @TodayDate, 'EVENING', GETDATE(), GETDATE());

-- 3. Thêm dữ liệu mẫu kiểm thử đặt bàn (reservations)
INSERT INTO reservations (booking_code, customer_name, customer_phone, customer_email, guest_count, reservation_time, requested_zone, status, note, created_at)
VALUES 
('RES-20261009-1001', N'Trần Thị Thu Hà', '0988123456', 'ha.tran@gmail.com', 4, DATEADD(hour, 2, GETDATE()), 'ZONE_1', 'PENDING', N'Khách đề nghị bàn gần cửa sổ, chuẩn bị ghế trẻ em', GETDATE()),
('RES-20261009-1002', N'Lê Minh Hoàng', '0912345678', 'hoang.le@vinmail.com', 8, DATEADD(hour, 4, GETDATE()), 'VIP', 'PENDING', N'Tiệc sinh nhật công ty, chuẩn bị rượu vang trước', GETDATE());
```

---

### 4.2. Kiểm Thử API Bằng cURL

#### 1. Khách hàng lấy danh sách Khu vực bàn:
```bash
curl -X GET http://localhost:8080/api/customer/reservations/zones
```

#### 2. Khách hàng gửi yêu cầu đặt bàn:
```bash
curl -X POST http://localhost:8080/api/customer/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Nguyễn Văn An",
    "customerPhone": "0901234567",
    "customerEmail": "an.nguyen@gmail.com",
    "guestCount": 4,
    "reservationDate": "2026-10-10",
    "reservationTime": "19:00",
    "requestedZone": "ZONE_1",
    "note": "Kỷ niệm 5 năm ngày cưới"
  }'
```

#### 3. Quản lý xác nhận cuộc gọi và xếp bàn:
```bash
curl -X PUT http://localhost:8080/api/admin/reservations/1/assign-table \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "tableId": 1
  }'
```

---

## 5. Bảng Khắc Phục Sự Cố Thường Gặp (Troubleshooting)

| Mã Lỗi / Hiện Tượng | Nguyên Nhân | Cách Khắc Phục |
|:---|:---|:---|
| **Lỗi 403 Forbidden khi gọi `/api/customer/reservations`** | Route chưa được cấu hình permitAll trong Spring Security | Kiểm tra `SecurityConfig.java`, đảm bảo dòng `.requestMatchers("/api/customer/**").permitAll()` đang được kích hoạt. |
| **Gửi form báo lỗi ngày trong quá khứ** | Ngày giờ chọn ở frontend nhỏ hơn `LocalDateTime.now()` trên server | Chọn ngày từ hôm nay trở đi và giờ hẹn sau thời điểm hiện tại ít nhất 30 phút. |
| **Modal xếp bàn không hiển thị bàn nào** | Không có bàn nào đang ở trạng thái `AVAILABLE` thỏa mãn sức chứa | Vào trang Quản lý bàn `/admin/tables`, mở thêm bàn trống hoặc trả bàn từ trạng thái `DIRTY` sang `AVAILABLE`. |
| **Bàn không cập nhật sang trạng thái `RESERVED` sau khi xếp** | Quên gọi lệnh `tableRepository.save(table)` trong service | Đảm bảo method `assignTableToReservation` có annotation `@Transactional` và lưu cả entity `table` lẫn `reservation`. |
