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

  // Tải ảnh logo quán trực tiếp từ thiết bị lên máy chủ
  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosClient.post('/admin/menu/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  }
};
