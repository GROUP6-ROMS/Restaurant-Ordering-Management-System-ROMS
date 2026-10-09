package com.romsteam.roms.repository;

import com.romsteam.roms.entity.ServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository truy vấn CSDL bảng service_requests
 */
@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

    // Lấy tất cả yêu cầu chưa xử lý (PENDING) sắp xếp mới nhất lên đầu
    List<ServiceRequest> findByStatusOrderByCreatedAtDesc(String status);

    // Lấy các yêu cầu chưa xử lý của một bàn cụ thể
    List<ServiceRequest> findByTableIdAndStatusOrderByCreatedAtDesc(Long tableId, String status);

    // Đếm tổng số chuông gọi đang chờ xử lý của toàn nhà hàng
    long countByStatus(String status);
}
