import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiMail, FiSave, FiX, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import api from '../../services/api';
import ResetPasswordWithPinModal from '../../components/Common/ResetPasswordWithPinModal';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // User Profile Data
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    username: '',
  });

  // Password Change Data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Separate loading states
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingPin, setLoadingPin] = useState(false);

  // PIN Data
  const [hasPin, setHasPin] = useState(false);
  const [pinData, setPinData] = useState({
    currentPin: '', // PIN saat ini untuk verifikasi
    pin: '',
    confirmPin: '',
    currentPassword: '',
  });
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [showPinPassword, setShowPinPassword] = useState(false);
  
  // Password change with PIN verification
  const [passwordWithPinData, setPasswordWithPinData] = useState({
    verificationPin: '', // PIN untuk verifikasi perubahan password
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showVerificationPin, setShowVerificationPin] = useState(false);

  // Reset Password with PIN Modal
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    checkPinStatus();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/profile');
      
      if (response.data.success) {
        const user = response.data.data;
        setProfileData({
          name: user.name || '',
          email: user.email || '',
          username: user.username || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        alert('Gagal memuat profil. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkPinStatus = async () => {
    try {
      const response = await api.get('/user/pin-status');
      if (response.data.success) {
        setHasPin(response.data.data.hasPin);
      }
    } catch (error) {
      console.error('Error checking PIN status:', error);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    
    // If changing verification PIN, only allow digits and max 6 characters
    if (name === 'verificationPin') {
      if (value === '' || (/^\d+$/.test(value) && value.length <= 6)) {
        setPasswordWithPinData(prev => ({
          ...prev,
          [name]: value,
        }));
      }
    } else {
      setPasswordWithPinData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    try {
      const response = await api.get('/user/pin-status');
      if (!response.data.data.hasPin) {
        alert('PIN belum diatur. Silakan buat PIN terlebih dahulu di bagian Keamanan PIN di bawah.');
        return;
      }
      setShowResetPasswordModal(true);
    } catch (error) {
      console.error('Error checking PIN status:', error);
      alert('Gagal memeriksa status PIN');
    }
  };

  const handlePinChange = (e) => {
    const { name, value } = e.target;
    // Only allow digits and max 6 characters for PIN fields
    if (name === 'currentPin' || name === 'pin' || name === 'confirmPin') {
      if (value === '' || (/^\d+$/.test(value) && value.length <= 6)) {
        setPinData(prev => ({
          ...prev,
          [name]: value,
        }));
      }
    } else {
      setPinData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!profileData.name.trim()) {
      alert('Nama tidak boleh kosong!');
      return;
    }

    if (!profileData.email.trim()) {
      alert('Email tidak boleh kosong!');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      alert('Format email tidak valid!');
      return;
    }

    try {
      setLoadingProfile(true);
      const response = await api.put('/user/profile', {
        name: profileData.name,
        email: profileData.email,
      });

      if (response.data.success) {
        alert('Profil berhasil diperbarui!');
        
        // Update user data in localStorage (key is 'user_data', not 'user')
        const currentUser = JSON.parse(localStorage.getItem('user_data'));
        console.log('📦 Current user from localStorage:', currentUser);
        
        if (currentUser) {
          currentUser.full_name = profileData.name;
          currentUser.email = profileData.email;
          localStorage.setItem('user_data', JSON.stringify(currentUser));
          
          console.log('✅ Updated user in localStorage:', currentUser);
          
          // Dispatch custom event to notify navbar
          const event = new CustomEvent('profileUpdated', {
            detail: currentUser
          });
          window.dispatchEvent(event);
          console.log('📢 Event profileUpdated dispatched!', currentUser);
        } else {
          console.error('❌ No user found in localStorage!');
        }
        
        fetchUserProfile(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Gagal memperbarui profil. Silakan coba lagi.');
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Check if user has PIN - if yes, require PIN verification
    if (hasPin) {
      if (!passwordWithPinData.verificationPin) {
        alert('PIN verifikasi harus diisi untuk keamanan!');
        return;
      }

      if (passwordWithPinData.verificationPin.length !== 6) {
        alert('PIN harus 6 digit angka!');
        return;
      }
    }

    if (!passwordWithPinData.currentPassword) {
      alert('Password saat ini harus diisi!');
      return;
    }

    if (!passwordWithPinData.newPassword) {
      alert('Password baru harus diisi!');
      return;
    }

    if (passwordWithPinData.newPassword.length < 6) {
      alert('Password baru minimal 6 karakter!');
      return;
    }

    if (passwordWithPinData.newPassword !== passwordWithPinData.confirmPassword) {
      alert('Konfirmasi password tidak cocok!');
      return;
    }

    try {
      setLoadingPassword(true);
      const payload = {
        currentPassword: passwordWithPinData.currentPassword,
        newPassword: passwordWithPinData.newPassword,
      };

      // Add PIN verification if user has PIN
      if (hasPin) {
        payload.verificationPin = passwordWithPinData.verificationPin;
      }

      const response = await api.put('/user/change-password', payload);

      if (response.data.success) {
        alert('Password berhasil diubah!');
        // Reset form
        setPasswordWithPinData({
          verificationPin: '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Gagal mengubah password. Silakan coba lagi.');
      }
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleSetPin = async (e) => {
    e.preventDefault();

    // If user already has PIN, require current PIN verification
    if (hasPin) {
      if (!pinData.currentPin) {
        alert('PIN saat ini harus diisi untuk verifikasi!');
        return;
      }

      if (pinData.currentPin.length !== 6) {
        alert('PIN saat ini harus 6 digit angka!');
        return;
      }
    }

    if (!pinData.pin) {
      alert('PIN baru harus diisi!');
      return;
    }

    if (pinData.pin.length !== 6) {
      alert('PIN baru harus 6 digit angka!');
      return;
    }

    if (pinData.pin !== pinData.confirmPin) {
      alert('Konfirmasi PIN tidak cocok!');
      return;
    }

    if (!pinData.currentPassword) {
      alert('Password saat ini diperlukan untuk keamanan!');
      return;
    }

    try {
      setLoadingPin(true);
      const payload = {
        pin: pinData.pin,
        currentPassword: pinData.currentPassword,
      };

      // Add current PIN verification if user already has PIN
      if (hasPin) {
        payload.currentPin = pinData.currentPin;
      }

      const response = await api.post('/user/set-pin', payload);

      if (response.data.success) {
        alert(hasPin ? 'PIN berhasil diubah!' : 'PIN berhasil dibuat!');
        // Reset form
        setPinData({
          currentPin: '',
          pin: '',
          confirmPin: '',
          currentPassword: '',
        });
        checkPinStatus(); // Refresh PIN status
      }
    } catch (error) {
      console.error('Error setting PIN:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Gagal mengatur PIN. Silakan coba lagi.');
      }
    } finally {
      setLoadingPin(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/user/dashboard')}
              className="p-2 text-gray-600 hover:bg-white rounded-lg transition-colors"
            >
              <FiArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 via-slate-600 to-zinc-700 bg-clip-text text-transparent">
                Pengaturan Profil
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Kelola informasi akun dan keamanan Anda
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center gap-3 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <FiUser size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Informasi Profil</h2>
                <p className="text-sm text-blue-100">Update nama dan email Anda</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
            {/* Username (Read Only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={profileData.username}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Username tidak dapat diubah</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="text-gray-400" size={20} />
                </div>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400" size={20} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loadingProfile}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
              >
                {loadingProfile ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <FiSave size={20} />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
            <div className="flex items-center gap-3 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <FiLock size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Ubah Password</h2>
                <p className="text-sm text-purple-100">Update password untuk keamanan akun</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="p-6 space-y-6">
            {/* PIN Verification (if user has PIN) */}
            {hasPin && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FiLock className="text-white" size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-900">Verifikasi Keamanan</p>
                    <p className="text-xs text-purple-700 mt-1">
                      Masukkan PIN Anda untuk mengubah password sebagai lapisan keamanan tambahan
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-900 mb-2">
                    PIN Verifikasi (6 Digit) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="text-purple-400" size={20} />
                    </div>
                    <input
                      type={showVerificationPin ? 'text' : 'password'}
                      name="verificationPin"
                      value={passwordWithPinData.verificationPin}
                      onChange={handlePasswordChange}
                      className="w-full pl-10 pr-12 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-center text-2xl tracking-widest"
                      placeholder="••••••"
                      maxLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowVerificationPin(!showVerificationPin)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-400 hover:text-purple-600"
                    >
                      {showVerificationPin ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Current Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password Saat Ini <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-purple-600 hover:text-purple-700 hover:underline font-medium"
                >
                  Lupa Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" size={20} />
                </div>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={passwordWithPinData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Masukkan password saat ini"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" size={20} />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordWithPinData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Masukkan password baru (min. 6 karakter)"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konfirmasi Password Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" size={20} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwordWithPinData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ulangi password baru"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            {/* Password Strength Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Tips keamanan:</strong> Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol untuk password yang lebih kuat.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loadingPassword}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
              >
                {loadingPassword ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Mengubah...</span>
                  </>
                ) : (
                  <>
                    <FiLock size={20} />
                    <span>Ubah Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security PIN Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
            <div className="flex items-center gap-3 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <FiLock size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {hasPin ? 'Ubah PIN Keamanan' : 'Buat PIN Keamanan'}
                </h2>
                <p className="text-sm text-green-100">
                  PIN 6 digit untuk mengakses halaman keuangan dan menghapus data
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSetPin} className="p-6 space-y-6">
            {/* PIN Status Info */}
            {hasPin ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>✓ PIN sudah diatur.</strong> Masukkan PIN saat ini untuk verifikasi, kemudian buat PIN baru.
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠ PIN belum diatur.</strong> Buat PIN untuk melindungi akses ke halaman keuangan dan penghapusan data penting.
                </p>
              </div>
            )}

            {/* Current PIN (only if user already has PIN) */}
            {hasPin && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-green-900 mb-2">
                  PIN Saat Ini (Untuk Verifikasi) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-green-400" size={20} />
                  </div>
                  <input
                    type={showCurrentPin ? 'text' : 'password'}
                    name="currentPin"
                    value={pinData.currentPin}
                    onChange={handlePinChange}
                    className="w-full pl-10 pr-12 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-center text-2xl tracking-widest"
                    placeholder="••••••"
                    maxLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-400 hover:text-green-600"
                  >
                    {showCurrentPin ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  🔒 Masukkan PIN saat ini sebagai verifikasi keamanan sebelum mengubah ke PIN baru
                </p>
              </div>
            )}

            {/* PIN Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN Baru (6 Digit) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" size={20} />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  name="pin"
                  value={pinData.pin}
                  onChange={handlePinChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="••••••"
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPin ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Masukkan 6 digit angka (contoh: 123456)</p>
            </div>

            {/* Confirm PIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konfirmasi PIN Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" size={20} />
                </div>
                <input
                  type={showConfirmPin ? 'text' : 'password'}
                  name="confirmPin"
                  value={pinData.confirmPin}
                  onChange={handlePinChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="••••••"
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPin(!showConfirmPin)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPin ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            {/* Current Password for Verification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Saat Ini (Untuk Verifikasi) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" size={20} />
                </div>
                <input
                  type={showPinPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={pinData.currentPassword}
                  onChange={handlePinChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Masukkan password saat ini"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPinPassword(!showPinPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPinPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">📌 Kegunaan PIN:</p>
              <ul className="text-sm text-blue-700 space-y-1 ml-4">
                <li>• Mengakses halaman Dashboard Keuangan</li>
                <li>• Menghapus data klien dari tabel booking</li>
                <li>• Melindungi data penting dari akses tidak sah</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loadingPin}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
              >
                {loadingPin ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>{hasPin ? 'Mengubah...' : 'Membuat...'}</span>
                  </>
                ) : (
                  <>
                    <FiLock size={20} />
                    <span>{hasPin ? 'Ubah PIN' : 'Buat PIN'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Reset Password with PIN Modal */}
      <ResetPasswordWithPinModal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        onSuccess={() => {
          // Clear password form after successful reset
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          setShowResetPasswordModal(false);
        }}
      />
    </div>
  );
};

export default SettingsPage;
