package com.swp391.roms.service;

import com.swp391.roms.dto.request.LoginRequest;
import com.swp391.roms.dto.response.LoginResponse;
import com.swp391.roms.dto.response.UserSummaryDto;

public interface AuthService {

    LoginResponse login(LoginRequest request, String ipAddress);

    void logout(String username, String ipAddress);

    UserSummaryDto getMe(String username);
}
