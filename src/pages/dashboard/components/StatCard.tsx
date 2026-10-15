import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
    title: string;
    value: string | number;
    subValue?: string;
    description: string;
    icon: LucideIcon;
    color: 'blue' | 'emerald' | 'indigo' | 'amber' | 'cyan' | 'purple';
    badge?: {
        text: string;
        isPulse?: boolean;
    };
    linkTo?: string;
    linkText?: string;
}

const colorStyles = {
    blue: {
        bg: '#eff6ff',
        border: '#bfdbfe',
        text: '#1d4ed8',
        iconBg: '#3b82f6',
        gradient: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
        badgeBg: '#dbeafe',
        badgeText: '#1e40af'
    },
    emerald: {
        bg: '#ecfdf5',
        border: '#a7f3d0',
        text: '#047857',
        iconBg: '#10b981',
        gradient: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)',
        badgeBg: '#d1fae5',
        badgeText: '#065f46'
    },
    indigo: {
        bg: '#eef2ff',
        border: '#c7d2fe',
        text: '#4338ca',
        iconBg: '#6366f1',
        gradient: 'linear-gradient(135deg, #eef2ff 0%, #ffffff 100%)',
        badgeBg: '#e0e7ff',
        badgeText: '#3730a3'
    },
    amber: {
        bg: '#fffbeb',
        border: '#fde68a',
        text: '#b45309',
        iconBg: '#f59e0b',
        gradient: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
        badgeBg: '#fef3c7',
        badgeText: '#92400e'
    },
    cyan: {
        bg: '#ecfeff',
        border: '#a5f3fc',
        text: '#0e7490',
        iconBg: '#06b6d4',
        gradient: 'linear-gradient(135deg, #ecfeff 0%, #ffffff 100%)',
        badgeBg: '#cffafe',
        badgeText: '#155e75'
    },
    purple: {
        bg: '#faf5ff',
        border: '#e9d5ff',
        text: '#7e22ce',
        iconBg: '#a855f7',
        gradient: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)',
        badgeBg: '#f3e8ff',
        badgeText: '#6b21a8'
    }
};

export default function StatCard({
    title,
    value,
    subValue,
    description,
    icon: Icon,
    color,
    badge,
    linkTo,
    linkText
}: Props) {
    const theme = colorStyles[color];

    return (
        <div 
            className="dashboard-stat-card"
            style={{
                background: theme.gradient,
                border: `1px solid ${theme.border}`,
                borderRadius: '14px',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.08)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
            }}
        >
            {/* Top row: Title & Icon */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {title}
                        </span>
                        {badge && (
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                backgroundColor: theme.badgeBg,
                                color: theme.badgeText
                            }}>
                                {badge.isPulse && (
                                    <span style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        backgroundColor: theme.text,
                                        display: 'inline-block',
                                        animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                                    }} />
                                )}
                                {badge.text}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                            {value}
                        </span>
                        {subValue && (
                            <span style={{ fontSize: '13px', fontWeight: 600, color: theme.text }}>
                                {subValue}
                            </span>
                        )}
                    </div>
                </div>

                <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: theme.iconBg,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.12)'
                }}>
                    <Icon size={22} />
                </div>
            </div>

            {/* Bottom row: Description & Optional Link */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '10px',
                borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                fontSize: '12.5px',
                color: '#64748b'
            }}>
                <span>{description}</span>
                {linkTo && (
                    <Link 
                        to={linkTo} 
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            color: theme.text,
                            fontWeight: 600,
                            textDecoration: 'none',
                            fontSize: '12px'
                        }}
                    >
                        <span>{linkText || 'Chi tiết'}</span>
                        <ChevronRight size={14} />
                    </Link>
                )}
            </div>
        </div>
    );
}
