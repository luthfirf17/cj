import React from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

/**
 * Search Input Component with clear button
 */
const SearchInput = ({
  value,
  onChange,
  onClear,
  placeholder = 'Cari...',
  className = '',
  ...props
}) => {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-2 xs:pl-3 flex items-center pointer-events-none">
        <FiSearch className="text-gray-400 w-4 h-4 xs:w-5 xs:h-5" />
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="
          block w-full pl-7 xs:pl-9 sm:pl-10 pr-8 xs:pr-10 py-1.5 xs:py-2 
          text-xs xs:text-sm sm:text-base
          border border-gray-300 rounded-lg
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          focus:outline-none
          transition-colors duration-200
          placeholder:text-xs xs:placeholder:text-sm
        "
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-2 xs:pr-3 flex items-center text-gray-400 hover:text-gray-600 touch-manipulation"
        >
          <FiX className="w-4 h-4 xs:w-5 xs:h-5" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
