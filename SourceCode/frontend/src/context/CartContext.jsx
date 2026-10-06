import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [tableInfo, setTableInfo] = useState(() => {
    const saved = localStorage.getItem('roms_table_info');
    return saved ? JSON.parse(saved) : { tableNumber: "Bàn 05", tableId: 5, sessionId: 103 };
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

  // Them mon vao gio hang
  const addToCart = (menuItem, quantity = 1, note = "") => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === menuItem.id && item.note === note);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prev, { ...menuItem, quantity, note }];
      }
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
