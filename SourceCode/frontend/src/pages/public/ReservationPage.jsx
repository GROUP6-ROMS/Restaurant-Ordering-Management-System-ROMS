import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import RomsLogo from '../../components/common/RomsLogo';
import { MOCK_CATEGORIES, MOCK_MENU_ITEMS } from '../../mock/mockData';

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

export default function ReservationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('2025-09-21');
  const [selectedTime, setSelectedTime] = useState('19:00');
  const [selectedGuests, setSelectedGuests] = useState(4);
  const [selectedZone, setSelectedZone] = useState('Sảnh Chính - Tầng 1');

  // Pre-order items state
  const [preOrderItems, setPreOrderItems] = useState([]);
  const [menuCatFilter, setMenuCatFilter] = useState('ALL');
  const [menuSearch, setMenuSearch] = useState('');

  // Customer contact info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialNote, setSpecialNote] = useState('');

  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingCode, setBookingCode] = useState('');

  const dates = [
    { label: 'Hôm nay', value: '2025-09-21', day: '21/09', weekday: 'Chủ Nhật' },
    { label: 'Ngày mai', value: '2025-09-22', day: '22/09', weekday: 'Thứ Hai' },
    { label: 'Sắp tới', value: '2025-09-23', day: '23/09', weekday: 'Thứ Ba' },
    { label: 'Sắp tới', value: '2025-09-24', day: '24/09', weekday: 'Thứ Tư' }
  ];

  const times = ['11:30', '12:00', '12:30', '18:00', '18:30', '19:00', '19:30', '20:00'];

  const zones = [
    { id: 'z1', name: 'Sảnh Chính - Tầng 1', desc: 'Không gian ấm cúng, thiết kế hiện đại và dàn đèn đồng nghệ thuật', badge: 'Phổ biến' },
    { id: 'z2', name: 'Ban Công - Tầng 2', desc: 'Tầm nhìn thoáng đãng nhìn ra phố cổ, lãng mạn cho cặp đôi', badge: 'View đẹp' },
    { id: 'z3', name: 'Phòng Riêng VIP', desc: 'Cách âm tuyệt đối, thích hợp tiếp khách và tiệc gia đình sang trọng', badge: 'Riêng tư' }
  ];

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

  const handleNextStep = (e) => {
    if (e) e.preventDefault();
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (!customerName.trim() || !customerPhone.trim()) {
        alert('Vui lòng điền Họ tên và Số điện thoại liên hệ!');
        return;
      }
      const code = 'ROM-RES-' + Math.floor(1000 + Math.random() * 9000);
      setBookingCode(code);
      setIsSuccess(true);
    }
  };

  const filteredMenuItems = MOCK_MENU_ITEMS.filter(d => {
    if (menuCatFilter !== 'ALL' && d.categoryId !== menuCatFilter) return false;
    if (menuSearch.trim() !== '') {
      return d.name.toLowerCase().includes(menuSearch.toLowerCase());
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
            Hệ thống đặt bàn & gọi món trước
          </div>

          <h1 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '2.4rem', color: '#1F1B1A', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Đặt Bàn & Gọi Món Trước Tại <span style={{ color: '#9D4124' }}>ROMS</span>
          </h1>
          <p style={{ fontSize: '1rem', color: '#56423D', margin: 0, maxWidth: '680px' }}>
            Thưởng thức ẩm thực trọn vẹn, chọn trước món ngon để nhà hàng chế biến đúng chuẩn nhiệt độ khi bạn vừa đến bàn.
          </p>

          {/* Stepper (4 Steps) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginTop: '30px' }}>
            {[
              { step: 1, title: 'Thời gian & Số khách' },
              { step: 2, title: 'Chọn khu vực bàn' },
              { step: 3, title: 'Order món trước (Tùy chọn)' },
              { step: 4, title: 'Xác nhận giữ chỗ' }
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
            {/* STEP 1: Date, Time & Guest Count */}
            {currentStep === 1 && (
              <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '28px', border: '1px solid #F0E6E4', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFDBC9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9D4124' }}>
                    <Icon name="calendar_today" size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                      1. Chọn ngày, giờ & số khách
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#89726B' }}>Lựa chọn khung giờ dùng bữa phù hợp với bạn</span>
                  </div>
                </div>

                {/* Pre-order Promo Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, #FFF8F6 0%, #FCF1EF 100%)',
                  border: '1px solid #FFDBC9',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  marginBottom: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="skillet" size={20} style={{ color: '#9D4124' }} />
                    <span style={{ fontSize: '0.82rem', color: '#56423D' }}>
                      Có thể <strong>đặt trước món ăn</strong> tránh đợi lâu: nhà hàng sẽ sơ chế và nấu chuẩn bị ngay khi bạn đến!
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9D4124', background: '#FFDBC9', padding: '3px 8px', borderRadius: '6px' }}>
                    Tiết kiệm 15-20 phút chờ
                  </span>
                </div>

                {/* Date selection */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '10px' }}>
                    Ngày dùng bữa:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {dates.map(d => {
                      const isSel = selectedDate === d.value;
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => setSelectedDate(d.value)}
                          style={{
                            padding: '14px 10px',
                            borderRadius: '16px',
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
                          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, opacity: 0.85 }}>{d.label}</span>
                          <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem' }}>{d.day}</span>
                          <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>{d.weekday}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time selection */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '10px' }}>
                    Khung giờ:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {times.map(t => {
                      const isSel = selectedTime === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSelectedTime(t)}
                          style={{
                            padding: '12px',
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
                  </div>
                </div>

                {/* Guest count */}
                <div style={{ marginBottom: '28px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '10px' }}>
                    Số lượng khách:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                    {[1, 2, 4, 6, 8, 12].map(g => {
                      const isSel = selectedGuests === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setSelectedGuests(g)}
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
                            gap: '4px'
                          }}
                        >
                          <Icon name="person" size={20} />
                          <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{g} người</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
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

            {/* STEP 2: Choose Dining Zone */}
            {currentStep === 2 && (
              <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '28px', border: '1px solid #F0E6E4', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFDBC9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9D4124' }}>
                    <Icon name="storefront" size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                      2. Chọn khu vực bàn ngồi
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#89726B' }}>Không gian nhà hàng ROMS được bố trí theo từng trải nghiệm</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                  {zones.map(z => {
                    const isSel = selectedZone === z.name;
                    return (
                      <div
                        key={z.id}
                        onClick={() => setSelectedZone(z.name)}
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
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: isSel ? '#9D4124' : '#F6ECEA',
                            color: isSel ? '#FFFFFF' : '#9D4124',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Icon name="table_restaurant" size={22} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#1F1B1A', margin: 0 }}>
                                {z.name}
                              </h4>
                              <span style={{ padding: '2px 8px', borderRadius: '9999px', background: '#DDE8AB', color: '#181E00', fontSize: '0.72rem', fontWeight: 700 }}>
                                {z.badge}
                              </span>
                            </div>
                            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#56423D' }}>
                              {z.desc}
                            </p>
                          </div>
                        </div>

                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: isSel ? '6px solid #9D4124' : '2px solid #CBD5E1',
                          background: '#FFFFFF',
                          flexShrink: 0
                        }} />
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
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
                    onClick={() => setCurrentStep(3)}
                    style={{
                      flex: 2,
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
                    <span>Tiếp tục: Gọi món trước</span>
                    <Icon name="restaurant_menu" size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PRE-ORDER DISHES (GỌI MÓN TRƯỚC) */}
            {currentStep === 3 && (
              <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '28px', border: '1px solid #F0E6E4', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
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
                      <span style={{ fontSize: '0.8rem', color: '#89726B' }}>
                        Chọn trước món ngon để nhà hàng sơ chế và phục vụ nóng hổi ngay khi bạn đến!
                      </span>
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
                    {MOCK_CATEGORIES.map(c => (
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', maxHeight: '420px', overflowY: 'auto', marginBottom: '22px', paddingRight: '4px' }}>
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
                            style={{ width: '72px', height: '72px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
                          />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              {dish.tag && (
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: '#FFDBC9', color: '#9D4124' }}>
                                  {dish.tag}
                                </span>
                              )}
                            </div>
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
                            placeholder="Ghi chú (chín kỹ, ít đá...)"
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
                                style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #EAE0DE', background: '#F6ECEA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddDish(dish)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                background: '#9D4124',
                                color: '#FFFFFF',
                                border: 'none',
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

            {/* STEP 4: Customer Information & Final Confirmation */}
            {currentStep === 4 && (
              <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '28px', border: '1px solid #F0E6E4', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFDBC9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9D4124' }}>
                    <Icon name="person" size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                      4. Thông tin người đặt bàn
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#89726B' }}>ROMS sẽ gửi tin nhắn SMS xác nhận giữ chỗ tới số điện thoại này</span>
                  </div>
                </div>

                {/* Pre-order Preview alert if any */}
                {preOrderItems.length > 0 && (
                  <div style={{ background: '#FFF8F6', border: '1px dashed #9D4124', borderRadius: '16px', padding: '14px 18px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#9D4124', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="restaurant_menu" size={18} />
                        Món Ăn Đặt Trước ({totalDishesCount} phần)
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        style={{ border: 'none', background: 'transparent', color: '#9D4124', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        Sửa món
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {preOrderItems.map(item => (
                        <span key={item.id} style={{ background: '#FFFFFF', border: '1px solid #FFDBC9', borderRadius: '8px', padding: '4px 10px', fontSize: '0.78rem', color: '#1F1B1A' }}>
                          <b>{item.qty}x</b> {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {preOrderItems.length === 0 && (
                  <div style={{
                    background: '#FFFDF0',
                    border: '1px dashed #F59E0B',
                    borderRadius: '16px',
                    padding: '14px 18px',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon name="tips_and_updates" size={20} style={{ color: '#D97706' }} />
                      <span style={{ fontSize: '0.82rem', color: '#78350F' }}>
                        Chưa chọn món? <strong>Đặt món trước</strong> giúp bếp chuẩn bị và phục vụ đúng giờ bạn đến, tránh chờ lên món lâu!
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: '1px solid #D97706',
                        background: '#FFFFFF',
                        color: '#B45309',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + Chọn Món Ngay
                    </button>
                  </div>
                )}

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
                        Số điện thoại <span style={{ color: '#9D4124' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="090xxxxxxx"
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
                        Email nhận xác nhận
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
                      Ghi chú đặc biệt (Khẩu vị, dịp sinh nhật, kỷ niệm...):
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ví dụ: Kỷ niệm ngày cưới, chuẩn bị ghế trẻ em, không ăn cay..."
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
                    onClick={handleNextStep}
                    style={{
                      flex: 2,
                      padding: '15px',
                      borderRadius: '16px',
                      background: '#9D4124',
                      color: '#FFF',
                      border: 'none',
                      fontFamily: "'Epilogue', sans-serif",
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 8px 24px rgba(157, 65, 36, 0.35)'
                    }}
                  >
                    <Icon name="check_circle" size={22} fill={1} />
                    <span>Xác Nhận Giữ Chỗ Ngay</span>
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
                  <span style={{ color: '#89726B' }}>Thời gian:</span>
                  <span style={{ fontWeight: 800, color: '#9D4124' }}>{selectedTime} • {selectedDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#89726B' }}>Số lượng khách:</span>
                  <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{selectedGuests} khách</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#89726B' }}>Khu vực:</span>
                  <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{selectedZone}</span>
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
                  <Icon name="verified" size={16} /> Tiêu chuẩn dịch vụ ROMS
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#56423D', lineHeight: 1.45 }}>
                  Nhà hàng cam kết giữ bàn trong vòng <strong>20 phút</strong> kể từ giờ hẹn. Món đặt trước sẽ được bắt đầu sơ chế trước giờ hẹn 15 phút.
                </p>
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.78rem', color: '#89726B' }}>
                Hotline hỗ trợ: <strong style={{ color: '#9D4124' }}>1900 8924</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUCCESS MODAL */}
      {isSuccess && (
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
            borderRadius: '28px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: '#DDE8AB',
              color: '#596232',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Icon name="check_circle" size={40} fill={1} />
            </div>

            <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.45rem', color: '#1F1B1A', margin: '0 0 6px' }}>
              Đặt Bàn Thành Công!
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#56423D', margin: '0 0 20px' }}>
              Cảm ơn quý khách <strong>{customerName}</strong>. ROMS đã ghi nhận thông tin giữ chỗ và sẵn sàng phục vụ quý khách.
            </p>

            <div style={{ background: '#FFF8F6', padding: '16px 18px', borderRadius: '18px', border: '1.5px dashed #9D4124', marginBottom: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#89726B' }}>Mã đặt chỗ:</span>
                <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, color: '#9D4124', fontSize: '1.05rem' }}>{bookingCode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#89726B' }}>Thời gian:</span>
                <span style={{ fontWeight: 700 }}>{selectedTime} • {selectedDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#89726B' }}>Số khách & Khu vực:</span>
                <span style={{ fontWeight: 700 }}>{selectedGuests} khách • {selectedZone}</span>
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

            <div style={{ display: 'flex', gap: '10px' }}>
              <Link
                to="/"
                style={{
                  flex: 1,
                  padding: '13px',
                  borderRadius: '14px',
                  background: '#F0E6E4',
                  color: '#56423D',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              >
                Về Trang Chủ
              </Link>
              <Link
                to="/dining/welcome?table=01"
                style={{
                  flex: 1,
                  padding: '13px',
                  borderRadius: '14px',
                  background: '#9D4124',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 14px rgba(157, 65, 36, 0.3)'
                }}
              >
                Trải Nghiệm Gọi Món
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
