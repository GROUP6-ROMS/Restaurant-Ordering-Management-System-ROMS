import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import RomsLogo from '../../components/common/RomsLogo';
import { reservationApi } from '../../api/reservationApi';
import Icon from '../../components/common/Icon';
import { useDialog } from '../../context/DialogContext';
import { useRestaurantProfile } from '../../utils/restaurantConfig';
import './publicPages.css';

export default function ReservationTrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';
  const initialPhone = searchParams.get('phone') || '';

  const [searchInput, setSearchInput] = useState(initialCode || initialPhone);
  const [reservation, setReservation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const { showAlert } = useDialog();
  const restaurantProfile = useRestaurantProfile();
  const hotline = restaurantProfile?.hotline || '1900 6868';

  const handleLookup = useCallback(async (queryValue) => {
    const raw = (queryValue !== undefined ? queryValue : searchInput).trim();
    if (!raw) {
      setErrorMessage('Vui lòng nhập Mã đặt chỗ (ví dụ: RES-20261113-1234) hoặc Số điện thoại đặt bàn!');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setHasSearched(true);

    try {
      const isPhone = /^[0-9+() -]{9,15}$/.test(raw) && !raw.toUpperCase().startsWith('RES');
      const params = isPhone ? { phone: raw } : { code: raw.toUpperCase() };

      const res = await reservationApi.lookupReservation(params);
      if (res && res.data) {
        setReservation(res.data);
        if (!isPhone) {
          setSearchParams({ code: raw.toUpperCase() });
        } else {
          setSearchParams({ phone: raw });
        }
      } else {
        setReservation(null);
        setErrorMessage('Không tìm thấy đơn đặt bàn phù hợp. Vui lòng kiểm tra lại thông tin!');
      }
    } catch (err) {
      console.error('Lỗi khi tra cứu đơn đặt bàn:', err);
      setReservation(null);
      const msg = err.response?.data?.message || 'Không tìm thấy thông tin đơn đặt bàn. Vui lòng kiểm tra lại mã hoặc số điện thoại!';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [searchInput, setSearchParams]);

  useEffect(() => {
    if (initialCode) {
      handleLookup(initialCode);
    } else if (initialPhone) {
      handleLookup(initialPhone);
    }
  }, [initialCode, initialPhone, handleLookup]);

  const handleCopyCode = () => {
    if (!reservation?.bookingCode) return;
    navigator.clipboard.writeText(reservation.bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tính trạng thái Stepper
  // 1: PENDING (Chờ duyệt)
  // 2: CONFIRMED (Đã xếp bàn & Giữ chỗ)
  // 3: OCCUPIED (Đang dùng bữa)
  // 4: COMPLETED (Hoàn tất)
  // -1: CANCELLED (Đã hủy)
  const getStepIndex = (status) => {
    switch (status) {
      case 'PENDING': return 1;
      case 'CONFIRMED': return 2;
      case 'COMPLETED': return 4;
      case 'CANCELLED': return -1;
      default: return 1;
    }
  };

  const currentStep = reservation ? getStepIndex(reservation.status) : 0;

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
        <div className="public-header-container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <RomsLogo size={40} showText={true} textSubtitle="Tra Cứu Đặt Bàn" />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              to="/reservation"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                background: '#9D4124',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.84rem'
              }}
            >
              <Icon name="add" size={16} /> Đặt Bàn Mới
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
              <Icon name="home" size={18} /> Trang Chủ
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Content */}
      <main style={{ flex: 1, maxWidth: '840px', width: '100%', margin: '0 auto', padding: '32px 20px 60px', boxSizing: 'border-box' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: '#FFDBC9', color: '#9D4124', fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', marginBottom: '10px' }}>
            <Icon name="radar" size={16} /> Tra Cứu Tiến Độ Thời Gian Thực
          </div>
          <h1 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2rem)', margin: '0 0 8px', color: '#1F1B1A' }}>
            Theo Dõi Đơn Đặt Bàn
          </h1>
          <p style={{ fontSize: '0.92rem', color: '#56423D', margin: 0 }}>
            Nhập Mã đặt chỗ (ví dụ: <strong style={{ color: '#9D4124' }}>RES-20261113-1234</strong>) hoặc Số điện thoại để kiểm tra vị trí bàn và tình trạng xác nhận.
          </p>
        </div>

        {/* Search Box */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '18px',
          padding: '12px 14px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1.5px solid #F0E6E4',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div style={{ color: '#89726B', paddingLeft: '8px' }}>
            <Icon name="search" size={22} />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            placeholder="Nhập mã đặt chỗ (RES-...) hoặc số điện thoại..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#1F1B1A',
              background: 'transparent'
            }}
          />
          <button
            type="button"
            onClick={() => handleLookup()}
            disabled={isLoading}
            style={{
              padding: '11px 22px',
              borderRadius: '12px',
              background: '#9D4124',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(157,65,36,0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            {isLoading ? <Icon name="sync" size={18} className="spin" /> : <Icon name="arrow_forward" size={18} />}
            {isLoading ? 'Đang tìm...' : 'Tra Cứu'}
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div style={{
            background: '#FEF2F2',
            border: '1.5px solid #FCA5A5',
            borderRadius: '14px',
            padding: '14px 18px',
            color: '#991B1B',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '24px'
          }}>
            <Icon name="error" size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Reservation Details Display */}
        {reservation && (
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
            border: '1px solid #F0E6E4'
          }}>
            {/* Header: Booking Code & Status Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #F0E6E4', paddingBottom: '18px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#89726B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Mã Đặt Chỗ
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.4rem', color: '#9D4124' }}>
                    {reservation.bookingCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    title="Sao chép mã"
                    style={{
                      background: copied ? '#D1FAE5' : '#F5F5F4',
                      color: copied ? '#065F46' : '#57534E',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Icon name={copied ? "check" : "content_copy"} size={14} />
                    {copied ? 'Đã chép' : 'Chép mã'}
                  </button>
                </div>
              </div>

              <div>
                {reservation.status === 'PENDING' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FEF3C7', color: '#92400E', padding: '6px 14px', borderRadius: '20px', fontWeight: 800, fontSize: '0.82rem', border: '1px solid #FCD34D' }}>
                    <Icon name="schedule" size={16} /> Chờ Quản lý xác nhận
                  </span>
                )}
                {reservation.status === 'CONFIRMED' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#D1FAE5', color: '#065F46', padding: '6px 14px', borderRadius: '20px', fontWeight: 800, fontSize: '0.82rem', border: '1px solid #A7F3D0' }}>
                    <Icon name="check_circle" size={16} /> Đã Xếp Bàn & Giữ Chỗ
                  </span>
                )}
                {reservation.status === 'COMPLETED' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#DBEAFE', color: '#1E40AF', padding: '6px 14px', borderRadius: '20px', fontWeight: 800, fontSize: '0.82rem', border: '1px solid #BFDBFE' }}>
                    <Icon name="task_alt" size={16} /> Đã Hoàn Tất Phục Vụ
                  </span>
                )}
                {reservation.status === 'CANCELLED' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FEE2E2', color: '#991B1B', padding: '6px 14px', borderRadius: '20px', fontWeight: 800, fontSize: '0.82rem', border: '1px solid #FECACA' }}>
                    <Icon name="cancel" size={16} /> Đã Hủy Đơn
                  </span>
                )}
              </div>
            </div>

            {/* Stepper (Tiến trình xử lý) */}
            {currentStep !== -1 && (
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', margin: '0 20px' }}>
                  {/* Connecting Line */}
                  <div style={{
                    position: 'absolute',
                    top: '18px',
                    left: '0',
                    right: '0',
                    height: '3px',
                    background: '#EAE0DE',
                    zIndex: 1
                  }}>
                    <div style={{
                      height: '100%',
                      background: '#059669',
                      width: currentStep >= 4 ? '100%' : (currentStep >= 2 ? '50%' : '0%'),
                      transition: 'width 0.4s ease'
                    }} />
                  </div>

                  {/* Step 1: PENDING */}
                  <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', width: '90px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: currentStep >= 1 ? '#059669' : '#E5E7EB',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 6px',
                      fontWeight: 800,
                      boxShadow: currentStep >= 1 ? '0 2px 8px rgba(5,150,105,0.3)' : 'none'
                    }}>
                      <Icon name="send" size={18} />
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: currentStep === 1 ? 800 : 600, color: currentStep >= 1 ? '#1F1B1A' : '#9CA3AF' }}>
                      Gửi Yêu Cầu
                    </div>
                  </div>

                  {/* Step 2: CONFIRMED */}
                  <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', width: '90px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: currentStep >= 2 ? '#059669' : '#E5E7EB',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 6px',
                      fontWeight: 800,
                      boxShadow: currentStep >= 2 ? '0 2px 8px rgba(5,150,105,0.3)' : 'none'
                    }}>
                      <Icon name="table_restaurant" size={18} />
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: currentStep === 2 ? 800 : 600, color: currentStep >= 2 ? '#1F1B1A' : '#9CA3AF' }}>
                      Đã Xếp Bàn
                    </div>
                  </div>

                  {/* Step 3: COMPLETED */}
                  <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', width: '90px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: currentStep >= 4 ? '#059669' : '#E5E7EB',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 6px',
                      fontWeight: 800
                    }}>
                      <Icon name="task_alt" size={18} />
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: currentStep >= 4 ? 800 : 600, color: currentStep >= 4 ? '#1F1B1A' : '#9CA3AF' }}>
                      Đã Đón Khách
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cancelled Notice */}
            {reservation.status === 'CANCELLED' && (
              <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', color: '#991B1B', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 800, marginBottom: '4px' }}>Đơn đặt bàn đã bị hủy</div>
                <div>Lý do: <strong>{reservation.cancelReason || 'Theo yêu cầu của khách hàng hoặc do nhà hàng quá tải'}</strong></div>
              </div>
            )}

            {/* Assigned Table Card (Nếu đã CONFIRMED) */}
            {reservation.tableNumber && (
              <div style={{
                background: '#ECFDF5',
                border: '1.5px solid #059669',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#059669',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon name="meeting_room" size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.76rem', color: '#047857', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Vị trí bàn ăn dành riêng cho bạn
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#065F46' }}>
                      Bàn {reservation.tableNumber} {reservation.tableName && `(${reservation.tableName})`}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#047857', fontWeight: 700, background: '#D1FAE5', padding: '6px 12px', borderRadius: '8px' }}>
                  {reservation.requestedZoneName || reservation.requestedZone || 'Khu vực chuẩn'}
                </div>
              </div>
            )}

            {/* Core Info Grid */}
            <div style={{
              background: '#FFF8F6',
              borderRadius: '16px',
              padding: '16px 20px',
              border: '1px solid #FFDBC9',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              fontSize: '0.86rem',
              marginBottom: '20px'
            }}>
              <div>
                <span style={{ color: '#89726B', display: 'block', fontSize: '0.76rem', fontWeight: 600 }}>Thời gian hẹn:</span>
                <span style={{ fontWeight: 800, color: '#1F1B1A', fontSize: '0.96rem' }}>
                  {reservation.formattedTime} • {reservation.formattedDate}
                </span>
              </div>

              <div>
                <span style={{ color: '#89726B', display: 'block', fontSize: '0.76rem', fontWeight: 600 }}>Số lượng thực khách:</span>
                <span style={{ fontWeight: 800, color: '#1F1B1A' }}>
                  {reservation.guestCount} khách ({reservation.requestedZoneName || reservation.requestedZone || 'Tùy chọn'})
                </span>
              </div>

              <div>
                <span style={{ color: '#89726B', display: 'block', fontSize: '0.76rem', fontWeight: 600 }}>Người liên hệ:</span>
                <span style={{ fontWeight: 800, color: '#1F1B1A' }}>
                  {reservation.customerName} ({reservation.customerPhone})
                </span>
              </div>

              {reservation.customerEmail && (
                <div>
                  <span style={{ color: '#89726B', display: 'block', fontSize: '0.76rem', fontWeight: 600 }}>Email thông báo:</span>
                  <span style={{ fontWeight: 700, color: '#56423D' }}>{reservation.customerEmail}</span>
                </div>
              )}

              {reservation.note && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#89726B', display: 'block', fontSize: '0.76rem', fontWeight: 600 }}>Ghi chú đặc biệt:</span>
                  <span style={{ fontWeight: 600, color: '#9D4124', fontStyle: 'italic' }}>"{reservation.note}"</span>
                </div>
              )}
            </div>

            {/* Pre-order Dishes (Món đặt trước nếu có) */}
            {reservation.preOrderItems && reservation.preOrderItems.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1F1B1A', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="restaurant_menu" size={18} style={{ color: '#9D4124' }} />
                  <span>Món Ăn Đặt Trước ({reservation.preOrderItemsCount || reservation.preOrderItems.length} phần)</span>
                </div>
                <div style={{ border: '1px solid #EAE0DE', borderRadius: '14px', overflow: 'hidden' }}>
                  {reservation.preOrderItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: idx < reservation.preOrderItems.length - 1 ? '1px dashed #F0E6E4' : 'none',
                        background: idx % 2 === 0 ? '#FFFFFF' : '#FAF7F5',
                        fontSize: '0.84rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.name} style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover' }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: '#1F1B1A' }}>{item.name}</div>
                          {item.note && <div style={{ fontSize: '0.72rem', color: '#89726B', fontStyle: 'italic' }}>{item.note}</div>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: '#9D4124' }}>
                          {item.subtotal ? Number(item.subtotal).toLocaleString('vi-VN') + '₫' : ''}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#56423D' }}>x{item.quantity} phần</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: '12px 14px', background: '#FFF8F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #FFDBC9', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 700, color: '#56423D' }}>Tạm tính món đặt trước:</span>
                    <span style={{ fontWeight: 900, color: '#9D4124', fontSize: '1.05rem' }}>
                      {reservation.preOrderTotal ? Number(reservation.preOrderTotal).toLocaleString('vi-VN') + '₫' : '0₫'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Buffer Lock & Arrival Instructions */}
            <div style={{
              background: '#FFFBEB',
              border: '1.5px solid #FCD34D',
              borderRadius: '14px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              fontSize: '0.82rem',
              color: '#92400E',
              lineHeight: 1.5
            }}>
              <Icon name="shield" size={22} style={{ color: '#D97706', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Chính sách giữ bàn an toàn (Buffer Lock):</strong> Bàn ăn sẽ được khóa bảo vệ độc quyền trước giờ hẹn 60 phút và duy trì giữ bàn trong vòng <strong>45 phút</strong> kể từ giờ hẹn ({reservation.formattedTime}). Khi đến nhà hàng, quý khách chỉ cần đọc <strong>Mã đặt chỗ ({reservation.bookingCode})</strong> hoặc <strong>Số điện thoại</strong> cho nhân viên lễ tân.
              </div>
            </div>
          </div>
        )}

        {/* Empty state when searched and not found */}
        {hasSearched && !reservation && !errorMessage && !isLoading && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#89726B' }}>
            <Icon name="search_off" size={48} style={{ opacity: 0.5, marginBottom: '12px' }} />
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1F1B1A', marginBottom: '6px' }}>
              Không tìm thấy đơn đặt bàn
            </div>
            <div style={{ fontSize: '0.85rem' }}>
              Vui lòng kiểm tra lại Mã đặt chỗ (ví dụ: RES-20261113-1234) hoặc Số điện thoại.
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ background: '#FAF7F5', borderTop: '1px solid #F0E6E4', padding: '24px 20px', textAlign: 'center', fontSize: '0.82rem', color: '#89726B' }}>
        Tổng đài hỗ trợ thực khách 24/7: <strong style={{ color: '#9D4124' }}>{hotline}</strong> • Email: roms.service.restaurant@gmail.com<br />
        © 2026 ROMS Restaurant Management System
      </footer>
    </div>
  );
}
