const fs = require('fs');

let code = fs.readFileSync('src/pages/ships/ShipModal.tsx', 'utf-8');

// The new JSX block for sections 1, 2, 3, 4
const newSections = `                        {/* 1. Thông tin Chủ tàu */}
                        <div>
                            <h4 style={{ marginBottom: '12px', borderBottom: '2px solid var(--border-color)', paddingBottom: '4px', color: 'var(--primary-color)' }}>1. Thông tin Chủ tàu</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Họ và tên chủ tàu (*)</label>
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
                                            required
                                        >
                                            <option value="">-- Chọn chủ tàu --</option>
                                            {owners.map(owner => (
                                                <option key={owner.id} value={owner.id}>{owner.fullName} - {owner.citizenId}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Số định danh cá nhân (CCCD)</label>
                                    <input 
                                        value={owners.find(o => o.id === formData.idshipOwner)?.citizenId || ''} 
                                        className="input" 
                                        readOnly
                                        style={{ backgroundColor: '#f1f5f9' }}
                                    />
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Ngày tháng năm sinh</label>
                                    <input 
                                        value={owners.find(o => o.id === formData.idshipOwner)?.birthDate?.substring(0, 10) || ''} 
                                        className="input" 
                                        type="date"
                                        readOnly
                                        style={{ backgroundColor: '#f1f5f9' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Thông tin Tàu */}
                        <div>
                            <h4 style={{ marginBottom: '12px', borderBottom: '2px solid var(--border-color)', paddingBottom: '4px', color: 'var(--primary-color)' }}>2. Thông tin Tàu & Thông số kỹ thuật</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Số đăng ký tàu (*)</label>
                                    <input 
                                        name="serial"
                                        value={formData.serial || ''} 
                                        onChange={handleChange}
                                        className="input" 
                                        required
                                        readOnly={isReadOnly}
                                        style={{ backgroundColor: isReadOnly ? '#f1f5f9' : 'white', borderColor: getError('serial') ? 'var(--error-color)' : undefined }}
                                    />
                                    {getError('serial') && <span style={{ color: 'var(--error-color)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{getError('serial')}</span>}
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Tên tàu (*)</label>
                                    <input 
                                        name="name"
                                        value={formData.name || ''} 
                                        onChange={handleChange}
                                        className={\`input \${getError('name') ? 'border-red-500' : ''}\`}
                                        required
                                        readOnly={isReadOnly}
                                        style={{ backgroundColor: isReadOnly ? '#f1f5f9' : 'white', borderColor: getError('name') ? 'var(--error-color)' : undefined }}
                                    />
                                    {getError('name') && <span style={{ color: 'var(--error-color)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{getError('name')}</span>}
                                </div>
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
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Tổng công suất máy chính (kW)</label>
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
                            </div>
                        </div>

                        {/* 3. Giấy phép & Nghề nghiệp */}
                        <div>
                            <h4 style={{ marginBottom: '12px', borderBottom: '2px solid var(--border-color)', paddingBottom: '4px', color: 'var(--primary-color)' }}>3. Giấy phép khai thác & Nghề nghiệp</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Số GPKT thủy sản</label>
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
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Thời hạn đến</label>
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

                        {/* 4. Kích thước chủ yếu của ngư cụ */}
                        <div>
                            <h4 style={{ marginBottom: '12px', borderBottom: '2px solid var(--border-color)', paddingBottom: '4px', color: 'var(--primary-color)' }}>4. Kích thước chủ yếu của ngư cụ</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Kích thước 1 (Chiều dài/Chu vi...)</label>
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
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Kích thước 2 (Chiều cao/Số lưỡi...)</label>
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
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Ghi chú quy cách khác</label>
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
                        </div>`;

const startTag = "{/* 1. Thông tin chung */}";
const endTag = "{/* 5. Danh sách thuyền viên */}";

const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
    const originalSection = code.substring(startIndex, endIndex);
    code = code.replace(originalSection, newSections + '\n\n                        ');
}

// Modify Thuyền viên heading to 5. and add note
code = code.replace(
    `<h4 style={{ color: 'var(--primary-color)', margin: 0 }}>Danh sách thuyền viên</h4>`,
    `<h4 style={{ color: 'var(--primary-color)', margin: 0 }}>5. Danh sách thuyền viên (Thuyền trưởng & Thuyền viên)</h4>`
);

fs.writeFileSync('src/pages/ships/ShipModal.tsx', code);
console.log("Updated ShipModal.tsx");
