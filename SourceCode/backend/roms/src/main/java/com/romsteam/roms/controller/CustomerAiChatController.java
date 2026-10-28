package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.CustomerAiChatRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.CustomerAiChatResponse;
import com.romsteam.roms.service.CustomerAiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller phụ trách nhận câu hỏi từ khách hàng tại bàn và phản hồi tư vấn AI
 */
@RestController
@RequestMapping("/api/customer/ai")
@RequiredArgsConstructor
@Tag(name = "Customer AI Assistant", description = "Trợ lý ẩm thực ảo hỗ trợ thực khách tại bàn")
public class CustomerAiChatController {

    private final CustomerAiService customerAiService;

    /**
     * Gửi câu hỏi đến Trợ lý AI
     * POST /api/customer/ai/chat
     */
    @PostMapping("/chat")
    @Operation(summary = "Thực khách trò chuyện và xin tư vấn món ăn từ AI")
    public ResponseEntity<ApiResponse<CustomerAiChatResponse>> chat(
            @Valid @RequestBody CustomerAiChatRequest request) {

        CustomerAiChatResponse response = customerAiService.chatWithCustomer(request);
        return ResponseEntity.ok(ApiResponse.success(response, "AI phản hồi thành công"));
    }
}
