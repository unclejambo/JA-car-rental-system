/**
 * Booking utility functions for payment deadlines and fee calculations
 */

/**
 * Calculate payment deadline based on booking start date
 * @param {string|Date} startDate - The booking start date
 * @returns {Object} - Contains deadline date, hours, and urgency level
 */
export const calculatePaymentDeadline = (startDate) => {
  if (!startDate) return { deadline: null, hours: null, urgencyLevel: 'info' };
  
  const now = new Date();
  const bookingStart = new Date(startDate);
  const daysDifference = Math.ceil((bookingStart - now) / (1000 * 60 * 60 * 24));
  
  let deadline, hours, urgencyLevel;
  
  if (daysDifference === 0) {
    // Same day booking: must pay within 1 hour
    deadline = new Date(now.getTime() + (1 * 60 * 60 * 1000));
    hours = 1;
    urgencyLevel = 'error';
  } else if (daysDifference < 4) {
    // Less than 4 days: must pay within 24 hours
    deadline = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    hours = 24;
    urgencyLevel = 'warning';
  } else {
    // 4 or more days: must pay within 3 days (72 hours)
    deadline = new Date(now.getTime() + (72 * 60 * 60 * 1000));
    hours = 72;
    urgencyLevel = 'info';
  }
  
  return { deadline, hours, urgencyLevel };
};

/**
 * Format payment deadline message for display
 * @param {string|Date} startDate - The booking start date
 * @returns {Object} - Contains formatted message, urgency level, and deadline string
 */
export const formatPaymentDeadlineMessage = (startDate) => {
  const { deadline, hours, urgencyLevel } = calculatePaymentDeadline(startDate);
  
  if (!deadline) return { message: '', urgencyLevel: 'info', deadline: '' };
  
  const now = new Date();
  const bookingStart = new Date(startDate);
  const daysDifference = Math.ceil((bookingStart - now) / (1000 * 60 * 60 * 24));
  
  let message = '';
  
  if (daysDifference === 0) {
    message = `⚡ URGENT: Same-day booking requires payment within 1 hour. You can avail the service 3 hours after payment confirmation.`;
  } else if (daysDifference < 4) {
    message = `⏰ Payment required within 24 hours to confirm this booking.`;
  } else {
    message = `💡 Payment required within 3 days to confirm this booking.`;
  }
  
  return {
    message,
    urgencyLevel,
    deadline: deadline.toLocaleString()
  };
};

/**
 * Calculate total booking cost including fees
 * @param {Object} params - Booking parameters
 * @returns {number} - Total cost
 */
export const calculateBookingTotal = ({
  startDate,
  endDate,
  dailyRate,
  fees = {},
  isSelfDrive = true
}) => {
  if (!startDate || !endDate || !dailyRate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  
  // Base cost: daily rate * number of days
  let totalCost = daysDiff * dailyRate;
  
  // Add reservation fee (always included)
  if (fees.reservation_fee) {
    totalCost += fees.reservation_fee;
  }
  
  // Add cleaning fee (always included)
  if (fees.cleaning_fee) {
    totalCost += fees.cleaning_fee;
  }
  
  // Add driver fee if not self-service
  if (!isSelfDrive && fees.driver_fee) {
    totalCost += fees.driver_fee * daysDiff; // Driver fee per day
  }
  
  return totalCost;
};

/**
 * Get fee breakdown for display
 * @param {Object} params - Booking parameters
 * @returns {Object} - Detailed fee breakdown
 */
export const getFeeBreakdown = ({
  startDate,
  endDate,
  dailyRate,
  fees = {},
  isSelfDrive = true
}) => {
  if (!startDate || !endDate || !dailyRate) {
    return {
      baseCost: 0,
      reservationFee: 0,
      cleaningFee: 0,
      driverFee: 0,
      totalDays: 0,
      totalCost: 0
    };
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  
  const baseCost = totalDays * dailyRate;
  const reservationFee = fees.reservation_fee || 0;
  const cleaningFee = fees.cleaning_fee || 0;
  const driverFee = !isSelfDrive ? (fees.driver_fee || 0) * totalDays : 0;
  
  const totalCost = baseCost + reservationFee + cleaningFee + driverFee;
  
  return {
    baseCost,
    reservationFee,
    cleaningFee,
    driverFee,
    totalDays,
    totalCost
  };
};

/**
 * Check if booking is same-day
 * @param {string|Date} startDate - The booking start date
 * @returns {boolean} - True if same day booking
 */
export const isSameDayBooking = (startDate) => {
  if (!startDate) return false;
  const bookingStart = new Date(startDate);
  const today = new Date();
  return bookingStart.toDateString() === today.toDateString();
};

/**
 * Get days until booking starts
 * @param {string|Date} startDate - The booking start date
 * @returns {number} - Number of days until booking starts
 */
export const getDaysUntilBooking = (startDate) => {
  if (!startDate) return 0;
  const now = new Date();
  const bookingStart = new Date(startDate);
  return Math.ceil((bookingStart - now) / (1000 * 60 * 60 * 24));
};