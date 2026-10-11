package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

/**
 * DTO xác thực mã PIN 6 số của Quản lý khi hủy món hoặc chốt sổ ca làm việc
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManagerApprovalRequest {

    @NotBlank(message = "Mã PIN Quản lý là bắt buộc!")
    @Pattern(regexp = "^\\d{6}$", message = "Mã PIN Quản lý phải gồm đúng 6 chữ số!")
    private String managerPin;

    private String reason; // Lý do hủy món hoặc ghi chú bàn giao ca
}
