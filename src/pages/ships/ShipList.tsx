import { useEffect, useState, useRef } from 'react';
import { listShipAPI, createShipAPI, updateShipAPI } from '../../features/API/ship/Ship.ts';
import type { Ship, ShipPayload } from '../../types/Ship';
import { Plus, Pencil, Trash2, AlertCircle, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import ShipModal from './ShipModal';
import { axiosClient } from '../../utils/axiosClient';

type ModalMode = 'view' | 'create' | 'edit';

export default function ShipList() {
    const [ships, setShips] = useState<Ship[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Phân trang và tìm kiếm
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('create');
    const [selectedShip, setSelectedShip] = useState<Ship | null>(null);

    useEffect(() => {
        fetchShips(search, page);
    }, [page]); 

    const fetchShips = async (keyword: string, currentPage: number) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await listShipAPI(keyword, currentPage, 10);
            setShips(response.data || []);
            setTotalPages(response.totalPages || 1);
            setTotalCount(response.totalCount || 0);
        } catch (err: any) {
            setError(err.message || 'Không thể tải danh sách tàu');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearch(val);
        
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        
        searchTimeoutRef.current = setTimeout(() => {
            setPage(1);
            fetchShips(val, 1);
        }, 500);
    };

    const handleOpenModal = (mode: ModalMode, ship: Ship | null = null) => {
        setModalMode(mode);
        setSelectedShip(ship);
        setIsModalOpen(true);
    };

    const handleModalSubmit = async (payload: ShipPayload) => {
        try {
            if (modalMode === 'create') {
                await createShipAPI(payload);
                alert('Thêm tàu thành công!');
                setPage(1);
            } else if (modalMode === 'edit' && selectedShip) {
                await updateShipAPI(selectedShip.id, payload);
                alert('Cập nhật thông tin thành công!');
            }
            fetchShips(search, page);
        } catch (err: any) {
            throw err; 
        }
    };

    const handleDelete = async (ship: Ship) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa tàu ${ship.name} không?`)) {
            try {
                await axiosClient.delete(`/api/v1/Admin/Ship/${ship.id}`);
                alert('Xóa thành công!');
                fetchShips(search, page);
            } catch (err: any) {
                alert('Lỗi khi xóa: ' + (err.message || 'Không thể xóa'));
            }
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-md">
                <h2 className="text-lg font-bold text-gray-800">Danh sách tàu</h2>
                <div className="flex items-center gap-md">
                    <div style={{ position: 'relative' }}>
                        <Search 
                            size={18} 
                            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} 
                        />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm..." 
                            className="input" 
                            style={{ paddingLeft: '2.5rem', width: '250px' }}
                            value={search}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <button className="btn btn-primary flex items-center gap-sm" onClick={() => handleOpenModal('create')}>
                        <Plus size={18} />
                        Thêm tàu
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-md flex items-center gap-sm" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-color)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-sm)' }}>
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <div className="table-container flex-1 flex flex-col">
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '80px', textAlign: 'center' }}>STT</th>
                                <th>Tên tàu</th>
                                <th>ID</th>
                                <th style={{ width: '150px', textAlign: 'center' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="text-center text-muted" style={{ padding: '3rem' }}>
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : ships.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center text-muted" style={{ padding: '3rem' }}>
                                        {search ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có dữ liệu tàu nào.'}
                                    </td>
                                </tr>
                            ) : (
                                ships.map((ship, index) => (
                                    <tr key={ship.id}>
                                        <td className="text-center">{(page - 1) * 10 + index + 1}</td>
                                        <td className="font-medium">{ship.name}</td>
                                        <td>{ship.id}</td>
                                        <td>
                                            <div className="flex items-center justify-center gap-sm">
                                                <button className="btn btn-text" title="Xem" style={{ color: 'var(--info-color)', padding: '0.4rem' }} onClick={() => handleOpenModal('view', ship)}>
                                                    <Eye size={18} />
                                                </button>
                                                <button className="btn btn-text" title="Sửa" style={{ color: 'var(--warning-color)', padding: '0.4rem' }} onClick={() => handleOpenModal('edit', ship)}>
                                                    <Pencil size={18} />
                                                </button>
                                                <button className="btn btn-text" title="Xóa" style={{ color: 'var(--error-color)', padding: '0.4rem' }} onClick={() => handleDelete(ship)}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {totalPages > 1 && (
                    <div className="flex items-center justify-between" style={{ padding: 'var(--space-md) var(--space-xl)', borderTop: '1px solid var(--border-color)', backgroundColor: 'white' }}>
                        <div className="text-sm text-gray-500">
                            Hiển thị {ships.length} / {totalCount} kết quả
                        </div>
                        <div className="flex items-center gap-sm">
                            <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-sm font-medium px-2">Trang {page} / {totalPages}</span>
                            <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ShipModal 
                isOpen={isModalOpen}
                mode={modalMode}
                ship={selectedShip}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
            />
        </div>
    );
}
