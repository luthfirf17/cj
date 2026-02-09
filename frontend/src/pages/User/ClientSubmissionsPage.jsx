import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FiCalendar, FiUser, FiPhone, FiMapPin, FiPackage, 
  FiCheck, FiX, FiEye, FiClock, FiTrash2, FiRefreshCw,
  FiLink, FiShare2, FiCopy, FiAlertCircle, FiFileText,
  FiDollarSign, FiPercent, FiPlus, FiSearch, FiEdit2, FiExternalLink
} from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import authService from '../../services/authService';
import Modal from '../../components/Common/Modal';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';

const ClientSubmissionsPage = () => {
  // Helper function to format currency with thousand separators
  const formatCurrencyInput = (value) => {
    if (!value) return '';
    const numValue = value.toString().replace(/\D/g, '');
    return numValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Helper function to parse formatted currency back to number
  const parseCurrencyInput = (value) => {
    if (!value) return 0;
    return parseInt(value.toString().replace(/\./g, ''), 10) || 0;
  };

  // Helper function to validate phone number (numbers only)
  const formatPhoneNumber = (value) => {
    return value.replace(/\D/g, '');
  };

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0
  });
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  
  // Confirm modal state - enhanced like AddBookingModal
  const [confirmData, setConfirmData] = useState({
    // Booking name
    booking_name: '',
    // Client info (editable)
    client_name: '',
    client_phone: '',
    client_address: '',
    // Booking dates (editable)
    booking_date: '',
    booking_date_end: '',
    booking_time: '',
    booking_time_end: '',
    // Location (editable)
    location_name: '',
    location_map_url: '',
    // Service prices (editable)
    services: [],
    // Booking days
    booking_days: 1,
    // Responsible parties
    responsible_parties: [],
    service_responsible_parties: [], // Per-service responsible party
    // Payment
    payment_status: 'Belum Bayar',
    amount_paid: 0,
    // Discount
    discount_value: 0,
    discount_type: 'rupiah',
    // Tax
    tax_percentage: 0,
    // Additional fees
    additional_fees: [],
    // Notes
    notes: '', // Single combined notes field
    // Google Calendar
    sync_to_google_calendar: false
  });

  // Calculated values
  const [originalSubtotal, setOriginalSubtotal] = useState(0);
  const [subtotalAmount, setSubtotalAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Reject modal state
  const [rejectReason, setRejectReason] = useState('');
  
  // Link modal state
  const [bookingLink, setBookingLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Processing state
  const [processing, setProcessing] = useState(false);

  // All available services for dropdown
  const [allServices, setAllServices] = useState([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const serviceDropdownRef = useRef(null);

  // Booking names data
  const [bookingNames, setBookingNames] = useState([]);
  const [showBookingNameDropdown, setShowBookingNameDropdown] = useState(false);
  const bookingNameDropdownRef = useRef(null);

  // Clients data (for dropdown)
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientDropdownRef = useRef(null);

  // Responsible parties data
  const [responsibleParties, setResponsibleParties] = useState([]);
  const [responsiblePartySearch, setResponsiblePartySearch] = useState('');
  const [showResponsiblePartyDropdown, setShowResponsiblePartyDropdown] = useState(false);
  const responsiblePartyDropdownRef = useRef(null);

  // Service responsible party search (per-service dropdown)
  const [serviceResponsiblePartySearch, setServiceResponsiblePartySearch] = useState([]);
  const [showServiceResponsiblePartyDropdown, setShowServiceResponsiblePartyDropdown] = useState([]);
  const serviceResponsiblePartyDropdownRef = useRef([]);

  // Google Calendar
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [isCheckingGoogleCalendar, setIsCheckingGoogleCalendar] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize
      };
      if (statusFilter) params.status = statusFilter;
      
      console.log('Fetching submissions with params:', params);
      const response = await api.get('/user/client-submissions', { params });
      console.log('Submissions response:', response.data);
      console.log('First submission booking_name:', response.data.data?.submissions?.[0]?.booking_name);
      
      if (response.data.success) {
        setSubmissions(response.data.data.submissions);
        setPagination(prev => ({
          ...prev,
          ...response.data.data.pagination
        }));
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, statusFilter]);

  const fetchResponsibleParties = async () => {
    try {
      const response = await api.get('/user/responsible-parties');
      if (response.data.success) {
        setResponsibleParties(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching responsible parties:', error);
    }
  };

  const fetchAllServices = async () => {
    try {
      const response = await api.get('/user/services');
      if (response.data.success) {
        setAllServices(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchBookingNames = async () => {
    try {
      console.log('Fetching booking names from bookings...');
      // TEMPORARY FIX: Get booking names from bookings table
      // TODO: Create dedicated /user/booking-names endpoint in backend
      const response = await api.get('/user/bookings');
      console.log('Bookings response:', response.data);
      
      if (response.data.success) {
        // Extract unique booking names from bookings
        const bookings = response.data.data?.bookings || [];
        const uniqueNames = [...new Set(
          bookings
            .map(b => b.booking_name)
            .filter(name => name && name.trim() !== '')
        )];
        console.log('Extracted unique booking names:', uniqueNames);
        setBookingNames(uniqueNames);
      }
    } catch (error) {
      console.error('Error fetching booking names:', error);
      // Silent fail - booking names is optional feature
      setBookingNames([]);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/user/clients');
      if (response.data.success) {
        setClients(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const checkGoogleCalendarConnection = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user || user.auth_provider !== 'google') {
        setIsGoogleCalendarConnected(false);
        return;
      }
      
      setIsCheckingGoogleCalendar(true);
      const response = await api.get('/user/google-calendar/status');
      if (response.data.success && response.data.data.connected) {
        setIsGoogleCalendarConnected(true);
      } else {
        setIsGoogleCalendarConnected(false);
      }
    } catch (err) {
      console.log('Google Calendar not connected:', err);
      setIsGoogleCalendarConnected(false);
    } finally {
      setIsCheckingGoogleCalendar(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    fetchResponsibleParties();
    fetchAllServices();
    fetchBookingNames();
    fetchClients();
    generateBookingLink();
    checkGoogleCalendarConnection();
  }, [fetchSubmissions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (responsiblePartyDropdownRef.current && !responsiblePartyDropdownRef.current.contains(event.target)) {
        setShowResponsiblePartyDropdown(false);
      }
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target)) {
        setShowServiceDropdown(false);
      }
      if (bookingNameDropdownRef.current && !bookingNameDropdownRef.current.contains(event.target)) {
        setShowBookingNameDropdown(false);
      }
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate booking days - sama seperti AddBookingModal
  useEffect(() => {
    if (confirmData.booking_date) {
      if (confirmData.booking_date_end && confirmData.booking_date_end !== confirmData.booking_date) {
        const startDate = new Date(confirmData.booking_date);
        const endDate = new Date(confirmData.booking_date_end);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setConfirmData(prev => ({ ...prev, booking_days: diffDays }));
      } else {
        setConfirmData(prev => ({ ...prev, booking_days: 1 }));
      }
    }
  }, [confirmData.booking_date, confirmData.booking_date_end]);

  // Calculate subtotal (services × days - discount)
  useEffect(() => {
    let subtotal = 0;
    confirmData.services.forEach(service => {
      const price = parseFloat(service.custom_price) || parseFloat(service.default_price) || 0;
      const qty = parseInt(service.quantity) || 1;
      subtotal += price * qty;
    });

    const bookingDays = Math.max(1, parseInt(confirmData.booking_days) || 1);
    subtotal = subtotal * bookingDays;
    setOriginalSubtotal(subtotal);

    let discountAmount = 0;
    if (confirmData.discount_value > 0) {
      if (confirmData.discount_type === 'persen') {
        discountAmount = (subtotal * confirmData.discount_value) / 100;
      } else {
        discountAmount = confirmData.discount_value;
      }
    }

    const afterDiscount = Math.max(0, subtotal - discountAmount);
    setSubtotalAmount(afterDiscount);
  }, [confirmData.services, confirmData.booking_days, confirmData.discount_value, confirmData.discount_type]);

  // Calculate total (subtotal + tax + fees)
  useEffect(() => {
    const taxAmount = subtotalAmount * (confirmData.tax_percentage || 0) / 100;
    const feesTotal = confirmData.additional_fees.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
    const total = subtotalAmount + taxAmount + feesTotal;
    setTotalAmount(Math.max(0, total));
  }, [subtotalAmount, confirmData.tax_percentage, confirmData.additional_fees]);

  // Auto-sync amount_paid when payment is "Lunas"
  useEffect(() => {
    if (confirmData.payment_status === 'Lunas') {
      setConfirmData(prev => ({ ...prev, amount_paid: totalAmount }));
    }
  }, [totalAmount, confirmData.payment_status]);

  const generateBookingLink = () => {
    const user = authService.getCurrentUser();
    if (user) {
      const baseUrl = window.location.origin;
      setBookingLink(`${baseUrl}/client-booking/${user.id}`);
    }
  };

  const handleViewDetail = (submission) => {
    setSelectedSubmission(submission);
    setShowDetailModal(true);
  };

  const handleOpenConfirm = (submission) => {
    console.log('=== OPENING CONFIRM MODAL ===');
    console.log('Full submission data:', submission);
    console.log('Submission booking_name:', submission.booking_name);
    console.log('Submission client_name:', submission.client_name);
    setSelectedSubmission(submission);
    
    // Initialize services with editable prices
    const services = (submission.services || []).map((s, idx) => ({
      ...s,
      index: idx,
      custom_price: s.custom_price || s.default_price || 0,
      quantity: s.quantity || 1,
      responsible_party_id: ''
    }));

    // Calculate booking days - same as AddBookingModal
    let bookingDays = 1;
    if (submission.booking_date && submission.booking_date_end) {
      const start = new Date(submission.booking_date);
      const end = new Date(submission.booking_date_end);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      bookingDays = diffDays + 1; // Include both start and end date
    }
    
    setConfirmData({
      booking_name: submission.booking_name || '',
      client_name: submission.client_name || '',
      client_phone: submission.contact || '',
      client_address: submission.address || '',
      booking_date: submission.booking_date || '',
      booking_date_end: submission.booking_date_end || submission.booking_date || '',
      booking_time: submission.start_time || '',
      booking_time_end: submission.end_time || '',
      location_name: submission.location || '',
      location_map_url: submission.location_map_url || '',
      services,
      booking_days: bookingDays,
      responsible_parties: [],
      service_responsible_parties: services.map(() => null),
      payment_status: 'Belum Bayar',
      amount_paid: 0,
      discount_value: 0,
      discount_type: 'rupiah',
      tax_percentage: 0,
      additional_fees: [],
      notes: submission.notes || '', // Single notes field (editable)
      sync_to_google_calendar: false
    });
    
    console.log('=== CONFIRM DATA SET ===');
    console.log('booking_name will be set to:', submission.booking_name || '');
    console.log('All booking names available:', bookingNames);
    
    setErrors({});
    setShowConfirmModal(true);
  };

  const updateServicePrice = (index, value) => {
    setConfirmData(prev => {
      const updated = [...prev.services];
      // Parse value from formatted string (remove dots)
      const cleanValue = typeof value === 'string' ? value.replace(/\./g, '') : value;
      const numValue = parseFloat(cleanValue) || 0;
      updated[index] = { ...updated[index], custom_price: numValue };
      return { ...prev, services: updated };
    });
  };

  const updateServiceQuantity = (index, value) => {
    setConfirmData(prev => {
      const updated = [...prev.services];
      // Handle undefined/empty value
      if (value === undefined || value === '') {
        updated[index] = { ...updated[index], quantity: undefined };
      } else {
        updated[index] = { ...updated[index], quantity: Math.max(1, parseInt(value) || 1) };
      }
      return { ...prev, services: updated };
    });
  };

  const updateServiceResponsibleParty = (index, partyId) => {
    setConfirmData(prev => {
      const updated = [...prev.service_responsible_parties];
      updated[index] = partyId ? parseInt(partyId) : null;
      return { ...prev, service_responsible_parties: updated };
    });
  };

  // Add new service to the list
  const addService = (service) => {
    setConfirmData(prev => ({
      ...prev,
      services: [...prev.services, {
        service_id: service.id,
        service_name: service.name,
        description: service.description,
        custom_price: service.default_price || 0,
        default_price: service.default_price || 0,
        quantity: 1,
        responsible_party_id: ''
      }],
      service_responsible_parties: [...prev.service_responsible_parties, null]
    }));
    setServiceSearch('');
    setShowServiceDropdown(false);
  };

  // Remove service from the list
  const removeService = (index) => {
    setConfirmData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
      service_responsible_parties: prev.service_responsible_parties.filter((_, i) => i !== index)
    }));
  };

  // Handle responsible party toggle
  const handleResponsiblePartyToggle = (party) => {
    setConfirmData(prev => {
      const exists = prev.responsible_parties.find(p => p.id === party.id);
      if (exists) {
        return { ...prev, responsible_parties: prev.responsible_parties.filter(p => p.id !== party.id) };
      } else {
        return { ...prev, responsible_parties: [...prev.responsible_parties, party] };
      }
    });
  };

  // Handle booking name selection
  const handleBookingNameSelect = (bookingName) => {
    console.log('Selected booking name:', bookingName);
    setConfirmData(prev => ({ ...prev, booking_name: bookingName }));
    setShowBookingNameDropdown(false);
  };

  // Filter booking names based on input - FIXED: Show all if input is empty
  const filteredBookingNames = bookingNames.filter(name => {
    if (!name) return false;
    if (!confirmData.booking_name || confirmData.booking_name.trim() === '') {
      return true; // Show all booking names when input is empty
    }
    return name.toLowerCase().includes(confirmData.booking_name.toLowerCase());
  });

  // Additional fees management
  const addAdditionalFee = () => {
    setConfirmData(prev => ({
      ...prev,
      additional_fees: [...prev.additional_fees, { description: '', amount: 0 }]
    }));
  };

  const removeAdditionalFee = (index) => {
    setConfirmData(prev => ({
      ...prev,
      additional_fees: prev.additional_fees.filter((_, i) => i !== index)
    }));
  };

  const updateAdditionalFee = (index, field, value) => {
    setConfirmData(prev => {
      const updated = [...prev.additional_fees];
      if (field === 'amount') {
        updated[index] = { ...updated[index], [field]: parseCurrencyInput(value) };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, additional_fees: updated };
    });
  };

  const validateConfirmData = () => {
    const newErrors = {};

    // Validate client info
    if (!confirmData.client_name || !confirmData.client_name.trim()) {
      newErrors.client_name = 'Nama klien wajib diisi';
    }
    if (!confirmData.client_phone || !confirmData.client_phone.trim()) {
      newErrors.client_phone = 'Nomor telepon wajib diisi';
    }

    // Validate booking date
    if (!confirmData.booking_date) {
      newErrors.booking_date = 'Tanggal booking wajib diisi';
    }

    // Validate discount
    if (confirmData.discount_type === 'persen' && confirmData.discount_value > 100) {
      newErrors.discount = 'Diskon persen tidak boleh lebih dari 100%';
    }
    if (confirmData.discount_type === 'rupiah' && confirmData.discount_value > originalSubtotal) {
      newErrors.discount = 'Diskon tidak boleh melebihi subtotal';
    }

    // Validate tax
    if (confirmData.tax_percentage < 0 || confirmData.tax_percentage > 100) {
      newErrors.tax = 'Pajak harus antara 0-100%';
    }

    // Validate amount paid
    if (confirmData.amount_paid < 0) {
      newErrors.amount_paid = 'Jumlah dibayar tidak boleh negatif';
    }
    if (confirmData.payment_status === 'Lunas' && confirmData.amount_paid < totalAmount) {
      newErrors.amount_paid = 'Jumlah dibayar harus sama dengan total untuk status Lunas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirmSubmission = async () => {
    if (!selectedSubmission) return;
    if (!validateConfirmData()) return;
    
    try {
      setProcessing(true);

      // Prepare services with updated prices and all required fields
      const servicesWithPrices = confirmData.services.map((s, idx) => ({
        service_id: s.service_id,
        service_name: s.service_name || s.name,
        custom_price: s.custom_price,
        quantity: s.quantity,
        responsible_party_id: confirmData.service_responsible_parties[idx] || null,
        description: s.description || ''
      }));

      const payload = {
        // Booking identification
        booking_name: confirmData.booking_name && confirmData.booking_name.trim() ? confirmData.booking_name.trim() : null,
        
        // Client information
        client_name: confirmData.client_name,
        client_phone: confirmData.client_phone,
        client_address: confirmData.client_address || null,
        
        // Booking dates and times
        booking_date: confirmData.booking_date,
        booking_date_end: confirmData.booking_date_end || confirmData.booking_date,
        booking_time: confirmData.booking_time || null,
        booking_time_end: confirmData.booking_time_end || null,
        booking_days: confirmData.booking_days,
        
        // Location information
        location_name: confirmData.location_name || null,
        location_map_url: confirmData.location_map_url || null,
        
        // Services
        services: servicesWithPrices,
        
        // Responsible parties
        responsible_parties: confirmData.responsible_parties.map(p => p.id),
        
        // Status
        status: 'Dijadwalkan', // Default status for confirmed bookings
        payment_status: confirmData.payment_status,
        
        // Financial information
        amount_paid: confirmData.amount_paid,
        discount_value: confirmData.discount_value,
        discount_type: confirmData.discount_type,
        tax_percentage: confirmData.tax_percentage,
        additional_fees: confirmData.additional_fees,
        total_amount: totalAmount,
        
        // Notes
        notes: confirmData.notes && confirmData.notes.trim() ? confirmData.notes.trim() : null,
        
        // Google Calendar
        sync_to_google_calendar: confirmData.sync_to_google_calendar
      };

      console.log('Confirm payload:', payload);
      console.log('Total amount:', totalAmount);
      console.log('Services with prices:', servicesWithPrices);

      const response = await api.post(`/user/client-submissions/${selectedSubmission.id}/confirm`, payload);
      
      if (response.data.success) {
        alert('Booking berhasil dikonfirmasi!');
        setShowConfirmModal(false);
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Error confirming submission:', error);
      alert('Gagal mengkonfirmasi: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenReject = (submission) => {
    setSelectedSubmission(submission);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmission = async () => {
    if (!selectedSubmission) return;
    
    try {
      setProcessing(true);
      const response = await api.post(`/user/client-submissions/${selectedSubmission.id}/reject`, {
        reason: rejectReason
      });
      
      if (response.data.success) {
        alert('Submission ditolak');
        setShowRejectModal(false);
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Error rejecting submission:', error);
      alert('Gagal menolak: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteSubmission = async (submission) => {
    if (!window.confirm('Yakin ingin menghapus submission ini?')) return;
    
    try {
      const response = await api.delete(`/user/client-submissions/${submission.id}`);
      if (response.data.success) {
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('Gagal menghapus submission');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(bookingLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Menunggu</Badge>;
      case 'confirmed':
        return <Badge variant="success">Dikonfirmasi</Badge>;
      case 'rejected':
        return <Badge variant="danger">Ditolak</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return timeStr.substring(0, 5);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID').format(value || 0);
  };

  // Filter responsible parties
  const filteredResponsibleParties = responsibleParties.filter(party =>
    party.name.toLowerCase().includes(responsiblePartySearch.toLowerCase()) ||
    (party.phone && party.phone.includes(responsiblePartySearch))
  );

  // Calculate totals for display
  const calculateDisplayTotals = () => {
    let discountAmount = 0;
    if (confirmData.discount_value > 0) {
      if (confirmData.discount_type === 'persen') {
        discountAmount = (originalSubtotal * confirmData.discount_value) / 100;
      } else {
        discountAmount = confirmData.discount_value;
      }
    }
    const taxAmount = subtotalAmount * (confirmData.tax_percentage || 0) / 100;
    const feesTotal = confirmData.additional_fees.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);

    return { originalSubtotal, discountAmount, subtotalAmount, taxAmount, feesTotal, totalAmount };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Konfirmasi Klien</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola booking yang dikirim oleh klien melalui link booking
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            icon={<FiRefreshCw />}
            onClick={() => fetchSubmissions()}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={<FiLink />}
            onClick={() => setShowLinkModal(true)}
          >
            Link Booking
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua</option>
              <option value="pending">Menunggu</option>
              <option value="confirmed">Dikonfirmasi</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-500">
            Total: {pagination.total} submission
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-gray-500">Memuat...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-8 text-center">
            <FiAlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada submission dari klien</p>
            <p className="text-gray-400 text-sm mt-1">
              Bagikan link booking ke klien untuk menerima booking
            </p>
            <Button
              variant="primary"
              icon={<FiLink />}
              onClick={() => setShowLinkModal(true)}
              className="mt-4"
            >
              Lihat Link Booking
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Klien</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Booking</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Layanan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Booking</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dikirim</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {submissions.map(submission => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{submission.client_name}</p>
                        <p className="text-sm text-gray-500">{submission.contact}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {submission.booking_name ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md font-medium">
                          <FiFileText size={12} />
                          {submission.booking_name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {(submission.services || []).slice(0, 2).map((s, idx) => (
                          <span key={idx} className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded mr-1">
                            {s.service_name || s.name} x{s.quantity || 1}
                          </span>
                        ))}
                        {(submission.services || []).length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{(submission.services || []).length - 2} lainnya
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="text-gray-900">{formatDate(submission.booking_date)}</p>
                        {submission.booking_date_end && submission.booking_date_end !== submission.booking_date && (
                          <p className="text-gray-500 text-xs">s/d {formatDate(submission.booking_date_end)}</p>
                        )}
                        {submission.start_time && (
                          <p className="text-gray-500 text-xs">
                            {formatTime(submission.start_time)}
                            {submission.end_time && ` - ${formatTime(submission.end_time)}`}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(submission.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(submission.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewDetail(submission)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <FiEye size={16} />
                        </button>
                        
                        {submission.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleOpenConfirm(submission)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Konfirmasi"
                            >
                              <FiCheck size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenReject(submission)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Tolak"
                            >
                              <FiX size={16} />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => handleDeleteSubmission(submission)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Halaman {pagination.page} dari {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detail Submission"
        size="lg"
      >
        {selectedSubmission && (
          <div className="space-y-6">
            {/* Booking Name */}
            {selectedSubmission.booking_name && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                  <FiFileText className="text-purple-600" /> Nama Booking
                </h3>
                <p className="text-lg font-medium text-purple-900">{selectedSubmission.booking_name}</p>
              </div>
            )}

            {/* Client Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiUser className="text-blue-500" /> Informasi Klien
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Nama:</span>
                  <p className="font-medium">{selectedSubmission.client_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Telepon:</span>
                  <p className="font-medium">{selectedSubmission.contact}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-500">Alamat:</span>
                  <p className="font-medium">{selectedSubmission.address || '-'}</p>
                </div>
              </div>
            </div>

            {/* Booking Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiCalendar className="text-blue-500" /> Informasi Booking
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Tanggal Mulai:</span>
                  <p className="font-medium">{formatDate(selectedSubmission.booking_date)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tanggal Selesai:</span>
                  <p className="font-medium">{formatDate(selectedSubmission.booking_date_end) || formatDate(selectedSubmission.booking_date)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Waktu:</span>
                  <p className="font-medium">
                    {selectedSubmission.start_time ? formatTime(selectedSubmission.start_time) : '-'}
                    {selectedSubmission.end_time && ` - ${formatTime(selectedSubmission.end_time)}`}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Lokasi:</span>
                  <p className="font-medium">{selectedSubmission.location || '-'}</p>
                </div>
                {selectedSubmission.location_map_url && (
                  <div className="sm:col-span-2">
                    <span className="text-gray-500">Google Maps:</span>
                    <a 
                      href={selectedSubmission.location_map_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Buka Maps <FiExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Services */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiPackage className="text-blue-500" /> Layanan
              </h3>
              <div className="space-y-2">
                {(selectedSubmission.services || []).map((s, idx) => (
                  <div key={idx} className="flex justify-between text-sm bg-white p-3 rounded-lg">
                    <div>
                      <p className="font-medium">{s.service_name || s.name}</p>
                      <p className="text-gray-500 text-xs">Qty: {s.quantity || 1}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-600">
                        Rp {formatCurrency((s.custom_price || s.default_price || 0) * (s.quantity || 1))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {selectedSubmission.notes && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FiFileText className="text-blue-500" /> Catatan dari Klien
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedSubmission.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            {selectedSubmission.status === 'pending' && (
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="danger"
                  icon={<FiX />}
                  onClick={() => {
                    setShowDetailModal(false);
                    handleOpenReject(selectedSubmission);
                  }}
                >
                  Tolak
                </Button>
                <Button
                  variant="success"
                  icon={<FiCheck />}
                  onClick={() => {
                    setShowDetailModal(false);
                    handleOpenConfirm(selectedSubmission);
                  }}
                >
                  Konfirmasi
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm Modal - Enhanced Like AddBookingModal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Konfirmasi Booking"
        size="xl"
      >
        {selectedSubmission && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
            
            {/* Booking Name - Editable with Dropdown */}
            <div className="relative" ref={bookingNameDropdownRef}>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FiFileText className="text-purple-500" />
                Nama Booking <span className="text-gray-400 text-xs font-normal">(Opsional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={confirmData.booking_name}
                  onChange={(e) => {
                    console.log('Booking name input changed:', e.target.value);
                    setConfirmData(prev => ({ ...prev, booking_name: e.target.value }));
                    setShowBookingNameDropdown(true);
                  }}
                  onFocus={() => {
                    console.log('Booking name input focused');
                    console.log('Current booking_name:', confirmData.booking_name);
                    console.log('Available bookingNames:', bookingNames);
                    console.log('Filtered names:', filteredBookingNames);
                    setShowBookingNameDropdown(true);
                  }}
                  placeholder="Contoh: Pernikahan Andi & Sari, Acara Perusahaan..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {confirmData.booking_name && (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmData(prev => ({ ...prev, booking_name: '' }));
                      setShowBookingNameDropdown(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX size={18} />
                  </button>
                )}
              </div>

              {/* Dropdown suggestions - FIXED: Always show when focused and has data */}
              {showBookingNameDropdown && bookingNames.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <div className="p-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs text-gray-600 font-medium">
                      {filteredBookingNames.length > 0 
                        ? 'Pilih dari nama booking sebelumnya:' 
                        : 'Tidak ada hasil pencarian'}
                    </p>
                  </div>
                  {filteredBookingNames.length > 0 ? filteredBookingNames.map((name, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleBookingNameSelect(name)}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors text-sm text-gray-700 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <FiFileText size={14} className="text-purple-500 flex-shrink-0" />
                        <span className="truncate">{name}</span>
                      </div>
                    </button>
                  )) : (
                    <div className="px-4 py-3 text-center text-gray-500 text-sm">
                      Tidak ada nama booking yang cocok
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                💡 Ketik nama booking baru atau pilih dari yang sudah ada
              </p>
            </div>

            {/* Client Information - With Dropdown Selection */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiUser className="text-blue-500" /> Informasi Klien
              </h3>
              
              {/* Client Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pilih Klien
                </label>
                
                <div className="relative" ref={clientDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowClientDropdown(!showClientDropdown)}
                    className="w-full px-3 py-2.5 text-left bg-white border border-gray-300 rounded-lg hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors flex items-center justify-between"
                  >
                    <span className={confirmData.client_name ? 'text-gray-900' : 'text-gray-400'}>
                      {confirmData.client_name || 'Pilih klien dari daftar atau gunakan data dari submission'}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showClientDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowClientDropdown(false)}
                      />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                        {/* Search Input */}
                        <div className="p-2 border-b border-gray-100">
                          <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              value={clientSearch}
                              onChange={(e) => setClientSearch(e.target.value)}
                              placeholder="Cari klien..."
                              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>

                        {/* Client List */}
                        <div className="max-h-60 overflow-y-auto">
                          {clients.filter(c => 
                            c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
                            (c.phone && c.phone.includes(clientSearch))
                          ).length > 0 ? (
                            clients.filter(c => 
                              c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
                              (c.phone && c.phone.includes(clientSearch))
                            ).map(client => (
                              <div
                                key={client.id}
                                className="hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmData(prev => ({
                                      ...prev,
                                      client_name: client.name,
                                      client_phone: client.phone || client.contact || '',
                                      client_address: client.address || '',
                                    }));
                                    setShowClientDropdown(false);
                                    setClientSearch('');
                                  }}
                                  className="w-full px-3 py-2 text-left flex items-center justify-between"
                                >
                                  <div className="flex-1 min-w-0 pr-3">
                                    <div className="text-sm font-medium text-gray-900 truncate">{client.name}</div>
                                    {client.phone && (
                                      <div className="text-xs text-gray-500 mt-0.5 truncate">{client.phone}</div>
                                    )}
                                    {client.address && (
                                      <div className="text-xs text-gray-400 mt-0.5 truncate">{client.address}</div>
                                    )}
                                  </div>
                                  {confirmData.client_name === client.name && (
                                    <FiCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                  )}
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-8 text-center text-gray-500 text-sm">
                              Tidak ada klien ditemukan
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  💡 Pilih dari daftar klien atau gunakan data dari submission
                </p>
              </div>

              {/* Editable Client Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Klien <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={confirmData.client_name}
                    onChange={(e) => setConfirmData(prev => ({ ...prev, client_name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.client_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.client_name && <p className="text-red-500 text-xs mt-1">{errors.client_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Telepon <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <FiPhone className="text-gray-400" />
                    <input
                      type="text"
                      value={confirmData.client_phone}
                      onChange={(e) => {
                        const cleaned = formatPhoneNumber(e.target.value);
                        setConfirmData(prev => ({ ...prev, client_phone: cleaned }));
                      }}
                      placeholder="081234567890"
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.client_phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.client_phone && <p className="text-red-500 text-xs mt-1">{errors.client_phone}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat
                  </label>
                  <textarea
                    value={confirmData.client_address}
                    onChange={(e) => setConfirmData(prev => ({ ...prev, client_address: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Booking Details - Editable */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiCalendar className="text-blue-500" /> Detail Booking
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Mulai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={confirmData.booking_date}
                    onChange={(e) => setConfirmData(prev => ({ ...prev, booking_date: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.booking_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.booking_date && <p className="text-red-500 text-xs mt-1">{errors.booking_date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={confirmData.booking_date_end}
                    onChange={(e) => setConfirmData(prev => ({ ...prev, booking_date_end: e.target.value }))}
                    min={confirmData.booking_date}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waktu Mulai
                  </label>
                  <input
                    type="time"
                    value={confirmData.booking_time}
                    onChange={(e) => setConfirmData(prev => ({ ...prev, booking_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waktu Selesai
                  </label>
                  <input
                    type="time"
                    value={confirmData.booking_time_end}
                    onChange={(e) => setConfirmData(prev => ({ ...prev, booking_time_end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {confirmData.booking_days > 1 && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 flex items-center gap-2">
                    <FiCalendar size={14} />
                    Durasi: <strong>{confirmData.booking_days} hari</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Location - Editable */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiMapPin className="text-blue-500" /> Lokasi
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lokasi
                  </label>
                  <input
                    type="text"
                    value={confirmData.location_name}
                    onChange={(e) => setConfirmData(prev => ({ ...prev, location_name: e.target.value }))}
                    placeholder="Contoh: Gedung ABC, Ballroom Lt. 2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link Google Maps
                  </label>
                  <input
                    type="url"
                    value={confirmData.location_map_url}
                    onChange={(e) => setConfirmData(prev => ({ ...prev, location_map_url: e.target.value }))}
                    placeholder="https://maps.google.com/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Services with editable prices - Minimalist Design with Dropdown */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FiPackage className="text-blue-500" /> Layanan & Harga
                </h3>
                <button
                  type="button"
                  onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                >
                  <FiPlus size={16} /> Tambah Layanan
                </button>
              </div>

              {/* Service Dropdown */}
              {showServiceDropdown && (
                <div ref={serviceDropdownRef} className="mb-3 relative">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      placeholder="Cari layanan..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {allServices
                      .filter(s => 
                        s.name.toLowerCase().includes(serviceSearch.toLowerCase()) &&
                        !confirmData.services.find(cs => cs.service_id === s.id)
                      )
                      .map(service => (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => addService(service)}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 text-sm border-b border-gray-100 last:border-0"
                        >
                          <div className="font-medium text-gray-800">{service.name}</div>
                          <div className="text-xs text-gray-500">Rp {formatCurrency(service.default_price || 0)}</div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Services List - Same layout as AddBookingModal */}
              <div className="space-y-3">
                {confirmData.services.map((service, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                    {/* Header with service name and delete button */}
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-gray-900">{service.service_name || service.name}</p>
                      <button
                        type="button"
                        onClick={() => removeService(idx)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Hapus layanan"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>

                    {/* Service Description Box - Blue background like AddBookingModal */}
                    {service.description && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            Deskripsi Layanan:
                          </div>
                          <div className="text-sm text-blue-600 mt-1">
                            {service.description}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Service Details - Same layout as AddBookingModal */}
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                      {/* Harga Layanan */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Harga Layanan (Rp)</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={
                              service.custom_price === 0 
                                ? '' 
                                : (service.custom_price || '').toLocaleString('id-ID')
                            }
                            onChange={(e) => {
                              const value = e.target.value.replace(/\./g, '');
                              updateServicePrice(idx, value);
                            }}
                            onFocus={(e) => {
                              if (e.target.value === '0') e.target.value = '';
                            }}
                            className="w-32 text-right rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Jumlah Yang Di Pesan */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Jumlah Yang Di Pesan</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const currentQty = service.quantity || 1;
                              updateServiceQuantity(idx, Math.max(1, currentQty - 1));
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
                            title="Kurangi jumlah"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={service.quantity && service.quantity !== 1 ? service.quantity : ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                updateServiceQuantity(idx, undefined);
                              } else {
                                const numValue = parseInt(value) || 1;
                                updateServiceQuantity(idx, Math.max(1, numValue));
                              }
                            }}
                            onBlur={(e) => {
                              if (!service.quantity || service.quantity < 1) {
                                updateServiceQuantity(idx, 1);
                              }
                            }}
                            min="1"
                            placeholder="1"
                            className="w-16 text-center rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const currentQty = service.quantity || 1;
                              updateServiceQuantity(idx, currentQty + 1);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
                            title="Tambah jumlah"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Subtotal Display */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-sm font-medium text-gray-700">Subtotal</span>
                        <span className="font-semibold text-blue-600">
                          Rp {((service.custom_price || 0) * (service.quantity || 1)).toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* Penanggung Jawab Layanan */}
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-sm text-gray-700">Penanggung Jawab Layanan</span>
                        <div className="flex items-center gap-2">
                          {/* Button to toggle dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                const newShow = [...(showServiceResponsiblePartyDropdown || [])];
                                newShow[idx] = !newShow[idx];
                                setShowServiceResponsiblePartyDropdown(newShow);
                              }}
                              className="w-40 px-2 py-1.5 text-left bg-white border border-gray-300 rounded-lg hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors text-xs flex items-center justify-between"
                            >
                              <span className={confirmData.service_responsible_parties[idx] ? 'text-gray-900' : 'text-gray-400'}>
                                {confirmData.service_responsible_parties[idx] 
                                  ? responsibleParties.find(p => p.id === parseInt(confirmData.service_responsible_parties[idx]))?.name || 'Tidak ditemukan'
                                  : 'Pilih...'
                                }
                              </span>
                              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {/* Dropdown with search */}
                            {showServiceResponsiblePartyDropdown && showServiceResponsiblePartyDropdown[idx] && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => {
                                    const newShow = [...showServiceResponsiblePartyDropdown];
                                    newShow[idx] = false;
                                    setShowServiceResponsiblePartyDropdown(newShow);
                                  }}
                                />
                                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                                  {/* Search input */}
                                  <div className="p-1.5 border-b border-gray-100">
                                    <div className="relative">
                                      <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                                      <input
                                        type="text"
                                        value={(serviceResponsiblePartySearch || [])[idx] || ''}
                                        onChange={(e) => {
                                          const newSearch = [...(serviceResponsiblePartySearch || [])];
                                          newSearch[idx] = e.target.value;
                                          setServiceResponsiblePartySearch(newSearch);
                                        }}
                                        placeholder="Cari penanggung jawab..."
                                        className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  </div>

                                  {/* Party list */}
                                  <div className="max-h-40 overflow-y-auto">
                                    {responsibleParties
                                      .filter(p => 
                                        !serviceResponsiblePartySearch?.[idx] ||
                                        p.name.toLowerCase().includes((serviceResponsiblePartySearch[idx] || '').toLowerCase()) ||
                                        (p.phone && p.phone.includes(serviceResponsiblePartySearch[idx] || ''))
                                      )
                                      .map(party => (
                                        <div key={party.id} className="hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              updateServiceResponsibleParty(idx, party.id.toString());
                                              const newShow = [...showServiceResponsiblePartyDropdown];
                                              newShow[idx] = false;
                                              setShowServiceResponsiblePartyDropdown(newShow);
                                            }}
                                            className="w-full px-2 py-1.5 text-left flex items-center justify-between"
                                          >
                                            <div className="flex-1 min-w-0">
                                              <div className="text-xs font-medium text-gray-800 truncate">{party.name}</div>
                                              {party.phone && (
                                                <div className="text-xs text-gray-500 truncate">{party.phone}</div>
                                              )}
                                            </div>
                                            {confirmData.service_responsible_parties[idx] == party.id && (
                                              <FiCheck className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                            )}
                                          </button>
                                        </div>
                                      ))
                                    }
                                  </div>

                                  {/* Clear selection option */}
                                  {confirmData.service_responsible_parties[idx] && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateServiceResponsibleParty(idx, '');
                                        const newShow = [...showServiceResponsiblePartyDropdown];
                                        newShow[idx] = false;
                                        setShowServiceResponsiblePartyDropdown(newShow);
                                      }}
                                      className="w-full px-2 py-1.5 text-left border-t border-gray-100 bg-gray-50 hover:bg-gray-100 text-xs text-gray-600"
                                    >
                                      Hapus pilihan
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* End of service details */}
                  </div>
                ))}

                {confirmData.services.length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    <FiPackage size={32} className="mx-auto mb-2 opacity-30" />
                    <p>Belum ada layanan dipilih</p>
                    <p className="text-xs mt-1">Klik "Tambah Layanan" untuk menambahkan</p>
                  </div>
                )}
              </div>
              
              {confirmData.booking_days > 1 && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    💡 Harga akan dikalikan dengan durasi booking ({confirmData.booking_days} hari)
                  </p>
                </div>
              )}
            </div>

            {/* Global Responsible Parties */}
            <div className="relative" ref={responsiblePartyDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Penanggung Jawab Utama (Opsional)
              </label>
              
              {/* Selected parties */}
              {confirmData.responsible_parties.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {confirmData.responsible_parties.map(party => (
                    <span key={party.id} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {party.name}
                      <button
                        type="button"
                        onClick={() => handleResponsiblePartyToggle(party)}
                        className="hover:text-blue-600"
                      >
                        <FiX size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* Search input */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={responsiblePartySearch}
                  onChange={(e) => setResponsiblePartySearch(e.target.value)}
                  onFocus={() => setShowResponsiblePartyDropdown(true)}
                  placeholder="Cari penanggung jawab..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Dropdown */}
              {showResponsiblePartyDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredResponsibleParties.length === 0 ? (
                    <p className="p-3 text-sm text-gray-500">Tidak ada penanggung jawab</p>
                  ) : (
                    filteredResponsibleParties.map(party => {
                      const isSelected = confirmData.responsible_parties.some(p => p.id === party.id);
                      return (
                        <div
                          key={party.id}
                          onClick={() => handleResponsiblePartyToggle(party)}
                          className={`px-4 py-2 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div>
                            <p className="font-medium text-gray-800">{party.name}</p>
                            <p className="text-xs text-gray-500">{party.phone}</p>
                          </div>
                          {isSelected && <FiCheck className="text-blue-500" />}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Payment Section */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status Pembayaran
                </label>
                <select
                  value={confirmData.payment_status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    setConfirmData(prev => {
                      let newAmountPaid = prev.amount_paid;
                      // Auto-fill for Lunas status
                      if (newStatus === 'Lunas') {
                        newAmountPaid = totalAmount;
                      }
                      // Reset to 0 for Belum Bayar
                      if (newStatus === 'Belum Bayar') {
                        newAmountPaid = 0;
                      }
                      return { ...prev, payment_status: newStatus, amount_paid: newAmountPaid };
                    });
                  }}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Belum Bayar">Belum Bayar</option>
                  <option value="DP">Down Payment (DP)</option>
                  <option value="Lunas">Lunas</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sudah Dibayar (Rp)
                </label>
                <input
                  type="text"
                  value={confirmData.amount_paid === 0 ? '' : formatCurrencyInput(confirmData.amount_paid)}
                  onChange={(e) => {
                    const value = parseCurrencyInput(e.target.value);
                    
                    // Validate DP limit (max 90% of total)
                    if (confirmData.payment_status === 'DP') {
                      const maxDP = Math.floor(totalAmount * 0.9);
                      if (value > maxDP) {
                        setErrors(prev => ({
                          ...prev,
                          amount_paid: `DP maksimal 90% dari total (Rp ${formatCurrencyInput(maxDP)})`
                        }));
                        return;
                      }
                    }
                    
                    setErrors(prev => ({ ...prev, amount_paid: '' }));
                    setConfirmData(prev => ({ ...prev, amount_paid: value }));
                  }}
                  placeholder="0"
                  disabled={confirmData.payment_status === 'Belum Bayar' || confirmData.payment_status === 'Lunas'}
                  className={`block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 focus:outline-none ${
                    confirmData.payment_status === 'Belum Bayar' || confirmData.payment_status === 'Lunas' ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                />
                {confirmData.payment_status === 'Belum Bayar' && (
                  <p className="mt-1 text-xs text-orange-600">Ubah status pembayaran untuk mengisi</p>
                )}
                {confirmData.payment_status === 'DP' && (
                  <p className="mt-1 text-xs text-blue-600">
                    Maksimal 90% dari total keseluruhan (Rp {formatCurrencyInput(Math.floor(totalAmount * 0.9))})
                  </p>
                )}
                {confirmData.payment_status === 'Lunas' && (
                  <p className="mt-1 text-xs text-green-600">Otomatis terisi dengan total keseluruhan karena status lunas</p>
                )}
                {errors.amount_paid && (
                  <p className="mt-1 text-xs text-red-600">{errors.amount_paid}</p>
                )}
              </div>
            </div>

            {/* Discount Section - Two Inputs Like AddBookingModal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diskon
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={confirmData.discount_type === 'rupiah' && confirmData.discount_value > 0 ? formatCurrencyInput(confirmData.discount_value) : ''}
                      onChange={(e) => {
                        const value = parseCurrencyInput(e.target.value);
                        // Validate: discount rupiah cannot exceed originalSubtotal
                        if (value > originalSubtotal) {
                          setErrors(prev => ({ ...prev, discount: `Diskon rupiah maksimal Rp ${formatCurrencyInput(originalSubtotal)}` }));
                          return;
                        }
                        setErrors(prev => ({ ...prev, discount: '' }));
                        setConfirmData(prev => ({ ...prev, discount_value: value, discount_type: 'rupiah' }));
                      }}
                      placeholder="0"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">Rupiah (Rp)</p>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={confirmData.discount_type === 'persen' && confirmData.discount_value > 0 ? confirmData.discount_value : ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        // Validate: percentage cannot exceed 100%
                        if (value > 100) {
                          setErrors(prev => ({ ...prev, discount: 'Diskon persen maksimal 100%' }));
                          return;
                        }
                        setErrors(prev => ({ ...prev, discount: '' }));
                        setConfirmData(prev => ({ ...prev, discount_value: value, discount_type: 'persen' }));
                      }}
                      placeholder="0"
                      min="0"
                      max="100"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">Persen (%)</p>
                  </div>
                </div>
                {errors.discount && (
                  <p className="mt-1 text-xs text-red-600">{errors.discount}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PPN (%)
                </label>
                <input
                  type="number"
                  value={confirmData.tax_percentage === 0 ? '' : confirmData.tax_percentage}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setConfirmData(prev => ({ ...prev, tax_percentage: Math.min(100, Math.max(0, value)) }));
                  }}
                  placeholder="0"
                  min="0"
                  max="100"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Additional Fees */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  <FiDollarSign className="inline mr-1" /> Biaya Tambahan
                </label>
                <button
                  type="button"
                  onClick={addAdditionalFee}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <FiPlus size={14} /> Tambah Biaya
                </button>
              </div>
              
              {confirmData.additional_fees.length > 0 && (
                <div className="space-y-2">
                  {confirmData.additional_fees.map((fee, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={fee.description}
                        onChange={(e) => updateAdditionalFee(idx, 'description', e.target.value)}
                        placeholder="Deskripsi biaya"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="relative w-36">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                        <input
                          type="text"
                          value={formatCurrencyInput(fee.amount)}
                          onChange={(e) => updateAdditionalFee(idx, 'amount', e.target.value)}
                          onFocus={(e) => {
                            if (fee.amount === 0 || fee.amount === '0') {
                              updateAdditionalFee(idx, 'amount', '');
                            }
                          }}
                          placeholder="0"
                          className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAdditionalFee(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes Section - Single Editable Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FiFileText className="text-gray-600" /> Catatan Booking
                <span className="text-gray-400 text-xs font-normal">(Opsional - bisa diedit)</span>
              </label>
              <textarea
                value={confirmData.notes}
                onChange={(e) => setConfirmData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Masukkan catatan untuk booking ini...&#10;(Catatan dari klien akan otomatis muncul di sini dan bisa Anda edit)"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Catatan dari klien sudah dimasukkan otomatis, Anda bisa mengedit atau menambah informasi
              </p>
            </div>

            {/* Google Calendar Sync */}
            {isGoogleCalendarConnected && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="syncGoogleCalendar"
                  checked={confirmData.sync_to_google_calendar}
                  onChange={(e) => setConfirmData(prev => ({ ...prev, sync_to_google_calendar: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="syncGoogleCalendar" className="text-sm text-gray-700 flex items-center gap-2">
                  <FiCalendar className="text-blue-500" />
                  Sinkronkan ke Google Calendar
                </label>
              </div>
            )}

            {/* Rincian Biaya - Detailed like EditBookingModal */}
            <div className="p-4 bg-white border-2 border-blue-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Rincian Biaya</h4>
              
              {/* Booking Schedule Info */}
              {confirmData.booking_date && confirmData.booking_time && (
                <div className="mb-3 pb-3 border-b border-blue-200 bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Jadwal Booking:</p>
                  {confirmData.booking_date_end && confirmData.booking_days > 1 ? (
                    // Multi-day booking: Show start and end dates/times separately
                    <div className="space-y-1">
                      <p className="text-xs text-blue-700">
                        <span className="font-medium">Mulai:</span>{' '}
                        {new Date(confirmData.booking_date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}{' '}
                        - {confirmData.booking_time}
                      </p>
                      <p className="text-xs text-blue-700">
                        <span className="font-medium">Selesai:</span>{' '}
                        {new Date(confirmData.booking_date_end).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}{' '}
                        - {confirmData.booking_time_end}
                      </p>
                      <p className="text-xs text-blue-600 font-semibold mt-2">
                        Total: {confirmData.booking_days} hari
                      </p>
                    </div>
                  ) : (
                    // Single-day booking: Show date with time range
                    <div className="space-y-1">
                      <p className="text-xs text-blue-700">
                        <span className="font-medium">Tanggal:</span>{' '}
                        {new Date(confirmData.booking_date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-blue-700">
                        <span className="font-medium">Waktu:</span> {confirmData.booking_time} - {confirmData.booking_time_end}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Services Breakdown - Show each service with description */}
              <div className="space-y-1.5 mb-3 pb-3 border-b border-gray-200">
                {confirmData.services.map((service, index) => {
                  const price = parseFloat(service.custom_price || 0);
                  const quantity = service.quantity || 1;
                  const totalPrice = price * quantity;
                  return (
                    <div key={index} className="space-y-0.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-medium">
                          {service.service_name || service.name} {quantity > 1 ? `(×${quantity})` : ''}:
                        </span>
                        <span className="text-gray-900 font-medium">Rp {formatCurrency(totalPrice)}</span>
                      </div>
                      {service.description && (
                        <p className="text-xs text-gray-500 italic ml-2">{service.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Subtotal (1 day) */}
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-700">Total Layanan (1 hari):</span>
                <span className="text-gray-900 font-medium">
                  Rp {formatCurrency(confirmData.services.reduce((sum, s) => {
                    const price = parseFloat(s.custom_price || 0);
                    const quantity = s.quantity || 1;
                    return sum + (price * quantity);
                  }, 0))}
                </span>
              </div>

              {/* Multiply by days */}
              {confirmData.booking_days > 1 && (
                <div className="flex justify-between text-sm mb-1.5 text-blue-600">
                  <span>× {confirmData.booking_days} hari:</span>
                  <span className="font-medium">
                    Rp {formatCurrency(originalSubtotal)}
                  </span>
                </div>
              )}

              {/* Discount */}
              {confirmData.discount_value > 0 && (
                <div className="flex justify-between text-sm mb-1.5 text-green-600">
                  <span>Diskon {confirmData.discount_type === 'persen' ? `(${confirmData.discount_value}%)` : ''}:</span>
                  <span className="font-medium">- Rp {formatCurrency((() => {
                    let discountAmount = 0;
                    if (confirmData.discount_type === 'persen') {
                      discountAmount = (originalSubtotal * confirmData.discount_value) / 100;
                    } else {
                      discountAmount = confirmData.discount_value;
                    }
                    return discountAmount;
                  })())}</span>
                </div>
              )}

              {/* Subtotal after discount */}
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-700">Subtotal:</span>
                <span className="text-gray-900 font-medium">
                  Rp {formatCurrency(subtotalAmount)}
                </span>
              </div>

              {/* Tax */}
              {confirmData.tax_percentage > 0 && (
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-700">PPN ({confirmData.tax_percentage}%):</span>
                  <span className="text-gray-900 font-medium">
                    Rp {formatCurrency(subtotalAmount * confirmData.tax_percentage / 100)}
                  </span>
                </div>
              )}

              {/* Additional Fees */}
              {confirmData.additional_fees.length > 0 && confirmData.additional_fees.some(f => f.amount > 0) && (
                <div className="space-y-1.5 mb-3 pb-3 border-b border-gray-200">
                  {confirmData.additional_fees.map((fee, index) => {
                    if (!fee.amount || fee.amount === 0) return null;
                    return (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">{fee.description || 'Biaya Tambahan'}:</span>
                        <span className="text-gray-900 font-medium">Rp {formatCurrency(parseFloat(fee.amount))}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-center pt-3 border-t-2 border-blue-200 mb-3">
                <span className="text-base font-semibold text-gray-900">Total Keseluruhan:</span>
                <span className="text-xl font-bold text-blue-600">
                  Rp {formatCurrency(totalAmount)}
                </span>
              </div>

              {/* Payment Status */}
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-700">Sudah Dibayar:</span>
                <span className="text-gray-900 font-medium">Rp {formatCurrency(confirmData.amount_paid)}</span>
              </div>

              {/* Remaining Amount */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">Sisa Pembayaran:</span>
                <span className={`text-base font-bold ${
                  Math.max(0, totalAmount - confirmData.amount_paid) > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  Rp {formatCurrency(Math.max(0, totalAmount - confirmData.amount_paid))}
                </span>
              </div>
            </div>

            {/* Google Calendar Sync */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isGoogleCalendarConnected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <FiCalendar className={`w-5 h-5 ${isGoogleCalendarConnected ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Sinkronkan ke Google Calendar</h4>
                    <p className="text-sm text-gray-500">
                      {isCheckingGoogleCalendar ? (
                        'Memeriksa koneksi...'
                      ) : isGoogleCalendarConnected ? (
                        'Buat event booking di Google Calendar Anda'
                      ) : (
                        'Hubungkan Google Calendar terlebih dahulu'
                      )}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmData.sync_to_google_calendar}
                    onChange={(e) => setConfirmData(prev => ({ ...prev, sync_to_google_calendar: e.target.checked }))}
                    disabled={!isGoogleCalendarConnected || isCheckingGoogleCalendar}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 
                    ${isGoogleCalendarConnected ? 'bg-gray-200 peer-checked:bg-blue-600' : 'bg-gray-300 cursor-not-allowed'}
                    after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 
                    after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full`}>
                  </div>
                </label>
              </div>
              {confirmData.sync_to_google_calendar && isGoogleCalendarConnected && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-700 flex items-center gap-1">
                    <FiCheck className="w-3 h-3" />
                    Event akan dibuat di Google Calendar setelah booking dikonfirmasi
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white py-4">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
              >
                Batal
              </Button>
              <Button
                variant="success"
                icon={<FiCheck />}
                onClick={handleConfirmSubmission}
                disabled={processing}
              >
                {processing ? 'Memproses...' : 'Konfirmasi Booking'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Tolak Submission"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Yakin ingin menolak submission dari <strong>{selectedSubmission?.client_name}</strong>?
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alasan Penolakan (Opsional)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Jelaskan alasan penolakan..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              icon={<FiX />}
              onClick={handleRejectSubmission}
              disabled={processing}
            >
              {processing ? 'Memproses...' : 'Tolak Submission'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Link & QR Modal */}
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
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Link Booking</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={bookingLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <Button
                variant={linkCopied ? 'success' : 'outline'}
                icon={linkCopied ? <FiCheck /> : <FiCopy />}
                onClick={copyLink}
              >
                {linkCopied ? 'Disalin!' : 'Salin'}
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex justify-center gap-3">
            <a
              href={`https://wa.me/?text=Silakan booking melalui link berikut: ${encodeURIComponent(bookingLink)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <FiShare2 size={16} />
              Share via WhatsApp
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientSubmissionsPage;
