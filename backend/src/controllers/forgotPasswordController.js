/**
 * Forgot Password Controller
 * Simplified version focusing on email-based password reset
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '../utils/emailService.js';

const prisma = new PrismaClient();

/**
 * Step 1: Initiate password reset
 * Find user by email and send verification code
 */
export const initiatePasswordReset = async (req, res) => {
  try {
    const { identifier, method = 'email' } = req.body;
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Email, username, or phone number is required'
      });
    }

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
      return res.status(404).json({
        success: false,
        message: 'No account found with the provided information'
      });
    }

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
      const waitTime = process.env.NODE_ENV === 'development' ? '2 minutes' : '15 minutes';
      return res.status(429).json({
        success: false,
        message: `Too many verification attempts. Please try again in ${waitTime}.`,
        retryAfter: rateLimitWindow / 1000
      });
    }

    // Generate verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
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

    // Store verification code in database
    await prisma.verificationCode.create({
      data: {
        user_id: userId,
        user_type: userType,
        identifier: user.email,
        code: code,
        type: 'email',
        purpose: 'password_reset',
        attempts: 0,
        max_attempts: 3,
        expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      }
    });
    // Send verification email
    try {
      await sendVerificationEmail(user.email, code, user.first_name || user.username);
    } catch (emailError) {
      // In development, we'll continue anyway and log the code
      if (process.env.NODE_ENV === 'development') {
      } else {
        // In production, fail if email can't be sent
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email. Please try again later.'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Verification code sent via ${method}`,
      data: {
        email: user.email,
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
    res.status(500).json({
      success: false,
      message: 'Internal server error during password reset initiation'
    });
  }
};

/**
 * Step 2: Verify the code entered by user
 */
export const verifyResetCode = async (req, res) => {
  try {
    const { identifier, code } = req.body;
    // Validate input
    if (!identifier || !code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both identifier and verification code'
      });
    }

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
    const { resetToken, newPassword, confirmPassword } = req.body;
    // Validate input
    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reset token and both password fields'
      });
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Validate password strength
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find reset token
    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: {
        token: resetToken,
        used: false
      }
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Check if token has expired
    if (resetRecord.expires_at < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired. Please start the process again.',
        expired: true
      });
    }

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
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

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

    // Mark reset token as used
    await prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { 
        used: true,
        updated_at: new Date()
      }
    });

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
    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
      user: {
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