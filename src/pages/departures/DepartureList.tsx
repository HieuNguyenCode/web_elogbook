import { useCallback, useEffect, useState } from 'react';
import { Search, MapPin, X , RefreshCw} from 'lucide-react';
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
            <div className="flex items-center justify-between flex-col-mobile gap-sm" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: '#0f172a', marginBottom: '4px' }}>Quản lý Tàu xuất bến</h1>
                    <p className="text-sm" style={{ color: '#64748b' }}>Theo dõi và quản lý thông tin các chuyến biển đã xuất bến</p>
                </div>
                
                
                <div className="flex items-center gap-md" style={{ flexWrap: 'wrap', flex: 1, minWidth: '320px', justifyContent: 'flex-end' }}>
                    <div className="flex items-center gap-sm">
                        <button className="btn btn-outline flex items-center gap-sm"
                                onClick={() => fetchDepartures(search, page)}
                                style={{borderRadius: '8px', padding: '0 16px', fontWeight: 600, height: '40px'}}>
                            <RefreshCw size={18}/>
                            <span>Làm mới</span>
                        </button>
                    </div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 auto', minWidth: '250px', maxWidth: '350px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                        <input
                            type="text"
                            className="input"
                            placeholder="Tìm kiếm biển số tàu..."
                            style={{ paddingLeft: '2.4rem', paddingRight: search ? '2rem' : '0.8rem', width: '100%', height: '40px', borderRadius: '8px' }}
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
                <div style={{ flex: 1, overflowY: 'auto' }} className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px', textAlign: 'center' }}>STT</th>
                                <th style={{ minWidth: '130px' }}>Tàu cá</th>
                                <th style={{ minWidth: '80px' }}>Loại</th>
                                <th style={{ minWidth: '180px' }}>Giấy phép</th>
                                <th style={{ minWidth: '120px' }}>Nghề chính</th>
                                <th style={{ minWidth: '160px' }}>Xuất bến</th>
                                <th style={{ width: '100px', textAlign: 'center' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={7} className="text-center" style={{ padding: '2rem' }}>Đang tải...</td></tr>
                            ) : departures.length === 0 ? (
                                <tr><td colSpan={7} className="text-center" style={{ padding: '2rem' }}>Chưa có dữ liệu.</td></tr>
                            ) : (
                                departures.map((dep, index) => (
                                    <tr key={dep.id} onClick={() => setSelectedVoyage(dep.id)} style={{ cursor: 'pointer' }} className="hover:bg-slate-50">
                                        <td className="text-center">{(page - 1) * pageSize + index + 1}</td>
                                        <td className="font-semibold" style={{ color: '#0f172a', fontSize: '14px' }}>
                                            {dep.shipName}
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '13px', color: '#475569' }}>{dep.type || 'Không rõ'}</span>
                                        </td>
                                        <td>
                                            {dep.miningLicenseNumber ? (
                                                <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 500, backgroundColor: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                                                    Số: {dep.miningLicenseNumber}
                                                    {dep.expirationDateOfMiningLicenseNumber && <div style={{ color: '#0369a1', marginTop: '2px' }}>(Hạn: {new Date(dep.expirationDateOfMiningLicenseNumber).toLocaleDateString('vi-VN')})</div>}
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Không có</span>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{ padding: '4px 8px', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '6px', fontSize: '12px', fontWeight: 500 }}>
                                                {dep.mainOccupation}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-xs" style={{ marginBottom: '4px' }}>
                                                <MapPin size={14} style={{ color: '#f59e0b' }} />
                                                <span style={{ fontWeight: 500 }}>{dep.portStart}</span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                {dep.departureDate ? new Date(dep.departureDate).toLocaleString('vi-VN') : 'Không rõ'}
                                            </div>
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
                
                <div className="flex items-center justify-between flex-col-mobile gap-sm" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', backgroundColor: '#ffffff' }}>
                    <div className="text-sm" style={{ color: '#64748b' }}>
                        Hiển thị <strong>{departures.length > 0 ? (page - 1) * pageSize + 1 : 0}</strong> - <strong>{Math.min(page * pageSize, totalCount)}</strong> trong tổng số <strong>{totalCount}</strong>
                    </div>
                    {true && (
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
