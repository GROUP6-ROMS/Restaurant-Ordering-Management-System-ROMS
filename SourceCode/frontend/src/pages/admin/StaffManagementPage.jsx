import React, { useState } from 'react';

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

// Initial Staff Roster Mock Data
const INITIAL_STAFF = [
  {
    id: 1,
    empCode: 'MGR-084',
    name: 'Lê Hoàng Minh',
    email: 'minh.lh@roms.vn',
    phone: '0903.112.345',
    role: 'MANAGER',
    roleLabel: 'Quản Lý',
    roleBadgeClass: 'bg-primary text-white',
    avatarInitials: 'LM',
    avatarBg: '#9D4124',
    avatarColor: '#FFFFFF',
    isOnline: true,
    statusText: 'Đang trực ca',
    currentShift: 'Ca Sáng (06:00 - 14:00)',
    pinMasked: '••••••'
  },
  {
    id: 2,
    empCode: 'EMP-8842',
    name: 'Lê Thuỳ Trang',
    email: 'trang.lt@roms.vn',
    phone: '0918.234.567',
    role: 'CASHIER',
    roleLabel: 'Thu Ngân',
    roleBadgeClass: 'bg-[#FFDBC9] text-[#753400]',
    avatarInitials: 'LT',
    avatarBg: '#FFDBC9',
    avatarColor: '#753400',
    isOnline: true,
    statusText: 'Đang trực ca',
    currentShift: 'Ca Sáng (06:00 - 14:00)',
    pinMasked: '••••••'
  },
  {
    id: 3,
    empCode: 'EMP-8845',
    name: 'Nguyễn Văn An',
    email: 'an.nv@roms.vn',
    phone: '0988.777.666',
    role: 'WAITER',
    roleLabel: 'Phục Vụ',
    roleBadgeClass: 'bg-[#DDE8AB] text-[#181E00]',
    avatarInitials: 'NA',
    avatarBg: '#DDE8AB',
    avatarColor: '#181E00',
    isOnline: true,
    statusText: 'Đang trực ca',
    currentShift: 'Ca Sáng (06:00 - 14:00)',
    pinMasked: '••••••'
  },
  {
    id: 4,
    empCode: 'EMP-8849',
    name: 'Trần Minh Bảo',
    email: 'bao.tm@roms.vn',
    phone: '0977.345.678',
    role: 'WAITER',
    roleLabel: 'Phục Vụ',
    roleBadgeClass: 'bg-[#DDE8AB] text-[#181E00]',
    avatarInitials: 'TB',
    avatarBg: '#DDE8AB',
    avatarColor: '#181E00',
    isOnline: true,
    statusText: 'Đang trực ca',
    currentShift: 'Ca Sáng (06:00 - 14:00)',
    pinMasked: '••••••'
  },
  {
    id: 5,
    empCode: 'EMP-8812',
    name: 'Phạm Đức Duy',
    email: 'duy.pd@roms.vn',
    phone: '0933.889.900',
    role: 'KITCHEN',
    roleLabel: 'Bếp Trưởng',
    roleBadgeClass: 'bg-[#FFDAD6] text-[#93000A]',
    avatarInitials: 'PD',
    avatarBg: '#FFDAD6',
    avatarColor: '#93000A',
    isOnline: true,
    statusText: 'Đang trực ca',
    currentShift: 'Ca Sáng (06:00 - 14:00)',
    pinMasked: '••••••'
  },
  {
    id: 6,
    empCode: 'EMP-8820',
    name: 'Lê Thị Cúc',
    email: 'cuc.lt@roms.vn',
    phone: '0912.456.789',
    role: 'KITCHEN',
    roleLabel: 'Bếp',
    roleBadgeClass: 'bg-[#FFDAD6] text-[#93000A]',
    avatarInitials: 'LC',
    avatarBg: '#FFDAD6',
    avatarColor: '#93000A',
    isOnline: true,
    statusText: 'Đang trực ca',
    currentShift: 'Ca Sáng (06:00 - 14:00)',
    pinMasked: '••••••'
  },
  {
    id: 7,
    empCode: 'EMP-8822',
    name: 'Võ Minh Quân',
    email: 'quan.vm@roms.vn',
    phone: '0908.765.432',
    role: 'KITCHEN',
    roleLabel: 'Bếp Chính',
    roleBadgeClass: 'bg-[#FFDAD6] text-[#93000A]',
    avatarInitials: 'VQ',
    avatarBg: '#FFDAD6',
    avatarColor: '#93000A',
    isOnline: true,
    statusText: 'Đang trực ca',
    currentShift: 'Ca Sáng (06:00 - 14:00)',
    pinMasked: '••••••'
  },
  {
    id: 8,
    empCode: 'EMP-8860',
    name: 'Đỗ Hoài Nam',
    email: 'nam.dh@roms.vn',
    phone: '0944.556.677',
    role: 'CASHIER',
    roleLabel: 'Thu Ngân',
    roleBadgeClass: 'bg-[#FFDBC9] text-[#753400]',
    avatarInitials: 'DN',
    avatarBg: '#EAE0DE',
    avatarColor: '#56423D',
    isOnline: false,
    statusText: 'Nghỉ ca / Chuẩn bị ca tối',
    currentShift: 'Ca Chiều / Tối (14:00 - 22:00)',
    pinMasked: '••••••'
  },
  {
    id: 9,
    empCode: 'EMP-8851',
    name: 'Phan Kim Oanh',
    email: 'oanh.pk@roms.vn',
    phone: '0966.123.456',
    role: 'WAITER',
    roleLabel: 'Phục Vụ',
    roleBadgeClass: 'bg-[#DDE8AB] text-[#181E00]',
    avatarInitials: 'PO',
    avatarBg: '#EAE0DE',
    avatarColor: '#56423D',
    isOnline: false,
    statusText: 'Nghỉ ca / Chuẩn bị ca tối',
    currentShift: 'Ca Chiều / Tối (14:00 - 22:00)',
    pinMasked: '••••••'
  },
  {
    id: 10,
    empCode: 'EMP-8853',
    name: 'Vũ Đình Long',
    email: 'long.vd@roms.vn',
    phone: '0987.654.321',
    role: 'WAITER',
    roleLabel: 'Phục Vụ',
    roleBadgeClass: 'bg-[#DDE8AB] text-[#181E00]',
    avatarInitials: 'VL',
    avatarBg: '#EAE0DE',
    avatarColor: '#56423D',
    isOnline: false,
    statusText: 'Nghỉ ca / Chuẩn bị ca tối',
    currentShift: 'Ca Chiều / Tối (14:00 - 22:00)',
    pinMasked: '••••••'
  },
  {
    id: 11,
    empCode: 'EMP-8825',
    name: 'Nguyễn Hoàng Khôi',
    email: 'khoi.nh@roms.vn',
    phone: '0919.876.543',
    role: 'KITCHEN',
    roleLabel: 'Bếp',
    roleBadgeClass: 'bg-[#FFDAD6] text-[#93000A]',
    avatarInitials: 'NK',
    avatarBg: '#EAE0DE',
    avatarColor: '#56423D',
    isOnline: false,
    statusText: 'Nghỉ ca / Chuẩn bị ca tối',
    currentShift: 'Ca Chiều / Tối (14:00 - 22:00)',
    pinMasked: '••••••'
  },
  {
    id: 12,
    empCode: 'EMP-8828',
    name: 'Trần Quốc Bảo',
    email: 'bao.tq@roms.vn',
    phone: '0938.999.111',
    role: 'KITCHEN',
    roleLabel: 'Bếp',
    roleBadgeClass: 'bg-[#FFDAD6] text-[#93000A]',
    avatarInitials: 'QB',
    avatarBg: '#EAE0DE',
    avatarColor: '#56423D',
    isOnline: false,
    statusText: 'Nghỉ ca / Chuẩn bị ca tối',
    currentShift: 'Ca Chiều / Tối (14:00 - 22:00)',
    pinMasked: '••••••'
  }
];

export default function StaffManagementPage() {
  const [activeTab, setActiveTab] = useState('SCHEDULE'); // 'ROSTER' | 'SCHEDULE'
  const [staffList, setStaffList] = useState(INITIAL_STAFF);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);

  // Modals
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedStaffForPin, setSelectedStaffForPin] = useState(null);
  const [newPinCode, setNewPinCode] = useState('');

  // Form for New Staff
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'WAITER',
    shift: 'Ca Sáng (06:00 - 14:00)',
    pin: '123456'
  });

  // Form for Shift Assignment
  const [shiftAssignmentForm, setShiftAssignmentForm] = useState({
    staffId: '',
    targetShift: 'morning',
    targetRole: 'waiter'
  });

  // Shift assignment state per shift div
  const [morningShiftStaffIds, setMorningShiftStaffIds] = useState([1, 2, 3, 4, 5, 6, 7]);
  const [eveningShiftStaffIds, setEveningShiftStaffIds] = useState([1, 8, 9, 10, 11, 12]);
  const [selectedStaffToAddMorning, setSelectedStaffToAddMorning] = useState('');
  const [selectedStaffToAddEvening, setSelectedStaffToAddEvening] = useState('');

  const handleAddStaffToShift = (shiftType, staffId, targetRole) => {
    const id = parseInt(staffId);
    if (!id) return;
    const target = staffList.find(s => s.id === id);
    if (!target) return;

    if (targetRole && target.role !== targetRole) {
      setStaffList(prev => prev.map(s => s.id === id ? {
        ...s,
        role: targetRole,
        roleLabel: targetRole === 'MANAGER' ? 'Quản Lý' : targetRole === 'CASHIER' ? 'Thu Ngân' : targetRole === 'KITCHEN' ? 'Bếp' : 'Phục Vụ'
      } : s));
    }

    if (shiftType === 'morning') {
      setMorningShiftStaffIds(prev => prev.includes(id) ? prev : [...prev, id]);
      showToast(`Đã thêm [${target.name}] vào Ca Sáng!`);
    } else {
      setEveningShiftStaffIds(prev => prev.includes(id) ? prev : [...prev, id]);
      showToast(`Đã thêm [${target.name}] vào Ca Chiều / Tối!`);
    }
  };

  const handleRemoveStaffFromShift = (shiftType, staffId) => {
    const target = staffList.find(s => s.id === staffId);
    if (shiftType === 'morning') {
      setMorningShiftStaffIds(prev => prev.filter(id => id !== staffId));
      showToast(`Đã xóa [${target?.name}] khỏi Ca Sáng!`);
    } else {
      setEveningShiftStaffIds(prev => prev.filter(id => id !== staffId));
      showToast(`Đã xóa [${target?.name}] khỏi Ca Chiều / Tối!`);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // KPI Metrics
  const totalStaff = staffList.length;
  const onlineStaffCount = staffList.filter(s => s.isOnline).length;
  const waiterCount = staffList.filter(s => s.role === 'WAITER').length;
  const kitchenCount = staffList.filter(s => s.role === 'KITCHEN').length;
  const cashierCount = staffList.filter(s => s.role === 'CASHIER').length;

  // Filtered staff roster
  const filteredStaff = staffList.filter(s => {
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.empCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery);
    if (!matchSearch) return false;

    if (roleFilter !== 'ALL' && s.role !== roleFilter) return false;
    if (statusFilter === 'ONLINE' && !s.isOnline) return false;
    if (statusFilter === 'OFFLINE' && s.isOnline) return false;

    return true;
  });

  const handleCreateStaff = (e) => {
    e.preventDefault();
    if (!newStaffForm.name.trim() || !newStaffForm.phone.trim()) {
      alert('Vui lòng nhập họ tên và số điện thoại nhân viên!');
      return;
    }

    const initials = newStaffForm.name
      .split(' ')
      .map(w => w[0])
      .slice(-2)
      .join('')
      .toUpperCase();

    const created = {
      id: Date.now(),
      empCode: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newStaffForm.name,
      email: newStaffForm.email || `${newStaffForm.name.toLowerCase().replace(/\s+/g, '.')}@roms.vn`,
      phone: newStaffForm.phone,
      role: newStaffForm.role,
      roleLabel: newStaffForm.role === 'MANAGER' ? 'Quản Lý' : newStaffForm.role === 'CASHIER' ? 'Thu Ngân' : newStaffForm.role === 'KITCHEN' ? 'Bếp' : 'Phục Vụ',
      roleBadgeClass: newStaffForm.role === 'MANAGER' ? 'bg-primary text-white' : newStaffForm.role === 'CASHIER' ? 'bg-[#FFDBC9] text-[#753400]' : newStaffForm.role === 'KITCHEN' ? 'bg-[#FFDAD6] text-[#93000A]' : 'bg-[#DDE8AB] text-[#181E00]',
      avatarInitials: initials || 'NV',
      avatarBg: '#9D4124',
      avatarColor: '#FFFFFF',
      isOnline: false,
      statusText: 'Nghỉ ca',
      currentShift: newStaffForm.shift,
      pinMasked: '••••••'
    };

    setStaffList([created, ...staffList]);
    setShowAddStaffModal(false);
    showToast(`Đã thêm nhân viên [${created.name}] (${created.empCode}) thành công!`);
  };

  const handleChangePin = () => {
    if (!newPinCode || newPinCode.length !== 6 || !/^\d{6}$/.test(newPinCode)) {
      alert('Vui lòng nhập mã PIN gồm chính xác 6 số!');
      return;
    }
    showToast(`Đã đổi mã PIN cho nhân viên [${selectedStaffForPin?.name}] thành công!`);
    setShowPinModal(false);
    setNewPinCode('');
  };

  const handleAssignShift = () => {
    showToast(`Đã cập nhật phân ca trực và đồng bộ tức thời đến máy POS/KDS!`);
    setShowShiftModal(false);
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '80px',
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

      {/* Header Title Area & Breadcrumb (theo SCR-21) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#89726B', marginBottom: '4px' }}>
            <span>ROMS Suite</span>
            <Icon name="chevron_right" size={14} />
            <span>Vận Hành FOH & BOH</span>
            <Icon name="chevron_right" size={14} />
            <span style={{ color: '#9D4124', fontWeight: 700 }}>Nhân Sự & Phân Ca</span>
          </div>
          <h1 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.9rem', color: '#1F1B1A', margin: 0 }}>
            Quản Lý Nhân Sự & Vận Hành Đội Ngũ
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#FFFFFF',
            border: '1px solid #EAE0DE',
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '0.8rem',
            color: '#56423D'
          }}>
            <Icon name="cloud_done" size={18} style={{ color: '#596232' }} />
            <span>Đồng bộ POS/KDS: <strong>Tức thì</strong></span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddStaffModal(true)}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              background: '#9D4124',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(157, 65, 36, 0.25)'
            }}
          >
            <Icon name="person_add" size={18} />
            <span>+ Thêm Nhân Viên Mới</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation Bar */}
      <div style={{ display: 'flex', borderBottom: '2px solid #EAE0DE', marginBottom: '20px', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('SCHEDULE')}
          style={{
            padding: '12px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'SCHEDULE' ? '3px solid #9D4124' : '3px solid transparent',
            color: activeTab === 'SCHEDULE' ? '#9D4124' : '#56423D',
            fontWeight: 800,
            fontSize: '0.92rem',
            fontFamily: "'Epilogue', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          <Icon name="calendar_view_week" size={20} fill={activeTab === 'SCHEDULE' ? 1 : 0} />
          <span>Lịch Tuần & Định Mức Ca (Theo Roles)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ROSTER')}
          style={{
            padding: '12px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'ROSTER' ? '3px solid #9D4124' : '3px solid transparent',
            color: activeTab === 'ROSTER' ? '#9D4124' : '#56423D',
            fontWeight: 800,
            fontSize: '0.92rem',
            fontFamily: "'Epilogue', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          <Icon name="badge" size={20} fill={activeTab === 'ROSTER' ? 1 : 0} />
          <span>Hồ Sơ & Danh Sách Nhân Viên ({totalStaff})</span>
        </button>
      </div>

      {/* Operational KPI Metric Cards (2 main metric containers) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '22px' }}>
        {/* Metric 1: Tổng Nhân Lực */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #F0E6E4',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#89726B', letterSpacing: '0.04em' }}>
              Tổng Nhân Lực Chi Nhánh
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FCF1EF', color: '#9D4124', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="groups" size={20} />
            </div>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '2.2rem', color: '#1F1B1A', lineHeight: 1 }}>
              {totalStaff}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#89726B' }}>nhân viên đã định danh</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: '#F6ECEA', fontSize: '0.75rem', fontWeight: 700, color: '#56423D' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9D4124' }} />
              {cashierCount} Thu ngân
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: '#F6ECEA', fontSize: '0.75rem', fontWeight: 700, color: '#56423D' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#596232' }} />
              {waiterCount} Phục vụ
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: '#F6ECEA', fontSize: '0.75rem', fontWeight: 700, color: '#56423D' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#994703' }} />
              {kitchenCount} Bếp & KDS
            </span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: '#596232' }} />
        </div>

        {/* Metric 2: Đang Trực Ca Hiện Tại */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #F0E6E4',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#9D4124', letterSpacing: '0.04em' }}>
              Đang Trực Ca Hiện Tại (Ca Sáng)
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFDBC9', color: '#9D4124', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="alarm_on" size={20} />
            </div>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '2.2rem', color: '#9D4124', lineHeight: 1 }}>
              {onlineStaffCount}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#596232', fontWeight: 700 }}>nhân sự đang online</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: '#FCF1EF', fontSize: '0.75rem', fontWeight: 700, color: '#9D4124' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9D4124' }} />
              1 Quản lý
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: '#FCF1EF', fontSize: '0.75rem', fontWeight: 700, color: '#9D4124' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9D4124' }} />
              1 Thu ngân
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: '#FCF1EF', fontSize: '0.75rem', fontWeight: 700, color: '#596232' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#596232' }} />
              2 Phục vụ
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: '#FCF1EF', fontSize: '0.75rem', fontWeight: 700, color: '#994703' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#994703' }} />
              3 Bếp & KDS
            </span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: '#9D4124' }} />
        </div>
      </div>

      {/* VIEW 1: Lịch Tuần & Định Mức Ca (Active Default View) */}
      {activeTab === 'SCHEDULE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Scheduling Header & Interactive Toolbar */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '18px 20px',
            border: '1px solid #F0E6E4',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="calendar_view_week" size={26} style={{ color: '#9D4124' }} />
                <div>
                  <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#1F1B1A', margin: 0 }}>
                    Lịch Phân Ca & Điều Phối Nhân Lực Trực Tiếp
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#89726B' }}>
                    Quản lý phân bổ ca trực, định mức giờ làm, hoán đổi ca và đồng bộ tức thời xuống thiết bị.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => showToast('Đã xuất lịch tuần sang file Excel (.xlsx)!')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1px solid #EAE0DE',
                    background: '#FCF1EF',
                    color: '#56423D',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Icon name="file_download" size={16} style={{ color: '#9D4124' }} />
                  <span>Xuất Excel (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Stepper Date & Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '10px', borderTop: '1px solid #F6ECEA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#FCF1EF', borderRadius: '10px', padding: '4px', border: '1px solid #EAE0DE' }}>
                  <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px 6px', color: '#56423D' }}>
                    <Icon name="chevron_left" size={18} />
                  </button>
                  <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#1F1B1A' }}>
                    <Icon name="event" size={16} style={{ color: '#9D4124' }} />
                    <span>Hôm nay: Thứ Hai, 05/10/2026</span>
                    <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: '#9D4124', color: '#FFF' }}>
                      Realtime
                    </span>
                  </div>
                  <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px 6px', color: '#56423D' }}>
                    <Icon name="chevron_right" size={18} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#89726B' }}>Lọc nhanh:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #EAE0DE',
                    background: '#FCF1EF',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="MANAGER">Quản lý (Manager)</option>
                  <option value="CASHIER">Thu ngân (Cashier)</option>
                  <option value="WAITER">Phục vụ (Waiter)</option>
                  <option value="KITCHEN">Bếp & KDS</option>
                </select>
              </div>
            </div>
          </div>

          {/* SHIFT 1: Ca Sáng Container (06:00 - 14:00) */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '20px',
            border: '1.5px solid #FFDBC9',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            {/* Shift Bar Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#FCF1EF',
              border: '1px solid #F0E6E4',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#9D4124', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="wb_sunny" size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#1F1B1A', margin: 0 }}>
                      Ca Sáng (06:00 - 14:00)
                    </h4>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '9999px', background: '#DDE8AB', color: '#181E00', fontSize: '0.72rem', fontWeight: 700 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#596232' }} />
                      Đang trực (Realtime)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#89726B', marginTop: '2px' }}>
                    Đã phân bổ: {morningShiftStaffIds.length} nhân sự trực ca
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Roles Column Grid for Ca Sáng */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              {/* Col 1: Quản Lý */}
              <div style={{ background: '#FCF1EF', borderRadius: '12px', padding: '12px', border: '1px solid #F0E6E4', display: 'flex', flexDirection: 'column', minHeight: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.8rem', color: '#1F1B1A', marginBottom: '10px' }}>
                  <Icon name="manage_accounts" size={18} style={{ color: '#9D4124' }} />
                  <span>Quản Lý (Manager)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                  {staffList.filter(s => s.role === 'MANAGER' && morningShiftStaffIds.includes(s.id)).length === 0 ? (
                    <div style={{ fontSize: '0.72rem', color: '#89726B', fontStyle: 'italic', padding: '6px 0' }}>Chưa có nhân sự</div>
                  ) : (
                    staffList.filter(s => s.role === 'MANAGER' && morningShiftStaffIds.includes(s.id)).map(s => (
                      <div key={s.id} style={{ background: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid #EAE0DE' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: s.avatarBg, color: s.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                              {s.avatarInitials}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1F1B1A' }}>{s.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStaffFromShift('morning', s.id)}
                                  title={`Xóa ${s.name} khỏi ca sáng`}
                                  style={{
                                    border: 'none',
                                    background: '#FEE2E2',
                                    color: '#DC2626',
                                    borderRadius: '4px',
                                    padding: '2px 4px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1
                                  }}
                                >
                                  <Icon name="close" size={13} />
                                </button>
                              </div>
                              <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#9D4124', fontWeight: 700 }}>{s.empCode}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: s.isOnline ? '#596232' : '#89726B', fontWeight: 700 }}>
                            {s.isOnline ? '• Online' : '• Offline'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Nút thêm vào ca ở dưới role Quản Lý */}
                <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleAddStaffToShift('morning', e.target.value, 'MANAGER');
                      }}
                      style={{
                        width: '100%',
                        padding: '7px 22px 7px 8px',
                        borderRadius: '8px',
                        border: '1.5px dashed #9D4124',
                        background: '#FFFFFF',
                        color: '#9D4124',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        outline: 'none',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        textAlign: 'center'
                      }}
                    >
                      <option value="">+ Thêm Vào Ca</option>
                      {staffList.filter(s => !morningShiftStaffIds.includes(s.id) && s.role === 'MANAGER').length > 0 && (
                        <optgroup label="Nhân sự Quản Lý:">
                          {staffList.filter(s => !morningShiftStaffIds.includes(s.id) && s.role === 'MANAGER').map(s => (
                            <option key={s.id} value={s.id}>+ {s.name} ({s.empCode})</option>
                          ))}
                        </optgroup>
                      )}
                      {staffList.filter(s => !morningShiftStaffIds.includes(s.id) && s.role !== 'MANAGER').length > 0 && (
                        <optgroup label="Nhân sự khác điều động:">
                          {staffList.filter(s => !morningShiftStaffIds.includes(s.id) && s.role !== 'MANAGER').map(s => (
                            <option key={s.id} value={s.id}>+ {s.name} ({s.roleLabel})</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9D4124', fontSize: '0.65rem' }}>▼</div>
                  </div>
                </div>
              </div>

              {/* Col 2: Thu Ngân */}
              <div style={{ background: '#FCF1EF', borderRadius: '12px', padding: '12px', border: '1px solid #F0E6E4', display: 'flex', flexDirection: 'column', minHeight: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.8rem', color: '#1F1B1A', marginBottom: '10px' }}>
                  <Icon name="point_of_sale" size={18} style={{ color: '#9D4124' }} />
                  <span>Thu Ngân (Cashier)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                  {staffList.filter(s => s.role === 'CASHIER' && morningShiftStaffIds.includes(s.id)).length === 0 ? (
                    <div style={{ fontSize: '0.72rem', color: '#89726B', fontStyle: 'italic', padding: '6px 0' }}>Chưa có nhân sự</div>
                  ) : (
                    staffList.filter(s => s.role === 'CASHIER' && morningShiftStaffIds.includes(s.id)).map(s => (
                      <div key={s.id} style={{ background: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid #EAE0DE' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: s.avatarBg, color: s.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                              {s.avatarInitials}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1F1B1A' }}>{s.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStaffFromShift('morning', s.id)}
                                  title={`Xóa ${s.name} khỏi ca sáng`}
                                  style={{
                                    border: 'none',
                                    background: '#FEE2E2',
                                    color: '#DC2626',
                                    borderRadius: '4px',
                                    padding: '2px 4px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1
                                  }}
                                >
                                  <Icon name="close" size={13} />
                                </button>
                              </div>
                              <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#9D4124', fontWeight: 700 }}>{s.empCode}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: s.isOnline ? '#596232' : '#89726B', fontWeight: 700 }}>
                            {s.isOnline ? '• Online' : '• Offline'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Nút thêm vào ca ở dưới role Thu Ngân */}
                <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleAddStaffToShift('morning', e.target.value, 'CASHIER');
                      }}
                      style={{
                        width: '100%',
                        padding: '7px 22px 7px 8px',
                        borderRadius: '8px',
                        border: '1.5px dashed #9D4124',
                        background: '#FFFFFF',
                        color: '#9D4124',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        outline: 'none',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        textAlign: 'center'
                      }}
                    >
                      <option value="">+ Thêm Vào Ca</option>
                      {staffList.filter(s => !morningShiftStaffIds.includes(s.id) && s.role === 'CASHIER').length > 0 && (
                        <optgroup label="Nhân sự Thu Ngân:">
                          {staffList.filter(s => !morningShiftStaffIds.includes(s.id) && s.role === 'CASHIER').map(s => (
                            <option key={s.id} value={s.id}>+ {s.name} ({s.empCode})</option>
                          ))}
                        </optgroup>
                      )}
                      {staffList.filter(s => !morningShiftStaffIds.includes(s.id) && s.role !== 'CASHIER').length > 0 && (
                        <optgroup label="Nhân sự khác điều động:">
                          {staffList.filter(s => !morningShiftStaffIds.includes(s.id) && s.role !== 'CASHIER').map(s => (
                            <option key={s.id} value={s.id}>+ {s.name} ({s.roleLabel})</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9D4124', fontSize: '0.65rem' }}>▼</div>
                  </div>
                </div>
              </div>

              {/* Col 3: Phục Vụ */}
              <div style={{ background: '#FCF1EF', borderRadius: '12px', padding: '12px', border: '1px solid #F0E6E4', display: 'flex', flexDirection: 'column', minHeight: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.8rem', color: '#1F1B1A', marginBottom: '10px' }}>
                  <Icon name="table_restaurant" size={18} style={{ color: '#596232' }} />
                  <span>Phục Vụ (Waiter)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                  {staffList.filter(s => s.role === 'WAITER' && morningShiftStaffIds.includes(s.id)).length === 0 ? (
                    <div style={{ fontSize: '0.72rem', color: '#89726B', fontStyle: 'italic', padding: '6px 0' }}>Chưa có nhân sự</div>
                  ) : (
                    staffList.filter(s => s.role === 'WAITER' && morningShiftStaffIds.includes(s.id)).map(s => (
                      <div key={s.id} style={{ background: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid #EAE0DE' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: s.avatarBg, color: s.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                              {s.avatarInitials}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1F1B1A' }}>{s.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStaffFromShift('morning', s.id)}
                                  title={`Xóa ${s.name} khỏi ca sáng`}
                                  style={{
                                    border: 'none',
                                    background: '#FEE2E2',
                                    color: '#DC2626',
                                    borderRadius: '4px',
                                    padding: '2px 4px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1
                                  }}
                                >
                                  <Icon name="close" size={13} />
                                </button>
                              </div>
                              <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#9D4124', fontWeight: 700 }}>{s.empCode}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: s.isOnline ? '#596232' : '#89726B', fontWeight: 700 }}>
                            {s.isOnline ? '• Online' : '• Offline'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Nút thêm vào ca ở dưới role Phục Vụ */}
                <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleAddStaffToShift('morning', e.target.value, 'WAITER');
                      }}
                      style={{
                        width: '100%',
                        padding: '7px 22px 7px 8px',
                        borderRadius: '8px',
                        border: '1.5px dashed #596232',
                        background: '#FFFFFF',
                        color: '#596232',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        outline: 'none',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        textAlign: 'center'
                      }}
                    >
                      <option value="">+ Thêm Vào Ca</option>
                      {staffList.filter(s => !morningShiftStaffIds.includes(s.id) && s.role === 'WAITER').length > 0 && (
                        <optgroup label="Nhân sự Phục Vụ:">
                          {staffList.filter(s => !morningShiftStaffIds.includes(s.id) && s.role === 'WAITER').map(s => (
                            <option key={s.id} value={s.id}>+ {s.name} ({s.empCode})</option>
                          ))}
                        </optgroup>
                      )}
                      {staffList.filter(s => !morningShiftStaffIds.includes(s.id) && s.role !== 'WAITER').length > 0 && (
                        <optgroup label="Nhân sự khác điều động:">
                          {staffList.filter(s => !morningShiftStaffIds.includes(s.id) && s.role !== 'WAITER').map(s => (
                            <option key={s.id} value={s.id}>+ {s.name} ({s.roleLabel})</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#596232', fontSize: '0.65rem' }}>▼</div>
                  </div>
                </div>
              </div>

              {/* Col 4: Bếp & KDS */}
              <div style={{ background: '#FCF1EF', borderRadius: '12px', padding: '12px', border: '1px solid #F0E6E4', display: 'flex', flexDirection: 'column', minHeight: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.8rem', color: '#1F1B1A', marginBottom: '10px' }}>
                  <Icon name="skillet" size={18} style={{ color: '#994703' }} />
                  <span>Bếp & KDS</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                  {staffList.filter(s => s.role === 'KITCHEN' && morningShiftStaffIds.includes(s.id)).length === 0 ? (
                    <div style={{ fontSize: '0.72rem', color: '#89726B', fontStyle: 'italic', padding: '6px 0' }}>Chưa có nhân sự</div>
                  ) : (
                    staffList.filter(s => s.role === 'KITCHEN' && morningShiftStaffIds.includes(s.id)).map(s => (
                      <div key={s.id} style={{ background: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid #EAE0DE' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: s.avatarBg, color: s.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                              {s.avatarInitials}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1F1B1A' }}>{s.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStaffFromShift('morning', s.id)}
                                  title={`Xóa ${s.name} khỏi ca sáng`}
                                  style={{
                                    border: 'none',
                                    background: '#FEE2E2',
                                    color: '#DC2626',
                                    borderRadius: '4px',
                                    padding: '2px 4px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1
                                  }}
                                >
                                  <Icon name="close" size={13} />
                                </button>
                              </div>
                              <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#9D4124', fontWeight: 700 }}>{s.empCode}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: s.isOnline ? '#596232' : '#89726B', fontWeight: 700 }}>
                            {s.isOnline ? '• Online' : '• Offline'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Nút thêm vào ca ở dưới role Bếp & KDS */}
                <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleAddStaffToShift('morning', e.target.value, 'KITCHEN');
                      }}
                      style={{
                        width: '100%',
                        padding: '7px 22px 7px 8px',
                        borderRadius: '8px',
                        border: '1.5px dashed #994703',
                        background: '#FFFFFF',
                        color: '#994703',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        outline: 'none',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        textAlign: 'center'
                      }}
                    >
                      <option value="">+ Thêm Vào Ca</option>
                      {staffList.filter(s => !morningShiftStaffIds.includes(s.id) && s.role === 'KITCHEN').length > 0 && (
                        <optgroup label="Nhân sự Bếp:">
                          {staffList.filter(s => !morningShiftStaffIds.includes(s.id) && s.role === 'KITCHEN').map(s => (
                            <option key={s.id} value={s.id}>+ {s.name} ({s.empCode})</option>
                          ))}
                        </optgroup>
                      )}
                      {staffList.filter(s => !morningShiftStaffIds.includes(s.id) && s.role !== 'KITCHEN').length > 0 && (
                        <optgroup label="Nhân sự khác điều động:">
                          {staffList.filter(s => !morningShiftStaffIds.includes(s.id) && s.role !== 'KITCHEN').map(s => (
                            <option key={s.id} value={s.id}>+ {s.name} ({s.roleLabel})</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#994703', fontSize: '0.65rem' }}>▼</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SHIFT 2: Ca Chiều / Tối Container (14:00 - 22:00) */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #F0E6E4',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#F6ECEA',
              border: '1px solid #EAE0DE',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#56423D', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="nightlight" size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#1F1B1A', margin: 0 }}>
                      Ca Chiều / Tối (14:00 - 22:00)
                    </h4>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '9999px', background: '#EAE0DE', color: '#56423D', fontSize: '0.72rem', fontWeight: 700 }}>
                      Chuẩn bị tiếp quản
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#89726B', marginTop: '2px' }}>
                    Đã phân bổ: {eveningShiftStaffIds.length} nhân sự trực ca
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Roles Column Grid for Ca Tối */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              {/* Manager */}
              <div style={{ background: '#FCF1EF', borderRadius: '12px', padding: '12px', border: '1px solid #F0E6E4', display: 'flex', flexDirection: 'column', minHeight: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.8rem', color: '#1F1B1A', marginBottom: '10px' }}>
                  <Icon name="manage_accounts" size={18} style={{ color: '#9D4124' }} />
                  <span>Quản Lý (Manager)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                  {staffList.filter(s => s.role === 'MANAGER' && eveningShiftStaffIds.includes(s.id)).length === 0 ? (
                    <div style={{ fontSize: '0.72rem', color: '#89726B', fontStyle: 'italic', padding: '6px 0' }}>Chưa có nhân sự</div>
                  ) : (
                    staffList.filter(s => s.role === 'MANAGER' && eveningShiftStaffIds.includes(s.id)).map(s => (
                      <div key={s.id} style={{ background: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid #EAE0DE' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: s.avatarBg, color: s.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                              {s.avatarInitials}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1F1B1A' }}>{s.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStaffFromShift('evening', s.id)}
                                  title={`Xóa ${s.name} khỏi ca tối`}
                                  style={{
                                    border: 'none',
                                    background: '#FEE2E2',
                                    color: '#DC2626',
                                    borderRadius: '4px',
                                    padding: '2px 4px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1
                                  }}
                                >
                                  <Icon name="close" size={13} />
                                </button>
                              </div>
                              <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#9D4124', fontWeight: 700 }}>{s.empCode}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: '#89726B', fontWeight: 700 }}>• Nghỉ ca</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Nút thêm vào ca ở dưới role Quản Lý Ca Tối */}
                <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleAddStaffToShift('evening', e.target.value, 'MANAGER');
                      }}
                      style={{
                        width: '100%',
                        padding: '7px 22px 7px 8px',
                        borderRadius: '8px',
                        border: '1.5px dashed #56423D',
                        background: '#FFFFFF',
                        color: '#56423D',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        outline: 'none',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        textAlign: 'center'
                      }}
                    >
                      <option value="">+ Thêm Vào Ca</option>
                      {staffList.filter(s => !eveningShiftStaffIds.includes(s.id) && s.role === 'MANAGER').length > 0 && (
                        <optgroup label="Nhân sự Quản Lý:">
                          {staffList.filter(s => !eveningShiftStaffIds.includes(s.id) && s.role === 'MANAGER').map(s => (
                            <option key={s.id} value={s.id}>+ {s.name} ({s.empCode})</option>
                          ))}
                        </optgroup>
                      )}
                      {staffList.filter(s => !eveningShiftStaffIds.includes(s.id) && s.role !== 'MANAGER').length > 0 && (
                        <optgroup label="Nhân sự khác điều động:">
                          {staffList.filter(s => !eveningShiftStaffIds.includes(s.id) && s.role !== 'MANAGER').map(s => (
                            <option key={s.id} value={s.id}>+ {s.name} ({s.roleLabel})</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#56423D', fontSize: '0.65rem' }}>▼</div>
                  </div>
                </div>
              </div>

              {/* Cashier */}
              <div style={{ background: '#FCF1EF', borderRadius: '12px', padding: '12px', border: '1px solid #F0E6E4', display: 'flex', flexDirection: 'column', minHeight: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.8rem', color: '#1F1B1A', marginBottom: '10px' }}>
                  <Icon name="point_of_sale" size={18} style={{ color: '#9D4124' }} />
                  <span>Thu Ngân (Cashier)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                  {staffList.filter(s => s.role === 'CASHIER' && eveningShiftStaffIds.includes(s.id)).length === 0 ? (
                    <div style={{ fontSize: '0.72rem', color: '#89726B', fontStyle: 'italic', padding: '6px 0' }}>Chưa có nhân sự</div>
                  ) : (
                    staffList.filter(s => s.role === 'CASHIER' && eveningShiftStaffIds.includes(s.id)).map(s => (
                      <div key={s.id} style={{ background: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid #EAE0DE' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: s.avatarBg, color: s.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                              {s.avatarInitials}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1F1B1A' }}>{s.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStaffFromShift('evening', s.id)}
                                  title={`Xóa ${s.name} khỏi ca tối`}
                                  style={{
                                    border: 'none',
                                    background: '#FEE2E2',
                                    color: '#DC2626',
                                    borderRadius: '4px',
                                    padding: '2px 4px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1
                                  }}
                                >
                                  <Icon name="close" size={13} />
                                </button>
                              </div>
                              <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#9D4124', fontWeight: 700 }}>{s.empCode}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: '#89726B', fontWeight: 700 }}>• Nghỉ ca</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Nút thêm vào ca ở dưới role Thu Ngân Ca Tối */}
                <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleAddStaffToShift('evening', e.target.value, 'CASHIER');
                      }}
                      style={{
                        width: '100%',
                        padding: '7px 22px 7px 8px',
                        borderRadius: '8px',
                        border: '1.5px dashed #56423D',
                        background: '#FFFFFF',
                        color: '#56423D',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        outline: 'none',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        textAlign: 'center'
                      }}
                    >
                      <option value="">+ Thêm Vào Ca</option>
                      {staffList.filter(s => !eveningShiftStaffIds.includes(s.id) && s.role === 'CASHIER').length > 0 && (
                        <optgroup label="Nhân sự Thu Ngân:">
                          {staffList.filter(s => !eveningShiftStaffIds.includes(s.id) && s.role === 'CASHIER').map(s => (
                            <option key={s.id} value={s.id}>+ {s.name} ({s.empCode})</option>
                          ))}
                        </optgroup>
                      )}
                      {staffList.filter(s => !eveningShiftStaffIds.includes(s.id) && s.role !== 'CASHIER').length > 0 && (
                        <optgroup label="Nhân sự khác điều động:">
                          {staffList.filter(s => !eveningShiftStaffIds.includes(s.id) && s.role !== 'CASHIER').map(s => (
                            <option key={s.id} value={s.id}>+ {s.name} ({s.roleLabel})</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#56423D', fontSize: '0.65rem' }}>▼</div>
                  </div>
                </div>
              </div>

              {/* Waiter */}
              <div style={{ background: '#FCF1EF', borderRadius: '12px', padding: '12px', border: '1px solid #F0E6E4', display: 'flex', flexDirection: 'column', minHeight: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.8rem', color: '#1F1B1A', marginBottom: '10px' }}>
                  <Icon name="table_restaurant" size={18} style={{ color: '#596232' }} />
                  <span>Phục Vụ (Waiter)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                  {staffList.filter(s => s.role === 'WAITER' && eveningShiftStaffIds.includes(s.id)).length === 0 ? (
                    <div style={{ fontSize: '0.72rem', color: '#89726B', fontStyle: 'italic', padding: '6px 0' }}>Chưa có nhân sự</div>
                  ) : (
                    staffList.filter(s => s.role === 'WAITER' && eveningShiftStaffIds.includes(s.id)).map(s => (
                      <div key={s.id} style={{ background: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid #EAE0DE' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: s.avatarBg, color: s.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                              {s.avatarInitials}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1F1B1A' }}>{s.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStaffFromShift('evening', s.id)}
                                  title={`Xóa ${s.name} khỏi ca tối`}
                                  style={{
                                    border: 'none',
                                    background: '#FEE2E2',
                                    color: '#DC2626',
                                    borderRadius: '4px',
                                    padding: '2px 4px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1
                                  }}
                                >
                                  <Icon name="close" size={13} />
                                </button>
                              </div>
                              <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#9D4124', fontWeight: 700 }}>{s.empCode}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: '#89726B', fontWeight: 700 }}>• Nghỉ ca</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Nút thêm vào ca ở dưới role Phục Vụ Ca Tối */}
                <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleAddStaffToShift('evening', e.target.value, 'WAITER');
                      }}
                      style={{
                        width: '100%',
                        padding: '7px 22px 7px 8px',
                        borderRadius: '8px',
                        border: '1.5px dashed #596232',
                        background: '#FFFFFF',
                        color: '#596232',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        outline: 'none',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        textAlign: 'center'
                      }}
                    >
                      <option value="">+ Thêm Vào Ca</option>
                      {staffList.filter(s => !eveningShiftStaffIds.includes(s.id) && s.role === 'WAITER').length > 0 && (
                        <optgroup label="Nhân sự Phục Vụ:">
                          {staffList.filter(s => !eveningShiftStaffIds.includes(s.id) && s.role === 'WAITER').map(s => (
                            <option key={s.id} value={s.id}>+ {s.name} ({s.empCode})</option>
                          ))}
                        </optgroup>
                      )}
                      {staffList.filter(s => !eveningShiftStaffIds.includes(s.id) && s.role !== 'WAITER').length > 0 && (
                        <optgroup label="Nhân sự khác điều động:">
                          {staffList.filter(s => !eveningShiftStaffIds.includes(s.id) && s.role !== 'WAITER').map(s => (
                            <option key={s.id} value={s.id}>+ {s.name} ({s.roleLabel})</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#596232', fontSize: '0.65rem' }}>▼</div>
                  </div>
                </div>
              </div>

              {/* Kitchen */}
              <div style={{ background: '#FCF1EF', borderRadius: '12px', padding: '12px', border: '1px solid #F0E6E4', display: 'flex', flexDirection: 'column', minHeight: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.8rem', color: '#1F1B1A', marginBottom: '10px' }}>
                  <Icon name="skillet" size={18} style={{ color: '#994703' }} />
                  <span>Bếp & KDS</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                  {staffList.filter(s => s.role === 'KITCHEN' && eveningShiftStaffIds.includes(s.id)).length === 0 ? (
                    <div style={{ fontSize: '0.72rem', color: '#89726B', fontStyle: 'italic', padding: '6px 0' }}>Chưa có nhân sự</div>
                  ) : (
                    staffList.filter(s => s.role === 'KITCHEN' && eveningShiftStaffIds.includes(s.id)).map(s => (
                      <div key={s.id} style={{ background: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid #EAE0DE' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: s.avatarBg, color: s.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                              {s.avatarInitials}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1F1B1A' }}>{s.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStaffFromShift('evening', s.id)}
                                  title={`Xóa ${s.name} khỏi ca tối`}
                                  style={{
                                    border: 'none',
                                    background: '#FEE2E2',
                                    color: '#DC2626',
                                    borderRadius: '4px',
                                    padding: '2px 4px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1
                                  }}
                                >
                                  <Icon name="close" size={13} />
                                </button>
                              </div>
                              <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#9D4124', fontWeight: 700 }}>{s.empCode}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: '#89726B', fontWeight: 700 }}>• Nghỉ ca</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Nút thêm vào ca ở dưới role Bếp & KDS Ca Tối */}
                <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleAddStaffToShift('evening', e.target.value, 'KITCHEN');
                      }}
                      style={{
                        width: '100%',
                        padding: '7px 22px 7px 8px',
                        borderRadius: '8px',
                        border: '1.5px dashed #994703',
                        background: '#FFFFFF',
                        color: '#994703',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        outline: 'none',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        textAlign: 'center'
                      }}
                    >
                      <option value="">+ Thêm Vào Ca</option>
                      {staffList.filter(s => !eveningShiftStaffIds.includes(s.id) && s.role === 'KITCHEN').length > 0 && (
                        <optgroup label="Nhân sự Bếp:">
                          {staffList.filter(s => !eveningShiftStaffIds.includes(s.id) && s.role === 'KITCHEN').map(s => (
                            <option key={s.id} value={s.id}>+ {s.name} ({s.empCode})</option>
                          ))}
                        </optgroup>
                      )}
                      {staffList.filter(s => !eveningShiftStaffIds.includes(s.id) && s.role !== 'KITCHEN').length > 0 && (
                        <optgroup label="Nhân sự khác điều động:">
                          {staffList.filter(s => !eveningShiftStaffIds.includes(s.id) && s.role !== 'KITCHEN').map(s => (
                            <option key={s.id} value={s.id}>+ {s.name} ({s.roleLabel})</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#994703', fontSize: '0.65rem' }}>▼</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Hồ Sơ & Danh Sách Nhân Viên (Roster Table) */}
      {activeTab === 'ROSTER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search & Filter Bar */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid #F0E6E4',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 280px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FCF1EF',
                padding: '8px 14px',
                borderRadius: '10px',
                width: '100%',
                border: '1px solid #EAE0DE'
              }}>
                <Icon name="search" size={18} style={{ color: '#89726B' }} />
                <input
                  type="text"
                  placeholder="Tìm theo tên, mã NV (EMP-xxxx), SĐT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%', color: '#1F1B1A' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', background: '#FCF1EF', fontSize: '0.82rem', fontWeight: 600, outline: 'none' }}
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="MANAGER">Quản lý (Manager)</option>
                <option value="CASHIER">Thu ngân (Cashier)</option>
                <option value="WAITER">Phục vụ (Waiter)</option>
                <option value="KITCHEN">Bếp & KDS</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', background: '#FCF1EF', fontSize: '0.82rem', fontWeight: 600, outline: 'none' }}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ONLINE">Đang online (Trong ca)</option>
                <option value="OFFLINE">Nghỉ ca / Ngoại tuyến</option>
              </select>
            </div>
          </div>

          {/* Responsive Staff Table */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #F0E6E4',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#FCF1EF', color: '#89726B', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #EAE0DE' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '50px' }}>STT</th>
                    <th style={{ padding: '12px 16px' }}>Nhân Viên & Thông Tin</th>
                    <th style={{ padding: '12px 16px' }}>Vai Trò Hệ Thống</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Trạng Thái Ca</th>
                    <th style={{ padding: '12px 16px' }}>Mã PIN Ca Trực</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((staff, idx) => (
                    <tr key={staff.id} style={{ borderBottom: '1px solid #F6ECEA' }}>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'monospace', color: '#89726B', fontWeight: 700 }}>
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: staff.avatarBg,
                            color: staff.avatarColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            flexShrink: 0
                          }}>
                            {staff.avatarInitials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#1F1B1A', fontSize: '0.9rem' }}>
                              {staff.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#89726B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#9D4124' }}>{staff.empCode}</span>
                              <span>•</span>
                              <span>{staff.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: staff.role === 'MANAGER' ? '#9D4124' : staff.role === 'CASHIER' ? '#FFDBC9' : staff.role === 'KITCHEN' ? '#FFDAD6' : '#DDE8AB',
                          color: staff.role === 'MANAGER' ? '#FFFFFF' : staff.role === 'CASHIER' ? '#753400' : staff.role === 'KITCHEN' ? '#93000A' : '#181E00'
                        }}>
                          {staff.roleLabel}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: staff.isOnline ? '#E6F4EA' : '#F6ECEA',
                          color: staff.isOnline ? '#137333' : '#89726B'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: staff.isOnline ? '#137333' : '#89726B' }} />
                          {staff.isOnline ? 'Đang trực ca' : 'Nghỉ ca'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: '#FCF1EF', padding: '2px 6px', borderRadius: '6px', color: '#1F1B1A', fontWeight: 700 }}>
                            PIN: {staff.pinMasked}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStaffForPin(staff);
                              setShowPinModal(true);
                            }}
                            style={{ border: 'none', background: 'none', color: '#9D4124', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                          >
                            Đổi PIN
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => showToast(`Chức năng chỉnh sửa thông tin của [${staff.name}]`)}
                            title="Sửa thông tin"
                            style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #EAE0DE', background: '#FCF1EF', color: '#56423D', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => showToast(`Phân quyền trạm POS/KDS cho [${staff.name}]`)}
                            title="Phân quyền trạm"
                            style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #EAE0DE', background: '#FCF1EF', color: '#56423D', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <Icon name="lock_reset" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Thêm Nhân Viên Mới */}
      {showAddStaffModal && (
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
            maxWidth: '500px',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="person_add" size={24} style={{ color: '#9D4124' }} />
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1F1B1A', margin: 0 }}>
                  Thêm Nhân Viên Mới Vào Nhà Hàng
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F6ECEA', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                  Họ và tên nhân viên <span style={{ color: '#9D4124' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hoàng Minh Trí"
                  value={newStaffForm.name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAE0DE', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Số điện thoại <span style={{ color: '#9D4124' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="09xx.xxx.xxx"
                    value={newStaffForm.phone}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAE0DE', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Mã PIN đăng nhập
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={newStaffForm.pin}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, pin: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAE0DE', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none', letterSpacing: '0.2em' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                  Vai trò phân quyền hệ thống
                </label>
                <select
                  value={newStaffForm.role}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAE0DE', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' }}
                >
                  <option value="WAITER">Phục vụ bàn (Waiter)</option>
                  <option value="KITCHEN">Nhân viên Bếp (Kitchen KDS)</option>
                  <option value="CASHIER">Thu ngân (Cashier POS)</option>
                  <option value="MANAGER">Quản lý nhà hàng (Manager)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #EAE0DE', background: '#F6ECEA', color: '#56423D', fontWeight: 700, cursor: 'pointer' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#9D4124', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}
                >
                  Tạo Nhân Viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Phân Bổ Ca Làm Việc */}
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
                <Icon name="calendar_month" size={24} style={{ color: '#9D4124' }} />
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1F1B1A', margin: 0 }}>
                  Thêm & Điều Phối Nhân Lực Vào Ca
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '6px' }}>
                  1. Chọn ca trực:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShiftAssignmentForm({ ...shiftAssignmentForm, targetShift: 'morning' })}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: shiftAssignmentForm.targetShift === 'morning' ? '2px solid #9D4124' : '1px solid #EAE0DE',
                      background: shiftAssignmentForm.targetShift === 'morning' ? '#FCF1EF' : '#FFFFFF',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1F1B1A' }}>Ca Sáng</div>
                    <div style={{ fontSize: '0.72rem', color: '#89726B', marginTop: '2px' }}>06:00 - 14:00</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShiftAssignmentForm({ ...shiftAssignmentForm, targetShift: 'evening' })}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: shiftAssignmentForm.targetShift === 'evening' ? '2px solid #9D4124' : '1px solid #EAE0DE',
                      background: shiftAssignmentForm.targetShift === 'evening' ? '#FCF1EF' : '#FFFFFF',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1F1B1A' }}>Ca Chiều / Tối</div>
                    <div style={{ fontSize: '0.72rem', color: '#89726B', marginTop: '2px' }}>14:00 - 22:00</div>
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '6px' }}>
                  2. Chọn nhân sự phân công:
                </label>
                <select
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAE0DE', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' }}
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.empCode}) — {s.roleLabel}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #EAE0DE', background: '#F6ECEA', color: '#56423D', fontWeight: 700, cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleAssignShift}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#9D4124', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}
                >
                  Xác Nhận Phân Ca
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Đổi Mã PIN */}
      {showPinModal && (
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
            maxWidth: '380px',
            borderRadius: '24px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 12px 36px rgba(0,0,0,0.25)'
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FFDBC9', color: '#9D4124', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Icon name="dialpad" size={26} />
            </div>
            <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: '0 0 4px' }}>
              Cấp / Đổi Mã PIN
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#89726B', margin: '0 0 16px' }}>
              Nhân viên: <strong style={{ color: '#1F1B1A' }}>{selectedStaffForPin?.name}</strong> ({selectedStaffForPin?.empCode})
            </p>

            <input
              type="password"
              maxLength={6}
              value={newPinCode}
              onChange={(e) => setNewPinCode(e.target.value)}
              placeholder="••••••"
              style={{
                width: '180px',
                padding: '12px',
                fontSize: '1.6rem',
                textAlign: 'center',
                letterSpacing: '0.3em',
                borderRadius: '12px',
                border: '2px solid #9D4124',
                background: '#FFF8F6',
                color: '#1F1B1A',
                outline: 'none',
                marginBottom: '20px'
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                style={{ flex: 1, padding: '11px', borderRadius: '12px', background: '#F0E6E4', border: 'none', fontWeight: 700, color: '#56423D', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleChangePin}
                style={{ flex: 1, padding: '11px', borderRadius: '12px', background: '#9D4124', border: 'none', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}
              >
                Cập Nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
