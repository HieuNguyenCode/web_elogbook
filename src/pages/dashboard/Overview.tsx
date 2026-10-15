import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
    Ship, 
    Radio, 
    Navigation, 
    Fish, 
    ArrowRightLeft, 
    RefreshCw, 
    AlertCircle, 
    Scale,
    Calendar,
    Layers
} from 'lucide-react';
import { getAdminReportAPI } from '../../features/API/report/ReportAPI';
import type { ReportDto, MonthlyVoyageReportDto } from '../../types/Report';
import { useToast } from '../../components/ToastContext';
import StatCard from './components/StatCard';
import FishBarChart from './components/FishBarChart';
import FishDoughnutChart from './components/FishDoughnutChart';
import TopFishTable from './components/TopFishTable';
import MonthlyWeightTrendChart from './components/MonthlyWeightTrendChart';
import MonthlyVoyageTrendChart from './components/MonthlyVoyageTrendChart';
import MonthlySummaryTable from './components/MonthlySummaryTable';
import './Overview.css';

export default function Overview() {
    const currentYear = useMemo(() => new Date().getFullYear(), []);
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [selectedTop, setSelectedTop] = useState<number>(5);
    const [selectedMonthLabel, setSelectedMonthLabel] = useState<string | null>(null);

    const [report, setReport] = useState<ReportDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { error: showError, success: showSuccess } = useToast();

    const fetchReport = useCallback(async (isManual = false) => {
        try {
            if (isManual) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setErrorMsg(null);

            const res = await getAdminReportAPI(selectedYear, selectedTop);
            setReport(res);

            if (isManual) {
                showSuccess('Cập nhật dữ liệu báo cáo thành công');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Không thể tải báo cáo';
            setErrorMsg(msg);
            showError(msg);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedYear, selectedTop, showError, showSuccess]);

    useEffect(() => {
        void fetchReport();
    }, [fetchReport]);

    // Danh sách 12 tháng từ API
    const months: MonthlyVoyageReportDto[] = useMemo(() => {
        const raw = report?.voyagesCountMonth || report?.VoyagesCountMonth || [];
        return Array.isArray(raw) ? raw : [];
    }, [report]);

    // Tổng hợp số liệu cả năm (Yearly KPI Totals)
    const yearlyStats = useMemo(() => {
        const countShip = Number(report?.countShip ?? report?.CountShip ?? 0);
        const departures = months.reduce((acc, m) => acc + Number(m.departuresThisMonthCount ?? m.DeparturesThisMonthCount ?? 0), 0);
        const catchWeight = months.reduce((acc, m) => acc + Number(m.sumWeightFishingHauls ?? m.SumWeightFishingHauls ?? 0), 0);
        const transWeight = months.reduce((acc, m) => acc + Number(m.sumWeightTransshipments ?? m.SumWeightTransshipments ?? 0), 0);
        const totalWeight = catchWeight + transWeight;
        const activeVoyages = months.reduce((max, m) => Math.max(max, Number(m.activeVoyagesCount ?? m.ActiveVoyagesCount ?? 0)), 0);

        return {
            countShip,
            departures,
            catchWeight,
            transWeight,
            totalWeight,
            activeVoyages
        };
    }, [report, months]);

    // Tổng hợp loài cá khai thác cả năm (gộp và cộng dồn theo tên)
    const yearlyTopHauls = useMemo(() => {
        const map = new Map<string, number>();
        months.forEach(m => {
            const list = m.topFishFishingHauls || m.TopFishFishingHauls || [];
            list.forEach(f => {
                const name = f.fishName || f.FishName || 'Chưa đặt tên';
                const weight = Number(f.totalWeight ?? f.TotalWeight ?? 0);
                map.set(name, (map.get(name) || 0) + weight);
            });
        });
        return Array.from(map.entries())
            .map(([fishName, totalWeight]) => ({ fishName, totalWeight }))
            .sort((a, b) => b.totalWeight - a.totalWeight);
    }, [months]);

    // Tổng hợp loài cá chuyển tải cả năm (gộp và cộng dồn theo tên)
    const yearlyTopTrans = useMemo(() => {
        const map = new Map<string, number>();
        months.forEach(m => {
            const list = (m as any).topFishTransshipments || (m as any).topFishTransshipment || 
                         (m as any).TopFishTransshipments || (m as any).TopFishTransshipment || [];
            list.forEach((f: any) => {
                const name = f.fishName || f.FishName || 'Chưa đặt tên';
                const weight = Number(f.totalWeight ?? f.TotalWeight ?? 0);
                map.set(name, (map.get(name) || 0) + weight);
            });
        });
        return Array.from(map.entries())
            .map(([fishName, totalWeight]) => ({ fishName, totalWeight }))
            .sort((a, b) => b.totalWeight - a.totalWeight);
    }, [months]);

    // Dữ liệu tháng đang được chọn để soi chi tiết cơ cấu loài cá
    const currentMonthData = useMemo(() => {
        if (!selectedMonthLabel) return null;
        return months.find(m => (m.timeLabel || m.TimeLabel) === selectedMonthLabel) || null;
    }, [months, selectedMonthLabel]);

    // Cơ cấu loài cá cho phần biểu đồ chi tiết phía dưới
    const speciesViewData = useMemo(() => {
        if (currentMonthData) {
            const catchWeight = Number(currentMonthData.sumWeightFishingHauls ?? currentMonthData.SumWeightFishingHauls ?? 0);
            const transWeight = Number(currentMonthData.sumWeightTransshipments ?? currentMonthData.SumWeightTransshipments ?? 0);
            const haulsFish = currentMonthData.topFishFishingHauls || currentMonthData.TopFishFishingHauls || [];
            const transFish = (currentMonthData as any).topFishTransshipments || (currentMonthData as any).topFishTransshipment || 
                              (currentMonthData as any).TopFishTransshipments || [];

            return {
                catchWeight,
                transWeight,
                haulsFish,
                transFish,
                scopeTitle: `Tháng ${selectedMonthLabel}`
            };
        } else {
            return {
                catchWeight: yearlyStats.catchWeight,
                transWeight: yearlyStats.transWeight,
                haulsFish: yearlyTopHauls,
                transFish: yearlyTopTrans,
                scopeTitle: `Cả năm ${selectedYear}`
            };
        }
    }, [currentMonthData, selectedMonthLabel, yearlyStats, yearlyTopHauls, yearlyTopTrans, selectedYear]);

    const formatWeight = (kg: number) => {
        const kgStr = new Intl.NumberFormat('vi-VN').format(kg) + ' kg';
        if (kg >= 1000) {
            return {
                primary: `${(kg / 1000).toFixed(2)} tấn`,
                sub: kgStr
            };
        }
        return {
            primary: kgStr,
            sub: ''
        };
    };

    const catchFormatted = formatWeight(yearlyStats.catchWeight);
    const transFormatted = formatWeight(yearlyStats.transWeight);
    const totalFormatted = formatWeight(yearlyStats.totalWeight);

    if (isLoading) {
        return (
            <div className="card main-card h-full flex flex-col items-center justify-center" style={{ gap: '12px', color: '#64748b' }}>
                <div style={{
                    width: '36px',
                    height: '36px',
                    border: '3px solid #cbd5e1',
                    borderTopColor: '#2563eb',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                    Đang nạp báo cáo thống kê năm {selectedYear}...
                </span>
            </div>
        );
    }

    if (errorMsg && !report) {
        return (
            <div className="card main-card h-full flex flex-col items-center justify-center" style={{
                gap: '16px',
                padding: '24px',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <AlertCircle size={32} />
                </div>
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        Lỗi tải báo cáo tổng quan
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '6px 0 0 0', maxWidth: '420px' }}>
                        {errorMsg}
                    </p>
                </div>
                <button
                    onClick={() => void fetchReport(true)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '8px' }}
                >
                    <RefreshCw size={16} />
                    <span>Thử lại</span>
                </button>
            </div>
        );
    }

    return (
        <div className="overview-container">
            {/* Top Header & Year/Top Filter Bar (NẰM Ở NGOÀI card main-card) */}
            <div className="overview-header">
                <div className="overview-header-info">
                    <h1 className="overview-title">
                        Báo Cáo Tổng Quan Khai Thác & Chuyển Tải
                    </h1>
                    <p className="overview-subtitle">
                        Số liệu thống kê toàn diện 12 tháng năm <strong>{selectedYear}</strong>
                    </p>
                </div>

                {/* Filters */}
                <div className="overview-filters">
                    {/* Chọn Năm */}
                    <div className="overview-filter-item">
                        <span className="overview-filter-label">Năm:</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => {
                                setSelectedYear(Number(e.target.value));
                                setSelectedMonthLabel(null);
                            }}
                            className="overview-filter-select input"
                        >
                            {[currentYear + 1, currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    {/* Chọn Top Loài */}
                    <div className="overview-filter-item">
                        <span className="overview-filter-label">Top loài:</span>
                        <select
                            value={selectedTop}
                            onChange={(e) => setSelectedTop(Number(e.target.value))}
                            className="overview-filter-select input"
                        >
                            <option value={5}>Top 5</option>
                            <option value={10}>Top 10</option>
                            <option value={15}>Top 15</option>
                        </select>
                    </div>

                    {/* Nút Làm Mới */}
                    <button
                        onClick={() => void fetchReport(true)}
                        disabled={isRefreshing}
                        className="overview-refresh-btn btn btn-outline"
                    >
                        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                        <span>{isRefreshing ? 'Đang nạp...' : 'Làm mới'}</span>
                    </button>
                </div>
            </div>

            {/* Khối card main-card chứa toàn bộ nội dung dashboard */}
            <div className="card main-card overview-main-card">
                <div className="overview-scroll-body">
                    {/* ========================================================================= */}
                    {/* PHẦN 1 (TRÊN ĐẦU): TỔNG QUAN CẢ NĂM & CÁC BIỂU ĐỒ 12 THÁNG CẢ NĂM         */}
                    {/* ========================================================================= */}

                    {/* 6 Thẻ KPI Thống Kê Cả Năm */}
                    <div className="overview-kpi-grid">
                <StatCard
                    title="Tổng số tàu quản lý"
                    value={new Intl.NumberFormat('vi-VN').format(yearlyStats.countShip)}
                    description="Phương tiện đăng ký trong hệ thống"
                    icon={Ship}
                    color="blue"
                    linkTo="/ships"
                    linkText="Xem tàu"
                />

                <StatCard
                    title="Chuyến biển hoạt động"
                    value={new Intl.NumberFormat('vi-VN').format(yearlyStats.activeVoyages)}
                    description="Số chuyến biển đang ngoài khơi"
                    icon={Radio}
                    color="emerald"
                    badge={{ text: 'Đang trên biển', isPulse: true }}
                    linkTo="/departures"
                    linkText="Xem chuyến"
                />

                <StatCard
                    title="Xuất bến trong năm"
                    value={new Intl.NumberFormat('vi-VN').format(yearlyStats.departures)}
                    description={`Tổng lượt xuất bến năm ${selectedYear}`}
                    icon={Navigation}
                    color="indigo"
                    linkTo="/departures"
                    linkText="Xuất bến"
                />

                <StatCard
                    title="Sản lượng khai thác cả năm"
                    value={catchFormatted.primary}
                    subValue={catchFormatted.sub}
                    description={`Khai thác mẻ lưới năm ${selectedYear}`}
                    icon={Fish}
                    color="cyan"
                />

                <StatCard
                    title="Sản lượng chuyển tải cả năm"
                    value={transFormatted.primary}
                    subValue={transFormatted.sub}
                    description={`Thu mua trên biển năm ${selectedYear}`}
                    icon={ArrowRightLeft}
                    color="purple"
                />

                <StatCard
                    title="Tổng sản lượng toàn năm"
                    value={totalFormatted.primary}
                    subValue={totalFormatted.sub}
                    description={`Khai thác + Chuyển tải năm ${selectedYear}`}
                    icon={Scale}
                    color="amber"
                />
            </div>

            {/* KHỐI BIỂU ĐỒ VẼ CẢ NĂM (12 THÁNG) - ĐẶT LÊN TRÊN ĐẦU */}
            <div className="overview-charts-grid">
                <MonthlyWeightTrendChart
                    months={months}
                    selectedMonthLabel={selectedMonthLabel}
                    onSelectMonth={(lbl) => setSelectedMonthLabel(lbl)}
                />

                <MonthlyVoyageTrendChart
                    months={months}
                    selectedMonthLabel={selectedMonthLabel}
                    onSelectMonth={(lbl) => setSelectedMonthLabel(lbl)}
                />
            </div>

            {/* BẢNG TỔNG HỢP CHI TIẾT 12 THÁNG CỦA CẢ NĂM */}
            <MonthlySummaryTable
                months={months}
                selectedMonthLabel={selectedMonthLabel}
                onSelectMonth={(lbl) => setSelectedMonthLabel(lbl)}
            />

            {/* ========================================================================= */}
            {/* PHẦN 2 (Ở DƯỚI): CHI TIẾT CƠ CẤU LOÀI CÁ & BỘ LỌC TỪNG THÁNG              */}
            {/* ========================================================================= */}
            <div className="overview-species-section">
                {/* Header phần dưới: Tiêu đề & Thanh chọn tháng */}
                <div className="overview-species-header">
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Layers size={20} color="#0284c7" />
                            <span>Phân Tích Cơ Cấu Loài Cá ({speciesViewData.scopeTitle})</span>
                        </h2>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                            Chọn từng tháng bên dưới hoặc xem tổng hợp cả năm {selectedYear}
                        </p>
                    </div>

                    {/* Thanh lọc theo tháng */}
                    <div className="overview-month-bar">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '6px', color: '#475569', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            <Calendar size={15} color="#0284c7" />
                            <span>Tháng:</span>
                        </div>

                        <button
                            onClick={() => setSelectedMonthLabel(null)}
                            className="overview-month-btn"
                            style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                backgroundColor: selectedMonthLabel === null ? '#0f172a' : '#ffffff',
                                color: selectedMonthLabel === null ? '#ffffff' : '#475569',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            Cả năm
                        </button>

                        {months.map(m => {
                            const label = m.timeLabel || m.TimeLabel || '';
                            const isSelected = selectedMonthLabel === label;
                            const hasData = (Number(m.sumWeightFishingHauls ?? 0) + Number(m.sumWeightTransshipments ?? 0) + Number(m.departuresThisMonthCount ?? 0)) > 0;

                            return (
                                <button
                                    key={label}
                                    onClick={() => setSelectedMonthLabel(isSelected ? null : label)}
                                    className="overview-month-btn"
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: '8px',
                                        fontSize: '11.5px',
                                        fontWeight: 600,
                                        border: isSelected ? '1px solid #2563eb' : '1px solid #e2e8f0',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        backgroundColor: isSelected ? '#2563eb' : (hasData ? '#eff6ff' : '#ffffff'),
                                        color: isSelected ? '#ffffff' : (hasData ? '#1d4ed8' : '#64748b'),
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                                    }}
                                >
                                    {label}
                                    {hasData && (
                                        <span style={{
                                            width: '5px',
                                            height: '5px',
                                            borderRadius: '50%',
                                            backgroundColor: isSelected ? '#ffffff' : '#3b82f6',
                                            display: 'inline-block',
                                            marginLeft: '4px',
                                            verticalAlign: 'middle'
                                        }} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Banner thông báo nếu đang lọc riêng 1 tháng */}
                {selectedMonthLabel && (
                    <div style={{
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '10px',
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '13px',
                        color: '#1e40af'
                    }}>
                        <span>
                            Đang xem cơ cấu loài cá của riêng <strong>{selectedMonthLabel}</strong>. Nhấp nút bên phải để quay lại xem tổng hợp cả năm {selectedYear}.
                        </span>
                        <button
                            onClick={() => setSelectedMonthLabel(null)}
                            style={{
                                background: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            Xem cả năm
                        </button>
                    </div>
                )}

                {/* Khai Thác Mẻ Lưới Charts (Ở dưới) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '18px', backgroundColor: '#0284c7', borderRadius: '4px' }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                            Khai Thác Mẻ Lưới ({speciesViewData.scopeTitle})
                        </h3>
                    </div>

                    <div className="overview-species-charts-grid">
                        <FishBarChart
                            title={`Top ${selectedTop} Loài Cá Khai Thác Nhiều Nhất`}
                            subtitle={`Khối lượng khai thác tính theo kg (${speciesViewData.scopeTitle})`}
                            data={speciesViewData.haulsFish}
                            theme="blue"
                            emptyMessage={`Không có dữ liệu khai thác trong ${speciesViewData.scopeTitle}`}
                        />

                        <FishDoughnutChart
                            title="Cơ cấu phân bổ loài cá khai thác"
                            subtitle={`Tỷ trọng sản lượng giữa các loài (${speciesViewData.scopeTitle})`}
                            data={speciesViewData.haulsFish}
                            theme="blue"
                            totalWeightOverall={speciesViewData.catchWeight}
                            emptyMessage={`Không có dữ liệu cơ cấu khai thác trong ${speciesViewData.scopeTitle}`}
                        />
                    </div>

                    <TopFishTable
                        title="Bảng chi tiết Xếp hạng Khai thác"
                        subtitle={`Chi tiết khối lượng và % tỷ trọng (${speciesViewData.scopeTitle})`}
                        data={speciesViewData.haulsFish}
                        totalWeightOverall={speciesViewData.catchWeight}
                        theme="blue"
                        emptyMessage={`Chưa có dữ liệu loài cá khai thác trong ${speciesViewData.scopeTitle}`}
                    />
                </div>

                {/* Chuyển Tải Thu Mua Charts (Ở dưới) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '18px', backgroundColor: '#9333ea', borderRadius: '4px' }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                            Chuyển Tải & Thu Mua ({speciesViewData.scopeTitle})
                        </h3>
                    </div>

                    <div className="overview-species-charts-grid">
                        <FishBarChart
                            title={`Top ${selectedTop} Loài Cá Chuyển Tải / Thu Mua`}
                            subtitle={`Khối lượng chuyển tải tính theo kg (${speciesViewData.scopeTitle})`}
                            data={speciesViewData.transFish}
                            theme="purple"
                            emptyMessage={`Không có dữ liệu chuyển tải trong ${speciesViewData.scopeTitle}`}
                        />

                        <FishDoughnutChart
                            title="Cơ cấu phân bổ loài cá chuyển tải"
                            subtitle={`Tỷ trọng sản lượng giữa các loài (${speciesViewData.scopeTitle})`}
                            data={speciesViewData.transFish}
                            theme="purple"
                            totalWeightOverall={speciesViewData.transWeight}
                            emptyMessage={`Không có dữ liệu cơ cấu chuyển tải trong ${speciesViewData.scopeTitle}`}
                        />
                    </div>

                    <TopFishTable
                        title="Bảng chi tiết Xếp hạng Chuyển tải"
                        subtitle={`Chi tiết khối lượng và % tỷ trọng (${speciesViewData.scopeTitle})`}
                        data={speciesViewData.transFish}
                        totalWeightOverall={speciesViewData.transWeight}
                        theme="purple"
                        emptyMessage={`Chưa có dữ liệu loài cá chuyển tải trong ${speciesViewData.scopeTitle}`}
                    />
                </div>
            </div>
                </div>
            </div>
        </div>
    );
}
