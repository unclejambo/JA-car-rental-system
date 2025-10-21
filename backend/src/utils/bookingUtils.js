/**
 * Booking utility functions for date conflict detection and validation
 */

/**
 * Add days to a date
 * @param {Date} date - The base date
 * @param {number} days - Number of days to add
 * @returns {Date} - New date
 */
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if two date ranges overlap
 * @param {Date} start1 - Start date of first range
 * @param {Date} end1 - End date of first range
 * @param {Date} start2 - Start date of second range
 * @param {Date} end2 - End date of second range
 * @returns {boolean} - True if ranges overlap
 */
export function dateRangesOverlap(start1, end1, start2, end2) {
  // Normalize dates to remove time component
  const s1 = new Date(start1);
  s1.setHours(0, 0, 0, 0);
  const e1 = new Date(end1);
  e1.setHours(0, 0, 0, 0);
  const s2 = new Date(start2);
  s2.setHours(0, 0, 0, 0);
  const e2 = new Date(end2);
  e2.setHours(0, 0, 0, 0);
  
  // Check if ranges overlap: start1 <= end2 AND start2 <= end1
  return s1 <= e2 && s2 <= e1;
}

/**
 * Check if a date falls within a range (inclusive)
 * @param {Date} date - The date to check
 * @param {Date} rangeStart - Start of range
 * @param {Date} rangeEnd - End of range
 * @returns {boolean} - True if date is in range
 */
export function dateInRange(date, rangeStart, rangeEnd) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const start = new Date(rangeStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(rangeEnd);
  end.setHours(0, 0, 0, 0);
  
  return d >= start && d <= end;
}

/**
 * Get unavailable periods for a car including maintenance days
 * @param {Array} bookings - Array of existing bookings for the car
 * @param {number} maintenanceDays - Number of maintenance days after each booking (default: 1)
 * @returns {Array} - Array of unavailable period objects with start_date, end_date, reason
 */
export function getUnavailablePeriods(bookings, maintenanceDays = 1) {
  const periods = [];
  
  // Filter only confirmed/active bookings (not Cancelled or Rejected)
  const activeBookings = bookings.filter(booking => 
    booking.booking_status !== 'Cancelled' && 
    booking.booking_status !== 'Rejected' &&
    booking.booking_status !== 'Returned' &&
    !booking.isCancel
  );
  
  for (const booking of activeBookings) {
    const bookingStart = new Date(booking.start_date);
    const bookingEnd = new Date(booking.end_date);
    
    // The booking period itself
    periods.push({
      start_date: bookingStart,
      end_date: bookingEnd,
      reason: 'Booked by another customer',
      booking_id: booking.booking_id,
      booking_status: booking.booking_status
    });
    
    // Maintenance period after the booking (1 day after end_date)
    const maintenanceStart = addDays(bookingEnd, 1);
    const maintenanceEnd = addDays(bookingEnd, maintenanceDays);
    
    periods.push({
      start_date: maintenanceStart,
      end_date: maintenanceEnd,
      reason: 'Maintenance period',
      booking_id: booking.booking_id,
      is_maintenance: true
    });
  }
  
  return periods;
}

/**
 * Check if a requested booking period conflicts with unavailable periods
 * @param {Date} requestedStart - Requested start date
 * @param {Date} requestedEnd - Requested end date
 * @param {Array} unavailablePeriods - Array of unavailable periods
 * @returns {Object} - { hasConflict: boolean, conflicts: Array }
 */
export function checkBookingConflict(requestedStart, requestedEnd, unavailablePeriods) {
  const conflicts = [];
  
  for (const period of unavailablePeriods) {
    if (dateRangesOverlap(requestedStart, requestedEnd, period.start_date, period.end_date)) {
      conflicts.push(period);
    }
  }
  
  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}

/**
 * Validate that requested dates don't conflict with existing bookings
 * This is the main validation function used during booking creation
 * @param {Date} requestedStart - Requested start date
 * @param {Date} requestedEnd - Requested end date
 * @param {Array} existingBookings - Array of existing bookings for the car
 * @param {number} maintenanceDays - Number of maintenance days (default: 1)
 * @returns {Object} - { isValid: boolean, message: string, conflicts: Array }
 */
export function validateBookingDates(requestedStart, requestedEnd, existingBookings, maintenanceDays = 1) {
  // Get all unavailable periods including maintenance
  const unavailablePeriods = getUnavailablePeriods(existingBookings, maintenanceDays);
  
  // Check for conflicts
  const { hasConflict, conflicts } = checkBookingConflict(requestedStart, requestedEnd, unavailablePeriods);
  
  if (!hasConflict) {
    return {
      isValid: true,
      message: 'Booking dates are available',
      conflicts: []
    };
  }
  
  // Build detailed error message
  const conflictMessages = conflicts.map(c => {
    const start = new Date(c.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const end = new Date(c.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end} (${c.reason})`;
  });
  
  return {
    isValid: false,
    message: `The requested dates conflict with existing bookings or maintenance periods:\n${conflictMessages.join('\n')}`,
    conflicts
  };
}

/**
 * Format date range for display
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {string} - Formatted date range
 */
export function formatDateRange(startDate, endDate) {
  const start = new Date(startDate).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  const end = new Date(endDate).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  return `${start} - ${end}`;
}

/**
 * Check if a date is before today (for preventing past bookings)
 * @param {Date} date - Date to check
 * @returns {boolean} - True if date is in the past
 */
export function isDateInPast(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  return checkDate < today;
}

/**
 * Get the day before a date (used for checking if booking on day before maintenance)
 * @param {Date} date - The date
 * @returns {Date} - Day before
 */
export function getDayBefore(date) {
  return addDays(date, -1);
}
