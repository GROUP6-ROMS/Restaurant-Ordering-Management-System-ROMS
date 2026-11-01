import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../common/Icon';
import { staffApi } from '../../api/staffApi';
import { subscribeRealtimeEvents } from '../../utils/realtimeSync';
import { useDialog } from '../../context/DialogContext';

/**
 * ===================================================================
 * 1. BẢNG MÀU & BIỂU TƯỢNG VAI TRÒ CHUẨN THIẾT KẾ ROMS SUITE
 * ===================================================================
 * Giúp avatar và nhãn vai trò hiển thị đồng bộ màu sắc với trang Quản lý nhân sự
 */
const ROLE_CONFIG = {
    MANAGER: {
        label: 'Quản Lý',
        icon: 'manage_accounts',
        bg: '#FCF1EF',
        color: '#9D4124',
        badgeBg: '#9D4124',
        badgeColor: '#FFFFFF'
    },
    CASHIER: {
        label: 'Thu Ngân',
        icon: 'point_of_sale',
        bg: '#FFF3E0',
        color: '#753400',
        badgeBg: '#FFDBC9',
        badgeColor: '#753400'
    },
    WAITER: {
        label: 'Phục Vụ',
        icon: 'table_restaurant',
        bg: '#F1F8E9',
        color: '#181E00',
        badgeBg: '#DDE8AB',
        badgeColor: '#181E00'
    },
    KITCHEN: {
        label: 'Bếp / KDS',
        icon: 'skillet',
        bg: '#FFEBEE',
        color: '#93000A',
        badgeBg: '#FFDAD6',
        badgeColor: '#93000A'
    }
};

/**
 * ===================================================================
 * 2. THUẬT TOÁN NHẬN DIỆN CA TRỰC ĐỘNG THEO THỜI GIAN THỰC
 * ===================================================================
 * Quy đổi giờ hiện tại ra tổng số phút trong ngày để so sánh:
 * - Ca Sáng:  06:00 (360 phút)  -> 14:00 (840 phút)  = 480 phút
 * - Ca Tối:   14:00 (840 phút)  -> 22:00 (1320 phút) = 480 phút
 * - Nghỉ Ca:  22:00 -> 06:00 hôm sau
 */
export const calculateShiftInfo = (date = new Date()) => {
    // Lấy tổng số phút từ 00:00 của ngày hôm nay
    const currentMinutes = date.getHours() * 60 + date.getMinutes();

    const morningStart = 6 * 60;   // 06:00
    const morningEnd = 14 * 60;    // 14:00
    const eveningStart = 14 * 60;  // 14:00
    const eveningEnd = 22 * 60;    // 22:00

    // TRƯỜNG HỢP 1: Đang trong CA SÁNG (06:00 - 14:00)
    if (currentMinutes >= morningStart && currentMinutes < morningEnd) {
        const elapsed = currentMinutes - morningStart; // Số phút ca đã trôi qua
        const duration = morningEnd - morningStart;    // Tổng thời lượng ca (480 phút)
        const progress = Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100)));
        const remaining = morningEnd - currentMinutes; // Số phút còn lại
        const remH = Math.floor(remaining / 60);
        const remM = remaining % 60;
        const isEndingSoon = remaining <= 30;          // Cảnh báo nếu còn dưới 30 phút

        return {
            type: 'MORNING',
            name: 'Ca Sáng',
            timeRange: '06:00 - 14:00',
            isActive: true,
            isEndingSoon,
            progress,
            remainingText: `Còn ${remH > 0 ? `${remH}h ` : ''}${remM}m`,
            statusText: isEndingSoon ? 'Sắp hết ca' : 'Đang hoạt động',
            statusColor: isEndingSoon ? '#D97706' : '#596232', // Vàng cam nếu sắp hết ca, xanh lá nếu bình thường
            dotClass: isEndingSoon ? '' : 'pulse-dot'          // Hiệu ứng nhịp thở CSS
        };
    }

    // TRƯỜNG HỢP 2: Đang trong CA TỐI (14:00 - 22:00)
    if (currentMinutes >= eveningStart && currentMinutes < eveningEnd) {
        const elapsed = currentMinutes - eveningStart;
        const duration = eveningEnd - eveningStart;
        const progress = Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100)));
        const remaining = eveningEnd - currentMinutes;
        const remH = Math.floor(remaining / 60);
        const remM = remaining % 60;
        const isEndingSoon = remaining <= 30;

        return {
            type: 'EVENING',
            name: 'Ca Tối',
            timeRange: '14:00 - 22:00',
            isActive: true,
            isEndingSoon,
            progress,
            remainingText: `Còn ${remH > 0 ? `${remH}h ` : ''}${remM}m`,
            statusText: isEndingSoon ? 'Sắp giao ca' : 'Đang hoạt động',
            statusColor: isEndingSoon ? '#D97706' : '#596232',
            dotClass: isEndingSoon ? '' : 'pulse-dot'
        };
    }

    // TRƯỜNG HỢP 3: NGOÀI GIỜ CA TRỰC (22:00 - 06:00)
    return {
        type: 'CLOSED',
        name: 'Nghỉ Ca',
        timeRange: '22:00 - 06:00',
        isActive: false,
        isEndingSoon: false,
        progress: 0,
        remainingText: 'Ngoài giờ trực',
        statusText: 'Đã đóng ca',
        statusColor: '#89726B', // Màu xám trầm
        dotClass: ''
    };
};

/**
 * ===================================================================
 * 3. COMPONENT CHÍNH: ShiftStatusWidget
 * ===================================================================
 */
export default function ShiftStatusWidget({ currentTime = new Date() }) {
    const navigate = useNavigate();
    const widgetRef = useRef(null);   // Tham chiếu đến thẻ widget ở sidebar
    const popoverRef = useRef(null);  // Tham chiếu đến hộp Popover Live Roster

    // State quản lý đóng/mở popover
    const [isOpen, setIsOpen] = useState(false);
    // State quản lý trạng thái tải dữ liệu
    const [loading, setLoading] = useState(false);
    // Danh sách toàn bộ nhân sự đang online (isOnShift === true)
    const [onlineStaffList, setOnlineStaffList] = useState([]);
    // Tổng số nhân sự có trong nhà hàng
    const [totalStaffCount, setTotalStaffCount] = useState(0);
    // Bộ lọc vai trò đang chọn trong popover ('ALL', 'WAITER', 'KITCHEN', 'CASHIER', 'MANAGER')
    const [activeRoleFilter, setActiveRoleFilter] = useState('ALL');

    // Tính toán ca trực hiện tại theo prop currentTime truyền từ Layout
    const shiftInfo = calculateShiftInfo(currentTime);

    /**
     * Gọi API Backend lấy danh sách nhân viên thực tế
     * @param {boolean} isSilent - Nếu là true (polling ngầm), không bật spinner làm phiền mắt
     */
    const fetchStaffStatus = useCallback(async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            const res = await staffApi.getAllStaff();
            if (res?.data?.success && Array.isArray(res.data.data)) {
                const all = res.data.data;
                setTotalStaffCount(all.length);
                // Lọc những nhân sự có cờ isOnShift = true (đã login vào ca trực)
                const onShift = all.filter(s => s.isOnShift);
                setOnlineStaffList(onShift);
            }
        } catch (err) {
            console.warn('[ShiftStatusWidget] Không thể tải trạng thái nhân sự:', err);
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, []);

    const { showConfirm, showAlert, showToast } = useDialog();

    // 1. Quản lý đặt lại toàn bộ ca trực về Ngoại tuyến (trừ Quản lý đang thao tác)
    const handleResetAllShifts = async () => {
        const confirmed = await showConfirm({
            title: 'Đặt lại toàn bộ ca trực',
            message: 'Đặt lại toàn bộ nhân sự ca trực về Ngoại tuyến?\n(Phiên làm việc của Quản lý hiện tại vẫn được bảo lưu an toàn)',
            confirmText: 'Đặt lại ca',
            type: 'danger'
        });
        if (!confirmed) return;

        try {
            setLoading(true);
            const res = await staffApi.resetAllShifts();
            if (res?.data?.success) {
                showToast(res.data.message || 'Đã đặt lại toàn bộ ca trực thành công!', 'success');
                await fetchStaffStatus(false);
            }
        } catch (err) {
            console.error('Lỗi khi đặt lại ca:', err);
            showAlert({
                title: 'Lỗi đặt lại ca trực',
                message: err.response?.data?.message || 'Không thể đặt lại ca trực. Vui lòng thử lại!',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // 2. Chuyển đổi trạng thái ca của một nhân viên cụ thể
    const handleToggleStaffShift = async (staffId, staffName) => {
        const confirmed = await showConfirm({
            title: 'Chuyển trạng thái ca',
            message: `Chuyển nhân viên "${staffName}" về trạng thái Ngoại tuyến?`,
            confirmText: 'Chuyển ngoại tuyến',
            type: 'warning'
        });
        if (!confirmed) return;

        try {
            setLoading(true);
            const res = await staffApi.toggleShiftStatus(staffId);
            if (res?.data?.success) {
                showToast(`Đã chuyển ${staffName} sang Ngoại tuyến`, 'success');
                await fetchStaffStatus(false);
            }
        } catch (err) {
            console.error('Lỗi chuyển trạng thái ca:', err);
            showAlert({
                title: 'Lỗi cập nhật ca',
                message: err.response?.data?.message || 'Không thể chuyển trạng thái ca.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // 3. Tự động tải dữ liệu lần đầu, Polling ngầm mỗi 25s VÀ tự cập nhật khi click quay lại tab
    useEffect(() => {
        fetchStaffStatus(false);
        const timer = setInterval(() => fetchStaffStatus(true), 25000);

        // Bắt sự kiện khi Quản lý click quay lại tab trình duyệt này
        const handleFocus = () => fetchStaffStatus(true);
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(timer);
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchStaffStatus]);

    // 2. Lắng nghe WebSocket Realtime STOMP (khi có sự kiện login, logout, chốt ca)
    useEffect(() => {
        const unsubscribe = subscribeRealtimeEvents((event) => {
            if (
                event?.type === 'STAFF_LOGIN' ||
                event?.type === 'STAFF_LOGOUT' ||
                event?.type === 'SHIFT_CLOSED'
            ) {
                // Cập nhật lại số lượng ngay lập tức 0 delay
                fetchStaffStatus(true);
            }
        });
        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, [fetchStaffStatus]);

    // 3. Xử lý đóng Popover khi Click chuột ra ngoài hoặc nhấn phím ESC
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                isOpen &&
                popoverRef.current &&
                !popoverRef.current.contains(e.target) &&
                widgetRef.current &&
                !widgetRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    // Thống kê số lượng theo từng vai trò phục vụ thanh bộ lọc
    const roleCounts = {
        ALL: onlineStaffList.length,
        MANAGER: onlineStaffList.filter(s => s.role === 'MANAGER').length,
        WAITER: onlineStaffList.filter(s => s.role === 'WAITER').length,
        KITCHEN: onlineStaffList.filter(s => s.role === 'KITCHEN').length,
        CASHIER: onlineStaffList.filter(s => s.role === 'CASHIER').length
    };

    // Danh sách nhân sự sau khi lọc theo vai trò
    const filteredStaff = activeRoleFilter === 'ALL'
        ? onlineStaffList
        : onlineStaffList.filter(s => s.role === activeRoleFilter);

    return (
        <div style={{ position: 'relative' }}>
            {/* ===================================================================
          A. THẺ WIDGET HIỂN THỊ CHÍNH (NẰM Ở CUỐI SIDEBAR TRÁI)
          =================================================================== */}
            <div
                ref={widgetRef}
                onClick={() => setIsOpen(prev => !prev)}
                role="button"
                tabIndex={0}
                title="Bấm để xem chi tiết danh sách nhân sự đang trực ca"
                style={{
                    background: '#FFFFFF',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: isOpen ? '1.5px solid #9D4124' : '1px solid #EAE0DE',
                    boxShadow: isOpen
                        ? '0 6px 18px rgba(157, 65, 36, 0.12)'
                        : '0 2px 6px rgba(0, 0, 0, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                    if (!isOpen) {
                        e.currentTarget.style.borderColor = '#C58F80';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isOpen) {
                        e.currentTarget.style.borderColor = '#EAE0DE';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }
                }}
            >
                {/* Hàng 1: Tiêu đề + Chấm đèn tín hiệu nhịp thở */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#89726B', fontWeight: 700, textTransform: 'uppercase' }}>
                        Trạng thái ca trực
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                            className={shiftInfo.dotClass}
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: shiftInfo.statusColor,
                                display: 'inline-block'
                            }}
                        />
                    </div>
                </div>

                {/* Hàng 2: Số lượng nhân sự Online thực tế từ Backend + Mũi tên */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1F1B1A' }}>
                        {onlineStaffList.length} Nhân sự đang online
                    </div>
                    <Icon
                        name={isOpen ? 'expand_more' : 'chevron_right'}
                        size={18}
                        style={{ color: '#89726B', transition: 'transform 0.2s' }}
                    />
                </div>

                {/* Hàng 3: Tên ca & Khung giờ tự động + Thời gian còn lại */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                    <div style={{ fontSize: '0.73rem', color: shiftInfo.statusColor, fontWeight: 600 }}>
                        {shiftInfo.name}: {shiftInfo.timeRange}
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#89726B' }}>
                        {shiftInfo.remainingText}
                    </span>
                </div>

                {/* Hàng 4: Thanh tiến độ ca trực (Shift Progress Bar mỏng tinh tế) */}
                {shiftInfo.isActive && (
                    <div style={{
                        width: '100%',
                        height: '3px',
                        background: '#F0E7E5',
                        borderRadius: '999px',
                        marginTop: '8px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${shiftInfo.progress}%`,
                            height: '100%',
                            background: shiftInfo.isEndingSoon ? '#D97706' : '#596232',
                            transition: 'width 0.4s ease'
                        }} />
                    </div>
                )}
            </div>

            {/* ===================================================================
          B. FLYOUT POPOVER: XEM NHANH DANH SÁCH NHÂN SỰ ĐANG TRỰC
          =================================================================== */}
            {isOpen && (
                <div
                    ref={popoverRef}
                    style={{
                        position: 'fixed',
                        left: '252px',
                        bottom: '20px',
                        width: '360px',
                        maxHeight: '520px',
                        background: '#FFFFFF',
                        borderRadius: '18px',
                        border: '1.5px solid #EAE0DE',
                        boxShadow: '0 16px 40px rgba(44, 34, 30, 0.18)',
                        zIndex: 1050,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        animation: 'fadeIn 0.15s ease-out'
                    }}
                >
                    {/* 1. Header của Popover */}
                    <div style={{
                        padding: '14px 16px',
                        background: '#FFF8F6',
                        borderBottom: '1px solid #EAE0DE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: '#FCF1EF',
                                color: '#9D4124',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Icon name="badge" size={18} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1F1B1A' }}>
                                    Nhân Sự Ca Hiện Tại
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#89726B' }}>
                                    {shiftInfo.name} ({shiftInfo.timeRange}) • {shiftInfo.statusText}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {/* Nút đặt lại toàn bộ ca trực về ngoại tuyến (dành cho Quản lý xóa ghost sessions) */}
                            <button
                                type="button"
                                onClick={handleResetAllShifts}
                                title="Đặt lại toàn bộ ca trực về Ngoại tuyến (trừ Quản lý hiện tại)"
                                disabled={loading}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#BA1A1A',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Icon name="restart_alt" size={18} />
                            </button>
                            {/* Nút làm mới danh sách */}
                            <button
                                type="button"
                                onClick={() => fetchStaffStatus(false)}
                                title="Làm mới danh sách nhân sự"
                                disabled={loading}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#89726B',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Icon name="refresh" size={18} style={{ transform: loading ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s' }} />
                            </button>
                            {/* Nút đóng popover */}
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                title="Đóng cửa sổ"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#89726B',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Icon name="close" size={18} />
                            </button>
                        </div>
                    </div>

                    {/* 2. Thanh lọc vai trò (Filter Chips) */}
                    <div style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid #F0E7E5',
                        display: 'flex',
                        gap: '6px',
                        overflowX: 'auto',
                        background: '#FFFFFF'
                    }}>
                        {[
                            { key: 'ALL', label: `Tất cả (${roleCounts.ALL})` },
                            { key: 'WAITER', label: `Phục vụ (${roleCounts.WAITER})` },
                            { key: 'KITCHEN', label: `Bếp (${roleCounts.KITCHEN})` },
                            { key: 'CASHIER', label: `Thu ngân (${roleCounts.CASHIER})` },
                            { key: 'MANAGER', label: `Quản lý (${roleCounts.MANAGER})` }
                        ].map(tab => {
                            const active = activeRoleFilter === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveRoleFilter(tab.key)}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '999px',
                                        border: active ? '1px solid #9D4124' : '1px solid #EAE0DE',
                                        background: active ? '#9D4124' : '#FBF7F6',
                                        color: active ? '#FFFFFF' : '#56423D',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* 3. Danh sách nhân sự trực tuyến (Cuộn mượt) */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        maxHeight: '280px'
                    }}>
                        {loading && onlineStaffList.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#89726B', fontSize: '0.8rem' }}>
                                Đang tải dữ liệu nhân sự...
                            </div>
                        ) : filteredStaff.length === 0 ? (
                            <div style={{ padding: '24px 12px', textAlign: 'center' }}>
                                <Icon name="group_off" size={32} style={{ color: '#C58F80', marginBottom: '6px' }} />
                                <div style={{ fontSize: '0.8rem', color: '#56423D', fontWeight: 600 }}>
                                    Không có nhân sự nào đang trực
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#89726B', marginTop: '2px' }}>
                                    {activeRoleFilter === 'ALL'
                                        ? 'Chưa có nhân viên nào đăng nhập trong ca này.'
                                        : 'Không có nhân sự nào thuộc vai trò này đang online.'}
                                </div>
                            </div>
                        ) : (
                            filteredStaff.map((staff) => {
                                const roleCfg = ROLE_CONFIG[staff.role] || ROLE_CONFIG.WAITER;
                                // Lấy 2 ký tự viết tắt họ tên để làm Avatar
                                const initials = (staff.fullName || staff.username || 'NV')
                                    .split(' ')
                                    .filter(Boolean)
                                    .map(w => w[0])
                                    .slice(-2)
                                    .join('')
                                    .toUpperCase();

                                return (
                                    <div
                                        key={staff.id || staff.username}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '8px 10px',
                                            borderRadius: '10px',
                                            background: '#FFF8F6',
                                            border: '1px solid #F0E6E4'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {/* Avatar tròn ký tự viết tắt */}
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                background: roleCfg.badgeBg,
                                                color: roleCfg.badgeColor,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 800,
                                                fontSize: '0.75rem',
                                                flexShrink: 0
                                            }}>
                                                {initials}
                                            </div>

                                            {/* Họ tên, Mã nhân viên và Vai trò */}
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1F1B1A' }}>
                                                    {staff.fullName || staff.username}
                                                </div>
                                                <div style={{ fontSize: '0.68rem', color: '#89726B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span>{staff.username}</span>
                                                    <span>•</span>
                                                    <span style={{ color: roleCfg.color, fontWeight: 600 }}>{roleCfg.label}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Huy hiệu Online xanh lá (click để chuyển ngoại tuyến nếu cần) */}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleStaffShift(staff.id, staff.fullName || staff.username)}
                                            title="Nhấn để chuyển nhân viên này sang Ngoại tuyến"
                                            disabled={loading}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '3px 8px',
                                                borderRadius: '999px',
                                                background: '#F1F8E9',
                                                color: '#2E7D32',
                                                fontSize: '0.68rem',
                                                fontWeight: 700,
                                                border: '1px solid #C8E6C9',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#FFEBEE';
                                                e.currentTarget.style.color = '#C62828';
                                                e.currentTarget.style.borderColor = '#FFCDD2';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#F1F8E9';
                                                e.currentTarget.style.color = '#2E7D32';
                                                e.currentTarget.style.borderColor = '#C8E6C9';
                                            }}
                                        >
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                                            <span>Online</span>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* 4. Footer của Popover: Nút mở lịch phân ca */}
                    <div style={{
                        padding: '10px 14px',
                        borderTop: '1px solid #EAE0DE',
                        background: '#FFF8F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span style={{ fontSize: '0.72rem', color: '#89726B' }}>
                            Tổng nhân sự: <strong>{totalStaffCount}</strong>
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/admin/staff'); // Chuyển thẳng sang trang Quản lý nhân sự & Phân ca
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#9D4124',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'background 0.15s ease'
                            }}
                        >
                            <span>Xem Lịch Phân Ca</span>
                            <Icon name="arrow_forward" size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}