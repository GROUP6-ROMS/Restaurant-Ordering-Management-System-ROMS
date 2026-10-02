package com.romsteam.roms.entity.enums;

/**
 * Trạng thái của một đơn đặt bàn trước (Reservation).
 */
public enum ReservationStatus {
    PENDING,    // Chờ xác nhận xếp bàn
    CONFIRMED,  // Đã xác nhận và giữ bàn
    COMPLETED,  // Khách đã đến và check-in vào bàn thành công
    CANCELLED   // Đã hủy (khách hủy hoặc tự động hủy do no-show)
}
