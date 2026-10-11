package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO nhận dữ liệu từ Form đặt bàn của Khách hàng
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReservationRequest {

    // Họ tên khách hàng
    @NotBlank(message = "Vui lòng nhập họ và tên của bạn")
    private String customerName;

    // Số điện thoại liên hệ (chuẩn 10 số di động Việt Nam)
    @NotBlank(message = "Vui lòng nhập số điện thoại liên hệ")
    @Pattern(regexp = "^(0[3|5|7|8|9])[0-9]{8}$", message = "Số điện thoại không hợp lệ (cần 10 chữ số)")
    private String customerPhone;

    // Email liên hệ (không bắt buộc)
    private String customerEmail;

    // Số lượng khách trong đoàn (tối thiểu 1 khách)
    @NotNull(message = "Vui lòng chỉ định số lượng khách")
    @Min(value = 1, message = "Số lượng khách tối thiểu là 1 người")
    private Integer guestCount;

    // Ngày dùng bữa (Định dạng YYYY-MM-DD, chọn từ Date Picker)
    @NotBlank(message = "Vui lòng chọn ngày dùng bữa")
    private String reservationDate;

    // Khung giờ dùng bữa (Định dạng HH:mm, ví dụ 19:00 hoặc 18:45)
    @NotBlank(message = "Vui lòng chọn hoặc nhập khung giờ dùng bữa")
    private String reservationTime;

    // Khu vực bàn mong muốn (ZONE_1, ZONE_2, VIP... lấy từ CSDL)
    @NotBlank(message = "Vui lòng chọn khu vực bàn mong muốn")
    private String requestedZone;

    // Ghi chú thêm của khách
    private String note;
}
