import React, { useState, useEffect, useRef } from 'react';
import { kitchenApi } from '../../api/kitchenApi';
import { subscribeRealtimeEvents } from '../../utils/realtimeSync';

import Icon from '../../components/common/Icon';

// Đồng hồ đếm thời gian - trả về số giây đã trôi qua
function useElapsedSeconds(startTimeString, initialElapsedSeconds) {
  const hasInitial = typeof initialElapsedSeconds === 'number' && initialElapsedSeconds >= 0;
  const mountTimeRef = useRef(Date.now());
  const baseSecondsRef = useRef(hasInitial ? initialElapsedSeconds : null);

  const calculateElapsed = () => {
    // 1. Ưu tiên số giây từ Backend tính toán (không phụ thuộc lệch múi giờ client/server)
    if (baseSecondsRef.current !== null) {
      const clientDiff = Math.floor((Date.now() - mountTimeRef.current) / 1000);
      return baseSecondsRef.current + Math.max(0, clientDiff);
    }

    // 2. Fallback: Parse startTimeString
    if (!startTimeString) return 0;
    try {
      const start = new Date(startTimeString);
      if (isNaN(start.getTime())) return 0;
      const now = new Date();
      const diff = Math.floor((now - start) / 1000);
      return diff >= 0 ? diff : 0;
    } catch {
      return 0;
    }
  };

  const [seconds, setSeconds] = useState(calculateElapsed);

  // Khi order được cập nhật từ polling hoặc WebSocket, đồng bộ lại mốc chuẩn
  useEffect(() => {
    if (typeof initialElapsedSeconds === 'number' && initialElapsedSeconds >= 0) {
      baseSecondsRef.current = initialElapsedSeconds;
      mountTimeRef.current = Date.now();
      setSeconds(initialElapsedSeconds);
    }
  }, [initialElapsedSeconds, startTimeString]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(calculateElapsed());
    }, 1000);
    return () => clearInterval(timer);
  }, [startTimeString, initialElapsedSeconds]);

  return seconds;
}

// Format số giây thành MM:SS
function formatTime(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Định dạng thời gian đặt món (HH:mm)
function formatOrderTime(timeString) {
  if (!timeString) return '';
  try {
    const d = new Date(timeString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// Singleton Web Audio API Context (Tránh chạm giới hạn 6 hardware contexts của Chromium)
let sharedAudioCtx = null;
function getAudioContext() {
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

// Bộ tổng hợp âm thanh Web Audio API (Synthesizer Chime)
// Âm báo cảnh báo hủy món dành cho Bếp (Warning buzzer for cancelled/voided dishes)
function playCancelAlert() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(340, now);
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.22);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(260, now + 0.24);
    gain2.gain.setValueAtTime(0.28, now + 0.24);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.24);
    osc2.stop(now + 0.48);
  } catch (e) {
    console.warn('Audio Context không thể phát âm cảnh báo:', e);
  }
}

function playKitchenChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Nốt thứ nhất (D5 ~ 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Nốt thứ hai (A5 ~ 880 Hz) - tạo tiếng chuông "Ding-Dong" êm ái
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.18);
    gain2.gain.setValueAtTime(0.2, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.7);
  } catch (e) {
    console.warn('Audio Context không thể phát âm thanh tự động:', e);
  }
}

// --- KDS Ticket Card ---
function KdsTicketCard({ order, actionLoadingId, onUpdateStatus, onToggleItemStatus, onToggleRush }) {
  const elapsedSeconds = useElapsedSeconds(order.startedAt, order.elapsedSeconds);
  const isOverdue = elapsedSeconds > 15 * 60; // Trễ hơn 15 phút (Overdue SLA)
  const isUrgent = elapsedSeconds > 10 * 60;  // Cảnh báo sau 10 phút
  const isOrderUpdating = actionLoadingId === `order-${order.id}`;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'SUBMITTED':
      case 'CONFIRMED':
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
          nextBg: 'var(--secondary, #825345)',
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
          nextBg: 'var(--tertiary-container, #2e7d32)',
          nextColor: '#fff',
        };
      case 'READY':
        return {
          label: 'Sẵn sàng phục vụ',
          borderColor: 'var(--tertiary-container, #2e7d32)',
          headerBg: 'var(--tertiary-fixed, #e8f5e9)',
          timerBg: 'var(--tertiary-container, #2e7d32)',
          timerColor: '#fff',
          nextStatus: null,
          nextLabel: 'Chờ phục vụ bưng món',
          nextIcon: 'table_restaurant',
          nextBg: 'var(--surface-container)',
          nextColor: 'var(--on-surface)',
        };
      default:
        return {
          label: 'Đã hoàn tất',
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
      border: `1px solid ${order.isRush ? 'var(--error)' : 'var(--outline-variant)'}`,
      borderTop: `5px solid ${order.isRush ? 'var(--error)' : isOverdue ? 'var(--error)' : cfg.borderColor}`,
      boxShadow: order.isRush
        ? '0 0 0 2px rgba(186, 26, 26, 0.2), 0 4px 12px rgba(186, 26, 26, 0.15)'
        : isOverdue
        ? '0 0 0 1px rgba(189, 89, 58, 0.25), 0 4px 12px rgba(189, 89, 58, 0.15)'
        : 'var(--shadow-sm)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      transition: 'all 0.2s ease',
      opacity: isOrderUpdating ? 0.7 : 1,
    }}>

      {/* --- Header card --- */}
      <div style={{
        background: order.isRush
          ? '#ffebee'
          : isOverdue
          ? 'var(--primary-fixed)'
          : cfg.headerBg,
        borderBottom: '1px solid var(--outline-variant)',
        padding: '12px 14px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'Epilogue', fontWeight: 800, fontSize: 22,
              color: order.isRush ? 'var(--error)' : 'var(--primary)', lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>
              {order.tableNumber ? `Bàn ${order.tableNumber}` : 'Mang Về'}
            </span>
            <span style={{
              fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700,
              padding: '2px 6px', borderRadius: 4,
              background: 'var(--primary-container)', color: '#fff',
              letterSpacing: '0.04em',
            }}>
              #{order.orderCode || order.id}
            </span>

            {/* Badge RUSH nếu là đơn hỏa tốc */}
            {order.isRush && (
              <span style={{
                fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 800,
                padding: '2px 6px', borderRadius: 4,
                background: 'var(--error, #ba1a1a)', color: '#fff',
                display: 'inline-flex', alignItems: 'center', gap: 2,
                letterSpacing: '0.04em',
              }}>
                <Icon name="bolt" size={12} fill={1} />
                RUSH
              </span>
            )}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap',
            fontFamily: 'Plus Jakarta Sans', fontSize: 12, color: 'var(--on-surface-variant)',
          }}>
            {order.zoneName && (
              <span style={{
                padding: '1px 6px', borderRadius: 4,
                background: 'rgba(0,0,0,0.05)', fontSize: 11, fontWeight: 600,
              }}>
                {order.zoneName}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="person" size={13} style={{ color: 'var(--primary)' }} />
              {order.staffName || 'Khách quét QR'}
            </span>
            {order.startedAt && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--outline)' }}>
                <Icon name="schedule" size={13} />
                {formatOrderTime(order.startedAt)}
              </span>
            )}
          </div>

          {/* Ghi chú chung hoặc cảnh báo chuyển bàn */}
          {order.note && (
            <div style={{
              marginTop: 6, padding: '4px 8px', borderRadius: 6,
              background: order.note.includes('[CHUYỂN TỪ') ? 'rgba(186, 26, 26, 0.12)' : 'rgba(255, 152, 0, 0.1)',
              color: order.note.includes('[CHUYỂN TỪ') ? '#BA1A1A' : '#e65100',
              fontFamily: 'Plus Jakarta Sans', fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'flex-start', gap: 4,
              border: order.note.includes('[CHUYỂN TỪ') ? '1px dashed #BA1A1A' : 'none',
              wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: 1.35,
            }}>
              <Icon name={order.note.includes('[CHUYỂN TỪ') ? 'swap_horiz' : 'info'} size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{order.note}</span>
            </div>
          )}
        </div>

        {/* Timer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 8,
            background: order.isRush
              ? 'var(--error)'
              : isOverdue
              ? 'var(--error)'
              : isUrgent
              ? 'var(--primary)'
              : cfg.timerBg,
            color: '#fff',
            boxShadow: 'var(--shadow-xs)',
          }}>
            {(isOverdue || order.isRush) && <Icon name="warning" size={14} fill={1} />}
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

      {/* --- Danh sách món ăn trong ticket --- */}
      <div style={{ padding: '12px 14px', background: 'var(--surface)', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {order.items && order.items.map((item, idx) => {
          const isCancelled = item.status === 'CANCELLED';
          const isServed = item.status === 'SERVED';
          const isReady = item.status === 'READY';
          const isDone = isReady || isServed;
          const isItemUpdating = actionLoadingId === `item-${item.id}`;

          return (
            <div
              key={item.id}
              style={{
                paddingBottom: idx < order.items.length - 1 ? 10 : 0,
                borderBottom: idx < order.items.length - 1 ? '1px solid var(--outline-variant)' : 'none',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
                opacity: isServed ? 0.45 : isCancelled ? 0.55 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'Epilogue', fontWeight: 700, fontSize: 16,
                    color: isCancelled ? '#ba1a1a' : isServed ? 'var(--outline)' : 'var(--primary)',
                    textDecoration: isServed || isCancelled ? 'line-through' : 'none',
                  }}>
                    {item.quantity}x
                  </span>
                  <span style={{
                    fontFamily: 'Epilogue', fontWeight: 700, fontSize: 15,
                    color: isCancelled ? '#ba1a1a' : isServed ? 'var(--on-surface-variant)' : 'var(--on-surface)',
                    textDecoration: isServed || isCancelled ? 'line-through' : 'none',
                  }}>
                    {item.name}
                  </span>

                  {/* Badge phân biệt trạng thái món rõ nét theo chuẩn F&B */}
                  {isCancelled && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      background: '#ffebee', color: '#ba1a1a', border: '1px solid #ffcdd2',
                      display: 'inline-flex', alignItems: 'center', gap: 2,
                    }}>
                      <Icon name="cancel" size={11} fill={1} />
                      ĐÃ HỦY
                    </span>
                  )}
                  {isServed && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                      background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)',
                      display: 'inline-flex', alignItems: 'center', gap: 2,
                    }}>
                      <Icon name="done_all" size={12} style={{ color: 'var(--primary)' }} />
                      ĐÃ LÊN BÀN
                    </span>
                  )}
                  {isReady && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      background: 'rgba(46, 125, 50, 0.12)', color: '#2e7d32', border: '1px solid rgba(46, 125, 50, 0.25)',
                      display: 'inline-flex', alignItems: 'center', gap: 2,
                    }}>
                      <Icon name="check_circle" size={11} fill={1} />
                      ĐÃ XONG (CHỜ BƯNG)
                    </span>
                  )}
                </div>

                {/* Ghi chú bếp cho từng món (chống vỡ layout chữ dài) */}
                {item.note && (
                  <div style={{ marginTop: 4, paddingLeft: 28, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'flex-start', gap: 4,
                      padding: '2px 8px', borderRadius: 4,
                      background: 'var(--surface-container-low)',
                      color: 'var(--primary)',
                      fontFamily: 'Plus Jakarta Sans', fontSize: 11, fontWeight: 700,
                      border: '1px solid var(--outline-variant)', lineHeight: 1.35,
                    }}>
                      <Icon name="report" size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{item.note}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Checkbox item - Click đổi trạng thái món sang READY hoặc COOKING */}
              <input
                type="checkbox"
                checked={isDone}
                disabled={isServed || isCancelled || isItemUpdating}
                onChange={() => onToggleItemStatus(order.id, item.id, item.status)}
                title={
                  isCancelled
                    ? "Món đã bị hủy"
                    : isServed
                    ? "Món đã được phục vụ lên bàn"
                    : isReady
                    ? "Bấm để nấu lại món này"
                    : "Bấm xác nhận đã xong món này"
                }
                style={{
                  width: 22, height: 22, marginTop: 2, accentColor: 'var(--primary)',
                  cursor: isServed || isCancelled || isItemUpdating ? 'not-allowed' : 'pointer',
                  opacity: isItemUpdating ? 0.5 : 1,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* --- Footer actions --- */}
      <div style={{
        padding: '10px 12px',
        background: 'var(--surface-container)',
        borderTop: '1px solid var(--outline-variant)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {cfg.nextStatus ? (
          <button
            type="button"
            disabled={isOrderUpdating}
            onClick={() => onUpdateStatus(order.id, cfg.nextStatus)}
            style={{
              flex: 1, height: 44, borderRadius: 12,
              background: isOverdue ? 'var(--error)' : cfg.nextBg,
              color: cfg.nextColor,
              border: 'none',
              cursor: isOrderUpdating ? 'not-allowed' : 'pointer',
              opacity: isOrderUpdating ? 0.6 : 1,
              fontFamily: 'Epilogue', fontWeight: 700, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <Icon name={cfg.nextIcon} size={18} fill={1} />
            {isOverdue ? 'CHUYỂN GIAO MÓN (OVERDUE)' : cfg.nextLabel.toUpperCase()}
          </button>
        ) : (
          <div style={{
            flex: 1, height: 44, borderRadius: 12,
            background: 'var(--surface-container-high)',
            color: 'var(--on-surface-variant)',
            fontFamily: 'Epilogue', fontWeight: 700, fontSize: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Icon name="check_circle" size={18} fill={1} style={{ color: 'var(--tertiary, #2e7d32)' }} />
            TOÀN BỘ ĐÃ XONG (CHỜ BƯNG)
          </div>
        )}

        {/* Nút RUSH */}
        <button
          type="button"
          disabled={isOrderUpdating}
          onClick={() => onToggleRush(order.id)}
          title={order.isRush ? "Hủy chế độ hỏa tốc" : "Đánh dấu đơn hỏa tốc (RUSH)"}
          style={{
            height: 44, padding: '0 12px', borderRadius: 12,
            background: order.isRush ? 'var(--error, #ba1a1a)' : 'var(--surface-container-lowest)',
            border: `1px solid ${order.isRush ? 'var(--error, #ba1a1a)' : 'var(--outline-variant)'}`,
            color: order.isRush ? '#fff' : 'var(--primary)',
            cursor: isOrderUpdating ? 'not-allowed' : 'pointer',
            opacity: isOrderUpdating ? 0.6 : 1,
            fontFamily: 'Epilogue', fontWeight: 700, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 4,
            transition: 'all 0.15s ease',
          }}
        >
          <Icon name="bolt" size={16} fill={order.isRush ? 1 : 0} />
          RUSH
        </button>
      </div>
    </article>
  );
}

// ====================================================
// KitchenKdsPage - Màn hình bếp KDS (SCR-15 Stitch)
// Dữ liệu thời gian thực từ CSDL SQL Server qua REST API
// ====================================================
export default function KitchenKdsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [cancelledAlert, setCancelledAlert] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  // State Quản lý món hết (86'd)
  const [show86Modal, setShow86Modal] = useState(false);
  const [menuItems86, setMenuItems86] = useState([]);
  const [loading86, setLoading86] = useState(false);
  const [search86, setSearch86] = useState('');
  const [station86, setStation86] = useState('ALL');

  // Lưu cài đặt âm thanh vào localStorage
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('roms_kds_sound');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const prevOrderIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);

  // Hiển thị thông báo phản hồi (Toast)
  const showToast = (text, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Bật/tắt âm thanh chuông bếp & lưu cấu hình
  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem('roms_kds_sound', String(next));
      } catch {}
      if (next) {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        playKitchenChime();
      }
      return next;
    });
  };

  // Lắng nghe thay đổi toàn màn hình
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

  // Tải danh sách đơn hàng thực tế từ Backend
  const loadOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [ordersRes, summaryRes] = await Promise.all([
        kitchenApi.getActiveOrders(),
        kitchenApi.getKitchenSummary(),
      ]);

      if (ordersRes.data && ordersRes.data.success) {
        const incomingOrders = ordersRes.data.data || [];

        // Nếu có đơn mới xuất hiện so với lần quét trước -> Phát tiếng chuông Ding-Dong
        if (!isInitialLoadRef.current && soundEnabled) {
          const hasNewOrder = incomingOrders.some(o => !prevOrderIdsRef.current.has(o.id));
          if (hasNewOrder) {
            playKitchenChime();
          }
        }

        prevOrderIdsRef.current = new Set(incomingOrders.map(o => o.id));
        isInitialLoadRef.current = false;
        setOrders(incomingOrders);
      }

      if (summaryRes.data && summaryRes.data.success) {
        setSummary(summaryRes.data.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu KDS:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Chu kỳ Polling 5s & đồng bộ Realtime tức thì khi có đơn mới
  useEffect(() => {
    loadOrders(false);

    const interval = setInterval(() => {
      loadOrders(true);
    }, 5000);

    const handleFocus = () => loadOrders(true);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    const unsubscribeRealtime = subscribeRealtimeEvents((event) => {
        if (event?.status === 'CANCELLED' || event?.payload?.status === 'CANCELLED' || event?.type === 'ORDER_CANCELLED') {
          if (soundEnabled) playCancelAlert();
          const tbl = event?.tableNumber || event?.tableName || 'Bàn';
          setCancelledAlert(`⚠️ Bàn ${tbl}: Có món vừa bị HỦY bởi Quản lý! Dừng chế biến!`);
          setTimeout(() => setCancelledAlert(null), 8000);
        }
      if (event?.type === 'NEW_ORDER_CREATED' || event?.type === 'ORDER_UPDATE' || event?.type === 'TABLE_UPDATE') {
        loadOrders(true);
      }
      if (event?.type === 'MENU_AVAILABILITY_CHANGED' && event?.payload) {
        const { id, isAvailable } = event.payload;
        setMenuItems86(prev => prev.map(m => m.id === id ? { ...m, isAvailable } : m));
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      unsubscribeRealtime();
    };
  }, [soundEnabled]);

  // Tải danh sách thực đơn để Bếp quản lý trạng thái Tạm Hết (86'd)
  const load86MenuItems = async () => {
    try {
      setLoading86(true);
      const res = await kitchenApi.getKitchenMenuItems();
      if (res.data && res.data.success) {
        setMenuItems86(res.data.data || []);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách món 86d:', err);
    } finally {
      setLoading86(false);
    }
  };

  // Bật/tắt trạng thái 86'd cho một món ăn
  const handleToggle86 = async (itemId, currentName, currentAvailable) => {
    try {
      setMenuItems86(prev => prev.map(m => m.id === itemId ? { ...m, isAvailable: !m.isAvailable } : m));
      const res = await kitchenApi.toggleItemAvailability(itemId);
      if (res.data && res.data.success) {
        showToast(currentAvailable ? `Đã báo hết món "${currentName}" (86'd)` : `Đã mở bán lại món "${currentName}"`);
      }
    } catch (err) {
      console.error('Lỗi khi bật/tắt 86d:', err);
      showToast('Không thể cập nhật trạng thái món. Vui lòng thử lại!', true);
      load86MenuItems();
    }
  };

  // Cập nhật trạng thái cho cả đơn hàng
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setActionLoadingId(`order-${orderId}`);
      const res = await kitchenApi.updateOrderStatus(orderId, newStatus);
      if (res.data && res.data.success) {
        showToast('Đã cập nhật trạng thái đơn thành công');
        await loadOrders(true);
      }
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái đơn:', err);
      showToast('Không thể cập nhật trạng thái đơn. Vui lòng thử lại!', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Cập nhật trạng thái từng món ăn riêng lẻ (tick hoàn thành)
  const handleToggleItemStatus = async (orderId, itemId, currentStatus) => {
    const nextStatus = (currentStatus === 'READY' || currentStatus === 'SERVED') ? 'COOKING' : 'READY';
    try {
      setActionLoadingId(`item-${itemId}`);
      const res = await kitchenApi.updateItemStatus(itemId, nextStatus);
      if (res.data && res.data.success) {
        await loadOrders(true);
      }
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái món:', err);
      showToast('Không thể cập nhật trạng thái món. Vui lòng thử lại!', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Bật/Tắt chế độ ưu tiên hỏa tốc RUSH
  const handleToggleRush = async (orderId) => {
    try {
      setActionLoadingId(`order-${orderId}`);
      const res = await kitchenApi.toggleRushOrder(orderId);
      if (res.data && res.data.success) {
        await loadOrders(true);
      }
    } catch (err) {
      console.error('Lỗi cập nhật ưu tiên RUSH:', err);
      showToast('Không thể cập nhật chế độ hỏa tốc. Vui lòng thử lại!', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Bộ lọc theo trạng thái
  const filterMatches = (order, filter) => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return order.status === 'CONFIRMED' || order.status === 'PENDING' || order.status === 'SUBMITTED';
    if (filter === 'COOKING') return order.status === 'COOKING';
    if (filter === 'READY') return order.status === 'READY';
    return true;
  };

  // Lọc kết hợp trạng thái + tìm kiếm nhanh (số bàn, mã đơn, tên món)
  const filteredOrders = orders.filter(order => {
    if (!filterMatches(order, filterStatus)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const matchTable = (order.tableNumber || '').toLowerCase().includes(q) || (order.tableName || '').toLowerCase().includes(q);
    const matchCode = (order.orderCode || '').toLowerCase().includes(q) || String(order.id).includes(q);
    const matchItem = order.items && order.items.some(it => (it.name || '').toLowerCase().includes(q));
    return matchTable || matchCode || matchItem;
  });

  const counts = {
    ALL: orders.length,
    PENDING: orders.filter(o => o.status === 'CONFIRMED' || o.status === 'PENDING' || o.status === 'SUBMITTED').length,
    COOKING: orders.filter(o => o.status === 'COOKING').length,
    READY: orders.filter(o => o.status === 'READY').length,
  };

  const filterOptions = [
    { key: 'ALL', label: 'Tất cả (All)', dotColor: 'var(--primary)' },
    { key: 'PENDING', label: 'Chờ tiếp nhận', dotColor: 'var(--secondary)' },
    { key: 'COOKING', label: 'Đang nấu', dotColor: 'var(--primary-container)' },
    { key: 'READY', label: 'Sẵn sàng', dotColor: 'var(--tertiary-container, #2e7d32)' },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      background: 'var(--surface)',
      position: 'relative',
    }}>

      {/* --- Filter Bar + Metrics --- */}
      <div style={{
        background: 'var(--surface-container-lowest)',
        borderBottom: '1px solid rgba(220, 192, 185, 0.5)',
        padding: '8px 20px',
        display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between', gap: 10,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Ô tìm kiếm nhanh theo Số Bàn / Mã Đơn / Tên Món (Chuẩn F&B Rush Hour) */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Icon name="search" size={16} style={{ position: 'absolute', left: 10, color: 'var(--outline)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bàn / mã / món..."
              style={{
                padding: '6px 28px 6px 32px',
                borderRadius: 8,
                border: '1px solid var(--outline-variant)',
                background: 'var(--surface)',
                color: 'var(--on-surface)',
                fontSize: 12,
                fontFamily: 'Plus Jakarta Sans',
                outline: 'none',
                width: 175,
                transition: 'all 0.15s ease',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                title="Xóa tìm kiếm"
                style={{
                  position: 'absolute', right: 6,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 2, display: 'flex', alignItems: 'center', color: 'var(--outline)'
                }}
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'Epilogue', fontWeight: 700, fontSize: 11,
              color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em',
              marginRight: 2,
            }}>
              Lọc:
            </span>
            {filterOptions.map(opt => {
              const isActive = filterStatus === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
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
        </div>

        {/* Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--on-surface-variant)', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 8,
            background: 'var(--surface-container-low)',
            border: '1px solid var(--outline-variant)',
          }}>
            <Icon name="avg_pace" size={16} style={{ color: 'var(--secondary)' }} />
            <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 500 }}>Ra món TB:</span>
            <strong style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 14, color: 'var(--on-surface)' }}>
              {summary?.avgPrepTime || '0m 00s'}
            </strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="speed" size={16} style={{ color: 'var(--tertiary, #2e7d32)' }} />
            <span>Hiệu suất SLA:</span>
            <strong style={{ color: 'var(--tertiary, #2e7d32)', fontWeight: 700 }}>
              {summary?.performanceRate !== undefined ? `${summary.performanceRate}%` : '100%'}
            </strong>
          </div>

          {/* Quick Audio & Fullscreen Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => { setShow86Modal(true); load86MenuItems(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 8,
                background: '#BA1A1A',
                color: '#fff',
                border: 'none', cursor: 'pointer',
                fontFamily: 'Epilogue', fontWeight: 700, fontSize: 11,
                boxShadow: '0 1px 3px rgba(186, 26, 26, 0.3)',
                transition: 'all 0.15s ease',
              }}
              title="Bật/Tắt trạng thái Tạm Hết (86'd) cho từng món ăn ngay lập tức"
            >
              <Icon name="block" size={15} />
              <span>Báo Hết Món (86'd)</span>
            </button>

            <button
              type="button"
              onClick={toggleSound}
              title={soundEnabled ? "Bấm để tắt âm thanh chuông bếp" : "Bấm để bật âm thanh chuông bếp"}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 10px', borderRadius: 8,
                background: soundEnabled ? 'rgba(46, 125, 50, 0.1)' : 'var(--surface-container-low)',
                border: `1px solid ${soundEnabled ? 'rgba(46, 125, 50, 0.3)' : 'var(--outline-variant)'}`,
                color: soundEnabled ? '#2e7d32' : 'var(--on-surface-variant)',
                cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans', fontWeight: 600, fontSize: 11,
                transition: 'all 0.15s ease',
              }}
            >
              <Icon name={soundEnabled ? "volume_up" : "volume_off"} size={15} style={{ color: soundEnabled ? '#2e7d32' : 'var(--outline)' }} />
              {soundEnabled ? 'Âm báo: BẬT' : 'Âm báo: TẮT'}
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
                transition: 'all 0.15s ease',
              }}
            >
              <Icon name={isFullscreen ? "fullscreen_exit" : "fullscreen"} size={15} />
              {isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            </button>
          </div>
        </div>
      </div>

      {/* --- Grid Ticket Cards --- */}
        {/* Banner cảnh báo Hủy Món (Void Alert) */}
        {cancelledAlert && (
          <div style={{
            background: '#BA1A1A', color: '#FFFFFF',
            padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 14,
            boxShadow: '0 4px 12px rgba(186, 26, 26, 0.35)',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="warning" size={24} style={{ color: '#FFDAD6' }} />
              <span>{cancelledAlert}</span>
            </div>
            <button
              onClick={() => setCancelledAlert(null)}
              style={{
                background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff',
                padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12
              }}
            >
              Đã rõ
            </button>
          </div>
        )}

      <main style={{
        flex: 1, overflowY: 'auto',
        padding: '16px 20px',
        background: 'rgba(252, 241, 239, 0.4)',
      }}>
        {loading && orders.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: 300, gap: 12, textAlign: 'center',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '3px solid var(--primary-container)',
              borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 14, color: 'var(--on-surface-variant)' }}>
              Đang kết nối dữ liệu nhà bếp...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: 300, gap: 12, textAlign: 'center',
          }}>
            <Icon name="soup_kitchen" size={56} style={{ color: 'var(--outline-variant)' }} />
            <p style={{ fontFamily: 'Epilogue', fontSize: 18, fontWeight: 700, color: 'var(--on-surface-variant)' }}>
              {searchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Hàng đợi trống'}
            </p>
            <p style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 14, color: 'var(--outline)' }}>
              {searchQuery ? `Không có đơn nào khớp với từ khóa "${searchQuery}"` : 'Chưa có đơn nào đang chờ chế biến trong danh mục này'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
            paddingBottom: 24,
          }}>
            {filteredOrders.map(order => (
              <KdsTicketCard
                key={order.id}
                order={order}
                actionLoadingId={actionLoadingId}
                onUpdateStatus={handleUpdateStatus}
                onToggleItemStatus={handleToggleItemStatus}
                onToggleRush={handleToggleRush}
              />
            ))}
          </div>
        )}
      </main>

      {/* --- Drawer Quản Lý Món Tạm Hết 86'd --- */}
      {show86Modal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(3px)',
          display: 'flex', justifyContent: 'flex-end',
        }} onClick={() => setShow86Modal(false)}>
          <div style={{
            width: '100%', maxWidth: '540px', height: '100%',
            background: 'var(--surface, #FFFFFF)',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.25)',
            display: 'flex', flexDirection: 'column',
          }} onClick={e => e.stopPropagation()}>
            {/* Drawer Header */}
            <div style={{
              padding: '18px 20px',
              borderBottom: '1px solid var(--outline-variant, #EAE0DE)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#FFF8F6',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="block" size={20} style={{ color: '#BA1A1A' }} />
                  <h3 style={{ margin: 0, fontFamily: 'Epilogue', fontWeight: 800, fontSize: '1.15rem', color: '#1F1B1A' }}>
                    Quản Lý Món Hết (86'd Control)
                  </h3>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#89726B', marginTop: '3px' }}>
                  Bật/tắt món tạm hết để máy khách QR và bồi bàn cập nhật tức thì
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShow86Modal(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '6px', borderRadius: '50%', color: '#56423D',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Drawer Filter & Search */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0E6E4', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <Icon name="search" size={18} style={{ position: 'absolute', left: 10, top: 9, color: '#89726B' }} />
                <input
                  type="text"
                  value={search86}
                  onChange={e => setSearch86(e.target.value)}
                  placeholder="Tìm theo tên món hoặc mã SKU..."
                  style={{
                    width: '100%', padding: '8px 12px 8px 34px',
                    borderRadius: '10px', border: '1px solid #EAE0DE',
                    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { id: 'ALL', label: 'Tất Cả' },
                  { id: 'KITCHEN', label: 'Bếp Nấu (Kitchen)' },
                  { id: 'WAITER', label: 'Quầy Nước (Waiter)' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStation86(tab.id)}
                    style={{
                      padding: '5px 12px', borderRadius: '8px',
                      border: 'none',
                      background: station86 === tab.id ? '#9D4124' : '#F6ECEA',
                      color: station86 === tab.id ? '#FFFFFF' : '#56423D',
                      fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dish List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loading86 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#89726B' }}>
                  Đang tải danh mục thực đơn...
                </div>
              ) : menuItems86
                  .filter(m => {
                    const matchSearch = !search86.trim() ||
                      (m.name || '').toLowerCase().includes(search86.toLowerCase()) ||
                      (m.sku || '').toLowerCase().includes(search86.toLowerCase());
                    const matchStation = station86 === 'ALL' || m.station === station86;
                    return matchSearch && matchStation;
                  })
                  .map(item => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: '12px',
                        background: item.isAvailable ? '#FFFFFF' : '#FFF5F5',
                        border: item.isAvailable ? '1px solid #F0E6E4' : '1px solid #FECACA',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                        <img
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=120'}
                          alt={item.name}
                          style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }}
                          onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=120'; }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#89726B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{item.categoryName}</span>
                            <span>•</span>
                            <span style={{ fontWeight: 700, color: item.remainingStock > 5 ? '#059669' : '#C5221F' }}>
                              Tồn: {item.remainingStock ?? 100}/{item.dailyStock ?? 100}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 1-Click Toggle 86'd */}
                      <button
                        type="button"
                        onClick={() => handleToggle86(item.id, item.name, item.isAvailable)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '6px 12px', borderRadius: '8px',
                          border: 'none', cursor: 'pointer',
                          background: item.isAvailable ? '#D1E7DD' : '#BA1A1A',
                          color: item.isAvailable ? '#0F5132' : '#FFFFFF',
                          fontFamily: 'Epilogue', fontWeight: 800, fontSize: '0.78rem',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Icon name={item.isAvailable ? 'check_circle' : 'block'} size={15} />
                        <span>{item.isAvailable ? 'Đang Bán' : 'Tạm Hết (86d)'}</span>
                      </button>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Toast Thông báo phản hồi người dùng --- */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          padding: '10px 16px', borderRadius: 10,
          background: toastMessage.isError ? 'var(--error, #ba1a1a)' : 'var(--inverse-surface, #342F2E)',
          color: '#fff',
          fontFamily: 'Plus Jakarta Sans', fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fadeIn 0.2s ease',
        }}>
          <Icon name={toastMessage.isError ? "error" : "check_circle"} size={18} fill={1} />
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
