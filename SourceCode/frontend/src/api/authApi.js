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

    // Duy trì phiên làm việc (Heartbeat / Keep-Alive) và tự động đồng bộ isOnShift = true
    heartbeat: (username) => {
        return axiosClient.post('/auth/heartbeat', { username });
    },

    // Quản lý phê duyệt bằng mã PIN 6 số
    verifyManagerPin: (managerUsername, pinCode, reason) => {
        return axiosClient.post('/auth/verify-manager-pin', { managerUsername, pinCode, reason });
    },

    // Yêu cầu cấp mã OTP khôi phục mã PIN Quản lý
    requestPinResetOtp: (username) => {
        return axiosClient.post('/auth/forgot-pin/request-otp', { username });
    },

    // Đặt lại mã PIN bằng OTP hoặc Khóa Master Recovery Key
    resetPinWithOtpOrRecoveryKey: (data) => {
        return axiosClient.post('/auth/forgot-pin/reset', data);
    },

    // Đặt lại mã PIN bằng OTP
    resetPinWithOtp: (username, otpOrRecoveryKey, newPinCode, confirmPinCode) => {
        return axiosClient.post('/auth/forgot-pin/reset', {
            username,
            otpOrRecoveryKey,
            newPinCode,
            confirmPinCode: confirmPinCode || newPinCode
        });
    }
};
