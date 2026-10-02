package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.ReservationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
/**
 * Entity đại diện cho đơn đặt bàn trước của thực khách.
 * Ánh xạ bảng 'reservations' trong SQL Server.
 */
@Entity
@Table(name = "reservations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Bàn được gán (có thể null lúc mới đặt qua mạng, gán khi xác nhận/check-in)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id")
    private RestaurantTable table;

    // Mã số đặt bàn để khách tra cứu (ví dụ: "RES-8842", "RES-9901")
    @Column(name = "reservation_code", nullable = false, unique = true, length = 30)
    private String reservationCode;

    // Họ và tên người liên hệ
    @Column(name = "customer_name", nullable = false, length = 100)
    private String customerName;

    // Số điện thoại nhận tin nhắn xác nhận
    @Column(name = "customer_phone", nullable = false, length = 15)
    private String customerPhone;

    // Email nhận vé giữ bàn
    @Column(name = "customer_email", length = 100)
    private String customerEmail;

    // Số lượng khách dùng bữa
    @Column(name = "guest_count", nullable = false)
    private Integer guestCount;

    // Thời điểm dùng bữa được đặt trước (Phải ở tương lai - BR-15)
    @Column(name = "reservation_time", nullable = false)
    private LocalDateTime reservationTime;

    // Dịp đặc biệt (Sinh nhật, Kỷ niệm ngày cưới, Tiếp đãi đối tác...)
    @Column(name = "occasion", length = 100)
    private String occasion;

    // Ghi chú ẩm thực, dị ứng nguyên, yêu cầu riêng của khách
    @Column(name = "special_request", length = 500)
    private String specialRequest;

    // Trạng thái đơn đặt bàn: PENDING, CONFIRMED, COMPLETED, CANCELLED
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ReservationStatus status = ReservationStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
