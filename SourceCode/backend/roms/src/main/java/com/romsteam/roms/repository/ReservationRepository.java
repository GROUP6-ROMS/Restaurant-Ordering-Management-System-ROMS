package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Reservation;
import com.romsteam.roms.entity.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    // Tim don dat ban theo so dien thoai khach hang
    List<Reservation> findByCustomerPhone(String customerPhone);

    // Tim cac don dat ban trong mot khoang thoi gian
    List<Reservation> findByReservationTimeBetween(LocalDateTime startTime, LocalDateTime endTime);

    // Loc cac don dat ban theo trang thai va thoi gian
    List<Reservation> findByStatusAndReservationTimeBefore(ReservationStatus status, LocalDateTime thresholdTime);
}
