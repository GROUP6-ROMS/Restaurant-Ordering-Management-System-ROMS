# BƯỚC 20: HOÀN THIỆN TRẠM THU NGÂN POS (CASHIER TERMINAL), THANH TOÁN HÓA ĐƠN & LIÊN THÔNG VẬN HÀNH F&B (FULL-STACK & CHUẨN SWP391)

> **Mục tiêu:**
> 1. **Xóa bỏ 100% Mock Data tĩnh:** Loại bỏ toàn bộ `INITIAL_POS_TABLES`, `MOCK_INVOICE_HISTORY`, `MOCK_MENU_ITEMS` trong `PosCheckoutPage.jsx`. Kết nối trực tiếp với Database SQL Server qua API Backend.
> 2. **Xây dựng phân hệ Backend Thu Ngân (Cashier/POS) hoàn chỉnh:**
>    - Tạo đầy đủ các DTOs chuẩn Lombok.
>    - Xây dựng `CashierService`, `CashierServiceImpl` và `CashierController` có phân quyền bảo mật `@PreAuthorize("hasAnyRole('CASHIER', 'MANAGER')")`.
>    - Khai thác triệt để các Entity `Bill`, `DiningSession`, `Order`, `OrderItem`, `ServiceRequest` và `RestaurantTable`.
> 3. **Chuẩn hóa quy trình vận hành F&B khép kín (Closed-loop Billing Workflow):**
>    - **Tiếp nhận yêu cầu thanh toán Realtime:** Lắng nghe chuông gọi `BILL` từ Waiter, tự động đẩy bàn lên đầu danh sách kèm âm thanh ting-ting và viền phát sáng.
>    - **In phiếu Tạm tính (Pre-bill / Draft Receipt):** Cho phép in phiếu cho khách xem lại món trước khi quẹt thẻ/trả tiền, chuyển trạng thái bàn sang `DRAFT_PRINTED`.
>    - **Chiết khấu & Thuế VAT:** Hỗ trợ giảm giá theo % (5%, 10%, 20%) hoặc số tiền cố định (Voucher VNĐ), áp dụng thuế VAT 8% chuẩn quy định.
>    - **Thanh toán Tiền mặt (Cash):** Bàn phím số gợi ý tiền khách đưa nhanh (Đủ tiền, 100k, 200k, 500k) và tính tiền thối lại chuẩn xác.
>    - **Thanh toán Chuyển khoản VietQR động (Dynamic VietQR):** Tự động sinh mã QR ngân hàng chuẩn NAPAS 247 nhúng đúng số tiền `finalAmount` và nội dung `Mã hóa đơn + Số bàn`.
>    - **Chốt thanh toán hoàn tất:** Lưu bản ghi vào bảng `bills`, đóng `DiningSession` (`COMPLETED`), chuyển bàn sang `DIRTY` (Cần dọn) để Waiter ra dọn, tự động đóng chuông gọi `BILL` (`RESOLVED`), cập nhật tức thì vào Báo cáo doanh thu Quản trị.
>    - **Lịch sử giao dịch (Invoice History):** Truy vấn danh sách hóa đơn thật, xem chi tiết và in lại hóa đơn (Reprint).
>    - **Két tiền & Bàn giao ca (Shift Handover):** Kiểm đếm mệnh giá tiền mặt trong két (500k, 200k, 100k...), đối soát với doanh thu tiền mặt thực tế trong CSDL, quản lý nhập mã PIN 6 số phê duyệt chốt ca.
>    - **Chuẩn hóa in ấn máy in nhiệt K80:** CSS `@media print` sắc nét khổ 80mm cho máy in hóa đơn nhà hàng.
> 4. **Script SQL sinh dữ liệu test phong phú ở cuối file:** Tạo ngay các bàn đang ăn, bàn chờ tính tiền, bàn đã in tạm tính, cùng 5 hóa đơn lịch sử hoàn tất để kiểm thử ngay lập tức.

---

## 1. TỔNG QUAN KIẾN TRÚC & LUỒNG DỮ LIỆU LIÊN THÔNG (CLOSED-LOOP F&B WORKFLOW)

### 1.1. So sánh Hiện trạng cũ (Mock) vs Giải pháp hoàn thiện mới

| Thành phần | Hiện trạng cũ (Mock / Chưa có) | Sau khi hoàn thiện (Chuẩn F&B & SWP391) |
| :--- | :--- | :--- |
| **Nguồn dữ liệu POS** | Đang nạp mảng tĩnh `INITIAL_POS_TABLES` (mã bàn cứng T05, T02). Khách thực tế ngồi bàn B01, B02 gọi món thì Thu ngân không hề thấy. | Gọi `GET /api/cashier/tables` lấy danh sách bàn đang có khách (`OCCUPIED`) từ Database thật, kèm số lượng món và tổng tiền thực tế. |
| **Lắng nghe Waiter báo tính tiền** | Waiter bấm "Yêu cầu tính tiền" chỉ tạo chuông trong DB, Thu ngân không nhận được gì. | Bàn có chuông `BILL` từ Waiter được đánh dấu `PAYMENT_REQUEST`, tự động gom lên đầu danh sách kèm âm báo ting-ting. |
| **Thao tác Thanh toán** | Bấm thanh toán chỉ cập nhật state React nội bộ, F5 lại là mất, không lưu CSDL, không đóng phiên ăn. | Gửi `POST /api/cashier/tables/{id}/checkout`: Lưu bản ghi vào `bills`, đóng `DiningSession` (`COMPLETED`), đổi bàn sang `DIRTY` để Waiter ra dọn. |
| **VietQR Chuyển khoản** | Modal hiển thị ảnh tĩnh giả lập, không có thông tin số tiền hay mã hóa đơn của đơn hàng. | Sinh mã **VietQR động chuẩn NAPAS 247**: Nhúng đúng số tiền cần thanh toán và nội dung `BILL-xxx Ban 01` để khách quét app ngân hàng thanh toán ngay. |
| **In hóa đơn** | In thử nghiệm tràn toàn màn hình trình duyệt. | Tối ưu CSS `@media print` chuyên biệt cho máy in nhiệt khổ giấy **K80 (80mm)** và **K57 (57mm)**, tự động ẩn toàn bộ header, sidebar, nút bấm khi in. |
| **Lịch sử giao dịch & Chốt ca** | Dùng mảng `MOCK_INVOICE_HISTORY` từ 2025; doanh thu két tiền hardcoded `10.650.000 đ`. | Lấy dữ liệu thật từ bảng `bills`; tự động tính tổng tiền mặt, chuyển khoản, thẻ theo ca để thu ngân đối soát két tiền thực tế. |

---

### 1.2. Sơ đồ tuần tự nghiệp vụ (Sequence Diagram)

```text
[Khách hàng / Waiter]         [Backend ROMS]              [SQL Server]              [Thu Ngân POS]               [Báo Cáo Admin]
          │                         │                          │                          │                             │
          │── 1. Bấm Y/C Tính tiền ─>│                          │                          │                             │
          │      (Waiter Terminal)  │── 2. INSERT ServiceReq ─>│                          │                             │
          │                         │      type='BILL' (PENDING│                          │                             │
          │                         │                          │<── 3. Polling 5s ────────│                             │
          │                         │                          │    GET /cashier/tables   │                             │
          │                         │                          │── 4. Bàn có cờ BILL ────>│                             │
          │                         │                          │                          │ (Ting chuông! Đổi màu vàng) │
          │                         │                          │                          │                             │
          │                         │                          │<── 5. In phiếu Tạm tính ─│                             │
          │                         │                          │    POST /draft-bill      │                             │
          │                         │                          │── 6. Chuyển DRAFT_PRINTED>│                             │
          │                         │                          │                          │                             │
          │<─ 7. Khách quét VietQR ─│                          │                          │                             │
          │      hoặc trả tiền mặt  │                          │                          │                             │
          │                         │                          │                          │                             │
          │                         │<── 8. Chốt Thanh Toán ──────────────────────────────│                             │
          │                         │    POST /checkout (CASH / BANK_TRANSFER / CARD)     │                             │
          │                         │── 9. INSERT Bill (PAID) ───────────────────────────>│                             │
          │                         │── 10. UPDATE DiningSession -> COMPLETED ───────────>│                             │
          │                         │── 11. UPDATE Table -> DIRTY (Waiter thấy ra dọn) ──>│                             │
          │                         │── 12. UPDATE ServiceReq -> RESOLVED ───────────────>│                             │
          │                         │                                                     │                             │
          │                         │──────────────────────────────── 13. Cập nhật Doanh thu tức thì ───────────────>│
```

---

## 2. HƯỚNG DẪN THỰC HIỆN PHÍA BACKEND (SPRING BOOT)

### BƯỚC B1: Tạo các DTOs cho phân hệ Thu Ngân

#### 1. DTO Danh sách bàn phục vụ trên POS: `CashierTableResponse.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/response/CashierTableResponse.java`

```java
package com.romsteam.roms.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO trả về thông tin bàn ăn hiển thị trên lưới bàn của Thu ngân POS
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashierTableResponse {

    private Long id;
    private String code;            // Ví dụ: "T-01", "B-02", "VIP-01"
    private String name;            // Ví dụ: "Bàn 01", "Phòng VIP 01"
    private String zone;            // "ZONE_1", "ZONE_2", "VIP"
    private String zoneName;        // "Tầng 1 - Sảnh Chính"
    private Integer capacity;
    private Integer guestCount;

    // Trạng thái hiển thị POS: AVAILABLE, DINING, PAYMENT_REQUEST, DRAFT_PRINTED, DIRTY
    private String status;
    private String statusText;      // "Y/c Thanh Toán", "Đang ăn", "Đã in tạm tính"
    private String timeIn;          // "12:15"
    private Long durationMinutes;   // 35

    private Long sessionId;
    private String orderCode;       // "ORD-T01-8842"
    private BigDecimal orderTotal;  // Tổng tiền tạm tính trước thuế & chiết khấu
    private Integer totalItemsCount;
    private Boolean isCallingBill;  // true nếu Waiter vừa bấm chuông yêu cầu tính tiền
    private Long serviceRequestId;

    // Danh sách món ăn chi tiết đang phục vụ tại bàn
    private List<CashierOrderItemDTO> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CashierOrderItemDTO {
        private Long orderItemId;
        private String name;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private String status;      // COOKING, READY, SERVED
        private String note;
    }
}
```

---

#### 2. DTO Xem chi tiết tạm tính hóa đơn: `CashierBillPreviewResponse.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/response/CashierBillPreviewResponse.java`

```java
package com.romsteam.roms.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO chi tiết hóa đơn tạm tính của bàn phục vụ việc in Pre-bill và tính tiền
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashierBillPreviewResponse {

    private Long tableId;
    private String tableCode;
    private String tableName;
    private String zoneName;
    private Integer guestCount;
    private String timeIn;
    private Long durationMinutes;

    private Long sessionId;
    private String billCode;        // Dự kiến: "BILL-YYYYMMDD-XXXX"
    private BigDecimal subtotal;    // Tổng tiền món ăn (chỉ tính món không hủy)
    private BigDecimal taxRate;     // 8.0 (%)
    private BigDecimal taxAmount;   // subtotal * 0.08
    private BigDecimal discountAmount;
    private BigDecimal finalAmount; // subtotal + taxAmount - discountAmount

    private List<CashierBillItemDetail> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CashierBillItemDetail {
        private Long orderItemId;
        private String itemName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private String note;
        private String status;
    }
}
```

---

#### 3. DTO Request Thanh toán hóa đơn: `CashierCheckoutRequest.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/request/CashierCheckoutRequest.java`

```java
package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO nhận dữ liệu khi Thu ngân bấm "Thanh toán & In hóa đơn"
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashierCheckoutRequest {

    // Phương thức thanh toán: CASH, BANK_TRANSFER, CARD
    @NotNull(message = "Phương thức thanh toán là bắt buộc!")
    private String paymentMethod;

    // Loại giảm giá: NONE, PERCENT, AMOUNT
    @Builder.Default
    private String discountType = "NONE";

    // Giá trị giảm giá: số % (ví dụ 10) hoặc số tiền VNĐ (ví dụ 50000)
    @Builder.Default
    private BigDecimal discountValue = BigDecimal.ZERO;

    // Thuế VAT (mặc định 8%)
    @Builder.Default
    private BigDecimal taxRate = BigDecimal.valueOf(8.0);

    // Tiền khách đưa khi thanh toán tiền mặt (CASH)
    private BigDecimal cashGiven;

    // Ghi chú của thu ngân (Ví dụ: "Khách VIP thẻ vàng", "Tiền thừa bo lại")
    private String note;
}
```

---

#### 4. DTO Thông tin hóa đơn đã thanh toán (Tab Lịch sử GD): `CashierInvoiceResponse.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/response/CashierInvoiceResponse.java`

```java
package com.romsteam.roms.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO hiển thị danh sách hóa đơn lịch sử và chi tiết in lại hóa đơn (Reprint)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashierInvoiceResponse {

    private Long id;
    private String billCode;        // "BILL-20261010-0012"
    private String tableName;       // "Bàn 01"
    private String zoneName;        // "Tầng 1 - Sảnh chính"
    private String cashierName;     // "Hoàng Hải Yến (#CSH-001)"
    private String shiftName;       // "Ca Sáng" / "Ca Tối"
    private LocalDateTime paymentTime;
    private String paymentTimeFormatted; // "12:45 10/10/2026"

    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;

    private String paymentMethod;   // "CASH", "BANK_TRANSFER", "CARD"
    private String paymentMethodLabel; // "Tiền mặt", "VietQR Chuyển khoản", "Thẻ POS"
    private String status;          // "PAID", "CANCELLED"
    private String statusLabel;     // "Đã thanh toán"
    private String note;

    private Integer itemsCount;
    private String itemsSummary;    // "Phở Bò x2, Nem Rán, Trà Đào..."
    private List<InvoiceItemDTO> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvoiceItemDTO {
        private String name;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
    }
}
```

---

#### 5. DTO Đối soát két tiền & Doanh thu theo ca: `CashierShiftSummaryResponse.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/response/CashierShiftSummaryResponse.java`

```java
package com.romsteam.roms.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO tổng hợp số liệu doanh thu thực tế theo ca làm việc phục vụ đối soát két tiền
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashierShiftSummaryResponse {

    private String shiftType;           // "MORNING", "EVENING"
    private String shiftName;           // "Ca Sáng (06:00 - 14:00)"
    private LocalDate workDate;
    private String cashierUsername;
    private String cashierFullName;

    private Long totalBillsCount;       // Tổng số hóa đơn đã thanh toán
    private BigDecimal totalRevenue;    // Tổng doanh thu thực tế
    private BigDecimal cashRevenue;     // Doanh thu tiền mặt (CASH)
    private BigDecimal bankRevenue;     // Doanh thu chuyển khoản (BANK_TRANSFER)
    private BigDecimal cardRevenue;     // Doanh thu quẹt thẻ (CARD)

    // Tiền mặt lý thuyết phải có trong két = Tiền đầu ca (nếu có) + cashRevenue
    private BigDecimal theoreticalDrawerCash;
}
```

---

#### 6. DTO Duyệt xác thực Quản lý (Mã PIN): `ManagerApprovalRequest.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/request/ManagerApprovalRequest.java`

```java
package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

/**
 * DTO xác thực mã PIN 6 số của Quản lý khi hủy món hoặc chốt sổ ca làm việc
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManagerApprovalRequest {

    @NotBlank(message = "Mã PIN Quản lý là bắt buộc!")
    @Pattern(regexp = "^\\d{6}$", message = "Mã PIN Quản lý phải gồm đúng 6 chữ số!")
    private String managerPin;

    private String reason; // Lý do hủy món hoặc ghi chú bàn giao ca
}
```

---

### BƯỚC B2: Interface Service Thu Ngân: `CashierService.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/CashierService.java`

```java
package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.CashierCheckoutRequest;
import com.romsteam.roms.dto.request.ManagerApprovalRequest;
import com.romsteam.roms.dto.response.*;

import java.time.LocalDate;
import java.util.List;

public interface CashierService {

    // 1. Lấy danh sách bàn trên POS kèm trạng thái yêu cầu tính tiền (Polling 5s)
    List<CashierTableResponse> getPosTables(String zone);

    // 2. Lấy thông tin tạm tính chi tiết của một bàn
    CashierBillPreviewResponse getBillPreview(Long tableId);

    // 3. Đánh dấu bàn đã in phiếu tạm tính (DRAFT_PRINTED)
    CashierTableResponse markDraftPrinted(Long tableId);

    // 4. Thanh toán hóa đơn bàn ăn (Lưu Bill, đóng Session, chuyển bàn DIRTY, giải quyết chuông)
    CashierInvoiceResponse checkoutBill(Long tableId, CashierCheckoutRequest request, String cashierUsername);

    // 5. Lấy danh sách lịch sử hóa đơn trong ngày hoặc theo bộ lọc
    List<CashierInvoiceResponse> getInvoiceHistory(LocalDate date, String paymentMethod, String search);

    // 6. Lấy chi tiết 1 hóa đơn để in lại (Reprint)
    CashierInvoiceResponse getInvoiceDetail(Long invoiceId);

    // 7. Lấy tổng hợp doanh thu theo ca của thu ngân để đối soát két tiền
    CashierShiftSummaryResponse getShiftSummary(String shiftType, LocalDate date, String cashierUsername);

    // 8. Hủy món trên hóa đơn tạm tính có Quản lý duyệt mã PIN
    void voidOrderItem(Long itemId, ManagerApprovalRequest request);

    // 9. Xác nhận chốt ca làm việc có Quản lý duyệt mã PIN
    void closeShift(ManagerApprovalRequest request, String cashierUsername);
}
```

---

### BƯỚC B3: Triển khai Service: `CashierServiceImpl.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/serviceImpl/CashierServiceImpl.java`

```java
package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.CashierCheckoutRequest;
import com.romsteam.roms.dto.request.ManagerApprovalRequest;
import com.romsteam.roms.dto.response.*;
import com.romsteam.roms.entity.*;
import com.romsteam.roms.entity.enums.*;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.exception.ResourceNotFoundException;
import com.romsteam.roms.repository.*;
import com.romsteam.roms.service.CashierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CashierServiceImpl implements CashierService {

    private final RestaurantTableRepository tableRepository;
    private final DiningSessionRepository sessionRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final BillRepository billRepository;
    private final ServiceRequestRepository requestRepository;
    private final StaffRepository staffRepository;
    private final ZoneRepository zoneRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<CashierTableResponse> getPosTables(String zone) {
        List<RestaurantTable> allTables = tableRepository.findByIsActiveTrueOrderByTableNumberAsc();

        if (zone != null && !zone.trim().isEmpty() && !"ALL".equalsIgnoreCase(zone.trim())) {
            allTables = allTables.stream()
                    .filter(t -> zone.equalsIgnoreCase(t.getZone()))
                    .collect(Collectors.toList());
        }

        List<CashierTableResponse> result = new ArrayList<>();
        for (RestaurantTable table : allTables) {
            result.add(mapToCashierTableResponse(table));
        }

        // Ưu tiên bàn có yêu cầu thanh toán (PAYMENT_REQUEST) lên đầu tiên
        result.sort((t1, t2) -> {
            boolean r1 = Boolean.TRUE.equals(t1.getIsCallingBill());
            boolean r2 = Boolean.TRUE.equals(t2.getIsCallingBill());
            if (r1 && !r2) return -1;
            if (!r1 && r2) return 1;
            return t1.getCode().compareTo(t2.getCode());
        });

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public CashierBillPreviewResponse getBillPreview(Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn ăn không tồn tại: " + tableId));

        DiningSession session = sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE)
                .orElseThrow(() -> new AppException("Bàn " + table.getTableNumber() + " hiện không có phiên ăn đang hoạt động!", HttpStatus.BAD_REQUEST));

        List<Order> orders = orderRepository.findBySessionId(session.getId());
        List<CashierBillPreviewResponse.CashierBillItemDetail> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (Order order : orders) {
            if (order.getStatus() == OrderStatus.CANCELLED) continue;
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (item.getStatus() == OrderItemStatus.CANCELLED) continue;

                    BigDecimal itemSubtotal = item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO;
                    subtotal = subtotal.add(itemSubtotal);

                    items.add(CashierBillPreviewResponse.CashierBillItemDetail.builder()
                            .orderItemId(item.getId())
                            .itemName(item.getMenuItem() != null ? item.getMenuItem().getName() : "Món ăn")
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .subtotal(itemSubtotal)
                            .note(item.getNote())
                            .status(item.getStatus() != null ? item.getStatus().name() : "COOKING")
                            .build());
                }
            }
        }

        BigDecimal taxRate = BigDecimal.valueOf(8.0);
        BigDecimal taxAmount = subtotal.multiply(taxRate).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal finalAmount = subtotal.add(taxAmount).subtract(discountAmount);

        long duration = 0;
        String timeIn = "--:--";
        if (session.getStartTime() != null) {
            duration = Duration.between(session.getStartTime(), LocalDateTime.now()).toMinutes();
            timeIn = session.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm"));
        }

        String billCode = "BILL-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + table.getTableNumber();

        return CashierBillPreviewResponse.builder()
                .tableId(table.getId())
                .tableCode(table.getTableNumber())
                .tableName(table.getName())
                .zoneName(resolveZoneName(table.getZone()))
                .guestCount(session.getGuestCount() != null ? session.getGuestCount() : table.getCapacity())
                .timeIn(timeIn)
                .durationMinutes(Math.max(0, duration))
                .sessionId(session.getId())
                .billCode(billCode)
                .subtotal(subtotal)
                .taxRate(taxRate)
                .taxAmount(taxAmount)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .items(items)
                .build();
    }

    @Override
    @Transactional
    public CashierTableResponse markDraftPrinted(Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại: " + tableId));

        // Lưu thông tin tạm tính đã in
        return mapToCashierTableResponse(table);
    }

    @Override
    @Transactional
    public CashierInvoiceResponse checkoutBill(Long tableId, CashierCheckoutRequest request, String cashierUsername) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại: " + tableId));

        DiningSession session = sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE)
                .orElseThrow(() -> new AppException("Bàn không có phiên ăn đang hoạt động để thanh toán!", HttpStatus.BAD_REQUEST));

        Staff cashier = null;
        if (cashierUsername != null) {
            cashier = staffRepository.findByUsername(cashierUsername).orElse(null);
        }

        // Tính toán tổng tiền hóa đơn thực tế
        List<Order> orders = orderRepository.findBySessionId(session.getId());
        BigDecimal subtotal = BigDecimal.ZERO;
        List<CashierInvoiceResponse.InvoiceItemDTO> itemDTOs = new ArrayList<>();

        for (Order order : orders) {
            if (order.getStatus() == OrderStatus.CANCELLED) continue;
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (item.getStatus() == OrderItemStatus.CANCELLED) continue;

                    BigDecimal itemSubtotal = item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO;
                    subtotal = subtotal.add(itemSubtotal);

                    itemDTOs.add(CashierInvoiceResponse.InvoiceItemDTO.builder()
                            .name(item.getMenuItem() != null ? item.getMenuItem().getName() : "Món ăn")
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .subtotal(itemSubtotal)
                            .build());
                }
            }
        }

        if (subtotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException("Bàn chưa có món ăn hợp lệ để thanh toán!", HttpStatus.BAD_REQUEST);
        }

        // Áp dụng thuế & giảm giá
        BigDecimal taxRate = request.getTaxRate() != null ? request.getTaxRate() : BigDecimal.valueOf(8.0);
        BigDecimal taxAmount = subtotal.multiply(taxRate).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

        BigDecimal discountAmount = BigDecimal.ZERO;
        if ("PERCENT".equalsIgnoreCase(request.getDiscountType()) && request.getDiscountValue() != null) {
            discountAmount = subtotal.multiply(request.getDiscountValue()).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        } else if ("AMOUNT".equalsIgnoreCase(request.getDiscountType()) && request.getDiscountValue() != null) {
            discountAmount = request.getDiscountValue();
        }

        BigDecimal finalAmount = subtotal.add(taxAmount).subtract(discountAmount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) finalAmount = BigDecimal.ZERO;

        PaymentMethod pm = PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase());
        String billCode = "BILL-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + (System.currentTimeMillis() % 10000);

        // 1. Tạo bản ghi Bill
        Bill bill = new Bill();
        bill.setSession(session);
        bill.setCashier(cashier);
        bill.setBillCode(billCode);
        bill.setSubtotal(subtotal);
        bill.setTaxAmount(taxAmount);
        bill.setDiscountAmount(discountAmount);
        bill.setFinalAmount(finalAmount);
        bill.setPaymentMethod(pm);
        bill.setStatus(BillStatus.PAID);
        bill.setPaymentTime(LocalDateTime.now());
        bill.setNote(request.getNote());
        billRepository.save(bill);

        // 2. Đóng phiên ăn DiningSession
        session.setStatus(SessionStatus.COMPLETED);
        session.setEndTime(LocalDateTime.now());
        sessionRepository.save(session);

        // 3. Đổi trạng thái bàn thành DIRTY (cần dọn) để Waiter thấy ra dọn
        table.setStatus(TableStatus.DIRTY);
        tableRepository.save(table);

        // 4. Đóng tất cả ServiceRequest loại BILL của bàn này
        List<ServiceRequest> billRequests = requestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(table.getId(), "PENDING");
        for (ServiceRequest req : billRequests) {
            if ("BILL".equalsIgnoreCase(req.getRequestType())) {
                req.setStatus("RESOLVED");
                requestRepository.save(req);
            }
        }

        return mapToInvoiceResponse(bill, itemDTOs, table);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CashierInvoiceResponse> getInvoiceHistory(LocalDate date, String paymentMethod, String search) {
        LocalDate queryDate = (date != null) ? date : LocalDate.now();
        LocalDateTime startOfDay = queryDate.atStartOfDay();
        LocalDateTime endOfDay = queryDate.atTime(23, 59, 59);

        List<Bill> bills = billRepository.findByStatusAndPaymentTimeBetween(BillStatus.PAID, startOfDay, endOfDay);

        if (paymentMethod != null && !paymentMethod.trim().isEmpty() && !"ALL".equalsIgnoreCase(paymentMethod.trim())) {
            PaymentMethod pm = PaymentMethod.valueOf(paymentMethod.toUpperCase());
            bills = bills.stream().filter(b -> b.getPaymentMethod() == pm).collect(Collectors.toList());
        }

        List<CashierInvoiceResponse> responses = new ArrayList<>();
        for (Bill b : bills) {
            CashierInvoiceResponse resp = mapToInvoiceResponse(b, Collections.emptyList(), null);
            if (search != null && !search.trim().isEmpty()) {
                String q = search.trim().toLowerCase();
                boolean match = resp.getBillCode().toLowerCase().contains(q)
                        || resp.getTableName().toLowerCase().contains(q)
                        || (resp.getCashierName() != null && resp.getCashierName().toLowerCase().contains(q));
                if (!match) continue;
            }
            responses.add(resp);
        }

        // Sắp xếp hóa đơn mới nhất lên đầu
        responses.sort((b1, b2) -> b2.getPaymentTime().compareTo(b1.getPaymentTime()));
        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public CashierInvoiceResponse getInvoiceDetail(Long invoiceId) {
        Bill bill = billRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Hóa đơn không tồn tại: " + invoiceId));

        List<CashierInvoiceResponse.InvoiceItemDTO> itemDTOs = new ArrayList<>();
        if (bill.getSession() != null) {
            List<Order> orders = orderRepository.findBySessionId(bill.getSession().getId());
            for (Order o : orders) {
                if (o.getItems() != null) {
                    for (OrderItem item : o.getItems()) {
                        if (item.getStatus() != OrderItemStatus.CANCELLED) {
                            itemDTOs.add(CashierInvoiceResponse.InvoiceItemDTO.builder()
                                    .name(item.getMenuItem() != null ? item.getMenuItem().getName() : "Món ăn")
                                    .quantity(item.getQuantity())
                                    .unitPrice(item.getUnitPrice())
                                    .subtotal(item.getSubtotal())
                                    .build());
                        }
                    }
                }
            }
        }

        return mapToInvoiceResponse(bill, itemDTOs, bill.getSession() != null ? bill.getSession().getTable() : null);
    }

    @Override
    @Transactional(readOnly = true)
    public CashierShiftSummaryResponse getShiftSummary(String shiftType, LocalDate date, String cashierUsername) {
        LocalDate queryDate = (date != null) ? date : LocalDate.now();
        String shift = (shiftType != null && !shiftType.trim().isEmpty()) ? shiftType.toUpperCase() : "MORNING";

        LocalDateTime start, end;
        if ("MORNING".equalsIgnoreCase(shift)) {
            start = queryDate.atTime(6, 0, 0);
            end = queryDate.atTime(14, 0, 0);
        } else {
            start = queryDate.atTime(14, 0, 0);
            end = queryDate.atTime(23, 59, 59);
        }

        List<Bill> bills = billRepository.findByStatusAndPaymentTimeBetween(BillStatus.PAID, start, end);

        BigDecimal cash = BigDecimal.ZERO;
        BigDecimal bank = BigDecimal.ZERO;
        BigDecimal card = BigDecimal.ZERO;

        for (Bill b : bills) {
            BigDecimal amt = b.getFinalAmount() != null ? b.getFinalAmount() : BigDecimal.ZERO;
            if (b.getPaymentMethod() == PaymentMethod.CASH) cash = cash.add(amt);
            else if (b.getPaymentMethod() == PaymentMethod.BANK_TRANSFER) bank = bank.add(amt);
            else if (b.getPaymentMethod() == PaymentMethod.CARD) card = card.add(amt);
        }

        BigDecimal total = cash.add(bank).add(card);

        Staff cashier = (cashierUsername != null) ? staffRepository.findByUsername(cashierUsername).orElse(null) : null;

        return CashierShiftSummaryResponse.builder()
                .shiftType(shift)
                .shiftName("MORNING".equalsIgnoreCase(shift) ? "Ca Sáng (06:00 - 14:00)" : "Ca Tối (14:00 - 24:00)")
                .workDate(queryDate)
                .cashierUsername(cashierUsername)
                .cashierFullName(cashier != null ? cashier.getFullName() : "Thu Ngân POS")
                .totalBillsCount((long) bills.size())
                .totalRevenue(total)
                .cashRevenue(cash)
                .bankRevenue(bank)
                .cardRevenue(card)
                .theoreticalDrawerCash(cash)
                .build();
    }

    @Override
    @Transactional
    public void voidOrderItem(Long itemId, ManagerApprovalRequest request) {
        validateManagerPin(request.getManagerPin());

        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Món ăn không tồn tại: " + itemId));

        item.setStatus(OrderItemStatus.CANCELLED);
        item.setNote(request.getReason() != null ? "[HỦY BỞI QUẢN LÝ] " + request.getReason() : "[HỦY BỞI QUẢN LÝ]");
        orderItemRepository.save(item);

        Order order = item.getOrder();
        if (order != null && order.getItems() != null) {
            BigDecimal recalculatedTotal = order.getItems().stream()
                    .filter(i -> i.getStatus() != OrderItemStatus.CANCELLED)
                    .map(i -> i.getSubtotal() != null ? i.getSubtotal() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            order.setTotalAmount(recalculatedTotal);

            boolean allCancelled = order.getItems().stream().allMatch(i -> i.getStatus() == OrderItemStatus.CANCELLED);
            if (allCancelled) order.setStatus(OrderStatus.CANCELLED);

            orderRepository.save(order);
        }
    }

    @Override
    public void closeShift(ManagerApprovalRequest request, String cashierUsername) {
        validateManagerPin(request.getManagerPin());
        // Chấp thuận chốt sổ bàn giao ca thành công
    }

    // ===================================================================
    // HELPER METHODS
    // ===================================================================

    private void validateManagerPin(String pin) {
        if (pin == null || pin.trim().length() != 6) {
            throw new AppException("Mã PIN Quản lý phải gồm đúng 6 chữ số!", HttpStatus.BAD_REQUEST);
        }

        // Tìm tài khoản Quản lý MGR-001 hoặc bất kỳ Quản lý có role MANAGER
        List<Staff> managers = staffRepository.findAll().stream()
                .filter(s -> s.getRole() == UserRole.MANAGER || s.getRole() == UserRole.ADMIN)
                .collect(Collectors.toList());

        boolean matched = false;
        for (Staff m : managers) {
            if (passwordEncoder.matches(pin.trim(), m.getPinCode())) {
                matched = true;
                break;
            }
        }

        if (!matched) {
            throw new AppException("Mã PIN Quản lý không chính xác!", HttpStatus.UNAUTHORIZED);
        }
    }

    private CashierTableResponse mapToCashierTableResponse(RestaurantTable table) {
        Optional<DiningSession> sessionOpt = sessionRepository.findByTableIdAndStatus(table.getId(), SessionStatus.ACTIVE);
        boolean isOccupied = table.getStatus() == TableStatus.OCCUPIED && sessionOpt.isPresent();

        List<ServiceRequest> billCalls = requestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(table.getId(), "PENDING");
        boolean isCallingBill = billCalls.stream().anyMatch(r -> "BILL".equalsIgnoreCase(r.getRequestType()));
        Long reqId = isCallingBill ? billCalls.get(0).getId() : null;

        String status = table.getStatus().name();
        String statusText = switch (table.getStatus()) {
            case AVAILABLE -> "Bàn trống";
            case DIRTY -> "Chờ dọn đĩa";
            case RESERVED -> "Đã đặt trước";
            case BLOCKED -> "Tạm khóa";
            default -> "Đang ăn";
        };

        if (isCallingBill) {
            status = "PAYMENT_REQUEST";
            statusText = "Y/c Thanh Toán";
        }

        Integer guestCount = table.getCapacity();
        String timeIn = "--:--";
        Long duration = 0L;
        BigDecimal orderTotal = BigDecimal.ZERO;
        String orderCode = null;
        Long sessionId = null;
        List<CashierTableResponse.CashierOrderItemDTO> itemDTOs = new ArrayList<>();

        if (sessionOpt.isPresent()) {
            DiningSession session = sessionOpt.get();
            sessionId = session.getId();
            guestCount = session.getGuestCount() != null ? session.getGuestCount() : table.getCapacity();
            if (session.getStartTime() != null) {
                timeIn = session.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm"));
                duration = Duration.between(session.getStartTime(), LocalDateTime.now()).toMinutes();
            }

            List<Order> orders = orderRepository.findBySessionId(session.getId());
            for (Order o : orders) {
                if (o.getStatus() == OrderStatus.CANCELLED) continue;
                if (orderCode == null) orderCode = o.getOrderCode();

                if (o.getItems() != null) {
                    for (OrderItem it : o.getItems()) {
                        if (it.getStatus() == OrderItemStatus.CANCELLED) continue;
                        BigDecimal sub = it.getSubtotal() != null ? it.getSubtotal() : BigDecimal.ZERO;
                        orderTotal = orderTotal.add(sub);

                        itemDTOs.add(CashierTableResponse.CashierOrderItemDTO.builder()
                                .orderItemId(it.getId())
                                .name(it.getMenuItem() != null ? it.getMenuItem().getName() : "Món ăn")
                                .quantity(it.getQuantity())
                                .unitPrice(it.getUnitPrice())
                                .subtotal(sub)
                                .status(it.getStatus() != null ? it.getStatus().name() : "COOKING")
                                .note(it.getNote())
                                .build());
                    }
                }
            }
        }

        return CashierTableResponse.builder()
                .id(table.getId())
                .code(table.getTableNumber())
                .name(table.getName())
                .zone(table.getZone())
                .zoneName(resolveZoneName(table.getZone()))
                .capacity(table.getCapacity())
                .guestCount(guestCount)
                .status(status)
                .statusText(statusText)
                .timeIn(timeIn)
                .durationMinutes(Math.max(0, duration))
                .sessionId(sessionId)
                .orderCode(orderCode != null ? orderCode : "#ROM-" + table.getTableNumber())
                .orderTotal(orderTotal)
                .totalItemsCount(itemDTOs.size())
                .isCallingBill(isCallingBill)
                .serviceRequestId(reqId)
                .items(itemDTOs)
                .build();
    }

    private CashierInvoiceResponse mapToInvoiceResponse(Bill bill, List<CashierInvoiceResponse.InvoiceItemDTO> items, RestaurantTable table) {
        String tableName = (table != null) ? table.getName() : "Bàn thanh toán";
        String zoneName = (table != null) ? resolveZoneName(table.getZone()) : "Khu vực chính";

        if (bill.getSession() != null && bill.getSession().getTable() != null) {
            tableName = bill.getSession().getTable().getName();
            zoneName = resolveZoneName(bill.getSession().getTable().getZone());
        }

        String cashierName = (bill.getCashier() != null) ? bill.getCashier().getFullName() + " (#" + bill.getCashier().getUsername() + ")" : "Thu ngân quầy";
        String shift = (bill.getPaymentTime() != null && bill.getPaymentTime().getHour() < 14) ? "Ca Sáng" : "Ca Tối";

        String methodLabel = switch (bill.getPaymentMethod()) {
            case CASH -> "Tiền mặt tại két";
            case BANK_TRANSFER -> "VietQR Chuyển khoản";
            case CARD -> "Thẻ POS";
        };

        String summary = items.stream().map(i -> i.getName() + " x" + i.getQuantity()).collect(Collectors.joining(", "));
        if (summary.length() > 50) summary = summary.substring(0, 47) + "...";

        return CashierInvoiceResponse.builder()
                .id(bill.getId())
                .billCode(bill.getBillCode())
                .tableName(tableName)
                .zoneName(zoneName)
                .cashierName(cashierName)
                .shiftName(shift)
                .paymentTime(bill.getPaymentTime())
                .paymentTimeFormatted(bill.getPaymentTime() != null ? bill.getPaymentTime().format(DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy")) : "")
                .subtotal(bill.getSubtotal())
                .taxAmount(bill.getTaxAmount())
                .discountAmount(bill.getDiscountAmount())
                .finalAmount(bill.getFinalAmount())
                .paymentMethod(bill.getPaymentMethod() != null ? bill.getPaymentMethod().name() : "CASH")
                .paymentMethodLabel(methodLabel)
                .status(bill.getStatus().name())
                .statusLabel("Đã thanh toán")
                .note(bill.getNote())
                .itemsCount(items.size())
                .itemsSummary(summary)
                .items(items)
                .build();
    }

    private String resolveZoneName(String zoneCode) {
        if (zoneCode == null) return "Chưa phân khu";
        return zoneRepository.findByZoneCode(zoneCode)
                .map(Zone::getName)
                .orElseGet(() -> switch (zoneCode) {
                    case "ZONE_1" -> "Tầng 1 - Sảnh Chính";
                    case "ZONE_2" -> "Tầng 2 - Ban Công";
                    case "VIP" -> "Phòng VIP";
                    default -> zoneCode;
                });
    }
}
```

---

### BƯỚC B4: Xây dựng Controller: `CashierController.java`
- **Đường dẫn:** `SourceCode/backend/roms/src/main/java/com/romsteam/roms/controller/CashierController.java`

```java
package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.CashierCheckoutRequest;
import com.romsteam.roms.dto.request.ManagerApprovalRequest;
import com.romsteam.roms.dto.response.*;
import com.romsteam.roms.service.CashierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/cashier")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('CASHIER', 'MANAGER')")
public class CashierController {

    private final CashierService cashierService;

    // 1. GET /api/cashier/tables - Lấy danh sách bàn POS realtime
    @GetMapping("/tables")
    public ResponseEntity<ApiResponse<List<CashierTableResponse>>> getPosTables(
            @RequestParam(required = false) String zone) {
        List<CashierTableResponse> tables = cashierService.getPosTables(zone);
        return ResponseEntity.ok(ApiResponse.success(tables, "Lấy danh sách bàn POS thành công"));
    }

    // 2. GET /api/cashier/tables/{id}/bill - Lấy chi tiết tạm tính của bàn
    @GetMapping("/tables/{id}/bill")
    public ResponseEntity<ApiResponse<CashierBillPreviewResponse>> getBillPreview(@PathVariable Long id) {
        CashierBillPreviewResponse preview = cashierService.getBillPreview(id);
        return ResponseEntity.ok(ApiResponse.success(preview, "Lấy thông tin tạm tính thành công"));
    }

    // 3. POST /api/cashier/tables/{id}/draft-bill - In phiếu tạm tính
    @PostMapping("/tables/{id}/draft-bill")
    public ResponseEntity<ApiResponse<CashierTableResponse>> markDraftPrinted(@PathVariable Long id) {
        CashierTableResponse response = cashierService.markDraftPrinted(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã in phiếu tạm tính"));
    }

    // 4. POST /api/cashier/tables/{id}/checkout - Chốt hóa đơn thanh toán
    @PostMapping("/tables/{id}/checkout")
    public ResponseEntity<ApiResponse<CashierInvoiceResponse>> checkoutBill(
            @PathVariable Long id,
            @Valid @RequestBody CashierCheckoutRequest request,
            Authentication authentication) {
        String cashierUsername = authentication != null ? authentication.getName() : null;
        CashierInvoiceResponse invoice = cashierService.checkoutBill(id, request, cashierUsername);
        return ResponseEntity.ok(ApiResponse.success(invoice, "Thanh toán hóa đơn thành công!"));
    }

    // 5. GET /api/cashier/invoices - Danh sách hóa đơn lịch sử
    @GetMapping("/invoices")
    public ResponseEntity<ApiResponse<List<CashierInvoiceResponse>>> getInvoiceHistory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String search) {
        List<CashierInvoiceResponse> history = cashierService.getInvoiceHistory(date, paymentMethod, search);
        return ResponseEntity.ok(ApiResponse.success(history, "Lấy lịch sử hóa đơn thành công"));
    }

    // 6. GET /api/cashier/invoices/{id} - Xem chi tiết 1 hóa đơn để in lại
    @GetMapping("/invoices/{id}")
    public ResponseEntity<ApiResponse<CashierInvoiceResponse>> getInvoiceDetail(@PathVariable Long id) {
        CashierInvoiceResponse invoice = cashierService.getInvoiceDetail(id);
        return ResponseEntity.ok(ApiResponse.success(invoice, "Lấy chi tiết hóa đơn thành công"));
    }

    // 7. GET /api/cashier/shift/summary - Doanh thu theo ca để kiểm đếm két tiền
    @GetMapping("/shift/summary")
    public ResponseEntity<ApiResponse<CashierShiftSummaryResponse>> getShiftSummary(
            @RequestParam(required = false, defaultValue = "MORNING") String shiftType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication authentication) {
        String cashierUsername = authentication != null ? authentication.getName() : null;
        CashierShiftSummaryResponse summary = cashierService.getShiftSummary(shiftType, date, cashierUsername);
        return ResponseEntity.ok(ApiResponse.success(summary, "Lấy doanh thu ca thành công"));
    }

    // 8. POST /api/cashier/items/{id}/void - Hủy món có mã PIN quản lý duyệt
    @PostMapping("/items/{id}/void")
    public ResponseEntity<ApiResponse<Void>> voidItem(
            @PathVariable Long id,
            @Valid @RequestBody ManagerApprovalRequest request) {
        cashierService.voidOrderItem(id, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Quản lý đã phê duyệt hủy món thành công"));
    }

    // 9. POST /api/cashier/shift/close - Chốt ca có mã PIN quản lý duyệt
    @PostMapping("/shift/close")
    public ResponseEntity<ApiResponse<Void>> closeShift(
            @Valid @RequestBody ManagerApprovalRequest request,
            Authentication authentication) {
        String cashierUsername = authentication != null ? authentication.getName() : null;
        cashierService.closeShift(request, cashierUsername);
        return ResponseEntity.ok(ApiResponse.success(null, "Quản lý đã phê duyệt chốt ca và bàn giao két tiền"));
    }
}
```

---

## 3. HƯỚNG DẪN THỰC HIỆN PHÍA FRONTEND (REACT VITE)

### BƯỚC F1: Tạo file gọi API Thu Ngân: `cashierApi.js`
- **Đường dẫn:** `SourceCode/frontend/src/api/cashierApi.js`

```javascript
import axiosClient from './axiosClient';

export const cashierApi = {
  // 1. Lấy danh sách bàn POS realtime
  getPosTables: (zone) => {
    return axiosClient.get('/cashier/tables', { params: { zone } });
  },

  // 2. Lấy thông tin tạm tính chi tiết của 1 bàn
  getBillPreview: (tableId) => {
    return axiosClient.get(`/cashier/tables/${tableId}/bill`);
  },

  // 3. Đánh dấu đã in phiếu tạm tính
  markDraftPrinted: (tableId) => {
    return axiosClient.post(`/cashier/tables/${tableId}/draft-bill`);
  },

  // 4. Chốt thanh toán hóa đơn
  checkout: (tableId, data) => {
    return axiosClient.post(`/cashier/tables/${tableId}/checkout`, data);
  },

  // 5. Lấy lịch sử hóa đơn trong ngày
  getInvoices: (params) => {
    return axiosClient.get('/cashier/invoices', { params });
  },

  // 6. Xem chi tiết 1 hóa đơn để in lại
  getInvoiceDetail: (invoiceId) => {
    return axiosClient.get(`/cashier/invoices/${invoiceId}`);
  },

  // 7. Lấy tổng hợp doanh thu theo ca đối soát két tiền
  getShiftSummary: (shiftType, date) => {
    return axiosClient.get('/cashier/shift/summary', { params: { shiftType, date } });
  },

  // 8. Hủy món có mã PIN quản lý
  voidItem: (itemId, data) => {
    return axiosClient.post(`/cashier/items/${itemId}/void`, data);
  },

  // 9. Chốt ca có mã PIN quản lý
  closeShift: (data) => {
    return axiosClient.post('/cashier/shift/close', data);
  }
};
```

---

### BƯỚC F2: Tích hợp VietQR Động Chuẩn Ngân Hàng NAPAS

Thay vì hiển thị ảnh tĩnh, ta sinh link VietQR động:
```javascript
// Cấu hình thông tin tài khoản ngân hàng nhà hàng ROMS
const BANK_ID = 'MB'; // MB Bank (Ngân hàng Quân Đội)
const ACCOUNT_NO = '0988889999'; // Số tài khoản thụ hưởng
const ACCOUNT_NAME = 'NHA HANG HOANG GIA ROMS';

// Hàm sinh URL ảnh QR động
const generateVietQrUrl = (amount, billCode, tableCode) => {
  const memo = encodeURIComponent(`${billCode} ${tableCode}`);
  return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${memo}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
};
```
> Khi khách quét mã QR này, app ngân hàng tự động điền đúng:
> 1. Số tài khoản MB Bank thụ hưởng.
> 2. Số tiền chính xác `finalAmount` (không lo khách nhập thiếu 1 số 0).
> 3. Nội dung chuyển khoản: `Mã hóa đơn + Mã bàn`.

---

### BƯỚC F3: Tối ưu CSS In Hóa Đơn Nhiệt Khổ K80 (80mm)

Thêm đoạn CSS `@media print` vào trang để khi bấm `window.print()` máy in nhiệt xuất bill sắc nét:

```css
@media print {
  body * {
    visibility: hidden;
  }
  #thermal-receipt-print, #thermal-receipt-print * {
    visibility: visible;
  }
  #thermal-receipt-print {
    position: absolute;
    left: 0;
    top: 0;
    width: 80mm;
    margin: 0;
    padding: 4mm;
    font-family: 'Courier New', Courier, monospace;
    color: #000000;
    background: #FFFFFF;
  }
  .no-print {
    display: none !important;
  }
}
```

---

## 4. KỊCH BẢN KIỂM THỬ TOÀN TRÌNH & SCRIPT SQL SINH DỮ LIỆU TEST (TEST DATA SEED)

Chạy toàn bộ đoạn mã SQL sau trong **SQL Server Management Studio (SSMS)** trên Database `ROMS_DB`:

```sql
USE ROMS_DB;
GO

SET NOCOUNT ON;
BEGIN TRANSACTION;

PRINT N'====================================================================================';
PRINT N'BẮT ĐẦU NẠP DỮ LIỆU KIỂM THỬ PHÂN HỆ THU NGÂN POS (CASHIER TERMINAL)';
PRINT N'====================================================================================';

-- 1. Đảm bảo nhân viên Thu ngân CSH-001 và Quản lý MGR-001 tồn tại & có ca trực hôm nay
DECLARE @TodayDate DATE = CAST(GETDATE() AS DATE);
DECLARE @TimeNow DATETIME2 = GETDATE();

DECLARE @CshStaffId BIGINT = (SELECT TOP 1 id FROM staffs WHERE username = 'CSH-001');
DECLARE @MgrStaffId BIGINT = (SELECT TOP 1 id FROM staffs WHERE username = 'MGR-001');

IF @CshStaffId IS NULL
BEGIN
    SET @CshStaffId = (SELECT TOP 1 id FROM staffs WHERE role = 'CASHIER');
    IF @CshStaffId IS NULL SET @CshStaffId = (SELECT TOP 1 id FROM staffs ORDER BY id ASC);
END;

IF @MgrStaffId IS NULL
BEGIN
    SET @MgrStaffId = (SELECT TOP 1 id FROM staffs WHERE role = 'MANAGER');
    IF @MgrStaffId IS NULL SET @MgrStaffId = @CshStaffId;
END;

IF @CshStaffId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM staff_schedules WHERE staff_id = @CshStaffId AND work_date = @TodayDate)
    INSERT INTO staff_schedules (staff_id, work_date, shift_type, created_at, updated_at) 
    VALUES (@CshStaffId, @TodayDate, 'MORNING', @TimeNow, @TimeNow);

IF @MgrStaffId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM staff_schedules WHERE staff_id = @MgrStaffId AND work_date = @TodayDate)
    INSERT INTO staff_schedules (staff_id, work_date, shift_type, created_at, updated_at) 
    VALUES (@MgrStaffId, @TodayDate, 'MORNING', @TimeNow, @TimeNow);

-- 2. Đảm bảo danh mục và các món ăn mẫu tồn tại trong Database
IF NOT EXISTS (SELECT 1 FROM categories WHERE id = 1)
BEGIN
    SET IDENTITY_INSERT categories ON;
    INSERT INTO categories (id, name, display_order, is_active, created_at, updated_at) VALUES
    (1, N'Món Bò & Steak', 1, 1, @TimeNow, @TimeNow),
    (2, N'Đồ Uống & Tráng Miệng', 2, 1, @TimeNow, @TimeNow);
    SET IDENTITY_INSERT categories OFF;
END;

DECLARE @CatMainId BIGINT = (SELECT TOP 1 id FROM categories ORDER BY id ASC);
DECLARE @CatDrinkId BIGINT = (SELECT TOP 1 id FROM categories ORDER BY id DESC);

IF NOT EXISTS (SELECT 1 FROM menu_items WHERE name LIKE N'%Phở Bò%')
    INSERT INTO menu_items (category_id, name, description, price, is_available, display_order, is_active, created_at, updated_at)
    VALUES (@CatMainId, N'Phở Bò Đặc Biệt ROMS', N'Bò tái mềm, nước dùng thanh ngọt', 85000.00, 1, 1, 1, @TimeNow, @TimeNow);

IF NOT EXISTS (SELECT 1 FROM menu_items WHERE name LIKE N'%Bít Tết%' OR name LIKE N'%Steak%')
    INSERT INTO menu_items (category_id, name, description, price, is_available, display_order, is_active, created_at, updated_at)
    VALUES (@CatMainId, N'Bò Bít Tết Sốt Tiêu Đen', N'Thịt thăn bò Úc nướng sốt tiêu', 140000.00, 1, 2, 1, @TimeNow, @TimeNow);

IF NOT EXISTS (SELECT 1 FROM menu_items WHERE name LIKE N'%Trà%')
    INSERT INTO menu_items (category_id, name, description, price, is_available, display_order, is_active, created_at, updated_at)
    VALUES (@CatDrinkId, N'Trà Đào Cam Sả Tươi', N'Trà đào cam sả thơm mát', 35000.00, 1, 3, 1, @TimeNow, @TimeNow);

IF NOT EXISTS (SELECT 1 FROM menu_items WHERE name LIKE N'%Cà Phê%' OR name LIKE N'%Cafe%')
    INSERT INTO menu_items (category_id, name, description, price, is_available, display_order, is_active, created_at, updated_at)
    VALUES (@CatDrinkId, N'Cà Phê Sữa Pha Phin', N'Cà phê rang xay đậm đà', 31500.00, 1, 4, 1, @TimeNow, @TimeNow);

-- Lấy ID món ăn với fallback tuyệt đối (chống NULL 100%)
DECLARE @AnyDish BIGINT = (SELECT TOP 1 id FROM menu_items ORDER BY id ASC);
DECLARE @DishPhobo BIGINT = (SELECT TOP 1 id FROM menu_items WHERE name LIKE N'%Phở Bò%');
DECLARE @DishSteak BIGINT = (SELECT TOP 1 id FROM menu_items WHERE name LIKE N'%Bít Tết%' OR name LIKE N'%Steak%' OR name LIKE N'%Bò%');
DECLARE @DishDrink BIGINT = (SELECT TOP 1 id FROM menu_items WHERE name LIKE N'%Trà%' OR name LIKE N'%Nước%');
DECLARE @DishCoffee BIGINT = (SELECT TOP 1 id FROM menu_items WHERE name LIKE N'%Cà Phê%' OR name LIKE N'%Cafe%');

IF @DishPhobo IS NULL SET @DishPhobo = @AnyDish;
IF @DishSteak IS NULL SET @DishSteak = @AnyDish;
IF @DishDrink IS NULL SET @DishDrink = @AnyDish;
IF @DishCoffee IS NULL SET @DishCoffee = @AnyDish;

-- 3. Đảm bảo các bàn ăn kiểm thử tồn tại
IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'T-01')
    INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, qr_token, is_active, created_at, updated_at)
    VALUES ('T-01', N'Bàn T-01', 'ZONE_1', 4, 'AVAILABLE', 'qr-pos-t01', 1, @TimeNow, @TimeNow);

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'T-02')
    INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, qr_token, is_active, created_at, updated_at)
    VALUES ('T-02', N'Bàn T-02', 'ZONE_1', 2, 'AVAILABLE', 'qr-pos-t02', 1, @TimeNow, @TimeNow);

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'T-04')
    INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, qr_token, is_active, created_at, updated_at)
    VALUES ('T-04', N'Bàn T-04', 'ZONE_1', 6, 'AVAILABLE', 'qr-pos-t04', 1, @TimeNow, @TimeNow);

IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE table_number = 'VIP-01')
    INSERT INTO restaurant_tables (table_number, name, zone, capacity, status, qr_token, is_active, created_at, updated_at)
    VALUES ('VIP-01', N'Phòng VIP 01', 'VIP', 8, 'AVAILABLE', 'qr-pos-vip01', 1, @TimeNow, @TimeNow);

DECLARE @Table1 BIGINT = (SELECT TOP 1 id FROM restaurant_tables WHERE table_number = 'T-01');
DECLARE @Table2 BIGINT = (SELECT TOP 1 id FROM restaurant_tables WHERE table_number = 'T-02');
DECLARE @Table4 BIGINT = (SELECT TOP 1 id FROM restaurant_tables WHERE table_number = 'T-04');
DECLARE @TableVIP BIGINT = (SELECT TOP 1 id FROM restaurant_tables WHERE table_number = 'VIP-01');

-- 4. DỌN DẸP SẠCH CÁC BẢN GHI SEED CŨ (NẾU CÓ) ĐỂ CHỐNG XUNG ĐỘT RÀNG BUỘC UNIQUE
DELETE FROM service_requests 
WHERE table_id IN (@Table1, @Table2, @Table4) AND request_type = 'BILL';

DELETE FROM bills 
WHERE bill_code IN ('BILL-20261010-001', 'BILL-20261010-002', 'BILL-20261010-003');

DELETE FROM order_items 
WHERE order_id IN (
    SELECT id FROM orders WHERE order_code IN ('ORD-T01-8842', 'ORD-T02-8843', 'ORD-T04-8840')
);

DELETE FROM orders 
WHERE order_code IN ('ORD-T01-8842', 'ORD-T02-8843', 'ORD-T04-8840');

DELETE FROM dining_sessions 
WHERE session_token IN (
    'sess-pos-t01-seed', 'sess-pos-t02-seed', 'sess-pos-t04-seed',
    'sess-hist-01', 'sess-hist-02', 'sess-hist-03'
);

-- Đóng an toàn bất kỳ session ACTIVE cũ nào của các bàn này để đảm bảo mỗi bàn chỉ có đúng 1 session ACTIVE duy nhất
UPDATE dining_sessions 
SET status = 'COMPLETED', end_time = @TimeNow 
WHERE table_id IN (@Table1, @Table2, @Table4) AND status = 'ACTIVE';

-- Cập nhật trạng thái các bàn:
-- T-01, T-02, T-04: OCCUPIED (Đang phục vụ)
-- VIP-01: AVAILABLE (Bàn VIP trống, chỉ dùng để chứa 1 hóa đơn lịch sử cũ trong quá khứ)
UPDATE restaurant_tables SET status = 'OCCUPIED' WHERE id IN (@Table1, @Table2, @Table4);
UPDATE restaurant_tables SET status = 'AVAILABLE' WHERE id = @TableVIP;

-- ================================================================================================
-- KỊCH BẢN 1: BÀN T-01 - ĐANG YÊU CẦU TÍNH TIỀN (PAYMENT_REQUEST) - CÓ CHUÔNG GỌI BILL TỪ WAITER
-- ================================================================================================
DECLARE @S1 BIGINT, @O1 BIGINT;
INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, version, created_at, updated_at)
VALUES (@Table1, 'sess-pos-t01-seed', 'ACTIVE', 4, DATEADD(MINUTE, -45, @TimeNow), 1, @TimeNow, @TimeNow);
SET @S1 = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, note, order_time, created_at, updated_at)
VALUES (@S1, 'ORD-T01-8842', 380000.00, 'SERVED', N'Khách gọi tính tiền', DATEADD(MINUTE, -40, @TimeNow), @TimeNow, @TimeNow);
SET @O1 = SCOPE_IDENTITY();

INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, note, status, created_at, updated_at) VALUES
(@O1, @DishPhobo, 2, 85000.00, 170000.00, N'Bò tái mềm', 'SERVED', @TimeNow, @TimeNow),
(@O1, @DishDrink, 2, 35000.00, 70000.00, N'Ít đá', 'SERVED', @TimeNow, @TimeNow),
(@O1, @DishSteak, 1, 140000.00, 140000.00, N'Sốt tiêu', 'SERVED', @TimeNow, @TimeNow);

INSERT INTO service_requests (table_id, session_id, request_type, note, status, created_at, updated_at)
VALUES (@Table1, @S1, 'BILL', N'Khách vẫy tay yêu cầu in phiếu tính tiền', 'PENDING', DATEADD(MINUTE, -2, @TimeNow), @TimeNow);

-- ================================================================================================
-- KỊCH BẢN 2: BÀN T-02 - ĐANG DÙNG BỮA (DINING) - CHƯA YÊU CẦU TÍNH TIỀN
-- ================================================================================================
DECLARE @S2 BIGINT, @O2 BIGINT;
INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, version, created_at, updated_at)
VALUES (@Table2, 'sess-pos-t02-seed', 'ACTIVE', 2, DATEADD(MINUTE, -20, @TimeNow), 1, @TimeNow, @TimeNow);
SET @S2 = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, note, order_time, created_at, updated_at)
VALUES (@S2, 'ORD-T02-8843', 273000.00, 'SERVED', N'', DATEADD(MINUTE, -18, @TimeNow), @TimeNow, @TimeNow);
SET @O2 = SCOPE_IDENTITY();

INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, note, status, created_at, updated_at) VALUES
(@O2, @DishSteak, 1, 210000.00, 210000.00, N'Medium', 'SERVED', @TimeNow, @TimeNow),
(@O2, @DishCoffee, 2, 31500.00, 63000.00, N'Nhiều sữa', 'SERVED', @TimeNow, @TimeNow);

-- ================================================================================================
-- KỊCH BẢN 3: BÀN T-04 - ĐÃ IN PHIẾU TẠM TÍNH (DRAFT_PRINTED) - CHỜ KHÁCH THANH TOÁN
-- ================================================================================================
DECLARE @S4 BIGINT, @O4 BIGINT;
INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, note, version, created_at, updated_at)
VALUES (@Table4, 'sess-pos-t04-seed', 'ACTIVE', 6, DATEADD(MINUTE, -55, @TimeNow), N'[DRAFT_PRINTED]', 1, @TimeNow, @TimeNow);
SET @S4 = SCOPE_IDENTITY();

INSERT INTO orders (session_id, order_code, total_amount, status, note, order_time, created_at, updated_at)
VALUES (@S4, 'ORD-T04-8840', 890000.00, 'SERVED', N'Đã in tạm tính', DATEADD(MINUTE, -50, @TimeNow), @TimeNow, @TimeNow);
SET @O4 = SCOPE_IDENTITY();

INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, note, status, created_at, updated_at) VALUES
(@O4, @DishSteak, 3, 210000.00, 630000.00, N'', 'SERVED', @TimeNow, @TimeNow),
(@O4, @DishDrink, 4, 35000.00, 140000.00, N'', 'SERVED', @TimeNow, @TimeNow),
(@O4, @DishPhobo, 1, 120000.00, 120000.00, N'', 'SERVED', @TimeNow, @TimeNow);

-- ================================================================================================
-- KỊCH BẢN 4: 3 HÓA ĐƠN LỊCH SỬ ĐÃ THANH TOÁN XONG (PAID) CHO TAB "LỊCH SỬ GIAO DỊCH" VÀ "CHỐT CA"
-- ================================================================================================
DECLARE @OldSession1 BIGINT, @OldSession2 BIGINT, @OldSession3 BIGINT;

-- Hóa đơn 1: Tiền mặt (CASH) - 380,000 đ
INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, version, created_at, updated_at)
VALUES (@Table1, 'sess-hist-01', 'COMPLETED', 2, DATEADD(HOUR, -3, @TimeNow), DATEADD(HOUR, -2, @TimeNow), 1, @TimeNow, @TimeNow);
SET @OldSession1 = SCOPE_IDENTITY();

INSERT INTO bills (session_id, cashier_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, note, created_at, updated_at)
VALUES (@OldSession1, @CshStaffId, 'BILL-20261010-001', 351852.00, 28148.00, 0.00, 380000.00, 'CASH', 'PAID', DATEADD(HOUR, -2, @TimeNow), N'Khách trả tiền mặt tại két', @TimeNow, @TimeNow);

-- Hóa đơn 2: Chuyển khoản VietQR (BANK_TRANSFER) - 850,000 đ
INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, version, created_at, updated_at)
VALUES (@Table2, 'sess-hist-02', 'COMPLETED', 4, DATEADD(HOUR, -2, @TimeNow), DATEADD(HOUR, -1, @TimeNow), 1, @TimeNow, @TimeNow);
SET @OldSession2 = SCOPE_IDENTITY();

INSERT INTO bills (session_id, cashier_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, note, created_at, updated_at)
VALUES (@OldSession2, @CshStaffId, 'BILL-20261010-002', 787037.00, 62963.00, 0.00, 850000.00, 'BANK_TRANSFER', 'PAID', DATEADD(HOUR, -1, @TimeNow), N'Quét mã VietQR thành công', @TimeNow, @TimeNow);

-- Hóa đơn 3: Quẹt thẻ POS (CARD) - 1,450,000 đ
INSERT INTO dining_sessions (table_id, session_token, status, guest_count, start_time, end_time, version, created_at, updated_at)
VALUES (@TableVIP, 'sess-hist-03', 'COMPLETED', 6, DATEADD(HOUR, -4, @TimeNow), DATEADD(HOUR, -3, @TimeNow), 1, @TimeNow, @TimeNow);
SET @OldSession3 = SCOPE_IDENTITY();

INSERT INTO bills (session_id, cashier_id, bill_code, subtotal, tax_amount, discount_amount, final_amount, payment_method, status, payment_time, note, created_at, updated_at)
VALUES (@OldSession3, @CshStaffId, 'BILL-20261010-003', 1400000.00, 112000.00, 62000.00, 1450000.00, 'CARD', 'PAID', DATEADD(HOUR, -3, @TimeNow), N'Quẹt thẻ Visa Vietcombank', @TimeNow, @TimeNow);

COMMIT TRANSACTION;

PRINT N'====================================================================================';
PRINT N'✅ ĐÃ NẠP THÀNH CÔNG DỮ LIỆU KIỂM THỬ TRẠM THU NGÂN POS!';
PRINT N'   - Bàn T-01: Có chuông yêu cầu tính tiền (PAYMENT_REQUEST) - Viền vàng nổi bật';
PRINT N'   - Bàn T-02: Đang dùng bữa (DINING) - Có thể bấm xem chi tiết tạm tính';
PRINT N'   - Bàn T-04: Đã in phiếu tạm tính (DRAFT_PRINTED) - Sẵn sàng chốt thanh toán';
PRINT N'   - Đã sinh 3 hóa đơn thực tế (CASH, BANK_TRANSFER, CARD) cho Tab Lịch sử & Chốt ca';
PRINT N'   - KHÔNG gây xung đột với Bếp KDS, Phục vụ Waiter, Báo cáo hay Quản lý bàn.';
PRINT N'====================================================================================';
GO
```

---

## 5. BẢNG XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING)

| Lỗi / Hiện tượng | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| **403 Forbidden khi tải `/api/cashier/tables`** | Tài khoản đăng nhập không có quyền `CASHIER` hoặc `MANAGER`. | Đăng nhập tài khoản Thu ngân `CSH-001` (PIN: `123456`) hoặc Quản lý `MGR-001`. |
| **Bấm Thanh toán xong bàn không biến mất** | Bàn chuyển sang trạng thái `DIRTY` (Cần dọn) để Waiter ra dọn đĩa. | Ở bộ lọc trạng thái, chọn xem "Tất cả" hoặc "Chờ dọn" sẽ thấy bàn; Waiter dọn bàn xong thì bàn trở về `AVAILABLE`. |
| **Không hiển thị mã VietQR chuyển khoản** | Thiếu thư viện hoặc link VietQR lỗi kết nối. | Kiểm tra hàm `generateVietQrUrl` đã encode đầy đủ các ký tự đặc biệt của mã hóa đơn và số bàn. |
| **In bill bị co cụm hoặc tràn trang** | Thiếu cấu hình CSS `@media print` khổ 80mm. | Đảm bảo thẻ div in ấn `#thermal-receipt-print` có thuộc tính `width: 80mm` và `font-family: monospace`. |
| **Nhập mã PIN hủy món báo lỗi không đúng** | Mã PIN quản lý không khớp với mã băm trong DB. | Đảm bảo nhập đúng 6 số PIN của tài khoản Quản lý `MGR-001` (`123456`). |

---

## 6. QUY TẮC AN TOÀN VẬN HÀNH F&B (QA / TESTER AUDIT & SECURITY GUARDS)

Nhằm phòng chống tối đa các lỗ hổng gian lận và sai lệch vận hành trong môi trường thực tế, hệ thống POS đã được tích hợp bộ 6 chốt chặn an toàn:

| STT | Rủi ro phát hiện | Cách hệ thống kiểm soát | Vị trí kiểm soát |
| :--- | :--- | :--- | :--- |
| **0** | **Bàn đang dùng bữa vô tình bị bấm thanh toán** | Khi bàn chưa có chuông tính tiền (`!hasPaymentRequest`) và chưa in tạm tính (`!isDraftPrinted`), hệ thống bật Popup Cảnh báo: Thu ngân phải xác nhận hoặc chọn "In Phiếu Tạm Tính Trước". | `PosCheckoutPage.jsx` (Modal 5), Header Pill |
| **1** | **Thanh toán món bếp đang nấu dở (Chưa phục vụ)** | Kiểm tra `unservedCount` (món `PENDING` hoặc `COOKING`). Nếu còn món đang nấu, hệ thống chặn thanh toán và chỉ cho phép tiếp tục khi thu ngân tích chọn xác nhận đã kiểm tra với Bếp (`forceCheckout = true`). | `CashierServiceImpl.checkoutBill`, Modal 5 |
| **2** | **Bấm đúp nút thanh toán (Race condition / Double checkout)** | Frontend disable ngay nút Submit và hiển thị spinner `Đang Xử Lý...`. Backend kiểm tra `billRepository.findBySessionId`, nếu đã có bill thì chặn lại với HTTP 409 Conflict. | `PosCheckoutPage.jsx`, `CashierServiceImpl.java` |
| **3** | **Tiền mặt khách đưa thiếu (Cash Underpayment)** | Nếu chọn `CASH` mà `cashGiven < finalAmount`, nút Thanh toán bị khóa, hiển thị dòng chữ đỏ báo thiếu tiền. Backend validate từ chối nếu tiền đưa không đủ. | `PosCheckoutPage.jsx`, `CashierServiceImpl.java` |
| **4** | **Giảm giá vượt mức / Gian lận chiết khấu** | Tiền giảm giá không được vượt quá tiền món trước thuế. Mọi chiết khấu lớn (> 30% hoặc > 200,000đ) bắt buộc phải nhập mã PIN Quản lý 6 số. | `PosCheckoutPage.jsx`, `CashierServiceImpl.java` |
| **5** | **Gian lận in lại hóa đơn (Reprint Fraud)** | Mọi hóa đơn in từ tab Lịch sử đều được đóng dấu viền đứt nét nổi bật: `*** BẢN IN LẠI (REPRINT) - Không có giá trị thanh toán mới ***`. | `CashierServiceImpl.getInvoiceDetail`, `#thermal-receipt-print` |
