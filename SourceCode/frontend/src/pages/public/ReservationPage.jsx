import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import RomsLogo from '../../components/common/RomsLogo';
import { reservationApi } from '../../api/reservationApi';
import { customerApi } from '../../api/customerApi';

// Helper component hiển thị icon Material Symbols
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

export default function ReservationPage() {
  // Lấy ngày hôm nay theo giờ địa phương (YYYY-MM-DD) làm giá trị mặc định cho ngày đặt bàn
  const todayStr = getLocalDateString(0);

  // 1. Quản lý trạng thái bước đặt chỗ (1 -> 4)
  const [currentStep, setCurrentStep] = useState(1);

  // 2. Ngày dùng bữa: Chọn ngày cụ thể (mặc định hôm nay - ngày đặt bàn)
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // 3. Khung giờ: Giờ đại diện + chế độ nhập giờ khác
  const representativeTimes = ['11:30', '12:00', '18:00', '19:00', '20:00'];
  const [selectedTime, setSelectedTime] = useState('19:00');
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState('19:30');

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
          setSelectedZoneName(res.data[0].zoneName);
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
                flatDishes.push({
                  id: item.id,
                  name: item.name,
                  description: item.description,
                  price: item.price,
                  imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
                  categoryId: c.categoryId,
                  categoryName: c.categoryName,
                  isAvailable: item.isAvailable
                });
              });
            }
          });
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

  // Xử lý chọn khung giờ
  const handleSelectPresetTime = (time) => {
    setIsCustomTime(false);
    setSelectedTime(time);
  };

  const handleApplyCustomTime = (e) => {
    const timeVal = e.target.value;
    setCustomTimeInput(timeVal);
    setSelectedTime(timeVal);
  };

  // Xử lý chọn số lượng khách
  const handleSelectPresetGuests = (guests) => {
    setIsCustomGuests(false);
    setSelectedGuests(guests);
  };

  const handleApplyCustomGuests = (e) => {
    const val = parseInt(e.target.value, 10) || 1;
    setCustomGuestInput(val);
    setSelectedGuests(val);
  };

  // Pre-order handlers
  const handleAddDish = (dish) => {
    setPreOrderItems(prev => {
      const existing = prev.find(i => i.id === dish.id);
      if (existing) {
        return prev.map(i => i.id === dish.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...dish, qty: 1, note: '' }];
    });
  };

  const handleUpdateDishQty = (dishId, delta) => {
    setPreOrderItems(prev => {
      return prev.map(i => {
        if (i.id === dishId) {
          const next = i.qty + delta;
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
        alert('Vui lòng chọn ngày dùng bữa!');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Xác thực form thông tin khách
      if (!customerName.trim()) {
        alert('Vui lòng nhập Họ và tên của bạn!');
        return;
      }
      const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
      if (!customerPhone.trim() || !phoneRegex.test(customerPhone.trim())) {
        alert('Vui lòng nhập số điện thoại hợp lệ (10 chữ số, ví dụ: 0901234567)!');
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
        alert(errMsg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const filteredMenuItems = menuDishes.filter(d => {
    if (menuCatFilter !== 'ALL' && d.categoryId !== menuCatFilter) return false;
    if (menuSearch.trim() !== '') {
      return d.name?.toLowerCase().includes(menuSearch.toLowerCase()) ||
             d.description?.toLowerCase().includes(menuSearch.toLowerCase());
    }
    return true;
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
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          height: '76px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
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
      <section style={{ background: '#FCF1EF', padding: '40px 24px 30px', borderBottom: '1px solid #EAE0DE' }}>
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

          <h1 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '2.4rem', color: '#1F1B1A', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Đặt Bàn & Giữ Chỗ Trực Tuyến Tại <span style={{ color: '#9D4124' }}>ROMS</span>
          </h1>
          <p style={{ fontSize: '1rem', color: '#56423D', margin: 0, maxWidth: '680px' }}>
            Chọn trước ngày giờ, số khách và không gian yêu thích. Quản lý sẽ liên hệ trực tiếp qua số điện thoại để tư vấn và xếp vị trí bàn ưng ý nhất cho quý khách.
          </p>

          {/* Stepper (4 Steps) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginTop: '30px' }}>
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
      <section style={{ maxWidth: '1280px', margin: '40px auto 80px', padding: '0 24px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '30px', alignItems: 'flex-start' }}>
          {/* Left Form Flow (8 cols) */}
          <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* ============================================================== */}
            {/* STEP 1: CHỌN NGÀY CỤ THỂ, KHUNG GIỜ & SỐ LƯỢNG KHÁCH             */}
            {/* ============================================================== */}
            {currentStep === 1 && (
              <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '28px', border: '1px solid #F0E6E4', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
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

                {/* Date Selection: BỘ CHỌN NGÀY CỤ THỂ (MẶC ĐỊNH LÀ NGÀY ĐẶT BÀN / HÔM NAY) */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="event" size={18} style={{ color: '#9D4124' }} />
                      Ngày đặt bàn / dùng bữa: <span style={{ color: '#9D4124' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#89726B', fontWeight: 600 }}>
                      Mặc định: Hôm nay ({formatShortDate(todayStr)})
                    </span>
                  </div>


                  {/* Input date picker chọn ngày */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      min={todayStr}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value || todayStr)}
                      style={{
                        width: '100%',
                        padding: '13px 18px',
                        borderRadius: '14px',
                        border: '1.5px solid #EAE0DE',
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#1F1B1A',
                        background: '#FFF8F6',
                        outline: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Time Selection: KHUNG GIỜ ĐẠI DIỆN + NHẬP GIỜ KHÁC */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="schedule" size={18} style={{ color: '#9D4124' }} />
                      Khung giờ dùng bữa: <span style={{ color: '#9D4124' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#89726B' }}>
                      {isCustomTime ? 'Đang nhập giờ tùy chọn' : 'Đang chọn giờ đại diện'}
                    </span>
                  </div>

                  {/* Danh sách nút giờ đại diện */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '12px' }}>
                    {representativeTimes.map(t => {
                      const isSel = !isCustomTime && selectedTime === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleSelectPresetTime(t)}
                          style={{
                            padding: '12px 8px',
                            borderRadius: '12px',
                            border: isSel ? '2px solid #9D4124' : '1px solid #EAE0DE',
                            background: isSel ? '#9D4124' : '#FFF8F6',
                            color: isSel ? '#FFFFFF' : '#1F1B1A',
                            fontFamily: "'Epilogue', sans-serif",
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            cursor: 'pointer',
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
                        padding: '12px 8px',
                        borderRadius: '12px',
                        border: isCustomTime ? '2px solid #9D4124' : '1px dashed #9D4124',
                        background: isCustomTime ? '#FFDBC9' : '#FFFFFF',
                        color: '#9D4124',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Icon name="edit_calendar" size={16} /> Giờ khác
                    </button>
                  </div>

                  {/* Ô nhập giờ tùy ý (nếu chọn Giờ khác) */}
                  {isCustomTime && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFF8F6', padding: '12px 16px', borderRadius: '14px', border: '1px solid #FFDBC9' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#56423D' }}>
                        Nhập giờ mong muốn của bạn:
                      </span>
                      <input
                        type="time"
                        value={customTimeInput}
                        onChange={handleApplyCustomTime}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '10px',
                          border: '1.5px solid #9D4124',
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: '#9D4124',
                          background: '#FFFFFF',
                          outline: 'none'
                        }}
                      />
                      <span style={{ fontSize: '0.78rem', color: '#89726B' }}>
                        (Nhà hàng mở cửa phục vụ từ 10:00 đến 22:30 mỗi ngày)
                      </span>
                    </div>
                  )}
                </div>

                {/* Guest Count: SỐ KHÁCH ĐẠI DIỆN + NHẬP SỐ KHÁCH KHÁC */}
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="groups" size={18} style={{ color: '#9D4124' }} />
                      Số lượng khách: <span style={{ color: '#9D4124' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#89726B' }}>
                      {isCustomGuests ? 'Đang nhập số khách tùy chọn' : 'Đang chọn số khách đại diện'}
                    </span>
                  </div>

                  {/* Danh sách nút số khách đại diện */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '12px' }}>
                    {representativeGuests.map(g => {
                      const isSel = !isCustomGuests && selectedGuests === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => handleSelectPresetGuests(g)}
                          style={{
                            padding: '12px 6px',
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
                          <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{g} người</span>
                        </button>
                      );
                    })}

                    {/* Nút bật chế độ nhập số khách khác */}
                    <button
                      type="button"
                      onClick={() => setIsCustomGuests(true)}
                      style={{
                        padding: '12px 6px',
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
                      <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>Số khác</span>
                    </button>
                  </div>

                  {/* Ô nhập số lượng khách tùy ý (nếu chọn Số khác) */}
                  {isCustomGuests && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFF8F6', padding: '12px 16px', borderRadius: '14px', border: '1px solid #FFDBC9' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#56423D' }}>
                        Nhập số lượng khách chính xác:
                      </span>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={customGuestInput}
                        onChange={handleApplyCustomGuests}
                        style={{
                          width: '80px',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1.5px solid #9D4124',
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: '#9D4124',
                          background: '#FFFFFF',
                          outline: 'none',
                          textAlign: 'center'
                        }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A' }}>khách</span>
                      <span style={{ fontSize: '0.78rem', color: '#89726B' }}>
                        (Đoàn tiệc trên 20 khách vui lòng ghi chú thêm nhu cầu trang trí hoặc set menu)
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  style={{
                    width: '100%',
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
                    boxShadow: '0 6px 18px rgba(157, 65, 36, 0.3)'
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
              <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '28px', border: '1px solid #F0E6E4', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
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
                            setSelectedZoneName(z.zoneName);
                          }}
                          style={{
                            padding: '18px 20px',
                            borderRadius: '18px',
                            border: isSel ? '2px solid #9D4124' : '1px solid #EAE0DE',
                            background: isSel ? '#FFF8F6' : '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                            boxShadow: isSel ? '0 4px 14px rgba(157, 65, 36, 0.1)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              border: isSel ? '6px solid #9D4124' : '2px solid #C4B5B0',
                              background: '#FFFFFF',
                              flexShrink: 0
                            }} />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#1F1B1A' }}>
                                  {z.zoneName}
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

                <div style={{ display: 'flex', gap: '12px' }}>
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
            {/* STEP 3: PRE-ORDER GỌI MÓN TRƯỚC (TÙY CHỌN)                       */}
            {/* ============================================================== */}
            {currentStep === 3 && (
              <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '28px', border: '1px solid #F0E6E4', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFDBC9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9D4124' }}>
                      <Icon name="restaurant_menu" size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                          3. Đặt trước món ăn (Pre-order)
                        </h2>
                        <span style={{ fontSize: '0.72rem', background: '#FEF3C7', color: '#78350F', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                          Tùy chọn
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#89726B', marginTop: '2px' }}>
                        Bếp sẽ sơ chế chuẩn bị sẵn khi bạn tới bàn vào ngày: <strong style={{ color: '#9D4124' }}>{formatDisplayDate(selectedDate)}</strong> ({selectedTime})
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.82rem', color: '#9D4124', fontWeight: 700, background: '#FFF8F6', border: '1px solid #FFDBC9', padding: '6px 12px', borderRadius: '10px' }}>
                    Đã chọn: <b>{totalDishesCount} phần</b> ({preOrderTotal.toLocaleString('vi-VN')}₫)
                  </span>
                </div>

                {/* Filter and Search */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px', background: '#FFF8F6', border: '1px solid #EAE0DE', borderRadius: '12px', padding: '8px 12px' }}>
                    <Icon name="search" size={18} style={{ color: '#89726B' }} />
                    <input
                      type="text"
                      placeholder="Tìm món ngon khai vị, steak, vang..."
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                    <button
                      type="button"
                      onClick={() => setMenuCatFilter('ALL')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '10px',
                        border: 'none',
                        background: menuCatFilter === 'ALL' ? '#9D4124' : '#F6ECEA',
                        color: menuCatFilter === 'ALL' ? '#FFFFFF' : '#56423D',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Tất cả
                    </button>
                    {menuCategories.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setMenuCatFilter(c.id)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '10px',
                          border: 'none',
                          background: menuCatFilter === c.id ? '#9D4124' : '#F6ECEA',
                          color: menuCatFilter === c.id ? '#FFFFFF' : '#56423D',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dishes Grid */}
                {isLoadingMenu ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#89726B' }}>
                    <Icon name="sync" size={32} style={{ animation: 'spin 1s linear infinite', color: '#9D4124' }} />
                    <p style={{ margin: '8px 0 0', fontSize: '0.88rem' }}>Đang nạp thực đơn món ăn từ CSDL...</p>
                  </div>
                ) : filteredMenuItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#89726B', background: '#FFF8F6', borderRadius: '16px', marginBottom: '22px' }}>
                    <Icon name="search_off" size={36} style={{ color: '#C4B5B0', marginBottom: '6px' }} />
                    <p style={{ margin: 0, fontSize: '0.88rem' }}>Không tìm thấy món ăn nào phù hợp với bộ lọc</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', maxHeight: '400px', overflowY: 'auto', marginBottom: '22px', paddingRight: '4px' }}>
                    {filteredMenuItems.map(dish => {
                    const selected = preOrderItems.find(i => i.id === dish.id);
                    return (
                      <div
                        key={dish.id}
                        style={{
                          background: selected ? '#FFF8F6' : '#FFFFFF',
                          borderRadius: '16px',
                          border: selected ? '2px solid #9D4124' : '1px solid #F0E6E4',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '10px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <img
                            src={dish.imageUrl}
                            alt={dish.name}
                            style={{ width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
                          />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h4 style={{ margin: 0, fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.9rem', color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {dish.name}
                            </h4>
                            <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#89726B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {dish.description}
                            </p>
                          </div>
                        </div>

                        {selected && (
                          <input
                            type="text"
                            placeholder="Ghi chú (chín vừa, ít sốt...)"
                            value={selected.note || ''}
                            onChange={(e) => handleUpdateDishNote(dish.id, e.target.value)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid #EAE0DE',
                              background: '#FFFFFF',
                              fontSize: '0.72rem',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px dashed #F6ECEA' }}>
                          <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.95rem', color: '#9D4124' }}>
                            {dish.price.toLocaleString('vi-VN')}₫
                          </span>

                          {selected ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleUpdateDishQty(dish.id, -1)}
                                style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #EAE0DE', background: '#F6ECEA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}
                              >
                                -
                              </button>
                              <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{selected.qty}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateDishQty(dish.id, 1)}
                                style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', background: '#9D4124', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddDish(dish)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '8px',
                                border: '1px solid #9D4124',
                                background: '#FFF8F6',
                                color: '#9D4124',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
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

                {/* Pre-order Navigation */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    style={{
                      padding: '14px 20px',
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
                    onClick={() => setCurrentStep(4)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '16px',
                      background: '#FFF8F6',
                      color: '#9D4124',
                      border: '1.5px solid #FFDBC9',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      cursor: 'pointer'
                    }}
                  >
                    Bỏ qua & Gọi món tại bàn
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    style={{
                      flex: 1.5,
                      padding: '14px',
                      borderRadius: '16px',
                      background: '#9D4124',
                      color: '#FFF',
                      border: 'none',
                      fontFamily: "'Epilogue', sans-serif",
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 6px 18px rgba(157, 65, 36, 0.3)'
                    }}
                  >
                    <span>
                      {totalDishesCount > 0 ? `Xác nhận ${totalDishesCount} món & Tiếp tục` : 'Tiếp tục điền thông tin'}
                    </span>
                    <Icon name="arrow_forward" size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* STEP 4: ĐIỀN THÔNG TIN KHÁCH & XÁC NHẬN GIỮ CHỖ (SUBMIT PENDING)  */}
            {/* ============================================================== */}
            {currentStep === 4 && (
              <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '28px', border: '1px solid #F0E6E4', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '6px' }}>
                      Họ và tên của bạn <span style={{ color: '#9D4124' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '13px 16px',
                        borderRadius: '14px',
                        border: '1.5px solid #EAE0DE',
                        fontSize: '0.92rem',
                        color: '#1F1B1A',
                        background: '#FFF8F6',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '6px' }}>
                        Số điện thoại nhận cuộc gọi xác nhận <span style={{ color: '#9D4124' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="090xxxxxxx (10 số)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '13px 16px',
                          borderRadius: '14px',
                          border: '1.5px solid #EAE0DE',
                          fontSize: '0.92rem',
                          color: '#1F1B1A',
                          background: '#FFF8F6',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '6px' }}>
                        Email nhận xác nhận (tùy chọn)
                      </label>
                      <input
                        type="email"
                        placeholder="email@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '13px 16px',
                          borderRadius: '14px',
                          border: '1.5px solid #EAE0DE',
                          fontSize: '0.92rem',
                          color: '#1F1B1A',
                          background: '#FFF8F6',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
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
                        resize: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    style={{
                      flex: 1,
                      padding: '14px',
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
                    disabled={isSubmitting}
                    onClick={handleNextStep}
                    style={{
                      flex: 2,
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
                      boxShadow: '0 8px 24px rgba(157, 65, 36, 0.35)'
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
              </div>
            )}
          </div>

          {/* Right Summary Card (4 cols) */}
          <div style={{ gridColumn: 'span 4', position: 'sticky', top: '96px' }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '24px',
              border: '1px solid #F0E6E4',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
            }}>
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
                Hotline hỗ trợ trực tiếp: <strong style={{ color: '#9D4124' }}>1900 8924</strong>
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
            padding: '36px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#DDE8AB',
              color: '#596232',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Icon name="phone_callback" size={40} fill={1} />
            </div>

            <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#1F1B1A', margin: '0 0 8px' }}>
              Yêu Cầu Đã Gửi Tới Quản Lý!
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#56423D', margin: '0 0 20px', lineHeight: 1.5 }}>
              Cảm ơn quý khách <strong>{customerName}</strong>. Nhà hàng đã ghi nhận yêu cầu giữ chỗ của quý khách.
            </p>

            {/* Hộp thông báo quản lý gọi điện */}
            <div style={{
              background: '#FFF8F6',
              padding: '16px',
              borderRadius: '16px',
              border: '1.5px solid #FFDBC9',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left'
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FFDBC9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9D4124', flexShrink: 0 }}>
                <Icon name="phone_in_talk" size={22} />
              </div>
              <div style={{ fontSize: '0.82rem', color: '#56423D' }}>
                Quản lý nhà hàng sẽ gọi điện thoại tới số <strong style={{ color: '#9D4124', fontSize: '0.95rem' }}>{customerPhone}</strong> trong vòng <strong>5-10 phút</strong> để xác nhận và sắp xếp vị trí bàn ưng ý nhất cho bạn!
              </div>
            </div>

            {/* Chi tiết phiếu đặt chỗ */}
            <div style={{ background: '#FAF5F4', padding: '16px 18px', borderRadius: '18px', border: '1px dashed #C4B5B0', marginBottom: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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

            <div style={{ display: 'flex', gap: '12px' }}>
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
                  display: 'inline-block'
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
