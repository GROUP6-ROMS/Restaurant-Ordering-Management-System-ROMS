package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.AssignTableReservationRequest;
import com.romsteam.roms.dto.request.CancelReservationRequest;
import com.romsteam.roms.dto.request.CreateReservationRequest;
import com.romsteam.roms.dto.request.UpdateReservationItemsRequest;
import com.romsteam.roms.dto.response.ReservationResponse;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.dto.response.ZoneResponse;
import com.romsteam.roms.entity.enums.ReservationStatus;

import java.time.LocalDate;
import java.util.List;

public interface ReservationService {

    // 1. Khách hàng gửi yêu cầu đặt chỗ trực tuyến (tạo đơn trạng thái PENDING)
    ReservationResponse createCustomerReservation(CreateReservationRequest request);

    // 2. Lấy danh sách phân khu bàn thực tế từ CSDL để hiển thị lên form đặt bàn
    List<ZoneResponse> getActiveZones();

    // 3. Quản lý xem danh sách đặt bàn (hỗ trợ lọc theo trạng thái, ngày hẹn, từ khóa tìm kiếm)
    List<ReservationResponse> getReservations(ReservationStatus status, LocalDate date, String keyword);

    // 4. Lấy chi tiết một đơn đặt bàn theo ID
    ReservationResponse getReservationById(Long id);

    // 5. Gợi ý danh sách bàn trống khả dụng để Quản lý chọn xếp bàn cho khách
    List<TableResponse> getAvailableTablesForReservation(Long reservationId);

    // 6. Quản lý xác nhận đặt bàn và gán bàn ăn cụ thể cho khách
    ReservationResponse assignTableToReservation(Long reservationId, AssignTableReservationRequest request);

    // 7. Quản lý hủy đơn đặt bàn (hoặc khách gọi hủy)
    ReservationResponse cancelReservation(Long reservationId, CancelReservationRequest request);

    // 8. Quản lý kiểm tra và chỉnh sửa (thêm, sửa số lượng, xóa) các món đặt trước cho bàn
    ReservationResponse updateReservationItems(Long reservationId, UpdateReservationItemsRequest request);
}
