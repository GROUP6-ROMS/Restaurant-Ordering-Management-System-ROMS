import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { waiterApi } from '../../api/waiterApi';
import { subscribeRealtimeEvents } from '../../utils/realtimeSync';
import Icon from '../common/Icon';
import RomsLogo from '../common/RomsLogo';

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [waiterCallingCount, setWaiterCallingCount] = useState(0);

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

  // Modal states for Logout:
  // 1. Confirm dialog cho nhân viên (Waiter, Kitchen, Manager, Admin, hoặc Thu ngân đã chốt ca)
  const [showConfirmLogoutModal, setShowConfirmLogoutModal] = useState(false);
  // 2. Dialog cảnh báo cho Thu ngân khi chưa chốt sổ két tiền
  const [showCashierShiftModal, setShowCashierShiftModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  // Lấy số lượng chuông gọi phục vụ thời gian thực
  useEffect(() => {
    if (user?.role !== 'WAITER') return;

    const fetchCallingCount = async () => {
      try {
        const res = await waiterApi.getTables();
        if (res.data && res.data.success) {
          const list = res.data.data || [];
          const count = list.filter(t => t.calling || t.status === 'CALLING').length;
          setWaiterCallingCount(count);
        }
      } catch (err) {
        // bỏ qua lỗi nếu token chưa sẵn sàng
      }
    };

    fetchCallingCount();
    const interval = setInterval(fetchCallingCount, 4000);

    const handleTabActive = () => {
      if (document.visibilityState === 'visible') {
        fetchCallingCount();
      }
    };
    window.addEventListener('focus', fetchCallingCount);
    document.addEventListener('visibilitychange', handleTabActive);

    const unsubscribe = subscribeRealtimeEvents((event) => {
      if (event?.type === 'TABLE_UPDATE' || event?.type === 'PAYMENT_REQUEST' || event?.type === 'ORDER_UPDATE') {
        fetchCallingCount();
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchCallingCount);
      document.removeEventListener('visibilitychange', handleTabActive);
      unsubscribe();
    };
  }, [user?.role]);

  const handleTriggerLogout = () => {
    // Nếu là Thu Ngân (CASHIER): kiểm tra xem két tiền ca trực đã được chốt sổ chưa
    if (user?.role === 'CASHIER') {
      const isShiftClosed = sessionStorage.getItem('roms_cashier_shift_closed') === 'true';
      if (!isShiftClosed) {
        // Ca chưa chốt két -> mở dialog cảnh báo chốt ca két tiền & bàn giao
        setShowCashierShiftModal(true);
        return;
      }
    }

    // Các vai trò thông thường (Waiter, Kitchen, Manager, Admin) hoặc Thu ngân đã chốt ca -> mở Confirm Dialog
    setShowConfirmLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      sessionStorage.removeItem('roms_cashier_shift_closed');
      await logout();
      setShowConfirmLogoutModal(false);
      navigate('/login');
    } catch (err) {
      console.error('Lỗi khi đăng xuất:', err);
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Thu ngân chọn Đăng xuất tạm thời (giữ ca, chưa chốt két)
  const handleCashierTemporaryLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowCashierShiftModal(false);
      navigate('/login');
    } catch (err) {
      console.error('Lỗi khi đăng xuất tạm thời:', err);
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Thu ngân chọn Chốt ca két tiền -> điều hướng tới tab SHIFT trên POS
  const handleGoToShiftClosure = () => {
    setShowCashierShiftModal(false);
    navigate('/pos/checkout?tab=SHIFT&trigger=approval');
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
        paddingBottom: (isMobile && user?.role === 'WAITER') ? '70px' : '0'
      }}>
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar exclusively for WAITER on Mobile Devices (< 768px) */}
      {isMobile && user?.role === 'WAITER' && (
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
          padding: '0 12px'
        }}>
          {[
            {
              path: '/waiter/floor-plan',
              label: 'Sơ Đồ Bàn',
              icon: 'table_restaurant',
              isActive: location.pathname === '/waiter/floor-plan' && !location.search.includes('filter=CALLING')
            },
            {
              path: '/waiter/floor-plan?filter=CALLING',
              label: 'Cần Hỗ Trợ',
              icon: 'notifications_active',
              badge: waiterCallingCount > 0 ? waiterCallingCount : null,
              isActive: location.pathname === '/waiter/floor-plan' && location.search.includes('filter=CALLING')
            },
          ].map(tab => {
            const isTabActive = tab.isActive;

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
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  padding: '6px 20px',
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
              fontSize: '0.74rem',
              cursor: 'pointer',
              padding: '6px 20px',
              borderRadius: '12px'
            }}
          >
            <Icon name="logout" size={22} />
            <span>Đăng Xuất</span>
          </button>
        </nav>
      )}

      {/* MODAL 1: CONFIRM DIALOG ĐĂNG XUẤT CHO NHÂN VIÊN (WAITER, KITCHEN, MANAGER, HOẶC THU NGÂN ĐÃ CHỐT CA) */}
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
                  Kết thúc phiên làm việc trên hệ thống ROMS
                </span>
              </div>
            </div>

            {/* Staff Details Card */}
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
                <span style={{ color: '#89726B' }}>Nhân viên:</span>
                <strong style={{ color: '#1F1B1A' }}>{user?.fullName || 'Nhân viên trực'} ({user?.username})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#89726B' }}>Vị trí trạm:</span>
                <span style={{ fontWeight: 700, color: station.badgeColor, background: station.badgeBg, padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  {station.title}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#89726B' }}>Ca làm việc:</span>
                <strong style={{ color: '#9D4124' }}>{user?.assignedShift || 'Ca trực hiện tại'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#89726B' }}>Thời gian:</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{time}</span>
              </div>
            </div>

            <p style={{ margin: '0 0 20px', fontSize: '0.8rem', color: '#56423D', lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn kết thúc ca làm việc và đăng xuất? Trạng thái trực của bạn sẽ được giải phóng an toàn.
            </p>

            {/* Action Buttons */}
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
                Ở Lại Làm Việc
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

      {/* MODAL 2: CẢNH BÁO CHỐT CA KÉT TIỀN DÀNH RIÊNG CHO THU NGÂN (CASHIER) */}
      {showCashierShiftModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(31, 27, 26, 0.7)',
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
            maxWidth: '480px',
            width: '100%',
            padding: '26px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            border: '2px solid #BA1A1A',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: '#FFDAD6',
                color: '#BA1A1A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon name="point_of_sale" size={26} />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1F1B1A', margin: 0 }}>
                  Chốt Ca Két Tiền & Bàn Giao
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#BA1A1A', fontWeight: 700 }}>
                  ⚠️ Két tiền ca trực chưa được Quản lý duyệt chốt sổ!
                </span>
              </div>
            </div>

            {/* Warning Details Card */}
            <div style={{
              background: '#FFF5F5',
              borderRadius: '14px',
              padding: '14px',
              border: '1.5px solid #FFCDD2',
              marginBottom: '16px',
              fontSize: '0.8rem',
              color: '#842029',
              lineHeight: 1.5
            }}>
              <strong>Quy định tài chính ROMS:</strong> Thu ngân đang giữ két tiền mặt vật lý của nhà hàng. Khi hết ca, bắt buộc phải <strong>kiểm đếm mệnh giá</strong> và yêu cầu <strong>Quản lý nhập mã PIN duyệt chốt ca / giải trình chênh lệch két</strong> trước khi bàn giao.
            </div>

            <div style={{
              background: '#FFF8F6',
              borderRadius: '14px',
              padding: '12px 14px',
              border: '1px solid #F0E6E4',
              marginBottom: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '0.8rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#89726B' }}>Thu ngân phụ trách:</span>
                <strong>{user?.fullName || 'Thu Ngân POS'} ({user?.username})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#89726B' }}>Ca trực hiện tại:</span>
                <strong style={{ color: '#9D4124' }}>{user?.assignedShift || 'Ca trực hiện tại'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#89726B' }}>Trạng thái sổ két:</span>
                <span style={{ color: '#BA1A1A', fontWeight: 800 }}>Chưa đối soát / Chưa chốt</span>
              </div>
            </div>

            {/* 3 Clear Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={handleGoToShiftClosure}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#9D4124',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Icon name="verified_user" size={18} />
                Kiểm Đếm & Chốt Ca Két Tiền Ngay
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowCashierShiftModal(false)}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '12px',
                    background: '#F0E6E4',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: '#56423D',
                    cursor: 'pointer'
                  }}
                >
                  Ở Lại Thu Ngân
                </button>
                <button
                  type="button"
                  onClick={handleCashierTemporaryLogout}
                  disabled={isLoggingOut}
                  title="Tạm rời quầy (ăn trưa, nghỉ ngắn). Ca làm việc và két tiền vẫn giữ nguyên."
                  style={{
                    flex: 1.4,
                    padding: '11px',
                    borderRadius: '12px',
                    background: '#FCF1EF',
                    border: '1px solid #EAE0DE',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: '#753400',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Icon name="lock" size={16} />
                  {isLoggingOut ? 'Đang Xử Lý...' : 'Đăng Xuất Tạm (Giữ Ca)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
