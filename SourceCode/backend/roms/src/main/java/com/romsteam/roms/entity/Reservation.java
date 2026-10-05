package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.ReservationStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

// Khai bao Entity dai dien cho bang dat ban truoc
@Entity
@Table(name = "reservations") // Ten bang reservations trong CSDL
public class Reservation {

    // Khoa chinh phieu dat ban
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Ban an duoc chi dinh giu cho truoc cho khach (co the de null luc khach moi gui don PENDING)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id")
    private RestaurantTable table;

    // Ho ten cua nguoi lien he dat ban
    @Column(name = "customer_name", nullable = false, length = 100)
    private String customerName;

    // So dien thoai lien he xac nhan dat ban
    @Column(name = "customer_phone", nullable = false, length = 15)
    private String customerPhone;

    // Email nhan thong tin xac nhan dat ban (tuy chon)
    @Column(name = "customer_email", length = 100)
    private String customerEmail;

    // So luong nguoi di cung trong nhom khach
    @Column(name = "guest_count", nullable = false)
    private Integer guestCount;

    // Ngay va gio khach hen den nha hang an uong
    @Column(name = "reservation_time", nullable = false)
    private LocalDateTime reservationTime;

    // Trang thai phieu dat ban: PENDING, CONFIRMED, COMPLETED, CANCELLED
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ReservationStatus status = ReservationStatus.PENDING;

    // Ghi chu cua khach hang khi dat ban (vi du: "Can ghe tre em", "To chuc sinh nhat")
    @Column(name = "note", length = 255)
    private String note;

    // Ly do huy ban (neu khach huy hoac quan tu choi nhan)
    @Column(name = "cancel_reason", length = 255)
    private String cancelReason;

    // Thoi diem khach gui don dat ban len he thong
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thoi diem nhan vien cap nhat thong tin phieu hen gan nhat
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ===================================================================
    // CONSTRUCTORS (HAM KHOI TAO)
    // ===================================================================

    // Constructor mac dinh khong tham so (bat buoc cho Hibernate/JPA)
    public Reservation() {
        this.status = ReservationStatus.PENDING;
    }

    // Constructor day du tham so
    public Reservation(Long id, RestaurantTable table, String customerName, String customerPhone, String customerEmail, Integer guestCount, LocalDateTime reservationTime, ReservationStatus status, String note, String cancelReason, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.table = table;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.customerEmail = customerEmail;
        this.guestCount = guestCount;
        this.reservationTime = reservationTime;
        this.status = status != null ? status : ReservationStatus.PENDING;
        this.note = note;
        this.cancelReason = cancelReason;
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

    public RestaurantTable getTable() {
        return table;
    }

    public void setTable(RestaurantTable table) {
        this.table = table;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public Integer getGuestCount() {
        return guestCount;
    }

    public void setGuestCount(Integer guestCount) {
        this.guestCount = guestCount;
    }

    public LocalDateTime getReservationTime() {
        return reservationTime;
    }

    public void setReservationTime(LocalDateTime reservationTime) {
        this.reservationTime = reservationTime;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getCancelReason() {
        return cancelReason;
    }

    public void setCancelReason(String cancelReason) {
        this.cancelReason = cancelReason;
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
