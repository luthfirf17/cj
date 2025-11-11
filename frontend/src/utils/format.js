import { format as dateFnsFormat, formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

// Format currency to Indonesian Rupiah
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format date
export const formatDate = (date, formatStr = 'dd MMMM yyyy') => {
  if (!date) return '-'
  return dateFnsFormat(new Date(date), formatStr, { locale: id })
}

// Format time only
export const formatTime = (date) => {
  if (!date) return '-'
  return dateFnsFormat(new Date(date), 'HH:mm', { locale: id })
}

// Format date time
export const formatDateTime = (date) => {
  if (!date) return '-'
  return dateFnsFormat(new Date(date), 'dd MMM yyyy, HH:mm', { locale: id })
}

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  if (!date) return '-'
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id })
}

// Format phone number
export const formatPhoneNumber = (phone) => {
  if (!phone) return '-'
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Format as Indonesian phone number
  if (cleaned.startsWith('62')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 9)} ${cleaned.slice(9)}`
  }
  
  return phone
}

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '-'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Export as default object for convenience
export const format = {
  currency: formatCurrency,
  date: formatDate,
  time: formatTime,
  dateTime: formatDateTime,
  relativeTime: formatRelativeTime,
  phone: formatPhoneNumber,
  truncate: truncateText,
}


// Capitalize first letter
export const capitalize = (text) => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// Format file size
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
