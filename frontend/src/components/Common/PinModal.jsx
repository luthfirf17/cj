import React, { useState } from 'react';
import { FiX, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../../services/api';

const PinModal = ({ isOpen, onClose, onSuccess, title = 'Masukkan PIN', message = 'PIN diperlukan untuk melanjutkan' }) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePinChange = (e) => {
    const value = e.target.value;
    // Only allow digits and max 6 characters
    if (value === '' || (/^\d+$/.test(value) && value.length <= 6)) {
      setPin(value);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (pin.length !== 6) {
      setError('PIN harus 6 digit angka');
      return;
    }

    try {
      setLoading(true);
      setError(''); // Clear previous error
      const response = await api.post('/user/verify-pin', { pin });
      
      if (response.data.success) {
        // PIN benar, reset form dan panggil callback
        setPin('');
        setError('');
        onSuccess();
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      
      // Tangani error dengan baik, jangan redirect ke login
      if (error.response?.status === 400 && error.response?.data?.message) {
        // Error validasi (PIN salah, belum diatur, dll)
        setError(error.response.data.message);
      } else if (error.response?.data?.message) {
        // Error lainnya dari backend
        setError(error.response.data.message);
      } else {
        // Error network atau lainnya
        setError('Gagal memverifikasi PIN. Coba lagi.');
      }
      
      // Kosongkan input PIN agar user bisa input ulang
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPin('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm sm:max-w-md w-full overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FiLock size={16} className="sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-lg p-1.5 sm:p-2 transition-colors"
          >
            <FiX size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <p className="text-gray-600 text-center">{message}</p>

          {/* PIN Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              PIN Keamanan (6 Digit)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <FiLock className="text-gray-400" size={16} />
              </div>
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={handlePinChange}
                className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 border ${
                  error ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl sm:text-3xl tracking-widest font-mono`}
                placeholder="••••••"
                maxLength={6}
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPin ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm font-medium text-center flex items-center justify-center gap-2">
                  <FiX className="flex-shrink-0" size={16} />
                  <span>{error}</span>
                </p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800 text-center">
              Lupa PIN? Hubungi administrator atau buat PIN baru di halaman Pengaturan Profil.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || pin.length !== 6}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                  <span>Verifikasi...</span>
                </>
              ) : (
                <>
                  <FiLock size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>Verifikasi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PinModal;
