import React, {useEffect, useState} from 'react';
import {X, Save} from 'lucide-react';
import type {ShipOwner, ShipOwnerPayload} from '../../types/ShipOwner';
import type {ServiceResponse} from '../../types/api';
import {shipOwnerDetailAPI} from '../../features/API/shipOwner/ShipOwner.ts';
import {
    getOwnerBirthDate,
    parseDDMMYYYYToISO,
    saveOwnerBirthDate
} from '../../utils/dateUtils.ts';

import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { vi } from 'date-fns/locale/vi';
registerLocale('vi', vi);

type ModalMode = 'view' | 'create' | 'edit';

interface OwnerModalProps {
    isOpen: boolean;
    mode: ModalMode;
    owner?: ShipOwner | null;
    onClose: () => void;
    onSubmit: (payload: ShipOwnerPayload) => Promise<void>;
}

const parseToDate = (ddMMyyyy: string | undefined | null) => {
    if (!ddMMyyyy) return null;
    const parts = ddMMyyyy.split('/');
    if (parts.length === 3) {
       return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
    return null;
}

export default function OwnerModal({isOpen, mode, owner, onClose, onSubmit}: OwnerModalProps) {
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
            setTimeout(() => setIsFetchingDetail(true), 0);
            shipOwnerDetailAPI(owner.id)
                .then(fullOwner => {
                    const dob = getOwnerBirthDate(owner.id, fullOwner.citizenId || owner.citizenId, fullOwner.birthDate);
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
            setTimeout(() => setFormData({fullName: "", citizenId: "", phone: "", email: "", address: "", birthDate: ""}), 0);
        }

        // Reset errors when modal opens
        setTimeout(() => setMainError(null), 0);
        setTimeout(() => setFieldErrors({}), 0);
    }, [isOpen, owner, mode]);

    if (!isOpen) return null;

    const isReadOnly = mode === 'view';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isReadOnly) return;

        setTimeout(() => setMainError(null), 0);
        setTimeout(() => setFieldErrors({}), 0);
        setIsLoading(true);

        try {
            // Lưu Ngày sinh, số điện thoại, địa chỉ vào cache
            saveOwnerBirthDate(owner?.id, formData.citizenId, formData.birthDate);

            // Chuẩn hóa dữ liệu trước khi gửi (VD: chuỗi rỗng thì chuyển thành undefined để Backend không bị lỗi parse Date)
            const payload = {...formData};
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
                        <X size={20}/>
                    </button>
                </div>

                {mainError && (
                    <div style={{
                        backgroundColor: 'var(--error-bg)',
                        color: 'var(--error-color)',
                        padding: 'var(--space-sm) var(--space-md)',
                        fontSize: '14px',
                        borderBottom: '1px solid #fecaca'
                    }}>
                        {mainError}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    <div className="modal-body flex flex-col gap-md" style={{ position: 'relative', flex: 1, overflowY: 'auto', padding: '16px' }}>
                        {isFetchingDetail && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundColor: 'rgba(255,255,255,0.7)',
                                zIndex: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <span className="text-muted">Đang tải dữ liệu...</span>
                            </div>
                        )}
                        <div>
                            <label className="form-label"
                                   style={{display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500}}>Họ
                                và tên (<span style={{ color: 'var(--error-color)', fontWeight: 'bold' }}>*</span>)</label>
                            <input
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className={`input ${getError('fullName') ? 'border-red-500' : ''}`}
                                required
                                readOnly={isReadOnly}
                                style={{
                                    backgroundColor: isReadOnly ? '#f1f5f9' : 'white',
                                    borderColor: getError('fullName') ? 'var(--error-color)' : undefined
                                }}
                            />
                            {getError('fullName') && <span style={{
                                color: 'var(--error-color)',
                                fontSize: '12px',
                                marginTop: '4px',
                                display: 'block'
                            }}>{getError('fullName')}</span>}
                        </div>
                        <div>
                            <label className="form-label"
                                   style={{display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500}}>CCCD
                                / CMND (<span style={{ color: 'var(--error-color)', fontWeight: 'bold' }}>*</span>)</label>
                            <input
                                name="citizenId"
                                value={formData.citizenId}
                                onChange={handleChange}
                                className="input"
                                required
                                readOnly={isReadOnly}
                                style={{
                                    backgroundColor: isReadOnly ? '#f1f5f9' : 'white',
                                    borderColor: getError('citizenId') ? 'var(--error-color)' : undefined
                                }}
                            />
                            {getError('citizenId') && <span style={{
                                color: 'var(--error-color)',
                                fontSize: '12px',
                                marginTop: '4px',
                                display: 'block'
                            }}>{getError('citizenId')}</span>}
                        </div>
                        <div className="flex gap-sm">
                            <div className="flex-1">
                                <label className="form-label" style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    marginBottom: '4px',
                                    fontWeight: 500
                                }}>Số điện thoại</label>
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="input"
                                    readOnly={isReadOnly}
                                    style={{
                                        backgroundColor: isReadOnly ? '#f1f5f9' : 'white',
                                        borderColor: getError('phone') ? 'var(--error-color)' : undefined
                                    }}
                                />
                                {getError('phone') && <span style={{
                                    color: 'var(--error-color)',
                                    fontSize: '12px',
                                    marginTop: '4px',
                                    display: 'block'
                                }}>{getError('phone')}</span>}
                            </div>
                            <div className="flex-1">
                                <label className="form-label" style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    marginBottom: '4px',
                                    fontWeight: 500
                                }}>Ngày sinh</label>
                                <DatePicker
                                    selected={parseToDate(formData.birthDate)}
                                    onChange={(date: Date | null) => {
                                        if (!date) {
                                            setFormData({ ...formData, birthDate: '' });
                                        } else {
                                            const day = String(date.getDate()).padStart(2, '0');
                                            const month = String(date.getMonth() + 1).padStart(2, '0');
                                            const year = date.getFullYear();
                                            setFormData({ ...formData, birthDate: `${day}/${month}/${year}` });
                                        }
                                    }}
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText="dd/MM/yyyy"
                                    locale="vi"
                                    showMonthDropdown
                                    showYearDropdown
                                    dropdownMode="select"
                                    portalId="root"
                                    disabled={isReadOnly}
                                    wrapperClassName="date-picker-wrapper"
                                    customInput={
                                        <input className="input" style={{ 
                                            width: '100%',
                                            backgroundColor: isReadOnly ? '#f1f5f9' : 'white',
                                            borderColor: getError('birthDate') ? 'var(--error-color)' : undefined
                                        }} />
                                    }
                                />
                                {getError('birthDate') && <span style={{
                                    color: 'var(--error-color)',
                                    fontSize: '12px',
                                    marginTop: '4px',
                                    display: 'block'
                                }}>{getError('birthDate')}</span>}
                            </div>
                        </div>

                        <div>
                            <label className="form-label"
                                   style={{display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500}}>Địa
                                chỉ</label>
                            <input
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="input"
                                readOnly={isReadOnly}
                                style={{
                                    backgroundColor: isReadOnly ? '#f1f5f9' : 'white',
                                    borderColor: getError('address') ? 'var(--error-color)' : undefined
                                }}
                            />
                            {getError('address') && <span style={{
                                color: 'var(--error-color)',
                                fontSize: '12px',
                                marginTop: '4px',
                                display: 'block'
                            }}>{getError('address')}</span>}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline flex items-center gap-xs" onClick={onClose}>
                            <X size={18} /> Đóng
                        </button>
                        {!isReadOnly && (
                            <button type="submit" className="btn btn-primary flex items-center gap-xs" disabled={isLoading}>
                                <Save size={18} /> {isLoading ? 'Đang lưu...' : 'Lưu thông tin'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
