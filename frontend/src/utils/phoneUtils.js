// Asian country codes near Indonesia (10 countries)
export const ASIAN_COUNTRY_CODES = [
  { code: '62', country: 'Indonesia', flag: '🇮🇩', isPinned: true },
  { code: '60', country: 'Malaysia', flag: '🇲🇾', isPinned: false },
  { code: '65', country: 'Singapore', flag: '🇸🇬', isPinned: false },
  { code: '66', country: 'Thailand', flag: '🇹🇭', isPinned: false },
  { code: '63', country: 'Philippines', flag: '🇵🇭', isPinned: false },
  { code: '84', country: 'Vietnam', flag: '🇻🇳', isPinned: false },
  { code: '95', country: 'Myanmar', flag: '🇲🇲', isPinned: false },
  { code: '856', country: 'Laos', flag: '🇱🇦', isPinned: false },
  { code: '855', country: 'Cambodia', flag: '🇰🇭', isPinned: false },
  { code: '673', country: 'Brunei', flag: '🇧🇳', isPinned: false },
];

/**
 * Format phone number for WhatsApp
 * Converts 08xxx -> 628xxx
 * Converts +62xxx -> 62xxx
 * Returns formatted number ready for wa.me/
 */
export const formatPhoneForWhatsApp = (phone, countryCode = '62') => {
  if (!phone) return '';
  
  // Remove all non-numeric characters except +
  let cleaned = phone.toString().replace(/[^\d+]/g, '');
  
  // Remove + if exists
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // If starts with 0, replace with country code
  if (cleaned.startsWith('0')) {
    cleaned = countryCode + cleaned.substring(1);
  }
  
  // If doesn't start with country code, add it
  if (!cleaned.startsWith(countryCode)) {
    cleaned = countryCode + cleaned;
  }
  
  return cleaned;
};

/**
 * Generate WhatsApp link
 */
export const getWhatsAppLink = (phone, countryCode = '62') => {
  const formattedPhone = formatPhoneForWhatsApp(phone, countryCode);
  return `https://wa.me/${formattedPhone}`;
};

/**
 * Format phone number for display
 * Shows with country code prefix
 */
export const formatPhoneDisplay = (phone, countryCode = '62') => {
  if (!phone) return '';
  
  let cleaned = phone.toString().replace(/[^\d+]/g, '');
  
  // Remove + if exists
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // If starts with 0, replace with country code
  if (cleaned.startsWith('0')) {
    cleaned = countryCode + cleaned.substring(1);
  }
  
  // If doesn't start with country code, add it
  if (!cleaned.startsWith(countryCode)) {
    cleaned = countryCode + cleaned;
  }
  
  // Add + prefix for display
  return `+${cleaned}`;
};
