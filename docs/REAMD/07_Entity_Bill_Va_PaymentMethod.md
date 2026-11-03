# BƯỚC 07: TẠO ENUM THANH TOÁN & ENTITY BILL (SỬ DỤNG LOMBOK)

## 1. Bước Này Làm Gì?
- Tạo các enum: `PaymentMethod` (phương thức thanh toán: `CASH`, `BANK_TRANSFER`, `CREDIT_CARD`, `E_WALLET`) và `BillStatus` (trạng thái hóa đơn: `UNPAID`, `PAID`, `CANCELLED`).
- Tạo entity `Bill` ánh xạ vào bảng `bills` (lưu trữ hóa đơn thanh toán của phiên ăn).
- **Sử dụng Lombok:** Thêm `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` loại bỏ các hàm constructor và getter/setter thủ công.
- **Nghiệp vụ chốt ca:** Thu ngân chốt ca tiền mặt phải có sự phê duyệt của Quản lý (`MANAGER`) thông qua việc nhập mã PIN 6 số.

---

## 2. Các File Code & Chức Năng

### File 1: `PaymentMethod.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/enums/PaymentMethod.java`
- **Chức năng:** Định nghĩa các hình thức thanh toán được hỗ trợ.

```java
package com.romsteam.roms.enums;

public enum PaymentMethod {
    CASH,           // Tiền mặt
    BANK_TRANSFER,  // Chuyển khoản ngân hàng (quét mã VietQR)
    CREDIT_CARD,    // Thẻ tín dụng / ghi nợ POS
    E_WALLET        // Ví điện tử (Momo, ZaloPay, VNPay)
}
```

---

### File 2: `BillStatus.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/enums/BillStatus.java`
- **Chức năng:** Định nghĩa trạng thái thanh toán của hóa đơn.

```java
package com.romsteam.roms.enums;

public enum BillStatus {
    UNPAID,     // Chưa thanh toán (vừa in tạm tính)
    PAID,       // Đã thanh toán thành công
    CANCELLED   // Hóa đơn bị hủy (do sai sót lập lại hóa đơn mới)
}
```

---

### File 3: `Bill.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/entity/Bill.java`
- **Chức năng:** Đại diện cho bảng `bills`, lưu trữ thông tin hóa đơn thanh toán cho phiên ăn.

```java
package com.romsteam.roms.entity;

import com.romsteam.roms.enums.BillStatus;
import com.romsteam.roms.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// Khai báo Entity đại diện cho bảng hóa đơn
@Entity
@Table(name = "bills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bill {

    // Khóa chính hóa đơn
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Khóa ngoại trỏ sang phiên ăn (Một phiên ăn gắn với một hóa đơn thanh toán)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false, unique = true)
    private DiningSession session;

    // Khóa ngoại trỏ sang Thu ngân lập và thu tiền hóa đơn
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cashier_id", nullable = false)
    private Staff cashier;

    // Mã hóa đơn hiển thị chuyên nghiệp (ví dụ: "INV-20261004-0001")
    @Column(name = "bill_code", nullable = false, unique = true, length = 50)
    private String billCode;

    // Tiền hàng trước thuế & giảm giá (Tổng tiền của tất cả các món ăn trong phiên)
    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    // Tiền thuế GTGT / VAT (nếu có)
    @Builder.Default
    @Column(name = "tax_amount", precision = 12, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    // Tiền chiết khấu / giảm giá khuyến mãi (nếu có)
    @Builder.Default
    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    // Tổng số tiền khách thực tế phải trả: finalAmount = subtotal + taxAmount - discountAmount
    @Column(name = "final_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal finalAmount;

    // Phương thức thanh toán khách lựa chọn (CASH, BANK_TRANSFER, CREDIT_CARD, E_WALLET)
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 30)
    private PaymentMethod paymentMethod;

    // Trạng thái hóa đơn: UNPAID, PAID, CANCELLED
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BillStatus status = BillStatus.UNPAID;

    // Thời điểm khách thanh toán thành công
    @Column(name = "payment_time")
    private LocalDateTime paymentTime;

    // Ghi chú hóa đơn (ví dụ: "Khách yêu cầu xuất hóa đơn đỏ công ty...")
    @Column(name = "note", length = 255)
    private String note;

    // Thời điểm tạo hóa đơn
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm cập nhật hóa đơn gần nhất
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```
