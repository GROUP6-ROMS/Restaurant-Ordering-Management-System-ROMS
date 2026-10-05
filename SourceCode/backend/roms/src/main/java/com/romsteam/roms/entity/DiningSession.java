package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.SessionStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

// Khai bao Entity dai dien cho bang phien an
@Entity
@Table(name = "dining_sessions") // Bang phien an trong CSDL
public class DiningSession {

    // Khoa chinh phien an
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Khoa ngoai tro sang bang ban an: Nhieu phien an dien ra tai 1 ban o cac thoi diem khac nhau
    // FetchType.LAZY: Chi tai thong tin ban khi thuc su goi getTable() de tang toc do truy van
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", nullable = false)
    private RestaurantTable table;

    // Token dinh danh phien an cap cho dien thoai cua khach sau khi quet QR (luu o localStorage)
    @Column(name = "session_token", nullable = false, unique = true, length = 100)
    private String sessionToken;

    // Trang thai phien an: ACTIVE, COMPLETED, CANCELLED
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SessionStatus status = SessionStatus.ACTIVE;

    // So luong khach thuc te ngoi tai ban
    @Column(name = "guest_count")
    private Integer guestCount;

    // Ghi chu chung cua ca ban (vi du: "Co tre em, khong an cay")
    @Column(name = "note", length = 255)
    private String note;

    // Thoi diem bat dau phien an (luc khach quet QR hoac nhan vien mo ban)
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    // Thoi diem ket thuc phien an (sau khi thu ngan thanh toan xong)
    @Column(name = "end_time")
    private LocalDateTime endTime;

    // Khoa lac quan (Optimistic Locking): Tu tang so phien ban khi UPDATE,
    // chong xung dot khi 2 nguoi cung thao tac dong thoi (khach dat mon cung luc thu ngan dong ban)
    @Version
    @Column(name = "version")
    private Long version;

    // Thoi diem ghi nhan vao CSDL
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thoi diem cap nhat du lieu gan nhat
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ===================================================================
    // CONSTRUCTORS (HAM KHOI TAO)
    // ===================================================================

    // Constructor mac dinh khong tham so (bat buoc cho Hibernate/JPA)
    public DiningSession() {
    }

    // Constructor day du tham so
    public DiningSession(Long id, RestaurantTable table, String sessionToken, SessionStatus status, Integer guestCount, String note, LocalDateTime startTime, LocalDateTime endTime, Long version, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.table = table;
        this.sessionToken = sessionToken;
        this.status = status != null ? status : SessionStatus.ACTIVE;
        this.guestCount = guestCount;
        this.note = note;
        this.startTime = startTime;
        this.endTime = endTime;
        this.version = version;
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

    public String getSessionToken() {
        return sessionToken;
    }

    public void setSessionToken(String sessionToken) {
        this.sessionToken = sessionToken;
    }

    public SessionStatus getStatus() {
        return status;
    }

    public void setStatus(SessionStatus status) {
        this.status = status;
    }

    public Integer getGuestCount() {
        return guestCount;
    }

    public void setGuestCount(Integer guestCount) {
        this.guestCount = guestCount;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
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
