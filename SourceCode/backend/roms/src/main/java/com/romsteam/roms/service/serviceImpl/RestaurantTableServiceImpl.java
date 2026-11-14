package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.CreateTableRequest;
import com.romsteam.roms.dto.request.MergeTableRequest;
import com.romsteam.roms.dto.request.TransferTableRequest;
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
import com.romsteam.roms.entity.MenuItem;
import com.romsteam.roms.entity.Reservation;
import com.romsteam.roms.entity.ReservationItem;
import com.romsteam.roms.entity.Zone;
import com.romsteam.roms.entity.ServiceRequest;
import com.romsteam.roms.entity.enums.ReservationStatus;
import java.time.LocalDateTime;
import com.romsteam.roms.repository.DiningSessionRepository;
import com.romsteam.roms.repository.OrderRepository;
import com.romsteam.roms.repository.OrderItemRepository;
import com.romsteam.roms.repository.ReservationItemRepository;
import com.romsteam.roms.repository.ReservationRepository;
import com.romsteam.roms.repository.RestaurantTableRepository;
import com.romsteam.roms.repository.ServiceRequestRepository;
import com.romsteam.roms.repository.ZoneRepository;
import com.romsteam.roms.service.RestaurantTableService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

@Slf4j
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
    private final ReservationRepository reservationRepository;
    private final ReservationItemRepository reservationItemRepository;
    private final com.romsteam.roms.security.JwtTokenProvider jwtTokenProvider;
    private final com.romsteam.roms.service.RealtimeService realtimeService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.cache.CacheManager cacheManager;

    @Value("${app.frontend.url:http://roms-restaurant.duckdns.org}")
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

        String displayName = cleanCode;

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

        String displayName = cleanCode;

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

        // 2. Nếu bàn đang RESERVED và được chuyển sang OCCUPIED (Đón khách đặt trước / Khách đặt trước đến)
        if (table.getStatus() == TableStatus.RESERVED && targetStatus == TableStatus.OCCUPIED) {
            List<Reservation> resList = reservationRepository.findByTableIdAndStatusOrderByReservationTimeAsc(id, ReservationStatus.CONFIRMED);
            if (resList.isEmpty()) {
                resList = reservationRepository.findByTableIdAndStatusOrderByReservationTimeAsc(id, ReservationStatus.PENDING);
            }
            if (!resList.isEmpty()) {
                return checkInReservationForTable(id, resList.get(0).getId());
            }
        }

        // 3. Nếu chuyển sang OCCUPIED (Đang phục vụ)
        if (targetStatus == TableStatus.OCCUPIED) {
            LocalDateTime now = LocalDateTime.now();
            List<Reservation> confirmedList = reservationRepository.findByTableIdAndStatusOrderByReservationTimeAsc(id, ReservationStatus.CONFIRMED);

            // Kiểm tra Khóa An Toàn Đón Khách Đặt Trước (Buffer Time Lock)
            if (request.getForceOverride() == null || !request.getForceOverride()) {
                if (confirmedList != null && !confirmedList.isEmpty()) {
                    for (Reservation r : confirmedList) {
                        if (r.getReservationTime() == null) continue;
                        LocalDateTime startLock = r.getReservationTime().minusMinutes(60);
                        LocalDateTime endLock = r.getReservationTime().plusMinutes(45);
                        if (now.isAfter(startLock) && now.isBefore(endLock)) {
                            long diff = java.time.Duration.between(now, r.getReservationTime()).toMinutes();
                            String timeStr = r.getReservationTime().format(DateTimeFormatter.ofPattern("HH:mm"));
                            String prompt = diff > 0 ? ("còn " + diff + " phút nữa") : ("đã đến giờ hẹn");
                            throw new AppException(
                                    "BÀN ĐANG ĐƯỢC KHÓA AN TOÀN! Bàn này đang giữ chỗ cho khách đặt: " +
                                    r.getCustomerName() + " (" + r.getCustomerPhone() + " - " + r.getGuestCount() + " khách) lúc " +
                                    timeStr + " (" + prompt + "). Không thể xếp khách vãng lai trừ khi Quản lý chọn 'Mở cưỡng chế'!",
                                    HttpStatus.BAD_REQUEST
                            );
                        }
                    }
                }
            } else {
                // Quản lý xác nhận MỞ CƯỠNG CHẾ: Tự động hủy đơn đặt bàn trong khung Buffer Lock (Khách quá giờ / No-Show)
                if (confirmedList != null && !confirmedList.isEmpty()) {
                    for (Reservation r : confirmedList) {
                        if (r.getReservationTime() == null) continue;
                        LocalDateTime startLock = r.getReservationTime().minusMinutes(60);
                        LocalDateTime endLock = r.getReservationTime().plusMinutes(45);
                        if (now.isAfter(startLock) && now.isBefore(endLock)) {
                            r.setStatus(ReservationStatus.CANCELLED);
                            r.setCancelReason("Tự động hủy do Quản lý mở cưỡng chế bàn cho khách vãng lai (Khách quá giờ hẹn / No-Show)");
                            r.setTable(null);
                            reservationRepository.save(r);
                            log.warn("[BufferLock Override] Đã tự động hủy đơn đặt bàn #{} ({}) của khách {} do Quản lý mở cưỡng chế bàn {}",
                                    r.getId(), r.getBookingCode(), r.getCustomerName(), table.getTableNumber());
                        }
                    }
                }
            }

            if (activeSessionOpt.isEmpty()) {
                String sessionToken = "sess-" + table.getTableNumber().toLowerCase() + "-" + UUID.randomUUID().toString().substring(0, 8);
                DiningSession newSession = new DiningSession();
                newSession.setTable(table);
                newSession.setSessionToken(sessionToken);
                newSession.setStatus(SessionStatus.ACTIVE);
                int guests = (request.getGuestsCount() != null && request.getGuestsCount() > 0) ? request.getGuestsCount() : table.getCapacity();
                newSession.setGuestCount(guests);
                newSession.setStartTime(LocalDateTime.now());
                boolean isForce = Boolean.TRUE.equals(request.getForceOverride());
                newSession.setNote(isForce ? "Quản lý mở cưỡng chế bỏ qua khóa an toàn đặt bàn" : "Quản lý mở bàn trực tiếp");
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

        try {
            realtimeService.notifyTableUpdate(updated.getId(), updated.getTableNumber(), targetStatus.name(), "Cập nhật trạng thái bàn");
        } catch (Exception e) {
            log.warn("[Realtime] Lỗi broadcast updateTableStatus bàn {}: {}", updated.getTableNumber(), e.getMessage());
        }

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

        TableResponse response = mapToTableResponse(table);
        // Chỉ cấp Dining JWT Token nếu bàn đang được nhân viên mở phiên phục vụ (OCCUPIED)
        if (table.getStatus() == TableStatus.OCCUPIED && response.getActiveSessionId() != null) {
            String diningToken = jwtTokenProvider.generateDiningToken(table.getId(), table.getTableNumber());
            response.setDiningToken(diningToken);
        } else {
            response.setDiningToken(null);
        }

        return response;
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

        // Kiểm tra Khóa An Toàn Đón Khách Đặt Trước (Buffer Time Lock)
        Boolean isBufferLocked = false;
        Long bufferLockMinutesRemaining = null;
        String bufferLockTargetTime = null;
        String bufferLockCustomer = null;
        Long bufferLockReservationId = null;
        String bufferLockBookingCode = null;
        Integer bufferLockPreOrderCount = 0;
        Integer bufferLockGuestCount = null;
        Reservation nextUpcomingRes = null;

        List<Reservation> confirmedReservations = reservationRepository.findByTableIdAndStatusOrderByReservationTimeAsc(table.getId(), ReservationStatus.CONFIRMED);
        if (confirmedReservations != null && !confirmedReservations.isEmpty()) {
            LocalDateTime nowTime = LocalDateTime.now();
            Reservation activeBufferRes = null;

            for (Reservation r : confirmedReservations) {
                if (r.getReservationTime() == null) continue;
                LocalDateTime startLock = r.getReservationTime().minusMinutes(60);
                LocalDateTime endLock = r.getReservationTime().plusMinutes(45);

                boolean inBufferWindow = (nowTime.isEqual(startLock) || nowTime.isAfter(startLock))
                        && (nowTime.isEqual(endLock) || nowTime.isBefore(endLock));

                if (inBufferWindow) {
                    activeBufferRes = r;
                    break;
                } else if (r.getReservationTime().isAfter(nowTime) && nextUpcomingRes == null) {
                    nextUpcomingRes = r;
                }
            }

            if (activeBufferRes != null) {
                isBufferLocked = true;
                bufferLockReservationId = activeBufferRes.getId();
                bufferLockBookingCode = activeBufferRes.getBookingCode();
                bufferLockMinutesRemaining = java.time.Duration.between(nowTime, activeBufferRes.getReservationTime()).toMinutes();
                bufferLockTargetTime = activeBufferRes.getReservationTime().format(DateTimeFormatter.ofPattern("HH:mm"));
                bufferLockCustomer = activeBufferRes.getCustomerName() + " (" + activeBufferRes.getCustomerPhone() + ")";
                bufferLockGuestCount = activeBufferRes.getGuestCount();
                if (activeBufferRes.getItems() != null) {
                    bufferLockPreOrderCount = activeBufferRes.getItems().stream()
                            .mapToInt(it -> it.getQuantity() != null ? it.getQuantity() : 0)
                            .sum();
                }
            } else if (nextUpcomingRes != null) {
                // Đơn đặt tiếp theo trong tương lai (> 60 phút). Bàn CHƯA khóa đón khách để tiếp tục phục vụ khách khác
                isBufferLocked = false;
                bufferLockMinutesRemaining = java.time.Duration.between(nowTime, nextUpcomingRes.getReservationTime()).toMinutes();
                bufferLockTargetTime = nextUpcomingRes.getReservationTime().format(DateTimeFormatter.ofPattern("HH:mm"));
                bufferLockCustomer = nextUpcomingRes.getCustomerName() + " (" + nextUpcomingRes.getCustomerPhone() + ")";
                bufferLockReservationId = nextUpcomingRes.getId();
                bufferLockBookingCode = nextUpcomingRes.getBookingCode();
                bufferLockGuestCount = nextUpcomingRes.getGuestCount();
                if (nextUpcomingRes.getItems() != null) {
                    bufferLockPreOrderCount = nextUpcomingRes.getItems().stream()
                            .mapToInt(it -> it.getQuantity() != null ? it.getQuantity() : 0)
                            .sum();
                }
            }
        }

        // Trường hợp bàn được Quản lý set RESERVED thủ công qua modal (không qua đơn đặt bàn)
        if (!isBufferLocked && table.getStatus() == TableStatus.RESERVED && bufferLockTargetTime == null) {
            isBufferLocked = true;
            bufferLockTargetTime = table.getReservedTime();
            bufferLockCustomer = table.getReservationInfo();
        }

        // Xác định trạng thái phản hồi hiệu lực:
        // 1. Nếu bàn đang trong khung khóa an toàn (isBufferLocked):
        //    Nếu bàn đang AVAILABLE -> hiển thị RESERVED ("Đã Đặt")
        // 2. Nếu bàn KHÔNG trong khung khóa an toàn (!isBufferLocked):
        //    Nếu trong DB bàn đang mang trạng thái RESERVED do đơn đặt trước (nhưng giờ hẹn còn xa > 60'),
        //    thì bàn thực tế vẫn là AVAILABLE ("Bàn Trống") để phục vụ khách vãng lai,
        //    chỉ hiển thị banner thông tin lịch hẹn tiếp theo (bufferLockTargetTime).
        TableStatus responseStatus = table.getStatus();
        String responseStatusText = statusText;
        if (isBufferLocked) {
            if (responseStatus == TableStatus.AVAILABLE) {
                responseStatus = TableStatus.RESERVED;
                responseStatusText = "Đã Đặt";
            }
        } else {
            if (responseStatus == TableStatus.RESERVED && nextUpcomingRes != null) {
                responseStatus = TableStatus.AVAILABLE;
                responseStatusText = "Bàn Trống";
                table.setStatus(TableStatus.AVAILABLE);
                tableRepository.save(table);
            }
        }

        // Tạo link gọi món thực tế dẫn tới màn hình chào bàn của khách (ưu tiên domain công khai)
        String baseUrl = (frontendBaseUrl != null && !frontendBaseUrl.trim().isEmpty() && !frontendBaseUrl.contains("localhost"))
                ? frontendBaseUrl.trim()
                : "http://roms-restaurant.duckdns.org";
        String targetDiningUrl = baseUrl + "/dining/welcome?table=" + table.getId() + "&token=" + table.getQrToken();

        // Tạo URL ảnh mã QR (sử dụng API QR server chuẩn mã hóa UTF-8)
        String qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" +
                URLEncoder.encode(targetDiningUrl, StandardCharsets.UTF_8);

        return TableResponse.builder()
                .id(table.getId())
                .code(table.getTableNumber())
                .name(table.getTableNumber())
                .zone(table.getZone())
                .zoneName(zoneName)
                .capacity(table.getCapacity())
                .status(responseStatus)
                .statusText(responseStatusText)
                .guests(guests)
                .currentBill(currentBill)
                .timeIn(timeIn)
                .durationMinutes(durationMinutes)
                .activeSessionId(activeSessionId)
                .reservationInfo(table.getReservationInfo())
                .reservedTime(table.getReservedTime())
                .blockedReason(table.getBlockedReason())
                .isBufferLocked(isBufferLocked)
                .bufferLockMinutesRemaining(bufferLockMinutesRemaining)
                .bufferLockTargetTime(bufferLockTargetTime)
                .bufferLockCustomer(bufferLockCustomer)
                .bufferLockReservationId(bufferLockReservationId)
                .bufferLockBookingCode(bufferLockBookingCode)
                .bufferLockPreOrderCount(bufferLockPreOrderCount)
                .bufferLockGuestCount(bufferLockGuestCount)
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
                    .tableName(table.getTableNumber())
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
            duration = Math.max(0L, java.time.Duration.between(session.getStartTime(), java.time.LocalDateTime.now()).toMinutes());
        }

        return TableOrdersResponse.builder()
                .tableId(table.getId())
                .tableNumber(table.getTableNumber())
                .tableName(table.getTableNumber())
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

        try {
            realtimeService.notifyServiceRequest(req.getId(), req.getTable() != null ? req.getTable().getId() : null,
                    req.getTable() != null ? req.getTable().getTableNumber() : "N/A", req.getRequestType(), "RESOLVED");
        } catch (Exception e) {
            log.warn("[Realtime] Lỗi broadcast resolveServiceRequest: {}", e.getMessage());
        }
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

        String orderCode = "ORD-" + table.getTableNumber() + "-" + (System.currentTimeMillis() % 100000) + "-" + (100 + new java.util.Random().nextInt(900));
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

        int oldQuantity = item.getQuantity() != null ? item.getQuantity() : 0;
        int diff = quantity - oldQuantity;
        if (diff < 0) {
            // Giảm số lượng -> hoàn lại vào kho (-diff phần) (Stock Restitution - Issue #60)
            restoreStockForQuantity(item.getMenuItem() != null ? item.getMenuItem().getId() : null, -diff);
        } else if (diff > 0) {
            // Tăng số lượng -> kiểm tra tồn kho và trừ thêm diff phần
            deductStockForQuantity(item.getMenuItem() != null ? item.getMenuItem().getId() : null, diff);
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

        Long tableId = (order != null && order.getSession() != null && order.getSession().getTable() != null)
                ? order.getSession().getTable().getId() : null;
        return (tableId != null) ? getTableActiveOrders(tableId) : TableOrdersResponse.builder().build();
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

        // Hoàn lại số lượng tồn kho cho món ăn bị hủy (Stock Restitution - Issue #60)
        restoreItemStock(item);

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

            try {
                Long tblId = (order.getSession() != null && order.getSession().getTable() != null)
                        ? order.getSession().getTable().getId() : null;
                String tblNum = (order.getSession() != null && order.getSession().getTable() != null)
                        ? order.getSession().getTable().getTableNumber() : "Bàn";
                realtimeService.notifyOrderStatus(order.getId(), tblId, tblNum, "CANCELLED", item.getId());
            } catch (Exception ignored) {}
        }

        Long tableId = (order != null && order.getSession() != null && order.getSession().getTable() != null)
                ? order.getSession().getTable().getId() : null;
        return (tableId != null) ? getTableActiveOrders(tableId) : TableOrdersResponse.builder().build();
    }

    // ===================================================================
    // 14. QUẢN LÝ CHECK-IN ĐÓN KHÁCH ĐẶT BÀN TRỰC TIẾP TỪ SƠ ĐỒ BÀN (1-CLICK CHECK-IN)
    // ===================================================================
    @Override
    @Transactional
    public TableResponse checkInReservationForTable(Long tableId, Long reservationId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại với ID: " + tableId));

        Reservation reservation = null;
        if (reservationId != null) {
            reservation = reservationRepository.findById(reservationId).orElse(null);
        }
        if (reservation == null) {
            List<Reservation> confirmed = reservationRepository.findByTableIdAndStatusOrderByReservationTimeAsc(tableId, ReservationStatus.CONFIRMED);
            if (!confirmed.isEmpty()) {
                reservation = confirmed.get(0);
            } else {
                List<Reservation> pending = reservationRepository.findByTableIdAndStatusOrderByReservationTimeAsc(tableId, ReservationStatus.PENDING);
                if (!pending.isEmpty()) {
                    reservation = pending.get(0);
                }
            }
        }

        if (reservation != null) {
            if (reservation.getStatus() == ReservationStatus.CANCELLED) {
                throw new AppException("Đơn đặt bàn này đã bị hủy, không thể nhận bàn!", HttpStatus.BAD_REQUEST);
            }
        }

        // 1. Khởi tạo phiên ăn mới (DiningSession)
        Optional<DiningSession> activeSessionOpt = diningSessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE);
        DiningSession session;
        if (activeSessionOpt.isPresent()) {
            session = activeSessionOpt.get();
        } else {
            String sessionToken = "sess-" + table.getTableNumber().toLowerCase() + "-" + UUID.randomUUID().toString().substring(0, 8);
            session = new DiningSession();
            session.setTable(table);
            session.setSessionToken(sessionToken);
            session.setStatus(SessionStatus.ACTIVE);
            int guests = (reservation != null && reservation.getGuestCount() != null && reservation.getGuestCount() > 0)
                    ? reservation.getGuestCount()
                    : table.getCapacity();
            session.setGuestCount(guests);
            session.setStartTime(LocalDateTime.now());
            session.setNote(reservation != null 
                    ? ("Khách đặt trước: " + reservation.getCustomerName() + " (" + reservation.getBookingCode() + ")")
                    : "Mở bàn đón khách");
            session = diningSessionRepository.save(session);
        }

        // 2. Tự động nạp các món đặt trước (Pre-order items) vào Order mới đẩy xuống Bếp KDS và Nhân viên phục vụ
        if (reservation != null) {
            List<ReservationItem> preOrderItems = reservationItemRepository.findByReservationIdWithMenuItem(reservation.getId());
            if (preOrderItems != null && !preOrderItems.isEmpty()) {
                Order newOrder = new Order();
                newOrder.setSession(session);
                String dateStr = java.time.LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
                String orderCode = "ORD-PRE-" + dateStr + "-" + (1000 + new Random().nextInt(9000));
                newOrder.setOrderCode(orderCode);
                newOrder.setOrderTime(LocalDateTime.now());
                newOrder.setNote("Món đặt trước - Đơn #" + reservation.getBookingCode());

                List<OrderItem> orderItems = new ArrayList<>();
                BigDecimal totalAmount = BigDecimal.ZERO;
                boolean hasCookingItems = false;

                for (ReservationItem resItem : preOrderItems) {
                    if (resItem.getQuantity() == null || resItem.getQuantity() <= 0) continue;
                    MenuItem rawMenuItem = resItem.getMenuItem();
                    if (rawMenuItem == null) continue;
                    MenuItem lockedItem = rawMenuItem.getId() != null
                            ? menuItemRepository.findByIdForUpdate(rawMenuItem.getId()).orElse(rawMenuItem)
                            : rawMenuItem;

                    if (lockedItem.getRemainingStock() != null) {
                        lockedItem.decreaseStock(resItem.getQuantity());
                        menuItemRepository.save(lockedItem);
                        if (cacheManager != null) {
                            org.springframework.cache.Cache cache = cacheManager.getCache("customerMenu");
                            if (cache != null) {
                                cache.clear();
                            }
                        }
                        try {
                            realtimeService.notifyMenuItemAvailability(
                                    lockedItem.getId(),
                                    lockedItem.getName(),
                                    Boolean.TRUE.equals(lockedItem.getIsAvailable()),
                                    lockedItem.getRemainingStock()
                            );
                        } catch (Exception ignored) {}
                    }

                    OrderItem orderItem = new OrderItem();
                    orderItem.setOrder(newOrder);
                    orderItem.setMenuItem(lockedItem);
                    orderItem.setQuantity(resItem.getQuantity());
                    orderItem.setUnitPrice(resItem.getUnitPrice() != null ? resItem.getUnitPrice() : lockedItem.getPrice());
                    BigDecimal subtotal = orderItem.getUnitPrice().multiply(BigDecimal.valueOf(orderItem.getQuantity()));
                    orderItem.setSubtotal(subtotal);
                    orderItem.setNote(resItem.getNote() != null ? resItem.getNote() : "Món đặt trước");

                    boolean isDrink = false;
                    if (lockedItem.getCategory() != null && lockedItem.getCategory().getName() != null) {
                        String catLower = lockedItem.getCategory().getName().toLowerCase();
                        if (catLower.contains("uống") || catLower.contains("drink") || catLower.contains("nước")) {
                            isDrink = true;
                        }
                    }
                    boolean isWaiterStation = "WAITER".equalsIgnoreCase(lockedItem.getStation());

                    if (isDrink || isWaiterStation) {
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

            // 3. Cập nhật trạng thái phiếu đặt bàn sang COMPLETED
            reservation.setStatus(ReservationStatus.COMPLETED);
            reservationRepository.save(reservation);
        }

        // 4. Cập nhật trạng thái bàn sang OCCUPIED và xóa thông tin giữ chỗ
        table.setStatus(TableStatus.OCCUPIED);
        table.setReservationInfo(null);
        table.setReservedTime(null);
        table.setBlockedReason(null);
        RestaurantTable updatedTable = tableRepository.save(table);

        return mapToTableResponse(updatedTable);
    }

    // ===================================================================
    // 15. CHUYỂN BÀN (TABLE TRANSFER)
    // ===================================================================
    @Override
    @Transactional
    public TableResponse transferTable(TransferTableRequest request) {
        if (request.getSourceTableId().equals(request.getTargetTableId())) {
            throw new AppException("Không thể chuyển bàn sang chính nó!", HttpStatus.BAD_REQUEST);
        }

        RestaurantTable sourceTable = tableRepository.findById(request.getSourceTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Bàn nguồn không tồn tại với ID: " + request.getSourceTableId()));
        RestaurantTable targetTable = tableRepository.findById(request.getTargetTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Bàn đích không tồn tại với ID: " + request.getTargetTableId()));

        if (targetTable.getStatus() != TableStatus.AVAILABLE) {
            throw new AppException("Bàn đích (" + targetTable.getTableNumber() + ") phải ở trạng thái Trống (AVAILABLE) mới có thể chuyển đến!", HttpStatus.BAD_REQUEST);
        }

        // Kiểm tra buffer lock của bàn đích (nếu có khách đặt trước trong vòng 60 phút)
        List<Reservation> targetReservations = reservationRepository.findByTableIdAndStatusOrderByReservationTimeAsc(targetTable.getId(), ReservationStatus.CONFIRMED);
        if (targetReservations != null && !targetReservations.isEmpty()) {
            LocalDateTime now = LocalDateTime.now();
            for (Reservation res : targetReservations) {
                if (res.getReservationTime() != null && res.getReservationTime().isAfter(now.minusMinutes(15)) && res.getReservationTime().isBefore(now.plusMinutes(60))) {
                    throw new AppException("Bàn đích đang trong khung giờ khóa an toàn cho đơn đặt bàn #" + res.getBookingCode() + " lúc " + res.getReservationTime().format(DateTimeFormatter.ofPattern("HH:mm")) + "!", HttpStatus.BAD_REQUEST);
                }
            }
        }

        DiningSession session = diningSessionRepository.findByTableIdAndStatus(sourceTable.getId(), SessionStatus.ACTIVE)
                .orElseThrow(() -> new AppException("Bàn nguồn hiện không có phiên ăn đang hoạt động!", HttpStatus.BAD_REQUEST));

        // Cập nhật session sang bàn mới và lưu lịch sử note
        String transferTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
        String reasonStr = (request.getReason() != null && !request.getReason().trim().isEmpty())
                ? " (Lý do: " + request.getReason().trim() + ")" : "";
        String transferNote = String.format("[CHUYỂN TỪ %s SANG %s lúc %s%s]",
                sourceTable.getTableNumber(), targetTable.getTableNumber(), transferTime, reasonStr);
        String currentNote = session.getNote() != null ? session.getNote() : "";
        session.setNote(currentNote.isEmpty() ? transferNote : currentNote + " | " + transferNote);
        session.setTable(targetTable);
        diningSessionRepository.save(session);

        // Chuyển toàn bộ chuông gọi phục vụ / yêu cầu tính tiền PENDING sang bàn đích
        List<ServiceRequest> pendingRequests = serviceRequestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(sourceTable.getId(), "PENDING");
        if (pendingRequests != null) {
            for (ServiceRequest req : pendingRequests) {
                req.setTable(targetTable);
                serviceRequestRepository.save(req);
            }
        }

        // Cập nhật trạng thái hai bàn
        boolean markDirty = request.getMarkSourceDirty() == null || request.getMarkSourceDirty();
        sourceTable.setStatus(markDirty ? TableStatus.DIRTY : TableStatus.AVAILABLE);
        tableRepository.save(sourceTable);

        targetTable.setStatus(TableStatus.OCCUPIED);
        RestaurantTable updatedTargetTable = tableRepository.save(targetTable);

        try {
            realtimeService.notifyTableUpdate(sourceTable.getId(), sourceTable.getTableNumber(), sourceTable.getStatus().name(), "Chuyển bàn sang " + targetTable.getTableNumber());
            realtimeService.notifyTableUpdate(targetTable.getId(), targetTable.getTableNumber(), targetTable.getStatus().name(), "Nhận bàn chuyển từ " + sourceTable.getTableNumber());
        } catch (Exception e) {
            log.warn("[Realtime] Lỗi broadcast transferTable: {}", e.getMessage());
        }

        return mapToTableResponse(updatedTargetTable);
    }

    // ===================================================================
    // 16. GỘP BÀN (TABLE MERGE)
    // ===================================================================
    @Override
    @Transactional
    public TableResponse mergeTables(MergeTableRequest request) {
        if (request.getSourceTableId().equals(request.getTargetTableId())) {
            throw new AppException("Không thể gộp một bàn vào chính nó!", HttpStatus.BAD_REQUEST);
        }

        RestaurantTable sourceTable = tableRepository.findById(request.getSourceTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Bàn nguồn không tồn tại với ID: " + request.getSourceTableId()));
        RestaurantTable targetTable = tableRepository.findById(request.getTargetTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Bàn đích không tồn tại với ID: " + request.getTargetTableId()));

        if (sourceTable.getStatus() != TableStatus.OCCUPIED) {
            throw new AppException("Bàn nguồn (" + sourceTable.getTableNumber() + ") không có khách đang ngồi (OCCUPIED)!", HttpStatus.BAD_REQUEST);
        }
        if (targetTable.getStatus() != TableStatus.OCCUPIED) {
            throw new AppException("Bàn đích (" + targetTable.getTableNumber() + ") không có khách đang ngồi (OCCUPIED)!", HttpStatus.BAD_REQUEST);
        }

        DiningSession sourceSession = diningSessionRepository.findByTableIdAndStatus(sourceTable.getId(), SessionStatus.ACTIVE)
                .orElseThrow(() -> new AppException("Bàn nguồn không có phiên ăn đang hoạt động!", HttpStatus.BAD_REQUEST));
        DiningSession targetSession = diningSessionRepository.findByTableIdAndStatus(targetTable.getId(), SessionStatus.ACTIVE)
                .orElseThrow(() -> new AppException("Bàn đích không có phiên ăn đang hoạt động!", HttpStatus.BAD_REQUEST));

        String mergeTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
        String reasonStr = (request.getReason() != null && !request.getReason().trim().isEmpty())
                ? " (Lý do: " + request.getReason().trim() + ")" : "";

        // 1. Chuyển toàn bộ Order từ sourceSession sang targetSession
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

        // 2. Gộp số lượng khách vào targetSession
        int sourceGuests = sourceSession.getGuestCount() != null ? sourceSession.getGuestCount() : 0;
        int targetGuests = targetSession.getGuestCount() != null ? targetSession.getGuestCount() : 0;
        targetSession.setGuestCount(targetGuests + sourceGuests);

        // 3. Gắn ghi chú gộp bàn vào targetSession
        String mergeNote = String.format("[GỘP TỪ %s lúc %s%s]", sourceTable.getTableNumber(), mergeTime, reasonStr);
        String targetNote = targetSession.getNote() != null ? targetSession.getNote() : "";
        targetSession.setNote(targetNote.isEmpty() ? mergeNote : targetNote + " | " + mergeNote);
        diningSessionRepository.save(targetSession);

        // 4. Đóng sourceSession với trạng thái COMPLETED và ghi chú
        String sourceCloseNote = String.format("[ĐÃ GỘP VÀO BÀN %s lúc %s]", targetTable.getTableNumber(), mergeTime);
        String sNote = sourceSession.getNote() != null ? sourceSession.getNote() : "";
        sourceSession.setNote(sNote.isEmpty() ? sourceCloseNote : sNote + " | " + sourceCloseNote);
        sourceSession.setStatus(SessionStatus.COMPLETED);
        sourceSession.setEndTime(LocalDateTime.now());
        diningSessionRepository.save(sourceSession);

        // 5. Chuyển các ServiceRequest PENDING từ sourceTable sang targetTable
        List<ServiceRequest> pendingRequests = serviceRequestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(sourceTable.getId(), "PENDING");
        if (pendingRequests != null) {
            for (ServiceRequest req : pendingRequests) {
                req.setTable(targetTable);
                req.setNote((req.getNote() != null ? req.getNote() + " " : "") + "[Gộp từ " + sourceTable.getTableNumber() + "]");
                serviceRequestRepository.save(req);
            }
        }

        // 6. Cập nhật trạng thái bàn nguồn
        boolean markDirty = request.getMarkSourceDirty() == null || request.getMarkSourceDirty();
        sourceTable.setStatus(markDirty ? TableStatus.DIRTY : TableStatus.AVAILABLE);
        tableRepository.save(sourceTable);

        // 7. Bàn đích vẫn OCCUPIED
        targetTable.setStatus(TableStatus.OCCUPIED);
        RestaurantTable updatedTargetTable = tableRepository.save(targetTable);

        try {
            realtimeService.notifyTableUpdate(sourceTable.getId(), sourceTable.getTableNumber(), sourceTable.getStatus().name(), "Đã gộp vào " + targetTable.getTableNumber());
            realtimeService.notifyTableUpdate(targetTable.getId(), targetTable.getTableNumber(), targetTable.getStatus().name(), "Đã gộp từ " + sourceTable.getTableNumber());
        } catch (Exception e) {
            log.warn("[Realtime] Lỗi broadcast mergeTables: {}", e.getMessage());
        }

        return mapToTableResponse(updatedTargetTable);
    }

    private void restoreItemStock(OrderItem item) {
        if (item == null || item.getMenuItem() == null || item.getQuantity() == null || item.getQuantity() <= 0) {
            return;
        }
        restoreStockForQuantity(item.getMenuItem().getId(), item.getQuantity());
    }

    private void restoreStockForQuantity(Long menuItemId, int quantity) {
        if (menuItemId == null || quantity <= 0) return;
        MenuItem menuItem = menuItemRepository.findByIdForUpdate(menuItemId).orElse(null);
        if (menuItem != null && menuItem.getRemainingStock() != null) {
            menuItem.increaseStock(quantity);
            menuItemRepository.save(menuItem);
            try {
                realtimeService.notifyMenuItemAvailability(menuItem.getId(), menuItem.getName(), menuItem.getIsAvailable(), menuItem.getRemainingStock());
            } catch (Exception ignored) {}
            if (cacheManager != null && cacheManager.getCache("customerMenu") != null) {
                cacheManager.getCache("customerMenu").clear();
            }
        }
    }

    private void deductStockForQuantity(Long menuItemId, int quantity) {
        if (menuItemId == null || quantity <= 0) return;
        MenuItem menuItem = menuItemRepository.findByIdForUpdate(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Món ăn không tồn tại với ID: " + menuItemId));
        if (!Boolean.TRUE.equals(menuItem.getIsAvailable())) {
            throw new AppException("Món '" + menuItem.getName() + "' hiện đã tạm hết hàng (86'd)!", HttpStatus.BAD_REQUEST);
        }
        if (menuItem.getRemainingStock() != null && menuItem.getRemainingStock() < quantity) {
            throw new AppException("Món '" + menuItem.getName() + "' chỉ còn lại " + menuItem.getRemainingStock() + " phần! Không đủ để bổ sung.", HttpStatus.BAD_REQUEST);
        }
        menuItem.decreaseStock(quantity);
        menuItemRepository.save(menuItem);
        if (!Boolean.TRUE.equals(menuItem.getIsAvailable())) {
            try {
                realtimeService.notifyMenuItemAvailability(menuItem.getId(), menuItem.getName(), false, menuItem.getRemainingStock());
            } catch (Exception ignored) {}
            if (cacheManager != null && cacheManager.getCache("customerMenu") != null) {
                cacheManager.getCache("customerMenu").clear();
            }
        }
    }
}
