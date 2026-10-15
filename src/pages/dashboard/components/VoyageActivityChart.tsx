import { useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Activity } from 'lucide-react';

ChartJS.register(...registerables);

interface Props {
    departures: number;
    arrivals: number;
    active: number;
}

export default function VoyageActivityChart({ departures, arrivals, active }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstanceRef = useRef<ChartJS | null>(null);

    const total = departures + arrivals + active;

    useEffect(() => {
        if (!canvasRef.current || total === 0) return;

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null;
        }

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        chartInstanceRef.current = new ChartJS(ctx, {
            type: 'bar',
            data: {
                labels: ['Xuất bến trong tháng', 'Cập bến trong tháng', 'Đang trên biển'],
                datasets: [
                    {
                        label: 'Số chuyến biển',
                        data: [departures, arrivals, active],
                        backgroundColor: [
                            'rgba(99, 102, 241, 0.85)', // Indigo
                            'rgba(245, 158, 11, 0.85)', // Amber
                            'rgba(16, 185, 129, 0.85)'  // Emerald
                        ],
                        borderColor: [
                            '#6366f1',
                            '#f59e0b',
                            '#10b981'
                        ],
                        borderWidth: 1,
                        borderRadius: 8,
                        barThickness: 36
                    }
                ]
            },
            options: {
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
                                return ` ${context.raw} chuyến biển`;
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
                            color: '#334155',
                            font: {
                                size: 12,
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
    }, [departures, arrivals, active, total]);

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
                    Hoạt động Chuyến biển Trong tháng
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Tình hình xuất bến, cập bến và số chuyến tàu đang hoạt động ngoài khơi
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
                    <Activity size={40} strokeWidth={1.5} />
                    <span style={{ fontSize: '14px' }}>Chưa có hoạt động chuyến biển</span>
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ flex: 1, minHeight: '220px', position: 'relative' }}>
                        <canvas ref={canvasRef} />
                    </div>

                    {/* Stats pills */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '10px',
                        paddingTop: '12px',
                        borderTop: '1px solid #f1f5f9'
                    }}>
                        <div style={{
                            backgroundColor: '#eef2ff',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '11px', color: '#4338ca', fontWeight: 600 }}>Xuất bến</div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#312e81' }}>{departures}</div>
                        </div>

                        <div style={{
                            backgroundColor: '#fffbeb',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>Cập bến</div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#78350f' }}>{arrivals}</div>
                        </div>

                        <div style={{
                            backgroundColor: '#ecfdf5',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>Đang trên biển</div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#064e3b' }}>{active}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
