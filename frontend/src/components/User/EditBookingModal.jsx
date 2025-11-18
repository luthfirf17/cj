import React, { useState, useEffect, useRef } from 'react';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Select from '../Common/Select';
import TextArea from '../Common/TextArea';
import CountryCodeDropdown from '../Common/CountryCodeDropdown';
import { FiDollarSign, FiTrash2, FiPlus, FiSearch, FiCheck, FiEdit2, FiX, FiMapPin, FiMinus, FiUser, FiMessageCircle, FiChevronDown } from 'react-icons/fi';
import { formatPhoneForWhatsApp } from '../../utils/phoneUtils';
import api from '../../services/api';

const EditBookingModal = ({ isOpen, onClose, onSuccess, bookingId }) => {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [responsibleParties, setResponsibleParties] = useState([]);
  const [serviceResponsibleParties, setServiceResponsibleParties] = useState([]);
  const [showResponsiblePartiesDropdown, setShowResponsiblePartiesDropdown] = useState(false);
  const [showAddResponsiblePartyModal, setShowAddResponsiblePartyModal] = useState(false);
  const [showEditResponsiblePartyModal, setShowEditResponsiblePartyModal] = useState(false);
  const [editingResponsibleParty, setEditingResponsibleParty] = useState(null);
  const [responsiblePartySearch, setResponsiblePartySearch] = useState('');
  const [responsiblePartyModalData, setResponsiblePartyModalData] = useState({
    id: null,
    name: '',
    phone: '',
    countryCode: '62', // Default Indonesia
    address: '',
  });
  const [formData, setFormData] = useState({
    client_name: '',
    contact: '',
    address: '',
    booking_date: '',
    booking_date_end: '',
    booking_time: '',
    booking_time_end: '',
    booking_days: 1,
    service_mode: 'single', // single or multiple
    selected_services: [{ service_id: '', custom_price: 0, quantity: 1, responsible_party_id: null }],
    location_name: '',
    location_map_url: '',
    status: 'Dijadwalkan',
    payment_status: 'Belum Bayar',
    total_amount: 0,
    amount_paid: 0,
    discount_value: 0, // Changed from discount
    discount_type: 'rupiah', // 'rupiah' or 'persen'
    tax_percentage: 0,
    additional_fees: [],
    notes: '',
    responsible_parties: [], // Array of {id, name, phone, address}
  });

  const [serviceSearch, setServiceSearch] = useState(['']);
  const [serviceResponsiblePartySearch, setServiceResponsiblePartySearch] = useState(['']); // Array for service responsible party searches
  const [showServiceDropdown, setShowServiceDropdown] = useState([false]);
  const [showServiceResponsiblePartyDropdown, setShowServiceResponsiblePartyDropdown] = useState([false]); // Array for service responsible party dropdowns
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);
  const [activeServiceResponsiblePartyDropdownIndex, setActiveServiceResponsiblePartyDropdownIndex] = useState(null);
  
  // Multiple Services Selection State
  const [multipleSelectedServices, setMultipleSelectedServices] = useState([]);
  
  // Client Dropdown State
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  
  // Add Service Modal State
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceData, setNewServiceData] = useState({
    name: '',
    description: '',
    default_price: 0,
  });

  // Edit Service Modal State
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [editServiceData, setEditServiceData] = useState({
    id: null,
    name: '',
    description: '',
    default_price: 0,
  });

  const [errors, setErrors] = useState({});
  const dropdownRefs = useRef([]);
  const serviceResponsiblePartyDropdownRefs = useRef([]);
  const clientDropdownRef = useRef(null);

  // Subtotal state for display purposes
  const [subtotalAmount, setSubtotalAmount] = useState(0);
  const [originalSubtotal, setOriginalSubtotal] = useState(0); // Before discount

  // Fetch booking detail and services
  useEffect(() => {
    if (isOpen && bookingId) {
      // Fetch all data first, then booking detail
      const loadData = async () => {
        setLoading(true);
        const servicesList = await fetchServices();
        await fetchResponsibleParties();
        await fetchServiceResponsibleParties();
        await fetchBookingDetail(servicesList);
        setLoading(false);
      };
      loadData();
    }
  }, [isOpen, bookingId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        client_name: '',
        contact: '',
        address: '',
        booking_date: '',
        booking_date_end: '',
        booking_time: '',
        booking_time_end: '',
        booking_days: 1,
        service_mode: 'single',
        selected_services: [{ service_id: '', custom_price: 0, quantity: 1, responsible_party_id: null }],
        location_name: '',
        location_map_url: '',
        status: 'Dijadwalkan',
        payment_status: 'Belum Bayar',
        total_amount: 0,
        amount_paid: 0,
        discount_value: 0,
        discount_type: 'rupiah',
        tax_percentage: 0,
        additional_fees: [],
        notes: '',
        responsible_parties: [],
      });
      setServiceSearch(['']);
      setServiceResponsiblePartySearch(['']);
      setShowServiceDropdown([false]);
      setShowServiceResponsiblePartyDropdown([false]);
      setActiveDropdownIndex(null);
      setActiveServiceResponsiblePartyDropdownIndex(null);
      setMultipleSelectedServices([]);
      setClientSearch('');
      setShowClientDropdown(false);
      setResponsiblePartySearch('');
      setShowResponsiblePartiesDropdown(false);
      setShowAddResponsiblePartyModal(false);
      setShowEditResponsiblePartyModal(false);
      setEditingResponsibleParty(null);
      setResponsiblePartyModalData({
        id: null,
        name: '',
        phone: '',
        countryCode: '62',
        address: '',
      });
      setShowAddServiceModal(false);
      setNewServiceData({
        name: '',
        description: '',
        default_price: 0,
      });
      setShowEditServiceModal(false);
      setEditServiceData({
        id: null,
        name: '',
        description: '',
        default_price: 0,
      });
      setShowAddResponsiblePartyModal(false);
      setShowEditResponsiblePartyModal(false);
      setResponsiblePartyModalData({
        id: null,
        name: '',
        phone: '',
        countryCode: '62',
        address: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  const fetchBookingDetail = async (servicesList = []) => {
    try {
      const response = await api.get(`/user/bookings/${bookingId}`);
      
      if (response.data.success) {
        const booking = response.data.data;
        
        console.log('📥 Fetched booking detail:', {
          id: booking.id,
          service_id: booking.service_id,
          service_name: booking.service_name,
          notes: booking.notes?.substring(0, 100),
          availableServices: servicesList.length
        });
        
        // Convert status from English to Indonesian
        let displayStatus = 'Dijadwalkan';
        if (booking.status === 'completed') displayStatus = 'Selesai';
        else if (booking.status === 'cancelled') displayStatus = 'Dibatalkan';
        else if (booking.status === 'confirmed') displayStatus = 'Dijadwalkan';
        
        // Convert payment_status to Indonesian
        let displayPaymentStatus = 'Belum Bayar';
        if (booking.payment_status === 'paid') displayPaymentStatus = 'Lunas';
        else if (booking.payment_status === 'partial') displayPaymentStatus = 'DP';
        
        // Parse booking details from notes if JSON format
        let bookingDetails = null;
        let userNotes = '';
        try {
          if (booking.notes && booking.notes.trim().startsWith('{')) {
            bookingDetails = JSON.parse(booking.notes);
            userNotes = bookingDetails.user_notes || ''; // Extract user notes from JSON
          } else {
            userNotes = booking.notes || ''; // Use as plain text if not JSON
          }
        } catch (parseError) {
          console.log('Notes is not JSON format, using as plain text');
          userNotes = booking.notes || '';
        }
        
        // Determine selected services
        let selectedServices = [];
        
        if (bookingDetails?.services && Array.isArray(bookingDetails.services) && bookingDetails.services.length > 0) {
          // New format: services array in booking_details
          selectedServices = bookingDetails.services.map(s => ({
            service_id: s.service_id?.toString() || '',
            custom_price: parseFloat(s.custom_price) || 0,
            quantity: parseInt(s.quantity) || 1,
            responsible_party_id: s.responsible_party_id ? parseInt(s.responsible_party_id) : null
          }));
        } else if (booking.service_id) {
          // Legacy format: single service_id from booking
          // Ensure service_id exists by checking against fetched services
          const serviceExists = servicesList.find(s => s.id === booking.service_id);
          
          selectedServices = [{ 
            service_id: serviceExists ? booking.service_id.toString() : '', 
            custom_price: parseFloat(booking.total_amount) || 0,
            quantity: 1,
            responsible_party_id: null
          }];
          
          console.log('📝 Legacy booking format detected:', {
            bookingId: booking.id,
            serviceId: booking.service_id,
            serviceName: booking.service_name,
            availableServices: servicesList.map(s => ({id: s.id, name: s.name})),
            serviceExists: !!serviceExists,
            mappedServiceId: selectedServices[0].service_id
          });
          
          if (!serviceExists) {
            console.error('❌ Service ID not found in available services!', {
              requestedServiceId: booking.service_id,
              availableServiceIds: servicesList.map(s => s.id)
            });
          }
        } else {
          // No service information available
          console.warn('⚠️ No service information found in booking:', booking.id);
          selectedServices = [{ service_id: '', custom_price: 0, quantity: 1, responsible_party_id: '' }];
        }

        // Update responsible_party_id for each service using current data
        selectedServices = selectedServices.map(service => {
          if (service.service_id) {
            let responsiblePartyId = service.responsible_party_id;
            
            // If no responsible_party_id from booking, try to find from serviceResponsibleParties
            if (!responsiblePartyId) {
              const serviceResp = serviceResponsibleParties.find(srp => srp.service_id == service.service_id);
              if (serviceResp) {
                responsiblePartyId = serviceResp.responsible_party_id;
              }
            }
            
            // If still no, try to find by name matching (legacy)
            if (!responsiblePartyId) {
              const serviceObj = servicesList.find(s => s.id == service.service_id);
              if (serviceObj) {
                const globalResp = responsibleParties.find(rp => 
                  rp.name && serviceObj.name && serviceObj.name.toLowerCase().includes(rp.name.toLowerCase())
                );
                if (globalResp) {
                  responsiblePartyId = globalResp.id;
                }
              }
            }
            
            return { ...service, responsible_party_id: responsiblePartyId };
          }
          return service;
        });

        // Use parsed details if available, otherwise fall back to legacy format
        setFormData({
          client_name: booking.client_name,
          contact: booking.contact,
          address: booking.address || '',
          booking_date: booking.booking_date,
          booking_date_end: bookingDetails?.booking_date_end || booking.booking_date,
          booking_time: booking.booking_time,
          booking_time_end: bookingDetails?.booking_time_end || booking.booking_time,
          booking_days: bookingDetails?.booking_days || 1,
          service_mode: selectedServices.length > 1 ? 'multiple' : 'single',
          selected_services: selectedServices,
          location_name: booking.location_name || '',
          location_map_url: booking.location_map_url || '',
          status: displayStatus,
          payment_status: displayPaymentStatus,
          total_amount: parseFloat(booking.total_amount) || 0,
          amount_paid: parseFloat(booking.amount_paid) || 0,
          discount_value: bookingDetails?.discount_value || bookingDetails?.discount || 0,
          discount_type: bookingDetails?.discount_type || 'rupiah',
          tax_percentage: bookingDetails?.tax_percentage || 0,
          additional_fees: bookingDetails?.additional_fees || [],
          notes: userNotes, // Use extracted user notes
          responsible_parties: bookingDetails?.responsible_parties || [], // Load existing responsible parties
        });

        // Initialize multiple selected services for checkboxes
        if (selectedServices.length > 1) {
          setMultipleSelectedServices(selectedServices.filter(s => s.service_id).map(s => s.service_id));
        } else {
          setMultipleSelectedServices([]);
        }
      }
    } catch (error) {
      console.error('Error fetching booking detail:', error);
      alert('Gagal memuat detail booking');
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get('/user/services');
      
      if (response.data.success) {
        const servicesList = response.data.data;
        setServices(servicesList);
        console.log('📋 Fetched services:', servicesList.length, 'services', servicesList.map(s => `ID:${s.id} - ${s.name}`));
        return servicesList; // Return for immediate use
      }
      return [];
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdownIndex !== null && 
          dropdownRefs.current[activeDropdownIndex] && 
          !dropdownRefs.current[activeDropdownIndex].contains(event.target)) {
        const newShowDropdown = [...showServiceDropdown];
        newShowDropdown[activeDropdownIndex] = false;
        setShowServiceDropdown(newShowDropdown);
        setActiveDropdownIndex(null);
      }

      // Close service responsible party dropdown
      if (activeServiceResponsiblePartyDropdownIndex !== null && 
          serviceResponsiblePartyDropdownRefs.current[activeServiceResponsiblePartyDropdownIndex] && 
          !serviceResponsiblePartyDropdownRefs.current[activeServiceResponsiblePartyDropdownIndex].contains(event.target)) {
        const newShowDropdown = [...showServiceResponsiblePartyDropdown];
        newShowDropdown[activeServiceResponsiblePartyDropdownIndex] = false;
        setShowServiceResponsiblePartyDropdown(newShowDropdown);
        setActiveServiceResponsiblePartyDropdownIndex(null);
      }

      // Close responsible parties dropdown
      if (showResponsiblePartiesDropdown && 
          !event.target.closest('.responsible-parties-dropdown')) {
        setShowResponsiblePartiesDropdown(false);
        setResponsiblePartySearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdownIndex, activeServiceResponsiblePartyDropdownIndex, showServiceDropdown, showServiceResponsiblePartyDropdown, showResponsiblePartiesDropdown]);

  // Calculate booking days from date range
  useEffect(() => {
    if (formData.booking_date) {
      if (formData.booking_date_end) {
        // If end date is provided, calculate days
        const startDate = new Date(formData.booking_date);
        const endDate = new Date(formData.booking_date_end);
        
        // Calculate difference in days
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end date
        
        setFormData(prev => ({ ...prev, booking_days: diffDays }));
      } else {
        // If end date is not provided, default to 1 day
        setFormData(prev => ({ ...prev, booking_days: 1 }));
      }
    }
  }, [formData.booking_date, formData.booking_date_end]);

  // Calculate subtotal amount (services + discount) for display
  useEffect(() => {
    let subtotal = 0;

    formData.selected_services.forEach(service => {
      if (service.service_id) {
        const serviceData = services.find(s => s.id === parseInt(service.service_id));
        const price = service.custom_price || (serviceData ? serviceData.default_price : 0);
        const quantity = service.quantity || 1;
        subtotal += price * quantity;
      }
    });

    // Multiply by booking days
    const bookingDays = Math.max(1, parseInt(formData.booking_days) || 1);
    subtotal = subtotal * bookingDays;

    setOriginalSubtotal(subtotal);

    // Calculate discount amount
    let discountAmount = 0;
    if (formData.discount_value > 0) {
      if (formData.discount_type === 'persen') {
        discountAmount = (subtotal * formData.discount_value) / 100;
      } else {
        discountAmount = formData.discount_value;
      }
    }

    // Calculate subtotal after discount (this is what should be displayed as "Total Biaya Layanan")
    const subtotalAfterDiscount = subtotal - discountAmount;
    setSubtotalAmount(Math.max(0, subtotalAfterDiscount));
  }, [formData.selected_services, formData.discount_value, formData.discount_type, formData.booking_days, services]);

  // Calculate total amount (grand total including tax and additional fees)
  useEffect(() => {
    // Calculate tax
    const taxAmount = subtotalAmount * (formData.tax_percentage || 0) / 100;

    // Calculate additional fees total
    const additionalFeesTotal = formData.additional_fees.reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);

    // Calculate grand total (this is what should be stored as total_price in database)
    const grandTotal = subtotalAmount + taxAmount + additionalFeesTotal;

    setFormData(prev => ({ ...prev, total_amount: Math.max(0, grandTotal) }));
  }, [subtotalAmount, formData.tax_percentage, formData.additional_fees]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Handle discount inputs
    if (name === 'discount_rupiah') {
      const numValue = parseFloat(value.replace(/\./g, '')) || 0;
      if (numValue > originalSubtotal) {
        setErrors(prev => ({ ...prev, discount: 'Diskon tidak boleh melebihi total biaya layanan' }));
        return;
      }
      setFormData(prev => ({ 
        ...prev, 
        discount_value: numValue,
        discount_type: 'rupiah'
      }));
      if (errors.discount) {
        setErrors(prev => ({ ...prev, discount: '' }));
      }
    } else if (name === 'discount_persen') {
      const numValue = parseFloat(value) || 0;
      if (numValue > 100) {
        setErrors(prev => ({ ...prev, discount: 'Diskon persen tidak boleh melebihi 100%' }));
        return;
      }
      setFormData(prev => ({ 
        ...prev, 
        discount_value: numValue,
        discount_type: 'persen'
      }));
      if (errors.discount) {
        setErrors(prev => ({ ...prev, discount: '' }));
      }
    }

    // Auto-adjust amount_paid based on payment_status
    if (name === 'payment_status') {
      if (value === 'Belum Bayar') {
        // Set amount_paid to 0 if status is "Belum Bayar"
        setFormData(prev => ({ ...prev, amount_paid: 0 }));
      } else if (value === 'Lunas') {
        // Set amount_paid to total_amount if status is "Lunas"
        setFormData(prev => ({ ...prev, amount_paid: prev.total_amount }));
      } else if (value === 'DP') {
        // For DP, ensure amount_paid doesn't exceed 90% of total_amount
        setFormData(prev => {
          const maxDP = Math.floor(prev.total_amount * 0.9);
          return { ...prev, amount_paid: Math.min(prev.amount_paid, maxDP) };
        });
      }
    }

    // Validate amount_paid for DP status
    if (name === 'amount_paid' && formData.payment_status === 'DP') {
      const maxDP = Math.floor(formData.total_amount * 0.9); // 90% of total
      if (parseFloat(value) > maxDP) {
        setErrors(prev => ({ ...prev, amount_paid: `DP maksimal 90% dari total (Rp ${maxDP.toLocaleString('id-ID')})` }));
        return;
      }
    }

    // Handle discount inputs
    if (name === 'discount_rupiah') {
      const numValue = parseFloat(value.replace(/\./g, '')) || 0;
      if (numValue > formData.total_amount) {
        setErrors(prev => ({ ...prev, discount: 'Diskon tidak boleh melebihi total biaya layanan' }));
        return;
      }
      setFormData(prev => ({ 
        ...prev, 
        discount_value: numValue,
        discount_type: 'rupiah'
      }));
      if (errors.discount) {
        setErrors(prev => ({ ...prev, discount: '' }));
      }
    } else if (name === 'discount_persen') {
      const numValue = parseFloat(value) || 0;
      if (numValue > 100) {
        setErrors(prev => ({ ...prev, discount: 'Diskon persen tidak boleh melebihi 100%' }));
        return;
      }
      setFormData(prev => ({ 
        ...prev, 
        discount_value: numValue,
        discount_type: 'persen'
      }));
      if (errors.discount) {
        setErrors(prev => ({ ...prev, discount: '' }));
      }
    }
  };

  // Handle service mode toggle
  const handleServiceModeChange = (mode) => {
    setFormData(prev => ({
      ...prev,
      service_mode: mode,
      selected_services: mode === 'single' ? [{ service_id: prev.selected_services[0]?.service_id || '', custom_price: prev.selected_services[0]?.custom_price || 0, quantity: prev.selected_services[0]?.quantity || 1, responsible_party_id: prev.selected_services[0]?.responsible_party_id || '' }] : [],
    }));
    setMultipleSelectedServices([]);
  };

  // Add new service row
  const addServiceRow = () => {
    setFormData(prev => ({
      ...prev,
      selected_services: [...prev.selected_services, { service_id: '', custom_price: 0, quantity: 1, responsible_party_id: null }],
    }));
    setServiceSearch(prev => [...prev, '']);
    setServiceResponsiblePartySearch(prev => [...prev, '']);
    setShowServiceDropdown(prev => [...prev, false]);
    setShowServiceResponsiblePartyDropdown(prev => [...prev, false]);
  };

  // Remove service row
  const removeServiceRow = (index) => {
    setFormData(prev => ({
      ...prev,
      selected_services: prev.selected_services.filter((_, i) => i !== index),
    }));
    setServiceSearch(prev => prev.filter((_, i) => i !== index));
    setServiceResponsiblePartySearch(prev => prev.filter((_, i) => i !== index));
    setShowServiceDropdown(prev => prev.filter((_, i) => i !== index));
    setShowServiceResponsiblePartyDropdown(prev => prev.filter((_, i) => i !== index));
  };

  // Update service in row
  const updateServiceRow = (index, field, value) => {
    setFormData(prev => {
      const updatedServices = [...prev.selected_services];
      updatedServices[index] = { ...updatedServices[index], [field]: value };
      return { ...prev, selected_services: updatedServices };
    });
  };

  // Handle service responsible party selection
  const handleServiceResponsiblePartySelect = (serviceIndex, partyId) => {
    setFormData(prev => {
      const updatedServices = [...prev.selected_services];
      updatedServices[serviceIndex] = { 
        ...updatedServices[serviceIndex], 
        responsible_party_id: partyId 
      };
      return { ...prev, selected_services: updatedServices };
    });
    
    // Close dropdown
    const newShowDropdown = [...showServiceResponsiblePartyDropdown];
    newShowDropdown[serviceIndex] = false;
    setShowServiceResponsiblePartyDropdown(newShowDropdown);
    setActiveServiceResponsiblePartyDropdownIndex(null);
    
    // Clear search
    const newSearch = [...serviceResponsiblePartySearch];
    newSearch[serviceIndex] = '';
    setServiceResponsiblePartySearch(newSearch);
  };

  // Add additional fee
  const addAdditionalFee = () => {
    setFormData(prev => ({
      ...prev,
      additional_fees: [...prev.additional_fees, { description: '', amount: 0 }],
    }));
  };

  // Remove additional fee
  const removeAdditionalFee = (index) => {
    setFormData(prev => ({
      ...prev,
      additional_fees: prev.additional_fees.filter((_, i) => i !== index),
    }));
  };

  // Update additional fee
  const updateAdditionalFee = (index, field, value) => {
    setFormData(prev => {
      const updatedFees = [...prev.additional_fees];
      updatedFees[index] = { ...updatedFees[index], [field]: value };
      return { ...prev, additional_fees: updatedFees };
    });
  };

  // Handle responsible parties
  const handleResponsiblePartyChange = (partyId, checked) => {
    if (checked) {
      const party = responsibleParties.find(p => p.id === partyId);
      if (party) {
        setFormData(prev => ({
          ...prev,
          responsible_parties: [...prev.responsible_parties, party]
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        responsible_parties: prev.responsible_parties.filter(p => p.id !== partyId)
      }));
    }
  };

  const handleAddResponsibleParty = () => {
    setResponsiblePartyModalData({ id: null, name: '', phone: '', countryCode: '62', address: '' });
    setEditingResponsibleParty(null);
    setShowAddResponsiblePartyModal(true);
    setShowResponsiblePartiesDropdown(false);
    setResponsiblePartySearch('');
  };

  const handleEditResponsibleParty = (party) => {
    // Parse phone number to separate country code and number
    let countryCode = '62';
    let phoneNumber = party.phone;

    // Try to extract country code from phone number
    if (party.phone.startsWith('+')) {
      // Remove + and extract country code
      const phoneWithoutPlus = party.phone.substring(1);
      if (phoneWithoutPlus.startsWith('62')) {
        countryCode = '62';
        phoneNumber = phoneWithoutPlus.substring(2);
      }
    }

    setResponsiblePartyModalData({
      id: party.id,
      name: party.name,
      phone: phoneNumber,
      countryCode: countryCode,
      address: party.address
    });
    setEditingResponsibleParty(party);
    setShowAddResponsiblePartyModal(true);
    setShowResponsiblePartiesDropdown(false);
    setResponsiblePartySearch('');
  };

  const handleSaveResponsibleParty = async () => {
    if (!responsiblePartyModalData.name.trim() || !responsiblePartyModalData.phone.trim()) {
      alert('Nama dan nomor telepon wajib diisi!');
      return;
    }

    try {
      // Format phone number with country code for WhatsApp
      const formattedPhone = formatPhoneForWhatsApp(responsiblePartyModalData.phone, responsiblePartyModalData.countryCode);

      const payload = {
        name: responsiblePartyModalData.name.trim(),
        phone: formattedPhone, // Save formatted phone
        address: responsiblePartyModalData.address.trim()
      };

      let response;
      if (editingResponsibleParty) {
        response = await api.put(`/user/responsible-parties/${editingResponsibleParty.id}`, payload);
      } else {
        response = await api.post('/user/responsible-parties', payload);
      }

      if (response.data.success) {
        alert(editingResponsibleParty ? 'Penanggung jawab berhasil diupdate!' : 'Penanggung jawab berhasil ditambahkan!');
        fetchResponsibleParties();
        setShowAddResponsiblePartyModal(false);
        setResponsiblePartyModalData({ id: null, name: '', phone: '', countryCode: '62', address: '' });
        setEditingResponsibleParty(null);
      }
    } catch (error) {
      console.error('Error saving responsible party:', error);
      alert('Gagal menyimpan penanggung jawab. Silakan coba lagi.');
    }
  };

  const handleDeleteResponsibleParty = async (partyId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus penanggung jawab ini?')) {
      return;
    }

    try {
      const response = await api.delete(`/user/responsible-parties/${partyId}`);

      if (response.data.success) {
        alert('Penanggung jawab berhasil dihapus!');
        fetchResponsibleParties();
        // Remove from selected parties if it was selected
        setFormData(prev => ({
          ...prev,
          responsible_parties: prev.responsible_parties.filter(p => p.id !== partyId)
        }));
      }
    } catch (error) {
      console.error('Error deleting responsible party:', error);
      alert('Gagal menghapus penanggung jawab. Silakan coba lagi.');
    }
  };

  // Fetch responsible parties
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

  // Fetch service responsible parties
  const fetchServiceResponsibleParties = async () => {
    try {
      const response = await api.get('/user/service-responsible-parties');
      if (response.data.success) {
        setServiceResponsibleParties(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching service responsible parties:', error);
    }
  };

  // Filter responsible parties based on search term
  const filteredResponsibleParties = responsibleParties.filter(party =>
    party.name.toLowerCase().includes(responsiblePartySearch.toLowerCase()) ||
    party.phone.includes(responsiblePartySearch) ||
    (party.address && party.address.toLowerCase().includes(responsiblePartySearch.toLowerCase()))
  );

  // Handle delete service
  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus layanan ini?')) {
      return;
    }

    try {
      const response = await api.delete(`/user/services/${serviceId}`);

      if (response.data.success) {
        alert('Layanan berhasil dihapus!');
        fetchServices();
        setShowServiceDropdown(showServiceDropdown.map(() => false));
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Gagal menghapus layanan. Silakan coba lagi.');
    }
  };

  const validate = () => {
    const newErrors = {};

    // Booking date validation
    if (!formData.booking_date) {
      newErrors.booking_date = 'Tanggal mulai wajib diisi';
    }
    
    // Time validation - both required
    if (!formData.booking_time) {
      newErrors.booking_time = 'Waktu mulai wajib diisi';
    }
    if (!formData.booking_time_end) {
      newErrors.booking_time_end = 'Waktu selesai wajib diisi';
    }

    // Location validation
    if (!formData.location_name.trim()) {
      newErrors.location_name = 'Nama lokasi wajib diisi';
    }
    
    // Validate date and time range
    if (formData.booking_date && formData.booking_time && formData.booking_time_end) {
      // Compare time strings (format: "HH:MM")
      const startTime = formData.booking_time;
      const endTime = formData.booking_time_end;
      
      // If booking_date_end is not filled, it means single day booking
      if (formData.booking_date_end) {
        const startDate = new Date(formData.booking_date);
        const endDate = new Date(formData.booking_date_end);
        
        // End date must be >= start date
        if (endDate < startDate) {
          newErrors.booking_date_end = 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai';
        }
        
        // If same day, end time must be > start time
        if (startDate.toDateString() === endDate.toDateString()) {
          if (endTime <= startTime) {
            newErrors.booking_time_end = 'Waktu selesai harus lebih dari waktu mulai (pada hari yang sama)';
          }
        }
        // If different days (multi-day booking), time can wrap to next day - no validation needed
      } else {
        // Single day booking - end time must be > start time
        if (endTime <= startTime) {
          newErrors.booking_time_end = 'Waktu selesai harus lebih dari waktu mulai';
        }
      }
    }
    
    const hasValidService = formData.selected_services.some(s => s.service_id);
    if (!hasValidService) {
      newErrors.selected_services = 'Pilih minimal 1 layanan';
    }
    
    if (formData.amount_paid < 0) newErrors.amount_paid = 'Jumlah tidak valid';
    if (formData.payment_status !== 'Lunas' && formData.amount_paid > formData.total_amount) {
      newErrors.amount_paid = 'Jumlah dibayar tidak boleh melebihi total';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const firstService = formData.selected_services.find(s => s.service_id);
      
      // Validate that service_id exists in services list
      let validServiceId = null;
      if (firstService && firstService.service_id) {
        const serviceExists = services.find(srv => srv.id === parseInt(firstService.service_id));
        if (serviceExists) {
          validServiceId = parseInt(firstService.service_id);
        }
      }
      
      // Create detailed booking information JSON
      const bookingDetails = {
        user_notes: formData.notes,
        booking_date: formData.booking_date,
        booking_time: formData.booking_time,
        booking_date_end: formData.booking_date_end,
        booking_time_end: formData.booking_time_end,
        booking_days: formData.booking_days,
        services: formData.selected_services.filter(s => s.service_id).map(s => ({
          service_id: s.service_id,
          service_name: services.find(srv => srv.id === parseInt(s.service_id))?.name || '',
          custom_price: s.custom_price,
          quantity: s.quantity || 1,
          responsible_party_id: s.responsible_party_id || null
        })),
        discount: formData.discount_value,
        discount_type: formData.discount_type,
        tax_percentage: formData.tax_percentage,
        additional_fees: formData.additional_fees,
        payment_status: formData.payment_status,
        amount_paid: formData.amount_paid,
        responsible_parties: formData.responsible_parties, // Add responsible parties
      };
      
      // Convert Indonesian status back to English for backend
      let backendStatus = 'confirmed';
      if (formData.status === 'Selesai') backendStatus = 'completed';
      else if (formData.status === 'Dibatalkan') backendStatus = 'cancelled';
      else if (formData.status === 'Dijadwalkan') backendStatus = 'confirmed';
      
      // Convert Indonesian payment_status back to English for backend
      let backendPaymentStatus = 'unpaid';
      if (formData.payment_status === 'Lunas') backendPaymentStatus = 'paid';
      else if (formData.payment_status === 'DP') backendPaymentStatus = 'partial';
      else if (formData.payment_status === 'Belum Bayar') backendPaymentStatus = 'unpaid';
      
      const response = await api.put(`/user/bookings/${bookingId}`, {
        service_id: validServiceId, // Use validated service_id or null
        booking_date: formData.booking_date,
        booking_time: formData.booking_time,
        location_name: formData.location_name,
        location_map_url: formData.location_map_url || null,
        status: backendStatus,
        payment_status: backendPaymentStatus,
        total_amount: parseFloat(formData.total_amount) || 0,
        amount_paid: parseFloat(formData.amount_paid) || 0,
        notes: JSON.stringify(bookingDetails),
      });

      if (response.data.success) {
        alert('Booking berhasil diupdate!');
        onSuccess();
        onClose();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Gagal mengupdate booking. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Booking"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Update Booking
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client Info (Read Only) */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Informasi Klien</h3>
          <div className="bg-blue-50 p-4 rounded-lg space-y-2 border border-blue-200">
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-gray-600 w-20">Nama:</span>
              <span className="text-sm text-gray-900 font-medium">{formData.client_name}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-gray-600 w-20">Kontak:</span>
              <span className="text-sm text-gray-900">{formData.contact}</span>
            </div>
            {formData.address && (
              <div className="flex items-start gap-2">
                <span className="text-sm font-medium text-gray-600 w-20">Alamat:</span>
                <span className="text-sm text-gray-900">{formData.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Booking Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Informasi Booking</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input
              label="Tanggal Mulai"
              type="date"
              name="booking_date"
              value={formData.booking_date}
              onChange={handleChange}
              error={errors.booking_date}
              required
            />
            <div>
              <Input
                label="Tanggal Selesai (Opsional)"
                type="date"
                name="booking_date_end"
                value={formData.booking_date_end}
                onChange={handleChange}
                error={errors.booking_date_end}
              />
              <p className="mt-1 text-xs text-gray-500">
                Kosongkan jika booking hanya 1 hari
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input
              label="Waktu Mulai"
              type="time"
              name="booking_time"
              value={formData.booking_time}
              onChange={handleChange}
              error={errors.booking_time}
              required
            />
            <Input
              label="Waktu Selesai"
              type="time"
              name="booking_time_end"
              value={formData.booking_time_end}
              onChange={handleChange}
              error={errors.booking_time_end}
              required
            />
          </div>

          {/* Location Information */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <FiMapPin className="w-4 h-4" />
              Informasi Lokasi
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <Input
                label="Nama Lokasi"
                type="text"
                name="location_name"
                value={formData.location_name}
                onChange={handleChange}
                error={errors.location_name}
                placeholder="Contoh: Gedung A Lt. 3, Hotel Grand, dll"
                required
              />
              <div>
                <Input
                  label="Link Google Maps (Opsional)"
                  type="url"
                  name="location_map_url"
                  value={formData.location_map_url}
                  onChange={handleChange}
                  error={errors.location_map_url}
                  placeholder="https://maps.google.com/..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Opsional - Salin link Google Maps untuk navigasi
                </p>
              </div>
            </div>
          </div>

          {/* Display calculated days */}
          {formData.booking_date && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">Durasi: {formData.booking_days} hari</span>
                {formData.booking_date_end && (
                  <span className="ml-2 text-xs">
                    ({new Date(formData.booking_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(formData.booking_date_end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})
                  </span>
                )}
                {!formData.booking_date_end && (
                  <span className="ml-2 text-xs">
                    (Booking 1 hari - {new Date(formData.booking_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})
                  </span>
                )}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Harga layanan × {formData.booking_days} hari
              </p>
            </div>
          )}
        </div>

        {/* Services Section */}
        <div>
          {/* Service Mode Toggle */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Mode Layanan:
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="service_mode"
                  checked={formData.service_mode === 'single'}
                  onChange={() => handleServiceModeChange('single')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Single Layanan</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="service_mode"
                  checked={formData.service_mode === 'multiple'}
                  onChange={() => handleServiceModeChange('multiple')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Multiple Layanan</span>
              </label>
            </div>
          </div>

          {/* Services Selection */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Jenis Layanan <span className="text-red-500">*</span>
              </label>
              {formData.service_mode === 'multiple' && (
                <button
                  type="button"
                  onClick={addServiceRow}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <span className="text-lg">+</span> Tambah Layanan
                </button>
              )}
            </div>

            <div className="space-y-3">
              {formData.selected_services.map((service, index) => {
                const selectedService = services.find(s => s.id === parseInt(service.service_id));
                const filteredServices = services.filter(s => 
                  s.name.toLowerCase().includes((serviceSearch[index] || '').toLowerCase())
                );

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">
                          Nama Layanan #{index + 1}
                        </label>
                        
                        {/* Custom Dropdown */}
                        <div className="relative" ref={el => dropdownRefs.current[index] = el}>
                          <button
                            type="button"
                            onClick={() => {
                              const newShowDropdown = [...showServiceDropdown];
                              newShowDropdown[index] = !newShowDropdown[index];
                              setShowServiceDropdown(newShowDropdown);
                              setActiveDropdownIndex(index);
                            }}
                            className="w-full px-3 py-2.5 text-left bg-white border border-gray-300 rounded-lg hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors flex items-center justify-between"
                          >
                            <span className={selectedService ? 'text-gray-900' : 'text-gray-400'}>
                              {selectedService ? selectedService.name : 'Pilih atau tambah jenis layanan'}
                            </span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Dropdown Menu */}
                          {showServiceDropdown[index] && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => {
                                  const newShowDropdown = [...showServiceDropdown];
                                  newShowDropdown[index] = false;
                                  setShowServiceDropdown(newShowDropdown);
                                }}
                              />
                              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                                {/* Search Input */}
                                <div className="p-2 border-b border-gray-100">
                                  <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                      type="text"
                                      value={serviceSearch[index] || ''}
                                      onChange={(e) => {
                                        const newSearch = [...serviceSearch];
                                        newSearch[index] = e.target.value;
                                        setServiceSearch(newSearch);
                                      }}
                                      placeholder="Cari layanan atau ketik untuk menambah..."
                                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>

                                {/* Service List */}
                                <div className="max-h-60 overflow-y-auto">
                                  {filteredServices.length > 0 ? (
                                    filteredServices.map(s => (
                                      <div
                                        key={s.id}
                                        className="hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                                      >
                                        <div className="flex items-center gap-2 px-3 py-2">
                                          {/* For multiple mode and first dropdown, show checkboxes */}
                                          {formData.service_mode === 'multiple' && index === 0 ? (
                                            <>
                                              <input
                                                type="checkbox"
                                                checked={multipleSelectedServices.includes(s.id.toString())}
                                                onChange={(e) => {
                                                  if (e.target.checked) {
                                                    setMultipleSelectedServices(prev => [...prev, s.id.toString()]);
                                                  } else {
                                                    setMultipleSelectedServices(prev => prev.filter(id => id !== s.id.toString()));
                                                  }
                                                }}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                              />
                                              <div className="flex-1 text-left flex items-center justify-between min-w-0">
                                                <div className="flex-1 min-w-0 pr-3">
                                                  <div className="text-sm font-medium text-gray-900 truncate">{s.name}</div>
                                                  {s.description && (
                                                    <div className="text-xs text-gray-500 mt-0.5 truncate">{s.description}</div>
                                                  )}
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                  <span className="text-sm font-medium text-green-600 whitespace-nowrap">
                                                    Rp {s.default_price?.toLocaleString('id-ID')}
                                                  </span>
                                                </div>
                                              </div>
                                            </>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                updateServiceRow(index, 'service_id', s.id.toString());
                                                updateServiceRow(index, 'custom_price', s.default_price);
                                                const newShowDropdown = [...showServiceDropdown];
                                                newShowDropdown[index] = false;
                                                setShowServiceDropdown(newShowDropdown);
                                                const newSearch = [...serviceSearch];
                                                newSearch[index] = '';
                                                setServiceSearch(newSearch);
                                              }}
                                              className="flex-1 text-left flex items-center justify-between min-w-0"
                                            >
                                              <div className="flex-1 min-w-0 pr-3">
                                                <div className="text-sm font-medium text-gray-900 truncate">{s.name}</div>
                                                {s.description && (
                                                  <div className="text-xs text-gray-500 mt-0.5 truncate">{s.description}</div>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="text-sm font-medium text-green-600 whitespace-nowrap">
                                                  Rp {s.default_price?.toLocaleString('id-ID')}
                                                </span>
                                                {selectedService?.id === s.id && (
                                                  <FiCheck className="w-4 h-4 text-blue-600" />
                                                )}
                                              </div>
                                            </button>
                                          )}
                                          
                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditService(s);
                                                const newShowDropdown = [...showServiceDropdown];
                                                newShowDropdown[index] = false;
                                                setShowServiceDropdown(newShowDropdown);
                                              }}
                                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                              title="Edit layanan"
                                            >
                                              <FiEdit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteService(s.id);
                                              }}
                                              className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                                              title="Hapus layanan"
                                            >
                                              <FiTrash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="px-3 py-8 text-center text-gray-500 text-sm">
                                      Tidak ada layanan ditemukan
                                    </div>
                                  )}
                                </div>

                                {/* Apply Selection Button for Multiple Mode */}
                                {formData.service_mode === 'multiple' && index === 0 && multipleSelectedServices.length > 0 && (
                                  <div className="p-3 border-t border-gray-100 bg-gray-50">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        // Apply selected services
                                        const newSelectedServices = multipleSelectedServices.map(serviceId => ({
                                          service_id: serviceId,
                                          custom_price: services.find(s => s.id === parseInt(serviceId))?.default_price || 0,
                                          quantity: 1,
                                          responsible_party_id: null
                                        }));
                                        setFormData(prev => ({ ...prev, selected_services: newSelectedServices }));
                                        
                                        // Reset search and close dropdown
                                        const newShowDropdown = [...showServiceDropdown];
                                        newShowDropdown[index] = false;
                                        setShowServiceDropdown(newShowDropdown);
                                        const newSearch = [...serviceSearch];
                                        newSearch[index] = '';
                                        setServiceSearch(newSearch);
                                        setMultipleSelectedServices([]);
                                      }}
                                      className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                      Terapkan Pilihan ({multipleSelectedServices.length} layanan)
                                    </button>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAddServiceModal(true);
                                    const newShowDropdown = [...showServiceDropdown];
                                    newShowDropdown[index] = false;
                                    setShowServiceDropdown(newShowDropdown);
                                  }}
                                  className="w-full px-3 py-3 text-left border-t border-gray-100 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-2 text-blue-600 font-medium"
                                >
                                  <FiPlus className="w-4 h-4" />
                                  <span className="text-sm">Tambah Layanan Baru</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {formData.service_mode === 'multiple' && formData.selected_services.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeServiceRow(index)}
                          className="mt-6 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Hapus layanan"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {selectedService && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              Deskripsi Layanan:
                            </div>
                            <div className="text-sm text-blue-600 mt-1">
                              {selectedService.description || 'Tidak ada deskripsi'}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Harga Layanan (Rp)</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={
                                  service.custom_price === 0 
                                    ? '' 
                                    : (service.custom_price || (services.find(s => s.id === parseInt(service.service_id))?.default_price || '')).toLocaleString('id-ID')
                                }
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\./g, '');
                                  updateServiceRow(index, 'custom_price', parseFloat(value) || 0);
                                }}
                                onFocus={(e) => {
                                  if (e.target.value === '0') e.target.value = '';
                                }}
                                className="w-32 text-right rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-gray-700">Jumlah Yang Di Pesan</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const currentQty = service.quantity || 1;
                                  updateServiceRow(index, 'quantity', Math.max(1, currentQty - 1));
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
                                title="Kurangi jumlah"
                              >
                                <FiMinus className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                value={service.quantity && service.quantity !== 1 ? service.quantity : ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    updateServiceRow(index, 'quantity', undefined);
                                  } else {
                                    const numValue = parseInt(value) || 1;
                                    updateServiceRow(index, 'quantity', Math.max(1, numValue));
                                  }
                                }}
                                onBlur={(e) => {
                                  if (!service.quantity || service.quantity < 1) {
                                    updateServiceRow(index, 'quantity', 1);
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
                                  updateServiceRow(index, 'quantity', currentQty + 1);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
                                title="Tambah jumlah"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Penanggung Jawab Layanan */}
                    {selectedService && (
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-700">Penanggung Jawab Layanan</span>
                        <div className="flex items-center gap-2">
                          <div className="relative" ref={el => serviceResponsiblePartyDropdownRefs.current[index] = el}>
                            <button
                              type="button"
                              onClick={() => {
                                const newShowDropdown = [...showServiceResponsiblePartyDropdown];
                                newShowDropdown[index] = !newShowDropdown[index];
                                setShowServiceResponsiblePartyDropdown(newShowDropdown);
                                setActiveServiceResponsiblePartyDropdownIndex(index);
                              }}
                              className="w-40 px-2 py-1.5 text-left bg-white border border-gray-300 rounded-lg hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors text-xs flex items-center justify-between"
                            >
                              <span className={service.responsible_party_id ? 'text-gray-900' : 'text-gray-400'}>
                                {service.responsible_party_id
                                  ? responsibleParties.find(rp => rp.id === parseInt(service.responsible_party_id))?.name || 'Tidak ditemukan'
                                  : 'Pilih...'}
                              </span>
                              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {/* Service Responsible Party Dropdown */}
                            {showServiceResponsiblePartyDropdown[index] && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => {
                                    const newShowDropdown = [...showServiceResponsiblePartyDropdown];
                                    newShowDropdown[index] = false;
                                    setShowServiceResponsiblePartyDropdown(newShowDropdown);
                                  }}
                                />
                                <div className="absolute z-20 w-48 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden right-0">
                                  {/* Search Input */}
                                  <div className="p-2 border-b border-gray-100">
                                    <div className="relative">
                                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                      <input
                                        type="text"
                                        value={serviceResponsiblePartySearch[index] || ''}
                                        onChange={(e) => {
                                          const newSearch = [...serviceResponsiblePartySearch];
                                          newSearch[index] = e.target.value;
                                          setServiceResponsiblePartySearch(newSearch);
                                        }}
                                        placeholder="Cari penanggung jawab..."
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  </div>

                                  {/* Responsible Party List */}
                                  <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                    {responsibleParties.filter(party =>
                                      party.name.toLowerCase().includes((serviceResponsiblePartySearch[index] || '').toLowerCase()) ||
                                      party.phone.includes(serviceResponsiblePartySearch[index] || '') ||
                                      (party.address && party.address.toLowerCase().includes((serviceResponsiblePartySearch[index] || '').toLowerCase()))
                                    ).length > 0 ? (
                                      responsibleParties.filter(party =>
                                        party.name.toLowerCase().includes((serviceResponsiblePartySearch[index] || '').toLowerCase()) ||
                                        party.phone.includes(serviceResponsiblePartySearch[index] || '') ||
                                        (party.address && party.address.toLowerCase().includes((serviceResponsiblePartySearch[index] || '').toLowerCase()))
                                      ).map(party => (
                                        <div
                                          key={party.id}
                                          className="w-full text-left flex items-center justify-between min-w-0 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 px-3 py-2"
                                        >
                                          <button
                                            type="button"
                                            onClick={() => handleServiceResponsiblePartySelect(index, party.id.toString())}
                                            className="flex-1 min-w-0 pr-3 text-left"
                                          >
                                            <div className="text-sm font-medium text-gray-900 truncate">{party.name}</div>
                                            <div className="text-xs text-gray-500 mt-0.5 truncate">
                                              {party.phone} {party.address && `• ${party.address}`}
                                            </div>
                                          </button>
                                          <div className="flex items-center gap-2 flex-shrink-0">
                                            {party.phone && (
                                              <a
                                                href={`https://wa.me/${party.countryCode || '62'}${party.phone.replace(/^0/, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-green-600 hover:text-green-700 transition-colors"
                                                title={`WhatsApp ${party.name}`}
                                              >
                                                <FiMessageCircle className="w-4 h-4" />
                                              </a>
                                            )}
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditResponsibleParty(party);
                                                const newShowDropdown = [...showServiceResponsiblePartyDropdown];
                                                newShowDropdown[index] = false;
                                                setShowServiceResponsiblePartyDropdown(newShowDropdown);
                                              }}
                                              className="text-blue-600 hover:text-blue-700 transition-colors"
                                              title="Edit penanggung jawab"
                                            >
                                              <FiEdit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteResponsibleParty(party.id);
                                                const newShowDropdown = [...showServiceResponsiblePartyDropdown];
                                                newShowDropdown[index] = false;
                                                setShowServiceResponsiblePartyDropdown(newShowDropdown);
                                              }}
                                              className="text-red-600 hover:text-red-700 transition-colors"
                                              title="Hapus penanggung jawab"
                                            >
                                              <FiTrash2 className="w-4 h-4" />
                                            </button>
                                            {service.responsible_party_id === party.id.toString() && (
                                              <FiCheck className="w-4 h-4 text-blue-600" />
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="px-3 py-8 text-center text-gray-500 text-sm">
                                        Tidak ada penanggung jawab ditemukan
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setResponsiblePartyModalData({ id: null, name: '', phone: '', countryCode: '62', address: '' });
                                      setEditingResponsibleParty(null);
                                      setShowAddResponsiblePartyModal(true);
                                      const newShowDropdown = [...showServiceResponsiblePartyDropdown];
                                      newShowDropdown[index] = false;
                                      setShowServiceResponsiblePartyDropdown(newShowDropdown);
                                    }}
                                    className="w-full px-3 py-3 text-left border-t border-gray-100 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-2 text-blue-600 font-medium"
                                  >
                                    <FiPlus className="w-4 h-4" />
                                    <span className="text-sm">Tambah Penanggung Jawab Baru</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {errors.selected_services && (
              <p className="mt-2 text-sm text-red-600">{errors.selected_services}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <Select
              label="Status Booking"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'Dijadwalkan', label: 'Dijadwalkan' },
                { value: 'Selesai', label: 'Selesai' },
                { value: 'Dibatalkan', label: 'Dibatalkan' },
              ]}
              required
            />
            <Select
              label="Status Pembayaran"
              name="payment_status"
              value={formData.payment_status}
              onChange={handleChange}
              options={[
                { value: 'Belum Bayar', label: 'Belum Bayar' },
                { value: 'DP', label: 'Down Payment (DP)' },
                { value: 'Lunas', label: 'Lunas' },
              ]}
              required
            />
          </div>
        </div>

        {/* Payment Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Informasi Pembayaran</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Biaya Layanan (Rp)
              </label>
              <input
                type="text"
                value={originalSubtotal.toLocaleString('id-ID')}
                readOnly
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 cursor-not-allowed"
              />
              <div className="mt-1 space-y-1">
                <p className="text-xs text-gray-500">Total layanan sebelum diskon</p>
                {formData.discount_value > 0 && (
                  <p className="text-xs text-green-600">
                    Setelah diskon: Rp {subtotalAmount.toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sudah Dibayar (Rp)
              </label>
              <input
                type="text"
                value={formData.amount_paid === 0 ? '' : formData.amount_paid.toLocaleString('id-ID')}
                onChange={(e) => {
                  const value = e.target.value.replace(/\./g, '');
                  const numValue = parseFloat(value) || 0;
                  
                  // Validate DP limit
                  if (formData.payment_status === 'DP') {
                    const maxDP = Math.floor(formData.total_amount * 0.9);
                    if (numValue > maxDP) {
                      setErrors(prev => ({
                        ...prev,
                        amount_paid: `DP maksimal 90% dari total (Rp ${maxDP.toLocaleString('id-ID')})`
                      }));
                      return;
                    }
                  }
                  
                  handleChange({ target: { name: 'amount_paid', value: numValue } });
                }}
                placeholder="0"
                disabled={formData.payment_status === 'Belum Bayar' || formData.payment_status === 'Lunas'}
                className={`block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 focus:outline-none ${
                  formData.payment_status === 'Belum Bayar' || formData.payment_status === 'Lunas' ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                }`}
              />
              {formData.payment_status === 'Belum Bayar' && (
                <p className="mt-1 text-xs text-orange-600">Ubah status pembayaran untuk mengisi</p>
              )}
              {formData.payment_status === 'DP' && (
                <p className="mt-1 text-xs text-blue-600">
                  Maksimal 90% dari total keseluruhan (Rp {Math.floor(formData.total_amount * 0.9).toLocaleString('id-ID')})
                </p>
              )}
              {errors.amount_paid && (
                <p className="mt-1 text-xs text-red-600">{errors.amount_paid}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diskon
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    name="discount_rupiah"
                    value={formData.discount_type === 'rupiah' && formData.discount_value > 0 ? formData.discount_value.toLocaleString('id-ID') : ''}
                    onChange={handleChange}
                    placeholder="0"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">Rupiah (Rp)</p>
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    name="discount_persen"
                    value={formData.discount_type === 'persen' && formData.discount_value > 0 ? formData.discount_value : ''}
                    onChange={handleChange}
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
                value={formData.tax_percentage === 0 ? '' : formData.tax_percentage}
                onChange={handleChange}
                name="tax_percentage"
                placeholder="0"
                min="0"
                max="100"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Additional Fees */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Biaya Tambahan
              </label>
              <button
                type="button"
                onClick={addAdditionalFee}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <span className="text-lg">+</span> Tambah Biaya
              </button>
            </div>

            {formData.additional_fees.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-sm text-gray-500">
                  Belum ada biaya tambahan. Klik "Tambah Biaya" untuk menambahkan.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.additional_fees.map((fee, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={fee.description}
                        onChange={(e) => updateAdditionalFee(index, 'description', e.target.value)}
                        placeholder="Nama biaya (misal: Ongkir, Parkir, dll)"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="w-40">
                      <input
                        type="text"
                        value={fee.amount === 0 ? '' : parseFloat(fee.amount).toLocaleString('id-ID')}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\./g, '');
                          updateAdditionalFee(index, 'amount', parseFloat(value) || 0);
                        }}
                        placeholder="0"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none text-right"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAdditionalFee(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Hapus biaya"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>



          {/* Total Summary */}
          <div className="p-4 bg-white border-2 border-blue-200 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Rincian Biaya</h4>
            
            {/* Booking Schedule Info */}
            {formData.booking_date && formData.booking_time && (
              <div className="mb-3 pb-3 border-b border-blue-200 bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">Jadwal Booking:</p>
                {formData.booking_date_end && formData.booking_days > 1 ? (
                  // Multi-day booking: Show start and end dates/times separately
                  <div className="space-y-1">
                    <p className="text-xs text-blue-700">
                      <span className="font-medium">Mulai:</span>{' '}
                      {new Date(formData.booking_date).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}{' '}
                      - {formData.booking_time}
                    </p>
                    <p className="text-xs text-blue-700">
                      <span className="font-medium">Selesai:</span>{' '}
                      {new Date(formData.booking_date_end).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}{' '}
                      - {formData.booking_time_end}
                    </p>
                    <p className="text-xs text-blue-600 font-semibold mt-2">
                      Total: {formData.booking_days} hari
                    </p>
                  </div>
                ) : (
                  // Single-day booking: Show date with time range
                  <div className="space-y-1">
                    <p className="text-xs text-blue-700">
                      <span className="font-medium">Tanggal:</span>{' '}
                      {new Date(formData.booking_date).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-blue-700">
                      <span className="font-medium">Waktu:</span> {formData.booking_time} - {formData.booking_time_end}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Services Breakdown */}
            <div className="space-y-1.5 mb-3 pb-3 border-b border-gray-200">
              {formData.selected_services.map((service, index) => {
                const srv = services.find(s => s.id === parseInt(service.service_id));
                if (!srv) return null;
                const price = parseFloat(service.custom_price || srv.default_price || 0);
                const quantity = service.quantity || 1;
                const totalPrice = price * quantity;
                return (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {srv.name} {quantity > 1 ? `(x${quantity})` : ''}:
                    </span>
                    <span className="text-gray-900 font-medium">Rp {totalPrice.toLocaleString('id-ID')}</span>
                  </div>
                );
              })}
            </div>

            {/* Subtotal */}
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-700">Total Layanan (1 hari):</span>
              <span className="text-gray-900 font-medium">
                Rp {formData.selected_services.reduce((sum, s) => {
                  const srv = services.find(srv => srv.id === parseInt(s.service_id));
                  const price = srv ? parseFloat(s.custom_price || srv.default_price || 0) : 0;
                  const quantity = s.quantity || 1;
                  return sum + (price * quantity);
                }, 0).toLocaleString('id-ID')}
              </span>
            </div>

            {/* Multiply by days */}
            {formData.booking_days > 1 && (
              <div className="flex justify-between text-sm mb-1.5 text-blue-600">
                <span>× {formData.booking_days} hari:</span>
                <span className="font-medium">
                  Rp {(formData.selected_services.reduce((sum, s) => {
                    const srv = services.find(srv => srv.id === parseInt(s.service_id));
                    const price = srv ? parseFloat(s.custom_price || srv.default_price || 0) : 0;
                    const quantity = s.quantity || 1;
                    return sum + (price * quantity);
                  }, 0) * formData.booking_days).toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {/* Discount */}
            {formData.discount_value > 0 && (
              <div className="flex justify-between text-sm mb-1.5 text-green-600">
                <span>Diskon:</span>
                <span className="font-medium">- Rp {(() => {
                  let discountAmount = 0;
                  if (formData.discount_type === 'persen') {
                    discountAmount = (originalSubtotal * formData.discount_value) / 100;
                  } else {
                    discountAmount = formData.discount_value;
                  }
                  return discountAmount.toLocaleString('id-ID');
                })()}</span>
              </div>
            )}

            {/* Subtotal after discount */}
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-700">Subtotal:</span>
              <span className="text-gray-900 font-medium">
                Rp {subtotalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Tax */}
            {formData.tax_percentage > 0 && (
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-700">PPN ({formData.tax_percentage}%):</span>
                <span className="text-gray-900 font-medium">
                  Rp {(subtotalAmount * formData.tax_percentage / 100).toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {/* Additional Fees */}
            {formData.additional_fees.length > 0 && formData.additional_fees.some(f => f.amount > 0) && (
              <div className="space-y-1.5 mb-3 pb-3 border-b border-gray-200">
                {formData.additional_fees.map((fee, index) => {
                  if (!fee.amount || fee.amount === 0) return null;
                  return (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-700">{fee.description || 'Biaya Tambahan'}:</span>
                      <span className="text-gray-900 font-medium">Rp {parseFloat(fee.amount).toLocaleString('id-ID')}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Grand Total */}
            <div className="flex justify-between items-center pt-3 border-t-2 border-blue-200 mb-3">
              <span className="text-base font-semibold text-gray-900">Total Keseluruhan:</span>
              <span className="text-xl font-bold text-blue-600">
                Rp {formData.total_amount.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Payment Status */}
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-700">Sudah Dibayar:</span>
              <span className="text-gray-900 font-medium">Rp {formData.amount_paid.toLocaleString('id-ID')}</span>
            </div>

            {/* Remaining Amount */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-700">Sisa Pembayaran:</span>
              <span className={`text-base font-bold ${
                Math.max(0, formData.total_amount - formData.amount_paid) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                Rp {Math.max(0, formData.total_amount - formData.amount_paid).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Responsible Parties Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Penanggung Jawab Booking</h3>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Pilih Penanggung Jawab <span className="text-gray-500">(Opsional)</span>
              </label>
              <button
                type="button"
                onClick={handleAddResponsibleParty}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <FiPlus className="w-4 h-4" />
                Tambah Penanggung Jawab
              </button>
            </div>

            {/* Responsible Parties Dropdown */}
            <div className="relative responsible-parties-dropdown">
              <button
                type="button"
                onClick={() => setShowResponsiblePartiesDropdown(!showResponsiblePartiesDropdown)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <div className="flex items-center gap-2">
                  <FiUser className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    {formData.responsible_parties.length === 0 
                      ? 'Pilih penanggung jawab...' 
                      : `${formData.responsible_parties.length} penanggung jawab dipilih`
                    }
                  </span>
                </div>
                <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showResponsiblePartiesDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showResponsiblePartiesDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                  {/* Search Input */}
                  <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={responsiblePartySearch}
                        onChange={(e) => setResponsiblePartySearch(e.target.value)}
                        placeholder="Cari penanggung jawab..."
                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Dropdown Content */}
                  <div className="max-h-60 overflow-y-auto">
                    {filteredResponsibleParties.length === 0 ? (
                      <div className="px-3 py-8 text-center text-gray-500 text-sm">
                        {responsiblePartySearch 
                          ? 'Tidak ada penanggung jawab yang cocok dengan pencarian'
                          : 'Belum ada penanggung jawab. Klik "Tambah Penanggung Jawab" untuk menambahkan.'
                        }
                      </div>
                    ) : (
                      <div className="py-1">
                        {filteredResponsibleParties.map((party) => {
                          const isSelected = formData.responsible_parties.some(p => p.id === party.id);
                          return (
                            <div key={party.id} className="flex items-center px-3 py-2 hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleResponsiblePartyChange(party.id, e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <div className="ml-3 flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{party.name}</div>
                                    <div className="text-xs text-gray-500 truncate">{party.phone}</div>
                                    {party.address && (
                                      <div className="text-xs text-gray-400 truncate">{party.address}</div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 ml-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditResponsibleParty(party);
                                        setShowResponsiblePartiesDropdown(false);
                                        setResponsiblePartySearch('');
                                      }}
                                      className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                      title="Edit penanggung jawab"
                                    >
                                      <FiEdit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteResponsibleParty(party.id);
                                      }}
                                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                      title="Hapus penanggung jawab"
                                    >
                                      <FiTrash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Responsible Parties Display */}
            {formData.responsible_parties.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.responsible_parties.map((party) => (
                  <div key={party.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FiUser className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{party.name}</div>
                          <div className="text-xs text-gray-600">{party.phone}</div>
                          {party.address && (
                            <div className="text-xs text-gray-500">{party.address}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResponsiblePartyChange(party.id, false)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Hapus dari pilihan"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <TextArea
            label="Catatan"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Tambahkan catatan tambahan (opsional)"
            rows={3}
          />
        </div>
      </form>
      </Modal>

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Tambah Layanan Baru</h3>
              <button
                onClick={() => {
                  setShowAddServiceModal(false);
                  setNewServiceData({ name: '', description: '', default_price: 0 });
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Layanan
                </label>
                <input
                  type="text"
                  value={newServiceData.name}
                  onChange={(e) => setNewServiceData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Masukkan nama layanan..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi (opsional)
                </label>
                <textarea
                  value={newServiceData.description}
                  onChange={(e) => setNewServiceData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Masukkan deskripsi layanan..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga Default (opsional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                  <input
                    type="number"
                    value={newServiceData.default_price === 0 ? '' : newServiceData.default_price}
                    onChange={(e) => setNewServiceData(prev => ({ ...prev, default_price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddServiceModal(false);
                  setNewServiceData({ name: '', description: '', default_price: 0 });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (!newServiceData.name.trim()) {
                    alert('Nama layanan wajib diisi!');
                    return;
                  }

                  try {
                    const response = await api.post('/user/services', {
                      user_id: 2,
                      name: newServiceData.name,
                      description: newServiceData.description,
                      default_price: newServiceData.default_price,
                    });

                    if (response.data.success) {
                      alert('Layanan berhasil ditambahkan!');
                      fetchServices();
                      setShowAddServiceModal(false);
                      setNewServiceData({ name: '', description: '', default_price: 0 });
                    } else {
                      throw new Error(response.data.message);
                    }
                  } catch (error) {
                    console.error('Error adding service:', error);
                    alert('Gagal menambahkan layanan. Silakan coba lagi.');
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tambah Layanan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Layanan</h3>
              <button
                onClick={() => {
                  setShowEditServiceModal(false);
                  setEditServiceData({ id: null, name: '', description: '', default_price: 0 });
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Layanan
                </label>
                <input
                  type="text"
                  value={editServiceData.name}
                  onChange={(e) => setEditServiceData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Masukkan nama layanan..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi (opsional)
                </label>
                <textarea
                  value={editServiceData.description}
                  onChange={(e) => setEditServiceData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Masukkan deskripsi layanan..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga Default (opsional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                  <input
                    type="number"
                    value={editServiceData.default_price === 0 ? '' : editServiceData.default_price}
                    onChange={(e) => setEditServiceData(prev => ({ ...prev, default_price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowEditServiceModal(false);
                  setEditServiceData({ id: null, name: '', description: '', default_price: 0 });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (!editServiceData.name.trim()) {
                    alert('Nama layanan wajib diisi!');
                    return;
                  }

                  try {
                    const response = await api.put(`/user/services/${editServiceData.id}`, {
                      name: editServiceData.name,
                      description: editServiceData.description,
                      default_price: editServiceData.default_price,
                    });

                    if (response.data.success) {
                      alert('Layanan berhasil diupdate!');
                      fetchServices();
                      setShowEditServiceModal(false);
                      setEditServiceData({ id: null, name: '', description: '', default_price: 0 });
                    } else {
                      throw new Error(response.data.message);
                    }
                  } catch (error) {
                    console.error('Error updating service:', error);
                    alert('Gagal mengupdate layanan. Silakan coba lagi.');
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Responsible Party Modal */}
      {showAddResponsiblePartyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingResponsibleParty ? 'Edit Penanggung Jawab' : 'Tambah Penanggung Jawab Baru'}
              </h3>
              <button
                onClick={() => {
                  setShowAddResponsiblePartyModal(false);
                  setResponsiblePartyModalData({ id: null, name: '', phone: '', countryCode: '62', address: '' });
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Penanggung Jawab <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={responsiblePartyModalData.name}
                  onChange={(e) => setResponsiblePartyModalData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Masukkan nama penanggung jawab..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Telepon/WA <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <CountryCodeDropdown
                    value={responsiblePartyModalData.countryCode}
                    onChange={(code) => setResponsiblePartyModalData(prev => ({ ...prev, countryCode: code }))}
                  />
                  <input
                    type="tel"
                    value={responsiblePartyModalData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9+]/g, '');
                      setResponsiblePartyModalData(prev => ({ ...prev, phone: value }));
                    }}
                    placeholder="8123456789"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Format: 8xxx (tanpa 0 di depan) atau 08xxx
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat <span className="text-gray-500">(Opsional)</span>
                </label>
                <textarea
                  value={responsiblePartyModalData.address}
                  onChange={(e) => setResponsiblePartyModalData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Masukkan alamat penanggung jawab..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddResponsiblePartyModal(false);
                  setResponsiblePartyModalData({ id: null, name: '', phone: '', countryCode: '62', address: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveResponsibleParty}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingResponsibleParty ? 'Update' : 'Tambah Penanggung Jawab'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditBookingModal;
