package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestOtpRequest {

    @NotBlank(message = "Vui lòng nhập tên đăng nhập hoặc mã nhân viên!")
    private String username;
}
