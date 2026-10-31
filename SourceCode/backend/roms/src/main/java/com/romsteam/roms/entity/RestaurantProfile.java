package com.romsteam.roms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity lưu trữ thông tin cấu hình thương hiệu và nhà hàng (ROMS Restaurant Profile).
 * Được quản lý bởi Quản lý (MANAGER) và công khai cho toàn bộ hệ thống khách hàng, POS, KDS.
 */
@Entity
@Table(name = "restaurant_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tên đầy đủ trên hóa đơn / giấy phép kinh doanh
    @Column(name = "name", nullable = false, columnDefinition = "NVARCHAR(150)")
    private String name;

    // Tên thương hiệu nhận diện ngắn gọn (Ví dụ: ROMS Bistro & Dining)
    @Column(name = "brand_name", nullable = false, columnDefinition = "NVARCHAR(100)")
    private String brandName;

    // Khẩu hiệu thương hiệu
    @Column(name = "tagline", columnDefinition = "NVARCHAR(255)")
    private String tagline;

    // Địa chỉ quán
    @Column(name = "address", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String address;

    // Số điện thoại / Hotline đặt bàn
    @Column(name = "phone", nullable = false, length = 30)
    private String phone;

    // Mã số thuế
    @Column(name = "tax_code", length = 30)
    private String taxCode;

    // Tên mạng WiFi quán
    @Column(name = "wifi_name", length = 100)
    private String wifiName;

    // Mật khẩu WiFi quán
    @Column(name = "wifi_password", length = 100)
    private String wifiPassword;

    // Lời chúc ở chân trang / chân hóa đơn
    @Column(name = "footer_message", columnDefinition = "NVARCHAR(255)")
    private String footerMessage;

    // Đường dẫn ảnh logo thương hiệu (URL online hoặc asset)
    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    // Tên chủ tài khoản nhận tiền chuyển khoản (đồng bộ với PayOS)
    @Column(name = "bank_account_name", columnDefinition = "NVARCHAR(100)")
    private String bankAccountName;

    // Số tài khoản ngân hàng
    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;

    // Tên ngân hàng thụ hưởng (ví dụ: MBBank)
    @Column(name = "bank_name", length = 50)
    private String bankName;

    // Mã định danh ngân hàng NAPAS BIN (ví dụ: 970422 cho MBBank)
    @Column(name = "bank_bin", length = 20)
    private String bankBin;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
