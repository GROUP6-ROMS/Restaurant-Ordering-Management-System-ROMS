package com.romsteam.roms.repository;

import com.romsteam.roms.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    // Lấy danh sách món ăn trong 1 đợt gọi món
    List<OrderItem> findByOrderId(Long orderId);

    // Truy vấn thống kê các món bán chạy nhất từ các hóa đơn đã thanh toán (PAID)
    @Query("SELECT oi.menuItem.id, oi.menuItem.name, c.name, " +
            "CAST(SUM(oi.quantity) AS integer), SUM(oi.subtotal) " +
            "FROM OrderItem oi " +
            "JOIN oi.order o " +
            "JOIN o.session s " +
            "JOIN Bill b ON b.session.id = s.id " +
            "JOIN oi.menuItem mi " +
            "JOIN mi.category c " +
            "WHERE b.status = 'PAID' " +
            "AND oi.status <> 'CANCELLED' " +
            "AND b.paymentTime BETWEEN :start AND :end " +
            "GROUP BY oi.menuItem.id, oi.menuItem.name, c.name " +
            "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopSellingMenuItems(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
}
