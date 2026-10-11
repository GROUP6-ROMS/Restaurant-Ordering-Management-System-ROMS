package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Reservation;
import com.romsteam.roms.entity.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    // Tìm kiếm phiếu đặt chỗ theo mã đặt chỗ
    Optional<Reservation> findByBookingCode(String bookingCode);

    // Kiểm tra xem mã đặt chỗ đã tồn tại chưa (để tránh trùng lặp mã sinh ngẫu nhiên)
    boolean existsByBookingCode(String bookingCode);

    // Tìm kiếm theo số điện thoại khách hàng
    List<Reservation> findByCustomerPhoneOrderByReservationTimeDesc(String customerPhone);

    // Lọc danh sách đặt bàn theo trạng thái (Ví dụ: PENDING để Quản lý duyệt)
    List<Reservation> findByStatusOrderByReservationTimeAsc(ReservationStatus status);

    // Lọc theo khoảng thời gian dùng bữa
    List<Reservation> findByReservationTimeBetweenOrderByReservationTimeAsc(LocalDateTime start, LocalDateTime end);

    // Tìm kiếm theo từ khóa (Mã đặt chỗ, Tên khách hoặc SĐT)
    @Query("SELECT r FROM Reservation r WHERE " +
            "(:status IS NULL OR r.status = :status) AND " +
            "(:keyword IS NULL OR LOWER(r.customerName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            " r.customerPhone LIKE CONCAT('%', :keyword, '%') OR " +
            " LOWER(r.bookingCode) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "ORDER BY r.reservationTime ASC")
    List<Reservation> searchReservations(@Param("status") ReservationStatus status,
                                         @Param("keyword") String keyword);

    // Đếm số lượng đơn đặt bàn theo trạng thái
    long countByStatus(ReservationStatus status);
}
