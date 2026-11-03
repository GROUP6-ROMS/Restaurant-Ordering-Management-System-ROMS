package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.CashierCheckoutRequest;
import com.romsteam.roms.dto.request.CloseEmptySessionRequest;
import com.romsteam.roms.dto.request.CloseShiftRequest;
import com.romsteam.roms.dto.request.ManagerApprovalRequest;
import com.romsteam.roms.dto.response.*;
import com.romsteam.roms.entity.*;
import com.romsteam.roms.entity.enums.*;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.exception.ResourceNotFoundException;
import com.romsteam.roms.repository.*;
import com.romsteam.roms.service.CashierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CashierServiceImpl implements CashierService {

    private final RestaurantTableRepository tableRepository;
    private final DiningSessionRepository sessionRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final BillRepository billRepository;
    private final ServiceRequestRepository requestRepository;
    private final StaffRepository staffRepository;
    private final ZoneRepository zoneRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.romsteam.roms.service.RealtimeService realtimeService;

    @Override
    @Transactional(readOnly = true)
    public List<CashierTableResponse> getPosTables(String zone) {
        List<RestaurantTable> allTables = tableRepository.findByIsActiveTrueOrderByTableNumberAsc();

        if (zone != null && !zone.trim().isEmpty() && !"ALL".equalsIgnoreCase(zone.trim())) {
            allTables = allTables.stream()
                    .filter(t -> zone.equalsIgnoreCase(t.getZone()))
                    .collect(Collectors.toList());
        }

        List<CashierTableResponse> result = new ArrayList<>();
        for (RestaurantTable table : allTables) {
            result.add(mapToCashierTableResponse(table));
        }

        // Ưu tiên bàn có yêu cầu thanh toán (PAYMENT_REQUEST) lên đầu tiên
        result.sort((t1, t2) -> {
            boolean r1 = Boolean.TRUE.equals(t1.getIsCallingBill());
            boolean r2 = Boolean.TRUE.equals(t2.getIsCallingBill());
            if (r1 && !r2) return -1;
            if (!r1 && r2) return 1;
            return t1.getCode().compareTo(t2.getCode());
        });

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public CashierBillPreviewResponse getBillPreview(Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn ăn không tồn tại: " + tableId));

        DiningSession session = sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE)
                .orElseThrow(() -> new AppException("Bàn " + table.getTableNumber() + " hiện không có phiên ăn đang hoạt động!", HttpStatus.BAD_REQUEST));

        List<Order> orders = orderRepository.findBySessionId(session.getId());
        List<CashierBillPreviewResponse.CashierBillItemDetail> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        int unservedCount = 0;

        for (Order order : orders) {
            if (order.getStatus() == OrderStatus.CANCELLED) continue;
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (item.getStatus() == OrderItemStatus.CANCELLED) continue;

                    if (item.getStatus() == OrderItemStatus.PENDING || item.getStatus() == OrderItemStatus.COOKING) {
                        unservedCount += item.getQuantity() != null ? item.getQuantity() : 1;
                    }

                    BigDecimal itemSubtotal = item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO;
                    subtotal = subtotal.add(itemSubtotal);

                    items.add(CashierBillPreviewResponse.CashierBillItemDetail.builder()
                            .orderItemId(item.getId())
                            .itemName(item.getMenuItem() != null ? item.getMenuItem().getName() : "Món ăn")
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .subtotal(itemSubtotal)
                            .note(item.getNote())
                            .status(item.getStatus() != null ? item.getStatus().name() : "COOKING")
                            .build());
                }
            }
        }

        BigDecimal taxRate = BigDecimal.valueOf(8.0);
        BigDecimal taxAmount = subtotal.multiply(taxRate).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal finalAmount = subtotal.add(taxAmount).subtract(discountAmount);

        long duration = 0;
        String timeIn = "--:--";
        if (session.getStartTime() != null) {
            duration = Duration.between(session.getStartTime(), LocalDateTime.now()).toMinutes();
            timeIn = session.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm"));
        }

        String billCode = "BILL-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + table.getTableNumber();

        List<ServiceRequest> billRequests = requestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(table.getId(), "PENDING");
        boolean hasPaymentRequest = billRequests.stream().anyMatch(r -> "BILL".equalsIgnoreCase(r.getRequestType()));
        boolean isDraftPrinted = session.getNote() != null && session.getNote().contains("DRAFT_PRINTED");

        return CashierBillPreviewResponse.builder()
                .tableId(table.getId())
                .tableCode(table.getTableNumber())
                .tableName(table.getName())
                .zoneName(resolveZoneName(table.getZone()))
                .guestCount(session.getGuestCount() != null ? session.getGuestCount() : table.getCapacity())
                .timeIn(timeIn)
                .durationMinutes(Math.max(0, duration))
                .sessionId(session.getId())
                .billCode(billCode)
                .subtotal(subtotal)
                .taxRate(taxRate)
                .taxAmount(taxAmount)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .unservedCount(unservedCount)
                .hasPaymentRequest(hasPaymentRequest)
                .isDraftPrinted(isDraftPrinted)
                .items(items)
                .build();
    }

    @Override
    @Transactional
    public CashierTableResponse markDraftPrinted(Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại: " + tableId));

        Optional<DiningSession> sessionOpt = sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE);
        if (sessionOpt.isPresent()) {
            DiningSession session = sessionOpt.get();
            String existingNote = session.getNote() != null ? session.getNote() : "";
            if (!existingNote.contains("DRAFT_PRINTED")) {
                session.setNote((existingNote + " [DRAFT_PRINTED]").trim());
                sessionRepository.save(session);
            }
        }

        try {
            realtimeService.notifyTableUpdate(table.getId(), table.getTableNumber(), "DRAFT_PRINTED", "Đã in phiếu tạm tính");
            realtimeService.notifyPaymentUpdate(null, table.getId(), table.getTableNumber(), "DRAFT_PRINTED", Map.of("tableId", table.getId(), "tableNumber", table.getTableNumber()));
        } catch (Exception e) {
            log.warn("[Realtime] Lỗi broadcast markDraftPrinted bàn {}: {}", table.getTableNumber(), e.getMessage());
        }

        return mapToCashierTableResponse(table);
    }

    @Override
    @Transactional
    public CashierInvoiceResponse checkoutBill(Long tableId, CashierCheckoutRequest request, String cashierUsername) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại: " + tableId));

        DiningSession session = sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE)
                .orElseThrow(() -> new AppException("Bàn không có phiên ăn đang hoạt động để thanh toán!", HttpStatus.BAD_REQUEST));

        // 1. Kiểm tra Idempotency - Không cho phép thanh toán 2 lần nếu phiên ăn đã có hóa đơn PAID (chống double click / race condition)
        Optional<Bill> existingBillOpt = billRepository.findBySessionId(session.getId());
        if (existingBillOpt.isPresent() && existingBillOpt.get().getStatus() == BillStatus.PAID) {
            throw new AppException("Hóa đơn cho phiên ăn này đã được thanh toán! Vui lòng không thực hiện lại.", HttpStatus.CONFLICT);
        }

        Staff cashier = null;
        if (cashierUsername != null) {
            cashier = staffRepository.findByUsername(cashierUsername).orElse(null);
        }

        // 2. Tính toán tổng tiền hóa đơn thực tế và kiểm tra các món chưa hoàn thành
        List<Order> orders = orderRepository.findBySessionId(session.getId());
        BigDecimal subtotal = BigDecimal.ZERO;
        List<CashierInvoiceResponse.InvoiceItemDTO> itemDTOs = new ArrayList<>();
        int unservedCount = 0;

        for (Order order : orders) {
            if (order.getStatus() == OrderStatus.CANCELLED) continue;
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (item.getStatus() == OrderItemStatus.CANCELLED) continue;

                    if (item.getStatus() == OrderItemStatus.PENDING || item.getStatus() == OrderItemStatus.COOKING) {
                        unservedCount += item.getQuantity() != null ? item.getQuantity() : 1;
                    }

                    BigDecimal itemSubtotal = item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO;
                    subtotal = subtotal.add(itemSubtotal);

                    itemDTOs.add(CashierInvoiceResponse.InvoiceItemDTO.builder()
                            .name(item.getMenuItem() != null ? item.getMenuItem().getName() : "Món ăn")
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .subtotal(itemSubtotal)
                            .build());
                }
            }
        }

        if (subtotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException("Bàn chưa có món ăn hợp lệ để thanh toán!", HttpStatus.BAD_REQUEST);
        }

        // 3. Nghiệp vụ QA 1: Cảnh báo món chưa hoàn thành (Chặn thanh toán nếu chưa được xác nhận forceCheckout)
        if (unservedCount > 0 && !Boolean.TRUE.equals(request.getForceCheckout())) {
            throw new AppException("Bàn còn " + unservedCount + " phần món đang chế biến / chờ bếp phục vụ! Vui lòng kiểm tra với Bếp hoặc xác nhận đồng ý thanh toán trước.", HttpStatus.BAD_REQUEST);
        }

        // 4. Áp dụng thuế & giảm giá
        BigDecimal taxRate = request.getTaxRate() != null ? request.getTaxRate() : BigDecimal.valueOf(8.0);
        BigDecimal taxAmount = subtotal.multiply(taxRate).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

        BigDecimal discountAmount = BigDecimal.ZERO;
        if ("PERCENT".equalsIgnoreCase(request.getDiscountType()) && request.getDiscountValue() != null) {
            if (request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new AppException("Tỷ lệ giảm giá không được vượt quá 100%!", HttpStatus.BAD_REQUEST);
            }
            discountAmount = subtotal.multiply(request.getDiscountValue()).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        } else if ("AMOUNT".equalsIgnoreCase(request.getDiscountType()) && request.getDiscountValue() != null) {
            discountAmount = request.getDiscountValue();
        }

        // Nghiệp vụ QA 5: Giảm giá không được vượt quá tổng tiền món trước thuế
        if (discountAmount.compareTo(subtotal) > 0) {
            throw new AppException("Số tiền giảm giá (" + discountAmount.toPlainString() + "đ) không được vượt quá tổng tiền món ăn (" + subtotal.toPlainString() + "đ)!", HttpStatus.BAD_REQUEST);
        }

        // Nghiệp vụ QA 5: Giảm giá lớn (> 30% hoặc > 200.000đ) yêu cầu mã PIN của Quản lý duyệt
        boolean isHighDiscount = ("PERCENT".equalsIgnoreCase(request.getDiscountType()) && request.getDiscountValue() != null && request.getDiscountValue().compareTo(BigDecimal.valueOf(30)) > 0)
                || discountAmount.compareTo(BigDecimal.valueOf(200000)) > 0;
        if (isHighDiscount) {
            if (request.getManagerPin() == null || request.getManagerPin().trim().isEmpty()) {
                throw new AppException("Mức giảm giá lớn (> 30% hoặc > 200.000đ) bắt buộc phải có mã PIN Quản lý duyệt!", HttpStatus.BAD_REQUEST);
            }
            validateManagerPin(request.getManagerPin());
        }

        BigDecimal finalAmount = subtotal.add(taxAmount).subtract(discountAmount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) finalAmount = BigDecimal.ZERO;

        PaymentMethod pm = PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase());

        // Nghiệp vụ QA 4: Kiểm tra tiền khách đưa khi thanh toán tiền mặt (CASH)
        if (PaymentMethod.CASH.equals(pm)) {
            if (request.getCashGiven() == null || request.getCashGiven().compareTo(finalAmount) < 0) {
                BigDecimal missing = finalAmount.subtract(request.getCashGiven() != null ? request.getCashGiven() : BigDecimal.ZERO);
                throw new AppException("Tiền mặt khách đưa chưa đủ để thanh toán (còn thiếu " + missing.toPlainString() + "đ)!", HttpStatus.BAD_REQUEST);
            }
        }

        String billCode = "BILL-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + (System.currentTimeMillis() % 10000);

        // 1. Tái sử dụng bản ghi Bill tạm tính (UNPAID) nếu có hoặc tạo mới bản ghi Bill
        Bill bill = existingBillOpt.orElseGet(Bill::new);
        bill.setSession(session);
        bill.setCashier(cashier);
        if (bill.getBillCode() == null || bill.getBillCode().trim().isEmpty()) {
            bill.setBillCode(billCode);
        }
        bill.setSubtotal(subtotal);
        bill.setTaxAmount(taxAmount);
        bill.setDiscountAmount(discountAmount);
        bill.setFinalAmount(finalAmount);
        bill.setPaymentMethod(pm);
        bill.setStatus(BillStatus.PAID);
        bill.setPaymentTime(LocalDateTime.now());
        bill.setNote(request.getNote());

        try {
            bill = billRepository.save(bill);
        } catch (Exception ex) {
            throw new AppException("Giao dịch bị trùng lặp hoặc hóa đơn đã được thanh toán bởi phiên khác!", HttpStatus.CONFLICT);
        }

        // 2. Đóng phiên ăn DiningSession
        session.setStatus(SessionStatus.COMPLETED);
        session.setEndTime(LocalDateTime.now());
        sessionRepository.save(session);

        // 3. Đổi trạng thái bàn thành DIRTY (cần dọn) để Waiter thấy ra dọn
        table.setStatus(TableStatus.DIRTY);
        tableRepository.save(table);

        // 4. Đóng tất cả ServiceRequest loại BILL của bàn này
        List<ServiceRequest> billRequests = requestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(table.getId(), "PENDING");
        for (ServiceRequest req : billRequests) {
            if ("BILL".equalsIgnoreCase(req.getRequestType())) {
                req.setStatus("RESOLVED");
                requestRepository.save(req);
            }
        }

        try {
            realtimeService.notifyPaymentUpdate(bill.getId(), table.getId(), table.getTableNumber(), "BILL_PAID", Map.of(
                    "billId", bill.getId(),
                    "billCode", bill.getBillCode(),
                    "finalAmount", bill.getFinalAmount(),
                    "paymentMethod", bill.getPaymentMethod().name()
            ));
            realtimeService.notifyTableUpdate(table.getId(), table.getTableNumber(), TableStatus.DIRTY.name(), "Thanh toán thành công. Bàn cần dọn");
        } catch (Exception e) {
            log.warn("[Realtime] Lỗi broadcast checkoutBill bàn {}: {}", table.getTableNumber(), e.getMessage());
        }

        return mapToInvoiceResponse(bill, itemDTOs, table);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CashierInvoiceResponse> getInvoiceHistory(LocalDate date, String paymentMethod, String search) {
        LocalDate queryDate = (date != null) ? date : LocalDate.now();
        LocalDateTime startOfDay = queryDate.atStartOfDay();
        LocalDateTime endOfDay = queryDate.atTime(23, 59, 59);

        List<Bill> bills = billRepository.findByStatusAndPaymentTimeBetween(BillStatus.PAID, startOfDay, endOfDay);

        if (paymentMethod != null && !paymentMethod.trim().isEmpty() && !"ALL".equalsIgnoreCase(paymentMethod.trim())) {
            PaymentMethod pm = PaymentMethod.valueOf(paymentMethod.toUpperCase());
            bills = bills.stream().filter(b -> b.getPaymentMethod() == pm).collect(Collectors.toList());
        }

        List<CashierInvoiceResponse> responses = new ArrayList<>();
        for (Bill b : bills) {
            CashierInvoiceResponse resp = mapToInvoiceResponse(b, Collections.emptyList(), null);
            if (search != null && !search.trim().isEmpty()) {
                String q = search.trim().toLowerCase();
                boolean match = resp.getBillCode().toLowerCase().contains(q)
                        || resp.getTableName().toLowerCase().contains(q)
                        || (resp.getCashierName() != null && resp.getCashierName().toLowerCase().contains(q));
                if (!match) continue;
            }
            responses.add(resp);
        }

        // Sắp xếp hóa đơn mới nhất lên đầu
        responses.sort((b1, b2) -> b2.getPaymentTime().compareTo(b1.getPaymentTime()));
        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public CashierInvoiceResponse getInvoiceDetail(Long invoiceId) {
        Bill bill = billRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Hóa đơn không tồn tại: " + invoiceId));

        List<CashierInvoiceResponse.InvoiceItemDTO> itemDTOs = new ArrayList<>();
        if (bill.getSession() != null) {
            List<Order> orders = orderRepository.findBySessionId(bill.getSession().getId());
            for (Order o : orders) {
                if (o.getItems() != null) {
                    for (OrderItem item : o.getItems()) {
                        if (item.getStatus() != OrderItemStatus.CANCELLED) {
                            itemDTOs.add(CashierInvoiceResponse.InvoiceItemDTO.builder()
                                    .name(item.getMenuItem() != null ? item.getMenuItem().getName() : "Món ăn")
                                    .quantity(item.getQuantity())
                                    .unitPrice(item.getUnitPrice())
                                    .subtotal(item.getSubtotal())
                                    .build());
                        }
                    }
                }
            }
        }

        CashierInvoiceResponse response = mapToInvoiceResponse(bill, itemDTOs, bill.getSession() != null ? bill.getSession().getTable() : null);
        response.setIsReprint(true);
        response.setReprintNotice("*** BẢN IN LẠI (REPRINT) - ĐÃ THANH TOÁN ***");
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public CashierShiftSummaryResponse getShiftSummary(String shiftType, LocalDate date, BigDecimal openingCash, String cashierUsername) {
        LocalDate queryDate = (date != null) ? date : LocalDate.now();
        String shift = (shiftType != null && !shiftType.trim().isEmpty()) ? shiftType.toUpperCase() : "MORNING";

        LocalDateTime start, end;
        if ("MORNING".equalsIgnoreCase(shift)) {
            start = queryDate.atTime(6, 0, 0);
            end = queryDate.atTime(14, 0, 0);
        } else {
            start = queryDate.atTime(14, 0, 0);
            end = queryDate.atTime(23, 59, 59);
        }

        List<Bill> bills = billRepository.findByStatusAndPaymentTimeBetween(BillStatus.PAID, start, end);

        BigDecimal cash = BigDecimal.ZERO;
        BigDecimal bank = BigDecimal.ZERO;
        BigDecimal card = BigDecimal.ZERO;

        for (Bill b : bills) {
            BigDecimal amt = b.getFinalAmount() != null ? b.getFinalAmount() : BigDecimal.ZERO;
            if (b.getPaymentMethod() == PaymentMethod.CASH) cash = cash.add(amt);
            else if (b.getPaymentMethod() == PaymentMethod.BANK_TRANSFER) bank = bank.add(amt);
            else if (b.getPaymentMethod() == PaymentMethod.CARD) card = card.add(amt);
        }

        BigDecimal total = cash.add(bank).add(card);

        // Tiền đầu ca (opening float) do thu ngân nhập khi mở ca
        BigDecimal opening = (openingCash != null && openingCash.compareTo(BigDecimal.ZERO) > 0) ? openingCash : BigDecimal.ZERO;

        // Tiền mặt lý thuyết phải có trong két = Tiền đầu ca + Doanh thu tiền mặt trong ca
        BigDecimal theoretical = opening.add(cash);

        Staff cashier = (cashierUsername != null) ? staffRepository.findByUsername(cashierUsername).orElse(null) : null;

        return CashierShiftSummaryResponse.builder()
                .shiftType(shift)
                .shiftName("MORNING".equalsIgnoreCase(shift) ? "Ca Sáng (06:00 - 14:00)" : "Ca Tối (14:00 - 24:00)")
                .workDate(queryDate)
                .cashierUsername(cashierUsername)
                .cashierFullName(cashier != null ? cashier.getFullName() : "Thu Ngân POS")
                .totalBillsCount((long) bills.size())
                .totalRevenue(total)
                .cashRevenue(cash)
                .bankRevenue(bank)
                .cardRevenue(card)
                .openingCash(opening)
                .theoreticalDrawerCash(theoretical)
                .build();
    }

    @Override
    @Transactional
    public void voidOrderItem(Long itemId, ManagerApprovalRequest request) {
        validateManagerPin(request.getManagerPin());

        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Món ăn không tồn tại: " + itemId));

        if (item.getStatus() == OrderItemStatus.SERVED) {
            throw new AppException("Món ăn này đã được phục vụ lên bàn khách (SERVED)! Không thể hủy món theo quy trình thông thường để bảo đảm an toàn doanh thu.", HttpStatus.BAD_REQUEST);
        }

        if (item.getStatus() == OrderItemStatus.CANCELLED) {
            throw new AppException("Món ăn này đã được hủy trước đó!", HttpStatus.BAD_REQUEST);
        }

        item.setStatus(OrderItemStatus.CANCELLED);
        item.setNote(request.getReason() != null ? "[HỦY BỞI QUẢN LÝ] " + request.getReason() : "[HỦY BỞI QUẢN LÝ]");
        orderItemRepository.save(item);

        Order order = item.getOrder();
        if (order != null && order.getItems() != null) {
            BigDecimal recalculatedTotal = order.getItems().stream()
                    .filter(i -> i.getStatus() != OrderItemStatus.CANCELLED)
                    .map(i -> i.getSubtotal() != null ? i.getSubtotal() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            order.setTotalAmount(recalculatedTotal);

            boolean allCancelled = order.getItems().stream().allMatch(i -> i.getStatus() == OrderItemStatus.CANCELLED);
            if (allCancelled) order.setStatus(OrderStatus.CANCELLED);

            orderRepository.save(order);

            try {
                String tblNum = (order.getSession() != null && order.getSession().getTable() != null)
                        ? order.getSession().getTable().getTableNumber() : "N/A";
                Long tblId = (order.getSession() != null && order.getSession().getTable() != null)
                        ? order.getSession().getTable().getId() : null;
                realtimeService.notifyOrderStatus(order.getId(), tblId, tblNum, "CANCELLED", Map.of("itemId", item.getId(), "reason", request.getReason() != null ? request.getReason() : ""));
            } catch (Exception e) {
                log.warn("[Realtime] Lỗi broadcast voidOrderItem: {}", e.getMessage());
            }
        }
    }

    @Override
    @Transactional
    public CloseShiftResponse closeShift(CloseShiftRequest request, String cashierUsername) {
        Staff manager = validateManagerPin(request.getManagerPin());

        BigDecimal difference = request.getCashDifference() != null ? request.getCashDifference() : BigDecimal.ZERO;

        // Nếu két tiền có chênh lệch (thừa hoặc thiếu tiền), BẮT BUỘC phải có lý do giải trình của Quản lý
        if (difference.compareTo(BigDecimal.ZERO) != 0) {
            if (request.getReason() == null || request.getReason().trim().length() < 3) {
                throw new AppException(
                        String.format("Két tiền có chênh lệch (%+,.0f₫)! Bắt buộc Quản lý phải ghi rõ lý do/giải trình chênh lệch két tiền trước khi phê duyệt.", difference),
                        HttpStatus.BAD_REQUEST
                );
            }
        }

        Staff cashier = (cashierUsername != null) ? staffRepository.findByUsername(cashierUsername).orElse(null) : null;

        log.info("[CASH SHIFT CLOSURE] Thu ngân '{}' ({}) đã chốt ca. Quản lý duyệt: '{}' ({}). Tiền thực đếm: {}₫, Lý thuyết: {}₫, Chênh lệch: {}₫, Giải trình: '{}'",
                cashierUsername, (cashier != null ? cashier.getFullName() : "N/A"),
                manager.getFullName(), manager.getUsername(),
                request.getCountedCash(), request.getTheoreticalCash(), difference, request.getReason());

        String message;
        if (difference.compareTo(BigDecimal.ZERO) == 0) {
            message = String.format("Quản lý %s (%s) đã phê duyệt chốt ca thành công (Két tiền khớp 100%%).",
                    manager.getFullName(), manager.getUsername());
        } else {
            message = String.format("Quản lý %s (%s) đã phê duyệt chốt ca và chấp thuận chênh lệch két tiền (%+,.0f₫).",
                    manager.getFullName(), manager.getUsername(), difference);
        }

        try {
            com.romsteam.roms.dto.response.RomsRealtimeEvent shiftEvent = com.romsteam.roms.dto.response.RomsRealtimeEvent.builder()
                    .type("SHIFT_CLOSED")
                    .status("CLOSED")
                    .note(message)
                    .payload(Map.of("shiftType", request.getShiftType(), "cashier", cashierUsername != null ? cashierUsername : "POS", "difference", difference))
                    .build();
            realtimeService.publish("/topic/pos", shiftEvent);
        } catch (Exception e) {
            log.warn("[Realtime] Lỗi broadcast closeShift: {}", e.getMessage());
        }

        return CloseShiftResponse.builder()
                .shiftType(request.getShiftType())
                .cashierUsername(cashierUsername)
                .cashierFullName(cashier != null ? cashier.getFullName() : "Thu Ngân POS")
                .approvedByManager(manager.getFullName() + " (" + manager.getUsername() + ")")
                .countedCash(request.getCountedCash())
                .theoreticalCash(request.getTheoreticalCash())
                .cashDifference(difference)
                .reason(request.getReason())
                .handoverNote(request.getHandoverNote())
                .closedAt(LocalDateTime.now())
                .status("CLOSED")
                .message(message)
                .build();
    }

    // ===================================================================
    // HELPER METHODS
    // ===================================================================

    private Staff validateManagerPin(String pin) {
        if (pin == null || pin.trim().length() != 6) {
            throw new AppException("Mã PIN Quản lý phải gồm đúng 6 chữ số!", HttpStatus.BAD_REQUEST);
        }

        // Tìm tài khoản Quản lý có role MANAGER
        List<Staff> managers = staffRepository.findByRole(UserRole.MANAGER);

        for (Staff m : managers) {
            if (m.getPinCode() != null && passwordEncoder.matches(pin.trim(), m.getPinCode())) {
                return m;
            }
        }

        throw new AppException("Mã PIN Quản lý không chính xác!", HttpStatus.UNAUTHORIZED);
    }

    private CashierTableResponse mapToCashierTableResponse(RestaurantTable table) {
        Optional<DiningSession> sessionOpt = sessionRepository.findByTableIdAndStatus(table.getId(), SessionStatus.ACTIVE);

        List<ServiceRequest> billCalls = requestRepository.findByTableIdAndStatusOrderByCreatedAtDesc(table.getId(), "PENDING");
        boolean isCallingBill = billCalls.stream().anyMatch(r -> "BILL".equalsIgnoreCase(r.getRequestType()));
        Long reqId = isCallingBill ? billCalls.get(0).getId() : null;

        String status = table.getStatus().name();
        String statusText = switch (table.getStatus()) {
            case AVAILABLE -> "Bàn trống";
            case DIRTY -> "Chờ dọn đĩa";
            case RESERVED -> "Đã đặt trước";
            case BLOCKED -> "Tạm khóa";
            default -> "Đang ăn";
        };

        Integer guestCount = table.getCapacity();
        String timeIn = "--:--";
        Long duration = 0L;
        BigDecimal orderTotal = BigDecimal.ZERO;
        String orderCode = null;
        Long sessionId = null;
        List<CashierTableResponse.CashierOrderItemDTO> itemDTOs = new ArrayList<>();

        if (sessionOpt.isPresent()) {
            DiningSession session = sessionOpt.get();
            sessionId = session.getId();
            guestCount = session.getGuestCount() != null ? session.getGuestCount() : table.getCapacity();
            if (session.getStartTime() != null) {
                timeIn = session.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm"));
                duration = Duration.between(session.getStartTime(), LocalDateTime.now()).toMinutes();
            }

            List<Order> orders = orderRepository.findBySessionId(session.getId());
            boolean isDraftPrinted = (session.getNote() != null && session.getNote().contains("DRAFT_PRINTED"))
                    || orders.stream().anyMatch(o -> o.getNote() != null && o.getNote().contains("Đã in tạm tính"));

            if (isDraftPrinted) {
                status = "DRAFT_PRINTED";
                statusText = "Đã in tạm tính";
            }

            for (Order o : orders) {
                if (o.getStatus() == OrderStatus.CANCELLED) continue;
                if (orderCode == null) orderCode = o.getOrderCode();

                if (o.getItems() != null) {
                    for (OrderItem it : o.getItems()) {
                        if (it.getStatus() == OrderItemStatus.CANCELLED) continue;
                        BigDecimal sub = it.getSubtotal() != null ? it.getSubtotal() : BigDecimal.ZERO;
                        orderTotal = orderTotal.add(sub);

                        itemDTOs.add(CashierTableResponse.CashierOrderItemDTO.builder()
                                .orderItemId(it.getId())
                                .name(it.getMenuItem() != null ? it.getMenuItem().getName() : "Món ăn")
                                .quantity(it.getQuantity())
                                .unitPrice(it.getUnitPrice())
                                .subtotal(sub)
                                .status(it.getStatus() != null ? it.getStatus().name() : "COOKING")
                                .note(it.getNote())
                                .build());
                    }
                }
            }
        }

        if (isCallingBill) {
            status = "PAYMENT_REQUEST";
            statusText = "Y/c Thanh Toán";
        }

        return CashierTableResponse.builder()
                .id(table.getId())
                .code(table.getTableNumber())
                .name(table.getName())
                .zone(table.getZone())
                .zoneName(resolveZoneName(table.getZone()))
                .capacity(table.getCapacity())
                .guestCount(guestCount)
                .status(status)
                .statusText(statusText)
                .timeIn(timeIn)
                .durationMinutes(Math.max(0, duration))
                .sessionId(sessionId)
                .orderCode(orderCode != null ? orderCode : "#ROM-" + table.getTableNumber())
                .orderTotal(orderTotal)
                .totalItemsCount(itemDTOs.size())
                .isCallingBill(isCallingBill)
                .serviceRequestId(reqId)
                .items(itemDTOs)
                .build();
    }

    private CashierInvoiceResponse mapToInvoiceResponse(Bill bill, List<CashierInvoiceResponse.InvoiceItemDTO> items, RestaurantTable table) {
        String tableName = (table != null) ? table.getName() : "Bàn thanh toán";
        String zoneName = (table != null) ? resolveZoneName(table.getZone()) : "Khu vực chính";

        if (bill.getSession() != null && bill.getSession().getTable() != null) {
            tableName = bill.getSession().getTable().getName();
            zoneName = resolveZoneName(bill.getSession().getTable().getZone());
        }

        String cashierName = (bill.getCashier() != null) ? bill.getCashier().getFullName() + " (#" + bill.getCashier().getUsername() + ")" : "Thu ngân quầy";
        String shift = (bill.getPaymentTime() != null && bill.getPaymentTime().getHour() < 14) ? "Ca Sáng" : "Ca Tối";

        String methodLabel = bill.getPaymentMethod() != null ? switch (bill.getPaymentMethod()) {
            case CASH -> "Tiền mặt tại két";
            case BANK_TRANSFER -> "VietQR Chuyển khoản";
            case CARD -> "Thẻ POS";
        } : "Tiền mặt tại két";

        String summary = items.stream().map(i -> i.getName() + " x" + i.getQuantity()).collect(Collectors.joining(", "));
        if (summary.length() > 50) summary = summary.substring(0, 47) + "...";

        return CashierInvoiceResponse.builder()
                .id(bill.getId())
                .billCode(bill.getBillCode())
                .tableName(tableName)
                .zoneName(zoneName)
                .cashierName(cashierName)
                .shiftName(shift)
                .paymentTime(bill.getPaymentTime())
                .paymentTimeFormatted(bill.getPaymentTime() != null ? bill.getPaymentTime().format(DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy")) : "")
                .subtotal(bill.getSubtotal())
                .taxAmount(bill.getTaxAmount())
                .discountAmount(bill.getDiscountAmount())
                .finalAmount(bill.getFinalAmount())
                .paymentMethod(bill.getPaymentMethod() != null ? bill.getPaymentMethod().name() : "CASH")
                .paymentMethodLabel(methodLabel)
                .status(bill.getStatus() != null ? bill.getStatus().name() : "PAID")
                .statusLabel("Đã thanh toán")
                .note(bill.getNote())
                .itemsCount(items.size())
                .itemsSummary(summary)
                .items(items)
                .build();
    }

    @Override
    @Transactional
    public CashierTableResponse closeEmptySession(Long tableId, CloseEmptySessionRequest request) {
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

            // Bảo vệ chống thất thoát / gian lận F&B: Chỉ bàn có 0 món hợp lệ hoặc tổng tiền = 0đ mới được đóng 0đ
            if (nonCancelledItems > 0 || subtotal.compareTo(BigDecimal.ZERO) > 0) {
                throw new AppException("Bàn đang có " + nonCancelledItems + " món ăn hợp lệ (" + subtotal.toPlainString() + "đ). Không thể đóng phiên bàn trống! Vui lòng thực hiện thanh toán hoặc hủy món có Quản lý duyệt.", HttpStatus.BAD_REQUEST);
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

        // Đóng toàn bộ chuông gọi hoặc yêu cầu bill của bàn này
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

        return mapToCashierTableResponse(table);
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
