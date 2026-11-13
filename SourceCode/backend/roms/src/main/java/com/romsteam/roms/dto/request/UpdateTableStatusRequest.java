package com.romsteam.roms.dto.request;

import com.romsteam.roms.entity.enums.TableStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTableStatusRequest {

    // Trạng thái mới (AVAILABLE, OCCUPIED, DIRTY, RESERVED, BLOCKED)
    @NotNull(message = "Trạng thái bàn không được để trống")
    private TableStatus status;

    // Lý do khóa bàn khi status = BLOCKED
    private String blockedReason;

    // Thông tin khách đặt khi status = RESERVED
    private String reservationInfo;

    // Giờ hẹn đến khi status = RESERVED
    private String reservedTime;

    // Số lượng khách thực tế khi chuyển sang OCCUPIED
    private Integer guestsCount;

    // Cho phép mở bàn cưỡng chế cho khách vãng lai dù đang trong khung Buffer Lock của bàn đặt trước
    private Boolean forceOverride;
}
