import React, { useState, useEffect } from 'react';
import Icon from '../../components/common/Icon';
import { tableApi } from '../../api/tableApi';

const ZONES = [
  { id: 'ALL', name: 'Tất Cả Khu Vực' },
  { id: 'ZONE_1', name: 'Tầng 1 - Sảnh Chính' },
  { id: 'ZONE_2', name: 'Tầng 2 - Ban Công' },
  { id: 'VIP', name: 'Phòng VIP' },
];

export default function TableManagementPage() {
  const [tables, setTables] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedZone, setSelectedZone] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQrTable, setSelectedQrTable] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  // State ngăn kéo (Drawer) xem nhanh Order tại bàn
  const [orderDrawerTable, setOrderDrawerTable] = useState(null); // Bàn đang chọn xem đơn
  const [activeOrdersData, setActiveOrdersData] = useState(null); // Dữ liệu món lấy từ API
  const [orderDrawerLoading, setOrderDrawerLoading] = useState(false);

  // Status Modal State (Cập nhật trạng thái bàn, khóa bàn, đặt bàn với thời gian)
  const [statusModalTable, setStatusModalTable] = useState(null);
  const [statusForm, setStatusForm] = useState({
    status: 'AVAILABLE',
    reservationTime: '19:30',
    reservationGuest: '',
    guestsCount: 4,
    blockedReason: 'Bảo trì trang thiết bị'
  });

  // Form Thêm Bàn Mới (Đã bỏ thuộc tính shape)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    zone: 'ZONE_1',
    capacity: 4
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ===================================================================
  // 1. TẢI DỮ LIỆU TỪ BACKEND QUA API
  // ===================================================================
  const loadData = async () => {
    try {
      setLoading(true);



      const resTables = await tableApi.getTables();
      if (resTables.data && resTables.data.success) {
        setTables(resTables.data.data || []);
      }

      // Gọi API lấy số liệu 5 thẻ KPI
      const resSummary = await tableApi.getSummary();
      if (resSummary.data && resSummary.data.success) {
        setSummary(resSummary.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu bàn từ backend:', error);
      const errMsg = error.response?.data?.message
        || (error.response?.status === 401 || error.response?.status === 403
            ? 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!'
            : 'Không thể kết nối đến máy chủ Backend!');
      showToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Tự động gọi API khi khởi tạo trang hoặc thay đổi khu vực / trạng thái
  useEffect(() => {
    loadData();
  }, []);

  // Tìm kiếm theo từ khóa (Frontend fallback lọc nhanh nếu cần)
  // Lọc bàn hiển thị theo Khu vực, Trạng thái và Ô tìm kiếm
  const filteredTables = tables.filter(t => {
    // 1. Lọc theo Khu Vực được chọn trong Dropdown
    if (selectedZone !== 'ALL' && t.zone !== selectedZone) {
      return false;
    }

    // 2. Lọc theo Trạng Thái được chọn trong Dropdown
    if (statusFilter !== 'ALL' && t.status !== statusFilter) {
      return false;
    }

    // 3. Lọc theo Từ Khóa Tìm Kiếm
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const codeMatch = t.code ? t.code.toLowerCase().includes(q) : false;
      const nameMatch = t.name ? t.name.toLowerCase().includes(q) : false;
      return codeMatch || nameMatch;
    }

    return true;
  });

  // ===================================================================
  // 2. MỞ MODAL ĐỔI TRẠNG THÁI BÀN
  // ===================================================================
  const handleOpenStatusModal = (table, targetStatus = null) => {
    setStatusModalTable(table);
    setStatusForm({
      status: targetStatus || table.status,
      reservationTime: table.reservedTime || (table.timeIn ? table.timeIn.replace('Đặt lúc ', '') : '20:00'),
      reservationGuest: table.reservationInfo || '',
      guestsCount: table.guests || table.capacity,
      blockedReason: table.blockedReason || 'Bảo trì định kỳ / Ghép bàn'
    });
  };

  // ===================================================================
  // 3. LƯU CẬP NHẬT TRẠNG THÁI BÀN LÊN BACKEND
  // ===================================================================
  const handleSaveTableStatus = async () => {
    if (!statusModalTable) return;
    try {
      const payload = {
        status: statusForm.status,
        blockedReason: statusForm.status === 'BLOCKED' ? statusForm.blockedReason : null,
        reservationInfo: statusForm.status === 'RESERVED' ? statusForm.reservationGuest : null,
        reservedTime: statusForm.status === 'RESERVED' ? statusForm.reservationTime : null,
        guestsCount: parseInt(statusForm.guestsCount) || statusModalTable.capacity
      };

      const res = await tableApi.updateStatus(statusModalTable.id, payload);
      if (res.data && res.data.success) {
        showToast(`Đã cập nhật trạng thái bàn ${statusModalTable.code}!`);
        setStatusModalTable(null);
        await loadData(); // Tải lại dữ liệu mới nhất
      }
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái bàn:', error);
      const errMsg = error.response?.data?.message || 'Lỗi khi cập nhật trạng thái bàn!';
      showToast(errMsg);
    }
  };

  // ===================================================================
  // 4. CHUYỂN NHANH TRẠNG THÁI BÀN (NÚT BẤM NHANH TRÊN THẺ)
  // ===================================================================
  const handleToggleStatus = async (id, newStatus) => {
    try {
      const payload = {
        status: newStatus,
        guestsCount: newStatus === 'OCCUPIED' ? 4 : 0
      };

      const res = await tableApi.updateStatus(id, payload);
      if (res.data && res.data.success) {
        showToast('Đã cập nhật trạng thái bàn!');
        await loadData();
      }
    } catch (error) {
      console.error('Lỗi chuyển trạng thái bàn:', error);
      const errMsg = error.response?.data?.message || 'Lỗi khi đổi trạng thái bàn!';
      showToast(errMsg);
    }
  };

  // ===================================================================
  // 5. THÊM BÀN ĂN MỚI
  // ===================================================================
  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) return;

    try {
      const payload = {
        tableNumber: formData.code.trim().toUpperCase(),
        name: formData.name.trim() || `Bàn ${formData.code.trim().toUpperCase()}`,
        zone: formData.zone,
        capacity: parseInt(formData.capacity) || 4
      };

      const res = await tableApi.createTable(payload);
      if (res.data && res.data.success) {
        showToast(`Đã thêm bàn mới: ${payload.tableNumber}!`);
        setShowAddModal(false);
        setFormData({ code: '', name: '', zone: 'ZONE_1', capacity: 4 });
        await loadData();
      }
    } catch (error) {
      console.error('Lỗi thêm bàn mới:', error);
      const errMsg = error.response?.data?.message || 'Lỗi khi thêm bàn mới!';
      showToast(errMsg);
    }
  };

  // ===================================================================
  // 6. LÀM MỚI MÃ QR TOKEN CHO BÀN
  // ===================================================================
  const handleRefreshQrToken = async (id) => {
    try {
      const res = await tableApi.refreshQr(id);
      if (res.data && res.data.success) {
        showToast('Đã tái tạo mã QR Token mới cho bàn thành công!');
        setSelectedQrTable(res.data.data);
        await loadData();
      }
    } catch (error) {
      console.error('Lỗi tái tạo mã QR:', error);
      const errMsg = error.response?.data?.message || 'Lỗi khi làm mới mã QR!';
      showToast(errMsg);
    }
  };

  // ===================================================================
  // 6.1 XEM NHANH ORDER TẠI BÀN (QUICK BILL PREVIEW)
  // ===================================================================
  const handleOpenOrderDrawer = async (table) => {
    setOrderDrawerTable(table);
    setOrderDrawerLoading(true);
    try {
      const res = await tableApi.getTableOrders(table.id);
      if (res.data && res.data.success) {
        setActiveOrdersData(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi lấy thông tin món tại bàn:', error);
      showToast('Không thể lấy thông tin món ăn tại bàn!');
    } finally {
      setOrderDrawerLoading(false);
    }
  };

  // ===================================================================
  // 7. SỐ LIỆU 5 THẺ KPI (TỰ ĐỘNG THAY ĐỔI THEO KHU VỰC ĐƯỢC CHỌN)
  // ===================================================================
  // Nếu chọn "Tất Cả" thì lấy toàn bộ bàn, nếu chọn khu vực cụ thể thì chỉ lấy bàn của khu vực đó
  const kpiTables = selectedZone === 'ALL'
      ? tables
      : tables.filter(t => t.zone === selectedZone);
  // Tính toán số liệu tương ứng:
  const totalTables = selectedZone === 'ALL' && summary ? summary.totalTables : kpiTables.length;
  const totalSeats = selectedZone === 'ALL' && summary ? summary.totalSeats : kpiTables.reduce((s, t) => s + (t.capacity || 0), 0);
  const occupiedTables = selectedZone === 'ALL' && summary ? summary.occupiedTables : kpiTables.filter(t => t.status === 'OCCUPIED').length;
  const occupiedGuests = selectedZone === 'ALL' && summary ? summary.occupiedGuests : kpiTables.filter(t => t.status === 'OCCUPIED').reduce((s, t) => s + (t.guests || 0), 0);
  const availableTables = selectedZone === 'ALL' && summary ? summary.availableTables : kpiTables.filter(t => t.status === 'AVAILABLE').length;
  const reservedTables = selectedZone === 'ALL' && summary ? summary.reservedTables : kpiTables.filter(t => t.status === 'RESERVED').length;
  const blockedTables = selectedZone === 'ALL' && summary ? summary.blockedTables : kpiTables.filter(t => t.status === 'BLOCKED').length;

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

      {/* Header & Quick Actions */}
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
            onClick={loadData}
            title="Làm mới dữ liệu từ máy chủ"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: '#FFFFFF',
              border: '1px solid #EAE0DE',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#56423D',
              cursor: 'pointer'
            }}
          >
            <Icon name="refresh" size={18} />
            Làm Mới
          </button>

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

      {/* 5 Thẻ KPI Thống Kê Tổng Quan */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
        {/* Thẻ 1 */}
        <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#89726B', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Tổng Số Bàn</span>
            <Icon name="table_restaurant" size={20} style={{ color: '#9D4124' }} />
          </div>
          <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#1F1B1A', marginTop: '6px' }}>
            {totalTables} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#89726B' }}>bàn ({totalSeats} chỗ)</span>
          </div>
        </div>

        {/* Thẻ 2 */}
        <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#89726B', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Đang Phục Vụ</span>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#9D4124' }} />
          </div>
          <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#9D4124', marginTop: '6px' }}>
            {occupiedTables} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#89726B' }}>bàn ({occupiedGuests} khách)</span>
          </div>
        </div>

        {/* Thẻ 3 */}
        <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#89726B', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Bàn Trống Sẵn Sàng</span>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#059669' }} />
          </div>
          <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#059669', marginTop: '6px' }}>
            {availableTables} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#89726B' }}>bàn</span>
          </div>
        </div>

        {/* Thẻ 4 */}
        <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#89726B', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Bàn Đã Đặt Trước</span>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D97706' }} />
          </div>
          <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#D97706', marginTop: '6px' }}>
            {reservedTables} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#89726B' }}>bàn</span>
          </div>
        </div>

        {/* Thẻ 5 */}
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

      {/* Bộ lọc Phân Khu, Trạng Thái & Ô Tìm Kiếm */}
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
        {/* Ô Tìm Kiếm */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px', maxWidth: '360px', background: '#FDF7F5', border: '1px solid #EAE0DE', borderRadius: '10px', padding: '8px 12px' }}>
          <Icon name="search" size={18} style={{ color: '#89726B' }} />
          <input
            type="text"
            placeholder="Tìm theo mã bàn, tên bàn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') loadData(); }}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.85rem', color: '#1F1B1A' }}
          />
        </div>

        {/* Nhóm Dropdown: Khu Vực & Trạng Thái */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Dropdown Khu Vực */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#89726B', fontWeight: 600 }}>Khu vực:</span>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #EAE0DE',
                background: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#1F1B1A',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {ZONES.map(z => {
                const count = z.id === 'ALL'
                  ? tables.length
                  : tables.filter(t => t.zone === z.id).length;
                return (
                  <option key={z.id} value={z.id}>
                    {z.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Dropdown Trạng Thái */}
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
                outline: 'none',
                cursor: 'pointer'
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

      {/* Danh Sách Thẻ Bàn (Grid of Tables) */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#89726B', fontSize: '0.95rem' }}>
          <Icon name="sync" size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
          <div>Đang tải dữ liệu sơ đồ bàn từ CSDL...</div>
        </div>
      ) : filteredTables.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: '16px', border: '1px dashed #EAE0DE', color: '#89726B' }}>
          <Icon name="table_restaurant" size={36} style={{ color: '#D1C2BE', marginBottom: '8px' }} />
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1F1B1A' }}>Không tìm thấy bàn nào phù hợp</div>
          <p style={{ fontSize: '0.85rem', margin: '4px 0 0' }}>Vui lòng kiểm tra lại bộ lọc hoặc bấm "Thêm Bàn Mới" để bổ sung.</p>
        </div>
      ) : (
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

            const billDisplay = t.currentBill ? Number(t.currentBill).toLocaleString('vi-VN') + '₫' : '0₫';

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

                {/* Table Stats (Đã bỏ shape) */}
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
                    <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{t.capacity} chỗ</span>
                  </div>

                  <div>
                    <span style={{ color: '#89726B', display: 'block' }}>Thực tế:</span>
                    <span style={{ fontWeight: 700, color: t.guests > 0 ? '#9D4124' : '#1F1B1A' }}>
                      {t.guests > 0 ? `${t.guests} khách` : '0 khách'}
                    </span>
                  </div>

                  {t.status === 'OCCUPIED' && (
                    <div
                      onClick={() => handleOpenOrderDrawer(t)}
                      title="Bấm để xem nhanh các món đã gọi"
                      style={{
                        gridColumn: 'span 2',
                        borderTop: '1px dashed #EAE0DE',
                        paddingTop: '6px',
                        marginTop: '2px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ color: '#89726B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icon name="receipt_long" size={14} style={{ color: '#9D4124' }} /> Hóa đơn hiện tại:
                      </span>
                      <span style={{ fontWeight: 800, color: '#9D4124' }}>{billDisplay}</span>
                    </div>
                  )}

                  {t.status === 'RESERVED' && (
                    <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #EAE0DE', paddingTop: '6px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#89726B' }}>Thời gian hẹn:</span>
                        <span style={{ fontWeight: 800, color: '#B45309' }}>{t.reservedTime || t.timeIn || 'Chưa định giờ'}</span>
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

                    {t.status === 'OCCUPIED' && (
                      <button
                        type="button"
                        onClick={() => handleOpenOrderDrawer(t)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: '#9D4124',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(157, 65, 36, 0.2)'
                        }}
                      >
                        <Icon name="receipt_long" size={15} />
                        Xem Đơn
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: XEM VÀ IN MÃ QR CỦA BÀN */}
      {selectedQrTable && (
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
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '420px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            textAlign: 'center',
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

            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9D4124', background: '#FFDBC9', padding: '2px 8px', borderRadius: '6px' }}>
              Tem Bàn QR Code
            </span>

            <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.5rem', color: '#1F1B1A', margin: '8px 0 2px' }}>
              {selectedQrTable.code}
            </h3>
            <p style={{ margin: 0, color: '#89726B', fontSize: '0.85rem' }}>
              {selectedQrTable.name} — {selectedQrTable.zoneName}
            </p>

            {/* QR Image Box */}
            <div style={{
              background: '#FDF7F5',
              padding: '20px',
              borderRadius: '20px',
              border: '2px dashed #EAE0DE',
              margin: '20px 0',
              display: 'inline-block'
            }}>
              <img
                src={selectedQrTable.qrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://roms.restaurant/order/${selectedQrTable.code}`}
                alt={`Mã QR ${selectedQrTable.code}`}
                style={{ width: '200px', height: '200px', borderRadius: '12px', display: 'block' }}
              />
              <span style={{ display: 'block', fontSize: '0.72rem', color: '#89726B', marginTop: '8px', fontWeight: 600 }}>
                Token: {selectedQrTable.qrToken || 'qr-secret-key'}
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#56423D', margin: '0 0 20px', lineHeight: 1.4 }}>
              Thực khách chỉ cần dùng camera điện thoại quét mã trên mặt bàn để tự động vào thực đơn và gọi món.
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleRefreshQrToken(selectedQrTable.id)}
                title="Tái tạo token mới nếu tem dán bàn cũ bị lộ"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#F6ECEA',
                  border: '1px solid #EAE0DE',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: '#9D4124',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <Icon name="refresh" size={16} />
                Đổi Token
              </button>

              <button
                type="button"
                onClick={() => {
                  window.open(selectedQrTable.qrUrl, '_blank');
                  showToast('Đang mở ảnh QR để in...');
                }}
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Icon name="print" size={18} />
                In Tem Mã QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: THÊM BÀN MỚI (Đã loại bỏ shape hoàn toàn) */}
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
                  Mã Bàn (VD: T-11, VIP-04) <span style={{ color: '#BA1A1A' }}>*</span>
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

      {/* MODAL 3: CÀI ĐẶT TRẠNG THÁI BÀN (KHÓA / ĐẶT CHỖ / DỌN DẸP) */}
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

            {/* Lựa Chọn Trạng Thái */}
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

            {/* Form Phụ Khi Chọn ĐẶT TRƯỚC */}
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

            {/* Form Phụ Khi Chọn KHÓA BÀN */}
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

            {/* Form Phụ Khi Chọn ĐANG PHỤC VỤ */}
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

      {/* ============================================================= */}
      {/* DRAWER: XEM NHANH ORDER VÀ TIẾN ĐỘ BẾP TẠI BÀN               */}
      {/* ============================================================= */}
      {orderDrawerTable && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 10000,
          display: 'flex',
          justifyContent: 'flex-end',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '460px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.15)'
          }}>
            {/* Header Drawer */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0E6E4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#9D4124' }}>{orderDrawerTable.code}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1F1B1A' }}>{orderDrawerTable.name}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#89726B', marginTop: '2px' }}>
                  {orderDrawerTable.zoneName} • {activeOrdersData?.guestCount || orderDrawerTable.guests || orderDrawerTable.capacity} khách
                  {activeOrdersData?.timeIn && ` • Vào lúc: ${activeOrdersData.timeIn}`}
                  {activeOrdersData?.durationMinutes !== undefined && activeOrdersData?.durationMinutes > 0 && ` (${activeOrdersData.durationMinutes} phút)`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setOrderDrawerTable(null); setActiveOrdersData(null); }}
                style={{ background: '#F6ECEA', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#56423D' }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Nội dung danh sách món */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {orderDrawerLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#89726B' }}>
                  <Icon name="sync" size={28} style={{ animation: 'spin 1s linear infinite' }} />
                  <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>Đang tải danh sách món của bàn...</div>
                </div>
              ) : !activeOrdersData || !activeOrdersData.items || activeOrdersData.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#89726B' }}>
                  <Icon name="soup_kitchen" size={40} style={{ color: '#D1C2BE', marginBottom: '8px' }} />
                  <div style={{ fontWeight: 700, color: '#1F1B1A' }}>Chưa có món nào được gọi</div>
                  <p style={{ fontSize: '0.82rem', margin: '4px 0 0' }}>Bàn đang chờ khách quét mã QR để bắt đầu gọi món.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Thanh thống kê tiến độ món */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: '#FFF8F6', padding: '12px', borderRadius: '12px', border: '1px solid #F0E6E4', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#89726B' }}>Chờ bếp</div>
                      <div style={{ fontWeight: 800, color: '#B45309', fontSize: '1.1rem' }}>{activeOrdersData.pendingItems || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#89726B' }}>Đang nấu</div>
                      <div style={{ fontWeight: 800, color: '#9D4124', fontSize: '1.1rem' }}>{activeOrdersData.cookingItems || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#89726B' }}>Đã ra món</div>
                      <div style={{ fontWeight: 800, color: '#059669', fontSize: '1.1rem' }}>{activeOrdersData.servedItems || 0}</div>
                    </div>
                  </div>

                  {/* Danh sách từng món */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {activeOrdersData.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', background: '#FAFAFA', border: '1px solid #F0E6E4' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1F1B1A' }}>
                            {item.itemName} <span style={{ color: '#9D4124' }}>x{item.quantity}</span>
                          </div>
                          {item.note && (
                            <div style={{ fontSize: '0.75rem', color: '#89726B', fontStyle: 'italic', marginTop: '2px' }}>
                              📝 {item.note}
                            </div>
                          )}
                          <span style={{
                            display: 'inline-block',
                            marginTop: '4px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: item.status === 'COOKING' ? '#FFEDD5' : item.status === 'SERVED' ? '#DCFCE7' : '#FEF3C7',
                            color: item.status === 'COOKING' ? '#9A3412' : item.status === 'SERVED' ? '#166534' : '#92400E'
                          }}>
                            {item.statusText}
                          </span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1F1B1A' }}>
                          {Number(item.subtotal).toLocaleString('vi-VN')}₫
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Drawer: Tạm tính */}
            {activeOrdersData && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid #F0E6E4', background: '#FFF8F6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#89726B', fontWeight: 600 }}>Tạm tính ({activeOrdersData.totalItems || 0} món):</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#9D4124' }}>
                    {Number(activeOrdersData.totalAmount || 0).toLocaleString('vi-VN')}₫
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setOrderDrawerTable(null); setActiveOrdersData(null); }}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#9D4124', color: '#FFFFFF', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                >
                  Đóng Ngăn Kéo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
