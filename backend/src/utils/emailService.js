/**
 * Email Service for sending verification codes and password reset emails
 * 
 * This service handles:
 * - Sending verification codes via email
 * - Password reset email notifications
 * - Email configuration and error handling
 */

import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Email configuration - update these with your email service provider
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS, // Your email password or app password
  },
};

/**
 * Create email transporter
 */
const createTransporter = () => {
  try {
    console.log('Creating email transporter with config:', {
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      user: EMAIL_CONFIG.auth.user,
      hasPassword: !!EMAIL_CONFIG.auth.pass
    });

    const transporter = nodemailer.createTransport(EMAIL_CONFIG);
    
    return transporter;
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    throw new Error('Email service configuration error');
  }
};

/**
 * Generate a 6-digit verification code
 * @returns {string} 6-digit numeric code
 */
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate a secure reset token
 * @returns {string} Secure random token
 */
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Send verification code email
 * @param {string} email - Recipient email address
 * @param {string} code - 6-digit verification code
 * @param {string} userName - User's name (optional)
 * @returns {Promise<boolean>} Success status
 */
export const sendVerificationEmail = async (email, code, userName = 'User') => {
  try {
    console.log(`📧 Preparing to send verification email to: ${email}`);
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'JA Car Rental System',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: '🔐 Your Password Reset Verification Code',
      html: getEmailTemplate(code, 'password_reset'),
      text: `Your password reset verification code is: ${code}. This code will expire in 15 minutes. If you didn't request this, please ignore this email.`
    };

    // In development mode, we can still send emails for testing
    // but we'll also log the code to console for easier testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`🧪 DEVELOPMENT MODE - Verification code for ${email}: ${code}`);
      console.log('📧 Sending email with subject:', mailOptions.subject);
      // Continue to actually send the email in development for testing
    }

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    
    return info;
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    throw error;
  }
};

/**
 * Send password reset confirmation email
 * @param {string} email - Recipient email address
 * @param {string} userName - User's name
 * @returns {Promise<boolean>} Success status
 */
export const sendPasswordResetConfirmation = async (email, userName) => {
  try {
    console.log(`📧 Sending password reset confirmation to: ${email}`);
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'JA Car Rental System',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: '✅ Password Reset Successful',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                .header { text-align: center; color: #28a745; margin-bottom: 30px; }
                .content { line-height: 1.6; color: #333; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Password Reset Successful</h1>
                </div>
                <div class="content">
                    <p>Hello ${userName || 'there'},</p>
                    <p>Your password has been successfully reset for your JA Car Rental account.</p>
                    <p>If you did not make this change, please contact our support team immediately.</p>
                    <p>Best regards,<br>JA Car Rental Team</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `Your password has been successfully reset for your JA Car Rental account. If you did not make this change, please contact support.`
    };

    // In development mode, we can still send emails for testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`🧪 DEVELOPMENT MODE - Password reset confirmation for ${email}`);
      console.log('📧 Sending confirmation email with subject:', mailOptions.subject);
      // Continue to actually send the email in development for testing
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Confirmation email sent successfully:', info.messageId);
    
    return info;
  } catch (error) {
    console.error('❌ Failed to send confirmation email:', error);
    throw error;
  }
}

/**
 * Get email subject based on purpose
 * @param {string} purpose - Email purpose
 * @returns {string} Email subject
 */
const getEmailSubject = (purpose) => {
  switch (purpose) {
    case 'password_reset':
      return 'Password Reset Verification Code - JA Car Rental';
    case 'account_verification':
      return 'Account Verification Code - JA Car Rental';
    default:
      return 'Verification Code - JA Car Rental';
  }
};

/**
 * Get HTML email template
 * @param {string} code - Verification code
 * @param {string} purpose - Email purpose
 * @returns {string} HTML template
 */
const getEmailTemplate = (code, purpose) => {
  const title = purpose === 'password_reset' ? 'Password Reset' : 'Account Verification';
  const message = purpose === 'password_reset' 
    ? 'You requested to reset your password. Use the verification code below:'
    : 'Please use the verification code below to verify your account:';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${title} - JA Car Rental</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3F86F1, #F13F3F); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">JA Car Rental</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">${title}</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0;">Verification Required</h2>
        <p style="font-size: 16px; margin-bottom: 25px;">${message}</p>
        
        <div style="background: white; border: 2px dashed #3F86F1; border-radius: 8px; padding: 25px; text-align: center; margin: 25px 0;">
          <h3 style="margin: 0; color: #3F86F1; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Verification Code</h3>
          <div style="font-size: 36px; font-weight: bold; color: #333; margin: 10px 0; letter-spacing: 8px; font-family: monospace;">${code}</div>
          <p style="margin: 0; color: #666; font-size: 14px;">This code expires in 15 minutes</p>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>Security Notice:</strong> If you didn't request this ${purpose.replace('_', ' ')}, please ignore this email or contact our support team.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666; margin: 0;">
          Best regards,<br>
          <strong>JA Car Rental Team</strong>
        </p>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center;">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} JA Car Rental. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Get password reset confirmation template
 * @param {string} userName - User's name
 * @returns {string} HTML template
 */
const getPasswordResetConfirmationTemplate = (userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Password Reset Successful - JA Car Rental</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #28a745, #20c997); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">JA Car Rental</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Password Reset Successful</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0;">Hello ${userName}!</h2>
        <p style="font-size: 16px; margin-bottom: 25px;">Your password has been successfully reset for your JA Car Rental account.</p>
        
        <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #155724; font-size: 16px;">
            ✅ <strong>Password Updated Successfully</strong>
          </p>
          <p style="margin: 10px 0 0 0; color: #155724; font-size: 14px;">
            You can now log in with your new password.
          </p>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>Security Notice:</strong> If you didn't make this change, please contact our support team immediately.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666; margin: 0;">
          Best regards,<br>
          <strong>JA Car Rental Team</strong>
        </p>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center;">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} JA Car Rental. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (basic)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Is valid phone
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9+\-\s()]{7,20}$/;
  return phoneRegex.test(phone);
};