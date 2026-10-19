package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.TableStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity đại diện cho bảng bàn ăn trong nhà hàng.
 * Tên bảng là 'restaurant_tables' để tránh trùng từ khóa hệ thống của SQL Server.
 */
@Entity
@Table(name = "restaurant_tables")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantTable {

    // Khóa chính tự tăng
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mã bàn hiển thị (ví dụ: "T-01", "B-01", "VIP-01") - Duy nhất, không được trùng
    @Column(name = "table_number", nullable = false, unique = true, length = 30)
    private String tableNumber;

    // Tên bàn hiển thị thân thiện (ví dụ: "Bàn T-01", "Ban Công 01", "Bàn Tiệc Gia Đình")
    @Column(name = "name", columnDefinition = "NVARCHAR(100)")
    private String name;

    // Phân khu vực: "ZONE_1" (Sảnh chính), "ZONE_2" (Ban công), "VIP" (Phòng VIP)
    @Builder.Default
    @Column(name = "zone", nullable = false, length = 50)
    private String zone = "ZONE_1";

    // Sức chứa số lượng khách tối đa của bàn (ví dụ: 2, 4, 6, 8, 12 chỗ)
    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    // Trạng thái hiện tại của bàn (AVAILABLE, OCCUPIED, DIRTY, RESERVED, BLOCKED)
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TableStatus status = TableStatus.AVAILABLE;

    // Lý do khóa bàn khi status = BLOCKED (ví dụ: "Bảo trì hệ thống đèn & thông gió")
    @Column(name = "blocked_reason", columnDefinition = "NVARCHAR(255)")
    private String blockedReason;

    // Thông tin khách đặt trước khi status = RESERVED (ví dụ: "Chị Mai (0982xxx)")
    @Column(name = "reservation_info",  columnDefinition = "NVARCHAR(255)")
    private String reservationInfo;

    // Giờ hẹn khách đến khi status = RESERVED (ví dụ: "20:00" hoặc "Đặt lúc 20:30")
    @Column(name = "reserved_time", length = 50)
    private String reservedTime;

    // Chuỗi mã token bí mật gắn với mã QR dán trên mặt bàn
    @Column(name = "qr_token", length = 255)
    private String qrToken;

    // Bàn có đang mở kinh doanh không (true = mở, false = ẩn khỏi hệ thống)
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Thời điểm tạo bàn trong hệ thống
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm cập nhật trạng thái bàn gần nhất
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
