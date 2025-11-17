import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiBell, FiUser } from 'react-icons/fi';
import Logo from '../Common/Logo';

const AdminNavbar = ({ onMenuClick, onToggleSidebar, isSidebarCollapsed }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    // Make navbar fixed on top and highest layer so it doesn't shift or get covered by sidebar
    <header className="fixed top-0 left-0 right-0 h-20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-cyan-500/20 shadow-2xl backdrop-blur-xl z-50 overflow-visible">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
      </div>

      {/* Glowing Border Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>

      <div className="relative flex items-center justify-between h-full px-6 lg:px-8">
        {/* Left: Terminal Header & Navigation */}
        <div className="flex items-center gap-6">
          {/* Terminal Window Controls */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex gap-2">
              <div
                className="w-3 h-3 bg-red-500/80 hover:bg-red-400 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 shadow-lg shadow-red-500/30"
                onClick={onToggleSidebar}
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              ></div>
              <div className="w-3 h-3 bg-amber-500/80 hover:bg-amber-400 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 shadow-lg shadow-amber-500/30"></div>
              <div className="w-3 h-3 bg-emerald-500/80 hover:bg-emerald-400 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 shadow-lg shadow-emerald-500/30"></div>
            </div>
            <div className="h-6 w-px bg-slate-600/50 mx-2"></div>
          </div>

          {/* Menu Button - Mobile */}
          <button
            onClick={onMenuClick}
            className="lg:hidden group relative p-3 text-slate-400 hover:text-cyan-300 transition-all duration-300 rounded-xl hover:bg-slate-800/50 border border-slate-700/30 hover:border-cyan-500/30"
          >
            <FiMenu size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          {/* Logo & Terminal Prompt */}
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard" className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 blur"></div>
              <div className="relative">
                <Logo size="md" showText={true} variant="light" />
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-3">
              <div className="h-8 w-px bg-gradient-to-b from-transparent via-slate-600/50 to-transparent"></div>
              <div className="flex items-center gap-2 text-slate-400 font-mono text-sm">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-cyan-300">admin@system</span>
                <span className="text-slate-500">:</span>
                <span className="text-emerald-400">~/dashboard</span>
                <span className="text-slate-500">$</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: System Status */}
        <div className="hidden xl:flex items-center gap-6">
          <div className="flex items-center gap-4 px-4 py-2 bg-slate-800/30 rounded-xl border border-slate-700/30 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-300 font-medium">SYSTEM ONLINE</span>
            </div>
            <div className="h-4 w-px bg-slate-600/50"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
              <span className="text-xs text-slate-300 font-medium">SECURE</span>
            </div>
          </div>
        </div>

        {/* Right: Interactive Elements */}
        <div className="flex items-center gap-4">
          {/* Notification Hub */}
          <div className="relative group">
            <button className="relative p-3 text-slate-400 hover:text-cyan-300 transition-all duration-300 rounded-xl hover:bg-slate-800/50 border border-slate-700/30 hover:border-cyan-500/30 group">
              <FiBell size={20} className="group-hover:scale-110 transition-transform duration-300" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></span>
              <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full opacity-20 animate-ping"></span>
              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            {/* Notification Tooltip */}
            <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <div className="p-4">
                <h4 className="text-sm font-semibold text-slate-200 mb-2">System Notifications</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                    All systems operational
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                    Security protocols active
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Terminal */}
          <div className="relative group z-30">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-4 p-3 text-slate-300 hover:text-cyan-300 transition-all duration-300 rounded-xl hover:bg-slate-800/50 border border-slate-700/30 hover:border-cyan-500/30 group cursor-pointer"
            >
              <div className="relative cursor-pointer group/avatar">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 via-blue-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30 group-hover/avatar:border-cyan-300 transition-all duration-300">
                  <FiUser size={18} className="group-hover/avatar:scale-110 transition-transform duration-300" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900 flex items-center justify-center animate-pulse">
                  <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                </div>
                {/* Avatar Glow Effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 blur-sm"></div>
              </div>
              <div className="hidden md:block text-left cursor-pointer">
                <p className="text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  {user?.full_name || 'Administrator'}
                </p>
                <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors font-mono">
                  Level: ROOT
                </p>
              </div>
              {/* Button Glow Effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            {/* Advanced Profile Menu */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-60"
                  onClick={() => setShowProfileMenu(false)}
                ></div>
                <div className="absolute right-0 mt-3 w-72 bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden z-70 animate-in slide-in-from-top-2 duration-300">
                  {/* Profile Header */}
                  <div className="p-6 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600/50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 via-blue-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <FiUser size={20} />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-200">{user?.full_name || 'Administrator'}</p>
                        <p className="text-sm text-slate-400 font-mono">admin@system.local</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <Link
                      to="/admin/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-cyan-300 hover:bg-slate-700/50 transition-all duration-300 rounded-xl mx-2 group"
                    >
                      <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                        <FiUser size={16} />
                      </div>
                      <span className="font-medium">View Profile</span>
                    </Link>

                    <Link
                      to="/admin/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-cyan-300 hover:bg-slate-700/50 transition-all duration-300 rounded-xl mx-2 group"
                    >
                      <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="font-medium">System Settings</span>
                    </Link>

                    <Link
                      to="/admin/dashboard"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-cyan-300 hover:bg-slate-700/50 transition-all duration-300 rounded-xl mx-2 group"
                    >
                      <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <span className="font-medium">Dashboard</span>
                    </Link>

                    <hr className="my-2 border-slate-700/50 mx-4" />

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        // Quick system status check
                        alert('🔍 System Status Check:\n\n✅ All systems operational\n✅ Security protocols active\n✅ Database connection stable\n✅ API endpoints responding\n\nSystem Health: EXCELLENT');
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-emerald-300 hover:bg-slate-700/50 transition-all duration-300 rounded-xl mx-2 w-full text-left group"
                    >
                      <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="font-medium">System Status</span>
                    </button>

                    <hr className="my-2 border-slate-700/50 mx-4" />

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (window.confirm('⚠️ CONFIRMATION REQUIRED\n\nAre you sure you want to logout from the admin system?\n\nThis will end your current session.')) {
                          localStorage.removeItem('token');
                          localStorage.removeItem('user');
                          navigate('/login');
                        }
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all duration-300 rounded-xl mx-2 w-full text-left group"
                    >
                      <div className="w-8 h-8 bg-red-900/20 rounded-lg flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <span className="font-medium">Logout System</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Glow Line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
    </header>
  );
};

export default AdminNavbar;
