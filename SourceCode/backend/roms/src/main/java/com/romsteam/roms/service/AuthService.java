package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.LoginRequest;
import com.romsteam.roms.dto.response.LoginResponse;

public interface AuthService {

    // Xu ly xac thuc thong tin dang nhap va tra ve token JWT
    LoginResponse login(LoginRequest request);

    // Xac thuc ma PIN cua Quan ly
    boolean verifyManagerPin(com.romsteam.roms.dto.request.VerifyManagerPinRequest request);

    // Khi nhan vien bam Dang xuat, he thong cap nhat isOnShift = false.
    // LUU Y: Trong luc dang truc, du qua gio ca nhan vien van thao tac tren web binh thuong, chi bi chan khi da logout va co tinh dang nhap lai.
    void logout(String username);

    // Yeu cau sinh ma OTP khoi phuc ma PIN (danh cho Quan ly / Admin)
    java.util.Map<String, Object> requestPinResetOtp(com.romsteam.roms.dto.request.RequestOtpRequest request);

    // Dat lai ma PIN bang ma OTP hoac Master Recovery Key
    void resetPinWithOtpOrRecoveryKey(com.romsteam.roms.dto.request.ResetPinRequest request);
}
