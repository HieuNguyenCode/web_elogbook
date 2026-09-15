import React, {useEffect, useState} from 'react';
import Select from 'react-select';
import {Plus, Trash2, X} from 'lucide-react';
import {useToast} from '../../components/ToastContext';
import type {Ship, ShipResponse} from '../../types/Ship';
import type {CrewRoles, Occupations} from '../../types/Catalog';
import type {ShipOwner} from '../../types/ShipOwner';
import type {ServiceResponse} from '../../types/api';
import {shipDetailAPI} from '../../features/API/ship/Ship.ts';
import {crewRolesAPI, occupationsAPI} from '../../features/API/catalog/Catalog.ts';
import {listShipOwnerAPI, shipOwnerDetailAPI} from '../../features/API/shipOwner/ShipOwner.ts';
import {
    formatToDDMMYYYY,
    getCrewBirthDate,
    getOwnerBirthDate,
    handleDateChange,
    normalizeDateOnBlur,
    parseDDMMYYYYToISO,
    saveCrewBirthDate
} from '../../utils/dateUtils.ts';

type ModalMode = 'view' | 'create' | 'edit';

interface ShipModalProps {
    isOpen: boolean;
    mode: ModalMode;
    ship?: Ship | null;
    onClose: () => void;
    onSubmit: (payload: ShipResponse) => Promise<void>;
}

export default function ShipModal({isOpen, onClose, mode, ship, onSubmit}: ShipModalProps) {
    const {success, error: showError} = useToast();
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
                const list = Array.isArray(res) ? res : (res as { data?: unknown[] }).data || res;
                if (Array.isArray(list)) setCrewRolesList(list as CrewRoles[]);
            }).catch(() => {
            });

            occupationsAPI().then(res => {
                const list = Array.isArray(res) ? res : (res as { data?: unknown[] }).data || res;
                if (Array.isArray(list)) setOccupationsList(list as Occupations[]);
            }).catch(() => {
            });

            // Fetch a sufficiently large list of ship owners to display in the dropdown
            listShipOwnerAPI('', 1, 100).then(res => {
                if (res.data) {
                    const decorated = res.data.map(o => ({
                        ...o,
                        birthDate: getOwnerBirthDate(o.id, o.citizenId, o.birthDate),
                        phone: o.phone || (o as { Phone?: string }).Phone || ''
                    }));
                    setOwners(decorated);
                }
            }).catch(() => {
            });
        }

        if (isOpen && ship && mode !== 'create') {
            setTimeout(() => setIsFetchingDetail(true), 0);
            shipDetailAPI(ship.id)
                .then((fullShip: ShipResponse) => {
                    const devSerial = fullShip.deviceSerial || (fullShip.serial ? localStorage.getItem(`ship_device_serial_${fullShip.serial}`) || '' : '');
                    if (devSerial && ship?.id) {
                        localStorage.setItem(`ship_device_serial_${ship.id}`, devSerial);
                    }
                    const mappedData: Partial<ShipResponse> = {
                        ...fullShip,
                        mainOccupationId: fullShip.mainOccupationId || fullShip.mainOccupation?.id || fullShip.MainOccupation?.id || '',
                        secondaryOccupationId1: fullShip.secondaryOccupationId1 || fullShip.secondaryOccupation1?.id || fullShip.SecondaryOccupation1?.id || '',
                        secondaryOccupationId2: fullShip.secondaryOccupationId2 || fullShip.secondaryOccupation2?.id || fullShip.SecondaryOccupation2?.id || '',
                        idshipOwner: fullShip.idshipOwner || fullShip.shipOwner?.id || fullShip.ShipOwner?.id || '',
                        installationDate: formatToDDMMYYYY(fullShip.installationDate),
                        expirationDateOfMiningLicenseNumber: formatToDDMMYYYY(fullShip.expirationDateOfMiningLicenseNumber),
                        crews: (fullShip.crews || fullShip.crew || []).map((c: ShipResponse["crews"][0], idx: number) => {
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
            setTimeout(() => setFormData({name: "", serial: "", deviceSerial: "", crews: []}), 0);
        }

        setTimeout(() => setMainError(null), 0);
        setTimeout(() => setFieldErrors({}), 0);
    }, [isOpen, ship, mode]);

    if (!isOpen) return null;

    const isReadOnly = mode === 'view';


    const getAutoSpec = (d1: number | undefined, d2: number | undefined, occId: string | undefined) => {
        if (d1 == null || d2 == null || d1.toString().trim() === '' || d2.toString().trim() === '') return '';
        let autoSpec: string;
        const occ = occupationsList.find(o => o.id === occId);
        const name = (occ?.name || occ?.code || '').toLowerCase();

        if (name.includes('câu')) {
            autoSpec = `Chiều dài toàn bộ vàng câu ${d1} m; Số lưỡi câu: ${d2} lưỡi`;
        } else if (name.includes('vây') || name.includes('rê')) {
            autoSpec = `Chiều dài toàn bộ lưới ${d1} m; Chiều cao lưới ${d2} m`;
        } else if (name.includes('chụp')) {
            autoSpec = `Chu vi miệng lưới ${d1} m; Chiều cao lưới ${d2} m`;
        } else if (name.includes('kéo') || name.includes('cào')) {
            autoSpec = `Chiều dài giềng phao ${d1} m; Chiều dài toàn bộ lưới ${d2} m`;
        } else {
            autoSpec = `Kích thước 1: ${d1}; Kích thước 2: ${d2}`;
        }
        return autoSpec;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value, type} = e.target;
        const val = type === 'number' ? Number(value) : value;
        const newFormData = {...formData, [name]: val};

        if (name === 'dimension1' || name === 'dimension2') {
            const spec = getAutoSpec(newFormData.dimension1, newFormData.dimension2, newFormData.mainOccupationId);
            if (spec) newFormData.fishingGearSpecifications = spec;
        }

        setFormData(newFormData);
    };

    const handleAddCrew = () => {
        if (isReadOnly) return;
        const newCrew = {fullName: '', citizenId: '', phone: '', email: '', idcrewRole: ''};
        setFormData(prev => ({...prev, crews: [...(prev.crews || []), newCrew]}));
    };

    const handleUpdateCrew = (index: number, field: string, value: string | number) => {
        if (isReadOnly) return;
        const updatedCrew = [...(formData.crews || [])];
        updatedCrew[index] = {...updatedCrew[index], [field]: value};
        setFormData({...formData, crews: updatedCrew});
    };

    const handleRemoveCrew = (index: number) => {
        if (isReadOnly) return;
        const updatedCrew = (formData.crews || []).filter((_, i) => i !== index);
        setFormData({...formData, crews: updatedCrew});
    };


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isReadOnly) return;

        setTimeout(() => setMainError(null), 0);
        setTimeout(() => setFieldErrors({}), 0);

        // Custom validations có thể thêm ở đây
        if (!formData.crews || formData.crews.length === 0) {
            setMainError("Danh sách thuyền viên phải có ít nhất 1 người.");
            return;
        }

        const captainRoleIds = crewRolesList
            .filter(r => (r.code && r.code.toUpperCase() === 'CAPTAIN') || (r.description && r.description.toLowerCase().includes('thuyền trưởng')))
            .map(r => r.id);

        const hasCaptain = formData.crews.some(crew => crew.idcrewRole && captainRoleIds.includes(crew.idcrewRole));
        if (!hasCaptain) {
            setMainError("Danh sách thuyền viên phải có ít nhất 1 người có vai trò Thuyền trưởng.");
            return;
        }

        if (Number(formData.dimension1 || 0) <= 0 || Number(formData.dimension2 || 0) <= 0) {
            setMainError("Kích thước chủ yếu của ngư cụ phải lớn hơn 0.");
            return;
        }

        setIsLoading(true);

        try {
            // Cấu trúc payload chuẩn 100% theo swagger.json (AdditionalProperties = false)
            const strictPayload: Partial<ShipResponse> = {
                name: formData.name || "-",
                serial: formData.serial || "-",
                idshipOwner: formData.idshipOwner || "00000000-0000-0000-0000-000000000000",
                mainOccupationId: formData.mainOccupationId || "00000000-0000-0000-0000-000000000000",
                lengthOverall: formData.lengthOverall ? Number(formData.lengthOverall) : 0,
                totalPower: formData.totalPower ? Number(formData.totalPower) : 0,
                dimension1: formData.dimension1 ? Number(formData.dimension1) : 0,
                dimension2: formData.dimension2 ? Number(formData.dimension2) : 0,
            };

            if (formData.secondaryOccupationId1) strictPayload.secondaryOccupationId1 = formData.secondaryOccupationId1;
            if (formData.secondaryOccupationId2) strictPayload.secondaryOccupationId2 = formData.secondaryOccupationId2;
            if (formData.installationDate) {
                strictPayload.installationDate = parseDDMMYYYYToISO(formData.installationDate);
            }
            if (formData.miningLicenseNumber) strictPayload.miningLicenseNumber = formData.miningLicenseNumber;
            if (formData.expirationDateOfMiningLicenseNumber) {
                strictPayload.expirationDateOfMiningLicenseNumber = parseDDMMYYYYToISO(formData.expirationDateOfMiningLicenseNumber);
            }

            let fishingGear = formData.fishingGearSpecifications;
            if (!fishingGear || !fishingGear.trim()) {
                const mainOccName = occupationsList.find(o => o.id === formData.mainOccupationId)?.name;
                fishingGear = mainOccName ? `Nghề ${mainOccName}` : "-";
            }
            strictPayload.fishingGearSpecifications = fishingGear;


            // Lưu cache ngày sinh thuyền viên
            if (formData.crews) {
                const shipKey = ship?.id || formData.serial || '';
                formData.crews.forEach((c: ShipResponse["crews"][0], idx: number) => {
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

            // Dọn dẹp danh sách thuyền viên chuẩn theo UpdateCrewDto
            strictPayload.crews = ((formData.crews || []).map((c: ShipResponse["crews"][0]) => {
                const cleanedCrew: Record<string, string | undefined> = {
                    fullName: c.fullName || "",
                    citizenId: c.citizenId || "",
                    idcrewRole: c.idcrewRole || "00000000-0000-0000-0000-000000000000"
                };
                if (c.id || c.idcrew) cleanedCrew.idcrew = c.id || c.idcrew;
                if (c.phone) cleanedCrew.phone = c.phone;
                if (c.email) cleanedCrew.email = c.email;
                if (c.address) cleanedCrew.address = c.address;
                // KHÔNG GỬI birthDate hay dateOfBirth vì backend không có trường này trong UpdateCrewDto
                return cleanedCrew as unknown as ShipResponse["crews"][0];
            }));


            await onSubmit(strictPayload as ShipResponse);
            success(mode === 'create' ? 'Thêm mới tàu thành công!' : 'Cập nhật tàu thành công!');
            onClose();
        } catch (error) {
            const errorResponse = error as ServiceResponse;
            if (errorResponse.status === 400 && errorResponse.errors) {
                setFieldErrors(errorResponse.errors);
                const errorMessages = Object.entries(errorResponse.errors)
                    .map(([, msgs]) => msgs[0])
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
                title: `3. Kích thước chủ yếu của ngư cụ (${occ?.name || 'Nghề câu'})`,
                dim1Label: 'Chiều dài toàn bộ vàng câu (m)',
                dim1Placeholder: 'Nhập chiều dài vàng câu (m)',
                dim2Label: 'Số lưỡi câu (lưỡi)',
                dim2Placeholder: 'Nhập số lưỡi câu',
                notesLabel: 'Quy cách ngư cụ',
                notesPlaceholder: 'Nhập quy cách ngư cụ...'
            };
        }
        // Nghề lưới vây, rê: Chiều dài toàn bộ lưới (m); Chiều cao lưới (m)
        if (name.includes('vây') || name.includes('rê')) {
            return {
                title: `3. Kích thước chủ yếu của ngư cụ (${occ?.name || 'Lưới vây / Lưới rê'})`,
                dim1Label: 'Chiều dài toàn bộ lưới (m)',
                dim1Placeholder: 'Nhập chiều dài toàn bộ lưới (m)',
                dim2Label: 'Chiều cao lưới (m)',
                dim2Placeholder: 'Nhập chiều cao lưới (m)',
                notesLabel: 'Quy cách ngư cụ',
                notesPlaceholder: 'Nhập quy cách ngư cụ...'
            };
        }
        // Nghề lưới chụp: Chu vi miệng lưới (m); Chiều cao lưới (m)
        if (name.includes('chụp')) {
            return {
                title: `3. Kích thước chủ yếu của ngư cụ (${occ?.name || 'Lưới chụp'})`,
                dim1Label: 'Chu vi miệng lưới (m)',
                dim1Placeholder: 'Nhập chu vi miệng lưới (m)',
                dim2Label: 'Chiều cao lưới (m)',
                dim2Placeholder: 'Nhập chiều cao lưới (m)',
                notesLabel: 'Quy cách ngư cụ',
                notesPlaceholder: 'Nhập quy cách ngư cụ...'
            };
        }
        // Nghề lưới kéo (hoặc cào): Chiều dài giềng phao (m); Chiều dài toàn bộ lưới (m)
        if (name.includes('kéo') || name.includes('cào')) {
            return {
                title: `3. Kích thước chủ yếu của ngư cụ (${occ?.name || 'Lưới kéo'})`,
                dim1Label: 'Chiều dài giềng phao (m)',
                dim1Placeholder: 'Nhập chiều dài giềng phao (m)',
                dim2Label: 'Chiều dài toàn bộ lưới (m)',
                dim2Placeholder: 'Nhập chiều dài toàn bộ lưới (m)',
                notesLabel: 'Quy cách ngư cụ',
                notesPlaceholder: 'Nhập quy cách ngư cụ...'
            };
        }
        // Nghề khác / Mặc định
        return {
            title: occ?.name ? `3. Kích thước chủ yếu của ngư cụ (${occ.name})` : '3. Kích thước chủ yếu của ngư cụ (theo Mục 8 NKKT)',
            dim1Label: 'Kích thước 1 (Chiều dài / Chu vi / Giềng phao...)',
            dim1Placeholder: 'Nhập kích thước 1',
            dim2Label: 'Kích thước 2 (Chiều cao / Số lưỡi / Chiều dài...)',
            dim2Placeholder: 'Nhập kích thước 2',
            notesLabel: 'Quy cách ngư cụ',
            notesPlaceholder: 'Nhập quy cách ngư cụ...'
        };
    };

    const gearConfig = getGearConfig(formData.mainOccupationId);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{maxWidth: '1320px', width: '95vw'}}
                 onClick={e => e.stopPropagation()}>
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

                <form onSubmit={handleSubmit}>
                    <div className="modal-body flex flex-col" style={{
                        position: 'relative',
                        maxHeight: '72vh',
                        overflowY: 'auto',
                        padding: '16px 20px',
                        backgroundColor: '#f8fafc'
                    }}>
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

                        {/* 1. Thông tin Chung */}
                        <div style={sectionBoxStyle}>
                            <div style={sectionTitleStyle}>
                                <span>1. Thông tin Tàu & Chủ tàu</span>
                                {!isReadOnly && formData.idshipOwner && (
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        style={{padding: '3px 10px', fontSize: '12px'}}
                                        onClick={async () => {
                                            const owner = owners.find(o => o.id === formData.idshipOwner);
                                            if (owner) {
                                                try {
                                                    const ownerDetail = await shipOwnerDetailAPI(owner.id);
                                                    const captainRole = crewRolesList.find(r =>
                                                        (r.code && r.code.toUpperCase() === 'CAPTAIN') ||
                                                        (r.description && r.description.toLowerCase().includes('thuyền trưởng'))
                                                    );
                                                    const dob = formatToDDMMYYYY(ownerDetail.birthDate || owner.birthDate);
                                                    const newCrew = {
                                                        fullName: ownerDetail.fullName || owner.fullName,
                                                        citizenId: ownerDetail.citizenId || owner.citizenId,
                                                        birthDate: dob,
                                                        phone: ownerDetail.phone || (owner as {
                                                            BirthDate?: string,
                                                            phone?: string,
                                                            Phone?: string,
                                                            email?: string,
                                                            Email?: string
                                                        }).phone || '',
                                                        email: ownerDetail.email || (owner as {
                                                            BirthDate?: string,
                                                            phone?: string,
                                                            Phone?: string,
                                                            email?: string,
                                                            Email?: string
                                                        }).email || '',
                                                        idcrewRole: captainRole ? captainRole.id : ''
                                                    };
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        crews: [...(prev.crews || []), newCrew]
                                                    }));
                                                    success('Đã thêm chủ tàu vào danh sách thuyền viên với vai trò Thuyền trưởng');
                                                } catch {
                                                    showError('Không thể lấy chi tiết chủ tàu. Vui lòng thử lại!');
                                                }
                                            }
                                        }}
                                    >
                                        + Đặt làm Thuyền trưởng
                                    </button>
                                )}
                            </div>

                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px'}}>
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
                                        <Select
                                            placeholder="-- Chọn chủ tàu --"
                                            value={owners.filter(o => o.id === formData.idshipOwner).map(o => ({
                                                value: o.id,
                                                label: `${o.fullName} - ${o.citizenId}`
                                            }))[0] || null}
                                            options={owners.map(o => ({
                                                value: o.id,
                                                label: `${o.fullName} - ${o.citizenId}`
                                            }))}
                                            onChange={(selected: { value: string, label: string } | null) => {
                                                setFormData({...formData, idshipOwner: selected ? selected.value : ''});
                                            }}
                                            isClearable
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    minHeight: '42px',
                                                    borderRadius: '8px',
                                                    borderColor: getError('idshipOwner') ? 'var(--error-color)' : '#cbd5e1',
                                                    boxShadow: 'none',
                                                    '&:hover': {
                                                        borderColor: '#94a3b8'
                                                    }
                                                }),
                                                menu: (base) => ({
                                                    ...base,
                                                    zIndex: 9999
                                                })
                                            }}
                                            noOptionsMessage={() => "Không tìm thấy kết quả"}
                                        />
                                    )}
                                    {getError('idshipOwner') && <span style={{
                                        color: 'var(--error-color)',
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        display: 'block'
                                    }}>{getError('idshipOwner')}</span>}
                                </div>
                                <div>
                                    <label style={labelStyle}>Tên tàu / Biển số (*)</label>
                                    <input
                                        name="name"
                                        placeholder="VD: BV-92345-TS"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                                        className="input"
                                        required
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? readOnlyStyle : {
                                            ...controlStyle,
                                            borderColor: getError('name') ? 'var(--error-color)' : '#cbd5e1'
                                        }}
                                    />
                                    {getError('name') && (
                                        <span style={{
                                            color: 'var(--error-color)',
                                            fontSize: '12px',
                                            marginTop: '4px',
                                            display: 'block'
                                        }}>
                                            {getError('name')}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <label style={labelStyle}>Serial thiết bị định vị (*)</label>
                                    <input
                                        name="serial"
                                        placeholder="VD: 864521039871"
                                        value={formData.serial || ''}
                                        onChange={(e) => setFormData(prev => ({...prev, serial: e.target.value}))}
                                        className="input"
                                        required
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? readOnlyStyle : {
                                            ...controlStyle,
                                            borderColor: getError('serial') ? 'var(--error-color)' : '#cbd5e1'
                                        }}
                                    />
                                    {getError('serial') && (
                                        <span style={{
                                            color: 'var(--error-color)',
                                            fontSize: '12px',
                                            marginTop: '4px',
                                            display: 'block'
                                        }}>
                                            {getError('serial')}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <label style={labelStyle}>Ngày lắp đặt</label>
                                    <input
                                        type="text"
                                        name="installationDate"
                                        placeholder="dd/MM/yyyy"
                                        maxLength={10}
                                        value={formData.installationDate || ''}
                                        onChange={(e) => {
                                            const prev = formData.installationDate || '';
                                            const next = handleDateChange(e.target.value, prev);
                                            setFormData({...formData, installationDate: next});
                                        }}
                                        onBlur={(e) => {
                                            const normalized = normalizeDateOnBlur(e.target.value);
                                            setFormData({...formData, installationDate: normalized});
                                        }}
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
                                    <label style={{...labelStyle, whiteSpace: 'nowrap'}}>Tổng công suất máy chính
                                        (kW)</label>
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

                        {/* 2. Giấy phép & Nghề nghiệp */}
                        <div style={sectionBoxStyle}>
                            <div style={sectionTitleStyle}>
                                <span>2. Giấy phép khai thác & Nghề nghiệp</span>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1.1fr 0.95fr 1.45fr 1.25fr 1.25fr',
                                gap: '16px'
                            }}>
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
                                            setFormData({...formData, expirationDateOfMiningLicenseNumber: next});
                                        }}
                                        onBlur={(e) => {
                                            const normalized = normalizeDateOnBlur(e.target.value);
                                            setFormData({...formData, expirationDateOfMiningLicenseNumber: normalized});
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
                                        <Select
                                            placeholder="-- Chọn nghề chính --"
                                            value={occupationsList.filter(o => o.id === formData.mainOccupationId).map(o => ({
                                                value: o.id,
                                                label: o.name || o.code
                                            }))[0] || null}
                                            options={occupationsList.map(o => ({value: o.id, label: o.name || o.code}))}
                                            onChange={(selected: { value: string, label: string } | null) => {
                                                const newOccId = selected ? selected.value : '';
                                                const spec = getAutoSpec(formData.dimension1, formData.dimension2, newOccId);
                                                setFormData({
                                                    ...formData,
                                                    mainOccupationId: newOccId,
                                                    ...(spec ? {fishingGearSpecifications: spec} : {})
                                                });
                                            }}
                                            isClearable
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    minHeight: '42px',
                                                    borderRadius: '8px',
                                                    borderColor: getError('mainOccupationId') ? 'var(--error-color)' : '#cbd5e1',
                                                    boxShadow: 'none',
                                                    '&:hover': {
                                                        borderColor: '#94a3b8'
                                                    }
                                                }),
                                                menu: (base) => ({
                                                    ...base,
                                                    zIndex: 9999
                                                })
                                            }}
                                            noOptionsMessage={() => "Không tìm thấy kết quả"}
                                        />
                                    )}
                                    {getError('mainOccupationId') && <span style={{
                                        color: 'var(--error-color)',
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        display: 'block'
                                    }}>{getError('mainOccupationId')}</span>}
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
                                        <Select
                                            placeholder="-- Chọn nghề phụ 1 --"
                                            value={occupationsList.filter(o => o.id === formData.secondaryOccupationId1).map(o => ({
                                                value: o.id,
                                                label: o.name || o.code
                                            }))[0] || null}
                                            options={occupationsList.map(o => ({value: o.id, label: o.name || o.code}))}
                                            onChange={(selected: { value: string, label: string } | null) => {
                                                setFormData({
                                                    ...formData,
                                                    secondaryOccupationId1: selected ? selected.value : ''
                                                });
                                            }}
                                            isClearable
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    minHeight: '42px',
                                                    borderRadius: '8px',
                                                    borderColor: '#cbd5e1',
                                                    boxShadow: 'none',
                                                    '&:hover': {
                                                        borderColor: '#94a3b8'
                                                    }
                                                }),
                                                menu: (base) => ({
                                                    ...base,
                                                    zIndex: 9999
                                                })
                                            }}
                                            noOptionsMessage={() => "Không tìm thấy kết quả"}
                                        />
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
                                        <Select
                                            placeholder="-- Chọn nghề phụ 2 --"
                                            value={occupationsList.filter(o => o.id === formData.secondaryOccupationId2).map(o => ({
                                                value: o.id,
                                                label: o.name || o.code
                                            }))[0] || null}
                                            options={occupationsList.map(o => ({value: o.id, label: o.name || o.code}))}
                                            onChange={(selected: { value: string, label: string } | null) => {
                                                setFormData({
                                                    ...formData,
                                                    secondaryOccupationId2: selected ? selected.value : ''
                                                });
                                            }}
                                            isClearable
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    minHeight: '42px',
                                                    borderRadius: '8px',
                                                    borderColor: '#cbd5e1',
                                                    boxShadow: 'none',
                                                    '&:hover': {
                                                        borderColor: '#94a3b8'
                                                    }
                                                }),
                                                menu: (base) => ({
                                                    ...base,
                                                    zIndex: 9999
                                                })
                                            }}
                                            noOptionsMessage={() => "Không tìm thấy kết quả"}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 3. Kích thước chủ yếu của ngư cụ */}
                        <div style={sectionBoxStyle}>
                            <div style={sectionTitleStyle}>
                                <span>{gearConfig.title}</span>
                            </div>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 2.2fr', gap: '16px'}}>
                                <div>
                                    <label style={labelStyle}>{gearConfig.dim1Label} (*)</label>
                                    <input
                                        type="number"
                                        name="dimension1"
                                        placeholder={gearConfig.dim1Placeholder}
                                        value={formData.dimension1 ?? ''}
                                        onChange={handleChange}
                                        className="input"
                                        required
                                        min="0.0001"
                                        step="any"
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? readOnlyStyle : controlStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>{gearConfig.dim2Label} (*)</label>
                                    <input
                                        type="number"
                                        name="dimension2"
                                        placeholder={gearConfig.dim2Placeholder}
                                        value={formData.dimension2 ?? ''}
                                        onChange={handleChange}
                                        className="input"
                                        required
                                        min="0.0001"
                                        step="any"
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? readOnlyStyle : controlStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>{gearConfig.notesLabel} (*)</label>
                                    <input
                                        type="text"
                                        name="fishingGearSpecifications"
                                        placeholder={gearConfig.notesPlaceholder}
                                        value={formData.fishingGearSpecifications || ''}
                                        onChange={handleChange}
                                        className="input"
                                        required
                                        readOnly={isReadOnly}
                                        style={isReadOnly ? readOnlyStyle : controlStyle}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 5. Danh sách thuyền viên */}
                        <div style={sectionBoxStyle}>
                            <div style={sectionTitleStyle}>
                                <span>4. Danh sách thuyền viên (Thuyền trưởng & Thuyền viên)</span>
                                {!isReadOnly && (
                                    <button type="button" className="btn btn-primary flex items-center gap-xs"
                                            onClick={handleAddCrew} style={{padding: '4px 10px', fontSize: '13px'}}>
                                        <Plus size={14}/> Thêm thuyền viên
                                    </button>
                                )}
                            </div>

                            {formData.crews && formData.crews.length > 0 ? (
                                <div style={{overflowX: 'auto', borderRadius: '6px', border: '1px solid #e2e8f0'}}>
                                    <table className="table"
                                           style={{width: '100%', borderCollapse: 'collapse', margin: 0}}>
                                        <thead>
                                        <tr style={{backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0'}}>
                                            <th style={{
                                                width: '45px',
                                                textAlign: 'center',
                                                padding: '10px 8px',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                color: '#475569'
                                            }}>STT
                                            </th>
                                            <th style={{
                                                width: '23%',
                                                minWidth: '190px',
                                                padding: '10px 10px',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                color: '#475569'
                                            }}>Họ tên (*)
                                            </th>
                                            <th style={{
                                                width: '16%',
                                                minWidth: '140px',
                                                padding: '10px 10px',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                color: '#475569'
                                            }}>CCCD
                                            </th>
                                            <th style={{
                                                width: '15%',
                                                minWidth: '140px',
                                                padding: '10px 10px',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                color: '#475569'
                                            }}>Ngày sinh
                                            </th>
                                            <th style={{
                                                width: '18%',
                                                minWidth: '170px',
                                                padding: '10px 10px',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                color: '#475569'
                                            }}>Số điện thoại
                                            </th>
                                            <th style={{
                                                width: '21%',
                                                minWidth: '180px',
                                                padding: '10px 10px',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                color: '#475569'
                                            }}>Vai trò
                                            </th>
                                            {!isReadOnly && <th style={{
                                                width: '55px',
                                                textAlign: 'center',
                                                padding: '10px 8px',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                color: '#475569'
                                            }}>Xóa</th>}
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {formData.crews.map((member: ShipResponse["crews"][0], idx: number) => (
                                            <tr key={idx} style={{borderBottom: '1px solid #f1f5f9'}}>
                                                <td style={{
                                                    textAlign: 'center',
                                                    padding: '8px 8px',
                                                    fontSize: '13px',
                                                    color: '#64748b'
                                                }}>{idx + 1}</td>
                                                <td style={{padding: '8px 10px'}}>
                                                    {isReadOnly ? (
                                                        <span style={{
                                                            fontWeight: 500,
                                                            fontSize: '13.5px',
                                                            color: '#1e293b'
                                                        }}>{member.fullName || '-'}</span>
                                                    ) : (
                                                        <input
                                                            className="input"
                                                            style={{
                                                                ...controlStyle,
                                                                height: '36px',
                                                                padding: '0.35rem 0.65rem',
                                                                fontSize: '13.5px'
                                                            }}
                                                            value={member.fullName || ''}
                                                            onChange={e => handleUpdateCrew(idx, 'fullName', e.target.value)}
                                                            placeholder="Họ và tên"
                                                            required
                                                        />
                                                    )}
                                                </td>
                                                <td style={{padding: '8px 10px'}}>
                                                    {isReadOnly ? (
                                                        <span style={{
                                                            fontSize: '13.5px',
                                                            color: '#334155'
                                                        }}>{member.citizenId || '-'}</span>
                                                    ) : (
                                                        <input
                                                            className="input"
                                                            style={{
                                                                ...controlStyle,
                                                                height: '36px',
                                                                padding: '0.35rem 0.65rem',
                                                                fontSize: '13.5px'
                                                            }}
                                                            value={member.citizenId || ''}
                                                            onChange={e => {
                                                                const newCid = e.target.value;
                                                                handleUpdateCrew(idx, 'citizenId', newCid);
                                                                if (!member.birthDate && newCid.trim()) {
                                                                    const autoDob = getCrewBirthDate({citizenId: newCid.trim()});
                                                                    if (autoDob) {
                                                                        handleUpdateCrew(idx, 'birthDate', autoDob);
                                                                    }
                                                                }
                                                            }}
                                                            placeholder="Số CCCD"
                                                        />
                                                    )}
                                                </td>
                                                <td style={{padding: '8px 10px'}}>
                                                    {isReadOnly ? (
                                                        <span style={{
                                                            fontSize: '13.5px',
                                                            color: '#334155'
                                                        }}>{formatToDDMMYYYY(member.birthDate) || '-'}</span>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            placeholder="dd/MM/yyyy"
                                                            maxLength={10}
                                                            className="input"
                                                            style={{
                                                                ...controlStyle,
                                                                height: '36px',
                                                                padding: '0.35rem 0.65rem',
                                                                fontSize: '13.5px'
                                                            }}
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
                                                <td style={{padding: '8px 10px'}}>
                                                    {isReadOnly ? (
                                                        <span style={{
                                                            fontSize: '13.5px',
                                                            color: '#334155'
                                                        }}>{member.phone || '-'}</span>
                                                    ) : (
                                                        <input
                                                            className="input"
                                                            style={{
                                                                ...controlStyle,
                                                                height: '36px',
                                                                padding: '0.35rem 0.65rem',
                                                                fontSize: '13.5px'
                                                            }}
                                                            value={member.phone || ''}
                                                            onChange={e => handleUpdateCrew(idx, 'phone', e.target.value)}
                                                            placeholder="Số điện thoại"
                                                        />
                                                    )}
                                                </td>
                                                <td style={{padding: '8px 10px'}}>
                                                    {isReadOnly ? (
                                                        <span style={{fontSize: '13.5px', color: '#334155'}}>
                                                                {crewRolesList.find(r => r.id === member.idcrewRole)?.description || crewRolesList.find(r => r.id === member.idcrewRole)?.code || '-'}
                                                            </span>
                                                    ) : (
                                                        <Select
                                                            placeholder="-- Chọn vai trò --"
                                                            value={crewRolesList.filter(r => r.id === member.idcrewRole).map(r => ({
                                                                value: r.id,
                                                                label: r.description || r.code
                                                            }))[0] || null}
                                                            options={crewRolesList.map(r => ({
                                                                value: r.id,
                                                                label: r.description || r.code
                                                            }))}
                                                            onChange={(selected: {
                                                                value: string,
                                                                label: string
                                                            } | null) => handleUpdateCrew(idx, 'idcrewRole', selected ? selected.value : '')}
                                                            isClearable
                                                            styles={{
                                                                control: (base) => ({
                                                                    ...base,
                                                                    minHeight: '36px',
                                                                    height: '36px',
                                                                    borderRadius: '4px',
                                                                    borderColor: '#cbd5e1',
                                                                    boxShadow: 'none',
                                                                    fontSize: '13.5px',
                                                                    '&:hover': {
                                                                        borderColor: '#94a3b8'
                                                                    }
                                                                }),
                                                                menu: (base) => ({
                                                                    ...base,
                                                                    zIndex: 9999,
                                                                    fontSize: '13.5px'
                                                                })
                                                            }}
                                                            noOptionsMessage={() => "Không tìm thấy kết quả"}
                                                        />
                                                    )}
                                                </td>
                                                {!isReadOnly && (
                                                    <td style={{textAlign: 'center', padding: '8px 8px'}}>
                                                        <button
                                                            type="button"
                                                            className="btn btn-text"
                                                            style={{
                                                                color: 'var(--error-color)',
                                                                padding: '4px',
                                                                borderRadius: '4px'
                                                            }}
                                                            onClick={() => handleRemoveCrew(idx)}
                                                            title="Xóa thuyền viên"
                                                        >
                                                            <Trash2 size={16}/>
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{
                                    padding: '20px',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '6px',
                                    border: '1px dashed #cbd5e1',
                                    color: 'var(--text-muted)',
                                    fontSize: '13.5px',
                                    textAlign: 'center'
                                }}>
                                    Chưa có thông tin thuyền viên. Nhấn <strong>"Thêm thuyền
                                    viên"</strong> hoặc <strong>"+ Đặt làm Thuyền trưởng"</strong> ở Mục 1 để thêm.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer"
                         style={{marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px'}}>
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
