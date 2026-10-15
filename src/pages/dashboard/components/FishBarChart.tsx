import { useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Fish } from 'lucide-react';

ChartJS.register(...registerables);

interface FishItem {
    fishName: string;
    totalWeight: number;
}

interface Props {
    title: string;
    subtitle?: string;
    data: FishItem[];
    theme: 'blue' | 'purple';
    emptyMessage?: string;
}

const THEME_COLORS = {
    blue: {
        bar: 'rgba(2, 132, 199, 0.85)',
        barHover: 'rgba(2, 132, 199, 1)',
        border: '#0284c7',
        badgeBg: '#e0f2fe',
        badgeText: '#0369a1'
    },
    purple: {
        bar: 'rgba(147, 51, 234, 0.85)',
        barHover: 'rgba(147, 51, 234, 1)',
        border: '#9333ea',
        badgeBg: '#f3e8ff',
        badgeText: '#7e22ce'
    }
};

export default function FishBarChart({ title, subtitle, data, theme, emptyMessage }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstanceRef = useRef<ChartJS | null>(null);

    const colors = THEME_COLORS[theme];

    // Sắp xếp dữ liệu theo thứ tự giảm dần
    const sortedData = [...data].sort((a, b) => b.totalWeight - a.totalWeight);
    const topData = sortedData.slice(0, 10); // Giới hạn tối đa 10 loài để biểu đồ gọn gàng

    useEffect(() => {
        if (!canvasRef.current || topData.length === 0) return;

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null;
        }

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const labels = topData.map(d => d.fishName);
        const values = topData.map(d => d.totalWeight);

        chartInstanceRef.current = new ChartJS(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Sản lượng (kg)',
                        data: values,
                        backgroundColor: colors.bar,
                        hoverBackgroundColor: colors.barHover,
                        borderColor: colors.border,
                        borderWidth: 1,
                        borderRadius: 6,
                        barThickness: 22
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#ffffff',
                        bodyColor: '#e2e8f0',
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                const val = Number(context.raw || 0);
                                const kgText = new Intl.NumberFormat('vi-VN').format(val) + ' kg';
                                if (val >= 1000) {
                                    const tons = (val / 1000).toFixed(2);
                                    return ` ${kgText} (~${tons} tấn)`;
                                }
                                return ` ${kgText}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
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
                                if (num >= 1000) {
                                    return (num / 1000) + ' tấn';
                                }
                                return num + ' kg';
                            }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#1e293b',
                            font: {
                                size: 12,
                                weight: 500
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
    }, [data, theme]);

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        {title}
                    </h3>
                    {subtitle && (
                        <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                            {subtitle}
                        </p>
                    )}
                </div>
                <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: '6px',
                    backgroundColor: colors.badgeBg,
                    color: colors.badgeText
                }}>
                    Top {topData.length} loài
                </span>
            </div>

            <div style={{ flex: 1, minHeight: '300px', position: 'relative' }}>
                {topData.length === 0 ? (
                    <div style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        gap: '8px'
                    }}>
                        <Fish size={40} strokeWidth={1.5} />
                        <span style={{ fontSize: '14px' }}>
                            {emptyMessage || 'Chưa có dữ liệu thống kê loài cá'}
                        </span>
                    </div>
                ) : (
                    <canvas ref={canvasRef} />
                )}
            </div>
        </div>
    );
}
