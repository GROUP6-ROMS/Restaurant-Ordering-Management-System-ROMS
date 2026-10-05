package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.UserRole;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

// Khai bao lop nay la mot Entity tuong ung voi mot bang trong CSDL
@Entity
@Table(name = "staffs") // Ten bang luu tru trong SQL Server
public class Staff {

    // Khoa chinh tu tang (IDENTITY trong SQL Server)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Ten dang nhap (bat buoc, duy nhat, khong trung lap giua cac nhan vien)
    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    // Mat khau da ma hoa theo chuan BCrypt (bat buoc, khong bao gio luu mat khau goc)
    @Column(name = "password", nullable = false, length = 255)
    private String password;

    // Ho va ten day du cua nhan vien
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    // So dien thoai lien he
    @Column(name = "phone", length = 15)
    private String phone;

    // Vai tro cua nhan vien (luu duoi dang chuoi chu trong DB: MANAGER, WAITER, KITCHEN, CASHIER)
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private UserRole role;

    // Trang thai tai khoan: true = dang lam viec, false = da nghi viec hoac bi khoa tai khoan
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Thoi diem tao tai khoan (Hibernate tu dong dien gia tri luc thuc hien lenh INSERT)
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thoi diem sua doi thong tin gan nhat (Hibernate tu dong cap nhat luc chay lenh UPDATE)
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ===================================================================
    // CONSTRUCTORS (HAM KHOI TAO)
    // ===================================================================

    // Constructor mac dinh khong tham so (JPA va Hibernate bat buoc phai co de tao doi tuong khi truy van)
    public Staff() {
    }

    // Constructor day du tham so
    public Staff(Long id, String username, String password, String fullName, String phone, UserRole role, Boolean isActive, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.fullName = fullName;
        this.phone = phone;
        this.role = role;
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

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
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
