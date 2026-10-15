import { useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { PieChart as PieIcon } from 'lucide-react';

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
    totalWeightOverall?: number;
    emptyMessage?: string;
}

const BLUE_PALETTE = [
    '#0284c7', // Sky 600
    '#06b6d4', // Cyan 500
    '#3b82f6', // Blue 500
    '#10b981', // Emerald 500
    '#6366f1', // Indigo 500
    '#0ea5e9', // Sky 500
    '#14b8a6', // Teal 500
    '#8b5cf6'  // Violet 500
];

const PURPLE_PALETTE = [
    '#9333ea', // Purple 600
    '#ec4899', // Pink 500
    '#a855f7', // Purple 500
    '#f43f5e', // Rose 500
    '#c084fc', // Purple 400
    '#d946ef', // Fuchsia 500
    '#f97316', // Orange 500
    '#8b5cf6'  // Violet 500
];

export default function FishDoughnutChart({
    title,
    subtitle,
    data,
    theme,
    totalWeightOverall,
    emptyMessage
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstanceRef = useRef<ChartJS | null>(null);

    const palette = theme === 'blue' ? BLUE_PALETTE : PURPLE_PALETTE;

    const sortedData = [...data].sort((a, b) => b.totalWeight - a.totalWeight);
    const topData = sortedData.slice(0, 6);
    
    // Gom các loài còn lại vào nhóm "Khác" nếu có nhiều hơn 6 loài
    const remainingData = sortedData.slice(6);
    const remainingWeight = remainingData.reduce((acc, curr) => acc + curr.totalWeight, 0);

    const chartItems = [...topData];
    if (remainingWeight > 0) {
        chartItems.push({
            fishName: 'Các loài khác',
            totalWeight: remainingWeight
        });
    }

    const currentTotalWeight = chartItems.reduce((acc, curr) => acc + curr.totalWeight, 0);
    const displayTotal = totalWeightOverall !== undefined && totalWeightOverall > 0 
        ? totalWeightOverall 
        : currentTotalWeight;

    useEffect(() => {
        if (!canvasRef.current || chartItems.length === 0) return;

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null;
        }

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const labels = chartItems.map(d => d.fishName);
        const values = chartItems.map(d => d.totalWeight);
        const bgColors = chartItems.map((_, idx) => palette[idx % palette.length]);

        chartInstanceRef.current = new ChartJS(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [
                    {
                        data: values,
                        backgroundColor: bgColors,
                        borderWidth: 2,
                        borderColor: '#ffffff',
                        hoverOffset: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            boxHeight: 12,
                            padding: 12,
                            font: {
                                size: 12,
                                family: 'inherit'
                            },
                            color: '#334155'
                        }
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
                                const percentage = displayTotal > 0 ? ((val / displayTotal) * 100).toFixed(1) : '0';
                                const kgText = new Intl.NumberFormat('vi-VN').format(val) + ' kg';
                                return ` ${kgText} (${percentage}%)`;
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
    }, [data, theme, displayTotal]);

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
            <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    {title}
                </h3>
                {subtitle && (
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                        {subtitle}
                    </p>
                )}
            </div>

            <div style={{ flex: 1, minHeight: '300px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {chartItems.length === 0 ? (
                    <div style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        gap: '8px'
                    }}>
                        <PieIcon size={40} strokeWidth={1.5} />
                        <span style={{ fontSize: '14px' }}>
                            {emptyMessage || 'Chưa có dữ liệu cơ cấu loài cá'}
                        </span>
                    </div>
                ) : (
                    <>
                        <canvas ref={canvasRef} />
                        {/* Center text in doughnut */}
                        <div style={{
                            position: 'absolute',
                            top: '40%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                            pointerEvents: 'none'
                        }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Tổng cộng
                            </span>
                            <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                                {displayTotal >= 1000 
                                    ? (displayTotal / 1000).toFixed(1) + ' tấn'
                                    : new Intl.NumberFormat('vi-VN').format(displayTotal) + ' kg'}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
