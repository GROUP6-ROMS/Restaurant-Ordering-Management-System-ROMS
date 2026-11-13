import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useRestaurantProfile } from '../../utils/restaurantConfig';
import { customerApi } from '../../api/customerApi';
import { tableApi } from '../../api/tableApi';
import { broadcastRealtimeEvent, subscribeRealtimeEvents } from '../../utils/realtimeSync';

import Icon from '../../components/common/Icon';

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
function DishDetailModal({ item, inCartCount = 0, onClose, onConfirm, showToast }) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  if (!item) return null;

  const hasFiniteStock = item.remainingStock !== undefined && item.remainingStock !== null;
  const maxAllowed = hasFiniteStock
    ? Math.max(0, Number(item.remainingStock) - inCartCount)
    : 99;
  const isExhaustedInCart = hasFiniteStock && maxAllowed <= 0;
  const isMaxReached = qty >= maxAllowed;

  return (
    <div
      onClick={onClose}
      className="customer-modal-overlay"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="customer-modal-sheet"
        style={{
          background: 'var(--surface-container-lowest)',
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

        {/* Cảnh báo còn ít suất nếu có remainingStock */}
        {item.remainingStock !== undefined && item.remainingStock !== null && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 8,
            background: item.remainingStock <= 5 ? '#FFDAD6' : '#E8F5E9',
            color: item.remainingStock <= 5 ? '#BA1A1A' : '#2E7D32',
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 14
          }}>
            <Icon name={item.remainingStock <= 5 ? "warning" : "inventory_2"} size={16} />
            <span>
              {item.remainingStock <= 5
                ? `Chỉ còn ${item.remainingStock} suất sẵn sàng phục vụ!`
                : `Còn lại ${item.remainingStock} suất`}
              {inCartCount > 0 ? ` (đã có ${inCartCount} trong giỏ)` : ''}
            </span>
          </div>
        )}

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
              onClick={() => {
                if (isMaxReached) {
                  if (showToast) {
                    showToast(
                      isExhaustedInCart
                        ? `Món này chỉ còn ${item.remainingStock} suất (đã có đủ trong giỏ)!`
                        : `Chỉ có thể thêm tối đa ${maxAllowed} suất nữa (tổng kho còn ${item.remainingStock})!`
                    );
                  }
                  return;
                }
                setQty(qty + 1);
              }}
              disabled={isMaxReached}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: isMaxReached ? 'var(--surface-container-high)' : 'var(--surface-container-lowest)',
                color: isMaxReached ? 'var(--outline-variant)' : 'inherit',
                border: 'none',
                cursor: isMaxReached ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <Icon name="add" size={16} />
            </button>
          </div>

          {/* Nut confirm */}
          <button
            onClick={() => {
              if (isExhaustedInCart) {
                if (showToast) showToast(`Món này chỉ còn ${item.remainingStock} suất (đã có đủ trong giỏ)!`);
                return;
              }
              onConfirm(item, qty, note);
              onClose();
            }}
            disabled={isExhaustedInCart}
            style={{
              flex: 1, height: 48, borderRadius: '9999px',
              background: isExhaustedInCart ? '#E5E7EB' : 'var(--primary-container)',
              color: isExhaustedInCart ? '#6B7280' : 'var(--on-primary)',
              border: 'none', cursor: isExhaustedInCart ? 'not-allowed' : 'pointer',
              fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: isExhaustedInCart ? 'none' : 'var(--shadow-primary)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { if (!isExhaustedInCart) e.currentTarget.style.background = 'var(--primary)'; }}
            onMouseLeave={e => { if (!isExhaustedInCart) e.currentTarget.style.background = 'var(--primary-container)'; }}
          >
            <Icon name={isExhaustedInCart ? "block" : "local_fire_department"} size={18} fill={1} />
            {isExhaustedInCart
              ? 'Đã chọn tối đa suất còn lại'
              : `Thêm vào Giỏ — ${formatVND(item.price * qty)}`}
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
  const restaurantProfile = useRestaurantProfile();

  const [tableStatus, setTableStatus] = useState(
    tableInfo?.status || (sessionStorage.getItem('roms_dining_token') ? 'OCCUPIED' : 'AVAILABLE')
  );

  useEffect(() => {
    const unsubscribe = subscribeRealtimeEvents((event) => {
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
          showToast('Bàn đã được nhân viên mở! Quý khách có thể xem thực đơn và đặt món.');
        } else if (
          event.type === 'BILL_PAID' ||
          event.type === 'SESSION_CLOSED' ||
          ['AVAILABLE', 'DIRTY', 'COMPLETED', 'CLOSED'].includes(event.status)
        ) {
          setTableStatus('AVAILABLE');
          sessionStorage.removeItem('roms_dining_token');
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

  const diningToken = sessionStorage.getItem('roms_dining_token');
  const staffToken = sessionStorage.getItem('roms_token');
  const isTableOccupied = (tableStatus === 'OCCUPIED' || tableInfo?.status === 'OCCUPIED') && (Boolean(diningToken) || Boolean(staffToken));

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

  // Lọc món ăn theo category, search và luôn ưu tiên món KHÔNG KHÓA lên đầu
  const isUnlocked = (item) => Boolean(item.isAvailable) && (item.remainingStock === undefined || item.remainingStock === null || item.remainingStock > 0);

  const filteredItems = allItems.filter(item => {
    const matchCat = selectedCategory === 0 || item.categoryId === selectedCategory;
    const matchSearch =
      !searchQuery ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => {
    const aUn = isUnlocked(a) ? 1 : 0;
    const bUn = isUnlocked(b) ? 1 : 0;
    return bUn - aUn;
  });

  // Lay so luong mon trong gio
  const getCountInCart = (itemId) =>
    cartItems.filter(i => i.id === itemId).reduce((s, i) => s + i.quantity, 0);

  const handleAdd = (item) => {
    setActiveModal(item);
  };

  const handleConfirmAdd = (item, qty, note) => {
    const inCart = getCountInCart(item.id);
    const hasFiniteStock = item.remainingStock !== undefined && item.remainingStock !== null;
    if (item.isAvailable === false || (hasFiniteStock && Number(item.remainingStock) <= 0)) {
      showToast(`Món "${item.name}" hiện đã tạm hết!`);
      return;
    }
    if (hasFiniteStock) {
      const maxCanAdd = Math.max(0, Number(item.remainingStock) - inCart);
      if (maxCanAdd <= 0) {
        showToast(`Món "${item.name}" chỉ còn ${item.remainingStock} suất (đã có đủ trong giỏ)!`);
        return;
      }
      const addQty = Math.min(qty, maxCanAdd);
      addToCart(item, addQty, note);
      if (addQty < qty) {
        showToast(`Chỉ thêm được ${addQty} suất "${item.name}" (đạt giới hạn ${item.remainingStock} suất còn lại)`);
        return;
      }
    } else {
      addToCart(item, qty, note);
    }
    showToast(`Đã thêm ${item.name}`);
  };

  const selectedCatObj = categories.find(c => c.id === selectedCategory);

  // Kiểm tra nếu bàn chưa mở phiên phục vụ -> Hiện thông báo Chờ nhân viên mở bàn
  if (!isTableOccupied) {
    return (
      <div style={{
        padding: '60px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '65vh'
      }}>
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: '#FFF3E0',
          border: '2px solid #FFE0B2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#E65100',
          marginBottom: '16px',
          boxShadow: '0 4px 16px rgba(230, 81, 0, 0.12)'
        }}>
          <Icon name="hourglass_top" size={40} fill={1} />
        </div>
        <h2 style={{ fontFamily: 'Epilogue', fontWeight: 900, fontSize: '1.4rem', color: '#1F1B1A', margin: '0 0 8px' }}>
          Chờ nhân viên mở bàn
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#56423D', maxWidth: '320px', margin: '0 auto 24px', lineHeight: 1.5 }}>
          Bàn ăn hiện chưa được nhân viên phục vụ mở bàn (Check-in). Quý khách vui lòng đợi nhân viên mở bàn để xem thực đơn và đặt món!
        </p>
        <button
          type="button"
          onClick={() => handleRequestAssistance('ASSISTANCE', 'Yêu cầu nhân viên mở bàn (Check-in)')}
          style={{
            padding: '13px 26px',
            borderRadius: '9999px',
            background: '#E65100',
            color: '#FFFFFF',
            border: 'none',
            fontFamily: 'Plus Jakarta Sans',
            fontWeight: 800,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(230,81,0,0.25)',
            transition: 'all 0.15s ease'
          }}
        >
          <Icon name="notifications_active" size={20} fill={1} />
          Gọi nhân viên mở bàn
        </button>
        {ToastEl}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '100%', paddingBottom: 24,
    }}>

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

      {/* --- Lưới món ăn Responsive (Mobile 2 cột, Tablet 3 cột) --- */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--on-surface-variant)' }}>
          <Icon name="sync" size={36} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, fontSize: 14, fontFamily: 'Plus Jakarta Sans' }}>Đang nạp thực đơn từ nhà hàng...</p>
        </div>
      ) : (
        <div className="dish-responsive-grid">
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
          inCartCount={getCountInCart(activeModal.id)}
          onClose={() => setActiveModal(null)}
          onConfirm={handleConfirmAdd}
          showToast={showToast}
        />
      )}
    </div>
  );
}
