import type { Ship, ShipPayload } from '../../../types/Ship.ts';
import { axiosClient } from '../../../utils/axiosClient.ts';
import type { ServiceResponse } from '../../../types/api.ts';

export const listShipAPI = async (search: string = '', page: number = 1, pageSize: number = 10): Promise<ServiceResponse<Ship[]>> => {
    const data = await axiosClient.get<any, any>('/api/v1/Admin/Ship', {
        params: { search, page, pageSize }
    });
    return data;
}

export const shipDetailAPI = async (id: string): Promise<ShipPayload> => {
    const data = await axiosClient.get<any, any>(`/api/v1/Admin/Ship/${id}`);
    return data.data; 
}

export const createShipAPI = async (payload: ShipPayload): Promise<boolean> => {
    await axiosClient.post('/api/v1/Admin/Ship', payload);
    return true; 
}

export const updateShipAPI = async (id: string, payload: ShipPayload): Promise<boolean> => {
    await axiosClient.put(`/api/v1/Admin/Ship/${id}`, payload);
    return true; 
}
