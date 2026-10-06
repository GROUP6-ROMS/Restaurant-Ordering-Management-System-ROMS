import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import RomsLogo from '../common/RomsLogo';

// Icon Material Symbols
function Icon({ name, size = 22, fill = 0, style = {} }) {
  return (
    <span
      className="material-icon"
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        lineHeight: 1, verticalAlign: 'middle',
        ...style
      }}
    >
      {name}
    </span>
  );
}

function formatVND(amount) {
  return amount.toLocaleString('vi-VN') + 'đ';
}

// ====================================================
// CustomerLayout - Layout cho man hinh mobile thuc khach
// Khop voi Stitch SCR-10 (glassmorphism header + bottom nav)
// ====================================================
export default function CustomerLayout() {
  const { tableInfo, totalCount, totalPrice } = useCart();
  const location = useLocation();
  const [toastVisible, setToastVisible] = useState(false);

  const handleCallWaiter = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const isMenu = location.pathname.includes('/menu');
  const isCart = location.pathname.includes('/cart');
  const isTracking = location.pathname.includes('/tracking');

  return (
    <div style={{
      maxWidth: 430, margin: '0 auto',
      minHeight: '100dvh',
      background: 'var(--surface)',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
      boxShadow: '0 0 40px rgba(44, 34, 30, 0.06)',
    }}>

      {/* --- Sticky Header Glassmorphism --- */}
      <header
        className="glass-header"
        style={{
          position: 'fixed', top: 0, zIndex: 50,
          width: '100%', maxWidth: 430,
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
              ROMS Bistro
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '1px 8px', borderRadius: '9999px',
                background: 'var(--primary-container)',
                color: 'var(--on-primary)',
                fontFamily: 'Plus Jakarta Sans', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.03em',
              }}>
                {tableInfo?.tableNumber || 'BÀN T05'} • {tableInfo?.guestCount || 4} Khách
              </span>
            </div>
          </div>
        </div>

        {/* Nut goi phu vu */}
        <button
          onClick={handleCallWaiter}
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
      </header>

      {/* --- Main Content (padding cho header + nav) --- */}
      <main style={{ flex: 1, paddingTop: 64, paddingBottom: 96 }}>
        <Outlet />
      </main>

      {/* --- Floating Cart Bar (chi hien khi co mon trong gio + khong o trang cart) --- */}
      {totalCount > 0 && !isCart && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 430,
          padding: '0 var(--gutter)',
          zIndex: 40, pointerEvents: 'none',
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

      {/* --- Bottom Navigation Bar --- */}
      <nav
        style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 430,
          height: 64,
          background: 'rgba(255, 248, 246, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(220, 192, 185, 0.35)',
          boxShadow: '0 -2px 12px rgba(44, 34, 30, 0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          zIndex: 50,
          paddingBottom: 'env(safe-area-inset-bottom, 0)',
        }}
      >
        {/* Thuc don tab */}
        <Link
          to="/dining/menu"
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

      {/* --- Toast Notification --- */}
      <div className={`toast ${toastVisible ? '' : 'hidden'}`}>
        <Icon name="check_circle" size={18} style={{ color: 'var(--secondary-fixed-dim)' }} />
        Đã gửi yêu cầu gọi nhân viên!
      </div>
    </div>
  );
}
