package com.romsteam.roms.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private String accessToken;
    @Builder.Default
    private String tokenType = "Bearer";

    private Long id;
    private String username;
    private String fullName;
    private String role; // MANAGER, WAITER, KITCHEN, CASHIER

    // Thong tin ca truc
    private String assignedShift;
    private Boolean isOnShift;
}
