package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO yêu cầu Chốt ca két tiền (Cash Shift Closure)
 * Quản lý bắt buộc phải nhập mã PIN 6 số và ghi chú/giải trình nếu có chênh lệch két tiền.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CloseShiftRequest {

    @NotBlank(message = "Mã PIN Quản lý là bắt buộc!")
    @Pattern(regexp = "^\\d{6}$", message = "Mã PIN Quản lý phải gồm đúng 6 chữ số!")
    private String managerPin;

    private String shiftType; // MORNING / EVENING
    private BigDecimal countedCash; // Tổng tiền mặt thực đếm
    private BigDecimal theoreticalCash; // Két tiền lý thuyết
    private BigDecimal cashDifference; // Chênh lệch (countedCash - theoreticalCash)
    private String reason; // Lý do giải trình chênh lệch két (Bắt buộc nếu cashDifference != 0)
    private String handoverNote; // Ghi chú bàn giao ca
}
