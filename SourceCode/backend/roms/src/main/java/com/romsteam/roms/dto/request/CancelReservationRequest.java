package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO nhận lý do hủy đơn đặt bàn
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelReservationRequest {

    // Lý do hủy (ví dụ: "Khách gọi báo hoãn lịch", "Gọi 3 cuộc không nhấc máy"...)
    @NotBlank(message = "Vui lòng nhập lý do hủy đặt bàn")
    private String cancelReason;
}
