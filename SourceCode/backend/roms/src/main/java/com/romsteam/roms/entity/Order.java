package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.OrderStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// Khai bao Entity dai dien cho bang dot goi mon
@Entity
@Table(name = "orders") // Bang orders trong CSDL
public class Order {

    // Khoa chinh dot goi mon
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Khoa ngoai tro sang phien an: Mot phien an (ban ngoi) co the goi nhieu dot mon khac nhau
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private DiningSession session;

    // Khoa ngoai tro sang nhan vien tiep nhan don (null neu do khach tu quet QR dat)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private Staff staff;

    // Ma don goi mon hien thi than thien (vi du: "ORD-20261004-001")
    @Column(name = "order_code", nullable = false, unique = true, length = 50)
    private String orderCode;

    // Tong tien cua rieng dot goi mon nay (tong cong cac subtotal cua cac mon)
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    // Trang thai tong quat cua dot order (SUBMITTED, CONFIRMED, COOKING...)
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OrderStatus status = OrderStatus.SUBMITTED;

    // Ghi chu chung cua dot goi mon (vi du: "Lam nhanh giup ban dang voi")
    @Column(name = "note", length = 255)
    private String note;

    // Thoi diem khach bam gui goi mon
    @Column(name = "order_time", nullable = false)
    private LocalDateTime orderTime;

    // Quan he 1 - Nhieu: Mot dot goi mon co danh sach nhieu mon chi tiet (OrderItem)
    // cascade = CascadeType.ALL: Khi luu Order thi tu dong luu toan bo OrderItem ben trong
    // orphanRemoval = true: Khi xoa mot mon khoi danh sach items, Hibernate tu xoa ban ghi do trong CSDL
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    // Thoi diem tao ban ghi
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thoi diem cap nhat don gan nhat
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ===================================================================
    // CONSTRUCTORS (HAM KHOI TAO)
    // ===================================================================

    // Constructor mac dinh khong tham so (bat buoc cho Hibernate/JPA)
    public Order() {
        this.totalAmount = BigDecimal.ZERO;
        this.status = OrderStatus.SUBMITTED;
        this.items = new ArrayList<>();
    }

    // Constructor day du tham so
    public Order(Long id, DiningSession session, Staff staff, String orderCode, BigDecimal totalAmount, OrderStatus status, String note, LocalDateTime orderTime, List<OrderItem> items, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.session = session;
        this.staff = staff;
        this.orderCode = orderCode;
        this.totalAmount = totalAmount != null ? totalAmount : BigDecimal.ZERO;
        this.status = status != null ? status : OrderStatus.SUBMITTED;
        this.note = note;
        this.orderTime = orderTime;
        this.items = items != null ? items : new ArrayList<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // ===================================================================
    // PHUONG THUC TIEN ICH QUAN LY QUAN HE 2 CHIEU
    // ===================================================================

    // Them mot mon vao dot goi mon va tu dong gan quan he 2 chieu
    public void addOrderItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
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

    public Staff getStaff() {
        return staff;
    }

    public void setStaff(Staff staff) {
        this.staff = staff;
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDateTime getOrderTime() {
        return orderTime;
    }

    public void setOrderTime(LocalDateTime orderTime) {
        this.orderTime = orderTime;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public void setItems(List<OrderItem> items) {
        this.items = items;
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
