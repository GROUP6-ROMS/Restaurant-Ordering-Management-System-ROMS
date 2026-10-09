package com.romsteam.roms.service.serviceImpl;

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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

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

        if (table.getStatus() != TableStatus.AVAILABLE) {
            throw new AppException("Chỉ có thể mở phiên cho bàn đang ở trạng thái Trống!", HttpStatus.BAD_REQUEST);
        }

        // Tạo phiên ăn mới
        String sessionToken = "sess-" + table.getTableNumber().toLowerCase() + "-" + UUID.randomUUID().toString().substring(0, 8);
        DiningSession newSession = new DiningSession();
        newSession.setTable(table);
        newSession.setSessionToken(sessionToken);
        newSession.setStatus(SessionStatus.ACTIVE);
        newSession.setGuestCount(request.getGuestCount() != null ? request.getGuestCount() : table.getCapacity());
        newSession.setStartTime(LocalDateTime.now());
        newSession.setNote(request.getNote());
        sessionRepository.save(newSession);

        // Đổi trạng thái bàn thành OCCUPIED
        table.setStatus(TableStatus.OCCUPIED);
        tableRepository.save(table);

        return mapToWaiterTableResponse(table);
    }

    @Override
    @Transactional
    public WaiterTableResponse completeCleaning(Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại: " + tableId));

        table.setStatus(TableStatus.AVAILABLE);
        tableRepository.save(table);

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

        // Chuyển phiên ăn sang bàn mới
        DiningSession session = activeSessionOpt.get();
        session.setTable(targetTable);
        sessionRepository.save(session);

        // Bàn cũ chuyển thành DIRTY (cần dọn)
        sourceTable.setStatus(TableStatus.DIRTY);
        tableRepository.save(sourceTable);

        // Bàn mới chuyển thành OCCUPIED
        targetTable.setStatus(TableStatus.OCCUPIED);
        tableRepository.save(targetTable);
    }

    @Override
    @Transactional
    public WaiterTableResponse confirmDeliverFood(Long tableId) {
        Optional<DiningSession> sessionOpt = sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE);
        if (sessionOpt.isPresent()) {
            List<Order> orders = orderRepository.findBySessionId(sessionOpt.get().getId());
            for (Order order : orders) {
                if (order.getItems() != null) {
                    for (OrderItem item : order.getItems()) {
                        if (item.getStatus() == OrderItemStatus.READY) {
                            item.setStatus(OrderItemStatus.SERVED);
                            orderItemRepository.save(item);
                        }
                    }
                }
            }
        }

        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại"));
        return mapToWaiterTableResponse(table);
    }

    @Override
    @Transactional
    public void resolveServiceRequest(Long requestId) {
        ServiceRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu chuông gọi không tồn tại: " + requestId));
        req.setStatus("RESOLVED");
        requestRepository.save(req);
    }

    @Override
    @Transactional
    public WaiterTableResponse requestPayment(Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại: " + tableId));

        if (table.getStatus() != TableStatus.OCCUPIED) {
            throw new AppException("Chỉ có thể yêu cầu thanh toán cho bàn đang có khách dùng bữa (OCCUPIED)!", HttpStatus.BAD_REQUEST);
        }

        // Tạo ServiceRequest loại BILL để thông báo chuông cho Thu ngân POS
        ServiceRequest billReq = ServiceRequest.builder()
                .table(table)
                .requestType("BILL")
                .note("Khách yêu cầu tính tiền & in hóa đơn POS")
                .status("PENDING")
                .build();
        requestRepository.save(billReq);

        return mapToWaiterTableResponse(table);
    }

    @Override
    @Transactional
    public WaiterTableResponse addOrderToTable(Long tableId, WaiterAddOrderRequest request) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn ăn không tồn tại với ID: " + tableId));

        DiningSession activeSession = sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE)
                .orElseThrow(() -> new AppException("Bàn " + table.getTableNumber() + " chưa được mở phiên phục vụ (chưa có khách)! Vui lòng Mở Bàn trước khi gọi món.", HttpStatus.BAD_REQUEST));

        String orderCode = "ORD-" + table.getTableNumber() + "-" + (System.currentTimeMillis() % 10000);
        Order newOrder = new Order();
        newOrder.setSession(activeSession);
        newOrder.setOrderCode(orderCode);
        newOrder.setOrderTime(LocalDateTime.now());
        newOrder.setStatus(OrderStatus.CONFIRMED);
        newOrder.setNote(request.getNote());

        BigDecimal totalOrderAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (WaiterAddOrderRequest.WaiterOrderItemRequest itemReq : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Món ăn không tồn tại với ID: " + itemReq.getMenuItemId()));

            if (!menuItem.getIsAvailable()) {
                throw new AppException("Món '" + menuItem.getName() + "' hiện đã tạm hết hàng!", HttpStatus.BAD_REQUEST);
            }

            int qty = itemReq.getQuantity() != null && itemReq.getQuantity() > 0 ? itemReq.getQuantity() : 1;
            BigDecimal unitPrice = menuItem.getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(qty));
            totalOrderAmount = totalOrderAmount.add(subtotal);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(newOrder);
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(qty);
            orderItem.setUnitPrice(unitPrice);
            orderItem.setSubtotal(subtotal);
            orderItem.setNote(itemReq.getNote());
            orderItem.setStatus(OrderItemStatus.COOKING); // Món nấu, Bếp KDS nhận được ngay

            orderItems.add(orderItem);
        }

        newOrder.setTotalAmount(totalOrderAmount);
        newOrder.setItems(orderItems);

        orderRepository.save(newOrder);

        if (table.getStatus() != TableStatus.OCCUPIED) {
            table.setStatus(TableStatus.OCCUPIED);
            tableRepository.save(table);
        }

        return mapToWaiterTableResponse(table);
    }

    // Helper map entity sang WaiterTableResponse
    private WaiterTableResponse mapToWaiterTableResponse(RestaurantTable table) {
        String zoneName = switch (table.getZone()) {
            case "ZONE_1" -> "Tầng 1 - Sảnh Chính";
            case "ZONE_2" -> "Tầng 2 - Ban Công";
            case "VIP" -> "Phòng VIP";
            default -> table.getZone();
        };

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
                if (order.getItems() != null) {
                    for (OrderItem item : order.getItems()) {
                        BigDecimal subtotal = item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO;
                        orderTotal = orderTotal.add(subtotal);

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
        boolean isBillRequest = isCalling && "BILL".equalsIgnoreCase(pendingCalls.get(0).getRequestType());

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
                    .build());
        }
        return result;
    }

    private void seedDefaultMenuData() {
        Category catAppetizer = getOrCreateCategory("Khai Vị", "Món khai vị thanh đạm kích thích vị giác", 1);
        Category catMain = getOrCreateCategory("Món Chính", "Món chính chuẩn vị hoàng gia ROMS", 2);
        Category catDrink = getOrCreateCategory("Đồ Uống", "Nước uống thanh mát & đóng chai", 3);

        List<MenuItem> defaultItems = List.of(
                new MenuItem(null, catAppetizer, "Gỏi Cuốn Tôm Thịt", "Tôm tươi, thịt ba chỉ kèm rau sống thanh mát", BigDecimal.valueOf(55000), "https://images.unsplash.com/photo-1544025162-d76694265947?w=500", true, 1, true, null, null),
                new MenuItem(null, catAppetizer, "Nem Rán Hải Sản", "Giòn rụm bên ngoài, nhân hải sản tươi béo ngậy", BigDecimal.valueOf(85000), "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=500", true, 2, true, null, null),
                new MenuItem(null, catMain, "Bò Bít Tết Sốt Tiêu Đen ROMS", "Thịt thăn bò mềm mọng dùng kèm sốt tiêu thơm lừng", BigDecimal.valueOf(210000), "https://images.unsplash.com/photo-1544025162-d76694265947?w=500", true, 3, true, null, null),
                new MenuItem(null, catMain, "Cơm Chiên Hải Sản Hoàng Kim", "Hạt cơm vàng óng ánh kết hợp mực, tôm, trứng muối", BigDecimal.valueOf(95000), "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500", true, 4, true, null, null),
                new MenuItem(null, catMain, "Phở Áp Chảo Bò Giòn", "Bánh phở áp chảo giòn tan, bò mềm xào cải ngọt", BigDecimal.valueOf(85000), "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500", true, 5, true, null, null),
                new MenuItem(null, catMain, "Mì Ý Tôm Hùm Sốt Kem", "Mì Ý sợi tươi cùng tôm hùm nướng sốt kem phô mai", BigDecimal.valueOf(280000), "https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=500", true, 6, true, null, null),
                new MenuItem(null, catMain, "Bò Wagyu Nướng Tảng", "Thịt bò Wagyu vân mỡ cẩm thạch nướng đá muối", BigDecimal.valueOf(390000), "https://images.unsplash.com/photo-1558030006-450675393462?w=500", true, 7, true, null, null),
                new MenuItem(null, catDrink, "Trà Đào Cam Sả", "Đào giòn mọng nước cùng sả thơm thanh mát", BigDecimal.valueOf(35000), "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500", true, 8, true, null, null),
                new MenuItem(null, catDrink, "Cà Phê Muối ROMS", "Cà phê pha phin truyền thống phủ kem béo ngậy", BigDecimal.valueOf(32000), "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500", true, 9, true, null, null),
                new MenuItem(null, catDrink, "Trà Ô Long TEA+ Chai 455ml", "Trà ô long đóng chai ướp lạnh giải nhiệt", BigDecimal.valueOf(18000), "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500", true, 10, true, null, null),
                new MenuItem(null, catDrink, "Bia Tiger Crystal Lon 330ml", "Bia Tiger bạc mát lạnh sảng khoái", BigDecimal.valueOf(28000), "https://images.unsplash.com/photo-1608270116664-5085ef158e23?w=500", true, 11, true, null, null)
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
}
