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
  StepLabel
} from '@mui/material';
import { HiX, HiCurrencyDollar, HiQrcode, HiCash } from 'react-icons/hi';
import { useAuth } from '../../../hooks/useAuth';
import { createAuthenticatedFetch, getApiBase } from '../../../utils/api';

const API_BASE = getApiBase();

export default function PaymentModal({ open, onClose, booking, onPaymentSuccess }) {
  const { logout } = useAuth();
  const authenticatedFetch = React.useMemo(() => createAuthenticatedFetch(logout), [logout]);
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState({
    payment_method: '',
    gcash_no: '',
    reference_no: '',
    amount: ''
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
        amount: remainingBalance.toString()
      });
      setActiveStep(0);
      setError('');
    }
  }, [booking, open]);

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!paymentData.payment_method) {
        setError('Please select a payment method');
        return;
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
      
      const response = await authenticatedFetch(`${API_BASE}/payments/process-booking-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking.booking_id,
          ...paymentData,
          amount: parseFloat(paymentData.amount)
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (onPaymentSuccess) {
          onPaymentSuccess(result);
        }
        handleClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
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
      amount: ''
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
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
        Choose Payment Method
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Grid container spacing={2} sx={{ maxWidth: { xs: '100%', sm: '500px' } }}>
          <Grid item xs={12} sm={6}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: paymentData.payment_method === 'GCash' ? '2px solid #c10007' : '1px solid #e0e0e0',
                '&:hover': { borderColor: '#c10007', boxShadow: 2 },
                transition: 'all 0.3s ease',
                height: '100%'
              }}
              onClick={() => handleInputChange('payment_method', 'GCash')}
            >
              <CardContent sx={{ textAlign: 'center', p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <HiCurrencyDollar size={48} color="#c10007" />
                <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1, mb: 1 }}>
                  GCash
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pay using GCash QR code
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: paymentData.payment_method === 'Cash' ? '2px solid #c10007' : '1px solid #e0e0e0',
                '&:hover': { borderColor: '#c10007', boxShadow: 2 },
                transition: 'all 0.3s ease',
                height: '100%'
              }}
              onClick={() => handleInputChange('payment_method', 'Cash')}
            >
              <CardContent sx={{ textAlign: 'center', p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <HiCash size={48} color="#c10007" />
                <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1, mb: 1 }}>
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
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
        Payment Details
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: '500px' } }}>
          <Grid container spacing={3}>
            {/* Payment Amount */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Payment Amount"
                value={paymentData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                required
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₱</Typography>,
                }}
                inputProps={{ min: 1, max: getRemainingBalance() }}
                helperText={`Outstanding balance: ₱${getRemainingBalance().toLocaleString()}`}
              />
            </Grid>

            {/* GCash-specific fields */}
            {paymentData.payment_method === 'GCash' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="GCash Number"
                    value={paymentData.gcash_no}
                    onChange={(e) => handleInputChange('gcash_no', e.target.value)}
                    placeholder="09XXXXXXXXX"
                    required
                    helperText="Enter your 11-digit GCash number"
                  />
                </Grid>

                {/* QR Code Section */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#f0f8ff', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <HiQrcode size={48} color="#c10007" />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#c10007' }}>
                        GCash Payment
                      </Typography>
                      
                      {/* QR Code Placeholder */}
                      <Box
                        sx={{
                          width: { xs: 150, sm: 200 },
                          height: { xs: 150, sm: 200 },
                          backgroundColor: '#fff',
                          border: '2px solid #e0e0e0',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          gap: 1
                        }}
                      >
                        <HiQrcode size={64} color="#c10007" />
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                          GCash QR Code
                          <br />
                          Amount: ₱{paymentData.amount}
                        </Typography>
                      </Box>
                      
                      <Alert severity="info" sx={{ mt: 2, textAlign: 'left', maxWidth: '400px' }}>
                        <Typography variant="body2">
                          <strong>Steps:</strong><br />
                          1. Open your GCash app<br />
                          2. Scan the QR code above<br />
                          3. Confirm payment amount: ₱{paymentData.amount}<br />
                          4. Complete the transaction<br />
                          5. Enter the reference number below
                        </Typography>
                      </Alert>
                    </Box>
                  </Paper>
                </Grid>
              </>
            )}

            {/* Cash payment instructions */}
            {paymentData.payment_method === 'Cash' && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Cash Payment Instructions:</strong><br />
                    1. Visit our office during business hours<br />
                    2. Bring the exact amount: ₱{paymentData.amount}<br />
                    3. Present your booking ID: #{booking?.booking_id}<br />
                    4. Get the receipt for your records
                  </Typography>
                </Alert>
              </Grid>
            )}

            {/* Reference Number - Only for GCash */}
            {paymentData.payment_method === 'GCash' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reference Number *"
                  value={paymentData.reference_no}
                  onChange={(e) => handleInputChange('reference_no', e.target.value)}
                  placeholder="Enter GCash reference number"
                  required
                  helperText="Enter the reference number from your GCash transaction"
                />
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>
    </Box>
  );

  const renderConfirmationStep = () => (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
        Confirm Payment
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Card sx={{ mb: 3, maxWidth: { xs: '100%', sm: '400px' }, width: '100%' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#c10007', fontWeight: 'bold' }}>
              Payment Summary
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Booking ID</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  #{booking?.booking_id}
                </Typography>
              </Box>
              
              <Divider />
              
              <Box>
                <Typography variant="body2" color="text.secondary">Vehicle</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {booking?.car_details?.make} {booking?.car_details?.model}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" color="text.secondary">Payment Method</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {paymentData.payment_method}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" color="text.secondary">Amount</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#c10007' }}>
                  ₱{paymentData.amount ? parseFloat(paymentData.amount).toLocaleString() : '0'}
                </Typography>
              </Box>

              {paymentData.payment_method === 'GCash' && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">GCash Number</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {paymentData.gcash_no}
                    </Typography>
                  </Box>
                  
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Reference Number</Typography>
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
        <Alert severity="warning" sx={{ mb: 2, maxWidth: { xs: '100%', sm: '400px' }, width: '100%' }}>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            Please verify all details before submitting. This payment will be processed immediately.
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
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: '#c10007',
        color: 'white',
        pb: 2
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Process Payment
        </Typography>
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <HiX />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Booking Summary Header */}
        <Box sx={{ p: 3, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Booking #{booking.booking_id}</strong> - {booking.car_details?.make} {booking.car_details?.model}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Outstanding Balance: <strong style={{ color: '#c10007' }}>₱{getRemainingBalance().toLocaleString()}</strong>
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
              minWidth: '80px'
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
              minWidth: '120px'
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Process Payment'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}