package com.romsteam.roms.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.romsteam.roms.dto.request.CustomerAiChatRequest;
import com.romsteam.roms.dto.response.CustomerAiChatResponse;
import com.romsteam.roms.entity.Category;
import com.romsteam.roms.entity.MenuItem;
import com.romsteam.roms.repository.MenuItemRepository;
import com.romsteam.roms.service.serviceImpl.CustomerAiServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CustomerAiService Unit Tests - Gemini API & Smart Local Fallback")
class CustomerAiServiceTest {

    @Mock
    private MenuItemRepository menuItemRepository;

    @Mock
    private RestTemplate restTemplate;

    private CustomerAiServiceImpl customerAiService;
    private List<MenuItem> sampleMenu;

    @BeforeEach
    void setUp() {
        customerAiService = new CustomerAiServiceImpl(menuItemRepository, restTemplate, new ObjectMapper());
        ReflectionTestUtils.setField(customerAiService, "geminiApiKey", "");
        ReflectionTestUtils.setField(customerAiService, "geminiModel", "gemini-2.5-flash");
        ReflectionTestUtils.setField(
                customerAiService,
                "geminiApiUrl",
                "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        );

        Category mainCat = Category.builder().id(1L).name("Món Chính").build();
        Category drinkCat = Category.builder().id(2L).name("Đồ Uống").build();
        Category saladCat = Category.builder().id(3L).name("Salad & Khai Vị").build();

        sampleMenu = List.of(
                MenuItem.builder()
                        .id(1L)
                        .category(mainCat)
                        .sku("DISH-001")
                        .name("Bò Wagyu A5 Nướng Đá")
                        .description("Thịt bò thượng hạng nướng đá nóng")
                        .price(BigDecimal.valueOf(450000))
                        .station("KITCHEN")
                        .tag("Bestseller")
                        .isAvailable(true)
                        .remainingStock(10)
                        .build(),
                MenuItem.builder()
                        .id(2L)
                        .category(saladCat)
                        .sku("DISH-002")
                        .name("Salad Rau Xanh Thanh Đạm")
                        .description("Món chay thanh nhẹ ít dầu mỡ")
                        .price(BigDecimal.valueOf(95000))
                        .station("KITCHEN")
                        .tag("Healthy")
                        .isAvailable(true)
                        .remainingStock(15)
                        .build(),
                MenuItem.builder()
                        .id(3L)
                        .category(drinkCat)
                        .sku("DRK-001")
                        .name("Trà Đào Cam Sả")
                        .description("Thức uống mát lạnh giải nhiệt")
                        .price(BigDecimal.valueOf(55000))
                        .station("WAITER")
                        .tag("Bestseller")
                        .isAvailable(true)
                        .remainingStock(20)
                        .build(),
                MenuItem.builder()
                        .id(4L)
                        .category(mainCat)
                        .sku("DISH-004")
                        .name("Tôm Hùm Nướng Bơ Tỏi")
                        .description("Hải sản tươi sống")
                        .price(BigDecimal.valueOf(520000))
                        .station("KITCHEN")
                        .tag("Chef's Choice")
                        .isAvailable(true)
                        .remainingStock(0) // Hết hàng -> không được gợi ý
                        .build()
        );

        when(menuItemRepository.findByIsAvailableTrueAndIsActiveTrue()).thenReturn(sampleMenu);
    }

    @Test
    @DisplayName("Fallback theo ngân sách: trả món <= 150k và loại món hết hàng")
    void fallback_budgetIntent_returnsMatchingAffordableItems() {
        CustomerAiChatRequest request = new CustomerAiChatRequest();
        request.setTableNumber("B-01");
        request.setMessage("Gợi ý món giá dưới 150k");

        CustomerAiChatResponse response = customerAiService.chatWithCustomer(request);

        verifyNoInteractions(restTemplate);
        assertThat(response.getReply()).contains("150.000₫");
        assertThat(response.getSuggestedDishes())
                .extracting("id")
                .containsExactlyInAnyOrder(2L, 3L);
    }

    @Test
    @DisplayName("Fallback theo từ khóa món bò: ưu tiên gợi ý món Bò Wagyu")
    void fallback_beefIntent_returnsBeefDish() {
        CustomerAiChatRequest request = new CustomerAiChatRequest();
        request.setTableNumber("B-02");
        request.setMessage("Có món bò bít tết nào ngon không?");

        CustomerAiChatResponse response = customerAiService.chatWithCustomer(request);

        verifyNoInteractions(restTemplate);
        assertThat(response.getReply()).contains("thịt bò");
        assertThat(response.getSuggestedDishes())
                .extracting("id")
                .containsExactly(1L);
    }

    @Test
    @DisplayName("Fallback khi đã có món trong giỏ: gợi ý đồ uống / ăn kèm và tránh trùng")
    void fallback_cartPresent_suggestsComplementaryAndExcludesCart() {
        CustomerAiChatRequest request = new CustomerAiChatRequest();
        request.setTableNumber("B-03");
        request.setMessage("Gợi ý thêm giúp mình");
        request.setCartItems(List.of("Bò Wagyu A5 Nướng Đá (x1)"));

        CustomerAiChatResponse response = customerAiService.chatWithCustomer(request);

        assertThat(response.getSuggestedDishes())
                .extracting("id")
                .doesNotContain(1L);
    }

    @Test
    @DisplayName("Gemini API thành công: gọi đúng model gemini-2.5-flash và map món còn hàng")
    void geminiSuccess_parsesAiJsonAndMapsInStockDishes() {
        ReflectionTestUtils.setField(customerAiService, "geminiApiKey", "AIzaTestValidKey123");
        String mockGeminiJson = """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {
                            "text": "{\\"reply\\":\\"Dạ mình thử Bò Wagyu kèm Trà Đào nhé ạ!\\",\\"suggestedDishIds\\":[1,3,4],\\"quickSuggestions\\":[\\"Xem tráng miệng\\"],\\"actionType\\":\\"NONE\\"}"
                          }
                        ]
                      }
                    }
                  ]
                }
                """;

        when(restTemplate.exchange(
                contains("models/gemini-2.5-flash:generateContent"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(mockGeminiJson, HttpStatus.OK));

        CustomerAiChatRequest request = new CustomerAiChatRequest();
        request.setTableNumber("B-01");
        request.setMessage("Tư vấn giúp mình");

        CustomerAiChatResponse response = customerAiService.chatWithCustomer(request);

        assertThat(response.getReply()).isEqualTo("Dạ mình thử Bò Wagyu kèm Trà Đào nhé ạ!");
        // ID 4 hết hàng (remainingStock=0) nên bị lọc khỏi activeMenu trước đó
        assertThat(response.getSuggestedDishes()).extracting("id").containsExactly(1L, 3L);
        assertThat(response.getQuickSuggestions()).containsExactly("Xem tráng miệng");
    }

    @Test
    @DisplayName("Gemini API lỗi mạng/401: tự động fallback đúng ngữ cảnh câu hỏi")
    void geminiError_fallsBackToContextualMatching() {
        ReflectionTestUtils.setField(customerAiService, "geminiApiKey", "AIzaBrokenOrExpiredKey");
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RestClientException("401 Unauthorized"));

        CustomerAiChatRequest request = new CustomerAiChatRequest();
        request.setTableNumber("B-05");
        request.setMessage("Mình muốn gọi đồ uống mát lạnh");

        CustomerAiChatResponse response = customerAiService.chatWithCustomer(request);

        assertThat(response.getReply()).contains("đồ uống");
        assertThat(response.getSuggestedDishes()).extracting("id").containsExactly(3L);
    }
}
