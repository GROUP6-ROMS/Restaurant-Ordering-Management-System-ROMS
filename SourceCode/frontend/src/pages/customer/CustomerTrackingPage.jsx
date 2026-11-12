import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { customerApi } from '../../api/customerApi';
import { tableApi } from '../../api/tableApi';
import { broadcastRealtimeEvent, subscribeRealtimeEvents } from '../../utils/realtimeSync';

import Icon from '../../components/common/Icon';

// Format VND
function formatVND(amount) {
  if (!amount && amount !== 0) return '0đ';
  return Number(amount).toLocaleString('vi-VN') + 'đ';
}

export default function CustomerTrackingPage() {
  const { tableInfo } = useCart();
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';

  const [toastMessage, setToastMessage] = useState(isSuccess ? 'Đã gửi đơn vào bếp thành công!' : null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Live Tracking state từ Backend CSDL
  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const fetchTracking = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      const tId = tableInfo?.tableId;
      const tNum = tableInfo?.tableNumber;
      const res = await customerApi.getOrderTracking(tId, tNum);
      if (res.success && res.data) {
        setTrackingData(res.data);
      }
    } catch (err) {
      console.error('Lỗi khi lấy tiến độ món ăn:', err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [tableInfo?.tableId, tableInfo?.tableNumber]);

  const [tableStatus, setTableStatus] = useState(tableInfo?.status || (sessionStorage.getItem('roms_dining_token') ? 'OCCUPIED' : 'AVAILABLE'));

  useEffect(() => {
    if (tableInfo?.status) setTableStatus(tableInfo.status);
  }, [tableInfo?.status]);

  useEffect(() => {
    const unsubscribe = subscribeRealtimeEvents((event) => {
      if (
        (['TABLE_STATUS_CHANGED', 'TABLE_UPDATED', 'TABLE_UPDATE', 'DINING_SESSION_OPENED', 'BILL_PAID', 'SESSION_CLOSED'].includes(event.type)) &&
        (Number(event.tableId) === Number(tableInfo?.tableId) || event.tableNumber === tableInfo?.tableNumber)
      ) {
        if (event.status === 'OCCUPIED') {
          setTableStatus('OCCUPIED');
          if (tableInfo?.token) {
            tableApi.verifyQr(tableInfo.token).then(res => {
              if (res.data?.success && res.data.data?.diningToken) {
                sessionStorage.setItem('roms_dining_token', res.data.data.diningToken);
              }
            }).catch(console.error);
          }
          fetchTracking(false);
        } else if (
          event.type === 'BILL_PAID' ||
          event.type === 'SESSION_CLOSED' ||
          ['AVAILABLE', 'DIRTY', 'COMPLETED', 'CLOSED'].includes(event.status)
        ) {
          setTableStatus('AVAILABLE');
          sessionStorage.removeItem('roms_dining_token');
          const qrToken = tableInfo?.token || sessionStorage.getItem('roms_qr_token') || '';
          showToast('Hóa đơn đã được thanh toán hoàn tất!');
          setTimeout(() => {
            window.location.href = `/dining/welcome?table=${tableInfo?.tableId || ''}&token=${qrToken}`;
          }, 1200);
        }
      }
    });
    return () => unsubscribe();
  }, [tableInfo?.tableId, tableInfo?.tableNumber, tableInfo?.token, fetchTracking]);

  useEffect(() => {
    fetchTracking(false);
    // Polling tự động mỗi 6 giây để cập nhật khi Bếp đổi trạng thái
    const interval = setInterval(() => {
      fetchTracking(true);
    }, 6000);

    // Lắng nghe sự kiện realtime qua WebSocket STOMP & BroadcastChannel
    const unsubscribe = subscribeRealtimeEvents((event) => {
      if (['ORDER_STATUS_CHANGED', 'ITEM_STATUS_UPDATED', 'NEW_ORDER_CREATED', 'CALL_WAITER', 'CALL_BILL', 'ORDER_UPDATE', 'TABLE_UPDATE', 'BILL_PAID', 'SESSION_CLOSED'].includes(event?.type)) {
        fetchTracking(true);
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [fetchTracking]);

  const handleRequestAssistance = async (reqType, note) => {
    try {
      const tId = tableInfo?.tableId;
      const tNum = tableInfo?.tableNumber || 'Bàn của bạn';
      await customerApi.callWaiter({
        tableId: tId,
        tableNumber: tNum,
        requestType: reqType,
        note
      });
      broadcastRealtimeEvent('CALL_WAITER', { tableId: tId, tableNumber: tNum });
      showToast(`Đã gửi yêu cầu: "${note}"!`);
    } catch (err) {
      showToast(`Đã gửi yêu cầu tới nhân viên phục vụ!`);
    }
  };

  const handleConfirmPayment = async (methodKey, methodName) => {
    try {
      setShowPaymentModal(false);
      setSelectedMethod(methodName);

      const tId = tableInfo?.tableId;
      const tNum = tableInfo?.tableNumber;
      await customerApi.requestPayment(tId, tNum, methodKey);

      broadcastRealtimeEvent('CALL_WAITER', { tableId: tId, tableNumber: tNum, type: 'BILL' });
      setPaymentSuccess(true);
      showToast(`Đã gửi yêu cầu thanh toán bằng [${methodName}] tới thu ngân POS!`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể gửi yêu cầu tính tiền. Vui lòng gọi phục vụ!';
      showToast(msg);
    }
  };

  // Dữ liệu từ API
  const batches = trackingData?.batches || [];
  const totalItemCount = trackingData?.totalItems || 0;
  const totalFoodPrice = trackingData?.totalAmount || 0;
  const vat = 0;
  const finalTotal = totalFoodPrice;

  const diningToken = sessionStorage.getItem('roms_dining_token');
  const staffToken = sessionStorage.getItem('roms_token');
  const isTableOccupied = (tableStatus === 'OCCUPIED' || tableInfo?.status === 'OCCUPIED') && (Boolean(diningToken) || Boolean(staffToken));

  // Chờ nhân viên mở bàn - Chặn truy cập theo dõi bàn ăn nếu bàn chưa mở
  if (!isTableOccupied) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100dvh - 120px)', padding: '40px 20px',
        textAlign: 'center',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Icon name="lock" size={40} style={{ color: '#ef4444' }} />
        </div>
        <h2 style={{ fontFamily: 'Epilogue', fontWeight: 700, fontSize: 20, color: 'var(--on-surface)', marginBottom: 8 }}>
          Chờ nhân viên mở bàn
        </h2>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, maxWidth: 320, marginBottom: 24, lineHeight: 1.5, fontFamily: 'Plus Jakarta Sans' }}>
          Bàn của bạn hiện chưa được mở phiên phục vụ. Vui lòng liên hệ nhân viên hoặc bấm chuông gọi nhân viên để được hỗ trợ mở bàn trước khi theo dõi bàn ăn!
        </p>
        <button
          onClick={() => handleRequestAssistance('CALL_WAITER', 'Khách yêu cầu hỗ trợ mở bàn')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', borderRadius: '9999px',
            background: 'var(--primary-container)', color: 'var(--on-primary)',
            fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 14,
            border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-primary)',
          }}
        >
          <Icon name="notifications" size={18} />
          Gọi nhân viên mở bàn
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 16px 100px', maxWidth: '600px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '16px',
          right: '16px',
          maxWidth: '430px',
          margin: '0 auto',
          zIndex: 1000,
          background: '#1F1B1A',
          color: '#FFF8F6',
          padding: '12px 16px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', fontWeight: 600 }}>
            <Icon name="check_circle" size={20} fill={1} style={{ color: '#FFB68C' }} />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', color: '#FFF8F6', opacity: 0.7, cursor: 'pointer', padding: 0 }}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      )}

      {/* 1. Table Identity & Status Card */}
      <section style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 4px 20px -2px rgba(43,38,37,0.06)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '16px',
        border: '1px solid #F0E6E4'
      }}>
        <div style={{
          position: 'absolute',
          right: '-24px',
          bottom: '-24px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(255, 181, 159, 0.25)',
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                background: (trackingData?.tableNumber?.toUpperCase().includes('VIP') || tableInfo?.tableNumber?.toUpperCase().includes('VIP')) ? '#78350F' : '#C85A32',
                color: '#FFFFFF',
                fontFamily: "'Epilogue', sans-serif",
                fontWeight: 800,
                fontSize: '1.05rem',
                padding: '4px 12px',
                borderRadius: '10px',
                letterSpacing: '-0.01em'
              }}>
                {(trackingData?.tableNumber?.toUpperCase().includes('VIP') || tableInfo?.tableNumber?.toUpperCase().includes('VIP')) ? 'PHÒNG ' : 'BÀN '}
                {trackingData?.tableNumber || tableInfo?.tableNumber || 'Bàn ăn'}
              </span>
              <span style={{
                background: '#DDE8AB',
                color: '#181E00',
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#596232',
                  display: 'inline-block'
                }} />
                Đang dùng bữa
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#56423D', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icon name="location_on" size={16} style={{ color: '#89726B' }} />
              {trackingData?.zoneName || trackingData?.zone || tableInfo?.zoneName || 'Khu vực phục vụ'} ({trackingData?.guestCount || tableInfo?.guestCount || 2} khách)
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#89726B', fontWeight: 700, display: 'block' }}>
              Mã phiên ăn
            </span>
            <span style={{
              fontFamily: "'Epilogue', sans-serif",
              fontWeight: 800,
              fontSize: '1.15rem',
              color: '#C85A32',
              letterSpacing: '-0.02em'
            }}>
              #{trackingData?.sessionId ? `SES-${trackingData.sessionId}` : 'ROMS-ONLINE'}
            </span>
            <div style={{ fontSize: '0.78rem', color: '#56423D', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
              <Icon name="schedule" size={14} style={{ color: '#89726B' }} />
              Từ {trackingData?.startTimeFormatted || '12:00'}
            </div>
          </div>
        </div>

        {/* Quick Assistance Button (Kích hoạt Popup Hỗ trợ giống hệt chuông trên Header) */}
        <div style={{
          marginTop: '18px',
          paddingTop: '14px',
          borderTop: '1px solid #F6ECEA'
        }}>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('roms:open-assist-modal'))}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1.5px solid #F0E6E4',
              background: '#FFF8F6',
              color: '#C85A32',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(200, 90, 50, 0.08)',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name="notifications" size={20} fill={1} />
            <span>Gọi phục vụ</span>
          </button>
        </div>
      </section>

      {/* 2. Order Batches List */}
      <section style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 4px' }}>
          <h3 style={{
            fontFamily: "'Epilogue', sans-serif",
            fontWeight: 800,
            fontSize: '1.1rem',
            color: '#1F1B1A',
            margin: 0
          }}>
            Tiến độ món đã gọi ({totalItemCount} món)
          </h3>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#89726B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {batches.length} đợt gọi món
          </span>
        </div>

        {isLoading && !trackingData ? (
          <div style={{ textAlign: 'center', padding: '36px', background: '#FFFFFF', borderRadius: '18px', border: '1px solid #F0E6E4' }}>
            <Icon name="sync" size={32} style={{ animation: 'spin 1s linear infinite', color: '#C85A32' }} />
            <p style={{ marginTop: '8px', fontSize: '0.85rem', color: '#89726B' }}>Đang nạp dữ liệu tiến độ món ăn...</p>
          </div>
        ) : batches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#FFFFFF', borderRadius: '18px', border: '1px solid #F0E6E4' }}>
            <Icon name="dinner_dining" size={48} style={{ color: '#C4B5B0', marginBottom: '8px' }} />
            <h4 style={{ margin: '0 0 6px', color: '#1F1B1A', fontSize: '1rem', fontWeight: 700 }}>Chưa có món ăn nào được gọi</h4>
            <p style={{ margin: '0 0 16px', color: '#89726B', fontSize: '0.82rem' }}>Hãy mở thực đơn để chọn các món ngon của nhà hàng nhé!</p>
            <Link
              to="/dining/menu"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px', borderRadius: '9999px',
                background: '#C85A32', color: '#FFFFFF',
                fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none'
              }}
            >
              Xem thực đơn gọi món
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {batches.map((batch, bIdx) => (
              <div
                key={batch.orderId || bIdx}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '18px',
                  padding: '16px',
                  boxShadow: '0 2px 12px -2px rgba(43,38,37,0.05)',
                  border: '1px solid #F0E6E4'
                }}
              >
                {/* Batch Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px dashed #EAE0DE', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: bIdx > 0 ? '#FC934F' : '#C85A32'
                    }} />
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1F1B1A' }}>
                      Đợt {bIdx + 1} • {batch.orderTimeFormatted || 'Vừa xong'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#89726B' }}>
                      ({batch.items?.length || 0} món)
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    background: bIdx > 0 ? '#FFDBC9' : '#F6ECEA',
                    color: bIdx > 0 ? '#753400' : '#56423D'
                  }}>
                    {batch.orderCode || (bIdx === 0 ? 'Đơn chính' : 'Gọi thêm')}
                  </span>
                </div>

                {/* Items in Batch */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {batch.items?.map((item) => (
                    <div
                      key={item.orderItemId}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        background: '#FFF8F6',
                        padding: '10px 12px',
                        borderRadius: '14px',
                        border: '1px solid #F6ECEA'
                      }}
                    >
                      <div style={{ width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                        <img
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';
                          }}
                        />
                        <span style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          background: 'rgba(31, 27, 26, 0.85)',
                          color: '#FFF',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderTopLeftRadius: '6px'
                        }}>
                          x{item.quantity}
                        </span>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </h4>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1F1B1A', whiteSpace: 'nowrap' }}>
                            {formatVND(item.subtotal || (item.price * item.quantity))}
                          </span>
                        </div>

                        {item.note && (
                          <p style={{ margin: '2px 0 6px', fontSize: '0.75rem', color: '#89726B', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Ghi chú: {item.note}
                          </p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                          {item.status === 'SERVED' && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '9999px',
                              background: '#DDE8AB',
                              color: '#181E00',
                              fontSize: '0.72rem',
                              fontWeight: 700
                            }}>
                              <Icon name="task_alt" size={13} style={{ color: '#596232' }} />
                              {item.statusText || 'Đã phục vụ'}
                            </span>
                          )}
                          {item.status === 'READY' && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '9999px',
                              background: '#FC934F25',
                              color: '#994703',
                              fontSize: '0.72rem',
                              fontWeight: 700
                            }}>
                              <Icon name="directions_walk" size={13} style={{ color: '#994703' }} />
                              {item.statusText || 'Đã nấu xong - Chờ bưng'}
                            </span>
                          )}
                          {item.status === 'COOKING' && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '9999px',
                              background: '#FFDBC9',
                              color: '#753400',
                              fontSize: '0.72rem',
                              fontWeight: 700
                            }}>
                              <Icon name="local_fire_department" size={13} fill={1} style={{ color: '#C85A32' }} />
                              {item.statusText || 'Bếp đang nấu'}
                            </span>
                          )}
                          {item.status === 'PENDING' && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '9999px',
                              background: '#F6ECEA',
                              color: '#56423D',
                              fontSize: '0.72rem',
                              fontWeight: 700
                            }}>
                              <Icon name="hourglass_top" size={13} style={{ color: '#89726B' }} />
                              {item.statusText || 'Chờ bếp nhận'}
                            </span>
                          )}
                          {item.status === 'CANCELLED' && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '9999px',
                              background: '#FFDAD6',
                              color: '#93000A',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textDecoration: 'line-through',
                              opacity: 0.85
                            }}>
                              <Icon name="cancel" size={13} style={{ color: '#BA1A1A' }} />
                              {item.statusText || 'Đã hủy'}
                            </span>
                          )}

                          <span style={{ fontSize: '0.72rem', color: '#89726B' }}>
                            {item.prepTime || '10-15 phút'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. CTA Call More Dishes */}
      <div style={{ marginBottom: '16px' }}>
        <Link
          to="/dining/menu"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '13px 18px',
            borderRadius: '16px',
            border: '2px dashed #C85A32',
            background: 'rgba(200, 90, 50, 0.04)',
            color: '#C85A32',
            textDecoration: 'none',
            fontFamily: "'Epilogue', sans-serif",
            fontWeight: 800,
            fontSize: '0.95rem',
            boxSizing: 'border-box',
            transition: 'all 0.15s ease'
          }}
        >
          <Icon name="add_circle" size={20} fill={1} />
          <span>Gọi thêm món ngon vào bàn</span>
        </Link>
      </div>

      {/* 4. Bill Summary & Checkout Action */}
      <section style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '18px 20px',
        boxShadow: '0 4px 20px -2px rgba(43,38,37,0.07)',
        border: '1px solid #F0E6E4',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="receipt_long" size={22} style={{ color: '#C85A32' }} />
            <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#1F1B1A', margin: 0 }}>
              Tạm tính hóa đơn
            </h3>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#596232', fontWeight: 700 }}>
            Đã gồm thuế GTGT
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#56423D' }}>
            <span>Tiền món ({totalItemCount} món)</span>
            <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{formatVND(totalFoodPrice)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#89726B', fontStyle: 'italic' }}>
            <span>Thuế GTGT</span>
            <span>Đã gồm trong giá món</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#56423D' }}>
            <span>Phí dịch vụ</span>
            <span style={{ fontWeight: 700, color: '#596232' }}>Miễn phí</span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            paddingTop: '12px',
            marginTop: '6px',
            borderTop: '1px solid #F0E6E4'
          }}>
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#1F1B1A' }}>
              Tổng thanh toán:
            </span>
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.45rem', color: '#C85A32' }}>
              {formatVND(finalTotal)}
            </span>
          </div>
        </div>

        {paymentSuccess ? (
          <div style={{
            marginTop: '16px',
            padding: '14px',
            borderRadius: '14px',
            background: '#DDE8AB',
            color: '#181E00',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <Icon name="check_circle" size={20} fill={1} style={{ color: '#596232' }} />
            <span>Thu ngân đang chuẩn bị hóa đơn thanh toán bằng {selectedMethod}!</span>
          </div>
        ) : (
          <button
            type="button"
            disabled={totalItemCount === 0}
            onClick={() => setShowPaymentModal(true)}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '15px 20px',
              background: totalItemCount === 0 ? '#C4B5B0' : '#C85A32',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '16px',
              fontFamily: "'Epilogue', sans-serif",
              fontWeight: 800,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: totalItemCount === 0 ? 'not-allowed' : 'pointer',
              boxShadow: totalItemCount === 0 ? 'none' : '0 8px 20px rgba(200, 90, 50, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name="payments" size={22} fill={1} />
            <span>Yêu cầu tính tiền tại bàn</span>
          </button>
        )}
      </section>

      {/* Payment Selection Modal Dialog */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(31, 27, 26, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '460px',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            padding: '24px 20px',
            boxShadow: '0 -8px 30px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#FFDBC9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C85A32' }}>
                  <Icon name="point_of_sale" size={22} />
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#1F1B1A', margin: 0 }}>
                    Chọn phương thức thanh toán
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#89726B' }}>
                    {(trackingData?.tableNumber?.toUpperCase().includes('VIP') || tableInfo?.tableNumber?.toUpperCase().includes('VIP')) ? 'Phòng ' : 'Bàn '}
                    {trackingData?.tableNumber || tableInfo?.tableNumber || 'Bàn ăn'}
                    {(trackingData?.tableNumber?.toUpperCase().includes('VIP') || tableInfo?.tableNumber?.toUpperCase().includes('VIP')) && (trackingData?.tableName || tableInfo?.tableName)
                      ? ` (${trackingData?.tableName || tableInfo?.tableName})`
                      : ''}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#F6ECEA', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#56423D' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* Bill preview box */}
            <div style={{ background: '#FFF8F6', border: '1px solid #F6ECEA', borderRadius: '14px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#89726B', display: 'block' }}>Số tiền thanh toán</span>
                <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#C85A32' }}>
                  {formatVND(finalTotal)}
                </span>
              </div>
              <span style={{ padding: '4px 10px', background: '#F0E6E4', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A' }}>
                {totalItemCount} món
              </span>
            </div>

            {/* Methods */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => handleConfirmPayment('BANK_TRANSFER', 'Chuyển khoản VietQR')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: '#FFF8F6',
                  border: '1.5px solid #F0E6E4',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon name="qr_code_2" size={26} style={{ color: '#C85A32' }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1F1B1A' }}>Chuyển khoản VietQR</div>
                    <div style={{ fontSize: '0.75rem', color: '#89726B' }}>Quét mã QR động, nhận tiền ngay lập tức</div>
                  </div>
                </div>
                <Icon name="chevron_right" size={20} style={{ color: '#89726B' }} />
              </button>

              <button
                type="button"
                onClick={() => handleConfirmPayment('CASH', 'Tiền mặt tại bàn')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: '#FFF8F6',
                  border: '1.5px solid #F0E6E4',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon name="payments" size={26} style={{ color: '#596232' }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1F1B1A' }}>Tiền mặt tại bàn</div>
                    <div style={{ fontSize: '0.75rem', color: '#89726B' }}>Thu ngân mang phiếu hóa đơn & tiền thừa tới bàn</div>
                  </div>
                </div>
                <Icon name="chevron_right" size={20} style={{ color: '#89726B' }} />
              </button>

              <button
                type="button"
                onClick={() => handleConfirmPayment('CREDIT_CARD', 'Quẹt thẻ POS')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: '#FFF8F6',
                  border: '1.5px solid #F0E6E4',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon name="credit_card" size={26} style={{ color: '#994703' }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1F1B1A' }}>Quẹt thẻ ngân hàng (POS)</div>
                    <div style={{ fontSize: '0.75rem', color: '#89726B' }}>Hỗ trợ thẻ Visa, MasterCard, JCB, Napas</div>
                  </div>
                </div>
                <Icon name="chevron_right" size={20} style={{ color: '#89726B' }} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                border: 'none',
                background: '#F6ECEA',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.88rem',
                color: '#56423D',
                cursor: 'pointer'
              }}
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
