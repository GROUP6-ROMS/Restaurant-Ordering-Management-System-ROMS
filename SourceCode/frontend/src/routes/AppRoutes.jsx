import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import CustomerLayout from '../components/layout/CustomerLayout';
import StaffLayout from '../components/layout/StaffLayout';
import AdminLayout from '../components/layout/AdminLayout';

// Pages
import LandingPage from '../pages/public/LandingPage';
import ReservationPage from '../pages/public/ReservationPage';

import StaffLoginPage from '../pages/auth/StaffLoginPage';

import TableWelcomePage from '../pages/customer/TableWelcomePage';
import CustomerMenuPage from '../pages/customer/CustomerMenuPage';
import CustomerCartPage from '../pages/customer/CustomerCartPage';
import CustomerTrackingPage from '../pages/customer/CustomerTrackingPage';

import KitchenKdsPage from '../pages/kitchen/KitchenKdsPage';
import WaiterFloorPlanPage from '../pages/waiter/WaiterFloorPlanPage';
import WaiterOrderDetailPage from '../pages/waiter/WaiterOrderDetailPage';
import PosCheckoutPage from '../pages/cashier/PosCheckoutPage';

import MenuManagementPage from '../pages/admin/MenuManagementPage';
import StaffManagementPage from '../pages/admin/StaffManagementPage';
import TableManagementPage from '../pages/admin/TableManagementPage';
import ReportsAnalyticsPage from '../pages/admin/ReportsAnalyticsPage';

import ProtectedRoute from '../components/common/ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Cong cong & Dat ban */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/reservation" element={<ReservationPage />} />

      {/* 2. Cong Dang Nhap Nhan Vien Phan Quyen (SCR-01) */}
      <Route path="/login" element={<StaffLoginPage />} />

      {/* 3. Trai nghiem thuc khach quet QR goi mon tai ban (Mobile First) */}
      <Route path="/dining" element={<CustomerLayout />}>
        <Route index element={<Navigate to="/dining/menu" replace />} />
        <Route path="welcome" element={<TableWelcomePage />} />
        <Route path="menu" element={<CustomerMenuPage />} />
        <Route path="cart" element={<CustomerCartPage />} />
        <Route path="orders/tracking" element={<CustomerTrackingPage />} />
      </Route>

      {/* 4. Bo phan Quan tri vien / Manager (Role MANAGER hoac ADMIN) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/reports" replace />} />
        <Route path="reports" element={<ReportsAnalyticsPage />} />
        <Route path="tables" element={<TableManagementPage />} />
        <Route path="menu" element={<MenuManagementPage />} />
        <Route path="staff" element={<StaffManagementPage />} />
      </Route>

      {/* Alias cho /manager sang /admin/reports */}
      <Route path="/manager" element={<Navigate to="/admin/reports" replace />} />
      <Route path="/manager/*" element={<Navigate to="/admin/reports" replace />} />

      {/* 5. Bo phan phuc vu san (Chỉ Role WAITER) - Xu ly order va phuc vu nuoc dong chai */}
      <Route
        path="/waiter"
        element={
          <ProtectedRoute allowedRoles={['WAITER']}>
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/waiter/floor-plan" replace />} />
        <Route path="floor-plan" element={<WaiterFloorPlanPage />} />
        <Route path="order" element={<WaiterOrderDetailPage />} />
      </Route>

      {/* Alias /bar sang /waiter (Đã xoá quầy bar, nước có sẵn chuyển cho Waiter) */}
      <Route path="/bar" element={<Navigate to="/waiter/floor-plan" replace />} />
      <Route path="/bar/*" element={<Navigate to="/waiter/floor-plan" replace />} />

      {/* 7. Bo phan bep KDS (Chỉ Role KITCHEN) */}
      <Route
        path="/kitchen"
        element={
          <ProtectedRoute allowedRoles={['KITCHEN']}>
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/kitchen/kds" replace />} />
        <Route path="kds" element={<KitchenKdsPage />} />
      </Route>

      {/* 8. Bo phan thu ngan POS (Chỉ Role CASHIER) */}
      <Route
        path="/pos"
        element={
          <ProtectedRoute allowedRoles={['CASHIER']}>
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/pos/checkout" replace />} />
        <Route path="checkout" element={<PosCheckoutPage />} />
      </Route>

      {/* 9. Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
