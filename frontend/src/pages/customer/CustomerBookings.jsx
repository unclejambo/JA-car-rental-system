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
  Tooltip,
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
  HiRefresh,
} from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth.js';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api.js';
import {
  formatPhilippineDate,
  formatPhilippineTime,
  formatPhilippineDateTime,
  parseAndFormatTime,
  formatDateForInput,
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
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
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
  const authenticatedFetch = React.useMemo(
    () => createAuthenticatedFetch(logout),
    [logout]
  );

  // Fetch customer's bookings and payments
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await authenticatedFetch(
        `${API_BASE}/bookings/my-bookings/list`
      );

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

  // Fetch customer's payment history - Now fetches unpaid bookings instead
  const fetchPayments = async () => {
    try {
      console.log('Fetching unpaid bookings for settlement...');
      const response = await authenticatedFetch(
        `${API_BASE}/bookings/my-bookings/list`
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Bookings response for settlement:', data);
        // Filter only unpaid bookings
        const unpaidBookings = (data || []).filter(
          (booking) => booking.payment_status?.toLowerCase() === 'unpaid'
        );
        setPayments(unpaidBookings);
      } else {
        console.error(
          'Failed to fetch settlement data:',
          response.status,
          response.statusText
        );
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching settlement data:', error);
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
      case 'pending':
        return 'warning';
      case 'approved':
        return 'info';
      case 'confirmed':
        return 'info';
      case 'ongoing':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'unpaid':
        return 'error';
      default:
        return 'default';
    }
  };

  // Cancel booking
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      setActionLoading(true);
      const response = await authenticatedFetch(
        `${API_BASE}/bookings/${selectedBooking.booking_id}/cancel`,
        {
          method: 'PUT',
        }
      );

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
      const response = await authenticatedFetch(
        `${API_BASE}/bookings/${selectedBooking.booking_id}/extend`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ new_end_date: extendDate }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(
          `✅ ${result.message}\n💰 Additional cost: ₱${result.additional_cost?.toLocaleString()}\n📊 New total: ₱${result.new_total?.toLocaleString()}`
        );
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
    const endDate = new Date(
      selectedBooking.new_end_date || selectedBooking.end_date
    );
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
          p: { xs: 0.5, sm: 2, md: 3 },
          width: { xs: '100%', md: `calc(100% - 18.7dvw)` },
          ml: {
            xs: '0px',
            sm: '0px',
            md: '18.7dvw',
            lg: '18.7dvw',
          },
          '@media (max-width: 1024px)': {
            ml: '0px',
          },
          mt: { xs: '74px', sm: '74px', md: '64px', lg: '64px' },
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        <title>My Bookings</title>

        {/* Page Header */}
        <Box sx={{ mb: { xs: 2, sm: 3 }, px: { xs: 1, sm: 0 } }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                color: '#c10007',
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
              }}
            >
              My Bookings
            </Typography>
            {/* Refresh Button - Fixed Upper Right */}
            <Button
              variant="outlined"
              startIcon={<HiRefresh />}
              onClick={fetchBookings}
              disabled={loading}
              size="small"
              sx={{
                borderColor: '#c10007',
                color: '#c10007',
                backgroundColor: 'white',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                '&:hover': {
                  borderColor: '#a50006',
                  backgroundColor: '#fff5f5',
                },
              }}
            >
              Refresh
            </Button>
          </Box>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Manage your car rental bookings and track payment history
          </Typography>
        </Box>

        {/* Tabs */}
        <Box
          sx={{ borderBottom: 1, borderColor: 'divider', px: { xs: 1, sm: 0 } }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: { xs: '0.775rem', sm: '.9rem' },
                minWidth: { xs: 100, sm: 120 },
                padding: { xs: '6px 8px', sm: '12px 16px' },
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
          {/* MY BOOKINGS TAB - HORIZONTAL LAYOUT */}
          {bookings.filter(
            (b) => b.booking_status?.toLowerCase() !== 'cancelled'
          ).length === 0 && !loading ? (
            <Card sx={{ p: 4, textAlign: 'center', mx: { xs: 1, sm: 0 } }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No bookings found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You haven't made any car rental bookings yet.
              </Typography>
            </Card>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 0.75, sm: 1 },
                px: { xs: 0.5, sm: 0 },
              }}
            >
              {bookings
                .filter(
                  (booking) =>
                    booking.booking_status?.toLowerCase() !== 'cancelled'
                )
                .map((booking) => {
                  // Determine the status message based on pending requests
                  let statusMessage = '';
                  if (booking.isCancel) {
                    statusMessage = 'Pending Cancellation';
                  } else if (booking.isExtend) {
                    statusMessage = 'Pending Extension';
                  } else if (
                    booking.isPay &&
                    booking.payment_status?.toLowerCase() !== 'paid'
                  ) {
                    statusMessage = 'Pending Payment';
                  }

                  return (
                    <Card
                      key={booking.booking_id}
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        border: '1px solid #e0e0e0',
                        position: 'relative',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(193, 0, 7, 0.1)',
                          borderColor: '#c10007',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {/* Status Badge on top-right corner */}
                      {statusMessage && (
                        <Chip
                          label={statusMessage}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            backgroundColor: '#c10007',
                            color: 'white',
                            fontWeight: 'bold',
                            zIndex: 1,
                          }}
                        />
                      )}

                      {/* Car Image - Left Side / Top on Mobile */}
                      <CardMedia
                        component="div"
                        sx={{
                          width: { xs: '100%', sm: 120 },
                          height: { xs: 160, sm: 'auto' },
                          minWidth: { xs: 'auto', sm: 120 },
                          backgroundColor: '#f5f5f5',
                          backgroundImage: booking.car_details.image_url
                            ? `url(${booking.car_details.image_url})`
                            : 'none',
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {!booking.car_details.image_url && (
                          <Typography variant="caption" color="text.secondary">
                            No Image
                          </Typography>
                        )}
                      </CardMedia>

                      {/* Content - Right Side / Bottom on Mobile */}
                      <Box
                        sx={{
                          display: 'flex',
                          flexGrow: 1,
                          flexDirection: 'column',
                        }}
                      >
                        <CardContent
                          sx={{ flex: '1 0 auto', p: { xs: 1.5, sm: 2 } }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              mb: 1.5,
                              pr: { xs: 5, sm: 0 },
                            }}
                          >
                            <Box>
                              {/* Car Name */}
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 'bold',
                                  mb: 0.5,
                                  fontSize: { xs: '1rem', sm: '1.25rem' },
                                }}
                              >
                                {booking.car_details.display_name}
                              </Typography>

                              {/* Plate Number */}
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                }}
                              >
                                Plate: {booking.car_details.license_plate}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Booking Details in Row */}
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: { xs: 0.3, md: 0.75 },
                              mb: 1.5,
                            }}
                          >
                            {/* Date Range */}
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              <HiCalendar
                                size={16}
                                style={{ color: '#c10007', flexShrink: 0 }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                }}
                              >
                                {formatPhilippineDate(booking.start_date, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}{' '}
                                -{' '}
                                {formatPhilippineDate(booking.end_date, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </Typography>
                            </Box>

                            {/* Time Range */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              {/* Pickup Time */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                <HiClock
                                  size={16}
                                  style={{ color: '#c10007', flexShrink: 0 }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                  }}
                                >
                                  Pickup Time:{' '}
                                  {parseAndFormatTime(booking.pickup_time)}
                                </Typography>
                              </Box>
                              <Typography variant="body2"> - </Typography>
                              {/* Drop-off Time */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                <HiClock
                                  size={16}
                                  style={{ color: '#c10007', flexShrink: 0 }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                  }}
                                >
                                  Drop-off Time:{' '}
                                  {parseAndFormatTime(booking.dropoff_time)}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Location */}
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              <HiLocationMarker
                                size={16}
                                style={{ color: '#c10007', flexShrink: 0 }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                }}
                              >
                                {booking.pickup_loc ||
                                  'JA Car Rental Office - 123 Main Street, Business District, City'}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Total Amount */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              mb: 2,
                            }}
                          >
                            <HiCurrencyDollar
                              size={16}
                              style={{ color: '#c10007' }}
                            />
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 'bold',
                                color: '#c10007',
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                              }}
                            >
                              Total: ₱{booking.total_amount?.toLocaleString()}
                            </Typography>
                          </Box>

                          <Divider sx={{ mb: 2 }} />

                          {/* Action Buttons */}
                          <Box
                            sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
                          >
                            {/* Edit Button - Only for pending bookings without pending actions */}
                            {booking.booking_status?.toLowerCase() ===
                              'pending' &&
                              !booking.isCancel &&
                              !booking.isExtend && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<HiPencil size={16} />}
                                  sx={{
                                    borderColor: '#2196f3',
                                    color: '#2196f3',
                                    fontSize: {
                                      xs: '0.75rem',
                                      sm: '0.875rem',
                                    },
                                    '&:hover': {
                                      backgroundColor: '#e3f2fd',
                                    },
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
                            {(booking.booking_status?.toLowerCase() ===
                              'pending' ||
                              booking.booking_status?.toLowerCase() ===
                                'confirmed') &&
                              !booking.isCancel && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<HiX size={16} />}
                                  sx={{
                                    borderColor: '#f44336',
                                    color: '#f44336',
                                    fontSize: {
                                      xs: '0.75rem',
                                      sm: '0.875rem',
                                    },
                                    '&:hover': {
                                      backgroundColor: '#ffebee',
                                    },
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
                            {booking.booking_status?.toLowerCase() ===
                              'in progress' &&
                              !booking.isExtend && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<HiPlus size={16} />}
                                  sx={{
                                    borderColor: '#4caf50',
                                    color: '#4caf50',
                                    fontSize: {
                                      xs: '0.75rem',
                                      sm: '0.875rem',
                                    },
                                    '&:hover': {
                                      backgroundColor: '#e8f5e9',
                                    },
                                  }}
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setShowExtendDialog(true);
                                  }}
                                >
                                  Extend
                                </Button>
                              )}
                          </Box>
                        </CardContent>
                      </Box>
                    </Card>
                  );
                })}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* SETTLEMENT TAB - HORIZONTAL LAYOUT WITHOUT IMAGE */}
          {payments.filter(
            (b) => b.booking_status?.toLowerCase() !== 'cancelled'
          ).length === 0 && !loading ? (
            <Card sx={{ p: 4, textAlign: 'center', mx: { xs: 1, sm: 0 } }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No unpaid bookings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You have no outstanding payments at this time.
              </Typography>
            </Card>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 1, sm: 2 },
                px: { xs: 0.5, sm: 0 },
              }}
            >
              {payments
                .filter(
                  (booking) =>
                    booking.booking_status?.toLowerCase() !== 'cancelled'
                )
                .map((booking) => (
                  <Card
                    key={booking.booking_id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      border: '1px solid #e0e0e0',
                      position: 'relative',
                      width: '100%',
                      borderRadius: { xs: 0, sm: 1 },
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(193, 0, 7, 0.1)',
                        borderColor: '#c10007',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {/* Pay Now Button - Fixed Upper Right */}
                    <Button
                      size="small"
                      variant="contained"
                      sx={{
                        position: 'absolute',
                        top: { xs: 8, sm: 12 },
                        right: { xs: 8, sm: 12 },
                        zIndex: 10,
                        backgroundColor: '#c10007',
                        color: 'white',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        padding: { xs: '4px 12px', sm: '6px 16px' },
                        '&:hover': {
                          backgroundColor: '#a50006',
                        },
                      }}
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowPaymentDialog(true);
                      }}
                    >
                      Pay Now
                    </Button>

                    {/* Content - Full Width (No Image) */}
                    <Box
                      sx={{
                        display: 'flex',
                        direction: 'column',
                        flexGrow: 1,
                        ml: { xs: 0.5, sm: 1 },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          flexGrow: 1,
                          flexDirection: 'column',
                        }}
                      >
                        <CardContent sx={{ flex: '1', p: { xs: 0.5, sm: 1 } }}>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: { xs: 'column', sm: 'row' },
                              justifyContent: 'space-between',
                              alignItems: { xs: 'flex-start', sm: 'center' },
                              gap: { xs: 1, sm: 0 },
                              mb: 1.5,
                              pr: { xs: 10, sm: 12 },
                            }}
                          >
                            <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                              {/* Payment Title */}
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 'bold',
                                  mb: 0.5,
                                  fontSize: { xs: '1rem', sm: '1.25rem' },
                                }}
                              >
                                Payment for {booking.car_details.display_name}
                              </Typography>

                              {/* Plate Number */}
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                }}
                              >
                                Plate: {booking.car_details.license_plate}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Booking Details in Row */}
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: { xs: 0.3, md: 0.75 },
                              mb: 1,
                            }}
                          >
                            {/* Date Range */}
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              <HiCalendar
                                size={16}
                                style={{ color: '#c10007', flexShrink: 0 }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                }}
                              >
                                {formatPhilippineDate(booking.start_date, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}{' '}
                                -{' '}
                                {formatPhilippineDate(booking.end_date, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </Typography>
                            </Box>

                            {/* Time Range */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              {/* Pickup Time */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                <HiClock
                                  size={16}
                                  style={{ color: '#c10007', flexShrink: 0 }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                  }}
                                >
                                  Pickup Time:{' '}
                                  {parseAndFormatTime(booking.pickup_time)}
                                </Typography>
                              </Box>
                              <Typography variant="body2"> - </Typography>
                              {/* Drop-off Time */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                <HiClock
                                  size={16}
                                  style={{ color: '#c10007', flexShrink: 0 }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                  }}
                                >
                                  Drop-off Time:{' '}
                                  {parseAndFormatTime(booking.dropoff_time)}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Location */}
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              <HiLocationMarker
                                size={16}
                                style={{ color: '#c10007', flexShrink: 0 }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                }}
                              >
                                {booking.pickup_loc ||
                                  'JA Car Rental Office - 123 Main Street, Business District, City'}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Balance/Unpaid Status */}
                          {booking.balance > 0 && (
                            <Box
                              sx={{
                                width: 'fit-content',
                                p: { xs: 0.8, sm: 1 },
                                backgroundColor: '#ffebee',
                                borderRadius: 1,
                                border: '1px solid #f44336',
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 'bold',
                                  color: '#d32f2f',
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                }}
                              >
                                Outstanding Balance: ₱
                                {booking.balance?.toLocaleString()}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Box>
                    </Box>
                  </Card>
                ))}
            </Box>
          )}
        </TabPanel>

        {/* Cancel Booking Dialog */}
        <Dialog
          open={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          maxWidth="sm"
          fullWidth
        >
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
                  {formatPhilippineDate(selectedBooking.start_date, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  -{' '}
                  {formatPhilippineDate(selectedBooking.end_date, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Amount: ₱
                  {selectedBooking.total_amount?.toLocaleString()}
                </Typography>
              </Box>
            )}
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              Note: Cancellation policies may apply. Please check your booking
              terms.
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
              {actionLoading ? (
                <CircularProgress size={20} />
              ) : (
                'Cancel Booking'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Extend Booking Dialog */}
        <Dialog
          open={showExtendDialog}
          onClose={() => setShowExtendDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: '#c10007', fontWeight: 'bold' }}>
            Extend Booking
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Extend your rental period for:
            </Typography>
            {selectedBooking && (
              <Box
                sx={{
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1,
                  mb: 3,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {selectedBooking.car_details.display_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current End Date:{' '}
                  {formatPhilippineDate(
                    selectedBooking.new_end_date || selectedBooking.end_date,
                    { month: 'long', day: 'numeric', year: 'numeric' }
                  )}
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
            <Button onClick={() => setShowExtendDialog(false)}>Cancel</Button>
            <Button
              onClick={handleExtendBooking}
              color="primary"
              variant="contained"
              disabled={actionLoading || !extendDate}
              sx={{
                backgroundColor: '#c10007',
                '&:hover': { backgroundColor: '#a50006' },
              }}
            >
              {actionLoading ? (
                <CircularProgress size={20} />
              ) : (
                'Extend Booking'
              )}
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
