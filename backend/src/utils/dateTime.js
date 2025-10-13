/**
 * DateTime Utility Functions for Philippine Timezone (UTC+8)
 * Handles conversion between UTC and Philippine Standard Time for backend operations
 */

// Philippine timezone offset in milliseconds (UTC+8 = +8 hours)
const PHILIPPINE_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * Convert UTC date to Philippine time
 * @param {Date} date - UTC date
 * @returns {Date} - Date adjusted to Philippine time
 */
function toPhilippineTime(date) {
  if (!date) return null;
  
  const utcDate = date instanceof Date ? date : new Date(date);
  
  // PostgreSQL timestamptz stores in UTC, we need to adjust for display
  // Create a new date with Philippine offset
  return new Date(utcDate.getTime() + PHILIPPINE_OFFSET_MS);
}

/**
 * Convert Philippine time to UTC for database storage
 * @param {Date} date - Philippine time date
 * @returns {Date} - Date adjusted to UTC
 */
function toUTC(date) {
  if (!date) return null;
  
  const phDate = date instanceof Date ? date : new Date(date);
  
  // Subtract Philippine offset to get UTC
  return new Date(phDate.getTime() - PHILIPPINE_OFFSET_MS);
}

/**
 * Get current time in Philippine timezone
 * @returns {Date} - Current Philippine time
 */
function getNowPhilippineTime() {
  return toPhilippineTime(new Date());
}

/**
 * Format date for Philippine timezone (YYYY-MM-DD)
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatPhilippineDate(date) {
  if (!date) return null;
  
  const phDate = toPhilippineTime(date);
  return phDate.toISOString().split('T')[0];
}

/**
 * Format datetime for Philippine timezone (ISO string)
 * @param {Date} date - Date to format
 * @returns {string} - ISO formatted datetime string
 */
function formatPhilippineDateTime(date) {
  if (!date) return null;
  
  const phDate = toPhilippineTime(date);
  return phDate.toISOString();
}

/**
 * Parse date string as Philippine time
 * @param {string} dateString - Date string (YYYY-MM-DD)
 * @returns {Date} - Date object in UTC for database storage
 */
function parsePhilippineDateString(dateString) {
  if (!dateString) return null;
  
  // Parse the date as if it's in Philippine time
  const [year, month, day] = dateString.split('-').map(Number);
  const phDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  
  // Convert to UTC for storage
  return toUTC(phDate);
}

/**
 * Parse datetime string as Philippine time
 * @param {string} dateTimeString - DateTime string
 * @returns {Date} - Date object in UTC for database storage
 */
function parsePhilippineDateTimeString(dateTimeString) {
  if (!dateTimeString) return null;
  
  const phDate = new Date(dateTimeString);
  
  // If the string doesn't include timezone info, treat it as Philippine time
  if (!dateTimeString.includes('Z') && !dateTimeString.includes('+')) {
    return toUTC(phDate);
  }
  
  return phDate;
}

/**
 * Calculate day difference between two dates in Philippine timezone
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} - Number of days difference
 */
function calculateDaysDifference(startDate, endDate) {
  const start = toPhilippineTime(startDate);
  const end = toPhilippineTime(endDate);
  
  // Reset time to midnight for accurate day calculation
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Check if a date is in the past (Philippine timezone)
 * @param {Date} date - Date to check
 * @returns {boolean} - True if date is in the past
 */
function isDateInPast(date) {
  const now = getNowPhilippineTime();
  const checkDate = toPhilippineTime(date);
  
  return checkDate < now;
}

/**
 * Check if a date is today (Philippine timezone)
 * @param {Date} date - Date to check
 * @returns {boolean} - True if date is today
 */
function isToday(date) {
  const now = getNowPhilippineTime();
  const checkDate = toPhilippineTime(date);
  
  return now.toDateString() === checkDate.toDateString();
}

/**
 * Add days to a date (Philippine timezone aware)
 * @param {Date} date - Starting date
 * @param {number} days - Number of days to add
 * @returns {Date} - New date with days added (in UTC for storage)
 */
function addDays(date, days) {
  const phDate = toPhilippineTime(date);
  phDate.setDate(phDate.getDate() + days);
  return toUTC(phDate);
}

/**
 * Start of day in Philippine timezone (converted to UTC)
 * @param {Date} date - Date to get start of day
 * @returns {Date} - Start of day in UTC
 */
function startOfDay(date) {
  const phDate = toPhilippineTime(date);
  phDate.setHours(0, 0, 0, 0);
  return toUTC(phDate);
}

/**
 * End of day in Philippine timezone (converted to UTC)
 * @param {Date} date - Date to get end of day
 * @returns {Date} - End of day in UTC
 */
function endOfDay(date) {
  const phDate = toPhilippineTime(date);
  phDate.setHours(23, 59, 59, 999);
  return toUTC(phDate);
}

export {
  toPhilippineTime,
  toUTC,
  getNowPhilippineTime,
  formatPhilippineDate,
  formatPhilippineDateTime,
  parsePhilippineDateString,
  parsePhilippineDateTimeString,
  calculateDaysDifference,
  isDateInPast,
  isToday,
  addDays,
  startOfDay,
  endOfDay,
  PHILIPPINE_OFFSET_MS
};
