import { useState } from 'react';
import './Login.css';
import { loginAPI } from '../../features/API/auth/Auth.ts';
import type { ServiceResponse } from '../../types/api';
import * as React from "react";

export default function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Lưu lỗi từ server
    const [mainError, setMainError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Reset errors
        setMainError(null);
        setFieldErrors({});
        setIsLoading(true);

        try {
            const data = await loginAPI({ userName, password });
            
            // Lưu token vào localStorage
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            
            onLoginSuccess();
            
        } catch (error) {
            const errorResponse = error as ServiceResponse;
            
            if (errorResponse.status === 400 && errorResponse.errors) {
                // Lỗi validate từng field
                setFieldErrors(errorResponse.errors);
            } else {
                // Lỗi chung
                setMainError(errorResponse.message || 'Có lỗi xảy ra, vui lòng thử lại.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container flex items-center justify-center">
            <div className="card login-card">
                <h2 className="text-center font-bold text-lg login-title">Đăng nhập</h2>
                
                {mainError && (
                    <div className="main-error">
                        {mainError}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                    <div>
                        <label className="form-label">Tên người dùng</label>
                        <input
                            type="text"
                            className="input"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="Nhập tên người dùng"
                        />
                        {fieldErrors.UserName && (
                            <span className="text-error text-sm mt-xs block">{fieldErrors.UserName[0]}</span>
                        )}
                    </div>
                    
                    <div>
                        <label className="form-label">Mật khẩu</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nhập mật khẩu"
                        />
                        {fieldErrors.Password && (
                            <span className="text-error text-sm mt-xs block">{fieldErrors.Password[0]}</span>
                        )}
                    </div>
                    
                    <button 
                        type="submit" 
                        className="btn btn-primary w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                    </button>
                </form>
            </div>
        </div>
    );
}
