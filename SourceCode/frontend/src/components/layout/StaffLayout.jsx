import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../common/Icon';
import RomsLogo from '../common/RomsLogo';

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen to fullscreenchange
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Modal Manager Approval Logout
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [managerPin, setManagerPin] = useState('');
  const [handoverNote, setHandoverNote] = useState('');
  const [logoutError, setLogoutError] = useState(null);

  // Digital clock update
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTriggerLogout = () => {
    // If manager or admin, logout directly
    if (user?.role === 'MANAGER' || user?.role === 'ADMIN') {
      logout();
      navigate('/login');
      return;
    }

    // Non-manager staff requires Manager PIN approval
    setManagerPin('');
    setHandoverNote('');
    setLogoutError(null);
    setShowLogoutModal(true);
  };

  const handleConfirmStaffLogout = (e) => {
    if (e) e.preventDefault();
    if (!managerPin || managerPin.trim().length !== 6 || !/^\d{6}$/.test(managerPin.trim())) {
      setLogoutError('Vui lòng nhập chính xác mã PIN Quản Lý (6 chữ số)!');
      return;
    }

    // Manager approval successful
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  // Station info based on role
  const getStationInfo = () => {
    switch (user?.role) {
      case 'KITCHEN':
        return {
          title: 'Màn Hình Bếp (KDS)',
          icon: 'soup_kitchen',
          badgeBg: '#FFDAD6',
          badgeColor: '#93000A'
        };
      case 'CASHIER':
        return {
          title: 'Quầy Thu Ngân (POS)',
          icon: 'point_of_sale',
          badgeBg: '#FFDBC9',
          badgeColor: '#753400'
        };
      case 'WAITER':
      default:
        return {
          title: 'Trạm Phục Vụ Bàn & Sơ Đồ Sảnh',
          icon: 'table_restaurant',
          badgeBg: '#DDE8AB',
          badgeColor: '#181E00'
        };
    }
  };

  const station = getStationInfo();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FFF8F6', width: '100%' }}>
      {/* Topbar gom Logo, Tên trạm, Đồng hồ, Thông tin nhân viên & Nút Đăng xuất (KHÔNG CÓ ASIDE) */}
      <header style={{
        height: isMobile ? '52px' : '60px',
        background: '#FFFFFF',
        borderBottom: '1px solid #EAE0DE',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 20px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.03)'
      }}>
        {/* Left: Brand Logo & Station Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RomsLogo size={isMobile ? 26 : 32} />
            <div>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: isMobile ? '0.95rem' : '1.05rem', color: '#9D4124', lineHeight: 1 }}>
                ROMS
              </div>
              {!isMobile && (
                <div style={{ fontSize: '0.65rem', color: '#89726B', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                  Operations Terminal
                </div>
              )}
            </div>
          </div>

          <div style={{ height: isMobile ? '18px' : '24px', width: '1px', background: '#EAE0DE' }} />

          {/* Station Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: isMobile ? '4px 8px' : '5px 12px',
            borderRadius: '10px',
            background: station.badgeBg,
            color: station.badgeColor
          }}>
            <Icon name={station.icon} size={isMobile ? 16 : 18} />
            <span style={{ fontWeight: 800, fontSize: isMobile ? '0.74rem' : '0.82rem', fontFamily: "'Epilogue', sans-serif" }}>
              {isMobile && user?.role === 'WAITER' ? 'Phục Vụ' : station.title}
            </span>
          </div>
        </div>

        {/* Right: Clock, Staff info & Unified Logout button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
          {/* Digital Clock (hidden on mobile) */}
          {!isMobile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FCF1EF',
              border: '1px solid #EAE0DE',
              padding: '5px 12px',
              borderRadius: '10px'
            }}>
              <Icon name="schedule" size={16} style={{ color: '#9D4124' }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.85rem', color: '#1F1B1A' }}>
                {time}
              </span>
            </div>
          )}

          {/* Staff Info */}
          <div
            title={`${user?.fullName || 'Nhân viên'} (${user?.username || ''})`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FCF1EF',
              padding: isMobile ? '3px' : '4px 12px 4px 6px',
              borderRadius: '9999px',
              border: '1px solid #EAE0DE'
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#9D4124',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.75rem'
            }}>
              {user?.fullName ? user.fullName.split(' ').slice(-1)[0][0] : 'S'}
            </div>
            {!isMobile && (
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1F1B1A' }}>
                  {user?.fullName || 'Nhân viên'}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#89726B', fontFamily: 'monospace' }}>
                  {user?.username || '#EMP-8842'}
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thu nhỏ / Thoát toàn màn hình' : 'Mở toàn màn hình'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: isMobile ? '6px 8px' : '7px 12px',
              borderRadius: '10px',
              background: isFullscreen ? '#9D4124' : '#FCF1EF',
              color: isFullscreen ? '#FFFFFF' : '#56423D',
              border: isFullscreen ? '1px solid #9D4124' : '1px solid #EAE0DE',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name={isFullscreen ? 'fullscreen_exit' : 'fullscreen'} size={18} />
            {!isMobile && <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>}
          </button>

          {/* Unified Logout Button */}
          <button
            type="button"
            onClick={handleTriggerLogout}
            title="Đăng xuất khỏi ca trực"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: isMobile ? '6px 10px' : '7px 14px',
              borderRadius: '10px',
              border: '1px solid #EAE0DE',
              background: '#FFFFFF',
              color: '#BA1A1A',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name="logout" size={16} />
            {!isMobile && <span>Đăng Xuất</span>}
          </button>
        </div>
      </header>

      {/* Main Terminal Viewport - 100% full width with mobile bottom padding for Waiter */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        background: '#FFF8F6',
        width: '100%',
        paddingBottom: user?.role === 'WAITER' ? '70px' : '0'
      }}>
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar exclusively for WAITER */}
      {user?.role === 'WAITER' && (
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '62px',
          background: '#FFFFFF',
          borderTop: '1px solid #EAE0DE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 90,
          boxShadow: '0 -3px 12px rgba(0,0,0,0.06)',
          padding: '0 6px'
        }}>
          {[
            { path: '/waiter/floor-plan', label: 'Sơ Đồ Bàn', icon: 'table_restaurant' },
            { path: '/waiter/floor-plan?filter=CALLING', label: 'Cần Hỗ Trợ', icon: 'notifications_active', badge: 2 },
            { path: '/waiter/order?table=T-04', label: 'Gọi Thêm Món', icon: 'add_shopping_cart' },
          ].map(tab => {
            const isTabActive = tab.path.includes('filter')
              ? location.search.includes('filter=CALLING')
              : location.pathname === tab.path.split('?')[0] && !location.search.includes('filter=CALLING');

            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => navigate(tab.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  background: isTabActive ? '#FFF8F6' : 'transparent',
                  border: isTabActive ? '1px solid #FFDBC9' : '1px solid transparent',
                  color: isTabActive ? '#9D4124' : '#89726B',
                  fontWeight: isTabActive ? 800 : 600,
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  padding: '5px 12px',
                  borderRadius: '12px',
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Icon name={tab.icon} size={22} fill={isTabActive ? 1 : 0} />
                  {tab.badge && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-8px',
                      background: '#BA1A1A',
                      color: '#FFF',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      borderRadius: '9999px',
                      padding: '1px 5px',
                      lineHeight: 1
                    }}>
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span>{tab.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleTriggerLogout}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              background: 'transparent',
              border: '1px solid transparent',
              color: '#BA1A1A',
              fontWeight: 600,
              fontSize: '0.72rem',
              cursor: 'pointer',
              padding: '5px 12px',
              borderRadius: '12px'
            }}
          >
            <Icon name="logout" size={22} />
            <span>Đăng Xuất</span>
          </button>
        </nav>
      )}

      {/* MODAL: QUẢN LÝ XÁC NHẬN CHO PHÉP NHÂN VIÊN ĐĂNG XUẤT CA TRỰC */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
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
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
            border: '2px solid #BA1A1A',
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
                <Icon name="verified_user" size={26} />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1F1B1A', margin: 0 }}>
                  Xác Nhận Kết Thúc Ca Trực
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#BA1A1A', fontWeight: 700 }}>
                  Cần Quản Lý duyệt trước khi rời trạm làm việc
                </span>
              </div>
            </div>

            {/* Staff Card */}
            <div style={{
              background: '#FFF8F6',
              borderRadius: '12px',
              padding: '12px 14px',
              border: '1px dashed #EAE0DE',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: '#1F1B1A', fontSize: '0.9rem' }}>
                  {user?.fullName || 'Nhân viên trực'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#9D4124', background: '#FFDBC9', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  {user?.username || '#STAFF'}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#89726B', marginTop: '2px', display: 'block' }}>
                Vị trí: <b>{station.title}</b> • Thời gian hiện tại: {time}
              </span>
            </div>

            {/* Handover Note */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                Ghi Chú Bàn Giao Ca / Dụng Cụ (Tùy chọn)
              </label>
              <input
                type="text"
                placeholder="VD: Đã dọn sạch quầy, bàn giao lại 3 bàn cho ca sau..."
                value={handoverNote}
                onChange={(e) => setHandoverNote(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #EAE0DE',
                  fontSize: '0.82rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Manager PIN */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                Nhập Mã PIN Quản Lý Phê Duyệt (Demo: 123456) <span style={{ color: '#BA1A1A' }}>*</span>
              </label>
              <input
                type="password"
                maxLength={6}
                placeholder="••••••"
                value={managerPin}
                onChange={(e) => {
                  setManagerPin(e.target.value);
                  setLogoutError(null);
                }}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: logoutError ? '2px solid #BA1A1A' : '1px solid #EAE0DE',
                  background: '#FDF7F5',
                  fontSize: '1.25rem',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  fontWeight: 800,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />

              {logoutError && (
                <div style={{ color: '#BA1A1A', fontSize: '0.78rem', fontWeight: 700, marginTop: '6px', textAlign: 'center' }}>
                  {logoutError}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
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
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmStaffLogout}
                style={{
                  flex: 1.4,
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
                <Icon name="check_circle" size={18} />
                Quản Lý Duyệt Đăng Xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
