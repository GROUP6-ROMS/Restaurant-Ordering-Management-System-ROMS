import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { customerApi } from '../../api/customerApi';
import { tableApi } from '../../api/tableApi';
import { subscribeRealtimeEvents } from '../../utils/realtimeSync';
import { broadcastRealtimeEvent } from '../../utils/realtimeSync';

import Icon from '../../components/common/Icon';

// Format tien VND
function formatVND(amount) {
  if (!amount && amount !== 0) return '0đ';
  return Number(amount).toLocaleString('vi-VN') + 'đ';
}

// ====================================================
// CustomerCartPage - Gio hang goi mon (SCR-12 Stitch)
// ====================================================
export default function CustomerCartPage() {
  const {
    cartItems, updateQuantity, removeFromCart, syncItemStock, clearCart,
    totalCount, totalPrice, tableInfo
  } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [tableStatus, setTableStatus] = useState(tableInfo?.status || (sessionStorage.getItem('roms_dining_token') ? 'OCCUPIED' : 'AVAILABLE'));

  useEffect(() => {
    if (tableInfo?.status) setTableStatus(tableInfo.status);
  }, [tableInfo?.status]);

  useEffect(() => {
    const unsubscribe = subscribeRealtimeEvents((event) => {
      if (event?.type === 'MENU_AVAILABILITY_CHANGED' && event?.payload) {
        const { id, isAvailable, remainingStock } = event.payload;
        syncItemStock(id, isAvailable, remainingStock);
        return;
      }
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
          showToast('Bàn đã được nhân viên mở! Quý khách có thể gửi đơn đặt món.');
        } else if (
          event.type === 'BILL_PAID' ||
          event.type === 'SESSION_CLOSED' ||
          ['AVAILABLE', 'DIRTY', 'COMPLETED', 'CLOSED'].includes(event.status)
        ) {
          setTableStatus('AVAILABLE');
          sessionStorage.removeItem('roms_dining_token');
          clearCart();
          const qrToken = tableInfo?.token || sessionStorage.getItem('roms_qr_token') || '';
          showToast('Bữa ăn đã hoàn tất thanh toán. Cảm ơn quý khách!');
          setTimeout(() => {
            window.location.href = `/dining/welcome?table=${tableInfo?.tableId || ''}&token=${qrToken}`;
          }, 1200);
        }
      }
    });
    return () => unsubscribe();
  }, [tableInfo?.tableId, tableInfo?.tableNumber, tableInfo?.token]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  // Giá niêm yết đã bao gồm thuế GTGT
  const grandTotal = totalPrice;

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0 || isSubmitting) return;

    const staffToken = sessionStorage.getItem('roms_token');
    const isOccupied = tableStatus === 'OCCUPIED' || tableInfo?.status === 'OCCUPIED';

    if (!isOccupied && !staffToken) {
      showToast('Bàn ăn chưa được nhân viên phục vụ mở phiên (Check-in). Vui lòng nhấn "Gọi mở bàn" trước!');
      return;
    }

    const diningToken = sessionStorage.getItem('roms_dining_token');
    if (!diningToken && !staffToken) {
      showToast('Vui lòng quét mã QR tại bàn để xác thực và gửi đơn gọi món!');
      return;
    }

    if (!tableInfo?.tableId && !tableInfo?.tableNumber) {
      showToast('Chưa xác định được thông tin bàn ăn. Vui lòng quét lại mã QR tại bàn!');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        tableId: tableInfo?.tableId,
        tableNumber: tableInfo?.tableNumber,
        guestCount: tableInfo?.guestCount || 2,
        orderNote: orderNote.trim(),
        items: cartItems.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
          note: item.note || ''
        }))
      };

      const res = await customerApi.placeCustomerOrder(payload);

      // Phát sự kiện liên thông thời gian thực sang Bếp KDS và Phục Vụ
      broadcastRealtimeEvent({
        type: 'NEW_ORDER_CREATED',
        tableId: tableInfo?.tableId,
        tableNumber: tableInfo?.tableNumber
      });

      clearCart();
      navigate('/dining/orders/tracking?success=true');
    } catch (err) {
      console.error('Lỗi khi gửi đơn đặt món:', err);
      const msg = err.response?.data?.message || 'Không thể gửi đơn đặt món. Vui lòng thử lại hoặc gọi nhân viên!';
      showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallStaff = async () => {
    try {
      const tId = tableInfo?.tableId;
      const tNum = tableInfo?.tableNumber || 'Bàn của bạn';
      await customerApi.callWaiter({
        tableId: tId,
        tableNumber: tNum,
        requestType: 'CALL_WAITER',
        note: `Khách tại ${tNum} yêu cầu nhân viên hỗ trợ tại bàn`
      });
      broadcastRealtimeEvent({ type: 'CALL_WAITER', tableId: tId, tableNumber: tNum });
      showToast(`Đã rung chuông gọi nhân viên cho ${tNum}!`);
    } catch (err) {
      showToast('Đã gửi yêu cầu hỗ trợ tới nhân viên phục vụ!');
    }
  };

  const diningToken = sessionStorage.getItem('roms_dining_token');
  const staffToken = sessionStorage.getItem('roms_token');
  const isTableOccupied = (tableStatus === 'OCCUPIED' || tableInfo?.status === 'OCCUPIED') && (Boolean(diningToken) || Boolean(staffToken));

  const toastNode = (
    <div className={`toast no-print ${toastVisible ? '' : 'hidden'}`}>
      <Icon name="check_circle" size={18} style={{ color: 'var(--secondary-fixed-dim)' }} />
      {toastMsg}
    </div>
  );

  // Chờ nhân viên mở bàn - Chặn truy cập giỏ hàng nếu bàn chưa mở
  if (!isTableOccupied) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100dvh - 120px)', padding: '40px 20px',
        textAlign: 'center',
      }}>
        {toastNode}
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
          Bàn của bạn hiện chưa được mở phiên phục vụ. Vui lòng liên hệ nhân viên hoặc bấm chuông gọi nhân viên để được hỗ trợ mở bàn trước khi xem và đặt món!
        </p>
        <button
          onClick={handleCallStaff}
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

  // Trang gio hang trong
  if (cartItems.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100dvh - 120px)', padding: '40px 16px',
        textAlign: 'center',
      }}>
        {toastNode}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'var(--surface-container)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Icon name="remove_shopping_cart" size={40} style={{ color: 'var(--outline-variant)' }} />
        </div>
        <h2 style={{ fontFamily: 'Epilogue', fontWeight: 700, fontSize: 20, color: 'var(--on-surface)', marginBottom: 8 }}>
          Giỏ hàng đang trống
        </h2>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, maxWidth: 280, marginBottom: 24, lineHeight: 1.5, fontFamily: 'Plus Jakarta Sans' }}>
          Hãy chọn những món ngon tuyệt vời từ thực đơn nhé!
        </p>
        <Link
          to="/dining/menu"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '12px 24px', borderRadius: '9999px',
            background: 'var(--primary-container)', color: 'var(--on-primary)',
            fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 14,
            textDecoration: 'none', boxShadow: 'var(--shadow-primary)',
          }}
        >
          Quay lại thực đơn
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 24 }}>

      {/* --- Card thong tin ban an --- */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{
          background: 'var(--surface-container-lowest)',
          borderRadius: 16, padding: 14,
          border: '2px solid rgba(157, 65, 36, 0.3)',
          boxShadow: 'var(--shadow-md)',
          position: 'relative', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Halo trang tri */}
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: 96, height: 96,
            background: 'rgba(255, 219, 201, 0.2)',
            borderRadius: '50%', filter: 'blur(32px)',
            marginRight: -32, marginTop: -32,
            pointerEvents: 'none',
          }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{
                fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 11,
                color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                BÀN ĐANG PHỤC VỤ
              </span>
              <span className="pulse-dot" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <h2 style={{
                fontFamily: 'Epilogue', fontWeight: 800, fontSize: 24,
                color: 'var(--on-surface)', lineHeight: 1.1,
              }}>
                {tableInfo?.isVip || tableInfo?.tableNumber?.toUpperCase().includes('VIP')
                  ? `${tableInfo.tableNumber}${tableInfo?.tableName ? ` • ${tableInfo.tableName}` : ''}`
                  : (tableInfo?.tableNumber || 'Bàn ăn')}
              </h2>
              <span style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 12, color: 'var(--on-surface-variant)' }}>
                • {tableInfo?.guestCount || 2} Khách
              </span>
            </div>
          </div>

          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--primary-fixed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)', boxShadow: 'var(--shadow-xs)',
          }}>
            <Icon name="restaurant_menu" size={24} />
          </div>
        </div>
      </div>

      {/* --- Section Header: Danh sach mon --- */}
      <div style={{
        padding: '16px 16px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h3 style={{
          fontFamily: 'Epilogue', fontWeight: 700, fontSize: 16,
          color: 'var(--on-surface)',
        }}>
          Các món đã chọn ({totalCount})
        </h3>
        <Link
          to="/dining/menu"
          style={{
            fontFamily: 'Plus Jakarta Sans', fontSize: 13, fontWeight: 700,
            color: 'var(--primary)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 2,
          }}
        >
          <Icon name="add" size={16} />
          Chọn thêm món
        </Link>
      </div>

      {/* --- Danh sach Cart Items --- */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cartItems.map((item, idx) => (
          <div
            key={`${item.id}-${idx}-${item.note || ''}`}
            style={{
              background: 'var(--surface-container-lowest)',
              borderRadius: 16, padding: 12,
              border: '1px solid rgba(240, 230, 228, 0.6)',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <img
                src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'}
                alt={item.name}
                style={{
                  width: 64, height: 64, borderRadius: 12,
                  objectFit: 'cover', flexShrink: 0,
                  background: 'var(--surface-container)',
                }}
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                  <h4 style={{
                    fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 14,
                    color: 'var(--on-surface)', lineHeight: '18px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.name}
                  </h4>
                  <span style={{
                    fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 14,
                    color: 'var(--primary)', fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                  }}>
                    {formatVND(item.price * item.quantity)}
                  </span>
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
                  color: 'var(--on-surface-variant)', fontFamily: 'Plus Jakarta Sans', fontSize: 11,
                }}>
                  <span>{formatVND(item.price)} / phần</span>
                </div>

                {item.note && (
                  <div style={{
                    marginTop: 4, padding: '3px 8px', borderRadius: 6,
                    background: 'var(--surface-container)', color: 'var(--on-surface-variant)',
                    fontFamily: 'Plus Jakarta Sans', fontSize: 11, fontStyle: 'italic',
                    display: 'inline-block',
                  }}>
                    "{item.note}"
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              paddingTop: 8, borderTop: '1px solid var(--surface-container-high)',
            }}>
              <span style={{
                color: 'var(--on-surface-variant)', fontFamily: 'Plus Jakarta Sans', fontSize: 12, fontWeight: 500
              }}>
                Số lượng:
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Stepper */}
                {(() => {
                  const totalForDish = cartItems
                    .filter(i => Number(i.id) === Number(item.id))
                    .reduce((s, i) => s + i.quantity, 0);
                  const hasFinite = item.remainingStock !== null && item.remainingStock !== undefined;
                  const atStockLimit = item.isAvailable === false || (hasFinite && totalForDish >= Number(item.remainingStock));
                  return (
                    <div className="stepper">
                      <button
                        className="stepper-btn"
                        onClick={() => updateQuantity(item.id, item.note, -1)}
                      >
                        <Icon name="remove" size={15} />
                      </button>
                      <span className="stepper-count">{item.quantity}</span>
                      <button
                        className="stepper-btn"
                        style={{
                          opacity: atStockLimit ? 0.45 : 1,
                          cursor: atStockLimit ? 'not-allowed' : 'pointer',
                        }}
                        onClick={() => {
                          if (item.isAvailable === false) {
                            showToast(`Món "${item.name}" hiện đã tạm ngưng phục vụ!`);
                            return;
                          }
                          if (hasFinite && totalForDish >= Number(item.remainingStock)) {
                            showToast(`Món "${item.name}" chỉ còn tối đa ${item.remainingStock} suất!`);
                            return;
                          }
                          updateQuantity(item.id, item.note, 1);
                        }}
                      >
                        <Icon name="add" size={15} />
                      </button>
                    </div>
                  );
                })()}

                {/* Nut xoa mon */}
                <button
                  onClick={() => { removeFromCart(item.id, item.note); showToast('Đã xóa món khỏi giỏ hàng'); }}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--outline)', transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.background = 'rgba(255, 218, 214, 0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--outline)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <Icon name="delete_outline" size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- Ghi chu chung cho bep --- */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{
          background: 'var(--surface-container-lowest)',
          borderRadius: 16, padding: 14,
          border: '1px solid rgba(240, 230, 228, 0.6)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Icon name="soup_kitchen" size={20} style={{ color: 'var(--primary)' }} />
            <label style={{
              fontFamily: 'Plus Jakarta Sans', fontWeight: 600, fontSize: 13,
              color: 'var(--on-surface)',
            }}>
              Ghi chú cho Bếp &amp; Phục vụ
            </label>
            <span style={{
              marginLeft: 'auto',
              fontFamily: 'Plus Jakarta Sans', fontSize: 12,
              color: 'var(--on-surface-variant)',
            }}>
              (Không bắt buộc)
            </span>
          </div>
          <textarea
            rows={2}
            placeholder="Ví dụ: Mang sinh tố lên trước, sườn cắt sẵn, ít tiêu..."
            value={orderNote}
            onChange={e => setOrderNote(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--surface-container-low)',
              border: '1px solid transparent',
              borderRadius: 10, padding: '10px 12px',
              fontFamily: 'Plus Jakarta Sans', fontSize: 13,
              color: 'var(--on-surface)', resize: 'none', outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--outline-variant)'; e.target.style.background = 'var(--surface-container-lowest)'; }}
            onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = 'var(--surface-container-low)'; }}
          />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, marginTop: 6,
            color: 'var(--on-surface-variant)', fontFamily: 'Plus Jakarta Sans', fontSize: 12,
          }}>
            <Icon name="info" size={13} />
            Bếp trưởng sẽ ưu tiên chế biến đúng yêu cầu của quý khách.
          </div>
        </div>
      </div>

      {/* --- Bang ke tam tinh --- */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{
          background: 'var(--surface-container-lowest)',
          borderRadius: 16, padding: 14,
          border: '1px solid rgba(240, 230, 228, 0.6)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <h4 style={{
            fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 13,
            color: 'var(--on-surface)', marginBottom: 2,
          }}>
            Tóm tắt thanh toán tạm tính
          </h4>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 14, color: 'var(--on-surface-variant)' }}>
              Tạm tính ({totalCount} món)
            </span>
            <span style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 14, fontWeight: 500, color: 'var(--on-surface)' }}>
              {formatVND(totalPrice)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 13, color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>
              Thuế GTGT
            </span>
            <span style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 13, color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>
              Đã gồm trong giá món
            </span>
          </div>

          <div style={{ height: 1, background: 'var(--surface-container-highest)', margin: '2px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontFamily: 'Epilogue', fontWeight: 700, fontSize: 16, color: 'var(--on-surface)' }}>
                Tổng cộng tạm tính
              </p>
              <p style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 11, color: 'var(--on-surface-variant)' }}>
                Thanh toán sau khi kết thúc bữa ăn
              </p>
            </div>
            <span style={{
              fontFamily: 'Epilogue', fontWeight: 700, fontSize: 22,
              color: 'var(--primary)', letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {formatVND(grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* --- CTA Buttons --- */}
      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Nut gui bep */}
        <button
          onClick={handleSubmitOrder}
          disabled={isSubmitting}
          style={{
            width: '100%', height: 52, borderRadius: '9999px',
            background: 'var(--primary-container)', color: 'var(--on-primary)',
            border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
            fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: 'var(--shadow-primary)',
            transition: 'all 0.2s ease',
            opacity: isSubmitting ? 0.8 : 1,
          }}
        >
          <Icon name={isSubmitting ? 'autorenew' : 'send'} size={20} fill={1} />
          {isSubmitting ? 'Đang chuyển đơn vào bếp...' : 'Gửi Đơn: Món Vào Bếp • Nước Cho Phục Vụ'}
        </button>

        {/* Nut goi nhan vien */}
        <button
          onClick={handleCallStaff}
          style={{
            width: '100%', height: 48, borderRadius: '9999px',
            background: 'var(--surface-container-lowest)', color: 'var(--secondary)',
            border: '1px solid var(--surface-container-high)', cursor: 'pointer',
            fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: 'var(--shadow-xs)',
            transition: 'all 0.15s ease',
          }}
        >
          <Icon name="notifications_active" size={20} />
          Gọi Nhân Viên Hỗ Trợ
        </button>

        {/* Note */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '4px 0' }}>
          <Icon name="sync" size={14} style={{ color: 'var(--tertiary)' }} />
          <p style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 12, color: 'var(--on-surface-variant)', textAlign: 'center' }}>
            Món ăn chuyển ngay vào Bếp KDS, nước đóng chai chuyển tới nhân viên phục vụ
          </p>
        </div>
      </div>

      {/* Toast */}
      {toastNode}
    </div>
  );
}
