package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.BillStatus;
import com.romsteam.roms.entity.enums.PaymentMethod;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// Khai bao Entity dai dien cho hoa don thanh toan
@Entity
@Table(name = "bills") // Ten bang bills trong SQL Server
public class Bill {

    // Khoa chinh hoa don
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Quan he 1 - 1 voi phien an: Moi phien an (ban an) sau khi ket thuc co dung 1 hoa don thanh toan
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false, unique = true)
    private DiningSession session;

    // Khoa ngoai tro sang nhan vien thu ngan chot hoa don (Staff)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cashier_id")
    private Staff cashier;

    // Ma so hoa don hien thi tren bill in (vi du: "BILL-20261004-0001") - Duy nhat
    @Column(name = "bill_code", nullable = false, unique = true, length = 50)
    private String billCode;

    // Tong tien tam tinh truoc thue & giam gia (tong tien tat ca cac mon an trong phien)
    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    // Tien thue VAT (vi du: 8% hoac 10% neu co)
    @Column(name = "tax_amount", precision = 12, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    // So tien giam gia hoac chiet khau khuyen mai (neu co)
    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    // Tong so tien thuc te khach can thanh toan: finalAmount = subtotal + taxAmount - discountAmount
    @Column(name = "final_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal finalAmount;

    // Phuong thuc thanh toan khach da su dung (CASH, BANK_TRANSFER, CARD)
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 30)
    private PaymentMethod paymentMethod;

    // Trang thai hoa don (UNPAID: tam tinh, PAID: da tra tien, CANCELLED: huy)
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BillStatus status = BillStatus.UNPAID;

    // Thoi diem khach thanh toan xong tien
    @Column(name = "payment_time")
    private LocalDateTime paymentTime;

    // Ghi chu cua thu ngan tren hoa don (vi du: "Khach VIP giam 10%", "Tra thua tien bo")
    @Column(name = "note", length = 255)
    private String note;

    // Thoi diem tao hoa don trong he thong
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thoi diem cap nhat hoa don gan nhat
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ===================================================================
    // CONSTRUCTORS (HAM KHOI TAO)
    // ===================================================================

    // Constructor mac dinh khong tham so (bat buoc cho Hibernate/JPA)
    public Bill() {
        this.taxAmount = BigDecimal.ZERO;
        this.discountAmount = BigDecimal.ZERO;
        this.status = BillStatus.UNPAID;
    }

    // Constructor day du tham so
    public Bill(Long id, DiningSession session, Staff cashier, String billCode, BigDecimal subtotal, BigDecimal taxAmount, BigDecimal discountAmount, BigDecimal finalAmount, PaymentMethod paymentMethod, BillStatus status, LocalDateTime paymentTime, String note, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.session = session;
        this.cashier = cashier;
        this.billCode = billCode;
        this.subtotal = subtotal;
        this.taxAmount = taxAmount != null ? taxAmount : BigDecimal.ZERO;
        this.discountAmount = discountAmount != null ? discountAmount : BigDecimal.ZERO;
        this.finalAmount = finalAmount;
        this.paymentMethod = paymentMethod;
        this.status = status != null ? status : BillStatus.UNPAID;
        this.paymentTime = paymentTime;
        this.note = note;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // ===================================================================
    // GETTERS & SETTERS (PHUONG THUC DOC VA GHI DU LIEU)
    // ===================================================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public DiningSession getSession() {
        return session;
    }

    public void setSession(DiningSession session) {
        this.session = session;
    }

    public Staff getCashier() {
        return cashier;
    }

    public void setCashier(Staff cashier) {
        this.cashier = cashier;
    }

    public String getBillCode() {
        return billCode;
    }

    public void setBillCode(String billCode) {
        this.billCode = billCode;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getFinalAmount() {
        return finalAmount;
    }

    public void setFinalAmount(BigDecimal finalAmount) {
        this.finalAmount = finalAmount;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public BillStatus getStatus() {
        return status;
    }

    public void setStatus(BillStatus status) {
        this.status = status;
    }

    public LocalDateTime getPaymentTime() {
        return paymentTime;
    }

    public void setPaymentTime(LocalDateTime paymentTime) {
        this.paymentTime = paymentTime;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
