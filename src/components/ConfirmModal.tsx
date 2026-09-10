import React from 'react';
import { Trash2 } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    icon?: React.ReactNode;
    iconBg?: string;
    iconColor?: string;
    confirmButtonColor?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    isOpen,
    title = 'Xác nhận xóa',
    message,
    confirmText = 'Xác nhận xóa',
    cancelText = 'Hủy bỏ',
    isLoading = false,
    icon,
    iconBg = '#fee2e2',
    iconColor = '#dc2626',
    confirmButtonColor = '#dc2626',
    onConfirm,
    onCancel
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onCancel}>
            <div 
                className="modal-content" 
                style={{ 
                    maxWidth: '440px', 
                    width: '92vw', 
                    padding: '24px', 
                    borderRadius: '16px',
                    boxShadow: 'var(--elevation-4)',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }} 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start gap-md">
                    <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '12px', 
                        backgroundColor: iconBg, 
                        color: iconColor, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0 
                    }}>
                        {icon || <Trash2 size={22} />}
                    </div>
                    <div className="flex-1">
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                            {title}
                        </h4>
                        <div style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
                            {message}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-sm" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <button 
                        type="button" 
                        className="btn btn-outline" 
                        onClick={onCancel} 
                        disabled={isLoading}
                        style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}
                    >
                        {cancelText}
                    </button>
                    <button 
                        type="button" 
                        className="btn flex items-center gap-xs" 
                        onClick={onConfirm} 
                        disabled={isLoading} 
                        style={{ 
                            backgroundColor: confirmButtonColor, 
                            color: '#ffffff', 
                            border: 'none', 
                            padding: '8px 18px', 
                            borderRadius: '8px', 
                            fontSize: '14px', 
                            fontWeight: 600,
                            boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
                            cursor: 'pointer'
                        }}
                    >
                        {isLoading ? 'Đang xử lý...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}