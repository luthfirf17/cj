import React from 'react';
import BookingCard from './BookingCard';

/**
 * BookingCardView Component
 * Main container for displaying bookings in card view format
 * Features:
 * - Responsive grid layout (3-6 columns)
 * - Empty state handling
 * - Pagination support
 */
const BookingCardView = ({
  bookings,
  cardColumns,
  searchQuery,
  highlightText,
  globalResponsibleParties,
  serviceResponsibleParties,
  onEdit,
  onDelete,
  onGenerateInvoice,
  pagination,
  onPageChange,
  selectedStatuses,
  selectedPaymentStatuses
}) => {
  
  // Empty state message
  const getEmptyMessage = () => {
    if (searchQuery) {
      return (
        <div className="flex flex-col items-center gap-2">
          <p className="font-medium text-sm">Tidak ada hasil untuk "{searchQuery}"</p>
          <p className="text-xs">Coba cari dengan nama klien, nomor kontak, atau layanan lainnya</p>
        </div>
      );
    }
    
    if (selectedStatuses.length > 0 || selectedPaymentStatuses.length > 0) {
      return <p className="text-sm">Tidak ada booking dengan filter yang dipilih</p>;
    }
    
    return <p className="text-sm">Tidak ada data booking</p>;
  };

  // Grid class based on column count
  const getGridClass = () => {
    switch (cardColumns) {
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      case 5:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
      case 6:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6';
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  return (
    <div>
      {/* Empty State */}
      {!bookings || bookings.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-gray-500">
            {getEmptyMessage()}
          </div>
        </div>
      ) : (
        <>
          {/* Cards Grid */}
          <div className={`grid gap-4 ${getGridClass()}`}>
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                searchQuery={searchQuery}
                highlightText={highlightText}
                globalResponsibleParties={globalResponsibleParties}
                serviceResponsibleParties={serviceResponsibleParties}
                onEdit={onEdit}
                onDelete={onDelete}
                onGenerateInvoice={onGenerateInvoice}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Menampilkan 1 hingga {bookings.length} dari {pagination.totalItems} hasil
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`px-3 py-1.5 text-sm rounded-lg ${
                        pagination.currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => onPageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BookingCardView;
