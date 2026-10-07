package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyManagerPinRequest {

    @NotBlank(message = "Mã quản lý không được để trống")
    private String managerUsername;

    @NotBlank(message = "Mã PIN xác nhận không được để trống")
    @Pattern(regexp = "^\\d{6}$", message = "Mã PIN quản lý phải gồm đúng 6 chữ số")
    private String pinCode;

    // Ly do yeu cau xac thuc (vi du: "CASHIER_SHIFT_CLOSING", "VOID_ORDER_ITEM")
    private String reason;
}