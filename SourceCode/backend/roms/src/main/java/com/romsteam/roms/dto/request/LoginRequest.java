package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    // Ma nhan vien dang nhap (vi du: MGR-001, EMP-001, KDS-001, CSH-001)
    @NotBlank(message = "Tên đăng nhập không được để trống")
    private String username;

    // Ma PIN 6 chu so (bat buoc dung 6 so, khong dung password truyen thong)
    @NotBlank(message = "Mã PIN không được để trống")
    @Pattern(regexp = "^\\d{6}$", message = "Mã PIN phải gồm đúng 6 chữ số")
    private String pinCode;
}
