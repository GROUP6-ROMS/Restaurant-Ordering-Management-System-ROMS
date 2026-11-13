import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../common/Icon';
import RomsLogo from '../common/RomsLogo';
import NotificationBell from '../common/NotificationBell';
import RestaurantProfileModal from '../admin/RestaurantProfileModal';
import ShiftStatusWidget from '../admin/ShiftStatusWidget';
import { useRestaurantProfile } from '../../utils/restaurantConfig';
import './adminLayout.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const restaurantProfile = useRestaurantProfile();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = currentTime.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });

  const navItems = [
    {
      path: '/admin/reports',
      label: 'Báo Cáo & Vận Hành',
      icon: 'analytics'
    },
    {
      path: '/admin/tables',
      label: 'Sơ Đồ Bàn & Khu Vực',
      icon: 'table_restaurant'
    },
    {
      path: '/admin/menu',
      label: 'Thực Đơn & Món Ăn',
      icon: 'restaurant_menu'
    },
    {
      path: '/admin/staff',
      label: 'Nhân Sự & Phân Ca',
      icon: 'badge'
    }
  ];

  const [showConfirmLogoutModal, setShowConfirmLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Accessibility: Lắng nghe phím Escape để đóng nhanh các modal và Mobile Drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (mobileDrawerOpen) setMobileDrawerOpen(false);
        if (showConfirmLogoutModal) setShowConfirmLogoutModal(false);
        if (showProfileModal) setShowProfileModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileDrawerOpen, showConfirmLogoutModal, showProfileModal]);

  // Tự động đóng Mobile Drawer khi người dùng đổi trang
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowConfirmLogoutModal(false);
      navigate('/login');
    } catch (err) {
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="admin-layout-container">
      {/* Top Header */}
      <header className="admin-header">
        {/* Left: Hamburger (Mobile) + Brand & Suite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Hamburger button on Mobile / Tablet */}
          <button
            type="button"
            className="admin-hamburger-btn"
            onClick={() => setMobileDrawerOpen(prev => !prev)}
            aria-label="Mở menu quản trị"
            title="Mở menu thanh điều hướng"
          >
            <Icon name={mobileDrawerOpen ? 'close' : 'menu'} size={22} />
          </button>

          <Link to="/admin/reports" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <RomsLogo size={32} />
            <div>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#9D4124', lineHeight: 1 }}>
                ROMS Suite
              </div>
              <div style={{ fontSize: '0.64rem', color: '#89726B', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                Quản Trị Nhà Hàng
              </div>
            </div>
          </Link>

          <div
            className="admin-header-online-badge"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F2F8ED', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.74rem', color: '#3A5A20', fontWeight: 600 }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4CAF50' }} />
            <span>Hệ Thống Trực Tuyến</span>
          </div>

          {/* Quick Restaurant Profile Switcher / Config Button */}
          <button
            type="button"
            className="admin-config-btn"
            onClick={() => setShowProfileModal(true)}
            title="Tùy biến thương hiệu & thông tin quán (K80, VietQR, Báo cáo)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFFFFF',
              border: '1.5px solid #FFDBC9',
              padding: '5px 12px',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              color: '#9D4124',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <Icon name="storefront" size={16} />
            <span>{restaurantProfile.brandName || 'Cấu Hình Quán'}</span>
            <Icon name="tune" size={14} style={{ color: '#89726B' }} />
          </button>
        </div>

        {/* Center: Clock (Ẩn trên mobile) */}
        <div className="admin-header-center-clock">
          <Icon name="schedule" size={18} style={{ color: '#9D4124' }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.92rem', color: '#1F1B1A' }}>
            {timeStr}
          </span>
          <span style={{ color: '#89726B', fontSize: '0.75rem' }}>• {dateStr}</span>
        </div>

        {/* Right: Notification Bell, Profile & Unified Logout button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Chuông Thông Báo Quản Trị (Bàn gọi hỗ trợ & Đặt bàn mới) */}
          <NotificationBell />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'right' }}>
            <div className="admin-user-details">
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: user ? '#1F1B1A' : '#BA1A1A' }}>
                {user?.fullName || 'Chưa Đăng Nhập'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#89726B' }}>
                {user ? `Mã NV: ${user.username} • Quản Lý` : 'Vui lòng đăng nhập lại'}
              </div>
            </div>
            <div
              title={`${user?.fullName || ''} (${user?.username || ''})`}
              style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#FFDBC9', color: '#9D4124', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.82rem' }}
            >
              {user?.fullName ? user.fullName.split(' ').slice(-1)[0][0] : '?'}
            </div>
          </div>

          {/* Unified Logout Button */}
          <button
            type="button"
            className="admin-logout-btn"
            onClick={() => setShowConfirmLogoutModal(true)}
            title="Đăng xuất khỏi tài khoản"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid #EAE0DE',
              background: '#FFFFFF',
              color: '#BA1A1A',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name="logout" size={16} />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </header>

      {/* Body with Sidebar & Content */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', minHeight: 0 }}>
        {/* Mobile Backdrop Overlay */}
        <div
          className={`admin-drawer-overlay ${mobileDrawerOpen ? 'open' : ''}`}
          onClick={() => setMobileDrawerOpen(false)}
        />

        {/* Sidebar (Desktop Side Nav / Mobile Drawer) */}
        <aside className={`admin-sidebar ${mobileDrawerOpen ? 'open' : ''}`}>
          <div>
            {/* Header riêng cho Drawer trên Mobile */}
            <div className="admin-drawer-mobile-header" style={{ alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 14px', borderBottom: '1px solid #F0E6E4', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RomsLogo size={28} />
                <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.95rem', color: '#9D4124' }}>
                  ROMS Quản Trị
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #EAE0DE',
                  background: '#FFF8F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#56423D',
                  cursor: 'pointer'
                }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#89726B', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 8px 10px' }}>
              Khu Vực Quản Trị
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {navItems.map(item => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileDrawerOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      background: isActive ? '#9D4124' : 'transparent',
                      color: isActive ? '#FFFFFF' : '#56423D',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon name={item.icon} size={19} fill={isActive ? 1 : 0} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <Icon name="chevron_right" size={18} />}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Shift Status */}
          <div style={{ marginTop: '20px', paddingTop: '10px', flexShrink: 0, borderTop: '1px solid #EAE0DE' }}>
            <ShiftStatusWidget currentTime={currentTime} />
          </div>
        </aside>

        {/* Content Area */}
        <main className="admin-main-content">
          <Outlet />
        </main>
      </div>

      {/* CONFIRM DIALOG ĐĂNG XUẤT CHO QUẢN TRỊ VIÊN / QUẢN LÝ */}
      {showConfirmLogoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(31, 27, 26, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '440px',
            width: '100%',
            padding: '26px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            border: '1.5px solid #EAE0DE',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: '#FFDAD6',
                color: '#BA1A1A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon name="logout" size={24} />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1F1B1A', margin: 0 }}>
                  Xác Nhận Đăng Xuất
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#89726B', fontWeight: 600 }}>
                  Thoát phiên làm việc Quản trị ROMS
                </span>
              </div>
            </div>

            <div style={{
              background: '#FFF8F6',
              borderRadius: '14px',
              padding: '14px',
              border: '1px solid #F0E6E4',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '0.82rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#89726B' }}>Quản trị viên:</span>
                <strong style={{ color: '#1F1B1A' }}>{user?.fullName || 'Quản trị viên'} ({user?.username})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#89726B' }}>Vai trò:</span>
                <span style={{ fontWeight: 700, color: '#753400', background: '#FFDBC9', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  {user?.role || 'MANAGER'}
                </span>
              </div>
            </div>

            <p style={{ margin: '0 0 20px', fontSize: '0.8rem', color: '#56423D', lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn đăng xuất khỏi Trung Tâm Điều Hành Quản Trị?
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmLogoutModal(false)}
                disabled={isLoggingOut}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#F0E6E4',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#56423D',
                  cursor: 'pointer'
                }}
              >
                Ở Lại
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                style={{
                  flex: 1.3,
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#BA1A1A',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Icon name="logout" size={18} />
                {isLoggingOut ? 'Đang Đăng Xuất...' : 'Xác Nhận Đăng Xuất'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cấu hình Thông tin Quán & Thương hiệu Versatile */}
      <RestaurantProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}
