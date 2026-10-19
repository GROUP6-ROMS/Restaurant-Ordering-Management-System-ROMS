package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.UpdateKitchenStatusRequest;
import com.romsteam.roms.dto.response.KitchenOrderResponse;
import com.romsteam.roms.entity.*;
import com.romsteam.roms.entity.enums.OrderItemStatus;
import com.romsteam.roms.entity.enums.OrderStatus;
import com.romsteam.roms.entity.enums.SessionStatus;
import com.romsteam.roms.exception.ResourceNotFoundException;
import com.romsteam.roms.repository.OrderItemRepository;
import com.romsteam.roms.repository.OrderRepository;
import com.romsteam.roms.repository.ZoneRepository;
import com.romsteam.roms.service.serviceImpl.KitchenServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("KitchenService Unit Tests - Quản lý Trạng thái Đơn Món Bếp KDS")
class KitchenServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private ZoneRepository zoneRepository;

    @Mock
    private RealtimeService realtimeService;

    @InjectMocks
    private KitchenServiceImpl kitchenService;

    private RestaurantTable table;
    private DiningSession session;
    private Order order;
    private MenuItem menuItem1;
    private MenuItem menuItem2;
    private OrderItem item1;
    private OrderItem item2;

    @BeforeEach
    void setUp() {
        table = RestaurantTable.builder()
                .id(1L)
                .tableNumber("T-01")
                .name("Bàn T-01")
                .zone("ZONE_1")
                .capacity(4)
                .build();

        session = new DiningSession();
        session.setId(100L);
        session.setTable(table);
        session.setStatus(SessionStatus.ACTIVE);
        session.setGuestCount(3);
        session.setStartTime(LocalDateTime.now().minusMinutes(20));

        menuItem1 = MenuItem.builder()
                .id(10L)
                .name("Phở Bò Tái Lăn")
                .price(BigDecimal.valueOf(85000))
                .station("KITCHEN")
                .build();

        menuItem2 = MenuItem.builder()
                .id(20L)
                .name("Nem Rán Hà Nội")
                .price(BigDecimal.valueOf(60000))
                .station("KITCHEN")
                .build();

        order = new Order();
        order.setId(200L);
        order.setSession(session);
        order.setOrderCode("ORD-T01-1001");
        order.setOrderTime(LocalDateTime.now().minusMinutes(15));
        order.setStatus(OrderStatus.SUBMITTED);
        order.setTotalAmount(BigDecimal.valueOf(145000));

        item1 = new OrderItem();
        item1.setId(1001L);
        item1.setOrder(order);
        item1.setMenuItem(menuItem1);
        item1.setQuantity(1);
        item1.setUnitPrice(BigDecimal.valueOf(85000));
        item1.setSubtotal(BigDecimal.valueOf(85000));
        item1.setStatus(OrderItemStatus.PENDING);

        item2 = new OrderItem();
        item2.setId(1002L);
        item2.setOrder(order);
        item2.setMenuItem(menuItem2);
        item2.setQuantity(1);
        item2.setUnitPrice(BigDecimal.valueOf(60000));
        item2.setSubtotal(BigDecimal.valueOf(60000));
        item2.setStatus(OrderItemStatus.PENDING);

        List<OrderItem> items = new ArrayList<>();
        items.add(item1);
        items.add(item2);
        order.setItems(items);
    }

    @Test
    @DisplayName("1. Cập nhật món đầu tiên sang COOKING -> Toàn bộ đơn chuyển sang COOKING")
    void updateItemStatus_WhenFirstItemStartsCooking_OrderBecomesCooking() {
        // Arrange
        when(orderItemRepository.findById(1001L)).thenReturn(Optional.of(item1));
        when(orderItemRepository.save(any(OrderItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateKitchenStatusRequest request = new UpdateKitchenStatusRequest();
        request.setStatus("COOKING");

        // Act
        KitchenOrderResponse response = kitchenService.updateItemStatus(1001L, request);

        // Assert
        assertThat(item1.getStatus()).isEqualTo(OrderItemStatus.COOKING);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.COOKING);
        verify(orderItemRepository).save(item1);
        verify(realtimeService).notifyOrderStatus(eq(200L), eq(1L), eq("T-01"), eq("COOKING"), eq(1001L));
    }

    @Test
    @DisplayName("2. Cập nhật tất cả món sang READY -> Toàn bộ đơn chuyển sang READY")
    void updateItemStatus_WhenAllItemsReady_OrderBecomesReady() {
        // Arrange
        item1.setStatus(OrderItemStatus.READY); // Món 1 đã nấu xong
        when(orderItemRepository.findById(1002L)).thenReturn(Optional.of(item2));
        when(orderItemRepository.save(any(OrderItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateKitchenStatusRequest request = new UpdateKitchenStatusRequest();
        request.setStatus("READY");

        // Act
        KitchenOrderResponse response = kitchenService.updateItemStatus(1002L, request);

        // Assert
        assertThat(item2.getStatus()).isEqualTo(OrderItemStatus.READY);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.READY);
        verify(orderRepository).save(order);
    }

    @Test
    @DisplayName("3. Hủy món ăn -> Loại trừ tiền món đã hủy khỏi tổng tiền đơn hàng")
    void updateItemStatus_WhenItemCancelled_RecalculatesTotalAmount() {
        // Arrange
        when(orderItemRepository.findById(1002L)).thenReturn(Optional.of(item2));
        when(orderItemRepository.save(any(OrderItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateKitchenStatusRequest request = new UpdateKitchenStatusRequest();
        request.setStatus("CANCELLED");

        // Act
        kitchenService.updateItemStatus(1002L, request);

        // Assert: Tiền ban đầu là 145.000, hủy món 2 (60.000) thì còn 85.000
        assertThat(item2.getStatus()).isEqualTo(OrderItemStatus.CANCELLED);
        assertThat(order.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(85000));
        verify(orderRepository).save(order);
    }

    @Test
    @DisplayName("4. Hủy tất cả các món trong đơn -> Đơn hàng chuyển sang CANCELLED")
    void updateItemStatus_WhenAllItemsCancelled_OrderBecomesCancelled() {
        // Arrange
        item1.setStatus(OrderItemStatus.CANCELLED);
        when(orderItemRepository.findById(1002L)).thenReturn(Optional.of(item2));
        when(orderItemRepository.save(any(OrderItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateKitchenStatusRequest request = new UpdateKitchenStatusRequest();
        request.setStatus("CANCELLED");

        // Act
        kitchenService.updateItemStatus(1002L, request);

        // Assert
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(order.getTotalAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("5. Cập nhật món không tồn tại -> Ném ResourceNotFoundException")
    void updateItemStatus_WhenItemNotFound_ThrowsException() {
        // Arrange
        when(orderItemRepository.findById(9999L)).thenReturn(Optional.empty());
        UpdateKitchenStatusRequest request = new UpdateKitchenStatusRequest();
        request.setStatus("COOKING");

        // Act & Assert
        assertThatThrownBy(() -> kitchenService.updateItemStatus(9999L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("9999");
    }
}
