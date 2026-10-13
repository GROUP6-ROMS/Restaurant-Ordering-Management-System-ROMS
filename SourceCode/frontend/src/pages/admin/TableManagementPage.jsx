import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { tableApi } from '../../api/tableApi';
import { zoneApi } from '../../api/zoneApi';
import { reservationApi } from '../../api/reservationApi';
import { menuApi } from '../../api/menuApi';
import { broadcastRealtimeEvent, subscribeRealtimeEvents } from '../../utils/realtimeSync';

export default function TableManagementPage() {
  const location = useLocation();
  const [tables, setTables] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Danh sách các khu vực động tải từ backend
  const [zonesList, setZonesList] = useState([
    { id: 1, zoneCode: 'ZONE_1', name: 'Tầng 1 - Sảnh Chính' },
    { id: 2, zoneCode: 'ZONE_2', name: 'Tầng 2 - Ban Công' },
    { id: 3, zoneCode: 'VIP', name: 'Phòng VIP' },
  ]);

  // State Modal Quản Lý Khu Vực (Zone CRUD)
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [zoneModalMode, setZoneModalMode] = useState('LIST'); // 'LIST' | 'CREATE' | 'EDIT'
  const [zoneFormData, setZoneFormData] = useState({
    zoneCode: '',
    name: '',
    description: '',
    displayOrder: 0
  });
  const [editingZoneId, setEditingZoneId] = useState(null);
  const [deletingZone, setDeletingZone] = useState(null);
  const [showDeleteZoneConfirm, setShowDeleteZoneConfirm] = useState(false);
  const [zoneActionLoading, setZoneActionLoading] = useState(false);

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

  // State Modal Chỉnh Sửa Bàn Ăn (Update Table)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTableData, setEditTableData] = useState(null);
  const [editFormData, setEditFormData] = useState({
    code: '',
    name: '',
    zone: 'ZONE_1',
    capacity: 4
  });

  // State Modal Xác Nhận Xóa Bàn Ăn (Delete Table)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTable, setDeletingTable] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // State Modal In Tem Bàn Hàng Loạt Khổ Giấy A4 (Batch QR Print Sheet)
  const [showBatchQrModal, setShowBatchQrModal] = useState(false);
  const [batchFilterZone, setBatchFilterZone] = useState('ALL');

  // State Quản Lý & Set Bàn Cho Đơn Đặt Bàn (Reservation Assignment)
  const [reservations, setReservations] = useState([]);
  const [pendingReservationsCount, setPendingReservationsCount] = useState(0);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [resStatusFilter, setResStatusFilter] = useState('PENDING'); // 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'ALL'
  const [resSearchTerm, setResSearchTerm] = useState('');
  const [resLoading, setResLoading] = useState(false);

  // State Modal Xếp Bàn (Set Bàn)
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedResForAssign, setSelectedResForAssign] = useState(null);
  const [availableTablesForAssign, setAvailableTablesForAssign] = useState([]);
  const [selectedAssignTableId, setSelectedAssignTableId] = useState('');
  const [assignZoneFilter, setAssignZoneFilter] = useState('ALL'); // Lọc bàn trống theo khu vực trong modal
  const [assignAdminNote, setAssignAdminNote] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // State Modal Hủy Đơn Đặt Bàn
  const [showCancelResModal, setShowCancelResModal] = useState(false);
  const [selectedResForCancel, setSelectedResForCancel] = useState(null);
  const [cancelResReason, setCancelResReason] = useState('Khách hàng yêu cầu hủy / Không liên lạc được');
  const [cancelResLoading, setCancelResLoading] = useState(false);

  // State Modal Quản Lý & Điều Chỉnh Món Đặt Trước Cho Bàn (Pre-order Management)
  const [showPreOrderModal, setShowPreOrderModal] = useState(false);
  const [selectedResForPreOrder, setSelectedResForPreOrder] = useState(null);
  const [editingPreOrderItems, setEditingPreOrderItems] = useState([]);
  const [menuCatalog, setMenuCatalog] = useState([]);
  const [menuCatalogLoading, setMenuCatalogLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCatFilter, setCatalogCatFilter] = useState('ALL');
  const [savePreOrderLoading, setSavePreOrderLoading] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ===================================================================
  // 1. TẢI DỮ LIỆU TỪ BACKEND QUA API
  // ===================================================================
  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const resTables = await tableApi.getTables();
      if (resTables.data && resTables.data.success) {
        setTables(resTables.data.data || []);
      }

      // Gọi API lấy số liệu 5 thẻ KPI
      const resSummary = await tableApi.getSummary();
      if (resSummary.data && resSummary.data.success) {
        setSummary(resSummary.data.data);
      }
      // Tải danh sách khu vực động từ backend
      try {
        const resZones = await zoneApi.getZones();
        if (resZones.data && resZones.data.success && resZones.data.data) {
          setZonesList(resZones.data.data);
        }
      } catch (zoneErr) {
        console.warn('Lỗi tải danh mục khu vực:', zoneErr);
      }

      // Tải danh sách đơn đặt bàn để cập nhật số lượng yêu cầu mới (Pending Badge)
      try {
        const resReservations = await reservationApi.getAdminReservations();
        const resList = resReservations.data || [];
        setReservations(resList);
        const pendingCount = resList.filter(r => r.status === 'PENDING').length;
        setPendingReservationsCount(pendingCount);
      } catch (resErr) {
        console.warn('Lỗi tải danh sách đặt bàn:', resErr);
      }
    } catch (error) {
      if (!silent) {
        console.error('Lỗi khi tải dữ liệu bàn từ backend:', error);
        const errMsg = error.response?.data?.message
          || (error.response?.status === 401 || error.response?.status === 403
              ? 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!'
              : 'Không thể kết nối đến máy chủ Backend!');
        showToast(errMsg);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // ===================================================================
  // 1.0. CÁC HÀM XỬ LÝ ĐẶT BÀN & SET BÀN (RESERVATION MANAGEMENT)
  // ===================================================================
  const loadReservations = async () => {
    try {
      setResLoading(true);
      const res = await reservationApi.getAdminReservations();
      const list = res.data || [];
      setReservations(list);
      const pendingCount = list.filter(r => r.status === 'PENDING').length;
      setPendingReservationsCount(pendingCount);
      return list;
    } catch (err) {
      console.warn('Lỗi tải danh sách đặt bàn:', err);
      return [];
    } finally {
      setResLoading(false);
    }
  };

  const handleOpenAssignModal = async (resItem) => {
    setSelectedResForAssign(resItem);
    setSelectedAssignTableId('');
    setAssignZoneFilter('ALL');
    setAssignAdminNote('');
    setShowAssignModal(true);
    setAssignLoading(true);
    try {
      const res = await reservationApi.getAvailableTablesForReservation(resItem.id);
      const availableList = res.data || [];
      setAvailableTablesForAssign(availableList);
      if (availableList.length > 0) {
        // Tự động gợi ý bàn cùng khu vực khách mong muốn nếu có
        const matched = availableList.find(t => t.zone === resItem.requestedZone);
        setSelectedAssignTableId(matched ? String(matched.id) : String(availableList[0].id));
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách bàn khả dụng:', err);
      showToast('Không thể lấy danh sách bàn trống khả dụng!');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleOpenReservationModal = async (targetResId = null) => {
    setShowReservationModal(true);
    setResStatusFilter('PENDING'); // Luôn chuyển tab sang Chờ Duyệt (PENDING) khi mở từ thông báo
    const list = await loadReservations();
    if (targetResId && Array.isArray(list)) {
      const found = list.find(r => String(r.id) === String(targetResId) || r.bookingCode === targetResId);
      if (found) {
        handleOpenAssignModal(found);
      }
    }
  };

  const handleConfirmAssignTable = async () => {
    if (!selectedResForAssign || !selectedAssignTableId) {
      showToast('Vui lòng chọn một bàn ăn trống để xếp cho khách!');
      return;
    }
    try {
      setAssignLoading(true);
      const payload = {
        tableId: Number(selectedAssignTableId),
        adminNote: assignAdminNote.trim() || undefined
      };
      const res = await reservationApi.assignTable(selectedResForAssign.id, payload);
      if (res.success || res.data) {
        showToast(`Đã xếp bàn thành công cho khách hàng ${selectedResForAssign.customerName}!`);
        setShowAssignModal(false);
        setSelectedResForAssign(null);
        await loadReservations();
        await loadData(true);
      }
    } catch (err) {
      console.error('Lỗi xếp bàn:', err);
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi xếp bàn!';
      showToast(errMsg);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleOpenCancelResModal = (resItem) => {
    setSelectedResForCancel(resItem);
    setCancelResReason('Khách hàng yêu cầu hủy / Không liên lạc được');
    setShowCancelResModal(true);
  };

  const handleConfirmCancelRes = async () => {
    if (!selectedResForCancel) return;
    try {
      setCancelResLoading(true);
      const res = await reservationApi.cancelReservation(selectedResForCancel.id, {
        cancelReason: cancelResReason.trim() || 'Quản lý hủy yêu cầu'
      });
      if (res.success || res.data) {
        showToast(`Đã hủy phiếu đặt bàn của ${selectedResForCancel.customerName}!`);
        setShowCancelResModal(false);
        setSelectedResForCancel(null);
        await loadReservations();
        await loadData(true);
      }
    } catch (err) {
      console.error('Lỗi hủy phiếu đặt bàn:', err);
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn đặt bàn!';
      showToast(errMsg);
    } finally {
      setCancelResLoading(false);
    }
  };

  // ===================================================================
  // 1.0.1. CÁC HÀM XỬ LÝ MÓN ĐẶT TRƯỚC (PRE-ORDER MANAGEMENT)
  // ===================================================================
  const handleOpenPreOrderModal = async (resItem) => {
    setSelectedResForPreOrder(resItem);
    const currentItems = (resItem.preOrderItems || []).map(item => ({
      menuItemId: item.menuItemId,
      menuItemName: item.menuItemName,
      sku: item.sku,
      imageUrl: item.imageUrl,
      categoryName: item.categoryName,
      unitPrice: Number(item.unitPrice) || 0,
      quantity: Number(item.quantity) || 1,
      subtotal: Number(item.subtotal) || ((Number(item.unitPrice) || 0) * (Number(item.quantity) || 1)),
      note: item.note || ''
    }));
    setEditingPreOrderItems(currentItems);
    setCatalogSearch('');
    setCatalogCatFilter('ALL');
    setShowPreOrderModal(true);

    if (menuCatalog.length === 0) {
      try {
        setMenuCatalogLoading(true);
        const resMenu = await menuApi.getItems();
        const dishes = resMenu.data || [];
        setMenuCatalog(dishes.filter(d => d.isActive));
      } catch (err) {
        console.warn('Lỗi khi tải thực đơn cho đặt trước:', err);
      } finally {
        setMenuCatalogLoading(false);
      }
    }
  };

  const handleUpdatePreOrderItemQty = (index, delta) => {
    setEditingPreOrderItems(prev => {
      const next = [...prev];
      const item = next[index];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        next.splice(index, 1);
      } else {
        next[index] = {
          ...item,
          quantity: newQty,
          subtotal: item.unitPrice * newQty
        };
      }
      return next;
    });
  };

  const handleUpdatePreOrderItemNote = (index, note) => {
    setEditingPreOrderItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], note };
      return next;
    });
  };

  const handleRemovePreOrderItem = (index) => {
    setEditingPreOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddDishToPreOrder = (dish) => {
    setEditingPreOrderItems(prev => {
      const existingIdx = prev.findIndex(i => i.menuItemId === dish.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        const cur = next[existingIdx];
        const newQty = cur.quantity + 1;
        next[existingIdx] = {
          ...cur,
          quantity: newQty,
          subtotal: cur.unitPrice * newQty
        };
        return next;
      } else {
        const price = Number(dish.price) || 0;
        return [
          ...prev,
          {
            menuItemId: dish.id,
            menuItemName: dish.name,
            sku: dish.sku,
            imageUrl: dish.imageUrl,
            categoryName: dish.categoryName,
            unitPrice: price,
            quantity: 1,
            subtotal: price,
            note: ''
          }
        ];
      }
    });
  };

  const handleSavePreOrderItems = async () => {
    if (!selectedResForPreOrder) return;
    try {
      setSavePreOrderLoading(true);
      const payload = {
        items: editingPreOrderItems.map(i => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          note: i.note ? i.note.trim() : ''
        }))
      };

      const res = await reservationApi.updateReservationItems(selectedResForPreOrder.id, payload);
      const updatedRes = res.data;

      setReservations(prev => prev.map(r => r.id === updatedRes.id ? updatedRes : r));
      setSelectedResForPreOrder(updatedRes);
      showToast('Cập nhật danh sách món đặt trước thành công!');
      setShowPreOrderModal(false);
    } catch (err) {
      console.error('Lỗi lưu món đặt trước:', err);
      const errMsg = err.response?.data?.message || 'Không thể lưu món đặt trước!';
      showToast(errMsg);
    } finally {
      setSavePreOrderLoading(false);
    }
  };

  // ===================================================================
  // 1.1. CÁC HÀM XỬ LÝ QUẢN LÝ KHU VỰC (ZONE CRUD)
  // ===================================================================
  const handleOpenZoneModal = async () => {
    setShowZoneModal(true);
    setZoneModalMode('LIST');
    setZoneFormData({ zoneCode: '', name: '', description: '', displayOrder: 0 });
    setEditingZoneId(null);
    try {
      const res = await zoneApi.getZones();
      if (res.data && res.data.success) {
        setZonesList(res.data.data || []);
      }
    } catch (e) {
      console.warn('Lỗi refresh danh sách khu vực:', e);
    }
  };

  const handleStartCreateZone = () => {
    setZoneFormData({
      zoneCode: '',
      name: '',
      description: '',
      displayOrder: zonesList.length + 1
    });
    setZoneModalMode('CREATE');
  };

  const handleStartEditZone = (zone) => {
    setEditingZoneId(zone.id);
    setZoneFormData({
      zoneCode: zone.zoneCode,
      name: zone.name,
      description: zone.description || '',
      displayOrder: zone.displayOrder || 0
    });
    setZoneModalMode('EDIT');
  };

  const handleSaveZone = async (e) => {
    e.preventDefault();
    if (!zoneFormData.name.trim()) {
      showToast('Vui lòng nhập tên khu vực!');
      return;
    }

    try {
      setZoneActionLoading(true);
      if (zoneModalMode === 'CREATE') {
        if (!zoneFormData.zoneCode.trim()) {
          showToast('Vui lòng nhập mã khu vực (ví dụ: ZONE_3, ROOFTOP)!');
          setZoneActionLoading(false);
          return;
        }
        const payload = {
          zoneCode: zoneFormData.zoneCode.trim().toUpperCase(),
          name: zoneFormData.name.trim(),
          description: zoneFormData.description.trim() || null,
          displayOrder: parseInt(zoneFormData.displayOrder) || 0
        };
        const res = await zoneApi.createZone(payload);
        if (res.data && res.data.success) {
          showToast(`Đã tạo thành công khu vực: ${payload.name}!`);
        }
      } else if (zoneModalMode === 'EDIT') {
        const payload = {
          name: zoneFormData.name.trim(),
          description: zoneFormData.description.trim() || null,
          displayOrder: parseInt(zoneFormData.displayOrder) || 0
        };
        const res = await zoneApi.updateZone(editingZoneId, payload);
        if (res.data && res.data.success) {
          showToast('Cập nhật khu vực thành công!');
        }
      }

      await loadData();
      const resZ = await zoneApi.getZones();
      if (resZ.data && resZ.data.success) {
        setZonesList(resZ.data.data || []);
      }
      setZoneModalMode('LIST');
    } catch (error) {
      console.error('Lỗi lưu khu vực:', error);
      const errMsg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu khu vực!';
      showToast(errMsg);
    } finally {
      setZoneActionLoading(false);
    }
  };

  const handleConfirmDeleteZone = (zone) => {
    setDeletingZone(zone);
    setShowDeleteZoneConfirm(true);
  };

  const handleDeleteZone = async () => {
    if (!deletingZone) return;
    try {
      setZoneActionLoading(true);
      const res = await zoneApi.deleteZone(deletingZone.id);
      if (res.data && res.data.success) {
        showToast(`Đã xóa khu vực: ${deletingZone.name}!`);
        setShowDeleteZoneConfirm(false);
        setDeletingZone(null);

        if (selectedZone === deletingZone.zoneCode) {
          setSelectedZone('ALL');
        }

        await loadData();
        const resZ = await zoneApi.getZones();
        if (resZ.data && resZ.data.success) {
          setZonesList(resZ.data.data || []);
        }
      }
    } catch (error) {
      console.error('Lỗi xóa khu vực:', error);
      const errMsg = error.response?.data?.message || 'Không thể xóa khu vực này!';
      showToast(errMsg);
    } finally {
      setZoneActionLoading(false);
    }
  };

  // Tự động gọi API khi khởi tạo trang và thiết lập đồng bộ thời gian thực (Polling 6s)
  useEffect(() => {
    loadData(false);

    // Chu kỳ cập nhật tự động 6s/lần trong nền (không giật màn hình)
    const timer = setInterval(() => {
      loadData(true);
    }, 6000);

    // Tự động tải lại ngay khi quản trị viên quay lại tab trình duyệt
    const handleFocus = () => loadData(true);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Lắng nghe tín hiệu từ chuông thông báo thông qua React Router location.state (khi chuyển từ trang khác đến)
  useEffect(() => {
    if (location.state?.openReservationModal) {
      const targetId = location.state.targetReservationId || null;
      handleOpenReservationModal(targetId);
      // Xóa state để tránh mở lại khi reload trang
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Lắng nghe sự kiện mở popup duyệt bàn khi người dùng đang ở sẵn trên trang Sơ đồ bàn
  useEffect(() => {
    const handleCustomOpenReservation = (e) => {
      const targetId = e.detail?.targetReservationId || null;
      handleOpenReservationModal(targetId);
    };

    window.addEventListener('ROMS_OPEN_RESERVATION_MODAL', handleCustomOpenReservation);
    return () => {
      window.removeEventListener('ROMS_OPEN_RESERVATION_MODAL', handleCustomOpenReservation);
    };
  }, []);

  // Lắng nghe sự kiện đồng bộ thời gian thực từ chuông gọi phục vụ, xin thanh toán và đơn món
  useEffect(() => {
    const unsubscribe = subscribeRealtimeEvents((event) => {
      if (
        event?.type === 'CALL_WAITER' ||
        event?.type === 'PAYMENT_REQUEST' ||
        event?.type === 'SERVICE_REQUEST_RESOLVED' ||
        event?.type === 'TABLE_UPDATE' ||
        event?.type === 'NEW_ORDER_CREATED'
      ) {
        loadData(true);
      }
    });
    return unsubscribe;
  }, []);

  // Danh sách các bàn đang có chuông gọi phục vụ hoặc yêu cầu thanh toán PENDING
  const tablesWithAlert = tables.filter(t => (t.pendingServiceRequestCount && t.pendingServiceRequestCount > 0) || !!t.pendingServiceRequestId);

  // Helper lấy cấu hình hiển thị cho chuông gọi phục vụ & thanh toán
  const getAlertDetails = (table) => {
    const reqType = (table.pendingServiceRequestType || '').toUpperCase();
    const isBill = reqType === 'BILL' || reqType === 'REQUEST_BILL' || (table.pendingServiceRequestNote && table.pendingServiceRequestNote.toLowerCase().includes('thanh toán'));

    if (isBill) {
      return {
        isBill: true,
        title: 'Khách yêu cầu tính tiền',
        icon: 'payments',
        badgeBg: '#F5F3FF',
        badgeColor: '#7C3AED',
        badgeBorder: '#DDD6FE',
        btnBg: '#7C3AED'
      };
    }
    if (reqType === 'REQUEST_ICE') {
      return {
        isBill: false,
        title: 'Khách xin thêm đá',
        icon: 'ac_unit',
        badgeBg: '#FFFBEB',
        badgeColor: '#D97706',
        badgeBorder: '#FDE68A',
        btnBg: '#D97706'
      };
    }
    if (reqType === 'CALL_WATER' || reqType === 'REQUEST_WATER') {
      return {
        isBill: false,
        title: 'Khách xin thêm nước',
        icon: 'water_drop',
        badgeBg: '#EFF6FF',
        badgeColor: '#2563EB',
        badgeBorder: '#BFDBFE',
        btnBg: '#2563EB'
      };
    }
    if (reqType === 'REQUEST_CLEAN') {
      return {
        isBill: false,
        title: 'Yêu cầu dọn bàn',
        icon: 'cleaning_services',
        badgeBg: '#F3F4F6',
        badgeColor: '#4B5563',
        badgeBorder: '#E5E7EB',
        btnBg: '#4B5563'
      };
    }
    return {
      isBill: false,
      title: 'Khách gọi phục vụ',
      icon: 'notifications_active',
      badgeBg: '#FFFBEB',
      badgeColor: '#D97706',
      badgeBorder: '#FDE68A',
      btnBg: '#D97706'
    };
  };

  // Tìm kiếm theo từ khóa (Frontend fallback lọc nhanh nếu cần)
  // Lọc bàn hiển thị theo Khu vực, Trạng thái và Ô tìm kiếm
  const filteredTables = tables.filter(t => {
    // 1. Lọc theo Khu Vực được chọn trong Dropdown
    if (selectedZone !== 'ALL' && t.zone !== selectedZone) {
      return false;
    }

    // 2. Lọc theo Trạng Thái được chọn trong Dropdown
    if (statusFilter === 'ALERT') {
      const hasAlert = (t.pendingServiceRequestCount && t.pendingServiceRequestCount > 0) || !!t.pendingServiceRequestId;
      if (!hasAlert) return false;
    } else if (statusFilter !== 'ALL' && t.status !== statusFilter) {
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

  // Helper tính Badge thời gian ngồi dùng bữa của bàn (Dwell Time Alert)
  const getTableDwellBadge = (t) => {
    if (t.status !== 'OCCUPIED') return null;

    const minutes = typeof t.durationMinutes === 'number' ? t.durationMinutes : 0;
    const timeText = minutes > 0 ? `${minutes} phút` : (t.timeIn ? `Vào lúc ${t.timeIn}` : 'Đang ngồi');

    if (minutes >= 90) {
      return (
        <span
          title={`Khách ngồi rất lâu (${minutes} phút), cần lưu ý chăm sóc hoặc hỗ trợ thanh toán!`}
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
            border: '1px solid #FCA5A5'
          }}
        >
          <Icon name="warning" size={13} style={{ color: '#B91C1C' }} />
          {timeText}
        </span>
      );
    } else if (minutes >= 60) {
      return (
        <span
          title={`Khách ngồi ${minutes} phút, dự kiến sắp kết thúc bữa ăn.`}
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
            border: '1px solid #FCD34D'
          }}
        >
          <Icon name="timer" size={13} style={{ color: '#B45309' }} />
          {timeText}
        </span>
      );
    } else if (minutes > 0) {
      return (
        <span
          title={`Thời gian dùng bữa: ${minutes} phút`}
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
            border: '1px solid #A7F3D0'
          }}
        >
          <Icon name="schedule" size={13} style={{ color: '#047857' }} />
          {timeText}
        </span>
      );
    }
    return null;
  };

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
  // 4.1. QUẢN LÝ XÁC NHẬN ĐÃ XỬ LÝ CHUÔNG GỌI PHỤC VỤ / XIN THANH TOÁN
  // ===================================================================
  const handleResolveServiceRequest = async (table, e) => {
    if (e) e.stopPropagation();
    try {
      if (table.pendingServiceRequestId) {
        await tableApi.resolveServiceRequest(table.pendingServiceRequestId);
      } else {
        await tableApi.resolveAllTableRequests(table.id);
      }
      showToast(`Đã xử lý xong yêu cầu hỗ trợ cho bàn ${table.code || table.name}!`);
      broadcastRealtimeEvent({ type: 'SERVICE_REQUEST_RESOLVED', tableId: table.id });
      await loadData(true);
    } catch (err) {
      console.error('Lỗi khi xử lý yêu cầu chuông:', err);
      const errMsg = err.response?.data?.message || 'Có lỗi khi xử lý yêu cầu hỗ trợ!';
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
  // 5.1. MỞ MODAL CHỈNH SỬA THÔNG TIN BÀN
  // ===================================================================
  const handleOpenEditModal = (table) => {
    setEditTableData(table);
    setEditFormData({
      code: table.code || table.tableNumber || '',
      name: table.name || '',
      zone: table.zone || 'ZONE_1',
      capacity: table.capacity || 4
    });
    setShowEditModal(true);
  };

  // ===================================================================
  // 5.2. LƯU CHỈNH SỬA THÔNG TIN BÀN ĂN
  // ===================================================================
  const handleUpdateTable = async (e) => {
    e.preventDefault();
    if (!editTableData || !editFormData.code.trim()) return;

    try {
      const payload = {
        tableNumber: editFormData.code.trim().toUpperCase(),
        name: editFormData.name.trim() || `Bàn ${editFormData.code.trim().toUpperCase()}`,
        zone: editFormData.zone,
        capacity: parseInt(editFormData.capacity) || 4
      };

      const res = await tableApi.updateTable(editTableData.id, payload);
      if (res.data && res.data.success) {
        showToast(`Đã cập nhật thông tin bàn: ${payload.tableNumber}!`);
        setShowEditModal(false);
        setEditTableData(null);
        await loadData();
      }
    } catch (error) {
      console.error('Lỗi cập nhật bàn:', error);
      const errMsg = error.response?.data?.message || 'Lỗi khi cập nhật thông tin bàn!';
      showToast(errMsg);
    }
  };

  // ===================================================================
  // 5.3. MỞ MODAL XÁC NHẬN XÓA BÀN ĂN
  // ===================================================================
  const handleOpenDeleteModal = (table) => {
    if (table.status === 'OCCUPIED') {
      showToast('Bàn đang có khách phục vụ, không thể xóa!');
      return;
    }
    setDeletingTable(table);
    setShowDeleteModal(true);
  };

  // ===================================================================
  // 5.4. XÁC NHẬN XÓA BÀN ĂN
  // ===================================================================
  const handleConfirmDelete = async () => {
    if (!deletingTable) return;
    try {
      setDeleteLoading(true);
      const res = await tableApi.deleteTable(deletingTable.id);
      if (res.data && res.data.success) {
        showToast(`Đã xóa bàn ${deletingTable.code || deletingTable.name}!`);
        setShowDeleteModal(false);
        setDeletingTable(null);
        await loadData();
      }
    } catch (error) {
      console.error('Lỗi xóa bàn:', error);
      const errMsg = error.response?.data?.message || 'Lỗi khi xóa bàn ăn!';
      showToast(errMsg);
    } finally {
      setDeleteLoading(false);
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

  // Lọc danh sách bàn cho Modal In Tem Mã QR Hàng Loạt Khổ A4
  const batchFilteredTables = tables.filter(t => {
    if (batchFilterZone === 'ALL') return true;
    return t.zone === batchFilterZone;
  });

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
            onClick={() => setShowBatchQrModal(true)}
            title="Mở bảng in tem mã QR toàn bộ các bàn trong nhà hàng (Khổ A4)"
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
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name="print" size={18} />
            Xuất & In Tất Cả Mã QR
          </button>

          <button
            type="button"
            onClick={handleOpenZoneModal}
            title="Quản lý thêm, sửa, xóa các phân khu bàn trong nhà hàng"
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
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name="domain" size={18} />
            Quản Lý Khu Vực
          </button>

          <button
            type="button"
            onClick={handleOpenReservationModal}
            title="Xem danh sách đặt bàn trực tuyến và set bàn cho khách"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '12px',
              background: pendingReservationsCount > 0 ? '#FEF2F2' : '#FFFFFF',
              border: pendingReservationsCount > 0 ? '1.5px solid #EF4444' : '1px solid #EAE0DE',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: pendingReservationsCount > 0 ? '#B91C1C' : '#56423D',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.15s ease',
              boxShadow: pendingReservationsCount > 0 ? '0 2px 8px rgba(239, 68, 68, 0.2)' : 'none'
            }}
          >
            <Icon name="event_seat" size={18} style={{ color: pendingReservationsCount > 0 ? '#EF4444' : '#9D4124' }} />
            Duyệt & Set Bàn Đặt
            {pendingReservationsCount > 0 && (
              <span style={{
                background: '#EF4444',
                color: '#FFFFFF',
                borderRadius: '999px',
                padding: '2px 7px',
                fontSize: '0.72rem',
                fontWeight: 800,
                lineHeight: 1
              }}>
                {pendingReservationsCount}
              </span>
            )}
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

      {/* Alert Banner cảnh báo có đơn đặt bàn đang chờ xếp bàn */}
      {pendingReservationsCount > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 20px',
          background: 'linear-gradient(90deg, #FEF2F2 0%, #FFF7ED 100%)',
          border: '1px solid #FCA5A5',
          borderRadius: '16px',
          boxShadow: '0 4px 14px rgba(239, 68, 68, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Icon name="notifications_active" size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#991B1B', fontSize: '0.96rem' }}>
                Có {pendingReservationsCount} yêu cầu đặt bàn trực tuyến mới cần được gọi xác nhận & xếp bàn!
              </div>
              <div style={{ color: '#7F1D1D', fontSize: '0.84rem', marginTop: '2px' }}>
                Khách hàng đã gửi thông tin đặt chỗ từ website. Quản lý vui lòng xác nhận và gán bàn ăn phù hợp trước khi khách đến.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenReservationModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(220, 38, 38, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name="chair" size={18} />
            Xem Danh Sách & Xếp Bàn Ngay
          </button>
        </div>
      )}

      {/* CSS Keyframes cho hiệu ứng chuông nhấp nháy trên thẻ bàn */}
      <style>{`
        @keyframes romsPulseService {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.5); }
          50% { box-shadow: 0 0 16px 4px rgba(245, 158, 11, 0.35); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.5); }
        }
        @keyframes romsPulseBill {
          0% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.5); }
          50% { box-shadow: 0 0 16px 4px rgba(124, 58, 237, 0.35); }
          100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.5); }
        }
      `}</style>

      {/* Banner Cảnh Báo: Bàn Ăn Đang Gọi Phục Vụ Hoặc Xin Tính Tiền */}
      {tablesWithAlert.length > 0 && (
        <div style={{
          background: '#FFFBEB',
          border: '1.5px solid #FDE68A',
          borderRadius: '16px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          boxShadow: '0 4px 14px rgba(245, 158, 11, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Icon name="notifications_active" size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#92400E', fontSize: '0.96rem' }}>
                Có {tablesWithAlert.length} bàn ăn đang gửi chuông gọi phục vụ / yêu cầu thanh toán!
              </div>
              <div style={{ color: '#B45309', fontSize: '0.84rem', marginTop: '2px' }}>
                Các bàn: <strong>{tablesWithAlert.map(t => t.code || t.name).join(', ')}</strong> cần được nhân viên hỗ trợ ngay.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'ALERT' ? 'ALL' : 'ALERT')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              background: statusFilter === 'ALERT' ? '#B45309' : '#D97706',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name="filter_list" size={16} />
            {statusFilter === 'ALERT' ? 'Hiển thị tất cả bàn' : 'Lọc riêng các bàn này'}
          </button>
        </div>
      )}

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
              <option value="ALL">Tất Cả Khu Vực ({tables.length})</option>
              {zonesList.map(z => {
                const count = tables.filter(t => t.zone === z.zoneCode).length;
                return (
                  <option key={z.id || z.zoneCode} value={z.zoneCode}>
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
              {tablesWithAlert.length > 0 && (
                <option value="ALERT" style={{ fontWeight: 800, color: '#D97706' }}>
                  🔔 Bàn cần hỗ trợ / Xin bill ({tablesWithAlert.length})
                </option>
              )}
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

            const hasAlert = (t.pendingServiceRequestCount && t.pendingServiceRequestCount > 0) || !!t.pendingServiceRequestId;
            const alertConfig = hasAlert ? getAlertDetails(t) : null;
            const isBillAlert = alertConfig?.isBill;

            let cardBorder = t.status === 'BLOCKED' ? '1.5px dashed #D1D5DB' : '1px solid #F0E6E4';
            let cardBoxShadow = '0 2px 8px rgba(0,0,0,0.03)';
            let cardAnimation = 'none';

            if (hasAlert) {
              if (isBillAlert) {
                cardBorder = '2px solid #8B5CF6';
                cardBoxShadow = '0 0 16px rgba(139, 92, 246, 0.4)';
                cardAnimation = 'romsPulseBill 2s infinite ease-in-out';
              } else {
                cardBorder = '2px solid #F59E0B';
                cardBoxShadow = '0 0 16px rgba(245, 158, 11, 0.4)';
                cardAnimation = 'romsPulseService 2s infinite ease-in-out';
              }
            }

            return (
              <div
                key={t.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: cardBorder,
                  padding: '16px',
                  boxShadow: cardBoxShadow,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  opacity: t.status === 'BLOCKED' ? 0.9 : 1,
                  animation: cardAnimation,
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

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
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
                      {getTableDwellBadge(t)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#89726B' }}>
                    <Icon name="location_on" size={14} />
                    <span>{t.zoneName}</span>
                  </div>
                </div>

                {/* Banner Chuông Báo Cần Hỗ Trợ / Yêu Cầu Thanh Toán */}
                {hasAlert && alertConfig && (
                  <div
                    style={{
                      background: alertConfig.badgeBg,
                      border: `1.5px solid ${alertConfig.badgeBorder}`,
                      borderRadius: '12px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: alertConfig.badgeColor,
                        flexShrink: 0,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                      }}>
                        <Icon name={alertConfig.icon} size={18} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          color: alertConfig.badgeColor,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>{alertConfig.title}</span>
                          {t.pendingServiceRequestCount > 1 && (
                            <span style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: '8px',
                              background: alertConfig.badgeColor,
                              color: '#FFFFFF'
                            }}>
                              +{t.pendingServiceRequestCount - 1}
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: '0.72rem',
                          color: '#4B5563',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: '1px'
                        }}>
                          {t.pendingServiceRequestNote
                            ? t.pendingServiceRequestNote
                            : (t.pendingServiceRequestElapsedMinutes > 0
                                ? `${t.pendingServiceRequestElapsedMinutes} phút trước`
                                : (t.pendingServiceRequestCreatedAt ? `Lúc ${t.pendingServiceRequestCreatedAt}` : 'Vừa gọi'))
                          }
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleResolveServiceRequest(t, e)}
                      title="Xác nhận đã xử lý xong yêu cầu này"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '5px 9px',
                        borderRadius: '8px',
                        background: alertConfig.btnBg,
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        flexShrink: 0,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Icon name="check" size={13} />
                      Đã xong
                    </button>
                  </div>
                )}

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

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(t)}
                      title="Chỉnh sửa thông tin bàn (Mã số, Tên bàn, Khu vực, Sức chứa)"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        background: '#FFF8F6',
                        border: '1px solid #EAE0DE',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#56423D',
                        cursor: 'pointer'
                      }}
                    >
                      <Icon name="edit" size={15} />
                      Sửa
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(t)}
                      title={t.status === 'OCCUPIED' ? 'Không thể xóa bàn đang có khách phục vụ' : 'Xóa bàn ăn khỏi sơ đồ'}
                      disabled={t.status === 'OCCUPIED'}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        background: t.status === 'OCCUPIED' ? '#F5F5F4' : '#FFDAD6',
                        border: t.status === 'OCCUPIED' ? '1px solid #E5E5E5' : '1px solid #FFB4AB',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: t.status === 'OCCUPIED' ? '#A8A29E' : '#BA1A1A',
                        cursor: t.status === 'OCCUPIED' ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Icon name="delete" size={15} />
                      Xóa
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    {t.status === 'BLOCKED' && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(t.id, 'AVAILABLE')}
                        title="Mở khóa bàn để sẵn sàng đón khách"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
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
                        <Icon name="lock_open" size={13} /> Mở Khóa
                      </button>
                    )}

                    {t.status === 'DIRTY' && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(t.id, 'AVAILABLE')}
                        title="Xác nhận bàn đã dọn dẹp sạch sẽ"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
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
                        <Icon name="cleaning_services" size={13} /> Đã Dọn
                      </button>
                    )}

                    {t.status === 'AVAILABLE' && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(t.id, 'OCCUPIED')}
                        title="Mở bàn phục vụ khách ngay"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: '#9D4124',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Icon name="restaurant" size={13} /> Phục Vụ
                      </button>
                    )}

                    {t.status === 'RESERVED' && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(t.id, 'OCCUPIED')}
                        title="Khách đến, nhận bàn và bắt đầu phục vụ"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: '#9D4124',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Icon name="check_circle" size={13} /> Nhận Bàn
                      </button>
                    )}

                    {t.status === 'OCCUPIED' && (
                      <button
                        type="button"
                        onClick={() => handleOpenOrderDrawer(t)}
                        title="Xem chi tiết các món và hóa đơn của bàn"
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

            {/* Nút Mở Thử Nghiệm Gọi Món Trực Tiếp Trên Máy Tính */}
            <a
              href={`/dining/welcome?table=${selectedQrTable.id}&token=${selectedQrTable.qrToken}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '11px',
                borderRadius: '12px',
                background: '#FDF7F5',
                border: '1.5px dashed #9D4124',
                color: '#9D4124',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none',
                marginTop: '12px',
                boxSizing: 'border-box',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon name="open_in_new" size={17} />
              Mở Thử Nghiệm Gọi Món (Tab Mới)
            </a>
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
                    {zonesList.map(z => (
                      <option key={z.id || z.zoneCode} value={z.zoneCode}>
                        {z.name}
                      </option>
                    ))}
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
                  min="1"
                  value={statusForm.guestsCount}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, guestsCount: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #F87171', background: '#FFFFFF', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.75rem', color: '#B91C1C' }}>
                  <Icon name="info" size={14} />
                  <span>Hệ thống sẽ tự động khởi tạo phiên phục vụ (Dining Session) đồng bộ cho Bồi bàn và POS.</span>
                </div>
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

      {/* MODAL 4: CHỈNH SỬA THÔNG TIN BÀN ĂN */}
      {showEditModal && editTableData && (
        <div style={{
          position: 'fixed',
          inset: 0,
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
                <Icon name="edit" size={24} style={{ color: '#9D4124' }} />
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                  Chỉnh Sửa Bàn {editTableData.code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F6ECEA', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateTable} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                  Mã Bàn (VD: T-01, VIP-04) <span style={{ color: '#BA1A1A' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập mã bàn..."
                  value={editFormData.code}
                  onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
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
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
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
                    value={editFormData.zone}
                    onChange={(e) => setEditFormData({ ...editFormData, zone: e.target.value })}
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
                    {zonesList.map(z => (
                      <option key={z.id || z.zoneCode} value={z.zoneCode}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                    Sức Chứa (Khách)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={editFormData.capacity}
                    onChange={(e) => setEditFormData({ ...editFormData, capacity: e.target.value })}
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
                  onClick={() => setShowEditModal(false)}
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
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(157, 65, 36, 0.3)'
                  }}
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: XÁC NHẬN XÓA BÀN ĂN */}
      {showDeleteModal && deletingTable && (
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
            maxWidth: '420px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#FFDAD6',
              color: '#BA1A1A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Icon name="warning" size={30} />
            </div>

            <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.3rem', color: '#1F1B1A', margin: '0 0 8px' }}>
              Xác Nhận Xóa Bàn?
            </h3>

            <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: '#56423D', lineHeight: 1.45 }}>
              Bạn có chắc chắn muốn xóa <strong>{deletingTable.code}</strong> ({deletingTable.name}) khỏi hệ thống nhà hàng không?
            </p>

            <div style={{
              background: '#FFF8F6',
              border: '1px solid #FFDBC9',
              borderRadius: '12px',
              padding: '12px 14px',
              textAlign: 'left',
              fontSize: '0.78rem',
              color: '#753400',
              marginBottom: '20px',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start'
            }}>
              <Icon name="info" size={18} style={{ color: '#BA1A1A', flexShrink: 0, marginTop: '1px' }} />
              <div>
                Bàn sẽ được ẩn khỏi sơ đồ phục vụ và mã QR sẽ bị vô hiệu hóa. Lịch sử hóa đơn cũ vẫn được bảo toàn trong báo cáo doanh thu.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingTable(null);
                }}
                disabled={deleteLoading}
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
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                style={{
                  flex: 1.5,
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#BA1A1A',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#FFFFFF',
                  cursor: deleteLoading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(186, 26, 26, 0.3)'
                }}
              >
                {deleteLoading ? (
                  <>
                    <Icon name="sync" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Icon name="delete" size={18} />
                    Xác Nhận Xóa
                  </>
                )}
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

      {/* MODAL 6: IN TEM BÀN MÃ QR TOÀN NHÀ HÀNG (KHỔ GIẤY A4) */}
      {showBatchQrModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '20px',
          overflowY: 'auto'
        }}>
          {/* Header thanh công cụ in ấn (ẩn khi in thực tế qua CSS no-print) */}
          <div className="no-print" style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '16px 24px',
            maxWidth: '1000px',
            width: '100%',
            marginBottom: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#FFDBC9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9D4124'
              }}>
                <Icon name="print" size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1F1B1A' }}>
                  Bản In Tem Mã QR Toàn Nhà Hàng (Chuẩn Khổ A4)
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#89726B' }}>
                  Đang hiển thị {batchFilteredTables.length} tem bàn • Sẵn sàng in hoặc Lưu dạng PDF
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Lọc theo khu vực */}
              <select
                value={batchFilterZone}
                onChange={(e) => setBatchFilterZone(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #EAE0DE',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#56423D',
                  background: '#FDF7F5',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">Tất Cả Khu Vực ({tables.length})</option>
                {zonesList.map(z => {
                  const count = tables.filter(t => t.zone === z.zoneCode).length;
                  return (
                    <option key={z.id || z.zoneCode} value={z.zoneCode}>
                      {z.name} ({count})
                    </option>
                  );
                })}
              </select>

              {/* Nút Kích hoạt In Ấn / Lưu PDF */}
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  background: '#9D4124',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(157,65,36,0.25)'
                }}
              >
                <Icon name="local_printshop" size={18} />
                In Ngay / Lưu PDF (A4)
              </button>

              {/* Nút Đóng */}
              <button
                type="button"
                onClick={() => setShowBatchQrModal(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: '#F6ECEA',
                  border: '1px solid #EAE0DE',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  color: '#56423D',
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>

          {/* Style tag điều khiển in ấn của trình duyệt */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #batch-qr-print-sheet, #batch-qr-print-sheet * {
                visibility: visible;
              }
              #batch-qr-print-sheet {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 10mm;
                background: #FFFFFF !important;
              }
              .no-print {
                display: none !important;
              }
              .qr-card-item {
                page-break-inside: avoid;
                break-inside: avoid;
              }
            }
          `}</style>

          {/* Vùng chứa tem in ấn (Khổ A4) */}
          <div
            id="batch-qr-print-sheet"
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '30px',
              maxWidth: '1000px',
              width: '100%',
              boxShadow: '0 12px 36px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {batchFilteredTables.map((t) => (
                <div
                  key={t.id}
                  className="qr-card-item"
                  style={{
                    border: '2px dashed #9D4124',
                    borderRadius: '18px',
                    padding: '18px 16px',
                    textAlign: 'center',
                    background: '#FFFFFF',
                    position: 'relative'
                  }}
                >
                  {/* Top Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#9D4124', background: '#FFDBC9', padding: '2px 8px', borderRadius: '6px' }}>
                      ROMS RESTAURANT
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#89726B' }}>
                      {t.zoneName}
                    </span>
                  </div>

                  {/* Mã bàn to nổi bật */}
                  <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontSize: '1.8rem', fontWeight: 900, color: '#1F1B1A', margin: '4px 0 2px' }}>
                    {t.code}
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: '#56423D', fontWeight: 600, marginBottom: '12px' }}>
                    {t.name} • {t.capacity} Chỗ ngồi
                  </div>

                  {/* Ảnh QR */}
                  <div style={{
                    background: '#FDF7F5',
                    padding: '12px',
                    borderRadius: '14px',
                    display: 'inline-block',
                    marginBottom: '8px'
                  }}>
                    <img
                      src={t.qrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=http://192.168.0.92:5173/dining/welcome?table=${t.id}%26token=${t.qrToken}`}
                      alt={`Mã QR ${t.code}`}
                      style={{ width: '170px', height: '170px', display: 'block', borderRadius: '8px' }}
                    />
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#89726B', marginTop: '4px', fontWeight: 600 }}>
                      Token: {t.qrToken}
                    </span>
                  </div>

                  {/* 3 Bước Hướng dẫn */}
                  <div style={{ fontSize: '0.72rem', color: '#56423D', lineHeight: 1.35, margin: '6px 0', textAlign: 'left', background: '#FAF6F5', padding: '8px 12px', borderRadius: '8px' }}>
                    <div><strong>1.</strong> Mở camera điện thoại quét mã QR</div>
                    <div><strong>2.</strong> Chọn món ăn & đồ uống yêu thích</div>
                    <div><strong>3.</strong> Bấm gửi đơn & nhân viên phục vụ tận bàn</div>
                  </div>

                  {/* Footer WiFi */}
                  <div style={{ fontSize: '0.68rem', color: '#89726B', fontWeight: 600, borderTop: '1px solid #F0E6E4', paddingTop: '6px', marginTop: '6px' }}>
                    📶 WiFi: <strong>dine2025</strong> | Mật khẩu: <strong>12345678</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QUẢN LÝ KHU VỰC (ZONE CRUD) */}
      {showZoneModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: zoneModalMode === 'LIST' ? '780px' : '520px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #F0E6E4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FFF8F6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#FFDBC9',
                  color: '#9D4124',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon name="domain" size={24} />
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1F1B1A', margin: 0 }}>
                    {zoneModalMode === 'LIST' ? 'Quản Lý Khu Vực Nhà Hàng' : (zoneModalMode === 'CREATE' ? 'Thêm Khu Vực Mới' : 'Chỉnh Sửa Khu Vực')}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#89726B' }}>
                    {zoneModalMode === 'LIST' ? `Hiện có ${zonesList.length} khu vực phân bổ bàn ăn` : (zoneModalMode === 'CREATE' ? 'Điền thông tin để tạo khu vực mới' : `Mã khu vực: ${zoneFormData.zoneCode}`)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (zoneModalMode !== 'LIST') {
                    setZoneModalMode('LIST');
                  } else {
                    setShowZoneModal(false);
                  }
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#89726B',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {zoneModalMode === 'LIST' ? (
                <div>
                  {/* Top bar của Tab List */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#56423D', fontWeight: 600 }}>
                      Danh sách các khu vực hiện tại:
                    </div>
                    <button
                      type="button"
                      onClick={handleStartCreateZone}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        background: '#9D4124',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Icon name="add" size={18} />
                      Thêm Khu Vực
                    </button>
                  </div>

                  {/* Bảng danh sách khu vực */}
                  <div style={{ border: '1px solid #F0E6E4', borderRadius: '14px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead style={{ background: '#FAF6F5', borderBottom: '1px solid #F0E6E4' }}>
                        <tr>
                          <th style={{ padding: '12px 16px', color: '#89726B', fontWeight: 700, fontSize: '0.78rem' }}>MÃ KHU VỰC</th>
                          <th style={{ padding: '12px 16px', color: '#89726B', fontWeight: 700, fontSize: '0.78rem' }}>TÊN KHU VỰC</th>
                          <th style={{ padding: '12px 16px', color: '#89726B', fontWeight: 700, fontSize: '0.78rem' }}>MÔ TẢ</th>
                          <th style={{ padding: '12px 16px', color: '#89726B', fontWeight: 700, fontSize: '0.78rem', textAlign: 'center' }}>SỐ BÀN</th>
                          <th style={{ padding: '12px 16px', color: '#89726B', fontWeight: 700, fontSize: '0.78rem', textAlign: 'center' }}>THỨ TỰ</th>
                          <th style={{ padding: '12px 16px', color: '#89726B', fontWeight: 700, fontSize: '0.78rem', textAlign: 'right' }}>THAO TÁC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {zonesList.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#89726B' }}>
                              Chưa có khu vực nào. Hãy nhấn "+ Thêm Khu Vực" để tạo!
                            </td>
                          </tr>
                        ) : (
                          zonesList.map(z => {
                            const count = tables.filter(t => t.zone === z.zoneCode).length;
                            return (
                              <tr key={z.id || z.zoneCode} style={{ borderBottom: '1px solid #F7EFEF' }}>
                                <td style={{ padding: '14px 16px' }}>
                                  <span style={{
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    background: '#FFDBC9',
                                    color: '#9D4124',
                                    padding: '3px 8px',
                                    borderRadius: '6px'
                                  }}>
                                    {z.zoneCode}
                                  </span>
                                </td>
                                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1F1B1A' }}>
                                  {z.name}
                                </td>
                                <td style={{ padding: '14px 16px', color: '#56423D', fontSize: '0.8rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {z.description || <span style={{ color: '#BAA8A4', fontStyle: 'italic' }}>Không có</span>}
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    background: count > 0 ? '#EAF5EA' : '#F5F5F5',
                                    color: count > 0 ? '#1E6B24' : '#89726B',
                                    fontWeight: 700,
                                    fontSize: '0.78rem'
                                  }}>
                                    {count} bàn
                                  </span>
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'center', color: '#89726B', fontWeight: 600 }}>
                                  {z.displayOrder || 0}
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditZone(z)}
                                      title="Chỉnh sửa khu vực"
                                      style={{
                                        border: '1px solid #EAE0DE',
                                        background: '#FFFFFF',
                                        padding: '6px',
                                        borderRadius: '8px',
                                        color: '#56423D',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}
                                    >
                                      <Icon name="edit" size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmDeleteZone(z)}
                                      title={count > 0 ? `Khu vực đang có ${count} bàn, không thể xóa trực tiếp` : 'Xóa khu vực'}
                                      style={{
                                        border: '1px solid #FFDAD6',
                                        background: count > 0 ? '#FBF2F2' : '#FFFFFF',
                                        padding: '6px',
                                        borderRadius: '8px',
                                        color: '#BA1A1A',
                                        cursor: 'pointer',
                                        opacity: count > 0 ? 0.6 : 1,
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}
                                    >
                                      <Icon name="delete" size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: '16px', fontSize: '0.78rem', color: '#89726B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="info" size={16} />
                    <span>Lưu ý: Khu vực đang có bàn ăn sẽ không thể xóa để đảm bảo an toàn dữ liệu.</span>
                  </div>
                </div>
              ) : (
                /* Form CREATE / EDIT */
                <form onSubmit={handleSaveZone}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                        Mã Khu Vực {zoneModalMode === 'CREATE' ? <span style={{ color: '#BA1A1A' }}>*</span> : '(Cố định)'}
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: ZONE_3, ROOFTOP, GARDEN"
                        value={zoneFormData.zoneCode}
                        onChange={(e) => setZoneFormData({ ...zoneFormData, zoneCode: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                        disabled={zoneModalMode === 'EDIT'}
                        required={zoneModalMode === 'CREATE'}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid #EAE0DE',
                          background: zoneModalMode === 'EDIT' ? '#F7EFEF' : '#FFFFFF',
                          color: zoneModalMode === 'EDIT' ? '#89726B' : '#1F1B1A',
                          fontSize: '0.88rem',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          outline: 'none'
                        }}
                      />
                      <span style={{ fontSize: '0.74rem', color: '#89726B', marginTop: '4px', display: 'block' }}>
                        {zoneModalMode === 'CREATE'
                          ? 'Mã định danh hệ thống (chữ hoa, viết liền hoặc gạch dưới, không dấu).'
                          : 'Mã khu vực không thể thay đổi sau khi tạo để đảm bảo liên kết dữ liệu bàn.'}
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                        Tên Khu Vực <span style={{ color: '#BA1A1A' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Tầng 3 - Sân Thượng, Vườn Ngoài Trời..."
                        value={zoneFormData.name}
                        onChange={(e) => setZoneFormData({ ...zoneFormData, name: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid #EAE0DE',
                          background: '#FFFFFF',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                        Mô Tả / Ghi Chú
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Mô tả không gian, đặc điểm vị trí..."
                        value={zoneFormData.description}
                        onChange={(e) => setZoneFormData({ ...zoneFormData, description: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid #EAE0DE',
                          background: '#FFFFFF',
                          fontSize: '0.85rem',
                          outline: 'none',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                        Thứ Tự Hiển Thị
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={99}
                        value={zoneFormData.displayOrder}
                        onChange={(e) => setZoneFormData({ ...zoneFormData, displayOrder: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid #EAE0DE',
                          background: '#FFFFFF',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                    <button
                      type="button"
                      onClick={() => setZoneModalMode('LIST')}
                      disabled={zoneActionLoading}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid #EAE0DE',
                        background: '#FFFFFF',
                        color: '#56423D',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      Hủy / Quay lại
                    </button>
                    <button
                      type="submit"
                      disabled={zoneActionLoading}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#9D4124',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        opacity: zoneActionLoading ? 0.7 : 1
                      }}
                    >
                      {zoneActionLoading ? 'Đang lưu...' : (zoneModalMode === 'CREATE' ? 'Tạo Khu Vực' : 'Lưu Thay Đổi')}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer (chỉ hiển thị khi LIST) */}
            {zoneModalMode === 'LIST' && (
              <div style={{
                padding: '14px 24px',
                borderTop: '1px solid #F0E6E4',
                background: '#FAF6F5',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => setShowZoneModal(false)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    border: '1px solid #EAE0DE',
                    background: '#FFFFFF',
                    color: '#56423D',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: XÁC NHẬN XÓA KHU VỰC */}
      {showDeleteZoneConfirm && deletingZone && (
        <div style={{
          position: 'fixed',
          inset: 0,
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
            maxWidth: '420px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#FFDAD6',
              color: '#BA1A1A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Icon name="warning" size={30} />
            </div>

            <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.3rem', color: '#1F1B1A', margin: '0 0 8px' }}>
              Xác Nhận Xóa Khu Vực?
            </h3>

            <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: '#56423D', lineHeight: 1.45 }}>
              Bạn có chắc chắn muốn xóa khu vực <strong>{deletingZone.name}</strong> ({deletingZone.zoneCode}) không?
            </p>

            {tables.filter(t => t.zone === deletingZone.zoneCode).length > 0 ? (
              <div style={{
                background: '#FFDAD6',
                border: '1px solid #BA1A1A',
                borderRadius: '12px',
                padding: '12px 14px',
                textAlign: 'left',
                fontSize: '0.8rem',
                color: '#410002',
                marginBottom: '20px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                <Icon name="error" size={18} style={{ color: '#BA1A1A', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Không thể xóa:</strong> Khu vực này đang có {tables.filter(t => t.zone === deletingZone.zoneCode).length} bàn ăn. Hãy chuyển hoặc xóa các bàn ăn đó trước khi xóa khu vực.
                </div>
              </div>
            ) : (
              <div style={{
                background: '#FFF8F6',
                border: '1px solid #FFDBC9',
                borderRadius: '12px',
                padding: '12px 14px',
                textAlign: 'left',
                fontSize: '0.78rem',
                color: '#753400',
                marginBottom: '20px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                <Icon name="info" size={18} style={{ color: '#BA1A1A', flexShrink: 0, marginTop: '1px' }} />
                <div>
                  Khu vực sẽ bị xóa vĩnh viễn khỏi hệ thống nhà hàng.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteZoneConfirm(false);
                  setDeletingZone(null);
                }}
                disabled={zoneActionLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #EAE0DE',
                  background: '#FFFFFF',
                  color: '#56423D',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleDeleteZone}
                disabled={zoneActionLoading || tables.filter(t => t.zone === deletingZone.zoneCode).length > 0}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#BA1A1A',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: (tables.filter(t => t.zone === deletingZone.zoneCode).length > 0) ? 'not-allowed' : 'pointer',
                  opacity: (zoneActionLoading || tables.filter(t => t.zone === deletingZone.zoneCode).length > 0) ? 0.5 : 1
                }}
              >
                {zoneActionLoading ? 'Đang xóa...' : 'Xác Nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 1: DUYỆT & QUẢN LÝ DANH SÁCH ĐẶT BÀN TRỰC TUYẾN             */}
      {/* ================================================================= */}
      {showReservationModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '1000px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #F0E6E4',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#FAF7F5'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#9D4124',
                    background: '#FFDBC9',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    ĐẶT BÀN TRƯỚC
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#89726B', fontWeight: 600 }}>
                    Tiếp Nhận & Điều Phối
                  </span>
                </div>
                <h2 style={{
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 900,
                  fontSize: '1.45rem',
                  color: '#1F1B1A',
                  margin: '4px 0 0'
                }}>
                  Phiếu Đặt Bàn & Điều Phối Xếp Bàn
                </h2>
                <p style={{ margin: '2px 0 0', color: '#56423D', fontSize: '0.85rem' }}>
                  Gọi điện xác nhận theo số điện thoại khách hàng, sau đó chọn bàn ăn trống để giữ chỗ trên sơ đồ.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowReservationModal(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  border: '1px solid #EAE0DE',
                  background: '#FFFFFF',
                  color: '#56423D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div style={{
              padding: '14px 24px',
              borderBottom: '1px solid #F0E6E4',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              background: '#FFFFFF'
            }}>
              {/* Status Filter Tabs */}
              <div style={{ display: 'flex', gap: '6px', background: '#F5EFEB', padding: '4px', borderRadius: '12px' }}>
                <button
                  type="button"
                  onClick={() => setResStatusFilter('PENDING')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    background: resStatusFilter === 'PENDING' ? '#9D4124' : 'transparent',
                    color: resStatusFilter === 'PENDING' ? '#FFFFFF' : '#56423D',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Chờ Xếp Bàn
                  {pendingReservationsCount > 0 && (
                    <span style={{
                      background: resStatusFilter === 'PENDING' ? '#FFFFFF' : '#EF4444',
                      color: resStatusFilter === 'PENDING' ? '#9D4124' : '#FFFFFF',
                      borderRadius: '999px',
                      padding: '1px 6px',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      {pendingReservationsCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setResStatusFilter('CONFIRMED')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    background: resStatusFilter === 'CONFIRMED' ? '#9D4124' : 'transparent',
                    color: resStatusFilter === 'CONFIRMED' ? '#FFFFFF' : '#56423D',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Đã Xếp Bàn
                </button>

                <button
                  type="button"
                  onClick={() => setResStatusFilter('CANCELLED')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    background: resStatusFilter === 'CANCELLED' ? '#9D4124' : 'transparent',
                    color: resStatusFilter === 'CANCELLED' ? '#FFFFFF' : '#56423D',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Đã Hủy
                </button>

                <button
                  type="button"
                  onClick={() => setResStatusFilter('ALL')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    background: resStatusFilter === 'ALL' ? '#9D4124' : 'transparent',
                    color: resStatusFilter === 'ALL' ? '#FFFFFF' : '#56423D',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Tất Cả ({reservations.length})
                </button>
              </div>

              {/* Search input & Refresh */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#F9F5F3',
                  border: '1px solid #EAE0DE',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  gap: '6px',
                  width: '260px'
                }}>
                  <Icon name="search" size={18} style={{ color: '#89726B' }} />
                  <input
                    type="text"
                    placeholder="Tìm tên, SĐT, mã đặt..."
                    value={resSearchTerm}
                    onChange={(e) => setResSearchTerm(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '0.82rem',
                      color: '#1F1B1A',
                      width: '100%'
                    }}
                  />
                  {resSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setResSearchTerm('')}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                    >
                      <Icon name="close" size={14} style={{ color: '#89726B' }} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={loadReservations}
                  title="Tải lại danh sách đặt bàn"
                  style={{
                    padding: '7px 12px',
                    borderRadius: '10px',
                    border: '1px solid #EAE0DE',
                    background: '#FFFFFF',
                    color: '#56423D',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 700,
                    fontSize: '0.82rem'
                  }}
                >
                  <Icon name="refresh" size={16} />
                  Làm mới
                </button>
              </div>
            </div>

            {/* Modal Body: Reservation Cards List */}
            <div style={{
              padding: '20px 24px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: '#FDFBF9'
            }}>
              {resLoading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#89726B' }}>
                  <Icon name="sync" size={32} style={{ animation: 'spin 1s linear infinite' }} />
                  <div style={{ marginTop: '10px', fontWeight: 600 }}>Đang tải danh sách đặt bàn...</div>
                </div>
              ) : (
                (() => {
                  const filtered = reservations.filter(r => {
                    if (resStatusFilter !== 'ALL' && r.status !== resStatusFilter) return false;
                    if (resSearchTerm.trim()) {
                      const q = resSearchTerm.trim().toLowerCase();
                      const codeMatch = (r.bookingCode || '').toLowerCase().includes(q);
                      const nameMatch = (r.customerName || '').toLowerCase().includes(q);
                      const phoneMatch = (r.customerPhone || '').toLowerCase().includes(q);
                      if (!codeMatch && !nameMatch && !phoneMatch) return false;
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div style={{
                        padding: '60px 20px',
                        textAlign: 'center',
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1px dashed #EAE0DE'
                      }}>
                        <div style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          background: '#F5EFEB',
                          color: '#89726B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 14px'
                        }}>
                          <Icon name="event_seat" size={32} />
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1F1B1A' }}>
                          Không có đơn đặt bàn nào
                        </div>
                        <div style={{ color: '#89726B', fontSize: '0.85rem', marginTop: '4px' }}>
                          {resStatusFilter === 'PENDING'
                            ? 'Hiện không có yêu cầu đặt bàn nào đang chờ duyệt xếp bàn.'
                            : 'Không tìm thấy phiếu đặt bàn phù hợp với bộ lọc hiện tại.'}
                        </div>
                      </div>
                    );
                  }

                  return filtered.map((r) => {
                    const isPending = r.status === 'PENDING';
                    const isConfirmed = r.status === 'CONFIRMED';
                    const isCancelled = r.status === 'CANCELLED';

                    return (
                      <div
                        key={r.id}
                        style={{
                          background: '#FFFFFF',
                          borderRadius: '16px',
                          border: isPending ? '1.5px solid #FCA5A5' : '1px solid #EAE0DE',
                          padding: '16px 20px',
                          boxShadow: isPending ? '0 4px 14px rgba(239, 68, 68, 0.08)' : '0 2px 6px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}
                      >
                        {/* Top bar: Code, Time created & Status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{
                              fontWeight: 900,
                              fontFamily: 'monospace',
                              fontSize: '0.92rem',
                              color: '#9D4124',
                              background: '#FFF5F0',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              border: '1px solid #FFDBC9'
                            }}>
                              {r.bookingCode}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#89726B' }}>
                              Tạo lúc: {r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : 'Mới gửi'}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {isPending && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#FEF3C7',
                                color: '#B45309',
                                border: '1px solid #FCD34D',
                                padding: '4px 10px',
                                borderRadius: '999px',
                                fontSize: '0.78rem',
                                fontWeight: 800
                              }}>
                                <Icon name="schedule" size={14} />
                                Chờ Xếp Bàn
                              </span>
                            )}
                            {isConfirmed && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#D1FAE5',
                                color: '#047857',
                                border: '1px solid #6EE7B7',
                                padding: '4px 10px',
                                borderRadius: '999px',
                                fontSize: '0.78rem',
                                fontWeight: 800
                              }}>
                                <Icon name="check_circle" size={14} />
                                Đã Giữ Chỗ
                              </span>
                            )}
                            {isCancelled && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#FEE2E2',
                                color: '#B91C1C',
                                border: '1px solid #FCA5A5',
                                padding: '4px 10px',
                                borderRadius: '999px',
                                fontSize: '0.78rem',
                                fontWeight: 800
                              }}>
                                <Icon name="cancel" size={14} />
                                Đã Hủy
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Customer & Booking Details */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                          gap: '12px',
                          background: '#FAF7F5',
                          padding: '12px 16px',
                          borderRadius: '12px'
                        }}>
                          {/* Col 1: Customer Info */}
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#89726B', fontWeight: 600 }}>KHÁCH HÀNG</div>
                            <div style={{ fontWeight: 800, color: '#1F1B1A', fontSize: '0.95rem', marginTop: '2px' }}>
                              {r.customerName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                              <Icon name="phone" size={14} style={{ color: '#047857' }} />
                              <span style={{
                                fontWeight: 700,
                                color: '#1F1B1A',
                                fontSize: '0.88rem'
                              }}>
                                {r.customerPhone}
                              </span>
                            </div>
                            {r.customerEmail && (
                              <div style={{ fontSize: '0.75rem', color: '#89726B', marginTop: '2px' }}>
                                {r.customerEmail}
                              </div>
                            )}
                          </div>

                          {/* Col 2: Date & Time */}
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#89726B', fontWeight: 600 }}>HẸN ĐẾN LÚC</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', fontWeight: 800, color: '#9D4124', fontSize: '1rem' }}>
                              <Icon name="schedule" size={18} />
                              {r.formattedTime || (r.reservationTime ? new Date(r.reservationTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '')}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontSize: '0.82rem', color: '#56423D', fontWeight: 600 }}>
                              <Icon name="calendar_today" size={14} />
                              {r.formattedDate || (r.reservationTime ? new Date(r.reservationTime).toLocaleDateString('vi-VN') : '')}
                            </div>
                          </div>

                          {/* Col 3: Guests & Zone */}
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#89726B', fontWeight: 600 }}>QUY MÔ & KHU VỰC</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', fontWeight: 800, color: '#1F1B1A', fontSize: '0.92rem' }}>
                              <Icon name="groups" size={16} style={{ color: '#9D4124' }} />
                              {r.guestCount} Khách
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontSize: '0.82rem', color: '#56423D' }}>
                              <Icon name="place" size={14} style={{ color: '#89726B' }} />
                              Yêu cầu: <strong>{r.requestedZoneName || r.requestedZone || 'Mặc định'}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Customer note if any */}
                        {r.note && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            background: '#FFFBEB',
                            border: '1px solid #FEF3C7',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            fontSize: '0.82rem',
                            color: '#92400E'
                          }}>
                            <Icon name="chat" size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <strong>Ghi chú của khách:</strong> {r.note}
                            </div>
                          </div>
                        )}

                        {/* Món Ăn Đặt Trước (Pre-order Dishes) */}
                        <div style={{
                          background: r.preOrderItems && r.preOrderItems.length > 0 ? '#FFF7ED' : '#FAF7F5',
                          border: r.preOrderItems && r.preOrderItems.length > 0 ? '1.5px solid #FFEDD5' : '1px dashed #EAE0DE',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <Icon name="restaurant_menu" size={18} style={{ color: r.preOrderItems && r.preOrderItems.length > 0 ? '#EA580C' : '#89726B' }} />
                              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: r.preOrderItems && r.preOrderItems.length > 0 ? '#9A3412' : '#56423D' }}>
                                Món Đặt Trước: {r.preOrderItems && r.preOrderItems.length > 0
                                  ? `${r.preOrderItems.length} món (${r.preOrderItemsCount || 0} phần)`
                                  : 'Chưa có món đặt trước'}
                              </span>
                              {r.preOrderTotal > 0 && (
                                <span style={{
                                  background: '#FFEDD5',
                                  color: '#C2410C',
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  fontWeight: 800,
                                  fontSize: '0.78rem'
                                }}>
                                  {Number(r.preOrderTotal).toLocaleString('vi-VN')} đ
                                </span>
                              )}
                            </div>

                            {/* Nút Xem / Sửa / Thêm món đặt trước */}
                            {!isCancelled && (
                              <button
                                type="button"
                                onClick={() => handleOpenPreOrderModal(r)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '5px 12px',
                                  borderRadius: '8px',
                                  border: r.preOrderItems && r.preOrderItems.length > 0 ? '1px solid #EA580C' : '1px solid #EAE0DE',
                                  background: '#FFFFFF',
                                  color: r.preOrderItems && r.preOrderItems.length > 0 ? '#EA580C' : '#56423D',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <Icon name={r.preOrderItems && r.preOrderItems.length > 0 ? "edit_note" : "add_circle"} size={15} />
                                {r.preOrderItems && r.preOrderItems.length > 0 ? "Kiểm tra & Sửa món" : "+ Thêm món đặt trước"}
                              </button>
                            )}
                          </div>

                          {/* Preview danh sách món nếu có */}
                          {r.preOrderItems && r.preOrderItems.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                              {r.preOrderItems.map((item, idx) => (
                                <span
                                  key={item.id || idx}
                                  style={{
                                    background: '#FFFFFF',
                                    border: '1px solid #FED7AA',
                                    borderRadius: '6px',
                                    padding: '4px 9px',
                                    fontSize: '0.78rem',
                                    color: '#7C2D12',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}
                                >
                                  <strong style={{ color: '#EA580C' }}>{item.quantity}x</strong> {item.menuItemName}
                                  {item.unitPrice && (
                                    <span style={{ color: '#9A3412', fontSize: '0.72rem' }}>
                                      ({Number(item.subtotal || item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ)
                                    </span>
                                  )}
                                  {item.note && (
                                    <span style={{ color: '#B45309', fontStyle: 'italic', fontSize: '0.72rem' }}>
                                      • {item.note}
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Confirmed Table Info */}
                        {isConfirmed && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px',
                            background: '#ECFDF5',
                            border: '1px solid #A7F3D0',
                            padding: '10px 14px',
                            borderRadius: '12px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: '#10B981',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Icon name="table_restaurant" size={18} />
                              </div>
                              <div>
                                <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700 }}>
                                  BÀN ĂN ĐÃ ĐƯỢC XẾP
                                </div>
                                <div style={{ fontWeight: 800, color: '#065F46', fontSize: '0.92rem' }}>
                                  {r.tableNumber || ('Bàn #' + r.tableId)} {r.tableName ? `(${r.tableName})` : ''} • Sức chứa: {r.tableCapacity || 4} chỗ
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(r)}
                              title="Đổi sang bàn ăn khác"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1px solid #059669',
                                background: '#FFFFFF',
                                color: '#059669',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                cursor: 'pointer'
                              }}
                            >
                              <Icon name="sync" size={14} />
                              Đổi Bàn
                            </button>
                          </div>
                        )}

                        {/* Cancel reason if cancelled */}
                        {isCancelled && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#FEF2F2',
                            border: '1px solid #FCA5A5',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            fontSize: '0.82rem',
                            color: '#991B1B'
                          }}>
                            <Icon name="info" size={16} />
                            <div>
                              <strong>Lý do hủy:</strong> {r.cancelReason || 'Không có lý do cụ thể'}
                            </div>
                          </div>
                        )}

                        {/* Actions for Pending Requests */}
                        {isPending && (
                          <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            gap: '10px',
                            paddingTop: '6px',
                            borderTop: '1px solid #F0E6E4'
                          }}>
                            <button
                              type="button"
                              onClick={() => handleOpenCancelResModal(r)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: '10px',
                                border: '1px solid #EAE0DE',
                                background: '#FFFFFF',
                                color: '#BA1A1A',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                cursor: 'pointer'
                              }}
                            >
                              <Icon name="close" size={16} />
                              Từ Chối / Hủy
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(r)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 18px',
                                borderRadius: '10px',
                                border: 'none',
                                background: '#9D4124',
                                color: '#FFFFFF',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(157, 65, 36, 0.25)'
                              }}
                            >
                              <Icon name="table_restaurant" size={18} />
                              Set Bàn / Xếp Bàn Cho Khách
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #F0E6E4',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#FAF7F5'
            }}>
              <span style={{ fontSize: '0.82rem', color: '#89726B' }}>
                Tổng cộng: <strong>{reservations.length}</strong> phiếu đặt • Đang chờ xếp bàn: <strong style={{ color: '#EF4444' }}>{pendingReservationsCount}</strong>
              </span>

              <button
                type="button"
                onClick={() => setShowReservationModal(false)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  border: '1px solid #EAE0DE',
                  background: '#FFFFFF',
                  color: '#56423D',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: GỢI Ý & CHỌN BÀN ĂN KHẢ DỤNG ĐỂ GÁN (ASSIGN TABLE MODAL) */}
      {/* ================================================================= */}
      {showAssignModal && selectedResForAssign && (
        <div style={{
          position: 'fixed',
          inset: 0,
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
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #F0E6E4',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#FAF7F5'
            }}>
              <div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#9D4124',
                  background: '#FFDBC9',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  ĐIỀU PHỐI BÀN ĂN
                </span>
                <h3 style={{
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 900,
                  fontSize: '1.35rem',
                  color: '#1F1B1A',
                  margin: '4px 0 0'
                }}>
                  Xếp Bàn Cho Khách: {selectedResForAssign.customerName}
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#89726B', marginTop: '2px' }}>
                  Đơn: {selectedResForAssign.bookingCode} • SĐT: {selectedResForAssign.customerPhone}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedResForAssign(null);
                }}
                disabled={assignLoading}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  border: '1px solid #EAE0DE',
                  background: '#FFFFFF',
                  color: '#56423D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{
              padding: '20px 24px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Customer Requirement Summary */}
              <div style={{
                background: '#FFF5F0',
                border: '1px solid #FFDBC9',
                borderRadius: '14px',
                padding: '14px 18px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                fontSize: '0.85rem'
              }}>
                <div>
                  <div style={{ color: '#89726B', fontSize: '0.75rem', fontWeight: 600 }}>GIỜ HẸN & NGÀY</div>
                  <div style={{ fontWeight: 800, color: '#9D4124', marginTop: '2px' }}>
                    {selectedResForAssign.formattedTime || '19:00'} ngày {selectedResForAssign.formattedDate || 'Hôm nay'}
                  </div>
                </div>

                <div>
                  <div style={{ color: '#89726B', fontSize: '0.75rem', fontWeight: 600 }}>SỐ LƯỢNG KHÁCH</div>
                  <div style={{ fontWeight: 800, color: '#1F1B1A', marginTop: '2px' }}>
                    {selectedResForAssign.guestCount} Khách
                  </div>
                </div>

                <div>
                  <div style={{ color: '#89726B', fontSize: '0.75rem', fontWeight: 600 }}>KHU VỰC MONG MUỐN</div>
                  <div style={{ fontWeight: 800, color: '#1F1B1A', marginTop: '2px' }}>
                    {selectedResForAssign.requestedZoneName || selectedResForAssign.requestedZone || 'Mặc định'}
                  </div>
                </div>
              </div>

              {/* Table Selector with Zone Filter Dropdown */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginBottom: '10px'
                }}>
                  <label style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1F1B1A' }}>
                    Chọn Bàn Trống (AVAILABLE) Để Gán Cho Đơn Này:
                  </label>

                  {/* Dropdown Lọc Bàn Theo Phân Khu */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#89726B', fontWeight: 600 }}>Lọc theo khu vực:</span>
                    <select
                      value={assignZoneFilter}
                      onChange={(e) => setAssignZoneFilter(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #EAE0DE',
                        background: '#FFFFFF',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#1F1B1A',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="ALL">Tất Cả Khu Vực ({availableTablesForAssign.length} bàn trống)</option>
                      {zonesList.map(z => {
                        const count = availableTablesForAssign.filter(t => t.zone === z.zoneCode).length;
                        return (
                          <option key={z.zoneCode} value={z.zoneCode}>
                            {z.name} ({count} bàn trống)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {assignLoading && availableTablesForAssign.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#89726B' }}>
                    <Icon name="sync" size={24} style={{ animation: 'spin 1s linear infinite' }} />
                    <div style={{ marginTop: '6px', fontSize: '0.85rem' }}>Đang tìm kiếm bàn trống khả dụng...</div>
                  </div>
                ) : availableTablesForAssign.length === 0 ? (
                  <div style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#991B1B',
                    fontSize: '0.85rem',
                    textAlign: 'center'
                  }}>
                    <Icon name="warning" size={24} style={{ marginBottom: '6px' }} />
                    <div style={{ fontWeight: 800 }}>Hiện không có bàn trống nào trong hệ thống!</div>
                    <div style={{ marginTop: '4px', fontSize: '0.8rem' }}>
                      Vui lòng thanh toán hoặc giải phóng bàn ăn trên sơ đồ trước khi xếp bàn cho khách.
                    </div>
                  </div>
                ) : (
                  (() => {
                    const filteredTables = availableTablesForAssign.filter(tbl => {
                      if (assignZoneFilter !== 'ALL' && tbl.zone !== assignZoneFilter) return false;
                      return true;
                    });

                    if (filteredTables.length === 0) {
                      return (
                        <div style={{
                          padding: '24px',
                          textAlign: 'center',
                          background: '#FAF7F5',
                          borderRadius: '12px',
                          border: '1px dashed #EAE0DE',
                          color: '#89726B',
                          fontSize: '0.85rem'
                        }}>
                          Khu vực này hiện không còn bàn trống nào. Quản lý có thể chọn khu vực khác hoặc 'Tất Cả Khu Vực'.
                        </div>
                      );
                    }

                    return (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '10px',
                        maxHeight: '260px',
                        overflowY: 'auto',
                        padding: '4px'
                      }}>
                        {filteredTables.map((tbl) => {
                          const isSelected = String(tbl.id) === String(selectedAssignTableId);
                          const isRequestedZone = tbl.zone === selectedResForAssign.requestedZone;
                          const isEnoughCapacity = tbl.capacity >= selectedResForAssign.guestCount;

                          return (
                            <div
                              key={tbl.id}
                              onClick={() => setSelectedAssignTableId(String(tbl.id))}
                              style={{
                                padding: '12px 14px',
                                borderRadius: '12px',
                                border: isSelected ? '2px solid #9D4124' : '1px solid #EAE0DE',
                                background: isSelected ? '#FFF7ED' : '#FFFFFF',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                position: 'relative',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{
                                  fontWeight: 900,
                                  fontSize: '0.95rem',
                                  color: isSelected ? '#9D4124' : '#1F1B1A'
                                }}>
                                  {tbl.code || tbl.tableNumber}
                                </span>
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  background: isEnoughCapacity ? '#ECFDF5' : '#FEF3C7',
                                  color: isEnoughCapacity ? '#047857' : '#B45309',
                                  padding: '2px 6px',
                                  borderRadius: '4px'
                                }}>
                                  {tbl.capacity} chỗ
                                </span>
                              </div>

                              <div style={{ fontSize: '0.78rem', color: '#56423D', fontWeight: 600 }}>
                                {tbl.name || `Bàn ${tbl.code}`}
                              </div>

                              <div style={{ fontSize: '0.72rem', color: '#89726B' }}>
                                Khu vực: {tbl.zoneName || tbl.zone}
                              </div>

                              {isRequestedZone && (
                                <div style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  color: '#047857',
                                  marginTop: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px'
                                }}>
                                  <Icon name="check" size={12} />
                                  Đúng khu vực yêu cầu
                                </div>
                              )}

                              {isSelected && (
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '50%',
                                  background: '#9D4124',
                                  color: '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <Icon name="check" size={12} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Admin note */}
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#1F1B1A', marginBottom: '6px' }}>
                  Ghi Chú Của Quản Lý (Tùy chọn):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đã gọi điện xác nhận, khách nhờ chuẩn bị ghế em bé..."
                  value={assignAdminNote}
                  onChange={(e) => setAssignAdminNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #EAE0DE',
                    fontSize: '0.85rem',
                    color: '#1F1B1A',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #F0E6E4',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '10px',
              background: '#FAF7F5'
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedResForAssign(null);
                }}
                disabled={assignLoading}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: '1px solid #EAE0DE',
                  background: '#FFFFFF',
                  color: '#56423D',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmAssignTable}
                disabled={assignLoading || !selectedAssignTableId}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#9D4124',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: (assignLoading || !selectedAssignTableId) ? 'not-allowed' : 'pointer',
                  opacity: (assignLoading || !selectedAssignTableId) ? 0.6 : 1,
                  boxShadow: '0 4px 12px rgba(157, 65, 36, 0.25)'
                }}
              >
                <Icon name="check_circle" size={18} />
                {assignLoading ? 'Đang Xếp Bàn...' : 'Xác Nhận Xếp Bàn & Giữ Chỗ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3: XÁC NHẬN HỦY ĐƠN ĐẶT BÀN                                 */}
      {/* ================================================================= */}
      {showCancelResModal && selectedResForCancel && (
        <div style={{
          position: 'fixed',
          inset: 0,
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
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#FFDAD6',
              color: '#BA1A1A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px'
            }}>
              <Icon name="cancel" size={28} />
            </div>

            <h3 style={{
              fontFamily: "'Epilogue', sans-serif",
              fontWeight: 900,
              fontSize: '1.25rem',
              color: '#1F1B1A',
              margin: '0 0 6px',
              textAlign: 'center'
            }}>
              Xác Nhận Hủy Đặt Bàn?
            </h3>

            <p style={{
              margin: '0 0 16px',
              fontSize: '0.85rem',
              color: '#56423D',
              textAlign: 'center',
              lineHeight: 1.45
            }}>
              Hủy đơn đặt bàn của khách <strong>{selectedResForCancel.customerName}</strong> ({selectedResForCancel.bookingCode})? Bàn ăn đã gán (nếu có) sẽ được giải phóng về trạng thái trống.
            </p>

            {/* Quick Reason Selector */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#1F1B1A', marginBottom: '6px' }}>
                Lý Do Hủy Đặt Bàn:
              </label>

              <select
                value={cancelResReason}
                onChange={(e) => setCancelResReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #EAE0DE',
                  fontSize: '0.85rem',
                  color: '#1F1B1A',
                  background: '#FFFFFF',
                  marginBottom: '8px'
                }}
              >
                <option value="Khách hàng yêu cầu hủy / Không liên lạc được">Khách hàng yêu cầu hủy / Không liên lạc được</option>
                <option value="Gọi điện nhiều lần khách không nhấc máy">Gọi điện nhiều lần khách không nhấc máy</option>
                <option value="Nhà hàng đã hết bàn trống vào khung giờ hẹn">Nhà hàng đã hết bàn trống vào khung giờ hẹn</option>
                <option value="Khách đặt trùng lặp đơn khác">Khách đặt trùng lặp đơn khác</option>
                <option value="Khác">Lý do khác...</option>
              </select>

              {cancelResReason === 'Khác' && (
                <input
                  type="text"
                  placeholder="Nhập lý do cụ thể..."
                  onChange={(e) => setCancelResReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #EAE0DE',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowCancelResModal(false);
                  setSelectedResForCancel(null);
                }}
                disabled={cancelResLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #EAE0DE',
                  background: '#FFFFFF',
                  color: '#56423D',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Quay Lại
              </button>

              <button
                type="button"
                onClick={handleConfirmCancelRes}
                disabled={cancelResLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#BA1A1A',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: cancelResLoading ? 'not-allowed' : 'pointer',
                  opacity: cancelResLoading ? 0.6 : 1
                }}
              >
                {cancelResLoading ? 'Đang Hủy...' : 'Xác Nhận Hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 4: KIỂM TRA & ĐIỀU CHỈNH MÓN ĐẶT TRƯỚC (PRE-ORDER DISHES)    */}
      {/* ================================================================= */}
      {showPreOrderModal && selectedResForPreOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '1050px',
            width: '100%',
            height: 'min(90vh, 820px)',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #F0E6E4',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#FAF7F5',
              flexShrink: 0
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#C2410C',
                    background: '#FFEDD5',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    MÓN ĐẶT TRƯỚC
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#89726B', fontWeight: 600 }}>
                    Mã đơn: <strong style={{ color: '#9D4124', fontFamily: 'monospace' }}>{selectedResForPreOrder.bookingCode}</strong>
                  </span>
                </div>
                <h2 style={{
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 900,
                  fontSize: '1.35rem',
                  color: '#1F1B1A',
                  margin: '4px 0 0'
                }}>
                  Kiểm Tra & Điều Chỉnh Món Đặt Trước
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '4px', fontSize: '0.82rem', color: '#56423D' }}>
                  <span>Khách: <strong>{selectedResForPreOrder.customerName}</strong> ({selectedResForPreOrder.customerPhone})</span>
                  <span>•</span>
                  <span>Hẹn đến: <strong>{selectedResForPreOrder.formattedTime}</strong> ngày <strong>{selectedResForPreOrder.formattedDate}</strong></span>
                  <span>•</span>
                  <span>Quy mô: <strong>{selectedResForPreOrder.guestCount}</strong> khách ({selectedResForPreOrder.requestedZoneName || selectedResForPreOrder.requestedZone || 'Mặc định'})</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPreOrderModal(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  border: '1px solid #EAE0DE',
                  background: '#FFFFFF',
                  color: '#56423D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Modal Body: Split 2 columns (Left: Selected pre-orders, Right: Menu Catalog to add) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.1fr 1fr',
              flex: 1,
              minHeight: 0,
              height: '100%',
              overflow: 'hidden',
              background: '#FFFFFF'
            }}>
              {/* CỘT TRÁI: DANH SÁCH MÓN ĐÃ ĐẶT TRƯỚC */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                height: '100%',
                overflow: 'hidden',
                borderRight: '1px solid #F0E6E4',
                background: '#FAF7F5'
              }}>
                <div style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid #F0E6E4',
                  background: '#FFFFFF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0
                }}>
                  <div style={{ fontWeight: 800, color: '#1F1B1A', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="receipt_long" size={18} style={{ color: '#EA580C' }} />
                    Danh Sách Món Của Bàn ({editingPreOrderItems.length})
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#89726B' }}>
                    Tổng: <strong>{editingPreOrderItems.reduce((s, i) => s + (i.quantity || 0), 0)}</strong> phần
                  </span>
                </div>

                {/* List items scrollable */}
                <div style={{
                  padding: '16px 20px',
                  overflowY: 'auto',
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  overscrollBehavior: 'contain',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#D4C4BF #FAF7F5'
                }}>
                  {editingPreOrderItems.length === 0 ? (
                    <div style={{
                      padding: '40px 16px',
                      textAlign: 'center',
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px dashed #EAE0DE',
                      color: '#89726B'
                    }}>
                      <Icon name="restaurant" size={32} style={{ color: '#D4C4BF', marginBottom: '8px' }} />
                      <div style={{ fontWeight: 700, color: '#56423D', fontSize: '0.92rem' }}>Chưa có món đặt trước</div>
                      <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                        Chọn món từ thực đơn bên phải để thêm món cho khách hàng này.
                      </div>
                    </div>
                  ) : (
                    editingPreOrderItems.map((item, index) => {
                      const lineTotal = (item.unitPrice || 0) * (item.quantity || 1);
                      return (
                        <div
                          key={item.menuItemId || index}
                          style={{
                            background: '#FFFFFF',
                            borderRadius: '14px',
                            border: '1px solid #EAE0DE',
                            padding: '12px 14px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.menuItemName}
                                  style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                                />
                              ) : (
                                <div style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '8px',
                                  background: '#FFF5F0',
                                  color: '#EA580C',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <Icon name="dinner_dining" size={22} />
                                </div>
                              )}
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{
                                  fontWeight: 800,
                                  color: '#1F1B1A',
                                  fontSize: '0.88rem',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {item.menuItemName}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#89726B', marginTop: '2px' }}>
                                  {item.categoryName ? `${item.categoryName} • ` : ''}
                                  <span style={{ color: '#EA580C', fontWeight: 700 }}>
                                    {Number(item.unitPrice).toLocaleString('vi-VN')} đ/phần
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Line total & Delete button */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, color: '#9D4124', fontSize: '0.9rem' }}>
                                {Number(lineTotal).toLocaleString('vi-VN')} đ
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemovePreOrderItem(index)}
                                title="Xóa món này khỏi đơn đặt trước"
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: '#FEE2E2',
                                  color: '#DC2626',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <Icon name="delete" size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Quantity stepper & Dish note */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            background: '#FAF7F5',
                            padding: '6px 10px',
                            borderRadius: '8px'
                          }}>
                            {/* Quantity stepper */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.75rem', color: '#89726B', fontWeight: 600 }}>SL:</span>
                              <button
                                type="button"
                                onClick={() => handleUpdatePreOrderItemQty(index, -1)}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '6px',
                                  border: '1px solid #EAE0DE',
                                  background: '#FFFFFF',
                                  color: '#56423D',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontWeight: 800
                                }}
                              >
                                -
                              </button>
                              <span style={{
                                minWidth: '24px',
                                textAlign: 'center',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                color: '#1F1B1A'
                              }}>
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdatePreOrderItemQty(index, 1)}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '6px',
                                  border: '1px solid #EAE0DE',
                                  background: '#FFFFFF',
                                  color: '#56423D',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontWeight: 800
                                }}
                              >
                                +
                              </button>
                            </div>

                            {/* Note input */}
                            <input
                              type="text"
                              placeholder="Ghi chú món: ít cay, ăn trước..."
                              value={item.note || ''}
                              onChange={(e) => handleUpdatePreOrderItemNote(index, e.target.value)}
                              style={{
                                flex: 1,
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #EAE0DE',
                                fontSize: '0.78rem',
                                outline: 'none',
                                background: '#FFFFFF',
                                color: '#1F1B1A'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Subtotal bill summary */}
                <div style={{
                  padding: '14px 20px',
                  background: '#FFFFFF',
                  borderTop: '1px solid #F0E6E4',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0
                }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#89726B' }}>TỔNG TIỀN MÓN ĐẶT TRƯỚC</div>
                    <div style={{ fontSize: '0.75rem', color: '#56423D' }}>
                      (Chưa gồm VAT / Dịch vụ tại bàn)
                    </div>
                  </div>
                  <div style={{
                    fontWeight: 900,
                    fontSize: '1.25rem',
                    color: '#9D4124',
                    fontFamily: "'Epilogue', sans-serif"
                  }}>
                    {Number(editingPreOrderItems.reduce((s, i) => s + ((i.unitPrice || 0) * (i.quantity || 1)), 0)).toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: TRA CỨU & CHỌN MÓN TỪ THỰC ĐƠN NHÀ HÀNG */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                height: '100%',
                overflow: 'hidden',
                background: '#FFFFFF'
              }}>
                <div style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid #F0E6E4',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, color: '#1F1B1A', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="menu_book" size={18} style={{ color: '#047857' }} />
                      Thực Đơn Nhà Hàng
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#89726B' }}>
                      {menuCatalog.length} món sẵn sàng
                    </span>
                  </div>

                  {/* Filter & Search Bar */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#F9F5F3',
                      border: '1px solid #EAE0DE',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      gap: '6px',
                      flex: 1
                    }}>
                      <Icon name="search" size={16} style={{ color: '#89726B' }} />
                      <input
                        type="text"
                        placeholder="Tìm món ăn, đồ uống..."
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          outline: 'none',
                          fontSize: '0.8rem',
                          color: '#1F1B1A',
                          width: '100%'
                        }}
                      />
                      {catalogSearch && (
                        <button
                          type="button"
                          onClick={() => setCatalogSearch('')}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                        >
                          <Icon name="close" size={12} style={{ color: '#89726B' }} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  {(() => {
                    const uniqueCats = ['ALL', ...new Set(menuCatalog.map(d => d.categoryName).filter(Boolean))];
                    if (uniqueCats.length <= 1) return null;
                    return (
                      <div style={{
                        display: 'flex',
                        gap: '6px',
                        overflowX: 'auto',
                        paddingBottom: '2px',
                        scrollbarWidth: 'none'
                      }}>
                        {uniqueCats.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCatalogCatFilter(cat)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              background: catalogCatFilter === cat ? '#9D4124' : '#F5EFEB',
                              color: catalogCatFilter === cat ? '#FFFFFF' : '#56423D',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {cat === 'ALL' ? 'Tất Cả' : cat}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Dishes list from catalog */}
                <div style={{
                  padding: '16px 20px',
                  overflowY: 'auto',
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  overscrollBehavior: 'contain',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#D4C4BF #FFFFFF'
                }}>
                  {menuCatalogLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#89726B' }}>
                      <Icon name="sync" size={24} style={{ animation: 'spin 1s linear infinite' }} />
                      <div style={{ marginTop: '8px', fontSize: '0.82rem' }}>Đang tải thực đơn...</div>
                    </div>
                  ) : (
                    (() => {
                      const filteredDishes = menuCatalog.filter(d => {
                        if (catalogCatFilter !== 'ALL' && d.categoryName !== catalogCatFilter) return false;
                        if (!catalogSearch.trim()) return true;
                        const q = catalogSearch.trim().toLowerCase();
                        return (d.name || '').toLowerCase().includes(q) ||
                               (d.sku || '').toLowerCase().includes(q) ||
                               (d.categoryName || '').toLowerCase().includes(q);
                      });

                      if (filteredDishes.length === 0) {
                        return (
                          <div style={{ padding: '40px 16px', textAlign: 'center', color: '#89726B', fontSize: '0.82rem' }}>
                            Không tìm thấy món nào phù hợp với bộ lọc hiện tại.
                          </div>
                        );
                      }

                      return filteredDishes.map(dish => {
                        const inOrder = editingPreOrderItems.find(i => i.menuItemId === dish.id);
                        return (
                          <div
                            key={dish.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 12px',
                              borderRadius: '12px',
                              border: inOrder ? '1px solid #FED7AA' : '1px solid #F0E6E4',
                              background: inOrder ? '#FFFDFB' : '#FFFFFF',
                              gap: '10px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                              {dish.imageUrl ? (
                                <img
                                  src={dish.imageUrl}
                                  alt={dish.name}
                                  style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                                />
                              ) : (
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '8px',
                                  background: '#F5EFEB',
                                  color: '#89726B',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <Icon name="lunch_dining" size={20} />
                                </div>
                              )}
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                  color: '#1F1B1A',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {dish.name}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: '#89726B', marginTop: '2px' }}>
                                  <span style={{ fontWeight: 700, color: '#EA580C' }}>
                                    {Number(dish.price).toLocaleString('vi-VN')} đ
                                  </span>
                                  {dish.categoryName && ` • ${dish.categoryName}`}
                                </div>
                              </div>
                            </div>

                            {/* Button Add / Increase */}
                            <button
                              type="button"
                              onClick={() => handleAddDishToPreOrder(dish)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: inOrder ? '#EA580C' : '#9D4124',
                                color: '#FFFFFF',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                flexShrink: 0,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Icon name={inOrder ? "add" : "add_shopping_cart"} size={14} />
                              {inOrder ? `Thêm (${inOrder.quantity})` : 'Chọn Món'}
                            </button>
                          </div>
                        );
                      });
                    })()
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #F0E6E4',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#FAF7F5',
              flexShrink: 0
            }}>
              <span style={{ fontSize: '0.82rem', color: '#56423D' }}>
                Đã chọn: <strong>{editingPreOrderItems.length}</strong> món (<strong>{editingPreOrderItems.reduce((s, i) => s + (i.quantity || 0), 0)}</strong> phần)
              </span>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowPreOrderModal(false)}
                  disabled={savePreOrderLoading}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    border: '1px solid #EAE0DE',
                    background: '#FFFFFF',
                    color: '#56423D',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>

                <button
                  type="button"
                  onClick={handleSavePreOrderItems}
                  disabled={savePreOrderLoading}
                  style={{
                    padding: '9px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#9D4124',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: savePreOrderLoading ? 'not-allowed' : 'pointer',
                    opacity: savePreOrderLoading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(157, 65, 36, 0.25)'
                  }}
                >
                  <Icon name={savePreOrderLoading ? "sync" : "save"} size={16} style={savePreOrderLoading ? { animation: 'spin 1s linear infinite' } : {}} />
                  {savePreOrderLoading ? 'Đang Lưu...' : 'Lưu Thay Đổi Món Đặt Trước'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
