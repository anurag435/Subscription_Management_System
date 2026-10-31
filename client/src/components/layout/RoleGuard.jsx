import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const RoleGuard = ({ allowedRoles = [] }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    // If a customer attempts to access admin routes, redirect to customer portal
    if (user?.role === 'customer') {
      return <Navigate to="/portal/subscriptions" replace />;
    }
    // If staff attempts admin-only routes, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
