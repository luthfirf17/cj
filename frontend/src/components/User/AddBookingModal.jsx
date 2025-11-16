import React, { useState, useEffect, useRef } from 'react';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Select from '../Common/Select';
import TextArea from '../Common/TextArea';
import CountryCodeDropdown from '../Common/CountryCodeDropdown';
import { FiUser, FiPhone, FiMapPin, FiDollarSign, FiPercent, FiTrash2, FiPlus, FiSearch, FiCheck, FiEdit2, FiX, FiMessageCircle } from 'react-icons/fi';
import { formatPhoneForWhatsApp } from '../../utils/phoneUtils';
import api from '../../services/api';

const AddBookingModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [responsibleParties, setResponsibleParties] = useState([]);

    // Form State
  const [formData, setFormData] = useState({
    // Client Data
    client_id: '',
    client_name: '',
    contact: '',
    address: '',
    // Booking Data
    booking_date: '',
    booking_date_end: '',
    booking_time: '',
    booking_time_end: '',
    booking_days: 1, // Calculated from dates
    service_mode: 'single', // single or multiple
    selected_services: [{ service_id: '', custom_price: 0, quantity: 1, responsible_party_id: '' }],
    // Location Data
    location_name: '',
    location_map_url: '',
    // Status
    status: 'Dijadwalkan',
    payment_status: 'Belum Bayar',
    // Payment Data
    total_amount: 0,
    amount_paid: 0,
    discount_value: 0, // Changed from discount
    discount_type: 'rupiah', // 'rupiah' or 'persen'
    tax_percentage: 0,
    additional_fees: [], // Array of {name, amount}
    // Notes
    notes: '',
    // Responsible Parties
    responsible_parties: [], // Array of {id, name, phone, address}
  });

  const [serviceSearch, setServiceSearch] = useState(['']); // Array for multiple dropdowns
  const [serviceResponsiblePartySearch, setServiceResponsiblePartySearch] = useState(['']); // Array for service responsible party searches
  const [showServiceDropdown, setShowServiceDropdown] = useState([false]); // Array for multiple dropdowns
  const [showServiceResponsiblePartyDropdown, setShowServiceResponsiblePartyDropdown] = useState([false]); // Array for service responsible party dropdowns
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);
  const [activeServiceResponsiblePartyDropdownIndex, setActiveServiceResponsiblePartyDropdownIndex] = useState(null);
  
  // Multiple Services Selection State
  const [multipleSelectedServices, setMultipleSelectedServices] = useState([]);
  
  // Client Dropdown State
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  
  // Responsible Parties Dropdown State
  const [responsiblePartySearch, setResponsiblePartySearch] = useState('');
  const [showResponsiblePartyDropdown, setShowResponsiblePartyDropdown] = useState(false);
  
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

  // Add/Edit Client Modal State
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [clientModalData, setClientModalData] = useState({
    id: null,
    name: '',
    phone: '',
    countryCode: '62', // Default Indonesia
    address: '',
  });

  // Add/Edit Responsible Party Modal State
  const [showAddResponsiblePartyModal, setShowAddResponsiblePartyModal] = useState(false);
  const [showEditResponsiblePartyModal, setShowEditResponsiblePartyModal] = useState(false);
  const [responsiblePartyModalData, setResponsiblePartyModalData] = useState({
    id: null,
    name: '',
    phone: '',
    countryCode: '62', // Default Indonesia
    address: '',
  });

  const [errors, setErrors] = useState({});
  const [isNewClient, setIsNewClient] = useState(true);
  
  const dropdownRefs = useRef([]);
  const serviceResponsiblePartyDropdownRefs = useRef([]);
  const clientDropdownRef = useRef(null);
  const responsiblePartyDropdownRef = useRef(null);

  // Subtotal state for display purposes
  const [subtotalAmount, setSubtotalAmount] = useState(0);
  const [originalSubtotal, setOriginalSubtotal] = useState(0); // Before discount

  // Fetch services and clients
  useEffect(() => {
    if (isOpen) {
      fetchServices();
      fetchClients();
      fetchResponsibleParties();
    }
  }, [isOpen]);

  const fetchServices = async () => {
    try {
      const response = await api.get('/user/services', {
        params: { user_id: 2 }
      });
      
      if (response.data.success) {
        setServices(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      alert('Gagal memuat data layanan');
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/user/clients', {
        params: { user_id: 2 }
      });
      
      if (response.data.success) {
        setClients(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      alert('Gagal memuat data klien');
    }
  };

  const fetchResponsibleParties = async () => {
    try {
      const response = await api.get('/user/responsible-parties', {
        params: { user_id: 2 }
      });
      
      if (response.data.success) {
        setResponsibleParties(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching responsible parties:', error);
      // For now, don't show alert as this might not exist yet
      setResponsibleParties([]);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close service dropdown
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
      
      // Close client dropdown
      if (showClientDropdown && 
          clientDropdownRef.current && 
          !clientDropdownRef.current.contains(event.target)) {
        setShowClientDropdown(false);
      }

      // Close responsible party dropdown
      if (showResponsiblePartyDropdown && 
          responsiblePartyDropdownRef.current && 
          !responsiblePartyDropdownRef.current.contains(event.target)) {
        setShowResponsiblePartyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdownIndex, activeServiceResponsiblePartyDropdownIndex, showServiceDropdown, showServiceResponsiblePartyDropdown, showClientDropdown, showResponsiblePartyDropdown]);

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

    // Sum all selected services
    formData.selected_services.forEach(service => {
      if (service.service_id) {
        const serviceData = services.find(s => s.id === parseInt(service.service_id));
        const price = service.custom_price || (serviceData ? serviceData.default_price : 0);
        const quantity = service.quantity || 1;
        subtotal += price * quantity;
      }
    });

    // Multiply by number of days
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

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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

    // Auto-adjust amount_paid based on payment_status
    if (name === 'payment_status') {
      if (value === 'Belum Bayar') {
        // Set amount_paid to 0 if status is "Belum Bayar"
        setFormData(prev => ({ ...prev, amount_paid: 0 }));
      } else if (value === 'Lunas') {
        // Set amount_paid to total_amount after discount if status is "Lunas"
        setFormData(prev => {
          let discountAmount = 0;
          if (prev.discount_value > 0) {
            if (prev.discount_type === 'persen') {
              discountAmount = (prev.total_amount * prev.discount_value) / 100;
            } else {
              discountAmount = prev.discount_value;
            }
          }
          const totalAfterDiscount = prev.total_amount - discountAmount;
          return { ...prev, amount_paid: totalAfterDiscount };
        });
      }
      // For 'DP', let user input the amount manually
    }
  };

  // Handle service mode toggle
  const handleServiceModeChange = (mode) => {
    setFormData(prev => ({
      ...prev,
      service_mode: mode,
      selected_services: mode === 'single' 
        ? [{ service_id: '', custom_price: 0, quantity: 1, responsible_party_id: '' }] 
        : [], // Reset to empty for multiple mode to use multiple selection
    }));
    // Reset multiple selection state
    setMultipleSelectedServices([]);
  };

  // Add new service row
  const addServiceRow = () => {
    setFormData(prev => ({
      ...prev,
      selected_services: [...prev.selected_services, { service_id: '', custom_price: 0, quantity: 1, responsible_party_id: '' }],
    }));
    // Add corresponding dropdown and search states
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

  // Handle edit service
  const handleEditService = (service) => {
    setEditServiceData({
      id: service.id,
      name: service.name,
      description: service.description || '',
      default_price: service.default_price || 0,
    });
    setShowEditServiceModal(true);
  };

  // Handle delete service
  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus layanan ini?')) {
      return;
    }

    try {
      const response = await api.delete(`/user/services/${serviceId}`);

      if (response.data.success) {
        alert('Layanan berhasil dihapus!');
        fetchServices(); // Refresh services list
        // Close all dropdowns
        setShowServiceDropdown(showServiceDropdown.map(() => false));
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Gagal menghapus layanan. Silakan coba lagi.');
    }
  };

  // Handle edit client
  const handleEditClient = (client) => {
    const phoneNumber = client.phone || client.contact || '';
    // Detect country code from existing phone number
    let detectedCode = '62'; // default Indonesia
    if (phoneNumber.startsWith('60')) detectedCode = '60';
    else if (phoneNumber.startsWith('65')) detectedCode = '65';
    else if (phoneNumber.startsWith('66')) detectedCode = '66';
    else if (phoneNumber.startsWith('63')) detectedCode = '63';
    else if (phoneNumber.startsWith('84')) detectedCode = '84';
    else if (phoneNumber.startsWith('95')) detectedCode = '95';
    else if (phoneNumber.startsWith('856')) detectedCode = '856';
    else if (phoneNumber.startsWith('855')) detectedCode = '855';
    else if (phoneNumber.startsWith('673')) detectedCode = '673';
    
    // Remove country code from phone for display in input
    let displayPhone = phoneNumber;
    if (displayPhone.startsWith(detectedCode)) {
      displayPhone = displayPhone.substring(detectedCode.length);
    }
    
    setClientModalData({
      id: client.id,
      name: client.name,
      phone: displayPhone,
      countryCode: detectedCode,
      address: client.address || '',
    });
    setShowEditClientModal(true);
    setShowClientDropdown(false);
  };

  // Handle delete client
  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus klien ini?')) {
      return;
    }

    try {
      const response = await api.delete(`/user/clients/${clientId}`);

      if (response.data.success) {
        alert('Klien berhasil dihapus!');
        fetchClients(); // Refresh clients list
        setShowClientDropdown(false);
        // Reset form if deleted client was selected
        if (formData.client_id === clientId.toString()) {
          setIsNewClient(true);
          setFormData(prev => ({
            ...prev,
            client_id: '',
            client_name: '',
            contact: '',
            address: '',
          }));
        }
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Gagal menghapus klien. Silakan coba lagi.');
    }
  };

  // Handle responsible party selection (toggle)
  const handleResponsiblePartyToggle = (party) => {
    setFormData(prev => {
      const isSelected = prev.responsible_parties.some(rp => rp.id === party.id);
      if (isSelected) {
        // Remove from selection
        return {
          ...prev,
          responsible_parties: prev.responsible_parties.filter(rp => rp.id !== party.id)
        };
      } else {
        // Add to selection
        return {
          ...prev,
          responsible_parties: [...prev.responsible_parties, party]
        };
      }
    });
  };

  // Handle service responsible party selection
  const handleServiceResponsiblePartySelect = (serviceIndex, partyId) => {
    updateServiceRow(serviceIndex, 'responsible_party_id', partyId);
    // Close dropdown
    const newShowDropdown = [...showServiceResponsiblePartyDropdown];
    newShowDropdown[serviceIndex] = false;
    setShowServiceResponsiblePartyDropdown(newShowDropdown);
    // Reset search
    const newSearch = [...serviceResponsiblePartySearch];
    newSearch[serviceIndex] = '';
    setServiceResponsiblePartySearch(newSearch);
  };

  // Handle edit responsible party
  const handleEditResponsibleParty = (party) => {
    const phoneNumber = party.phone || '';
    // Detect country code from existing phone number
    let detectedCode = '62'; // default Indonesia
    if (phoneNumber.startsWith('60')) detectedCode = '60';
    else if (phoneNumber.startsWith('65')) detectedCode = '65';
    else if (phoneNumber.startsWith('66')) detectedCode = '66';
    else if (phoneNumber.startsWith('63')) detectedCode = '63';
    else if (phoneNumber.startsWith('84')) detectedCode = '84';
    else if (phoneNumber.startsWith('95')) detectedCode = '95';
    else if (phoneNumber.startsWith('856')) detectedCode = '856';
    else if (phoneNumber.startsWith('855')) detectedCode = '855';
    else if (phoneNumber.startsWith('673')) detectedCode = '673';
    
    // Remove country code from phone for display in input
    let displayPhone = phoneNumber;
    if (displayPhone.startsWith(detectedCode)) {
      displayPhone = displayPhone.substring(detectedCode.length);
    }
    
    setResponsiblePartyModalData({
      id: party.id,
      name: party.name,
      phone: displayPhone,
      countryCode: detectedCode,
      address: party.address || '',
    });
    setShowEditResponsiblePartyModal(true);
    setShowResponsiblePartyDropdown(false);
  };

  // Handle delete responsible party
  const handleDeleteResponsibleParty = async (partyId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus penanggung jawab ini?')) {
      return;
    }

    try {
      const response = await api.delete(`/user/responsible-parties/${partyId}`);

      if (response.data.success) {
        alert('Penanggung jawab berhasil dihapus!');
        fetchResponsibleParties(); // Refresh list
        setShowResponsiblePartyDropdown(false);
        // Remove from formData if selected
        setFormData(prev => ({
          ...prev,
          responsible_parties: prev.responsible_parties.filter(rp => rp.id !== partyId)
        }));
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error deleting responsible party:', error);
      alert('Gagal menghapus penanggung jawab. Silakan coba lagi.');
    }
  };

  const validate = () => {
    const newErrors = {};

    // Client validation
    if (!formData.client_name.trim()) newErrors.client_name = 'Pilih atau tambah klien';
    if (!formData.contact.trim()) newErrors.contact = 'Kontak klien wajib diisi';

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
    
    // Check if at least one service is selected
    const hasValidService = formData.selected_services.some(s => s.service_id);
    if (!hasValidService) {
      newErrors.selected_services = 'Pilih minimal 1 layanan';
    }

    // Payment validation
    if (formData.amount_paid < 0) newErrors.amount_paid = 'Jumlah tidak valid';
    const totalAfterDiscount = (() => {
      let discountAmount = 0;
      if (formData.discount_value > 0) {
        if (formData.discount_type === 'persen') {
          discountAmount = (formData.total_amount * formData.discount_value) / 100;
        } else {
          discountAmount = formData.discount_value;
        }
      }
      return formData.total_amount - discountAmount;
    })();
    if (formData.amount_paid > totalAfterDiscount) {
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
      // Prepare data for API
      // Use the first service for service_id (for backward compatibility)
      const firstService = formData.selected_services.find(s => s.service_id);
      
      // Prepare detailed booking information in JSON format
      const bookingDetails = {
        user_notes: formData.notes, // User's custom notes
        booking_date: formData.booking_date, // Start date - PENTING untuk invoice
        booking_time: formData.booking_time, // Start time - PENTING untuk invoice
        booking_date_end: formData.booking_date_end, // End date
        booking_time_end: formData.booking_time_end, // End time
        booking_days: formData.booking_days, // Number of days for the booking
        services: formData.selected_services.filter(s => s.service_id).map(s => ({
          service_id: s.service_id,
          service_name: services.find(srv => srv.id === parseInt(s.service_id))?.name || '',
          custom_price: s.custom_price,
          quantity: s.quantity || 1,
          responsible_party_id: s.responsible_party_id || null
        })),
        discount: formData.discount_value,
        discount_type: formData.discount_type, // Tambahkan discount_type
        tax_percentage: formData.tax_percentage,
        additional_fees: formData.additional_fees,
        payment_status: formData.payment_status,
        amount_paid: formData.amount_paid,
        responsible_parties: formData.responsible_parties, // Add responsible parties
      };
      
      const bookingData = {
        user_id: 2,
        client_id: isNewClient ? null : formData.client_id,
        client_name: isNewClient ? formData.client_name : null,
        contact: isNewClient ? formData.contact : null,
        address: isNewClient ? formData.address : null,
        service_id: firstService ? firstService.service_id : null,
        booking_date: formData.booking_date,
        booking_time: formData.booking_time,
        location_name: formData.location_name,
        location_map_url: formData.location_map_url || null,
        status: formData.status === 'Dijadwalkan' ? 'confirmed' : 
                formData.status === 'Selesai' ? 'completed' : 'pending',
        total_amount: formData.total_amount,
        amount_paid: formData.amount_paid,
        notes: JSON.stringify(bookingDetails), // Store detailed info as JSON
      };

      const response = await api.post('/user/bookings', bookingData);

      if (response.data.success) {
        alert('Booking berhasil ditambahkan!');
        onSuccess();
        resetForm();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Gagal menambahkan booking. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      client_name: '',
      contact: '',
      address: '',
      booking_date: '',
      booking_date_end: '',
      booking_time: '',
      booking_time_end: '',
      booking_days: 1,
      service_mode: 'single',
      selected_services: [{ service_id: '', custom_price: 0, quantity: 1, responsible_party_id: '' }],
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
    setErrors({});
    setIsNewClient(true);
    setServiceSearch(['']);
    setServiceResponsiblePartySearch(['']);
    setShowServiceDropdown([false]);
    setShowServiceResponsiblePartyDropdown([false]);
    setActiveDropdownIndex(null);
    setActiveServiceResponsiblePartyDropdownIndex(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tambah Booking Baru"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Simpan Booking
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Klien</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pilih Klien
            </label>
            
            {/* Custom Client Dropdown */}
            <div className="relative" ref={clientDropdownRef}>
              <button
                type="button"
                onClick={() => setShowClientDropdown(!showClientDropdown)}
                className="w-full px-3 py-2.5 text-left bg-white border border-gray-300 rounded-lg hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors flex items-center justify-between"
              >
                <span className={formData.client_name ? 'text-gray-900' : 'text-gray-400'}>
                  {formData.client_name || 'Pilih klien atau tambah klien baru'}
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
                          placeholder="Cari klien atau ketik untuk menambah..."
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
                            <div className="flex items-center gap-2 px-3 py-2">
                              {/* Client Info - Clickable */}
                              <button
                                type="button"
                                onClick={() => {
                                  setIsNewClient(false);
                                  setFormData(prev => ({
                                    ...prev,
                                    client_id: client.id.toString(),
                                    client_name: client.name,
                                    contact: client.phone || client.contact || '',
                                    address: client.address || '',
                                  }));
                                  setShowClientDropdown(false);
                                  setClientSearch('');
                                }}
                                className="flex-1 text-left flex items-center justify-between min-w-0"
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
                                {formData.client_id === client.id.toString() && (
                                  <FiCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                )}
                              </button>
                              
                              {/* Edit & Delete buttons */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClient(client);
                                  }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                  title="Edit klien"
                                >
                                  <FiEdit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClient(client.id);
                                  }}
                                  className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                                  title="Hapus klien"
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-8 text-center text-gray-500 text-sm">
                          Tidak ada klien ditemukan
                        </div>
                      )}
                    </div>

                    {/* Add New Client Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddClientModal(true);
                        setShowClientDropdown(false);
                      }}
                      className="w-full px-3 py-3 text-left border-t border-gray-100 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-2 text-blue-600 font-medium"
                    >
                      <FiPlus className="w-4 h-4" />
                      <span className="text-sm">Tambah Klien Baru</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Display selected client info */}
          {formData.client_name && (
            <div className="space-y-3 mt-3">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <FiUser className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      {formData.client_name}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <FiPhone className="w-4 h-4" />
                      <span>{formData.contact}</span>
                    </div>
                    {formData.address && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <FiMapPin className="w-4 h-4 mt-0.5" />
                        <span>{formData.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Responsible Parties Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Penanggung Jawab Booking <span className="text-sm font-normal text-gray-500">(Opsional)</span></h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pilih Penanggung Jawab
            </label>
            
            {/* Custom Responsible Party Dropdown */}
            <div className="relative" ref={responsiblePartyDropdownRef}>
              <button
                type="button"
                onClick={() => setShowResponsiblePartyDropdown(!showResponsiblePartyDropdown)}
                className="w-full px-3 py-2.5 text-left bg-white border border-gray-300 rounded-lg hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors flex items-center justify-between"
              >
                <span className={formData.responsible_parties.length > 0 ? 'text-gray-900' : 'text-gray-400'}>
                  {formData.responsible_parties.length > 0 
                    ? `${formData.responsible_parties.length} penanggung jawab dipilih` 
                    : 'Pilih penanggung jawab atau tambah baru'}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showResponsiblePartyDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowResponsiblePartyDropdown(false)}
                  />
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={responsiblePartySearch}
                          onChange={(e) => setResponsiblePartySearch(e.target.value)}
                          placeholder="Cari penanggung jawab atau ketik untuk menambah..."
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* Responsible Party List */}
                    <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {responsibleParties.filter(party => 
                        party.name.toLowerCase().includes(responsiblePartySearch.toLowerCase()) ||
                        (party.phone && party.phone.includes(responsiblePartySearch))
                      ).length > 0 ? (
                        responsibleParties.filter(party => 
                          party.name.toLowerCase().includes(responsiblePartySearch.toLowerCase()) ||
                          (party.phone && party.phone.includes(responsiblePartySearch))
                        ).map(party => (
                          <div
                            key={party.id}
                            className="hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center gap-2 px-3 py-2">
                              {/* Checkbox */}
                              <input
                                type="checkbox"
                                checked={formData.responsible_parties.some(rp => rp.id === party.id)}
                                onChange={() => handleResponsiblePartyToggle(party)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                              
                              {/* Party Info */}
                              <div className="flex-1 min-w-0 pr-3">
                                <div className="text-sm font-medium text-gray-900 truncate">{party.name}</div>
                                {party.phone && (
                                  <div className="text-xs text-gray-500 mt-0.5 truncate">{party.phone}</div>
                                )}
                                {party.address && (
                                  <div className="text-xs text-gray-400 mt-0.5 truncate">{party.address}</div>
                                )}
                              </div>
                              
                              {/* Edit & Delete buttons */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditResponsibleParty(party);
                                  }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
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
                                  className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                                  title="Hapus penanggung jawab"
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-8 text-center text-gray-500 text-sm">
                          Tidak ada penanggung jawab ditemukan
                        </div>
                      )}
                    </div>

                    {/* Add New Responsible Party Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddResponsiblePartyModal(true);
                        setShowResponsiblePartyDropdown(false);
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

          {/* Display selected responsible parties */}
          {formData.responsible_parties.length > 0 && (
            <div className="space-y-3 mt-3">
              {formData.responsible_parties.map(party => (
                <div key={party.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FiUser className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        {party.name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <FiPhone className="w-4 h-4" />
                        <span>{party.phone}</span>
                      </div>
                      {party.address && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <FiMapPin className="w-4 h-4 mt-0.5" />
                          <span>{party.address}</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResponsiblePartyToggle(party)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Hapus dari pilihan"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Booking</h3>
          
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

          {/* Service Mode Toggle */}
          <div className="mt-4">
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
              <span className="text-xs text-gray-500">
                {formData.service_mode === 'single' 
                  ? 'Hanya dapat memilih 1 jenis layanan'
                  : 'Dapat memilih lebih dari 1 jenis layanan'}
              </span>
            </div>
          </div>

          {/* Services Selection */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Jenis Layanan <span className="text-red-500">*</span>
                </label>
                {formData.service_mode === 'multiple' && formData.selected_services.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    {formData.selected_services.length} jenis layanan dipilih
                  </p>
                )}
              </div>
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
              {(formData.service_mode === 'multiple' && formData.selected_services.length === 0 
                ? [{ service_id: '', custom_price: 0, quantity: 1 }] // Dummy row for multiple selection
                : formData.selected_services
              ).map((service, index) => {
                const selectedService = services.find(s => s.id === parseInt(service.service_id));
                const filteredServices = services.filter(s => 
                  s.name.toLowerCase().includes((serviceSearch[index] || '').toLowerCase())
                );

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">
                          {formData.service_mode === 'multiple' && formData.selected_services.length === 0 && index === 0
                            ? 'Pilih Layanan (Multiple)'
                            : `Nama Layanan #${index + 1}`
                          }
                          {formData.service_mode === 'multiple' && index === 0 && (
                            <span className="ml-2 text-xs text-blue-600 font-medium">
                              (Dapat pilih multiple dengan checkbox)
                            </span>
                          )}
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
                              
                              // For multiple mode and first dropdown, initialize selected services
                              if (formData.service_mode === 'multiple' && index === 0) {
                                setMultipleSelectedServices(formData.selected_services.filter(s => s.service_id).map(s => s.service_id));
                              }
                            }}
                            className="w-full px-3 py-2.5 text-left bg-white border border-gray-300 rounded-lg hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors flex items-center justify-between"
                          >
                            <span className={selectedService ? 'text-gray-900' : 'text-gray-400'}>
                              {selectedService 
                                ? selectedService.name 
                                : (formData.service_mode === 'multiple' && index === 0 && formData.selected_services.length === 0
                                    ? 'Pilih Layanan (Multiple)'
                                    : 'Pilih atau tambah jenis layanan')
                              }
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
                                            /* Service Info - Clickable */
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
                                          
                                          {/* Edit & Delete buttons - Always visible */}
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

                                {/* For multiple mode and first dropdown, show apply button */}
                                {formData.service_mode === 'multiple' && index === 0 && (
                                  <div className="p-3 border-t border-gray-100 bg-gray-50">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        // Apply selected services
                                        const newSelectedServices = multipleSelectedServices.map(serviceId => ({
                                          service_id: serviceId,
                                          custom_price: services.find(s => s.id === parseInt(serviceId))?.default_price || 0,
                                          quantity: 1,
                                          responsible_party_id: ''
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

                                {/* Add New Service Button - Fixed at bottom */}
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
                    
                    {/* Service Details Display - Like CatatKlien */}
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
                                -
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
                                          <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                                          <input
                                            type="text"
                                            value={serviceResponsiblePartySearch[index] || ''}
                                            onChange={(e) => {
                                              const newSearch = [...serviceResponsiblePartySearch];
                                              newSearch[index] = e.target.value;
                                              setServiceResponsiblePartySearch(newSearch);
                                            }}
                                            placeholder="Cari penanggung jawab..."
                                            className="w-full pl-6 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-100 focus:border-blue-500"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>
                                      </div>

                                      {/* Responsible Party List */}
                                      <div className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                        {responsibleParties.filter(party => 
                                          party.name.toLowerCase().includes((serviceResponsiblePartySearch[index] || '').toLowerCase()) ||
                                          (party.phone && party.phone.includes(serviceResponsiblePartySearch[index] || ''))
                                        ).length > 0 ? (
                                          responsibleParties.filter(party => 
                                            party.name.toLowerCase().includes((serviceResponsiblePartySearch[index] || '').toLowerCase()) ||
                                            (party.phone && party.phone.includes(serviceResponsiblePartySearch[index] || ''))
                                          ).map(party => (
                                            <div
                                              key={party.id}
                                              className="w-full text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 px-3 py-2"
                                            >
                                              <div className="flex items-center justify-between">
                                                <button
                                                  type="button"
                                                  onClick={() => handleServiceResponsiblePartySelect(index, party.id.toString())}
                                                  className="flex-1 min-w-0 pr-3 text-left"
                                                >
                                                  <div className="text-xs font-medium text-gray-900 truncate">{party.name}</div>
                                                  {party.phone && (
                                                    <div className="text-xs text-gray-500 truncate">{party.phone}</div>
                                                  )}
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
                                                      <FiMessageCircle className="w-3 h-3" />
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
                                                    <FiEdit2 className="w-3 h-3" />
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
                                                    <FiTrash2 className="w-3 h-3" />
                                                  </button>
                                                  {service.responsible_party_id === party.id.toString() && (
                                                    <FiCheck className="w-3 h-3 text-blue-600" />
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="px-3 py-4 text-center text-gray-500 text-xs">
                                            Tidak ada penanggung jawab
                                          </div>
                                        )}
                                      </div>

                                      {/* Clear Selection */}
                                      {service.responsible_party_id && (
                                        <button
                                          type="button"
                                          onClick={() => handleServiceResponsiblePartySelect(index, '')}
                                          className="w-full px-3 py-2 text-left border-t border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors text-xs text-gray-600"
                                        >
                                          Hapus pilihan
                                        </button>
                                      )}

                                      {/* Add New Responsible Party Button */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowAddResponsiblePartyModal(true);
                                          setShowServiceResponsiblePartyDropdown(prev => {
                                            const newShow = [...prev];
                                            newShow[index] = false;
                                            return newShow;
                                          });
                                        }}
                                        className="w-full px-2 py-2 text-left border-t border-gray-100 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-blue-600 font-medium"
                                      >
                                        <FiPlus className="w-3 h-3" />
                                        <span className="text-xs">Tambah Penanggung Jawab Baru</span>
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Pembayaran</h3>
          
          <div className="grid grid-cols-2 gap-4">
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
                {formData.discount_value > 0 && (
                  <p className="text-xs text-green-600">
                    Harga setelah diskon: Rp {subtotalAmount.toLocaleString('id-ID')}
                  </p>
                )}
                {formData.tax_percentage > 0 && (
                  <p className="text-xs text-blue-600">
                    Pajak ({formData.tax_percentage}%): Rp {(subtotalAmount * formData.tax_percentage / 100).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">Total layanan sebelum diskon</p>
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
                  handleChange({ target: { name: 'amount_paid', value: parseFloat(value) || 0 } });
                }}
                placeholder="0"
                disabled={formData.payment_status === 'Belum Bayar'}
                className={`block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 focus:outline-none ${
                  formData.payment_status === 'Belum Bayar' ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                }`}
              />
              {formData.payment_status === 'Belum Bayar' && (
                <p className="mt-1 text-xs text-orange-600">Ubah status pembayaran untuk mengisi</p>
              )}
              {errors.amount_paid && (
                <p className="mt-1 text-xs text-red-600">{errors.amount_paid}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
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
          <div className="mt-4">
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
        </div>

        {/* Total Summary - Detailed */}
        <div className="mt-4 p-4 bg-white border-2 border-blue-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Rincian Biaya</h4>
            
            {/* Booking Schedule Info */}
            {formData.booking_date && formData.booking_time && (
              <div className="mb-3 pb-3 border-b border-blue-200 bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">Jadwal Booking:</p>
                {formData.booking_date_end && formData.booking_days > 1 ? (
                  // Multi-day booking
                  <div className="space-y-1">
                    <p className="text-xs text-blue-700">
                      <span className="font-medium">Mulai:</span> {new Date(formData.booking_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} - {formData.booking_time}
                    </p>
                    <p className="text-xs text-blue-700">
                      <span className="font-medium">Selesai:</span> {new Date(formData.booking_date_end).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} - {formData.booking_time_end}
                    </p>
                    <p className="text-xs text-blue-600 font-semibold mt-2">
                      Total: {formData.booking_days} hari
                    </p>
                  </div>
                ) : (
                  // Single day booking
                  <div className="space-y-1">
                    <p className="text-xs text-blue-700">
                      <span className="font-medium">Tanggal:</span> {new Date(formData.booking_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
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
                Rp {(originalSubtotal / Math.max(1, parseInt(formData.booking_days) || 1)).toLocaleString('id-ID')}
              </span>
            </div>

            {/* Multiply by days */}
            {formData.booking_days > 1 && (
              <div className="flex justify-between text-sm mb-1.5 text-blue-600">
                <span>× {formData.booking_days} hari:</span>
                <span className="font-medium">
                  Rp {originalSubtotal.toLocaleString('id-ID')}
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

        {/* Hidden Payment Fields */}
        <div>
          <div className="grid grid-cols-2 gap-4" style={{display: 'none'}}>
            <Input
              label="Total Biaya (Hidden)"
              type="number"
              name="total_amount_hidden"
              value={formData.total_amount}
              readOnly
              disabled
              icon={<FiDollarSign />}
              helperText="Dihitung otomatis"
            />
            <Input
              label="Sudah Dibayar"
              type="number"
              name="amount_paid"
              value={formData.amount_paid}
              onChange={handleChange}
              placeholder="0"
              icon={<FiDollarSign />}
              error={errors.amount_paid}
              helperText={`Sisa: Rp ${(formData.total_amount - formData.amount_paid).toLocaleString('id-ID')}`}
            />
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
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Nama Layanan Baru</h3>
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

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Layanan Baru
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
                  placeholder="Masukkan deskripsi layanan (bukan keterangan biaya)..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Deskripsi ini khusus untuk jenis layanan, bukan untuk biaya tambahan
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga Default (opsional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                  <input
                    type="text"
                    value={newServiceData.default_price === 0 ? '' : newServiceData.default_price.toLocaleString('id-ID')}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\./g, '');
                      setNewServiceData(prev => ({ ...prev, default_price: parseFloat(value) || 0 }));
                    }}
                    onFocus={(e) => {
                      if (e.target.value === '0') e.target.value = '';
                    }}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Harga ini akan otomatis ter-isi saat layanan dipilih
                </p>
              </div>
            </div>

            {/* Modal Footer */}
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
                      fetchServices(); // Refresh services list
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
            {/* Modal Header */}
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

            {/* Modal Body */}
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
                    type="text"
                    value={editServiceData.default_price === 0 ? '' : editServiceData.default_price.toLocaleString('id-ID')}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\./g, '');
                      setEditServiceData(prev => ({ ...prev, default_price: parseFloat(value) || 0 }));
                    }}
                    onFocus={(e) => {
                      if (e.target.value === '0') e.target.value = '';
                    }}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
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
                      fetchServices(); // Refresh services list
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

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Tambah Klien Baru</h3>
              <button
                onClick={() => {
                  setShowAddClientModal(false);
                  setClientModalData({ id: null, name: '', phone: '', countryCode: '62', address: '' });
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
                  Nama Klien <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientModalData.name}
                  onChange={(e) => setClientModalData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Masukkan nama klien..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Telepon/WA <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <CountryCodeDropdown
                    value={clientModalData.countryCode}
                    onChange={(code) => setClientModalData(prev => ({ ...prev, countryCode: code }))}
                  />
                  <input
                    type="tel"
                    value={clientModalData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9+]/g, '');
                      setClientModalData(prev => ({ ...prev, phone: value }));
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
                  Alamat (opsional)
                </label>
                <textarea
                  value={clientModalData.address}
                  onChange={(e) => setClientModalData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Masukkan alamat klien..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddClientModal(false);
                  setClientModalData({ id: null, name: '', phone: '', countryCode: '62', address: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (!clientModalData.name.trim() || !clientModalData.phone.trim()) {
                    alert('Nama klien dan nomor telepon wajib diisi!');
                    return;
                  }

                  try {
                    // Format phone number with country code for WhatsApp
                    const formattedPhone = formatPhoneForWhatsApp(clientModalData.phone, clientModalData.countryCode);
                    
                    const response = await api.post('/user/clients', {
                      user_id: 2,
                      name: clientModalData.name,
                      phone: formattedPhone, // Save formatted phone
                      address: clientModalData.address,
                    });

                    if (response.data.success) {
                      alert('Klien berhasil ditambahkan!');
                      fetchClients();
                      setShowAddClientModal(false);
                      setClientModalData({ id: null, name: '', phone: '', countryCode: '62', address: '' });
                    } else {
                      throw new Error(response.data.message);
                    }
                  } catch (error) {
                    console.error('Error adding client:', error);
                    alert('Gagal menambahkan klien. Silakan coba lagi.');
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tambah Klien
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Klien</h3>
              <button
                onClick={() => {
                  setShowEditClientModal(false);
                  setClientModalData({ id: null, name: '', phone: '', countryCode: '62', address: '' });
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
                  Nama Klien <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientModalData.name}
                  onChange={(e) => setClientModalData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Masukkan nama klien..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Telepon/WA <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <CountryCodeDropdown
                    value={clientModalData.countryCode}
                    onChange={(code) => setClientModalData(prev => ({ ...prev, countryCode: code }))}
                  />
                  <input
                    type="tel"
                    value={clientModalData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9+]/g, '');
                      setClientModalData(prev => ({ ...prev, phone: value }));
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
                  Alamat (opsional)
                </label>
                <textarea
                  value={clientModalData.address}
                  onChange={(e) => setClientModalData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Masukkan alamat klien..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowEditClientModal(false);
                  setClientModalData({ id: null, name: '', phone: '', countryCode: '62', address: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (!clientModalData.name.trim() || !clientModalData.phone.trim()) {
                    alert('Nama klien dan nomor telepon wajib diisi!');
                    return;
                  }

                  try {
                    // Format phone number with country code for WhatsApp
                    const formattedPhone = formatPhoneForWhatsApp(clientModalData.phone, clientModalData.countryCode);
                    
                    const response = await api.put(`/user/clients/${clientModalData.id}`, {
                      name: clientModalData.name,
                      phone: formattedPhone, // Save formatted phone
                      address: clientModalData.address,
                    });

                    if (response.data.success) {
                      alert('Klien berhasil diupdate!');
                      fetchClients();
                      setShowEditClientModal(false);
                      setClientModalData({ id: null, name: '', phone: '', countryCode: '62', address: '' });
                      // Update form if edited client was selected
                      if (formData.client_id === clientModalData.id.toString()) {
                        setFormData(prev => ({
                          ...prev,
                          client_name: clientModalData.name,
                          contact: formattedPhone,
                          address: clientModalData.address,
                        }));
                      }
                    } else {
                      throw new Error(response.data.message);
                    }
                  } catch (error) {
                    console.error('Error updating client:', error);
                    alert('Gagal mengupdate klien. Silakan coba lagi.');
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

      {/* Add Responsible Party Modal */}
      {showAddResponsiblePartyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Tambah Penanggung Jawab Baru</h3>
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
                  Alamat (opsional)
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
                onClick={async () => {
                  if (!responsiblePartyModalData.name.trim() || !responsiblePartyModalData.phone.trim()) {
                    alert('Nama penanggung jawab dan nomor telepon wajib diisi!');
                    return;
                  }

                  try {
                    // Format phone number with country code for WhatsApp
                    const formattedPhone = formatPhoneForWhatsApp(responsiblePartyModalData.phone, responsiblePartyModalData.countryCode);
                    
                    const response = await api.post('/user/responsible-parties', {
                      user_id: 2,
                      name: responsiblePartyModalData.name,
                      phone: formattedPhone, // Save formatted phone
                      address: responsiblePartyModalData.address,
                    });

                    if (response.data.success) {
                      alert('Penanggung jawab berhasil ditambahkan!');
                      fetchResponsibleParties();
                      setShowAddResponsiblePartyModal(false);
                      setResponsiblePartyModalData({ id: null, name: '', phone: '', countryCode: '62', address: '' });
                    } else {
                      throw new Error(response.data.message);
                    }
                  } catch (error) {
                    console.error('Error adding responsible party:', error);
                    alert('Gagal menambahkan penanggung jawab. Silakan coba lagi.');
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tambah Penanggung Jawab
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Responsible Party Modal */}
      {showEditResponsiblePartyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Penanggung Jawab</h3>
              <button
                onClick={() => {
                  setShowEditResponsiblePartyModal(false);
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
                  Alamat (opsional)
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
                  setShowEditResponsiblePartyModal(false);
                  setResponsiblePartyModalData({ id: null, name: '', phone: '', countryCode: '62', address: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (!responsiblePartyModalData.name.trim() || !responsiblePartyModalData.phone.trim()) {
                    alert('Nama penanggung jawab dan nomor telepon wajib diisi!');
                    return;
                  }

                  try {
                    // Format phone number with country code for WhatsApp
                    const formattedPhone = formatPhoneForWhatsApp(responsiblePartyModalData.phone, responsiblePartyModalData.countryCode);
                    
                    const response = await api.put(`/user/responsible-parties/${responsiblePartyModalData.id}`, {
                      name: responsiblePartyModalData.name,
                      phone: formattedPhone, // Save formatted phone
                      address: responsiblePartyModalData.address,
                    });

                    if (response.data.success) {
                      alert('Penanggung jawab berhasil diupdate!');
                      fetchResponsibleParties();
                      setShowEditResponsiblePartyModal(false);
                      setResponsiblePartyModalData({ id: null, name: '', phone: '', countryCode: '62', address: '' });
                      // Update form if edited party was selected
                      setFormData(prev => ({
                        ...prev,
                        responsible_parties: prev.responsible_parties.map(rp => 
                          rp.id === responsiblePartyModalData.id 
                            ? { ...rp, name: responsiblePartyModalData.name, phone: formattedPhone, address: responsiblePartyModalData.address }
                            : rp
                        )
                      }));
                    } else {
                      throw new Error(response.data.message);
                    }
                  } catch (error) {
                    console.error('Error updating responsible party:', error);
                    alert('Gagal mengupdate penanggung jawab. Silakan coba lagi.');
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
    </>
  );
};

export default AddBookingModal;
