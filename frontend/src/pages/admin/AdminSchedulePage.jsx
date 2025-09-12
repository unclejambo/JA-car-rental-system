import AdminSideBar from '../../ui/components/AdminSideBar.jsx';
import Header from '../../ui/components/Header';
import { Box, Typography } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { HiCalendarDays, HiMagnifyingGlass } from 'react-icons/hi2';
import ScheduleTable from '../../ui/components/table/ScheduleTable';
import { useScheduleStore } from '../../store/schedule.js';
import Loading from '../../ui/components/Loading';
import ReleaseModal from '../../ui/components/modal/ReleaseModal.jsx';
import ReturnModal from '../../ui/components/modal/ReturnModal.jsx';

export default function AdminSchedulePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  // const [searchTerm, setSearchTerm] = useState('');
  const reservations = useScheduleStore((state) => state.reservations);
  const [loading, setLoading] = useState(true);

  console.log('AdminSchedulePage - Reservations:', reservations); // Debug log

  // Filter data based on search term
  // const filteredData = useMemo(() => {
  //   if (!searchTerm.trim()) return reservations;
  //   const term = searchTerm.toLowerCase();
  //   return reservations.filter((item) =>
  //     (item.customerName && item.customerName.toLowerCase().includes(term))
  //   );
  // }, [reservations, searchTerm]);

  // const [showReleaseModal, setShowReleaseModal] = useState(false);
  // const [showReturnModal, setShowReturnModal] = useState(false);
  // const [selectedReservation, setSelectedReservation] = useState(null);

  // const handleReleaseClick = (reservation) => {
  //   setSelectedReservation(reservation);
  //   setShowReleaseModal(true);
  // };

  // const handleReturnClick = (reservation) => {
  //   setSelectedReservation(reservation);
  //   setShowReturnModal(true);
  // };

  // const columns = useMemo(
  //   () => scheduleColumns(handleReleaseClick, handleReturnClick),
  //   [handleReleaseClick, handleReturnClick]
  // );

  // <Header onMenuClick={() => setMobileOpen(true)} isMenuOpen={mobileOpen} />
  //     <AdminSideBar
  //       mobileOpen={mobileOpen}
  //       onClose={() => setMobileOpen(false)}
  //     />
  // {showReleaseModal && (
  //   <ReleaseModal
  //     show={showReleaseModal}
  //     onClose={() => setShowReleaseModal(false)}
  //     reservation={selectedReservation}
  //   />
  // )}

  // {showReturnModal && (
  //   <ReturnModal
  //     show={showReturnModal}
  //     onClose={() => setShowReturnModal(false)}
  //     reservation={selectedReservation}
  //   />
  // )}

  // <div className="flex justify-between items-center mb-4">
  //         <div className="relative">
  //           <input
  //             type="text"
  //             placeholder="Search by name..."
  //             className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  //             value={searchTerm}
  //             onChange={(e) => setSearchTerm(e.target.value)}
  //           />
  //           <HiMagnifyingGlass className="absolute left-3 top-3 text-gray-400" />
  //         </div>
  //       </div>

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Since we're using Zustand, the data is already in the store
        // We'll just add a small delay to simulate network request
        await new Promise((resolve) => setTimeout(resolve, 500));
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || !reservations) {
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
      <Header onMenuClick={() => setMobileOpen(true)} />
      <AdminSideBar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
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
              {reservations.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '50vh',
                  }}
                >
                  <Typography variant="h6">No reservations found</Typography>
                </Box>
              ) : (
                <>
                  <pre style={{ display: 'none' }}>
                    {JSON.stringify(reservations, null, 2)}
                  </pre>
                  <ScheduleTable rows={reservations} loading={loading} />
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
