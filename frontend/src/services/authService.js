import api from './api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

const authService = {
  /**
   * Register new user
   */
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        authService.setToken(token);
        authService.setUser(user);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Terjadi kesalahan' };
    }
  },

  /**
   * Login user
   */
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        authService.setToken(token);
        authService.setUser(user);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Terjadi kesalahan' };
    }
  },

  /**
   * Logout user - clear all auth data and session
   */
  logout: () => {
    // Clear all auth-related data from localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('user_created_at');
    localStorage.removeItem('onboarding_completed');
    
    // Clear sessionStorage as well
    sessionStorage.clear();
    
    // Set flag to indicate logout
    sessionStorage.setItem('logged_out', 'true');
    
    // Replace current history state to prevent back button
    window.history.replaceState(null, '', '/login');
    
    // Navigate to login
    window.location.href = '/login';
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    try {
      const response = await api.get('/user/profile');
      
      if (response.data.success) {
        authService.setUser(response.data.data);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Terjadi kesalahan' };
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/user/profile', userData);
      
      if (response.data.success) {
        authService.setUser(response.data.data);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Terjadi kesalahan' };
    }
  },

  /**
   * Change password
   */
  changePassword: async (passwords) => {
    try {
      const response = await api.post('/auth/change-password', passwords);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Terjadi kesalahan' };
    }
  },

  /**
   * Verify token
   */
  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      // Don't automatically logout here - let the caller handle it
      throw error;
    }
  },

  /**
   * Set token to localStorage
   */
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  /**
   * Get token from localStorage
   */
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Set user data to localStorage
   */
  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * Get user data from localStorage
   */
  getUser: () => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  /**
   * Get current user (alias for getUser)
   */
  getCurrentUser: () => {
    return authService.getUser();
  },

  /**
   * Refresh current user data from server
   */
  refreshUser: async () => {
    try {
      const response = await api.get('/user/profile');
      
      if (response.data.success) {
        authService.setUser(response.data.data);
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      return null;
    }
  },

  /**
   * Check if user is authenticated
   * Returns false if user has logged out or no token exists
   */
  isAuthenticated: () => {
    // Check if user has logged out
    if (sessionStorage.getItem('logged_out') === 'true') {
      return false;
    }
    return !!authService.getToken();
  },

  /**
   * Clear logout flag (called when user successfully logs in)
   */
  clearLogoutFlag: () => {
    sessionStorage.removeItem('logged_out');
  },

  /**
   * Check if user has specific role
   */
  hasRole: (role) => {
    const user = authService.getUser();
    return user?.role === role;
  },

  /**
   * Check if user is admin
   */
  isAdmin: () => {
    return authService.hasRole('admin');
  },

  /**
   * Check if user is regular user
   */
  isUser: () => {
    return authService.hasRole('user');
  }
};

export default authService;
