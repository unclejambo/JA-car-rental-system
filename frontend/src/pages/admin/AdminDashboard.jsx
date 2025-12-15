import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  DirectionsCar,
  Event,
  Person,
  TrendingUp,
  Schedule,
  CarRental,
  BookOnline,
  Cancel,
  Extension,
  Warning,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import AdminSideBar from '../../ui/components/AdminSideBar';
import Header from '../../ui/components/Header';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api';

function AdminDashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    forRelease: [],
    forReturn: [],
    weekSchedules: [],
    availableCars: [],
    bookingRequests: [],
    extensionCancellationRequests: [],
  });

  const API_BASE = getApiBase().replace(/\/$/, '');

  // Helper function to check if booking is a release candidate
  const isReleaseCandidate = (row) => {
    try {
      const status = (row.status || row.booking_status || '')
        .toString()
        .toLowerCase();
      if (status !== 'confirmed') return false;
      const pickup = row.pickup_time || row.start_date || row.startDate;
      if (!pickup) return false;
      const pickupTime = new Date(pickup);
      const now = new Date();
      const diff = pickupTime - now;
      const oneHourBefore = -60 * 60 * 1000;
      // within 1 hour before pickup or already passed
      return diff <= 60 * 60 * 1000 && diff >= oneHourBefore;
    } catch (e) {
      return false;
    }
  };

  // Helper function to check if booking is a return candidate
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

  // Helper function to get relative date label
  const getRelativeDateLabel = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate - today;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < -1 && diffDays >= -7)
      return `${Math.abs(diffDays)} days ago`;

    return targetDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const authFetch = createAuthenticatedFetch(() => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      });

      // Fetch all data in parallel
      const [schedules, availableCars, allBookings] = await Promise.all([
        authFetch(`${API_BASE}/schedules`).then(async (r) => {
          if (!r.ok) return [];
          const data = await r.json();
          return Array.isArray(data) ? data : data.data || [];
        }),
        authFetch(`${API_BASE}/cars/available`).then((r) =>
          r.ok ? r.json() : []
        ),
        authFetch(`${API_BASE}/bookings`).then(async (r) => {
          if (!r.ok) return [];
          const data = await r.json();
          return Array.isArray(data) ? data : data.data || [];
        }),
      ]);

      // Filter For Release bookings using release candidate logic
      const forRelease = Array.isArray(schedules)
        ? schedules
            .filter((schedule) => isReleaseCandidate(schedule))
            .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
        : [];

      // Filter For Return bookings using return candidate logic
      const forReturn = Array.isArray(schedules)
        ? schedules
            .filter((schedule) => isReturnCandidate(schedule))
            .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
        : [];

      // Filter schedules with 'Confirmed' and 'In Progress' statuses
      const weekSchedules = Array.isArray(schedules)
        ? schedules
            .filter((schedule) => {
              const status = schedule.booking_status?.toLowerCase();
              return status === 'confirmed' || status === 'in progress';
            })
            .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
            .slice(0, 10) // Limit to 10 most recent schedules
        : [];

      // Filter booking requests (pending status)
      const bookingRequests = Array.isArray(allBookings)
        ? allBookings
            .filter(
              (booking) =>
                booking.booking_status === 'Pending' ||
                booking.booking_status === 'pending'
            )
            .slice(0, 2)
        : [];

      // Filter extension/cancellation requests
      const extensionCancellationRequests = Array.isArray(allBookings)
        ? allBookings
            .filter((booking) => booking.isExtend || booking.isCancel)
            .slice(0, 2)
        : [];

      setDashboardData({
        forRelease,
        forReturn,
        weekSchedules,
        availableCars: Array.isArray(availableCars) ? availableCars : [],
        bookingRequests,
        extensionCancellationRequests,
      });
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <title>Dashboard</title>
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
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <title>Dashboard</title>
      <Header onMenuClick={() => setMobileOpen(true)} />
      <AdminSideBar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 0, sm: 2.5, md: 3 },
          width: '100%',
          maxWidth: '100%',
          ml: {
            xs: '0px',
            sm: '0px',
            md: '18.7dvw',
            lg: '18.7dvw',
          },
          '@media (max-width: 1024px)': {
            ml: '0px',
          },
          mt: { xs: '64px', sm: '64px', md: '56px', lg: '56px' },
          backgroundColor: '#fafafa',
          minHeight: '100vh',
        }}
      >
        {/* Welcome Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #c10007 0%, #8b0005 100%)',
            borderRadius: 3,
            p: { xs: 2, md: 2.5 },
            mb: 2,
            mx: { xs: 2, md: 0 },
            boxShadow: '0 2px 8px rgba(193, 0, 7, 0.2)',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#fff',
              mb: 0.5,
              fontSize: { xs: '1.25rem', md: '1.5rem' },
            }}
          >
            Admin Dashboard
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: { xs: '0.8rem', md: '0.875rem' },
            }}
          >
            Manage bookings, schedules, and monitor your rental operations
          </Typography>
        </Box>

        {/* Today's Actions Summary */}
        {(() => {
          const now = new Date();
          const startOfDay = new Date(now);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(now);
          endOfDay.setHours(23, 59, 59, 999);

          // Pickups Today = Cars scheduled for pickup today
          const pickupsToday = (dashboardData.forRelease || []).filter((s) => {
            const d = s.start_date || s.pickup_time;
            if (!d) return false;
            const dt = new Date(d);
            return dt >= startOfDay && dt <= endOfDay;
          }).length;

          // Delivery Today = Same as Pickups (cars being delivered to customers)
          const deliveryToday = pickupsToday;

          // Release Today = Cars being released from inventory (same as pickups)
          const releaseToday = pickupsToday;

          // Returns Today = Cars scheduled for return today
          const returnsToday = (dashboardData.forReturn || []).filter((s) => {
            const d = s.end_date || s.dropoff_time;
            if (!d) return false;
            const dt = new Date(d);
            return dt >= startOfDay && dt <= endOfDay;
          }).length;

          // Overdue Returns = Returns past due
          const overdueReturns = (dashboardData.forReturn || []).filter((s) => {
            const d = s.end_date || s.dropoff_time;
            if (!d) return false;
            return new Date(d) < now;
          }).length;

          // Pending Payments Today = Bookings with unpaid status due today
          const pendingPaymentsToday = (
            dashboardData.bookingRequests || []
          ).filter((b) => {
            const status = (
              b.payment_status ||
              b.booking_status ||
              ''
            ).toLowerCase();
            return status.includes('pending') || status.includes('unpaid');
          }).length;

          // Cars Availability Today = Total available cars
          const carsAvailabilityToday = Array.isArray(
            dashboardData.availableCars
          )
            ? dashboardData.availableCars.length
            : 0;

          return (
            <Grid
              container
              spacing={{ xs: 2, md: 2.5 }}
              sx={{ px: { xs: 2, md: 0 }, mb: { xs: 2, md: 3 } }}
            >
              <Grid item xs={12} sm={6} md={2}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 14px rgba(193,0,7,0.12)',
                    height: '100%',
                    minHeight: 140,
                    background:
                      'linear-gradient(135deg, #ffe3e6 0%, #ffc1c7 100%)',
                  }}
                >
                  <CardContent
                    sx={{
                      p: 2.5,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: '#7a0012',
                        mb: 1,
                        lineHeight: 1.2,
                      }}
                    >
                      Pickups Today
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: '2rem',
                        color: '#b30019',
                        mb: 1,
                      }}
                    >
                      {pickupsToday}
                    </Typography>
                    <Button
                      component={Link}
                      to="/schedule?tab=RELEASE"
                      size="small"
                      variant="text"
                      sx={{
                        color: '#7a0012',
                        textTransform: 'none',
                        p: 0,
                        minWidth: 0,
                        alignSelf: 'flex-start',
                      }}
                    >
                      View Schedule →
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 14px rgba(0,128,0,0.12)',
                    height: '100%',
                    minHeight: 140,
                    background:
                      'linear-gradient(135deg, #e3f8e8 0%, #c3f0d2 100%)',
                  }}
                >
                  <CardContent
                    sx={{
                      p: 2.5,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: '#1b5e20',
                        mb: 1,
                        lineHeight: 1.2,
                      }}
                    >
                      Delivery Today
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: '2rem',
                        color: '#1b8a3b',
                        mb: 1,
                      }}
                    >
                      {deliveryToday}
                    </Typography>
                    <Button
                      component={Link}
                      to="/schedule?tab=RELEASE"
                      size="small"
                      variant="text"
                      sx={{
                        color: '#1b5e20',
                        textTransform: 'none',
                        p: 0,
                        minWidth: 0,
                        alignSelf: 'flex-start',
                      }}
                    >
                      View Schedule →
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 14px rgba(25,118,210,0.14)',
                    height: '100%',
                    minHeight: 140,
                    background:
                      'linear-gradient(135deg, #e3f2fd 0%, #cddff8 100%)',
                  }}
                >
                  <CardContent
                    sx={{
                      p: 2.5,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: '#0d47a1',
                        mb: 1,
                        lineHeight: 1.2,
                      }}
                    >
                      Release Today
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: '2rem',
                        color: '#1565c0',
                        mb: 1,
                      }}
                    >
                      {releaseToday}
                    </Typography>
                    <Button
                      component={Link}
                      to="/schedule?tab=RELEASE"
                      size="small"
                      variant="text"
                      sx={{
                        color: '#0d47a1',
                        textTransform: 'none',
                        p: 0,
                        minWidth: 0,
                        alignSelf: 'flex-start',
                      }}
                    >
                      View Schedule →
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    height: '100%',
                    minHeight: 140,
                  }}
                >
                  <CardContent
                    sx={{
                      p: 2.5,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: '#616161',
                        mb: 1,
                        lineHeight: 1.2,
                      }}
                    >
                      Return Today
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: '2rem',
                        color: '#1a1a1a',
                        mb: 1,
                      }}
                    >
                      {returnsToday}
                    </Typography>
                    <Button
                      component={Link}
                      to="/schedule?tab=RETURN"
                      size="small"
                      variant="text"
                      sx={{
                        color: '#1a1a1a',
                        textTransform: 'none',
                        p: 0,
                        minWidth: 0,
                        alignSelf: 'flex-start',
                      }}
                    >
                      View Schedule →
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 14px rgba(211,47,47,0.14)',
                    height: '100%',
                    minHeight: 140,
                    background:
                      'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                  }}
                >
                  <CardContent
                    sx={{
                      p: 2.5,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: '#b71c1c',
                        mb: 1,
                        lineHeight: 1.2,
                      }}
                    >
                      Overdue Returns
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: '2rem',
                        color: '#d32f2f',
                        mb: 1,
                      }}
                    >
                      {overdueReturns}
                    </Typography>
                    <Button
                      component={Link}
                      to="/schedule?tab=RETURN"
                      size="small"
                      variant="text"
                      sx={{
                        color: '#b71c1c',
                        textTransform: 'none',
                        p: 0,
                        minWidth: 0,
                        alignSelf: 'flex-start',
                      }}
                    >
                      View Schedule →
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 14px rgba(237,108,2,0.14)',
                    height: '100%',
                    minHeight: 140,
                    background:
                      'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                  }}
                >
                  <CardContent
                    sx={{
                      p: 2.5,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: '#e65100',
                        mb: 1,
                        lineHeight: 1.2,
                      }}
                    >
                      Pending Payments
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: '2rem',
                        color: '#f57c00',
                        mb: 1,
                      }}
                    >
                      {pendingPaymentsToday}
                    </Typography>
                    <Button
                      component={Link}
                      to="/manage-booking"
                      size="small"
                      variant="text"
                      sx={{
                        color: '#e65100',
                        textTransform: 'none',
                        p: 0,
                        minWidth: 0,
                        alignSelf: 'flex-start',
                      }}
                    >
                      Review Payments →
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 14px rgba(2,136,209,0.14)',
                    height: '100%',
                    minHeight: 140,
                    background:
                      'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)',
                  }}
                >
                  <CardContent
                    sx={{
                      p: 2.5,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: '#01579b',
                        mb: 1,
                        lineHeight: 1.2,
                      }}
                    >
                      Cars Availability
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: '2rem',
                        color: '#0288d1',
                        mb: 1,
                      }}
                    >
                      {carsAvailabilityToday}
                    </Typography>
                    <Button
                      component={Link}
                      to="/manage-car"
                      size="small"
                      variant="text"
                      sx={{
                        color: '#01579b',
                        textTransform: 'none',
                        p: 0,
                        minWidth: 0,
                        alignSelf: 'flex-start',
                      }}
                    >
                      View Cars →
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          );
        })()}

        {/* For Release and For Return Section */}
        <Grid
          container
          spacing={{ xs: 0, md: 2 }}
          sx={{
            mb: { xs: 1, md: 2 },
            px: { xs: 2, md: 0 },
            display: 'flex',
            justifyContent: { xs: 'center', md: 'space-between' },
            gap: { xs: 2, md: 1 },
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          {/* For Release */}
          <Grid item xs={12} md={6} sx={{ flex: { md: 1 } }}>
            <Card
              sx={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                height: '100%',
                minHeight: { xs: 'auto', md: 300 },
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              {/* Gradient Header */}
              <Box
                sx={{
                  background:
                    'linear-gradient(135deg, #c10007 0%, #8b0005 100%)',
                  p: { xs: 2, md: 2.5 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      width: { xs: 40, md: 48 },
                      height: { xs: 40, md: 48 },
                    }}
                  >
                    <CarRental
                      sx={{ fontSize: { xs: 20, md: 24 }, color: '#fff' }}
                    />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: '#fff',
                        fontSize: { xs: '1.125rem', md: '1.25rem' },
                      }}
                    >
                      FOR RELEASE
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                      }}
                    >
                      Pending vehicle releases
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  {(() => {
                    const now = new Date();
                    const upcoming = dashboardData.forRelease.filter(
                      (b) => new Date(b.start_date) >= now
                    ).length;
                    const overdue = dashboardData.forRelease.filter(
                      (b) => new Date(b.start_date) < now
                    ).length;
                    const label =
                      upcoming > 0 && overdue > 0
                        ? `${upcoming} Upcoming, ${overdue} Overdue`
                        : upcoming > 0
                          ? `${upcoming} Upcoming`
                          : overdue > 0
                            ? `${overdue} Overdue`
                            : '0';
                    return (
                      <Chip
                        label={label}
                        sx={{
                          bgcolor:
                            overdue > 0
                              ? 'rgba(255, 152, 0, 0.9)'
                              : 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          fontWeight: 'bold',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                        }}
                        size="small"
                      />
                    );
                  })()}
                </Box>
              </Box>

              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                {dashboardData.forRelease.length > 0 ? (
                  <TableContainer
                    component={Paper}
                    sx={{
                      boxShadow: 0,
                      border: '1px solid #e0e0e0',
                      maxHeight: { xs: 250, md: 300 },
                      overflowX: 'auto',
                    }}
                  >
                    <Table size="small" sx={{ borderCollapse: 'separate' }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                          <TableCell
                            sx={{
                              fontWeight: 'bold',
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Customer
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 'bold',
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Car
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 'bold',
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Release Time
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 'bold',
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Status
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboardData.forRelease.map((booking) => {
                          const now = new Date();
                          const startDate = new Date(booking.start_date);
                          // Overdue if pickup time has passed
                          const isOverdue = startDate < now;

                          return (
                            <TableRow
                              key={booking.booking_id}
                              sx={{
                                '&:hover': { bgcolor: '#f5f5f5' },
                                bgcolor: isOverdue ? '#ffe6e6' : '#fff5f5',
                              }}
                            >
                              <TableCell
                                sx={{
                                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                  }}
                                >
                                  {isOverdue && (
                                    <Warning
                                      sx={{ fontSize: 16, color: '#ff9800' }}
                                    />
                                  )}
                                  {booking.customer_name || 'N/A'}
                                </Box>
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                                }}
                              >
                                {booking.car_model || 'N/A'}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                                  color: isOverdue ? '#d32f2f' : 'inherit',
                                  fontWeight: isOverdue ? 600 : 400,
                                }}
                              >
                                {new Date(
                                  booking.pickup_time || booking.start_date
                                ).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                                }}
                              >
                                <Chip
                                  label={isOverdue ? 'OVERDUE' : 'UPCOMING'}
                                  size="small"
                                  icon={
                                    isOverdue ? (
                                      <Warning
                                        sx={{ fontSize: '14px !important' }}
                                      />
                                    ) : undefined
                                  }
                                  sx={{
                                    bgcolor: isOverdue ? '#ff9800' : '#4caf50',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '0.65rem',
                                    height: 20,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      textAlign: 'center',
                      py: { xs: 2, md: 3 },
                      fontSize: { xs: '0.875rem', md: '1rem' },
                    }}
                  >
                    No upcoming releases
                  </Typography>
                )}

                <Button
                  component={Link}
                  to="/schedule"
                  variant="outlined"
                  fullWidth
                  sx={{
                    mt: { xs: 1.5, md: 2 },
                    borderColor: '#c10007',
                    color: '#c10007',
                    '&:hover': {
                      borderColor: '#a00006',
                      bgcolor: 'rgba(193, 0, 7, 0.04)',
                    },
                    py: { xs: 0.5, md: 1 },
                  }}
                >
                  View All Releases
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* For Return */}
          <Grid item xs={12} md={6} sx={{ flex: { md: 1 } }}>
            <Card
              sx={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                height: '100%',
                minHeight: { xs: 'auto', md: 300 },
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              {/* Gradient Header */}
              <Box
                sx={{
                  background:
                    'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
                  p: { xs: 2, md: 2.5 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      width: { xs: 40, md: 48 },
                      height: { xs: 40, md: 48 },
                    }}
                  >
                    <Event
                      sx={{ fontSize: { xs: 20, md: 24 }, color: '#fff' }}
                    />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: '#fff',
                        fontSize: { xs: '1.125rem', md: '1.25rem' },
                      }}
                    >
                      FOR RETURN
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                      }}
                    >
                      Completed returns
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  {(() => {
                    const now = new Date();
                    const upcoming = dashboardData.forReturn.filter(
                      (b) => new Date(b.end_date) >= now
                    ).length;
                    const overdue = dashboardData.forReturn.filter(
                      (b) => new Date(b.end_date) < now
                    ).length;
                    const label =
                      upcoming > 0 && overdue > 0
                        ? `${upcoming} Upcoming, ${overdue} Overdue`
                        : upcoming > 0
                          ? `${upcoming} Upcoming`
                          : overdue > 0
                            ? `${overdue} Overdue`
                            : '0';
                    return (
                      <Chip
                        label={label}
                        sx={{
                          bgcolor:
                            overdue > 0
                              ? 'rgba(255, 152, 0, 0.9)'
                              : 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          fontWeight: 'bold',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                        }}
                        size="small"
                      />
                    );
                  })()}
                </Box>
              </Box>

              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                {dashboardData.forReturn.length > 0 ? (
                  <TableContainer
                    component={Paper}
                    sx={{
                      boxShadow: 0,
                      border: '1px solid #e0e0e0',
                      maxHeight: { xs: 250, md: 300 },
                      overflowX: 'auto',
                    }}
                  >
                    <Table size="small" sx={{ borderCollapse: 'separate' }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                          <TableCell
                            sx={{
                              fontWeight: 'bold',
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Customer
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 'bold',
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Car
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 'bold',
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Return Time
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 'bold',
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Status
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboardData.forReturn.map((booking) => {
                          const now = new Date();
                          const endDate = new Date(booking.end_date);
                          // Overdue if return time has passed
                          const isOverdue = endDate < now;

                          return (
                            <TableRow
                              key={booking.booking_id}
                              sx={{
                                '&:hover': { bgcolor: '#f5f5f5' },
                                bgcolor: isOverdue ? '#ffe6e6' : '#fff5f5',
                              }}
                            >
                              <TableCell
                                sx={{
                                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                  }}
                                >
                                  {isOverdue && (
                                    <Warning
                                      sx={{ fontSize: 16, color: '#ff9800' }}
                                    />
                                  )}
                                  {booking.customer_name || 'N/A'}
                                </Box>
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                                }}
                              >
                                {booking.car_model || 'N/A'}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                                  color: isOverdue ? '#d32f2f' : 'inherit',
                                  fontWeight: isOverdue ? 600 : 400,
                                }}
                              >
                                {new Date(
                                  booking.dropoff_time || booking.end_date
                                ).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                                }}
                              >
                                <Chip
                                  label={isOverdue ? 'OVERDUE' : 'UPCOMING'}
                                  size="small"
                                  icon={
                                    isOverdue ? (
                                      <Warning
                                        sx={{ fontSize: '14px !important' }}
                                      />
                                    ) : undefined
                                  }
                                  sx={{
                                    bgcolor: isOverdue ? '#ff9800' : '#4caf50',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '0.65rem',
                                    height: 20,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      textAlign: 'center',
                      py: { xs: 2, md: 3 },
                      fontSize: { xs: '0.875rem', md: '1rem' },
                    }}
                  >
                    No upcoming returns
                  </Typography>
                )}

                <Button
                  component={Link}
                  to="/schedule"
                  variant="outlined"
                  fullWidth
                  sx={{
                    mt: { xs: 1.5, md: 2 },
                    borderColor: '#000',
                    color: '#000',
                    '&:hover': {
                      borderColor: '#333',
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                    py: { xs: 0.5, md: 1 },
                  }}
                >
                  View All Returns
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Schedule & Available Cars */}
        <Grid
          container
          spacing={{ xs: 0, md: 2 }}
          sx={{
            mb: { xs: 1, md: 2 },
            px: { xs: 2, md: 0 },
            display: 'flex',
            justifyContent: { xs: 'center', md: 'space-between' },
            gap: { xs: 2, md: 1 },
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          {/* Weekly Schedule Table */}
          <Grid item xs={12} md={6} sx={{ flex: { md: 1 } }}>
            <Card
              sx={{
                height: '100%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                minHeight: { xs: 'auto', md: 450 },
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              {/* Gradient Header */}
              <Box
                sx={{
                  background:
                    'linear-gradient(135deg, #c10007 0%, #8b0005 100%)',
                  p: { xs: 2, md: 2.5 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      width: { xs: 40, md: 48 },
                      height: { xs: 40, md: 48 },
                    }}
                  >
                    <Schedule
                      sx={{ fontSize: { xs: 20, md: 24 }, color: '#fff' }}
                    />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: '#fff',
                        fontSize: { xs: '1rem', md: '1.25rem' },
                      }}
                    >
                      ACTIVE BOOKINGS
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                      }}
                    >
                      Confirmed and in-progress rentals
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={`${dashboardData.weekSchedules.length} Active`}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                  size="small"
                />
              </Box>

              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                {dashboardData.weekSchedules.length > 0 ? (
                  <TableContainer
                    component={Paper}
                    sx={{
                      boxShadow: 0,
                      border: '1px solid #e0e0e0',
                      maxHeight: { xs: 300, md: 400 },
                      overflowX: 'auto',
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                          <TableCell
                            sx={{
                              fontWeight: 'bold',
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                            }}
                          >
                            Customer
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 'bold',
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                            }}
                          >
                            Car
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 'bold',
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                            }}
                          >
                            Status
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboardData.weekSchedules.map((schedule) => {
                          const relativeDate = getRelativeDateLabel(
                            schedule.start_date
                          );
                          const isToday = relativeDate === 'Today';
                          const isTomorrow = relativeDate === 'Tomorrow';
                          const isInProgress =
                            schedule.booking_status?.toLowerCase() ===
                            'in progress';

                          return (
                            <TableRow
                              key={schedule.booking_id}
                              sx={{
                                '&:hover': { bgcolor: '#f5f5f5' },
                                bgcolor: isInProgress
                                  ? '#e8f5e9'
                                  : isToday
                                    ? '#fff5f5'
                                    : isTomorrow
                                      ? '#fffbf0'
                                      : 'inherit',
                              }}
                            >
                              <TableCell
                                sx={{
                                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                                }}
                              >
                                {schedule.customer_name || 'N/A'}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                                }}
                              >
                                {schedule.car_model || 'N/A'}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                                }}
                              >
                                <Chip
                                  label={schedule.booking_status || 'N/A'}
                                  size="small"
                                  sx={{
                                    bgcolor: isInProgress
                                      ? '#4caf50'
                                      : '#2196f3',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: { xs: '0.65rem', md: '0.75rem' },
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      textAlign: 'center',
                      py: { xs: 2, md: 3 },
                      fontSize: { xs: '0.875rem', md: '1rem' },
                    }}
                  >
                    No schedules for this week
                  </Typography>
                )}

                <Button
                  component={Link}
                  to="/schedule"
                  variant="outlined"
                  fullWidth
                  sx={{
                    mt: { xs: 1.5, md: 2 },
                    borderColor: '#c10007',
                    color: '#c10007',
                    '&:hover': {
                      borderColor: '#a00006',
                      bgcolor: 'rgba(193, 0, 7, 0.04)',
                    },
                    py: { xs: 1, md: 1.5 },
                  }}
                >
                  View All Schedules
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Available Cars */}
          <Grid item xs={12} md={6} sx={{ flex: { md: 1 } }}>
            <Card
              sx={{
                height: '100%',
                flex: 1,
                minWidth: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                minHeight: { xs: 'auto', md: 450 },
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              {/* Gradient Header */}
              <Box
                sx={{
                  background:
                    'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
                  p: { xs: 2, md: 2.5 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      width: { xs: 40, md: 48 },
                      height: { xs: 40, md: 48 },
                    }}
                  >
                    <CarRental
                      sx={{ fontSize: { xs: 20, md: 24 }, color: '#fff' }}
                    />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: '#fff',
                        fontSize: { xs: '1rem', md: '1.25rem' },
                      }}
                    >
                      AVAILABLE CARS
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                      }}
                    >
                      Ready for booking
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={`${dashboardData.availableCars.length} Cars`}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                  size="small"
                />
              </Box>

              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                {dashboardData.availableCars.length > 0 ? (
                  <List
                    sx={{
                      py: 0,
                      maxHeight: { xs: 250, md: 300 },
                      overflow: 'auto',
                    }}
                  >
                    {dashboardData.availableCars.map((car, index) => (
                      <ListItem
                        key={car.car_id}
                        sx={{
                          bgcolor: '#f9f9f9',
                          borderRadius: 1,
                          mb:
                            index < dashboardData.availableCars.length - 1
                              ? 1
                              : 0,
                          border: '1px solid #e0e0e0',
                          p: { xs: 0.85, md: 1.25 },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: '#000',
                              width: { xs: 36, md: 40 },
                              height: { xs: 36, md: 40 },
                            }}
                          >
                            <DirectionsCar
                              sx={{ fontSize: { xs: 18, md: 20 } }}
                            />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${car.make} ${car.model}`}
                          secondary={`${car.year} - ${car.car_type || 'N/A'}`}
                          primaryTypographyProps={{
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            fontWeight: 500,
                          }}
                          secondaryTypographyProps={{
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      textAlign: 'center',
                      py: { xs: 2, md: 3 },
                      fontSize: { xs: '0.875rem', md: '1rem' },
                    }}
                  >
                    No available cars
                  </Typography>
                )}

                <Button
                  component={Link}
                  to="/manage-car"
                  variant="outlined"
                  fullWidth
                  sx={{
                    mt: { xs: 1.5, md: 2 },
                    borderColor: '#000',
                    color: '#000',
                    '&:hover': {
                      borderColor: '#333',
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                    py: { xs: 1, md: 1.5 },
                  }}
                >
                  More Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Bottom Section - Requests */}
        <Grid
          container
          spacing={{ xs: 0, md: 2 }}
          sx={{
            px: { xs: 2, md: 0 },
            display: 'flex',
            justifyContent: { xs: 'center', md: 'space-between' },
            gap: { xs: 2, md: 1 },
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          {/* Booking Requests */}
          <Grid item xs={12} md={6} sx={{ flex: { md: 1 } }}>
            <Card
              sx={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                minHeight: { xs: 'auto', md: 400 },
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              {/* Gradient Header */}
              <Box
                sx={{
                  background:
                    'linear-gradient(135deg, #c10007 0%, #8b0005 100%)',
                  p: { xs: 2, md: 2.5 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      width: { xs: 40, md: 48 },
                      height: { xs: 40, md: 48 },
                    }}
                  >
                    <BookOnline
                      sx={{ fontSize: { xs: 20, md: 24 }, color: '#fff' }}
                    />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: '#fff',
                        fontSize: { xs: '1rem', md: '1.25rem' },
                      }}
                    >
                      BOOKING REQUESTS
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                      }}
                    >
                      Pending approvals
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={`${dashboardData.bookingRequests.length} Pending`}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                  size="small"
                />
              </Box>

              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                {dashboardData.bookingRequests.length > 0 ? (
                  <List sx={{ py: 0 }}>
                    {dashboardData.bookingRequests.map((booking, index) => (
                      <ListItem
                        key={booking.booking_id}
                        sx={{
                          bgcolor: '#fff5f5',
                          borderRadius: 1,
                          mb:
                            index < dashboardData.bookingRequests.length - 1
                              ? 1
                              : 0,
                          border: '1px solid #ffcccb',
                          p: { xs: 1, md: 2 },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: '#c10007',
                              width: { xs: 36, md: 40 },
                              height: { xs: 36, md: 40 },
                            }}
                          >
                            <BookOnline sx={{ fontSize: { xs: 18, md: 20 } }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${booking.customer_name || 'N/A'}`}
                          secondary={`${booking.car_model || 'N/A'} - ${new Date(
                            booking.booking_date
                          ).toLocaleDateString()}`}
                          primaryTypographyProps={{
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            fontWeight: 500,
                          }}
                          secondaryTypographyProps={{
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      textAlign: 'center',
                      py: { xs: 2, md: 3 },
                      fontSize: { xs: '0.875rem', md: '1rem' },
                    }}
                  >
                    No booking requests.
                  </Typography>
                )}

                <Button
                  component={Link}
                  to="/manage-booking"
                  variant="outlined"
                  fullWidth
                  sx={{
                    mt: { xs: 1.5, md: 2 },
                    borderColor: '#c10007',
                    color: '#c10007',
                    '&:hover': {
                      borderColor: '#a00006',
                      bgcolor: 'rgba(193, 0, 7, 0.04)',
                    },
                    py: { xs: 1, md: 1.5 },
                  }}
                >
                  More Details
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Extension/Cancellation Requests */}
          <Grid item xs={12} md={6} sx={{ flex: { md: 1 } }}>
            <Card
              sx={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                minHeight: { xs: 'auto', md: 400 },
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              {/* Gradient Header */}
              <Box
                sx={{
                  background:
                    'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
                  p: { xs: 2, md: 2.5 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      width: { xs: 40, md: 48 },
                      height: { xs: 40, md: 48 },
                    }}
                  >
                    <Extension
                      sx={{ fontSize: { xs: 20, md: 24 }, color: '#fff' }}
                    />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: '#fff',
                        fontSize: { xs: '1rem', md: '1.25rem' },
                      }}
                    >
                      EXTENSION/CANCELLATION
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                      }}
                    >
                      Pending requests
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={`${dashboardData.extensionCancellationRequests.length} Pending`}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                  size="small"
                />
              </Box>

              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                {dashboardData.extensionCancellationRequests.length > 0 ? (
                  <List sx={{ py: 0 }}>
                    {dashboardData.extensionCancellationRequests.map(
                      (booking, index) => (
                        <ListItem
                          key={booking.booking_id}
                          sx={{
                            bgcolor: '#f5f5f5',
                            borderRadius: 1,
                            mb:
                              index <
                              dashboardData.extensionCancellationRequests
                                .length -
                                1
                                ? 1
                                : 0,
                            border: '1px solid #e0e0e0',
                            p: { xs: 0.85, md: 1.25 },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor: '#000',
                                width: { xs: 36, md: 40 },
                                height: { xs: 36, md: 40 },
                              }}
                            >
                              {booking.isCancel ? (
                                <Cancel sx={{ fontSize: { xs: 18, md: 20 } }} />
                              ) : (
                                <Extension
                                  sx={{ fontSize: { xs: 18, md: 20 } }}
                                />
                              )}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`${booking.customer_name || 'N/A'}`}
                            secondary={`${booking.car_model || 'N/A'} - ${
                              booking.isCancel ? 'Cancellation' : 'Extension'
                            }`}
                            primaryTypographyProps={{
                              fontSize: { xs: '0.875rem', md: '1rem' },
                              fontWeight: 500,
                            }}
                            secondaryTypographyProps={{
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                            }}
                          />
                        </ListItem>
                      )
                    )}
                  </List>
                ) : (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      textAlign: 'center',
                      py: { xs: 2, md: 3 },
                      fontSize: { xs: '0.875rem', md: '1rem' },
                    }}
                  >
                    No extension/cancellation requests.
                  </Typography>
                )}

                <Button
                  component={Link}
                  to="/manage-booking"
                  variant="outlined"
                  fullWidth
                  sx={{
                    mt: { xs: 1.5, md: 2 },
                    borderColor: '#000',
                    color: '#000',
                    '&:hover': {
                      borderColor: '#333',
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                    py: { xs: 1, md: 1.5 },
                  }}
                >
                  More Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default AdminDashboard;
