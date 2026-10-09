import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { waiterApi } from '../../api/waiterApi';

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

export default function WaiterFloorPlanPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tables, setTables] = useState([]);
  const [menuCatalog, setMenuCatalog] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [selectedTable, setSelectedTable] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 1024);

  // Tải sơ đồ bàn thật từ Backend API
  const loadFloorPlan = async () => {
    try {
      const zoneParam = selectedZone === 'ALL' ? undefined : selectedZone;
      const res = await waiterApi.getTables(zoneParam);
      if (res.data && res.data.success) {
        const rawTables = res.data.data || [];
        const mappedTables = rawTables.map(t => ({
          ...t,
          label: t.name || `Bàn ${t.tableNumber}`,
          seats: t.capacity || 4,
          zone: t.zoneName || t.zone,
          orderTotal: typeof t.orderTotal === 'number' ? t.orderTotal : Number(t.orderTotal || 0),
          items: (t.items || []).map(item => ({
            ...item,
            name: item.name || 'Món ăn',
            qty: item.quantity || 1,
            note: item.note || (item.status === 'READY' ? 'Quầy Pass sẵn sàng' : item.status === 'COOKING' ? 'Bếp đang nấu KDS' : 'Đã lên bàn')
          }))
        }));
        setTables(mappedTables);
        setSelectedTable(prev => {
          if (!prev && mappedTables.length > 0) return mappedTables[0];
          if (prev) {
            const found = mappedTables.find(t => t.id === prev.id);
            return found || (mappedTables.length > 0 ? mappedTables[0] : null);
          }
          return mappedTables[0] || null;
        });
      }
    } catch (err) {
      console.error("Lỗi tải sơ đồ bàn phục vụ:", err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadFloorPlan();
    // Thiết lập chu kỳ cập nhật tự động 5s/lần (Polling)
    const timer = setInterval(loadFloorPlan, 5000);
    return () => clearInterval(timer);
  }, [selectedZone]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await waiterApi.getMenu();
        if (res.data && res.data.success) {
          setMenuCatalog(res.data.data || []);
        }
      } catch (err) {
        console.error("Lỗi tải thực đơn món:", err);
      }
    };
    fetchMenu();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const urlFilter = searchParams.get('filter');
    setActiveFilter(urlFilter || 'ALL');
  }, [searchParams]);

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    if (filterId === 'ALL') {
      setSearchParams({});
    } else {
      setSearchParams({ filter: filterId });
    }
  };

  // Modals
  const [showTableModal, setShowTableModal] = useState(false);
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

  // Thống kê số lượng chuông gọi và món chờ bưng thời gian thực
  const callingCount = tables.filter(t => t.calling || t.status === 'CALLING').length;
  const readyFoodCount = tables.reduce((acc, t) => acc + (t.readyItems || 0), 0);

  // Actions
  const handleSelectTable = (table) => {
    setSelectedTable(table);
    setShowTableModal(true);
  };

  const handleResolveCall = async (tableId) => {
    const target = tables.find(t => t.id === tableId);
    if (target?.activeRequestId) {
      try {
        await waiterApi.resolveRequest(target.activeRequestId);
        showToast(`Đã xử lý xong yêu cầu hỗ trợ của ${target.label || target.tableNumber}!`);
        await loadFloorPlan();
        return;
      } catch (err) {
        showToast(err.response?.data?.message || 'Lỗi xử lý yêu cầu chuông');
      }
    }
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return { ...t, status: 'OCCUPIED', calling: false };
      }
      return t;
    }));
    if (selectedTable && selectedTable.id === tableId) {
      setSelectedTable(prev => ({ ...prev, status: 'OCCUPIED', calling: false }));
    }
    showToast(`Đã xử lý xong yêu cầu hỗ trợ!`);
  };

  const handleOpenTable = async (tableId) => {
    const target = tables.find(t => t.id === tableId);
    try {
      await waiterApi.openTable(tableId, { guestCount: target?.seats || 4 });
      showToast(`Đã mở phiên phục vụ cho ${target?.label || target?.tableNumber || tableId}!`);
      await loadFloorPlan();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi mở phiên phục vụ bàn');
    }
  };

  const handleCleanTable = async (tableId) => {
    try {
      await waiterApi.cleanTable(tableId);
      showToast(`Bàn đã dọn xong và chuyển sang trạng thái Sẵn Sàng!`);
      await loadFloorPlan();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi cập nhật dọn bàn');
    }
  };

  const handleConfirmDeliverFood = async (tableId) => {
    try {
      await waiterApi.deliverFood(tableId);
      const target = tables.find(t => t.id === tableId);
      showToast(`Đã xác nhận bưng món xong cho ${target?.label || target?.tableNumber || tableId}!`);
      await loadFloorPlan();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi cập nhật bưng món');
    }
  };

  const handleExecuteTransfer = async () => {
    if (!transferTargetId) {
      showToast('Vui lòng chọn bàn muốn chuyển đến!');
      return;
    }
    const targetTable = tables.find(t => t.id === parseInt(transferTargetId));
    if (!targetTable) return;

    try {
      await waiterApi.transferTable({
        sourceTableId: selectedTable.id,
        targetTableId: parseInt(transferTargetId),
        reason: 'Khách yêu cầu chuyển bàn'
      });
      setShowTransferModal(false);
      showToast(`Đã chuyển toàn bộ hóa đơn từ ${selectedTable.label || selectedTable.tableNumber} sang ${targetTable.label || targetTable.tableNumber}!`);
      await loadFloorPlan();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi chuyển bàn');
    }
  };

  const handleQuickAddDish = async (dish) => {
    if (!selectedTable) return;
    try {
      const payload = {
        items: [
          {
            menuItemId: dish.id,
            quantity: 1,
            note: 'Waiter gọi nhanh tại bàn'
          }
        ],
        note: 'Waiter gọi nhanh tại bàn'
      };
      const res = await waiterApi.addOrder(selectedTable.id, payload);
      if (res.data && res.data.success) {
        showToast(`Đã gửi [${dish.name}] vào bếp cho ${selectedTable.label || selectedTable.tableNumber}!`);
        await loadFloorPlan();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi gọi thêm món');
    }
  };

  const handleRequestPayment = async (tableId) => {
    try {
      await waiterApi.requestPayment(tableId);
      showToast('Đã gửi thông báo yêu cầu thanh toán sang Quầy Thu Ngân POS!');
      await loadFloorPlan();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi gửi yêu cầu thanh toán');
    }
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

  const renderTableDetailModal = (table) => {
    if (!table || !showTableModal) return null;
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1100,
          background: 'rgba(31, 27, 26, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center',
          padding: isMobile ? '0' : '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={() => setShowTableModal(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#FFFFFF',
            borderRadius: isMobile ? '24px 24px 0 0' : '24px',
            padding: isMobile ? '16px 18px 24px' : '24px 28px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: isMobile ? '85vh' : '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Drag Handle on Mobile */}
          {isMobile && (
            <div style={{
              width: '44px',
              height: '5px',
              borderRadius: '3px',
              background: '#D6C3BF',
              margin: '0 auto 4px auto'
            }} />
          )}

          {/* Modal Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: isMobile ? '1.3rem' : '1.5rem', color: '#9D4124', margin: 0 }}>
                  {table.label}
                </h3>
                {getStatusBadge(table)}
              </div>
              <span style={{ fontSize: '0.82rem', color: '#89726B', marginTop: '4px', display: 'block' }}>
                {table.zone} • {table.seats} chỗ {table.actualGuests ? `• ${table.actualGuests} khách đang ngồi` : ''}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', color: '#89726B', display: 'block' }}>Giờ vào</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1F1B1A' }}>
                  {table.duration ? `${table.duration} trước` : 'Chưa có'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid #EAE0DE',
                  background: '#FFF8F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#56423D'
                }}
                title="Đóng bảng chi tiết"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
          </div>

          {/* Service Call Banner if active */}
          {table.calling && (
            <div style={{
              background: '#FFF8F6',
              border: '1px solid #FFCDD2',
              padding: '12px 16px',
              borderRadius: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#BA1A1A', fontWeight: 800, fontSize: '0.82rem' }}>
                  <Icon name="priority_high" size={18} />
                  YÊU CẦU CẦN HỖ TRỢ KHẨN
                </div>
                <span style={{ fontSize: '0.72rem', color: '#89726B' }}>{table.callTime}</span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#1F1B1A', fontWeight: 600 }}>
                {table.statusNote || table.callNote || 'Khách yêu cầu hỗ trợ'}
              </p>
              <button
                type="button"
                onClick={() => {
                  handleResolveCall(table.id);
                }}
                style={{
                  width: '100%',
                  padding: '9px',
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

          {/* Food Ready Banner if active */}
          {table.status === 'FOOD_READY' && (
            <div style={{
              background: '#F7FEE7',
              border: '1px solid #D9F99D',
              padding: '12px 16px',
              borderRadius: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#365314', fontWeight: 800, fontSize: '0.82rem' }}>
                  <Icon name="soup_kitchen" size={18} />
                  BẾP ĐÃ NẤU XONG MÓN!
                </div>
                <span style={{ fontSize: '0.72rem', color: '#4D7C0F' }}>{table.readyItems || 1} món sẵn sàng</span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#1F1B1A' }}>
                Quầy Pass có món nóng đã hoàn thành. Vui lòng nhận món và bưng lên bàn cho khách!
              </p>
              <button
                type="button"
                onClick={() => handleConfirmDeliverFood(table.id)}
                style={{
                  width: '100%',
                  padding: '9px',
                  borderRadius: '10px',
                  background: '#596232',
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
                <Icon name="room_service" size={18} /> Xác Nhận Đã Bưng Món Lên Bàn
              </button>
            </div>
          )}

          {/* Real-time Order Ticket Summary */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1F1B1A' }}>
                Danh sách món ăn ({table.items.length} món)
              </span>
              <span style={{ fontSize: '0.75rem', color: '#89726B' }}>
                {table.items.filter(i => i.status === 'SERVED').length}/{table.items.length} món đã lên bàn
              </span>
            </div>

            {table.items.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#89726B', fontSize: '0.85rem', background: '#FCF1EF', borderRadius: '14px' }}>
                {table.status === 'AVAILABLE' ? 'Bàn đang trống, chưa có món nào được gọi' : 'Bàn chưa có món ăn nào được gọi'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {table.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#FFF8F6',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid #F6ECEA'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        background: '#F0E6E4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        color: '#9D4124',
                        flexShrink: 0
                      }}>
                        {item.qty}x
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </div>
                        {item.note && (
                          <div style={{ fontSize: '0.72rem', color: '#89726B' }}>
                            {item.note}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      {item.subtotal > 0 && (
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#56423D' }}>
                          {item.subtotal.toLocaleString('vi-VN')}₫
                        </span>
                      )}
                      {item.status === 'SERVED' && (
                        <span style={{ color: '#596232', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Icon name="check_circle" size={14} /> Đã ra
                        </span>
                      )}
                      {item.status === 'COOKING' && (
                        <span style={{ color: '#994703', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Icon name="microwave" size={14} /> Bếp nấu
                        </span>
                      )}
                      {item.status === 'READY' && (
                        <span style={{ color: '#596232', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px', background: '#DCFCE7', padding: '2px 6px', borderRadius: '4px' }}>
                          <Icon name="soup_kitchen" size={14} /> Quầy Pass
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Subtotal Banner */}
            {table.orderTotal > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#F6ECEA',
                padding: '12px 18px',
                borderRadius: '14px',
                marginTop: '12px',
                border: '1px solid #FFDBC9'
              }}>
                <span style={{ fontSize: '0.88rem', color: '#56423D', fontWeight: 700 }}>Tổng tiền tạm tính:</span>
                <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.25rem', color: '#9D4124' }}>
                  {table.orderTotal.toLocaleString('vi-VN')}₫
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {table.status === 'AVAILABLE' ? (
              <button
                type="button"
                onClick={() => {
                  handleOpenTable(table.id);
                  setShowTableModal(false);
                }}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '14px',
                  background: '#059669',
                  color: '#FFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
                }}
              >
                <Icon name="add_circle" size={20} /> Mở Bàn Đón Khách Ngay
              </button>
            ) : table.status === 'DIRTY' ? (
              <button
                type="button"
                onClick={() => {
                  handleCleanTable(table.id);
                  setShowTableModal(false);
                }}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '14px',
                  background: '#56423D',
                  color: '#FFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <Icon name="mop" size={20} /> Đã Dọn Xong & Sẵn Sàng Đón Khách
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setShowOrderModal(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '14px',
                    background: '#9D4124',
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(157, 65, 36, 0.28)'
                  }}
                >
                  <Icon name="restaurant_menu" size={20} /> Gọi Thêm Món Vào Bàn
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransferModal(true);
                    }}
                    style={{
                      padding: '11px',
                      borderRadius: '12px',
                      background: '#FFF8F6',
                      border: '1px solid #F0E6E4',
                      color: '#1F1B1A',
                      fontWeight: 700,
                      fontSize: '0.85rem',
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
                    onClick={() => handleRequestPayment(table.id)}
                    style={{
                      padding: '11px',
                      borderRadius: '12px',
                      background: '#FFDBC9',
                      border: '1px solid #FFB68C',
                      color: '#753400',
                      fontWeight: 700,
                      fontSize: '0.85rem',
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
                    setShowQrModal(true);
                  }}
                  style={{
                    padding: '9px',
                    borderRadius: '10px',
                    background: '#FCF1EF',
                    border: '1px solid #EAE0DE',
                    color: '#56423D',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Icon name="qr_code_2" size={16} /> Xem Mã QR Khách Quét Đặt Món
                </button>
              </>
            )}
          </div>
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
                const zoneText = e.target.options[e.target.selectedIndex].text;
                showToast(`Chuyển khu vực: ${zoneText}`);
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
              <option value="ALL">Tất Cả Khu Vực</option>
              <option value="ZONE_1">Tầng 1 - Sảnh Chính</option>
              <option value="ZONE_2">Tầng 2 - Ban Công</option>
              <option value="VIP">Phòng VIP</option>
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
                {readyFoodCount} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#56423D' }}>món</span>
              </div>
            </div>
          </div>

          <div
            onClick={() => handleFilterChange('CALLING')}
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
                {callingCount} <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>gọi</span>
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
                onClick={() => handleFilterChange(f.id)}
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

      {/* 3. Sơ đồ bàn Full-Width với các ô bàn lớn, thoáng, chạm để mở Popup chi tiết */}
      <div style={{
        width: '100%',
        padding: isMobile ? '12px' : '20px 24px',
        boxSizing: 'border-box'
      }}>
        {initialLoading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#89726B' }}>
            <Icon name="sync" size={32} style={{ color: '#9D4124', marginBottom: '12px' }} />
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1F1B1A' }}>Đang nạp dữ liệu sơ đồ bàn từ CSDL...</div>
            <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Hệ thống đang đồng bộ phiên ăn và tiến độ Bếp</div>
          </div>
        ) : filteredTables.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#89726B', background: '#FFFFFF', borderRadius: '16px', border: '1px dashed #E0D4D1' }}>
            <Icon name="table_restaurant" size={40} style={{ color: '#C0B0AD', marginBottom: '12px' }} />
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1F1B1A' }}>Không tìm thấy bàn nào phù hợp</div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Vui lòng chọn khu vực khác hoặc thay đổi bộ lọc trạng thái.</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(160px, 1fr))' : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: isMobile ? '12px' : '18px'
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
                          handleRequestPayment(t.id);
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
        )}
      </div>
      {/* MODAL CHI TIẾT BÀN & TẠM TÍNH (Popup Center Desktop / Bottom Sheet Mobile) */}
      {showTableModal && selectedTable && renderTableDetailModal(selectedTable)}

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
              {menuCatalog.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: '#89726B' }}>
                  <Icon name="restaurant_menu" size={32} style={{ color: '#D1C2BE', marginBottom: '8px' }} />
                  <div>Đang tải thực đơn hoặc chưa có món ăn...</div>
                </div>
              ) : (
                menuCatalog.filter(item => item.isAvailable).map(dish => (
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
              )))}
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
