import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Ship, 
    Anchor, 
    Users, 
    LogOut,
    Menu,
    LifeBuoy
} from 'lucide-react';
import './MainLayout.css';

export default function MainLayout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/login');
    };

    return (
        <div className="layout-container flex h-full">
            {/* Sidebar */}
            <aside className="sidebar flex flex-col h-full">
                <div className="sidebar-header flex items-center justify-center gap-sm">
                    <LifeBuoy size={28} />
                    Hệ Thống Quản Lý
                </div>
                <nav className="nav-menu">
                    <NavLink to="/" end className={({ isActive }) => `nav-item flex items-center gap-sm ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} />
                        Tổng quan
                    </NavLink>
                    <NavLink to="/departures" className={({ isActive }) => `nav-item flex items-center gap-sm ${isActive ? 'active' : ''}`}>
                        <Ship size={20} />
                        Danh sách xuất bến
                    </NavLink>
                    <NavLink to="/arrivals" className={({ isActive }) => `nav-item flex items-center gap-sm ${isActive ? 'active' : ''}`}>
                        <Anchor size={20} />
                        Danh sách cập bến
                    </NavLink>
                    
                    <div className="menu-group-title flex items-center gap-xs">
                        <Menu size={14} /> Hồ sơ tàu
                    </div>
                    <div className="sub-menu">
                        <NavLink to="/ships" className={({ isActive }) => `nav-item flex items-center gap-sm ${isActive ? 'active' : ''}`}>
                            <Ship size={18} />
                            Danh sách tàu
                        </NavLink>
                        <NavLink to="/owners" className={({ isActive }) => `nav-item flex items-center gap-sm ${isActive ? 'active' : ''}`}>
                            <Users size={18} />
                            Danh sách chủ tàu
                        </NavLink>
                    </div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="main-content flex flex-col">
                {/* Topbar */}
                <header className="topbar flex items-center justify-between">
                    <div></div>
                    <button onClick={handleLogout} className="btn btn-outline flex items-center gap-sm" style={{color: 'var(--error-color)', borderColor: 'var(--error-bg)'}}>
                        <LogOut size={16} />
                        Đăng xuất
                    </button>
                </header>

                {/* Dynamic Page Content goes here */}
                <div className="page-content">
                    <div className="card h-full">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
