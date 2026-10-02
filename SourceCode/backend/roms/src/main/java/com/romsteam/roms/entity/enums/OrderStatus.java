package com.romsteam.roms.entity.enums;

//        Trạng thái của một Order trong quy trình bếp:
//        PENDING -> CONFIRMED -> PREPARING -> READY -> SERVED

public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PREPARING,
    READY,
    SERVED,
    CANCELLED,
    REJECTED
}
