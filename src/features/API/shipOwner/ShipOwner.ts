import type {ShipOwner, ShipOwnerPayload} from '../../../types/ShipOwner.ts';
import {axiosClient} from '../../../utils/axiosClient.ts';
import type {ServiceResponse} from '../../../types/api.ts';

// Lấy danh sách chủ tàu (có tìm kiếm và phân trang)
export const listShipOwnerAPI = async (search: string = '', page: number | null = null, pageSize: number | null = null): Promise<ServiceResponse<ShipOwner[]>> => {
    // Trả về nguyên cục ServiceResponse để lấy thông tin phân trang (totalCount, totalPages)
    const data = await axiosClient.get<any, any>('/api/v1/Admin/ShipOwner', {
        params: {search, page, pageSize}
    });
    return data;
}

// Lấy chi tiết chủ tàu
export const shipOwnerDetailAPI = async (id: string): Promise<ShipOwnerPayload> => {
    const data = await axiosClient.get<any, any>(`/api/v1/Admin/ShipOwner/${id}`);
    return data.data;
}

// Tạo mới chủ tàu
export const createShipOwnerAPI = async (shipOwner: ShipOwnerPayload): Promise<boolean> => {
    // Thành công trả về status 200/201 kèm message, data = undefined/null
    await axiosClient.post('/api/v1/Admin/ShipOwner', shipOwner);
    return true;
}

// Cập nhật chủ tàu
export const updateShipOwnerAPI = async (id: string, shipOwner: ShipOwnerPayload): Promise<boolean> => {
    await axiosClient.put(`/api/v1/Admin/ShipOwner/${id}`, shipOwner);
    return true;
}