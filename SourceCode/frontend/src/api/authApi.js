import axiosClient from './axiosClient';

export const authApi = {
    // Gửi username và pinCode 6 số lên Backend
    login: (username, pinCode) => {
        return axiosClient.post('/auth/login', { username, pinCode });
    },

    // Đăng xuất ca làm việc (Backend cập nhật isOnShift = false)
    logout: (username) => {
        return axiosClient.post('/auth/logout', { username });
    },
};
