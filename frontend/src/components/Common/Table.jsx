import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Button from './Button';

/**
 * Reusable Table Component
 * @param {array} columns - Array of column definitions
 * @param {array} data - Array of data rows
 * @param {boolean} loading - Show loading state
 * @param {object} pagination - Pagination config
 */
const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'Tidak ada data',
  onRowClick,
  pagination,
  className = '',
}) => {
  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-2"></div>
          <div className="h-16 bg-gray-100 rounded mb-2"></div>
          <div className="h-16 bg-gray-100 rounded mb-2"></div>
          <div className="h-16 bg-gray-100 rounded mb-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="overflow-x-auto rounded-lg border border-gray-200 -mx-1 sm:mx-0">
        <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`
                    px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap
                    ${column.className || ''}
                  `}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 sm:px-6 py-8 sm:py-12 text-center text-gray-500 text-xs sm:text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`
                    ${onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}
                    transition-colors duration-150
                  `}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={`
                        px-2 sm:px-4 md:px-6 py-2 sm:py-4 text-[10px] sm:text-xs md:text-sm text-gray-900
                        ${column.cellClassName || ''}
                      `}
                    >
                      {column.render
                        ? column.render(row[column.accessor], row, rowIndex)
                        : row[column.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-2 sm:px-4 md:px-6 py-2 sm:py-3 bg-white border-t border-gray-200 mt-2 sm:mt-4">
          {/* Mobile: Simple pagination */}
          <div className="flex w-full sm:hidden justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={pagination.onPreviousPage}
              disabled={pagination.currentPage === 1}
              className="text-xs px-2 py-1"
            >
              ← Prev
            </Button>
            <span className="text-xs text-gray-600">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={pagination.onNextPage}
              disabled={pagination.currentPage === pagination.totalPages}
              className="text-xs px-2 py-1"
            >
              Next →
            </Button>
          </div>
          
          {/* Tablet+: Full pagination */}
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between w-full">
            <div>
              <p className="text-sm text-gray-700">
                Menampilkan{' '}
                <span className="font-medium">
                  {(pagination.currentPage - 1) * pagination.pageSize + 1}
                </span>{' '}
                hingga{' '}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}
                </span>{' '}
                dari{' '}
                <span className="font-medium">{pagination.totalItems}</span> hasil
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={pagination.onPreviousPage}
                disabled={pagination.currentPage === 1}
                icon={<FiChevronLeft />}
              >
                Sebelumnya
              </Button>
              
              {/* Page Numbers */}
              <div className="flex gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and pages around current
                    return (
                      page === 1 ||
                      page === pagination.totalPages ||
                      (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
                    );
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if there's a gap
                    if (index > 0 && array[index - 1] !== page - 1) {
                      return (
                        <React.Fragment key={page}>
                          <span className="px-2 text-gray-500">...</span>
                          <button
                            onClick={() => pagination.onPageChange(page)}
                            className={`
                              px-3 py-1 rounded-md text-sm font-medium
                              ${page === pagination.currentPage
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                              }
                            `}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => pagination.onPageChange(page)}
                        className={`
                          px-3 py-1 rounded-md text-sm font-medium
                          ${page === pagination.currentPage
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }
                        `}
                      >
                        {page}
                      </button>
                    );
                  })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={pagination.onNextPage}
                disabled={pagination.currentPage === pagination.totalPages}
                icon={<FiChevronRight />}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
