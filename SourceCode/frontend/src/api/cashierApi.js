import axiosClient from './axiosClient';

export const cashierApi = {
  // 1. Lấy danh sách bàn POS realtime
  getPosTables: (zone) => {
    return axiosClient.get('/cashier/tables', { params: { zone } });
  },

  // 2. Lấy thông tin tạm tính chi tiết của 1 bàn
  getBillPreview: (tableId) => {
    return axiosClient.get(`/cashier/tables/${tableId}/bill`);
  },

  // 3. Đánh dấu đã in phiếu tạm tính
  markDraftPrinted: (tableId) => {
    return axiosClient.post(`/cashier/tables/${tableId}/draft-bill`);
  },

  // 4. Chốt thanh toán hóa đơn
  checkout: (tableId, data) => {
    return axiosClient.post(`/cashier/tables/${tableId}/checkout`, data);
  },

  // 5. Lấy lịch sử hóa đơn trong ngày
  getInvoices: (params) => {
    return axiosClient.get('/cashier/invoices', { params });
  },

  // 6. Xem chi tiết 1 hóa đơn để in lại
  getInvoiceDetail: (invoiceId) => {
    return axiosClient.get(`/cashier/invoices/${invoiceId}`);
  },

  // 7. Lấy tổng hợp doanh thu theo ca đối soát két tiền
  // openingCash: tiền đầu ca (số nguyên VND, mặc định 0)
  getShiftSummary: (shiftType, date, openingCash = 0) => {
    return axiosClient.get('/cashier/shift/summary', { params: { shiftType, date, openingCash } });
  },

  // 8. Hủy món có mã PIN quản lý
  voidItem: (itemId, data) => {
    return axiosClient.post(`/cashier/items/${itemId}/void`, data);
  },

  // 9. Chốt ca có mã PIN quản lý
  closeShift: (data) => {
    return axiosClient.post('/cashier/shift/close', data);
  },

  // 10. Đóng phiên ăn bàn trống (0đ) khi khách không dùng món
  closeEmptySession: (tableId, data) => {
    return axiosClient.post(`/cashier/tables/${tableId}/close-empty`, data);
  },
};
