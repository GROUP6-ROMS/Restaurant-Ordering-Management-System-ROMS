# BƯỚC 40: TÍCH HỢP TRỢ LÝ AI CHATBOX THÔNG MINH CHO THỰC KHÁCH (CUSTOMER AI ASSISTANT FULLSTACK)

> **Mục tiêu tài liệu:** Cung cấp tài liệu thiết kế và hướng dẫn triển khai toàn diện từng bước từ Backend (Spring Boot 3.4.5 / Java 21) đến Frontend (React 19 / Vite) cho tính năng **AI Chatbox dành cho thực khách quét mã QR tại bàn**.
> 
> **Định vị tính năng:** AI Chatbox không chỉ là một công cụ trò chuyện đơn thuần, mà là một **"Trợ lý Ẩm thực Ảo tại Bàn" (Virtual Waiter & Sommelier)** với các năng lực:
> 1. **Tư vấn món ăn thông minh:** Đề xuất món theo số người, ngân sách, khẩu vị (cay/không cay, thanh đạm, ăn kiêng, trẻ em) và cảnh báo dị ứng thực phẩm.
> 2. **Tương tác 1 chạm (Interactive Dish Cards):** Hiển thị thẻ món ăn kèm hình ảnh, giá niêm yết và nút **"+ Thêm vào giỏ"** trực tiếp trong khung chat để khách bấm chọn ngay mà không cần tìm kiếm lại trong Menu.
> 3. **Hỏi đáp nghiệp vụ bàn ăn:** Tra cứu thông tin quán, hỗ trợ gọi phục vụ và hướng dẫn thanh toán.
> 4. **Bảo mật & Tối ưu:** Backend làm nhiệm vụ bảo vệ API Key bí mật, nạp dữ liệu món ăn thực tế thời gian thực (Grounding Context) từ CSDL SQL Server để chống AI sinh thông tin ảo (Anti-Hallucination).

---

## MỤC LỤC CHI TIẾT

1. [Tổng quan Kiến trúc & Cơ chế Hoạt động](#1-tổng-quan-kiến-trúc--cơ-chế-hoạt-động)
2. [Chuẩn bị Cấu hình & API Key (Google Gemini API)](#2-chuẩn-bị-cấu-hình--api-key-google-gemini-api)
3. [Triển khai Backend (Java 21 / Spring Boot 3.4.5)](#3-triển-khai-backend-java-21--spring-boot-345)
   - [3.1. Tạo các DTO trao đổi dữ liệu (Request & Response)](#31-tạo-các-dto-trao-đổi-dữ-liệu-request--response)
   - [3.2. Cấu hình RestTemplate Bean](#32-cấu-hình-resttemplate-bean)
   - [3.3. Xây dựng tầng Service nghiệp vụ AI](#33-xây-dựng-tầng-service-nghiệp-vụ-ai)
   - [3.4. Xây dựng REST Controller tiếp nhận Chat](#34-xây-dựng-rest-controller-tiếp-nhận-chat)
   - [3.5. Cấu hình phân quyền Spring Security](#35-cấu-hình-phân-quyền-spring-security)
4. [Triển khai Frontend (React 19 / Vite)](#4-triển-khai-frontend-react-19--vite)
   - [4.1. Tạo API Service gọi Backend](#41-tạo-api-service-gọi-backend)
   - [4.2. Xây dựng Component Giao diện Chat Modal](#42-xây-dựng-component-giao-diện-chat-modal)
   - [4.3. Tích hợp Nút bấm Nổi (Floating Action Button) vào CustomerLayout](#43-tích-hợp-nút-bấm-nổi-floating-action-button-vào-customerlayout)
5. [Quy trình Kiểm thử & Chạy thử nghiệm](#5-quy-trình-kiểm-thử--chạy-thử-nghiệm)
6. [Các lưu ý Vận hành & Mở rộng nâng cao](#6-các-lưu-ý-vận-hành--mở-rộng-nâng-cao)

---

## 1. TỔNG QUAN KIẾN TRÚC & CƠ CHẾ HOẠT ĐỘNG

### 1.1. Sơ đồ luồng dữ liệu (Data Flow)

```text
[Khách hàng tại bàn] ──(1. Nhập câu hỏi)──> [React 19 Chat UI]
                                                      │
                                                      │ (2. Gửi request kèm Table Info)
                                                      ▼
                                            [Backend Spring Boot]
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       │                                                             │
                       ▼                                                             ▼
             [Query CSDL SQL Server]                                    [System Prompt Engine]
         (Lấy Menu đang bán + Tồn kho)                             (Inject thực đơn, bàn, số khách)
                       │                                                             │
                       └──────────────────────────────┬──────────────────────────────┘
                                                      │ (3. Gửi Prompt + Context)
                                                      ▼
                                         [Google Gemini 1.5/2.0 Flash]
                                                      │
                                                      │ (4. Trả về JSON: Lời thoại + Dish IDs)
                                                      ▼
                                            [Spring Boot Backend]
                                                      │ (5. Map Dish IDs sang Object MenuItem đầy đủ)
                                                      ▼
                                            [React 19 Chat UI]
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       │                                                             │
                       ▼                                                             ▼
           [Bong bóng chat trả lời]                                     [Thẻ món ăn tương tác]
      ("Dạ em xin gợi ý set 4 người...")                            [+ Thêm vào giỏ hàng 1-chạm]
```

### 1.2. Tại sao chọn mô hình Backend Proxy thay vì gọi trực tiếp từ React?
- **Tuyệt đối an toàn:** Không bao giờ để lộ Gemini API Key ra file Javascript trên trình duyệt của khách.
- **Dữ liệu thực tế (Grounding):** Backend đọc trực tiếp dữ liệu món ăn từ SQL Server (`isAvailable = true`, `remainingStock > 0`), nhồi vào System Prompt. AI sẽ **không bao giờ bịa đặt** ra các món mà nhà hàng không có trong thực đơn.
- **Kiểm soát chi phí:** Dễ dàng đặt giới hạn số lượt chat (Rate Limit) cho mỗi bàn để tránh lạm dụng.

---

## 2. CHUẨN BỊ CẤU HÌNH & API KEY (GOOGLE GEMINI API)

### Bước 2.1: Lấy API Key miễn phí từ Google
1. Truy cập vào **[Google AI Studio](https://aistudio.google.com/)**.
2. Đăng nhập bằng tài khoản Google.
3. Bấm vào **"Get API key"** $\rightarrow$ Chọn **"Create API key in new project"**.
4. Sao chép chuỗi mã API Key (dạng: `AIzaSy...`).

### Bước 2.2: Bổ sung cấu hình vào file `application.properties`
Mở file: `SourceCode/backend/roms/src/main/resources/application.properties` và thêm các dòng cấu hình sau vào cuối file:

```properties
# ===================================================================
# 8. CẤU HÌNH TRỢ LÝ AI CHATBOX CHO KHÁCH HÀNG (GOOGLE GEMINI API)
# ===================================================================
# Khóa API của Google Gemini (Thay thế bằng API Key của bạn)
gemini.api.key=YOUR_GEMINI_API_KEY_HERE
# Mô hình AI sử dụng: gemini-3.5-flash-lite (tốc độ siêu nhanh, hiểu tiếng Việt cực đỉnh, tối ưu cho key AQ)
gemini.api.model=gemini-3.5-flash-lite
# Đường dẫn API chính thức của Google Gemini
gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
```

---

## 3. TRIỂN KHAI BACKEND (JAVA 21 / SPRING BOOT 3.4.5)

### 3.1. Tạo các DTO trao đổi dữ liệu (Request & Response)

#### File 1: DTO Yêu cầu trò chuyện — `CustomerAiChatRequest.java`
*Đường dẫn tạo mới:*  
`SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/request/CustomerAiChatRequest.java`

```java
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
```

---

#### File 2: DTO Phản hồi của AI — `CustomerAiChatResponse.java`
*Đường dẫn tạo mới:*  
`SourceCode/backend/roms/src/main/java/com/romsteam/roms/dto/response/CustomerAiChatResponse.java`

```java
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
```

---

### 3.2. Cấu hình `RestTemplate` Bean

Để Spring Boot có thể gửi yêu cầu HTTP sang máy chủ Google Gemini API, cần đăng ký Bean `RestTemplate`.

*Đường dẫn file cấu hình:*  
`SourceCode/backend/roms/src/main/java/com/romsteam/roms/config/AppConfig.java` *(nếu chưa có thì tạo mới, nếu đã có file Config khác như `WebSocketConfig` thì có thể khai báo thêm Bean này)*

```java
package com.romsteam.roms.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Cấu hình các Bean dùng chung toàn hệ thống
 */
@Configuration
public class AppConfig {

    /**
     * Khởi tạo RestTemplate với thời gian chờ kết nối (Timeout) hợp lý
     * Tránh việc gọi API bên ngoài bị treo luồng hệ thống.
     */
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        // Thời gian chờ kết nối tối đa: 5 giây
        factory.setConnectTimeout(5000);
        // Thời gian chờ phản hồi tối đa từ Gemini: 20 giây
        factory.setReadTimeout(20000);
        return new RestTemplate(factory);
    }
}
```

---

### 3.3. Xây dựng tầng Service nghiệp vụ AI

#### File 1: Interface `CustomerAiService.java`
*Đường dẫn tạo mới:*  
`SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/CustomerAiService.java`

```java
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
```

---

#### File 2: Implementation `CustomerAiServiceImpl.java`
*Đường dẫn tạo mới:*  
`SourceCode/backend/roms/src/main/java/com/romsteam/roms/service/serviceImpl/CustomerAiServiceImpl.java`

```java
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

    // Tên model (gemini-3.5-flash-lite)
    @Value("${gemini.api.model:gemini-3.5-flash-lite}")
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

            // 5. Chuẩn bị Header HTTP
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> httpEntity = new HttpEntity<>(geminiPayload, headers);

            // 6. Gửi request sang Google Gemini endpoint
            String targetUrl = geminiApiUrl.replace("{model}", geminiModel) + "?key=" + geminiApiKey;
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
        sb.append(" với số lượng khách: ").append(request.getGuestCount() != null ? request.getGuestCount() : 2).append(" người.\n\n");

        sb.append("NGUYÊN TẮC BẮT BUỘC:\n");
        sb.append("1. Chỉ được gợi ý các món ăn có trong danh sách thực đơn bên dưới. Tuyệt đối KHÔNG bịa ra món nhà hàng không bán.\n");
        sb.append("2. Lời thoại bằng tiếng Việt, lịch thiệp, ấm áp, ngắn gọn và súc tích (vì khách đọc trên màn hình điện thoại di động).\n");
        sb.append("3. Khi khách hỏi về món ăn/ngân sách/số người, hãy chọn ra từ 1 đến 4 món ăn phù hợp nhất và giải thích ngắn gọn lý do.\n");
        sb.append("4. Bạn BẮT BUỘC phải trả về kết quả dưới định dạng JSON nguyên bản (Raw JSON) theo cấu trúc mẫu sau, không bọc markdown ```json:\n");
        sb.append("{\n");
        sb.append("  \"reply\": \"Lời thoại tư vấn gửi khách...\",\n");
        sb.append("  \"suggestedDishIds\": [1, 5, 8],\n");
        sb.append("  \"quickSuggestions\": [\"Gợi ý nước uống đi kèm\", \"Xem món tráng miệng\"],\n");
        sb.append("  \"actionType\": \"NONE\"\n");
        sb.append("}\n\n");

        sb.append("DANH SÁCH THỰC ĐƠN HIỆN CÓ CỦA NHÀ HÀNG:\n");
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
                // Quy tắc Google Gemini: Tin nhắn đầu tiên của contents bắt buộc phải là 'user'
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
        List<MenuItem> topItems = menuItemRepository.findByIsAvailableTrueAndIsActiveTrue().stream().limit(3).toList();
        List<CustomerMenuItemResponse> dishes = topItems.stream().map(this::mapToMenuItemResponse).toList();
        String tableGreeting = (request != null && request.getTableNumber() != null) ? " tại " + request.getTableNumber() : "";

        return CustomerAiChatResponse.builder()
                .reply("Dạ chào bạn" + tableGreeting + "! Em là trợ lý ROMS Bistro. Hôm nay nhà hàng có nhiều món đặc sắc đang rất được ưa chuộng, mời bạn tham khảo các món nổi bật bên dưới nhé ạ!")
                .suggestedDishes(dishes)
                .quickSuggestions(List.of("Gợi ý món bò bít tết", "Món chay thanh đạm", "Xem tráng miệng"))
                .actionType("NONE")
                .build();
    }
}
```

---

### 3.4. Xây dựng REST Controller tiếp nhận Chat

*Đường dẫn tạo mới:*  
`SourceCode/backend/roms/src/main/java/com/romsteam/roms/controller/CustomerAiChatController.java`

```java
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
```

---

### 3.5. Cấu hình phân quyền Spring Security

Mở file: `SourceCode/backend/roms/src/main/java/com/romsteam/roms/config/SecurityConfig.java`  
Tìm đến khối `authorizeHttpRequests` và thêm cấu hình mở quyền cho endpoint AI:

```java
// Trong phương thức securityFilterChain:
.authorizeHttpRequests(auth -> auth
        // 1. Cổng mở công khai:
        .requestMatchers(
                "/api/auth/**",
                "/api/customer/tables/verify-qr",
                "/api/customer/reservations/**",
                "/api/customer/dining/menu",
                "/api/customer/ai/**",          // <--- THÊM DÒNG NÀY ĐỂ CHO PHÉP KHÁCH DÙNG CHATBOX
                "/api/reservations/book",
                "/ws-roms/**",
                "/ws-roms-native/**",
                "/v3/api-docs/**",
                "/swagger-ui/**",
                "/swagger-ui.html",
                "/actuator/**")
        .permitAll()
        // ... các cấu hình khác giữ nguyên
```

---

## 4. TRIỂN KHAI FRONTEND (REACT 19 / VITE)

### 4.1. Tạo API Service gọi Backend

*Đường dẫn tạo mới:*  
`SourceCode/frontend/src/api/customerAiApi.js`

```javascript
import axiosClient from './axiosClient';

/**
 * Service giao tiếp với module AI Chatbox tại Backend
 */
export const customerAiApi = {
  /**
   * Gửi câu hỏi và ngữ cảnh bàn ăn sang Backend
   * @param {Object} data { message, tableId, tableNumber, guestCount, history }
   */
  sendMessage: (data) => {
    // Lưu ý: Không thêm '/api' ở đầu vì axiosClient đã có sẵn baseURL: '/api'
    return axiosClient.post('/customer/ai/chat', data);
  },
};
```

---

### 4.2. Xây dựng Component Giao diện Chat Modal

Component này thiết kế theo chuẩn Mobile-First (chiều rộng tối đa 430px), có hiệu ứng trượt mượt mà (Bottom Sheet), hiển thị danh sách tin nhắn, các câu hỏi gợi ý nhanh và thẻ món ăn tương tác có nút **"+ Thêm vào giỏ"**.

*Đường dẫn tạo mới:*  
`SourceCode/frontend/src/components/customer/CustomerAiChatModal.jsx`

```jsx
import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { customerAiApi } from '../../api/customerAiApi';
import Icon from '../common/Icon';

// Hàm định dạng tiền tệ Việt Nam
function formatVND(amount) {
  if (!amount && amount !== 0) return '0đ';
  return Number(amount).toLocaleString('vi-VN') + 'đ';
}

/**
 * Component Modal Trợ Lý Ẩm Thực AI cho Thực Khách
 */
export default function CustomerAiChatModal({ isOpen, onClose }) {
  const { tableInfo, addToCart } = useCart();

  // Danh sách các tin nhắn trong phiên chat hiện tại
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Dạ em chào quý khách tại ${tableInfo?.tableNumber || 'Bàn của bạn'}! Em là Trợ lý Ẩm thực ROMS. Quý khách cần em gợi ý món ăn ngon, món theo số lượng người hay đồ uống phù hợp ạ?`,
      suggestedDishes: [],
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Nội dung ô nhập văn bản
  const [inputValue, setInputValue] = useState('');
  // Trạng thái đang chờ AI suy nghĩ phản hồi
  const [loading, setLoading] = useState(false);
  // Danh sách gợi ý câu hỏi nhanh (Quick Chips)
  const [quickChips, setQuickChips] = useState([
    'Gợi ý set món cho 4 người',
    'Món nào bán chạy nhất hôm nay?',
    'Có món thanh đạm, ít dầu mỡ không?',
    'Món ngon cho trẻ nhỏ'
  ]);

  // Ref cuộn xuống đáy tin nhắn mới nhất
  const messagesEndRef = useRef(null);

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Xử lý gửi tin nhắn
  const handleSend = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    // Cập nhật tin nhắn của người dùng vào giao diện
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      // Chuẩn bị lịch sử trò chuyện gần nhất (tối đa 4 tin nhắn)
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text
      }));

      // Gọi API sang Backend
      const response = await customerAiApi.sendMessage({
        message: text,
        tableId: tableInfo?.tableId || 1,
        tableNumber: tableInfo?.tableNumber || 'Bàn 01',
        guestCount: tableInfo?.guestCount || 2,
        history: historyPayload
      });

      // Bóc tách payload từ ApiResponse chuẩn của Spring Boot (response.data.data)
      const resBody = response?.data || response;
      const aiData = resBody?.data || resBody;

      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: aiData?.reply || 'Dạ, em đã ghi nhận thông tin từ bạn!',
        suggestedDishes: aiData?.suggestedDishes || [],
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);

      // Cập nhật lại các gợi ý nhanh nếu AI có trả về
      if (aiData?.quickSuggestions && aiData.quickSuggestions.length > 0) {
        setQuickChips(aiData.quickSuggestions);
      }
    } catch (err) {
      console.error('Lỗi khi chat với AI:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: 'Dạ mạng bận một chút, bạn có thể tham khảo trực tiếp các món ngon trên thực đơn giúp em nhé!',
          suggestedDishes: [],
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Thêm món vào giỏ hàng ngay từ thẻ trong khung chat
  const handleAddToCart = (dish) => {
    addToCart(dish, 1, '');
    alert(`Đã thêm "${dish.name}" vào giỏ hàng!`);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-end'
    }}>
      {/* Khung Bottom Sheet trượt từ dưới lên (Mobile-first max 430px) */}
      <div style={{
        width: '100%', maxWidth: 430, height: '85dvh',
        background: 'var(--surface, #FFF8F6)',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
        animation: 'slideUp 0.25s ease-out',
        overflow: 'hidden'
      }}>
        
        {/* --- Header Chatbox --- */}
        <div style={{
          padding: '12px 16px',
          background: 'var(--primary, #A04020)',
          color: '#FFF',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTopLeftRadius: 24, borderTopRightRadius: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20
            }}>
              ✨
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'Epilogue, sans-serif' }}>
                Trợ Lý Ẩm Thực ROMS
              </div>
              <div style={{ fontSize: 11, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4CAF50' }}></span>
                Trực tuyến • Sẵn sàng tư vấn
              </div>
            </div>
          </div>

          {/* Nút đóng */}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFF', cursor: 'pointer'
            }}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* --- Danh sách tin nhắn (Scrollable) --- */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px 12px',
          display: 'flex', flexDirection: 'column', gap: 14
        }}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start'
                }}
              >
                {/* Bong bóng tin nhắn */}
                <div style={{
                  maxWidth: '82%',
                  padding: '10px 14px',
                  borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  background: isUser ? 'var(--primary, #A04020)' : 'var(--surface-container-high, #F3E9E5)',
                  color: isUser ? '#FFFFFF' : 'var(--on-surface, #2C221E)',
                  fontSize: 14, lineHeight: 1.45,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  wordBreak: 'break-word', whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                </div>

                <span style={{ fontSize: 10, color: 'var(--outline, #8C7B75)', marginTop: 3, padding: '0 4px' }}>
                  {msg.time}
                </span>

                {/* Thẻ món ăn được AI đề xuất (Interactive Cards) */}
                {msg.suggestedDishes && msg.suggestedDishes.length > 0 && (
                  <div style={{
                    width: '100%', marginTop: 8,
                    display: 'flex', flexDirection: 'column', gap: 8
                  }}>
                    {msg.suggestedDishes.map((dish) => (
                      <div
                        key={dish.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          background: '#FFFFFF', padding: 8, borderRadius: 12,
                          border: '1px solid rgba(220,192,185,0.4)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }}
                      >
                        <img
                          src={dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120'}
                          alt={dish.name}
                          style={{ width: 55, height: 55, borderRadius: 8, objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#2C221E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {dish.name}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary, #A04020)', marginTop: 2 }}>
                            {formatVND(dish.price)}
                          </div>
                          {dish.tag && (
                            <span style={{ fontSize: 9, background: '#FFE8DC', color: '#A04020', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                              {dish.tag}
                            </span>
                          )}
                        </div>

                        {/* Nút thêm vào giỏ hàng 1-chạm */}
                        <button
                          onClick={() => handleAddToCart(dish)}
                          style={{
                            background: 'var(--primary, #A04020)', color: '#FFF',
                            border: 'none', borderRadius: 8,
                            padding: '6px 10px', fontSize: 11, fontWeight: 700,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                          }}
                        >
                          <Icon name="add" size={14} />
                          Thêm
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Đang chờ AI phản hồi */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--outline, #8C7B75)', fontSize: 13, padding: '4px 8px' }}>
              <span className="spin" style={{ display: 'inline-block' }}>✨</span>
              <span>Trợ lý ROMS đang chọn món ngon cho bạn...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* --- Gợi ý nhanh (Quick Chips) --- */}
        <div style={{
          padding: '6px 12px', display: 'flex', gap: 6,
          overflowX: 'auto', whiteSpace: 'nowrap',
          borderTop: '1px solid rgba(220,192,185,0.25)',
          scrollbarWidth: 'none'
        }}>
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              disabled={loading}
              style={{
                background: 'var(--surface-container-high, #F3E9E5)',
                border: '1px solid rgba(220,192,185,0.5)',
                borderRadius: 16, padding: '4px 10px',
                fontSize: 11, fontWeight: 600, color: 'var(--on-surface-variant, #5A4740)',
                cursor: 'pointer', flexShrink: 0
              }}
            >
              💡 {chip}
            </button>
          ))}
        </div>

        {/* --- Thanh nhập liệu (Input Bar) --- */}
        <div style={{
          padding: '8px 12px 14px',
          background: 'var(--surface, #FFF8F6)',
          borderTop: '1px solid rgba(220,192,185,0.3)',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <input
            type="text"
            placeholder="Hỏi về món ăn, khẩu vị, gợi ý set món..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            style={{
              flex: 1, height: 42, borderRadius: 21,
              border: '1px solid rgba(220,192,185,0.6)',
              padding: '0 16px', fontSize: 13,
              outline: 'none', background: '#FFFFFF'
            }}
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || loading}
            style={{
              width: 42, height: 42, borderRadius: '50%',
              background: inputValue.trim() && !loading ? 'var(--primary, #A04020)' : 'var(--outline, #C4B5B0)',
              color: '#FFF', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: inputValue.trim() && !loading ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s'
            }}
          >
            <Icon name="arrow_upward" size={20} />
          </button>
        </div>

      </div>
    </div>
  );
}
```

---

### 4.3. Tích hợp Nút bấm Nổi (Floating Action Button) vào `CustomerLayout.jsx`

Mở file: `SourceCode/frontend/src/components/layout/CustomerLayout.jsx`

#### 1. Import Component Chat Modal
Ở đầu file `CustomerLayout.jsx`, thêm dòng import:
```jsx
import CustomerAiChatModal from '../customer/CustomerAiChatModal';
```

#### 2. Thêm State mở/đóng Modal
Bên trong hàm `CustomerLayout()`, ngay dưới các khai báo state hiện có:
```jsx
// State đóng mở Trợ lý AI Chatbox
const [isAiModalOpen, setIsAiModalOpen] = useState(false);
```

#### 3. Chèn Nút bấm nổi (FAB) và Modal trước thẻ đóng `</div>`
Tìm đến phần cuối file `CustomerLayout.jsx`, ngay phía trên thẻ đóng `</div>` ngoài cùng, chèn đoạn code sau:

```jsx
      {/* --- Nút Nổi AI Trợ Lý Ẩm Thực (Floating Action Button) --- */}
      <button
        onClick={() => setIsAiModalOpen(true)}
        aria-label="Mở Trợ lý Ẩm thực AI"
        style={{
          position: 'fixed',
          bottom: totalCount > 0 && !isCart ? 145 : 78, // Tự động nâng cao hơn nếu đang có Floating Cart Bar
          right: 'calc(50% - 200px)', // Đặt góc phải theo khung max-width 430px
          width: 50, height: 50, borderRadius: '50%',
          background: 'linear-gradient(135deg, #A04020 0%, #D86030 100%)',
          color: '#FFFFFF',
          border: '2px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 4px 16px rgba(160, 64, 32, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 45,
          transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <span style={{ fontSize: 22 }}>✨</span>
      </button>

      {/* --- Modal Trợ Lý Ẩm Thực AI --- */}
      <CustomerAiChatModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
```

---

## 5. QUY TRÌNH KIỂM THỬ & CHẠY THỬ NGHIỆM

Sau khi bạn copy và dán toàn bộ code theo các bước trên:

### Bước 1: Kiểm thử biên dịch Backend
Mở Terminal tại thư mục `SourceCode/backend/roms` và chạy:
```bash
./mvnw clean test-compile
```
*Kết quả mong đợi:* `BUILD SUCCESS` (0 lỗi biên dịch).

### Bước 2: Chạy Backend
```bash
./mvnw spring-boot:run
```
Kiểm tra Swagger UI tại đường dẫn: `http://localhost:8080/swagger-ui.html`  
Xác nhận có xuất hiện nhóm API mới: **`Customer AI Assistant`** với endpoint `POST /api/customer/ai/chat`.

### Bước 3: Chạy Frontend và trải nghiệm
Mở Terminal tại thư mục `SourceCode/frontend` và chạy:
```bash
npm run dev
```
1. Truy cập vào giao diện quét QR: `http://localhost:5173/dining/welcome?table=05`.
2. Chuyển vào menu: `http://localhost:5173/dining/menu`.
3. Nhìn góc dưới bên phải màn hình: Thấy xuất hiện nút bấm nổi phát sáng có biểu tượng `✨`.
4. Bấm vào nút `✨`: Khung chat mở lên mượt mà.
5. Bấm vào gợi ý: *"Gợi ý set món cho 4 người"* $\rightarrow$ AI sẽ phân tích và đưa ra danh sách các món ăn thực tế kèm nút **"+ Thêm"**.
6. Bấm nút **"+ Thêm"** $\rightarrow$ Giỏ hàng tại bàn lập tức tăng số lượng và cập nhật tổng tiền!

---

## 6. CÁC LƯU Ý VẬN HÀNH & MỞ RỘNG NÂNG CAO

1. **Khi chưa có API Key:**  
   Hệ thống được thiết kế với cơ chế **Graceful Fallback**, nếu bạn chưa điền API Key hoặc API Key hết hạn ngạch, hệ thống sẽ tự động lấy các món bán chạy nhất trong CSDL để trả lời thân thiện, bảo đảm trải nghiệm của khách không bao giờ gặp lỗi màn hình trắng hay thông báo lỗi kỹ thuật khó hiểu.

2. **Chống lạm dụng (Rate Limiting):**  
   Trong thực tế, bạn có thể bổ sung thêm một biến đếm số lần chat theo `tableId` trong `HttpSession` hoặc bộ đệm `Caffeine` để giới hạn mỗi bàn tối đa 15-20 lượt chat trong 1 phiên ăn.

3. **Bảo mật tuyệt đối thông tin kinh doanh:**  
   Chỉ truyền các trường công khai của món ăn (`name`, `price`, `description`, `tag`) vào prompt cho AI; tuyệt đối không truyền giá vốn (`costPrice`) hay doanh thu nội bộ của nhà hàng sang phía Google Gemini.

---
*(Tài liệu được biên soạn phục vụ học tập và triển khai thực chiến dự án ROMS).*
