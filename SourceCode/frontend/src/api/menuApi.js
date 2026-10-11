import axiosClient from './axiosClient';

/**
 * Service API phụ trách toàn bộ tương tác Thực Đơn & Danh Mục Món Ăn (Admin Menu)
 */
export const menuApi = {
    // 1. Lấy dữ liệu 3 thẻ KPI
    getSummary: () => {
        return axiosClient.get('/admin/menu/summary');
    },

    // 2. Tìm kiếm và lọc danh sách món ăn
    // params: { categoryId, station, isAvailable, search }
    getItems: (params = {}) => {
        return axiosClient.get('/admin/menu/items', { params });
    },

    // 3. Lấy thông tin chi tiết một món ăn
    getItemById: (id) => {
        return axiosClient.get(`/admin/menu/items/${id}`);
    },

    // 4. Tạo món ăn mới
    createItem: (data) => {
        return axiosClient.post('/admin/menu/items', data);
    },

    // 5. Cập nhật cấu hình món ăn
    updateItem: (id, data) => {
        return axiosClient.put(`/admin/menu/items/${id}`, data);
    },

    // 6. Bật/tắt trạng thái hết hàng (86'd)
    toggleAvailability: (id) => {
        return axiosClient.patch(`/admin/menu/items/${id}/toggle-availability`);
    },

    // 7. Xóa món ăn khỏi thực đơn
    deleteItem: (id) => {
        return axiosClient.delete(`/admin/menu/items/${id}`);
    },

    // 8. Lấy toàn bộ danh mục thực đơn kèm số món
    getCategories: () => {
        return axiosClient.get('/admin/menu/categories');
    },

    // 9. Thêm mới danh mục
    createCategory: (data) => {
        return axiosClient.post('/admin/menu/categories', data);
    },

    // 10. Cập nhật danh mục
    updateCategory: (id, data) => {
        return axiosClient.put(`/admin/menu/categories/${id}`, data);
    },

    // 11. Xóa danh mục
    deleteCategory: (id) => {
        return axiosClient.delete(`/admin/menu/categories/${id}`);
    },


};
