package com.romsteam.roms.repository;

import com.romsteam.roms.entity.RestaurantTable;
import com.romsteam.roms.entity.enums.TableStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {
    // Tim ban theo so ban (vi du: "Ban 05")
    Optional<RestaurantTable> findByTableNumber(String tableNumber);

    // BR-02 & BR-11: Xac thuc ma bi mat gan trong QR Code khi khach quet ban
    Optional<RestaurantTable> findByQrToken(String qrToken);

    // Loc ban theo trang thai (AVAILABLE, OCCUPIED, DIRTY, RESERVED) de hien so do sanh
    List<RestaurantTable> findByStatus(TableStatus status);

    // Lay cac ban dang mo kinh doanh
    List<RestaurantTable> findByIsActiveTrue();
}

