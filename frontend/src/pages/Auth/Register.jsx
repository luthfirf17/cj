import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import Logo from '../../components/Common/Logo';
import authService from '../../services/authService';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error) {
      let errorMessage = message ? decodeURIComponent(message) : 'Pendaftaran dengan Google gagal. Silakan coba lagi.';
      
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
          errorMessage = 'Pendaftaran dengan Google gagal. Silakan coba lagi.';
          break;
        case 'oauth_error':
          errorMessage = 'Terjadi kesalahan saat pendaftaran dengan Google.';
          break;
        default:
          errorMessage = message ? decodeURIComponent(message) : 'Pendaftaran dengan Google gagal. Silakan coba lagi.';
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
          // Save user creation timestamp for onboarding
          localStorage.setItem('user_created_at', user.created_at);
          localStorage.removeItem('onboarding_completed'); // Reset onboarding for new user
          
          // Redirect based on role
          if (user.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/user/dashboard');
          }
        }
      }).catch(() => {
        // If profile fetch fails, redirect to dashboard anyway
        navigate('/user/dashboard');
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
    if (!formData.full_name) newErrors.full_name = 'Nama lengkap wajib diisi';
    if (!formData.email) newErrors.email = 'Email wajib diisi';
    if (!formData.password) newErrors.password = 'Password wajib diisi';
    if (formData.password.length < 6) newErrors.password = 'Password minimal 6 karakter';
    
    // Additional password validation
    if (formData.password && formData.password.length >= 6) {
      const hasUpperCase = /[A-Z]/.test(formData.password);
      const hasLowerCase = /[a-z]/.test(formData.password);
      const hasNumbers = /\d/.test(formData.password);
      
      if (!hasUpperCase) {
        newErrors.password = 'Password harus mengandung minimal 1 huruf kapital';
      } else if (!hasLowerCase) {
        newErrors.password = 'Password harus mengandung minimal 1 huruf kecil';
      } else if (!hasNumbers) {
        newErrors.password = 'Password harus mengandung minimal 1 angka';
      }
    }
    
    if (!formData.confirm_password) newErrors.confirm_password = 'Konfirmasi password wajib diisi';
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Password tidak cocok';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await authService.register({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password
      });
      
      if (result.success) {
        // Clear logout flag
        authService.clearLogoutFlag();
        
        // Registration successful and user is automatically logged in
        const user = result.data.user;
        
        // Save user creation timestamp for onboarding
        if (user.is_new_user) {
          localStorage.setItem('user_created_at', user.created_at);
          localStorage.removeItem('onboarding_completed'); // Reset onboarding for new user
        }
        
        // Redirect based on role
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/user/dashboard');
        }
      } else {
        setErrors({ email: result.message || 'Registrasi gagal' });
      }
    } catch (error) {
      console.error('Register error:', error);
      setErrors({ 
        email: error.message || 'Terjadi kesalahan saat registrasi' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Redirect to Google OAuth REGISTER endpoint (for new users)
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/google/register`;
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
            <p className="text-gray-600">Buat akun baru</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nama Lengkap"
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Nama lengkap Anda"
              icon={<FiUser />}
              error={errors.full_name}
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="nama@example.com"
              icon={<FiMail />}
              error={errors.email}
              required
            />

            {/* Password Field with Toggle */}
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
                <span className="text-red-500 ml-1">*</span>
              </label>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FiLock />
                </div>
                
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimal 6 karakter, harus ada huruf kapital dan angka"
                  className={`
                    block w-full rounded-lg border pl-10 pr-10 px-3 py-2 
                    ${errors.password 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }
                    bg-white focus:outline-none focus:ring-2 focus:ring-offset-0
                    transition-colors duration-200
                  `}
                  required
                />
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field with Toggle */}
            <div className="mb-4">
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                Konfirmasi Password
                <span className="text-red-500 ml-1">*</span>
              </label>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FiLock />
                </div>
                
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm_password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Masukkan password lagi"
                  className={`
                    block w-full rounded-lg border pl-10 pr-10 px-3 py-2 
                    ${errors.confirm_password 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }
                    bg-white focus:outline-none focus:ring-2 focus:ring-offset-0
                    transition-colors duration-200
                  `}
                  required
                />
                
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              Daftar
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
              Daftar dengan Google
            </button>
          </div>

          {/* Login Link */}
          <p className="mt-6 text-center text-gray-600">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Masuk di sini
            </Link>
          </p>

          {/* Password Requirements Info */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <p className="text-xs text-slate-700 text-center mb-2">
              <strong>🔐 Persyaratan Password:</strong>
            </p>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Minimal 6 karakter</li>
              <li>• Mengandung huruf kapital (A-Z)</li>
              <li>• Mengandung huruf kecil (a-z)</li>
              <li>• Mengandung angka (0-9)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
