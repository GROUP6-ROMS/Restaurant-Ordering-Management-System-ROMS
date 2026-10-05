package com.romsteam.roms.entity.enums;

public enum OrderItemStatus {
    PENDING,    // Cho bep tiep nhan mon
    COOKING,    // Dau bep dang nau mon nay
    READY,      // Dau bep nau xong, mon dang dat o ban tiep nhan (pass)
    SERVED,     // Nhan vien phuc vu da bung dia mon toi ban khach
    CANCELLED   // Khach xin huy mon nay (vi du: cho lau hoac bep bao het nguyen lieu)
}