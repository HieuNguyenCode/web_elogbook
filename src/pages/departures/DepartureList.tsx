import { useCallback, useEffect, useState } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import type { LeavingPortsDto } from '../../types/MiningLog';
import { listDeparturesAPI } from '../../features/API/miningLog/MiningLog';
import { useToast } from '../../components/ToastContext';
import VoyageDetailModal from '../../components/MiningLog/VoyageDetailModal';
import * as React from 'react';

// noinspection DuplicatedCode
export default function DepartureList() {
    const [departures, setDepartures] = useState<LeavingPortsDto[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    
    const [selectedVoyage, setSelectedVoyage] = useState<string | null>(null);

    const { error: showError } = useToast();
    const pageSize = 10;
    const totalPages = Math.ceil(totalCount / pageSize);

    const fetchDepartures = useCallback(async (keyword: string, currentPage: number) => {
        try {
            setTimeout(() => setIsLoading(true), 0);
            const res = await listDeparturesAPI(keyword, currentPage, pageSize);
            setDepartures(res.data);
            setTotalCount(res.total);
        } catch (err) {
            showError((err as Error).message || 'Không thể tải danh sách xuất bến');
        } finally {
            setTimeout(() => setIsLoading(false), 0);
        }
    }, [showError]);

    useEffect(() => {
        setTimeout(() => void fetchDepartures(search, page), 0);
    }, [page, search, fetchDepartures]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearch(val);
        setPage(1);
        void fetchDepartures(val, 1);
    };

    return (
        <div className="flex flex-col h-full bg-white shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="flex items-center justify-between" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: '#0f172a', marginBottom: '4px' }}>Quản lý Tàu xuất bến</h1>
                    <p className="text-sm" style={{ color: '#64748b' }}>Theo dõi và quản lý thông tin các chuyến biển đã xuất bến</p>
                </div>
                
                <div className="flex items-center gap-md">
                    <div className="relative" style={{ display: 'flex', alignItems: 'center' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                        <input
                            type="text"
                            className="input"
                            placeholder="Tìm kiếm biển số tàu..."
                            style={{ paddingLeft: '2.4rem', paddingRight: search ? '2rem' : '0.8rem', width: '270px', borderRadius: '8px' }}
                            value={search}
                            onChange={handleSearchChange}
                        />
                        {search && (
                            <button
                                style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                                onClick={() => { setSearch(''); setPage(1); void fetchDepartures('', 1); }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="table-container flex-1 flex flex-col">
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px', textAlign: 'center' }}>STT</th>
                                <th style={{ minWidth: '150px' }}>Tên tàu / Biển số</th>
                                <th style={{ minWidth: '150px' }}>Cảng xuất</th>
                                <th style={{ minWidth: '150px' }}>Thời gian xuất</th>
                                <th style={{ minWidth: '150px' }}>Nghề chính</th>
                                <th style={{ width: '130px', textAlign: 'center' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={6} className="text-center" style={{ padding: '2rem' }}>Đang tải...</td></tr>
                            ) : departures.length === 0 ? (
                                <tr><td colSpan={6} className="text-center" style={{ padding: '2rem' }}>Chưa có dữ liệu.</td></tr>
                            ) : (
                                departures.map((dep, index) => (
                                    <tr key={dep.id} onClick={() => setSelectedVoyage(dep.id)} style={{ cursor: 'pointer' }} className="hover:bg-slate-50">
                                        <td className="text-center">{(page - 1) * pageSize + index + 1}</td>
                                        <td className="font-semibold" style={{ color: '#0f172a' }}>{dep.shipName}</td>
                                        <td>
                                            <div className="flex items-center gap-xs">
                                                <MapPin size={14} style={{ color: '#ef4444' }} />
                                                <span>{dep.portStart}</span>
                                            </div>
                                        </td>
                                        <td>{new Date(dep.departureDate).toLocaleString('vi-VN')}</td>
                                        <td>
                                            <span style={{ padding: '4px 8px', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '6px', fontSize: '12px', fontWeight: 500 }}>
                                                {dep.mainOccupation}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <button className="btn btn-text" onClick={(e) => { e.stopPropagation(); setSelectedVoyage(dep.id); }} style={{ padding: '6px 12px', fontSize: '13px' }}>
                                                Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="flex items-center justify-between" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', backgroundColor: '#ffffff' }}>
                    <div className="text-sm" style={{ color: '#64748b' }}>
                        Hiển thị <strong>{departures.length > 0 ? (page - 1) * pageSize + 1 : 0}</strong> - <strong>{Math.min(page * pageSize, totalCount)}</strong> trong tổng số <strong>{totalCount}</strong>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-sm">
                            <button className="btn btn-outline" style={{ padding: '0 10px', height: '32px' }} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</button>
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>Trang {page} / {totalPages}</span>
                            <button className="btn btn-outline" style={{ padding: '0 10px', height: '32px' }} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau</button>
                        </div>
                    )}
                </div>
            </div>

            <VoyageDetailModal 
                isOpen={!!selectedVoyage} 
                idSeaVoyage={selectedVoyage} 
                onClose={() => setSelectedVoyage(null)}
            />
        </div>
    );
}
