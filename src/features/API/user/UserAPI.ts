import { axiosClient } from '../../../utils/axiosClient';

export interface UserDto {
    id: string;
    fullName: string;
    userName: string;
    role: string;
    locations?: string[];
    Locations?: string[];
    // Fallback cho serialization C# PascalCase
    Id?: string;
    FullName?: string;
    UserName?: string;
    Role?: string;
}

export const getAllUsersAPI = async (): Promise<UserDto[]> => {
    const res = await axiosClient.get<any, any>('/api/v1/Admin/User');
    return res?.data || (Array.isArray(res) ? res : []);
};

export const getUserByIdAPI = async (id: string): Promise<UserDto> => {
    const res = await axiosClient.get<any, any>(`/api/v1/Admin/User/${id}`);
    return res?.data || res;
};

export const createUserAPI = async (user: any): Promise<any> => {
    const res = await axiosClient.post('/api/v1/Admin/User', user);
    return res;
};

export const updateUserAPI = async (id: string, user: any): Promise<any> => {
    const res = await axiosClient.post(`/api/v1/Admin/User/${id}`, user);
    return res;
};

export const deleteUserAPI = async (id: string): Promise<any> => {
    const res = await axiosClient.delete(`/api/v1/Admin/User/${id}`);
    return res;
};

export const getAgencyUsersAPI = async (): Promise<UserDto[]> => {
    const res = await axiosClient.get<any, any>('/api/v1/Admin/User/Agency');
    return res?.data || (Array.isArray(res) ? res : []);
};
