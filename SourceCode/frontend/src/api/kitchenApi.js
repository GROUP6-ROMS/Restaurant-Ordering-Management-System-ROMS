import axiosClient from './axiosClient';

/**
 * API service cho màn hình Bếp KDS (Kitchen Display System)
 */
export const kitchenApi = {
  // 1. Lấy danh sách các đơn bếp đang nấu (CONFIRMED, COOKING, READY)
  getActiveOrders: () => {
    return axiosClient.get('/kitchen/orders');
  },

  // 2. Cập nhật trạng thái từng món ăn (READY / CANCELLED)
  updateItemStatus: (itemId, status) => {
    return axiosClient.patch(`/kitchen/items/${itemId}/status`, { status });
  },

  // 3. Cập nhật trạng thái cả phiếu order (COOKING / READY)
  updateOrderStatus: (orderId, status) => {
    return axiosClient.patch(`/kitchen/orders/${orderId}/status`, { status });
  },

  // 4. Bật/Tắt ưu tiên hỏa tốc RUSH
  toggleRushOrder: (orderId) => {
    return axiosClient.patch(`/kitchen/orders/${orderId}/rush`, {});
  },

  // 5. Lấy thống kê hiệu suất bếp
  getKitchenSummary: () => {
    return axiosClient.get('/kitchen/summary');
  },
};
