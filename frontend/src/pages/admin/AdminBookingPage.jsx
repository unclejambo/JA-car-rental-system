import { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import AdminSideBar from '../../ui/components/AdminSideBar';
import Header from '../../ui/components/Header';
import Loading from '../../ui/components/Loading';
import ManageBookingsTable from '../../ui/components/table/ManageBookingsTable';
import ManageBookingsHeader from '../../ui/components/header/ManageBookingsHeader';

export default function AdminBookingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('BOOKINGS');

  useEffect(() => {
    setLoading(true);

    fetch('https://68b2fd5cc28940c9e69de1ab.mockapi.io/bookings')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // Helper to convert a datetime to YYYY-MM-DD (safe)
        const formatDateOnly = (value) => {
          if (!value) return '';
          const d = new Date(value);
          if (isNaN(d)) return value;
          return d.toISOString().split('T')[0];
        };

        const formattedData = data.map((item, index) => ({
          ...item,
          id: item.customerId || item.reservationId || `row-${index}`, // Add unique id property
          status: item.status ? 'Active' : 'Inactive',
          // Overwrite start/end/booking date to exclude time
          startDate: formatDateOnly(item.startDate),
          endDate: formatDateOnly(item.endDate),
          bookingDate: formatDateOnly(item.bookingDate),
        }));
        setRows(formattedData);
        setError(null);
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Header onMenuClick={() => setMobileOpen(true)} />
        <AdminSideBar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <Loading />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
        color="error.main"
      >
        <Typography>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Header onMenuClick={() => setMobileOpen(true)} />
      <AdminSideBar
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
          mt: { xs: '64px', sm: '64px', md: '56px', lg: '56px' }, // Adjust based on your header height
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            width: '100%',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ManageBookingsHeader activeTab={activeTab} onTabChange={setActiveTab} />
          <Box
            sx={{
              flexGrow: 1,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#f9f9f9',
              p: { xs: 1, sm: 2, md: 2, lg: 2 },
              boxShadow:
                '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 4px 0 6px -1px rgba(0, 0, 0, 0.1), -4px 0 6px -1px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              height: 'auto',
              boxSizing: 'border-box',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                  fontSize: '1.8rem',
                  color: '#000',
                  '@media (max-width: 1024px)': {
                    fontSize: '2rem',
                  },
                }}
              >
                {activeTab}
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <ManageBookingsTable
                rows={rows}
                loading={loading}
                activeTab={activeTab}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
