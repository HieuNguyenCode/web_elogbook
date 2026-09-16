import { axiosClient } from '../../../utils/axiosClient';

export interface UserDto {
    id: string;
    userName: string;
    fullName: string;
    role: string;
}

export const getAllUsersAPI = async (): Promise<UserDto[]> => {
    const { data } = await axiosClient.get<any, any>('/api/v1/Admin/User');
    return data || [];
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
    const { data } = await axiosClient.get<any, any>('/api/v1/Admin/User/Agency');
    return data || [];
};
