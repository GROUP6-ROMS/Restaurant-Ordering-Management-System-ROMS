import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import RomsLogo from '../../components/common/RomsLogo';
import { useRestaurantProfile } from '../../utils/restaurantConfig';

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

export default function LandingPage() {
  const restaurantProfile = useRestaurantProfile();
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Danh mục món ăn thực tế phong phú, phù hợp đa dạng mô hình ẩm thực (bình dân, lẩu nướng, cafe, nhà hàng)
  const dishes = [
    {
      id: 1,
      category: 'MAIN',
      categoryName: 'Món Nước Truyền Thống',
      name: 'Phở Bò Tái Nạm Đặc Biệt',
      desc: 'Nước dùng ninh xương thảo mộc thanh ngọt tự nhiên, thịt bò mềm thơm cùng bánh phở tươi tráng thủ công.',
      price: 55000,
      rating: '4.9',
      tag: 'Bestseller',
      tagBg: '#9D4124',
      image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&q=80'
    },
    {
      id: 2,
      category: 'APPETIZER',
      categoryName: 'Khai Vị Thanh Mát',
      name: 'Gỏi Cuốn Tôm Thịt Đặc Biệt',
      desc: 'Tôm sú tươi giòn, thịt luộc thái mỏng, rau sống organic cuộn bánh tráng dẻo ăn kèm sốt tương đậu phộng béo bùi.',
      price: 35000,
      rating: '4.8',
      tag: 'Thanh Đạm',
      tagBg: '#596232',
      image: 'https://images.unsplash.com/photo-1548946526-f69e2424cf45?w=600&q=80'
    },
    {
      id: 3,
      category: 'MAIN',
      categoryName: 'Cơm Truyền Thống',
      name: 'Cơm Tấm Sườn Bì Chả Nướng Than',
      desc: 'Sườn cốt lết ướp sả mật ong nướng than hoa vàng óng thơm lừng, chả trứng hấp béo ngậy và mỡ hành giòn rụm.',
      price: 50000,
      rating: '5.0',
      tag: 'Đậm Đà',
      tagBg: '#9D4124',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80'
    },
    {
      id: 4,
      category: 'MAIN',
      categoryName: 'Lẩu & Nướng Tụ Họp',
      name: 'Lẩu Thái Hải Sản Chua Cay',
      desc: 'Nước lẩu Thái thơm nồng lá chanh sả ớt, tôm mực tươi rói kèm nấm kim châm và rau củ tươi nhúng lẩu.',
      price: 165000,
      rating: '4.9',
      tag: 'Tụ Họp',
      tagBg: '#BA1A1A',
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80'
    },
    {
      id: 5,
      category: 'DRINK',
      categoryName: 'Cà Phê & Trà Sữa',
      name: 'Cà Phê Muối Kem Sữa Béo',
      desc: 'Cà phê phin nguyên chất thơm đượm hòa quyện lớp kem sữa muối mặn mòi, ngọt béo cân bằng độc đáo.',
      price: 29000,
      rating: '4.9',
      tag: 'Đặc Sản',
      tagBg: '#7D5260',
      image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&q=80'
    },
    {
      id: 6,
      category: 'DRINK',
      categoryName: 'Giải Khát Tươi Mát',
      name: 'Trà Đào Cam Sả Tươi Mát',
      desc: 'Trà đen ủ lạnh chiết xuất hương hoa quả tươi, ngâm sả đập dập, lát cam vàng mọng nước và đào giòn ngọt.',
      price: 28000,
      rating: '4.8',
      tag: 'Giải Nhiệt',
      tagBg: '#994703',
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80'
    }
  ];

  const filteredDishes = dishes.filter(d => {
    if (selectedCategory === 'ALL') return true;
    return d.category === selectedCategory;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F6', color: '#1F1B1A', display: 'flex', flexDirection: 'column' }}>

      {/* 1. Header Navigation Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 248, 246, 0.96)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #F0E6E4',
        boxShadow: '0 1px 8px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          height: '76px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          {/* Brand Logo with Dynamic Restaurant Name */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <RomsLogo size={44} />
            <div>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#9D4124', lineHeight: 1.1 }}>
                {restaurantProfile.brandName || 'ROMS'}
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#89726B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Hệ Thống Quản Lý Ẩm Thực
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '26px' }}>
            <a href="#about" style={{ textDecoration: 'none', color: '#56423D', fontSize: '0.9rem', fontWeight: 700, transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#9D4124'} onMouseLeave={e => e.target.style.color = '#56423D'}>Về Chúng Tôi</a>
            <a href="#menu" style={{ textDecoration: 'none', color: '#56423D', fontSize: '0.9rem', fontWeight: 700, transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#9D4124'} onMouseLeave={e => e.target.style.color = '#56423D'}>Thực Đơn Món Ngon</a>
            <a href="#workflow" style={{ textDecoration: 'none', color: '#56423D', fontSize: '0.9rem', fontWeight: 700, transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#9D4124'} onMouseLeave={e => e.target.style.color = '#56423D'}>Quy Trình Vận Hành</a>
          </nav>

          {/* Action Hub */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              to="/dining/welcome?table=01"
              title="Mô phỏng trải nghiệm thực khách quét QR gọi món tại bàn"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '9999px',
                background: '#FCF1EF',
                border: '1px solid #FFDBC9',
                color: '#9D4124',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              <Icon name="qr_code_scanner" size={18} style={{ color: '#9D4124' }} />
              <span>Quét QR</span>
            </Link>

            <Link
              to="/login"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '9999px',
                background: '#FFFFFF',
                border: '1px solid #EAE0DE',
                color: '#56423D',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              <Icon name="badge" size={18} style={{ color: '#9D4124' }} />
              <span>Login (Staff)</span>
            </Link>

            <Link
              to="/reservation"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 20px',
                borderRadius: '9999px',
                background: '#9D4124',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.88rem',
                boxShadow: '0 4px 14px rgba(157, 65, 36, 0.3)'
              }}
            >
              <Icon name="calendar_month" size={18} />
              <span>Đặt Bàn Trước</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '65px 24px 85px',
        background: 'linear-gradient(180deg, #FFF8F6 0%, #FCF1EF 55%, #FFF8F6 100%)'
      }}>
        {/* Soft background aura glow */}
        <div style={{
          position: 'absolute',
          top: '-120px',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255, 181, 159, 0.22)',
          filter: 'blur(90px)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '40px', alignItems: 'center' }}>

          {/* Left Column (7 cols): Heading & Quick Actions */}
          <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FFFFFF',
              border: '1px solid #F0E6E4',
              padding: '6px 16px',
              borderRadius: '9999px',
              color: '#9D4124',
              fontWeight: 700,
              fontSize: '0.85rem',
              width: 'fit-content',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#596232', display: 'inline-block' }} />
              <span>{restaurantProfile.name || 'HỆ THỐNG NHÀ HÀNG & QUÁN ĂN ROMS'}</span>
            </div>

            <h1 style={{
              fontFamily: "'Epilogue', sans-serif",
              fontWeight: 800,
              fontSize: '3.2rem',
              lineHeight: 1.15,
              color: '#1F1B1A',
              letterSpacing: '-0.02em',
              margin: 0
            }}>
              Vận Hành Thông Minh • <span style={{ color: '#9D4124', fontStyle: 'italic' }}>Món Ngon Chuẩn Vị</span> Mọi Mô Hình
            </h1>

            <p style={{ fontSize: '1.1rem', color: '#56423D', lineHeight: 1.6, margin: 0, maxWidth: '620px' }}>
              {restaurantProfile.tagline || 'Phục vụ tận tâm • Món ngon chuẩn vị • Vận hành thông minh'} — Trải nghiệm gọi món không chạm QR tại bàn, điều phối trạm Bếp KDS thời gian thực, quản lý sơ đồ bàn trực quan và thanh toán hóa đơn siêu tốc.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '8px', flexWrap: 'wrap' }}>
              <Link
                to="/reservation"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '15px 28px',
                  borderRadius: '9999px',
                  background: '#9D4124',
                  color: '#FFFFFF',
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 800,
                  fontSize: '1rem',
                  boxShadow: '0 8px 24px rgba(157, 65, 36, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon name="table_restaurant" size={22} />
                <span>Đặt Bàn Giữ Chỗ Ngay</span>
              </Link>
            </div>

            {/* Quick Metrics Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
              paddingTop: '22px',
              marginTop: '10px',
              borderTop: '1px solid #EAE0DE',
              maxWidth: '540px'
            }}>
              <div>
                <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.65rem', color: '#9D4124' }}>100%</div>
                <div style={{ fontSize: '0.8rem', color: '#56423D' }}>Đồng bộ bàn ăn & Bếp KDS</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.65rem', color: '#9D4124' }}>VietQR</div>
                <div style={{ fontSize: '0.8rem', color: '#56423D' }}>Thanh toán quét mã tức thì</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.65rem', color: '#9D4124' }}>4.9 ★</div>
                <div style={{ fontSize: '0.8rem', color: '#56423D' }}>Sự hài lòng của thực khách</div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Real-world Live Terminal Showcase (Thực tế mô hình bàn ăn ROMS) */}
          <div style={{ gridColumn: 'span 5', position: 'relative' }}>

            {/* Background Atmosphere Image */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '470px',
              borderRadius: '28px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.14)',
              border: '2px solid #FFFFFF'
            }}>
              <img
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"
                alt="Không Gian Bàn Ăn ROMS"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(31,27,26,0.85) 0%, rgba(31,27,26,0.2) 60%, transparent 100%)'
              }} />

              {/* Status Header Pill */}
              <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(8px)',
                  color: '#596232',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#596232' }} />
                  Bàn Đang Phục Vụ • Live WebSocket
                </span>
              </div>
            </div>

            {/* Real-time Order Card (Mô phỏng chính xác đơn gọi món thực tế của ROMS) */}
            <div
              style={{
                position: 'absolute',
                bottom: '-24px',
                left: '-16px',
                right: '16px',
                padding: '16px 18px',
                borderRadius: '20px',
                background: '#FFFFFF',
                boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
                border: '1px solid #F0E6E4',
                zIndex: 10
              }}
            >
              {/* Table header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ padding: '3px 9px', borderRadius: '8px', background: '#9D4124', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800 }}>
                    BÀN T-03
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A' }}>
                    Sảnh Chính • 4 Khách
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#596232', background: '#EFF2E5', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                  ● Đang Chế Biến KDS
                </span>
              </div>

              {/* Realistic dishes inside the active ticket */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', borderTop: '1px dashed #EAE0DE', paddingTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#1F1B1A' }}>2x Phở Bò Tái Nạm (Bếp nóng)</span>
                  <span style={{ fontWeight: 700, color: '#9D4124' }}>110.000₫</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#1F1B1A' }}>2x Trà Đào Cam Sả Tươi Mát</span>
                  <span style={{ fontWeight: 700, color: '#9D4124' }}>56.000₫</span>
                </div>
              </div>

              {/* Total & Quick Pay Strip */}
              <div style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid #F6ECEA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#89726B', display: 'block' }}>Tổng cộng (VAT & Phí DV):</span>
                  <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#9D4124' }}>
                    166.000₫
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FCF1EF', padding: '4px 10px', borderRadius: '8px', fontSize: '0.72rem', color: '#9D4124', fontWeight: 700 }}>
                  <Icon name="qr_code_2" size={16} />
                  <span>VietQR Sẵn Sàng</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. About Us (Về Chúng Tôi - Thực tế, gần gũi, chuẩn ATTP & tận tâm) */}
      <section id="about" style={{ padding: '80px 24px', background: '#FFFFFF', borderTop: '1px solid #F0E6E4', borderBottom: '1px solid #F0E6E4' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '48px', alignItems: 'center' }}>

          {/* Left Text */}
          <div style={{ gridColumn: 'span 6' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#9D4124', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
              Tâm Huyết Phục Vụ
            </span>
            <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '2.3rem', color: '#1F1B1A', margin: '0 0 16px', lineHeight: 1.25 }}>
              Hương Vị Chuẩn Gu & Trải Nghiệm Ẩm Thực Tận Tâm
            </h2>
            <p style={{ fontSize: '0.98rem', color: '#56423D', lineHeight: 1.6, margin: '0 0 16px' }}>
              Chào mừng quý khách đến với <strong>{restaurantProfile.brandName || 'Hệ Thống Ẩm Thực ROMS'}</strong>. Chúng tôi mang đến những bữa ăn ngon lành, nóng hổi với hương vị đặc trưng, giá cả phải chăng, thích hợp cho bữa trưa nhanh nhẹn, buổi họp mặt bạn bè hay bữa cơm sum vầy gia đình.
            </p>
            <p style={{ fontSize: '0.92rem', color: '#89726B', lineHeight: 1.6, margin: '0 0 24px' }}>
              Mỗi đĩa món dọn lên bàn đều trải qua quy trình chế biến khắt khe: tuyển chọn nguồn thực phẩm tươi sạch mỗi ngày, nêm nếm đậm đà vừa miệng và được theo dõi chính xác qua hệ thống màn hình bếp KDS để phục vụ nhanh nhất, không để thực khách phải chờ đợi lâu.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ background: '#FFF8F6', padding: '16px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
                <Icon name="verified" size={24} style={{ color: '#596232' }} />
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1F1B1A', marginTop: '6px' }}>Tươi Sạch 100%</div>
                <div style={{ fontSize: '0.76rem', color: '#89726B', marginTop: '2px' }}>Nhập mới trong ngày</div>
              </div>
              <div style={{ background: '#FFF8F6', padding: '16px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
                <Icon name="health_and_safety" size={24} style={{ color: '#9D4124' }} />
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1F1B1A', marginTop: '6px' }}>Chuẩn Vệ Sinh ATTP</div>
                <div style={{ fontSize: '0.76rem', color: '#89726B', marginTop: '2px' }}>Bếp sạch & an tâm</div>
              </div>
              <div style={{ background: '#FFF8F6', padding: '16px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
                <Icon name="timer" size={24} style={{ color: '#994703' }} />
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1F1B1A', marginTop: '6px' }}>Lên Món Nhanh Chóng</div>
                <div style={{ fontSize: '0.76rem', color: '#89726B', marginTop: '2px' }}>Không để khách chờ</div>
              </div>
            </div>
          </div>

          {/* Right Image with Realistic ATTP Quality Badge */}
          <div style={{ gridColumn: 'span 6', position: 'relative' }}>
            <div style={{ borderRadius: '28px', overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.12)', height: '420px' }}>
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
                alt="Không Gian Ẩm Thực Ấm Cúng"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Quality Commitment Badge (Thay thế hoàn toàn mác Michelin Guide bị lố) */}
            <div style={{
              position: 'absolute',
              bottom: '-20px',
              right: '-10px',
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '16px 20px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
              border: '1px solid #F0E6E4',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              zIndex: 10
            }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EFF2E5', color: '#596232', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="verified_user" size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1F1B1A' }}>Cam Kết Chuẩn Vị & Sạch</div>
                <div style={{ fontSize: '0.75rem', color: '#89726B' }}>Nấu từ tâm • Phục vụ chu đáo mọi thực khách</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Signature Dishes Showcase */}
      <section id="menu" style={{ padding: '80px 24px', maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#9D4124', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
              Thực Đơn Đa Dạng
            </span>
            <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '2.3rem', color: '#1F1B1A', margin: 0 }}>
              Món Ngon Được Yêu Thích Nhất
            </h2>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', background: '#F0E6E4', padding: '6px', borderRadius: '9999px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'Tất cả món' },
              { id: 'MAIN', label: 'Món chính & Lẩu' },
              { id: 'APPETIZER', label: 'Khai vị' },
              { id: 'DRINK', label: 'Đồ uống & Cà phê' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: selectedCategory === tab.id ? '#9D4124' : 'transparent',
                  color: selectedCategory === tab.id ? '#FFFFFF' : '#56423D',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dishes Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {filteredDishes.map(dish => (
            <div
              key={dish.id}
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1px solid #F0E6E4',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <div style={{ position: 'relative', height: '210px', width: '100%', overflow: 'hidden' }}>
                <img src={dish.image} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  background: dish.tagBg,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.72rem'
                }}>
                  {dish.tag}
                </span>
              </div>

              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#596232', textTransform: 'uppercase' }}>
                      {dish.categoryName}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#994703' }}>
                      ★ {dish.rating}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#1F1B1A', margin: '4px 0 8px' }}>
                    {dish.name}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#56423D', lineHeight: 1.45, margin: 0 }}>
                    {dish.desc}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #F6ECEA' }}>
                  <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#9D4124' }}>
                    {dish.price.toLocaleString('vi-VN')}₫
                  </span>
                  <Link
                    to="/dining/welcome?table=01"
                    title="Gọi món này tại bàn"
                    style={{
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      background: '#FCF1EF',
                      color: '#9D4124',
                      fontWeight: 700,
                      fontSize: '0.78rem'
                    }}
                  >
                    <Icon name="add" size={16} />
                    <span>Xem món</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. How ROMS Works (4 Bước Vận Hành Liền Mạch) */}
      <section id="workflow" style={{ background: '#FCF1EF', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 48px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#9D4124', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
              Vận Hành Đồng Bộ
            </span>
            <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '2.3rem', color: '#1F1B1A', margin: '0 0 12px' }}>
              Quy Trình 4 Bước Đơn Giản & Tối Ưu
            </h2>
            <p style={{ fontSize: '0.98rem', color: '#56423D', lineHeight: 1.5, margin: 0 }}>
              Tiết kiệm thời gian chờ đợi, nâng cao năng suất phục vụ và giảm thiểu sai sót đơn món tuyệt đối.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {[
              {
                num: '01',
                title: 'Đặt Bàn Trực Tuyến',
                desc: 'Chọn giờ, số lượng khách và vị trí ngồi mong muốn với thông báo xác nhận tức thời.'
              },
              {
                num: '02',
                title: 'Quét QR & Gọi Món',
                desc: 'Khách ngồi tại bàn mở camera quét mã QR, xem ảnh món trực quan và gửi đơn không cần vẫy tay gọi nhân viên.'
              },
              {
                num: '03',
                title: 'Bếp KDS Tiếp Nhận Tức Thì',
                desc: 'Vé gọi món xuất hiện ngay trên màn hình Bếp/Bar KDS, tự động sắp xếp theo thứ tự đặt món.'
              },
              {
                num: '04',
                title: 'Bưng Món & Thanh Toán VietQR',
                desc: 'Nhân viên phục vụ món nóng hổi tận bàn. Khách quét mã VietQR tự động hoặc thanh toán tiền mặt tại quầy POS.'
              }
            ].map(step => (
              <div
                key={step.num}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '24px',
                  border: '1px solid #F0E6E4',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: '#FFDBC9',
                  color: '#9D4124',
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {step.num}
                </div>
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 700, fontSize: '1.15rem', color: '#1F1B1A', margin: 0 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#56423D', lineHeight: 1.5, margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Footer (Đồng bộ hoàn toàn với Cấu Hình Thương Hiệu & Thông Tin Quán) */}
      <footer style={{ background: '#F6ECEA', padding: '60px 24px 30px', marginTop: 'auto', borderTop: '1px solid #EAE0DE' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '40px', paddingBottom: '40px', borderBottom: '1px solid #EAE0DE' }}>

          {/* Cột 1: Thông tin thương hiệu */}
          <div style={{ gridColumn: 'span 4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <RomsLogo size={40} />
              <div>
                <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#9D4124' }}>
                  {restaurantProfile.brandName || 'ROMS'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#89726B', fontWeight: 600 }}>
                  {restaurantProfile.name}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#56423D', lineHeight: 1.5, margin: 0 }}>
              {restaurantProfile.tagline || 'Phục vụ tận tâm • Món ngon chuẩn vị • Vận hành thông minh'}
            </p>
          </div>

          {/* Cột 2: Địa chỉ & Hotline liên hệ */}
          <div style={{ gridColumn: 'span 4' }}>
            <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.98rem', color: '#1F1B1A', margin: '0 0 14px' }}>
              Địa Chỉ & Liên Hệ Quán
            </h4>
            <div style={{ fontSize: '0.85rem', color: '#56423D', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Icon name="location_on" size={18} style={{ color: '#9D4124', flexShrink: 0, marginTop: '2px' }} />
                <span>{restaurantProfile.address || 'Số 123 Đường Ẩm Thực, Quận 1, TP. Hồ Chí Minh'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="call" size={18} style={{ color: '#9D4124', flexShrink: 0 }} />
                <span>Hotline: <strong>{restaurantProfile.phone || '0901.234.567'}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="receipt_long" size={18} style={{ color: '#9D4124', flexShrink: 0 }} />
                <span>Mã số thuế: <strong>{restaurantProfile.taxCode || '0318999999'}</strong></span>
              </div>
            </div>
          </div>

          {/* Cột 3: Giờ Phục Vụ & Mạng WiFi Quán */}
          <div style={{ gridColumn: 'span 4' }}>
            <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.98rem', color: '#1F1B1A', margin: '0 0 14px' }}>
              Giờ Phục Vụ & Mạng WiFi
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.85rem', color: '#56423D', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Mở cửa: <strong>08:00 - 23:00</strong> (Tất cả các ngày)</div>
                <div style={{ fontSize: '0.76rem', color: '#89726B' }}>Bếp nhận đơn đến 22:30</div>
              </div>

              {/* WiFi card */}
              <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '12px', border: '1px solid #EAE0DE', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1F1B1A', marginBottom: '4px' }}>
                  <Icon name="wifi" size={18} style={{ color: '#596232' }} />
                  <span>WiFi Quán: <strong>{restaurantProfile.wifiName || 'ROMS-GUEST'}</strong></span>
                </div>
                <div style={{ color: '#89726B', fontSize: '0.75rem' }}>
                  Mật khẩu: <code style={{ fontFamily: 'monospace', background: '#FCF1EF', padding: '1px 5px', borderRadius: '4px', color: '#9D4124', fontWeight: 700 }}>{restaurantProfile.wifiPassword || 'roms-welcome'}</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div style={{ maxWidth: '1280px', margin: '20px auto 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#89726B', flexWrap: 'wrap', gap: '10px' }}>
          <div>© {new Date().getFullYear()} {restaurantProfile.name}. Vận hành trên nền tảng ROMS Hospitality.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Phục vụ từ 08:00 - 23:00 hàng ngày</span>
            <span>•</span>
            <span>Bảo lưu mọi quyền</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
