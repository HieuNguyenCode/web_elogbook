export interface LoginCredentials {
    userName: string;
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    provinces?: string[];
    isFirstLogin?: boolean;
}