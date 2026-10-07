package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.CreateTableRequest;
import com.romsteam.roms.dto.request.UpdateTableStatusRequest;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.dto.response.TableSummaryResponse;
import com.romsteam.roms.entity.enums.TableStatus;

import java.util.List;

public interface RestaurantTableService {

    // 1. Lấy dữ liệu 5 thẻ KPI thống kê
    TableSummaryResponse getTableSummary();

    // 2. Lấy danh sách bàn kèm bộ lọc phân khu, trạng thái và tìm kiếm
    List<TableResponse> getTables(String zone, TableStatus status, String keyword);

    // 3. Lấy thông tin chi tiết một bàn
    TableResponse getTableById(Long id);

    // 4. Thêm bàn mới
    TableResponse createTable(CreateTableRequest request);

    // 5. Cập nhật trạng thái bàn (Khóa, Mở, Đặt chỗ, Dọn dẹp)
    TableResponse updateTableStatus(Long id, UpdateTableStatusRequest request);

    // 6. Tái tạo mã QR Token mới cho bàn
    TableResponse refreshQrToken(Long id);

    // 7. Xác thực mã QR Token khi khách quét điện thoại
    TableResponse verifyQrToken(String qrToken);

    // 8. Xóa bàn (chặn xóa nếu bàn đang có khách)
    void deleteTable(Long id);
}
