import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, User, AlertCircle, RefreshCw, MapPin } from 'lucide-react';
import { getAllUsersAPI, deleteUserAPI } from '../../features/API/user/UserAPI';
import type { UserDto } from '../../features/API/user/UserAPI';
import { LocationsAPI } from '../../features/API/catalog/Catalog';
import type { Locations } from '../../types/Catalog';
import { useToast } from '../../components/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';
import UserModal from './UserModal';
import { getUserRole } from '../../utils/jwt';

export default function UserList() {
    const [users, setUsers] = useState<UserDto[]>([]);
    const [locationsMap, setLocationsMap] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
    
    const [userToDelete, setUserToDelete] = useState<UserDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const { success, error } = useToast();
    const isAdmin = getUserRole() === 'ADMIN';

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            setErrorMsg(null);
            const data = await getAllUsersAPI();
            setUsers(data);
        } catch (err: any) {
            setErrorMsg(err.message || 'Lỗi tải danh sách người dùng');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            void fetchUsers();
            LocationsAPI().then(res => {
                const list = Array.isArray(res) ? res : (res as any)?.data || res;
                if (Array.isArray(list)) {
                    const map: Record<string, string> = {};
                    list.forEach((l: Locations) => {
                        if (l.code) map[l.code] = l.name;
                        if (l.id) map[l.id] = l.name;
                    });
                    setLocationsMap(map);
                }
            }).catch(() => {});
        }
    }, [isAdmin]);

    const handleDelete = async () => {
        if (!userToDelete) return;
        try {
            setIsDeleting(true);
            await deleteUserAPI(userToDelete.id);
            success('Xóa người dùng thành công');
            setUserToDelete(null);
            void fetchUsers();
        } catch (err: any) {
            error(err.message || 'Lỗi khi xóa người dùng');
        } finally {
            setIsDeleting(false);
        }
    };

    // Lọc theo tìm kiếm cục bộ do API getAllUsers không hỗ trợ phân trang/tìm kiếm
    const filteredUsers = useMemo(() => {
        if (!search.trim()) return users;
        const lowerSearch = search.toLowerCase();
        return users.filter(u => {
            const fName = (u.fullName || (u as any).FullName || '').toLowerCase();
            const uName = (u.userName || (u as any).UserName || '').toLowerCase();
            const rName = (u.role || (u as any).Role || '').toLowerCase();
            const locs = (u.locations || u.Locations || []).map(l => (locationsMap[l] || l).toLowerCase());
            return fName.includes(lowerSearch) || 
                   uName.includes(lowerSearch) || 
                   rName.includes(lowerSearch) ||
                   locs.some(loc => loc.includes(lowerSearch));
        });
    }, [users, search, locationsMap]);

    if (!isAdmin) {
        return (
            <div className="flex h-full items-center justify-center flex-col gap-4 text-slate-500">
                <AlertCircle size={48} className="text-red-400" />
                <h2 className="text-xl font-bold text-slate-700">Bạn không có quyền truy cập trang này</h2>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-md" style={{ overflow: 'hidden' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Danh sách Người dùng</h1>
                    <p className="text-sm" style={{ color: '#64748b', marginTop: '4px' }}>
                        Quản lý tài khoản và phân quyền truy cập hệ thống
                    </p>
                </div>
                <div className="flex items-center gap-sm">
                    <button className="btn btn-outline flex items-center gap-sm"
                        onClick={() => fetchUsers()}
                        style={{borderRadius: '8px', padding: '8px 16px', fontWeight: 600}}>
                        <RefreshCw size={18}/>
                        <span>Làm mới</span>
                    </button>
                    <button 
                        className="btn btn-primary flex items-center gap-xs"
                        style={{ padding: '8px 16px', borderRadius: '8px' }}
                        onClick={() => {
                            setSelectedUser(null);
                            setShowUserModal(true);
                        }}
                    >
                        <Plus size={18} />
                        <span className="font-semibold">Thêm người dùng</span>
                    </button>
                </div>
            </div>

            {errorMsg && (
                <div className="alert flex items-start gap-sm" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px' }}>
                    <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '14px' }}>{errorMsg}</div>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-h-0" style={{ 
                backgroundColor: '#ffffff', 
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                overflow: 'hidden'
            }}>
                {/* Search Bar */}
                <div className="flex items-center justify-between flex-col-mobile gap-sm" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm theo tên hoặc tên đăng nhập..."
                            className="form-input"
                            style={{ 
                                width: '100%', 
                                paddingLeft: '38px',
                                paddingRight: '16px',
                                paddingTop: '8px',
                                paddingBottom: '8px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '14px'
                            }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="table-container" style={{ flex: 1, overflow: 'auto', backgroundColor: '#f8fafc' }}>
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f1f5f9' }}>
                            <tr>
                                <th style={{ width: '80px', padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #cbd5e1', color: '#475569', fontWeight: 600 }}>STT</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #cbd5e1', color: '#475569', fontWeight: 600 }}>Họ và tên</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #cbd5e1', color: '#475569', fontWeight: 600 }}>Tên đăng nhập</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #cbd5e1', color: '#475569', fontWeight: 600 }}>Quyền (Role)</th>
                                <th style={{ width: '120px', padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #cbd5e1', color: '#475569', fontWeight: 600 }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody style={{ backgroundColor: '#ffffff' }}>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8">
                                        <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                                            <div style={{ width: '24px', height: '24px', border: '2px solid #cbd5e1', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                            <span className="text-sm mt-2">Đang tải danh sách người dùng...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                                            <User size={48} className="text-slate-300" />
                                            <p>Không tìm thấy người dùng nào</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user, index) => {
                                    const uFullName = user.fullName || (user as any).FullName || '';
                                    const uUserName = user.userName || (user as any).UserName || '';
                                    const uRole = (user.role || (user as any).Role || '').toUpperCase();
                                    const uLocations = user.locations || user.Locations || [];
                                    const uId = user.id || (user as any).Id;

                                    return (
                                        <tr key={uId || index} className="hover:bg-slate-50" style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s' }}>
                                            <td className="text-center" style={{ color: '#64748b', fontSize: '13.5px' }}>{index + 1}</td>
                                            <td>
                                                <div className="font-semibold" style={{ color: '#0f172a', fontSize: '14px' }}>
                                                    {uFullName}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ color: '#334155', fontSize: '14px' }}>
                                                    {uUserName}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                                                    <span style={{ 
                                                        display: 'inline-block',
                                                        padding: '4px 10px', 
                                                        borderRadius: '6px', 
                                                        fontSize: '12px', 
                                                        fontWeight: 600,
                                                        backgroundColor: uRole === 'ADMIN' ? '#fef2f2' : uRole === 'AGENCY' ? '#eff6ff' : uRole === 'LOCATION' ? '#f5f3ff' : '#f0fdf4',
                                                        color: uRole === 'ADMIN' ? '#b91c1c' : uRole === 'AGENCY' ? '#1d4ed8' : uRole === 'LOCATION' ? '#6d28d9' : '#15803d',
                                                        border: `1px solid ${uRole === 'ADMIN' ? '#fecaca' : uRole === 'AGENCY' ? '#bfdbfe' : uRole === 'LOCATION' ? '#ddd6fe' : '#bbf7d0'}`
                                                    }}>
                                                        {uRole === 'ADMIN' ? 'Quản trị viên (ADMIN)' : uRole === 'LOCATION' ? 'Địa phương (LOCATION)' : uRole === 'AGENCY' ? 'Đại lý (AGENCY)' : uRole}
                                                    </span>
                                                    {uRole === 'LOCATION' && uLocations.length > 0 && (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '280px' }}>
                                                            {uLocations.map((locCode, lIdx) => {
                                                                const locName = locationsMap[locCode] || locCode;
                                                                return (
                                                                    <span 
                                                                        key={lIdx} 
                                                                        style={{ 
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '3px',
                                                                            fontSize: '11px', 
                                                                            padding: '2px 6px', 
                                                                            borderRadius: '4px', 
                                                                            backgroundColor: '#ede9fe', 
                                                                            color: '#5b21b6',
                                                                            border: '1px solid #ddd6fe',
                                                                            fontWeight: 500
                                                                        }}
                                                                        title={`Mã tỉnh: ${locCode}`}
                                                                    >
                                                                        <MapPin size={10} />
                                                                        <span>{locName}</span>
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        <td>
                                            <div className="flex items-center justify-center gap-xs">
                                                <button 
                                                    className="btn btn-text"
                                                    title="Chỉnh sửa"
                                                    style={{ color: '#d97706', width: '34px', height: '34px', padding: 0, borderRadius: '8px' }}
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowUserModal(true);
                                                    }}
                                                >
                                                    <Pencil size={17} />
                                                </button>
                                                <button 
                                                    className="btn btn-text"
                                                    title="Xóa người dùng"
                                                    style={{ color: '#dc2626', width: '34px', height: '34px', padding: 0, borderRadius: '8px' }}
                                                    onClick={() => setUserToDelete(user)}
                                                >
                                                    <Trash2 size={17} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer status bar */}
                <div className="flex items-center justify-between flex-col-mobile gap-sm" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', backgroundColor: '#ffffff' }}>
                    <div className="text-sm" style={{ color: '#64748b' }}>
                        Hiển thị <strong>{filteredUsers.length}</strong> người dùng
                    </div>
                </div>
            </div>

            {showUserModal && (
                <UserModal 
                    isOpen={showUserModal}
                    user={selectedUser}
                    onClose={() => setShowUserModal(false)}
                    onSuccess={() => void fetchUsers()}
                />
            )}

            <ConfirmModal 
                isOpen={!!userToDelete}
                title="Xác nhận xóa người dùng"
                message={
                    <span>
                        Bạn có chắc chắn muốn xóa người dùng <strong>{userToDelete?.fullName}</strong> ({userToDelete?.userName}) không? Hành động này sẽ xóa dữ liệu người dùng khỏi hệ thống và không thể hoàn tác.
                    </span>
                }
                confirmText="Xóa người dùng"
                cancelText="Hủy bỏ"
                isLoading={isDeleting}
                icon={<Trash2 size={24} />}
                onConfirm={handleDelete}
                onCancel={() => setUserToDelete(null)}
            />
        </div>
    );
}
