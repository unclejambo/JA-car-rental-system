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
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import AdminSideBar from '../../ui/components/AdminSideBar';
import Header from '../../ui/components/Header';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api';

function AdminDashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    mostRentedCar: null,
    topCustomers: [],
    weekSchedules: [],
    availableCars: [],
    bookingRequests: [],
    extensionCancellationRequests: [],
  });

  const API_BASE = getApiBase().replace(/\/$/, '');

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
      const [
        carsUtilization,
        topCustomers,
        schedules,
        availableCars,
        allBookings,
      ] = await Promise.all([
        authFetch(`${API_BASE}/analytics/cars/utilization?period=30`).then(
          (r) => (r.ok ? r.json() : [])
        ),
        authFetch(`${API_BASE}/analytics/customers/top?period=30`).then((r) =>
          r.ok ? r.json() : []
        ),
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
        mostRentedCar:
          Array.isArray(carsUtilization) && carsUtilization.length > 0
            ? carsUtilization[0]
            : null,
        topCustomers: Array.isArray(topCustomers)
          ? topCustomers.slice(0, 5)
          : [],
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
        {/* Top Section - Featured Content */}
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
          {/* Most Rented Car */}
          <Grid item xs={12} md={6} sx={{ flex: { md: 1 } }}>
            <Card
              sx={{
                boxShadow: 2,
                height: '100%',
                minHeight: { xs: 'auto', md: 300 },
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    alignItems: 'start',
                    mb: { xs: 1.5, md: 2 },
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: '#c10007',
                      width: { xs: 40, md: 48 },
                      height: { xs: 40, md: 48 },
                    }}
                  >
                    <DirectionsCar sx={{ fontSize: { xs: 20, md: 24 } }} />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        mb: 0.5,
                        fontSize: { xs: '1.125rem', md: '1.25rem' },
                        color: '#000',
                      }}
                    >
                      MOST RENTED CAR
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        color: 'text.secondary',
                      }}
                    >
                      LAST 30 DAYS
                    </Typography>
                  </Box>
                </Box>

                {dashboardData.mostRentedCar ? (
                  <>
                    {/* Car Image */}
                    {dashboardData.mostRentedCar.carImgUrl ? (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: { xs: 1, md: 2 },
                        }}
                      >
                        <Box
                          sx={{
                            width: '50%',
                            height: { xs: 140, md: 180 },
                            borderRadius: 2,
                            overflow: 'hidden',
                            mb: { xs: 0.5, md: 1 },
                            border: '2px solid #e0e0e0',
                          }}
                        >
                          <img
                            src={dashboardData.mostRentedCar.carImgUrl}
                            alt={`${dashboardData.mostRentedCar.make} ${dashboardData.mostRentedCar.model}`}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.style.display = 'none';
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        </Box>
                        <Box>
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 'bold',
                              fontSize: { xs: '1.25rem', md: '1.5rem' },
                              color: '#000',
                              mb: 0.5,
                            }}
                          >
                            {dashboardData.mostRentedCar.make}{' '}
                            {dashboardData.mostRentedCar.model}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              mb: 0.5,
                              fontSize: { xs: '0.875rem', md: '1rem' },
                              color: 'text.secondary',
                            }}
                          >
                            {dashboardData.mostRentedCar.year || 'N/A'} •{' '}
                            {dashboardData.mostRentedCar.carType || 'N/A'}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 'bold',
                              fontSize: { xs: '0.875rem', md: '.975rem' },
                              color: '#c10007',
                              mb: 0.5,
                            }}
                          >
                            {dashboardData.mostRentedCar.bookingCount} BOOKINGS
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: { xs: 180, md: 220 },
                          borderRadius: 2,
                          mb: { xs: 1.5, md: 2 },
                          border: '2px solid #e0e0e0',
                          bgcolor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <DirectionsCar
                          sx={{
                            fontSize: { xs: 80, md: 100 },
                            color: '#c0c0c0',
                          }}
                        />
                      </Box>
                    )}

                    {/* Car Details */}
                    <Box>
                      <Divider sx={{ my: { xs: 0.75, md: 1 } }} />
                      <Button
                        component={Link}
                        to="/report-analytics"
                        state={{ primaryView: 'topCars' }}
                        variant="contained"
                        fullWidth
                        sx={{
                          bgcolor: '#c10007',
                          color: 'white',
                          '&:hover': { bgcolor: '#a00006' },
                          py: { xs: 0.5, md: 1 },
                        }}
                      >
                        View Analytics
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Typography
                    sx={{
                      my: { xs: 2, md: 3 },
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      color: 'text.secondary',
                      textAlign: 'center',
                    }}
                  >
                    No data available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Top Customers Table */}
          <Grid item xs={12} md={6} sx={{ flex: { md: 1 } }}>
            <Card
              sx={{
                boxShadow: 2,
                height: '100%',
                minHeight: { xs: 'auto', md: 300 },
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: { xs: 1.5, md: 2 },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 0.5, md: 1 },
                    }}
                  >
                    <Person
                      sx={{ color: '#000', fontSize: { xs: 24, md: 28 } }}
                    />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: { xs: '1.125rem', md: '1.25rem' },
                      }}
                    >
                      TOP CUSTOMERS
                    </Typography>
                  </Box>
                  <Chip
                    label="LAST 30 DAYS"
                    sx={{ bgcolor: '#000', color: 'white', fontWeight: 'bold' }}
                    size="small"
                  />
                </Box>
                <Divider
                  sx={{ mb: { xs: 1.5, md: 2 }, borderColor: '#e0e0e0' }}
                />

                {dashboardData.topCustomers.length > 0 ? (
                  <TableContainer
                    component={Paper}
                    sx={{
                      boxShadow: 0,
                      border: '1px solid #e0e0e0',
                      overflowX: 'auto',
                    }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                          <TableCell
                            sx={{
                              fontWeight: 'bold',
                              fontSize: { xs: '0.875rem', md: '1rem' },
                            }}
                          >
                            Rank
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 'bold',
                              fontSize: { xs: '0.875rem', md: '1rem' },
                            }}
                          >
                            Customer Name
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 'bold',
                              fontSize: { xs: '0.875rem', md: '1rem' },
                            }}
                          >
                            Total Bookings
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboardData.topCustomers.map((customer, index) => (
                          <TableRow
                            key={customer.customerId}
                            sx={{
                              '&:hover': { bgcolor: '#f5f5f5' },
                              bgcolor: index === 0 ? '#fff5f5' : 'inherit',
                            }}
                          >
                            <TableCell
                              sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                            >
                              <Chip
                                label={`#${index + 1}`}
                                size="small"
                                sx={{
                                  bgcolor:
                                    index === 0
                                      ? '#c10007'
                                      : index === 1
                                        ? '#666'
                                        : '#999',
                                  color: 'white',
                                  fontWeight: 'bold',
                                }}
                              />
                            </TableCell>
                            <TableCell
                              sx={{
                                fontSize: { xs: '0.875rem', md: '1rem' },
                                fontWeight: index === 0 ? 600 : 400,
                              }}
                            >
                              {customer.fullName}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontSize: { xs: '0.875rem', md: '1rem' },
                                fontWeight: index === 0 ? 600 : 400,
                                color: index === 0 ? '#c10007' : 'inherit',
                              }}
                            >
                              {customer.bookingCount}
                            </TableCell>
                          </TableRow>
                        ))}
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
                    No customer data available
                  </Typography>
                )}

                <Button
                  component={Link}
                  to="/report-analytics"
                  state={{ primaryView: 'topCustomers' }}
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
                  View All Top Customers
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Middle Section - Schedule & Available Cars */}
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
                boxShadow: 2,
                minHeight: { xs: 'auto', md: 450 },
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: { xs: 1.5, md: 2 },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 0.5, md: 1 },
                    }}
                  >
                    <Schedule
                      sx={{ color: '#c10007', fontSize: { xs: 20, md: 24 } }}
                    />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: { xs: '1rem', md: '1.25rem' },
                      }}
                    >
                      ACTIVE BOOKINGS
                    </Typography>
                  </Box>
                  <Chip
                    label={`${dashboardData.weekSchedules.length} Active`}
                    sx={{
                      bgcolor: '#c10007',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                    size="small"
                  />
                </Box>
                <Divider
                  sx={{ mb: { xs: 1.5, md: 2 }, borderColor: '#e0e0e0' }}
                />

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
                boxShadow: 2,
                minHeight: { xs: 'auto', md: 450 },
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: { xs: 1.5, md: 2 },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 0.5, md: 1 },
                    }}
                  >
                    <CarRental
                      sx={{ color: '#000', fontSize: { xs: 20, md: 24 } }}
                    />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: { xs: '1rem', md: '1.25rem' },
                      }}
                    >
                      AVAILABLE CARS
                    </Typography>
                  </Box>
                  <Chip
                    label={`${dashboardData.availableCars.length} Cars`}
                    sx={{ bgcolor: '#000', color: 'white', fontWeight: 'bold' }}
                    size="small"
                  />
                </Box>
                <Divider
                  sx={{ mb: { xs: 1.5, md: 2 }, borderColor: '#e0e0e0' }}
                />

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
            <Card sx={{ boxShadow: 2, minHeight: { xs: 'auto', md: 400 } }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: { xs: 1.5, md: 2 },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 0.5, md: 1 },
                    }}
                  >
                    <BookOnline
                      sx={{ color: '#c10007', fontSize: { xs: 20, md: 24 } }}
                    />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: { xs: '1rem', md: '1.25rem' },
                      }}
                    >
                      BOOKING REQUESTS
                    </Typography>
                  </Box>
                  <Chip
                    label={`${dashboardData.bookingRequests.length} Pending`}
                    sx={{
                      bgcolor: '#c10007',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                    size="small"
                  />
                </Box>
                <Divider
                  sx={{ mb: { xs: 1.5, md: 2 }, borderColor: '#e0e0e0' }}
                />

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
            <Card sx={{ boxShadow: 2, minHeight: { xs: 'auto', md: 400 } }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: { xs: 1.5, md: 2 },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 0.5, md: 1 },
                    }}
                  >
                    <Extension
                      sx={{ color: '#000', fontSize: { xs: 20, md: 24 } }}
                    />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: { xs: '1rem', md: '1.25rem' },
                      }}
                    >
                      EXTENSION/CANCELLATION
                    </Typography>
                  </Box>
                  <Chip
                    label={`${dashboardData.extensionCancellationRequests.length} Pending`}
                    sx={{ bgcolor: '#000', color: 'white', fontWeight: 'bold' }}
                    size="small"
                  />
                </Box>
                <Divider
                  sx={{ mb: { xs: 1.5, md: 2 }, borderColor: '#e0e0e0' }}
                />

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
