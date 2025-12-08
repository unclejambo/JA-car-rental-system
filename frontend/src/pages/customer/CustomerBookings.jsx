import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CustomerSideBar from '../../ui/components/CustomerSideBar';
import Header from '../../ui/components/Header';
import SearchBar from '../../ui/components/SearchBar';
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
  DialogContentText,
  DialogActions,
  TextField,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Snackbar,
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
  HiBookOpen,
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
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Check URL parameter for initial tab
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'settlement') return 1; // Settlement is index 1
    return 0; // Default to My Bookings
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [bookings, setBookings] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCancelExtensionDialog, setShowCancelExtensionDialog] =
    useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [extendDate, setExtendDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Snackbar state for notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Search states
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');

  const { logout } = useAuth();
  const API_BASE = getApiBase();
  const authenticatedFetch = React.useMemo(
    () => createAuthenticatedFetch(logout),
    [logout]
  );

  // Show snackbar message
  const showMessage = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Fetch customer's bookings and payments
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await authenticatedFetch(
        `${API_BASE}/bookings/my-bookings/list?pageSize=100`
      );

      if (response.ok) {
        const response_data = await response.json();

        // Handle paginated response - extract data array
        const data = Array.isArray(response_data)
          ? response_data
          : response_data.data || [];

        // Filter to show only pending, confirmed, and in progress bookings
        // Exclude completed and cancelled bookings
        const activeBookings = (data || []).filter((booking) => {
          const status = booking.booking_status?.toLowerCase();
          return (
            status === 'pending' ||
            status === 'confirmed' ||
            status === 'in progress' ||
            status === 'ongoing'
          );
        });
        setBookings(activeBookings);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load bookings');
      }
    } catch (error) {
      setError('Error connecting to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer's payment history - Now fetches unpaid bookings and pending payment verification
  const fetchPayments = async () => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/bookings/my-bookings/list?pageSize=100`
      );

      if (response.ok) {
        const response_data = await response.json();

        // Handle paginated response - extract data array
        const data = Array.isArray(response_data)
          ? response_data
          : response_data.data || [];

        // Filter unpaid bookings OR bookings with pending payment verification (isPay = true)
        const unpaidBookings = (data || []).filter(
          (booking) =>
            booking.booking_status?.toLowerCase() !== 'cancelled' &&
            (booking.payment_status?.toLowerCase() === 'unpaid' ||
              booking.isPay === true)
        );
        setPayments(unpaidBookings);
      } else {
        setPayments([]);
      }
    } catch (error) {
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
        // Only show alert if there's an error, not for successful cancellation requests
        if (!result.pending_approval && result.error) {
          alert(`❌ ${result.error}`);
        }
        fetchBookings(); // Refresh the list
        setShowCancelDialog(false);
        setSelectedBooking(null);
      } else {
        const errorData = await response.json();
        alert(`❌ ${errorData.error}`);
      }
    } catch (error) {
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
  const handlePaymentSuccess = (result) => {
    fetchBookings();
    fetchPayments();
    setShowPaymentDialog(false);
    setSelectedBooking(null);

    // Show success message via snackbar if provided
    if (result?.successMessage) {
      showMessage(result.successMessage, 'success');
    } else {
      showMessage('Payment processed successfully!', 'success');
    }
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

        // Show success message with booking details
        showMessage(
          `Extension request submitted successfully! Additional cost: ₱${result.additional_cost?.toLocaleString()} | New total: ₱${result.new_total?.toLocaleString()}`,
          'success'
        );

        fetchBookings(); // Refresh the list
        setShowExtendDialog(false);
        setSelectedBooking(null);
        setExtendDate('');
      } else {
        const errorData = await response.json();
        showMessage(errorData.error || 'Failed to extend booking', 'error');
      }
    } catch (error) {
      showMessage('Failed to extend booking. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel extension request
  const handleCancelExtension = async (booking) => {
    // Set selected booking and show confirmation dialog
    setSelectedBooking(booking);
    setShowCancelExtensionDialog(true);
  };

  // Confirm cancel extension
  const confirmCancelExtension = async () => {
    if (!selectedBooking) return;

    try {
      setActionLoading(true);
      setShowCancelExtensionDialog(false);

      const response = await authenticatedFetch(
        `${API_BASE}/bookings/${selectedBooking.booking_id}/cancel-extension`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        const result = await response.json();
        showMessage(
          `Extension request cancelled successfully! Your booking continues until: ${formatPhilippineDate(result.booking.end_date)}`,
          'success'
        );
        fetchBookings(); // Refresh the list
      } else {
        const errorData = await response.json();
        showMessage(
          errorData.error || 'Failed to cancel extension request',
          'error'
        );
      }
    } catch (error) {
      showMessage(
        'Failed to cancel extension request. Please try again.',
        'error'
      );
    } finally {
      setActionLoading(false);
      setSelectedBooking(null);
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

  // Filter bookings based on search query
  const filteredBookings = (bookings || []).filter((booking) => {
    if (!bookingSearchQuery) return true;
    const query = bookingSearchQuery.toLowerCase();
    return (
      booking.booking_id?.toString().includes(query) ||
      booking.car_details?.display_name?.toLowerCase().includes(query) ||
      booking.car_details?.license_plate?.toLowerCase().includes(query) ||
      booking.booking_status?.toLowerCase().includes(query) ||
      booking.pickup_location?.toLowerCase().includes(query) ||
      booking.dropoff_location?.toLowerCase().includes(query)
    );
  });

  // Filter payments based on search query
  const filteredPayments = payments.filter((payment) => {
    if (!paymentSearchQuery) return true;
    const query = paymentSearchQuery.toLowerCase();
    return (
      payment.payment_id?.toString().includes(query) ||
      payment.car_details?.display_name?.toLowerCase().includes(query) ||
      payment.car_details?.license_plate?.toLowerCase().includes(query) ||
      payment.start_date?.toLowerCase().includes(query) ||
      payment.end_date?.toLowerCase().includes(query) ||
      payment.pickup_date?.toLowerCase().includes(query) ||
      payment.dropoff_date?.toLowerCase().includes(query)
    );
  });

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

        {/* Loading Indicator - Initial Load (wrapped in Card) */}
        {loading && bookings === null && (
          <Card
            sx={{
              p: 0,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              backgroundColor: '#fff',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress sx={{ color: '#c10007' }} />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Page Header */}
        {!(loading && bookings === null) && (
          <>
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <HiBookOpen size={32} style={{ color: '#c10007' }} />
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
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                mb: 3,
                display: 'flex',
                justifyContent: 'flex-start',
              }}
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
                <Tab label={`My Bookings (${bookings?.length || 0})`} />
                <Tab
                  label={`Settlement (${
                    payments.filter((booking) => {
                      const status = booking.booking_status?.toLowerCase();
                      return (
                        status === 'pending' ||
                        status === 'confirmed' ||
                        status === 'in progress' ||
                        status === 'ongoing'
                      );
                    }).length
                  })`}
                />
              </Tabs>
            </Box>

            {/* Search Bar - Aligned to the right like Refresh button */}
            <Box
              sx={{
                mt: -1,
                mb: -1,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Box sx={{ width: '100%' }}>
                {activeTab === 0 ? (
                  <SearchBar
                    value={bookingSearchQuery}
                    onChange={(e) => setBookingSearchQuery(e.target.value)}
                    placeholder="Search bookings..."
                    fullWidth
                  />
                ) : (
                  <SearchBar
                    value={paymentSearchQuery}
                    onChange={(e) => setPaymentSearchQuery(e.target.value)}
                    placeholder="Search settlements..."
                    fullWidth
                  />
                )}
              </Box>
            </Box>

            {/* Result count below search bar - aligned to the right */}
            {activeTab === 0 && bookingSearchQuery && (
              <Box
                sx={{
                  mb: 2,
                  px: { xs: 1, sm: 0 },
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              ></Box>
            )}
            {activeTab === 1 && paymentSearchQuery && (
              <Box
                sx={{
                  mb: 1,
                  px: { xs: 1, sm: 0 },
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              ></Box>
            )}

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Loading Indicator */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress sx={{ color: '#c10007' }} />
              </Box>
            )}

            {/* Tab Panels */}
            <TabPanel value={activeTab} index={0}>
              {/* MY BOOKINGS TAB - HORIZONTAL LAYOUT */}
              {filteredBookings.filter((b) => {
                const status = b.booking_status?.toLowerCase();
                return (
                  status === 'pending' ||
                  status === 'confirmed' ||
                  status === 'in progress' ||
                  status === 'ongoing'
                );
              }).length === 0 && !loading ? (
                <Card sx={{ p: 4, textAlign: 'center', mx: { xs: 1, sm: 0 } }}>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {bookingSearchQuery
                      ? 'No matching bookings found'
                      : 'No bookings found'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {bookingSearchQuery
                      ? `No bookings found matching "${bookingSearchQuery}". Try a different search term.`
                      : "You haven't made any car rental bookings yet."}
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
                  {filteredBookings
                    .filter((booking) => {
                      const status = booking.booking_status?.toLowerCase();
                      return (
                        status === 'pending' ||
                        status === 'confirmed' ||
                        status === 'in progress' ||
                        status === 'ongoing'
                      );
                    })
                    .map((booking) => {
                      // Determine the status message and color based on pending requests
                      let statusMessage = '';
                      let statusColor = '';

                      if (booking.isCancel) {
                        statusMessage = 'Pending Cancellation';
                        statusColor = '#FFA500'; // Orange
                      } else if (booking.isExtend) {
                        statusMessage = 'Pending Extension';
                        statusColor = '#FFA500'; // Orange
                      } else if (
                        booking.isPay &&
                        booking.payment_status?.toLowerCase() !== 'paid'
                      ) {
                        statusMessage = 'Pending Payment';
                        statusColor = '#FFA500'; // Orange
                      }

                      // Determine booking status badge color
                      let bookingStatusColor = '';
                      const bookingStatus =
                        booking.booking_status?.toLowerCase();

                      switch (bookingStatus) {
                        case 'pending':
                          bookingStatusColor = '#FF9800'; // Orange
                          break;
                        case 'approved':
                        case 'confirmed':
                          bookingStatusColor = '#2196F3'; // Blue
                          break;
                        case 'in progress':
                        case 'ongoing':
                          bookingStatusColor = '#4CAF50'; // Green
                          break;
                        default:
                          bookingStatusColor = '#9E9E9E'; // Grey
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
                          {/* Status Badges on top-right corner */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 10,
                              right: 10,
                              zIndex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.5,
                              alignItems: 'flex-end',
                            }}
                          >
                            {/* Booking Status Badge */}
                            <Chip
                              label={booking.booking_status}
                              size="small"
                              sx={{
                                backgroundColor: bookingStatusColor,
                                color: 'white',
                                fontWeight: 'bold',
                                textTransform: 'capitalize',
                              }}
                            />

                            {/* Pending Action Badge */}
                            {statusMessage && (
                              <Chip
                                label={statusMessage}
                                size="small"
                                sx={{
                                  backgroundColor: statusColor,
                                  color: 'white',
                                  fontWeight: 'bold',
                                }}
                              />
                            )}
                          </Box>

                          {/* Car Image - Left Side / Top on Mobile */}
                          <Box
                            sx={{
                              alignContent: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <CardMedia
                              component="div"
                              sx={{
                                width: '100%',
                                height: { xs: 160, sm: 120 },
                                minWidth: { xs: 'auto', sm: 200 },
                                backgroundColor: '#f5f5f5',
                                backgroundImage: booking.car_details.image_url
                                  ? `url(${booking.car_details.image_url})`
                                  : 'none',
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                                display: 'flex',
                              }}
                            >
                              {!booking.car_details.image_url && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  No Image
                                </Typography>
                              )}
                            </CardMedia>
                          </Box>

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
                                      fontSize: {
                                        xs: '0.75rem',
                                        sm: '0.875rem',
                                      },
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
                                      fontSize: {
                                        xs: '0.75rem',
                                        sm: '0.875rem',
                                      },
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
                                      style={{
                                        color: '#c10007',
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontSize: {
                                          xs: '0.75rem',
                                          sm: '0.875rem',
                                        },
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
                                      style={{
                                        color: '#c10007',
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontSize: {
                                          xs: '0.75rem',
                                          sm: '0.875rem',
                                        },
                                      }}
                                    >
                                      Drop-off Time:{' '}
                                      {parseAndFormatTime(booking.dropoff_time)}
                                    </Typography>
                                  </Box>
                                </Box>

                                {/* Pickup Location */}
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                  }}
                                >
                                  <HiLocationMarker
                                    size={16}
                                    style={{ color: '#4CAF50', flexShrink: 0 }}
                                  />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontSize: {
                                        xs: '0.75rem',
                                        sm: '0.875rem',
                                      },
                                    }}
                                  >
                                    <strong>Pickup:</strong>{' '}
                                    {booking.pickup_loc ||
                                      'JA Car Rental Office'}
                                  </Typography>
                                </Box>

                                {/* Drop-off Location */}
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
                                      fontSize: {
                                        xs: '0.75rem',
                                        sm: '0.875rem',
                                      },
                                    }}
                                  >
                                    <strong>Drop-off:</strong>{' '}
                                    {booking.dropoff_loc ||
                                      'JA Car Rental Office'}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Total Amount */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  mb: 1,
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
                                  Total: ₱
                                  {booking.total_amount?.toLocaleString()}
                                </Typography>
                              </Box>

                              <Divider sx={{ mb: 2 }} />

                              {/* Extension Request Alert */}
                              {booking.isExtend && booking.new_end_date && (
                                <Alert
                                  severity="warning"
                                  sx={{
                                    mb: 2,
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 'bold',
                                      mb: 0.5,
                                      fontSize: {
                                        xs: '0.75rem',
                                        sm: '0.875rem',
                                      },
                                    }}
                                  >
                                    ⏳ Extension Request Pending
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                    }}
                                  >
                                    New End Date:{' '}
                                    {formatPhilippineDate(booking.new_end_date)}
                                  </Typography>
                                  {booking.extension_payment_deadline && (
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontSize: {
                                          xs: '0.7rem',
                                          sm: '0.8rem',
                                        },
                                        color: '#d32f2f',
                                        fontWeight: 'bold',
                                        mt: 0.5,
                                      }}
                                    >
                                      💰 Payment Due:{' '}
                                      {formatPhilippineDateTime(
                                        booking.extension_payment_deadline
                                      )}
                                    </Typography>
                                  )}
                                </Alert>
                              )}

                              {/* Action Buttons */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  gap: 1,
                                  flexWrap: 'wrap',
                                }}
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
                                  !booking.isExtend &&
                                  booking.isExtend !== true &&
                                  booking.isExtend !== 'true' &&
                                  booking.isExtend !== 'TRUE' && (
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

                                {/* Cancel Extension Button - For bookings with pending extension */}
                                {(booking.isExtend === true ||
                                  booking.isExtend === 'true' ||
                                  booking.isExtend === 'TRUE') && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<HiX size={16} />}
                                    sx={{
                                      borderColor: '#ff9800',
                                      color: '#ff9800',
                                      fontSize: {
                                        xs: '0.75rem',
                                        sm: '0.875rem',
                                      },
                                      '&:hover': {
                                        backgroundColor: '#fff3e0',
                                      },
                                    }}
                                    onClick={() =>
                                      handleCancelExtension(booking)
                                    }
                                    disabled={actionLoading}
                                  >
                                    Cancel Extension
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
              {filteredPayments.filter((b) => {
                const status = b.booking_status?.toLowerCase();
                return (
                  status === 'pending' ||
                  status === 'confirmed' ||
                  status === 'in progress' ||
                  status === 'ongoing'
                );
              }).length === 0 && !loading ? (
                <Card sx={{ p: 4, textAlign: 'center', mx: { xs: 1, sm: 0 } }}>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {paymentSearchQuery
                      ? 'No matching payments found'
                      : 'No unpaid bookings'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {paymentSearchQuery
                      ? `No payments found matching "${paymentSearchQuery}". Try a different search term.`
                      : 'You have no outstanding payments at this time.'}
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
                  {filteredPayments
                    .filter((booking) => {
                      const status = booking.booking_status?.toLowerCase();
                      return (
                        status === 'pending' ||
                        status === 'confirmed' ||
                        status === 'in progress' ||
                        status === 'ongoing'
                      );
                    })
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
                        {/* Pay Now / Pending Payment Button - Fixed Upper Right */}
                        {booking.isPay ? (
                          <Chip
                            label="Awaiting Admin Approval"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 10,
                              right: 10,
                              backgroundColor: '#FFA500',
                              color: 'white',
                              fontWeight: 'bold',
                            }}
                          />
                        ) : (
                          <Button
                            size="small"
                            variant="contained"
                            sx={{
                              position: 'absolute',
                              top: { xs: 8, sm: 12 },
                              right: { xs: 8, sm: 12 },
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
                        )}

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
                            <CardContent
                              sx={{ flex: '1', p: { xs: 0.5, sm: 1 } }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: { xs: 'column', sm: 'row' },
                                  justifyContent: 'space-between',
                                  alignItems: {
                                    xs: 'flex-start',
                                    sm: 'center',
                                  },
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
                                    Payment for{' '}
                                    {booking.car_details.display_name}
                                  </Typography>

                                  {/* Plate Number */}
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      fontSize: {
                                        xs: '0.75rem',
                                        sm: '0.875rem',
                                      },
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
                                      fontSize: {
                                        xs: '0.75rem',
                                        sm: '0.875rem',
                                      },
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
                                      style={{
                                        color: '#c10007',
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontSize: {
                                          xs: '0.75rem',
                                          sm: '0.875rem',
                                        },
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
                                      style={{
                                        color: '#c10007',
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontSize: {
                                          xs: '0.75rem',
                                          sm: '0.875rem',
                                        },
                                      }}
                                    >
                                      Drop-off Time:{' '}
                                      {parseAndFormatTime(booking.dropoff_time)}
                                    </Typography>
                                  </Box>
                                </Box>

                                {/* Pickup Location */}
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                  }}
                                >
                                  <HiLocationMarker
                                    size={16}
                                    style={{ color: '#4CAF50', flexShrink: 0 }}
                                  />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontSize: {
                                        xs: '0.75rem',
                                        sm: '0.875rem',
                                      },
                                    }}
                                  >
                                    <strong>Pickup:</strong>{' '}
                                    {booking.pickup_loc ||
                                      'JA Car Rental Office'}
                                  </Typography>
                                </Box>

                                {/* Drop-off Location */}
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
                                      fontSize: {
                                        xs: '0.75rem',
                                        sm: '0.875rem',
                                      },
                                    }}
                                  >
                                    <strong>Drop-off:</strong>{' '}
                                    {booking.dropoff_loc ||
                                      'JA Car Rental Office'}
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
                                      fontSize: {
                                        xs: '0.75rem',
                                        sm: '0.875rem',
                                      },
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
                  <Box
                    sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}
                  >
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
                  Note: Cancellation policies may apply. Please check your
                  booking terms.
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
                        selectedBooking.new_end_date ||
                          selectedBooking.end_date,
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
                <Button onClick={() => setShowExtendDialog(false)}>
                  Cancel
                </Button>
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
          </>
        )}
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

      {/* Cancel Extension Confirmation Dialog */}
      <Dialog
        open={showCancelExtensionDialog}
        onClose={() => setShowCancelExtensionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#c10007' }}>
          Cancel Extension Request?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your extension request? Your booking
            will continue with the original end date.
          </DialogContentText>
          {selectedBooking && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Booking ID:</strong> {selectedBooking.booking_id}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Current End Date:</strong>{' '}
                {formatPhilippineDate(selectedBooking.end_date)}
              </Typography>
              {selectedBooking.new_end_date && (
                <Typography variant="body2" sx={{ color: '#d32f2f' }}>
                  <strong>Requested End Date (will be cancelled):</strong>{' '}
                  {formatPhilippineDate(selectedBooking.new_end_date)}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowCancelExtensionDialog(false)}
            disabled={actionLoading}
          >
            No, Keep It
          </Button>
          <Button
            onClick={confirmCancelExtension}
            color="error"
            variant="contained"
            disabled={actionLoading}
            sx={{
              backgroundColor: '#c10007',
              '&:hover': { backgroundColor: '#a50006' },
            }}
          >
            {actionLoading ? (
              <CircularProgress size={20} />
            ) : (
              'Yes, Cancel Extension'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default CustomerBookings;
