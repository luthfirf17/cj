import React, { useEffect, useState, useRef } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

// Module-level singleton to prevent duplicate verify calls across instances
let verifyPromise = null;
let lastVerifyTime = 0;
const VERIFY_COOLDOWN = 30000; // 30 seconds cooldown between verifications

const cachedVerifyToken = async () => {
  const now = Date.now();
  
  // Return cached result if within cooldown
  if (verifyPromise && (now - lastVerifyTime) < VERIFY_COOLDOWN) {
    return verifyPromise;
  }
  
  lastVerifyTime = now;
  verifyPromise = authService.verifyToken()
    .then(result => {
      return result;
    })
    .catch(error => {
      verifyPromise = null; // Clear cache on error
      throw error;
    });
  
  return verifyPromise;
};

// Reset verify cache (called on logout)
export const resetVerifyCache = () => {
  verifyPromise = null;
  lastVerifyTime = 0;
};

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
  const hasVerified = useRef(false);

  useEffect(() => {
    // Prevent double-mount verification (React StrictMode)
    if (hasVerified.current) return;
    
    const verifyAuth = async () => {
      try {
        // Check if user has logged out (prevents back button access)
        if (sessionStorage.getItem('logged_out') === 'true') {
          setIsAuthenticated(false);
          setIsVerifying(false);
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

        // Token exists - allow access immediately
        setIsAuthenticated(true);
        setIsVerifying(false);
        hasVerified.current = true;

        // Background verify with deduplication (don't block UI)
        try {
          await cachedVerifyToken();
        } catch (error) {
          if (error.response?.status === 401) {
            console.warn('Token invalid, clearing auth state');
            resetVerifyCache();
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            sessionStorage.setItem('logged_out', 'true');
            setIsAuthenticated(false);
          }
          // Network errors: keep user logged in
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        setIsAuthenticated(false);
        setIsVerifying(false);
      }
    };

    verifyAuth();
  }, []); // Only verify once on mount, NOT on every route change

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
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
