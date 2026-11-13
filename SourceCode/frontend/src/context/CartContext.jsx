import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [tableInfo, setTableInfo] = useState(() => {
    const saved = localStorage.getItem('roms_table_info');
    return saved ? JSON.parse(saved) : null;
  });

  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('roms_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('roms_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('roms_table_info', JSON.stringify(tableInfo));
  }, [tableInfo]);

  const hasFiniteStock = (val) => val !== null && val !== undefined;

  // Thêm món vào giỏ hàng (Cộng dồn số lượng trên 1 dòng duy nhất & chặn vượt tồn kho)
  const addToCart = (menuItem, quantity = 1, note = "") => {
    if (!menuItem || menuItem.isAvailable === false) return;
    if (hasFiniteStock(menuItem.remainingStock) && Number(menuItem.remainingStock) <= 0) return;

    const cleanNote = (note || '').trim();
    const qtyToAdd = Math.max(1, Number(quantity) || 1);

    setCartItems(prev => {
      const currentTotalForDish = prev
        .filter(item => Number(item.id) === Number(menuItem.id))
        .reduce((s, item) => s + item.quantity, 0);

      let allowedAdd = qtyToAdd;
      if (hasFiniteStock(menuItem.remainingStock)) {
        const room = Math.max(0, Number(menuItem.remainingStock) - currentTotalForDish);
        if (room <= 0) return prev;
        allowedAdd = Math.min(qtyToAdd, room);
      }

      const syncedPrev = prev.map(item =>
        Number(item.id) === Number(menuItem.id)
          ? {
              ...item,
              remainingStock: menuItem.remainingStock !== undefined ? menuItem.remainingStock : item.remainingStock,
              isAvailable: menuItem.isAvailable !== undefined ? menuItem.isAvailable : item.isAvailable,
            }
          : item
      );

      // Tìm món trùng theo ID (hoặc cùng ID và cùng ghi chú)
      const existingIndex = syncedPrev.findIndex(item =>
        Number(item.id) === Number(menuItem.id) &&
        (item.note || '').trim() === cleanNote
      );

      // Nếu đã tồn tại -> cộng dồn số lượng theo chuẩn Immutable
      if (existingIndex > -1) {
        return syncedPrev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + allowedAdd }
            : item
        );
      }

      // Nếu chưa có -> thêm dòng mới
      return [...syncedPrev, { ...menuItem, quantity: allowedAdd, note: cleanNote }];
    });
  };

  // Thay doi so luong (chan vuot ton kho theo tong so luong cung mon trong gio)
  const updateQuantity = (itemId, note, delta) => {
    setCartItems(prev => {
      if (delta > 0) {
        const targetItem = prev.find(i => i.id === itemId && i.note === note);
        if (targetItem && targetItem.isAvailable === false) {
          return prev;
        }
        if (targetItem && hasFiniteStock(targetItem.remainingStock)) {
          const totalForDish = prev
            .filter(i => Number(i.id) === Number(itemId))
            .reduce((s, i) => s + i.quantity, 0);
          if (totalForDish + delta > Number(targetItem.remainingStock)) {
            return prev;
          }
        }
      }
      return prev.map(item => {
        if (item.id === itemId && item.note === note) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  // Cap nhat ghi chu mon
  const updateNote = (itemId, oldNote, newNote) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId && item.note === oldNote) {
        return { ...item, note: newNote };
      }
      return item;
    }));
  };

  // Xoa mon khoi gio
  const removeFromCart = (itemId, note) => {
    setCartItems(prev => prev.filter(item => !(item.id === itemId && item.note === note)));
  };

  // Dong bo ton kho/trang thai ban cho cac mon trong gio khi co su kien realtime
  const syncItemStock = (itemId, isAvailable, remainingStock) => {
    setCartItems(prev => {
      const hasMatch = prev.some(i => Number(i.id) === Number(itemId));
      if (!hasMatch) return prev;
      return prev.map(item =>
        Number(item.id) === Number(itemId)
          ? {
              ...item,
              isAvailable: isAvailable !== undefined ? isAvailable : item.isAvailable,
              remainingStock: remainingStock !== undefined ? remainingStock : item.remainingStock,
            }
          : item
      );
    });
  };

  // Xoa sach gio hang
  const clearCart = () => {
    setCartItems([]);
  };

  // Tinh tong so luong mon
  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Tinh tong tien
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      tableInfo,
      setTableInfo,
      cartItems,
      addToCart,
      updateQuantity,
      updateNote,
      removeFromCart,
      syncItemStock,
      clearCart,
      totalCount,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
