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

  // Thêm món vào giỏ hàng (Cộng dồn số lượng trên 1 dòng duy nhất)
  const addToCart = (menuItem, quantity = 1, note = "") => {
    const cleanNote = (note || '').trim();
    const qtyToAdd = Math.max(1, Number(quantity) || 1);

    setCartItems(prev => {
      // Tìm món trùng theo ID (hoặc cùng ID và cùng ghi chú)
      const existingIndex = prev.findIndex(item =>
        Number(item.id) === Number(menuItem.id) &&
        (item.note || '').trim() === cleanNote
      );

      // Nếu đã tồn tại -> cộng dồn số lượng theo chuẩn Immutable
      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        );
      }

      // Nếu chưa có -> thêm dòng mới
      return [...prev, { ...menuItem, quantity: qtyToAdd, note: cleanNote }];
    });
  };

  // Thay doi so luong
  const updateQuantity = (itemId, note, delta) => {
    setCartItems(prev => {
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
