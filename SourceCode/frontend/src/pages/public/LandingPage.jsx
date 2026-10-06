import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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

import RomsLogo from '../../components/common/RomsLogo';

export default function LandingPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const dishes = [
    {
      id: 1,
      category: 'MAIN',
      categoryName: 'Món nước cổ truyền',
      name: 'Phở Bò Wagyu Đặc Biệt',
      desc: 'Nước dùng ninh thảo mộc 18 giờ, bò Wagyu mềm tan và sợi phở tươi tráng thủ công.',
      price: 85000,
      rating: '4.9',
      tag: 'Bestseller',
      tagBg: '#9D4124',
      image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&q=80'
    },
    {
      id: 2,
      category: 'APPETIZER',
      categoryName: 'Khai vị tươi mát',
      name: 'Gỏi Cuốn Tôm Thịt Hoàng Gia',
      desc: 'Tôm sú biển tươi giòn ngọt thịt ăn kèm sốt bơ đậu phộng gia truyền thơm béo ngậy.',
      price: 45000,
      rating: '4.8',
      tag: 'Thanh Đạm',
      tagBg: '#994703',
      image: 'https://images.unsplash.com/photo-1548946526-f69e2424cf45?w=500&q=80'
    },
    {
      id: 3,
      category: 'MAIN',
      categoryName: 'Cơm truyền thống',
      name: 'Cơm Tấm Sườn Mật Ong',
      desc: 'Sườn nướng than hoa ướp mật ong rừng, chả trứng hấp béo ngậy và mỡ hành giòn rụm.',
      price: 65000,
      rating: '5.0',
      tag: 'Đậm Đà',
      tagBg: '#596232',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80'
    },
    {
      id: 4,
      category: 'DRINK',
      categoryName: 'Thức uống bổ dưỡng',
      name: 'Sinh Tố Bơ Đắk Lắk Sáp',
      desc: 'Bơ sáp dẻo quánh xay cùng sữa tươi hữu cơ và dừa sấy giòn bùi tự nhiên không hương liệu.',
      price: 35000,
      rating: '4.9',
      tag: 'Giải Khát',
      tagBg: '#56423D',
      image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&q=80'
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
        background: 'rgba(255, 248, 246, 0.95)',
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
          {/* Brand Logo with Official Stitch Transparent Emblem */}
          <Link to="/" style={{ textDecoration: 'none' }}>
            <RomsLogo size={46} showText={true} textSubtitle="Smart Culinary OS" />
          </Link>

          {/* Nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <a href="#about" style={{ textDecoration: 'none', color: '#56423D', fontSize: '0.9rem', fontWeight: 700, transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#9D4124'} onMouseLeave={e => e.target.style.color = '#56423D'}>Về chúng tôi</a>
            <a href="#menu" style={{ textDecoration: 'none', color: '#56423D', fontSize: '0.9rem', fontWeight: 700, transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#9D4124'} onMouseLeave={e => e.target.style.color = '#56423D'}>Thực đơn tinh hoa</a>
            <a href="#workflow" style={{ textDecoration: 'none', color: '#56423D', fontSize: '0.9rem', fontWeight: 700, transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#9D4124'} onMouseLeave={e => e.target.style.color = '#56423D'}>Quy trình vận hành</a>
          </nav>

          {/* Action Hub */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              to="/dining/welcome?table=01"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '9999px',
                background: '#F0E6E4',
                color: '#1F1B1A',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              <Icon name="qr_code_scanner" size={18} style={{ color: '#9D4124' }} />
              <span>Quét QR Thử</span>
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
              <span>Nhân Viên</span>
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
              <span>Đặt Bàn Ngay</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '70px 24px 90px',
        background: 'linear-gradient(180deg, #FFF8F6 0%, #FCF1EF 60%, #FFF8F6 100%)'
      }}>
        {/* Warm aura glow */}
        <div style={{
          position: 'absolute',
          top: '-120px',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255, 181, 159, 0.25)',
          filter: 'blur(90px)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '40px', alignItems: 'center' }}>
          {/* Left Column (7 cols) */}
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
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9D4124', display: 'inline-block' }} />
              Nền tảng Ẩm thực Thông minh • Smart Dining Solution
            </div>

            <h1 style={{
              fontFamily: "'Epilogue', sans-serif",
              fontWeight: 800,
              fontSize: '3.4rem',
              lineHeight: 1.15,
              color: '#1F1B1A',
              letterSpacing: '-0.02em',
              margin: 0
            }}>
              Trải Nghiệm <span style={{ color: '#9D4124', fontStyle: 'italic' }}>Ẩm Thực Tinh Tế</span> & Vận Hành Đỉnh Cao
            </h1>

            <p style={{ fontSize: '1.15rem', color: '#56423D', lineHeight: 1.6, margin: 0, maxWidth: '600px' }}>
              ROMS kiến tạo trải nghiệm ẩm thực đẳng cấp: từ đặt bàn giữ chỗ trực tuyến thông minh, gọi món quét mã QR tại bàn, đến trạm điều phối bếp KDS chính xác theo từng giây.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '10px', flexWrap: 'wrap' }}>
              <Link
                to="/reservation"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '16px 30px',
                  borderRadius: '9999px',
                  background: '#9D4124',
                  color: '#FFFFFF',
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  boxShadow: '0 8px 24px rgba(157, 65, 36, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon name="table_restaurant" size={22} />
                <span>Đặt Bàn Giữ Chỗ Ngay</span>
              </Link>

              <Link
                to="/waiter/floor-plan"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '15px 26px',
                  borderRadius: '9999px',
                  background: '#FFFFFF',
                  color: '#1F1B1A',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  border: '1px solid #EAE0DE',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
                }}
              >
                <Icon name="badge" size={20} style={{ color: '#9D4124' }} />
                <span>Cổng Nhân Viên (Staff Login)</span>
              </Link>
            </div>

            {/* Quick Metrics Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
              paddingTop: '24px',
              marginTop: '10px',
              borderTop: '1px solid #EAE0DE',
              maxWidth: '520px'
            }}>
              <div>
                <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.75rem', color: '#9D4124' }}>12s</div>
                <div style={{ fontSize: '0.82rem', color: '#56423D' }}>Lên món từ trạm KDS</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.75rem', color: '#9D4124' }}>99.8%</div>
                <div style={{ fontSize: '0.82rem', color: '#56423D' }}>Độ chuẩn xác đơn bếp</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.75rem', color: '#9D4124' }}>4.9 ★</div>
                <div style={{ fontSize: '0.82rem', color: '#56423D' }}>Đánh giá trải nghiệm bàn</div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Live Montage & Preview */}
          <div style={{ gridColumn: 'span 5', position: 'relative' }}>
            <div style={{
              position: 'relative',
              width: '100%',
              height: '460px',
              borderRadius: '28px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.12)'
            }}>
              <img
                src="https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80"
                alt="ROMS Bistro Dining"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(31,27,26,0.7) 0%, transparent 60%)'
              }} />

              <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(8px)',
                  color: '#9D4124',
                  fontWeight: 700,
                  fontSize: '0.78rem'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9D4124' }} />
                  Bếp Trưởng Điều Phối
                </span>
              </div>
            </div>

            {/* Floating Ticket Card with float animation */}
            <div
              className="animate-float"
              style={{
                position: 'absolute',
                bottom: '-25px',
                left: '-20px',
                width: '280px',
                padding: '16px 20px',
                borderRadius: '20px',
                background: '#FFFFFF',
                boxShadow: '0 16px 36px rgba(0,0,0,0.15)',
                border: '1px solid #F0E6E4',
                zIndex: 10
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ padding: '3px 8px', borderRadius: '9999px', background: '#DDE8AB', color: '#181E00', fontSize: '0.72rem', fontWeight: 700 }}>
                  Bàn 08 • Đã xác nhận
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#9D4124' }}>#ROMS-RES</span>
              </div>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 700, fontSize: '0.98rem', color: '#1F1B1A' }}>
                4 Khách • 19:00 Hôm nay
              </div>
              <div style={{ width: '100%', height: '6px', borderRadius: '9999px', background: '#F6ECEA', margin: '8px 0', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: '#9D4124' }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: '#89726B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icon name="event_seat" size={14} />
                Khu vực: Ban công nhìn phố
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5. About Us (Về Chúng Tôi - Đích đến của nút 'Về chúng tôi') */}
      <section id="about" style={{ padding: '80px 24px', background: '#FFFFFF', borderTop: '1px solid #F0E6E4', borderBottom: '1px solid #F0E6E4' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '48px', alignItems: 'center' }}>
          <div style={{ gridColumn: 'span 6' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#9D4124', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
              Câu Chuyện Nhà Hàng
            </span>
            <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '2.4rem', color: '#1F1B1A', margin: '0 0 16px', lineHeight: 1.25 }}>
              Nghệ Thuật Ẩm Thực Đương Đại & Công Nghệ Vận Hành Bàn Thông Minh
            </h2>
            <p style={{ fontSize: '0.98rem', color: '#56423D', lineHeight: 1.6, margin: '0 0 16px' }}>
              Chào mừng bạn đến với <strong>ROMS Restaurant</strong> — nơi giao thoa giữa hương vị truyền thống tinh tế và chuẩn mực công nghệ quản lý ẩm thực hiện đại. Chúng tôi tin rằng mỗi bữa ăn không chỉ là thưởng thức ẩm thực, mà là một hành trình cảm xúc trọn vẹn từ lúc quý khách đặt bàn, quét QR gọi món, cho đến khi đầu bếp hoàn thành từng đĩa thức ăn chuẩn nhiệt độ.
            </p>
            <p style={{ fontSize: '0.92rem', color: '#89726B', lineHeight: 1.6, margin: '0 0 24px' }}>
              Với triết lý <em>"Smart Dining, Seamlessly Managed"</em>, toàn bộ quy trình từ khâu chọn nguyên liệu tươi sống sạch, điều phối hàng đợi KDS bếp, đến bồi bàn phục vụ tại chỗ đều được đồng bộ hóa tức thời trên một nền tảng thống nhất, mang đến dịch vụ hoàn hảo và không gián đoạn.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ background: '#FFF8F6', padding: '16px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
                <Icon name="eco" size={24} style={{ color: '#596232' }} />
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1F1B1A', marginTop: '6px' }}>100% Tươi Sạch</div>
                <div style={{ fontSize: '0.78rem', color: '#89726B', marginTop: '2px' }}>Nông trại hữu cơ cao cấp</div>
              </div>
              <div style={{ background: '#FFF8F6', padding: '16px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
                <Icon name="outdoor_grill" size={24} style={{ color: '#9D4124' }} />
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1F1B1A', marginTop: '6px' }}>Bếp Mở Trình Diễn</div>
                <div style={{ fontSize: '0.78rem', color: '#89726B', marginTop: '2px' }}>Nướng than hoa & Wagyu</div>
              </div>
              <div style={{ background: '#FFF8F6', padding: '16px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
                <Icon name="qr_code_2" size={24} style={{ color: '#994703' }} />
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1F1B1A', marginTop: '6px' }}>Gọi Món Siêu Tốc</div>
                <div style={{ fontSize: '0.78rem', color: '#89726B', marginTop: '2px' }}>QR tại bàn & Đặt trước</div>
              </div>
            </div>
          </div>

          <div style={{ gridColumn: 'span 6', position: 'relative' }}>
            <div style={{ borderRadius: '28px', overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.12)', height: '420px' }}>
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
                alt="Không Gian Nhà Hàng ROMS"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {/* Floating chef badge */}
            <div className="animate-float" style={{
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
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#FFDBC9', color: '#9D4124', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="award_star" size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1F1B1A' }}>Bếp Trưởng Michelin Guide</div>
                <div style={{ fontSize: '0.75rem', color: '#89726B' }}>Hơn 15 năm kinh nghiệm ẩm thực</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Signature Dishes Showcase */}
      <section id="menu" style={{ padding: '80px 24px', maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#9D4124', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
              Hương Vị Nghệ Thuật
            </span>
            <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '2.4rem', color: '#1F1B1A', margin: 0 }}>
              Thực Đơn Tinh Hoa ROMS
            </h2>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', background: '#F0E6E4', padding: '6px', borderRadius: '9999px' }}>
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'MAIN', label: 'Món chính' },
              { id: 'APPETIZER', label: 'Khai vị' },
              { id: 'DRINK', label: 'Đồ uống' }
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          {filteredDishes.map(dish => (
            <div
              key={dish.id}
              className="card-hover-float"
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1px solid #F0E6E4',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer'
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
                  <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#1F1B1A', margin: '4px 0 8px' }}>
                    {dish.name}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#56423D', lineHeight: 1.45, margin: 0 }}>
                    {dish.desc}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #F6ECEA' }}>
                  <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#9D4124' }}>
                    {dish.price.toLocaleString('vi-VN')}₫
                  </span>
                  <Link
                    to="/reservation"
                    style={{
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: '#F0E6E4',
                      color: '#9D4124'
                    }}
                  >
                    <Icon name="add" size={20} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. How ROMS Works (4 Bước Vận Hành Liền Mạch) */}
      <section id="workflow" style={{ background: '#FCF1EF', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 48px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#9D4124', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
              Vận Hành Đồng Bộ
            </span>
            <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '2.4rem', color: '#1F1B1A', margin: '0 0 12px' }}>
              Quy Trình Hoạt Động Liền Mạch
            </h2>
            <p style={{ fontSize: '1rem', color: '#56423D', lineHeight: 1.5, margin: 0 }}>
              Từ giây phút đặt chỗ đến khi từng đĩa thức ăn nghi ngút khói được bưng ra, toàn bộ chu trình chỉ gói gọn trong 4 bước chính xác.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {[
              {
                num: '01',
                title: 'Đặt Bàn Trực Tuyến',
                desc: 'Chọn thời gian, số lượng khách và vị trí ngồi ưng ý với xác nhận giữ chỗ tức thì.'
              },
              {
                num: '02',
                title: 'Quét QR & Gọi Món',
                desc: 'Khách quét mã tại bàn, tùy biến khẩu vị và gửi đơn thẳng vào bếp chỉ với 1 chạm.'
              },
              {
                num: '03',
                title: 'Điều Phối KDS Bếp',
                desc: 'Bếp trưởng theo dõi vé trên màn hình thông minh, phân bổ món theo hàng đợi khoa học.'
              },
              {
                num: '04',
                title: 'Phục Vụ Nóng Hổi',
                desc: 'Nhân viên nhận chuông báo và bưng món chuẩn xác đến từng bàn. Thanh toán đa kênh tức thì.'
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

      {/* 5. Footer */}
      <footer style={{ background: '#F6ECEA', padding: '60px 24px 30px', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '40px', paddingBottom: '40px', borderBottom: '1px solid #EAE0DE' }}>
          <div style={{ gridColumn: 'span 5' }}>
            <div style={{ marginBottom: '14px' }}>
              <RomsLogo size={36} showText={true} textSubtitle="Hospitality Technology" />
            </div>
            <p style={{ fontSize: '0.85rem', color: '#56423D', lineHeight: 1.5, margin: 0, maxWidth: '380px' }}>
              Hệ sinh thái công nghệ quản lý nhà hàng thông minh, kết nối nhà bếp nghệ thuật và trải nghiệm ẩm thực trọn vẹn.
            </p>
          </div>

          <div style={{ gridColumn: 'span 3' }}>
            <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: '#1F1B1A', margin: '0 0 12px' }}>
              Giờ Mở Cửa
            </h4>
            <div style={{ fontSize: '0.85rem', color: '#56423D', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>Thứ Hai - Thứ Sáu: 10:00 - 22:30</div>
              <div>Thứ Bảy - Chủ Nhật: 08:30 - 23:30</div>
              <div style={{ color: '#9D4124', fontWeight: 600, fontSize: '0.78rem', marginTop: '4px' }}>
                Bếp đóng order 30 phút trước
              </div>
            </div>
          </div>

          <div style={{ gridColumn: 'span 4' }}>
            <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: '#1F1B1A', margin: '0 0 12px' }}>
              Liên Hệ & Hỗ Trợ
            </h4>
            <div style={{ fontSize: '0.85rem', color: '#56423D', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>Hotline: <strong>1900 8924</strong></div>
              <div>Email: <strong>service@roms.vn</strong></div>
              <div>Địa chỉ: 128 Nguyễn Du, Quận 1, TP. Hồ Chí Minh</div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1280px', margin: '20px auto 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#89726B', flexWrap: 'wrap', gap: '10px' }}>
          <div>© 2025 ROMS Hospitality Technology. Bảo lưu mọi quyền.</div>
          <div>Crafted with Warm Terracotta & Artisanal Precision</div>
        </div>
      </footer>
    </div>
  );
}
