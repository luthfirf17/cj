import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import ForgotPasswordModal from '../../components/Auth/ForgotPasswordModal';
import Logo from '../../components/Common/Logo';
import authService from '../../services/authService';
import { FiMail, FiLock } from 'react-icons/fi';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          // Verify token is still valid
          const result = await authService.verifyToken();
          if (result.success) {
            const user = result.data.user;
            // Redirect based on role
            if (user.role === 'admin') {
              navigate('/admin/dashboard', { replace: true });
            } else {
              navigate('/user/dashboard', { replace: true });
            }
            return;
          }
        } catch (error) {
          // Token is invalid, logout
          authService.logout();
        }
      }
    };

    checkAuth();
  }, [navigate]);

  // Handle OAuth callback

  // Handle OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error) {
      let errorMessage = message ? decodeURIComponent(message) : 'Login dengan Google gagal. Silakan coba lagi.';
      
      switch (error) {
        case 'not_registered':
          errorMessage = message ? decodeURIComponent(message) : 'Akun belum terdaftar. Silakan daftar terlebih dahulu.';
          break;
        case 'already_registered':
          errorMessage = message ? decodeURIComponent(message) : 'Akun sudah terdaftar. Silakan login.';
          break;
        case 'google_account_already_registered':
          errorMessage = 'Akun Google ini sudah terdaftar. Silakan gunakan halaman login.';
          break;
        case 'oauth_failed':
          errorMessage = 'Login dengan Google gagal. Silakan coba lagi.';
          break;
        case 'oauth_error':
          errorMessage = 'Terjadi kesalahan saat login dengan Google.';
          break;
        default:
          errorMessage = message ? decodeURIComponent(message) : 'Login dengan Google gagal. Silakan coba lagi.';
      }
      
      setErrors({ email: errorMessage });
      return;
    }

    if (token && provider === 'google') {
      // Clear logout flag
      authService.clearLogoutFlag();
      
      // Store token using authService
      authService.setToken(token);
      
      // Get user profile to determine redirect
      authService.getProfile().then(result => {
        if (result.success) {
          const user = result.data;
          // For Google users, redirect to dashboard with calendar auto-open
          if (user.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/user/dashboard?openCalendar=true');
          }
        }
      }).catch(() => {
        // If profile fetch fails, redirect to dashboard anyway
        navigate('/user/dashboard?openCalendar=true');
      });
    }
  }, [searchParams, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email wajib diisi';
    if (!formData.password) newErrors.password = 'Password wajib diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await authService.login({
        ...formData,
        remember_me: rememberMe
      });
      
      if (result.success) {
        // Clear logout flag
        authService.clearLogoutFlag();
        
        const user = result.data.user;
        
        // Redirect based on role
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/user/dashboard');
        }
      } else {
        setErrors({ email: result.message || 'Login gagal' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ 
        email: error.message || 'Email atau password salah' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Redirect to Google OAuth LOGIN endpoint (for existing users)
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/google/login`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="xl" showText={false} />
            </div>
            <div className="mb-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#2c3e63] via-[#3d5a8c] to-[#c9a961] bg-clip-text text-transparent">
                Catat Jasamu
              </h1>
            </div>
            <p className="text-gray-600">Masuk ke akun Anda</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Masukan Email"
              icon={<FiMail />}
              error={errors.email}
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Masukkan password"
              icon={<FiLock />}
              error={errors.password}
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                />
                <span className="ml-2 text-sm text-gray-600">Ingat saya</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Lupa password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              Masuk
            </Button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">atau</span>
              </div>
            </div>
          </div>

          {/* Google Sign In */}
          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Masuk dengan Google
            </button>
          </div>

          {/* Register Link */}
          <p className="mt-6 text-center text-gray-600">
            Belum punya akun?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </div>
  );
};

export default Login;
