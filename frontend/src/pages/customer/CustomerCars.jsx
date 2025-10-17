import React, { useState, useEffect } from 'react';
import CustomerSideBar from '../../ui/components/CustomerSideBar';
import Header from '../../ui/components/Header';
import BookingModal from '../../ui/components/modal/BookingModal';
import BookingSuccessModal from '../../ui/components/modal/BookingSuccessModal';
import NotificationSettingsModal from '../../ui/components/modal/NotificationSettingsModal';
import '../../styles/customercss/customerdashboard.css';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Chip,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
  Alert,
  Collapse,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Snackbar,
} from '@mui/material';
import { HiMiniTruck } from 'react-icons/hi2';
import { HiAdjustmentsHorizontal } from 'react-icons/hi2';
import { useAuth } from '../../hooks/useAuth.js';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api.js';

function CustomerCars() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successBookingData, setSuccessBookingData] = useState(null);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [showWaitlistInfo, setShowWaitlistInfo] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [customerNotificationSetting, setCustomerNotificationSetting] =
    useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Filter states
  const [seatFilter, setSeatFilter] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [showFilters, setShowFilters] = useState(false);

  const { logout, user } = useAuth();

  // Create stable references
  const API_BASE = getApiBase();
  const authenticatedFetch = React.useMemo(
    () => createAuthenticatedFetch(logout),
    [logout]
  );

  const fetchWaitlistEntries = async () => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/api/customers/me/waitlist`
      );
      if (response.ok) {
        const data = await response.json();
        setWaitlistEntries(data);
      }
    } catch (error) {
      console.error('Error fetching waitlist entries:', error);
    }
  };

  // Load cars from database
  useEffect(() => {
    const loadCars = async () => {
      try {
        setLoading(true);
        console.log('Fetching cars from:', `${API_BASE}/cars`);
        const response = await authenticatedFetch(`${API_BASE}/cars`);

        if (response.ok) {
          const data = await response.json();
          console.log('Cars data received:', data);
          // Filter to only show cars that are not deleted/inactive
          const activeCars = data.filter(
            (car) =>
              car.car_status !== 'Deleted' && car.car_status !== 'Inactive'
          );
          setCars(activeCars || []);
          setFilteredCars(activeCars || []);

          // Set max price for slider
          if (activeCars.length > 0) {
            const maxCarPrice = Math.max(
              ...activeCars.map((car) => car.rent_price || 0)
            );
            setMaxPrice(maxCarPrice);
            setPriceRange([0, maxCarPrice]);
          }
        } else {
          const errorText = await response.text();
          console.error('Failed to load cars:', errorText);
          setError('Failed to load cars. Please try again.');
        }
      } catch (error) {
        console.error('Error loading cars:', error);
        setError('Error connecting to server. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadCars();
    fetchWaitlistEntries();
  }, []); // Remove dependencies that cause re-renders

  // Filter cars based on selected filters
  useEffect(() => {
    let filtered = [...cars];

    // Filter by seat count
    if (seatFilter) {
      filtered = filtered.filter((car) => {
        const seats = car.no_of_seat || 0;
        switch (seatFilter) {
          case '5':
            return seats === 5;
          case '7':
            return seats === 7;
          default:
            return true;
        }
      });
    }

    // Filter by price range
    filtered = filtered.filter((car) => {
      const price = car.rent_price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    setFilteredCars(filtered);
  }, [cars, seatFilter, priceRange]);

  // Handle filter changes
  const handleSeatFilterChange = (event) => {
    setSeatFilter(event.target.value);
  };

  const handlePriceRangeChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  // Handle booking button click - now handles both regular booking and waitlist
  const handleBookNow = async (car) => {
    const isRented = car.car_status?.toLowerCase().includes('rent');

    if (isRented) {
      // This is a waitlist request - fetch customer settings first
      try {
        const response = await authenticatedFetch(
          `${API_BASE}/api/customers/me`
        );
        if (response.ok) {
          const customerData = await response.json();
          const notificationSetting = customerData.isRecUpdate || 0;
          setCustomerNotificationSetting(notificationSetting);
          setSelectedCar(car);

          // Check if notifications are disabled (0)
          if (notificationSetting === 0) {
            setSnackbarMessage(
              'Please enable notification settings in your account settings to join the waitlist.'
            );
            setSnackbarOpen(true);
            // Redirect to settings page after a delay only when isRecUpdate is 0
            setTimeout(() => {
              window.location.href = '/customer-account';
            }, 3000);
          } else {
            // Notifications are enabled (1=SMS, 2=Email, 3=Both), join waitlist directly
            await joinWaitlist(car);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error(
            'Failed to fetch customer settings:',
            response.status,
            errorData
          );
          setSnackbarMessage(
            errorData.error ||
              'Failed to load notification settings. Please try again.'
          );
          setSnackbarOpen(true);
        }
      } catch (error) {
        console.error('Error fetching customer settings:', error);
        setSnackbarMessage('Error loading settings. Please try again.');
        setSnackbarOpen(true);
      }
    } else {
      // Regular booking flow
      setSelectedCar(car);
      setShowBookingModal(true);
    }
  };

  // Join waitlist function
  const joinWaitlist = async (car) => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/api/cars/${car.car_id}/waitlist`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notification_preference: customerNotificationSetting,
          }),
        }
      );

      if (response.ok) {
        await response.json(); // Consume response
        setSnackbarMessage(
          `You'll be notified when the ${car.make} ${car.model} becomes available!`
        );
        setSnackbarOpen(true);
        fetchWaitlistEntries(); // Refresh waitlist entries
      } else {
        const errorData = await response.json();
        setSnackbarMessage(errorData.error || 'Failed to join waitlist');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error joining waitlist:', error);
      setSnackbarMessage('Error joining waitlist. Please try again.');
      setSnackbarOpen(true);
    }
  };

  // Handle notification settings saved
  const handleNotificationSettingsSaved = async (newSetting) => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/api/customers/me/notification-settings`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRecUpdate: newSetting }),
        }
      );

      if (response.ok) {
        setCustomerNotificationSetting(newSetting);
        setShowNotificationModal(false);

        // Now join the waitlist
        if (selectedCar) {
          await joinWaitlist(selectedCar);
        }
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      throw error;
    }
  };

  // Handle booking modal close
  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setSelectedCar(null);
  };

  // Handle success modal close
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessBookingData(null);
    setSelectedCar(null);
  };

  // Handle booking submission
  const handleBookingSubmit = async (bookingData) => {
    try {
      console.log('Submitting booking:', bookingData);

      // Get current user from auth context or localStorage
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const customerId = userInfo.customer_id || userInfo.id;
      const authToken = localStorage.getItem('authToken');

      console.log('User Info:', userInfo);
      console.log('Customer ID:', customerId);
      console.log('Auth Token exists:', !!authToken);

      if (!customerId) {
        alert('Please log in to make a booking.');
        return;
      }

      if (!authToken) {
        alert('Please log in to make a booking.');
        return;
      }

      const requestData = {
        car_id: bookingData.car_id,
        purpose: bookingData.purpose,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        pickupTime: bookingData.pickupTime,
        dropoffTime: bookingData.dropoffTime,
        pickupLocation: bookingData.pickupLocation,
        dropoffLocation: bookingData.dropoffLocation,
        deliveryLocation: bookingData.deliveryLocation,
        totalCost: bookingData.totalCost,
        isSelfDrive: bookingData.isSelfDrive,
        selectedDriver: bookingData.selectedDriver,
        deliveryType: bookingData.deliveryType,
      };

      console.log('Request data being sent:', requestData);

      const response = await authenticatedFetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Booking submitted successfully:', result);

        // Store booking data and show success modal
        setSuccessBookingData(requestData);
        setShowBookingModal(false);
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        console.error('Booking submission failed:', errorData);
        alert(
          `Error submitting booking: ${errorData.error || errorData.details || 'Please try again.'}`
        );
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Error submitting booking. Please try again.');
    }
  };

  // Get status color and text
  const getStatusInfo = (status) => {
    const normalizedStatus = String(status || '').toLowerCase();

    if (
      normalizedStatus.includes('available') ||
      normalizedStatus === 'available'
    ) {
      return {
        label: 'Available',
        color: '#4caf50',
        textColor: 'white',
        canBook: true,
      };
    } else if (
      normalizedStatus.includes('maint') ||
      normalizedStatus.includes('maintenance')
    ) {
      return {
        label: 'Maintenance',
        color: '#f44336', // Changed to red
        textColor: 'white',
        canBook: false,
      };
    } else if (
      normalizedStatus.includes('rent') ||
      normalizedStatus === 'rented'
    ) {
      return {
        label: 'Rented',
        color: '#ffeb3b', // Changed to yellow
        textColor: 'black', // Changed text color to black for better contrast on yellow
        canBook: true,
      }; // Can still book but will be queued
    } else {
      return {
        label: status || 'Unknown',
        color: '#9e9e9e',
        textColor: 'white',
        canBook: false,
      };
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <title>Available Cars</title>
        <Header
          onMenuClick={() => setMobileOpen(true)}
          isMenuOpen={mobileOpen}
        />
        <CustomerSideBar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 1, sm: 2, md: 3 },
            width: `calc(100% - 18.7dvw)`,
            ml: { xs: '0px', sm: '0px', md: '18.7dvw', lg: '18.7dvw' },
            '@media (max-width: 1024px)': { ml: '0px' },
            mt: { xs: '64px', sm: '64px', md: '56px', lg: '56px' },
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">Loading cars...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex' }}>
        <title>Available Cars</title>
        <Header
          onMenuClick={() => setMobileOpen(true)}
          isMenuOpen={mobileOpen}
        />
        <CustomerSideBar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 1, sm: 2, md: 3 },
            width: `calc(100% - 18.7dvw)`,
            ml: { xs: '0px', sm: '0px', md: '18.7dvw', lg: '18.7dvw' },
            '@media (max-width: 1024px)': { ml: '0px' },
            mt: { xs: '64px', sm: '64px', md: '56px', lg: '56px' },
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" color="error">
            {error}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <title>Available Cars</title>
      <Header onMenuClick={() => setMobileOpen(true)} isMenuOpen={mobileOpen} />
      <CustomerSideBar
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
          mt: { xs: '64px', sm: '64px', md: '56px', lg: '56px' },
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
            {/* Page Title */}
            <Box
              sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: { xs: 1, sm: 2 },
                mb: { xs: 2.5, sm: 3 }, // spacing below header
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontWeight: 'bold',
                    color: '#c10007',
                    fontSize: { xs: '1.15rem', sm: '1.4rem', md: '1.6rem' },
                    minWidth: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <HiMiniTruck
                    style={{
                      verticalAlign: '-3px',
                      marginRight: '8px',
                      fontSize: '1.1em',
                    }}
                  />
                  J and A Cars
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '1rem' }, mt: 0.5 }}
                >
                  {filteredCars.length} car
                  {filteredCars.length !== 1 ? 's' : ''} available and ready for
                  rental
                </Typography>
              </Box>

              <Button
                onClick={() => setShowFilters(!showFilters)}
                startIcon={<HiAdjustmentsHorizontal />}
                variant="contained"
                sx={{
                  backgroundColor: '#c10007',
                  color: 'white',
                  fontWeight: 'bold',
                  minWidth: { xs: '120px', sm: '150px' },
                  borderRadius: '8px',
                  padding: '10px 20px',
                  textTransform: 'none',
                  boxShadow:
                    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  '&:hover': {
                    backgroundColor: '#a50006',
                    boxShadow:
                      '0 6px 8px -1px rgba(0, 0, 0, 0.15), 0 4px 6px -1px rgba(0, 0, 0, 0.06)',
                  },
                  '&:focus': {
                    backgroundColor: '#a50006',
                  },
                  '&:active': {
                    backgroundColor: '#8b0005',
                  },
                }}
              >
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  Filter Cars
                </Box>
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}>Filter</Box>
              </Button>
            </Box>

            {/* Filter Modal */}
            {showFilters && (
              <Box
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2,
                }}
                onClick={() => setShowFilters(false)}
              >
                <Box
                  sx={{
                    backgroundColor: '#fff',
                    borderRadius: 3,
                    boxShadow:
                      '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    p: 3,
                    maxWidth: '500px',
                    width: '100%',
                    maxHeight: '80vh',
                    overflow: 'visible', // Changed from 'auto' to 'visible'
                    position: 'relative',
                    zIndex: 10000,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 'bold', color: '#c10007' }}
                    >
                      🎛️ Filter Options
                    </Typography>
                    <Button
                      onClick={() => setShowFilters(false)}
                      sx={{
                        minWidth: 'auto',
                        p: 1,
                        color: '#666',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                      }}
                    >
                      ✕
                    </Button>
                  </Box>

                  {/* Filter Content */}
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
                  >
                    {/* Price Range Filter */}
                    <Box>
                      <Typography
                        gutterBottom
                        sx={{
                          fontWeight: 'medium',
                          fontSize: '0.9rem',
                          mb: 1.5,
                        }}
                      >
                        Price Range: ₱{priceRange[0].toLocaleString()} - ₱
                        {priceRange[1].toLocaleString()}
                      </Typography>
                      <Box sx={{ px: 1 }}>
                        <Slider
                          value={priceRange}
                          onChange={handlePriceRangeChange}
                          valueLabelDisplay="auto"
                          min={0}
                          max={maxPrice}
                          step={100}
                          sx={{
                            color: '#c10007',
                            height: 6,
                            '& .MuiSlider-thumb': {
                              backgroundColor: '#c10007',
                              height: 18,
                              width: 18,
                              '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible':
                                {
                                  boxShadow:
                                    '0px 0px 0px 8px rgba(193, 0, 7, 0.16)',
                                },
                            },
                            '& .MuiSlider-track': {
                              backgroundColor: '#c10007',
                              border: 'none',
                            },
                            '& .MuiSlider-rail': {
                              backgroundColor: '#e0e0e0',
                            },
                            '& .MuiSlider-valueLabel': {
                              backgroundColor: '#c10007',
                            },
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Seating Capacity Filter */}
                    <Box>
                      <FormControl component="fieldset">
                        <FormLabel
                          component="legend"
                          sx={{
                            fontWeight: 'medium',
                            fontSize: '0.9rem',
                            mb: 1.5,
                            color: '#333 !important',
                            '&.Mui-focused': {
                              color: '#c10007 !important',
                            },
                          }}
                        >
                          Seating Capacity
                        </FormLabel>
                        <RadioGroup
                          value={seatFilter}
                          onChange={handleSeatFilterChange}
                          sx={{ mt: 1 }}
                        >
                          <FormControlLabel
                            value=""
                            control={
                              <Radio
                                sx={{
                                  color: '#c10007',
                                  '&.Mui-checked': {
                                    color: '#c10007',
                                  },
                                }}
                              />
                            }
                            label="All Cars"
                            sx={{ mb: 0.5 }}
                          />
                          <FormControlLabel
                            value="5"
                            control={
                              <Radio
                                sx={{
                                  color: '#c10007',
                                  '&.Mui-checked': {
                                    color: '#c10007',
                                  },
                                }}
                              />
                            }
                            label="5-Seater Cars"
                            sx={{ mb: 0.5 }}
                          />
                          <FormControlLabel
                            value="7"
                            control={
                              <Radio
                                sx={{
                                  color: '#c10007',
                                  '&.Mui-checked': {
                                    color: '#c10007',
                                  },
                                }}
                              />
                            }
                            label="7-Seater Cars"
                            sx={{ mb: 0.5 }}
                          />
                        </RadioGroup>
                      </FormControl>
                    </Box>

                    {/* Apply Button */}
                    <Button
                      variant="contained"
                      onClick={() => setShowFilters(false)}
                      sx={{
                        backgroundColor: '#c10007',
                        color: 'white',
                        fontWeight: 'bold',
                        py: 1.5,
                        mt: 1,
                        '&:hover': {
                          backgroundColor: '#a50006',
                        },
                      }}
                    >
                      Apply Filters
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Waitlist Information */}
            {waitlistEntries.length > 0 && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  backgroundColor: '#fff5f5',
                  borderRadius: 2,
                  border: '2px solid #ff9800',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 'bold', color: '#c10007', mb: 1 }}
                >
                  📋 Your Waitlist Entries ({waitlistEntries.length})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You are on the waitlist for {waitlistEntries.length} car
                  {waitlistEntries.length !== 1 ? 's' : ''}. You'll be notified
                  when they become available.
                </Typography>
                <Button
                  size="small"
                  onClick={() => setShowWaitlistInfo(!showWaitlistInfo)}
                  sx={{ mt: 1, color: '#c10007' }}
                >
                  {showWaitlistInfo ? 'Hide Details' : 'Show Details'}
                </Button>
                {showWaitlistInfo && (
                  <Box sx={{ mt: 2 }}>
                    {waitlistEntries.map((entry) => (
                      <Box
                        key={entry.waitlist_id}
                        sx={{
                          mb: 2,
                          p: 2,
                          backgroundColor: 'white',
                          borderRadius: 1,
                          border: '1px solid #e0e0e0',
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {entry.Car.make} {entry.Car.model} ({entry.Car.year})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Status: {entry.Car.car_status} • Joined:{' '}
                          {new Date(entry.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* Cars Results */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={60} sx={{ color: '#c10007' }} />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            ) : (
              <>
                {filteredCars.length === 0 ? (
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 8,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: 'text.secondary', mb: 1 }}
                    >
                      No cars found
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: 'text.secondary' }}
                    >
                      Try adjusting your filter criteria
                    </Typography>
                  </Box>
                ) : (
                  <Grid
                    container
                    spacing={3}
                    justifyContent="center"
                    sx={{
                      px: { xs: 1, sm: 2, md: 3 },
                    }}
                  >
                    {filteredCars.map((car) => {
                      const statusInfo = getStatusInfo(car.car_status);
                      const isUnderMaintenance = car.car_status
                        ?.toLowerCase()
                        .includes('maint');
                      return (
                        <Grid
                          item
                          xs={12}
                          sm={6}
                          md={3}
                          key={car.car_id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'center',
                          }}
                        >
                          <Card
                            sx={{
                              width: 280,
                              height: 450,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              borderRadius: 3,
                              boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
                              transition:
                                'transform 0.2s ease, box-shadow 0.2s ease',
                              '&:hover': {
                                transform: isUnderMaintenance
                                  ? 'none'
                                  : 'translateY(-4px)',
                                boxShadow: isUnderMaintenance
                                  ? '0 3px 10px rgba(0,0,0,0.08)'
                                  : '0 6px 20px rgba(0,0,0,0.12)',
                              },
                              cursor: isUnderMaintenance
                                ? 'not-allowed'
                                : 'pointer',
                              opacity: isUnderMaintenance ? 0.7 : 1,
                              backgroundColor: '#fff',
                            }}
                            onClick={() =>
                              !isUnderMaintenance && handleBookNow(car)
                            }
                          >
                            <CardMedia
                              component="img"
                              image={car.car_img_url}
                              alt={`${car.make} ${car.model}`}
                              sx={{
                                width: '100%',
                                height: 200,
                                objectFit: 'cover',
                                backgroundColor: '#f9f9f9',
                                p: 0,
                                borderTopLeftRadius: 12,
                                borderTopRightRadius: 12,
                              }}
                            />

                            <CardContent
                              sx={{
                                flexGrow: 1,
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Box>
                                {/* Car Title */}
                                <Typography
                                  variant="h6"
                                  sx={{
                                    fontWeight: 700,
                                    mb: 0.5,
                                    color: '#333',
                                  }}
                                >
                                  {car.make} {car.model}
                                </Typography>

                                {/* Car Details */}
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 1 }}
                                >
                                  {car.year} • {car.no_of_seat} seats
                                </Typography>

                                {/* Plate Number */}
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 1 }}
                                >
                                  Plate: {car.license_plate}
                                </Typography>

                                {/* Status Badge */}
                                <Chip
                                  label={statusInfo.label}
                                  size="small"
                                  sx={{
                                    backgroundColor: statusInfo.color,
                                    color: statusInfo.textColor || 'white',
                                    fontWeight: 600,
                                    mb: 2,
                                  }}
                                />
                              </Box>

                              {/* Price */}
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 'bold',
                                  color: '#c10007',
                                  fontSize: '1.2rem',
                                  mb: 1,
                                }}
                              >
                                ₱{car.rent_price?.toLocaleString() || '0'}/day
                              </Typography>

                              {/* Book Now Button */}
                              <Button
                                variant="contained"
                                fullWidth
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBookNow(car);
                                }}
                                disabled={car.car_status
                                  ?.toLowerCase()
                                  .includes('maint')}
                                sx={{
                                  backgroundColor: car.car_status
                                    ?.toLowerCase()
                                    .includes('rent')
                                    ? '#ff9800'
                                    : '#c10007',
                                  color: '#fff',
                                  fontWeight: 600,
                                  py: 1,
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  '&:hover': {
                                    backgroundColor: car.car_status
                                      ?.toLowerCase()
                                      .includes('rent')
                                      ? '#f57c00'
                                      : '#a50006',
                                  },
                                  '&:disabled': {
                                    backgroundColor: '#ccc',
                                    color: '#666',
                                  },
                                }}
                              >
                                {car.car_status?.toLowerCase().includes('maint')
                                  ? 'Under Maintenance'
                                  : car.car_status
                                        ?.toLowerCase()
                                        .includes('rent')
                                    ? 'Notify me when available'
                                    : 'Book Now'}
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>

      {showBookingModal && (
        <BookingModal
          open={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          car={selectedCar}
          onBookingSuccess={handleBookingSubmit}
        />
      )}

      {showSuccessModal && (
        <BookingSuccessModal
          open={showSuccessModal}
          onClose={handleCloseSuccessModal}
          bookingData={successBookingData}
          car={selectedCar}
        />
      )}

      {showNotificationModal && (
        <NotificationSettingsModal
          open={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          currentSetting={customerNotificationSetting}
          onSettingsSaved={handleNotificationSettingsSaved}
          customerName={user?.first_name || ''}
        />
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

export default CustomerCars;
