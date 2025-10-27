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
  Schedule,
  BookOnline,
  Payment,
  Favorite,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import CustomerSideBar from '../../ui/components/CustomerSideBar';
import Header from '../../ui/components/Header';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api';

function CustomerDashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    todaySchedule: [],
    myBookings: [],
    totalBookings: 0,
    unpaidSettlements: [],
    favoriteCar: null,
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const authFetch = createAuthenticatedFetch(() => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      });

      // Fetch customer-specific data using dedicated endpoints
      const [customerBookings, customerSchedules, availableCars] =
        await Promise.all([
          // Use customer-specific booking endpoint
          authFetch(`${API_BASE}/bookings/my-bookings/list`).then(async (r) => {
            if (!r.ok) return [];
            const data = await r.json();
            return Array.isArray(data) ? data : data.data || [];
          }),
          // Use customer-specific schedule endpoint
          authFetch(`${API_BASE}/schedules/me`).then(async (r) => {
            if (!r.ok) return [];
            const data = await r.json();
            return Array.isArray(data) ? data : data.data || [];
          }),
          // Get available cars for favorite car details
          authFetch(`${API_BASE}/cars/available`).then((r) =>
            r.ok ? r.json() : []
          ),
        ]);

      // Process bookings data (already filtered for current customer)
      const bookings = Array.isArray(customerBookings) ? customerBookings : [];

      // Process schedules data (already filtered for current customer)
      const schedules = Array.isArray(customerSchedules)
        ? customerSchedules
        : [];

      // Get today's schedules (only Confirmed and In Progress bookings)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaySchedule = schedules.filter((schedule) => {
        const scheduleDate = new Date(schedule.start_date);
        const status = schedule.booking_status?.toLowerCase();
        // Only show Confirmed and In Progress bookings, exclude Cancelled
        return (
          scheduleDate >= today &&
          scheduleDate < tomorrow &&
          (status === 'confirmed' || status === 'in progress')
        );
      });

      // Get unpaid settlements (bookings with unpaid or pending payment status)
      // Exclude cancelled bookings
      const unpaidSettlements = bookings.filter(
        (booking) =>
          (booking.payment_status?.toLowerCase() === 'unpaid' ||
            booking.payment_status?.toLowerCase() === 'pending' ||
            !booking.payment_status ||
            booking.payment_status?.toLowerCase() === 'not_paid') &&
          booking.booking_status?.toLowerCase() !== 'cancelled' // Exclude cancelled bookings
      );

      // Get favorite car (most booked car) with enhanced car details
      const carBookingCount = {};

      bookings.forEach((booking) => {
        const carId = booking.car_id;
        if (carId) {
          if (!carBookingCount[carId]) {
            carBookingCount[carId] = {
              count: 0,
              carId: carId,
              // Get car details from booking data (now using car_details structure)
              make: booking.car_details?.make,
              model: booking.car_details?.model,
              year: booking.car_details?.year,
              car_img_url: booking.car_details?.image_url,
              display_name: booking.car_details?.display_name,
            };
          }
          carBookingCount[carId].count++;
        }
      });

      let favoriteCar = null;
      if (Object.keys(carBookingCount).length > 0) {
        const mostBookedCar = Object.values(carBookingCount).sort(
          (a, b) => b.count - a.count
        )[0];

        // Try to get additional car details from available cars if needed
        let carDetails = null;
        if (Array.isArray(availableCars)) {
          carDetails = availableCars.find(
            (car) => car.car_id === mostBookedCar.carId
          );
        }

        favoriteCar = {
          ...mostBookedCar,
          // Use car details from bookings first, then from available cars as fallback
          make: mostBookedCar.make || carDetails?.make,
          model: mostBookedCar.model || carDetails?.model,
          year: mostBookedCar.year || carDetails?.year,
          car_type: mostBookedCar.car_type || carDetails?.car_type,
          carImgUrl: mostBookedCar.car_img_url || carDetails?.car_img_url,
          carModel:
            mostBookedCar.display_name ||
            `${mostBookedCar.make || carDetails?.make || ''} ${mostBookedCar.model || carDetails?.model || ''}`.trim(),
          carType: carDetails?.car_type,
        };
      }

      // Get recent bookings (last 3) - already sorted by backend
      const recentBookings = bookings.slice(0, 3);

      setDashboardData({
        todaySchedule,
        myBookings: recentBookings,
        totalBookings: bookings.length,
        unpaidSettlements: unpaidSettlements.slice(0, 3),
        favoriteCar,
      });
    } catch (error) {
      // Set empty data to prevent crashes
      setDashboardData({
        todaySchedule: [],
        myBookings: [],
        totalBookings: 0,
        unpaidSettlements: [],
        favoriteCar: null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <title>Dashboard</title>
      <Header onMenuClick={() => setMobileOpen(true)} />
      <CustomerSideBar
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
        {/* Loading Indicator */}
        {loading && (
          <Card
            sx={{
              p: 0,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              backgroundColor: '#fff',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress sx={{ color: '#c10007' }} />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Top Section - Schedule & My Bookings */}
        {!loading && (
          <>
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
              {/* Today's Schedule */}
              <Grid item xs={12} md={6} lg={7} xl={7} sx={{ flex: { md: 1 } }}>
                <Card
                  sx={{
                    boxShadow: 2,
                    height: '100%',
                    minHeight: { xs: 'auto', lg: 500 },
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
                          SCHEDULE
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                            color: 'text.secondary',
                          }}
                        >
                          TODAY
                        </Typography>
                      </Box>
                      <Avatar
                        sx={{
                          bgcolor: '#c10007',
                          width: { xs: 40, md: 48 },
                          height: { xs: 40, md: 48 },
                        }}
                      >
                        <Schedule sx={{ fontSize: { xs: 20, md: 24 } }} />
                      </Avatar>
                    </Box>
                    <Divider sx={{ mb: { xs: 1.5, md: 2 } }} />

                    {dashboardData.todaySchedule &&
                    dashboardData.todaySchedule.length > 0 ? (
                      <TableContainer
                        component={Paper}
                        sx={{
                          boxShadow: 0,
                          border: '1px solid #e0e0e0',
                          maxHeight: { xs: 250, md: 320 },
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
                                Time
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
                                Type
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {dashboardData.todaySchedule.map((schedule) => (
                              <TableRow
                                key={
                                  schedule.schedule_id || schedule.booking_id
                                }
                                sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}
                              >
                                <TableCell
                                  sx={{
                                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                                  }}
                                >
                                  {schedule.pickup_time
                                    ? new Date(
                                        schedule.pickup_time
                                      ).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : new Date(
                                        schedule.start_date
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
                                  {schedule.car_model || 'N/A'}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                                  }}
                                >
                                  <Chip
                                    label={schedule.booking_status || 'Active'}
                                    size="small"
                                    sx={{
                                      bgcolor: '#c10007',
                                      color: 'white',
                                      fontSize: {
                                        xs: '0.65rem',
                                        md: '0.75rem',
                                      },
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography
                        sx={{
                          my: { xs: 2, md: 3 },
                          fontSize: { xs: '0.875rem', md: '1rem' },
                          color: 'text.secondary',
                          textAlign: 'center',
                        }}
                      >
                        No schedule for today.
                      </Typography>
                    )}

                    <Button
                      component={Link}
                      to="/customer-schedule"
                      variant="contained"
                      fullWidth
                      sx={{
                        mt: { xs: 1.5, md: 2 },
                        bgcolor: '#c10007',
                        color: 'white',
                        '&:hover': { bgcolor: '#a00006' },
                        py: { xs: 1, md: 1.25 },
                      }}
                    >
                      More Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* My Bookings */}
              <Grid item xs={12} md={6} lg={5} xl={5} sx={{ flex: { md: 1 } }}>
                <Card
                  sx={{
                    boxShadow: 2,
                    height: '100%',
                    minHeight: { xs: 'auto', lg: 500 },
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
                          MY BOOKINGS
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                            color: 'text.secondary',
                          }}
                        >
                          RECENT BOOKINGS
                        </Typography>
                      </Box>
                      <Avatar
                        sx={{
                          bgcolor: '#000',
                          width: { xs: 40, md: 48 },
                          height: { xs: 40, md: 48 },
                        }}
                      >
                        <BookOnline sx={{ fontSize: { xs: 20, md: 24 } }} />
                      </Avatar>
                    </Box>
                    <Divider sx={{ mb: { xs: 1.5, md: 2 } }} />

                    {dashboardData.myBookings &&
                    dashboardData.myBookings.length > 0 ? (
                      <List
                        sx={{
                          py: 0,
                          maxHeight: { xs: 250, md: 300 },
                          overflow: 'auto',
                        }}
                      >
                        {dashboardData.myBookings.map((booking, index) => (
                          <ListItem
                            key={booking.booking_id}
                            sx={{
                              bgcolor: '#f9f9f9',
                              borderRadius: 1,
                              mb:
                                index < dashboardData.myBookings.length - 1
                                  ? 1
                                  : 0,
                              border: '1px solid #e0e0e0',
                              p: { xs: 1, md: 2 },
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
                              primary={
                                booking.car_details?.display_name || 'N/A'
                              }
                              secondary={`${new Date(booking.booking_date).toLocaleDateString()} - ${booking.booking_status || 'N/A'}`}
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
                        sx={{
                          my: { xs: 2, md: 3 },
                          fontSize: { xs: '0.875rem', md: '1rem' },
                          color: 'text.secondary',
                          textAlign: 'center',
                        }}
                      >
                        No bookings found.
                      </Typography>
                    )}

                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: { xs: '1rem', md: '1.125rem' },
                        color: '#000',
                        mt: { xs: 1.5, md: 2 },
                        mb: { xs: 1, md: 1.5 },
                      }}
                    >
                      TOTAL BOOKINGS: {dashboardData.totalBookings}
                    </Typography>

                    <Button
                      component={Link}
                      to="/customer-bookings"
                      variant="outlined"
                      fullWidth
                      sx={{
                        borderColor: '#000',
                        color: '#000',
                        '&:hover': {
                          borderColor: '#333',
                          bgcolor: 'rgba(0, 0, 0, 0.04)',
                        },
                        py: { xs: 1, md: 1.25 },
                      }}
                    >
                      More Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Bottom Section - Unpaid Settlements & Favorite Car */}
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
              {/* Unpaid Settlements */}
              <Grid item xs={12} md={6} lg={6} xl={6} sx={{ flex: { md: 1 } }}>
                <Card sx={{ boxShadow: 2, minHeight: { xs: 'auto', md: 450 } }}>
                  <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        mb: { xs: 1.5, md: 2 },
                      }}
                    >
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
                          UNPAID
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                            color: 'text.secondary',
                          }}
                        >
                          SETTLEMENTS
                        </Typography>
                      </Box>
                      <Avatar
                        sx={{
                          bgcolor: '#c10007',
                          width: { xs: 40, md: 48 },
                          height: { xs: 40, md: 48 },
                        }}
                      >
                        <Payment sx={{ fontSize: { xs: 20, md: 24 } }} />
                      </Avatar>
                    </Box>
                    <Divider sx={{ mb: { xs: 1.5, md: 2 } }} />

                    {dashboardData.unpaidSettlements &&
                    dashboardData.unpaidSettlements.length > 0 ? (
                      <List sx={{ py: 0 }}>
                        {dashboardData.unpaidSettlements.map(
                          (settlement, index) => (
                            <ListItem
                              key={settlement.booking_id}
                              sx={{
                                bgcolor: '#fff5f5',
                                borderRadius: 1,
                                mb:
                                  index <
                                  dashboardData.unpaidSettlements.length - 1
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
                                  <Payment
                                    sx={{ fontSize: { xs: 18, md: 20 } }}
                                  />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  settlement.car_details?.display_name || 'N/A'
                                }
                                secondary={`Due: ${new Date(settlement.booking_date).toLocaleDateString()} - ₱${settlement.total_amount || 0}`}
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
                        sx={{
                          my: { xs: 2, md: 3 },
                          fontSize: { xs: '0.875rem', md: '1rem' },
                          color: 'text.secondary',
                          textAlign: 'center',
                        }}
                      >
                        No unpaid settlements.
                      </Typography>
                    )}

                    <Button
                      component={Link}
                      to="/customer-bookings?tab=settlement"
                      variant="contained"
                      fullWidth
                      sx={{
                        mt: { xs: 1.5, md: 2 },
                        bgcolor: '#c10007',
                        color: 'white',
                        '&:hover': { bgcolor: '#a00006' },
                        py: { xs: 1, md: 1.25 },
                      }}
                    >
                      More Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Favorite Car */}
              <Grid item xs={12} md={6} lg={6} xl={6} sx={{ flex: { md: 1 } }}>
                <Card sx={{ boxShadow: 2, minHeight: { xs: 'auto', md: 450 } }}>
                  <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        mb: { xs: 1.5, md: 2 },
                      }}
                    >
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
                          FAVORITE CAR
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                            color: 'text.secondary',
                          }}
                        >
                          MOST BOOKED
                        </Typography>
                      </Box>
                      <Avatar
                        sx={{
                          bgcolor: '#000',
                          width: { xs: 40, md: 48 },
                          height: { xs: 40, md: 48 },
                        }}
                      >
                        <Favorite sx={{ fontSize: { xs: 20, md: 24 } }} />
                      </Avatar>
                    </Box>
                    <Divider sx={{ mb: { xs: 1.5, md: 2 } }} />

                    {dashboardData.favoriteCar ? (
                      <>
                        {/* Car Image */}
                        {dashboardData.favoriteCar.carImgUrl ? (
                          <Box
                            sx={{
                              width: '100%',
                              height: { xs: 150, md: 180 },
                              borderRadius: 2,
                              overflow: 'hidden',
                              mb: { xs: 1.5, md: 2 },
                              border: '2px solid #e0e0e0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f9f9f9',
                            }}
                          >
                            <img
                              src={dashboardData.favoriteCar.carImgUrl}
                              alt={dashboardData.favoriteCar.carModel}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.style.display = 'none';
                              }}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                              }}
                            />
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: { xs: 150, md: 180 },
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
                                fontSize: { xs: 60, md: 80 },
                                color: '#c0c0c0',
                              }}
                            />
                          </Box>
                        )}

                        {/* Car Details */}
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
                            {dashboardData.favoriteCar.carModel ||
                              `${dashboardData.favoriteCar.make || ''} ${dashboardData.favoriteCar.model || ''}`.trim() ||
                              'N/A'}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              mb: { xs: 1.5, md: 2 },
                              fontSize: { xs: '0.875rem', md: '1rem' },
                              color: 'text.secondary',
                            }}
                          >
                            {dashboardData.favoriteCar.carType ||
                              dashboardData.favoriteCar.car_type ||
                              'N/A'}
                          </Typography>
                          <Divider sx={{ my: { xs: 1.5, md: 2 } }} />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 'bold',
                              fontSize: { xs: '1rem', md: '1.125rem' },
                              color: '#c10007',
                            }}
                          >
                            {dashboardData.favoriteCar.count} BOOKING
                            {dashboardData.favoriteCar.count !== 1 ? 'S' : ''}
                          </Typography>
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
                        No favorite car yet.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </Box>
  );
}

export default CustomerDashboard;
