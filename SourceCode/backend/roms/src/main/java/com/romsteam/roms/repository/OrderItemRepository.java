package com.romsteam.roms.repository;

import com.romsteam.roms.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    // Lấy danh sách món ăn trong 1 đợt gọi món
    List<OrderItem> findByOrderId(Long orderId);
}

