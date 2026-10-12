import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { notificationApi } from '../../api/notificationApi';
import { subscribeRealtimeEvents, broadcastRealtimeEvent } from '../../utils/realtimeSync';

/**
 * Âm thanh báo chuông nhẹ nhàng sử dụng Web Audio API chuẩn trình duyệt
 */
const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // Note E5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.18); // Ramp to A5
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.12); // Note A5
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // Ramp to D6
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (err) {
    // Trình duyệt có thể chặn audio nếu chưa tương tác người dùng
  }
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ASSISTANCE' | 'RESERVATION'
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [isRinging, setIsRinging] = useState(false);

  const [summary, setSummary] = useState({
    totalCount: 0,
    assistanceCount: 0,
    reservationCount: 0,
    items: [],
    assistanceItems: [],
    reservationItems: []
  });

  const prevItemIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  // 1. Tải danh sách thông báo từ Backend API
  const fetchNotifications = async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      const res = await notificationApi.getAdminNotifications();
      if (res && res.data) {
        // Hỗ trợ bóc tách cả res.data.data (ApiResponse Spring Boot) lẫn res.data
        const payload = (res.data.data && typeof res.data.data === 'object') ? res.data.data : res.data;
        const normalizedSummary = {
          totalCount: typeof payload.totalCount === 'number' ? payload.totalCount : 0,
          assistanceCount: typeof payload.assistanceCount === 'number' ? payload.assistanceCount : 0,
          reservationCount: typeof payload.reservationCount === 'number' ? payload.reservationCount : 0,
          items: Array.isArray(payload.items) ? payload.items : [],
          assistanceItems: Array.isArray(payload.assistanceItems) ? payload.assistanceItems : [],
          reservationItems: Array.isArray(payload.reservationItems) ? payload.reservationItems : []
        };
        setSummary(normalizedSummary);

        // Kiểm tra xem có thông báo mới xuất hiện không
        const currentIds = new Set(normalizedSummary.items.map(i => i.id));
        if (!isFirstLoadRef.current) {
          const hasNew = [...currentIds].some(id => !prevItemIdsRef.current.has(id));
          if (hasNew && normalizedSummary.totalCount > 0) {
            setIsRinging(true);
            playNotificationChime();
            setTimeout(() => setIsRinging(false), 2000);
          }
        } else {
          isFirstLoadRef.current = false;
        }
        prevItemIdsRef.current = currentIds;
      }
    } catch (err) {
      console.warn('Lỗi tải thông báo quản lý:', err);
    } finally {
      if (isManual) setLoading(false);
    }
  };

  // 2. Polling tự động và lắng nghe Realtime Sync
  useEffect(() => {
    fetchNotifications();

    // Vòng lặp cập nhật mỗi 4 giây
    const interval = setInterval(() => {
      fetchNotifications();
    }, 4000);

    // Lắng nghe sự kiện đồng bộ realtime từ các tab khác
    const unsubscribe = subscribeRealtimeEvents((event) => {
      if (
        event?.type === 'CALL_WAITER' ||
        event?.type === 'TABLE_UPDATE' ||
        event?.type === 'NEW_RESERVATION' ||
        event?.type === 'RESERVATION_UPDATE'
      ) {
        fetchNotifications();
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  // 3. Đóng popover khi nhấp ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 4. Quản lý xử lý xong yêu cầu hỗ trợ bàn
  const handleResolveAssistance = async (item, e) => {
    e.stopPropagation();
    try {
      setActionLoadingId(item.id);
      await notificationApi.resolveAssistance(item.sourceId);
      // Phát sự kiện realtime
      broadcastRealtimeEvent({ type: 'CALL_WAITER', resolvedId: item.sourceId });
      await fetchNotifications();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi xử lý yêu cầu chuông!');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 5. Điều hướng tới Sơ đồ bàn để xử lý
  const handleGoToTables = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    navigate('/admin/tables');
  };

  // 6. Điều hướng tới Sơ đồ bàn & mở modal duyệt đặt bàn
  const handleGoToReservation = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    // Điều hướng tới sơ đồ bàn và phát tín hiệu mở modal đặt bàn
    navigate('/admin/tables', { state: { openReservationModal: true } });
  };

  // 7. Tạo chuông thử nghiệm nhanh
  const handleTestCall = async (e) => {
    e.stopPropagation();
    try {
      setLoading(true);
      await notificationApi.createTestAssistance({
        note: 'Khách tại bàn vừa bấm chuông yêu cầu nhân viên hỗ trợ khăn lạnh & nước đá'
      });
      broadcastRealtimeEvent({ type: 'CALL_WAITER' });
      await fetchNotifications(true);
    } catch (err) {
      alert('Không thể tạo thông báo thử nghiệm: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Lọc danh sách theo tab được chọn
  const rawItems = activeTab === 'ASSISTANCE'
    ? summary?.assistanceItems
    : activeTab === 'RESERVATION'
      ? summary?.reservationItems
      : summary?.items;
  const displayItems = Array.isArray(rawItems) ? rawItems : [];

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <style>{`
        @keyframes bellShake {
          0% { transform: rotate(0); }
          15% { transform: rotate(14deg); }
          30% { transform: rotate(-14deg); }
          45% { transform: rotate(10deg); }
          60% { transform: rotate(-10deg); }
          75% { transform: rotate(5deg); }
          85% { transform: rotate(-5deg); }
          100% { transform: rotate(0); }
        }
        .bell-ring-active {
          animation: bellShake 0.75s ease-in-out infinite;
          transform-origin: top center;
        }
      `}</style>

      {/* Button Chuông Thông Báo */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Thông báo bàn cần hỗ trợ & Đặt bàn mới"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          border: '1.5px solid #EAE0DE',
          background: summary.totalCount > 0 ? '#FFF8F6' : '#FFFFFF',
          color: summary.totalCount > 0 ? '#BA1A1A' : '#56423D',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: summary.totalCount > 0 ? '0 2px 8px rgba(186, 26, 26, 0.15)' : 'none'
        }}
      >
        <span className={isRinging ? 'bell-ring-active' : ''} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon
            name={summary.totalCount > 0 ? 'notifications_active' : 'notifications'}
            size={22}
            fill={summary.totalCount > 0 ? 1 : 0}
            style={{ color: summary.totalCount > 0 ? '#BA1A1A' : '#56423D' }}
          />
        </span>

        {/* Badge số lượng thông báo */}
        {summary.totalCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            minWidth: '20px',
            height: '20px',
            padding: '0 5px',
            borderRadius: '9999px',
            background: '#BA1A1A',
            color: '#FFFFFF',
            fontSize: '0.72rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #FFFFFF',
            boxShadow: '0 2px 6px rgba(186, 26, 26, 0.4)'
          }}>
            {summary.totalCount > 99 ? '99+' : summary.totalCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          width: '430px',
          maxWidth: '92vw',
          background: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 20px 48px rgba(31, 27, 26, 0.22)',
          border: '1px solid #EAE0DE',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease'
        }}>
          {/* Popover Header */}
          <div style={{
            padding: '16px 20px',
            background: '#FFF8F6',
            borderBottom: '1px solid #F0E6E4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: summary.totalCount > 0 ? '#FFDAD6' : '#F0E6E4',
                color: summary.totalCount > 0 ? '#BA1A1A' : '#56423D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon name="notifications" size={18} fill={1} />
              </div>
              <div>
                <h3 style={{
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: '#1F1B1A',
                  margin: 0
                }}>
                  Thông Báo Quản Trị
                </h3>
                <div style={{ fontSize: '0.74rem', color: '#89726B', marginTop: '2px' }}>
                  {summary.totalCount > 0
                    ? `${summary.totalCount} yêu cầu đang chờ xử lý`
                    : 'Không có yêu cầu mới'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Nút test chuông */}
              <button
                type="button"
                onClick={handleTestCall}
                title="Tạo chuông thử nghiệm để kiểm tra tính năng"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 9px',
                  borderRadius: '8px',
                  border: '1px solid #EAE0DE',
                  background: '#FFFFFF',
                  color: '#9D4124',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Icon name="bolt" size={14} />
                <span>Test Chuông</span>
              </button>

              {/* Nút làm mới */}
              <button
                type="button"
                onClick={() => fetchNotifications(true)}
                title="Làm mới danh sách"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  border: '1px solid #EAE0DE',
                  background: '#FFFFFF',
                  color: '#56423D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Icon name="refresh" size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{
            display: 'flex',
            padding: '8px 14px',
            background: '#FAF7F5',
            borderBottom: '1px solid #F0E6E4',
            gap: '6px'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              style={{
                flex: 1,
                padding: '7px 8px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'ALL' ? '#9D4124' : 'transparent',
                color: activeTab === 'ALL' ? '#FFFFFF' : '#56423D',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
            >
              <span>Tất Cả</span>
              <span style={{
                background: activeTab === 'ALL' ? 'rgba(255,255,255,0.25)' : '#EAE0DE',
                padding: '1px 6px',
                borderRadius: '9999px',
                fontSize: '0.7rem'
              }}>
                {summary.totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ASSISTANCE')}
              style={{
                flex: 1,
                padding: '7px 8px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'ASSISTANCE' ? '#BA1A1A' : 'transparent',
                color: activeTab === 'ASSISTANCE' ? '#FFFFFF' : '#BA1A1A',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
            >
              <span>Cần Hỗ Trợ</span>
              <span style={{
                background: activeTab === 'ASSISTANCE' ? 'rgba(255,255,255,0.25)' : '#FFDAD6',
                padding: '1px 6px',
                borderRadius: '9999px',
                fontSize: '0.7rem'
              }}>
                {summary.assistanceCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('RESERVATION')}
              style={{
                flex: 1,
                padding: '7px 8px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'RESERVATION' ? '#596232' : 'transparent',
                color: activeTab === 'RESERVATION' ? '#FFFFFF' : '#596232',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
            >
              <span>Bàn Đặt Mới</span>
              <span style={{
                background: activeTab === 'RESERVATION' ? 'rgba(255,255,255,0.25)' : '#ECFDF5',
                padding: '1px 6px',
                borderRadius: '9999px',
                fontSize: '0.7rem'
              }}>
                {summary.reservationCount}
              </span>
            </button>
          </div>

          {/* List Notification Items */}
          <div style={{
            maxHeight: '380px',
            overflowY: 'auto',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {displayItems.length === 0 ? (
              <div style={{
                padding: '36px 20px',
                textAlign: 'center',
                color: '#89726B'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#F6ECEA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  color: '#047857'
                }}>
                  <Icon name="check_circle" size={26} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1F1B1A' }}>
                  Không có thông báo mới!
                </div>
                <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                  Tất cả các bàn ăn và đơn đặt bàn hiện tại đang được phục vụ chu đáo.
                </div>
              </div>
            ) : (
              displayItems.map((item) => {
                const isAssistance = item.notificationType === 'TABLE_ASSISTANCE';
                const isItemLoading = actionLoadingId === item.id;

                return (
                  <div
                    key={item.id}
                    style={{
                      background: isAssistance ? '#FFFBFB' : '#FAF8F5',
                      border: isAssistance ? '1.5px solid #FFDAD6' : '1.5px solid #F0E6E4',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Header item: Badge type & Time */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        background: isAssistance ? '#FFDAD6' : '#EFF5D3',
                        color: isAssistance ? '#BA1A1A' : '#596232'
                      }}>
                        <Icon name={isAssistance ? 'room_service' : 'event_seat'} size={13} />
                        <span>{isAssistance ? 'BÀN GỌI HỖ TRỢ' : 'ĐƠN ĐẶT BÀN MỚI'}</span>
                      </span>

                      <span style={{ fontSize: '0.72rem', color: '#89726B' }}>
                        {item.timeAgo}
                      </span>
                    </div>

                    {/* Title */}
                    <div style={{
                      fontFamily: "'Epilogue', sans-serif",
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      color: isAssistance ? '#991B1B' : '#1F1B1A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span>{item.title}</span>
                      {isAssistance && (
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#56423D',
                          background: '#FFFFFF',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid #EAE0DE'
                        }}>
                          {item.zoneName || 'Khu vực chung'}
                        </span>
                      )}
                    </div>

                    {/* Message content */}
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#56423D',
                      lineHeight: 1.45,
                      background: '#FFFFFF',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #F0E6E4'
                    }}>
                      {item.message}
                    </div>

                    {/* Actions */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '8px',
                      marginTop: '4px'
                    }}>
                      {isAssistance ? (
                        <>
                          <button
                            type="button"
                            onClick={handleGoToTables}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: '8px',
                              border: '1px solid #EAE0DE',
                              background: '#FFFFFF',
                              color: '#56423D',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            <Icon name="map" size={14} />
                            <span>Sơ Đồ Bàn</span>
                          </button>

                          <button
                            type="button"
                            disabled={isItemLoading}
                            onClick={(e) => handleResolveAssistance(item, e)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#047857',
                              color: '#FFFFFF',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              cursor: isItemLoading ? 'not-allowed' : 'pointer',
                              opacity: isItemLoading ? 0.6 : 1
                            }}
                          >
                            <Icon name="check" size={14} />
                            <span>{isItemLoading ? 'Đang Xử Lý...' : 'Đã Xử Lý'}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={handleGoToReservation}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#9D4124',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(157, 65, 36, 0.2)'
                          }}
                        >
                          <Icon name="event_seat" size={15} />
                          <span>Duyệt & Xếp Bàn</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Popover Footer */}
          <div style={{
            padding: '12px 18px',
            background: '#FAF7F5',
            borderTop: '1px solid #F0E6E4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <button
              type="button"
              onClick={handleGoToTables}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: '#9D4124',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <span>Xem Toàn Bộ Sơ Đồ Bàn & Đặt Bàn</span>
              <Icon name="arrow_forward" size={16} />
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#89726B',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
