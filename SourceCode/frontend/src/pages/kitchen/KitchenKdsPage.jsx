import React, { useState, useEffect, useRef } from 'react';
import { MOCK_ACTIVE_ORDERS } from '../../mock/mockData';

// Icon Material Symbols
function Icon({ name, size = 20, fill = 0, style = {} }) {
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

// Dong ho dem thoi gian - tra ve so giay da troi qua
function useElapsedSeconds(startTimeString) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const getElapsed = () => {
      if (!startTimeString) return 0;
      const now = new Date();
      const start = new Date(startTimeString);
      return Math.floor((now - start) / 1000);
    };

    setSeconds(getElapsed());
    const timer = setInterval(() => setSeconds(getElapsed()), 1000);
    return () => clearInterval(timer);
  }, [startTimeString]);

  return seconds;
}

// Format so giay thanh MM:SS
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// --- KDS Ticket Card ---
function KdsTicketCard({ order, onUpdateStatus }) {
  const elapsedSeconds = useElapsedSeconds(order.startedAt);
  const isOverdue = elapsedSeconds > 15 * 60; // Tre hon 15 phut
  const isUrgent = elapsedSeconds > 10 * 60;  // Canh bao sau 10 phut

  const getStatusConfig = (status) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Chờ tiếp nhận',
          borderColor: 'var(--outline-variant)',
          headerBg: 'var(--surface-container-low)',
          timerBg: 'var(--surface-container)',
          timerColor: 'var(--on-surface)',
          nextStatus: 'COOKING',
          nextLabel: 'Bắt đầu nấu',
          nextIcon: 'local_fire_department',
          nextBg: 'var(--secondary)',
          nextColor: '#fff',
        };
      case 'COOKING':
        return {
          label: 'Đang nấu',
          borderColor: 'var(--primary-container)',
          headerBg: 'var(--primary-fixed)',
          timerBg: 'var(--primary)',
          timerColor: '#fff',
          nextStatus: 'READY',
          nextLabel: 'Xác nhận xong món',
          nextIcon: 'check_circle',
          nextBg: 'var(--tertiary-container)',
          nextColor: '#fff',
        };
      case 'READY':
        return {
          label: 'Sẵn sàng phục vụ',
          borderColor: 'var(--tertiary-container)',
          headerBg: 'var(--tertiary-fixed)',
          timerBg: 'var(--tertiary-container)',
          timerColor: '#fff',
          nextStatus: 'SERVED',
          nextLabel: 'Đã lên bàn',
          nextIcon: 'table_restaurant',
          nextBg: 'var(--surface-container)',
          nextColor: 'var(--on-surface)',
        };
      default:
        return {
          label: 'Đã phục vụ',
          borderColor: 'var(--outline-variant)',
          headerBg: 'var(--surface-container)',
          timerBg: 'var(--surface-container-high)',
          timerColor: 'var(--on-surface-variant)',
          nextStatus: null,
          nextLabel: '',
          nextIcon: '',
          nextBg: '',
          nextColor: '',
        };
    }
  };

  const cfg = getStatusConfig(order.status);

  return (
    <article style={{
      background: 'var(--surface)',
      borderRadius: 18,
      border: `1px solid var(--outline-variant)`,
      borderTop: `4px solid ${isOverdue ? 'var(--error)' : cfg.borderColor}`,
      boxShadow: isOverdue
        ? '0 0 0 0 rgba(189, 89, 58, 0.25)'
        : 'var(--shadow-sm)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      animation: isOverdue ? 'none' : undefined,
    }}>

      {/* --- Header card --- */}
      <div style={{
        background: isOverdue ? 'var(--primary-fixed)' : cfg.headerBg,
        borderBottom: '1px solid var(--outline-variant)',
        padding: '12px 14px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: 'Epilogue', fontWeight: 800, fontSize: 22,
              color: 'var(--primary)', lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>
              Bàn {order.tableNumber}
            </span>
            <span style={{
              fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700,
              padding: '2px 6px', borderRadius: 4,
              background: 'var(--primary-container)', color: '#fff',
              letterSpacing: '0.04em',
            }}>
              #{order.id}
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, marginTop: 3,
            fontFamily: 'Plus Jakarta Sans', fontSize: 12, color: 'var(--on-surface-variant)',
          }}>
            <Icon name="person" size={13} style={{ color: 'var(--primary)' }} />
            Phục vụ: <strong style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{order.staffName || 'Trần Minh B'}</strong>
          </div>
        </div>

        {/* Timer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 8,
            background: isOverdue ? 'var(--error)' : isUrgent ? 'var(--primary)' : cfg.timerBg,
            color: isOverdue ? '#fff' : isUrgent ? '#fff' : cfg.timerColor,
            boxShadow: 'var(--shadow-xs)',
          }}>
            {isOverdue && <Icon name="warning" size={14} fill={1} />}
            <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 15, letterSpacing: '0.04em' }}>
              {formatTime(elapsedSeconds)}
            </span>
          </div>
          {isOverdue && (
            <span style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 10, fontWeight: 700, color: 'var(--error)' }}>
              TRỄ / DELAYED
            </span>
          )}
        </div>
      </div>

      {/* --- Danh sach mon an trong ticket --- */}
      <div style={{ padding: '12px 14px', background: 'var(--surface)', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {order.items.map((item, idx) => (
          <div
            key={item.id}
            style={{
              paddingBottom: idx < order.items.length - 1 ? 10 : 0,
              borderBottom: idx < order.items.length - 1 ? '1px solid var(--outline-variant)' : 'none',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              opacity: item.status === 'READY' ? 0.55 : 1,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: 'Epilogue', fontWeight: 700, fontSize: 16,
                  color: item.status === 'READY' ? 'var(--outline)' : 'var(--primary)',
                  textDecoration: item.status === 'READY' ? 'line-through' : 'none',
                }}>
                  {item.quantity}x
                </span>
                <span style={{
                  fontFamily: 'Epilogue', fontWeight: 700, fontSize: 15,
                  color: item.status === 'READY' ? 'var(--on-surface-variant)' : 'var(--on-surface)',
                  textDecoration: item.status === 'READY' ? 'line-through' : 'none',
                }}>
                  {item.name}
                </span>
                {item.variant && (
                  <span style={{
                    padding: '1px 6px', borderRadius: 4,
                    background: 'var(--surface-container-high)',
                    color: 'var(--on-surface-variant)',
                    fontFamily: 'Plus Jakarta Sans', fontSize: 11, fontWeight: 600,
                    border: '1px solid var(--outline-variant)',
                  }}>
                    {item.variant}
                  </span>
                )}
              </div>
              {/* Ghi chu bep - amber colored */}
              {item.note && (
                <div style={{ marginTop: 5, paddingLeft: 28 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px', borderRadius: 4,
                    background: 'var(--surface-container-low)',
                    color: 'var(--primary)',
                    fontFamily: 'Plus Jakarta Sans', fontSize: 11, fontWeight: 700,
                    border: '1px solid var(--outline-variant)',
                  }}>
                    <Icon name="report" size={12} />
                    {item.note}
                  </span>
                </div>
              )}
            </div>
            {/* Checkbox item */}
            <input
              type="checkbox"
              checked={item.status === 'READY'}
              onChange={() => {}}
              style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
          </div>
        ))}
      </div>

      {/* --- Footer actions --- */}
      {cfg.nextStatus && (
        <div style={{
          padding: '10px 12px',
          background: 'var(--surface-container)',
          borderTop: '1px solid var(--outline-variant)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <button
            onClick={() => onUpdateStatus(order.id, cfg.nextStatus)}
            style={{
              flex: 1, height: 44, borderRadius: 12,
              background: isOverdue ? 'var(--error)' : cfg.nextBg,
              color: cfg.nextColor,
              border: 'none', cursor: 'pointer',
              fontFamily: 'Epilogue', fontWeight: 700, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <Icon name={cfg.nextIcon} size={18} fill={1} />
            {isOverdue ? 'CHUYỂN GIAO MÓN (OVERDUE)' : cfg.nextLabel.toUpperCase()}
          </button>
          <button
            style={{
              height: 44, padding: '0 12px', borderRadius: 12,
              background: 'var(--surface-container-lowest)',
              border: '1px solid var(--outline-variant)',
              color: 'var(--primary)', cursor: 'pointer',
              fontFamily: 'Epilogue', fontWeight: 700, fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Icon name="bolt" size={16} />
            RUSH
          </button>
        </div>
      )}
    </article>
  );
}

// ====================================================
// KitchenKdsPage - Man hinh bep KDS (SCR-15 Stitch)
// Light warm Terracotta theme (KHONG dark - Stitch dung Light)
// ====================================================
export default function KitchenKdsPage() {
  const [orders, setOrders] = useState(() => {
    // Tao mock orders voi timestamp thuc te
    return MOCK_ACTIVE_ORDERS.map((o, i) => ({
      ...o,
      startedAt: new Date(Date.now() - (i * 4 + 2) * 60 * 1000).toISOString(),
    }));
  });
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

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


  const handleUpdateStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: newStatus, items: o.items.map(i => ({ ...i, status: newStatus })) }
        : o
    ));
  };

  const filteredOrders = orders.filter(o => filterStatus === 'ALL' || o.status === filterStatus);

  const counts = {
    ALL: orders.length,
    PENDING: orders.filter(o => o.status === 'PENDING').length,
    COOKING: orders.filter(o => o.status === 'COOKING').length,
    READY: orders.filter(o => o.status === 'READY').length,
  };

  const filterOptions = [
    { key: 'ALL', label: 'Tất cả (All)', dotColor: 'var(--primary)' },
    { key: 'PENDING', label: 'Chờ tiếp nhận', dotColor: 'var(--secondary)' },
    { key: 'COOKING', label: 'Đang nấu', dotColor: 'var(--primary-container)' },
    { key: 'READY', label: 'Sẵn sàng', dotColor: 'var(--tertiary-container)' },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      background: 'var(--surface)',
    }}>



      {/* --- Filter Bar + Metrics --- */}
      <div style={{
        background: 'var(--surface-container-lowest)',
        borderBottom: '1px solid rgba(220, 192, 185, 0.5)',
        padding: '8px 20px',
        display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between', gap: 8,
        flexShrink: 0, overflowX: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'Epilogue', fontWeight: 700, fontSize: 11,
            color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em',
            marginRight: 4,
          }}>
            Bộ Lọc:
          </span>
          {filterOptions.map(opt => {
            const isActive = filterStatus === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setFilterStatus(opt.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 12px', borderRadius: '9999px',
                  background: isActive ? 'var(--primary)' : 'var(--surface-container)',
                  color: isActive ? '#fff' : 'var(--on-surface-variant)',
                  border: isActive ? 'none' : '1px solid var(--outline-variant)',
                  cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans', fontWeight: 600, fontSize: 12,
                  boxShadow: isActive ? 'var(--shadow-xs)' : 'none',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: isActive ? 'rgba(255,255,255,0.5)' : opt.dotColor,
                  display: 'inline-block',
                }} />
                {opt.label}
                <span style={{
                  padding: '0 5px', borderRadius: 4,
                  background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--surface-container-high)',
                  color: isActive ? '#fff' : 'var(--on-surface)',
                  fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700,
                }}>
                  {counts[opt.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--on-surface-variant)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 8,
            background: 'var(--surface-container-low)',
            border: '1px solid var(--outline-variant)',
          }}>
            <Icon name="avg_pace" size={16} style={{ color: 'var(--secondary)' }} />
            <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 500 }}>Thời gian ra món TB:</span>
            <strong style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 14, color: 'var(--on-surface)' }}>
              11m 45s
            </strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="speed" size={16} style={{ color: 'var(--tertiary)' }} />
            <span>Hiệu suất:</span>
            <strong style={{ color: 'var(--tertiary)', fontWeight: 700 }}>94.2%</strong>
          </div>

          {/* Quick Audio & Fullscreen Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 10px', borderRadius: 8,
                background: 'var(--surface-container-low)',
                border: '1px solid var(--outline-variant)',
                color: 'var(--on-surface)', cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans', fontWeight: 600, fontSize: 11,
              }}
            >
              <Icon name="volume_up" size={15} style={{ color: 'var(--tertiary)' }} />
              Âm báo: BẬT
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Thu nhỏ / Thoát toàn màn hình' : 'Mở toàn màn hình bếp'}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 8,
                background: isFullscreen ? 'var(--inverse-surface, #342F2E)' : 'var(--primary)',
                color: '#fff',
                border: 'none', cursor: 'pointer',
                fontFamily: 'Epilogue', fontWeight: 700, fontSize: 11,
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon name={isFullscreen ? "fullscreen_exit" : "fullscreen"} size={15} />
              {isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            </button>
          </div>
        </div>
      </div>

      {/* --- Grid Ticket Cards --- */}
      <main style={{
        flex: 1, overflowY: 'auto',
        padding: '16px 20px',
        background: 'rgba(252, 241, 239, 0.4)',
      }}>
        {filteredOrders.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: 300, gap: 12, textAlign: 'center',
          }}>
            <Icon name="soup_kitchen" size={56} style={{ color: 'var(--outline-variant)' }} />
            <p style={{ fontFamily: 'Epilogue', fontSize: 18, fontWeight: 700, color: 'var(--on-surface-variant)' }}>
              Hàng đợi trống
            </p>
            <p style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 14, color: 'var(--outline)' }}>
              Chưa có đơn nào đang chờ chế biến
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
            paddingBottom: 24,
          }}>
            {filteredOrders.map(order => (
              <KdsTicketCard
                key={order.id}
                order={order}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
