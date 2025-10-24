/**
 * Phone Verification Controller
 * 
 * Handles OTP-based phone verification for:
 * - New user registration
 * - Phone number changes in settings
 * - Customer and Driver verification
 */

import { PrismaClient } from '@prisma/client';
import { 
  generateOTP, 
  sendOTPSMS, 
  formatPhoneNumber,
  isValidPhilippinePhone 
} from '../utils/smsService.js';

const prisma = new PrismaClient();

/**
 * Send OTP to phone number
 * POST /api/phone-verification/send-otp
 */
export const sendPhoneOTP = async (req, res) => {
  try {
    const { phoneNumber, purpose, userId, userType } = req.body;
    // Validate input
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Validate phone format
    if (!isValidPhilippinePhone(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Philippine phone number format'
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Check if phone number is already verified by another user
    if (purpose === 'phone_change' && userId && userType) {
      const existingVerification = await prisma.phoneVerification.findFirst({
        where: {
          phone_number: formattedPhone,
          is_verified: true,
          NOT: {
            AND: [
              { user_id: userId },
              { user_type: userType }
            ]
          }
        }
      });

      if (existingVerification) {
        return res.status(400).json({
          success: false,
          message: 'This phone number is already registered to another account'
        });
      }
    }

    // Rate limiting: Check recent OTP requests (1 OTP per 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const recentOTP = await prisma.phoneVerification.findFirst({
      where: {
        phone_number: formattedPhone,
        created_at: {
          gte: twoMinutesAgo
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (recentOTP && !recentOTP.is_verified) {
      const timeDiff = Math.ceil((Date.now() - recentOTP.created_at.getTime()) / 1000);
      const remainingTime = 120 - timeDiff;

      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingTime} seconds before requesting a new code`,
        remainingTime
      });
    }

    // Send OTP via SMS first - let Semaphore generate the code
    let smsResult;
    try {
      smsResult = await sendOTPSMS(formattedPhone, purpose);
    } catch (smsError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.',
        error: process.env.NODE_ENV === 'development' ? smsError.message : undefined
      });
    }

    // Now store the OTP code that Semaphore generated/sent
    // Convert to string since database expects String type
    const otpCode = String(smsResult.code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any previous unverified OTPs for this phone
    await prisma.phoneVerification.updateMany({
      where: {
        phone_number: formattedPhone,
        is_verified: false
      },
      data: {
        is_verified: false, // Mark as expired
        expires_at: new Date() // Set to past
      }
    });

    // Store the OTP code from Semaphore in database
    const verification = await prisma.phoneVerification.create({
      data: {
        phone_number: formattedPhone,
        otp_code: otpCode,
        is_verified: false,
        created_at: new Date(),
        expires_at: expiresAt,
        attempts: 0,
        user_id: userId || null,
        user_type: userType || null,
        purpose: purpose || 'registration'
      }
    });
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your phone',
      data: {
        verificationId: verification.id,
        phoneNumber: formattedPhone,
        expiresIn: 600, // 10 minutes in seconds
        // Include OTP in development mode for easier testing
        ...(process.env.NODE_ENV === 'development' && { 
          otp: otpCode,
          devMode: true 
        })
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while sending OTP'
    });
  }
};

/**
 * Verify OTP code
 * POST /api/phone-verification/verify-otp
 */
export const verifyPhoneOTP = async (req, res) => {
  try {
    const { phoneNumber, otp, userId, userType } = req.body;
    // Validate input
    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP code are required'
      });
    }

    if (otp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be 6 digits'
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Find the most recent OTP for this phone number
    const verification = await prisma.phoneVerification.findFirst({
      where: {
        phone_number: formattedPhone,
        is_verified: false
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'No pending verification found. Please request a new OTP.'
      });
    }

    // Check if OTP has expired
    if (new Date() > verification.expires_at) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new code.',
        expired: true
      });
    }

    // Check max attempts (5 attempts)
    if (verification.attempts >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.',
        maxAttemptsReached: true
      });
    }

    // Verify OTP
    if (verification.otp_code !== otp) {
      // Increment attempts
      await prisma.phoneVerification.update({
        where: { id: verification.id },
        data: { 
          attempts: verification.attempts + 1 
        }
      });

      const attemptsLeft = 5 - (verification.attempts + 1);

      return res.status(400).json({
        success: false,
        message: `Invalid OTP code. ${attemptsLeft} attempts remaining.`,
        attemptsLeft
      });
    }

    // OTP is correct - mark as verified
    const verifiedRecord = await prisma.phoneVerification.update({
      where: { id: verification.id },
      data: {
        is_verified: true,
        verified_at: new Date(),
        user_id: userId || verification.user_id,
        user_type: userType || verification.user_type
      }
    });
    // Update user's phone_verified status if userId provided
    if (userId && userType) {
      try {
        if (userType === 'customer') {
          await prisma.customer.update({
            where: { customer_id: parseInt(userId) },
            data: { 
              phone_verified: true,
              contact_no: formattedPhone 
            }
          });
        } else if (userType === 'driver') {
          await prisma.driver.update({
            where: { drivers_id: parseInt(userId) },
            data: { 
              phone_verified: true,
              contact_no: formattedPhone 
            }
          });
        }
      } catch (updateError) {
        // Continue anyway as verification was successful
      }
    }

    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully!',
      data: {
        verificationId: verifiedRecord.id,
        phoneNumber: formattedPhone,
        verifiedAt: verifiedRecord.verified_at
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while verifying OTP'
    });
  }
};

/**
 * Check if phone number is already verified
 * GET /api/phone-verification/check/:phoneNumber
 */
export const checkPhoneVerification = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const { userId, userType } = req.query;

    const formattedPhone = formatPhoneNumber(phoneNumber);

    const verification = await prisma.phoneVerification.findFirst({
      where: {
        phone_number: formattedPhone,
        is_verified: true,
        ...(userId && userType && {
          user_id: parseInt(userId),
          user_type: userType
        })
      },
      orderBy: {
        verified_at: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      isVerified: !!verification,
      data: verification ? {
        phoneNumber: verification.phone_number,
        verifiedAt: verification.verified_at
      } : null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Resend OTP (with rate limiting)
 * POST /api/phone-verification/resend-otp
 */
export const resendPhoneOTP = async (req, res) => {
  // Use the same logic as sendPhoneOTP
  return sendPhoneOTP(req, res);
};

export default {
  sendPhoneOTP,
  verifyPhoneOTP,
  checkPhoneVerification,
  resendPhoneOTP
};
