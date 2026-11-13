import axiosClient from './axiosClient';

/**
 * Service API cho chức năng Đặt bàn trước (Reservation)
 */
export const reservationApi = {
  // 1. Khách hàng lấy danh sách phân khu bàn động từ Database
  getZones: async () => {
    const res = await axiosClient.get('/customer/reservations/zones');
    return res.data;
  },

  // 2. Khách hàng gửi đơn yêu cầu đặt bàn trực tuyến (PENDING)
  createReservation: async (data) => {
    const res = await axiosClient.post('/customer/reservations', data);
    return res.data;
  },

  // 3. Quản lý lấy danh sách đơn đặt bàn (hỗ trợ lọc status, date, keyword)
  getAdminReservations: async (params) => {
    const res = await axiosClient.get('/admin/reservations', { params });
    return res.data;
  },

  // 4. Quản lý lấy danh sách bàn trống khả dụng để xếp bàn cho đơn cụ thể
  getAvailableTablesForReservation: async (reservationId) => {
    const res = await axiosClient.get(`/admin/reservations/${reservationId}/available-tables`);
    return res.data;
  },

  // 5. Quản lý xác nhận cuộc gọi và gán bàn cho khách
  assignTable: async (reservationId, data) => {
    const res = await axiosClient.put(`/admin/reservations/${reservationId}/assign-table`, data);
    return res.data;
  },

  // 6. Quản lý hủy đơn đặt bàn kèm lý do
  cancelReservation: async (reservationId, data) => {
    const res = await axiosClient.put(`/admin/reservations/${reservationId}/cancel`, data);
    return res.data;
  },

  // 7. Quản lý kiểm tra và cập nhật danh sách món đặt trước (thêm, sửa số lượng, xóa)
  updateReservationItems: async (reservationId, data) => {
    const res = await axiosClient.put(`/admin/reservations/${reservationId}/items`, data);
    return res.data;
  },

  // 8. Quản lý check-in đón khách đặt bàn vào ngồi ăn (1-Click Check-in)
  checkIn: async (reservationId) => {
    const res = await axiosClient.post(`/admin/reservations/${reservationId}/check-in`);
    return res.data;
  },

  // 9. Khách hàng tra cứu trạng thái đơn đặt bàn bằng Mã đặt chỗ hoặc Số điện thoại
  lookupReservation: async (params) => {
    const res = await axiosClient.get('/customer/reservations/lookup', { params });
    return res.data;
  }
};

export default reservationApi;
