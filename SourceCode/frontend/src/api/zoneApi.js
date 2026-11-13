import axiosClient from './axiosClient';

export const zoneApi = {
    // 1. Lấy danh sách tất cả khu vực kèm số lượng bàn
    getZones: () => {
        return axiosClient.get('/admin/zones');
    },

    // 2. Lấy chi tiết một khu vực theo ID
    getZoneById: (id) => {
        return axiosClient.get(`/admin/zones/${id}`);
    },

    // 3. Thêm khu vực mới (Chỉ Quản lý)
    createZone: (data) => {
        return axiosClient.post('/admin/zones', data);
    },

    // 4. Chỉnh sửa thông tin khu vực (Chỉ Quản lý)
    updateZone: (id, data) => {
        return axiosClient.put(`/admin/zones/${id}`, data);
    },

    // 5. Xóa khu vực (Chỉ Quản lý, chỉ xóa được khi không có bàn ăn trực thuộc)
    deleteZone: (id) => {
        return axiosClient.delete(`/admin/zones/${id}`);
    }
};
