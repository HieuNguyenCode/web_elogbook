const fs = require('fs');

// 1. Cập nhật OwnerModal.tsx (Bỏ email)
let ownerModalCode = fs.readFileSync('src/pages/owners/OwnerModal.tsx', 'utf-8');
// Remove email div
const emailDivRegex = /<div>\s*<label[^>]*>Email<\/label>\s*<input[^>]*name="email"[^>]*\/>\s*\{getError\('email'\)[^}]*\}\s*<\/div>/g;
ownerModalCode = ownerModalCode.replace(emailDivRegex, '');
fs.writeFileSync('src/pages/owners/OwnerModal.tsx', ownerModalCode);
console.log('Updated OwnerModal.tsx');

// 2. Cập nhật Ship.ts (Thêm deviceSerial)
let shipTsCode = fs.readFileSync('src/types/Ship.ts', 'utf-8');
if (!shipTsCode.includes('deviceSerial')) {
    shipTsCode = shipTsCode.replace('serial: string;', 'serial: string;\n    deviceSerial?: string;');
    fs.writeFileSync('src/types/Ship.ts', shipTsCode);
}
console.log('Updated Ship.ts');

// 3. Cập nhật ShipModal.tsx
let shipModalCode = fs.readFileSync('src/pages/ships/ShipModal.tsx', 'utf-8');

// Add "Thêm làm thuyền trưởng" logic and update owner handling
// First, we need to find the place to insert the button and update the DOB input.

// Let's replace the entire "1. Thông tin Chủ tàu" block with a new one that includes the button and state handling.
const block1Regex = /\{\/\* 1\. Thông tin Chủ tàu \*\/\}.*?\{\/\* 2\. Thông tin Tàu \*\/\}/s;

const newBlock1 = `{/* 1. Thông tin Chủ tàu */}
                        <div>
                            <div className="flex justify-between items-center mb-xs" style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '4px' }}>
                                <h4 style={{ margin: 0, color: 'var(--primary-color)' }}>1. Thông tin Chủ tàu</h4>
                                {!isReadOnly && formData.idshipOwner && (
                                    <button 
                                        type="button" 
                                        className="btn btn-primary" 
                                        style={{ padding: '2px 8px', fontSize: '12px' }}
                                        onClick={() => {
                                            const owner = owners.find(o => o.id === formData.idshipOwner);
                                            if (owner) {
                                                const captainRole = crewRolesList.find(r => 
                                                    (r.code && r.code.toUpperCase() === 'CAPTAIN') || 
                                                    (r.description && r.description.toLowerCase().includes('thuyền trưởng'))
                                                );
                                                const newCrew = {
                                                    fullName: owner.fullName,
                                                    citizenId: owner.citizenId,
                                                    birthDate: owner.birthDate,
                                                    phone: (owner as any).phone || '',
                                                    email: (owner as any).email || '',
                                                    idcrewRole: captainRole ? captainRole.id : ''
                                                };
                                                setFormData(prev => ({ ...prev, crews: [...(prev.crews || []), newCrew] }));
                                                success('Đã thêm chủ tàu vào danh sách thuyền viên với vai trò Thuyền trưởng');
                                            }
                                        }}
                                    >
                                        + Đặt làm Thuyền trưởng
                                    </button>
                                )}
                            </div>
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
                                        onChange={(e) => {
                                            const newOwners = [...owners];
                                            const idx = newOwners.findIndex(o => o.id === formData.idshipOwner);
                                            if (idx >= 0) {
                                                newOwners[idx].citizenId = e.target.value;
                                                setOwners(newOwners);
                                            }
                                        }}
                                        readOnly={isReadOnly || !formData.idshipOwner}
                                        style={{ backgroundColor: (isReadOnly || !formData.idshipOwner) ? '#f1f5f9' : 'white' }}
                                    />
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Ngày tháng năm sinh</label>
                                    <input 
                                        value={owners.find(o => o.id === formData.idshipOwner)?.birthDate?.substring(0, 10) || ''} 
                                        className="input" 
                                        type="date"
                                        onChange={(e) => {
                                            const newOwners = [...owners];
                                            const idx = newOwners.findIndex(o => o.id === formData.idshipOwner);
                                            if (idx >= 0) {
                                                newOwners[idx].birthDate = e.target.value;
                                                setOwners(newOwners);
                                            }
                                        }}
                                        readOnly={isReadOnly || !formData.idshipOwner}
                                        style={{ backgroundColor: (isReadOnly || !formData.idshipOwner) ? '#f1f5f9' : 'white' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Thông tin Tàu */}`;

shipModalCode = shipModalCode.replace(block1Regex, newBlock1);

// Add deviceSerial field to block 2
const block2Regex = /<div>\s*<label[^>]*>Số đăng ký tàu \(\*\)<\/label>.*?<\/div>/s;
const newBlock2Field = `<div>
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
                                    <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Số Serial thiết bị</label>
                                    <input 
                                        name="deviceSerial"
                                        value={formData.deviceSerial || ''} 
                                        onChange={handleChange}
                                        className="input" 
                                        readOnly={isReadOnly}
                                        style={{ backgroundColor: isReadOnly ? '#f1f5f9' : 'white' }}
                                    />
                                </div>`;

shipModalCode = shipModalCode.replace(block2Regex, newBlock2Field);

// Fix grid template columns for block 2 to accommodate the new field (from 4 to 5)
shipModalCode = shipModalCode.replace(
    `{/* 2. Thông tin Tàu */}
                        <div>
                            <h4 style={{ marginBottom: '12px', borderBottom: '2px solid var(--border-color)', paddingBottom: '4px', color: 'var(--primary-color)' }}>2. Thông tin Tàu & Thông số kỹ thuật</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>`,
    `{/* 2. Thông tin Tàu */}
                        <div>
                            <h4 style={{ marginBottom: '12px', borderBottom: '2px solid var(--border-color)', paddingBottom: '4px', color: 'var(--primary-color)' }}>2. Thông tin Tàu & Thông số kỹ thuật</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '16px' }}>`
);


fs.writeFileSync('src/pages/ships/ShipModal.tsx', shipModalCode);
console.log('Updated ShipModal.tsx');
