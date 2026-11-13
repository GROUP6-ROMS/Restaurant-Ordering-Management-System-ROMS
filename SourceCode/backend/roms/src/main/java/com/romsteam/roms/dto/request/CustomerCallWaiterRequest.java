package com.romsteam.roms.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO yêu cầu gọi nhân viên hỗ trợ từ khách hàng tại bàn
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerCallWaiterRequest {

    // Loại yêu cầu: "CALL_WAITER", "REQUEST_ICE", "REQUEST_BILL", "SUPPORT"...
    @Builder.Default
    private String requestType = "CALL_WAITER";

    // Nội dung ghi chú chi tiết hoặc nhu cầu của khách
    private String note;
}
