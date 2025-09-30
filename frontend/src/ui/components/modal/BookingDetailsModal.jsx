import React, { useState } from 'react';
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
import { getApiBase } from '../../../utils/api';
import { z } from 'zod';

export default function BookingDetailsModal({ open, onClose, booking, onPaymentSuccess }) {
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
    amount: z.string()
      .min(1, "Payment amount is required")
      .refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      }, "Payment amount must be a positive number")
      .refine((val) => {
        const num = parseFloat(val);
        return num <= (booking?.balance || 0);
      }, "Payment amount cannot exceed remaining balance"),
    description: z.string().optional(),
    payment_method: z.enum(["Cash", "GCash"], {
      required_error: "Please select a payment method"
    }),
    gcash_no: z.string().optional(),
    reference_no: z.string().optional()
  });

  const handlePaymentChange = (field, value) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
    setError('');
    
    // Clear field-specific errors
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
    
    // Real-time validation for amount field
    if (field === 'amount' && value) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        setFieldErrors(prev => ({ ...prev, amount: 'Amount must be greater than zero' }));
      } else if (numValue > booking.balance) {
        setFieldErrors(prev => ({ ...prev, amount: 'Amount cannot exceed remaining balance' }));
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
        validationResult.error.errors.forEach(err => {
          const field = err.path[0];
          errors[field] = err.message;
        });
        
        setFieldErrors(errors);
        const errorMessages = Object.values(errors).join(', ');
        setError(errorMessages);
        return;
      }

      const validatedData = validationResult.data;

      const response = await fetch(`${getApiBase()}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: booking.booking_id,
          customer_id: booking.customer_id,
          amount: parseFloat(validatedData.amount),
          description: validatedData.description || `Payment for Booking #${booking.booking_id}`,
          payment_method: validatedData.payment_method,
          gcash_no: validatedData.gcash_no || null,
          reference_no: validatedData.reference_no || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process payment');
      }

      setSuccess(`Payment of ${formatCurrency(paymentData.amount)} processed successfully!`);
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
    const isAmountValid = paymentData.amount && 
                         !isNaN(amount) && 
                         amount > 0 && 
                         amount <= booking.balance;
    
    // Check if there are any field errors
    const hasFieldErrors = Object.values(fieldErrors).some(error => error);
    
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
          {/* Basic Booking Information */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
              📋 Basic Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
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
                  Booking Date:
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
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
              👤 Customer Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
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
                  Customer Name:
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
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
              🚗 Car Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
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
                  Car Model:
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
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
              📅 Rental Period
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Start Date:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDateTime(booking.start_date)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  End Date:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDateTime(booking.end_date)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pick-up Time:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDateTime(booking.pickup_time)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Drop-off Time:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDateTime(booking.dropoff_time)}
                </Typography>
              </Box>
              {booking.isExtend && booking.new_end_date && (
                <Box sx={{ gridColumn: 'span 2' }}>
                  <Typography variant="body2" color="text.secondary">
                    Extended End Date:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" color="warning.main">
                    {formatDateTime(booking.new_end_date)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Divider />

          {/* Location Information */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
              📍 Location Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pick-up Location:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {booking.pickup_loc || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Drop-off Location:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {booking.dropoff_loc || 'N/A'}
                </Typography>
              </Box>
              {booking.isDeliver && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Delivery Location:
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
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
              🚙 Driver Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Self-Drive:
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
                  Driver ID:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {booking.drivers_id ? `#${booking.drivers_id}` : (booking.isSelfDriver ? 'Self-drive' : 'N/A')}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Financial Information */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
              💰 Financial Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
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
                <Typography variant="body1" fontWeight="medium" color={booking.balance > 0 ? 'error.main' : 'success.main'}>
                  {formatCurrency(booking.balance)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Payment Status:
                </Typography>
                <Chip 
                  label={booking.payment_status || 'N/A'} 
                  color={getStatusColor(booking.payment_status)}
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Paid:
                </Typography>
                <Typography variant="body1" fontWeight="medium" color="success.main">
                  {formatCurrency(booking.total_paid)}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Booking Status Flags */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
              🔄 Status Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Extended:
                </Typography>
                <Chip 
                  label={booking.isExtend ? 'Yes' : 'No'} 
                  color={booking.isExtend ? 'warning' : 'default'}
                  size="small"
                />
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Cancelled:
                </Typography>
                <Chip 
                  label={booking.isCancel ? 'Yes' : 'No'} 
                  color={booking.isCancel ? 'error' : 'success'}
                  size="small"
                />
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Delivery:
                </Typography>
                <Chip 
                  label={booking.isDeliver ? 'Yes' : 'No'} 
                  color={booking.isDeliver ? 'info' : 'default'}
                  size="small"
                />
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Released:
                </Typography>
                <Chip 
                  label={booking.isRelease ? 'Yes' : 'No'} 
                  color={booking.isRelease ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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

          {/* Payment Section */}
          {booking.balance > 0 && (
            <>
              <Divider />
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
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
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 2 }}>
                    <Box sx={{ display: 'grid', gap: 2 }}>
                      <TextField
                        label="Payment Amount"
                        type="number"
                        value={paymentData.amount}
                        onChange={(e) => handlePaymentChange('amount', e.target.value)}
                        onKeyDown={(e) => {
                          // Block letters, 'e', 'E', '+', '-' from being typed
                          const blockedKeys = ['e', 'E', '+', '-'];
                          if (blockedKeys.includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        fullWidth
                        size="small"
                        inputProps={{ min: 0.01, max: booking.balance, step: 0.01 }}
                        error={!!fieldErrors.amount}
                        helperText={fieldErrors.amount || `Remaining balance: ${formatCurrency(booking.balance)}`}
                      />
                      
                      <TextField
                        label="Description (Optional)"
                        value={paymentData.description}
                        onChange={(e) => handlePaymentChange('description', e.target.value)}
                        fullWidth
                        size="small"
                        placeholder={`Payment for Booking #${booking.booking_id}`}
                      />
                      
                      <TextField
                        select
                        label="Payment Method"
                        value={paymentData.payment_method}
                        onChange={(e) => handlePaymentChange('payment_method', e.target.value)}
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
                            onChange={(e) => handlePaymentChange('reference_no', e.target.value)}
                            fullWidth
                            size="small"
                            error={!!fieldErrors.reference_no}
                            helperText={fieldErrors.reference_no || 'Recommended for GCash payments'}
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
                          startIcon={loading ? <CircularProgress size={16} /> : <HiCreditCard />}
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
            </>
          )}
          
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
