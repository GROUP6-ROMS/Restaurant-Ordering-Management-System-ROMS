package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "staffs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tên đăng nhập / Mã nhân viên (ví dụ: MGR-001, EMP-001)
    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    // Mã PIN 6 chữ số băm BCrypt (không dùng password thông thường)
    @Column(name = "pin_code", nullable = false, length = 255)
    private String pinCode;

    // Họ và tên đầy đủ nhân viên (hỗ trợ tiếng Việt Unicode)
    @Column(name = "full_name", nullable = false, columnDefinition = "NVARCHAR(100)")
    private String fullName;

    // Số điện thoại liên hệ
    @Column(name = "phone", length = 15)
    private String phone;

    // Email liên hệ / phục vụ gửi mã OTP khôi phục mã PIN Quản lý
    @Column(name = "email", length = 100)
    private String email;

    // Vai trò (MANAGER, WAITER, KITCHEN, CASHIER)
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private UserRole role;

    // Trạng thái tài khoản (true = hoạt động, false = khóa/nghỉ việc)
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Trạng thái thực tế có đang trực trong ca hay không (true sau khi login, false sau khi logout)
    @Builder.Default
    @Column(name = "is_on_shift", nullable = false, columnDefinition = "BIT DEFAULT 0")
    private Boolean isOnShift = false;

    // Số lần nhập sai mã PIN liên tiếp (tự động khóa sau 5 lần)
    @Builder.Default
    @Column(name = "failed_pin_attempts", nullable = false, columnDefinition = "INT DEFAULT 0")
    private Integer failedPinAttempts = 0;

    // Thời điểm tài khoản bị khóa do nhập sai mã PIN quá 5 lần
    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ===================================================================
    // HELPER METHODS PHỤC VỤ BẢO MẬT CHỐNG BRUTE-FORCE MÃ PIN
    // ===================================================================

    public boolean isLocked() {
        return !Boolean.TRUE.equals(this.isActive) || (this.failedPinAttempts != null && this.failedPinAttempts >= 5);
    }

    public void recordFailedAttempt() {
        int current = (this.failedPinAttempts != null ? this.failedPinAttempts : 0) + 1;
        this.failedPinAttempts = current;
        if (current >= 5) {
            this.isActive = false;
            this.isOnShift = false;
            this.lockedAt = LocalDateTime.now();
        }
    }

    public void resetFailedAttempts() {
        this.failedPinAttempts = 0;
        this.lockedAt = null;
    }

    public void unlock() {
        this.isActive = true;
        this.failedPinAttempts = 0;
        this.lockedAt = null;
    }
}
