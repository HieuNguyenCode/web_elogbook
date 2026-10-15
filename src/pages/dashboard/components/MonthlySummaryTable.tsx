import type { MonthlyVoyageReportDto } from '../../../types/Report';
import { Calendar, Eye } from 'lucide-react';

interface Props {
    months: MonthlyVoyageReportDto[];
    selectedMonthLabel: string | null;
    onSelectMonth: (label: string | null) => void;
}

export default function MonthlySummaryTable({ months, selectedMonthLabel, onSelectMonth }: Props) {
    return (
        <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={18} color="#0f172a" />
                        <span>Bảng Tổng Hợp Chi Tiết 12 Tháng</span>
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                        Bấm vào dòng hoặc nút &quot;Chi tiết&quot; để lọc và xem cơ cấu loài cá của tháng tương ứng
                    </p>
                </div>

                {selectedMonthLabel && (
                    <button
                        onClick={() => onSelectMonth(null)}
                        style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Bỏ lọc (Xem cả năm)
                    </button>
                )}
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', backgroundColor: '#f8fafc', textAlign: 'left' }}>
                            <th style={{ padding: '10px 12px', fontWeight: 600 }}>Tháng</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Xuất bến</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Đang trên biển</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Khai thác (kg)</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Chuyển tải (kg)</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Tổng sản lượng (kg)</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600 }}>Loài khai thác chủ lực</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {months.map((m, idx) => {
                            const label = m.timeLabel || m.TimeLabel || `Tháng ${idx + 1}`;
                            const isSelected = selectedMonthLabel === label;
                            const departures = Number(m.departuresThisMonthCount ?? m.DeparturesThisMonthCount ?? 0);
                            const actives = Number(m.activeVoyagesCount ?? m.ActiveVoyagesCount ?? 0);
                            const haulWeight = Number(m.sumWeightFishingHauls ?? m.SumWeightFishingHauls ?? 0);
                            const transWeight = Number(m.sumWeightTransshipments ?? m.SumWeightTransshipments ?? 0);
                            const totalWeight = haulWeight + transWeight;

                            const topFishList = m.topFishFishingHauls || m.TopFishFishingHauls || [];
                            const topFishName = topFishList[0]?.fishName || topFishList[0]?.FishName;

                            return (
                                <tr 
                                    key={idx} 
                                    onClick={() => onSelectMonth(isSelected ? null : label)}
                                    style={{
                                        borderBottom: '1px solid #f1f5f9',
                                        backgroundColor: isSelected ? '#eff6ff' : (totalWeight > 0 ? '#ffffff' : '#fafafa'),
                                        cursor: 'pointer',
                                        transition: 'background-color 0.15s ease'
                                    }}
                                    onMouseEnter={e => {
                                        if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                                    }}
                                    onMouseLeave={e => {
                                        if (!isSelected) e.currentTarget.style.backgroundColor = totalWeight > 0 ? '#ffffff' : '#fafafa';
                                    }}
                                >
                                    <td style={{ padding: '10px 12px', fontWeight: 700, color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                                        {label}
                                        {isSelected && (
                                            <span style={{
                                                marginLeft: '6px',
                                                fontSize: '11px',
                                                padding: '1px 6px',
                                                borderRadius: '4px',
                                                backgroundColor: '#3b82f6',
                                                color: '#ffffff',
                                                fontWeight: 600
                                            }}>
                                                Đang chọn
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center', color: departures > 0 ? '#4338ca' : '#94a3b8', fontWeight: departures > 0 ? 600 : 400 }}>
                                        {departures}
                                    </td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center', color: actives > 0 ? '#047857' : '#94a3b8', fontWeight: actives > 0 ? 600 : 400 }}>
                                        {actives}
                                    </td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: haulWeight > 0 ? 600 : 400, color: haulWeight > 0 ? '#0284c7' : '#94a3b8' }}>
                                        {new Intl.NumberFormat('vi-VN').format(haulWeight)}
                                    </td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: transWeight > 0 ? 600 : 400, color: transWeight > 0 ? '#9333ea' : '#94a3b8' }}>
                                        {new Intl.NumberFormat('vi-VN').format(transWeight)}
                                    </td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: totalWeight > 0 ? 700 : 400, color: totalWeight > 0 ? '#0f172a' : '#94a3b8' }}>
                                        {new Intl.NumberFormat('vi-VN').format(totalWeight)}
                                        {totalWeight >= 1000 && (
                                            <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '4px' }}>
                                                (~{(totalWeight / 1000).toFixed(2)}t)
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                        {topFishName ? (
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                backgroundColor: '#e0f2fe',
                                                color: '#0369a1',
                                                fontSize: '11.5px',
                                                fontWeight: 600
                                            }}>
                                                {topFishName} ({new Intl.NumberFormat('vi-VN').format(topFishList[0]?.totalWeight || topFishList[0]?.TotalWeight || 0)} kg)
                                            </span>
                                        ) : (
                                            <span style={{ color: '#cbd5e1' }}>—</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectMonth(isSelected ? null : label);
                                            }}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                border: isSelected ? '1px solid #2563eb' : '1px solid #cbd5e1',
                                                backgroundColor: isSelected ? '#2563eb' : '#ffffff',
                                                color: isSelected ? '#ffffff' : '#334155'
                                            }}
                                        >
                                            <Eye size={13} />
                                            <span>{isSelected ? 'Bỏ chọn' : 'Xem'}</span>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
