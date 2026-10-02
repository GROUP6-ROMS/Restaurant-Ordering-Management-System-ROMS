package com.romsteam.roms.repository;

import com.romsteam.roms.entity.RestaurantTable;
import com.romsteam.roms.entity.enums.TableStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {
    // Tìm bàn theo số bàn (ví dụ: "Bàn 05")
    Optional<RestaurantTable> findByTableNumber(String tableNumber);

    // BR-02 & BR-11: Xác thực mã bí mật gắn trong QR Code khi khách quét bàn
    Optional<RestaurantTable> findByQrToken(String qrToken);

    // Lọc bàn theo trạng thái (AVAILABLE, OCCUPIED, DIRTY, RESERVED) để hiện sơ đồ sảnh
    List<RestaurantTable> findByStatus(TableStatus status);

    // Lấy các bàn đang mở kinh doanh
    List<RestaurantTable> findByIsActiveTrue();
}

