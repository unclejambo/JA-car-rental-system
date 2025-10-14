/**
 * Forgot Password Page
 * 
 * A comprehensive multi-step password reset flow using Material-UI:
 * 
 * Step 1: Account Identification
 * - User enters email, username, or phone number
 * - Chooses verification method (email or SMS)
 * 
 * Step 2: Verification Code Entry
 * - User enters the 6-digit code sent to their chosen method
 * - Shows countdown timer and allows resending
 * 
 * Step 3: New Password Setup
 * - User creates a new password with confirmation
 * - Same validation rules as registration
 * 
 * Features:
 * - Material-UI components matching registration page design
 * - Real-time validation and feedback
 * - Loading states and error handling
 * - Step-by-step progress indicator
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  Stepper, 
  Step, 
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Header from '../ui/components/Header';
import carImage from '/carImage.png';
import { useAuth } from '../hooks/useAuth.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_LOCAL;

// Step constants
const STEPS = {
  IDENTIFY: 0,
  VERIFY: 1,
  RESET: 2,
  SUCCESS: 3
};

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useAuth();
  const [currentStep, setCurrentStep] = useState(STEPS.IDENTIFY);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect authenticated users to their respective dashboard
  useEffect(() => {
    if (isAuthenticated && userRole) {
      switch (userRole) {
        case 'admin':
        case 'staff':
          navigate('/admindashboard', { replace: true });
          break;
        case 'customer':
          navigate('/customer-dashboard', { replace: true });
          break;
        case 'driver':
          navigate('/driver-schedule', { replace: true });
          break;
        default:
          break;
      }
    }
  }, [isAuthenticated, userRole, navigate]);
  const [success, setSuccess] = useState('');

  // Step 1: Account identification
  const [identifier, setIdentifier] = useState('');
  const [verificationType, setVerificationType] = useState('email');

  // Step 2: Verification
  const [verificationCode, setVerificationCode] = useState('');
  const [maskedIdentifier, setMaskedIdentifier] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Step 3: Password reset
  const [resetToken, setResetToken] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && currentStep === STEPS.VERIFY) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, currentStep]);

  // Clear messages when inputs change
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [identifier, verificationCode, newPassword, confirmPassword, error, success]);

  /**
   * Step 1: Send verification code
   */
  const handleSendCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!identifier.trim()) {
      setError('Please enter your email, username, or phone number');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          method: verificationType  // Changed from verificationType to method
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMaskedIdentifier(data.data?.email || identifier); // Use the email from response
        setCurrentStep(STEPS.VERIFY);
        setSuccess(data.message);
        setCountdown(60); // 1 minute countdown for resend
        setCanResend(false);
      } else {
        setError(data.message || 'Failed to send verification code');
      }
    } catch (err) {
      console.error('Send verification code error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 2: Verify code
   */
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          code: verificationCode.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResetToken(data.resetToken);
        setUserInfo(data.userInfo);
        setCurrentStep(STEPS.RESET);
        setSuccess('Code verified! Now create your new password.');
      } else {
        setError(data.message || 'Invalid verification code');
        if (data.expired) {
          setCanResend(true);
          setCountdown(0);
        }
      }
    } catch (err) {
      console.error('Verify code error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 3: Reset password
   */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resetToken,
          newPassword,
          confirmPassword
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentStep(STEPS.SUCCESS);
        setSuccess(data.message);
      } else {
        setError(data.message || 'Failed to reset password');
        if (data.expired) {
          setError('Reset session expired. Please start over.');
          setTimeout(() => setCurrentStep(STEPS.IDENTIFY), 3000);
        }
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resend verification code
   */
  const handleResendCode = async () => {
    setCanResend(false);
    setError('');
    await handleSendCode({ preventDefault: () => {} });
  };

  /**
   * Go back to previous step
   */
  const handleGoBack = () => {
    setError('');
    setSuccess('');
    
    if (currentStep === STEPS.VERIFY) {
      setCurrentStep(STEPS.IDENTIFY);
      setVerificationCode('');
    } else if (currentStep === STEPS.RESET) {
      setCurrentStep(STEPS.VERIFY);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  /**
   * Format countdown time
   */
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Header />
      <div
        className="min-h-screen bg-cover bg-center flex items-center justify-center p-4"
        style={{ backgroundImage: `url(${carImage})` }}
      >
        {/* dark overlay like RegisterPage */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />

        <Box
          component="main"
          sx={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            maxWidth: 500,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper
            elevation={10}
            sx={{
              width: '100%',
              maxWidth: 500,
              padding: 4,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center', marginBottom: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', marginBottom: 1 }}>
                Forgot Password
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Reset your password in just a few steps
              </Typography>
            </Box>

            {/* Stepper */}
            <Stepper activeStep={currentStep} alternativeLabel sx={{ marginBottom: 3 }}>
              <Step>
                <StepLabel>Identify Account</StepLabel>
              </Step>
              <Step>
                <StepLabel>Verify Code</StepLabel>
              </Step>
              <Step>
                <StepLabel>Reset Password</StepLabel>
              </Step>
              <Step>
                <StepLabel>Complete</StepLabel>
              </Step>
            </Stepper>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ marginBottom: 2 }}>
                {error}
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert severity="success" sx={{ marginBottom: 2 }}>
                {success}
              </Alert>
            )}

            {/* Step Content */}
            {currentStep === STEPS.IDENTIFY && (
              <Box component="form" onSubmit={handleSendCode}>
                <Typography variant="h6" sx={{ marginBottom: 2 }}>
                  Enter your account information
                </Typography>
                
                <TextField
                  fullWidth
                  label="Email, Username, or Phone"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g., john@example.com or john123"
                  sx={{ marginBottom: 2 }}
                  autoFocus
                />

                <FormControl fullWidth sx={{ marginBottom: 3 }}>
                  <InputLabel>Verification Method</InputLabel>
                  <Select
                    value={verificationType}
                    onChange={(e) => setVerificationType(e.target.value)}
                    label="Verification Method"
                  >
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="sms">SMS</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isLoading}
                  sx={{
                    padding: 1.5,
                    backgroundColor: '#1976d2',
                    '&:hover': { backgroundColor: '#1565c0' }
                  }}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Send Verification Code'}
                </Button>

                <Box sx={{ textAlign: 'center', marginTop: 2 }}>
                  <Link to="/login" style={{ textDecoration: 'none' }}>
                    <Typography variant="body2" sx={{ color: '#1976d2' }}>
                      Back to Login
                    </Typography>
                  </Link>
                </Box>
              </Box>
            )}

            {currentStep === STEPS.VERIFY && (
              <Box component="form" onSubmit={handleVerifyCode}>
                <Typography variant="h6" sx={{ marginBottom: 1 }}>
                  Enter verification code
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', marginBottom: 2 }}>
                  We sent a 6-digit code to {maskedIdentifier}
                </Typography>

                <TextField
                  fullWidth
                  label="Verification Code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  inputProps={{ 
                    maxLength: 6,
                    style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }
                  }}
                  sx={{ marginBottom: 2 }}
                  autoFocus
                />

                {countdown > 0 && (
                  <Typography variant="body2" sx={{ color: '#666', marginBottom: 1 }}>
                    Code expires in: {formatCountdown(countdown)}
                  </Typography>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isLoading || verificationCode.length !== 6}
                  sx={{
                    padding: 1.5,
                    marginBottom: 2,
                    backgroundColor: '#1976d2',
                    '&:hover': { backgroundColor: '#1565c0' }
                  }}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Verify Code'}
                </Button>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    onClick={handleGoBack}
                    disabled={isLoading}
                    sx={{ flex: 1, marginRight: 1 }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="text"
                    onClick={handleResendCode}
                    disabled={!canResend || isLoading}
                    sx={{ flex: 1, marginLeft: 1 }}
                  >
                    Resend Code
                  </Button>
                </Box>
              </Box>
            )}

            {currentStep === STEPS.RESET && (
              <Box component="form" onSubmit={handleResetPassword}>
                <Typography variant="h6" sx={{ marginBottom: 2 }}>
                  Create new password
                </Typography>
                
                {userInfo && (
                  <Typography variant="body2" sx={{ color: '#666', marginBottom: 2 }}>
                    Resetting password for: {userInfo.email || userInfo.username}
                  </Typography>
                )}

                <TextField
                  fullWidth
                  type="password"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  sx={{ marginBottom: 2 }}
                  autoFocus
                />

                <TextField
                  fullWidth
                  type="password"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  sx={{ marginBottom: 2 }}
                />

                <Typography variant="caption" sx={{ color: '#666', marginBottom: 2, display: 'block' }}>
                  Password must be at least 6 characters long
                </Typography>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isLoading || !newPassword || !confirmPassword}
                  sx={{
                    padding: 1.5,
                    marginBottom: 2,
                    backgroundColor: '#1976d2',
                    '&:hover': { backgroundColor: '#1565c0' }
                  }}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Reset Password'}
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleGoBack}
                  disabled={isLoading}
                >
                  Back
                </Button>
              </Box>
            )}

            {currentStep === STEPS.SUCCESS && (
              <Box sx={{ textAlign: 'center' }}>
                <CheckCircleIcon sx={{ fontSize: 64, color: '#4caf50', marginBottom: 2 }} />
                <Typography variant="h6" sx={{ marginBottom: 2 }}>
                  Password Reset Successful!
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', marginBottom: 3 }}>
                  Your password has been updated successfully. You can now log in with your new password.
                </Typography>
                
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate('/login')}
                  sx={{
                    padding: 1.5,
                    backgroundColor: '#1976d2',
                    '&:hover': { backgroundColor: '#1565c0' }
                  }}
                >
                  Go to Login
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      </div>
    </>
  );
}

export default ForgotPasswordPage;