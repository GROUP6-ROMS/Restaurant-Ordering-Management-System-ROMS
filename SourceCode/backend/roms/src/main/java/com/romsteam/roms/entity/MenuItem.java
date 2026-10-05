package com.romsteam.roms.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// Khai bao Entity dai dien cho bang mon an
@Entity
@Table(name = "menu_items") // Ten bang trong SQL Server
public class MenuItem {

    // Khoa chinh tu tang
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Khoa ngoai tro den danh muc (Mot danh muc co nhieu mon an -> @ManyToOne)
    // FetchType.LAZY: Toi uu hieu nang, chi load Category khi goi menuItem.getCategory()
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    // Ten mon an (vi du: "Bo bit tet sot tieu den", "Tra dao cam sa")
    @Column(name = "name", nullable = false, length = 150)
    private String name;

    // Mo ta chi tiet mon an (thanh phan, huong vi...)
    @Column(name = "description", length = 500)
    private String description;

    // Gia ban niem yet (Dung BigDecimal de tranh loi sai so lam tron so thuc trong thanh toan)
    // precision = 12, scale = 2 ho tro so tien toi hang tram ty, kem 2 chu so thap phan
    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    // Duong dan hinh anh mon an (URL CDN hoac duong dan file anh upload)
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    // Trang thai con mon hay het mon: true = con hang phuc vu, false = het hang (hien thi sold-out tren menu)
    @Column(name = "is_available", nullable = false)
    private Boolean isAvailable = true;

    // Thu tu hien thi mon an trong danh muc
    @Column(name = "display_order")
    private Integer displayOrder = 0;

    // Mon an co dang duoc kinh doanh khong (false = ngung kinh doanh vinh vien, an hoan toan)
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Thoi diem tao mon an
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thoi diem sua doi mon an gan nhat
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ===================================================================
    // CONSTRUCTORS (HAM KHOI TAO)
    // ===================================================================

    // Constructor mac dinh khong tham so (bat buoc cho Hibernate/JPA)
    public MenuItem() {
    }

    // Constructor day du tham so
    public MenuItem(Long id, Category category, String name, String description, BigDecimal price, String imageUrl, Boolean isAvailable, Integer displayOrder, Boolean isActive, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.category = category;
        this.name = name;
        this.description = description;
        this.price = price;
        this.imageUrl = imageUrl;
        this.isAvailable = isAvailable != null ? isAvailable : true;
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

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
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

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Boolean getIsAvailable() {
        return isAvailable;
    }

    public void setIsAvailable(Boolean isAvailable) {
        this.isAvailable = isAvailable;
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
