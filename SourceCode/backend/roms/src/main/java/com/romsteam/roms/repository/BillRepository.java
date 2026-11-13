package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Bill;
import com.romsteam.roms.entity.enums.BillStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {

    // Tìm hóa đơn của một phiên ăn (Fetch session, table, cashier tránh N+1)
    @EntityGraph(attributePaths = {"session", "session.table", "cashier"})
    Optional<Bill> findBySessionId(Long sessionId);

    /**
     * Khóa dòng hóa đơn mức PESSIMISTIC_WRITE khi thanh toán phiên ăn hoặc xử lý webhook PayOS (Issue #31).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Bill b WHERE b.session.id = :sessionId")
    Optional<Bill> findBySessionIdForUpdate(@Param("sessionId") Long sessionId);

    // Tìm hóa đơn theo mã số hóa đơn duy nhất
    @EntityGraph(attributePaths = {"session", "session.table", "cashier"})
    Optional<Bill> findByBillCode(String billCode);

    // Tìm hóa đơn theo mã đơn hàng payOS
    @EntityGraph(attributePaths = {"session", "session.table", "cashier"})
    Optional<Bill> findByPayosOrderCode(Long payosOrderCode);

    /**
     * Khóa dòng hóa đơn theo mã payOS bằng PESSIMISTIC_WRITE khi đối soát webhook PayOS (Issue #31).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Bill b WHERE b.payosOrderCode = :payosOrderCode")
    Optional<Bill> findByPayosOrderCodeForUpdate(@Param("payosOrderCode") Long payosOrderCode);

    // Lấy danh sách hóa đơn theo trạng thái và khoảng thời gian thanh toán (PaymentTime)
    @EntityGraph(attributePaths = {"session", "session.table", "cashier"})
    List<Bill> findByStatusAndPaymentTimeBetween(BillStatus status, LocalDateTime start, LocalDateTime end);

    // Lấy toàn bộ hóa đơn theo khoảng thời gian thanh toán
    @EntityGraph(attributePaths = {"session", "session.table", "cashier"})
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
