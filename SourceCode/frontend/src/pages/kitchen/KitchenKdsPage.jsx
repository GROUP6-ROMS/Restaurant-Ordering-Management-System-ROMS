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
function KdsTicketCard({ order, actionLoadingId, onBatchUpdateItemStatus, onBatchToggleItemRush, onToggleRushOrder }) {
  const elapsedSeconds = useElapsedSeconds(order.startedAt, order.elapsedSeconds);
  const isOverdue = elapsedSeconds > 15 * 60; // Trễ hơn 15 phút (Overdue SLA)
  const isUrgent = elapsedSeconds > 10 * 60;  // Cảnh báo sau 10 phút
  const isOrderUpdating = actionLoadingId === `order-${order.id}` || actionLoadingId === 'batch-status' || actionLoadingId === 'batch-rush';

  const [selectedItemIds, setSelectedItemIds] = useState(new Set());

  // Lọc các món có thể tick chọn: món chưa hoàn tất lên bàn và chưa bị hủy
  const selectableItems = (order.items || []).filter(i => i.status !== 'SERVED' && i.status !== 'CANCELLED');
  const allSelected = selectableItems.length > 0 && selectableItems.every(i => selectedItemIds.has(i.id));

  const toggleSelectItem = (itemId) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(selectableItems.map(i => i.id)));
    }
  };

  const handleMarkDoneSelected = async () => {
    if (selectedItemIds.size === 0) return;
    const ids = Array.from(selectedItemIds);
    await onBatchUpdateItemStatus(ids, 'READY');
    setSelectedItemIds(new Set());
  };

  const handleRushSelected = async () => {
    if (selectedItemIds.size === 0) return;
    const ids = Array.from(selectedItemIds);
    await onBatchToggleItemRush(ids);
    setSelectedItemIds(new Set());
  };

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
        };
      case 'COOKING':
        return {
          label: 'Đang nấu',
          borderColor: 'var(--primary-container)',
          headerBg: 'var(--primary-fixed)',
          timerBg: 'var(--primary)',
          timerColor: '#fff',
        };
      case 'READY':
        return {
          label: 'Sẵn sàng phục vụ',
          borderColor: 'var(--tertiary-container, #2e7d32)',
          headerBg: 'var(--tertiary-fixed, #e8f5e9)',
          timerBg: 'var(--tertiary-container, #2e7d32)',
          timerColor: '#fff',
        };
      default:
        return {
          label: 'Đã hoàn tất',
          borderColor: 'var(--outline-variant)',
          headerBg: 'var(--surface-container)',
          timerBg: 'var(--surface-container-high)',
          timerColor: 'var(--on-surface-variant)',
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

      {/* --- Header card (Chỉ giữ Tên bàn, Mã đơn, Giờ nhận đơn và Thẻ Rush đỏ nếu có) --- */}
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
          {/* Dòng 1: Tên bàn riêng biệt (+ Badge RUSH nếu có) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'Epilogue', fontWeight: 800, fontSize: 22,
              color: order.isRush ? 'var(--error)' : 'var(--primary)', lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}>
              {order.tableNumber ? (order.tableNumber.toLowerCase().includes('phòng') ? order.tableNumber : `Bàn ${order.tableNumber}`) : 'Mang Về'}
            </span>

            {/* Badge RUSH nếu là đơn hỏa tốc (thẻ rush đỏ gắn lên đơn) */}
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

          {/* Dòng 2: Mã phiên ăn riêng biệt */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
            {(order.sessionCode || order.sessionId) && (
              <span style={{
                fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700,
                padding: '2px 7px', borderRadius: 4,
                background: 'var(--primary-container)', color: '#fff',
                letterSpacing: '0.04em',
              }}>
                #{order.sessionCode || `SES-${order.sessionId}`}
              </span>
            )}
            <span style={{
              fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700,
              padding: '2px 6px', borderRadius: 4,
              background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)',
              letterSpacing: '0.03em',
            }}>
              #{order.orderCode || order.id}
            </span>
          </div>

          {/* Dòng 3: Giờ đẩy đơn xuống bếp */}
          {order.startedAt && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4, marginTop: 5,
              fontFamily: 'Plus Jakarta Sans', fontSize: 11, fontWeight: 600, color: 'var(--outline)',
            }}>
              <Icon name="schedule" size={13} />
              <span>Nhận đơn: {formatOrderTime(order.startedAt)}</span>
            </div>
          )}

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
        {selectableItems.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px dashed var(--outline-variant)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Món trong đơn ({order.items ? order.items.length : 0})
            </span>
            <button
              type="button"
              onClick={toggleSelectAll}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 700, color: 'var(--primary)',
                padding: '2px 6px', borderRadius: 4,
              }}
            >
              {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>
        )}

        {order.items && order.items.map((item, idx) => {
          const isCancelled = item.status === 'CANCELLED';
          const isServed = item.status === 'SERVED';
          const isReady = item.status === 'READY';
          const isSelected = selectedItemIds.has(item.id);

          return (
            <div
              key={item.id}
              onClick={() => {
                if (!isServed && !isCancelled) toggleSelectItem(item.id);
              }}
              style={{
                paddingBottom: idx < order.items.length - 1 ? 10 : 0,
                borderBottom: idx < order.items.length - 1 ? '1px solid var(--outline-variant)' : 'none',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
                opacity: isServed ? 0.45 : isCancelled ? 0.55 : 1,
                background: isSelected ? 'rgba(189, 89, 58, 0.08)' : 'transparent',
                borderRadius: 8,
                padding: '6px 4px',
                cursor: isServed || isCancelled ? 'default' : 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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

                  {/* Icon Rush đỏ bên cạnh món nếu món được rush VÀ đơn chưa bị rush toàn bộ */}
                  {!order.isRush && item.isRush && (
                    <span
                      title="Món được ưu tiên hỏa tốc (RUSH)"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 2,
                        padding: '1px 5px', borderRadius: 4,
                        background: '#ffebee', color: '#ba1a1a', border: '1px solid #ffcdd2',
                        fontSize: 10, fontWeight: 800, fontFamily: 'JetBrains Mono',
                      }}
                    >
                      <Icon name="bolt" size={12} fill={1} />
                      RUSH
                    </span>
                  )}

                  {/* Badges trạng thái */}
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

                {/* Ghi chú món */}
                {item.note && (
                  <div style={{ marginTop: 4, paddingLeft: 24, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
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

              {/* Checkbox item - Đánh dấu chọn món để thao tác */}
              <input
                type="checkbox"
                checked={isSelected}
                disabled={isServed || isCancelled}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggleSelectItem(item.id)}
                title={
                  isCancelled
                    ? "Món đã bị hủy"
                    : isServed
                    ? "Món đã được phục vụ lên bàn"
                    : "Tick để chọn món thực hiện Xong món hoặc Rush món"
                }
                style={{
                  width: 22, height: 22, marginTop: 2, accentColor: 'var(--primary)',
                  cursor: isServed || isCancelled ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* --- Footer actions (Không còn chức năng lên hết món) --- */}
      <div style={{
        padding: '10px 12px',
        background: 'var(--surface-container)',
        borderTop: '1px solid var(--outline-variant)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {/* Nút Xong món (Đổi trạng thái chờ bưng cho các món đã chọn) */}
        <button
          type="button"
          disabled={selectedItemIds.size === 0 || isOrderUpdating}
          onClick={handleMarkDoneSelected}
          title={selectedItemIds.size === 0 ? "Tick chọn ít nhất 1 món để xác nhận xong" : `Xác nhận xong ${selectedItemIds.size} món đã chọn (Chờ bưng)`}
          style={{
            flex: 1, height: 42, borderRadius: 10,
            background: selectedItemIds.size > 0 ? 'var(--tertiary-container, #2e7d32)' : 'var(--surface-container-high)',
            color: selectedItemIds.size > 0 ? '#fff' : 'var(--outline)',
            border: 'none',
            cursor: selectedItemIds.size > 0 && !isOrderUpdating ? 'pointer' : 'not-allowed',
            opacity: isOrderUpdating ? 0.6 : 1,
            fontFamily: 'Epilogue', fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.15s ease',
            boxShadow: selectedItemIds.size > 0 ? '0 2px 6px rgba(46, 125, 50, 0.25)' : 'none',
          }}
        >
          <Icon name="check_circle" size={17} fill={1} />
          {selectedItemIds.size > 0 ? `XONG MÓN (${selectedItemIds.size})` : 'XONG MÓN'}
        </button>

        {/* Nút Rush món đã chọn */}
        <button
          type="button"
          disabled={selectedItemIds.size === 0 || isOrderUpdating}
          onClick={handleRushSelected}
          title={selectedItemIds.size === 0 ? "Tick chọn món để gắn/gỡ cờ Rush" : `Gắn/gỡ cờ Rush cho ${selectedItemIds.size} món đã chọn`}
          style={{
            height: 42, padding: '0 12px', borderRadius: 10,
            background: selectedItemIds.size > 0 ? '#fff' : 'var(--surface-container-lowest)',
            border: `1px solid ${selectedItemIds.size > 0 ? '#ba1a1a' : 'var(--outline-variant)'}`,
            color: selectedItemIds.size > 0 ? '#ba1a1a' : 'var(--outline)',
            cursor: selectedItemIds.size > 0 && !isOrderUpdating ? 'pointer' : 'not-allowed',
            opacity: isOrderUpdating ? 0.6 : 1,
            fontFamily: 'Epilogue', fontWeight: 700, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 4,
            transition: 'all 0.15s ease',
          }}
        >
          <Icon name="bolt" size={16} fill={selectedItemIds.size > 0 ? 1 : 0} />
          RUSH MÓN
        </button>

        {/* Nút Rush cả đơn */}
        <button
          type="button"
          disabled={isOrderUpdating}
          onClick={() => onToggleRushOrder(order.id)}
          title={order.isRush ? "Hủy chế độ hỏa tốc cho cả đơn" : "Đánh dấu hỏa tốc cho toàn bộ đơn"}
          style={{
            height: 42, padding: '0 12px', borderRadius: 10,
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
          {order.isRush ? 'HỦY RUSH ĐƠN' : 'RUSH ĐƠN'}
        </button>
      </div>
    </article>
  );
}

// --- Component Lịch Sử Trong Ngày (Check món đã nấu theo bàn) ---
function KitchenDailyHistoryView({ dailyHistory, loadingHistory, onRefresh }) {
  const [search, setSearch] = useState('');

  const filteredHistory = dailyHistory.filter(t => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const matchTable = (t.tableNumber || '').toLowerCase().includes(q) || (t.tableName || '').toLowerCase().includes(q);
    const matchDish = (t.items || []).some(i => (i.name || '').toLowerCase().includes(q) || (i.orderCode || '').toLowerCase().includes(q));
    return matchTable || matchDish;
  });

  const totalDishesCooked = dailyHistory.reduce((sum, t) => sum + (t.totalItems || 0), 0);
  const totalTables = dailyHistory.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* Search & Statistics Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        background: 'var(--surface)', padding: '12px 16px', borderRadius: 14,
        border: '1px solid var(--outline-variant)', boxShadow: 'var(--shadow-xs)',
      }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, maxWidth: 360 }}>
          <Icon name="search" size={16} style={{ position: 'absolute', left: 10, color: 'var(--outline)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo bàn (B-01...) hoặc tên món đã nấu..."
            style={{
              width: '100%', padding: '8px 12px 8px 34px',
              borderRadius: 8, border: '1px solid var(--outline-variant)',
              background: 'var(--surface-container-low)', fontSize: 13,
              fontFamily: 'Plus Jakarta Sans', outline: 'none',
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline)' }}
            >
              <Icon name="close" size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>Số bàn hôm nay: <strong style={{ color: 'var(--primary)' }}>{totalTables}</strong></span>
            <span>•</span>
            <span>Tổng món đã xử lý: <strong style={{ color: 'var(--tertiary, #2e7d32)' }}>{totalDishesCooked}</strong></span>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            title="Làm mới lịch sử"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8,
              background: 'var(--surface-container)', border: '1px solid var(--outline-variant)',
              color: 'var(--on-surface)', fontFamily: 'Epilogue', fontWeight: 700, fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <Icon name="refresh" size={15} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Tables List */}
      {loadingHistory ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--on-surface-variant)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid var(--primary-container)',
            borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }} />
          <p style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 14 }}>Đang tải lịch sử chế biến trong ngày...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--outline)' }}>
          <Icon name="history_toggle_off" size={48} style={{ color: 'var(--outline-variant)', marginBottom: 8 }} />
          <p style={{ fontFamily: 'Epilogue', fontSize: 16, fontWeight: 700 }}>
            {search ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có lịch sử món nào trong ngày hôm nay'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16, paddingBottom: 24 }}>
          {filteredHistory.map((table, idx) => (
            <div
              key={table.sessionId ? `${table.tableNumber || 'MV'}_SES_${table.sessionId}` : `${table.tableNumber || 'TBL'}_${idx}`}
              style={{
                background: 'var(--surface)', borderRadius: 16,
                border: '1px solid var(--outline-variant)',
                boxShadow: 'var(--shadow-xs)', overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Table Header (Tách Tên bàn, Trạng thái bàn ra các dòng riêng biệt, thêm mã phiên ăn, xoá mô tả bàn) */}
              <div style={{
                background: 'var(--surface-container-low)', padding: '12px 16px',
                borderBottom: '1px solid var(--outline-variant)',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                {/* Dòng 1: Tên bàn + Mã phiên ăn */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontFamily: 'Epilogue', fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>
                    {table.tableNumber ? (table.tableNumber.toLowerCase().includes('phòng') ? table.tableNumber : `Bàn ${table.tableNumber}`) : 'Mang Về'}
                  </span>
                  {table.sessionId && (
                    <span style={{
                      fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 6,
                      background: 'var(--primary-container)', color: '#fff',
                      letterSpacing: '0.04em',
                    }}>
                      #{table.sessionCode || `SES-${table.sessionId}`}
                    </span>
                  )}
                </div>

                {/* Dòng 2: Trạng thái bàn & Thống kê món */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, flexWrap: 'wrap' }}>
                  {table.sessionStatusText && (
                    <span style={{
                      padding: '2px 8px', borderRadius: 6,
                      background: table.sessionStatus === 'ACTIVE' ? 'rgba(189, 89, 58, 0.12)' : 'var(--surface-container-high)',
                      color: table.sessionStatus === 'ACTIVE' ? 'var(--primary)' : 'var(--on-surface-variant)',
                    }}>
                      {table.sessionStatusText}
                    </span>
                  )}
                  <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(46, 125, 50, 0.1)', color: '#2e7d32' }}>
                    {table.readyItems || 0} Chờ bưng
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: 6, background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' }}>
                    {table.servedItems || 0} Đã lên bàn
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div style={{ padding: '10px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                {table.items && table.items.map(item => {
                  const isReady = item.status === 'READY';
                  const isServed = item.status === 'SERVED';
                  const isCancelled = item.status === 'CANCELLED';

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '8px 10px', borderRadius: 10,
                        background: 'var(--surface-container-lowest)',
                        border: '1px solid var(--outline-variant)',
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'Epilogue', fontWeight: 700, fontSize: 14, color: isCancelled ? '#ba1a1a' : 'var(--primary)' }}>
                            {item.quantity}x
                          </span>
                          <span style={{
                            fontFamily: 'Epilogue', fontWeight: 700, fontSize: 14,
                            color: isCancelled ? '#ba1a1a' : isServed ? 'var(--on-surface-variant)' : 'var(--on-surface)',
                            textDecoration: isCancelled ? 'line-through' : 'none',
                          }}>
                            {item.name}
                          </span>
                          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--outline)', padding: '1px 4px', background: 'rgba(0,0,0,0.04)', borderRadius: 3 }}>
                            #{item.orderCode}
                          </span>
                        </div>

                        {item.note && (
                          <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginTop: 2, paddingLeft: 18 }}>
                            • {item.note}
                          </div>
                        )}

                        <div style={{ fontSize: 10, color: 'var(--outline)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {item.orderTime && <span>Gọi: {formatOrderTime(item.orderTime)}</span>}
                          {item.completedTime && <span>• Xử lý: {formatOrderTime(item.completedTime)}</span>}
                        </div>
                      </div>

                      {/* Status Tag */}
                      <div style={{ flexShrink: 0 }}>
                        {isReady && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(46, 125, 50, 0.12)', color: '#2e7d32', border: '1px solid rgba(46, 125, 50, 0.25)' }}>
                            ĐÃ XONG
                          </span>
                        )}
                        {isServed && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' }}>
                            ĐÃ LÊN BÀN
                          </span>
                        )}
                        {isCancelled && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#ffebee', color: '#ba1a1a' }}>
                            ĐÃ HỦY
                          </span>
                        )}
                        {!isReady && !isServed && !isCancelled && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
                            {item.statusText || item.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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

  // Chế độ xem: 'QUEUE' (Chế biến thời gian thực) | 'HISTORY' (Lịch sử trong ngày)
  const [activeTab, setActiveTab] = useState('QUEUE');
  const [dailyHistory, setDailyHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  // Tải lịch sử các món đã nấu trong ngày
  const loadDailyHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await kitchenApi.getDailyHistory();
      if (res.data && res.data.success) {
        setDailyHistory(res.data.data || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải lịch sử trong ngày:', err);
      showToast('Không thể tải lịch sử nấu trong ngày', true);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Cập nhật trạng thái món hàng loạt (Xong món -> Chờ bưng)
  const handleBatchUpdateItemStatus = async (itemIds, status) => {
    try {
      setActionLoadingId('batch-status');
      const res = await kitchenApi.batchUpdateItemStatus(itemIds, status);
      if (res.data && res.data.success) {
        showToast(`Đã chuyển ${itemIds.length} món sang trạng thái Chờ bưng`);
        await loadOrders(true);
      }
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái món hàng loạt:', err);
      showToast('Không thể cập nhật trạng thái món. Vui lòng thử lại!', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Gắn/gỡ cờ Rush hàng loạt cho các món được chọn
  const handleBatchToggleItemRush = async (itemIds) => {
    try {
      setActionLoadingId('batch-rush');
      const res = await kitchenApi.batchToggleItemRush(itemIds);
      if (res.data && res.data.success) {
        showToast(`Đã cập nhật ưu tiên Rush cho ${itemIds.length} món`);
        await loadOrders(true);
      }
    } catch (err) {
      console.error('Lỗi cập nhật Rush món hàng loạt:', err);
      showToast('Không thể cập nhật cờ Rush món. Vui lòng thử lại!', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Bật/Tắt chế độ ưu tiên hỏa tốc RUSH cho cả đơn hàng
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
          {/* Chuyển đổi chế độ: Hàng đợi Chế biến vs Lịch sử trong ngày */}
          <div style={{
            display: 'inline-flex', background: 'var(--surface-container)', padding: 3, borderRadius: 10,
            border: '1px solid var(--outline-variant)',
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('QUEUE')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 8, border: 'none',
                background: activeTab === 'QUEUE' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'QUEUE' ? '#fff' : 'var(--on-surface-variant)',
                fontFamily: 'Epilogue', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon name="soup_kitchen" size={16} fill={activeTab === 'QUEUE' ? 1 : 0} />
              <span>Chế Biến ({orders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('HISTORY'); loadDailyHistory(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 8, border: 'none',
                background: activeTab === 'HISTORY' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'HISTORY' ? '#fff' : 'var(--on-surface-variant)',
                fontFamily: 'Epilogue', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon name="history" size={16} fill={activeTab === 'HISTORY' ? 1 : 0} />
              <span>Lịch Sử Hôm Nay</span>
            </button>
          </div>

          {activeTab === 'QUEUE' && (
            <>
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
            </>
          )}
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
        {activeTab === 'HISTORY' ? (
          <KitchenDailyHistoryView
            dailyHistory={dailyHistory}
            loadingHistory={loadingHistory}
            onRefresh={loadDailyHistory}
          />
        ) : loading && orders.length === 0 ? (
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
            paddingBottom: 24,
          }}>
            {filteredOrders.map(order => (
              <KdsTicketCard
                key={order.id}
                order={order}
                actionLoadingId={actionLoadingId}
                onBatchUpdateItemStatus={handleBatchUpdateItemStatus}
                onBatchToggleItemRush={handleBatchToggleItemRush}
                onToggleRushOrder={handleToggleRush}
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
