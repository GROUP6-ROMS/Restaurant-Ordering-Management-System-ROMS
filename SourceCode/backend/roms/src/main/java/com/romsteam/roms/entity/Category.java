package com.romsteam.roms.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

// Khai bao day la mot Entity anh xa vao bang CSDL
@Entity
@Table(name = "categories") // Ten bang luu tru trong SQL Server
public class Category {

    // Khoa chinh tu tang (IDENTITY)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Ten danh muc (ho tro tieng Viet Unicode co dau)
    @Column(name = "name", nullable = false, unique = true, columnDefinition = "NVARCHAR(100)")
    private String name;

    // Mo ta ngan gon ve danh muc mon an
    @Column(name = "description", columnDefinition = "NVARCHAR(255)")
    private String description;

    // Thu tu hien thi tren thanh Menu giao dien khach hang (so nho dung truoc: 1, 2, 3...)
    @Column(name = "display_order")
    private Integer displayOrder = 0;

    // Trang thai danh muc: true = dang hoat dong/hien thi, false = tam an khoi menu
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Thoi diem tao danh muc (Hibernate tu dong gan luc INSERT)
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thoi diem cap nhat danh muc gan nhat (Hibernate tu dong gan luc UPDATE)
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ===================================================================
    // CONSTRUCTORS (HAM KHOI TAO)
    // ===================================================================

    // Constructor mac dinh khong tham so (bat buoc cho Hibernate/JPA)
    public Category() {
    }

    // Constructor day du tham so
    public Category(Long id, String name, String description, Integer displayOrder, Boolean isActive, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.displayOrder = displayOrder != null ? displayOrder : 0;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
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
