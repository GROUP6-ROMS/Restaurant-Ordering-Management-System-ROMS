package com.romsteam.roms.entity.enums;

// Trang thai cua mot ban an trong nha hang.
public enum TableStatus {
    AVAILABLE,  // Bàn trống sẵn sàng đón khách
    OCCUPIED,   // Bàn đang có khách ngồi ăn (phiên ăn ACTIVE)
    DIRTY,      // Khách đã thanh toán rời đi, bàn chờ nhân viên dọn dẹp
    RESERVED,   // Bàn đã có khách đặt trước (kèm giờ hẹn và thông tin liên hệ)
    BLOCKED     // Bàn tạm khóa / bảo trì trang thiết bị
}
