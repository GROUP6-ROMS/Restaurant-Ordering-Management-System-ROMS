package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.SessionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "dining_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiningSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // QUAN HỆ KHÓA NGOẠI: Nhiều phiên ăn (ở các thời điểm khác nhau) diễn ra tại 1 Bàn
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", nullable = false)
    private RestaurantTable table;

    // Token ngẫu nhiên (UUID) cấp cho trình duyệt của khách khi quét QR để nhận diện phiên
    @Column(name = "session_token", nullable = false, unique = true, length = 100)
    private String sessionToken;

    // Trạng thái phiên ăn: ACTIVE, COMPLETED, CANCELLED
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SessionStatus status = SessionStatus.ACTIVE;

    // Số lượng khách thực tế ngồi tại bàn trong phiên này
    @Column(name = "guest_count")
    private Integer guestCount;

    // Ghi chú chung của cả bàn (ví dụ: "Có trẻ em, không ăn cay")
    @Column(name = "note", length = 255)
    private String note;

    // Thời điểm bắt đầu phiên ăn (khách quét QR vào bàn)
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    // Thời điểm kết thúc phiên ăn (sau khi thu ngân bấm thanh toán)
    @Column(name = "end_time")
    private LocalDateTime endTime;

    // Khóa lạc quan (Optimistic Locking) chống xung đột khi nhiều bên cùng cập nhật
    @Version
    @Column(name = "version")
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

}
