import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { disconnectRealtime } from '../utils/realtimeSync';

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
      // Đóng toàn bộ kết nối WebSocket STOMP và giải phóng bộ nhớ
      disconnectRealtime();

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
  // TỰ ĐỘNG CHUYỂN SANG OFFLINE KHI ĐÓNG TAB TRÌNH DUYỆT (SOLUTION 1C)
  // ===================================================================
  useEffect(() => {
    if (!token || !user?.username) return;

    // 1. Tạo hoặc lấy tab ID duy nhất cho tab này
    let tabId = sessionStorage.getItem('roms_tab_id');
    if (!tabId) {
      tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      sessionStorage.setItem('roms_tab_id', tabId);
    }

    // Hàm cập nhật sự hiện diện của tab vào localStorage
    const updateTabPresence = () => {
      try {
        const raw = localStorage.getItem('roms_active_staff_tabs');
        const tabs = raw ? JSON.parse(raw) : {};
        tabs[tabId] = {
          username: user.username,
          lastSeen: Date.now()
        };
        // Dọn dẹp các tab cũ không update quá 45 giây
        const now = Date.now();
        Object.keys(tabs).forEach(id => {
          if (now - tabs[id].lastSeen > 45000) {
            delete tabs[id];
          }
        });
        localStorage.setItem('roms_active_staff_tabs', JSON.stringify(tabs));
      } catch (e) {
        // Safe catch
      }
    };

    updateTabPresence();

    // 2. Gửi tín hiệu Heartbeat định kỳ mỗi 30 giây (duy trì isOnShift = true)
    const syncHeartbeat = async () => {
      try {
        updateTabPresence();
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

    // Kích hoạt ngay khi mở tab / F5 và lặp lại định kỳ mỗi 30 giây
    syncHeartbeat();
    const heartbeatTimer = setInterval(syncHeartbeat, 30000);

    const handleFocus = () => syncHeartbeat();
    window.addEventListener('focus', handleFocus);

    // 3. Xử lý khi đóng tab / tắt trình duyệt (pagehide / beforeunload)
    // Tự động gửi tín hiệu chuyển sang OFFLINE nếu không còn tab nào khác của nhân viên này mở
    const handleTabClose = () => {
      try {
        const raw = localStorage.getItem('roms_active_staff_tabs');
        const tabs = raw ? JSON.parse(raw) : {};
        delete tabs[tabId];
        localStorage.setItem('roms_active_staff_tabs', JSON.stringify(tabs));

        // Kiểm tra xem còn tab nào khác của nhân viên này còn sống (< 45 giây)
        const now = Date.now();
        const hasOtherActiveTab = Object.values(tabs).some(
          t => t.username === user.username && (now - t.lastSeen < 45000)
        );

        // Nếu đây là tab cuối cùng của nhân viên này, gửi tín hiệu đăng xuất ca trực
        if (!hasOtherActiveTab) {
          const payload = JSON.stringify({ username: user.username });
          const authHeaders = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          };
          if (typeof fetch === 'function') {
            fetch('/api/auth/logout', {
              method: 'POST',
              headers: authHeaders,
              body: payload,
              keepalive: true
            }).catch(() => {});
          } else if (navigator.sendBeacon) {
            const logoutUrl = token ? `/api/auth/logout?token=${encodeURIComponent(token)}` : '/api/auth/logout';
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon(logoutUrl, blob);
          }
        }
      } catch (e) {
        // Safe catch
      }
    };

    window.addEventListener('pagehide', handleTabClose);
    window.addEventListener('beforeunload', handleTabClose);

    return () => {
      clearInterval(heartbeatTimer);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pagehide', handleTabClose);
      window.removeEventListener('beforeunload', handleTabClose);
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
