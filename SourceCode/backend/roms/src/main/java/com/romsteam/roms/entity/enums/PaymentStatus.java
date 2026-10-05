package com.romsteam.roms.entity.enums;

/**
 * Trang thai cua hoa don thanh toan.
 */
public enum PaymentStatus {
    PENDING,  // Cho khach thanh toan (vi du: dang cho chuyen khoan hoac quet the)
    PAID,     // Da thanh toan thanh cong, tien da xac nhan vao ket/tai khoan
    FAILED    // Thanh toan that bai hoac bi huy
}

