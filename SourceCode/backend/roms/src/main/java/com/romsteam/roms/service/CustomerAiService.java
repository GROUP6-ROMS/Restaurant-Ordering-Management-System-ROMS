package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.CustomerAiChatRequest;
import com.romsteam.roms.dto.response.CustomerAiChatResponse;

public interface CustomerAiService {
    /**
     * Tiếp nhận câu hỏi của thực khách, nạp thực đơn thời gian thực và gọi AI tư vấn
     * @param request dữ liệu câu hỏi và ngữ cảnh bàn ăn
     * @return câu trả lời kèm danh sách món ăn gợi ý
     */
    CustomerAiChatResponse chatWithCustomer(CustomerAiChatRequest request);
}
