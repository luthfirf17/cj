import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiCalendar,
  FiUsers,
  FiBriefcase,
  FiDollarSign,
  FiDatabase,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import authService from '../../services/authService';

const UserSidebar = ({ isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();

  const menuItems = [
    { path: '/user/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/user/bookings', icon: FiCalendar, label: 'Booking' },
    { path: '/user/clients', icon: FiUsers, label: 'Klien' },
    { path: '/user/services', icon: FiBriefcase, label: 'Layanan' },
    { path: '/user/financial', icon: FiDollarSign, label: 'Keuangan' },
    { path: '/user/backup', icon: FiDatabase, label: 'Backup Data' },
    { path: '/user/settings', icon: FiSettings, label: 'Pengaturan' },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const closeMobileSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-full bg-white border-r border-gray-200
          transform transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
        `}
      >
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className={`text-xl font-bold text-blue-600 transition-opacity duration-300 ${isCollapsed ? 'lg:hidden' : ''}`}>
            {isCollapsed ? 'CJ' : 'Catat Jasamu'}
          </h1>
          {isCollapsed && (
            <h1 className="hidden lg:block text-xl font-bold text-blue-600">CJ</h1>
          )}
          
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
          
          {/* Desktop Toggle Button */}
          <button
            onClick={setIsCollapsed}
            className="hidden lg:block p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col h-[calc(100vh-4rem)]">
          <div className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobileSidebar}
                className={({ isActive }) => `
                  flex items-center px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                  ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}
                  group relative
                `}
                title={isCollapsed ? item.label : ''}
              >
                <item.icon size={20} className={`${isCollapsed ? 'lg:mr-0' : 'mr-3'} flex-shrink-0`} />
                <span className={`${isCollapsed ? 'lg:hidden' : ''} transition-opacity duration-300`}>
                  {item.label}
                </span>
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="hidden lg:block absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    {item.label}
                    <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </NavLink>
            ))}
          </div>

          {/* Logout Button */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className={`
                flex items-center w-full px-4 py-3 rounded-lg
                text-red-600 hover:bg-red-50 transition-all duration-200
                ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}
                group relative
              `}
              title={isCollapsed ? 'Logout' : ''}
            >
              <FiLogOut size={20} className={`${isCollapsed ? 'lg:mr-0' : 'mr-3'} flex-shrink-0`} />
              <span className={`${isCollapsed ? 'lg:hidden' : ''} transition-opacity duration-300`}>
                Logout
              </span>
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="hidden lg:block absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  Logout
                  <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              )}
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default UserSidebar;
