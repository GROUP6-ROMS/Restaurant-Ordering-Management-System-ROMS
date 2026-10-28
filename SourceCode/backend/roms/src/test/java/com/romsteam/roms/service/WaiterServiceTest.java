package com.romsteam.roms.service;

import com.romsteam.roms.dto.response.WaiterTableResponse;
import com.romsteam.roms.entity.*;
import com.romsteam.roms.entity.enums.SessionStatus;
import com.romsteam.roms.entity.enums.TableStatus;
import com.romsteam.roms.repository.*;
import com.romsteam.roms.service.serviceImpl.WaiterServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WaiterService Unit Tests - Quản lý Sơ đồ bàn & Phòng vệ Múi giờ / Thời gian bàn ngồi")
class WaiterServiceTest {

    @Mock
    private RestaurantTableRepository tableRepository;

    @Mock
    private DiningSessionRepository sessionRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private ServiceRequestRepository requestRepository;

    @Mock
    private MenuItemRepository menuItemRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ZoneRepository zoneRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private ReservationItemRepository reservationItemRepository;

    @Mock
    private RealtimeService realtimeService;

    @InjectMocks
    private WaiterServiceImpl waiterService;

    private RestaurantTable table;
    private DiningSession session;

    @BeforeEach
    void setUp() {
        table = RestaurantTable.builder()
                .id(12L)
                .tableNumber("B-02")
                .name("Ban Công 02 Góc Cây")
                .zone("ZONE_2")
                .capacity(4)
                .status(TableStatus.OCCUPIED)
                .isActive(true)
                .build();

        session = new DiningSession();
        session.setId(10004L);
        session.setTable(table);
        session.setStatus(SessionStatus.ACTIVE);
        session.setGuestCount(2);
    }

    @Test
    @DisplayName("1. Bàn đang dùng bữa bình thường -> Tính chính xác thời gian đã ngồi (VD: 25 phút)")
    void getFloorPlan_WhenSessionActiveAndNormalTime_ReturnsAccurateDuration() {
        // Arrange
        session.setStartTime(LocalDateTime.now().minusMinutes(25));
        when(tableRepository.findByIsActiveTrueOrderByTableNumberAsc()).thenReturn(Collections.singletonList(table));
        when(sessionRepository.findByTableIdAndStatus(12L, SessionStatus.ACTIVE)).thenReturn(Optional.of(session));
        when(orderRepository.findBySessionId(10004L)).thenReturn(Collections.emptyList());
        when(requestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(12L, "PENDING")).thenReturn(Collections.emptyList());

        // Act
        List<WaiterTableResponse> result = waiterService.getFloorPlan("ALL");

        // Assert
        assertThat(result).hasSize(1);
        WaiterTableResponse res = result.get(0);
        assertThat(res.getDurationMinutes()).isEqualTo(25L);
        assertThat(res.getDuration()).isEqualTo("25 phút");
    }

    @Test
    @DisplayName("2. Bàn có thời gian start_time ở tương lai (do lệch múi giờ UTC/GMT+7) -> durationMinutes không bị âm, trả về 0 phút")
    void getFloorPlan_WhenSessionStartTimeInFuture_ReturnsZeroDurationInsteadOfNegative() {
        // Arrange: Giả lập lệch 7 tiếng như trường hợp VPS chạy UTC gặp DB lưu GMT+7
        session.setStartTime(LocalDateTime.now().plusHours(7));
        when(tableRepository.findByIsActiveTrueOrderByTableNumberAsc()).thenReturn(Collections.singletonList(table));
        when(sessionRepository.findByTableIdAndStatus(12L, SessionStatus.ACTIVE)).thenReturn(Optional.of(session));
        when(orderRepository.findBySessionId(10004L)).thenReturn(Collections.emptyList());
        when(requestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(12L, "PENDING")).thenReturn(Collections.emptyList());

        // Act
        List<WaiterTableResponse> result = waiterService.getFloorPlan("ALL");

        // Assert
        assertThat(result).hasSize(1);
        WaiterTableResponse res = result.get(0);
        assertThat(res.getDurationMinutes()).isEqualTo(0L);
        assertThat(res.getDuration()).isEqualTo("0 phút");
    }

    @Test
    @DisplayName("3. Bàn trống (AVAILABLE, không có phiên) -> durationMinutes là 0 và duration là null")
    void getFloorPlan_WhenTableAvailableWithoutSession_ReturnsZeroDuration() {
        // Arrange
        table.setStatus(TableStatus.AVAILABLE);
        when(tableRepository.findByIsActiveTrueOrderByTableNumberAsc()).thenReturn(Collections.singletonList(table));
        when(sessionRepository.findByTableIdAndStatus(12L, SessionStatus.ACTIVE)).thenReturn(Optional.empty());
        when(requestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(12L, "PENDING")).thenReturn(Collections.emptyList());

        // Act
        List<WaiterTableResponse> result = waiterService.getFloorPlan("ALL");

        // Assert
        assertThat(result).hasSize(1);
        WaiterTableResponse res = result.get(0);
        assertThat(res.getDurationMinutes()).isEqualTo(0L);
        assertThat(res.getDuration()).isNull();
    }
}
