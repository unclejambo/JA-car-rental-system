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
} from '@mui/material';
import { HiRefresh } from 'react-icons/hi';
import { HiOutlineClipboardDocumentCheck, HiCreditCard } from 'react-icons/hi2';
import Loading from '../../ui/components/Loading';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api';
import CustomerBookingHistoryTable from '../../ui/components/table/CustomerBookingHistoryTable';
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
            car_model: fullBooking.car_details?.display_name || fullBooking.car_model,
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
                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                        fontWeight: 'bold',
                        color: '#c10007',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <HiOutlineClipboardDocumentCheck
                        size={24}
                        style={{ marginRight: '8px' }}
                      />
                      Booking History
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<HiRefresh />}
                      onClick={fetchData}
                      disabled={loading}
                      sx={{
                        borderColor: '#c10007',
                        color: '#c10007',
                        '&:hover': {
                          borderColor: '#a50006',
                          backgroundColor: '#fff5f5',
                        },
                      }}
                    >
                      Refresh
                    </Button>
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    View your past bookings and payments
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
                    <CustomerBookingHistoryTable
                      bookings={filteredBookings}
                      loading={loading}
                      onViewBooking={handleViewBooking}
                    />
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
                    <CustomerPaymentHistoryTable
                      payments={filteredPayments}
                      loading={loading}
                    />
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
