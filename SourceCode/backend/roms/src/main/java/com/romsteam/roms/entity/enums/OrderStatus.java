package com.romsteam.roms.entity.enums;

//        Trang thai cua mot Order trong quy trinh bep:
//        PENDING -> CONFIRMED -> PREPARING -> READY -> SERVED

public enum OrderStatus {
    SUBMITTED,  // Khach vua gui dot goi mon thanh cong tu dien thoai
    CONFIRMED,  // Phuc vu hoac quan ly da bam duyet don de chuyen lenh vao bep
    COOKING,    // Bep dang che bien cac mon trong dot goi mon nay
    READY,      // Bep da nau xong toan bo mon, chuong bao phuc vu ra lay mon
    SERVED,     // Phuc vu da bung toan bo mon ra dat len ban cho khach
    CANCELLED   // Dot goi mon bi huy bo
}
