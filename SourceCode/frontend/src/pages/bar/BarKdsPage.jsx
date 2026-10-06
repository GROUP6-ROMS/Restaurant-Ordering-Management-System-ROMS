import React, { useState, useEffect } from 'react';
import Icon from '../../components/common/Icon';

const INITIAL_BAR_TICKETS = [
  {
    id: 1,
    orderCode: '#BAR-101',
    table: 'Bàn T-03',
    timeReceived: '19:35',
    elapsedMinutes: 4,
    status: 'IN_PREP', // QUEUED, IN_PREP, READY, SERVED
    items: [
      { id: 'b1', name: 'Cocktail Signature Hoàng Gia', qty: 2, note: 'Ít ngọt, trang trí thêm lá bạc hà tươi', size: 'Ly Cao', status: 'IN_PREP' },
      { id: 'b2', name: 'Nước Ép Bưởi Hồng Ép Lạnh', qty: 1, note: 'Không đường, không đá', size: 'Tiêu Chuẩn', status: 'READY' }
    ]
  },
  {
    id: 2,
    orderCode: '#BAR-102',
    table: 'Phòng VIP-01',
    timeReceived: '19:38',
    elapsedMinutes: 2,
    status: 'QUEUED',
    items: [
      { id: 'b3', name: 'Rượu Vang Đỏ Bordeaux 2018', qty: 1, note: 'Ướp xô đá sẵn, chuẩn bị 4 ly vang Bordeaux', size: 'Chai 750ml', status: 'QUEUED' },
      { id: 'b4', name: 'Cocktail Old Fashioned Cổ Điển', qty: 2, note: 'Đá viên vuông to (Big Cube Ice), khói quế', size: 'Ly Rock', status: 'QUEUED' }
    ]
  },
  {
    id: 3,
    orderCode: '#BAR-103',
    table: 'Bàn B-01 (Ban Công)',
    timeReceived: '19:28',
    elapsedMinutes: 11,
    status: 'READY',
    items: [
      { id: 'b5', name: 'Trà Đào Cam Sả Thảo Mộc', qty: 2, note: 'Nhiều sả, đá riêng', size: 'Ly Lớn', status: 'READY' },
      { id: 'b6', name: 'Bia Tươi Thủ Công Pasteur Street', qty: 3, note: 'Bảo quản lạnh 4 độ C', size: 'Cốc 500ml', status: 'READY' }
    ]
  },
  {
    id: 4,
    orderCode: '#BAR-104',
    table: 'Bàn T-08',
    timeReceived: '19:40',
    elapsedMinutes: 1,
    status: 'QUEUED',
    items: [
      { id: 'b7', name: 'Mocktail Chanh Dây Nhiệt Đới', qty: 2, note: 'Trang trí hạt chia', size: 'Tiêu Chuẩn', status: 'QUEUED' }
    ]
  }
];

export default function BarKdsPage() {
  const [tickets, setTickets] = useState(INITIAL_BAR_TICKETS);
  const [filter, setFilter] = useState('ALL'); // ALL, QUEUED, IN_PREP, READY
  const [toastMessage, setToastMessage] = useState(null);
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

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Move ticket status
  const handleStartPrep = (ticketId) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'IN_PREP',
          items: t.items.map(i => ({ ...i, status: 'IN_PREP' }))
        };
      }
      return t;
    }));
    showToast('Đang tiến hành pha chế!');
  };

  const handleCompletePrep = (ticketId) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'READY',
          items: t.items.map(i => ({ ...i, status: 'READY' }))
        };
      }
      return t;
    }));
    showToast('Đồ uống đã pha xong! Đã rung chuông gọi phục vụ ra quầy Bar!');
  };

  const handleFinishServing = (ticketId) => {
    setTickets(prev => prev.filter(t => t.id !== ticketId));
    showToast('Đã chuyển đồ uống cho phục vụ mang đến bàn!');
  };

  const filteredTickets = tickets.filter(t => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  const queuedCount = tickets.filter(t => t.status === 'QUEUED').length;
  const inPrepCount = tickets.filter(t => t.status === 'IN_PREP').length;
  const readyCount = tickets.filter(t => t.status === 'READY').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: '#1F1B1A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          fontSize: '0.9rem',
          borderLeft: '4px solid #9D4124'
        }}>
          <Icon name="local_bar" size={20} style={{ color: '#E8C3BA' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Bar KDS Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9D4124', background: '#FFDBC9', padding: '2px 8px', borderRadius: '6px' }}>
              BAR STATION KDS
            </span>
            <span style={{ fontSize: '0.85rem', color: '#89726B', fontWeight: 600 }}>Quầy Pha Chế & Đồ Uống</span>
          </div>
          <h1 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.65rem', color: '#1F1B1A', margin: '4px 0 0' }}>
            Màn Hình Pha Chế Quầy Bar (Bartender KDS)
          </h1>
        </div>

        {/* Filter Badges */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: 'none',
              background: filter === 'ALL' ? '#9D4124' : '#FFFFFF',
              color: filter === 'ALL' ? '#FFFFFF' : '#56423D',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Tất Cả ({tickets.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter('QUEUED')}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: 'none',
              background: filter === 'QUEUED' ? '#9D4124' : '#FFFFFF',
              color: filter === 'QUEUED' ? '#FFFFFF' : '#BA1A1A',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#BA1A1A' }} />
            Chờ Pha ({queuedCount})
          </button>

          <button
            type="button"
            onClick={() => setFilter('IN_PREP')}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: 'none',
              background: filter === 'IN_PREP' ? '#9D4124' : '#FFFFFF',
              color: filter === 'IN_PREP' ? '#FFFFFF' : '#D97706',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D97706' }} />
            Đang Pha ({inPrepCount})
          </button>

          <button
            type="button"
            onClick={() => setFilter('READY')}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: 'none',
              background: filter === 'READY' ? '#9D4124' : '#FFFFFF',
              color: filter === 'READY' ? '#FFFFFF' : '#059669',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
            Chờ Bưng Ra Bàn ({readyCount})
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thu nhỏ / Thoát toàn màn hình' : 'Mở toàn màn hình quầy Bar'}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: isFullscreen ? '1px solid #9D4124' : '1px solid #EAE0DE',
              background: isFullscreen ? '#9D4124' : '#FFFFFF',
              color: isFullscreen ? '#FFFFFF' : '#56423D',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name={isFullscreen ? "fullscreen_exit" : "fullscreen"} size={16} />
            <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>
        </div>
      </div>

      {/* Bar Order Tickets Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '18px',
        alignItems: 'stretch'
      }}>
        {filteredTickets.map(ticket => {
          const isLate = ticket.elapsedMinutes >= 10;
          let borderTheme = '#F0E6E4';
          let headerBg = '#FFF8F6';
          let statusText = 'Đang chờ pha chế';
          let statusColor = '#BA1A1A';

          if (ticket.status === 'IN_PREP') {
            borderTheme = '#FED7AA';
            headerBg = '#FFFBEB';
            statusText = 'Đang pha chế';
            statusColor = '#D97706';
          } else if (ticket.status === 'READY') {
            borderTheme = '#BBF7D0';
            headerBg = '#F0FDF4';
            statusText = 'Đã xong - Chờ phục vụ lấy';
            statusColor = '#059669';
          }

          return (
            <div
              key={ticket.id}
              style={{
                background: '#FFFFFF',
                borderRadius: '18px',
                border: `2px solid ${borderTheme}`,
                boxShadow: isLate ? '0 4px 20px rgba(186, 26, 26, 0.15)' : '0 2px 10px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden'
              }}
            >
              {/* Ticket Header */}
              <div style={{
                background: headerBg,
                padding: '14px 18px',
                borderBottom: `1px solid ${borderTheme}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.25rem', color: '#1F1B1A' }}>
                    {ticket.table}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: '#89726B', marginTop: '2px' }}>
                    {ticket.orderCode} • Nhận lúc {ticket.timeReceived}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: isLate ? '#BA1A1A' : '#56423D',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Icon name="timer" size={16} />
                    {ticket.elapsedMinutes} phút
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: statusColor }}>
                    {statusText}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {ticket.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: '#9D4124',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {item.qty}
                    </span>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1F1B1A' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#89726B' }}>
                        Quy cách: {item.size}
                      </div>
                      {item.note && (
                        <div style={{
                          background: '#FFF8F6',
                          color: '#BA1A1A',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          marginTop: '4px',
                          display: 'inline-block'
                        }}>
                          Ghi chú: {item.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons Footer */}
              <div style={{ padding: '14px 18px', borderTop: '1px solid #F0E6E4', background: '#FAFAFA' }}>
                {ticket.status === 'QUEUED' && (
                  <button
                    type="button"
                    onClick={() => handleStartPrep(ticket.id)}
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: '12px',
                      background: '#9D4124',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Icon name="blender" size={18} />
                    Bắt Đầu Pha Chế
                  </button>
                )}

                {ticket.status === 'IN_PREP' && (
                  <button
                    type="button"
                    onClick={() => handleCompletePrep(ticket.id)}
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: '12px',
                      background: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Icon name="check_circle" size={18} />
                    Pha Xong (Báo Phục Vụ Lấy Đồ)
                  </button>
                )}

                {ticket.status === 'READY' && (
                  <button
                    type="button"
                    onClick={() => handleFinishServing(ticket.id)}
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: '12px',
                      background: '#56423D',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Icon name="done_all" size={18} />
                    Đã Bàn Giao Xong Ra Bàn
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
