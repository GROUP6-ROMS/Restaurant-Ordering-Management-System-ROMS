import axios from 'axios';

const axiosClient = axios.create({
    baseURL: '/api', // Đã được Vite proxy sang http://localhost:8080/api
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Tự động gắn Bearer Token vào header nếu đã đăng nhập (độc lập sessionStorage theo từng tab)
axiosClient.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('roms_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor: Bắt lỗi 401 (hết hạn Token hoặc chưa đăng nhập)
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            sessionStorage.removeItem('roms_token');
            sessionStorage.removeItem('roms_user');
            localStorage.removeItem('roms_token');
            localStorage.removeItem('roms_user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
