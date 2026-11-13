package com.romsteam.roms.repository;

import com.romsteam.roms.entity.DiningSession;
import com.romsteam.roms.entity.enums.SessionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiningSessionRepository extends JpaRepository<DiningSession, Long> {

    // Tìm phiên ăn ACTIVE duy nhất tại một bàn (Fetch table để tránh N+1)
    @EntityGraph(attributePaths = {"table"})
    Optional<DiningSession> findByTableIdAndStatus(Long tableId, SessionStatus status);

    /**
     * Khóa dòng dữ liệu mức PESSIMISTIC_WRITE (Khóa Bi quan) khi thanh toán phiên ăn.
     * Ngăn chặn triệt để xung đột đồng thời giữa Thu ngân POS Checkout và Webhook PayOS (Issue #31).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM DiningSession s WHERE s.table.id = :tableId AND s.status = :status")
    Optional<DiningSession> findByTableIdAndStatusForUpdate(@Param("tableId") Long tableId, @Param("status") SessionStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM DiningSession s WHERE s.id = :id")
    Optional<DiningSession> findByIdForUpdate(@Param("id") Long id);

    // Nhận diện phiên ăn qua token QR
    @EntityGraph(attributePaths = {"table"})
    Optional<DiningSession> findBySessionToken(String sessionToken);

    // Lọc tất cả phiên ăn theo trạng thái
    @EntityGraph(attributePaths = {"table"})
    List<DiningSession> findByStatus(SessionStatus status);

    // Lấy các phiên ăn đã hoàn thành (COMPLETED) trong khoảng thời gian kết thúc (endTime)
    @EntityGraph(attributePaths = {"table"})
    List<DiningSession> findByStatusAndEndTimeBetween(SessionStatus status, LocalDateTime start, LocalDateTime end);

    // Lấy các phiên ăn được khởi tạo trong khoảng thời gian bắt đầu (startTime)
    @EntityGraph(attributePaths = {"table"})
    List<DiningSession> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);

    // Đếm số lượng phiên ăn theo trạng thái (ví dụ: ACTIVE)
    long countByStatus(SessionStatus status);
}
