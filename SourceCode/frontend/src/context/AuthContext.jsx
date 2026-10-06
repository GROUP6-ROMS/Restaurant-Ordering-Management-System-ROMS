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

  const login = (username, password, explicitRole = null, customFullName = null) => {
    let role = explicitRole || 'WAITER';
    let fullName = customFullName || 'Nhân Viên Phục Vụ';

    if (!explicitRole) {
      const u = username.toLowerCase();
      if (u.includes('admin') || u.includes('manager') || u.includes('mgr')) {
        role = 'MANAGER';
      } else if (u.includes('kitchen') || u.includes('bep')) {
        role = 'KITCHEN';
      } else if (u.includes('cashier') || u.includes('thungan')) {
        role = 'CASHIER';
      } else {
        role = 'WAITER';
      }
    }

    if (!customFullName) {
      if (role === 'MANAGER' || role === 'ADMIN') {
        fullName = 'Trần Anh Thư (Quản Lý)';
      } else if (role === 'KITCHEN') {
        fullName = 'Vũ Đức Thắng (Bếp Trưởng)';
      } else if (role === 'CASHIER') {
        fullName = 'Hoàng Hải Yến (Thu Ngân)';
      } else {
        fullName = 'Nguyễn Văn An (Bồi Bàn)';
      }
    }

    const userData = { username, fullName, role };
    const fakeToken = 'jwt-mock-' + Date.now();

    setUser(userData);
    setToken(fakeToken);

    localStorage.setItem('roms_user', JSON.stringify(userData));
    localStorage.setItem('roms_token', fakeToken);

    return { success: true, user: userData };
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
