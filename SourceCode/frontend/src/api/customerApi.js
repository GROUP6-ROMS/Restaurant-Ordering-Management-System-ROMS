import axiosClient from './axiosClient';

/**
 * API Client dành riêng cho phân hệ Thực khách quét mã QR gọi món tại bàn
 */
export const customerApi = {
    // 1. Lấy toàn bộ danh mục thực đơn và món ăn đang mở bán
    getCustomerMenu: async () => {
        const response = await axiosClient.get('/customer/dining/menu');
        return response.data;
    },

    // Alias tiện ích đồng bộ cho Landing Page hoặc các trang công khai
    getMenu: async () => {
        const response = await axiosClient.get('/customer/dining/menu');
        return response.data;
    },

    // 2. Thực khách gửi đơn gọi món tại bàn
    placeCustomerOrder: async (orderData) => {
        const response = await axiosClient.post('/customer/dining/orders', orderData);
        return response.data;
    },

    // 3. Theo dõi tiến độ đĩa món và hóa đơn tạm tính theo bàn
    getOrderTracking: async (tableId, tableNumber) => {
        const response = await axiosClient.get('/customer/dining/tracking', {
            params: { tableId, tableNumber }
        });
        return response.data;
    },

    // 4. Bấm chuông gọi nhân viên phục vụ / xin nước / dọn bàn
    callWaiter: async (data) => {
        const response = await axiosClient.post('/customer/dining/call-waiter', data);
        return response.data;
    },

    // 5. Yêu cầu tính tiền gửi sang quầy Thu ngân POS
    requestPayment: async (tableId, tableNumber, paymentMethod = 'CASH') => {
        const response = await axiosClient.post('/customer/dining/request-payment', null, {
            params: { tableId, tableNumber, paymentMethod }
        });
        return response.data;
    },

    // 6. Xác thực mã QR bàn ăn khi thực khách quét vào
    verifyTableQr: async (qrToken) => {
        const response = await axiosClient.post('/customer/tables/verify-qr', { qrToken });
        return response.data;
    }
};

export default customerApi;
