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
  Tabs,
  Tab,
  Grid,
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
  const [activeTab, setActiveTab] = useState(0);
  const [releaseData, setReleaseData] = useState(null);
  const [returnData, setReturnData] = useState(null);
  const [loadingRelease, setLoadingRelease] = useState(false);
  const [loadingReturn, setLoadingReturn] = useState(false);

  // Get user type from localStorage to determine permissions
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userType = userInfo.user_type || '';
  const isAdminOrStaff = userType === 'admin' || userType === 'staff';

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
        }
      };
      fetchDriverName();
    } else {
      setDriverName('');
    }
  }, [open, booking, logout]);

  // Fetch release data when booking status is "In Progress" or "Completed"
  useEffect(() => {
    if (
      open &&
      booking &&
      (booking.booking_status === 'In Progress' ||
        booking.booking_status === 'Completed')
    ) {
      const fetchReleaseData = async () => {
        setLoadingRelease(true);
        try {
          const authenticatedFetch = createAuthenticatedFetch(logout);
          const response = await authenticatedFetch(
            `${getApiBase()}/returns/${booking.booking_id}`
          );
          if (response.ok) {
            const data = await response.json();
            // Extract release data from the booking object
            if (
              data.booking &&
              data.booking.releases &&
              data.booking.releases.length > 0
            ) {
              setReleaseData(data.booking.releases[0]);
            }
          }
        } catch (error) {
        } finally {
          setLoadingRelease(false);
        }
      };
      fetchReleaseData();
    } else {
      setReleaseData(null);
    }
  }, [open, booking, logout]);

  // Fetch return data when booking status is "Completed"
  useEffect(() => {
    if (open && booking && booking.booking_status === 'Completed') {
      const fetchReturnData = async () => {
        setLoadingReturn(true);
        try {
          const authenticatedFetch = createAuthenticatedFetch(logout);
          const response = await authenticatedFetch(
            `${getApiBase()}/returns/${booking.booking_id}`
          );
          if (response.ok) {
            const data = await response.json();
            // Extract return data from the booking object
            if (
              data.booking &&
              data.booking.Return &&
              data.booking.Return.length > 0
            ) {
              setReturnData(data.booking.Return[0]);
            }
          }
        } catch (error) {
        } finally {
          setLoadingReturn(false);
        }
      };
      fetchReturnData();
    } else {
      setReturnData(null);
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Main Tabs - Only show tabs for admin/staff */}
          {isAdminOrStaff && (
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  minHeight: '48px',
                },
                '& .Mui-selected': { color: 'primary.main' },
                '& .MuiTabs-indicator': {
                  backgroundColor: 'primary.main',
                  height: 3,
                },
              }}
            >
              <Tab label="📋 Booking Details" />
              <Tab
                label="🚗 Release Details"
                disabled={
                  booking.booking_status !== 'In Progress' &&
                  booking.booking_status !== 'Completed'
                }
              />
              <Tab
                label="🔙 Return Details"
                disabled={booking.booking_status !== 'Completed'}
              />
            </Tabs>
          )}

          {/* Tab Panel 0: Booking Details (or direct content for customers/drivers) */}
          {(activeTab === 0 || !isAdminOrStaff) && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                mt: isAdminOrStaff ? 2 : 0,
              }}
            >
              {/* Payment Section - Only show for admin/staff, hide for cancelled bookings */}
              {isAdminOrStaff &&
                booking.balance > 0 &&
                !booking.isCancel &&
                booking.booking_status !== 'Cancelled' && (
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
                    <Divider />

                    <Collapse in={showPaymentForm}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                          mt: 2,
                        }}
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
                              handlePaymentChange(
                                'payment_method',
                                e.target.value
                              )
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
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 2,
                  }}
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
                      color={
                        booking.balance > 0 ? 'error.main' : 'success.main'
                      }
                    >
                      {formatCurrency(booking.balance)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Payment Status:
                    </Typography>
                    <Chip
                      label={
                        booking.balance <= 0
                          ? 'Paid'
                          : booking.payment_status || 'Unpaid'
                      }
                      color={
                        booking.balance <= 0
                          ? 'success'
                          : getStatusColor(booking.payment_status)
                      }
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
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 2,
                  }}
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
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 2,
                  }}
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
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 2,
                  }}
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
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 2,
                  }}
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
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 2,
                  }}
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
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 2,
                  }}
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
                      label={booking.isExtended ? 'Yes' : 'No'}
                      color={booking.isExtended ? 'success' : 'default'}
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
                      label={
                        booking.booking_status === 'Cancelled' ? 'Yes' : 'No'
                      }
                      color={
                        booking.booking_status === 'Cancelled'
                          ? 'error'
                          : 'success'
                      }
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

              {/* Success Alert */}
              {success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {success}
                </Alert>
              )}
            </Box>
          )}

          {/* Tab Panel 1: Release Details - Only for admin/staff */}
          {isAdminOrStaff && activeTab === 1 && (
            <Box sx={{ mt: 2 }}>
              {loadingRelease ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : releaseData ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Release Information */}
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}
                    >
                      📋 Release Information
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Gas Level:
                        </Typography>
                        <Chip
                          label={releaseData.gas_level || 'N/A'}
                          color={
                            releaseData.gas_level === 'High'
                              ? 'success'
                              : releaseData.gas_level === 'Mid'
                                ? 'warning'
                                : 'error'
                          }
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Equipment Status:
                        </Typography>
                        <Chip
                          label={releaseData.equipment || 'N/A'}
                          color={
                            releaseData.equipment === 'complete'
                              ? 'success'
                              : 'warning'
                          }
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      {releaseData.equip_others && (
                        <Box sx={{ gridColumn: 'span 2' }}>
                          <Typography variant="body2" color="text.secondary">
                            Equipment Notes:
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {releaseData.equip_others}
                          </Typography>
                        </Box>
                      )}
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          License Presented:
                        </Typography>
                        <Chip
                          label={releaseData.license_presented ? 'Yes' : 'No'}
                          color={
                            releaseData.license_presented ? 'success' : 'error'
                          }
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Divider />

                  {/* Valid ID Images */}
                  {(releaseData.valid_id_img1 || releaseData.valid_id_img2) && (
                    <>
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            mb: 2,
                            fontWeight: 'bold',
                            color: 'primary.main',
                          }}
                        >
                          🪪 Valid ID Images
                        </Typography>
                        <Grid container spacing={2}>
                          {releaseData.valid_id_img1 && (
                            <Grid item xs={12} sm={6}>
                              <Box>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 1 }}
                                >
                                  Valid ID - Front
                                </Typography>
                                <Box
                                  component="img"
                                  src={releaseData.valid_id_img1}
                                  alt="Valid ID Front"
                                  sx={{
                                    width: '100%',
                                    height: 'auto',
                                    maxHeight: '200px',
                                    objectFit: 'contain',
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    cursor: 'pointer',
                                    '&:hover': { opacity: 0.8 },
                                  }}
                                  onClick={() =>
                                    window.open(
                                      releaseData.valid_id_img1,
                                      '_blank'
                                    )
                                  }
                                />
                              </Box>
                            </Grid>
                          )}
                          {releaseData.valid_id_img2 && (
                            <Grid item xs={12} sm={6}>
                              <Box>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 1 }}
                                >
                                  Valid ID - Back
                                </Typography>
                                <Box
                                  component="img"
                                  src={releaseData.valid_id_img2}
                                  alt="Valid ID Back"
                                  sx={{
                                    width: '100%',
                                    height: 'auto',
                                    maxHeight: '200px',
                                    objectFit: 'contain',
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    cursor: 'pointer',
                                    '&:hover': { opacity: 0.8 },
                                  }}
                                  onClick={() =>
                                    window.open(
                                      releaseData.valid_id_img2,
                                      '_blank'
                                    )
                                  }
                                />
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                      <Divider />
                    </>
                  )}

                  {/* Car Condition Images */}
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}
                    >
                      📸 Car Condition Images
                    </Typography>
                    <Grid container spacing={2}>
                      {releaseData.front_img && (
                        <Grid item xs={12} sm={6}>
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              Front View
                            </Typography>
                            <Box
                              component="img"
                              src={releaseData.front_img}
                              alt="Car Front"
                              sx={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '200px',
                                objectFit: 'contain',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 },
                              }}
                              onClick={() =>
                                window.open(releaseData.front_img, '_blank')
                              }
                            />
                          </Box>
                        </Grid>
                      )}
                      {releaseData.back_img && (
                        <Grid item xs={12} sm={6}>
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              Back View
                            </Typography>
                            <Box
                              component="img"
                              src={releaseData.back_img}
                              alt="Car Back"
                              sx={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '200px',
                                objectFit: 'contain',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 },
                              }}
                              onClick={() =>
                                window.open(releaseData.back_img, '_blank')
                              }
                            />
                          </Box>
                        </Grid>
                      )}
                      {releaseData.left_img && (
                        <Grid item xs={12} sm={6}>
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              Left View
                            </Typography>
                            <Box
                              component="img"
                              src={releaseData.left_img}
                              alt="Car Left"
                              sx={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '200px',
                                objectFit: 'contain',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 },
                              }}
                              onClick={() =>
                                window.open(releaseData.left_img, '_blank')
                              }
                            />
                          </Box>
                        </Grid>
                      )}
                      {releaseData.right_img && (
                        <Grid item xs={12} sm={6}>
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              Right View
                            </Typography>
                            <Box
                              component="img"
                              src={releaseData.right_img}
                              alt="Car Right"
                              sx={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '200px',
                                objectFit: 'contain',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 },
                              }}
                              onClick={() =>
                                window.open(releaseData.right_img, '_blank')
                              }
                            />
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Box>
              ) : (
                <Alert severity="info">
                  No release data available for this booking.
                </Alert>
              )}
            </Box>
          )}

          {/* Tab Panel 2: Return Details - Only for admin/staff */}
          {isAdminOrStaff && activeTab === 2 && (
            <Box sx={{ mt: 2 }}>
              {loadingReturn ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : returnData ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Return Information */}
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}
                    >
                      📋 Return Information
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Gas Level:
                        </Typography>
                        <Chip
                          label={returnData.gas_level || 'N/A'}
                          color={
                            returnData.gas_level === 'High'
                              ? 'success'
                              : returnData.gas_level === 'Mid'
                                ? 'warning'
                                : 'error'
                          }
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Odometer Reading:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {returnData.odometer
                            ? `${returnData.odometer.toString()} km`
                            : 'N/A'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Damage Status:
                        </Typography>
                        <Chip
                          label={returnData.damage_check || 'N/A'}
                          color={
                            returnData.damage_check === 'No Damage'
                              ? 'success'
                              : returnData.damage_check === 'minor'
                                ? 'warning'
                                : 'error'
                          }
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Equipment Status:
                        </Typography>
                        <Chip
                          label={
                            returnData.equipment === 'complete'
                              ? 'Complete'
                              : 'Incomplete'
                          }
                          color={
                            returnData.equipment === 'complete'
                              ? 'success'
                              : 'warning'
                          }
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      {returnData.equip_others && (
                        <Box sx={{ gridColumn: 'span 2' }}>
                          <Typography variant="body2" color="text.secondary">
                            Equipment Notes:
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {returnData.equip_others}
                          </Typography>
                        </Box>
                      )}
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Cleanliness:
                        </Typography>
                        <Chip
                          label={returnData.isClean ? 'Clean' : 'Not Clean'}
                          color={returnData.isClean ? 'success' : 'warning'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Has Stains:
                        </Typography>
                        <Chip
                          label={returnData.hasStain ? 'Yes' : 'No'}
                          color={returnData.hasStain ? 'error' : 'success'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Box sx={{ gridColumn: 'span 2' }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Fees:
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          color="error.main"
                        >
                          {formatCurrency(returnData.total_fee)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {'('}
                          {returnData.fees_breakdown
                            ? returnData.fees_breakdown
                            : 'No additional fees'}
                          {')'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Damage Image */}
                  {returnData.damage_img && (
                    <>
                      <Divider />
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            mb: 2,
                            fontWeight: 'bold',
                            color: 'primary.main',
                          }}
                        >
                          📸 Damage Image
                        </Typography>
                        <Box
                          component="img"
                          src={returnData.damage_img}
                          alt="Damage"
                          sx={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '300px',
                            objectFit: 'contain',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            cursor: 'pointer',
                            '&:hover': { opacity: 0.8 },
                          }}
                          onClick={() =>
                            window.open(returnData.damage_img, '_blank')
                          }
                        />
                      </Box>
                    </>
                  )}
                </Box>
              ) : (
                <Alert severity="info">
                  No return data available for this booking. The car has not
                  been returned yet.
                </Alert>
              )}
            </Box>
          )}

          {/* Success Alert - Show in all tabs */}
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
