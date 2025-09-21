import AdminSideBar from '../../ui/components/AdminSideBar.jsx';
import Header from '../../ui/components/Header';
import { Box, Typography } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { HiCalendarDays, HiMagnifyingGlass } from 'react-icons/hi2';
import ScheduleTable from '../../ui/components/table/ScheduleTable';
import Loading from '../../ui/components/Loading';
import ReleaseModal from '../../ui/components/modal/ReleaseModal.jsx';
import ReturnModal from '../../ui/components/modal/ReturnModal.jsx';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api';

export default function AdminSchedulePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('AdminSchedulePage - Schedule:', schedule); // Debug log

  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const handleReleaseClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowReleaseModal(true);
  };

  const handleReturnClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowReturnModal(true);
  };

  useEffect(() => {
    const fetchData = async () => {
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
          throw new Error(`Failed to fetch schedules: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        setSchedule(data);
      } catch (error) {
        console.error('Error fetching schedules:', error);
        setSchedule([]); // fallback to empty list so UI can render
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || schedule === null) {
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
        >
          <Loading />
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
        />
      )}
      {showReturnModal && (
        <ReturnModal
          show={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          reservation={selectedReservation}
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
                  fontSize: '1.8rem',
                  color: '#000',
                  '@media (max-width: 1024px)': {
                    fontSize: '2rem',
                  },
                }}
              >
                <HiCalendarDays
                  style={{ verticalAlign: '-3px', marginRight: '5px' }}
                />
                SCHEDULE
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {(!schedule || schedule.length === 0) ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '50vh',
                  }}
                >
                  <Typography variant="h6">No schedule found</Typography>
                </Box>
              ) : (
                <>
                  <pre style={{ display: 'none' }}>
                    {JSON.stringify(schedule, null, 2)}
                  </pre>
                  <ScheduleTable
                    rows={schedule}
                    loading={loading}
                    onOpenRelease={handleReleaseClick}
                    onOpenReturn={handleReturnClick}
                  />
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
