// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
}

// Transaction Status
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

export const TRANSACTION_STATUS_LABELS = {
  pending: 'Menunggu',
  completed: 'Selesai',
  cancelled: 'Dibatalkan'
}

export const TRANSACTION_STATUS_COLORS = {
  pending: 'warning',
  completed: 'success',
  cancelled: 'danger'
}

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  TRANSFER: 'transfer',
  E_WALLET: 'e-wallet',
  OTHER: 'other'
}

export const PAYMENT_METHOD_LABELS = {
  cash: 'Tunai',
  transfer: 'Transfer Bank',
  'e-wallet': 'E-Wallet',
  other: 'Lainnya'
}

// Date Formats
export const DATE_FORMAT = 'dd MMMM yyyy'
export const DATE_TIME_FORMAT = 'dd MMM yyyy, HH:mm'
export const DATE_INPUT_FORMAT = 'yyyy-MM-dd'

// Pagination
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

// API Response Status
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error'
}

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme'
}

// Routes
export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_CLIENTS: '/admin/clients',
  ADMIN_SERVICES: '/admin/services',
  ADMIN_TRANSACTIONS: '/admin/transactions',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_USERS: '/admin/users',
  ADMIN_SETTINGS: '/admin/settings',
  
  // User
  USER_DASHBOARD: '/user/dashboard',
  USER_PROFILE: '/user/profile',
  USER_TRANSACTIONS: '/user/transactions',
  USER_SETTINGS: '/user/settings'
}

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#0ea5e9',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  INFO: '#3b82f6',
  PURPLE: '#a855f7'
}
