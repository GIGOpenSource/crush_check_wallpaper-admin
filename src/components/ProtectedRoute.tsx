import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 路由守卫组件
 * 检查用户是否已登录，未登录则重定向到登录页
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  
  // 检查是否有token
  const token = localStorage.getItem('token');
  
  if (!token) {
    // 未登录，重定向到登录页，并记录原始访问路径
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // 已登录，渲染子组件
  return <>{children}</>;
};

export default ProtectedRoute;
