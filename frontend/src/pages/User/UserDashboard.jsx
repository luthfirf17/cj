import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format as dateFnsFormat } from 'date-fns';
import { id } from 'date-fns/locale';
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
  FiLink,
  FiCopy,
  FiCheck,
  FiShare2,
  FiGrid,
  FiColumns,
  FiClock,
} from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { StatCard } from '../../components/Common/Card';
import Table from '../../components/Common/Table';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import SearchInput from '../../components/Common/SearchInput';
import Select from '../../components/Common/Select';
import SearchableDropdown from '../../components/Common/SearchableDropdown';
import CalendarView from '../../components/CalendarView';
import BookingCardView from '../../components/User/booking/BookingCardView';
import AddBookingModal from '../../components/User/AddBookingModal';
import EditBookingModal from '../../components/User/EditBookingModal';
import GenerateInvoiceModal from '../../components/User/GenerateInvoiceModal';
import PinModal from '../../components/Common/PinModal';
import NoPinNotificationModal from '../../components/Common/NoPinNotificationModal';
import GoogleCalendar from '../../components/User/GoogleCalendar';
import Modal from '../../components/Common/Modal';
import { format } from '../../utils/format';
import { getWhatsAppLink } from '../../utils/phoneUtils';
import api from '../../services/api';
import authService from '../../services/authService';

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
  const [selectedStatuses, setSelectedStatuses] = useState([]); // allow multi-select of status cards
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState([]); // allow multi-select of payment status cards
  const [viewMode, setViewMode] = useState('table'); // 'table', 'calendar', or 'card'
  const [cardColumns, setCardColumns] = useState(3); // Grid columns for card view (3-6)
  
  // Modern multi-criteria sorting
  const [sortCriteria, setSortCriteria] = useState([]);
  
  // Advanced sort options (sub-filters)
  const [showDateOptions, setShowDateOptions] = useState(false);
  const [showClientOptions, setShowClientOptions] = useState(false);
  const [showServiceOptions, setShowServiceOptions] = useState(false);
  const [showResponsibleOptions, setShowResponsibleOptions] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedResponsibleParties, setSelectedResponsibleParties] = useState([]);
  
  // Search within dropdowns
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [responsibleSearchQuery, setResponsibleSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState(null);
  
  // PIN Modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [showNoPinModal, setShowNoPinModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  
  // Google Calendar Modal
  const [showGoogleCalendar, setShowGoogleCalendar] = useState(false);
  
  // Client Booking Link Modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [bookingLink, setBookingLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [bookingLinkData, setBookingLinkData] = useState(null);
  const [loadingBookingLink, setLoadingBookingLink] = useState(false);
  
  // Current user state
  const [currentUser, setCurrentUser] = useState(null);
  
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
  
  // Global responsible parties data
  const [globalResponsibleParties, setGlobalResponsibleParties] = useState([]);
  const [serviceResponsibleParties, setServiceResponsibleParties] = useState([]);

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
    if (authService.isAuthenticated()) {
      // Refresh user data to ensure auth_provider is up-to-date
      authService.refreshUser();
      const user = authService.getCurrentUser();
      setCurrentUser(user);
      
      // Fetch booking link from backend
      if (user) {
        fetchBookingLink();
      }
      
      // Check if we need to open Google Calendar modal
      if (window.location.search.includes('openCalendar=true')) {
        setShowGoogleCalendar(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Fetch booking link data from backend
  const fetchBookingLink = async () => {
    try {
      const response = await api.get('/user/booking-link');
      if (response.data.success) {
        setBookingLinkData(response.data.data);
        setBookingLink(response.data.data.full_url);
      }
    } catch (error) {
      console.error('Error fetching booking link:', error);
    }
  };

  // Regenerate booking code
  const regenerateBookingCode = async () => {
    if (!window.confirm('Apakah Anda yakin ingin membuat link booking baru? Link lama akan tidak bisa digunakan lagi.')) {
      return;
    }
    
    setLoadingBookingLink(true);
    try {
      const response = await api.post('/user/booking-link/regenerate');
      if (response.data.success) {
        setBookingLinkData(response.data.data);
        setBookingLink(response.data.data.full_url);
        alert('Link booking baru berhasil dibuat!');
      }
    } catch (error) {
      console.error('Error regenerating booking code:', error);
      alert('Gagal membuat link booking baru');
    } finally {
      setLoadingBookingLink(false);
    }
  };

  // Copy booking link to clipboard
  const copyBookingLink = () => {
    navigator.clipboard.writeText(bookingLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Fetch data when currentUser is set
  useEffect(() => {
    if (currentUser) {
      fetchStats();
      fetchFilterOptions();
      fetchGlobalResponsibleParties();
      fetchServiceResponsibleParties();
    }
  }, [currentUser]);

  // Fetch Bookings with debounce (faster for search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBookings();
    }, 150); // 150ms debounce for faster realtime search

    return () => clearTimeout(timeoutId);
  }, [pagination.currentPage, selectedStatuses, selectedPaymentStatuses, filterMonth, filterYear, filterService, filterClient]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/user/dashboard/stats', {
        params: { user_id: currentUser?.id }
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
        params: { user_id: currentUser?.id }
      });
      if (servicesRes.data.success) {
        setAvailableServices(servicesRes.data.data);
      }
      
      // Fetch clients
      const clientsRes = await api.get('/user/clients', {
        params: { user_id: currentUser?.id }
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

  const fetchGlobalResponsibleParties = async () => {
    try {
      const response = await api.get('/user/responsible-parties', {
        params: { user_id: 2 }
      });
      
      if (response.data.success) {
        console.log('👥 Global Responsible Parties loaded:', response.data.data.length, 'parties');
        setGlobalResponsibleParties(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching global responsible parties:', error);
    }
  };

  const fetchServiceResponsibleParties = async () => {
    try {
      const response = await api.get('/user/service-responsible-parties', {
        params: { user_id: currentUser?.id }
      });
      if (response.data.success) {
        console.log('🔗 Service Responsible Parties loaded:', response.data.data.length, 'mappings');
        setServiceResponsibleParties(response.data.data);
      }
    } catch (error) {
      // Only log error if it's not authentication related
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('Error fetching service responsible parties:', error);
      }
      // Silently fail for authentication errors - user will be redirected by ProtectedRoute
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {
        user_id: currentUser?.id,
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
      };

      // Don't send search to backend - we'll do client-side filtering
      // if (searchQuery) params.search = searchQuery;
      
      // Convert Indonesian status to English for backend only when a single status is selected
      if (selectedStatuses && selectedStatuses.length === 1) {
        let backendStatus = selectedStatuses[0];
        if (backendStatus === 'Dijadwalkan') backendStatus = 'confirmed';
        else if (backendStatus === 'Selesai') backendStatus = 'completed';
        else if (backendStatus === 'Dibatalkan') backendStatus = 'cancelled';
        params.status = backendStatus;
      }
      
      // Convert Indonesian payment status to English for backend
      if (selectedPaymentStatuses && selectedPaymentStatuses.length > 0) {
        const backendPaymentStatuses = selectedPaymentStatuses.map(status => {
          if (status === 'Belum Bayar') return 'unpaid';
          if (status === 'DP') return 'partial';
          if (status === 'Lunas') return 'paid';
          return status;
        });
        params.payment_statuses = backendPaymentStatuses.join(',');
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
            // Use booking_details.services for multiple services with full details
            const filteredServices = booking.booking_details.services.filter(s => s);
            const bookingTotalPrice = Number(booking.total_amount || booking.total_price || 0);
            
            // Calculate total quantity across all services
            const totalQuantity = filteredServices.reduce((sum, s) => sum + (Number(s.quantity) || 1), 0);
            
            allServices = filteredServices.map(s => {
              // Try to get price from service data first
              let servicePrice = Number(s.price || s.service_price || s.price_per_item || 0);
              let serviceTotalPrice = Number(s.total_price || s.total || 0);
              const serviceQty = Number(s.quantity) || 1;
              
              // If no price data in service, calculate from booking total
              if (servicePrice === 0 && serviceTotalPrice === 0 && bookingTotalPrice > 0) {
                // Distribute booking total proportionally based on quantity
                serviceTotalPrice = (bookingTotalPrice * serviceQty) / totalQuantity;
                servicePrice = serviceTotalPrice / serviceQty;
              } else if (servicePrice > 0 && serviceTotalPrice === 0) {
                serviceTotalPrice = servicePrice * serviceQty;
              } else if (serviceTotalPrice > 0 && servicePrice === 0) {
                servicePrice = serviceTotalPrice / serviceQty;
              }
              
              return {
                id: Number(s.service_id || s.id),
                name: s.name || s.service_name || s.serviceName || s,
                responsible_party_id: s.responsible_party_id || null,
                quantity: serviceQty,
                price: servicePrice,
                total_price: serviceTotalPrice
              };
            });
          } else {
            // Single service case - use booking.service_id and service_name
            const bookingTotalPrice = Number(booking.total_amount || booking.total_price || 0);
            allServices = [{
              id: booking.service_id,
              name: booking.service_name,
              responsible_party_id: null,
              quantity: 1,
              price: bookingTotalPrice,
              total_price: bookingTotalPrice
            }];
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
            location_map_url: booking.location_map_url || '',
            responsible_parties: booking.booking_details?.responsible_parties || [] // Extract responsible parties from booking level
          };
          
          return convertedBooking;
        });
        
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
              const serviceName = service.name || '';
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
    // support dropdown/legacy single-value setter by replacing selectedStatuses with single value
    const val = e.target.value;
    setSelectedStatuses(val ? [val] : []);
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
        'service': { id: 'service', order: 'asc', label: 'Layanan A→Z' },
        'responsible': { id: 'responsible', order: 'asc', label: 'Penanggung Jawab A→Z' }
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
    } else if (criteriaId === 'responsible') {
      setSelectedResponsibleParties([]);
      setResponsibleSearchQuery('');
    }
  };
  
  const resetSortCriteria = () => {
    setSortCriteria([]);
    setSelectedMonths([]);
    setSelectedYears([]);
    setSelectedClients([]);
    setSelectedServices([]);
    setSelectedResponsibleParties([]);
    setClientSearchQuery('');
    setServiceSearchQuery('');
    setResponsibleSearchQuery('');
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

  const toggleResponsible = (responsibleName) => {
    console.log('🎯 toggleResponsible called with:', responsibleName);
    setSelectedResponsibleParties(prev => {
      const newSelection = prev.includes(responsibleName) ? prev.filter(r => r !== responsibleName) : [...prev, responsibleName];
      console.log('🎯 New selectedResponsibleParties:', newSelection);
      return newSelection;
    });
  };

  // Table Columns
  const columns = [
    {
      header: 'Nama Booking',
      accessor: 'booking_name',
      render: (value, row) => (
        <div>
          <p className={`font-medium ${value ? 'text-gray-900' : 'text-gray-400 italic'}`}>
            {value || 'Belum diberi nama'}
          </p>
        </div>
      ),
    },
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
      render: (value, row) => (
        <div className="space-y-1">
          {value && value.length > 0 ? value.map((service, index) => {
            // Find responsible party for this service using the same logic as filtering
            let responsibleParty = null;
            
            // First priority: use service.responsible_party_id from booking data
            if (service.responsible_party_id) {
              responsibleParty = globalResponsibleParties.find(grp =>
                Number(grp.id) === Number(service.responsible_party_id)
              );
            }
            
            // Second priority: try to find by service-responsible mapping
            if (!responsibleParty && service.id) {
              responsibleParty = serviceResponsibleParties.find(srp =>
                Number(srp.service_id) === Number(service.id)
              );
            }
            
            // Third priority: try to match by service name from global parties (for legacy data)
            if (!responsibleParty && service.name) {
              responsibleParty = globalResponsibleParties.find(grp =>
                grp.name && service.name.toLowerCase().includes(grp.name.toLowerCase())
              );
            }
            
            return (
              <div key={index} className="text-xs">
                <div className="text-gray-700 font-medium">
                  • {service.name || service}{service.quantity && service.quantity > 1 ? ` (${service.quantity}x)` : ''}
                </div>
                {responsibleParty ? (
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                    <FiUser className="w-2.5 h-2.5" />
                    <span>{responsibleParty.name}</span>
                    {responsibleParty.phone && (
                      <a
                        href={getWhatsAppLink(responsibleParty.phone, responsibleParty.countryCode || '62')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 transition-colors"
                        title={`WhatsApp ${responsibleParty.name}`}
                      >
                        <FiMessageCircle className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                ) : null}
              </div>
            );
          }) : (
            <div className="text-xs text-gray-500">No services</div>
          )}
        </div>
      ),
    },
    {
      header: 'Penanggung Jawab Booking',
      accessor: 'responsible_parties',
      render: (value, row) => (
        <div className="space-y-1">
          {value && value.length > 0 ? value.map((party, index) => (
            <div key={index} className="flex items-center gap-1 text-xs text-gray-500">
              <FiUser className="w-2.5 h-2.5" />
              <span>{party.name}</span>
              {party.phone && (
                <a
                  href={getWhatsAppLink(party.phone, party.countryCode || '62')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 transition-colors"
                  title={`WhatsApp ${party.name}`}
                >
                  <FiMessageCircle className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          )) : (
            <div className="text-xs text-gray-400">-</div>
          )}
        </div>
      ),
    },
    {
      header: 'Tanggal, Waktu, Tempat',
      accessor: 'booking_date',
      render: (value, row) => {
        // Format date with short month name (3 letters)
        const formatDateShort = (date) => {
          if (!date) return '-'
          return dateFnsFormat(new Date(date), 'dd MMM yyyy', { locale: id })
        }

        return (
          <div>
            {/* Date display - show range if end date is different */}
            <p className="text-xs text-gray-900">
              {formatDateShort(value)}
              {row.booking_date_end && row.booking_date_end !== value && ` - ${formatDateShort(row.booking_date_end)}`}
            </p>
            
            {/* Time display - show range if end time exists */}
            <p className="text-xs text-gray-500">
              {dateFnsFormat(new Date(value), 'HH:mm', { locale: id })}
              {row.booking_time_end && ` - ${dateFnsFormat(new Date(row.booking_time_end), 'HH:mm', { locale: id })}`}
            </p>

            {/* Location */}
            {row.location_name && row.location_name !== '' && (
              <div className="flex items-center gap-1 mt-0.5">
                <FiMapPin className="w-2.5 h-2.5 text-blue-600" />
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
      render: (value, row) => {
        return (
          <div>
            <p className="text-xs font-medium text-gray-900">{format.currency(value)}</p>
            <p className="text-xs text-gray-500">{format.currency(row.amount_paid)} dibayar</p>
          </div>
        );
      },
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
    // Toggle status in selectedStatuses array
    setSelectedStatuses(prev => {
      const exists = prev.includes(status);
      if (exists) return prev.filter(s => s !== status);
      return [...prev, status];
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle card click for payment status filter
  const handlePaymentCardClick = (paymentStatus) => {
    setSelectedPaymentStatuses(prev => {
      const exists = prev.includes(paymentStatus);
      if (exists) return prev.filter(s => s !== paymentStatus);
      return [...prev, paymentStatus];
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Apply sub-filters first, then sort
  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];

    // Apply month filter
    if (selectedMonths.length > 0) {
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        const bookingMonth = String(bookingDate.getMonth() + 1).padStart(2, '0');
        return selectedMonths.includes(bookingMonth);
      });
    }

    // Apply year filter
    if (selectedYears.length > 0) {
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        const bookingYear = String(bookingDate.getFullYear());
        return selectedYears.includes(bookingYear);
      });
    }

    // Apply client filter
    if (selectedClients.length > 0) {
      filtered = filtered.filter(booking =>
        selectedClients.includes(booking.client_name)
      );
    }

    // Apply service filter
    if (selectedServices.length > 0) {
      filtered = filtered.filter(booking =>
        booking.services && booking.services.some(service => {
          const serviceName = service?.name || '';
          return selectedServices.includes(serviceName);
        })
      );
    }

    // Apply responsible party filter
    if (selectedResponsibleParties.length > 0) {
      console.log('🔍 Filtering by responsible parties:', selectedResponsibleParties);
      filtered = filtered.filter(booking =>
        booking.services && booking.services.some(service => {
          // First try to find by service-responsible mapping
          let serviceResponsibleParty = serviceResponsibleParties.find(srp =>
            srp.service_id == service.id
          );

          // If not found and service has responsible_party_id, try global parties
          if (!serviceResponsibleParty && service.responsible_party_id) {
            serviceResponsibleParty = globalResponsibleParties.find(grp =>
              grp.id == service.responsible_party_id
            );
          }

          // If still not found, try to match by service name from global parties (for legacy data)
          if (!serviceResponsibleParty) {
            serviceResponsibleParty = globalResponsibleParties.find(grp =>
              grp.name && service.name && service.name.toLowerCase().includes(grp.name.toLowerCase())
            );
          }

          const serviceResponsibleName = serviceResponsibleParty?.name;

          // Also check booking-level responsible parties
          const bookingResponsibleNames = booking.responsible_parties?.map(rp => rp.name) || [];

          // Check if any selected responsible party matches either service-level or booking-level
          return selectedResponsibleParties.some(selectedParty =>
            (serviceResponsibleName && serviceResponsibleName.toLowerCase().includes(selectedParty.toLowerCase())) ||
            bookingResponsibleNames.some(bookingParty =>
              bookingParty && bookingParty.toLowerCase().includes(selectedParty.toLowerCase())
            )
          );
        })
      );
      console.log('📊 Bookings after responsible party filter:', filtered.length);
    }

    // Apply status filter (client-side) for multi-select statuses
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(booking => selectedStatuses.includes(booking.status));
    }

    // Apply payment status filter (client-side) for multi-select payment statuses
    if (selectedPaymentStatuses.length > 0) {
      filtered = filtered.filter(booking => selectedPaymentStatuses.includes(booking.payment_status));
    }

    // Apply search query filter (combined for all fields including responsible parties)
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(booking => {
        // Search in client name
        const matchName = booking.client_name?.toLowerCase().includes(query);
        
        // Search in booking name
        const matchBookingName = booking.booking_name?.toLowerCase().includes(query);
        
        // Search in contact/phone
        const matchContact = booking.contact?.toLowerCase().includes(query) || 
                             booking.phone?.toLowerCase().includes(query);
        
        // Search in services
        const matchService = booking.services && Array.isArray(booking.services) && booking.services.some(service => {
          if (!service) return false;
          const serviceName = service.name || '';
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
        // Match formatted date string (08 Jan 2026)
        const formattedDate = dateFnsFormat(new Date(booking.booking_date), 'dd MMM yyyy', { locale: id }).toLowerCase();
        const matchFormattedDate = formattedDate.includes(query);
        
        const matchDate = matchDay || matchMonthName || matchMonthNumber || matchYear || matchFormattedDate;

        // Search in responsible parties (both booking-level and service-level)
        const trimmedQuery = query;
        // Check booking-level responsible parties
        const hasBookingResponsible = booking.responsible_parties?.some(party =>
          party?.name?.toLowerCase().includes(trimmedQuery)
        );

        // Check service-level responsible parties
        const hasServiceResponsible = booking.services?.some(service => {
          if (!service) return false;
          
          let serviceResponsibleParty = null;

          // First priority: use service.responsible_party_id from booking data
          if (service.responsible_party_id) {
            serviceResponsibleParty = globalResponsibleParties.find(grp =>
              Number(grp.id) === Number(service.responsible_party_id)
            );
          }

          // Second priority: try to find by service-responsible mapping
          if (!serviceResponsibleParty && service.id) {
            serviceResponsibleParty = serviceResponsibleParties.find(srp =>
              Number(srp.service_id) === Number(service.id)
            );
          }

          // Third priority: try to match by service name from global parties (for legacy data)
          if (!serviceResponsibleParty && service.name) {
            serviceResponsibleParty = globalResponsibleParties.find(grp =>
              grp?.name && service.name.toLowerCase().includes(grp.name.toLowerCase())
            );
          }

          const serviceResponsibleName = serviceResponsibleParty?.name;

          return serviceResponsibleName && serviceResponsibleName.toLowerCase().includes(trimmedQuery);
        });

        const matchResponsible = hasBookingResponsible || hasServiceResponsible;
        
        return matchName || matchBookingName || matchContact || matchService || matchLocation || matchDate || matchResponsible;
      });
    }

    return filtered;
  }, [bookings, selectedMonths, selectedYears, selectedClients, selectedServices, selectedResponsibleParties, selectedStatuses, selectedPaymentStatuses, serviceResponsibleParties, globalResponsibleParties, searchQuery]);
  
  // Modern multi-criteria sorting
  const sortedBookings = [...filteredBookings].sort((a, b) => {
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
          const serviceA = (a.services?.[0]?.name || a.services?.[0] || '').toString();
          const serviceB = (b.services?.[0]?.name || b.services?.[0] || '').toString();
          result = criteria.order === 'asc'
            ? serviceA.localeCompare(serviceB)
            : serviceB.localeCompare(serviceA);
          break;
        }
        
        case 'responsible': {
          // Find responsible party for first service of each booking
          const getResponsibleName = (booking) => {
            if (!booking.services || booking.services.length === 0) return '';
            const service = booking.services[0];
            const serviceResponsibleParty = serviceResponsibleParties.find(srp => 
              srp.service_id === service.id
            );
            return serviceResponsibleParty?.name || '';
          };
          
          const responsibleA = getResponsibleName(a);
          const responsibleB = getResponsibleName(b);
          result = criteria.order === 'asc'
            ? responsibleA.localeCompare(responsibleB)
            : responsibleB.localeCompare(responsibleA);
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
    <div className="space-y-4">
      {/* Status Booking Section */}
      <div>
        <h2 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Status Booking</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2">
          <div 
            onClick={() => setSelectedStatuses([])}
            className={`bg-white rounded-lg p-1.5 sm:p-2 hover:shadow-md transition-all cursor-pointer ${
              selectedStatuses.length === 0 ? 'border-2 border-blue-500 ring-2 ring-blue-100' : 'border border-gray-200'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <FiCalendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Total Booking</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.totalBooking}</p>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => handleStatusCardClick('Dijadwalkan')}
            className={`bg-white rounded-lg p-1.5 sm:p-2 hover:shadow-md transition-all cursor-pointer ${
              selectedStatuses.includes('Dijadwalkan') ? 'border-2 border-blue-500 ring-2 ring-blue-100' : 'border border-gray-200'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <FiAlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Dijadwalkan</p>
                <p className="text-lg sm:text-xl font-bold text-blue-600">{stats.scheduled}</p>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => handleStatusCardClick('Selesai')}
            className={`bg-white rounded-lg p-1.5 sm:p-2 hover:shadow-md transition-all cursor-pointer ${
              selectedStatuses.includes('Selesai') ? 'border-2 border-green-500 ring-2 ring-green-100' : 'border border-gray-200'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                <FiCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Selesai</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => handleStatusCardClick('Dibatalkan')}
            className={`bg-white rounded-lg p-1.5 sm:p-2 hover:shadow-md transition-all cursor-pointer ${
              selectedStatuses.includes('Dibatalkan') ? 'border-2 border-red-500 ring-2 ring-red-100' : 'border border-gray-200'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-lg flex items-center justify-center mb-2">
                <FiXCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Dibatalkan</p>
                <p className="text-lg sm:text-xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Pembayaran Section */}
      <div>
        <h2 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Status Pembayaran</h2>
        <div className="grid grid-cols-3 gap-1">
          <div 
            onClick={() => handlePaymentCardClick('Belum Bayar')}
            className={`bg-white rounded-lg p-1 hover:shadow-md transition-all cursor-pointer ${
              selectedPaymentStatuses.includes('Belum Bayar') ? 'border-2 border-yellow-500 ring-2 ring-yellow-100' : 'border border-gray-200'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-4 h-4 sm:w-6 sm:h-6 bg-yellow-100 rounded-lg flex items-center justify-center mb-1">
                <FiDollarSign className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-yellow-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5">Belum Bayar</p>
                <p className="text-sm sm:text-lg font-bold text-yellow-600">{stats.unpaid}</p>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => handlePaymentCardClick('DP')}
            className={`bg-white rounded-lg p-1 hover:shadow-md transition-all cursor-pointer ${
              selectedPaymentStatuses.includes('DP') ? 'border-2 border-orange-500 ring-2 ring-orange-100' : 'border border-gray-200'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-4 h-4 sm:w-6 sm:h-6 bg-orange-100 rounded-lg flex items-center justify-center mb-1">
                <FiCreditCard className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-orange-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5">Down Payment</p>
                <p className="text-sm sm:text-lg font-bold text-orange-600">{stats.downPayment}</p>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => handlePaymentCardClick('Lunas')}
            className={`bg-white rounded-lg p-1 hover:shadow-md transition-all cursor-pointer ${
              selectedPaymentStatuses.includes('Lunas') ? 'border-2 border-green-500 ring-2 ring-green-100' : 'border border-gray-200'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-4 h-4 sm:w-6 sm:h-6 bg-green-100 rounded-lg flex items-center justify-center mb-1">
                <FiCheckCircle className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5">Lunas</p>
                <p className="text-sm sm:text-lg font-bold text-green-600">{stats.paid}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-1.5 xs:p-2 sm:p-3 space-y-1.5 sm:space-y-2">
        {/* Row 1: Search Bar (Center) */}
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <SearchInput
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Cari nama klien, kontak, layanan, tanggal, atau lokasi..."
              className="text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Row 2: View Toggle and Add Button - Mobile optimized */}
        <div className="flex flex-wrap gap-1 xs:gap-1.5 sm:gap-2 items-center justify-center w-full">
          {/* View Toggle Buttons - Compact on mobile */}
          <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-1.5">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 xs:px-2 xs:py-1 sm:px-3 sm:py-1.5 rounded sm:rounded-lg flex items-center gap-0.5 sm:gap-1 transition-colors text-[10px] xs:text-xs font-medium touch-manipulation ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Tabel"
            >
              <FiFilter size={12} className="xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Tabel</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 xs:px-2 xs:py-1 sm:px-3 sm:py-1.5 rounded sm:rounded-lg flex items-center gap-0.5 sm:gap-1 transition-colors text-[10px] xs:text-xs font-medium touch-manipulation ${
                viewMode === 'card'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Card"
            >
              <FiGrid size={12} className="xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Card</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 xs:px-2 xs:py-1 sm:px-3 sm:py-1.5 rounded sm:rounded-lg flex items-center gap-0.5 sm:gap-1 transition-colors text-[10px] xs:text-xs font-medium touch-manipulation ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Kalender"
            >
              <FiCalendar size={12} className="xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Kalender</span>
            </button>
          </div>

          {/* Add Button - Compact on mobile */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 text-[10px] xs:text-xs px-2 xs:px-2.5 sm:px-3 py-1.5 xs:py-1.5 sm:py-2 rounded sm:rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium touch-manipulation transition-colors"
          >
            <FiPlus size={14} />
            <span className="hidden xs:inline">Tambah</span>
          </button>

          {/* Client Booking Link Button - Icon only on mobile */}
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-1 text-[10px] xs:text-xs px-2 xs:px-2.5 sm:px-3 py-1.5 xs:py-1.5 sm:py-2 rounded sm:rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-50 font-medium touch-manipulation transition-colors"
            title="Link Booking untuk Klien"
          >
            <FiLink size={14} />
            <span className="hidden sm:inline">Link</span>
          </button>

          {/* Google Calendar Button - Only for Google OAuth users */}
          {(() => {
            const currentUser = authService.getCurrentUser();
            return currentUser?.auth_provider === 'google';
          })() && (
            <button
              onClick={() => setShowGoogleCalendar(true)}
              className="flex items-center gap-1 text-[10px] xs:text-xs px-2 xs:px-2.5 sm:px-3 py-1.5 xs:py-1.5 sm:py-2 rounded sm:rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 font-medium touch-manipulation transition-colors"
              title="Buka Google Calendar"
            >
              <FiCalendar size={14} />
              <span className="hidden sm:inline lg:hidden">GCal</span>
              <span className="hidden lg:inline">Google Calendar</span>
            </button>
          )}
        </div>

        {/* Row 3: Modern Sort Chips - CENTER ALIGNED */}
        <div className="space-y-2 sm:space-y-3 w-full">
          <div className="flex items-center justify-center w-full">
            <button
              onClick={resetSortCriteria}
              className="text-[10px] xs:text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5 xs:gap-1 sm:gap-1.5 transition-colors px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 sm:py-2 rounded sm:rounded-lg hover:bg-blue-50 touch-manipulation"
            >
              <FiRefreshCw size={10} className="xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Mobile Backdrop - Appears when any dropdown is open */}
          {(showDateOptions || showClientOptions || showServiceOptions || showResponsibleOptions) && (
            <div 
              className="fixed inset-0 bg-black/30 z-[55] xs:hidden"
              onClick={() => {
                setShowDateOptions(false);
                setShowClientOptions(false);
                setShowServiceOptions(false);
                setShowResponsibleOptions(false);
              }}
            />
          )}

          {/* Sort Options Chips - Mobile optimized grid layout */}
          <div className="grid grid-cols-4 xs:flex xs:flex-wrap justify-center items-center gap-1 xs:gap-2 sm:gap-3 md:gap-4 w-full max-w-full px-0.5 xs:px-0">
            {/* Date Sort with Sub-Options */}
            <div className="relative">
              <button
                onClick={() => {
                  toggleSortCriteria('date');
                  setShowDateOptions(!showDateOptions);
                  setShowClientOptions(false);
                  setShowServiceOptions(false);
                  setShowResponsibleOptions(false);
                }}
                className={`group px-1.5 xs:px-2 sm:px-3 md:px-4 py-1 xs:py-1.5 sm:py-2 rounded-full flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 text-[10px] xs:text-xs sm:text-sm font-medium transition-all touch-manipulation ${
                  sortCriteria.find(c => c.id === 'date')
                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                <FiCalendar size={10} className="xs:w-3 xs:h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline lg:hidden">Tgl</span>
                <span className="hidden lg:inline">Tanggal</span>
                {sortCriteria.find(c => c.id === 'date') && (
                  <>
                    {sortCriteria.find(c => c.id === 'date')?.order === 'desc' ? (
                      <FiArrowDown size={8} className="xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3" />
                    ) : (
                      <FiArrowUp size={8} className="xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3" />
                    )}
                    <span
                      onClick={(e) => { e.stopPropagation(); removeSortCriteria('date'); setShowDateOptions(false); }}
                      className="ml-0.5 hover:bg-blue-500 rounded-full p-0.5 transition-colors cursor-pointer inline-flex"
                    >
                      <FiX size={8} className="xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3" />
                    </span>
                  </>
                )}
              </button>
              
              {/* Date Sub-Options Dropdown */}
              {showDateOptions && (
                <div className="fixed xs:absolute top-1/2 xs:top-full left-1/2 xs:left-0 transform -translate-x-1/2 -translate-y-1/2 xs:translate-y-0 xs:-translate-x-0 mt-0 xs:mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 sm:p-4 z-[60] w-[90vw] xs:w-[80vw] sm:w-72 md:w-80 max-w-sm max-h-[70vh] xs:max-h-[50vh] overflow-auto">
                  {/* Header with Close Button */}
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-200">
                    <h4 className="text-[10px] xs:text-xs sm:text-sm font-semibold text-gray-800">Filter Tanggal</h4>
                    <button
                      onClick={() => setShowDateOptions(false)}
                      className="p-0.5 xs:p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title="Tutup"
                    >
                      <FiX size={12} className="sm:w-4 sm:h-4 text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="space-y-2 overflow-y-auto">
                    <div>
                      <p className="text-[10px] xs:text-xs font-semibold text-gray-700 mb-1.5">Pilih Bulan:</p>
                      <div className="grid grid-cols-4 xs:grid-cols-4 sm:grid-cols-4 gap-0.5 xs:gap-1">
                        {availableMonths.map((month) => (
                          <button
                            key={month.value}
                            onClick={() => toggleMonth(month.value)}
                            className={`px-1 py-0.5 xs:py-1 text-[9px] xs:text-[10px] sm:text-xs rounded transition-colors touch-manipulation ${
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
                      <p className="text-[10px] xs:text-xs font-semibold text-gray-700 mb-1.5">Pilih Tahun:</p>
                      <div className="flex flex-wrap gap-0.5 xs:gap-1">
                        {availableYears.map((year) => (
                          <button
                            key={year.value}
                            onClick={() => toggleYear(year.value)}
                            className={`px-1.5 xs:px-2 py-0.5 xs:py-1 text-[10px] xs:text-xs rounded transition-colors touch-manipulation ${
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
                  setShowResponsibleOptions(false);
                }}
                className={`group px-1.5 xs:px-2 sm:px-3 md:px-4 py-1 xs:py-1.5 sm:py-2 rounded-full flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 text-[10px] xs:text-xs sm:text-sm font-medium transition-all touch-manipulation ${
                  sortCriteria.find(c => c.id === 'client')
                    ? 'bg-purple-600 text-white shadow-md hover:bg-purple-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                <FiUser size={10} className="xs:w-3 xs:h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Klien</span>
                {sortCriteria.find(c => c.id === 'client') && (
                  <>
                    {sortCriteria.find(c => c.id === 'client')?.order === 'asc' ? (
                      <span className="text-[8px] xs:text-[10px]">A→Z</span>
                    ) : (
                      <span className="text-[8px] xs:text-[10px]">Z→A</span>
                    )}
                    <span
                      onClick={(e) => { e.stopPropagation(); removeSortCriteria('client'); setShowClientOptions(false); }}
                      className="ml-0.5 hover:bg-purple-500 rounded-full p-0.5 transition-colors cursor-pointer inline-flex"
                    >
                      <FiX size={8} className="xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3" />
                    </span>
                  </>
                )}
              </button>
              
              {/* Client Sub-Options Dropdown */}
              {showClientOptions && (
                <div className="fixed xs:absolute top-1/2 xs:top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 xs:translate-y-0 mt-0 xs:mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 sm:p-4 z-[60] w-[90vw] xs:w-[80vw] sm:w-64 md:w-72 max-w-sm max-h-[70vh] xs:max-h-[50vh] overflow-auto">
                  {/* Header with Close Button */}
                  <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-gray-200">
                    <h4 className="text-[10px] xs:text-xs sm:text-sm font-semibold text-gray-800">Filter Klien</h4>
                    <button
                      onClick={() => setShowClientOptions(false)}
                      className="p-0.5 xs:p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title="Tutup"
                    >
                      <FiX size={12} className="sm:w-4 sm:h-4 text-gray-500" />
                    </button>
                  </div>
                  
                  {/* Search Box */}
                  <div className="mb-1.5 relative">
                    <FiSearch className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={10} />
                    <input
                      type="text"
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      placeholder="Cari klien..."
                      className="w-full pl-5 xs:pl-6 pr-2 py-1 text-[10px] xs:text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  {/* Client List with Scroll */}
                  <div className="space-y-0.5 max-h-32 xs:max-h-40 overflow-y-auto">
                    {availableClients
                      .filter(client => 
                        client.name.toLowerCase().includes(clientSearchQuery.toLowerCase())
                      )
                      .map((client) => (
                        <button
                          key={client.name}
                          onClick={() => toggleClient(client.name)}
                          className={`w-full px-1.5 xs:px-2 py-1 xs:py-1.5 text-left text-[10px] xs:text-xs rounded transition-colors touch-manipulation truncate ${
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
                      <div className="text-[10px] xs:text-xs text-gray-500 text-center py-2">
                        Tidak ditemukan
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
                  setShowResponsibleOptions(false);
                }}
                className={`group px-1.5 xs:px-2 sm:px-3 md:px-4 py-1 xs:py-1.5 sm:py-2 rounded-full flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 text-[10px] xs:text-xs sm:text-sm font-medium transition-all touch-manipulation ${
                  sortCriteria.find(c => c.id === 'service')
                    ? 'bg-green-600 text-white shadow-md hover:bg-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                <FiPackage size={10} className="xs:w-3 xs:h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Layanan</span>
                {sortCriteria.find(c => c.id === 'service') && (
                  <>
                    {sortCriteria.find(c => c.id === 'service')?.order === 'asc' ? (
                      <span className="text-[8px] xs:text-[10px]">A→Z</span>
                    ) : (
                      <span className="text-[8px] xs:text-[10px]">Z→A</span>
                    )}
                    <span
                      onClick={(e) => { e.stopPropagation(); removeSortCriteria('service'); setShowServiceOptions(false); }}
                      className="ml-0.5 hover:bg-green-500 rounded-full p-0.5 transition-colors cursor-pointer inline-flex"
                    >
                      <FiX size={8} className="xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3" />
                    </span>
                  </>
                )}
              </button>
              
              {/* Service Sub-Options Dropdown */}
              {showServiceOptions && (
                <div className="fixed xs:absolute top-1/2 xs:top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 xs:translate-y-0 mt-0 xs:mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 sm:p-4 z-[60] w-[90vw] xs:w-[80vw] sm:w-64 md:w-72 max-w-sm max-h-[70vh] xs:max-h-[50vh] overflow-auto">
                  {/* Header with Close Button */}
                  <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-gray-200">
                    <h4 className="text-[10px] xs:text-xs sm:text-sm font-semibold text-gray-800">Filter Layanan</h4>
                    <button
                      onClick={() => setShowServiceOptions(false)}
                      className="p-0.5 xs:p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title="Tutup"
                    >
                      <FiX size={12} className="sm:w-4 sm:h-4 text-gray-500" />
                    </button>
                  </div>
                  
                  {/* Search Box */}
                  <div className="mb-1.5 relative">
                    <FiSearch className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={10} />
                    <input
                      type="text"
                      value={serviceSearchQuery}
                      onChange={(e) => setServiceSearchQuery(e.target.value)}
                      placeholder="Cari layanan..."
                      className="w-full pl-5 xs:pl-6 pr-2 py-1 text-[10px] xs:text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  {/* Service List with Scroll */}
                  <div className="space-y-0.5 max-h-32 xs:max-h-40 overflow-y-auto">
                    {availableServices
                      .filter(service => 
                        service.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())
                      )
                      .map((service) => (
                        <button
                          key={service.name}
                          onClick={() => toggleService(service.name)}
                          className={`w-full px-1.5 xs:px-2 py-1 xs:py-1.5 text-left text-[10px] xs:text-xs rounded transition-colors touch-manipulation truncate ${
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
                      <div className="text-[10px] xs:text-xs text-gray-500 text-center py-2">
                        Tidak ditemukan
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Responsible Party Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  toggleSortCriteria('responsible');
                  setShowResponsibleOptions(!showResponsibleOptions);
                  setShowDateOptions(false);
                  setShowClientOptions(false);
                  setShowServiceOptions(false);
                }}
                className={`group px-1.5 xs:px-2 sm:px-3 md:px-4 py-1 xs:py-1.5 sm:py-2 rounded-full flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 text-[10px] xs:text-xs sm:text-sm font-medium transition-all touch-manipulation ${
                  sortCriteria.find(c => c.id === 'responsible')
                    ? 'bg-orange-600 text-white shadow-md hover:bg-orange-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                <FiUser size={10} className="xs:w-3 xs:h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline lg:hidden">PJ</span>
                <span className="hidden lg:inline">Penanggung Jawab</span>
                {sortCriteria.find(c => c.id === 'responsible') && (
                  <>
                    {sortCriteria.find(c => c.id === 'responsible')?.order === 'asc' ? (
                      <span className="text-[8px] xs:text-[10px]">A→Z</span>
                    ) : (
                      <span className="text-[8px] xs:text-[10px]">Z→A</span>
                    )}
                    <span
                      onClick={(e) => { e.stopPropagation(); removeSortCriteria('responsible'); setShowResponsibleOptions(false); }}
                      className="ml-0.5 hover:bg-orange-500 rounded-full p-0.5 transition-colors cursor-pointer inline-flex"
                    >
                      <FiX size={8} className="xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3" />
                    </span>
                  </>
                )}
                {selectedResponsibleParties.length > 0 && !sortCriteria.find(c => c.id === 'responsible') && (
                  <span className="ml-0.5 bg-orange-500 text-white text-[8px] xs:text-[10px] px-1 py-0.5 rounded-full">
                    {selectedResponsibleParties.length}
                  </span>
                )}
              </button>
              
              {/* Responsible Party Dropdown */}
              {showResponsibleOptions && (
                <div className="fixed xs:absolute top-1/2 xs:top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 xs:translate-y-0 mt-0 xs:mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 sm:p-4 z-[60] w-[90vw] xs:w-[80vw] sm:w-52 md:w-56 max-w-sm max-h-[70vh] xs:max-h-[50vh] overflow-auto">
                  {/* Header with Close Button */}
                  <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-gray-200">
                    <h4 className="text-[10px] xs:text-xs sm:text-sm font-semibold text-gray-800">Filter Penanggung Jawab</h4>
                    <button
                      onClick={() => setShowResponsibleOptions(false)}
                      className="p-0.5 xs:p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title="Tutup"
                    >
                      <FiX size={12} className="sm:w-4 sm:h-4 text-gray-500" />
                    </button>
                  </div>
                  
                  {/* Search Box */}
                  <div className="mb-1.5 relative">
                    <FiSearch className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={10} />
                    <input
                      type="text"
                      value={responsibleSearchQuery}
                      onChange={(e) => setResponsibleSearchQuery(e.target.value)}
                      placeholder="Cari Penanggung Jawab..."
                      className="w-full pl-5 xs:pl-6 pr-2 py-1 text-[10px] xs:text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  {/* Responsible Party List with Scroll */}
                  <div className="space-y-0.5 max-h-32 xs:max-h-40 overflow-y-auto">
                    {globalResponsibleParties
                      .filter(party => 
                        party.name.toLowerCase().includes(responsibleSearchQuery.toLowerCase())
                      )
                      .map((party) => (
                        <button
                          key={party.id}
                          onClick={() => toggleResponsible(party.name)}
                          className={`w-full px-1.5 xs:px-2 py-1 xs:py-1.5 text-left text-[10px] xs:text-xs rounded transition-colors touch-manipulation truncate ${
                            selectedResponsibleParties.includes(party.name)
                              ? 'bg-orange-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {party.name}
                        </button>
                      ))}
                    {globalResponsibleParties.filter(party => 
                      party.name.toLowerCase().includes(responsibleSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="text-[10px] xs:text-xs text-gray-500 text-center py-2">
                        Tidak ditemukan
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Sort Info - CENTER ALIGNED */}
          {sortCriteria.length > 0 && (
            <div className="text-[10px] xs:text-xs sm:text-sm text-gray-600 flex items-center justify-center gap-1 xs:gap-2 pt-1">
              <span className="font-medium">Urutan:</span>
              <div className="flex items-center gap-0.5 xs:gap-1 flex-wrap justify-center">
                {sortCriteria.map((c, idx) => (
                  <span key={c.id} className="inline-flex items-center gap-0.5">
                    {idx > 0 && <span className="text-gray-400">→</span>}
                    <span className="font-medium text-gray-700">
                      {c.id === 'date' && 'Tgl'}
                      {c.id === 'client' && 'Klien'}
                      {c.id === 'service' && 'Layanan'}
                      {c.id === 'responsible' && 'Penanggung Jawab'}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Active Sub-Filters Info */}
          {(selectedMonths.length > 0 || selectedYears.length > 0 || selectedClients.length > 0 || selectedServices.length > 0) && (
            <div className="text-xs sm:text-sm text-blue-700 flex items-center justify-center gap-2 pt-1 bg-blue-50 px-3 sm:px-3 py-2 rounded-lg mx-2 sm:mx-0">
              <FiFilter size={12} className="sm:w-4 sm:h-4" />
              <span className="font-medium text-center">
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
        {(selectedStatuses.length > 0 || selectedPaymentStatuses.length > 0) && (
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 pt-2 border-t border-gray-200">
            <span className="text-xs sm:text-sm font-semibold text-gray-600">Filter Aktif:</span>
            <div className="flex flex-wrap items-center gap-2">
              {selectedStatuses.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <FiFilter size={14} className="text-blue-600" />
                  {selectedStatuses.map(s => (
                    <div key={s} className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                      <span className="font-medium">{s}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedPaymentStatuses.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <FiDollarSign size={14} className="text-orange-600" />
                  {selectedPaymentStatuses.map(s => (
                    <div key={s} className="px-2 py-1 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
                      <span className="font-medium">{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bookings View - Table, Card, or Calendar */}
      {viewMode === 'calendar' ? (
        <CalendarView 
          bookings={sortedBookings}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onGenerateInvoice={handleGenerateInvoice}
        />
      ) : viewMode === 'card' ? (
        <div className="space-y-4">
          {/* Card View Controls */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FiColumns className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Jumlah Kolom:</span>
            </div>
            <div className="flex items-center gap-2">
              {[3, 4, 5, 6].map(cols => (
                <button
                  key={cols}
                  onClick={() => setCardColumns(cols)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    cardColumns === cols
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cols}
                </button>
              ))}
            </div>
          </div>

          {/* Search Result Info for Card View */}
          {searchQuery && (
            <div className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
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

          {/* Card Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <BookingCardView
              bookings={sortedBookings}
              cardColumns={cardColumns}
              searchQuery={searchQuery}
              highlightText={highlightText}
              globalResponsibleParties={globalResponsibleParties}
              serviceResponsibleParties={serviceResponsibleParties}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onGenerateInvoice={handleGenerateInvoice}
              pagination={pagination}
              onPageChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
              selectedStatuses={selectedStatuses}
              selectedPaymentStatuses={selectedPaymentStatuses}
            />
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {/* Search Result Info */}
          {searchQuery && (
            <div className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-xs sm:text-sm text-blue-800">
                  <span className="font-medium">Hasil pencarian:</span>{' '}
                  <span className="font-semibold">"{searchQuery}"</span>
                  {' '}— Ditemukan <span className="font-bold">{sortedBookings.length}</span> booking
                </div>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
              >
                Hapus pencarian
              </button>
            </div>
          )}
          
          <div className="overflow-x-auto -mx-2 sm:mx-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full text-xs divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Booking
                  </th>
                  <th className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Klien
                  </th>
                  <th className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Layanan
                  </th>
                  <th className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Penanggung Jawab Booking
                  </th>
                  <th className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal, Waktu, Tempat
                  </th>
                  <th className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pembayaran
                  </th>
                  <th className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-2 sm:px-4 py-3 sm:py-4 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : sortedBookings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-2 sm:px-4 py-3 sm:py-4 text-center text-gray-500">
                    {searchQuery ? (
                      <div className="flex flex-col items-center gap-1">
                        <p className="font-medium text-xs sm:text-sm">Tidak ada hasil untuk "{searchQuery}"</p>
                        <p className="text-xs">Coba cari dengan nama klien, nomor kontak, atau layanan lainnya</p>
                      </div>
                    ) : (selectedStatuses.length > 0) || (selectedPaymentStatuses.length > 0) ? (
                      <p className="text-xs sm:text-sm">Tidak ada booking dengan filter yang dipilih</p>
                    ) : (
                      <p className="text-xs sm:text-sm">Tidak ada data booking</p>
                    )}
                  </td>
                </tr>
              ) : (
                sortedBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-1.5 sm:px-2 py-1.5 sm:py-2">
                      <div>
                        <div className={`text-xs font-medium ${booking.booking_name ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                          {searchQuery ? highlightText(booking.booking_name || 'Belum diberi nama', searchQuery) : (booking.booking_name || 'Belum diberi nama')}
                        </div>
                      </div>
                    </td>
                    <td className="px-1.5 sm:px-2 py-1.5 sm:py-2">
                      <div>
                        <div className="text-xs font-medium text-gray-900">
                          {searchQuery ? highlightText(booking.client_name, searchQuery) : booking.client_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {searchQuery ? highlightText(booking.contact, searchQuery) : booking.contact}
                        </div>
                      </div>
                    </td>
                    <td className="px-1.5 sm:px-2 py-1.5 sm:py-2">
                      <div className="text-xs text-gray-900 space-y-0.5">
                        {booking.services && booking.services.length > 0 ? (
                          booking.services
                            .filter(service => service) // Filter out null/undefined
                            .map((service, idx) => {
                              // Find responsible party for this service using the same logic as filtering
                              let responsibleParty = null;
                              
                              // First try to find by service-responsible mapping
                              if (service.id) {
                                responsibleParty = serviceResponsibleParties.find(srp =>
                                  Number(srp.service_id) === Number(service.id)
                                );
                              }
                              
                              // If not found and service has responsible_party_id, try global parties
                              if (!responsibleParty && service.responsible_party_id) {
                                responsibleParty = globalResponsibleParties.find(grp =>
                                  Number(grp.id) === Number(service.responsible_party_id)
                                );
                              }
                              
                              // If still not found, try to match by service name from global parties (for legacy data)
                              if (!responsibleParty && service.name) {
                                responsibleParty = globalResponsibleParties.find(grp =>
                                  grp.name && service.name.toLowerCase().includes(grp.name.toLowerCase())
                                );
                              }
                              
                              const serviceName = typeof service === 'string' 
                                ? service 
                                : (service?.name || String(service || '-'));
                              
                              return (
                                <div key={idx} className="text-xs">
                                  <div className="flex items-start gap-1">
                                    <span className="text-gray-400 text-xs">•</span>
                                    <span className="text-xs">
                                      {searchQuery ? highlightText(serviceName, searchQuery) : serviceName}{service.quantity && service.quantity > 1 ? ` (${service.quantity}x)` : ''}
                                    </span>
                                  </div>
                                  {responsibleParty ? (
                                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500 ml-3">
                                      <FiUser className="w-2.5 h-2.5" />
                                      <span>{responsibleParty.name}</span>
                                      {responsibleParty.phone && (
                                        <a
                                          href={getWhatsAppLink(responsibleParty.phone, responsibleParty.countryCode || '62')}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-green-600 hover:text-green-700 transition-colors"
                                          title={`WhatsApp ${responsibleParty.name}`}
                                        >
                                          <FiMessageCircle className="w-2.5 h-2.5" />
                                        </a>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-1.5 sm:px-2 py-1.5 sm:py-2">
                      <div className="text-xs text-gray-900 space-y-0.5">
                        {(() => {
                          try {
                            const notesData = booking.notes ? JSON.parse(booking.notes) : {};
                            const responsibleParties = notesData.responsible_parties || [];
                            return responsibleParties.length > 0 ? (
                              responsibleParties.map((party, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <span className="text-gray-400 text-xs">•</span>
                                  <span className="text-xs">
                                    {party.name}
                                  </span>
                                  {party.phone && (
                                    <a
                                      href={getWhatsAppLink(party.phone)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors inline-flex items-center justify-center"
                                      title="Hubungi via WhatsApp"
                                    >
                                      <FiMessageCircle size={12} className="w-3 h-3 lg:w-4 lg:h-4 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5" />
                                    </a>
                                  )}
                                </div>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            );
                          } catch (error) {
                            return <span className="text-gray-400 text-xs">-</span>;
                          }
                        })()}
                      </div>
                    </td>
                    <td className="px-1.5 sm:px-2 py-1.5 sm:py-2">
                      <div className="text-xs text-gray-900">
                        {dateFnsFormat(new Date(booking.booking_date), 'dd MMM yyyy', { locale: id })}
                        {booking.booking_date_end && booking.booking_date_end !== booking.booking_date && ` - ${dateFnsFormat(new Date(booking.booking_date_end), 'dd MMM yyyy', { locale: id })}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.booking_time ? booking.booking_time.substring(0, 5) : '-'}
                        {booking.booking_time_end && ` - ${booking.booking_time_end.substring(0, 5)}`}
                      </div>
                      {booking.location_name && booking.location_name !== '' && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <FiMapPin className="w-2.5 h-2.5 text-blue-600" />
                          <span className="text-xs text-blue-600">{booking.location_name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-1.5 sm:px-2 py-1.5 sm:py-2">
                      <Badge variant={
                        booking.status === 'Dijadwalkan' ? 'info' :
                        booking.status === 'Selesai' ? 'success' :
                        booking.status === 'Dibatalkan' ? 'danger' : 'warning'
                      } className="text-xs px-1 py-0.5">
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="px-1.5 sm:px-2 py-1.5 sm:py-2">
                      <div className="space-y-0.5">
                        <Badge variant={
                          booking.payment_status === 'Lunas' ? 'success' :
                          booking.payment_status === 'DP' ? 'warning' : 'danger'
                        } className="text-xs px-1 py-0.5">
                          {booking.payment_status}
                        </Badge>
                        <div className="text-xs font-medium text-gray-900">
                          Total: {format.currency(booking.total_price)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Dibayar: {format.currency(booking.amount_paid)}
                        </div>
                        {booking.total_price - booking.amount_paid > 0 && (
                          <div className="text-xs text-red-600">
                            Sisa: {format.currency(booking.total_price - booking.amount_paid)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-1.5 sm:px-2 py-1.5 sm:py-2">
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleGenerateInvoice(booking)}
                          className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title="Generate Invoice"
                        >
                          <FiFileText size={14} />
                        </button>
                        
                        {booking.location_map_url && booking.location_map_url !== '' && (
                          <a
                            href={booking.location_map_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors inline-flex items-center justify-center"
                            title="Buka Lokasi di Google Maps"
                          >
                            <FiMapPin size={14} />
                          </a>
                        )}
                        
                        <a
                          href={getWhatsAppLink(booking.contact)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors inline-flex items-center justify-center"
                          title="Hubungi via WhatsApp"
                        >
                          <FiMessageCircle size={14} />
                        </a>
                        <button
                          onClick={() => handleEdit(booking)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <FiEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(booking)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Hapus"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
            </div>
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

      <GoogleCalendar
        isOpen={showGoogleCalendar}
        onClose={() => setShowGoogleCalendar(false)}
      />

      {/* Client Booking Link Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        title="Link Booking untuk Klien"
        size="md"
      >
        <div className="space-y-6">
          <p className="text-gray-600 text-sm">
            Bagikan link atau QR Code ini ke klien Anda agar mereka bisa mengirimkan booking langsung.
          </p>

          {/* QR Code */}
          <div className="flex justify-center p-6 bg-white border-2 border-dashed border-gray-200 rounded-xl">
            <QRCodeSVG 
              value={bookingLink} 
              size={180}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Booking Code Display */}
          {bookingLinkData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-gray-600 font-medium">Kode Booking:</span>
                <span className="font-mono text-blue-600 font-semibold">
                  {bookingLinkData.booking_code}
                </span>
              </div>
            </div>
          )}

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Link Booking</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={bookingLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
              />
              <Button
                variant={linkCopied ? 'success' : 'outline'}
                icon={linkCopied ? <FiCheck /> : <FiCopy />}
                onClick={copyBookingLink}
              >
                {linkCopied ? 'Disalin!' : 'Salin'}
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={`https://wa.me/?text=Silakan booking melalui link berikut: ${encodeURIComponent(bookingLink)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm"
            >
              <FiShare2 size={16} />
              Share via WhatsApp
            </a>
            <Button
              variant="outline"
              onClick={() => window.open(bookingLink, '_blank')}
            >
              Preview Link
            </Button>
          </div>

          {/* Regenerate Button */}
          {bookingLinkData && (
            <div className="border-t pt-4">
              <Button
                variant="outline"
                icon={<FiRefreshCw className={loadingBookingLink ? 'animate-spin' : ''} />}
                onClick={regenerateBookingCode}
                disabled={loadingBookingLink}
                className="w-full"
              >
                {loadingBookingLink ? 'Membuat Link Baru...' : 'Buat Link Baru'}
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                💡 Link lama akan tidak bisa digunakan jika Anda membuat link baru
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default UserDashboard;
