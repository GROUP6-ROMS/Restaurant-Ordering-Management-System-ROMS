package com.romsteam.roms.repository;

import com.romsteam.roms.entity.DiningSession;
import com.romsteam.roms.entity.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiningSessionRepository extends JpaRepository<DiningSession, Long> {

    // Tìm phiên ăn ACTIVE duy nhất tại một bàn
    Optional<DiningSession> findByTableIdAndStatus(Long tableId, SessionStatus status);

    // Nhận diện phiên ăn qua token QR
    Optional<DiningSession> findBySessionToken(String sessionToken);

    // Lọc tất cả phiên ăn theo trạng thái
    List<DiningSession> findByStatus(SessionStatus status);

    // Lấy các phiên ăn đã hoàn thành (COMPLETED) trong khoảng thời gian kết thúc (endTime)
    List<DiningSession> findByStatusAndEndTimeBetween(SessionStatus status, LocalDateTime start, LocalDateTime end);

    // Lấy các phiên ăn được khởi tạo trong khoảng thời gian bắt đầu (startTime)
    List<DiningSession> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
}
