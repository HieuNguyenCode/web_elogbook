import { useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import type { MonthlyVoyageReportDto } from '../../../types/Report';
import { TrendingUp } from 'lucide-react';

ChartJS.register(...registerables);

interface Props {
    months: MonthlyVoyageReportDto[];
    selectedMonthLabel: string | null;
    onSelectMonth?: (label: string | null) => void;
}

export default function MonthlyWeightTrendChart({ months, selectedMonthLabel, onSelectMonth }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstanceRef = useRef<ChartJS | null>(null);

    useEffect(() => {
        if (!canvasRef.current || months.length === 0) return;

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null;
        }

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const labels = months.map(m => m.timeLabel || m.TimeLabel || '');
        const haulWeights = months.map(m => Number(m.sumWeightFishingHauls ?? m.SumWeightFishingHauls ?? 0));
        const transWeights = months.map(m => Number(m.sumWeightTransshipments ?? m.SumWeightTransshipments ?? 0));
        const totalWeights = months.map((_, i) => haulWeights[i] + transWeights[i]);

        // Màu highlight nếu người dùng đang chọn 1 tháng
        const haulColors = labels.map(l => 
            selectedMonthLabel && l === selectedMonthLabel 
                ? 'rgba(2, 132, 199, 1)' 
                : 'rgba(2, 132, 199, 0.75)'
        );
        const transColors = labels.map(l => 
            selectedMonthLabel && l === selectedMonthLabel 
                ? 'rgba(147, 51, 234, 1)' 
                : 'rgba(147, 51, 234, 0.75)'
        );

        chartInstanceRef.current = new ChartJS(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        type: 'line' as const,
                        label: 'Tổng sản lượng (kg)',
                        data: totalWeights,
                        borderColor: '#059669',
                        backgroundColor: 'rgba(5, 150, 105, 0.1)',
                        borderWidth: 2.5,
                        tension: 0.3,
                        pointBackgroundColor: '#059669',
                        pointBorderColor: '#ffffff',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        order: 1
                    },
                    {
                        type: 'bar' as const,
                        label: 'Khai thác mẻ lưới (kg)',
                        data: haulWeights,
                        backgroundColor: haulColors,
                        borderColor: '#0284c7',
                        borderWidth: 1,
                        borderRadius: 6,
                        order: 2
                    },
                    {
                        type: 'bar' as const,
                        label: 'Chuyển tải thu mua (kg)',
                        data: transWeights,
                        backgroundColor: transColors,
                        borderColor: '#9333ea',
                        borderWidth: 1,
                        borderRadius: 6,
                        order: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                onClick: (_, elements) => {
                    if (elements.length > 0 && onSelectMonth) {
                        const index = elements[0].index;
                        const clickedLabel = labels[index];
                        if (clickedLabel === selectedMonthLabel) {
                            onSelectMonth(null); // Bỏ chọn
                        } else {
                            onSelectMonth(clickedLabel);
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            boxWidth: 12,
                            boxHeight: 12,
                            padding: 14,
                            font: {
                                size: 12,
                                weight: 500
                            },
                            color: '#334155'
                        }
                    },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#ffffff',
                        bodyColor: '#e2e8f0',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                const val = Number(context.raw || 0);
                                const kgText = new Intl.NumberFormat('vi-VN').format(val) + ' kg';
                                if (val >= 1000) {
                                    return ` ${context.dataset.label}: ${kgText} (${(val / 1000).toFixed(2)} tấn)`;
                                }
                                return ` ${context.dataset.label}: ${kgText}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#475569',
                            font: {
                                size: 11.5,
                                weight: 500
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f1f5f9'
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                size: 11
                            },
                            callback: function (val) {
                                const num = Number(val);
                                if (num >= 1000) return (num / 1000) + ' tấn';
                                return num + ' kg';
                            }
                        }
                    }
                }
            }
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [months, selectedMonthLabel, onSelectMonth]);

    const totalYearWeight = months.reduce((acc, m) => 
        acc + Number(m.sumWeightFishingHauls ?? m.SumWeightFishingHauls ?? 0) + Number(m.sumWeightTransshipments ?? m.SumWeightTransshipments ?? 0), 0);

    return (
        <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: '380px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={18} color="#0284c7" />
                        <span>Biểu đồ Xu hướng Sản lượng 12 Tháng</span>
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                        So sánh sản lượng khai thác và chuyển tải theo từng tháng trong năm (nhấp cột để lọc)
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#f0fdf4',
                        color: '#15803d',
                        border: '1px solid #bbf7d0'
                    }}>
                        Tổng năm: {new Intl.NumberFormat('vi-VN').format(totalYearWeight)} kg
                    </span>
                    {selectedMonthLabel && (
                        <button
                            onClick={() => onSelectMonth && onSelectMonth(null)}
                            style={{
                                fontSize: '12px',
                                color: '#2563eb',
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            Đang xem: {selectedMonthLabel} ✕
                        </button>
                    )}
                </div>
            </div>

            <div style={{ flex: 1, minHeight: '290px', position: 'relative' }}>
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
}
