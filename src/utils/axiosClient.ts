import axios from 'axios';
import { config } from '../config/config';

export const axiosClient = axios.create({
    baseURL: config.baseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor cho Request: Luôn đính kèm token nếu có
axiosClient.interceptors.request.use((reqConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    return reqConfig;
}, (error) => Promise.reject(error));


let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Interceptor cho Response: Bắt lỗi 401 để tự động refresh token
axiosClient.interceptors.response.use(
    (response) => {
        // Trả về thẳng data payload thay vì nguyên object response
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = 'Bearer ' + token;
                    return axiosClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;
            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken) {
                isRefreshing = false;
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                // Tự gọi axios nguyên bản để tránh dính đệ quy interceptors
                const { data } = await axios.patch(`${config.baseUrl}/api/v1/Auth/RefreshToken`, undefined, {
                    headers: {
                        'Authorization': `Bearer ${refreshToken}`
                    }
                });

                // Assume format is ServiceResponse<AuthResponse>
                const newAccessToken = data.data.accessToken;
                const newRefreshToken = data.data.refreshToken;

                localStorage.setItem('accessToken', newAccessToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                axiosClient.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
                originalRequest.headers.Authorization = 'Bearer ' + newAccessToken;

                processQueue(null, newAccessToken);
                isRefreshing = false;

                // Thực hiện lại request ban đầu với token mới
                return axiosClient(originalRequest);
            } catch (err) {
                processQueue(err, null);
                isRefreshing = false;
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(err);
            }
        }

        // Nếu backend trả về ServiceResponse lỗi
        return Promise.reject(error.response?.data || error);
    }
);
