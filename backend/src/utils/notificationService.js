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
