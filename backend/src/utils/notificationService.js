import { sendOTPSMS } from './smsService.js';
import nodemailer from 'nodemailer';

/**
 * Send car availability notification to customer based on their preference
 * @param {Object} customer - Customer object with notification preferences
 * @param {Object} car - Car object with details
 * @returns {Promise<Object>} Result of notification attempt
 */
export async function sendCarAvailabilityNotification(customer, car) {
  const { isRecUpdate, contact_no, email, first_name, customer_id } = customer;
  const { make, model, year, car_id } = car;
  // Build notification messages
  const carName = `${make} ${model} (${year})`;
  const smsMessage = `Hi ${first_name}! The ${carName} is now available for booking at JA Car Rental. Book now!`;

  const emailSubject = `Car Available: ${carName}`;
  const emailBody = `
    Hi ${first_name},

    Great news! The ${carName} you were interested in is now available for booking.

    Visit our website to book this car now.

    Car Details:
    - Make & Model: ${carName}
    - Status: Available

    Thank you for choosing JA Car Rental!

    Best regards,
    JA Car Rental Team
  `;

  const results = {
    success: false,
    sms: null,
    email: null,
    method: null
  };

  try {
    switch (isRecUpdate) {
      case 1: // SMS only
        if (contact_no) {
          results.sms = await sendSMSNotification(contact_no, smsMessage);
          results.success = results.sms.success;
          results.method = 'SMS';
        } else {
          results.success = false;
          results.error = 'No contact number';
        }
        break;

      case 2: // Email only
        if (email) {
          results.email = await sendEmailNotification(email, emailSubject, emailBody);
          results.success = results.email.success;
          results.method = 'Email';
        } else {
          results.success = false;
          results.error = 'No email';
        }
        break;

      case 3: // Both SMS and Email
        const promises = [];

        if (contact_no) {
          promises.push(sendSMSNotification(contact_no, smsMessage));
        }
        if (email) {
          promises.push(sendEmailNotification(email, emailSubject, emailBody));
        }

        if (promises.length > 0) {
          const [smsResult, emailResult] = await Promise.allSettled(promises);

          results.sms = smsResult?.value || null;
          results.email = emailResult?.value || null;
          results.success = (smsResult?.status === 'fulfilled' && smsResult?.value?.success) ||
                           (emailResult?.status === 'fulfilled' && emailResult?.value?.success);
          results.method = 'Both';
        } else {
          results.success = false;
          results.error = 'No contact information';
        }
        break;

      default:
        results.success = false;
        results.error = 'Notifications disabled';
        results.method = 'None';
    }

    if (results.success) {
    } else {
    }

    return results;
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      sms: null,
      email: null
    };
  }
}

/**
 * Send SMS notification using Semaphore API
 * @param {String} phoneNumber - Customer phone number
 * @param {String} message - Message to send
 * @returns {Promise<Object>} SMS sending result
 */
async function sendSMSNotification(phoneNumber, message) {
  try {
    const SEMAPHORE_API_KEY = process.env.SEMAPHORE_API_KEY;

    // Check if SMS service is configured
    if (!SEMAPHORE_API_KEY) {
      // Return simulated success if not configured
      return {
        success: true,
        messageId: `msg_${Date.now()}`,
        recipient: phoneNumber,
        message: message,
        simulated: true
      };
    }

    // Send actual SMS via Semaphore API
    const response = await fetch('https://api.semaphore.co/api/v4/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        apikey: SEMAPHORE_API_KEY,
        number: phoneNumber,
        message: message,
        sendername: 'JACarRental'
      })
    });

    const data = await response.json();

    if (response.ok && data.length > 0 && data[0].message_id) {
      return { 
        success: true, 
        messageId: data[0].message_id,
        recipient: phoneNumber,
        message: message
      };
    } else {
      return { 
        success: false, 
        error: data.message || 'Failed to send SMS',
        details: data
      };
    }

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send Email notification
 * @param {String} email - Customer email
 * @param {String} subject - Email subject
 * @param {String} body - Email body
 * @returns {Promise<Object>} Email sending result
 */
async function sendEmailNotification(email, subject, body) {
  try {
    // Check if email is configured
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      // Return simulated success if not configured
      return {
        success: true,
        messageId: `email_${Date.now()}`,
        recipient: email,
        subject: subject,
        simulated: true
      };
    }

    // Create transporter using Gmail or custom SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use 'gmail' or configure custom SMTP
      auth: {
        user: emailUser,
        pass: emailPass // Use App Password for Gmail
      }
    });

    // Format HTML email
    const htmlBody = body.replace(/\n/g, '<br>').trim();

    // Send email
    const info = await transporter.sendMail({
      from: `"JA Car Rental" <${emailUser}>`,
      to: email,
      subject: subject,
      text: body,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🚗 ${subject}</h2>
          <div style="white-space: pre-line; line-height: 1.6;">
            ${htmlBody}
          </div>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            This is an automated message from JA Car Rental. Please do not reply to this email.
          </p>
        </div>
      `
    });
    return { 
      success: true, 
      messageId: info.messageId,
      recipient: email,
      subject: subject
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Calculate payment deadline based on booking start date
 * @param {Date} bookingDate - When the booking was created
 * @param {Date} startDate - When the rental starts
 * @returns {Object} Deadline info
 */
function calculatePaymentDeadline(bookingDate, startDate) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const daysUntilStart = Math.ceil((startDateOnly - today) / (1000 * 60 * 60 * 24));

  let deadline;
  let deadlineDescription;

  if (daysUntilStart === 0) {
    // Booking start date is TODAY - 1 hour deadline
    deadline = new Date(bookingDate.getTime() + (1 * 60 * 60 * 1000));
    deadlineDescription = '1 hour';
  } else if (daysUntilStart > 0 && daysUntilStart <= 3) {
    // Booking start date is within 3 days (but not today) - 24 hour deadline
    deadline = new Date(bookingDate.getTime() + (24 * 60 * 60 * 1000));
    deadlineDescription = '24 hours';
  } else {
    // Booking start date is more than 3 days away - 72 hour (3 day) deadline
    deadline = new Date(bookingDate.getTime() + (72 * 60 * 60 * 1000));
    deadlineDescription = '72 hours (3 days)';
  }

  return { deadline, deadlineDescription };
}

/**
 * Format date to Philippine timezone string
 * @param {Date} date - Date to format
 * @returns {String} Formatted date string
 */
function formatDatePH(date) {
  return new Date(date).toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Send booking success notification to customer
 * @param {Object} booking - Booking object with all details
 * @param {Object} customer - Customer object
 * @param {Object} car - Car object
 * @returns {Promise<Object>} Result of notification attempt
 */
export async function sendBookingSuccessNotification(booking, customer, car) {
  const { first_name, contact_no, email, customer_id } = customer;
  const { make, model, year } = car;
  const carName = `${make} ${model} (${year})`;
  // Calculate payment deadline
  const { deadline, deadlineDescription } = calculatePaymentDeadline(
    booking.booking_date,
    booking.start_date
  );

  const deadlineFormatted = formatDatePH(deadline);
  const startDateFormatted = formatDatePH(booking.start_date);
  const endDateFormatted = formatDatePH(booking.end_date);

  // Build notification messages
  const smsMessage = `Hi ${first_name}! Your booking for ${carName} is successful! To confirm, pay ₱1,000 for the reservation fee within ${deadlineDescription} (by ${deadlineFormatted}). Booking ID: ${booking.booking_id}. - JA Car Rental`;

  // ${booking.balance?.toLocaleString() || booking.total_amount?.toLocaleString()}

  const emailSubject = `Booking Successful - ${carName} (Booking #${booking.booking_id})`;
  const emailBody = `
Hi ${first_name},

Congratulations! Your booking has been successfully created.

📋 BOOKING DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Booking ID: ${booking.booking_id}
Car: ${carName}
Pickup Date: ${startDateFormatted}
Return Date: ${endDateFormatted}
Pickup Location: ${booking.pickup_loc || 'JA Car Rental Office'}
Drop-off Location: ${booking.dropoff_loc || 'JA Car Rental Office'}

💰 PAYMENT INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Amount: ₱${booking.total_amount?.toLocaleString() || '0'}
Amount Due: ₱${booking.balance?.toLocaleString() || booking.total_amount?.toLocaleString() || '0'}

⏰ IMPORTANT - PAYMENT DEADLINE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To confirm your booking, you must pay the reservation fee, which is ₱1,000 within ${deadlineDescription}.

Payment Deadline: ${deadlineFormatted}

⚠️ Your booking will be automatically cancelled if payment is not received by the deadline.

📝 NEXT STEPS:
1. Make a payment of at least ₱1,000 to confirm your booking
2. Wait for admin confirmation
3. You'll receive a confirmation notification once payment is verified

For payment instructions or assistance, please contact JA Car Rental.

Thank you for choosing JA Car Rental!

Best regards,
JA Car Rental Team
  `;

  const results = {
    success: false,
    sms: null,
    email: null,
    method: null
  };

  try {
    // Always send both SMS and Email for booking notifications
    const promises = [];

    if (contact_no) {
      promises.push(sendSMSNotification(contact_no, smsMessage));
    }
    if (email) {
      promises.push(sendEmailNotification(email, emailSubject, emailBody));
    }

    if (promises.length > 0) {
      const results_array = await Promise.allSettled(promises);

      results.sms = contact_no ? results_array[0]?.value || null : null;
      results.email = email ? results_array[contact_no ? 1 : 0]?.value || null : null;
      results.success = results_array.some(r => r.status === 'fulfilled' && r.value?.success);
      results.method = 'Both';
    } else {
      results.success = false;
      results.error = 'No contact information';
    }

    if (results.success) {
    } else {
    }

    return results;
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      sms: null,
      email: null
    };
  }
}

/**
 * Send booking confirmation notification to customer (after payment)
 * @param {Object} booking - Booking object with all details
 * @param {Object} customer - Customer object
 * @param {Object} car - Car object
 * @returns {Promise<Object>} Result of notification attempt
 */
export async function sendBookingConfirmationNotification(booking, customer, car) {
  const { first_name, contact_no, email, customer_id } = customer;
  const { make, model, year, license_plate } = car;
  const carName = `${make} ${model} (${year})`;
  const startDateFormatted = formatDatePH(booking.start_date);
  const endDateFormatted = formatDatePH(booking.end_date);

  // Build notification messages
  const smsMessage = `Hi ${first_name}! Your booking for ${carName} is now CONFIRMED! Pickup: ${startDateFormatted}. Booking ID: ${booking.booking_id}. See you soon! - JA Car Rental`;

  const emailSubject = `Booking Confirmed - ${carName} (Booking #${booking.booking_id})`;
  const emailBody = `
Hi ${first_name},

Great news! Your booking has been CONFIRMED. 🎉

📋 CONFIRMED BOOKING DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Booking ID: ${booking.booking_id}
Status: ✅ CONFIRMED

🚗 VEHICLE INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Car: ${carName}
${license_plate ? `Plate Number: ${license_plate}` : ''}

📅 RENTAL PERIOD:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pickup Date & Time: ${startDateFormatted}
Return Date & Time: ${endDateFormatted}

📍 LOCATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pickup Location: ${booking.pickup_loc || 'JA Car Rental Office'}
Drop-off Location: ${booking.dropoff_loc || 'JA Car Rental Office'}

💰 PAYMENT STATUS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Amount: ₱${booking.total_amount?.toLocaleString() || '0'}
Amount Paid: ₱${((booking.total_amount || 0) - (booking.balance || 0))?.toLocaleString() || '0'}
Remaining Balance: ₱${booking.balance?.toLocaleString() || '0'}

📝 WHAT'S NEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Arrive at the pickup location on the scheduled date and time
2. Bring a valid driver's license and ID
${booking.balance > 0 ? `3. Pay the remaining balance of ₱${booking.balance?.toLocaleString()} upon pickup` : ''}

${booking.balance > 0 ? `💡 TIP: You can pay the remaining balance online before pickup for a faster process.` : ''}

If you need to make any changes to your booking or have questions, please contact us.

We look forward to serving you!

Best regards,
JA Car Rental Team
  `;

  const results = {
    success: false,
    sms: null,
    email: null,
    method: null
  };

  try {
    // Always send both SMS and Email for confirmation notifications
    const promises = [];

    if (contact_no) {
      promises.push(sendSMSNotification(contact_no, smsMessage));
    }
    if (email) {
      promises.push(sendEmailNotification(email, emailSubject, emailBody));
    }

    if (promises.length > 0) {
      const results_array = await Promise.allSettled(promises);

      results.sms = contact_no ? results_array[0]?.value || null : null;
      results.email = email ? results_array[contact_no ? 1 : 0]?.value || null : null;
      results.success = results_array.some(r => r.status === 'fulfilled' && r.value?.success);
      results.method = 'Both';
    } else {
      results.success = false;
      results.error = 'No contact information';
    }

    if (results.success) {
    } else {
    }

    return results;
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      sms: null,
      email: null
    };
  }
}

/**
 * Send payment received notification (for GCash approval or Cash payment)
 * @param {Object} payment - Payment object with details
 * @param {Object} customer - Customer object
 * @param {Object} car - Car object
 * @param {Object} booking - Booking object
 * @param {string} paymentType - Type of payment ('gcash' or 'cash')
 * @returns {Promise<Object>} Result of notification attempt
 */
export async function sendPaymentReceivedNotification(payment, customer, car, booking, paymentType = 'payment') {
  const { first_name, contact_no, email, customer_id } = customer;
  const { make, model, year, license_plate } = car;
  const { booking_id, start_date, end_date, total_amount, balance } = booking;
  // Build notification messages
  const carName = `${make} ${model} (${year})`;
  const paymentMethodText = paymentType === 'gcash' ? 'GCash' : 'Cash';
  const startDateFormatted = formatDatePH(start_date);
  const endDateFormatted = formatDatePH(end_date);

  // SMS Message (keep it concise)
  const smsMessage = `Hi ${first_name}! We've received your ${paymentMethodText} payment of ₱${payment.amount.toLocaleString()} for your ${carName} booking (${startDateFormatted} to ${endDateFormatted}). Remaining balance: ₱${balance.toLocaleString()}. Thank you! - JA Car Rental`;

  // Email
  const emailSubject = `Payment Received - ₱${payment.amount.toLocaleString()} for ${carName}`;
  const emailBody = `
    Hi ${first_name},

    We are pleased to confirm that we have received your payment for your car rental booking.

    PAYMENT DETAILS:
    - Amount Received: ₱${payment.amount.toLocaleString()}
    - Payment Method: ${paymentMethodText}
    ${payment.reference_no ? `- Reference Number: ${payment.reference_no}` : ''}
    - Payment Date: ${formatDatePH(payment.paid_date || new Date())}

    BOOKING DETAILS:
    - Booking ID: #${booking_id}
    - Vehicle: ${carName}
    - Plate Number: ${license_plate || 'TBA'}
    - Pickup Date: ${startDateFormatted}
    - Return Date: ${endDateFormatted}

    PAYMENT SUMMARY:
    - Total Amount: ₱${total_amount.toLocaleString()}
    - Amount Paid: ₱${(total_amount - balance).toLocaleString()}
    - Remaining Balance: ₱${balance.toLocaleString()}
    ${balance > 0 ? '\n    ⚠️ Please pay the remaining balance before/on the pickup date.' : '\n    ✅ Your booking is fully paid!'}

    ${balance > 0 
      ? 'You can pay the remaining balance via GCash or cash before/on the day of pickup.' 
      : 'Your booking is now fully paid. We look forward to serving you!'}

    If you have any questions about your payment or booking, please don't hesitate to contact us.

    Thank you for choosing JA Car Rental!

    Best regards,
    JA Car Rental Team
  `;

  const results = {
    success: false,
    sms: null,
    email: null,
    method: null
  };

  try {
    // Always send both SMS and Email for payment confirmations
    const promises = [];

    if (contact_no) {
      promises.push(sendSMSNotification(contact_no, smsMessage));
    }
    if (email) {
      promises.push(sendEmailNotification(email, emailSubject, emailBody));
    }

    if (promises.length > 0) {
      const results_array = await Promise.allSettled(promises);

      results.sms = contact_no ? results_array[0]?.value || null : null;
      results.email = email ? results_array[contact_no ? 1 : 0]?.value || null : null;
      results.success = results_array.some(r => r.status === 'fulfilled' && r.value?.success);
      results.method = 'Both';
    } else {
      results.success = false;
      results.error = 'No contact information';
    }

    if (results.success) {
    } else {
    }

    return results;
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      sms: null,
      email: null
    };
  }
}

/**
 * Send cancellation approved notification
 * @param {Object} booking - Booking object with details
 * @param {Object} customer - Customer object
 * @param {Object} car - Car object
 * @returns {Promise<Object>} Result of notification attempt
 */
export async function sendCancellationApprovedNotification(booking, customer, car) {
  const { first_name, contact_no, email, customer_id } = customer;
  const { make, model, year, license_plate } = car;
  const { booking_id, start_date, end_date, total_amount } = booking;
  // Build notification messages
  const carName = `${make} ${model} (${year})`;
  const startDateFormatted = formatDatePH(start_date);
  const endDateFormatted = formatDatePH(end_date);

  // SMS Message (keep it concise)
  const smsMessage = `Hi ${first_name}! Your cancellation request for ${carName} (${startDateFormatted} to ${endDateFormatted}) has been approved. Any applicable refunds will be processed shortly. - JA Car Rental`;

  // Email
  const emailSubject = `Cancellation Approved - ${carName} Booking`;
  const emailBody = `
    Hi ${first_name},

    Your booking cancellation request has been approved.

    CANCELLED BOOKING DETAILS:
    - Booking ID: #${booking_id}
    - Vehicle: ${carName}
    - Plate Number: ${license_plate || 'TBA'}
    - Original Pickup Date: ${startDateFormatted}
    - Original Return Date: ${endDateFormatted}
    - Total Amount: ₱${total_amount.toLocaleString()}

    WHAT'S NEXT:
    - Your booking has been officially cancelled
    - If you made any payments, our team will review your refund eligibility
    - Refunds (if applicable) will be processed within 5-7 business days
    - You will receive a separate notification once the refund is processed

    REBOOKING:
    You're always welcome to book with us again! Visit our website to check available vehicles for your next trip.

    If you have any questions about your cancellation or refund, please don't hesitate to contact us.

    We hope to serve you again in the future!

    Best regards,
    JA Car Rental Team
  `;

  const results = {
    success: false,
    sms: null,
    email: null,
    method: null
  };

  try {
    // Always send both SMS and Email for cancellation confirmations
    const promises = [];

    if (contact_no) {
      promises.push(sendSMSNotification(contact_no, smsMessage));
    }
    if (email) {
      promises.push(sendEmailNotification(email, emailSubject, emailBody));
    }

    if (promises.length > 0) {
      const results_array = await Promise.allSettled(promises);

      results.sms = contact_no ? results_array[0]?.value || null : null;
      results.email = email ? results_array[contact_no ? 1 : 0]?.value || null : null;
      results.success = results_array.some(r => r.status === 'fulfilled' && r.value?.success);
      results.method = 'Both';
    } else {
      results.success = false;
      results.error = 'No contact information';
    }

    if (results.success) {
    } else {
    }

    return results;
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      sms: null,
      email: null
    };
  }
}

/**
 * Send cancellation request notification to admin/staff
 * @param {Object} booking - Booking object with details
 * @param {Object} customer - Customer object
 * @param {Object} car - Car object
 * @returns {Promise<Object>} Result of notification attempt
 */
export async function sendAdminCancellationRequestNotification(booking, customer, car) {
  // Import admin config
  const { ADMIN_NOTIFICATION_CONFIG } = await import('../config/adminNotificationConfig.js');

  const { first_name, last_name, contact_no, email } = customer;
  const { make, model, year, license_plate } = car;
  const { booking_id, start_date, end_date, total_amount, cancel_reason } = booking;
  // Build notification messages
  const carName = `${make} ${model} (${year})`;
  const customerName = `${first_name} ${last_name}`;
  const startDateFormatted = formatDatePH(start_date);
  const endDateFormatted = formatDatePH(end_date);

  // SMS Message (concise for admin)
  const smsMessage = `CANCELLATION REQUEST! ${customerName} wants to cancel ${carName} booking (${startDateFormatted} to ${endDateFormatted}). Booking ID: #${booking_id}. Please review. - JA Car Rental`;

  // Email
  const emailSubject = `Cancellation Request #${booking_id} - ${customerName} (${carName})`;
  const emailBody = `
    CANCELLATION REQUEST NOTIFICATION

    A customer has requested to cancel their booking and requires your review.

    CUSTOMER INFORMATION:
    - Name: ${customerName}
    - Email: ${email}
    - Phone: ${contact_no}

    BOOKING DETAILS:
    - Booking ID: #${booking_id}
    - Current Status: Cancellation Requested
    - Requested Date: ${formatDatePH(new Date())}

    VEHICLE INFORMATION:
    - Vehicle: ${carName}
    - Plate Number: ${license_plate || 'TBA'}

    RENTAL PERIOD:
    - Start Date: ${startDateFormatted}
    - End Date: ${endDateFormatted}
    - Duration: ${(() => {
        const startDateTime = new Date(start_date);
        const endDateTime = new Date(end_date);
        const totalHours = (endDateTime - startDateTime) / (1000 * 60 * 60);
        const days = Math.ceil(totalHours / 24);
        return `${totalHours.toFixed(1)} hours (${days} day${days !== 1 ? 's' : ''})`;
      })()}

    FINANCIAL DETAILS:
    - Total Amount: ₱${total_amount.toLocaleString()}

    CANCELLATION REASON:
    ${cancel_reason || 'No reason provided'}

    ACTION REQUIRED:
    Please review this cancellation request in the admin dashboard and either approve or deny it.
    Consider the cancellation reason, payment status, and rental period before making a decision.

    ---
    JA Car Rental Admin System
    This is an automated notification.
  `;

  const results = {
    success: false,
    sms: null,
    email: null,
    method: 'Both'
  };

  try {
    // Always send both SMS and Email to admin (no preference check needed)
    const promises = [];

    // Send SMS to admin phone
    promises.push(sendSMSNotification(ADMIN_NOTIFICATION_CONFIG.PHONE, smsMessage));

    // Send Email to admin email
    promises.push(sendEmailNotification(ADMIN_NOTIFICATION_CONFIG.EMAIL, emailSubject, emailBody));

    const results_array = await Promise.allSettled(promises);

    results.sms = results_array[0]?.value || null;
    results.email = results_array[1]?.value || null;
    results.success = results_array.some(r => r.status === 'fulfilled' && r.value?.success);

    if (results.success) {
    } else {
    }

    return results;
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      sms: null,
      email: null
    };
  }
}

/**
 * Send cancellation denied notification to customer
 * @param {Object} booking - Booking object with details
 * @param {Object} customer - Customer object
 * @param {Object} car - Car object
 * @returns {Promise<Object>} Result of notification attempt
 */
export async function sendCancellationDeniedNotification(booking, customer, car) {
  const { first_name, contact_no, email, customer_id, isRecUpdate } = customer;
  const { make, model, year, license_plate } = car;
  const { booking_id, start_date, end_date, total_amount } = booking;
  // Build notification messages
  const carName = `${make} ${model} (${year})`;
  const startDateFormatted = formatDatePH(start_date);
  const endDateFormatted = formatDatePH(end_date);

  // SMS Message (keep it concise)
  const smsMessage = `Hi ${first_name}! Your cancellation request for ${carName} (${startDateFormatted} to ${endDateFormatted}) has been denied. Your booking remains active. Please contact us if you have questions. - JA Car Rental`;

  // Email
  const emailSubject = `Cancellation Request Denied - ${carName} Booking`;
  const emailBody = `
    Hi ${first_name},

    We have reviewed your cancellation request and unfortunately, we cannot approve it at this time.

    BOOKING DETAILS:
    - Booking ID: #${booking_id}
    - Vehicle: ${carName}
    - Plate Number: ${license_plate || 'TBA'}
    - Pickup Date: ${startDateFormatted}
    - Return Date: ${endDateFormatted}
    - Total Amount: ₱${total_amount.toLocaleString()}
    - Status: Active (Cancellation Denied)

    WHAT THIS MEANS:
    - Your booking is still active and confirmed
    - The vehicle is reserved for you as scheduled
    - Your payment terms remain unchanged
    - You are expected to pick up the vehicle on the scheduled date

    WHY WAS IT DENIED?
    Cancellation requests may be denied due to:
    - Proximity to pickup date
    - Payment terms and conditions
    - Vehicle availability constraints
    - Non-refundable booking policies

    NEED TO DISCUSS?
    If you have concerns or need to discuss your booking, please contact us:
    - Phone: ${ADMIN_NOTIFICATION_CONFIG?.PHONE || '09925315378'}
    - Email: ${ADMIN_NOTIFICATION_CONFIG?.EMAIL || 'gregg.marayan@gmail.com'}

    We're here to help and want to ensure your rental experience meets your needs.

    Best regards,
    JA Car Rental Team
  `;

  const results = {
    success: false,
    sms: null,
    email: null,
    method: null
  };

  try {
    // Check customer notification preference
    const notifMethod = parseInt(isRecUpdate) || 0;

    if (notifMethod === 0) {
      results.success = false;
      results.error = 'Customer notifications disabled';
      return results;
    }

    const promises = [];

    if (notifMethod === 1 || notifMethod === 3) {
      // Send SMS
      if (contact_no) {
        promises.push(sendSMSNotification(contact_no, smsMessage));
        results.method = notifMethod === 1 ? 'SMS' : 'Both';
      }
    }

    if (notifMethod === 2 || notifMethod === 3) {
      // Send Email
      if (email) {
        promises.push(sendEmailNotification(email, emailSubject, emailBody));
        results.method = notifMethod === 2 ? 'Email' : 'Both';
      }
    }

    if (promises.length > 0) {
      const results_array = await Promise.allSettled(promises);

      if (notifMethod === 3) {
        results.sms = results_array[0]?.value || null;
        results.email = results_array[1]?.value || null;
      } else if (notifMethod === 1) {
        results.sms = results_array[0]?.value || null;
      } else if (notifMethod === 2) {
        results.email = results_array[0]?.value || null;
      }

      results.success = results_array.some(r => r.status === 'fulfilled' && r.value?.success);
    } else {
      results.success = false;
      results.error = 'No contact information';
    }

    if (results.success) {
    } else {
    }

    return results;
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      sms: null,
      email: null
    };
  }
}

/**
 * Send new booking notification to admin/staff
 * @param {Object} booking - Booking object with details
 * @param {Object} customer - Customer object
 * @param {Object} car - Car object
 * @returns {Promise<Object>} Result of notification attempt
 */
export async function sendAdminNewBookingNotification(booking, customer, car) {
  // Import admin config
  const { ADMIN_NOTIFICATION_CONFIG } = await import('../config/adminNotificationConfig.js');

  const { first_name, last_name, contact_no, email } = customer;
  const { make, model, year, license_plate } = car;
  const { booking_id, start_date, end_date, total_amount, purpose, pickup_loc } = booking;
  // Build notification messages
  const carName = `${make} ${model} (${year})`;
  const customerName = `${first_name} ${last_name}`;
  const startDateFormatted = formatDatePH(start_date);
  const endDateFormatted = formatDatePH(end_date);

  // SMS Message (concise for admin)
  const smsMessage = `NEW BOOKING ALERT! ${customerName} booked ${carName} (${startDateFormatted} to ${endDateFormatted}). Total: ₱${total_amount.toLocaleString()}. Booking ID: #${booking_id}. - JA Car Rental`;

  // Email
  const emailSubject = `New Booking #${booking_id} - ${customerName} (${carName})`;
  const emailBody = `
    NEW BOOKING NOTIFICATION

    A new booking has been created and requires your attention.

    CUSTOMER INFORMATION:
    - Name: ${customerName}
    - Email: ${email}
    - Phone: ${contact_no}

    BOOKING DETAILS:
    - Booking ID: #${booking_id}
    - Status: Pending
    - Created: ${formatDatePH(booking.booking_date || new Date())}

    VEHICLE INFORMATION:
    - Vehicle: ${carName}
    - Plate Number: ${license_plate || 'TBA'}
    - Pickup Location: ${pickup_loc || 'N/A'}

    RENTAL PERIOD:
    - Start Date: ${startDateFormatted}
    - End Date: ${endDateFormatted}
    - Duration: ${(() => {
        const startDateTime = new Date(start_date);
        const endDateTime = new Date(end_date);
        const totalHours = (endDateTime - startDateTime) / (1000 * 60 * 60);
        const days = Math.ceil(totalHours / 24);
        return `${totalHours.toFixed(1)} hours (${days} day${days !== 1 ? 's' : ''})`;
      })()}

    FINANCIAL DETAILS:
    - Total Amount: ₱${total_amount.toLocaleString()}
    - Payment Status: Unpaid
    - Balance Due: ₱${total_amount.toLocaleString()}

    PURPOSE:
    ${purpose || 'Not specified'}

    ACTION REQUIRED:
    Please review this booking in the admin dashboard and confirm the booking details with the customer.

    ---
    JA Car Rental Admin System
    This is an automated notification.
  `;

  const results = {
    success: false,
    sms: null,
    email: null,
    method: 'Both'
  };

  try {
    // Always send both SMS and Email to admin (no preference check needed)
    const promises = [];

    // Send SMS to admin phone
    promises.push(sendSMSNotification(ADMIN_NOTIFICATION_CONFIG.PHONE, smsMessage));

    // Send Email to admin email
    promises.push(sendEmailNotification(ADMIN_NOTIFICATION_CONFIG.EMAIL, emailSubject, emailBody));

    const results_array = await Promise.allSettled(promises);

    results.sms = results_array[0]?.value || null;
    results.email = results_array[1]?.value || null;
    results.success = results_array.some(r => r.status === 'fulfilled' && r.value?.success);

    if (results.success) {
    } else {
    }

    return results;
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      sms: null,
      email: null
    };
  }
}

/**
 * Send payment request notification to admin/staff
 * @param {Object} payment - Payment object with details
 * @param {Object} customer - Customer object
 * @param {Object} booking - Booking object
 * @param {Object} car - Car object
 * @returns {Promise<Object>} Result of notification attempt
 */
export async function sendAdminPaymentRequestNotification(payment, customer, booking, car) {
  // Import admin config
  const { ADMIN_NOTIFICATION_CONFIG } = await import('../config/adminNotificationConfig.js');

  const { first_name, last_name, contact_no, email } = customer;
  const { make, model, year, license_plate } = car;
  const { payment_id, payment_method, gcash_no, reference_no, amount, description } = payment;
  const { booking_id, start_date, end_date, total_amount } = booking;
  // Build notification messages
  const carName = `${make} ${model} (${year})`;
  const customerName = `${first_name} ${last_name}`;
  const startDateFormatted = formatDatePH(start_date);
  const endDateFormatted = formatDatePH(end_date);

  // SMS Message (concise for admin)
  let smsMessage = `PAYMENT REQUEST! ${customerName} submitted ${payment_method} payment of ₱${amount.toLocaleString()} for Booking #${booking_id} (${carName})`;

  if (payment_method === 'GCash' && reference_no) {
    smsMessage += `. Ref: ${reference_no}`;
  }

  smsMessage += `. Please verify. - JA Car Rental`;

  // Email
  const emailSubject = `Payment Request #${payment_id} - ${customerName} (${payment_method})`;
  const emailBody = `
    PAYMENT REQUEST NOTIFICATION

    A customer has submitted a payment request and requires your verification.

    CUSTOMER INFORMATION:
    - Name: ${customerName}
    - Email: ${email}
    - Phone: ${contact_no}

    PAYMENT DETAILS:
    - Payment ID: #${payment_id}
    - Payment Method: ${payment_method}
    ${payment_method === 'GCash' ? `- GCash Number: ${gcash_no || 'Not provided'}` : ''}
    ${reference_no ? `- Reference Number: ${reference_no}` : '- Reference Number: Not provided'}
    - Amount: ₱${amount.toLocaleString()}
    - Submitted Date: ${formatDatePH(new Date())}

    BOOKING INFORMATION:
    - Booking ID: #${booking_id}
    - Vehicle: ${carName}
    - Plate Number: ${license_plate || 'TBA'}
    - Rental Period: ${startDateFormatted} to ${endDateFormatted}
    - Total Booking Amount: ₱${total_amount.toLocaleString()}
    - Payment Purpose: ${description || `Payment for ${carName} booking`}

    FINANCIAL SUMMARY:
    - Payment Submitted: ₱${amount.toLocaleString()}
    - Remaining Balance: ₱${Math.max(0, total_amount - amount).toLocaleString()}
    ${amount >= total_amount ? '- Status: FULL PAYMENT' : '- Status: PARTIAL PAYMENT'}

    ${payment_method === 'GCash' ? `
    GCASH PAYMENT VERIFICATION:
    Please verify this GCash payment by:
    1. Checking your GCash transaction history for reference number: ${reference_no || 'N/A'}
    2. Confirming the amount matches: ₱${amount.toLocaleString()}
    3. Verifying the sender's GCash number: ${gcash_no || 'Not provided'}
    4. Approving the payment in the admin dashboard
    ` : `
    CASH PAYMENT VERIFICATION:
    This is a cash payment record. Please verify:
    1. Cash amount received: ₱${amount.toLocaleString()}
    2. Update the payment status in the admin dashboard
    `}

    ACTION REQUIRED:
    ${payment_method === 'GCash' 
      ? 'Please verify the GCash transaction and approve/reject this payment request in the admin dashboard.'
      : 'Please confirm the cash payment has been received and update the booking status accordingly.'
    }

    ---
    JA Car Rental Admin System
    This is an automated notification.
  `;

  const results = {
    success: false,
    sms: null,
    email: null,
    method: 'Both'
  };

  try {
    // Always send both SMS and Email to admin (no preference check needed)
    const promises = [];

    // Send SMS to admin phone
    promises.push(sendSMSNotification(ADMIN_NOTIFICATION_CONFIG.PHONE, smsMessage));

    // Send Email to admin email
    promises.push(sendEmailNotification(ADMIN_NOTIFICATION_CONFIG.EMAIL, emailSubject, emailBody));

    const results_array = await Promise.allSettled(promises);

    results.sms = results_array[0]?.value || null;
    results.email = results_array[1]?.value || null;
    results.success = results_array.some(r => r.status === 'fulfilled' && r.value?.success);

    if (results.success) {
    } else {
    }

    return results;
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      sms: null,
      email: null
    };
  }
}

/**
 * Send admin notification when a payment is completed/approved
 * @param {Object} payment - Payment object with details
 * @param {Object} customer - Customer object
 * @param {Object} booking - Booking object
 * @param {Object} car - Car object
 * @param {string} paymentType - Type of payment ('cash' or 'gcash')
 * @returns {Promise<Object>} Result of notification attempt
 */
export async function sendAdminPaymentCompletedNotification(payment, customer, booking, car, paymentType) {
  // Import admin config
  const { ADMIN_NOTIFICATION_CONFIG } = await import('../config/adminNotificationConfig.js');

  const { first_name, last_name, contact_no, email } = customer;
  const { make, model, year, license_plate } = car;
  const { payment_id, amount, reference_no, gcash_no } = payment;
  const { booking_id, start_date, end_date, total_amount, balance } = booking;
  // Build notification messages
  const carName = `${make} ${model} (${year})`;
  const customerName = `${first_name} ${last_name}`;
  const startDateFormatted = formatDatePH(start_date);
  const endDateFormatted = formatDatePH(end_date);
  const paymentMethodText = paymentType === 'gcash' ? 'GCash' : 'Cash';
  const actionText = paymentType === 'gcash' ? 'approved' : 'recorded';

  // SMS Message (concise for admin)
  let smsMessage = `PAYMENT ${actionText.toUpperCase()}! ${customerName} paid ₱${amount.toLocaleString()} via ${paymentMethodText} for ${carName}`;

  if (paymentType === 'gcash' && reference_no) {
    smsMessage += ` (Ref: ${reference_no})`;
  }

  smsMessage += `. Remaining: ₱${balance.toLocaleString()}. Booking #${booking_id}. - JA Car Rental`;

  // Email
  const emailSubject = `Payment ${paymentType === 'gcash' ? 'Approved' : 'Recorded'} - ₱${amount.toLocaleString()} from ${customerName}`;
  const emailBody = `
    PAYMENT ${actionText.toUpperCase()} NOTIFICATION

    A ${paymentMethodText} payment has been ${actionText} for a customer booking.

    CUSTOMER INFORMATION:
    - Name: ${customerName}
    - Email: ${email}
    - Phone: ${contact_no}

    PAYMENT DETAILS:
    - Payment ID: #${payment_id}
    - Payment Method: ${paymentMethodText}
    ${paymentType === 'gcash' ? `- GCash Number: ${gcash_no || 'Not provided'}` : ''}
    ${reference_no ? `- Reference Number: ${reference_no}` : ''}
    - Amount: ₱${amount.toLocaleString()}
    - ${paymentType === 'gcash' ? 'Approved' : 'Recorded'} Date: ${formatDatePH(new Date())}

    BOOKING INFORMATION:
    - Booking ID: #${booking_id}
    - Vehicle: ${carName}
    - Plate Number: ${license_plate || 'TBA'}
    - Rental Period: ${startDateFormatted} to ${endDateFormatted}

    PAYMENT SUMMARY:
    - Total Booking Amount: ₱${total_amount.toLocaleString()}
    - Payment Received: ₱${amount.toLocaleString()}
    - Remaining Balance: ₱${balance.toLocaleString()}
    ${balance <= 0 ? '\n    ✅ BOOKING FULLY PAID!' : ''}

    ${paymentType === 'gcash' 
      ? `GCASH PAYMENT STATUS:\n    ✅ This GCash payment has been verified and approved.\n    The customer has been notified of the payment confirmation.` 
      : `CASH PAYMENT STATUS:\n    ✅ This cash payment has been recorded in the system.\n    The customer has been notified of the payment receipt.`
    }

    ${balance > 0 
      ? `\nREMAINING BALANCE:\nThe customer still needs to pay ₱${balance.toLocaleString()} before or during pickup.` 
      : '\nThis booking is now fully paid and confirmed for the customer.'
    }

    ---
    JA Car Rental Admin System
    This is an automated notification.
  `;

  const results = {
    success: false,
    sms: null,
    email: null,
    method: 'Both'
  };

  try {
    // Always send both SMS and Email to admin (no preference check needed)
    const promises = [];

    // Send SMS to admin phone
    promises.push(sendSMSNotification(ADMIN_NOTIFICATION_CONFIG.PHONE, smsMessage));

    // Send Email to admin email
    promises.push(sendEmailNotification(ADMIN_NOTIFICATION_CONFIG.EMAIL, emailSubject, emailBody));

    const results_array = await Promise.allSettled(promises);

    results.sms = results_array[0]?.value || null;
    results.email = results_array[1]?.value || null;
    results.success = results_array.some(r => r.status === 'fulfilled' && r.value?.success);

    if (results.success) {
    } else {
    }

    return results;
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      sms: null,
      email: null
    };
  }
}

/**
 * Send admin notification when customer requests booking extension
 * @param {Object} booking - Booking object with details
 * @param {Object} customer - Customer object
 * @param {Object} car - Car object
 * @param {number} additionalDays - Number of days for extension
 * @param {number} additionalCost - Cost for extension
 * @returns {Promise<Object>} Result of notification attempt
 */
export async function sendAdminExtensionRequestNotification(booking, customer, car, additionalDays, additionalCost) {
  // Import admin config
  const { ADMIN_NOTIFICATION_CONFIG } = await import('../config/adminNotificationConfig.js');

  const { first_name, last_name, contact_no, email } = customer;
  const { make, model, year, license_plate } = car;
  const { booking_id, end_date, new_end_date, total_amount, balance } = booking;
  // Build notification messages
  const carName = `${make} ${model} (${year})`;
  const customerName = `${first_name} ${last_name}`;
  const oldEndDateFormatted = formatDatePH(end_date);
  const newEndDateFormatted = formatDatePH(new_end_date);

  // SMS Message (concise for admin)
  const smsMessage = `EXTENSION REQUEST! ${customerName} wants to extend ${carName} booking by ${additionalDays} days (${oldEndDateFormatted} → ${newEndDateFormatted}). Additional: ₱${additionalCost.toLocaleString()}. Booking #${booking_id}. - JA Car Rental`;

  // Email
  const emailSubject = `Extension Request #${booking_id} - ${customerName} (+${additionalDays} days)`;
  const emailBody = `
    EXTENSION REQUEST NOTIFICATION

    A customer has requested to extend their ongoing booking and requires your review.

    CUSTOMER INFORMATION:
    - Name: ${customerName}
    - Email: ${email}
    - Phone: ${contact_no}

    BOOKING DETAILS:
    - Booking ID: #${booking_id}
    - Current Status: Extension Requested
    - Requested Date: ${formatDatePH(new Date())}

    VEHICLE INFORMATION:
    - Vehicle: ${carName}
    - Plate Number: ${license_plate || 'TBA'}

    EXTENSION DETAILS:
    - Current End Date: ${oldEndDateFormatted}
    - Requested New End Date: ${newEndDateFormatted}
    - Additional Days: ${additionalDays} days
    - Extension Cost: ₱${additionalCost.toLocaleString()}

    FINANCIAL IMPACT:
    - Original Total: ₱${(total_amount - additionalCost).toLocaleString()}
    - Extension Cost: ₱${additionalCost.toLocaleString()}
    - New Total Amount: ₱${total_amount.toLocaleString()}
    - New Balance Due: ₱${balance.toLocaleString()}

    ACTION REQUIRED:
    Please review this extension request in the admin dashboard and either approve or reject it.
    Consider the availability of the vehicle and the customer's payment history before making a decision.

    IMPORTANT:
    - Verify the vehicle is available for the extended period
    - Check for any conflicting bookings
    - Customer will need to pay the additional ₱${additionalCost.toLocaleString()} for the extension

    ---
    JA Car Rental Admin System
    This is an automated notification.
  `;

  const results = {
    success: false,
    sms: null,
    email: null,
    method: 'Both'
  };

  try {
    // Always send both SMS and Email to admin (no preference check needed)
    const promises = [];

    // Send SMS to admin phone
    promises.push(sendSMSNotification(ADMIN_NOTIFICATION_CONFIG.PHONE, smsMessage));

    // Send Email to admin email
    promises.push(sendEmailNotification(ADMIN_NOTIFICATION_CONFIG.EMAIL, emailSubject, emailBody));

    const results_array = await Promise.allSettled(promises);

    results.sms = results_array[0]?.value || null;
    results.email = results_array[1]?.value || null;
    results.success = results_array.some(r => r.status === 'fulfilled' && r.value?.success);

    if (results.success) {
    } else {
    }

    return results;
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      sms: null,
      email: null
    };
  }
}

/**
 * Send extension approved notification to customer
 * @param {Object} booking - Booking object with details
 * @param {Object} customer - Customer object
 * @param {Object} car - Car object
 * @param {number} additionalDays - Number of days extension was approved for
 * @param {number} additionalCost - Cost for extension
 * @returns {Promise<Object>} Result of notification attempt
 */
export async function sendExtensionApprovedNotification(booking, customer, car, additionalDays, additionalCost) {
  const { first_name, contact_no, email, customer_id, isRecUpdate } = customer;
  const { make, model, year, license_plate } = car;
  const { booking_id, end_date, balance, total_amount } = booking;
  // Build notification messages
  const carName = `${make} ${model} (${year})`;
  const newEndDateFormatted = formatDatePH(end_date);

  // SMS Message (keep it concise)
  const smsMessage = `Hi ${first_name}! Your extension request for ${carName} has been APPROVED! New end date: ${newEndDateFormatted}. Additional cost: ₱${additionalCost.toLocaleString()}. Please pay the balance. - JA Car Rental`;

  // Email
  const emailSubject = `Extension Approved - ${carName} Booking Extended`;
  const emailBody = `
    Hi ${first_name},

    Great news! Your booking extension request has been approved! ✅

    BOOKING DETAILS:
    - Booking ID: #${booking_id}
    - Vehicle: ${carName}
    - Plate Number: ${license_plate || 'TBA'}
    - Status: Extension Approved

    EXTENSION DETAILS:
    - Additional Days: ${additionalDays} days
    - New Return Date: ${newEndDateFormatted}
    - Extension Cost: ₱${additionalCost.toLocaleString()}

    PAYMENT INFORMATION:
    - Total Booking Amount: ₱${total_amount.toLocaleString()}
    - Current Balance Due: ₱${balance.toLocaleString()}

    IMPORTANT - PAYMENT REQUIRED:
    ⚠️ Please pay the additional ₱${additionalCost.toLocaleString()} for the extension as soon as possible.
    You can pay via:
    - GCash (submit payment proof online)
    - Cash (at our office)

    The extended period will be confirmed once payment is received.

    WHAT'S NEXT:
    1. Make payment for the extension cost
    2. Continue enjoying your rental
    3. Return the vehicle on the new return date: ${newEndDateFormatted}

    If you have any questions about your extension or payment, please contact us.

    Thank you for choosing JA Car Rental!

    Best regards,
    JA Car Rental Team
  `;

  const results = {
    success: false,
    sms: null,
    email: null,
    method: null
  };

  try {
    // Check customer notification preference
    const notifMethod = parseInt(isRecUpdate) || 0;

    if (notifMethod === 0) {
      results.success = false;
      results.error = 'Customer notifications disabled';
      return results;
    }

    const promises = [];

    if (notifMethod === 1 || notifMethod === 3) {
      // Send SMS
      if (contact_no) {
        promises.push(sendSMSNotification(contact_no, smsMessage));
        results.method = notifMethod === 1 ? 'SMS' : 'Both';
      }
    }

    if (notifMethod === 2 || notifMethod === 3) {
      // Send Email
      if (email) {
        promises.push(sendEmailNotification(email, emailSubject, emailBody));
        results.method = notifMethod === 2 ? 'Email' : 'Both';
      }
    }

    if (promises.length > 0) {
      const results_array = await Promise.allSettled(promises);

      if (notifMethod === 3) {
        results.sms = results_array[0]?.value || null;
        results.email = results_array[1]?.value || null;
      } else if (notifMethod === 1) {
        results.sms = results_array[0]?.value || null;
      } else if (notifMethod === 2) {
        results.email = results_array[0]?.value || null;
      }

      results.success = results_array.some(r => r.status === 'fulfilled' && r.value?.success);
    } else {
      results.success = false;
      results.error = 'No contact information';
    }

    if (results.success) {
    } else {
    }

    return results;
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      sms: null,
      email: null
    };
  }
}

/**
 * Send extension rejected notification to customer
 * @param {Object} booking - Booking object with details
 * @param {Object} customer - Customer object
 * @param {Object} car - Car object
 * @param {number} additionalDays - Number of days extension was requested for
 * @param {number} deductedAmount - Amount that was deducted after rejection
 * @returns {Promise<Object>} Result of notification attempt
 */
export async function sendExtensionRejectedNotification(booking, customer, car, additionalDays, deductedAmount) {
  const { first_name, contact_no, email, customer_id, isRecUpdate } = customer;
  const { make, model, year, license_plate } = car;
  const { booking_id, end_date, total_amount } = booking;
  // Build notification messages
  const carName = `${make} ${model} (${year})`;
  const endDateFormatted = formatDatePH(end_date);

  // SMS Message (keep it concise)
  const smsMessage = `Hi ${first_name}! Your extension request for ${carName} has been denied. Original return date remains: ${endDateFormatted}. Please contact us if you have questions. - JA Car Rental`;

  // Email
  const emailSubject = `Extension Request Denied - ${carName} Booking`;
  const emailBody = `
    Hi ${first_name},

    We have reviewed your extension request and unfortunately, we cannot approve it at this time.

    BOOKING DETAILS:
    - Booking ID: #${booking_id}
    - Vehicle: ${carName}
    - Plate Number: ${license_plate || 'TBA'}
    - Original Return Date: ${endDateFormatted}
    - Status: Extension Denied

    WHAT THIS MEANS:
    - Your booking end date remains unchanged
    - You must return the vehicle on: ${endDateFormatted}
    - The additional cost of ₱${deductedAmount.toLocaleString()} has been removed from your balance
    - Your original booking terms remain in effect

    WHY WAS IT DENIED?
    Extension requests may be denied due to:
    - Vehicle already booked by another customer for that period
    - Maintenance scheduled for the vehicle
    - Other operational constraints

    ALTERNATIVE OPTIONS:
    If you still need the vehicle for a longer period:
    1. Contact us to check if a different vehicle is available
    2. Make a new booking for the additional period
    3. Discuss other possible arrangements with our staff

    NEED TO DISCUSS?
    Please contact us:
    - Phone: ${ADMIN_NOTIFICATION_CONFIG?.PHONE || '09925315378'}
    - Email: ${ADMIN_NOTIFICATION_CONFIG?.EMAIL || 'gregg.marayan@gmail.com'}

    We apologize for any inconvenience and appreciate your understanding.

    Best regards,
    JA Car Rental Team
  `;

  const results = {
    success: false,
    sms: null,
    email: null,
    method: null
  };

  try {
    // Check customer notification preference
    const notifMethod = parseInt(isRecUpdate) || 0;

    if (notifMethod === 0) {
      results.success = false;
      results.error = 'Customer notifications disabled';
      return results;
    }

    const promises = [];

    if (notifMethod === 1 || notifMethod === 3) {
      // Send SMS
      if (contact_no) {
        promises.push(sendSMSNotification(contact_no, smsMessage));
        results.method = notifMethod === 1 ? 'SMS' : 'Both';
      }
    }

    if (notifMethod === 2 || notifMethod === 3) {
      // Send Email
      if (email) {
        promises.push(sendEmailNotification(email, emailSubject, emailBody));
        results.method = notifMethod === 2 ? 'Email' : 'Both';
      }
    }

    if (promises.length > 0) {
      const results_array = await Promise.allSettled(promises);

      if (notifMethod === 3) {
        results.sms = results_array[0]?.value || null;
        results.email = results_array[1]?.value || null;
      } else if (notifMethod === 1) {
        results.sms = results_array[0]?.value || null;
      } else if (notifMethod === 2) {
        results.email = results_array[0]?.value || null;
      }

      results.success = results_array.some(r => r.status === 'fulfilled' && r.value?.success);
    } else {
      results.success = false;
      results.error = 'No contact information';
    }

    if (results.success) {
    } else {
    }

    return results;
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      sms: null,
      email: null
    };
  }
}

/**
 * Send driver assignment notification (SMS only) - Status 1 (Booking Unconfirmed)
 * @param {Object} booking - Booking object
 * @param {Object} driver - Driver object
 * @param {Object} customer - Customer object
 * @param {Object} car - Car object
 */
export async function sendDriverAssignedNotification(booking, driver, customer, car) {
  const { first_name: driverFirstName, last_name: driverLastName, contact_no: driverPhone, drivers_id } = driver;
  const { first_name: customerFirstName, last_name: customerLastName, contact_no: customerPhone } = customer;
  const { make, model, year, license_plate } = car;
  const carName = `${make} ${model} (${year})`;
  const startDateFormatted = formatDatePH(booking.start_date);
  const endDateFormatted = formatDatePH(booking.end_date);
  const customerName = `${customerFirstName} ${customerLastName}`;

  // SMS message for driver - concise and informative
  const smsMessage = `Hi ${driverFirstName}! You've been assigned to a new booking (ID: ${booking.booking_id}). Customer: ${customerName} (${customerPhone}). Car: ${carName} [${license_plate}]. Pickup: ${startDateFormatted}. Return: ${endDateFormatted}. Location: ${booking.pickup_loc || 'JA Office'}. Payment pending. - JA Car Rental`;

  const results = {
    success: false,
    sms: null,
    method: 'SMS'
  };

  try {
    // Send SMS only to driver
    if (driverPhone) {
      results.sms = await sendSMSNotification(driverPhone, smsMessage);
      results.success = results.sms.success;
    } else {
      results.success = false;
      results.error = 'No contact number';
    }

    if (results.success) {
    } else {
    }

    return results;
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      sms: null
    };
  }
}

/**
 * Send driver booking confirmed notification (SMS only) - Status 2 (Booking Confirmed)
 * @param {Object} booking - Booking object
 * @param {Object} driver - Driver object
 * @param {Object} customer - Customer object
 * @param {Object} car - Car object
 */
export async function sendDriverBookingConfirmedNotification(booking, driver, customer, car) {
  const { first_name: driverFirstName, last_name: driverLastName, contact_no: driverPhone, drivers_id } = driver;
  const { first_name: customerFirstName, last_name: customerLastName, contact_no: customerPhone } = customer;
  const { make, model, year, license_plate } = car;
  const carName = `${make} ${model} (${year})`;
  const startDateFormatted = formatDatePH(booking.start_date);
  const endDateFormatted = formatDatePH(booking.end_date);
  const customerName = `${customerFirstName} ${customerLastName}`;

  // SMS message for driver - confirmed booking ready for release
  const smsMessage = `Hi ${driverFirstName}! Booking ${booking.booking_id} is now CONFIRMED. Customer: ${customerName} (${customerPhone}). Car: ${carName} [${license_plate}]. Pickup: ${startDateFormatted}. Return: ${endDateFormatted}. Location: ${booking.pickup_loc || 'JA Office'}. Please prepare for car release. - JA Car Rental`;

  const results = {
    success: false,
    sms: null,
    method: 'SMS'
  };

  try {
    // Send SMS only to driver
    if (driverPhone) {
      results.sms = await sendSMSNotification(driverPhone, smsMessage);
      results.success = results.sms.success;
    } else {
      results.success = false;
      results.error = 'No contact number';
    }

    if (results.success) {
    } else {
    }

    return results;
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      sms: null
    };
  }
}

/**
 * Send test notification (for debugging)
 * @param {Object} params - Test parameters
 */
export async function sendTestNotification(params) {
  const testCustomer = {
    customer_id: 999,
    first_name: 'Test',
    contact_no: params.phoneNumber,
    email: params.email,
    isRecUpdate: params.notificationMethod // 1=SMS, 2=Email, 3=Both
  };

  const testCar = {
    car_id: 1,
    make: 'Toyota',
    model: 'Vios',
    year: 2024
  };

  return await sendCarAvailabilityNotification(testCustomer, testCar);
}

/**
 * Send return reminder notification to customer (on return date at 00:00)
 * @param {Object} booking - Booking object
 * @param {Object} customer - Customer object
 * @param {Object} car - Car object
 * @returns {Promise<Object>} Result of notification attempt
 */
export async function sendReturnReminderNotification(booking, customer, car) {
  const { first_name, contact_no, email, isRecUpdate } = customer;
  const { make, model, year, license_plate } = car;
  const carName = `${make} ${model} (${year})`;
  
  const returnTime = booking.dropoff_time || booking.end_date;
  const returnTimeFormatted = formatDatePH(returnTime);

  // SMS message with delay notification instruction
  const smsMessage = `Hi ${first_name}! Reminder: Today is your car return date. Scheduled return: ${returnTimeFormatted}. Car: ${carName} [${license_plate}]. Return Location: ${booking.dropoff_loc || 'JA Office'}. IMPORTANT: If you cannot return the car on time, please call us immediately to notify of any delay. - JA Car Rental`;

  // Email subject and body
  const emailSubject = `Return Reminder - ${carName}`;
  const emailBody = `
    Hi ${first_name},

    This is a friendly reminder that today is your car return date.

    Return Details:
    - Car: ${carName} [${license_plate}]
    - Return Time: ${returnTimeFormatted}
    - Return Location: ${booking.dropoff_loc || 'JA Car Rental Office'}
    - Booking ID: ${booking.booking_id}

    IMPORTANT NOTICE:
    If you cannot return the car on time, please call us immediately at [Your Phone Number] to notify us of any delay. Late returns may incur additional fees.

    Thank you for choosing JA Car Rental!

    Best regards,
    JA Car Rental Team
  `;

  const results = {
    success: false,
    sms: null,
    email: null,
    method: null
  };

  try {
    switch (isRecUpdate) {
      case 1: // SMS only
        if (contact_no) {
          results.sms = await sendSMSNotification(contact_no, smsMessage);
          results.success = results.sms.success;
          results.method = 'SMS';
        } else {
          results.success = false;
          results.error = 'No contact number';
        }
        break;

      case 2: // Email only
        if (email) {
          results.email = await sendEmailNotification(email, emailSubject, emailBody);
          results.success = results.email.success;
          results.method = 'Email';
        } else {
          results.success = false;
          results.error = 'No email';
        }
        break;

      case 3: // Both SMS and Email
        const promises = [];

        if (contact_no) {
          promises.push(sendSMSNotification(contact_no, smsMessage));
        }
        if (email) {
          promises.push(sendEmailNotification(email, emailSubject, emailBody));
        }

        if (promises.length > 0) {
          const [smsResult, emailResult] = await Promise.allSettled(promises);

          results.sms = smsResult?.value || null;
          results.email = emailResult?.value || null;
          results.success = (smsResult?.status === 'fulfilled' && smsResult?.value?.success) ||
                           (emailResult?.status === 'fulfilled' && emailResult?.value?.success);
          results.method = 'Both';
        } else {
          results.success = false;
          results.error = 'No contact information';
        }
        break;

      default:
        results.success = false;
        results.error = 'Notifications disabled';
        results.method = 'None';
    }

    if (results.success) {
      console.log(`✅ Return reminder sent to customer ${customer.customer_id} for booking ${booking.booking_id}`);
    } else {
      console.log(`❌ Failed to send return reminder to customer ${customer.customer_id}:`, results.error);
    }

    return results;
  } catch (error) {
    console.error('Error sending return reminder:', error);
    return { 
      success: false, 
      error: error.message,
      sms: null,
      email: null
    };
  }
}
