import axiosClient from './axiosClient';

export const restaurantProfileApi = {
  // Lấy thông tin cấu hình nhà hàng công khai từ Backend (lưu trữ trong SQL Server)
  getProfile: async () => {
    const res = await axiosClient.get('/public/restaurant/profile');
    return res.data;
  },

  // Cập nhật cấu hình thương hiệu, thông tin quán và ngân hàng (Quyền MANAGER)
  updateProfile: async (data) => {
    const res = await axiosClient.put('/admin/restaurant/profile', data);
    return res.data;
  },
};
