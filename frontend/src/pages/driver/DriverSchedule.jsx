import React, { useState, useEffect } from 'react';
import DriverSideBar from '../../ui/components/DriverSideBar';
import Header from '../../ui/components/Header';
import '../../styles/customercss/customerdashboard.css';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import { HiCalendar } from 'react-icons/hi2';
import { HiRefresh } from 'react-icons/hi';
import DriverScheduleTable from '../../ui/components/table/DriverScheduleTable';
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

function DriverSchedule() {
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
      const res = await authFetch(`${API_BASE}/driver/schedules/me`, {
        headers: { Accept: 'application/json' },
      });

      if (res.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }

      if (!res.ok)
        throw new Error(`Failed to fetch driver schedules: ${res.status}`);

      const data = await res.json();
      setSchedule(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching driver schedules:', err);
      setError('Failed to load driver schedule');
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
        <DriverSideBar
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
      <title>Driver Schedule</title>
      <Header onMenuClick={() => setMobileOpen(true)} isMenuOpen={mobileOpen} />
      <DriverSideBar
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
        }}
      >
        {/* Page Header */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography
              variant="h4"
              sx={{ fontWeight: 'bold', color: '#c10007' }}
            >
              <HiCalendar
                style={{ verticalAlign: '-3px', marginRight: '8px' }}
              />
              Driver Schedule
            </Typography>
            <Box>
              <HiRefresh
                size={22}
                style={{ cursor: 'pointer', color: '#c10007' }}
                onClick={fetchData}
              />
            </Box>
          </Box>
        </Box>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Schedule Table or Empty State */}
        {!schedule || schedule.length === 0 ? (
          <EmptyState
            icon={HiCalendar}
            title="No Schedule Found"
            message="You don’t have any assigned schedules yet."
          />
        ) : (
          <DriverScheduleTable rows={schedule} loading={loading} />
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#c10007' }} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default DriverSchedule;
