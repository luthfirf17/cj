import React from 'react';
import { FiPackage, FiMessageCircle } from 'react-icons/fi';
import { getWhatsAppLink } from '../../../utils/phoneUtils';
import { format } from '../../../utils/format';

/**
 * ServiceDetailCard Component
 * Displays detailed information for a single service including:
 * - Service name
 * - Price breakdown (unit price, quantity, total)
 * - Responsible party (if exists)
 */
const ServiceDetailCard = ({ 
  service, 
  index, 
  searchQuery, 
  highlightText, 
  responsibleParty 
}) => {
  // Extract service details with fallbacks
  // Note: Backend stores price as 'custom_price' in notes JSON, fallback to 'price' for compatibility
  const serviceName = service.name || service.service_name || 'Layanan';
  const serviceQty = Number(service.quantity) || 1;
  // Priority: custom_price (from booking notes) > price > default_price > 0
  const servicePrice = Number(service.custom_price) || Number(service.price) || Number(service.default_price) || 0;
  // Calculate total: if total_price exists use it, otherwise calculate from price * qty
  const serviceTotalPrice = Number(service.total_price) || (servicePrice * serviceQty);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border-2 border-blue-200 rounded-lg p-2.5 hover:shadow-md hover:border-blue-300 transition-all">
      {/* Service Header with Number */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-blue-200">
        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
          {index + 1}
        </div>
        <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
          Detail Layanan
        </h5>
      </div>

      {/* Service Name */}
      <div className="mb-2">
        <div className="flex items-start gap-2">
          <FiPackage className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[9px] text-gray-500 uppercase font-semibold">Nama Layanan:</span>
            <p className="text-xs font-bold text-gray-900 leading-tight mt-0.5">
              {searchQuery ? highlightText(serviceName, searchQuery) : serviceName}
            </p>
          </div>
        </div>
      </div>

      {/* Price Information - Detailed */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-2.5 mb-2">
        <div className="space-y-2">
          {/* Harga Satuan & Jumlah */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[9px] text-gray-600 font-bold uppercase block mb-1">Harga Satuan:</span>
              <span className="text-sm font-bold text-green-700">
                {format.currency(servicePrice)}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-gray-600 font-bold uppercase block mb-1">Jumlah:</span>
              <span className="text-sm font-bold text-gray-900">
                {serviceQty} unit
              </span>
            </div>
          </div>
          
          {/* Total Harga Layanan - Prominent */}
          <div className="bg-white border border-green-300 rounded-lg p-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-700 font-bold uppercase">Total Harga:</span>
              <span className="text-base font-extrabold text-green-600">
                {format.currency(serviceTotalPrice)}
              </span>
            </div>
            {serviceQty > 1 && (
              <div className="text-[9px] text-gray-500 mt-1 text-center">
                ({serviceQty} × {format.currency(servicePrice)})
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsible Party - Compact Single Line (only if exists) */}
      {responsibleParty && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[9px] text-purple-700 font-bold uppercase whitespace-nowrap">Penanggung Jawab</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900 truncate" title={responsibleParty.name || responsibleParty.responsible_party_name}>
              {responsibleParty.name || responsibleParty.responsible_party_name}
            </span>
            <span className="text-xs text-gray-600">-</span>
            <span className="text-xs text-gray-700 font-medium">
              {responsibleParty.phone || responsibleParty.responsible_party_phone}
            </span>
            <a
              href={getWhatsAppLink(
                responsibleParty.phone || responsibleParty.responsible_party_phone,
                responsibleParty.countryCode || responsibleParty.responsible_party_country_code || '62'
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white p-1 rounded transition-colors flex-shrink-0 ml-auto"
              title={`WhatsApp ${responsibleParty.name || responsibleParty.responsible_party_name}`}
            >
              <FiMessageCircle className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDetailCard;
