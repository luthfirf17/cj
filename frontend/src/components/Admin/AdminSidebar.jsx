import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiBriefcase,
  FiDollarSign,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiX,
  FiCloud,
  FiTerminal,
  FiShield,
  FiDatabase,
} from 'react-icons/fi';
import Logo from '../Common/Logo';

const AdminSidebar = ({ isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/admin/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/admin/clients', icon: FiUsers, label: 'Klien' },
    { path: '/admin/services', icon: FiBriefcase, label: 'Layanan' },
    { path: '/admin/transactions', icon: FiDollarSign, label: 'Transaksi' },
    { path: '/admin/reports', icon: FiBarChart2, label: 'Laporan' },
    { path: '/admin/backup-restore', icon: FiCloud, label: 'Backup & Restore' },
    { path: '/admin/settings', icon: FiSettings, label: 'Pengaturan' },
  ];

  const handleLogout = () => {
    if (window.confirm('⚠️ CONFIRMATION REQUIRED\n\nAre you sure you want to logout from the admin system?\n\nThis will end your current session.')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const closeMobileSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-20 left-0 z-20 h-[calc(100vh-5rem)] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-r border-cyan-500/20
          transform transition-all duration-300 ease-in-out shadow-2xl backdrop-blur-xl overflow-hidden
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
        `}
      >
        {/* Animated Background Grid */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        </div>

        {/* Glowing Border Effect */}
        <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-50"></div>

        {/* Header */}
        <div className={`flex items-center justify-between h-20 px-6 border-b border-slate-700/30 relative ${isCollapsed ? 'lg:justify-center' : ''}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <Logo size="sm" showText={true} variant="light" />
            </div>
          )}

          {isCollapsed && (
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex items-center justify-center w-full cursor-pointer group/terminal"
              title="Expand Sidebar"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 via-blue-600 to-slate-700 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30 group-hover/terminal:border-cyan-300 transition-all duration-300 group-hover/terminal:scale-110">
                <FiTerminal size={16} className="text-slate-200 group-hover/terminal:text-cyan-200 transition-colors duration-300" />
              </div>
            </button>
          )}

          {/* Collapse Button - Desktop Expanded */}
          {!isCollapsed && (
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex items-center justify-center w-8 h-8 text-slate-400 hover:text-cyan-300 transition-all duration-300 rounded-lg hover:bg-slate-800/50 hover:scale-110"
              title="Collapse Sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Close Button - Mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-cyan-300 transition-colors duration-300 p-2 rounded-lg hover:bg-slate-800/50"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col h-full relative">
          <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const baseClasses = "group relative flex items-center px-4 py-3 rounded-xl transition-all duration-300 overflow-hidden";
              const activeClasses = isActive
                ? "bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                : "text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50 border border-transparent hover:border-cyan-500/20";
              const collapsedClasses = isCollapsed ? "lg:justify-center lg:px-3" : "";

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileSidebar}
                  className={`${baseClasses} ${activeClasses} ${collapsedClasses}`}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-cyan-600"></div>
                  )}

                  {/* Icon */}
                  <div className={`relative flex items-center justify-center ${isCollapsed ? 'w-8 h-8' : 'w-8 h-8 mr-3'}`}>
                    <item.icon size={isCollapsed ? 18 : 20} className={`transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                    {/* Icon Glow Effect */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                  </div>

                  {/* Label */}
                  {!isCollapsed && (
                    <span className="font-medium relative z-10">{item.label}</span>
                  )}

                  {/* Hover Glow */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </NavLink>
              );
            })}
          </div>

          {/* System Status - Desktop */}
          {!isCollapsed && (
            <div className="hidden lg:block px-4 mb-4">
              <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-300 font-medium">SYSTEM STATUS</span>
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <FiShield size={12} />
                    <span>Security: ACTIVE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiDatabase size={12} />
                    <span>Database: ONLINE</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div className={`p-4 border-t border-slate-700/30 ${isCollapsed ? 'lg:px-2' : ''}`}>
            <button
              onClick={handleLogout}
              className={`
                group relative flex items-center w-full rounded-xl transition-all duration-300 overflow-hidden
                text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-transparent hover:border-red-500/30
                ${isCollapsed ? 'lg:justify-center lg:px-3 py-3' : 'px-4 py-3'}
              `}
            >
              {/* Icon */}
              <div className={`
                relative flex items-center justify-center
                ${isCollapsed ? 'w-8 h-8' : 'w-8 h-8 mr-3'}
              `}>
                <FiLogOut size={isCollapsed ? 18 : 20} className="transition-all duration-300 group-hover:scale-110" />
                {/* Icon Glow Effect */}
                <div className="absolute inset-0 rounded-lg bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              </div>

              {/* Label */}
              {!isCollapsed && (
                <span className="font-medium relative z-10">Logout System</span>
              )}

              {/* Hover Glow */}
              <div className="absolute inset-0 rounded-xl bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;
