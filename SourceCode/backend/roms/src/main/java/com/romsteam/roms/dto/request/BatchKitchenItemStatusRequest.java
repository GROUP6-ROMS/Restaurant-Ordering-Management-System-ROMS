package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchKitchenItemStatusRequest {
    @NotEmpty(message = "Danh sách ID món không được để trống")
    private List<Long> itemIds;

    @NotBlank(message = "Trạng thái không được để trống")
    private String status;
}
