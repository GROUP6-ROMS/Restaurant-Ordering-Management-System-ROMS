package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.CashierCheckoutRequest;
import com.romsteam.roms.dto.request.ManagerApprovalRequest;
import com.romsteam.roms.dto.response.*;

import java.time.LocalDate;
import java.util.List;

import com.romsteam.roms.dto.request.CloseEmptySessionRequest;

public interface CashierService {

    // 1. Lấy danh sách bàn trên POS kèm trạng thái yêu cầu tính tiền (Polling 5s)
    List<CashierTableResponse> getPosTables(String zone);

    // 2. Lấy thông tin tạm tính chi tiết của một bàn
    CashierBillPreviewResponse getBillPreview(Long tableId);

    // 3. Đánh dấu bàn đã in phiếu tạm tính (DRAFT_PRINTED)
    CashierTableResponse markDraftPrinted(Long tableId);

    // 4. Thanh toán hóa đơn bàn ăn (Lưu Bill, đóng Session, chuyển bàn DIRTY, giải quyết chuông)
    CashierInvoiceResponse checkoutBill(Long tableId, CashierCheckoutRequest request, String cashierUsername);

    // 5. Lấy danh sách lịch sử hóa đơn trong ngày hoặc theo bộ lọc
    List<CashierInvoiceResponse> getInvoiceHistory(LocalDate date, String paymentMethod, String search);

    // 6. Lấy chi tiết 1 hóa đơn để in lại (Reprint)
    CashierInvoiceResponse getInvoiceDetail(Long invoiceId);

    // 7. Lấy tổng hợp doanh thu theo ca của thu ngân để đối soát két tiền
    CashierShiftSummaryResponse getShiftSummary(String shiftType, LocalDate date, String cashierUsername);

    // 8. Hủy món trên hóa đơn tạm tính có Quản lý duyệt mã PIN
    void voidOrderItem(Long itemId, ManagerApprovalRequest request);

    // 9. Xác nhận chốt ca làm việc có Quản lý duyệt mã PIN
    void closeShift(ManagerApprovalRequest request, String cashierUsername);

    // 10. Đóng phiên ăn bàn trống (0đ) khi khách không dùng món hoặc mở nhầm bàn
    CashierTableResponse closeEmptySession(Long tableId, CloseEmptySessionRequest request);
}
