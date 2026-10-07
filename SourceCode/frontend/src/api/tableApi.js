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
    }
};
