package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.LoginRequest;
import com.romsteam.roms.dto.response.LoginResponse;

public interface AuthService {

    // Xu ly xac thuc thong tin dang nhap va tra ve token JWT
    LoginResponse login(LoginRequest request);
}
