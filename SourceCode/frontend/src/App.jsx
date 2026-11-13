import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { DialogProvider } from './context/DialogContext';
import AppRoutes from './routes/AppRoutes';

import ConnectionStatusBar from './components/common/ConnectionStatusBar';

// Component goc boc cac Context Provider toan cuc cho ROMS
export default function App() {
  return (
    <BrowserRouter>
      {/* Quan ly trang thai dang nhap va phan quyen nhan vien */}
      <AuthProvider>
        {/* Quan ly gio hang thuc khach va phien ban an */}
        <CartProvider>
          {/* Quan ly thong bao, bao loi va hop thoai tren giao dien web */}
          <DialogProvider>
            <div className="roms-application-root">
              <ConnectionStatusBar />
              <AppRoutes />
            </div>
          </DialogProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
