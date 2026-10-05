package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {

    // Tim hoa don cua mot phien an
    Optional<Bill> findBySessionId(Long sessionId);

    // Tim hoa don theo ma so hoa don (in tren bill)
    Optional<Bill> findByBillNumber(String billNumber);

    // Doi soat theo ma giao dich ngan hang / VNPay
    Optional<Bill> findByTransactionId(String transactionId);
}
