package com.romsteam.roms.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO yêu cầu đóng phiên ăn 0đ (bàn trống không dùng món hoặc mở nhầm bàn)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CloseEmptySessionRequest {

    private String reason; // Lý do đóng bàn: "Khách rời đi, không dùng món", "Mở nhầm bàn", etc.

    private String targetStatus; // "AVAILABLE" hoặc "DIRTY", mặc định là "AVAILABLE"
}
