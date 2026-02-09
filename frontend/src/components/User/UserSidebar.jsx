import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiClipboard,
  FiBarChart2,
  FiDownload,
  FiShield,
  FiSettings,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiUsers
} from 'react-icons/fi';
import authService from '../../services/authService';
import api from '../../services/api';
import CompanySettingsModal from './CompanySettingsModal';

const UserSidebar = ({ isCollapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const menuRef = useRef(null);

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

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    fetchPendingCount();
  }, []);

  // Update active index based on current path
  useEffect(() => {
    const currentIndex = menuItems.findIndex(item => item.path === location.pathname);
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      console.log('🔄 Sidebar: Profile updated event received', event.detail);
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

  // Auto-close modal saat route berubah
  useEffect(() => {
    setShowCompanyModal(false);
    fetchPendingCount();
  }, [location.pathname]);

  const handleCompanySettingsSaved = () => {
    console.log('Company settings saved successfully');
  };

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  const handleMenuClick = (path, index) => {
    setActiveIndex(index);
    setShowCompanyModal(false);
    navigate(path);
  };

  return (
    <>
      {/* Sidebar - Only visible on desktop (lg+) - Seamlessly connected to navbar */}
      <div 
        className={`
          hidden lg:flex lg:flex-col fixed left-0 top-0 h-screen
          bg-gradient-to-b from-[#1a2744] via-[#2c3e63] to-[#1a2744]
          shadow-2xl z-40 
          transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isCollapsed ? 'overflow-visible' : ''}
        `}
        style={{ width: isCollapsed ? '80px' : '240px' }}
      >
        {/* Header - Match navbar height (72px) for seamless connection */}
        <div 
          className={`
            flex items-center h-[72px] border-b border-white/10
            ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}
          `}
        >
          {/* Mini Logo/Avatar when collapsed */}
          {isCollapsed ? (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center ring-2 ring-white/20">
              <span className="text-white font-bold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'C'}
              </span>
            </div>
          ) : (
            <>
              {/* User Info when expanded */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center ring-2 ring-white/20 flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-white/60 truncate">
                    {user?.email || ''}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Toggle Button - Floating on sidebar edge */}
        <button
          onClick={() => onToggleCollapse()}
          className={`
            absolute top-[90px] -right-3 z-50
            w-6 h-6 rounded-full 
            bg-[#2c3e63] hover:bg-blue-500
            border-2 border-white/20 hover:border-white/40
            flex items-center justify-center
            shadow-lg shadow-black/20
            transition-all duration-300 ease-out cursor-pointer
            group
          `}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <FiChevronRight size={14} className="text-white/70 group-hover:text-white transition-colors" />
          ) : (
            <FiChevronLeft size={14} className="text-white/70 group-hover:text-white transition-colors" />
          )}
        </button>

        {/* Navigation Menu */}
        <nav className={`flex-1 py-4 ${isCollapsed ? 'overflow-visible' : 'overflow-y-auto overflow-x-hidden'}`} ref={menuRef}>
          {/* Collapsed Mode - Minimalist Design */}
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2 px-4">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <div key={item.path} className="relative w-full">
                    {/* Active Indicator - Minimal left bar */}
                    {isActive && (
                      <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-r-full"
                      />
                    )}
                    
                    <button
                      onClick={() => handleMenuClick(item.path, index)}
                      className={`
                        relative w-full h-12 rounded-xl flex items-center justify-center
                        cursor-pointer transition-all duration-300 ease-out
                        ${isActive 
                          ? 'bg-blue-500/20 text-blue-300 shadow-lg shadow-blue-500/20' 
                          : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                        }
                      `}
                      title={item.label}
                    >
                      <Icon
                        size={20}
                        className="transition-all duration-300 ease-out"
                      />
                      
                      {/* Badge */}
                      {item.badge && (
                        <span 
                          className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Expanded Mode - Full menu with labels */
            <div className="px-3 space-y-1">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => handleMenuClick(item.path, index)}
                    className={`
                      group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                      cursor-pointer transition-all duration-300 ease-out
                      ${isActive 
                        ? 'bg-white/15 text-white' 
                        : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                      }
                    `}
                  >
                    {/* Active indicator bar */}
                    <div 
                      className={`
                        absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full
                        transition-all duration-500 ease-out
                        ${isActive ? 'h-6 bg-blue-400' : 'h-0 bg-transparent'}
                      `}
                    />
                    
                    {/* Icon container */}
                    <div 
                      className={`
                        p-2 rounded-lg transition-all duration-300
                        ${isActive 
                          ? 'bg-blue-500/30 text-blue-300' 
                          : 'bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white/80'
                        }
                      `}
                    >
                      <Icon size={18} />
                    </div>

                    {/* Label */}
                    <span className="flex-1 text-left text-sm font-medium">
                      {item.label}
                    </span>

                    {/* Badge */}
                    {item.badge && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer Actions */}
        <div className={`p-3 border-t border-white/10 ${isCollapsed ? 'flex flex-col items-center gap-1' : ''}`}>
          {/* Company Settings */}
          <button
            onClick={() => setShowCompanyModal(true)}
            className={`
              group relative cursor-pointer
              transition-all duration-300 ease-out
              ${isCollapsed 
                ? 'w-12 h-12 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10'
                : 'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/8 hover:text-white/90 mb-1'
              }
            `}
            title={isCollapsed ? 'Pengaturan' : ''}
          >
            {!isCollapsed && (
              <div className="p-2 rounded-lg bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white/80 transition-all duration-300">
                <FiSettings size={18} className="transition-transform duration-700 group-hover:rotate-180" />
              </div>
            )}
            {isCollapsed && (
              <FiSettings size={20} className="transition-transform duration-700 group-hover:rotate-180" />
            )}
            {!isCollapsed && (
              <span className="flex-1 text-left text-sm font-medium">Pengaturan</span>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`
              group relative cursor-pointer
              transition-all duration-300 ease-out
              ${isCollapsed 
                ? 'w-12 h-12 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10'
                : 'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-red-500/10 hover:text-red-400'
              }
            `}
            title={isCollapsed ? 'Logout' : ''}
          >
            {!isCollapsed && (
              <div className="p-2 rounded-lg bg-white/5 text-white/50 group-hover:bg-red-500/20 group-hover:text-red-400 transition-all duration-300">
                <FiLogOut size={18} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </div>
            )}
            {isCollapsed && (
              <FiLogOut size={20} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            )}
            {!isCollapsed && (
              <span className="flex-1 text-left text-sm font-medium">Logout</span>
            )}
          </button>
        </div>
      </div>

      {/* Company Settings Modal */}
      <CompanySettingsModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        onSuccess={handleCompanySettingsSaved}
      />
    </>
  );
};

export default UserSidebar;