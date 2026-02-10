import React, { useState, useEffect, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { FiCalendar, FiX, FiPlus, FiEdit3, FiTrash2, FiLoader, FiExternalLink, FiRefreshCw, FiLogOut, FiAlertCircle, FiCheckCircle, FiSearch, FiChevronDown, FiChevronLeft, FiChevronRight, FiClock, FiMapPin, FiInfo, FiLock, FiUser, FiStar } from 'react-icons/fi';
import authService from '../../services/authService';
import api from '../../services/api';
import './GoogleCalendar.css';

const GoogleCalendar = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [holidayEvents, setHolidayEvents] = useState([]);
  const [showHolidays, setShowHolidays] = useState(true);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [needsRelogin, setNeedsRelogin] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    summary: '',
    description: '',
    startDateTime: '',
    endDateTime: '',
    location: ''
  });
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchDate, setSearchDate] = useState('');
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [syncCount, setSyncCount] = useState(0);
  const calendarRef = useRef(null);
  const refreshIntervalRef = useRef(null);
  const holidaysLoadedRef = useRef(false);

  // Generate year options (10 years back and 10 years forward)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  
  // Month names in Indonesian
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  useEffect(() => {
    if (isOpen) {
      checkGoogleAuth();
      // Clear messages when opening
      setError(null);
      setSuccessMessage(null);
    } else {
      // Reset holidays loaded flag when modal closes
      holidaysLoadedRef.current = false;
    }
  }, [isOpen]);

  // Auto-refresh calendar events every 2 minutes when connected
  useEffect(() => {
    if (isConnected && isOpen && !needsReconnect) {
      // Initial load
      loadCalendarEvents();

      // Set up auto-refresh every 2 minutes
      refreshIntervalRef.current = setInterval(() => {
        if (isConnected && !isLoading && !needsReconnect) {
          setIsAutoRefreshing(true);
          setSyncStatus('syncing');
          loadCalendarEvents().finally(() => {
            setIsAutoRefreshing(false);
          });
        }
      }, 2 * 60 * 1000); // 2 minutes

      // Refresh when window gets focus
      const handleWindowFocus = () => {
        if (isConnected && !isLoading && !needsReconnect) {
          loadCalendarEvents();
        }
      };

      window.addEventListener('focus', handleWindowFocus);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
        window.removeEventListener('focus', handleWindowFocus);
      };
    } else {
      // Clear interval when not connected or closed
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isConnected, isOpen, needsReconnect]);

  const checkGoogleAuth = async () => {
    try {
      const user = authService.getCurrentUser();
      console.log('🔍 Google Calendar - Current user:', user);

      // Check if user logged in via Google (check both auth_provider and provider fields)
      const isGoogleUser = user && (
        user.auth_provider === 'google' || 
        user.provider === 'google'
      );
      
      if (isGoogleUser) {
        setIsAuthenticated(true);
        setUserEmail(user.email || user.google_email || '');
        await checkCalendarConnection();
      } else {
        setIsAuthenticated(false);
        setError('Fitur Google Calendar hanya tersedia untuk user yang login menggunakan akun Google');
      }
    } catch (err) {
      console.error('Error checking Google auth:', err);
      setError('Gagal memeriksa autentikasi Google');
    }
  };

  const checkCalendarConnection = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First check connection status via dedicated endpoint
      const statusResponse = await api.get('/user/google-calendar/status');
      
      if (statusResponse.data.success) {
        const status = statusResponse.data.data;
        setConnectionStatus(status);
        
        if (status.connected) {
          if (status.needsReconnect) {
            setNeedsReconnect(true);
            setIsConnected(false);
            setError('Koneksi Google Calendar kadaluarsa. Silakan hubungkan ulang.');
          } else {
            setIsConnected(true);
            setNeedsReconnect(false);
            // Load events will be triggered by useEffect
          }
        } else {
          setIsConnected(false);
          setError('Belum terhubung ke Google Calendar');
        }
      }
    } catch (err) {
      console.error('Error checking calendar connection:', err);
      setIsConnected(false);
      
      // Check specific error codes
      const errorCode = err.response?.data?.errorCode;
      const statusCode = err.response?.status;
      
      if (errorCode === 'NEEDS_RECONNECT') {
        setNeedsReconnect(true);
        setError('Koneksi Google Calendar kadaluarsa. Silakan hubungkan ulang.');
      } else if (statusCode === 401 && errorCode === 'NOT_CONNECTED') {
        // User not connected to Google Calendar - this is normal, not an error
        setError('Belum terhubung ke Google Calendar');
      } else if (statusCode === 401) {
        // Token issue specific to Google Calendar, not main auth
        setError('Belum terhubung ke Google Calendar. Silakan hubungkan akun Anda.');
      } else {
        setError('Belum terhubung ke Google Calendar');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSyncStatus('syncing');

      // CRITICAL FIX: Load entire year + next year to ensure all months are visible
      // Previous bug: Only loaded 3 months forward, causing June-December to be empty!
      const currentYear = new Date().getFullYear();
      const timeMin = new Date(currentYear, 0, 1); // January 1st of current year
      const timeMax = new Date(currentYear + 1, 11, 31, 23, 59, 59); // December 31st of next year

      console.log('📅 Loading Google Calendar events:', {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        range: `${currentYear} - ${currentYear + 1}`,
        totalMonths: 24
      });

      const response = await api.get('/user/google-calendar/events', {
        params: {
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          maxResults: 500 // Increased for full year coverage
        }
      });

      if (response.data.success) {
        const events = response.data.data.events || [];
        
        console.log(`✅ Loaded ${events.length} events from Google Calendar`);
        
        // Transform events for FullCalendar
        const formattedEvents = events.map(event => {
          const eventColor = getEventColor(event);
          return {
            id: event.id,
            title: event.summary || '(Tanpa Judul)',
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
            allDay: !event.start?.dateTime, // All day if no time specified
            description: event.description,
            location: event.location,
            backgroundColor: eventColor,
            borderColor: eventColor,
            textColor: '#ffffff',
            extendedProps: {
              description: event.description,
              location: event.location,
              status: event.status,
              htmlLink: event.htmlLink,
              isHoliday: false
            }
          };
        });

        setCalendarEvents(formattedEvents);
        setLastRefresh(new Date());
        setSyncStatus('success');
        setSyncCount(prev => prev + 1);
        
        // CRITICAL FIX: Always load holidays for the same range (removed ref check)
        // Previous bug: holidaysLoadedRef prevented reloading when navigating months
        if (showHolidays) {
          console.log('📅 Loading Indonesian holidays...');
          await loadHolidayEvents(timeMin, timeMax);
        }
        
        // Clear success status after 3 seconds
        setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Gagal memuat events calendar');
      }
    } catch (err) {
      console.error('Error loading calendar events:', err);
      setSyncStatus('error');

      const errorMessage = err.response?.data?.message || err.message || 'Gagal memuat events calendar';
      const errorCode = err.response?.data?.errorCode;

      if (errorCode === 'NEEDS_RECONNECT' || errorMessage.includes('expired') || errorMessage.includes('invalid_grant')) {
        setNeedsReconnect(true);
        setIsConnected(false);
        setError('Koneksi Google Calendar kadaluarsa. Silakan hubungkan ulang.');
      } else if (errorCode === 'NOT_CONNECTED' || errorMessage.includes('not connected')) {
        setIsConnected(false);
        setError('Belum terhubung ke Google Calendar');
      } else if (err.response?.status === 403 && errorMessage.includes('insufficient authentication scopes')) {
        setNeedsRelogin(true);
        setIsConnected(false);
        setError('Izin akses Google Calendar tidak cukup. Silakan login ulang untuk memberikan izin calendar.');
      } else {
        setError(errorMessage);
      }
      throw err; // Re-throw for checkCalendarConnection
    } finally {
      setIsLoading(false);
    }
  };

  const getEventColor = (event) => {
    // Google Calendar-like color palette
    const colors = [
      '#039BE5', // Blue
      '#7986CB', // Indigo
      '#33B679', // Green
      '#8E24AA', // Purple
      '#E67C73', // Red
      '#F6BF26', // Yellow
      '#F4511E', // Orange
      '#039BE5', // Light Blue
      '#616161', // Gray
      '#3F51B5', // Dark Blue
      '#0B8043', // Dark Green
      '#D50000', // Dark Red
    ];

    // Use event title or a hash of the event ID to determine color
    const seed = event.id ? event.id.charCodeAt(0) + event.id.length : Math.random() * 1000;
    return colors[Math.floor(seed) % colors.length];
  };

  const connectGoogleCalendar = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setNeedsReconnect(false);

      const response = await api.get('/user/google-calendar/auth-url');

      if (response.data.success) {
        console.log('🔗 Redirecting to Google OAuth:', response.data.data.authUrl);
        onClose(); // Close the modal
        setTimeout(() => {
          window.location.href = response.data.data.authUrl;
        }, 100);
      } else {
        throw new Error(response.data.message || 'Gagal mendapatkan URL otorisasi');
      }
    } catch (err) {
      console.error('Error getting auth URL:', err);
      setError('Gagal menghubungkan Google Calendar. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post('/user/google-calendar/disconnect');

      if (response.data.success) {
        setIsConnected(false);
        setCalendarEvents([]);
        setHolidayEvents([]);
        holidaysLoadedRef.current = false;
        setConnectionStatus(null);
        setNeedsReconnect(false);
        setSuccessMessage('Google Calendar berhasil diputuskan');
        setShowDisconnectConfirm(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Gagal memutuskan koneksi');
      }
    } catch (err) {
      console.error('Error disconnecting calendar:', err);
      setError('Gagal memutuskan koneksi Google Calendar. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const manualRefresh = async () => {
    if (isLoading || isAutoRefreshing) return;
    
    try {
      await loadCalendarEvents();
      setSuccessMessage('Calendar berhasil diperbarui');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      // Error already handled in loadCalendarEvents
    }
  };

  const handleRelogin = () => {
    // Logout current session and redirect to login
    authService.logout();
    window.location.href = '/login?message=Silakan login ulang untuk memberikan izin Google Calendar';
  };

  const handleDateSelect = (selectInfo) => {
    // Create Date objects from the selection
    const startDate = selectInfo.start;
    const endDate = selectInfo.end;

    // Format for datetime-local input (yyyy-MM-ddThh:mm format)
    const formatForDateTimeLocal = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const formattedStart = formatForDateTimeLocal(startDate);
    const formattedEnd = formatForDateTimeLocal(endDate);

    setEventForm({
      summary: '',
      description: '',
      startDateTime: formattedStart,
      endDateTime: formattedEnd,
      location: ''
    });
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    const isHoliday = event.extendedProps?.isHoliday;
    
    // If it's a holiday, show detail modal (read-only)
    if (isHoliday) {
      setViewingEvent(event);
      setShowEventDetails(true);
      return;
    }
    
    // For regular events, open edit modal
    setSelectedEvent(event);

    // Format for datetime-local input (yyyy-MM-ddThh:mm format)
    const formatForDateTimeLocal = (date) => {
      if (!date) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setEventForm({
      summary: event.title,
      description: event.extendedProps.description || '',
      startDateTime: formatForDateTimeLocal(event.start),
      endDateTime: formatForDateTimeLocal(event.end || event.start),
      location: event.extendedProps.location || ''
    });
    setShowEventModal(true);
  };

  // Check if event is a holiday (protected)
  const isHolidayEvent = (event) => {
    return event?.extendedProps?.isHoliday === true;
  };

  // Format date for display
  const formatDisplayDate = (date, allDay = false) => {
    if (!date) return '';
    const d = new Date(date);
    const options = allDay 
      ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      : { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return d.toLocaleDateString('id-ID', options);
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!eventForm.summary.trim()) {
      setError('Judul event harus diisi');
      return;
    }

    if (!eventForm.startDateTime || !eventForm.endDateTime) {
      setError('Waktu mulai dan selesai harus diisi');
      return;
    }

    const startDate = new Date(eventForm.startDateTime);
    const endDate = new Date(eventForm.endDateTime);

    if (endDate <= startDate) {
      setError('Waktu selesai harus setelah waktu mulai');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // CRITICAL FIX: Format datetime properly for API without timezone conversion
      const formatDateTimeForAPI = (dateTimeLocal) => {
        // datetime-local format: "2025-08-17T10:30"
        // PROBLEM: new Date(dateTimeLocal).toISOString() causes timezone shift!
        // SOLUTION: Build RFC3339 string directly with explicit timezone
        
        // Input example: "2025-08-17T10:30"
        // Output needed: "2025-08-17T10:30:00+07:00"
        
        if (!dateTimeLocal || !dateTimeLocal.includes('T')) {
          console.error('Invalid datetime format:', dateTimeLocal);
          return dateTimeLocal;
        }
        
        // Simply append seconds and timezone - NO Date conversion!
        return `${dateTimeLocal}:00+07:00`;
      };

      const eventData = {
        summary: eventForm.summary.trim(),
        description: eventForm.description.trim(),
        startDateTime: formatDateTimeForAPI(eventForm.startDateTime),
        endDateTime: formatDateTimeForAPI(eventForm.endDateTime),
        location: eventForm.location.trim(),
        timeZone: 'Asia/Jakarta'
      };

      let response;
      if (selectedEvent) {
        // Update existing event
        response = await api.put(`/user/google-calendar/events/${selectedEvent.id}`, eventData);
      } else {
        // Create new event
        response = await api.post('/user/google-calendar/events', eventData);
      }

      if (response.data.success) {
        // Immediately refresh calendar events after successful operation
        await loadCalendarEvents();
        setShowEventModal(false);
        setEventForm({
          summary: '',
          description: '',
          startDateTime: '',
          endDateTime: '',
          location: ''
        });
        setSelectedEvent(null);
        setSuccessMessage(selectedEvent ? 'Event berhasil diperbarui' : 'Event berhasil dibuat');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.data.message || 'Gagal menyimpan event');
      }
    } catch (err) {
      console.error('Error saving event:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menyimpan event. Silakan coba lagi.';
      
      // Check if needs reconnect
      if (err.response?.data?.errorCode === 'NEEDS_RECONNECT') {
        setNeedsReconnect(true);
        setShowEventModal(false);
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventDelete = async () => {
    if (!selectedEvent) return;

    if (!confirm('Apakah Anda yakin ingin menghapus event ini?')) return;

    try {
      setIsLoading(true);

      const response = await api.delete(`/user/google-calendar/events/${selectedEvent.id}`);

      if (response.data.success) {
        // Immediately refresh calendar events after successful deletion
        await loadCalendarEvents();
        setShowEventModal(false);
        setSelectedEvent(null);
        setSuccessMessage('Event berhasil dihapus');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.data.message || 'Gagal menghapus event');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      
      // Check if needs reconnect
      if (err.response?.data?.errorCode === 'NEEDS_RECONNECT') {
        setNeedsReconnect(true);
        setShowEventModal(false);
      }
      
      setError('Gagal menghapus event. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const openEventInGoogle = (event) => {
    if (event?.extendedProps?.htmlLink) {
      window.open(event.extendedProps.htmlLink, '_blank', 'noopener,noreferrer');
    }
  };

  const openGoogleCalendar = () => {
    window.open('https://calendar.google.com', '_blank', 'noopener,noreferrer');
  };

  // Navigate to specific date
  const goToDate = (date) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(date);
    }
  };

  // Handle month/year selection
  const handleMonthYearChange = () => {
    const newDate = new Date(selectedYear, selectedMonth, 1);
    goToDate(newDate);
    setShowDatePicker(false);
  };

  // Handle direct date search
  const handleDateSearch = () => {
    if (searchDate) {
      const date = new Date(searchDate);
      if (!isNaN(date.getTime())) {
        goToDate(date);
        setSearchDate('');
      }
    }
  };

  // Go to today
  const goToToday = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
    }
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
  };

  // Update selected month/year when calendar view changes
  const handleDatesSet = (dateInfo) => {
    const currentDate = dateInfo.view.currentStart;
    setSelectedMonth(currentDate.getMonth());
    setSelectedYear(currentDate.getFullYear());
    setCurrentView(dateInfo.view.type);
  };

  // Navigate calendar
  const navigateCalendar = (direction) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      if (direction === 'prev') {
        calendarApi.prev();
      } else if (direction === 'next') {
        calendarApi.next();
      }
    }
  };

  // Change view
  const changeView = (viewName) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(viewName);
      setCurrentView(viewName);
    }
  };

  // Get all events combined with proper sorting
  const getAllEvents = useCallback(() => {
    const combined = [...calendarEvents, ...(showHolidays ? holidayEvents : [])];
    return combined.sort((a, b) => new Date(a.start) - new Date(b.start));
  }, [calendarEvents, holidayEvents, showHolidays]);

  // Load holiday events from Indonesian holiday calendar
  const loadHolidayEvents = async (timeMin, timeMax) => {
    try {
      setIsLoadingHolidays(true);
      
      // Indonesian holiday calendar ID
      const holidayCalendarId = 'id.indonesian#holiday@group.v.calendar.google.com';
      
      console.log('🎊 Fetching Indonesian holidays:', {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString()
      });
      
      const response = await api.get('/user/google-calendar/holidays', {
        params: {
          calendarId: holidayCalendarId,
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          maxResults: 100
        }
      });

      if (response.data.success) {
        const holidays = response.data.data.events || [];
        console.log(`✅ Loaded ${holidays.length} Indonesian holidays`);
        
        // Transform holiday events for FullCalendar
        const formattedHolidays = holidays.map(event => ({
          id: `holiday-${event.id}`,
          title: event.summary || 'Hari Libur',
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          allDay: true, // Holidays are always all-day events
          backgroundColor: '#dc2626', // Red color for holidays
          borderColor: '#dc2626',
          textColor: '#ffffff',
          className: 'holiday-event',
          extendedProps: {
            description: event.description,
            location: event.location,
            status: event.status,
            htmlLink: event.htmlLink,
            isHoliday: true,
            holidayType: 'national'
          }
        }));

        setHolidayEvents(formattedHolidays);
      } else {
        console.log('Could not load holiday events:', response.data.message);
        setHolidayEvents([]);
      }
    } catch (err) {
      console.error('Error loading holiday events:', err);
      // Don't show error for holidays, just log it
      setHolidayEvents([]);
    } finally {
      setIsLoadingHolidays(false);
    }
  };

  // Toggle holiday display
  const toggleHolidays = async () => {
    const newShowHolidays = !showHolidays;
    setShowHolidays(newShowHolidays);
    
    if (newShowHolidays) {
      // Load holidays if enabling
      const timeMin = new Date();
      timeMin.setMonth(timeMin.getMonth() - 1);
      const timeMax = new Date();
      timeMax.setMonth(timeMax.getMonth() + 3);
      
      await loadHolidayEvents(timeMin, timeMax);
    } else {
      // Clear holidays if disabling
      setHolidayEvents([]);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 xs:p-2 sm:p-4">
        <div className="bg-white rounded-lg xs:rounded-xl shadow-2xl w-full max-w-7xl max-h-[98vh] xs:max-h-[95vh] overflow-hidden flex flex-col">
          {/* Google Calendar Style Header */}
          <div className="bg-white border-b border-gray-200 px-2 xs:px-3 sm:px-4 py-2 xs:py-3">
            <div className="flex items-center justify-between">
              {/* Left: Logo & Title */}
              <div className="flex items-center gap-2 xs:gap-3">
                <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg xs:rounded-xl flex items-center justify-center shadow-lg">
                  <FiCalendar className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm xs:text-base sm:text-xl font-semibold text-gray-800 flex items-center gap-1 xs:gap-2">
                    <span className="hidden xs:inline">Google Calendar</span>
                    <span className="xs:hidden">GCal</span>
                    {isConnected && (
                      <span className="inline-flex items-center px-1.5 xs:px-2 py-0.5 rounded-full text-[10px] xs:text-xs font-medium bg-green-100 text-green-800">
                        <span className="w-1 xs:w-1.5 h-1 xs:h-1.5 bg-green-500 rounded-full mr-0.5 xs:mr-1 animate-pulse"></span>
                        <span className="hidden xs:inline">Tersambung</span>
                        <span className="xs:hidden">OK</span>
                      </span>
                    )}
                  </h2>
                  {userEmail && (
                    <p className="text-[10px] xs:text-xs text-gray-500 flex items-center gap-1 truncate max-w-[120px] xs:max-w-[180px] sm:max-w-none">
                      <FiUser className="w-2.5 h-2.5 xs:w-3 xs:h-3 flex-shrink-0" />
                      <span className="truncate">{userEmail}</span>
                    </p>
                  )}
                </div>
              </div>
              
              {/* Right: Sync Status & Close */}
              <div className="flex items-center gap-1 xs:gap-2 sm:gap-3">
                {isConnected && (
                  <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                    {syncStatus === 'syncing' && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <FiRefreshCw className="w-3 h-3 animate-spin" />
                        Menyinkronkan...
                      </span>
                    )}
                    {syncStatus === 'success' && (
                      <span className="flex items-center gap-1 text-green-600">
                        <FiCheckCircle className="w-3 h-3" />
                        Tersinkron
                      </span>
                    )}
                    {lastRefresh && syncStatus === 'idle' && (
                      <span className="text-gray-400">
                        Update: {lastRefresh.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 xs:p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Tutup"
                >
                  <FiX className="w-4 h-4 xs:w-5 xs:h-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-2 xs:p-3 sm:p-4 overflow-y-auto max-h-[calc(95vh-80px)] xs:max-h-[calc(90vh-100px)] sm:max-h-[calc(90vh-120px)]">
            {!isAuthenticated ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCalendar className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Akses Terbatas</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-4">
                  Fitur Google Calendar hanya tersedia untuk user yang login menggunakan akun Google.
                </p>
                <button
                  onClick={() => window.location.href = '/login'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Login dengan Google
                </button>
              </div>
            ) : isLoading && !isConnected ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiLoader className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Memuat Calendar</h3>
                <p className="text-gray-600">Mohon tunggu sebentar...</p>
              </div>
            ) : !isConnected ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCalendar className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar Belum Terhubung</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-4">
                  Untuk menggunakan fitur Google Calendar, Anda perlu memberikan izin akses ke akun Google Calendar Anda.
                </p>
                <button
                  onClick={connectGoogleCalendar}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Hubungkan Google Calendar
                </button>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Success Message */}
                {successMessage && (
                  <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 animate-fade-in">
                    <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-green-700 text-sm">{successMessage}</p>
                  </div>
                )}

                {/* Needs Reconnect Warning */}
                {needsReconnect && (
                  <div className="mx-4 mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FiAlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-medium text-orange-800">Koneksi Kadaluarsa</h4>
                        <p className="text-sm text-orange-700 mt-1">
                          Koneksi ke Google Calendar telah kadaluarsa. Silakan hubungkan ulang untuk melanjutkan.
                        </p>
                        <button
                          onClick={connectGoogleCalendar}
                          className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Menghubungkan...' : 'Hubungkan Ulang'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Needs Relogin Warning */}
                {needsRelogin && (
                  <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-medium text-red-800">Izin Tidak Cukup</h4>
                        <p className="text-sm text-red-700 mt-1">
                          Izin akses Google Calendar tidak cukup. Silakan login ulang untuk memberikan izin calendar.
                        </p>
                        <button
                          onClick={handleRelogin}
                          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Login Ulang
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Google Calendar Style Toolbar */}
                <div className="px-2 xs:px-3 sm:px-4 py-2 xs:py-3 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex flex-wrap items-center justify-between gap-2 xs:gap-3">
                    {/* Left: Navigation */}
                    <div className="flex items-center gap-1 xs:gap-2">
                      {/* Today Button */}
                      <button
                        onClick={goToToday}
                        className="px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 bg-white border border-gray-300 text-gray-700 rounded-md xs:rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all text-[10px] xs:text-xs sm:text-sm font-medium shadow-sm"
                      >
                        <span className="hidden xs:inline">Hari Ini</span>
                        <span className="xs:hidden">Hari</span>
                      </button>
                      
                      {/* Navigation Arrows */}
                      <div className="flex items-center">
                        <button
                          onClick={() => navigateCalendar('prev')}
                          className="p-1 xs:p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                          title="Sebelumnya"
                        >
                          <FiChevronLeft className="w-4 h-4 xs:w-5 xs:h-5 text-gray-600" />
                        </button>
                        <button
                          onClick={() => navigateCalendar('next')}
                          className="p-1 xs:p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                          title="Selanjutnya"
                        >
                          <FiChevronRight className="w-4 h-4 xs:w-5 xs:h-5 text-gray-600" />
                        </button>
                      </div>
                      
                      {/* Current Month/Year Display */}
                      <div className="relative">
                        <button
                          onClick={() => setShowDatePicker(!showDatePicker)}
                          className="text-sm xs:text-base sm:text-xl font-semibold text-gray-800 hover:bg-gray-100 px-1.5 xs:px-2 sm:px-3 py-0.5 xs:py-1 rounded-lg transition-colors flex items-center gap-0.5 xs:gap-1"
                        >
                          <span className="hidden xs:inline">{monthNames[selectedMonth]}</span>
                          <span className="xs:hidden">{monthNames[selectedMonth].substring(0, 3)}</span>
                          {' '}{selectedYear}
                          <FiChevronDown className={`w-3 h-3 xs:w-4 xs:h-4 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {/* Date Picker Dropdown */}
                        {showDatePicker && (
                          <>
                            {/* Mobile Backdrop */}
                            <div 
                              className="fixed inset-0 bg-black/30 z-[55] xs:hidden"
                              onClick={() => setShowDatePicker(false)}
                            />
                            <div className="fixed xs:absolute top-1/2 xs:top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 xs:translate-y-0 mt-0 xs:mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-[60] p-3 xs:p-4 w-[90vw] xs:w-[280px] sm:min-w-[300px]">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Bulan</label>
                                <select
                                  value={selectedMonth}
                                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                                >
                                  {monthNames.map((month, index) => (
                                    <option key={index} value={index}>{month}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Tahun</label>
                                <select
                                  value={selectedYear}
                                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                                >
                                  {yearOptions.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            
                            {/* Quick Year Selection */}
                            <div className="flex flex-wrap gap-1 mb-4">
                              {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                                <button
                                  key={year}
                                  onClick={() => setSelectedYear(year)}
                                  className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                                    selectedYear === year 
                                      ? 'bg-blue-600 text-white shadow-md' 
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {year}
                                </button>
                              ))}
                            </div>

                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                              <button
                                onClick={() => setShowDatePicker(false)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                              >
                                Batal
                              </button>
                              <button
                                onClick={handleMonthYearChange}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-md"
                              >
                                Pergi
                              </button>
                            </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Center: View Buttons */}
                    <div className="flex items-center bg-gray-100 rounded-md xs:rounded-lg p-0.5 xs:p-1 order-last xs:order-none w-full xs:w-auto justify-center xs:justify-start">
                      {[
                        { view: 'dayGridMonth', label: 'Bulan', shortLabel: 'B' },
                        { view: 'timeGridWeek', label: 'Minggu', shortLabel: 'M' },
                        { view: 'timeGridDay', label: 'Hari', shortLabel: 'H' },
                        { view: 'listWeek', label: 'Agenda', shortLabel: 'A' }
                      ].map(({ view, label, shortLabel }) => (
                        <button
                          key={view}
                          onClick={() => changeView(view)}
                          className={`px-2 xs:px-3 sm:px-4 py-1 xs:py-1.5 text-[10px] xs:text-xs sm:text-sm font-medium rounded-md transition-all flex-1 xs:flex-none ${
                            currentView === view
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <span className="hidden xs:inline">{label}</span>
                          <span className="xs:hidden">{shortLabel}</span>
                        </button>
                      ))}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 xs:gap-2">
                      {/* Quick Search - Hidden on mobile */}
                      <div className="relative hidden lg:block">
                        <input
                          type="date"
                          value={searchDate}
                          onChange={(e) => {
                            setSearchDate(e.target.value);
                            if (e.target.value) {
                              goToDate(new Date(e.target.value));
                            }
                          }}
                          className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white w-40"
                          title="Cari tanggal"
                        />
                        <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>

                      {/* Add Event */}
                      <button
                        onClick={() => {
                          const now = new Date();
                          const later = new Date(now.getTime() + 60 * 60 * 1000);
                          // Format untuk datetime-local input (format lokal, bukan UTC)
                          const formatLocalDateTime = (date) => {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const hours = String(date.getHours()).padStart(2, '0');
                            const minutes = String(date.getMinutes()).padStart(2, '0');
                            return `${year}-${month}-${day}T${hours}:${minutes}`;
                          };
                          setEventForm({
                            summary: '',
                            description: '',
                            startDateTime: formatLocalDateTime(now),
                            endDateTime: formatLocalDateTime(later),
                            location: ''
                          });
                          setSelectedEvent(null);
                          setShowEventModal(true);
                        }}
                        className="px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all text-[10px] xs:text-xs sm:text-sm font-medium flex items-center gap-1 xs:gap-2 shadow-lg hover:shadow-xl"
                        disabled={needsReconnect}
                      >
                        <FiPlus className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                        <span className="hidden sm:inline">Buat</span>
                      </button>

                      {/* Refresh */}
                      <button
                        onClick={manualRefresh}
                        className="p-1.5 xs:p-2 hover:bg-gray-100 rounded-full transition-colors"
                        disabled={isLoading || isAutoRefreshing || needsReconnect}
                        title="Segarkan"
                      >
                        <FiRefreshCw className={`w-4 h-4 xs:w-5 xs:h-5 text-gray-600 ${(isLoading || isAutoRefreshing) ? 'animate-spin' : ''}`} />
                      </button>

                      {/* More Options - Hidden on mobile */}
                      <div className="relative group hidden sm:block">
                        <button
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          title="Opsi lainnya"
                        >
                          <FiChevronDown className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1 min-w-[180px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                          <button
                            onClick={openGoogleCalendar}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <FiExternalLink className="w-4 h-4" />
                            Buka di Google
                          </button>
                          <hr className="my-1 border-gray-100" />
                          <button
                            onClick={() => setShowDisconnectConfirm(true)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <FiLogOut className="w-4 h-4" />
                            Putuskan Koneksi
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calendar Info Bar - Compact on mobile */}
                <div className="px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 bg-white border-b border-gray-100">
                  {/* Mobile: Stacked layout, Desktop: Side by side */}
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 xs:gap-2">
                    {/* Left: Legend */}
                    <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 text-[10px] xs:text-xs">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-sm flex-shrink-0"></span>
                        <span className="text-gray-600">Event ({calendarEvents.length})</span>
                      </div>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showHolidays}
                          onChange={toggleHolidays}
                          className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-red-600 rounded focus:ring-red-500"
                        />
                        <span className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-sm flex-shrink-0"></span>
                        <span className="text-gray-600 truncate">
                          <span className="hidden xs:inline">Libur Nasional</span>
                          <span className="xs:hidden">Libur</span>
                          {holidayEvents.length > 0 && ` (${holidayEvents.length})`}
                          {isLoadingHolidays && <FiLoader className="inline w-2.5 h-2.5 xs:w-3 xs:h-3 animate-spin ml-0.5" />}
                        </span>
                        <FiLock className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-gray-400 flex-shrink-0" title="Tidak dapat diedit" />
                      </label>
                    </div>

                    {/* Right: Stats - Hidden on very small screens */}
                    <div className="hidden xs:flex items-center gap-2 sm:gap-3 text-[10px] xs:text-xs text-gray-500">
                      <span className="flex items-center gap-0.5 xs:gap-1">
                        <FiStar className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5" />
                        {syncCount}
                      </span>
                      <span className="flex items-center gap-0.5 xs:gap-1">
                        <FiClock className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="hidden sm:inline">Auto-sync:</span> 2m
                      </span>
                    </div>
                  </div>
                </div>

                {/* FullCalendar Component */}
                <div className="flex-1 bg-white overflow-hidden calendar-mobile-optimized">
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    headerToolbar={false}
                    initialView="dayGridMonth"
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={2}
                    moreLinkClick="popover"
                    weekends={true}
                    events={[...calendarEvents, ...(showHolidays ? holidayEvents : [])]}  
                    select={handleDateSelect}
                    eventClick={handleEventClick}
                    datesSet={handleDatesSet}
                    height="100%"
                    contentHeight="auto"
                    locale="id"
                    buttonText={{
                      today: 'Hari Ini',
                      month: 'Bulan',
                      week: 'Minggu',
                      day: 'Hari',
                      list: 'Agenda'
                    }}
                    views={{
                      dayGridMonth: {
                        titleFormat: { year: 'numeric', month: 'long' },
                        dayMaxEvents: 2,
                        moreLinkText: (num) => `+${num}`,
                        fixedWeekCount: false
                      },
                      timeGridWeek: {
                        titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
                        slotMinTime: '00:00:00',
                        slotMaxTime: '24:00:00',
                        slotDuration: '00:30:00',
                        nowIndicator: true
                      },
                      timeGridDay: {
                        titleFormat: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
                        slotMinTime: '00:00:00',
                        slotMaxTime: '24:00:00',
                        slotDuration: '00:30:00',
                        nowIndicator: true
                      },
                      listWeek: {
                        listDayFormat: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
                        noEventsContent: 'Tidak ada event pada periode ini'
                      }
                    }}
                    eventDisplay="block"
                    displayEventTime={false}
                    eventTimeFormat={{
                      hour: '2-digit',
                      minute: '2-digit',
                      meridiem: false,
                      hour12: false
                    }}
                    dayHeaderFormat={{
                      weekday: 'narrow'
                    }}
                    slotLabelFormat={{
                      hour: '2-digit',
                      minute: '2-digit',
                      meridiem: false,
                      hour12: false
                    }}
                    firstDay={0}
                    showNonCurrentDates={true}
                    dayMaxEventRows={2}
                    eventClassNames={(arg) => {
                      if (arg.event.extendedProps?.isHoliday) {
                        return ['holiday-event', 'cursor-pointer'];
                      }
                      return ['personal-event', 'cursor-pointer'];
                    }}
                    dayCellClassNames={(arg) => {
                      const today = new Date();
                      if (arg.date.toDateString() === today.toDateString()) {
                        return ['today-cell'];
                      }
                      return [];
                    }}
                  />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mx-4 mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                    <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-600 text-sm">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Holiday Event Details Modal (Read-Only) */}
      {showEventDetails && viewingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-2 xs:p-4">
          <div className="bg-white rounded-lg xs:rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header with color bar */}
            <div className="bg-red-500 px-4 xs:px-6 py-3 xs:py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 xs:gap-2">
                  <FiLock className="w-4 h-4 xs:w-5 xs:h-5 text-white/80" />
                  <span className="text-white/80 text-xs xs:text-sm font-medium">Libur Nasional</span>
                </div>
                <button
                  onClick={() => {
                    setShowEventDetails(false);
                    setViewingEvent(null);
                  }}
                  className="p-1 xs:p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <FiX className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
                </button>
              </div>
              <h3 className="text-base xs:text-xl font-semibold text-white mt-1.5 xs:mt-2">{viewingEvent.title}</h3>
            </div>

            {/* Content */}
            <div className="px-4 xs:px-6 py-3 xs:py-4 space-y-3 xs:space-y-4">
              {/* Date */}
              <div className="flex items-start gap-2 xs:gap-3">
                <FiCalendar className="w-4 h-4 xs:w-5 xs:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 font-medium text-sm xs:text-base">
                    {formatDisplayDate(viewingEvent.start, viewingEvent.allDay)}
                  </p>
                  {viewingEvent.end && viewingEvent.start !== viewingEvent.end && (
                    <p className="text-gray-500 text-xs xs:text-sm">
                      sampai {formatDisplayDate(viewingEvent.end, viewingEvent.allDay)}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              {viewingEvent.extendedProps?.description && (
                <div className="flex items-start gap-2 xs:gap-3">
                  <FiInfo className="w-4 h-4 xs:w-5 xs:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 text-sm xs:text-base">{viewingEvent.extendedProps.description}</p>
                </div>
              )}

              {/* Info notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 xs:p-3">
                <div className="flex items-start gap-1.5 xs:gap-2">
                  <FiAlertCircle className="w-4 h-4 xs:w-5 xs:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs xs:text-sm text-amber-800">
                    <p className="font-medium">Hari Libur Nasional</p>
                    <p className="text-amber-700 mt-0.5 xs:mt-1">
                      Event ini tidak dapat diubah atau dihapus.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 xs:px-6 py-3 xs:py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowEventDetails(false);
                  setViewingEvent(null);
                }}
                className="w-full px-4 py-2 xs:py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm xs:text-base"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Modal (Create/Edit) */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-2 xs:p-4">
          <div className="bg-white rounded-lg xs:rounded-xl shadow-2xl max-w-lg w-full max-h-[95vh] xs:max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 xs:px-6 py-3 xs:py-4 border-b border-gray-100">
              <h3 className="text-sm xs:text-lg font-semibold text-gray-900 flex items-center gap-1.5 xs:gap-2">
                {selectedEvent ? (
                  <>
                    <FiEdit3 className="w-4 h-4 xs:w-5 xs:h-5 text-blue-600" />
                    Edit Event
                  </>
                ) : (
                  <>
                    <FiPlus className="w-4 h-4 xs:w-5 xs:h-5 text-green-600" />
                    <span className="hidden xs:inline">Tambah Event Baru</span>
                    <span className="xs:hidden">Event Baru</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  setSelectedEvent(null);
                  setEventForm({
                    summary: '',
                    description: '',
                    startDateTime: '',
                    endDateTime: '',
                    location: ''
                  });
                  setError(null);
                }}
                className="p-1.5 xs:p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX className="w-4 h-4 xs:w-5 xs:h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEventSubmit} className="p-4 xs:p-6 space-y-3 xs:space-y-5 overflow-y-auto max-h-[calc(95vh-140px)] xs:max-h-[calc(90vh-180px)]">
              {/* Title */}
              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">
                  Judul Event *
                </label>
                <input
                  type="text"
                  value={eventForm.summary}
                  onChange={(e) => setEventForm({...eventForm, summary: e.target.value})}
                  className="w-full px-3 py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tambahkan judul"
                  required
                />
              </div>

              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tambahkan deskripsi (opsional)"
                />
              </div>

              <div className="space-y-3 xs:space-y-4">
                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">
                    Waktu Mulai *
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.startDateTime}
                    onChange={(e) => setEventForm({...eventForm, startDateTime: e.target.value})}
                    className="w-full px-3 py-1.5 xs:py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">
                    Waktu Selesai *
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.endDateTime}
                    onChange={(e) => setEventForm({...eventForm, endDateTime: e.target.value})}
                    className="w-full px-3 py-1.5 xs:py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">
                  Lokasi
                </label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                  className="w-full px-3 py-1.5 xs:py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Lokasi (opsional)"
                />
              </div>

              {/* Footer Buttons - Compact on mobile */}
              <div className="flex flex-wrap gap-2 xs:gap-3 pt-3 xs:pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEventModal(false);
                    setSelectedEvent(null);
                    setEventForm({
                      summary: '',
                      description: '',
                      startDateTime: '',
                      endDateTime: '',
                      location: ''
                    });
                    setError(null);
                  }}
                  className="flex-1 min-w-[70px] px-3 xs:px-4 py-1.5 xs:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs xs:text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 min-w-[70px] px-3 xs:px-4 py-1.5 xs:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs xs:text-sm"
                >
                  {isLoading ? '...' : (selectedEvent ? 'Simpan' : 'Buat')}
                </button>
                {selectedEvent && (
                  <>
                    <button
                      type="button"
                      onClick={() => openEventInGoogle(selectedEvent)}
                      className="px-2.5 xs:px-4 py-1.5 xs:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Buka di Google Calendar"
                    >
                      <FiExternalLink className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleEventDelete}
                      disabled={isLoading}
                      className="px-2.5 xs:px-4 py-1.5 xs:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <FiTrash2 className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-2 xs:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-4 xs:p-6">
            <div className="text-center">
              <div className="w-10 h-10 xs:w-12 xs:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 xs:mb-4">
                <FiAlertCircle className="w-5 h-5 xs:w-6 xs:h-6 text-red-600" />
              </div>
              <h3 className="text-sm xs:text-lg font-semibold text-gray-900 mb-1.5 xs:mb-2">Putuskan Koneksi?</h3>
              <p className="text-gray-600 text-xs xs:text-sm mb-4 xs:mb-6">
                Yakin ingin memutuskan koneksi Google Calendar? 
                Anda perlu menghubungkan ulang untuk menggunakan fitur ini.
              </p>
              <div className="flex gap-2 xs:gap-3">
                <button
                  onClick={() => setShowDisconnectConfirm(false)}
                  className="flex-1 px-3 xs:px-4 py-1.5 xs:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs xs:text-sm"
                  disabled={isLoading}
                >
                  Batal
                </button>
                <button
                  onClick={disconnectGoogleCalendar}
                  className="flex-1 px-3 xs:px-4 py-1.5 xs:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-xs xs:text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? '...' : 'Putuskan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleCalendar;