import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { waiterApi } from '../../api/waiterApi';
import { broadcastRealtimeEvent, subscribeRealtimeEvents } from '../../utils/realtimeSync';
import { useDialog } from '../../context/DialogContext';
import './waiterMobile.css';

export default function WaiterOrderDetailPage() {
  const navigate = useNavigate();
  const { showConfirm, showAlert } = useDialog();
  const [searchParams] = useSearchParams();
  const tableCodeParam = searchParams.get('table');

  const [allTables, setAllTables] = useState([]);
  const [tableData, setTableData] = useState({
    code: tableCodeParam || '...',
    name: tableCodeParam ? `Bàn ${tableCodeParam}` : 'Đang tải...',
    orderCode: '#ORD-...',
    guests: 0,
    waiter: 'Nhân viên trực ca',
    timeIn: 'Chưa có',
    status: 'LOADING',
    items: []
  });

  const [menuCatalog, setMenuCatalog] = useState([]);

  // Tải dữ liệu bàn thật từ Backend API
  const fetchTablesAndDetails = async () => {
    try {
      const res = await waiterApi.getTables();
      if (res.data && res.data.success) {
        const list = res.data.data || [];
        setAllTables(list);

        let currentTable = null;
        if (tableCodeParam) {
          const normParam = tableCodeParam.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          currentTable = list.find(t => {
            const normNum = (t.tableNumber || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const normName = (t.name || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            return normNum === normParam || normName === normParam || normName.includes(normParam) || String(t.id) === String(tableCodeParam);
          });
        }
        if (!currentTable) {
          // Nếu không truyền param hoặc không tìm thấy, lấy bàn đang phục vụ đầu tiên
          currentTable = list.find(t => t.status === 'OCCUPIED' || t.status === 'FOOD_READY' || t.status === 'CALLING' || t.status === 'AWAITING_PAYMENT') || list[0];
        }

        if (currentTable) {
          setTableData({
            id: currentTable.id,
            code: currentTable.tableNumber,
            name: currentTable.name || `Bàn ${currentTable.tableNumber}`,
            orderCode: `#ORD-${currentTable.tableNumber}`,
            guests: currentTable.actualGuests || currentTable.capacity || 2,
            waiter: 'Nhân viên trực ca',
            timeIn: (currentTable.duration && !currentTable.duration.startsWith('-')) ? currentTable.duration : 'Vừa vào',
            status: currentTable.status,
            statusNote: currentTable.statusNote,
            items: (currentTable.items || []).map((item, idx) => ({
              id: item.orderItemId || idx + 1,
              name: item.name,
              category: 'Món ăn',
              price: typeof item.unitPrice === 'number' ? item.unitPrice : Number(item.unitPrice || 0),
              qty: item.quantity || 1,
              status: item.status,
              statusText: item.status === 'READY' ? 'Quầy Pass' :
                          item.status === 'COOKING' ? 'Bếp đang nấu' :
                          item.status === 'PENDING' ? 'Chờ bếp nhận' : 'Đã lên món',
              note: item.note || ''
            }))
          });
        }
      }
    } catch (err) {
      console.error("Lỗi lấy dữ liệu bàn gọi món:", err);
    }
  };

  useEffect(() => {
    fetchTablesAndDetails();
    const interval = setInterval(fetchTablesAndDetails, 4000);

    const handleTabActive = () => {
      if (document.visibilityState === 'visible') {
        fetchTablesAndDetails();
      }
    };
    window.addEventListener('focus', fetchTablesAndDetails);
    document.addEventListener('visibilitychange', handleTabActive);

    const unsubscribe = subscribeRealtimeEvents((event) => {
      if (event?.type === 'TABLE_UPDATE' || event?.type === 'PAYMENT_REQUEST' || event?.type === 'ORDER_UPDATE' || event?.type === 'NEW_ORDER_CREATED') {
        fetchTablesAndDetails();
      }
      if (event?.type === 'MENU_AVAILABILITY_CHANGED' && event?.payload) {
        const { id, isAvailable, remainingStock } = event.payload;
        setMenuCatalog(prev => prev.map(m => m.id === id ? { ...m, isAvailable, remainingStock } : m));
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchTablesAndDetails);
      document.removeEventListener('visibilitychange', handleTabActive);
      unsubscribe();
    };
  }, [tableCodeParam]);

  // Tải danh mục thực đơn thật từ CSDL
  useEffect(() => {
    const fetchRealMenu = async () => {
      try {
        const res = await waiterApi.getMenu();
        if (res.data && res.data.success) {
          setMenuCatalog(res.data.data || []);
        }
      } catch (err) {
        console.error('Lỗi tải thực đơn món:', err);
      }
    };
    fetchRealMenu();
  }, []);

  // Modal Gọi Thêm Món
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [searchDish, setSearchDish] = useState('');
  const [cartToAdd, setCartToAdd] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [mobileModalTab, setMobileModalTab] = useState('CATALOG'); // 'CATALOG' | 'CART'
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRequestPayment = async () => {
    if (!tableData.id) return;
    if (tableData.items.length === 0) {
      showToast('Bàn chưa gọi món ăn nào (0đ), không thể gửi yêu cầu tính tiền!');
      return;
    }
    try {
      await waiterApi.requestPayment(tableData.id);
      showToast(`Đã gửi yêu cầu thanh toán bàn ${tableData.code} sang Quầy Thu Ngân POS!`);
      await fetchTablesAndDetails();
      broadcastRealtimeEvent({
        type: 'PAYMENT_REQUEST',
        tableId: tableData.id,
        tableName: tableData.name || `Bàn ${tableData.code}`
      });
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi gửi yêu cầu thanh toán');
    }
  };

  const handleCloseEmptyTable = async () => {
    if (!tableData.id) return;
    const confirmed = await showConfirm({
      title: 'Đóng phiên bàn trống',
      message: `Xác nhận đóng phiên ăn 0đ và giải phóng bàn ${tableData.code}?\n(Dành cho trường hợp khách không dùng món hoặc mở nhầm bàn)`,
      confirmText: 'Đóng bàn',
      type: 'warning'
    });
    if (!confirmed) return;
    try {
      await waiterApi.closeEmptySession(tableData.id, { reason: 'Khách không dùng món / Hủy bàn trống', targetStatus: 'AVAILABLE' });
      showToast(`Đã đóng phiên bàn trống thành công cho bàn ${tableData.code}!`);
      broadcastRealtimeEvent({ type: 'TABLE_UPDATE', tableId: tableData.id, status: 'AVAILABLE' });
      navigate('/waiter/floor-plan');
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi đóng phiên bàn trống!');
    }
  };

  const subtotal = tableData.items.reduce((s, i) => s + (i.price * i.qty), 0);
  const vat = 0;
  const total = subtotal;

  // Add dish to temporary order cart
  const handleSelectDish = (dish) => {
    setCartToAdd(prev => {
      const existing = prev.find(i => i.id === dish.id);
      if (existing) {
        return prev.map(i => i.id === dish.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...dish, qty: 1, note: '' }];
    });
  };

  const handleUpdateCartQty = (id, delta) => {
    setCartToAdd(prev => {
      return prev.map(i => {
        if (i.id === id) {
          const next = i.qty + delta;
          return next > 0 ? { ...i, qty: next } : null;
        }
        return i;
      }).filter(Boolean);
    });
  };

  const handleUpdateCartNote = (id, note) => {
    setCartToAdd(prev => prev.map(i => i.id === id ? { ...i, note } : i));
  };

  // Submit additional dishes to table & kitchen (Lưu thật Database)
  const handleConfirmAddDishes = async () => {
    if (cartToAdd.length === 0 || !tableData.id) return;

    try {
      const payload = {
        items: cartToAdd.map(item => ({
          menuItemId: item.id,
          quantity: item.qty,
          note: item.note || ''
        })),
        note: 'Waiter gọi thêm tại bàn'
      };

      const res = await waiterApi.addOrder(tableData.id, payload);
      if (res.data && res.data.success) {
        const count = cartToAdd.reduce((s, i) => s + i.qty, 0);
        setCartToAdd([]);
        setShowAddDishModal(false);
        showToast(`Đã gửi thành công ${count} món gọi thêm vào Bếp cho Bàn ${tableData.code}!`);
        await fetchTablesAndDetails();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi gửi đợt gọi món');
    }
  };

  const availableCategories = ['ALL', ...Array.from(new Set(menuCatalog.map(m => m.category).filter(Boolean)))];

  const filteredCatalog = menuCatalog.filter(d => {
    if (selectedCat !== 'ALL' && d.category !== selectedCat) return false;
    if (searchDish.trim() !== '') {
      return d.name?.toLowerCase().includes(searchDish.toLowerCase());
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '20px', paddingBottom: isMobile ? '135px' : '24px' }}>
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
          <Icon name="check_circle" size={20} style={{ color: '#E8C3BA' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Back button and Table Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => navigate('/waiter/floor-plan')}
            style={{
              width: isMobile ? '38px' : '42px',
              height: isMobile ? '38px' : '42px',
              borderRadius: '12px',
              background: '#FFFFFF',
              border: '1px solid #EAE0DE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#56423D'
            }}
          >
            <Icon name="arrow_back" size={20} />
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9D4124', background: '#FFDBC9', padding: '2px 8px', borderRadius: '6px' }}>
                Bàn Ăn
              </span>
              <span style={{ fontSize: '0.8rem', color: '#89726B', fontWeight: 600 }}>Chi Tiết Đơn Đang Phục Vụ</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px', flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: isMobile ? '1.25rem' : '1.65rem', color: '#1F1B1A', margin: 0 }}>
                {tableData.code} • {tableData.name}
              </h1>
              {allTables.length > 0 && (
                <select
                  value={tableData.code}
                  onChange={(e) => navigate(`/waiter/order?table=${e.target.value}`)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid #EAE0DE',
                    background: '#FFF8F6',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: '#9D4124',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                  title="Chọn bàn khác"
                >
                  <optgroup label="Bàn đang phục vụ">
                    {allTables.filter(t => t.status === 'OCCUPIED' || t.status === 'FOOD_READY' || t.status === 'CALLING' || t.status === 'AWAITING_PAYMENT').map(t => (
                      <option key={t.id} value={t.tableNumber}>
                        {t.name || `Bàn ${t.tableNumber}`} ({t.status === 'FOOD_READY' ? 'Bếp xong' : t.status === 'AWAITING_PAYMENT' ? 'Chờ thanh toán' : 'Đang ăn'})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Các bàn khác">
                    {allTables.filter(t => t.status !== 'OCCUPIED' && t.status !== 'FOOD_READY' && t.status !== 'CALLING' && t.status !== 'AWAITING_PAYMENT').map(t => (
                      <option key={t.id} value={t.tableNumber}>
                        {t.name || `Bàn ${t.tableNumber}`} ({t.status === 'AVAILABLE' ? 'Trống' : t.status === 'RESERVED' ? 'Đặt trước' : t.status})
                      </option>
                    ))}
                  </optgroup>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons (Desktop only - Mobile has sticky action bar) */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '10px' }}>
            {tableData.items.length === 0 && (
              <button
                type="button"
                onClick={handleCloseEmptyTable}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: '#FFDAD6',
                  border: '1px solid #FFB4AB',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#93000A',
                  cursor: 'pointer'
                }}
              >
                <Icon name="event_busy" size={18} />
                Đóng Bàn 0đ (Khách Rời Đi)
              </button>
            )}
            <button
              type="button"
              disabled={tableData.status === 'AWAITING_PAYMENT'}
              onClick={handleRequestPayment}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: tableData.status === 'AWAITING_PAYMENT' ? '#FFDBC9' : '#FFFFFF',
                border: tableData.status === 'AWAITING_PAYMENT' ? '1.5px solid #FFB68C' : '1px solid #EAE0DE',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: tableData.status === 'AWAITING_PAYMENT' ? '#753400' : '#BA1A1A',
                cursor: tableData.status === 'AWAITING_PAYMENT' ? 'default' : 'pointer'
              }}
            >
              <Icon name="point_of_sale" size={18} />
              {tableData.status === 'AWAITING_PAYMENT' ? 'Đã Báo Thu Ngân (Chờ POS)' : 'Báo Thu Ngân Tính Tiền'}
            </button>

            <button
              type="button"
              onClick={() => setShowAddDishModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                background: '#9D4124',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: '#FFFFFF',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(157, 65, 36, 0.25)'
              }}
            >
              <Icon name="add_circle" size={18} />
              Gọi Thêm Món
            </button>
          </div>
        )}
      </div>

      {/* Cảnh báo nếu bàn chưa mở phiên phục vụ */}
      {tableData.status && tableData.status !== 'OCCUPIED' && tableData.status !== 'FOOD_READY' && tableData.status !== 'CALLING' && tableData.status !== 'AWAITING_PAYMENT' && tableData.status !== 'LOADING' && (
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          padding: '14px 18px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#92400E', fontSize: '0.88rem' }}>
            <Icon name="warning" size={22} style={{ color: '#D97706', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800 }}>Bàn {tableData.code} hiện chưa mở phiên phục vụ!</div>
              <div style={{ fontSize: '0.8rem', color: '#B45309' }}>
                Trạng thái: <strong>{tableData.status === 'RESERVED' ? 'Đã đặt trước (Chưa check-in)' : tableData.status === 'AVAILABLE' ? 'Sẵn sàng (Trống)' : tableData.status}</strong>. Vui lòng mở bàn tại Sơ Đồ Bàn hoặc chọn bàn đang phục vụ khác ở ô chọn phía trên.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/waiter/floor-plan')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: '#D97706',
              color: '#FFF',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Về Sơ Đồ Bàn
          </button>
        </div>
      )}

      {/* Table Information Strip */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: isMobile ? '12px 14px' : '16px 20px',
        border: '1px solid #F0E6E4',
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: isMobile ? '8px 12px' : '12px',
        fontSize: '0.82rem'
      }}>
        <div>
          <span style={{ color: '#89726B', display: 'block', fontSize: '0.72rem' }}>Mã Order / Session:</span>
          <span style={{ fontWeight: 800, color: '#1F1B1A' }}>{tableData.orderCode}</span>
        </div>
        <div>
          <span style={{ color: '#89726B', display: 'block', fontSize: '0.72rem' }}>Số lượng khách:</span>
          <span style={{ fontWeight: 800, color: '#1F1B1A' }}>{tableData.guests} người lớn</span>
        </div>
        <div>
          <span style={{ color: '#89726B', display: 'block', fontSize: '0.72rem' }}>Thời gian vào bàn:</span>
          <span style={{ fontWeight: 800, color: '#1F1B1A' }}>{tableData.timeIn} (45 phút)</span>
        </div>
        <div>
          <span style={{ color: '#89726B', display: 'block', fontSize: '0.72rem' }}>Nhân viên phục vụ:</span>
          <span style={{ fontWeight: 800, color: '#9D4124' }}>{tableData.waiter}</span>
        </div>
      </div>

      {/* Main Grid: Items in Service + Live Calculation */}
      <div style={{
        display: isMobile ? 'flex' : 'grid',
        flexDirection: isMobile ? 'column' : undefined,
        gridTemplateColumns: isMobile ? undefined : 'repeat(12, 1fr)',
        gap: isMobile ? '14px' : '20px'
      }}>
        {/* Left Column: Itemized Dish Status (8 cols on desktop) */}
        <div style={{
          gridColumn: isMobile ? undefined : 'span 8',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: isMobile ? '16px' : '24px',
          border: '1px solid #F0E6E4',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: isMobile ? '1.05rem' : '1.15rem', color: '#1F1B1A', margin: 0 }}>
              Danh Sách Món Ăn ({tableData.items.length} món)
            </h3>
            <button
              type="button"
              onClick={() => setShowAddDishModal(true)}
              style={{
                background: '#FCF1EF',
                color: '#9D4124',
                border: '1px solid #FFDBC9',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Icon name="add" size={16} /> Thêm Món
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tableData.items.map((item, idx) => {
              let statusBadge = { bg: '#E8F5E9', color: '#2E7D32', text: 'Đã lên món' };
              if (item.status === 'PENDING') statusBadge = { bg: '#FEF3C7', color: '#B45309', text: 'Chờ tiếp nhận' };
              else if (item.status === 'COOKING') statusBadge = { bg: '#FFF8E1', color: '#B45309', text: 'Đang nấu (Bếp)' };
              else if (item.status === 'READY') statusBadge = { bg: '#DCFCE7', color: '#15803D', text: 'Quầy Pass (Sẵn sàng)' };
              else if (item.status === 'WAITER_PREP' || item.status === 'BREWING') statusBadge = { bg: '#DDE8AB', color: '#3B4800', text: 'Waiter lấy nước' };
              else if (item.status === 'CANCELLED') statusBadge = { bg: '#FFDAD6', color: '#BA1A1A', text: 'Đã hủy' };

              return (
                <div
                  key={item.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: isMobile ? '10px 12px' : '14px 16px',
                    borderRadius: '14px',
                    background: '#FFF8F6',
                    border: '1px solid #F6ECEA'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px', minWidth: 0, flex: 1 }}>
                    <span style={{
                      width: isMobile ? '28px' : '32px',
                      height: isMobile ? '28px' : '32px',
                      borderRadius: '8px',
                      background: '#9D4124',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {item.qty}x
                    </span>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: isMobile ? '0.88rem' : '0.95rem', color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#89726B', marginTop: '1px' }}>
                        {item.category} • {item.price.toLocaleString('vi-VN')}₫
                      </div>
                      {item.note && (
                        <div style={{ fontSize: '0.72rem', color: '#BA1A1A', fontWeight: 600, marginTop: '1px' }}>
                          {item.note}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-end' : 'center', gap: isMobile ? '4px' : '12px', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      background: statusBadge.bg,
                      color: statusBadge.color
                    }}>
                      {statusBadge.text}
                    </span>

                    {item.status === 'READY' && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await waiterApi.deliverSingleItem(tableData.id, item.id);
                            fetchTablesAndDetails();
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        style={{
                          background: '#596232',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Bưng đĩa này
                      </button>
                    )}

                    <span style={{ fontWeight: 800, fontSize: isMobile ? '0.88rem' : '1rem', color: '#1F1B1A', minWidth: isMobile ? 'auto' : '90px', textAlign: 'right' }}>
                      {(item.price * item.qty).toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Order Bill Summary & Fast Actions (4 cols on desktop) */}
        <div style={{ gridColumn: isMobile ? undefined : 'span 4', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: isMobile ? '16px' : '24px',
            border: '1px solid #F0E6E4',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
          }}>
            <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#1F1B1A', margin: '0 0 16px' }}>
              Tạm Tính Hiện Tại
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#56423D' }}>
                <span>Tổng tiền món:</span>
                <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{subtotal.toLocaleString('vi-VN')}₫</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#89726B', fontStyle: 'italic', fontSize: '0.8rem' }}>
                <span>Thuế GTGT:</span>
                <span>Đã gồm trong giá món</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#56423D' }}>
                <span>Phí dịch vụ:</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>Miễn phí</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                borderTop: '1px dashed #EAE0DE',
                paddingTop: '12px',
                marginTop: '6px'
              }}>
                <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#1F1B1A' }}>
                  Tổng cộng:
                </span>
                <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.45rem', color: '#9D4124' }}>
                  {total.toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowAddDishModal(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#9D4124',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Icon name="restaurant_menu" size={20} />
                Gọi Thêm Món Cho Bàn
              </button>

              <button
                type="button"
                onClick={() => showToast(`Đã in phiếu kiểm đồ tạm tính cho ${tableData.code}`)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#F6ECEA',
                  color: '#56423D',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Icon name="print" size={18} />
                In Phiếu Tạm Tính (Khách Kiểm Đồ)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Floating Action Bar */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          bottom: '62px',
          left: 0,
          right: 0,
          background: '#FFFFFF',
          borderTop: '1px solid #EAE0DE',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
          zIndex: 990
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#89726B' }}>Tạm tính tổng đơn</div>
            <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.15rem', color: '#9D4124' }}>
              {total.toLocaleString('vi-VN')}₫
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {tableData.items.length === 0 && (
              <button
                type="button"
                onClick={handleCloseEmptyTable}
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: '#FFDAD6',
                  border: '1px solid #FFB4AB',
                  color: '#93000A',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <Icon name="event_busy" size={16} />
                Đóng 0đ
              </button>
            )}
            <button
              type="button"
              disabled={tableData.status === 'AWAITING_PAYMENT'}
              onClick={handleRequestPayment}
              style={{
                padding: '9px 12px',
                borderRadius: '10px',
                background: tableData.status === 'AWAITING_PAYMENT' ? '#FFDBC9' : '#FFF8F6',
                border: tableData.status === 'AWAITING_PAYMENT' ? '1px solid #FFB68C' : '1px solid #FFDBC9',
                color: tableData.status === 'AWAITING_PAYMENT' ? '#753400' : '#BA1A1A',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: tableData.status === 'AWAITING_PAYMENT' ? 'default' : 'pointer'
              }}
            >
              <Icon name="point_of_sale" size={16} />
              {tableData.status === 'AWAITING_PAYMENT' ? 'Đã Báo POS' : 'Thu Ngân'}
            </button>

            <button
              type="button"
              onClick={() => setShowAddDishModal(true)}
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                background: '#9D4124',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(157, 65, 36, 0.25)'
              }}
            >
              <Icon name="add_circle" size={18} />
              Gọi Thêm Món
            </button>
          </div>
        </div>
      )}

      {/* MODAL / DRAWER: GỌI THÊM MÓN TẠI BÀN (SCR-06) */}
      {showAddDishModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: isMobile ? '0' : '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: isMobile ? '24px 24px 0 0' : '24px',
            maxWidth: '920px',
            width: '100%',
            maxHeight: isMobile ? '92vh' : '90vh',
            height: isMobile ? '92vh' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: isMobile ? '14px 16px 10px' : '20px 24px',
              borderBottom: '1px solid #F0E6E4'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9D4124', background: '#FFDBC9', padding: '2px 8px', borderRadius: '6px' }}>
                      HỖ TRỢ GỌI MÓN TẠI BÀN
                    </span>
                  </div>
                  <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: isMobile ? '1.15rem' : '1.3rem', color: '#1F1B1A', margin: '3px 0 0' }}>
                    Gọi Thêm Món Cho {tableData.code} ({tableData.name})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddDishModal(false)}
                  style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#F6ECEA', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Icon name="close" size={18} />
                </button>
              </div>

              {/* Mobile Tab Selector */}
              {isMobile && (
                <div style={{ display: 'flex', background: '#F6ECEA', borderRadius: '10px', padding: '3px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setMobileModalTab('CATALOG')}
                    style={{
                      flex: 1,
                      padding: '7px',
                      borderRadius: '8px',
                      border: 'none',
                      background: mobileModalTab === 'CATALOG' ? '#FFFFFF' : 'transparent',
                      color: mobileModalTab === 'CATALOG' ? '#9D4124' : '#56423D',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Thực Đơn Món
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileModalTab('CART')}
                    style={{
                      flex: 1,
                      padding: '7px',
                      borderRadius: '8px',
                      border: 'none',
                      background: mobileModalTab === 'CART' ? '#FFFFFF' : 'transparent',
                      color: mobileModalTab === 'CART' ? '#9D4124' : '#56423D',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    Đã Chọn ({cartToAdd.reduce((s, i) => s + i.qty, 0)})
                  </button>
                </div>
              )}
            </div>

            {/* Split Body: Menu Catalog + Selection Cart */}
            <div style={{
              display: isMobile ? 'flex' : 'grid',
              flexDirection: isMobile ? 'column' : undefined,
              gridTemplateColumns: isMobile ? undefined : '1.4fr 1fr',
              flex: 1,
              overflowY: 'auto'
            }}>
              {/* Menu Catalog (Left or Tab 1) */}
              {(!isMobile || mobileModalTab === 'CATALOG') && (
                <div style={{
                  padding: isMobile ? '12px' : '20px',
                  borderRight: isMobile ? 'none' : '1px solid #F0E6E4',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  flex: 1,
                  overflowY: 'auto'
                }}>
                  {/* Search & Category filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FDF7F5', border: '1px solid #EAE0DE', borderRadius: '10px', padding: '8px 12px' }}>
                    <Icon name="search" size={18} style={{ color: '#89726B' }} />
                    <input
                      type="text"
                      placeholder="Tìm nhanh món ăn, đồ uống..."
                      value={searchDish}
                      onChange={(e) => setSearchDish(e.target.value)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedCat('ALL')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: selectedCat === 'ALL' ? '#9D4124' : '#F6ECEA',
                        color: selectedCat === 'ALL' ? '#FFFFFF' : '#56423D',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Tất cả
                    </button>
                    {availableCategories.filter(cat => cat !== 'ALL').map(catName => (
                      <button
                        key={catName}
                        type="button"
                        onClick={() => setSelectedCat(catName)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: selectedCat === catName ? '#9D4124' : '#F6ECEA',
                          color: selectedCat === catName ? '#FFFFFF' : '#56423D',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {catName}
                      </button>
                    ))}
                  </div>

                  {/* Dish Grid */}
                  <div style={{
                    display: filteredCatalog.length === 0 ? 'block' : 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: isMobile ? '8px' : '10px',
                    maxHeight: isMobile ? 'none' : '380px',
                    overflowY: 'auto'
                  }}>
                    {filteredCatalog.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '36px 16px', color: '#89726B' }}>
                        <Icon name="search_off" size={28} style={{ color: '#D1C2BE', marginBottom: '8px' }} />
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Không tìm thấy món ăn nào</div>
                      </div>
                    ) : (
                      filteredCatalog.map(dish => (
                        <div
                          key={dish.id}
                          onClick={() => handleSelectDish(dish)}
                          style={{
                            background: '#FFF8F6',
                            border: '1px solid #F0E6E4',
                            borderRadius: '12px',
                            padding: isMobile ? '8px 10px' : '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '6px',
                            transition: 'transform 0.15s ease'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 800, fontSize: isMobile ? '0.8rem' : '0.85rem', color: '#1F1B1A', lineHeight: 1.25 }}>
                              {dish.name}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#89726B' }}>
                              {dish.category}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <span style={{ fontWeight: 800, fontSize: isMobile ? '0.8rem' : '0.85rem', color: '#9D4124' }}>
                              {dish.price.toLocaleString('vi-VN')}₫
                            </span>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#9D4124', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon name="add" size={16} />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Mobile Quick Cart Bar when items are selected */}
                  {isMobile && cartToAdd.length > 0 && (
                    <div style={{
                      position: 'sticky',
                      bottom: 0,
                      background: '#FFFFFF',
                      borderTop: '1px solid #EAE0DE',
                      padding: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderRadius: '12px',
                      boxShadow: '0 -4px 12px rgba(0,0,0,0.06)'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#89726B', display: 'block' }}>
                          Đã chọn {cartToAdd.reduce((s, i) => s + i.qty, 0)} món
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#9D4124' }}>
                          {cartToAdd.reduce((s, i) => s + (i.price * i.qty), 0).toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMobileModalTab('CART')}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '10px',
                          background: '#9D4124',
                          color: '#FFFFFF',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Xem & Gửi Bếp <Icon name="arrow_forward" size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Selection Cart (Right or Tab 2) */}
              {(!isMobile || mobileModalTab === 'CART') && (
                <div style={{
                  padding: isMobile ? '14px' : '20px',
                  background: '#FCF1EF',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  flex: 1,
                  overflowY: 'auto'
                }}>
                  <div>
                    <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#1F1B1A', margin: '0 0 12px' }}>
                      Món Vừa Chọn ({cartToAdd.reduce((s, i) => s + i.qty, 0)} phần)
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: isMobile ? 'calc(92vh - 270px)' : '320px', overflowY: 'auto' }}>
                      {cartToAdd.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#89726B', fontSize: '0.82rem' }}>
                          Chưa chọn món nào. Hãy chọn món từ thực đơn để thêm vào đơn.
                        </div>
                      ) : (
                        cartToAdd.map(item => (
                          <div
                            key={item.id}
                            style={{
                              background: '#FFFFFF',
                              borderRadius: '10px',
                              padding: '10px 12px',
                              border: '1px solid #EAE0DE'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1F1B1A' }}>
                                {item.name}
                              </span>
                              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#9D4124' }}>
                                {(item.price * item.qty).toLocaleString('vi-VN')}₫
                              </span>
                            </div>

                            {/* Note input */}
                            <input
                              type="text"
                              placeholder="Ghi chú (ít đá, không cay...)"
                              value={item.note || ''}
                              onChange={(e) => handleUpdateCartNote(item.id, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #F0E6E4',
                                background: '#FFF8F6',
                                fontSize: '0.72rem',
                                marginTop: '6px',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            />

                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(item.id, -1)}
                                style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid #EAE0DE', background: '#F6ECEA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                -
                              </button>
                              <span style={{ fontWeight: 800, fontSize: '0.82rem' }}>{item.qty}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(item.id, 1)}
                                style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid #EAE0DE', background: '#F6ECEA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Footer Send to Kitchen/Bar */}
                  <div style={{ borderTop: '1px solid #EAE0DE', paddingTop: '14px', marginTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#56423D' }}>Tổng tiền gọi thêm:</span>
                      <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.15rem', color: '#9D4124' }}>
                        {cartToAdd.reduce((s, i) => s + (i.price * i.qty), 0).toLocaleString('vi-VN')}₫
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={cartToAdd.length === 0}
                      onClick={handleConfirmAddDishes}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        background: cartToAdd.length === 0 ? '#EAE0DE' : '#9D4124',
                        color: cartToAdd.length === 0 ? '#89726B' : '#FFFFFF',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: cartToAdd.length === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Icon name="send" size={18} />
                      Gửi Gọi Món: Đồ Ăn Vào Bếp • Nước Cho Waiter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
