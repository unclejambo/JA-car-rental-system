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
  
  console.log(`📬 Sending availability notification for ${make} ${model} to customer ${customer_id}`);
  console.log(`   Notification preference: ${isRecUpdate} (0=none, 1=SMS, 2=Email, 3=Both)`);
  
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
        console.log(`   → Sending SMS to ${contact_no}`);
        if (contact_no) {
          results.sms = await sendSMSNotification(contact_no, smsMessage);
          results.success = results.sms.success;
          results.method = 'SMS';
        } else {
          console.log(`   ⚠️  No contact number available for customer ${customer_id}`);
          results.success = false;
          results.error = 'No contact number';
        }
        break;
        
      case 2: // Email only
        console.log(`   → Sending Email to ${email}`);
        if (email) {
          results.email = await sendEmailNotification(email, emailSubject, emailBody);
          results.success = results.email.success;
          results.method = 'Email';
        } else {
          console.log(`   ⚠️  No email available for customer ${customer_id}`);
          results.success = false;
          results.error = 'No email';
        }
        break;
        
      case 3: // Both SMS and Email
        console.log(`   → Sending SMS to ${contact_no} and Email to ${email}`);
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
          console.log(`   ⚠️  No contact info available for customer ${customer_id}`);
          results.success = false;
          results.error = 'No contact information';
        }
        break;
        
      default:
        console.log(`   ℹ️  Customer has notifications disabled (isRecUpdate: ${isRecUpdate})`);
        results.success = false;
        results.error = 'Notifications disabled';
        results.method = 'None';
    }
    
    if (results.success) {
      console.log(`   ✅ Notification sent successfully via ${results.method}`);
    } else {
      console.log(`   ❌ Failed to send notification: ${results.error || 'Unknown error'}`);
    }
    
    return results;
  } catch (error) {
    console.error(`   ❌ Error sending notification:`, error);
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
      console.log(`      ⚠️  SMS service not configured (SEMAPHORE_API_KEY missing)`);
      console.log(`      📱 SMS would be sent to ${phoneNumber}: "${message}"`);
      
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
    console.log(`      📱 Sending SMS to ${phoneNumber}...`);
    
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
      console.log(`      ✅ SMS sent successfully! Message ID: ${data[0].message_id}`);
      return { 
        success: true, 
        messageId: data[0].message_id,
        recipient: phoneNumber,
        message: message
      };
    } else {
      console.error(`      ❌ SMS Error:`, data);
      return { 
        success: false, 
        error: data.message || 'Failed to send SMS',
        details: data
      };
    }
    
  } catch (error) {
    console.error(`      ❌ SMS Error:`, error.message);
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
      console.log(`      ⚠️  Email service not configured (EMAIL_USER or EMAIL_PASS missing)`);
      console.log(`      📧 Email would be sent to ${email}`);
      console.log(`         Subject: ${subject}`);
      
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
    console.log(`      📧 Sending email to ${email}...`);
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
    
    console.log(`      ✅ Email sent successfully! Message ID: ${info.messageId}`);
    
    return { 
      success: true, 
      messageId: info.messageId,
      recipient: email,
      subject: subject
    };
    
  } catch (error) {
    console.error(`      ❌ Email Error:`, error.message);
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
  
  console.log(`📬 Sending booking success notification to customer ${customer_id} for booking ${booking.booking_id}`);
  
  // Calculate payment deadline
  const { deadline, deadlineDescription } = calculatePaymentDeadline(
    booking.booking_date,
    booking.start_date
  );
  
  const deadlineFormatted = formatDatePH(deadline);
  const startDateFormatted = formatDatePH(booking.start_date);
  const endDateFormatted = formatDatePH(booking.end_date);
  
  // Build notification messages
  const smsMessage = `Hi ${first_name}! Your booking for ${carName} is successful! To confirm, pay ₱${booking.balance?.toLocaleString() || booking.total_amount?.toLocaleString()} within ${deadlineDescription} (by ${deadlineFormatted}). Booking ID: ${booking.booking_id}. - JA Car Rental`;
  
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
To confirm your booking, you must pay at least ₱1,000 (minimum confirmation fee) within ${deadlineDescription}.

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
    console.log(`   → Sending SMS to ${contact_no} and Email to ${email}`);
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
      console.log(`   ⚠️  No contact info available for customer ${customer_id}`);
      results.success = false;
      results.error = 'No contact information';
    }
    
    if (results.success) {
      console.log(`   ✅ Booking notification sent successfully`);
    } else {
      console.log(`   ❌ Failed to send booking notification: ${results.error || 'Unknown error'}`);
    }
    
    return results;
  } catch (error) {
    console.error(`   ❌ Error sending booking notification:`, error);
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
  
  console.log(`📬 Sending booking confirmation notification to customer ${customer_id} for booking ${booking.booking_id}`);
  
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
    console.log(`   → Sending SMS to ${contact_no} and Email to ${email}`);
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
      console.log(`   ⚠️  No contact info available for customer ${customer_id}`);
      results.success = false;
      results.error = 'No contact information';
    }
    
    if (results.success) {
      console.log(`   ✅ Confirmation notification sent successfully`);
    } else {
      console.log(`   ❌ Failed to send confirmation notification: ${results.error || 'Unknown error'}`);
    }
    
    return results;
  } catch (error) {
    console.error(`   ❌ Error sending confirmation notification:`, error);
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
  
  console.log(`💰 Sending payment received notification for booking ${booking_id}`);
  console.log(`   Payment type: ${paymentType}, Amount: ₱${payment.amount}`);
  
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
    ${balance > 0 ? '\n    ⚠️ Please pay the remaining balance before your pickup date.' : '\n    ✅ Your booking is fully paid!'}
    
    ${balance > 0 
      ? 'You can pay the remaining balance via GCash or cash on the day of pickup.' 
      : 'Your booking is now fully confirmed. We look forward to serving you!'}
    
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
    console.log(`   → Sending SMS to ${contact_no} and Email to ${email}`);
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
      console.log(`   ⚠️  No contact info available for customer ${customer_id}`);
      results.success = false;
      results.error = 'No contact information';
    }
    
    if (results.success) {
      console.log(`   ✅ Payment received notification sent successfully`);
    } else {
      console.log(`   ❌ Failed to send payment notification: ${results.error || 'Unknown error'}`);
    }
    
    return results;
  } catch (error) {
    console.error(`   ❌ Error sending payment notification:`, error);
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
  
  console.log(`🚫 Sending cancellation approved notification for booking ${booking_id}`);
  
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
    console.log(`   → Sending SMS to ${contact_no} and Email to ${email}`);
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
      console.log(`   ⚠️  No contact info available for customer ${customer_id}`);
      results.success = false;
      results.error = 'No contact information';
    }
    
    if (results.success) {
      console.log(`   ✅ Cancellation approved notification sent successfully`);
    } else {
      console.log(`   ❌ Failed to send cancellation notification: ${results.error || 'Unknown error'}`);
    }
    
    return results;
  } catch (error) {
    console.error(`   ❌ Error sending cancellation notification:`, error);
    return { 
      success: false, 
      error: error.message,
      sms: null,
      email: null
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
