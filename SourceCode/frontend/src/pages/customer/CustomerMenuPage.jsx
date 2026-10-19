import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { customerApi } from '../../api/customerApi';
import { broadcastRealtimeEvent, subscribeRealtimeEvents } from '../../utils/realtimeSync';

// Icon Material Symbols (Reusable component)
function Icon({ name, size = 22, fill = 0, style = {} }) {
  return (
    <span
      className="material-icon"
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        lineHeight: 1,
        verticalAlign: 'middle',
        ...style
      }}
    >
      {name}
    </span>
  );
}

// Format tien VND
function formatVND(amount) {
  if (!amount && amount !== 0) return '0đ';
  return Number(amount).toLocaleString('vi-VN') + 'đ';
}

// --- Dish Card: 2 cot theo dung thiet ke Stitch SCR-10 ---
function DishCard({ item, inCartCount, onAdd }) {
  const isOutOfStock = !item.isAvailable || (item.remainingStock !== undefined && item.remainingStock !== null && item.remainingStock <= 0);
  const isLowStock = !isOutOfStock && item.remainingStock !== undefined && item.remainingStock !== null && item.remainingStock <= 5;

  const tagBg = item.tag?.includes('Bán chạy') || item.tag?.includes('Bestseller')
    ? 'var(--tertiary-fixed)'
    : isLowStock
    ? '#FFDBC9'
    : 'rgba(255, 219, 201, 0.5)';
  const tagColor = item.tag?.includes('Bán chạy') || item.tag?.includes('Bestseller')
    ? 'var(--on-tertiary-fixed)'
    : isLowStock
    ? '#9D4124'
    : 'var(--secondary)';
  const displayTag = isLowStock ? `Chỉ còn ${item.remainingStock} phần` : item.tag;

  return (
    <div className="dish-card" style={{ opacity: isOutOfStock ? 0.6 : 1 }}>
      {/* Anh mon an */}
      <div>
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4/3',
          overflow: 'hidden',
          background: 'var(--surface-container)',
        }}>
          <img
            src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';
            }}
          />
          {/* Thoi gian nau */}
          <div style={{
            position: 'absolute', top: 8, left: 8,
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(53, 47, 46, 0.75)',
            backdropFilter: 'blur(4px)',
            color: 'var(--inverse-on-surface)',
            fontSize: 10, fontWeight: 700,
            fontFamily: 'Plus Jakarta Sans',
          }}>
            {item.prepTime || '10-15p'}
          </div>
          {/* Tag (Ban chay, etc.) */}
          {displayTag && (
            <span style={{
              position: 'absolute', top: 8, right: 8,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: tagBg,
              color: tagColor,
              fontSize: 10, fontWeight: 700,
              fontFamily: 'Plus Jakarta Sans',
              boxShadow: 'var(--shadow-xs)',
            }}>
              {displayTag}
            </span>
          )}
          {/* Mon het hang */}
          {isOutOfStock && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(255,248,246,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(2px)',
            }}>
              <span style={{
                background: '#BA1A1A',
                color: '#FFFFFF',
                padding: '4px 12px', borderRadius: '9999px',
                fontSize: 11, fontWeight: 800,
                fontFamily: 'Plus Jakarta Sans',
                boxShadow: '0 2px 6px rgba(186, 26, 26, 0.3)'
              }}>Tạm Hết Món</span>
            </div>
          )}
        </div>

        {/* Thong tin mon */}
        <div style={{ padding: '8px 8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
            <h4 style={{
              fontFamily: 'Plus Jakarta Sans', fontWeight: 600, fontSize: 13,
              color: 'var(--on-surface)', lineHeight: '16px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              flex: 1,
            }}>
              {item.name}
            </h4>
          </div>
          <p style={{
            fontFamily: 'Plus Jakarta Sans', fontSize: 11,
            color: 'var(--on-surface-variant)', lineHeight: '15px', marginTop: 2,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {item.description || 'Hương vị thơm ngon, chế biến công phu từ nguyên liệu tươi mới.'}
          </p>
        </div>
      </div>

      {/* Gia + Nut them */}
      <div style={{
        padding: '6px 8px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4,
        marginTop: 4,
      }}>
        <div>
          <span style={{
            fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 13,
            color: 'var(--primary)',
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}>
            {formatVND(item.price)}
          </span>
        </div>
        {!isOutOfStock && (
          <button
            onClick={() => onAdd(item)}
            aria-label={`Them ${item.name}`}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: inCartCount > 0 ? 'var(--primary)' : 'var(--primary-fixed)',
              color: inCartCount > 0 ? 'var(--on-primary)' : 'var(--on-primary-fixed-variant)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: 'var(--shadow-xs)',
              transition: 'all 0.15s ease',
              position: 'relative',
            }}
          >
            {inCartCount > 0 ? (
              <>
                <Icon name="check" size={16} />
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--secondary)',
                  color: 'var(--on-secondary)',
                  fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Plus Jakarta Sans',
                }}>
                  {inCartCount}
                </span>
              </>
            ) : (
              <Icon name="add" size={18} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// --- Modal bottom sheet them mon ---
function DishDetailModal({ item, onClose, onConfirm }) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  if (!item) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(53, 47, 46, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface-container-lowest)',
          width: '100%', maxWidth: 430,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: '20px 16px 32px',
          maxHeight: '88vh', overflowY: 'auto',
        }}
      >
        {/* Header modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h2 style={{
              fontFamily: 'Epilogue', fontWeight: 700, fontSize: 20,
              color: 'var(--on-surface)', lineHeight: '28px',
            }}>
              {item.name}
            </h2>
            <span style={{
              fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 18,
              color: 'var(--primary)', fontVariantNumeric: 'tabular-nums',
            }}>
              {formatVND(item.price)}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--surface-container)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--on-surface-variant)',
              flexShrink: 0,
            }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Anh mon */}
        <div style={{
          width: '100%', height: 180, borderRadius: 16,
          overflow: 'hidden', marginBottom: 12,
        }}>
          <img
            src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';
            }}
          />
        </div>

        {/* Mo ta */}
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, lineHeight: '20px', marginBottom: 16 }}>
          {item.description || 'Món ăn đặc sắc với nguyên liệu tươi ngon được chế biến theo công thức độc quyền.'}
        </p>

        {/* Ghi chu */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, fontSize: 13, color: 'var(--on-surface)', marginBottom: 6 }}>
            Ghi chú riêng cho bếp:
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Ít cay, không hành, nhiều đá..."
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{
              width: '100%', height: 42, padding: '0 12px',
              borderRadius: 12, border: '1px solid var(--outline-variant)',
              background: 'var(--surface-container-low)',
              color: 'var(--on-surface)', fontFamily: 'Plus Jakarta Sans', fontSize: 13,
              boxSizing: 'border-box', outline: 'none'
            }}
          />
        </div>

        {/* Chon so luong va xac nhan */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface-container)', borderRadius: '9999px',
            padding: '4px 8px'
          }}>
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--surface-container-lowest)',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <Icon name="remove" size={16} />
            </button>
            <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 15, minWidth: 20, textAlign: 'center' }}>
              {qty}
            </span>
            <button
              onClick={() => setQty(qty + 1)}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--surface-container-lowest)',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <Icon name="add" size={16} />
            </button>
          </div>

          {/* Nut confirm */}
          <button
            onClick={() => { onConfirm(item, qty, note); onClose(); }}
            style={{
              flex: 1, height: 48, borderRadius: '9999px',
              background: 'var(--primary-container)',
              color: 'var(--on-primary)',
              border: 'none', cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: 'var(--shadow-primary)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-container)'; }}
          >
            <Icon name="local_fire_department" size={18} fill={1} />
            Thêm vào Giỏ — {formatVND(item.price * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Toast Notification ---
function useToast() {
  const [toast, setToast] = React.useState({ visible: false, message: '' });

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 2200);
  };

  const ToastEl = (
    <div className={`toast ${toast.visible ? '' : 'hidden'}`}>
      <Icon name="check_circle" size={18} style={{ color: 'var(--secondary-fixed-dim)' }} />
      {toast.message}
    </div>
  );

  return { showToast, ToastEl };
}

// ====================================================
// CustomerMenuPage - Trang thuc don thuc khach mobile
// Khop chinh xac voi SCR-10 Customer Mobile Menu (Stitch)
// ====================================================
export default function CustomerMenuPage() {
  const [categories, setCategories] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState(null);

  const { cartItems, addToCart, tableInfo } = useCart();
  const { showToast, ToastEl } = useToast();

  // Nạp thực đơn trực tiếp từ CSDL qua customerApi
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setIsLoading(true);
        const res = await customerApi.getCustomerMenu();
        if (res.success && res.data) {
          const menuCatalog = res.data;
          const catList = menuCatalog.map(c => ({
            id: c.categoryId,
            name: c.categoryName,
            displayOrder: c.displayOrder
          }));
          setCategories(catList);

          // Gom toàn bộ món ăn từ các danh mục
          const flatItems = [];
          menuCatalog.forEach(c => {
            if (c.items) {
              c.items.forEach(item => {
                flatItems.push({
                  ...item,
                  categoryId: c.categoryId,
                  categoryName: c.categoryName
                });
              });
            }
          });
          setAllItems(flatItems);
        }
      } catch (err) {
        console.error('Lỗi khi nạp thực đơn từ backend:', err);
        showToast('Đang tải thực đơn dự phòng...');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // Lắng nghe sự kiện cập nhật trạng thái món ăn 86'd tức thì qua WebSocket STOMP
  useEffect(() => {
    const unsubscribe = subscribeRealtimeEvents((event) => {
      if (event?.type === 'MENU_AVAILABILITY_CHANGED' && event?.payload) {
        const { id, isAvailable, remainingStock } = event.payload;
        setAllItems(prev => prev.map(item => {
          if (item.id === id) {
            return {
              ...item,
              isAvailable: isAvailable,
              remainingStock: remainingStock !== undefined ? remainingStock : item.remainingStock
            };
          }
          return item;
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRequestAssistance = async (reqType, note) => {
    try {
      const tId = tableInfo?.tableId;
      const tNum = tableInfo?.tableNumber || 'Bàn của bạn';
      await customerApi.callWaiter({
        tableId: tId,
        tableNumber: tNum,
        requestType: reqType,
        note: note || (reqType === 'REQUEST_ICE' ? 'Khách xin thêm đá lạnh' : 'Khách gọi nhân viên hỗ trợ')
      });
      broadcastRealtimeEvent({ type: 'CALL_WAITER', tableId: tId, tableNumber: tNum, requestType: reqType });
      if (reqType === 'REQUEST_ICE') {
        showToast('🧊 Đã gửi yêu cầu xin thêm đá lạnh tới nhân viên!');
      } else {
        showToast(`🔔 Đã rung chuông gọi nhân viên cho ${tNum}!`);
      }
    } catch (err) {
      showToast('Đã gửi yêu cầu tới nhân viên hỗ trợ!');
    }
  };

  // Loc mon an theo category va search
  const filteredItems = allItems.filter(item => {
    const matchCat = selectedCategory === 0 || item.categoryId === selectedCategory;
    const matchSearch =
      !searchQuery ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Lay so luong mon trong gio
  const getCountInCart = (itemId) =>
    cartItems.filter(i => i.id === itemId).reduce((s, i) => s + i.quantity, 0);

  const handleAdd = (item) => {
    setActiveModal(item);
  };

  const handleConfirmAdd = (item, qty, note) => {
    addToCart(item, qty, note);
    showToast(`Đã thêm ${item.name}`);
  };

  const selectedCatObj = categories.find(c => c.id === selectedCategory);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '100%', paddingBottom: 24,
    }}>

      {/* --- Banner thong tin ban an --- */}
      <div style={{ padding: '12px var(--gutter) 0' }}>
        <div style={{
          background: 'var(--surface-container)',
          borderRadius: 16, padding: '12px 14px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--surface-container-lowest)',
              padding: 6, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-xs)',
            }}>
              <Icon name="restaurant" size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{
                  fontFamily: 'Epilogue', fontWeight: 700, fontSize: 16,
                  color: 'var(--on-surface)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  ROMS Bistro
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  padding: '2px 8px', borderRadius: '9999px',
                  background: 'var(--tertiary-fixed)',
                  color: 'var(--on-tertiary-fixed)',
                  fontSize: 11, fontWeight: 700, fontFamily: 'Plus Jakarta Sans',
                  flexShrink: 0,
                }}>
                  <span className="pulse-dot" style={{ width: 6, height: 6 }} />
                  Trực tuyến
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  padding: '2px 6px', borderRadius: 6,
                  background: 'var(--primary-fixed)',
                  color: 'var(--on-primary-fixed-variant)',
                  fontSize: 11, fontWeight: 700, fontFamily: 'Plus Jakarta Sans',
                }}>
                  <Icon name="table_restaurant" size={13} style={{ color: 'var(--primary)' }} />
                  {tableInfo?.tableNumber || 'Bàn ăn'}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  padding: '2px 6px', borderRadius: 6,
                  background: 'var(--surface-container-highest)',
                  color: 'var(--on-surface-variant)',
                  fontSize: 11, fontWeight: 500, fontFamily: 'Plus Jakarta Sans',
                }}>
                  <Icon name="group" size={12} style={{ color: 'var(--primary)' }} />
                  {tableInfo?.guestCount || 2} Khách
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {/* Nút 1: Xin thêm đá riêng biệt */}
            <button
              type="button"
              onClick={() => handleRequestAssistance('REQUEST_ICE', 'Khách xin thêm đá lạnh')}
              title="Xin thêm xô đá lạnh"
              style={{
                height: 34,
                padding: '0 10px',
                borderRadius: '9999px',
                background: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
                cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                boxShadow: 'var(--shadow-xs)',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon name="ac_unit" size={14} style={{ color: '#2563EB' }} />
              <span>Xin đá</span>
            </button>

            {/* Nút 2: Gọi nhân viên hỗ trợ */}
            <button
              type="button"
              onClick={() => handleRequestAssistance('CALL_WAITER', 'Khách gọi nhân viên hỗ trợ')}
              title="Gọi nhân viên phục vụ tới bàn"
              style={{
                height: 34,
                padding: '0 10px',
                borderRadius: '9999px',
                background: 'var(--primary)',
                color: 'var(--on-primary)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                boxShadow: 'var(--shadow-xs)',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon name="room_service" size={14} />
              <span>Gọi phục vụ</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- Search + Filter --- */}
      <div style={{ padding: '12px var(--gutter) 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            position: 'relative', flex: 1,
            background: 'var(--surface-container-lowest)',
            borderRadius: 14, boxShadow: 'var(--shadow-xs)',
            display: 'flex', alignItems: 'center', padding: '10px 12px',
          }}>
            <Icon name="search" size={20} style={{ color: 'var(--outline)', marginRight: 8, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Tìm món ăn, lẩu nướng, tráng miệng..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontFamily: 'Plus Jakarta Sans', fontSize: 14,
                color: 'var(--on-surface)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline)', display: 'flex' }}
              >
                <Icon name="cancel" size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- Category Chips (cuon ngang) --- */}
      <div style={{ paddingTop: 12 }}>
        <div
          className="no-scrollbar"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            overflowX: 'auto', padding: '2px var(--gutter)',
          }}
        >
          <button
            className={`category-chip${selectedCategory === 0 ? ' active' : ''}`}
            onClick={() => setSelectedCategory(0)}
          >
            Tất cả ({allItems.length} món)
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-chip${selectedCategory === cat.id ? ' active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* --- Section header --- */}
      <div style={{
        padding: '16px var(--gutter) 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{
            fontFamily: 'Epilogue', fontWeight: 700, fontSize: 18,
            color: 'var(--on-surface)', lineHeight: '26px',
          }}>
            {selectedCategory === 0 ? 'Thực Đơn Nhà Hàng' : selectedCatObj?.name}
          </h2>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 2,
            padding: '2px 8px', borderRadius: '9999px',
            background: 'rgba(255,219,201,0.5)',
            color: 'var(--secondary)',
            fontFamily: 'Plus Jakarta Sans', fontSize: 11, fontWeight: 700,
          }}>
            <Icon name="star" size={13} fill={1} />
            4.9
          </span>
        </div>
        <span style={{
          fontFamily: 'Plus Jakarta Sans', fontSize: 13,
          color: 'var(--on-surface-variant)', fontWeight: 500,
        }}>
          {filteredItems.length} món
        </span>
      </div>

      {/* --- Luoi mon an 2 cot --- */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--on-surface-variant)' }}>
          <Icon name="sync" size={36} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, fontSize: 14, fontFamily: 'Plus Jakarta Sans' }}>Đang nạp thực đơn từ nhà hàng...</p>
        </div>
      ) : (
        <div style={{
          padding: '0 var(--gutter)',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
        }}>
          {filteredItems.length === 0 ? (
            <div style={{
              gridColumn: '1/-1', textAlign: 'center', padding: '48px 16px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
              <Icon name="search_off" size={40} style={{ color: 'var(--outline-variant)' }} />
              <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, fontFamily: 'Plus Jakarta Sans' }}>
                Không tìm thấy món phù hợp
              </p>
            </div>
          ) : (
            filteredItems.map(item => (
              <DishCard
                key={item.id}
                item={item}
                inCartCount={getCountInCart(item.id)}
                onAdd={handleAdd}
              />
            ))
          )}
        </div>
      )}

      {/* --- Toast Notification --- */}
      {ToastEl}

      {/* --- Modal them mon --- */}
      {activeModal && (
        <DishDetailModal
          item={activeModal}
          onClose={() => setActiveModal(null)}
          onConfirm={handleConfirmAdd}
        />
      )}
    </div>
  );
}
