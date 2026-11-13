import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import CustomerLayout from '../components/layout/CustomerLayout';
import StaffLayout from '../components/layout/StaffLayout';
import AdminLayout from '../components/layout/AdminLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import RouteLoadingFallback from '../components/common/RouteLoadingFallback';

// Lazy-loaded Pages (Code-splitting by User Persona / Operational Role)
const LandingPage = lazy(() => import('../pages/public/LandingPage'));
const ReservationPage = lazy(() => import('../pages/public/ReservationPage'));

const StaffLoginPage = lazy(() => import('../pages/auth/StaffLoginPage'));

const TableWelcomePage = lazy(() => import('../pages/customer/TableWelcomePage'));
const CustomerMenuPage = lazy(() => import('../pages/customer/CustomerMenuPage'));
const CustomerCartPage = lazy(() => import('../pages/customer/CustomerCartPage'));
const CustomerTrackingPage = lazy(() => import('../pages/customer/CustomerTrackingPage'));

const KitchenKdsPage = lazy(() => import('../pages/kitchen/KitchenKdsPage'));
const WaiterFloorPlanPage = lazy(() => import('../pages/waiter/WaiterFloorPlanPage'));
const WaiterOrderDetailPage = lazy(() => import('../pages/waiter/WaiterOrderDetailPage'));
const PosCheckoutPage = lazy(() => import('../pages/cashier/PosCheckoutPage'));

const MenuManagementPage = lazy(() => import('../pages/admin/MenuManagementPage'));
const StaffManagementPage = lazy(() => import('../pages/admin/StaffManagementPage'));
const TableManagementPage = lazy(() => import('../pages/admin/TableManagementPage'));
const ReportsAnalyticsPage = lazy(() => import('../pages/admin/ReportsAnalyticsPage'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
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

        {/* 4. Bo phan Quan ly / Manager (Role MANAGER) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
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

        {/* 5. Bo phan phuc vu san (Role WAITER & MANAGER) - Xu ly order va phuc vu nuoc dong chai */}
        <Route
          path="/waiter"
          element={
            <ProtectedRoute allowedRoles={['WAITER', 'MANAGER']}>
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
    </Suspense>
  );
}
