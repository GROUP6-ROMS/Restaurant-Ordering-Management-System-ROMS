import axiosClient from './axiosClient';

export const tableApi = {
    // Lấy 5 thẻ thống kê KPI
    getSummary: () => {
        return axiosClient.get('/admin/tables/summary');
    },

    // Lấy danh sách bàn theo bộ lọc khu vực, trạng thái và tìm kiếm
    getTables: (params) => {
        return axiosClient.get('/admin/tables', { params });
    },

    // Thêm bàn mới
    createTable: (data) => {
        return axiosClient.post('/admin/tables', data);
    },

    // Chỉnh sửa thông tin bàn (Mã bàn, Tên hiển thị, Khu vực, Sức chứa)
    updateTable: (id, data) => {
        return axiosClient.put(`/admin/tables/${id}`, data);
    },

    // Cập nhật trạng thái bàn (Khóa bàn, Đặt trước, Bàn trống...)
    updateStatus: (id, data) => {
        return axiosClient.patch(`/admin/tables/${id}/status`, data);
    },

    // Làm mới mã QR Token
    refreshQr: (id) => {
        return axiosClient.post(`/admin/tables/${id}/refresh-qr`);
    },

    // Xóa bàn
    deleteTable: (id) => {
        return axiosClient.delete(`/admin/tables/${id}`);
    },

    // Khách hàng xác thực QR code
    verifyCustomerQr: (qrToken) => {
        return axiosClient.post('/customer/tables/verify-qr', { qrToken });
    },
    verifyQr: (qrToken) => {
        return axiosClient.post('/customer/tables/verify-qr', { qrToken });
    },
    // Xem nhanh danh sách món đang gọi tại bàn
    getTableOrders: (tableId) => {
        return axiosClient.get(`/admin/tables/${tableId}/orders`);
    },

    // Quản lý xác nhận đã xử lý chuông gọi phục vụ
    resolveServiceRequest: (requestId) => {
        return axiosClient.patch(`/admin/tables/requests/${requestId}/resolve`);
    },

    // Quản lý xử lý toàn bộ chuông gọi của 1 bàn
    resolveAllTableRequests: (tableId) => {
        return axiosClient.patch(`/admin/tables/${tableId}/resolve-all-requests`);
    },

    // Quản lý gọi thêm món trực tiếp vào bàn ăn
    addItemsToTable: (tableId, data) => {
        return axiosClient.post(`/admin/tables/${tableId}/add-items`, data);
    },

    // Quản lý điều chỉnh số lượng món ăn tại bàn
    updateOrderItemQuantity: (orderItemId, quantity) => {
        return axiosClient.patch(`/admin/tables/items/${orderItemId}/quantity`, { quantity });
    },

    // Quản lý hủy món ăn tại bàn kèm lý do
    cancelOrderItem: (orderItemId, reason) => {
        return axiosClient.post(`/admin/tables/items/${orderItemId}/cancel`, { reason });
    },
};
