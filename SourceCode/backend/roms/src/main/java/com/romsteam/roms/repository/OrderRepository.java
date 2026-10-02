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

    // Lấy toàn bộ các đợt gọi món của 1 phiên ăn
    List<Order> findBySessionId(Long sessionId);

    // Tìm đơn theo mã hiển thị (ví dụ: "ORD-1001")
    Optional<Order> findByOrderNumber(String orderNumber);

    // NFR-R02: Chặn duplicate đơn hàng bằng Idempotency Key (chống bấm đúp)
    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    // Dành cho màn hình Bếp (KDS): Lấy các đơn đang cần nấu (PENDING, CONFIRMED, PREPARING)
    // Sắp xếp đơn nào vào trước nấu trước (FIFO)
    List<Order> findByStatusInOrderByCreatedAtAsc(Collection<OrderStatus> statuses);

    // BR-16: Đếm số order chưa hoàn thành trong 1 session (dùng khi kiểm tra trước lúc thanh toán)
    long countBySessionIdAndStatusIn(Long sessionId, Collection<OrderStatus> statuses);
}
