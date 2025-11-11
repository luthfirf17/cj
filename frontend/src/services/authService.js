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
   * Logout user
   */
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/login';
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      
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
      const response = await api.put('/auth/profile', userData);
      
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
      authService.logout();
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
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    return !!authService.getToken();
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
