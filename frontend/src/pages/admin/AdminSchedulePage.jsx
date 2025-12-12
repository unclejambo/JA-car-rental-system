import AdminSideBar from '../../ui/components/AdminSideBar.jsx';
import Header from '../../ui/components/Header';
import { Box, Typography } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { HiCalendarDays, HiMagnifyingGlass } from 'react-icons/hi2';
import AdminScheduleTable from '../../ui/components/table/AdminScheduleTable';
import SearchBar from '../../ui/components/SearchBar';
import Loading from '../../ui/components/Loading';
import ReleaseModal from '../../ui/components/modal/ReleaseModal.jsx';
import ReturnModal from '../../ui/components/modal/ReturnModal.jsx';
import GPSTrackingModal from '../../ui/components/modal/GPSTrackingModal.jsx';
import ScheduleHeader from '../../ui/components/header/ScheduleHeader';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api';
import { useLocation } from 'react-router-dom';

export default function AdminSchedulePage() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Check for tab query parameter
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (
      tab &&
      ['CONFIRMED', 'IN PROGRESS', 'RELEASE', 'RETURN'].includes(tab)
    ) {
      return tab;
    }
    return 'CONFIRMED';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showGPSModal, setShowGPSModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  // Update activeTab when location changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (
      tab &&
      ['CONFIRMED', 'IN PROGRESS', 'RELEASE', 'RETURN'].includes(tab)
    ) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const handleReleaseClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowReleaseModal(true);
  };

  const handleReturnClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowReturnModal(true);
  };

  const handleGPSClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowGPSModal(true);
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
      const oneHourBefore = -60 * 60 * 1000; // 1 hour before in milliseconds
      // within 1 hour before pickup or already passed
      return diff <= 60 * 60 * 1000 && diff >= oneHourBefore;
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

  const getCounts = () => {
    if (!schedule || schedule.length === 0) {
      return { CONFIRMED: 0, 'IN PROGRESS': 0, RELEASE: 0, RETURN: 0 };
    }

    const base = schedule.filter((row) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase().trim();
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

    const confirmed = base.filter((r) => {
      const s = (r.status || r.booking_status || '').toString().toLowerCase();
      // exclude release or return candidates from confirmed list
      if (isReleaseCandidate(r) || isReturnCandidate(r)) return false;
      return s === 'confirmed';
    }).length;

    const inProgress = base.filter((r) => {
      const s = (r.status || r.booking_status || '').toString().toLowerCase();
      // Exclude return candidates (ended/completed) from In Progress
      if (isReturnCandidate(r)) return false;
      return s === 'in progress' || s === 'in_progress' || s === 'ongoing';
    }).length;

    const release = base.filter((r) => isReleaseCandidate(r)).length;

    const returnCount = base.filter((r) => isReturnCandidate(r)).length;

    return {
      CONFIRMED: confirmed,
      'IN PROGRESS': inProgress,
      RELEASE: release,
      RETURN: returnCount,
    };
  };

  const getFilteredSchedule = () => {
    if (!schedule || schedule.length === 0) return [];

    // First apply search filter
    let filtered = schedule;
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = schedule.filter((row) => {
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
    }

    // Then filter by active tab
    switch (activeTab) {
      case 'CONFIRMED':
        return filtered.filter((r) => {
          const s = (r.status || r.booking_status || '')
            .toString()
            .toLowerCase();
          // exclude release or return candidates from confirmed list
          if (isReleaseCandidate(r) || isReturnCandidate(r)) return false;
          return s === 'confirmed';
        });

      case 'IN PROGRESS':
        return filtered.filter((r) => {
          const s = (r.status || r.booking_status || '')
            .toString()
            .toLowerCase();
          // Exclude return candidates (ended/completed) from In Progress
          if (isReturnCandidate(r)) return false;
          return s === 'in progress' || s === 'in_progress' || s === 'ongoing';
        });

      case 'RELEASE':
        return filtered.filter((r) => isReleaseCandidate(r));

      case 'RETURN':
        return filtered.filter((r) => isReturnCandidate(r));

      default:
        return filtered;
    }
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
      // Handle paginated response - extract data array
      const data = Array.isArray(response_data)
        ? response_data
        : response_data.data || [];

      // Show all bookings regardless of status or payment_status
      // This includes Confirmed, In Progress, and Unpaid bookings
      // Filter OUT bookings with status: Pending, Cancelled, or Completed
      // This shows Confirmed, In Progress, and other active statuses (including unpaid extensions)
      const filtered = Array.isArray(data)
        ? data.filter((r) => {
            const status = (r.status || r.booking_status || '')
              .toString()
              .toLowerCase()
              .trim();
            // Exclude these statuses
            return (
              status !== 'pending' &&
              status !== 'cancelled' &&
              status !== 'completed'
            );
          })
        : [];

      setSchedule(filtered);
    } catch (error) {
      setSchedule([]); // fallback to empty list so UI can render
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleData();
  }, []);

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
          <ScheduleHeader
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
            counts={getCounts()}
          />

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
              <AdminScheduleTable
                rows={getFilteredSchedule()}
                loading={loading}
                onOpenRelease={handleReleaseClick}
                onOpenReturn={handleReturnClick}
                onOpenGPS={handleGPSClick}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
