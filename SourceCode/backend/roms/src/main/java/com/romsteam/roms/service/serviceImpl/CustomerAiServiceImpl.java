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

import java.math.BigDecimal;
import java.text.Normalizer;
import java.text.NumberFormat;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Hiện thực hóa dịch vụ Trợ lý Ẩm thực AI cho thực khách.
 * Tích hợp trực tiếp với Google Gemini REST API kèm bộ gợi ý dự phòng thông minh theo ngữ cảnh.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerAiServiceImpl implements CustomerAiService {

    private static final String DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
    private static final Pattern BUDGET_PATTERN = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(k|nghin|ngan|tr|trieu|d|vnd)?");

    private final MenuItemRepository menuItemRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // Lấy API Key từ cấu hình / biến môi trường GEMINI_API_KEY
    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    // Tên model (mặc định gemini-2.5-flash)
    @Value("${gemini.api.model:gemini-2.5-flash}")
    private String geminiModel;

    // Template URL của Gemini API
    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent}")
    private String geminiApiUrl;

    @Override
    @Transactional(readOnly = true)
    public CustomerAiChatResponse chatWithCustomer(CustomerAiChatRequest request) {
        log.info("Khách hàng tại bàn [{}] gửi câu hỏi AI: {}", request.getTableNumber(), request.getMessage());

        // Truy xuất thực đơn đang mở bán & còn hàng một lần để dùng chung cho cả Gemini và Fallback
        List<MenuItem> activeMenu = getActiveInStockMenu();

        // 1. Kiểm tra cấu hình API Key
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty() || geminiApiKey.contains("YOUR_GEMINI")) {
            log.warn("Gemini API Key chưa được thiết lập, chuyển sang phản hồi dự phòng thông minh.");
            return buildFallbackResponse(request, activeMenu);
        }

        try {
            // 2. Xây dựng System Prompt với đầy đủ danh mục món ăn
            String systemInstruction = buildSystemPrompt(activeMenu, request);

            // 3. Xây dựng Payload gửi đến Google Gemini API
            Map<String, Object> geminiPayload = buildGeminiPayload(systemInstruction, request);

            // 4. Chuẩn bị Header HTTP
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", geminiApiKey.trim());

            HttpEntity<Map<String, Object>> httpEntity = new HttpEntity<>(geminiPayload, headers);

            // 5. Gửi request sang Google Gemini endpoint
            String resolvedModel = (geminiModel != null && !geminiModel.trim().isEmpty())
                    ? geminiModel.trim()
                    : DEFAULT_GEMINI_MODEL;
            String targetUrl = geminiApiUrl.replace("{model}", resolvedModel);
            if (!targetUrl.contains("?key=")) {
                targetUrl = targetUrl + "?key=" + geminiApiKey.trim();
            }
            ResponseEntity<String> response = restTemplate.exchange(targetUrl, HttpMethod.POST, httpEntity, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                // 6. Phân tích kết quả JSON trả về từ Gemini
                return parseGeminiResponse(response.getBody(), activeMenu, request);
            }

        } catch (Exception ex) {
            log.error("Lỗi khi kết nối Google Gemini API: {}", ex.getMessage(), ex);
        }

        // Trường hợp API lỗi mạng, hết quota hoặc timeout: dùng Smart Fallback Response theo ngữ cảnh câu hỏi
        return buildFallbackResponse(request, activeMenu);
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
    private CustomerAiChatResponse parseGeminiResponse(String rawResponseBody, List<MenuItem> activeMenu, CustomerAiChatRequest request) {
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
            return buildFallbackResponse(request, activeMenu);
        }
    }

    /**
     * Lấy toàn bộ món đang mở bán và thực tế còn hàng trong kho
     */
    private List<MenuItem> getActiveInStockMenu() {
        List<MenuItem> availableItems = menuItemRepository.findByIsAvailableTrueAndIsActiveTrue();
        if (availableItems == null || availableItems.isEmpty()) {
            return Collections.emptyList();
        }
        return availableItems.stream()
                .filter(item -> item.getRemainingStock() == null || item.getRemainingStock() > 0)
                .collect(Collectors.toList());
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
     * Phản hồi dự phòng thông minh theo ngữ cảnh câu hỏi khi chưa có Key hoặc API bên ngoài gián đoạn
     */
    private CustomerAiChatResponse buildFallbackResponse(CustomerAiChatRequest request, List<MenuItem> activeMenu) {
        List<MenuItem> menuPool = (activeMenu != null) ? activeMenu : getActiveInStockMenu();
        List<MenuItem> candidatePool = excludeCartItems(menuPool, request != null ? request.getCartItems() : null);
        if (candidatePool.isEmpty()) {
            candidatePool = menuPool;
        }

        String normalizedMsg = normalizeText(request != null ? request.getMessage() : "");
        int guestCount = (request != null && request.getGuestCount() != null && request.getGuestCount() > 0)
                ? request.getGuestCount()
                : 2;

        // 1. Ưu tiên kiểm tra ý định theo ngân sách nếu khách nêu giá (vd: "dưới 200k", "tầm 500k")
        BigDecimal budget = extractBudget(normalizedMsg);
        if (budget != null && containsAny(normalizedMsg, "duoi", "khoang", "tam", "ngan sach", "gia", "re", "tiet kiem")) {
            List<MenuItem> withinBudget = candidatePool.stream()
                    .filter(item -> item.getPrice() != null && item.getPrice().compareTo(budget) <= 0)
                    .sorted(Comparator.comparing(MenuItem::getPrice).reversed())
                    .limit(4)
                    .toList();
            if (!withinBudget.isEmpty()) {
                String budgetDisplay = formatVietnameseCurrency(budget);
                return CustomerAiChatResponse.builder()
                        .reply("Dạ với mức ngân sách dưới " + budgetDisplay + ", em chọn giúp mình các món vừa vặn và đang sẵn sàng phục vụ bên dưới nhé ạ!")
                        .suggestedDishes(withinBudget.stream().map(this::mapToMenuItemResponse).toList())
                        .quickSuggestions(List.of("Món bán chạy nhất", "Gợi ý đồ uống đi kèm", "Xem món tráng miệng"))
                        .actionType("NONE")
                        .build();
            }
        }

        // 2. Đối chiếu theo các nhóm chủ đề ẩm thực phổ biến (đồ uống, tráng miệng, chay, hải sản, bò, trẻ em...)
        for (FallbackIntentRule rule : FALLBACK_INTENT_RULES) {
            if (containsAny(normalizedMsg, rule.triggerKeywords())) {
                List<MenuItem> matched = candidatePool.stream()
                        .filter(item -> matchesDishKeywords(item, rule))
                        .sorted(this::compareHotDishesFirst)
                        .limit(4)
                        .toList();

                if (!matched.isEmpty()) {
                    return CustomerAiChatResponse.builder()
                            .reply(rule.reply())
                            .suggestedDishes(matched.stream().map(this::mapToMenuItemResponse).toList())
                            .quickSuggestions(rule.quickSuggestions())
                            .actionType("NONE")
                            .build();
                }
            }
        }

        // 3. Nếu khách hỏi món bán chạy / gợi ý set ăn theo số người / hoặc đã có món trong giỏ hàng
        boolean hasCart = request != null && request.getCartItems() != null && !request.getCartItems().isEmpty();
        if (containsAny(normalizedMsg, "ban chay", "ngon", "noi bat", "dac sac", "set", "nguoi", "goi y", "tu van")) {
            List<MenuItem> topForGroup = candidatePool.stream()
                    .sorted(this::compareHotDishesFirst)
                    .limit(guestCount >= 4 ? 4 : 3)
                    .toList();
            String reply = String.format(
                    "Dạ với bàn %d người, em gợi ý các món đặc trưng được thực khách gọi nhiều nhất hôm nay để mình dễ kết hợp nhé ạ!",
                    guestCount
            );
            return CustomerAiChatResponse.builder()
                    .reply(reply)
                    .suggestedDishes(topForGroup.stream().map(this::mapToMenuItemResponse).toList())
                    .quickSuggestions(List.of("Gợi ý nước uống đi kèm", "Có món thanh đạm không?", "Xem món tráng miệng"))
                    .actionType("NONE")
                    .build();
        }

        if (hasCart) {
            List<MenuItem> companionItems = candidatePool.stream()
                    .filter(item -> "WAITER".equalsIgnoreCase(item.getStation())
                            || containsAny(buildSearchableDishText(item), "nuoc", "tra", "salad", "sup", "trang mieng", "banh"))
                    .sorted(this::compareHotDishesFirst)
                    .limit(3)
                    .toList();
            if (!companionItems.isEmpty()) {
                return CustomerAiChatResponse.builder()
                        .reply("Dạ em thấy mình đã chọn món trong giỏ rồi ạ! Em gợi ý thêm vài món ăn kèm & đồ uống để bữa ăn tròn vị hơn nhé ạ.")
                        .suggestedDishes(companionItems.stream().map(this::mapToMenuItemResponse).toList())
                        .quickSuggestions(List.of("Món bán chạy nhất", "Xem món tráng miệng", "Món ngon cho trẻ nhỏ"))
                        .actionType("NONE")
                        .build();
            }
        }

        // 4. Tìm kiếm trực tiếp theo từ khóa rời trong tên/mô tả món ăn nếu khách nhắc tên một món cụ thể
        List<MenuItem> directMatches = findDirectKeywordMatches(normalizedMsg, candidatePool);
        if (!directMatches.isEmpty()) {
            return CustomerAiChatResponse.builder()
                    .reply("Dạ em tìm thấy các món phù hợp nhất với yêu cầu của mình trong thực đơn hiện có bên dưới ạ!")
                    .suggestedDishes(directMatches.stream().map(this::mapToMenuItemResponse).toList())
                    .quickSuggestions(List.of("Gợi ý đồ uống đi kèm", "Món bán chạy nhất", "Xem món tráng miệng"))
                    .actionType("NONE")
                    .build();
        }

        // 5. Mặc định: ưu tiên món Bestseller / Chef's Choice còn hàng
        List<CustomerMenuItemResponse> defaultDishes = candidatePool.stream()
                .sorted(this::compareHotDishesFirst)
                .limit(3)
                .map(this::mapToMenuItemResponse)
                .toList();

        return CustomerAiChatResponse.builder()
                .reply("Dạ chào quý khách! Hôm nay ROMS Bistro đang có nhiều món đặc trưng còn sẵn sàng phục vụ ngay. Mình muốn em tư vấn theo món chính, đồ uống, món thanh đạm hay theo ngân sách ạ?")
                .suggestedDishes(defaultDishes)
                .quickSuggestions(List.of("Gợi ý set món cho " + guestCount + " người", "Món bán chạy nhất", "Có món thanh đạm, ít dầu mỡ không?"))
                .actionType("NONE")
                .build();
    }

    private int compareHotDishesFirst(MenuItem a, MenuItem b) {
        boolean bHot = isHighlightedDish(b);
        boolean aHot = isHighlightedDish(a);
        return Boolean.compare(bHot, aHot);
    }

    private boolean isHighlightedDish(MenuItem item) {
        if (item.getTag() == null) return false;
        String tag = item.getTag().toLowerCase(Locale.ROOT);
        return tag.contains("bestseller") || tag.contains("chef") || tag.contains("signature");
    }

    private List<MenuItem> excludeCartItems(List<MenuItem> menu, List<String> cartItems) {
        if (cartItems == null || cartItems.isEmpty()) {
            return menu;
        }
        List<String> normalizedCartNames = cartItems.stream()
                .map(name -> normalizeText(name.replaceAll("\\(x\\d+\\)", "")))
                .filter(s -> !s.isBlank())
                .toList();
        return menu.stream()
                .filter(item -> {
                    String itemNorm = normalizeText(item.getName());
                    return normalizedCartNames.stream().noneMatch(c -> itemNorm.contains(c) || c.contains(itemNorm));
                })
                .collect(Collectors.toList());
    }

    private boolean matchesDishKeywords(MenuItem item, FallbackIntentRule rule) {
        if (rule.includeWaiterStation() && "WAITER".equalsIgnoreCase(item.getStation())) {
            return true;
        }
        return containsAny(buildSearchableDishText(item), rule.dishKeywords());
    }

    private List<MenuItem> findDirectKeywordMatches(String normalizedMsg, List<MenuItem> pool) {
        if (normalizedMsg.isBlank()) return Collections.emptyList();
        List<String> tokens = Arrays.stream(normalizedMsg.split("\\s+"))
                .filter(t -> t.length() >= 3 && !STOP_WORDS.contains(t))
                .toList();
        if (tokens.isEmpty()) return Collections.emptyList();

        return pool.stream()
                .filter(item -> {
                    String dishText = buildSearchableDishText(item);
                    return tokens.stream().anyMatch(dishText::contains);
                })
                .sorted(this::compareHotDishesFirst)
                .limit(3)
                .toList();
    }

    private String buildSearchableDishText(MenuItem item) {
        String categoryName = item.getCategory() != null ? item.getCategory().getName() : "";
        return normalizeText(
                String.join(" ",
                        Objects.toString(item.getName(), ""),
                        Objects.toString(categoryName, ""),
                        Objects.toString(item.getTag(), ""),
                        Objects.toString(item.getDescription(), ""))
        );
    }

    private BigDecimal extractBudget(String normalizedMsg) {
        if (normalizedMsg.isBlank()) return null;
        Matcher matcher = BUDGET_PATTERN.matcher(normalizedMsg);
        while (matcher.find()) {
            String numRaw = matcher.group(1).replace(",", ".");
            String unit = matcher.group(2) != null ? matcher.group(2) : "";
            // Bỏ qua số nhỏ đứng một mình như "2 người", "4 khách" nếu không kèm đơn vị tiền tệ
            if (unit.isEmpty() && !numRaw.contains(".") && numRaw.length() <= 2) {
                continue;
            }
            try {
                if ("k".equals(unit) || "nghin".equals(unit) || "ngan".equals(unit)) {
                    return BigDecimal.valueOf(Double.parseDouble(numRaw) * 1_000L);
                }
                if ("tr".equals(unit) || "trieu".equals(unit)) {
                    return BigDecimal.valueOf(Double.parseDouble(numRaw) * 1_000_000L);
                }
                String cleanDigits = matcher.group(1).replace(".", "").replace(",", "");
                long val = Long.parseLong(cleanDigits);
                if (val >= 10_000L) {
                    return BigDecimal.valueOf(val);
                }
            } catch (NumberFormatException ignored) {
                // Bỏ qua token số không hợp lệ
            }
        }
        return null;
    }

    private static boolean containsAny(String text, String... keywords) {
        if (text == null || text.isEmpty()) return false;
        String padded = " " + text.replaceAll("[^a-z0-9]+", " ").trim() + " ";
        for (String kw : keywords) {
            if (padded.contains(" " + kw + " ")) {
                return true;
            }
        }
        return false;
    }

    private static String formatVietnameseCurrency(BigDecimal amount) {
        NumberFormat vnFormat = NumberFormat.getNumberInstance(Locale.forLanguageTag("vi-VN"));
        vnFormat.setMaximumFractionDigits(0);
        return vnFormat.format(amount.longValue()) + "₫";
    }

    private static String normalizeText(String input) {
        if (input == null) return "";
        String replaced = input.replace('đ', 'd').replace('Đ', 'D');
        String decomposed = Normalizer.normalize(replaced, Normalizer.Form.NFD);
        return decomposed.replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase(Locale.ROOT)
                .trim();
    }

    private record FallbackIntentRule(
            String[] triggerKeywords,
            String[] dishKeywords,
            boolean includeWaiterStation,
            String reply,
            List<String> quickSuggestions
    ) {}

    private static final Set<String> STOP_WORDS = Set.of(
            "cho", "toi", "minh", "ban", "mon", "nao", "co", "khong", "voi", "nhung",
            "nay", "ngon", "nhat", "duoc", "nha", "hang", "em", "goi", "xem", "can"
    );

    private static final List<FallbackIntentRule> FALLBACK_INTENT_RULES = List.of(
            new FallbackIntentRule(
                    new String[]{"nuoc", "do uong", "uong", "tra", "ca phe", "bia", "ruou", "cocktail", "sinh to", "nuoc ep"},
                    new String[]{"nuoc", "tra", "ca phe", "bia", "ruou", "cocktail", "sinh to", "ep", "soda", "lavie", "coca", "pepsi", "do uong"},
                    true,
                    "Dạ nhà hàng hiện có các lựa chọn đồ uống mát lạnh và pha chế đi kèm rất hợp bữa ăn, mời mình tham khảo bên dưới ạ!",
                    List.of("Món bán chạy nhất", "Xem món tráng miệng", "Món thanh đạm")
            ),
            new FallbackIntentRule(
                    new String[]{"trang mieng", "banh", "kem", "flan", "ngot", "che"},
                    new String[]{"trang mieng", "banh", "kem", "flan", "che", "pudding", "tiramisu", "mousse"},
                    false,
                    "Dạ sau bữa chính, mình dùng thêm các món tráng miệng ngọt dịu bên dưới để kết thúc bữa ăn thật trọn vẹn nhé ạ!",
                    List.of("Gợi ý đồ uống đi kèm", "Món bán chạy nhất")
            ),
            new FallbackIntentRule(
                    new String[]{"chay", "thanh dam", "it dau", "salad", "rau", "healthy", "nhe bung"},
                    new String[]{"chay", "thanh dam", "salad", "rau", "healthy", "sup", "nam", "dau hu"},
                    false,
                    "Dạ nếu mình ưu tiên vị thanh đạm, ít dầu mỡ và nhẹ bụng, em xin gợi ý các món tươi ngon phù hợp bên dưới ạ!",
                    List.of("Gợi ý đồ uống thanh mát", "Xem món tráng miệng", "Món bán chạy nhất")
            ),
            new FallbackIntentRule(
                    new String[]{"hai san", "tom", "ca hoi", "ca ngu", "muc", "cua", "oc", "so", "seafood"},
                    new String[]{"hai san", "tom", "ca hoi", "ca ngu", "muc", "cua", "oc", "so", "tartare", "seafood"},
                    false,
                    "Dạ hải sản tươi ngon bên em chế biến trong ngày rất được ưa chuộng. Mình xem thử các món hải sản nổi bật bên dưới nhé ạ!",
                    List.of("Gợi ý đồ uống đi kèm", "Có món salad khai vị không?", "Xem món tráng miệng")
            ),
            new FallbackIntentRule(
                    new String[]{"bo", "wagyu", "steak", "bit tet", "beef"},
                    new String[]{"bo", "wagyu", "steak", "bit tet", "than bo", "thit bo", "beef"},
                    false,
                    "Dạ các món thịt bò nướng và sốt đậm vị là điểm nhấn tại ROMS Bistro, mời mình tham khảo những phần ngon nhất bên dưới ạ!",
                    List.of("Gợi ý salad ăn kèm", "Gợi ý đồ uống đi kèm", "Xem món tráng miệng")
            ),
            new FallbackIntentRule(
                    new String[]{"tre em", "be", "tre nho", "khong cay", "gia dinh"},
                    new String[]{"sup", "mi y", "ga", "banh mi", "bo toi", "flan", "khoai", "chao"},
                    false,
                    "Dạ với các bé và gia đình, em chọn những món vị dịu nhẹ, mềm dễ ăn và không cay bên dưới để cả nhà cùng thưởng thức ạ!",
                    List.of("Xem thêm đồ uống", "Xem món tráng miệng", "Món bán chạy nhất")
            )
    );
}
