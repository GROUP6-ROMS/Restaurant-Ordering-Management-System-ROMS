import axiosClient from './axiosClient';

/**
 * Service API phục vụ chuông thông báo Quản lý (Admin Notification Center)
 * và luồng gọi nhân viên hỗ trợ từ phía khách hàng tại bàn
 */
export const notificationApi = {
  // 1. Quản lý lấy danh sách thông báo và số lượng (Bàn cần hỗ trợ + Đặt bàn mới)
  getAdminNotifications: () => {
    return axiosClient.get('/admin/notifications');
  },

  // 2. Quản lý đánh dấu đã xử lý yêu cầu hỗ trợ tại bàn
  resolveAssistance: (requestId) => {
    return axiosClient.patch(`/admin/notifications/assistance/${requestId}/resolve`);
  },

  // 3. Quản lý tạo thông báo hỗ trợ thử nghiệm (dùng để test chuông)
  createTestAssistance: (data) => {
    return axiosClient.post('/admin/notifications/test-assistance', data || {});
  },

  // 4. Khách hàng tại bàn bấm chuông gọi nhân viên hỗ trợ
  customerCallWaiter: (tableId, data) => {
    return axiosClient.post(`/customer/tables/${tableId}/call`, data || {});
  }
};
