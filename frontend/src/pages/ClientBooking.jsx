import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FiUser, FiPhone, FiMapPin, FiCalendar, FiClock, FiPlus, FiMinus, FiCheck, FiPackage, FiFileText, FiX, FiSearch, FiChevronDown, FiTag } from 'react-icons/fi';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const ClientBooking = () => {
  const { userId, bookingCode } = useParams(); // Support both old userId and new bookingCode
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  
  // User/Company info
  const [userInfo, setUserInfo] = useState(null);
  const [services, setServices] = useState([]);
  const [bookingNames, setBookingNames] = useState([]);
  
  // Form data
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_country_code: '62',
    client_address: '',
    booking_name: '',
    booking_date: '',
    booking_date_end: '',
    booking_time: '',
    booking_time_end: '',
    location_name: '',
    location_map_url: '',
    notes: '',
    selected_services: []
  });
  
  const [errors, setErrors] = useState({});
  
  // Search & Filter states
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [showBookingNameDropdown, setShowBookingNameDropdown] = useState(false);
  const bookingNameRef = useRef(null);

  // Fetch user info and services
  // Fetch user info and services
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Use booking code endpoint if available (NEW), otherwise fallback to userId (OLD)
        const identifier = bookingCode || userId;
        const endpoint = bookingCode 
          ? `${API_URL}/public/booking/${bookingCode}/info`
          : `${API_URL}/public/user/${userId}/booking-info`;
        
        const response = await axios.get(endpoint);
        
        if (response.data.success) {
          setUserInfo(response.data.data.user);
          setServices(response.data.data.services);
          
          // NEW endpoint returns booking names in same response
          if (response.data.data.bookingNames) {
            setBookingNames(response.data.data.bookingNames);
          } else {
            // OLD endpoint - fetch booking names separately
            try {
              const bookingNamesResponse = await axios.get(`${API_URL}/public/user/${userId}/booking-names`);
              if (bookingNamesResponse.data.success) {
                setBookingNames(bookingNamesResponse.data.data || []);
              }
            } catch (err) {
              console.log('Could not fetch booking names:', err);
              // Non-critical, continue
            }
          }
        } else {
          setError('Gagal memuat data. Silakan coba lagi.');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response?.status === 404) {
          setError('Link booking tidak valid atau sudah tidak aktif.');
        } else {
          setError('Terjadi kesalahan. Silakan coba lagi nanti.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (bookingCode || userId) {
      fetchData();
    }
  }, [bookingCode, userId]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bookingNameRef.current && !bookingNameRef.current.contains(event.target)) {
        setShowBookingNameDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for phone number - only allow digits
    if (name === 'client_phone') {
      // Remove all non-digit characters
      let cleanedValue = value.replace(/\D/g, '');
      
      // If starts with 0, remove it (e.g., 0812 -> 812)
      if (cleanedValue.startsWith('0')) {
        cleanedValue = cleanedValue.substring(1);
      }
      
      setFormData(prev => ({ ...prev, [name]: cleanedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleBookingNameChange = (value) => {
    setFormData(prev => ({ ...prev, booking_name: value }));
    setShowBookingNameDropdown(true);
    
    // Clear error
    if (errors.booking_name) {
      setErrors(prev => ({ ...prev, booking_name: '' }));
    }
  };
  
  const selectBookingName = (name) => {
    setFormData(prev => ({ ...prev, booking_name: name }));
    setShowBookingNameDropdown(false);
  };
  
  // Filter booking names based on input
  const filteredBookingNames = bookingNames.filter(name => 
    name.toLowerCase().includes(formData.booking_name.toLowerCase())
  );

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => {
      const existing = prev.selected_services.find(s => s.service_id === serviceId);
      
      if (existing) {
        return {
          ...prev,
          selected_services: prev.selected_services.filter(s => s.service_id !== serviceId)
        };
      } else {
        const service = services.find(s => s.id === serviceId);
        return {
          ...prev,
          selected_services: [
            ...prev.selected_services,
            {
              service_id: serviceId,
              service_name: service.name,
              default_price: service.default_price,
              quantity: 1
            }
          ]
        };
      }
    });
  };

  const handleQuantityChange = (serviceId, delta) => {
    setFormData(prev => ({
      ...prev,
      selected_services: prev.selected_services.map(s => {
        if (s.service_id === serviceId) {
          const newQty = Math.max(1, (s.quantity || 1) + delta);
          return { ...s, quantity: newQty };
        }
        return s;
      })
    }));
  };
  
  // Filter services based on search term
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
    (service.description && service.description.toLowerCase().includes(serviceSearchTerm.toLowerCase()))
  );

  const validate = () => {
    const newErrors = {};
    
    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Nama wajib diisi';
    }
    
    if (!formData.client_phone.trim()) {
      newErrors.client_phone = 'Nomor telepon wajib diisi';
    } else if (!/^[0-9]{8,15}$/.test(formData.client_phone)) {
      newErrors.client_phone = 'Nomor telepon harus 8-15 digit angka';
    }
    
    if (!formData.booking_date) {
      newErrors.booking_date = 'Tanggal booking wajib diisi';
    }
    
    if (formData.selected_services.length === 0) {
      newErrors.services = 'Pilih minimal satu layanan';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous error
    setError(null);
    
    if (!validate()) {
      console.log('Validation failed:', errors);
      return;
    }
    
    try {
      setSubmitting(true);
      
      const submitData = {
        client_name: formData.client_name,
        client_phone: formData.client_phone, // Already cleaned (no leading 0)
        client_country_code: formData.client_country_code,
        client_address: formData.client_address,
        booking_name: formData.booking_name.trim() || null,
        booking_date: formData.booking_date,
        booking_date_end: formData.booking_date_end || null,
        booking_time: formData.booking_time || null,
        booking_time_end: formData.booking_time_end || null,
        location_name: formData.location_name,
        location_map_url: formData.location_map_url,
        selected_services: formData.selected_services,
        notes: formData.notes
      };
      
      // Use new booking code endpoint if available, otherwise old endpoint
      let response;
      if (bookingCode) {
        console.log('Submitting via booking code:', bookingCode);
        response = await axios.post(`${API_URL}/public/booking/${bookingCode}/submit`, submitData);
      } else {
        console.log('Submitting via user ID (OLD):', userId);
        submitData.user_id = parseInt(userId);
        response = await axios.post(`${API_URL}/public/client-submission`, submitData);
      }
      
      console.log('Response:', response.data);
      
      if (response.data.success) {
        setSubmitted(true);
      } else {
        setError(response.data.message || 'Gagal mengirim booking');
      }
    } catch (err) {
      console.error('Error submitting:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiX className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          {userInfo?.logo && (
            <img 
              src={userInfo.logo} 
              alt={userInfo.companyName} 
              className="w-24 h-24 object-contain mx-auto mb-4"
            />
          )}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Terima Kasih!</h2>
          <p className="text-gray-600 mb-4">
            Booking Anda telah berhasil dikirim ke <strong>{userInfo?.companyName}</strong>.
          </p>
          <p className="text-sm text-gray-500">
            Kami akan segera menghubungi Anda untuk konfirmasi.
          </p>
          
          {userInfo?.phone && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">Hubungi kami:</p>
              <a 
                href={`https://wa.me/${userInfo.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <FiPhone size={16} />
                WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 sm:py-8 px-2 sm:px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Company Info */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 text-center">
          {userInfo?.logo && (
            <img 
              src={userInfo.logo} 
              alt={userInfo.companyName} 
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto mb-2 sm:mb-3"
            />
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{userInfo?.companyName}</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Form Booking Online</p>
          {userInfo?.address && (
            <p className="text-gray-400 text-xs mt-2 flex items-center justify-center gap-1">
              <FiMapPin size={12} />
              {userInfo.address}
            </p>
          )}
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
          {error && (
            <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* Client Information */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiUser className="text-blue-500 w-4 h-4 sm:w-5 sm:h-5" />
              Informasi Anda
            </h2>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="client_name"
                value={formData.client_name}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap"
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.client_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.client_name && (
                <p className="text-red-500 text-xs mt-1">{errors.client_name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Nomor Telepon <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  name="client_country_code"
                  value={formData.client_country_code}
                  onChange={handleChange}
                  className="px-2 sm:px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="62">+62</option>
                  <option value="1">+1</option>
                  <option value="44">+44</option>
                  <option value="60">+60</option>
                  <option value="65">+65</option>
                </select>
                <input
                  type="text"
                  inputMode="numeric"
                  name="client_phone"
                  value={formData.client_phone}
                  onChange={handleChange}
                  placeholder="812xxxxxxxx"
                  maxLength="15"
                  className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.client_phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.client_phone && (
                <p className="text-red-500 text-xs mt-1">{errors.client_phone}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Contoh: 812xxxxxxxx (tanpa 0 di depan)
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Alamat
              </label>
              <textarea
                name="client_address"
                value={formData.client_address}
                onChange={handleChange}
                placeholder="Masukkan alamat lengkap (opsional)"
                rows={2}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            
            {/* Nama Booking dengan Dropdown */}
            <div className="relative" ref={bookingNameRef}>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Nama Booking
                <span className="text-gray-400 font-normal ml-1 text-xs">(Opsional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="booking_name"
                  value={formData.booking_name}
                  onChange={(e) => handleBookingNameChange(e.target.value)}
                  onFocus={() => setShowBookingNameDropdown(true)}
                  placeholder="Contoh: Pernikahan Andi & Sari, Ulang Tahun Perusahaan..."
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-10 ${
                    errors.booking_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <FiTag className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              {errors.booking_name && (
                <p className="text-red-500 text-xs mt-1">{errors.booking_name}</p>
              )}
              
              {/* Dropdown Booking Names */}
              {showBookingNameDropdown && filteredBookingNames.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <div className="p-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <FiTag size={12} />
                      Pilih dari nama booking sebelumnya:
                    </p>
                  </div>
                  {filteredBookingNames.map((name, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectBookingName(name)}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors text-sm text-gray-700 flex items-center gap-2"
                    >
                      <FiTag size={14} className="text-blue-500 flex-shrink-0" />
                      <span className="truncate">{name}</span>
                    </button>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                💡 Ketik nama booking baru atau pilih dari yang sudah ada
              </p>
            </div>
          </div>

          {/* Services Selection */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiPackage className="text-blue-500 w-4 h-4 sm:w-5 sm:h-5" />
              Pilih Layanan <span className="text-red-500">*</span>
            </h2>
            
            {errors.services && (
              <p className="text-red-500 text-xs sm:text-sm">{errors.services}</p>
            )}
            
            {/* Search Bar for Services */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Cari layanan..."
                value={serviceSearchTerm}
                onChange={(e) => setServiceSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {serviceSearchTerm && (
                <button
                  type="button"
                  onClick={() => setServiceSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX size={18} />
                </button>
              )}
            </div>
            
            {/* Selected Services Count */}
            {formData.selected_services.length > 0 && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 sm:px-4 py-2">
                <span className="text-xs sm:text-sm text-blue-700 font-medium">
                  {formData.selected_services.length} layanan dipilih
                </span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, selected_services: [] }))}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Hapus semua
                </button>
              </div>
            )}
            
            {/* Services Grid with Scroll */}
            <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-1 sm:pr-2 space-y-2 sm:space-y-3 custom-scrollbar">
              {filteredServices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiPackage size={36} className="sm:w-12 sm:h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm sm:text-base">Tidak ada layanan ditemukan</p>
                  {serviceSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setServiceSearchTerm('')}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      Hapus pencarian
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredServices.map(service => {
                    const isSelected = formData.selected_services.some(s => s.service_id === service.id);
                    const selectedService = formData.selected_services.find(s => s.service_id === service.id);
                    
                    return (
                      <div
                        key={service.id}
                        className={`p-3 sm:p-4 border-2 rounded-lg sm:rounded-xl cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleServiceToggle(service.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-800 text-sm sm:text-base truncate">{service.name}</h3>
                            {service.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{service.description}</p>
                            )}
                            <p className="text-xs sm:text-sm text-blue-600 font-semibold mt-2">
                              Rp {service.default_price?.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected ? 'bg-blue-500 scale-110' : 'bg-gray-200'
                          }`}>
                            {isSelected && <FiCheck className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm text-gray-600 font-medium">Jumlah:</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(service.id, -1);
                                  }}
                                  disabled={selectedService?.quantity <= 1}
                                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                                    selectedService?.quantity <= 1
                                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                  }`}
                                >
                                  <FiMinus size={12} className="sm:w-3.5 sm:h-3.5" />
                                </button>
                                <span className="w-8 sm:w-10 text-center font-bold text-blue-600 text-sm sm:text-base">
                                  {selectedService?.quantity || 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(service.id, 1);
                                  }}
                                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all"
                                >
                                  <FiPlus size={12} className="sm:w-3.5 sm:h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="mt-2 text-right">
                              <span className="text-xs text-gray-500">Subtotal: </span>
                              <span className="text-xs sm:text-sm font-bold text-blue-600">
                                Rp {((service.default_price || 0) * (selectedService?.quantity || 1)).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Show count of total vs filtered */}
            {serviceSearchTerm && (
              <p className="text-xs text-gray-500 text-center">
                Menampilkan {filteredServices.length} dari {services.length} layanan
              </p>
            )}
          </div>

          {/* Booking Information */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiCalendar className="text-blue-500 w-4 h-4 sm:w-5 sm:h-5" />
              Informasi Booking
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="booking_date"
                  value={formData.booking_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.booking_date ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.booking_date && (
                  <p className="text-red-500 text-xs mt-1">{errors.booking_date}</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  name="booking_date_end"
                  value={formData.booking_date_end}
                  onChange={handleChange}
                  min={formData.booking_date || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Jam Mulai
                </label>
                <input
                  type="time"
                  name="booking_time"
                  value={formData.booking_time}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Jam Selesai
                </label>
                <input
                  type="time"
                  name="booking_time_end"
                  value={formData.booking_time_end}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiMapPin className="text-blue-500 w-4 h-4 sm:w-5 sm:h-5" />
              Lokasi
            </h2>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Nama Lokasi / Venue
              </label>
              <input
                type="text"
                name="location_name"
                value={formData.location_name}
                onChange={handleChange}
                placeholder="Contoh: Gedung ABC, Ballroom Lt. 2"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Link Google Maps
              </label>
              <input
                type="url"
                name="location_map_url"
                value={formData.location_map_url}
                onChange={handleChange}
                placeholder="https://maps.google.com/..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiFileText className="text-blue-500" />
              Catatan Tambahan
            </h2>
            
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Tuliskan catatan atau permintaan khusus..."
              rows={3}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Selected Services Summary */}
          {formData.selected_services.length > 0 && (
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-2 sm:mb-3">Ringkasan Layanan</h3>
              <div className="space-y-1.5 sm:space-y-2">
                {formData.selected_services.map(s => (
                  <div key={s.service_id} className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">
                      {s.service_name} x {s.quantity}
                    </span>
                    <span className="font-medium text-gray-800">
                      Rp {((s.default_price || 0) * (s.quantity || 1)).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-semibold text-sm sm:text-base">
                  <span>Estimasi Total</span>
                  <span className="text-blue-600">
                    Rp {formData.selected_services.reduce((sum, s) => 
                      sum + ((s.default_price || 0) * (s.quantity || 1)), 0
                    ).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Harga final akan dikonfirmasi oleh {userInfo?.companyName}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-white text-sm sm:text-base transition-all ${
              submitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Mengirim...
              </span>
            ) : (
              'Kirim Booking'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-4 sm:mt-6 text-xs sm:text-sm text-gray-500">
          <p>Powered by <strong>Catat Jasamu</strong></p>
        </div>
      </div>
    </div>
  );
};

export default ClientBooking;