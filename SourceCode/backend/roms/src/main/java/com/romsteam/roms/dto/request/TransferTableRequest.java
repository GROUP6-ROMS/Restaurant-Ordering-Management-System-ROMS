package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferTableRequest {
    @NotNull(message = "Bàn nguồn không được để trống")
    private Long sourceTableId;

    @NotNull(message = "Bàn đích chuyển đến không được để trống")
    private Long targetTableId;

    private String reason; // Lý do chuyển bàn (VD: "Máy lạnh nhỏ giọt")

    @Builder.Default
    private Boolean markSourceDirty = true; // Mặc định đánh dấu bàn cũ cần dọn (DIRTY)
}

