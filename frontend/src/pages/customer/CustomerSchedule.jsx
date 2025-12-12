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
  Paper,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import { HiCalendarDays, HiClock, HiMapPin, HiTruck } from 'react-icons/hi2';
import { HiRefresh } from 'react-icons/hi';
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
    if (s === 'pending')
      return { bg: '#fff8e1', text: '#f9a825', border: '#f9a825' };
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
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* Date Badge */}
        <Box
          sx={{
            minWidth: { xs: '100%', md: 100 },
            display: 'flex',
            flexDirection: { xs: 'row', md: 'column' },
            alignItems: 'center',
            justifyContent: { xs: 'flex-start', md: 'center' },
            gap: { xs: 2, md: 0 },
          }}
        >
          <Box
            sx={{
              width: { xs: 80, md: 100 },
              height: { xs: 80, md: 100 },
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

          {/* Status Chip */}
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
          sx={{ display: { xs: 'none', md: 'block' } }}
        />

        {/* Details Section */}
        <Box sx={{ flex: 1 }}>
          {/* Car Model */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <HiTruck size={24} color="#c10007" />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
              {carModel}
            </Typography>
          </Stack>

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
            <Box sx={{ pl: 0.6, position: 'relative' }}>
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

      const response_data = await res.json();
      // Handle paginated response - extract data array
      const data = Array.isArray(response_data)
        ? response_data
        : response_data.data || [];

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
      setError('Failed to load schedule');
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
          p: { xs: 1, md: 2 },
          width: `calc(100% - 18.7dvw)`,
          ml: { xs: '0px', sm: '0px', md: '18.7dvw' },
          '@media (max-width: 1024px)': {
            ml: '0px',
          },
          mt: { xs: '74px', sm: '74px', md: '64px' },
          border: 'none',
          display: 'flex',
          overflow: 'hidden',
          flexDirection: 'column',
        }}
      >
        <Card
          sx={{
            p: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fff',
          }}
        >
          <CardContent sx={{ flexGrow: 1 }}>
            {/* Loading Indicator */}
            {loading && schedule === null && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress sx={{ color: '#c10007' }} />
              </Box>
            )}

            {/* Page Header */}
            {!(loading && schedule === null) && (
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
                      <HiCalendarDays
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
                        Schedule
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: { xs: '0.875rem', md: '1rem' },
                        }}
                      >
                        View your upcoming bookings and schedule
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

                {/* Error */}
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

                {/* Schedule Cards or Empty State */}
                {!schedule || schedule.length === 0 ? (
                  <EmptyState
                    icon={HiCalendarDays}
                    title="No Schedule Found"
                    message="You don't have any schedules yet."
                  />
                ) : (
                  <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                    {schedule.map((item, index) => (
                      <ScheduleCard
                        key={item.booking_id || item.id || index}
                        schedule={item}
                      />
                    ))}
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default CustomerSchedule;
