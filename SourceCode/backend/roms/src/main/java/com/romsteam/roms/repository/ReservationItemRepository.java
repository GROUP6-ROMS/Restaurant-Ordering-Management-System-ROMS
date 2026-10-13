package com.romsteam.roms.repository;

import com.romsteam.roms.entity.ReservationItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservationItemRepository extends JpaRepository<ReservationItem, Long> {

    // Lấy toàn bộ món đặt trước theo mã phiếu đặt bàn
    List<ReservationItem> findByReservationId(Long reservationId);

    // Xóa toàn bộ món đặt trước của một phiếu đặt bàn
    void deleteByReservationId(Long reservationId);
}
