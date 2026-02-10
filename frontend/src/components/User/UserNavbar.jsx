import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  FiBarChart2,
  FiDownload,
  FiShield,
  FiSettings,
  FiLogOut,
  FiHome,
  FiClipboard,
  FiUsers,
  FiFileText
} from 'react-icons/fi';
import authService from '../../services/authService';
import api from '../../services/api';
import CompanySettingsModal from './CompanySettingsModal';
import Logo from '../Common/Logo';

const UserNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Add useLocation
  const [user, setUser] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Check if current page is dashboard
  const isDashboard = location.pathname === '/user/dashboard';

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    fetchPendingCount();
  }, []);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      console.log('🔄 Navbar: Profile updated event received', event.detail);
      setUser(event.detail);
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Fetch pending submissions count
  const fetchPendingCount = async () => {
    try {
      const response = await api.get('/user/client-submissions/pending-count');
      if (response.data.success) {
        setPendingCount(response.data.data.count);
      }
    } catch (error) {
      console.log('Error fetching pending count:', error);
    }
  };

  // Close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location.pathname]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleCompanySettingsSaved = () => {
    console.log('Company settings saved successfully');
  };

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  const menuItems = [
    {
      path: '/user/dashboard',
      label: 'Dashboard',
      icon: FiHome,
      description: 'Beranda & Ringkasan'
    },
    {
      path: '/user/clients',
      label: 'Informasi Client',
      icon: FiUsers,
      description: 'Kelola Data Client'
    },
    {
      path: '/user/client-submissions',
      label: 'Konfirmasi Klien',
      icon: FiClipboard,
      description: 'Kelola Konfirmasi Booking',
      badge: pendingCount > 0 ? (pendingCount > 9 ? '9+' : pendingCount) : null
    },
    {
      path: '/user/financial',
      label: 'Keuangan',
      icon: FiBarChart2,
      description: 'Statistik & Laporan'
    },
    {
      path: '/user/backup',
      label: 'Backup Data',
      icon: FiDownload,
      description: 'Backup & Restore'
    },
    {
      path: '/user/settings',
      label: 'Keamanan',
      icon: FiShield,
      description: 'PIN & Pengaturan'
    }
  ];

  const handleMenuClick = (path) => {
    setIsDropdownOpen(false);
    navigate(path);
  };

  // Get first name for mobile display
  const getFirstName = (name) => {
    if (!name) return 'User';
    return name.split(' ')[0];
  };

  return (
    <header className="bg-gradient-to-r from-[#1a2744] via-[#2c3e63] to-[#1a2744] border-b border-gray-700 fixed top-0 left-0 right-0 z-50 shadow-lg">
      <div className="px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-12 xs:h-14 sm:h-14 md:h-16 lg:h-18">
          {/* Left: Logo - Always show with text */}
          <div className="flex items-center flex-shrink-0">
            <NavLink to="/user/dashboard" className="group">
              {/* Mobile (< 640px): Small logo with text */}
              <div className="sm:hidden">
                <Logo size="sm" showText={true} />
              </div>
              {/* Mobile/Tablet (640px - 768px): Small logo with text */}
              <div className="hidden sm:block md:hidden">
                <Logo size="sm" showText={true} />
              </div>
              {/* Tablet and up (768px - 1024px): Medium logo with text */}
              <div className="hidden md:block lg:hidden">
                <Logo size="md" showText={true} />
              </div>
              {/* Desktop (1024px+): Large logo with text */}
              <div className="hidden lg:block">
                <Logo size="lg" showText={true} />
              </div>
            </NavLink>
          </div>

          {/* Center: Greeting - Show first name only on mobile */}
          <div className="flex flex-1 justify-center px-1 xs:px-2 sm:px-4 min-w-0">
            {/* Mobile: Show "Halo, FirstName" */}
            <span className="sm:hidden text-[11px] xs:text-xs text-white/90 font-medium truncate">
              Halo, {getFirstName(user?.name || user?.full_name)}
            </span>
            {/* Tablet+: Show full name */}
            <span className="hidden sm:block text-sm md:text-base lg:text-lg text-white/90 font-medium truncate">
              Halo, {user?.name || user?.full_name || 'User'}
            </span>
          </div>

          {/* Right: Mobile Menu Button with animation */}
          <div className="lg:hidden relative dropdown-container flex-shrink-0">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`relative p-2.5 sm:p-3 rounded-xl transition-all duration-300 cursor-pointer touch-manipulation
                ${isDropdownOpen 
                  ? 'bg-white/20 text-white rotate-0' 
                  : 'text-white hover:bg-white/10 active:bg-white/20'
                }`}
              aria-label="Menu"
              aria-expanded={isDropdownOpen}
            >
              {/* Animated hamburger/close icon */}
              <div className="relative w-[22px] h-[22px] flex items-center justify-center">
                {/* Top line */}
                <span 
                  className={`absolute h-0.5 bg-current rounded-full transition-all duration-300 ease-out
                    ${isDropdownOpen 
                      ? 'w-5 rotate-45 translate-y-0' 
                      : 'w-5 -translate-y-1.5'
                    }`}
                />
                {/* Middle line */}
                <span 
                  className={`absolute h-0.5 w-5 bg-current rounded-full transition-all duration-300 ease-out
                    ${isDropdownOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                    }`}
                />
                {/* Bottom line */}
                <span 
                  className={`absolute h-0.5 bg-current rounded-full transition-all duration-300 ease-out
                    ${isDropdownOpen 
                      ? 'w-5 -rotate-45 translate-y-0' 
                      : 'w-5 translate-y-1.5'
                    }`}
                />
              </div>
              
              {/* Badge indicator on menu button */}
              {pendingCount > 0 && !isDropdownOpen && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse shadow-lg">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Full Screen Menu Overlay */}
      <div 
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${
          isDropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`} 
        style={{ top: '56px' }}
      >
        {/* Backdrop with fade animation */}
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            isDropdownOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsDropdownOpen(false)}
        />
        
        {/* Menu Panel - Slide from right with smooth animation */}
        <div 
          className={`absolute right-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-white shadow-2xl overflow-hidden flex flex-col
            transition-transform duration-300 ease-out ${
            isDropdownOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* User Info Header */}
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2c3e63] px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-white/20">
                {(user?.name || user?.full_name)?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate text-base">
                  {user?.name || user?.full_name || 'User'}
                </p>
                <p className="text-white/70 text-sm truncate">
                  {user?.email || ''}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items with staggered animation */}
          <div className="flex-1 overflow-y-auto py-2 mobile-menu-scroll">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => handleMenuClick(item.path)}
                  className={`
                    group w-full flex items-center gap-4 px-5 py-3.5 text-left 
                    transition-all duration-200 ease-out touch-manipulation 
                    active:scale-[0.98] relative overflow-hidden
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500' 
                      : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100 border-l-4 border-transparent hover:border-gray-300'
                    }
                  `}
                  style={{
                    transitionDelay: isDropdownOpen ? `${index * 30}ms` : '0ms',
                    transform: isDropdownOpen ? 'translateX(0)' : 'translateX(20px)',
                    opacity: isDropdownOpen ? 1 : 0
                  }}
                >
                  {/* Ripple effect background */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 
                    transform scale-x-0 group-active:scale-x-100 transition-transform duration-300 origin-left`} 
                  />
                  
                  {/* Icon with bounce animation on active */}
                  <div className={`relative z-10 p-2 rounded-lg transition-all duration-200 
                    ${isActive 
                      ? 'bg-blue-100 text-blue-600 shadow-sm' 
                      : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700'
                    }`}
                  >
                    <Icon size={20} className="transition-transform duration-200 group-active:scale-90" />
                  </div>
                  
                  <span className="relative z-10 flex-1 font-medium text-[15px] transition-colors duration-200">
                    {item.label}
                  </span>
                  
                  {/* Badge with pulse animation */}
                  {item.badge && (
                    <span className="relative z-10 bg-red-500 text-white text-xs font-bold rounded-full px-2.5 py-1 min-w-[24px] text-center animate-pulse shadow-sm">
                      {item.badge}
                    </span>
                  )}
                  
                  {/* Active indicator arrow */}
                  {isActive && (
                    <div className="relative z-10 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Actions with subtle divider */}
          <div className="border-t border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100">
            {/* Company Settings */}
            <button
              onClick={() => {
                setShowCompanyModal(true);
                setIsDropdownOpen(false);
              }}
              className="group w-full flex items-center gap-4 px-5 py-3.5 text-left text-gray-700 
                hover:bg-white active:bg-gray-100 transition-all duration-200 touch-manipulation relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-gray-500/10 
                transform scale-x-0 group-active:scale-x-100 transition-transform duration-300 origin-left" 
              />
              <div className="relative z-10 p-2 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-gray-200 transition-colors duration-200">
                <FiSettings size={20} className="transition-transform duration-300 group-hover:rotate-90" />
              </div>
              <span className="relative z-10 flex-1 font-medium text-[15px]">Pengaturan</span>
            </button>

            {/* Privacy Policy */}
            <button
              onClick={() => {
                navigate('/user/privacy-policy');
                setIsDropdownOpen(false);
              }}
              className="group w-full flex items-center gap-4 px-5 py-3.5 text-left text-gray-700 
                hover:bg-white active:bg-gray-100 transition-all duration-200 touch-manipulation relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-blue-500/10 
                transform scale-x-0 group-active:scale-x-100 transition-transform duration-300 origin-left" 
              />
              <div className="relative z-10 p-2 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-gray-200 transition-colors duration-200">
                <FiShield size={20} className="transition-transform duration-200 group-hover:scale-110" />
              </div>
              <span className="relative z-10 flex-1 font-medium text-[15px]">Kebijakan Privasi</span>
            </button>

            {/* Terms of Service */}
            <button
              onClick={() => {
                navigate('/user/terms-of-service');
                setIsDropdownOpen(false);
              }}
              className="group w-full flex items-center gap-4 px-5 py-3.5 text-left text-gray-700 
                hover:bg-white active:bg-gray-100 transition-all duration-200 touch-manipulation relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-green-500/10 
                transform scale-x-0 group-active:scale-x-100 transition-transform duration-300 origin-left" 
              />
              <div className="relative z-10 p-2 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-gray-200 transition-colors duration-200">
                <FiFileText size={20} className="transition-transform duration-200 group-hover:scale-110" />
              </div>
              <span className="relative z-10 flex-1 font-medium text-[15px]">Syarat & Ketentuan</span>
            </button>

            {/* Logout with red accent */}
            <button
              onClick={handleLogout}
              className="group w-full flex items-center gap-4 px-5 py-3.5 text-left text-red-600 
                hover:bg-red-50 active:bg-red-100 transition-all duration-200 touch-manipulation 
                border-t border-gray-200 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-500/5 
                transform scale-x-0 group-active:scale-x-100 transition-transform duration-300 origin-left" 
              />
              <div className="relative z-10 p-2 rounded-lg bg-red-50 text-red-500 group-hover:bg-red-100 transition-colors duration-200">
                <FiLogOut size={20} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </div>
              <span className="relative z-10 flex-1 font-medium text-[15px]">Keluar</span>
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
