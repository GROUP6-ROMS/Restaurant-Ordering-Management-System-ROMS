package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * DTO chứa thông điệp từ thực khách gửi lên trợ lý AI.
 * Mang theo ngữ cảnh bàn ăn để AI phản hồi chính xác nhất.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerAiChatRequest {

    // Câu hỏi hoặc yêu cầu của khách hàng (Bắt buộc không được để trống)
    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    private String message;

    // ID bàn ăn khách đang ngồi (nếu có)
    private Long tableId;

    // Tên hoặc số bàn hiển thị (ví dụ: "Bàn 05", "Bàn T02")
    private String tableNumber;

    // Số lượng khách đang ngồi tại bàn (dùng để gợi ý khẩu phần phù hợp)
    private Integer guestCount;

    // Danh sách món hiện có trong giỏ hàng của khách (để AI gợi ý món ăn kèm, tránh trùng lặp)
    private List<String> cartItems;

    // Lịch sử vài câu trò chuyện gần nhất để duy trì ngữ cảnh liên tục
    private List<ChatMessageHistoryDto> history;

    /**
     * Lớp con lưu trữ từng lượt trao đổi trong quá khứ
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatMessageHistoryDto {
        // Vai trò người nói: "user" (khách) hoặc "model" (AI)
        private String role;
        // Nội dung tin nhắn
        private String text;
    }
}
