import React, { useState, useEffect, useCallback } from 'react';
import { staffApi } from '../../api/staffApi';
import { useDialog } from '../../context/DialogContext';

import Icon from '../../components/common/Icon';

// Helper tính toán ngày theo múi giờ địa phương chuẩn định dạng YYYY-MM-DD
const getLocalDateString = (offsetDays = 0, baseDateStr = null) => {
  let d;
  if (baseDateStr) {
    const parts = String(baseDateStr).split('-');
    if (parts.length === 3) {
      d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      d = new Date(baseDateStr);
    }
  } else {
    d = new Date();
  }
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper format hiển thị ngày tiếng Việt
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Helper tính toán khoảng ngày của tuần (Thứ Hai -> Chủ Nhật)
const getWeekRange = (baseDateStr = null) => {
  let d;
  if (baseDateStr) {
    const parts = String(baseDateStr).split('-');
    if (parts.length === 3) {
      d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      d = new Date(baseDateStr);
    }
  } else {
    d = new Date();
  }

  const day = d.getDay(); // 0: Chủ Nhật, 1: Thứ Hai, ..., 6: Thứ Bảy
  const diffToMon = day === 0 ? -6 : 1 - day;

  const mon = new Date(d);
  mon.setDate(d.getDate() + diffToMon);

  const days = [];
  const dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
  for (let i = 0; i < 7; i++) {
    const curr = new Date(mon);
    curr.setDate(mon.getDate() + i);
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const dt = String(curr.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${dt}`;
    days.push({
      dateStr,
      dayLabel: dayNames[i],
      shortLabel: i === 6 ? 'CN' : `T${i + 2}`,
      displayDate: `${dt}/${m}`,
      dayOfMonth: dt,
      month: m,
      year: y
    });
  }

  return {
    startDate: days[0].dateStr,
    endDate: days[6].dateStr,
    startDisplay: `${days[0].dayOfMonth}/${days[0].month}/${days[0].year}`,
    endDisplay: `${days[6].dayOfMonth}/${days[6].month}/${days[6].year}`,
    days
  };
};

// Helper config màu và chữ viết tắt avatar
const getAvatarConfig = (staff) => {
  const name = staff?.fullName || staff?.name || '';
  const username = staff?.username || staff?.empCode || '';
  const initials = name
    ? name.split(' ').filter(Boolean).map(w => w[0]).slice(-2).join('').toUpperCase()
    : (username ? username.slice(0, 2).toUpperCase() : 'NV');

  switch (staff?.role) {
    case 'MANAGER':
      return { initials, bg: '#9D4124', color: '#FFFFFF' };
    case 'CASHIER':
      return { initials, bg: '#FFDBC9', color: '#753400' };
    case 'WAITER':
      return { initials, bg: '#DDE8AB', color: '#181E00' };
    case 'KITCHEN':
      return { initials, bg: '#FFDAD6', color: '#93000A' };
    default:
      return { initials, bg: '#EAE0DE', color: '#56423D' };
  }
};

// Cấu hình 4 nhóm vai trò chuyên trách trong nhà hàng
const SHIFT_ROLES = [
  {
    key: 'MANAGER',
    label: 'Quản Lý (Manager)',
    shortLabel: 'Quản lý',
    icon: 'manage_accounts',
    color: '#9D4124',
    bg: '#FCF1EF',
    borderColor: '#F0E6E4'
  },
  {
    key: 'CASHIER',
    label: 'Thu Ngân (Cashier)',
    shortLabel: 'Thu ngân',
    icon: 'point_of_sale',
    color: '#753400',
    bg: '#FFF3E0',
    borderColor: '#FFE0B2'
  },
  {
    key: 'WAITER',
    label: 'Phục Vụ Bàn (Waiter)',
    shortLabel: 'Phục vụ',
    icon: 'table_restaurant',
    color: '#181E00',
    bg: '#F1F8E9',
    borderColor: '#DCEDC8'
  },
  {
    key: 'KITCHEN',
    label: 'Bếp & KDS (Kitchen)',
    shortLabel: 'Đầu bếp/KDS',
    icon: 'skillet',
    color: '#93000A',
    bg: '#FFEBEE',
    borderColor: '#FFCDD2'
  }
];

export default function StaffManagementPage() {
  const [activeTab, setActiveTab] = useState('SCHEDULE'); // 'SCHEDULE' | 'ROSTER'

  // Data states from Backend API
  const [staffList, setStaffList] = useState([]);
  const [summary, setSummary] = useState({
    totalStaff: 0,
    onlineStaff: 0,
    waiterCount: 0,
    kitchenCount: 0,
    cashierCount: 0,
    managerCount: 0
  });

  // Scheduling states
  const todayStr = getLocalDateString(0);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [daySchedule, setDaySchedule] = useState({
    workDate: todayStr,
    morningShift: [],
    eveningShift: [],
    totalMorning: 0,
    totalEvening: 0
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ONLINE' | 'OFFLINE' | 'ACTIVE' | 'LOCKED'

  // Loading & Toast states
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedStaffForPin, setSelectedStaffForPin] = useState(null);
  const [newPinCode, setNewPinCode] = useState('');
  const [activeStaffMenuId, setActiveStaffMenuId] = useState(null); // Menu 3 chấm thao tác nhân viên

  // Weekly Print Modal States
  const [showWeeklyPrintModal, setShowWeeklyPrintModal] = useState(false);
  const [printWeekDate, setPrintWeekDate] = useState(todayStr);
  const [weeklySchedules, setWeeklySchedules] = useState([]);
  const [loadingWeeklySchedules, setLoadingWeeklySchedules] = useState(false);
  const [printRoleFilter, setPrintRoleFilter] = useState('ALL');
  const [printViewMode, setPrintViewMode] = useState('MATRIX'); // 'MATRIX' | 'CARDS'
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Trạng thái chọn nhân viên phân ca riêng theo từng Role: { [`${shiftType}_${role}`]: staffId }
  const [roleShiftSelection, setRoleShiftSelection] = useState({});

  // Pop-up Modal Phân Ca Cho Nhân Viên (Tìm kiếm theo từ khóa tên, Dropdown, Nút thêm vào ca)
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignModalConfig, setAssignModalConfig] = useState({
    shiftType: 'MORNING', // 'MORNING' | 'EVENING'
    role: 'ALL'           // 'MANAGER' | 'CASHIER' | 'WAITER' | 'KITCHEN' | 'ALL'
  });
  const [assignSearchTerm, setAssignSearchTerm] = useState('');
  const [assignSelectedStaffId, setAssignSelectedStaffId] = useState('');

  // Form for New Staff
  const [newStaffForm, setNewStaffForm] = useState({
    username: '',
    fullName: '',
    phone: '',
    email: '',
    role: 'WAITER',
    pinCode: '123456'
  });

  // Form for Edit Staff
  const [editStaffForm, setEditStaffForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    role: 'WAITER',
    isActive: true
  });

  const { showConfirm, showAlert, showToast } = useDialog();

  // ===================================================================
  // API FETCH CALLS
  // ===================================================================

  // 1. Fetch KPI Summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await staffApi.getSummary();
      const payload = res?.data?.data !== undefined ? res.data.data : (res?.data || res);
      if (payload && typeof payload === 'object') {
        setSummary({
          totalStaff: payload.totalStaff || 0,
          onlineStaff: payload.onlineStaff || 0,
          waiterCount: payload.waiterCount || 0,
          kitchenCount: payload.kitchenCount || 0,
          cashierCount: payload.cashierCount || 0,
          managerCount: payload.managerCount || 0
        });
      }
    } catch (err) {
      console.error('Failed to load staff summary:', err);
    }
  }, []);

  // 2. Fetch Staff Roster List
  const fetchStaff = useCallback(async () => {
    setLoadingStaff(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter === 'ACTIVE') params.isActive = true;
      if (statusFilter === 'LOCKED') params.isActive = false;

      const res = await staffApi.getAllStaff(params);
      const payload = res?.data?.data !== undefined ? res.data.data : (res?.data || res);
      setStaffList(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('Failed to load staff list:', err);
      showToast('Không thể kết nối đến máy chủ để tải danh sách nhân viên!');
    } finally {
      setLoadingStaff(false);
    }
  }, [searchQuery, roleFilter, statusFilter]);

  // 3. Fetch Day Schedule
  const fetchDaySchedule = useCallback(async (dateToFetch) => {
    setLoadingSchedule(true);
    try {
      const res = await staffApi.getDaySchedule(dateToFetch);
      const payload = res?.data?.data !== undefined ? res.data.data : (res?.data || res);
      if (payload && typeof payload === 'object') {
        const morning = Array.isArray(payload.morningShift) ? payload.morningShift : [];
        const evening = Array.isArray(payload.eveningShift) ? payload.eveningShift : [];
        setDaySchedule({
          workDate: payload.workDate || dateToFetch,
          morningShift: morning,
          eveningShift: evening,
          totalMorning: payload.totalMorning !== undefined ? payload.totalMorning : morning.length,
          totalEvening: payload.totalEvening !== undefined ? payload.totalEvening : evening.length
        });
      }
    } catch (err) {
      console.error('Failed to load day schedule:', err);
      showToast('Lỗi tải lịch phân ca ngày ' + dateToFetch);
    } finally {
      setLoadingSchedule(false);
    }
  }, []);

  // 4. Fetch Weekly Schedule Range
  const fetchWeeklySchedule = useCallback(async (baseDate) => {
    setLoadingWeeklySchedules(true);
    try {
      const { startDate, endDate } = getWeekRange(baseDate);
      const res = await staffApi.getScheduleRange(startDate, endDate);
      const payload = res?.data?.data !== undefined ? res.data.data : (res?.data || res);
      setWeeklySchedules(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('Failed to load weekly schedule:', err);
      showToast('Lỗi tải dữ liệu lịch tuần!');
    } finally {
      setLoadingWeeklySchedules(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchSummary();
    fetchStaff();
  }, [fetchSummary, fetchStaff]);

  // Load schedule when selectedDate changes
  useEffect(() => {
    fetchDaySchedule(selectedDate);
  }, [selectedDate, fetchDaySchedule]);

  // Đóng Menu 3 chấm tác vụ nhân viên khi click ra ngoài
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.roms-staff-menu-container')) {
        setActiveStaffMenuId(null);
      }
    };
    if (activeStaffMenuId) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [activeStaffMenuId]);

  // ===================================================================
  // ACTIONS & HANDLERS
  // ===================================================================

  // Thêm nhân viên mới
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaffForm.fullName.trim() || !newStaffForm.username.trim()) {
      showAlert({
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập họ tên và tên đăng nhập / mã nhân viên!',
        type: 'warning'
      });
      return;
    }
    if (!newStaffForm.pinCode || !/^\d{6}$/.test(newStaffForm.pinCode)) {
      showAlert({
        title: 'Mã PIN không hợp lệ',
        message: 'Mã PIN phải gồm đúng 6 chữ số (ví dụ: 123456)!',
        type: 'warning'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await staffApi.createStaff(newStaffForm);
      showToast(`Đã thêm nhân viên [${newStaffForm.fullName}] (${newStaffForm.username}) thành công!`, 'success');
      setShowAddStaffModal(false);
      setNewStaffForm({
        username: '',
        fullName: '',
        phone: '',
        email: '',
        role: 'WAITER',
        pinCode: '123456'
      });
      fetchStaff();
      fetchSummary();
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi khi tạo nhân viên mới!';
      showAlert({
        title: 'Lỗi tạo nhân viên',
        message: msg,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mở modal sửa thông tin nhân viên
  const handleOpenEditStaff = (staff) => {
    setSelectedStaffForEdit(staff);
    setEditStaffForm({
      fullName: staff.fullName || '',
      phone: staff.phone || '',
      email: staff.email || '',
      role: staff.role || 'WAITER',
      isActive: staff.isActive !== false
    });
    setShowEditStaffModal(true);
  };

  // Cập nhật thông tin nhân viên
  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!selectedStaffForEdit) return;

    setIsSubmitting(true);
    try {
      await staffApi.updateStaff(selectedStaffForEdit.id, editStaffForm);
      showToast(`Đã cập nhật thông tin nhân viên [${editStaffForm.fullName}] thành công!`, 'success');
      setShowEditStaffModal(false);
      setSelectedStaffForEdit(null);
      fetchStaff();
      fetchSummary();
      fetchDaySchedule(selectedDate);
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi khi cập nhật nhân viên!';
      showAlert({
        title: 'Lỗi cập nhật hồ sơ',
        message: msg,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Đổi mã PIN
  const handleChangePin = async () => {
    if (!newPinCode || !/^\d{6}$/.test(newPinCode)) {
      showAlert({
        title: 'Mã PIN không hợp lệ',
        message: 'Vui lòng nhập mã PIN mới gồm đúng 6 chữ số!',
        type: 'warning'
      });
      return;
    }
    if (!selectedStaffForPin) return;

    try {
      await staffApi.changePin(selectedStaffForPin.id, newPinCode);
      showToast(`Đã đổi mã PIN cho nhân viên [${selectedStaffForPin.fullName}] thành công!`, 'success');
      setShowPinModal(false);
      setSelectedStaffForPin(null);
      setNewPinCode('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi khi đổi mã PIN!';
      showAlert({
        title: 'Lỗi đổi mã PIN',
        message: msg,
        type: 'error'
      });
    }
  };

  // Khóa / Mở khóa tài khoản nhân viên
  const handleToggleStatus = async (staff) => {
    const isLockedDueToPin = (staff.failedPinAttempts != null && staff.failedPinAttempts >= 5) || !staff.isActive;
    const actionName = !staff.isActive ? 'mở khóa kích hoạt' : 'tạm khóa';
    const confirmPrompt = isLockedDueToPin && !staff.isActive
      ? `Tài khoản của [${staff.fullName}] (${staff.username}) đang bị KHÓA do nhập sai mã PIN ${staff.failedPinAttempts || 5} lần.\n\nBạn có chắc chắn muốn MỞ KHÓA và đặt lại số lần thử?`
      : `Bạn có chắc chắn muốn ${actionName} tài khoản của [${staff.fullName}] (${staff.username})?`;

    const confirmed = await showConfirm({
      title: isLockedDueToPin && !staff.isActive ? 'Mở khóa tài khoản nhân viên' : 'Xác nhận trạng thái tài khoản',
      message: confirmPrompt,
      confirmText: !staff.isActive ? 'Mở khóa' : 'Khóa tài khoản',
      type: isLockedDueToPin ? 'warning' : 'danger'
    });

    if (!confirmed) return;

    try {
      const res = !staff.isActive ? await staffApi.unlockStaff(staff.id) : await staffApi.toggleStatus(staff.id);
      const msg = res?.data?.message || res?.message || 'Cập nhật trạng thái tài khoản thành công!';
      showToast(msg, 'success');
      fetchStaff();
      fetchSummary();
      fetchDaySchedule(selectedDate);
    } catch (err) {
      showAlert({
        title: 'Lỗi cập nhật trạng thái',
        message: err.response?.data?.message || 'Lỗi cập nhật trạng thái nhân viên!',
        type: 'error'
      });
    }
  };

  // Quản lý chuyển đổi thủ công trạng thái ca trực (Trực ca <-> Ngoại tuyến)
  const handleToggleShiftStatus = async (staff) => {
    const nextStatus = !staff.isOnShift ? 'Trực ca (Online)' : 'Ngoại tuyến (Offline)';
    const confirmed = await showConfirm({
      title: 'Chuyển đổi trạng thái ca trực',
      message: `Bạn có chắc muốn chuyển trạng thái ca của [${staff.fullName}] (${staff.username}) sang "${nextStatus}"?`,
      confirmText: 'Chuyển trạng thái',
      type: 'warning'
    });

    if (!confirmed) return;

    try {
      const res = await staffApi.toggleShiftStatus(staff.id);
      const msg = res?.data?.message || 'Cập nhật trạng thái ca thành công!';
      showToast(msg, 'success');
      fetchStaff();
      fetchSummary();
    } catch (err) {
      showAlert({
        title: 'Lỗi cập nhật ca trực',
        message: err.response?.data?.message || 'Lỗi cập nhật trạng thái ca!',
        type: 'error'
      });
    }
  };

  // Phân ca cho nhân viên vào ca sáng hoặc ca tối
  const handleAssignShift = async (shiftType, staffId) => {
    const id = parseInt(staffId);
    if (!id) return;
    const safeList = Array.isArray(staffList) ? staffList : [];
    const staff = safeList.find(s => s.id === id);
    if (!staff) return;

    if (!staff.isActive) {
      showAlert({
        title: 'Tài khoản đang bị tạm khóa',
        message: `Nhân viên [${staff.fullName}] hiện đang bị tạm khóa tài khoản. Vui lòng kích hoạt lại trước khi phân ca!`,
        type: 'warning'
      });
      return;
    }

    try {
      await staffApi.assignShift({
        staffId: id,
        workDate: selectedDate,
        shiftType: shiftType
      });
      const shiftName = shiftType === 'MORNING' ? 'Ca Sáng' : 'Ca Chiều / Tối';
      showToast(`Đã phân công [${staff.fullName}] (${staff.roleLabel || staff.role}) vào ${shiftName}!`, 'success');
      setRoleShiftSelection(prev => ({ ...prev, [`${shiftType}_${staff.role}`]: '' }));
      fetchDaySchedule(selectedDate);
    } catch (err) {
      showAlert({
        title: 'Lỗi phân ca làm việc',
        message: err.response?.data?.message || 'Lỗi phân ca làm việc!',
        type: 'error'
      });
    }
  };

  // Nút phân ca riêng biệt theo từng Role và từng Ca
  const handleAssignShiftByRole = async (shiftType, role) => {
    const key = `${shiftType}_${role}`;
    const staffId = roleShiftSelection[key];
    if (!staffId) {
      showAlert({
        title: 'Chưa chọn nhân sự',
        message: 'Vui lòng chọn nhân viên cần phân ca trong danh sách!',
        type: 'warning'
      });
      return;
    }
    await handleAssignShift(shiftType, staffId);
  };

  // Mở Pop-up modal phân ca theo Ca và Role
  const handleOpenAssignModal = (shiftType = 'MORNING', role = 'ALL') => {
    setAssignModalConfig({ shiftType, role });
    setAssignSearchTerm('');
    setAssignSelectedStaffId('');
    setShowAssignModal(true);
  };

  // Đóng Pop-up modal phân ca
  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setAssignSearchTerm('');
    setAssignSelectedStaffId('');
  };

  // Thêm nhân viên vào ca từ Pop-up Modal
  const handleSubmitAssignModal = async () => {
    if (!assignSelectedStaffId) {
      showAlert({
        title: 'Chưa chọn nhân sự',
        message: 'Vui lòng chọn nhân viên trong dropdown để thêm vào ca!',
        type: 'warning'
      });
      return;
    }
    const staffId = parseInt(assignSelectedStaffId, 10);
    if (!staffId) return;

    await handleAssignShift(assignModalConfig.shiftType, staffId);
    setAssignSelectedStaffId('');
  };

  // Xóa / Hủy phân ca của nhân viên
  const handleRemoveShift = async (scheduleId, staffName, shiftLabel) => {
    const confirmed = await showConfirm({
      title: 'Hủy phân ca làm việc',
      message: `Hủy ca trực của [${staffName}] khỏi ${shiftLabel}?`,
      confirmText: 'Hủy ca trực',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      await staffApi.removeShift(scheduleId);
      showToast(`Đã hủy ca trực của [${staffName}]!`, 'success');
      fetchDaySchedule(selectedDate);
    } catch (err) {
      showAlert({
        title: 'Lỗi hủy ca làm việc',
        message: err.response?.data?.message || 'Lỗi hủy ca trực!',
        type: 'error'
      });
    }
  };

  // Sao chép lịch phân ca từ hôm trước
  const handleCopyYesterdaySchedule = async () => {
    const yesterdayStr = getLocalDateString(-1, selectedDate);
    const confirmed = await showConfirm({
      title: 'Sao chép phân ca làm việc',
      message: `Bạn có muốn sao chép toàn bộ phân ca từ ngày hôm trước (${yesterdayStr}) sang ngày ${selectedDate}?`,
      confirmText: 'Sao chép phân ca',
      type: 'info'
    });

    if (!confirmed) return;

    try {
      const res = await staffApi.copySchedule(yesterdayStr, selectedDate);
      const msg = res?.data?.message || res?.message || 'Sao chép phân ca thành công!';
      showToast(msg, 'success');
      fetchDaySchedule(selectedDate);
    } catch (err) {
      showAlert({
        title: 'Lỗi sao chép lịch phân ca',
        message: err.response?.data?.message || 'Không thể sao chép lịch làm việc!',
        type: 'error'
      });
    }
  };

  // Next / Prev Day
  const handleStepDay = (step) => {
    const nextDate = getLocalDateString(step, selectedDate);
    setSelectedDate(nextDate);
  };

  // Mở modal xem trước và in lịch tuần
  const handleOpenWeeklyPrintModal = () => {
    const targetDate = selectedDate || todayStr;
    setPrintWeekDate(targetDate);
    fetchWeeklySchedule(targetDate);
    setShowWeeklyPrintModal(true);
  };

  // Điều hướng tuần trước / sau trong modal in
  const handleStepWeek = (stepWeeks) => {
    const parts = String(printWeekDate).split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() + stepWeeks * 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    const nextDate = `${y}-${m}-${dt}`;
    setPrintWeekDate(nextDate);
    fetchWeeklySchedule(nextDate);
  };

  // Tính toán khoảng tuần hiện tại đang xem trong modal in
  const currentPrintWeekInfo = getWeekRange(printWeekDate);

  // Lọc danh sách nhân viên trong bảng in theo vai trò
  const filteredPrintStaff = (Array.isArray(staffList) ? staffList : []).filter(s => {
    if (printRoleFilter !== 'ALL' && s.role !== printRoleFilter) return false;
    return true;
  });

  // Safe defensive arrays to prevent any undefined / object crash
  const safeStaffList = Array.isArray(staffList) ? staffList : [];
  const safeMorningShift = Array.isArray(daySchedule?.morningShift) ? daySchedule.morningShift : [];
  const safeEveningShift = Array.isArray(daySchedule?.eveningShift) ? daySchedule.eveningShift : [];

  // Lấy danh sách nhân viên chưa có trong ca để đưa vào dropdown thêm nhanh
  const morningStaffIds = safeMorningShift.map(s => s.staffId);
  const eveningStaffIds = safeEveningShift.map(s => s.staffId);
  const availableStaffForMorning = safeStaffList.filter(s => s.isActive && !morningStaffIds.includes(s.id));
  const availableStaffForEvening = safeStaffList.filter(s => s.isActive && !eveningStaffIds.includes(s.id));

  // Danh sách nhân viên khả dụng cho Pop-up Modal Phân Ca:
  // 1. Phải đang hoạt động (isActive === true)
  // 2. Chưa được phân vào ca đang chọn (morningStaffIds hoặc eveningStaffIds)
  // 3. Khớp với role đang chọn trong modal (hoặc nếu 'ALL' thì cho phép chọn tất cả các vai trò)
  // 4. Có tên (fullName) hoặc mã/SĐT chứa từ khóa tìm kiếm (assignSearchTerm)
  const currentModalShiftList = assignModalConfig.shiftType === 'MORNING' ? safeMorningShift : safeEveningShift;
  const currentModalAssignedIds = assignModalConfig.shiftType === 'MORNING' ? morningStaffIds : eveningStaffIds;

  const availableStaffForAssignModal = safeStaffList.filter(s => {
    if (!s.isActive) return false;
    if (currentModalAssignedIds.includes(s.id)) return false;
    if (assignModalConfig.role && assignModalConfig.role !== 'ALL' && s.role !== assignModalConfig.role) {
      return false;
    }
    if (assignSearchTerm && assignSearchTerm.trim()) {
      const kw = assignSearchTerm.trim().toLowerCase();
      const matchName = (s.fullName || '').toLowerCase().includes(kw);
      const matchCode = (s.username || '').toLowerCase().includes(kw);
      const matchPhone = (s.phone || '').includes(kw);
      return matchName || matchCode || matchPhone;
    }
    return true;
  });

  // Danh sách nhân sự hiện đã được phân trong ca và role của Modal
  const assignedStaffInModalShift = currentModalShiftList.filter(s => {
    if (assignModalConfig.role && assignModalConfig.role !== 'ALL' && s.role !== assignModalConfig.role) {
      return false;
    }
    return true;
  });

  // Client-side search / filter on safeStaffList (nếu đã fetch về)
  const filteredStaff = safeStaffList.filter(s => {
    const matchSearch =
      (s.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone || '').includes(searchQuery);
    if (!matchSearch) return false;

    if (roleFilter !== 'ALL' && s.role !== roleFilter) return false;
    if (statusFilter === 'ONLINE' && !s.isOnShift) return false;
    if (statusFilter === 'OFFLINE' && s.isOnShift) return false;
    if (statusFilter === 'ACTIVE' && !s.isActive) return false;
    if (statusFilter === 'LOCKED' && s.isActive) return false;

    return true;
  });

  // ===================================================================
  // XUẤT BẢNG PHÂN CA RA FILE EXCEL (.XLS) ĐỊNH DẠNG ĐẸP
  // ===================================================================
  const handleExportExcel = async (baseDate) => {
    setIsExportingExcel(true);
    try {
      const targetDate = baseDate || printWeekDate || selectedDate || todayStr;
      const weekInfo = getWeekRange(targetDate);

      // 1. Kiểm tra hoặc nạp mới dữ liệu phân ca theo tuần
      let schedulesData = weeklySchedules;
      const isTargetWeekLoaded = Array.isArray(weeklySchedules) && weeklySchedules.length > 0 &&
        weeklySchedules.some(s => s.workDate >= weekInfo.startDate && s.workDate <= weekInfo.endDate);

      if (!isTargetWeekLoaded || schedulesData.length === 0) {
        const res = await staffApi.getScheduleRange(weekInfo.startDate, weekInfo.endDate);
        const payload = res?.data?.data !== undefined ? res.data.data : (res?.data || res);
        schedulesData = Array.isArray(payload) ? payload : [];
      }

      // Danh sách nhân viên áp dụng (nếu đang lọc vai trò trong modal in thì xuất theo vai trò đó, ngược lại xuất toàn bộ)
      const exportStaff = (showWeeklyPrintModal && printRoleFilter !== 'ALL')
        ? safeStaffList.filter(s => s.role === printRoleFilter)
        : safeStaffList;

      if (exportStaff.length === 0) {
        showToast('Không có dữ liệu nhân viên để xuất tệp Excel!');
        setIsExportingExcel(false);
        return;
      }

      const curDateStr = new Date().toLocaleDateString('vi-VN');
      const curTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

      // Tính tổng ca
      const totalMorningAllWeek = schedulesData.filter(s => s.shiftType === 'MORNING').length;
      const totalEveningAllWeek = schedulesData.filter(s => s.shiftType === 'EVENING').length;
      const grandTotalShifts = totalMorningAllWeek + totalEveningAllWeek;

      // Thống kê phân bổ theo vai trò
      const roleStats = [
        { role: 'MANAGER', label: 'Quản Lý Nhà Hàng (Manager)', count: exportStaff.filter(s => s.role === 'MANAGER').length, shifts: 0 },
        { role: 'CASHIER', label: 'Thu Ngân POS (Cashier)', count: exportStaff.filter(s => s.role === 'CASHIER').length, shifts: 0 },
        { role: 'WAITER', label: 'Nhân Viên Phục Vụ (Waiter)', count: exportStaff.filter(s => s.role === 'WAITER').length, shifts: 0 },
        { role: 'KITCHEN', label: 'Bộ Phận Bếp & KDS (Kitchen)', count: exportStaff.filter(s => s.role === 'KITCHEN').length, shifts: 0 }
      ];

      roleStats.forEach(r => {
        const staffIdsOfRole = exportStaff.filter(s => s.role === r.role).map(s => s.id);
        r.shifts = schedulesData.filter(s => staffIdsOfRole.includes(s.staffId)).length;
      });

      // Tạo nội dung HTML tương thích Microsoft Excel với thiết kế chuẩn thương hiệu ROMS
      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
  <meta charset="UTF-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Lich_Phan_Ca_Tuan</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
            <x:Print>
              <x:ValidPrinterInfo/>
              <x:PaperSizeIndex>9</x:PaperSizeIndex>
              <x:HorizontalResolution>600</x:HorizontalResolution>
              <x:VerticalResolution>600</x:VerticalResolution>
            </x:Print>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10.5pt; color: #1F1B1A; background-color: #FFFFFF; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 22px; }
    .banner { background-color: #9D4124; color: #FFFFFF; font-size: 16pt; font-weight: bold; text-align: center; height: 50px; vertical-align: middle; border: 1.5px solid #7D311A; }
    .sub-banner { background-color: #FCF1EF; color: #56423D; font-size: 11pt; font-weight: bold; text-align: center; height: 30px; vertical-align: middle; border: 1px solid #D5C2BD; }
    .meta-box { background-color: #FAF7F5; color: #56423D; font-size: 9.5pt; border: 1px solid #EAE0DE; padding: 6px 12px; }
    .sec-title { background-color: #56423D; color: #FFFFFF; font-size: 11.5pt; font-weight: bold; padding: 8px 12px; height: 32px; vertical-align: middle; border: 1px solid #3E2723; }
    .th-col { background-color: #9D4124; color: #FFFFFF; font-weight: bold; font-size: 10pt; text-align: center; border: 1px solid #7D311A; height: 36px; vertical-align: middle; }
    .th-day { background-color: #7D311A; color: #FFFFFF; font-weight: bold; font-size: 9.5pt; text-align: center; border: 1px solid #5C2211; height: 36px; vertical-align: middle; }
    td { border: 1px solid #D5C2BD; padding: 6px 8px; font-size: 9.5pt; vertical-align: middle; }
    .td-center { text-align: center; }
    .td-left { text-align: left; }
    .td-right { text-align: right; }
    .td-code { text-align: center; font-family: Consolas, monospace; font-weight: bold; color: #9D4124; mso-number-format: "\\@"; }
    .td-phone { text-align: center; mso-number-format: "\\@"; }
    .row-even { background-color: #FAF7F5; }
    .row-odd { background-color: #FFFFFF; }
    
    .role-mgr { background-color: #FCF1EF; color: #9D4124; font-weight: bold; text-align: center; }
    .role-cashier { background-color: #FFF3E0; color: #B26A00; font-weight: bold; text-align: center; }
    .role-waiter { background-color: #F1F8E9; color: #2E7D32; font-weight: bold; text-align: center; }
    .role-kitchen { background-color: #FFEBEE; color: #C62828; font-weight: bold; text-align: center; }

    .shift-both { background-color: #FFE0B2; color: #D84315; font-weight: bold; text-align: center; font-size: 8.5pt; }
    .shift-morning { background-color: #FFF8E1; color: #B26A00; font-weight: bold; text-align: center; font-size: 8.5pt; }
    .shift-evening { background-color: #EFEBE9; color: #4E342E; font-weight: bold; text-align: center; font-size: 8.5pt; }
    .shift-off { background-color: #FAFAFA; color: #9E9E9E; font-style: italic; text-align: center; font-size: 8.5pt; }

    .sum-morning { background-color: #FCF1EF; color: #B26A00; font-weight: bold; border-top: 2px solid #9D4124; }
    .sum-evening { background-color: #FCF1EF; color: #4E342E; font-weight: bold; }
    .sum-total { background-color: #F6ECEA; color: #1F1B1A; font-weight: bold; border-top: 2px solid #56423D; border-bottom: 2px solid #56423D; }
    .grand-total { background-color: #9D4124; color: #FFFFFF; font-weight: bold; text-align: center; font-size: 11pt; }
  </style>
</head>
<body>
  <!-- 1. BANNER TIÊU ĐỀ CHÍNH -->
  <table>
    <col width="45"/>
    <col width="95"/>
    <col width="190"/>
    <col width="115"/>
    <col width="110"/>
    <col width="130"/>
    <col width="130"/>
    <col width="130"/>
    <col width="130"/>
    <col width="130"/>
    <col width="130"/>
    <col width="130"/>
    <col width="90"/>
    <tr>
      <th colspan="13" class="banner">HỆ THỐNG QUẢN LÝ NHÀ HÀNG ROMS - BẢNG PHÂN CÔNG LỊCH TRỰC NHÂN SỰ THEO TUẦN</th>
    </tr>
    <tr>
      <td colspan="13" class="sub-banner">
        Áp dụng từ Thứ Hai (${weekInfo.startDisplay}) đến Chủ Nhật (${weekInfo.endDisplay}) • Toàn Hệ Thống Nhà Hàng • Mã biểu mẫu: BM-NS-04/ROMS
      </td>
    </tr>
    <tr>
      <td colspan="4" class="meta-box"><b>Ngày xuất:</b> ${curDateStr} Lúc ${curTimeStr}</td>
      <td colspan="4" class="meta-box"><b>Người lập biểu:</b> Quản lý nhà hàng</td>
      <td colspan="5" class="meta-box"><b>Tổng nhân sự:</b> ${exportStaff.length} người | <b>Tổng ca tuần:</b> ${grandTotalShifts} lượt trực</td>
    </tr>
  </table>

  <!-- 2. BẢNG PHÂN CA MA TRẬN 7 NGÀY -->
  <table>
    <col width="45"/>
    <col width="95"/>
    <col width="190"/>
    <col width="115"/>
    <col width="110"/>
    <col width="130"/>
    <col width="130"/>
    <col width="130"/>
    <col width="130"/>
    <col width="130"/>
    <col width="130"/>
    <col width="130"/>
    <col width="90"/>
    <thead>
      <tr>
        <th colspan="13" class="sec-title">I. BẢNG MA TRẬN PHÂN CA CHI TIẾT (THEO TỪNG NHÂN SỰ)</th>
      </tr>
      <tr>
        <th class="th-col">STT</th>
        <th class="th-col">Mã NV</th>
        <th class="th-col">Họ và Tên</th>
        <th class="th-col">Số Điện Thoại</th>
        <th class="th-col">Vai Trò</th>
        ${weekInfo.days.map(d => `
        <th class="th-day">
          ${d.dayLabel}<br/>(${d.displayDate})
        </th>`).join('')}
        <th class="th-col">Tổng Ca</th>
      </tr>
    </thead>
    <tbody>
      ${exportStaff.map((staff, idx) => {
        const staffWeekSchedules = schedulesData.filter(s => s.staffId === staff.id);
        const totalShifts = staffWeekSchedules.length;
        const roleCls = staff.role === 'MANAGER' ? 'role-mgr' : staff.role === 'CASHIER' ? 'role-cashier' : staff.role === 'KITCHEN' ? 'role-kitchen' : 'role-waiter';
        const rowCls = idx % 2 === 0 ? 'row-odd' : 'row-even';

        return `
      <tr class="${rowCls}">
        <td class="td-center"><b>${String(idx + 1).padStart(2, '0')}</b></td>
        <td class="td-code">${staff.username || ('EMP-' + staff.id)}</td>
        <td class="td-left"><b>${staff.fullName || ''}</b></td>
        <td class="td-phone">${staff.phone || '-'}</td>
        <td class="${roleCls}">${staff.roleLabel || staff.role}</td>
        ${weekInfo.days.map(day => {
          const dayShifts = schedulesData.filter(s => s.staffId === staff.id && s.workDate === day.dateStr);
          const hasMorning = dayShifts.some(s => s.shiftType === 'MORNING');
          const hasEvening = dayShifts.some(s => s.shiftType === 'EVENING');

          if (hasMorning && hasEvening) {
            return `<td class="shift-both">Sáng (06-14h)<br/>+ Tối (14-22h)</td>`;
          } else if (hasMorning) {
            return `<td class="shift-morning">Sáng (06:00 - 14:00)</td>`;
          } else if (hasEvening) {
            return `<td class="shift-evening">Tối (14:00 - 22:00)</td>`;
          } else {
            return `<td class="shift-off">OFF (Nghỉ)</td>`;
          }
        }).join('')}
        <td class="td-center" style="font-weight:bold; color:#9D4124; background-color:#FFF8F6; font-size:10.5pt;">${totalShifts}</td>
      </tr>`;
      }).join('')}
    </tbody>
    <tfoot>
      <!-- Tổng ca sáng -->
      <tr class="sum-morning">
        <td colspan="5" class="td-right">TỔNG NHÂN SỰ CA SÁNG (06:00 - 14:00):</td>
        ${weekInfo.days.map(day => {
          const count = schedulesData.filter(s => s.workDate === day.dateStr && s.shiftType === 'MORNING').length;
          return `<td class="td-center" style="font-weight:bold; color:#B26A00;">${count} NV</td>`;
        }).join('')}
        <td class="td-center" style="font-weight:bold; color:#B26A00; background-color:#FFECB3;">${totalMorningAllWeek} ca</td>
      </tr>
      <!-- Tổng ca tối -->
      <tr class="sum-evening">
        <td colspan="5" class="td-right">TỔNG NHÂN SỰ CA TỐI (14:00 - 22:00):</td>
        ${weekInfo.days.map(day => {
          const count = schedulesData.filter(s => s.workDate === day.dateStr && s.shiftType === 'EVENING').length;
          return `<td class="td-center" style="font-weight:bold; color:#4E342E;">${count} NV</td>`;
        }).join('')}
        <td class="td-center" style="font-weight:bold; color:#4E342E; background-color:#FFECB3;">${totalEveningAllWeek} ca</td>
      </tr>
      <!-- Tổng ca ngày -->
      <tr class="sum-total">
        <td colspan="5" class="td-right">TỔNG LƯỢT TRỰC TRONG NGÀY (CẢ 2 CA):</td>
        ${weekInfo.days.map(day => {
          const count = schedulesData.filter(s => s.workDate === day.dateStr).length;
          return `<td class="td-center" style="font-weight:bold; color:#9D4124;">${count} lượt</td>`;
        }).join('')}
        <td class="grand-total">${grandTotalShifts} lượt</td>
      </tr>
    </tfoot>
  </table>

  <!-- 3. BẢNG TỔNG HỢP CƠ CẤU VAI TRÒ NHÂN SỰ -->
  <table>
    <col width="60"/>
    <col width="250"/>
    <col width="140"/>
    <col width="160"/>
    <col width="140"/>
    <tr>
      <th colspan="5" class="sec-title">II. TỔNG HỢP CƠ CẤU PHÂN BỔ NHÂN LỰC TRONG TUẦN</th>
    </tr>
    <tr>
      <th class="th-col">STT</th>
      <th class="th-col">Bộ Phận / Vai Trò</th>
      <th class="th-col">Số Lượng Nhân Sự</th>
      <th class="th-col">Tổng Ca Trực Trong Tuần</th>
      <th class="th-col">Tỷ Trọng Ca Trực (%)</th>
    </tr>
    ${roleStats.map((r, i) => {
      const pct = grandTotalShifts > 0 ? Math.round((r.shifts / grandTotalShifts) * 100) : 0;
      return `
    <tr class="${i % 2 === 0 ? 'row-odd' : 'row-even'}">
      <td class="td-center"><b>${i + 1}</b></td>
      <td class="td-left"><b>${r.label}</b></td>
      <td class="td-center">${r.count} người</td>
      <td class="td-center" style="font-weight:bold; color:#9D4124;">${r.shifts} ca</td>
      <td class="td-center"><b>${pct}%</b></td>
    </tr>`;
    }).join('')}
    <tr style="background-color:#FFECB3; font-weight:bold;">
      <td colspan="2" class="td-right">TỔNG CỘNG TOÀN NHÀ HÀNG:</td>
      <td class="td-center">${exportStaff.length} người</td>
      <td class="td-center" style="color:#9D4124;">${grandTotalShifts} ca</td>
      <td class="td-center">100%</td>
    </tr>
  </table>

  <!-- 4. GHI CHÚ QUY CHẾ VẬN HÀNH & KÝ DUYỆT -->
  <table>
    <col width="400"/>
    <col width="400"/>
    <col width="400"/>
    <tr>
      <th colspan="3" class="sec-title">III. QUY CHẾ VẬN HÀNH & PHÊ DUYỆT BẢNG LỊCH</th>
    </tr>
    <tr>
      <td colspan="3" style="padding:10px 14px; background-color:#FAF7F5; font-size:9.5pt; color:#56423D; border:1px solid #D5C2BD; line-height:1.6;">
        <b>1. Thời gian có mặt:</b> Nhân viên bắt buộc có mặt trước giờ bắt đầu ca trực ít nhất 15 phút để họp giao ban, kiểm tra đồng phục, thẻ tên và nhận bàn giao khu vực.<br/>
        <b>2. Đổi ca trực:</b> Mọi trường hợp đổi ca trực phải được thực hiện trên hệ thống và có sự phê duyệt của Quản lý nhà hàng trước tối thiểu 24 giờ.<br/>
        <b>3. Kỷ luật ca trực:</b> Nghiêm cấm tự ý bỏ ca trực, đi muộn về sớm hoặc tự ý đổi ca không báo trước. Vi phạm sẽ bị xử lý kỷ luật theo nội quy nhà hàng.
      </td>
    </tr>
    <tr><td colspan="3" style="border:none; height:20px;"></td></tr>
    <tr>
      <td style="border:none; text-align:center; vertical-align:top; width:33%;">
        <b>NGƯỜI LẬP BẢNG LỊCH</b><br/>
        <span style="font-size:9pt; color:#89726B;">(Ký và ghi rõ họ tên)</span><br/><br/><br/><br/><br/>
        <b>Quản Lý Ca Trực</b>
      </td>
      <td style="border:none; text-align:center; vertical-align:top; width:33%;">
        <b>ĐIỀU PHỐI BẾP (BOH LEAD)</b><br/>
        <span style="font-size:9pt; color:#89726B;">(Ký và ghi rõ họ tên)</span><br/><br/><br/><br/><br/>
        <b>Bếp Trưởng Nhà Hàng</b>
      </td>
      <td style="border:none; text-align:center; vertical-align:top; width:33%;">
        <b>BAN QUẢN LÝ DUYỆT</b><br/>
        <span style="font-size:9pt; color:#89726B;">(Ký duyệt và đóng dấu)</span><br/><br/><br/><br/><br/>
        <b>Ban Quản Trị ROMS</b>
      </td>
    </tr>
  </table>
</body>
</html>`;

      // Tạo Blob với BOM UTF-8 (EF BB BF) để đảm bảo không lỗi font tiếng Việt trên mọi phiên bản Excel
      const utf8Bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const blob = new Blob([utf8Bom, html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const fileName = `ROMS_Lich_Phan_Ca_Tuan_${weekInfo.startDate}_den_${weekInfo.endDate}.xls`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      showToast(`Đã xuất file Excel [${fileName}] thành công!`);
    } catch (err) {
      console.error('Lỗi khi xuất bảng phân ca Excel:', err);
      showToast('Xuất file Excel thất bại, vui lòng thử lại!');
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', paddingBottom: '40px' }}>

      {/* Header Title Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.9rem', color: '#1F1B1A', margin: 0 }}>
            Quản Lý Nhân Sự & Vận Hành Đội Ngũ
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              boxShadow: '0 4px 12px rgba(157, 65, 36, 0.25)',
              transition: 'all 0.15s ease'
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
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'SCHEDULE' ? '3px solid #9D4124' : '3px solid transparent',
            color: activeTab === 'SCHEDULE' ? '#9D4124' : '#56423D',
            fontWeight: 800,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Icon name="calendar_view_week" size={20} fill={activeTab === 'SCHEDULE' ? 1 : 0} />
          <span>Lịch Phân Ca & Trực Tiếp (Roster Schedule)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ROSTER')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'ROSTER' ? '3px solid #9D4124' : '3px solid transparent',
            color: activeTab === 'ROSTER' ? '#9D4124' : '#56423D',
            fontWeight: 800,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Icon name="badge" size={20} fill={activeTab === 'ROSTER' ? 1 : 0} />
          <span>Hồ Sơ & Danh Sách Nhân Viên ({summary?.totalStaff ?? 0})</span>
        </button>
      </div>

      {/* KPI METRIC CARDS STRIP */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
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
              Tổng Nhân Lực Nhà Hàng
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FCF1EF', color: '#9D4124', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="groups" size={20} />
            </div>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '2.2rem', color: '#1F1B1A', lineHeight: 1 }}>
              {summary?.totalStaff ?? 0}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#89726B' }}>nhân viên đã định danh</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: '#F6ECEA', fontSize: '0.75rem', fontWeight: 700, color: '#56423D' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9D4124' }} />
              {summary?.managerCount ?? 0} Quản lý
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: '#F6ECEA', fontSize: '0.75rem', fontWeight: 700, color: '#56423D' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#753400' }} />
              {summary?.cashierCount ?? 0} Thu ngân
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: '#F6ECEA', fontSize: '0.75rem', fontWeight: 700, color: '#56423D' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#596232' }} />
              {summary?.waiterCount ?? 0} Phục vụ
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: '#F6ECEA', fontSize: '0.75rem', fontWeight: 700, color: '#56423D' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#994703' }} />
              {summary?.kitchenCount ?? 0} Bếp & KDS
            </span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: '#596232' }} />
        </div>

        {/* Metric 2: Đang Trực Ca Realtime */}
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
              Đang Đăng Nhập Trực Ca
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFDBC9', color: '#9D4124', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="alarm_on" size={20} />
            </div>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '2.2rem', color: '#9D4124', lineHeight: 1 }}>
              {summary?.onlineStaff ?? 0}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#596232', fontWeight: 700 }}>nhân sự đang trực tuyến</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: '#FCF1EF', fontSize: '0.75rem', fontWeight: 700, color: '#9D4124' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9D4124' }} />
              {daySchedule?.totalMorning ?? 0} NV ca sáng
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: '#FCF1EF', fontSize: '0.75rem', fontWeight: 700, color: '#9D4124' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9D4124' }} />
              {daySchedule?.totalEvening ?? 0} NV ca tối
            </span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: '#9D4124' }} />
        </div>
      </div>

      {/* VIEW 1: Lịch Phân Ca & Điều Phối (Active Default View) */}
      {activeTab === 'SCHEDULE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Scheduling Toolbar with Date Stepper */}
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
                    Phân bổ ca trực theo ngày, hỗ trợ kiểm tra điều kiện đăng nhập bảo mật và đồng bộ máy POS/KDS.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleCopyYesterdaySchedule}
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
                  title="Sao chép toàn bộ phân ca từ ngày hôm trước sang ngày hiện tại"
                >
                  <Icon name="content_copy" size={16} style={{ color: '#9D4124' }} />
                  <span>Sao chép ca từ hôm qua</span>
                </button>

                <button
                  type="button"
                  className="staff-print-btn-desktop-only"
                  onClick={handleOpenWeeklyPrintModal}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#9D4124',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(157, 65, 36, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                  title="Mở xem trước và in bảng phân công lịch trực theo tuần chuẩn A4 (Hỗ trợ xuất Excel bên trong)"
                >
                  <Icon name="local_printshop" size={16} />
                  <span>In Lịch Tuần (A4)</span>
                </button>
              </div>
            </div>

            {/* Stepper Date & Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '10px', borderTop: '1px solid #F6ECEA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#FCF1EF', borderRadius: '10px', padding: '4px', border: '1px solid #EAE0DE' }}>
                  <button
                    type="button"
                    onClick={() => handleStepDay(-1)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px 6px', color: '#56423D' }}
                    title="Ngày trước"
                  >
                    <Icon name="chevron_left" size={20} />
                  </button>

                  <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A' }}>
                    <Icon name="event" size={18} style={{ color: '#9D4124' }} />
                    <span>{formatDisplayDate(selectedDate)}</span>
                    {selectedDate === todayStr && (
                      <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: '#9D4124', color: '#FFF', fontWeight: 800 }}>
                        Hôm nay
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStepDay(1)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px 6px', color: '#56423D' }}
                    title="Ngày sau"
                  >
                    <Icon name="chevron_right" size={20} />
                  </button>
                </div>

                {/* Date picker input */}
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value || todayStr)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #EAE0DE',
                    background: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />

                {selectedDate !== todayStr && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayStr)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #9D4124',
                      background: '#FFF8F6',
                      color: '#9D4124',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Về hôm nay
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#89726B' }}>Lọc vai trò:</span>
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

          {loadingSchedule ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #EAE0DE' }}>
              <Icon name="progress_activity" size={32} style={{ animation: 'spin 1s linear infinite', color: '#9D4124' }} />
              <div style={{ marginTop: '10px', fontSize: '0.88rem', color: '#89726B' }}>Đang nạp dữ liệu phân ca...</div>
            </div>
          ) : (
            <>
              {/* SHIFT 1: Ca Sáng Container (06:00 - 14:00) */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '20px',
                border: '1.5px solid #FFDBC9',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}>
                {/* Shift Bar Header: Thông tin ca & thống kê số lượng theo vai trò */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: '#FCF1EF',
                  border: '1px solid #F0E6E4',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#9D4124', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="wb_sunny" size={24} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#1F1B1A', margin: 0 }}>
                          Ca Sáng (06:00 - 14:00)
                        </h4>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '9999px', background: '#DDE8AB', color: '#181E00', fontSize: '0.74rem', fontWeight: 800 }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#596232' }} />
                          {daySchedule?.totalMorning ?? safeMorningShift.length} Nhân sự đang trực
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#89726B', marginTop: '3px' }}>
                        Khung giờ mở ca: 06:00 - 14:00 • Nhấn nút phân ca để mở pop-up tìm kiếm và thêm nhân sự
                      </div>
                    </div>
                  </div>

                  {/* Summary badges of 4 roles in Morning Shift & Nút mở Pop-up Phân ca */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', background: '#FFFFFF', color: '#9D4124', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, border: '1px solid #EAE0DE' }}>
                      {safeMorningShift.filter(s => s.role === 'MANAGER').length} Quản lý
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#FFFFFF', color: '#753400', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, border: '1px solid #EAE0DE' }}>
                      {safeMorningShift.filter(s => s.role === 'CASHIER').length} Thu ngân
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#FFFFFF', color: '#181E00', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, border: '1px solid #EAE0DE' }}>
                      {safeMorningShift.filter(s => s.role === 'WAITER').length} Phục vụ
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#FFFFFF', color: '#93000A', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, border: '1px solid #EAE0DE' }}>
                      {safeMorningShift.filter(s => s.role === 'KITCHEN').length} Bếp
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenAssignModal('MORNING', 'ALL')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        borderRadius: '8px',
                        background: '#9D4124',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(157, 65, 36, 0.25)',
                        marginLeft: '4px'
                      }}
                      title="Mở pop-up phân ca cho Ca Sáng"
                    >
                      <Icon name="person_add" size={15} />
                      <span>+ Phân ca sáng</span>
                    </button>
                  </div>
                </div>

                {/* 4 Roles Column Grid for Ca Sáng: Mỗi role có dropdown & nút phân ca riêng biệt */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  {SHIFT_ROLES.map(roleItem => {
                    const role = roleItem.key;
                    if (roleFilter !== 'ALL' && roleFilter !== role) return null;

                    const listInRole = safeMorningShift.filter(s => s.role === role);
                    // Lọc đúng role, trạng thái isActive === true, và chưa có trong ca sáng
                    const availableForThisRole = safeStaffList.filter(s =>
                      s.role === role &&
                      s.isActive === true &&
                      !morningStaffIds.includes(s.id)
                    );
                    const selectedStaffIdForRole = roleShiftSelection[`MORNING_${role}`] || '';

                    return (
                      <div
                        key={role}
                        style={{
                          background: '#FFFFFF',
                          borderRadius: '14px',
                          padding: '14px',
                          border: `1.5px solid ${roleItem.borderColor}`,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          minHeight: '230px'
                        }}
                      >
                        {/* Header của thẻ Role */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #F6ECEA' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: roleItem.bg, color: roleItem.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon name={roleItem.icon} size={16} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#1F1B1A' }}>
                                {roleItem.label}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#89726B' }}>
                                {availableForThisRole.length} nhân sự sẵn sàng
                              </div>
                            </div>
                          </div>
                          <span style={{
                            fontSize: '0.74rem',
                            background: roleItem.bg,
                            color: roleItem.color,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontWeight: 800
                          }}>
                            {listInRole.length} NV
                          </span>
                        </div>

                        {/* Danh sách nhân viên đang trực trong Role này */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1, marginBottom: '12px' }}>
                          {listInRole.length === 0 ? (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#A89E9B',
                              fontStyle: 'italic',
                              padding: '20px 0',
                              textAlign: 'center',
                              background: '#FAF7F5',
                              borderRadius: '8px'
                            }}>
                              Chưa phân công {roleItem.shortLabel.toLowerCase()}
                            </div>
                          ) : (
                            listInRole.map(s => {
                              const avatar = getAvatarConfig(s);
                              return (
                                <div
                                  key={s.id}
                                  style={{
                                    background: '#FCF1EF',
                                    padding: '8px 10px',
                                    borderRadius: '10px',
                                    border: '1px solid #EAE0DE',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: avatar.bg, color: avatar.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.72rem', flexShrink: 0 }}>
                                      {avatar.initials}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {s.fullName}
                                      </div>
                                      <div style={{ fontSize: '0.68rem', color: '#89726B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#9D4124' }}>{s.username}</span>
                                        {s.phone && <span>• {s.phone}</span>}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveShift(s.id, s.fullName, 'Ca Sáng')}
                                    title={`Hủy ca trực của ${s.fullName}`}
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      background: '#FFFFFF',
                                      color: '#9D4124',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      flexShrink: 0,
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                                    }}
                                  >
                                    <Icon name="close" size={13} />
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Nút phân ca cho Role này: Bấm vào mở Pop-up Modal có tìm kiếm và dropdown */}
                        <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px dashed #EAE0DE' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal('MORNING', role)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '9px',
                              border: `1.5px solid ${roleItem.borderColor}`,
                              background: '#FFFFFF',
                              color: roleItem.color,
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.15s ease',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = roleItem.bg;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#FFFFFF';
                            }}
                            title={`Mở pop-up phân ca cho ${roleItem.shortLabel}`}
                          >
                            <Icon name="person_add" size={16} />
                            <span>Phân ca {roleItem.shortLabel}</span>
                            <span style={{
                              fontSize: '0.7rem',
                              background: roleItem.bg,
                              color: roleItem.color,
                              padding: '2px 7px',
                              borderRadius: '9999px',
                              fontWeight: 800,
                              border: `1px solid ${roleItem.borderColor}`
                            }}>
                              {availableForThisRole.length}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SHIFT 2: Ca Chiều / Tối Container (14:00 - 22:00) */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '20px',
                border: '1.5px solid #FFDBC9',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}>
                {/* Shift Bar Header: Thông tin ca & thống kê số lượng theo vai trò */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: '#FCF1EF',
                  border: '1px solid #F0E6E4',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#56423D', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="nights_stay" size={24} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#1F1B1A', margin: 0 }}>
                          Ca Chiều / Tối (14:00 - 22:00)
                        </h4>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '9999px', background: '#DDE8AB', color: '#181E00', fontSize: '0.74rem', fontWeight: 800 }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#596232' }} />
                          {daySchedule?.totalEvening ?? safeEveningShift.length} Nhân sự đang trực
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#89726B', marginTop: '3px' }}>
                        Khung giờ mở ca: 14:00 - 22:00 • Nhấn nút phân ca để mở pop-up tìm kiếm và thêm nhân sự
                      </div>
                    </div>
                  </div>

                  {/* Summary badges of 4 roles in Evening Shift & Nút mở Pop-up Phân ca */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', background: '#FFFFFF', color: '#9D4124', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, border: '1px solid #EAE0DE' }}>
                      {safeEveningShift.filter(s => s.role === 'MANAGER').length} Quản lý
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#FFFFFF', color: '#753400', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, border: '1px solid #EAE0DE' }}>
                      {safeEveningShift.filter(s => s.role === 'CASHIER').length} Thu ngân
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#FFFFFF', color: '#181E00', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, border: '1px solid #EAE0DE' }}>
                      {safeEveningShift.filter(s => s.role === 'WAITER').length} Phục vụ
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#FFFFFF', color: '#93000A', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, border: '1px solid #EAE0DE' }}>
                      {safeEveningShift.filter(s => s.role === 'KITCHEN').length} Bếp
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenAssignModal('EVENING', 'ALL')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        borderRadius: '8px',
                        background: '#753400',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(117, 52, 0, 0.25)',
                        marginLeft: '4px'
                      }}
                      title="Mở pop-up phân ca cho Ca Tối"
                    >
                      <Icon name="person_add" size={15} />
                      <span>+ Phân ca tối</span>
                    </button>
                  </div>
                </div>

                {/* 4 Roles Column Grid for Ca Tối: Mỗi role có dropdown & nút phân ca riêng biệt */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  {SHIFT_ROLES.map(roleItem => {
                    const role = roleItem.key;
                    if (roleFilter !== 'ALL' && roleFilter !== role) return null;

                    const listInRole = safeEveningShift.filter(s => s.role === role);
                    // Lọc đúng role, trạng thái isActive === true, và chưa có trong ca tối
                    const availableForThisRole = safeStaffList.filter(s =>
                      s.role === role &&
                      s.isActive === true &&
                      !eveningStaffIds.includes(s.id)
                    );
                    const selectedStaffIdForRole = roleShiftSelection[`EVENING_${role}`] || '';

                    return (
                      <div
                        key={role}
                        style={{
                          background: '#FFFFFF',
                          borderRadius: '14px',
                          padding: '14px',
                          border: `1.5px solid ${roleItem.borderColor}`,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          minHeight: '230px'
                        }}
                      >
                        {/* Header của thẻ Role */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #F6ECEA' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: roleItem.bg, color: roleItem.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon name={roleItem.icon} size={16} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#1F1B1A' }}>
                                {roleItem.label}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#89726B' }}>
                                {availableForThisRole.length} nhân sự sẵn sàng
                              </div>
                            </div>
                          </div>
                          <span style={{
                            fontSize: '0.74rem',
                            background: roleItem.bg,
                            color: roleItem.color,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontWeight: 800
                          }}>
                            {listInRole.length} NV
                          </span>
                        </div>

                        {/* Danh sách nhân viên đang trực trong Role này */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1, marginBottom: '12px' }}>
                          {listInRole.length === 0 ? (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#A89E9B',
                              fontStyle: 'italic',
                              padding: '20px 0',
                              textAlign: 'center',
                              background: '#FAF7F5',
                              borderRadius: '8px'
                            }}>
                              Chưa phân công {roleItem.shortLabel.toLowerCase()}
                            </div>
                          ) : (
                            listInRole.map(s => {
                              const avatar = getAvatarConfig(s);
                              return (
                                <div
                                  key={s.id}
                                  style={{
                                    background: '#FCF1EF',
                                    padding: '8px 10px',
                                    borderRadius: '10px',
                                    border: '1px solid #EAE0DE',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: avatar.bg, color: avatar.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.72rem', flexShrink: 0 }}>
                                      {avatar.initials}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {s.fullName}
                                      </div>
                                      <div style={{ fontSize: '0.68rem', color: '#89726B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#9D4124' }}>{s.username}</span>
                                        {s.phone && <span>• {s.phone}</span>}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveShift(s.id, s.fullName, 'Ca Chiều / Tối')}
                                    title={`Hủy ca trực của ${s.fullName}`}
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      background: '#FFFFFF',
                                      color: '#9D4124',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      flexShrink: 0,
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                                    }}
                                  >
                                    <Icon name="close" size={13} />
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Nút phân ca cho Role này: Bấm vào mở Pop-up Modal có tìm kiếm và dropdown */}
                        <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px dashed #EAE0DE' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal('EVENING', role)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '9px',
                              border: `1.5px solid ${roleItem.borderColor}`,
                              background: '#FFFFFF',
                              color: roleItem.color,
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.15s ease',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = roleItem.bg;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#FFFFFF';
                            }}
                            title={`Mở pop-up phân ca cho ${roleItem.shortLabel}`}
                          >
                            <Icon name="person_add" size={16} />
                            <span>Phân ca {roleItem.shortLabel}</span>
                            <span style={{
                              fontSize: '0.7rem',
                              background: roleItem.bg,
                              color: roleItem.color,
                              padding: '2px 7px',
                              borderRadius: '9999px',
                              fontWeight: 800,
                              border: `1px solid ${roleItem.borderColor}`
                            }}>
                              {availableForThisRole.length}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
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
                  placeholder="Tìm theo tên, mã NV (EMP-xxxx / MGR-xxx), SĐT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%', color: '#1F1B1A' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
                <option value="ACTIVE">Tài khoản hoạt động</option>
                <option value="LOCKED">Tài khoản bị khóa</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  fetchStaff();
                  fetchSummary();
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #EAE0DE',
                  background: '#FFFFFF',
                  color: '#56423D',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
                title="Làm mới danh sách"
              >
                <Icon name="refresh" size={16} />
                <span>Làm mới</span>
              </button>
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
                    <th style={{ padding: '12px 16px' }}>Email Nhận OTP</th>
                    <th style={{ padding: '12px 16px' }}>Vai Trò Hệ Thống</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Trạng Thái Trực Ca</th>
                    <th style={{ padding: '12px 16px' }}>Ca Làm Việc Hôm Nay</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Tài Khoản</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStaff ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#89726B' }}>
                        <Icon name="progress_activity" size={24} style={{ animation: 'spin 1s linear infinite', color: '#9D4124' }} />
                        <div style={{ marginTop: '8px' }}>Đang tải danh sách nhân viên...</div>
                      </td>
                    </tr>
                  ) : filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#89726B' }}>
                        Không tìm thấy nhân viên nào phù hợp với bộ lọc!
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff, idx) => {
                      const avatar = getAvatarConfig(staff);
                      return (
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
                                background: avatar.bg,
                                color: avatar.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                flexShrink: 0
                              }}>
                                {avatar.initials}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: '#1F1B1A', fontSize: '0.9rem' }}>
                                  {staff.fullName}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#89726B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#9D4124' }}>{staff.username}</span>
                                  <span>•</span>
                                  <span>{staff.phone || 'Chưa có SĐT'}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {staff.email ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#1F1B1A', fontWeight: 600 }}>
                                <Icon name="mail" size={16} style={{ color: '#9D4124', flexShrink: 0 }} />
                                <span style={{ wordBreak: 'break-all' }}>{staff.email}</span>
                              </div>
                            ) : (
                              <span style={{
                                fontSize: '0.75rem',
                                fontStyle: 'italic',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#FFDAD6',
                                color: '#93000A',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontWeight: 600
                              }}>
                                <Icon name="warning" size={14} style={{ color: '#93000A' }} />
                                Chưa có email
                              </span>
                            )}
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
                            <button
                              type="button"
                              onClick={() => handleToggleShiftStatus(staff)}
                              title="Nhấn để chuyển đổi trạng thái ca trực (Trực ca <-> Ngoại tuyến)"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '3px 10px',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: staff.isOnShift ? '#E6F4EA' : '#F6ECEA',
                                color: staff.isOnShift ? '#137333' : '#89726B',
                                border: staff.isOnShift ? '1px solid #C8E6C9' : '1px solid #EAE0DE',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: staff.isOnShift ? '#137333' : '#89726B' }} />
                              {staff.isOnShift ? 'Đang trực ca' : 'Ngoại tuyến'}
                            </button>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '0.8rem', color: staff.currentShift?.includes('Nghỉ') ? '#89726B' : '#9D4124', fontWeight: 600 }}>
                              {staff.currentShift || 'Chưa phân ca'}
                            </span>
                          </td>
                          {/* Cột 5: Trạng thái tài khoản (Toggle Switch thông minh) */}
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(staff)}
                                title={staff.isActive ? 'Nhấn để khóa tài khoản' : 'Nhấn để mở khóa tài khoản'}
                                style={{
                                  width: '38px',
                                  height: '22px',
                                  borderRadius: '9999px',
                                  background: staff.isActive ? '#059669' : '#D1D5DB',
                                  border: 'none',
                                  cursor: 'pointer',
                                  position: 'relative',
                                  transition: 'background-color 0.2s ease',
                                  padding: 0
                                }}
                              >
                                <span
                                  style={{
                                    display: 'block',
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    background: '#FFFFFF',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                                    position: 'absolute',
                                    top: '3px',
                                    left: staff.isActive ? '19px' : '3px',
                                    transition: 'left 0.2s ease'
                                  }}
                                />
                              </button>
                              <span style={{
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                color: staff.isActive ? (staff.failedPinAttempts > 0 ? '#D97706' : '#059669') : '#DC2626'
                              }}>
                                {staff.isActive ? (
                                  staff.failedPinAttempts > 0 ? `Hoạt động (Sai PIN: ${staff.failedPinAttempts}/5)` : 'Hoạt động'
                                ) : (
                                  (staff.failedPinAttempts >= 5 || staff.isLocked) ? 'Đã khóa (Sai PIN 5 lần)' : 'Đã khóa'
                                )}
                              </span>
                            </div>
                          </td>

                          {/* Cột 6: Thao tác (Kebab Context Menu 3 chấm) */}
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div className="roms-staff-menu-container" style={{ position: 'relative', display: 'inline-block' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveStaffMenuId(activeStaffMenuId === staff.id ? null : staff.id);
                                }}
                                title="Thao tác với nhân viên"
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  border: '1px solid #EAE0DE',
                                  background: activeStaffMenuId === staff.id ? '#FDF0EC' : '#FAFAFA',
                                  color: activeStaffMenuId === staff.id ? '#9D4124' : '#56423D',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <Icon name="more_vert" size={18} />
                              </button>

                              {activeStaffMenuId === staff.id && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '36px',
                                    right: 0,
                                    zIndex: 60,
                                    width: '185px',
                                    background: '#FFFFFF',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.14), 0 3px 8px rgba(0,0,0,0.06)',
                                    border: '1px solid #F0E6E4',
                                    padding: '6px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px',
                                    textAlign: 'left'
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveStaffMenuId(null);
                                      handleOpenEditStaff(staff);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      width: '100%',
                                      padding: '8px 10px',
                                      border: 'none',
                                      background: 'transparent',
                                      borderRadius: '8px',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      color: '#1F1B1A',
                                      cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#FFF8F6')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                  >
                                    <Icon name="edit" size={16} style={{ color: '#56423D' }} />
                                    Chỉnh Sửa Hồ Sơ
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveStaffMenuId(null);
                                      setSelectedStaffForPin(staff);
                                      setShowPinModal(true);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      width: '100%',
                                      padding: '8px 10px',
                                      border: 'none',
                                      background: 'transparent',
                                      borderRadius: '8px',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      color: '#9D4124',
                                      cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#FFF8F6')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                  >
                                    <Icon name="dialpad" size={16} style={{ color: '#9D4124' }} />
                                    Cấp Lại Mã PIN
                                  </button>

                                  <div style={{ height: '1px', background: '#F0E6E4', margin: '4px 0' }} />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveStaffMenuId(null);
                                      handleToggleStatus(staff);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      width: '100%',
                                      padding: '8px 10px',
                                      border: 'none',
                                      background: 'transparent',
                                      borderRadius: '8px',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      color: staff.isActive ? '#DC2626' : '#059669',
                                      cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = staff.isActive ? '#FEF2F2' : '#ECFDF5')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                  >
                                    <Icon name={staff.isActive ? 'lock' : 'lock_open'} size={16} style={{ color: staff.isActive ? '#DC2626' : '#059669' }} />
                                    {staff.isActive ? 'Khóa Tài Khoản' : ((staff.failedPinAttempts >= 5 || staff.isLocked) ? 'Mở Khóa (Sai PIN 5 lần)' : 'Mở Khóa Tài Khoản')}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
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
                  placeholder="Ví dụ: Lê Hoàng Minh"
                  required
                  value={newStaffForm.fullName}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, fullName: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAE0DE', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                  Tên đăng nhập / Mã nhân viên <span style={{ color: '#9D4124' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: EMP-001 hoặc MGR-002"
                  required
                  value={newStaffForm.username}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, username: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAE0DE', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Số điện thoại
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
                    Mã PIN 6 số <span style={{ color: '#9D4124' }}>*</span>
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={newStaffForm.pinCode}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, pinCode: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAE0DE', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none', letterSpacing: '0.2em' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                  Địa chỉ Email (Nhận mã OTP khôi phục PIN Quản lý)
                </label>
                <input
                  type="email"
                  placeholder="quanly@roms.vn"
                  value={newStaffForm.email}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAE0DE', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                  Vai trò phân quyền hệ thống <span style={{ color: '#9D4124' }}>*</span>
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
                  disabled={isSubmitting}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#9D4124', color: '#FFFFFF', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo Nhân Viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Chỉnh Sửa Hồ Sơ Nhân Viên */}
      {showEditStaffModal && selectedStaffForEdit && (
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
                <Icon name="edit" size={24} style={{ color: '#9D4124' }} />
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1F1B1A', margin: 0 }}>
                  Chỉnh Sửa Hồ Sơ Nhân Viên
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditStaffModal(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F6ECEA', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                  Tên đăng nhập / Mã NV
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedStaffForEdit.username}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAE0DE', fontSize: '0.88rem', boxSizing: 'border-box', background: '#F6ECEA', color: '#89726B', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                  Họ và tên nhân viên <span style={{ color: '#9D4124' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editStaffForm.fullName}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, fullName: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAE0DE', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={editStaffForm.phone}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAE0DE', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                  Địa chỉ Email (Nhận mã OTP khôi phục PIN Quản lý)
                </label>
                <input
                  type="email"
                  placeholder="quanly@roms.vn"
                  value={editStaffForm.email}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, email: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAE0DE', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                  Vai trò phân quyền hệ thống <span style={{ color: '#9D4124' }}>*</span>
                </label>
                <select
                  value={editStaffForm.role}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, role: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAE0DE', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' }}
                >
                  <option value="WAITER">Phục vụ bàn (Waiter)</option>
                  <option value="KITCHEN">Nhân viên Bếp (Kitchen KDS)</option>
                  <option value="CASHIER">Thu ngân (Cashier POS)</option>
                  <option value="MANAGER">Quản lý nhà hàng (Manager)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                  Trạng thái tài khoản
                </label>
                <select
                  value={editStaffForm.isActive ? 'true' : 'false'}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, isActive: e.target.value === 'true' })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAE0DE', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' }}
                >
                  <option value="true">Đang hoạt động (Active)</option>
                  <option value="false">Tạm khóa tài khoản (Locked)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditStaffModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #EAE0DE', background: '#F6ECEA', color: '#56423D', fontWeight: 700, cursor: 'pointer' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#9D4124', color: '#FFFFFF', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
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
              Nhân viên: <strong style={{ color: '#1F1B1A' }}>{selectedStaffForPin?.fullName}</strong> ({selectedStaffForPin?.username})
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
                onClick={() => {
                  setShowPinModal(false);
                  setSelectedStaffForPin(null);
                  setNewPinCode('');
                }}
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

      {/* MODAL 5: POP-UP PHÂN CA CHO NHÂN VIÊN (TÌM KIẾM THEO TÊN, DROPDOWN, NÚT THÊM VÀO CA) */}
      {showAssignModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9995,
          background: 'rgba(31, 27, 26, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 40px rgba(31, 27, 26, 0.25)',
            border: '1px solid #EAE0DE',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
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
                  background: '#FCF1EF',
                  color: '#9D4124',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #F0E6E4'
                }}>
                  <Icon name="person_add" size={24} />
                </div>
                <div>
                  <h3 style={{
                    fontFamily: "'Epilogue', sans-serif",
                    fontWeight: 800,
                    fontSize: '1.15rem',
                    color: '#1F1B1A',
                    margin: 0
                  }}>
                    Phân Ca Cho Nhân Viên
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#89726B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{formatDisplayDate(selectedDate)}</span>
                    <span>•</span>
                    <span style={{
                      fontWeight: 700,
                      color: assignModalConfig.shiftType === 'MORNING' ? '#9D4124' : '#753400'
                    }}>
                      {assignModalConfig.shiftType === 'MORNING' ? 'Ca Sáng (06:00 - 14:00)' : 'Ca Chiều / Tối (14:00 - 22:00)'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseAssignModal}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#F0E6E4',
                  color: '#56423D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                title="Đóng pop-up"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* 1. Bộ chuyển đổi Ca & Vị trí trực tiếp */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignModalConfig(prev => ({ ...prev, shiftType: 'MORNING' }));
                      setAssignSelectedStaffId('');
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: assignModalConfig.shiftType === 'MORNING' ? '2px solid #9D4124' : '1px solid #EAE0DE',
                      background: assignModalConfig.shiftType === 'MORNING' ? '#FCF1EF' : '#FFFFFF',
                      color: assignModalConfig.shiftType === 'MORNING' ? '#9D4124' : '#56423D',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Icon name="wb_sunny" size={18} />
                    <span>Ca Sáng (06:00 - 14:00)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignModalConfig(prev => ({ ...prev, shiftType: 'EVENING' }));
                      setAssignSelectedStaffId('');
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: assignModalConfig.shiftType === 'EVENING' ? '2px solid #753400' : '1px solid #EAE0DE',
                      background: assignModalConfig.shiftType === 'EVENING' ? '#FFF3E0' : '#FFFFFF',
                      color: assignModalConfig.shiftType === 'EVENING' ? '#753400' : '#56423D',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Icon name="nights_stay" size={18} />
                    <span>Ca Tối (14:00 - 22:00)</span>
                  </button>
                </div>

                {/* Chọn Role Filter Tabs */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignModalConfig(prev => ({ ...prev, role: 'ALL' }));
                      setAssignSelectedStaffId('');
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: assignModalConfig.role === 'ALL' ? '1.5px solid #9D4124' : '1px solid #EAE0DE',
                      background: assignModalConfig.role === 'ALL' ? '#9D4124' : '#FFFFFF',
                      color: assignModalConfig.role === 'ALL' ? '#FFFFFF' : '#56423D',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Tất cả vai trò
                  </button>
                  {SHIFT_ROLES.map(r => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => {
                        setAssignModalConfig(prev => ({ ...prev, role: r.key }));
                        setAssignSelectedStaffId('');
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: assignModalConfig.role === r.key ? `1.5px solid ${r.color}` : '1px solid #EAE0DE',
                        background: assignModalConfig.role === r.key ? r.bg : '#FFFFFF',
                        color: assignModalConfig.role === r.key ? r.color : '#56423D',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Icon name={r.icon} size={14} />
                      <span>{r.shortLabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. KHUNG TÌM KIẾM TRONG TÊN CHỨA TỪ KHÓA TÌM KIẾM */}
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#1F1B1A', marginBottom: '6px' }}>
                  Khung tìm kiếm nhân viên (tìm theo tên chứa từ khóa):
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#89726B', pointerEvents: 'none', display: 'flex' }}>
                    <Icon name="search" size={18} />
                  </span>
                  <input
                    type="text"
                    value={assignSearchTerm}
                    onChange={(e) => {
                      setAssignSearchTerm(e.target.value);
                      setAssignSelectedStaffId('');
                    }}
                    placeholder="Nhập từ khóa tìm kiếm trong tên nhân viên (ví dụ: An, Linh, Văn...)"
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 38px',
                      borderRadius: '10px',
                      border: '1.5px solid #EAE0DE',
                      background: '#FFF8F6',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#1F1B1A',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s ease'
                    }}
                  />
                  {assignSearchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssignSearchTerm('');
                        setAssignSelectedStaffId('');
                      }}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#89726B',
                        cursor: 'pointer',
                        display: 'flex',
                        padding: '2px'
                      }}
                      title="Xóa từ khóa tìm kiếm"
                    >
                      <Icon name="cancel" size={16} />
                    </button>
                  )}
                </div>
                {assignSearchTerm && (
                  <div style={{ fontSize: '0.72rem', color: '#89726B', marginTop: '4px' }}>
                    Đang lọc nhân viên có tên chứa: <strong>"{assignSearchTerm}"</strong> ({availableStaffForAssignModal.length} nhân sự phù hợp)
                  </div>
                )}
              </div>

              {/* 3. DROPDOWN CHỌN NHÂN VIÊN */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1F1B1A' }}>
                    Dropdown chọn nhân viên vào ca:
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#89726B', fontWeight: 600 }}>
                    {availableStaffForAssignModal.length} nhân sự sẵn sàng (Active & Chưa có ca)
                  </span>
                </div>

                <select
                  value={assignSelectedStaffId}
                  onChange={(e) => setAssignSelectedStaffId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #EAE0DE',
                    background: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: assignSelectedStaffId ? '#1F1B1A' : '#89726B',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">
                    {availableStaffForAssignModal.length === 0
                      ? (assignSearchTerm ? `-- Không có nhân viên nào tên chứa "${assignSearchTerm}" --` : '-- Không có nhân sự khả dụng cho bộ phận này --')
                      : `-- Chọn nhân viên cần phân ca (${availableStaffForAssignModal.length}) --`}
                  </option>
                  {availableStaffForAssignModal.map(s => {
                    const roleCfg = SHIFT_ROLES.find(r => r.key === s.role);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.username}) — [{roleCfg ? roleCfg.shortLabel : s.role}] {s.phone ? `• ${s.phone}` : ''}
                      </option>
                    );
                  })}
                </select>

                {availableStaffForAssignModal.length === 0 && (
                  <div style={{
                    marginTop: '8px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#FDF4F2',
                    border: '1px solid #F8D7DA',
                    fontSize: '0.76rem',
                    color: '#93000A',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Icon name="info" size={16} />
                    <span>
                      {assignSearchTerm
                        ? `Không tìm thấy nhân viên nào có tên chứa từ khóa "${assignSearchTerm}".`
                        : `Toàn bộ nhân viên hoạt động của vị trí này đã được phân vào ca hoặc chưa có tài khoản khả dụng.`}
                    </span>
                  </div>
                )}
              </div>

              {/* CARD XEM TRƯỚC THÔNG TIN NHÂN VIÊN ĐÃ CHỌN TRONG DROPDOWN */}
              {assignSelectedStaffId && (() => {
                const selectedStaffObj = safeStaffList.find(s => String(s.id) === String(assignSelectedStaffId));
                if (!selectedStaffObj) return null;
                const avatar = getAvatarConfig(selectedStaffObj);
                const roleCfg = SHIFT_ROLES.find(r => r.key === selectedStaffObj.role);

                return (
                  <div style={{
                    background: '#FCF1EF',
                    border: '1.5px solid #F0E6E4',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: avatar.bg,
                        color: avatar.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        flexShrink: 0
                      }}>
                        {avatar.initials}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selectedStaffObj.fullName}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#89726B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#9D4124' }}>
                            {selectedStaffObj.username}
                          </span>
                          {selectedStaffObj.phone && <span>• {selectedStaffObj.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        background: roleCfg ? roleCfg.bg : '#F6ECEA',
                        color: roleCfg ? roleCfg.color : '#9D4124',
                        border: `1px solid ${roleCfg ? roleCfg.borderColor : '#EAE0DE'}`
                      }}>
                        {roleCfg ? roleCfg.shortLabel : selectedStaffObj.role}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        background: '#DDE8AB',
                        color: '#181E00'
                      }}>
                        Hoạt động
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* 4. NÚT THÊM VÀO CA & NÚT ĐÓNG */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={handleCloseAssignModal}
                  style={{
                    flex: '1',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: '#F0E6E4',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    color: '#56423D',
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={!assignSelectedStaffId}
                  onClick={handleSubmitAssignModal}
                  style={{
                    flex: '2',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    background: assignSelectedStaffId ? '#9D4124' : '#EAE0DE',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: assignSelectedStaffId ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: assignSelectedStaffId ? '0 3px 10px rgba(157, 65, 36, 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon name="add_circle" size={18} />
                  <span>Thêm Vào Ca Trực</span>
                </button>
              </div>

              {/* 5. DANH SÁCH NHÂN SỰ ĐÃ PHÂN TRONG CA NÀY (ĐỂ QUẢN LÝ TIỆN THEO DÕI & HỦY NẾU CẦN) */}
              <div style={{ marginTop: '6px', paddingTop: '14px', borderTop: '1px dashed #EAE0DE' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1F1B1A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="groups" size={16} />
                    <span>Đã phân trong {assignModalConfig.shiftType === 'MORNING' ? 'Ca Sáng' : 'Ca Tối'}:</span>
                    <span style={{
                      background: '#FCF1EF',
                      color: '#9D4124',
                      padding: '1px 7px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      {assignedStaffInModalShift.length} NV
                    </span>
                  </div>
                </div>

                <div style={{
                  maxHeight: '140px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  {assignedStaffInModalShift.length === 0 ? (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#89726B',
                      textAlign: 'center',
                      padding: '12px',
                      background: '#FAF7F5',
                      borderRadius: '8px',
                      fontStyle: 'italic'
                    }}>
                      Chưa có nhân sự nào trong {assignModalConfig.shiftType === 'MORNING' ? 'ca sáng' : 'ca tối'}
                    </div>
                  ) : (
                    assignedStaffInModalShift.map(s => {
                      const avatar = getAvatarConfig(s);
                      const roleCfg = SHIFT_ROLES.find(r => r.key === s.role);
                      return (
                        <div
                          key={s.id}
                          style={{
                            background: '#FAF7F5',
                            border: '1px solid #F0E6E4',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: avatar.bg,
                              color: avatar.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.65rem',
                              flexShrink: 0
                            }}>
                              {avatar.initials}
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {s.fullName}
                            </span>
                            <span style={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              color: roleCfg ? roleCfg.color : '#89726B',
                              background: roleCfg ? roleCfg.bg : '#F0E6E4',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              flexShrink: 0
                            }}>
                              {roleCfg ? roleCfg.shortLabel : s.role}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveShift(s.id, s.fullName, assignModalConfig.shiftType === 'MORNING' ? 'Ca Sáng' : 'Ca Tối')}
                            title={`Hủy ca của ${s.fullName}`}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#9D4124',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '2px',
                              borderRadius: '4px',
                              flexShrink: 0
                            }}
                          >
                            <Icon name="close" size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: IN LỊCH PHÂN CA THEO TUẦN (A4 LANDSCAPE) */}
      {showWeeklyPrintModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(31, 27, 26, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          overflowY: 'auto'
        }}>
          {/* Style tag điều khiển in ấn của trình duyệt */}
          <style>{`
            @media print {
              @page {
                size: A4 landscape;
                margin: 8mm 6mm;
              }
              body * {
                visibility: hidden !important;
              }
              #weekly-schedule-print-sheet, #weekly-schedule-print-sheet * {
                visibility: visible !important;
              }
              #weekly-schedule-print-sheet {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #FFFFFF !important;
                color: #000000 !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print {
                display: none !important;
              }
              .print-table {
                width: 100% !important;
                border-collapse: collapse !important;
                font-size: 11px !important;
              }
              .print-table th, .print-table td {
                border: 1px solid #444444 !important;
                padding: 4px 6px !important;
                color: #000000 !important;
              }
              .print-footer-signatures {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }
          `}</style>

          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '1240px',
            maxHeight: '92vh',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
            overflow: 'hidden'
          }}>
            {/* Modal Header Controls (no-print) */}
            <div className="no-print" style={{
              padding: '18px 24px',
              borderBottom: '1px solid #EAE0DE',
              background: '#FFFFFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FCF1EF', color: '#9D4124', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="local_printshop" size={24} />
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                    In Bảng Phân Công Lịch Trực Theo Tuần
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#89726B' }}>
                    Khổ giấy chuẩn A4 Ngang (Landscape) • Dành cho bảng tin vận hành FOH & BOH
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleExportExcel(printWeekDate)}
                  disabled={isExportingExcel}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    border: '1.5px solid #2E7D32',
                    background: '#E8F5E9',
                    color: '#1B5E20',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: isExportingExcel ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 10px rgba(46, 125, 50, 0.15)',
                    transition: 'all 0.15s ease'
                  }}
                  title="Tải bảng phân công lịch trực tuần dưới dạng tệp Microsoft Excel (.xls)"
                >
                  <Icon
                    name={isExportingExcel ? 'progress_activity' : 'description'}
                    size={20}
                    style={{ animation: isExportingExcel ? 'spin 1s linear infinite' : 'none', color: '#1B5E20' }}
                  />
                  <span>{isExportingExcel ? 'Đang tạo Excel...' : 'Xuất File Excel (.xls)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#9D4124',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(157, 65, 36, 0.3)'
                  }}
                >
                  <Icon name="print" size={20} />
                  <span>In Ngay / Xuất PDF (A4 Ngang)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowWeeklyPrintModal(false)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#F6ECEA',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#56423D'
                  }}
                  title="Đóng"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>
            </div>

            {/* Filter & Week Stepper Bar (no-print) */}
            <div className="no-print" style={{
              padding: '12px 24px',
              background: '#FCF1EF',
              borderBottom: '1px solid #EAE0DE',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {/* Stepper Tuần */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleStepWeek(-1)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #EAE0DE',
                    background: '#FFFFFF',
                    color: '#56423D',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Icon name="chevron_left" size={18} />
                  <span>Tuần Trước</span>
                </button>

                <div style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  border: '1.5px solid #FFDBC9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#1F1B1A'
                }}>
                  <Icon name="date_range" size={18} style={{ color: '#9D4124' }} />
                  <span>
                    Tuần: {currentPrintWeekInfo.startDisplay} - {currentPrintWeekInfo.endDisplay}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleStepWeek(1)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #EAE0DE',
                    background: '#FFFFFF',
                    color: '#56423D',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <span>Tuần Sau</span>
                  <Icon name="chevron_right" size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPrintWeekDate(todayStr);
                    fetchWeeklySchedule(todayStr);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #9D4124',
                    background: '#FFF8F6',
                    color: '#9D4124',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Về Tuần Này
                </button>
              </div>

              {/* Lọc vai trò & Chế độ xem */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#89726B', fontWeight: 600 }}>Lọc vai trò:</span>
                  <select
                    value={printRoleFilter}
                    onChange={(e) => setPrintRoleFilter(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #EAE0DE',
                      background: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    <option value="ALL">Tất cả ({safeStaffList.length})</option>
                    <option value="MANAGER">Quản lý (Manager)</option>
                    <option value="CASHIER">Thu ngân (Cashier)</option>
                    <option value="WAITER">Phục vụ (Waiter)</option>
                    <option value="KITCHEN">Bếp & KDS (Kitchen)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', background: '#EAE0DE', padding: '2px', borderRadius: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPrintViewMode('MATRIX')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: printViewMode === 'MATRIX' ? '#FFFFFF' : 'transparent',
                      color: printViewMode === 'MATRIX' ? '#9D4124' : '#56423D',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Bảng Ma Trận (Chuẩn A4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintViewMode('CARDS')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: printViewMode === 'CARDS' ? '#FFFFFF' : 'transparent',
                      color: printViewMode === 'CARDS' ? '#9D4124' : '#56423D',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Lưới 7 Ngày
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Printable Sheet Container */}
            <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1, background: '#FDFCFA' }}>
              <div
                id="weekly-schedule-print-sheet"
                style={{
                  background: '#FFFFFF',
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid #EAE0DE',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
                }}
              >
                {/* Print Sheet Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1F1B1A', paddingBottom: '14px', marginBottom: '18px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.25rem', color: '#9D4124', letterSpacing: '0.04em' }}>
                        ROMS RESTAURANT & BAR
                      </span>
                      <span style={{ fontSize: '0.72rem', background: '#F2F8ED', color: '#3A5A20', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                        Toàn Nhà Hàng
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#56423D', marginTop: '3px' }}>
                      Hệ thống vận hành ẩm thực thông minh ROMS
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#56423D' }}>
                    <div>Mã biểu mẫu: <strong>BM-NS-04/ROMS</strong></div>
                    <div>Ngày lập: <strong>{new Date().toLocaleDateString('vi-VN')}</strong></div>
                    <div>Người lập: <strong>Quản lý nhà hàng</strong></div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                  <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.45rem', color: '#1F1B1A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    BẢNG PHÂN CÔNG LỊCH TRỰC NHÂN SỰ THEO TUẦN
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: '#56423D', marginTop: '4px', fontWeight: 600 }}>
                    Áp dụng từ: <strong>Thứ Hai, {currentPrintWeekInfo.startDisplay}</strong> đến <strong>Chủ Nhật, {currentPrintWeekInfo.endDisplay}</strong>
                  </div>
                </div>

                {loadingWeeklySchedules ? (
                  <div style={{ textAlign: 'center', padding: '50px 0' }}>
                    <Icon name="progress_activity" size={32} style={{ animation: 'spin 1s linear infinite', color: '#9D4124' }} />
                    <div style={{ marginTop: '10px', fontSize: '0.88rem', color: '#89726B' }}>Đang nạp dữ liệu phân ca tuần...</div>
                  </div>
                ) : printViewMode === 'MATRIX' ? (
                  /* MATRIX VIEW: Dạng Bảng Chuẩn Khổ A4 */
                  <div>
                    <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: '#FCF1EF' }}>
                          <th style={{ border: '1px solid #D5C2BD', padding: '8px 4px', textAlign: 'center', width: '36px' }}>STT</th>
                          <th style={{ border: '1px solid #D5C2BD', padding: '8px 8px', textAlign: 'left', width: '85px' }}>Mã NV</th>
                          <th style={{ border: '1px solid #D5C2BD', padding: '8px 10px', textAlign: 'left', minWidth: '130px' }}>Họ và Tên</th>
                          <th style={{ border: '1px solid #D5C2BD', padding: '8px 6px', textAlign: 'center', width: '85px' }}>Vai Trò</th>
                          {currentPrintWeekInfo.days.map((day) => (
                            <th key={day.dateStr} style={{
                              border: '1px solid #D5C2BD',
                              padding: '8px 4px',
                              textAlign: 'center',
                              background: day.dateStr === todayStr ? '#FFDBC9' : '#FCF1EF',
                              minWidth: '95px'
                            }}>
                              <div style={{ fontWeight: 800, color: '#1F1B1A', fontSize: '0.82rem' }}>{day.dayLabel}</div>
                              <div style={{ fontSize: '0.72rem', color: '#89726B', fontWeight: 600 }}>{day.displayDate}</div>
                            </th>
                          ))}
                          <th style={{ border: '1px solid #D5C2BD', padding: '8px 4px', textAlign: 'center', width: '60px' }}>Tổng Ca</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPrintStaff.length === 0 ? (
                          <tr>
                            <td colSpan={12} style={{ textAlign: 'center', padding: '30px', color: '#89726B' }}>
                              Không tìm thấy nhân viên nào phù hợp bộ lọc!
                            </td>
                          </tr>
                        ) : (
                          filteredPrintStaff.map((staff, idx) => {
                            const staffWeekSchedules = weeklySchedules.filter(s => s.staffId === staff.id);
                            const totalShifts = staffWeekSchedules.length;

                            return (
                              <tr key={staff.id} style={{ borderBottom: '1px solid #EAE0DE', background: idx % 2 === 0 ? '#FFFFFF' : '#FDFCFA' }}>
                                <td style={{ border: '1px solid #EAE0DE', padding: '7px 4px', textAlign: 'center', fontWeight: 700, fontFamily: 'monospace' }}>
                                  {String(idx + 1).padStart(2, '0')}
                                </td>
                                <td style={{ border: '1px solid #EAE0DE', padding: '7px 8px', fontFamily: 'monospace', fontWeight: 700, color: '#9D4124' }}>
                                  {staff.username}
                                </td>
                                <td style={{ border: '1px solid #EAE0DE', padding: '7px 10px', fontWeight: 700, color: '#1F1B1A' }}>
                                  {staff.fullName}
                                </td>
                                <td style={{ border: '1px solid #EAE0DE', padding: '7px 6px', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: staff.role === 'MANAGER' ? '#9D4124' : staff.role === 'CASHIER' ? '#FFDBC9' : staff.role === 'KITCHEN' ? '#FFDAD6' : '#DDE8AB',
                                    color: staff.role === 'MANAGER' ? '#FFF' : staff.role === 'CASHIER' ? '#753400' : staff.role === 'KITCHEN' ? '#93000A' : '#181E00'
                                  }}>
                                    {staff.roleLabel}
                                  </span>
                                </td>
                                {currentPrintWeekInfo.days.map((day) => {
                                  const dayShifts = weeklySchedules.filter(s => s.staffId === staff.id && s.workDate === day.dateStr);
                                  const hasMorning = dayShifts.some(s => s.shiftType === 'MORNING');
                                  const hasEvening = dayShifts.some(s => s.shiftType === 'EVENING');

                                  return (
                                    <td key={day.dateStr} style={{ border: '1px solid #EAE0DE', padding: '5px 4px', textAlign: 'center' }}>
                                      {hasMorning && hasEvening ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                                          <span style={{ fontSize: '0.68rem', padding: '2px 5px', borderRadius: '4px', background: '#FFF3E0', color: '#B26A00', fontWeight: 700, border: '1px solid #FFE0B2', display: 'block', width: '85px' }}>
                                            Sáng (06-14h)
                                          </span>
                                          <span style={{ fontSize: '0.68rem', padding: '2px 5px', borderRadius: '4px', background: '#EFEBE9', color: '#4E342E', fontWeight: 700, border: '1px solid #D7CCC8', display: 'block', width: '85px' }}>
                                            Tối (14-22h)
                                          </span>
                                        </div>
                                      ) : hasMorning ? (
                                        <span style={{ fontSize: '0.68rem', padding: '2px 5px', borderRadius: '4px', background: '#FFF3E0', color: '#B26A00', fontWeight: 700, border: '1px solid #FFE0B2', display: 'inline-block', width: '85px' }}>
                                          Sáng (06-14h)
                                        </span>
                                      ) : hasEvening ? (
                                        <span style={{ fontSize: '0.68rem', padding: '2px 5px', borderRadius: '4px', background: '#EFEBE9', color: '#4E342E', fontWeight: 700, border: '1px solid #D7CCC8', display: 'inline-block', width: '85px' }}>
                                          Tối (14-22h)
                                        </span>
                                      ) : (
                                        <span style={{ fontSize: '0.72rem', color: '#A89E9B', fontStyle: 'italic' }}>
                                          OFF
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                                <td style={{ border: '1px solid #EAE0DE', padding: '7px 4px', textAlign: 'center', fontWeight: 800, color: '#9D4124', fontSize: '0.9rem' }}>
                                  {totalShifts}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#FCF1EF', fontWeight: 800 }}>
                          <td colSpan={4} style={{ border: '1px solid #D5C2BD', padding: '8px 10px', textAlign: 'right', fontSize: '0.78rem' }}>
                            Tổng NV Ca Sáng (06:00 - 14:00):
                          </td>
                          {currentPrintWeekInfo.days.map(day => {
                            const count = weeklySchedules.filter(s => s.workDate === day.dateStr && s.shiftType === 'MORNING').length;
                            return (
                              <td key={day.dateStr} style={{ border: '1px solid #D5C2BD', padding: '6px 4px', textAlign: 'center', color: '#B26A00', fontWeight: 800 }}>
                                {count} NV
                              </td>
                            );
                          })}
                          <td style={{ border: '1px solid #D5C2BD', textAlign: 'center', color: '#B26A00', fontWeight: 800 }}>
                            {weeklySchedules.filter(s => s.shiftType === 'MORNING').length}
                          </td>
                        </tr>
                        <tr style={{ background: '#FCF1EF', fontWeight: 800 }}>
                          <td colSpan={4} style={{ border: '1px solid #D5C2BD', padding: '8px 10px', textAlign: 'right', fontSize: '0.78rem' }}>
                            Tổng NV Ca Tối (14:00 - 22:00):
                          </td>
                          {currentPrintWeekInfo.days.map(day => {
                            const count = weeklySchedules.filter(s => s.workDate === day.dateStr && s.shiftType === 'EVENING').length;
                            return (
                              <td key={day.dateStr} style={{ border: '1px solid #D5C2BD', padding: '6px 4px', textAlign: 'center', color: '#4E342E', fontWeight: 800 }}>
                                {count} NV
                              </td>
                            );
                          })}
                          <td style={{ border: '1px solid #D5C2BD', textAlign: 'center', color: '#4E342E', fontWeight: 800 }}>
                            {weeklySchedules.filter(s => s.shiftType === 'EVENING').length}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  /* CARDS VIEW: Lưới 7 Ngày Theo Từng Ca */
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    {currentPrintWeekInfo.days.map(day => {
                      const morningInDay = weeklySchedules.filter(s => s.workDate === day.dateStr && s.shiftType === 'MORNING');
                      const eveningInDay = weeklySchedules.filter(s => s.workDate === day.dateStr && s.shiftType === 'EVENING');

                      return (
                        <div key={day.dateStr} style={{ border: '1px solid #EAE0DE', borderRadius: '12px', background: '#FFFFFF', padding: '12px', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #F0E6E4', marginBottom: '10px' }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1F1B1A' }}>{day.dayLabel}</div>
                              <div style={{ fontSize: '0.72rem', color: '#89726B' }}>{day.displayDate}/{day.year}</div>
                            </div>
                            <span style={{ fontSize: '0.72rem', background: '#FCF1EF', color: '#9D4124', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                              {morningInDay.length + eveningInDay.length} lượt trực
                            </span>
                          </div>

                          {/* Ca Sáng */}
                          <div style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, color: '#B26A00', marginBottom: '6px' }}>
                              <span>☀️ Ca Sáng (06-14h)</span>
                              <span>{morningInDay.length} NV</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {morningInDay.length === 0 ? (
                                <div style={{ fontSize: '0.72rem', color: '#A89E9B', fontStyle: 'italic' }}>Chưa phân ca</div>
                              ) : (
                                morningInDay.map(s => (
                                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFF8F6', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                                    <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{s.fullName}</span>
                                    <span style={{ fontSize: '0.68rem', color: '#89726B' }}>{s.roleLabel}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Ca Tối */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, color: '#4E342E', marginBottom: '6px' }}>
                              <span>🌙 Ca Tối (14-22h)</span>
                              <span>{eveningInDay.length} NV</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {eveningInDay.length === 0 ? (
                                <div style={{ fontSize: '0.72rem', color: '#A89E9B', fontStyle: 'italic' }}>Chưa phân ca</div>
                              ) : (
                                eveningInDay.map(s => (
                                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F6ECEA', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                                    <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{s.fullName}</span>
                                    <span style={{ fontSize: '0.68rem', color: '#89726B' }}>{s.roleLabel}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Print Footer Signatures */}
                <div className="print-footer-signatures" style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid #1F1B1A' }}>
                  <div style={{ fontSize: '0.75rem', color: '#56423D', marginBottom: '18px', fontStyle: 'italic' }}>
                    * Ghi chú: Nhân viên có mặt trước ca trực 15 phút để họp giao ban và nhận bàn giao vị trí. Mọi yêu cầu đổi ca phải thông báo cho Quản lý trước ít nhất 24 giờ.
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', fontSize: '0.82rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#1F1B1A' }}>NGƯỜI LẬP LỊCH</div>
                      <div style={{ fontSize: '0.72rem', color: '#89726B' }}>(Ký và ghi rõ họ tên)</div>
                      <div style={{ height: '60px' }}></div>
                      <div style={{ fontWeight: 700, color: '#1F1B1A' }}>Quản Lý Ca Trực</div>
                    </div>

                    <div>
                      <div style={{ fontWeight: 800, color: '#1F1B1A' }}>ĐIỀU PHỐI BẾP (BOH)</div>
                      <div style={{ fontSize: '0.72rem', color: '#89726B' }}>(Ký và ghi rõ họ tên)</div>
                      <div style={{ height: '60px' }}></div>
                      <div style={{ fontWeight: 700, color: '#1F1B1A' }}>Bếp Trưởng / BOH Lead</div>
                    </div>

                    <div>
                      <div style={{ fontWeight: 800, color: '#1F1B1A' }}>BAN QUẢN LÝ NHÀ HÀNG</div>
                      <div style={{ fontSize: '0.72rem', color: '#89726B' }}>(Ký duyệt, đóng dấu)</div>
                      <div style={{ height: '60px' }}></div>
                      <div style={{ fontWeight: 700, color: '#1F1B1A' }}>Ban Quản Trị ROMS</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
