package com.romsteam.roms.service.serviceImpl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.romsteam.roms.dto.request.CustomerAiChatRequest;
import com.romsteam.roms.dto.response.CustomerAiChatResponse;
import com.romsteam.roms.dto.response.CustomerMenuItemResponse;
import com.romsteam.roms.entity.MenuItem;
import com.romsteam.roms.repository.MenuItemRepository;
import com.romsteam.roms.service.CustomerAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Hiện thực hóa dịch vụ Trợ lý Ẩm thực AI cho thực khách.
 * Tích hợp trực tiếp với Google Gemini REST API.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerAiServiceImpl implements CustomerAiService {

    private final MenuItemRepository menuItemRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // Lấy API Key từ application.properties
    @Value("${gemini.api.key:}")
    private String geminiApiKey;

      // Tên model (mặc định gemini-1.5-flash)
    @Value("${gemini.api.model:gemini-1.5-flash}")
    private String geminiModel;

    // Template URL của Gemini API
    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent}")
    private String geminiApiUrl;

    @Override
    @Transactional(readOnly = true)
    public CustomerAiChatResponse chatWithCustomer(CustomerAiChatRequest request) {
        log.info("Khách hàng tại bàn [{}] gửi câu hỏi AI: {}", request.getTableNumber(), request.getMessage());

        // 1. Kiểm tra cấu hình API Key
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty() || geminiApiKey.contains("YOUR_GEMINI")) {
            log.warn("Gemini API Key chưa được thiết lập, chuyển sang phản hồi dự phòng thông minh.");
            return buildFallbackResponse(request);
        }

        try {
            // 2. Truy xuất toàn bộ thực đơn đang mở bán để làm nguồn sự thật (Grounding Context)
            List<MenuItem> availableItems = menuItemRepository.findByIsAvailableTrueAndIsActiveTrue();

            // Lọc ra các món thực tế còn hàng trong kho
            List<MenuItem> activeMenu = availableItems.stream()
                    .filter(item -> item.getRemainingStock() == null || item.getRemainingStock() > 0)
                    .collect(Collectors.toList());

            // 3. Xây dựng System Prompt với đầy đủ danh mục món ăn
            String systemInstruction = buildSystemPrompt(activeMenu, request);

            // 4. Xây dựng Payload gửi đến Google Gemini API
            Map<String, Object> geminiPayload = buildGeminiPayload(systemInstruction, request);

            // 5. Chuẩn bị Header HTTP (Hỗ trợ x-goog-api-key cho cả key định dạng mới AQ.)
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
                headers.set("x-goog-api-key", geminiApiKey.trim());
            }

            HttpEntity<Map<String, Object>> httpEntity = new HttpEntity<>(geminiPayload, headers);

            // 6. Gửi request sang Google Gemini endpoint
            String targetUrl = geminiApiUrl.replace("{model}", geminiModel != null ? geminiModel.trim() : "gemini-1.5-flash");
            if (!targetUrl.contains("?key=") && geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
                targetUrl = targetUrl + "?key=" + geminiApiKey.trim();
            }
            ResponseEntity<String> response = restTemplate.exchange(targetUrl, HttpMethod.POST, httpEntity, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                // 7. Phân tích kết quả JSON trả về từ Gemini
                return parseGeminiResponse(response.getBody(), activeMenu);
            }

        } catch (Exception ex) {
            log.error("Lỗi khi kết nối Google Gemini API: {}", ex.getMessage(), ex);
        }

        // Trường hợp API lỗi mạng hoặc timeout: dùng Fallback Response để khách không bị gián đoạn
        return buildFallbackResponse(request);
    }

    /**
     * Xây dựng System Prompt định hình phong cách và danh sách món ăn cho AI
     */
    private String buildSystemPrompt(List<MenuItem> menu, CustomerAiChatRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là 'ROMS Bot' - Trợ lý phục vụ bàn thông minh của nhà hàng cao cấp ROMS Bistro.\n");
        sb.append("Khách hàng đang dùng bữa tại: ").append(request.getTableNumber() != null ? request.getTableNumber() : "Bàn của bạn");
        sb.append(" với số lượng khách: ").append(request.getGuestCount() != null ? request.getGuestCount() : 2).append(" người.\n");

        if (request.getCartItems() != null && !request.getCartItems().isEmpty()) {
            sb.append("Món ăn khách ĐÃ CHỌN trong giỏ hàng: ").append(String.join(", ", request.getCartItems())).append(".\n");
            sb.append("- Hãy ưu tiên gợi ý các món ĐI KÈM phù hợp (nước uống, món tráng miệng, món khai vị/ăn kèm) để bổ trợ, tránh gợi ý lại trùng lặp đúng các món khách đã có trong giỏ hàng.\n");
        }
        sb.append("\n");

        sb.append("NGUYÊN TẮC BẮT BUỘC:\n");
        sb.append("1. NGUYÊN TẮC THỰC ĐƠN: Chỉ được gợi ý các món ăn có trong danh sách thực đơn bên dưới. Tuyệt đối KHÔNG bịa ra món nhà hàng không bán.\n");
        sb.append("2. XỬ LÝ MÓN NGOÀI THỰC ĐƠN: Nếu khách hỏi món nhà hàng KHÔNG BÁN (ví dụ Pizza, Trà sữa,...), BẮT BUỘC phải lịch thiệp giải thích: 'Dạ nhà hàng ROMS hiện chưa phục vụ món [Tên món], nhưng em xin gợi ý cho quý khách món [Tên món có sẵn tương tự] rất ngon ạ!'.\n");
        sb.append("3. RÀNG BUỘC NGÂN SÁCH: Nếu khách hỏi theo mức giá/ngân sách (ví dụ 'dưới 200k', 'khoảng 500k cho 2 người'), hãy tính tổng giá tiền các món sao cho tổng giá <= ngân sách yêu cầu.\n");
        sb.append("4. AN TOÀN DỊ ỨNG & MÓN CHAY: Nếu khách báo ăn chay hoặc dị ứng (hải sản, đậu phộng, bò...), CHỈ ĐƯỢC CHỌN món mà Tên/Mô tả/Nhãn ghi rõ là Món Chay hoặc không có chất gây dị ứng đó. Nếu không chắc chắn, hãy nhắc khách lưu ý thêm với nhân viên phục vụ khi ra món.\n");
        sb.append("5. KHẨU PHẦN ĂN: Cân đối số lượng từ 1 đến 4 món ăn tiêu biểu phù hợp với số lượng ").append(request.getGuestCount() != null ? request.getGuestCount() : 2).append(" người.\n");
        sb.append("6. ĐỊNH DẠNG: Lời thoại bằng tiếng Việt, lịch thiệp, ấm áp, ngắn gọn và súc tích (vì khách đọc trên màn hình điện thoại). BẮT BUỘC trả về kết quả dưới định dạng JSON nguyên bản (Raw JSON) theo cấu trúc mẫu sau, không bọc markdown ```json:\n");
        sb.append("{\n");
        sb.append("  \"reply\": \"Lời thoại tư vấn gửi khách...\",\n");
        sb.append("  \"suggestedDishIds\": [1, 5, 8],\n");
        sb.append("  \"quickSuggestions\": [\"Gợi ý nước uống đi kèm\", \"Xem món tráng miệng\"],\n");
        sb.append("  \"actionType\": \"NONE\"\n");
        sb.append("}\n\n");

        sb.append("DANH SÁCH THỰC ĐƠN HIỆN CÓ CỦA NHÀ HÀNG (CÒN HÀNG VÀ ĐANG MỞ BÁN):\n");
        for (MenuItem item : menu) {
            sb.append("- [ID: ").append(item.getId()).append("] ")
                    .append(item.getName())
                    .append(" | Giá: ").append(item.getPrice()).append(" VNĐ")
                    .append(" | Nhãn: ").append(item.getTag() != null ? item.getTag() : "Tiêu chuẩn")
                    .append(" | Mô tả: ").append(item.getDescription() != null ? item.getDescription() : "Món ăn đặc sắc")
                    .append("\n");
        }

        return sb.toString();
    }

    /**
     * Tạo Payload gửi Gemini API theo cấu trúc chuẩn v1beta
     */
    private Map<String, Object> buildGeminiPayload(String systemInstruction, CustomerAiChatRequest request) {
        Map<String, Object> payload = new HashMap<>();

        // Cấu hình tham số sinh văn bản (Nhiệt độ thấp 0.2 để câu trả lời bám sát thực đơn)
        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("temperature", 0.3);
        genConfig.put("responseMimeType", "application/json");
        payload.put("generationConfig", genConfig);

        // System Instruction
        Map<String, Object> systemPart = new HashMap<>();
        systemPart.put("parts", List.of(Map.of("text", systemInstruction)));
        payload.put("systemInstruction", systemPart);

        // Lịch sử chat và câu hỏi hiện tại
        List<Map<String, Object>> contents = new ArrayList<>();
        if (request.getHistory() != null) {
            boolean hasFirstUser = false;
            for (CustomerAiChatRequest.ChatMessageHistoryDto h : request.getHistory()) {
                String role = "user".equalsIgnoreCase(h.getRole()) ? "user" : "model";
                // Bắt buộc tin nhắn đầu tiên của contents phải là 'user'
                if (!hasFirstUser && "model".equals(role)) {
                    continue;
                }
                hasFirstUser = true;
                contents.add(Map.of(
                        "role", role,
                        "parts", List.of(Map.of("text", h.getText()))
                ));
            }
        }

        // Câu hỏi mới nhất từ khách
        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", request.getMessage()))
        ));

        payload.put("contents", contents);
        return payload;
    }

    /**
     * Bóc tách JSON từ phản hồi của Gemini và gắn đối tượng món ăn thực tế
     */
    private CustomerAiChatResponse parseGeminiResponse(String rawResponseBody, List<MenuItem> activeMenu) {
        try {
            JsonNode root = objectMapper.readTree(rawResponseBody);
            JsonNode candidate = root.path("candidates").get(0);
            String aiRawText = candidate.path("content").path("parts").get(0).path("text").asText();

            // Loại bỏ bớt ký tự markdown backticks nếu có
            String cleanJson = aiRawText.trim();
            if (cleanJson.startsWith("```json")) {
                cleanJson = cleanJson.substring(7);
            }
            if (cleanJson.startsWith("```")) {
                cleanJson = cleanJson.substring(3);
            }
            if (cleanJson.endsWith("```")) {
                cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
            }
            cleanJson = cleanJson.trim();

            JsonNode parsedAi = objectMapper.readTree(cleanJson);
            String reply = parsedAi.path("reply").asText("Dạ ROMS xin chào quý khách!");
            String actionType = parsedAi.path("actionType").asText("NONE");

            // Lấy danh sách ID món ăn được đề xuất
            List<Long> dishIds = new ArrayList<>();
            JsonNode idsNode = parsedAi.path("suggestedDishIds");
            if (idsNode.isArray()) {
                for (JsonNode idItem : idsNode) {
                    dishIds.add(idItem.asLong());
                }
            }

            // Lấy danh sách gợi ý câu hỏi tiếp theo
            List<String> quickSuggestions = new ArrayList<>();
            JsonNode suggestionsNode = parsedAi.path("quickSuggestions");
            if (suggestionsNode.isArray()) {
                for (JsonNode s : suggestionsNode) {
                    quickSuggestions.add(s.asText());
                }
            }

            // Khớp các ID với dữ liệu món ăn trong DB để trả về CustomerMenuItemResponse đầy đủ
            Map<Long, MenuItem> menuMap = activeMenu.stream().collect(Collectors.toMap(MenuItem::getId, m -> m));
            List<CustomerMenuItemResponse> suggestedDishes = dishIds.stream()
                    .filter(menuMap::containsKey)
                    .map(id -> mapToMenuItemResponse(menuMap.get(id)))
                    .collect(Collectors.toList());

            return CustomerAiChatResponse.builder()
                    .reply(reply)
                    .suggestedDishes(suggestedDishes)
                    .quickSuggestions(quickSuggestions.isEmpty() ? List.of("Món bán chạy", "Nước uống ngon") : quickSuggestions)
                    .actionType(actionType)
                    .build();

        } catch (Exception e) {
            log.error("Không thể bóc tách JSON từ AI: {}", e.getMessage());
            return buildFallbackResponse(null);
        }
    }

    /**
     * Map Entity MenuItem sang DTO phản hồi đầy đủ
     */
    private CustomerMenuItemResponse mapToMenuItemResponse(MenuItem item) {
        return CustomerMenuItemResponse.builder()
                .id(item.getId())
                .categoryId(item.getCategory() != null ? item.getCategory().getId() : null)
                .categoryName(item.getCategory() != null ? item.getCategory().getName() : "")
                .sku(item.getSku())
                .name(item.getName())
                .description(item.getDescription())
                .price(item.getPrice())
                .station(item.getStation())
                .tag(item.getTag())
                .imageUrl(item.getImageUrl())
                .isAvailable(item.getIsAvailable())
                .remainingStock(item.getRemainingStock())
                .prepTime("10-15p")
                .build();
    }

    /**
     * Phản hồi dự phòng khi chưa cấu hình Key hoặc mất mạng Internet
     */
    private CustomerAiChatResponse buildFallbackResponse(CustomerAiChatRequest request) {
        // Chỉ lấy các món ĐANG BÁN và CÒN HÀNG TRONG KHO (remainingStock > 0 hoặc không giới hạn)
        List<MenuItem> availableItems = menuItemRepository.findByIsAvailableTrueAndIsActiveTrue().stream()
                .filter(item -> item.getRemainingStock() == null || item.getRemainingStock() > 0)
                .collect(Collectors.toList());

        // Ưu tiên các món Bestseller hoặc Chef's Choice nổi bật
        List<CustomerMenuItemResponse> dishes = availableItems.stream()
                .sorted((a, b) -> {
                    boolean bHot = b.getTag() != null && (b.getTag().toLowerCase().contains("bestseller") || b.getTag().toLowerCase().contains("chef"));
                    boolean aHot = a.getTag() != null && (a.getTag().toLowerCase().contains("bestseller") || a.getTag().toLowerCase().contains("chef"));
                    return Boolean.compare(bHot, aHot);
                })
                .limit(3)
                .map(this::mapToMenuItemResponse)
                .collect(Collectors.toList());

        return CustomerAiChatResponse.builder()
                .reply("Dạ chào bạn! Em là trợ lý ROMS Bistro. Hôm nay nhà hàng có nhiều món đặc sắc đang rất được ưa chuộng, mời bạn tham khảo các món nổi bật bên dưới nhé ạ!")
                .suggestedDishes(dishes)
                .quickSuggestions(List.of("Món bán chạy nhất", "Món thanh đạm", "Xem đồ uống"))
                .actionType("NONE")
                .build();
    }
}
