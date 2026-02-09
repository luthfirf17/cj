/**
 * Input Validation Utilities
 * Provides comprehensive validation for booking-related data
 * Prevents SQL injection, XSS, and data corruption
 */

/**
 * Sanitize string input to prevent SQL injection
 * @param {string} input - The input string to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input, maxLength = 500) => {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Enforce max length
  if (sanitized.length > maxLength) {
    throw new Error(`Input too long (max ${maxLength} characters)`);
  }
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    /--/g,                    // SQL comment
    /;[\s]*DROP/gi,           // DROP statement
    /;[\s]*DELETE/gi,         // DELETE statement
    /;[\s]*UPDATE/gi,         // UPDATE statement  
    /;[\s]*INSERT/gi,         // INSERT statement
    /;[\s]*EXEC/gi,           // EXEC statement
    /<script/gi,              // Script tags
    /javascript:/gi,          // JavaScript protocol
    /on\w+\s*=/gi,           // Event handlers
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error('Input contains dangerous content');
    }
  }
  
  return sanitized;
};

/**
 * Validate booking name
 * @param {string} bookingName - Booking name to validate
 * @returns {string|null} - Sanitized booking name or null
 */
const validateBookingName = (bookingName) => {
  if (!bookingName) return null;
  
  const sanitized = sanitizeString(bookingName, 200);
  
  if (sanitized.length < 2) {
    throw new Error('Booking name must be at least 2 characters');
  }
  
  return sanitized;
};

/**
 * Validate client name
 * @param {string} clientName - Client name to validate
 * @returns {string} - Sanitized client name
 */
const validateClientName = (clientName) => {
  if (!clientName || clientName.trim() === '') {
    throw new Error('Client name is required');
  }
  
  const sanitized = sanitizeString(clientName, 100);
  
  if (sanitized.length < 2) {
    throw new Error('Client name must be at least 2 characters');
  }
  
  return sanitized;
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {string} - Sanitized phone number
 */
const validatePhone = (phone) => {
  if (!phone) return null;
  
  // Allow digits, spaces, +, -, (, )
  const phoneRegex = /^[\d\s\+\-\(\)]+$/;
  
  if (!phoneRegex.test(phone)) {
    throw new Error('Invalid phone number format');
  }
  
  const sanitized = phone.trim();
  
  if (sanitized.length < 8 || sanitized.length > 20) {
    throw new Error('Phone number must be 8-20 characters');
  }
  
  return sanitized;
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {string|null} - Sanitized email or null
 */
const validateEmail = (email) => {
  if (!email) return null;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  
  const sanitized = email.trim().toLowerCase();
  
  if (sanitized.length > 100) {
    throw new Error('Email too long (max 100 characters)');
  }
  
  return sanitized;
};

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date string to validate
 * @returns {string} - Validated date string
 */
const validateDate = (date) => {
  if (!date) {
    throw new Error('Date is required');
  }
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!dateRegex.test(date)) {
    throw new Error('Invalid date format (use YYYY-MM-DD)');
  }
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date value');
  }
  
  // Check if date is too far in the past or future
  const minDate = new Date('2020-01-01');
  const maxDate = new Date('2100-12-31');
  
  if (dateObj < minDate || dateObj > maxDate) {
    throw new Error('Date must be between 2020 and 2100');
  }
  
  return date;
};

/**
 * Validate time format (HH:MM)
 * @param {string} time - Time string to validate
 * @returns {string|null} - Validated time string or null
 */
const validateTime = (time) => {
  if (!time) return null;
  
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  
  if (!timeRegex.test(time)) {
    throw new Error('Invalid time format (use HH:MM, 24-hour format)');
  }
  
  return time;
};

/**
 * Validate amount (price/payment)
 * @param {number|string} amount - Amount to validate
 * @returns {number} - Validated amount
 */
const validateAmount = (amount, fieldName = 'Amount') => {
  if (amount === null || amount === undefined) {
    return 0;
  }
  
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  
  if (numAmount < 0) {
    throw new Error(`${fieldName} cannot be negative`);
  }
  
  if (numAmount > 1000000000) {
    throw new Error(`${fieldName} too large (max 1 billion)`);
  }
  
  // Round to 2 decimal places
  return Math.round(numAmount * 100) / 100;
};

/**
 * Validate service ID
 * @param {number|string} serviceId - Service ID to validate
 * @returns {number|null} - Validated service ID or null
 */
const validateServiceId = (serviceId) => {
  if (!serviceId) return null;
  
  const numId = parseInt(serviceId);
  
  if (isNaN(numId) || numId <= 0) {
    throw new Error('Invalid service ID');
  }
  
  return numId;
};

/**
 * Validate client ID
 * @param {number|string} clientId - Client ID to validate
 * @returns {number|null} - Validated client ID or null
 */
const validateClientId = (clientId) => {
  if (!clientId) return null;
  
  const numId = parseInt(clientId);
  
  if (isNaN(numId) || numId <= 0) {
    throw new Error('Invalid client ID');
  }
  
  return numId;
};

/**
 * Validate JSON string
 * @param {string} jsonString - JSON string to validate
 * @returns {string} - Validated JSON string
 */
const validateJSON = (jsonString, maxSize = 50000) => {
  if (!jsonString) return null;
  
  if (jsonString.length > maxSize) {
    throw new Error(`JSON data too large (max ${maxSize} bytes)`);
  }
  
  try {
    // Parse to validate format
    const parsed = JSON.parse(jsonString);
    
    // Re-stringify to sanitize
    return JSON.stringify(parsed);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
};

/**
 * Validate booking status
 * @param {string} status - Booking status to validate
 * @returns {string} - Validated status
 */
const validateStatus = (status) => {
  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  
  if (!status) {
    return 'pending'; // Default
  }
  
  const lowerStatus = status.toLowerCase();
  
  if (!validStatuses.includes(lowerStatus)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }
  
  return lowerStatus;
};

/**
 * Validate payment status
 * @param {string} paymentStatus - Payment status to validate
 * @returns {string} - Validated payment status
 */
const validatePaymentStatus = (paymentStatus) => {
  const validStatuses = ['unpaid', 'partial', 'paid'];
  
  if (!paymentStatus) {
    return 'unpaid'; // Default
  }
  
  const lowerStatus = paymentStatus.toLowerCase();
  
  if (!validStatuses.includes(lowerStatus)) {
    throw new Error(`Invalid payment status. Must be one of: ${validStatuses.join(', ')}`);
  }
  
  return lowerStatus;
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {string|null} - Validated URL or null
 */
const validateURL = (url) => {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid URL protocol (only http and https allowed)');
    }
    
    return url;
  } catch (error) {
    throw new Error('Invalid URL format');
  }
};

/**
 * Comprehensive booking data validation
 * @param {Object} data - Booking data to validate
 * @returns {Object} - Validated and sanitized booking data
 */
const validateBookingData = (data) => {
  const validated = {};
  
  // Optional fields
  validated.booking_name = validateBookingName(data.booking_name);
  
  // Required fields
  validated.booking_date = validateDate(data.booking_date);
  validated.booking_time = validateTime(data.booking_time) || '09:00';
  validated.status = validateStatus(data.status);
  validated.total_amount = validateAmount(data.total_amount, 'Total amount');
  
  // Optional but validated fields
  if (data.client_id) {
    validated.client_id = validateClientId(data.client_id);
  }
  
  if (data.client_name) {
    validated.client_name = validateClientName(data.client_name);
  }
  
  if (data.contact) {
    validated.contact = validatePhone(data.contact);
  }
  
  if (data.address) {
    validated.address = sanitizeString(data.address, 500);
  }
  
  if (data.service_id) {
    validated.service_id = validateServiceId(data.service_id);
  }
  
  if (data.location_name) {
    validated.location_name = sanitizeString(data.location_name, 200);
  }
  
  if (data.location_map_url) {
    validated.location_map_url = validateURL(data.location_map_url);
  }
  
  if (data.payment_status) {
    validated.payment_status = validatePaymentStatus(data.payment_status);
  }
  
  if (data.amount_paid !== undefined) {
    validated.amount_paid = validateAmount(data.amount_paid, 'Amount paid');
  }
  
  if (data.notes) {
    validated.notes = validateJSON(data.notes);
  }
  
  return validated;
};

module.exports = {
  sanitizeString,
  validateBookingName,
  validateClientName,
  validatePhone,
  validateEmail,
  validateDate,
  validateTime,
  validateAmount,
  validateServiceId,
  validateClientId,
  validateJSON,
  validateStatus,
  validatePaymentStatus,
  validateURL,
  validateBookingData
};
