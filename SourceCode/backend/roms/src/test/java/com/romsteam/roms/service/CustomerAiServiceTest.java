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
@DisplayName("CustomerAiService Unit Tests - Model Failover & Accurate Smart Fallback")
class CustomerAiServiceTest {

    @Mock
    private MenuItemRepository menuItemRepository;

    @Mock
    private RestTemplate restTemplate;

    private CustomerAiServiceImpl customerAiService;
    private Category mainCat;
    private Category drinkCat;
    private Category saladCat;
    private Category dessertCat;
    private List<MenuItem> sampleMenu;

    @BeforeEach
    void setUp() {
        customerAiService = new CustomerAiServiceImpl(menuItemRepository, restTemplate, new ObjectMapper());
        ReflectionTestUtils.setField(customerAiService, "geminiApiKey", "");
        ReflectionTestUtils.setField(customerAiService, "geminiModel", "gemini-flash-lite-latest");
        ReflectionTestUtils.setField(
                customerAiService,
                "geminiApiUrl",
                "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        );

        mainCat = Category.builder().id(1L).name("Món Chính").build();
        drinkCat = Category.builder().id(2L).name("Đồ Uống").build();
        saladCat = Category.builder().id(3L).name("Salad & Khai Vị").build();
        dessertCat = Category.builder().id(4L).name("Tráng Miệng").build();

        sampleMenu = List.of(
                MenuItem.builder()
                        .id(1L)
                        .category(mainCat)
                        .sku("DISH-001")
                        .name("Bò Hầm Rượu Vang Đỏ Bourgogne")
                        .description("Thịt bò hầm nước sốt rượu vang đỏ kiểu Pháp")
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
                        .name("Nước Lọc Lavie")
                        .description("Nước suối đóng chai tinh khiết")
                        .price(BigDecimal.valueOf(25000))
                        .station("WAITER")
                        .tag("Tiêu chuẩn")
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
                        .remainingStock(0) // Hết hàng
                        .build(),
                MenuItem.builder()
                        .id(5L)
                        .category(saladCat)
                        .sku("DISH-005")
                        .name("Bánh Mì Bơ Tỏi Nướng Phô Mai")
                        .description("Bánh mì giòn rụm phết bơ tỏi")
                        .price(BigDecimal.valueOf(65000))
                        .station("KITCHEN")
                        .tag("Khai vị")
                        .isAvailable(true)
                        .remainingStock(12)
                        .build(),
                MenuItem.builder()
                        .id(6L)
                        .category(saladCat)
                        .sku("DISH-006")
                        .name("Súp Kem Bí Đỏ Hạt Dẻ Cười")
                        .description("Súp kem mịn ấm nóng vị ngọt dịu")
                        .price(BigDecimal.valueOf(85000))
                        .station("KITCHEN")
                        .tag("Khai vị")
                        .isAvailable(true)
                        .remainingStock(8)
                        .build()
        );

        when(menuItemRepository.findByIsAvailableTrueAndIsActiveTrue()).thenReturn(sampleMenu);
    }

    @Test
    @DisplayName("Fallback Đồ Uống: không nhầm 'Bò Hầm Rượu Vang' hay món dùng 'nước sốt'")
    void fallback_drinksIntent_excludesSavoryBeefDishes() {
        CustomerAiChatRequest request = new CustomerAiChatRequest();
        request.setTableNumber("B-01");
        request.setMessage("gợi ý đồ uống");

        CustomerAiChatResponse response = customerAiService.chatWithCustomer(request);

        verifyNoInteractions(restTemplate);
        assertThat(response.getReply()).contains("đồ uống");
        assertThat(response.getSuggestedDishes()).extracting("id").containsExactly(3L);
    }

    @Test
    @DisplayName("Fallback Tráng Miệng khi menu không có món tráng miệng: không nhầm 'Bánh Mì Bơ Tỏi' hay 'Súp Kem'")
    void fallback_dessertIntent_withoutDessertItems_returnsEmptyInsteadOfSavory() {
        CustomerAiChatRequest request = new CustomerAiChatRequest();
        request.setTableNumber("B-01");
        request.setMessage("có món tráng miệng nào không");

        CustomerAiChatResponse response = customerAiService.chatWithCustomer(request);

        assertThat(response.getReply()).contains("tráng miệng").contains("tạm hết");
        assertThat(response.getSuggestedDishes()).isEmpty();
    }

    @Test
    @DisplayName("Fallback Tráng Miệng khi menu có Bánh Flan: chỉ trả về Bánh Flan")
    void fallback_dessertIntent_withFlan_returnsOnlyDessert() {
        MenuItem flan = MenuItem.builder()
                .id(7L)
                .category(dessertCat)
                .sku("DES-001")
                .name("Bánh Flan Caramel")
                .description("Bánh flan mềm mịn")
                .price(BigDecimal.valueOf(45000))
                .station("WAITER")
                .tag("Ngọt dịu")
                .isAvailable(true)
                .remainingStock(10)
                .build();
        List<MenuItem> menuWithDessert = new java.util.ArrayList<>(sampleMenu);
        menuWithDessert.add(flan);
        when(menuItemRepository.findByIsAvailableTrueAndIsActiveTrue()).thenReturn(menuWithDessert);

        CustomerAiChatRequest request = new CustomerAiChatRequest();
        request.setTableNumber("B-01");
        request.setMessage("có món tráng miệng nào không");

        CustomerAiChatResponse response = customerAiService.chatWithCustomer(request);

        assertThat(response.getSuggestedDishes()).extracting("id").containsExactly(7L);
    }

    @Test
    @DisplayName("Fallback ngân sách: lọc món <= 150k và loại món hết hàng")
    void fallback_budgetIntent_returnsMatchingAffordableItems() {
        CustomerAiChatRequest request = new CustomerAiChatRequest();
        request.setTableNumber("B-01");
        request.setMessage("Gợi ý món giá dưới 150k");

        CustomerAiChatResponse response = customerAiService.chatWithCustomer(request);

        assertThat(response.getReply()).contains("150.000₫");
        assertThat(response.getSuggestedDishes())
                .extracting("id")
                .containsExactlyInAnyOrder(2L, 3L, 5L, 6L);
    }

    @Test
    @DisplayName("Model Failover: model đầu bị timeout/503 tự động chuyển sang model dự phòng & bỏ qua thought part")
    void geminiFailover_switchesToBackupModelAndIgnoresThoughtPart() {
        ReflectionTestUtils.setField(customerAiService, "geminiApiKey", "AQ.TestValidKey");
        String mockWithThoughtJson = """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {
                            "thought": true,
                            "text": "Suy nghĩ nội bộ không phải JSON..."
                          },
                          {
                            "text": "{\\"reply\\":\\"Dạ mình dùng thử Nước Lọc Lavie nhé ạ!\\",\\"suggestedDishIds\\":[3,4],\\"quickSuggestions\\":[\\"Xem món chính\\"],\\"actionType\\":\\"NONE\\"}"
                          }
                        ]
                      }
                    }
                  ]
                }
                """;

        when(restTemplate.exchange(
                contains("models/gemini-flash-lite-latest:generateContent"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenThrow(new RestClientException("Read timed out"));

        when(restTemplate.exchange(
                contains("models/gemini-3.5-flash-lite:generateContent"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(mockWithThoughtJson, HttpStatus.OK));

        CustomerAiChatRequest request = new CustomerAiChatRequest();
        request.setTableNumber("B-01");
        request.setMessage("gợi ý đồ uống");

        CustomerAiChatResponse response = customerAiService.chatWithCustomer(request);

        assertThat(response.getReply()).isEqualTo("Dạ mình dùng thử Nước Lọc Lavie nhé ạ!");
        assertThat(response.getSuggestedDishes()).extracting("id").containsExactly(3L);
        verify(restTemplate, times(2)).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class));
    }

    @Test
    @DisplayName("Toàn bộ model lỗi: rơi về Smart Fallback chính xác đúng món")
    void allModelsFail_fallsBackAccurately() {
        ReflectionTestUtils.setField(customerAiService, "geminiApiKey", "AQ.TestValidKey");
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RestClientException("503 Service Unavailable"));

        CustomerAiChatRequest request = new CustomerAiChatRequest();
        request.setTableNumber("B-05");
        request.setMessage("gợi ý đồ uống");

        CustomerAiChatResponse response = customerAiService.chatWithCustomer(request);

        verify(restTemplate, times(3)).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class));
        assertThat(response.getReply()).contains("đồ uống");
        assertThat(response.getSuggestedDishes()).extracting("id").containsExactly(3L);
    }
}
