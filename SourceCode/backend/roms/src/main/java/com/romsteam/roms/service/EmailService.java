package com.romsteam.roms.service;

import com.romsteam.roms.entity.Reservation;

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

    /**
     * Gửi email xác nhận tiếp nhận đơn đặt bàn thành công (trạng thái PENDING)
     *
     * @param reservation Phiếu đặt bàn
     */
    void sendReservationCreatedEmail(Reservation reservation);

    /**
     * Gửi email thông báo đơn đặt bàn đã được Quản lý xác nhận và xếp bàn (trạng thái CONFIRMED)
     *
     * @param reservation Phiếu đặt bàn
     * @param tableNumber Mã bàn ăn (ví dụ: VIP-02, T-01)
     * @param zoneName    Tên phân khu (ví dụ: Phòng VIP, Tầng 1 - Sảnh Chính)
     */
    void sendReservationConfirmedEmail(Reservation reservation, String tableNumber, String zoneName);

    /**
     * Gửi email thông báo đơn đặt bàn đã bị hủy
     *
     * @param reservation  Phiếu đặt bàn
     * @param cancelReason Lý do hủy đặt bàn
     */
    void sendReservationCancelledEmail(Reservation reservation, String cancelReason);
}
