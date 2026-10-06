import React, { useState } from 'react';
import { MOCK_MENU_ITEMS, MOCK_CATEGORIES } from '../../mock/mockData';

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

// Initial full items with cost price and selling price (No Recipe BOM)
const INITIAL_MANAGEMENT_ITEMS = [
  {
    id: 1,
    sku: 'DISH-001',
    name: 'Phở Bò Đặc Biệt Wagyu',
    categoryId: 2,
    categoryName: 'Món Chính & Đặc Sản',
    station: 'Bếp',
    price: 85000,
    costPrice: 32000,
    isAvailable: true,
    tag: 'Bestseller',
    description: 'Bò Wagyu thái mỏng, gầu giòn, bò viên nướng than củi, nước dùng hầm xương ống 24 giờ.',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&q=80',
    variants: [
      { name: 'Tô Thường', priceDelta: 0 },
      { name: 'Tô Lớn (Nhiều Thịt)', priceDelta: 20000 }
    ]
  },
  {
    id: 2,
    sku: 'DISH-002',
    name: 'Gỏi Cuốn Tôm Thịt Hoàng Gia',
    categoryId: 1,
    categoryName: 'Khai Vị & Ăn Nhẹ',
    station: 'Bếp',
    price: 45000,
    costPrice: 16000,
    isAvailable: true,
    tag: 'Thanh Đạm',
    description: 'Tôm sú biển tươi giòn ngọt thịt ăn kèm sốt bơ đậu phộng gia truyền thơm béo ngậy.',
    imageUrl: 'https://images.unsplash.com/photo-1548946526-f69e2424cf45?w=500&q=80',
    variants: [
      { name: 'Phần 3 Cuốn', priceDelta: 0 },
      { name: 'Phần 5 Cuốn', priceDelta: 25000 }
    ]
  },
  {
    id: 3,
    sku: 'DISH-003',
    name: 'Cơm Tấm Sườn Mật Ong Đặc Biệt',
    categoryId: 2,
    categoryName: 'Món Chính & Đặc Sản',
    station: 'Bếp',
    price: 65000,
    costPrice: 24000,
    isAvailable: true,
    tag: 'Đậm Đà',
    description: 'Sườn nướng than hoa ướp mật ong rừng, chả trứng hấp béo ngậy và mỡ hành giòn rụm.',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80',
    variants: [
      { name: 'Phần Tiêu Chuẩn', priceDelta: 0 },
      { name: 'Thêm Sườn Cốt Lết', priceDelta: 30000 }
    ]
  },
  {
    id: 4,
    sku: 'DISH-004',
    name: 'Coca-Cola Sleek Lon 320ml (Ướp Lạnh)',
    categoryId: 3,
    categoryName: 'Đồ Uống Đóng Chai',
    station: 'Phục Vụ',
    price: 25000,
    costPrice: 9000,
    isAvailable: true,
    tag: 'Bestseller',
    description: 'Nước ngọt có gas ướp lạnh sẵn trong tủ mát, phục vụ kèm ly đá và lát chanh tươi.',
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80',
    variants: [
      { name: 'Lon Ướp Lạnh Kèm Ly Đá', priceDelta: 0 },
      { name: 'Uống Thường (Không Đá)', priceDelta: 0 }
    ]
  },
  {
    id: 5,
    sku: 'DISH-005',
    name: 'Bò Bít Tết Sốt Tiêu Đen ROMS',
    categoryId: 2,
    categoryName: 'Món Chính & Đặc Sản',
    station: 'Bếp',
    price: 289000,
    costPrice: 110000,
    isAvailable: true,
    tag: "Chef's Choice",
    description: 'Thăn bò Wagyu nướng chín tới vừa mềm mọng, ăn kèm măng tây, khoai tây nghiền và sốt tiêu đen.',
    imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=500&q=80',
    variants: [
      { name: 'Thăn Bò 200g', priceDelta: 0 },
      { name: 'Thăn Bò 350g', priceDelta: 120000 }
    ]
  },
  {
    id: 6,
    sku: 'DISH-006',
    name: 'Cơm Chiên Hải Sản Hoàng Kim',
    categoryId: 2,
    categoryName: 'Món Chính & Đặc Sản',
    station: 'Bếp',
    price: 139000,
    costPrice: 52000,
    isAvailable: false, // 86'd
    tag: 'Tạm Hết (86d)',
    description: 'Cơm hạt ngọc xào trứng muối bọc vàng óng, ngập tràn tôm sú, mực ống và sò điệp tươi.',
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&q=80',
    variants: [
      { name: 'Đĩa Tiêu Chuẩn', priceDelta: 0 }
    ]
  }
];

export default function MenuManagementPage() {
  const [dishes, setDishes] = useState(INITIAL_MANAGEMENT_ITEMS);
  const [selectedDishId, setSelectedDishId] = useState(1);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [selectedStationFilter, setSelectedStationFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // New Dish Form State
  const [newDish, setNewDish] = useState({
    name: '',
    sku: '',
    categoryName: 'Món Chính & Đặc Sản',
    station: 'Bếp',
    price: 85000,
    costPrice: 30000,
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const selectedDish = dishes.find(d => d.id === selectedDishId) || dishes[0];

  // Update selected dish fields (giá bán, giá vốn, tên, station...)
  const handleUpdateSelectedDish = (field, value) => {
    setDishes(prev => prev.map(d => d.id === selectedDishId ? { ...d, [field]: value } : d));
  };

  // Toggle Sold-out (86'd)
  const handleToggleAvailable = (dishId) => {
    setDishes(prev => prev.map(d => {
      if (d.id === dishId) {
        const nextState = !d.isAvailable;
        return {
          ...d,
          isAvailable: nextState,
          tag: nextState ? 'Đang Bán' : 'Tạm Hết (86d)'
        };
      }
      return d;
    }));
    showToast(`Đã cập nhật trạng thái bán cho món!`);
  };

  // Filtered dishes list
  const filteredDishes = dishes.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.sku.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    if (activeCategoryFilter !== 'ALL' && d.categoryName !== activeCategoryFilter) return false;
    if (selectedStationFilter !== 'ALL' && d.station !== selectedStationFilter) return false;
    return true;
  });

  // KPI Calculations
  const activeCount = dishes.filter(d => d.isAvailable).length;
  const pausedCount = dishes.filter(d => !d.isAvailable).length;
  const avgMargin = Math.round(
    dishes.reduce((sum, d) => sum + ((d.price - d.costPrice) / (d.price || 1) * 100), 0) / (dishes.length || 1)
  );

  const handleSaveSelectedDish = () => {
    showToast(`Đã lưu cấu hình món [${selectedDish.name}] thành công!`);
  };

  const handleCreateDish = () => {
    if (!newDish.name.trim() || !newDish.sku.trim()) {
      alert('Vui lòng nhập tên món và mã SKU!');
      return;
    }
    const created = {
      ...newDish,
      id: Date.now(),
      categoryId: 2,
      isAvailable: true,
      tag: 'Món Mới',
      variants: [{ name: 'Tiêu Chuẩn', priceDelta: 0 }]
    };
    setDishes([created, ...dishes]);
    setSelectedDishId(created.id);
    setShowAddDishModal(false);
    showToast(`Đã thêm món mới [${newDish.name}] thành công!`);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          zIndex: 9999,
          background: '#1F1B1A',
          color: '#FFF8F6',
          padding: '12px 18px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          animation: 'slideDown 0.25s ease-out'
        }}>
          <Icon name="check_circle" size={20} fill={1} style={{ color: '#FFB68C' }} />
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{toastMessage}</span>
        </div>
      )}

      {/* Header Title Area & Actions (theo SCR-22) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#89726B', marginBottom: '4px' }}>
            <span>ROMS Suite</span>
            <Icon name="chevron_right" size={14} />
            <span>Vận Hành FOH & BOH</span>
            <Icon name="chevron_right" size={14} />
            <span style={{ color: '#9D4124', fontWeight: 700 }}>Quản Lý Thực Đơn & Món Ăn</span>
          </div>
          <h1 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.9rem', color: '#1F1B1A', margin: 0 }}>
            Quản Lý Thực Đơn, Món Ăn & Cấu Hình Định Lượng
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => showToast('Đã đồng bộ thực đơn xuống tất cả màn hình Bếp KDS và Máy POS!')}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid #EAE0DE',
              background: '#FFFFFF',
              color: '#56423D',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Icon name="sync" size={18} style={{ color: '#596232' }} />
            <span>Đồng Bộ KDS/POS</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddDishModal(true)}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              background: '#9D4124',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(157, 65, 36, 0.25)'
            }}
          >
            <Icon name="add_circle" size={18} />
            <span>+ Thêm Món Ăn Mới</span>
          </button>
        </div>
      </div>

      {/* Operational KPI Metric Cards (3 cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 20px', border: '1px solid #F0E6E4', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#89726B', letterSpacing: '0.04em' }}>
              Món Đang Hoạt Động
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFDBC9', color: '#9D4124', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="restaurant" size={18} />
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.9rem', color: '#9D4124' }}>
              {activeCount}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#89726B' }}>món đang phục vụ</span>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 20px', border: '1px solid #F0E6E4', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#BA1A1A', letterSpacing: '0.04em' }}>
              Cảnh Báo Hết Hàng (86'd)
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFDAD6', color: '#93000A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="block" size={18} />
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.9rem', color: '#BA1A1A' }}>
              {pausedCount}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#89726B' }}>món tạm ngưng</span>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 20px', border: '1px solid #F0E6E4', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#596232', letterSpacing: '0.04em' }}>
              Biên Lợi Nhuận Gộp Trung Bình
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#DDE8AB', color: '#181E00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="trending_up" size={18} />
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.9rem', color: '#596232' }}>
              {avgMargin}%
            </span>
            <span style={{ fontSize: '0.82rem', color: '#89726B' }}>trên giá niêm yết</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '14px 18px',
        border: '1px solid #F0E6E4',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FCF1EF',
            borderRadius: '10px',
            padding: '8px 14px',
            flex: '1 1 240px'
          }}>
            <Icon name="search" size={18} style={{ color: '#89726B' }} />
            <input
              type="text"
              placeholder="Tìm theo tên món ăn hoặc mã SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%', color: '#1F1B1A' }}
            />
          </div>

          {/* Station selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#89726B', fontWeight: 600 }}>Trạm bếp:</span>
            <select
              value={selectedStationFilter}
              onChange={(e) => setSelectedStationFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #EAE0DE',
                background: '#FCF1EF',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#1F1B1A',
                outline: 'none'
              }}
            >
              <option value="ALL">Tất cả trạm xử lý</option>
              <option value="Bếp">Bếp (Món ăn)</option>
              <option value="Phục Vụ">Phục Vụ (Nước có sẵn)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingTop: '4px' }}>
          {[
            'ALL',
            'Món Chính & Đặc Sản',
            'Khai Vị & Ăn Nhẹ',
            'Đồ Uống Đóng Chai'
          ].map(cat => {
            const isActive = activeCategoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryFilter(cat)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: isActive ? '#9D4124' : '#F6ECEA',
                  color: isActive ? '#FFFFFF' : '#56423D',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat === 'ALL' ? 'Tất Cả Món' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Split: Dish List (7 cols) & Config Panel (5 cols) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', alignItems: 'flex-start' }}>
        {/* Left Column: Dish Cards */}
        <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1F1B1A' }}>
              Danh Sách Món Ăn ({filteredDishes.length} món)
            </span>
            <span style={{ fontSize: '0.75rem', color: '#89726B' }}>
              Click để mở cấu hình định lượng
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredDishes.map(dish => {
              const isSelected = selectedDish.id === dish.id;
              const margin = Math.round(((dish.price - dish.costPrice) / dish.price) * 100);

              return (
                <div
                  key={dish.id}
                  onClick={() => setSelectedDishId(dish.id)}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '14px',
                    border: isSelected ? '2px solid #9D4124' : '1px solid #F0E6E4',
                    boxShadow: isSelected ? '0 6px 18px rgba(157, 65, 36, 0.12)' : '0 1px 6px rgba(0,0,0,0.02)',
                    display: 'flex',
                    gap: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    style={{ width: '84px', height: '84px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
                  />

                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#89726B', fontWeight: 700 }}>
                            {dish.sku}
                          </span>
                          <span style={{
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: dish.isAvailable ? '#DDE8AB' : '#FFDAD6',
                            color: dish.isAvailable ? '#181E00' : '#93000A',
                            fontSize: '0.68rem',
                            fontWeight: 700
                          }}>
                            {dish.isAvailable ? 'Đang Bán' : 'Tạm Hết'}
                          </span>
                          <span style={{ padding: '1px 6px', borderRadius: '4px', background: '#F6ECEA', fontSize: '0.68rem', color: '#56423D' }}>
                            {dish.station}
                          </span>
                        </div>

                        <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#9D4124' }}>
                          {dish.price.toLocaleString('vi-VN')}₫
                        </span>
                      </div>

                      <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.95rem', color: '#1F1B1A', margin: '4px 0 2px' }}>
                        {dish.name}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#56423D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {dish.description}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #F6ECEA', marginTop: '6px' }}>
                      <div style={{ fontSize: '0.72rem', color: '#89726B' }}>
                        Giá vốn (Cost): <strong>{dish.costPrice.toLocaleString('vi-VN')}₫</strong> • Lời: <strong style={{ color: '#596232' }}>{margin}%</strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAvailable(dish.id);
                          }}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #EAE0DE',
                            background: dish.isAvailable ? '#FFF' : '#FFDAD6',
                            color: dish.isAvailable ? '#56423D' : '#BA1A1A',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {dish.isAvailable ? 'Ngưng Bán (86)' : 'Kích Hoạt'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dish Configuration & Recipe BOM Panel (5 cols) */}
        <div style={{ gridColumn: 'span 5', position: 'sticky', top: '84px' }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '22px',
            border: '1px solid #F0E6E4',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="tune" size={22} style={{ color: '#9D4124' }} />
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#1F1B1A', margin: 0 }}>
                  Cấu Hình Món
                </h3>
              </div>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#9D4124', fontSize: '0.85rem' }}>
                {selectedDish.sku}
              </span>
            </div>

            {/* Dish Info Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                  Tên món ăn:
                </label>
                <input
                  type="text"
                  value={selectedDish.name}
                  onChange={(e) => handleUpdateSelectedDish('name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #EAE0DE',
                    background: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#1F1B1A',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Giá bán niêm yết (₫):
                  </label>
                  <input
                    type="number"
                    value={selectedDish.price}
                    onChange={(e) => handleUpdateSelectedDish('price', parseInt(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid #EAE0DE',
                      background: '#FFFFFF',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: '#9D4124',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Giá vốn nguyên liệu (₫):
                  </label>
                  <input
                    type="number"
                    value={selectedDish.costPrice}
                    onChange={(e) => handleUpdateSelectedDish('costPrice', parseInt(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid #EAE0DE',
                      background: '#FFFFFF',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#56423D',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Profit & Margin Card */}
              <div style={{
                background: '#FCF1EF',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid #FFDBC9',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#89726B', display: 'block' }}>Lợi nhuận gộp:</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#9D4124' }}>
                    {Math.max(0, selectedDish.price - selectedDish.costPrice).toLocaleString('vi-VN')}₫
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#89726B', display: 'block' }}>Tỷ suất lợi nhuận:</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#596232' }}>
                    {selectedDish.price > 0
                      ? (((selectedDish.price - selectedDish.costPrice) / selectedDish.price) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                  Trạm KDS tiếp nhận vé:
                </label>
                <select
                  value={selectedDish.station}
                  onChange={(e) => handleUpdateSelectedDish('station', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #EAE0DE',
                    background: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#56423D',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                >
                  <option value="Bếp">Bếp (KDS món ăn)</option>
                  <option value="Phục Vụ">Phục Vụ (Nước có sẵn)</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <button
              type="button"
              onClick={handleSaveSelectedDish}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: '#9D4124',
                color: '#FFF',
                border: 'none',
                fontFamily: "'Epilogue', sans-serif",
                fontWeight: 800,
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(157, 65, 36, 0.25)'
              }}
            >
              <Icon name="save" size={18} />
              <span>Lưu Cấu Hình Món Ăn</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Thêm Món Ăn Mới */}
      {showAddDishModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(31, 27, 26, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '520px',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="add_circle" size={24} style={{ color: '#9D4124' }} />
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1F1B1A', margin: 0 }}>
                  Thêm Món Ăn Mới Vào Thực Đơn
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDishModal(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F6ECEA', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                  Tên món ăn <span style={{ color: '#9D4124' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bò Bít Tết Sốt Nấm Truffle"
                  value={newDish.name}
                  onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Mã SKU <span style={{ color: '#9D4124' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="DISH-007"
                    value={newDish.sku}
                    onChange={(e) => setNewDish({ ...newDish, sku: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Trạm bếp KDS
                  </label>
                  <select
                    value={newDish.station}
                    onChange={(e) => setNewDish({ ...newDish, station: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="Bếp">Bếp (KDS món ăn)</option>
                    <option value="Phục Vụ">Phục Vụ (Nước có sẵn)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Giá bán niêm yết (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={newDish.price}
                    onChange={(e) => setNewDish({ ...newDish, price: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Ước tính giá vốn Cost (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={newDish.costPrice}
                    onChange={(e) => setNewDish({ ...newDish, costPrice: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                  Mô tả món ăn:
                </label>
                <textarea
                  rows={2}
                  placeholder="Thành phần chính, hương vị..."
                  value={newDish.description}
                  onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowAddDishModal(false)}
                style={{ flex: 1, padding: '11px', borderRadius: '12px', background: '#F0E6E4', border: 'none', fontWeight: 700, color: '#56423D', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateDish}
                style={{ flex: 1, padding: '11px', borderRadius: '12px', background: '#9D4124', border: 'none', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}
              >
                Tạo Món Ăn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
