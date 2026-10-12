package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.UpdateKitchenStatusRequest;
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

@Service
@RequiredArgsConstructor
public class KitchenServiceImpl implements KitchenService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ZoneRepository zoneRepository;

    @Override
    @Transactional(readOnly = true)
    public List<KitchenOrderResponse> getActiveKitchenOrders() {
        // Lấy các đơn đang cần hiển thị trên màn hình bếp: SUBMITTED (khách gửi qua QR), CONFIRMED, COOKING, READY
        List<OrderStatus> activeStatuses = Arrays.asList(OrderStatus.SUBMITTED, OrderStatus.CONFIRMED, OrderStatus.COOKING, OrderStatus.READY);
        List<Order> orders = orderRepository.findByStatusInOrderByCreatedAtAsc(activeStatuses);

        return orders.stream()
                // 1. Chỉ lấy đơn thuộc phiên ăn đang ACTIVE (Bỏ các đơn của phiên đã COMPLETED/CANCELLED như bàn B-01 cũ)
                .filter(o -> o.getSession() != null && o.getSession().getStatus() == SessionStatus.ACTIVE)
                // 2. Chỉ lấy đơn còn món chưa bưng (Bỏ các đơn mà toàn bộ món đã SERVED hoặc CANCELLED)
                .filter(o -> o.getItems() != null && o.getItems().stream().anyMatch(i -> 
                        i.getStatus() != OrderItemStatus.SERVED && i.getStatus() != OrderItemStatus.CANCELLED
                ))
                .map(this::mapToKitchenOrderResponse)
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
            item.setStatus(newStatus);
            orderItemRepository.save(item);

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
                return mapToKitchenOrderResponse(order);
            }

            return mapToKitchenOrderResponse(item.getOrder());
        } catch (IllegalArgumentException e) {
            throw new AppException("Trạng thái món ăn không hợp lệ: " + request.getStatus(), HttpStatus.BAD_REQUEST);
        }
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
                        }
                    }
                }
            }

            Order updated = orderRepository.save(order);
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
                        i.getStatus() != OrderItemStatus.SERVED && i.getStatus() != OrderItemStatus.CANCELLED
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
                String statusStr = item.getStatus() != null ? item.getStatus().name() : "PENDING";
                String statusText = switch (statusStr) {
                    case "COOKING" -> "Đang nấu";
                    case "READY" -> "Đã xong";
                    case "SERVED" -> "Đã lên bàn";
                    case "CANCELLED" -> "Đã hủy";
                    default -> "Chờ tiếp nhận";
                };

                itemResponses.add(KitchenOrderItemResponse.builder()
                        .id(item.getId())
                        .menuItemId(item.getMenuItem() != null ? item.getMenuItem().getId() : null)
                        .name(item.getMenuItem() != null ? item.getMenuItem().getName() : "Món chưa đặt tên")
                        .imageUrl(item.getMenuItem() != null ? item.getMenuItem().getImageUrl() : null)
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .note(item.getNote())
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

        return KitchenOrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
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
}
