package com.romsteam.roms.service.serviceImpl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.romsteam.roms.dto.request.CreatePayOsPaymentRequest;
import com.romsteam.roms.dto.response.PayOsPaymentResponse;
import com.romsteam.roms.entity.*;
import com.romsteam.roms.entity.enums.*;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.exception.ResourceNotFoundException;
import com.romsteam.roms.repository.*;
import com.romsteam.roms.service.PayOsService;
import com.romsteam.roms.service.RealtimeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayOsServiceImpl implements PayOsService {

    private final BillRepository billRepository;
    private final DiningSessionRepository sessionRepository;
    private final RestaurantTableRepository tableRepository;
    private final OrderRepository orderRepository;
    private final StaffRepository staffRepository;
    private final ServiceRequestRepository requestRepository;
    private final RealtimeService realtimeService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final PasswordEncoder passwordEncoder;

    @Value("${payos.client-id:900bfd44-68c9-4a33-8e7f-3219a6bf03cd}")
    private String clientId;

    @Value("${payos.api-key:fab51133-4393-4929-b4c5-bc3eb7b685a5}")
    private String apiKey;

    @Value("${payos.checksum-key:4d64dda3d0d8030d3d3a30ce4c83006a3ebb6e181440fa3b238ee0055628b1e7}")
    private String checksumKey;

    @Value("${payos.api-url:https://api-merchant.payos.vn/v2/payment-requests}")
    private String apiUrl;

    @Value("${payos.account-number:0905982428}")
    private String defaultAccountNumber;

    @Value("${payos.account-name:NGO VIET BAO HUY}")
    private String defaultAccountName;

    @Value("${payos.bank-name:MBBank}")
    private String defaultBankName;

    @Value("${payos.bank-bin:970422}")
    private String defaultBankBin;

    @Value("${app.frontend.url:http://roms-restaurant.duckdns.org}")
    private String frontendUrl;

    @Override
    @Transactional
    public PayOsPaymentResponse createPaymentLink(Long tableId, CreatePayOsPaymentRequest request, String cashierUsername) {
        log.info("[PayOS] Khởi tạo mã VietQR thanh toán cho bàn ID: {}, thu ngân: {}", tableId, cashierUsername);

        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn không tồn tại: " + tableId));

        DiningSession session = sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE)
                .orElseThrow(() -> new AppException("Bàn không có phiên ăn đang hoạt động để thanh toán!", HttpStatus.BAD_REQUEST));

        // 1. Kiểm tra Idempotency - Không tạo link mới nếu phiên đã PAID
        Optional<Bill> existingBillOpt = billRepository.findBySessionId(session.getId());
        if (existingBillOpt.isPresent() && existingBillOpt.get().getStatus() == BillStatus.PAID) {
            throw new AppException("Hóa đơn cho phiên ăn này đã được thanh toán hoàn tất!", HttpStatus.CONFLICT);
        }

        // 2. Tính toán tổng tiền hóa đơn thực tế và kiểm tra các món chưa hoàn thành
        List<Order> orders = orderRepository.findBySessionId(session.getId());
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
                }
            }
        }

        if (subtotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException("Bàn chưa có món ăn hợp lệ để thanh toán!", HttpStatus.BAD_REQUEST);
        }

        if (unservedCount > 0 && !Boolean.TRUE.equals(request.getForceCheckout())) {
            throw new AppException("Bàn còn " + unservedCount + " phần món đang chế biến / chờ bếp phục vụ! Vui lòng kiểm tra với Bếp hoặc xác nhận đồng ý thanh toán trước.", HttpStatus.BAD_REQUEST);
        }

        // 3. Tính thuế & giảm giá
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

        if (discountAmount.compareTo(subtotal) > 0) {
            throw new AppException("Số tiền giảm giá không được vượt quá tổng tiền món ăn!", HttpStatus.BAD_REQUEST);
        }

        boolean isHighDiscount = ("PERCENT".equalsIgnoreCase(request.getDiscountType()) && request.getDiscountValue() != null && request.getDiscountValue().compareTo(BigDecimal.valueOf(30)) > 0)
                || discountAmount.compareTo(BigDecimal.valueOf(200000)) > 0;
        if (isHighDiscount) {
            if (request.getManagerPin() == null || request.getManagerPin().trim().isEmpty()) {
                throw new AppException("Mức giảm giá lớn (> 30% hoặc > 200.000đ) bắt buộc phải có mã PIN Quản lý duyệt!", HttpStatus.BAD_REQUEST);
            }
            validateManagerPin(request.getManagerPin());
        }

        BigDecimal finalAmount = subtotal.add(taxAmount).subtract(discountAmount);
        if (finalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException("Số tiền thanh toán phải lớn hơn 0đ để sinh mã VietQR!", HttpStatus.BAD_REQUEST);
        }

        Staff cashier = null;
        if (cashierUsername != null) {
            cashier = staffRepository.findByUsername(cashierUsername).orElse(null);
        }

        // 4. Sinh mã giao dịch orderCode duy nhất (10 chữ số)
        long orderCode = (System.currentTimeMillis() % 9000000000L) + 1000000000L;

        String billCode = "BILL-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + (System.currentTimeMillis() % 10000);

        // 5. Lưu thông tin hóa đơn tạm tính (UNPAID)
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
        bill.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        bill.setStatus(BillStatus.UNPAID);
        bill.setPayosOrderCode(orderCode);
        bill.setNote(request.getNote());
        bill = billRepository.save(bill);

        // 6. Chuẩn bị gọi payOS API để sinh link & mã QR
        int amountInt = finalAmount.intValue();
        // Mô tả tối đa 25 ký tự, không dấu để tương thích mọi ngân hàng
        String description = "ROMS Ban " + table.getTableNumber();
        if (description.length() > 25) {
            description = description.substring(0, 25);
        }

        String cancelUrl = frontendUrl + "/pos";
        String returnUrl = frontendUrl + "/pos";

        // Tạo chữ ký: amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}
        String signData = String.format("amount=%d&cancelUrl=%s&description=%s&orderCode=%d&returnUrl=%s",
                amountInt, cancelUrl, description, orderCode, returnUrl);
        String signature = hmacSha256(checksumKey, signData);

        Map<String, Object> payOsReq = new HashMap<>();
        payOsReq.put("orderCode", orderCode);
        payOsReq.put("amount", amountInt);
        payOsReq.put("description", description);
        payOsReq.put("cancelUrl", cancelUrl);
        payOsReq.put("returnUrl", returnUrl);
        payOsReq.put("signature", signature);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-client-id", clientId);
        headers.set("x-api-key", apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payOsReq, headers);

        try {
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(apiUrl, entity, JsonNode.class);
            JsonNode root = response.getBody();

            if (root == null || !"00".equals(root.path("code").asText())) {
                String desc = root != null ? root.path("desc").asText() : "Không nhận được phản hồi từ payOS";
                log.error("[PayOS] Lỗi từ cổng payOS: {}", desc);
                throw new AppException("Lỗi khởi tạo VietQR payOS: " + desc, HttpStatus.BAD_GATEWAY);
            }

            JsonNode dataNode = root.path("data");
            String qrCode = dataNode.path("qrCode").asText();
            String checkoutUrl = dataNode.path("checkoutUrl").asText();
            String paymentLinkId = dataNode.path("paymentLinkId").asText();
            String accNo = dataNode.path("accountNumber").asText(defaultAccountNumber);
            String accName = dataNode.path("accountName").asText(defaultAccountName);
            String bin = dataNode.path("bin").asText(defaultBankBin);

            bill.setPayosPaymentLinkId(paymentLinkId);
            bill.setPayosQrCode(qrCode);
            billRepository.save(bill);

            log.info("[PayOS] Đã sinh mã VietQR thành công cho orderCode: {}, số tiền: {}đ", orderCode, amountInt);

            return PayOsPaymentResponse.builder()
                    .orderCode(orderCode)
                    .amount(finalAmount)
                    .description(description)
                    .qrCode(qrCode)
                    .checkoutUrl(checkoutUrl)
                    .paymentLinkId(paymentLinkId)
                    .status("PENDING")
                    .accountNumber(accNo)
                    .accountName(accName)
                    .bankName(defaultBankName)
                    .bankBin(bin)
                    .billCode(bill.getBillCode())
                    .tableId(table.getId())
                    .tableNumber(table.getTableNumber())
                    .build();

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("[PayOS] Lỗi khi kết nối tới payOS API: {}", e.getMessage(), e);
            throw new AppException("Không thể kết nối tới cổng thanh toán VietQR payOS: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    @Transactional
    public Map<String, Object> handleWebhook(Map<String, Object> webhookPayload) {
        log.info("[PayOS Webhook] Nhận dữ liệu webhook: {}", webhookPayload);

        if (webhookPayload == null) {
            return Map.of("code", "01", "desc", "Payload is null");
        }

        String signature = (String) webhookPayload.get("signature");
        Object dataObj = webhookPayload.get("data");

        if (!(dataObj instanceof Map<?, ?> dataRawMap)) {
            log.warn("[PayOS Webhook] Không tìm thấy dữ liệu 'data' trong webhook payload!");
            return Map.of("code", "01", "desc", "Missing data object");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> dataMap = (Map<String, Object>) dataRawMap;

        // Xác thực chữ ký số HMAC-SHA256
        boolean isSigValid = verifyWebhookSignature(dataMap, signature);
        if (!isSigValid) {
            log.error("[PayOS Webhook] ❌ Chữ ký Webhook KHÔNG KHỚP! Signature: {}", signature);
            throw new AppException("Chữ ký Webhook không hợp lệ!", HttpStatus.BAD_REQUEST);
        }

        log.info("[PayOS Webhook] ✅ Chữ ký Webhook hợp lệ!");

        Object orderCodeObj = dataMap.get("orderCode");
        Long orderCode = null;
        if (orderCodeObj instanceof Number num) {
            orderCode = num.longValue();
        } else if (orderCodeObj instanceof String str) {
            try {
                orderCode = Long.parseLong(str);
            } catch (NumberFormatException ignored) {}
        }

        String code = String.valueOf(dataMap.get("code"));

        if (orderCode != null && "00".equals(code)) {
            Optional<Bill> billOpt = billRepository.findByPayosOrderCode(orderCode);
            if (billOpt.isPresent()) {
                finalizePaidBill(billOpt.get(), "PAYOS_WEBHOOK");
            } else {
                log.warn("[PayOS Webhook] Không tìm thấy hóa đơn tương ứng với payosOrderCode: {}", orderCode);
            }
        }

        return Map.of("code", "00", "desc", "success");
    }

    @Override
    @Transactional
    public PayOsPaymentResponse checkPaymentStatus(Long orderCode) {
        Bill bill = billRepository.findByPayosOrderCode(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn với mã giao dịch payOS: " + orderCode));

        RestaurantTable table = (bill.getSession() != null) ? bill.getSession().getTable() : null;

        // 1. Nếu trong CSDL đã đánh dấu PAID
        if (bill.getStatus() == BillStatus.PAID) {
            return PayOsPaymentResponse.builder()
                    .orderCode(orderCode)
                    .amount(bill.getFinalAmount())
                    .status("PAID")
                    .billCode(bill.getBillCode())
                    .tableId(table != null ? table.getId() : null)
                    .tableNumber(table != null ? table.getTableNumber() : "")
                    .build();
        }

        // 2. Nếu chưa PAID trong DB, gọi trực tiếp API payOS để tra cứu trạng thái tức thì (Polling Fallback)
        try {
            String queryUrl = "https://api-merchant.payos.vn/v2/payment-requests/" + orderCode;
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-client-id", clientId);
            headers.set("x-api-key", apiKey);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<JsonNode> response = restTemplate.exchange(queryUrl, HttpMethod.GET, entity, JsonNode.class);
            JsonNode root = response.getBody();

            if (root != null && "00".equals(root.path("code").asText())) {
                JsonNode dataNode = root.path("data");
                String payosStatus = dataNode.path("status").asText();

                if ("PAID".equalsIgnoreCase(payosStatus)) {
                    log.info("[PayOS Polling] Phát hiện đơn hàng {} đã chuyển khoản thành công từ API payOS! Tiến hành tất toán.", orderCode);
                    finalizePaidBill(bill, "PAYOS_STATUS_POLLING");

                    return PayOsPaymentResponse.builder()
                            .orderCode(orderCode)
                            .amount(bill.getFinalAmount())
                            .status("PAID")
                            .billCode(bill.getBillCode())
                            .tableId(table != null ? table.getId() : null)
                            .tableNumber(table != null ? table.getTableNumber() : "")
                            .build();
                }
            }
        } catch (Exception e) {
            log.warn("[PayOS] Tra cứu trạng thái đơn hàng {} từ payOS API thất bại: {}", orderCode, e.getMessage());
        }

        return PayOsPaymentResponse.builder()
                .orderCode(orderCode)
                .amount(bill.getFinalAmount())
                .status("PENDING")
                .billCode(bill.getBillCode())
                .tableId(table != null ? table.getId() : null)
                .tableNumber(table != null ? table.getTableNumber() : "")
                .build();
    }

    /**
     * Hoàn tất thanh toán hóa đơn, đóng phiên ăn, đổi trạng thái bàn DIRTY và broadcast WebSocket
     */
    @Transactional
    public synchronized void finalizePaidBill(Bill bill, String source) {
        if (bill == null) return;
        if (bill.getStatus() == BillStatus.PAID) {
            log.info("[PayOS] Bill {} đã ở trạng thái PAID, bỏ qua xử lý lặp từ nguồn {}", bill.getBillCode(), source);
            return;
        }

        bill.setStatus(BillStatus.PAID);
        bill.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        bill.setPaymentTime(LocalDateTime.now());
        bill = billRepository.save(bill);

        DiningSession session = bill.getSession();
        RestaurantTable table = null;

        if (session != null) {
            session.setStatus(SessionStatus.COMPLETED);
            session.setEndTime(LocalDateTime.now());
            sessionRepository.save(session);
            table = session.getTable();
        }

        if (table != null) {
            table.setStatus(TableStatus.DIRTY);
            tableRepository.save(table);

            // Đóng tất cả yêu cầu tính tiền loại BILL của bàn
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
                        "paymentMethod", "BANK_TRANSFER",
                        "payosOrderCode", bill.getPayosOrderCode() != null ? bill.getPayosOrderCode() : 0L
                ));
                realtimeService.notifyTableUpdate(table.getId(), table.getTableNumber(), TableStatus.DIRTY.name(), "Thanh toán chuyển khoản VietQR thành công. Bàn cần dọn");
            } catch (Exception e) {
                log.warn("[Realtime] Lỗi broadcast finalizePaidBill bàn {}: {}", table.getTableNumber(), e.getMessage());
            }
        }

        log.info("[PayOS Settlement] ✅ ĐÃ XÁC NHẬN THANH TOÁN THÀNH CÔNG Hóa đơn {} (Số tiền: {}đ) từ nguồn: {}",
                bill.getBillCode(), bill.getFinalAmount(), source);
    }

    @Override
    public boolean verifyWebhookSignature(Map<String, Object> data, String signature) {
        if (data == null || signature == null || signature.trim().isEmpty()) {
            return false;
        }
        try {
            // Sắp xếp các key theo thứ tự bảng chữ cái alphabet
            Map<String, Object> sortedMap = new TreeMap<>(data);
            StringBuilder sb = new StringBuilder();

            for (Map.Entry<String, Object> entry : sortedMap.entrySet()) {
                if (sb.length() > 0) {
                    sb.append("&");
                }
                Object val = entry.getValue();
                String valStr = (val == null || "null".equals(val)) ? "" : val.toString();
                sb.append(entry.getKey()).append("=").append(valStr);
            }

            String calculatedSig = hmacSha256(checksumKey, sb.toString());
            boolean matches = calculatedSig.equalsIgnoreCase(signature.trim());
            if (!matches) {
                log.warn("[PayOS Webhook] Chuỗi dữ liệu ký: [{}] | Chuỗi hash tính ra: [{}] | Signature nhận được: [{}]",
                        sb.toString(), calculatedSig, signature);
            }
            return matches;
        } catch (Exception e) {
            log.error("[PayOS] Lỗi khi xác thực chữ ký số Webhook: {}", e.getMessage(), e);
            return false;
        }
    }

    private String hmacSha256(String key, String data) {
        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] hash = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi sinh mã băm HMAC-SHA256 payOS", e);
        }
    }

    private Staff validateManagerPin(String pin) {
        if (pin == null || pin.trim().length() != 6) {
            throw new AppException("Mã PIN Quản lý phải gồm đúng 6 chữ số!", HttpStatus.BAD_REQUEST);
        }
        List<Staff> managers = staffRepository.findByRole(UserRole.MANAGER);
        for (Staff m : managers) {
            if (m.getPinCode() != null && passwordEncoder.matches(pin.trim(), m.getPinCode())) {
                return m;
            }
        }
        throw new AppException("Mã PIN Quản lý không chính xác!", HttpStatus.UNAUTHORIZED);
    }
}
