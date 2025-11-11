import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import Logo from '../../components/Common/Logo';
import authService from '../../services/authService';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimal 6 karakter"
              icon={<FiLock />}
              error={errors.password}
              required
            />

            <Input
              label="Konfirmasi Password"
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="Masukkan password lagi"
              icon={<FiLock />}
              error={errors.confirm_password}
              required
            />

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

          {/* Login Link */}
          <p className="mt-6 text-center text-gray-600">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
