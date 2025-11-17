import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/format';
import api from '../../services/api';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard/stats');
      setStats(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500/20 border-t-cyan-400 shadow-lg shadow-cyan-500/20"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 animate-pulse"></div>
        </div>
        <div className="ml-4 text-cyan-300 font-mono text-lg animate-pulse">
          LOADING SYSTEM DATA...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30 p-6 backdrop-blur-sm shadow-2xl">
        <div className="flex items-center gap-3">
          <XCircleIcon className="h-8 w-8 text-red-400" />
          <div>
            <h3 className="text-lg font-mono font-bold text-red-300">SYSTEM ERROR</h3>
            <p className="text-red-200 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Users',
      value: stats?.stats?.totalUsers || 0,
      icon: UsersIcon,
      color: 'from-cyan-500 to-blue-600',
      glowColor: 'shadow-cyan-500/30',
      change: stats?.stats?.newUsersThisMonth || 0,
      changeLabel: 'new this month',
      terminalCode: 'USR_COUNT'
    },
    {
      name: 'Active Users',
      value: stats?.stats?.activeUsers || 0,
      icon: CheckCircleIcon,
      color: 'from-emerald-500 to-green-600',
      glowColor: 'shadow-emerald-500/30',
      percentage: stats?.stats?.totalUsers
        ? Math.round((stats.stats.activeUsers / stats.stats.totalUsers) * 100)
        : 0,
      changeLabel: 'of total users',
      terminalCode: 'USR_ACTIVE'
    },
    {
      name: 'Total Bookings',
      value: stats?.stats?.totalBookings || 0,
      icon: ShoppingBagIcon,
      color: 'from-purple-500 to-indigo-600',
      glowColor: 'shadow-purple-500/30',
      terminalCode: 'BOOK_TOTAL'
    },
    {
      name: 'Total Revenue',
      value: formatCurrency(stats?.stats?.totalRevenue || 0),
      icon: CurrencyDollarIcon,
      color: 'from-emerald-500 to-teal-600',
      glowColor: 'shadow-emerald-500/30',
      isRevenue: true,
      terminalCode: 'REV_TOTAL'
    },
    {
      name: 'Total Expenses',
      value: formatCurrency(stats?.stats?.totalExpenses || 0),
      icon: ArrowTrendingDownIcon,
      color: 'from-red-500 to-pink-600',
      glowColor: 'shadow-red-500/30',
      isExpense: true,
      terminalCode: 'EXP_TOTAL'
    },
    {
      name: 'Inactive Users',
      value: stats?.stats?.inactiveUsers || 0,
      icon: XCircleIcon,
      color: 'from-gray-500 to-slate-600',
      glowColor: 'shadow-gray-500/30',
      terminalCode: 'USR_INACTIVE'
    },
  ];

  return (
    <div className="space-y-8 relative">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:30px_30px] animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="relative">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-2 h-8 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full shadow-lg shadow-cyan-500/50"></div>
          <h1 className="text-3xl font-mono font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
            ADMIN DASHBOARD
          </h1>
        </div>
        <p className="text-slate-400 font-mono text-sm ml-6">
          &gt; SYSTEM STATUS: ONLINE | LAST SYNC: {new Date().toLocaleTimeString('id-ID')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <div
            key={stat.name}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 border border-slate-700/50 hover:border-cyan-500/50 backdrop-blur-xl shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500 hover:scale-105 hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Animated Border Glow */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Terminal Code Label */}
            <div className="absolute top-3 right-3 text-xs font-mono text-slate-500 group-hover:text-cyan-400 transition-colors duration-300">
              {stat.terminalCode}
            </div>

            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Icon with Glow */}
                  <div className={`relative p-3 rounded-lg bg-gradient-to-br ${stat.color} shadow-lg ${stat.glowColor} group-hover:scale-110 transition-all duration-300`}>
                    <stat.icon className="h-8 w-8 text-white" />
                    <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  <div>
                    <h3 className="text-sm font-mono text-slate-400 group-hover:text-cyan-300 transition-colors duration-300">
                      {stat.name.toUpperCase()}
                    </h3>
                    <p className="text-2xl font-mono font-bold text-white group-hover:text-cyan-200 transition-colors duration-300">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>

              {/* Change Indicator */}
              {(stat.change !== undefined || stat.percentage !== undefined) && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="flex items-center gap-2">
                    {stat.change !== undefined && (
                      <>
                        <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-mono text-emerald-300">
                          +{stat.change} {stat.changeLabel}
                        </span>
                      </>
                    )}
                    {stat.percentage !== undefined && (
                      <>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-mono text-blue-300">
                          {stat.percentage}% {stat.changeLabel}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Users Table */}
      <div className="rounded-xl bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 border border-slate-700/50 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full"></div>
            <div>
              <h3 className="text-xl font-mono font-bold text-cyan-300">RECENT USERS</h3>
              <p className="text-slate-400 font-mono text-sm">Latest 10 registered users in system</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700/50">
            <thead className="bg-gradient-to-r from-slate-800/30 to-slate-900/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  User Profile
                </th>
                <th className="px-6 py-4 text-left text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Registration
                </th>
              </tr>
            </thead>
            <tbody className="bg-gradient-to-br from-slate-900/20 to-slate-800/20 divide-y divide-slate-700/30">
              {stats?.recentUsers?.length > 0 ? (
                stats.recentUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gradient-to-r hover:from-cyan-500/5 hover:to-blue-500/5 transition-all duration-300 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600 group-hover:border-cyan-500/50 transition-all duration-300">
                            <span className="text-sm font-mono font-bold text-cyan-300">
                              {user.full_name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border border-slate-900 animate-pulse"></div>
                        </div>
                        <div>
                          <div className="text-sm font-mono font-semibold text-white group-hover:text-cyan-200 transition-colors duration-300">
                            {user.full_name}
                          </div>
                          <div className="text-xs font-mono text-slate-400">
                            ID: {user.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-slate-300 group-hover:text-cyan-200 transition-colors duration-300">
                        {user.email}
                      </div>
                      <div className="text-xs font-mono text-slate-500">
                        {user.phone || 'No phone'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-mono font-bold transition-all duration-300 ${
                          user.is_active
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 group-hover:bg-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30 group-hover:bg-red-500/30'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
                        {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-slate-300 group-hover:text-cyan-200 transition-colors duration-300">
                        {new Date(user.created_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-xs font-mono text-slate-500">
                        {new Date(user.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <UsersIcon className="h-12 w-12 text-slate-600" />
                      <div className="text-slate-400 font-mono">NO USERS FOUND</div>
                      <div className="text-xs text-slate-500 font-mono">System database is empty</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Users Table */}
      <div className="rounded-xl bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 border border-slate-700/50 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></div>
            <div>
              <h3 className="text-xl font-mono font-bold text-purple-300">TOP PERFORMERS</h3>
              <p className="text-slate-400 font-mono text-sm">Top 5 users by revenue generation</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700/50">
            <thead className="bg-gradient-to-r from-slate-800/30 to-slate-900/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-4 text-left text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                  User Profile
                </th>
                <th className="px-6 py-4 text-left text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                  Metrics
                </th>
                <th className="px-6 py-4 text-left text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-gradient-to-br from-slate-900/20 to-slate-800/20 divide-y divide-slate-700/30">
              {stats?.topUsers?.length > 0 ? (
                stats.topUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-indigo-500/5 transition-all duration-300 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                          index === 0 ? 'from-yellow-400 to-yellow-600' :
                          index === 1 ? 'from-gray-300 to-gray-500' :
                          index === 2 ? 'from-amber-600 to-amber-800' :
                          'from-slate-500 to-slate-700'
                        } flex items-center justify-center text-white font-mono font-bold shadow-lg`}>
                          {index + 1}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600 group-hover:border-purple-500/50 transition-all duration-300">
                            <span className="text-sm font-mono font-bold text-purple-300">
                              {user.full_name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full border border-slate-900 animate-pulse"></div>
                        </div>
                        <div>
                          <div className="text-sm font-mono font-semibold text-white group-hover:text-purple-200 transition-colors duration-300">
                            {user.full_name}
                          </div>
                          <div className="text-xs font-mono text-slate-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <ShoppingBagIcon className="h-4 w-4 text-cyan-400" />
                          <span className="text-sm font-mono text-slate-300">
                            {user.booking_count || 0} bookings
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserGroupIcon className="h-4 w-4 text-blue-400" />
                          <span className="text-sm font-mono text-slate-300">
                            {user.client_count || 0} clients
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-mono font-bold text-emerald-300 group-hover:text-emerald-200 transition-colors duration-300">
                        {formatCurrency(user.total_revenue || 0)}
                      </div>
                      <div className="text-xs font-mono text-slate-500">
                        Total earnings
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <CurrencyDollarIcon className="h-12 w-12 text-slate-600" />
                      <div className="text-slate-400 font-mono">NO REVENUE DATA</div>
                      <div className="text-xs text-slate-500 font-mono">No transactions recorded yet</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
