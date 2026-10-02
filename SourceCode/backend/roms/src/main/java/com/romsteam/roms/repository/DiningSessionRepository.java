package com.romsteam.roms.repository;

import com.romsteam.roms.entity.DiningSession;
import com.romsteam.roms.entity.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface DiningSessionRepository extends JpaRepository<DiningSession, Long> {

    // BR-01: Tìm phiên ăn ACTIVE duy nhất tại một bàn
    Optional<DiningSession> findByTableIdAndStatus(Long tableId, SessionStatus status);

    // Nhận diện phiên ăn qua token lưu trong điện thoại của khách sau khi quét QR
    Optional<DiningSession> findBySessionToken(String sessionToken);

    // Lọc tất cả phiên ăn theo trạng thái
    List<DiningSession> findByStatus(SessionStatus status);
}
