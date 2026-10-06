import React, { useState, useEffect } from 'react';
import { MOCK_MENU_ITEMS } from '../../mock/mockData';

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

const INITIAL_POS_TABLES = [
  {
    id: 5,
    code: 'T05',
    label: 'Bàn T05',
    zone: 'Tầng 1 - Sảnh chính',
    guests: 4,
    timeIn: '12:15 (35p)',
    orderCode: '#ROM-8842',
    status: 'PAYMENT_REQUEST',
    statusText: 'Y/c Thanh Toán',
    items: [
      { id: 1, name: 'Phở Bò Đặc Biệt ROMS', size: 'Tô Thường', price: 85000, qty: 2, note: 'Bò tái mềm, nhiều hành lá' },
      { id: 2, name: 'Gỏi Cuốn Tôm Thịt Heo', size: 'Tiêu Chuẩn', price: 45000, qty: 1, note: '' },
      { id: 3, name: 'Cơm Tấm Sườn Mật Ong', size: 'Phần Thường', price: 95000, qty: 1, note: '' },
      { id: 4, name: 'Sinh Tố Bơ Đắk Lắk Sáp', size: 'Ly Vừa', price: 55000, qty: 2, note: 'Ít sữa đặc, nhiều đá xay' },
      { id: 5, name: 'Trà Đào Cam Sả Tươi', size: 'Size M', price: 45000, qty: 1, note: '' }
    ]
  },
  {
    id: 2,
    code: 'T02',
    label: 'Bàn T02',
    zone: 'Tầng 1 - Sảnh chính',
    guests: 2,
    timeIn: '12:30 (18p)',
    orderCode: '#ROM-8843',
    status: 'DINING',
    statusText: '3 món • Đang ăn',
    items: [
      { id: 6, name: 'Mì Ý Tôm Hùm Sốt Kem Cay', size: 'Tiêu Chuẩn', price: 189000, qty: 1, note: 'Ít cay' },
      { id: 7, name: 'Nước Ép Dưa Hấu Bạc Hà', size: 'Ly Lớn', price: 42000, qty: 2, note: '' }
    ]
  },
  {
    id: 4,
    code: 'T04',
    label: 'Bàn T04',
    zone: 'Tầng 1 - Sảnh chính',
    guests: 6,
    timeIn: '11:55 (55p)',
    orderCode: '#ROM-8840',
    status: 'WAITING_PAYMENT',
    statusText: 'Chờ thanh toán',
    items: [
      { id: 8, name: 'Bò Bít Tết Sốt Tiêu Đen', size: 'Phần Lớn', price: 289000, qty: 3, note: 'Medium-rare' },
      { id: 9, name: 'Rượu Vang Đỏ Cao Cấp', size: 'Chai 750ml', price: 380000, qty: 1, note: '' }
    ]
  },
  {
    id: 8,
    code: 'T08',
    label: 'Bàn T08',
    zone: 'Tầng 1 - Sảnh chính',
    guests: 4,
    timeIn: 'Đặt 18:30',
    orderCode: '#ROM-RES-08',
    status: 'RESERVED',
    statusText: 'Đã đặt trước',
    items: []
  },
  {
    id: 12,
    code: 'T12',
    label: 'VIP 01',
    zone: 'Phòng VIP',
    guests: 8,
    timeIn: '11:40 (72p)',
    orderCode: '#ROM-8838',
    status: 'DINING',
    statusText: 'Đang phục vụ',
    items: [
      { id: 10, name: 'Bò Wagyu Nướng Tảng', size: 'Set VIP', price: 1550000, qty: 2, note: 'Phục vụ nóng' },
      { id: 11, name: 'Bia Craft ROMS 330ml', size: 'Chai', price: 45000, qty: 8, note: '' }
    ]
  },
  {
    id: 9,
    code: 'T09',
    label: 'Bàn T09',
    zone: 'Tầng 2 - Ban công',
    guests: 2,
    timeIn: '12:25 (22p)',
    orderCode: '#ROM-8844',
    status: 'DRAFT_PRINTED',
    statusText: 'Đã in tạm tính',
    items: [
      { id: 12, name: 'Nem Rán Hải Sản', size: 'Đĩa', price: 89000, qty: 1, note: '' },
      { id: 13, name: 'Trà Đào Cam Sả', size: 'Ly', price: 49000, qty: 1, note: '' }
    ]
  }
];

const MOCK_INVOICE_HISTORY = [
  {
    id: 'HD-20250921-042',
    table: 'Bàn T05',
    zone: 'Tầng 1 - Sảnh chính',
    time: '12:48',
    shift: 'Ca Sáng',
    cashier: 'Hoàng Hải Yến (#CSH-002)',
    itemsCount: 5,
    itemsSummary: 'Phở Bò ROMS x2, Gỏi Cuốn, Cơm Tấm, Sinh Tố Bơ...',
    method: 'BANK_TRANSFER',
    methodLabel: 'VietQR Chuyển Khoản',
    amount: 380000,
    status: 'PAID',
    statusLabel: 'Đã thanh toán',
    items: [
      { name: 'Phở Bò Đặc Biệt ROMS', qty: 2, price: 85000 },
      { name: 'Gỏi Cuốn Tôm Thịt Heo', qty: 1, price: 45000 },
      { name: 'Cơm Tấm Sườn Mật Ong', qty: 1, price: 95000 },
      { name: 'Sinh Tố Bơ Đắk Lắk Sáp', qty: 1, price: 55000 },
    ]
  },
  {
    id: 'HD-20250921-041',
    table: 'Bàn T02',
    zone: 'Tầng 1 - Sảnh chính',
    time: '12:35',
    shift: 'Ca Sáng',
    cashier: 'Hoàng Hải Yến (#CSH-002)',
    itemsCount: 3,
    itemsSummary: 'Mì Ý Tôm Hùm, Salad Trộn Rong Biển, Trà Đào...',
    method: 'CASH',
    methodLabel: 'Tiền mặt tại két',
    amount: 540000,
    status: 'PAID',
    statusLabel: 'Đã thanh toán',
    items: [
      { name: 'Mì Ý Tôm Hùm Sốt Kem Cay', qty: 1, price: 189000 },
      { name: 'Nước Ép Dưa Hấu Bạc Hà', qty: 2, price: 42000 },
      { name: 'Salad Rong Biển Trứng Cua', qty: 1, price: 120000 },
    ]
  },
  {
    id: 'HD-20250921-040',
    table: 'VIP 02',
    zone: 'Phòng VIP',
    time: '12:15',
    shift: 'Ca Sáng',
    cashier: 'Hoàng Hải Yến (#CSH-002)',
    itemsCount: 8,
    itemsSummary: 'Set Bò Wagyu Thượng Hạng, Rượu Vang Pháp...',
    method: 'POS_CARD',
    methodLabel: 'Thẻ POS Visa',
    amount: 4850000,
    status: 'PAID',
    statusLabel: 'Đã thanh toán',
    items: [
      { name: 'Set Bò Wagyu Thượng Hạng', qty: 2, price: 1550000 },
      { name: 'Rượu Vang Pháp Cao Cấp', qty: 1, price: 980000 },
      { name: 'Bia Craft ROMS 330ml', qty: 8, price: 45000 },
    ]
  },
  {
    id: 'HD-20250921-039',
    table: 'Bàn T08',
    zone: 'Tầng 1 - Sảnh chính',
    time: '11:58',
    shift: 'Ca Sáng',
    cashier: 'Hoàng Hải Yến (#CSH-002)',
    itemsCount: 2,
    itemsSummary: 'Cá Hồi Na-uy Áp Chảo, Trà Đào Cam Sả...',
    method: 'BANK_TRANSFER',
    methodLabel: 'VietQR Chuyển Khoản',
    amount: 680000,
    status: 'PAID',
    statusLabel: 'Đã thanh toán',
    items: [
      { name: 'Cá Hồi Na-uy Áp Chảo', qty: 2, price: 290000 },
      { name: 'Trà Đào Cam Sả', qty: 2, price: 50000 },
    ]
  },
  {
    id: 'HD-20250921-038',
    table: 'Bàn T01',
    zone: 'Tầng 1 - Sảnh chính',
    time: '11:42',
    shift: 'Ca Sáng',
    cashier: 'Hoàng Hải Yến (#CSH-002)',
    itemsCount: 4,
    itemsSummary: 'Lẩu Nấm Hoàng Kim, Đĩa Nem Hải Sản...',
    method: 'CASH',
    methodLabel: 'Tiền mặt tại két',
    amount: 920000,
    status: 'PAID',
    statusLabel: 'Đã thanh toán',
    items: [
      { name: 'Lẩu Nấm Hoàng Kim', qty: 1, price: 650000 },
      { name: 'Đĩa Nem Hải Sản', qty: 2, price: 89000 },
      { name: 'Trà Đá Thảo Mộc', qty: 4, price: 23000 },
    ]
  },
  {
    id: 'HD-20250921-037',
    table: 'Bàn T09',
    zone: 'Tầng 2 - Ban công',
    time: '11:30',
    shift: 'Ca Sáng',
    cashier: 'Hoàng Hải Yến (#CSH-002)',
    itemsCount: 2,
    itemsSummary: 'Mì Xào Giòn Hải Sản, Trà Chanh Leo...',
    method: 'CASH',
    methodLabel: 'Tiền mặt tại két',
    amount: 230000,
    status: 'VOIDED',
    statusLabel: 'Đã hủy món (Quản lý duyệt)',
    items: [
      { name: 'Mì Xào Giòn Hải Sản', qty: 1, price: 145000 },
      { name: 'Trà Chanh Leo', qty: 2, price: 42500 },
    ]
  },
  {
    id: 'HD-20250921-036',
    table: 'Bàn T04',
    zone: 'Tầng 1 - Sảnh chính',
    time: '11:15',
    shift: 'Ca Sáng',
    cashier: 'Hoàng Hải Yến (#CSH-002)',
    itemsCount: 6,
    itemsSummary: 'Bò Bít Tết Tiêu Đen, Rượu Vang, Salad...',
    method: 'POS_CARD',
    methodLabel: 'Thẻ POS Napas',
    amount: 1450000,
    status: 'PAID',
    statusLabel: 'Đã thanh toán',
    items: [
      { name: 'Bò Bít Tết Tiêu Đen', qty: 3, price: 289000 },
      { name: 'Rượu Vang Đỏ Cao Cấp', qty: 1, price: 380000 },
      { name: 'Salad Xốt Chanh Dây', qty: 2, price: 65000 },
    ]
  }
];

export default function PosCheckoutPage() {
  const [activePosTab, setActivePosTab] = useState('POS'); // 'POS' | 'HISTORY' | 'SHIFT'
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
  const [posTables, setPosTables] = useState(INITIAL_POS_TABLES);
  const [selectedTableCode, setSelectedTableCode] = useState('T05');
  const [serviceType, setServiceType] = useState('DINE_IN');
  const [activeFloorFilter, setActiveFloorFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [cashGiven, setCashGiven] = useState('');

  // History states
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
  const [historyShiftFilter, setHistoryShiftFilter] = useState('ALL');
  const [historyMethodFilter, setHistoryMethodFilter] = useState('ALL');
  const [viewingHistoryInvoice, setViewingHistoryInvoice] = useState(null);

  // Cash Drawer & Shift Handover states
  const [denominations, setDenominations] = useState({
    500000: 15,
    200000: 10,
    100000: 8,
    50000: 5,
    20000: 4,
    10000: 2
  });
  const [handoverNote, setHandoverNote] = useState('Ca sáng hoàn tất tốt, không phát sinh sai sót lớn. 2 đơn hủy đã có chữ ký quản lý duyệt đầy đủ.');

  // Modals
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showVietQrModal, setShowVietQrModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Quan ly phe duyet huy mon (Void Item with Manager Approval)
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [itemToVoid, setItemToVoid] = useState(null);
  const [voidReason, setVoidReason] = useState('Khách đổi ý trước khi chế biến');
  const [managerPin, setManagerPin] = useState('');
  const [voidError, setVoidError] = useState(null);

  // Quan ly phe duyet chot ca (Shift Handover Approval by Manager)
  const [showShiftApprovalModal, setShowShiftApprovalModal] = useState(false);
  const [shiftManagerPin, setShiftManagerPin] = useState('');
  const [shiftManagerNote, setShiftManagerNote] = useState('Đã đối soát đầy đủ tiền két và hóa đơn ca sáng, chấp thuận chốt sổ bàn giao.');
  const [shiftApprovalError, setShiftApprovalError] = useState(null);
  const [isShiftClosed, setIsShiftClosed] = useState(false);
  const [shiftApprovedAt, setShiftApprovedAt] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const currentTable = posTables.find(t => t.code === selectedTableCode) || posTables[0];

  // Financial calculations
  const subtotal = currentTable.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const vat = Math.round(subtotal * 0.08);
  const totalAmount = subtotal + vat;
  const roundedTotal = Math.round(totalAmount / 1000) * 1000;

  // Add dish to bill
  const handleAddDish = (dish) => {
    setPosTables(prev => prev.map(t => {
      if (t.code === currentTable.code) {
        const existing = t.items.find(i => i.name === dish.name);
        if (existing) {
          return {
            ...t,
            items: t.items.map(i => i.name === dish.name ? { ...i, qty: i.qty + 1 } : i)
          };
        } else {
          return {
            ...t,
            items: [...t.items, { id: Date.now(), name: dish.name, size: 'Tiêu Chuẩn', price: dish.price, qty: 1, note: '' }]
          };
        }
      }
      return t;
    }));
    showToast(`Đã thêm [${dish.name}] vào ${currentTable.label}`);
  };

  // Change quantity
  const handleUpdateQty = (itemId, delta) => {
    setPosTables(prev => prev.map(t => {
      if (t.code === currentTable.code) {
        const target = t.items.find(i => i.id === itemId);
        if (target && target.qty === 1 && delta < 0) {
          // Khi muon giam ve 0 (huy han mon) -> Buoc phai qua quan ly duyet
          handleRequestVoid(target);
          return t;
        }
        const updated = t.items.map(i => {
          if (i.id === itemId) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : i;
          }
          return i;
        });
        return { ...t, items: updated };
      }
      return t;
    }));
  };

  // Yeu cau huy mon can quan ly duyet
  const handleRequestVoid = (item) => {
    setItemToVoid(item);
    setManagerPin('');
    setVoidError(null);
    setShowVoidModal(true);
  };

  // Quan ly xac nhan ma PIN de huy mon
  const handleConfirmVoid = (e) => {
    if (e) e.preventDefault();
    if (!managerPin || managerPin.trim().length !== 6 || !/^\d{6}$/.test(managerPin.trim())) {
      setVoidError('Vui lòng nhập chính xác mã PIN Quản Lý (6 chữ số)!');
      return;
    }
    // Xoa mon khoi ban
    setPosTables(prev => prev.map(t => {
      if (t.code === currentTable.code) {
        return {
          ...t,
          items: t.items.filter(i => i.id !== itemToVoid.id)
        };
      }
      return t;
    }));
    setShowVoidModal(false);
    showToast(`Quản lý #MGR-084 đã phê duyệt huỷ món [${itemToVoid.name}] (Lý do: ${voidReason})!`);
  };

  // Quan ly xac nhan chot ca
  const handleOpenShiftApproval = () => {
    setShiftManagerPin('');
    setShiftApprovalError(null);
    setShowShiftApprovalModal(true);
  };

  const handleConfirmShiftClose = (e) => {
    if (e) e.preventDefault();
    if (!shiftManagerPin || shiftManagerPin.trim().length !== 6 || !/^\d{6}$/.test(shiftManagerPin.trim())) {
      setShiftApprovalError('Vui lòng nhập chính xác mã PIN Quản Lý (6 chữ số)!');
      return;
    }
    const approvedTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setIsShiftClosed(true);
    setShiftApprovedAt(approvedTime);
    setShowShiftApprovalModal(false);
    showToast(`Quản lý #MGR-084 đã phê duyệt chốt ca và bàn giao két tiền lúc ${approvedTime}!`);
  };

  // Checkout execution
  const handleExecuteCheckout = () => {
    if (subtotal === 0) {
      showToast('Bàn chưa có món ăn để thanh toán!');
      return;
    }
    if (paymentMethod === 'BANK_TRANSFER') {
      setShowVietQrModal(true);
      return;
    }
    // Proceed to invoice
    finalizePayment();
  };

  const finalizePayment = () => {
    setShowVietQrModal(false);
    setShowInvoiceModal(true);
    // Reset table in list
    setPosTables(prev => prev.map(t => {
      if (t.code === currentTable.code) {
        return {
          ...t,
          status: 'AVAILABLE',
          statusText: 'Bàn trống',
          items: []
        };
      }
      return t;
    }));
    showToast(`Đã hoàn tất thanh toán & in hóa đơn cho ${currentTable.label}!`);
  };

  const filteredCatalog = MOCK_MENU_ITEMS.filter(item => {
    if (!item.isAvailable) return false;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'MAIN') return item.categoryId === 2;
    if (selectedCategory === 'APPETIZER') return item.categoryId === 1;
    if (selectedCategory === 'DRINK') return item.categoryId === 3;
    if (selectedCategory === 'DESSERT') return item.categoryId === 4;
    return true;
  });

  const totalCountedCash = Object.entries(denominations).reduce(
    (sum, [denom, count]) => sum + Number(denom) * (Number(count) || 0),
    0
  );
  const theoreticalDrawerCash = 10650000;
  const cashDifference = totalCountedCash - theoreticalDrawerCash;

  const filteredInvoices = MOCK_INVOICE_HISTORY.filter(inv => {
    if (historyStatusFilter !== 'ALL' && inv.status !== historyStatusFilter) return false;
    if (historyMethodFilter !== 'ALL' && inv.method !== historyMethodFilter) return false;
    if (historyShiftFilter !== 'ALL') {
      if (historyShiftFilter === 'MORNING' && !inv.shift.includes('Sáng')) return false;
      if (historyShiftFilter === 'EVENING' && !inv.shift.includes('Tối')) return false;
    }
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      const matchId = inv.id.toLowerCase().includes(q);
      const matchTable = inv.table.toLowerCase().includes(q);
      const matchCashier = inv.cashier.toLowerCase().includes(q);
      const matchSummary = inv.itemsSummary.toLowerCase().includes(q);
      if (!matchId && !matchTable && !matchCashier && !matchSummary) return false;
    }
    return true;
  });

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

      {/* POS Top Tabs Navigation: Thu Ngân | Lịch Sử GD | Két Tiền / Chốt Ca */}
      <div style={{
        background: '#FFFFFF',
        padding: '10px 24px',
        borderBottom: '1px solid #EAE0DE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        {/* 3 Main Tabs theo Stitch */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#F0E6E4',
          padding: '4px',
          borderRadius: '14px',
          border: '1px solid #EAE0DE'
        }}>
          {[
            { id: 'POS', label: 'Thu Ngân', icon: 'point_of_sale' },
            { id: 'HISTORY', label: 'Lịch Sử GD', count: MOCK_INVOICE_HISTORY.length, icon: 'receipt_long' },
            { id: 'SHIFT', label: 'Két Tiền / Chốt Ca', icon: 'savings' }
          ].map(tab => {
            const isActive = activePosTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePosTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? '#9D4124' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#56423D',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(157, 65, 36, 0.28)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon name={tab.icon} size={18} fill={isActive ? 1 : 0} />
                <span>{tab.label}</span>
                {tab.count && (
                  <span style={{
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#EAE0DE',
                    color: isActive ? '#FFFFFF' : '#56423D',
                    fontSize: '0.72rem',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Info: Shift Status & Drawer Balance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: isShiftClosed ? '#DDE8AB' : '#FCF1EF',
            padding: '6px 12px',
            borderRadius: '10px',
            border: isShiftClosed ? '1px solid #C4D388' : '1px solid #EAE0DE',
            fontSize: '0.78rem',
            color: isShiftClosed ? '#181E00' : '#56423D',
            fontWeight: isShiftClosed ? 700 : 500
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isShiftClosed ? '#181E00' : '#596232' }} />
            <span>
              Ca Sáng (06:00 - 14:00) • {isShiftClosed ? `Đã chốt ca (${shiftApprovedAt})` : 'Thu ngân: Hoàng Hải Yến'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFDBC9', padding: '6px 14px', borderRadius: '10px', border: '1px solid #FFB59F', fontSize: '0.8rem', color: '#753400', fontWeight: 700 }}>
            <Icon name="payments" size={16} />
            <span>Két tiền: <strong>10.650.000₫</strong></span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thoát chế độ toàn màn hình' : 'Toàn màn hình POS'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '10px',
              border: isFullscreen ? '1px solid #9D4124' : '1px solid #EAE0DE',
              background: isFullscreen ? '#9D4124' : '#FFFFFF',
              color: isFullscreen ? '#FFFFFF' : '#56423D',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name={isFullscreen ? 'fullscreen_exit' : 'fullscreen'} size={16} />
            <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: THU NGÂN & BÁN HÀNG (POS TERMINAL) */}
      {activePosTab === 'POS' && (
        <>
          {/* Sub-bar for POS Service Type (Tại bàn / Mang về) */}
          <div style={{
            background: '#FCF1EF',
            padding: '10px 24px',
            borderBottom: '1px solid #EAE0DE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {[
                { id: 'DINE_IN', label: 'Tại bàn (Dine-in)', icon: 'table_restaurant' },
                { id: 'TAKEAWAY', label: 'Mang về (Takeaway)', count: 4, icon: 'takeout_dining' }
              ].map(s => {
                const isActive = serviceType === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setServiceType(s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: isActive ? '#9D4124' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#56423D',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 2px 6px rgba(157, 65, 36, 0.2)' : '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    <Icon name={s.icon} size={16} />
                    <span>{s.label}</span>
                    {s.count && (
                      <span style={{
                        padding: '1px 5px',
                        borderRadius: '9999px',
                        background: isActive ? 'rgba(255,255,255,0.25)' : '#F0E6E4',
                        fontSize: '0.7rem'
                      }}>
                        {s.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: '0.8rem', color: '#89726B' }}>
              Chọn bàn ăn để xem hóa đơn và hoàn tất thanh toán
            </div>
          </div>

          {/* Main POS Split Grid (7 cols Table/Catalog + 5 cols Bill/Payment) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '20px',
            padding: '20px',
            alignItems: 'flex-start'
          }}>
        {/* Left Side: Tables Matrix + Quick Touch Menu (7 cols) */}
        <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Table Matrix Selection */}
          <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '16px', border: '1px solid #F0E6E4', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="table_restaurant" size={20} style={{ color: '#9D4124' }} />
                <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.95rem', color: '#1F1B1A', margin: 0 }}>
                  Sơ Đồ Bàn Phục Vụ
                </h4>
              </div>

              <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#BA1A1A', fontWeight: 600 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#BA1A1A' }} /> Cần tính
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#596232', fontWeight: 600 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#596232' }} /> Đang ăn
                </span>
              </div>
            </div>

            {/* Matrix cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
              {posTables.map(t => {
                const isSelected = t.code === currentTable.code;
                const isCalling = t.status === 'PAYMENT_REQUEST';
                const isWaiting = t.status === 'WAITING_PAYMENT';
                const isReserved = t.status === 'RESERVED';
                const tableSub = t.items.reduce((sum, item) => sum + (item.price * item.qty), 0);

                let badgeColor = '#F6ECEA';
                let textColor = '#56423D';
                if (isCalling) { badgeColor = '#FFDAD6'; textColor = '#93000A'; }
                else if (isWaiting) { badgeColor = '#FFDBC9'; textColor = '#753400'; }
                else if (isReserved) { badgeColor = '#FEF3C7'; textColor = '#78350F'; }
                else if (t.items.length > 0) { badgeColor = '#DDE8AB'; textColor = '#181E00'; }

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTableCode(t.code)}
                    style={{
                      background: isSelected ? '#FFF8F6' : '#FFFFFF',
                      border: isSelected ? '2px solid #9D4124' : '1px solid #EAE0DE',
                      borderRadius: '14px',
                      padding: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '115px',
                      boxShadow: isSelected ? '0 4px 14px rgba(157, 65, 36, 0.2)' : 'none',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1rem', color: isSelected ? '#9D4124' : '#1F1B1A' }}>
                        {t.code}
                      </span>
                      {isCalling && (
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#BA1A1A', animation: 'pulse 1s infinite' }} />
                      )}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#89726B', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{t.guests} khách</span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#1F1B1A', marginTop: '2px' }}>
                        {tableSub > 0 ? `${(Math.round(tableSub / 1000))}k` : 'Trống'}
                      </div>
                    </div>

                    <div style={{
                      background: badgeColor,
                      color: textColor,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 4px',
                      borderRadius: '6px',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {t.statusText}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Touch Menu Catalog */}
          <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '16px', border: '1px solid #F0E6E4', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FCF1EF', borderRadius: '10px', padding: '6px 12px', flex: 1, minWidth: '180px' }}>
                <Icon name="search" size={18} style={{ color: '#89726B' }} />
                <input
                  type="text"
                  placeholder="Tìm nhanh món ăn để thêm vào hóa đơn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%', color: '#1F1B1A' }}
                />
              </div>

              {/* Category buttons */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                {[
                  { id: 'ALL', label: 'Tất cả' },
                  { id: 'MAIN', label: 'Món chính' },
                  { id: 'APPETIZER', label: 'Khai vị' },
                  { id: 'DRINK', label: 'Đồ uống' },
                  { id: 'DESSERT', label: 'Tráng miệng' }
                ].map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: selectedCategory === c.id ? '#9D4124' : '#F6ECEA',
                      color: selectedCategory === c.id ? '#FFF' : '#56423D',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dishes grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
              {filteredCatalog.map(dish => (
                <div
                  key={dish.id}
                  onClick={() => handleAddDish(dish)}
                  style={{
                    background: '#FFF8F6',
                    border: '1px solid #F0E6E4',
                    borderRadius: '12px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <img src={dish.imageUrl} alt={dish.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {dish.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#9D4124' }}>
                        {dish.price.toLocaleString('vi-VN')}₫
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      marginTop: '6px',
                      padding: '4px',
                      borderRadius: '6px',
                      background: '#FFFFFF',
                      border: '1px solid #EAE0DE',
                      color: '#9D4124',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Icon name="add" size={14} /> Thêm vào {currentTable.code}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Live Order Detail, Calculation & Fast Cashier Checkout (5 cols) */}
        <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '20px',
            border: '1px solid #F0E6E4',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
            {/* Order Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '14px', borderBottom: '1px dashed #EAE0DE', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#9D4124',
                  color: '#FFFFFF',
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {currentTable.code}
                </span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#1F1B1A', margin: 0 }}>
                      Hóa Đơn: {currentTable.label}
                    </h3>
                    <span style={{ fontSize: '0.75rem', background: '#F6ECEA', color: '#56423D', padding: '2px 6px', borderRadius: '6px', fontWeight: 600 }}>
                      {currentTable.orderCode}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#89726B' }}>
                    {currentTable.guests} khách • Vào lúc {currentTable.timeIn}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => showToast(`Đã in lại phiếu kiểm đồ cho ${currentTable.label}`)}
                title="In phiếu kiểm đồ"
                style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #EAE0DE', background: '#FCF1EF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#56423D' }}
              >
                <Icon name="print" size={18} />
              </button>
            </div>

            {/* Itemized Bill List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', marginBottom: '14px' }}>
              {currentTable.items.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#89726B', fontSize: '0.85rem' }}>
                  Bàn hiện đang trống, chưa có món ăn.
                </div>
              ) : (
                currentTable.items.map(item => (
                  <div
                    key={item.id}
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
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </span>
                        {item.size && (
                          <span style={{ fontSize: '0.7rem', color: '#9D4124', background: '#FFDBC9', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                            {item.size}
                          </span>
                        )}
                      </div>
                      {item.note && (
                        <div style={{ fontSize: '0.72rem', color: '#89726B', fontStyle: 'italic' }}>
                          {item.note}
                        </div>
                      )}
                      <div style={{ fontSize: '0.78rem', color: '#9D4124', fontWeight: 700, marginTop: '2px' }}>
                        {item.price.toLocaleString('vi-VN')}₫
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #EAE0DE' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, -1)}
                          style={{ width: '24px', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Icon name="remove" size={14} />
                        </button>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, width: '20px', textAlign: 'center', color: '#1F1B1A' }}>
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, 1)}
                          style={{ width: '24px', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Icon name="add" size={14} />
                        </button>
                      </div>

                      <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1F1B1A', minWidth: '65px', textAlign: 'right' }}>
                        {(item.price * item.qty).toLocaleString('vi-VN')}₫
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRequestVoid(item)}
                        title="Hủy món (Cần Quản Lý duyệt)"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#FFDAD6',
                          color: '#BA1A1A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Icon name="delete" size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Financial Calculation Breakdown */}
            <div style={{ background: '#FCF1EF', padding: '12px 14px', borderRadius: '14px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#56423D' }}>
                <span>Tiền món ({currentTable.items.reduce((s, i) => s + i.qty, 0)} phần):</span>
                <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{subtotal.toLocaleString('vi-VN')}₫</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#56423D' }}>
                <span>Thuế VAT (8%):</span>
                <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{vat.toLocaleString('vi-VN')}₫</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#56423D' }}>
                <span>Phí dịch vụ:</span>
                <span style={{ fontWeight: 700, color: '#596232' }}>Miễn phí</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                paddingTop: '8px',
                marginTop: '4px',
                borderTop: '1px solid #EAE0DE'
              }}>
                <div>
                  <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.92rem', color: '#1F1B1A', display: 'block' }}>
                    Tổng Thanh Toán
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#89726B' }}>Làm tròn: {roundedTotal.toLocaleString('vi-VN')}₫</span>
                </div>
                <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.45rem', color: '#9D4124' }}>
                  {totalAmount.toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#89726B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                Phương thức thanh toán
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'CASH', label: 'Tiền mặt', icon: 'payments' },
                  { id: 'BANK_TRANSFER', label: 'VietQR', icon: 'qr_code_2' },
                  { id: 'CARD', label: 'Thẻ POS', icon: 'credit_card' }
                ].map(m => {
                  const isActive = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      style={{
                        padding: '10px 6px',
                        borderRadius: '12px',
                        border: isActive ? '1.5px solid #9D4124' : '1px solid #EAE0DE',
                        background: isActive ? '#9D4124' : '#FFF8F6',
                        color: isActive ? '#FFFFFF' : '#56423D',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Icon name={m.icon} size={20} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash exchange quick suggestion if CASH selected */}
            {paymentMethod === 'CASH' && (
              <div style={{ marginBottom: '14px', background: '#FCF1EF', padding: '10px 12px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#89726B', fontWeight: 600 }}>Gợi ý tiền khách đưa:</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[roundedTotal, Math.ceil(roundedTotal / 100000) * 100000, 1000000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCashGiven(val.toString())}
                        style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #EAE0DE', background: '#FFF', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {val.toLocaleString('vi-VN')}₫
                      </button>
                    ))}
                  </div>
                </div>
                {cashGiven && parseInt(cashGiven) >= totalAmount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: '#059669', paddingTop: '4px', borderTop: '1px dashed #EAE0DE' }}>
                    <span>Tiền thừa trả khách:</span>
                    <span>{(parseInt(cashGiven) - totalAmount).toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleExecuteCheckout}
              disabled={subtotal === 0}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '16px',
                background: subtotal === 0 ? '#CBD5E1' : '#9D4124',
                color: '#FFFFFF',
                border: 'none',
                fontFamily: "'Epilogue', sans-serif",
                fontWeight: 800,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: subtotal === 0 ? 'not-allowed' : 'pointer',
                boxShadow: subtotal === 0 ? 'none' : '0 6px 18px rgba(157, 65, 36, 0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon name="point_of_sale" size={22} />
              <span>Thanh toán & Xuất hóa đơn</span>
              <Icon name="arrow_forward" size={18} />
            </button>
          </div>
        </div>
      </div>
        </>
      )}

      {/* VIEW 2: LỊCH SỬ GIAO DỊCH & HÓA ĐƠN */}
      {activePosTab === 'HISTORY' && (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top KPI Performance Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {/* Total Revenue */}
            <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#89726B', fontWeight: 600 }}>Tổng doanh thu hôm nay</span>
                <span style={{ background: '#FFDBC9', color: '#9D4124', padding: '6px', borderRadius: '10px', display: 'flex' }}>
                  <Icon name="account_balance_wallet" size={20} />
                </span>
              </div>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.6rem', color: '#1F1B1A', marginTop: '10px' }}>
                28.450.000₫
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.78rem', color: '#596232', fontWeight: 700 }}>
                <Icon name="trending_up" size={16} />
                <span>+12.4% so với hôm qua</span>
              </div>
            </div>

            {/* Invoices Count */}
            <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#89726B', fontWeight: 600 }}>Số lượng hóa đơn</span>
                <span style={{ background: '#DDE8AB', color: '#181E00', padding: '6px', borderRadius: '10px', display: 'flex' }}>
                  <Icon name="receipt_long" size={20} />
                </span>
              </div>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.6rem', color: '#1F1B1A', marginTop: '10px' }}>
                64 <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#89726B' }}>hóa đơn</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.75rem' }}>
                <span style={{ color: '#596232', fontWeight: 700 }}>58 xong</span>
                <span style={{ color: '#CCC' }}>•</span>
                <span style={{ color: '#994703', fontWeight: 700 }}>4 chờ</span>
                <span style={{ color: '#CCC' }}>•</span>
                <span style={{ color: '#BA1A1A', fontWeight: 700 }}>2 hủy</span>
              </div>
            </div>

            {/* Cash Revenue */}
            <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#89726B', fontWeight: 600 }}>Tiền mặt tại két</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#FFDBC9', color: '#753400', padding: '2px 8px', borderRadius: '9999px' }}>
                  30.4%
                </span>
              </div>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.6rem', color: '#1F1B1A', marginTop: '10px' }}>
                8.650.000₫
              </div>
              <div style={{ height: '6px', width: '100%', background: '#F0E6E4', borderRadius: '9999px', marginTop: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '30.4%', background: '#994703', borderRadius: '9999px' }} />
              </div>
            </div>

            {/* Bank Transfer */}
            <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#89726B', fontWeight: 600 }}>Chuyển khoản (VietQR)</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#FFDBC9', color: '#9D4124', padding: '2px 8px', borderRadius: '9999px' }}>
                  52.0%
                </span>
              </div>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.6rem', color: '#9D4124', marginTop: '10px' }}>
                14.800.000₫
              </div>
              <div style={{ height: '6px', width: '100%', background: '#F0E6E4', borderRadius: '9999px', marginTop: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '52%', background: '#9D4124', borderRadius: '9999px' }} />
              </div>
            </div>

            {/* Card POS */}
            <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#89726B', fontWeight: 600 }}>Thẻ POS Chip (mPOS)</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#DDE8AB', color: '#181E00', padding: '2px 8px', borderRadius: '9999px' }}>
                  17.6%
                </span>
              </div>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.6rem', color: '#1F1B1A', marginTop: '10px' }}>
                5.000.000₫
              </div>
              <div style={{ height: '6px', width: '100%', background: '#F0E6E4', borderRadius: '9999px', marginTop: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '17.6%', background: '#596232', borderRadius: '9999px' }} />
              </div>
            </div>
          </div>

          {/* Search, Filter Pills & Export Bar */}
          <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '18px', border: '1px solid #F0E6E4', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              {/* Search input */}
              <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '480px' }}>
                <Icon name="search" size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#89726B' }} />
                <input
                  type="text"
                  placeholder="Tìm theo mã HĐ (#HD-...), số bàn (T05), thu ngân, món ăn..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '12px',
                    border: '1.5px solid #EAE0DE',
                    background: '#FCF1EF',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => showToast('Đang xuất danh sách hóa đơn ra file Excel (XLSX)...')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '9px 16px', borderRadius: '12px',
                    border: '1px solid #EAE0DE', background: '#FCF1EF',
                    color: '#56423D', fontWeight: 700, fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <Icon name="file_download" size={18} style={{ color: '#596232' }} />
                  <span>Xuất Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => showToast('Đã làm mới dữ liệu lịch sử giao dịch!')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '9px 16px', borderRadius: '12px',
                    border: '1px solid #EAE0DE', background: '#FCF1EF',
                    color: '#56423D', fontWeight: 700, fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <Icon name="refresh" size={18} />
                  <span>Làm mới</span>
                </button>
              </div>
            </div>

            {/* Quick Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingTop: '6px', borderTop: '1px solid #F0E6E4' }}>
              {/* Status pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: '#89726B', fontWeight: 700 }}>Trạng thái:</span>
                {[
                  { id: 'ALL', label: 'Tất cả', count: MOCK_INVOICE_HISTORY.length },
                  { id: 'PAID', label: 'Đã thanh toán', count: MOCK_INVOICE_HISTORY.filter(i => i.status === 'PAID').length },
                  { id: 'VOIDED', label: 'Đã hủy', count: MOCK_INVOICE_HISTORY.filter(i => i.status === 'VOIDED').length }
                ].map(f => {
                  const isActive = historyStatusFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setHistoryStatusFilter(f.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        border: 'none',
                        background: isActive ? '#9D4124' : '#F0E6E4',
                        color: isActive ? '#FFFFFF' : '#56423D',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {f.label} ({f.count})
                    </button>
                  );
                })}
              </div>

              {/* Method filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: '#89726B', fontWeight: 700 }}>PTTT:</span>
                {[
                  { id: 'ALL', label: 'Tất cả PTTT' },
                  { id: 'CASH', label: 'Tiền mặt' },
                  { id: 'BANK_TRANSFER', label: 'VietQR' },
                  { id: 'POS_CARD', label: 'Thẻ POS' }
                ].map(m => {
                  const isActive = historyMethodFilter === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setHistoryMethodFilter(m.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: isActive ? '#9D4124' : '#EAE0DE',
                        background: isActive ? '#FFDBC9' : '#FFFFFF',
                        color: isActive ? '#753400' : '#56423D',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Invoices Data Table */}
          <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #F0E6E4', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#FCF1EF', borderBottom: '1.5px solid #EAE0DE', color: '#89726B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Mã Hóa Đơn</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Bàn & Khu Vực</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Thời Gian</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Thu Ngân</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Chi Tiết Món</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Phương Thức</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Tổng Tiền</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Trạng Thái</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800, textAlign: 'center' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#89726B' }}>
                        <Icon name="search_off" size={40} style={{ color: '#CCC', display: 'block', margin: '0 auto 8px' }} />
                        Không tìm thấy hóa đơn nào phù hợp với bộ lọc!
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv, idx) => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #F0E6E4', background: idx % 2 === 0 ? '#FFFFFF' : '#FFFAF9' }}>
                        <td style={{ padding: '14px 18px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#9D4124' }}>
                          {inv.id}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <strong style={{ color: '#1F1B1A' }}>{inv.table}</strong>
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#89726B' }}>{inv.zone}</span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontWeight: 600, color: '#1F1B1A' }}>{inv.time}</span>
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#89726B' }}>{inv.shift}</span>
                        </td>
                        <td style={{ padding: '14px 18px', color: '#56423D' }}>
                          {inv.cashier}
                        </td>
                        <td style={{ padding: '14px 18px', maxWidth: '240px' }}>
                          <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{inv.itemsCount} món</span>
                          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#89726B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {inv.itemsSummary}
                          </p>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                            background: inv.method === 'BANK_TRANSFER' ? '#FFDBC9' : inv.method === 'CASH' ? '#FCF1EF' : '#DDE8AB',
                            color: inv.method === 'BANK_TRANSFER' ? '#9D4124' : inv.method === 'CASH' ? '#753400' : '#181E00'
                          }}>
                            {inv.methodLabel}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '0.95rem', color: '#1F1B1A' }}>
                          {inv.amount.toLocaleString('vi-VN')}₫
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800,
                            background: inv.status === 'PAID' ? '#DDE8AB' : '#FFDAD6',
                            color: inv.status === 'PAID' ? '#181E00' : '#93000A'
                          }}>
                            {inv.statusLabel}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setViewingHistoryInvoice(inv);
                              setShowInvoiceModal(true);
                            }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              padding: '6px 12px', borderRadius: '8px',
                              border: '1px solid #EAE0DE', background: '#FFFFFF',
                              color: '#9D4124', fontWeight: 700, fontSize: '0.78rem',
                              cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                            }}
                          >
                            <Icon name="print" size={16} />
                            <span>In lại HĐ</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: KÉT TIỀN & CHỐT CA LÀM VIỆC */}
      {activePosTab === 'SHIFT' && (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Shift Balance Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
              <span style={{ fontSize: '0.78rem', color: '#89726B', fontWeight: 600 }}>Quỹ tiền mặt đầu ca</span>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#1F1B1A', marginTop: '6px' }}>
                2.000.000₫
              </div>
              <span style={{ fontSize: '0.72rem', color: '#596232' }}>Bàn giao lúc 06:00 AM</span>
            </div>

            <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
              <span style={{ fontSize: '0.78rem', color: '#89726B', fontWeight: 600 }}>Tiền mặt thực thu trong ca</span>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#994703', marginTop: '6px' }}>
                +8.650.000₫
              </div>
              <span style={{ fontSize: '0.72rem', color: '#89726B' }}>24 giao dịch tiền mặt</span>
            </div>

            <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
              <span style={{ fontSize: '0.78rem', color: '#89726B', fontWeight: 600 }}>Chuyển khoản VietQR</span>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#9D4124', marginTop: '6px' }}>
                14.800.000₫
              </div>
              <span style={{ fontSize: '0.72rem', color: '#596232' }}>30 GD tự động khớp</span>
            </div>

            <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
              <span style={{ fontSize: '0.78rem', color: '#89726B', fontWeight: 600 }}>Thẻ POS Chip (mPOS)</span>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#596232', marginTop: '6px' }}>
                5.000.000₫
              </div>
              <span style={{ fontSize: '0.72rem', color: '#596232' }}>10 GD batch đã chốt</span>
            </div>

            <div style={{ background: '#FFDBC9', padding: '16px 20px', borderRadius: '16px', border: '1.5px solid #FFB59F' }}>
              <span style={{ fontSize: '0.78rem', color: '#753400', fontWeight: 800, textTransform: 'uppercase' }}>Két tiền lý thuyết</span>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#753400', marginTop: '6px' }}>
                10.650.000₫
              </div>
              <span style={{ fontSize: '0.72rem', color: '#753400' }}>= Quỹ đầu + Tiền mặt thu</span>
            </div>
          </div>

          {/* 2-Column Split: Left Cash Count Form & Incidents vs Right Thermal Z-Report */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', alignItems: 'flex-start' }}>
            {/* Left 7 cols: Denomination Counting & Notes */}
            <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Denomination Counter Box */}
              <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '20px', border: '1px solid #F0E6E4', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="payments" size={22} style={{ color: '#9D4124' }} />
                    <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#1F1B1A', margin: 0 }}>
                      Bảng Kiểm Đếm Tiền Mặt Theo Mệnh Giá
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#596232', background: '#DDE8AB', padding: '3px 8px', borderRadius: '6px' }}>
                    Kiểm đếm két thực tế
                  </span>
                </div>

                {/* Denomination Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { denom: 500000, label: '500.000₫' },
                    { denom: 200000, label: '200.000₫' },
                    { denom: 100000, label: '100.000₫' },
                    { denom: 50000, label: '50.000₫' },
                    { denom: 20000, label: '20.000₫' },
                    { denom: 10000, label: '10.000₫' }
                  ].map(item => {
                    const count = denominations[item.denom] || 0;
                    const subtotalDenom = item.denom * count;
                    return (
                      <div key={item.denom} style={{ background: '#FCF1EF', padding: '12px 14px', borderRadius: '12px', border: '1px solid #EAE0DE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1F1B1A' }}>{item.label}</span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#89726B', marginTop: '2px' }}>
                            = {subtotalDenom.toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setDenominations(prev => ({ ...prev, [item.denom]: Math.max(0, (prev[item.denom] || 0) - 1) }))}
                            style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid #EAE0DE', background: '#FFFFFF', color: '#56423D', fontWeight: 800, cursor: 'pointer' }}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={count}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setDenominations(prev => ({ ...prev, [item.denom]: val }));
                            }}
                            style={{ width: '45px', textAlign: 'center', padding: '4px', borderRadius: '8px', border: '1px solid #EAE0DE', background: '#FFFFFF', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", outline: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => setDenominations(prev => ({ ...prev, [item.denom]: (prev[item.denom] || 0) + 1 }))}
                            style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid #EAE0DE', background: '#FFFFFF', color: '#56423D', fontWeight: 800, cursor: 'pointer' }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total Counted vs Theoretical Box */}
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  borderRadius: '14px',
                  background: cashDifference === 0 ? '#EBF5E9' : '#FDE8E8',
                  border: cashDifference === 0 ? '1.5px solid #A6D799' : '1.5px solid #F8B4B4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: cashDifference === 0 ? '#276722' : '#9B1C1C', fontWeight: 700 }}>
                      Tổng tiền mặt thực tế đã đếm:
                    </span>
                    <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.4rem', color: cashDifference === 0 ? '#184F14' : '#771D1D' }}>
                      {totalCountedCash.toLocaleString('vi-VN')}₫
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#56423D', display: 'block' }}>
                      Chênh lệch két:
                    </span>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      background: cashDifference === 0 ? '#DDE8AB' : '#FFDAD6',
                      color: cashDifference === 0 ? '#181E00' : '#BA1A1A'
                    }}>
                      {cashDifference === 0 ? '✓ Khớp 100% (Lệch 0₫)' : `${cashDifference > 0 ? '+' : ''}${cashDifference.toLocaleString('vi-VN')}₫`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Incidents & Handover Notes */}
              <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '20px', border: '1px solid #F0E6E4', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="description" size={22} style={{ color: '#9D4124' }} />
                  <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#1F1B1A', margin: 0 }}>
                    Sự Vụ Ca Trực & Ghi Chú Bàn Giao
                  </h3>
                </div>

                <div style={{ background: '#FFF8F6', padding: '12px 16px', borderRadius: '12px', border: '1px solid #F0E6E4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FCE8E6', color: '#BA1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="remove_shopping_cart" size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#1F1B1A' }}>Đơn hủy món / Hoàn tiền ca sáng</strong>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#89726B' }}>2 đơn (Đã được Quản lý #MGR-084 phê duyệt)</span>
                    </div>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: '#BA1A1A', fontSize: '1rem' }}>
                    -410.000₫
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                    Ghi chú bàn giao cho thu ngân ca tiếp theo:
                  </label>
                  <textarea
                    rows={3}
                    value={handoverNote}
                    onChange={(e) => setHandoverNote(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #EAE0DE',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right 5 cols: Thermal Z-Report Receipt Preview (80mm) */}
            <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '18px',
                padding: '20px',
                border: '1px solid #EAE0DE',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px dashed #CCC' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="receipt_long" size={20} style={{ color: '#9D4124' }} />
                    <strong style={{ fontFamily: "'Epilogue', sans-serif", fontSize: '0.95rem', color: '#1F1B1A' }}>Biên Bản Z-Report (K80)</strong>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#FFDBC9', color: '#753400', padding: '2px 8px', borderRadius: '6px' }}>
                    80mm Preview
                  </span>
                </div>

                {/* Thermal Slip Body */}
                <div style={{
                  background: '#FFFAF8',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #F0E6E4',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.78rem',
                  color: '#1F1B1A',
                  lineHeight: 1.6
                }}>
                  <div style={{ textAlign: 'center', paddingBottom: '10px', borderBottom: '1px dashed #999' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#9D4124' }}>ROMS RESTAURANT</div>
                    <div style={{ fontSize: '0.7rem', color: '#56423D' }}>Số 123 Đường Ẩm Thực, Q.1, TP.HCM</div>
                    <div style={{ fontWeight: 800, marginTop: '6px' }}>BIÊN BẢN CHỐT CA & BÀN GIAO KÉT</div>
                    <div style={{ fontSize: '0.7rem', color: '#89726B' }}>Mã ca: #SHIFT-20250921-S1</div>
                  </div>

                  <div style={{ padding: '8px 0', borderBottom: '1px dashed #CCC', fontSize: '0.74rem' }}>
                    <div>Ngày: {new Date().toLocaleDateString('vi-VN')} • Giờ: {new Date().toLocaleTimeString('vi-VN')}</div>
                    <div>Ca làm việc: <strong>Ca Sáng (06:00 - 14:00)</strong></div>
                    <div>Thu ngân bàn giao: <strong>Hoàng Hải Yến (#CSH-002)</strong></div>
                    <div>Thu ngân tiếp nhận: <strong>Nguyễn Mai Anh (#EMP-8842)</strong></div>
                  </div>

                  <div style={{ padding: '8px 0', borderBottom: '1px dashed #CCC' }}>
                    <div style={{ fontWeight: 800, marginBottom: '4px' }}>DOANH THU THEO PHƯƠNG THỨC:</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>- Tiền mặt thu:</span>
                      <strong>8.650.000₫</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>- VietQR Chuyển khoản:</span>
                      <strong>14.800.000₫</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>- Quẹt thẻ mPOS:</span>
                      <strong>5.000.000₫</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginTop: '4px', borderTop: '1px dotted #AAA', paddingTop: '4px' }}>
                      <span>TỔNG DOANH THU CA:</span>
                      <strong style={{ color: '#9D4124' }}>28.450.000₫</strong>
                    </div>
                  </div>

                  <div style={{ padding: '8px 0', borderBottom: '1px dashed #CCC' }}>
                    <div style={{ fontWeight: 800, marginBottom: '4px' }}>KIỂM KÊ KÉT TIỀN MẶT:</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>+ Quỹ tiền mặt đầu ca:</span>
                      <span>2.000.000₫</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>+ Tiền mặt thực thu:</span>
                      <span>8.650.000₫</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '1px dotted #AAA', paddingTop: '4px' }}>
                      <span>= Két tiền lý thuyết:</span>
                      <strong>10.650.000₫</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#596232', fontWeight: 800 }}>
                      <span>= Tiền mặt thực đếm:</span>
                      <strong>{totalCountedCash.toLocaleString('vi-VN')}₫</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: cashDifference === 0 ? '#596232' : '#BA1A1A' }}>
                      <span>CHÊNH LỆCH KÉT:</span>
                      <span>{cashDifference === 0 ? '0₫ (Khớp 100%)' : `${cashDifference.toLocaleString('vi-VN')}₫`}</span>
                    </div>
                  </div>

                  {isShiftClosed ? (
                    <div style={{
                      margin: '10px 0 4px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: '#DDE8AB',
                      color: '#181E00',
                      textAlign: 'center',
                      fontSize: '0.74rem',
                      fontWeight: 800
                    }}>
                      ✓ ĐÃ CHỐT CA - DUYỆT BỞI QUẢN LÝ #MGR-084 ({shiftApprovedAt})
                    </div>
                  ) : (
                    <div style={{ padding: '10px 0 4px', textAlign: 'center', fontSize: '0.72rem', color: '#BA1A1A', fontWeight: 600 }}>
                      * Yêu cầu Quản lý xác nhận mã PIN (6 số) để phê duyệt chốt ca & bàn giao két.
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                  {isShiftClosed ? (
                    <button
                      type="button"
                      onClick={handleOpenShiftApproval}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        background: '#596232',
                        color: '#FFFFFF',
                        border: 'none',
                        fontFamily: "'Epilogue', sans-serif",
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(89, 98, 50, 0.25)'
                      }}
                    >
                      <Icon name="verified" size={18} />
                      <span>Ca Đã Chốt • Xem Phê Duyệt Quản Lý</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleOpenShiftApproval}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        background: '#9D4124',
                        color: '#FFFFFF',
                        border: 'none',
                        fontFamily: "'Epilogue', sans-serif",
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(157, 65, 36, 0.25)'
                      }}
                    >
                      <Icon name="lock_clock" size={18} />
                      <span>Chốt Ca (Quản Lý Xác Nhận)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '12px',
                      background: '#F0E6E4',
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
                    <span>In Biên Bản Z-Report (K80)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: VietQR Payment Dynamic Code */}
      {showVietQrModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(31, 27, 26, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '420px',
            borderRadius: '24px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 12px 36px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="qr_code_2" size={24} style={{ color: '#9D4124' }} />
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#1F1B1A', margin: 0 }}>
                  Quét Mã VietQR Chuyển Khoản
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVietQrModal(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F6ECEA', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div style={{ background: '#FFF8F6', padding: '16px', borderRadius: '20px', border: '2px dashed #9D4124', display: 'inline-block', marginBottom: '14px' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`2|99|0901234567|ROMS BISTRO||0|0|${totalAmount}|${currentTable.code} TT HOA DON`)}`}
                alt="VietQR Code"
                style={{ width: '200px', height: '200px', display: 'block' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '0.78rem', color: '#89726B', display: 'block' }}>Số tiền thanh toán:</span>
              <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.45rem', color: '#9D4124' }}>
                {totalAmount.toLocaleString('vi-VN')}₫
              </span>
              <div style={{ fontSize: '0.78rem', color: '#56423D', marginTop: '4px' }}>
                Nội dung: <strong>{currentTable.code} {currentTable.orderCode}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowVietQrModal(false)}
                style={{ flex: 1, padding: '11px', borderRadius: '12px', background: '#F0E6E4', border: 'none', fontWeight: 700, fontSize: '0.85rem', color: '#56423D', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={finalizePayment}
                style={{ flex: 1, padding: '11px', borderRadius: '12px', background: '#059669', border: 'none', fontWeight: 700, fontSize: '0.85rem', color: '#FFFFFF', cursor: 'pointer' }}
              >
                Đã Nhận Tiền
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Print Invoice Preview (SCR-03) */}
      {showInvoiceModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(31, 27, 26, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '450px',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {(() => {
              const activeInv = viewingHistoryInvoice || currentTable;
              const invCode = viewingHistoryInvoice ? viewingHistoryInvoice.id : currentTable.orderCode;
              const invTable = viewingHistoryInvoice ? viewingHistoryInvoice.table : currentTable.label;
              const invCashier = viewingHistoryInvoice ? viewingHistoryInvoice.cashier : 'Hoàng Hải Yến (#CSH-002)';
              const invItems = viewingHistoryInvoice ? (viewingHistoryInvoice.items || []) : currentTable.items;
              const invTotal = viewingHistoryInvoice ? viewingHistoryInvoice.amount : totalAmount;
              const invVat = viewingHistoryInvoice ? Math.round(viewingHistoryInvoice.amount * 0.08 / 1.08) : vat;
              const invSubtotal = invTotal - invVat;

              return (
                <>
                  <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '1px dashed #CCC' }}>
                    <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.4rem', color: '#9D4124' }}>
                      ROMS BISTRO
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#56423D' }}>Số 123 Đường Ẩm Thực, Quận 1, TP. Hồ Chí Minh</div>
                    <div style={{ fontSize: '0.78rem', color: '#56423D' }}>Hotline: 1900-8888 • MST: 0312345678</div>
                    <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#1F1B1A', marginTop: '10px' }}>
                      HÓA ĐƠN THANH TOÁN
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#89726B' }}>
                      Mã HĐ: {invCode} • Ngày: {new Date().toLocaleDateString('vi-VN')}
                    </div>
                  </div>

                  <div style={{ padding: '14px 0', borderBottom: '1px dashed #CCC', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Bàn: <strong>{invTable}</strong></span>
                    <span>Thu ngân: <strong>{invCashier}</strong></span>
                  </div>

                  {/* Line items */}
                  <div style={{ overflowY: 'auto', flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                    {invItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div>{item.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#89726B' }}>{item.qty} x {item.price.toLocaleString('vi-VN')}₫</div>
                        </div>
                        <div style={{ fontWeight: 700 }}>
                          {(item.price * item.qty).toLocaleString('vi-VN')}₫
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div style={{ padding: '12px 0', borderTop: '1px dashed #CCC', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Cộng tiền món:</span>
                      <span>{invSubtotal.toLocaleString('vi-VN')}₫</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>VAT (8%):</span>
                      <span>{invVat.toLocaleString('vi-VN')}₫</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: '#9D4124', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #1F1B1A' }}>
                      <span>TỔNG CỘNG:</span>
                      <span>{invTotal.toLocaleString('vi-VN')}₫</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#89726B', padding: '10px 0' }}>
                    Cảm ơn quý khách và hẹn gặp lại!
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowInvoiceModal(false);
                        setViewingHistoryInvoice(null);
                      }}
                      style={{ flex: 1, padding: '11px', borderRadius: '12px', background: '#F0E6E4', border: 'none', fontWeight: 700, fontSize: '0.85rem', color: '#56423D', cursor: 'pointer' }}
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                        setShowInvoiceModal(false);
                        setViewingHistoryInvoice(null);
                      }}
                      style={{ flex: 1, padding: '11px', borderRadius: '12px', background: '#9D4124', border: 'none', fontWeight: 700, fontSize: '0.85rem', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Icon name="print" size={18} /> In Hóa Đơn
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL 3: Cash Drawer & Shift Handover Close (SCR-04) */}
      {showShiftModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(31, 27, 26, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '520px',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="lock_clock" size={24} style={{ color: '#9D4124' }} />
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1F1B1A', margin: 0 }}>
                  Kiểm Két & Chốt Ca Làm Việc
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShiftModal(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F6ECEA', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#FFF8F6', padding: '12px', borderRadius: '12px', border: '1px solid #F0E6E4' }}>
                <span style={{ fontSize: '0.72rem', color: '#89726B', display: 'block' }}>Tiền mặt đầu ca</span>
                <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#1F1B1A' }}>
                  2.000.000₫
                </span>
              </div>
              <div style={{ background: '#FFF8F6', padding: '12px', borderRadius: '12px', border: '1px solid #F0E6E4' }}>
                <span style={{ fontSize: '0.72rem', color: '#89726B', display: 'block' }}>Doanh thu tiền mặt</span>
                <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#059669' }}>
                  1.500.000₫
                </span>
              </div>
              <div style={{ background: '#FFF8F6', padding: '12px', borderRadius: '12px', border: '1px solid #F0E6E4' }}>
                <span style={{ fontSize: '0.72rem', color: '#89726B', display: 'block' }}>Chuyển khoản VietQR</span>
                <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#9D4124' }}>
                  4.820.000₫
                </span>
              </div>
              <div style={{ background: '#FFF8F6', padding: '12px', borderRadius: '12px', border: '1px solid #F0E6E4' }}>
                <span style={{ fontSize: '0.72rem', color: '#89726B', display: 'block' }}>Tổng doanh thu ca</span>
                <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#994703' }}>
                  6.320.000₫
                </span>
              </div>
            </div>

            <div style={{ background: '#FCF1EF', padding: '14px', borderRadius: '14px', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: '#89726B', display: 'block' }}>Tổng tiền mặt thực tế trong két phải có:</span>
              <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.35rem', color: '#9D4124' }}>
                3.500.000₫
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowShiftModal(false)}
                style={{ flex: 1, padding: '11px', borderRadius: '12px', background: '#F0E6E4', border: 'none', fontWeight: 700, fontSize: '0.85rem', color: '#56423D', cursor: 'pointer' }}
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowShiftModal(false);
                  showToast('Đã in phiếu bàn giao ca và chốt sổ thành công!');
                }}
                style={{ flex: 1, padding: '11px', borderRadius: '12px', background: '#9D4124', border: 'none', fontWeight: 700, fontSize: '0.85rem', color: '#FFFFFF', cursor: 'pointer' }}
              >
                In Phiếu Bàn Giao Ca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QUẢN LÝ XÁC NHẬN HỦY MÓN (MANAGER OVERRIDE) */}
      {showVoidModal && itemToVoid && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '440px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
            border: '2px solid #BA1A1A',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: '#FFDAD6',
                color: '#BA1A1A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon name="verified_user" size={26} />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                  Xác Nhận Hủy Món
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#BA1A1A', fontWeight: 700 }}>
                  Yêu cầu phê duyệt từ Quản Lý ca trực
                </span>
              </div>
            </div>

            {/* Item summary */}
            <div style={{
              background: '#FFF8F6',
              border: '1px dashed #EAE0DE',
              borderRadius: '14px',
              padding: '12px 16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: '#1F1B1A', fontSize: '0.95rem' }}>
                  {itemToVoid.name} ({itemToVoid.qty} phần)
                </span>
                <span style={{ fontWeight: 800, color: '#BA1A1A', fontSize: '0.95rem' }}>
                  {(itemToVoid.price * itemToVoid.qty).toLocaleString('vi-VN')}₫
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#89726B' }}>
                Bàn phục vụ: <b>{currentTable.label}</b> • Hóa đơn: {currentTable.orderCode}
              </span>
            </div>

            {/* Void Reason */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                Lý Do Hủy Món <span style={{ color: '#BA1A1A' }}>*</span>
              </label>
              <select
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #EAE0DE',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#1F1B1A',
                  background: '#FFFFFF',
                  outline: 'none'
                }}
              >
                <option value="Khách đổi ý trước khi chế biến">Khách đổi ý trước khi chế biến</option>
                <option value="Món hết nguyên liệu / Bếp báo hủy">Món hết nguyên liệu / Bếp báo hủy</option>
                <option value="Nhân viên order nhầm món">Nhân viên order nhầm món</option>
                <option value="Khách khiếu nại chất lượng món ăn">Khách khiếu nại chất lượng món ăn</option>
                <option value="Khách về sớm / Hủy cả bàn">Khách về sớm / Hủy cả bàn</option>
              </select>
            </div>

            {/* Manager PIN */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                Nhập Mã PIN Quản Lý (Demo: 123456) <span style={{ color: '#BA1A1A' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="••••••"
                  value={managerPin}
                  onChange={(e) => {
                    setManagerPin(e.target.value);
                    setVoidError(null);
                  }}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: voidError ? '2px solid #BA1A1A' : '1px solid #EAE0DE',
                    background: '#FDF7F5',
                    fontSize: '1.2rem',
                    letterSpacing: '6px',
                    textAlign: 'center',
                    fontWeight: 800,
                    color: '#1F1B1A',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {voidError && (
                <div style={{ color: '#BA1A1A', fontSize: '0.78rem', fontWeight: 700, marginTop: '6px', textAlign: 'center' }}>
                  {voidError}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowVoidModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#F0E6E4',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: '#56423D',
                  cursor: 'pointer'
                }}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                style={{
                  flex: 1.4,
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#BA1A1A',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Icon name="check_circle" size={18} />
                Xác Nhận Hủy Món
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QUẢN LÝ PHÊ DUYỆT CHỐT CA & BÀN GIAO KÉT TIỀN */}
      {showShiftApprovalModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '520px',
            width: '100%',
            padding: '26px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
            border: '2px solid #9D4124',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: '#FFDBC9',
                color: '#9D4124',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon name="shield_person" size={26} />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                  Quản Lý Phê Duyệt Chốt Ca
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#9D4124', fontWeight: 700 }}>
                  Xác nhận số liệu doanh thu & bàn giao két tiền ca trực
                </span>
              </div>
            </div>

            {/* Shift Summary Cards */}
            <div style={{
              background: '#FFF8F6',
              borderRadius: '16px',
              border: '1px solid #F0E6E4',
              padding: '14px',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderBottom: '1px dashed #EAE0DE', paddingBottom: '8px' }}>
                <span style={{ color: '#89726B' }}>Thu ngân chốt ca:</span>
                <strong style={{ color: '#1F1B1A' }}>Hoàng Hải Yến (#CSH-002)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderBottom: '1px dashed #EAE0DE', paddingBottom: '8px' }}>
                <span style={{ color: '#89726B' }}>Ca trực bàn giao:</span>
                <span style={{ fontWeight: 700, color: '#1F1B1A' }}>Ca Sáng (06:00 - 14:00)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderBottom: '1px dashed #EAE0DE', paddingBottom: '8px' }}>
                <span style={{ color: '#89726B' }}>Tổng doanh thu ca:</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: '#9D4124' }}>28.450.000₫</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderBottom: '1px dashed #EAE0DE', paddingBottom: '8px' }}>
                <span style={{ color: '#89726B' }}>Tiền mặt thực đếm trong két:</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: '#1F1B1A' }}>{totalCountedCash.toLocaleString('vi-VN')}₫</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <span style={{ color: '#89726B' }}>Tình trạng đối soát két:</span>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  background: cashDifference === 0 ? '#DDE8AB' : '#FFDAD6',
                  color: cashDifference === 0 ? '#181E00' : '#BA1A1A'
                }}>
                  {cashDifference === 0 ? '✓ Khớp 100% (0₫)' : `Lệch: ${cashDifference.toLocaleString('vi-VN')}₫`}
                </span>
              </div>
            </div>

            {/* Manager Note */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                Ghi Chú Phê Duyệt Của Quản Lý:
              </label>
              <textarea
                rows={2}
                value={shiftManagerNote}
                onChange={(e) => setShiftManagerNote(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #EAE0DE',
                  fontSize: '0.82rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'none'
                }}
              />
            </div>

            {/* Manager PIN (Strict 6 digits) */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                Nhập Mã PIN Quản Lý (Demo: 123456) <span style={{ color: '#BA1A1A' }}>*</span>
              </label>
              <input
                type="password"
                maxLength={6}
                placeholder="••••••"
                value={shiftManagerPin}
                onChange={(e) => {
                  setShiftManagerPin(e.target.value);
                  setShiftApprovalError(null);
                }}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: shiftApprovalError ? '2px solid #BA1A1A' : '1px solid #EAE0DE',
                  background: '#FDF7F5',
                  fontSize: '1.25rem',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  fontWeight: 800,
                  color: '#1F1B1A',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {shiftApprovalError && (
                <div style={{ color: '#BA1A1A', fontSize: '0.78rem', fontWeight: 700, marginTop: '6px', textAlign: 'center' }}>
                  {shiftApprovalError}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowShiftApprovalModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#F0E6E4',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: '#56423D',
                  cursor: 'pointer'
                }}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmShiftClose}
                style={{
                  flex: 1.5,
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#9D4124',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(157, 65, 36, 0.28)'
                }}
              >
                <Icon name="verified" size={18} />
                Quản Lý Xác Nhận Chốt Ca
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
