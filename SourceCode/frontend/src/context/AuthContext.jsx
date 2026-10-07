import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

// Helper dinh vi trang chu chuan xac cho tung role
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
    const saved = localStorage.getItem('roms_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('roms_token') || null);

  const login = async (username, pinCode) => {
    try {
      // 1. Gọi API Backend thật
      const response = await authApi.login(username, pinCode);

      // Backend trả về: { success: true, data: { token, id, username, fullName, role } }
      const { token, id, fullName, role } = response.data.data;
      const userData = { id, username, fullName, role };
      // 2. Lưu token và thông tin user vào localStorage
      localStorage.setItem('roms_token', token);
      localStorage.setItem('roms_user', JSON.stringify(userData));
      // 3. Cập nhật state
      setToken(token);
      setUser(userData);
      return { success: true, role };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!';
      return { success: false, message: errorMsg };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('roms_user');
    localStorage.removeItem('roms_token');
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
