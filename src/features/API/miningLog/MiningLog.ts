import { axiosClient } from '../../../utils/axiosClient';
import type { LeavingPortsDto, ArrivingPortsDto, MiningLogDto } from '../../../types/MiningLog';

export const listDeparturesAPI = async (
    search?: string,
    page?: number,
    pageSize?: number
): Promise<{ data: LeavingPortsDto[]; total: number }> => {
    try {
        const data = await axiosClient.get<any, any>('/api/v2/Admin/MiningLog/Departures', {
            params: { search, page, pageSize }
        });
        return {
            data: data.data || [],
            total: data.totalCount || 0
        };
    } catch (err) {
        if ((err as any)?.status === 404) return { data: [], total: 0 };
        throw err;
    }
};

export const listArrivalsAPI = async (
    search?: string,
    page?: number,
    pageSize?: number
): Promise<{ data: ArrivingPortsDto[]; total: number }> => {
    try {
        const data = await axiosClient.get<any, any>('/api/v2/Admin/MiningLog/Arrivals', {
            params: { search, page, pageSize }
        });
        return {
            data: data.data || [],
            total: data.totalCount || 0
        };
    } catch (err) {
        if ((err as any)?.status === 404) return { data: [], total: 0 };
        throw err;
    }
};

export const miningLogDetailAPI = async (idSeaVoyage: string): Promise<MiningLogDto> => {
    const data = await axiosClient.get<any, any>(`/api/v2/Admin/MiningLog/${idSeaVoyage}`);
    return data.data;
};

export const listPortsAPI = async (): Promise<any[]> => {
    try {
        const data = await axiosClient.get<any, any>('/api/v2/Catalog/Ports');
        return data.data || [];
    } catch (err) {
        return [];
    }
};
