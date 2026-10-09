package com.romsteam.roms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity đại diện cho bảng 'service_requests' trong SQL Server.
 * Quản lý chuông gọi phục vụ và yêu cầu hỗ trợ khẩn tại bàn ăn.
 */
@Entity
@Table(name = "service_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceRequest {

    // Khóa chính tự tăng
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Bàn ăn phát sinh yêu cầu hỗ trợ
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", nullable = false)
    private RestaurantTable table;

    // Phiên ăn đang diễn ra tại bàn (nếu có)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private DiningSession session;

    // Loại yêu cầu: "CALL_WAITER" (Gọi phục vụ), "REQUEST_ICE" (Thêm đá), "REQUEST_BILL" (Thanh toán)...
    @Column(name = "request_type", nullable = false, length = 50)
    private String requestType;

    // Nội dung ghi chú chi tiết của khách (hỗ trợ tiếng Việt Unicode)
    @Column(name = "note", columnDefinition = "NVARCHAR(255)")
    private String note;

    // Trạng thái xử lý: "PENDING" (Đang chờ phục vụ), "RESOLVED" (Đã xử lý xong)
    @Builder.Default
    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";

    // Nhân viên tiếp nhận và xử lý yêu cầu
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private Staff staff;

    // Thời điểm khách bấm chuông gọi
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm nhân viên xử lý xong yêu cầu
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
