import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../components/ToastContext';
import type { Ship, ShipResponse } from '../../types/Ship';
import type { CrewRoles, Occupations } from '../../types/Catalog';
import type { ShipOwner } from '../../types/ShipOwner';
import type { ServiceResponse } from '../../types/api';
import { shipDetailAPI } from '../../features/API/ship/Ship.ts';
import { crewRolesAPI, occupationsAPI } from '../../features/API/catalog/Catalog.ts';
import { listShipOwnerAPI } from '../../features/API/shipOwner/ShipOwner.ts';

type ModalMode = 'view' | 'create' | 'edit';

interface ShipModalProps {
    isOpen: boolean;
    mode: ModalMode;
    ship?: Ship | null;
    onClose: () => void;
    onSubmit: (payload: any) => Promise<void>;
}

export default function ShipModal({ isOpen, onClose, mode, ship, onSubmit }: ShipModalProps) {
    const { success, error: showError } = useToast();
    const [formData, setFormData] = useState<Partial<ShipResponse>>({
        name: '',
        serial: '',
        crews: []
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);
    const [mainError, setMainError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [crewRolesList, setCrewRolesList] = useState<CrewRoles[]>([]);
    const [occupationsList, setOccupationsList] = useState<Occupations[]>([]);
    const [owners, setOwners] = useState<ShipOwner[]>([]);

    useEffect(() => {
        if (isOpen) {
            crewRolesAPI().then(res => {
                const list = Array.isArray(res) ? res : (res as any).data || res;
                if (Array.isArray(list)) setCrewRolesList(list);
            }).catch(() => {});
            
            occupationsAPI().then(res => {
                const list = Array.isArray(res) ? res : (res as any).data || res;
                if (Array.isArray(list)) setOccupationsList(list);
            }).catch(() => {});

            // Fetch a sufficiently large list of ship owners to display in the dropdown
            listShipOwnerAPI('', 1, 100).then(res => {
                if (res.data) setOwners(res.data);
            }).catch(() => {});
        }

        if (isOpen && ship && mode !== 'create') {
            setIsFetchingDetail(true);
            shipDetailAPI(ship.id)
                .then((fullShip: any) => {
                    const mappedData: Partial<ShipResponse> = {
                        ...fullShip,
                        mainOccupationId: fullShip.mainOccupationId || fullShip.mainOccupation?.id || fullShip.MainOccupation?.id || '',
                        secondaryOccupationId1: fullShip.secondaryOccupationId1 || fullShip.secondaryOccupation1?.id || fullShip.SecondaryOccupation1?.id || '',
                        secondaryOccupationId2: fullShip.secondaryOccupationId2 || fullShip.secondaryOccupation2?.id || fullShip.SecondaryOccupation2?.id || '',
                        idshipOwner: fullShip.idshipOwner || fullShip.shipOwner?.id || fullShip.ShipOwner?.id || '',
                        crews: (fullShip.crews || fullShip.crew || []).map((c: any) => ({
                            ...c,
                            idcrewRole: c.idcrewRole || c.crewRole?.id || c.CrewRole?.id || ''
                        }))
                    };
                    setFormData(mappedData);
                })
                .catch(() => {
                    setMainError('Không thể lấy thông tin chi tiết tàu.');
                })
                .finally(() => {
                    setIsFetchingDetail(false);
                });
        } else if (isOpen && mode === 'create') {
            setFormData({ name: '', serial: '', crews: [] });
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

    const handleAddCrew = () => {
        if (isReadOnly) return;
        const newCrew = { fullName: '', citizenId: '', phone: '', email: '', idcrewRole: '' };
        setFormData(prev => ({ ...prev, crews: [...(prev.crews || []), newCrew] }));
    };

    const handleUpdateCrew = (index: number, field: string, value: any) => {
        if (isReadOnly) return;
        const updatedCrew = [...(formData.crews || [])];
        updatedCrew[index] = { ...updatedCrew[index], [field]: value };
        setFormData({ ...formData, crews: updatedCrew });
    };

    const handleRemoveCrew = (index: number) => {
        if (isReadOnly) return;
        const updatedCrew = (formData.crews || []).filter((_, i) => i !== index);
        setFormData({ ...formData, crews: updatedCrew });
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;
        
        setMainError(null);
        setFieldErrors({});
        
        // Custom validations có thể thêm ở đây
        
        setIsLoading(true);
        
        try {
            const payload = { ...formData };
            
            // Xóa các trường rỗng (empty string) để C# parse được thành Nullable<Guid> hoặc Nullable<DateTime>
            if (!payload.secondaryOccupationId1) delete payload.secondaryOccupationId1;
            if (!payload.secondaryOccupationId2) delete payload.secondaryOccupationId2;
            if (!payload.miningLicenseNumber) delete payload.miningLicenseNumber;
            if (!payload.expirationDateOfMiningLicenseNumber) delete payload.expirationDateOfMiningLicenseNumber;
            
            // Dọn dẹp cả bên trong danh sách thuyền viên
            if (payload.crews) {
                payload.crews = payload.crews.map((c: any) => {
                    const cleaned = { ...c };
                    if (!cleaned.idcrewRole) delete cleaned.idcrewRole;
                    return cleaned;
                });
            }

            await onSubmit(payload);
            success(mode === 'create' ? 'Thêm mới tàu thành công!' : 'Cập nhật tàu thành công!');
            onClose();
        } catch (error) {
            const errorResponse = error as ServiceResponse;
            if (errorResponse.status === 400 && errorResponse.errors) {
                setFieldErrors(errorResponse.errors);
                showError('Vui lòng kiểm tra lại các trường bị lỗi.');
            } else {
                const msg = errorResponse.message || 'Có lỗi xảy ra khi lưu thông tin.';
                setMainError(msg);
                showError(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const titleMap = {
        'create': 'Thêm tàu mới',
        'edit': 'Chỉnh sửa thông tin tàu',
        'view': 'Chi tiết hồ sơ tàu'
    };

    const getError = (field: string) => {
        const csField = field.charAt(0).toUpperCase() + field.slice(1);
        const errArray = fieldErrors[field] || fieldErrors[csField];
        return errArray ? errArray[0] : null;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '1100px', width: '90vw' }} onClick={e => e.stopPropagation()}>
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
                    <div className="modal-body flex flex-col gap-lg" style={{ position: 'relative', maxHeight: '70vh', overflowY: 'auto' }}>
                        {isFetchingDetail && (
                            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="text-muted">Đang tải dữ liệu...</span>
                            </div>
                        )}
                        
                        {/* 1. Thông tin chung */}
                        <div>
                            <h4 style={{ marginBottom: '12px', borderBottom: '2px solid var(--border-color)', paddingBottom: '4px', color: 'var(--primary-color)' }}>Thông tin cơ bản</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
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
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Số hiệu (Serial)</label>
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
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Chủ tàu</label>
                                    {isReadOnly ? (
                                        <input 
                                            value={owners.find(o => o.id === formData.idshipOwner)?.fullName || ''} 
                                            className="input" 
                                            readOnly
                                            style={{ backgroundColor: '#f1f5f9' }}
                                        />
                                    ) : (
                                        <select 
                                            className="input" 
                                            value={formData.idshipOwner || ''} 
                                            onChange={e => setFormData({ ...formData, idshipOwner: e.target.value })}
                                        >
                                            <option value="">-- Chọn chủ tàu --</option>
                                            {owners.map(owner => (
                                                <option key={owner.id} value={owner.id}>{owner.fullName} - {owner.citizenId}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>CMND/CCCD Chủ tàu</label>
                                    <input 
                                        value={owners.find(o => o.id === formData.idshipOwner)?.citizenId || ''} 
                                        className="input" 
                                        readOnly
                                        style={{ backgroundColor: '#f1f5f9' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Giấy phép */}
                        <div>
                            <h4 style={{ marginBottom: '12px', borderBottom: '2px solid var(--border-color)', paddingBottom: '4px', color: 'var(--primary-color)' }}>Giấy phép khai thác</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Số GPKT</label>
                                    <input 
                                        type="text" 
                                        name="miningLicenseNumber"
                                        value={formData.miningLicenseNumber || ''} 
                                        onChange={handleChange}
                                        className="input" 
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? { backgroundColor: '#f1f5f9' } : {}}
                                    />
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Ngày hết hạn GPKT</label>
                                    <input 
                                        type="date"
                                        name="expirationDateOfMiningLicenseNumber"
                                        value={formData.expirationDateOfMiningLicenseNumber?.substring(0, 10) || ''} 
                                        onChange={handleChange}
                                        className="input" 
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? { backgroundColor: '#f1f5f9' } : {}}
                                    />
                                </div>
                                {/* 2 cột trống để cân bằng grid */}
                                <div></div>
                                <div></div>
                            </div>
                        </div>

                        {/* 3. Thông số kỹ thuật */}
                        <div>
                            <h4 style={{ marginBottom: '12px', borderBottom: '2px solid var(--border-color)', paddingBottom: '4px', color: 'var(--primary-color)' }}>Thông số kỹ thuật</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Chiều dài lớn nhất (m)</label>
                                    <input 
                                        type="number" 
                                        name="lengthOverall"
                                        value={formData.lengthOverall || ''} 
                                        onChange={handleChange}
                                        className="input" 
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? { backgroundColor: '#f1f5f9' } : {}}
                                    />
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Tổng công suất (CV)</label>
                                    <input 
                                        type="number" 
                                        name="totalPower"
                                        value={formData.totalPower || ''} 
                                        onChange={handleChange}
                                        className="input" 
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? { backgroundColor: '#f1f5f9' } : {}}
                                    />
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Kích thước 1</label>
                                    <input 
                                        type="number" 
                                        name="dimension1"
                                        value={formData.dimension1 || ''} 
                                        onChange={handleChange}
                                        className="input" 
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? { backgroundColor: '#f1f5f9' } : {}}
                                    />
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Kích thước 2</label>
                                    <input 
                                        type="number" 
                                        name="dimension2"
                                        value={formData.dimension2 || ''} 
                                        onChange={handleChange}
                                        className="input" 
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? { backgroundColor: '#f1f5f9' } : {}}
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 4' }}>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Quy cách ngư cụ</label>
                                    <input 
                                        type="text" 
                                        name="fishingGearSpecifications"
                                        value={formData.fishingGearSpecifications || ''} 
                                        onChange={handleChange}
                                        className="input" 
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? { backgroundColor: '#f1f5f9' } : {}}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 4. Nghề nghiệp */}
                        <div>
                            <h4 style={{ marginBottom: '12px', borderBottom: '2px solid var(--border-color)', paddingBottom: '4px', color: 'var(--primary-color)' }}>Nghề nghiệp</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Nghề chính</label>
                                    {isReadOnly ? (
                                        <input 
                                            value={occupationsList.find(o => o.id === formData.mainOccupationId)?.name || ''} 
                                            className="input" 
                                            readOnly
                                            style={{ backgroundColor: '#f1f5f9' }}
                                        />
                                    ) : (
                                        <select
                                            className="input"
                                            value={formData.mainOccupationId || ''}
                                            onChange={e => setFormData({ ...formData, mainOccupationId: e.target.value })}
                                        >
                                            <option value="">-- Chọn nghề chính --</option>
                                            {occupationsList.map(occ => (
                                                <option key={occ.id} value={occ.id}>{occ.name || occ.code}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Nghề phụ 1</label>
                                    {isReadOnly ? (
                                        <input 
                                            value={occupationsList.find(o => o.id === formData.secondaryOccupationId1)?.name || ''} 
                                            className="input" 
                                            readOnly
                                            style={{ backgroundColor: '#f1f5f9' }}
                                        />
                                    ) : (
                                        <select
                                            className="input"
                                            value={formData.secondaryOccupationId1 || ''}
                                            onChange={e => setFormData({ ...formData, secondaryOccupationId1: e.target.value })}
                                        >
                                            <option value="">-- Chọn nghề phụ 1 --</option>
                                            {occupationsList.map(occ => (
                                                <option key={occ.id} value={occ.id}>{occ.name || occ.code}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Nghề phụ 2</label>
                                    {isReadOnly ? (
                                        <input 
                                            value={occupationsList.find(o => o.id === formData.secondaryOccupationId2)?.name || ''} 
                                            className="input" 
                                            readOnly
                                            style={{ backgroundColor: '#f1f5f9' }}
                                        />
                                    ) : (
                                        <select
                                            className="input"
                                            value={formData.secondaryOccupationId2 || ''}
                                            onChange={e => setFormData({ ...formData, secondaryOccupationId2: e.target.value })}
                                        >
                                            <option value="">-- Chọn nghề phụ 2 --</option>
                                            {occupationsList.map(occ => (
                                                <option key={occ.id} value={occ.id}>{occ.name || occ.code}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 5. Danh sách thuyền viên */}
                        <div>
                            <div className="flex items-center justify-between mb-sm" style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '4px' }}>
                                <h4 style={{ color: 'var(--primary-color)', margin: 0 }}>Danh sách thuyền viên</h4>
                                {!isReadOnly && (
                                    <button type="button" className="btn btn-primary flex items-center gap-xs" onClick={handleAddCrew} style={{ padding: '0.2rem 0.5rem', fontSize: '13px' }}>
                                        <Plus size={14} /> Thêm thuyền viên
                                    </button>
                                )}
                            </div>
                            
                            {formData.crews && formData.crews.length > 0 ? (
                                <table className="table" style={{ marginTop: '0', border: '1px solid var(--border-color)' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '50px', textAlign: 'center' }}>STT</th>
                                            <th style={{ minWidth: '180px' }}>Họ tên</th>
                                            <th style={{ minWidth: '120px' }}>CCCD</th>
                                            <th style={{ width: '130px' }}>Ngày sinh</th>
                                            <th style={{ width: '120px' }}>Điện thoại</th>
                                            <th style={{ minWidth: '150px' }}>Vai trò</th>
                                            {!isReadOnly && <th style={{ width: '50px', textAlign: 'center' }}>Xóa</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.crews.map((member: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="text-center">{idx + 1}</td>
                                                <td>
                                                    {isReadOnly ? (
                                                        <span className="font-medium">{member.fullName || '-'}</span>
                                                    ) : (
                                                        <input 
                                                            className="input" style={{ padding: '0.2rem 0.4rem', height: '30px' }}
                                                            value={member.fullName || ''}
                                                            onChange={e => handleUpdateCrew(idx, 'fullName', e.target.value)}
                                                            placeholder="Họ tên"
                                                            required
                                                        />
                                                    )}
                                                </td>
                                                <td>
                                                    {isReadOnly ? member.citizenId || '-' : (
                                                        <input 
                                                            className="input" style={{ padding: '0.2rem 0.4rem', height: '30px' }}
                                                            value={member.citizenId || ''}
                                                            onChange={e => handleUpdateCrew(idx, 'citizenId', e.target.value)}
                                                            placeholder="Số CCCD"
                                                        />
                                                    )}
                                                </td>
                                                <td>
                                                    {isReadOnly ? (member.birthDate ? member.birthDate.substring(0, 10) : '-') : (
                                                        <input 
                                                            type="date"
                                                            className="input" style={{ padding: '0.2rem 0.4rem', height: '30px' }}
                                                            value={member.birthDate ? member.birthDate.substring(0, 10) : ''}
                                                            onChange={e => handleUpdateCrew(idx, 'birthDate', e.target.value)}
                                                        />
                                                    )}
                                                </td>
                                                <td>
                                                    {isReadOnly ? member.phone || '-' : (
                                                        <input 
                                                            className="input" style={{ padding: '0.2rem 0.4rem', height: '30px' }}
                                                            value={member.phone || ''}
                                                            onChange={e => handleUpdateCrew(idx, 'phone', e.target.value)}
                                                            placeholder="SĐT"
                                                        />
                                                    )}
                                                </td>
                                                <td>
                                                    {isReadOnly ? (
                                                        crewRolesList.find(r => r.id === member.idcrewRole)?.description || crewRolesList.find(r => r.id === member.idcrewRole)?.code || '-'
                                                    ) : (
                                                        <select
                                                            className="input" style={{ padding: '0.2rem 0.4rem', height: '30px' }}
                                                            value={member.idcrewRole || ''}
                                                            onChange={e => handleUpdateCrew(idx, 'idcrewRole', e.target.value)}
                                                        >
                                                            <option value="">-- Chọn --</option>
                                                            {crewRolesList.map(role => (
                                                                <option key={role.id} value={role.id}>{role.description || role.code}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </td>
                                                {!isReadOnly && (
                                                    <td className="text-center">
                                                        <button type="button" className="btn btn-text" style={{ color: 'var(--error-color)', padding: '0.2rem' }} onClick={() => handleRemoveCrew(idx)}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '4px', color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic', textAlign: 'center' }}>
                                    Chưa có dữ liệu thuyền viên
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="modal-footer" style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
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
