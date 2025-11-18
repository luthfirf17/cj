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
  const [dataSize, setDataSize] = useState({
    totalSize: 0,
    formattedSize: '0 KB'
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExportFileModal, setShowExportFileModal] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importType, setImportType] = useState('replace'); // 'replace' or 'add'
  const [importFile, setImportFile] = useState(null);
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
    responsibleParties: true,
    serviceResponsibleParties: true,
    bookingsAndPayments: true, // Gabung booking & payments
    expenses: true,
    expenseCategories: true
  });

  // Detailed data for selection
  const [allData, setAllData] = useState({
    clients: [],
    services: [],
    responsibleParties: [],
    serviceResponsibleParties: [],
    bookings: [],
    payments: [],
    expenses: [],
    expenseCategories: []
  });

  // Selected IDs for each category
  const [selectedIds, setSelectedIds] = useState({
    clients: [],
    services: [],
    responsibleParties: [],
    serviceResponsibleParties: [],
    bookings: [],
    payments: [],
    expenses: [],
    expenseCategories: []
  });

  // Dropdown open state
  const [expandedCategories, setExpandedCategories] = useState({
    clients: false,
    services: false,
    responsibleParties: false,
    serviceResponsibleParties: false,
    bookings: false,
    payments: false,
    expenses: false,
    expenseCategories: false,
    importClients: false,
    importServices: false,
    importResponsibleParties: false,
    importServiceResponsibleParties: false,
    importBookings: false,
    importExpenses: false,
    importCategories: false
  });

  // Search state for each category
  const [searchTerms, setSearchTerms] = useState({
    clients: '',
    services: '',
    responsibleParties: '',
    serviceResponsibleParties: '',
    bookings: '',
    payments: '',
    expenses: '',
    expenseCategories: ''
  });

  // Search state for import preview
  const [importSearchTerms, setImportSearchTerms] = useState({
    clients: '',
    services: '',
    responsibleParties: '',
    serviceResponsibleParties: '',
    bookings: '',
    expenses: '',
    expenseCategories: ''
  });

  useEffect(() => {
    fetchDataStats();
    calculateDataSize();
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

  // Calculate data size in MB/GB
  const calculateDataSize = async () => {
    try {
      setLoading(true);
      const [clientsRes, servicesRes, responsiblePartiesRes, serviceResponsiblePartiesRes, bookingsRes, paymentsRes, expensesRes, categoriesRes] = await Promise.all([
        api.get('/clients'),
        api.get('/services'),
        api.get('/user/responsible-parties'),
        api.get('/user/service-responsible-parties'),
        api.get('/bookings'),
        api.get('/payments'),
        api.get('/expenses'),
        api.get('/expense-categories')
      ]);

      // Calculate size of all data combined
      const allData = {
        clients: clientsRes.data || [],
        services: servicesRes.data?.data || [],
        responsibleParties: responsiblePartiesRes.data?.data || [],
        serviceResponsibleParties: serviceResponsiblePartiesRes.data?.data || [],
        bookings: bookingsRes.data || [],
        payments: paymentsRes.data || [],
        expenses: expensesRes.data || [],
        expenseCategories: categoriesRes.data || []
      };

      // Calculate size in bytes
      const dataString = JSON.stringify(allData);
      const sizeInBytes = new Blob([dataString]).size;

      // Convert to appropriate unit (KB, MB, GB)
      let size = sizeInBytes;
      let unit = 'B';

      if (sizeInBytes >= 1024 * 1024 * 1024) { // >= 1 GB
        size = sizeInBytes / (1024 * 1024 * 1024);
        unit = 'GB';
      } else if (sizeInBytes >= 1024 * 1024) { // >= 1 MB
        size = sizeInBytes / (1024 * 1024);
        unit = 'MB';
      } else if (sizeInBytes >= 1024) { // >= 1 KB
        size = sizeInBytes / 1024;
        unit = 'KB';
      }

      setDataSize({
        totalSize: sizeInBytes,
        formattedSize: `${size.toFixed(2)} ${unit}`
      });
    } catch (error) {
      console.error('Error calculating data size:', error);
      setDataSize({
        totalSize: 0,
        formattedSize: '0 KB'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all data for selection
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [clientsRes, servicesRes, responsiblePartiesRes, serviceResponsiblePartiesRes, bookingsRes, paymentsRes, expensesRes, categoriesRes] = await Promise.all([
        api.get('/clients'),
        api.get('/services'),
        api.get('/user/responsible-parties'),
        api.get('/user/service-responsible-parties'),
        api.get('/bookings'),
        api.get('/payments'),
        api.get('/expenses'),
        api.get('/expense-categories')
      ]);

      console.log('📊 Fetched Data:', {
        clients: clientsRes.data.length,
        services: servicesRes.data.length,
        responsibleParties: responsiblePartiesRes.data?.data?.length || 0,
        serviceResponsibleParties: serviceResponsiblePartiesRes.data?.data?.length || 0,
        bookings: bookingsRes.data.length,
        payments: paymentsRes.data.length,
        expenses: expensesRes.data.length,
        expenseCategories: categoriesRes.data.length
      });

      // Debug responsible parties response
      console.log('🔍 Responsible Parties API Response:', {
        status: responsiblePartiesRes.status,
        data: responsiblePartiesRes.data,
        dataType: typeof responsiblePartiesRes.data,
        hasData: !!responsiblePartiesRes.data,
        dataKeys: responsiblePartiesRes.data ? Object.keys(responsiblePartiesRes.data) : [],
        dataData: responsiblePartiesRes.data?.data,
        dataDataType: typeof responsiblePartiesRes.data?.data,
        dataDataLength: responsiblePartiesRes.data?.data?.length
      });

      setAllData({
        clients: clientsRes.data,
        services: servicesRes.data,
        responsibleParties: responsiblePartiesRes.data?.data || [],
        serviceResponsibleParties: serviceResponsiblePartiesRes.data?.data || [],
        bookings: bookingsRes.data,
        payments: paymentsRes.data,
        expenses: expensesRes.data,
        expenseCategories: categoriesRes.data
      });

      // Initially select all IDs based on exportSelection
      const responsiblePartiesData = responsiblePartiesRes.data?.data || [];
      const serviceResponsiblePartiesData = serviceResponsiblePartiesRes.data?.data || [];
      
      const selectedIdsObj = {
        clients: exportSelection.clients ? clientsRes.data.map(item => item.id) : [],
        services: exportSelection.services ? servicesRes.data.map(item => item.id) : [],
        responsibleParties: exportSelection.responsibleParties ? responsiblePartiesData.map(item => item.id) : [],
        serviceResponsibleParties: exportSelection.serviceResponsibleParties ? serviceResponsiblePartiesData.map(item => item.id) : [],
        bookings: exportSelection.bookingsAndPayments ? bookingsRes.data.map(item => item.id) : [],
        payments: exportSelection.bookingsAndPayments ? paymentsRes.data.map(item => item.id) : [],
        expenses: exportSelection.expenses ? expensesRes.data.map(item => item.id) : [],
        expenseCategories: exportSelection.expenseCategories ? categoriesRes.data.map(item => item.id) : []
      };
      
      console.log('📋 Initial selectedIds based on exportSelection:', {
        responsibleParties: selectedIdsObj.responsibleParties,
        exportSelection_responsibleParties: exportSelection.responsibleParties,
        responsiblePartiesData: responsiblePartiesRes.data?.data
      });
      
      console.log('🔄 [fetchAllData] Setting selectedIds for responsibleParties:', {
        selectedIdsObj_responsibleParties: selectedIdsObj.responsibleParties,
        responsiblePartiesData_length: responsiblePartiesData.length,
        exportSelection_responsibleParties: exportSelection.responsibleParties
      });
      
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

  // Export to Excel - Show modal first
  const handleShowExportFileModal = () => {
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
      
      // Build query parameters for selection and selected IDs
      const params = new URLSearchParams();
      params.append('t', timestamp.toString());
      
      // Add selection flags
      params.append('companySettings', exportSelection.companySettings.toString());
      params.append('clients', exportSelection.clients.toString());
      params.append('services', exportSelection.services.toString());
      params.append('responsibleParties', exportSelection.responsibleParties.toString());
      params.append('serviceResponsibleParties', exportSelection.serviceResponsibleParties.toString());
      params.append('bookings', exportSelection.bookingsAndPayments.toString());
      params.append('payments', exportSelection.bookingsAndPayments.toString());
      params.append('expenses', exportSelection.expenses.toString());
      params.append('expenseCategories', exportSelection.expenseCategories.toString());
      
      // Add selected IDs (only if not all selected)
      if (selectedIds.clients.length !== allData.clients.length) {
        params.append('clientsIds', JSON.stringify(selectedIds.clients));
      }
      if (selectedIds.services.length !== allData.services.length) {
        params.append('servicesIds', JSON.stringify(selectedIds.services));
      }
      if (selectedIds.responsibleParties.length !== allData.responsibleParties.length) {
        params.append('responsiblePartiesIds', JSON.stringify(selectedIds.responsibleParties));
      }
      if (selectedIds.serviceResponsibleParties.length !== allData.serviceResponsibleParties.length) {
        params.append('serviceResponsiblePartiesIds', JSON.stringify(selectedIds.serviceResponsibleParties));
      }
      if (selectedIds.bookings.length !== allData.bookings.length) {
        params.append('bookingsIds', JSON.stringify(selectedIds.bookings));
      }
      if (selectedIds.payments.length !== allData.payments.length) {
        params.append('paymentsIds', JSON.stringify(selectedIds.payments));
      }
      if (selectedIds.expenses.length !== allData.expenses.length) {
        params.append('expensesIds', JSON.stringify(selectedIds.expenses));
      }
      if (selectedIds.expenseCategories.length !== allData.expenseCategories.length) {
        params.append('expenseCategoriesIds', JSON.stringify(selectedIds.expenseCategories));
      }
      
      const response = await api.get(`/backup/export/xlsx?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportFileName}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showNotification('success', `Data berhasil diexport ke format XLSX!`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
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
    // Prevent toggle if data is not loaded yet
    if (!allData.clients || !allData.services || !allData.responsibleParties || !allData.serviceResponsibleParties || 
        !allData.bookings || !allData.payments || !allData.expenses || !allData.expenseCategories) {
      return;
    }
    
    setExportSelection({
      companySettings: checked,
      clients: checked,
      services: checked,
      responsibleParties: checked,
      serviceResponsibleParties: checked,
      bookingsAndPayments: checked,
      expenses: checked,
      expenseCategories: checked
    });

    // If checked, select all IDs; if unchecked, clear all
    if (checked) {
      setSelectedIds({
        clients: allData.clients.map(item => item.id),
        services: allData.services.map(item => item.id),
        responsibleParties: allData.responsibleParties.map(item => item.id),
        serviceResponsibleParties: allData.serviceResponsibleParties.map(item => item.id),
        bookings: allData.bookings.map(item => item.id),
        payments: allData.payments.map(item => item.id),
        expenses: allData.expenses.map(item => item.id),
        expenseCategories: allData.expenseCategories.map(item => item.id)
      });
    } else {
      setSelectedIds({
        clients: [],
        services: [],
        responsibleParties: [],
        serviceResponsibleParties: [],
        bookings: [],
        payments: [],
        expenses: [],
        expenseCategories: []
      });
    }
  };

  // Toggle category checkbox with dependency logic
  const handleToggleCategory = (category, checked) => {
    console.log('🔄 handleToggleCategory called:', { category, checked, currentExportSelection: exportSelection[category] });
    
    // Special handling for dependent categories
    if (!checked) {
      // Check if this category is required by selected bookings
      let hasRelatedBookings = false;
      let categoryName = '';
      
      if (category === 'clients') {
        hasRelatedBookings = selectedIds.bookings.some(bookingId => {
          const booking = allData.bookings.find(b => b.id === bookingId);
          return booking && booking.client_id;
        });
        categoryName = 'Data Klien';
      } else if (category === 'services') {
        hasRelatedBookings = selectedIds.bookings.some(bookingId => {
          const booking = allData.bookings.find(b => b.id === bookingId);
          return booking && booking.service_id;
        });
        categoryName = 'Data Layanan';
      } else if (category === 'responsibleParties') {
        hasRelatedBookings = selectedIds.bookings.some(bookingId => {
          const booking = allData.bookings.find(b => b.id === bookingId);
          if (!booking) return false;
          
          // Check direct responsible parties from booking details
          if (booking.notes) {
            try {
              const bookingDetails = JSON.parse(booking.notes);
              if (bookingDetails && bookingDetails.services) {
                const hasDirectResponsibleParties = bookingDetails.services.some(service => 
                  service.responsible_party_id
                );
                if (hasDirectResponsibleParties) return true;
              }
            } catch (error) {
              // Notes is not JSON format, continue to service-responsible-parties check
            }
          }
          
          // Check if any service-responsible-party relationship exists for this service
          return booking.service_id && allData.serviceResponsibleParties.some(srp => 
            srp.service_id === booking.service_id
          );
        });
        categoryName = 'Data Penanggung Jawab';
      } else if (category === 'serviceResponsibleParties') {
        hasRelatedBookings = selectedIds.bookings.some(bookingId => {
          const booking = allData.bookings.find(b => b.id === bookingId);
          if (!booking || !booking.service_id) return false;
          // Check if any service-responsible-party relationship exists for this service
          return allData.serviceResponsibleParties.some(srp => 
            srp.service_id === booking.service_id
          );
        });
        categoryName = 'Data Layanan Penanggung Jawab';
      }
      
      // If there are related bookings, prevent unchecking
      if (hasRelatedBookings) {
        showNotification('warning', `Tidak dapat menghilangkan centang ${categoryName} karena masih ada booking yang berkaitan terpilih.`);
        return;
      }
    }
    
    console.log('📝 Setting exportSelection for', category, 'to', checked);
    setExportSelection(prev => ({ ...prev, [category]: checked }));
    
    // Special handling for bookingsAndPayments (includes both bookings & payments)
    if (category === 'bookingsAndPayments') {
      console.log('🎯 Handling bookingsAndPayments category');
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
      console.log('✅ Selecting all items for category:', category, 'items count:', allData[category].length);
      const newSelectedIds = allData[category].map(item => item.id);
      console.log('✅ New selectedIds for', category, ':', newSelectedIds);
      
      setSelectedIds(prev => ({
        ...prev,
        [category]: newSelectedIds
      }));
    } else {
      console.log('❌ Clearing all items for category:', category);
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
    console.log('🔄 handleToggleItem called:', { category, itemId, type: typeof itemId });
    
    // Normalize itemId to number for consistent comparison
    const normalizedItemId = typeof itemId === 'string' ? parseInt(itemId) : itemId;
    
    // Check if item is currently selected (normalize all IDs for comparison)
    const currentSelectedIds = selectedIds[category] || [];
    const normalizedSelectedIds = currentSelectedIds.map(id => typeof id === 'string' ? parseInt(id) : id);
    const isCurrentlySelected = normalizedSelectedIds.includes(normalizedItemId);
    
    console.log('🔄 handleToggleItem details:', {
      itemId, normalizedItemId, isCurrentlySelected,
      currentSelectedIds, normalizedSelectedIds
    });
    
    // Prevent unchecking items that are required by selected bookings
    if (isCurrentlySelected) {
      let isStillNeeded = false;
      let itemType = '';
      
      if (category === 'clients') {
        isStillNeeded = selectedIds.bookings.some(bookingId => {
          const booking = allData.bookings.find(b => b.id === bookingId);
          return booking && booking.client_id === itemId;
        });
        itemType = 'klien';
      } else if (category === 'services') {
        isStillNeeded = selectedIds.bookings.some(bookingId => {
          const booking = allData.bookings.find(b => b.id === bookingId);
          return booking && booking.service_id === itemId;
        });
        itemType = 'layanan';
      } else if (category === 'responsibleParties') {
        // Check if this responsible party is connected to bookings (direct or via service-responsible-parties)
        isStillNeeded = selectedIds.bookings.some(bookingId => {
          const booking = allData.bookings.find(b => b.id === bookingId);
          if (!booking) return false;
          
          // Check direct responsible parties from booking details
          if (booking.notes) {
            try {
              const bookingDetails = JSON.parse(booking.notes);
              if (bookingDetails && bookingDetails.services) {
                const normalizedItemId = typeof itemId === 'string' ? parseInt(itemId) : itemId;
                const hasDirectResponsibleParty = bookingDetails.services.some(service => {
                  const serviceResponsiblePartyId = typeof service.responsible_party_id === 'string' 
                    ? parseInt(service.responsible_party_id) 
                    : service.responsible_party_id;
                  return serviceResponsiblePartyId === normalizedItemId;
                });
                if (hasDirectResponsibleParty) return true;
              }
            } catch (error) {
              // Notes is not JSON format, continue to service-responsible-parties check
            }
          }
          
          // Check if this responsible party is connected to the service via service-responsible-parties
          const normalizedItemId = typeof itemId === 'string' ? parseInt(itemId) : itemId;
          return booking.service_id && allData.serviceResponsibleParties.some(srp => {
            const srpResponsiblePartyId = typeof srp.responsible_party_id === 'string' 
              ? parseInt(srp.responsible_party_id) 
              : srp.responsible_party_id;
            return srp.service_id === booking.service_id && srpResponsiblePartyId === normalizedItemId;
          });
        });
        itemType = 'penanggung jawab';
      } else if (category === 'serviceResponsibleParties') {
        // Check if this service-responsible-party is for a selected service
        isStillNeeded = selectedIds.bookings.some(bookingId => {
          const booking = allData.bookings.find(b => b.id === bookingId);
          if (!booking || !booking.service_id) return false;
          const srp = allData.serviceResponsibleParties.find(s => s.id === itemId);
          return srp && srp.service_id === booking.service_id;
        });
        itemType = 'layanan penanggung jawab';
      }
      
      if (isStillNeeded) {
        showNotification('warning', `Tidak dapat menghilangkan centang ${itemType} ini karena masih diperlukan oleh booking yang terpilih.`);
        return;
      }
    }
    
    setSelectedIds(prev => {
      const currentIds = prev[category] || [];
      // Normalize all IDs for consistent comparison
      const normalizedCurrentIds = currentIds.map(id => typeof id === 'string' ? parseInt(id) : id);
      const isAdding = !normalizedCurrentIds.includes(normalizedItemId);
      
      console.log('🔄 handleToggleItem setSelectedIds:', {
        currentIds, normalizedCurrentIds, normalizedItemId, isAdding
      });
      
      const newIds = isAdding
        ? [...currentIds, itemId]  // Keep original itemId type
        : currentIds.filter(id => (typeof id === 'string' ? parseInt(id) : id) !== normalizedItemId);
      
      console.log('🔄 handleToggleItem final newIds:', newIds);
      
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
            
            // Auto-select responsible parties from booking details (direct assignment)
            if (booking.notes) {
              try {
                const bookingDetails = JSON.parse(booking.notes);
                if (bookingDetails && bookingDetails.services) {
                  bookingDetails.services.forEach(service => {
                    if (service.responsible_party_id) {
                      const normalizedResponsiblePartyId = typeof service.responsible_party_id === 'string' 
                        ? parseInt(service.responsible_party_id) 
                        : service.responsible_party_id;
                      const isAlreadySelected = updatedIds.responsibleParties.some(id => 
                        (typeof id === 'string' ? parseInt(id) : id) === normalizedResponsiblePartyId
                      );
                      if (!isAlreadySelected) {
                        console.log('🎯 Adding responsible party from booking details:', service.responsible_party_id);
                        updatedIds.responsibleParties = [...updatedIds.responsibleParties, service.responsible_party_id];
                        setExportSelection(p => ({ ...p, responsibleParties: true }));
                      }
                    }
                  });
                }
              } catch (error) {
                // Notes is not JSON format, skip
                console.log('Notes is not JSON format for booking', booking.id);
              }
            }
            
            // Auto-select responsible parties and service-responsible-parties related to this service
            if (booking.service_id) {
              const relatedServiceResponsibleParties = allData.serviceResponsibleParties.filter(srp => srp.service_id === booking.service_id);
              console.log('🔗 Related service-responsible-parties for service', booking.service_id, ':', relatedServiceResponsibleParties.length);
              relatedServiceResponsibleParties.forEach(srp => {
                if (!updatedIds.serviceResponsibleParties.includes(srp.id)) {
                  console.log('🎯 Adding service-responsible-party:', srp.id);
                  updatedIds.serviceResponsibleParties = [...updatedIds.serviceResponsibleParties, srp.id];
                  setExportSelection(p => ({ ...p, serviceResponsibleParties: true }));
                }
                if (srp.responsible_party_id) {
                  const normalizedResponsiblePartyId = typeof srp.responsible_party_id === 'string' 
                    ? parseInt(srp.responsible_party_id) 
                    : srp.responsible_party_id;
                  const isAlreadySelected = updatedIds.responsibleParties.some(id => 
                    (typeof id === 'string' ? parseInt(id) : id) === normalizedResponsiblePartyId
                  );
                  if (!isAlreadySelected) {
                    console.log('🎯 Adding responsible party from service:', srp.responsible_party_id);
                    updatedIds.responsibleParties = [...updatedIds.responsibleParties, srp.responsible_party_id];
                    setExportSelection(p => ({ ...p, responsibleParties: true }));
                  }
                }
              });
            }
          } else {
            // Removing booking: also remove related payments
            const relatedPaymentIds = allData.payments
              .filter(p => p.booking_id === itemId)
              .map(p => p.id);
            updatedIds.payments = updatedIds.payments.filter(id => !relatedPaymentIds.includes(id));
            
            // Check if we need to remove responsible parties and service-responsible-parties
            // that are no longer needed by remaining bookings
            const remainingBookingIds = newIds; // newIds is the updated bookings list
            const stillNeededResponsiblePartyIds = new Set();
            const stillNeededServiceResponsiblePartyIds = new Set();
            
            remainingBookingIds.forEach(bookingId => {
              const booking = allData.bookings.find(b => b.id === bookingId);
              if (booking) {
                // Check direct responsible parties from booking details
                if (booking.notes) {
                  try {
                    const bookingDetails = JSON.parse(booking.notes);
                    if (bookingDetails && bookingDetails.services) {
                      bookingDetails.services.forEach(service => {
                        if (service.responsible_party_id) {
                          stillNeededResponsiblePartyIds.add(service.responsible_party_id);
                        }
                      });
                    }
                  } catch (error) {
                    // Notes is not JSON format, skip
                  }
                }
                
                // Check responsible parties from service-responsible-parties
                if (booking.service_id) {
                  allData.serviceResponsibleParties.forEach(srp => {
                    if (srp.service_id === booking.service_id) {
                      stillNeededServiceResponsiblePartyIds.add(srp.id);
                      stillNeededResponsiblePartyIds.add(srp.responsible_party_id);
                    }
                  });
                }
              }
            });
            
            // Remove responsible parties and service-responsible-parties that are no longer needed
            updatedIds.responsibleParties = updatedIds.responsibleParties.filter(id => 
              stillNeededResponsiblePartyIds.has(id)
            );
            updatedIds.serviceResponsibleParties = updatedIds.serviceResponsibleParties.filter(id => 
              stillNeededServiceResponsiblePartyIds.has(id)
            );
            
            // Update category checkboxes if no items remain
            if (updatedIds.responsibleParties.length === 0) {
              setExportSelection(p => ({ ...p, responsibleParties: false }));
            }
            if (updatedIds.serviceResponsibleParties.length === 0) {
              setExportSelection(p => ({ ...p, serviceResponsibleParties: false }));
            }
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
    const relatedResponsiblePartyIds = new Set();
    const relatedServiceResponsiblePartyIds = new Set();
    
    // Find related client_id and service_id from selected bookings
    bookingIds.forEach(bookingId => {
      const booking = allData.bookings.find(b => b.id === bookingId);
      if (booking) {
        if (booking.client_id) relatedClientIds.add(booking.client_id);
        if (booking.service_id) relatedServiceIds.add(booking.service_id);
        
        // Check for responsible parties in booking details (stored in notes as JSON)
        if (booking.notes) {
          try {
            const bookingDetails = JSON.parse(booking.notes);
            if (bookingDetails && bookingDetails.services) {
              bookingDetails.services.forEach(service => {
                if (service.responsible_party_id) {
                  relatedResponsiblePartyIds.add(service.responsible_party_id);
                }
              });
            }
          } catch (error) {
            // Notes is not JSON format, skip
            console.log('Notes is not JSON format for booking', booking.id);
          }
        }
      }
    });
    
    // Find related responsible parties from selected services (via service-responsible-parties)
    relatedServiceIds.forEach(serviceId => {
      // Find service-responsible-party relationships for this service
      allData.serviceResponsibleParties.forEach(srp => {
        if (srp.service_id === serviceId) {
          relatedServiceResponsiblePartyIds.add(srp.id);
          relatedResponsiblePartyIds.add(srp.responsible_party_id);
        }
      });
    });
    
    // Update selectedIds to include related data
    setSelectedIds(prev => {
      const newClientIds = new Set([...prev.clients, ...relatedClientIds]);
      const newServiceIds = new Set([...prev.services, ...relatedServiceIds]);
      const newResponsiblePartyIds = new Set([...prev.responsibleParties, ...relatedResponsiblePartyIds]);
      const newServiceResponsiblePartyIds = new Set([...prev.serviceResponsibleParties, ...relatedServiceResponsiblePartyIds]);
      
      const newSelectedIds = {
        ...prev,
        clients: Array.from(newClientIds),
        services: Array.from(newServiceIds),
        responsibleParties: Array.from(newResponsiblePartyIds),
        serviceResponsibleParties: Array.from(newServiceResponsiblePartyIds)
      };
      
      console.log('🔄 Auto-selection update:', {
        source,
        relatedResponsiblePartyIds: Array.from(relatedResponsiblePartyIds),
        newResponsiblePartyIds: newSelectedIds.responsibleParties,
        totalResponsibleParties: allData.responsibleParties.length
      });
      
      return newSelectedIds;
    });
    
    // Auto-check categories if they have items
    if (relatedClientIds.size > 0) {
      setExportSelection(prev => ({ ...prev, clients: true }));
      // Also select all client IDs
      setSelectedIds(prev => ({
        ...prev,
        clients: Array.from(new Set([...prev.clients, ...relatedClientIds]))
      }));
    }
    if (relatedServiceIds.size > 0) {
      setExportSelection(prev => ({ ...prev, services: true }));
      // Also select all service IDs
      setSelectedIds(prev => ({
        ...prev,
        services: Array.from(new Set([...prev.services, ...relatedServiceIds]))
      }));
    }
    if (relatedResponsiblePartyIds.size > 0) {
      setExportSelection(prev => ({ ...prev, responsibleParties: true }));
      // Also select all responsible party IDs
      setSelectedIds(prev => ({
        ...prev,
        responsibleParties: Array.from(new Set([...prev.responsibleParties, ...relatedResponsiblePartyIds]))
      }));
    }
    if (relatedServiceResponsiblePartyIds.size > 0) {
      setExportSelection(prev => ({ ...prev, serviceResponsibleParties: true }));
      // Also select all service responsible party IDs
      setSelectedIds(prev => ({
        ...prev,
        serviceResponsibleParties: Array.from(new Set([...prev.serviceResponsibleParties, ...relatedServiceResponsiblePartyIds]))
      }));
    }
  };

  // Toggle all items in a category
  const handleToggleAllInCategory = (category, checked) => {
    // Prevent unchecking all items if they are required by selected bookings
    if (!checked) {
      let hasRequiredItems = false;
      
      if (category === 'clients') {
        hasRequiredItems = selectedIds.bookings.some(bookingId => {
          const booking = allData.bookings.find(b => b.id === bookingId);
          return booking && booking.client_id;
        });
      } else if (category === 'services') {
        hasRequiredItems = selectedIds.bookings.some(bookingId => {
          const booking = allData.bookings.find(b => b.id === bookingId);
          return booking && booking.service_id;
        });
      } else if (category === 'responsibleParties') {
        hasRequiredItems = selectedIds.bookings.some(bookingId => {
          const booking = allData.bookings.find(b => b.id === bookingId);
          if (!booking) return false;
          
          // Check direct responsible parties from booking details
          if (booking.notes) {
            try {
              const bookingDetails = JSON.parse(booking.notes);
              if (bookingDetails && bookingDetails.services) {
                const hasDirectResponsibleParties = bookingDetails.services.some(service => 
                  service.responsible_party_id
                );
                if (hasDirectResponsibleParties) return true;
              }
            } catch (error) {
              // Notes is not JSON format, continue to service-responsible-parties check
            }
          }
          
          // Check if any service-responsible-party relationship exists for this service
          return booking.service_id && allData.serviceResponsibleParties.some(srp => 
            srp.service_id === booking.service_id
          );
        });
      } else if (category === 'serviceResponsibleParties') {
        hasRequiredItems = selectedIds.bookings.some(bookingId => {
          const booking = allData.bookings.find(b => b.id === bookingId);
          if (!booking || !booking.service_id) return false;
          // Check if any service-responsible-party relationship exists for this service
          return allData.serviceResponsibleParties.some(srp => 
            srp.service_id === booking.service_id
          );
        });
      }
      
      if (hasRequiredItems) {
        showNotification('warning', `Tidak dapat menghilangkan centang semua item karena masih ada booking yang berkaitan terpilih.`);
        return;
      }
    }
    
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
      case 'responsibleParties':
        return `${item.name} ${item.phone || ''} ${item.address || ''}`;
      case 'serviceResponsibleParties':
        return `${item.name} ${item.phone || ''} ${item.address || ''}`;
      case 'bookings':
        // Include all searchable fields for bookings
        let searchableText = `${item.client_name || ''} ${item.service_name || ''} ${item.booking_date || ''} ${item.booking_time || ''} ${item.location_name || ''} ${item.status || ''} ${item.payment_status || ''} ${item.total_price || ''}`;

        // Add service names from notes if available
        try {
          if (item.notes && typeof item.notes === 'string' && item.notes.trim().startsWith('{')) {
            const notesObj = JSON.parse(item.notes);
            if (notesObj.selected_services && Array.isArray(notesObj.selected_services)) {
              const serviceNames = notesObj.selected_services.map(s => s.service_name).join(' ');
              searchableText += ` ${serviceNames}`;

              // Add user notes if available
              if (notesObj.user_notes) {
                searchableText += ` ${notesObj.user_notes}`;
              }
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }

        return searchableText;
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
      case 'responsibleParties':
        return `${item.name}${item.phone ? ` - ${item.phone}` : ''}${item.address ? ` (${item.address})` : ''}`;
      case 'serviceResponsibleParties':
        return `${item.name}${item.phone ? ` - ${item.phone}` : ''}${item.address ? ` (${item.address})` : ''}`;
      case 'bookings':
        const locationText = item.location_name ? ` 📍 ${item.location_name}` : '';

        // Parse notes to extract quantity and service information
        let quantityText = '';
        let servicesText = '';
        let notesSummary = '';
        try {
          if (item.notes && typeof item.notes === 'string' && item.notes.trim().startsWith('{')) {
            const notesObj = JSON.parse(item.notes);
            if (notesObj.selected_services && Array.isArray(notesObj.selected_services)) {
              const totalQuantity = notesObj.selected_services.reduce((sum, service) => sum + (parseInt(service.quantity) || 1), 0);
              if (totalQuantity > 1) {
                quantityText = ` (${totalQuantity} layanan)`;
              }

              // Show service names if multiple services
              if (notesObj.selected_services.length > 1) {
                const serviceNames = notesObj.selected_services.map(s => s.service_name).join(', ');
                servicesText = ` - ${serviceNames}`;
              }
            }

            // Extract notes summary
            if (notesObj.user_notes && notesObj.user_notes.trim()) {
              notesSummary = ` | ${notesObj.user_notes.substring(0, 30)}${notesObj.user_notes.length > 30 ? '...' : ''}`;
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }

        // Format booking date and time
        const bookingDate = item.booking_date ? new Date(item.booking_date).toLocaleDateString('id-ID') : 'N/A';
        const bookingTime = item.booking_time || '';
        const dateTimeText = bookingTime ? `${bookingDate} ${bookingTime}` : bookingDate;

        // Status and payment info
        const statusText = item.status ? ` | ${item.status}` : '';
        const paymentStatusText = item.payment_status ? ` | ${item.payment_status}` : '';
        const totalPriceText = item.total_price ? ` | Rp ${parseFloat(item.total_price).toLocaleString('id-ID')}` : '';

        return `${item.client_name || 'Unknown'} - ${item.service_name || 'Unknown'}${servicesText}${quantityText}${locationText} | ${dateTimeText}${statusText}${paymentStatusText}${totalPriceText}${notesSummary}`;
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
      params.append('responsibleParties', exportSelection.responsibleParties);
      params.append('serviceResponsibleParties', exportSelection.serviceResponsibleParties);
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
        const [clientsRes, servicesRes, responsiblePartiesRes, serviceResponsiblePartiesRes, categoriesRes, bookingsRes, expensesRes] = await Promise.all([
          api.get('/clients'),
          api.get('/services'),
          api.get('/user/responsible-parties'),
          api.get('/user/service-responsible-parties'),
          api.get('/expense-categories'),
          api.get('/bookings'),
          api.get('/expenses')
        ]);
        
        console.log('🌐 ===== API RESPONSES =====');
        console.log('Clients response:', clientsRes);
        console.log('Services response:', servicesRes);
        console.log('Responsible Parties response:', responsiblePartiesRes);
        console.log('Service Responsible Parties response:', serviceResponsiblePartiesRes);
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
          responsibleParties: extractData(responsiblePartiesRes),
          serviceResponsibleParties: extractData(serviceResponsiblePartiesRes),
          expenseCategories: extractData(categoriesRes),
          bookings: extractData(bookingsRes),
          expenses: extractData(expensesRes)
        };
        
        console.log('📊 ===== CURRENT DATA STRUCTURE =====');
        console.log('currentData:', currentData);
        console.log('currentData.clients length:', currentData.clients?.length);
        console.log('currentData.services length:', currentData.services?.length);
        console.log('currentData.responsibleParties length:', currentData.responsibleParties?.length);
        console.log('currentData.serviceResponsibleParties length:', currentData.serviceResponsibleParties?.length);
        console.log('currentData.bookings length:', currentData.bookings?.length);
        console.log('currentData.expenses length:', currentData.expenses?.length);
        if (currentData.responsibleParties?.length > 0) {
          console.log('currentData.responsibleParties[0]:', currentData.responsibleParties[0]);
        }
        if (currentData.bookings?.length > 0) {
          console.log('currentData.bookings[0]:', currentData.bookings[0]);
        }
        console.log('=====================================');
        
        // Log backup data structure
        console.log('📦 ===== BACKUP DATA STRUCTURE =====');
        console.log('backupData:', backupData);
        console.log('backupData.data:', backupData.data);
        if (backupData.data?.bookings?.length > 0) {
          console.log('backupData.data.bookings[0]:', backupData.data.bookings[0]);
          console.log('backupData.data.bookings[0].notes:', backupData.data.bookings[0].notes);
          // Try to parse notes
          try {
            if (backupData.data.bookings[0].notes && typeof backupData.data.bookings[0].notes === 'string' && backupData.data.bookings[0].notes.trim().startsWith('{')) {
              const notesObj = JSON.parse(backupData.data.bookings[0].notes);
              console.log('Parsed notes:', notesObj);
              if (notesObj.services) {
                console.log('Services in notes:', notesObj.services);
              }
            }
          } catch (e) {
            console.log('Notes parsing error:', e);
          }
        }
        console.log('====================================');
        
        // Detect duplicates and prepare selection
        const duplicates = detectDuplicates(backupData.data, currentData);
        const selection = prepareImportSelection(backupData.data, duplicates);
        
        // Log duplicate summary
        console.log('=== DUPLICATE DETECTION SUMMARY ===');
        console.log('Clients duplikat:', duplicates.clients?.length || 0);
        console.log('Services duplikat:', duplicates.services?.length || 0);
        console.log('Responsible Parties duplikat:', duplicates.responsibleParties?.length || 0);
        console.log('Service Responsible Parties duplikat:', duplicates.serviceResponsibleParties?.length || 0);
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
    
    // CRITICAL CHECK: Verify backup data is loaded
    console.log('\n📦 BACKUP DATA VERIFICATION:');
    console.log('  Clients:', backupData.clients?.length || 0);
    console.log('  Services:', backupData.services?.length || 0);
    console.log('  Responsible Parties:', backupData.responsibleParties?.length || 0);
    console.log('  Service Responsible Parties:', backupData.serviceResponsibleParties?.length || 0);
    console.log('  Bookings:', backupData.bookings?.length || 0);
    console.log('  Expenses:', backupData.expenses?.length || 0);
    console.log('  Expense Categories:', backupData.expenseCategories?.length || 0);
    
    // CRITICAL CHECK: Verify current data is loaded
    console.log('\n⚠️ CRITICAL VERIFICATION - Current Data Status:');
    console.log('  Clients:', currentData.clients?.length || 0);
    console.log('  Services:', currentData.services?.length || 0);
    console.log('  Responsible Parties:', currentData.responsibleParties?.length || 0);
    console.log('  Service Responsible Parties:', currentData.serviceResponsibleParties?.length || 0);
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
      responsibleParties: [],
      serviceResponsibleParties: [],
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
    
    // Check responsible parties (by name and phone)
    if (backupData.responsibleParties) {
      console.log('👥 ===== CHECKING RESPONSIBLE PARTIES FOR DUPLICATES =====');
      console.log('👥 Backup responsible parties count:', backupData.responsibleParties.length);
      console.log('👥 Current responsible parties count:', currentData.responsibleParties?.length || 0);
      
      // Log sample data to verify structure
      if (backupData.responsibleParties.length > 0) {
        console.log('👥 Sample backup responsible party:', backupData.responsibleParties[0]);
      }
      if (currentData.responsibleParties?.length > 0) {
        console.log('👥 Sample current responsible party:', currentData.responsibleParties[0]);
      }
      
      console.log('👥 Checking responsible parties for duplicates...');
      console.log('Backup responsible parties:', backupData.responsibleParties.length);
      console.log('Current responsible parties:', currentData.responsibleParties?.length || 0);
      
      // Log ALL current responsible parties
      console.log('\n👥 ALL CURRENT RESPONSIBLE PARTIES IN DATABASE:');
      currentData.responsibleParties?.forEach((party, idx) => {
        console.log(`  [${idx}] Name: ${party.name}, Phone: ${party.phone}, Address: ${party.address}`);
      });
      
      console.log('\n👥 ALL BACKUP RESPONSIBLE PARTIES:');
      backupData.responsibleParties.forEach((party, idx) => {
        console.log(`  [${idx}] Name: ${party.name}, Phone: ${party.phone}, Address: ${party.address}`);
      });
      
      backupData.responsibleParties.forEach((item, index) => {
        console.log(`\n👥 Checking responsible party ${index}: {name: '${item.name}', phone: '${item.phone}', address: '${item.address}'}`);
        
        const isDuplicate = currentData.responsibleParties?.some((existing, existingIdx) => {
          // More flexible duplicate detection for responsible parties
          // Match by name (case-insensitive), or by name + phone if both exist
          const nameMatch = item.name && existing.name && 
            item.name.trim().toLowerCase() === existing.name.trim().toLowerCase();
          
          let phoneMatch = false;
          if (item.phone && existing.phone) {
            // If both have phone numbers, they must match
            phoneMatch = item.phone.replace(/\D/g, '') === existing.phone.replace(/\D/g, '');
          } else if (!item.phone && !existing.phone) {
            // If both don't have phone numbers, consider phone as matching
            phoneMatch = true;
          } else {
            // If one has phone and the other doesn't, only match if names are identical
            phoneMatch = true; // Allow matching even if phone presence differs
          }
          
          console.log(`  Comparing with existing [${existingIdx}]: {name: '${existing.name}', phone: '${existing.phone}'}`);
          console.log(`    Name match: ${nameMatch} (${item.name?.trim().toLowerCase()} vs ${existing.name?.trim().toLowerCase()})`);
          console.log(`    Phone match logic: ${phoneMatch} (${item.phone?.replace(/\D/g, '')} vs ${existing.phone?.replace(/\D/g, '')})`);
          
          const finalMatch = nameMatch && phoneMatch;
          if (finalMatch) {
            console.log(`    🎯 DUPLICATE FOUND!`);
          }
          
          return finalMatch;
        });
        
        if (isDuplicate) {
          console.log(`🚫 [DUPLIKAT] Responsible party index ${index} terdeteksi duplikat: {name: '${item.name}', phone: '${item.phone}'}`);
          duplicates.responsibleParties.push(index);
        } else {
          console.log(`✅ Responsible party index ${index} unik: {name: '${item.name}', phone: '${item.phone}'}`);
        }
      });
      
      console.log(`👥 ===== RESPONSIBLE PARTIES DUPLICATE CHECK COMPLETE =====`);
      console.log(`👥 Total responsible parties checked: ${backupData.responsibleParties.length}`);
      console.log(`👥 Duplicates found: ${duplicates.responsibleParties.length}`);
      console.log(`👥 Duplicate indices: [${duplicates.responsibleParties.join(', ')}]`);
    }
    
    // Check service responsible parties (by name and phone)
    if (backupData.serviceResponsibleParties) {
      backupData.serviceResponsibleParties.forEach((item, index) => {
        const isDuplicate = currentData.serviceResponsibleParties?.some(existing => 
          item.name && existing.name && 
          item.name.trim().toLowerCase() === existing.name.trim().toLowerCase() &&
          item.phone && existing.phone && 
          item.phone.replace(/\D/g, '') === existing.phone.replace(/\D/g, '')
        );
        if (isDuplicate) duplicates.serviceResponsibleParties.push(index);
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
          
          // ===== MORE ROBUST DATE COMPARISON =====
          // Handle different date formats and timezone issues
          const normalizeDate = (dateStr) => {
            if (!dateStr) return null;
            try {
              // If it's already YYYY-MM-DD format, use it directly
              if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return dateStr;
              }
              // If it's ISO string, extract date part
              if (dateStr.includes('T')) {
                return dateStr.split('T')[0];
              }
              // Try to parse as date and format
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
              }
              return null;
            } catch (e) {
              console.log(`Date parsing error for "${dateStr}":`, e.message);
              return null;
            }
          };
          
          const itemDate = normalizeDate(item.booking_date);
          const existingDate = normalizeDate(existing.booking_date);
          
          // Allow ±1 day difference for timezone issues
          const getDateDifference = (date1, date2) => {
            if (!date1 || !date2) return Infinity;
            const d1 = new Date(date1);
            const d2 = new Date(date2);
            return Math.abs((d1 - d2) / (1000 * 60 * 60 * 24));
          };
          
          const dateDifference = getDateDifference(itemDate, existingDate);
          const sameDate = dateDifference <= 1; // Allow ±1 day difference
          
          // ===== TIME COMPARISON =====
          const normalizeTime = (time) => {
            if (!time) return '';
            // Remove seconds if present (HH:mm:ss -> HH:mm)
            const parts = time.split(':');
            return `${parts[0]}:${parts[1]}`;
          };
          
          const itemTime = normalizeTime(item.booking_time);
          const existingTime = normalizeTime(existing.booking_time);
          const sameTime = itemTime === existingTime;
          
          // ===== CLIENT & SERVICE COMPARISON =====
          const normalizeString = (str) => {
            if (!str) return '';
            return String(str).trim().toLowerCase();
          };
          
          const sameClient = normalizeString(itemClientName) === normalizeString(existingClientName);
          const sameService = normalizeString(itemServiceName) === normalizeString(existingServiceName);
          
          // ===== STATUS COMPARISON =====
          const sameStatus = normalizeString(item.status) === normalizeString(existing.status);
          
          // ===== PRICE COMPARISON =====
          const normalizeNumber = (num) => {
            if (num === null || num === undefined) return 0;
            return parseFloat(num) || 0;
          };
          
          const sameTotalPrice = Math.abs(normalizeNumber(item.total_price) - normalizeNumber(existing.total_price)) < 0.01;
          
          // ===== NOTES COMPARISON (MORE ROBUST) =====
          const compareNotes = () => {
            try {
              // If both notes are empty/null, consider them matching
              if (!item.notes && !existing.notes) return true;
              if (!item.notes || !existing.notes) return false;
              
              // Try to parse as JSON, but be more tolerant
              let itemNotesObj, existingNotesObj;
              
              try {
                itemNotesObj = typeof item.notes === 'string' ? JSON.parse(item.notes) : item.notes;
              } catch (e) {
                // If parsing fails, treat as plain string
                itemNotesObj = { raw_notes: item.notes };
              }
              
              try {
                existingNotesObj = typeof existing.notes === 'string' ? JSON.parse(existing.notes) : existing.notes;
              } catch (e) {
                // If parsing fails, treat as plain string
                existingNotesObj = { raw_notes: existing.notes };
              }
              
              // Compare key user-visible fields
              const compareField = (field) => {
                const itemVal = normalizeString(itemNotesObj[field]);
                const existingVal = normalizeString(existingNotesObj[field]);
                return itemVal === existingVal;
              };
              
              // Check essential fields that user actually entered
              const essentialFields = ['user_notes', 'booking_days', 'discount', 'discount_type', 'tax_percentage'];
              const essentialMatch = essentialFields.every(field => compareField(field));
              
              // Compare selected_services if available
              const compareServices = () => {
                const itemServices = itemNotesObj.selected_services || itemNotesObj.services;
                const existingServices = existingNotesObj.selected_services || existingNotesObj.services;
                
                if (!itemServices && !existingServices) return true;
                if (!itemServices || !existingServices) return false;
                if (!Array.isArray(itemServices) || !Array.isArray(existingServices)) return false;
                if (itemServices.length !== existingServices.length) return false;
                
                return itemServices.every((itemSvc, idx) => {
                  const existingSvc = existingServices[idx];
                  if (!existingSvc) return false;
                  
                  const sameName = normalizeString(itemSvc.service_name) === normalizeString(existingSvc.service_name);
                  const sameQty = (parseInt(itemSvc.quantity) || 1) === (parseInt(existingSvc.quantity) || 1);
                  
                  return sameName && sameQty;
                });
              };
              
              const servicesMatch = compareServices();
              
              return essentialMatch && servicesMatch;
              
            } catch (e) {
              // Ultimate fallback: compare as strings
              console.log('Notes comparison error, falling back to string comparison:', e.message);
              return normalizeString(String(item.notes)) === normalizeString(String(existing.notes));
            }
          };
          
          const sameNotes = compareNotes();
          
          // ===== PAYMENT STATUS (OPTIONAL - for backward compatibility) =====
          const itemPaymentStatus = normalizeString(item.payment_status);
          const existingPaymentStatus = normalizeString(existing.payment_status);
          // If payment status is missing from backup, consider it matching
          const samePaymentStatus = !itemPaymentStatus || !existingPaymentStatus || 
                                   itemPaymentStatus === existingPaymentStatus;
          
          // ===== LOCATION (OPTIONAL - new feature) =====
          const itemLocation = normalizeString(item.location_name);
          const existingLocation = normalizeString(existing.location_name);
          const sameLocation = !itemLocation || !existingLocation || 
                              itemLocation === existingLocation;
          
          // ===== FINAL MATCH DECISION =====
          // Require: date (±1 day), time, client, service, status, price, notes
          // Optional: payment_status, location (for backward compatibility)
          const isMatch = sameDate && sameTime && sameClient && sameService && 
                         sameStatus && sameTotalPrice && sameNotes;
          
          // Enhanced logging for debugging
          if (sameClient && sameService) {
            console.log(`🔍 Potential booking match found:`, {
              client: itemClientName,
              service: itemServiceName,
              backupIdx: index,
              currentIdx: existingIndex,
              dateMatch: `${itemDate} vs ${existingDate} (${dateDifference.toFixed(1)} days)`,
              timeMatch: `${itemTime} vs ${existingTime}`,
              statusMatch: `${item.status} vs ${existing.status}`,
              priceMatch: `${item.total_price} vs ${existing.total_price}`,
              notesMatch: sameNotes,
              paymentMatch: samePaymentStatus ? '✅' : '⚠️ (optional)',
              locationMatch: sameLocation ? '✅' : '⚠️ (optional)',
              finalResult: isMatch ? '🎯 DUPLICATE!' : '❌ Not duplicate'
            });
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
    
    console.log('🔍 ===== DUPLICATE DETECTION COMPLETED =====');
    console.log('Final duplicate counts:');
    console.log('  Clients:', duplicates.clients.length);
    console.log('  Services:', duplicates.services.length);
    console.log('  Responsible Parties:', duplicates.responsibleParties.length);
    console.log('  Service Responsible Parties:', duplicates.serviceResponsibleParties.length);
    console.log('  Bookings:', duplicates.bookings.length);
    console.log('  Expenses:', duplicates.expenseCategories.length);
    console.log('  Expense Categories:', duplicates.expenseCategories.length);
    
    return duplicates;
  };
  
  // Prepare initial import selection (select all non-duplicates)
  const prepareImportSelection = (backupData, duplicates) => {
    // Auto-select all non-duplicate items
    const selection = {
      companySettings: false,
      clients: backupData.clients.map((_, index) => !duplicates.clients?.includes(index) ? index : -1).filter(idx => idx !== -1),
      services: backupData.services.map((_, index) => !duplicates.services?.includes(index) ? index : -1).filter(idx => idx !== -1),
      responsibleParties: backupData.responsibleParties.map((_, index) => !duplicates.responsibleParties?.includes(index) ? index : -1).filter(idx => idx !== -1),
      serviceResponsibleParties: backupData.serviceResponsibleParties.map((_, index) => !duplicates.serviceResponsibleParties?.includes(index) ? index : -1).filter(idx => idx !== -1),
      bookings: backupData.bookings.map((_, index) => !duplicates.bookings?.includes(index) ? index : -1).filter(idx => idx !== -1),
      payments: [], // Payments are handled separately based on selected bookings
      expenses: backupData.expenses.map((_, index) => !duplicates.expenses?.includes(index) ? index : -1).filter(idx => idx !== -1),
      expenseCategories: backupData.expenseCategories.map((_, index) => !duplicates.expenseCategories?.includes(index) ? index : -1).filter(idx => idx !== -1)
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
      case 'responsibleParties':
        return `${item.name || ''} ${item.phone || ''} ${item.address || ''}`.toLowerCase();
      case 'serviceResponsibleParties':
        return `${item.name || ''} ${item.phone || ''} ${item.address || ''}`.toLowerCase();
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
      case 'responsibleParties':
        return `${item.name}${item.phone ? ` - ${item.phone}` : ''}${item.address ? ` (${item.address})` : ''}`;
      case 'serviceResponsibleParties':
        return `${item.name}${item.phone ? ` - ${item.phone}` : ''}${item.address ? ` (${item.address})` : ''}`;
      case 'expenseCategories':
        return item.name;
      case 'bookings':
        const bookingDate = new Date(item.booking_date).toLocaleDateString('id-ID');
        // Get client and service names from notes if available
        let clientName = 'Klien';
        let serviceName = 'Layanan';
        let quantityText = '';
        
        try {
          if (item.notes) {
            const notes = JSON.parse(item.notes);
            if (notes.services && notes.services.length > 0) {
              serviceName = notes.services.map(s => s.service_name).join(', ');
            }
            // Check for selected_services with quantity
            if (notes.selected_services && Array.isArray(notes.selected_services)) {
              const totalQuantity = notes.selected_services.reduce((sum, service) => sum + (parseInt(service.quantity) || 1), 0);
              if (totalQuantity > 1) {
                quantityText = ` (${totalQuantity} layanan)`;
              }
            }
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
        
        // Check for discount information (from backup data or notes)
        let discountText = '';
        if (item.discount_value && item.discount_value > 0) {
          const discountType = item.discount_type === 'persen' ? '%' : 'Rp';
          discountText = ` - Diskon: ${item.discount_value}${discountType}`;
        }
        
        // Try to get client name from importData if available
        if (importData && importData.clients && item.client_id) {
          const client = importData.clients.find(c => c.id === item.client_id);
          if (client) clientName = client.name;
        }
        
        const locationInfo = item.location_name ? ` 📍 ${item.location_name}` : '';
        return `${bookingDate} ${item.booking_time} - ${clientName} - ${serviceName}${quantityText}${discountText}${locationInfo} - Rp ${parseFloat(item.total_price).toLocaleString('id-ID')} (${item.status})`;
      case 'expenses':
        const expenseDate = new Date(item.expense_date).toLocaleDateString('id-ID');
        return `${expenseDate} - ${item.description} - Rp ${parseFloat(item.amount).toLocaleString('id-ID')}`;
      default:
        return '';
    }
  };
  
  // Toggle import item selection
  const handleToggleImportItem = (category, index) => {
    // Prevent toggling duplicate items
    if (duplicateData[category]?.includes(index)) {
      return;
    }

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
        importSelection.responsibleParties?.some(idx => duplicateData.responsibleParties?.includes(idx)) ||
        importSelection.serviceResponsibleParties?.some(idx => duplicateData.serviceResponsibleParties?.includes(idx)) ||
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
        responsibleParties: importSelection.responsibleParties?.map(index => importData.responsibleParties[index]).filter(Boolean) || [],
        serviceResponsibleParties: importSelection.serviceResponsibleParties?.map(index => importData.serviceResponsibleParties[index]).filter(Boolean) || [],
        bookings: selectedBookings,
        payments: relatedPayments, // Include all payments for selected bookings
        expenses: importSelection.expenses?.map(index => importData.expenses[index]).filter(Boolean) || [],
        expenseCategories: importSelection.expenseCategories?.map(index => importData.expenseCategories[index]).filter(Boolean) || []
      };
      
      // Track which items should actually be imported (not duplicates)
      const importFlags = {
        clients: importSelection.clients || [],
        services: importSelection.services || [],
        responsibleParties: importSelection.responsibleParties || [],
        serviceResponsibleParties: importSelection.serviceResponsibleParties || [],
        bookings: importSelection.bookings || [],
        expenses: importSelection.expenses || [],
        expenseCategories: importSelection.expenseCategories || []
      };
      
      // Log what will be imported
      console.log('=== DATA TO IMPORT ===');
      console.log('Clients:', selectedData.clients.length);
      console.log('Services:', selectedData.services.length);
      console.log('Responsible Parties:', selectedData.responsibleParties.length);
      console.log('Service Responsible Parties:', selectedData.serviceResponsibleParties.length);
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
          responsibleParties: selectedData.responsibleParties.length > 0,
          serviceResponsibleParties: selectedData.serviceResponsibleParties.length > 0,
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
        calculateDataSize();
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Backup & Restore Data
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-1 sm:mt-2">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm text-gray-600 font-medium">Total Booking</span>
              <FiDatabase className="text-blue-500 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{dataStats.totalBookings}</p>
            <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Data booking tersedia</p>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm text-gray-600 font-medium">Total Pembayaran</span>
              <FiDatabase className="text-green-500 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{dataStats.totalPayments}</p>
            <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Data pembayaran tersedia</p>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm text-gray-600 font-medium">Total Pengeluaran</span>
              <FiDatabase className="text-red-500 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{dataStats.totalExpenses}</p>
            <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Data pengeluaran tersedia</p>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm text-gray-600 font-medium">Total Klien</span>
              <FiDatabase className="text-purple-500 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{dataStats.totalClients}</p>
            <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Data klien tersedia</p>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm text-gray-600 font-medium">Total Layanan</span>
              <FiDatabase className="text-orange-500 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{dataStats.totalServices}</p>
            <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Data layanan tersedia</p>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm text-gray-600 font-medium">Ukuran Data</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={calculateDataSize}
                  disabled={loading}
                  className="text-indigo-500 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh ukuran data"
                >
                  <FiRefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <FiDatabase className="text-indigo-500 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </div>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{dataSize.formattedSize}</p>
            <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Total ukuran data Anda</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Export Section */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <FiDownload className="text-white w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                <h2 className="text-lg sm:text-xl font-bold text-white">Export Data</h2>
              </div>
              <p className="text-blue-100 text-xs sm:text-sm mt-0.5 sm:mt-1">Download data Anda dalam berbagai format</p>
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              {/* Export Excel */}
              <div className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 hover:border-blue-300 transition-colors">
                <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiFileText className="text-green-600 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-0.5 sm:mb-1">Export ke Excel</h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Export data dalam format Excel. Cocok untuk membuka di Microsoft Excel, Google Sheets, atau aplikasi spreadsheet lainnya.
                    </p>
                  </div>
                </div>
                <div className="flex flex-row gap-1.5 sm:gap-3">
                  <button
                    onClick={() => handleShowExportFileModal()}
                    disabled={loading}
                    className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base"
                  >
                    <FiDownload className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                    Export Excel
                  </button>
                </div>
              </div>

              {/* Export JSON */}
              <div className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 hover:border-purple-300 transition-colors">
                <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiDatabase className="text-purple-600 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-0.5 sm:mb-1">Export Backup Lengkap (JSON)</h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Export seluruh data dalam format JSON yang bisa di-import kembali ke sistem. 
                      Cocok untuk backup lengkap atau pindah akun dengan data utuh.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleShowExportModal}
                  disabled={loading}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
                >
                  <FiDownload className="w-3 h-3 sm:w-4 sm:h-4" />
                  Export Backup JSON
                </button>
              </div>
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <FiUpload className="text-white w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                <h2 className="text-lg sm:text-xl font-bold text-white">Import Data</h2>
              </div>
              <p className="text-orange-100 text-xs sm:text-sm mt-0.5 sm:mt-1">Restore data dari file backup JSON</p>
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              {/* Import Replace */}
              <div className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 hover:border-orange-300 transition-colors">
                <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiRefreshCw className="text-red-600 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-0.5 sm:mb-1">Import & Ganti Data</h3>
                    <p className="text-xs sm:text-sm text-gray-600">
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
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/30 transition-all font-medium flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
                >
                  <FiRefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                  Import & Ganti Semua
                </button>
              </div>

              {/* Import Add */}
              <div className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 hover:border-blue-300 transition-colors">
                <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiPlus className="text-blue-600 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-0.5 sm:mb-1">Import & Tambahkan Data</h3>
                    <p className="text-xs sm:text-sm text-gray-600">
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
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all font-medium flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
                >
                  <FiPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                  Import & Tambahkan
                </button>
              </div>

              {/* Warning Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                <FiAlertCircle className="text-amber-600 flex-shrink-0 mt-0.5 w-4 h-4 sm:w-5 sm:h-5" />
                <div className="text-xs sm:text-sm text-amber-800">
                  <p className="font-semibold mb-0.5 sm:mb-1">Tips Backup:</p>
                  <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-amber-700 text-xs sm:text-sm">
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
                      {importData.responsibleParties && (
                        <div className="bg-white rounded px-2 py-1">
                          <span className="font-semibold">{importData.responsibleParties.length}</span> Penanggung Jawab
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
                         (importSelection.responsibleParties?.length || 0) +
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
                duplicateData.responsibleParties?.length > 0 ||
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
                        {duplicateData.responsibleParties?.length > 0 && (
                          <li>{duplicateData.responsibleParties.length} penanggung jawab duplikat (berdasarkan nama & telepon)</li>
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

                {/* Responsible Parties */}
                {importData.responsibleParties && importData.responsibleParties.length > 0 && (
                  <div className="border-2 border-green-200 rounded-xl overflow-hidden">
                    <div className="bg-green-50 p-4">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={(() => {
                              const nonDuplicateCount = importData.responsibleParties.filter((_, idx) => !duplicateData.responsibleParties?.includes(idx)).length;
                              return nonDuplicateCount > 0 && importSelection.responsibleParties?.length === nonDuplicateCount;
                            })()}
                            onChange={(e) => handleToggleAllImport('responsibleParties', e.target.checked)}
                            className="w-5 h-5 text-green-600 rounded"
                          />
                          <div>
                            <span className="font-semibold text-gray-800">Data Penanggung Jawab</span>
                            <span className="ml-2 px-2 py-0.5 text-xs bg-green-600 text-white rounded-full">
                              {importSelection.responsibleParties?.length || 0} / {importData.responsibleParties.filter((_, idx) => !duplicateData.responsibleParties?.includes(idx)).length} dipilih
                            </span>
                            {duplicateData.responsibleParties?.length > 0 && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                                {duplicateData.responsibleParties.length} duplikat
                              </span>
                            )}
                          </div>
                        </label>
                        <button
                          onClick={() => setExpandedCategories(prev => ({...prev, importResponsibleParties: !prev.importResponsibleParties}))}
                          className="text-green-600 hover:bg-green-100 p-1 rounded"
                        >
                          {expandedCategories.importResponsibleParties ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                        </button>
                      </div>
                    </div>
                    
                    {expandedCategories.importResponsibleParties && (
                      <div className="bg-white p-4">
                        {/* Search */}
                        <div className="relative mb-3">
                          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            placeholder="Cari penanggung jawab (nama, telepon, alamat)..."
                            value={importSearchTerms.responsibleParties || ''}
                            onChange={(e) => setImportSearchTerms({...importSearchTerms, responsibleParties: e.target.value})}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        
                        {/* Items List with Scroll */}
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {getFilteredImportItems('responsibleParties').map((item, originalIndex) => {
                            // Find original index in full array
                            const index = importData.responsibleParties.indexOf(item);
                            const isDuplicate = duplicateData.responsibleParties?.includes(index);
                            return (
                              <label 
                                key={index} 
                                className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                                  isDuplicate 
                                    ? 'bg-amber-50 border border-amber-200' 
                                    : 'hover:bg-green-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={importSelection.responsibleParties?.includes(index)}
                                  onChange={() => handleToggleImportItem('responsibleParties', index)}
                                  className="w-4 h-4 text-green-600 rounded"
                                  disabled={isDuplicate}
                                />
                                <span className={`text-sm flex-1 ${isDuplicate ? 'text-amber-700' : 'text-gray-700'}`}>
                                  {getImportDisplayText('responsibleParties', item)}
                                  {isDuplicate && <span className="ml-2 text-xs font-semibold text-amber-600">[DUPLIKAT]</span>}
                                </span>
                              </label>
                            );
                          })}
                          {getFilteredImportItems('responsibleParties').length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">Tidak ada data ditemukan</p>
                          )}
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
                    disabled={!allData.clients || !allData.services || !allData.responsibleParties || !allData.serviceResponsibleParties || 
                             !allData.bookings || !allData.payments || !allData.expenses || !allData.expenseCategories}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          value={searchTerms.clients || ''}
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
                          value={searchTerms.services || ''}
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

                {/* Responsible Parties with Dropdown */}
                <div className="border border-gray-200 rounded-xl overflow-hidden hover:border-green-300 transition-colors">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={exportSelection.responsibleParties}
                        onChange={(e) => handleToggleCategory('responsibleParties', e.target.checked)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">Data Penanggung Jawab</span>
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                              {selectedIds.responsibleParties?.length || 0} / {allData.responsibleParties?.length || 0} dipilih
                            </span>
                          </div>
                          <button
                            onClick={() => handleToggleDropdown('responsibleParties')}
                            className="text-green-600 hover:bg-green-50 p-1 rounded"
                          >
                            {expandedCategories.responsibleParties ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                          </button>
                        </div>
                        <p className="text-sm text-gray-600">Nama, nomor telepon, dan alamat penanggung jawab</p>
                      </div>
                    </div>
                  </div>
                  
                  {expandedCategories.responsibleParties && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <div className="relative mb-3">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Cari penanggung jawab..."
                          value={searchTerms.responsibleParties || ''}
                          onChange={(e) => setSearchTerms({...searchTerms, responsibleParties: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      
                      <label className="flex items-center gap-2 p-2 hover:bg-green-50 rounded cursor-pointer mb-2 border-b border-gray-200">
                        <input
                          type="checkbox"
                          checked={(() => {
                            const totalItems = allData.responsibleParties?.length || 0;
                            const selectedCount = selectedIds.responsibleParties?.length || 0;
                            const isAllSelected = totalItems > 0 && selectedCount === totalItems;
                            console.log('🔍 [SELECT ALL] responsibleParties:', { totalItems, selectedCount, selectedIds: selectedIds.responsibleParties, isAllSelected });
                            return isAllSelected;
                          })()}
                          onChange={(e) => handleToggleAllInCategory('responsibleParties', e.target.checked)}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <span className="text-sm font-semibold text-green-900">Pilih Semua Penanggung Jawab</span>
                      </label>
                      
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {getFilteredItems('responsibleParties').map(item => {
                          const itemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
                          const selectedIdsArray = selectedIds.responsibleParties?.map(id => typeof id === 'string' ? parseInt(id) : id) || [];
                          const isChecked = selectedIdsArray.includes(itemId);
                          
                          return (
                          <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-green-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleItem('responsibleParties', item.id)}
                              className="w-4 h-4 text-green-600 rounded"
                            />
                            <span className="text-sm text-gray-700">
                              {getDisplayText('responsibleParties', item)} 
                              {isChecked ? ' ✅' : ' ⭕'}
                            </span>
                          </label>
                          );
                        })}
                        {getFilteredItems('responsibleParties').length === 0 && (
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
                          value={searchTerms.bookings || ''}
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
                          value={searchTerms.expenseCategories || ''}
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
                          value={searchTerms.expenses || ''}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm sm:max-w-md w-full">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
                  <FiDownload className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Export ke Excel
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
                    value={exportFileName || ''}
                    onChange={(e) => setExportFileName(e.target.value)}
                    className="w-full px-4 py-2.5 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="backup_2025-11-07"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                    .xlsx
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  File akan disimpan sebagai: <span className="font-medium text-gray-700">{exportFileName}.xlsx</span>
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
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 rounded-lg transition-all font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
