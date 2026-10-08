import React, { useState, useEffect } from 'react';
import Icon from '../../components/common/Icon';
import reportApi from '../../api/reportApi';

// Danh sách các tùy chọn mốc thời gian lọc báo cáo
const TIMEFRAMES = [
  { id: 'TODAY', label: 'Hôm Nay' },
  { id: 'YESTERDAY', label: 'Hôm Qua' },
  { id: 'WEEK', label: '7 Ngày Qua' },
  { id: 'MONTH', label: 'Tháng Này' },
  { id: 'CUSTOM', label: 'Tùy Chỉnh' },
];

export default function ReportsAnalyticsPage() {
  // State lưu khoảng thời gian lọc hiện tại
  const [timeframe, setTimeframe] = useState('TODAY');

  // State lưu ngày bắt đầu và kết thúc khi chọn tùy chỉnh (CUSTOM)
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

  // State chuyển đổi giữa 3 góc nhìn báo cáo: REVENUE (Doanh thu), DISHES (Món ăn), OPERATIONS (Vận hành)
  const [reportType, setReportType] = useState('REVENUE');

  // State lưu dữ liệu báo cáo trả về từ Backend API
  const [reportData, setReportData] = useState(null);

  // State quản lý trạng thái đang tải dữ liệu
  const [loading, setLoading] = useState(true);

  // State lưu thông báo lỗi nếu gọi API thất bại
  const [errorMessage, setErrorMessage] = useState(null);

  // State lưu thông báo Toast tạm thời
  const [toastMessage, setToastMessage] = useState(null);

  // Hàm hiển thị thông báo Toast trong 3 giây
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Hàm gọi API lấy dữ liệu báo cáo từ Backend Spring Boot
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const sDate = (timeframe === 'CUSTOM') ? customStartDate : null;
      const eDate = (timeframe === 'CUSTOM') ? customEndDate : null;

      const response = await reportApi.getReportSummary(timeframe, sDate, eDate);

      if (response.data && response.data.success) {
        setReportData(response.data.data);
      } else {
        setErrorMessage(response.data?.message || 'Không thể tải dữ liệu báo cáo');
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu báo cáo:', error);
      setErrorMessage(error.response?.data?.message || 'Lỗi kết nối máy chủ khi tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  // Tự động gọi lại API mỗi khi thay đổi khoảng thời gian (timeframe)
  useEffect(() => {
    if (timeframe !== 'CUSTOM') {
      fetchReportData();
    }
  }, [timeframe]);

  // Hàm xử lý xuất file Excel (CSV UTF-8 có BOM)
  const handleExportExcel = async () => {
    try {
      showToast('Đang kết xuất báo cáo Excel...');
      const sDate = (timeframe === 'CUSTOM') ? customStartDate : null;
      const eDate = (timeframe === 'CUSTOM') ? customEndDate : null;

      const response = await reportApi.exportReportCsv(timeframe, sDate, eDate);

      // Tạo đường dẫn blob và kích hoạt tải xuống tự động trên trình duyệt
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `ROMS_BaoCao_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      showToast('Đã tải xuống tệp báo cáo Excel thành công!');
    } catch (error) {
      console.error('Lỗi khi xuất file Excel:', error);
      showToast('Xuất báo cáo thất bại, vui lòng thử lại');
    }
  };

  // Hàm mở hộp thoại in báo cáo trình duyệt (Print dialog)
  const handlePrintReport = () => {
    window.print();
  };

  // Các dữ liệu dự phòng an toàn từ API
  const kpi = reportData?.kpi || {
    totalRevenue: 63120000,
    revenueTrend: '+16.4%',
    totalTables: 86,
    totalGuests: 242,
    averageOrderValue: 733950,
    aovTrend: '+4.2%',
    avgServiceDurationMinutes: 13.5
  };

  const hourlyList = reportData?.hourlyData || [];
  const paymentMethods = reportData?.paymentMethods || [];
  const bestsellers = reportData?.bestsellers || [];

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
            <span style={{ fontSize: '0.85rem', color: '#89726B', fontWeight: 600 }}>Quản Trị Nhà Hàng ROMS</span>
          </div>
          <h1 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.75rem', color: '#1F1B1A', margin: 0 }}>
            Báo Cáo Doanh Thu & Vận Hành
          </h1>
          <p style={{ margin: '4px 0 0', color: '#56423D', fontSize: '0.88rem' }}>
            Phân tích số liệu kinh doanh, tốc độ phục vụ bàn và hiệu suất tiêu thụ món ăn.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Nút Refresh dữ liệu */}
          <button
            type="button"
            onClick={fetchReportData}
            title="Tải lại dữ liệu mới nhất"
            style={{
              padding: '8px 12px',
              borderRadius: '12px',
              border: '1px solid #EAE0DE',
              background: '#FFFFFF',
              color: '#56423D',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              fontSize: '0.82rem'
            }}
          >
            <Icon name="refresh" size={18} />
            <span>Làm Mới</span>
          </button>

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

          {/* Nút Xuất Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
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

          {/* Nút In Báo Cáo */}
          <button
            type="button"
            onClick={handlePrintReport}
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

      {/* Thanh chọn ngày khi chọn chế độ Tùy Chỉnh (CUSTOM) */}
      {timeframe === 'CUSTOM' && (
        <div style={{
          background: '#FFFFFF',
          padding: '14px 20px',
          borderRadius: '14px',
          border: '1px solid #EAE0DE',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1F1B1A' }}>
            Khoảng ngày tùy chỉnh:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#89726B' }}>Từ:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #EAE0DE',
                fontSize: '0.85rem',
                fontFamily: 'inherit'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#89726B' }}>Đến:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #EAE0DE',
                fontSize: '0.85rem',
                fontFamily: 'inherit'
              }}
            />
          </div>
          <button
            type="button"
            onClick={fetchReportData}
            style={{
              padding: '7px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#9D4124',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Áp Dụng Lọc
          </button>
        </div>
      )}

      {/* Tabs chuyển đổi 3 góc nhìn báo cáo */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #EAE0DE', paddingBottom: '8px' }}>
        {[
          { id: 'REVENUE', label: 'Doanh Thu & Dòng Tiền', icon: 'payments' },
          { id: 'DISHES', label: 'Món Ăn & Tiêu Thụ', icon: 'restaurant_menu' },
          { id: 'OPERATIONS', label: 'Vận Hành Bàn & Hiệu Suất', icon: 'table_restaurant' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setReportType(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              background: reportType === tab.id ? '#FFDBC9' : 'transparent',
              color: reportType === tab.id ? '#9D4124' : '#56423D',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name={tab.icon} size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Trạng thái Lỗi nếu có */}
      {errorMessage && (
        <div style={{
          background: '#FFDAD6',
          color: '#93000A',
          padding: '12px 16px',
          borderRadius: '12px',
          fontWeight: 600,
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Icon name="error" size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px'
      }}>
        {/* KPI 1: Tổng Doanh Thu */}
        <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '20px', border: '1px solid #F0E6E4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#89726B' }}>Tổng Doanh Thu</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFDBC9', color: '#9D4124', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="payments" size={20} />
            </div>
          </div>
          <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.75rem', color: '#1F1B1A' }}>
            {Number(kpi.totalRevenue || 0).toLocaleString('vi-VN')}₫
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
            <Icon name="trending_up" size={16} />
            <span>{kpi.revenueTrend} so với kỳ trước</span>
          </div>
        </div>

        {/* KPI 2: Tổng Lượt Phục Vụ */}
        <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '20px', border: '1px solid #F0E6E4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#89726B' }}>Tổng Lượt Phục Vụ</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#DDE8AB', color: '#3E491A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="table_restaurant" size={20} />
            </div>
          </div>
          <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.75rem', color: '#1F1B1A' }}>
            {kpi.totalTables} lượt bàn
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.78rem', color: '#56423D' }}>
            <span>{kpi.totalGuests} lượt khách đã phục vụ</span>
          </div>
        </div>

        {/* KPI 3: Giá Trị Trung Bình / Bàn (AOV) */}
        <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '20px', border: '1px solid #F0E6E4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#89726B' }}>Giá Trị TB / Bàn (AOV)</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F6ECEA', color: '#56423D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="receipt_long" size={20} />
            </div>
          </div>
          <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.75rem', color: '#1F1B1A' }}>
            {Number(kpi.averageOrderValue || 0).toLocaleString('vi-VN')}₫
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
            <Icon name="trending_up" size={16} />
            <span>{kpi.aovTrend} so với kỳ trước</span>
          </div>
        </div>

        {/* KPI 4: Thời Gian Phục Vụ Trung Bình */}
        <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '20px', border: '1px solid #F0E6E4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#89726B' }}>Thời Gian Phục Vụ TB</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF3C7', color: '#78350F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="schedule" size={20} />
            </div>
          </div>
          <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.75rem', color: '#1F1B1A' }}>
            {kpi.avgServiceDurationMinutes} phút
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
            <span>Nhanh hơn KPI chuẩn (15p)</span>
          </div>
        </div>
      </div>

      {/* Nội dung chi tiết theo từng Tab */}
      {reportType === 'REVENUE' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>
          {/* Cột Trái: Biểu đồ Doanh thu theo Khung Giờ (8 cols) */}
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
                  Cao điểm trưa (11:30 - 13:00) và cao điểm tối (18:00 - 20:30)
                </p>
              </div>

              <span style={{ fontSize: '0.78rem', background: '#FCF1EF', color: '#9D4124', fontWeight: 700, padding: '4px 10px', borderRadius: '8px' }}>
                Giờ Đỉnh: {reportData?.peakHourLabel || '18:00 - 19:30'} ({((reportData?.peakHourRevenue || 14800000) / 1000000).toFixed(1)}M)
              </span>
            </div>

            {/* Danh sách thanh biểu đồ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {hourlyList.map((h, idx) => (
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
                      {Number(h.revenue).toLocaleString('vi-VN')}₫
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#89726B', marginLeft: '6px' }}>
                      ({h.tables} bàn)
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Phân bổ cơ cấu phương thức thanh toán */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed #EAE0DE' }}>
              <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.95rem', color: '#1F1B1A', margin: '0 0 12px' }}>
                Cơ Cấu Phương Thức Thanh Toán
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {paymentMethods.map((pm, idx) => (
                  <div key={idx} style={{ background: '#FFF8F6', padding: '12px', borderRadius: '12px', border: '1px solid #F6ECEA' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#89726B', fontSize: '0.75rem', fontWeight: 600 }}>
                      <span>{pm.label}</span>
                      <span style={{ color: idx === 0 ? '#9D4124' : idx === 1 ? '#059669' : '#78350F', fontWeight: 800 }}>
                        {pm.percentage}%
                      </span>
                    </div>
                    <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#1F1B1A', marginTop: '4px' }}>
                      {Number(pm.totalAmount).toLocaleString('vi-VN')}₫
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cột Phải: Top 5 Món Bán Chạy (4 cols) */}
          <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                <span style={{ fontSize: '0.75rem', color: '#89726B', fontWeight: 600 }}>Top 5</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {bestsellers.map(item => (
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
                        {(Number(item.revenue) / 1000000).toFixed(1)}M
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
      )}

      {/* Tab DISHES: Danh sách chi tiết món ăn và doanh thu */}
      {reportType === 'DISHES' && (
        <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0E6E4' }}>
          <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1F1B1A', margin: '0 0 16px' }}>
            Bảng Xếp Hạng Món Ăn Bán Chạy & Doanh Thu Chi Tiết
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#FCF1EF', borderBottom: '2px solid #EAE0DE' }}>
                <th style={{ padding: '12px', fontWeight: 800, color: '#56423D' }}>Hạng</th>
                <th style={{ padding: '12px', fontWeight: 800, color: '#56423D' }}>Tên Món Ăn</th>
                <th style={{ padding: '12px', fontWeight: 800, color: '#56423D' }}>Danh Mục</th>
                <th style={{ padding: '12px', fontWeight: 800, color: '#56423D', textAlign: 'center' }}>Số Lượng Bán</th>
                <th style={{ padding: '12px', fontWeight: 800, color: '#56423D', textAlign: 'right' }}>Doanh Thu Đem Lại</th>
                <th style={{ padding: '12px', fontWeight: 800, color: '#56423D', textAlign: 'center' }}>Tăng Trưởng</th>
              </tr>
            </thead>
            <tbody>
              {bestsellers.map(dish => (
                <tr key={dish.id} style={{ borderBottom: '1px solid #F0E6E4' }}>
                  <td style={{ padding: '12px', fontWeight: 800, color: '#9D4124' }}>#{dish.rank}</td>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#1F1B1A' }}>{dish.name}</td>
                  <td style={{ padding: '12px', color: '#89726B' }}>{dish.category}</td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 800 }}>{dish.sold}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#9D4124' }}>
                    {Number(dish.revenue).toLocaleString('vi-VN')}₫
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#059669', fontWeight: 700 }}>{dish.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab OPERATIONS: Hiệu suất vận hành bàn */}
      {reportType === 'OPERATIONS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0E6E4' }}>
            <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#1F1B1A', margin: '0 0 16px' }}>
              Hiệu Suất Phục Vụ & Lấp Đầy Bàn
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F6ECEA' }}>
                <span style={{ color: '#56423D', fontWeight: 600 }}>Tỷ lệ lấp đầy bàn cao điểm:</span>
                <span style={{ fontWeight: 800, color: '#059669' }}>92.5%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F6ECEA' }}>
                <span style={{ color: '#56423D', fontWeight: 600 }}>Thời gian trung bình khách ngồi:</span>
                <span style={{ fontWeight: 800, color: '#1F1B1A' }}>58.2 phút</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F6ECEA' }}>
                <span style={{ color: '#56423D', fontWeight: 600 }}>Thời gian dọn bàn sau khi khách rời:</span>
                <span style={{ fontWeight: 800, color: '#059669' }}>3.8 phút</span>
              </div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0E6E4' }}>
            <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#1F1B1A', margin: '0 0 16px' }}>
              Khung Giờ Đỉnh & Tải Trọng
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F6ECEA' }}>
                <span style={{ color: '#56423D', fontWeight: 600 }}>Khung giờ đạt đỉnh tối:</span>
                <span style={{ fontWeight: 800, color: '#9D4124' }}>18:00 - 19:30</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F6ECEA' }}>
                <span style={{ color: '#56423D', fontWeight: 600 }}>Khung giờ đạt đỉnh trưa:</span>
                <span style={{ fontWeight: 800, color: '#9D4124' }}>12:00 - 13:00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F6ECEA' }}>
                <span style={{ color: '#56423D', fontWeight: 600 }}>Tỷ lệ đơn hàng qua mã QR tự phục vụ:</span>
                <span style={{ fontWeight: 800, color: '#059669' }}>88.4%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}