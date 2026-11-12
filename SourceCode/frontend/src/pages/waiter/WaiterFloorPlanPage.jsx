import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { waiterApi } from '../../api/waiterApi';
import { broadcastRealtimeEvent, subscribeRealtimeEvents } from '../../utils/realtimeSync';

import Icon from '../../components/common/Icon';
import { useDialog } from '../../context/DialogContext';
import './waiterMobile.css';

// Âm thanh chuông báo phục vụ nhẹ nhàng bằng Web Audio API
const playWaiterChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // Note D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // Ramp to A5
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // Ramp to D6
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  } catch (err) {
    // Trình duyệt có thể chặn audio nếu chưa tương tác
  }
};

export default function WaiterFloorPlanPage() {
  const navigate = useNavigate();
  const { showConfirm, showAlert } = useDialog();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tables, setTables] = useState([]);
  const [menuCatalog, setMenuCatalog] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [selectedTable, setSelectedTable] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 1024);

  // Danh mục các khu vực động tải từ backend
  const [zonesList, setZonesList] = useState([
    { zoneCode: 'ZONE_1', name: 'Tầng 1 - Sảnh Chính' },
    { zoneCode: 'ZONE_2', name: 'Tầng 2 - Ban Công' },
    { zoneCode: 'VIP', name: 'Phòng VIP' }
  ]);

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
            note: item.note || (
              item.status === 'READY' ? 'Quầy Pass sẵn sàng' :
                item.status === 'COOKING' ? 'Bếp đang nấu KDS' :
                  item.status === 'PENDING' ? 'Chờ bếp nhận món' :
                    item.status === 'SERVED' ? 'Đã lên bàn' : 'Chờ xử lý'
            )
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

    // Tự động tải lại ngay lập tức khi người dùng chuyển tab lại giao diện phục vụ
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadFloorPlan();
      }
    };
    window.addEventListener('focus', loadFloorPlan);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', loadFloorPlan);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [selectedZone]);

  useEffect(() => {
    const unsubscribe = subscribeRealtimeEvents((event) => {
      if (event?.type === 'WAITER_ITEM_READY') {
        playWaiterChime();
        const tbl = event.tableNumber ? (event.tableNumber.toLowerCase().includes('phòng') ? event.tableNumber : `Bàn ${event.tableNumber}`) : 'Bàn ăn';
        const itemsMsg = event.payload?.itemsText || event.note || 'Có món trạm Phục Vụ sẵn sàng lên bàn';
        setToastMessage(`🔔 [${tbl}] Trạm Phục Vụ: ${itemsMsg}`);
        setTimeout(() => setToastMessage(null), 4000);
        loadFloorPlan();
        return;
      }

      if (event?.type === 'TABLE_UPDATE' || event?.type === 'PAYMENT_REQUEST' || event?.type === 'ORDER_UPDATE' || event?.type === 'NEW_ORDER_CREATED' || event?.type === 'CALL_WAITER') {
        loadFloorPlan();
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await waiterApi.getMenu();
      if (res.data && res.data.success) {
        setMenuCatalog(res.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi tải thực đơn món:", err);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await waiterApi.getZones();
        if (res.data && res.data.success && res.data.data && res.data.data.length > 0) {
          setZonesList(res.data.data);
        }
      } catch (err) {
        console.warn("Lỗi tải danh mục khu vực:", err);
      }
    };
    fetchZones();
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
  const [mobileOrderModalTab, setMobileOrderModalTab] = useState('CATALOG'); // 'CATALOG' | 'CART'
  const [showQrModal, setShowQrModal] = useState(false);

  // Giỏ hàng gọi món của Waiter (Waiter Order Pad)
  const [orderCart, setOrderCart] = useState([]);
  const [orderGeneralNote, setOrderGeneralNote] = useState('');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

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
      broadcastRealtimeEvent({ type: 'TABLE_UPDATE', tableId: tableId, status: 'OCCUPIED' });
      broadcastRealtimeEvent({ type: 'NEW_ORDER_CREATED', tableId: tableId });
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi mở phiên phục vụ bàn');
    }
  };

  const handleCancelReservation = async (tableId) => {
    try {
      await waiterApi.cancelReservation(tableId);
      showToast('Đã hủy đặt bàn và trả bàn về trạng thái Trống!');
      setShowTableModal(false);
      await loadFloorPlan();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi hủy đặt bàn');
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

  const handleDeliverSingleItem = async (tableId, itemId, itemName) => {
    try {
      await waiterApi.deliverSingleItem(tableId, itemId);
      showToast(`Đã xác nhận bưng món [${itemName || 'Món ăn'}] lên bàn!`);
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
      setShowTableModal(false);
      showToast(`Đã chuyển toàn bộ hóa đơn từ ${selectedTable.label || selectedTable.tableNumber} sang ${targetTable.label || targetTable.tableNumber}!`);
      await loadFloorPlan();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi chuyển bàn');
    }
  };

  // Mở modal gọi món và khởi tạo giỏ hàng
  const handleOpenOrderModal = () => {
    setOrderCart([]);
    setOrderGeneralNote('');
    setMenuSearchQuery('');
    setSelectedCategory('ALL');
    if (!menuCatalog || menuCatalog.length === 0) {
      fetchMenu();
    }
    setShowOrderModal(true);
  };

  // Thêm món vào giỏ hàng hoặc tăng số lượng
  const handleAddToCart = (dish) => {
    setOrderCart(prev => {
      const existing = prev.find(item => item.menuItemId === dish.id);
      if (existing) {
        return prev.map(item =>
          item.menuItemId === dish.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          menuItemId: dish.id,
          name: dish.name,
          price: dish.price,
          imageUrl: dish.imageUrl,
          category: dish.category,
          quantity: 1,
          note: ''
        }
      ];
    });
  };

  // Giảm số lượng món trong giỏ (nếu về 0 thì tự xóa khỏi giỏ)
  const handleDecreaseQuantity = (menuItemId) => {
    setOrderCart(prev => {
      const existing = prev.find(item => item.menuItemId === menuItemId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter(item => item.menuItemId !== menuItemId);
      }
      return prev.map(item =>
        item.menuItemId === menuItemId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };

  // Xóa món hoàn toàn khỏi giỏ hàng
  const handleRemoveFromCart = (menuItemId) => {
    setOrderCart(prev => prev.filter(item => item.menuItemId !== menuItemId));
  };

  // Cập nhật ghi chú riêng cho từng món
  const handleUpdateItemNote = (menuItemId, note) => {
    setOrderCart(prev =>
      prev.map(item =>
        item.menuItemId === menuItemId
          ? { ...item, note }
          : item
      )
    );
  };

  // Gửi toàn bộ giỏ hàng thành 1 ĐỢT GỌI DUY NHẤT vào Bếp KDS
  const handleSubmitOrderToKitchen = async () => {
    if (isSubmittingOrder) return;
    if (!selectedTable) return;
    if (orderCart.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 món ăn vào phiếu gọi món!');
      return;
    }

    try {
      setIsSubmittingOrder(true);
      const payload = {
        items: orderCart.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          note: item.note ? item.note.trim() : ''
        })),
        note: orderGeneralNote ? orderGeneralNote.trim() : ''
      };

      const res = await waiterApi.addOrder(selectedTable.id, payload);
      if (res.data && res.data.success) {
        const totalItemsCount = orderCart.reduce((sum, it) => sum + it.quantity, 0);
        showToast(`Đã gửi đợt gọi ${totalItemsCount} món vào bếp cho ${selectedTable.label || selectedTable.tableNumber}!`);
        setShowOrderModal(false);
        setOrderCart([]);
        setOrderGeneralNote('');
        await loadFloorPlan();
      }
    } catch (err) {
      console.error('Lỗi khi gửi đơn vào bếp:', err);
      showToast(err.response?.data?.message || 'Lỗi khi gửi đơn vào bếp');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleRequestPayment = async (tableId) => {
    const targetTable = tables.find(t => t.id === tableId) || selectedTable;
    if (targetTable && (targetTable.orderTotal === 0 || !targetTable.items || targetTable.items.length === 0)) {
      showToast('Bàn chưa gọi món ăn nào (0đ), không thể gửi yêu cầu tính tiền!');
      return;
    }
    try {
      const res = await waiterApi.requestPayment(tableId);
      showToast('Đã gửi thông báo yêu cầu thanh toán sang Quầy Thu Ngân POS!');
      if (res.data?.data) {
        setSelectedTable(prev => prev && prev.id === tableId ? { ...prev, ...res.data.data, status: 'AWAITING_PAYMENT' } : prev);
      }
      await loadFloorPlan();
      broadcastRealtimeEvent({
        type: 'PAYMENT_REQUEST',
        tableId: tableId,
        tableName: targetTable?.label || targetTable?.tableNumber || `Bàn #${tableId}`
      });
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi gửi yêu cầu thanh toán');
    }
  };

  const handleCloseEmptyTable = async (tableId) => {
    const target = tables.find(t => t.id === tableId) || selectedTable;
    const name = target?.label || target?.tableNumber || `Bàn #${tableId}`;
    const confirmed = await showConfirm({
      title: 'Đóng phiên bàn trống',
      message: `Xác nhận đóng phiên ăn 0đ và giải phóng ${name}?\n(Dành cho trường hợp khách không dùng món hoặc mở nhầm bàn)`,
      confirmText: 'Đóng bàn',
      type: 'warning'
    });
    if (!confirmed) return;
    try {
      await waiterApi.closeEmptySession(tableId, { reason: 'Khách không dùng món / Hủy bàn trống', targetStatus: 'AVAILABLE' });
      showToast(`Đã đóng phiên bàn trống thành công cho ${name}!`);
      setShowTableModal(false);
      await loadFloorPlan();
      broadcastRealtimeEvent({ type: 'TABLE_UPDATE', tableId: tableId, status: 'AVAILABLE' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi đóng phiên bàn trống!');
    }
  };

  // Helper lấy Badge cảnh báo thời gian ngồi bàn (Table Dwell Time Alert)
  const getDwellTimeBadge = (t) => {
    const isOccupied = t.status === 'OCCUPIED' || t.status === 'FOOD_READY' || t.status === 'AWAITING_PAYMENT' || t.status === 'CALLING';
    if (!isOccupied) return null;

    const minutes = typeof t.durationMinutes === 'number' ? Math.max(0, t.durationMinutes) : 0;
    const timeText = (t.duration && !t.duration.startsWith('-')) ? t.duration : `${minutes} phút`;

    if (minutes >= 90) {
      // Cảnh báo đỏ (> 90 phút) - Ngồi lâu
      return (
        <span
          title={`Bàn ngồi rất lâu (${timeText}), cần chú ý chăm sóc hoặc kiểm tra nhu cầu thanh toán!`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '0.68rem',
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: '12px',
            background: '#FEE2E2',
            color: '#B91C1C',
            border: '1px solid #FCA5A5',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <Icon name="warning" size={13} style={{ color: '#B91C1C' }} />
          {timeText}
        </span>
      );
    } else if (minutes >= 60) {
      // Cảnh báo vàng (60 - 89 phút) - Sắp dùng xong
      return (
        <span
          title={`Bàn ngồi ${timeText}, dự kiến sắp dùng xong bữa ăn.`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '12px',
            background: '#FEF3C7',
            color: '#B45309',
            border: '1px solid #FCD34D',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <Icon name="timer" size={13} style={{ color: '#B45309' }} />
          {timeText}
        </span>
      );
    } else {
      // Bình thường (< 60 phút)
      return (
        <span
          title={`Thời gian ngồi: ${timeText}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '0.68rem',
            fontWeight: 600,
            padding: '2px 7px',
            borderRadius: '12px',
            background: '#ECFDF5',
            color: '#047857',
            border: '1px solid #A7F3D0',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <Icon name="schedule" size={13} style={{ color: '#047857' }} />
          {timeText}
        </span>
      );
    }
  };

  const getStatusBadge = (t) => {
    if (t.status === 'CALLING' || t.calling) {
      return (
        <span style={{
          background: '#BA1A1A',
          color: '#FFF',
          padding: '3px 9px',
          borderRadius: '9999px',
          fontWeight: 800,
          fontSize: '0.74rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          animation: 'pulse 1.5s infinite',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(186, 26, 26, 0.35)'
        }}>
          <Icon name="campaign" size={15} /> CẦN PHỤC VỤ
        </span>
      );
    }
    if (t.status === 'FOOD_READY') {
      return (
        <span style={{
          background: '#596232',
          color: '#FFF',
          padding: '3px 9px',
          borderRadius: '9999px',
          fontWeight: 800,
          fontSize: '0.74rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(89, 98, 50, 0.25)'
        }}>
          <Icon name="soup_kitchen" size={15} /> BẾP XONG MÓN
        </span>
      );
    }
    if (t.status === 'AWAITING_PAYMENT') {
      return (
        <span style={{
          background: '#EFF6FF',
          color: '#1E40AF',
          border: '1.5px solid #93C5FD',
          padding: '3px 9px',
          borderRadius: '9999px',
          fontWeight: 800,
          fontSize: '0.74rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          <Icon name="receipt" size={15} style={{ color: '#1E40AF' }} /> CHỜ TÍNH TIỀN
        </span>
      );
    }
    if (t.status === 'AVAILABLE') {
      return (
        <span style={{
          background: '#ECFDF5',
          color: '#065F46',
          border: '1.5px solid #A7F3D0',
          padding: '3px 9px',
          borderRadius: '9999px',
          fontWeight: 700,
          fontSize: '0.74rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#059669' }} />
          SẴN SÀNG
        </span>
      );
    }
    if (t.status === 'DIRTY') {
      return (
        <span style={{
          background: '#F3F4F6',
          color: '#374151',
          border: '1px solid #D1D5DB',
          padding: '3px 9px',
          borderRadius: '9999px',
          fontWeight: 700,
          fontSize: '0.74rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          <Icon name="cleaning_services" size={15} /> CHỜ DỌN BÀN
        </span>
      );
    }
    if (t.status === 'RESERVED') {
      return (
        <span style={{
          background: '#FEF3C7',
          color: '#78350F',
          border: '1.5px solid #FDE68A',
          padding: '3px 9px',
          borderRadius: '9999px',
          fontWeight: 700,
          fontSize: '0.74rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          <Icon name="bookmark" size={15} /> ĐÃ ĐẶT
        </span>
      );
    }
    if (t.status === 'OCCUPIED') {
      return (
        <span style={{
          background: '#FFF1EC',
          color: '#9D4124',
          border: '1.5px solid #FFDBC9',
          padding: '3px 9px',
          borderRadius: '9999px',
          fontWeight: 800,
          fontSize: '0.74rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          <Icon name="restaurant" size={14} style={{ color: '#9D4124' }} />
          ĐANG PHỤC VỤ
        </span>
      );
    }
    if (t.status === 'BLOCKED') {
      return (
        <span style={{
          background: '#F5F5F4',
          color: '#57534E',
          border: '1px solid #E7E5E4',
          padding: '3px 9px',
          borderRadius: '9999px',
          fontWeight: 700,
          fontSize: '0.74rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          <Icon name="lock" size={14} style={{ color: '#57534E' }} />
          ĐÃ KHÓA
        </span>
      );
    }
    return (
      <span style={{
        background: '#FFFBEB',
        color: '#92400E',
        border: '1px solid #FDE68A',
        padding: '3px 9px',
        borderRadius: '9999px',
        fontWeight: 700,
        fontSize: '0.74rem',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <Icon name="schedule" size={14} /> {(t.duration && !t.duration.startsWith('-')) ? t.duration : 'Đang ăn'}
      </span>
    );
  };

  const getBorderColor = (t) => {
    if (t.status === 'CALLING' || t.calling) return '#BA1A1A';
    if (t.status === 'FOOD_READY') return '#596232';
    if (t.status === 'AWAITING_PAYMENT') return '#2563EB';
    if (t.status === 'AVAILABLE') return '#059669';
    if (t.status === 'DIRTY') return '#6B7280';
    if (t.status === 'RESERVED') return '#D97706';
    if (t.status === 'BLOCKED') return '#9CA3AF';
    if (t.status === 'OCCUPIED') return '#9D4124';
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
                {getDwellTimeBadge(table)}
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
                  {(table.duration && !table.duration.startsWith('-')) ? `${table.duration} trước` : 'Vừa vào'}
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
                      {item.status === 'PENDING' && (
                        <span style={{ color: '#B45309', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px', background: '#FEF3C7', padding: '2px 6px', borderRadius: '4px' }}>
                          <Icon name="hourglass_top" size={14} /> Chờ bếp
                        </span>
                      )}
                      {item.status === 'READY' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#15803D', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px', background: '#DCFCE7', padding: '2px 6px', borderRadius: '4px' }}>
                            <Icon name="soup_kitchen" size={14} /> Quầy Pass
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeliverSingleItem(table.id, item.orderItemId || item.id, item.name);
                            }}
                            title="Xác nhận chỉ vừa bưng riêng đĩa này lên bàn"
                            style={{
                              background: '#596232',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <Icon name="check" size={12} /> Bưng đĩa này
                          </button>
                        </div>
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
            ) : table.status === 'RESERVED' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  background: '#FFFBEB',
                  padding: '14px',
                  borderRadius: '14px',
                  border: '1px solid #FCD34D'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.88rem', color: '#92400E', marginBottom: '6px' }}>
                    <Icon name="event_seat" size={18} />
                    Thông Tin Khách Đặt Bàn
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#78350F', lineHeight: 1.5 }}>
                    <div>👤 <strong>Khách hàng:</strong> {table.reservationInfo || 'Khách đặt trước'}</div>
                    <div>⏰ <strong>Giờ hẹn:</strong> {table.reservedTime || 'Hôm nay'}</div>
                    <div>🪑 <strong>Quy mô:</strong> {table.seats} chỗ ngồi</div>
                  </div>
                </div>

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
                  <Icon name="check_circle" size={20} /> Khách Đã Đến - Mở Bàn (Check-in)
                </button>

                <button
                  type="button"
                  onClick={() => handleCancelReservation(table.id)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '12px',
                    background: '#FFFFFF',
                    color: '#BA1A1A',
                    border: '1px solid #FFDAD6',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Icon name="cancel" size={18} /> Khách Hủy / Quá Giờ (Hủy Đặt Bàn)
                </button>
              </div>
            ) : table.status === 'BLOCKED' ? (
              <div style={{
                background: '#F5F5F4',
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid #E7E5E4',
                textAlign: 'center',
                color: '#57534E'
              }}>
                <Icon name="lock" size={32} style={{ color: '#78716C', marginBottom: '6px' }} />
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#292524', marginBottom: '4px' }}>
                  Bàn Đang Tạm Khóa
                </div>
                <div style={{ fontSize: '0.82rem' }}>
                  Lý do: <strong>{table.blockedReason || 'Bảo trì trang thiết bị'}</strong>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#A8A29E', marginTop: '6px' }}>
                  Quản lý có thể mở lại bàn từ trang Quản trị Sơ đồ bàn.
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleOpenOrderModal}
                  style={{
                    width: '100%',
                    minHeight: 48,
                    padding: '13px 18px',
                    borderRadius: '14px',
                    background: '#9D4124',
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.96rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(157, 65, 36, 0.28)',
                    transition: 'all 0.15s ease'
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
                      minHeight: 46,
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: '#FFF8F6',
                      border: '1.5px solid #F0E6E4',
                      color: '#1F1B1A',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon name="swap_horiz" size={18} style={{ color: '#9D4124' }} />
                    Chuyển Bàn
                  </button>

                  <button
                    type="button"
                    disabled={table.status === 'AWAITING_PAYMENT'}
                    onClick={() => handleRequestPayment(table.id)}
                    style={{
                      minHeight: 46,
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: '#EFF6FF',
                      border: table.status === 'AWAITING_PAYMENT' ? '1.5px solid #93C5FD' : '1.5px solid #BFDBFE',
                      color: '#1E40AF',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: table.status === 'AWAITING_PAYMENT' ? 'default' : 'pointer',
                      opacity: table.status === 'AWAITING_PAYMENT' ? 0.85 : 1,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon name="point_of_sale" size={18} style={{ color: '#1E40AF' }} />
                    {table.status === 'AWAITING_PAYMENT' ? 'Đã Báo Thu Ngân' : 'Báo Thu Ngân'}
                  </button>
                </div>

                {(table.orderTotal === 0 || !table.items || table.items.length === 0) && (
                  <button
                    type="button"
                    onClick={() => handleCloseEmptyTable(table.id)}
                    style={{
                      width: '100%',
                      minHeight: 46,
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: '#FFDAD6',
                      border: '1px solid #FFB4AB',
                      color: '#93000A',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon name="event_busy" size={18} />
                    Hủy Phiên Bàn Trống (0đ / Khách Rời Đi)
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowQrModal(true);
                  }}
                  style={{
                    minHeight: 44,
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: '#FCF1EF',
                    border: '1px solid #EAE0DE',
                    color: '#56423D',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon name="qr_code_2" size={18} /> Xem Mã QR Khách Quét Đặt Món
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
              {zonesList.map(z => (
                <option key={z.id || z.zoneCode} value={z.zoneCode}>
                  {z.name}
                </option>
              ))}
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
        <div className="waiter-filter-scroll-container">
          {[
            { id: 'ALL', label: 'Tất cả bàn', count: tables.length, color: '#9D4124' },
            { id: 'OCCUPIED', label: 'Đang phục vụ', count: tables.filter(t => t.status === 'OCCUPIED' || t.status === 'FOOD_READY' || t.status === 'AWAITING_PAYMENT').length, color: '#9D4124' },
            { id: 'AVAILABLE', label: 'Bàn trống', count: tables.filter(t => t.status === 'AVAILABLE').length, color: '#059669' },
            { id: 'CALLING', label: 'Cần hỗ trợ', count: tables.filter(t => t.calling).length, color: '#BA1A1A' },
            { id: 'DIRTY', label: 'Chờ dọn bàn', count: tables.filter(t => t.status === 'DIRTY').length, color: '#6B7280' },
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
                  minHeight: 38,
                  padding: '7px 14px',
                  borderRadius: '9999px',
                  border: isActive ? `1.5px solid ${f.color}` : '1px solid #EAE0DE',
                  background: isActive ? f.color : '#FFF8F6',
                  color: isActive ? '#FFFFFF' : '#56423D',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <span>{f.label}</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: isActive ? 'rgba(255,255,255,0.25)' : '#F0E6E4',
                  fontSize: '0.74rem',
                  fontWeight: 800
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
            onClick={async () => {
              await loadFloorPlan();
              showToast('Đã làm mới dữ liệu sơ đồ bàn!');
            }}
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
          <div className="waiter-floor-grid">
            {filteredTables.map(t => {
              const isSelected = selectedTable?.id === t.id;
              const topBorderColor = getBorderColor(t);

              return (
                <div
                  key={t.id}
                  className="waiter-card-table"
                  onClick={() => handleSelectTable(t)}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: isMobile ? '10px 12px' : '14px',
                    boxShadow: isSelected ? '0 8px 24px rgba(157, 65, 36, 0.18)' : '0 2px 10px rgba(0,0,0,0.04)',
                    borderTop: `4px solid ${topBorderColor}`,
                    border: isSelected ? '2px solid #9D4124' : '1px solid #F0E6E4',
                    borderTopColor: topBorderColor,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: isMobile ? '165px' : '170px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    minWidth: 0
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Card Top: Tầng 1 - Số chỗ bên trái & Duy nhất 1 Huy hiệu trạng thái bên phải */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', minWidth: 0 }}>
                      <span style={{
                        fontSize: '0.7rem',
                        background: '#F6ECEA',
                        color: '#56423D',
                        padding: '2px 7px',
                        borderRadius: '9999px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        {t.seats} chỗ
                      </span>

                      {/* Chỉ giữ duy nhất getStatusBadge ở góc phải -> Không bao giờ bị tràn */}
                      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        {getStatusBadge(t)}
                      </div>
                    </div>

                    {/* Card Top: Tầng 2 - Tên bàn nổi bật */}
                    <h4 style={{
                      fontFamily: "'Epilogue', sans-serif",
                      fontWeight: 800,
                      fontSize: isMobile ? '0.96rem' : '1.05rem',
                      color: isSelected ? '#9D4124' : '#1F1B1A',
                      margin: '2px 0 4px',
                      lineHeight: 1.3,
                      wordBreak: 'break-word'
                    }}>
                      {t.label}
                    </h4>

                    {/* Status note & Cảnh báo thời gian ngồi (nếu có) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '2px 0 8px', flexWrap: 'wrap' }}>
                      {getDwellTimeBadge(t)}
                      <span style={{ fontSize: '0.75rem', color: '#56423D', lineHeight: 1.35 }}>
                        {t.statusNote}
                      </span>
                    </div>

                    {/* Thông tin đặt bàn nếu có */}
                    {t.status === 'RESERVED' && (t.reservationInfo || t.reservedTime) && (
                      <div style={{
                        background: '#FFFBEB',
                        padding: '6px 10px',
                        borderRadius: '10px',
                        border: '1px solid #FCD34D',
                        marginBottom: '8px',
                        fontSize: '0.74rem',
                        color: '#92400E'
                      }}>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Icon name="person" size={14} />
                          {t.reservationInfo || 'Khách đặt trước'}
                        </div>
                        {t.reservedTime && (
                          <div style={{ fontSize: '0.72rem', color: '#B45309', marginTop: '2px' }}>
                            ⏰ Giờ hẹn: {t.reservedTime}
                          </div>
                        )}
                      </div>
                    )}

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

                  {/* Card Action footer - Nâng cấp Touch Target công thái học tối thiểu 42-44px */}
                  <div style={{ paddingTop: '8px', borderTop: '1px solid #F6ECEA' }}>
                    {(t.status === 'CALLING' || t.calling) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolveCall(t.id);
                        }}
                        style={{
                          width: '100%',
                          minHeight: 42,
                          padding: '8px 12px',
                          borderRadius: '12px',
                          background: '#BA1A1A',
                          color: '#FFFFFF',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(186, 26, 26, 0.35)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Icon name="touch_app" size={17} /> Đã Nhận Yêu Cầu
                      </button>
                    )}

                    {t.status === 'FOOD_READY' && !t.calling && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmDeliverFood(t.id);
                        }}
                        style={{
                          width: '100%',
                          minHeight: 42,
                          padding: '8px 12px',
                          borderRadius: '12px',
                          background: '#596232',
                          color: '#FFFFFF',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(89, 98, 50, 0.3)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Icon name="room_service" size={17} /> Xác Nhận Đã Bưng Món
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
                            minHeight: 42,
                            padding: '8px 12px',
                            borderRadius: '12px',
                            background: '#ECFDF5',
                            color: '#065F46',
                            border: '1.5px solid #A7F3D0',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Icon name="add_circle" size={17} /> Mở Bàn Ngay
                        </button>
                      </div>
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
                          minHeight: 42,
                          padding: '8px 12px',
                          borderRadius: '12px',
                          background: '#059669',
                          color: '#FFFFFF',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Icon name="check_circle" size={17} /> Nhận Khách (Check-in)
                      </button>
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
                          minHeight: 42,
                          padding: '8px 12px',
                          borderRadius: '12px',
                          background: '#F3F4F6',
                          color: '#1F2937',
                          border: '1px solid #D1D5DB',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Icon name="mop" size={17} /> Đã Dọn Xong & Sẵn Sàng
                      </button>
                    )}

                    {t.status === 'AWAITING_PAYMENT' && !t.calling && (
                      (t.orderTotal === 0 || !t.items || t.items.length === 0) ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseEmptyTable(t.id);
                          }}
                          style={{
                            width: '100%',
                            minHeight: 42,
                            padding: '8px 12px',
                            borderRadius: '12px',
                            background: '#FFDAD6',
                            color: '#93000A',
                            border: 'none',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Icon name="event_busy" size={17} /> Hủy Bàn Trống (0đ)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestPayment(t.id);
                          }}
                          style={{
                            width: '100%',
                            minHeight: 42,
                            padding: '8px 12px',
                            borderRadius: '12px',
                            background: '#EFF6FF',
                            color: '#1E40AF',
                            border: '1.5px solid #93C5FD',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Icon name="point_of_sale" size={17} style={{ color: '#1E40AF' }} /> Gọi POS Thu Ngân
                        </button>
                      )
                    )}

                    {t.status === 'BLOCKED' && (
                      <div style={{ textAlign: 'center', fontSize: '0.74rem', color: '#78716C', padding: '6px', fontWeight: 600 }}>
                        <Icon name="lock" size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        {t.blockedReason || 'Bàn đang tạm khóa'}
                      </div>
                    )}

                    {t.status === 'OCCUPIED' && !t.calling && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTable(t);
                        }}
                        style={{
                          width: '100%',
                          minHeight: 42,
                          padding: '8px 12px',
                          borderRadius: '12px',
                          background: '#FFF8F6',
                          color: '#9D4124',
                          border: '1.5px solid #FFDBC9',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Icon name="restaurant_menu" size={16} />
                          <span>{t.actualGuests ? `${t.actualGuests} khách` : 'Xem & Gọi món'}</span>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.78rem' }}>
                          <span>Chi tiết</span>
                          <Icon name="chevron_right" size={16} />
                        </span>
                      </button>
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

      {/* MODAL 1: Waiter Order Pad - Gọi món theo giỏ hàng (Gom đơn trước khi gửi bếp) */}
      {showOrderModal && selectedTable && (() => {
        const orderCategories = ['ALL', ...new Set(menuCatalog.map(item => item.category).filter(Boolean))];
        const filteredOrderMenu = menuCatalog.filter(item => {
          if (!item.isAvailable) return false;
          if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
          if (menuSearchQuery.trim()) {
            const q = menuSearchQuery.trim().toLowerCase();
            const matchName = (item.name || '').toLowerCase().includes(q);
            const matchCat = (item.category || '').toLowerCase().includes(q);
            return matchName || matchCat;
          }
          return true;
        });
        const cartTotalCount = orderCart.reduce((sum, item) => sum + item.quantity, 0);
        const cartTotalAmount = orderCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(31, 27, 26, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '10px' : '20px'
          }}>
            <div style={{
              background: '#FFFFFF',
              width: '100%',
              maxWidth: isMobile ? '100%' : '940px',
              borderRadius: '24px',
              padding: isMobile ? '16px' : '22px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              maxHeight: isMobile ? '94vh' : '88vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0E6E4', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FFDBC9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="restaurant_menu" size={22} style={{ color: '#9D4124' }} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#1F1B1A', margin: 0 }}>
                      Gọi Món Vào Bàn {selectedTable.tableNumber || selectedTable.label}
                    </h3>
                    <span style={{ fontSize: '0.76rem', color: '#89726B' }}>
                      Khu vực: {selectedTable.zoneName || selectedTable.zone || 'Sảnh chính'} • Đang phục vụ
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#F6ECEA', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#56423D' }}
                  title="Đóng bảng gọi món"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>

              {/* Mobile Order Pad Tabs */}
              {isMobile && (
                <div className="waiter-modal-mobile-tabs">
                  <button
                    type="button"
                    className={`waiter-modal-mobile-tab-btn ${mobileOrderModalTab === 'CATALOG' ? 'active' : ''}`}
                    onClick={() => setMobileOrderModalTab('CATALOG')}
                  >
                    <Icon name="restaurant_menu" size={16} />
                    <span>Thực Đơn ({filteredOrderMenu.length})</span>
                  </button>
                  <button
                    type="button"
                    className={`waiter-modal-mobile-tab-btn ${mobileOrderModalTab === 'CART' ? 'active' : ''}`}
                    onClick={() => setMobileOrderModalTab('CART')}
                  >
                    <Icon name="shopping_cart" size={16} />
                    <span>Phiếu Món ({cartTotalCount})</span>
                  </button>
                </div>
              )}

              {/* Modal Body: 2 Phân vùng Thực Đơn & Giỏ Hàng (Order Pad) */}
              <div style={{
                display: isMobile ? 'flex' : 'grid',
                flexDirection: isMobile ? 'column' : 'row',
                gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.35fr) minmax(0, 1.05fr)',
                gap: '16px',
                flex: 1,
                overflow: 'hidden',
                minHeight: 0
              }}>
                {/* CỘT TRÁI: Thực đơn món ăn (Menu Catalog) */}
                <div style={{
                  display: (isMobile && mobileOrderModalTab === 'CART') ? 'none' : 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  gap: '10px',
                  overflow: 'hidden',
                  width: '100%'
                }}>
                  {/* Thanh tìm kiếm & lọc category */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Icon name="search" size={18} style={{ position: 'absolute', left: 10, color: '#89726B', pointerEvents: 'none' }} />
                      <input
                        type="text"
                        value={menuSearchQuery}
                        onChange={(e) => setMenuSearchQuery(e.target.value)}
                        placeholder="Tìm món theo tên hoặc loại món..."
                        style={{
                          width: '100%',
                          padding: '8px 28px 8px 34px',
                          borderRadius: '10px',
                          border: '1px solid #EAE0DE',
                          fontSize: '0.84rem',
                          fontFamily: 'Plus Jakarta Sans',
                          outline: 'none',
                          background: '#FFF8F6'
                        }}
                      />
                      {menuSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setMenuSearchQuery('')}
                          style={{ position: 'absolute', right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#89726B', display: 'flex', alignItems: 'center' }}
                        >
                          <Icon name="close" size={14} />
                        </button>
                      )}
                    </div>

                    {/* Category tabs */}
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                      {orderCategories.map(cat => {
                        const isActive = selectedCategory === cat;
                        const label = cat === 'ALL' ? 'Tất cả' : cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              border: isActive ? 'none' : '1px solid #EAE0DE',
                              background: isActive ? '#9D4124' : '#FFF8F6',
                              color: isActive ? '#FFF' : '#56423D',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Danh sách món ăn cuộn được */}
                  <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                    {filteredOrderMenu.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: '#89726B', fontSize: '0.85rem' }}>
                        <Icon name="search_off" size={32} style={{ color: '#D1C2BE', marginBottom: '6px' }} />
                        <div>Không tìm thấy món ăn nào</div>
                        {menuCatalog.length === 0 && (
                          <button
                            type="button"
                            onClick={fetchMenu}
                            style={{
                              marginTop: '10px',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              background: '#9D4124',
                              color: '#FFF',
                              border: 'none',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Tải lại thực đơn
                          </button>
                        )}
                      </div>
                    ) : (
                      filteredOrderMenu.map(dish => {
                        const inCartItem = orderCart.find(ci => ci.menuItemId === dish.id);
                        return (
                          <div
                            key={dish.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              borderRadius: '12px',
                              background: inCartItem ? '#FFF3EE' : '#FFF8F6',
                              border: `1px solid ${inCartItem ? '#FFB68C' : '#F0E6E4'}`,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                              <img src={dish.imageUrl} alt={dish.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {dish.name}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                  <span style={{ fontSize: '0.8rem', color: '#9D4124', fontWeight: 800 }}>
                                    {dish.price.toLocaleString('vi-VN')}₫
                                  </span>
                                  {dish.category && (
                                    <span style={{ fontSize: '0.68rem', color: '#89726B', background: '#F6ECEA', padding: '1px 5px', borderRadius: '4px' }}>
                                      {dish.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action: Stepper nếu đã có trong giỏ, hoặc nút Thêm */}
                            {inCartItem ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleDecreaseQuantity(dish.id)}
                                  style={{
                                    width: '28px', height: '28px', borderRadius: '6px',
                                    background: '#FFF', border: '1px solid #EAE0DE',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: '#1F1B1A', fontWeight: 700
                                  }}
                                >
                                  -
                                </button>
                                <span style={{ minWidth: '18px', textAlign: 'center', fontWeight: 800, fontSize: '0.88rem', color: '#9D4124' }}>
                                  {inCartItem.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(dish)}
                                  style={{
                                    width: '28px', height: '28px', borderRadius: '6px',
                                    background: '#9D4124', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: '#FFF', fontWeight: 700
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddToCart(dish)}
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
                                <Icon name="add" size={15} /> Thêm
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Nút xem phiếu giỏ hàng nhanh trên mobile nếu có món */}
                  {isMobile && cartTotalCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setMobileOrderModalTab('CART')}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: '#9D4124',
                        color: '#FFF',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(157, 65, 36, 0.25)',
                        marginTop: '6px'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="shopping_cart" size={18} />
                        Xem Phiếu Gọi ({cartTotalCount} món)
                      </span>
                      <span>{cartTotalAmount.toLocaleString('vi-VN')}₫ →</span>
                    </button>
                  )}
                </div>

                {/* CỘT PHẢI: Phiếu gọi món / Giỏ hàng tạm (Order Pad) */}
                <div style={{
                  display: (isMobile && mobileOrderModalTab === 'CATALOG') ? 'none' : 'flex',
                  background: '#FFF8F6',
                  borderRadius: '16px',
                  border: '1px solid #FFDBC9',
                  padding: '14px',
                  flexDirection: 'column',
                  minHeight: 0,
                  overflow: 'hidden',
                  width: '100%'
                }}>
                  {/* Header Cart */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #F0E6E4', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="shopping_cart" size={18} style={{ color: '#9D4124' }} />
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1F1B1A' }}>
                        Phiếu Gọi Món
                      </span>
                      <span style={{
                        background: '#FFDBC9', color: '#9D4124',
                        padding: '2px 7px', borderRadius: '9999px',
                        fontSize: '0.72rem', fontWeight: 800
                      }}>
                        {cartTotalCount} món
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isMobile && (
                        <button
                          type="button"
                          onClick={() => setMobileOrderModalTab('CATALOG')}
                          style={{ background: '#FFDBC9', border: 'none', color: '#9D4124', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                        >
                          + Thêm món
                        </button>
                      )}
                      {orderCart.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setOrderCart([])}
                          style={{ background: 'none', border: 'none', color: '#BA1A1A', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Xóa tất cả
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Danh sách món trong giỏ */}
                  {orderCart.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 10px', color: '#89726B', textAlign: 'center' }}>
                      <Icon name="shopping_basket" size={40} style={{ color: '#E5D5D1', marginBottom: '8px' }} />
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#56423D' }}>Chưa chọn món nào</div>
                      <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                        Bấm <strong>[+ Thêm]</strong> từ thực đơn bên trái để đưa món vào phiếu gọi
                      </div>
                    </div>
                  ) : (
                    <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px', marginBottom: '8px' }}>
                      {orderCart.map(item => (
                        <div
                          key={item.menuItemId}
                          style={{
                            background: '#FFFFFF',
                            borderRadius: '10px',
                            padding: '8px 10px',
                            border: '1px solid #F0E6E4',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.name}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: '#89726B' }}>
                                {item.price.toLocaleString('vi-VN')}₫ / món
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#9D4124' }}>
                                {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            {/* Input ghi chú món */}
                            <input
                              type="text"
                              value={item.note || ''}
                              onChange={(e) => handleUpdateItemNote(item.menuItemId, e.target.value)}
                              placeholder="Ghi chú món (vd: ít cay, không hành...)"
                              style={{
                                flex: 1,
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #EAE0DE',
                                fontSize: '0.72rem',
                                background: '#FFF8F6',
                                outline: 'none'
                              }}
                            />

                            {/* Stepper & Nút Xóa */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => handleDecreaseQuantity(item.menuItemId)}
                                style={{
                                  width: '24px', height: '24px', borderRadius: '4px',
                                  background: '#F0E6E4', border: 'none',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem'
                                }}
                              >
                                -
                              </button>
                              <span style={{ minWidth: '16px', textAlign: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddToCart({ id: item.menuItemId, name: item.name, price: item.price, imageUrl: item.imageUrl, category: item.category })}
                                style={{
                                  width: '24px', height: '24px', borderRadius: '4px',
                                  background: '#9D4124', color: '#FFF', border: 'none',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem'
                                }}
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(item.menuItemId)}
                                title="Xóa món này"
                                style={{
                                  width: '24px', height: '24px', borderRadius: '4px',
                                  background: '#FFF', border: '1px solid #FFDAD6', color: '#BA1A1A',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', marginLeft: '2px'
                                }}
                              >
                                <Icon name="delete" size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ô ghi chú chung cho đợt gọi */}
                  {orderCart.length > 0 && (
                    <div style={{ marginBottom: '8px', flexShrink: 0 }}>
                      <input
                        type="text"
                        value={orderGeneralNote}
                        onChange={(e) => setOrderGeneralNote(e.target.value)}
                        placeholder="Ghi chú chung cho bếp (vd: làm gấp, khách mang về...)"
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid #EAE0DE',
                          fontSize: '0.78rem',
                          background: '#FFFFFF',
                          outline: 'none'
                        }}
                      />
                    </div>
                  )}

                  {/* Summary Footer & Nút Gửi Bếp */}
                  <div style={{ borderTop: '1px solid #F0E6E4', paddingTop: '10px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.82rem', color: '#56423D', fontWeight: 600 }}>Tạm tính đợt này:</span>
                      <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.15rem', color: '#9D4124' }}>
                        {cartTotalAmount.toLocaleString('vi-VN')}₫
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setShowOrderModal(false)}
                        style={{
                          padding: '11px 16px',
                          borderRadius: '12px',
                          background: '#F0E6E4',
                          color: '#56423D',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer'
                        }}
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        disabled={orderCart.length === 0 || isSubmittingOrder}
                        onClick={handleSubmitOrderToKitchen}
                        style={{
                          flex: 1,
                          padding: '11px 16px',
                          borderRadius: '12px',
                          background: orderCart.length === 0 ? '#EAE0DE' : '#9D4124',
                          color: orderCart.length === 0 ? '#89726B' : '#FFF',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          cursor: orderCart.length === 0 || isSubmittingOrder ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: orderCart.length > 0 ? '0 4px 12px rgba(157, 65, 36, 0.3)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Icon name="soup_kitchen" size={18} />
                        {isSubmittingOrder ? 'Đang gửi vào bếp...' : `GỬI VÀO BẾP (${cartTotalCount} MÓN)`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  (() => {
                    const baseDomain = (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost'))
                      ? window.location.origin
                      : 'http://roms-restaurant.duckdns.org';
                    return selectedTable.qrToken
                      ? `${baseDomain}/dining/welcome?table=${selectedTable.id}&token=${selectedTable.qrToken}`
                      : `${baseDomain}/dining/welcome?table=${selectedTable.tableNumber}`;
                  })()
                )}`}
                alt="QR Code Bàn"
                style={{ width: '180px', height: '180px', display: 'block' }}
              />
            </div>

            <div style={{ fontSize: '0.78rem', color: '#56423D', background: '#FCF1EF', padding: '8px 12px', borderRadius: '10px', marginBottom: '16px' }}>
              Mã bàn: <strong>{selectedTable.tableNumber}</strong> • {selectedTable.zone || 'Khu vực phục vụ'}
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
