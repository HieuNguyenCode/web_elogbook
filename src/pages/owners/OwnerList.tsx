import { useEffect, useState, useRef } from 'react';
import { listShipOwnerAPI, createShipOwnerAPI, updateShipOwnerAPI } from '../../features/API/shipOwner/ShipOwner.ts';
import type { ShipOwner, ShipOwnerPayload } from '../../types/ShipOwner';
import { Plus, Pencil, Trash2, AlertCircle, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import OwnerModal from './OwnerModal';
import { axiosClient } from '../../utils/axiosClient';

type ModalMode = 'view' | 'create' | 'edit';

export default function OwnerList() {
    const [owners, setOwners] = useState<ShipOwner[]>([]);
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
    const [selectedOwner, setSelectedOwner] = useState<ShipOwner | null>(null);

    useEffect(() => {
        fetchOwners(search, page);
    }, [page]); // Chạy lại khi chuyển trang

    const fetchOwners = async (keyword: string, currentPage: number) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await listShipOwnerAPI(keyword, currentPage, 10);
            setOwners(response.data || []);
            setTotalPages(response.totalPages || 1);
            setTotalCount(response.totalCount || 0);
        } catch (err: any) {
            setError(err.message || 'Không thể tải danh sách chủ tàu');
        } finally {
            setIsLoading(false);
        }
    };

    // Tìm kiếm có debounce (chờ người dùng gõ xong mới gọi API)
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearch(val);
        
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        
        searchTimeoutRef.current = setTimeout(() => {
            setPage(1); // Reset về trang 1
            fetchOwners(val, 1);
        }, 500);
    };

    const handleOpenModal = (mode: ModalMode, owner: ShipOwner | null = null) => {
        setModalMode(mode);
        setSelectedOwner(owner);
        setIsModalOpen(true);
    };

    const handleModalSubmit = async (payload: ShipOwnerPayload) => {
        try {
            if (modalMode === 'create') {
                await createShipOwnerAPI(payload);
                alert('Thêm chủ tàu thành công!');
                setPage(1);
            } else if (modalMode === 'edit' && selectedOwner) {
                await updateShipOwnerAPI(selectedOwner.id, payload);
                alert('Cập nhật thông tin thành công!');
            }
            fetchOwners(search, page); // Tải lại trang hiện tại
        } catch (err: any) {
            throw err; 
        }
    };

    const handleDelete = async (owner: ShipOwner) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa chủ tàu ${owner.fullName} không?`)) {
            try {
                await axiosClient.delete(`/api/v1/Admin/ShipOwner/${owner.id}`);
                alert('Xóa thành công!');
                fetchOwners(search, page);
            } catch (err: any) {
                alert('Lỗi khi xóa: ' + (err.message || 'Không thể xóa'));
            }
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between mb-md">
                <h2 className="text-lg font-bold text-gray-800">Danh sách chủ tàu</h2>
                <div className="flex items-center gap-md">
                    <div style={{ position: 'relative' }}>
                        <Search 
                            size={18} 
                            style={{ 
                                position: 'absolute', 
                                left: '12px', 
                                top: '50%', 
                                transform: 'translateY(-50%)', 
                                color: '#9ca3af' 
                            }} 
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
                        Thêm chủ tàu
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-md flex items-center gap-sm" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-color)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-sm)' }}>
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Data Table */}
            <div className="table-container flex-1 flex flex-col">
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '80px', textAlign: 'center' }}>STT</th>
                                <th>Họ và tên</th>
                                <th>CCCD / CMND</th>
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
                            ) : owners.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center text-muted" style={{ padding: '3rem' }}>
                                        {search ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có dữ liệu chủ tàu nào.'}
                                    </td>
                                </tr>
                            ) : (
                                owners.map((owner, index) => (
                                    <tr key={owner.id}>
                                        <td className="text-center">{(page - 1) * 10 + index + 1}</td>
                                        <td className="font-medium">{owner.fullName}</td>
                                        <td>{owner.citizenId}</td>
                                        <td>
                                            <div className="flex items-center justify-center gap-sm">
                                                <button className="btn btn-text" title="Xem" style={{ color: 'var(--info-color)', padding: '0.4rem' }} onClick={() => handleOpenModal('view', owner)}>
                                                    <Eye size={18} />
                                                </button>
                                                <button className="btn btn-text" title="Sửa" style={{ color: 'var(--warning-color)', padding: '0.4rem' }} onClick={() => handleOpenModal('edit', owner)}>
                                                    <Pencil size={18} />
                                                </button>
                                                <button className="btn btn-text" title="Xóa" style={{ color: 'var(--error-color)', padding: '0.4rem' }} onClick={() => handleDelete(owner)}>
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
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between" style={{ padding: 'var(--space-md) var(--space-xl)', borderTop: '1px solid var(--border-color)', backgroundColor: 'white' }}>
                        <div className="text-sm text-gray-500">
                            Hiển thị {owners.length} / {totalCount} kết quả
                        </div>
                        <div className="flex items-center gap-sm">
                            <button 
                                className="btn btn-outline" 
                                style={{ padding: '0.25rem 0.5rem' }} 
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-sm font-medium px-2">Trang {page} / {totalPages}</span>
                            <button 
                                className="btn btn-outline" 
                                style={{ padding: '0.25rem 0.5rem' }} 
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <OwnerModal 
                isOpen={isModalOpen}
                mode={modalMode}
                owner={selectedOwner}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
            />
        </div>
    );
}
