import { useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Scale } from 'lucide-react';

ChartJS.register(...registerables);

interface Props {
    catchWeight: number;
    transshipmentWeight: number;
}

export default function WeightComparisonChart({ catchWeight, transshipmentWeight }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstanceRef = useRef<ChartJS | null>(null);

    const total = catchWeight + transshipmentWeight;
    const catchPercent = total > 0 ? ((catchWeight / total) * 100).toFixed(1) : '0';
    const transPercent = total > 0 ? ((transshipmentWeight / total) * 100).toFixed(1) : '0';

    useEffect(() => {
        if (!canvasRef.current || total === 0) return;

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null;
        }

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        chartInstanceRef.current = new ChartJS(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Khai thác trực tiếp', 'Chuyển tải thu mua'],
                datasets: [
                    {
                        data: [catchWeight, transshipmentWeight],
                        backgroundColor: ['#0284c7', '#9333ea'],
                        borderColor: ['#ffffff', '#ffffff'],
                        borderWidth: 2,
                        hoverOffset: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            boxHeight: 12,
                            padding: 12,
                            font: {
                                size: 12
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
                                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                                const kgText = new Intl.NumberFormat('vi-VN').format(val) + ' kg';
                                return ` ${kgText} (${pct}%)`;
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
    }, [catchWeight, transshipmentWeight, total]);

    return (
        <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        }}>
            <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Tỷ trọng Sản lượng Khai thác & Chuyển tải
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                    So sánh sản lượng khai thác tại mẻ lưới với sản lượng chuyển tải thu mua
                </p>
            </div>

            {total === 0 ? (
                <div style={{
                    flex: 1,
                    minHeight: '260px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    gap: '8px'
                }}>
                    <Scale size={40} strokeWidth={1.5} />
                    <span style={{ fontSize: '14px' }}>Chưa có dữ liệu sản lượng</span>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                    <div style={{ height: '220px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <canvas ref={canvasRef} />
                        <div style={{
                            position: 'absolute',
                            top: '40%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                            pointerEvents: 'none'
                        }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                                Tổng sản lượng
                            </span>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                                {total >= 1000 
                                    ? (total / 1000).toFixed(1) + ' tấn'
                                    : new Intl.NumberFormat('vi-VN').format(total) + ' kg'}
                            </div>
                        </div>
                    </div>

                    {/* Breakdown bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                                <span style={{ color: '#0284c7', fontWeight: 600 }}>Khai thác trực tiếp:</span>
                                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                                    {new Intl.NumberFormat('vi-VN').format(catchWeight)} kg ({catchPercent}%)
                                </span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: '#e0f2fe', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${catchPercent}%`, backgroundColor: '#0284c7', borderRadius: '999px' }} />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                                <span style={{ color: '#9333ea', fontWeight: 600 }}>Chuyển tải thu mua:</span>
                                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                                    {new Intl.NumberFormat('vi-VN').format(transshipmentWeight)} kg ({transPercent}%)
                                </span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: '#f3e8ff', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${transPercent}%`, backgroundColor: '#9333ea', borderRadius: '999px' }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
