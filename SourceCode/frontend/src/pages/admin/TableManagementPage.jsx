import React, { useState } from 'react';
import Icon from '../../components/common/Icon';

const INITIAL_ZONES = [
  { id: 'ALL', name: 'Tất Cả Khu Vực', count: 18 },
  { id: 'ZONE_1', name: 'Tầng 1 - Sảnh Chính', count: 10 },
  { id: 'ZONE_2', name: 'Tầng 2 - Ban Công', count: 5 },
  { id: 'VIP', name: 'Phòng VIP', count: 3 },
];

const INITIAL_TABLES = [
  { id: 1, code: 'T-01', name: 'Bàn T-01', zone: 'ZONE_1', zoneName: 'Tầng 1 - Sảnh Chính', capacity: 4, shape: 'SQUARE', status: 'OCCUPIED', guests: 3, currentBill: 820000, timeIn: '18:45', qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/T-01' },
  { id: 2, code: 'T-02', name: 'Bàn T-02', zone: 'ZONE_1', zoneName: 'Tầng 1 - Sảnh Chính', capacity: 2, shape: 'ROUND', status: 'AVAILABLE', guests: 0, currentBill: 0, timeIn: null, qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/T-02' },
  { id: 3, code: 'T-03', name: 'Bàn T-03', zone: 'ZONE_1', zoneName: 'Tầng 1 - Sảnh Chính', capacity: 4, shape: 'SQUARE', status: 'OCCUPIED', guests: 4, currentBill: 1250000, timeIn: '19:10', qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/T-03' },
  { id: 4, code: 'T-04', name: 'Bàn T-04', zone: 'ZONE_1', zoneName: 'Tầng 1 - Sảnh Chính', capacity: 6, shape: 'RECTANGLE', status: 'RESERVED', guests: 0, currentBill: 0, timeIn: 'Đặt lúc 20:00', qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/T-04' },
  { id: 5, code: 'T-05', name: 'Bàn T-05', zone: 'ZONE_1', zoneName: 'Tầng 1 - Sảnh Chính', capacity: 4, shape: 'SQUARE', status: 'DIRTY', guests: 0, currentBill: 0, timeIn: null, qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/T-05' },
  { id: 6, code: 'T-06', name: 'Bàn T-06', zone: 'ZONE_1', zoneName: 'Tầng 1 - Sảnh Chính', capacity: 4, shape: 'SQUARE', status: 'AVAILABLE', guests: 0, currentBill: 0, timeIn: null, qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/T-06' },
  { id: 7, code: 'T-07', name: 'Bàn T-07', zone: 'ZONE_1', zoneName: 'Tầng 1 - Sảnh Chính', capacity: 8, shape: 'RECTANGLE', status: 'AVAILABLE', guests: 0, currentBill: 0, timeIn: null, qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/T-07' },
  { id: 8, code: 'T-08', name: 'Bàn T-08', zone: 'ZONE_1', zoneName: 'Tầng 1 - Sảnh Chính', capacity: 2, shape: 'ROUND', status: 'OCCUPIED', guests: 2, currentBill: 450000, timeIn: '19:30', qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/T-08' },

  { id: 9, code: 'B-01', name: 'Ban Công 01', zone: 'ZONE_2', zoneName: 'Tầng 2 - Ban Công', capacity: 4, shape: 'SQUARE', status: 'OCCUPIED', guests: 3, currentBill: 670000, timeIn: '18:50', qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/B-01' },
  { id: 10, code: 'B-02', name: 'Ban Công 02', zone: 'ZONE_2', zoneName: 'Tầng 2 - Ban Công', capacity: 4, shape: 'SQUARE', status: 'AVAILABLE', guests: 0, currentBill: 0, timeIn: null, qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/B-02' },
  { id: 11, code: 'B-03', name: 'Ban Công 03', zone: 'ZONE_2', zoneName: 'Tầng 2 - Ban Công', capacity: 2, shape: 'ROUND', status: 'BLOCKED', blockedReason: 'Bảo trì hệ thống đèn & thông gió', guests: 0, currentBill: 0, timeIn: null, qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/B-03' },
  { id: 12, code: 'B-04', name: 'Ban Công 04', zone: 'ZONE_2', zoneName: 'Tầng 2 - Ban Công', capacity: 6, shape: 'RECTANGLE', status: 'RESERVED', guests: 0, currentBill: 0, timeIn: 'Đặt lúc 20:30', reservationInfo: 'Chị Mai (0982xxx)', qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/B-04' },
  { id: 13, code: 'B-05', name: 'Ban Công 05', zone: 'ZONE_2', zoneName: 'Tầng 2 - Ban Công', capacity: 4, shape: 'SQUARE', status: 'OCCUPIED', guests: 4, currentBill: 1120000, timeIn: '19:15', qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/B-05' },

  { id: 14, code: 'VIP-01', name: 'Hoàng Gia', zone: 'VIP', zoneName: 'Phòng VIP', capacity: 12, shape: 'RECTANGLE', status: 'OCCUPIED', guests: 10, currentBill: 5800000, timeIn: '18:00', qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/VIP-01' },
  { id: 15, code: 'VIP-02', name: 'Thượng Uyển', zone: 'VIP', zoneName: 'Phòng VIP', capacity: 8, shape: 'ROUND', status: 'AVAILABLE', guests: 0, currentBill: 0, timeIn: null, qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/VIP-02' },
  { id: 16, code: 'VIP-03', name: 'Sen Vàng', zone: 'VIP', zoneName: 'Phòng VIP', capacity: 10, shape: 'RECTANGLE', status: 'RESERVED', guests: 0, currentBill: 0, timeIn: 'Đặt lúc 21:00', reservationInfo: 'Anh Tuấn (0912xxx)', qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/VIP-03' },

  { id: 17, code: 'T-09', name: 'Bàn T-09', zone: 'ZONE_1', zoneName: 'Tầng 1 - Sảnh Chính', capacity: 4, shape: 'RECTANGLE', status: 'OCCUPIED', guests: 2, currentBill: 340000, timeIn: '19:40', qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/T-09' },
  { id: 18, code: 'T-10', name: 'Bàn T-10', zone: 'ZONE_1', zoneName: 'Tầng 1 - Sảnh Chính', capacity: 4, shape: 'RECTANGLE', status: 'AVAILABLE', guests: 0, currentBill: 0, timeIn: null, qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/T-10' },
];

export default function TableManagementPage() {
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQrTable, setSelectedQrTable] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Status Modal State (Cập nhật trạng thái bàn, khóa bàn, đặt bàn với thời gian)
  const [statusModalTable, setStatusModalTable] = useState(null);
  const [statusForm, setStatusForm] = useState({
    status: 'AVAILABLE',
    reservationTime: '19:30',
    reservationGuest: '',
    guestsCount: 4,
    blockedReason: 'Bảo trì trang thiết bị'
  });

  // New Table Form
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    zone: 'ZONE_1',
    capacity: 4,
    shape: 'SQUARE'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredTables = tables.filter(t => {
    if (selectedZone !== 'ALL' && t.zone !== selectedZone) return false;
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      return t.code.toLowerCase().includes(q) || t.name.toLowerCase().includes(q);
    }
    return true;
  });

  // Open Status Configuration Modal
  const handleOpenStatusModal = (table, targetStatus = null) => {
    setStatusModalTable(table);
    setStatusForm({
      status: targetStatus || table.status,
      reservationTime: table.timeIn ? table.timeIn.replace('Đặt lúc ', '') : '20:00',
      reservationGuest: table.reservationInfo || '',
      guestsCount: table.guests || table.capacity,
      blockedReason: table.blockedReason || 'Bảo trì định kỳ / Ghép bàn'
    });
  };

  // Save Table Status
  const handleSaveTableStatus = () => {
    if (!statusModalTable) return;
    setTables(prev => prev.map(t => {
      if (t.id === statusModalTable.id) {
        return {
          ...t,
          status: statusForm.status,
          timeIn: statusForm.status === 'RESERVED'
            ? `Đặt lúc ${statusForm.reservationTime}`
            : (statusForm.status === 'OCCUPIED' ? (t.timeIn || '19:00') : null),
          reservationInfo: statusForm.status === 'RESERVED' ? statusForm.reservationGuest : null,
          blockedReason: statusForm.status === 'BLOCKED' ? statusForm.blockedReason : null,
          guests: statusForm.status === 'OCCUPIED'
            ? parseInt(statusForm.guestsCount) || t.capacity
            : (statusForm.status === 'RESERVED' ? parseInt(statusForm.guestsCount) || t.capacity : 0)
        };
      }
      return t;
    }));
    const tCode = statusModalTable.code;
    setStatusModalTable(null);
    showToast(`Đã cập nhật trạng thái bàn ${tCode}!`);
  };

  // Handle Add Table
  const handleCreateTable = (e) => {
    e.preventDefault();
    if (!formData.code.trim()) return;

    const zoneObj = INITIAL_ZONES.find(z => z.id === formData.zone);
    const newT = {
      id: Date.now(),
      code: formData.code.toUpperCase(),
      name: formData.name || `Bàn ${formData.code.toUpperCase()}`,
      zone: formData.zone,
      zoneName: zoneObj ? zoneObj.name : 'Sảnh',
      capacity: parseInt(formData.capacity) || 4,
      shape: formData.shape,
      status: 'AVAILABLE',
      guests: 0,
      currentBill: 0,
      timeIn: null,
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/${formData.code.toUpperCase()}`
    };

    setTables(prev => [newT, ...prev]);
    setShowAddModal(false);
    setFormData({ code: '', name: '', zone: 'ZONE_1', capacity: 4, shape: 'SQUARE' });
    showToast(`Đã thêm bàn mới: ${newT.code} (${newT.name})`);
  };

  // Quick toggle table status
  const handleToggleStatus = (id, newStatus) => {
    setTables(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: newStatus,
          guests: newStatus === 'AVAILABLE' || newStatus === 'DIRTY' || newStatus === 'BLOCKED' ? 0 : t.guests
        };
      }
      return t;
    }));
    showToast('Đã cập nhật trạng thái bàn!');
  };

  const totalSeats = tables.reduce((s, t) => s + t.capacity, 0);
  const occupiedSeats = tables.filter(t => t.status === 'OCCUPIED').reduce((s, t) => s + t.guests, 0);
  const occupiedTables = tables.filter(t => t.status === 'OCCUPIED').length;
  const reservedTables = tables.filter(t => t.status === 'RESERVED').length;
  const availableTables = tables.filter(t => t.status === 'AVAILABLE').length;
  const blockedTables = tables.filter(t => t.status === 'BLOCKED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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

      {/* Header & Quick Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9D4124', background: '#FFDBC9', padding: '2px 8px', borderRadius: '6px' }}>
              Sơ Đồ Bàn
            </span>
            <span style={{ fontSize: '0.85rem', color: '#89726B', fontWeight: 600 }}>Quản Trị Nhà Hàng</span>
          </div>
          <h1 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.75rem', color: '#1F1B1A', margin: 0 }}>
            Sơ Đồ Bàn & Quản Lý Khu Vực
          </h1>
          <p style={{ margin: '4px 0 0', color: '#56423D', fontSize: '0.88rem' }}>
            Cấu hình bàn ăn, tải mã QR Order tại bàn, theo dõi tình trạng phục vụ theo thời gian thực.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => showToast('Đang tạo tệp PDF chứa mã QR của tất cả các bàn...')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '12px',
              background: '#FFFFFF',
              border: '1px solid #EAE0DE',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#56423D',
              cursor: 'pointer'
            }}
          >
            <Icon name="download" size={18} />
            Xuất Tất Cả Mã QR
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
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
            <Icon name="add" size={18} />
            Thêm Bàn Mới
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
        <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#89726B', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Tổng Số Bàn</span>
            <Icon name="table_restaurant" size={20} style={{ color: '#9D4124' }} />
          </div>
          <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#1F1B1A', marginTop: '6px' }}>
            {tables.length} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#89726B' }}>bàn ({totalSeats} chỗ)</span>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#89726B', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Đang Phục Vụ</span>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#9D4124' }} />
          </div>
          <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#9D4124', marginTop: '6px' }}>
            {occupiedTables} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#89726B' }}>bàn ({occupiedSeats} khách)</span>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#89726B', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Bàn Trống Sẵn Sàng</span>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#059669' }} />
          </div>
          <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#059669', marginTop: '6px' }}>
            {availableTables} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#89726B' }}>bàn</span>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#89726B', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Bàn Đã Đặt Trước</span>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D97706' }} />
          </div>
          <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#D97706', marginTop: '6px' }}>
            {reservedTables} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#89726B' }}>bàn</span>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#89726B', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Đã Khóa / Bảo Trì</span>
            <Icon name="lock" size={18} style={{ color: '#57534E' }} />
          </div>
          <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#57534E', marginTop: '6px' }}>
            {blockedTables} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#89726B' }}>bàn</span>
          </div>
        </div>
      </div>

      {/* Filter and Zone Tabs */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '16px 20px',
        border: '1px solid #F0E6E4',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Zone Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {INITIAL_ZONES.map(z => {
            const isActive = selectedZone === z.id;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setSelectedZone(z.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? '#9D4124' : '#F6ECEA',
                  color: isActive ? '#FFFFFF' : '#56423D',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {z.name}
              </button>
            );
          })}
        </div>

        {/* Search & Status Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '360px', background: '#FDF7F5', border: '1px solid #EAE0DE', borderRadius: '10px', padding: '8px 12px' }}>
            <Icon name="search" size={18} style={{ color: '#89726B' }} />
            <input
              type="text"
              placeholder="Tìm theo mã bàn, tên bàn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.85rem', color: '#1F1B1A' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#89726B', fontWeight: 600 }}>Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #EAE0DE',
                background: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#1F1B1A',
                outline: 'none'
              }}
            >
              <option value="ALL">Tất cả ({tables.length})</option>
              <option value="AVAILABLE">Trống sẵn sàng</option>
              <option value="OCCUPIED">Đang phục vụ</option>
              <option value="RESERVED">Đã đặt trước</option>
              <option value="BLOCKED">Đã khóa / Bảo trì</option>
              <option value="DIRTY">Cần dọn dẹp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Tables */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '16px'
      }}>
        {filteredTables.map(t => {
          let statusBadge = { bg: '#E8F5E9', color: '#2E7D32', label: 'Bàn Trống', icon: 'check_circle' };
          if (t.status === 'OCCUPIED') statusBadge = { bg: '#FFEBEE', color: '#C62828', label: 'Đang Phục Vụ', icon: 'restaurant' };
          else if (t.status === 'RESERVED') statusBadge = { bg: '#FFF8E1', color: '#B45309', label: 'Đã Đặt', icon: 'schedule' };
          else if (t.status === 'DIRTY') statusBadge = { bg: '#EDE7F6', color: '#4527A0', label: 'Cần Dọn', icon: 'cleaning_services' };
          else if (t.status === 'BLOCKED') statusBadge = { bg: '#F5F5F4', color: '#57534E', label: 'Đã Khóa', icon: 'lock' };

          return (
            <div
              key={t.id}
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: t.status === 'BLOCKED' ? '1.5px dashed #D1D5DB' : '1px solid #F0E6E4',
                padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                opacity: t.status === 'BLOCKED' ? 0.9 : 1,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              {/* Table Card Top */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{
                      fontFamily: "'Epilogue', sans-serif",
                      fontWeight: 900,
                      fontSize: '1.25rem',
                      color: '#1F1B1A'
                    }}>
                      {t.code}
                    </span>
                    <h4 style={{ margin: '2px 0 0', fontSize: '0.85rem', fontWeight: 600, color: '#56423D' }}>
                      {t.name}
                    </h4>
                  </div>

                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: statusBadge.bg,
                    color: statusBadge.color,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Icon name={statusBadge.icon} size={13} style={{ color: statusBadge.color }} />
                    {statusBadge.label}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#89726B' }}>
                  <Icon name="location_on" size={14} />
                  <span>{t.zoneName}</span>
                </div>
              </div>

              {/* Table Stats */}
              <div style={{
                background: '#FFF8F6',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '0.78rem'
              }}>
                <div>
                  <span style={{ color: '#89726B', display: 'block' }}>Sức chứa:</span>
                  <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{t.capacity} chỗ ({t.shape === 'ROUND' ? 'Bàn tròn' : 'Bàn vuông'})</span>
                </div>

                <div>
                  <span style={{ color: '#89726B', display: 'block' }}>Thực tế:</span>
                  <span style={{ fontWeight: 700, color: t.guests > 0 ? '#9D4124' : '#1F1B1A' }}>
                    {t.guests > 0 ? `${t.guests} khách` : '0 khách'}
                  </span>
                </div>

                {t.status === 'OCCUPIED' && (
                  <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #EAE0DE', paddingTop: '6px', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#89726B' }}>Hóa đơn hiện tại:</span>
                    <span style={{ fontWeight: 800, color: '#9D4124' }}>{t.currentBill.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}

                {t.status === 'RESERVED' && (
                  <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #EAE0DE', paddingTop: '6px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#89726B' }}>Thời gian hẹn:</span>
                      <span style={{ fontWeight: 800, color: '#B45309' }}>{t.timeIn || 'Chưa định giờ'}</span>
                    </div>
                    {t.reservationInfo && (
                      <div style={{ fontSize: '0.72rem', color: '#56423D' }}>
                        Khách: <strong>{t.reservationInfo}</strong>
                      </div>
                    )}
                  </div>
                )}

                {t.status === 'BLOCKED' && (
                  <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #EAE0DE', paddingTop: '6px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#89726B' }}>Lý do khóa:</span>
                    <span style={{ fontWeight: 700, color: '#57534E' }}>{t.blockedReason || 'Bảo trì bàn'}</span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', borderTop: '1px solid #F6ECEA', paddingTop: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedQrTable(t)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      background: '#FDF7F5',
                      border: '1px solid #EAE0DE',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#9D4124',
                      cursor: 'pointer'
                    }}
                  >
                    <Icon name="qr_code_2" size={15} />
                    QR
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenStatusModal(t)}
                    title="Cài đặt trạng thái bàn, khóa bàn hoặc thời gian đặt"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      background: '#FFFFFF',
                      border: '1px solid #9D4124',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#9D4124',
                      cursor: 'pointer'
                    }}
                  >
                    <Icon name="tune" size={15} />
                    Đổi TT
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  {t.status === 'BLOCKED' && (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(t.id, 'AVAILABLE')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: '#059669',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Mở Khóa
                    </button>
                  )}

                  {t.status === 'DIRTY' && (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(t.id, 'AVAILABLE')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: '#059669',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Đã Dọn
                    </button>
                  )}

                  {t.status === 'AVAILABLE' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(t, 'BLOCKED')}
                        title="Khóa bàn"
                        style={{
                          padding: '6px 8px',
                          borderRadius: '8px',
                          background: '#F3F4F6',
                          color: '#374151',
                          border: '1px solid #D1D5DB',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        <Icon name="lock" size={13} /> Khóa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(t, 'RESERVED')}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: '#FEF3C7',
                          color: '#78350F',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Đặt Bàn
                      </button>
                    </>
                  )}

                  {t.status === 'RESERVED' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(t.id, 'OCCUPIED')}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '8px',
                          background: '#9D4124',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Nhận Bàn
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(t.id, 'AVAILABLE')}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '8px',
                          background: '#F0E6E4',
                          color: '#56423D',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Hủy
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: XEM VÀ IN MÃ QR CỦA BÀN */}
      {selectedQrTable && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '380px',
            width: '100%',
            padding: '28px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => setSelectedQrTable(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#F6ECEA',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Icon name="close" size={18} />
            </button>

            <span style={{ fontSize: '0.78rem', color: '#9D4124', fontWeight: 800, background: '#FFDBC9', padding: '2px 8px', borderRadius: '6px' }}>
              QR ORDER TẠI BÀN
            </span>

            <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.4rem', color: '#1F1B1A', margin: '10px 0 2px' }}>
              {selectedQrTable.code} - {selectedQrTable.name}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#89726B', margin: '0 0 16px' }}>
              {selectedQrTable.zoneName} • Sức chứa {selectedQrTable.capacity} khách
            </p>

            <div style={{
              background: '#FFF8F6',
              padding: '16px',
              borderRadius: '16px',
              border: '2px dashed #9D4124',
              display: 'inline-block',
              marginBottom: '16px'
            }}>
              <img
                src={selectedQrTable.qrUrl}
                alt={`QR ${selectedQrTable.code}`}
                style={{ width: '180px', height: '180px', display: 'block' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#56423D', marginTop: '8px', display: 'block', fontWeight: 600 }}>
                Quét để mở Menu & Gọi món
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  showToast(`Đã gửi lệnh in mã QR cho ${selectedQrTable.code}`);
                  setSelectedQrTable(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#9D4124',
                  color: '#FFFFFF',
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
                In Thẻ Bàn
              </button>

              <button
                type="button"
                onClick={() => {
                  window.open(selectedQrTable.qrUrl, '_blank');
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: '#F0E6E4',
                  color: '#56423D',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Tải Về
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: THÊM BÀN MỚI */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="add_circle" size={24} style={{ color: '#9D4124' }} />
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                  Thêm Bàn Mới Vào Sơ Đồ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F6ECEA', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTable} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                  Mã Bàn (VD: T-09, VIP-04) <span style={{ color: '#BA1A1A' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập mã bàn..."
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #EAE0DE',
                    background: '#FDF7F5',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                  Tên Hiển Thị (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: Bàn Cạnh Cửa Sổ, Phòng Sen Vàng"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #EAE0DE',
                    background: '#FDF7F5',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                    Khu Vực Phục Vụ
                  </label>
                  <select
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #EAE0DE',
                      background: '#FFFFFF',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    <option value="ZONE_1">Tầng 1 - Sảnh Chính</option>
                    <option value="ZONE_2">Tầng 2 - Ban Công</option>
                    <option value="VIP">Phòng VIP</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                    Sức Chứa (Khách)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #EAE0DE',
                      background: '#FDF7F5',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    background: '#F0E6E4',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#56423D',
                    cursor: 'pointer'
                  }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1.5,
                    padding: '12px',
                    borderRadius: '12px',
                    background: '#9D4124',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  Tạo Bàn Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CÀI ĐẶT TRẠNG THÁI BÀN (KHÓA BÀN / ĐẶT BÀN VỚI THỜI GIAN ĐẶT) */}
      {statusModalTable && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => setStatusModalTable(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#F6ECEA',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Icon name="close" size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FFDBC9', color: '#9D4124', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="tune" size={22} />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1F1B1A', margin: 0 }}>
                  Cài Đặt Trạng Thái Bàn
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#89726B' }}>
                  {statusModalTable.code} — {statusModalTable.name} ({statusModalTable.zoneName})
                </span>
              </div>
            </div>

            {/* Status Choices */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1F1B1A', marginBottom: '8px' }}>
                Chọn trạng thái bàn:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { value: 'AVAILABLE', label: 'Bàn Trống', icon: 'check_circle', color: '#059669' },
                  { value: 'RESERVED', label: 'Đặt Trước', icon: 'schedule', color: '#D97706' },
                  { value: 'BLOCKED', label: 'Khóa Bàn', icon: 'lock', color: '#4B5563' },
                  { value: 'OCCUPIED', label: 'Đang Phục Vụ', icon: 'restaurant', color: '#DC2626' },
                  { value: 'DIRTY', label: 'Cần Dọn Dẹp', icon: 'cleaning_services', color: '#6B7280' },
                ].map(opt => {
                  const isSel = statusForm.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatusForm(prev => ({ ...prev, status: opt.value }))}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        border: isSel ? `2px solid ${opt.color}` : '1px solid #EAE0DE',
                        background: isSel ? '#FFF8F6' : '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        color: isSel ? opt.color : '#56423D'
                      }}
                    >
                      <Icon name={opt.icon} size={18} style={{ color: opt.color }} />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conditional Sub-forms */}
            {statusForm.status === 'RESERVED' && (
              <div style={{ background: '#FFFDF0', padding: '14px', borderRadius: '14px', border: '1px solid #FDE68A', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#78350F', marginBottom: '4px' }}>
                    Thời gian đặt bàn (Giờ hẹn): <span style={{ color: '#9D4124' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 19:30 hoặc 20:00 - Tối nay"
                    value={statusForm.reservationTime}
                    onChange={(e) => setStatusForm(prev => ({ ...prev, reservationTime: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #FCD34D', background: '#FFFFFF', fontSize: '0.85rem', fontWeight: 700, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#78350F', marginBottom: '4px' }}>
                      Tên khách & SĐT:
                    </label>
                    <input
                      type="text"
                      placeholder="Anh Hoàng (0901xxx)"
                      value={statusForm.reservationGuest}
                      onChange={(e) => setStatusForm(prev => ({ ...prev, reservationGuest: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #FCD34D', background: '#FFFFFF', fontSize: '0.82rem', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#78350F', marginBottom: '4px' }}>
                      Số khách:
                    </label>
                    <input
                      type="number"
                      value={statusForm.guestsCount}
                      onChange={(e) => setStatusForm(prev => ({ ...prev, guestsCount: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #FCD34D', background: '#FFFFFF', fontSize: '0.82rem', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {statusForm.status === 'BLOCKED' && (
              <div style={{ background: '#F9FAFB', padding: '14px', borderRadius: '14px', border: '1px solid #E5E7EB', marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                  Lý do khóa bàn: <span style={{ color: '#9D4124' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bảo trì trang thiết bị, ghép bàn sự kiện, hỏng quạt..."
                  value={statusForm.blockedReason}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, blockedReason: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #D1D5DB', background: '#FFFFFF', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            )}

            {statusForm.status === 'OCCUPIED' && (
              <div style={{ background: '#FEF2F2', padding: '14px', borderRadius: '14px', border: '1px solid #FECACA', marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#991B1B', marginBottom: '4px' }}>
                  Số khách thực tế đang ngồi:
                </label>
                <input
                  type="number"
                  value={statusForm.guestsCount}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, guestsCount: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #F87171', background: '#FFFFFF', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStatusModalTable(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#F0E6E4',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#56423D',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveTableStatus}
                style={{
                  flex: 1.5,
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#9D4124',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(157, 65, 36, 0.3)'
                }}
              >
                Lưu Trạng Thái
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
