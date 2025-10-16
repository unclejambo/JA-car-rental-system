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
import { createAuthenticatedFetch, getApiBase } from '../../utils/api';

export default function AdminSchedulePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showGPSModal, setShowGPSModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

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

  const getFilteredSchedule = () => {
    if (!schedule || schedule.length === 0) return [];

    if (!searchQuery) return schedule;

    const query = searchQuery.toLowerCase().trim();

    return schedule.filter((row) => {
      // Search by customer name
      if (row.customer_name?.toLowerCase().includes(query)) return true;

      // Search by start date
      if (row.start_date?.toLowerCase().includes(query)) return true;

      // Search by end date
      if (row.end_date?.toLowerCase().includes(query)) return true;

      // Search by pickup location
      if (row.pickup_location?.toLowerCase().includes(query)) return true;

      // Search by dropoff location
      if (row.dropoff_location?.toLowerCase().includes(query)) return true;

      // Search by pickup time
      if (row.pickup_time?.toLowerCase().includes(query)) return true;

      // Search by dropoff time
      if (row.dropoff_time?.toLowerCase().includes(query)) return true;

      // Search by status
      if (row.status?.toLowerCase().includes(query)) return true;

      // Search by booking_id
      if (row.booking_id?.toString().includes(query)) return true;

      return false;
    });
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
      const data = await res.json();
      // Filter to only show reservations with status Confirmed or In Progress/Ongoing per requirement
      const filtered = Array.isArray(data)
        ? data.filter((r) => {
            const raw = (r.status || r.booking_status || '')
              .toString()
              .toLowerCase()
              .trim();
            return (
              raw === 'confirmed' || raw === 'in progress' || raw === 'ongoing'
            );
          })
        : [];
      setSchedule(filtered);
    } catch (error) {
      console.error('Error fetching schedules:', error);
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
                  fontSize: { xs: '1.33rem', sm: '1.5rem', md: '1.8rem' },
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
                  mb: 2,
                }}
              >
                <SearchBar
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search schedule..."
                  variant="outlined"
                  size="small"
                  sx={{
                    width: { xs: '100%', sm: 350 },
                    maxWidth: { xs: 'auto', sm: 350 },
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
