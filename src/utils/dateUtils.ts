/**
 * Utility functions for handling dd/MM/yyyy date formats and caching owner birth dates.
 */

// Chuyển đổi từ ISO (yyyy-MM-dd / yyyy-MM-ddTHH:mm:ss) hoặc chuỗi bất kỳ sang định dạng dd/MM/yyyy
export const formatToDDMMYYYY = (val?: string | null): string => {
    if (!val) return '';
    const trimmed = val.trim();
    if (!trimmed) return '';

    // Nếu đã ở dạng dd/MM/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
        return trimmed;
    }

    // Nếu ở dạng yyyy-MM-dd...
    if (trimmed.includes('-')) {
        const parts = trimmed.split('T')[0].split('-');
        if (parts.length === 3) {
            const year = parts[0];
            const month = parts[1].padStart(2, '0');
            const day = parts[2].padStart(2, '0');
            if (year.length === 4) {
                return `${day}/${month}/${year}`;
            }
        }
    }

    // Thử parse Date
    try {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        }
    } catch {
        // ignore
    }

    return trimmed;
};

// Chuyển đổi từ dd/MM/yyyy sang yyyy-MM-dd cho API
export const parseDDMMYYYYToISO = (val?: string | null): string | undefined => {
    if (!val) return undefined;
    const trimmed = val.trim();
    if (!trimmed) return undefined;

    // Nếu dạng dd/MM/yyyy
    if (trimmed.includes('/')) {
        const parts = trimmed.split('/');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            if (year.length === 4) {
                return `${year}-${month}-${day}`;
            }
        }
    }

    // Nếu đã là yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        return trimmed.split('T')[0];
    }

    return trimmed;
};

// Xử lý khi người dùng gõ vào ô text: cho phép gõ số và dấu '/', tự động thêm '/' khi gõ xong ngày (2 số) và tháng (2 số)
export const handleDateChange = (inputVal: string, prevVal: string = ''): string => {
    // Nếu người dùng đang xóa (độ dài giảm), cho phép xóa tự do không ép format
    if (inputVal.length < prevVal.length) {
        return inputVal;
    }

    // Chỉ giữ số và dấu '/'
    let clean = inputVal.replace(/[^0-9/]/g, '').slice(0, 10);
    
    // Tự động chèn '/' nếu gõ liên tục không có dấu '/'
    if (/^\d{2}$/.test(clean)) {
        clean = clean + '/';
    } else if (/^\d{2}\/\d{2}$/.test(clean)) {
        clean = clean + '/';
    } else if (/^\d{8}$/.test(clean)) {
        clean = `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
    }
    
    return clean;
};

// Chuẩn hóa khi người dùng rời ô (onBlur)
export const normalizeDateOnBlur = (val?: string | null): string => {
    if (!val) return '';
    const trimmed = val.trim();
    if (!trimmed) return '';

    // Nếu gõ dạng 8 chữ số: 15081990 -> 15/08/1990
    if (/^\d{8}$/.test(trimmed)) {
        return `${trimmed.slice(0, 2)}/${trimmed.slice(2, 4)}/${trimmed.slice(4, 8)}`;
    }

    // Nếu gõ dạng d/m/yyyy hoặc d-m-yyyy -> chuẩn hóa thêm số 0
    const parts = trimmed.split(/[/.-]/);
    if (parts.length === 3) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2];
        if (d.length === 2 && m.length === 2 && y.length === 4) {
            return `${d}/${m}/${y}`;
        }
    }

    return trimmed;
};

// Giữ lại alias để tương thích ngược nếu còn nơi nào gọi
export const maskDDMMYYYY = (inputVal: string): string => {
    return handleDateChange(inputVal, '');
};

// Helper lưu cache Ngày sinh của Chủ tàu vào localStorage để không bao giờ bị mất
export const saveOwnerBirthDate = (_ownerId?: string | null, _citizenId?: string | null, birthDate?: string | null) => {
    if (!birthDate) return;
    const clean = formatToDDMMYYYY(birthDate);
    if (!clean) return;

};

// Helper lấy Ngày sinh của Chủ tàu từ API hoặc localStorage cache
export const getOwnerBirthDate = (ownerId?: string | null, citizenId?: string | null, apiBirthDate?: string | null): string => {
    if (apiBirthDate && apiBirthDate.trim()) {
        const formatted = formatToDDMMYYYY(apiBirthDate);
        if (formatted) {
            // Cập nhật lại cache luôn
            saveOwnerBirthDate(ownerId, citizenId, formatted);
            return formatted;
        }
    }
    return '';
};

export interface CrewCacheIdentifier {
    id?: string | null;
    citizenId?: string | null;
    fullName?: string | null;
    shipIdentifier?: string | null;
    index?: number;
}

// Helper lưu cache Ngày sinh của Thuyền viên vào localStorage để không bị mất
export const saveCrewBirthDate = (identifier: CrewCacheIdentifier, birthDate?: string | null) => {
    if (!birthDate) return;
    const clean = formatToDDMMYYYY(birthDate);
    if (!clean) return;

    if (identifier.citizenId && identifier.citizenId.trim()) {
        const cid = identifier.citizenId.trim();
        localStorage.setItem(`crew_dob_cid_${cid}`, clean);
    }
    if (identifier.id && identifier.id.trim()) {
        localStorage.setItem(`crew_dob_id_${identifier.id.trim()}`, clean);
    }
    if (identifier.fullName && identifier.fullName.trim()) {
        const name = identifier.fullName.trim();
        localStorage.setItem(`crew_dob_name_${name}`, clean);
        if (identifier.shipIdentifier) {
            localStorage.setItem(`crew_dob_ship_${identifier.shipIdentifier}_name_${name}`, clean);
        }
    }
    if (identifier.shipIdentifier && identifier.index !== undefined) {
        localStorage.setItem(`crew_dob_ship_${identifier.shipIdentifier}_idx_${identifier.index}`, clean);
    }
};

// Helper lấy Ngày sinh của Thuyền viên từ API hoặc localStorage cache
export const getCrewBirthDate = (identifier: CrewCacheIdentifier, apiBirthDate?: any): string => {
    // 1. Kiểm tra nếu API có trả về giá trị hợp lệ
    const rawVal = typeof apiBirthDate === 'string' 
        ? apiBirthDate 
        : (apiBirthDate?.birthDate || apiBirthDate?.dateOfBirth || apiBirthDate?.dob || apiBirthDate?.birthday || apiBirthDate?.BirthDate || apiBirthDate?.DateOfBirth);
        
    if (rawVal && typeof rawVal === 'string' && rawVal.trim()) {
        const formatted = formatToDDMMYYYY(rawVal);
        if (formatted) {
            saveCrewBirthDate(identifier, formatted);
            return formatted;
        }
    }

    // 2. Tìm theo CCCD
    if (identifier.citizenId && identifier.citizenId.trim()) {
        const cid = identifier.citizenId.trim();
        const cachedCid = localStorage.getItem(`crew_dob_cid_${cid}`) ;
        if (cachedCid) return cachedCid;
    }

    // 3. Tìm theo Crew ID
    if (identifier.id && identifier.id.trim()) {
        const cachedId = localStorage.getItem(`crew_dob_id_${identifier.id.trim()}`);
        if (cachedId) return cachedId;
    }

    // 4. Tìm theo Ship + Tên thuyền viên
    if (identifier.shipIdentifier && identifier.fullName && identifier.fullName.trim()) {
        const cachedShipName = localStorage.getItem(`crew_dob_ship_${identifier.shipIdentifier}_name_${identifier.fullName.trim()}`);
        if (cachedShipName) return cachedShipName;
    }

    // 5. Tìm theo Ship + Vị trí (index)
    if (identifier.shipIdentifier && identifier.index !== undefined) {
        const cachedIdx = localStorage.getItem(`crew_dob_ship_${identifier.shipIdentifier}_idx_${identifier.index}`);
        if (cachedIdx) return cachedIdx;
    }

    // 6. Tìm theo Tên thuyền viên chung
    if (identifier.fullName && identifier.fullName.trim()) {
        const cachedName = localStorage.getItem(`crew_dob_name_${identifier.fullName.trim()}`);
        if (cachedName) return cachedName;
    }

    return '';
};
