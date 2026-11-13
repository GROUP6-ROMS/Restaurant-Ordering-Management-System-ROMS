package com.romsteam.roms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * DTO dữ liệu trả về cho giao diện Chatbox của khách.
 * Bao gồm cả văn bản trả lời và danh sách đối tượng món ăn được gợi ý.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerAiChatResponse {

    // Lời thoại phản hồi tự nhiên, thân thiện bằng tiếng Việt của trợ lý ảo
    private String reply;

    // Danh sách các món ăn thực tế được gợi ý (đầy đủ ảnh, giá, mô tả để hiển thị Card)
    private List<CustomerMenuItemResponse> suggestedDishes;

    // Danh sách các câu hỏi gợi ý tiếp theo (Quick Chips để khách bấm nhanh)
    private List<String> quickSuggestions;

    // Loại hành động được AI phát hiện (NONE, CALL_WAITER, REQUEST_BILL, TRACK_ORDER)
    private String actionType;
}
