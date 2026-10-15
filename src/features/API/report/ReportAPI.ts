import { axiosClient } from '../../../utils/axiosClient';
import type { ReportDto } from '../../../types/Report';

export const getAdminReportAPI = async (year: number = new Date().getFullYear(), top: number = 5): Promise<ReportDto> => {
    const res = await axiosClient.get<any, any>('/api/v2/Admin/Report', {
        params: { year, top }
    });
    return res?.data || res;
};
