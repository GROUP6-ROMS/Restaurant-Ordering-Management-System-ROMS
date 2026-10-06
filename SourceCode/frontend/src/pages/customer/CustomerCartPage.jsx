import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

// Icon Material Symbols
function Icon({ name, size = 22, fill = 0, style = {} }) {
  return (
    <span
      className="material-icon"
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        lineHeight: 1, verticalAlign: 'middle',
        ...style
      }}
    >
      {name}
    </span>
  );
}

// Format tien VND
function formatVND(amount) {
  return amount.toLocaleString('vi-VN') + 'đ';
}

// ====================================================
// CustomerCartPage - Gio hang goi mon (SCR-12 Stitch)
// ====================================================
export default function CustomerCartPage() {
  const {
    cartItems, updateQuantity, removeFromCart, clearCart,
    totalCount, totalPrice, tableInfo
  } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  };

  // VAT 8%
  const VAT_RATE = 0.08;
  const vatAmount = Math.round(totalPrice * VAT_RATE);
  const grandTotal = totalPrice + vatAmount;

  const handleSubmitOrder = () => {
    if (cartItems.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      clearCart();
      navigate('/dining/orders/tracking?success=true');
    }, 1200);
  };

  // Trang gio hang trong
  if (cartItems.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100dvh - 120px)', padding: '40px 16px',
        textAlign: 'center',
      }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'var(--primary)', color: 'var(--on-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)', flexShrink: 0,
            }}>
              <Icon name="table_restaurant" size={26} fill={1} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--primary)',
                  display: 'inline-block',
                  animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite',
                }} />
                <span style={{
                  fontFamily: 'Plus Jakarta Sans', fontSize: 11, fontWeight: 700,
                  color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  Đang dùng tại chỗ
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{
                  fontFamily: 'Epilogue', fontWeight: 800, fontSize: 22,
                  color: 'var(--primary)', letterSpacing: '-0.02em',
                }}>
                  {tableInfo?.tableNumber || 'Bàn T05'}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: 'var(--on-surface-variant)',
                  background: 'var(--surface-container)',
                  padding: '2px 8px', borderRadius: 8,
                  fontFamily: 'Plus Jakarta Sans',
                }}>
                  Tầng 1
                </span>
              </div>
            </div>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 10px', borderRadius: '9999px',
              background: 'var(--tertiary-fixed)',
              color: 'var(--on-tertiary-fixed)',
              fontFamily: 'Plus Jakarta Sans', fontSize: 12, fontWeight: 700,
              boxShadow: 'var(--shadow-xs)',
            }}>
              {totalCount} món
            </span>
          </div>
        </div>
      </div>

      {/* --- Danh sach mon trong gio --- */}
      <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cartItems.map((item, idx) => (
          <div
            key={`${item.id}-${item.note}-${idx}`}
            style={{
              background: 'var(--surface-container-lowest)',
              borderRadius: 16, padding: 14,
              border: '1px solid rgba(240, 230, 228, 0.6)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex', flexDirection: 'column', gap: 8,
              transition: 'all 0.2s ease',
            }}
          >
            {/* Row thong tin mon */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {/* Anh mon */}
              <div style={{
                width: 80, height: 80, borderRadius: 10,
                overflow: 'hidden', flexShrink: 0,
                background: 'var(--surface-container)',
                position: 'relative',
              }}>
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              {/* Ten + Gia */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
                  <h3 style={{
                    fontFamily: 'Epilogue', fontWeight: 700, fontSize: 15,
                    color: 'var(--on-surface)', lineHeight: '20px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    flex: 1,
                  }}>
                    {item.name}
                  </h3>
                  <span style={{
                    fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 14,
                    color: 'var(--primary)', flexShrink: 0,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {formatVND(item.price)}
                  </span>
                </div>
                {/* Ghi chu */}
                {item.note && (
                  <div style={{
                    marginTop: 4,
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '3px 8px', borderRadius: '9999px',
                    background: 'var(--surface-container)',
                    color: 'var(--on-surface-variant)',
                    width: 'fit-content',
                  }}>
                    <Icon name="check" size={12} style={{ color: 'var(--tertiary)' }} />
                    <span style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 11, fontWeight: 400 }}>
                      {item.note}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Row Stepper + Xoa */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  color: 'var(--primary)', background: 'transparent', border: 'none',
                  cursor: 'pointer', fontFamily: 'Plus Jakarta Sans', fontSize: 12, fontWeight: 600,
                  padding: 0,
                }}
              >
                <Icon name="tune" size={14} />
                Tùy biến món ăn
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Stepper */}
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
                    onClick={() => updateQuantity(item.id, item.note, 1)}
                  >
                    <Icon name="add" size={15} />
                  </button>
                </div>

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
            placeholder="Ví dụ: Mang sinh tố lên trước, sườn cắt sẵn..."
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
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Plus Jakarta Sans', fontSize: 14, color: 'var(--on-surface-variant)' }}>
              Thuế VAT (8%)
              <Icon name="help_outline" size={14} style={{ color: 'var(--outline)' }} />
            </span>
            <span style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 14, fontWeight: 500, color: 'var(--on-surface)' }}>
              {formatVND(vatAmount)}
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
          {isSubmitting ? 'Đang gửi đơn...' : 'Gửi Đơn: Món Vào Bếp • Nước Cho Phục Vụ'}
        </button>

        {/* Nut goi nhan vien */}
        <button
          onClick={() => showToast('Đang gọi nhân viên đến Bàn T05...')}
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
      <div className={`toast ${toastVisible ? '' : 'hidden'}`}>
        <Icon name="check_circle" size={18} style={{ color: 'var(--secondary-fixed-dim)' }} />
        {toastMsg}
      </div>
    </div>
  );
}
