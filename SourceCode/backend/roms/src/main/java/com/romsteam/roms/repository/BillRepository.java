package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {

    // Tìm hóa đơn của một phiên ăn
    Optional<Bill> findBySessionId(Long sessionId);

    // Tìm hóa đơn theo mã số hóa đơn (in trên bill)
    Optional<Bill> findByBillNumber(String billNumber);

    // Đối soát theo mã giao dịch ngân hàng / VNPay
    Optional<Bill> findByTransactionId(String transactionId);
}
