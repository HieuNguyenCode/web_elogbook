import { useEffect, useState, Fragment } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import type { MiningLogDto } from '../../types/MiningLog';
import { miningLogDetailAPI } from '../../features/API/miningLog/MiningLog';
import VoyageMap from './VoyageMap';
import { useToast } from '../../components/ToastContext';

interface Props {
    isOpen: boolean;
    idSeaVoyage: string | null;
    onClose: () => void;
}

export default function VoyageDetailModal({ isOpen, idSeaVoyage, onClose }: Props) {
    const [log, setLog] = useState<MiningLogDto | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedHauls, setExpandedHauls] = useState<number[]>([]);
    const [expandedTransshipments, setExpandedTransshipments] = useState<number[]>([]);
    const [activeTab, setActiveTab] = useState<'info' | 'map' | 'crew' | 'log' | 'transship'>('info');
    
    const { error: showError } = useToast();

    const toggleHaul = (haulNumber: number) => {
        setExpandedHauls(prev => prev.includes(haulNumber) ? prev.filter(n => n !== haulNumber) : [...prev, haulNumber]);
    };
    
    const toggleTransshipment = (index: number) => {
        setExpandedTransshipments(prev => prev.includes(index) ? prev.filter(n => n !== index) : [...prev, index]);
    };

    useEffect(() => {
        if (isOpen && idSeaVoyage) {
            fetchDetail();
        } else {
            setTimeout(() => {
                setLog(null);
                setExpandedHauls([]);
                setExpandedTransshipments([]);
                setActiveTab('info');
            }, 0);
        }

        async function fetchDetail() {
            try {
                setTimeout(() => setIsLoading(true), 0);
                const data = await miningLogDetailAPI(idSeaVoyage!);
                setLog(data);
            } catch (err) {
                showError((err as Error).message || 'Không thể tải chi tiết chuyến biển');
                onClose();
            } finally {
                setTimeout(() => setIsLoading(false), 0);
            }
        }
    }, [isOpen, idSeaVoyage]);

    if (!isOpen) return null;

    
    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-container" onClick={e => e.stopPropagation()} style={{ width: '90vw', maxWidth: '1400px', height: '85vh', minHeight: '600px', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
                
                {/* Header */ }
                <div className="flex items-center justify-between" style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <div>
                        <h2 className="text-xl font-bold" style={{ color: '#0f172a' }}>{log?.shipName || 'Đang tải...'}</h2>
                        {log && <p className="text-xs text-slate-500 mt-1">Mã chuyến: {log.idtrip}</p>}
                    </div>
                    <button onClick={onClose} className="btn btn-text" style={{ padding: '8px', color: '#64748b' }}>
                        <X size={20} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center flex-1">
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : !log ? (
                    <div className="flex justify-center items-center flex-1">
                        <p>Không có dữ liệu</p>
                    </div>
                ) : (
                    <>
                        {/* Top Tabs */}
                        <div className="flex" style={{ borderBottom: '1px solid #e2e8f0', overflowX: 'auto', padding: '0 24px' }}>
                            {['Thông tin chung', 'Bản đồ', 'Thuyền viên', 'Nhật ký khai thác', 'Chuyển tải'].map(tab => {
                                const tabMap: any = { 'Thông tin chung': 'info', 'Bản đồ': 'map', 'Thuyền viên': 'crew', 'Nhật ký khai thác': 'log', 'Chuyển tải': 'transship' };
                                const tabKey = tabMap[tab];
                                const isActive = activeTab === tabKey;
                                return (
                                    <button 
                                        key={tabKey}
                                        className={`btn btn-text ${isActive ? 'font-bold' : ''}`}
                                        style={{ 
                                            padding: '16px 20px', 
                                            borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent', 
                                            borderRadius: 0, 
                                            color: isActive ? '#3b82f6' : '#64748b',
                                            whiteSpace: 'nowrap',
                                            fontSize: '14px'
                                        }}
                                        onClick={() => setActiveTab(tabKey)}
                                    >
                                        {tab} {tabKey === 'log' ? `(${log.fishingHauls?.length || 0})` : ''} {tabKey === 'transship' ? `(${log.transshipmentEvents?.length || 0})` : ''}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content Area */}
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            {activeTab === 'info' && (
                                <div style={{ padding: '24px' }}>
                                    <div className="grid grid-cols-2 gap-md">
                                        <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
                                            <h3 className="font-semibold text-lg" style={{ color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Thông tin tàu & Chủ tàu</h3>
                                            <div className="flex flex-col gap-xs text-sm">
                                                <p><strong>Tên tàu:</strong> {log.shipName}</p>
                                                <p><strong>Chủ tàu:</strong> {log.shipOwnerFullName} (CCCD: {log.shipOwnerCitizenId})</p>
                                                {log.shipOwnerBirthDate && <p><strong>Ngày sinh:</strong> {new Date(log.shipOwnerBirthDate).toLocaleDateString('vi-VN')}</p>}
                                                {log.shipOwnerPhone && <p><strong>Điện thoại:</strong> {log.shipOwnerPhone}</p>}
                                                {log.shipOwnerEmail && <p><strong>Email:</strong> {log.shipOwnerEmail}</p>}
                                                {log.shipOwnerAddress && <p><strong>Địa chỉ:</strong> {log.shipOwnerAddress}</p>}
                                                
                                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1' }}>
                                                    <p><strong>Loại nghề chính:</strong> {log.mainOccupation?.name} ({log.mainOccupation?.code})</p>
                                                    {log.secondaryOccupation1 && <p><strong>Nghề phụ 1:</strong> {log.secondaryOccupation1.name}</p>}
                                                    {log.secondaryOccupation2 && <p><strong>Nghề phụ 2:</strong> {log.secondaryOccupation2.name}</p>}
                                                </div>
                                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1' }}>
                                                    {log.miningLicenseNumber && <p><strong>Giấy phép KT:</strong> {log.miningLicenseNumber} {log.expirationDateOfMiningLicenseNumber && <span>(Hết hạn: {new Date(log.expirationDateOfMiningLicenseNumber).toLocaleDateString('vi-VN')})</span>}</p>}
                                                    <p><strong>Loại tàu (Type):</strong> {log.type}</p>
                                                    <p><strong>Kích thước 1:</strong> {log.dimension1} | <strong>Kích thước 2:</strong> {log.dimension2}</p>
                                                    <p><strong>Quy cách ngư cụ:</strong> {log.fishingGearSpecifications}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col gap-md">
                                            <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '8px' }}>
                                                <h3 className="font-semibold text-lg" style={{ color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid #bbf7d0', paddingBottom: '8px' }}>Thông tin xuất bến</h3>
                                                <div className="flex flex-col gap-xs text-sm">
                                                    <p><strong>Mã chuyến:</strong> {log.idtrip}</p>
                                                    <p><strong>Cảng xuất:</strong> {log.portStart?.name} ({log.portStart?.code})</p>
                                                    <p><strong>Thời gian xuất:</strong> {new Date(log.departureDate).toLocaleString('vi-VN')}</p>
                                                    {log.departureRecordNo && <p><strong>Số biên bản xuất:</strong> {log.departureRecordNo}</p>}
                                                </div>
                                            </div>

                                            {log.arrivalDate && (
                                                <div style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '8px' }}>
                                                    <h3 className="font-semibold text-lg" style={{ color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid #bfdbfe', paddingBottom: '8px' }}>Thông tin cập bến</h3>
                                                    <div className="flex flex-col gap-xs text-sm">
                                                        <p><strong>Cảng cập:</strong> {log.portEnd?.name} ({log.portEnd?.code})</p>
                                                        <p><strong>Thời gian cập:</strong> {new Date(log.arrivalDate).toLocaleString('vi-VN')}</p>
                                                        {log.arrivalRecordNo && <p><strong>Số biên bản cập:</strong> {log.arrivalRecordNo}</p>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'map' && (
                                <div style={{ display: 'flex', height: '100%' }}>
                                    {/* Map Sidebar - Timeline */}
                                    <div style={{ width: '400px', borderRight: '1px solid #e2e8f0', overflowY: 'auto', padding: '24px', backgroundColor: '#f8fafc' }}>
                                        <h3 className="font-bold text-lg mb-6">Hải trình chuyến biển</h3>
                                        <div className="flex flex-col gap-4">
                                            {/* Start Port */}
                                            <div style={{ display: 'flex', gap: '16px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#10b981', marginTop: '4px' }}></div>
                                                    <div style={{ width: '2px', flex: 1, backgroundColor: '#cbd5e1', margin: '4px 0' }}></div>
                                                </div>
                                                <div style={{ paddingBottom: '16px' }}>
                                                    <div className="font-bold text-slate-800 text-sm">Xuất bến - {log.portStart?.name}</div>
                                                    <div className="text-sm text-slate-500">{new Date(log.departureDate).toLocaleString('vi-VN')}</div>
                                                    {(log.portStart?.lat && log.portStart?.lng) && <div className="text-xs text-slate-400">{log.portStart.lat}, {log.portStart.lng}</div>}
                                                </div>
                                            </div>

                                            {/* Hauls timeline */}
                                            {[...log.fishingHauls].sort((a,b) => new Date(a.deployTime).getTime() - new Date(b.deployTime).getTime()).map(haul => {
                                                const weight = haul.catchDetails?.reduce((s,i) => s + i.weight, 0) || 0;
                                                return (
                                                    <Fragment key={haul.haulNumber}>
                                                        <div style={{ display: 'flex', gap: '16px' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#0ea5e9', marginTop: '4px' }}></div>
                                                                <div style={{ width: '2px', flex: 1, backgroundColor: '#cbd5e1', margin: '4px 0' }}></div>
                                                            </div>
                                                            <div style={{ paddingBottom: '16px' }}>
                                                                <div className="font-bold text-slate-800 text-sm">Thả lưới mẻ {haul.haulNumber}</div>
                                                                <div className="text-sm text-slate-500">{new Date(haul.deployTime).toLocaleString('vi-VN')}</div>
                                                                <div className="text-xs text-slate-400">{haul.deployLatitude.toFixed(4)}, {haul.deployLongitude.toFixed(4)}</div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '16px' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#0284c7', marginTop: '4px' }}></div>
                                                                <div style={{ width: '2px', flex: 1, backgroundColor: '#cbd5e1', margin: '4px 0' }}></div>
                                                            </div>
                                                            <div style={{ paddingBottom: '16px' }}>
                                                                <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                                    Thu lưới mẻ {haul.haulNumber}
                                                                    <span style={{ fontSize: '11px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '10px' }}>{weight} kg</span>
                                                                </div>
                                                                <div className="text-sm text-slate-500">{new Date(haul.haulTime).toLocaleString('vi-VN')}</div>
                                                                <div className="text-xs text-slate-400">{haul.haulLatitude.toFixed(4)}, {haul.haulLongitude.toFixed(4)}</div>
                                                            </div>
                                                        </div>
                                                    </Fragment>
                                                );
                                            })}

                                            {/* Transshipments timeline */}
                                            {log.transshipmentEvents?.map((evt, idx) => (
                                                <div key={'ts'+idx} style={{ display: 'flex', gap: '16px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                        <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#f59e0b', marginTop: '4px' }}></div>
                                                        <div style={{ width: '2px', flex: 1, backgroundColor: '#cbd5e1', margin: '4px 0' }}></div>
                                                    </div>
                                                    <div style={{ paddingBottom: '16px' }}>
                                                        <div className="font-bold text-slate-800 text-sm">Chuyển tải ({evt.shipNameSeller})</div>
                                                        <div className="text-sm text-slate-500">{new Date(evt.transshipmentTime).toLocaleString('vi-VN')}</div>
                                                        <div className="text-xs text-slate-400">{evt.latitude.toFixed(4)}, {evt.longitude.toFixed(4)}</div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* End Port */}
                                            <div style={{ display: 'flex', gap: '16px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#ef4444', marginTop: '4px' }}></div>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 text-sm">Cập bến {log.portEnd?.name ? `- ${log.portEnd.name}` : ''}</div>
                                                    <div className="text-sm text-slate-500">{log.arrivalDate ? new Date(log.arrivalDate).toLocaleString('vi-VN') : 'Đang trên biển'}</div>
                                                    {(log.portEnd?.lat && log.portEnd?.lng) && <div className="text-xs text-slate-400">{log.portEnd.lat}, {log.portEnd.lng}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Main Map Area */}
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <VoyageMap log={log} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'crew' && (
                                <div style={{ padding: '24px' }}>
                                    {log?.crew && log.crew.length > 0 ? (
                                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Họ và tên</th>
                                                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Số CCCD</th>
                                                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Số điện thoại</th>
                                                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Vai trò</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {log.crew.map((member, idx) => (
                                                    <tr key={member.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155', fontWeight: 500 }}>{member.fullName}</td>
                                                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{member.citizenId || '-'}</td>
                                                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{member.phone || '-'}</td>
                                                        <td style={{ padding: '12px 16px' }}>
                                                            <span style={{ 
                                                                display: 'inline-block', 
                                                                padding: '4px 10px', 
                                                                backgroundColor: member.crewRole?.code === 'TTR' ? '#e0f2fe' : '#f1f5f9', 
                                                                color: member.crewRole?.code === 'TTR' ? '#0369a1' : '#475569', 
                                                                borderRadius: '20px', 
                                                                fontSize: '12px', 
                                                                fontWeight: 600 
                                                            }}>
                                                                {member.crewRole?.description || member.crewRole?.code || 'Thuyền viên'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="flex justify-center items-center bg-slate-50" style={{ height: '300px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                                            <div className="text-center text-slate-500">
                                                <p style={{ marginBottom: '8px', fontSize: '24px' }}>👥</p>
                                                <p className="text-sm">Hiện tại không có dữ liệu thuyền viên đi kèm chuyến biển này</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'log' && (
                                <div style={{ padding: '24px' }}>
                                    <div className="table-container">
                                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead style={{ backgroundColor: '#f8fafc' }}>
                                                <tr>
                                                    <th style={{ padding: '12px 16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>Mẻ số</th>
                                                    <th style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>Vị trí thả</th>
                                                    <th style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>Thời gian thả</th>
                                                    <th style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>Vị trí thu</th>
                                                    <th style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>Thời gian thu</th>
                                                    <th style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>Sản lượng (kg)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {log.fishingHauls?.length > 0 ? log.fishingHauls.map(haul => {
                                                    const totalWeight = haul.catchDetails?.reduce((sum, item) => sum + item.weight, 0) || 0;
                                                    const isExpanded = expandedHauls.includes(haul.haulNumber);
                                                    return (
                                                        <Fragment key={haul.haulNumber}>
                                                            <tr onClick={() => toggleHaul(haul.haulNumber)} style={{ cursor: 'pointer', backgroundColor: isExpanded ? '#eff6ff' : 'transparent' }} className="hover:bg-slate-50 transition-colors">
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                                                    <div className="flex items-center justify-center gap-xs font-semibold text-blue-600">
                                                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                                        {haul.haulNumber}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>{haul.deployLatitude.toFixed(4)}, {haul.deployLongitude.toFixed(4)}</td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>{new Date(haul.deployTime).toLocaleString('vi-VN')}</td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>{haul.haulLatitude.toFixed(4)}, {haul.haulLongitude.toFixed(4)}</td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>{new Date(haul.haulTime).toLocaleString('vi-VN')}</td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>{totalWeight} kg</td>
                                                            </tr>
                                                            {isExpanded && (
                                                                <tr>
                                                                    <td colSpan={6} style={{ padding: 0, border: '1px solid #e2e8f0' }}>
                                                                        <div style={{ padding: '16px', backgroundColor: '#fdfdb811', borderLeft: '4px solid #3b82f6' }}>
                                                                            <h4 className="font-semibold" style={{ marginBottom: '12px', color: '#1e293b' }}>Chi tiết cá mẻ lưới {haul.haulNumber}:</h4>
                                                                            {haul.catchDetails && haul.catchDetails.length > 0 ? (
                                                                                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                                                    <thead style={{ backgroundColor: '#f1f5f9' }}>
                                                                                        <tr>
                                                                                            <th style={{ padding: '10px 16px', border: '1px solid #e2e8f0', textAlign: 'left', fontSize: '13px' }}>Tên loài</th>
                                                                                            <th style={{ padding: '10px 16px', border: '1px solid #e2e8f0', textAlign: 'left', fontSize: '13px' }}>Tên khoa học</th>
                                                                                            <th style={{ padding: '10px 16px', border: '1px solid #e2e8f0', textAlign: 'right', fontSize: '13px' }}>Khối lượng (kg)</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {haul.catchDetails.map((catchItem, idx) => (
                                                                                            <tr key={idx}>
                                                                                                <td style={{ padding: '10px 16px', border: '1px solid #e2e8f0', fontSize: '14px', fontWeight: 500 }}>{catchItem.fish.vietnameseName}</td>
                                                                                                <td style={{ padding: '10px 16px', border: '1px solid #e2e8f0', fontSize: '13px', fontStyle: 'italic', color: '#64748b' }}>{catchItem.fish.scientificName}</td>
                                                                                                <td style={{ padding: '10px 16px', border: '1px solid #e2e8f0', fontSize: '14px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{catchItem.weight}</td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            ) : (
                                                                                <p style={{ fontSize: '14px', color: '#64748b' }}>Không có dữ liệu chi tiết.</p>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </Fragment>
                                                    );
                                                }) : (
                                                    <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Chưa có dữ liệu nhật ký khai thác.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'transship' && (
                                <div style={{ padding: '24px' }}>
                                    <div className="table-container">
                                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead style={{ backgroundColor: '#f8fafc' }}>
                                                <tr>
                                                    <th style={{ padding: '12px 16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>STT</th>
                                                    <th style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>Tàu bán (Số BB)</th>
                                                    <th style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>Vị trí chuyển tải</th>
                                                    <th style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>Thời gian</th>
                                                    <th style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>Tổng SL (kg)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {log.transshipmentEvents && log.transshipmentEvents.length > 0 ? log.transshipmentEvents.map((event, index) => {
                                                    const totalWeight = event.transshipmentDetails?.reduce((sum, item) => sum + item.weight, 0) || 0;
                                                    const isExpanded = expandedTransshipments.includes(index);
                                                    return (
                                                        <Fragment key={index}>
                                                            <tr onClick={() => toggleTransshipment(index)} style={{ cursor: 'pointer', backgroundColor: isExpanded ? '#f0fdf4' : 'transparent' }} className="hover:bg-slate-50 transition-colors">
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                                                    <div className="flex items-center justify-center gap-xs font-semibold text-emerald-600">
                                                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                                        {index + 1}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>{event.shipNameSeller} {event.departureRecordNoSeller ? `(${event.departureRecordNoSeller})` : ''}</td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>{event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}</td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>{new Date(event.transshipmentTime).toLocaleString('vi-VN')}</td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>{totalWeight} kg</td>
                                                            </tr>
                                                            {isExpanded && (
                                                                <tr>
                                                                    <td colSpan={5} style={{ padding: 0, border: '1px solid #e2e8f0' }}>
                                                                        <div style={{ padding: '16px', backgroundColor: '#fdfdb811', borderLeft: '4px solid #10b981' }}>
                                                                            <h4 className="font-semibold" style={{ marginBottom: '12px', color: '#1e293b' }}>Chi tiết chuyển tải lần {index + 1}:</h4>
                                                                            {event.transshipmentDetails && event.transshipmentDetails.length > 0 ? (
                                                                                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                                                    <thead style={{ backgroundColor: '#f1f5f9' }}>
                                                                                        <tr>
                                                                                            <th style={{ padding: '10px 16px', border: '1px solid #e2e8f0', textAlign: 'left', fontSize: '13px' }}>Tên loài</th>
                                                                                            <th style={{ padding: '10px 16px', border: '1px solid #e2e8f0', textAlign: 'left', fontSize: '13px' }}>Tên khoa học</th>
                                                                                            <th style={{ padding: '10px 16px', border: '1px solid #e2e8f0', textAlign: 'right', fontSize: '13px' }}>Khối lượng (kg)</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {event.transshipmentDetails.map((detail, idx) => (
                                                                                            <tr key={idx}>
                                                                                                <td style={{ padding: '10px 16px', border: '1px solid #e2e8f0', fontSize: '14px', fontWeight: 500 }}>{detail.fish.vietnameseName}</td>
                                                                                                <td style={{ padding: '10px 16px', border: '1px solid #e2e8f0', fontSize: '13px', fontStyle: 'italic', color: '#64748b' }}>{detail.fish.scientificName}</td>
                                                                                                <td style={{ padding: '10px 16px', border: '1px solid #e2e8f0', fontSize: '14px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{detail.weight}</td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            ) : (
                                                                                <p style={{ fontSize: '14px', color: '#64748b' }}>Không có dữ liệu chi tiết.</p>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </Fragment>
                                                    );
                                                }) : (
                                                    <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Chưa có dữ liệu chuyển tải.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );

}
