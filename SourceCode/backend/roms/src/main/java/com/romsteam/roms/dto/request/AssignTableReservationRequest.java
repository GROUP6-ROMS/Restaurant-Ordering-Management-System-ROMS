package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO Quản lý gửi lên để xếp bàn cụ thể cho đơn đặt bàn
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignTableReservationRequest {

    // ID của bàn ăn được chọn để gán cho khách
    @NotNull(message = "Vui lòng chọn bàn ăn để xếp cho khách")
    private Long tableId;

    // Ghi chú nội bộ của Quản lý khi gọi điện xếp bàn
    private String adminNote;
}
