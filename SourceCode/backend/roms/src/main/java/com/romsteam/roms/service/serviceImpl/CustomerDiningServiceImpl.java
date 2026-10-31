package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.CustomerCallServiceRequest;
import com.romsteam.roms.dto.request.CustomerOrderItemRequest;
import com.romsteam.roms.dto.request.CustomerPlaceOrderRequest;
import com.romsteam.roms.dto.response.*;
import com.romsteam.roms.entity.*;
import com.romsteam.roms.entity.enums.OrderItemStatus;
import com.romsteam.roms.entity.enums.OrderStatus;
import com.romsteam.roms.entity.enums.SessionStatus;
import com.romsteam.roms.entity.enums.TableStatus;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.exception.ResourceNotFoundException;
import com.romsteam.roms.repository.*;
import com.romsteam.roms.service.CustomerDiningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import com.romsteam.roms.service.RealtimeService;
import lombok.extern.slf4j.Slf4j;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerDiningServiceImpl implements CustomerDiningService {

    private final RestaurantTableRepository tableRepository;
    private final DiningSessionRepository sessionRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;
    private final ServiceRequestRepository requestRepository;
    private final RealtimeService realtimeService;
    private final org.springframework.cache.CacheManager cacheManager;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    @Override
    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(value = "customerMenu", key = "'active_catalog'")
    public List<CustomerMenuResponse> getCustomerMenu() {
        List<Category> categories = categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        List<MenuItem> allActiveItems = menuItemRepository.findByIsActiveTrueOrderByDisplayOrderAsc();

        // Map danh mục sang kết quả
        Map<Long, List<CustomerMenuItemResponse>> itemsByCategory = new LinkedHashMap<>();
        for (Category cat : categories) {
            itemsByCategory.put(cat.getId(), new ArrayList<>());
        }

        for (MenuItem item : allActiveItems) {
            if (item.getCategory() == null) continue;
            Long catId = item.getCategory().getId();
            List<CustomerMenuItemResponse> list = itemsByCategory.computeIfAbsent(catId, k -> new ArrayList<>());

            String prepTime = "10-15 phút";
            if ("WAITER".equalsIgnoreCase(item.getStation())) {
                prepTime = "3-5 phút";
            } else if (item.getCategory().getName() != null && 
                      (item.getCategory().getName().toLowerCase().contains("uống") || 
                       item.getCategory().getName().toLowerCase().contains("nước") ||
                       item.getCategory().getName().toLowerCase().contains("khai vị"))) {
                prepTime = "5-7 phút";
            }

            list.add(CustomerMenuItemResponse.builder()
                    .id(item.getId())
                    .categoryId(catId)
                    .categoryName(item.getCategory().getName())
                    .sku(item.getSku())
                    .name(item.getName())
                    .description(item.getDescription())
                    .price(item.getPrice())
                    .station(item.getStation())
                    .tag(item.getTag())
                    .imageUrl(item.getImageUrl())
                    .isAvailable(Boolean.TRUE.equals(item.getIsAvailable()))
                    .remainingStock(item.getRemainingStock())
                    .prepTime(prepTime)
                    .build());
        }

        List<CustomerMenuResponse> responseList = new ArrayList<>();
        for (Category cat : categories) {
            List<CustomerMenuItemResponse> items = itemsByCategory.getOrDefault(cat.getId(), Collections.emptyList());
            responseList.add(CustomerMenuResponse.builder()
                    .categoryId(cat.getId())
                    .categoryName(cat.getName())
                    .displayOrder(cat.getDisplayOrder())
                    .items(items)
                    .build());
        }

        return responseList;
    }

    @Override
    @Transactional
    public CustomerOrderTrackingResponse placeOrder(CustomerPlaceOrderRequest request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new AppException("Vui lòng chọn ít nhất 1 món ăn để đặt hàng!", HttpStatus.BAD_REQUEST);
        }

        RestaurantTable table = resolveTable(request.getTableId(), request.getTableNumber());

        // 1. Kiểm tra hoặc khởi tạo phiên ăn DiningSession
        Optional<DiningSession> activeSessionOpt = sessionRepository.findByTableIdAndStatus(table.getId(), SessionStatus.ACTIVE);
        DiningSession activeSession;

        if (activeSessionOpt.isPresent()) {
            activeSession = activeSessionOpt.get();
            // Nếu trước đó bàn từng gửi in tạm tính, xóa cờ tạm tính để Thu ngân biết có món mới
            if (activeSession.getNote() != null && activeSession.getNote().contains("[DRAFT_PRINTED]")) {
                String cleaned = activeSession.getNote().replace("[DRAFT_PRINTED]", "").trim();
                activeSession.setNote(cleaned.isEmpty() ? null : cleaned);
                sessionRepository.save(activeSession);
            }
        } else {
            // Tự động mở phiên ăn cho bàn
            String sessionToken = "sess-" + table.getTableNumber().toLowerCase() + "-" + UUID.randomUUID().toString().substring(0, 8);
            activeSession = new DiningSession();
            activeSession.setTable(table);
            activeSession.setSessionToken(sessionToken);
            activeSession.setStatus(SessionStatus.ACTIVE);
            activeSession.setGuestCount(request.getGuestCount() != null && request.getGuestCount() > 0 
                    ? request.getGuestCount() 
                    : (table.getCapacity() != null ? table.getCapacity() : 2));
            activeSession.setStartTime(LocalDateTime.now());
            activeSession.setNote(request.getOrderNote());
            activeSession = sessionRepository.save(activeSession);

            table.setStatus(TableStatus.OCCUPIED);
            tableRepository.save(table);
        }

        // 2. Tạo phiếu gọi món Order
        String orderCode = "ORD-" + table.getTableNumber() + "-" + (System.currentTimeMillis() % 100000) + "-" + (100 + new java.util.Random().nextInt(900));
        Order newOrder = new Order();
        newOrder.setSession(activeSession);
        newOrder.setStaff(null); // Thực khách tự gọi qua mã QR
        newOrder.setOrderCode(orderCode);
        newOrder.setOrderTime(LocalDateTime.now());
        newOrder.setStatus(OrderStatus.SUBMITTED);
        newOrder.setNote(request.getOrderNote());

        BigDecimal totalOrderAmount = BigDecimal.ZERO;
        boolean hasCookingItems = false;

        for (CustomerOrderItemRequest itemReq : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Món ăn không tồn tại với ID: " + itemReq.getMenuItemId()));

            if (!Boolean.TRUE.equals(menuItem.getIsAvailable())) {
                throw new AppException("Món '" + menuItem.getName() + "' hiện đã tạm hết hàng (86'd)!", HttpStatus.BAD_REQUEST);
            }

            int qty = (itemReq.getQuantity() != null && itemReq.getQuantity() > 0) ? itemReq.getQuantity() : 1;
            if (menuItem.getRemainingStock() != null && menuItem.getRemainingStock() < qty) {
                throw new AppException("Món '" + menuItem.getName() + "' chỉ còn lại " + menuItem.getRemainingStock() + " phần! Vui lòng chọn lại số lượng.", HttpStatus.BAD_REQUEST);
            }

            // Trừ tồn kho trong ngày
            menuItem.decreaseStock(qty);
            menuItemRepository.save(menuItem);
            if (!Boolean.TRUE.equals(menuItem.getIsAvailable())) {
                try {
                    realtimeService.notifyMenuItemAvailability(menuItem.getId(), menuItem.getName(), false, menuItem.getRemainingStock());
                } catch (Exception ignored) {}
                if (cacheManager != null && cacheManager.getCache("customerMenu") != null) {
                    cacheManager.getCache("customerMenu").clear();
                }
            }

            BigDecimal unitPrice = menuItem.getPrice() != null ? menuItem.getPrice() : BigDecimal.ZERO;
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(qty));
            totalOrderAmount = totalOrderAmount.add(subtotal);

            // Nhận diện đồ uống đóng chai / lấy tại tủ mát phục vụ:
            boolean isDrink = "WAITER".equalsIgnoreCase(menuItem.getStation()) ||
                    (menuItem.getCategory() != null && menuItem.getCategory().getName() != null &&
                    (menuItem.getCategory().getName().toLowerCase().contains("uống") ||
                     menuItem.getCategory().getName().toLowerCase().contains("nước")));

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(newOrder);
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(qty);
            orderItem.setUnitPrice(unitPrice);
            orderItem.setSubtotal(subtotal);
            orderItem.setNote(itemReq.getNote());

            // Đồ uống đóng chai: Sẵn sàng ngay (READY) tại Quầy Pass để bồi bàn lấy ra bàn
            // Món nấu: Chờ tiếp nhận (PENDING) để Bếp KDS tiếp nhận và nấu
            if (isDrink) {
                orderItem.setStatus(OrderItemStatus.READY);
            } else {
                orderItem.setStatus(OrderItemStatus.PENDING);
                hasCookingItems = true;
            }

            newOrder.addOrderItem(orderItem);
        }

        newOrder.setStatus(hasCookingItems ? OrderStatus.SUBMITTED : OrderStatus.READY);
        newOrder.setTotalAmount(totalOrderAmount);
        orderRepository.save(newOrder);

        // Bắn sự kiện realtime STOMP tới Bếp KDS và Sơ đồ sảnh
        try {
            realtimeService.notifyKitchenOrder(newOrder.getId(), table.getTableNumber(), "ORDER_NEW", newOrder.getId());
            realtimeService.notifyTableUpdate(table.getId(), table.getTableNumber(), table.getStatus() != null ? table.getStatus().name() : "OCCUPIED", "Đơn gọi món mới từ khách");
        } catch (Exception e) {
            // Không làm gián đoạn transaction nếu WebSocket có trục trặc
        }

        // 3. Trả về thông tin trạng thái bàn và đĩa món cập nhật
        return getOrderTracking(table.getId(), table.getTableNumber());
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerOrderTrackingResponse getOrderTracking(Long tableId, String tableNumber) {
        RestaurantTable table = resolveTable(tableId, tableNumber);

        Optional<DiningSession> sessionOpt = sessionRepository.findByTableIdAndStatus(table.getId(), SessionStatus.ACTIVE);
        if (sessionOpt.isEmpty()) {
            return CustomerOrderTrackingResponse.builder()
                    .tableId(table.getId())
                    .tableNumber(table.getTableNumber())
                    .tableName(table.getName())
                    .tableStatus(table.getStatus() != null ? table.getStatus().name() : "AVAILABLE")
                    .hasActiveSession(false)
                    .totalAmount(BigDecimal.ZERO)
                    .vatAmount(BigDecimal.ZERO)
                    .grandTotal(BigDecimal.ZERO)
                    .totalItems(0)
                    .servedItems(0)
                    .cookingItems(0)
                    .readyItems(0)
                    .pendingItems(0)
                    .batches(Collections.emptyList())
                    .build();
        }

        DiningSession session = sessionOpt.get();
        List<Order> orders = orderRepository.findBySessionId(session.getId());
        // Sắp xếp đơn gọi món theo thời gian tăng dần
        orders.sort(Comparator.comparing(Order::getOrderTime, Comparator.nullsLast(Comparator.naturalOrder())));

        List<CustomerBatchResponse> batches = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        int totalItems = 0;
        int servedItems = 0;
        int cookingItems = 0;
        int readyItems = 0;
        int pendingItems = 0;

        for (Order o : orders) {
            if (o.getStatus() == OrderStatus.CANCELLED) continue;

            List<CustomerItemTrackingResponse> itemTrackings = new ArrayList<>();
            BigDecimal batchTotal = BigDecimal.ZERO;

            if (o.getItems() != null) {
                for (OrderItem item : o.getItems()) {
                    if (item.getStatus() == OrderItemStatus.CANCELLED) continue;

                    int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                    totalItems += qty;
                    BigDecimal subtotal = item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO;
                    batchTotal = batchTotal.add(subtotal);
                    totalAmount = totalAmount.add(subtotal);

                    switch (item.getStatus()) {
                        case PENDING:
                            pendingItems += qty;
                            break;
                        case COOKING:
                            cookingItems += qty;
                            break;
                        case READY:
                            readyItems += qty;
                            break;
                        case SERVED:
                            servedItems += qty;
                            break;
                        default:
                            break;
                    }

                    String statusText = getStatusText(item.getStatus());
                    String prepTime = "WAITER".equalsIgnoreCase(item.getMenuItem().getStation()) ? "3-5 phút" : "10-15 phút";

                    itemTrackings.add(CustomerItemTrackingResponse.builder()
                            .orderItemId(item.getId())
                            .menuItemId(item.getMenuItem() != null ? item.getMenuItem().getId() : null)
                            .name(item.getMenuItem() != null ? item.getMenuItem().getName() : "Món ăn")
                            .imageUrl(item.getMenuItem() != null ? item.getMenuItem().getImageUrl() : null)
                            .price(item.getUnitPrice())
                            .quantity(item.getQuantity())
                            .subtotal(subtotal)
                            .note(item.getNote())
                            .status(item.getStatus().name())
                            .statusText(statusText)
                            .prepTime(prepTime)
                            .station(item.getMenuItem() != null ? item.getMenuItem().getStation() : "KITCHEN")
                            .build());
                }
            }

            batches.add(CustomerBatchResponse.builder()
                    .orderId(o.getId())
                    .orderCode(o.getOrderCode())
                    .orderTime(o.getOrderTime())
                    .orderTimeFormatted(o.getOrderTime() != null ? o.getOrderTime().format(TIME_FMT) : "")
                    .status(o.getStatus().name())
                    .note(o.getNote())
                    .totalAmount(batchTotal)
                    .items(itemTrackings)
                    .build());
        }

        BigDecimal vatAmount = totalAmount.multiply(BigDecimal.valueOf(8)).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        BigDecimal grandTotal = totalAmount.add(vatAmount);

        return CustomerOrderTrackingResponse.builder()
                .tableId(table.getId())
                .tableNumber(table.getTableNumber())
                .tableName(table.getName())
                .sessionId(session.getId())
                .sessionToken(session.getSessionToken())
                .tableStatus(table.getStatus() != null ? table.getStatus().name() : "OCCUPIED")
                .guestCount(session.getGuestCount())
                .startTime(session.getStartTime())
                .startTimeFormatted(session.getStartTime() != null ? session.getStartTime().format(TIME_FMT) : "")
                .hasActiveSession(true)
                .totalAmount(totalAmount)
                .vatAmount(vatAmount)
                .grandTotal(grandTotal)
                .totalItems(totalItems)
                .servedItems(servedItems)
                .cookingItems(cookingItems)
                .readyItems(readyItems)
                .pendingItems(pendingItems)
                .batches(batches)
                .build();
    }

    @Override
    @Transactional
    public Map<String, Object> callWaiter(CustomerCallServiceRequest request) {
        if (request == null) {
            throw new AppException("Yêu cầu không hợp lệ!", HttpStatus.BAD_REQUEST);
        }

        RestaurantTable table = resolveTable(request.getTableId(), request.getTableNumber());
        Optional<DiningSession> sessionOpt = sessionRepository.findByTableIdAndStatus(table.getId(), SessionStatus.ACTIVE);
        DiningSession session = sessionOpt.orElse(null);

        String type = (request.getRequestType() != null && !request.getRequestType().trim().isEmpty())
                ? request.getRequestType().trim().toUpperCase()
                : "CALL_WAITER";

        // Kiểm tra tránh spam chuông cùng loại đang PENDING
        List<ServiceRequest> pendingRequests = requestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(table.getId(), "PENDING");
        boolean alreadyPending = pendingRequests.stream().anyMatch(r -> type.equalsIgnoreCase(r.getRequestType()));

        Map<String, Object> result = new HashMap<>();
        if (alreadyPending) {
            result.put("success", true);
            result.put("alreadySent", true);
            result.put("message", "Yêu cầu của bạn đã được gửi trước đó và nhân viên đang trên đường đến bàn!");
            return result;
        }

        String note = (request.getNote() != null && !request.getNote().trim().isEmpty())
                ? request.getNote().trim()
                : getDefaultServiceNote(type);

        ServiceRequest newReq = ServiceRequest.builder()
                .table(table)
                .session(session)
                .requestType(type)
                .note(note)
                .status("PENDING")
                .build();

        requestRepository.save(newReq);

        // Bắn sự kiện chuông gọi phục vụ qua WebSocket STOMP
        try {
            realtimeService.notifyServiceRequest(newReq.getId(), table.getId(), table.getTableNumber(), type, note);
        } catch (Exception e) {
            log.warn("[Realtime Service] Không thể phát chuông phục vụ bàn {}: {}", table.getTableNumber(), e.getMessage());
        }

        result.put("success", true);
        result.put("alreadySent", false);
        result.put("requestId", newReq.getId());
        result.put("requestType", type);
        result.put("message", "Đã gửi yêu cầu tới nhân viên phục vụ thành công!");
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> requestPayment(Long tableId, String tableNumber, String paymentMethod) {
        RestaurantTable table = resolveTable(tableId, tableNumber);
        DiningSession session = sessionRepository.findByTableIdAndStatus(table.getId(), SessionStatus.ACTIVE)
                .orElseThrow(() -> new AppException("Bàn hiện chưa có phiên ăn đang hoạt động!", HttpStatus.BAD_REQUEST));

        List<Order> orders = orderRepository.findBySessionId(session.getId());
        boolean hasItems = orders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .anyMatch(o -> o.getItems() != null && o.getItems().stream().anyMatch(i -> i.getStatus() != OrderItemStatus.CANCELLED));

        if (!hasItems) {
            throw new AppException("Bàn chưa có món ăn nào trong thực đơn, không thể yêu cầu tính tiền!", HttpStatus.BAD_REQUEST);
        }

        // Tạo yêu cầu BILL nếu chưa có
        List<ServiceRequest> pendingList = requestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(table.getId(), "PENDING");
        boolean billPending = pendingList.stream().anyMatch(r -> "BILL".equalsIgnoreCase(r.getRequestType()));

        Map<String, Object> result = new HashMap<>();
        if (!billPending) {
            String note = "Khách yêu cầu tính tiền" + (paymentMethod != null ? " (" + paymentMethod + ")" : "");
            ServiceRequest billReq = ServiceRequest.builder()
                    .table(table)
                    .session(session)
                    .requestType("BILL")
                    .note(note)
                    .status("PENDING")
                    .build();
            requestRepository.save(billReq);

            // Bắn sự kiện yêu cầu thanh toán qua WebSocket STOMP tới POS và Phục vụ
            try {
                realtimeService.notifyServiceRequest(billReq.getId(), table.getId(), table.getTableNumber(), "BILL", note);
                realtimeService.notifyPaymentUpdate(null, table.getId(), table.getTableNumber(), "PAYMENT_REQUEST", null);
            } catch (Exception e) {
                log.warn("[Realtime Service] Không thể phát yêu cầu thanh toán bàn {}: {}", table.getTableNumber(), e.getMessage());
            }
        }

        result.put("success", true);
        result.put("message", "Đã gửi thông báo tính tiền đến quầy Thu ngân POS. Thu ngân sẽ mang hóa đơn đến bàn cho quý khách!");
        return result;
    }

    // ===================================================================
    // HELPER METHODS
    // ===================================================================

    private RestaurantTable resolveTable(Long tableId, String tableNumber) {
        // 1. CHỐNG GIẢ MẠO SỐ BÀN (ANTI-SPOOFING):
        // Nếu request gửi từ Thực khách có Dining Token (ROLE_CUSTOMER), bắt buộc ép sử dụng tableId từ Token!
        org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities() != null &&
                auth.getAuthorities().stream().anyMatch(a -> "ROLE_CUSTOMER".equals(a.getAuthority()))) {
            if (auth.getDetails() instanceof Map) {
                Map<?, ?> details = (Map<?, ?>) auth.getDetails();
                Object tIdObj = details.get("tableId");
                if (tIdObj instanceof Number) {
                    Long tokenTableId = ((Number) tIdObj).longValue();
                    return tableRepository.findById(tokenTableId)
                            .orElseThrow(() -> new ResourceNotFoundException("Bàn ăn theo Token không tồn tại với ID: " + tokenTableId));
                }
            }
        }

        // 2. Trường hợp Nhân viên gọi hộ hoặc fallback
        if (tableId != null) {
            Optional<RestaurantTable> opt = tableRepository.findById(tableId);
            if (opt.isPresent()) return opt.get();
        }

        if (tableNumber != null && !tableNumber.trim().isEmpty()) {
            String cleanNum = tableNumber.trim();
            Optional<RestaurantTable> opt = tableRepository.findByTableNumber(cleanNum);
            if (opt.isPresent()) return opt.get();

            // Chuẩn hóa loại bỏ tiền tố chữ như "BÀN", "Bàn", "BAN"
            String normalized = cleanNum.toUpperCase()
                    .replace("BÀN", "")
                    .replace("BAN", "")
                    .replace("B\u00C0N", "")
                    .trim();

            if (!normalized.isEmpty()) {
                Optional<RestaurantTable> optNorm = tableRepository.findByTableNumber(normalized);
                if (optNorm.isPresent()) return optNorm.get();

                Optional<RestaurantTable> optT = tableRepository.findByTableNumber("T-" + normalized);
                if (optT.isPresent()) return optT.get();

                if (normalized.matches("^\\d+$")) {
                    String padded = String.format("%02d", Integer.parseInt(normalized));
                    Optional<RestaurantTable> optPadded = tableRepository.findByTableNumber("T-" + padded);
                    if (optPadded.isPresent()) return optPadded.get();

                    Optional<RestaurantTable> optBPadded = tableRepository.findByTableNumber("B-" + padded);
                    if (optBPadded.isPresent()) return optBPadded.get();
                }
            }

            // Thử thêm tiền tố "T-" hoặc bỏ "T-"
            if (!cleanNum.toUpperCase().startsWith("T-")) {
                Optional<RestaurantTable> opt2 = tableRepository.findByTableNumber("T-" + cleanNum);
                if (opt2.isPresent()) return opt2.get();
            } else {
                Optional<RestaurantTable> opt3 = tableRepository.findByTableNumber(cleanNum.substring(2));
                if (opt3.isPresent()) return opt3.get();
            }

            // Tìm kiếm tương đối
            List<RestaurantTable> searchResults = tableRepository.searchTables(cleanNum);
            if (!searchResults.isEmpty()) {
                return searchResults.get(0);
            }
        }

        throw new ResourceNotFoundException("Không tìm thấy bàn ăn với thông tin: ID=" + tableId + ", Mã=" + tableNumber);
    }

    private String getStatusText(OrderItemStatus status) {
        if (status == null) return "Chờ xử lý";
        switch (status) {
            case PENDING:
                return "Chờ nhận đơn";
            case COOKING:
                return "Đang nấu";
            case READY:
                return "Đã nấu xong - Chờ bưng";
            case SERVED:
                return "Đã phục vụ";
            case CANCELLED:
                return "Đã hủy";
            default:
                return status.name();
        }
    }

    private String getDefaultServiceNote(String type) {
        switch (type) {
            case "CALL_WAITER":
                return "Thực khách bấm chuông gọi nhân viên hỗ trợ";
            case "CALL_WATER":
                return "Thực khách yêu cầu thêm nước / đá lạnh";
            case "REQUEST_CLEAN":
                return "Thực khách yêu cầu lau bàn / dọn đĩa trống";
            case "REQUEST_BILL":
                return "Thực khách yêu cầu mang hóa đơn tính tiền";
            default:
                return "Yêu cầu phục vụ từ bàn ăn";
        }
    }
}
