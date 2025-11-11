import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  FiBarChart2,
  FiDownload,
  FiShield,
  FiSettings,
  FiLogOut,
  FiHome
} from 'react-icons/fi';
import authService from '../../services/authService';
import CompanySettingsModal from './CompanySettingsModal';
import Logo from '../Common/Logo';

const UserNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Add useLocation
  const [user, setUser] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // Check if current page is dashboard
  const isDashboard = location.pathname === '/user/dashboard';

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  // ✅ FIX: Auto-close modal saat route berubah
  useEffect(() => {
    setShowCompanyModal(false);
  }, [location.pathname]);

  const handleCompanySettingsSaved = () => {
    console.log('Company settings saved successfully');
  };

  return (
    <header className="bg-gradient-to-r from-[#1a2744] via-[#2c3e63] to-[#1a2744] border-b border-gray-700 sticky top-0 z-30 shadow-lg">
      <div className="px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div className="flex items-center">
            <NavLink to="/user/dashboard" className="group">
              <Logo size="lg" showText={true} />
            </NavLink>
          </div>

          {/* Center: Greeting */}
          <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
            <span className="text-sm text-white/90 font-medium">
              Halo, {user?.full_name || 'User'}
            </span>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-2">
            {/* Home/Dashboard Button - Only show when NOT on dashboard */}
            {!isDashboard && (
              <button 
                onClick={() => navigate('/user/dashboard')}
                className="flex items-center gap-2 px-3 py-2 text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                title="Kembali ke Dashboard"
              >
                <FiHome size={18} />
                <span className="text-sm font-medium hidden sm:inline">Dashboard</span>
              </button>
            )}

            {/* Keuangan */}
            <button 
              onClick={() => {
                setShowCompanyModal(false); // ✅ Close modal before navigate
                navigate('/user/financial');
              }}
              className="p-2 text-gray-300 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-all duration-200"
              title="Keuangan & Statistik"
            >
              <FiBarChart2 size={20} />
            </button>

            {/* Backup Data */}
            <button 
              onClick={() => {
                setShowCompanyModal(false); // ✅ Close modal before navigate
                navigate('/user/backup');
              }}
              className="p-2 text-gray-300 hover:text-green-400 hover:bg-white/10 rounded-lg transition-all duration-200"
              title="Backup & Restore Data"
            >
              <FiDownload size={20} />
            </button>

            {/* Security & PIN - Navigate to Settings Page */}
            <button 
              onClick={() => {
                setShowCompanyModal(false); // ✅ Close modal before navigate
                navigate('/user/settings');
              }}
              className="p-2 text-gray-300 hover:text-purple-400 hover:bg-white/10 rounded-lg transition-all duration-200"
              title="Keamanan & PIN"
            >
              <FiShield size={20} />
            </button>

            {/* Company Settings - Open Modal */}
            <button 
              onClick={() => setShowCompanyModal(true)}
              className="p-2 text-gray-300 hover:text-yellow-400 hover:bg-white/10 rounded-lg transition-all duration-200"
              title="Pengaturan Perusahaan"
            >
              <FiSettings size={20} />
            </button>

            {/* Logout */}
            <button 
              onClick={() => {
                authService.logout();
                window.location.href = '/login';
              }}
              className="p-2 text-gray-300 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all duration-200"
              title="Logout"
            >
              <FiLogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Company Settings Modal */}
      <CompanySettingsModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        onSuccess={handleCompanySettingsSaved}
      />
    </header>
  );
};

export default UserNavbar;
