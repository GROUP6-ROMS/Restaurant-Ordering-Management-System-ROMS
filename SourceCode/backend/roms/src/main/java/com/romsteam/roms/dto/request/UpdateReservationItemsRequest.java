package com.romsteam.roms.dto.request;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO nhận dữ liệu khi Quản lý cập nhật toàn bộ danh sách món đặt trước của một bàn
 * Cho phép thêm mới, chỉnh sửa số lượng / ghi chú, hoặc xóa món (nếu không truyền món đó lên).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateReservationItemsRequest {

    // Danh sách các món đặt trước sau khi quản lý điều chỉnh (rỗng nếu xóa hết)
    private List<@Valid ReservationItemRequest> items;
}
