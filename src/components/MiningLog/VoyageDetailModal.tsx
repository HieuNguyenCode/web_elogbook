import { useEffect, useState, useMemo, Fragment } from 'react';

import {
    X, ChevronDown, ChevronRight, Ship, User, CreditCard, Phone, Mail,
    MapPin, Briefcase, ClipboardCheck, Ruler, Scale, Hash, BookOpen, LogOut, LogIn,
    Anchor, CalendarClock, Navigation, Calendar, Info, Map, Users, ArrowRightLeft,
    FileBadge, History, Download, Eye, GitCommit, CheckCircle2, AlertTriangle, ExternalLink,
    Fish
} from 'lucide-react';
import type { MiningLogDto, MiningLogBatchesData } from '../../types/MiningLog';
import {
    miningLogDetailAPI,
    miningLogBatchesAPI,
    miningLogDetailByBatchAPI,
    downloadMiningLogPdfAPI
} from '../../features/API/miningLog/MiningLog';
import { compareMiningLogs } from '../../utils/miningLogDiff';
import VoyageMap from './VoyageMap';
import { useToast } from '../../components/ToastContext';

interface Props {
    isOpen: boolean;
    idSeaVoyage: string | null;
    onClose: () => void;
}

export default function VoyageDetailModal({ isOpen, idSeaVoyage, onClose }: Props) {
    const [log, setLog] = useState<MiningLogDto | null>(null);
    const [originalLog, setOriginalLog] = useState<MiningLogDto | null>(null);
    const [batchesData, setBatchesData] = useState<MiningLogBatchesData | null>(null);
    const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isBatchLoading, setIsBatchLoading] = useState(false);
    const [expandedHauls, setExpandedHauls] = useState<number[]>([]);
    const [expandedTransshipments, setExpandedTransshipments] = useState<number[]>([]);
    const [activeTab, setActiveTab] = useState<'info' | 'map' | 'crew' | 'log' | 'transship' | 'rareFish' | 'history' | 'pdf'>('info');
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfLoadedBatch, setPdfLoadedBatch] = useState<number | null>(null);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [diffCategoryFilter, setDiffCategoryFilter] = useState<'all' | 'info' | 'crew' | 'haul' | 'transship' | 'rareFish'>('all');

    // So sánh dữ liệu bản hiện tại với Bản gốc (Batch 0)
    const diffResult = useMemo(() => {
        if (!log || !originalLog || selectedBatch === 0) {
            return { totalChanges: 0, diffs: [], diffMap: {} };
        }
        return compareMiningLogs(log, originalLog);
    }, [log, originalLog, selectedBatch]);

    const filteredDiffs = useMemo(() => {
        if (diffCategoryFilter === 'all') return diffResult.diffs;
        return diffResult.diffs.filter(d => d.category === diffCategoryFilter);
    }, [diffResult.diffs, diffCategoryFilter]);

    const InfoRow = ({ 
        icon: Icon, 
        label, 
        value, 
        diffKey 
    }: { 
        icon: any, 
        label: string, 
        value: React.ReactNode, 
        diffKey?: string 
    }) => {
        const diff = diffKey ? diffResult.diffMap[diffKey] : undefined;
        const isChanged = Boolean(diff);

        return (
            <div className="gap-sm" style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                padding: isChanged ? '8px 10px' : '0 0 12px 0',
                marginBottom: isChanged ? '8px' : 0,
                backgroundColor: isChanged ? '#fffbeb' : 'transparent',
                border: isChanged ? '1px solid #fde68a' : 'none',
                borderRadius: isChanged ? '8px' : 0,
                transition: 'all 0.2s ease'
            }}>
                <div style={{ 
                    padding: '8px', 
                    backgroundColor: isChanged ? '#fef3c7' : '#e2e8f0', 
                    borderRadius: '8px', 
                    color: isChanged ? '#d97706' : '#475569', 
                    flexShrink: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                }}>
                    <Icon size={16} />
                </div>
                <div className="flex-1" style={{ paddingTop: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                        {isChanged && (
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#f59e0b',
                                color: '#ffffff',
                                letterSpacing: '0.3px',
                                lineHeight: '14px'
                            }}>
                                ĐÃ SỬA
                            </span>
                        )}
                    </div>
                    <div style={{ color: isChanged ? '#b45309' : '#0f172a', fontSize: '14px', fontWeight: 600, wordBreak: 'break-word' }}>
                        {value || <span className="text-muted font-normal">Không có dữ liệu</span>}
                    </div>
                    {isChanged && diff && (
                        <div style={{ 
                            marginTop: '4px', 
                            padding: '3px 6px', 
                            backgroundColor: '#fef3c7', 
                            borderRadius: '4px', 
                            fontSize: '11px', 
                            color: '#92400e',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexWrap: 'wrap'
                        }}>
                            <span>Bản gốc:</span>
                            <strong style={{ textDecoration: 'line-through', color: '#78350f' }}>{diff.displayOriginal}</strong>
                        </div>
                    )}
                </div>
            </div>
        );
    };
    
    useEffect(() => {
        if (activeTab === 'pdf' && idSeaVoyage && isOpen) {
            const targetBatch = selectedBatch !== null 
                ? selectedBatch 
                : (batchesData?.currentBatch ?? batchesData?.batches?.find(b => b.isCurrent)?.numberBatch ?? 0);

            // Nếu đã nạp PDF của phiên bản này rồi thì không nạp lại
            if (pdfUrl && pdfLoadedBatch === targetBatch) return;

            let isCancelled = false;
            setIsPdfLoading(true);
            setPdfError(null);

            downloadMiningLogPdfAPI(idSeaVoyage, targetBatch)
                .then((blob: Blob) => {
                    if (isCancelled) return;
                    setPdfUrl(prev => {
                        if (prev) URL.revokeObjectURL(prev);
                        return URL.createObjectURL(blob);
                    });
                    setPdfLoadedBatch(targetBatch);
                })
                .catch(err => {
                    if (isCancelled) return;
                    console.error('Error loading PDF:', err);
                    setPdfError('Không thể tải file PDF phiên bản này. Vui lòng thử lại sau.');
                })
                .finally(() => {
                    if (!isCancelled) setIsPdfLoading(false);
                });

            return () => {
                isCancelled = true;
            };
        }
    }, [activeTab, idSeaVoyage, selectedBatch, batchesData, isOpen, pdfUrl, pdfLoadedBatch]);

    const { error: showError } = useToast();

    const toggleHaul = (haulNumber: number) => {
        setExpandedHauls(prev => prev.includes(haulNumber) ? prev.filter(n => n !== haulNumber) : [...prev, haulNumber]);
    };
    
    const toggleTransshipment = (index: number) => {
        setExpandedTransshipments(prev => prev.includes(index) ? prev.filter(n => n !== index) : [...prev, index]);
    };

    useEffect(() => {
        if (isOpen && idSeaVoyage) {
            fetchInitialData();
        } else {
            setTimeout(() => {
                setLog(null);
                setOriginalLog(null);
                setBatchesData(null);
                setSelectedBatch(null);
                setExpandedHauls([]);
                setExpandedTransshipments([]);
                setActiveTab('info');
                setPdfUrl(prev => {
                    if (prev) URL.revokeObjectURL(prev);
                    return null;
                });
                setPdfLoadedBatch(null);
                setIsPdfLoading(false);
                setPdfError(null);
            }, 0);
        }

        async function fetchInitialData() {
            try {
                setTimeout(() => setIsLoading(true), 0);
                
                // 1. Tải danh sách các lần chỉnh sửa (Batches)
                const bData = await miningLogBatchesAPI(idSeaVoyage!);
                setBatchesData(bData);

                let targetBatch: number | null = null;
                if (bData && bData.batches && bData.batches.length > 0) {
                    targetBatch = bData.currentBatch ?? bData.batches.find(b => b.isCurrent)?.numberBatch ?? bData.batches[bData.batches.length - 1]?.numberBatch ?? 0;
                    setSelectedBatch(targetBatch);
                }

                // 2. Tải chi tiết dữ liệu chuyến biển (ưu tiên theo batch nếu có)
                let data: MiningLogDto;
                if (targetBatch !== null) {
                    try {
                        data = await miningLogDetailByBatchAPI(idSeaVoyage!, targetBatch);
                    } catch {
                        data = await miningLogDetailAPI(idSeaVoyage!);
                    }
                } else {
                    data = await miningLogDetailAPI(idSeaVoyage!);
                }
                setLog(data);

                // 3. Tải dữ liệu bản gốc (Batch 0) để so sánh các thay đổi
                if (bData && bData.batches && bData.batches.some(b => b.numberBatch === 0)) {
                    if (targetBatch === 0) {
                        setOriginalLog(data);
                    } else {
                        try {
                            const origData = await miningLogDetailByBatchAPI(idSeaVoyage!, 0);
                            setOriginalLog(origData);
                        } catch (err) {
                            console.error('Không thể tải bản gốc 0:', err);
                        }
                    }
                }
            } catch (err) {
                showError((err as Error).message || 'Không thể tải chi tiết chuyến biển');
                onClose();
            } finally {
                setTimeout(() => setIsLoading(false), 0);
            }
        }
    }, [isOpen, idSeaVoyage]);

    const handleSelectBatch = async (batchNumber: number, switchToInfoTab: boolean = false) => {
        if (batchNumber === selectedBatch) return;
        try {
            setIsBatchLoading(true);
            setSelectedBatch(batchNumber);
            setPdfUrl(prev => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
            setPdfLoadedBatch(null);
            setPdfError(null);

            const data = await miningLogDetailByBatchAPI(idSeaVoyage!, batchNumber);
            setLog(data);
            if (batchNumber === 0 && !originalLog) {
                setOriginalLog(data);
            }
            if (switchToInfoTab) {
                setActiveTab('info');
            }
        } catch (err) {
            showError((err as Error).message || 'Không thể tải phiên bản đã chọn');
        } finally {
            setIsBatchLoading(false);
        }
    };

    const handleDownloadPdfFile = async (batchNumber?: number) => {
        if (!idSeaVoyage) return;
        try {
            const targetBatch = batchNumber !== undefined 
                ? batchNumber 
                : (selectedBatch !== null 
                    ? selectedBatch 
                    : (batchesData?.currentBatch ?? batchesData?.batches?.find(b => b.isCurrent)?.numberBatch ?? 0));
            const blob = await downloadMiningLogPdfAPI(idSeaVoyage, targetBatch);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const batchInfo = batchesData?.batches?.find(b => b.numberBatch === targetBatch);
            const suffix = batchInfo ? `_${batchInfo.title}` : (targetBatch !== undefined ? `_LanSua_${targetBatch}` : '');
            a.download = `NhatKyKhaiThac_${log?.shipName || 'ChuyenBien'}${suffix}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            showError('Không thể tải file PDF');
        }
    };

    if (!isOpen) return null;

    const currentBatchInfo = batchesData?.batches?.find(b => b.numberBatch === selectedBatch);
    const isViewingOlderBatch = batchesData && selectedBatch !== null && selectedBatch !== batchesData.currentBatch;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-container voyage-modal-container" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="modal-header-p" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    {/* Top Row: Title & Info on Left, Desktop Selector & Close Button on Right */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0, wordBreak: 'break-word' }}>
                                    {log?.shipName || 'Đang tải...'}
                                </h2>
                                {batchesData && (
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        backgroundColor: batchesData.totalUpdates > 0 ? '#eff6ff' : '#f1f5f9',
                                        color: batchesData.totalUpdates > 0 ? '#2563eb' : '#64748b',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        <History size={12} />
                                        {batchesData.totalUpdates > 0 ? `${batchesData.totalUpdates} lần sửa đổi` : 'Bản gốc ban đầu'}
                                    </span>
                                )}
                                {diffResult.totalChanges > 0 && (
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        backgroundColor: '#fef3c7',
                                        color: '#b45309',
                                        border: '1px solid #fde68a',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        <AlertTriangle size={12} color="#d97706" />
                                        {diffResult.totalChanges} mục đã sửa so với bản gốc
                                    </span>
                                )}
                            </div>
                            {log && (
                                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0', wordBreak: 'break-all' }}>
                                    Mã chuyến: {log.idtrip}
                                </p>
                            )}
                        </div>

                        {/* Right Area: Desktop Batch Selector & Close Button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            {batchesData && batchesData.batches && batchesData.batches.length > 0 && (
                                <div className="voyage-header-selector-desktop" style={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    padding: '4px 8px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <History size={15} color="#475569" />
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Phiên bản:</span>
                                    <select
                                        value={selectedBatch !== null ? selectedBatch : (batchesData.currentBatch ?? 0)}
                                        onChange={(e) => handleSelectBatch(Number(e.target.value))}
                                        disabled={isBatchLoading}
                                        style={{
                                            border: 'none',
                                            outline: 'none',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: '#0f172a',
                                            backgroundColor: 'transparent',
                                            cursor: 'pointer',
                                            padding: '2px 4px'
                                        }}
                                    >
                                        {batchesData.batches.map(b => (
                                            <option key={b.numberBatch} value={b.numberBatch}>
                                                {b.title} {b.isCurrent ? '(Hiện tại)' : ''} - {new Date(b.changedAt).toLocaleDateString('vi-VN')} ({b.totalChanges} thay đổi)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <button 
                                onClick={onClose} 
                                className="btn btn-text" 
                                style={{ padding: '8px', color: '#64748b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                aria-label="Đóng"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Selector Bar (Only on Mobile <= 768px) */}
                    {batchesData && batchesData.batches && batchesData.batches.length > 0 && (
                        <div className="voyage-header-selector-mobile" style={{
                            marginTop: '10px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <History size={15} color="#475569" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Phiên bản:</span>
                            <select
                                value={selectedBatch !== null ? selectedBatch : (batchesData.currentBatch ?? 0)}
                                onChange={(e) => handleSelectBatch(Number(e.target.value))}
                                disabled={isBatchLoading}
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#0f172a',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                    width: '100%',
                                    minWidth: 0
                                }}
                            >
                                {batchesData.batches.map(b => (
                                    <option key={b.numberBatch} value={b.numberBatch}>
                                        {b.title} {b.isCurrent ? '(Hiện tại)' : ''} - {new Date(b.changedAt).toLocaleDateString('vi-VN')} ({b.totalChanges} thay đổi)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Banner cảnh báo khi đang xem bản cũ hoặc có chỉnh sửa so với bản gốc */}
                {isViewingOlderBatch ? (
                    <div style={{
                        backgroundColor: '#fffbeb',
                        borderBottom: '1px solid #fde68a',
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontSize: '13px', flex: 1, minWidth: '220px' }}>
                            <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />
                            <span>
                                Đang xem <strong>{currentBatchInfo?.title || `Bản sửa ${selectedBatch}`}</strong> 
                                {currentBatchInfo ? ` (${new Date(currentBatchInfo.changedAt).toLocaleDateString('vi-VN')})` : ''}. 
                                {diffResult.totalChanges > 0 ? (
                                    <> Đã đánh dấu <strong>{diffResult.totalChanges} giá trị</strong> sửa đổi so với bản gốc ban đầu.</>
                                ) : (
                                    <> Dữ liệu lịch sử đã lưu.</>
                                )}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {diffResult.totalChanges > 0 && activeTab !== 'history' && (
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className="btn"
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        borderRadius: '6px',
                                        backgroundColor: '#ffffff',
                                        color: '#b45309',
                                        border: '1px solid #fcd34d',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    Xem chi tiết ({diffResult.totalChanges} thay đổi)
                                </button>
                            )}
                            <button
                                onClick={() => handleSelectBatch(batchesData.currentBatch)}
                                className="btn voyage-warning-btn"
                                style={{
                                    padding: '6px 14px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    backgroundColor: '#fef3c7',
                                    color: '#b45309',
                                    border: '1px solid #fcd34d',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Quay lại bản mới nhất
                            </button>
                        </div>
                    </div>
                ) : diffResult.totalChanges > 0 ? (
                    <div style={{
                        backgroundColor: '#fffdf5',
                        borderBottom: '1px solid #fef08a',
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#854d0e', fontSize: '13px' }}>
                            <AlertTriangle size={15} color="#ca8a04" style={{ flexShrink: 0 }} />
                            <span>
                                Bản này có <strong>{diffResult.totalChanges} giá trị đã sửa đổi</strong> so với Bản gốc ban đầu (các mục sửa được đánh dấu màu hổ phách).
                            </span>
                        </div>
                        {activeTab !== 'history' && (
                            <button
                                onClick={() => setActiveTab('history')}
                                className="btn"
                                style={{
                                    padding: '4px 10px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    backgroundColor: '#fef08a',
                                    color: '#854d0e',
                                    border: '1px solid #facc15',
                                    cursor: 'pointer'
                                }}
                            >
                                Danh sách {diffResult.totalChanges} thay đổi
                            </button>
                        )}
                    </div>
                ) : null}

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
                        <div className="flex modal-tabs-p voyage-modal-tabs" style={{ borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
                            {(() => {
                                const infoHasDiff = diffResult.diffs.some(d => d.category === 'info');
                                const crewHasDiff = diffResult.diffs.some(d => d.category === 'crew');
                                const haulHasDiff = diffResult.diffs.some(d => d.category === 'haul');
                                const transshipHasDiff = diffResult.diffs.some(d => d.category === 'transship');
                                const rareFishHasDiff = diffResult.diffs.some(d => d.category === 'rareFish');

                                return [
                                    { label: 'Thông tin chung', key: 'info', Icon: Info, hasDiff: infoHasDiff },
                                    { label: 'Bản đồ', key: 'map', Icon: Map, hasDiff: false },
                                    { label: 'Thuyền viên', key: 'crew', Icon: Users, hasDiff: crewHasDiff },
                                    { label: 'Nhật ký khai thác', key: 'log', Icon: BookOpen, hasDiff: haulHasDiff },
                                    { label: 'Chuyển tải', key: 'transship', Icon: ArrowRightLeft, hasDiff: transshipHasDiff },
                                    { label: 'Động vật quý hiếm', key: 'rareFish', Icon: Fish, hasDiff: rareFishHasDiff },
                                    { label: 'Lịch sử thay đổi', key: 'history', Icon: History, hasDiff: false },
                                    { label: 'File PDF', key: 'pdf', Icon: FileBadge, hasDiff: false }
                                ].map(tabObj => {
                                    const { label: tab, key: tabKey, Icon, hasDiff } = tabObj;
                                    const isActive = activeTab === tabKey;
                                    let badgeText = '';
                                    if (tabKey === 'log') badgeText = `(${log?.fishingHauls?.length || 0})`;
                                    if (tabKey === 'transship') badgeText = `(${log?.transshipmentEvents?.length || 0})`;
                                    if (tabKey === 'rareFish') badgeText = `(${log?.rareFishReports?.length || 0})`;
                                    if (tabKey === 'history' && batchesData?.batches) badgeText = `(${batchesData.batches.length})`;

                                    return (
                                        <button 
                                            key={tabKey}
                                            className={`btn btn-text ${isActive ? 'font-bold' : ''} voyage-tab-button`}
                                            style={{ 
                                                padding: '14px 18px', 
                                                borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent', 
                                                borderRadius: 0, 
                                                color: isActive ? '#3b82f6' : '#64748b',
                                                whiteSpace: 'nowrap',
                                                fontSize: '13px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                flexShrink: 0
                                            }}
                                            onClick={() => setActiveTab(tabKey as any)}
                                        >
                                            <Icon size={16} />
                                            <span>{tab} {badgeText}</span>
                                            {hasDiff && (
                                                <span 
                                                    style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }} 
                                                    title="Có mục đã sửa đổi so với bản gốc" 
                                                />
                                            )}
                                        </button>
                                    );
                                });
                            })()}
                        </div>

                        {/* Content Area */}
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            {activeTab === 'info' && (
                                <div className="modal-body-p" style={{ backgroundColor: '#f1f5f9' }}>
                                    <div className="responsive-grid-2 gap-md">
                                        
                                        {/* Card 1: Thông tin Tàu & Chủ Tàu */}
                                        <div className="voyage-info-card" style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                                            <h3 className="flex items-center gap-sm" style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                                                <Ship size={20} color="#3b82f6" /> 
                                                <span>Hồ sơ Tàu & Chủ tàu</span>
                                            </h3>
                                            
                                            <div className="responsive-grid-2 gap-md">
                                                <div>
                                                    <InfoRow icon={Ship} label="Tên tàu / Biển số" value={log.shipName} diffKey="shipName" />
                                                    <InfoRow icon={User} label="Họ tên chủ tàu" value={log.shipOwnerFullName} diffKey="shipOwnerFullName" />
                                                    <InfoRow icon={CreditCard} label="CCCD / CMND" value={log.shipOwnerCitizenId} diffKey="shipOwnerCitizenId" />
                                                    <InfoRow icon={Calendar} label="Ngày sinh" value={log.shipOwnerBirthDate ? new Date(log.shipOwnerBirthDate).toLocaleDateString('vi-VN') : null} diffKey="shipOwnerBirthDate" />
                                                    <InfoRow icon={Phone} label="Điện thoại" value={log.shipOwnerPhone} diffKey="shipOwnerPhone" />
                                                    <InfoRow icon={Mail} label="Email" value={log.shipOwnerEmail} diffKey="shipOwnerEmail" />
                                                    <InfoRow icon={MapPin} label="Địa chỉ" value={log.shipOwnerAddress} diffKey="shipOwnerAddress" />
                                                </div>
                                                <div>
                                                    <InfoRow icon={Briefcase} label="Loại nghề chính" value={log.mainOccupation ? `${log.mainOccupation.name} (${log.mainOccupation.code})` : null} diffKey="mainOccupation" />
                                                    <InfoRow icon={ClipboardCheck} label="Giấy phép khai thác" value={log.miningLicenseNumber ? `${log.miningLicenseNumber} ${log.expirationDateOfMiningLicenseNumber ? '(Hạn: ' + new Date(log.expirationDateOfMiningLicenseNumber).toLocaleDateString('vi-VN') + ')' : ''}` : null} diffKey="miningLicenseNumber" />
                                                    <InfoRow icon={Anchor} label="Loại tàu (Type)" value={log.type} diffKey="type" />
                                                    <InfoRow icon={Ruler} label="Kích thước (K1 - K2)" value={`${log.dimension1}m - ${log.dimension2}m`} diffKey="dimensions" />
                                                    <InfoRow icon={Scale} label="Quy cách ngư cụ" value={log.fishingGearSpecifications} diffKey="fishingGearSpecifications" />
                                                    {(log.secondaryOccupation1 || log.secondaryOccupation2) && (
                                                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0' }}>
                                                            <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nghề phụ</div>
                                                            {log.secondaryOccupation1 && <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '8px' }}>• {log.secondaryOccupation1.name}</div>}
                                                            {log.secondaryOccupation2 && <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>• {log.secondaryOccupation2.name}</div>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 2: Thông tin Chuyến Biển */}
                                        <div className="voyage-info-card" style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                                            <h3 className="flex items-center gap-sm" style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                                                <Navigation size={20} color="#10b981" /> 
                                                <span>Lịch trình Chuyến biển</span>
                                            </h3>
                                            
                                            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                                                <InfoRow icon={Hash} label="Mã chuyến biển (Trip ID)" value={<span style={{ color: '#2563eb', fontFamily: 'monospace', fontSize: '15px' }}>{log.idtrip}</span>} />
                                            </div>

                                            <div className="flex-1 flex flex-col gap-md">
                                                {/* Khu vực xuất bến */}
                                                <div style={{ padding: '16px', border: '1px solid #e0e7ff', borderRadius: '8px', backgroundColor: '#eef2ff' }}>
                                                    <div className="flex items-center gap-xs" style={{ color: '#4338ca', fontWeight: 700, marginBottom: '16px', fontSize: '15px' }}>
                                                        <LogOut size={18} />
                                                        <span>THÔNG TIN XUẤT BẾN</span>
                                                    </div>
                                                    <InfoRow icon={BookOpen} label="Số sổ xuất bến" value={log.departureRecordNo} diffKey="departureRecordNo" />
                                                    <InfoRow icon={CalendarClock} label="Ngày xuất bến" value={new Date(log.departureDate).toLocaleString('vi-VN')} diffKey="departureDate" />
                                                    <InfoRow icon={MapPin} label="Cảng xuất" value={log.portStart?.name} diffKey="portStart" />
                                                </div>

                                                {/* Khu vực cập bến */}
                                                {log.arrivalDate ? (
                                                    <div style={{ padding: '16px', border: '1px solid #dcfce7', borderRadius: '8px', backgroundColor: '#f0fdf4' }}>
                                                        <div className="flex items-center gap-xs" style={{ color: '#15803d', fontWeight: 700, marginBottom: '16px', fontSize: '15px' }}>
                                                            <LogIn size={18} />
                                                            <span>THÔNG TIN CẬP BẾN</span>
                                                        </div>
                                                        <InfoRow icon={BookOpen} label="Số sổ cập bến" value={log.arrivalRecordNo} diffKey="arrivalRecordNo" />
                                                        <InfoRow icon={CalendarClock} label="Ngày cập bến" value={new Date(log.arrivalDate).toLocaleString('vi-VN')} diffKey="arrivalDate" />
                                                        <InfoRow icon={MapPin} label="Cảng cập" value={log.portEnd?.name} diffKey="portEnd" />
                                                    </div>
                                                ) : (
                                                    <div style={{ padding: '16px', border: '1px dashed #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                                        <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '14px' }}>Chuyến biển chưa cập bến</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}

                            {activeTab === 'map' && (
                                <div className="map-layout">
                                    {/* Map Sidebar - Timeline */}
                                    <div className="map-sidebar">
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
                                    <div className="map-main">
                                        <VoyageMap log={log} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'crew' && (
                                <div className="modal-body-p">
                                    {diffResult.diffMap['crew.count'] && (
                                        <div style={{ marginBottom: '14px', padding: '10px 14px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />
                                            <span>
                                                Số lượng thuyền viên đã thay đổi: Bản gốc có <strong>{diffResult.diffMap['crew.count'].displayOriginal}</strong>, phiên bản này có <strong>{diffResult.diffMap['crew.count'].displayCurrent}</strong>.
                                            </span>
                                        </div>
                                    )}

                                    {log?.crew && log.crew.length > 0 ? (
                                        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                            <table className="table" style={{ width: '100%', minWidth: '550px', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Họ và tên</th>
                                                        <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Số CCCD</th>
                                                        <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Số điện thoại</th>
                                                        <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Vai trò</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {log.crew.map((member, idx) => {
                                                        const cKey = `crew.${member.citizenId || member.fullName || idx}`;
                                                        const diff = diffResult.diffMap[cKey];
                                                        const isNew = diff && diff.displayOriginal === '(Chưa có)';
                                                        const isModified = Boolean(diff && !isNew);

                                                        return (
                                                            <tr key={member.id || idx} style={{ 
                                                                borderBottom: '1px solid #f1f5f9',
                                                                backgroundColor: isModified ? '#fffbeb' : isNew ? '#f0fdf4' : 'transparent',
                                                                transition: 'background-color 0.2s ease'
                                                            }}>
                                                                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155', fontWeight: 500 }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                                        <span>{member.fullName}</span>
                                                                        {isModified && (
                                                                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: '#f59e0b', color: '#fff' }}>
                                                                                ĐÃ SỬA
                                                                            </span>
                                                                        )}
                                                                        {isNew && (
                                                                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: '#16a34a', color: '#fff' }}>
                                                                                THÊM MỚI
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                                                                    {member.citizenId || '-'}
                                                                </td>
                                                                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                                                                    <div>{member.phone || '-'}</div>
                                                                    {isModified && diff?.originalValue?.phone !== member.phone && (
                                                                        <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                                                                            Gốc: <strong style={{ textDecoration: 'line-through' }}>{diff?.originalValue?.phone || 'Trống'}</strong>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    <div>
                                                                        <span style={{ 
                                                                            display: 'inline-block', 
                                                                            padding: '4px 10px', 
                                                                            backgroundColor: member.crewRole?.code === 'TTR' ? '#e0f2fe' : (isModified ? '#fef3c7' : '#f1f5f9'), 
                                                                            color: member.crewRole?.code === 'TTR' ? '#0369a1' : (isModified ? '#b45309' : '#475569'), 
                                                                            borderRadius: '20px', 
                                                                            fontSize: '12px', 
                                                                            fontWeight: 600 
                                                                        }}>
                                                                            {member.crewRole?.description || member.crewRole?.code || 'Thuyền viên'}
                                                                        </span>
                                                                    </div>
                                                                    {isModified && diff?.originalValue?.crewRole && (
                                                                        <div style={{ fontSize: '11px', color: '#92400e', marginTop: '4px' }}>
                                                                            Gốc: <strong style={{ textDecoration: 'line-through' }}>{diff.originalValue.crewRole.description || diff.originalValue.crewRole.code}</strong>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}

                                                    {/* Danh sách thuyền viên bị xóa so với bản gốc */}
                                                    {diffResult.diffs.filter(d => d.key.startsWith('crew.removed.')).map((d) => (
                                                        <tr key={d.key} style={{ backgroundColor: '#fef2f2', borderBottom: '1px solid #fee2e2' }}>
                                                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#991b1b', textDecoration: 'line-through', fontWeight: 500 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                                    <span>{d.originalValue?.fullName || d.label.replace('Thuyền viên: ', '')}</span>
                                                                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: '#ef4444', color: '#fff', textDecoration: 'none' }}>
                                                                        ĐÃ XÓA
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#991b1b', textDecoration: 'line-through' }}>
                                                                {d.originalValue?.citizenId || '-'}
                                                            </td>
                                                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#991b1b', textDecoration: 'line-through' }}>
                                                                {d.originalValue?.phone || '-'}
                                                            </td>
                                                            <td style={{ padding: '12px 16px' }}>
                                                                <span style={{ 
                                                                    display: 'inline-block', 
                                                                    padding: '4px 10px', 
                                                                    backgroundColor: '#fee2e2', 
                                                                    color: '#991b1b', 
                                                                    borderRadius: '20px', 
                                                                    fontSize: '12px', 
                                                                    fontWeight: 600,
                                                                    textDecoration: 'line-through'
                                                                }}>
                                                                    {d.originalValue?.crewRole?.description || d.originalValue?.crewRole?.code || 'Thuyền viên'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
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
                                <div className="modal-body-p">
                                    {diffResult.diffMap['hauls.count'] && (
                                        <div style={{ marginBottom: '14px', padding: '10px 14px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />
                                            <span>
                                                Số lượng mẻ lưới đã thay đổi: Bản gốc có <strong>{diffResult.diffMap['hauls.count'].displayOriginal}</strong>, phiên bản này có <strong>{diffResult.diffMap['hauls.count'].displayCurrent}</strong>.
                                            </span>
                                        </div>
                                    )}

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
                                                    const haulKey = `haul.${haul.haulNumber}`;
                                                    const isHaulNew = Boolean(diffResult.diffMap[haulKey]);
                                                    const hasHaulChange = Boolean(diffResult.diffMap[`${haulKey}.hasChange`]);
                                                    const deployCoordDiff = diffResult.diffMap[`${haulKey}.deployCoord`];
                                                    const deployTimeDiff = diffResult.diffMap[`${haulKey}.deployTime`];
                                                    const haulCoordDiff = diffResult.diffMap[`${haulKey}.haulCoord`];
                                                    const haulTimeDiff = diffResult.diffMap[`${haulKey}.haulTime`];
                                                    const removedCatches = diffResult.diffs.filter(d => d.key.startsWith(`${haulKey}.catch.removed.`));

                                                    return (
                                                        <Fragment key={haul.haulNumber}>
                                                            <tr 
                                                                onClick={() => toggleHaul(haul.haulNumber)} 
                                                                style={{ 
                                                                    cursor: 'pointer', 
                                                                    backgroundColor: isExpanded ? '#eff6ff' : (hasHaulChange ? '#fffbeb' : isHaulNew ? '#f0fdf4' : 'transparent'),
                                                                    transition: 'background-color 0.2s ease'
                                                                }} 
                                                                className="hover:bg-slate-50 transition-colors"
                                                            >
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                                                    <div className="flex items-center justify-center gap-xs font-semibold" style={{ color: isHaulNew ? '#16a34a' : (hasHaulChange ? '#d97706' : '#2563eb') }}>
                                                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                                        <span>{haul.haulNumber}</span>
                                                                        {hasHaulChange && (
                                                                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', backgroundColor: '#f59e0b', color: '#fff' }}>
                                                                                ĐÃ SỬA
                                                                            </span>
                                                                        )}
                                                                        {isHaulNew && (
                                                                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', backgroundColor: '#16a34a', color: '#fff' }}>
                                                                                MỚI
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', backgroundColor: deployCoordDiff ? '#fef3c7' : 'transparent' }}>
                                                                    <div style={{ fontWeight: deployCoordDiff ? 600 : 'normal', color: deployCoordDiff ? '#b45309' : 'inherit' }}>
                                                                        {haul.deployLatitude.toFixed(4)}, {haul.deployLongitude.toFixed(4)}
                                                                    </div>
                                                                    {deployCoordDiff && (
                                                                        <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                                                                            Gốc: <strong style={{ textDecoration: 'line-through' }}>{deployCoordDiff.displayOriginal}</strong>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', backgroundColor: deployTimeDiff ? '#fef3c7' : 'transparent' }}>
                                                                    <div style={{ fontWeight: deployTimeDiff ? 600 : 'normal', color: deployTimeDiff ? '#b45309' : 'inherit' }}>
                                                                        {new Date(haul.deployTime).toLocaleString('vi-VN')}
                                                                    </div>
                                                                    {deployTimeDiff && (
                                                                        <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                                                                            Gốc: <strong style={{ textDecoration: 'line-through' }}>{deployTimeDiff.displayOriginal}</strong>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', backgroundColor: haulCoordDiff ? '#fef3c7' : 'transparent' }}>
                                                                    <div style={{ fontWeight: haulCoordDiff ? 600 : 'normal', color: haulCoordDiff ? '#b45309' : 'inherit' }}>
                                                                        {haul.haulLatitude.toFixed(4)}, {haul.haulLongitude.toFixed(4)}
                                                                    </div>
                                                                    {haulCoordDiff && (
                                                                        <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                                                                            Gốc: <strong style={{ textDecoration: 'line-through' }}>{haulCoordDiff.displayOriginal}</strong>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', backgroundColor: haulTimeDiff ? '#fef3c7' : 'transparent' }}>
                                                                    <div style={{ fontWeight: haulTimeDiff ? 600 : 'normal', color: haulTimeDiff ? '#b45309' : 'inherit' }}>
                                                                        {new Date(haul.haulTime).toLocaleString('vi-VN')}
                                                                    </div>
                                                                    {haulTimeDiff && (
                                                                        <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                                                                            Gốc: <strong style={{ textDecoration: 'line-through' }}>{haulTimeDiff.displayOriginal}</strong>
                                                                        </div>
                                                                    )}
                                                                </td>
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
                                                                                        {haul.catchDetails.map((catchItem, idx) => {
                                                                                            const fishId = catchItem.fish?.code || catchItem.fish?.idtypeOfFish;
                                                                                            const catchDiff = diffResult.diffMap[`${haulKey}.catch.${fishId}`];
                                                                                            const isCatchNew = catchDiff && catchDiff.displayOriginal.includes('Chưa có');
                                                                                            const isCatchModified = Boolean(catchDiff && !isCatchNew);

                                                                                            return (
                                                                                                <tr key={idx} style={{ backgroundColor: isCatchModified ? '#fffbeb' : isCatchNew ? '#f0fdf4' : 'transparent' }}>
                                                                                                    <td style={{ padding: '10px 16px', border: '1px solid #e2e8f0', fontSize: '14px', fontWeight: 500 }}>
                                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                                                                            <span>{catchItem.fish.vietnameseName}</span>
                                                                                                            {isCatchModified && (
                                                                                                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', backgroundColor: '#f59e0b', color: '#fff' }}>
                                                                                                                    ĐÃ SỬA
                                                                                                                </span>
                                                                                                            )}
                                                                                                            {isCatchNew && (
                                                                                                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', backgroundColor: '#16a34a', color: '#fff' }}>
                                                                                                                    THÊM MỚI
                                                                                                                </span>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </td>
                                                                                                    <td style={{ padding: '10px 16px', border: '1px solid #e2e8f0', fontSize: '13px', fontStyle: 'italic', color: '#64748b' }}>
                                                                                                        {catchItem.fish.scientificName}
                                                                                                    </td>
                                                                                                    <td style={{ padding: '10px 16px', border: '1px solid #e2e8f0', fontSize: '14px', textAlign: 'right', fontWeight: 600, color: isCatchModified ? '#b45309' : '#0f172a' }}>
                                                                                                        <div>{catchItem.weight} kg</div>
                                                                                                        {isCatchModified && catchDiff && (
                                                                                                            <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                                                                                                                Gốc: <strong style={{ textDecoration: 'line-through' }}>{catchDiff.displayOriginal}</strong>
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </td>
                                                                                                </tr>
                                                                                            );
                                                                                        })}

                                                                                        {/* Các loài cá bị xóa khỏi mẻ so với bản gốc */}
                                                                                        {removedCatches.map((rc) => (
                                                                                            <tr key={rc.key} style={{ backgroundColor: '#fef2f2' }}>
                                                                                                <td style={{ padding: '10px 16px', border: '1px solid #fecaca', fontSize: '14px', color: '#991b1b', textDecoration: 'line-through' }}>
                                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                                                                        <span>{rc.label.split(' - ')[1] || rc.label}</span>
                                                                                                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', backgroundColor: '#ef4444', color: '#fff', textDecoration: 'none' }}>
                                                                                                            ĐÃ XÓA
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </td>
                                                                                                <td style={{ padding: '10px 16px', border: '1px solid #fecaca', fontSize: '13px', fontStyle: 'italic', color: '#991b1b' }}>-</td>
                                                                                                <td style={{ padding: '10px 16px', border: '1px solid #fecaca', fontSize: '14px', textAlign: 'right', fontWeight: 600, color: '#991b1b', textDecoration: 'line-through' }}>
                                                                                                    {rc.displayOriginal}
                                                                                                </td>
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

                                                {/* Danh sách mẻ lưới bị xóa so với bản gốc */}
                                                {diffResult.diffs.filter(d => d.key.startsWith('haul.removed.')).map((rd) => (
                                                    <tr key={rd.key} style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                                                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#991b1b', fontWeight: 600 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                                <span style={{ textDecoration: 'line-through' }}>{rd.label.replace('Mẻ lưới số ', '')}</span>
                                                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', backgroundColor: '#ef4444', color: '#fff' }}>
                                                                    ĐÃ XÓA
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td colSpan={5} style={{ padding: '12px 16px', color: '#991b1b', textDecoration: 'line-through' }}>
                                                            Mẻ này có trong bản gốc ({rd.displayOriginal}) nhưng đã bị xóa bỏ khỏi danh sách ở bản này.
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'transship' && (
                                <div className="modal-body-p">
                                    {diffResult.diffMap['transship.count'] && (
                                        <div style={{ marginBottom: '14px', padding: '10px 14px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />
                                            <span>
                                                Số lần chuyển tải đã thay đổi: Bản gốc có <strong>{diffResult.diffMap['transship.count'].displayOriginal}</strong>, phiên bản này có <strong>{diffResult.diffMap['transship.count'].displayCurrent}</strong>.
                                            </span>
                                        </div>
                                    )}

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
                                                    const tsKey = `transship.${index}`;
                                                    const tsNew = Boolean(diffResult.diffMap[tsKey]);
                                                    const sellerDiff = diffResult.diffMap[`${tsKey}.shipNameSeller`];
                                                    const timeDiff = diffResult.diffMap[`${tsKey}.time`];
                                                    const hasChange = Boolean(sellerDiff || timeDiff);

                                                    return (
                                                        <Fragment key={index}>
                                                            <tr 
                                                                onClick={() => toggleTransshipment(index)} 
                                                                style={{ 
                                                                    cursor: 'pointer', 
                                                                    backgroundColor: isExpanded ? '#f0fdf4' : (hasChange ? '#fffbeb' : tsNew ? '#f0fdf4' : 'transparent'),
                                                                    transition: 'background-color 0.2s ease'
                                                                }} 
                                                                className="hover:bg-slate-50 transition-colors"
                                                            >
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                                                    <div className="flex items-center justify-center gap-xs font-semibold text-emerald-600">
                                                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                                        <span>{index + 1}</span>
                                                                        {hasChange && (
                                                                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', backgroundColor: '#f59e0b', color: '#fff' }}>
                                                                                ĐÃ SỬA
                                                                            </span>
                                                                        )}
                                                                        {tsNew && (
                                                                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', backgroundColor: '#16a34a', color: '#fff' }}>
                                                                                MỚI
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', backgroundColor: sellerDiff ? '#fef3c7' : 'transparent' }}>
                                                                    <div style={{ fontWeight: sellerDiff ? 600 : 'normal', color: sellerDiff ? '#b45309' : 'inherit' }}>
                                                                        {event.shipNameSeller} {event.departureRecordNoSeller ? `(${event.departureRecordNoSeller})` : ''}
                                                                    </div>
                                                                    {sellerDiff && (
                                                                        <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                                                                            Gốc: <strong style={{ textDecoration: 'line-through' }}>{sellerDiff.displayOriginal}</strong>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>{event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}</td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', backgroundColor: timeDiff ? '#fef3c7' : 'transparent' }}>
                                                                    <div style={{ fontWeight: timeDiff ? 600 : 'normal', color: timeDiff ? '#b45309' : 'inherit' }}>
                                                                        {new Date(event.transshipmentTime).toLocaleString('vi-VN')}
                                                                    </div>
                                                                    {timeDiff && (
                                                                        <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                                                                            Gốc: <strong style={{ textDecoration: 'line-through' }}>{timeDiff.displayOriginal}</strong>
                                                                        </div>
                                                                    )}
                                                                </td>
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

                            {activeTab === 'rareFish' && (
                                <div className="modal-body-p">
                                    {diffResult.diffMap['rareFish.count'] && (
                                        <div style={{ marginBottom: '14px', padding: '10px 14px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />
                                            <span>
                                                Số lần ghi nhận động vật quý hiếm đã thay đổi: Bản gốc có <strong>{diffResult.diffMap['rareFish.count'].displayOriginal}</strong>, phiên bản này có <strong>{diffResult.diffMap['rareFish.count'].displayCurrent}</strong>.
                                            </span>
                                        </div>
                                    )}

                                    {log?.rareFishReports && log.rareFishReports.length > 0 ? (
                                        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                            <table className="table" style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
                                                <thead style={{ backgroundColor: '#f8fafc' }}>
                                                    <tr>
                                                        <th style={{ padding: '12px 16px', border: '1px solid #e2e8f0', textAlign: 'center', width: '80px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Mẻ số</th>
                                                        <th style={{ padding: '12px 16px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Tên loài quý hiếm</th>
                                                        <th style={{ padding: '12px 16px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Thời gian bắt gặp</th>
                                                        <th style={{ padding: '12px 16px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Số lượng</th>
                                                        <th style={{ padding: '12px 16px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Khối lượng (kg)</th>
                                                        <th style={{ padding: '12px 16px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Kích thước (cm)</th>
                                                        <th style={{ padding: '12px 16px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Tình trạng</th>
                                                        <th style={{ padding: '12px 16px', border: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Biện pháp xử lý</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {log.rareFishReports.map((report, idx) => {
                                                        const rKey = `rareFish.${report.haulNumber}.${idx}`;
                                                        const rNew = Boolean(diffResult.diffMap[rKey]);
                                                        const speciesDiff = diffResult.diffMap[`${rKey}.species`];
                                                        const qtyDiff = diffResult.diffMap[`${rKey}.quantity`];
                                                        const weightDiff = diffResult.diffMap[`${rKey}.weight`];
                                                        const sizeDiff = diffResult.diffMap[`${rKey}.size`];
                                                        const statusDiff = diffResult.diffMap[`${rKey}.status`];
                                                        const progressDiff = diffResult.diffMap[`${rKey}.progress`];
                                                        const hasChange = Boolean(speciesDiff || qtyDiff || weightDiff || sizeDiff || statusDiff || progressDiff);

                                                        return (
                                                            <tr 
                                                                key={idx} 
                                                                style={{ 
                                                                    borderBottom: '1px solid #e2e8f0',
                                                                    backgroundColor: hasChange ? '#fffbeb' : rNew ? '#f0fdf4' : 'transparent',
                                                                    transition: 'background-color 0.2s ease'
                                                                }}
                                                            >
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                                        <span>Mẻ {report.haulNumber}</span>
                                                                        {hasChange && (
                                                                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', backgroundColor: '#f59e0b', color: '#fff' }}>
                                                                                ĐÃ SỬA
                                                                            </span>
                                                                        )}
                                                                        {rNew && (
                                                                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', backgroundColor: '#16a34a', color: '#fff' }}>
                                                                                MỚI
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', fontWeight: 600, color: '#0f172a', backgroundColor: speciesDiff ? '#fef3c7' : 'transparent' }}>
                                                                    <div>{report.rareSpecieName}</div>
                                                                    {speciesDiff && (
                                                                        <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                                                                            Gốc: <strong style={{ textDecoration: 'line-through' }}>{speciesDiff.displayOriginal}</strong>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', color: '#475569', fontSize: '13px' }}>
                                                                    {report.timeOfEncounter ? new Date(report.timeOfEncounter).toLocaleString('vi-VN') : '-'}
                                                                </td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600, backgroundColor: qtyDiff ? '#fef3c7' : 'transparent' }}>
                                                                    <div>{report.quantity} con</div>
                                                                    {qtyDiff && (
                                                                        <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                                                                            Gốc: <strong style={{ textDecoration: 'line-through' }}>{qtyDiff.displayOriginal}</strong>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600, backgroundColor: weightDiff ? '#fef3c7' : 'transparent' }}>
                                                                    <div>{report.weight} kg</div>
                                                                    {weightDiff && (
                                                                        <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                                                                            Gốc: <strong style={{ textDecoration: 'line-through' }}>{weightDiff.displayOriginal}</strong>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600, backgroundColor: sizeDiff ? '#fef3c7' : 'transparent' }}>
                                                                    <div>{report.size} cm</div>
                                                                    {sizeDiff && (
                                                                        <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                                                                            Gốc: <strong style={{ textDecoration: 'line-through' }}>{sizeDiff.displayOriginal}</strong>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', textAlign: 'center', backgroundColor: statusDiff ? '#fef3c7' : 'transparent' }}>
                                                                    <span style={{
                                                                        display: 'inline-block',
                                                                        padding: '3px 8px',
                                                                        borderRadius: '12px',
                                                                        fontSize: '12px',
                                                                        fontWeight: 600,
                                                                        backgroundColor: report.status?.toLowerCase().includes('sống') ? '#dcfce7' : report.status?.toLowerCase().includes('chết') ? '#fee2e2' : '#f1f5f9',
                                                                        color: report.status?.toLowerCase().includes('sống') ? '#15803d' : report.status?.toLowerCase().includes('chết') ? '#991b1b' : '#475569'
                                                                    }}>
                                                                        {report.status || '-'}
                                                                    </span>
                                                                    {statusDiff && (
                                                                        <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                                                                            Gốc: <strong style={{ textDecoration: 'line-through' }}>{statusDiff.displayOriginal}</strong>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#334155', backgroundColor: progressDiff ? '#fef3c7' : 'transparent' }}>
                                                                    <div>{report.progress || '-'}</div>
                                                                    {progressDiff && (
                                                                        <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                                                                            Gốc: <strong style={{ textDecoration: 'line-through' }}>{progressDiff.displayOriginal}</strong>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}

                                                    {/* Danh sách báo cáo động vật quý hiếm bị xóa so với bản gốc */}
                                                    {diffResult.diffs.filter(d => d.key.startsWith('rareFish.removed.')).map((rd) => (
                                                        <tr key={rd.key} style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                                                            <td style={{ padding: '12px 16px', textAlign: 'center', color: '#991b1b', fontWeight: 700 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                                    <span style={{ textDecoration: 'line-through' }}>Mẻ {rd.originalValue?.haulNumber || '-'}</span>
                                                                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', backgroundColor: '#ef4444', color: '#fff' }}>
                                                                        ĐÃ XÓA
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '12px 16px', color: '#991b1b', textDecoration: 'line-through', fontWeight: 600 }}>
                                                                {rd.originalValue?.rareSpecieName || rd.label}
                                                            </td>
                                                            <td style={{ padding: '12px 16px', color: '#991b1b', textDecoration: 'line-through' }}>
                                                                {rd.originalValue?.timeOfEncounter ? new Date(rd.originalValue.timeOfEncounter).toLocaleString('vi-VN') : '-'}
                                                            </td>
                                                            <td style={{ padding: '12px 16px', textAlign: 'right', color: '#991b1b', textDecoration: 'line-through' }}>
                                                                {rd.originalValue?.quantity} con
                                                            </td>
                                                            <td style={{ padding: '12px 16px', textAlign: 'right', color: '#991b1b', textDecoration: 'line-through' }}>
                                                                {rd.originalValue?.weight} kg
                                                            </td>
                                                            <td style={{ padding: '12px 16px', textAlign: 'right', color: '#991b1b', textDecoration: 'line-through' }}>
                                                                {rd.originalValue?.size} cm
                                                            </td>
                                                            <td style={{ padding: '12px 16px', textAlign: 'center', color: '#991b1b', textDecoration: 'line-through' }}>
                                                                {rd.originalValue?.status || '-'}
                                                            </td>
                                                            <td style={{ padding: '12px 16px', color: '#991b1b', textDecoration: 'line-through' }}>
                                                                {rd.originalValue?.progress || '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="flex justify-center items-center bg-slate-50" style={{ height: '300px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                                            <div className="text-center text-slate-500">
                                                <p style={{ marginBottom: '8px', fontSize: '28px' }}>🐬</p>
                                                <p className="font-semibold text-slate-700" style={{ marginBottom: '4px' }}>Không có ghi nhận động vật quý hiếm</p>
                                                <p className="text-xs text-slate-400">Chuyến biển này không phát hiện hoặc không có báo cáo về các loài động vật/thủy sản nguy cấp, quý hiếm.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="modal-body-p" style={{ backgroundColor: '#f8fafc', flex: 1 }}>
                                    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                                        {/* Card tóm tắt */}
                                        <div style={{
                                            backgroundColor: '#ffffff',
                                            borderRadius: '12px',
                                            padding: '20px 24px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                            border: '1px solid #e2e8f0',
                                            marginBottom: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            flexWrap: 'wrap',
                                            gap: '16px'
                                        }}>
                                            <div>
                                                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                                    <History size={20} color="#2563eb" />
                                                    <span>Lịch sử chỉnh sửa chuyến biển</span>
                                                </h3>
                                                <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px', marginBottom: 0 }}>
                                                    {batchesData?.totalUpdates && batchesData.totalUpdates > 0 ? (
                                                        <>Chuyến biển đã sửa <strong>{batchesData.totalUpdates}</strong> lần. Tổng cộng <strong>{batchesData?.batches?.length || 0}</strong> phiên bản được ghi nhận.</>
                                                    ) : (
                                                        <>Chưa có lần sửa đổi nào. Đây là dữ liệu bản gốc ban đầu.</>
                                                    )}
                                                </p>
                                            </div>
                                            {batchesData && selectedBatch !== batchesData.currentBatch && (
                                                <button
                                                    onClick={() => handleSelectBatch(batchesData.currentBatch)}
                                                    className="btn btn-primary"
                                                    style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                                >
                                                    <CheckCircle2 size={16} />
                                                    <span>Xem bản mới nhất</span>
                                                </button>
                                            )}
                                        </div>

                                        {/* Bảng đối chiếu các giá trị đã sửa đổi so với Bản gốc ban đầu (Batch 0) */}
                                        {selectedBatch === 0 ? (
                                            <div style={{
                                                backgroundColor: '#ffffff',
                                                borderRadius: '12px',
                                                padding: '20px 24px',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                border: '1px solid #e2e8f0',
                                                marginBottom: '24px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 700, fontSize: '15px' }}>
                                                    <CheckCircle2 size={18} />
                                                    <span>Bản gốc ban đầu (Batch 0)</span>
                                                </div>
                                                <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                                                    Đây là phiên bản dữ liệu gốc ban đầu của chuyến biển khi mới tạo/đồng bộ. Khi xem các phiên bản sửa đổi tiếp theo (Lần sửa 1, Lần sửa 2...), hệ thống sẽ tự động đối chiếu và làm nổi bật các giá trị khác biệt so với bản này.
                                                </p>
                                            </div>
                                        ) : diffResult.totalChanges === 0 ? (
                                            <div style={{
                                                backgroundColor: '#ffffff',
                                                borderRadius: '12px',
                                                padding: '20px 24px',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                border: '1px solid #e2e8f0',
                                                marginBottom: '24px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 700, fontSize: '15px' }}>
                                                    <CheckCircle2 size={18} />
                                                    <span>Không có giá trị nào thay đổi so với Bản gốc ban đầu</span>
                                                </div>
                                                <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                                                    Mọi thông số của phiên bản này hoàn toàn trùng khớp với Bản gốc ban đầu (Batch 0).
                                                </p>
                                            </div>
                                        ) : (
                                            <div style={{
                                                backgroundColor: '#ffffff',
                                                borderRadius: '12px',
                                                padding: '20px 24px',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                border: '1px solid #e2e8f0',
                                                marginBottom: '24px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                                                    <div>
                                                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                            <AlertTriangle size={18} color="#d97706" />
                                                            <span>Chi tiết đối chiếu với Bản gốc ban đầu</span>
                                                            <span style={{
                                                                fontSize: '11px',
                                                                fontWeight: 700,
                                                                padding: '2px 8px',
                                                                borderRadius: '12px',
                                                                backgroundColor: '#fef3c7',
                                                                color: '#b45309',
                                                                border: '1px solid #fde68a'
                                                            }}>
                                                                {diffResult.totalChanges} mục thay đổi
                                                            </span>
                                                        </h4>
                                                        <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>
                                                            Đang đối chiếu dữ liệu giữa <strong>{currentBatchInfo?.title || `Bản sửa ${selectedBatch}`}</strong> và <strong>Bản gốc ban đầu (Batch 0)</strong>
                                                        </p>
                                                    </div>

                                                    {/* Filter categories */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                        {[
                                                            { key: 'all', label: `Tất cả (${diffResult.totalChanges})` },
                                                            { key: 'info', label: `Hồ sơ & Lịch trình (${diffResult.diffs.filter(d => d.category === 'info').length})` },
                                                            { key: 'crew', label: `Thuyền viên (${diffResult.diffs.filter(d => d.category === 'crew').length})` },
                                                            { key: 'haul', label: `Mẻ lưới (${diffResult.diffs.filter(d => d.category === 'haul').length})` },
                                                            { key: 'transship', label: `Chuyển tải (${diffResult.diffs.filter(d => d.category === 'transship').length})` },
                                                            { key: 'rareFish', label: `Động vật quý hiếm (${diffResult.diffs.filter(d => d.category === 'rareFish').length})` }
                                                        ].map(tab => {
                                                            const isSelected = diffCategoryFilter === tab.key;
                                                            return (
                                                                <button
                                                                    key={tab.key}
                                                                    onClick={() => setDiffCategoryFilter(tab.key as any)}
                                                                    style={{
                                                                        padding: '4px 10px',
                                                                        borderRadius: '16px',
                                                                        border: `1px solid ${isSelected ? '#2563eb' : '#cbd5e1'}`,
                                                                        backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                                                                        color: isSelected ? '#1d4ed8' : '#475569',
                                                                        fontSize: '12px',
                                                                        fontWeight: isSelected ? 600 : 500,
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.15s ease'
                                                                    }}
                                                                >
                                                                    {tab.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Bảng so sánh chi tiết */}
                                                <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                                    <table className="table" style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                        <thead style={{ backgroundColor: '#f8fafc' }}>
                                                            <tr>
                                                                <th style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontWeight: 600, width: '130px' }}>Phân loại</th>
                                                                <th style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Trường thông tin</th>
                                                                <th style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Giá trị gốc (Batch 0)</th>
                                                                <th style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Giá trị bản này</th>
                                                                <th style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b', fontWeight: 600, width: '90px' }}>Trạng thái</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredDiffs.map((d, idx) => {
                                                                const isNew = d.displayOriginal.includes('Chưa có') || d.originalValue === null;
                                                                const isRemoved = d.displayCurrent.includes('Đã xóa') || d.currentValue === null;
                                                                const isModified = !isNew && !isRemoved;

                                                                return (
                                                                    <tr key={d.key || idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfc' }}>
                                                                        <td style={{ padding: '10px 14px' }}>
                                                                            <span style={{
                                                                                display: 'inline-block',
                                                                                fontSize: '11px',
                                                                                fontWeight: 600,
                                                                                padding: '2px 8px',
                                                                                borderRadius: '6px',
                                                                                backgroundColor: '#f1f5f9',
                                                                                color: '#475569'
                                                                            }}>
                                                                                {d.categoryLabel}
                                                                            </span>
                                                                        </td>
                                                                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>
                                                                            {d.label}
                                                                        </td>
                                                                        <td style={{ padding: '10px 14px' }}>
                                                                            <span style={{ textDecoration: isModified || isRemoved ? 'line-through' : 'none', color: isNew ? '#94a3b8' : '#991b1b', fontWeight: isModified || isRemoved ? 500 : 400 }}>
                                                                                {d.displayOriginal}
                                                                            </span>
                                                                        </td>
                                                                        <td style={{ padding: '10px 14px', color: isRemoved ? '#94a3b8' : isNew ? '#15803d' : '#b45309', fontWeight: 600 }}>
                                                                            {d.displayCurrent}
                                                                        </td>
                                                                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                                            {isModified && (
                                                                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                                                                                    SỬA ĐỔI
                                                                                </span>
                                                                            )}
                                                                            {isNew && (
                                                                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                                                                                    THÊM MỚI
                                                                                </span>
                                                                            )}
                                                                            {isRemoved && (
                                                                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
                                                                                    ĐÃ XÓA
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Timeline các phiên bản */}
                                        {batchesData?.batches && batchesData.batches.length > 0 ? (
                                            <div style={{ position: 'relative', paddingLeft: '8px' }}>
                                                {/* Đường nối dọc */}
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '23px',
                                                    top: '20px',
                                                    bottom: '20px',
                                                    width: '2px',
                                                    backgroundColor: '#e2e8f0',
                                                    zIndex: 0
                                                }} />

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
                                                    {[...batchesData.batches].reverse().map((b) => {
                                                        const isSelected = selectedBatch === b.numberBatch;
                                                        return (
                                                            <div
                                                                key={b.numberBatch}
                                                                style={{
                                                                    display: 'flex',
                                                                    gap: '12px',
                                                                    alignItems: 'flex-start'
                                                                }}
                                                            >
                                                                {/* Icon node số thứ tự */}
                                                                <div className="voyage-timeline-node" style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: isSelected ? '#2563eb' : (b.isCurrent ? '#10b981' : '#ffffff'),
                                                                    border: `2px solid ${isSelected ? '#2563eb' : (b.isCurrent ? '#10b981' : '#cbd5e1')}`,
                                                                    color: isSelected || b.isCurrent ? '#ffffff' : '#64748b',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontWeight: 700,
                                                                    fontSize: '13px',
                                                                    flexShrink: 0,
                                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                                                                }}>
                                                                    {b.numberBatch}
                                                                </div>

                                                                {/* Card chi tiết */}
                                                                <div className="voyage-timeline-card" style={{
                                                                    flex: 1,
                                                                    minWidth: 0,
                                                                    backgroundColor: '#ffffff',
                                                                    borderRadius: '12px',
                                                                    padding: '16px 20px',
                                                                    border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                                                    boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                                                                    transition: 'all 0.2s ease'
                                                                }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                                            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                                                                {b.title}
                                                                            </h4>
                                                                            {b.isCurrent && (
                                                                                <span style={{
                                                                                    backgroundColor: '#dcfce7',
                                                                                    color: '#15803d',
                                                                                    fontSize: '11px',
                                                                                    fontWeight: 700,
                                                                                    padding: '2px 8px',
                                                                                    borderRadius: '12px',
                                                                                    whiteSpace: 'nowrap'
                                                                                }}>
                                                                                    Bản hiện tại
                                                                                </span>
                                                                            )}
                                                                            {isSelected && (
                                                                                <span style={{
                                                                                    backgroundColor: '#dbeafe',
                                                                                    color: '#1e40af',
                                                                                    fontSize: '11px',
                                                                                    fontWeight: 700,
                                                                                    padding: '2px 8px',
                                                                                    borderRadius: '12px',
                                                                                    whiteSpace: 'nowrap'
                                                                                }}>
                                                                                    Đang xem
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* Nút hành động */}
                                                                        <div className="voyage-batch-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                            <button
                                                                                onClick={() => handleDownloadPdfFile(b.numberBatch)}
                                                                                className="btn btn-outline"
                                                                                title="Tải PDF phiên bản này"
                                                                                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                                                            >
                                                                                <Download size={14} />
                                                                                <span>Tải PDF</span>
                                                                            </button>
                                                                            {!isSelected ? (
                                                                                <button
                                                                                    onClick={() => handleSelectBatch(b.numberBatch, true)}
                                                                                    className="btn btn-primary"
                                                                                    style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                                                                >
                                                                                    <Eye size={14} />
                                                                                    <span>Xem bản này</span>
                                                                                </button>
                                                                            ) : (
                                                                                <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, padding: '6px 8px' }}>
                                                                                    ✓ Đang hiển thị
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#64748b', fontSize: '13px', flexWrap: 'wrap', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #f1f5f9' }}>
                                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <Calendar size={14} color="#94a3b8" />
                                                                            Thời gian: <strong style={{ color: '#334155' }}>{new Date(b.changedAt).toLocaleString('vi-VN')}</strong>
                                                                        </span>
                                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <GitCommit size={14} color="#94a3b8" />
                                                                            Số trường thay đổi: <strong style={{ color: b.totalChanges > 0 ? '#d97706' : '#64748b' }}>{b.totalChanges} thay đổi</strong>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', backgroundColor: '#ffffff', borderRadius: '12px' }}>
                                                Chưa có dữ liệu lịch sử thay đổi nào cho chuyến biển này.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        
                            {activeTab === 'pdf' && (
                                <div className="flex flex-col" style={{ padding: 0, flex: 1, height: '100%', minHeight: 0 }}>
                                    {/* Thanh thông tin phiên bản PDF trên máy tính */}
                                    <div className="voyage-pdf-header-desktop" style={{
                                        padding: '10px 24px',
                                        backgroundColor: '#f8fafc',
                                        borderBottom: '1px solid #e2e8f0',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '8px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                                            <FileBadge size={16} color="#3b82f6" />
                                            <span>
                                                Đang xem PDF: <strong>{currentBatchInfo ? currentBatchInfo.title : 'Bản hiện tại'}</strong>
                                                {currentBatchInfo && " (" + new Date(currentBatchInfo.changedAt).toLocaleString("vi-VN") + ")"}
                                            </span>
                                        </div>
                                        {pdfUrl && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <a
                                                    href={pdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-outline"
                                                    style={{ padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', textDecoration: 'none' }}
                                                >
                                                    <ExternalLink size={15} />
                                                    <span>Mở tab mới</span>
                                                </a>
                                                <button
                                                    onClick={() => handleDownloadPdfFile()}
                                                    className="btn btn-primary"
                                                    style={{ padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', cursor: 'pointer' }}
                                                >
                                                    <Download size={15} />
                                                    <span>Tải file PDF</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Thanh công cụ PDF trên điện thoại (Mobile) */}
                                    {pdfUrl && (
                                        <div className="voyage-pdf-actions-mobile" style={{
                                            padding: '10px 14px',
                                            backgroundColor: '#f8fafc',
                                            borderBottom: '1px solid #e2e8f0',
                                            flexDirection: 'column',
                                            gap: '8px'
                                        }}>
                                            <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <FileBadge size={14} color="#3b82f6" />
                                                <span>Phiên bản: <strong>{currentBatchInfo?.title || 'Bản hiện tại'}</strong></span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                                <a
                                                    href={pdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-primary"
                                                    style={{ flex: 1, padding: '8px 10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}
                                                >
                                                    <ExternalLink size={15} />
                                                    <span>Xem toàn màn hình</span>
                                                </a>
                                                <button
                                                    onClick={() => handleDownloadPdfFile()}
                                                    className="btn btn-outline"
                                                    style={{ flex: 1, padding: '8px 10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                                >
                                                    <Download size={15} />
                                                    <span>Tải về máy</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {isPdfLoading || isBatchLoading ? (
                                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang nạp file PDF phiên bản đã chọn...</div>
                                    ) : pdfUrl ? (
                                        <div style={{ flex: 1, height: '100%', minHeight: '60vh', position: 'relative' }}>
                                            <iframe 
                                                src={pdfUrl}
                                                style={{ width: '100%', height: '100%', minHeight: '60vh', border: 'none' }}
                                                title="PDF Viewer"
                                            />
                                        </div>
                                    ) : pdfError ? (
                                        <div style={{ padding: '40px', color: '#ef4444', textAlign: 'center' }}>{pdfError}</div>
                                    ) : (
                                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải PDF...</div>
                                    )}
                                </div>
                            )}

                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
