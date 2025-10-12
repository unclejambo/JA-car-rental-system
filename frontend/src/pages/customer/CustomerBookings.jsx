import React, { useState, useEffect } from 'react';
import CustomerSideBar from '../../ui/components/CustomerSideBar';
import Header from '../../ui/components/Header';
import EditBookingModal from '../../ui/components/modal/NewEditBookingModal';
import PaymentModal from '../../ui/components/modal/PaymentModal';
import '../../styles/customercss/customerdashboard.css';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Card, 
  CardContent, 
  CardMedia,
  Grid, 
  Chip, 
  Button, 
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  HiCalendar, 
  HiClock, 
  HiLocationMarker, 
  HiUser, 
  HiCurrencyDollar,
  HiX,
  HiPencil,
  HiTrash,
  HiPlus,
  HiRefresh
} from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth.js';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api.js';
import { 
  formatPhilippineDate, 
  formatPhilippineTime, 
  formatPhilippineDateTime,
  parseAndFormatTime,
  formatDateForInput
} from '../../utils/dateTime.js';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`booking-tabpanel-${index}`}
      aria-labelledby={`booking-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function CustomerBookings() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [extendDate, setExtendDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { logout } = useAuth();
  const API_BASE = getApiBase();
  const authenticatedFetch = React.useMemo(() => createAuthenticatedFetch(logout), [logout]);

  // Fetch customer's bookings and payments
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await authenticatedFetch(`${API_BASE}/bookings/my-bookings/list`);
      
      if (response.ok) {
        const data = await response.json();
        setBookings(data || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Error connecting to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer's payment history
  const fetchPayments = async () => {
    try {
      console.log('Fetching payments...');
      const response = await authenticatedFetch(`${API_BASE}/payments/my-payments`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Payments response:', data);
        setPayments(data || []);
      } else {
        console.error('Failed to fetch payments:', response.status, response.statusText);
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchPayments();
  }, [authenticatedFetch, API_BASE]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'confirmed': return 'info';
      case 'ongoing': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'success';
      case 'unpaid': return 'error';
      default: return 'default';
    }
  };

  // Cancel booking
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      setActionLoading(true);
      const response = await authenticatedFetch(`${API_BASE}/bookings/${selectedBooking.booking_id}/cancel`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        const result = await response.json();
        const message = result.pending_approval 
          ? `✅ Cancellation request submitted! Your booking is pending admin approval. You'll be notified once it's confirmed.`
          : `✅ ${result.message}`;
        alert(message);
        fetchBookings(); // Refresh the list
        setShowCancelDialog(false);
        setSelectedBooking(null);
      } else {
        const errorData = await response.json();
        alert(`❌ ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('❌ Failed to cancel booking. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle successful booking update
  const handleBookingUpdated = () => {
    fetchBookings();
    fetchPayments();
    setShowEditDialog(false);
    setSelectedBooking(null);
  };

  // Handle successful payment
  const handlePaymentSuccess = () => {
    fetchBookings();
    fetchPayments();
    setShowPaymentDialog(false);
    setSelectedBooking(null);
  };

  // Extend booking
  const handleExtendBooking = async () => {
    if (!selectedBooking || !extendDate) return;
    
    try {
      setActionLoading(true);
      const response = await authenticatedFetch(`${API_BASE}/bookings/${selectedBooking.booking_id}/extend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_end_date: extendDate })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.message}\n💰 Additional cost: ₱${result.additional_cost?.toLocaleString()}\n📊 New total: ₱${result.new_total?.toLocaleString()}`);
        fetchBookings(); // Refresh the list
        setShowExtendDialog(false);
        setSelectedBooking(null);
        setExtendDate('');
      } else {
        const errorData = await response.json();
        alert(`❌ ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error extending booking:', error);
      alert('❌ Failed to extend booking. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Get minimum extend date (current end date + 1)
  const getMinExtendDate = () => {
    if (!selectedBooking) return '';
    const endDate = new Date(selectedBooking.new_end_date || selectedBooking.end_date);
    endDate.setDate(endDate.getDate() + 1);
    return formatDateForInput(endDate);
  };

  return (
    <>
      <Header onMenuClick={() => setMobileOpen(true)} isMenuOpen={mobileOpen} />
      <CustomerSideBar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: `calc(100% - 18.7dvw)`,
          ml: {
            xs: '0px',
            sm: '0px',
            md: '18.7dvw',
            lg: '18.7dvw',
          },
          '@media (max-width: 1024px)': {
            ml: '0px',
          },
          mt: { xs: '64px', sm: '64px', md: '56px', lg: '56px' },
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        <title>My Bookings</title>
        
        {/* Page Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#c10007' }}>
              My Bookings
            </Typography>
            <Button
              variant="outlined"
              startIcon={<HiRefresh />}
              onClick={fetchBookings}
              disabled={loading}
              sx={{ 
                borderColor: '#c10007', 
                color: '#c10007',
                '&:hover': { borderColor: '#a50006', backgroundColor: '#fff5f5' }
              }}
            >
              Refresh
            </Button>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Manage your car rental bookings and track payment history
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '1rem',
                minWidth: 120,
              },
              '& .Mui-selected': {
                color: '#c10007 !important',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#c10007',
              },
            }}
          >
            <Tab label={`My Bookings (${bookings.length})`} />
            <Tab label={`Settlement (${payments.length})`} />
          </Tabs>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#c10007' }} />
          </Box>
        )}

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          {/* MY BOOKINGS TAB */}
          {bookings.length === 0 && !loading ? (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No bookings found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You haven't made any car rental bookings yet.
              </Typography>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {bookings.map((booking) => (
                <Grid item xs={12} md={6} lg={4} key={booking.booking_id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid #e0e0e0',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(193, 0, 7, 0.1)',
                        borderColor: '#c10007'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {/* Car Image */}
                    <CardMedia
                      component="div"
                      sx={{
                        height: 200,
                        backgroundColor: '#f5f5f5',
                        backgroundImage: booking.car_details.image_url 
                          ? `url(${booking.car_details.image_url})` 
                          : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}
                    >
                      {!booking.car_details.image_url && (
                        <Typography variant="body2" color="text.secondary">
                          No Image
                        </Typography>
                      )}
                      
                      {/* Status Chip */}
                      <Chip
                        label={booking.booking_status || 'Unknown'}
                        color={getStatusColor(booking.booking_status)}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          fontWeight: 'bold'
                        }}
                      />
                    </CardMedia>

                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      {/* Car Details */}
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {booking.car_details.display_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Plate: {booking.car_details.license_plate}
                      </Typography>

                      {/* Booking Info */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <HiCalendar size={16} style={{ marginRight: '8px', color: '#c10007' }} />
                          <Typography variant="body2">
                            {formatPhilippineDate(booking.start_date, { month: 'short', day: 'numeric', year: 'numeric' })} - {formatPhilippineDate(booking.end_date, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <HiClock size={16} style={{ marginRight: '8px', color: '#c10007' }} />
                          <Typography variant="body2">
                            {parseAndFormatTime(booking.pickup_time)} - {parseAndFormatTime(booking.dropoff_time)}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <HiLocationMarker size={16} style={{ marginRight: '8px', color: '#c10007' }} />
                          <Typography variant="body2" noWrap>
                            {booking.pickup_loc || 'JA Car Rental Office'}
                          </Typography>
                        </Box>

                        {booking.driver_details && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <HiUser size={16} style={{ marginRight: '8px', color: '#c10007' }} />
                            <Typography variant="body2">
                              Driver: {booking.driver_details.name}
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <HiCurrencyDollar size={16} style={{ marginRight: '8px', color: '#c10007' }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            Total: ₱{booking.total_amount?.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Pending Approval Indicators */}
                      {(booking.isCancel || booking.isExtend || (booking.isPay && booking.payment_status?.toLowerCase() !== 'paid')) && (
                        <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#fff3cd', borderRadius: 1, border: '1px solid #ffc107' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#856404', mb: 0.5 }}>
                            ⏳ Pending Admin Approval
                          </Typography>
                          {booking.isCancel && (
                            <Typography variant="caption" sx={{ color: '#856404', display: 'block' }}>
                              • Cancellation request submitted
                            </Typography>
                          )}
                          {booking.isExtend && (
                            <Typography variant="caption" sx={{ color: '#856404', display: 'block' }}>
                              • Extension request submitted
                            </Typography>
                          )}
                          {booking.isPay && booking.payment_status?.toLowerCase() !== 'paid' && (
                            <Typography variant="caption" sx={{ color: '#856404', display: 'block' }}>
                              • Payment submitted - waiting for verification
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {/* Edit Button - Only for pending bookings without pending actions */}
                        {booking.booking_status?.toLowerCase() === 'pending' && !booking.isCancel && !booking.isExtend && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<HiPencil size={14} />}
                            sx={{ 
                              borderColor: '#2196f3', 
                              color: '#2196f3',
                              minWidth: 'auto',
                              px: 1.5
                            }}
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowEditDialog(true);
                            }}
                          >
                            Edit
                          </Button>
                        )}

                        {/* Cancel Button - For pending and confirmed bookings without pending cancellation */}
                        {(booking.booking_status?.toLowerCase() === 'pending' || 
                          booking.booking_status?.toLowerCase() === 'confirmed') && 
                          !booking.isCancel && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<HiX size={14} />}
                            sx={{ 
                              borderColor: '#f44336', 
                              color: '#f44336',
                              minWidth: 'auto',
                              px: 1.5
                            }}
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowCancelDialog(true);
                            }}
                          >
                            Cancel
                          </Button>
                        )}

                        {/* Extend Button - For In Progress bookings without pending extension */}
                        {booking.booking_status?.toLowerCase() === 'in progress' && !booking.isExtend && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<HiPlus size={14} />}
                            sx={{ 
                              borderColor: '#4caf50', 
                              color: '#4caf50',
                              minWidth: 'auto',
                              px: 1.5
                            }}
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowExtendDialog(true);
                            }}
                          >
                            Extend
                          </Button>
                        )}

                        {/* Pay Now Button - Only show if balance > 0 and isPay is false */}
                        {booking.balance > 0 && 
                         !booking.isPay &&
                         booking.booking_status?.toLowerCase() !== 'cancelled' && 
                         booking.booking_status?.toLowerCase() !== 'completed' && (
                          <Button
                            size="small"
                            variant="contained"
                            sx={{ 
                              backgroundColor: '#c10007',
                              color: 'white',
                              minWidth: 'auto',
                              px: 1.5,
                              '&:hover': { backgroundColor: '#a50006' }
                            }}
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowPaymentDialog(true);
                            }}
                          >
                            Pay Now
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* SETTLEMENT TAB */}
          {payments.length === 0 && !loading ? (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No payment records found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your payment history will appear here once you make payments.
              </Typography>
            </Card>
          ) : (
            <Box>
              {payments.map((payment) => (
                <Card key={payment.payment_id} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {payment.description || 'Payment'}
                        </Typography>
                        {payment.booking_info && (
                          <>
                            <Typography variant="body2" color="text.secondary">
                              Booking ID: #{payment.booking_info.booking_id}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {payment.booking_info.car_details?.make} {payment.booking_info.car_details?.model}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {payment.booking_info.dates}
                            </Typography>
                          </>
                        )}
                        {payment.waitlist_info && (
                          <>
                            <Typography variant="body2" color="text.secondary">
                              Waitlist ID: #{payment.waitlist_info.waitlist_id}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {payment.waitlist_info.car_details?.make} {payment.waitlist_info.car_details?.model}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {payment.waitlist_info.dates}
                            </Typography>
                          </>
                        )}
                      </Grid>
                      
                      <Grid item xs={12} sm={2}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Payment Method
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {payment.payment_method || 'Not specified'}
                        </Typography>
                        {payment.payment_method === 'GCash' && payment.gcash_no && (
                          <Typography variant="body2" color="text.secondary">
                            GCash: {payment.gcash_no}
                          </Typography>
                        )}
                        {payment.payment_method === 'GCash' && payment.reference_no && (
                          <Typography variant="body2" color="text.secondary">
                            Ref: {payment.reference_no}
                          </Typography>
                        )}
                      </Grid>
                      
                      <Grid item xs={12} sm={2}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Amount
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#c10007' }}>
                          ₱{payment.amount?.toLocaleString()}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={2}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Date Paid
                        </Typography>
                        <Typography variant="body1">
                          {payment.paid_date ? formatPhilippineDate(payment.paid_date, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={2}>
                        <Chip
                          label={payment.balance > 0 ? 'Partial' : 'Paid'}
                          color={payment.balance > 0 ? 'warning' : 'success'}
                          sx={{ fontWeight: 'bold' }}
                        />
                        {payment.balance > 0 && (
                          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                            Balance: ₱{payment.balance?.toLocaleString()}
                          </Typography>
                        )}
                      </Grid>
                      
                      <Grid item xs={12} sm={1}>
                        {payment.balance > 0 && payment.booking_info && (
                          <Button
                            variant="contained"
                            size="small"
                            sx={{ 
                              backgroundColor: '#c10007',
                              '&:hover': { backgroundColor: '#a50006' }
                            }}
                            onClick={() => {
                              // Find the booking for this payment
                              const relatedBooking = bookings.find(b => b.booking_id === payment.booking_info.booking_id);
                              if (relatedBooking) {
                                setSelectedBooking(relatedBooking);
                                setShowPaymentDialog(true);
                              }
                            }}
                          >
                            Pay
                          </Button>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </TabPanel>

        {/* Cancel Booking Dialog */}
        <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ color: '#c10007', fontWeight: 'bold' }}>
            Cancel Booking
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to cancel this booking?
            </Typography>
            {selectedBooking && (
              <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {selectedBooking.car_details.display_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatPhilippineDate(selectedBooking.start_date, { month: 'short', day: 'numeric', year: 'numeric' })} - {formatPhilippineDate(selectedBooking.end_date, { month: 'short', day: 'numeric', year: 'numeric' })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Amount: ₱{selectedBooking.total_amount?.toLocaleString()}
                </Typography>
              </Box>
            )}
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              Note: Cancellation policies may apply. Please check your booking terms.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCancelDialog(false)}>
              Keep Booking
            </Button>
            <Button 
              onClick={handleCancelBooking} 
              color="error" 
              variant="contained"
              disabled={actionLoading}
            >
              {actionLoading ? <CircularProgress size={20} /> : 'Cancel Booking'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Extend Booking Dialog */}
        <Dialog open={showExtendDialog} onClose={() => setShowExtendDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ color: '#c10007', fontWeight: 'bold' }}>
            Extend Booking
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Extend your rental period for:
            </Typography>
            {selectedBooking && (
              <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {selectedBooking.car_details.display_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current End Date: {formatPhilippineDate(selectedBooking.new_end_date || selectedBooking.end_date, { month: 'long', day: 'numeric', year: 'numeric' })}
                </Typography>
              </Box>
            )}
            <TextField
              label="New End Date"
              type="date"
              value={extendDate}
              onChange={(e) => setExtendDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: getMinExtendDate() }}
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              Additional charges will apply based on the daily rental rate.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowExtendDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExtendBooking} 
              color="primary" 
              variant="contained"
              disabled={actionLoading || !extendDate}
              sx={{ backgroundColor: '#c10007', '&:hover': { backgroundColor: '#a50006' } }}
            >
              {actionLoading ? <CircularProgress size={20} /> : 'Extend Booking'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* Edit Booking Modal */}
      <EditBookingModal
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        booking={selectedBooking}
        onBookingUpdated={handleBookingUpdated}
      />

      {/* Payment Modal */}
      <PaymentModal
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        booking={selectedBooking}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
}

export default CustomerBookings;
