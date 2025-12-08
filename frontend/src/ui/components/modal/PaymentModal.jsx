import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  IconButton,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { HiX, HiCurrencyDollar, HiQrcode, HiCash, HiDownload } from 'react-icons/hi';
import { useAuth } from '../../../hooks/useAuth';
import { createAuthenticatedFetch, getApiBase } from '../../../utils/api';

const API_BASE = getApiBase();

export default function PaymentModal({
  open,
  onClose,
  booking,
  onPaymentSuccess,
}) {
  const { logout } = useAuth();
  const authenticatedFetch = React.useMemo(
    () => createAuthenticatedFetch(logout),
    [logout]
  );

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState({
    payment_method: '',
    gcash_no: '',
    reference_no: '',
    amount: '',
  });

  const steps = ['Payment Method', 'Payment Details', 'Confirmation'];

  React.useEffect(() => {
    if (booking && open) {
      // Calculate remaining balance
      const totalAmount = booking.total_amount || 0;
      const totalPaid = booking.total_paid || 0;
      const remainingBalance = totalAmount - totalPaid;

      setPaymentData({
        payment_method: '',
        gcash_no: '',
        reference_no: '',
        amount: remainingBalance.toString(),
      });
      setActiveStep(0);
      setError('');
    }
  }, [booking, open]);

  const handleInputChange = (field, value) => {
    setPaymentData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError('');
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!paymentData.payment_method) {
        setError('Please select a payment method');
        return;
      }

      // For Cash payments, automatically set amount to full remaining balance
      if (paymentData.payment_method === 'Cash') {
        setPaymentData((prev) => ({
          ...prev,
          amount: getRemainingBalance().toString(),
        }));
      }

      setActiveStep(1);
    } else if (activeStep === 1) {
      if (validatePaymentDetails()) {
        setActiveStep(2);
      }
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      setError('');
    }
  };

  const validatePaymentDetails = () => {
    // For Cash payments, amount is automatically set, skip validation
    if (paymentData.payment_method === 'Cash') {
      return true; // Cash payments just show instructions, always valid
    }

    // For GCash payments, validate amount and reference
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      setError('Please enter a valid payment amount');
      return false;
    }

    if (paymentData.payment_method === 'GCash') {
      if (!paymentData.gcash_no) {
        setError('Please enter your GCash number');
        return false;
      }
      if (!/^09\d{9}$/.test(paymentData.gcash_no)) {
        setError('Please enter a valid GCash number (09XXXXXXXXX)');
        return false;
      }
      if (!paymentData.reference_no) {
        setError('Please enter the GCash reference number');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validatePaymentDetails()) return;

    try {
      setLoading(true);
      setError('');

      const response = await authenticatedFetch(
        `${API_BASE}/payments/process-booking-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_id: booking.booking_id,
            ...paymentData,
            amount: parseFloat(paymentData.amount),
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();

        // Prepare success message based on payment type and confirmation status
        let successMessage =
          result.message || 'Payment processed successfully!';

        if (result.pending_admin_confirmation) {
          if (result.is_cash_payment) {
            successMessage +=
              ' Please visit our office to complete your cash payment. Your booking status will remain pending until payment is verified.';
          } else {
            successMessage +=
              ' Your booking status will remain pending until payment is verified by our staff.';
          }
        }

        // Pass result with message to parent component
        if (onPaymentSuccess) {
          onPaymentSuccess({ ...result, successMessage });
        }
        handleClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to process payment');
      }
    } catch (error) {
      setError('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setError('');
    setPaymentData({
      payment_method: '',
      gcash_no: '',
      reference_no: '',
      amount: '',
    });
    onClose();
  };

  const getRemainingBalance = () => {
    if (!booking) return 0;
    const totalAmount = booking.total_amount || 0;
    const totalPaid = booking.total_paid || 0;
    return Math.max(0, totalAmount - totalPaid);
  };
  const renderPaymentMethodStep = () => (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography
        variant="h6"
        sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}
      >
        Choose Payment Method
      </Typography>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Grid
          container
          spacing={2}
          sx={{
            maxWidth: { xs: '100%', sm: '500px' },
            justifyContent: 'center',
          }}
        >
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card
              sx={{
                cursor: 'pointer',
                border:
                  paymentData.payment_method === 'GCash'
                    ? '2px solid #c10007'
                    : '1px solid #e0e0e0',
                '&:hover': { borderColor: '#c10007', boxShadow: 2 },
                transition: 'all 0.3s ease',
                height: '100%',
              }}
              onClick={() => handleInputChange('payment_method', 'GCash')}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <HiCurrencyDollar size={48} color="#c10007" />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 'bold', mt: 1, mb: 1 }}
                >
                  GCash
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pay using GCash QR code
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Card
              sx={{
                cursor: 'pointer',
                border:
                  paymentData.payment_method === 'Cash'
                    ? '2px solid #c10007'
                    : '1px solid #e0e0e0',
                '&:hover': { borderColor: '#c10007', boxShadow: 2 },
                transition: 'all 0.3s ease',
                height: '100%',
              }}
              onClick={() => handleInputChange('payment_method', 'Cash')}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <HiCash size={48} color="#c10007" />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 'bold', mt: 1, mb: 1 }}
                >
                  Cash
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pay with cash at our office
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );

  const renderPaymentDetailsStep = () => (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography
        variant="h6"
        sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}
      >
        Payment Details
      </Typography>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: '500px' } }}>
          <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
            {/* Cash Payment Instructions - Show only instructions, no amount input */}
            {paymentData.payment_method === 'Cash' ? (
              <Grid size={{ xs: 12 }}>
                <Paper
                  sx={{
                    p: { xs: 2, sm: 4 },
                    textAlign: 'center',
                    backgroundColor: '#fff8e1',
                    borderRadius: 2,
                    border: '2px solid #ff9800',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: { xs: 2, sm: 3 },
                    }}
                  >
                    <HiCash size={64} color="#ff9800" />
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 'bold',
                        color: '#ff9800',
                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                      }}
                    >
                      Cash Payment Instructions
                    </Typography>

                    <Alert
                      severity="warning"
                      sx={{ width: '100%', textAlign: 'left' }}
                    >
                      <Typography
                        variant="body1"
                        sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
                        <strong>
                          Please visit our office to complete your cash payment.
                        </strong>
                      </Typography>
                      <Typography
                        variant="body2"
                        component="div"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        <strong>📍 Office Location:</strong>
                        <br />
                        JA Car Rental Office
                        <br />
                        123 Main Street, Business District, City
                        <br />
                        <br />
                        <strong>🕐 Business Hours:</strong>
                        <br />
                        Monday - Friday: 8:00 AM - 5:00 PM
                        <br />
                        Saturday: 9:00 AM - 3:00 PM
                        <br />
                        Sunday: Closed
                        <br />
                        <br />
                        <strong>💰 Amount Due:</strong>
                        <br />₱{getRemainingBalance().toLocaleString()}
                        <br />
                        <br />
                        <strong>📝 What to Bring:</strong>
                        <br />• Booking ID: #{booking?.booking_id}
                        <br />
                        • Valid ID
                        <br />
                        • Exact amount or sufficient cash
                        <br />
                        <br />
                        <strong>⏳ Important:</strong>
                        <br />
                        Your booking will remain pending until payment is
                        verified by our staff at the office.
                      </Typography>
                    </Alert>
                  </Box>
                </Paper>
              </Grid>
            ) : (
              <>
                {/* Payment Amount - Only for GCash */}
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ width: '100%', maxWidth: '100%' }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Payment Amount"
                      value={paymentData.amount}
                      onChange={(e) =>
                        handleInputChange('amount', e.target.value)
                      }
                      required
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>₱</Typography>,
                      }}
                      inputProps={{ min: 1, max: getRemainingBalance() }}
                      helperText={`Outstanding balance: ₱${getRemainingBalance().toLocaleString()}`}
                      sx={{ width: '100%' }}
                    />
                  </Box>
                </Grid>

                {/* GCash-specific fields */}
                {paymentData.payment_method === 'GCash' && (
                  <>
                    {/* QR Code Section */}
                    <Grid size={{ xs: 12 }}>
                      <Paper
                        sx={{
                          p: { xs: 2, sm: 3 },
                          textAlign: 'center',
                          backgroundColor: '#f0f8ff',
                          borderRadius: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: { xs: 1.5, sm: 2 },
                          }}
                        >
                          <HiQrcode size={48} color="#c10007" />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 'bold',
                              color: '#c10007',
                              fontSize: { xs: '1rem', sm: '1.25rem' },
                            }}
                          >
                            GCash Payment
                          </Typography>

                          {/* QR Code Image */}
                          <Box
                            sx={{
                              width: { xs: 200, sm: 250 },
                              height: { xs: 200, sm: 250 },
                              backgroundColor: '#fff',
                              border: '2px solid #e0e0e0',
                              borderRadius: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mx: 'auto',
                              overflow: 'hidden',
                            }}
                          >
                            <img
                              src="/QR.png"
                              alt="GCash QR Code"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                              }}
                            />
                          </Box>

                          {/* Download QR Button */}
                          <Button
                            variant="outlined"
                            startIcon={<HiDownload />}
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = '/QR-Full.jpg';
                              link.download = 'JA-Car-Rental-GCash-QR.jpg';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            sx={{
                              borderColor: '#c10007',
                              color: '#c10007',
                              '&:hover': {
                                borderColor: '#a00006',
                                backgroundColor: 'rgba(193, 0, 7, 0.04)',
                              },
                            }}
                          >
                            Download QR Code
                          </Button>

                          <Alert
                            severity="info"
                            sx={{
                              mt: { xs: 1, sm: 2 },
                              textAlign: 'left',
                              width: '100%',
                              maxWidth: '400px',
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              }}
                            >
                              <strong>Steps:</strong>
                              <br />
                              1. Open your GCash app
                              <br />
                              2. Scan the QR code above
                              <br />
                              3. Confirm payment amount: ₱{paymentData.amount}
                              <br />
                              4. Complete the transaction
                              <br />
                              5. Enter the reference number below
                            </Typography>
                          </Alert>
                        </Box>
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ width: '100%', maxWidth: '100%' }}>
                        <TextField
                          fullWidth
                          label="GCash Number"
                          value={paymentData.gcash_no}
                          onChange={(e) =>
                            handleInputChange('gcash_no', e.target.value)
                          }
                          placeholder="09XXXXXXXXX"
                          required
                          helperText="Enter your 11-digit GCash number"
                          sx={{ width: '100%' }}
                        />
                      </Box>
                    </Grid>

                    {/* Reference Number - Only for GCash */}
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Reference Number *"
                        value={paymentData.reference_no}
                        onChange={(e) =>
                          handleInputChange('reference_no', e.target.value)
                        }
                        placeholder="Enter GCash reference number"
                        required
                        helperText="Enter the reference number from your GCash transaction"
                      />
                    </Grid>
                  </>
                )}
              </>
            )}
          </Grid>
        </Box>
      </Box>
    </Box>
  );

  const renderConfirmationStep = () => (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography
        variant="h6"
        sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}
      >
        Confirm Payment
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Card
          sx={{ mb: 3, maxWidth: { xs: '100%', sm: '400px' }, width: '100%' }}
        >
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography
              variant="h6"
              sx={{ mb: 3, color: '#c10007', fontWeight: 'bold' }}
            >
              Payment Summary
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Booking ID
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  #{booking?.booking_id}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Vehicle
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {booking?.car_details?.make} {booking?.car_details?.model}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Payment Method
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {paymentData.payment_method}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Amount
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 'bold', color: '#c10007' }}
                >
                  ₱
                  {paymentData.amount
                    ? parseFloat(paymentData.amount).toLocaleString()
                    : '0'}
                </Typography>
              </Box>

              {paymentData.payment_method === 'GCash' && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      GCash Number
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {paymentData.gcash_no}
                    </Typography>
                  </Box>

                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Reference Number
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {paymentData.reference_no}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Alert
          severity="warning"
          sx={{ mb: 2, maxWidth: { xs: '100%', sm: '400px' }, width: '100%' }}
        >
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            Please verify all details before submitting. This payment will be
            processed immediately.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );

  if (!booking) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '60vh',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#c10007',
          color: 'white',
          pb: 2,
          fontWeight: 'bold',
        }}
      >
        Process Payment
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <HiX />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Booking Summary Header */}
        <Box
          sx={{
            p: 3,
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Booking #{booking.booking_id}</strong> -{' '}
            {booking.car_details?.make} {booking.car_details?.model}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Outstanding Balance:{' '}
            <strong style={{ color: '#c10007' }}>
              ₱{getRemainingBalance().toLocaleString()}
            </strong>
          </Typography>
        </Box>

        {/* Stepper */}
        <Box sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* Step Content */}
        <Box sx={{ minHeight: '300px' }}>
          {activeStep === 0 && renderPaymentMethodStep()}
          {activeStep === 1 && renderPaymentDetailsStep()}
          {activeStep === 2 && renderConfirmationStep()}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, backgroundColor: '#f5f5f5', gap: 1 }}>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0 || loading}
          sx={{ minWidth: '80px' }}
        >
          Back
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>

        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
            sx={{
              backgroundColor: '#c10007',
              '&:hover': { backgroundColor: '#a50006' },
              minWidth: '80px',
            }}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: '#c10007',
              '&:hover': { backgroundColor: '#a50006' },
              minWidth: '120px',
            }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Process Payment'
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
