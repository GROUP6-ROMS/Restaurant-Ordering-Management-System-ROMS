import axios from 'axios';

const axiosClient = axios.create({
    baseURL: '/api', // Đã được Vite proxy sang http://localhost:8080/api
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Tự động gắn Bearer Token vào header nếu đã đăng nhập
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('roms_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosClient;
