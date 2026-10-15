import { Fish } from 'lucide-react';

interface FishItem {
    fishName: string;
    totalWeight: number;
}

interface Props {
    title: string;
    subtitle?: string;
    data: FishItem[];
    totalWeightOverall: number;
    theme: 'blue' | 'purple';
    emptyMessage?: string;
}

const THEME_STYLES = {
    blue: {
        barBg: '#0284c7',
        badgeBg: '#e0f2fe',
        badgeText: '#0369a1',
        rank1Bg: '#fef3c7',
        rank1Text: '#b45309'
    },
    purple: {
        barBg: '#9333ea',
        badgeBg: '#f3e8ff',
        badgeText: '#7e22ce',
        rank1Bg: '#fef3c7',
        rank1Text: '#b45309'
    }
};

export default function TopFishTable({
    title,
    subtitle,
    data,
    totalWeightOverall,
    theme,
    emptyMessage
}: Props) {
    const styles = THEME_STYLES[theme];
    const sorted = [...data].sort((a, b) => b.totalWeight - a.totalWeight);

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
                    backgroundColor: styles.badgeBg,
                    color: styles.badgeText
                }}>
                    {sorted.length} loài
                </span>
            </div>

            {sorted.length === 0 ? (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    padding: '30px',
                    gap: '8px'
                }}>
                    <Fish size={36} strokeWidth={1.5} />
                    <span style={{ fontSize: '13.5px' }}>{emptyMessage || 'Không có dữ liệu'}</span>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                                <th style={{ padding: '8px 6px', width: '50px', textAlign: 'center', fontWeight: 600 }}>Hạng</th>
                                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Tên loài cá</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Sản lượng (kg)</th>
                                <th style={{ padding: '8px 12px', width: '140px', textAlign: 'right', fontWeight: 600 }}>Tỷ trọng (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((item, index) => {
                                const percent = totalWeightOverall > 0 
                                    ? ((item.totalWeight / totalWeightOverall) * 100).toFixed(1)
                                    : '0';

                                const rank = index + 1;
                                const isTop3 = rank <= 3;

                                return (
                                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                                        <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                backgroundColor: isTop3 ? styles.rank1Bg : '#f1f5f9',
                                                color: isTop3 ? styles.rank1Text : '#64748b'
                                            }}>
                                                {rank}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                                            {item.fishName}
                                        </td>
                                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                                            {new Intl.NumberFormat('vi-VN').format(item.totalWeight)} kg
                                            {item.totalWeight >= 1000 && (
                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 400 }}>
                                                    ~{(item.totalWeight / 1000).toFixed(2)} tấn
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                <div style={{
                                                    flex: 1,
                                                    height: '6px',
                                                    backgroundColor: '#e2e8f0',
                                                    borderRadius: '999px',
                                                    overflow: 'hidden',
                                                    maxWidth: '80px'
                                                }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${Math.min(100, Number(percent))}%`,
                                                        backgroundColor: styles.barBg,
                                                        borderRadius: '999px'
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', minWidth: '38px' }}>
                                                    {percent}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
