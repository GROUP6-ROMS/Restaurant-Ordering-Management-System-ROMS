import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MOCK_TABLES, MOCK_MENU_ITEMS } from '../../mock/mockData';

// Material Symbols Icon helper
function Icon({ name, size = 20, fill = 0, style = {} }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: `${size}px`,
        fontVariationSettings: `'FILL' ${fill}, 'wght' 500, 'GRAD' 0, 'opsz' 24`,
        verticalAlign: 'middle',
        lineHeight: 1,
        ...style
      }}
    >
      {name}
    </span>
  );
}

// Initial rich tables matching Stitch Waiter terminal
const INITIAL_TABLES = [
  {
    id: 1,
    tableNumber: "01",
    label: "Bàn 01",
    zone: "Tầng 1",
    seats: 4,
    status: "AVAILABLE",
    statusNote: "Vừa hoàn tất setup & sát khuẩn bàn ăn.",
    duration: null,
    orderTotal: 0,
    items: [],
    calling: false
  },
  {
    id: 2,
    tableNumber: "02",
    label: "Bàn 02",
    zone: "Tầng 1",
    seats: 4,
    status: "OCCUPIED",
    statusNote: "Đang ăn & chờ món phở áp chảo",
    duration: "45 phút",
    orderTotal: 540000,
    items: [
      { name: "Phở Áp Chảo Bò Giòn", qty: 2, status: "COOKING", note: "Bếp đang nấu KDS ~4m" },
      { name: "Gỏi Cuốn Tôm Thịt", qty: 2, status: "SERVED", note: "Đã ra bàn" },
      { name: "Trà Đào Cam Sả", qty: 2, status: "SERVED", note: "Đã ra bàn" }
    ],
    calling: false
  },
  {
    id: 4,
    tableNumber: "04",
    label: "Bàn 04",
    zone: "Tầng 1",
    seats: 6,
    status: "CALLING",
    statusNote: "Yêu cầu thêm đá lạnh & đũa muỗng",
    duration: "32 phút",
    orderTotal: 685000,
    items: [
      { name: "Bò Né Chảo Gang ROMS", qty: 2, status: "SERVED", note: "Bánh mì giòn • Trứng lòng đào" },
      { name: "Cơm Chiên Hải Sản Hoàng Kim", qty: 1, status: "COOKING", note: "Bếp đang nấu • KDS còn 3m" },
      { name: "Trà Ô Long TEA+ Chai 455ml", qty: 2, status: "SERVED", note: "Ướp lạnh" },
      { name: "Bia Tiger Crystal Lon 330ml", qty: 1, status: "WAITER_PENDING", note: "Waiter lấy từ tủ mát" }
    ],
    calling: true,
    callTime: "1m 40s trước"
  },
  {
    id: 5,
    tableNumber: "05",
    label: "Bàn 05",
    zone: "Tầng 1",
    seats: 4,
    status: "AWAITING_PAYMENT",
    statusNote: "Đã in tạm tính - Chờ khách quẹt thẻ POS",
    duration: "1 giờ 10m",
    orderTotal: 1280000,
    items: [
      { name: "Bò Bít Tết Sốt Tiêu Đen ROMS", qty: 2, status: "SERVED", note: "Chín vừa" },
      { name: "Rượu Vang Đỏ Chai", qty: 1, status: "SERVED", note: "Đã dùng" }
    ],
    calling: false
  },
  {
    id: 7,
    tableNumber: "07",
    label: "Bàn 07",
    zone: "Tầng 1",
    seats: 2,
    status: "CALLING",
    statusNote: "Khách gọi thanh toán & đóng gói mang về",
    duration: "52 phút",
    orderTotal: 320000,
    items: [
      { name: "Nem Rán Hải Sản", qty: 2, status: "SERVED", note: "Đã xong" },
      { name: "Nước Ép Dưa Hấu Bạc Hà", qty: 2, status: "SERVED", note: "Đã xong" }
    ],
    calling: true,
    callTime: "2m 15s trước"
  },
  {
    id: 8,
    tableNumber: "08",
    label: "Bàn 08",
    zone: "Tầng 1",
    seats: 4,
    status: "RESERVED",
    statusNote: "Giờ đặt: 12:30 • Tiệc sinh nhật 4 người - Khách: Anh Hoàng",
    duration: "Đến trong 15p",
    orderTotal: 0,
    items: [],
    calling: false,
    reservationInfo: "Anh Hoàng (0901xxx) • Tiệc 4 người"
  },
  {
    id: 9,
    tableNumber: "09",
    label: "Bàn 09",
    zone: "Tầng 1",
    seats: 4,
    status: "FOOD_READY",
    statusNote: "Quầy Pass có món nóng chờ bưng ra bàn!",
    duration: "28 phút",
    orderTotal: 490000,
    items: [
      { name: "Phở Tái Lăn Hà Nội", qty: 1, status: "READY", note: "Quầy Pass sẵn sàng" },
      { name: "Cà Phê Muối ROMS", qty: 1, status: "READY", note: "Quầy Pass sẵn sàng" }
    ],
    calling: false
  },
  {
    id: 10,
    tableNumber: "10",
    label: "Bàn 10",
    zone: "Tầng 1",
    seats: 8,
    status: "OCCUPIED",
    statusNote: "Khách đặt: Chị Thảo • 6 khách • Phục vụ món chính lượt 2",
    duration: "1 giờ 35m",
    orderTotal: 2890000,
    items: [
      { name: "Sườn Nướng BBQ Tảng", qty: 2, status: "SERVED", note: "Đã lên bàn" },
      { name: "Bò Wagyu Nướng Tảng", qty: 1, status: "SERVED", note: "Đã lên bàn" },
      { name: "Mì Ý Tôm Hùm", qty: 2, status: "COOKING", note: "KDS đang hoàn tất" }
    ],
    calling: false
  },
  {
    id: 12,
    tableNumber: "12",
    label: "Bàn 12",
    zone: "Tầng 1",
    seats: 4,
    status: "DIRTY",
    statusNote: "Khách thanh toán rời đi 10 phút trước. Cần thu dọn đĩa & set ly.",
    duration: "10m trước",
    orderTotal: 0,
    items: [],
    calling: false
  }
];

export default function WaiterFloorPlanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedZone, setSelectedZone] = useState('Tầng 1 (Sảnh Chính)');
  const [selectedTable, setSelectedTable] = useState(INITIAL_TABLES[2]); // Default Bàn 04
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 1024);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const urlFilter = searchParams.get('filter');
    if (urlFilter) {
      setActiveFilter(urlFilter);
    }
  }, [searchParams]);

  // Modals
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Filter
  const filteredTables = tables.filter(t => {
    const matchSearch = t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.statusNote && t.statusNote.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchSearch) return false;

    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'OCCUPIED') return t.status === 'OCCUPIED' || t.status === 'AWAITING_PAYMENT' || t.status === 'FOOD_READY';
    if (activeFilter === 'AVAILABLE') return t.status === 'AVAILABLE';
    if (activeFilter === 'CALLING') return t.status === 'CALLING' || t.calling;
    if (activeFilter === 'DIRTY') return t.status === 'DIRTY';
    if (activeFilter === 'RESERVED') return t.status === 'RESERVED';
    return true;
  });

  // Actions
  const handleSelectTable = (table) => {
    setSelectedTable(table);
    if (isMobile) {
      setShowMobileDrawer(true);
    }
  };

  const handleResolveCall = (tableId) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return { ...t, status: 'OCCUPIED', calling: false };
      }
      return t;
    }));
    if (selectedTable && selectedTable.id === tableId) {
      setSelectedTable(prev => ({ ...prev, status: 'OCCUPIED', calling: false }));
    }
    showToast(`Đã xử lý xong yêu cầu hỗ trợ của Bàn ${selectedTable.tableNumber}!`);
  };

  const handleOpenTable = (tableId) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status: 'OCCUPIED',
          duration: '0 phút',
          statusNote: 'Khách vừa vào bàn',
          orderTotal: 0,
          items: []
        };
      }
      return t;
    }));
    showToast(`Đã mở phiên phục vụ cho Bàn ${selectedTable?.tableNumber || tableId}!`);
  };

  const handleCleanTable = (tableId) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status: 'AVAILABLE',
          statusNote: 'Bàn vừa dọn sạch sẽ, sẵn sàng đón khách',
          orderTotal: 0,
          items: []
        };
      }
      return t;
    }));
    if (selectedTable && selectedTable.id === tableId) {
      setSelectedTable(prev => ({ ...prev, status: 'AVAILABLE', statusNote: 'Bàn vừa dọn sạch sẽ, sẵn sàng đón khách' }));
    }
    showToast(`Bàn đã dọn xong và chuyển sang trạng thái Sẵn Sàng!`);
  };

  const handleConfirmDeliverFood = (tableId) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status: 'OCCUPIED',
          items: t.items.map(item => ({ ...item, status: 'SERVED', note: 'Đã lên bàn' }))
        };
      }
      return t;
    }));
    if (selectedTable && selectedTable.id === tableId) {
      setSelectedTable(prev => ({
        ...prev,
        status: 'OCCUPIED',
        items: prev.items.map(item => ({ ...item, status: 'SERVED', note: 'Đã lên bàn' }))
      }));
    }
    showToast(`Đã xác nhận bưng món xong cho Bàn ${selectedTable.tableNumber}!`);
  };

  const handleExecuteTransfer = () => {
    if (!transferTargetId) {
      showToast('Vui lòng chọn bàn muốn chuyển đến!');
      return;
    }
    const targetTable = tables.find(t => t.id === parseInt(transferTargetId));
    if (!targetTable) return;

    setTables(prev => prev.map(t => {
      if (t.id === selectedTable.id) {
        return { ...t, status: 'DIRTY', statusNote: 'Khách vừa chuyển sang bàn khác', items: [], orderTotal: 0, calling: false };
      }
      if (t.id === targetTable.id) {
        return {
          ...t,
          status: selectedTable.status === 'CALLING' ? 'OCCUPIED' : selectedTable.status,
          duration: selectedTable.duration,
          orderTotal: selectedTable.orderTotal,
          items: selectedTable.items,
          statusNote: `Chuyển từ Bàn ${selectedTable.tableNumber}`
        };
      }
      return t;
    }));

    setShowTransferModal(false);
    showToast(`Đã chuyển toàn bộ hóa đơn từ Bàn ${selectedTable.tableNumber} sang Bàn ${targetTable.tableNumber}!`);
  };

  const handleQuickAddDish = (dish) => {
    if (!selectedTable) return;
    const newItem = {
      name: dish.name,
      qty: 1,
      status: 'COOKING',
      note: 'Bếp KDS đang nấu'
    };
    setTables(prev => prev.map(t => {
      if (t.id === selectedTable.id) {
        return {
          ...t,
          orderTotal: t.orderTotal + dish.price,
          items: [...t.items, newItem]
        };
      }
      return t;
    }));
    setSelectedTable(prev => ({
      ...prev,
      orderTotal: prev.orderTotal + dish.price,
      items: [...prev.items, newItem]
    }));
    showToast(`Đã gửi [${dish.name}] vào bếp cho Bàn ${selectedTable.tableNumber}!`);
  };

  const getStatusBadge = (t) => {
    if (t.status === 'CALLING' || t.calling) {
      return (
        <span style={{
          background: '#9D4124',
          color: '#FFF',
          padding: '3px 8px',
          borderRadius: '9999px',
          fontWeight: 700,
          fontSize: '0.72rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          animation: 'pulse 1.5s infinite'
        }}>
          <Icon name="campaign" size={14} /> CẦN PHỤC VỤ
        </span>
      );
    }
    if (t.status === 'FOOD_READY') {
      return (
        <span style={{
          background: '#596232',
          color: '#FFF',
          padding: '3px 8px',
          borderRadius: '9999px',
          fontWeight: 700,
          fontSize: '0.72rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Icon name="soup_kitchen" size={14} /> BẾP XONG MÓN
        </span>
      );
    }
    if (t.status === 'AWAITING_PAYMENT') {
      return (
        <span style={{
          background: '#FFDBC9',
          color: '#753400',
          border: '1px solid #FFB68C',
          padding: '3px 8px',
          borderRadius: '9999px',
          fontWeight: 700,
          fontSize: '0.72rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Icon name="receipt" size={14} /> CHỜ TÍNH TIỀN
        </span>
      );
    }
    if (t.status === 'AVAILABLE') {
      return (
        <span style={{
          background: '#ECFDF5',
          color: '#065F46',
          border: '1px solid #A7F3D0',
          padding: '3px 8px',
          borderRadius: '9999px',
          fontWeight: 700,
          fontSize: '0.72rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} />
          SẴN SÀNG
        </span>
      );
    }
    if (t.status === 'DIRTY') {
      return (
        <span style={{
          background: '#EAE0DE',
          color: '#56423D',
          padding: '3px 8px',
          borderRadius: '9999px',
          fontWeight: 700,
          fontSize: '0.72rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Icon name="cleaning_services" size={14} /> CHỜ DỌN BÀN
        </span>
      );
    }
    if (t.status === 'RESERVED') {
      return (
        <span style={{
          background: '#FEF3C7',
          color: '#78350F',
          border: '1px solid #FDE68A',
          padding: '3px 8px',
          borderRadius: '9999px',
          fontWeight: 700,
          fontSize: '0.72rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Icon name="bookmark" size={14} /> ĐÃ ĐẶT
        </span>
      );
    }
    return (
      <span style={{
        background: '#FFFBEB',
        color: '#92400E',
        border: '1px solid #FDE68A',
        padding: '3px 8px',
        borderRadius: '9999px',
        fontWeight: 700,
        fontSize: '0.72rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <Icon name="schedule" size={14} /> {t.duration || 'Đang ăn'}
      </span>
    );
  };

  const getBorderColor = (t) => {
    if (t.status === 'CALLING' || t.calling) return '#9D4124';
    if (t.status === 'FOOD_READY') return '#596232';
    if (t.status === 'AWAITING_PAYMENT') return '#994703';
    if (t.status === 'AVAILABLE') return '#059669';
    if (t.status === 'DIRTY') return '#89726B';
    if (t.status === 'RESERVED') return '#D97706';
    return '#9D4124';
  };

  const renderTableDrawer = (table, isBottomSheet = false) => {
    if (!table) return null;
    return (
      <div style={{
        background: '#FFFFFF',
        borderRadius: isBottomSheet ? '0' : '20px',
        padding: isBottomSheet ? '0' : '20px',
        boxShadow: isBottomSheet ? 'none' : '0 4px 20px rgba(0,0,0,0.06)',
        border: isBottomSheet ? 'none' : '1px solid #F0E6E4'
      }}>
        {/* Drawer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: isBottomSheet ? '1.25rem' : '1.4rem', color: '#9D4124', margin: 0 }}>
                {table.label}
              </h3>
              {getStatusBadge(table)}
            </div>
            <span style={{ fontSize: '0.8rem', color: '#89726B', marginTop: '2px', display: 'block' }}>
              {table.zone} • {table.seats} chỗ
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: '#89726B', display: 'block' }}>Giờ vào</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A' }}>
                {table.duration ? `${table.duration} trước` : 'Chưa có'}
              </span>
            </div>
            {isBottomSheet && (
              <button
                type="button"
                onClick={() => setShowMobileDrawer(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid #EAE0DE',
                  background: '#FFF8F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#56423D'
                }}
              >
                <Icon name="close" size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Service Call Banner if active */}
        {table.calling && (
          <div style={{
            background: '#FFF8F6',
            border: '1px solid #FFCDD2',
            padding: '12px 14px',
            borderRadius: '14px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#BA1A1A', fontWeight: 800, fontSize: '0.82rem' }}>
                <Icon name="priority_high" size={18} />
                YÊU CẦU CẦN HỖ TRỢ KHẨN
              </div>
              <span style={{ fontSize: '0.72rem', color: '#89726B' }}>{table.callTime}</span>
            </div>
            <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: '#1F1B1A' }}>
              {table.statusNote}
            </p>
            <button
              type="button"
              onClick={() => handleResolveCall(table.id)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '10px',
                background: '#9D4124',
                color: '#FFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Icon name="done_all" size={18} /> Đã Xử Lý Xong Yêu Cầu
            </button>
          </div>
        )}

        {/* Real-time Order Ticket Summary */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1F1B1A' }}>
              Món của {table.label}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#89726B' }}>
              {table.items.length} món
            </span>
          </div>

          {table.items.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#89726B', fontSize: '0.82rem', background: '#FCF1EF', borderRadius: '12px' }}>
              Bàn chưa có món ăn nào được gọi
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: isBottomSheet ? '200px' : '220px', overflowY: 'auto' }}>
              {table.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#FFF8F6',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    border: '1px solid #F6ECEA'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: '#F0E6E4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#9D4124',
                      flexShrink: 0
                    }}>
                      {item.qty}x
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#89726B' }}>
                        {item.note}
                      </div>
                    </div>
                  </div>

                  {item.status === 'SERVED' && (
                    <span style={{ color: '#596232', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                      <Icon name="check_circle" size={14} /> Đã ra
                    </span>
                  )}
                  {item.status === 'COOKING' && (
                    <span style={{ color: '#994703', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                      <Icon name="microwave" size={14} /> Bếp nấu
                    </span>
                  )}
                  {item.status === 'READY' && (
                    <span style={{ color: '#596232', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                      <Icon name="soup_kitchen" size={14} /> Quầy Pass
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Subtotal */}
          {table.orderTotal > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F6ECEA',
              padding: '10px 14px',
              borderRadius: '12px',
              marginTop: '10px'
            }}>
              <span style={{ fontSize: '0.82rem', color: '#56423D', fontWeight: 600 }}>Tạm tính hóa đơn:</span>
              <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#9D4124' }}>
                {table.orderTotal.toLocaleString('vi-VN')}₫
              </span>
            </div>
          )}
        </div>

        {/* Fast Action Buttons Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#89726B' }}>
            Tác vụ phục vụ nhanh
          </span>

          <button
            type="button"
            onClick={() => {
              if (isBottomSheet) setShowMobileDrawer(false);
              navigate(`/waiter/order?table=${encodeURIComponent(table.label)}`);
            }}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '12px',
              background: '#9D4124',
              color: '#FFF',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(157, 65, 36, 0.25)'
            }}
          >
            <Icon name="restaurant_menu" size={18} /> Gọi Thêm Món
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                if (isBottomSheet) setShowMobileDrawer(false);
                setShowTransferModal(true);
              }}
              style={{
                padding: '10px',
                borderRadius: '12px',
                background: '#FFF8F6',
                border: '1px solid #F0E6E4',
                color: '#1F1B1A',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Icon name="swap_horiz" size={18} style={{ color: '#9D4124' }} />
              Chuyển Bàn
            </button>

            <button
              type="button"
              onClick={() => showToast(`Đã báo quầy Thu Ngân chuẩn bị thanh toán cho ${table.label}!`)}
              style={{
                padding: '10px',
                borderRadius: '12px',
                background: '#FFDBC9',
                border: '1px solid #FFB68C',
                color: '#753400',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Icon name="point_of_sale" size={18} style={{ color: '#994703' }} />
              Báo Thu Ngân
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isBottomSheet) setShowMobileDrawer(false);
              setShowQrModal(true);
            }}
            style={{
              padding: '8px',
              borderRadius: '10px',
              background: '#FCF1EF',
              border: '1px solid #EAE0DE',
              color: '#56423D',
              fontWeight: 600,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Icon name="qr_code_2" size={18} style={{ color: '#9D4124' }} />
            Mã QR Đặt Món {table.label}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: 'calc(100vh - 120px)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '72px',
          right: '24px',
          zIndex: 9999,
          background: '#1F1B1A',
          color: '#FFF8F6',
          padding: '12px 18px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          animation: 'slideDown 0.25s ease-out'
        }}>
          <Icon name="check_circle" size={20} fill={1} style={{ color: '#FFB68C' }} />
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{toastMessage}</span>
        </div>
      )}

      {/* 1. Operational Header & Floor Selector Bar (theo SCR-05) */}
      <div style={{
        background: '#FCF1EF',
        padding: isMobile ? '8px 12px' : '14px 20px',
        borderBottom: '1px solid #EAE0DE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: isMobile ? 1 : 'none', minWidth: isMobile ? '160px' : 'auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#FFFFFF',
            padding: '6px 10px',
            borderRadius: '12px',
            border: '1px solid #EAE0DE',
            width: isMobile ? '100%' : 'auto'
          }}>
            <Icon name="storefront" size={18} style={{ color: '#9D4124', flexShrink: 0 }} />
            <select
              value={selectedZone}
              onChange={(e) => {
                setSelectedZone(e.target.value);
                showToast(`Chuyển khu vực: ${e.target.value}`);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 700,
                fontSize: isMobile ? '0.82rem' : '0.88rem',
                color: '#1F1B1A',
                outline: 'none',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              <option value="Tầng 1 (Sảnh Chính)">Tầng 1 (Sảnh Chính - 14 Bàn)</option>
              <option value="Sân Vườn Terrace">Sân Vườn Terrace (8 Bàn)</option>
              <option value="Phòng VIP Tầng 2">Phòng VIP Tầng 2 (4 Phòng)</option>
            </select>
          </div>

          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#56423D' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#596232', display: 'inline-block' }} />
              <span>KDS Sync: Real-time 1.2s</span>
            </div>
          )}
        </div>

        {/* FOH Key Performance Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#FFFFFF',
            padding: isMobile ? '5px 10px' : '6px 14px',
            borderRadius: '12px',
            border: '1px solid #EAE0DE'
          }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#FFDBC9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#994703' }}>
              <Icon name="restaurant" size={16} />
            </div>
            <div style={{ lineHeight: 1.1 }}>
              {!isMobile && <div style={{ fontSize: '0.72rem', color: '#89726B' }}>Bếp đang lên món</div>}
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.88rem', color: '#994703' }}>
                12 <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#56423D' }}>món</span>
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveFilter('CALLING')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFDAD6',
              color: '#93000A',
              padding: isMobile ? '5px 10px' : '6px 14px',
              borderRadius: '12px',
              border: '1px solid #FFB4AB',
              cursor: 'pointer'
            }}
          >
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#BA1A1A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="notifications_active" size={16} />
            </div>
            <div style={{ lineHeight: 1.1 }}>
              {!isMobile && <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>Chuông gọi</div>}
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.88rem' }}>
                2 <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>gọi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Operational Filter Bar */}
      <div style={{
        background: '#FFFFFF',
        padding: isMobile ? '8px 12px' : '10px 20px',
        borderBottom: '1px solid #EAE0DE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { id: 'ALL', label: 'Tất cả bàn', count: tables.length, color: '#9D4124' },
            { id: 'OCCUPIED', label: 'Đang phục vụ', count: tables.filter(t => t.status === 'OCCUPIED' || t.status === 'FOOD_READY' || t.status === 'AWAITING_PAYMENT').length, color: '#994703' },
            { id: 'AVAILABLE', label: 'Bàn trống', count: tables.filter(t => t.status === 'AVAILABLE').length, color: '#059669' },
            { id: 'CALLING', label: 'Cần hỗ trợ', count: tables.filter(t => t.calling).length, color: '#BA1A1A' },
            { id: 'DIRTY', label: 'Chờ dọn bàn', count: tables.filter(t => t.status === 'DIRTY').length, color: '#89726B' },
            { id: 'RESERVED', label: 'Đã đặt trước', count: tables.filter(t => t.status === 'RESERVED').length, color: '#D97706' }
          ].map(f => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: isActive ? `1.5px solid ${f.color}` : '1px solid #EAE0DE',
                  background: isActive ? f.color : '#FFF8F6',
                  color: isActive ? '#FFFFFF' : '#56423D',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{f.label}</span>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  background: isActive ? 'rgba(255,255,255,0.25)' : '#F0E6E4',
                  fontSize: '0.72rem'
                }}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#FCF1EF',
            borderRadius: '9999px',
            padding: '4px 12px',
            border: '1px solid #EAE0DE'
          }}>
            <Icon name="search" size={18} style={{ color: '#89726B' }} />
            <input
              type="text"
              placeholder="Tìm số bàn, tên khách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.82rem',
                color: '#1F1B1A',
                width: '160px'
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => showToast('Đã làm mới dữ liệu sơ đồ bàn')}
            title="Làm mới sơ đồ"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid #EAE0DE',
              background: '#FFF8F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#56423D'
            }}
          >
            <Icon name="refresh" size={18} />
          </button>
        </div>
      </div>

      {/* 3. Primary Split-Screen Body (68% Table Map & 32% Management Drawer) */}
      <div style={{
        display: isMobile ? 'flex' : 'grid',
        flexDirection: isMobile ? 'column' : undefined,
        gridTemplateColumns: isMobile ? undefined : 'repeat(12, 1fr)',
        gap: isMobile ? '12px' : '20px',
        padding: isMobile ? '12px' : '20px',
        alignItems: 'flex-start'
      }}>
        {/* Left Pane (8 cols on desktop, full width on mobile): Table Cards Grid */}
        <div style={{ gridColumn: isMobile ? undefined : 'span 8', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(150px, 1fr))' : 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: isMobile ? '10px' : '14px'
          }}>
            {filteredTables.map(t => {
              const isSelected = selectedTable?.id === t.id;
              const topBorderColor = getBorderColor(t);

              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTable(t)}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: isMobile ? '12px' : '14px',
                    boxShadow: isSelected ? '0 8px 24px rgba(157, 65, 36, 0.18)' : '0 2px 10px rgba(0,0,0,0.04)',
                    borderTop: `4px solid ${topBorderColor}`,
                    border: isSelected ? '2px solid #9D4124' : '1px solid #F0E6E4',
                    borderTopColor: topBorderColor,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: isMobile ? '145px' : '170px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Card Top */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontFamily: "'Epilogue', sans-serif",
                          fontWeight: 800,
                          fontSize: '1.05rem',
                          color: isSelected ? '#9D4124' : '#1F1B1A'
                        }}>
                          {t.label}
                        </span>
                        <span style={{ fontSize: '0.72rem', background: '#F6ECEA', color: '#56423D', padding: '2px 6px', borderRadius: '9999px', fontWeight: 600 }}>
                          {t.seats} chỗ
                        </span>
                      </div>
                      {getStatusBadge(t)}
                    </div>

                    {/* Status note */}
                    <p style={{ margin: '4px 0 8px', fontSize: '0.78rem', color: '#56423D', lineHeight: 1.35 }}>
                      {t.statusNote}
                    </p>

                    {/* Dish progress preview if occupied */}
                    {t.items.length > 0 && (
                      <div style={{ background: '#FFF8F6', padding: '6px 10px', borderRadius: '10px', border: '1px solid #F6ECEA', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#1F1B1A' }}>
                          <span>{t.items.filter(i => i.status === 'SERVED').length}/{t.items.length} món đã ra</span>
                          <span style={{ fontWeight: 800, color: '#9D4124' }}>
                            {t.orderTotal.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Action footer */}
                  <div style={{ paddingTop: '8px', borderTop: '1px solid #F6ECEA' }}>
                    {t.status === 'CALLING' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolveCall(t.id);
                        }}
                        style={{
                          width: '100%',
                          padding: '7px',
                          borderRadius: '10px',
                          background: '#9D4124',
                          color: '#FFFFFF',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Icon name="touch_app" size={16} /> Đã Nhận Yêu Cầu
                      </button>
                    )}

                    {t.status === 'FOOD_READY' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmDeliverFood(t.id);
                        }}
                        style={{
                          width: '100%',
                          padding: '7px',
                          borderRadius: '10px',
                          background: '#596232',
                          color: '#FFFFFF',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Icon name="room_service" size={16} /> Xác Nhận Đã Bưng Món
                      </button>
                    )}

                    {t.status === 'AVAILABLE' && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTable(t.id);
                          }}
                          style={{
                            flex: 1,
                            padding: '7px',
                            borderRadius: '10px',
                            background: '#ECFDF5',
                            color: '#065F46',
                            border: '1px solid #A7F3D0',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Icon name="add_circle" size={16} /> Mở Bàn Ngay
                        </button>
                      </div>
                    )}

                    {t.status === 'DIRTY' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCleanTable(t.id);
                        }}
                        style={{
                          width: '100%',
                          padding: '7px',
                          borderRadius: '10px',
                          background: '#F0E6E4',
                          color: '#1F1B1A',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Icon name="mop" size={16} /> Đã Dọn Xong & Sẵn Sàng
                      </button>
                    )}

                    {t.status === 'AWAITING_PAYMENT' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast(`Đã báo thu ngân mang POS sang Bàn ${t.tableNumber}!`);
                        }}
                        style={{
                          width: '100%',
                          padding: '7px',
                          borderRadius: '10px',
                          background: '#FFDBC9',
                          color: '#753400',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Icon name="credit_card" size={16} /> Gọi POS Thu Ngân
                      </button>
                    )}

                    {t.status === 'RESERVED' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTable(t.id);
                        }}
                        style={{
                          width: '100%',
                          padding: '7px',
                          borderRadius: '10px',
                          background: '#D97706',
                          color: '#FFF',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Icon name="how_to_reg" size={16} /> Check-in Vào Bàn
                      </button>
                    )}

                    {t.status === 'OCCUPIED' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: '#89726B' }}>Thời gian: {t.duration}</span>
                        <span style={{ fontSize: '0.75rem', color: '#9D4124', fontWeight: 700 }}>Chi tiết &gt;</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Rail (4 cols): Table Focus & Quick Actions Drawer on Desktop */}
        {!isMobile && (
          <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '80px' }}>
            {selectedTable ? (
              renderTableDrawer(selectedTable, false)
            ) : (
              <div style={{ background: '#FFF', borderRadius: '16px', padding: '30px', textAlign: 'center', color: '#89726B' }}>
                Chọn một bàn trong sơ đồ để xem thông tin chi tiết
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet Drawer for Selected Table */}
      {isMobile && showMobileDrawer && selectedTable && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            background: 'rgba(31, 27, 26, 0.55)',
            backdropFilter: 'blur(3px)'
          }}
          onClick={() => setShowMobileDrawer(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '24px 24px 0 0',
              padding: '12px 18px 24px',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* Drag Handle Pill */}
            <div style={{
              width: '44px',
              height: '5px',
              borderRadius: '3px',
              background: '#D6C3BF',
              margin: '0 auto 6px auto'
            }} />

            {renderTableDrawer(selectedTable, true)}
          </div>
        </div>
      )}

      {/* MODAL 1: Quick Order at Table */}
      {showOrderModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(31, 27, 26, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '560px',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="restaurant_menu" size={22} style={{ color: '#9D4124' }} />
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#1F1B1A', margin: 0 }}>
                  Gọi món nhanh vào Bàn {selectedTable.tableNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F6ECEA', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {MOCK_MENU_ITEMS.filter(item => item.isAvailable).map(dish => (
                <div
                  key={dish.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: '#FFF8F6',
                    border: '1px solid #F0E6E4'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <img src={dish.imageUrl} alt={dish.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {dish.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#9D4124', fontWeight: 800 }}>
                        {dish.price.toLocaleString('vi-VN')}₫
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickAddDish(dish)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: '#9D4124',
                      color: '#FFF',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Icon name="add" size={16} /> Thêm
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowOrderModal(false)}
              style={{
                marginTop: '14px',
                padding: '11px',
                borderRadius: '12px',
                background: '#F0E6E4',
                color: '#56423D',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Transfer Table (theo SCR-07) */}
      {showTransferModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(31, 27, 26, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '480px',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="swap_horiz" size={24} style={{ color: '#9D4124' }} />
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1F1B1A', margin: 0 }}>
                  Chuyển Bàn Phục Vụ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F6ECEA', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div style={{ background: '#FFF8F6', padding: '12px 16px', borderRadius: '12px', border: '1px solid #F0E6E4', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: '#89726B', display: 'block' }}>Bàn hiện tại:</span>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#9D4124' }}>
                Bàn {selectedTable.tableNumber} ({selectedTable.seats} chỗ) • Hóa đơn: {selectedTable.orderTotal.toLocaleString('vi-VN')}₫
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '6px' }}>
                Chọn bàn trống muốn chuyển tới:
              </label>
              <select
                value={transferTargetId}
                onChange={(e) => setTransferTargetId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '12px',
                  border: '1px solid #EAE0DE',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#1F1B1A',
                  background: '#FFF8F6',
                  outline: 'none'
                }}
              >
                <option value="">-- Chọn bàn trống --</option>
                {tables.filter(t => t.status === 'AVAILABLE' && t.id !== selectedTable.id).map(avail => (
                  <option key={avail.id} value={avail.id}>
                    {avail.label} ({avail.seats} chỗ) — Sẵn sàng
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px',
                  background: '#F0E6E4',
                  color: '#56423D',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleExecuteTransfer}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px',
                  background: '#9D4124',
                  color: '#FFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Xác Nhận Chuyển
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Table QR Code */}
      {showQrModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(31, 27, 26, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '380px',
            borderRadius: '24px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: '0 0 4px' }}>
              Mã QR Bàn {selectedTable.tableNumber}
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#89726B' }}>
              Khách dùng Camera điện thoại để quét và gọi món trực tiếp
            </p>

            <div style={{
              background: '#FFF8F6',
              padding: '20px',
              borderRadius: '20px',
              border: '2px dashed #9D4124',
              display: 'inline-block',
              marginBottom: '16px'
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + '/dining/welcome?table=' + selectedTable.tableNumber)}`}
                alt="QR Code Bàn"
                style={{ width: '180px', height: '180px', display: 'block' }}
              />
            </div>

            <div style={{ fontSize: '0.78rem', color: '#56423D', background: '#FCF1EF', padding: '8px 12px', borderRadius: '10px', marginBottom: '16px' }}>
              Mã bàn: <strong>{selectedTable.tableNumber}</strong> • Tầng 1
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '12px',
                background: '#9D4124',
                color: '#FFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
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
