import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../components/ToastContext';
import type { Ship, ShipResponse } from '../../types/Ship';
import type { CrewRoles, Occupations } from '../../types/Catalog';
import type { ShipOwner } from '../../types/ShipOwner';
import type { ServiceResponse } from '../../types/api';
import { shipDetailAPI } from '../../features/API/ship/Ship.ts';
import { crewRolesAPI, occupationsAPI } from '../../features/API/catalog/Catalog.ts';
import { listShipOwnerAPI, shipOwnerDetailAPI, updateShipOwnerAPI } from '../../features/API/shipOwner/ShipOwner.ts';
import { formatToDDMMYYYY, parseDDMMYYYYToISO, handleDateChange, normalizeDateOnBlur, saveOwnerBirthDate, getOwnerBirthDate, saveCrewBirthDate, getCrewBirthDate } from '../../utils/dateUtils.ts';

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
                if (res.data) {
                    const decorated = res.data.map(o => ({
                        ...o,
                        birthDate: getOwnerBirthDate(o.id, o.citizenId, o.birthDate),
                        phone: o.phone || (o as any).Phone || localStorage.getItem(`owner_phone_${o.id}`) || ''
                    }));
                    setOwners(decorated);
                }
            }).catch(() => {});
        }

        if (isOpen && ship && mode !== 'create') {
            setIsFetchingDetail(true);
            shipDetailAPI(ship.id)
                .then((fullShip: any) => {
                    if (fullShip.serial && ship?.id) {
                        localStorage.setItem(`ship_serial_${ship.id}`, fullShip.serial);
                    }
                    const devSerial = fullShip.deviceSerial || (fullShip.serial ? localStorage.getItem(`ship_device_serial_${fullShip.serial}`) || '' : '');
                    if (devSerial && ship?.id) {
                        localStorage.setItem(`ship_device_serial_${ship.id}`, devSerial);
                    }
                    const ownerName = fullShip.shipOwner?.fullName || fullShip.ShipOwner?.fullName || fullShip.shipOwnerName;
                    if (ownerName && ship?.id) {
                        localStorage.setItem(`ship_owner_name_${ship.id}`, ownerName);
                    }
                    const mappedData: Partial<ShipResponse> = {
                        ...fullShip,
                        mainOccupationId: fullShip.mainOccupationId || fullShip.mainOccupation?.id || fullShip.MainOccupation?.id || '',
                        secondaryOccupationId1: fullShip.secondaryOccupationId1 || fullShip.secondaryOccupation1?.id || fullShip.SecondaryOccupation1?.id || '',
                        secondaryOccupationId2: fullShip.secondaryOccupationId2 || fullShip.secondaryOccupation2?.id || fullShip.SecondaryOccupation2?.id || '',
                        idshipOwner: fullShip.idshipOwner || fullShip.shipOwner?.id || fullShip.ShipOwner?.id || '',
                        expirationDateOfMiningLicenseNumber: formatToDDMMYYYY(fullShip.expirationDateOfMiningLicenseNumber),
                        crews: (fullShip.crews || fullShip.crew || []).map((c: any, idx: number) => {
                            const shipKey = fullShip.id || ship.id || fullShip.serial || '';
                            const rawDob = c.birthDate || c.dateOfBirth || c.dob || c.birthday || c.BirthDate || c.DateOfBirth;
                            const crewDob = getCrewBirthDate({
                                id: c.id,
                                citizenId: c.citizenId,
                                fullName: c.fullName,
                                shipIdentifier: shipKey,
                                index: idx
                            }, rawDob);
                            return {
                                ...c,
                                birthDate: crewDob,
                                idcrewRole: c.idcrewRole || c.crewRole?.id || c.CrewRole?.id || ''
                            };
                        }),
                        deviceSerial: fullShip.deviceSerial || (fullShip.serial ? localStorage.getItem(`ship_device_serial_${fullShip.serial}`) || '' : '')
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
            setFormData({ name: '', serial: '', deviceSerial: '', crews: [] });
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
            
            // Xử lý deviceSerial: Lưu vào localStorage và xóa khỏi payload gửi backend
            if (payload.deviceSerial) {
                if (payload.serial) {
                    localStorage.setItem(`ship_device_serial_${payload.serial}`, payload.deviceSerial);
                }
                if (ship?.id) {
                    localStorage.setItem(`ship_device_serial_${ship.id}`, payload.deviceSerial);
                }
            }
            delete payload.deviceSerial;

            if (payload.serial && !payload.name) {
                payload.name = payload.serial;
            }
            if (payload.name && !payload.serial) {
                payload.serial = payload.name;
            }

            // Xử lý FishingGearSpecifications: Backend BẮT BUỘC trường này không được null hoặc rỗng.
            // Nếu người dùng không nhập, tự động điền theo nghề chính hoặc "-" để không bị lỗi 400
            if (!payload.fishingGearSpecifications || !payload.fishingGearSpecifications.trim()) {
                const mainOccName = occupationsList.find(o => o.id === payload.mainOccupationId)?.name;
                payload.fishingGearSpecifications = mainOccName ? `Nghề ${mainOccName}` : "-";
            }

            // Đảm bảo các trường số gửi số thay vì chuỗi rỗng
            payload.dimension1 = payload.dimension1 ? Number(payload.dimension1) : 0;
            payload.dimension2 = payload.dimension2 ? Number(payload.dimension2) : 0;
            payload.lengthOverall = payload.lengthOverall ? Number(payload.lengthOverall) : 0;
            payload.totalPower = payload.totalPower ? Number(payload.totalPower) : 0;

            // Xóa các trường tùy chọn nếu để trống để C# parse thành null
            if (!payload.secondaryOccupationId1) delete payload.secondaryOccupationId1;
            if (!payload.secondaryOccupationId2) delete payload.secondaryOccupationId2;
            if (!payload.miningLicenseNumber) delete payload.miningLicenseNumber;
            if (payload.expirationDateOfMiningLicenseNumber) {
                payload.expirationDateOfMiningLicenseNumber = parseDDMMYYYYToISO(payload.expirationDateOfMiningLicenseNumber);
            } else {
                delete payload.expirationDateOfMiningLicenseNumber;
            }
            
            // Lưu Ngày sinh các thuyền viên vào cache để không bao giờ bị mất khi backend không lưu hoặc không trả về
            if (formData.crews) {
                const shipKey = ship?.id || formData.serial || '';
                formData.crews.forEach((c: any, idx: number) => {
                    if (c.birthDate) {
                        saveCrewBirthDate({
                            id: c.id,
                            citizenId: c.citizenId,
                            fullName: c.fullName,
                            shipIdentifier: shipKey,
                            index: idx
                        }, c.birthDate);
                    }
                });
            }

            // Dọn dẹp cả bên trong danh sách thuyền viên
            if (payload.crews) {
                payload.crews = payload.crews.map((c: any) => {
                    const cleaned = { ...c };
                    if (!cleaned.idcrewRole) delete cleaned.idcrewRole;
                    if (cleaned.birthDate) {
                        const isoDate = parseDDMMYYYYToISO(cleaned.birthDate);
                        cleaned.birthDate = isoDate;
                        cleaned.dateOfBirth = isoDate;
                    } else {
                        delete cleaned.birthDate;
                        delete cleaned.dateOfBirth;
                    }
                    return cleaned;
                });
            }

            // Cập nhật lại thông tin Chủ tàu nếu có thay đổi (Ngày sinh, CCCD)
            if (formData.idshipOwner) {
                const currentOwnerInState = owners.find(o => o.id === formData.idshipOwner);
                if (currentOwnerInState) {
                    saveOwnerBirthDate(currentOwnerInState.id, currentOwnerInState.citizenId, currentOwnerInState.birthDate);
                    try {
                        const fullOwner = await shipOwnerDetailAPI(formData.idshipOwner);
                        const isoBirthDate = parseDDMMYYYYToISO(currentOwnerInState.birthDate);
                        await updateShipOwnerAPI(formData.idshipOwner, {
                            ...fullOwner,
                            citizenId: currentOwnerInState.citizenId || fullOwner.citizenId,
                            birthDate: isoBirthDate || fullOwner.birthDate,
                            phone: currentOwnerInState.phone || fullOwner.phone
                        });
                        if (currentOwnerInState.phone) {
                            localStorage.setItem(`owner_phone_${formData.idshipOwner}`, currentOwnerInState.phone);
                        }
                    } catch (e) {
                        console.warn("Không thể cập nhật thông tin chủ tàu", e);
                    }
                }
            }

            if (payload.serial && ship?.id) {
                localStorage.setItem(`ship_serial_${ship.id}`, payload.serial);
            }
            if (formData.idshipOwner && ship?.id) {
                const ownerObj = owners.find(o => o.id === formData.idshipOwner);
                if (ownerObj) {
                    localStorage.setItem(`ship_owner_name_${ship.id}`, ownerObj.fullName);
                }
            }
            await onSubmit(payload);
            success(mode === 'create' ? 'Thêm mới tàu thành công!' : 'Cập nhật tàu thành công!');
            onClose();
        } catch (error) {
            const errorResponse = error as ServiceResponse;
            if (errorResponse.status === 400 && errorResponse.errors) {
                setFieldErrors(errorResponse.errors);
                const errorMessages = Object.entries(errorResponse.errors)
                    .map(([_, msgs]) => msgs[0])
                    .join('; ');
                const displayMsg = errorMessages || 'Vui lòng kiểm tra lại các trường bị lỗi.';
                setMainError(displayMsg);
                showError(displayMsg);
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

    const controlStyle: React.CSSProperties = {
        height: '38px',
        boxSizing: 'border-box',
        fontSize: '14px',
        padding: '0.4rem 0.75rem',
        borderRadius: '6px',
        width: '100%',
        border: '1px solid #cbd5e1',
        backgroundColor: '#ffffff'
    };

    const readOnlyStyle: React.CSSProperties = {
        ...controlStyle,
        backgroundColor: '#f8fafc',
        color: '#334155',
        cursor: 'default'
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '13.5px',
        marginBottom: '6px',
        fontWeight: 500,
        color: '#334155'
    };

    const sectionBoxStyle: React.CSSProperties = {
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
    };

    const sectionTitleStyle: React.CSSProperties = {
        margin: '0 0 14px 0',
        fontSize: '15px',
        fontWeight: 600,
        color: 'var(--primary-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '8px',
        borderBottom: '1.5px solid #f1f5f9'
    };

    const getGearConfig = (occupationId?: string) => {
        const occ = occupationsList.find(o => o.id === occupationId);
        const name = (occ?.name || occ?.code || '').toLowerCase();

        // Nghề câu: Chiều dài toàn bộ vàng câu (m); Số lưỡi câu (lưỡi)
        if (name.includes('câu')) {
            return {
                title: `4. Kích thước chủ yếu của ngư cụ (${occ?.name || 'Nghề câu'})`,
                dim1Label: 'Chiều dài toàn bộ vàng câu (m)',
                dim1Placeholder: 'Nhập chiều dài vàng câu (m)',
                dim2Label: 'Số lưỡi câu (lưỡi)',
                dim2Placeholder: 'Nhập số lưỡi câu',
                notesLabel: 'Quy cách khác (nếu có)',
                notesPlaceholder: 'Nhập ghi chú quy cách khác...'
            };
        }
        // Nghề lưới vây, rê: Chiều dài toàn bộ lưới (m); Chiều cao lưới (m)
        if (name.includes('vây') || name.includes('rê')) {
            return {
                title: `4. Kích thước chủ yếu của ngư cụ (${occ?.name || 'Lưới vây / Lưới rê'})`,
                dim1Label: 'Chiều dài toàn bộ lưới (m)',
                dim1Placeholder: 'Nhập chiều dài toàn bộ lưới (m)',
                dim2Label: 'Chiều cao lưới (m)',
                dim2Placeholder: 'Nhập chiều cao lưới (m)',
                notesLabel: 'Quy cách khác (nếu có)',
                notesPlaceholder: 'Nhập ghi chú quy cách khác...'
            };
        }
        // Nghề lưới chụp: Chu vi miệng lưới (m); Chiều cao lưới (m)
        if (name.includes('chụp')) {
            return {
                title: `4. Kích thước chủ yếu của ngư cụ (${occ?.name || 'Lưới chụp'})`,
                dim1Label: 'Chu vi miệng lưới (m)',
                dim1Placeholder: 'Nhập chu vi miệng lưới (m)',
                dim2Label: 'Chiều cao lưới (m)',
                dim2Placeholder: 'Nhập chiều cao lưới (m)',
                notesLabel: 'Quy cách khác (nếu có)',
                notesPlaceholder: 'Nhập ghi chú quy cách khác...'
            };
        }
        // Nghề lưới kéo (hoặc cào): Chiều dài giềng phao (m); Chiều dài toàn bộ lưới (m)
        if (name.includes('kéo') || name.includes('cào')) {
            return {
                title: `4. Kích thước chủ yếu của ngư cụ (${occ?.name || 'Lưới kéo'})`,
                dim1Label: 'Chiều dài giềng phao (m)',
                dim1Placeholder: 'Nhập chiều dài giềng phao (m)',
                dim2Label: 'Chiều dài toàn bộ lưới (m)',
                dim2Placeholder: 'Nhập chiều dài toàn bộ lưới (m)',
                notesLabel: 'Quy cách khác (nếu có)',
                notesPlaceholder: 'Nhập ghi chú quy cách khác...'
            };
        }
        // Nghề khác / Mặc định
        return {
            title: occ?.name ? `4. Kích thước chủ yếu của ngư cụ (${occ.name})` : '4. Kích thước chủ yếu của ngư cụ (theo Mục 8 NKKT)',
            dim1Label: 'Kích thước 1 (Chiều dài / Chu vi / Giềng phao...)',
            dim1Placeholder: 'Nhập kích thước 1',
            dim2Label: 'Kích thước 2 (Chiều cao / Số lưỡi / Chiều dài...)',
            dim2Placeholder: 'Nhập kích thước 2',
            notesLabel: 'Quy cách ngư cụ khác',
            notesPlaceholder: 'Nhập quy cách ngư cụ khác...'
        };
    };

    const gearConfig = getGearConfig(formData.mainOccupationId);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '1320px', width: '95vw' }} onClick={e => e.stopPropagation()}>
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
                    <div className="modal-body flex flex-col" style={{ position: 'relative', maxHeight: '72vh', overflowY: 'auto', padding: '16px 20px', backgroundColor: '#f8fafc' }}>
                        {isFetchingDetail && (
                            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="text-muted">Đang tải dữ liệu...</span>
                            </div>
                        )}
                        
                        {/* 1. Thông tin Chủ tàu */}
                        <div style={sectionBoxStyle}>
                            <div style={sectionTitleStyle}>
                                <span>1. Thông tin Chủ tàu</span>
                                {!isReadOnly && formData.idshipOwner && (
                                    <button 
                                        type="button" 
                                        className="btn btn-primary" 
                                        style={{ padding: '3px 10px', fontSize: '12px' }}
                                        onClick={() => {
                                            const owner = owners.find(o => o.id === formData.idshipOwner);
                                            if (owner) {
                                                const captainRole = crewRolesList.find(r => 
                                                    (r.code && r.code.toUpperCase() === 'CAPTAIN') || 
                                                    (r.description && r.description.toLowerCase().includes('thuyền trưởng'))
                                                );
                                                const dob = formatToDDMMYYYY(owner.birthDate) || getOwnerBirthDate(owner.id, owner.citizenId);
                                                const newCrew = {
                                                    fullName: owner.fullName,
                                                    citizenId: owner.citizenId,
                                                    birthDate: dob,
                                                    phone: (owner as any).phone || '',
                                                    email: (owner as any).email || '',
                                                    idcrewRole: captainRole ? captainRole.id : ''
                                                };
                                                saveCrewBirthDate({
                                                    citizenId: owner.citizenId,
                                                    fullName: owner.fullName,
                                                    shipIdentifier: ship?.id || formData.serial,
                                                    index: (formData.crews || []).length
                                                }, dob);
                                                setFormData(prev => ({ ...prev, crews: [...(prev.crews || []), newCrew] }));
                                                success('Đã thêm chủ tàu vào danh sách thuyền viên với vai trò Thuyền trưởng');
                                            }
                                        }}
                                    >
                                        + Đặt làm Thuyền trưởng
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.1fr 1.1fr 1.1fr', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}>Họ và tên chủ tàu (*)</label>
                                    {isReadOnly ? (
                                        <input 
                                            value={owners.find(o => o.id === formData.idshipOwner)?.fullName || ''} 
                                            className="input" 
                                            readOnly
                                            style={readOnlyStyle}
                                        />
                                    ) : (
                                        <select 
                                            className="input" 
                                            value={formData.idshipOwner || ''} 
                                            onChange={e => {
                                                const selectedId = e.target.value;
                                                setFormData({ ...formData, idshipOwner: selectedId });
                                                const cur = owners.find(o => o.id === selectedId);
                                                if (cur) {
                                                    const dob = getOwnerBirthDate(cur.id, cur.citizenId, cur.birthDate);
                                                    if (dob && dob !== cur.birthDate) {
                                                        setOwners(owners.map(o => o.id === selectedId ? { ...o, birthDate: dob } : o));
                                                    }
                                                }
                                            }}
                                            required
                                            style={{ ...controlStyle, borderColor: getError('idshipOwner') ? 'var(--error-color)' : '#cbd5e1' }}
                                        >
                                            <option value="">-- Chọn chủ tàu --</option>
                                            {owners.map(owner => (
                                                <option key={owner.id} value={owner.id}>{owner.fullName} - {owner.citizenId}</option>
                                            ))}
                                        </select>
                                    )}
                                    {getError('idshipOwner') && <span style={{ color: 'var(--error-color)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{getError('idshipOwner')}</span>}
                                </div>
                                <div>
                                    <label style={labelStyle}>Số điện thoại</label>
                                    <input 
                                        placeholder="Nhập số điện thoại"
                                        value={owners.find(o => o.id === formData.idshipOwner)?.phone || ''} 
                                        className="input" 
                                        onChange={(e) => {
                                            const newOwners = [...owners];
                                            const idx = newOwners.findIndex(o => o.id === formData.idshipOwner);
                                            if (idx >= 0) {
                                                newOwners[idx].phone = e.target.value;
                                                setOwners(newOwners);
                                                if (newOwners[idx].id) {
                                                    localStorage.setItem(`owner_phone_${newOwners[idx].id}`, e.target.value);
                                                }
                                            }
                                        }}
                                        readOnly={isReadOnly || !formData.idshipOwner}
                                        style={(isReadOnly || !formData.idshipOwner) ? readOnlyStyle : controlStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Số định danh cá nhân (CCCD)</label>
                                    <input 
                                        placeholder="Nhập số CCCD"
                                        value={owners.find(o => o.id === formData.idshipOwner)?.citizenId || ''} 
                                        className="input" 
                                        onChange={(e) => {
                                            const newOwners = [...owners];
                                            const idx = newOwners.findIndex(o => o.id === formData.idshipOwner);
                                            if (idx >= 0) {
                                                newOwners[idx].citizenId = e.target.value;
                                                setOwners(newOwners);
                                                saveOwnerBirthDate(newOwners[idx].id, e.target.value, newOwners[idx].birthDate);
                                            }
                                        }}
                                        readOnly={isReadOnly || !formData.idshipOwner}
                                        style={(isReadOnly || !formData.idshipOwner) ? readOnlyStyle : controlStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Ngày tháng năm sinh</label>
                                    <input 
                                        type="text"
                                        placeholder="dd/MM/yyyy"
                                        maxLength={10}
                                        value={owners.find(o => o.id === formData.idshipOwner)?.birthDate || ''} 
                                        onChange={(e) => {
                                            const prev = owners.find(o => o.id === formData.idshipOwner)?.birthDate || '';
                                            const next = handleDateChange(e.target.value, prev);
                                            const newOwners = [...owners];
                                            const idx = newOwners.findIndex(o => o.id === formData.idshipOwner);
                                            if (idx >= 0) {
                                                newOwners[idx].birthDate = next;
                                                setOwners(newOwners);
                                                saveOwnerBirthDate(newOwners[idx].id, newOwners[idx].citizenId, next);
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const normalized = normalizeDateOnBlur(e.target.value);
                                            const newOwners = [...owners];
                                            const idx = newOwners.findIndex(o => o.id === formData.idshipOwner);
                                            if (idx >= 0) {
                                                newOwners[idx].birthDate = normalized;
                                                setOwners(newOwners);
                                                saveOwnerBirthDate(newOwners[idx].id, newOwners[idx].citizenId, normalized);
                                            }
                                        }}
                                        readOnly={isReadOnly || !formData.idshipOwner}
                                        style={(isReadOnly || !formData.idshipOwner) ? readOnlyStyle : controlStyle}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Thông tin Tàu */}
                        <div style={sectionBoxStyle}>
                            <div style={sectionTitleStyle}>
                                <span>2. Thông tin Tàu & Thông số kỹ thuật</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 1fr 1.3fr', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}>Số đăng ký / Tên tàu (*)</label>
                                    <input 
                                        name="serial"
                                        placeholder="VD: BV-92345-TS"
                                        value={formData.serial || formData.name || ''} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                serial: val,
                                                name: val
                                            }));
                                        }}
                                        className="input" 
                                        required
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? readOnlyStyle : { ...controlStyle, borderColor: (getError('serial') || getError('name')) ? 'var(--error-color)' : '#cbd5e1' }}
                                    />
                                    {(getError('serial') || getError('name')) && (
                                        <span style={{ color: 'var(--error-color)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                            {getError('serial') || getError('name')}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <label style={labelStyle}>Số Serial thiết bị</label>
                                    <input 
                                        name="deviceSerial"
                                        placeholder="VD: 864521039871"
                                        value={formData.deviceSerial || ''} 
                                        onChange={handleChange}
                                        className="input" 
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? readOnlyStyle : controlStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Chiều dài lớn nhất (m)</label>
                                    <input 
                                        type="number" 
                                        name="lengthOverall"
                                        placeholder="VD: 19.5"
                                        value={formData.lengthOverall || ''} 
                                        onChange={handleChange}
                                        className="input" 
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? readOnlyStyle : controlStyle}
                                    />
                                </div>
                                <div>
                                    <label style={{ ...labelStyle, whiteSpace: 'nowrap' }}>Tổng công suất máy chính (kW)</label>
                                    <input 
                                        type="number" 
                                        name="totalPower"
                                        placeholder="VD: 450"
                                        value={formData.totalPower || ''} 
                                        onChange={handleChange}
                                        className="input" 
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? readOnlyStyle : controlStyle}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Giấy phép & Nghề nghiệp */}
                        <div style={sectionBoxStyle}>
                            <div style={sectionTitleStyle}>
                                <span>3. Giấy phép khai thác & Nghề nghiệp</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.95fr 1.45fr 1.25fr 1.25fr', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}>Số GPKT thủy sản</label>
                                    <input 
                                        type="text" 
                                        name="miningLicenseNumber"
                                        value={formData.miningLicenseNumber || ''} 
                                        onChange={handleChange}
                                        className="input" 
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? readOnlyStyle : controlStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Thời hạn đến</label>
                                    <input 
                                        type="text"
                                        name="expirationDateOfMiningLicenseNumber"
                                        placeholder="dd/MM/yyyy"
                                        maxLength={10}
                                        value={formData.expirationDateOfMiningLicenseNumber || ''} 
                                        onChange={(e) => {
                                            const prev = formData.expirationDateOfMiningLicenseNumber || '';
                                            const next = handleDateChange(e.target.value, prev);
                                            setFormData({ ...formData, expirationDateOfMiningLicenseNumber: next });
                                        }}
                                        onBlur={(e) => {
                                            const normalized = normalizeDateOnBlur(e.target.value);
                                            setFormData({ ...formData, expirationDateOfMiningLicenseNumber: normalized });
                                        }}
                                        className="input" 
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? readOnlyStyle : controlStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Nghề chính (*)</label>
                                    {isReadOnly ? (
                                        <input 
                                            value={occupationsList.find(o => o.id === formData.mainOccupationId)?.name || ''} 
                                            className="input" 
                                            readOnly
                                            style={readOnlyStyle}
                                        />
                                    ) : (
                                        <select
                                            className="input"
                                            value={formData.mainOccupationId || ''}
                                            onChange={e => setFormData({ ...formData, mainOccupationId: e.target.value })}
                                            required
                                            style={{ ...controlStyle, borderColor: getError('mainOccupationId') ? 'var(--error-color)' : '#cbd5e1' }}
                                        >
                                            <option value="">-- Chọn nghề chính --</option>
                                            {occupationsList.map(occ => (
                                                <option key={occ.id} value={occ.id}>{occ.name || occ.code}</option>
                                            ))}
                                        </select>
                                    )}
                                    {getError('mainOccupationId') && <span style={{ color: 'var(--error-color)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{getError('mainOccupationId')}</span>}
                                </div>
                                <div>
                                    <label style={labelStyle}>Nghề phụ 1</label>
                                    {isReadOnly ? (
                                        <input 
                                            value={occupationsList.find(o => o.id === formData.secondaryOccupationId1)?.name || ''} 
                                            className="input" 
                                            readOnly
                                            style={readOnlyStyle}
                                        />
                                    ) : (
                                        <select
                                            className="input"
                                            value={formData.secondaryOccupationId1 || ''}
                                            onChange={e => setFormData({ ...formData, secondaryOccupationId1: e.target.value })}
                                            style={controlStyle}
                                        >
                                            <option value="">-- Chọn nghề phụ 1 --</option>
                                            {occupationsList.map(occ => (
                                                <option key={occ.id} value={occ.id}>{occ.name || occ.code}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label style={labelStyle}>Nghề phụ 2</label>
                                    {isReadOnly ? (
                                        <input 
                                            value={occupationsList.find(o => o.id === formData.secondaryOccupationId2)?.name || ''} 
                                            className="input" 
                                            readOnly
                                            style={readOnlyStyle}
                                        />
                                    ) : (
                                        <select
                                            className="input"
                                            value={formData.secondaryOccupationId2 || ''}
                                            onChange={e => setFormData({ ...formData, secondaryOccupationId2: e.target.value })}
                                            style={controlStyle}
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

                        {/* 4. Kích thước chủ yếu của ngư cụ */}
                        <div style={sectionBoxStyle}>
                            <div style={sectionTitleStyle}>
                                <span>{gearConfig.title}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2.2fr', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}>{gearConfig.dim1Label}</label>
                                    <input 
                                        type="number" 
                                        name="dimension1"
                                        placeholder={gearConfig.dim1Placeholder}
                                        value={formData.dimension1 ?? ''} 
                                        onChange={handleChange}
                                        className="input" 
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? readOnlyStyle : controlStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>{gearConfig.dim2Label}</label>
                                    <input 
                                        type="number" 
                                        name="dimension2"
                                        placeholder={gearConfig.dim2Placeholder}
                                        value={formData.dimension2 ?? ''} 
                                        onChange={handleChange}
                                        className="input" 
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? readOnlyStyle : controlStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>{gearConfig.notesLabel}</label>
                                    <input 
                                        type="text" 
                                        name="fishingGearSpecifications"
                                        placeholder={gearConfig.notesPlaceholder}
                                        value={formData.fishingGearSpecifications || ''} 
                                        onChange={handleChange}
                                        className="input" 
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? readOnlyStyle : controlStyle}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 5. Danh sách thuyền viên */}
                        <div style={sectionBoxStyle}>
                            <div style={sectionTitleStyle}>
                                <span>5. Danh sách thuyền viên (Thuyền trưởng & Thuyền viên)</span>
                                {!isReadOnly && (
                                    <button type="button" className="btn btn-primary flex items-center gap-xs" onClick={handleAddCrew} style={{ padding: '4px 10px', fontSize: '13px' }}>
                                        <Plus size={14} /> Thêm thuyền viên
                                    </button>
                                )}
                            </div>
                            
                            {formData.crews && formData.crews.length > 0 ? (
                                <div style={{ overflowX: 'auto', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                <th style={{ width: '45px', textAlign: 'center', padding: '10px 8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>STT</th>
                                                <th style={{ width: '23%', minWidth: '190px', padding: '10px 10px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Họ tên (*)</th>
                                                <th style={{ width: '16%', minWidth: '140px', padding: '10px 10px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>CCCD</th>
                                                <th style={{ width: '15%', minWidth: '140px', padding: '10px 10px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Ngày sinh</th>
                                                <th style={{ width: '18%', minWidth: '170px', padding: '10px 10px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Số điện thoại</th>
                                                <th style={{ width: '21%', minWidth: '180px', padding: '10px 10px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Vai trò</th>
                                                {!isReadOnly && <th style={{ width: '55px', textAlign: 'center', padding: '10px 8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Xóa</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.crews.map((member: any, idx: number) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ textAlign: 'center', padding: '8px 8px', fontSize: '13px', color: '#64748b' }}>{idx + 1}</td>
                                                    <td style={{ padding: '8px 10px' }}>
                                                        {isReadOnly ? (
                                                            <span style={{ fontWeight: 500, fontSize: '13.5px', color: '#1e293b' }}>{member.fullName || '-'}</span>
                                                        ) : (
                                                            <input 
                                                                className="input" 
                                                                style={{ ...controlStyle, height: '36px', padding: '0.35rem 0.65rem', fontSize: '13.5px' }}
                                                                value={member.fullName || ''}
                                                                onChange={e => handleUpdateCrew(idx, 'fullName', e.target.value)}
                                                                placeholder="Họ và tên"
                                                                required
                                                            />
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '8px 10px' }}>
                                                        {isReadOnly ? (
                                                            <span style={{ fontSize: '13.5px', color: '#334155' }}>{member.citizenId || '-'}</span>
                                                        ) : (
                                                            <input 
                                                                className="input" 
                                                                style={{ ...controlStyle, height: '36px', padding: '0.35rem 0.65rem', fontSize: '13.5px' }}
                                                                value={member.citizenId || ''}
                                                                onChange={e => {
                                                                    const newCid = e.target.value;
                                                                    handleUpdateCrew(idx, 'citizenId', newCid);
                                                                    if (!member.birthDate && newCid.trim()) {
                                                                        const autoDob = getCrewBirthDate({ citizenId: newCid.trim() });
                                                                        if (autoDob) {
                                                                            handleUpdateCrew(idx, 'birthDate', autoDob);
                                                                        }
                                                                    }
                                                                }}
                                                                placeholder="Số CCCD"
                                                            />
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '8px 10px' }}>
                                                        {isReadOnly ? (
                                                            <span style={{ fontSize: '13.5px', color: '#334155' }}>{formatToDDMMYYYY(member.birthDate) || '-'}</span>
                                                        ) : (
                                                            <input 
                                                                type="text"
                                                                placeholder="dd/MM/yyyy"
                                                                maxLength={10}
                                                                className="input" 
                                                                style={{ ...controlStyle, height: '36px', padding: '0.35rem 0.65rem', fontSize: '13.5px' }}
                                                                value={member.birthDate || ''}
                                                                onChange={e => {
                                                                    const next = handleDateChange(e.target.value, member.birthDate || '');
                                                                    handleUpdateCrew(idx, 'birthDate', next);
                                                                    if (next.length === 10) {
                                                                        saveCrewBirthDate({
                                                                            id: member.id,
                                                                            citizenId: member.citizenId,
                                                                            fullName: member.fullName,
                                                                            shipIdentifier: ship?.id || formData.serial,
                                                                            index: idx
                                                                        }, next);
                                                                    }
                                                                }}
                                                                onBlur={e => {
                                                                    const normalized = normalizeDateOnBlur(e.target.value);
                                                                    handleUpdateCrew(idx, 'birthDate', normalized);
                                                                    if (normalized) {
                                                                        saveCrewBirthDate({
                                                                            id: member.id,
                                                                            citizenId: member.citizenId,
                                                                            fullName: member.fullName,
                                                                            shipIdentifier: ship?.id || formData.serial,
                                                                            index: idx
                                                                        }, normalized);
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '8px 10px' }}>
                                                        {isReadOnly ? (
                                                            <span style={{ fontSize: '13.5px', color: '#334155' }}>{member.phone || '-'}</span>
                                                        ) : (
                                                            <input 
                                                                className="input" 
                                                                style={{ ...controlStyle, height: '36px', padding: '0.35rem 0.65rem', fontSize: '13.5px' }}
                                                                value={member.phone || ''}
                                                                onChange={e => handleUpdateCrew(idx, 'phone', e.target.value)}
                                                                placeholder="Số điện thoại"
                                                            />
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '8px 10px' }}>
                                                        {isReadOnly ? (
                                                            <span style={{ fontSize: '13.5px', color: '#334155' }}>
                                                                {crewRolesList.find(r => r.id === member.idcrewRole)?.description || crewRolesList.find(r => r.id === member.idcrewRole)?.code || '-'}
                                                            </span>
                                                        ) : (
                                                            <select
                                                                className="input" 
                                                                style={{ ...controlStyle, height: '36px', padding: '0.35rem 0.65rem', fontSize: '13.5px' }}
                                                                value={member.idcrewRole || ''}
                                                                onChange={e => handleUpdateCrew(idx, 'idcrewRole', e.target.value)}
                                                            >
                                                                <option value="">-- Chọn vai trò --</option>
                                                                {crewRolesList.map(role => (
                                                                    <option key={role.id} value={role.id}>{role.description || role.code}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </td>
                                                    {!isReadOnly && (
                                                        <td style={{ textAlign: 'center', padding: '8px 8px' }}>
                                                            <button 
                                                                type="button" 
                                                                className="btn btn-text" 
                                                                style={{ color: 'var(--error-color)', padding: '4px', borderRadius: '4px' }} 
                                                                onClick={() => handleRemoveCrew(idx)}
                                                                title="Xóa thuyền viên"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1', color: 'var(--text-muted)', fontSize: '13.5px', textAlign: 'center' }}>
                                    Chưa có thông tin thuyền viên. Nhấn <strong>"Thêm thuyền viên"</strong> hoặc <strong>"+ Đặt làm Thuyền trưởng"</strong> ở Mục 1 để thêm.
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
