// noinspection DuplicatedCode
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {createShipAPI, listShipAPI, shipDetailAPI, updateShipAPI} from '../../features/API/ship/Ship.ts';
import {listShipOwnerAPI} from '../../features/API/shipOwner/ShipOwner.ts';
import type {Ship, ShipResponse} from '../../types/Ship';
import type {ShipOwner} from '../../types/ShipOwner';
import {
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Eye,
    Pencil,
    Plus,
    Search,
    Ship as ShipIcon,
    Trash2,
    X
} from 'lucide-react';
import ShipModal from './ShipModal';
import ConfirmModal from '../../components/ConfirmModal';
import {axiosClient} from '../../utils/axiosClient';
import {useToast} from '../../components/ToastContext';

type ModalMode = 'view' | 'create' | 'edit';

export default function ShipList() {
    const [ships, setShips] = useState<Ship[]>([]);
    const [ownersList, setOwnersList] = useState<ShipOwner[]>([]);
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

    const {success, error: showError} = useToast();

    // Tải danh mục chủ tàu một lần để tra cứu tên chủ tàu nhanh
    const fetchShips = useCallback(async (keyword: string, currentPage: number) => {
        try {
            setTimeout(() => setIsLoading(true), 0);
            setError(null);
            const response = await listShipAPI(keyword, currentPage, 10);
            const fetched = response.data || [];

            // Khởi tạo danh sách tàu ngay lập tức, kết hợp với các dữ liệu đã lưu trong cache
            const initialized = fetched.map(s => {
                return {
                    ...s,
                    ownerName: (s as Ship & {
                        shipOwner?: { fullName?: string },
                        ShipOwner?: { fullName?: string },
                        shipOwnerName?: string
                    }).shipOwner?.fullName || (s as Ship & {
                        shipOwner?: { fullName?: string },
                        ShipOwner?: { fullName?: string },
                        shipOwnerName?: string
                    }).ShipOwner?.fullName || (s as Ship & {
                        shipOwner?: { fullName?: string },
                        ShipOwner?: { fullName?: string },
                        shipOwnerName?: string
                    }).shipOwnerName || undefined
                };
            });
            setShips(initialized);
            setTotalPages(response.totalPages || 1);
            setTotalCount(response.totalCount || 0);

            // Tự động tải chi tiết trong nền đối với các tàu trên trang hiện tại để nạp số Serial thiết bị và Tên chủ tàu
            Promise.allSettled(
                initialized.map(async (s) => {
                    try {
                        const detail: ShipResponse = await shipDetailAPI(s.id);
                        if (detail) {
                            const shipSerial = detail.serial || '';
                            const devSerial = detail.deviceSerial || '';
                            const ownerName = detail.shipOwner?.fullName || detail.ShipOwner?.fullName || detail.shipOwnerName || '';
                            return {
                                id: s.id,
                                serial: shipSerial,
                                deviceSerial: devSerial,
                                ownerName: ownerName,
                                idshipOwner: detail.idshipOwner
                            };
                        }
                    } catch { /* ignore */
                    }
                    return null;
                })
            ).then(results => {
                setShips(currentShips =>
                    currentShips.map(s => {
                        const match = results.find(r => r.status === 'fulfilled' && r.value?.id === s.id);
                        if (match && match.status === 'fulfilled' && match.value) {
                            const val = match.value as {
                                id: string;
                                serial?: string;
                                deviceSerial?: string;
                                ownerName?: string;
                                idshipOwner?: string
                            };
                            const owner = val.ownerName || (val.idshipOwner ? ownersList.find(o => o.id === val.idshipOwner)?.fullName : undefined);
                            return {
                                ...s,
                                serial: val.serial || s.serial,
                                deviceSerial: val.deviceSerial || s.deviceSerial,
                                ownerName: owner || (s as Ship & {
                                    shipOwner?: { fullName?: string },
                                    ShipOwner?: { fullName?: string },
                                    shipOwnerName?: string
                                }).ownerName
                            };
                        }
                        return s;
                    })
                );
            });
        } catch {
            showError('Không thể tải danh sách tàu');
        } finally {
            setTimeout(() => setIsLoading(false), 0);
        }
    }, [ownersList, showError]);

    useEffect(() => {
        listShipOwnerAPI('', 1, 100).then(res => {
            if (res.data) setOwnersList(res.data);
        }).catch(() => {
        });
    }, []);

    useEffect(() => {
        setTimeout(() => void fetchShips(search, page), 0);
    }, [page, search, fetchShips]);


    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearch(val);

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(() => {
            setPage(1);
            void fetchShips(val, 1);
        }, 500);
    };

    const handleOpenModal = (mode: ModalMode, ship: Ship | null = null) => {
        setModalMode(mode);
        setSelectedShip(ship);
        setIsModalOpen(true);
    };

    const handleModalSubmit = async (payload: ShipResponse) => {
        if (modalMode === 'create') {
            await createShipAPI(payload);
            setPage(1);
        } else if (modalMode === 'edit' && selectedShip) {
            await updateShipAPI(selectedShip.id, payload);

            if (payload.deviceSerial) {
                localStorage.setItem(`ship_device_serial_${selectedShip.id}`, payload.deviceSerial);
                if (payload.serial) {
                    localStorage.setItem(`ship_device_serial_${payload.serial}`, payload.deviceSerial);
                }
            }
        }
        void fetchShips(search, page);
    };

    const [shipToDelete, setShipToDelete] = useState<Ship | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = (ship: Ship) => {
        setShipToDelete(ship);
    };

    const confirmDeleteShip = async () => {
        if (!shipToDelete) return;
        setIsDeleting(true);
        try {
            await axiosClient.delete(`/api/v1/Admin/Ship/${shipToDelete.id}`);
            success('Xóa tàu thành công!');
            setShipToDelete(null);
            void fetchShips(search, page);
        } catch {
            showError('Xóa tàu thất bại!');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between mb-lg" style={{flexWrap: 'wrap', gap: '12px'}}>
                <div className="flex items-center gap-sm">
                    <h2 style={{fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0}}>
                        Danh sách tàu
                    </h2>
                    <span className="badge-count">
                        {totalCount} tàu
                    </span>
                </div>
                <div className="flex items-center gap-md">
                    <div style={{position: 'relative'}}>
                        <Search
                            size={17}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#94a3b8'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tên tàu, serial..."
                            className="input"
                            style={{
                                paddingLeft: '2.4rem',
                                paddingRight: search ? '2rem' : '0.8rem',
                                width: '270px',
                                borderRadius: '8px'
                            }}
                            value={search}
                            onChange={handleSearchChange}
                        />
                        {search && (
                            <button
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#94a3b8',
                                    padding: '2px',
                                    display: 'flex'
                                }}
                                onClick={() => {
                                    setSearch('');
                                    setPage(1);
                                    void fetchShips('', 1);
                                }}
                            >
                                <X size={14}/>
                            </button>
                        )}
                    </div>
                    <button className="btn btn-primary flex items-center gap-sm"
                            onClick={() => handleOpenModal('create')}
                            style={{borderRadius: '8px', padding: '0 16px', fontWeight: 600}}>
                        <Plus size={18}/>
                        <span>Thêm tàu</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-md flex items-center gap-sm" style={{
                    backgroundColor: 'var(--error-bg)',
                    color: 'var(--error-color)',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #fecaca'
                }}>
                    <AlertCircle size={18}/>
                    <span>{error}</span>
                </div>
            )}

            {/* Data Table Container */}
            <div className="table-container flex-1 flex flex-col">
                <div style={{flex: 1, overflowY: 'auto'}}>
                    <table className="table">
                        <thead>
                        <tr>
                            <th style={{width: '60px', textAlign: 'center'}}>STT</th>
                            <th style={{minWidth: '200px'}}>Tên tàu / Biển số</th>
                            <th style={{minWidth: '150px'}}>Serial Thiết bị</th>
                            <th style={{minWidth: '180px'}}>Chủ tàu</th>

                            <th style={{width: '130px', textAlign: 'center'}}>Thao tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="text-center text-muted" style={{padding: '3.5rem'}}>
                                    <div className="flex flex-col items-center justify-center gap-sm">
                                        <div style={{
                                            width: '28px',
                                            height: '28px',
                                            border: '3px solid #e2e8f0',
                                            borderTopColor: 'var(--primary-color)',
                                            borderRadius: '50%',
                                            animation: 'spin 0.8s linear infinite'
                                        }}/>
                                        <span>Đang tải danh sách tàu...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : ships.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center text-muted" style={{padding: '3.5rem'}}>
                                    {search ? 'Không tìm thấy kết quả phù hợp với từ khóa.' : 'Chưa có dữ liệu tàu nào.'}
                                </td>
                            </tr>
                        ) : (
                            ships.map((ship, index) => {
                                const ownerVal = ship.ownerName || (ship as Ship & {
                                    shipOwner?: { fullName?: string },
                                    ShipOwner?: { fullName?: string }
                                }).shipOwner?.fullName || (ship.idshipOwner ? ownersList.find(o => o.id === ship.idshipOwner)?.fullName : undefined);
                                return (
                                    <tr key={ship.id}>
                                        <td className="text-center"
                                            style={{color: '#64748b', fontSize: '13px', fontWeight: 500}}>
                                            {(page - 1) * 10 + index + 1}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-sm">
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '8px',
                                                    backgroundColor: '#eff6ff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#2563eb',
                                                    flexShrink: 0
                                                }}>
                                                    <ShipIcon size={16}/>
                                                </div>
                                                <div>
                                                        <span className="font-semibold"
                                                              style={{color: '#0f172a', fontSize: '14.5px'}}>
                                                            {ship.name || 'Chưa có tên'}
                                                        </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {ship.serial ? (
                                                <span className="material-chip chip-blue" style={{fontWeight: 600}}>
                                                        {ship.serial}
                                                    </span>
                                            ) : (
                                                <span className="text-muted"
                                                      style={{fontStyle: 'italic', fontSize: '13px'}}>
                                                        Chưa có
                                                    </span>
                                            )}
                                        </td>
                                        <td>
                                            {ownerVal ? (
                                                <span style={{fontSize: '13.5px', color: '#0f172a', fontWeight: 500}}>
                                                        {ownerVal}
                                                    </span>
                                            ) : (
                                                <span className="text-muted"
                                                      style={{fontStyle: 'italic', fontSize: '13px'}}>
                                                        -
                                                    </span>
                                            )}
                                        </td>

                                        <td>
                                            <div className="flex items-center justify-center gap-xs">
                                                <button
                                                    className="btn btn-text"
                                                    title="Xem chi tiết"
                                                    style={{
                                                        color: '#0284c7',
                                                        width: '34px',
                                                        height: '34px',
                                                        padding: 0,
                                                        borderRadius: '8px'
                                                    }}
                                                    onClick={() => handleOpenModal('view', ship)}
                                                >
                                                    <Eye size={17}/>
                                                </button>
                                                <button
                                                    className="btn btn-text"
                                                    title="Chỉnh sửa"
                                                    style={{
                                                        color: '#d97706',
                                                        width: '34px',
                                                        height: '34px',
                                                        padding: 0,
                                                        borderRadius: '8px'
                                                    }}
                                                    onClick={() => handleOpenModal('edit', ship)}
                                                >
                                                    <Pencil size={17}/>
                                                </button>
                                                <button
                                                    className="btn btn-text"
                                                    title="Xóa tàu"
                                                    style={{
                                                        color: '#dc2626',
                                                        width: '34px',
                                                        height: '34px',
                                                        padding: 0,
                                                        borderRadius: '8px'
                                                    }}
                                                    onClick={() => handleDelete(ship)}
                                                >
                                                    <Trash2 size={17}/>
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
                <div className="flex items-center justify-between" style={{
                    padding: '12px 20px',
                    borderTop: '1px solid var(--border-color)',
                    backgroundColor: '#ffffff'
                }}>
                    <div className="text-sm" style={{color: '#64748b'}}>
                        Hiển
                        thị <strong>{ships.length > 0 ? (page - 1) * 10 + 1 : 0}</strong> - <strong>{Math.min(page * 10, totalCount)}</strong> trong
                        tổng số <strong>{totalCount}</strong> tàu
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-sm">
                            <button
                                className="btn btn-outline"
                                style={{padding: '0 10px', height: '32px', fontSize: '13px', borderRadius: '6px'}}
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                <ChevronLeft size={16}/> Trước
                            </button>
                            <span style={{fontSize: '13px', fontWeight: 600, color: '#334155', padding: '0 8px'}}>
                                Trang {page} / {totalPages}
                            </span>
                            <button
                                className="btn btn-outline"
                                style={{padding: '0 10px', height: '32px', fontSize: '13px', borderRadius: '6px'}}
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Sau <ChevronRight size={16}/>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <ShipModal
                isOpen={isModalOpen}
                mode={modalMode}
                ship={selectedShip}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
            />

            <ConfirmModal
                isOpen={!!shipToDelete}
                title="Xác nhận xóa tàu"
                message={
                    <span>
                        Bạn có chắc chắn muốn xóa tàu <strong>{shipToDelete?.name || shipToDelete?.serial}</strong> không? Hành động này sẽ xóa dữ liệu tàu khỏi hệ thống và không thể hoàn tác.
                    </span>
                }
                confirmText="Xóa tàu"
                isLoading={isDeleting}
                onConfirm={confirmDeleteShip}
                onCancel={() => setShipToDelete(null)}
            />
        </div>
    );
}
