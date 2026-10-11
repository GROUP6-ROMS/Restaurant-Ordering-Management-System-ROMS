import axiosClient from './axiosClient';

export const waiterApi = {
    // 1. Lấy sơ đồ bàn phục vụ
    getTables: (zone) => {
        return axiosClient.get('/waiter/tables', { params: { zone } });
    },

    // 2. Mở bàn đón khách
    openTable: (tableId, data) => {
        return axiosClient.post(`/waiter/tables/${tableId}/open`, data);
    },

    // 3. Dọn bàn xong
    cleanTable: (tableId) => {
        return axiosClient.post(`/waiter/tables/${tableId}/clean`);
    },

    // 4. Chuyển bàn
    transferTable: (data) => {
        return axiosClient.post('/waiter/tables/transfer', data);
    },

    // 5. Xác nhận đã bưng món
    deliverFood: (tableId) => {
        return axiosClient.post(`/waiter/tables/${tableId}/deliver`);
    },

    // 5.1. Xác nhận đã bưng 1 món riêng lẻ
    deliverSingleItem: (tableId, itemId) => {
        return axiosClient.post(`/waiter/tables/${tableId}/items/${itemId}/deliver`);
    },

    // 6. Xử lý xong chuông gọi
    resolveRequest: (requestId) => {
        return axiosClient.patch(`/waiter/requests/${requestId}/resolve`);
    },

    // 7. Gọi thêm món cho bàn (Lưu thật vào Database)
    addOrder: (tableId, data) => {
        return axiosClient.post(`/waiter/tables/${tableId}/orders`, data);
    },

    // 8. Yêu cầu tính tiền / Gọi POS Thu ngân
    requestPayment: (tableId) => {
        return axiosClient.post(`/waiter/tables/${tableId}/request-payment`);
    },

    // 9. Lấy danh mục món ăn từ CSDL
    getMenu: () => {
        return axiosClient.get('/waiter/menu');
    },

    // 10. Lấy danh mục khu vực bàn động
    getZones: () => {
        return axiosClient.get('/waiter/zones');
    },

    // 11. Hủy đặt bàn (RESERVED -> AVAILABLE)
    cancelReservation: (tableId) => {
        return axiosClient.post(`/waiter/tables/${tableId}/cancel-reservation`);
    }
};
