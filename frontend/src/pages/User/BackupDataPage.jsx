import React, { useState, useEffect } from 'react';
import { 
  FiDownload, 
  FiUpload, 
  FiFileText, 
  FiDatabase,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiRefreshCw,
  FiPlus,
  FiChevronDown,
  FiChevronUp,
  FiSearch
} from 'react-icons/fi';
import api from '../../services/api';

const BackupDataPage = () => {
  const [loading, setLoading] = useState(false);
  const [dataStats, setDataStats] = useState({
    totalBookings: 0,
    totalPayments: 0,
    totalExpenses: 0,
    totalClients: 0,
    totalServices: 0
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExportFileModal, setShowExportFileModal] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importType, setImportType] = useState('replace'); // 'replace' or 'add'
  const [importFile, setImportFile] = useState(null);
  const [exportFileFormat, setExportFileFormat] = useState('xlsx'); // 'xlsx' or 'csv'
  const [exportFileName, setExportFileName] = useState('');
  const [importData, setImportData] = useState(null);
  const [importSelection, setImportSelection] = useState({});
  const [duplicateData, setDuplicateData] = useState({});
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  
  // Export selection state
  const [exportSelection, setExportSelection] = useState({
    companySettings: true,
    clients: true,
    services: true,
    bookingsAndPayments: true, // Gabung booking & payments
    expenses: true,
    expenseCategories: true
  });

  // Detailed data for selection
  const [allData, setAllData] = useState({
    clients: [],
    services: [],
    bookings: [],
    payments: [],
    expenses: [],
    expenseCategories: []
  });

  // Selected IDs for each category
  const [selectedIds, setSelectedIds] = useState({
    clients: [],
    services: [],
    bookings: [],
    payments: [],
    expenses: [],
    expenseCategories: []
  });

  // Dropdown open state
  const [expandedCategories, setExpandedCategories] = useState({
    clients: false,
    services: false,
    bookings: false,
    payments: false,
    expenses: false,
    expenseCategories: false
  });

  // Search state for each category
  const [searchTerms, setSearchTerms] = useState({
    clients: '',
    services: '',
    bookings: '',
    payments: '',
    expenses: '',
    expenseCategories: ''
  });

  // Search state for import preview
  const [importSearchTerms, setImportSearchTerms] = useState({
    clients: '',
    services: '',
    bookings: '',
    expenses: '',
    expenseCategories: ''
  });

  useEffect(() => {
    fetchDataStats();
  }, []);

    const fetchDataStats = async () => {
    try {
      const response = await api.get('/backup/stats');
      if (response.data.success && response.data.data) {
        setDataStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch all data for selection
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [clientsRes, servicesRes, bookingsRes, paymentsRes, expensesRes, categoriesRes] = await Promise.all([
        api.get('/clients'),
        api.get('/services'),
        api.get('/bookings'),
        api.get('/payments'),
        api.get('/expenses'),
        api.get('/expense-categories')
      ]);

      console.log('📊 Fetched Data:', {
        clients: clientsRes.data.length,
        services: servicesRes.data.length,
        bookings: bookingsRes.data.length,
        payments: paymentsRes.data.length,
        expenses: expensesRes.data.length,
        expenseCategories: categoriesRes.data.length
      });

      setAllData({
        clients: clientsRes.data,
        services: servicesRes.data,
        bookings: bookingsRes.data,
        payments: paymentsRes.data,
        expenses: expensesRes.data,
        expenseCategories: categoriesRes.data
      });

      // Initially select all IDs
      const selectedIdsObj = {
        clients: clientsRes.data.map(item => item.id),
        services: servicesRes.data.map(item => item.id),
        bookings: bookingsRes.data.map(item => item.id),
        payments: paymentsRes.data.map(item => item.id),
        expenses: expensesRes.data.map(item => item.id),
        expenseCategories: categoriesRes.data.map(item => item.id)
      };
      
      setSelectedIds(selectedIdsObj);

      console.log('✅ All data loaded and IDs selected');
      console.log('📋 Selected Expense Category IDs:', selectedIdsObj.expenseCategories);
    } catch (error) {
      console.error('❌ Error fetching all data:', error);
      showNotification('error', 'Gagal memuat data untuk export');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 5000);
  };

  // Export to Excel/CSV - Show modal first
  const handleShowExportFileModal = (format) => {
    setExportFileFormat(format);
    // Set default filename dengan tanggal
    const dateStr = new Date().toISOString().split('T')[0];
    setExportFileName(`backup_${dateStr}`);
    setShowExportFileModal(true);
  };

  // Execute export after confirming filename
  const handleExportExcel = async () => {
    try {
      setLoading(true);
      setShowExportFileModal(false);
      
      const timestamp = Date.now();
      const response = await api.get(`/backup/export/${exportFileFormat}?t=${timestamp}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportFileName}.${exportFileFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showNotification('success', `Data berhasil diexport ke format ${exportFileFormat.toUpperCase()}!`);
    } catch (error) {
      console.error('Error exporting to Excel/CSV:', error);
      showNotification('error', 'Gagal mengexport data: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Show export selection modal (for JSON only)
  const handleShowExportModal = async () => {
    await fetchAllData(); // Fetch all data when modal opens
    setShowExportModal(true);
  };

  // Toggle all export selections
  const handleToggleAll = (checked) => {
    setExportSelection({
      companySettings: checked,
      clients: checked,
      services: checked,
      bookingsAndPayments: checked,
      expenses: checked,
      expenseCategories: checked
    });

    // If checked, select all IDs; if unchecked, clear all
    if (checked) {
      setSelectedIds({
        clients: allData.clients.map(item => item.id),
        services: allData.services.map(item => item.id),
        bookings: allData.bookings.map(item => item.id),
        payments: allData.payments.map(item => item.id),
        expenses: allData.expenses.map(item => item.id),
        expenseCategories: allData.expenseCategories.map(item => item.id)
      });
    } else {
      setSelectedIds({
        clients: [],
        services: [],
        bookings: [],
        payments: [],
        expenses: [],
        expenseCategories: []
      });
    }
  };

  // Toggle category checkbox with dependency logic
  const handleToggleCategory = (category, checked) => {
    setExportSelection(prev => ({ ...prev, [category]: checked }));
    
    // Special handling for bookingsAndPayments (includes both bookings & payments)
    if (category === 'bookingsAndPayments') {
      if (checked) {
        // Select all bookings and payments
        setSelectedIds(prev => ({
          ...prev,
          bookings: allData.bookings.map(item => item.id),
          payments: allData.payments.map(item => item.id)
        }));
        
        // Auto-select related clients and services
        autoSelectRelatedData(allData.bookings.map(item => item.id), 'bookings');
      } else {
        // Clear bookings and payments
        setSelectedIds(prev => ({
          ...prev,
          bookings: [],
          payments: []
        }));
      }
    } else if (checked && allData[category]) {
      // Normal category toggle
      setSelectedIds(prev => ({
        ...prev,
        [category]: allData[category].map(item => item.id)
      }));
    } else {
      setSelectedIds(prev => ({
        ...prev,
        [category]: []
      }));
    }
  };

  // Toggle dropdown
  const handleToggleDropdown = (category) => {
    // Make sure category is a string, not an event object
    const cat = typeof category === 'string' ? category : null;
    if (!cat) return;
    
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  // Toggle individual item with dependency logic
  const handleToggleItem = (category, itemId) => {
    setSelectedIds(prev => {
      const currentIds = prev[category] || [];
      const isAdding = !currentIds.includes(itemId);
      const newIds = isAdding
        ? [...currentIds, itemId]
        : currentIds.filter(id => id !== itemId);
      
      // Update category checkbox based on selection
      if (newIds.length === 0) {
        if (category === 'bookings' || category === 'payments') {
          // Check if both bookings and payments are empty
          const otherCategory = category === 'bookings' ? 'payments' : 'bookings';
          if (prev[otherCategory].length === 0) {
            setExportSelection(p => ({ ...p, bookingsAndPayments: false }));
          }
        } else {
          setExportSelection(p => ({ ...p, [category]: false }));
        }
      } else if (newIds.length > 0) {
        if (category === 'bookings' || category === 'payments') {
          setExportSelection(p => ({ ...p, bookingsAndPayments: true }));
        } else if (!exportSelection[category]) {
          setExportSelection(p => ({ ...p, [category]: true }));
        }
      }
      
      const updatedIds = { ...prev, [category]: newIds };
      
      // If toggling a booking, auto-handle related payments, clients, and services
      if (category === 'bookings') {
        const booking = allData.bookings.find(b => b.id === itemId);
        if (booking) {
          if (isAdding) {
            // Adding booking: auto-select related client, service, and payments
            if (booking.client_id && !updatedIds.clients.includes(booking.client_id)) {
              updatedIds.clients = [...updatedIds.clients, booking.client_id];
              setExportSelection(p => ({ ...p, clients: true }));
            }
            if (booking.service_id && !updatedIds.services.includes(booking.service_id)) {
              updatedIds.services = [...updatedIds.services, booking.service_id];
              setExportSelection(p => ({ ...p, services: true }));
            }
            
            // Auto-select payments related to this booking
            const relatedPayments = allData.payments.filter(p => p.booking_id === itemId);
            relatedPayments.forEach(payment => {
              if (!updatedIds.payments.includes(payment.id)) {
                updatedIds.payments = [...updatedIds.payments, payment.id];
              }
            });
          } else {
            // Removing booking: also remove related payments
            const relatedPaymentIds = allData.payments
              .filter(p => p.booking_id === itemId)
              .map(p => p.id);
            updatedIds.payments = updatedIds.payments.filter(id => !relatedPaymentIds.includes(id));
          }
        }
      }
      
      return updatedIds;
    });
  };

  // Auto-select related clients and services based on bookings
  const autoSelectRelatedData = (bookingIds, source = 'bookings') => {
    const relatedClientIds = new Set();
    const relatedServiceIds = new Set();
    
    // Find related client_id and service_id from selected bookings
    bookingIds.forEach(bookingId => {
      const booking = allData.bookings.find(b => b.id === bookingId);
      if (booking) {
        if (booking.client_id) relatedClientIds.add(booking.client_id);
        if (booking.service_id) relatedServiceIds.add(booking.service_id);
      }
    });
    
    // Update selectedIds to include related data
    setSelectedIds(prev => {
      const newClientIds = new Set([...prev.clients, ...relatedClientIds]);
      const newServiceIds = new Set([...prev.services, ...relatedServiceIds]);
      
      return {
        ...prev,
        clients: Array.from(newClientIds),
        services: Array.from(newServiceIds)
      };
    });
    
    // Auto-check categories if they have items
    if (relatedClientIds.size > 0) {
      setExportSelection(prev => ({ ...prev, clients: true }));
    }
    if (relatedServiceIds.size > 0) {
      setExportSelection(prev => ({ ...prev, services: true }));
    }
  };

  // Toggle all items in a category
  const handleToggleAllInCategory = (category, checked) => {
    if (checked) {
      const allIds = allData[category].map(item => item.id);
      setSelectedIds(prev => ({
        ...prev,
        [category]: allIds
      }));
      
      // If bookings, auto-select related payments, clients, and services
      if (category === 'bookings') {
        // Auto-select ALL payments (since all bookings are selected)
        const allPaymentIds = allData.payments.map(p => p.id);
        setSelectedIds(prev => ({
          ...prev,
          payments: allPaymentIds
        }));
        
        // Auto-select related clients and services
        autoSelectRelatedData(allIds, 'bookings');
      }
    } else {
      setSelectedIds(prev => ({
        ...prev,
        [category]: []
      }));
      
      // If clearing bookings, also clear payments
      if (category === 'bookings') {
        setSelectedIds(prev => ({
          ...prev,
          payments: []
        }));
      }
    }
  };

  // Filter items by search term
  const getFilteredItems = (category) => {
    const items = allData[category] || [];
    const searchTerm = searchTerms[category]?.toLowerCase() || '';
    
    if (!searchTerm) return items;
    
    return items.filter(item => {
      const searchableText = getSearchableText(category, item).toLowerCase();
      return searchableText.includes(searchTerm);
    });
  };

  // Get searchable text for an item
  const getSearchableText = (category, item) => {
    switch (category) {
      case 'clients':
        return `${item.name} ${item.phone || ''} ${item.email || ''}`;
      case 'services':
        return `${item.name} ${item.description || ''}`;
      case 'bookings':
        return `${item.client_name || ''} ${item.service_name || ''} ${item.booking_date || ''} ${item.location_name || ''}`;
      case 'payments':
        return `${item.client_name || ''} ${item.amount || ''} ${item.payment_date || ''}`;
      case 'expenses':
        return `${item.description || ''} ${item.category_name || ''} ${item.amount || ''}`;
      case 'expenseCategories':
        return `${item.name}`;
      default:
        return JSON.stringify(item);
    }
  };

  // Get display text for an item
  const getDisplayText = (category, item) => {
    switch (category) {
      case 'clients':
        return `${item.name}${item.phone ? ` - ${item.phone}` : ''}`;
      case 'services':
        return `${item.name} - Rp ${parseFloat(item.price || 0).toLocaleString('id-ID')}`;
      case 'bookings':
        const locationText = item.location_name ? ` 📍 ${item.location_name}` : '';
        return `${item.client_name || 'Unknown'} - ${item.service_name || 'Unknown'}${locationText} (${item.booking_date || 'N/A'})`;
      case 'payments':
        return `${item.client_name || 'Unknown'} - Rp ${parseFloat(item.amount || 0).toLocaleString('id-ID')} (${item.payment_date || 'N/A'})`;
      case 'expenses':
        return `${item.description || 'No description'} - Rp ${parseFloat(item.amount || 0).toLocaleString('id-ID')}`;
      case 'expenseCategories':
        return item.name;
      default:
        return JSON.stringify(item);
    }
  };

  // Export to JSON (for re-import)
  const handleExportJSON = async () => {
    try {
      setLoading(true);
      
      // Build query params from selection
      const params = new URLSearchParams();
      
      // Convert bookingsAndPayments to separate bookings & payments
      params.append('companySettings', exportSelection.companySettings);
      params.append('clients', exportSelection.clients);
      params.append('services', exportSelection.services);
      params.append('bookings', exportSelection.bookingsAndPayments);
      params.append('payments', exportSelection.bookingsAndPayments);
      params.append('expenses', exportSelection.expenses);
      params.append('expenseCategories', exportSelection.expenseCategories);

      // Add selected IDs for each category
      Object.entries(selectedIds).forEach(([category, ids]) => {
        if (ids.length > 0) {
          params.append(`${category}Ids`, JSON.stringify(ids));
        }
      });
      
      console.log('📤 Export Parameters:');
      console.log('  - expenseCategories selected:', exportSelection.expenseCategories);
      console.log('  - expenseCategoriesIds:', selectedIds.expenseCategories);
      
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      params.append('t', timestamp);
      
      const response = await api.get(`/backup/download-json?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showNotification('success', 'Backup JSON berhasil diunduh!');
      setShowExportModal(false);
    } catch (error) {
      console.error('Error exporting JSON:', error);
      showNotification('error', 'Gagal export JSON: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Check for duplicates and prepare import preview
  const handleFileSelect = async (file) => {
    if (!file) return;
    
    setImportFile(file);
    
    // If import type is 'add', analyze the file for duplicates
    if (importType === 'add') {
      try {
        setLoading(true);
        const fileContent = await file.text();
        const backupData = JSON.parse(fileContent);
        
        // Fetch current data from backend to compare
        const [clientsRes, servicesRes, categoriesRes, bookingsRes, expensesRes] = await Promise.all([
          api.get('/clients'),
          api.get('/services'),
          api.get('/expense-categories'),
          api.get('/bookings'),
          api.get('/expenses')
        ]);
        
        console.log('🌐 ===== API RESPONSES =====');
        console.log('Clients response:', clientsRes);
        console.log('Services response:', servicesRes);
        console.log('Categories response:', categoriesRes);
        console.log('Bookings response:', bookingsRes);
        console.log('Expenses response:', expensesRes);
        console.log('===========================');
        
        // Handle different response structures
        // Some APIs return { success: true, data: [...] }
        // Others return data directly
        const extractData = (response) => {
          if (response.data && Array.isArray(response.data)) {
            return response.data;
          }
          if (response.data && response.data.data && Array.isArray(response.data.data)) {
            return response.data.data;
          }
          if (response.data && response.data.success && Array.isArray(response.data.data)) {
            return response.data.data;
          }
          return [];
        };
        
        const currentData = {
          clients: extractData(clientsRes),
          services: extractData(servicesRes),
          expenseCategories: extractData(categoriesRes),
          bookings: extractData(bookingsRes),
          expenses: extractData(expensesRes)
        };
        
        console.log('📊 ===== CURRENT DATA STRUCTURE =====');
        console.log('currentData:', currentData);
        console.log('currentData.bookings type:', typeof currentData.bookings);
        console.log('currentData.bookings is array:', Array.isArray(currentData.bookings));
        console.log('currentData.bookings length:', currentData.bookings?.length);
        if (currentData.bookings?.length > 0) {
          console.log('currentData.bookings[0]:', currentData.bookings[0]);
        }
        console.log('=====================================');
        
        // Detect duplicates and prepare selection
        const duplicates = detectDuplicates(backupData.data, currentData);
        const selection = prepareImportSelection(backupData.data, duplicates);
        
        // Log duplicate summary
        console.log('=== DUPLICATE DETECTION SUMMARY ===');
        console.log('Clients duplikat:', duplicates.clients?.length || 0);
        console.log('Services duplikat:', duplicates.services?.length || 0);
        console.log('Bookings duplikat:', duplicates.bookings?.length || 0);
        console.log('Expenses duplikat:', duplicates.expenses?.length || 0);
        console.log('Expense Categories duplikat:', duplicates.expenseCategories?.length || 0);
        console.log('===================================');
        
        setImportData(backupData.data);
        setDuplicateData(duplicates);
        setImportSelection(selection);
        
        // Show preview modal
        setShowImportModal(false);
        setShowImportPreview(true);
      } catch (error) {
        console.error('Error analyzing file:', error);
        showNotification('error', 'File backup tidak valid atau rusak.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Detect duplicate data
  const detectDuplicates = (backupData, currentData) => {
    console.log('🔎 ===== STARTING DUPLICATE DETECTION =====');
    console.log('📦 Backup data categories:', Object.keys(backupData));
    console.log('💾 Current data categories:', Object.keys(currentData));
    
    // CRITICAL CHECK: Verify current data is loaded
    console.log('\n⚠️ CRITICAL VERIFICATION - Current Data Status:');
    console.log('  Clients:', currentData.clients?.length || 0);
    console.log('  Services:', currentData.services?.length || 0);
    console.log('  Bookings:', currentData.bookings?.length || 0);
    console.log('  Expenses:', currentData.expenses?.length || 0);
    console.log('  Expense Categories:', currentData.expenseCategories?.length || 0);
    
    if (currentData.bookings?.length > 0) {
      console.log('\n📋 Sample booking from current data:', currentData.bookings[0]);
    }
    
    if (backupData.bookings?.length > 0) {
      console.log('📋 Sample booking from backup data:', backupData.bookings[0]);
    }
    
    const duplicates = {
      clients: [],
      services: [],
      expenseCategories: [],
      bookings: [],
      expenses: []
    };
    
    // Check clients (by name, phone, email)
    if (backupData.clients) {
      backupData.clients.forEach((item, index) => {
        const isDuplicate = currentData.clients.some(existing => 
          (item.name && existing.name && item.name.trim().toLowerCase() === existing.name.trim().toLowerCase()) ||
          (item.phone && existing.phone && item.phone.replace(/\D/g, '') === existing.phone.replace(/\D/g, '')) ||
          (item.email && existing.email && item.email.trim().toLowerCase() === existing.email.trim().toLowerCase())
        );
        if (isDuplicate) duplicates.clients.push(index);
      });
    }
    
    // Check services (by name and price)
    if (backupData.services) {
      backupData.services.forEach((item, index) => {
        const isDuplicate = currentData.services.some(existing => 
          item.name && existing.name && 
          item.name.trim().toLowerCase() === existing.name.trim().toLowerCase() &&
          parseFloat(item.price) === parseFloat(existing.price)
        );
        if (isDuplicate) duplicates.services.push(index);
      });
    }
    
    // Check expense categories (by name)
    if (backupData.expenseCategories) {
      backupData.expenseCategories.forEach((item, index) => {
        const isDuplicate = currentData.expenseCategories.some(existing => 
          item.name && existing.name && 
          item.name.trim().toLowerCase() === existing.name.trim().toLowerCase()
        );
        if (isDuplicate) duplicates.expenseCategories.push(index);
      });
    }
    
    // Check bookings (by ALL details: date, time, client NAME, service NAME, prices, status, notes)
    // We compare by client/service NAME instead of ID because IDs may differ between backup and current DB
    if (backupData.bookings) {
      console.log('🔍 Checking bookings for duplicates...');
      console.log('Backup bookings:', backupData.bookings.length);
      console.log('Current bookings:', currentData.bookings.length);
      console.log('📊 Current data clients:', currentData.clients?.length || 0);
      console.log('📊 Current data services:', currentData.services?.length || 0);
      console.log('📦 Backup data clients:', backupData.clients?.length || 0);
      console.log('📦 Backup data services:', backupData.services?.length || 0);
      
      // Log ALL current bookings to see what we're comparing against
      console.log('\n📋 ALL CURRENT BOOKINGS IN DATABASE:');
      currentData.bookings.forEach((booking, idx) => {
        const client = currentData.clients?.find(c => c.id === booking.client_id);
        const service = currentData.services?.find(s => s.id === booking.service_id);
        console.log(`  [${idx}] Date: ${booking.booking_date}, Time: ${booking.booking_time}, Client: ${client?.name}, Service: ${service?.name}, Status: ${booking.status}, Price: ${booking.total_price}`);
      });
      
      console.log('\n📦 ALL BACKUP BOOKINGS:');
      backupData.bookings.forEach((booking, idx) => {
        const client = backupData.clients?.find(c => c.id === booking.client_id);
        const service = backupData.services?.find(s => s.id === booking.service_id);
        console.log(`  [${idx}] Date: ${booking.booking_date}, Time: ${booking.booking_time}, Client: ${client?.name}, Service: ${service?.name}, Status: ${booking.status}, Price: ${booking.total_price}`);
      });
      
      // Log sample booking structures to see field names
      if (backupData.bookings.length > 0) {
        console.log('\n📦 BACKUP booking sample (all fields):', backupData.bookings[0]);
      }
      if (currentData.bookings.length > 0) {
        console.log('💾 CURRENT booking sample (all fields):', currentData.bookings[0]);
      }
      
      // Log sample clients and services
      if (currentData.clients && currentData.clients.length > 0) {
        console.log('💾 CURRENT client sample:', currentData.clients[0]);
      }
      if (backupData.clients && backupData.clients.length > 0) {
        console.log('📦 BACKUP client sample:', backupData.clients[0]);
      }
      
      backupData.bookings.forEach((item, index) => {
        // Get client and service details from backup data using backup IDs
        const itemClient = backupData.clients?.find(c => c.id === item.client_id);
        const itemService = backupData.services?.find(s => s.id === item.service_id);
        
        // Get client and service names (priority: from item itself if exists, then from lookup)
        // Backup data might have client_name and service_name directly, or we need to lookup
        const itemClientName = item.client_name || itemClient?.name || null;
        const itemServiceName = item.service_name || itemService?.name || null;
        
        console.log(`\n📋 Checking booking ${index}:`, {
          date: item.booking_date,
          time: item.booking_time,
          clientName: itemClientName,
          serviceName: itemServiceName,
          totalPrice: item.total_price,
          status: item.status,
          notes: item.notes,
          paymentStatus: item.payment_status,
          hasClientName: !!itemClientName,
          hasServiceName: !!itemServiceName
        });
        
        // Skip if client or service name not available
        if (!itemClientName || !itemServiceName) {
          console.log(`    ⚠️ Skipping booking ${index} - missing client or service name`);
          return;
        }
        
        const isDuplicate = currentData.bookings.some((existing, existingIndex) => {
          // IMPORTANT: Current bookings from API already have client_name and service_name
          // We DON'T need to lookup in clients/services arrays
          const existingClientName = existing.client_name || null;
          const existingServiceName = existing.service_name || null;
          
          // Skip if current booking doesn't have names
          if (!existingClientName || !existingServiceName) {
            return false;
          }
          
          // Normalize dates - Compare dates as shown to user (local dates)
          // The issue: dates from backup may have different UTC offsets than current DB dates
          // Solution: Extract the date part directly from the ISO string before timezone conversion
          const extractDateOnly = (dateStr) => {
            if (!dateStr) return '';
            // Take first 10 chars of ISO string (YYYY-MM-DD) - this is the user's intended date
            return dateStr.substring(0, 10);
          };
          
          const itemDateOnly = extractDateOnly(item.booking_date);
          const existingDateOnly = extractDateOnly(existing.booking_date);
          
          // Log date comparison for debugging
          if (itemClientName && existingClientName && itemClientName === existingClientName) {
            console.log(`    🔍 Comparing ${itemClientName} bookings:`, {
              itemDateRaw: item.booking_date,
              existingDateRaw: existing.booking_date,
              itemDateExtracted: itemDateOnly,
              existingDateExtracted: existingDateOnly,
              itemTime: item.booking_time,
              existingTime: existing.booking_time,
              dateMatch: itemDateOnly === existingDateOnly
            });
          }
          
          // Normalize time format (remove seconds if exists)
          const normalizeTime = (time) => {
            if (!time) return '';
            const parts = time.split(':');
            return `${parts[0]}:${parts[1]}`; // Only HH:mm
          };
          
          const itemTime = normalizeTime(item.booking_time);
          const existingTime = normalizeTime(existing.booking_time);
          
          // Helper function to normalize strings for comparison
          const normalizeString = (str) => {
            if (!str) return '';
            return String(str).trim().toLowerCase();
          };
          
          // Helper function to normalize numbers for comparison
          const normalizeNumber = (num) => {
            if (num === null || num === undefined) return 0;
            return parseFloat(num) || 0;
          };
          
          // ===== COMPARE ALL BOOKING DETAILS (EXCEPT ID) =====
          
          // 1. Date & Time MUST match (with ±1 day tolerance for timezone issues)
          // Parse dates to compare with tolerance
          const itemDateObj = new Date(itemDateOnly);
          const existingDateObj = new Date(existingDateOnly);
          const dayDifference = Math.abs((itemDateObj - existingDateObj) / (1000 * 60 * 60 * 24));
          const sameDate = dayDifference <= 1; // Allow ±1 day difference due to timezone offset
          const sameTime = itemTime === existingTime;
          
          // 2. Client MUST match (by name)
          const sameClient = normalizeString(itemClientName) === normalizeString(existingClientName);
          
          // 3. Service MUST match (by name)
          const sameService = normalizeString(itemServiceName) === normalizeString(existingServiceName);
          
          // 4. Status MUST match
          const sameStatus = normalizeString(item.status) === normalizeString(existing.status);
          
          // 5. Prices MUST match (if available)
          const sameTotalPrice = normalizeNumber(item.total_price) === normalizeNumber(existing.total_price);
          
          // 6. Notes comparison - compare meaningful content, not exact JSON match
          // Notes may contain service_id that changes after import, so we compare key fields only
          const compareNotes = () => {
            try {
              // If both notes are empty/null, consider them matching
              if (!item.notes && !existing.notes) return true;
              if (!item.notes || !existing.notes) return false;
              
              // Try to parse as JSON
              const itemNotesObj = typeof item.notes === 'string' ? JSON.parse(item.notes) : item.notes;
              const existingNotesObj = typeof existing.notes === 'string' ? JSON.parse(existing.notes) : existing.notes;
              
              // Compare only user-visible fields (ignore service_id and other internal IDs)
              const compareField = (field) => {
                const itemVal = normalizeString(itemNotesObj[field]);
                const existingVal = normalizeString(existingNotesObj[field]);
                return itemVal === existingVal;
              };
              
              // Check key fields that user actually entered
              const fieldsToCompare = ['user_notes', 'booking_date', 'booking_time', 
                                       'booking_date_end', 'booking_time_end', 'booking_days',
                                       'discount', 'tax_percentage', 'payment_status', 'amount_paid'];
              
              return fieldsToCompare.every(field => compareField(field));
            } catch (e) {
              // If JSON parsing fails, fall back to string comparison
              return normalizeString(item.notes) === normalizeString(existing.notes);
            }
          };
          const sameNotes = compareNotes();
          
          // 7. Payment status comparison (optional field - may not exist in backup)
          // If payment_status is undefined/null in backup but exists in current, consider it a match
          // because backup data from old exports may not have this field
          const itemPaymentStatus = normalizeString(item.payment_status);
          const existingPaymentStatus = normalizeString(existing.payment_status);
          const samePaymentStatus = !itemPaymentStatus || !existingPaymentStatus || 
                                   itemPaymentStatus === existingPaymentStatus;
          
          // 8. Location fields are OPTIONAL (new feature - old backups won't have this)
          // If both have location data, compare it. If one doesn't have it, still consider match
          const itemLocationName = normalizeString(item.location_name);
          const existingLocationName = normalizeString(existing.location_name);
          const sameLocation = !itemLocationName || !existingLocationName || 
                              itemLocationName === existingLocationName;
          
          // MATCH if ALL CORE criteria match
          // Note: We don't check discount, final_price, location_map_url because they may not exist
          // Payment status and location are optional because old backup files may not have these fields
          const isMatch = sameDate && sameTime && sameClient && sameService && sameStatus &&
                         sameTotalPrice && sameNotes && samePaymentStatus && sameLocation;
          
          // Detailed logging for debugging - log EVERY comparison attempt
          if (itemClientName && existingClientName) {
            const nameMatch = normalizeString(itemClientName) === normalizeString(existingClientName);
            if (nameMatch) {
              console.log(`  🔍 Found client match: "${itemClientName}" (backup idx ${index} vs current idx ${existingIndex})`);
              console.log(`    Date: ${itemDateOnly} vs ${existingDateOnly} (diff: ${dayDifference.toFixed(1)} days) → ${sameDate ? '✅' : '❌'}`);
              console.log(`    Time: ${itemTime} vs ${existingTime} → ${sameTime ? '✅' : '❌'}`);
              console.log(`    Service: "${itemServiceName}" vs "${existingServiceName}" → ${sameService ? '✅' : '❌'}`);
              
              if (sameDate && sameTime && sameService) {
                console.log(`    ⭐ POTENTIAL MATCH! Checking other fields...`);
                console.log(`    Status: ${item.status} vs ${existing.status} → ${sameStatus ? '✅' : '❌'}`);
                console.log(`    Total Price: ${item.total_price} vs ${existing.total_price} → ${sameTotalPrice ? '✅' : '❌'}`);
                console.log(`    Notes: "${item.notes}" vs "${existing.notes}" → ${sameNotes ? '✅' : '❌'}`);
                console.log(`    Payment Status: ${item.payment_status} vs ${existing.payment_status} → ${samePaymentStatus ? '✅' : '❌'}`);
                console.log(`    Location: "${item.location_name}" vs "${existing.location_name}" → ${sameLocation ? '✅' : '❌'}`);
                console.log(`    FINAL RESULT: ${isMatch ? '🎯 DUPLICATE FOUND!' : '❌ Not duplicate'}`);
              }
            }
          }
          
          return isMatch;
        });
        
        if (isDuplicate) {
          duplicates.bookings.push(index);
          console.log(`🚫 [DUPLIKAT] Booking index ${index} terdeteksi duplikat:`, {
            date: item.booking_date,
            time: item.booking_time,
            clientName: itemClientName,
            serviceName: itemServiceName,
            status: item.status,
            totalPrice: item.total_price,
            location: item.location_name,
            notes: item.notes,
            paymentStatus: item.payment_status
          });
        } else {
          console.log(`✅ Booking ${index} is unique`);
        }
      });
    }
    
    // Check expenses (by expense_date, amount, description, category)
    if (backupData.expenses) {
      console.log('\n🔍 Checking expenses for duplicates...');
      console.log('Backup expenses:', backupData.expenses.length);
      console.log('Current expenses:', currentData.expenses.length);
      
      // Log ALL current expenses
      console.log('\n💰 ALL CURRENT EXPENSES IN DATABASE:');
      currentData.expenses.forEach((expense, idx) => {
        const category = currentData.expenseCategories?.find(c => c.id === expense.category_id);
        console.log(`  [${idx}] Date: ${expense.expense_date}, Amount: ${expense.amount}, Category: ${category?.name}, Desc: ${expense.description}`);
      });
      
      console.log('\n💰 ALL BACKUP EXPENSES:');
      backupData.expenses.forEach((expense, idx) => {
        const category = backupData.expenseCategories?.find(c => c.id === expense.category_id);
        console.log(`  [${idx}] Date: ${expense.expense_date}, Amount: ${expense.amount}, Category: ${category?.name}, Desc: ${expense.description}`);
      });
      
      backupData.expenses.forEach((item, index) => {
        // Get category name (priority: from item itself if exists, then from lookup)
        const itemCategory = backupData.expenseCategories?.find(c => c.id === item.category_id);
        const itemCategoryName = item.category_name || itemCategory?.name || null;
        
        console.log(`\n💰 Checking expense ${index}:`, {
          date: item.expense_date,
          amount: item.amount,
          description: item.description,
          categoryName: itemCategoryName,
          hasCategoryName: !!itemCategoryName
        });
        
        // Skip if category name not available
        if (!itemCategoryName) {
          console.log(`    ⚠️ Skipping expense ${index} - missing category name`);
          return;
        }
        
        const isDuplicate = currentData.expenses.some((existing, existingIndex) => {
          // IMPORTANT: Current expenses from API already have category_name
          const existingCategoryName = existing.category_name || null;
          
          // Skip if current expense doesn't have category name
          if (!existingCategoryName) {
            return false;
          }
          
          // Normalize dates - Extract date directly from ISO string to avoid timezone issues
          const extractDateOnly = (dateStr) => {
            if (!dateStr) return '';
            return dateStr.substring(0, 10); // YYYY-MM-DD
          };
          
          const itemDateOnly = extractDateOnly(item.expense_date);
          const existingDateOnly = extractDateOnly(existing.expense_date);
          
          // Helper functions
          const normalizeString = (str) => {
            if (!str) return '';
            return String(str).trim().toLowerCase();
          };
          
          const normalizeNumber = (num) => {
            if (num === null || num === undefined) return 0;
            return parseFloat(num) || 0;
          };
          
          // Compare all fields (with ±1 day tolerance for timezone issues)
          const itemDateObj = new Date(itemDateOnly);
          const existingDateObj = new Date(existingDateOnly);
          const dayDifference = Math.abs((itemDateObj - existingDateObj) / (1000 * 60 * 60 * 24));
          const sameDate = dayDifference <= 1; // Allow ±1 day difference due to timezone offset
          const sameAmount = normalizeNumber(item.amount) === normalizeNumber(existing.amount);
          const sameDescription = normalizeString(item.description) === normalizeString(existing.description);
          
          // Category must match by name (not ID, because IDs can differ)
          const sameCategory = normalizeString(itemCategoryName) === normalizeString(existingCategoryName);
          
          const isMatch = sameDate && sameAmount && sameDescription && sameCategory;
          
          // Detailed logging for potential matches
          if (sameDate && sameAmount) {
            console.log(`  🔍 Potential match (date+amount) with existing ${existingIndex}:`);
            console.log(`    Date: ${itemDateOnly} vs ${existingDateOnly} → ${sameDate ? '✅' : '❌'}`);
            console.log(`    Amount: ${item.amount} vs ${existing.amount} → ${sameAmount ? '✅' : '❌'}`);
            console.log(`    Category: "${itemCategoryName}" vs "${existingCategoryName}" → ${sameCategory ? '✅' : '❌'}`);
            console.log(`    Description: "${item.description}" vs "${existing.description}" → ${sameDescription ? '✅' : '❌'}`);
            console.log(`    FINAL RESULT: ${isMatch ? '🎯 DUPLICATE FOUND!' : '❌ Not duplicate'}`);
          }
          
          return isMatch;
        });
        
        if (isDuplicate) {
          duplicates.expenses.push(index);
          console.log(`🚫 [DUPLIKAT] Expense index ${index} terdeteksi duplikat:`, {
            date: item.expense_date,
            amount: item.amount,
            category: itemCategoryName,
            description: item.description
          });
        } else {
          console.log(`✅ Expense ${index} is unique`);
        }
      });
    }
    
    return duplicates;
  };
  
  // Prepare initial import selection (select all non-duplicates)
  const prepareImportSelection = (backupData, duplicates) => {
    // Tidak auto-select apa pun, biarkan user memilih sendiri
    const selection = {
      companySettings: false,
      clients: [],
      services: [],
      bookings: [],
      payments: [],
      expenses: [],
      expenseCategories: []
    };
    
    return selection;
  };
  
  // Filter import items by search term
  const getFilteredImportItems = (category) => {
    if (!importData || !importData[category]) return [];
    
    const items = importData[category];
    const searchTerm = importSearchTerms[category]?.toLowerCase() || '';
    
    if (!searchTerm) return items;
    
    return items.filter((item, index) => {
      const searchableText = getImportSearchableText(category, item);
      return searchableText.includes(searchTerm);
    });
  };
  
  // Get searchable text for import item
  const getImportSearchableText = (category, item) => {
    switch (category) {
      case 'clients':
        return `${item.name || ''} ${item.phone || ''} ${item.email || ''} ${item.address || ''}`.toLowerCase();
      case 'services':
        return `${item.name || ''} ${item.description || ''} ${item.price || ''}`.toLowerCase();
      case 'expenseCategories':
        return `${item.name || ''}`.toLowerCase();
      case 'bookings':
        return `${item.booking_date || ''} ${item.booking_time || ''} ${item.status || ''} ${item.total_price || ''} ${item.location_name || ''}`.toLowerCase();
      case 'expenses':
        return `${item.description || ''} ${item.amount || ''} ${item.expense_date || ''}`.toLowerCase();
      default:
        return '';
    }
  };
  
  // Get display text for import item
  const getImportDisplayText = (category, item) => {
    switch (category) {
      case 'clients':
        return `${item.name}${item.phone ? ` - ${item.phone}` : ''}`;
      case 'services':
        return `${item.name} - Rp ${parseFloat(item.price).toLocaleString('id-ID')}`;
      case 'expenseCategories':
        return item.name;
      case 'bookings':
        const bookingDate = new Date(item.booking_date).toLocaleDateString('id-ID');
        // Get client and service names from notes if available
        let clientName = 'Klien';
        let serviceName = 'Layanan';
        
        try {
          if (item.notes) {
            const notes = JSON.parse(item.notes);
            if (notes.services && notes.services.length > 0) {
              serviceName = notes.services.map(s => s.service_name).join(', ');
            }
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
        
        // Try to get client name from importData if available
        if (importData && importData.clients && item.client_id) {
          const client = importData.clients.find(c => c.id === item.client_id);
          if (client) clientName = client.name;
        }
        
        const locationInfo = item.location_name ? ` 📍 ${item.location_name}` : '';
        return `${bookingDate} ${item.booking_time} - ${clientName} - ${serviceName}${locationInfo} - Rp ${parseFloat(item.total_price).toLocaleString('id-ID')} (${item.status})`;
      case 'expenses':
        const expenseDate = new Date(item.expense_date).toLocaleDateString('id-ID');
        return `${expenseDate} - ${item.description} - Rp ${parseFloat(item.amount).toLocaleString('id-ID')}`;
      default:
        return '';
    }
  };
  
  // Toggle import item selection
  const handleToggleImportItem = (category, index) => {
    setImportSelection(prev => {
      const current = prev[category] || [];
      const isSelected = current.includes(index);
      
      const newSelection = {
        ...prev,
        [category]: isSelected 
          ? current.filter(i => i !== index)
          : [...current, index]
      };
      
      // Special handling for bookings: auto-check related clients & services
      if (category === 'bookings' && !isSelected && importData) {
        const booking = importData.bookings[index];
        
        // Auto-check related client (if not duplicate)
        if (booking.client_id && importData.clients) {
          const clientIndex = importData.clients.findIndex(c => c.id === booking.client_id);
          if (clientIndex !== -1 && !duplicateData.clients?.includes(clientIndex)) {
            const currentClients = newSelection.clients || [];
            if (!currentClients.includes(clientIndex)) {
              newSelection.clients = [...currentClients, clientIndex];
            }
          }
        }
        
        // Auto-check ALL related services (from notes JSON)
        const serviceIndices = new Set();
        
        // First, check service_id if exists
        if (booking.service_id && importData.services) {
          const serviceIndex = importData.services.findIndex(s => s.id === booking.service_id);
          if (serviceIndex !== -1 && !duplicateData.services?.includes(serviceIndex)) {
            serviceIndices.add(serviceIndex);
          }
        }
        
        // Then, check ALL services from notes (multiple services)
        try {
          if (booking.notes) {
            const notes = JSON.parse(booking.notes);
            
            if (notes.services && Array.isArray(notes.services)) {
              notes.services.forEach(service => {
                let serviceIndex = -1;
                
                // Method 1: Try service_id first (convert to number if string)
                if (service.service_id) {
                  const serviceId = typeof service.service_id === 'string' ? parseInt(service.service_id) : service.service_id;
                  serviceIndex = importData.services.findIndex(s => s.id === serviceId);
                }
                
                // Method 2: If not found, try id field (convert to number if string)
                if (serviceIndex === -1 && service.id) {
                  const serviceId = typeof service.id === 'string' ? parseInt(service.id) : service.id;
                  serviceIndex = importData.services.findIndex(s => s.id === serviceId);
                }
                
                // Method 3: If still not found, try matching by name and price
                if (serviceIndex === -1 && service.service_name) {
                  const servicePrice = service.custom_price || service.price || 0;
                  serviceIndex = importData.services.findIndex(s => 
                    s.name === service.service_name && 
                    parseFloat(s.price) === parseFloat(servicePrice)
                  );
                }
                
                // Add to selection if found and not duplicate
                if (serviceIndex !== -1 && !duplicateData.services?.includes(serviceIndex)) {
                  serviceIndices.add(serviceIndex);
                }
              });
            }
          }
        } catch (e) {
          console.error('Error parsing booking notes:', e);
        }
        
        // Add all found service indices to selection
        if (serviceIndices.size > 0) {
          const currentServices = newSelection.services || [];
          newSelection.services = [...new Set([...currentServices, ...serviceIndices])];
        }
      }
      
      // Special handling for expenses: auto-check related expense category
      if (category === 'expenses' && !isSelected && importData) {
        const expense = importData.expenses[index];
        
        // Auto-check related expense category (if not duplicate)
        if (expense.category_id && importData.expenseCategories) {
          const categoryIndex = importData.expenseCategories.findIndex(c => c.id === expense.category_id);
          if (categoryIndex !== -1 && !duplicateData.expenseCategories?.includes(categoryIndex)) {
            const currentCategories = newSelection.expenseCategories || [];
            if (!currentCategories.includes(categoryIndex)) {
              newSelection.expenseCategories = [...currentCategories, categoryIndex];
            }
          }
        }
      }
      
      // Prevent unchecking expense categories that are still used by checked expenses
      if (category === 'expenseCategories' && isSelected && importData) {
        const selectedExpenses = newSelection.expenses || [];
        
        // Check if this category is still used by any checked expense
        const isStillUsed = selectedExpenses.some(expenseIdx => {
          const expense = importData.expenses[expenseIdx];
          return expense.category_id === importData.expenseCategories[index]?.id;
        });
        
        // If still used, prevent unchecking
        if (isStillUsed) {
          newSelection[category] = current;
          
          const categoryName = importData.expenseCategories[index]?.name;
          setTimeout(() => {
            showNotification('warning', 
              `Kategori Pengeluaran "${categoryName}" masih digunakan oleh pengeluaran yang dipilih. Hapus centang pengeluaran terlebih dahulu.`
            );
          }, 100);
        }
      }
      
      // Prevent unchecking clients/services that are still used by checked bookings
      if ((category === 'clients' || category === 'services') && isSelected && importData) {
        const selectedBookings = newSelection.bookings || [];
        
        // Check if this client/service is still used by any checked booking
        const isStillUsed = selectedBookings.some(bookingIdx => {
          const booking = importData.bookings[bookingIdx];
          
          if (category === 'clients') {
            // Check if booking uses this client
            return booking.client_id === importData.clients[index]?.id;
          } else {
            // Check if booking uses this service (in service_id or notes.services)
            const serviceId = importData.services[index]?.id;
            
            // Check service_id
            if (booking.service_id === serviceId) return true;
            
            // Check services in notes (try multiple methods)
            try {
              if (booking.notes) {
                const notes = JSON.parse(booking.notes);
                if (notes.services && Array.isArray(notes.services)) {
                  return notes.services.some(s => {
                    // Convert to number if string for comparison
                    const sServiceId = typeof s.service_id === 'string' ? parseInt(s.service_id) : s.service_id;
                    const sId = typeof s.id === 'string' ? parseInt(s.id) : s.id;
                    
                    // Try service_id, id match
                    if (sServiceId === serviceId || sId === serviceId) return true;
                    
                    // Try name and price match (use custom_price or price)
                    const service = importData.services[index];
                    const sPrice = s.custom_price || s.price || 0;
                    if (s.service_name === service.name && 
                        parseFloat(sPrice) === parseFloat(service.price)) {
                      return true;
                    }
                    
                    return false;
                  });
                }
              }
            } catch (e) {
              console.error('Error parsing booking notes:', e);
            }
            
            return false;
          }
        });
        
        // If still used, prevent unchecking (keep it selected)
        if (isStillUsed) {
          newSelection[category] = current; // Revert to previous state
          
          // Show warning notification
          const itemName = category === 'clients' 
            ? importData.clients[index]?.name 
            : importData.services[index]?.name;
          
          setTimeout(() => {
            showNotification('warning', 
              `${category === 'clients' ? 'Klien' : 'Layanan'} "${itemName}" masih digunakan oleh booking yang dipilih. Hapus centang booking terlebih dahulu.`
            );
          }, 100);
        }
      }
      
      return newSelection;
    });
  };
  
  // Toggle all items in import category
  const handleToggleAllImport = (category, checked) => {
    if (!importData || !importData[category]) return;
    
    setImportSelection(prev => {
      const newSelection = {
        ...prev,
        [category]: checked 
          ? importData[category]
              .map((_, index) => index)
              .filter(index => !duplicateData[category]?.includes(index)) // ✅ Skip duplicates
          : []
      };
      
      // Auto-check related clients & services when checking all bookings
      if (category === 'bookings' && checked && importData.bookings) {
        const clientIndices = new Set();
        const serviceIndices = new Set();
        
        // Loop through all bookings to find related clients & services
        importData.bookings.forEach((booking, bookingIndex) => {
          // Skip duplicate bookings
          if (duplicateData.bookings?.includes(bookingIndex)) return;
          
          // Find and collect related client
          if (booking.client_id && importData.clients) {
            const clientIdx = importData.clients.findIndex(c => c.id === booking.client_id);
            if (clientIdx !== -1 && !duplicateData.clients?.includes(clientIdx)) {
              clientIndices.add(clientIdx);
            }
          }
          
          // Find and collect related service from service_id
          if (booking.service_id && importData.services) {
            const serviceIdx = importData.services.findIndex(s => s.id === booking.service_id);
            if (serviceIdx !== -1 && !duplicateData.services?.includes(serviceIdx)) {
              serviceIndices.add(serviceIdx);
            }
          }
          
          // Find and collect ALL services from notes (multiple services)
          try {
            if (booking.notes) {
              const notes = JSON.parse(booking.notes);
              if (notes.services && Array.isArray(notes.services)) {
                notes.services.forEach(service => {
                  // Try multiple methods to find service
                  let serviceIdx = -1;
                  
                  // Method 1: Try service_id first (convert to number if string)
                  if (service.service_id && importData.services) {
                    const serviceId = typeof service.service_id === 'string' ? parseInt(service.service_id) : service.service_id;
                    serviceIdx = importData.services.findIndex(s => s.id === serviceId);
                  }
                  
                  // Method 2: If not found, try id field (convert to number if string)
                  if (serviceIdx === -1 && service.id && importData.services) {
                    const serviceId = typeof service.id === 'string' ? parseInt(service.id) : service.id;
                    serviceIdx = importData.services.findIndex(s => s.id === serviceId);
                  }
                  
                  // Method 3: If still not found, try matching by name and price (use custom_price or price)
                  if (serviceIdx === -1 && service.service_name && importData.services) {
                    const servicePrice = service.custom_price || service.price || 0;
                    serviceIdx = importData.services.findIndex(s => 
                      s.name === service.service_name && 
                      parseFloat(s.price) === parseFloat(servicePrice)
                    );
                  }
                  
                  // Add to selection if found and not duplicate
                  if (serviceIdx !== -1 && !duplicateData.services?.includes(serviceIdx)) {
                    serviceIndices.add(serviceIdx);
                  }
                });
              }
            }
          } catch (e) {
            console.error('Error parsing booking notes:', e);
          }
        });
        
        // Add all collected indices to selection (merge with existing)
        newSelection.clients = [...new Set([...(prev.clients || []), ...clientIndices])];
        newSelection.services = [...new Set([...(prev.services || []), ...serviceIndices])];
      }
      
      // Auto-check related expense categories when checking all expenses
      if (category === 'expenses' && checked && importData.expenses) {
        const categoryIndices = new Set();
        
        // Loop through all expenses to find related categories
        importData.expenses.forEach((expense, expenseIndex) => {
          // Skip duplicate expenses
          if (duplicateData.expenses?.includes(expenseIndex)) return;
          
          // Find and collect related category
          if (expense.category_id && importData.expenseCategories) {
            const categoryIdx = importData.expenseCategories.findIndex(c => c.id === expense.category_id);
            if (categoryIdx !== -1 && !duplicateData.expenseCategories?.includes(categoryIdx)) {
              categoryIndices.add(categoryIdx);
            }
          }
        });
        
        // Add all collected category indices to selection (merge with existing)
        newSelection.expenseCategories = [...new Set([...(prev.expenseCategories || []), ...categoryIndices])];
      }
      
      // Prevent unchecking all expense categories if they are still used by checked expenses
      if (category === 'expenseCategories' && !checked && importData) {
        const selectedExpenses = prev.expenses || [];
        
        if (selectedExpenses.length > 0) {
          // Collect all categories that are still used by checked expenses
          const protectedIndices = new Set();
          
          selectedExpenses.forEach(expenseIdx => {
            const expense = importData.expenses[expenseIdx];
            
            // Find category index
            if (expense.category_id && importData.expenseCategories) {
              const categoryIdx = importData.expenseCategories.findIndex(c => c.id === expense.category_id);
              if (categoryIdx !== -1) {
                protectedIndices.add(categoryIdx);
              }
            }
          });
          
          // Keep protected indices selected
          if (protectedIndices.size > 0) {
            newSelection.expenseCategories = Array.from(protectedIndices);
            
            // Show notification
            setTimeout(() => {
              showNotification('warning', 
                `Tidak dapat menghilangkan semua centang. ${protectedIndices.size} kategori pengeluaran masih digunakan oleh pengeluaran yang dipilih.`
              );
            }, 100);
          }
        }
      }
      
      // Prevent unchecking all clients/services if they are still used by checked bookings
      if ((category === 'clients' || category === 'services') && !checked && importData) {
        const selectedBookings = prev.bookings || [];
        
        if (selectedBookings.length > 0) {
          // Collect all clients/services that are still used by checked bookings
          const protectedIndices = new Set();
          
          selectedBookings.forEach(bookingIdx => {
            const booking = importData.bookings[bookingIdx];
            
            if (category === 'clients') {
              // Find client index
              if (booking.client_id && importData.clients) {
                const clientIdx = importData.clients.findIndex(c => c.id === booking.client_id);
                if (clientIdx !== -1) {
                  protectedIndices.add(clientIdx);
                }
              }
            } else if (category === 'services') {
              // Find service indices (from service_id and notes.services)
              if (booking.service_id && importData.services) {
                const serviceIdx = importData.services.findIndex(s => s.id === booking.service_id);
                if (serviceIdx !== -1) {
                  protectedIndices.add(serviceIdx);
                }
              }
              
              // Check services in notes (try multiple methods)
              try {
                if (booking.notes) {
                  const notes = JSON.parse(booking.notes);
                  if (notes.services && Array.isArray(notes.services)) {
                    notes.services.forEach(service => {
                      let serviceIdx = -1;
                      
                      // Method 1: Try service_id (convert to number if string)
                      if (service.service_id && importData.services) {
                        const serviceId = typeof service.service_id === 'string' ? parseInt(service.service_id) : service.service_id;
                        serviceIdx = importData.services.findIndex(s => s.id === serviceId);
                      }
                      
                      // Method 2: Try id field (convert to number if string)
                      if (serviceIdx === -1 && service.id && importData.services) {
                        const serviceId = typeof service.id === 'string' ? parseInt(service.id) : service.id;
                        serviceIdx = importData.services.findIndex(s => s.id === serviceId);
                      }
                      
                      // Method 3: Try name and price match (use custom_price or price)
                      if (serviceIdx === -1 && service.service_name && importData.services) {
                        const servicePrice = service.custom_price || service.price || 0;
                        serviceIdx = importData.services.findIndex(s => 
                          s.name === service.service_name && 
                          parseFloat(s.price) === parseFloat(servicePrice)
                        );
                      }
                      
                      if (serviceIdx !== -1) {
                        protectedIndices.add(serviceIdx);
                      }
                    });
                  }
                }
              } catch (e) {
                console.error('Error parsing booking notes:', e);
              }
            }
          });
          
          // Keep protected indices selected
          if (protectedIndices.size > 0) {
            newSelection[category] = Array.from(protectedIndices);
            
            // Show notification
            setTimeout(() => {
              showNotification('warning', 
                `Tidak dapat menghilangkan semua centang. ${protectedIndices.size} ${category === 'clients' ? 'klien' : 'layanan'} masih digunakan oleh booking yang dipilih.`
              );
            }, 100);
          }
        }
      }
      
      return newSelection;
    });
  };
  
  // Execute import with selected data
  const handleConfirmImport = async () => {
    try {
      setLoading(true);
      
      // Validate: ensure no duplicate data is selected
      const hasInvalidSelection = 
        importSelection.clients?.some(idx => duplicateData.clients?.includes(idx)) ||
        importSelection.services?.some(idx => duplicateData.services?.includes(idx)) ||
        importSelection.bookings?.some(idx => duplicateData.bookings?.includes(idx)) ||
        importSelection.expenses?.some(idx => duplicateData.expenses?.includes(idx)) ||
        importSelection.expenseCategories?.some(idx => duplicateData.expenseCategories?.includes(idx));
      
      if (hasInvalidSelection) {
        showNotification('error', 'Tidak dapat mengimport data duplikat. Silakan hapus centang pada data duplikat.');
        setLoading(false);
        return;
      }
      
      // Get selected bookings
      const selectedBookings = importSelection.bookings?.map(index => importData.bookings[index]).filter(Boolean) || [];
      
      // Get ALL payments related to selected bookings
      const selectedBookingIds = selectedBookings.map(b => b.id);
      const relatedPayments = importData.payments ? 
        importData.payments.filter(p => selectedBookingIds.includes(p.booking_id)) : [];
      
      // Filter selected data
      const selectedData = {
        companySettings: importSelection.companySettings ? importData.companySettings : null,
        // IMPORTANT: Always include ALL clients and services for ID mapping in backend
        // Even if they are duplicates and not imported, backend needs them to map booking IDs
        clients: importData.clients || [],
        services: importData.services || [],
        bookings: selectedBookings,
        payments: relatedPayments, // Include all payments for selected bookings
        expenses: importSelection.expenses?.map(index => importData.expenses[index]).filter(Boolean) || [],
        expenseCategories: importSelection.expenseCategories?.map(index => importData.expenseCategories[index]).filter(Boolean) || []
      };
      
      // Track which items should actually be imported (not duplicates)
      const importFlags = {
        clients: importSelection.clients || [],
        services: importSelection.services || [],
        bookings: importSelection.bookings || [],
        expenses: importSelection.expenses || [],
        expenseCategories: importSelection.expenseCategories || []
      };
      
      // Log what will be imported
      console.log('=== DATA TO IMPORT ===');
      console.log('Clients:', selectedData.clients.length);
      console.log('Services:', selectedData.services.length);
      console.log('Bookings:', selectedData.bookings.length);
      console.log('Payments:', selectedData.payments.length);
      console.log('Expenses:', selectedData.expenses.length);
      console.log('Expense Categories:', selectedData.expenseCategories.length);
      console.log('======================');
      console.log('📦 Booking details to import:', selectedData.bookings);
      console.log('📦 Client IDs in bookings:', selectedData.bookings.map(b => b.client_id));
      console.log('📦 Service IDs in bookings:', selectedData.bookings.map(b => b.service_id));
      
      // Create a new backup file with selected data
      const backupFile = {
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        selection: {
          companySettings: !!selectedData.companySettings,
          clients: selectedData.clients.length > 0,
          services: selectedData.services.length > 0,
          bookings: selectedData.bookings.length > 0,
          payments: selectedData.payments.length > 0,
          expenses: selectedData.expenses.length > 0,
          expenseCategories: selectedData.expenseCategories.length > 0
        },
        importFlags: importFlags, // Tell backend which items to actually import
        data: selectedData
      };
      
      // Convert to blob and upload
      const blob = new Blob([JSON.stringify(backupFile, null, 2)], { type: 'application/json' });
      const formData = new FormData();
      formData.append('backupFile', blob, 'filtered-backup.json');
      formData.append('importType', 'add');
      
      const response = await api.post('/backup/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        showNotification('success', `Berhasil mengimport ${
          selectedData.clients.length + 
          selectedData.services.length + 
          selectedData.bookings.length + 
          selectedData.expenses.length +
          selectedData.expenseCategories.length
        } data`);
        
        setShowImportPreview(false);
        setImportFile(null);
        setImportData(null);
        fetchDataStats();
      }
    } catch (error) {
      console.error('Error importing data:', error);
      showNotification('error', error.response?.data?.message || 'Gagal mengimport data.');
    } finally {
      setLoading(false);
    }
  };

  // Import JSON Data (for replace mode)
  const handleImport = async () => {
    if (!importFile) {
      showNotification('error', 'Silakan pilih file backup terlebih dahulu.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('backupFile', importFile);
      formData.append('importType', importType);

      const response = await api.post('/backup/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        showNotification('success', response.data.message);
        setShowImportModal(false);
        setImportFile(null);
        fetchDataStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error importing data:', error);
      showNotification('error', error.response?.data?.message || 'Gagal mengimport data. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Backup & Restore Data
          </h1>
          <p className="text-slate-600 mt-2">
            Export dan import data booking, keuangan, dan pengeluaran Anda
          </p>
        </div>

        {/* Notification */}
        {notification.show && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {notification.type === 'success' ? (
              <FiCheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            ) : (
              <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            )}
            <div className="flex-1">
              <p className={`font-medium ${
                notification.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {notification.message}
              </p>
            </div>
            <button 
              onClick={() => setNotification({ show: false, type: '', message: '' })}
              className={`${
                notification.type === 'success' ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'
              }`}
            >
              <FiX size={18} />
            </button>
          </div>
        )}

        {/* Data Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 font-medium">Total Booking</span>
              <FiDatabase className="text-blue-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{dataStats.totalBookings}</p>
            <p className="text-xs text-gray-500 mt-1">Data booking tersedia</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 font-medium">Total Pembayaran</span>
              <FiDatabase className="text-green-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{dataStats.totalPayments}</p>
            <p className="text-xs text-gray-500 mt-1">Data pembayaran tersedia</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 font-medium">Total Pengeluaran</span>
              <FiDatabase className="text-red-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{dataStats.totalExpenses}</p>
            <p className="text-xs text-gray-500 mt-1">Data pengeluaran tersedia</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 font-medium">Total Klien</span>
              <FiDatabase className="text-purple-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{dataStats.totalClients}</p>
            <p className="text-xs text-gray-500 mt-1">Data klien tersedia</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 font-medium">Total Layanan</span>
              <FiDatabase className="text-orange-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{dataStats.totalServices}</p>
            <p className="text-xs text-gray-500 mt-1">Data layanan tersedia</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Export Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <FiDownload className="text-white" size={24} />
                <h2 className="text-xl font-bold text-white">Export Data</h2>
              </div>
              <p className="text-blue-100 text-sm mt-1">Download data Anda dalam berbagai format</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Export Excel/CSV */}
              <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiFileText className="text-green-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">Export ke Excel/CSV</h3>
                    <p className="text-sm text-gray-600">
                      Export data dalam format Excel atau CSV. Cocok untuk membuka di Microsoft Excel, Google Sheets, atau aplikasi spreadsheet lainnya.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleShowExportFileModal('xlsx')}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FiDownload size={18} />
                    Export Excel
                  </button>
                  <button
                    onClick={() => handleShowExportFileModal('csv')}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:shadow-lg hover:shadow-teal-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FiDownload size={18} />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Export JSON */}
              <div className="border border-gray-200 rounded-xl p-5 hover:border-purple-300 transition-colors">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiDatabase className="text-purple-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">Export Backup Lengkap (JSON)</h3>
                    <p className="text-sm text-gray-600">
                      Export seluruh data dalam format JSON yang bisa di-import kembali ke sistem. 
                      Cocok untuk backup lengkap atau pindah akun dengan data utuh.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleShowExportModal}
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FiDownload size={18} />
                  Export Backup JSON
                </button>
              </div>
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <FiUpload className="text-white" size={24} />
                <h2 className="text-xl font-bold text-white">Import Data</h2>
              </div>
              <p className="text-orange-100 text-sm mt-1">Restore data dari file backup JSON</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Import Replace */}
              <div className="border border-gray-200 rounded-xl p-5 hover:border-orange-300 transition-colors">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiRefreshCw className="text-red-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">Import & Ganti Data</h3>
                    <p className="text-sm text-gray-600">
                      <span className="text-red-600 font-semibold">⚠️ PERHATIAN:</span> Semua data yang ada sekarang akan 
                      <span className="font-semibold"> DIHAPUS</span> dan diganti dengan data dari file backup.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setImportType('replace');
                    setShowImportModal(true);
                  }}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/30 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <FiRefreshCw size={18} />
                  Import & Ganti Semua
                </button>
              </div>

              {/* Import Add */}
              <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiPlus className="text-blue-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">Import & Tambahkan Data</h3>
                    <p className="text-sm text-gray-600">
                      Data yang ada sekarang <span className="font-semibold">TETAP AMAN</span>. 
                      Data dari file backup akan ditambahkan ke data yang sudah ada.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setImportType('add');
                    setShowImportModal(true);
                  }}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <FiPlus size={18} />
                  Import & Tambahkan
                </button>
              </div>

              {/* Warning Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <FiAlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Tips Backup:</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-700">
                    <li>Pastikan file backup dalam format JSON yang valid</li>
                    <li>Backup data secara berkala untuk keamanan</li>
                    <li>Simpan file backup di tempat yang aman</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className={`${
              importType === 'replace' 
                ? 'bg-gradient-to-r from-red-600 to-rose-600' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600'
            } px-6 py-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                {importType === 'replace' ? (
                  <FiRefreshCw className="text-white" size={24} />
                ) : (
                  <FiPlus className="text-white" size={24} />
                )}
                <h2 className="text-xl font-bold text-white">
                  {importType === 'replace' ? 'Import & Ganti Data' : 'Import & Tambahkan Data'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                }}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Warning */}
              {importType === 'replace' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-red-800">
                    <p className="font-bold mb-2">⚠️ PERINGATAN PENTING!</p>
                    <p>
                      Dengan melanjutkan proses ini, <span className="font-bold">SEMUA DATA YANG ADA SEKARANG AKAN DIHAPUS PERMANEN</span> dan 
                      diganti dengan data dari file backup yang Anda pilih.
                    </p>
                    <p className="mt-2 font-semibold">
                      Pastikan Anda sudah membuat backup data yang ada sekarang sebelum melanjutkan!
                    </p>
                  </div>
                </div>
              )}

              {importType === 'add' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                  <FiAlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-blue-800">
                    <p className="font-bold mb-2">ℹ️ Informasi</p>
                    <p>
                      Data dari file backup akan <span className="font-bold">DITAMBAHKAN</span> ke data yang sudah ada. 
                      Data yang ada sekarang tidak akan dihapus atau diubah.
                    </p>
                  </div>
                </div>
              )}

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pilih File Backup (JSON)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="hidden"
                    id="backup-file"
                  />
                  <label htmlFor="backup-file" className="cursor-pointer">
                    <FiUpload className="mx-auto text-gray-400 mb-3" size={48} />
                    <p className="text-sm text-gray-600 font-medium mb-1">
                      {importFile ? importFile.name : 'Klik untuk pilih file backup'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Format: JSON (*.json)
                    </p>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importFile || loading}
                  className={`flex-1 px-4 py-2.5 ${
                    importType === 'replace'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:shadow-red-500/30'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30'
                  } text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <FiUpload size={18} />
                      {importType === 'replace' ? 'Ganti Data' : 'Tambahkan Data'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Preview & Selection Modal */}
      {showImportPreview && importData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <FiCheckCircle className="text-white" size={24} />
                <div>
                  <h2 className="text-xl font-bold text-white">Preview & Pilih Data untuk Import</h2>
                  <p className="text-green-100 text-sm">Centang data yang ingin diimport</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImportPreview(false);
                  setImportFile(null);
                  setImportData(null);
                }}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Summary Info */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-green-800 flex-1">
                    <p className="font-bold mb-2">📊 Ringkasan File Backup:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {importData.clients && (
                        <div className="bg-white rounded px-2 py-1">
                          <span className="font-semibold">{importData.clients.length}</span> Klien
                        </div>
                      )}
                      {importData.services && (
                        <div className="bg-white rounded px-2 py-1">
                          <span className="font-semibold">{importData.services.length}</span> Layanan
                        </div>
                      )}
                      {importData.bookings && (
                        <div className="bg-white rounded px-2 py-1">
                          <span className="font-semibold">{importData.bookings.length}</span> Booking
                        </div>
                      )}
                      {importData.expenses && (
                        <div className="bg-white rounded px-2 py-1">
                          <span className="font-semibold">{importData.expenses.length}</span> Pengeluaran
                        </div>
                      )}
                      {importData.expenseCategories && (
                        <div className="bg-white rounded px-2 py-1">
                          <span className="font-semibold">{importData.expenseCategories.length}</span> Kategori
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-green-700">
                      ✅ <span className="font-semibold">
                        {(importSelection.clients?.length || 0) + 
                         (importSelection.services?.length || 0) + 
                         (importSelection.bookings?.length || 0) + 
                         (importSelection.expenses?.length || 0) +
                         (importSelection.expenseCategories?.length || 0)}
                      </span> data dipilih untuk import
                    </p>
                  </div>
                </div>
              </div>

              {/* Duplicate Warning */}
              {(duplicateData.clients?.length > 0 || 
                duplicateData.services?.length > 0 || 
                duplicateData.expenseCategories?.length > 0 ||
                duplicateData.bookings?.length > 0 ||
                duplicateData.expenses?.length > 0) && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FiAlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="text-sm text-amber-800">
                      <p className="font-bold mb-2">⚠️ Data Duplikat Terdeteksi!</p>
                      <p className="mb-2">
                        Kami menemukan beberapa data yang sudah ada di sistem. Data duplikat otomatis 
                        <span className="font-bold"> TIDAK DICENTANG</span> untuk mencegah duplikasi.
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-amber-700">
                        {duplicateData.clients?.length > 0 && (
                          <li>{duplicateData.clients.length} klien duplikat (berdasarkan nama/telepon/email)</li>
                        )}
                        {duplicateData.services?.length > 0 && (
                          <li>{duplicateData.services.length} layanan duplikat (berdasarkan nama & harga)</li>
                        )}
                        {duplicateData.expenseCategories?.length > 0 && (
                          <li>{duplicateData.expenseCategories.length} kategori duplikat (berdasarkan nama)</li>
                        )}
                        {duplicateData.bookings?.length > 0 && (
                          <li>{duplicateData.bookings.length} booking duplikat (berdasarkan tanggal, waktu, harga & status)</li>
                        )}
                        {duplicateData.expenses?.length > 0 && (
                          <li>{duplicateData.expenses.length} pengeluaran duplikat (berdasarkan tanggal, jumlah & deskripsi)</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Company Settings */}
              {importData.companySettings && (
                <div className="border-2 border-purple-200 rounded-xl p-4 bg-purple-50">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importSelection.companySettings}
                      onChange={(e) => setImportSelection(prev => ({...prev, companySettings: e.target.checked}))}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">Pengaturan Perusahaan</span>
                        <span className="px-2 py-0.5 text-xs bg-purple-600 text-white rounded-full">Akan Update/Ganti</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {importData.companySettings.company_name || 'Nama Perusahaan'} - 
                        Pengaturan perusahaan akan diganti dengan data dari backup
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Data Categories */}
              <div className="space-y-3">
                {/* Clients */}
                {importData.clients && importData.clients.length > 0 && (
                  <div className="border-2 border-blue-200 rounded-xl overflow-hidden">
                    <div className="bg-blue-50 p-4">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={(() => {
                              const nonDuplicateCount = importData.clients.filter((_, idx) => !duplicateData.clients?.includes(idx)).length;
                              return nonDuplicateCount > 0 && importSelection.clients?.length === nonDuplicateCount;
                            })()}
                            onChange={(e) => handleToggleAllImport('clients', e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                          <div>
                            <span className="font-semibold text-gray-800">Data Klien</span>
                            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                              {importSelection.clients?.length || 0} / {importData.clients.filter((_, idx) => !duplicateData.clients?.includes(idx)).length} dipilih
                            </span>
                            {duplicateData.clients?.length > 0 && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                                {duplicateData.clients.length} duplikat
                              </span>
                            )}
                          </div>
                        </label>
                        <button
                          onClick={() => setExpandedCategories(prev => ({...prev, importClients: !prev.importClients}))}
                          className="text-blue-600 hover:bg-blue-100 p-1 rounded"
                        >
                          {expandedCategories.importClients ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                        </button>
                      </div>
                    </div>
                    
                    {expandedCategories.importClients && (
                      <div className="bg-white p-4">
                        {/* Search */}
                        <div className="relative mb-3">
                          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            placeholder="Cari klien (nama, telepon, email, alamat)..."
                            value={importSearchTerms.clients || ''}
                            onChange={(e) => setImportSearchTerms({...importSearchTerms, clients: e.target.value})}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        {/* Items List with Scroll */}
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {getFilteredImportItems('clients').map((item, originalIndex) => {
                            // Find original index in full array
                            const index = importData.clients.indexOf(item);
                            const isDuplicate = duplicateData.clients?.includes(index);
                            return (
                              <label 
                                key={index} 
                                className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                                  isDuplicate 
                                    ? 'bg-amber-50 border border-amber-200' 
                                    : 'hover:bg-blue-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={importSelection.clients?.includes(index)}
                                  onChange={() => handleToggleImportItem('clients', index)}
                                  className="w-4 h-4 text-blue-600 rounded"
                                  disabled={isDuplicate}
                                />
                                <span className={`text-sm flex-1 ${isDuplicate ? 'text-amber-700' : 'text-gray-700'}`}>
                                  {getImportDisplayText('clients', item)}
                                  {isDuplicate && <span className="ml-2 text-xs font-semibold text-amber-600">[DUPLIKAT]</span>}
                                </span>
                              </label>
                            );
                          })}
                          {getFilteredImportItems('clients').length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">Tidak ada data ditemukan</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Services */}
                {importData.services && importData.services.length > 0 && (
                  <div className="border-2 border-orange-200 rounded-xl overflow-hidden">
                    <div className="bg-orange-50 p-4">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={(() => {
                              const nonDuplicateCount = importData.services.filter((_, idx) => !duplicateData.services?.includes(idx)).length;
                              return nonDuplicateCount > 0 && importSelection.services?.length === nonDuplicateCount;
                            })()}
                            onChange={(e) => handleToggleAllImport('services', e.target.checked)}
                            className="w-5 h-5 text-orange-600 rounded"
                          />
                          <div>
                            <span className="font-semibold text-gray-800">Data Layanan</span>
                            <span className="ml-2 px-2 py-0.5 text-xs bg-orange-600 text-white rounded-full">
                              {importSelection.services?.length || 0} / {importData.services.filter((_, idx) => !duplicateData.services?.includes(idx)).length} dipilih
                            </span>
                            {duplicateData.services?.length > 0 && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                                {duplicateData.services.length} duplikat
                              </span>
                            )}
                          </div>
                        </label>
                        <button
                          onClick={() => setExpandedCategories(prev => ({...prev, importServices: !prev.importServices}))}
                          className="text-orange-600 hover:bg-orange-100 p-1 rounded"
                        >
                          {expandedCategories.importServices ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                        </button>
                      </div>
                    </div>
                    
                    {expandedCategories.importServices && (
                      <div className="bg-white p-4">
                        {/* Search */}
                        <div className="relative mb-3">
                          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            placeholder="Cari layanan (nama, deskripsi, harga)..."
                            value={importSearchTerms.services || ''}
                            onChange={(e) => setImportSearchTerms({...importSearchTerms, services: e.target.value})}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>
                        
                        {/* Items List with Scroll */}
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {getFilteredImportItems('services').map((item, originalIndex) => {
                            // Find original index in full array
                            const index = importData.services.indexOf(item);
                            const isDuplicate = duplicateData.services?.includes(index);
                            return (
                              <label 
                                key={index} 
                                className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                                  isDuplicate 
                                    ? 'bg-amber-50 border border-amber-200' 
                                    : 'hover:bg-orange-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={importSelection.services?.includes(index)}
                                  onChange={() => handleToggleImportItem('services', index)}
                                  className="w-4 h-4 text-orange-600 rounded"
                                  disabled={isDuplicate}
                                />
                                <span className={`text-sm flex-1 ${isDuplicate ? 'text-amber-700' : 'text-gray-700'}`}>
                                  {getImportDisplayText('services', item)}
                                  {isDuplicate && <span className="ml-2 text-xs font-semibold text-amber-600">[DUPLIKAT]</span>}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Expense Categories */}
                {importData.expenseCategories && importData.expenseCategories.length > 0 && (
                  <div className="border-2 border-pink-200 rounded-xl overflow-hidden">
                    <div className="bg-pink-50 p-4">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={(() => {
                              const nonDuplicateCount = importData.expenseCategories.filter((_, idx) => !duplicateData.expenseCategories?.includes(idx)).length;
                              return nonDuplicateCount > 0 && importSelection.expenseCategories?.length === nonDuplicateCount;
                            })()}
                            onChange={(e) => handleToggleAllImport('expenseCategories', e.target.checked)}
                            className="w-5 h-5 text-pink-600 rounded"
                          />
                          <div>
                            <span className="font-semibold text-gray-800">Kategori Pengeluaran</span>
                            <span className="ml-2 px-2 py-0.5 text-xs bg-pink-600 text-white rounded-full">
                              {importSelection.expenseCategories?.length || 0} / {importData.expenseCategories.filter((_, idx) => !duplicateData.expenseCategories?.includes(idx)).length} dipilih
                            </span>
                            {duplicateData.expenseCategories?.length > 0 && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                                {duplicateData.expenseCategories.length} duplikat
                              </span>
                            )}
                          </div>
                        </label>
                        <button
                          onClick={() => setExpandedCategories(prev => ({...prev, importCategories: !prev.importCategories}))}
                          className="text-pink-600 hover:bg-pink-100 p-1 rounded"
                        >
                          {expandedCategories.importCategories ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                        </button>
                      </div>
                    </div>
                    
                    {expandedCategories.importCategories && (
                      <div className="bg-white p-4">
                        {/* Search */}
                        <div className="relative mb-3">
                          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            placeholder="Cari kategori pengeluaran..."
                            value={importSearchTerms.expenseCategories || ''}
                            onChange={(e) => setImportSearchTerms({...importSearchTerms, expenseCategories: e.target.value})}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          />
                        </div>
                        
                        {/* Items List with Scroll */}
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {getFilteredImportItems('expenseCategories').map((item, originalIndex) => {
                            // Find original index in full array
                            const index = importData.expenseCategories.indexOf(item);
                            const isDuplicate = duplicateData.expenseCategories?.includes(index);
                            return (
                              <label 
                                key={index} 
                                className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                                  isDuplicate 
                                    ? 'bg-amber-50 border border-amber-200' 
                                    : 'hover:bg-pink-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={importSelection.expenseCategories?.includes(index)}
                                  onChange={() => handleToggleImportItem('expenseCategories', index)}
                                  className="w-4 h-4 text-pink-600 rounded"
                                  disabled={isDuplicate}
                                />
                                <span className={`text-sm flex-1 ${isDuplicate ? 'text-amber-700' : 'text-gray-700'}`}>
                                  {getImportDisplayText('expenseCategories', item)}
                                  {item.is_default && <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">Default</span>}
                                  {isDuplicate && <span className="ml-2 text-xs font-semibold text-amber-600">[DUPLIKAT]</span>}
                                </span>
                              </label>
                            );
                          })}
                          {getFilteredImportItems('expenseCategories').length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">Tidak ada data ditemukan</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bookings with Dropdown */}
                {importData.bookings && importData.bookings.length > 0 && (
                  <div className="border-2 border-indigo-200 rounded-xl overflow-hidden">
                    <div className="bg-indigo-50 p-4">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={(() => {
                              const nonDuplicateCount = importData.bookings.filter((_, idx) => !duplicateData.bookings?.includes(idx)).length;
                              return nonDuplicateCount > 0 && importSelection.bookings?.length === nonDuplicateCount;
                            })()}
                            onChange={(e) => handleToggleAllImport('bookings', e.target.checked)}
                            className="w-5 h-5 text-indigo-600 rounded"
                          />
                          <div>
                            <span className="font-semibold text-gray-800">Data Booking</span>
                            <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-600 text-white rounded-full">
                              {importSelection.bookings?.length || 0} / {importData.bookings.filter((_, idx) => !duplicateData.bookings?.includes(idx)).length} dipilih
                            </span>
                            {duplicateData.bookings?.length > 0 && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                                {duplicateData.bookings.length} duplikat
                              </span>
                            )}
                            <p className="text-xs text-gray-600 mt-1">
                              Booking + pembayaran terkait akan diimport
                            </p>
                          </div>
                        </label>
                        <button
                          onClick={() => setExpandedCategories(prev => ({...prev, importBookings: !prev.importBookings}))}
                          className="text-indigo-600 hover:bg-indigo-100 p-1 rounded"
                        >
                          {expandedCategories.importBookings ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                        </button>
                      </div>
                    </div>
                    
                    {expandedCategories.importBookings && (
                      <div className="bg-white p-4">
                        {/* Search */}
                        <div className="relative mb-3">
                          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            placeholder="Cari booking (tanggal, waktu, harga, status)..."
                            value={importSearchTerms.bookings || ''}
                            onChange={(e) => setImportSearchTerms({...importSearchTerms, bookings: e.target.value})}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        
                        {/* Items List with Scroll */}
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {getFilteredImportItems('bookings').map((item, originalIndex) => {
                            // Find original index in full array
                            const index = importData.bookings.indexOf(item);
                            const isDuplicate = duplicateData.bookings?.includes(index);
                            return (
                              <label 
                                key={index} 
                                title={isDuplicate ? '❌ Data ini sudah ada di sistem dan tidak dapat diimport' : 'Klik untuk memilih data ini'}
                                className={`flex items-center gap-2 p-2 rounded ${
                                  isDuplicate 
                                    ? 'bg-amber-50 border border-amber-200 cursor-not-allowed' 
                                    : 'hover:bg-indigo-50 cursor-pointer'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={importSelection.bookings?.includes(index)}
                                  onChange={() => handleToggleImportItem('bookings', index)}
                                  className="w-4 h-4 text-indigo-600 rounded"
                                  disabled={isDuplicate}
                                />
                                <span className={`text-sm flex-1 ${isDuplicate ? 'text-amber-700' : 'text-gray-700'}`}>
                                  {getImportDisplayText('bookings', item)}
                                  {isDuplicate && <span className="ml-2 text-xs font-semibold text-amber-600">[DUPLIKAT]</span>}
                                </span>
                              </label>
                            );
                          })}
                          {getFilteredImportItems('bookings').length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">Tidak ada data ditemukan</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Expenses with Dropdown */}
                {importData.expenses && importData.expenses.length > 0 && (
                  <div className="border-2 border-red-200 rounded-xl overflow-hidden">
                    <div className="bg-red-50 p-4">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={(() => {
                              const nonDuplicateCount = importData.expenses.filter((_, idx) => !duplicateData.expenses?.includes(idx)).length;
                              return nonDuplicateCount > 0 && importSelection.expenses?.length === nonDuplicateCount;
                            })()}
                            onChange={(e) => handleToggleAllImport('expenses', e.target.checked)}
                            className="w-5 h-5 text-red-600 rounded"
                          />
                          <div>
                            <span className="font-semibold text-gray-800">Data Pengeluaran</span>
                            <span className="ml-2 px-2 py-0.5 text-xs bg-red-600 text-white rounded-full">
                              {importSelection.expenses?.length || 0} / {importData.expenses.filter((_, idx) => !duplicateData.expenses?.includes(idx)).length} dipilih
                            </span>
                            {duplicateData.expenses?.length > 0 && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                                {duplicateData.expenses.length} duplikat
                              </span>
                            )}
                          </div>
                        </label>
                        <button
                          onClick={() => setExpandedCategories(prev => ({...prev, importExpenses: !prev.importExpenses}))}
                          className="text-red-600 hover:bg-red-100 p-1 rounded"
                        >
                          {expandedCategories.importExpenses ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                        </button>
                      </div>
                    </div>
                    
                    {expandedCategories.importExpenses && (
                      <div className="bg-white p-4">
                        {/* Search */}
                        <div className="relative mb-3">
                          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            placeholder="Cari pengeluaran (tanggal, deskripsi, jumlah)..."
                            value={importSearchTerms.expenses || ''}
                            onChange={(e) => setImportSearchTerms({...importSearchTerms, expenses: e.target.value})}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          />
                        </div>
                        
                        {/* Items List with Scroll */}
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {getFilteredImportItems('expenses').map((item, originalIndex) => {
                            // Find original index in full array
                            const index = importData.expenses.indexOf(item);
                            const isDuplicate = duplicateData.expenses?.includes(index);
                            return (
                              <label 
                                key={index} 
                                title={isDuplicate ? '❌ Data ini sudah ada di sistem dan tidak dapat diimport' : 'Klik untuk memilih data ini'}
                                className={`flex items-center gap-2 p-2 rounded ${
                                  isDuplicate 
                                    ? 'bg-amber-50 border border-amber-200 cursor-not-allowed' 
                                    : 'hover:bg-red-50 cursor-pointer'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={importSelection.expenses?.includes(index)}
                                  onChange={() => handleToggleImportItem('expenses', index)}
                                  className="w-4 h-4 text-red-600 rounded"
                                  disabled={isDuplicate}
                                />
                                <span className={`text-sm flex-1 ${isDuplicate ? 'text-amber-700' : 'text-gray-700'}`}>
                                  {getImportDisplayText('expenses', item)}
                                  {isDuplicate && <span className="ml-2 text-xs font-semibold text-amber-600">[DUPLIKAT]</span>}
                                </span>
                              </label>
                            );
                          })}
                          {getFilteredImportItems('expenses').length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">Tidak ada data ditemukan</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t-2 border-gray-200 -mx-6 px-6 -mb-6 pb-6">
                <button
                  onClick={() => {
                    setShowImportPreview(false);
                    setImportFile(null);
                    setImportData(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={loading || (
                    !importSelection.companySettings &&
                    (!importSelection.clients?.length) && 
                    (!importSelection.services?.length) && 
                    (!importSelection.bookings?.length) && 
                    (!importSelection.expenses?.length) &&
                    (!importSelection.expenseCategories?.length)
                  )}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle size={18} />
                      Import {
                        (importSelection.clients?.length || 0) + 
                        (importSelection.services?.length || 0) + 
                        (importSelection.bookings?.length || 0) + 
                        (importSelection.expenses?.length || 0) +
                        (importSelection.expenseCategories?.length || 0)
                      } Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Selection Modal (JSON Only) */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiDatabase className="text-white" size={24} />
                <h2 className="text-xl font-bold text-white">Export Backup Data (JSON)</h2>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">

              {/* Select All */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Object.values(exportSelection).every(v => v)}
                    onChange={(e) => handleToggleAll(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-blue-900">Pilih Semua Data</span>
                </label>
              </div>

              {/* Data Categories with Dropdowns */}
              <div className="space-y-3">
                {/* Company Settings - No Dropdown */}
                <div className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportSelection.companySettings}
                      onChange={(e) => handleToggleCategory('companySettings', e.target.checked)}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">Pengaturan Perusahaan</span>
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">Settings</span>
                      </div>
                      <p className="text-sm text-gray-600">Informasi perusahaan, logo, dan pengaturan lainnya</p>
                    </div>
                  </label>
                </div>

                {/* Clients with Dropdown */}
                <div className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 transition-colors">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={exportSelection.clients}
                        onChange={(e) => handleToggleCategory('clients', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">Data Klien</span>
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                              {selectedIds.clients?.length || 0} / {allData.clients?.length || 0} dipilih
                            </span>
                          </div>
                          <button
                            onClick={() => handleToggleDropdown('clients')}
                            className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                          >
                            {expandedCategories.clients ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                          </button>
                        </div>
                        <p className="text-sm text-gray-600">Nama, kontak, alamat, dan informasi klien</p>
                      </div>
                    </div>
                  </div>
                  
                  {expandedCategories.clients && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      {/* Search */}
                      <div className="relative mb-3">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Cari klien..."
                          value={searchTerms.clients}
                          onChange={(e) => setSearchTerms({...searchTerms, clients: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      {/* Select All in Category */}
                      <label className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded cursor-pointer mb-2 border-b border-gray-200">
                        <input
                          type="checkbox"
                          checked={(selectedIds.clients?.length || 0) === (allData.clients?.length || 0) && (allData.clients?.length || 0) > 0}
                          onChange={(e) => handleToggleAllInCategory('clients', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm font-semibold text-blue-900">Pilih Semua Klien</span>
                      </label>
                      
                      {/* Items List */}
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {getFilteredItems('clients').map(item => (
                          <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedIds.clients?.includes(item.id) || false}
                              onChange={() => handleToggleItem('clients', item.id)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm text-gray-700">{getDisplayText('clients', item)}</span>
                          </label>
                        ))}
                        {getFilteredItems('clients').length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">Tidak ada data ditemukan</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Services with Dropdown */}
                <div className="border border-gray-200 rounded-xl overflow-hidden hover:border-orange-300 transition-colors">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={exportSelection.services}
                        onChange={(e) => handleToggleCategory('services', e.target.checked)}
                        className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">Data Layanan</span>
                            <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                              {selectedIds.services?.length || 0} / {allData.services?.length || 0} dipilih
                            </span>
                          </div>
                          <button
                            onClick={() => handleToggleDropdown('services')}
                            className="text-orange-600 hover:bg-orange-50 p-1 rounded"
                          >
                            {expandedCategories.services ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                          </button>
                        </div>
                        <p className="text-sm text-gray-600">Nama layanan, harga, durasi, dan deskripsi</p>
                      </div>
                    </div>
                  </div>
                  
                  {expandedCategories.services && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <div className="relative mb-3">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Cari layanan..."
                          value={searchTerms.services}
                          onChange={(e) => setSearchTerms({...searchTerms, services: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      
                      <label className="flex items-center gap-2 p-2 hover:bg-orange-50 rounded cursor-pointer mb-2 border-b border-gray-200">
                        <input
                          type="checkbox"
                          checked={(selectedIds.services?.length || 0) === (allData.services?.length || 0) && (allData.services?.length || 0) > 0}
                          onChange={(e) => handleToggleAllInCategory('services', e.target.checked)}
                          className="w-4 h-4 text-orange-600 rounded"
                        />
                        <span className="text-sm font-semibold text-orange-900">Pilih Semua Layanan</span>
                      </label>
                      
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {getFilteredItems('services').map(item => (
                          <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-orange-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedIds.services?.includes(item.id) || false}
                              onChange={() => handleToggleItem('services', item.id)}
                              className="w-4 h-4 text-orange-600 rounded"
                            />
                            <span className="text-sm text-gray-700">{getDisplayText('services', item)}</span>
                          </label>
                        ))}
                        {getFilteredItems('services').length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">Tidak ada data ditemukan</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bookings & Payments Combined - Single Dropdown */}
                <div className="border-2 border-indigo-200 rounded-xl overflow-hidden hover:border-indigo-400 transition-colors bg-gradient-to-r from-indigo-50 to-green-50">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={exportSelection.bookingsAndPayments}
                        onChange={(e) => handleToggleCategory('bookingsAndPayments', e.target.checked)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">Data Booking & Pembayaran</span>
                            <span className="px-2 py-0.5 text-xs bg-indigo-600 text-white rounded-full font-medium">Paket Transaksi</span>
                          </div>
                          <button
                            onClick={() => handleToggleDropdown('bookings')}
                            className="text-indigo-600 hover:bg-indigo-100 p-1 rounded transition-colors"
                          >
                            {expandedCategories.bookings ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Booking + Pembayaran dalam 1 kesatuan. Pilih booking → Pembayarannya otomatis ikut!
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                            📅 {selectedIds.bookings?.length || 0} / {allData.bookings?.length || 0} booking dipilih
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                            💰 Pembayaran otomatis ikut
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Single Dropdown for Bookings (Payments auto-included) */}
                  {expandedCategories.bookings && (
                    <div className="border-t-2 border-indigo-200 bg-white p-4">
                      {/* Search */}
                      <div className="relative mb-3">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Cari booking..."
                          value={searchTerms.bookings}
                          onChange={(e) => setSearchTerms({...searchTerms, bookings: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      
                      {/* Select All */}
                      <label className="flex items-center gap-2 p-2 hover:bg-indigo-50 rounded cursor-pointer mb-2 border-b border-indigo-200">
                        <input
                          type="checkbox"
                          checked={(selectedIds.bookings?.length || 0) === (allData.bookings?.length || 0) && (allData.bookings?.length || 0) > 0}
                          onChange={(e) => handleToggleAllInCategory('bookings', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-sm font-semibold text-indigo-900">Pilih Semua Booking & Pembayaran</span>
                      </label>
                      
                      {/* Info Box */}
                      <div className="bg-gradient-to-r from-amber-50 to-green-50 border border-amber-200 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">💡</span>
                          <div className="text-xs text-gray-700">
                            <p className="font-semibold text-amber-800 mb-1">Auto-Export:</p>
                            <ul className="space-y-1 text-gray-600">
                              <li>✅ <strong>Pembayaran terkait</strong> otomatis di-export</li>
                              <li>✅ <strong>Klien & Layanan</strong> terkait otomatis dipilih</li>
                              <li>✅ <strong>Booking tanpa pembayaran</strong> tetap di-export (nilai = 0)</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      {/* Bookings List */}
                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {getFilteredItems('bookings').map(item => (
                          <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-indigo-50 rounded cursor-pointer border border-transparent hover:border-indigo-200 transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedIds.bookings?.includes(item.id) || false}
                              onChange={() => handleToggleItem('bookings', item.id)}
                              className="w-4 h-4 text-indigo-600 rounded"
                            />
                            <span className="text-sm text-gray-700 flex-1">{getDisplayText('bookings', item)}</span>
                            <span className="text-xs text-green-600 font-medium">+ 💰 Payment</span>
                          </label>
                        ))}
                        {getFilteredItems('bookings').length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">Tidak ada data booking ditemukan</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expense Categories with Dropdown */}
                <div className="border border-gray-200 rounded-xl overflow-hidden hover:border-pink-300 transition-colors">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={exportSelection.expenseCategories}
                        onChange={(e) => handleToggleCategory('expenseCategories', e.target.checked)}
                        className="w-5 h-5 text-pink-600 rounded focus:ring-2 focus:ring-pink-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">Kategori Pengeluaran</span>
                            <span className="px-2 py-0.5 text-xs bg-pink-100 text-pink-700 rounded-full">
                              {selectedIds.expenseCategories?.length || 0} / {allData.expenseCategories?.length || 0} dipilih
                            </span>
                          </div>
                          <button
                            onClick={() => handleToggleDropdown('expenseCategories')}
                            className="text-pink-600 hover:bg-pink-50 p-1 rounded"
                          >
                            {expandedCategories.expenseCategories ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                          </button>
                        </div>
                        <p className="text-sm text-gray-600">Kategori untuk mengelompokkan pengeluaran</p>
                      </div>
                    </div>
                  </div>
                  
                  {expandedCategories.expenseCategories && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <div className="relative mb-3">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Cari kategori..."
                          value={searchTerms.expenseCategories}
                          onChange={(e) => setSearchTerms({...searchTerms, expenseCategories: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                      </div>
                      
                      <label className="flex items-center gap-2 p-2 hover:bg-pink-50 rounded cursor-pointer mb-2 border-b border-gray-200">
                        <input
                          type="checkbox"
                          checked={selectedIds.expenseCategories?.length > 0 && selectedIds.expenseCategories.length === allData.expenseCategories?.length}
                          onChange={(e) => handleToggleAllInCategory('expenseCategories', e.target.checked)}
                          className="w-4 h-4 text-pink-600 rounded"
                        />
                        <span className="text-sm font-semibold text-pink-900">Pilih Semua Kategori</span>
                      </label>
                      
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {getFilteredItems('expenseCategories').length > 0 ? (
                          getFilteredItems('expenseCategories').map(item => (
                            <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-pink-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedIds.expenseCategories?.includes(item.id)}
                                onChange={() => handleToggleItem('expenseCategories', item.id)}
                                className="w-4 h-4 text-pink-600 rounded"
                              />
                              <span className="text-sm text-gray-700">{getDisplayText('expenseCategories', item)}</span>
                            </label>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            {allData.expenseCategories?.length === 0 ? (
                              <p className="text-sm text-gray-500">Belum ada kategori pengeluaran</p>
                            ) : (
                              <p className="text-sm text-gray-500">Tidak ada data ditemukan dari pencarian</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expenses with Dropdown */}
                <div className="border border-gray-200 rounded-xl overflow-hidden hover:border-red-300 transition-colors">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={exportSelection.expenses}
                        onChange={(e) => handleToggleCategory('expenses', e.target.checked)}
                        className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">Data Pengeluaran</span>
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                              {selectedIds.expenses?.length || 0} / {allData.expenses?.length || 0} dipilih
                            </span>
                          </div>
                          <button
                            onClick={() => handleToggleDropdown('expenses')}
                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                          >
                            {expandedCategories.expenses ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                          </button>
                        </div>
                        <p className="text-sm text-gray-600">Rincian pengeluaran, kategori, dan tanggal</p>
                      </div>
                    </div>
                  </div>
                  
                  {expandedCategories.expenses && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <div className="relative mb-3">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Cari pengeluaran..."
                          value={searchTerms.expenses}
                          onChange={(e) => setSearchTerms({...searchTerms, expenses: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      
                      <label className="flex items-center gap-2 p-2 hover:bg-red-50 rounded cursor-pointer mb-2 border-b border-gray-200">
                        <input
                          type="checkbox"
                          checked={(selectedIds.expenses?.length || 0) === (allData.expenses?.length || 0) && (allData.expenses?.length || 0) > 0}
                          onChange={(e) => handleToggleAllInCategory('expenses', e.target.checked)}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                        <span className="text-sm font-semibold text-red-900">Pilih Semua Pengeluaran</span>
                      </label>
                      
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {getFilteredItems('expenses').map(item => (
                          <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-red-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedIds.expenses?.includes(item.id) || false}
                              onChange={() => handleToggleItem('expenses', item.id)}
                              className="w-4 h-4 text-red-600 rounded"
                            />
                            <span className="text-sm text-gray-700">{getDisplayText('expenses', item)}</span>
                          </label>
                        ))}
                        {getFilteredItems('expenses').length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">Tidak ada data ditemukan</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <FiAlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">💡 Tips:</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-700">
                    <li>Pilih hanya data yang diperlukan untuk memperkecil ukuran file</li>
                    <li>Untuk backup lengkap, pilih semua data</li>
                    <li>Data yang tidak dipilih tidak akan di-export</li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleExportJSON}
                  disabled={!Object.values(exportSelection).some(v => v) || loading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FiDownload size={18} />
                  Export JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Export File Name */}
      {showExportFileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  exportFileFormat === 'xlsx' 
                    ? 'bg-green-100' 
                    : 'bg-teal-100'
                }`}>
                  <FiDownload className={exportFileFormat === 'xlsx' ? 'text-green-600' : 'text-teal-600'} size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Export ke {exportFileFormat === 'xlsx' ? 'Excel' : 'CSV'}
                  </h3>
                  <p className="text-sm text-gray-500">Atur nama file sebelum mengexport</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama File
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={exportFileName}
                    onChange={(e) => setExportFileName(e.target.value)}
                    className="w-full px-4 py-2.5 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="backup_2025-11-07"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                    .{exportFileFormat}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  File akan disimpan sebagai: <span className="font-medium text-gray-700">{exportFileName}.{exportFileFormat}</span>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tips:</strong> Gunakan nama yang mudah diingat dan sertakan tanggal untuk memudahkan pencarian file backup.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 rounded-b-2xl flex gap-3">
              <button
                onClick={() => setShowExportFileModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleExportExcel}
                disabled={!exportFileName.trim()}
                className={`flex-1 px-4 py-2.5 rounded-lg transition-all font-medium text-white flex items-center justify-center gap-2 ${
                  exportFileFormat === 'xlsx'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30'
                    : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:shadow-lg hover:shadow-teal-500/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <FiDownload size={18} />
                Export Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium text-center">Memproses data...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupDataPage;
