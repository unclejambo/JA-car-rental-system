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
  Button,
} from '@mui/material';
import { HiRefresh } from 'react-icons/hi';
import { HiCalendar, HiCalendarDays } from 'react-icons/hi2';
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

export default function DriverSchedule() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [schedules, setSchedules] = useState([]);
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
      // ✅ new backend endpoint
      const res = await authFetch(`${API_BASE}/schedules/driver/me`, {
        headers: { Accept: 'application/json' },
      });

      console.log('res', res);

      if (res.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }

      if (!res.ok)
        throw new Error(`Failed to fetch driver schedules: ${res.status}`);

      const data = await res.json();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching driver schedules:', err);
      setError('Failed to load driver schedule');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    if (schedules) {
      console.log('schedules', schedules);
    }
  }, [schedules]);

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
            </Box>

            {/* Error */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Loading */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: '#c10007' }} />
              </Box>
            ) : schedules.length === 0 ? (
              <EmptyState
                icon={HiCalendarDays}
                title="No Schedule Found"
                message="You don’t have any assigned schedules yet."
              />
            ) : (
              <DriverScheduleTable schedules={schedules} />
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
