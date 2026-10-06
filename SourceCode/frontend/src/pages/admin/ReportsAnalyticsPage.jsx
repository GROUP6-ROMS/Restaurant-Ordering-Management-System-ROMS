import React, { useState } from 'react';
import Icon from '../../components/common/Icon';

const TIMEFRAMES = [
  { id: 'TODAY', label: 'Hôm Nay' },
  { id: 'YESTERDAY', label: 'Hôm Qua' },
  { id: 'WEEK', label: '7 Ngày Qua' },
  { id: 'MONTH', label: 'Tháng Này' },
  { id: 'CUSTOM', label: 'Tùy Chỉnh' },
];

const BESTSELLERS = [
  { id: 1, rank: 1, name: 'Bò Wagyu Nướng Đá Muối', category: 'Món Chính', sold: 48, revenue: 16800000, trend: '+18%' },
  { id: 2, rank: 2, name: 'Cá Hồi Áp Chảo Sốt Bơ Tỏi', category: 'Món Chính', sold: 36, revenue: 10440000, trend: '+12%' },
  { id: 3, rank: 3, name: 'Cocktail Signature Hoàng Gia', category: 'Đồ Uống', sold: 62, revenue: 9920000, trend: '+25%' },
  { id: 4, rank: 4, name: 'Súp Hải Sản Hoàng Kim', category: 'Khai Vị', sold: 54, revenue: 7560000, trend: '+8%' },
  { id: 5, rank: 5, name: 'Bánh Mousse Socola Bỉ', category: 'Tráng Miệng', sold: 42, revenue: 4830000, trend: '+5%' },
];

const HOURLY_DATA = [
  { hour: '10:00 - 11:00', orders: 4, tables: 3, revenue: 1450000, pct: 15 },
  { hour: '11:00 - 12:00', orders: 18, tables: 12, revenue: 7820000, pct: 70 },
  { hour: '12:00 - 13:00', orders: 26, tables: 16, revenue: 11500000, pct: 95 },
  { hour: '13:00 - 14:00', orders: 8, tables: 6, revenue: 3200000, pct: 30 },
  { hour: '14:00 - 17:00', orders: 6, tables: 4, revenue: 2100000, pct: 20 },
  { hour: '17:00 - 18:00', orders: 12, tables: 9, revenue: 5400000, pct: 50 },
  { hour: '18:00 - 19:30', orders: 32, tables: 18, revenue: 14800000, pct: 100 },
  { hour: '19:30 - 21:00', orders: 28, tables: 17, revenue: 12600000, pct: 88 },
  { hour: '21:00 - 22:30', orders: 11, tables: 8, revenue: 4250000, pct: 38 },
];

export default function ReportsAnalyticsPage() {
  const [timeframe, setTimeframe] = useState('TODAY');
  const [reportType, setReportType] = useState('REVENUE'); // REVENUE, DISHES, OPERATIONS
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: '#1F1B1A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          fontSize: '0.9rem',
          borderLeft: '4px solid #9D4124'
        }}>
          <Icon name="check_circle" size={20} style={{ color: '#E8C3BA' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Export Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9D4124', background: '#FFDBC9', padding: '2px 8px', borderRadius: '6px' }}>
              Tổng Quan Vận Hành
            </span>
            <span style={{ fontSize: '0.85rem', color: '#89726B', fontWeight: 600 }}>Quản Trị Nhà Hàng</span>
          </div>
          <h1 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.75rem', color: '#1F1B1A', margin: 0 }}>
            Báo Cáo Doanh Thu & Vận Hành
          </h1>
          <p style={{ margin: '4px 0 0', color: '#56423D', fontSize: '0.88rem' }}>
            Phân tích số liệu kinh doanh, tốc độ phục vụ bàn và hiệu suất tiêu thụ món ăn.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Timeframe Chips */}
          <div style={{ display: 'flex', background: '#FFFFFF', padding: '4px', borderRadius: '12px', border: '1px solid #EAE0DE' }}>
            {TIMEFRAMES.map(tf => {
              const isActive = timeframe === tf.id;
              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setTimeframe(tf.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? '#9D4124' : 'transparent',
                    color: isActive ? '#FFFFFF' : '#56423D',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => showToast('Đang kết xuất báo cáo Excel (.xlsx)...')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '12px',
              background: '#FFFFFF',
              border: '1px solid #EAE0DE',
              fontWeight: 700,
              fontSize: '0.82rem',
              color: '#56423D',
              cursor: 'pointer'
            }}
          >
            <Icon name="table_view" size={18} />
            Xuất Excel
          </button>

          <button
            type="button"
            onClick={() => showToast('Đang kết xuất phiếu báo cáo PDF...')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '12px',
              background: '#9D4124',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              color: '#FFFFFF',
              cursor: 'pointer'
            }}
          >
            <Icon name="picture_as_pdf" size={18} />
            In Báo Cáo
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px'
      }}>
        {/* Total Revenue */}
        <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '20px', border: '1px solid #F0E6E4', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#89726B' }}>Tổng Doanh Thu Ca/Ngày</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFDBC9', color: '#9D4124', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="payments" size={20} />
            </div>
          </div>
          <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.75rem', color: '#1F1B1A' }}>
            63.120.000₫
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
            <Icon name="trending_up" size={16} />
            <span>+16.4% so với hôm qua</span>
          </div>
        </div>

        {/* Total Orders / Tables */}
        <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '20px', border: '1px solid #F0E6E4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#89726B' }}>Tổng Lượt Phục Vụ</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#DDE8AB', color: '#3E491A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="table_restaurant" size={20} />
            </div>
          </div>
          <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.75rem', color: '#1F1B1A' }}>
            86 lượt bàn
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.78rem', color: '#56423D' }}>
            <span>242 lượt khách đã phục vụ</span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '20px', border: '1px solid #F0E6E4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#89726B' }}>Giá Trị TB / Bàn (AOV)</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F6ECEA', color: '#56423D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="receipt_long" size={20} />
            </div>
          </div>
          <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.75rem', color: '#1F1B1A' }}>
            733.950₫
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
            <Icon name="trending_up" size={16} />
            <span>+4.2% so với tuần trước</span>
          </div>
        </div>

        {/* Avg Service Time */}
        <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '20px', border: '1px solid #F0E6E4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#89726B' }}>Thời Gian Phục Vụ TB</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF3C7', color: '#78350F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="schedule" size={20} />
            </div>
          </div>
          <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.75rem', color: '#1F1B1A' }}>
            13.5 phút
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
            <span>Nhanh hơn KPI chuẩn (15p)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Hourly Revenue Graph + Top Bestsellers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '20px'
      }}>
        {/* Left Side: Hourly Revenue Bar Chart Simulation (8 cols) */}
        <div style={{
          gridColumn: 'span 8',
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid #F0E6E4',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#1F1B1A', margin: 0 }}>
                Doanh Thu Theo Khung Giờ Hoạt Động
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#89726B' }}>
                Khung giờ cao điểm trưa (11:30 - 13:00) và tối (18:00 - 20:30)
              </p>
            </div>

            <span style={{ fontSize: '0.78rem', background: '#FCF1EF', color: '#9D4124', fontWeight: 700, padding: '4px 10px', borderRadius: '8px' }}>
              Giờ Đỉnh: 18:00 - 19:30 (14.8M)
            </span>
          </div>

          {/* Bar Chart list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {HOURLY_DATA.map((h, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.82rem' }}>
                <span style={{ width: '95px', color: '#56423D', fontWeight: 600, flexShrink: 0 }}>
                  {h.hour}
                </span>

                <div style={{ flex: 1, background: '#F6ECEA', height: '22px', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    width: `${h.pct}%`,
                    height: '100%',
                    background: h.pct > 80 ? 'linear-gradient(90deg, #9D4124, #BA1A1A)' : '#9D4124',
                    borderRadius: '6px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>

                <div style={{ width: '130px', textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontWeight: 800, color: '#1F1B1A' }}>
                    {h.revenue.toLocaleString('vi-VN')}₫
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#89726B', marginLeft: '6px' }}>
                    ({h.tables} bàn)
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Method Distribution */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed #EAE0DE' }}>
            <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.95rem', color: '#1F1B1A', margin: '0 0 12px' }}>
              Cơ Cấu Phương Thức Thanh Toán
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ background: '#FFF8F6', padding: '12px', borderRadius: '12px', border: '1px solid #F6ECEA' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#89726B', fontSize: '0.75rem', fontWeight: 600 }}>
                  <span>Chuyển khoản VietQR</span>
                  <span style={{ color: '#9D4124', fontWeight: 800 }}>68%</span>
                </div>
                <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#1F1B1A', marginTop: '4px' }}>
                  42.920.000₫
                </div>
              </div>

              <div style={{ background: '#FFF8F6', padding: '12px', borderRadius: '12px', border: '1px solid #F6ECEA' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#89726B', fontSize: '0.75rem', fontWeight: 600 }}>
                  <span>Tiền mặt tại quầy</span>
                  <span style={{ color: '#059669', fontWeight: 800 }}>24%</span>
                </div>
                <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#1F1B1A', marginTop: '4px' }}>
                  15.150.000₫
                </div>
              </div>

              <div style={{ background: '#FFF8F6', padding: '12px', borderRadius: '12px', border: '1px solid #F6ECEA' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#89726B', fontSize: '0.75rem', fontWeight: 600 }}>
                  <span>Thẻ POS / Thẻ tín dụng</span>
                  <span style={{ color: '#78350F', fontWeight: 800 }}>8%</span>
                </div>
                <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#1F1B1A', marginTop: '4px' }}>
                  5.050.000₫
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Top 5 Bestsellers & Inventory Alert (4 cols) */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Bestseller list */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #F0E6E4',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="local_fire_department" size={22} style={{ color: '#9D4124' }} />
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#1F1B1A', margin: 0 }}>
                  Món Bán Chạy Nhất
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#89726B', fontWeight: 600 }}>Hôm nay</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {BESTSELLERS.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: item.rank === 1 ? '#FFF8F6' : '#FAFAFA',
                    border: item.rank === 1 ? '1px solid #FFDBC9' : '1px solid #F0E6E4'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: item.rank === 1 ? '#9D4124' : '#F0E6E4',
                      color: item.rank === 1 ? '#FFFFFF' : '#56423D',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {item.rank}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#89726B' }}>
                        {item.category} • Đã gọi {item.sold} phần
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#9D4124' }}>
                      {(item.revenue / 1000000).toFixed(1)}M
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 700 }}>
                      {item.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
