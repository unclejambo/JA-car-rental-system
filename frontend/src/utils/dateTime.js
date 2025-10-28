/**
 * DateTime Utility Functions for Philippine Timezone (UTC+8)
 * Handles conversion between UTC and Philippine Standard Time
 */

// Philippine timezone offset in minutes (UTC+8 = +480 minutes)
const PHILIPPINE_OFFSET_MINUTES = 480;

/**
 * Convert UTC date to Philippine time
 * @param {Date|string} date - UTC date or ISO string
 * @returns {Date} - Date adjusted to Philippine time
 */
export function toPhilippineTime(date) {
  const utcDate = typeof date === 'string' ? new Date(date) : date;
  
  // Simply add 8 hours to the UTC time to get Philippine time
  // The Date object stores time in UTC internally
  // We just need to add the offset for display purposes
  const phTime = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
  
  return phTime;
}

/**
 * Convert Philippine time to UTC
 * @param {Date|string} date - Philippine time date
 * @returns {Date} - Date adjusted to UTC
 */
export function toUTC(date) {
  const phDate = typeof date === 'string' ? new Date(date) : date;
  
  // Create a new date object to avoid mutating the original
  const utcDate = new Date(phDate.getTime());
  
  // Get the current offset difference
  const currentOffset = utcDate.getTimezoneOffset();
  const offsetDifference = PHILIPPINE_OFFSET_MINUTES + currentOffset;
  
  // Apply the offset in reverse
  utcDate.setMinutes(utcDate.getMinutes() - offsetDifference);
  
  return utcDate;
}

/**
 * Format date to Philippine locale string
 * @param {Date|string} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export function formatPhilippineDate(date, options = {}) {
  const phDate = toPhilippineTime(date);
  
  const defaultOptions = {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return phDate.toLocaleDateString('en-PH', defaultOptions);
}

/**
 * Format time to Philippine locale string (12-hour format)
 * @param {Date|string} date - Date to format (UTC)
 * @returns {string} - Formatted time string (e.g., "2:30 PM")
 */
export function formatPhilippineTime(date) {
  // Parse the UTC date
  const utcDate = typeof date === 'string' ? new Date(date) : date;
  
  // Get UTC hours and minutes
  const utcHours = utcDate.getUTCHours();
  const utcMinutes = utcDate.getUTCMinutes();
  
  // Convert to Philippine time (UTC+8)
  let phHours = utcHours + 8;
  let phMinutes = utcMinutes;
  
  // Handle day overflow (e.g., 23:00 UTC + 8 = 31:00 → 7:00 next day)
  if (phHours >= 24) {
    phHours -= 24;
  }
  
  // Format to 12-hour format
  const ampm = phHours >= 12 ? 'PM' : 'AM';
  let displayHours = phHours % 12;
  displayHours = displayHours || 12; // Convert 0 to 12 for midnight
  
  const displayMinutes = String(phMinutes).padStart(2, '0');
  
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Format datetime to Philippine locale string
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted datetime string
 */
export function formatPhilippineDateTime(date) {
  const phDate = toPhilippineTime(date);
  
  return phDate.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format date for date input (YYYY-MM-DD)
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string for input field
 */
export function formatDateForInput(date) {
  const phDate = toPhilippineTime(date);
  const year = phDate.getFullYear();
  const month = String(phDate.getMonth() + 1).padStart(2, '0');
  const day = String(phDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get current Philippine time
 * @returns {Date} - Current date/time in Philippine timezone
 */
export function getNowPhilippineTime() {
  return toPhilippineTime(new Date());
}

/**
 * Parse time string and return formatted time (handles both ISO strings and time strings)
 * @param {string} timeString - Time string to parse (e.g., "14:30:00", "2023-01-01T14:30:00Z")
 * @returns {string} - Formatted time (e.g., "2:30 PM")
 */
export function parseAndFormatTime(timeString) {
  if (!timeString) return '';
  
  // Check if it's an ISO datetime string
  if (timeString.includes('T') || timeString.includes('-')) {
    return formatPhilippineTime(timeString);
  }
  
  // Handle time-only strings (HH:MM:SS or HH:MM)
  const timeParts = timeString.split(':');
  if (timeParts.length >= 2) {
    let hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours || 12; // Handle midnight (0 hours)
    
    return `${hours}:${minutes} ${ampm}`;
  }
  
  return timeString;
}

/**
 * Calculate days difference between two dates using hours-based calculation
 * @param {Date|string} startDate - Start date (can include time)
 * @param {Date|string} endDate - End date (can include time)
 * @returns {number} - Number of days difference (24 hours = 1 day, rounded up)
 */
export function calculateDaysDifference(startDate, endDate) {
  const start = toPhilippineTime(startDate);
  const end = toPhilippineTime(endDate);
  
  // Calculate total hours, then convert to days (24 hours = 1 day)
  const diffTime = Math.abs(end - start);
  const totalHours = diffTime / (1000 * 60 * 60);
  const diffDays = Math.ceil(totalHours / 24); // Round up partial days
  
  return diffDays;
}
