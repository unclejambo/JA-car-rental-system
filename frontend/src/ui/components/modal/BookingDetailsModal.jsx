import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Divider,
  Chip,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Collapse,
} from '@mui/material';
import { HiX, HiCreditCard } from 'react-icons/hi';
import { getApiBase, createAuthenticatedFetch } from '../../../utils/api';
import { useAuth } from '../../../hooks/useAuth';
import { z } from 'zod';

export default function BookingDetailsModal({
  open,
  onClose,
  booking,
  onPaymentSuccess,
}) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    description: '',
    payment_method: 'Cash',
    gcash_no: '',
    reference_no: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [driverName, setDriverName] = useState('');

  // Auth hook for authenticated requests
  const { logout } = useAuth();

  // Fetch driver name when modal opens and booking has a driver
  useEffect(() => {
    if (open && booking && booking.drivers_id && !booking.isSelfDriver) {
      const fetchDriverName = async () => {
        try {
          const authenticatedFetch = createAuthenticatedFetch(logout);
          const response = await authenticatedFetch(
            `${getApiBase()}/drivers/${booking.drivers_id}`
          );
          if (response.ok) {
            const driver = await response.json();
            setDriverName(driver.first_name || '');
          }
        } catch (error) {
          console.error('Failed to fetch driver name:', error);
        }
      };
      fetchDriverName();
    } else {
      setDriverName('');
    }
  }, [open, booking, logout]);

  if (!booking) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount || 0);
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed':
      case 'paid':
        return 'success';
      case 'pending':
      case 'unpaid':
        return 'warning';
      case 'cancelled':
      case 'failed':
        return 'error';
      case 'in_progress':
      case 'ongoing':
        return 'info';
      default:
        return 'default';
    }
  };

  // Zod validation schema
  const paymentSchema = z.object({
    amount: z
      .string()
      .min(1, 'Payment amount is required')
      .refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      }, 'Payment amount must be a positive number')
      .refine((val) => {
        const num = parseFloat(val);
        return num <= (booking?.balance || 0);
      }, 'Payment amount cannot exceed remaining balance'),
    description: z.string().optional(),
    payment_method: z.enum(['Cash', 'GCash'], {
      required_error: 'Please select a payment method',
    }),
    gcash_no: z.string().optional(),
    reference_no: z.string().optional(),
  });

  const handlePaymentChange = (field, value) => {
    setPaymentData((prev) => ({ ...prev, [field]: value }));
    setError('');

    // Clear field-specific errors
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));

    // Real-time validation for amount field
    if (field === 'amount' && value) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        setFieldErrors((prev) => ({
          ...prev,
          amount: 'Amount must be greater than zero',
        }));
      } else if (numValue > booking.balance) {
        setFieldErrors((prev) => ({
          ...prev,
          amount: 'Amount cannot exceed remaining balance',
        }));
      }
    }
  };

  const handlePaymentSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate payment data using Zod
      const validationResult = paymentSchema.safeParse(paymentData);

      if (!validationResult.success) {
        const errors = {};
        validationResult.error.errors.forEach((err) => {
          const field = err.path[0];
          errors[field] = err.message;
        });

        setFieldErrors(errors);
        const errorMessages = Object.values(errors).join(', ');
        setError(errorMessages);
        return;
      }

      const validatedData = validationResult.data;

      // Use authenticated fetch for payment creation
      const authenticatedFetch = createAuthenticatedFetch(logout);
      const response = await authenticatedFetch(`${getApiBase()}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: booking.booking_id,
          customer_id: booking.customer_id,
          amount: parseFloat(validatedData.amount),
          description:
            validatedData.description ||
            `Payment for Booking #${booking.booking_id}`,
          payment_method: validatedData.payment_method,
          gcash_no: validatedData.gcash_no || null,
          reference_no: validatedData.reference_no || null,
          update_status: true, // Flag to update booking status
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process payment');
      }

      setSuccess(
        `Payment of ${formatCurrency(paymentData.amount)} processed successfully!`
      );
      setPaymentData({
        amount: '',
        description: '',
        payment_method: 'Cash',
        gcash_no: '',
        reference_no: '',
      });
      setShowPaymentForm(false);

      // Call the callback to refresh booking data
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }

      // Auto-close success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowPaymentForm(false);
    setPaymentData({
      amount: '',
      description: '',
      payment_method: 'Cash',
      gcash_no: '',
      reference_no: '',
    });
    setError('');
    setSuccess('');
    setFieldErrors({});
  };

  // Helper function to check if payment form is valid
  const isPaymentFormValid = () => {
    const amount = parseFloat(paymentData.amount);

    // Check if amount is valid (not empty, not NaN, positive, and within balance)
    const isAmountValid =
      paymentData.amount &&
      !isNaN(amount) &&
      amount > 0 &&
      amount <= booking.balance;

    // Check if there are any field errors
    const hasFieldErrors = Object.values(fieldErrors).some((error) => error);

    return isAmountValid && !hasFieldErrors;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableScrollLock
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '8px',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          fontSize: '1.25rem',
          fontWeight: 'bold',
        }}
      >
        📋 Booking Details
        <IconButton
          onClick={onClose}
          sx={{
            color: 'grey.500',
            '&:hover': {
              backgroundColor: 'grey.100',
            },
          }}
        >
          <HiX />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Payment Section - Moved to Top */}
          {booking.balance > 0 && (
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                  p: 2.5,
                  bgcolor: '#fff3cd',
                  borderRadius: 2,
                  border: '2px solid #ffc107',
                  boxShadow: '0 2px 8px rgba(255, 193, 7, 0.2)',
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 'bold', color: '#b45309', mb: 0.5 }}
                  >
                    ⚠️ Outstanding Balance
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#b45309', fontWeight: 'medium' }}>
                    Customer has a remaining balance of{' '}
                    <strong style={{ fontSize: '1.1em' }}>{formatCurrency(booking.balance)}</strong>
                  </Typography>
                </Box>
                {!showPaymentForm && (
                  <Button
                    variant="contained"
                    startIcon={<HiCreditCard />}
                    onClick={() => setShowPaymentForm(true)}
                    size="large"
                    sx={{
                      fontWeight: 'bold',
                      px: 4,
                      py: 1.5,
                      bgcolor: '#dc3545',
                      color: 'white',
                      fontSize: '1rem',
                      boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)',
                      '&:hover': {
                        bgcolor: '#c82333',
                        boxShadow: '0 6px 16px rgba(220, 53, 69, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    💳 Record Payment
                  </Button>
                )}
              </Box>

              <Collapse in={showPaymentForm}>
                <Box
                  sx={{
                    p: 3,
                    bgcolor: '#f8f9fa',
                    borderRadius: 2,
                    mt: 2,
                    border: '2px solid #28a745',
                    boxShadow: '0 4px 16px rgba(40, 167, 69, 0.15)',
                  }}
                >
                  <Box sx={{ mb: 2.5 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        color: '#155724',
                        mb: 1,
                      }}
                    >
                      💰 Payment Information
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#155724', fontWeight: 'medium' }}>
                      Enter payment details below to record the transaction
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'grid', gap: 2.5 }}>
                    {/* Quick Amount Buttons */}
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ mb: 1.5, fontWeight: 'bold', color: '#333' }}
                      >
                        Quick Amount Selection:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          size="medium"
                          onClick={() =>
                            handlePaymentChange('amount', booking.balance.toString())
                          }
                          sx={{
                            bgcolor: '#17a2b8',
                            color: 'white',
                            fontWeight: 'bold',
                            px: 2.5,
                            py: 1,
                            boxShadow: '0 2px 8px rgba(23, 162, 184, 0.3)',
                            '&:hover': {
                              bgcolor: '#138496',
                              boxShadow: '0 4px 12px rgba(23, 162, 184, 0.4)',
                              transform: 'translateY(-1px)',
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          💯 Full Balance ({formatCurrency(booking.balance)})
                        </Button>
                        <Button
                          variant="contained"
                          size="medium"
                          onClick={() =>
                            handlePaymentChange('amount', (booking.balance / 2).toFixed(2))
                          }
                          sx={{
                            bgcolor: '#6f42c1',
                            color: 'white',
                            fontWeight: 'bold',
                            px: 2.5,
                            py: 1,
                            boxShadow: '0 2px 8px rgba(111, 66, 193, 0.3)',
                            '&:hover': {
                              bgcolor: '#5a3397',
                              boxShadow: '0 4px 12px rgba(111, 66, 193, 0.4)',
                              transform: 'translateY(-1px)',
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          ➗ Half ({formatCurrency(booking.balance / 2)})
                        </Button>
                      </Box>
                    </Box>

                    <TextField
                      label="Payment Amount"
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) =>
                        handlePaymentChange('amount', e.target.value)
                      }
                      onKeyDown={(e) => {
                        // Block letters, 'e', 'E', '+', '-' from being typed
                        const blockedKeys = ['e', 'E', '+', '-'];
                        if (blockedKeys.includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      fullWidth
                      size="medium"
                      inputProps={{
                        min: 0.01,
                        max: booking.balance,
                        step: 0.01,
                      }}
                      error={!!fieldErrors.amount}
                      helperText={
                        fieldErrors.amount ||
                        `Remaining balance: ${formatCurrency(booking.balance)}`
                      }
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'white',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#28a745',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#28a745',
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#28a745',
                        },
                      }}
                    />

                    <TextField
                      label="Payment Description (Optional)"
                      value={paymentData.description}
                      onChange={(e) =>
                        handlePaymentChange('description', e.target.value)
                      }
                      fullWidth
                      size="medium"
                      placeholder={`Payment for Booking #${booking.booking_id}`}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'white',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#28a745',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#28a745',
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#28a745',
                        },
                      }}
                    />

                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ mb: 1.5, fontWeight: 'bold', color: '#333' }}
                      >
                        Payment Method:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button
                          variant={paymentData.payment_method === 'Cash' ? 'contained' : 'outlined'}
                          onClick={() => handlePaymentChange('payment_method', 'Cash')}
                          sx={{
                            flex: 1,
                            py: 1.5,
                            fontWeight: 'bold',
                            fontSize: '0.95rem',
                            bgcolor: paymentData.payment_method === 'Cash' ? '#28a745' : 'transparent',
                            color: paymentData.payment_method === 'Cash' ? 'white' : '#28a745',
                            borderColor: '#28a745',
                            borderWidth: 2,
                            boxShadow: paymentData.payment_method === 'Cash' ? '0 2px 8px rgba(40, 167, 69, 0.3)' : 'none',
                            '&:hover': {
                              bgcolor: '#28a745',
                              color: 'white',
                              borderColor: '#28a745',
                              borderWidth: 2,
                              boxShadow: '0 4px 12px rgba(40, 167, 69, 0.4)',
                              transform: 'translateY(-1px)',
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          💵 Cash Payment
                        </Button>
                        <Button
                          variant={paymentData.payment_method === 'GCash' ? 'contained' : 'outlined'}
                          onClick={() => handlePaymentChange('payment_method', 'GCash')}
                          sx={{
                            flex: 1,
                            py: 1.5,
                            fontWeight: 'bold',
                            fontSize: '0.95rem',
                            bgcolor: paymentData.payment_method === 'GCash' ? '#007bff' : 'transparent',
                            color: paymentData.payment_method === 'GCash' ? 'white' : '#007bff',
                            borderColor: '#007bff',
                            borderWidth: 2,
                            boxShadow: paymentData.payment_method === 'GCash' ? '0 2px 8px rgba(0, 123, 255, 0.3)' : 'none',
                            '&:hover': {
                              bgcolor: '#007bff',
                              color: 'white',
                              borderColor: '#007bff',
                              borderWidth: 2,
                              boxShadow: '0 4px 12px rgba(0, 123, 255, 0.4)',
                              transform: 'translateY(-1px)',
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          📱 GCash
                        </Button>
                      </Box>
                    </Box>

                    {paymentData.payment_method === 'GCash' && (
                      <Collapse in={paymentData.payment_method === 'GCash'}>
                        <Box
                          sx={{
                            p: 2.5,
                            bgcolor: '#e7f3ff',
                            borderRadius: 2,
                            border: '2px solid #007bff',
                            boxShadow: '0 2px 8px rgba(0, 123, 255, 0.1)',
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ mb: 1.5, fontWeight: 'bold', color: '#004085' }}
                          >
                            📱 GCash Payment Details
                          </Typography>
                          <TextField
                            label="Reference Number"
                            value={paymentData.reference_no}
                            onChange={(e) =>
                              handlePaymentChange('reference_no', e.target.value)
                            }
                            fullWidth
                            size="medium"
                            error={!!fieldErrors.reference_no}
                            helperText={
                              fieldErrors.reference_no ||
                              'Enter the GCash transaction reference number'
                            }
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                bgcolor: 'white',
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#007bff',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#007bff',
                                },
                              },
                              '& .MuiInputLabel-root.Mui-focused': {
                                color: '#007bff',
                              },
                            }}
                          />
                        </Box>
                      </Collapse>
                    )}

                    {error && (
                      <Alert 
                        severity="error" 
                        sx={{ 
                          mt: 1,
                          '& .MuiAlert-message': {
                            fontWeight: 'medium'
                          }
                        }}
                      >
                        ❌ {error}
                      </Alert>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handlePaymentSubmit}
                        disabled={loading || !isPaymentFormValid()}
                        startIcon={
                          loading ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <HiCreditCard />
                          )
                        }
                        sx={{ 
                          flex: 1,
                          py: 1.8,
                          fontWeight: 'bold',
                          fontSize: '1.05rem',
                          bgcolor: '#28a745',
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
                          '&:hover': {
                            bgcolor: '#218838',
                            boxShadow: '0 6px 20px rgba(40, 167, 69, 0.4)',
                            transform: 'translateY(-2px)',
                          },
                          '&:disabled': {
                            bgcolor: '#6c757d',
                            color: '#fff',
                            opacity: 0.7,
                          },
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        {loading ? 'Processing Payment...' : `💰 Record Payment ${paymentData.amount ? `(${formatCurrency(parseFloat(paymentData.amount) || 0)})` : ''}`}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={resetForm}
                        disabled={loading}
                        sx={{
                          px: 3,
                          py: 1.8,
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          color: '#dc3545',
                          borderColor: '#dc3545',
                          borderWidth: 2,
                          '&:hover': {
                            borderWidth: 2,
                            bgcolor: '#dc3545',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)',
                            transform: 'translateY(-1px)',
                          },
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        ❌ Cancel
                      </Button>
                    </Box>
                    
                    {/* Payment Summary */}
                    {paymentData.amount && (
                      <Box
                        sx={{
                          mt: 2.5,
                          p: 2.5,
                          bgcolor: '#f8f9fa',
                          borderRadius: 2,
                          border: '2px solid #dee2e6',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1.5, color: '#495057' }}>
                          📋 Payment Summary:
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, fontSize: '0.9rem' }}>
                          <Typography sx={{ fontWeight: 'medium' }}>Payment Amount:</Typography>
                          <Typography sx={{ fontWeight: 'bold', color: '#28a745' }}>
                            {formatCurrency(parseFloat(paymentData.amount) || 0)}
                          </Typography>
                          <Typography sx={{ fontWeight: 'medium' }}>Remaining After Payment:</Typography>
                          <Typography sx={{ fontWeight: 'bold', color: booking.balance - (parseFloat(paymentData.amount) || 0) <= 0 ? '#28a745' : '#ffc107' }}>
                            {formatCurrency(booking.balance - (parseFloat(paymentData.amount) || 0))}
                          </Typography>
                          <Typography sx={{ fontWeight: 'medium' }}>Payment Method:</Typography>
                          <Typography sx={{ fontWeight: 'bold', color: '#495057' }}>
                            {paymentData.payment_method === 'Cash' ? '💵 Cash' : '📱 GCash'}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Collapse>
            </Box>
          )}

          <Divider sx={{ my: 1 }} />

          {/* Payment Section */}
          {booking.balance > 0 && (
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 'bold', color: 'primary.main' }}
                >
                  💳 Add Payment
                </Typography>
                {!showPaymentForm && (
                  <Button
                    variant="contained"
                    startIcon={<HiCreditCard />}
                    onClick={() => setShowPaymentForm(true)}
                    size="small"
                  >
                    Add Payment
                  </Button>
                )}
              </Box>

              <Collapse in={showPaymentForm}>
                <Box
                  sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 2 }}
                >
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <TextField
                      label="Payment Amount"
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) =>
                        handlePaymentChange('amount', e.target.value)
                      }
                      onKeyDown={(e) => {
                        // Block letters, 'e', 'E', '+', '-' from being typed
                        const blockedKeys = ['e', 'E', '+', '-'];
                        if (blockedKeys.includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      fullWidth
                      size="small"
                      inputProps={{
                        min: 0.01,
                        max: booking.balance,
                        step: 0.01,
                      }}
                      error={!!fieldErrors.amount}
                      helperText={
                        fieldErrors.amount ||
                        `Remaining balance: ${formatCurrency(booking.balance)}`
                      }
                    />

                    <TextField
                      label="Description (Optional)"
                      value={paymentData.description}
                      onChange={(e) =>
                        handlePaymentChange('description', e.target.value)
                      }
                      fullWidth
                      size="small"
                      placeholder={`Payment for Booking #${booking.booking_id}`}
                    />

                    <TextField
                      select
                      label="Payment Method"
                      value={paymentData.payment_method}
                      onChange={(e) =>
                        handlePaymentChange('payment_method', e.target.value)
                      }
                      fullWidth
                      size="small"
                    >
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="GCash">GCash</MenuItem>
                    </TextField>

                    {paymentData.payment_method === 'GCash' && (
                      <>
                        <TextField
                          label="Reference Number (Optional)"
                          value={paymentData.reference_no}
                          onChange={(e) =>
                            handlePaymentChange(
                              'reference_no',
                              e.target.value
                            )
                          }
                          fullWidth
                          size="small"
                          error={!!fieldErrors.reference_no}
                          helperText={
                            fieldErrors.reference_no ||
                            'Recommended for GCash payments'
                          }
                        />
                      </>
                    )}

                    {error && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        {error}
                      </Alert>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handlePaymentSubmit}
                        disabled={loading || !isPaymentFormValid()}
                        startIcon={
                          loading ? (
                            <CircularProgress size={16} />
                          ) : (
                            <HiCreditCard />
                          )
                        }
                        sx={{ flex: 1 }}
                      >
                        {loading ? 'Processing...' : 'Process Payment'}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={resetForm}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Collapse>
            </Box>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}

          {/* Financial Information */}
          <Box>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}
            >
              💰 Financial Information
            </Typography>
            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Amount:
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {formatCurrency(booking.total_amount)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Remaining Balance:
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight="medium"
                  color={booking.balance > 0 ? 'error.main' : 'success.main'}
                >
                  {formatCurrency(booking.balance)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Payment Status:
                </Typography>
                <Chip
                  label={booking.balance <= 0 ? 'Paid' : (booking.payment_status || 'Unpaid')}
                  color={booking.balance <= 0 ? 'success' : getStatusColor(booking.payment_status)}
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Paid:
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight="medium"
                  color="success.main"
                >
                  {formatCurrency(booking.total_paid)}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Basic Booking Information */}
          <Box>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}
            >
              📋 Basic Information
            </Typography>
            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Booking ID:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  #{booking.booking_id || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Booking date:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDateTime(booking.booking_date)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Purpose:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {booking.purpose || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Status:
                </Typography>
                <Chip
                  label={booking.booking_status || 'N/A'}
                  color={getStatusColor(booking.booking_status)}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Customer Information */}
          <Box>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}
            >
              👤 Customer Information
            </Typography>
            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Customer ID:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  #{booking.customer_id || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Customer name:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {booking.customer_name || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Car Information */}
          <Box>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}
            >
              🚗 Car Information
            </Typography>
            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Car ID:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  #{booking.car_id || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Car model:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {booking.car_model || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Rental Period */}
          <Box>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}
            >
              📅 Rental Period
            </Typography>
            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Start date:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDateTime(booking.start_date)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  End date:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDateTime(booking.end_date)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pick-up time:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDateTime(booking.pickup_time)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Drop-off time:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDateTime(booking.dropoff_time)}
                </Typography>
              </Box>
              {booking.isExtend && booking.new_end_date && (
                <Box sx={{ gridColumn: 'span 2' }}>
                  <Typography variant="body2" color="text.secondary">
                    Extended end date:
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight="medium"
                    color="warning.main"
                  >
                    {formatDateTime(booking.new_end_date)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Divider />

          {/* Location Information */}
          <Box>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}
            >
              📍 Location Information
            </Typography>
            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pick-up location:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {booking.pickup_loc || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Drop-off location:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {booking.dropoff_loc || 'N/A'}
                </Typography>
              </Box>
              {booking.isDeliver && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Delivery location:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {booking.deliver_loc || 'N/A'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Divider />

          {/* Driver Information */}
          <Box>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}
            >
              🚙 Driver Information
            </Typography>
            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Self-drive:
                </Typography>
                <Chip
                  label={booking.isSelfDriver ? 'Yes' : 'No'}
                  color={booking.isSelfDriver ? 'success' : 'default'}
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Driver:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {booking.isSelfDriver
                    ? 'Self-drive'
                    : driverName
                      ? driverName
                      : booking.driver_name
                        ? booking.driver_name
                        : booking.drivers_id
                          ? `Driver #${booking.drivers_id}`
                          : 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Box>



          {/* Booking Status Flags */}
          <Box>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}
            >
              🔄 Status Information
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 2,
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Extended:
                </Typography>
                <Chip
                  label={booking.isExtend ? 'Yes' : 'No'}
                  color={booking.isExtend ? 'warning' : 'default'}
                  size="small"
                />
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Cancelled:
                </Typography>
                <Chip
                  label={booking.isCancel ? 'Yes' : 'No'}
                  color={booking.isCancel ? 'error' : 'success'}
                  size="small"
                />
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Delivery:
                </Typography>
                <Chip
                  label={booking.isDeliver ? 'Yes' : 'No'}
                  color={booking.isDeliver ? 'info' : 'default'}
                  size="small"
                />
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Released:
                </Typography>
                <Chip
                  label={booking.isRelease ? 'Yes' : 'No'}
                  color={booking.isRelease ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Returned:
                </Typography>
                <Chip
                  label={booking.isReturned ? 'Yes' : 'No'}
                  color={booking.isReturned ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </Box>
          </Box>



          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
