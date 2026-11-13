import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import RomsLogo from '../../components/common/RomsLogo';
import { reservationApi } from '../../api/reservationApi';
import { customerApi } from '../../api/customerApi';
import Icon from '../../components/common/Icon';
import { useDialog } from '../../context/DialogContext';
import { useRestaurantProfile } from '../../utils/restaurantConfig';
import './publicPages.css';

// Helper tính toán ngày theo múi giờ địa phương chuẩn định dạng YYYY-MM-DD (tránh lệch timezone UTC)
const getLocalDateString = (offsetDays = 0) => {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper format hiển thị ngày đầy đủ tiếng Việt không bị lệch timezone
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Helper format hiển thị ngày ngắn gọn DD/MM/YYYY
const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Helper kiểm tra một khung giờ có thuộc về quá khứ theo thời gian thực hay không
const isTimeSlotInPast = (timeStr, dateStr) => {
  if (!timeStr || !dateStr) return false;
  const today = getLocalDateString(0);
  if (dateStr < today) return true;
  if (dateStr > today) return false;

  // Trường hợp ngày là hôm nay: so sánh giờ và phút theo thời gian thực
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const parts = timeStr.split(':');
  if (parts.length < 2) return false;
  const slotMinutes = Number(parts[0]) * 60 + Number(parts[1]);

  return slotMinutes <= currentMinutes;
};

export default function ReservationPage() {
  const { showAlert } = useDialog();
  const restaurantProfile = useRestaurantProfile();
  const hotline = restaurantProfile.phone || '0901.234.567';
  // Lấy ngày hôm nay, ngày mai, ngày kia theo giờ địa phương (YYYY-MM-DD)
  const todayStr = getLocalDateString(0);
  const tomorrowStr = getLocalDateString(1);
  const dayAfterStr = getLocalDateString(2);

  // 1. Quản lý trạng thái bước đặt chỗ (1 -> 4)
  const [currentStep, setCurrentStep] = useState(1);

  // 3. Khung giờ đại diện & helper tìm khung giờ hợp lệ trong giới hạn phục vụ (07:00 - 21:30)
  const representativeTimes = ['11:30', '12:00', '18:00', '19:00', '20:00'];
  const getValidTimeForDate = (dateStr) => {
    for (const t of representativeTimes) {
      if (!isTimeSlotInPast(t, dateStr)) return { time: t, isCustom: false };
    }
    for (const lateSlot of ['20:30', '21:00', '21:30']) {
      if (!isTimeSlotInPast(lateSlot, dateStr)) return { time: lateSlot, isCustom: true };
    }
    return null;
  };
  const initialTodaySlot = getValidTimeForDate(todayStr);

  // 2. Ngày dùng bữa: Nếu đã qua 21:30 hôm nay thì tự động chuyển sang ngày mai
  const [selectedDate, setSelectedDate] = useState(() => (initialTodaySlot ? todayStr : tomorrowStr));
  const [isCustomDate, setIsCustomDate] = useState(false);

  const [selectedTime, setSelectedTime] = useState(() => (initialTodaySlot ? initialTodaySlot.time : '11:30'));
  const [isCustomTime, setIsCustomTime] = useState(() => (initialTodaySlot ? initialTodaySlot.isCustom : false));
  const [customTimeInput, setCustomTimeInput] = useState(() => (initialTodaySlot ? initialTodaySlot.time : '11:30'));

  // 4. Số lượng khách: Số đại diện + chế độ nhập số khác
  const representativeGuests = [2, 4, 6, 8, 10];
  const [selectedGuests, setSelectedGuests] = useState(4);
  const [isCustomGuests, setIsCustomGuests] = useState(false);
  const [customGuestInput, setCustomGuestInput] = useState(5);

  // 5. Khu vực bàn: Nạp động từ Database qua API
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('ZONE_1');
  const [selectedZoneName, setSelectedZoneName] = useState('Sảnh Chính');
  const [isLoadingZones, setIsLoadingZones] = useState(true);

  // 6. Pre-order món ăn trước (tùy chọn) - Nạp động từ CSDL
  const [menuCategories, setMenuCategories] = useState([]);
  const [menuDishes, setMenuDishes] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [preOrderItems, setPreOrderItems] = useState([]);
  const [menuCatFilter, setMenuCatFilter] = useState('ALL');
  const [menuSearch, setMenuSearch] = useState('');

  // 7. Thông tin liên hệ của khách hàng
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialNote, setSpecialNote] = useState('');
  const [touched, setTouched] = useState({ name: false, phone: false, email: false });
  const [step1Error, setStep1Error] = useState('');

  // Validation rules cho thông tin khách hàng
  const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const getNameError = () => {
    if (!customerName.trim()) return 'Vui lòng nhập họ và tên của bạn.';
    if (customerName.trim().length < 2) return 'Họ và tên tối thiểu 2 ký tự.';
    return '';
  };

  const getPhoneError = () => {
    if (!customerPhone.trim()) return 'Vui lòng nhập số điện thoại để quản lý liên hệ xác nhận bàn.';
    if (!phoneRegex.test(customerPhone.trim())) return 'Số điện thoại gồm 10 chữ số (bắt đầu bằng 03, 05, 07, 08 hoặc 09).';
    return '';
  };

  const getEmailError = () => {
    if (customerEmail.trim() && !emailRegex.test(customerEmail.trim())) {
      return 'Địa chỉ email chưa đúng định dạng (ví dụ: ten@example.com).';
    }
    return '';
  };

  const nameError = touched.name ? getNameError() : '';
  const phoneError = touched.phone ? getPhoneError() : '';
  const emailError = touched.email ? getEmailError() : '';
  const isStep4Valid = !getNameError() && !getPhoneError() && !getEmailError();

  // 8. Trạng thái gửi đơn đặt bàn
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingCode, setBookingCode] = useState('');

  // Nạp danh sách khu vực bàn và thực đơn từ database khi component mount
  useEffect(() => {
    const fetchZones = async () => {
      try {
        setIsLoadingZones(true);
        const res = await reservationApi.getZones();
        if (res.data && res.data.length > 0) {
          setZones(res.data);
          setSelectedZone(res.data[0].zoneCode);
          setSelectedZoneName(res.data[0].zoneName || res.data[0].name);
        }
      } catch (err) {
        console.error('Không thể tải khu vực từ CSDL, sử dụng danh sách mặc định:', err);
        // Fallback an toàn nếu backend chưa sẵn sàng
        const fallbackZones = [
          { zoneCode: 'ZONE_1', zoneName: 'Sảnh Chính - Tầng 1', description: 'Không gian ấm cúng, thiết kế hiện đại', badge: 'Phổ biến', availableTables: 6 },
          { zoneCode: 'ZONE_2', zoneName: 'Ban Công - Tầng 2', description: 'Tầm nhìn thoáng đãng nhìn ra phố cổ', badge: 'View đẹp', availableTables: 4 },
          { zoneCode: 'VIP', zoneName: 'Phòng Riêng VIP', description: 'Cách âm tuyệt đối, thích hợp tiếp khách sang trọng', badge: 'Riêng tư', availableTables: 2 }
        ];
        setZones(fallbackZones);
        setSelectedZone('ZONE_1');
        setSelectedZoneName(fallbackZones[0].zoneName);
      } finally {
        setIsLoadingZones(false);
      }
    };

    const fetchMenu = async () => {
      try {
        setIsLoadingMenu(true);
        const res = await customerApi.getCustomerMenu();
        if (res.success && res.data) {
          const catList = res.data.map(c => ({
            id: c.categoryId,
            name: c.categoryName
          }));
          setMenuCategories(catList);

          const flatDishes = [];
          res.data.forEach(c => {
            if (c.items) {
              c.items.forEach(item => {
                const isOutOfStock = !item.isAvailable || (item.remainingStock !== undefined && item.remainingStock !== null && item.remainingStock <= 0);
                flatDishes.push({
                  id: item.id,
                  name: item.name,
                  description: item.description,
                  price: item.price,
                  imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
                  categoryId: c.categoryId,
                  categoryName: c.categoryName,
                  isAvailable: item.isAvailable,
                  remainingStock: item.remainingStock,
                  isOutOfStock: isOutOfStock
                });
              });
            }
          });
          flatDishes.sort((a, b) => (a.isOutOfStock ? 1 : 0) - (b.isOutOfStock ? 1 : 0));
          setMenuDishes(flatDishes);
        }
      } catch (err) {
        console.error('Không thể tải thực đơn từ CSDL cho pre-order:', err);
      } finally {
        setIsLoadingMenu(false);
      }
    };

    fetchZones();
    fetchMenu();
  }, []);

  // Tự động điều chỉnh khung giờ hợp lệ khi ngày dùng bữa thay đổi
  useEffect(() => {
    if (isTimeSlotInPast(selectedTime, selectedDate)) {
      const nextValid = getValidTimeForDate(selectedDate);
      if (nextValid) {
        setSelectedTime(nextValid.time);
        setIsCustomTime(nextValid.isCustom);
        if (nextValid.isCustom) setCustomTimeInput(nextValid.time);
      } else {
        setIsCustomTime(true);
        setCustomTimeInput('21:30');
        setSelectedTime('21:30');
        setStep1Error('Khung giờ nhận đặt bàn hôm nay (đến 21:30) đã kết thúc. Quý khách vui lòng chọn ngày dùng bữa từ ngày mai!');
      }
    }
  }, [selectedDate]);

  // Xử lý chọn ngày đặt bàn (Preset hoặc Custom)
  const handleSelectPresetDate = (date) => {
    setIsCustomDate(false);
    setSelectedDate(date);
    setStep1Error('');
  };

  const handleCustomDateChange = (date) => {
    setIsCustomDate(true);
    setSelectedDate(date || todayStr);
    setStep1Error('');
  };

  // Xử lý chọn khung giờ
  const handleSelectPresetTime = (time) => {
    if (isTimeSlotInPast(time, selectedDate)) {
      setStep1Error('Khung giờ này đã trôi qua trong ngày hôm nay. Quý khách vui lòng chọn khung giờ trong tương lai!');
      return;
    }
    setStep1Error('');
    setIsCustomTime(false);
    setSelectedTime(time);
  };

  const handleApplyCustomTime = (e) => {
    const timeVal = e.target.value;
    setCustomTimeInput(timeVal);
    setSelectedTime(timeVal);
    setStep1Error('');
  };

  // Xử lý chọn số lượng khách
  const handleSelectPresetGuests = (guests) => {
    setIsCustomGuests(false);
    setSelectedGuests(guests);
    setStep1Error('');
  };

  const handleApplyCustomGuests = (e) => {
    const raw = e.target.value;
    setStep1Error('');
    if (raw === '') {
      setCustomGuestInput('');
      setSelectedGuests(0);
      return;
    }
    const val = parseInt(raw, 10);
    const parsedVal = isNaN(val) ? 0 : val;
    setCustomGuestInput(parsedVal);
    setSelectedGuests(parsedVal);
  };

  // Pre-order handlers
  const hasFiniteStock = (dish) => Boolean(dish && dish.remainingStock !== null && dish.remainingStock !== undefined);

  const handleAddDish = (dish) => {
    if (!dish || dish.isOutOfStock || dish.isAvailable === false) return;
    if (hasFiniteStock(dish) && Number(dish.remainingStock) <= 0) return;

    const existing = preOrderItems.find(i => i.id === dish.id);
    if (existing && hasFiniteStock(dish) && existing.qty >= Number(dish.remainingStock)) {
      showAlert({
        title: 'Giới hạn số lượng phục vụ',
        message: `Món "${dish.name}" hiện chỉ còn ${dish.remainingStock} phần sẵn sàng phục vụ!`,
        type: 'warning'
      });
      return;
    }

    setPreOrderItems(prev => {
      const prevExisting = prev.find(i => i.id === dish.id);
      if (prevExisting) {
        if (hasFiniteStock(dish) && prevExisting.qty >= Number(dish.remainingStock)) {
          return prev;
        }
        return prev.map(i => i.id === dish.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...dish, qty: 1, note: '' }];
    });
  };

  const handleUpdateDishQty = (dishId, delta) => {
    const targetDish = menuDishes.find(d => d.id === dishId) || preOrderItems.find(i => i.id === dishId);
    if (delta > 0) {
      if (targetDish?.isOutOfStock || targetDish?.isAvailable === false) return;
      const currentItem = preOrderItems.find(i => i.id === dishId);
      const currentQty = currentItem?.qty || 0;
      if (hasFiniteStock(targetDish) && currentQty + delta > Number(targetDish.remainingStock)) {
        showAlert({
          title: 'Giới hạn số lượng phục vụ',
          message: `Món "${targetDish.name}" hiện chỉ còn ${targetDish.remainingStock} phần sẵn sàng phục vụ!`,
          type: 'warning'
        });
        return;
      }
    }
    setPreOrderItems(prev => {
      return prev.map(i => {
        if (i.id === dishId) {
          const next = i.qty + delta;
          if (delta > 0 && hasFiniteStock(targetDish) && next > Number(targetDish.remainingStock)) {
            return i;
          }
          return next > 0 ? { ...i, qty: next } : null;
        }
        return i;
      }).filter(Boolean);
    });
  };

  const handleUpdateDishNote = (dishId, note) => {
    setPreOrderItems(prev => prev.map(i => i.id === dishId ? { ...i, note } : i));
  };

  const preOrderTotal = preOrderItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalDishesCount = preOrderItems.reduce((sum, item) => sum + item.qty, 0);

  // Xử lý điều hướng các bước và gửi đơn
  const handleNextStep = async (e) => {
    if (e) e.preventDefault();
    if (currentStep === 1) {
      if (!selectedDate) {
        setStep1Error('Vui lòng chọn ngày dùng bữa trước khi tiếp tục!');
        return;
      }
      if (!selectedTime) {
        setStep1Error('Vui lòng chọn khung giờ dùng bữa trước khi tiếp tục!');
        return;
      }
      if (selectedTime < '07:00' || selectedTime > '21:30') {
        setStep1Error('Nhà hàng chỉ phục vụ đặt bàn trong khung giờ từ 07:00 đến 21:30 hàng ngày. Quý khách vui lòng chọn lại khung giờ!');
        showAlert({
          title: 'Khung giờ không hợp lệ',
          message: 'Nhà hàng chỉ phục vụ đặt bàn trong khung giờ từ 07:00 đến 21:30 hàng ngày. Quý khách vui lòng chọn lại khung giờ!',
          type: 'warning'
        });
        return;
      }
      if (isTimeSlotInPast(selectedTime, selectedDate)) {
        setStep1Error('Khung giờ dùng bữa đã chọn đã trôi qua so với thời gian thực. Quý khách vui lòng chọn một khung giờ trong tương lai!');
        return;
      }
      if (!selectedGuests || selectedGuests < 1) {
        setStep1Error('Số lượng khách đặt bàn trực tuyến tối thiểu là 1 người!');
        return;
      }
      if (selectedGuests > 20) {
        setStep1Error(`Số lượng khách đặt trực tuyến tối đa là 20 người. Quý khách vui lòng liên hệ hotline ${hotline} để được hỗ trợ sắp xếp phòng tiệc đoàn riêng!`);
        return;
      }
      setStep1Error('');
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (selectedTime < '07:00' || selectedTime > '21:30') {
        setStep1Error('Nhà hàng chỉ phục vụ đặt bàn trong khung giờ từ 07:00 đến 21:30 hàng ngày. Quý khách vui lòng chọn lại khung giờ!');
        showAlert({
          title: 'Khung giờ không hợp lệ',
          message: 'Nhà hàng chỉ phục vụ đặt bàn trong khung giờ từ 07:00 đến 21:30 hàng ngày. Quý khách vui lòng chọn lại khung giờ!',
          type: 'warning'
        });
        return;
      }
      if (isTimeSlotInPast(selectedTime, selectedDate)) {
        showAlert({
          title: 'Khung giờ không hợp lệ',
          message: 'Khung giờ dùng bữa đã chọn đã trôi qua so với thời gian thực. Quý khách vui lòng chọn lại ngày hoặc giờ dùng bữa!',
          type: 'warning'
        });
        return;
      }
      // Xác thực số lượng khách (1-20 khách theo RULE-RESV-01)
      if (!selectedGuests || selectedGuests < 1 || selectedGuests > 20) {
        showAlert({
          title: 'Số lượng khách không hợp lệ',
          message: 'Số lượng khách đặt bàn trực tuyến phải từ 1 đến 20 người. Quý khách vui lòng kiểm tra lại!',
          type: 'warning'
        });
        return;
      }

      // Kích hoạt hiển thị lỗi inline cho toàn bộ các trường
      setTouched({ name: true, phone: true, email: true });

      if (!isStep4Valid) {
        // Tự động focus mượt mà vào trường đầu tiên chưa hợp lệ
        if (getNameError()) {
          const el = document.getElementById('reservation-customer-name');
          if (el) el.focus();
        } else if (getPhoneError()) {
          const el = document.getElementById('reservation-customer-phone');
          if (el) el.focus();
        } else if (getEmailError()) {
          const el = document.getElementById('reservation-customer-email');
          if (el) el.focus();
        }
        return;
      }

      try {
        setIsSubmitting(true);

        // Tạo chuỗi ghi chú tổng hợp (kèm danh sách món đặt trước nếu có)
        let fullNote = specialNote.trim();
        if (preOrderItems.length > 0) {
          const preOrderSummary = preOrderItems.map(i => `${i.qty}x ${i.name}`).join(', ');
          fullNote = fullNote ? `${fullNote} | Đặt món trước: ${preOrderSummary}` : `Đặt món trước: ${preOrderSummary}`;
        }

        const payload = {
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || null,
          guestCount: selectedGuests,
          reservationDate: selectedDate,
          reservationTime: selectedTime,
          requestedZone: selectedZone,
          note: fullNote,
          preOrderItems: preOrderItems.map(i => ({
            menuItemId: i.id,
            quantity: i.qty,
            note: i.note || ''
          }))
        };

        // Gửi API xuống Backend
        const res = await reservationApi.createReservation(payload);

        if (res.data) {
          setBookingCode(res.data.bookingCode);
          setIsSuccess(true);
        }
      } catch (err) {
        console.error('Lỗi khi gửi yêu cầu đặt bàn:', err);
        const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu đặt bàn. Vui lòng thử lại!';
        showAlert({
          title: 'Không thể đặt bàn',
          message: errMsg,
          type: 'error'
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const filteredMenuItems = menuDishes
    .filter(d => {
      if (menuCatFilter !== 'ALL' && d.categoryId !== menuCatFilter) return false;
      if (menuSearch.trim() !== '') {
        return d.name?.toLowerCase().includes(menuSearch.toLowerCase()) ||
               d.description?.toLowerCase().includes(menuSearch.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => {
      // Ưu tiên hiển thị các món sẵn sàng phục vụ lên đầu tiên
      const aOutOfStock = a.isOutOfStock ? 1 : 0;
      const bOutOfStock = b.isOutOfStock ? 1 : 0;
      return aOutOfStock - bOutOfStock;
    });

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F6', color: '#1F1B1A', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Header Navigation Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 248, 246, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #F0E6E4'
      }}>
        <div className="public-header-container">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <RomsLogo size={42} showText={true} textSubtitle="Culinary Experience" />
          </Link>

          <Link
            to="/"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#56423D',
              fontWeight: 700,
              fontSize: '0.88rem'
            }}
          >
            <Icon name="arrow_back" size={18} />
            <span>Về Trang Chủ</span>
          </Link>
        </div>
      </header>

      {/* 2. Top Banner & 4-Step Stepper */}
      <section className="reservation-banner-section">
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FFDBC9',
            color: '#753400',
            padding: '4px 14px',
            borderRadius: '9999px',
            fontWeight: 700,
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '10px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9D4124' }} />
            Hệ thống đặt bàn & điều phối thông minh
          </div>

          <h1 className="reservation-title">
            Đặt Bàn & Giữ Chỗ Trực Tuyến Tại <span style={{ color: '#9D4124' }}>ROMS</span>
          </h1>
          <p style={{ fontSize: '0.98rem', color: '#56423D', margin: 0, maxWidth: '680px', lineHeight: 1.5 }}>
            Chọn trước ngày giờ, số khách và không gian yêu thích. Quản lý sẽ liên hệ trực tiếp qua số điện thoại để tư vấn và xếp vị trí bàn ưng ý nhất cho quý khách.
          </p>

          {/* Stepper (4 Steps - Cuộn ngang mượt mà trên mobile) */}
          <div className="reservation-stepper-grid">
            {[
              { step: 1, title: 'Ngày, Giờ & Số Khách' },
              { step: 2, title: 'Khu Vực Bàn Ăn' },
              { step: 3, title: 'Gọi Món Trước (Tùy chọn)' },
              { step: 4, title: 'Xác Nhận Giữ Chỗ' }
            ].map(s => {
              const isActive = currentStep === s.step;
              const isPast = currentStep > s.step;
              return (
                <div
                  key={s.step}
                  className="reservation-stepper-item"
                  onClick={() => isPast && setCurrentStep(s.step)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    background: isActive ? '#FFFFFF' : '#F6ECEA',
                    border: isActive ? '2px solid #9D4124' : '1px solid transparent',
                    boxShadow: isActive ? '0 4px 14px rgba(157, 65, 36, 0.15)' : 'none',
                    cursor: isPast ? 'pointer' : 'default',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isActive || isPast ? '#9D4124' : '#EAE0DE',
                    color: isActive || isPast ? '#FFFFFF' : '#89726B',
                    fontFamily: "'Epilogue', sans-serif",
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {isPast ? <Icon name="check" size={16} /> : s.step}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: isActive ? '#9D4124' : '#89726B', fontWeight: 700, textTransform: 'uppercase' }}>
                      Bước {s.step}
                    </div>
                    <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Main Form & Summary Rail */}
      <section className="reservation-content-section">
        <div className="reservation-main-layout">
          {/* Left Form Flow (8 cols) */}
          <div className="reservation-form-col">

            {/* ============================================================== */}
            {/* STEP 1: CHỌN NGÀY CỤ THỂ, KHUNG GIỜ & SỐ LƯỢNG KHÁCH             */}
            {/* ============================================================== */}
            {currentStep === 1 && (
              <div className="reservation-step-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFDBC9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9D4124' }}>
                    <Icon name="calendar_today" size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                      1. Chọn ngày, giờ & số lượng khách
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#89726B' }}>Lựa chọn chính xác thời điểm bạn muốn ghé thăm nhà hàng ROMS</span>
                  </div>
                </div>

                {/* Date Selection: BỘ CHỌN NGÀY CỤ THỂ KHÔNG BỊ TRÀN TRÊN MOBILE */}
                <div className="reservation-date-box" style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="event" size={18} style={{ color: '#9D4124' }} />
                      Ngày đặt bàn / dùng bữa: <span style={{ color: '#9D4124' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#89726B', fontWeight: 600 }}>
                      {formatDisplayDate(selectedDate)}
                    </span>
                  </div>

                  {/* Bộ chọn nhanh ngày (Hôm nay, Ngày mai, Ngày kia, Ngày khác) */}
                  <div className="mobile-date-quick-chips">
                    <button
                      type="button"
                      onClick={() => handleSelectPresetDate(todayStr)}
                      className={`mobile-date-chip ${!isCustomDate && selectedDate === todayStr ? 'active' : ''}`}
                    >
                      <span style={{ fontSize: '0.74rem', opacity: 0.85 }}>Hôm nay</span>
                      <span style={{ fontWeight: 800 }}>{formatShortDate(todayStr)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectPresetDate(tomorrowStr)}
                      className={`mobile-date-chip ${!isCustomDate && selectedDate === tomorrowStr ? 'active' : ''}`}
                    >
                      <span style={{ fontSize: '0.74rem', opacity: 0.85 }}>Ngày mai</span>
                      <span style={{ fontWeight: 800 }}>{formatShortDate(tomorrowStr)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectPresetDate(dayAfterStr)}
                      className={`mobile-date-chip ${!isCustomDate && selectedDate === dayAfterStr ? 'active' : ''}`}
                    >
                      <span style={{ fontSize: '0.74rem', opacity: 0.85 }}>Ngày kia</span>
                      <span style={{ fontWeight: 800 }}>{formatShortDate(dayAfterStr)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCustomDate(true)}
                      className={`mobile-date-chip ${isCustomDate ? 'custom-active' : ''}`}
                    >
                      <span style={{ fontSize: '0.74rem', opacity: 0.85, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Icon name="calendar_month" size={14} /> Ngày khác
                      </span>
                      <span style={{ fontWeight: 800, fontSize: '0.78rem' }}>
                        {isCustomDate ? formatShortDate(selectedDate) : 'Chọn lịch...'}
                      </span>
                    </button>
                  </div>

                  {/* Ô nhập lịch ngày tùy chọn (Hiển thị mượt mà không bị tràn khung) */}
                  {isCustomDate && (
                    <div className="reservation-date-input-wrap" style={{ marginTop: '8px' }}>
                      <input
                        type="date"
                        min={todayStr}
                        value={selectedDate}
                        onChange={(e) => handleCustomDateChange(e.target.value)}
                        className="reservation-date-input touch-input"
                      />
                      <div style={{ fontSize: '0.76rem', color: '#89726B', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icon name="info" size={14} style={{ color: '#9D4124' }} />
                        <span>Đang chọn ngày: <strong style={{ color: '#9D4124' }}>{formatDisplayDate(selectedDate)}</strong></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Time Selection: KHUNG GIỜ ĐẠI DIỆN + NHẬP GIỜ KHÁC */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="schedule" size={18} style={{ color: '#9D4124' }} />
                      Khung giờ dùng bữa: <span style={{ color: '#9D4124' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#89726B' }}>
                      {isCustomTime ? 'Đang nhập giờ tùy chọn' : 'Đang chọn giờ đại diện'}
                    </span>
                  </div>

                  {/* Danh sách nút giờ đại diện (tự động wrap theo cột responsive) */}
                  <div className="mobile-time-grid" style={{ marginBottom: '12px' }}>
                    {representativeTimes.map(t => {
                      const isPast = isTimeSlotInPast(t, selectedDate);
                      const isSel = !isCustomTime && selectedTime === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={isPast}
                          onClick={() => handleSelectPresetTime(t)}
                          title={isPast ? 'Khung giờ này đã trôi qua trong ngày hôm nay' : ''}
                          style={{
                            padding: '12px 6px',
                            borderRadius: '12px',
                            border: isSel ? '2px solid #9D4124' : (isPast ? '1px solid #E5E0DF' : '1px solid #EAE0DE'),
                            background: isSel ? '#9D4124' : (isPast ? '#F5EFEB' : '#FFF8F6'),
                            color: isSel ? '#FFFFFF' : (isPast ? '#A39996' : '#1F1B1A'),
                            fontFamily: "'Epilogue', sans-serif",
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            cursor: isPast ? 'not-allowed' : 'pointer',
                            opacity: isPast ? 0.38 : 1,
                            textDecoration: isPast ? 'line-through' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {t}
                        </button>
                      );
                    })}

                    {/* Nút bật chế độ nhập giờ khác */}
                    <button
                      type="button"
                      onClick={() => setIsCustomTime(true)}
                      style={{
                        padding: '12px 6px',
                        borderRadius: '12px',
                        border: isCustomTime ? '2px solid #9D4124' : '1px dashed #9D4124',
                        background: isCustomTime ? '#FFDBC9' : '#FFFFFF',
                        color: '#9D4124',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px'
                      }}
                    >
                      <Icon name="edit_calendar" size={16} /> Giờ khác
                    </button>
                  </div>

                  {/* Thông báo nếu tất cả khung giờ đại diện hôm nay đều đã trôi qua */}
                  {selectedDate === todayStr && representativeTimes.every(t => isTimeSlotInPast(t, selectedDate)) && (
                    <div style={{ fontSize: '0.78rem', color: '#B3261E', background: '#FCEEEE', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="info" size={16} style={{ color: '#B3261E', flexShrink: 0 }} />
                      <span>Các khung giờ đặt bàn đại diện trong ngày hôm nay đều đã qua. Quý khách vui lòng chọn <strong>"Giờ khác"</strong> hoặc chọn ngày tiếp theo!</span>
                    </div>
                  )}

                  {/* Ô nhập giờ tùy ý (nếu chọn Giờ khác) */}
                  {isCustomTime && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#FFF8F6', padding: '12px 16px', borderRadius: '14px', border: '1px solid #FFDBC9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#56423D' }}>
                          Nhập giờ mong muốn của bạn:
                        </span>
                        <input
                          type="time"
                          value={customTimeInput}
                          min={selectedDate === todayStr ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}` : '07:00'}
                          max="21:30"
                          onChange={handleApplyCustomTime}
                          className="touch-input"
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: isTimeSlotInPast(customTimeInput, selectedDate) ? '1.5px solid #B3261E' : '1.5px solid #9D4124',
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: isTimeSlotInPast(customTimeInput, selectedDate) ? '#B3261E' : '#9D4124',
                            background: '#FFFFFF',
                            outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: '0.78rem', color: '#89726B' }}>
                          (Nhà hàng nhận đặt bàn từ 07:00 đến 21:30 mỗi ngày)
                        </span>
                      </div>
                      {isTimeSlotInPast(customTimeInput, selectedDate) && (
                        <div style={{ fontSize: '0.76rem', color: '#B3261E', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Icon name="warning" size={14} style={{ color: '#B3261E' }} />
                          <span>Giờ đã chọn đã trôi qua so với thời gian thực. Quý khách vui lòng chọn khung giờ trong tương lai!</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Guest Count: SỐ KHÁCH ĐẠI DIỆN + NHẬP SỐ KHÁCH KHÁC */}
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="groups" size={18} style={{ color: '#9D4124' }} />
                      Số lượng khách: <span style={{ color: '#9D4124' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#89726B' }}>
                      {isCustomGuests ? 'Đang nhập số khách tùy chọn' : 'Đang chọn số khách đại diện'}
                    </span>
                  </div>

                  {/* Danh sách nút số khách đại diện */}
                  <div className="mobile-guest-grid" style={{ marginBottom: '12px' }}>
                    {representativeGuests.map(g => {
                      const isSel = !isCustomGuests && selectedGuests === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => handleSelectPresetGuests(g)}
                          style={{
                            padding: '12px 4px',
                            borderRadius: '12px',
                            border: isSel ? '2px solid #9D4124' : '1px solid #EAE0DE',
                            background: isSel ? '#9D4124' : '#FFF8F6',
                            color: isSel ? '#FFFFFF' : '#1F1B1A',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Icon name="person" size={20} />
                          <span style={{ fontWeight: 800, fontSize: '0.82rem' }}>{g} người</span>
                        </button>
                      );
                    })}

                    {/* Nút bật chế độ nhập số khách khác */}
                    <button
                      type="button"
                      onClick={() => setIsCustomGuests(true)}
                      style={{
                        padding: '12px 4px',
                        borderRadius: '12px',
                        border: isCustomGuests ? '2px solid #9D4124' : '1px dashed #9D4124',
                        background: isCustomGuests ? '#FFDBC9' : '#FFFFFF',
                        color: '#9D4124',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Icon name="add" size={20} />
                      <span style={{ fontWeight: 800, fontSize: '0.82rem' }}>Số khác</span>
                    </button>
                  </div>

                  {/* Ô nhập số lượng khách tùy ý (nếu chọn Số khác) */}
                  {isCustomGuests && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      background: '#FFF8F6',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      border: isCustomGuests && (selectedGuests > 20 || selectedGuests < 1 || customGuestInput === '')
                        ? '1.5px solid #F87171'
                        : '1px solid #FFDBC9'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#56423D' }}>
                          Nhập số lượng khách chính xác:
                        </span>
                        <input
                          id="reservation-custom-guests"
                          type="number"
                          min="1"
                          max="20"
                          value={customGuestInput}
                          onChange={handleApplyCustomGuests}
                          className="touch-input"
                          placeholder="1-20"
                          style={{
                            width: '80px',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: isCustomGuests && (selectedGuests > 20 || selectedGuests < 1 || customGuestInput === '')
                              ? '1.5px solid #DC2626'
                              : '1.5px solid #9D4124',
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: isCustomGuests && (selectedGuests > 20 || selectedGuests < 1 || customGuestInput === '')
                              ? '#DC2626'
                              : '#9D4124',
                            background: '#FFFFFF',
                            outline: 'none',
                            textAlign: 'center'
                          }}
                        />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A' }}>khách</span>
                      </div>

                      {/* Thông báo hướng dẫn quy định số lượng khách trực tuyến in trực tiếp trên giao diện */}
                      <div style={{ fontSize: '0.78rem', color: '#89726B', lineHeight: '1.4' }}>
                        * Hệ thống trực tuyến hỗ trợ tối đa <strong>20 khách/đoàn</strong> (theo quy định nhà hàng). Quý khách đặt tiệc đoàn từ 21 khách trở lên vui lòng liên hệ hotline <strong>{hotline}</strong> để được sắp xếp phòng tiệc riêng.
                      </div>

                      {/* Cảnh báo lỗi in trực tiếp trên giao diện khi số khách vượt quá 20 */}
                      {isCustomGuests && selectedGuests > 20 && (
                        <div
                          id="reservation-guest-error-over"
                          style={{
                            marginTop: '4px',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: '#FEE2E2',
                            border: '1px solid #FCA5A5',
                            color: '#991B1B',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <Icon name="error" size={18} style={{ color: '#DC2626', flexShrink: 0 }} />
                          <span>
                            Số lượng khách vượt quá quy định đặt bàn trực tuyến (tối đa 20 người). Quý khách vui lòng nhập lại hoặc gọi hotline {hotline} để được hỗ trợ tiệc đoàn!
                          </span>
                        </div>
                      )}

                      {/* Cảnh báo lỗi in trực tiếp trên giao diện khi số khách < 1 hoặc để trống */}
                      {isCustomGuests && (selectedGuests < 1 || customGuestInput === '') && (
                        <div
                          id="reservation-guest-error-under"
                          style={{
                            marginTop: '4px',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: '#FEF3C7',
                            border: '1px solid #FCD34D',
                            color: '#92400E',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <Icon name="warning" size={18} style={{ color: '#D97706', flexShrink: 0 }} />
                          <span>
                            Vui lòng nhập số lượng khách hợp lệ từ 1 đến 20 khách.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Banner cảnh báo inline Step 1 thay vì pop-up alert */}
                {step1Error && (
                  <div className="step1-inline-warning" role="alert">
                    <Icon name="warning" size={18} style={{ color: '#DC2626', flexShrink: 0 }} />
                    <span>{step1Error}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleNextStep}
                  style={{
                    width: '100%',
                    minHeight: 50,
                    padding: '15px',
                    borderRadius: '16px',
                    background: '#9D4124',
                    color: '#FFF',
                    border: 'none',
                    fontFamily: "'Epilogue', sans-serif",
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 18px rgba(157, 65, 36, 0.3)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>Tiếp tục chọn khu vực</span>
                  <Icon name="arrow_forward" size={18} />
                </button>
              </div>
            )}

            {/* ============================================================== */}
            {/* STEP 2: CHỌN KHU VỰC BÀN ĂN (LOAD ĐỘNG TỪ CSDL DATABASE)          */}
            {/* ============================================================== */}
            {currentStep === 2 && (
              <div className="reservation-step-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFDBC9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9D4124' }}>
                    <Icon name="storefront" size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                      2. Chọn khu vực bàn ngồi (Từ CSDL Nhà Hàng)
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#89726B' }}>Các khu vực bàn ăn thực tế đang mở phục vụ tại nhà hàng ROMS</span>
                  </div>
                </div>

                {isLoadingZones ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#89726B' }}>
                    <Icon name="sync" size={32} style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ margin: '8px 0 0', fontSize: '0.88rem' }}>Đang nạp danh sách khu vực bàn từ CSDL...</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                    {zones.map(z => {
                      const isSel = selectedZone === z.zoneCode;
                      return (
                        <div
                          key={z.zoneCode}
                          onClick={() => {
                            setSelectedZone(z.zoneCode);
                            setSelectedZoneName(z.zoneName || z.name);
                          }}
                          style={{
                            padding: '16px 18px',
                            borderRadius: '18px',
                            border: isSel ? '2px solid #9D4124' : '1px solid #EAE0DE',
                            background: isSel ? '#FFF8F6' : '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px',
                            boxShadow: isSel ? '0 4px 14px rgba(157, 65, 36, 0.1)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px', flex: 1 }}>
                            <div style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              border: isSel ? '6px solid #9D4124' : '2px solid #C4B5B0',
                              background: '#FFFFFF',
                              flexShrink: 0
                            }} />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.98rem', color: '#1F1B1A' }}>
                                  {z.zoneName || z.name}
                                </span>
                                {z.badge && (
                                  <span style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: isSel ? '#FFDBC9' : '#F6ECEA',
                                    color: isSel ? '#9D4124' : '#56423D'
                                  }}>
                                    {z.badge}
                                  </span>
                                )}
                              </div>
                              <p style={{ margin: 0, fontSize: '0.8rem', color: '#89726B', lineHeight: 1.4 }}>
                                {z.description}
                              </p>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.78rem', color: '#596232', fontWeight: 700, background: '#EFF5D3', padding: '4px 10px', borderRadius: '8px' }}>
                              {z.availableTables ? `${z.availableTables} bàn trống` : 'Sẵn sàng xếp bàn'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="reservation-actions-group">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    style={{
                      padding: '14px 24px',
                      borderRadius: '16px',
                      background: '#F0E6E4',
                      color: '#56423D',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer'
                    }}
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '16px',
                      background: '#9D4124',
                      color: '#FFF',
                      border: 'none',
                      fontFamily: "'Epilogue', sans-serif",
                      fontWeight: 800,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 6px 18px rgba(157, 65, 36, 0.3)'
                    }}
                  >
                    <span>Tiếp tục chọn món (Tùy chọn)</span>
                    <Icon name="arrow_forward" size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* STEP 3: PRE-ORDER GỌI MÓN TRƯỚC (TỐI ƯU WEB MOBILE FIRST)        */}
            {/* ============================================================== */}
            {currentStep === 3 && (
              <div className="reservation-step-card">
                {/* Header Bước 3 Tinh Gọn */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#FFDBC9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9D4124', flexShrink: 0 }}>
                      <Icon name="restaurant_menu" size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#1F1B1A', margin: 0 }}>
                          3. Đặt trước món ăn
                        </h2>
                        <span style={{ fontSize: '0.7rem', background: '#FEF3C7', color: '#78350F', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                          Tùy chọn
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#89726B', marginTop: '1px' }}>
                        Bếp chuẩn bị sẵn khi bạn tới bàn ({selectedTime})
                      </div>
                    </div>
                  </div>

                  {totalDishesCount > 0 && (
                    <span style={{ fontSize: '0.8rem', color: '#9D4124', fontWeight: 800, background: '#FFF8F6', border: '1.5px solid #FFDBC9', padding: '4px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Icon name="shopping_bag" size={15} />
                      {totalDishesCount} món ({preOrderTotal.toLocaleString('vi-VN')}₫)
                    </span>
                  )}
                </div>

                {/* BỘ LỌC TINH GỌN (COMPACT TOOLBAR 1 HÀNG DUY NHẤT) */}
                <div className="preorder-filter-toolbar">
                  {/* Ô tìm kiếm nhỏ gọn */}
                  <div className="preorder-search-box">
                    <Icon name="search" size={18} style={{ color: '#89726B', flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="Tìm món ăn nhanh..."
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      className="preorder-search-input touch-input"
                    />
                    {menuSearch && (
                      <button
                        type="button"
                        onClick={() => setMenuSearch('')}
                        className="preorder-search-clear-btn"
                        title="Xóa tìm kiếm"
                      >
                        <Icon name="close" size={16} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown danh mục nhỏ gọn (Không tràn màn hình) */}
                  <div className="preorder-category-select-wrap">
                    <Icon name="tune" size={16} style={{ color: '#9D4124', flexShrink: 0 }} />
                    <select
                      value={menuCatFilter}
                      onChange={(e) => setMenuCatFilter(e.target.value)}
                      className="preorder-category-select touch-input"
                      title="Chọn danh mục món"
                    >
                      <option value="ALL">Tất cả ({menuDishes.filter(d => !d.isOutOfStock).length} sẵn sàng / {menuDishes.length})</option>
                      {menuCategories.map(c => {
                        const count = menuDishes.filter(d => d.categoryId === c.id).length;
                        const readyCount = menuDishes.filter(d => d.categoryId === c.id && !d.isOutOfStock).length;
                        return (
                          <option key={c.id} value={c.id}>
                            {c.name} ({readyCount}/{count})
                          </option>
                        );
                      })}
                    </select>
                    <Icon name="expand_more" size={18} style={{ color: '#89726B', pointerEvents: 'none', marginLeft: '-4px' }} />
                  </div>
                </div>

                {/* Thanh tag hiển thị trạng thái lọc (Chỉ xuất hiện khi đang lọc) */}
                {(menuCatFilter !== 'ALL' || menuSearch.trim() !== '') && (
                  <div className="preorder-active-filters-bar">
                    <span style={{ fontSize: '0.74rem', color: '#56423D', fontWeight: 600 }}>
                      Tìm thấy: <strong style={{ color: '#9D4124' }}>{filteredMenuItems.length} món</strong>
                      {filteredMenuItems.some(d => d.isOutOfStock) && (
                        <span style={{ marginLeft: '6px', color: '#89726B', fontSize: '0.72rem' }}>
                          ({filteredMenuItems.filter(d => !d.isOutOfStock).length} sẵn sàng)
                        </span>
                      )}
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {menuCatFilter !== 'ALL' && (
                        <button
                          type="button"
                          onClick={() => setMenuCatFilter('ALL')}
                          className="preorder-filter-tag"
                          title="Hủy lọc danh mục"
                        >
                          <span>{menuCategories.find(c => c.id === menuCatFilter)?.name || 'Danh mục'}</span>
                          <Icon name="close" size={12} />
                        </button>
                      )}
                      {menuSearch.trim() !== '' && (
                        <button
                          type="button"
                          onClick={() => setMenuSearch('')}
                          className="preorder-filter-tag"
                          title="Hủy từ khóa tìm kiếm"
                        >
                          <span>"{menuSearch}"</span>
                          <Icon name="close" size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMenuCatFilter('ALL');
                          setMenuSearch('');
                        }}
                        className="preorder-filter-reset-link"
                      >
                        Đặt lại
                      </button>
                    </div>
                  </div>
                )}

                {/* Danh sách món ăn Step 3 */}
                {isLoadingMenu ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#89726B' }}>
                    <Icon name="sync" size={32} style={{ animation: 'spin 1s linear infinite', color: '#9D4124' }} />
                    <p style={{ margin: '8px 0 0', fontSize: '0.88rem' }}>Đang nạp thực đơn món ăn từ CSDL...</p>
                  </div>
                ) : filteredMenuItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#89726B', background: '#FFF8F6', borderRadius: '16px', marginBottom: '22px' }}>
                    <Icon name="search_off" size={36} style={{ color: '#C4B5B0', marginBottom: '6px' }} />
                    <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>Không tìm thấy món ăn nào phù hợp với bộ lọc</p>
                  </div>
                ) : (
                  <div className="reservation-preorder-grid">
                    {filteredMenuItems.map(dish => {
                      const selected = preOrderItems.find(i => i.id === dish.id);
                      const isUnavailable = dish.isOutOfStock;
                      return (
                        <div
                          key={dish.id}
                          className={`preorder-card ${selected ? 'selected' : ''} ${isUnavailable ? 'out-of-stock' : ''}`}
                          style={isUnavailable ? { opacity: 0.58, background: '#FBF8F7', border: '1px dashed #DDD2D0' } : undefined}
                        >
                          <div className="preorder-card-body">
                            <div className="preorder-card-thumb-wrap">
                              <img
                                src={dish.imageUrl}
                                alt={dish.name}
                                className="preorder-card-thumb"
                                style={isUnavailable ? { filter: 'grayscale(50%)' } : undefined}
                              />
                              {isUnavailable ? (
                                <div style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'rgba(53, 47, 46, 0.55)',
                                  borderRadius: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#FFFFFF',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  textAlign: 'center',
                                  padding: '2px',
                                  backdropFilter: 'blur(1px)'
                                }}>
                                  Tạm hết
                                </div>
                              ) : selected && (
                                <span className="preorder-card-badge">
                                  {selected.qty}
                                </span>
                              )}
                            </div>

                            <div className="preorder-card-info">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <h4 className="preorder-card-title" style={isUnavailable ? { color: '#73615C' } : undefined}>
                                  {dish.name}
                                </h4>
                                {isUnavailable && (
                                  <span style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    background: '#FFDAD6',
                                    color: '#BA1A1A',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '2px'
                                  }}>
                                    <Icon name="block" size={12} /> Ngưng phục vụ
                                  </span>
                                )}
                              </div>
                              {dish.description && (
                                <p className="preorder-card-desc">
                                  {dish.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {selected && !isUnavailable && (
                            <div style={{ position: 'relative' }}>
                              <input
                                type="text"
                                placeholder="Ghi chú món (chín vừa, ít sốt...)"
                                value={selected.note || ''}
                                onChange={(e) => handleUpdateDishNote(dish.id, e.target.value)}
                                className="touch-input"
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  borderRadius: '8px',
                                  border: '1px solid #FFDBC9',
                                  background: '#FFFFFF',
                                  fontSize: '0.78rem',
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                          )}

                          <div className="preorder-card-bottom">
                            <span className="preorder-card-price" style={isUnavailable ? { color: '#89726B' } : undefined}>
                              {dish.price.toLocaleString('vi-VN')}₫
                            </span>

                            {isUnavailable ? (
                              <button
                                type="button"
                                disabled
                                className="preorder-btn-disabled"
                                title="Món ăn hiện đang tạm hết hoặc ngưng phục vụ"
                              >
                                <Icon name="lock" size={15} /> Đã khóa
                              </button>
                            ) : selected ? (() => {
                              const isMaxPreOrder = hasFiniteStock(dish) && selected.qty >= Number(dish.remainingStock);
                              return (
                              <div className="preorder-qty-group">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateDishQty(dish.id, -1)}
                                  className="preorder-btn-minus"
                                  title="Giảm số lượng"
                                >
                                  -
                                </button>
                                <span className="preorder-qty-num">{selected.qty}</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateDishQty(dish.id, 1)}
                                  className="preorder-btn-plus"
                                  style={{
                                    opacity: isMaxPreOrder ? 0.45 : 1,
                                    cursor: isMaxPreOrder ? 'not-allowed' : 'pointer'
                                  }}
                                  title={isMaxPreOrder ? `Chỉ còn tối đa ${dish.remainingStock} phần` : 'Tăng số lượng'}
                                >
                                  +
                                </button>
                              </div>
                              );
                            })() : (
                              <button
                                type="button"
                                onClick={() => handleAddDish(dish)}
                                className="preorder-btn-add"
                              >
                                <Icon name="add" size={16} /> Chọn Món
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Mini Cart Bar (Tóm tắt giỏ món pre-order khi có món được chọn) */}
                {totalDishesCount > 0 && (
                  <div className="preorder-mini-cart">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FFDBC9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9D4124', flexShrink: 0 }}>
                        <Icon name="shopping_bag" size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1F1B1A' }}>
                          Đã chọn {totalDishesCount} phần món ăn
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#9D4124', fontWeight: 800 }}>
                          Tổng tạm tính: {preOrderTotal.toLocaleString('vi-VN')}₫
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreOrderItems([])}
                      style={{ border: 'none', background: 'transparent', color: '#89726B', fontSize: '0.78rem', textDecoration: 'underline', cursor: 'pointer', padding: '4px' }}
                    >
                      Xóa chọn lại
                    </button>
                  </div>
                )}

                {/* Pre-order Navigation Mobile-First */}
                <div className="preorder-actions-container">
                  {/* Nút Primary CTA to rõ trên cùng */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    style={{
                      width: '100%',
                      padding: '15px 20px',
                      borderRadius: '16px',
                      background: '#9D4124',
                      color: '#FFF',
                      border: 'none',
                      fontFamily: "'Epilogue', sans-serif",
                      fontWeight: 800,
                      fontSize: '0.98rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 6px 18px rgba(157, 65, 36, 0.28)'
                    }}
                  >
                    <span>
                      {totalDishesCount > 0
                        ? `Xác nhận ${totalDishesCount} món & Tiếp tục`
                        : 'Tiếp tục điền thông tin (Chọn món tại bàn)'}
                    </span>
                    <Icon name="arrow_forward" size={18} />
                  </button>

                  {/* Hàng 2 nút phụ bên dưới */}
                  <div className="preorder-actions-secondary-row">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '14px',
                        background: '#F0E6E4',
                        color: '#56423D',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Icon name="arrow_back" size={16} /> Quay lại (Bước 2)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPreOrderItems([]);
                        setCurrentStep(4);
                      }}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '14px',
                        background: '#FFF8F6',
                        color: '#89726B',
                        border: '1.5px solid #EAE0DE',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: 'pointer'
                      }}
                    >
                      Bỏ qua món trước
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* STEP 4: ĐIỀN THÔNG TIN KHÁCH & XÁC NHẬN GIỮ CHỖ (SUBMIT PENDING)  */}
            {/* ============================================================== */}
            {currentStep === 4 && (
              <div className="reservation-step-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFDBC9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9D4124' }}>
                    <Icon name="person" size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                      4. Thông tin người đặt bàn & xác nhận
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#89726B' }}>
                      Quản lý nhà hàng sẽ gọi điện tới số này để xác nhận yêu cầu và sắp xếp vị trí bàn
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '28px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                      <span>Họ và tên của bạn</span>
                      <span style={{ color: '#9D4124' }}>*</span>
                    </label>
                    <div className="reservation-input-wrap">
                      <Icon name="person" size={20} className="field-prefix-icon" />
                      <input
                        id="reservation-customer-name"
                        type="text"
                        placeholder="Ví dụ: Nguyễn Văn A"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          if (!touched.name) setTouched(prev => ({ ...prev, name: true }));
                        }}
                        onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                        className={`touch-input reservation-text-input ${nameError ? 'input-error' : (touched.name && !getNameError() ? 'input-valid' : '')}`}
                      />
                      {touched.name && !getNameError() && (
                        <Icon name="check_circle" size={18} className="field-status-icon field-status-success" />
                      )}
                    </div>
                    {nameError && (
                      <div className="reservation-field-error" role="alert">
                        <Icon name="error" size={14} />
                        <span>{nameError}</span>
                      </div>
                    )}
                  </div>

                  <div className="reservation-contact-grid">
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                        <span>Số điện thoại xác nhận</span>
                        <span style={{ color: '#9D4124' }}>*</span>
                      </label>
                      <div className="reservation-input-wrap">
                        <Icon name="call" size={20} className="field-prefix-icon" />
                        <input
                          id="reservation-customer-phone"
                          type="tel"
                          placeholder="090xxxxxxx (10 số)"
                          value={customerPhone}
                          onChange={(e) => {
                            setCustomerPhone(e.target.value);
                            if (!touched.phone) setTouched(prev => ({ ...prev, phone: true }));
                          }}
                          onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                          className={`touch-input reservation-text-input ${phoneError ? 'input-error' : (touched.phone && !getPhoneError() ? 'input-valid' : '')}`}
                        />
                        {touched.phone && !getPhoneError() && (
                          <Icon name="check_circle" size={18} className="field-status-icon field-status-success" />
                        )}
                      </div>
                      {phoneError ? (
                        <div className="reservation-field-error" role="alert">
                          <Icon name="error" size={14} />
                          <span>{phoneError}</span>
                        </div>
                      ) : touched.phone && !getPhoneError() ? (
                        <div className="reservation-field-success">
                          <Icon name="check_circle" size={14} />
                          <span>Số điện thoại hợp lệ để nhận cuộc gọi</span>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '6px' }}>
                        Email nhận xác nhận (tùy chọn)
                      </label>
                      <div className="reservation-input-wrap">
                        <Icon name="mail" size={20} className="field-prefix-icon" />
                        <input
                          id="reservation-customer-email"
                          type="email"
                          placeholder="email@example.com"
                          value={customerEmail}
                          onChange={(e) => {
                            setCustomerEmail(e.target.value);
                            if (e.target.value && !touched.email) setTouched(prev => ({ ...prev, email: true }));
                          }}
                          onBlur={() => {
                            if (customerEmail.trim()) setTouched(prev => ({ ...prev, email: true }));
                          }}
                          className={`touch-input reservation-text-input ${emailError ? 'input-error' : (touched.email && customerEmail && !getEmailError() ? 'input-valid' : '')}`}
                        />
                        {touched.email && customerEmail && !getEmailError() && (
                          <Icon name="check_circle" size={18} className="field-status-icon field-status-success" />
                        )}
                      </div>
                      {emailError && (
                        <div className="reservation-field-error" role="alert">
                          <Icon name="error" size={14} />
                          <span>{emailError}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '6px' }}>
                      Ghi chú đặc biệt cho nhà hàng (Khẩu vị, tiệc sinh nhật, kỷ niệm...):
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ví dụ: Kỷ niệm ngày cưới, chuẩn bị ghế trẻ em, không ăn hành tây..."
                      value={specialNote}
                      onChange={(e) => setSpecialNote(e.target.value)}
                      className="touch-input"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '14px',
                        border: '1.5px solid #EAE0DE',
                        fontSize: '0.88rem',
                        color: '#1F1B1A',
                        background: '#FFF8F6',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'none',
                        transition: 'border-color 0.15s ease'
                      }}
                    />
                  </div>
                </div>

                <div className="reservation-actions-group">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    style={{
                      flex: 1,
                      minHeight: 52,
                      padding: '14px',
                      borderRadius: '16px',
                      background: '#F0E6E4',
                      color: '#56423D',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon name="arrow_back" size={18} />
                    <span>Quay lại</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleNextStep}
                    style={{
                      flex: 2,
                      minHeight: 52,
                      padding: '15px',
                      borderRadius: '16px',
                      background: isSubmitting ? '#C4B5B0' : '#9D4124',
                      color: '#FFF',
                      border: 'none',
                      fontFamily: "'Epilogue', sans-serif",
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: isSubmitting ? 'none' : '0 8px 24px rgba(157, 65, 36, 0.35)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSubmitting ? (
                      <span>Đang gửi yêu cầu...</span>
                    ) : (
                      <>
                        <Icon name="check_circle" size={22} fill={1} />
                        <span>Xác Nhận Giữ Chỗ Ngay</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Gợi ý inline khi các trường bắt buộc chưa điền đủ */}
                {!isStep4Valid && (touched.name || touched.phone || touched.email) && (
                  <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#DC2626', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Icon name="info" size={16} />
                    <span>Vui lòng hoàn thiện đúng các trường thông tin có dấu (*) để hoàn tất đặt chỗ.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Summary Card (4 cols) */}
          <div className="reservation-summary-col">
            <div className="reservation-step-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Icon name="receipt_long" size={22} style={{ color: '#9D4124' }} />
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#1F1B1A', margin: 0 }}>
                  Tóm Tắt Đặt Chỗ
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', paddingBottom: '16px', borderBottom: '1px dashed #EAE0DE' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#89726B' }}>Ngày dùng bữa:</span>
                  <span style={{ fontWeight: 800, color: '#9D4124' }}>
                    {formatShortDate(selectedDate)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#89726B' }}>Khung giờ hẹn:</span>
                  <span style={{ fontWeight: 800, color: '#9D4124' }}>{selectedTime}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#89726B' }}>Số lượng khách:</span>
                  <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{selectedGuests} khách</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#89726B' }}>Khu vực mong muốn:</span>
                  <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{selectedZoneName}</span>
                </div>
                {customerName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#89726B' }}>Người đặt:</span>
                    <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{customerName}</span>
                  </div>
                )}
              </div>

              {/* Pre-order breakdown in summary rail */}
              {preOrderItems.length > 0 && (
                <div style={{ padding: '14px 0', borderBottom: '1px dashed #EAE0DE' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1F1B1A' }}>
                      Món Đặt Trước ({totalDishesCount}):
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#9D4124' }}>
                      {preOrderTotal.toLocaleString('vi-VN')}₫
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                    {preOrderItems.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#56423D' }}>
                        <span>{item.qty}x {item.name}</span>
                        <span style={{ fontWeight: 600 }}>{(item.price * item.qty).toLocaleString('vi-VN')}₫</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Policy note */}
              <div style={{ background: '#FFF8F6', padding: '12px 14px', borderRadius: '14px', marginTop: '16px', border: '1px solid #F6ECEA' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#596232', fontWeight: 700, fontSize: '0.78rem', marginBottom: '4px' }}>
                  <Icon name="phone_in_talk" size={16} /> Quy trình xác nhận ROMS
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#56423D', lineHeight: 1.45 }}>
                  Sau khi bạn nhấn xác nhận, yêu cầu sẽ được chuyển đến <strong>Quản lý ca trực</strong>. Quản lý sẽ gọi điện đến SĐT của bạn trong ít phút để kiểm tra vị trí bàn trống và xếp bàn tốt nhất.
                </p>
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.78rem', color: '#89726B' }}>
                Hotline hỗ trợ trực tiếp: <strong style={{ color: '#9D4124' }}>{hotline}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. MODAL THÔNG BÁO XÁC NHẬN GIỮ CHỖ THÀNH CÔNG (CHỜ QUẢN LÝ GỌI ĐIỆN) */}
      {/* ==================================================================== */}
      {isSuccess && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(31, 27, 26, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '540px',
            borderRadius: '28px',
            padding: '28px 20px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#DDE8AB',
              color: '#596232',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Icon name="phone_callback" size={36} fill={1} />
            </div>

            <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: 'clamp(1.2rem, 3.5vw, 1.5rem)', color: '#1F1B1A', margin: '0 0 8px' }}>
              Yêu Cầu Đã Gửi Tới Quản Lý!
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#56423D', margin: '0 0 20px', lineHeight: 1.5 }}>
              Cảm ơn quý khách <strong>{customerName}</strong>. Nhà hàng đã ghi nhận yêu cầu giữ chỗ của quý khách.
            </p>

            {/* Hộp thông báo quản lý gọi điện */}
            <div style={{
              background: '#FFF8F6',
              padding: '14px 16px',
              borderRadius: '16px',
              border: '1.5px solid #FFDBC9',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left'
            }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#FFDBC9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9D4124', flexShrink: 0 }}>
                <Icon name="phone_in_talk" size={20} />
              </div>
              <div style={{ fontSize: '0.82rem', color: '#56423D', lineHeight: 1.45 }}>
                Quản lý nhà hàng sẽ gọi điện thoại tới số <strong style={{ color: '#9D4124', fontSize: '0.92rem' }}>{customerPhone}</strong> trong vòng <strong>5-10 phút</strong> để xác nhận và sắp xếp vị trí bàn ưng ý nhất cho bạn!
              </div>
            </div>

            {/* Chi tiết phiếu đặt chỗ */}
            <div style={{ background: '#FAF5F4', padding: '16px', borderRadius: '18px', border: '1px dashed #C4B5B0', marginBottom: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#89726B' }}>Mã đặt chỗ tra cứu:</span>
                <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, color: '#9D4124', fontSize: '1.1rem' }}>{bookingCode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#89726B' }}>Thời gian hẹn:</span>
                <span style={{ fontWeight: 700 }}>
                  {selectedTime} • {formatShortDate(selectedDate)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#89726B' }}>Số khách & Khu vực:</span>
                <span style={{ fontWeight: 700 }}>{selectedGuests} khách • {selectedZoneName}</span>
              </div>

              {preOrderItems.length > 0 && (
                <div style={{ borderTop: '1px dashed #EAE0DE', paddingTop: '8px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#89726B' }}>Món đặt trước ({totalDishesCount} phần):</span>
                    <span style={{ fontWeight: 800, color: '#9D4124' }}>{preOrderTotal.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#56423D', fontStyle: 'italic' }}>
                    {preOrderItems.map(i => `${i.qty}x ${i.name}`).join(', ')}
                  </div>
                </div>
              )}
            </div>

            <div className="reservation-actions-group">
              <Link
                to="/"
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '16px',
                  background: '#F0E6E4',
                  color: '#56423D',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box'
                }}
              >
                Về Trang Chủ
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  setCurrentStep(1);
                  setPreOrderItems([]);
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '16px',
                  background: '#9D4124',
                  color: '#FFFFFF',
                  border: 'none',
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(157, 65, 36, 0.3)'
                }}
              >
                Đặt Thêm Bàn Khác
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
