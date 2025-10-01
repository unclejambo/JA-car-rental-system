import React, { useState, useEffect } from 'react';
import CustomerSideBar from '../../ui/components/CustomerSideBar';
import Header from '../../ui/components/Header';
import '../../styles/customercss/customerdashboard.css';
import { Box, Typography } from '@mui/material';
import { HiOutlineClipboardDocumentCheck } from 'react-icons/hi2';
import Loading from '../../ui/components/Loading';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api';
import { HiCreditCard } from 'react-icons/hi2';
import CustomerBookingHistoryTable from '../../ui/components/table/CustomerBookingHistoryTable';
import CustomerPaymentHistoryTable from '../../ui/components/table/CustomerPaymentHistoryTable';

function CustomerBookingHistory() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bookings, setBookings] = useState(null);
  const [payments, setPayments] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = getApiBase().replace(/\/$/, '');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const authFetch = createAuthenticatedFetch(() => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      });

      try {
        const resBookings = await authFetch(`${API_BASE}/bookings/me`, {
          headers: { Accept: 'application/json' },
        });
        const resPayments = await authFetch(`${API_BASE}/payments/me`, {
          headers: { Accept: 'application/json' },
        });

        if (resBookings.status === 401 || resPayments.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          return;
        }

        if (!resBookings.ok || !resPayments.ok)
          throw new Error('Failed to fetch booking or payment history');

        const dataBookings = await resBookings.json();
        const dataPayments = await resPayments.json();

        setBookings(Array.isArray(dataBookings) ? dataBookings : []);
        setPayments(Array.isArray(dataPayments) ? dataPayments : []);
      } catch (err) {
        console.error('Error fetching history:', err);
        setBookings([]);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || bookings === null || payments === null) {
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
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {/* Booking History */}
        <Box
          sx={{
            backgroundColor: '#f9f9f9',
            p: 2,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant="h4" gutterBottom>
            <HiOutlineClipboardDocumentCheck
              style={{ marginRight: '8px', verticalAlign: '-4px' }}
            />
            BOOKING HISTORY
          </Typography>
          <CustomerBookingHistoryTable rows={bookings} loading={loading} />
        </Box>

        {/* Payment History */}
        <Box
          sx={{
            backgroundColor: '#f9f9f9',
            p: 2,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant="h4" gutterBottom>
            <HiCreditCard
              style={{ marginRight: '8px', verticalAlign: '-4px' }}
            />
            PAYMENT HISTORY
          </Typography>
          <CustomerPaymentHistoryTable rows={payments} loading={loading} />
        </Box>
      </Box>
    </Box>
  );
}

export default CustomerBookingHistory;
