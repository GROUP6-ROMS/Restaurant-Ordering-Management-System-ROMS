import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import RomsLogo from '../../components/common/RomsLogo';
import { useRestaurantProfile } from '../../utils/restaurantConfig';
import { customerApi } from '../../api/customerApi';
import Icon from '../../components/common/Icon';
import './publicPages.css';

export default function LandingPage() {
  const restaurantProfile = useRestaurantProfile();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tự động đóng mobile drawer khi bấm Escape hoặc khi xoay ngang/phóng to màn hình (>768px)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth > 768) setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Tải danh mục thực đơn thực tế từ CSDL Backend
  useEffect(() => {
    const fetchLiveMenu = async () => {
      try {
        const res = await customerApi.getCustomerMenu();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const menuCatalog = res.data;

          // Trích xuất danh sách danh mục có món ăn thực tế
          const catList = menuCatalog
            .filter(c => c.items && c.items.length > 0)
            .map(c => ({
              id: c.categoryId,
              label: c.categoryName
            }));
          if (catList.length > 0) {
            setCategories(catList);
          }

          // Gom phẳng toàn bộ món ăn đang mở bán (isAvailable !== false)
          const flatDishes = [];
          menuCatalog.forEach(c => {
            if (c.items && Array.isArray(c.items)) {
              c.items.forEach(item => {
                if (item.isAvailable !== false) {
                  // Làm sạch tên món nếu dính hậu tố "(Tạm Hết Hàng)"
                  const cleanName = (item.name || '').replace(/\s*\((?:Tạm Hết Hàng|Tạm Hết)\)/gi, '').trim();

                  // Chuẩn hóa nhãn tag thân thiện, loại bỏ raw tag (86d)
                  let cleanTag = item.tag || 'Bestseller';
                  if (cleanTag.toLowerCase().includes('86d') || cleanTag.toLowerCase().includes('tạm hết')) {
                    cleanTag = 'Tạm Hết Món';
                  }

                  flatDishes.push({
                    id: item.id,
                    categoryId: c.categoryId,
                    categoryName: c.categoryName || 'Món Ngon',
                    name: cleanName,
                    desc: item.description || 'Món ăn tinh hoa chế biến nóng sốt, chuẩn vị và đảm bảo vệ sinh an toàn thực phẩm.',
                    price: Number(item.price) || 0,
                    rating: '5.0',
                    tag: cleanTag,
                    tagBg: cleanTag === 'Tạm Hết Món' ? '#707973' : (cleanTag.toLowerCase().includes('bán chạy') || cleanTag.toLowerCase().includes('bestseller') ? '#9D4124' : '#596232'),
                    image: item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80'
                  });
                }
              });
            }
          });

          if (flatDishes.length > 0) {
            setMenuItems(flatDishes);
          }
        }
      } catch (err) {
        console.warn('Landing Page sử dụng danh mục thực đơn dự phòng:', err.message);
      }
    };
    fetchLiveMenu();
  }, []);

  // Danh mục món ăn dự phòng (fallback) khi CSDL nhà hàng mới khởi tạo chưa có món
  const defaultDishes = [
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
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80'
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

  const activeDishes = menuItems.length > 0 ? menuItems : defaultDishes;

  // 1. Động hóa dữ liệu món ăn trong Thẻ Vé Gọi Món (Hero Order Card) dựa trên menu thực tế của quán
  const heroSampleOrder = React.useMemo(() => {
    const list = activeDishes;
    const mainDish = list.find(d =>
      d.categoryName?.includes('Bò') ||
      d.categoryName?.includes('Chính') ||
      d.categoryName?.includes('Lẩu') ||
      d.category === 'MAIN' ||
      d.price >= 45000
    ) || list[0];

    const drinkDish = list.find(d =>
      (d.categoryName?.includes('Uống') ||
       d.categoryName?.includes('Trà') ||
       d.categoryName?.includes('Cà Phê') ||
       d.category === 'DRINK') &&
      d.id !== mainDish?.id
    ) || list[1] || list[0];

    const item1 = {
      name: mainDish?.name || 'Bò Wagyu A5 Nướng Đá',
      qty: 2,
      price: mainDish?.price || 55000,
      total: (mainDish?.price || 55000) * 2
    };

    const item2 = {
      name: drinkDish?.name || 'Trà Đào Cam Sả Tươi Mát',
      qty: 2,
      price: drinkDish?.price || 28000,
      total: (drinkDish?.price || 28000) * 2
    };

    return {
      tableLabel: 'BÀN T-01',
      zone: 'Sảnh Chính • 4 Khách',
      status: '● Đang Chế Biến KDS',
      items: [item1, item2],
      grandTotal: item1.total + item2.total
    };
  }, [activeDishes]);

  // 2. Tinh tuyển chỉ hiển thị Món Ngon Tiêu Biểu / Được Yêu Thích Nhất (thay vì liệt kê toàn bộ thực đơn)
  const signatureDishes = React.useMemo(() => {
    const list = activeDishes;
    // Lọc các món có tag nổi bật hoặc tiêu biểu
    const featured = list.filter(d => {
      const tagLower = (d.tag || '').toLowerCase();
      return tagLower.includes('bestseller') ||
             tagLower.includes('đặc sản') ||
             tagLower.includes('bán chạy') ||
             tagLower.includes('nổi bật') ||
             tagLower.includes('thanh đạm') ||
             tagLower.includes('đậm đà') ||
             tagLower.includes('tụ họp') ||
             tagLower.includes('giải nhiệt');
    });

    // Nếu số món có tag ít hơn 6, lấy bù thêm từ danh sách để đủ 6-8 món đại diện
    if (featured.length < 6) {
      const remaining = list.filter(d => !featured.some(f => f.id === d.id));
      return [...featured, ...remaining.slice(0, 8 - featured.length)];
    }
    return featured.slice(0, 8); // Tối đa 8 món tiêu biểu nhất
  }, [activeDishes]);

  const filteredDishes = React.useMemo(() => {
    const list = activeDishes;
    if (selectedCategory === 'ALL') {
      return signatureDishes;
    }
    // Khi chọn danh mục cụ thể (vd Khai vị, Món Bò...), hiển thị tối đa 4 món tiêu biểu của danh mục đó
    const categoryDishes = list.filter(d => {
      if (d.categoryId !== undefined) return d.categoryId === selectedCategory;
      return d.category === selectedCategory;
    });
    return categoryDishes.slice(0, 4);
  }, [selectedCategory, activeDishes, signatureDishes]);

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
        <div className="public-header-container">
          {/* Brand Logo with Dynamic Restaurant Name */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RomsLogo size={38} />
            <div>
              <div className="public-header-brand-name">
                {restaurantProfile.brandName || 'ROMS'}
              </div>
              <div className="hide-on-mobile" style={{ fontSize: '0.68rem', fontWeight: 700, color: '#89726B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Hệ Thống Quản Lý Ẩm Thực
              </div>
            </div>
          </Link>

          {/* Navigation Links (Ẩn trên mobile để tối ưu không gian) */}
          <nav className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '26px' }}>
            <a href="#about" style={{ textDecoration: 'none', color: '#56423D', fontSize: '0.9rem', fontWeight: 700, transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#9D4124'} onMouseLeave={e => e.target.style.color = '#56423D'}>Về Chúng Tôi</a>
            <a href="#menu" style={{ textDecoration: 'none', color: '#56423D', fontSize: '0.9rem', fontWeight: 700, transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#9D4124'} onMouseLeave={e => e.target.style.color = '#56423D'}>Thực Đơn Món Ngon</a>
            <a href="#workflow" style={{ textDecoration: 'none', color: '#56423D', fontSize: '0.9rem', fontWeight: 700, transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#9D4124'} onMouseLeave={e => e.target.style.color = '#56423D'}>Quy Trình Vận Hành</a>
          </nav>

          {/* Action Hub */}
          <div className="public-header-actions">
            {/* Nút Đăng nhập Staff - Hiện rõ ở cả Desktop lẫn Mobile Web Dọc (Portrait) */}
            <Link
              to="/login"
              className="public-header-btn-staff"
              title="Đăng nhập ca làm việc nhân viên & quản lý"
            >
              <Icon name="badge" size={17} style={{ color: '#9D4124' }} />
              <span>Staff</span>
            </Link>

            {/* Nút Đặt bàn */}
            <Link
              to="/reservation"
              className="public-header-btn-primary"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                borderRadius: '9999px',
                background: '#9D4124',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: '0 4px 14px rgba(157, 65, 36, 0.3)',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon name="calendar_month" size={17} />
              <span>Đặt Bàn</span>
            </Link>

            {/* Nút Hamburger Menu trên điện thoại */}
            <button
              type="button"
              className="public-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label={mobileMenuOpen ? 'Đóng danh mục' : 'Mở danh mục'}
              aria-expanded={mobileMenuOpen}
              title="Danh mục menu"
            >
              <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* 1.1 Mobile Drawer Navigation Overlay & Drawer */}
      <div
        className={`public-mobile-drawer-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />
      <aside
        className={`public-mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}
        aria-label="Menu điều hướng di động"
        aria-hidden={!mobileMenuOpen}
      >
        {/* Drawer Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #F0E6E4', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RomsLogo size={32} />
            <div>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#9D4124', lineHeight: 1.1 }}>
                {restaurantProfile.brandName || 'ROMS'}
              </div>
              <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#89726B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Ẩm Thực Chuẩn Vị
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Đóng menu"
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#F6ECEA', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#56423D', cursor: 'pointer'
            }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Drawer Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <a
            href="#about"
            className="public-mobile-drawer-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Icon name="info" size={20} style={{ color: '#9D4124' }} />
            <span>Về Chúng Tôi</span>
          </a>
          <a
            href="#menu"
            className="public-mobile-drawer-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Icon name="restaurant_menu" size={20} style={{ color: '#9D4124' }} />
            <span>Thực Đơn Món Ngon</span>
          </a>
          <a
            href="#workflow"
            className="public-mobile-drawer-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Icon name="sync_alt" size={20} style={{ color: '#9D4124' }} />
            <span>Quy Trình Vận Hành</span>
          </a>

          <div style={{ height: '1px', background: '#F0E6E4', margin: '12px 0' }} />

          {/* Action CTAs in Drawer */}
          <Link
            to="/reservation"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px 16px', borderRadius: '9999px',
              background: '#9D4124', color: '#FFFFFF',
              fontWeight: 700, fontSize: '0.9rem',
              textDecoration: 'none', boxShadow: '0 4px 12px rgba(157,65,36,0.25)',
              marginBottom: '8px'
            }}
          >
            <Icon name="calendar_month" size={18} />
            <span>Đặt Bàn Giữ Chỗ</span>
          </Link>

          <Link
            to="/login"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '11px 16px', borderRadius: '9999px',
              background: '#FFFFFF', border: '1.2px solid #FFDBC9',
              color: '#9D4124', fontWeight: 700, fontSize: '0.88rem',
              textDecoration: 'none'
            }}
          >
            <Icon name="badge" size={18} />
            <span>Cổng Nhân Viên Ca Trực</span>
          </Link>
        </nav>

        {/* Drawer Footer Info */}
        <div style={{ paddingTop: '16px', borderTop: '1px solid #F0E6E4', fontSize: '0.78rem', color: '#89726B', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="call" size={15} style={{ color: '#9D4124' }} />
            <span>Hotline: {restaurantProfile.phone || '0901.234.567'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="schedule" size={15} style={{ color: '#596232' }} />
            <span>Giờ mở cửa: {restaurantProfile.openingHours || '07:00 - 22:00'}</span>
          </div>
        </div>
      </aside>

      {/* 2. Hero Section */}
      <section className="public-hero-section">
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

        <div className="public-hero-grid">

          {/* Left Column (7 cols on desktop, 1 col on mobile): Heading & Quick Actions */}
          <div className="public-hero-left">
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

            <h1 className="public-hero-title">
              Vận Hành Thông Minh • <span style={{ color: '#9D4124', fontStyle: 'italic' }}>Món Ngon Chuẩn Vị</span> Mọi Mô Hình
            </h1>

            <p style={{ fontSize: '1.05rem', color: '#56423D', lineHeight: 1.6, margin: 0, maxWidth: '620px' }}>
              {restaurantProfile.tagline || 'Phục vụ tận tâm • Món ngon chuẩn vị • Vận hành thông minh'} — Trải nghiệm gọi món không chạm QR tại bàn, điều phối trạm Bếp KDS thời gian thực, quản lý sơ đồ bàn trực quan và thanh toán hóa đơn siêu tốc.
            </p>

            <div className="public-hero-cta-group" style={{ paddingTop: '8px' }}>
              <Link
                to="/reservation"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 26px',
                  borderRadius: '9999px',
                  background: '#9D4124',
                  color: '#FFFFFF',
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.98rem',
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
              gap: '16px',
              paddingTop: '20px',
              marginTop: '8px',
              borderTop: '1px solid #EAE0DE',
              maxWidth: '540px',
              width: '100%'
            }}>
              <div>
                <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#9D4124' }}>100%</div>
                <div style={{ fontSize: '0.78rem', color: '#56423D' }}>Đồng bộ bàn ăn & Bếp KDS</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#9D4124' }}>VietQR</div>
                <div style={{ fontSize: '0.78rem', color: '#56423D' }}>Thanh toán quét mã tức thì</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#9D4124' }}>4.9 ★</div>
                <div style={{ fontSize: '0.78rem', color: '#56423D' }}>Sự hài lòng của thực khách</div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols on desktop, 1 col on mobile): Real-world Live Terminal Showcase */}
          <div className="public-hero-right">

            {/* Background Atmosphere Image */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '420px',
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
            <div className="public-hero-order-card">
              {/* Table header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ padding: '3px 9px', borderRadius: '8px', background: '#9D4124', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800 }}>
                    {heroSampleOrder.tableLabel}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A' }}>
                    {heroSampleOrder.zone}
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#596232', background: '#EFF2E5', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                  {heroSampleOrder.status}
                </span>
              </div>

              {/* Realistic dishes inside the active ticket (Đồng bộ món ăn & giá thực tế) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', borderTop: '1px dashed #EAE0DE', paddingTop: '8px' }}>
                {heroSampleOrder.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '210px' }}>
                      {it.qty}x {it.name}
                    </span>
                    <span style={{ fontWeight: 700, color: '#9D4124', flexShrink: 0, marginLeft: '8px' }}>
                      {it.total.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                ))}
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
                    {heroSampleOrder.grandTotal.toLocaleString('vi-VN')}₫
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
      <section id="about" className="public-about-section">
        <div className="public-about-grid">

          {/* Left Text */}
          <div className="public-about-col">
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#9D4124', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
              Tâm Huyết Phục Vụ
            </span>
            <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem, 3.5vw, 2.3rem)', color: '#1F1B1A', margin: '0 0 16px', lineHeight: 1.25 }}>
              Hương Vị Chuẩn Gu & Trải Nghiệm Ẩm Thực Tận Tâm
            </h2>
            <p style={{ fontSize: '0.98rem', color: '#56423D', lineHeight: 1.6, margin: '0 0 16px' }}>
              Chào mừng quý khách đến với <strong>{(restaurantProfile.brandName || 'Hệ Thống Ẩm Thực ROMS').trim()}</strong>. Chúng tôi mang đến những bữa ăn ngon lành, nóng hổi với hương vị đặc trưng, giá cả phải chăng, thích hợp cho bữa trưa nhanh nhẹn, buổi họp mặt bạn bè hay bữa cơm sum vầy gia đình.
            </p>
            <p style={{ fontSize: '0.92rem', color: '#89726B', lineHeight: 1.6, margin: '0 0 24px' }}>
              Mỗi đĩa món dọn lên bàn đều trải qua quy trình chế biến khắt khe: tuyển chọn nguồn thực phẩm tươi sạch mỗi ngày, nêm nếm đậm đà vừa miệng và được theo dõi chính xác qua hệ thống màn hình bếp KDS để phục vụ nhanh nhất, không để thực khách phải chờ đợi lâu.
            </p>

            <div className="public-about-badges">
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
          <div className="public-about-col" style={{ position: 'relative' }}>
            <div style={{ borderRadius: '28px', overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.12)', height: '360px' }}>
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
                alt="Không Gian Ẩm Thực Ấm Cúng"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Quality Commitment Badge */}
            <div style={{
              position: 'absolute',
              bottom: '-16px',
              right: '8px',
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '14px 18px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
              border: '1px solid #F0E6E4',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              zIndex: 10
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EFF2E5', color: '#596232', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="verified_user" size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1F1B1A' }}>Cam Kết Chuẩn Vị & Sạch</div>
                <div style={{ fontSize: '0.74rem', color: '#89726B' }}>Nấu từ tâm • Phục vụ chu đáo mọi thực khách</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Signature Dishes Showcase */}
      <section id="menu" className="public-menu-section">
        <div className="public-menu-header">
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#9D4124', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
              Thực Đơn Đa Dạng
            </span>
            <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem, 3.5vw, 2.3rem)', color: '#1F1B1A', margin: 0 }}>
              Món Ngon Được Yêu Thích Nhất
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="public-menu-categories-bar" style={{ background: '#F0E6E4', padding: '6px 10px', borderRadius: '9999px', maxWidth: '100%', boxSizing: 'border-box' }}>
            {(categories.length > 0
              ? [{ id: 'ALL', label: 'Tất cả món' }, ...categories]
              : [
                  { id: 'ALL', label: 'Tất cả món' },
                  { id: 'MAIN', label: 'Món chính & Lẩu' },
                  { id: 'APPETIZER', label: 'Khai vị' },
                  { id: 'DRINK', label: 'Đồ uống & Cà phê' }
                ]
            ).map(tab => (
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
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dishes Grid */}
        <div className="public-dish-grid">
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
                <img
                  src={dish.image}
                  alt={dish.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80';
                  }}
                />
                <span style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  background: dish.tag === 'Tạm Hết Món' ? '#707973' : dish.tagBg,
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
                    to="/reservation"
                    title="Đặt bàn giữ chỗ thưởng thức món"
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
                      fontSize: '0.78rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon name="table_restaurant" size={16} />
                    <span>Đặt bàn</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Banner CTA dẫn tới Đặt bàn & Khám phá đầy đủ thực đơn */}
        <div style={{
          marginTop: '36px',
          textAlign: 'center',
          background: '#FFFFFF',
          border: '1px solid #F0E6E4',
          borderRadius: '24px',
          padding: '24px 20px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#1F1B1A', marginBottom: '6px' }}>
            Khám Phá Toàn Bộ Thực Đơn {restaurantProfile.brandName || 'Nhà Hàng'}
          </div>
          <p style={{ fontSize: '0.88rem', color: '#89726B', margin: '0 auto 16px', maxWidth: '560px', lineHeight: 1.5 }}>
            Đây là danh sách các món ăn tiêu biểu được yêu thích nhất. Nhà hàng còn nhiều món ngon chuẩn vị khác đang chờ đón quý khách. Hãy đặt bàn ngay để thưởng thức trọn vẹn!
          </p>
          <Link
            to="/reservation"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '9999px',
              background: '#9D4124',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.9rem',
              boxShadow: '0 4px 14px rgba(157,65,36,0.3)'
            }}
          >
            <Icon name="calendar_month" size={18} />
            <span>Đặt Bàn Giữ Chỗ & Xem Đầy Đủ Thực Đơn</span>
          </Link>
        </div>
      </section>

      {/* 5. How ROMS Works (4 Bước Vận Hành Liền Mạch) */}
      <section id="workflow" className="public-workflow-section">
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 40px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#9D4124', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
              Vận Hành Đồng Bộ
            </span>
            <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem, 3.5vw, 2.3rem)', color: '#1F1B1A', margin: '0 0 12px' }}>
              Quy Trình 4 Bước Đơn Giản & Tối Ưu
            </h2>
            <p style={{ fontSize: '0.98rem', color: '#56423D', lineHeight: 1.5, margin: 0 }}>
              Tiết kiệm thời gian chờ đợi, nâng cao năng suất phục vụ và giảm thiểu sai sót đơn món tuyệt đối.
            </p>
          </div>

          <div className="public-steps-grid">
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
      <footer className="public-footer-section">
        <div className="public-footer-grid">

          {/* Cột 1: Thông tin thương hiệu */}
          <div className="public-footer-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <RomsLogo size={40} />
              <div>
                <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#9D4124' }}>
                  {restaurantProfile.brandName || 'ROMS'}
                </div>
                {restaurantProfile.name && (restaurantProfile.brandName || '').toLowerCase().trim() !== restaurantProfile.name.toLowerCase().trim() && (
                  <div style={{ fontSize: '0.72rem', color: '#89726B', fontWeight: 600 }}>
                    {restaurantProfile.name}
                  </div>
                )}
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#56423D', lineHeight: 1.5, margin: 0 }}>
              {restaurantProfile.tagline || 'Phục vụ tận tâm • Món ngon chuẩn vị • Vận hành thông minh'}
            </p>
          </div>

          {/* Cột 2: Địa chỉ & Hotline liên hệ */}
          <div className="public-footer-col">
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
              {restaurantProfile.taxCode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="receipt_long" size={18} style={{ color: '#9D4124', flexShrink: 0 }} />
                  <span>Mã số thuế: <strong>{restaurantProfile.taxCode}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Cột 3: Giờ Phục Vụ & Mạng WiFi Quán */}
          <div className="public-footer-col">
            <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.98rem', color: '#1F1B1A', margin: '0 0 14px' }}>
              Giờ Phục Vụ & Mạng WiFi
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.85rem', color: '#56423D', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Mở cửa: <strong>{restaurantProfile.openingHours || '07:00 - 22:00'}</strong> (Tất cả các ngày)</div>
                <div style={{ fontSize: '0.76rem', color: '#89726B' }}>Nhận đặt bàn & gọi món đến 21:30</div>
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
          <div>© {new Date().getFullYear()} {restaurantProfile.brandName || restaurantProfile.name || 'ROMS'}. Vận hành trên nền tảng ROMS Hospitality.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Phục vụ {restaurantProfile.openingHours || '07:00 - 22:00'} hàng ngày</span>
            <span>•</span>
            <Link to="/login" style={{ color: '#9D4124', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Icon name="badge" size={15} />
              <span>Đăng nhập ca trực (Staff Portal)</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
