package com.romsteam.roms.controller;

import com.romsteam.roms.dto.request.CashierCheckoutRequest;
import com.romsteam.roms.dto.request.CloseEmptySessionRequest;
import com.romsteam.roms.dto.request.CloseShiftRequest;
import com.romsteam.roms.dto.request.ManagerApprovalRequest;
import com.romsteam.roms.dto.response.*;
import com.romsteam.roms.service.CashierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/cashier")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('CASHIER', 'MANAGER', 'WAITER', 'ADMIN')")
public class CashierController {

    private final CashierService cashierService;

    // 1. GET /api/cashier/tables - Lấy danh sách bàn POS realtime
    @GetMapping("/tables")
    public ResponseEntity<ApiResponse<List<CashierTableResponse>>> getPosTables(
            @RequestParam(required = false) String zone) {
        List<CashierTableResponse> tables = cashierService.getPosTables(zone);
        return ResponseEntity.ok(ApiResponse.success(tables, "Lấy danh sách bàn POS thành công"));
    }

    // 2. GET /api/cashier/tables/{id}/bill - Lấy chi tiết tạm tính của bàn
    @GetMapping("/tables/{id}/bill")
    public ResponseEntity<ApiResponse<CashierBillPreviewResponse>> getBillPreview(@PathVariable Long id) {
        CashierBillPreviewResponse preview = cashierService.getBillPreview(id);
        return ResponseEntity.ok(ApiResponse.success(preview, "Lấy thông tin tạm tính thành công"));
    }

    // 3. POST /api/cashier/tables/{id}/draft-bill - In phiếu tạm tính
    @PostMapping("/tables/{id}/draft-bill")
    public ResponseEntity<ApiResponse<CashierTableResponse>> markDraftPrinted(@PathVariable Long id) {
        CashierTableResponse response = cashierService.markDraftPrinted(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã in phiếu tạm tính"));
    }

    // 4. POST /api/cashier/tables/{id}/checkout - Chốt hóa đơn thanh toán
    @PostMapping("/tables/{id}/checkout")
    public ResponseEntity<ApiResponse<CashierInvoiceResponse>> checkoutBill(
            @PathVariable Long id,
            @Valid @RequestBody CashierCheckoutRequest request,
            Authentication authentication) {
        String cashierUsername = authentication != null ? authentication.getName() : null;
        CashierInvoiceResponse invoice = cashierService.checkoutBill(id, request, cashierUsername);
        return ResponseEntity.ok(ApiResponse.success(invoice, "Thanh toán hóa đơn thành công!"));
    }

    // 5. GET /api/cashier/invoices - Danh sách hóa đơn lịch sử
    @GetMapping("/invoices")
    public ResponseEntity<ApiResponse<List<CashierInvoiceResponse>>> getInvoiceHistory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String search) {
        List<CashierInvoiceResponse> history = cashierService.getInvoiceHistory(date, paymentMethod, search);
        return ResponseEntity.ok(ApiResponse.success(history, "Lấy lịch sử hóa đơn thành công"));
    }

    // 6. GET /api/cashier/invoices/{id} - Xem chi tiết 1 hóa đơn để in lại
    @GetMapping("/invoices/{id}")
    public ResponseEntity<ApiResponse<CashierInvoiceResponse>> getInvoiceDetail(@PathVariable Long id) {
        CashierInvoiceResponse invoice = cashierService.getInvoiceDetail(id);
        return ResponseEntity.ok(ApiResponse.success(invoice, "Lấy chi tiết hóa đơn thành công"));
    }

    // 7. GET /api/cashier/shift/summary - Doanh thu theo ca để kiểm đếm két tiền
    @GetMapping("/shift/summary")
    public ResponseEntity<ApiResponse<CashierShiftSummaryResponse>> getShiftSummary(
            @RequestParam(required = false, defaultValue = "MORNING") String shiftType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication authentication) {
        String cashierUsername = authentication != null ? authentication.getName() : null;
        CashierShiftSummaryResponse summary = cashierService.getShiftSummary(shiftType, date, cashierUsername);
        return ResponseEntity.ok(ApiResponse.success(summary, "Lấy doanh thu ca thành công"));
    }

    // 8. POST /api/cashier/items/{id}/void - Hủy món có mã PIN quản lý duyệt
    @PostMapping("/items/{id}/void")
    public ResponseEntity<ApiResponse<Void>> voidItem(
            @PathVariable Long id,
            @Valid @RequestBody ManagerApprovalRequest request) {
        cashierService.voidOrderItem(id, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Quản lý đã phê duyệt hủy món thành công"));
    }

    // 9. POST /api/cashier/shift/close - Chốt ca có mã PIN quản lý duyệt và duyệt két tiền chênh lệch
    @PostMapping("/shift/close")
    public ResponseEntity<ApiResponse<CloseShiftResponse>> closeShift(
            @Valid @RequestBody CloseShiftRequest request,
            Authentication authentication) {
        String cashierUsername = authentication != null ? authentication.getName() : null;
        CloseShiftResponse response = cashierService.closeShift(request, cashierUsername);
        return ResponseEntity.ok(ApiResponse.success(response, response.getMessage()));
    }

    // 10. POST /api/cashier/tables/{id}/close-empty - Đóng phiên ăn bàn trống (0đ)
    @PostMapping("/tables/{id}/close-empty")
    public ResponseEntity<ApiResponse<CashierTableResponse>> closeEmptySession(
            @PathVariable Long id,
            @RequestBody(required = false) CloseEmptySessionRequest request) {
        CashierTableResponse response = cashierService.closeEmptySession(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã đóng phiên bàn trống và giải phóng bàn thành công!"));
    }
}
