import axiosClient from './axiosClient';

export const paymentApi = {
  /**
   * Tạo link và mã VietQR thanh toán động từ cổng payOS
   * @param {Object} data { tableId, discountType, discountValue, taxRate, note, forceCheckout, managerPin }
   */
  createPayOsLink: (data) => {
    return axiosClient.post('/payment/payos/create-link', data);
  },

  /**
   * Tra cứu trạng thái thanh toán đơn hàng payOS (hỗ trợ Polling & kiểm tra tức thì)
   * @param {number|string} orderCode
   */
  checkPayOsStatus: (orderCode) => {
    return axiosClient.get(`/payment/payos/status/${orderCode}`);
  }
};
