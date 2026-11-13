package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MergeTableRequest {

    @NotNull(message = "Bàn nguồn (bàn cần gộp) không được để trống")
    private Long sourceTableId;

    @NotNull(message = "Bàn đích (bàn chính giữ lại) không được để trống")
    private Long targetTableId;

    private String reason; // Lý do gộp bàn (VD: "Khách đi cùng nhóm, muốn ngồi chung và tính 1 hóa đơn")

    @Builder.Default
    private Boolean markSourceDirty = true; // Đánh dấu bàn nguồn sau khi gộp thành Cần dọn (DIRTY)
}
