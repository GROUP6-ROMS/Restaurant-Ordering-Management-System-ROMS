package com.romsteam.roms.concurrency;

import com.romsteam.roms.dto.request.CustomerOrderItemRequest;
import com.romsteam.roms.dto.request.CustomerPlaceOrderRequest;
import com.romsteam.roms.dto.response.CustomerOrderTrackingResponse;
import com.romsteam.roms.entity.*;
import com.romsteam.roms.entity.enums.OrderStatus;
import com.romsteam.roms.entity.enums.SessionStatus;
import com.romsteam.roms.entity.enums.TableStatus;
import com.romsteam.roms.repository.*;
import com.romsteam.roms.service.CustomerDiningService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
@DisplayName("Concurrency & Conflict Scenarios - Kiểm thử Kịch bản Tranh chấp Thực tế SWP391")
class OrderConcurrencyTest {

    @Autowired
    private CustomerDiningService customerDiningService;

    @Autowired
    private RestaurantTableRepository tableRepository;

    @Autowired
    private DiningSessionRepository sessionRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private com.romsteam.roms.service.CashierService cashierService;

    @Autowired
    private com.romsteam.roms.service.serviceImpl.PayOsServiceImpl payOsService;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private RestaurantTable table;
    private DiningSession session;
    private MenuItem itemGoiCuon;
    private MenuItem itemBunCha;

    @BeforeEach
    void setUp() {
        Category category = Category.builder()
                .name("Món Khai Vị")
                .displayOrder(1)
                .build();
        category = categoryRepository.save(category);

        itemGoiCuon = MenuItem.builder()
                .name("Gỏi Cuốn Tôm Thịt")
                .sku("APP-01")
                .category(category)
                .price(BigDecimal.valueOf(50000))
                .isAvailable(true)
                .isActive(true)
                .station("KITCHEN")
                .dailyStock(10)
                .remainingStock(10)
                .build();
        itemGoiCuon = menuItemRepository.save(itemGoiCuon);

        itemBunCha = MenuItem.builder()
                .name("Bún Chả Hà Nội")
                .sku("MAIN-01")
                .category(category)
                .price(BigDecimal.valueOf(80000))
                .isAvailable(true)
                .isActive(true)
                .station("KITCHEN")
                .dailyStock(10)
                .remainingStock(10)
                .build();
        itemBunCha = menuItemRepository.save(itemBunCha);

        table = RestaurantTable.builder()
                .tableNumber("T-09")
                .name("Bàn T-09")
                .zone("ZONE_1")
                .capacity(4)
                .status(TableStatus.OCCUPIED)
                .qrToken("qr-t09-test-token")
                .isActive(true)
                .build();
        table = tableRepository.save(table);

        session = new DiningSession();
        session.setTable(table);
        session.setSessionToken("sess-t09-" + UUID.randomUUID().toString().substring(0, 8));
        session.setStatus(SessionStatus.ACTIVE);
        session.setGuestCount(2);
        session.setStartTime(LocalDateTime.now());
        session = sessionRepository.save(session);
    }

    @Test
    @DisplayName("Conflict Scenario 1: Hai thực khách tại cùng 1 bàn quét QR và bấm 'Đặt món' đồng thời")
    void testConcurrentOrderPlacement_TwoGuestsSameTable() throws Exception {
        int numberOfThreads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(numberOfThreads);

        // Khách A đặt 2 phần Gỏi Cuốn (100.000đ)
        CustomerPlaceOrderRequest requestGuestA = new CustomerPlaceOrderRequest();
        requestGuestA.setTableId(table.getId());
        requestGuestA.setTableNumber(table.getTableNumber());
        requestGuestA.setOrderNote("Khách A đặt");
        CustomerOrderItemRequest itemReqA = new CustomerOrderItemRequest();
        itemReqA.setMenuItemId(itemGoiCuon.getId());
        itemReqA.setQuantity(2);
        requestGuestA.setItems(List.of(itemReqA));

        // Khách B đặt 1 phần Bún Chả (80.000đ)
        CustomerPlaceOrderRequest requestGuestB = new CustomerPlaceOrderRequest();
        requestGuestB.setTableId(table.getId());
        requestGuestB.setTableNumber(table.getTableNumber());
        requestGuestB.setOrderNote("Khách B đặt");
        CustomerOrderItemRequest itemReqB = new CustomerOrderItemRequest();
        itemReqB.setMenuItemId(itemBunCha.getId());
        itemReqB.setQuantity(1);
        requestGuestB.setItems(List.of(itemReqB));

        Future<CustomerOrderTrackingResponse>[] results = new Future[2];

        results[0] = executor.submit(() -> {
            try {
                startLatch.await(); // Đợi hiệu lệnh xuất phát đồng thời
                return customerDiningService.placeOrder(requestGuestA);
            } finally {
                finishLatch.countDown();
            }
        });

        results[1] = executor.submit(() -> {
            try {
                startLatch.await(); // Đợi hiệu lệnh xuất phát đồng thời
                return customerDiningService.placeOrder(requestGuestB);
            } finally {
                finishLatch.countDown();
            }
        });

        // Bắn phát súng bắt đầu đồng thời
        startLatch.countDown();
        boolean completedInTime = finishLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Assert: Cả 2 request đều hoàn thành trong thời gian cho phép
        assertThat(completedInTime).isTrue();

        CustomerOrderTrackingResponse respA = results[0].get();
        CustomerOrderTrackingResponse respB = results[1].get();

        assertThat(respA).isNotNull();
        assertThat(respB).isNotNull();

        // 1. Cả 2 đơn phải thuộc CÙNG 1 DiningSession
        assertThat(respA.getSessionId()).isEqualTo(session.getId());
        assertThat(respB.getSessionId()).isEqualTo(session.getId());

        // 2. Kiểm tra dữ liệu trong CSDL: Phải có đúng 2 Order thuộc session này
        List<Order> savedOrders = orderRepository.findBySessionId(session.getId());
        assertThat(savedOrders).hasSize(2);
        assertThat(savedOrders).allMatch(o -> o.getStatus() == OrderStatus.SUBMITTED);

        // 3. Tồn kho trong ngày được khấu trừ chính xác (không bị mất mát hay ghi đè)
        MenuItem updatedGoiCuon = menuItemRepository.findById(itemGoiCuon.getId()).orElseThrow();
        MenuItem updatedBunCha = menuItemRepository.findById(itemBunCha.getId()).orElseThrow();
        assertThat(updatedGoiCuon.getRemainingStock()).isEqualTo(8); // 10 - 2 = 8
        assertThat(updatedBunCha.getRemainingStock()).isEqualTo(9);  // 10 - 1 = 9

        // 4. Theo dõi đơn bàn ăn: Tổng tiền 2 đợt gọi = 100k + 80k = 180.000đ
        CustomerOrderTrackingResponse tracking = customerDiningService.getOrderTracking(table.getId(), table.getTableNumber());
        assertThat(tracking.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(180000));
        assertThat(tracking.getBatches()).hasSize(2);
    }

    @Test
    @DisplayName("Conflict Scenario 2: Khóa Lạc Quan (@Version) trên DiningSession - Chống xung đột ghi đè đồng thời")
    void testOptimisticLocking_OnDiningSession() {
        // Lấy bản ghi DiningSession phiên bản v0
        Long sessionId = session.getId();
        DiningSession sessionThread1 = sessionRepository.findById(sessionId).orElseThrow();
        DiningSession sessionThread2 = sessionRepository.findById(sessionId).orElseThrow();

        // Thread 1 cập nhật ghi chú trước và commit thành công (version tăng từ 0 lên 1)
        transactionTemplate.execute(status -> {
            sessionThread1.setNote("Thread 1: Yêu cầu thêm bát đũa");
            return sessionRepository.saveAndFlush(sessionThread1);
        });

        // Thread 2 (vẫn giữ bản snapshot version = 0) cố gắng ghi đè dữ liệu
        // Hibernate phát hiện xung đột version và ném ObjectOptimisticLockingFailureException
        assertThatThrownBy(() -> {
            transactionTemplate.execute(status -> {
                sessionThread2.setNote("Thread 2: Yêu cầu thêm đá lạnh");
                return sessionRepository.saveAndFlush(sessionThread2);
            });
        }).isInstanceOf(ObjectOptimisticLockingFailureException.class);

        // Assert: Dữ liệu của Thread 1 được bảo toàn nguyên vẹn
        DiningSession finalSession = sessionRepository.findById(sessionId).orElseThrow();
        assertThat(finalSession.getNote()).isEqualTo("Thread 1: Yêu cầu thêm bát đũa");
    }

    @Test
    @DisplayName("Conflict Scenario 3 (Issue #29): 5 thực khách cùng tranh chấp đặt 1 món ăn duy nhất chỉ còn lại đúng 1 suất (Pessimistic Locking)")
    void testPessimisticLocking_StockExhaustion() throws Exception {
        // Chuẩn bị món ăn chỉ còn đúng 1 phần tồn kho trong ngày
        itemGoiCuon.setRemainingStock(1);
        itemGoiCuon = menuItemRepository.save(itemGoiCuon);

        int numberOfThreads = 5;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(numberOfThreads);

        java.util.concurrent.atomic.AtomicInteger successCount = new java.util.concurrent.atomic.AtomicInteger(0);
        java.util.concurrent.atomic.AtomicInteger failureCount = new java.util.concurrent.atomic.AtomicInteger(0);

        for (int i = 0; i < numberOfThreads; i++) {
            final int guestIdx = i;
            executor.submit(() -> {
                try {
                    startLatch.await(); // Đợi xuất phát đồng thời
                    CustomerPlaceOrderRequest req = new CustomerPlaceOrderRequest();
                    req.setTableId(table.getId());
                    req.setTableNumber(table.getTableNumber());
                    req.setOrderNote("Khách " + guestIdx + " tranh đặt món cuối cùng");

                    CustomerOrderItemRequest itemReq = new CustomerOrderItemRequest();
                    itemReq.setMenuItemId(itemGoiCuon.getId());
                    itemReq.setQuantity(1);
                    req.setItems(List.of(itemReq));

                    customerDiningService.placeOrder(req);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        finishLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Assert: Do có Pessimistic Lock, chỉ DUY NHẤT 1 request thành công, 4 request còn lại bị từ chối
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(failureCount.get()).isEqualTo(4);

        // Tồn kho cuối cùng phải về đúng 0 và tự động chuyển sang hết hàng (isAvailable = false)
        MenuItem finalItem = menuItemRepository.findById(itemGoiCuon.getId()).orElseThrow();
        assertThat(finalItem.getRemainingStock()).isEqualTo(0);
        assertThat(finalItem.getIsAvailable()).isFalse();
    }

    @Test
    @DisplayName("Conflict Scenario 4 (Issue #31): Xung đột đồng thời giữa Thu ngân POS Checkout và Webhook PayOS")
    void testConcurrentCheckout_PosAndPayOsWebhook() throws Exception {
        // 1. Tạo 1 đơn hàng đã phục vụ xong (SERVED) cho bàn
        CustomerPlaceOrderRequest orderReq = new CustomerPlaceOrderRequest();
        orderReq.setTableId(table.getId());
        orderReq.setTableNumber(table.getTableNumber());
        CustomerOrderItemRequest itemReq = new CustomerOrderItemRequest();
        itemReq.setMenuItemId(itemGoiCuon.getId());
        itemReq.setQuantity(2);
        orderReq.setItems(List.of(itemReq));
        customerDiningService.placeOrder(orderReq);

        // Đánh dấu OrderItem là SERVED để cho phép thanh toán
        transactionTemplate.execute(status -> {
            List<Order> orders = orderRepository.findBySessionId(session.getId());
            for (Order o : orders) {
                for (OrderItem i : o.getItems()) {
                    i.setStatus(com.romsteam.roms.entity.enums.OrderItemStatus.SERVED);
                }
                orderRepository.save(o);
            }
            return null;
        });

        // Tạo hóa đơn PayOS chờ thanh toán
        Bill bill = new Bill();
        bill.setSession(session);
        bill.setBillCode("HD-TEST-" + System.currentTimeMillis());
        bill.setPayosOrderCode(888999L);
        bill.setSubtotal(BigDecimal.valueOf(100000));
        bill.setFinalAmount(BigDecimal.valueOf(100000));
        bill.setStatus(com.romsteam.roms.entity.enums.BillStatus.UNPAID);
        final Bill savedBill = billRepository.save(bill);

        int numberOfThreads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(numberOfThreads);

        java.util.concurrent.atomic.AtomicInteger successCount = new java.util.concurrent.atomic.AtomicInteger(0);
        java.util.concurrent.atomic.AtomicInteger conflictCount = new java.util.concurrent.atomic.AtomicInteger(0);

        // Thread 1: Thu ngân POS bấm thanh toán tiền mặt (CASH)
        executor.submit(() -> {
            try {
                startLatch.await();
                com.romsteam.roms.dto.request.CashierCheckoutRequest checkoutReq = new com.romsteam.roms.dto.request.CashierCheckoutRequest();
                checkoutReq.setPaymentMethod("CASH");
                checkoutReq.setCashGiven(BigDecimal.valueOf(500000));
                checkoutReq.setForceCheckout(true);
                cashierService.checkoutBill(table.getId(), checkoutReq, null);
                successCount.incrementAndGet();
            } catch (Exception e) {
                conflictCount.incrementAndGet();
            } finally {
                finishLatch.countDown();
            }
        });

        // Thread 2: Webhook PayOS bắn về xác nhận thanh toán chuyển khoản thành công
        executor.submit(() -> {
            try {
                startLatch.await();
                payOsService.finalizePaidBill(savedBill, "PAYOS_WEBHOOK");
                successCount.incrementAndGet();
            } catch (Exception e) {
                conflictCount.incrementAndGet();
            } finally {
                finishLatch.countDown();
            }
        });

        startLatch.countDown();
        finishLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Assert: Phiên ăn COMPLETED, bàn DIRTY, không bị corrupt hay crash
        DiningSession finalSession = sessionRepository.findById(session.getId()).orElseThrow();
        assertThat(finalSession.getStatus()).isEqualTo(SessionStatus.COMPLETED);

        RestaurantTable finalTable = tableRepository.findById(table.getId()).orElseThrow();
        assertThat(finalTable.getStatus()).isEqualTo(TableStatus.DIRTY);

        List<Bill> finalBills = billRepository.findByStatusAndPaymentTimeBetween(
                com.romsteam.roms.entity.enums.BillStatus.PAID,
                LocalDateTime.now().minusMinutes(5),
                LocalDateTime.now().plusMinutes(5)
        );
        assertThat(finalBills).isNotEmpty();
    }
}
