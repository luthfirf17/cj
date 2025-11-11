import React, { useState, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight, FiX, FiClock, FiUser, FiMapPin, FiEdit, FiTrash2, FiFileText, FiMessageCircle } from 'react-icons/fi';
import Badge from './Common/Badge';
import { format } from '../utils/format';
import { getWhatsAppLink } from '../utils/phoneUtils';

const CalendarView = ({ bookings, onDateClick, onEdit, onDelete, onGenerateInvoice }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Get month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Month names in Indonesian
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Day names in Indonesian
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Get number of days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Get number of days in previous month
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Change month directly
  const handleMonthChange = (e) => {
    setCurrentDate(new Date(currentYear, parseInt(e.target.value), 1));
  };

  // Change year directly
  const handleYearChange = (e) => {
    setCurrentDate(new Date(parseInt(e.target.value), currentMonth, 1));
  };

  // Generate year options dynamically from booking data
  const yearOptions = useMemo(() => {
    if (!bookings || bookings.length === 0) {
      // Fallback: current year ± 10 years
      const years = [];
      const currentYearNow = new Date().getFullYear();
      for (let i = currentYearNow - 10; i <= currentYearNow + 10; i++) {
        years.push(i);
      }
      return years;
    }

    // Extract unique years from booking data
    const uniqueYears = new Set();
    bookings.forEach(booking => {
      const year = new Date(booking.booking_date).getFullYear();
      if (!isNaN(year)) {
        uniqueYears.add(year);
      }
    });

    // Add current year if not present
    uniqueYears.add(new Date().getFullYear());

    // Convert to sorted array (newest first)
    return Array.from(uniqueYears).sort((a, b) => b - a);
  }, [bookings]);

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const grouped = {};
    bookings.forEach(booking => {
      const date = new Date(booking.booking_date);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(booking);
    });
    return grouped;
  }, [bookings]);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Dijadwalkan':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Selesai':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Dibatalkan':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get status dot color
  const getStatusDotColor = (status) => {
    switch (status) {
      case 'Dijadwalkan':
        return 'bg-blue-500';
      case 'Selesai':
        return 'bg-green-500';
      case 'Dibatalkan':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Format time
  const formatTime = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // Generate calendar days
  const calendarDays = [];

  // Previous month days (greyed out)
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    calendarDays.push({
      day,
      isCurrentMonth: false,
      date: new Date(currentYear, currentMonth - 1, day),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayBookings = bookingsByDate[dateKey] || [];

    calendarDays.push({
      day,
      isCurrentMonth: true,
      date,
      bookings: dayBookings,
    });
  }

  // Next month days (greyed out)
  const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days = 42
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: false,
      date: new Date(currentYear, currentMonth + 1, day),
    });
  }

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        {/* Month & Year Selectors - Modern Style */}
        <div className="flex items-center gap-3">
          {/* Month Selector */}
          <div className="relative">
            <select
              value={currentMonth}
              onChange={handleMonthChange}
              className="appearance-none px-6 py-3 pr-10 border-2 border-blue-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 transition-all cursor-pointer shadow-sm"
              style={{
                backgroundImage: 'linear-gradient(to right, #eff6ff, #ffffff)',
              }}
            >
              {monthNames.map((month, idx) => (
                <option 
                  key={idx} 
                  value={idx}
                  className="bg-white hover:bg-blue-50 py-2 text-gray-900 font-medium"
                  style={{
                    backgroundColor: idx === currentMonth ? '#dbeafe' : '#ffffff',
                    padding: '8px 16px'
                  }}
                >
                  {month}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {/* Year Selector */}
          <div className="relative">
            <select
              value={currentYear}
              onChange={handleYearChange}
              className="appearance-none px-6 py-3 pr-10 border-2 border-purple-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gradient-to-r from-purple-50 to-white hover:from-purple-100 hover:to-purple-50 transition-all cursor-pointer shadow-sm"
              style={{
                backgroundImage: 'linear-gradient(to right, #faf5ff, #ffffff)',
              }}
            >
              {yearOptions.map(year => (
                <option 
                  key={year} 
                  value={year}
                  className="bg-white hover:bg-purple-50 py-2 text-gray-900 font-medium"
                  style={{
                    backgroundColor: year === currentYear ? '#e9d5ff' : '#ffffff',
                    padding: '8px 16px'
                  }}
                >
                  {year}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Navigation Arrows - Modern Style */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-3 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-blue-100 hover:to-blue-50 rounded-xl transition-all shadow-sm hover:shadow-md border border-gray-200 hover:border-blue-300"
            title="Bulan Sebelumnya"
          >
            <FiChevronLeft size={20} className="text-gray-700" />
          </button>
          <button
            onClick={nextMonth}
            className="p-3 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-blue-100 hover:to-blue-50 rounded-xl transition-all shadow-sm hover:shadow-md border border-gray-200 hover:border-blue-300"
            title="Bulan Berikutnya"
          >
            <FiChevronRight size={20} className="text-gray-700" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-600">Dijadwalkan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-600">Selesai</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600">Dibatalkan</span>
        </div>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((dayInfo, index) => {
          const hasBookings = dayInfo.bookings && dayInfo.bookings.length > 0;
          const today = isToday(dayInfo.date);

          return (
            <div
              key={index}
              className={`min-h-[120px] border rounded-lg p-2 ${
                dayInfo.isCurrentMonth
                  ? 'bg-white border-gray-200'
                  : 'bg-gray-50 border-gray-100'
              } ${today ? 'ring-2 ring-blue-500' : ''}`}
            >
              {/* Day Number */}
              <div className={`text-sm font-medium mb-1 ${
                dayInfo.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              } ${today ? 'text-blue-600 font-bold' : ''}`}>
                {dayInfo.day}
              </div>

              {/* Bookings */}
              {hasBookings && (
                <div className="space-y-1">
                  {dayInfo.bookings.slice(0, 2).map((booking, idx) => (
                    <div
                      key={booking.id}
                      onClick={() => {
                        setSelectedDate(dayInfo.date);
                        setShowBookingModal(true);
                      }}
                      className={`text-xs px-2 py-1 rounded border ${getStatusColor(booking.status)} cursor-pointer hover:shadow-md transition-all hover:scale-105`}
                      title="Klik untuk lihat detail"
                    >
                      <div className="flex items-start gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${getStatusDotColor(booking.status)}`}></div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          {/* Time */}
                          <div className="font-semibold text-[10px] flex items-center gap-1">
                            <FiClock size={10} />
                            {booking.booking_time ? booking.booking_time.substring(0, 5) : formatTime(booking.booking_date)}
                          </div>
                          {/* Client Name */}
                          <div className="truncate font-medium flex items-center gap-1">
                            <FiUser size={10} />
                            {booking.client_name}
                          </div>
                          {/* Location */}
                          {booking.location_name && (
                            <div className="truncate opacity-90 flex items-center gap-1">
                              <FiMapPin size={10} />
                              {booking.location_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show more indicator - clickable */}
                  {dayInfo.bookings.length > 2 && (
                    <button
                      onClick={() => {
                        setSelectedDate(dayInfo.date);
                        setShowBookingModal(true);
                      }}
                      className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium text-center py-1 hover:bg-blue-50 rounded transition-colors"
                    >
                      +{dayInfo.bookings.length - 2} lagi
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Booking Details Modal */}
      {showBookingModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Booking pada {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {(() => {
                    const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                    const dayBookings = bookingsByDate[dateKey] || [];
                    return `${dayBookings.length} booking ditemukan`;
                  })()}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedDate(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Body - Table */}
            <div className="flex-1 overflow-auto p-6">
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
                        Waktu & Lokasi
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
                    {(() => {
                      const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                      const dayBookings = bookingsByDate[dateKey] || [];
                      
                      if (dayBookings.length === 0) {
                        return (
                          <tr>
                            <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                              Tidak ada booking pada tanggal ini
                            </td>
                          </tr>
                        );
                      }

                      return dayBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          {/* Klien */}
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{booking.client_name}</div>
                            <div className="text-sm text-gray-500">{booking.contact}</div>
                          </td>

                          {/* Layanan */}
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900 space-y-1">
                              {booking.services && booking.services.length > 0 ? (
                                booking.services
                                  .filter(service => service)
                                  .map((service, idx) => {
                                    const serviceName = typeof service === 'string' 
                                      ? service 
                                      : (service?.name || String(service || '-'));
                                    return (
                                      <div key={idx} className="flex items-start gap-1">
                                        <span className="text-gray-400">•</span>
                                        <span>{serviceName}</span>
                                      </div>
                                    );
                                  })
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </td>

                          {/* Waktu & Lokasi */}
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">
                              {format.date(booking.booking_date)}
                            </div>
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

                          {/* Status */}
                          <td className="px-4 py-3">
                            <Badge variant={
                              booking.status === 'Dijadwalkan' ? 'info' :
                              booking.status === 'Selesai' ? 'success' :
                              booking.status === 'Dibatalkan' ? 'danger' : 'warning'
                            }>
                              {booking.status}
                            </Badge>
                          </td>

                          {/* Pembayaran */}
                          <td className="px-4 py-3">
                            <div>
                              <Badge variant={
                                booking.payment_status === 'Lunas' ? 'success' :
                                booking.payment_status === 'DP' ? 'warning' : 'danger'
                              }>
                                {booking.payment_status}
                              </Badge>
                              <div className="text-sm font-medium text-gray-900 mt-1">
                                Total: {format.currency(booking.total_price || booking.total_amount || 0)}
                              </div>
                              <div className="text-sm text-gray-500">
                                Dibayar: {format.currency(booking.amount_paid || 0)}
                              </div>
                              {(booking.total_price - booking.amount_paid > 0) && (
                                <div className="text-sm text-red-600">
                                  Sisa: {format.currency((booking.total_price || booking.total_amount || 0) - (booking.amount_paid || 0))}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Aksi */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {/* Generate Invoice */}
                              {onGenerateInvoice && (
                                <button
                                  onClick={() => {
                                    onGenerateInvoice(booking);
                                    setShowBookingModal(false);
                                  }}
                                  className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                  title="Generate Invoice"
                                >
                                  <FiFileText size={16} />
                                </button>
                              )}
                              
                              {/* Google Maps */}
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
                              
                              {/* WhatsApp */}
                              <a
                                href={getWhatsAppLink(booking.contact)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors inline-flex items-center justify-center"
                                title="Hubungi via WhatsApp"
                              >
                                <FiMessageCircle size={16} />
                              </a>

                              {/* Edit */}
                              {onEdit && (
                                <button
                                  onClick={() => {
                                    onEdit(booking);
                                    setShowBookingModal(false);
                                  }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <FiEdit size={16} />
                                </button>
                              )}

                              {/* Delete */}
                              {onDelete && (
                                <button
                                  onClick={() => {
                                    onDelete(booking);
                                    setShowBookingModal(false);
                                  }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Hapus"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedDate(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
