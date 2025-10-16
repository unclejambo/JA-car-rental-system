import React, { useState, useEffect } from 'react';
import CustomerSideBar from '../../ui/components/CustomerSideBar';
import Header from '../../ui/components/Header';
import '../../styles/customercss/customerdashboard.css';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import { HiCalendarDays } from 'react-icons/hi2';
import { HiRefresh } from 'react-icons/hi';
import CustomerScheduleTable from '../../ui/components/table/CustomerScheduleTable';
import Loading from '../../ui/components/Loading';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api';

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

function CustomerSchedule() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE = getApiBase().replace(/\/$/, '');

  const fetchData = async () => {
    setLoading(true);
    setError('');

    const authFetch = createAuthenticatedFetch(() => {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    });

    try {
      const res = await authFetch(`${API_BASE}/schedules/me`, {
        headers: { Accept: 'application/json' },
      });

      if (res.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }

      if (!res.ok) throw new Error(`Failed to fetch schedules: ${res.status}`);

      const data = await res.json();
      // Filter out completed and cancelled schedules
      const filteredSchedule = Array.isArray(data)
        ? data.filter((schedule) => {
            const status = (schedule.status || schedule.booking_status || '')
              .toString()
              .toLowerCase()
              .trim();
            // Only show schedules that are NOT completed or cancelled
            return status !== 'completed' && status !== 'cancelled';
          })
        : [];
      setSchedule(filteredSchedule);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError('Failed to load schedule');
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && schedule === null) {
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
          component="main"
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
      <title>Schedule</title>
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
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Card
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fff',
          }}
        >
          <CardContent sx={{ flexGrow: 1 }}>
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
                  sx={{ fontWeight: 'bold', color: '#c10007' }}
                >
                  <HiCalendarDays
                    style={{ verticalAlign: '-3px', marginRight: '8px' }}
                  />
                  Schedule
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
                View your upcoming schedules and past bookings.
              </Typography>
            </Box>

            {/* Error */}
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

            {/* Schedule Table or Empty State */}
            {!schedule || schedule.length === 0 ? (
              <EmptyState
                icon={HiCalendarDays}
                title="No Schedule Found"
                message="You don't have any schedules yet."
              />
            ) : (
              <CustomerScheduleTable rows={schedule} loading={false} />
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default CustomerSchedule;
