import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X, AlertCircle, Save, MapPin } from 'lucide-react';
import Select from 'react-select';
import { createUserAPI, updateUserAPI, getUserByIdAPI } from '../../features/API/user/UserAPI';
import type { UserDto } from '../../features/API/user/UserAPI';
import { LocationsAPI } from '../../features/API/catalog/Catalog';
import type { Locations } from '../../types/Catalog';
import { useToast } from '../../components/ToastContext';

interface Props {
    isOpen: boolean;
    user: UserDto | null;
    onClose: () => void;
    onSuccess: () => void;
}

interface UserFormData {
    userName: string;
    fullName: string;
    password: string;
    role: string;
    locations: string[];
}

export default function UserModal({ isOpen, user, onClose, onSuccess }: Props) {
    const [formData, setFormData] = useState<UserFormData>({
        userName: '',
        fullName: '',
        password: '',
        role: 'AGENCY',
        locations: []
    });
    const [locationsList, setLocationsList] = useState<Locations[]>([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [mainError, setMainError] = useState<string | null>(null);
    const { success } = useToast();

    // Hàm chuẩn hóa danh sách mã tỉnh từ dữ liệu trả về của backend
    const extractLocationCodes = (rawLocations: any): string[] => {
        if (!rawLocations) return [];
        if (Array.isArray(rawLocations)) {
            return rawLocations.map(item => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object' && item !== null) {
                    return item.code || item.locationCode || item.location?.code || item.id || '';
                }
                return String(item);
            }).filter(Boolean);
        }
        return [];
    };

    // Tải danh mục tỉnh/thành phố khi mở modal
    useEffect(() => {
        if (isOpen) {
            setIsLoadingLocations(true);
            LocationsAPI()
                .then(res => {
                    const list = Array.isArray(res) ? res : (res as any)?.data || res;
                    if (Array.isArray(list)) {
                        setLocationsList(list);
                    }
                })
                .catch(err => {
                    console.error('Không thể tải danh mục tỉnh/thành phố:', err);
                })
                .finally(() => {
                    setIsLoadingLocations(false);
                });
        }
    }, [isOpen]);

    // Thiết lập dữ liệu form khi thay đổi user hoặc mở modal
    useEffect(() => {
        if (!isOpen) return;

        if (user) {
            const rawLocs = user.locations || user.Locations || (user as any).locationCodes || (user as any).provinces || [];
            const initialLocations = extractLocationCodes(rawLocs);

            setFormData({
                userName: user.userName || user.UserName || '',
                fullName: user.fullName || user.FullName || '',
                password: '',
                role: user.role || user.Role || 'AGENCY',
                locations: initialLocations
            });

            // Nếu user có id, thử lấy chi tiết để cập nhật danh sách locations mới nhất nếu có
            const userId = user.id || user.Id;
            if (userId) {
                getUserByIdAPI(userId)
                    .then(detail => {
                        if (detail) {
                            const detailLocs = detail.locations || detail.Locations || (detail as any).locationCodes || (detail as any).provinces;
                            const parsed = extractLocationCodes(detailLocs);
                            setFormData(prev => ({
                                ...prev,
                                fullName: detail.fullName || detail.FullName || prev.fullName,
                                userName: detail.userName || detail.UserName || prev.userName,
                                role: detail.role || detail.Role || prev.role,
                                locations: parsed.length > 0 ? parsed : prev.locations
                            }));
                        }
                    })
                    .catch(() => {
                        // Bỏ qua nếu backend không có endpoint GET chi tiết theo id
                    });
            }
        } else {
            setFormData({
                userName: '',
                fullName: '',
                password: '',
                role: 'AGENCY',
                locations: []
            });
        }
        setMainError(null);
    }, [user, isOpen]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        // 1. Kiểm tra họ tên và tên đăng nhập
        if (!formData.userName.trim() || !formData.fullName.trim()) {
            setMainError('Vui lòng nhập đầy đủ thông tin bắt buộc (Họ và tên, Tên đăng nhập)');
            return;
        }

        // 2. Kiểm tra mật khẩu cho người dùng mới
        if (!user && !formData.password) {
            setMainError('Vui lòng nhập mật khẩu cho người dùng mới');
            return;
        }

        // 3. Nếu quyền là LOCATION thì bắt buộc phải chọn ít nhất 1 tỉnh
        if (formData.role === 'LOCATION') {
            if (!formData.locations || formData.locations.length === 0) {
                setMainError('Quyền LOCATION yêu cầu chọn ít nhất 1 tỉnh/thành phố');
                return;
            }
        }

        // Tạo payload gửi lên backend
        const payload: Record<string, any> = {
            userName: formData.userName.trim(),
            fullName: formData.fullName.trim(),
            role: formData.role
        };

        if (formData.password) {
            payload.password = formData.password;
        } else if (user) {
            payload.password = null;
        }

        // Chỉ truyền trường locations khi quyền là LOCATION
        if (formData.role === 'LOCATION') {
            payload.locations = formData.locations;
        }

        try {
            setMainError(null);
            setIsSaving(true);
            if (user) {
                await updateUserAPI(user.id, payload);
                success('Cập nhật người dùng thành công!');
            } else {
                await createUserAPI(payload);
                success('Thêm người dùng mới thành công!');
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setMainError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi lưu người dùng');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                className="modal-content" 
                onClick={e => e.stopPropagation()} 
                style={{ 
                    width: '520px', 
                    maxWidth: '95vw',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header */}
                <div className="modal-header">
                    <h3 className="modal-title">{user ? 'Chỉnh sửa Người Dùng' : 'Thêm Người Dùng Mới'}</h3>
                    <button type="button" className="modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Error Banner */}
                {mainError && (
                    <div className="flex items-start gap-sm" style={{
                        backgroundColor: '#fef2f2',
                        color: '#b91c1c',
                        padding: '12px 16px',
                        fontSize: '14px',
                        borderBottom: '1px solid #fecaca'
                    }}>
                        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                        <div>{mainError}</div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    <div className="modal-body flex flex-col gap-md" style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 140px)', padding: '20px' }}>
                        <div>
                            <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '6px', fontWeight: 500, color: '#334155' }}>
                                Họ và tên (<span style={{ color: 'var(--error-color)', fontWeight: 'bold' }}>*</span>)
                            </label>
                            <input 
                                type="text" 
                                className="input w-full"
                                value={formData.fullName}
                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="Ví dụ: Nguyễn Văn A"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '6px', fontWeight: 500, color: '#334155' }}>
                                Tên đăng nhập (<span style={{ color: 'var(--error-color)', fontWeight: 'bold' }}>*</span>)
                            </label>
                            <input 
                                type="text" 
                                className="input w-full"
                                value={formData.userName}
                                onChange={e => setFormData({ ...formData, userName: e.target.value })}
                                placeholder="Ví dụ: nguyenvana_123"
                                required
                            />
                        </div>

                        <div>
                            <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '6px', fontWeight: 500, color: '#334155' }}>
                                Mật khẩu {user ? <span style={{ color: '#64748b', fontWeight: 'normal' }}>(Bỏ trống nếu không đổi)</span> : <span style={{ color: 'var(--error-color)', fontWeight: 'bold' }}>*</span>}
                            </label>
                            <input 
                                type="password" 
                                className="input w-full"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder={user ? "Nhập mật khẩu mới (nếu muốn đổi)..." : "Nhập mật khẩu cho tài khoản..."}
                                required={!user}
                            />
                        </div>

                        <div>
                            <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '6px', fontWeight: 500, color: '#334155' }}>
                                Quyền hạn (Role) (<span style={{ color: 'var(--error-color)', fontWeight: 'bold' }}>*</span>)
                            </label>
                            <select 
                                className="input w-full"
                                value={formData.role}
                                onChange={e => {
                                    const newRole = e.target.value;
                                    setFormData({ ...formData, role: newRole });
                                    if (newRole !== 'LOCATION' && mainError?.includes('tỉnh')) {
                                        setMainError(null);
                                    }
                                }}
                                required
                                style={{ appearance: 'auto' }}
                            >
                                <option value="AGENCY">Đại lý (AGENCY)</option>
                                <option value="LOCATION">Chi cục / Địa phương (LOCATION)</option>
                                <option value="ADMIN">Quản trị viên (ADMIN)</option>
                                {!['AGENCY', 'LOCATION', 'ADMIN'].includes(formData.role) && (
                                    <option value={formData.role}>{formData.role}</option>
                                )}
                            </select>
                        </div>

                        {/* Nếu chọn quyền LOCATION: hiển thị trường chọn danh sách mã tỉnh (locations) */}
                        {formData.role === 'LOCATION' && (
                            <div style={{
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '12px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label className="form-label" style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MapPin size={16} color="#4f46e5" />
                                        <span>Tỉnh / Thành phố quản lý (locations) (<span style={{ color: 'var(--error-color)', fontWeight: 'bold' }}>*</span>)</span>
                                    </label>
                                    {locationsList.length > 0 && (
                                        <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const allCodes = locationsList.map(l => l.code).filter(Boolean);
                                                    setFormData(prev => ({ ...prev, locations: allCodes }));
                                                    if (mainError?.includes('tỉnh')) setMainError(null);
                                                }}
                                                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                                            >
                                                Chọn tất cả
                                            </button>
                                            <span style={{ color: '#cbd5e1' }}>|</span>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, locations: [] }))}
                                                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                                            >
                                                Bỏ chọn
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <Select
                                    isMulti
                                    isLoading={isLoadingLocations}
                                    placeholder={isLoadingLocations ? "Đang tải danh mục tỉnh/thành..." : "-- Chọn một hoặc nhiều tỉnh/thành phố --"}
                                    value={locationsList
                                        .filter(l => formData.locations.includes(l.code))
                                        .map(l => ({ value: l.code, label: `${l.name} (${l.code})` }))}
                                    options={locationsList.map(l => ({
                                        value: l.code,
                                        label: `${l.name} (${l.code})`
                                    }))}
                                    onChange={(selectedOptions) => {
                                        const codes = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
                                        setFormData(prev => ({ ...prev, locations: codes }));
                                        if (codes.length > 0 && mainError?.includes('tỉnh')) {
                                            setMainError(null);
                                        }
                                    }}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            minHeight: '42px',
                                            borderRadius: '8px',
                                            borderColor: (formData.role === 'LOCATION' && formData.locations.length === 0 && mainError) 
                                                ? 'var(--error-color)' 
                                                : '#cbd5e1',
                                            boxShadow: 'none',
                                            '&:hover': { borderColor: '#94a3b8' }
                                        }),
                                        menu: (base) => ({ ...base, zIndex: 9999 }),
                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        multiValue: (base) => ({
                                            ...base,
                                            backgroundColor: '#e0e7ff',
                                            borderRadius: '4px'
                                        }),
                                        multiValueLabel: (base) => ({
                                            ...base,
                                            color: '#3730a3',
                                            fontSize: '12px',
                                            fontWeight: 600
                                        }),
                                        multiValueRemove: (base) => ({
                                            ...base,
                                            color: '#4f46e5',
                                            ':hover': {
                                                backgroundColor: '#c7d2fe',
                                                color: '#312e81'
                                            }
                                        })
                                    }}
                                    noOptionsMessage={() => "Không tìm thấy tỉnh/thành phố nào"}
                                />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                                    <span style={{ color: '#64748b' }}>
                                        Đã chọn: <strong style={{ color: formData.locations.length > 0 ? '#4f46e5' : '#ef4444' }}>{formData.locations.length}</strong> tỉnh/thành phố
                                    </span>
                                    {formData.locations.length === 0 && (
                                        <span style={{ color: '#ef4444', fontStyle: 'italic' }}>
                                            Bắt buộc chọn ít nhất 1 tỉnh
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '16px 20px' }}>
                        <button type="button" className="btn btn-outline" onClick={onClose} style={{ padding: '8px 16px' }}>
                            Đóng
                        </button>
                        <button type="submit" className="btn btn-primary flex items-center gap-xs" disabled={isSaving} style={{ padding: '8px 16px' }}>
                            <Save size={18} /> {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
