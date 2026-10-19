package com.romsteam.roms.actuator;

import com.romsteam.roms.entity.enums.OrderItemStatus;
import com.romsteam.roms.entity.enums.SessionStatus;
import com.romsteam.roms.entity.enums.TableStatus;
import com.romsteam.roms.repository.DiningSessionRepository;
import com.romsteam.roms.repository.OrderItemRepository;
import com.romsteam.roms.repository.RestaurantTableRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;

/**
 * Chỉ số sức khỏe vận hành nhà hàng (Custom Health Indicator).
 * Cung cấp thông tin realtime về: Bàn ăn đang phục vụ, phiên ăn active, và số lượng món ăn đang chế biến tại Bếp.
 * Được tích hợp trực tiếp vào endpoint /actuator/health của Spring Boot Actuator.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RestaurantOperationalHealthIndicator implements HealthIndicator {

    private final RestaurantTableRepository tableRepository;
    private final DiningSessionRepository diningSessionRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    public Health health() {
        try {
            long totalActiveTables = tableRepository.countByIsActiveTrue();
            long occupiedTables = tableRepository.countByStatusAndIsActiveTrue(TableStatus.OCCUPIED);
            long availableTables = tableRepository.countByStatusAndIsActiveTrue(TableStatus.AVAILABLE);
            long activeSessions = diningSessionRepository.countByStatus(SessionStatus.ACTIVE);
            long cookingDishes = orderItemRepository.countByStatusIn(
                    Arrays.asList(OrderItemStatus.PENDING, OrderItemStatus.COOKING)
            );

            return Health.up()
                    .withDetail("operationalStatus", "RESTAURANT_ONLINE")
                    .withDetail("totalTables", totalActiveTables)
                    .withDetail("occupiedTables", occupiedTables)
                    .withDetail("availableTables", availableTables)
                    .withDetail("activeDiningSessions", activeSessions)
                    .withDetail("cookingDishesInKitchen", cookingDishes)
                    .withDetail("healthCheckTime", LocalDateTime.now().toString())
                    .build();
        } catch (Exception ex) {
            log.error("Lỗi khi kiểm tra chỉ số sức khỏe vận hành nhà hàng: {}", ex.getMessage());
            return Health.down(ex)
                    .withDetail("error", "Không thể kết nối CSDL hoặc kiểm tra sức khỏe hệ thống")
                    .build();
        }
    }
}
