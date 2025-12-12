import AdminSideBar from '../../ui/components/AdminSideBar.jsx';
import Header from '../../ui/components/Header';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import {
  HiCalendarDays,
  HiClock,
  HiMapPin,
  HiTruck,
  HiUser,
  HiPhone,
} from 'react-icons/hi2';
import SearchBar from '../../ui/components/SearchBar';
import ReleaseModal from '../../ui/components/modal/ReleaseModal.jsx';
import ReturnModal from '../../ui/components/modal/ReturnModal.jsx';
import GPSTrackingModal from '../../ui/components/modal/GPSTrackingModal.jsx';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api';

function ScheduleCard({ schedule, onRelease, onReturn, onGPS, activeTab }) {
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
    if (s === 'in progress' || s === 'ongoing' || s === 'in_progress')
      return { bg: '#fff3e0', text: '#f57c00', border: '#f57c00' };
    if (s === 'completed')
      return { bg: '#e8f5e9', text: '#2e7d32', border: '#2e7d32' };
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
  const contactNo = schedule.contact_no || 'N/A';
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
      elevation={3}
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
              <HiPhone size={20} color="#666" />
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: '#666', fontSize: '0.7rem' }}
                >
                  Contact
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {contactNo}
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

        {/* Actions - Conditionally rendered based on active tab */}
        {(activeTab === 'IN_PROGRESS' ||
          activeTab === 'RELEASE' ||
          activeTab === 'RETURN') && (
          <>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: 'none', lg: 'block' } }}
            />
            <Stack
              spacing={1}
              sx={{
                minWidth: { xs: '100%', lg: 140 },
                justifyContent: 'center',
              }}
            >
              {activeTab === 'RELEASE' && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => onRelease(schedule)}
                  sx={{
                    bgcolor: '#4caf50',
                    '&:hover': { bgcolor: '#388e3c' },
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Release
                </Button>
              )}
              {activeTab === 'RETURN' && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => onReturn(schedule)}
                  sx={{
                    bgcolor: '#2196f3',
                    '&:hover': { bgcolor: '#1976d2' },
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Return
                </Button>
              )}
              {(activeTab === 'IN_PROGRESS' ||
                activeTab === 'RELEASE' ||
                activeTab === 'RETURN') && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onGPS(schedule)}
                  sx={{
                    borderColor: '#ff9800',
                    color: '#ff9800',
                    '&:hover': { borderColor: '#f57c00', bgcolor: '#fff3e0' },
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  GPS Track
                </Button>
              )}
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
}

export default function AdminSchedulePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('CONFIRMED');

  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showGPSModal, setShowGPSModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const handleReleaseClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowReleaseModal(true);
  };

  const fetchScheduleData = async () => {
    setLoading(true);
    const authFetch = createAuthenticatedFetch(() => {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    });
    const API_BASE = getApiBase().replace(/\/$/, '');
    try {
      const res = await authFetch(`${API_BASE}/schedules`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        throw new Error(
          `Failed to fetch schedules: ${res.status} ${res.statusText}`
        );
      }
      const response_data = await res.json();
      const data = Array.isArray(response_data)
        ? response_data
        : response_data.data || [];

      const filtered = Array.isArray(data)
        ? data.filter((r) => {
            const status = (r.status || r.booking_status || '')
              .toString()
              .toLowerCase()
              .trim();
            return (
              status !== 'pending' &&
              status !== 'cancelled' &&
              status !== 'completed'
            );
          })
        : [];

      setSchedule(filtered);
    } catch (error) {
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowReturnModal(true);
  };

  const handleGPSClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowGPSModal(true);
  };

  const getFilteredSchedule = () => {
    if (!schedule || schedule.length === 0) return [];

    if (!searchQuery) return schedule;

    const query = searchQuery.toLowerCase().trim();

    return schedule.filter((row) => {
      if (row.customer_name?.toLowerCase().includes(query)) return true;
      if (row.start_date?.toLowerCase().includes(query)) return true;
      if (row.end_date?.toLowerCase().includes(query)) return true;
      if (row.pickup_location?.toLowerCase().includes(query)) return true;
      if (row.dropoff_location?.toLowerCase().includes(query)) return true;
      if (row.pickup_time?.toLowerCase().includes(query)) return true;
      if (row.dropoff_time?.toLowerCase().includes(query)) return true;
      if (row.status?.toLowerCase().includes(query)) return true;
      if (row.booking_id?.toString().includes(query)) return true;
      return false;
    });
  };

  useEffect(() => {
    fetchScheduleData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const isReleaseCandidate = (row) => {
    try {
      const status = (row.status || row.booking_status || '')
        .toString()
        .toLowerCase();
      if (status !== 'confirmed') return false;
      const pickup =
        row.pickup_time || row.start_date || row.startDate || row.pickup_time;
      if (!pickup) return false;
      const pickupTime = new Date(pickup);
      const now = new Date();
      const diff = pickupTime - now;
      // within 1 hour before pickup
      return diff <= 60 * 60 * 1000 && diff >= 0;
    } catch (e) {
      return false;
    }
  };

  const isReturnCandidate = (row) => {
    try {
      const status = (row.status || row.booking_status || '')
        .toString()
        .toLowerCase();
      if (status === 'completed') return true;
      // if in progress but end date/time passed
      if (
        status === 'in progress' ||
        status === 'in_progress' ||
        status === 'ongoing'
      ) {
        const end = row.end_date || row.endDate || row.dropoff_time;
        if (!end) return false;
        const endTime = new Date(end);
        return endTime <= new Date();
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const getTabFilteredSchedule = (tab = activeTab) => {
    const base = getFilteredSchedule();
    switch (tab) {
      case 'CONFIRMED':
        return base.filter((r) => {
          const s = (r.status || r.booking_status || '')
            .toString()
            .toLowerCase();
          // exclude release or return candidates from confirmed list
          if (isReleaseCandidate(r) || isReturnCandidate(r)) return false;
          return s === 'confirmed';
        });
      case 'IN_PROGRESS':
        return base.filter((r) => {
          const s = (r.status || r.booking_status || '')
            .toString()
            .toLowerCase();
          // Exclude return candidates (ended/completed) from In Progress
          if (isReturnCandidate(r)) return false;
          return s === 'in progress' || s === 'in_progress' || s === 'ongoing';
        });
      case 'RELEASE':
        return base.filter((r) => isReleaseCandidate(r));
      case 'RETURN':
        return base.filter((r) => isReturnCandidate(r));
      default:
        return base;
    }
  };

  if (error) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Header onMenuClick={() => setMobileOpen(true)} />
        <AdminSideBar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
          color="error.main"
        >
          <Typography>{error}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <title>Schedule</title>
      <Header onMenuClick={() => setMobileOpen(true)} />
      <AdminSideBar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      {showReleaseModal && (
        <ReleaseModal
          show={showReleaseModal}
          onClose={() => setShowReleaseModal(false)}
          reservation={selectedReservation}
          onSuccess={fetchScheduleData}
        />
      )}
      {showReturnModal && (
        <ReturnModal
          show={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          bookingId={selectedReservation?.booking_id}
        />
      )}
      {showGPSModal && (
        <GPSTrackingModal
          open={showGPSModal}
          onClose={() => setShowGPSModal(false)}
          booking={selectedReservation}
        />
      )}
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
          mt: { xs: '74px', sm: '74px', md: '66px', lg: '66px' },
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
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                mb: 2,
              }}
            >
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontSize: { xs: '1.3rem', sm: '1.5rem', md: '1.8rem' },
                  color: '#000',
                }}
              >
                <HiCalendarDays
                  style={{ verticalAlign: '-3px', marginRight: '5px' }}
                />
                SCHEDULE
              </Typography>

              {/* Search Bar */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                }}
              >
                <SearchBar
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search schedule..."
                  variant="outlined"
                  size="small"
                  sx={{
                    width: { xs: '90%', md: 350 },
                    maxWidth: 'auto',
                    height: { xs: 26, md: 30 },
                    backgroundColor: '#fff',
                    '& .MuiOutlinedInput-root': {
                      height: { xs: 26, md: 30 },
                      backgroundColor: '#fff',
                    },
                    '& .MuiInputBase-input': {
                      padding: { xs: '4px 8px', md: '6px 10px' },
                    },
                  }}
                />
              </Box>
            </Box>

            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {
                // compute counts for labels
              }
              {(() => {
                const confirmedCount =
                  getTabFilteredSchedule('CONFIRMED').length;
                const inProgressCount =
                  getTabFilteredSchedule('IN_PROGRESS').length;
                const releaseCount = getTabFilteredSchedule('RELEASE').length;
                const returnCount = getTabFilteredSchedule('RETURN').length;

                const tabs = [
                  {
                    key: 'CONFIRMED',
                    label: 'Confirmed',
                    count: confirmedCount,
                  },
                  {
                    key: 'IN_PROGRESS',
                    label: 'In Progress',
                    count: inProgressCount,
                  },
                  {
                    key: 'RELEASE',
                    label: 'Release',
                    count: releaseCount,
                  },
                  {
                    key: 'RETURN',
                    label: 'Return',
                    count: returnCount,
                  },
                ];

                return (
                  <>
                    <Box
                      sx={{
                        mb: 3,
                        display: 'flex',
                        justifyContent: 'flex-start',
                        gap: 0.4,
                        width: '100%',
                      }}
                    >
                      {tabs.map((tab, idx) => (
                        <Button
                          key={tab.key}
                          variant={
                            activeTab === tab.key ? 'contained' : 'outlined'
                          }
                          onClick={() => handleTabChange(null, tab.key)}
                          sx={{
                            flex: 1,
                            minWidth: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            boxShadow: 0,
                            borderRadius: 0,
                            borderTopLeftRadius: idx === 0 ? '8px' : 0,
                            borderTopRightRadius:
                              idx === tabs.length - 1 ? '8px' : 0,
                            color: activeTab === tab.key ? '#fff' : '#333',
                            backgroundColor:
                              activeTab === tab.key ? '#c10007' : '#d9d9d9',
                            borderColor: '#ccc',
                            textTransform: 'none',
                            fontWeight: activeTab === tab.key ? 600 : 400,
                            cursor:
                              activeTab === tab.key ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            '&:hover': {
                              backgroundColor:
                                activeTab === tab.key ? '#c10007' : '#4a4a4a',
                              borderColor:
                                activeTab === tab.key ? '#4a4a4a' : '#999',
                              color: activeTab === tab.key ? '#fff' : '#fff',
                              boxShadow: 'none',
                            },
                            '&:active': {
                              backgroundColor:
                                activeTab === tab.key ? '#c10007' : '#d0d0d0',
                              transition:
                                activeTab === tab.key
                                  ? 'none'
                                  : 'all 0.2s ease',
                            },
                            '&:focus': {
                              outline: 'none',
                              boxShadow:
                                activeTab === tab.key
                                  ? 'none'
                                  : '0 0 0 3px rgba(0, 0, 0, 0.1)',
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Box component="span">{tab.label}</Box>
                            {tab.count > 0 && (
                              <Box
                                component="span"
                                sx={{
                                  height: '20px',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  backgroundColor: '#fff',
                                  color: '#c10007',
                                  px: 1,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  borderRadius: '4px',
                                }}
                              >
                                {tab.count}
                              </Box>
                            )}
                          </Box>
                        </Button>
                      ))}
                    </Box>

                    {/* Schedule Cards */}
                    <Box sx={{ flexGrow: 1, overflow: 'auto', pr: 1 }}>
                      {getTabFilteredSchedule().length === 0 ? (
                        <Paper
                          sx={{
                            p: 6,
                            textAlign: 'center',
                            bgcolor: '#fafafa',
                            borderRadius: 2,
                          }}
                        >
                          <HiCalendarDays size={48} color="#c10007" />
                          <Typography
                            variant="h6"
                            sx={{ mt: 2, color: '#666' }}
                          >
                            No schedules found
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#999' }}>
                            {activeTab === 'CONFIRMED' &&
                              'No confirmed bookings at the moment'}
                            {activeTab === 'IN_PROGRESS' &&
                              'No bookings in progress'}
                            {activeTab === 'RELEASE' &&
                              'No vehicles ready for release'}
                            {activeTab === 'RETURN' &&
                              'No vehicles ready for return'}
                          </Typography>
                        </Paper>
                      ) : (
                        getTabFilteredSchedule().map((item, index) => (
                          <ScheduleCard
                            key={item.booking_id || item.id || index}
                            schedule={item}
                            onRelease={handleReleaseClick}
                            onReturn={handleReturnClick}
                            onGPS={handleGPSClick}
                            activeTab={activeTab}
                          />
                        ))
                      )}
                    </Box>
                  </>
                );
              })()}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
