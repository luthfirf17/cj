import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

/**
 * Request Interceptor
 * Automatically attach JWT token to all requests
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request for debugging (remove in production)
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handle common response errors
 */
api.interceptors.response.use(
  (response) => {
    // Log response for debugging (remove in production)
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }
    
    return response;
  },
  (error) => {
    const { response } = error;
    
    // Log error for debugging
    console.error('[API Response Error]', {
      url: error.config?.url,
      status: response?.status,
      message: response?.data?.message || error.message
    });
    
    // Handle specific error codes
    if (response) {
      switch (response.status) {
        case 401:
          // Unauthorized - Token expired or invalid
          console.warn('[Auth] Token expired or invalid. Redirecting to login...');
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          break;
          
        case 403:
          // Forbidden - No permission
          console.warn('[Auth] Access denied. Insufficient permissions.');
          // You can show a toast notification here
          break;
          
        case 404:
          // Not Found
          console.warn('[API] Resource not found:', error.config?.url);
          break;
          
        case 429:
          // Too Many Requests
          console.warn('[API] Too many requests. Please slow down.');
          // You can show a toast notification here
          break;
          
        case 500:
        case 502:
        case 503:
        case 504:
          // Server Error
          console.error('[API] Server error. Please try again later.');
          // You can show a toast notification here
          break;
          
        default:
          console.error('[API] Unexpected error:', response.status);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('[API] No response received. Check your network connection.');
      // You can show a toast notification here
    } else {
      // Something else happened
      console.error('[API] Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
