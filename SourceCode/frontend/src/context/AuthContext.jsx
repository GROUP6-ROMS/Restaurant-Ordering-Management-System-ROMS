import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext();

export function getRoleHome(role) {
  switch (role?.toUpperCase()) {
    case 'MANAGER':
    case 'ADMIN':
      return '/admin/reports';
    case 'WAITER':
    case 'BARTENDER':
      return '/waiter/floor-plan';
    case 'KITCHEN':
      return '/kitchen/kds';
    case 'CASHIER':
      return '/pos/checkout';
    default:
      return '/login';
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('roms_user') || localStorage.getItem('roms_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => sessionStorage.getItem('roms_token') || localStorage.getItem('roms_token') || null);

  const login = async (username, pinCode) => {
    try {
      const response = await authApi.login(username, pinCode);

      // Backend trả về: { success: true, data: { accessToken, tokenType, id, username, fullName, role, assignedShift, isOnShift } }
      const resData = response.data?.data || {};
      const authToken = resData.accessToken || resData.token;
      const { id, fullName, role, assignedShift, isOnShift } = resData;
      const userData = { id, username: resData.username || username, fullName, role, assignedShift, isOnShift };

      // Lưu sessionStorage (độc lập từng tab khi test nhiều tài khoản song song)
      sessionStorage.setItem('roms_token', authToken);
      sessionStorage.setItem('roms_user', JSON.stringify(userData));
      localStorage.setItem('roms_token', authToken);
      localStorage.setItem('roms_user', JSON.stringify(userData));

      setToken(authToken);
      setUser(userData);
      return { success: true, role };
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!';
      return { success: false, message: errorMsg };
    }
  };

  const logout = async () => {
    try {
      if (user?.username) {
        await authApi.logout(user.username);
      }
    } catch (e) {
      console.warn('Lỗi gọi API đăng xuất:', e);
    } finally {
      setUser(null);
      setToken(null);
      // Chỉ đăng xuất tab hiện tại khỏi sessionStorage
      sessionStorage.removeItem('roms_user');
      sessionStorage.removeItem('roms_token');
      localStorage.removeItem('roms_user');
      localStorage.removeItem('roms_token');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      login,
      logout,
      getRoleHome
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
