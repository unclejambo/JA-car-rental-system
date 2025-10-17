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
  Tabs,
  Tab,
} from '@mui/material';
import { HiRefresh } from 'react-icons/hi';
import { HiCalendar, HiCalendarDays } from 'react-icons/hi2';
import DriverScheduleTable from '../../ui/components/table/DriverScheduleTable';
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
  const [tab, setTab] = useState(
    parseInt(localStorage.getItem('driverScheduleTab') || '0', 10)
  );
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
      const res = await authFetch(`${API_BASE}/schedules/driver/me`, {
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

  // ✅ Save selected tab to localStorage
  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    localStorage.setItem('driverScheduleTab', newValue.toString());
  };

  // ✅ Filter schedules
  const activeSchedules = schedules.filter((s) => {
    const status = (s.booking_status || '').toLowerCase();
    return status === 'confirmed' || status === 'in progress';
  });

  const historySchedules = schedules.filter((s) => {
    const status = (s.booking_status || '').toLowerCase();
    return (
      status === 'completed' || status === 'cancelled' || status === 'canceled'
    );
  });

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
          mt: { xs: '74px', sm: '74px', md: '64px' },
        }}
      >
        <Card
          sx={{
            p: 0,
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
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
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    color: '#c10007',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <HiCalendar size={28} style={{ marginRight: '8px' }} />
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
              <Typography variant="body1" color="text.secondary">
                View your assigned and completed driving schedules
              </Typography>
            </Box>

            {/* Tabs with Counts */}
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
                value={tab}
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
                    minWidth: 160,
                    fontFamily: 'Roboto, sans-serif',
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
                  label={`Schedule (${activeSchedules?.length || 0})`}
                  icon={<HiCalendar />}
                  iconPosition="start"
                />
                <Tab
                  label={`History (${historySchedules?.length || 0})`}
                  icon={<HiCalendarDays />}
                  iconPosition="start"
                />
              </Tabs>
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
            ) : (
              <>
                {tab === 0 && (
                  <>
                    {activeSchedules.length === 0 ? (
                      <EmptyState
                        icon={HiCalendarDays}
                        title="No Active Schedules"
                        message="You don’t have any active schedules at the moment."
                      />
                    ) : (
                      <DriverScheduleTable schedules={activeSchedules} />
                    )}
                  </>
                )}

                {tab === 1 && (
                  <>
                    {historySchedules.length === 0 ? (
                      <EmptyState
                        icon={HiCalendarDays}
                        title="No History"
                        message="You don’t have any completed or cancelled schedules yet."
                      />
                    ) : (
                      <DriverScheduleTable schedules={historySchedules} />
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
