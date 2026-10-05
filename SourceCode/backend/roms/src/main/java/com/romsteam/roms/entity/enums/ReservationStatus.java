package com.romsteam.roms.entity.enums;

/**
 * Trang thai cua mot don dat ban truoc (Reservation).
 */
public enum ReservationStatus {
    PENDING,    // Cho xac nhan xep ban
    CONFIRMED,  // Da xac nhan va giu ban
    COMPLETED,  // Khach da den va check-in vao ban thanh cong
    CANCELLED   // Da huy (khach huy hoac tu dong huy do no-show)
}
