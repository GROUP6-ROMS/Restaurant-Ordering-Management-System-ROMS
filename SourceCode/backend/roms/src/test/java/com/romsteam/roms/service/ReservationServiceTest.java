package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.AssignTableReservationRequest;
import com.romsteam.roms.dto.request.CreateReservationRequest;
import com.romsteam.roms.dto.request.ReservationItemRequest;
import com.romsteam.roms.dto.response.ReservationResponse;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.entity.*;
import com.romsteam.roms.entity.enums.ReservationStatus;
import com.romsteam.roms.entity.enums.TableStatus;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.repository.MenuItemRepository;
import com.romsteam.roms.repository.ReservationRepository;
import com.romsteam.roms.repository.RestaurantTableRepository;
import com.romsteam.roms.service.serviceImpl.ReservationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReservationService Unit Tests - Đặt Bàn Trước & Điều Phối Xếp Bàn")
class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private RestaurantTableRepository tableRepository;

    @Mock
    private MenuItemRepository menuItemRepository;

    @Mock
    private RestaurantTableService tableService;

    @InjectMocks
    private ReservationServiceImpl reservationService;

    private MenuItem activeDish;
    private RestaurantTable table;

    @BeforeEach
    void setUp() {
        activeDish = MenuItem.builder()
                .id(1L)
                .name("Bò Nướng Tảng Sốt Tiêu Đen")
                .price(BigDecimal.valueOf(180000))
                .isActive(true)
                .build();

        table = RestaurantTable.builder()
                .id(5L)
                .tableNumber("VIP-01")
                .name("Phòng VIP 1")
                .zone("VIP")
                .capacity(8)
                .status(TableStatus.AVAILABLE)
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("1. Từ chối đặt bàn trong quá khứ (BR-15)")
    void createCustomerReservation_WhenInPast_ThrowsException() {
        // Ngày hôm qua
        LocalDate yesterday = LocalDate.now().minusDays(1);
        CreateReservationRequest request = CreateReservationRequest.builder()
                .customerName("Trần Khách Hàng")
                .customerPhone("0987654321")
                .guestCount(4)
                .reservationDate(yesterday.toString())
                .reservationTime("18:30")
                .requestedZone("VIP")
                .build();

        // Act & Assert
        assertThatThrownBy(() -> reservationService.createCustomerReservation(request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Thời gian đặt bàn không hợp lệ");
    }

    @Test
    @DisplayName("2. Đặt bàn thành công trong tương lai với trạng thái PENDING và món đặt trước")
    void createCustomerReservation_WhenValid_SavesPendingReservationWithItems() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        ReservationItemRequest itemReq = new ReservationItemRequest();
        itemReq.setMenuItemId(1L);
        itemReq.setQuantity(2);
        itemReq.setNote("Ít cay");

        CreateReservationRequest request = CreateReservationRequest.builder()
                .customerName("Trần Khách Hàng")
                .customerPhone("0987654321")
                .guestCount(4)
                .reservationDate(tomorrow.toString())
                .reservationTime("19:00")
                .requestedZone("VIP")
                .preOrderItems(List.of(itemReq))
                .build();

        when(reservationRepository.existsByBookingCode(anyString())).thenReturn(false);
        when(menuItemRepository.findById(1L)).thenReturn(Optional.of(activeDish));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        ReservationResponse response = reservationService.createCustomerReservation(request);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getCustomerName()).isEqualTo("Trần Khách Hàng");
        assertThat(response.getStatus()).isEqualTo(ReservationStatus.PENDING);
        assertThat(response.getBookingCode()).startsWith("RES-");
        assertThat(response.getPreOrderItems()).hasSize(1);
        assertThat(response.getPreOrderTotal()).isEqualByComparingTo(BigDecimal.valueOf(360000)); // 180k * 2
        verify(reservationRepository).save(any(Reservation.class));
    }

    @Test
    @DisplayName("3. Quản lý xếp bàn cho đơn đặt: chuyển Reservation sang CONFIRMED và Table sang RESERVED")
    void assignTableToReservation_WhenTableAvailable_ConfirmsReservation() {
        Reservation reservation = Reservation.builder()
                .id(10L)
                .bookingCode("RES-20261020-5678")
                .customerName("Lê Văn B")
                .customerPhone("0912345678")
                .guestCount(6)
                .reservationTime(LocalDateTime.now().plusDays(1))
                .status(ReservationStatus.PENDING)
                .build();

        AssignTableReservationRequest request = new AssignTableReservationRequest();
        request.setTableId(5L);

        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));
        when(tableRepository.findById(5L)).thenReturn(Optional.of(table));
        when(tableRepository.save(any(RestaurantTable.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        ReservationResponse response = reservationService.assignTableToReservation(10L, request);

        // Assert
        assertThat(response).isNotNull();
        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.CONFIRMED);
        assertThat(table.getStatus()).isEqualTo(TableStatus.RESERVED);
        assertThat(table.getReservationInfo()).contains("Lê Văn B");
        verify(tableRepository).save(table);
        verify(reservationRepository).save(reservation);
    }

    @Test
    @DisplayName("4. Xếp bàn bị từ chối nếu bàn không ở trạng thái trống (AVAILABLE)")
    void assignTableToReservation_WhenTableNotAvailable_ThrowsException() {
        table.setStatus(TableStatus.OCCUPIED); // Bàn đang có khách

        Reservation reservation = Reservation.builder()
                .id(10L)
                .status(ReservationStatus.PENDING)
                .build();

        AssignTableReservationRequest request = new AssignTableReservationRequest();
        request.setTableId(5L);

        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));
        when(tableRepository.findById(5L)).thenReturn(Optional.of(table));

        // Act & Assert
        assertThatThrownBy(() -> reservationService.assignTableToReservation(10L, request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("hiện không ở trạng thái trống");
    }

    @Test
    @DisplayName("5. Gợi ý bàn trống khả dụng: Ưu tiên bàn thuộc khu vực khách đặt và đủ sức chứa lên trước")
    void getAvailableTablesForReservation_PrioritizesRequestedZoneAndCapacity() {
        // Đơn đặt cho 4 khách tại khu vực VIP
        Reservation reservation = Reservation.builder()
                .id(10L)
                .requestedZone("VIP")
                .guestCount(4)
                .build();

        // 3 bàn trống ở các khu vực khác nhau
        RestaurantTable t1 = RestaurantTable.builder()
                .id(1L).tableNumber("T-01").name("Bàn 1").zone("ZONE_1").capacity(4).status(TableStatus.AVAILABLE).isActive(true).build();
        RestaurantTable t2 = RestaurantTable.builder()
                .id(2L).tableNumber("VIP-01").name("Phòng VIP 1").zone("VIP").capacity(2).status(TableStatus.AVAILABLE).isActive(true).build();
        RestaurantTable t3 = RestaurantTable.builder()
                .id(3L).tableNumber("VIP-02").name("Phòng VIP 2").zone("VIP").capacity(6).status(TableStatus.AVAILABLE).isActive(true).build();

        when(reservationRepository.findById(10L)).thenReturn(Optional.of(reservation));
        when(tableRepository.findByStatusAndIsActiveTrue(TableStatus.AVAILABLE))
                .thenReturn(new ArrayList<>(List.of(t1, t2, t3)));

        // Act
        List<TableResponse> results = reservationService.getAvailableTablesForReservation(10L);

        // Assert: Bàn VIP-02 (VIP + đủ 6 chỗ) phải đứng đầu, tiếp theo là VIP-01 (VIP), sau cùng là T-01 (ZONE_1)
        assertThat(results).hasSize(3);
        assertThat(results.get(0).getCode()).isEqualTo("VIP-02");
        assertThat(results.get(0).getZone()).isEqualTo("VIP");
        assertThat(results.get(1).getCode()).isEqualTo("VIP-01");
        assertThat(results.get(2).getCode()).isEqualTo("T-01");
    }
}

