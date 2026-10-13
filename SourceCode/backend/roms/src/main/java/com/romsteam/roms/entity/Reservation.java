package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.ReservationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity đại diện cho bảng phiếu đặt bàn trước (reservations).
 * Áp dụng đầy đủ annotation Lombok để tự động sinh Getter, Setter, Builder và Constructor.
 */
@Entity
@Table(name = "reservations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation {

    // Khóa chính tự tăng của phiếu đặt bàn
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mã đặt chỗ duy nhất hiển thị cho khách và quản lý tra cứu (Ví dụ: "RES-20261009-8821")
    @Column(name = "booking_code", unique = true, length = 50)
    private String bookingCode;

    // Bàn ăn được chỉ định giữ chỗ (để NULL khi khách mới gửi đơn PENDING chờ quản lý xếp bàn)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id")
    private RestaurantTable table;

    // Phân khu khách mong muốn ngồi (lấy từ danh sách Zone trong CSDL: ZONE_1, ZONE_2, VIP...)
    @Column(name = "requested_zone", length = 50)
    private String requestedZone;

    // Họ tên người liên hệ đặt bàn
    @Column(name = "customer_name", nullable = false, columnDefinition = "NVARCHAR(100)")
    private String customerName;

    // Số điện thoại liên hệ xác nhận đặt bàn (Quản lý sẽ bấm gọi số này)
    @Column(name = "customer_phone", nullable = false, length = 15)
    private String customerPhone;

    // Email nhận thông tin xác nhận đặt bàn (tùy chọn)
    @Column(name = "customer_email", length = 100)
    private String customerEmail;

    // Số lượng khách trong đoàn
    @Column(name = "guest_count", nullable = false)
    private Integer guestCount;

    // Thời điểm khách hẹn đến dùng bữa tại nhà hàng
    @Column(name = "reservation_time", nullable = false)
    private LocalDateTime reservationTime;

    // Trạng thái phiếu đặt bàn: PENDING, CONFIRMED, COMPLETED, CANCELLED
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ReservationStatus status = ReservationStatus.PENDING;

    // Ghi chú đặc biệt của khách (Ví dụ: "Ghế em bé", "Tiệc sinh nhật", "Bàn gần cửa sổ"...)
    @Column(name = "note", columnDefinition = "NVARCHAR(255)")
    private String note;

    // Lý do hủy đặt bàn (khi khách hủy hoặc quản lý từ chối)
    @Column(name = "cancel_reason", columnDefinition = "NVARCHAR(255)")
    private String cancelReason;

    // Thời điểm khách gửi đơn đặt bàn lên hệ thống
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm cập nhật trạng thái phiếu đặt gần nhất
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Danh sách các món ăn thực khách đặt trước (hoặc Quản lý thêm/sửa/xóa)
    @OneToMany(mappedBy = "reservation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ReservationItem> items = new ArrayList<>();
}
