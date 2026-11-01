import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext();

export function getRoleHome(role) {
  switch (role?.toUpperCase()) {
    case 'MANAGER':
      return '/admin/reports';
    case 'WAITER':
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
  // Dọn dẹp tàn dư localStorage cũ (nếu có) để tránh rò rỉ phiên giữa các tab
  if (typeof window !== 'undefined' && (localStorage.getItem('roms_user') || localStorage.getItem('roms_token'))) {
    localStorage.removeItem('roms_user');
    localStorage.removeItem('roms_token');
  }

  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('roms_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => sessionStorage.getItem('roms_token') || null);

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
      localStorage.removeItem('roms_token');
      localStorage.removeItem('roms_user');

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
      // Đăng xuất tab hiện tại khỏi sessionStorage
      sessionStorage.removeItem('roms_user');
      sessionStorage.removeItem('roms_token');
      localStorage.removeItem('roms_user');
      localStorage.removeItem('roms_token');
    }
  };

  // ===================================================================
  // TỰ ĐỘNG ĐỒNG BỘ PHIÊN LÀM VIỆC & DUY TRÌ TRẠNG THÁI CA TRỰC (HEARTBEAT)
  // ===================================================================
  useEffect(() => {
    if (!token || !user?.username) return;

    const syncHeartbeat = async () => {
      try {
        const res = await authApi.heartbeat(user.username);
        if (res?.data?.success && res.data.data?.isOnShift) {
          setUser((prev) => {
            if (!prev) return prev;
            if (prev.isOnShift !== true) {
              const updated = { ...prev, isOnShift: true };
              sessionStorage.setItem('roms_user', JSON.stringify(updated));
              return updated;
            }
            return prev;
          });
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          console.warn('[AuthContext] Phiên làm việc hết hạn hoặc bị thu hồi:', err.response?.data?.message);
          logout();
        }
      }
    };

    // Kích hoạt ngay khi mở tab / F5 và lặp lại định kỳ mỗi 60 giây
    syncHeartbeat();
    const heartbeatTimer = setInterval(syncHeartbeat, 60000);

    const handleFocus = () => syncHeartbeat();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(heartbeatTimer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [token, user?.username]);

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
