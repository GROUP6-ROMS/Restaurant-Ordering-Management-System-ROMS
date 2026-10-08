package com.romsteam.roms.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableSummaryResponse {

    // Thẻ 1: Tổng số bàn & tổng số chỗ ngồi
    private Long totalTables;
    private Integer totalSeats;

    // Thẻ 2: Bàn đang phục vụ & số khách thực tế đang ngồi
    private Long occupiedTables;
    private Integer occupiedGuests;

    // Thẻ 3: Bàn trống sẵn sàng đón khách
    private Long availableTables;

    // Thẻ 4: Bàn đã đặt trước
    private Long reservedTables;

    // Thẻ 5: Bàn đang khóa / bảo trì
    private Long blockedTables;
}
