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

    // Tim don theo ma hien thi (vi du: "ORD-1001")
    Optional<Order> findByOrderNumber(String orderNumber);

    // NFR-R02: Chan duplicate don hang bang Idempotency Key (chong bam dup)
    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    // Danh cho man hinh Bep (KDS): Lay cac don dang can nau (PENDING, CONFIRMED, PREPARING)
    // Sap xep don nao vao truoc nau truoc (FIFO)
    List<Order> findByStatusInOrderByCreatedAtAsc(Collection<OrderStatus> statuses);

    // BR-16: Dem so order chua hoan thanh trong 1 session (dung khi kiem tra truoc luc thanh toan)
    long countBySessionIdAndStatusIn(Long sessionId, Collection<OrderStatus> statuses);
}
