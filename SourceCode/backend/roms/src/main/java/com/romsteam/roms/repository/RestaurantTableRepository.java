package com.romsteam.roms.repository;

import com.romsteam.roms.entity.RestaurantTable;
import com.romsteam.roms.entity.enums.TableStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {

    // Tìm bàn theo mã hiệu (ví dụ: "T-01")
    Optional<RestaurantTable> findByTableNumber(String tableNumber);

    // Kiểm tra xem mã bàn đã tồn tại chưa (tránh trùng khi thêm mới)
    boolean existsByTableNumber(String tableNumber);

    // Kiểm tra xem mã bàn đã tồn tại ở bàn khác chưa (tránh trùng khi chỉnh sửa)
    boolean existsByTableNumberAndIdNot(String tableNumber, Long id);

    // Xác thực mã bí mật gắn trong QR Code khi khách quét bàn
    Optional<RestaurantTable> findByQrToken(String qrToken);

    // Lọc danh sách bàn theo trạng thái (AVAILABLE, OCCUPIED...)
    List<RestaurantTable> findByStatusAndIsActiveTrue(TableStatus status);

    // Lọc danh sách bàn theo phân khu (ZONE_1, ZONE_2, VIP)
    List<RestaurantTable> findByZoneAndIsActiveTrue(String zone);

    // Lấy toàn bộ bàn thuộc phân khu (bao gồm cả bàn đã xóa mềm)
    List<RestaurantTable> findByZone(String zone);

    // Lọc danh sách bàn theo cả phân khu và trạng thái
    List<RestaurantTable> findByZoneAndStatusAndIsActiveTrue(String zone, TableStatus status);

    // Lấy toàn bộ bàn đang mở kinh doanh
    List<RestaurantTable> findByIsActiveTrueOrderByTableNumberAsc();

    // Tìm kiếm bàn theo từ khóa (Mã bàn hoặc Tên bàn)
    @Query("SELECT t FROM RestaurantTable t WHERE t.isActive = true AND " +
            "(LOWER(t.tableNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            " LOWER(t.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "ORDER BY t.tableNumber ASC")
    List<RestaurantTable> searchTables(@Param("keyword") String keyword);

    // ===================================================================
    // CÁC HÀM TRUY VẤN PHỤC VỤ 5 THẺ KPI THỐNG KÊ TRÊN ĐẦU TRANG
    // ===================================================================

    // Đếm tổng số lượng bàn đang hoạt động kinh doanh (loại trừ bàn đã xóa mềm)
    long countByIsActiveTrue();

    // Đếm số lượng bàn theo trạng thái cụ thể
    long countByStatusAndIsActiveTrue(TableStatus status);

    // Đếm tổng số bàn theo từng phân khu
    long countByZoneAndIsActiveTrue(String zone);

    long countByZone(String zone);

    // Tính tổng số chỗ ngồi (sức chứa) của toàn bộ các bàn đang hoạt động
    @Query("SELECT COALESCE(SUM(t.capacity), 0) FROM RestaurantTable t WHERE t.isActive = true")
    Integer sumTotalCapacity();

    // Lấy danh sách toàn bộ các mã phân khu DISTINCT đang hoạt động trong CSDL
    @Query("SELECT DISTINCT t.zone FROM RestaurantTable t WHERE t.isActive = true ORDER BY t.zone ASC")
    List<String> findDistinctActiveZones();

    // Tìm các bàn trống (AVAILABLE) thuộc khu vực cụ thể và có sức chứa đủ cho số khách yêu cầu
    @Query("SELECT t FROM RestaurantTable t WHERE t.isActive = true AND t.status = 'AVAILABLE' AND " +
            "(:zone IS NULL OR t.zone = :zone) AND t.capacity >= :minCapacity " +
            "ORDER BY t.capacity ASC, t.tableNumber ASC")
    List<RestaurantTable> findAvailableTablesForReservation(@Param("zone") String zone,
                                                            @Param("minCapacity") Integer minCapacity);
}
