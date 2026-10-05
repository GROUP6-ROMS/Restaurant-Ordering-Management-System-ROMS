package com.romsteam.roms.repository;

import com.romsteam.roms.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    // Lay danh sach mon an trong 1 dot goi mon
    List<OrderItem> findByOrderId(Long orderId);
}

