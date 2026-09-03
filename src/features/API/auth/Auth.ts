import type {AuthResponse, LoginCredentials} from "../../../types/Auth.ts";
import {axiosClient} from "../../../utils/axiosClient.ts";
import type {ServiceResponse} from "../../../types/api.ts";
import {config} from "../../../config/config.ts";

export const loginAPI = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // axiosClient đã tự map response.data nên ta nhận thẳng data
    const data = await axiosClient.post<any, any>('/api/v1/Auth/Login', credentials);
    return data.data; // do config response interceptor đang trả về data.data hoặc nguyên gốc
};

export const refreshTokenAPI = async (refreshToken: string): Promise<AuthResponse> => {
    const response = await fetch(config.baseUrl + '/api/v1/Auth/RefreshToken', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`,
        },
    });

    const data: ServiceResponse<AuthResponse> = await response.json();

    if (!response.ok || data.status >= 400) {
        // Ném nguyên object data lỗi ra để nơi gọi có thể catch và xử lý UI
        throw data;
    }

    // Trả về data (payload thực sự) nếu thành công
    return data.data!;
};