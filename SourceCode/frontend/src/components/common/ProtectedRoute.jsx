import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, getRoleHome } from '../../context/AuthContext';

/**
 * Route Guard chi cho phep nguoi dung da dang nhap va co dung Role duoc phep truy cap
 * Neu chua dang nhap -> dieu huong ve /login
 * Neu khong dung Role -> dieu huong ve trang chu cua chinh Role do (khong duoc vao role khac)
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    // Chua dang nhap -> Bat buoc dang nhap tai /login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kiem tra phan quyen Role nghiem ngat
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role hien tai khong co quyen truy cap trang nay
    // Chuyen huong ve dung phan he cua ho
    const authorizedHome = getRoleHome(user.role);
    return <Navigate to={authorizedHome} replace />;
  }

  return children;
}
