import React from 'react';
import { 
  FiMessageCircle, 
  FiPackage, 
  FiUser, 
  FiDollarSign, 
  FiCalendar, 
  FiClock, 
  FiMapPin,
  FiFileText,
  FiEdit,
  FiTrash2
} from 'react-icons/fi';
import { format as dateFnsFormat } from 'date-fns';
import { id } from 'date-fns/locale';
import Badge from '../../Common/Badge';
import ServiceDetailCard from './ServiceDetailCard';
import { getWhatsAppLink } from '../../../utils/phoneUtils';
import { format } from '../../../utils/format';

/**
 * BookingCard Component
 * Displays a single booking card with all details including:
 * - Client information
 * - Services with pricing
 * - Responsible parties
 * - Date, time, location
 * - Payment status
 * - Action buttons
 */
const BookingCard = ({ 
  booking,
  searchQuery,
  highlightText,
  globalResponsibleParties,
  serviceResponsibleParties,
  onEdit,
  onDelete,
  onGenerateInvoice
}) => {
  
  // Format date with short month name (3 letters)
  const formatDateShort = (date) => {
    if (!date) return '-'
    return dateFnsFormat(new Date(date), 'dd MMM yyyy', { locale: id })
  }
  
  /**
   * Find responsible party for a service
   * Priority: responsible_party_id > service-responsible mapping > name matching
   */
  const findResponsibleParty = (service) => {
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
    
    // Third priority: try to match by service name
    if (!responsibleParty && (service.name || service.service_name)) {
      const serviceName = service.name || service.service_name;
      responsibleParty = serviceResponsibleParties.find(srp => {
        const srpName = String(srp.service_name || '').toLowerCase().trim();
        const svcName = String(serviceName || '').toLowerCase().trim();
        return srpName === svcName;
      });
    }
    
    return responsibleParty;
  };

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col h-[600px]">
      {/* Card Header - Compact */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 text-white flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {booking.booking_name && (
              <h4 
                className="text-sm font-medium mb-1 truncate text-white bg-white/20 px-2 py-1 rounded inline-block border border-white/20" 
                title={booking.booking_name}
              >
                {searchQuery ? highlightText(booking.booking_name, searchQuery) : booking.booking_name}
              </h4>
            )}
            <h3 className="text-base font-bold mb-1 truncate" title={booking.client_name}>
              {searchQuery ? highlightText(booking.client_name, searchQuery) : booking.client_name}
            </h3>
            <a
              href={getWhatsAppLink(booking.contact)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-blue-100 text-xs hover:text-white transition-colors"
            >
              <FiMessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{searchQuery ? highlightText(booking.contact, searchQuery) : booking.contact}</span>
            </a>
          </div>
          <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
            <Badge variant={
              booking.status === 'Dijadwalkan' ? 'info' :
              booking.status === 'Selesai' ? 'success' :
              booking.status === 'Dibatalkan' ? 'danger' : 'warning'
            } className="text-xs whitespace-nowrap">
              {booking.status}
            </Badge>
            <Badge variant={
              booking.payment_status === 'Lunas' ? 'success' :
              booking.payment_status === 'DP' ? 'warning' : 'danger'
            } className="text-xs whitespace-nowrap">
              {booking.payment_status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Card Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        
        {/* Date, Time Section */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-gray-200">
            <div className="w-6 h-6 bg-indigo-100 rounded flex items-center justify-center">
              <FiCalendar className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <h4 className="text-xs font-bold text-gray-800 uppercase">Tanggal & Waktu</h4>
          </div>
          <div className="space-y-1.5">
            {/* Check if multi-day booking: has end date AND it's different from start date */}
            {booking.booking_date_end && booking.booking_date !== booking.booking_date_end ? (
              /* Multi-day booking */
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 p-2 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 bg-indigo-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiCalendar className="w-2.5 h-2.5 text-indigo-700" />
                  </div>
                  <span className="text-xs font-medium text-gray-900">
                    {formatDateShort(booking.booking_date)} - {formatDateShort(booking.booking_date_end)}
                  </span>
                </div>
                {(booking.booking_time || booking.booking_time_end) && (
                  <div className="flex items-center gap-2 ml-7">
                    <FiClock className="w-2.5 h-2.5 text-blue-700" />
                    <span className="text-xs font-medium text-gray-900">
                      {booking.booking_time ? booking.booking_time.substring(0, 5) : '00:00'} - {booking.booking_time_end ? booking.booking_time_end.substring(0, 5) : '23:59'}
                    </span>
                  </div>
                )}
                {booking.booking_days && booking.booking_days > 1 && (
                  <div className="mt-1 ml-7">
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                      {booking.booking_days} Hari
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Single day booking */
              <>
                <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 p-2 rounded-lg">
                  <div className="w-5 h-5 bg-indigo-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiCalendar className="w-2.5 h-2.5 text-indigo-700" />
                  </div>
                  <span className="text-xs font-medium text-gray-900">{formatDateShort(booking.booking_date)}</span>
                </div>
                {(booking.booking_time || booking.booking_time_end) && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 p-2 rounded-lg">
                    <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <FiClock className="w-2.5 h-2.5 text-blue-700" />
                    </div>
                    <span className="text-xs font-medium text-gray-900">
                      {booking.booking_time && booking.booking_time_end 
                        ? `${booking.booking_time.substring(0, 5)} - ${booking.booking_time_end.substring(0, 5)}`
                        : booking.booking_time 
                          ? booking.booking_time.substring(0, 5)
                          : booking.booking_time_end 
                            ? booking.booking_time_end.substring(0, 5)
                            : '-'
                      }
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Location Section */}
        {(booking.location_name || booking.location) && (
          <div>
            <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-gray-200">
              <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                <FiMapPin className="w-3.5 h-3.5 text-green-600" />
              </div>
              <h4 className="text-xs font-bold text-gray-800 uppercase">Lokasi</h4>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-2 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiMapPin className="w-2.5 h-2.5 text-green-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 break-words">
                    {searchQuery ? highlightText(booking.location_name || booking.location, searchQuery) : (booking.location_name || booking.location)}
                  </p>
                  {booking.location_map_url && (
                    <a
                      href={booking.location_map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1 text-[10px] text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    >
                      <FiMapPin className="w-2.5 h-2.5" />
                      Buka Google Maps
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Price Summary */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-gray-200">
            <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
              <FiDollarSign className="w-3.5 h-3.5 text-green-600" />
            </div>
            <h4 className="text-xs font-bold text-gray-800 uppercase">Rincian Harga</h4>
          </div>
          <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 rounded-xl p-3 shadow-sm">
            <div className="space-y-2">
              {/* Total Booking */}
              <div className="bg-white border-2 border-green-200 rounded-lg p-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 font-bold uppercase">Total Booking:</span>
                  <span className="text-base font-extrabold text-green-700">
                    {format.currency(Number(booking.total_price) || 0)}
                  </span>
                </div>
              </div>
              {/* Dibayar */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-700 font-bold uppercase">Sudah Dibayar:</span>
                  <span className="text-sm font-bold text-blue-600">
                    {format.currency(Number(booking.amount_paid) || 0)}
                  </span>
                </div>
              </div>
              {/* Sisa - only if > 0 */}
              {((Number(booking.total_price) || 0) - (Number(booking.amount_paid) || 0)) > 0 && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-lg p-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-red-700 font-bold uppercase">Sisa Pembayaran:</span>
                    <span className="text-sm font-bold text-red-600">
                      {format.currency((Number(booking.total_price) || 0) - (Number(booking.amount_paid) || 0))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-gray-200">
            <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
              <FiPackage className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <h4 className="text-xs font-bold text-gray-800 uppercase">Layanan</h4>
          </div>
          <div className="space-y-2">
            {booking.services && booking.services.length > 0 ? booking.services
              .filter(service => service)
              .map((service, idx) => (
                <ServiceDetailCard
                  key={idx}
                  service={service}
                  index={idx}
                  searchQuery={searchQuery}
                  highlightText={highlightText}
                  responsibleParty={findResponsibleParty(service)}
                />
              )) : (
                <p className="text-xs text-gray-500 italic">Tidak ada layanan</p>
              )}
          </div>
        </div>

        {/* Booking Responsible Parties */}
        {booking.responsible_parties && booking.responsible_parties.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-gray-200">
              <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                <FiUser className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <h4 className="text-xs font-bold text-gray-800 uppercase">Penanggung Jawab Booking</h4>
            </div>
            <div className="space-y-1.5">
              {booking.responsible_parties.map((party, index) => (
                <div key={index} className="flex items-center justify-between gap-2 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 p-2 rounded-lg">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <FiUser className="w-2.5 h-2.5 text-purple-700" />
                    </div>
                    <span className="text-xs font-medium text-gray-900 truncate" title={party.name}>{party.name}</span>
                  </div>
                  {party.phone && (
                    <a
                      href={getWhatsAppLink(party.phone, party.countryCode || '62')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1 rounded transition-colors flex-shrink-0"
                      title={`WhatsApp ${party.name}`}
                    >
                      <FiMessageCircle className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer - Actions */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2.5 border-t-2 border-gray-300 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onGenerateInvoice(booking)}
            className="flex-1 px-2 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 text-xs font-medium"
            title="Generate Invoice"
          >
            <FiFileText size={14} />
            <span>Invoice</span>
          </button>
          <button
            onClick={() => onEdit(booking)}
            className="flex-1 px-2 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 text-xs font-medium"
            title="Edit Booking"
          >
            <FiEdit size={14} />
            <span>Edit</span>
          </button>
          <button
            onClick={() => onDelete(booking)}
            className="px-2.5 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
            title="Hapus Booking"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
