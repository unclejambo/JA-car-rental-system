import AdminSideBar from '../../ui/components/AdminSideBar.jsx';
import Header from '../../ui/components/Header';
import { Box, Typography, Button } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { HiCalendarDays, HiMagnifyingGlass } from 'react-icons/hi2';
import AdminScheduleTable from '../../ui/components/table/AdminScheduleTable';
import { Tabs, Tab } from '@mui/material';
import SearchBar from '../../ui/components/SearchBar';
import Loading from '../../ui/components/Loading';
import ReleaseModal from '../../ui/components/modal/ReleaseModal.jsx';
import ReturnModal from '../../ui/components/modal/ReturnModal.jsx';
import GPSTrackingModal from '../../ui/components/modal/GPSTrackingModal.jsx';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api';

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

                    <AdminScheduleTable
                      rows={getTabFilteredSchedule()}
                      loading={loading}
                      onOpenRelease={handleReleaseClick}
                      onOpenReturn={handleReturnClick}
                      onOpenGPS={handleGPSClick}
                    />
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
