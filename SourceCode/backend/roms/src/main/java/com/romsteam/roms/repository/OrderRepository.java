package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Order;
import com.romsteam.roms.entity.enums.OrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // Lay toan bo cac dot goi mon cua 1 phien an (EntityGraph nap san items, menuItem, staff de triet tieu N+1 Query)
    @EntityGraph(attributePaths = {"items", "items.menuItem", "staff"})
    List<Order> findBySessionId(Long sessionId);

    // Tim don theo ma dot goi mon
    @EntityGraph(attributePaths = {"items", "items.menuItem", "session", "session.table", "staff"})
    Optional<Order> findByOrderCode(String orderCode);

    // Danh cho man hinh Bep (KDS): Lay cac don dang can nau (PENDING, CONFIRMED, COOKING...)
    @EntityGraph(attributePaths = {"items", "items.menuItem", "session", "session.table", "staff"})
    List<Order> findByStatusInOrderByCreatedAtAsc(Collection<OrderStatus> statuses);

    // Dem so order chua hoan thanh trong 1 session
    long countBySessionIdAndStatusIn(Long sessionId, Collection<OrderStatus> statuses);

    // Lay toan bo don trong ngay de phuc vu tra cuu lich su nau mon theo ban (SELECT DISTINCT de tranh duplicate rows do join items)
    @EntityGraph(attributePaths = {"items", "items.menuItem", "session", "session.table", "staff"})
    @Query("SELECT DISTINCT o FROM Order o WHERE o.createdAt >= :startOfDay ORDER BY o.createdAt DESC")
    List<Order> findOrdersToday(@Param("startOfDay") LocalDateTime startOfDay);

    // Tim don theo ID voi day du do thi quan he can thiet
    @Override
    @EntityGraph(attributePaths = {"items", "items.menuItem", "session", "session.table", "staff"})
    Optional<Order> findById(Long id);
}
