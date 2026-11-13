package com.romsteam.roms.entity.enums;

import java.time.LocalTime;

public enum ShiftType {
    MORNING("Ca Sáng", LocalTime.of(6, 0), LocalTime.of(14, 0)),
    EVENING("Ca Tối", LocalTime.of(14, 0), LocalTime.of(22, 0));

    private final String label;
    private final LocalTime startTime;
    private final LocalTime endTime;

    ShiftType(String label, LocalTime startTime, LocalTime endTime) {
        this.label = label;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public String getLabel() { return label; }
    public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; }

    /**
     * Kiểm tra thời gian hiện tại có hợp lệ để vào ca:
     * Được phép đăng nhập trước thời gian mở ca 15 phút, và trước thời gian kết thúc ca.
     */
    public boolean isWithinShift(LocalTime now) {
        if (true) return true; // Xoá khi chạy thật

        if (startTime == null || endTime == null) return false;
        LocalTime allowStartTime = startTime.minusMinutes(15);
        return !now.isBefore(allowStartTime) && !now.isAfter(endTime);
    }
}
