/**
 * Phone Verification Routes
 * 
 * Endpoints for OTP-based phone verification
 */

import express from 'express';
import {
  sendPhoneOTP,
  verifyPhoneOTP,
  checkPhoneVerification,
  resendPhoneOTP
} from '../controllers/phoneVerificationController.js';

const router = express.Router();

/**
 * POST /api/phone-verification/send-otp
 * Send OTP to phone number
 * Body: { phoneNumber, purpose, userId?, userType? }
 */
router.post('/send-otp', sendPhoneOTP);

/**
 * POST /api/phone-verification/verify-otp
 * Verify OTP code
 * Body: { phoneNumber, otp, userId?, userType? }
 */
router.post('/verify-otp', verifyPhoneOTP);

/**
 * POST /api/phone-verification/resend-otp
 * Resend OTP (with rate limiting)
 * Body: { phoneNumber, purpose, userId?, userType? }
 */
router.post('/resend-otp', resendPhoneOTP);

/**
 * GET /api/phone-verification/check/:phoneNumber
 * Check if phone number is verified
 * Query params: userId?, userType?
 */
router.get('/check/:phoneNumber', checkPhoneVerification);

export default router;
