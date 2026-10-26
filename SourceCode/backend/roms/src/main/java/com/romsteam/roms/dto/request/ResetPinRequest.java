package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResetPinRequest {

    @NotBlank(message = "Vui lòng cung cấp mã nhân viên!")
    private String username;

    @NotBlank(message = "Vui lòng cung cấp mã OTP hoặc Master Recovery Key!")
    private String otpOrRecoveryKey;

    @NotBlank(message = "Mã PIN mới không được để trống!")
    @Pattern(regexp = "^\\d{6}$", message = "Mã PIN mới phải gồm chính xác 6 chữ số!")
    private String newPinCode;

    @NotBlank(message = "Vui lòng xác nhận lại mã PIN mới!")
    private String confirmPinCode;
}
