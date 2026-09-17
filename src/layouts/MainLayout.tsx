import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
    Menu,
    LayoutDashboard, 
    Ship, 
    Anchor, 
    Users, 
    LogOut,
    Sailboat,
    ChevronDown
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { getUserRole } from '../utils/jwt';
import './MainLayout.css';

export default function MainLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const isShipProfileRoute = location.pathname.startsWith('/ships') || location.pathname.startsWith('/owners');
    const [isShipProfileExpanded, setIsShipProfileExpanded] = useState(isShipProfileRoute);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        setUserRole(getUserRole());
    }, []);

    // Khi người dùng chuyển sang các tab khác ngoài Hồ sơ tàu, tự động thu gọn 2 tab con lại
    useEffect(() => {
        setIsSidebarOpen(false);
        if (isShipProfileRoute) {
            setIsShipProfileExpanded(true);
        } else {
            setIsShipProfileExpanded(false);
        }
    }, [location.pathname]);

    const handleShipProfileClick = () => {
        if (!isShipProfileExpanded) {
            setIsShipProfileExpanded(true);
            if (!isShipProfileRoute) {
                navigate('/ships');
            }
        } else {
            setIsShipProfileExpanded(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/login');
    };

    return (
        <div className="layout-container flex h-full">
            {/* Mobile Header */}
            <div className="mobile-header">
                <div className="flex items-center gap-sm">
                    <Anchor size={20} color="#60a5fa" />
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>SEADIARY</span>
                </div>
                <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
                    <Menu size={24} />
                </button>
            </div>

            {/* Sidebar Overlay */}
            <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header flex items-center gap-sm">
                    <div className="sidebar-logo-badge">
                        <Anchor size={22} color="#ffffff" />
                    </div>
                    <div>
                        <div className="sidebar-title">SEADIARY</div>
                        <div className="sidebar-subtitle">NHẬT KÝ ĐIỆN TỬ</div>
                    </div>
                </div>

                <nav className="nav-menu">
                    <NavLink to="/" end className={({ isActive }) => `nav-item flex items-center gap-sm ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={18} />
                        <span>Tổng quan</span>
                    </NavLink>
                    <NavLink to="/departures" className={({ isActive }) => `nav-item flex items-center gap-sm ${isActive ? 'active' : ''}`}>
                        <Sailboat size={18} />
                        <span>Danh sách xuất bến</span>
                    </NavLink>
                    <NavLink to="/arrivals" className={({ isActive }) => `nav-item flex items-center gap-sm ${isActive ? 'active' : ''}`}>
                        <Anchor size={18} />
                        <span>Danh sách cập bến</span>
                    </NavLink>
                    
                    {/* Tab Hồ sơ tàu - Nhấn vào để mở rộng 2 tab con */}
                    <button 
                        type="button" 
                        onClick={handleShipProfileClick}
                        className={`nav-item flex items-center justify-between w-full ${isShipProfileRoute ? 'active-parent' : ''}`}
                    >
                        <div className="flex items-center gap-sm">
                            <Ship size={18} />
                            <span>Hồ sơ tàu</span>
                        </div>
                        <ChevronDown 
                            size={16} 
                            style={{ 
                                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isShipProfileExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                                color: isShipProfileRoute ? '#60a5fa' : '#64748b'
                            }} 
                        />
                    </button>

                    {/* Chỉ hiện 2 tab con khi isShipProfileExpanded = true */}
                    {isShipProfileExpanded && (
                        <div className="sub-menu">
                            <NavLink to="/ships" className={({ isActive }) => `nav-item flex items-center gap-sm ${isActive ? 'active' : ''}`}>
                                <Ship size={16} />
                                <span>Danh sách tàu</span>
                            </NavLink>
                            <NavLink to="/owners" className={({ isActive }) => `nav-item flex items-center gap-sm ${isActive ? 'active' : ''}`}>
                                <Users size={16} />
                                <span>Danh sách chủ tàu</span>
                            </NavLink>
                        </div>
                    )}
                
                    {/* Menu dành cho ADMIN */}
                    {userRole === 'ADMIN' && (
                        <NavLink to="/users" className={({ isActive }) => `nav-item flex items-center gap-sm ${isActive ? 'active' : ''}`}>
                            <Users size={18} />
                            <span>Quản lý người dùng</span>
                        </NavLink>
                    )}
                </nav>

                {/* Nút đăng xuất ở đáy của sidebar */}
                <div className="sidebar-footer">
                    <button 
                        type="button" 
                        onClick={() => setShowLogoutConfirm(true)} 
                        className="sidebar-logout-btn"
                    >
                        <LogOut size={17} />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                <div className="page-content">
                    <div className="card main-card h-full flex flex-col">
                        <Outlet />
                    </div>
                </div>
            </main>

            {/* Hộp thoại xác nhận đăng xuất */}
            <ConfirmModal
                isOpen={showLogoutConfirm}
                title="Xác nhận đăng xuất"
                message="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống Nhật ký điện tử không?"
                confirmText="Đăng xuất"
                cancelText="Hủy bỏ"
                icon={<LogOut size={22} />}
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutConfirm(false)}
            />
        </div>
    );
}
