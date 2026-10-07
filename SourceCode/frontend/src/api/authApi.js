import axiosClient from './axiosClient';

export const authApi = {
    // Gửi username và pinCode 6 số lên Backend
    login: (username, pinCode) => {
        return axiosClient.post('/auth/login', { username, pinCode });
    },
};
