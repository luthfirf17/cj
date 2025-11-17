import React, { useState, useEffect } from 'react';
import {
  UserCircleIcon,
  KeyIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Profile state
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: ''
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // PIN state
  const [pinData, setPinData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/admin/profile');
      setProfile(response.data.admin);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put('/admin/profile', {
        email: profile.email,
        full_name: profile.full_name,
        phone: profile.phone
      });
      
      // Update localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.email = profile.email;
      user.full_name = profile.full_name;
      localStorage.setItem('user', JSON.stringify(user));

      showMessage('success', 'Profile updated successfully');
      fetchProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      showMessage('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await api.put('/admin/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      showMessage('success', 'Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Error updating password:', err);
      showMessage('error', err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePin = async (e) => {
    e.preventDefault();

    if (pinData.newPin !== pinData.confirmPin) {
      showMessage('error', 'New PINs do not match');
      return;
    }

    if (!/^\d{6}$/.test(pinData.newPin)) {
      showMessage('error', 'PIN must be exactly 6 digits');
      return;
    }

    setLoading(true);

    try {
      await api.put('/admin/pin', {
        currentPin: pinData.currentPin,
        newPin: pinData.newPin
      });

      showMessage('success', 'Security PIN updated successfully');
      setPinData({
        currentPin: '',
        newPin: '',
        confirmPin: ''
      });
    } catch (err) {
      console.error('Error updating PIN:', err);
      showMessage('error', err.response?.data?.message || 'Failed to update PIN');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserCircleIcon },
    { id: 'password', name: 'Password', icon: KeyIcon },
    { id: 'pin', name: 'Security PIN', icon: ShieldCheckIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 via-blue-200 to-slate-300 bg-clip-text text-transparent tracking-wider">
            Admin Settings
          </h1>
          <p className="text-slate-400 text-lg font-medium">
            Manage your admin account settings with terminal precision
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 mx-auto rounded-full"></div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`rounded-xl p-4 border backdrop-blur-md shadow-2xl animate-in slide-in-from-top-2 duration-300 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border-red-500/20 text-red-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <CheckCircleIcon className="h-6 w-6 text-emerald-400" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-red-400" />
              )}
              <p className="text-sm font-semibold">{message.text}</p>
            </div>
          </div>
        )}

        {/* Terminal-like Container */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Terminal Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-400 transition-colors cursor-pointer"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-400 transition-colors cursor-pointer"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-400 transition-colors cursor-pointer"></div>
              </div>
              <div className="text-slate-400 text-sm font-mono">
                admin@terminal:~$
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-700/50 bg-slate-800/50">
            <nav className="flex">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-4 text-sm font-semibold transition-all duration-300 relative group ${
                    activeTab === tab.id
                      ? 'text-cyan-300 bg-slate-700/50 border-b-2 border-cyan-400'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
                  }`}
                >
                  <tab.icon className={`h-5 w-5 transition-all duration-300 ${
                    activeTab === tab.id ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'
                  }`} />
                  {tab.name}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 animate-in slide-in-from-left-1"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-8 animate-in fade-in-0 duration-500">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <UserCircleIcon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200">
                      Profile Information
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="full_name" className="block text-sm font-semibold text-slate-300">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="full_name"
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all duration-300 hover:border-slate-500/70"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-semibold text-slate-300">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all duration-300 hover:border-slate-500/70"
                        placeholder="Enter your email"
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="phone" className="block text-sm font-semibold text-slate-300">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all duration-300 hover:border-slate-500/70"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-700/50">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </div>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handleUpdatePassword} className="space-y-8 animate-in fade-in-0 duration-500">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <KeyIcon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200">
                      Change Password
                    </h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="currentPassword" className="block text-sm font-semibold text-slate-300">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition-all duration-300 hover:border-slate-500/70"
                        placeholder="Enter current password"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-300">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition-all duration-300 hover:border-slate-500/70"
                          placeholder="Enter new password"
                          required
                          minLength={6}
                        />
                        <p className="text-xs text-slate-500">
                          Must be at least 6 characters
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-300">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition-all duration-300 hover:border-slate-500/70"
                          placeholder="Confirm new password"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-700/50">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Updating...
                      </div>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* PIN Tab */}
            {activeTab === 'pin' && (
              <form onSubmit={handleUpdatePin} className="space-y-8 animate-in fade-in-0 duration-500">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                      <ShieldCheckIcon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200">
                      Change Security PIN
                    </h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="currentPin" className="block text-sm font-semibold text-slate-300">
                        Current PIN
                      </label>
                      <input
                        type="password"
                        id="currentPin"
                        value={pinData.currentPin}
                        onChange={(e) => setPinData({ ...pinData, currentPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all duration-300 hover:border-slate-500/70 font-mono text-center tracking-widest"
                        placeholder="000000"
                        required
                        pattern="\d{6}"
                        maxLength={6}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="newPin" className="block text-sm font-semibold text-slate-300">
                          New PIN
                        </label>
                        <input
                          type="password"
                          id="newPin"
                          value={pinData.newPin}
                          onChange={(e) => setPinData({ ...pinData, newPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all duration-300 hover:border-slate-500/70 font-mono text-center tracking-widest"
                          placeholder="000000"
                          required
                          pattern="\d{6}"
                          maxLength={6}
                        />
                        <p className="text-xs text-slate-500">
                          Must be exactly 6 digits
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="confirmPin" className="block text-sm font-semibold text-slate-300">
                          Confirm New PIN
                        </label>
                        <input
                          type="password"
                          id="confirmPin"
                          value={pinData.confirmPin}
                          onChange={(e) => setPinData({ ...pinData, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all duration-300 hover:border-slate-500/70 font-mono text-center tracking-widest"
                          placeholder="000000"
                          required
                          pattern="\d{6}"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                      <ShieldCheckIcon className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-300 mb-1">
                          Security Notice
                        </p>
                        <p className="text-sm text-amber-200/80">
                          Your security PIN is used to access sensitive features. Make sure to remember it and keep it secure.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-700/50">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Updating...
                      </div>
                    ) : (
                      'Update PIN'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
