import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Ship, ShipPayload } from '../../types/Ship';
import type { ServiceResponse } from '../../types/api';
import { shipDetailAPI } from '../../features/API/ship/Ship.ts';

type ModalMode = 'view' | 'create' | 'edit';

interface ShipModalProps {
    isOpen: boolean;
    mode: ModalMode;
    ship?: Ship | null;
    onClose: () => void;
    onSubmit: (payload: any) => Promise<void>;
}

export default function ShipModal({ isOpen, mode, ship, onClose, onSubmit }: ShipModalProps) {
    const [formData, setFormData] = useState<Partial<ShipPayload>>({
        name: '',
        serial: ''
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);
    const [mainError, setMainError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        if (isOpen && ship && mode !== 'create') {
            setIsFetchingDetail(true);
            shipDetailAPI(ship.id)
                .then(fullShip => {
                    setFormData(fullShip as Partial<ShipPayload>);
                })
                .catch(() => {
                    setMainError('Không thể lấy thông tin chi tiết tàu.');
                })
                .finally(() => {
                    setIsFetchingDetail(false);
                });
        } else if (isOpen && mode === 'create') {
            setFormData({ name: '', serial: '' });
        }
        
        setMainError(null);
        setFieldErrors({});
    }, [isOpen, ship, mode]);

    if (!isOpen) return null;

    const isReadOnly = mode === 'view';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === 'number' ? Number(value) : value 
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;
        
        setMainError(null);
        setFieldErrors({});
        setIsLoading(true);
        
        try {
            const payload = { ...formData };
            await onSubmit(payload);
            onClose();
        } catch (error) {
            const errorResponse = error as ServiceResponse;
            if (errorResponse.status === 400 && errorResponse.errors) {
                setFieldErrors(errorResponse.errors);
            } else {
                setMainError(errorResponse.message || 'Có lỗi xảy ra khi lưu thông tin.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const titleMap = {
        'create': 'Thêm tàu mới',
        'edit': 'Chỉnh sửa thông tin tàu',
        'view': 'Thông tin tàu'
    };

    const getError = (field: string) => {
        const csField = field.charAt(0).toUpperCase() + field.slice(1);
        const errArray = fieldErrors[field] || fieldErrors[csField];
        return errArray ? errArray[0] : null;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{titleMap[mode]}</h3>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                
                {mainError && (
                    <div style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-color)', padding: 'var(--space-sm) var(--space-md)', fontSize: '14px', borderBottom: '1px solid #fecaca' }}>
                        {mainError}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="modal-body flex flex-col gap-md" style={{ position: 'relative' }}>
                        {isFetchingDetail && (
                            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="text-muted">Đang tải dữ liệu...</span>
                            </div>
                        )}
                        <div>
                            <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Tên tàu (*)</label>
                            <input 
                                name="name"
                                value={formData.name || ''} 
                                onChange={handleChange}
                                className={`input ${getError('name') ? 'border-red-500' : ''}`}
                                required
                                readOnly={isReadOnly}
                                style={{ backgroundColor: isReadOnly ? '#f1f5f9' : 'white', borderColor: getError('name') ? 'var(--error-color)' : undefined }}
                            />
                            {getError('name') && <span style={{ color: 'var(--error-color)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{getError('name')}</span>}
                        </div>
                        <div>
                            <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Số hiệu / Serial</label>
                            <input 
                                name="serial"
                                value={formData.serial || ''} 
                                onChange={handleChange}
                                className="input" 
                                readOnly={isReadOnly}
                                style={{ backgroundColor: isReadOnly ? '#f1f5f9' : 'white', borderColor: getError('serial') ? 'var(--error-color)' : undefined }}
                            />
                            {getError('serial') && <span style={{ color: 'var(--error-color)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{getError('serial')}</span>}
                        </div>
                    </div>
                    
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose}>
                            Đóng
                        </button>
                        {!isReadOnly && (
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                {isLoading ? 'Đang lưu...' : 'Lưu thông tin'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
