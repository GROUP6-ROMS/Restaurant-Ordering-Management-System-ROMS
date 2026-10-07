package com.romsteam.roms.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    // Chuoi JWT Token
    private String accessToken;

    // Kieu token chuan RFC 6750 (mac dinh Bearer)
    @Builder.Default
    private String tokenType = "Bearer";

    // Thong tin nhan vien
    private Long id;
    private String username;
    private String fullName;
    private String role; // MANAGER, WAITER, KITCHEN, CASHIER

    // Thong tin ca lam viec
    private String assignedShift;
    private Boolean isOnShift;
}