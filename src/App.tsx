import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import MainLayout from './layouts/MainLayout';
import Overview from './pages/dashboard/Overview';
import DepartureList from './pages/departures/DepartureList';
import ArrivalList from './pages/arrivals/ArrivalList';
import ShipList from './pages/ships/ShipList';
import OwnerList from './pages/owners/OwnerList';
import type {JSX} from "react";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { config } from './config/config';

// Component bảo vệ các route yêu cầu đăng nhập
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// Component ngăn user đã đăng nhập vào lại trang login
const PublicRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        return <Navigate to="/" replace />;
    }
    return children;
};

function LoginWrapper() {
    const navigate = useNavigate();
    return <Login onLoginSuccess={() => navigate('/')} />;
}

export default function App() {
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const accessToken = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');

            // Nếu mất accessToken nhưng vẫn còn refreshToken (ví dụ hết hạn session)
            // hoặc bạn muốn lúc nào vào trang cũng test refresh token
            if (!accessToken && refreshToken) {
                try {
                    const { data } = await axios.patch(`${config.baseUrl}/api/v1/Auth/RefreshToken`, undefined, {
                        headers: {
                            'Authorization': `Bearer ${refreshToken}`
                        }
                    });
                    
                    localStorage.setItem('accessToken', data.data.accessToken);
                    localStorage.setItem('refreshToken', data.data.refreshToken);
                } catch (error) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                }
            }
            
            setIsInitializing(false);
        };

        checkAuth();
    }, []);

    if (isInitializing) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <h2>Đang kiểm tra đăng nhập...</h2>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={
                    <PublicRoute>
                        <LoginWrapper />
                    </PublicRoute>
                } />
                
                {/* Các route bên trong MainLayout */}
                <Route path="/" element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Overview />} />
                    <Route path="departures" element={<DepartureList />} />
                    <Route path="arrivals" element={<ArrivalList />} />
                    <Route path="ships" element={<ShipList />} />
                    <Route path="owners" element={<OwnerList />} />
                </Route>
                
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
