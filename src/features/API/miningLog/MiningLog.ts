import { axiosClient } from '../../../utils/axiosClient';
import type { LeavingPortsDto, ArrivingPortsDto, MiningLogDto, MiningLogBatchesData } from '../../../types/MiningLog';

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

export const miningLogBatchesAPI = async (idSeaVoyage: string): Promise<MiningLogBatchesData | null> => {
    try {
        const data = await axiosClient.get<any, any>(`/api/v2/Admin/MiningLog/${idSeaVoyage}/Batches`);
        return data.data || null;
    } catch (err) {
        return null;
    }
};

export const miningLogDetailByBatchAPI = async (idSeaVoyage: string, numberBatch: number): Promise<MiningLogDto> => {
    const data = await axiosClient.get<any, any>(`/api/v2/Admin/MiningLog/${idSeaVoyage}/${numberBatch}`);
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

export const downloadMiningLogPdfAPI = async (idSeaVoyage: string, numberBatch?: number): Promise<Blob> => {
    const batch = (numberBatch !== undefined && numberBatch !== null) ? numberBatch : 0;
    const url = `/api/v2/Admin/MiningLog/DownloadPdf/${idSeaVoyage}/${batch}`;
    const data = await axiosClient.get(url, {
        responseType: 'blob'
    });
    return data as unknown as Blob;
};
