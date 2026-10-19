package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.CloseEmptySessionRequest;
import com.romsteam.roms.dto.request.MergeTableRequest;
import com.romsteam.roms.dto.request.OpenTableRequest;
import com.romsteam.roms.dto.request.TransferTableRequest;
import com.romsteam.roms.dto.request.WaiterAddOrderRequest;
import com.romsteam.roms.dto.response.WaiterMenuItemResponse;
import com.romsteam.roms.dto.response.WaiterTableResponse;
import com.romsteam.roms.entity.*;
import com.romsteam.roms.entity.enums.OrderItemStatus;
import com.romsteam.roms.entity.enums.OrderStatus;
import com.romsteam.roms.entity.enums.SessionStatus;
import com.romsteam.roms.entity.enums.TableStatus;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.exception.ResourceNotFoundException;
import com.romsteam.roms.repository.*;
import com.romsteam.roms.service.WaiterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class WaiterServiceImpl implements WaiterService {

    private final RestaurantTableRepository tableRepository;
    private final DiningSessionRepository sessionRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ServiceRequestRepository requestRepository;
    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;
    private final ZoneRepository zoneRepository;
    private final ReservationRepository reservationRepository;
    private final ReservationItemRepository reservationItemRepository;
    private final com.romsteam.roms.service.RealtimeService realtimeService;

    @Override
    @Transactional(readOnly = true)
    public List<WaiterTableResponse> getFloorPlan(String zone) {
        List<RestaurantTable> tableList = (zone != null && !zone.equalsIgnoreCase("ALL"))
                ? tableRepository.findByZoneAndIsActiveTrue(zone)
                : tableRepository.findByIsActiveTrueOrderByTableNumberAsc();

        List<WaiterTableResponse> responseList = new ArrayList<>();

        for (RestaurantTable table : tableList) {
            responseList.add(mapToWaiterTableResponse(table));
        }

        return responseList;
    }

    @Override
    @Transactional
    public WaiterTableResponse openTableSession(Long tableId, OpenTableRequest request) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại: " + tableId));

        if (table.getStatus() != TableStatus.AVAILABLE && table.getStatus() != TableStatus.RESERVED) {
            throw new AppException("Chỉ có thể mở phiên cho bàn đang Trống hoặc bàn Đặt Trước!", HttpStatus.BAD_REQUEST);
        }

        // 1. Kiểm tra đơn đặt bàn trước (nếu có)
        Reservation matchedReservation = null;
        List<Reservation> confirmed = reservationRepository.findByTableIdAndStatusOrderByReservationTimeAsc(tableId, com.romsteam.roms.entity.enums.ReservationStatus.CONFIRMED);
        if (!confirmed.isEmpty()) {
            matchedReservation = confirmed.get(0);
        } else {
            List<Reservation> pending = reservationRepository.findByTableIdAndStatusOrderByReservationTimeAsc(tableId, com.romsteam.roms.entity.enums.ReservationStatus.PENDING);
            if (!pending.isEmpty()) {
                matchedReservation = pending.get(0);
            }
        }

        String sessionNote = request != null && request.getNote() != null ? request.getNote() : null;
        if (matchedReservation != null) {
            sessionNote = "Khách đặt trước: " + matchedReservation.getCustomerName() + " (" + matchedReservation.getBookingCode() + ")";
            matchedReservation.setStatus(com.romsteam.roms.entity.enums.ReservationStatus.COMPLETED);
            reservationRepository.save(matchedReservation);
        } else if (table.getStatus() == TableStatus.RESERVED) {
            if (sessionNote == null && table.getReservationInfo() != null) {
                sessionNote = "Khách đặt trước: " + table.getReservationInfo();
            }
        }
        table.setReservationInfo(null);
        table.setReservedTime(null);
        table.setBlockedReason(null);

        // 2. Tạo phiên ăn mới nếu chưa có phiên active
        Optional<DiningSession> activeSessionOpt = sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE);
        DiningSession session;
        if (activeSessionOpt.isPresent()) {
            session = activeSessionOpt.get();
        } else {
            String sessionToken = "sess-" + table.getTableNumber().toLowerCase() + "-" + UUID.randomUUID().toString().substring(0, 8);
            session = new DiningSession();
            session.setTable(table);
            session.setSessionToken(sessionToken);
            session.setStatus(SessionStatus.ACTIVE);
            int guests = (request != null && request.getGuestCount() != null && request.getGuestCount() > 0)
                    ? request.getGuestCount()
                    : (matchedReservation != null && matchedReservation.getGuestCount() != null ? matchedReservation.getGuestCount() : table.getCapacity());
            session.setGuestCount(guests);
            session.setStartTime(LocalDateTime.now());
            session.setNote(sessionNote);
            session = sessionRepository.save(session);
        }

        // 3. Tự động nạp toàn bộ món đặt trước vào Order đẩy xuống Bếp KDS và Phục vụ
        if (matchedReservation != null) {
            List<ReservationItem> preOrderItems = reservationItemRepository.findByReservationIdWithMenuItem(matchedReservation.getId());
            if (preOrderItems != null && !preOrderItems.isEmpty()) {
                Order newOrder = new Order();
                newOrder.setSession(session);
                String dateStr = java.time.LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
                String orderCode = "ORD-PRE-" + dateStr + "-" + (1000 + new Random().nextInt(9000));
                newOrder.setOrderCode(orderCode);
                newOrder.setOrderTime(LocalDateTime.now());
                newOrder.setNote("Món đặt trước - Đơn #" + matchedReservation.getBookingCode());

                List<OrderItem> orderItems = new ArrayList<>();
                BigDecimal totalAmount = BigDecimal.ZERO;
                boolean hasCookingItems = false;

                for (ReservationItem resItem : preOrderItems) {
                    if (resItem.getQuantity() == null || resItem.getQuantity() <= 0) continue;
                    MenuItem menuItem = resItem.getMenuItem();
                    if (menuItem == null) continue;

                    OrderItem orderItem = new OrderItem();
                    orderItem.setOrder(newOrder);
                    orderItem.setMenuItem(menuItem);
                    orderItem.setQuantity(resItem.getQuantity());
                    orderItem.setUnitPrice(resItem.getUnitPrice() != null ? resItem.getUnitPrice() : menuItem.getPrice());
                    BigDecimal subtotal = orderItem.getUnitPrice().multiply(BigDecimal.valueOf(orderItem.getQuantity()));
                    orderItem.setSubtotal(subtotal);
                    orderItem.setNote(resItem.getNote() != null ? resItem.getNote() : "Món đặt trước");

                    boolean isDrink = false;
                    if (menuItem.getCategory() != null && menuItem.getCategory().getName() != null) {
                        String catLower = menuItem.getCategory().getName().toLowerCase();
                        if (catLower.contains("uống") || catLower.contains("drink") || catLower.contains("nước")) {
                            isDrink = true;
                        }
                    }

                    if (isDrink) {
                        orderItem.setStatus(OrderItemStatus.READY);
                    } else {
                        orderItem.setStatus(OrderItemStatus.COOKING);
                        hasCookingItems = true;
                    }

                    orderItems.add(orderItem);
                    totalAmount = totalAmount.add(subtotal);
                }

                if (!orderItems.isEmpty()) {
                    newOrder.setStatus(hasCookingItems ? OrderStatus.CONFIRMED : OrderStatus.READY);
                    newOrder.setTotalAmount(totalAmount);
                    newOrder.setItems(orderItems);
                    orderRepository.save(newOrder);
                    orderItemRepository.saveAll(orderItems);
                }
            }
        }

        // 4. Đổi trạng thái bàn thành OCCUPIED
        table.setStatus(TableStatus.OCCUPIED);
        tableRepository.save(table);

        try {
            realtimeService.notifyTableUpdate(table.getId(), table.getTableNumber(), TableStatus.OCCUPIED.name(), "Mở bàn đón khách");
        } catch (Exception e) {
            log.warn("[Realtime] Lỗi broadcast openTableSession bàn {}: {}", table.getTableNumber(), e.getMessage());
        }

        return mapToWaiterTableResponse(table);
    }

    @Override
    @Transactional
    public WaiterTableResponse completeCleaning(Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại: " + tableId));

        table.setStatus(TableStatus.AVAILABLE);
        tableRepository.save(table);

        // Đóng dứt điểm phiên ăn cũ nếu vẫn còn sót để tránh rò rỉ sang lượt khách sau
        Optional<DiningSession> activeSessionOpt = sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE);
        if (activeSessionOpt.isPresent()) {
            DiningSession session = activeSessionOpt.get();
            session.setStatus(SessionStatus.COMPLETED);
            session.setEndTime(LocalDateTime.now());
            sessionRepository.save(session);
        }

        try {
            realtimeService.notifyTableUpdate(table.getId(), table.getTableNumber(), TableStatus.AVAILABLE.name(), "Đã dọn sạch bàn");
        } catch (Exception e) {
            log.warn("[Realtime] Lỗi broadcast completeCleaning bàn {}: {}", table.getTableNumber(), e.getMessage());
        }

        return mapToWaiterTableResponse(table);
    }

    @Override
    @Transactional
    public void transferTable(TransferTableRequest request) {
        RestaurantTable sourceTable = tableRepository.findById(request.getSourceTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Bàn nguồn không tồn tại: " + request.getSourceTableId()));
        RestaurantTable targetTable = tableRepository.findById(request.getTargetTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Bàn đích không tồn tại: " + request.getTargetTableId()));

        if (targetTable.getStatus() != TableStatus.AVAILABLE) {
            throw new AppException("Bàn đích phải là bàn Trống (AVAILABLE) mới có thể chuyển đến!", HttpStatus.BAD_REQUEST);
        }

        Optional<DiningSession> activeSessionOpt = sessionRepository.findByTableIdAndStatus(sourceTable.getId(), SessionStatus.ACTIVE);
        if (activeSessionOpt.isEmpty()) {
            throw new AppException("Bàn nguồn hiện không có phiên ăn đang hoạt động!", HttpStatus.BAD_REQUEST);
        }

        // Chuyển phiên ăn sang bàn mới và gắn tag chuyển bàn
        DiningSession session = activeSessionOpt.get();
        String transferTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
        String transferNote = String.format("[CHUYỂN TỪ %s SANG %s lúc %s]", 
                sourceTable.getTableNumber(), targetTable.getTableNumber(), transferTime);
        String currentNote = session.getNote() != null ? session.getNote() : "";
        session.setNote(currentNote.isEmpty() ? transferNote : currentNote + " " + transferNote);
        session.setTable(targetTable);
        sessionRepository.save(session);

        // Chuyển toàn bộ chuông gọi / yêu cầu thanh toán PENDING từ bàn nguồn sang bàn đích
        List<ServiceRequest> pendingRequests = requestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(sourceTable.getId(), "PENDING");
        for (ServiceRequest req : pendingRequests) {
            req.setTable(targetTable);
            requestRepository.save(req);
        }

        // Bàn cũ chuyển thành DIRTY (cần dọn)
        sourceTable.setStatus(TableStatus.DIRTY);
        tableRepository.save(sourceTable);

        // Bàn mới chuyển thành OCCUPIED
        targetTable.setStatus(TableStatus.OCCUPIED);
        tableRepository.save(targetTable);

        try {
            realtimeService.notifyTableUpdate(sourceTable.getId(), sourceTable.getTableNumber(), TableStatus.DIRTY.name(), "Chuyển bàn sang " + targetTable.getTableNumber());
            realtimeService.notifyTableUpdate(targetTable.getId(), targetTable.getTableNumber(), TableStatus.OCCUPIED.name(), "Nhận bàn chuyển từ " + sourceTable.getTableNumber());
        } catch (Exception e) {
            log.warn("[Realtime] Lỗi broadcast transferTable: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public void mergeTables(MergeTableRequest request) {
        if (request.getSourceTableId().equals(request.getTargetTableId())) {
            throw new AppException("Không thể gộp một bàn vào chính nó!", HttpStatus.BAD_REQUEST);
        }

        RestaurantTable sourceTable = tableRepository.findById(request.getSourceTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Bàn nguồn không tồn tại: " + request.getSourceTableId()));
        RestaurantTable targetTable = tableRepository.findById(request.getTargetTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Bàn đích không tồn tại: " + request.getTargetTableId()));

        if (sourceTable.getStatus() != TableStatus.OCCUPIED) {
            throw new AppException("Bàn nguồn (" + sourceTable.getTableNumber() + ") không có khách đang ngồi!", HttpStatus.BAD_REQUEST);
        }
        if (targetTable.getStatus() != TableStatus.OCCUPIED) {
            throw new AppException("Bàn đích (" + targetTable.getTableNumber() + ") không có khách đang ngồi!", HttpStatus.BAD_REQUEST);
        }

        DiningSession sourceSession = sessionRepository.findByTableIdAndStatus(sourceTable.getId(), SessionStatus.ACTIVE)
                .orElseThrow(() -> new AppException("Bàn nguồn không có phiên ăn đang hoạt động!", HttpStatus.BAD_REQUEST));
        DiningSession targetSession = sessionRepository.findByTableIdAndStatus(targetTable.getId(), SessionStatus.ACTIVE)
                .orElseThrow(() -> new AppException("Bàn đích không có phiên ăn đang hoạt động!", HttpStatus.BAD_REQUEST));

        String mergeTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
        String reasonStr = (request.getReason() != null && !request.getReason().trim().isEmpty())
                ? " (Lý do: " + request.getReason().trim() + ")" : "";

        // 1. Chuyển các Order từ source sang target
        List<Order> sourceOrders = orderRepository.findBySessionId(sourceSession.getId());
        if (sourceOrders != null && !sourceOrders.isEmpty()) {
            for (Order order : sourceOrders) {
                order.setSession(targetSession);
                String existingNote = order.getNote() != null ? order.getNote() : "";
                String mergeTag = "[Gộp từ " + sourceTable.getTableNumber() + "]";
                order.setNote(existingNote.isEmpty() ? mergeTag : existingNote + " " + mergeTag);
                orderRepository.save(order);
            }
        }

        // 2. Gộp số lượng khách
        int sourceGuests = sourceSession.getGuestCount() != null ? sourceSession.getGuestCount() : 0;
        int targetGuests = targetSession.getGuestCount() != null ? targetSession.getGuestCount() : 0;
        targetSession.setGuestCount(targetGuests + sourceGuests);

        // 3. Ghi chú targetSession
        String mergeNote = String.format("[GỘP TỪ %s lúc %s%s]", sourceTable.getTableNumber(), mergeTime, reasonStr);
        String targetNote = targetSession.getNote() != null ? targetSession.getNote() : "";
        targetSession.setNote(targetNote.isEmpty() ? mergeNote : targetNote + " | " + mergeNote);
        sessionRepository.save(targetSession);

        // 4. Kết thúc sourceSession
        String sourceCloseNote = String.format("[ĐÃ GỘP VÀO BÀN %s lúc %s]", targetTable.getTableNumber(), mergeTime);
        String sNote = sourceSession.getNote() != null ? sourceSession.getNote() : "";
        sourceSession.setNote(sNote.isEmpty() ? sourceCloseNote : sNote + " | " + sourceCloseNote);
        sourceSession.setStatus(SessionStatus.COMPLETED);
        sourceSession.setEndTime(LocalDateTime.now());
        sessionRepository.save(sourceSession);

        // 5. Chuyển ServiceRequest
        List<ServiceRequest> pendingRequests = requestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(sourceTable.getId(), "PENDING");
        if (pendingRequests != null) {
            for (ServiceRequest req : pendingRequests) {
                req.setTable(targetTable);
                req.setNote((req.getNote() != null ? req.getNote() + " " : "") + "[Gộp từ " + sourceTable.getTableNumber() + "]");
                requestRepository.save(req);
            }
        }

        // 6. Cập nhật trạng thái bàn
        boolean markDirty = request.getMarkSourceDirty() == null || request.getMarkSourceDirty();
        sourceTable.setStatus(markDirty ? TableStatus.DIRTY : TableStatus.AVAILABLE);
        tableRepository.save(sourceTable);

        targetTable.setStatus(TableStatus.OCCUPIED);
        tableRepository.save(targetTable);

        try {
            realtimeService.notifyTableUpdate(sourceTable.getId(), sourceTable.getTableNumber(), sourceTable.getStatus().name(), "Đã gộp vào " + targetTable.getTableNumber());
            realtimeService.notifyTableUpdate(targetTable.getId(), targetTable.getTableNumber(), TableStatus.OCCUPIED.name(), "Đã gộp từ " + sourceTable.getTableNumber());
        } catch (Exception e) {
            log.warn("[Realtime] Lỗi broadcast mergeTables: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public WaiterTableResponse confirmDeliverSingleItem(Long tableId, Long orderItemId) {
        OrderItem item = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với ID: " + orderItemId));

        if (item.getStatus() != OrderItemStatus.READY) {
            throw new AppException("Chỉ có thể xác nhận bưng món khi Bếp/Quầy đã chuẩn bị xong (READY)!", HttpStatus.BAD_REQUEST);
        }

        item.setStatus(OrderItemStatus.SERVED);
        orderItemRepository.save(item);

        Order order = item.getOrder();
        if (order != null && order.getItems() != null) {
            boolean allServed = order.getItems().stream()
                    .allMatch(i -> i.getStatus() == OrderItemStatus.SERVED || i.getStatus() == OrderItemStatus.CANCELLED);
            if (allServed) {
                order.setStatus(OrderStatus.SERVED);
                orderRepository.save(order);
            }
        }

        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại: " + tableId));

        try {
            realtimeService.notifyOrderStatus(order != null ? order.getId() : null, tableId, table.getTableNumber(), OrderItemStatus.SERVED.name(), Map.of("itemId", orderItemId));
            realtimeService.notifyTableUpdate(table.getId(), table.getTableNumber(), table.getStatus().name(), "Đã bưng món lên bàn");
        } catch (Exception e) {
            log.warn("[Realtime] Lỗi broadcast confirmDeliverSingleItem bàn {}: {}", table.getTableNumber(), e.getMessage());
        }

        return mapToWaiterTableResponse(table);
    }

    @Override
    @Transactional
    public WaiterTableResponse confirmDeliverFood(Long tableId) {
        Optional<DiningSession> sessionOpt = sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE);
        if (sessionOpt.isPresent()) {
            List<Order> orders = orderRepository.findBySessionId(sessionOpt.get().getId());
            for (Order order : orders) {
                if (order.getItems() != null) {
                    boolean hasUpdated = false;
                    for (OrderItem item : order.getItems()) {
                        if (item.getStatus() == OrderItemStatus.READY) {
                            item.setStatus(OrderItemStatus.SERVED);
                            orderItemRepository.save(item);
                            hasUpdated = true;
                        }
                    }
                    if (hasUpdated) {
                        boolean allServed = order.getItems().stream()
                                .allMatch(i -> i.getStatus() == OrderItemStatus.SERVED || i.getStatus() == OrderItemStatus.CANCELLED);
                        if (allServed) {
                            order.setStatus(OrderStatus.SERVED);
                            orderRepository.save(order);
                        }
                    }
                }
            }
        }

        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại"));

        try {
            realtimeService.notifyOrderStatus(null, tableId, table.getTableNumber(), OrderItemStatus.SERVED.name(), "Đã bưng toàn bộ món");
            realtimeService.notifyTableUpdate(table.getId(), table.getTableNumber(), table.getStatus().name(), "Đã bưng toàn bộ món lên bàn");
        } catch (Exception e) {
            log.warn("[Realtime] Lỗi broadcast confirmDeliverFood bàn {}: {}", table.getTableNumber(), e.getMessage());
        }

        return mapToWaiterTableResponse(table);
    }

    @Override
    @Transactional
    public void resolveServiceRequest(Long requestId) {
        ServiceRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu chuông gọi không tồn tại: " + requestId));
        req.setStatus("RESOLVED");
        requestRepository.save(req);

        try {
            realtimeService.notifyServiceRequest(req.getId(), req.getTable() != null ? req.getTable().getId() : null,
                    req.getTable() != null ? req.getTable().getTableNumber() : "N/A", req.getRequestType(), "RESOLVED");
        } catch (Exception e) {
            log.warn("[Realtime] Lỗi broadcast resolveServiceRequest: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public WaiterTableResponse requestPayment(Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại: " + tableId));

        if (table.getStatus() != TableStatus.OCCUPIED) {
            throw new AppException("Chỉ có thể yêu cầu thanh toán cho bàn đang có khách dùng bữa (OCCUPIED)!", HttpStatus.BAD_REQUEST);
        }

        Optional<DiningSession> activeSessionOpt = sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE);
        if (activeSessionOpt.isEmpty()) {
            throw new AppException("Bàn không có phiên ăn đang hoạt động!", HttpStatus.BAD_REQUEST);
        }

        DiningSession activeSession = activeSessionOpt.get();
        List<Order> orders = orderRepository.findBySessionId(activeSession.getId());
        boolean hasItems = orders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .anyMatch(o -> o.getItems() != null && o.getItems().stream().anyMatch(i -> i.getStatus() != OrderItemStatus.CANCELLED));

        if (!hasItems) {
            throw new AppException("Bàn chưa gọi món ăn nào (0đ), không thể gửi yêu cầu tính tiền sang Thu ngân! Vui lòng đóng bàn nếu khách không dùng món.", HttpStatus.BAD_REQUEST);
        }

        // Kiểm tra xem đã có ServiceRequest loại BILL đang PENDING cho bàn này chưa (tránh lặp chuông / spam)
        List<ServiceRequest> existingPendingBills = requestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(table.getId(), "PENDING");
        boolean alreadyPending = existingPendingBills.stream().anyMatch(r -> "BILL".equalsIgnoreCase(r.getRequestType()));

        if (!alreadyPending) {
            // Tạo ServiceRequest loại BILL để thông báo chuông cho Thu ngân POS
            ServiceRequest billReq = ServiceRequest.builder()
                    .table(table)
                    .session(activeSession)
                    .requestType("BILL")
                    .note("Khách yêu cầu tính tiền & in hóa đơn POS")
                    .status("PENDING")
                    .build();
            requestRepository.save(billReq);
        }

        try {
            realtimeService.notifyPaymentUpdate(null, table.getId(), table.getTableNumber(), "PAYMENT_REQUEST", Map.of("tableId", table.getId(), "tableNumber", table.getTableNumber()));
            realtimeService.notifyTableUpdate(table.getId(), table.getTableNumber(), "AWAITING_PAYMENT", "Yêu cầu thanh toán");
        } catch (Exception e) {
            log.warn("[Realtime] Lỗi broadcast requestPayment bàn {}: {}", table.getTableNumber(), e.getMessage());
        }

        return mapToWaiterTableResponse(table);
    }

    @Override
    @Transactional
    public WaiterTableResponse addOrderToTable(Long tableId, WaiterAddOrderRequest request) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn ăn không tồn tại với ID: " + tableId));

        DiningSession activeSession = sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE)
                .orElseThrow(() -> new AppException("Bàn " + table.getTableNumber() + " chưa được mở phiên phục vụ (chưa có khách)! Vui lòng Mở Bàn trước khi gọi món.", HttpStatus.BAD_REQUEST));

        // Nếu bàn trước đó đã in tạm tính, việc gọi thêm món sẽ hủy tag [DRAFT_PRINTED] để Thu ngân in lại bill mới chính xác
        if (activeSession.getNote() != null && activeSession.getNote().contains("[DRAFT_PRINTED]")) {
            String cleaned = activeSession.getNote().replace("[DRAFT_PRINTED]", "").trim();
            activeSession.setNote(cleaned.isEmpty() ? null : cleaned);
            sessionRepository.save(activeSession);
        }

        String orderCode = "ORD-" + table.getTableNumber() + "-" + (System.currentTimeMillis() % 10000);
        Order newOrder = new Order();
        newOrder.setSession(activeSession);
        newOrder.setOrderCode(orderCode);
        newOrder.setOrderTime(LocalDateTime.now());
        newOrder.setNote(request.getNote());

        BigDecimal totalOrderAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();
        boolean hasCookingItems = false;

        for (WaiterAddOrderRequest.WaiterOrderItemRequest itemReq : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Món ăn không tồn tại với ID: " + itemReq.getMenuItemId()));

            if (!menuItem.getIsAvailable()) {
                throw new AppException("Món '" + menuItem.getName() + "' hiện đã tạm hết hàng!", HttpStatus.BAD_REQUEST);
            }

            int qty = itemReq.getQuantity() != null && itemReq.getQuantity() > 0 ? itemReq.getQuantity() : 1;
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
            }

            BigDecimal unitPrice = menuItem.getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(qty));
            totalOrderAmount = totalOrderAmount.add(subtotal);

            // Nhận diện đồ uống đóng chai / pha chế sẵn:
            boolean isDrink = false;
            if (menuItem.getCategory() != null && menuItem.getCategory().getName() != null) {
                String catLower = menuItem.getCategory().getName().toLowerCase();
                if (catLower.contains("uống") || catLower.contains("drink") || catLower.contains("nước")) {
                    isDrink = true;
                }
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(newOrder);
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(qty);
            orderItem.setUnitPrice(unitPrice);
            orderItem.setSubtotal(subtotal);
            orderItem.setNote(itemReq.getNote());

            // Đồ uống đóng chai: Sẵn sàng ngay (READY) tại tủ mát/quầy pass để bồi bàn lấy ra bàn
            // Món ăn xào nấu: Chuyển COOKING vào Bếp KDS
            if (isDrink) {
                orderItem.setStatus(OrderItemStatus.READY);
            } else {
                orderItem.setStatus(OrderItemStatus.COOKING);
                hasCookingItems = true;
            }

            orderItems.add(orderItem);
        }

        newOrder.setStatus(hasCookingItems ? OrderStatus.CONFIRMED : OrderStatus.READY);
        newOrder.setTotalAmount(totalOrderAmount);
        newOrder.setItems(orderItems);

        orderRepository.save(newOrder);

        if (table.getStatus() != TableStatus.OCCUPIED) {
            table.setStatus(TableStatus.OCCUPIED);
            tableRepository.save(table);
        }

        try {
            realtimeService.notifyKitchenOrder(newOrder.getId(), table.getTableNumber(), "ORDER_NEW", Map.of("orderId", newOrder.getId(), "itemsCount", newOrder.getItems().size()));
            realtimeService.notifyTableUpdate(table.getId(), table.getTableNumber(), table.getStatus().name(), "Đã gọi thêm món");
        } catch (Exception e) {
            log.warn("[Realtime] Lỗi broadcast addOrderToTable bàn {}: {}", table.getTableNumber(), e.getMessage());
        }

        return mapToWaiterTableResponse(table);
    }

    // Helper map entity sang WaiterTableResponse
    private WaiterTableResponse mapToWaiterTableResponse(RestaurantTable table) {
        String zoneName = zoneRepository.findByZoneCode(table.getZone())
                .map(Zone::getName)
                .orElseGet(() -> switch (table.getZone()) {
                    case "ZONE_1" -> "Tầng 1 - Sảnh Chính";
                    case "ZONE_2" -> "Tầng 2 - Ban Công";
                    case "VIP" -> "Phòng VIP";
                    default -> table.getZone();
                });

        Integer actualGuests = 0;
        BigDecimal orderTotal = BigDecimal.ZERO;
        String durationStr = null;
        Long durationMin = 0L;
        List<WaiterTableResponse.WaiterOrderItemDTO> itemList = new ArrayList<>();
        int readyCount = 0, cookingCount = 0, servedCount = 0;

        // Lấy phiên ăn ACTIVE
        Optional<DiningSession> sessionOpt = sessionRepository.findByTableIdAndStatus(table.getId(), SessionStatus.ACTIVE);
        if (sessionOpt.isPresent()) {
            DiningSession session = sessionOpt.get();
            actualGuests = session.getGuestCount() != null ? session.getGuestCount() : table.getCapacity();

            if (session.getStartTime() != null) {
                durationMin = Duration.between(session.getStartTime(), LocalDateTime.now()).toMinutes();
                durationStr = durationMin + " phút";
            }

            List<Order> orders = orderRepository.findBySessionId(session.getId());
            for (Order order : orders) {
                if (order.getStatus() == OrderStatus.CANCELLED) continue;
                if (order.getItems() != null) {
                    for (OrderItem item : order.getItems()) {
                        BigDecimal subtotal = item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO;
                        if (item.getStatus() != OrderItemStatus.CANCELLED) {
                            orderTotal = orderTotal.add(subtotal);
                        }

                        if (item.getStatus() == OrderItemStatus.READY) readyCount += item.getQuantity();
                        else if (item.getStatus() == OrderItemStatus.COOKING) cookingCount += item.getQuantity();
                        else if (item.getStatus() == OrderItemStatus.SERVED) servedCount += item.getQuantity();

                        itemList.add(WaiterTableResponse.WaiterOrderItemDTO.builder()
                                .orderItemId(item.getId())
                                .name(item.getMenuItem() != null ? item.getMenuItem().getName() : "Món ăn")
                                .quantity(item.getQuantity())
                                .unitPrice(item.getUnitPrice())
                                .subtotal(subtotal)
                                .status(item.getStatus() != null ? item.getStatus().name() : "PENDING")
                                .note(item.getNote())
                                .build());
                    }
                }
            }
        }

        // Kiểm tra chuông gọi PENDING
        List<ServiceRequest> pendingCalls = requestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(table.getId(), "PENDING");
        boolean isCalling = !pendingCalls.isEmpty();
        String callNote = isCalling ? pendingCalls.get(0).getNote() : null;
        Long reqId = isCalling ? pendingCalls.get(0).getId() : null;
        boolean isBillRequest = pendingCalls.stream().anyMatch(r -> "BILL".equalsIgnoreCase(r.getRequestType()));

        // Xác định trạng thái nghiệp vụ cho Waiter
        String waiterStatus = table.getStatus().name();
        String statusNote = "";

        if (table.getStatus() == TableStatus.AVAILABLE) {
            statusNote = "Bàn sạch sẽ, sẵn sàng đón khách.";
        } else if (table.getStatus() == TableStatus.DIRTY) {
            statusNote = "Khách đã thanh toán rời đi. Cần thu dọn đĩa.";
        } else if (table.getStatus() == TableStatus.RESERVED) {
            statusNote = "Khách đặt hẹn lúc: " + (table.getReservedTime() != null ? table.getReservedTime() : "Hôm nay");
        } else if (isBillRequest) {
            waiterStatus = "AWAITING_PAYMENT";
            statusNote = "Đã báo Thu ngân - Chờ in phiếu tạm tính & quẹt thẻ POS";
        } else if (isCalling) {
            waiterStatus = "CALLING";
            statusNote = callNote != null ? callNote : "Khách yêu cầu hỗ trợ tại bàn";
        } else if (readyCount > 0) {
            waiterStatus = "FOOD_READY";
            statusNote = "Bếp KDS đã nấu xong món. Chờ bưng ra bàn!";
        } else if (table.getStatus() == TableStatus.OCCUPIED) {
            statusNote = cookingCount > 0 ? "Đang ăn & chờ bếp ra thêm món" : "Đang dùng bữa";
        }

        return WaiterTableResponse.builder()
                .id(table.getId())
                .tableNumber(table.getTableNumber())
                .name(table.getName())
                .zone(table.getZone())
                .zoneName(zoneName)
                .capacity(table.getCapacity())
                .actualGuests(actualGuests)
                .status(waiterStatus)
                .statusNote(statusNote)
                .duration(durationStr)
                .durationMinutes(durationMin)
                .orderTotal(orderTotal)
                .reservationInfo(table.getReservationInfo())
                .reservedTime(table.getReservedTime())
                .blockedReason(table.getBlockedReason())
                .qrToken(table.getQrToken())
                .calling(isCalling)
                .callNote(callNote)
                .callTime("Vừa gọi")
                .activeRequestId(reqId)
                .totalItems(itemList.size())
                .readyItems(readyCount)
                .cookingItems(cookingCount)
                .servedItems(servedCount)
                .items(itemList)
                .build();
    }

    @Override
    @Transactional
    public List<WaiterMenuItemResponse> getMenuCatalog() {
        if (menuItemRepository.count() == 0) {
            seedDefaultMenuData();
        }

        List<MenuItem> items = menuItemRepository.findByIsAvailableTrueAndIsActiveTrue();
        List<WaiterMenuItemResponse> result = new ArrayList<>();
        for (MenuItem item : items) {
            String catName = item.getCategory() != null ? item.getCategory().getName() : "Món ăn";
            result.add(WaiterMenuItemResponse.builder()
                    .id(item.getId())
                    .name(item.getName())
                    .description(item.getDescription())
                    .price(item.getPrice())
                    .imageUrl(item.getImageUrl())
                    .category(catName)
                    .categoryId(item.getCategory() != null ? item.getCategory().getId() : null)
                    .isAvailable(item.getIsAvailable())
                    .remainingStock(item.getRemainingStock())
                    .build());
        }
        return result;
    }

    private void seedDefaultMenuData() {
        Category catAppetizer = getOrCreateCategory("Khai Vị & Ăn Vặt", "Món khai vị và ăn vặt thanh đạm kích thích vị giác", 1);
        Category catMain = getOrCreateCategory("Món Chính & Cơm Mì", "Món chính chuẩn vị thơm ngon đậm đà", 2);
        Category catHotpot = getOrCreateCategory("Lẩu & Nướng", "Các món lẩu và nướng hấp dẫn cho gia đình và bạn bè", 3);
        Category catDrink = getOrCreateCategory("Đồ Uống & Tráng Miệng", "Nước giải khát, trà hoa quả và đồ uống đóng chai", 4);

        List<MenuItem> defaultItems = List.of(
                // 1. Khai vị & Ăn vặt (35k - 65k)
                new MenuItem(null, catAppetizer, "Gỏi Cuốn Tôm Thịt", "Tôm tươi, thịt ba chỉ kèm rau sống chấm tương đậu", BigDecimal.valueOf(45000), "https://images.unsplash.com/photo-1544025162-d76694265947?w=500", true, 1, true, null, null),
                new MenuItem(null, catAppetizer, "Nem Rán Truyền Thống", "Nem rán giòn rụm bên ngoài, nhân thịt mộc nhĩ đậm đà", BigDecimal.valueOf(55000), "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=500", true, 2, true, null, null),
                new MenuItem(null, catAppetizer, "Khoai Tây Chiên Bơ Tỏi", "Khoai tây giòn rụm lắc bơ tỏi thơm lừng", BigDecimal.valueOf(35000), "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500", true, 3, true, null, null),

                // 2. Món chính & Cơm Mì Phở (55k - 95k)
                new MenuItem(null, catMain, "Phở Bò Tái Nạm Hà Nội", "Bánh phở mềm mượt, bò tái nạm tươi nước dùng hầm xương 12h", BigDecimal.valueOf(55000), "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500", true, 4, true, null, null),
                new MenuItem(null, catMain, "Cơm Tấm Sườn Bì Chả", "Sườn nướng than hoa thơm lừng, bì dai giòn và chả trứng béo ngậy", BigDecimal.valueOf(55000), "https://images.unsplash.com/photo-1544025162-d76694265947?w=500", true, 5, true, null, null),
                new MenuItem(null, catMain, "Bún Chả Nướng Than Hoa", "Chả viên và thịt ba chỉ nướng than hoa ăn kèm bún và nước mắm chua ngọt", BigDecimal.valueOf(50000), "https://images.unsplash.com/photo-1559847844-5315695dadae?w=500", true, 6, true, null, null),
                new MenuItem(null, catMain, "Cơm Chiên Hải Sản", "Cơm chiên hạt giòn kết hợp tôm, mực tươi và trứng vàng óng", BigDecimal.valueOf(75000), "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500", true, 7, true, null, null),
                new MenuItem(null, catMain, "Bò Bít Tết Sốt Tiêu Đen", "Thịt thăn bò mềm mọng dùng kèm khoai tây và sốt tiêu đen đậm đà", BigDecimal.valueOf(145000), "https://images.unsplash.com/photo-1544025162-d76694265947?w=500", true, 8, true, null, null),

                // 3. Lẩu & Nướng (185k - 250k)
                new MenuItem(null, catHotpot, "Lẩu Thái Hải Sản Chua Cay", "Nước lẩu tom yum chua cay đậm đà kèm tôm, mực, bò và nấm tươi", BigDecimal.valueOf(195000), "https://images.unsplash.com/photo-1547592180-85f173990554?w=500", true, 9, true, null, null),
                new MenuItem(null, catHotpot, "Bò Nướng Tảng Sốt Phô Mai", "Thịt bò tảng nướng xèo xèo nhúng sốt phô mai béo ngậy", BigDecimal.valueOf(185000), "https://images.unsplash.com/photo-1558030006-450675393462?w=500", true, 10, true, null, null),

                // 4. Đồ uống & Tráng miệng (15k - 35k)
                new MenuItem(null, catDrink, "Trà Đào Cam Sả Tươi", "Trà thanh mát kết hợp đào giòn mọng nước và sả thơm", BigDecimal.valueOf(32000), "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500", true, 11, true, null, null),
                new MenuItem(null, catDrink, "Trà Tắc Khổng Lồ", "Trà tắc chua ngọt sảng khoái giải nhiệt ngày hè", BigDecimal.valueOf(20000), "https://images.unsplash.com/photo-1556881286-fc6915169721?w=500", true, 12, true, null, null),
                new MenuItem(null, catDrink, "Cà Phê Muối Đặc Biệt", "Cà phê pha phin truyền thống phủ lớp kem muối béo mặn", BigDecimal.valueOf(28000), "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500", true, 13, true, null, null),
                new MenuItem(null, catDrink, "Trà Ô Long TEA+ Chai 455ml", "Trà ô long đóng chai ướp lạnh sảng khoái", BigDecimal.valueOf(15000), "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500", true, 14, true, null, null),
                new MenuItem(null, catDrink, "Bia Tiger Crystal Lon 330ml", "Bia Tiger bạc mát lạnh sảng khoái", BigDecimal.valueOf(25000), "https://images.unsplash.com/photo-1608270116664-5085ef158e23?w=500", true, 15, true, null, null)
        );
        menuItemRepository.saveAll(defaultItems);
    }

    private Category getOrCreateCategory(String name, String desc, int order) {
        List<Category> all = categoryRepository.findAll();
        for (Category c : all) {
            if (c.getName().equalsIgnoreCase(name)) return c;
        }
        Category cat = new Category();
        cat.setName(name);
        cat.setDescription(desc);
        cat.setDisplayOrder(order);
        cat.setIsActive(true);
        return categoryRepository.save(cat);
    }

    @Override
    @Transactional
    public WaiterTableResponse cancelReservation(Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại: " + tableId));

        if (table.getStatus() != TableStatus.RESERVED) {
            throw new AppException("Bàn không ở trạng thái Đặt Trước (RESERVED)!", HttpStatus.BAD_REQUEST);
        }

        table.setStatus(TableStatus.AVAILABLE);
        table.setReservationInfo(null);
        table.setReservedTime(null);
        tableRepository.save(table);

        try {
            realtimeService.notifyTableUpdate(table.getId(), table.getTableNumber(), TableStatus.AVAILABLE.name(), "Hủy đặt bàn");
        } catch (Exception e) {
            log.warn("[Realtime] Lỗi broadcast cancelReservation bàn {}: {}", table.getTableNumber(), e.getMessage());
        }

        return mapToWaiterTableResponse(table);
    }

    @Override
    @Transactional
    public WaiterTableResponse closeEmptySession(Long tableId, CloseEmptySessionRequest request) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại: " + tableId));

        Optional<DiningSession> sessionOpt = sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE);
        if (sessionOpt.isPresent()) {
            DiningSession session = sessionOpt.get();
            List<Order> orders = orderRepository.findBySessionId(session.getId());
            BigDecimal subtotal = BigDecimal.ZERO;
            int nonCancelledItems = 0;

            for (Order order : orders) {
                if (order.getStatus() == OrderStatus.CANCELLED) continue;
                if (order.getItems() != null) {
                    for (OrderItem item : order.getItems()) {
                        if (item.getStatus() != OrderItemStatus.CANCELLED) {
                            nonCancelledItems++;
                            if (item.getSubtotal() != null) {
                                subtotal = subtotal.add(item.getSubtotal());
                            }
                        }
                    }
                }
            }

            if (nonCancelledItems > 0 || subtotal.compareTo(BigDecimal.ZERO) > 0) {
                throw new AppException("Bàn đang có " + nonCancelledItems + " món ăn hợp lệ (" + subtotal.toPlainString() + "đ). Không thể đóng phiên bàn trống! Vui lòng liên hệ Thu ngân hoặc Quản lý.", HttpStatus.BAD_REQUEST);
            }

            session.setStatus(SessionStatus.COMPLETED);
            session.setEndTime(LocalDateTime.now());
            String reason = (request != null && request.getReason() != null && !request.getReason().trim().isEmpty())
                    ? request.getReason().trim()
                    : "Khách không dùng món / Hủy bàn trống";
            String existingNote = session.getNote() != null ? session.getNote() : "";
            session.setNote((existingNote + " [EMPTY_SESSION_CLOSED: " + reason + "]").trim());
            sessionRepository.save(session);

            for (Order order : orders) {
                if (order.getStatus() != OrderStatus.CANCELLED) {
                    order.setStatus(OrderStatus.CANCELLED);
                    orderRepository.save(order);
                }
            }
        }

        // Đóng các chuông gọi / bill pending
        List<ServiceRequest> pendingReqs = requestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(table.getId(), "PENDING");
        for (ServiceRequest req : pendingReqs) {
            req.setStatus("RESOLVED");
            requestRepository.save(req);
        }

        TableStatus targetStatus = TableStatus.AVAILABLE;
        if (request != null && "DIRTY".equalsIgnoreCase(request.getTargetStatus())) {
            targetStatus = TableStatus.DIRTY;
        }
        table.setStatus(targetStatus);
        tableRepository.save(table);

        try {
            realtimeService.notifyTableUpdate(table.getId(), table.getTableNumber(), targetStatus.name(), "Đóng phiên bàn trống");
            realtimeService.notifyPaymentUpdate(null, table.getId(), table.getTableNumber(), "EMPTY_SESSION_CLOSED", Map.of("tableId", table.getId(), "tableNumber", table.getTableNumber()));
        } catch (Exception e) {
            log.warn("[Realtime] Lỗi broadcast closeEmptySession bàn {}: {}", table.getTableNumber(), e.getMessage());
        }

        return mapToWaiterTableResponse(table);
    }
}
