package com.romsteam.roms.service;

/**
 * Dịch vụ gửi email thông báo và xác thực OTP qua Gmail SMTP
 */
public interface EmailService {

    /**
     * Gửi email chứa mã OTP khôi phục mã PIN tới địa chỉ email của Quản lý
     *
     * @param toEmail       Địa chỉ email người nhận
     * @param recipientName Họ và tên người nhận
     * @param otp           Mã xác thực OTP 6 chữ số
     * @return true nếu gửi thành công (hoặc mock thành công trong môi trường dev)
     */
    boolean sendOtpEmail(String toEmail, String recipientName, String otp);
}

