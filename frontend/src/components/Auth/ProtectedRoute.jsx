import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

/**
 * Protected Route Component
 * Ensures user is authenticated before accessing protected pages
 * Prevents access via back button after logout
 */
const ProtectedRoute = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Check if user has logged out (prevents back button access)
        if (sessionStorage.getItem('logged_out') === 'true') {
          setIsAuthenticated(false);
          setIsVerifying(false);
          // Clear any remaining token
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          return;
        }

        // Check if token exists
        if (!authService.isAuthenticated()) {
          setIsAuthenticated(false);
          setIsVerifying(false);
          return;
        }

        // For now, assume user is authenticated if token exists
        // This prevents logout on refresh due to temporary network issues
        setIsAuthenticated(true);
        setIsVerifying(false);

        // Optionally verify token in background (don't block UI)
        try {
          await authService.verifyToken();
          // Token is valid, keep user authenticated
        } catch (error) {
          // If token verification fails, check if it's a 401 (invalid token)
          if (error.response?.status === 401) {
            console.warn('Token verification failed - token is invalid, logging out');
            authService.logout();
            setIsAuthenticated(false);
          } else {
            // Network/server error - keep user logged in
            console.warn('Token verification failed due to network/server error - keeping user logged in');
          }
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        setIsAuthenticated(false);
        setIsVerifying(false);
      }
    };

    verifyAuth();
  }, [location.pathname]); // Re-verify when route changes

  // Handle browser back button - listen for popstate
  useEffect(() => {
    const handlePopState = () => {
      // Check if logged out when navigating via back button
      if (sessionStorage.getItem('logged_out') === 'true') {
        navigate('/login', { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  // Show loading while verifying
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render protected content
  return <Outlet />;
};

export default ProtectedRoute;
