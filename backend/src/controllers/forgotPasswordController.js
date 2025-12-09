/**
 * Forgot Password Controller
 * Simplified version focusing on email-based password reset
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '../utils/emailService.js';
import { sendOTPSMS, formatPhoneNumber } from '../utils/smsService.js';

const prisma = new PrismaClient();

/**
 * Step 1: Initiate password reset
 * Find user by email and send verification code
 */
export const initiatePasswordReset = async (req, res) => {
  try {
    console.log('🔄 Password reset initiation request received');
    const { identifier, method = 'email' } = req.body;
    
    if (!identifier) {
      console.log('❌ Missing identifier');
      return res.status(400).json({
        success: false,
        message: 'Email, username, or phone number is required'
      });
    }

    console.log(`🔍 Looking up user with identifier: ${identifier}`);
    
    // Find user by email, username, or phone
    let user = null;
    let userType = null;
    // Check in customers table first
    user = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
          { contact_no: identifier }
        ]
      }
    });

    if (user) {
      userType = 'customer';
    } else {
      // Check in admins table
      user = await prisma.admin.findFirst({
        where: {
          OR: [
            { email: identifier },
            { username: identifier },
            { contact_no: identifier }
          ]
        }
      });

      if (user) {
        userType = 'admin';
      } else {
        // Check in drivers table
        user = await prisma.driver.findFirst({
          where: {
            OR: [
              { email: identifier },
              { username: identifier },
              { contact_no: identifier }
            ]
          }
        });

        if (user) {
          userType = 'driver';
        }
      }
    }

    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({
        success: false,
        message: 'No account found with the provided information'
      });
    }

    console.log(`✅ User found: ${user.email} (${userType})`);
    console.log('⏱️ Checking rate limiting...');

    // Rate limiting check - simplified for easier testing
    const rateLimitWindow = process.env.NODE_ENV === 'development' ? 2 * 60 * 1000 : 15 * 60 * 1000; // 2 min dev, 15 min prod
    const maxAttempts = process.env.NODE_ENV === 'development' ? 10 : 3;

    const recentAttempts = await prisma.verificationCode.count({
      where: {
        identifier: user.email,
        created_at: {
          gte: new Date(Date.now() - rateLimitWindow)
        }
      }
    });
    if (recentAttempts >= maxAttempts) {
      console.log(`❌ Rate limit exceeded: ${recentAttempts} attempts`);
      const waitTime = process.env.NODE_ENV === 'development' ? '2 minutes' : '15 minutes';
      return res.status(429).json({
        success: false,
        message: `Too many verification attempts. Please try again in ${waitTime}.`,
        retryAfter: rateLimitWindow / 1000
      });
    }

    console.log(`✅ Rate limit check passed (${recentAttempts}/${maxAttempts} attempts)`);
    console.log('🔢 Generating verification code...');

    // Generate verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`✅ Code generated: ${code}`);
    
    // Get user ID based on user type
    let userId;
    switch (userType) {
      case 'customer':
        userId = user.customer_id;
        break;
      case 'admin':
        userId = user.admin_id;
        break;
      case 'driver':
        userId = user.drivers_id;
        break;
      default:
        throw new Error('Invalid user type');
    }

    console.log(`💾 Storing verification code for user_id: ${userId}...`);

    // Determine identifier and type based on method
    const verificationType = method === 'sms' ? 'sms' : 'email';
    const identifierValue = method === 'sms' ? user.contact_no : user.email;

    // Store verification code in database
    await prisma.verificationCode.create({
      data: {
        user_id: userId,
        user_type: userType,
        identifier: identifierValue,
        code: code,
        type: verificationType,
        purpose: 'password_reset',
        attempts: 0,
        max_attempts: 3,
        expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        created_at: new Date()
      }
    });
    
    console.log('✅ Verification code stored in database');

    // Send verification based on method
    if (method === 'sms') {
      console.log('📱 Sending verification SMS...');
      try {
        // For SMS, we need to send our own code since we're using custom message
        const formattedPhone = formatPhoneNumber(user.contact_no);
        const message = `JA Car Rental: Your password reset code is ${code}. Valid for 15 minutes. Do not share this code.`;
        
        // Use the regular messages endpoint with our code
        const SEMAPHORE_API_KEY = process.env.SEMAPHORE_API_KEY;
        const MESSAGES_URL = 'https://api.semaphore.co/api/v4/messages';
        const SENDER_NAME = 'JACarRental';

        const formData = new URLSearchParams();
        formData.append('apikey', SEMAPHORE_API_KEY);
        formData.append('number', formattedPhone);
        formData.append('message', message);
        formData.append('sendername', SENDER_NAME);

        const response = await fetch(MESSAGES_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to send SMS');
        }

        console.log('✅ Verification SMS sent successfully');
      } catch (smsError) {
        console.error('❌ Error sending verification SMS:', smsError);
        // In development, we'll continue anyway and log the code
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ Development mode: Continuing despite SMS error');
          console.log(`📋 Verification code: ${code}`);
        } else {
          // In production, fail if SMS can't be sent
          return res.status(500).json({
            success: false,
            message: 'Failed to send verification SMS. Please try again later.'
          });
        }
      }
    } else {
      console.log('📧 Sending verification email...');
      try {
        await sendVerificationEmail(user.email, code, user.first_name || user.username);
        console.log('✅ Verification email sent successfully');
      } catch (emailError) {
        console.error('❌ Error sending verification email:', emailError);
        // In development, we'll continue anyway and log the code
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ Development mode: Continuing despite email error');
          console.log(`📋 Verification code: ${code}`);
        } else {
          // In production, fail if email can't be sent
          return res.status(500).json({
            success: false,
            message: 'Failed to send verification email. Please try again later.'
          });
        }
      }
    }

    console.log('✅ Password reset initiation completed successfully');

    res.status(200).json({
      success: true,
      message: `Verification code sent via ${method}`,
      data: {
        email: user.email,
        phone: user.contact_no,
        method: method,
        userType: userType,
        // Only include code in development mode for easier testing
        ...(process.env.NODE_ENV === 'development' && { 
          code: code,
          devNote: 'Code included for development testing'
        })
      }
    });

  } catch (error) {
    console.error('❌ Error in initiatePasswordReset:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during password reset initiation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Step 2: Verify the code entered by user
 */
export const verifyResetCode = async (req, res) => {
  try {
    console.log('🔄 Verification code check request received');
    const { identifier, code } = req.body;
    
    // Validate input
    if (!identifier || !code) {
      console.log('❌ Missing identifier or code');
      return res.status(400).json({
        success: false,
        message: 'Please provide both identifier and verification code'
      });
    }

    console.log(`🔍 Looking up user with identifier: ${identifier}`);

    // Find user first
    let user = null;
    let userType = null;

    // Check in customers table first
    user = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
          { contact_no: identifier }
        ]
      }
    });

    if (user) {
      userType = 'customer';
    } else {
      // Check in admins table
      user = await prisma.admin.findFirst({
        where: {
          OR: [
            { email: identifier },
            { username: identifier },
            { contact_no: identifier }
          ]
        }
      });

      if (user) {
        userType = 'admin';
      } else {
        // Check in drivers table
        user = await prisma.driver.findFirst({
          where: {
            OR: [
              { email: identifier },
              { username: identifier },
              { contact_no: identifier }
            ]
          }
        });

        if (user) {
          userType = 'driver';
        }
      }
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification request'
      });
    }

    // Get user ID based on user type
    let userId;
    switch (userType) {
      case 'customer':
        userId = user.customer_id;
        break;
      case 'admin':
        userId = user.admin_id;
        break;
      case 'driver':
        userId = user.drivers_id;
        break;
      default:
        throw new Error('Invalid user type');
    }

    // Find verification code
    const verificationRecord = await prisma.verificationCode.findFirst({
      where: {
        user_id: userId,
        user_type: userType,
        type: 'email',
        purpose: 'password_reset',
        verified: false
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (!verificationRecord) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found. Please request a new one.'
      });
    }

    // Check if code has expired
    if (verificationRecord.expires_at < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.',
        expired: true
      });
    }

    // Check attempts
    if (verificationRecord.attempts >= verificationRecord.max_attempts) {
      return res.status(400).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new code.',
        maxAttemptsReached: true
      });
    }

    // Increment attempts
    await prisma.verificationCode.update({
      where: { id: verificationRecord.id },
      data: { attempts: verificationRecord.attempts + 1 }
    });

    // Verify code
    if (verificationRecord.code !== code) {
      const attemptsLeft = verificationRecord.max_attempts - (verificationRecord.attempts + 1);
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${attemptsLeft} attempts remaining.`,
        attemptsLeft
      });
    }

    // Mark as verified
    await prisma.verificationCode.update({
      where: { id: verificationRecord.id },
      data: { 
        verified: true,
        updated_at: new Date()
      }
    });

    // Generate reset token for the next step
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Save reset token
    await prisma.passwordResetToken.create({
      data: {
        user_id: userId,
        user_type: userType,
        email: user.email,
        token: resetToken,
        code: verificationRecord.code,
        expires_at: tokenExpiresAt
      }
    });
    return res.status(200).json({
      success: true,
      message: 'Verification code confirmed. You can now reset your password.',
      resetToken,
      userInfo: {
        name: `${user.first_name} ${user.last_name}`,
        email: user.email
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

/**
 * Step 3: Reset password with new password
 */
export const resetPassword = async (req, res) => {
  try {
    console.log('🔄 Reset password request received');
    const { resetToken, newPassword, confirmPassword } = req.body;
    
    // Validate input
    if (!resetToken || !newPassword || !confirmPassword) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Please provide reset token and both password fields'
      });
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      console.log('❌ Passwords do not match');
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Validate password strength
    if (!newPassword || newPassword.length < 6) {
      console.log('❌ Password too short');
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    console.log('🔍 Looking up reset token...');
    // Find reset token
    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: {
        token: resetToken,
        used: false
      }
    });

    if (!resetRecord) {
      console.log('❌ Reset token not found or already used');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    console.log(`✅ Reset token found for user_id: ${resetRecord.user_id}, user_type: ${resetRecord.user_type}`);

    // Check if token has expired
    if (resetRecord.expires_at < new Date()) {
      console.log('❌ Reset token has expired');
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired. Please start the process again.',
        expired: true
      });
    }

    console.log('🔍 Finding user...');
    // Find the user
    let user = null;
    switch (resetRecord.user_type) {
      case 'customer':
        user = await prisma.customer.findUnique({
          where: { customer_id: resetRecord.user_id }
        });
        break;
      case 'admin':
        user = await prisma.admin.findUnique({
          where: { admin_id: resetRecord.user_id }
        });
        break;
      case 'driver':
        user = await prisma.driver.findUnique({
          where: { drivers_id: resetRecord.user_id }
        });
        break;
    }

    if (!user) {
      console.log(`❌ User not found for user_type: ${resetRecord.user_type}, user_id: ${resetRecord.user_id}`);
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`✅ User found: ${user.email}`);
    console.log('🔐 Hashing new password...');
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    console.log('💾 Updating user password...');

    // Update user password based on user type
    switch (resetRecord.user_type) {
      case 'customer':
        await prisma.customer.update({
          where: { customer_id: resetRecord.user_id },
          data: { password: hashedPassword }
        });
        break;
      case 'admin':
        await prisma.admin.update({
          where: { admin_id: resetRecord.user_id },
          data: { password: hashedPassword }
        });
        break;
      case 'driver':
        await prisma.driver.update({
          where: { drivers_id: resetRecord.user_id },
          data: { password: hashedPassword }
        });
        break;
    }

    console.log('✅ Password updated successfully');
    console.log('🔒 Marking reset token as used...');

    // Mark reset token as used
    await prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { 
        used: true,
        updated_at: new Date()
      }
    });

    console.log('🗑️ Invalidating verification codes...');

    // Invalidate all verification codes for this user
    await prisma.verificationCode.updateMany({
      where: {
        user_id: resetRecord.user_id,
        user_type: resetRecord.user_type,
        purpose: 'password_reset',
        verified: false
      },
      data: { verified: true } // Mark as used
    });
    
    console.log('✅ Password reset completed successfully');
    
    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
      user: {
        name: `${user.first_name} ${user.last_name}`,
        email: user.email
      }
    });

  } catch (error) {
    console.error('❌ Error in resetPassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Development helper: Clear all verification codes (for testing)
 */
export const clearVerificationCodes = async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only available in development mode'
      });
    }

    // Clear all verification codes
    await prisma.verificationCode.deleteMany({});

    // Clear all password reset tokens
    await prisma.passwordResetToken.deleteMany({});
    res.status(200).json({
      success: true,
      message: 'All verification codes and reset tokens cleared (development only)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};