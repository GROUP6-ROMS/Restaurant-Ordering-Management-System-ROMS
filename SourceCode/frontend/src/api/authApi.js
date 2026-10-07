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

    // Quản lý phê duyệt bằng mã PIN 6 số
    verifyManagerPin: (managerUsername, pinCode, reason) => {
        return axiosClient.post('/auth/verify-manager-pin', { managerUsername, pinCode, reason });
    }
};
