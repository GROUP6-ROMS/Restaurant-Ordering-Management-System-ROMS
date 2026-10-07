package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

// Khai bao lop nay la mot Entity tuong ung voi mot bang trong CSDL
@Entity
@Table(name = "staffs") // Ten bang luu tru trong SQL Server
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Staff {

    // Khoa chinh tu tang (IDENTITY trong SQL Server)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Ten dang nhap (bat buoc, duy nhat, khong trung lap giua cac nhan vien)
    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    // Ma PIN 6 so cua nhan vien (duoc ma hoa BCrypt, bat buoc de dang nhap ca lam viec)
    @Column(name = "pin_code", nullable = false, length = 255)
    private String pinCode;

    // Ho va ten day du cua nhan vien
    @Column(name = "full_name", nullable = false, columnDefinition = "NVARCHAR(100)")
    private String fullName;

    // So dien thoai lien he
    @Column(name = "phone", length = 15)
    private String phone;

    // Vai tro cua nhan vien (luu duoi dang chuoi chu trong DB: MANAGER, WAITER, KITCHEN, CASHIER)
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private UserRole role;

    // Trang thai tai khoan: true = dang lam viec, false = da nghi viec hoac bi khoa tai khoan
    @Builder.Default
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
}
