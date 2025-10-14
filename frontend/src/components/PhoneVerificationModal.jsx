import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { createAuthenticatedFetch, getApiBase } from '../utils/api';

/**
 * Phone Verification Modal Component
 * 
 * Handles OTP verification for phone numbers
 * Used in registration and settings phone changes
 */
export default function PhoneVerificationModal({
  open,
  onClose,
  phoneNumber,
  purpose = 'registration', // 'registration' or 'phone_change'
  userId = null,
  userType = null,
  onVerificationSuccess,
  onVerificationError,
}) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(120); // 2 minutes
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const inputRefs = useRef([]);

  const API_BASE = getApiBase();

  // Timer countdown
  useEffect(() => {
    if (!open) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('OTP has expired. Please request a new code.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  // Resend countdown
  useEffect(() => {
    if (!open || canResend) return;

    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, canResend]);

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (open && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setOtp(['', '', '', '', '', '']);
      setError('');
      setSuccess('');
      setTimeLeft(600);
      setCanResend(false);
      setResendCountdown(120);
      setAttemptsLeft(5);
    }
  }, [open]);

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newOtp.every((digit) => digit !== '') && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handlePaste(e);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // Only accept 6-digit numbers
    if (!/^\d{6}$/.test(pastedData)) {
      setError('Please paste a valid 6-digit code');
      return;
    }

    const digits = pastedData.split('');
    setOtp(digits);
    inputRefs.current[5]?.focus();

    // Auto-verify after paste
    setTimeout(() => handleVerify(pastedData), 100);
  };

  const handleVerify = async (otpCode = null) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/phone-verification/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          otp: code,
          userId,
          userType,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Phone number verified successfully!');
        setTimeout(() => {
          if (onVerificationSuccess) {
            onVerificationSuccess(data);
          }
          onClose();
        }, 1500);
      } else {
        setError(data.message || 'Invalid OTP code');
        if (data.attemptsLeft !== undefined) {
          setAttemptsLeft(data.attemptsLeft);
        }
        if (data.expired) {
          setTimeLeft(0);
        }
        // Clear OTP inputs on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify OTP. Please try again.');
      if (onVerificationError) {
        onVerificationError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/api/phone-verification/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          purpose,
          userId,
          userType,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('New OTP sent to your phone!');
        setTimeLeft(600);
        setCanResend(false);
        setResendCountdown(120);
        setAttemptsLeft(5);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        if (data.remainingTime) {
          setError(`Please wait ${data.remainingTime} seconds before requesting a new code`);
        } else {
          setError(data.message || 'Failed to resend OTP');
        }
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          px: 2,
          py: 1,
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            Verify Phone Number
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            We've sent a 6-digit verification code to:
          </Typography>
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            {phoneNumber}
          </Typography>

          {/* OTP Input Fields */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 1.5, 
              justifyContent: 'center',
              mb: 3 
            }}
          >
            {otp.map((digit, index) => (
              <TextField
                key={index}
                inputRef={(el) => (inputRefs.current[index] = el)}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={loading || timeLeft === 0}
                inputProps={{
                  maxLength: 1,
                  style: {
                    textAlign: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold',
                  },
                }}
                sx={{
                  width: '50px',
                  '& .MuiOutlinedInput-root': {
                    height: '60px',
                  },
                }}
              />
            ))}
          </Box>

          {/* Timer and Attempts */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2" color={timeLeft < 60 ? 'error' : 'text.secondary'}>
              Time remaining: {formatTime(timeLeft)}
            </Typography>
            <Typography variant="body2" color={attemptsLeft <= 2 ? 'error' : 'text.secondary'}>
              Attempts left: {attemptsLeft}
            </Typography>
          </Box>

          {/* Success Message */}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Resend Button */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Didn't receive the code?
            </Typography>
            <Button
              onClick={handleResendOTP}
              disabled={!canResend || loading}
              variant="text"
              sx={{ textTransform: 'none' }}
            >
              {canResend ? (
                'Resend OTP'
              ) : (
                `Resend in ${formatTime(resendCountdown)}`
              )}
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={() => handleVerify()}
          disabled={loading || otp.some((digit) => digit === '') || timeLeft === 0}
          variant="contained"
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
