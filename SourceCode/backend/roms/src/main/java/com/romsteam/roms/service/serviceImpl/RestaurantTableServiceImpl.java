package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.CreateTableRequest;
import com.romsteam.roms.dto.request.UpdateTableStatusRequest;
import com.romsteam.roms.dto.response.TableOrdersResponse;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.dto.response.TableSummaryResponse;
import com.romsteam.roms.entity.DiningSession;
import com.romsteam.roms.entity.Order;
import com.romsteam.roms.entity.OrderItem;
import com.romsteam.roms.entity.RestaurantTable;
import com.romsteam.roms.entity.enums.SessionStatus;
import com.romsteam.roms.entity.enums.TableStatus;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.exception.ResourceNotFoundException;
import com.romsteam.roms.repository.DiningSessionRepository;
import com.romsteam.roms.repository.OrderRepository;
import com.romsteam.roms.repository.RestaurantTableRepository;
import com.romsteam.roms.service.RestaurantTableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RestaurantTableServiceImpl implements RestaurantTableService {

    private final RestaurantTableRepository tableRepository;
    private final DiningSessionRepository diningSessionRepository;
    private final OrderRepository orderRepository;

    // ===================================================================
    // 1. TÍNH TOÁN DỮ LIỆU 5 THẺ KPI THỐNG KÊ
    // ===================================================================
    @Override
    @Transactional(readOnly = true)
    public TableSummaryResponse getTableSummary() {
        long totalTables = tableRepository.count();
        int totalSeats = tableRepository.sumTotalCapacity();

        long occupiedTables = tableRepository.countByStatusAndIsActiveTrue(TableStatus.OCCUPIED);
        long availableTables = tableRepository.countByStatusAndIsActiveTrue(TableStatus.AVAILABLE);
        long reservedTables = tableRepository.countByStatusAndIsActiveTrue(TableStatus.RESERVED);
        long blockedTables = tableRepository.countByStatusAndIsActiveTrue(TableStatus.BLOCKED);

        // Tính tổng số khách thực tế đang ngồi từ các phiên ăn ACTIVE
        List<DiningSession> activeSessions = diningSessionRepository.findByStatus(SessionStatus.ACTIVE);
        int occupiedGuests = activeSessions.stream()
                .mapToInt(s -> s.getGuestCount() != null ? s.getGuestCount() : 0)
                .sum();

        return TableSummaryResponse.builder()
                .totalTables(totalTables)
                .totalSeats(totalSeats)
                .occupiedTables(occupiedTables)
                .occupiedGuests(occupiedGuests)
                .availableTables(availableTables)
                .reservedTables(reservedTables)
                .blockedTables(blockedTables)
                .build();
    }

    // ===================================================================
    // 2. LẤY DANH SÁCH BÀN KÈM BỘ LỌC VÀ TÌM KIẾM
    // ===================================================================
    @Override
    @Transactional(readOnly = true)
    public List<TableResponse> getTables(String zone, TableStatus status, String keyword) {
        List<RestaurantTable> tables;

        if (keyword != null && !keyword.trim().isEmpty()) {
            tables = tableRepository.searchTables(keyword.trim());
        } else if (zone != null && !zone.equalsIgnoreCase("ALL") && status != null) {
            tables = tableRepository.findByZoneAndStatusAndIsActiveTrue(zone, status);
        } else if (zone != null && !zone.equalsIgnoreCase("ALL")) {
            tables = tableRepository.findByZoneAndIsActiveTrue(zone);
        } else if (status != null) {
            tables = tableRepository.findByStatusAndIsActiveTrue(status);
        } else {
            tables = tableRepository.findByIsActiveTrueOrderByTableNumberAsc();
        }

        return tables.stream()
                .map(this::mapToTableResponse)
                .collect(Collectors.toList());
    }

    // ===================================================================
    // 3. CHI TIẾT MỘT BÀN ĂN
    // ===================================================================
    @Override
    @Transactional(readOnly = true)
    public TableResponse getTableById(Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn ăn không tồn tại với ID: " + id));
        return mapToTableResponse(table);
    }

    // ===================================================================
    // 4. THÊM BÀN ĂN MỚI
    // ===================================================================
    @Override
    @Transactional
    public TableResponse createTable(CreateTableRequest request) {
        String cleanCode = request.getTableNumber().trim().toUpperCase();

        // Kiểm tra trùng mã bàn
        if (tableRepository.existsByTableNumber(cleanCode)) {
            throw new AppException("Mã bàn '" + cleanCode + "' đã tồn tại trong hệ thống!", HttpStatus.CONFLICT);
        }

        String displayName = (request.getName() != null && !request.getName().trim().isEmpty())
                ? request.getName().trim()
                : "Bàn " + cleanCode;

        // Sinh mã bí mật QR Code ngẫu nhiên
        String generatedQrToken = "qr-" + cleanCode.toLowerCase() + "-" + UUID.randomUUID().toString().substring(0, 8);

        RestaurantTable newTable = RestaurantTable.builder()
                .tableNumber(cleanCode)
                .name(displayName)
                .zone(request.getZone())
                .capacity(request.getCapacity())
                .status(TableStatus.AVAILABLE)
                .qrToken(generatedQrToken)
                .isActive(true)
                .build();

        RestaurantTable saved = tableRepository.save(newTable);
        return mapToTableResponse(saved);
    }

    // ===================================================================
    // 5. CẬP NHẬT TRẠNG THÁI BÀN (KHÓA, MỞ, ĐẶT CHỖ, DỌN DẸP)
    // ===================================================================
    @Override
    @Transactional
    public TableResponse updateTableStatus(Long id, UpdateTableStatusRequest request) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn ăn không tồn tại với ID: " + id));

        TableStatus targetStatus = request.getStatus();

        // Không cho phép tự ý chuyển bàn OCCUPIED sang AVAILABLE nếu phiên ăn chưa kết thúc
        if (table.getStatus() == TableStatus.OCCUPIED && targetStatus == TableStatus.AVAILABLE) {
            Optional<DiningSession> activeSession = diningSessionRepository.findByTableIdAndStatus(id, SessionStatus.ACTIVE);
            if (activeSession.isPresent()) {
                throw new AppException("Bàn đang có khách ngồi ăn và chưa hoàn tất thanh toán hóa đơn!", HttpStatus.BAD_REQUEST);
            }
        }

        table.setStatus(targetStatus);

        // Xử lý các thông tin phụ thuộc theo trạng thái đích
        if (targetStatus == TableStatus.BLOCKED) {
            table.setBlockedReason(request.getBlockedReason() != null ? request.getBlockedReason() : "Bảo trì thiết bị");
            table.setReservationInfo(null);
            table.setReservedTime(null);
        } else if (targetStatus == TableStatus.RESERVED) {
            table.setReservationInfo(request.getReservationInfo());
            table.setReservedTime(request.getReservedTime() != null ? request.getReservedTime() : "Đặt lúc 19:30");
            table.setBlockedReason(null);
        } else if (targetStatus == TableStatus.AVAILABLE || targetStatus == TableStatus.DIRTY) {
            table.setBlockedReason(null);
            table.setReservationInfo(null);
            table.setReservedTime(null);
        }

        RestaurantTable updated = tableRepository.save(table);
        return mapToTableResponse(updated);
    }

    // ===================================================================
    // 6. TÁI TẠO MÃ QR CODE CHO BÀN (REFRESH TOKEN)
    // ===================================================================
    @Override
    @Transactional
    public TableResponse refreshQrToken(Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn ăn không tồn tại với ID: " + id));

        // Sinh token mới
        String newToken = "qr-" + table.getTableNumber().toLowerCase() + "-" + UUID.randomUUID().toString().substring(0, 8);
        table.setQrToken(newToken);
        RestaurantTable updated = tableRepository.save(table);
        return mapToTableResponse(updated);
    }

    // ===================================================================
    // 7. XÁC THỰC MÃ QR KHI KHÁCH QUÉT ĐIỆN THOẠI
    // ===================================================================
    @Override
    @Transactional(readOnly = true)
    public TableResponse verifyQrToken(String qrToken) {
        if (qrToken == null || qrToken.trim().isEmpty()) {
            throw new AppException("Mã QR token không hợp lệ!", HttpStatus.BAD_REQUEST);
        }

        RestaurantTable table = tableRepository.findByQrToken(qrToken.trim())
                .orElseThrow(() -> new AppException("Mã QR không đúng hoặc bàn không tồn tại!", HttpStatus.NOT_FOUND));

        if (!table.getIsActive()) {
            throw new AppException("Bàn ăn này hiện đang tạm ngưng phục vụ!", HttpStatus.FORBIDDEN);
        }

        return mapToTableResponse(table);
    }

    // ===================================================================
    // 8. XÓA BÀN ĂN
    // ===================================================================
    @Override
    @Transactional
    public void deleteTable(Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn ăn không tồn tại với ID: " + id));

        if (table.getStatus() == TableStatus.OCCUPIED) {
            throw new AppException("Không thể xóa bàn đang có khách phục vụ!", HttpStatus.CONFLICT);
        }

        // Soft-delete: đổi isActive sang false để bảo toàn lịch sử hóa đơn
        table.setIsActive(false);
        tableRepository.save(table);
    }

    // ===================================================================
    // HÀM HELPER: ÁNH XẠ ENTITY SANG DTO VÀ TÍNH TIỀN HÓA ĐƠN THỜI GIAN THỰC
    // ===================================================================
    private TableResponse mapToTableResponse(RestaurantTable table) {
        String zoneName = switch (table.getZone()) {
            case "ZONE_1" -> "Tầng 1 - Sảnh Chính";
            case "ZONE_2" -> "Tầng 2 - Ban Công";
            case "VIP" -> "Phòng VIP";
            default -> table.getZone();
        };

        String statusText = switch (table.getStatus()) {
            case AVAILABLE -> "Bàn Trống";
            case OCCUPIED -> "Đang Phục Vụ";
            case DIRTY -> "Cần Dọn";
            case RESERVED -> "Đã Đặt";
            case BLOCKED -> "Đã Khóa / Bảo Trì";
        };

        // Khởi tạo các giá trị vận hành thời gian thực
        Integer guests = 0;
        BigDecimal currentBill = BigDecimal.ZERO;
        String timeIn = null;
        Long activeSessionId = null;

        // Nếu bàn đang OCCUPIED -> tìm phiên ăn ACTIVE để lấy thông tin khách và tổng tiền
        if (table.getStatus() == TableStatus.OCCUPIED) {
            Optional<DiningSession> sessionOpt = diningSessionRepository.findByTableIdAndStatus(table.getId(), SessionStatus.ACTIVE);
            if (sessionOpt.isPresent()) {
                DiningSession session = sessionOpt.get();
                activeSessionId = session.getId();
                guests = session.getGuestCount() != null ? session.getGuestCount() : table.getCapacity();
                if (session.getStartTime() != null) {
                    timeIn = session.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm"));
                }

                // Tính tổng hóa đơn từ tất cả các đơn hàng thuộc phiên ăn này
                List<Order> orders = orderRepository.findBySessionId(session.getId());
                currentBill = orders.stream()
                        .map(Order::getTotalAmount)
                        .filter(amount -> amount != null)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            }
        }

        // Tạo URL ảnh mã QR (sử dụng API QR server chuẩn hoặc domain hệ thống)
        String qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" +
                "https://roms.restaurant/dining/welcome?table=" + table.getId() + "%26token=" + table.getQrToken();

        return TableResponse.builder()
                .id(table.getId())
                .code(table.getTableNumber())
                .name(table.getName())
                .zone(table.getZone())
                .zoneName(zoneName)
                .capacity(table.getCapacity())
                .status(table.getStatus())
                .statusText(statusText)
                .guests(guests)
                .currentBill(currentBill)
                .timeIn(timeIn)
                .activeSessionId(activeSessionId)
                .reservationInfo(table.getReservationInfo())
                .reservedTime(table.getReservedTime())
                .blockedReason(table.getBlockedReason())
                .qrToken(table.getQrToken())
                .qrUrl(qrUrl)
                .isActive(table.getIsActive())
                .updatedAt(table.getUpdatedAt())
                .build();
    }
    @Override
    @Transactional(readOnly = true)
    public TableOrdersResponse getTableActiveOrders(Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại: " + tableId));

        Optional<DiningSession> sessionOpt = diningSessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE);
        if (sessionOpt.isEmpty()) {
            return TableOrdersResponse.builder()
                    .tableId(table.getId())
                    .tableNumber(table.getTableNumber())
                    .tableName(table.getName())
                    .zoneName(table.getZone())
                    .totalAmount(BigDecimal.ZERO)
                    .totalItems(0)
                    .items(Collections.emptyList())
                    .build();
        }

        DiningSession session = sessionOpt.get();
        List<Order> orders = orderRepository.findBySessionId(session.getId());

        List<TableOrdersResponse.OrderItemDetail> items = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        int pending = 0, cooking = 0, ready = 0, served = 0;

        for (Order order : orders) {
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    String statusStr = item.getStatus() != null ? item.getStatus().name() : "PENDING";
                    String statusText = switch (statusStr) {
                        case "COOKING" -> "Đang nấu";
                        case "READY" -> "Đã nấu xong";
                        case "SERVED" -> "Đã lên bàn";
                        case "CANCELLED" -> "Đã hủy";
                        default -> "Chờ bếp nhận";
                    };

                    if ("PENDING".equals(statusStr)) pending += item.getQuantity();
                    else if ("COOKING".equals(statusStr)) cooking += item.getQuantity();
                    else if ("READY".equals(statusStr)) ready += item.getQuantity();
                    else if ("SERVED".equals(statusStr)) served += item.getQuantity();

                    BigDecimal subtotal = item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO;
                    totalAmount = totalAmount.add(subtotal);

                    items.add(TableOrdersResponse.OrderItemDetail.builder()
                            .orderItemId(item.getId())
                            .orderCode(order.getOrderCode())
                            .itemName(item.getMenuItem() != null ? item.getMenuItem().getName() : "Món chưa đặt tên")
                            .imageUrl(item.getMenuItem() != null ? item.getMenuItem().getImageUrl() : null)
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .subtotal(subtotal)
                            .note(item.getNote())
                            .status(statusStr)
                            .statusText(statusText)
                            .build());
                }
            }
        }

        long duration = 0;
        if (session.getStartTime() != null) {
            duration = java.time.Duration.between(session.getStartTime(), java.time.LocalDateTime.now()).toMinutes();
        }

        return TableOrdersResponse.builder()
                .tableId(table.getId())
                .tableNumber(table.getTableNumber())
                .tableName(table.getName())
                .zoneName(table.getZone())
                .sessionId(session.getId())
                .sessionToken(session.getSessionToken())
                .guestCount(session.getGuestCount())
                .timeIn(session.getStartTime() != null ? session.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm")) : "--:--")
                .durationMinutes(Math.max(0, duration))
                .totalItems(items.size())
                .pendingItems(pending)
                .cookingItems(cooking)
                .readyItems(ready)
                .servedItems(served)
                .totalAmount(totalAmount)
                .items(items)
                .build();
    }
}
