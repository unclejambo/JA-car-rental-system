import React, { useState, useEffect } from 'react';
import CustomerSideBar from '../../ui/components/CustomerSideBar';
import Header from '../../ui/components/Header';
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

  const [activeTab, setActiveTab] = useState(
    parseInt(localStorage.getItem('customerSettingsTab') || '0', 10)
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    localStorage.setItem('customerSettingsTab', newValue.toString());
  };

  const API_BASE = getApiBase().replace(/\/$/, '');

  const fetchData = async () => {
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

      if (resBookings.status === 401 || resPayments.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }

      if (!resBookings.ok || !resPayments.ok) {
        throw new Error('Failed to fetch booking or payment history');
      }

      const dataBookings = await resBookings.json();
      const dataPayments = await resPayments.json();

      // Map backend booking data to table row shape
      const mappedBookings = Array.isArray(dataBookings)
        ? dataBookings.map((b) => ({
            booking_id: b.booking_id,
            booking_date: b.booking_date,
            car_model: b.car_details?.display_name || '',
            start_date: b.start_date,
            end_date: b.end_date,
            amount: b.total_amount ?? '',
            status: b.has_outstanding_balance ? 'Unpaid' : 'Paid',
          }))
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
      console.error('Error fetching history:', err);
      setError('Failed to load booking/payment history');
      setBookings([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && (bookings === null || payments === null)) {
    return (
      <>
        <Header
          onMenuClick={() => setMobileOpen(true)}
          isMenuOpen={mobileOpen}
        />
        <CustomerSideBar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mt: '80px',
          }}
        >
          <Loading />
        </Box>
      </>
    );
  }

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
          mt: { xs: '64px', sm: '64px', md: '56px' },
        }}
      >
        <Card
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            backgroundColor: '#fff',
          }}
        >
          <CardContent>
            {/* Page Header */}
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
                    fontWeight: 'bold',
                    color: '#c10007',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <HiOutlineClipboardDocumentCheck
                    size={28}
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
                  label={`Bookings History (${bookings?.length || 0})`}
                  icon={<HiOutlineClipboardDocumentCheck />}
                  iconPosition="start"
                />
                <Tab
                  label={`Payments History (${payments?.length || 0})`}
                  icon={<HiCreditCard />}
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Tab Panels */}
            <TabPanel value={activeTab} index={0}>
              {bookings && bookings.length > 0 ? (
                <CustomerBookingHistoryTable
                  bookings={bookings}
                  loading={loading}
                />
              ) : (
                <EmptyState
                  icon={HiOutlineClipboardDocumentCheck}
                  title="No Bookings Found"
                  message="You haven’t made any bookings yet."
                />
              )}
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              {payments && payments.length > 0 ? (
                <CustomerPaymentHistoryTable
                  payments={payments}
                  loading={loading}
                />
              ) : (
                <EmptyState
                  icon={HiCreditCard}
                  title="No Payments Found"
                  message="You haven’t made any payments yet."
                />
              )}
            </TabPanel>

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: '#c10007' }} />
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default CustomerBookingHistory;
