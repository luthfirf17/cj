import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiDollarSign, 
  FiTrendingUp, 
  FiTrendingDown,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiFilter,
  FiDownload,
  FiCalendar,
  FiPieChart,
  FiBarChart2,
  FiX,
  FiSearch
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import api from '../../services/api';
import PinModal from '../../components/Common/PinModal';
import NoPinNotificationModal from '../../components/Common/NoPinNotificationModal';

const FinancialPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showNoPinModal, setShowNoPinModal] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [companySettings, setCompanySettings] = useState(null);
  const [financialSummary, setFinancialSummary] = useState({
    total_revenue: 0,
    total_paid: 0,
    total_unpaid: 0,
    total_expenses: 0,
    net_income: 0
  });
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    unpaid: 0,
    down_payment: 0,
    paid: 0
  });
  
  // Modal states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Filter states
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterCategory, setFilterCategory] = useState('');
  
  // Search states
  const [searchCategory, setSearchCategory] = useState('');
  const [searchFilterCategory, setSearchFilterCategory] = useState('');
  const [searchTable, setSearchTable] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showFilterCategoryDropdown, setShowFilterCategoryDropdown] = useState(false);
  
  // Form states
  const [expenseForm, setExpenseForm] = useState({
    category_id: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    color: '#6B7280',
    icon: '💰'
  });

  useEffect(() => {
    checkPinAndLoadData();
  }, []);

  useEffect(() => {
    if (isPinVerified) {
      fetchAllData();
    }
  }, [filterMonth, filterYear, filterCategory, isPinVerified]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCategoryDropdown && !event.target.closest('.category-dropdown-container')) {
        setShowCategoryDropdown(false);
      }
      if (showFilterCategoryDropdown && !event.target.closest('.filter-category-dropdown-container')) {
        setShowFilterCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategoryDropdown, showFilterCategoryDropdown]);

  const checkPinAndLoadData = async () => {
    try {
      // Check if user has PIN
      const response = await api.get('/user/pin-status');
      if (response.data.success) {
        const hasPinStatus = response.data.data.hasPin;
        setHasPin(hasPinStatus);
        
        if (hasPinStatus) {
          // Show PIN modal
          setShowPinModal(true);
        } else {
          // No PIN set, show notification modal
          setShowNoPinModal(true);
        }
      }
    } catch (error) {
      console.error('Error checking PIN status:', error);
      alert('Gagal memeriksa status PIN. Silakan coba lagi.');
      navigate('/user/dashboard');
    }
  };

  const handlePinVerified = () => {
    setIsPinVerified(true);
    setShowPinModal(false);
    fetchAllData();
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchCompanySettings(),
      fetchFinancialSummary(),
      fetchExpenses(),
      fetchCategories(),
      fetchStats()
    ]);
    setLoading(false);
  };

  const fetchCompanySettings = async () => {
    try {
      const response = await api.get('/user/company-settings');
      if (response.data.success && response.data.data) {
        setCompanySettings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const fetchFinancialSummary = async () => {
    try {
      const response = await api.get(
        `/user/financial-summary?month=${filterMonth}&year=${filterYear}`
      );
      if (response.data.success) {
        setFinancialSummary(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const fetchExpenses = async () => {
    try {
      let url = `/user/expenses?month=${filterMonth}&year=${filterYear}`;
      if (filterCategory) {
        url += `&category=${filterCategory}`;
      }
      const response = await api.get(url);
      if (response.data.success) {
        setExpenses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/user/expense-categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/user/dashboard/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    try {
      const response = editingExpense
        ? await api.put(`/user/expenses/${editingExpense.id}`, expenseForm)
        : await api.post('/user/expenses', expenseForm);
      
      if (response.data.success) {
        alert(editingExpense ? 'Pengeluaran berhasil diupdate!' : 'Pengeluaran berhasil ditambahkan!');
        setShowExpenseModal(false);
        setEditingExpense(null);
        resetExpenseForm();
        fetchAllData();
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Gagal menyimpan pengeluaran');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) return;
    
    try {
      const response = await api.delete(`/user/expenses/${id}`);
      
      if (response.data.success) {
        alert('Pengeluaran berhasil dihapus!');
        fetchAllData();
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Gagal menghapus pengeluaran');
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const response = editingCategory
        ? await api.put(`/user/expense-categories/${editingCategory.id}`, categoryForm)
        : await api.post('/user/expense-categories', categoryForm);
      
      if (response.data.success) {
        alert(editingCategory ? 'Kategori berhasil diupdate!' : 'Kategori berhasil ditambahkan!');
        setShowCategoryModal(false);
        setEditingCategory(null);
        resetCategoryForm();
        fetchCategories();
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Gagal menyimpan kategori');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kategori ini?')) return;
    
    try {
      const response = await api.delete(`/user/expense-categories/${id}`);
      
      if (response.data.success) {
        alert('Kategori berhasil dihapus!');
        fetchCategories();
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Gagal menghapus kategori');
    }
  };

  const openEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      category_id: expense.category_id,
      amount: expense.amount,
      description: expense.description,
      expense_date: expense.expense_date,
      notes: expense.notes || ''
    });
    setShowExpenseModal(true);
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      color: category.color,
      icon: category.icon
    });
    setShowCategoryModal(true);
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      category_id: '',
      amount: '',
      description: '',
      expense_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      color: '#6B7280',
      icon: '💰'
    });
  };

  // Calculate expense by category for pie chart
  const expensesByCategory = categories.map(cat => ({
    name: cat.name,
    value: expenses
      .filter(exp => exp.category_id === cat.id)
      .reduce((sum, exp) => sum + parseFloat(exp.amount), 0),
    color: cat.color
  })).filter(item => item.value > 0);

  const COLORS = categories.map(cat => cat.color);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format number with thousand separator
  const formatNumberWithDots = (value) => {
    // Remove non-numeric characters except dots
    const numericValue = value.replace(/[^\d]/g, '');
    // Add thousand separator
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Handle amount input with thousand separator
  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/\./g, ''); // Remove existing dots
    const numericValue = value.replace(/[^\d]/g, ''); // Keep only numbers
    const formattedValue = formatNumberWithDots(numericValue);
    setExpenseForm({ ...expenseForm, amount: numericValue }); // Store raw number
    e.target.value = formattedValue; // Display formatted
  };

  // Filter categories by search
  const getFilteredCategories = (searchTerm) => {
    if (!searchTerm) return categories;
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Filter expenses by search (table)
  const getFilteredExpenses = () => {
    if (!searchTable) return expenses;
    return expenses.filter(exp => {
      const searchLower = searchTable.toLowerCase();
      const dateMatch = formatDate(exp.expense_date).toLowerCase().includes(searchLower);
      const categoryMatch = exp.category_name?.toLowerCase().includes(searchLower);
      const descriptionMatch = exp.description?.toLowerCase().includes(searchLower);
      return dateMatch || categoryMatch || descriptionMatch;
    });
  };

  const iconOptions = ['💰', '👥', '🛒', '⚙️', '📢', '🚗', '💡', '📝', '🏠', '🍔', '✈️', '🎓', '💊', '📱'];

  if (!isPinVerified) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Memverifikasi PIN...</p>
          </div>
        </div>
        
        {hasPin ? (
          <PinModal
            isOpen={showPinModal}
            onClose={() => navigate('/user/dashboard')}
            onSuccess={handlePinVerified}
            title="Verifikasi PIN"
            message="Masukkan PIN keamanan Anda untuk mengakses halaman keuangan"
          />
        ) : (
          <NoPinNotificationModal
            isOpen={showNoPinModal}
            onClose={() => navigate('/user/dashboard')}
            message="Anda harus membuat PIN terlebih dahulu untuk mengakses Dashboard Keuangan"
          />
        )}
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Memuat data keuangan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {companySettings?.company_logo_url ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-400/20 to-zinc-400/20 rounded-xl blur-sm"></div>
                  <img 
                    src={companySettings.company_logo_url} 
                    alt="Company Logo" 
                    className="relative h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 object-contain rounded-xl bg-white p-1 sm:p-2 shadow-md"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-slate-700 to-slate-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-700 via-slate-600 to-zinc-700 bg-clip-text text-transparent">
                  {companySettings?.company_name || 'Dashboard Keuangan'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  {companySettings?.company_name ? 'Dashboard Keuangan' : 'Belum ada pengaturan perusahaan'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-indigo-400/90 to-indigo-500/90 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg hover:shadow-xl p-2 sm:p-3 lg:p-6 text-white transform hover:scale-[1.02] transition-all duration-300 border border-indigo-300/20">
            <div className="flex items-center justify-between mb-1 sm:mb-2 lg:mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1 sm:p-1.5 lg:p-3">
                <FiDollarSign className="w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6" />
              </div>
              <FiTrendingUp className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 opacity-80" />
            </div>
            <h3 className="text-xs font-medium opacity-90 mb-0.5">Total Pendapatan</h3>
            <p className="text-sm sm:text-lg lg:text-2xl xl:text-3xl font-bold mb-0.5 sm:mb-1 lg:mb-2">{formatCurrency(financialSummary.total_revenue)}</p>
            <p className="text-xs opacity-75 hidden sm:block">Total nilai booking</p>
          </div>

          {/* Total Received */}
          <div className="bg-gradient-to-br from-emerald-400/90 to-teal-500/90 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg hover:shadow-xl p-2 sm:p-3 lg:p-6 text-white transform hover:scale-[1.02] transition-all duration-300 border border-emerald-300/20">
            <div className="flex items-center justify-between mb-1 sm:mb-2 lg:mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1 sm:p-1.5 lg:p-3">
                <FiCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6" />
              </div>
              <FiTrendingUp className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 opacity-80" />
            </div>
            <h3 className="text-xs font-medium opacity-90 mb-0.5">Sudah Diterima</h3>
            <p className="text-sm sm:text-lg lg:text-2xl xl:text-3xl font-bold mb-0.5 sm:mb-1 lg:mb-2">{formatCurrency(financialSummary.total_paid)}</p>
            <p className="text-xs opacity-75 hidden sm:block">Dana yang sudah masuk</p>
          </div>

          {/* Total Unpaid */}
          <div className="bg-gradient-to-br from-amber-400/90 to-orange-400/90 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg hover:shadow-xl p-2 sm:p-3 lg:p-6 text-white transform hover:scale-[1.02] transition-all duration-300 border border-amber-300/20">
            <div className="flex items-center justify-between mb-1 sm:mb-2 lg:mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1 sm:p-1.5 lg:p-3">
                <FiClock className="w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6" />
              </div>
              <FiAlertCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 opacity-80" />
            </div>
            <h3 className="text-xs font-medium opacity-90 mb-0.5">Belum Dibayar</h3>
            <p className="text-sm sm:text-lg lg:text-2xl xl:text-3xl font-bold mb-0.5 sm:mb-1 lg:mb-2">{formatCurrency(financialSummary.total_unpaid)}</p>
            <p className="text-xs opacity-75 hidden sm:block">Sisa tagihan</p>
          </div>

          {/* Total Expenses */}
          <div className="bg-gradient-to-br from-rose-400/90 to-pink-500/90 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg hover:shadow-xl p-2 sm:p-3 lg:p-6 text-white transform hover:scale-[1.02] transition-all duration-300 border border-rose-300/20">
            <div className="flex items-center justify-between mb-1 sm:mb-2 lg:mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1 sm:p-1.5 lg:p-3">
                <FiTrendingDown className="w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6" />
              </div>
              <FiBarChart2 className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 opacity-80" />
            </div>
            <h3 className="text-xs font-medium opacity-90 mb-0.5">Total Pengeluaran</h3>
            <p className="text-sm sm:text-lg lg:text-2xl xl:text-3xl font-bold mb-0.5 sm:mb-1 lg:mb-2">{formatCurrency(financialSummary.total_expenses)}</p>
            <p className="text-xs opacity-75 hidden sm:block">Biaya operasional</p>
          </div>

          {/* Net Income */}
          <div className={`bg-gradient-to-br ${
            financialSummary.net_income >= 0 
              ? 'from-violet-400/90 to-purple-500/90 border-violet-300/20' 
              : 'from-slate-400/90 to-slate-500/90 border-slate-300/20'
          } rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg hover:shadow-xl p-2 sm:p-3 lg:p-6 text-white transform hover:scale-[1.02] transition-all duration-300 border`}>
            <div className="flex items-center justify-between mb-1 sm:mb-2 lg:mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1 sm:p-1.5 lg:p-3">
                <FiPieChart className="w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6" />
              </div>
              {financialSummary.net_income >= 0 ? (
                <FiTrendingUp className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 opacity-80" />
              ) : (
                <FiTrendingDown className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 opacity-80" />
              )}
            </div>
            <h3 className="text-xs font-medium opacity-90 mb-0.5">Pendapatan Bersih</h3>
            <p className="text-sm sm:text-lg lg:text-2xl xl:text-3xl font-bold mb-0.5 sm:mb-1 lg:mb-2">{formatCurrency(financialSummary.net_income)}</p>
            <p className="text-xs opacity-75 hidden sm:block">Diterima - Pengeluaran</p>
          </div>

          {/* Payment Status Summary */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg hover:shadow-xl p-2 sm:p-3 lg:p-6 border border-gray-200/50 col-span-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
              <h3 className="text-sm sm:text-base lg:text-lg font-bold text-slate-700">Status Pembayaran</h3>
              <FiBarChart2 className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-slate-400" />
            </div>
            <div className="space-y-1 sm:space-y-2 lg:space-y-3">
              <div className="flex items-center justify-between p-1.5 sm:p-2 lg:p-3 bg-gradient-to-r from-amber-50/80 to-yellow-50/80 rounded-lg sm:rounded-xl border border-amber-200/30">
                <span className="text-xs font-medium text-slate-700">Belum Bayar</span>
                <span className="text-xs sm:text-sm lg:text-lg font-bold text-amber-600">{stats.unpaid}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 sm:p-2 lg:p-3 bg-gradient-to-r from-orange-50/80 to-amber-50/80 rounded-lg sm:rounded-xl border border-orange-200/30">
                <span className="text-xs font-medium text-slate-700">Down Payment</span>
                <span className="text-xs sm:text-sm lg:text-lg font-bold text-orange-600">{stats.down_payment}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 sm:p-2 lg:p-3 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-lg sm:rounded-xl border border-emerald-200/30">
                <span className="text-xs font-medium text-slate-700">Lunas</span>
                <span className="text-xs sm:text-sm lg:text-lg font-bold text-emerald-600">{stats.paid}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expense Management Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-700 flex items-center gap-2">
                <FiDollarSign className="text-indigo-500 w-5 h-5 sm:w-6 sm:h-6" />
                Manajemen Pengeluaran
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Kelola semua pengeluaran perusahaan</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  setEditingCategory(null);
                  resetCategoryForm();
                  setShowCategoryModal(true);
                }}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:shadow-violet-500/30 transition-all flex items-center justify-center gap-2 font-semibold transform hover:scale-105 duration-200 text-sm sm:text-base"
              >
                <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                Kategori Baru
              </button>
              <button
                onClick={() => {
                  setEditingExpense(null);
                  resetExpenseForm();
                  setShowExpenseModal(true);
                }}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 font-semibold transform hover:scale-105 duration-200 text-sm sm:text-base"
              >
                <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                Tambah Pengeluaran
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="mb-4 sm:mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <FiSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                placeholder="Cari berdasarkan tanggal, kategori, atau deskripsi..."
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white text-slate-700 transition-all text-sm sm:text-base"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-2">Bulan</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white/80 backdrop-blur-sm text-slate-700 transition-all text-sm"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i, 1).toLocaleDateString('id-ID', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-2">Tahun</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white/80 backdrop-blur-sm text-slate-700 transition-all text-sm"
                >
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="relative filter-category-dropdown-container">
                <label className="block text-sm font-medium text-slate-600 mb-2">Kategori</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchFilterCategory}
                    onChange={(e) => {
                      setSearchFilterCategory(e.target.value);
                      setShowFilterCategoryDropdown(true);
                    }}
                    onFocus={() => setShowFilterCategoryDropdown(true)}
                    placeholder="Semua Kategori"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white/80 backdrop-blur-sm text-slate-700 transition-all"
                  />
                  {showFilterCategoryDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterCategory('');
                          setSearchFilterCategory('Semua Kategori');
                          setShowFilterCategoryDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors text-slate-700 font-medium"
                      >
                        Semua Kategori
                      </button>
                      {getFilteredCategories(searchFilterCategory).map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setFilterCategory(cat.id);
                            setSearchFilterCategory(`${cat.icon} ${cat.name}`);
                            setShowFilterCategoryDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors flex items-center gap-2"
                        >
                          <span className="text-2xl">{cat.icon}</span>
                          <span className="text-slate-700 font-medium">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterMonth(new Date().getMonth() + 1);
                    setFilterYear(new Date().getFullYear());
                    setFilterCategory('');
                    setSearchFilterCategory('');
                    setSearchTable('');
                  }}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl hover:from-slate-200 hover:to-slate-300 transition-all font-medium border border-slate-200"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/50 shadow-sm max-h-[400px] sm:max-h-[500px] overflow-y-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gradient-to-r from-slate-50/80 to-zinc-50/80 backdrop-blur-sm">
                <tr>
                  <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 text-left text-xs sm:text-xs md:text-sm font-bold text-slate-600 uppercase tracking-wider">Tanggal</th>
                  <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 text-left text-xs sm:text-xs md:text-sm font-bold text-slate-600 uppercase tracking-wider">Kategori</th>
                  <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 text-left text-xs sm:text-xs md:text-sm font-bold text-slate-600 uppercase tracking-wider">Deskripsi</th>
                  <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 text-right text-xs sm:text-xs md:text-sm font-bold text-slate-600 uppercase tracking-wider">Jumlah</th>
                  <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-xs md:text-sm font-bold text-slate-600 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white/80 backdrop-blur-sm divide-y divide-slate-100">
                {getFilteredExpenses().length > 0 ? (
                  getFilteredExpenses().map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-xs sm:text-xs md:text-sm text-slate-700 font-medium">
                        {formatDate(expense.expense_date)}
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                        <span 
                          className="inline-flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-xs md:text-sm font-medium"
                          style={{ 
                            backgroundColor: `${expense.category_color}20`,
                            color: expense.category_color
                          }}
                        >
                          <span className="text-sm sm:text-sm md:text-base">{expense.icon}</span>
                          {expense.category_name}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 text-xs sm:text-xs md:text-sm text-slate-700 max-w-[120px] sm:max-w-[150px] md:max-w-none">
                        <div>
                          <p className="font-medium truncate">{expense.description}</p>
                          {expense.notes && (
                            <p className="text-xs text-slate-500 mt-0.5 sm:mt-1 hidden sm:block md:block">{expense.notes}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-xs sm:text-xs md:text-sm text-right font-bold text-rose-600">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1 md:gap-2">
                          <button
                            onClick={() => openEditExpense(expense)}
                            className="p-1 sm:p-1.5 md:p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-1 sm:p-1.5 md:p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <FiTrash2 className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-2 sm:px-3 md:px-4 lg:px-6 py-6 sm:py-8 md:py-10 lg:py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <FiAlertCircle className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 mb-2 sm:mb-3" />
                        <p className="text-xs sm:text-sm md:text-base lg:text-lg font-medium">Tidak ada data ditemukan</p>
                        <p className="text-xs sm:text-xs md:text-sm mt-0.5 sm:mt-1">Coba ubah filter atau kata kunci pencarian</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Expense by Category Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-200/50">
            <h3 className="text-lg sm:text-xl font-bold text-slate-700 mb-4 sm:mb-6 flex items-center gap-2">
              <FiPieChart className="text-violet-500 w-5 h-5 sm:w-6 sm:h-6" />
              Pengeluaran per Kategori
            </h3>
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={200} className="sm:h-[250px] md:h-[280px] lg:h-[300px] xl:h-[320px]">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={
                      window.innerWidth < 640 ? 60 : 
                      window.innerWidth < 768 ? 70 : 
                      window.innerWidth < 1024 ? 80 : 
                      window.innerWidth < 1280 ? 90 : 100
                    }
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 sm:h-64 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <FiPieChart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 opacity-30" />
                  <p className="text-sm sm:text-base">Belum ada data untuk ditampilkan</p>
                </div>
              </div>
            )}
          </div>

          {/* Categories Management */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-200/50">
            <h3 className="text-lg sm:text-xl font-bold text-slate-700 mb-4 sm:mb-6 flex items-center gap-2">
              <FiFilter className="text-indigo-500 w-5 h-5 sm:w-6 sm:h-6" />
              Kategori Pengeluaran
            </h3>
            <div className="space-y-1.5 sm:space-y-2 md:space-y-2.5 max-h-48 sm:max-h-60 md:max-h-72 lg:max-h-80 xl:max-h-96 overflow-y-auto">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-1.5 sm:p-2 md:p-2.5 lg:p-3 rounded-lg sm:rounded-xl border border-slate-200 hover:shadow-sm hover:border-slate-300 transition-all bg-gradient-to-r from-white/80 to-slate-50/50"
                  style={{ borderLeftWidth: '3px', borderLeftColor: category.color }}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3">
                    <span className="text-lg sm:text-xl md:text-xl lg:text-2xl">{category.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-700 text-xs sm:text-sm md:text-sm lg:text-base">{category.name}</p>
                      {category.is_default && (
                        <span className="text-xs text-slate-500">Default</span>
                      )}
                    </div>
                  </div>
                  {!category.is_default && (
                    <div className="flex gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2">
                      <button
                        onClick={() => openEditCategory(category)}
                        className="p-1 sm:p-1.5 md:p-1.5 lg:p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <FiEdit2 className="w-3 h-3 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-1 sm:p-1.5 md:p-1.5 lg:p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-3 h-3 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4 sm:p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-bold">
                  {editingExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
                </h3>
                <button
                  onClick={() => {
                    setShowExpenseModal(false);
                    setEditingExpense(null);
                    resetExpenseForm();
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSaveExpense} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="relative category-dropdown-container">
                <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-2">
                  Kategori <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchCategory}
                    onChange={(e) => {
                      setSearchCategory(e.target.value);
                      setShowCategoryDropdown(true);
                    }}
                    onFocus={() => setShowCategoryDropdown(true)}
                    placeholder="Pilih Kategori"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white text-slate-700 transition-all text-sm sm:text-base"
                  />
                  {showCategoryDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {getFilteredCategories(searchCategory).length > 0 ? (
                        getFilteredCategories(searchCategory).map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setExpenseForm({ ...expenseForm, category_id: cat.id });
                              setSearchCategory(`${cat.icon} ${cat.name}`);
                              setShowCategoryDropdown(false);
                            }}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-indigo-50 transition-colors flex items-center gap-2 text-sm sm:text-base"
                          >
                            <span className="text-xl sm:text-2xl">{cat.icon}</span>
                            <span className="text-slate-700 font-medium">{cat.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-500 text-center text-sm">
                          Tidak ada kategori ditemukan
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <input type="hidden" value={expenseForm.category_id} required />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-2">
                  Jumlah (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formatNumberWithDots(expenseForm.amount)}
                  onChange={handleAmountChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white text-slate-700 transition-all text-sm sm:text-base"
                  placeholder="Masukkan jumlah pengeluaran"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Contoh: 1.500.000 untuk satu juta lima ratus ribu</p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-2">
                  Deskripsi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white text-slate-700 transition-all text-sm sm:text-base"
                  placeholder="Contoh: Gaji karyawan bulan Oktober"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-2">
                  Tanggal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={expenseForm.expense_date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white text-slate-700 transition-all text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white text-slate-700 transition-all text-sm sm:text-base"
                  rows="3"
                  placeholder="Tambahkan catatan jika diperlukan"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowExpenseModal(false);
                    setEditingExpense(null);
                    resetExpenseForm();
                  }}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-sm sm:text-base"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all font-semibold text-sm sm:text-base"
                >
                  {editingExpense ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-sm sm:max-w-md w-full border border-slate-200">
            <div className="bg-gradient-to-r from-violet-500 to-purple-500 text-white p-4 sm:p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-bold">
                  {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                </h3>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                    resetCategoryForm();
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSaveCategory} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-2">
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white text-slate-700 transition-all text-sm sm:text-base"
                  placeholder="Contoh: Sewa Kantor"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-2">
                  Warna
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444', '#64748B', '#EC4899'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, color })}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl transition-all ${
                        categoryForm.color === color ? 'ring-4 ring-offset-2 ring-slate-300 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-7 gap-2">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, icon })}
                      className={`p-2 sm:p-3 text-xl sm:text-2xl rounded-xl transition-all hover:bg-slate-100 ${
                        categoryForm.icon === icon ? 'bg-violet-100 ring-2 ring-violet-500' : 'bg-slate-50'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                    resetCategoryForm();
                  }}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-sm sm:text-base"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:shadow-violet-500/30 transition-all font-semibold text-sm sm:text-base"
                >
                  {editingCategory ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default FinancialPage;
