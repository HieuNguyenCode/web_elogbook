import { useEffect, useState, useRef } from 'react';
import { listShipOwnerAPI, createShipOwnerAPI, updateShipOwnerAPI, shipOwnerDetailAPI } from '../../features/API/shipOwner/ShipOwner.ts';
import type { ShipOwner, ShipOwnerPayload } from '../../types/ShipOwner';
import { Plus, Pencil, Trash2, AlertCircle, Eye, Search, ChevronLeft, ChevronRight, X, User } from 'lucide-react';
import OwnerModal from './OwnerModal';
import ConfirmModal from '../../components/ConfirmModal';
import { axiosClient } from '../../utils/axiosClient';
import { useToast } from '../../components/ToastContext';

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

    const { success, error: showError } = useToast();

    useEffect(() => {
        fetchOwners(search, page);
    }, [page]); // Chạy lại khi chuyển trang

    const fetchOwners = async (keyword: string, currentPage: number) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await listShipOwnerAPI(keyword, currentPage, 10);
            const rawList = response.data || [];
            
            // Khởi tạo danh sách kết hợp với cache nếu có
            const initialized = rawList.map(o => ({
                ...o,
                phone: o.phone || (o as any).Phone || undefined,
                address: o.address || (o as any).Address || undefined,
            }));
            setOwners(initialized);
            setTotalPages(response.totalPages || 1);
            setTotalCount(response.totalCount || 0);

            // Tự động tải chi tiết trong nền nếu danh sách chưa có số điện thoại hoặc địa chỉ
            const missingInfo = initialized.filter(o => !o.phone || !o.address);
            if (missingInfo.length > 0) {
                Promise.allSettled(
                    missingInfo.map(async (o) => {
                        try {
                            const detail = await shipOwnerDetailAPI(o.id);
                            if (detail) {
                                return { id: o.id, phone: detail.phone, address: detail.address };
                            }
                        } catch (e) {}
                        return null;
                    })
                ).then(results => {
                    setOwners(current =>
                        current.map(o => {
                            const match = results.find(r => r.status === 'fulfilled' && r.value?.id === o.id);
                            if (match && match.status === 'fulfilled' && match.value) {
                                return {
                                    ...o,
                                    phone: o.phone || match.value.phone,
                                    address: o.address || match.value.address
                                };
                            }
                            return o;
                        })
                    );
                });
            }
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
                success('Thêm chủ tàu thành công!');
                setPage(1);
            } else if (modalMode === 'edit' && selectedOwner) {
                await updateShipOwnerAPI(selectedOwner.id, payload);
                success('Cập nhật thông tin thành công!');
            }
            fetchOwners(search, page); // Tải lại trang hiện tại
        } catch (err: any) {
            throw err; 
        }
    };

    const [ownerToDelete, setOwnerToDelete] = useState<ShipOwner | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = (owner: ShipOwner) => {
        setOwnerToDelete(owner);
    };

    const confirmDeleteOwner = async () => {
        if (!ownerToDelete) return;
        setIsDeleting(true);
        try {
            await axiosClient.delete(`/api/v1/Admin/ShipOwner/${ownerToDelete.id}`);
            success('Xóa thành công!');
            setOwnerToDelete(null);
            fetchOwners(search, page);
        } catch (err: any) {
            showError('Xóa thất bại!');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between mb-lg" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <div className="flex items-center gap-sm">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        Danh sách chủ tàu
                    </h2>
                    <span className="badge-count">
                        {totalCount} chủ tàu
                    </span>
                </div>
                <div className="flex items-center gap-md">
                    <div style={{ position: 'relative' }}>
                        <Search 
                            size={17} 
                            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} 
                        />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm họ tên, CCCD..." 
                            className="input" 
                            style={{ paddingLeft: '2.4rem', paddingRight: search ? '2rem' : '0.8rem', width: '270px', borderRadius: '8px' }}
                            value={search}
                            onChange={handleSearchChange}
                        />
                        {search && (
                            <button 
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex' }}
                                onClick={() => {
                                    setSearch('');
                                    setPage(1);
                                    fetchOwners('', 1);
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <button className="btn btn-primary flex items-center gap-sm" onClick={() => handleOpenModal('create')} style={{ borderRadius: '8px', padding: '0 16px', fontWeight: 600 }}>
                        <Plus size={18} />
                        <span>Thêm chủ tàu</span>
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-md flex items-center gap-sm" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-color)', padding: '10px 16px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* Data Table */}
            <div className="table-container flex-1 flex flex-col">
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '65px', textAlign: 'center' }}>STT</th>
                                <th style={{ minWidth: '200px' }}>Họ và tên</th>
                                <th style={{ minWidth: '150px' }}>CCCD / CMND</th>
                                <th style={{ minWidth: '140px' }}>Số điện thoại</th>
                                <th style={{ minWidth: '220px' }}>Địa chỉ</th>
                                <th style={{ width: '130px', textAlign: 'center' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="text-center text-muted" style={{ padding: '3.5rem' }}>
                                        <div className="flex flex-col items-center justify-center gap-sm">
                                            <div style={{ width: '28px', height: '28px', border: '3px solid #e2e8f0', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                            <span>Đang tải danh sách chủ tàu...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : owners.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center text-muted" style={{ padding: '3.5rem' }}>
                                        {search ? 'Không tìm thấy kết quả phù hợp với từ khóa.' : 'Chưa có dữ liệu chủ tàu nào.'}
                                    </td>
                                </tr>
                            ) : (
                                owners.map((owner, index) => {
                                    const phoneVal = owner.phone || (owner as any).Phone;
                                    const addressVal = owner.address || (owner as any).Address;
                                    return (
                                        <tr key={owner.id}>
                                            <td className="text-center" style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>
                                                {(page - 1) * 10 + index + 1}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-sm">
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                                                        <User size={16} />
                                                    </div>
                                                    <span className="font-semibold" style={{ color: '#0f172a', fontSize: '14.5px' }}>
                                                        {owner.fullName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="material-chip chip-gray" style={{ fontWeight: 600, fontSize: '13px', letterSpacing: '0.02em' }}>
                                                    {owner.citizenId || '-'}
                                                </span>
                                            </td>
                                            <td>
                                                {phoneVal ? (
                                                    <span style={{ fontSize: '13.5px', color: '#334155', fontWeight: 500 }}>
                                                        {phoneVal}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted" style={{ fontStyle: 'italic', fontSize: '13px' }}>-</span>
                                                )}
                                            </td>
                                            <td>
                                                {addressVal ? (
                                                    <span style={{ fontSize: '13.5px', color: '#475569' }}>
                                                        {addressVal}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted" style={{ fontStyle: 'italic', fontSize: '13px' }}>-</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex items-center justify-center gap-xs">
                                                    <button 
                                                        className="btn btn-text" 
                                                        title="Xem chi tiết" 
                                                        style={{ color: '#0284c7', width: '34px', height: '34px', padding: 0, borderRadius: '8px' }} 
                                                        onClick={() => handleOpenModal('view', owner)}
                                                    >
                                                        <Eye size={17} />
                                                    </button>
                                                    <button 
                                                        className="btn btn-text" 
                                                        title="Chỉnh sửa" 
                                                        style={{ color: '#d97706', width: '34px', height: '34px', padding: 0, borderRadius: '8px' }} 
                                                        onClick={() => handleOpenModal('edit', owner)}
                                                    >
                                                        <Pencil size={17} />
                                                    </button>
                                                    <button 
                                                        className="btn btn-text" 
                                                        title="Xóa chủ tàu" 
                                                        style={{ color: '#dc2626', width: '34px', height: '34px', padding: 0, borderRadius: '8px' }} 
                                                        onClick={() => handleDelete(owner)}
                                                    >
                                                        <Trash2 size={17} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Footer */}
                <div className="flex items-center justify-between" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', backgroundColor: '#ffffff' }}>
                    <div className="text-sm" style={{ color: '#64748b' }}>
                        Hiển thị <strong>{owners.length > 0 ? (page - 1) * 10 + 1 : 0}</strong> - <strong>{Math.min(page * 10, totalCount)}</strong> trong tổng số <strong>{totalCount}</strong> chủ tàu
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-sm">
                            <button 
                                className="btn btn-outline" 
                                style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '13px' }} 
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                <ChevronLeft size={16} />
                                <span>Trước</span>
                            </button>
                            <span className="text-sm font-semibold px-2" style={{ color: '#334155' }}>Trang {page} / {totalPages}</span>
                            <button 
                                className="btn btn-outline" 
                                style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '13px' }} 
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                <span>Sau</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <OwnerModal 
                isOpen={isModalOpen}
                mode={modalMode}
                owner={selectedOwner}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
            />

            <ConfirmModal
                isOpen={!!ownerToDelete}
                title="Xác nhận xóa chủ tàu"
                message={
                    <span>
                        Bạn có chắc chắn muốn xóa chủ tàu <strong>{ownerToDelete?.fullName}</strong> (CCCD: {ownerToDelete?.citizenId || '---'}) không? Hành động này sẽ xóa dữ liệu chủ tàu khỏi hệ thống và không thể hoàn tác.
                    </span>
                }
                confirmText="Xóa chủ tàu"
                isLoading={isDeleting}
                onConfirm={confirmDeleteOwner}
                onCancel={() => setOwnerToDelete(null)}
            />
        </div>
    );
}
