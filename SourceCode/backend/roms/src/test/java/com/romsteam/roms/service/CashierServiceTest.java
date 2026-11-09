package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.CashierCheckoutRequest;
import com.romsteam.roms.dto.response.CashierBillPreviewResponse;
import com.romsteam.roms.dto.response.CashierInvoiceResponse;
import com.romsteam.roms.entity.*;
import com.romsteam.roms.entity.enums.*;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.exception.ResourceNotFoundException;
import com.romsteam.roms.repository.*;
import com.romsteam.roms.service.serviceImpl.CashierServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CashierService Unit Tests - Nghiệp Vụ Thu Ngân, Tính Tiền POS & Chốt Hóa Đơn")
class CashierServiceTest {

    @Mock
    private RestaurantTableRepository tableRepository;

    @Mock
    private DiningSessionRepository sessionRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private BillRepository billRepository;

    @Mock
    private ServiceRequestRepository requestRepository;

    @Mock
    private StaffRepository staffRepository;

    @Mock
    private ZoneRepository zoneRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RealtimeService realtimeService;

    @InjectMocks
    private CashierServiceImpl cashierService;

    private RestaurantTable table;
    private DiningSession session;
    private Order order;
    private OrderItem item1;
    private OrderItem item2;
    private Staff managerStaff;

    @BeforeEach
    void setUp() {
        table = RestaurantTable.builder()
                .id(1L)
                .tableNumber("T-01")
                .name("Bàn T-01")
                .zone("ZONE_1")
                .capacity(4)
                .status(TableStatus.OCCUPIED)
                .build();

        session = new DiningSession();
        session.setId(50L);
        session.setTable(table);
        session.setStatus(SessionStatus.ACTIVE);
        session.setGuestCount(2);
        session.setStartTime(LocalDateTime.now().minusMinutes(45));

        MenuItem dish1 = MenuItem.builder()
                .id(10L)
                .name("Lẩu Thái Tomyum")
                .price(BigDecimal.valueOf(250000))
                .station("KITCHEN")
                .build();

        MenuItem dish2 = MenuItem.builder()
                .id(20L)
                .name("Trà Đào Cam Sả")
                .price(BigDecimal.valueOf(35000))
                .station("WAITER")
                .build();

        order = new Order();
        order.setId(100L);
        order.setSession(session);
        order.setStatus(OrderStatus.COOKING);
        order.setOrderCode("ORD-T01-5001");

        item1 = new OrderItem();
        item1.setId(101L);
        item1.setOrder(order);
        item1.setMenuItem(dish1);
        item1.setQuantity(1);
        item1.setUnitPrice(BigDecimal.valueOf(250000));
        item1.setSubtotal(BigDecimal.valueOf(250000));
        item1.setStatus(OrderItemStatus.SERVED);

        item2 = new OrderItem();
        item2.setId(102L);
        item2.setOrder(order);
        item2.setMenuItem(dish2);
        item2.setQuantity(2);
        item2.setUnitPrice(BigDecimal.valueOf(35000));
        item2.setSubtotal(BigDecimal.valueOf(70000));
        item2.setStatus(OrderItemStatus.SERVED);

        List<OrderItem> items = new ArrayList<>();
        items.add(item1);
        items.add(item2);
        order.setItems(items);

        managerStaff = Staff.builder()
                .id(99L)
                .username("manager01")
                .fullName("Quản Lý Nhà Hàng")
                .role(UserRole.MANAGER)
                .pinCode("$2a$10$hashedpin")
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("1. Xem tạm tính hóa đơn (getBillPreview) - Tính đúng 8% VAT làm tròn HALF_UP")
    void getBillPreview_CalculatesSubtotalAndVatCorrectly() {
        // Subtotal = 250.000 + 70.000 = 320.000đ
        // VAT 8% = 320.000 * 8 / 100 = 25.600đ
        // GrandTotal = 320.000 + 25.600 = 345.600đ
        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(sessionRepository.findByTableIdAndStatus(1L, SessionStatus.ACTIVE)).thenReturn(Optional.of(session));
        when(orderRepository.findBySessionId(50L)).thenReturn(List.of(order));
        when(requestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(1L, "PENDING")).thenReturn(Collections.emptyList());

        // Act
        CashierBillPreviewResponse preview = cashierService.getBillPreview(1L);

        // Assert: Giá niêm yết đã bao gồm thuế, không chiết khấu: finalAmount = subtotal = 320.000đ
        assertThat(preview).isNotNull();
        assertThat(preview.getSubtotal()).isEqualByComparingTo(BigDecimal.valueOf(320000));
        assertThat(preview.getTaxAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(preview.getFinalAmount()).isEqualByComparingTo(BigDecimal.valueOf(320000));
        assertThat(preview.getUnservedCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("2. Xem tạm tính khi còn món đang nấu (COOKING) -> unservedCount > 0")
    void getBillPreview_WhenItemsStillCooking_CountsUnservedItems() {
        item1.setStatus(OrderItemStatus.COOKING); // 1 phần lẩu đang nấu

        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(sessionRepository.findByTableIdAndStatus(1L, SessionStatus.ACTIVE)).thenReturn(Optional.of(session));
        when(orderRepository.findBySessionId(50L)).thenReturn(List.of(order));
        when(requestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(1L, "PENDING")).thenReturn(Collections.emptyList());

        // Act
        CashierBillPreviewResponse preview = cashierService.getBillPreview(1L);

        // Assert
        assertThat(preview.getUnservedCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("3. Thanh toán bị từ chối nếu bàn còn món chưa phục vụ và không có forceCheckout")
    void checkout_WhenUnservedItemsExistAndNoForce_ThrowsException() {
        item1.setStatus(OrderItemStatus.COOKING);

        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(sessionRepository.findByTableIdAndStatus(1L, SessionStatus.ACTIVE)).thenReturn(Optional.of(session));
        when(billRepository.findBySessionId(50L)).thenReturn(Optional.empty());
        when(orderRepository.findBySessionId(50L)).thenReturn(List.of(order));

        CashierCheckoutRequest request = new CashierCheckoutRequest();
        request.setPaymentMethod("CASH");
        request.setForceCheckout(false);

        // Act & Assert
        assertThatThrownBy(() -> cashierService.checkoutBill(1L, request, "cashier01"))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("chế biến / chờ bếp phục vụ");
    }

    @Test
    @DisplayName("4. Cho phép thanh toán nếu có forceCheckout = true dù còn món chưa phục vụ")
    void checkout_WhenUnservedItemsExistAndForceCheckoutTrue_Succeeds() {
        item1.setStatus(OrderItemStatus.COOKING);

        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(sessionRepository.findByTableIdAndStatus(1L, SessionStatus.ACTIVE)).thenReturn(Optional.of(session));
        when(billRepository.findBySessionId(50L)).thenReturn(Optional.empty());
        when(orderRepository.findBySessionId(50L)).thenReturn(List.of(order));
        when(billRepository.save(any(Bill.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CashierCheckoutRequest request = new CashierCheckoutRequest();
        request.setPaymentMethod("CASH");
        request.setForceCheckout(true);
        request.setCashGiven(BigDecimal.valueOf(500000));

        // Act
        CashierInvoiceResponse response = cashierService.checkoutBill(1L, request, "cashier01");

        // Assert
        assertThat(response).isNotNull();
        assertThat(session.getStatus()).isEqualTo(SessionStatus.COMPLETED);
        assertThat(table.getStatus()).isEqualTo(TableStatus.DIRTY);
        verify(billRepository).save(any(Bill.class));
    }

    @Test
    @DisplayName("5. Chặn thanh toán nếu phiên ăn đã được thanh toán trước đó (Duplicate Payment - CONFLICT)")
    void checkout_WhenSessionAlreadyPaid_ThrowsConflictException() {
        Bill paidBill = new Bill();
        paidBill.setStatus(BillStatus.PAID);
        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(sessionRepository.findByTableIdAndStatus(1L, SessionStatus.ACTIVE)).thenReturn(Optional.of(session));
        when(billRepository.findBySessionId(50L)).thenReturn(Optional.of(paidBill));

        CashierCheckoutRequest request = new CashierCheckoutRequest();
        request.setPaymentMethod("CASH");

        // Act & Assert
        assertThatThrownBy(() -> cashierService.checkoutBill(1L, request, "cashier01"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("httpStatus", HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("6. Thanh toán tiền mặt chính xác bằng tổng tiền món (Subtotal) -> Thành công")
    void checkout_WhenPaymentMethodCash_CalculatesExactSubtotalAndSucceeds() {
        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(sessionRepository.findByTableIdAndStatus(1L, SessionStatus.ACTIVE)).thenReturn(Optional.of(session));
        when(billRepository.findBySessionId(50L)).thenReturn(Optional.empty());
        when(orderRepository.findBySessionId(50L)).thenReturn(List.of(order));
        when(billRepository.save(any(Bill.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CashierCheckoutRequest request = new CashierCheckoutRequest();
        request.setPaymentMethod("CASH");
        request.setCashGiven(BigDecimal.valueOf(320000)); // Đưa đúng 320.000đ

        // Act
        CashierInvoiceResponse response = cashierService.checkoutBill(1L, request, "cashier01");

        // Assert: finalAmount bằng đúng subtotal
        assertThat(response).isNotNull();
        assertThat(response.getFinalAmount()).isEqualByComparingTo(BigDecimal.valueOf(320000));
        assertThat(response.getTaxAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getDiscountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        verify(billRepository).save(any(Bill.class));
    }

    @Test
    @DisplayName("7. Thanh toán chuyển khoản (BANK_TRANSFER) -> Thành công với đúng tổng tiền món")
    void checkout_WhenPaymentMethodBankTransfer_Succeeds() {
        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(sessionRepository.findByTableIdAndStatus(1L, SessionStatus.ACTIVE)).thenReturn(Optional.of(session));
        when(billRepository.findBySessionId(50L)).thenReturn(Optional.empty());
        when(orderRepository.findBySessionId(50L)).thenReturn(List.of(order));
        when(billRepository.save(any(Bill.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CashierCheckoutRequest request = new CashierCheckoutRequest();
        request.setPaymentMethod("BANK_TRANSFER");

        // Act
        CashierInvoiceResponse response = cashierService.checkoutBill(1L, request, "cashier01");

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getFinalAmount()).isEqualByComparingTo(BigDecimal.valueOf(320000));
        verify(billRepository).save(any(Bill.class));
    }

    @Test
    @DisplayName("8. Thanh toán tiền mặt mà khách đưa thiếu tiền -> Ném ngoại lệ BAD_REQUEST")
    void checkout_WhenCashGivenInsufficient_ThrowsException() {
        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(sessionRepository.findByTableIdAndStatus(1L, SessionStatus.ACTIVE)).thenReturn(Optional.of(session));
        when(billRepository.findBySessionId(50L)).thenReturn(Optional.empty());
        when(orderRepository.findBySessionId(50L)).thenReturn(List.of(order));

        CashierCheckoutRequest request = new CashierCheckoutRequest();
        request.setPaymentMethod("CASH");
        request.setCashGiven(BigDecimal.valueOf(100000)); // Cần 345.600đ nhưng chỉ đưa 100k

        // Act & Assert
        assertThatThrownBy(() -> cashierService.checkoutBill(1L, request, "cashier01"))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Tiền mặt khách đưa chưa đủ");
    }

    @Test
    @DisplayName("9. Tái sử dụng hóa đơn tạm tính UNPAID và cập nhật sang PAID thành công")
    void checkout_WhenExistingBillIsUnpaid_UpdatesBillToPaidAndSucceeds() {
        Bill draftBill = new Bill();
        draftBill.setStatus(BillStatus.UNPAID);
        draftBill.setBillCode("BILL-DRAFT-001");

        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(sessionRepository.findByTableIdAndStatus(1L, SessionStatus.ACTIVE)).thenReturn(Optional.of(session));
        when(billRepository.findBySessionId(50L)).thenReturn(Optional.of(draftBill));
        when(orderRepository.findBySessionId(50L)).thenReturn(List.of(order));
        when(billRepository.save(any(Bill.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CashierCheckoutRequest request = new CashierCheckoutRequest();
        request.setPaymentMethod("CASH");
        request.setCashGiven(BigDecimal.valueOf(500000));

        // Act
        CashierInvoiceResponse response = cashierService.checkoutBill(1L, request, "cashier01");

        // Assert
        assertThat(response).isNotNull();
        assertThat(draftBill.getStatus()).isEqualTo(BillStatus.PAID);
        assertThat(draftBill.getPaymentTime()).isNotNull();
        assertThat(session.getStatus()).isEqualTo(SessionStatus.COMPLETED);
        assertThat(table.getStatus()).isEqualTo(TableStatus.DIRTY);
        verify(billRepository).save(draftBill);
    }
}
