package com.romsteam.roms.observability;

import com.romsteam.roms.actuator.RestaurantOperationalHealthIndicator;
import com.romsteam.roms.dto.request.CreateCategoryRequest;
import com.romsteam.roms.dto.response.ApiResponse;
import com.romsteam.roms.dto.response.CategoryResponse;
import com.romsteam.roms.dto.response.CustomerMenuResponse;
import com.romsteam.roms.entity.Category;
import com.romsteam.roms.entity.MenuItem;
import com.romsteam.roms.entity.RestaurantTable;
import com.romsteam.roms.entity.enums.TableStatus;
import com.romsteam.roms.repository.CategoryRepository;
import com.romsteam.roms.repository.MenuItemRepository;
import com.romsteam.roms.repository.RestaurantTableRepository;
import com.romsteam.roms.security.TraceIdFilter;
import com.romsteam.roms.service.CustomerDiningService;
import com.romsteam.roms.service.MenuService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.Status;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.annotation.DirtiesContext;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
@DisplayName("Giai Đoạn 5: Observability, Trace ID & In-Memory Caching Verification")
class ObservabilityAndCachingTest {

    @Autowired
    private TraceIdFilter traceIdFilter;

    @Autowired
    private RestaurantOperationalHealthIndicator healthIndicator;

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private CustomerDiningService customerDiningService;

    @Autowired
    private MenuService menuService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private RestaurantTableRepository tableRepository;

    @BeforeEach
    void setUp() {
        MDC.clear();
    }

    @Test
    @DisplayName("TraceIdFilter: Tự sinh mã Trace ID mới với tiền tố roms- và gán vào Response Header khi client không truyền")
    void testTraceIdFilterGeneratesNewId() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        traceIdFilter.doFilter(request, response, filterChain);

        String traceHeader = response.getHeader("X-Trace-Id");
        assertThat(traceHeader).isNotNull();
        assertThat(traceHeader).startsWith("roms-");
        // Kiểm tra sau khi kết thúc request, MDC phải được xóa sạch để tránh rò rỉ bộ nhớ
        assertThat(MDC.get("traceId")).isNull();
    }

    @Test
    @DisplayName("TraceIdFilter: Giữ nguyên Trace ID do Client truyền lên trong header X-Trace-Id")
    void testTraceIdFilterPreservesClientTraceId() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        String clientTrace = "custom-client-trace-9999";
        request.addHeader("X-Trace-Id", clientTrace);

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        traceIdFilter.doFilter(request, response, filterChain);

        assertThat(response.getHeader("X-Trace-Id")).isEqualTo(clientTrace);
        assertThat(MDC.get("traceId")).isNull();
    }

    @Test
    @DisplayName("ApiResponse: Tự động gắn traceId từ MDC vào kết quả trả về")
    void testApiResponsePicksUpTraceId() {
        MDC.put("traceId", "roms-test-trace-1234");
        try {
            ApiResponse<String> response = ApiResponse.success("Dữ liệu thử nghiệm", "Thành công");
            assertThat(response.getTraceId()).isEqualTo("roms-test-trace-1234");
            assertThat(response.isSuccess()).isTrue();

            ApiResponse<Void> errorResponse = ApiResponse.error("Có lỗi xảy ra");
            assertThat(errorResponse.getTraceId()).isEqualTo("roms-test-trace-1234");
            assertThat(errorResponse.isSuccess()).isFalse();
        } finally {
            MDC.clear();
        }
    }

    @Test
    @DisplayName("Actuator HealthIndicator: Trả về trạng thái UP kèm chi tiết số bàn, phiên ăn và món đang nấu")
    void testRestaurantOperationalHealthIndicator() {
        // Tạo dữ liệu mẫu
        RestaurantTable table = RestaurantTable.builder()
                .tableNumber("T-01")
                .name("Bàn số 1")
                .capacity(4)
                .zone("ZONE_1")
                .status(TableStatus.AVAILABLE)
                .isActive(true)
                .build();
        tableRepository.save(table);

        Health health = healthIndicator.health();

        assertThat(health.getStatus()).isEqualTo(Status.UP);
        assertThat(health.getDetails()).containsKey("operationalStatus");
        assertThat(health.getDetails().get("operationalStatus")).isEqualTo("RESTAURANT_ONLINE");
        assertThat(health.getDetails()).containsKey("totalTables");
        assertThat(health.getDetails()).containsKey("activeDiningSessions");
        assertThat(health.getDetails()).containsKey("cookingDishesInKitchen");
    }

    @Test
    @DisplayName("Spring Cache: Tự động lưu cache Thực đơn (customerMenu) và Danh mục (categories)")
    void testMenuCachingAndEviction() {
        // 1. Tạo danh mục và món ăn mẫu
        Category cat = Category.builder()
                .name("Món Nướng Đặc Biệt")
                .description("Các món nướng than hoa")
                .displayOrder(1)
                .isActive(true)
                .build();
        cat = categoryRepository.save(cat);

        MenuItem item = MenuItem.builder()
                .category(cat)
                .sku("NUONG-01")
                .name("Sườn Bò Mỹ Nướng")
                .price(BigDecimal.valueOf(250000))
                .costPrice(BigDecimal.valueOf(120000))
                .isAvailable(true)
                .dailyStock(50)
                .remainingStock(50)
                .station("KITCHEN")
                .isActive(true)
                .build();
        menuItemRepository.save(item);

        // 2. Kiểm tra cache khởi đầu
        Cache menuCache = cacheManager.getCache("customerMenu");
        Cache catCache = cacheManager.getCache("categories");
        assertThat(menuCache).isNotNull();
        assertThat(catCache).isNotNull();

        // 3. Lần gọi đầu tiên: Đọc từ DB và tự nạp vào Cache
        List<CustomerMenuResponse> menu1 = customerDiningService.getCustomerMenu();
        assertThat(menu1).isNotEmpty();

        // 4. Lần gọi thứ hai: Đọc từ Cache (kết quả trả về tương tự)
        List<CustomerMenuResponse> menu2 = customerDiningService.getCustomerMenu();
        assertThat(menu2).hasSameSizeAs(menu1);

        // 5. Thêm mới danh mục -> Kích hoạt @CacheEvict -> Cache bị xóa sạch
        CreateCategoryRequest newCatReq = new CreateCategoryRequest();
        newCatReq.setName("Lẩu Hải Sản");
        newCatReq.setDisplayOrder(2);
        menuService.createCategory(newCatReq);

        // Kiểm tra sau khi CacheEvict, menuCache đã được làm mới
        List<CategoryResponse> allCats = menuService.getAllCategories();
        assertThat(allCats).anyMatch(c -> c.getName().equals("Lẩu Hải Sản"));
    }
}
