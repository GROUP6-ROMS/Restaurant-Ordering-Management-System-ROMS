import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import AppRoutes from './routes/AppRoutes';

// Component goc boc cac Context Provider toan cuc cho ROMS
export default function App() {
  return (
    <BrowserRouter>
      {/* Quan ly trang thai dang nhap va phan quyen nhan vien */}
      <AuthProvider>
        {/* Quan ly gio hang thuc khach va phien ban an */}
        <CartProvider>
          <div className="roms-application-root">
            <AppRoutes />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
