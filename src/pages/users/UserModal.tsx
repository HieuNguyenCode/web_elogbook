import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { createUserAPI, updateUserAPI } from '../../features/API/user/UserAPI';
import type { UserDto } from '../../features/API/user/UserAPI';
import { useToast } from '../../components/ToastContext';

interface Props {
    isOpen: boolean;
    user: UserDto | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UserModal({ isOpen, user, onClose, onSuccess }: Props) {
    const [formData, setFormData] = useState({
        userName: '',
        fullName: '',
        password: '',
        role: 'AGENCY'
    });
    const [isSaving, setIsSaving] = useState(false);
    const [mainError, setMainError] = useState<string | null>(null);
    const { success } = useToast();

    useEffect(() => {
        if (user) {
            setFormData({
                userName: user.userName,
                fullName: user.fullName,
                password: '',
                role: user.role
            });
        } else {
            setFormData({
                userName: '',
                fullName: '',
                password: '',
                role: 'AGENCY'
            });
        }
        setMainError(null);
    }, [user]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!formData.userName || !formData.fullName) {
            setMainError('Vui lòng nhập đầy đủ thông tin bắt buộc');
            return;
        }
        if (!user && !formData.password) {
            setMainError('Vui lòng nhập mật khẩu cho người dùng mới');
            return;
        }
        // Nếu không nhập mật khẩu khi edit thì gửi null
        const payload = { ...formData };
        if (user && !payload.password) {
            (payload as any).password = null;
        }

        try {
            setMainError(null);
            setIsSaving(true);
            if (user) {
                await updateUserAPI(user.id, payload);
                success('Cập nhật người dùng thành công!');
            } else {
                await createUserAPI(payload);
                success('Thêm người dùng mới thành công!');
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setMainError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi lưu người dùng');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '480px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">{user ? 'Chỉnh sửa Người Dùng' : 'Thêm Người Dùng Mới'}</h3>
                    <button type="button" className="modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {mainError && (
                    <div className="flex items-start gap-sm" style={{
                        backgroundColor: '#fef2f2',
                        color: '#b91c1c',
                        padding: '12px 16px',
                        fontSize: '14px',
                        borderBottom: '1px solid #fecaca'
                    }}>
                        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                        <div>{mainError}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    <div className="modal-body flex flex-col gap-md">
                        <div>
                            <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '6px', fontWeight: 500, color: '#334155' }}>
                                Họ và tên (<span style={{ color: 'var(--error-color)', fontWeight: 'bold' }}>*</span>)
                            </label>
                            <input 
                                type="text" 
                                className="input w-full"
                                value={formData.fullName}
                                onChange={e => setFormData({...formData, fullName: e.target.value})}
                                placeholder="Ví dụ: Nguyễn Văn A"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '6px', fontWeight: 500, color: '#334155' }}>
                                Tên đăng nhập (<span style={{ color: 'var(--error-color)', fontWeight: 'bold' }}>*</span>)
                            </label>
                            <input 
                                type="text" 
                                className="input w-full"
                                value={formData.userName}
                                onChange={e => setFormData({...formData, userName: e.target.value})}
                                placeholder="Ví dụ: nguyenvana_123"
                                required
                            />
                        </div>

                        <div>
                            <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '6px', fontWeight: 500, color: '#334155' }}>
                                Mật khẩu {user ? <span style={{ color: '#64748b', fontWeight: 'normal' }}>(Bỏ trống nếu không đổi)</span> : <span style={{ color: 'var(--error-color)', fontWeight: 'bold' }}>*</span>}
                            </label>
                            <input 
                                type="password" 
                                className="input w-full"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                                placeholder={user ? "Nhập mật khẩu mới (nếu muốn đổi)..." : "Nhập mật khẩu cho tài khoản..."}
                                required={!user}
                            />

                        </div>

                        <div>
                            <label className="form-label" style={{ display: 'block', fontSize: '14px', marginBottom: '6px', fontWeight: 500, color: '#334155' }}>
                                Quyền hạn (Role) (<span style={{ color: 'var(--error-color)', fontWeight: 'bold' }}>*</span>)
                            </label>
                            <select 
                                className="input w-full"
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value})}
                                required
                                style={{ appearance: 'auto' }}
                            >
                                <option value="AGENCY">Đại lý (AGENCY)</option>
                                <option value="FAMILY">Chủ tàu (FAMILY)</option>
                                <option value="ADMIN">Quản trị viên (ADMIN)</option>
                            </select>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose} style={{ padding: '8px 16px' }}>
                            Đóng
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ padding: '8px 16px' }}>
                            {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
