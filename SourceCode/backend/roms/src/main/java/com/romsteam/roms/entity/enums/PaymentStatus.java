package com.romsteam.roms.entity.enums;

/**
 * Trạng thái của hóa đơn thanh toán.
 */
public enum PaymentStatus {
    PENDING,  // Chờ khách thanh toán (ví dụ: đang chờ chuyển khoản hoặc quẹt thẻ)
    PAID,     // Đã thanh toán thành công, tiền đã xác nhận vào két/tài khoản
    FAILED    // Thanh toán thất bại hoặc bị hủy
}

