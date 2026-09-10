import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { ShipOwner, ShipOwnerPayload } from '../../types/ShipOwner';
import type { ServiceResponse } from '../../types/api';
import { shipOwnerDetailAPI } from '../../features/API/shipOwner/ShipOwner.ts';
import { parseDDMMYYYYToISO, handleDateChange, normalizeDateOnBlur, saveOwnerBirthDate, getOwnerBirthDate } from '../../utils/dateUtils.ts';

type ModalMode = 'view' | 'create' | 'edit';

interface OwnerModalProps {
    isOpen: boolean;
    mode: ModalMode;
    owner?: ShipOwner | null;
    onClose: () => void;
    onSubmit: (payload: ShipOwnerPayload) => Promise<void>;
}

export default function OwnerModal({ isOpen, mode, owner, onClose, onSubmit }: OwnerModalProps) {
    const [formData, setFormData] = useState<Partial<ShipOwnerPayload>>({
        fullName: '',
        citizenId: '',
        phone: '',
        email: '',
        address: '',
        birthDate: ''
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);
    const [mainError, setMainError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        if (isOpen && owner && mode !== 'create') {
            setIsFetchingDetail(true);
            shipOwnerDetailAPI(owner.id)
                .then(fullOwner => {
                    const dob = getOwnerBirthDate(owner.id, fullOwner.citizenId || owner.citizenId, fullOwner.birthDate);
                    if (fullOwner.phone) localStorage.setItem(`owner_phone_${owner.id}`, fullOwner.phone);
                    if (fullOwner.address) localStorage.setItem(`owner_address_${owner.id}`, fullOwner.address);
                    setFormData({
                        fullName: fullOwner.fullName || '',
                        citizenId: fullOwner.citizenId || '',
                        phone: fullOwner.phone || '',
                        email: fullOwner.email || '',
                        address: fullOwner.address || '',
                        birthDate: dob
                    });
                })
                .catch(() => {
                    setMainError('Không thể lấy thông tin chi tiết chủ tàu.');
                })
                .finally(() => {
                    setIsFetchingDetail(false);
                });
        } else if (isOpen && mode === 'create') {
            setFormData({ fullName: '', citizenId: '', phone: '', email: '', address: '', birthDate: '' });
        }
        
        // Reset errors when modal opens
        setMainError(null);
        setFieldErrors({});
    }, [isOpen, owner, mode]);

    if (!isOpen) return null;

    const isReadOnly = mode === 'view';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;
        
        setMainError(null);
        setFieldErrors({});
        setIsLoading(true);
        
        try {
            // Lưu Ngày sinh, số điện thoại, địa chỉ vào cache
            saveOwnerBirthDate(owner?.id, formData.citizenId, formData.birthDate);
            if (owner?.id) {
                if (formData.phone) localStorage.setItem(`owner_phone_${owner.id}`, formData.phone);
                if (formData.address) localStorage.setItem(`owner_address_${owner.id}`, formData.address);
            }

            // Chuẩn hóa dữ liệu trước khi gửi (VD: chuỗi rỗng thì chuyển thành undefined để Backend không bị lỗi parse Date)
            const payload = { ...formData };
            if (payload.birthDate) {
                payload.birthDate = parseDDMMYYYYToISO(payload.birthDate);
            } else {
                payload.birthDate = undefined;
            }
            if (!payload.phone) payload.phone = undefined;
            if (!payload.email) payload.email = undefined;
            if (!payload.address) payload.address = undefined;
            
            await onSubmit(payload as ShipOwnerPayload);
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
        'create': 'Thêm chủ tàu mới',
        'edit': 'Chỉnh sửa chủ tàu',
        'view': 'Thông tin chủ tàu'
    };

    // Helper: Lấy lỗi của trường, hỗ trợ C# (viết hoa chữ cái đầu)
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
                            <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Họ và tên (*)</label>
                            <input 
                                name="fullName"
                                value={formData.fullName} 
                                onChange={handleChange}
                                className={`input ${getError('fullName') ? 'border-red-500' : ''}`}
                                required
                                readOnly={isReadOnly}
                                style={{ backgroundColor: isReadOnly ? '#f1f5f9' : 'white', borderColor: getError('fullName') ? 'var(--error-color)' : undefined }}
                            />
                            {getError('fullName') && <span style={{ color: 'var(--error-color)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{getError('fullName')}</span>}
                        </div>
                        <div>
                            <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>CCCD / CMND (*)</label>
                            <input 
                                name="citizenId"
                                value={formData.citizenId} 
                                onChange={handleChange}
                                className="input" 
                                required
                                readOnly={isReadOnly}
                                style={{ backgroundColor: isReadOnly ? '#f1f5f9' : 'white', borderColor: getError('citizenId') ? 'var(--error-color)' : undefined }}
                            />
                            {getError('citizenId') && <span style={{ color: 'var(--error-color)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{getError('citizenId')}</span>}
                        </div>
                        <div className="flex gap-sm">
                            <div className="flex-1">
                                <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Số điện thoại</label>
                                <input 
                                    name="phone"
                                    value={formData.phone} 
                                    onChange={handleChange}
                                    className="input"
                                    readOnly={isReadOnly}
                                    style={{ backgroundColor: isReadOnly ? '#f1f5f9' : 'white', borderColor: getError('phone') ? 'var(--error-color)' : undefined }}
                                />
                                {getError('phone') && <span style={{ color: 'var(--error-color)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{getError('phone')}</span>}
                            </div>
                            <div className="flex-1">
                                <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Ngày sinh</label>
                                <input 
                                    type="text"
                                    name="birthDate"
                                    placeholder="dd/MM/yyyy"
                                    maxLength={10}
                                    value={formData.birthDate || ''} 
                                    onChange={(e) => {
                                        const next = handleDateChange(e.target.value, formData.birthDate || '');
                                        setFormData({ ...formData, birthDate: next });
                                    }}
                                    onBlur={(e) => {
                                        const normalized = normalizeDateOnBlur(e.target.value);
                                        setFormData({ ...formData, birthDate: normalized });
                                    }}
                                    className="input"
                                    readOnly={isReadOnly}
                                    style={{ backgroundColor: isReadOnly ? '#f1f5f9' : 'white', borderColor: getError('birthDate') ? 'var(--error-color)' : undefined }}
                                />
                                {getError('birthDate') && <span style={{ color: 'var(--error-color)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{getError('birthDate')}</span>}
                            </div>
                        </div>

                        <div>
                            <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Địa chỉ</label>
                            <input 
                                name="address"
                                value={formData.address} 
                                onChange={handleChange}
                                className="input" 
                                readOnly={isReadOnly}
                                style={{ backgroundColor: isReadOnly ? '#f1f5f9' : 'white', borderColor: getError('address') ? 'var(--error-color)' : undefined }}
                            />
                            {getError('address') && <span style={{ color: 'var(--error-color)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{getError('address')}</span>}
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
