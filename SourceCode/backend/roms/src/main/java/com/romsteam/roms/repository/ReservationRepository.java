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
    // Tim don dat ban theo ma code tra cuu (vi du: "RES-8842")
    Optional<Reservation> findByReservationCode(String reservationCode);

    // Tim cac don dat ban trong mot khoang thoi gian (dung de kiem tra kin cho)
    List<Reservation> findByReservationTimeBetween(LocalDateTime startTime, LocalDateTime endTime);

    // NFR-R06: Quet cac don dat ban qua gio hen ma khach khong den (No-show) de tu dong huy
    List<Reservation> findByStatusAndReservationTimeBefore(ReservationStatus status, LocalDateTime thresholdTime);
}
