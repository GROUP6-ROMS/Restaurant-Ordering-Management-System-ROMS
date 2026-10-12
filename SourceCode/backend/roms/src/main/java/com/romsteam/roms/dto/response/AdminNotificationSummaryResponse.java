package com.romsteam.roms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO tổng hợp toàn bộ các thông báo gửi đến Quản lý
 * Bao gồm tổng số lượng và danh sách chia theo danh mục
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminNotificationSummaryResponse {

    // Tổng số lượng thông báo đang chờ xử lý
    private int totalCount;

    // Số lượng bàn đang cần nhân viên hỗ trợ
    private int assistanceCount;

    // Số lượng đơn đặt bàn trực tuyến mới cần duyệt & xếp bàn
    private int reservationCount;

    // Danh sách toàn bộ thông báo (sắp xếp mới nhất lên đầu)
    private List<AdminNotificationItemResponse> items;

    // Danh sách riêng các yêu cầu hỗ trợ tại bàn
    private List<AdminNotificationItemResponse> assistanceItems;

    // Danh sách riêng các đơn đặt bàn mới
    private List<AdminNotificationItemResponse> reservationItems;
}
