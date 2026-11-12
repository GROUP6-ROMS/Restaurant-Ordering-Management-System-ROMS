import CustomerAiChatModal from '../customer/CustomerAiChatModal';
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useRestaurantProfile } from '../../utils/restaurantConfig';
import RomsLogo from '../common/RomsLogo';
import Icon from '../common/Icon';
import { customerApi } from '../../api/customerApi';
import { broadcastRealtimeEvent, subscribeRealtimeEvents } from '../../utils/realtimeSync';
import { tableApi } from '../../api/tableApi';

function formatVND(amount) {
  return amount.toLocaleString('vi-VN') + 'đ';
}

// ====================================================
// CustomerLayout - Layout cho man hinh mobile thuc khach
// Khop voi Stitch SCR-10 (glassmorphism header + bottom nav)
// ====================================================
export default function CustomerLayout() {
  const { tableInfo, setTableInfo, clearCart, totalCount, totalPrice } = useCart();
  const restaurantProfile = useRestaurantProfile();
  const location = useLocation();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('Đã gửi yêu cầu gọi nhân viên!');
  const [showAssistModal, setShowAssistModal] = useState(false);
  // State đóng mở Trợ lý AI Chatbox
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const triggerAssist = async (reqType, note, label) => {
    try {
      setShowAssistModal(false);
      const tId = tableInfo?.tableId;
      const tNum = tableInfo?.tableNumber || 'Bàn của bạn';
      await customerApi.callWaiter({
        tableId: tId,
        tableNumber: tNum,
        requestType: reqType,
        note: note
      });
      broadcastRealtimeEvent({ type: 'CALL_WAITER', tableId: tId, tableNumber: tNum, requestType: reqType });
      showToast(`Đã gửi yêu cầu: "${label}"!`);
    } catch (err) {
      showToast('Đã gửi yêu cầu tới nhân viên hỗ trợ!');
    }
  };

  const handleCallWaiter = () => {
    setShowAssistModal(true);
  };

  const isMenu = location.pathname.includes('/menu');
  const isCart = location.pathname.includes('/cart');
  const isTracking = location.pathname.includes('/tracking');
  const isWelcome = location.pathname.includes('/welcome');

  // Lắng nghe sự kiện mở modal hỗ trợ từ các trang con (ví dụ trang Tracking Bàn ăn)
  useEffect(() => {
    const handleOpenAssist = () => setShowAssistModal(true);
    window.addEventListener('roms:open-assist-modal', handleOpenAssist);
    return () => window.removeEventListener('roms:open-assist-modal', handleOpenAssist);
  }, []);

  const [tableStatus, setTableStatus] = useState(
    tableInfo?.status || (sessionStorage.getItem('roms_dining_token') ? 'OCCUPIED' : 'AVAILABLE')
  );

  useEffect(() => {
    const unsubscribe = subscribeRealtimeEvents((event) => {
      const isCurrentTable =
        (event.tableId && Number(event.tableId) === Number(tableInfo?.tableId)) ||
        (event.tableNumber && (
          event.tableNumber === tableInfo?.tableNumber ||
          String(event.tableNumber).toUpperCase() === String(tableInfo?.tableNumber).toUpperCase() ||
          `Bàn ${event.tableNumber}`.toUpperCase() === String(tableInfo?.tableNumber).toUpperCase()
        ));

      if (!isCurrentTable) return;

      // 1. Trường hợp nhân viên/quản lý MỞ BÀN (status: OCCUPIED)
      if (
        ['TABLE_STATUS_CHANGED', 'TABLE_UPDATED', 'TABLE_UPDATE', 'DINING_SESSION_OPENED'].includes(event.type) &&
        event.status === 'OCCUPIED'
      ) {
        setTableStatus('OCCUPIED');
        const qrToken = tableInfo?.token || sessionStorage.getItem('roms_qr_token');
        if (qrToken) {
          tableApi.verifyQr(qrToken).then(res => {
            if (res.data?.success && res.data.data?.diningToken) {
              sessionStorage.setItem('roms_dining_token', res.data.data.diningToken);
              const updated = {
                ...tableInfo,
                status: 'OCCUPIED',
                diningToken: res.data.data.diningToken,
                token: qrToken
              };
              setTableInfo(updated);
              localStorage.setItem('roms_table_info', JSON.stringify(updated));
            }
            showToast('Bàn đã được nhân viên mở! Đang tải lại trang...');
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }).catch(err => {
            console.error('Lỗi khi verify QR khi mở bàn:', err);
            window.location.reload();
          });
        } else {
          const updated = { ...tableInfo, status: 'OCCUPIED' };
          setTableInfo(updated);
          localStorage.setItem('roms_table_info', JSON.stringify(updated));
          window.location.reload();
        }
        return;
      }

      // 2. Trường hợp quản lý/thu ngân ĐÃ TÍNH TIỀN / ĐÓNG BÀN (BILL_PAID, SESSION_CLOSED, DIRTY, AVAILABLE, COMPLETED)
      const isSessionClosedOrPaid =
        event.type === 'BILL_PAID' ||
        event.type === 'SESSION_CLOSED' ||
        (['TABLE_STATUS_CHANGED', 'TABLE_UPDATED', 'TABLE_UPDATE'].includes(event.type) &&
          ['DIRTY', 'AVAILABLE', 'COMPLETED', 'CLOSED'].includes(event.status));

      if (isSessionClosedOrPaid) {
        setTableStatus('AVAILABLE');
        sessionStorage.removeItem('roms_dining_token');
        if (typeof clearCart === 'function') clearCart();

        const qrToken = tableInfo?.token || sessionStorage.getItem('roms_qr_token') || '';
        const updated = {
          ...tableInfo,
          status: 'AVAILABLE',
          diningToken: null
        };
        setTableInfo(updated);
        localStorage.setItem('roms_table_info', JSON.stringify(updated));

        showToast('Bàn đã hoàn tất thanh toán. Cảm ơn quý khách!');

        setTimeout(() => {
          const targetWelcomeUrl = `/dining/welcome?table=${tableInfo?.tableId || ''}&token=${qrToken}`;
          if (location.pathname.includes('/welcome')) {
            window.location.reload();
          } else {
            window.location.href = targetWelcomeUrl;
          }
        }, 1200);
        return;
      }
    });
    return () => unsubscribe();
  }, [tableInfo?.tableId, tableInfo?.tableNumber, tableInfo?.token, setTableInfo, clearCart, location.pathname]);

  const diningToken = sessionStorage.getItem('roms_dining_token');
  const staffToken = sessionStorage.getItem('roms_token');
  const isTableOccupied = (tableStatus === 'OCCUPIED' || tableInfo?.status === 'OCCUPIED') && (Boolean(diningToken) || Boolean(staffToken));

  const handleProtectedNav = (e) => {
    if (!isTableOccupied) {
      e.preventDefault();
      showToast('Chờ nhân viên mở bàn! Vui lòng đợi nhân viên mở bàn.');
    }
  };

  const handleOpenAiChat = () => {
    if (!isTableOccupied) {
      showToast('Chờ nhân viên mở bàn! Vui lòng đợi nhân viên mở bàn.');
      return;
    }
    setIsAiModalOpen(true);
  };

  // Accessibility: Lắng nghe phím Escape để đóng Modal hỗ trợ
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showAssistModal) {
        setShowAssistModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAssistModal]);

  return (
    <div className="customer-layout-shell">

      {/* --- Sticky Header Glassmorphism --- */}
      <header
        className="glass-header customer-fixed-shell"
        style={{
          position: 'fixed', top: 0, zIndex: 50,
          height: 64,
          display: 'flex', alignItems: 'center',
          padding: '0 var(--gutter)',
          justifyContent: 'space-between', gap: 8,
        }}
      >
        {/* Logo + Table Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <RomsLogo size={36} />
          {/* Ten va Ban */}
          <div style={{ minWidth: 0 }}>
            <span style={{
              fontFamily: 'Epilogue', fontWeight: 700, fontSize: 15,
              color: 'var(--on-surface)', display: 'block',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}>
              {restaurantProfile.brandName || restaurantProfile.name || 'ROMS Dining'}
            </span>
            {!isWelcome && tableInfo?.tableNumber && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '1px 8px', borderRadius: '9999px',
                  background: 'var(--primary-container)',
                  color: 'var(--on-primary)',
                  fontFamily: 'Plus Jakarta Sans', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.03em',
                }}>
                  {`${tableInfo.tableNumber} • ${tableInfo.guestCount || 4} Khách`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Nut goi phu vu (chi hien khi khong o trang Welcome) */}
        {!isWelcome && (
          <button
            onClick={handleCallWaiter}
            aria-label="Gọi nhân viên phục vụ tại bàn"
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'var(--surface-container-high)',
              border: '1px solid rgba(220, 192, 185, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              boxShadow: 'var(--shadow-xs)',
              transition: 'all 0.15s ease',
            }}
          >
            <Icon name="notifications" size={20} style={{ color: 'var(--secondary)' }} />
          </button>
        )}
      </header>

      {/* --- Main Content (padding cho header + nav, tự động thích ứng với giỏ hàng nổi và safe-area iOS) --- */}
      <main style={{
        flex: 1,
        paddingTop: 64,
        paddingBottom: isWelcome
          ? 'calc(24px + env(safe-area-inset-bottom, 0px))'
          : (totalCount > 0 && !isCart && isTableOccupied)
            ? 'calc(160px + env(safe-area-inset-bottom, 0px))'
            : 'calc(96px + env(safe-area-inset-bottom, 0px))'
      }}>
        <Outlet />
      </main>

      {/* --- Floating Cart Bar (chi hien khi co mon trong gio + khong o trang cart va welcome) --- */}
      {totalCount > 0 && !isCart && !isWelcome && isTableOccupied && (
        <div
          className="customer-fixed-shell"
          style={{
            position: 'fixed',
            bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '0 var(--gutter)',
            zIndex: 40,
            pointerEvents: 'none',
          }}>
          <Link
            to="/dining/cart"
            style={{
              pointerEvents: 'all',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 12,
              background: 'var(--primary)', color: 'var(--on-primary)',
              borderRadius: 18, padding: '10px 12px',
              boxShadow: 'var(--shadow-xl)',
              textDecoration: 'none',
              transition: 'transform 0.15s ease',
            }}
          >
            {/* Icon + Count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <Icon name="shopping_bag" size={22} />
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'var(--secondary)', color: 'var(--on-secondary)',
                  fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Plus Jakarta Sans',
                }}>
                  {totalCount}
                </span>
              </div>
              <div>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 11, fontWeight: 600, opacity: 0.85, lineHeight: 1 }}>
                  {totalCount} món trong giỏ
                </div>
                <div style={{ fontFamily: 'Epilogue', fontWeight: 700, fontSize: 18, lineHeight: '22px', letterSpacing: '-0.01em' }}>
                  {formatVND(totalPrice)}
                </div>
              </div>
            </div>
            {/* Arrow CTA */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '8px 14px', borderRadius: 12,
              background: 'var(--surface-container-lowest)',
              color: 'var(--primary)', flexShrink: 0,
              fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 13,
              boxShadow: 'var(--shadow-xs)',
            }}>
              Xem giỏ hàng
              <Icon name="arrow_forward" size={16} />
            </div>
          </Link>
        </div>
      )}

      {/* --- Bottom Navigation Bar (Ẩn khi ở trang Welcome, thích ứng safe-area iOS) --- */}
      {!isWelcome && (
        <nav
          className="customer-fixed-shell"
          style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
            minHeight: 64,
            background: 'rgba(255, 248, 246, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(220, 192, 185, 0.35)',
            boxShadow: '0 -2px 12px rgba(44, 34, 30, 0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-around',
            zIndex: 50,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            boxSizing: 'border-box'
          }}
        >
          {/* Thuc don tab */}
          <Link
            to="/dining/menu"
            onClick={handleProtectedNav}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, flex: 1, minHeight: 44, justifyContent: 'center',
              textDecoration: 'none',
              color: isMenu ? 'var(--primary)' : 'var(--on-surface-variant)',
              fontFamily: 'Plus Jakarta Sans',
              fontWeight: isMenu ? 700 : 400,
              fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase',
              transition: 'color 0.2s ease',
            }}
          >
            <Icon name="restaurant_menu" size={22} fill={isMenu ? 1 : 0} />
            Thực đơn
          </Link>

          {/* Gio hang tab (Cung cap voi Thuc Don va Ban An) */}
          <Link
            to="/dining/cart"
            onClick={handleProtectedNav}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, flex: 1, minHeight: 44, justifyContent: 'center',
              textDecoration: 'none',
              color: isCart ? 'var(--primary)' : 'var(--on-surface-variant)',
              fontFamily: 'Plus Jakarta Sans',
              fontWeight: isCart ? 700 : 400,
              fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase',
              transition: 'color 0.2s ease',
              position: 'relative',
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="shopping_bag" size={22} fill={isCart ? 1 : 0} />
              {totalCount > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -10,
                  minWidth: 16, height: 16, borderRadius: '9999px',
                  background: 'var(--primary)', color: '#FFFFFF',
                  fontSize: 10, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px',
                  fontFamily: 'Plus Jakarta Sans',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}>
                  {totalCount}
                </span>
              )}
            </div>
            Giỏ hàng
          </Link>

          {/* Ban an tab */}
          <Link
            to="/dining/orders/tracking"
            onClick={handleProtectedNav}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, flex: 1, minHeight: 44, justifyContent: 'center',
              textDecoration: 'none',
              color: isTracking ? 'var(--primary)' : 'var(--on-surface-variant)',
              fontFamily: 'Plus Jakarta Sans',
              fontWeight: isTracking ? 700 : 400,
              fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase',
              transition: 'color 0.2s ease',
              position: 'relative',
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="table_restaurant" size={22} fill={isTracking ? 1 : 0} />
              {/* Dot indicator neu co mon dang nau */}
              <span style={{
                position: 'absolute', top: -2, right: -8,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--primary)',
              }} />
            </div>
            Bàn ăn
          </Link>
        </nav>
      )}

      {/* --- Modal Bảng Chọn Nhanh Yêu Cầu Hỗ Trợ --- */}
      {showAssistModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bảng chọn nhanh yêu cầu hỗ trợ tại bàn"
          className="customer-modal-overlay"
          style={{
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease-out'
          }}>
          <div
            className="customer-modal-sheet"
            style={{
              background: '#FFFFFF',
              padding: '20px 20px 28px',
              boxShadow: '0 -8px 30px rgba(0,0,0,0.2)',
              animation: 'slideUp 0.25s ease-out',
              boxSizing: 'border-box'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: 'Epilogue', fontWeight: 800, fontSize: '1.05rem', color: '#1F1B1A', margin: 0 }}>
                  Bạn cần nhà hàng hỗ trợ gì?
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#89726B' }}>
                  {tableInfo?.tableNumber || 'Bàn ăn'} • Nhân viên sẽ tới bàn ngay sau vài giây
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAssistModal(false)}
                aria-label="Đóng bảng yêu cầu hỗ trợ"
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#F6ECEA', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#56423D'
                }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* Option 1: Xin đá */}
              <button
                type="button"
                onClick={() => triggerAssist('REQUEST_ICE', 'Khách xin thêm xô đá lạnh', 'Xin thêm đá')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '16px 10px', borderRadius: 16,
                  background: '#EFF6FF', border: '1.5px solid #BFDBFE',
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}>
                  <Icon name="ac_unit" size={22} />
                </div>
                <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 13, color: '#1E40AF' }}>
                  Xin thêm đá
                </span>
                <span style={{ fontSize: 11, color: '#6B7280' }}>Đá bi / Xô đá</span>
              </button>

              {/* Option 2: Gọi nhân viên */}
              <button
                type="button"
                onClick={() => triggerAssist('CALL_WAITER', 'Khách gọi nhân viên hỗ trợ tại bàn', 'Gọi nhân viên')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '16px 10px', borderRadius: 16,
                  background: '#FFF7ED', border: '1.5px solid #FFEDD5',
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C2410C' }}>
                  <Icon name="room_service" size={22} />
                </div>
                <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 13, color: '#9A3412' }}>
                  Gọi nhân viên
                </span>
                <span style={{ fontSize: 11, color: '#6B7280' }}>Hỗ trợ tại bàn</span>
              </button>

              {/* Option 3: Nước lọc / Khăn */}
              <button
                type="button"
                onClick={() => triggerAssist('CALL_WATER', 'Khách xin nước lọc / khăn ướt', 'Nước / Khăn')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '16px 10px', borderRadius: 16,
                  background: '#F0FDF4', border: '1.5px solid #BBF7D0',
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D' }}>
                  <Icon name="water_drop" size={22} />
                </div>
                <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 13, color: '#166534' }}>
                  Nước / Khăn
                </span>
                <span style={{ fontSize: 11, color: '#6B7280' }}>Nước lọc & Khăn lạnh</span>
              </button>

              {/* Option 4: Thêm chén dĩa / muỗng đũa */}
              <button
                type="button"
                onClick={() => triggerAssist('REQUEST_CUTLERY', 'Khách xin thêm chén đĩa, muỗng đũa', 'Chén đĩa / Đũa')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '16px 10px', borderRadius: 16,
                  background: '#FAF5FF', border: '1.5px solid #E9D5FF',
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7E22CE' }}>
                  <Icon name="flatware" size={22} />
                </div>
                <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 13, color: '#6B21A8' }}>
                  Chén đĩa / Đũa
                </span>
                <span style={{ fontSize: 11, color: '#6B7280' }}>Bát thìa đũa phụ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Toast Notification --- */}
      <div className={`toast ${toastVisible ? '' : 'hidden'}`}>
        <Icon name="check_circle" size={18} style={{ color: 'var(--secondary-fixed-dim)' }} />
        {toastMessage}
      </div>
      {/* ============================================================== */}
      {/* 👉 DÁN ĐOẠN NÀY VÀO ĐÂY (NGAY TRƯỚC THẺ </div> NGOÀI CÙNG)     */}
      {/* ============================================================== */}
      {/* --- Nút Nổi AI Trợ Lý Ẩm Thực (Ẩn khi ở trang Welcome, thích ứng với giỏ hàng và safe-area) --- */}
      {!isWelcome && (
        <>
          <button
            onClick={handleOpenAiChat}
            aria-label="Mở Trợ lý Ẩm thực AI"
            className="customer-ai-floating-btn"
            style={{
              bottom: (totalCount > 0 && !isCart && isTableOccupied)
                ? 'calc(146px + env(safe-area-inset-bottom, 0px))'
                : 'calc(78px + env(safe-area-inset-bottom, 0px))',
              width: 50, height: 50, borderRadius: '50%',
              background: 'linear-gradient(135deg, #A04020 0%, #D86030 100%)',
              color: '#FFFFFF',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 4px 16px rgba(160, 64, 32, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 45,
            }}
          >
            <span style={{ fontSize: 22 }}>✨</span>
          </button>
          {/* --- Modal Trợ Lý Ẩm Thực AI --- */}
          <CustomerAiChatModal
            isOpen={isAiModalOpen}
            onClose={() => setIsAiModalOpen(false)}
          />
        </>
      )}
    </div>
  );
}
