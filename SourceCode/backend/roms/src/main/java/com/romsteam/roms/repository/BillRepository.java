package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Bill;
import com.romsteam.roms.entity.enums.BillStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {

    // Tìm hóa đơn của một phiên ăn
    Optional<Bill> findBySessionId(Long sessionId);

    // Tìm hóa đơn theo mã số hóa đơn duy nhất
    Optional<Bill> findByBillCode(String billCode);

    // Lấy danh sách hóa đơn theo trạng thái và khoảng thời gian thanh toán (PaymentTime)
    List<Bill> findByStatusAndPaymentTimeBetween(BillStatus status, LocalDateTime start, LocalDateTime end);

    // Lấy toàn bộ hóa đơn theo khoảng thời gian thanh toán
    List<Bill> findByPaymentTimeBetween(LocalDateTime start, LocalDateTime end);

    // Tính tổng doanh thu của các hóa đơn đã thanh toán trong khoảng thời gian
    @Query("SELECT COALESCE(SUM(b.finalAmount), 0) FROM Bill b " +
            "WHERE b.status = :status AND b.paymentTime BETWEEN :start AND :end")
    BigDecimal sumFinalAmountByStatusAndPaymentTimeBetween(
            @Param("status") BillStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    // Đếm số lượng hóa đơn theo trạng thái trong khoảng thời gian
    long countByStatusAndPaymentTimeBetween(BillStatus status, LocalDateTime start, LocalDateTime end);
}
