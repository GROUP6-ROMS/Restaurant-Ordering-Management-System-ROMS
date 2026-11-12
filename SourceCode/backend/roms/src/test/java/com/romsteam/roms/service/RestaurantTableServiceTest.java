package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.UpdateTableRequest;
import com.romsteam.roms.dto.request.UpdateTableStatusRequest;
import com.romsteam.roms.dto.response.TableOrdersResponse;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.entity.*;
import com.romsteam.roms.entity.enums.*;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.repository.*;
import com.romsteam.roms.security.JwtTokenProvider;
import com.romsteam.roms.service.serviceImpl.RestaurantTableServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RestaurantTableService Unit Tests - Quản Lý Sơ Đồ Bàn & Khóa An Toàn Buffer Lock")
class RestaurantTableServiceTest {

    @Mock
    private RestaurantTableRepository tableRepository;

    @Mock
    private DiningSessionRepository diningSessionRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private MenuItemRepository menuItemRepository;

    @Mock
    private ZoneRepository zoneRepository;

    @Mock
    private ServiceRequestRepository serviceRequestRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private ReservationItemRepository reservationItemRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private RealtimeService realtimeService;

    @InjectMocks
    private RestaurantTableServiceImpl tableService;

    private RestaurantTable table;
    private DiningSession session;
    private Reservation confirmedReservation;

    @BeforeEach
    void setUp() {
        table = RestaurantTable.builder()
                .id(1L)
                .tableNumber("T-01")
                .name("Bàn T-01")
                .zone("ZONE_1")
                .capacity(4)
                .status(TableStatus.AVAILABLE)
                .isActive(true)
                .build();

        session = new DiningSession();
        session.setId(10L);
        session.setTable(table);
        session.setStatus(SessionStatus.ACTIVE);
        session.setGuestCount(4);
        session.setStartTime(LocalDateTime.now().minusMinutes(30));

        // Khách hẹn đặt trước 30 phút nữa (trong khung khóa an toàn 60 phút)
        confirmedReservation = Reservation.builder()
                .id(100L)
                .bookingCode("RES-20261019-1234")
                .customerName("Nguyễn Văn A")
                .customerPhone("0901234567")
                .guestCount(4)
                .reservationTime(LocalDateTime.now().plusMinutes(30))
                .status(ReservationStatus.CONFIRMED)
                .table(table)
                .build();
    }

    @Test
    @DisplayName("1. Buffer Lock: Chặn mở bàn vãng lai (OCCUPIED) khi có khách đặt trước trong vòng 60 phút")
    void updateTableStatus_WhenInsideBufferWindowAndNoForce_ThrowsException() {
        // Arrange
        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(diningSessionRepository.findByTableIdAndStatus(1L, SessionStatus.ACTIVE)).thenReturn(Optional.empty());
        when(reservationRepository.findByTableIdAndStatusOrderByReservationTimeAsc(1L, ReservationStatus.CONFIRMED))
                .thenReturn(List.of(confirmedReservation));

        UpdateTableStatusRequest request = new UpdateTableStatusRequest();
        request.setStatus(TableStatus.OCCUPIED);
        request.setForceOverride(false); // Không chọn mở cưỡng chế

        // Act & Assert
        assertThatThrownBy(() -> tableService.updateTableStatus(1L, request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("BÀN ĐANG ĐƯỢC KHÓA AN TOÀN")
                .hasMessageContaining("Nguyễn Văn A");
    }

    @Test
    @DisplayName("2. Buffer Lock: Cho phép mở bàn nếu Quản lý bật cờ forceOverride = true")
    void updateTableStatus_WhenInsideBufferWindowAndForceOverrideTrue_Succeeds() {
        // Arrange
        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(diningSessionRepository.findByTableIdAndStatus(1L, SessionStatus.ACTIVE)).thenReturn(Optional.empty());
        when(tableRepository.save(any(RestaurantTable.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateTableStatusRequest request = new UpdateTableStatusRequest();
        request.setStatus(TableStatus.OCCUPIED);
        request.setForceOverride(true); // Quản lý đồng ý mở cưỡng chế

        // Act
        TableResponse response = tableService.updateTableStatus(1L, request);

        // Assert
        assertThat(response).isNotNull();
        assertThat(table.getStatus()).isEqualTo(TableStatus.OCCUPIED);
        verify(tableRepository).save(table);
    }

    @Test
    @DisplayName("3. Buffer Lock: Cho phép mở bàn bình thường nếu giờ khách đặt còn rất xa (> 60 phút)")
    void updateTableStatus_WhenReservationIsFarAway_Succeeds() {
        // Khách hẹn đặt lúc 3 tiếng nữa (> 60 phút)
        confirmedReservation.setReservationTime(LocalDateTime.now().plusHours(3));

        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(diningSessionRepository.findByTableIdAndStatus(1L, SessionStatus.ACTIVE)).thenReturn(Optional.empty());
        when(reservationRepository.findByTableIdAndStatusOrderByReservationTimeAsc(1L, ReservationStatus.CONFIRMED))
                .thenReturn(List.of(confirmedReservation));
        when(tableRepository.save(any(RestaurantTable.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateTableStatusRequest request = new UpdateTableStatusRequest();
        request.setStatus(TableStatus.OCCUPIED);
        request.setForceOverride(false);

        // Act
        TableResponse response = tableService.updateTableStatus(1L, request);

        // Assert
        assertThat(response).isNotNull();
        assertThat(table.getStatus()).isEqualTo(TableStatus.OCCUPIED);
    }

    @Test
    @DisplayName("4. Chặn đổi trạng thái bàn OCCUPIED nếu còn đơn món chưa hoàn tất thanh toán")
    void updateTableStatus_WhenOccupiedAndHasActiveOrders_ThrowsException() {
        table.setStatus(TableStatus.OCCUPIED);

        Order activeOrder = new Order();
        activeOrder.setId(20L);
        activeOrder.setStatus(OrderStatus.COOKING);

        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(diningSessionRepository.findByTableIdAndStatus(1L, SessionStatus.ACTIVE)).thenReturn(Optional.of(session));
        when(orderRepository.findBySessionId(10L)).thenReturn(List.of(activeOrder));

        UpdateTableStatusRequest request = new UpdateTableStatusRequest();
        request.setStatus(TableStatus.AVAILABLE);

        // Act & Assert
        assertThatThrownBy(() -> tableService.updateTableStatus(1L, request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("chưa hoàn tất thanh toán");
    }

    @Test
    @DisplayName("5. Chặn giảm sức chứa bàn xuống dưới số lượng khách đang ngồi dùng bữa")
    void updateTable_WhenReducingCapacityBelowCurrentGuests_ThrowsException() {
        table.setStatus(TableStatus.OCCUPIED);
        session.setGuestCount(6); // Đang có 6 khách ngồi ăn

        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(tableRepository.existsByTableNumberAndIdNot("T-01", 1L)).thenReturn(false);
        when(diningSessionRepository.findByTableIdAndStatus(1L, SessionStatus.ACTIVE)).thenReturn(Optional.of(session));

        UpdateTableRequest request = new UpdateTableRequest();
        request.setTableNumber("T-01");
        request.setCapacity(4); // Giảm xuống 4 chỗ < 6 khách đang ngồi
        request.setZone("ZONE_1");

        // Act & Assert
        assertThatThrownBy(() -> tableService.updateTable(1L, request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Không thể giảm sức chứa xuống 4 chỗ");
    }

    @Test
    @DisplayName("6. Hủy món ăn tại bàn: cập nhật OrderItem sang CANCELLED và tính lại tổng tiền")
    void cancelOrderItem_WhenValid_CancelsItemAndUpdatesTotal() {
        Order testOrder = new Order();
        testOrder.setId(30L);
        testOrder.setSession(session);
        testOrder.setStatus(OrderStatus.COOKING);

        OrderItem dish = new OrderItem();
        dish.setId(301L);
        dish.setOrder(testOrder);
        dish.setStatus(OrderItemStatus.PENDING);
        dish.setUnitPrice(BigDecimal.valueOf(100000));
        dish.setSubtotal(BigDecimal.valueOf(100000));
        testOrder.setItems(List.of(dish));

        when(orderItemRepository.findById(301L)).thenReturn(Optional.of(dish));
        when(orderItemRepository.save(any(OrderItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(diningSessionRepository.findByTableIdAndStatus(1L, SessionStatus.ACTIVE)).thenReturn(Optional.of(session));
        when(orderRepository.findBySessionId(10L)).thenReturn(List.of(testOrder));

        // Act
        TableOrdersResponse response = tableService.cancelOrderItem(301L, "Khách đổi ý");

        // Assert
        assertThat(dish.getStatus()).isEqualTo(OrderItemStatus.CANCELLED);
        assertThat(dish.getNote()).contains("HỦY BỞI QUẢN LÝ: Khách đổi ý");
        assertThat(testOrder.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(testOrder.getTotalAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("7. Hủy món ăn có theo dõi tồn kho: hoàn trả số lượng còn lại và tự động mở lại bán (Issue #60)")
    void cancelOrderItem_WhenItemHasStock_RestoresStockAndReenablesAvailability() {
        Order testOrder = new Order();
        testOrder.setId(31L);
        testOrder.setSession(session);
        testOrder.setStatus(OrderStatus.COOKING);

        MenuItem steak = MenuItem.builder()
                .id(99L)
                .name("Bò Bít Tết Hảo Hạng")
                .dailyStock(10)
                .remainingStock(0)
                .isAvailable(false)
                .tag("Tạm Hết (86d)")
                .build();

        OrderItem dish = new OrderItem();
        dish.setId(302L);
        dish.setOrder(testOrder);
        dish.setMenuItem(steak);
        dish.setQuantity(2);
        dish.setStatus(OrderItemStatus.PENDING);
        dish.setUnitPrice(BigDecimal.valueOf(150000));
        dish.setSubtotal(BigDecimal.valueOf(300000));
        testOrder.setItems(List.of(dish));

        when(orderItemRepository.findById(302L)).thenReturn(Optional.of(dish));
        when(orderItemRepository.save(any(OrderItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(menuItemRepository.findByIdForUpdate(99L)).thenReturn(Optional.of(steak));
        when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(diningSessionRepository.findByTableIdAndStatus(1L, SessionStatus.ACTIVE)).thenReturn(Optional.of(session));
        when(orderRepository.findBySessionId(10L)).thenReturn(List.of(testOrder));

        // Act
        tableService.cancelOrderItem(302L, "Khách không ăn nữa");

        // Assert: 2 phần bò bít tết được hoàn trả, tồn kho về 2 và mở lại bán
        assertThat(dish.getStatus()).isEqualTo(OrderItemStatus.CANCELLED);
        assertThat(steak.getRemainingStock()).isEqualTo(2);
        assertThat(steak.getIsAvailable()).isTrue();
        assertThat(steak.getTag()).isEqualTo("Đang Bán");
        verify(menuItemRepository).save(steak);
    }

    @Test
    @DisplayName("8. Điều chỉnh giảm số lượng món tại bàn: tự động hoàn trả số suất chênh lệch về kho (Issue #60)")
    void updateOrderItemQuantity_WhenDecreased_RestoresStockDifference() {
        Order testOrder = new Order();
        testOrder.setId(32L);
        testOrder.setSession(session);
        testOrder.setStatus(OrderStatus.COOKING);

        MenuItem soup = MenuItem.builder()
                .id(88L)
                .name("Súp Hải Sản")
                .dailyStock(10)
                .remainingStock(5)
                .isAvailable(true)
                .build();

        OrderItem dish = new OrderItem();
        dish.setId(303L);
        dish.setOrder(testOrder);
        dish.setMenuItem(soup);
        dish.setQuantity(3);
        dish.setStatus(OrderItemStatus.PENDING);
        dish.setUnitPrice(BigDecimal.valueOf(50000));
        dish.setSubtotal(BigDecimal.valueOf(150000));
        testOrder.setItems(List.of(dish));

        when(orderItemRepository.findById(303L)).thenReturn(Optional.of(dish));
        when(orderItemRepository.save(any(OrderItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(menuItemRepository.findByIdForUpdate(88L)).thenReturn(Optional.of(soup));
        when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(diningSessionRepository.findByTableIdAndStatus(1L, SessionStatus.ACTIVE)).thenReturn(Optional.of(session));
        when(orderRepository.findBySessionId(10L)).thenReturn(List.of(testOrder));

        // Act: Giảm số lượng từ 3 xuống 1 (hoàn lại 2 phần)
        tableService.updateOrderItemQuantity(303L, 1);

        // Assert
        assertThat(dish.getQuantity()).isEqualTo(1);
        assertThat(dish.getSubtotal()).isEqualByComparingTo(BigDecimal.valueOf(50000));
        assertThat(soup.getRemainingStock()).isEqualTo(7); // 5 + 2 = 7
        verify(menuItemRepository).save(soup);
    }

    @Test
    @DisplayName("9. Điều chỉnh tăng số lượng món vượt quá tồn kho còn lại: Ném ngoại lệ BAD_REQUEST (Issue #60)")
    void updateOrderItemQuantity_WhenIncreasedBeyondStock_ThrowsException() {
        MenuItem limitedItem = MenuItem.builder()
                .id(77L)
                .name("Cua Hoàng Đế")
                .dailyStock(5)
                .remainingStock(1) // Chỉ còn 1 phần
                .isAvailable(true)
                .build();

        OrderItem dish = new OrderItem();
        dish.setId(304L);
        dish.setMenuItem(limitedItem);
        dish.setQuantity(1);
        dish.setStatus(OrderItemStatus.PENDING);
        dish.setUnitPrice(BigDecimal.valueOf(500000));

        when(orderItemRepository.findById(304L)).thenReturn(Optional.of(dish));
        when(menuItemRepository.findByIdForUpdate(77L)).thenReturn(Optional.of(limitedItem));

        // Act & Assert: Tăng từ 1 lên 3 (cần thêm 2 phần nhưng chỉ còn 1 phần tồn kho)
        assertThatThrownBy(() -> tableService.updateOrderItemQuantity(304L, 3))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("chỉ còn lại 1 phần");
    }
}
