import { useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import type { MonthlyVoyageReportDto } from '../../../types/Report';
import { Navigation } from 'lucide-react';

ChartJS.register(...registerables);

interface Props {
    months: MonthlyVoyageReportDto[];
    selectedMonthLabel: string | null;
    onSelectMonth?: (label: string | null) => void;
}

export default function MonthlyVoyageTrendChart({ months, selectedMonthLabel, onSelectMonth }: Props) {
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
        const departures = months.map(m => Number(m.departuresThisMonthCount ?? m.DeparturesThisMonthCount ?? 0));
        const actives = months.map(m => Number(m.activeVoyagesCount ?? m.ActiveVoyagesCount ?? 0));

        chartInstanceRef.current = new ChartJS(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        type: 'bar' as const,
                        label: 'Xuất bến trong tháng',
                        data: departures,
                        backgroundColor: labels.map(l => 
                            selectedMonthLabel && l === selectedMonthLabel 
                                ? 'rgba(99, 102, 241, 1)' 
                                : 'rgba(99, 102, 241, 0.75)'
                        ),
                        borderColor: '#6366f1',
                        borderWidth: 1,
                        borderRadius: 6,
                        barPercentage: 0.7
                    },
                    {
                        type: 'bar' as const,
                        label: 'Chuyến đang trên biển',
                        data: actives,
                        backgroundColor: labels.map(l => 
                            selectedMonthLabel && l === selectedMonthLabel 
                                ? 'rgba(16, 185, 129, 1)' 
                                : 'rgba(16, 185, 129, 0.75)'
                        ),
                        borderColor: '#10b981',
                        borderWidth: 1,
                        borderRadius: 6,
                        barPercentage: 0.7
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
                            onSelectMonth(null);
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
                                return ` ${context.dataset.label}: ${context.raw} chuyến`;
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
                            stepSize: 1,
                            font: {
                                size: 11
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

    const totalDeparturesYear = months.reduce((acc, m) => 
        acc + Number(m.departuresThisMonthCount ?? m.DeparturesThisMonthCount ?? 0), 0);

    return (
        <div 
            className="dashboard-chart-card"
            style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: '380px'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Navigation size={18} color="#6366f1" />
                        <span>Biểu đồ Hoạt động Chuyến biển 12 Tháng</span>
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                        Thống kê số lượng chuyến xuất bến và chuyến đang hoạt động theo từng tháng
                    </p>
                </div>

                <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#eef2ff',
                    color: '#4338ca',
                    border: '1px solid #c7d2fe'
                }}>
                    Tổng xuất bến: {totalDeparturesYear} chuyến
                </span>
            </div>

            <div style={{ flex: 1, minHeight: '290px', position: 'relative' }}>
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
}
