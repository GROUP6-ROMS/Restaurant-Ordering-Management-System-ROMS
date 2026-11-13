import axios from 'axios';

const axiosClient = axios.create({
    baseURL: '/api', // Đã được Vite proxy sang http://localhost:8080/api
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Tự động gắn Bearer Token vào header nếu đã đăng nhập hoặc có Dining Token của thực khách
axiosClient.interceptors.request.use((config) => {
    // Ưu tiên Token nhân viên nếu đang làm việc, nếu không lấy Dining Token của khách quét mã QR
    const staffToken = sessionStorage.getItem('roms_token');
    const diningToken = sessionStorage.getItem('roms_dining_token');

    const activeToken = staffToken || diningToken;
    if (activeToken) {
        config.headers.Authorization = `Bearer ${activeToken}`;
    }
    return config;
});

// Interceptor: Xử lý response và bắt lỗi, trích xuất Trace ID để đối soát
axiosClient.interceptors.response.use(
    (response) => {
        const traceId = response.headers?.['x-trace-id'] || response.data?.traceId;
        if (traceId && response.data && typeof response.data === 'object') {
            response.data.traceId = traceId;
        }
        return response;
    },
    (error) => {
        const traceId = error.response?.headers?.['x-trace-id'] || error.response?.data?.traceId;
        if (traceId) {
            error.traceId = traceId;
            console.warn(`[ROMS Trace: ${traceId}] Lỗi API ${error.config?.url}:`, error.response?.data?.message || error.message);
        }

        if (error.response && error.response.status === 401) {
            const requestUrl = error.config?.url || '';
            // Bỏ qua đăng xuất tự động nếu lỗi đến từ các thao tác xác thực thứ cấp (nhập mã PIN quản lý hủy món, chốt ca...)
            const isSecondaryAuth = error.config?.skipAuthRedirect ||
                                    requestUrl.includes('/verify-manager-pin') ||
                                    requestUrl.includes('/void') ||
                                    requestUrl.includes('/shift/close');

            if (!isSecondaryAuth) {
                const isDining = window.location.pathname.startsWith('/dining');
                if (isDining) {
                    // Phiên ăn của khách hết hạn: Xóa dining token để yêu cầu quét lại QR
                    sessionStorage.removeItem('roms_dining_token');
                } else {
                    sessionStorage.removeItem('roms_token');
                    sessionStorage.removeItem('roms_user');
                    localStorage.removeItem('roms_token');
                    localStorage.removeItem('roms_user');
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
