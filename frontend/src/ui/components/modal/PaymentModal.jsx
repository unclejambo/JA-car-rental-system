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
  Paper
} from '@mui/material';
import { HiX, HiCurrencyDollar, HiQrcode } from 'react-icons/hi';
import { useAuth } from '../../../hooks/useAuth';
import { createAuthenticatedFetch, getApiBase } from '../../../utils/api';

const API_BASE = getApiBase();

export default function PaymentModal({ open, onClose, booking, onSuccess }) {
  const { logout } = useAuth();
  const authenticatedFetch = React.useMemo(() => createAuthenticatedFetch(logout), [logout]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState({
    payment_method: '',
    gcash_no: '',
    reference_no: '',
    amount: ''
  });

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
    }
  }, [booking, open]);

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!booking) return;
    
    try {
      setLoading(true);
      setError('');
      
      if (!paymentData.payment_method || !paymentData.amount) {
        setError('Payment method and amount are required');
        return;
      }

      if (paymentData.payment_method === 'GCash' && !paymentData.gcash_no) {
        setError('GCash number is required for GCash payments');
        return;
      }

      if (!paymentData.reference_no) {
        setError('Reference number is required');
        return;
      }
      
      const response = await authenticatedFetch(`${API_BASE}/payments/process-booking-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking.booking_id,
          ...paymentData,
          amount: parseInt(paymentData.amount)
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.message}`);
        onSuccess?.();
        onClose();
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

  const getRemainingBalance = () => {
    if (!booking) return 0;
    const totalAmount = booking.total_amount || 0;
    const totalPaid = booking.total_paid || 0;
    return Math.max(0, totalAmount - totalPaid);
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#c10007' }}>
          Process Payment
        </Typography>
        <IconButton onClick={onClose} size="small">
          <HiX />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Booking Summary */}
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: '#f8f9fa', border: '2px solid #c10007' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#c10007' }}>
                  Booking Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Car:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {booking.car_details?.display_name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Booking ID:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      #{booking.booking_id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Total Amount:</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#c10007' }}>
                      ₱{booking.total_amount?.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Amount Paid:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      ₱{booking.total_paid?.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="text.secondary">Outstanding Balance:</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                      ₱{getRemainingBalance().toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Method */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentData.payment_method}
                label="Payment Method"
                onChange={(e) => handleInputChange('payment_method', e.target.value)}
              >
                <MenuItem value="GCash">GCash</MenuItem>
                <MenuItem value="Maya">Maya (PayMaya)</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Credit Card">Credit Card</MenuItem>
                <MenuItem value="Debit Card">Debit Card</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Payment Amount */}
          <Grid item xs={12} sm={6}>
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
            />
          </Grid>

          {/* GCash Number - Only show for GCash payments */}
          {paymentData.payment_method === 'GCash' && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GCash Number"
                value={paymentData.gcash_no}
                onChange={(e) => handleInputChange('gcash_no', e.target.value)}
                placeholder="09XXXXXXXXX"
                required
              />
            </Grid>
          )}

          {/* Reference Number */}
          <Grid item xs={12} sm={paymentData.payment_method === 'GCash' ? 6 : 12}>
            <TextField
              fullWidth
              label="Reference Number"
              value={paymentData.reference_no}
              onChange={(e) => handleInputChange('reference_no', e.target.value)}
              placeholder="Enter transaction reference number"
              required
              helperText="Enter the reference number from your payment transaction"
            />
          </Grid>

          {/* QR Code Section for GCash */}
          {paymentData.payment_method === 'GCash' && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#f0f8ff' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <HiQrcode size={48} color="#c10007" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#c10007' }}>
                    GCash Payment
                  </Typography>
                  <Typography variant="body1">
                    Scan the QR code below with your GCash app to pay:
                  </Typography>
                  
                  {/* QR Code Placeholder */}
                  <Box
                    sx={{
                      width: 200,
                      height: 200,
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
                  
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, textAlign: 'center' }}>
                    After completing the payment, please enter your GCash number and the reference number provided by GCash.
                  </Typography>
                  
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Steps:</strong><br />
                      1. Open your GCash app<br />
                      2. Scan the QR code above<br />
                      3. Confirm the payment amount<br />
                      4. Complete the transaction<br />
                      5. Enter the reference number below
                    </Typography>
                  </Alert>
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Payment Instructions for other methods */}
          {paymentData.payment_method && paymentData.payment_method !== 'GCash' && (
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Payment Instructions for {paymentData.payment_method}:</strong><br />
                  {paymentData.payment_method === 'Maya' && 'Use Maya app to send payment and provide the reference number.'}
                  {paymentData.payment_method === 'Bank Transfer' && 'Transfer to our bank account and provide the reference number.'}
                  {paymentData.payment_method === 'Cash' && 'Bring cash payment to our office and get the receipt reference number.'}
                  {(paymentData.payment_method === 'Credit Card' || paymentData.payment_method === 'Debit Card') && 'Complete card payment and provide the transaction reference number.'}
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={loading || !paymentData.payment_method || !paymentData.amount || !paymentData.reference_no}
          sx={{
            backgroundColor: '#c10007',
            '&:hover': { backgroundColor: '#a50006' }
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Process Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}