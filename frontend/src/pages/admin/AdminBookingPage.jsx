import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Button, Avatar } from '@mui/material';
import { BookOnline } from '@mui/icons-material';
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
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for tab query parameter
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['BOOKINGS', 'CANCELLATION', 'EXTENSION'].includes(tab)) {
      return tab;
    }
    return 'BOOKINGS';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [showManageFeesModal, setShowManageFeesModal] = useState(false);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const openManageFeesModal = () => setShowManageFeesModal(true);
  const closeManageFeesModal = () => setShowManageFeesModal(false);

  const openBookingDetailsModal = async (booking) => {
    setShowBookingDetailsModal(true);
    setSelectedBooking(booking); // Set initial data to prevent flash of empty content

    // Fetch complete booking data with all car details
    try {
      const authFetch = createAuthenticatedFetch(() => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      });
      const API_BASE = getApiBase().replace(/\/$/, '');

      const response = await authFetch(
        `${API_BASE}/bookings/${booking.booking_id}`
      );
      if (response.ok) {
        const completeBooking = await response.json();
        setSelectedBooking(completeBooking);
      }
    } catch (err) {
      console.error('Failed to fetch complete booking details:', err);
      // Keep the initial booking data if fetch fails
    }
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
        // Extension bookings (isExtend=true) will also appear here
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

        let formattedData = bookingsData.map((item, index) => ({
          ...item,
          id: item.customerId || item.reservationId || `row-${index}`, // Add unique id property
          status: item.status ? 'Active' : 'Inactive',
          // Overwrite start/end/booking date to exclude time
          startDate: formatDateOnly(item.startDate),
          endDate: formatDateOnly(item.endDate),
          bookingDate: formatDateOnly(item.bookingDate),
        }));

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

        // Collapse grouped bookings into a single summary row per group for admin view
        const singles = [];
        const groupMap = new Map();

        for (const b of formattedData) {
          const groupId = b.booking_group_id;
          if (!groupId) {
            singles.push(b);
            continue;
          }

          const entry = groupMap.get(groupId) || {
            groupId,
            booking_count: 0,
            total_amount: 0,
            balance: 0,
            start_date: null,
            end_date: null,
            customer_name: b.customer_name,
            car_models: [],
            childBookings: [],
          };

          entry.booking_count += 1;
          entry.total_amount += Number(
            b.total_amount || b.total_rental_amount || 0
          );
          entry.balance += Number(b.balance || 0);
          entry.start_date = !entry.start_date
            ? b.start_date
            : [entry.start_date, b.start_date].sort()[0];
          entry.end_date = !entry.end_date
            ? b.end_date
            : [entry.end_date, b.end_date].sort().slice(-1)[0];
          if (b.car_model) entry.car_models.push(b.car_model);
          entry.childBookings.push(b);

          groupMap.set(groupId, entry);
        }

        const groupedRows = Array.from(groupMap.values()).map((g) => {
          const firstChild = g.childBookings[0] || {};
          const carSummary =
            g.car_models.length === 1
              ? `${g.car_models[0]} (Group of 1)`
              : `Group (${g.booking_count} vehicles)`;

          const childPaid = g.childBookings.some(
            (cb) =>
              cb.isPay === true || cb.isPay === 'true' || cb.isPay === 'TRUE'
          );

          return {
            // Use first child's booking_id for detail fetch compatibility
            booking_id: firstChild.booking_id,
            // Provide a custom display id for the table
            actualBookingId: `G${g.groupId}`,
            customer_name: g.customer_name,
            car_model: carSummary,
            start_date: g.start_date,
            end_date: g.end_date,
            total_amount: g.total_amount,
            balance: g.balance,
            booking_status: firstChild.booking_status || 'grouped',
            isGroup: true,
            isPay: childPaid ? 'TRUE' : 'FALSE',
            booking_group_id: g.groupId,
            child_bookings: g.childBookings,
          };
        });

        setRows([...groupedRows, ...singles]);
        setError(null);
      })
      .catch((err) => {
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
        .catch((err) => {
          // Error refreshing booking
        });
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
          {/* Welcome Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #c10007 0%, #8b0005 100%)',
              borderRadius: 3,
              p: { xs: 2.5, md: 3 },
              mb: 3,
              boxShadow: '0 4px 12px rgba(193, 0, 7, 0.15)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  width: { xs: 56, md: 64 },
                  height: { xs: 56, md: 64 },
                }}
              >
                <BookOnline
                  sx={{ fontSize: { xs: 32, md: 40 }, color: '#fff' }}
                />
              </Avatar>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: '#fff',
                    fontSize: { xs: '1.5rem', md: '2rem' },
                    mb: 0.5,
                  }}
                >
                  Booking Management
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: { xs: '0.875rem', md: '1rem' },
                  }}
                >
                  Manage bookings, extensions, and cancellations
                </Typography>
              </Box>
            </Box>
          </Box>

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
