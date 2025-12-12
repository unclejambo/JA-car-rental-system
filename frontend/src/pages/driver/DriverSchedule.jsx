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
  Paper,
  Stack,
  Chip,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import { HiRefresh } from 'react-icons/hi';
import {
  HiCalendarDays,
  HiClock,
  HiMapPin,
  HiTruck,
  HiUser,
  HiPhone,
  HiCalendar,
} from 'react-icons/hi2';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api';

function ScheduleCard({ schedule }) {
  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status) => {
    const s = (status || '').toString().toLowerCase().trim();
    if (s === 'confirmed')
      return { bg: '#e3f2fd', text: '#1976d2', border: '#1976d2' };
    if (s === 'in progress' || s === 'ongoing')
      return { bg: '#fff3e0', text: '#f57c00', border: '#f57c00' };
    if (s === 'completed')
      return { bg: '#e8f5e9', text: '#2e7d32', border: '#2e7d32' };
    if (s === 'cancelled' || s === 'canceled')
      return { bg: '#ffebee', text: '#d32f2f', border: '#d32f2f' };
    return { bg: '#f5f5f5', text: '#757575', border: '#757575' };
  };

  const getDayOfWeek = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getMonthDay = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.getDate();
  };

  const status = schedule.booking_status || schedule.status || 'N/A';
  const statusColors = getStatusColor(status);
  const carModel = schedule.car_model || 'Vehicle';
  const customerName = schedule.customer_name || 'N/A';
  const startDate = schedule.start_date || schedule.startDate;
  const endDate = schedule.end_date || schedule.endDate;
  const pickupTime = schedule.pickup_time || schedule.pickupTime || startDate;
  const dropoffTime = schedule.dropoff_time || schedule.dropoffTime || endDate;
  const pickupLoc = schedule.pickup_loc || schedule.pickup_location || 'N/A';
  const dropoffLoc =
    schedule.dropoff_loc ||
    schedule.dropoff_location ||
    schedule.drop_location ||
    'N/A';

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2.5,
        mb: 2,
        borderRadius: 3,
        border: `2px solid ${statusColors.border}`,
        backgroundColor: '#fff',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(193, 0, 7, 0.15)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        {/* Date Badge & Status */}
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
              background: 'linear-gradient(135deg, #c10007 0%, #8b0005 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(193, 0, 7, 0.3)',
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.9 }}
            >
              {getDayOfWeek(startDate)}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
              {getMonthDay(startDate)}
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontSize: '0.65rem', opacity: 0.9 }}
            >
              {new Date(startDate).toLocaleDateString('en-US', {
                month: 'short',
              })}
            </Typography>
          </Box>

          <Chip
            label={status}
            sx={{
              bgcolor: statusColors.bg,
              color: statusColors.text,
              fontWeight: 600,
              fontSize: '0.75rem',
              border: `1px solid ${statusColors.border}`,
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
          {/* Customer & Car */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ flex: 1 }}
            >
              <HiUser size={20} color="#666" />
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: '#666', fontSize: '0.7rem' }}
                >
                  Customer
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {customerName}
                </Typography>
              </Box>
            </Stack>
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
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: '#c10007' }}
                >
                  {carModel}
                </Typography>
              </Box>
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Timeline */}
          <Stack spacing={2}>
            {/* Pickup */}
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: '#4caf50',
                    mt: 0.5,
                    boxShadow: '0 0 0 4px rgba(76, 175, 80, 0.2)',
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#666',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                    }}
                  >
                    Pickup
                  </Typography>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={{ xs: 0.5, sm: 2 }}
                    sx={{ mt: 0.5 }}
                  >
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <HiClock size={16} color="#666" />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDate(startDate)} • {formatTime(pickupTime)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <HiMapPin size={16} color="#666" />
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {pickupLoc}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </Box>

            {/* Connection Line */}
            <Box sx={{ pl: 0.6 }}>
              <Box
                sx={{
                  width: 2,
                  height: 30,
                  bgcolor: '#e0e0e0',
                  borderRadius: 1,
                }}
              />
            </Box>

            {/* Dropoff */}
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: '#f44336',
                    mt: 0.5,
                    boxShadow: '0 0 0 4px rgba(244, 67, 54, 0.2)',
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#666',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                    }}
                  >
                    Drop-off
                  </Typography>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={{ xs: 0.5, sm: 2 }}
                    sx={{ mt: 0.5 }}
                  >
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <HiClock size={16} color="#666" />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDate(endDate)} • {formatTime(dropoffTime)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <HiMapPin size={16} color="#666" />
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {dropoffLoc}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Paper>
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

export default function DriverSchedule() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tab, setTab] = useState(
    parseInt(localStorage.getItem('driverScheduleTab') || '0', 10)
  );
  const [schedules, setSchedules] = useState(null);
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

      const response_data = await res.json();
      // Handle paginated response - extract data array
      const data = Array.isArray(response_data)
        ? response_data
        : response_data.data || [];
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
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
  const activeSchedules = (schedules || []).filter((s) => {
    const status = (s.booking_status || '').toLowerCase();
    return status === 'confirmed' || status === 'in progress';
  });

  const historySchedules = (schedules || []).filter((s) => {
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
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            backgroundColor: '#fff',
          }}
        >
          <CardContent>
            {/* Loading Indicator - Initial Load */}
            {loading && schedules === null && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress sx={{ color: '#c10007' }} />
              </Box>
            )}

            {/* Page Header */}
            {!(loading && schedules === null) && (
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
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        color: '#c10007',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <HiCalendar size={24} style={{ marginRight: '8px' }} />
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

                {/* Loading Indicator - Refresh (inside table area) */}
                {loading && (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', py: 3 }}
                  >
                    <CircularProgress sx={{ color: '#c10007' }} />
                  </Box>
                )}

                {/* Tab Content */}
                {!loading && (
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
                          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                            {activeSchedules.map((item, index) => (
                              <ScheduleCard
                                key={item.booking_id || item.id || index}
                                schedule={item}
                              />
                            ))}
                          </Box>
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
                          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                            {historySchedules.map((item, index) => (
                              <ScheduleCard
                                key={item.booking_id || item.id || index}
                                schedule={item}
                              />
                            ))}
                          </Box>
                        )}
                      </>
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
