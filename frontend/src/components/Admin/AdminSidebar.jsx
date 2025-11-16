import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
} from 'react-icons/fi';
import Logo from '../Common/Logo';

const AdminSidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const navigate = useNavigate();

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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
          fixed top-0 left-0 z-30 h-full w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Logo size="sm" showText={true} />
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col h-[calc(100vh-4rem)]">
          <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobileSidebar}
                className={({ isActive }) => `
                  flex items-center px-4 py-3 rounded-lg transition-colors duration-200
                  ${isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <item.icon size={20} className="mr-3" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="
                flex items-center w-full px-4 py-3 rounded-lg
                text-red-600 hover:bg-red-50 transition-colors duration-200
              "
            >
              <FiLogOut size={20} className="mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;
