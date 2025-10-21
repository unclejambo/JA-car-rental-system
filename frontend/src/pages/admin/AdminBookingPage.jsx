import { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import AdminSideBar from '../../ui/components/AdminSideBar';
import Header from '../../ui/components/Header';
import Loading from '../../ui/components/Loading';
import ManageBookingsTable from '../../ui/components/table/ManageBookingsTable';
import ManageBookingsHeader from '../../ui/components/header/ManageBookingsHeader';
import SearchBar from '../../ui/components/SearchBar';
import { HiBookOpen, HiCurrencyDollar } from 'react-icons/hi2';
import ManageFeesModal from '../../ui/components/modal/ManageFeesModal';
import BookingDetailsModal from '../../ui/components/modal/BookingDetailsModal';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api';

export default function AdminBookingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('BOOKINGS');
  const [showManageFeesModal, setShowManageFeesModal] = useState(false);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const openManageFeesModal = () => setShowManageFeesModal(true);
  const closeManageFeesModal = () => setShowManageFeesModal(false);

  const openBookingDetailsModal = (booking) => {
    setSelectedBooking(booking);
    setShowBookingDetailsModal(true);
  };

  const closeBookingDetailsModal = () => {
    setShowBookingDetailsModal(false);
    setSelectedBooking(null);
  };

  // Calculate counts for each tab (without search filter)
  const getTabCounts = () => {
    if (!rows || rows.length === 0)
      return { BOOKINGS: 0, CANCELLATION: 0, EXTENSION: 0 };

    // Count all bookings in the rows array
    const bookingsCount = rows.length;

    const cancellationCount = rows.filter(
      (row) =>
        row.isCancel === true ||
        row.isCancel === 'true' ||
        row.isCancel === 'TRUE'
    ).length;

    const extensionCount = rows.filter(
      (row) =>
        row.isExtend === true ||
        row.isExtend === 'true' ||
        row.isExtend === 'TRUE'
    ).length;

    return {
      BOOKINGS: bookingsCount,
      CANCELLATION: cancellationCount,
      EXTENSION: extensionCount,
    };
  };

  const getFilteredRows = () => {
    if (!rows || rows.length === 0) return [];

    let filteredData = rows;

    // Apply search filter if search query exists
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filteredData = rows.filter((row) => {
        // Search by booking ID
        if (row.actualBookingId?.toString().toLowerCase().includes(query))
          return true;

        // Search by customer name
        if (row.customer_name?.toLowerCase().includes(query)) return true;

        // Search by car model
        if (row.car_model?.toLowerCase().includes(query)) return true;

        // Search by start date
        if (row.start_date?.toLowerCase().includes(query)) return true;

        // Search by end date
        if (row.end_date?.toLowerCase().includes(query)) return true;

        // Search by status
        if (row.booking_status?.toLowerCase().includes(query)) return true;

        // Search by purpose (for CANCELLATION tab)
        if (row.purpose?.toLowerCase().includes(query)) return true;

        // Search by new end date (for EXTENSION tab)
        if (row.new_end_date?.toLowerCase().includes(query)) return true;

        // Search by balance
        if (row.balance?.toString().toLowerCase().includes(query)) return true;

        return false;
      });
    }

    // Apply tab-specific filtering
    switch (activeTab) {
      case 'BOOKINGS':
        // Show all confirmed, pending, and in progress bookings
        return filteredData;
      case 'CANCELLATION':
        // Only show bookings where isCancel === 'TRUE'
        return filteredData.filter(
          (row) =>
            row.isCancel === true ||
            row.isCancel === 'true' ||
            row.isCancel === 'TRUE'
        );
      case 'EXTENSION':
        // Only show bookings where isExtend === 'TRUE'
        return filteredData.filter(
          (row) =>
            row.isExtend === true ||
            row.isExtend === 'true' ||
            row.isExtend === 'TRUE'
        );
      default:
        return filteredData;
    }
  };

  const fetchBookings = () => {
    setLoading(true);

    const authFetch = createAuthenticatedFetch(() => {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    });
    const API_BASE = getApiBase().replace(/\/$/, '');
    // Request all bookings by setting a large pageSize
    const bookingsUrl = `${API_BASE}/bookings?pageSize=1000`;

    authFetch(bookingsUrl, { headers: { Accept: 'application/json' } })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((response) => {
        // Helper to convert a datetime to YYYY-MM-DD (safe)
        const formatDateOnly = (value) => {
          if (!value) return '';
          const d = new Date(value);
          if (isNaN(d)) return value;
          return d.toISOString().split('T')[0];
        };

        // Handle paginated response - extract data array
        const bookingsData = Array.isArray(response)
          ? response
          : response.data || [];

        console.log('📊 Raw bookings data from backend:', bookingsData);

        let formattedData = bookingsData.map((item, index) => ({
          ...item,
          id: item.customerId || item.reservationId || `row-${index}`, // Add unique id property
          status: item.status ? 'Active' : 'Inactive',
          // Overwrite start/end/booking date to exclude time
          startDate: formatDateOnly(item.startDate),
          endDate: formatDateOnly(item.endDate),
          bookingDate: formatDateOnly(item.bookingDate),
        }));

        console.log('📋 All bookings before filtering:', formattedData.length);
        console.log(
          '📋 Booking statuses:',
          formattedData.map((b) => b.booking_status)
        );

        // Show all bookings including pending, confirmed, in progress, and ongoing status
        formattedData = formattedData.filter((b) => {
          const raw = (b.booking_status || b.status || '')
            .toString()
            .toLowerCase()
            .trim();
          // Include confirmed, pending, in progress, and ongoing bookings
          return (
            raw === 'confirmed' ||
            raw === 'pending' ||
            raw === 'in progress' ||
            raw === 'ongoing'
          );
        });

        console.log('✅ Bookings after filtering:', formattedData.length);
        console.log(
          '✅ Filtered booking statuses:',
          formattedData.map((b) => b.booking_status)
        );

        setRows(formattedData);
        setError(null);
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handlePaymentSuccess = () => {
    fetchBookings(); // Refresh the bookings list
    // Also refresh the selected booking if the modal is still open
    if (selectedBooking) {
      const authFetch = createAuthenticatedFetch(() => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      });
      const API_BASE = getApiBase().replace(/\/$/, '');

      authFetch(`${API_BASE}/bookings/${selectedBooking.booking_id}`)
        .then((response) => response.json())
        .then((updatedBooking) => {
          setSelectedBooking(updatedBooking);
        })
        .catch((err) => console.error('Error refreshing booking:', err));
    }
  };

  useEffect(() => {
    fetchBookings();
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
      <title>Booking Management</title>
      <ManageFeesModal
        show={showManageFeesModal}
        onClose={closeManageFeesModal}
      />
      <BookingDetailsModal
        open={showBookingDetailsModal}
        onClose={closeBookingDetailsModal}
        booking={selectedBooking}
        onPaymentSuccess={handlePaymentSuccess}
      />
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
          mt: { xs: '64px', sm: '64px', md: '56px', lg: '56px' }, // Adjust based on your header height
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
          <ManageBookingsHeader
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={getTabCounts()}
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
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                mb: 2,
                gap: { xs: 1, sm: 1 },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  flex: { md: 1 },
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flex: 1,
                    gap: { xs: 1, sm: 2 },
                    justifyContent: 'space-between',
                    width: '100%',
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
                    <HiBookOpen
                      style={{ verticalAlign: '-5px', marginRight: '5px' }}
                    />
                    {activeTab}
                  </Typography>

                  {activeTab === 'BOOKINGS' && (
                    <Button
                      variant="outlined"
                      startIcon={
                        <HiCurrencyDollar
                          sx={{
                            width: { xs: '14px', sm: '18px' },
                            height: { xs: '14px', sm: '18px' },
                            mt: '-3px',
                          }}
                        />
                      }
                      onClick={openManageFeesModal}
                      sx={{
                        color: '#fff',
                        p: 1,
                        fontSize: { xs: '.7rem', md: '.875rem' },
                        height: { xs: 26, md: 30 },
                        border: 'none',
                        backgroundColor: '#3895d3',
                        '&:hover': {
                          backgroundColor: '#1261a0',
                          color: '#fff',
                          fontWeight: 600,
                          borderColor: '#4a4a4a',
                          boxShadow: 'none',
                        },
                      }}
                    >
                      Manage Fees
                    </Button>
                  )}
                </Box>
              </Box>
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
                  placeholder={`Search ${activeTab.toLowerCase()}...`}
                  variant="outlined"
                  size="small"
                  sx={{
                    width: { xs: '100%', md: 350 },
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
              <ManageBookingsTable
                rows={getFilteredRows()}
                loading={loading}
                activeTab={activeTab}
                onViewDetails={openBookingDetailsModal}
                onDataChange={fetchBookings}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
