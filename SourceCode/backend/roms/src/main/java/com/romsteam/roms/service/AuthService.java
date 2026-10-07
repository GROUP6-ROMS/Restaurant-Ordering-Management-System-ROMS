package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.LoginRequest;
import com.romsteam.roms.dto.response.LoginResponse;

public interface AuthService {

    // Xu ly xac thuc thong tin dang nhap va tra ve token JWT
    LoginResponse login(LoginRequest request);

    // Xac thuc ma PIN cua Quan ly
    boolean verifyManagerPin(com.romsteam.roms.dto.request.VerifyManagerPinRequest request);

    // Dang xuat: neu da het ca hoac ket thuc ca thi cap nhat isOnShift = false
    void logout(String username);
}
