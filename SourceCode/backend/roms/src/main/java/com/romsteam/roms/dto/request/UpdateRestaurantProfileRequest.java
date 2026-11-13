package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRestaurantProfileRequest {

    @NotBlank(message = "Tên nhà hàng không được để trống")
    private String name;

    @NotBlank(message = "Tên thương hiệu không được để trống")
    private String brandName;

    private String tagline;

    @NotBlank(message = "Địa chỉ quán không được để trống")
    private String address;

    @NotBlank(message = "Số điện thoại liên hệ không được để trống")
    private String phone;

    private String taxCode;
    private String wifiName;
    private String wifiPassword;
    private String footerMessage;
    private String logoUrl;

    private String bankAccountName;
    private String bankAccountNumber;
    private String bankName;
    private String bankBin;
}
