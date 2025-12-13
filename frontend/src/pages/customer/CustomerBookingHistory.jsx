import React, { useState, useEffect } from 'react';
import CustomerSideBar from '../../ui/components/CustomerSideBar';
import Header from '../../ui/components/Header';
import SearchBar from '../../ui/components/SearchBar';
import '../../styles/customercss/customerdashboard.css';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Paper,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import { HiRefresh } from 'react-icons/hi';
import {
  HiOutlineClipboardDocumentCheck,
  HiCreditCard,
  HiCalendarDays,
  HiClock,
  HiTruck,
  HiCheckCircle,
  HiXCircle,
  HiCurrencyDollar,
  HiEye,
  HiReceiptPercent,
  HiDocumentText,
} from 'react-icons/hi2';
import Loading from '../../ui/components/Loading';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api';
import CustomerPaymentHistoryTable from '../../ui/components/table/CustomerPaymentHistoryTable';
import BookingDetailsModal from '../../ui/components/modal/BookingDetailsModal';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`history-tabpanel-${index}`}
      aria-labelledby={`history-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, message }) {
  return (
    <Card
      sx={{
        textAlign: 'center',
        py: 6,
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        borderRadius: 2,
        backgroundColor: '#fafafa',
      }}
    >
      <CardContent>
        <Icon size={48} style={{ color: '#c10007', marginBottom: '12px' }} />
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </CardContent>
    </Card>
  );
}

// Booking Card Component
function BookingCard({ booking, onViewBooking }) {
  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDayOfWeek = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };

  const getMonthDay = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.getDate();
  };

  const isCompleted = booking.booking_status === 'Completed';
  const isCancelled = booking.booking_status === 'Cancelled';
  const statusColor = isCompleted
    ? '#4caf50'
    : isCancelled
      ? '#f44336'
      : '#757575';
  const statusBg = isCompleted
    ? '#e8f5e9'
    : isCancelled
      ? '#ffebee'
      : '#f5f5f5';

  const displayDate = isCompleted
    ? booking.completion_date || booking.booking_date
    : isCancelled
      ? booking.cancellation_date || booking.booking_date
      : booking.booking_date;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2.5,
        mb: 2,
        borderRadius: 3,
        border: `2px solid ${statusColor}`,
        backgroundColor: '#fff',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(193, 0, 7, 0.15)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        {/* Date Badge */}
        <Box
          sx={{
            minWidth: { xs: '100%', lg: 120 },
            display: 'flex',
            flexDirection: { xs: 'row', lg: 'column' },
            alignItems: 'center',
            justifyContent: { xs: 'space-between', lg: 'center' },
            gap: { xs: 2, lg: 1.5 },
          }}
        >
          <Box
            sx={{
              width: { xs: 80, lg: 100 },
              height: { xs: 80, lg: 100 },
              borderRadius: 2,
              background: `linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: `0 4px 12px ${statusColor}50`,
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.9 }}
            >
              {getDayOfWeek(displayDate)}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
              {getMonthDay(displayDate)}
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontSize: '0.65rem', opacity: 0.9 }}
            >
              {displayDate
                ? new Date(displayDate).toLocaleDateString('en-US', {
                    month: 'short',
                  })
                : ''}
            </Typography>
          </Box>

          <Chip
            label={booking.booking_status}
            icon={
              isCompleted ? (
                <HiCheckCircle size={16} />
              ) : isCancelled ? (
                <HiXCircle size={16} />
              ) : null
            }
            sx={{
              bgcolor: statusBg,
              color: statusColor,
              fontWeight: 600,
              fontSize: '0.75rem',
              border: `1px solid ${statusColor}`,
              height: 28,
            }}
          />
        </Box>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ display: { xs: 'none', lg: 'block' } }}
        />

        {/* Details Section */}
        <Box sx={{ flex: 1 }}>
          <Stack spacing={2}>
            {/* Car Model & Booking Date */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ flex: 1 }}
              >
                <HiTruck size={20} color="#c10007" />
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: '#666', fontSize: '0.7rem' }}
                  >
                    Vehicle
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {booking.car_model || 'N/A'}
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ flex: 1 }}
              >
                <HiCalendarDays size={20} color="#666" />
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: '#666', fontSize: '0.7rem' }}
                  >
                    Booked On
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatDate(booking.booking_date)}
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            {/* Completion/Cancellation Date & Amount */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {isCompleted && booking.completion_date && (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ flex: 1 }}
                >
                  <HiCheckCircle size={20} color="#4caf50" />
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: '#666', fontSize: '0.7rem' }}
                    >
                      Completed On
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatDate(booking.completion_date)}
                    </Typography>
                  </Box>
                </Stack>
              )}

              {isCancelled && (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ flex: 1 }}
                >
                  <HiXCircle size={20} color="#f44336" />
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: '#666', fontSize: '0.7rem' }}
                    >
                      Cancelled On
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatDate(
                        booking.cancellation_date || booking.booking_date
                      )}
                    </Typography>
                  </Box>
                </Stack>
              )}

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ flex: 1 }}
              >
                <HiCurrencyDollar size={20} color="#666" />
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: '#666', fontSize: '0.7rem' }}
                  >
                    Amount
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ₱
                    {booking.amount
                      ? Number(booking.amount).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : '0.00'}
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            {/* View Details Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<HiEye />}
                onClick={() => onViewBooking(booking)}
                sx={{
                  borderColor: '#c10007',
                  color: '#c10007',
                  '&:hover': {
                    borderColor: '#a50006',
                    backgroundColor: '#fff5f5',
                  },
                }}
              >
                View Details
              </Button>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

// Payment Card Component
function PaymentCard({ payment }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDayOfWeek = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };

  const getMonthDay = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    return d.getDate();
  };

  const getPaymentMethodColor = (method) => {
    const methodLower = (method || '').toLowerCase();
    if (methodLower.includes('gcash')) return '#007dfe';
    if (methodLower.includes('cash')) return '#4caf50';
    if (methodLower.includes('bank')) return '#ff9800';
    return '#757575';
  };

  const methodColor = getPaymentMethodColor(payment.paymentMethod);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2.5,
        mb: 2,
        borderRadius: 3,
        border: `2px solid ${methodColor}`,
        backgroundColor: '#fff',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(193, 0, 7, 0.15)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        {/* Date Badge */}
        <Box
          sx={{
            minWidth: { xs: '100%', lg: 120 },
            display: 'flex',
            flexDirection: { xs: 'row', lg: 'column' },
            alignItems: 'center',
            justifyContent: { xs: 'space-between', lg: 'center' },
            gap: { xs: 2, lg: 1.5 },
          }}
        >
          <Box
            sx={{
              width: { xs: 80, lg: 100 },
              height: { xs: 80, lg: 100 },
              borderRadius: 2,
              background: `linear-gradient(135deg, ${methodColor} 0%, ${methodColor}dd 100%)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: `0 4px 12px ${methodColor}50`,
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.9 }}
            >
              {getDayOfWeek(payment.paidDate)}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
              {getMonthDay(payment.paidDate)}
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontSize: '0.65rem', opacity: 0.9 }}
            >
              {payment.paidDate
                ? new Date(payment.paidDate).toLocaleDateString('en-US', {
                    month: 'short',
                  })
                : ''}
            </Typography>
          </Box>

          <Chip
            label={payment.paymentMethod || 'N/A'}
            icon={<HiCreditCard size={16} />}
            sx={{
              bgcolor: `${methodColor}20`,
              color: methodColor,
              fontWeight: 600,
              fontSize: '0.75rem',
              border: `1px solid ${methodColor}`,
              height: 28,
            }}
          />
        </Box>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ display: { xs: 'none', lg: 'block' } }}
        />

        {/* Details Section */}
        <Box sx={{ flex: 1 }}>
          <Stack spacing={2}>
            {/* Transaction ID & Date */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ flex: 1 }}
              >
                <HiReceiptPercent size={20} color="#c10007" />
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: '#666', fontSize: '0.7rem' }}
                  >
                    Transaction ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    #{payment.transactionId || 'N/A'}
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ flex: 1 }}
              >
                <HiCalendarDays size={20} color="#666" />
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: '#666', fontSize: '0.7rem' }}
                  >
                    Payment Date
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatDate(payment.paidDate)}
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            {/* Description */}
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <HiDocumentText
                size={20}
                color="#666"
                style={{ marginTop: '2px' }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{ color: '#666', fontSize: '0.7rem' }}
                >
                  Description
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {payment.description || 'N/A'}
                </Typography>
              </Box>
            </Stack>

            {/* Reference No & Amount */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {payment.referenceNo && (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ flex: 1 }}
                >
                  <HiDocumentText size={20} color="#666" />
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: '#666', fontSize: '0.7rem' }}
                    >
                      Reference No
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {payment.referenceNo}
                    </Typography>
                  </Box>
                </Stack>
              )}

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ flex: 1 }}
              >
                <HiCurrencyDollar size={20} color="#4caf50" />
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: '#666', fontSize: '0.7rem' }}
                  >
                    Amount Paid
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: '#4caf50',
                    }}
                  >
                    ₱
                    {payment.totalAmount
                      ? Number(payment.totalAmount).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : '0.00'}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

function CustomerBookingHistory() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bookings, setBookings] = useState(null);
  const [payments, setPayments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search states
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');

  // Modal states
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [activeTab, setActiveTab] = useState(
    parseInt(localStorage.getItem('customerSettingsTab') || '0', 10)
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    localStorage.setItem('customerSettingsTab', newValue.toString());
  };

  const API_BASE = getApiBase().replace(/\/$/, '');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError('');

    const authFetch = createAuthenticatedFetch(() => {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    });

    try {
      const resBookings = await authFetch(
        `${API_BASE}/bookings/my-bookings/list`,
        {
          headers: { Accept: 'application/json' },
        }
      );
      const resPayments = await authFetch(`${API_BASE}/payments/my-payments`, {
        headers: { Accept: 'application/json' },
      });
      const resTransactions = await authFetch(
        `${API_BASE}/transactions/my-transactions`,
        {
          headers: { Accept: 'application/json' },
        }
      );

      if (
        resBookings.status === 401 ||
        resPayments.status === 401 ||
        resTransactions.status === 401
      ) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }

      if (!resBookings.ok || !resPayments.ok || !resTransactions.ok) {
        throw new Error(
          'Failed to fetch booking, payment, or transaction history'
        );
      }

      const responseBookings = await resBookings.json();
      const responsePayments = await resPayments.json();
      const responseTransactions = await resTransactions.json();

      // Handle paginated responses - extract data arrays
      const dataBookings = Array.isArray(responseBookings)
        ? responseBookings
        : responseBookings.data || [];
      const dataPayments = Array.isArray(responsePayments)
        ? responsePayments
        : responsePayments.data || [];
      const dataTransactions = Array.isArray(responseTransactions)
        ? responseTransactions
        : responseTransactions.data || [];

      // Create a map of transactions by booking_id for easy lookup
      const transactionMap = {};
      if (Array.isArray(dataTransactions)) {
        dataTransactions.forEach((t) => {
          if (!transactionMap[t.bookingId]) {
            transactionMap[t.bookingId] = t;
          }
        });
      }

      // Map backend booking data to table row shape and merge with transaction data
      // Filter only Completed and Cancelled bookings
      const mappedBookings = Array.isArray(dataBookings)
        ? dataBookings
            .filter(
              (b) =>
                b.booking_status === 'Completed' ||
                b.booking_status === 'Cancelled'
            )
            .map((b) => {
              const transaction = transactionMap[b.booking_id];
              // Construct car model from car_details
              const carModel = b.car_details
                ? b.car_details.display_name ||
                  `${b.car_details.make || ''} ${b.car_details.model || ''} ${b.car_details.year ? `(${b.car_details.year})` : ''}`.trim()
                : '';

              // Get driver name from driver_details
              const driverName = b.driver_details?.name || 'No Driver Assigned';

              return {
                booking_id: b.booking_id,
                booking_date: b.booking_date,
                car_model: carModel,
                driver_name: driverName,
                completion_date: transaction?.completionDate || null,
                cancellation_date: transaction?.cancellationDate || null,
                amount: b.total_amount ?? '',
                status: b.has_outstanding_balance ? 'Unpaid' : 'Paid',
                booking_status: b.booking_status,
              };
            })
        : [];

      setBookings(mappedBookings);

      // Map backend payment data to table row shape
      // Filter out descriptions containing 'User Booked the Car'
      const mappedPayments = Array.isArray(dataPayments)
        ? dataPayments
            .filter((p) => {
              const description = p.description || '';
              return !description.toLowerCase().includes('user booked the car');
            })
            .map((p) => {
              const rawDate =
                p.paid_date || p.payment_date || p.created_at || '';
              const dateOnly = rawDate ? rawDate.split('T')[0] : '';
              return {
                transactionId: p.payment_id,
                paidDate: dateOnly,
                description: p.description || '',
                totalAmount: p.amount ?? '',
                paymentMethod: p.payment_method || '',
                referenceNo: p.reference_no || '',
                status: p.balance === 0 ? 'Paid' : 'Unpaid',
              };
            })
        : [];
      setPayments(mappedPayments);
    } catch (err) {
      setError('Failed to load booking/payment history');
      setBookings([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler to view booking details
  const handleViewBooking = async (bookingRow) => {
    try {
      // Fetch full booking details using booking_id
      const authFetch = createAuthenticatedFetch(() => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      });

      const response = await authFetch(
        `${API_BASE}/bookings/my-bookings/list`,
        {
          headers: { Accept: 'application/json' },
        }
      );

      if (response.ok) {
        const response_data = await response.json();
        // Handle paginated response - extract data array
        const allBookings = Array.isArray(response_data)
          ? response_data
          : response_data.data || [];

        const fullBooking = allBookings.find(
          (b) => b.booking_id === bookingRow.booking_id
        );

        if (fullBooking) {
          // Transform car_details object to flat fields for modal compatibility
          const transformedBooking = {
            ...fullBooking,
            car_model:
              fullBooking.car_details?.display_name || fullBooking.car_model,
            car_make: fullBooking.car_details?.make,
            car_year: fullBooking.car_details?.year,
            car_license_plate: fullBooking.car_details?.license_plate,
            car_seats: fullBooking.car_details?.seats,
            car_type: fullBooking.car_details?.type,
            car_rent_price: fullBooking.car_details?.rent_price,
          };
          setSelectedBooking(transformedBooking);
          setShowBookingDetailsModal(true);
        }
      }
    } catch (error) {}
  };

  // Filter bookings based on search query
  const filteredBookings = bookings
    ? bookings.filter((booking) => {
        if (!bookingSearchQuery) return true;
        const query = bookingSearchQuery.toLowerCase();
        return (
          booking.booking_date?.toLowerCase().includes(query) ||
          booking.car_model?.toLowerCase().includes(query) ||
          booking.completion_date?.toLowerCase().includes(query) ||
          booking.cancellation_date?.toLowerCase().includes(query)
        );
      })
    : [];

  // Filter payments based on search query
  const filteredPayments = payments
    ? payments.filter((payment) => {
        if (!paymentSearchQuery) return true;
        const query = paymentSearchQuery.toLowerCase();
        return (
          payment.transactionId?.toString().includes(query) ||
          payment.description?.toLowerCase().includes(query) ||
          payment.paymentMethod?.toLowerCase().includes(query) ||
          payment.referenceNo?.toLowerCase().includes(query) ||
          payment.status?.toLowerCase().includes(query)
        );
      })
    : [];

  return (
    <Box sx={{ display: 'flex' }}>
      <title>Booking History</title>
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
          ml: { xs: '0px', sm: '0px', md: '18.7dvw' },
          '@media (max-width: 1024px)': {
            ml: '0px',
          },
          mt: { xs: '64px', sm: '64px', md: '56px' },
          border: 'none',
          boxShadow: 'none',
        }}
      >
        <Card
          sx={{
            p: 0,
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            backgroundColor: '#fff',
            // boxShadow: 'none',
          }}
        >
          <CardContent>
            {/* Loading Indicator */}
            {loading && (bookings === null || payments === null) && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress sx={{ color: '#c10007' }} />
              </Box>
            )}

            {/* Page Header */}
            {!(loading && (bookings === null || payments === null)) && (
              <>
                <Box
                  sx={{
                    background:
                      'linear-gradient(135deg, #c10007 0%, #8b0005 100%)',
                    borderRadius: 3,
                    p: { xs: 2, md: 3 },
                    mb: 3,
                    boxShadow: '0 4px 12px rgba(193, 0, 7, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      flex: 1,
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '50%',
                        p: { xs: 1.5, md: 2 },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <HiOutlineClipboardDocumentCheck
                        style={{
                          fontSize: '2rem',
                          color: '#fff',
                        }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                          fontWeight: 700,
                          color: '#fff',
                          fontSize: {
                            xs: '1.25rem',
                            sm: '1.5rem',
                            md: '1.75rem',
                          },
                          mb: 0.5,
                        }}
                      >
                        Booking History
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: { xs: '0.875rem', md: '1rem' },
                        }}
                      >
                        View your past bookings and payments
                      </Typography>
                    </Box>
                  </Box>
                  {/* Refresh Button */}
                  <Button
                    variant="outlined"
                    startIcon={<HiRefresh />}
                    onClick={fetchData}
                    disabled={loading}
                    sx={{
                      borderColor: '#fff',
                      color: '#fff',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '&:hover': {
                        borderColor: '#fff',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      },
                    }}
                  >
                    Refresh
                  </Button>
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
                      alignItems: 'flex-start',
                      '& .MuiTabs-flexContainer': {
                        justifyContent: 'flex-start',
                      },
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
                    <Tab
                      label={`Bookings (${bookings?.length || 0})`}
                      icon={<HiOutlineClipboardDocumentCheck />}
                      iconPosition="start"
                    />
                    <Tab
                      label={`Payments (${payments?.length || 0})`}
                      icon={<HiCreditCard />}
                      iconPosition="start"
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
                        placeholder="Search payments..."
                        fullWidth
                      />
                    )}
                  </Box>
                </Box>

                {/* Result count below search bar - aligned to the right */}
                {activeTab === 0 && bookingSearchQuery && (
                  <Box
                    sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}
                  ></Box>
                )}
                {activeTab === 1 && paymentSearchQuery && (
                  <Box
                    sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}
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
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', py: 3 }}
                  >
                    <CircularProgress sx={{ color: '#c10007' }} />
                  </Box>
                )}

                {/* Tab Panels */}
                <TabPanel value={activeTab} index={0}>
                  {filteredBookings && filteredBookings.length > 0 ? (
                    <Box>
                      {filteredBookings.map((booking) => (
                        <BookingCard
                          key={booking.booking_id}
                          booking={booking}
                          onViewBooking={handleViewBooking}
                        />
                      ))}
                    </Box>
                  ) : bookingSearchQuery ? (
                    <EmptyState
                      icon={HiOutlineClipboardDocumentCheck}
                      title="No Matching Bookings"
                      message={`No bookings found matching "${bookingSearchQuery}". Try a different search term.`}
                    />
                  ) : (
                    <EmptyState
                      icon={HiOutlineClipboardDocumentCheck}
                      title="No Bookings Found"
                      message="You haven't made any bookings yet."
                    />
                  )}
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                  {filteredPayments && filteredPayments.length > 0 ? (
                    <Box>
                      {filteredPayments.map((payment) => (
                        <PaymentCard
                          key={payment.transactionId}
                          payment={payment}
                        />
                      ))}
                    </Box>
                  ) : paymentSearchQuery ? (
                    <EmptyState
                      icon={HiCreditCard}
                      title="No Matching Payments"
                      message={`No payments found matching "${paymentSearchQuery}". Try a different search term.`}
                    />
                  ) : (
                    <EmptyState
                      icon={HiCreditCard}
                      title="No Payments Found"
                      message="You haven't made any payments yet."
                    />
                  )}
                </TabPanel>
              </>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        open={showBookingDetailsModal}
        onClose={() => {
          setShowBookingDetailsModal(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onPaymentSuccess={fetchData}
      />
    </Box>
  );
}

export default CustomerBookingHistory;
