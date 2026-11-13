package com.romsteam.roms.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantProfileResponse {
    private Long id;
    private String name;
    private String brandName;
    private String tagline;
    private String address;
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
    private LocalDateTime updatedAt;
}
