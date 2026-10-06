import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

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

export default function CustomerTrackingPage() {
  const { tableInfo } = useCart();
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';

  const [toastMessage, setToastMessage] = useState(isSuccess ? 'Đã gửi đơn vào bếp thành công!' : null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const batches = [
    {
      batchId: 1,
      time: '12:18',
      type: 'Đơn chính',
      isAddon: false,
      items: [
        {
          id: 'b1-1',
          name: 'Phở Bò Đặc Biệt ROMS Signature',
          price: 170000,
          qty: 2,
          note: 'Bò tái mềm, nhiều hành lá',
          image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=300&q=80',
          status: 'SERVED',
          statusText: 'Đã phục vụ',
          statusTime: 'Ra lúc 12:28'
        },
        {
          id: 'b1-2',
          name: 'Gỏi Cuốn Tôm Thịt Heo',
          price: 45000,
          qty: 1,
          note: 'Kèm tương chấm chua ngọt',
          image: 'https://images.unsplash.com/photo-1548946526-f69e2424cf45?w=300&q=80',
          status: 'SERVED',
          statusText: 'Đã phục vụ',
          statusTime: 'Ra lúc 12:24'
        },
        {
          id: 'b1-3',
          name: 'Cơm Tấm Sườn Mật Ong Đặc Biệt',
          price: 95000,
          qty: 1,
          note: 'Nướng vừa tới, thêm mỡ hành',
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80',
          status: 'COOKING',
          statusText: 'Bếp đang làm (~5p)',
          statusTime: 'Bếp (KDS)'
        }
      ]
    },
    {
      batchId: 2,
      time: '12:35',
      type: 'Gọi thêm',
      isAddon: true,
      items: [
        {
          id: 'b2-1',
          name: 'Coca-Cola Sleek Lon 320ml (Ướp Lạnh)',
          price: 25000,
          qty: 2,
          note: 'Kèm ly đá và lát chanh tươi',
          image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80',
          status: 'READY',
          statusText: 'Đã chuẩn bị xong',
          statusTime: 'Phục vụ mang ra bàn'
        },
        {
          id: 'b2-2',
          name: 'Bia Tiger Crystal Lon 330ml (Bạc)',
          price: 35000,
          qty: 1,
          note: 'Ướp lạnh kèm ly đá pha lê',
          image: 'https://images.unsplash.com/photo-1608270199026-646e7f8e32c0?w=300&q=80',
          status: 'COOKING',
          statusText: 'Waiter đang lấy nước',
          statusTime: 'Lấy từ tủ mát (~1p)'
        }
      ]
    }
  ];

  // Tính tổng
  const totalFoodPrice = batches.reduce((sum, batch) => {
    return sum + batch.items.reduce((bSum, item) => bSum + item.price * item.qty, 0);
  }, 0);
  const vat = Math.round(totalFoodPrice * 0.08);
  const finalTotal = totalFoodPrice + vat;
  const totalItemCount = batches.reduce((sum, batch) => {
    return sum + batch.items.reduce((bSum, item) => bSum + item.qty, 0);
  }, 0);

  const handleConfirmPayment = (methodName) => {
    setShowPaymentModal(false);
    setSelectedMethod(methodName);
    setPaymentSuccess(true);
    showToast(`Đã gửi yêu cầu thanh toán bằng [${methodName}] tới thu ngân!`);
  };

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

      {/* 1. Table Identity & Status Card (theo SCR-11) */}
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
                background: '#C85A32',
                color: '#FFFFFF',
                fontFamily: "'Epilogue', sans-serif",
                fontWeight: 800,
                fontSize: '1.05rem',
                padding: '4px 12px',
                borderRadius: '10px',
                letterSpacing: '-0.01em'
              }}>
                BÀN {tableInfo?.tableNumber || 'T05'}
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
              Tầng 1 — Sảnh chính ({tableInfo?.capacity || 4} khách)
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
              #ROM-8842
            </span>
            <div style={{ fontSize: '0.78rem', color: '#56423D', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
              <Icon name="schedule" size={14} style={{ color: '#89726B' }} />
              35 phút (từ 12:15)
            </div>
          </div>
        </div>

        {/* Quick Assistance Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginTop: '18px',
          paddingTop: '14px',
          borderTop: '1px solid #F6ECEA'
        }}>
          <button
            type="button"
            onClick={() => showToast(`Nhân viên phụ trách đang tới bàn ${tableInfo?.tableNumber || 'T05'}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid #F0E6E4',
              background: '#FFF8F6',
              color: '#C85A32',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name="notifications" size={18} fill={1} />
            <span>Gọi phục vụ</span>
          </button>
          <button
            type="button"
            onClick={() => showToast('Đã gửi yêu cầu thêm Đá, Khăn lạnh!')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid #F0E6E4',
              background: '#FFF8F6',
              color: '#56423D',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name="ac_unit" size={18} style={{ color: '#994703' }} />
            <span>Xin đá / Khăn</span>
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
            Món đã gọi theo đợt
          </h3>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#89726B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Tổng {totalItemCount} món
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {batches.map(batch => (
            <div
              key={batch.batchId}
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
                    background: batch.isAddon ? '#FC934F' : '#C85A32'
                  }} />
                  <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1F1B1A' }}>
                    Đợt {batch.batchId} • {batch.time}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#89726B' }}>
                    ({batch.items.length} món)
                  </span>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  background: batch.isAddon ? '#FFDBC9' : '#F6ECEA',
                  color: batch.isAddon ? '#753400' : '#56423D'
                }}>
                  {batch.type}
                </span>
              </div>

              {/* Items in Batch */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {batch.items.map(item => (
                  <div
                    key={item.id}
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
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                        x{item.qty}
                      </span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </h4>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1F1B1A', whiteSpace: 'nowrap' }}>
                          {(item.price * item.qty).toLocaleString('vi-VN')}đ
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
                            {item.statusText}
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
                            {item.statusText}
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
                            {item.statusText}
                          </span>
                        )}
                        <span style={{ fontSize: '0.72rem', color: '#89726B' }}>
                          {item.statusTime}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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
          <span style={{ fontSize: '0.78rem', color: '#C85A32', fontWeight: 700 }}>
            Đã bao gồm VAT
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#56423D' }}>
            <span>Tiền món ({totalItemCount} món)</span>
            <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{totalFoodPrice.toLocaleString('vi-VN')}đ</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#56423D' }}>
            <span>Thuế GTGT (VAT 8%)</span>
            <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{vat.toLocaleString('vi-VN')}đ</span>
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
              {finalTotal.toLocaleString('vi-VN')}đ
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
            <span>Thu ngân đang chuẩn bị thanh toán bằng {selectedMethod}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '15px 20px',
              background: '#C85A32',
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
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(200, 90, 50, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name="payments" size={22} fill={1} />
            <span>Yêu cầu thanh toán</span>
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
                  <span style={{ fontSize: '0.78rem', color: '#89726B' }}>Bàn {tableInfo?.tableNumber || 'T05'}</span>
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
                  {finalTotal.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <span style={{ padding: '4px 10px', background: '#F0E6E4', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A' }}>
                5 món
              </span>
            </div>

            {/* Methods */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => handleConfirmPayment('Chuyển khoản VietQR')}
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
                onClick={() => handleConfirmPayment('Tiền mặt tại bàn')}
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
                onClick={() => handleConfirmPayment('Quẹt thẻ POS')}
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
