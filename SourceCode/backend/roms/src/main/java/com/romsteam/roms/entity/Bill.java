package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.PaymentMethod;
import com.romsteam.roms.entity.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;
/**
 * Entity đại diện cho hóa đơn thanh toán của một phiên ăn (DiningSession).
 */
@Entity
@Table(name = "bills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // QUAN HỆ 1 - 1: Mỗi phiên ăn chỉ có 1 Hóa đơn duy nhất
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false, unique = true)
    private DiningSession session;

    // Thu ngân nào là người lập và thu tiền hóa đơn này (Staff có role CASHIER/MANAGER)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cashier_id", nullable = false)
    private Staff cashier;

    // Mã số hóa đơn để in ra phiếu tính tiền (ví dụ: "BILL-20260930-001")
    @Column(name = "bill_number", nullable = false, unique = true, length = 50)
    private String billNumber;

    // Tổng tiền thức ăn trước thuế (Tổng các món có trạng thái SERVED - BR-09, BR-10)
    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    // Tiền thuế VAT (nếu có, ví dụ 8% hoặc 10%)
    @Builder.Default
    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    // Tổng tiền khách phải trả thực tế = subtotal + taxAmount - discountAmount
    @Column(name = "final_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal finalAmount;

    // Hình thức thanh toán: CASH, BANK_TRANSFER, hoặc CARD (khớp màn hình POS)
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod;

    // Trạng thái thanh toán: PENDING, PAID, FAILED
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    // Mã giao dịch từ cổng thanh toán / ngân hàng (nếu thanh toán online) để đối soát
    @Column(name = "transaction_id", length = 100)
    private String transactionId;

    // Thời điểm khách thanh toán thành công
    @Column(name = "paid_at")
    private LocalDateTime paidAt;
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

