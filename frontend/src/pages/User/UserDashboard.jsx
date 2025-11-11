import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiCreditCard,
  FiAlertCircle,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiFilter,
  FiFileText,
  FiMessageCircle,
  FiMapPin,
  FiX,
  FiArrowUp,
  FiArrowDown,
  FiUser,
  FiPackage,
  FiRefreshCw,
  FiSearch,
} from 'react-icons/fi';
import { StatCard } from '../../components/Common/Card';
import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import SearchInput from '../../components/Common/SearchInput';
import Select from '../../components/Common/Select';
import SearchableDropdown from '../../components/Common/SearchableDropdown';
import CalendarView from '../../components/CalendarView';
import AddBookingModal from '../../components/User/AddBookingModal';
import EditBookingModal from '../../components/User/EditBookingModal';
import GenerateInvoiceModal from '../../components/User/GenerateInvoiceModal';
import PinModal from '../../components/Common/PinModal';
import NoPinNotificationModal from '../../components/Common/NoPinNotificationModal';
import { format } from '../../utils/format';
import { getWhatsAppLink } from '../../utils/phoneUtils';
import api from '../../services/api';

const UserDashboard = () => {
  const navigate = useNavigate();
  
  // Helper function to highlight search query in text
  const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={index} className="bg-yellow-200 text-gray-900 px-1 rounded">{part}</mark> : 
        part
    );
  };
  
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'
  
  // Modern multi-criteria sorting
  const [sortCriteria, setSortCriteria] = useState([]);
  
  // Advanced sort options (sub-filters)
  const [showDateOptions, setShowDateOptions] = useState(false);
  const [showClientOptions, setShowClientOptions] = useState(false);
  const [showServiceOptions, setShowServiceOptions] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  
  // Search within dropdowns
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState(null);
  
  // PIN Modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [showNoPinModal, setShowNoPinModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  
  // Filter dropdowns
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterClient, setFilterClient] = useState('');
  
  // Available filters data
  const [availableServices, setAvailableServices] = useState([]);
  const [availableClients, setAvailableClients] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  // Stats Data
  const [stats, setStats] = useState({
    totalBooking: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    unpaid: 0,
    downPayment: 0,
    paid: 0,
  });

  // Bookings Data
  const [bookings, setBookings] = useState([]);

  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  // Fetch Stats and Filter Options once on mount
  useEffect(() => {
    fetchStats();
    fetchFilterOptions();
  }, []);

  // Fetch Bookings with debounce (faster for search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBookings();
    }, 150); // 150ms debounce for faster realtime search

    return () => clearTimeout(timeoutId);
  }, [pagination.currentPage, searchQuery, filterStatus, filterPaymentStatus, filterMonth, filterYear, filterService, filterClient]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/user/dashboard/stats', {
        params: { user_id: 2 }
      });
      
      if (response.data.success) {
        console.log('📊 Stats from backend:', response.data.data);
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Don't show alert for rate limiting
      if (!error.message.includes('429')) {
        console.error('Gagal memuat statistik dashboard');
      }
    }
  };
  
  const fetchFilterOptions = async () => {
    try {
      // Fetch services
      const servicesRes = await api.get('/user/services', {
        params: { user_id: 2 }
      });
      if (servicesRes.data.success) {
        setAvailableServices(servicesRes.data.data);
      }
      
      // Fetch clients
      const clientsRes = await api.get('/user/clients', {
        params: { user_id: 2 }
      });
      if (clientsRes.data.success) {
        setAvailableClients(clientsRes.data.data);
      }
      
      // Generate months and years
      const months = [
        { value: '01', label: 'Januari' },
        { value: '02', label: 'Februari' },
        { value: '03', label: 'Maret' },
        { value: '04', label: 'April' },
        { value: '05', label: 'Mei' },
        { value: '06', label: 'Juni' },
        { value: '07', label: 'Juli' },
        { value: '08', label: 'Agustus' },
        { value: '09', label: 'September' },
        { value: '10', label: 'Oktober' },
        { value: '11', label: 'November' },
        { value: '12', label: 'Desember' },
      ];
      setAvailableMonths(months);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {
        user_id: 2,
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
      };

      // Don't send search to backend - we'll do client-side filtering
      // if (searchQuery) params.search = searchQuery;
      
      // Convert Indonesian status to English for backend
      if (filterStatus) {
        let backendStatus = filterStatus;
        if (filterStatus === 'Dijadwalkan') backendStatus = 'confirmed';
        else if (filterStatus === 'Selesai') backendStatus = 'completed';
        else if (filterStatus === 'Dibatalkan') backendStatus = 'cancelled';
        params.status = backendStatus;
      }
      
      // Convert Indonesian payment status to English for backend
      if (filterPaymentStatus) {
        let backendPaymentStatus = filterPaymentStatus;
        if (filterPaymentStatus === 'Belum Bayar') backendPaymentStatus = 'unpaid';
        else if (filterPaymentStatus === 'DP') backendPaymentStatus = 'partial';
        else if (filterPaymentStatus === 'Lunas') backendPaymentStatus = 'paid';
        params.payment_status = backendPaymentStatus;
      }

      const response = await api.get('/user/bookings', { params });
      
      if (response.data.success) {
        // Convert backend data to Indonesian
        let convertedBookings = response.data.data.bookings.map(booking => {
          // Convert status to Indonesian
          let displayStatus = 'Dijadwalkan';
          if (booking.status === 'completed') displayStatus = 'Selesai';
          else if (booking.status === 'cancelled') displayStatus = 'Dibatalkan';
          else if (booking.status === 'confirmed') displayStatus = 'Dijadwalkan';
          else if (booking.status === 'pending') displayStatus = 'Dijadwalkan';
          
          // Convert payment_status to Indonesian
          let displayPaymentStatus = 'Belum Bayar';
          if (booking.payment_status === 'paid') displayPaymentStatus = 'Lunas';
          else if (booking.payment_status === 'partial') displayPaymentStatus = 'DP';
          else if (booking.payment_status === 'unpaid') displayPaymentStatus = 'Belum Bayar';
          
          // Extract all services from booking_details
          let allServices = [];
          
          if (booking.booking_details && booking.booking_details.services && Array.isArray(booking.booking_details.services)) {
            // Use booking_details.services for multiple services
            allServices = booking.booking_details.services
              .filter(s => s) // Filter out null/undefined services
              .map(s => {
                // Try different possible property names
                return s.name || s.service_name || s.serviceName || s;
              });
          } else if (booking.services && Array.isArray(booking.services) && booking.services.length > 0) {
            // Fallback to old services array (for backward compatibility)
            allServices = booking.services.filter(s => s); // Filter out null/undefined
          }
          
          const convertedBooking = {
            ...booking,
            services: allServices, // Override with all services from booking_details
            status: displayStatus,
            payment_status: displayPaymentStatus,
            total_price: booking.total_amount || booking.total_price || 0,
            amount_paid: booking.amount_paid || 0,
            booking_date: booking.booking_date || '',
            booking_time: booking.booking_time || '',
            location_name: booking.location_name || '',
            location_map_url: booking.location_map_url || ''
          };
          
          return convertedBooking;
        });
        
        // Apply client-side search filter (nama, kontak, layanan, tanggal, lokasi)
        if (searchQuery && searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase().trim();
          convertedBookings = convertedBookings.filter(booking => {
            // Search in client name
            const matchName = booking.client_name?.toLowerCase().includes(query);
            
            // Search in contact/phone
            const matchContact = booking.contact?.toLowerCase().includes(query) || 
                                 booking.phone?.toLowerCase().includes(query);
            
            // Search in services
            const matchService = booking.services && Array.isArray(booking.services) && booking.services.some(service => {
              if (!service) return false;
              const serviceName = typeof service === 'string' ? service : (service?.name || '');
              return serviceName.toLowerCase().includes(query);
            });
            
            // Search in location
            const matchLocation = booking.location_name?.toLowerCase().includes(query);
            
            // Search in date (formatted and raw)
            const bookingDate = new Date(booking.booking_date);
            const monthNames = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 
                               'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
            const monthShortNames = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 
                                    'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
            
            const day = bookingDate.getDate();
            const month = bookingDate.getMonth();
            const year = bookingDate.getFullYear();
            
            // Match day (1-31)
            const matchDay = query.includes(String(day));
            // Match month name (full or short)
            const matchMonthName = monthNames[month].includes(query) || monthShortNames[month].includes(query);
            // Match month number (01-12)
            const matchMonthNumber = query.includes(String(month + 1).padStart(2, '0')) || query.includes(String(month + 1));
            // Match year (2024, 2025, etc)
            const matchYear = query.includes(String(year));
            // Match formatted date string (08 Januari 2026)
            const formattedDate = format.date(booking.booking_date).toLowerCase();
            const matchFormattedDate = formattedDate.includes(query);
            
            const matchDate = matchDay || matchMonthName || matchMonthNumber || matchYear || matchFormattedDate;
            
            return matchName || matchContact || matchService || matchLocation || matchDate;
          });
        }
        
        // Apply date filters (month/year)
        if (filterMonth || filterYear) {
          convertedBookings = convertedBookings.filter(booking => {
            const bookingDate = new Date(booking.booking_date);
            const bookingMonth = String(bookingDate.getMonth() + 1).padStart(2, '0');
            const bookingYear = String(bookingDate.getFullYear());
            
            if (filterMonth && bookingMonth !== filterMonth) return false;
            if (filterYear && bookingYear !== filterYear) return false;
            return true;
          });
        }
        
        // Apply service filter
        if (filterService) {
          convertedBookings = convertedBookings.filter(booking => {
            return booking.services && Array.isArray(booking.services) && booking.services.some(service => {
              if (!service) return false;
              const serviceName = typeof service === 'string' ? service : (service?.name || '');
              return serviceName === filterService;
            });
          });
        }
        
        // Apply client filter
        if (filterClient) {
          convertedBookings = convertedBookings.filter(booking => {
            return booking.client_name === filterClient;
          });
        }
        
        // Extract unique years from booking data for dynamic year filter
        const uniqueYears = [...new Set(
          response.data.data.bookings
            .map(b => new Date(b.booking_date).getFullYear())
            .filter(year => !isNaN(year))
        )].sort((a, b) => b - a); // Sort descending (newest first)
        
        setAvailableYears(uniqueYears.map(year => ({
          value: year.toString(),
          label: year.toString()
        })));
        
        setBookings(convertedBookings);
        setPagination(prev => ({
          ...prev,
          totalItems: convertedBookings.length,
          totalPages: Math.ceil(convertedBookings.length / pagination.pageSize),
        }));
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      // Don't show alert for rate limiting
      if (!error.message.includes('429')) {
        console.error('Gagal memuat data booking');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle Filter
  const handleFilterStatus = (e) => {
    setFilterStatus(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleFilterPaymentStatus = (e) => {
    setFilterPaymentStatus(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };
  
  // Handle modern sort criteria toggle
  const toggleSortCriteria = (criteriaId) => {
    setSortCriteria(prev => {
      const existing = prev.find(c => c.id === criteriaId);
      
      if (existing) {
        // If exists, toggle order (asc <-> desc)
        return prev.map(c => 
          c.id === criteriaId 
            ? { ...c, order: c.order === 'asc' ? 'desc' : 'asc' }
            : c
        );
      }
      
      // If doesn't exist, add new criteria
      const criteriaMap = {
        'date': { id: 'date', order: 'desc', label: 'Tanggal Terbaru' },
        'client': { id: 'client', order: 'asc', label: 'Nama Klien A→Z' },
        'service': { id: 'service', order: 'asc', label: 'Layanan A→Z' }
      };
      
      return [...prev, criteriaMap[criteriaId]];
    });
    
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };
  
  const removeSortCriteria = (criteriaId) => {
    setSortCriteria(prev => prev.filter(c => c.id !== criteriaId));
    
    // Reset sub-filters and search queries when removing
    if (criteriaId === 'date') {
      setSelectedMonths([]);
      setSelectedYears([]);
    } else if (criteriaId === 'client') {
      setSelectedClients([]);
      setClientSearchQuery('');
    } else if (criteriaId === 'service') {
      setSelectedServices([]);
      setServiceSearchQuery('');
    }
  };
  
  const resetSortCriteria = () => {
    setSortCriteria([]);
    setSelectedMonths([]);
    setSelectedYears([]);
    setSelectedClients([]);
    setSelectedServices([]);
    setClientSearchQuery('');
    setServiceSearchQuery('');
  };
  
  // Toggle sub-options
  const toggleMonth = (month) => {
    setSelectedMonths(prev => 
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };
  
  const toggleYear = (year) => {
    setSelectedYears(prev => 
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };
  
  const toggleClient = (clientName) => {
    setSelectedClients(prev => 
      prev.includes(clientName) ? prev.filter(c => c !== clientName) : [...prev, clientName]
    );
  };
  
  const toggleService = (serviceName) => {
    setSelectedServices(prev => 
      prev.includes(serviceName) ? prev.filter(s => s !== serviceName) : [...prev, serviceName]
    );
  };

  // Table Columns
  const columns = [
    {
      header: 'Klien',
      accessor: 'client_name',
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{row.contact}</p>
        </div>
      ),
    },
    {
      header: 'Layanan',
      accessor: 'services',
      render: (value) => (
        <div className="space-y-1">
          {value.map((service, index) => (
            <div key={index} className="text-sm text-gray-700">
              • {service}
            </div>
          ))}
        </div>
      ),
    },
    {
      header: 'Tanggal, Waktu, Tempat',
      accessor: 'booking_date',
      render: (value, row) => {
        console.log('🗓️ Rendering date cell for:', row.client_name, {
          location_name: row.location_name,
          location_map_url: row.location_map_url
        });
        
        return (
          <div>
            <p className="text-sm text-gray-900">{format.date(value)}</p>
            <p className="text-xs text-gray-500">{format.time(value)}</p>
            {row.location_name && row.location_name !== '' && (
              <div className="flex items-center gap-1 mt-1">
                <FiMapPin className="w-3 h-3 text-blue-600" />
                <p className="text-xs text-blue-600">{row.location_name}</p>
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => {
        const variants = {
          'Dijadwalkan': 'info',
          'Selesai': 'success',
          'Dibatalkan': 'danger',
        };
        return <Badge variant={variants[value]}>{value}</Badge>;
      },
    },
    {
      header: 'Status Pembayaran',
      accessor: 'payment_status',
      render: (value) => {
        const variants = {
          'Belum Bayar': 'danger',
          'DP': 'warning',
          'Lunas': 'success',
        };
        return <Badge variant={variants[value]}>{value}</Badge>;
      },
    },
    {
      header: 'Total / Dibayar',
      accessor: 'total_amount',
      render: (value, row) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{format.currency(value)}</p>
          <p className="text-xs text-gray-500">{format.currency(row.amount_paid)} dibayar</p>
        </div>
      ),
    },
    {
      header: 'Aksi',
      accessor: 'id',
      render: (value, row) => {
        console.log('⚡ Rendering action cell for:', row.client_name, {
          location_map_url: row.location_map_url,
          has_url: !!row.location_map_url && row.location_map_url !== ''
        });
        
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleGenerateInvoice(row)}
              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Generate Invoice"
            >
              <FiFileText size={18} />
            </button>
            
            {row.location_map_url && row.location_map_url !== '' && (
              <a
                href={row.location_map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center justify-center"
                title="Buka Lokasi di Google Maps"
              >
                <FiMapPin size={18} />
              </a>
            )}
            
            <a
              href={getWhatsAppLink(row.contact)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors inline-flex items-center justify-center"
              title="Hubungi via WhatsApp"
            >
              <FiMessageCircle size={18} />
            </a>
            
            <button
              onClick={() => handleEdit(row)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit"
            >
              <FiEdit size={18} />
            </button>
            <button
              onClick={() => handleDelete(row)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Hapus"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        );
      },
    },
  ];

  const handleGenerateInvoice = (booking) => {
    setSelectedBookingForInvoice(booking);
    setShowInvoiceModal(true);
  };

  const handleEdit = (booking) => {
    setSelectedBookingId(booking.id);
    setShowEditModal(true);
  };

  const handleDelete = (booking) => {
    // Check if user has PIN first
    api.get('/user/pin-status')
      .then(response => {
        if (response.data.success && response.data.data.hasPin) {
          // Show PIN modal
          setBookingToDelete(booking);
          setShowPinModal(true);
        } else {
          // No PIN set, show notification modal
          setShowNoPinModal(true);
        }
      })
      .catch(error => {
        console.error('Error checking PIN status:', error);
        alert('Gagal memeriksa status PIN. Silakan coba lagi.');
      });
  };

  const handleDeleteAfterPin = async () => {
    if (!bookingToDelete) return;

    if (window.confirm(`Apakah Anda yakin ingin menghapus booking untuk ${bookingToDelete.client_name}?`)) {
      try {
        const response = await api.delete(`/user/bookings/${bookingToDelete.id}`);

        if (response.data.success) {
          alert('Booking berhasil dihapus!');
          fetchBookings();
          fetchStats();
          setShowPinModal(false);
          setBookingToDelete(null);
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Gagal menghapus booking. Silakan coba lagi.');
      }
    }
  };

  const handleBookingSuccess = () => {
    fetchBookings();
    fetchStats();
  };

  // Handle card click for status filter
  const handleStatusCardClick = (status) => {
    const newStatus = filterStatus === status ? '' : status;
    setFilterStatus(newStatus);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle card click for payment status filter
  const handlePaymentCardClick = (paymentStatus) => {
    const newPaymentStatus = filterPaymentStatus === paymentStatus ? '' : paymentStatus;
    setFilterPaymentStatus(newPaymentStatus);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Apply sub-filters first, then sort
  let filteredBookings = [...bookings];
  
  // Apply month filter
  if (selectedMonths.length > 0) {
    filteredBookings = filteredBookings.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      const bookingMonth = String(bookingDate.getMonth() + 1).padStart(2, '0');
      return selectedMonths.includes(bookingMonth);
    });
  }
  
  // Apply year filter
  if (selectedYears.length > 0) {
    filteredBookings = filteredBookings.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      const bookingYear = String(bookingDate.getFullYear());
      return selectedYears.includes(bookingYear);
    });
  }
  
  // Apply client filter
  if (selectedClients.length > 0) {
    filteredBookings = filteredBookings.filter(booking => 
      selectedClients.includes(booking.client_name)
    );
  }
  
  // Apply service filter
  if (selectedServices.length > 0) {
    filteredBookings = filteredBookings.filter(booking => 
      booking.services && booking.services.some(service => {
        const serviceName = typeof service === 'string' ? service : (service?.name || '');
        return selectedServices.includes(serviceName);
      })
    );
  }
  
  // Modern multi-criteria sorting
  const sortedBookings = filteredBookings.sort((a, b) => {
    // If no sort criteria, return default (by date desc)
    if (sortCriteria.length === 0) {
      return new Date(b.booking_date) - new Date(a.booking_date);
    }
    
    for (const criteria of sortCriteria) {
      let result = 0;
      
      switch(criteria.id) {
        case 'date': {
          const dateA = new Date(a.booking_date);
          const dateB = new Date(b.booking_date);
          result = criteria.order === 'desc' 
            ? dateB - dateA 
            : dateA - dateB;
          break;
        }
        
        case 'client': {
          result = criteria.order === 'asc'
            ? a.client_name.localeCompare(b.client_name)
            : b.client_name.localeCompare(a.client_name);
          break;
        }
        
        case 'service': {
          const serviceA = a.services?.[0] || '';
          const serviceB = b.services?.[0] || '';
          result = criteria.order === 'asc'
            ? serviceA.localeCompare(serviceB)
            : serviceB.localeCompare(serviceA);
          break;
        }
      }
      
      // If not equal, return the result
      if (result !== 0) return result;
      
      // If equal, continue to next criteria
    }
    
    return 0; // All criteria are equal
  });

  return (
    <div className="space-y-6">
      {/* Status Booking Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Status Booking</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div 
            onClick={() => setFilterStatus('')}
            className={`bg-white rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
              filterStatus === '' ? 'border-2 border-blue-500 ring-2 ring-blue-100' : 'border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Booking</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalBooking}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiCalendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => handleStatusCardClick('Dijadwalkan')}
            className={`bg-white rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
              filterStatus === 'Dijadwalkan' ? 'border-2 border-blue-500 ring-2 ring-blue-100' : 'border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Dijadwalkan</p>
                <p className="text-3xl font-bold text-blue-600">{stats.scheduled}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiAlertCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => handleStatusCardClick('Selesai')}
            className={`bg-white rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
              filterStatus === 'Selesai' ? 'border-2 border-green-500 ring-2 ring-green-100' : 'border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Selesai</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => handleStatusCardClick('Dibatalkan')}
            className={`bg-white rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
              filterStatus === 'Dibatalkan' ? 'border-2 border-red-500 ring-2 ring-red-100' : 'border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Dibatalkan</p>
                <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <FiXCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Pembayaran Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Status Pembayaran</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div 
            onClick={() => handlePaymentCardClick('Belum Bayar')}
            className={`bg-white rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
              filterPaymentStatus === 'Belum Bayar' ? 'border-2 border-yellow-500 ring-2 ring-yellow-100' : 'border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Belum Bayar</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.unpaid}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FiDollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => handlePaymentCardClick('DP')}
            className={`bg-white rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
              filterPaymentStatus === 'DP' ? 'border-2 border-orange-500 ring-2 ring-orange-100' : 'border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Down Payment (DP)</p>
                <p className="text-3xl font-bold text-orange-600">{stats.downPayment}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiCreditCard className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => handlePaymentCardClick('Lunas')}
            className={`bg-white rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
              filterPaymentStatus === 'Lunas' ? 'border-2 border-green-500 ring-2 ring-green-100' : 'border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Lunas</p>
                <p className="text-3xl font-bold text-green-600">{stats.paid}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        {/* Row 1: Search Bar (Center) */}
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <SearchInput
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Cari nama klien, kontak, layanan, tanggal, atau lokasi..."
            />
          </div>
        </div>

        {/* Row 2: View Toggle and Add Button */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Left: View Toggle */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium ${
                viewMode === 'table' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiFilter size={16} />
              <span>Tabel</span>
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium ${
                viewMode === 'calendar' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiCalendar size={16} />
              <span>Kalender</span>
            </button>
          </div>

          {/* Right: Add Button */}
          <Button
            variant="primary"
            icon={<FiPlus />}
            onClick={() => setShowAddModal(true)}
          >
            Tambah Booking
          </Button>
        </div>

        {/* Row 3: Modern Sort Chips - CENTER ALIGNED */}
        <div className="space-y-3">
          <div className="flex items-center justify-center">
            <button
              onClick={resetSortCriteria}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
            >
              <FiRefreshCw size={12} />
              Reset Semua Filter
            </button>
          </div>

          {/* Sort Options Chips - CENTER ALIGNED */}
          <div className="flex flex-wrap justify-center gap-2">
            {/* Date Sort with Sub-Options */}
            <div className="relative">
              <button
                onClick={() => {
                  toggleSortCriteria('date');
                  setShowDateOptions(!showDateOptions);
                  setShowClientOptions(false);
                  setShowServiceOptions(false);
                }}
                className={`group px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-all ${
                  sortCriteria.find(c => c.id === 'date')
                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                <FiCalendar size={14} />
                <span>Tanggal</span>
                {sortCriteria.find(c => c.id === 'date') && (
                  <>
                    {sortCriteria.find(c => c.id === 'date')?.order === 'desc' ? (
                      <FiArrowDown size={12} />
                    ) : (
                      <FiArrowUp size={12} />
                    )}
                    <span
                      onClick={(e) => { e.stopPropagation(); removeSortCriteria('date'); setShowDateOptions(false); }}
                      className="ml-1 hover:bg-blue-500 rounded-full p-0.5 transition-colors cursor-pointer inline-flex"
                    >
                      <FiX size={12} />
                    </span>
                  </>
                )}
              </button>
              
              {/* Date Sub-Options Dropdown */}
              {showDateOptions && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 w-80">
                  {/* Header with Close Button */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-800">Filter Tanggal</h4>
                    <button
                      onClick={() => setShowDateOptions(false)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title="Tutup"
                    >
                      <FiX size={16} className="text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-2">Pilih Bulan:</p>
                      <div className="grid grid-cols-4 gap-2">
                        {availableMonths.map((month) => (
                          <button
                            key={month.value}
                            onClick={() => toggleMonth(month.value)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              selectedMonths.includes(month.value)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {month.label.substring(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-2">Pilih Tahun:</p>
                      <div className="flex flex-wrap gap-2">
                        {availableYears.map((year) => (
                          <button
                            key={year.value}
                            onClick={() => toggleYear(year.value)}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              selectedYears.includes(year.value)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {year.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Client Sort with Sub-Options */}
            <div className="relative">
              <button
                onClick={() => {
                  toggleSortCriteria('client');
                  setShowClientOptions(!showClientOptions);
                  setShowDateOptions(false);
                  setShowServiceOptions(false);
                }}
                className={`group px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-all ${
                  sortCriteria.find(c => c.id === 'client')
                    ? 'bg-purple-600 text-white shadow-md hover:bg-purple-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                <FiUser size={14} />
                <span>Nama Klien</span>
                {sortCriteria.find(c => c.id === 'client') && (
                  <>
                    {sortCriteria.find(c => c.id === 'client')?.order === 'asc' ? (
                      <span className="text-xs">A→Z</span>
                    ) : (
                      <span className="text-xs">Z→A</span>
                    )}
                    <span
                      onClick={(e) => { e.stopPropagation(); removeSortCriteria('client'); setShowClientOptions(false); }}
                      className="ml-1 hover:bg-purple-500 rounded-full p-0.5 transition-colors cursor-pointer inline-flex"
                    >
                      <FiX size={12} />
                    </span>
                  </>
                )}
              </button>
              
              {/* Client Sub-Options Dropdown */}
              {showClientOptions && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 w-64">
                  {/* Header with Close Button */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-800">Filter Klien</h4>
                    <button
                      onClick={() => setShowClientOptions(false)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title="Tutup"
                    >
                      <FiX size={16} className="text-gray-500" />
                    </button>
                  </div>
                  
                  {/* Search Box */}
                  <div className="mb-2 relative">
                    <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={12} />
                    <input
                      type="text"
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      placeholder="Cari nama klien..."
                      className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  {/* Client List with Scroll */}
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {availableClients
                      .filter(client => 
                        client.name.toLowerCase().includes(clientSearchQuery.toLowerCase())
                      )
                      .map((client) => (
                        <button
                          key={client.name}
                          onClick={() => toggleClient(client.name)}
                          className={`w-full px-3 py-2 text-left text-xs rounded transition-colors ${
                            selectedClients.includes(client.name)
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {client.name}
                        </button>
                      ))}
                    {availableClients.filter(client => 
                      client.name.toLowerCase().includes(clientSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="text-xs text-gray-500 text-center py-2">
                        Tidak ditemukan klien "{clientSearchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Service Sort with Sub-Options */}
            <div className="relative">
              <button
                onClick={() => {
                  toggleSortCriteria('service');
                  setShowServiceOptions(!showServiceOptions);
                  setShowDateOptions(false);
                  setShowClientOptions(false);
                }}
                className={`group px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-all ${
                  sortCriteria.find(c => c.id === 'service')
                    ? 'bg-green-600 text-white shadow-md hover:bg-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                <FiPackage size={14} />
                <span>Layanan</span>
                {sortCriteria.find(c => c.id === 'service') && (
                  <>
                    {sortCriteria.find(c => c.id === 'service')?.order === 'asc' ? (
                      <span className="text-xs">A→Z</span>
                    ) : (
                      <span className="text-xs">Z→A</span>
                    )}
                    <span
                      onClick={(e) => { e.stopPropagation(); removeSortCriteria('service'); setShowServiceOptions(false); }}
                      className="ml-1 hover:bg-green-500 rounded-full p-0.5 transition-colors cursor-pointer inline-flex"
                    >
                      <FiX size={12} />
                    </span>
                  </>
                )}
              </button>
              
              {/* Service Sub-Options Dropdown */}
              {showServiceOptions && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 w-64">
                  {/* Header with Close Button */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-800">Filter Layanan</h4>
                    <button
                      onClick={() => setShowServiceOptions(false)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title="Tutup"
                    >
                      <FiX size={16} className="text-gray-500" />
                    </button>
                  </div>
                  
                  {/* Search Box */}
                  <div className="mb-2 relative">
                    <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={12} />
                    <input
                      type="text"
                      value={serviceSearchQuery}
                      onChange={(e) => setServiceSearchQuery(e.target.value)}
                      placeholder="Cari nama layanan..."
                      className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  {/* Service List with Scroll */}
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {availableServices
                      .filter(service => 
                        service.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())
                      )
                      .map((service) => (
                        <button
                          key={service.name}
                          onClick={() => toggleService(service.name)}
                          className={`w-full px-3 py-2 text-left text-xs rounded transition-colors ${
                            selectedServices.includes(service.name)
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {service.name}
                        </button>
                      ))}
                    {availableServices.filter(service => 
                      service.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="text-xs text-gray-500 text-center py-2">
                        Tidak ditemukan layanan "{serviceSearchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Sort Info - CENTER ALIGNED */}
          {sortCriteria.length > 0 && (
            <div className="text-xs text-gray-600 flex items-center justify-center gap-2 pt-1">
              <span className="font-medium">Urutan:</span>
              <div className="flex items-center gap-1">
                {sortCriteria.map((c, idx) => (
                  <span key={c.id} className="inline-flex items-center gap-1">
                    {idx > 0 && <span className="text-gray-400">→</span>}
                    <span className="font-medium text-gray-700">
                      {c.id === 'date' && 'Tanggal'}
                      {c.id === 'client' && 'Klien'}
                      {c.id === 'service' && 'Layanan'}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Active Sub-Filters Info */}
          {(selectedMonths.length > 0 || selectedYears.length > 0 || selectedClients.length > 0 || selectedServices.length > 0) && (
            <div className="text-xs text-blue-700 flex items-center justify-center gap-2 pt-1 bg-blue-50 px-3 py-2 rounded-lg">
              <FiFilter size={12} />
              <span className="font-medium">
                Filter Aktif: 
                {selectedMonths.length > 0 && ` ${selectedMonths.length} Bulan`}
                {selectedYears.length > 0 && ` ${selectedYears.length} Tahun`}
                {selectedClients.length > 0 && ` ${selectedClients.length} Klien`}
                {selectedServices.length > 0 && ` ${selectedServices.length} Layanan`}
              </span>
            </div>
          )}
        </div>

        {/* Row 4: Active Status Filters */}
        {(filterStatus || filterPaymentStatus) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
            <span className="text-xs font-semibold text-gray-600">Filter Aktif:</span>
            {filterStatus && (
              <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm">
                <FiFilter size={14} className="text-blue-600" />
                <span className="text-blue-700">Status: <span className="font-medium">{filterStatus}</span></span>
              </div>
            )}
            
            {filterPaymentStatus && (
              <div className="px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2 text-sm">
                <FiDollarSign size={14} className="text-orange-600" />
                <span className="text-orange-700">Pembayaran: <span className="font-medium">{filterPaymentStatus}</span></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bookings View - Table or Calendar */}
      {viewMode === 'calendar' ? (
        <CalendarView 
          bookings={sortedBookings}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onGenerateInvoice={handleGenerateInvoice}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Search Result Info */}
          {searchQuery && (
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-sm text-blue-800">
                  <span className="font-medium">Hasil pencarian:</span>{' '}
                  <span className="font-semibold">"{searchQuery}"</span>
                  {' '}— Ditemukan <span className="font-bold">{sortedBookings.length}</span> booking
                </div>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
              >
                Hapus pencarian
              </button>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Klien
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Layanan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal, Waktu, Tempat
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pembayaran
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : sortedBookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {searchQuery ? (
                      <div className="flex flex-col items-center gap-2">
                        <p className="font-medium">Tidak ada hasil untuk "{searchQuery}"</p>
                        <p className="text-sm">Coba cari dengan nama klien, nomor kontak, atau layanan lainnya</p>
                      </div>
                    ) : filterStatus || filterPaymentStatus ? (
                      'Tidak ada booking dengan filter yang dipilih'
                    ) : (
                      'Tidak ada data booking'
                    )}
                  </td>
                </tr>
              ) : (
                sortedBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {searchQuery ? highlightText(booking.client_name, searchQuery) : booking.client_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {searchQuery ? highlightText(booking.contact, searchQuery) : booking.contact}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 space-y-1">
                        {booking.services && booking.services.length > 0 ? (
                          booking.services
                            .filter(service => service) // Filter out null/undefined
                            .map((service, idx) => {
                              const serviceName = typeof service === 'string' 
                                ? service 
                                : (service?.name || String(service || '-'));
                              return (
                                <div key={idx} className="flex items-start gap-1">
                                  <span className="text-gray-400">•</span>
                                  <span>
                                    {searchQuery ? highlightText(serviceName, searchQuery) : serviceName}
                                  </span>
                                </div>
                              );
                            })
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{format.date(booking.booking_date)}</div>
                      <div className="text-sm text-gray-500">
                        {booking.booking_time ? booking.booking_time.substring(0, 5) : '-'}
                      </div>
                      {booking.location_name && booking.location_name !== '' && (
                        <div className="flex items-center gap-1 mt-1">
                          <FiMapPin className="w-3 h-3 text-blue-600" />
                          <span className="text-xs text-blue-600">{booking.location_name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={
                        booking.status === 'Dijadwalkan' ? 'info' :
                        booking.status === 'Selesai' ? 'success' :
                        booking.status === 'Dibatalkan' ? 'danger' : 'warning'
                      }>
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <Badge variant={
                          booking.payment_status === 'Lunas' ? 'success' :
                          booking.payment_status === 'DP' ? 'warning' : 'danger'
                        }>
                          {booking.payment_status}
                        </Badge>
                        <div className="text-sm font-medium text-gray-900 mt-1">
                          Total: {format.currency(booking.total_price)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Dibayar: {format.currency(booking.amount_paid)}
                        </div>
                        {booking.total_price - booking.amount_paid > 0 && (
                          <div className="text-sm text-red-600">
                            Sisa: {format.currency(booking.total_price - booking.amount_paid)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleGenerateInvoice(booking)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Generate Invoice"
                        >
                          <FiFileText size={16} />
                        </button>
                        
                        {booking.location_map_url && booking.location_map_url !== '' && (
                          <a
                            href={booking.location_map_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center justify-center"
                            title="Buka Lokasi di Google Maps"
                          >
                            <FiMapPin size={16} />
                          </a>
                        )}
                        
                        <a
                          href={getWhatsAppLink(booking.contact)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors inline-flex items-center justify-center"
                          title="Hubungi via WhatsApp"
                        >
                          <FiMessageCircle size={16} />
                        </a>
                        <button
                          onClick={() => handleEdit(booking)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(booking)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Menampilkan 1 hingga {bookings.length} dari {pagination.totalItems} hasil
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg">
                {pagination.currentPage}
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Modals */}
      <AddBookingModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleBookingSuccess}
      />

      <EditBookingModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          fetchStats(); // Refresh stats saat modal ditutup untuk memastikan data sinkron
        }}
        onSuccess={handleBookingSuccess}
        bookingId={selectedBookingId}
      />

      <GenerateInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          setSelectedBookingForInvoice(null);
          fetchStats(); // Refresh stats saat modal ditutup untuk memastikan data sinkron
        }}
        booking={selectedBookingForInvoice}
        onSave={() => {
          fetchBookings(); // Refresh data booking setelah save
          fetchStats(); // Refresh stats pembayaran secara realtime
        }}
      />

      <PinModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setBookingToDelete(null);
        }}
        onSuccess={handleDeleteAfterPin}
        title="Verifikasi PIN"
        message="Masukkan PIN keamanan Anda untuk menghapus data booking"
      />

      <NoPinNotificationModal
        isOpen={showNoPinModal}
        onClose={() => setShowNoPinModal(false)}
        message="Anda harus membuat PIN terlebih dahulu untuk menghapus data booking"
      />
    </div>
  );
};

export default UserDashboard;
