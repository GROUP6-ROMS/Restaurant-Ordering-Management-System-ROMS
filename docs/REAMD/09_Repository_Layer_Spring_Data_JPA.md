# BƯỚC 09: TẠO TẦNG REPOSITORY LAYER (SPRING DATA JPA)

## 1. Bước Này Làm Gì?
- Tạo toàn bộ các interface Repository kế thừa `JpaRepository<T, ID>` cho 9 Entity cốt lõi.
- Khai báo các Derived Query Method (Spring Data JPA tự động dịch tên phương thức thành câu lệnh SQL Server tương ứng mà không cần viết SQL thủ công).

---

## 2. Các File Code & Chức Năng

### File 1: `StaffRepository.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/repository/StaffRepository.java`
- **Chức năng:** Thao tác CSDL bảng `staffs`, phục vụ xác thực đăng nhập và quản lý nhân viên.

```java
package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Staff;
import com.romsteam.roms.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository // Danh dau day la bean Repository cua Spring Container
public interface StaffRepository extends JpaRepository<Staff, Long> {

    // Tim nhan vien theo ten dang nhap (dung cho qua trinh dang nhap Spring Security)
    // SQL sinh ra: SELECT * FROM staffs WHERE username = ?
    Optional<Staff> findByUsername(String username);

    // Kiem tra xem username da co nguoi dang ky chua (chong trung lap khi tao nhan vien moi)
    // SQL sinh ra: SELECT COUNT(*) > 0 FROM staffs WHERE username = ?
    boolean existsByUsername(String username);

    // Lay danh sach nhan vien theo vai tro (vi du: lay tat ca nhan vien WAITER hoac KITCHEN)
    // SQL sinh ra: SELECT * FROM staffs WHERE role = ?
    List<Staff> findByRole(UserRole role);

    // Lay danh sach nhan vien dang con lam viec (isActive = true)
    // SQL sinh ra: SELECT * FROM staffs WHERE is_active = ?
    List<Staff> findByIsActive(Boolean isActive);
}
```

---

### File 2: `RestaurantTableRepository.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/repository/RestaurantTableRepository.java`
- **Chức năng:** Thao tác CSDL bảng `restaurant_tables`, quản lý sơ đồ bàn và kiểm tra mã quét QR.

```java
package com.romsteam.roms.repository;

import com.romsteam.roms.entity.RestaurantTable;
import com.romsteam.roms.enums.TableStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {

    // Tim ban theo so hieu/ten ban (vi du: "Ban 01")
    // SQL sinh ra: SELECT * FROM restaurant_tables WHERE table_number = ?
    Optional<RestaurantTable> findByTableNumber(String tableNumber);

    // Tim ban theo chuoi ma token QR dan tai ban (xac thuc khi khach dung camera quet QR)
    // SQL sinh ra: SELECT * FROM restaurant_tables WHERE qr_token = ?
    Optional<RestaurantTable> findByQrToken(String qrToken);

    // Lay danh sach ban theo trang thai (vi du: lay danh sach cac ban trong AVAILABLE de xep cho)
    // SQL sinh ra: SELECT * FROM restaurant_tables WHERE status = ?
    List<RestaurantTable> findByStatus(TableStatus status);

    // Lay toan bo danh sach ban dang hoat dong trong quan
    // SQL sinh ra: SELECT * FROM restaurant_tables WHERE is_active = ?
    List<RestaurantTable> findByIsActive(Boolean isActive);
}
```

---

### File 3: `DiningSessionRepository.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/repository/DiningSessionRepository.java`
- **Chức năng:** Quản lý truy vấn phiên khách ngồi ăn tại bàn.

```java
package com.romsteam.roms.repository;

import com.romsteam.roms.entity.DiningSession;
import com.romsteam.roms.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiningSessionRepository extends JpaRepository<DiningSession, Long> {

    // Tim phien an bang ma token phien (dung xac thuc moi request cua khach gui tu dien thoai)
    // SQL sinh ra: SELECT * FROM dining_sessions WHERE session_token = ?
    Optional<DiningSession> findBySessionToken(String sessionToken);

    // Tim phien an theo ID ban va trang thai phien (vi du: tim phien dang ACTIVE tai Ban so 5)
    // SQL sinh ra: SELECT * FROM dining_sessions WHERE table_id = ? AND status = ?
    Optional<DiningSession> findByTableIdAndStatus(Long tableId, SessionStatus status);

    // Lay danh sach tat ca cac phien an dang hoat dong trong toan bo nha hang
    // SQL sinh ra: SELECT * FROM dining_sessions WHERE status = ?
    List<DiningSession> findByStatus(SessionStatus status);
}
```

---

### File 4: `CategoryRepository.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/repository/CategoryRepository.java`
- **Chức năng:** Quản lý danh mục món ăn thực đơn.

```java
package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    // Lay danh sach danh muc dang kich hoat va tu dong sap xep theo thu tu hien thi displayOrder tang dan
    // SQL sinh ra: SELECT * FROM categories WHERE is_active = true ORDER BY display_order ASC
    List<Category> findByIsActiveTrueOrderByDisplayOrderAsc();

    // Kiem tra ten danh muc da ton tai hay chua (chong trung khi them moi)
    // SQL sinh ra: SELECT COUNT(*) > 0 FROM categories WHERE name = ?
    boolean existsByName(String name);
}
```

---

### File 5: `MenuItemRepository.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/repository/MenuItemRepository.java`
- **Chức năng:** Quản lý truy vấn danh sách món ăn thực đơn.

```java
package com.romsteam.roms.repository;

import com.romsteam.roms.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    // Lay tat ca mon an thuoc mot danh muc cu the va dang hoat dong
    // SQL sinh ra: SELECT * FROM menu_items WHERE category_id = ? AND is_active = true ORDER BY display_order ASC
    List<MenuItem> findByCategoryIdAndIsActiveTrueOrderByDisplayOrderAsc(Long categoryId);

    // Lay danh sach toan bo mon an dang kinh doanh de hien thi len thuc don dien tu
    // SQL sinh ra: SELECT * FROM menu_items WHERE is_active = true
    List<MenuItem> findByIsActiveTrue();

    // Tim kiem mon an theo tu khoa ten mon (tim gan dung, khong phan biet hoa thuong)
    // SQL sinh ra: SELECT * FROM menu_items WHERE LOWER(name) LIKE LOWER('%...%') AND is_active = true
    List<MenuItem> findByNameContainingIgnoreCaseAndIsActiveTrue(String keyword);
}
```

---

### File 6: `OrderRepository.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/repository/OrderRepository.java`
- **Chức năng:** Quản lý truy vấn các đợt gọi món.

```java
package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Order;
import com.romsteam.roms.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // Tim dot goi mon theo ma hien thi (vi du: "ORD-20261004-001")
    // SQL sinh ra: SELECT * FROM orders WHERE order_code = ?
    Optional<Order> findByOrderCode(String orderCode);

    // Lay toan bo cac dot goi mon cua mot phien an ban cu the (de tinh tien hoac xem lich su ban an)
    // SQL sinh ra: SELECT * FROM orders WHERE session_id = ? ORDER BY order_time ASC
    List<Order> findBySessionIdOrderByOrderTimeAsc(Long sessionId);

    // Lay danh sach cac don goi mon theo trang thai (vi du: lay tat ca don SUBMITTED can duyet)
    // SQL sinh ra: SELECT * FROM orders WHERE status = ?
    List<Order> findByStatus(OrderStatus status);
}
```

---

### File 7: `OrderItemRepository.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/repository/OrderItemRepository.java`
- **Chức năng:** Quản lý truy vấn các món ăn chi tiết, đặc biệt phục vụ màn hình KDS nhà bếp.

```java
package com.romsteam.roms.repository;

import com.romsteam.roms.entity.OrderItem;
import com.romsteam.roms.enums.OrderItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    // Lay tat ca mon an chi tiet thuoc mot dot goi mon
    // SQL sinh ra: SELECT * FROM order_items WHERE order_id = ?
    List<OrderItem> findByOrderId(Long orderId);

    // Lay danh sach cac mon an theo trang thai che bien (vi du: lay cac mon PENDING hoac COOKING cho man hinh bep)
    // SQL sinh ra: SELECT * FROM order_items WHERE status = ?
    List<OrderItem> findByStatus(OrderItemStatus status);

    // Lay danh sach cac mon thuoc mot tap hop trang thai (vi du: lay ca PENDING va COOKING cung luc)
    // SQL sinh ra: SELECT * FROM order_items WHERE status IN (?, ?)
    List<OrderItem> findByStatusIn(List<OrderItemStatus> statuses);
}
```

---

### File 8: `BillRepository.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/repository/BillRepository.java`
- **Chức năng:** Quản lý truy vấn hóa đơn thanh toán.

```java
package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Bill;
import com.romsteam.roms.enums.BillStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {

    // Tim hoa don bang ma bill (vi du: "BILL-20261004-0001")
    // SQL sinh ra: SELECT * FROM bills WHERE bill_code = ?
    Optional<Bill> findByBillCode(String billCode);

    // Tim hoa don cua mot phien an ban cu the
    // SQL sinh ra: SELECT * FROM bills WHERE session_id = ?
    Optional<Bill> findBySessionId(Long sessionId);

    // Lay danh sach hoa don theo trang thai (vi du: lay danh sach hoa don UNPAID chua thanh toan)
    // SQL sinh ra: SELECT * FROM bills WHERE status = ?
    List<Bill> findByStatus(BillStatus status);

    // Lay danh sach cac hoa don da thanh toan thanh cong trong mot khoang thoi gian (phuc vu bao cao doanh thu)
    // SQL sinh ra: SELECT * FROM bills WHERE status = 'PAID' AND payment_time BETWEEN ? AND ?
    List<Bill> findByStatusAndPaymentTimeBetween(BillStatus status, LocalDateTime start, LocalDateTime end);
}
```

---

### File 9: `ReservationRepository.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/repository/ReservationRepository.java`
- **Chức năng:** Quản lý truy vấn các đơn đặt bàn trước.

```java
package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Reservation;
import com.romsteam.roms.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    // Tim cac phieu dat ban theo so dien thoai khach hang (tra cuu lich su dat cho)
    // SQL sinh ra: SELECT * FROM reservations WHERE customer_phone = ?
    List<Reservation> findByCustomerPhone(String customerPhone);

    // Lay danh sach cac phieu dat ban theo trang thai (vi du: lay cac don PENDING cho le tan duyet)
    // SQL sinh ra: SELECT * FROM reservations WHERE status = ?
    List<Reservation> findByStatus(ReservationStatus status);

    // Lay danh sach cac phieu dat ban trong mot ngay hoac khung gio cu the
    // SQL sinh ra: SELECT * FROM reservations WHERE reservation_time BETWEEN ? AND ?
    List<Reservation> findByReservationTimeBetween(LocalDateTime start, LocalDateTime end);
}
```
