import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { tableApi } from '../../api/tableApi';
import Icon from '../../components/common/Icon';
import RomsLogo from '../../components/common/RomsLogo';
import { useRestaurantProfile } from '../../utils/restaurantConfig';
import { subscribeRealtimeEvents } from '../../utils/realtimeSync';

export default function TableWelcomePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { tableInfo, setTableInfo, cartItems, totalCount, totalPrice } = useCart();
  const restaurantProfile = useRestaurantProfile();

  const rawTable = searchParams.get('table');
  const tokenParam = searchParams.get('token');

  const [guestCount, setGuestCount] = useState(tableInfo?.guestCount || 4);
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // State xác thực mã QR thời gian thực từ Backend
  const [isVerifying, setIsVerifying] = useState(true);
  const [verifiedTable, setVerifiedTable] = useState(null);
  const [verifyError, setVerifyError] = useState(null);

  // Xác định mã bàn chuẩn kỹ thuật (T-01, B-02, VIP-01)
  const tableCode = verifiedTable?.code || verifiedTable?.tableNumber || (
    rawTable
      ? (rawTable.toUpperCase().startsWith('T-') || rawTable.toUpperCase().startsWith('B-') || rawTable.toUpperCase().startsWith('VIP')
          ? rawTable.toUpperCase()
          : `Bàn ${rawTable}`)
      : 'Bàn ăn'
  );

  // Xác định xem có phải bàn VIP hay không
  const isVip = Boolean(
    verifiedTable?.code?.toUpperCase().includes('VIP') ||
    verifiedTable?.zone?.toUpperCase().includes('VIP') ||
    verifiedTable?.zoneName?.toUpperCase().includes('VIP') ||
    (rawTable && rawTable.toUpperCase().includes('VIP'))
  );

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Xác thực mã QR Token với CSDL qua Backend API
  useEffect(() => {
    const verifyToken = async () => {
      const activeToken = tokenParam ? tokenParam.trim() : null;

      // Không có token QR: Từ chối truy cập ngay lập tức, triệt tiêu mọi backdoor/mock token
      if (!activeToken) {
        sessionStorage.removeItem('roms_dining_token');
        setVerifyError('Vui lòng quét mã QR vật lý được dán tại bàn ăn để bắt đầu gọi món!');
        setIsVerifying(false);
        return;
      }

      try {
        setIsVerifying(true);
        setVerifyError(null);
        const res = await tableApi.verifyQr(activeToken);
        if (res.data && res.data.success) {
          const tData = res.data.data;
          // Lưu Dining Token có ký số bảo mật của Backend vào sessionStorage
          if (tData.diningToken) {
            sessionStorage.setItem('roms_dining_token', tData.diningToken);
          }
          setVerifiedTable(tData);
          if (tData.capacity) setGuestCount(tData.capacity);
        } else {
          sessionStorage.removeItem('roms_dining_token');
          setVerifyError(res.data?.message || 'Mã QR này không hợp lệ hoặc đã bị thay đổi!');
        }
      } catch (err) {
        console.error('Lỗi xác thực mã QR:', err);
        sessionStorage.removeItem('roms_dining_token');
        const msg = err.response?.data?.message || 'Mã QR này không hợp lệ hoặc đã bị thay đổi!';
        setVerifyError(msg);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [tokenParam]);

  const isTableOccupied = verifiedTable?.status === 'OCCUPIED' && Boolean(verifiedTable?.diningToken);

  // Lắng nghe sự kiện mở bàn thời gian thực từ Phục vụ qua WebSocket
  useEffect(() => {
    const unsubscribe = subscribeRealtimeEvents((event) => {
      if (
        (event.type === 'TABLE_STATUS_CHANGED' || event.type === 'TABLE_UPDATED' || event.type === 'DINING_SESSION_OPENED') &&
        (Number(event.tableId) === Number(verifiedTable?.id) || event.tableNumber === verifiedTable?.tableNumber)
      ) {
        if (event.status === 'OCCUPIED' && tokenParam) {
          tableApi.verifyQr(tokenParam.trim()).then(res => {
            if (res.data?.success && res.data.data) {
              const tData = res.data.data;
              if (tData.diningToken) {
                sessionStorage.setItem('roms_dining_token', tData.diningToken);
              }
              setVerifiedTable(tData);
              showToast('Bàn đã được nhân viên mở phục vụ! Quý khách có thể bắt đầu đặt món.');
            }
          }).catch(console.error);
        } else if (event.status === 'AVAILABLE') {
          sessionStorage.removeItem('roms_dining_token');
          setVerifiedTable(prev => prev ? { ...prev, status: 'AVAILABLE', diningToken: null } : null);
        }
      }
    });
    return () => unsubscribe();
  }, [verifiedTable?.id, verifiedTable?.tableNumber, tokenParam]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyWifi = () => {
    const pw = restaurantProfile.wifiPassword || 'roms-welcome';
    navigator.clipboard?.writeText(pw);
    setCopiedWifi(true);
    showToast(`Đã sao chép mật khẩu WiFi: ${pw}`);
    setTimeout(() => setCopiedWifi(false), 2000);
  };

  const handleCallStaff = async () => {
    try {
      const tId = verifiedTable?.id;
      const tNum = verifiedTable?.code || verifiedTable?.tableNumber || tableCode;
      if (tId) {
        await tableApi.callWaiter(tId, {
          requestType: 'ASSISTANCE',
          note: `Khách tại bàn ${tNum} yêu cầu nhân viên hỗ trợ`
        });
      }
      const tableLabel = isVip && verifiedTable?.name ? `${tableCode} (${verifiedTable.name})` : tableCode;
      showToast(`Đã rung chuông! Nhân viên đang đến hỗ trợ ${tableLabel}.`);
    } catch (err) {
      const tableLabel = isVip && verifiedTable?.name ? `${tableCode} (${verifiedTable.name})` : tableCode;
      showToast(`Đã rung chuông! Nhân viên đang đến hỗ trợ ${tableLabel}.`);
    }
  };

  const handleCallOpenTable = async () => {
    try {
      const tId = verifiedTable?.id;
      const tNum = verifiedTable?.code || verifiedTable?.tableNumber || tableCode;
      if (tId) {
        await tableApi.callWaiter(tId, {
          requestType: 'OPEN_TABLE',
          note: `Khách tại ${tNum} yêu cầu nhân viên mở bàn đón khách`
        });
      }
      showToast(`Đã gửi yêu cầu! Nhân viên đang đến mở ${tNum}.`);
    } catch (err) {
      showToast('Đã gửi yêu cầu mở bàn tới nhân viên phục vụ!');
    }
  };

  const handleBrowseMenu = () => {
    const info = {
      tableNumber: tableCode,
      tableId: verifiedTable?.id,
      tableName: verifiedTable?.name || '',
      zoneName: verifiedTable?.zoneName || '',
      isVip,
      guestCount,
      status: verifiedTable?.status || 'AVAILABLE',
      token: verifiedTable?.qrToken,
      diningToken: verifiedTable?.diningToken || null
    };
    setTableInfo(info);
    navigate('/dining/menu');
  };

  const handleStartDining = () => {
    if (!verifiedTable || !verifiedTable.diningToken || verifiedTable.status !== 'OCCUPIED') {
      showToast('Bàn ăn đang chờ nhân viên mở phục vụ. Vui lòng bấm "Gọi mở bàn"!');
      return;
    }

    const info = {
      tableNumber: tableCode,
      tableId: verifiedTable.id,
      tableName: verifiedTable.name || '',
      zoneName: verifiedTable.zoneName || '',
      isVip,
      guestCount,
      status: 'OCCUPIED',
      token: verifiedTable.qrToken,
      diningToken: verifiedTable.diningToken
    };
    sessionStorage.setItem('roms_dining_token', verifiedTable.diningToken);
    setTableInfo(info);
    navigate('/dining/menu');
  };

  // Màn hình đang kiểm tra mã QR
  if (isVerifying) {
    return (
      <div style={{
        minHeight: '100dvh',
        background: '#FAFAF8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '4px solid #F0E6E4',
          borderTopColor: '#9D4124',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '16px'
        }} />
        <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, color: '#1F1B1A', margin: '0 0 6px' }}>
          Đang Xác Thực Bàn Ăn...
        </h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#89726B' }}>
          Vui lòng đợi giây lát trong khi hệ thống kết nối phiên gọi món.
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Màn hình cảnh báo mã QR hết hạn hoặc không hợp lệ
  if (verifyError) {
    return (
      <div style={{
        minHeight: '100dvh',
        background: '#FAFAF8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: '#FFDBC9',
          color: '#BA1A1A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '18px'
        }}>
          <Icon name="qr_code_scanner" size={38} />
        </div>
        <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, color: '#1F1B1A', margin: '0 0 8px', fontSize: '1.35rem' }}>
          {tokenParam ? 'Mã QR Không Còn Hiệu Lực' : 'Yêu Cầu Quét Mã QR'}
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: '0.88rem', color: '#89726B', maxWidth: '340px', lineHeight: 1.5 }}>
          {verifyError}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '300px' }}>
          <button
            type="button"
            onClick={handleCallStaff}
            style={{
              padding: '13px',
              borderRadius: '12px',
              background: '#9D4124',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(157,65,36,0.25)'
            }}
          >
            <Icon name="notifications_active" size={20} />
            Gọi Nhân Viên Hỗ Trợ
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: '#FFFFFF',
              color: '#56423D',
              border: '1px solid #EAE0DE',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Thử Lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#FAFAF8',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '16px 16px 24px',
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: '#1F1B1A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '16px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 700,
          fontSize: '0.85rem',
          maxWidth: '90%',
          width: 'max-content',
          borderLeft: '4px solid #9D4124',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <Icon name="notifications_active" size={20} style={{ color: '#E8C3BA' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP BRAND & TABLE IDENTIFICATION (SCR-09) */}
      <header style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', paddingTop: '8px' }}>
        {/* Centered ROMS Logo Brand Anchor */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '9999px',
          background: '#FFFFFF',
          border: '1px solid #EAE0DE',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          <RomsLogo size={24} />
          <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.95rem', color: '#9D4124', letterSpacing: '-0.01em' }}>
            ROMS
          </span>
          <span style={{ color: '#EAE0DE' }}>|</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#89726B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Smart Table Terminal
          </span>
        </div>

        {/* Restaurant Headline */}
        <div>
          <h1 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.45rem', color: '#1F1B1A', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
            {restaurantProfile.brandName || restaurantProfile.name || 'ROMS Restaurant'}
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#89726B' }}>
            {restaurantProfile.tagline || 'Trải nghiệm ẩm thực phong phú • Phục vụ tận tâm'}
          </p>
        </div>

        {/* Table Identification Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          borderRadius: '16px',
          background: 'rgba(189, 89, 58, 0.08)',
          border: '2px solid #9D4124',
          color: '#9D4124',
          boxShadow: '0 2px 8px rgba(157, 65, 36, 0.12)',
          marginTop: '4px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: isVip ? '#78350F' : '#9D4124',
            color: '#FFFFFF',
            padding: '4px 12px',
            borderRadius: '10px',
            fontWeight: 900,
            fontSize: '0.95rem',
            letterSpacing: '0.04em'
          }}>
            <Icon name={isVip ? "stars" : "table_restaurant"} size={18} fill={1} />
            <span>{tableCode}</span>
          </div>
          {isVip && verifiedTable?.name ? (
            <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1F1B1A' }}>
              {verifiedTable.name}
              <span style={{ fontWeight: 500, color: '#89726B', fontSize: '0.78rem' }}>
                {verifiedTable?.zoneName ? ` • ${verifiedTable.zoneName}` : ''} • {guestCount} Chỗ ngồi
              </span>
            </span>
          ) : (
            <span style={{ fontWeight: 600, color: '#89726B', fontSize: '0.82rem' }}>
              {verifiedTable?.zoneName ? `${verifiedTable.zoneName} • ` : ''}{guestCount} Chỗ ngồi
            </span>
          )}
        </div>
      </header>

      {/* HERO CARD DISPLAY (SCR-09) */}
      <section style={{ margin: '14px 0', width: '100%' }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '24px 20px',
          boxShadow: '0 12px 36px -8px rgba(157, 65, 36, 0.12), 0 2px 10px rgba(0,0,0,0.04)',
          border: '1px solid rgba(224, 224, 224, 0.7)',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center'
        }}>
          {/* Top Gradient Stripe */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(to right, rgb(157, 65, 36), rgb(252, 147, 79), rgb(189, 89, 58))'
          }} />

          {/* Connection Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 14px',
            borderRadius: '9999px',
            background: isTableOccupied ? '#E8F5E9' : '#FFF3E0',
            border: isTableOccupied ? '1px solid #C8E6C9' : '1px solid #FFE0B2',
            color: isTableOccupied ? '#2E7D32' : '#E65100',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: '14px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isTableOccupied ? '#2E7D32' : '#E65100',
              animation: 'subtlePulse 1.5s infinite'
            }} />
            <Icon name={isTableOccupied ? "check_circle" : "hourglass_top"} size={15} fill={1} />
            <span>
              {isTableOccupied
                ? `Đã kết nối ${tableCode}${isVip && verifiedTable?.name ? ` (${verifiedTable.name})` : ''} • Sẵn sàng phục vụ`
                : `${tableCode} • Chờ nhân viên mở bàn`}
            </span>
          </div>

          {/* Room Service Icon Circle */}
          <div style={{
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            background: '#FCF1EF',
            border: '2px solid #9D4124',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.06)'
          }}>
            <Icon name="room_service" size={40} fill={1} style={{ color: '#9D4124' }} />
          </div>

          <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.45rem', color: '#1F1B1A', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
            {isTableOccupied ? 'Xin chào quý khách!' : 'Chào mừng quý khách!'}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 12px', borderRadius: '10px', background: isVip ? '#78350F' : '#9D4124', color: '#FFFFFF', fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.05rem', boxShadow: '0 2px 6px rgba(157, 65, 36, 0.25)' }}>
              {isVip ? `PHÒNG ${tableCode}` : `BÀN ${tableCode}`}
            </span>
            {isVip && verifiedTable?.name && (
              <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#78350F' }}>
                {verifiedTable.name}
              </span>
            )}
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: isTableOccupied ? '#9D4124' : '#E65100' }}>
              {isTableOccupied ? 'của bạn đã sẵn sàng!' : 'Chờ nhân viên mở bàn'}
            </span>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#56423D', margin: '0 auto 16px', maxWidth: '340px', lineHeight: 1.5 }}>
            {isTableOccupied
              ? 'Quý khách có thể bắt đầu chọn món ngay trên thiết bị này hoặc duyệt toàn bộ danh mục thực đơn đặc sắc.'
              : 'Bàn ăn đang chờ nhân viên phục vụ mở bàn (Check-in). Vui lòng nhấn "Gọi nhân viên mở bàn" để nhân viên đến phục vụ bạn!'}
          </p>

          {/* Guest Count Selector */}
          <div style={{
            background: '#FFF8F6',
            borderRadius: '16px',
            padding: '12px 14px',
            border: '1px solid #F6ECEA',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#56423D', marginBottom: '8px' }}>
              <Icon name="group" size={16} style={{ color: '#9D4124' }} />
              <span>Số lượng khách dùng bữa tại bàn:</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {[1, 2, 4, 6, 8].map(num => {
                const isSel = guestCount === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGuestCount(num)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      border: isSel ? '2px solid #9D4124' : '1px solid #EAE0DE',
                      background: isSel ? '#9D4124' : '#FFFFFF',
                      color: isSel ? '#FFFFFF' : '#1F1B1A',
                      fontFamily: "'Epilogue', sans-serif",
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub service perks */}
          <div style={{
            paddingTop: '12px',
            borderTop: '1px solid #F0E6E4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '0.75rem',
            color: '#89726B'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Icon name="schedule" size={15} style={{ color: '#9D4124' }} />
              Phục vụ nhanh chóng
            </span>
            <span style={{ color: '#EAE0DE' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Icon name="room_service" size={15} style={{ color: '#9D4124' }} />
              Tự gọi tại bàn
            </span>
          </div>
        </div>
      </section>

      {/* PRIMARY ACTION BUTTONS (SCR-09) */}
      <section style={{ marginBottom: '14px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {isTableOccupied ? (
            <>
              {/* Call Staff */}
              <button
                id="btnCallStaff"
                type="button"
                onClick={handleCallStaff}
                style={{
                  padding: '14px 10px',
                  borderRadius: '16px',
                  border: '2px solid #9D4124',
                  background: '#FFFFFF',
                  color: '#9D4124',
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon name="room_service" size={20} fill={1} />
                <span>Gọi nhân viên</span>
              </button>

              {/* Start Order */}
              <button
                id="btnStartOrder"
                type="button"
                onClick={handleStartDining}
                style={{
                  padding: '14px 10px',
                  borderRadius: '16px',
                  border: 'none',
                  background: '#9D4124',
                  color: '#FFFFFF',
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px -4px rgba(157, 65, 36, 0.4)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Bắt đầu gọi món</span>
                <Icon name="arrow_forward" size={20} />
              </button>
            </>
          ) : (
            <button
              id="btnCallOpenTable"
              type="button"
              onClick={handleCallOpenTable}
              style={{
                gridColumn: '1 / -1',
                width: '100%',
                padding: '16px 14px',
                borderRadius: '16px',
                border: '2px solid #E65100',
                background: '#FFF3E0',
                color: '#BF360C',
                fontFamily: "'Epilogue', sans-serif",
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(230, 81, 0, 0.15)',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon name="notifications_active" size={22} fill={1} />
              <span>Gọi nhân viên mở bàn</span>
            </button>
          )}
        </div>
      </section>

      {/* BOTTOM UTILITY & GUEST WIFI CARD (SCR-09) */}
      <section style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '12px 14px',
        border: '1px solid #EAE0DE',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '0.78rem' }}>
          {/* WiFi Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F6ECEA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1F1B1A' }}>
              <Icon name="wifi" size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#1F1B1A' }}>
                WiFi: {restaurantProfile.wifiName || 'ROMS-GUEST'}
              </div>
              <div style={{ color: '#89726B', fontSize: '0.7rem' }}>
                Pass: <code style={{ fontFamily: 'monospace', background: '#FCF1EF', padding: '1px 4px', borderRadius: '4px', color: '#9D4124', fontWeight: 700 }}>{restaurantProfile.wifiPassword || 'roms-welcome'}</code>
              </div>
            </div>
          </div>

          {/* Copy and Clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCopyWifi}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1px solid #EAE0DE',
                background: copiedWifi ? '#E8F5E9' : '#FCF1EF',
                color: copiedWifi ? '#2E7D32' : '#56423D',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Icon name={copiedWifi ? "done" : "content_copy"} size={14} />
              <span>{copiedWifi ? 'Đã chép' : 'Copy Pass'}</span>
            </button>

            <div style={{ width: '1px', height: '18px', background: '#EAE0DE' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 800, fontSize: '0.8rem', color: '#1F1B1A' }}>
              <Icon name="schedule" size={14} style={{ color: '#89726B' }} />
              <span>{currentTime}</span>
            </div>
          </div>
        </div>
      </section>

      {/* TECHNICAL STATUS FOOTER (SCR-09) */}
      <footer style={{
        paddingTop: '8px',
        borderTop: '1px solid #F0E6E4',
        fontSize: '0.7rem',
        color: '#89726B',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        textAlign: 'center'
      }}>
        <div>Giờ phục vụ: 10:00 AM – 10:00 PM | Hotline: 1900 8924</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2E7D32' }} />
          <span style={{ fontWeight: 600, color: '#1F1B1A' }}>ROMS Table Terminal v2.4 • Online</span>
        </div>
      </footer>
    </div>
  );
}
