package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.BatchKitchenItemRushRequest;
import com.romsteam.roms.dto.request.BatchKitchenItemStatusRequest;
import com.romsteam.roms.dto.request.UpdateKitchenStatusRequest;
import com.romsteam.roms.dto.response.KitchenHistoryItemResponse;
import com.romsteam.roms.dto.response.KitchenHistoryTableResponse;
import com.romsteam.roms.dto.response.KitchenOrderItemResponse;
import com.romsteam.roms.dto.response.KitchenOrderResponse;
import com.romsteam.roms.dto.response.KitchenSummaryResponse;
import com.romsteam.roms.entity.*;
import com.romsteam.roms.entity.enums.OrderItemStatus;
import com.romsteam.roms.entity.enums.OrderStatus;
import com.romsteam.roms.entity.enums.SessionStatus;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.exception.ResourceNotFoundException;
import com.romsteam.roms.repository.OrderItemRepository;
import com.romsteam.roms.repository.MenuItemRepository;
import com.romsteam.roms.entity.MenuItem;
import org.springframework.cache.CacheManager;
import com.romsteam.roms.repository.OrderRepository;
import com.romsteam.roms.repository.ZoneRepository;
import com.romsteam.roms.service.KitchenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import com.romsteam.roms.service.RealtimeService;

@Service
@RequiredArgsConstructor
public class KitchenServiceImpl implements KitchenService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ZoneRepository zoneRepository;
    private final RealtimeService realtimeService;
    private final MenuItemRepository menuItemRepository;
    private final CacheManager cacheManager;

    private boolean isKitchenItem(OrderItem i) {
        if (i == null) return false;
        if (i.getMenuItem() != null && "WAITER".equalsIgnoreCase(i.getMenuItem().getStation())) {
            return false;
        }
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public List<KitchenOrderResponse> getActiveKitchenOrders() {
        // Lấy các đơn đang cần hiển thị trên màn hình bếp: SUBMITTED (khách gửi qua QR), CONFIRMED, COOKING, READY
        List<OrderStatus> activeStatuses = Arrays.asList(OrderStatus.SUBMITTED, OrderStatus.CONFIRMED, OrderStatus.COOKING, OrderStatus.READY);
        List<Order> orders = orderRepository.findByStatusInOrderByCreatedAtAsc(activeStatuses);

        return orders.stream()
                // 1. Chỉ lấy đơn thuộc phiên ăn đang ACTIVE (Bỏ các đơn của phiên đã COMPLETED/CANCELLED như bàn B-01 cũ)
                .filter(o -> o.getSession() != null && o.getSession().getStatus() == SessionStatus.ACTIVE)
                // 2. Chỉ lấy đơn còn món của Bếp chưa bưng (Bỏ các đơn mà toàn bộ món bếp đã SERVED/CANCELLED hoặc chỉ gồm món trạm Phục Vụ)
                .filter(o -> o.getItems() != null && o.getItems().stream().anyMatch(i -> 
                        isKitchenItem(i) && i.getStatus() != OrderItemStatus.SERVED && i.getStatus() != OrderItemStatus.CANCELLED
                ))
                .map(this::mapToKitchenOrderResponse)
                .filter(o -> o.getItems() != null && !o.getItems().isEmpty())
                .sorted((o1, o2) -> {
                    // Ưu tiên đơn RUSH lên vị trí đầu tiên
                    if (Boolean.TRUE.equals(o1.getIsRush()) && !Boolean.TRUE.equals(o2.getIsRush())) return -1;
                    if (!Boolean.TRUE.equals(o1.getIsRush()) && Boolean.TRUE.equals(o2.getIsRush())) return 1;
                    // Nếu cùng độ ưu tiên, sắp xếp FIFO theo thời gian gửi (cũ nhất lên trước)
                    if (o1.getStartedAt() != null && o2.getStartedAt() != null) {
                        return o1.getStartedAt().compareTo(o2.getStartedAt());
                    }
                    return 0;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public KitchenOrderResponse updateItemStatus(Long itemId, UpdateKitchenStatusRequest request) {
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với ID: " + itemId));

        try {
            OrderItemStatus newStatus = OrderItemStatus.valueOf(request.getStatus().toUpperCase());
            OrderItemStatus oldStatus = item.getStatus();
            item.setStatus(newStatus);
            orderItemRepository.save(item);
            if (newStatus == OrderItemStatus.CANCELLED && oldStatus != OrderItemStatus.CANCELLED) {
                restoreItemStock(item);
            }

            Order order = item.getOrder();
            if (order != null && order.getItems() != null) {
                boolean allCancelled = order.getItems().stream()
                        .allMatch(i -> i.getStatus() == OrderItemStatus.CANCELLED);

                boolean allReadyOrServed = order.getItems().stream()
                        .allMatch(i -> i.getStatus() == OrderItemStatus.READY ||
                                       i.getStatus() == OrderItemStatus.SERVED ||
                                       i.getStatus() == OrderItemStatus.CANCELLED);

                boolean anyCooking = order.getItems().stream()
                        .anyMatch(i -> i.getStatus() == OrderItemStatus.COOKING);

                if (allCancelled) {
                    order.setStatus(OrderStatus.CANCELLED);
                } else if (allReadyOrServed) {
                    order.setStatus(OrderStatus.READY);
                } else if (anyCooking) {
                    order.setStatus(OrderStatus.COOKING);
                }

                // Cập nhật lại tổng tiền đơn hàng (loại trừ các món đã bị hủy)
                BigDecimal recalculatedTotal = order.getItems().stream()
                        .filter(i -> i.getStatus() != OrderItemStatus.CANCELLED)
                        .map(i -> i.getSubtotal() != null ? i.getSubtotal() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                order.setTotalAmount(recalculatedTotal);

                orderRepository.save(order);

                // Phát sự kiện realtime STOMP cho Phục vụ và Khách theo dõi món
                try {
                    Long tableId = order.getSession() != null && order.getSession().getTable() != null ? order.getSession().getTable().getId() : null;
                    String tableNumber = order.getSession() != null && order.getSession().getTable() != null ? order.getSession().getTable().getTableNumber() : "Bàn";
                    realtimeService.notifyOrderStatus(order.getId(), tableId, tableNumber, request.getStatus(), item.getId());
                } catch (Exception e) {}

                return mapToKitchenOrderResponse(order);
            }

            return mapToKitchenOrderResponse(item.getOrder());
        } catch (IllegalArgumentException e) {
            throw new AppException("Trạng thái món ăn không hợp lệ: " + request.getStatus(), HttpStatus.BAD_REQUEST);
        }
    }

    @Override
    @Transactional
    public List<KitchenOrderResponse> batchUpdateItemStatus(BatchKitchenItemStatusRequest request) {
        if (request.getItemIds() == null || request.getItemIds().isEmpty()) {
            return Collections.emptyList();
        }
        OrderItemStatus newStatus;
        try {
            newStatus = OrderItemStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException("Trạng thái món không hợp lệ: " + request.getStatus(), HttpStatus.BAD_REQUEST);
        }

        List<OrderItem> items = orderItemRepository.findAllById(request.getItemIds());
        Set<Order> affectedOrders = new HashSet<>();

        for (OrderItem item : items) {
            OrderItemStatus oldStatus = item.getStatus();
            item.setStatus(newStatus);
            orderItemRepository.save(item);
            if (newStatus == OrderItemStatus.CANCELLED && oldStatus != OrderItemStatus.CANCELLED) {
                restoreItemStock(item);
            }
            if (item.getOrder() != null) {
                affectedOrders.add(item.getOrder());
            }
        }

        List<KitchenOrderResponse> results = new ArrayList<>();
        for (Order order : affectedOrders) {
            if (order.getItems() != null) {
                boolean allCancelled = order.getItems().stream()
                        .allMatch(i -> i.getStatus() == OrderItemStatus.CANCELLED);
                boolean allReadyOrServed = order.getItems().stream()
                        .allMatch(i -> i.getStatus() == OrderItemStatus.READY ||
                                       i.getStatus() == OrderItemStatus.SERVED ||
                                       i.getStatus() == OrderItemStatus.CANCELLED);
                boolean anyCooking = order.getItems().stream()
                        .anyMatch(i -> i.getStatus() == OrderItemStatus.COOKING);

                if (allCancelled) {
                    order.setStatus(OrderStatus.CANCELLED);
                } else if (allReadyOrServed) {
                    order.setStatus(OrderStatus.READY);
                } else if (anyCooking) {
                    order.setStatus(OrderStatus.COOKING);
                }

                BigDecimal recalculatedTotal = order.getItems().stream()
                        .filter(i -> i.getStatus() != OrderItemStatus.CANCELLED)
                        .map(i -> i.getSubtotal() != null ? i.getSubtotal() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                order.setTotalAmount(recalculatedTotal);

                Order saved = orderRepository.save(order);

                try {
                    Long tableId = saved.getSession() != null && saved.getSession().getTable() != null ? saved.getSession().getTable().getId() : null;
                    String tableNumber = saved.getSession() != null && saved.getSession().getTable() != null ? saved.getSession().getTable().getTableNumber() : "Bàn";
                    realtimeService.notifyOrderStatus(saved.getId(), tableId, tableNumber, request.getStatus(), null);
                } catch (Exception ignored) {}

                results.add(mapToKitchenOrderResponse(saved));
            }
        }
        return results;
    }

    @Override
    @Transactional
    public List<KitchenOrderResponse> batchToggleItemRush(BatchKitchenItemRushRequest request) {
        if (request.getItemIds() == null || request.getItemIds().isEmpty()) {
            return Collections.emptyList();
        }
        List<OrderItem> items = orderItemRepository.findAllById(request.getItemIds());
        Set<Order> affectedOrders = new HashSet<>();

        // Nếu tất cả món được chọn đã rush -> hủy rush; ngược lại gắn cờ rush
        boolean allRushed = items.stream().allMatch(i -> i.getNote() != null && i.getNote().contains("[RUSH]"));

        for (OrderItem item : items) {
            String currentNote = item.getNote() != null ? item.getNote().trim() : "";
            if (allRushed) {
                String cleaned = currentNote.replace("[RUSH]", "").trim();
                item.setNote(cleaned.isEmpty() ? null : cleaned);
            } else {
                if (!currentNote.contains("[RUSH]")) {
                    item.setNote(currentNote.isEmpty() ? "[RUSH]" : "[RUSH] " + currentNote);
                }
            }
            orderItemRepository.save(item);
            if (item.getOrder() != null) {
                affectedOrders.add(item.getOrder());
            }
        }

        return affectedOrders.stream()
                .map(this::mapToKitchenOrderResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public KitchenOrderResponse updateOrderStatus(Long orderId, UpdateKitchenStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        try {
            OrderStatus newStatus = OrderStatus.valueOf(request.getStatus().toUpperCase());
            order.setStatus(newStatus);

            // Đồng bộ trạng thái của các món chưa hoàn thành trong đơn
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (item.getStatus() != OrderItemStatus.CANCELLED) {
                        if (newStatus == OrderStatus.COOKING) {
                            item.setStatus(OrderItemStatus.COOKING);
                        } else if (newStatus == OrderStatus.READY) {
                            item.setStatus(OrderItemStatus.READY);
                        } else if (newStatus == OrderStatus.SERVED) {
                            item.setStatus(OrderItemStatus.SERVED);
                        } else if (newStatus == OrderStatus.CANCELLED) {
                            item.setStatus(OrderItemStatus.CANCELLED);
                            restoreItemStock(item);
                        }
                    }
                }
            }

            Order updated = orderRepository.save(order);

            // Phát sự kiện realtime STOMP
            try {
                Long tableId = updated.getSession() != null && updated.getSession().getTable() != null ? updated.getSession().getTable().getId() : null;
                String tableNumber = updated.getSession() != null && updated.getSession().getTable() != null ? updated.getSession().getTable().getTableNumber() : "Bàn";
                realtimeService.notifyOrderStatus(updated.getId(), tableId, tableNumber, request.getStatus(), updated.getId());
            } catch (Exception e) {}

            return mapToKitchenOrderResponse(updated);
        } catch (IllegalArgumentException e) {
            throw new AppException("Trạng thái đơn hàng không hợp lệ: " + request.getStatus(), HttpStatus.BAD_REQUEST);
        }
    }

    @Override
    @Transactional
    public KitchenOrderResponse toggleRushOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        String currentNote = order.getNote() != null ? order.getNote().trim() : "";
        if (currentNote.contains("[RUSH]")) {
            // Hủy ưu tiên
            String cleaned = currentNote.replace("[RUSH]", "").trim();
            order.setNote(cleaned.isEmpty() ? null : cleaned);
        } else {
            // Đánh dấu ưu tiên hỏa tốc
            order.setNote(currentNote.isEmpty() ? "[RUSH]" : "[RUSH] " + currentNote);
        }

        Order updated = orderRepository.save(order);
        return mapToKitchenOrderResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public KitchenSummaryResponse getKitchenSummary() {
        List<OrderStatus> activeStatuses = Arrays.asList(OrderStatus.SUBMITTED, OrderStatus.CONFIRMED, OrderStatus.COOKING, OrderStatus.READY);
        List<Order> orders = orderRepository.findByStatusInOrderByCreatedAtAsc(activeStatuses)
                .stream()
                .filter(o -> o.getSession() != null && o.getSession().getStatus() == SessionStatus.ACTIVE)
                .filter(o -> o.getItems() != null && o.getItems().stream().anyMatch(i -> 
                        isKitchenItem(i) && i.getStatus() != OrderItemStatus.SERVED && i.getStatus() != OrderItemStatus.CANCELLED
                ))
                .collect(Collectors.toList());

        int pendingCount = 0;
        int cookingCount = 0;
        int readyCount = 0;
        long totalElapsedSeconds = 0;
        int onTimeCount = 0;

        for (Order o : orders) {
            if (o.getStatus() == OrderStatus.CONFIRMED || o.getStatus() == OrderStatus.SUBMITTED) pendingCount++;
            else if (o.getStatus() == OrderStatus.COOKING) cookingCount++;
            else if (o.getStatus() == OrderStatus.READY) readyCount++;

            LocalDateTime startedAt = o.getOrderTime() != null ? o.getOrderTime() : o.getCreatedAt();
            long elapsed = (startedAt != null) ? Duration.between(startedAt, LocalDateTime.now()).getSeconds() : 0;
            if (elapsed < 0) elapsed = 0;
            totalElapsedSeconds += elapsed;
            if (elapsed <= 900) { // SLA 15 phút (900 giây)
                onTimeCount++;
            }
        }

        String avgPrepTime = "0m 00s";
        double performanceRate = 100.0;

        if (!orders.isEmpty()) {
            long avgSeconds = totalElapsedSeconds / orders.size();
            long m = avgSeconds / 60;
            long s = avgSeconds % 60;
            avgPrepTime = String.format("%dm %02ds", m, s);
            performanceRate = Math.round(((double) onTimeCount / orders.size() * 100.0) * 10.0) / 10.0;
        }

        return KitchenSummaryResponse.builder()
                .totalActiveOrders(orders.size())
                .pendingOrders(pendingCount)
                .cookingOrders(cookingCount)
                .readyOrders(readyCount)
                .avgPrepTime(avgPrepTime)
                .performanceRate(performanceRate)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<KitchenHistoryTableResponse> getTodayCookingHistory() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        List<Order> ordersToday = orderRepository.findOrdersToday(startOfDay);

        // Gom nhóm theo Bàn VÀ Mã phiên ăn (đảm bảo mỗi phiên ăn của bàn là 1 thẻ riêng biệt)
        Map<String, List<Order>> ordersBySession = ordersToday.stream()
                .collect(Collectors.groupingBy(o -> {
                    if (o.getSession() != null) {
                        String tblNum = (o.getSession().getTable() != null) 
                                ? o.getSession().getTable().getTableNumber() 
                                : "MANG_VE";
                        return tblNum + "_SES_" + o.getSession().getId();
                    }
                    return "MANG_VE_ORD_" + o.getId();
                }, LinkedHashMap::new, Collectors.toList()));

        List<KitchenHistoryTableResponse> historyList = new ArrayList<>();

        for (Map.Entry<String, List<Order>> entry : ordersBySession.entrySet()) {
            List<Order> tblOrders = entry.getValue();
            if (tblOrders.isEmpty()) continue;

            Long tableId = null;
            String tableNumber = "Mang về";
            String tableName = "Khách mang về";
            String zoneName = "Quầy";
            Long sessionId = null;
            String sessionCode = null;
            String sessionStatus = null;
            String sessionStatusText = null;

            DiningSession session = tblOrders.stream()
                    .map(Order::getSession)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse(null);

            if (session != null) {
                sessionId = session.getId();
                sessionCode = "SES-" + session.getId();
                sessionStatus = session.getStatus() != null ? session.getStatus().name() : "ACTIVE";
                sessionStatusText = switch (sessionStatus) {
                    case "ACTIVE" -> "Đang dùng bữa";
                    case "COMPLETED" -> "Đã thanh toán";
                    case "CANCELLED" -> "Đã hủy";
                    default -> "Đang phục vụ";
                };
                if (session.getTable() != null) {
                    RestaurantTable t = session.getTable();
                    tableId = t.getId();
                    tableNumber = t.getTableNumber();
                    tableName = t.getName();
                    zoneName = resolveZoneName(t.getZone());
                }
            } else {
                Order firstOrder = tblOrders.get(0);
                if (firstOrder.getSession() != null && firstOrder.getSession().getTable() != null) {
                    RestaurantTable t = firstOrder.getSession().getTable();
                    tableId = t.getId();
                    tableNumber = t.getTableNumber();
                    tableName = t.getName();
                    zoneName = resolveZoneName(t.getZone());
                }
            }

            List<KitchenHistoryItemResponse> itemsList = new ArrayList<>();
            int readyCount = 0;
            int servedCount = 0;

            for (Order order : tblOrders) {
                if (order.getItems() != null) {
                    for (OrderItem item : order.getItems()) {
                        // KDS chỉ hiển thị lịch sử các món Bếp xử lý (loại bỏ món trạm Phục Vụ)
                        if (!isKitchenItem(item)) {
                            continue;
                        }

                        String statusStr = item.getStatus() != null ? item.getStatus().name() : "PENDING";
                        if ("READY".equals(statusStr)) readyCount++;
                        if ("SERVED".equals(statusStr)) servedCount++;

                        String statusText = switch (statusStr) {
                            case "COOKING" -> "Đang nấu";
                            case "READY" -> "Đã xong (Chờ bưng)";
                            case "SERVED" -> "Đã lên bàn";
                            case "CANCELLED" -> "Đã hủy";
                            default -> "Chờ tiếp nhận";
                        };

                        String rawNote = item.getNote();
                        boolean isItemRush = rawNote != null && rawNote.contains("[RUSH]");
                        String displayNote = rawNote;
                        if (isItemRush) {
                            displayNote = rawNote.replace("[RUSH]", "").trim();
                            if (displayNote.isEmpty()) displayNote = null;
                        }

                        itemsList.add(KitchenHistoryItemResponse.builder()
                                .id(item.getId())
                                .menuItemId(item.getMenuItem() != null ? item.getMenuItem().getId() : null)
                                .orderCode(order.getOrderCode() != null ? order.getOrderCode() : String.valueOf(order.getId()))
                                .name(item.getMenuItem() != null ? item.getMenuItem().getName() : "Món chưa đặt tên")
                                .imageUrl(item.getMenuItem() != null ? item.getMenuItem().getImageUrl() : null)
                                .quantity(item.getQuantity())
                                .note(displayNote)
                                .isRush(isItemRush)
                                .status(statusStr)
                                .statusText(statusText)
                                .orderTime(order.getOrderTime() != null ? order.getOrderTime() : order.getCreatedAt())
                                .completedTime(item.getUpdatedAt() != null ? item.getUpdatedAt() : item.getCreatedAt())
                                .build());
                    }
                }
            }

            // Nếu phiên này không có món nào thuộc trạm Bếp thì không cần hiện trên KDS
            if (itemsList.isEmpty()) {
                continue;
            }

            // Sắp xếp món mới cập nhật lên trước trong cùng 1 phiên
            itemsList.sort((i1, i2) -> {
                if (i1.getCompletedTime() != null && i2.getCompletedTime() != null) {
                    return i2.getCompletedTime().compareTo(i1.getCompletedTime());
                }
                return 0;
            });

            historyList.add(KitchenHistoryTableResponse.builder()
                    .tableId(tableId)
                    .tableNumber(tableNumber)
                    .tableName(tableName)
                    .zoneName(zoneName)
                    .sessionId(sessionId)
                    .sessionCode(sessionCode)
                    .sessionStatus(sessionStatus)
                    .sessionStatusText(sessionStatusText)
                    .totalItems(itemsList.size())
                    .readyItems(readyCount)
                    .servedItems(servedCount)
                    .items(itemsList)
                    .build());
        }

        // Sắp xếp các phiên ăn mới nhất lên đầu danh sách lịch sử
        historyList.sort((h1, h2) -> {
            LocalDateTime t1 = (h1.getItems() != null && !h1.getItems().isEmpty()) ? h1.getItems().get(0).getCompletedTime() : null;
            LocalDateTime t2 = (h2.getItems() != null && !h2.getItems().isEmpty()) ? h2.getItems().get(0).getCompletedTime() : null;
            if (t1 != null && t2 != null) {
                return t2.compareTo(t1);
            }
            if (h1.getSessionId() != null && h2.getSessionId() != null) {
                return h2.getSessionId().compareTo(h1.getSessionId());
            }
            return 0;
        });

        return historyList;
    }

    private KitchenOrderResponse mapToKitchenOrderResponse(Order order) {
        RestaurantTable table = (order.getSession() != null) ? order.getSession().getTable() : null;
        String tableNumber = table != null ? table.getTableNumber() : "Mang về";
        String tableName = table != null ? table.getName() : "Khách vãng lai";
        String zoneName = resolveZoneName(table != null ? table.getZone() : null);

        String staffName = (order.getStaff() != null) ? order.getStaff().getFullName() : "Khách quét QR";
        boolean isRush = order.getNote() != null && order.getNote().contains("[RUSH]");

        LocalDateTime startedAt = order.getOrderTime() != null ? order.getOrderTime() : order.getCreatedAt();
        long elapsedSeconds = (startedAt != null) ? Duration.between(startedAt, LocalDateTime.now()).getSeconds() : 0;
        if (elapsedSeconds < 0) elapsedSeconds = 0;

        List<KitchenOrderItemResponse> itemResponses = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                // Không đưa món có Trạm điều phối là Phục Vụ xuống Bếp KDS
                if (!isKitchenItem(item)) {
                    continue;
                }

                String statusStr = item.getStatus() != null ? item.getStatus().name() : "PENDING";
                String statusText = switch (statusStr) {
                    case "COOKING" -> "Đang nấu";
                    case "READY" -> "Đã xong";
                    case "SERVED" -> "Đã lên bàn";
                    case "CANCELLED" -> "Đã hủy";
                    default -> "Chờ tiếp nhận";
                };

                String rawItemNote = item.getNote();
                boolean isItemRush = rawItemNote != null && rawItemNote.contains("[RUSH]");
                String displayItemNote = rawItemNote;
                if (isItemRush) {
                    displayItemNote = rawItemNote.replace("[RUSH]", "").trim();
                    if (displayItemNote.isEmpty()) displayItemNote = null;
                }

                itemResponses.add(KitchenOrderItemResponse.builder()
                        .id(item.getId())
                        .menuItemId(item.getMenuItem() != null ? item.getMenuItem().getId() : null)
                        .name(item.getMenuItem() != null ? item.getMenuItem().getName() : "Món chưa đặt tên")
                        .imageUrl(item.getMenuItem() != null ? item.getMenuItem().getImageUrl() : null)
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .note(displayItemNote)
                        .isRush(isItemRush)
                        .status(statusStr)
                        .statusText(statusText)
                        .build());
            }
        }

        String combinedNote = order.getNote() != null ? order.getNote() : "";
        if (order.getSession() != null && order.getSession().getNote() != null && order.getSession().getNote().contains("[CHUYỂN TỪ")) {
            String sessionNote = order.getSession().getNote();
            int startIdx = sessionNote.indexOf("[CHUYỂN TỪ");
            int endIdx = sessionNote.indexOf("]", startIdx);
            if (startIdx >= 0 && endIdx >= startIdx) {
                String transferTag = sessionNote.substring(startIdx, endIdx + 1);
                if (!combinedNote.contains(transferTag)) {
                    combinedNote = (transferTag + (combinedNote.isEmpty() ? "" : " - " + combinedNote)).trim();
                }
            }
        }

        Long sessionId = (order.getSession() != null) ? order.getSession().getId() : null;
        String sessionCode = sessionId != null ? "SES-" + sessionId : null;

        return KitchenOrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .sessionId(sessionId)
                .sessionCode(sessionCode)
                .tableId(table != null ? table.getId() : null)
                .tableNumber(tableNumber)
                .tableName(tableName)
                .zoneName(zoneName)
                .staffName(staffName)
                .status(order.getStatus() != null ? order.getStatus().name() : "CONFIRMED")
                .note(combinedNote.isEmpty() ? null : combinedNote)
                .isRush(isRush)
                .startedAt(startedAt)
                .elapsedSeconds(elapsedSeconds)
                .items(itemResponses)
                .build();
    }

    private String resolveZoneName(String zoneCode) {
        if (zoneCode == null) return "Chưa phân khu";
        return zoneRepository.findByZoneCode(zoneCode)
                .map(Zone::getName)
                .orElseGet(() -> switch (zoneCode) {
                    case "ZONE_1" -> "Tầng 1 - Sảnh Chính";
                    case "ZONE_2" -> "Tầng 2 - Ban Công";
                    case "VIP" -> "Phòng VIP";
                    default -> zoneCode;
                });
    }

    private void restoreItemStock(OrderItem item) {
        if (item != null && item.getMenuItem() != null && item.getQuantity() != null && item.getQuantity() > 0) {
            MenuItem menuItem = item.getMenuItem();
            menuItem.increaseStock(item.getQuantity());
            menuItemRepository.save(menuItem);
            try {
                realtimeService.notifyMenuItemAvailability(menuItem.getId(), menuItem.getName(), menuItem.getIsAvailable(), menuItem.getRemainingStock());
            } catch (Exception ignored) {}
            if (cacheManager != null && cacheManager.getCache("customerMenu") != null) {
                cacheManager.getCache("customerMenu").clear();
            }
        }
    }
}
