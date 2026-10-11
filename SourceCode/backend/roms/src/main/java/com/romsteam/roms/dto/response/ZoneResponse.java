package com.romsteam.roms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO trả về danh sách phân khu bàn được tải động từ Database và thông tin quản trị
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZoneResponse {

    private Long id;

    // Mã định danh phân khu lưu trong CSDL (ZONE_1, ZONE_2, VIP)
    private String zoneCode;

    // Tên phân khu
    private String name;

    // Tên phân khu hiển thị đẹp trên giao diện đặt bàn (Ví dụ: "Sảnh Chính - Tầng 1")
    private String zoneName;

    // Mô tả trải nghiệm không gian
    private String description;

    // Thứ tự hiển thị
    private Integer displayOrder;

    // Huy hiệu nổi bật (Ví dụ: "Phổ biến", "View đẹp", "Riêng tư")
    private String badge;

    // Tổng số bàn thuộc khu vực này trong CSDL
    private Long totalTables;
    private Long tableCount;

    // Số bàn hiện đang trống và sẵn sàng phục vụ
    private Long availableTables;

    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
