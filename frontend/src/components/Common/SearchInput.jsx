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
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <FiSearch className="text-gray-400" size={20} />
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="
          block w-full pl-10 pr-10 py-2 
          border border-gray-300 rounded-lg
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          focus:outline-none
          transition-colors duration-200
        "
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <FiX size={20} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
