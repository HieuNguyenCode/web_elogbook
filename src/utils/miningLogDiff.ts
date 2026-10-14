import type { MiningLogDto } from '../types/MiningLog';

export interface FieldDiff {
    key: string;
    label: string;
    category: 'info' | 'crew' | 'haul' | 'transship' | 'rareFish';
    categoryLabel: string;
    originalValue: any;
    currentValue: any;
    displayOriginal: string;
    displayCurrent: string;
}

export interface MiningLogDiffResult {
    totalChanges: number;
    diffs: FieldDiff[];
    diffMap: Record<string, FieldDiff>;
}

const normalizeStr = (val: any): string => {
    if (val === null || val === undefined) return '';
    return String(val).trim();
};

const normalizeDate = (val?: string): string => {
    if (!val) return '';
    try {
        const d = new Date(val);
        return isNaN(d.getTime()) ? '' : d.toISOString().split('.')[0];
    } catch {
        return '';
    }
};

const formatDateVi = (val?: string): string => {
    if (!val) return 'Chưa có';
    try {
        const d = new Date(val);
        return isNaN(d.getTime()) ? val : d.toLocaleString('vi-VN');
    } catch {
        return val;
    }
};

const formatCoords = (lat?: number, lng?: number): string => {
    if (lat === undefined || lng === undefined || lat === null || lng === null) return 'Chưa có';
    return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
};

export const compareMiningLogs = (
    current?: MiningLogDto | null,
    original?: MiningLogDto | null
): MiningLogDiffResult => {
    const diffs: FieldDiff[] = [];
    const diffMap: Record<string, FieldDiff> = {};

    if (!current || !original) {
        return { totalChanges: 0, diffs, diffMap };
    }

    const addDiff = (
        key: string,
        label: string,
        category: 'info' | 'crew' | 'haul' | 'transship' | 'rareFish',
        categoryLabel: string,
        originalValue: any,
        currentValue: any,
        displayOriginal: string,
        displayCurrent: string
    ) => {
        const diff: FieldDiff = {
            key,
            label,
            category,
            categoryLabel,
            originalValue,
            currentValue,
            displayOriginal: displayOriginal || '(Trống)',
            displayCurrent: displayCurrent || '(Trống)'
        };
        diffs.push(diff);
        diffMap[key] = diff;
    };

    // 1. So sánh Thông tin tàu & Chủ tàu
    if (normalizeStr(current.shipName) !== normalizeStr(original.shipName)) {
        addDiff('shipName', 'Tên tàu / Biển số', 'info', 'Hồ sơ tàu', original.shipName, current.shipName, original.shipName, current.shipName);
    }
    if (normalizeStr(current.shipOwnerFullName) !== normalizeStr(original.shipOwnerFullName)) {
        addDiff('shipOwnerFullName', 'Họ tên chủ tàu', 'info', 'Hồ sơ tàu', original.shipOwnerFullName, current.shipOwnerFullName, original.shipOwnerFullName, current.shipOwnerFullName);
    }
    if (normalizeStr(current.shipOwnerCitizenId) !== normalizeStr(original.shipOwnerCitizenId)) {
        addDiff('shipOwnerCitizenId', 'CCCD / CMND chủ tàu', 'info', 'Hồ sơ tàu', original.shipOwnerCitizenId, current.shipOwnerCitizenId, original.shipOwnerCitizenId, current.shipOwnerCitizenId);
    }
    if (normalizeDate(current.shipOwnerBirthDate) !== normalizeDate(original.shipOwnerBirthDate)) {
        addDiff('shipOwnerBirthDate', 'Ngày sinh chủ tàu', 'info', 'Hồ sơ tàu', original.shipOwnerBirthDate, current.shipOwnerBirthDate, formatDateVi(original.shipOwnerBirthDate), formatDateVi(current.shipOwnerBirthDate));
    }
    if (normalizeStr(current.shipOwnerPhone) !== normalizeStr(original.shipOwnerPhone)) {
        addDiff('shipOwnerPhone', 'Số điện thoại chủ tàu', 'info', 'Hồ sơ tàu', original.shipOwnerPhone, current.shipOwnerPhone, original.shipOwnerPhone || '', current.shipOwnerPhone || '');
    }
    if (normalizeStr(current.shipOwnerEmail) !== normalizeStr(original.shipOwnerEmail)) {
        addDiff('shipOwnerEmail', 'Email chủ tàu', 'info', 'Hồ sơ tàu', original.shipOwnerEmail, current.shipOwnerEmail, original.shipOwnerEmail || '', current.shipOwnerEmail || '');
    }
    if (normalizeStr(current.shipOwnerAddress) !== normalizeStr(original.shipOwnerAddress)) {
        addDiff('shipOwnerAddress', 'Địa chỉ chủ tàu', 'info', 'Hồ sơ tàu', original.shipOwnerAddress, current.shipOwnerAddress, original.shipOwnerAddress || '', current.shipOwnerAddress || '');
    }

    // 2. Ngư cụ & Ngành nghề
    const origOccCode = original.mainOccupation?.code || original.mainOccupation?.name;
    const currOccCode = current.mainOccupation?.code || current.mainOccupation?.name;
    if (normalizeStr(origOccCode) !== normalizeStr(currOccCode)) {
        addDiff('mainOccupation', 'Loại nghề chính', 'info', 'Ngành nghề', original.mainOccupation?.name, current.mainOccupation?.name, `${original.mainOccupation?.name || ''} (${original.mainOccupation?.code || ''})`, `${current.mainOccupation?.name || ''} (${current.mainOccupation?.code || ''})`);
    }

    if (normalizeStr(current.miningLicenseNumber) !== normalizeStr(original.miningLicenseNumber)) {
        addDiff('miningLicenseNumber', 'Giấy phép khai thác', 'info', 'Giấy phép', original.miningLicenseNumber, current.miningLicenseNumber, original.miningLicenseNumber || '', current.miningLicenseNumber || '');
    }
    if (normalizeDate(current.expirationDateOfMiningLicenseNumber) !== normalizeDate(original.expirationDateOfMiningLicenseNumber)) {
        addDiff('expirationDateOfMiningLicenseNumber', 'Hạn giấy phép khai thác', 'info', 'Giấy phép', original.expirationDateOfMiningLicenseNumber, current.expirationDateOfMiningLicenseNumber, formatDateVi(original.expirationDateOfMiningLicenseNumber), formatDateVi(current.expirationDateOfMiningLicenseNumber));
    }
    if (normalizeStr(current.type) !== normalizeStr(original.type)) {
        addDiff('type', 'Loại tàu (Type)', 'info', 'Ngư cụ', original.type, current.type, original.type, current.type);
    }
    if (Number(current.dimension1) !== Number(original.dimension1) || Number(current.dimension2) !== Number(original.dimension2)) {
        addDiff('dimensions', 'Kích thước (K1 - K2)', 'info', 'Ngư cụ', `${original.dimension1}m - ${original.dimension2}m`, `${current.dimension1}m - ${current.dimension2}m`, `${original.dimension1}m - ${original.dimension2}m`, `${current.dimension1}m - ${current.dimension2}m`);
    }
    if (normalizeStr(current.fishingGearSpecifications) !== normalizeStr(original.fishingGearSpecifications)) {
        addDiff('fishingGearSpecifications', 'Quy cách ngư cụ', 'info', 'Ngư cụ', original.fishingGearSpecifications, current.fishingGearSpecifications, original.fishingGearSpecifications, current.fishingGearSpecifications);
    }

    // 3. Lịch trình xuất / cập bến
    if (normalizeStr(current.departureRecordNo) !== normalizeStr(original.departureRecordNo)) {
        addDiff('departureRecordNo', 'Số sổ xuất bến', 'info', 'Xuất bến', original.departureRecordNo, current.departureRecordNo, original.departureRecordNo || '', current.departureRecordNo || '');
    }
    if (normalizeDate(current.departureDate) !== normalizeDate(original.departureDate)) {
        addDiff('departureDate', 'Ngày xuất bến', 'info', 'Xuất bến', original.departureDate, current.departureDate, formatDateVi(original.departureDate), formatDateVi(current.departureDate));
    }
    const origPortStart = original.portStart?.name || original.portStart?.code;
    const currPortStart = current.portStart?.name || current.portStart?.code;
    if (normalizeStr(origPortStart) !== normalizeStr(currPortStart)) {
        addDiff('portStart', 'Cảng xuất bến', 'info', 'Xuất bến', original.portStart?.name, current.portStart?.name, original.portStart?.name || '', current.portStart?.name || '');
    }

    if (normalizeStr(current.arrivalRecordNo) !== normalizeStr(original.arrivalRecordNo)) {
        addDiff('arrivalRecordNo', 'Số sổ cập bến', 'info', 'Cập bến', original.arrivalRecordNo, current.arrivalRecordNo, original.arrivalRecordNo || '', current.arrivalRecordNo || '');
    }
    if (normalizeDate(current.arrivalDate) !== normalizeDate(original.arrivalDate)) {
        addDiff('arrivalDate', 'Ngày cập bến', 'info', 'Cập bến', original.arrivalDate, current.arrivalDate, formatDateVi(original.arrivalDate), formatDateVi(current.arrivalDate));
    }
    const origPortEnd = original.portEnd?.name || original.portEnd?.code;
    const currPortEnd = current.portEnd?.name || current.portEnd?.code;
    if (normalizeStr(origPortEnd) !== normalizeStr(currPortEnd)) {
        addDiff('portEnd', 'Cảng cập bến', 'info', 'Cập bến', original.portEnd?.name, current.portEnd?.name, original.portEnd?.name || '', current.portEnd?.name || '');
    }

    // 4. Thuyền viên
    const origCrew = original.crew || [];
    const currCrew = current.crew || [];
    if (origCrew.length !== currCrew.length) {
        addDiff('crew.count', 'Số lượng thuyền viên', 'crew', 'Thuyền viên', origCrew.length, currCrew.length, `${origCrew.length} người`, `${currCrew.length} người`);
    }

    // So sánh từng thuyền viên
    currCrew.forEach((cMember, idx) => {
        const match = origCrew.find(o => (o.citizenId && o.citizenId === cMember.citizenId) || (o.fullName === cMember.fullName));
        const cKey = `crew.${cMember.citizenId || cMember.fullName || idx}`;
        if (!match) {
            addDiff(cKey, `Thuyền viên mới: ${cMember.fullName}`, 'crew', 'Thuyền viên', null, cMember, '(Chưa có)', `${cMember.fullName} (${cMember.crewRole?.description || cMember.crewRole?.code || 'Thuyền viên'})`);
        } else {
            const roleChanged = normalizeStr(cMember.crewRole?.code || cMember.crewRole?.description) !== normalizeStr(match.crewRole?.code || match.crewRole?.description);
            const phoneChanged = normalizeStr(cMember.phone) !== normalizeStr(match.phone);
            if (roleChanged || phoneChanged) {
                const changes = [];
                if (roleChanged) changes.push(`Vai trò: ${match.crewRole?.description || match.crewRole?.code} ➔ ${cMember.crewRole?.description || cMember.crewRole?.code}`);
                if (phoneChanged) changes.push(`SĐT: ${match.phone || 'Trống'} ➔ ${cMember.phone || 'Trống'}`);
                addDiff(cKey, `Thuyền viên: ${cMember.fullName}`, 'crew', 'Thuyền viên', match, cMember, `${match.fullName} (${match.crewRole?.description || ''})`, changes.join('; '));
            }
        }
    });

    // Kiểm tra thuyền viên bị xóa
    origCrew.forEach((oMember, idx) => {
        const match = currCrew.find(c => (c.citizenId && c.citizenId === oMember.citizenId) || (c.fullName === oMember.fullName));
        if (!match) {
            addDiff(`crew.removed.${oMember.citizenId || oMember.fullName || idx}`, `Thuyền viên: ${oMember.fullName}`, 'crew', 'Thuyền viên', oMember, null, `${oMember.fullName} (${oMember.crewRole?.description || oMember.crewRole?.code || 'Thuyền viên'})`, '(Đã xóa khỏi danh sách)');
        }
    });

    // 5. Nhật ký mẻ lưới (Fishing Hauls)
    const origHauls = original.fishingHauls || [];
    const currHauls = current.fishingHauls || [];

    if (origHauls.length !== currHauls.length) {
        addDiff('hauls.count', 'Số lượng mẻ lưới', 'haul', 'Mẻ lưới', origHauls.length, currHauls.length, `${origHauls.length} mẻ`, `${currHauls.length} mẻ`);
    }

    currHauls.forEach(cHaul => {
        const oHaul = origHauls.find(o => o.haulNumber === cHaul.haulNumber);
        const haulKey = `haul.${cHaul.haulNumber}`;

        if (!oHaul) {
            const totalKg = cHaul.catchDetails?.reduce((s, i) => s + i.weight, 0) || 0;
            addDiff(haulKey, `Mẻ lưới số ${cHaul.haulNumber}`, 'haul', `Mẻ ${cHaul.haulNumber}`, null, cHaul, '(Chưa có trong bản gốc)', `Mẻ mới thêm (${totalKg} kg)`);
            return;
        }

        let hasHaulChange = false;

        // Vị trí & thời gian thả
        const deployCoordChanged = Math.abs(cHaul.deployLatitude - oHaul.deployLatitude) > 0.0001 || Math.abs(cHaul.deployLongitude - oHaul.deployLongitude) > 0.0001;
        if (deployCoordChanged) {
            hasHaulChange = true;
            addDiff(`${haulKey}.deployCoord`, `Mẻ ${cHaul.haulNumber} - Tọa độ thả`, 'haul', `Mẻ ${cHaul.haulNumber}`, formatCoords(oHaul.deployLatitude, oHaul.deployLongitude), formatCoords(cHaul.deployLatitude, cHaul.deployLongitude), formatCoords(oHaul.deployLatitude, oHaul.deployLongitude), formatCoords(cHaul.deployLatitude, cHaul.deployLongitude));
        }

        if (normalizeDate(cHaul.deployTime) !== normalizeDate(oHaul.deployTime)) {
            hasHaulChange = true;
            addDiff(`${haulKey}.deployTime`, `Mẻ ${cHaul.haulNumber} - Thời gian thả`, 'haul', `Mẻ ${cHaul.haulNumber}`, oHaul.deployTime, cHaul.deployTime, formatDateVi(oHaul.deployTime), formatDateVi(cHaul.deployTime));
        }

        // Vị trí & thời gian thu
        const haulCoordChanged = Math.abs(cHaul.haulLatitude - oHaul.haulLatitude) > 0.0001 || Math.abs(cHaul.haulLongitude - oHaul.haulLongitude) > 0.0001;
        if (haulCoordChanged) {
            hasHaulChange = true;
            addDiff(`${haulKey}.haulCoord`, `Mẻ ${cHaul.haulNumber} - Tọa độ thu`, 'haul', `Mẻ ${cHaul.haulNumber}`, formatCoords(oHaul.haulLatitude, oHaul.haulLongitude), formatCoords(cHaul.haulLatitude, cHaul.haulLongitude), formatCoords(oHaul.haulLatitude, oHaul.haulLongitude), formatCoords(cHaul.haulLatitude, cHaul.haulLongitude));
        }

        if (normalizeDate(cHaul.haulTime) !== normalizeDate(oHaul.haulTime)) {
            hasHaulChange = true;
            addDiff(`${haulKey}.haulTime`, `Mẻ ${cHaul.haulNumber} - Thời gian thu`, 'haul', `Mẻ ${cHaul.haulNumber}`, oHaul.haulTime, cHaul.haulTime, formatDateVi(oHaul.haulTime), formatDateVi(cHaul.haulTime));
        }

        // So sánh chi tiết cá (Catch Details)
        const oCatches = oHaul.catchDetails || [];
        const cCatches = cHaul.catchDetails || [];

        cCatches.forEach(cCatch => {
            const fishId = cCatch.fish?.code || cCatch.fish?.idtypeOfFish;
            const fishName = cCatch.fish?.vietnameseName || cCatch.fish?.code || 'Cá';
            const oCatch = oCatches.find(o => (o.fish?.code && o.fish?.code === cCatch.fish?.code) || (o.fish?.idtypeOfFish && o.fish?.idtypeOfFish === cCatch.fish?.idtypeOfFish));
            const catchKey = `${haulKey}.catch.${fishId}`;

            if (!oCatch) {
                hasHaulChange = true;
                addDiff(catchKey, `Mẻ ${cHaul.haulNumber} - ${fishName}`, 'haul', `Mẻ ${cHaul.haulNumber}`, null, cCatch.weight, '(Chưa có trong mẻ gốc)', `Thêm mới ${cCatch.weight} kg`);
            } else if (Number(oCatch.weight) !== Number(cCatch.weight)) {
                hasHaulChange = true;
                addDiff(catchKey, `Mẻ ${cHaul.haulNumber} - ${fishName}`, 'haul', `Mẻ ${cHaul.haulNumber}`, oCatch.weight, cCatch.weight, `${oCatch.weight} kg`, `${cCatch.weight} kg`);
            }
        });

        // Kiểm tra loài bị xóa
        oCatches.forEach(oCatch => {
            const fishId = oCatch.fish?.code || oCatch.fish?.idtypeOfFish;
            const fishName = oCatch.fish?.vietnameseName || oCatch.fish?.code || 'Cá';
            const cCatch = cCatches.find(c => (c.fish?.code && c.fish?.code === oCatch.fish?.code) || (c.fish?.idtypeOfFish && c.fish?.idtypeOfFish === oCatch.fish?.idtypeOfFish));
            if (!cCatch) {
                hasHaulChange = true;
                addDiff(`${haulKey}.catch.removed.${fishId}`, `Mẻ ${cHaul.haulNumber} - ${fishName}`, 'haul', `Mẻ ${cHaul.haulNumber}`, oCatch.weight, null, `${oCatch.weight} kg`, '(Đã xóa khỏi mẻ)');
            }
        });

        // Nếu mẻ có bất kỳ thay đổi nào, đánh dấu cả mẻ
        if (hasHaulChange) {
            diffMap[`${haulKey}.hasChange`] = {
                key: `${haulKey}.hasChange`,
                label: `Mẻ lưới số ${cHaul.haulNumber}`,
                category: 'haul',
                categoryLabel: `Mẻ ${cHaul.haulNumber}`,
                originalValue: oHaul,
                currentValue: cHaul,
                displayOriginal: 'Bản gốc',
                displayCurrent: 'Đã sửa đổi'
            };
        }
    });

    // Kiểm tra mẻ lưới bị xóa
    origHauls.forEach(oHaul => {
        const cHaul = currHauls.find(c => c.haulNumber === oHaul.haulNumber);
        if (!cHaul) {
            const totalKg = oHaul.catchDetails?.reduce((s, i) => s + i.weight, 0) || 0;
            addDiff(`haul.removed.${oHaul.haulNumber}`, `Mẻ lưới số ${oHaul.haulNumber}`, 'haul', `Mẻ ${oHaul.haulNumber}`, oHaul, null, `Mẻ ${oHaul.haulNumber} (${totalKg} kg)`, '(Đã xóa khỏi danh sách)');
        }
    });

    // 6. Chuyển tải (Transshipment)
    const origTs = original.transshipmentEvents || [];
    const currTs = current.transshipmentEvents || [];
    if (origTs.length !== currTs.length) {
        addDiff('transship.count', 'Số lần chuyển tải', 'transship', 'Chuyển tải', origTs.length, currTs.length, `${origTs.length} lần`, `${currTs.length} lần`);
    }

    currTs.forEach((cEvt, idx) => {
        const oEvt = origTs[idx];
        const tsKey = `transship.${idx}`;
        if (!oEvt) {
            addDiff(tsKey, `Lần chuyển tải số ${idx + 1}`, 'transship', 'Chuyển tải', null, cEvt, '(Chưa có trong bản gốc)', `Tàu bán: ${cEvt.shipNameSeller}`);
        } else {
            if (normalizeStr(cEvt.shipNameSeller) !== normalizeStr(oEvt.shipNameSeller)) {
                addDiff(`${tsKey}.shipNameSeller`, `Lần ${idx + 1} - Tàu bán`, 'transship', 'Chuyển tải', oEvt.shipNameSeller, cEvt.shipNameSeller, oEvt.shipNameSeller, cEvt.shipNameSeller);
            }
            if (normalizeDate(cEvt.transshipmentTime) !== normalizeDate(oEvt.transshipmentTime)) {
                addDiff(`${tsKey}.time`, `Lần ${idx + 1} - Thời gian`, 'transship', 'Chuyển tải', oEvt.transshipmentTime, cEvt.transshipmentTime, formatDateVi(oEvt.transshipmentTime), formatDateVi(cEvt.transshipmentTime));
            }
        }
    });

    // 7. Báo cáo động vật quý hiếm (Rare Fish Reports)
    const origRare = original.rareFishReports || [];
    const currRare = current.rareFishReports || [];
    if (origRare.length !== currRare.length) {
        addDiff('rareFish.count', 'Số lần ghi nhận động vật quý hiếm', 'rareFish', 'Động vật quý hiếm', origRare.length, currRare.length, `${origRare.length} lần`, `${currRare.length} lần`);
    }

    currRare.forEach((cReport, idx) => {
        const oReport = origRare.find(o => o.haulNumber === cReport.haulNumber && normalizeStr(o.rareSpecieName).toLowerCase() === normalizeStr(cReport.rareSpecieName).toLowerCase()) || origRare[idx];
        const rKey = `rareFish.${cReport.haulNumber}.${idx}`;
        if (!oReport) {
            addDiff(rKey, `Ghi nhận ${cReport.rareSpecieName} (Mẻ ${cReport.haulNumber})`, 'rareFish', 'Động vật quý hiếm', null, cReport, '(Chưa có trong bản gốc)', `Mẻ ${cReport.haulNumber}: ${cReport.rareSpecieName} - ${cReport.quantity} con (${cReport.weight} kg)`);
        } else {
            if (normalizeStr(cReport.rareSpecieName) !== normalizeStr(oReport.rareSpecieName)) {
                addDiff(`${rKey}.species`, `Mẻ ${cReport.haulNumber} - Tên loài`, 'rareFish', 'Động vật quý hiếm', oReport.rareSpecieName, cReport.rareSpecieName, oReport.rareSpecieName, cReport.rareSpecieName);
            }
            if (Number(cReport.quantity) !== Number(oReport.quantity)) {
                addDiff(`${rKey}.quantity`, `Mẻ ${cReport.haulNumber} - Số lượng ${cReport.rareSpecieName}`, 'rareFish', 'Động vật quý hiếm', oReport.quantity, cReport.quantity, `${oReport.quantity} con`, `${cReport.quantity} con`);
            }
            if (Number(cReport.weight) !== Number(oReport.weight)) {
                addDiff(`${rKey}.weight`, `Mẻ ${cReport.haulNumber} - Khối lượng ${cReport.rareSpecieName}`, 'rareFish', 'Động vật quý hiếm', oReport.weight, cReport.weight, `${oReport.weight} kg`, `${cReport.weight} kg`);
            }
            if (Number(cReport.size) !== Number(oReport.size)) {
                addDiff(`${rKey}.size`, `Mẻ ${cReport.haulNumber} - Kích thước ${cReport.rareSpecieName}`, 'rareFish', 'Động vật quý hiếm', oReport.size, cReport.size, `${oReport.size} cm`, `${cReport.size} cm`);
            }
            if (normalizeStr(cReport.status) !== normalizeStr(oReport.status)) {
                addDiff(`${rKey}.status`, `Mẻ ${cReport.haulNumber} - Tình trạng ${cReport.rareSpecieName}`, 'rareFish', 'Động vật quý hiếm', oReport.status, cReport.status, oReport.status, cReport.status);
            }
            if (normalizeStr(cReport.progress) !== normalizeStr(oReport.progress)) {
                addDiff(`${rKey}.progress`, `Mẻ ${cReport.haulNumber} - Biện pháp xử lý`, 'rareFish', 'Động vật quý hiếm', oReport.progress, cReport.progress, oReport.progress || 'Trống', cReport.progress || 'Trống');
            }
        }
    });

    origRare.forEach((oReport, idx) => {
        const cReport = currRare.find(c => c.haulNumber === oReport.haulNumber && normalizeStr(c.rareSpecieName).toLowerCase() === normalizeStr(oReport.rareSpecieName).toLowerCase());
        if (!cReport) {
            addDiff(`rareFish.removed.${oReport.haulNumber}.${idx}`, `Động vật quý hiếm: ${oReport.rareSpecieName}`, 'rareFish', 'Động vật quý hiếm', oReport, null, `Mẻ ${oReport.haulNumber}: ${oReport.rareSpecieName} (${oReport.quantity} con)`, '(Đã xóa khỏi danh sách)');
        }
    });

    return {
        totalChanges: diffs.length,
        diffs,
        diffMap
    };
};
