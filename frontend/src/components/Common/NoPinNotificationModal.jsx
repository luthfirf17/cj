import React from 'react';
import { FiLock, FiAlertCircle, FiSettings } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const NoPinNotificationModal = ({ isOpen, onClose, message = 'Anda belum membuat PIN keamanan' }) => {
  const navigate = useNavigate();

  const handleGoToSettings = () => {
    // Tutup modal terlebih dahulu
    onClose();
    // Kemudian navigasi ke settings
    navigate('/user/settings');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <FiAlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">PIN Belum Diatur</h3>
              <p className="text-sm text-amber-50">Keamanan diperlukan</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <FiLock className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  {message}
                </p>
                <p className="text-xs text-amber-700">
                  Untuk keamanan data Anda, fitur ini memerlukan PIN 6 digit.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium mb-2">
              📌 Apa itu PIN Keamanan?
            </p>
            <ul className="text-xs text-blue-700 space-y-1 ml-4">
              <li>• Melindungi akses ke halaman keuangan</li>
              <li>• Mencegah penghapusan data tidak sah</li>
              <li>• PIN 6 digit angka yang mudah diingat</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleGoToSettings}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 duration-200"
            >
              <FiSettings size={20} />
              <span>Buat PIN Sekarang</span>
            </button>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoPinNotificationModal;
