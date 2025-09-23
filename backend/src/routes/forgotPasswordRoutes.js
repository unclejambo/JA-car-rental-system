/**
 * Forgot Password Routes
 * 
 * This file defines the API endpoints for the forgot password functionality:
 * 
 * POST /api/auth/forgot-password        - Initiate password reset process
 * POST /api/auth/verify-reset-code      - Verify the reset code
 * POST /api/auth/reset-password         - Reset password with new password
 * 
 * All routes include proper error handling and validation
 */

import express from 'express';
import { 
  initiatePasswordReset,
  verifyResetCode,
  resetPassword
} from '../controllers/forgotPasswordController.js';

const router = express.Router();

/**
 * POST /api/auth/forgot-password
 * 
 * Initiate password reset process
 * 
 * Body:
 * - identifier: string (email, username, or phone number)
 * - verificationType: string (optional, 'email' or 'sms', defaults to 'email')
 * 
 * Response:
 * - success: boolean
 * - message: string
 * - requiresVerification: boolean
 * - verificationType: string (if successful)
 * - maskedIdentifier: string (if successful)
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    await initiatePasswordReset(req, res);
  } catch (error) {
    console.error('Forgot password route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/verify-reset-code
 * 
 * Verify the reset code sent to user
 * 
 * Body:
 * - identifier: string (email, username, or phone number)
 * - code: string (6-digit verification code)
 * - verificationType: string (optional, 'email' or 'sms', defaults to 'email')
 * 
 * Response:
 * - success: boolean
 * - message: string
 * - resetToken: string (if successful)
 * - userInfo: object (if successful)
 */
router.post('/verify-reset-code', async (req, res, next) => {
  try {
    await verifyResetCode(req, res);
  } catch (error) {
    console.error('Verify reset code route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/reset-password
 * 
 * Reset password with new password
 * 
 * Body:
 * - resetToken: string (token received from verify-reset-code)
 * - newPassword: string (new password)
 * - confirmPassword: string (confirm new password)
 * 
 * Response:
 * - success: boolean
 * - message: string
 * - user: object (if successful)
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    await resetPassword(req, res);
  } catch (error) {
    console.error('Reset password route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Development only: Clear verification codes for testing
if (process.env.NODE_ENV === 'development') {
  router.delete('/clear-codes/:email', async (req, res) => {
    try {
      const { email } = req.params;
      await prisma.verificationCode.deleteMany({
        where: { email }
      });
      res.json({ success: true, message: `Cleared verification codes for ${email}` });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
}

export default router;