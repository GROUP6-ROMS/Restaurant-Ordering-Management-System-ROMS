package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Order;
import com.romsteam.roms.entity.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // Lay toan bo cac dot goi mon cua 1 phien an
    List<Order> findBySessionId(Long sessionId);

    // Tim don theo ma dot goi mon (Entity Order dung orderCode)
    Optional<Order> findByOrderCode(String orderCode);

    // Danh cho man hinh Bep (KDS): Lay cac don dang can nau (PENDING, CONFIRMED, COOKING...)
    List<Order> findByStatusInOrderByCreatedAtAsc(Collection<OrderStatus> statuses);

    // Dem so order chua hoan thanh trong 1 session
    long countBySessionIdAndStatusIn(Long sessionId, Collection<OrderStatus> statuses);
}
