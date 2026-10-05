package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.TableStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

// Khai bao Entity dai dien cho bang ban an
@Entity
@Table(name = "restaurant_tables") // Tranh dung tu 'table' vi la tu khoa cam trong SQL
public class RestaurantTable {

    // Khoa chinh cua ban
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // So hieu hoac ten ban (vi du: "Ban 01", "VIP 1") - Duy nhat, khong trung lap
    @Column(name = "table_number", nullable = false, unique = true, length = 30)
    private String tableNumber;

    // Suc chua so luong khach toi da cua ban (vi du: 4 cho, 8 cho)
    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    // Trang thai hien tai cua ban (AVAILABLE, OCCUPIED, DIRTY, RESERVED)
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TableStatus status = TableStatus.AVAILABLE;

    // Ma token bi mat gan voi ma QR dan tren ban (chong khach o nha tu doan URL vao dat mon)
    @Column(name = "qr_token", length = 255)
    private String qrToken;

    // Ban co dang mo phuc vu khong (true = dang dung, false = tam khoa bao tri/cat kho)
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Thoi diem tao ban trong he thong
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thoi diem cap nhat trang thai ban gan nhat
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ===================================================================
    // CONSTRUCTORS (HAM KHOI TAO)
    // ===================================================================

    // Constructor mac dinh khong tham so (bat buoc cho Hibernate/JPA)
    public RestaurantTable() {
    }

    // Constructor day du tham so
    public RestaurantTable(Long id, String tableNumber, Integer capacity, TableStatus status, String qrToken, Boolean isActive, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.tableNumber = tableNumber;
        this.capacity = capacity;
        this.status = status != null ? status : TableStatus.AVAILABLE;
        this.qrToken = qrToken;
        this.isActive = isActive != null ? isActive : true;
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

    public String getTableNumber() {
        return tableNumber;
    }

    public void setTableNumber(String tableNumber) {
        this.tableNumber = tableNumber;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public TableStatus getStatus() {
        return status;
    }

    public void setStatus(TableStatus status) {
        this.status = status;
    }

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
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
