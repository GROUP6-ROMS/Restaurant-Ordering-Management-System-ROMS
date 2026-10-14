package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.CreateTableRequest;
import com.romsteam.roms.dto.request.UpdateTableRequest;
import com.romsteam.roms.dto.request.UpdateTableStatusRequest;
import com.romsteam.roms.dto.response.TableOrdersResponse;
import com.romsteam.roms.dto.response.TableResponse;
import com.romsteam.roms.dto.response.TableSummaryResponse;
import com.romsteam.roms.entity.DiningSession;
import com.romsteam.roms.entity.Order;
import com.romsteam.roms.entity.OrderItem;
import com.romsteam.roms.entity.RestaurantTable;
import com.romsteam.roms.entity.enums.OrderItemStatus;
import com.romsteam.roms.entity.enums.OrderStatus;
import com.romsteam.roms.entity.enums.SessionStatus;
import com.romsteam.roms.entity.enums.TableStatus;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.exception.ResourceNotFoundException;
import java.time.LocalDateTime;
import com.romsteam.roms.entity.Zone;
import com.romsteam.roms.entity.ServiceRequest;
import com.romsteam.roms.repository.DiningSessionRepository;
import com.romsteam.roms.repository.OrderRepository;
import com.romsteam.roms.repository.RestaurantTableRepository;
import com.romsteam.roms.repository.ServiceRequestRepository;
import com.romsteam.roms.repository.ZoneRepository;
import com.romsteam.roms.service.RestaurantTableService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RestaurantTableServiceImpl implements RestaurantTableService {

    private final RestaurantTableRepository tableRepository;
    private final DiningSessionRepository diningSessionRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final com.romsteam.roms.repository.MenuItemRepository menuItemRepository;
    private final ZoneRepository zoneRepository;
    private final ServiceRequestRepository serviceRequestRepository;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendBaseUrl;

    // ===================================================================
    // 1. TÍNH TOÁN DỮ LIỆU 5 THẺ KPI THỐNG KÊ
    // ===================================================================
    @Override
    @Transactional(readOnly = true)
    public TableSummaryResponse getTableSummary() {
        long totalTables = tableRepository.countByIsActiveTrue();
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
    // 4.1. CHỈNH SỬA THÔNG TIN BÀN ĂN (MÃ BÀN, TÊN BÀN, KHU VỰC, SỨC CHỨA)
    // ===================================================================
    @Override
    @Transactional
    public TableResponse updateTable(Long id, UpdateTableRequest request) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn ăn không tồn tại với ID: " + id));

        String cleanCode = request.getTableNumber().trim().toUpperCase();

        // Kiểm tra xem mã bàn mới có bị trùng với bàn khác không
        if (tableRepository.existsByTableNumberAndIdNot(cleanCode, id)) {
            throw new AppException("Mã bàn '" + cleanCode + "' đã tồn tại ở một bàn khác trong hệ thống!", HttpStatus.CONFLICT);
        }

        // Nếu bàn đang phục vụ khách, không cho phép giảm sức chứa xuống dưới số khách hiện tại
        if (table.getStatus() == TableStatus.OCCUPIED) {
            Optional<DiningSession> activeSession = diningSessionRepository.findByTableIdAndStatus(id, SessionStatus.ACTIVE);
            if (activeSession.isPresent()) {
                int currentGuests = activeSession.get().getGuestCount() != null ? activeSession.get().getGuestCount() : 1;
                if (request.getCapacity() < currentGuests) {
                    throw new AppException(
                            String.format("Không thể giảm sức chứa xuống %d chỗ vì bàn đang có %d khách đang ngồi dùng bữa!",
                                    request.getCapacity(), currentGuests),
                            HttpStatus.BAD_REQUEST
                    );
                }
            }
        }

        String displayName = (request.getName() != null && !request.getName().trim().isEmpty())
                ? request.getName().trim()
                : "Bàn " + cleanCode;

        table.setTableNumber(cleanCode);
        table.setName(displayName);
        table.setZone(request.getZone());
        table.setCapacity(request.getCapacity());

        RestaurantTable updated = tableRepository.save(table);
        return mapToTableResponse(updated);
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
        Optional<DiningSession> activeSessionOpt = diningSessionRepository.findByTableIdAndStatus(id, SessionStatus.ACTIVE);

        // 1. Nếu bàn đang OCCUPIED và muốn chuyển sang trạng thái khác (AVAILABLE, BLOCKED, RESERVED, DIRTY)
        if (table.getStatus() == TableStatus.OCCUPIED && targetStatus != TableStatus.OCCUPIED) {
            if (activeSessionOpt.isPresent()) {
                DiningSession activeSession = activeSessionOpt.get();
                List<Order> orders = orderRepository.findBySessionId(activeSession.getId());
                boolean hasActiveOrders = orders.stream().anyMatch(o -> o.getStatus() != OrderStatus.CANCELLED);
                if (hasActiveOrders) {
                    throw new AppException("Bàn đang có đơn gọi món chưa hoàn tất thanh toán! Vui lòng thanh toán hóa đơn POS hoặc hủy đơn trước khi đổi trạng thái bàn.", HttpStatus.BAD_REQUEST);
                }
                // Đóng phiên ăn an toàn nếu chuyển về Trống, Đã dọn hoặc Khóa (khi không còn đơn món dở dang)
                activeSession.setStatus(SessionStatus.COMPLETED);
                activeSession.setEndTime(LocalDateTime.now());
                diningSessionRepository.save(activeSession);
            }
        }

        // 2. Nếu chuyển sang OCCUPIED (Đang phục vụ)
        if (targetStatus == TableStatus.OCCUPIED) {
            if (activeSessionOpt.isEmpty()) {
                String sessionToken = "sess-" + table.getTableNumber().toLowerCase() + "-" + UUID.randomUUID().toString().substring(0, 8);
                DiningSession newSession = new DiningSession();
                newSession.setTable(table);
                newSession.setSessionToken(sessionToken);
                newSession.setStatus(SessionStatus.ACTIVE);
                int guests = (request.getGuestsCount() != null && request.getGuestsCount() > 0) ? request.getGuestsCount() : table.getCapacity();
                newSession.setGuestCount(guests);
                newSession.setStartTime(LocalDateTime.now());
                newSession.setNote("Quản lý mở bàn trực tiếp");
                diningSessionRepository.save(newSession);
            }
            table.setBlockedReason(null);
            table.setReservationInfo(null);
            table.setReservedTime(null);
        } else if (targetStatus == TableStatus.BLOCKED) {
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

        table.setStatus(targetStatus);
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

        if (table.getStatus() == TableStatus.BLOCKED) {
            String reason = table.getBlockedReason() != null ? table.getBlockedReason() : "Bảo trì kỹ thuật";
            throw new AppException("Bàn ăn này hiện đang tạm khóa (" + reason + ")! Vui lòng liên hệ nhân viên phục vụ.", HttpStatus.FORBIDDEN);
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
        // Giải phóng mã hiệu bàn để tránh xung đột Unique Constraint khi tạo lại bàn trùng mã số sau này
        table.setTableNumber(table.getTableNumber() + "_DEL_" + table.getId());
        tableRepository.save(table);
    }

    // ===================================================================
    // HÀM HELPER: ÁNH XẠ ENTITY SANG DTO VÀ TÍNH TIỀN HÓA ĐƠN THỜI GIAN THỰC
    // ===================================================================
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

    private TableResponse mapToTableResponse(RestaurantTable table) {
        String zoneName = resolveZoneName(table.getZone());

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
        Long durationMinutes = 0L;
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
                    durationMinutes = Math.max(0, java.time.Duration.between(session.getStartTime(), LocalDateTime.now()).toMinutes());
                }

                // Tính tổng hóa đơn từ tất cả các đơn hàng thuộc phiên ăn này (chỉ tính món không bị hủy)
                List<Order> orders = orderRepository.findBySessionId(session.getId());
                currentBill = orders.stream()
                        .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                        .flatMap(o -> o.getItems() != null ? o.getItems().stream() : java.util.stream.Stream.empty())
                        .filter(item -> item.getStatus() != OrderItemStatus.CANCELLED)
                        .map(OrderItem::getSubtotal)
                        .filter(java.util.Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            }
        }

        // Kiểm tra xem bàn có yêu cầu phục vụ / xin tính tiền đang PENDING không
        Long pendingServiceRequestId = null;
        String pendingServiceRequestType = null;
        String pendingServiceRequestNote = null;
        String pendingServiceRequestCreatedAt = null;
        Long pendingServiceRequestElapsedMinutes = 0L;
        Integer pendingServiceRequestCount = 0;

        List<ServiceRequest> pendingRequests = serviceRequestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(table.getId(), "PENDING");
        if (pendingRequests != null && !pendingRequests.isEmpty()) {
            pendingServiceRequestCount = pendingRequests.size();
            ServiceRequest latestReq = pendingRequests.get(0);
            pendingServiceRequestId = latestReq.getId();
            pendingServiceRequestType = latestReq.getRequestType();
            pendingServiceRequestNote = latestReq.getNote();
            if (latestReq.getCreatedAt() != null) {
                pendingServiceRequestCreatedAt = latestReq.getCreatedAt().format(DateTimeFormatter.ofPattern("HH:mm"));
                pendingServiceRequestElapsedMinutes = Math.max(0, java.time.Duration.between(latestReq.getCreatedAt(), LocalDateTime.now()).toMinutes());
            }
        }

        // Tạo link gọi món thực tế dẫn tới màn hình chào bàn của khách
        String baseUrl = (frontendBaseUrl != null && !frontendBaseUrl.trim().isEmpty())
                ? frontendBaseUrl.trim()
                : "http://localhost:5173";
        String targetDiningUrl = baseUrl + "/dining/welcome?table=" + table.getId() + "&token=" + table.getQrToken();

        // Tạo URL ảnh mã QR (sử dụng API QR server chuẩn mã hóa UTF-8)
        String qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" +
                URLEncoder.encode(targetDiningUrl, StandardCharsets.UTF_8);

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
                .durationMinutes(durationMinutes)
                .activeSessionId(activeSessionId)
                .reservationInfo(table.getReservationInfo())
                .reservedTime(table.getReservedTime())
                .blockedReason(table.getBlockedReason())
                .pendingServiceRequestId(pendingServiceRequestId)
                .pendingServiceRequestType(pendingServiceRequestType)
                .pendingServiceRequestNote(pendingServiceRequestNote)
                .pendingServiceRequestCreatedAt(pendingServiceRequestCreatedAt)
                .pendingServiceRequestElapsedMinutes(pendingServiceRequestElapsedMinutes)
                .pendingServiceRequestCount(pendingServiceRequestCount)
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
                    .zoneName(resolveZoneName(table.getZone()))
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
            if (order.getStatus() == OrderStatus.CANCELLED) continue;
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
                    if (item.getStatus() != OrderItemStatus.CANCELLED) {
                        totalAmount = totalAmount.add(subtotal);
                    }

                    items.add(TableOrdersResponse.OrderItemDetail.builder()
                            .orderItemId(item.getId())
                            .menuItemId(item.getMenuItem() != null ? item.getMenuItem().getId() : null)
                            .orderId(order.getId())
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
                .zoneName(resolveZoneName(table.getZone()))
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

    // ===================================================================
    // 9. QUẢN LÝ XÁC NHẬN ĐÃ XỬ LÝ CHUÔNG GỌI PHỤC VỤ TẠI BÀN
    // ===================================================================
    @Override
    @Transactional
    public void resolveServiceRequest(Long requestId) {
        ServiceRequest req = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu phục vụ không tồn tại với ID: " + requestId));
        req.setStatus("RESOLVED");
        serviceRequestRepository.save(req);
    }

    // ===================================================================
    // 10. QUẢN LÝ XÁC NHẬN XỬ LÝ TOÀN BỘ YÊU CẦU CỦA 1 BÀN ĂN
    // ===================================================================
    @Override
    @Transactional
    public void resolveAllRequestsForTable(Long tableId) {
        List<ServiceRequest> pendingRequests = serviceRequestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(tableId, "PENDING");
        for (ServiceRequest req : pendingRequests) {
            req.setStatus("RESOLVED");
            serviceRequestRepository.save(req);
        }
    }

    // ===================================================================
    // 11. QUẢN LÝ THÊM MÓN TRỰC TIẾP VÀO BÀN ĂN
    // ===================================================================
    @Override
    @Transactional
    public TableOrdersResponse addItemsToTable(Long tableId, com.romsteam.roms.dto.request.WaiterAddOrderRequest request) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn ăn không tồn tại với ID: " + tableId));

        DiningSession session = diningSessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE)
                .orElseGet(() -> {
                    DiningSession newSession = new DiningSession();
                    newSession.setTable(table);
                    newSession.setSessionToken(UUID.randomUUID().toString());
                    newSession.setGuestCount(table.getCapacity() != null ? table.getCapacity() : 2);
                    newSession.setStartTime(LocalDateTime.now());
                    newSession.setStatus(SessionStatus.ACTIVE);
                    return diningSessionRepository.save(newSession);
                });

        if (session.getNote() != null && session.getNote().contains("[DRAFT_PRINTED]")) {
            String cleaned = session.getNote().replace("[DRAFT_PRINTED]", "").trim();
            session.setNote(cleaned.isEmpty() ? null : cleaned);
            diningSessionRepository.save(session);
        }

        String orderCode = "ORD-" + table.getTableNumber() + "-" + (System.currentTimeMillis() % 10000);
        Order newOrder = new Order();
        newOrder.setSession(session);
        newOrder.setOrderCode(orderCode);
        newOrder.setOrderTime(LocalDateTime.now());
        newOrder.setNote(request.getNote());

        BigDecimal totalOrderAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();
        boolean hasCookingItems = false;

        for (com.romsteam.roms.dto.request.WaiterAddOrderRequest.WaiterOrderItemRequest itemReq : request.getItems()) {
            com.romsteam.roms.entity.MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Món ăn không tồn tại với ID: " + itemReq.getMenuItemId()));

            if (!menuItem.getIsAvailable()) {
                throw new AppException("Món '" + menuItem.getName() + "' hiện đã tạm hết hàng!", HttpStatus.BAD_REQUEST);
            }

            int qty = itemReq.getQuantity() != null && itemReq.getQuantity() > 0 ? itemReq.getQuantity() : 1;
            BigDecimal unitPrice = menuItem.getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(qty));
            totalOrderAmount = totalOrderAmount.add(subtotal);

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

        return getTableActiveOrders(tableId);
    }

    // ===================================================================
    // 12. QUẢN LÝ ĐIỀU CHỈNH SỐ LƯỢNG MÓN ĂN TẠI BÀN
    // ===================================================================
    @Override
    @Transactional
    public TableOrdersResponse updateOrderItemQuantity(Long orderItemId, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new AppException("Số lượng món phải lớn hơn 0! Để hủy món, vui lòng chọn thao tác Hủy món.", HttpStatus.BAD_REQUEST);
        }

        OrderItem item = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với ID: " + orderItemId));

        if (item.getStatus() == OrderItemStatus.CANCELLED) {
            throw new AppException("Món ăn này đã bị hủy, không thể chỉnh sửa số lượng!", HttpStatus.BAD_REQUEST);
        }

        item.setQuantity(quantity);
        item.setSubtotal(item.getUnitPrice().multiply(BigDecimal.valueOf(quantity)));
        orderItemRepository.save(item);

        Order order = item.getOrder();
        if (order != null && order.getItems() != null) {
            BigDecimal recalculatedTotal = order.getItems().stream()
                    .filter(i -> i.getStatus() != OrderItemStatus.CANCELLED)
                    .map(i -> i.getSubtotal() != null ? i.getSubtotal() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            order.setTotalAmount(recalculatedTotal);
            orderRepository.save(order);
        }

        Long tableId = order.getSession().getTable().getId();
        return getTableActiveOrders(tableId);
    }

    // ===================================================================
    // 13. QUẢN LÝ HỦY MÓN ĂN TẠI BÀN KÈM LÝ DO
    // ===================================================================
    @Override
    @Transactional
    public TableOrdersResponse cancelOrderItem(Long orderItemId, String reason) {
        OrderItem item = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với ID: " + orderItemId));

        if (item.getStatus() == OrderItemStatus.CANCELLED) {
            throw new AppException("Món ăn này đã được hủy trước đó!", HttpStatus.BAD_REQUEST);
        }

        item.setStatus(OrderItemStatus.CANCELLED);
        String reasonStr = (reason != null && !reason.trim().isEmpty()) ? reason.trim() : "Quản lý hủy";
        String existingNote = item.getNote() != null ? item.getNote() + " - " : "";
        item.setNote(existingNote + "[HỦY BỞI QUẢN LÝ: " + reasonStr + "]");
        orderItemRepository.save(item);

        Order order = item.getOrder();
        if (order != null && order.getItems() != null) {
            BigDecimal recalculatedTotal = order.getItems().stream()
                    .filter(i -> i.getStatus() != OrderItemStatus.CANCELLED)
                    .map(i -> i.getSubtotal() != null ? i.getSubtotal() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            order.setTotalAmount(recalculatedTotal);

            boolean allCancelled = order.getItems().stream().allMatch(i -> i.getStatus() == OrderItemStatus.CANCELLED);
            if (allCancelled) {
                order.setStatus(OrderStatus.CANCELLED);
            }
            orderRepository.save(order);
        }

        Long tableId = order.getSession().getTable().getId();
        return getTableActiveOrders(tableId);
    }
}
