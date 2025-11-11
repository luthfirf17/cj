import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

/**
 * Role-Based Route Component
 * Ensures user has the required role to access specific pages
 * 
 * @param {Array} allowedRoles - Array of roles allowed to access this route
 */
const RoleBasedRoute = ({ allowedRoles }) => {
  const location = useLocation();
  const user = authService.getUser();

  // Check if user is authenticated
  if (!user || !authService.isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'user') {
      return <Navigate to="/user/dashboard" replace />;
    } else {
      // Unknown role, logout
      authService.logout();
      return <Navigate to="/login" replace />;
    }
  }

  // User has correct role, render protected content
  return <Outlet />;
};

export default RoleBasedRoute;
