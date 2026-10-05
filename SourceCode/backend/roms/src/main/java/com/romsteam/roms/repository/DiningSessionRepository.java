package com.romsteam.roms.repository;

import com.romsteam.roms.entity.DiningSession;
import com.romsteam.roms.entity.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface DiningSessionRepository extends JpaRepository<DiningSession, Long> {

    // BR-01: Tim phien an ACTIVE duy nhat tai mot ban
    Optional<DiningSession> findByTableIdAndStatus(Long tableId, SessionStatus status);

    // Nhan dien phien an qua token luu trong dien thoai cua khach sau khi quet QR
    Optional<DiningSession> findBySessionToken(String sessionToken);

    // Loc tat ca phien an theo trang thai
    List<DiningSession> findByStatus(SessionStatus status);
}
