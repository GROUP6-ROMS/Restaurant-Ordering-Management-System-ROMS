package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Reservation;
import com.romsteam.roms.entity.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    // Tìm đơn đặt bàn theo mã code tra cứu (ví dụ: "RES-8842")
    Optional<Reservation> findByReservationCode(String reservationCode);

    // Tìm các đơn đặt bàn trong một khoảng thời gian (dùng để kiểm tra kín chỗ)
    List<Reservation> findByReservationTimeBetween(LocalDateTime startTime, LocalDateTime endTime);

    // NFR-R06: Quét các đơn đặt bàn quá giờ hẹn mà khách không đến (No-show) để tự động hủy
    List<Reservation> findByStatusAndReservationTimeBefore(ReservationStatus status, LocalDateTime thresholdTime);
}
