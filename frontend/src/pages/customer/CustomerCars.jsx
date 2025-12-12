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

  // Load cars from database
  useEffect(() => {
    const loadCars = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(`${API_BASE}/cars`);

        if (response.ok) {
          const response_data = await response.json();

          // Handle paginated response - extract data array
          const data = Array.isArray(response_data)
            ? response_data
            : response_data.data || [];

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
          setError('Failed to load cars. Please try again.');
        }
      } catch (error) {
        setError('Error connecting to server. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadCars();
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

  // Handle car click to open booking modal
  const handleCarClick = (car) => {
    const isUnderMaintenance = car.car_status?.toLowerCase().includes('maint');
    if (!isUnderMaintenance) {
      setSelectedCar(car);
      setShowBookingModal(true);
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
      // Get current user from auth context or localStorage
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const customerId = userInfo.customer_id || userInfo.id;
      const authToken = localStorage.getItem('authToken');

      if (!customerId) {
        showMessage('Please log in to make a booking.', 'error');
        return;
      }

      if (!authToken) {
        showMessage('Please log in to make a booking.', 'error');
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

      const response = await authenticatedFetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const result = await response.json();

        // Store booking data and show success modal
        setSuccessBookingData(requestData);
        setShowBookingModal(false);
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        showMessage(
          `Error submitting booking: ${errorData.error || errorData.details || 'Please try again.'}`,
          'error'
        );
      }
    } catch (error) {
      showMessage('Error submitting booking. Please try again.', 'error');
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
            {/* Loading Indicator */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress sx={{ color: '#c10007' }} />
              </Box>
            )}

            {/* Error Message */}
            {error && !loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <Typography variant="h6" color="error">
                  {error}
                </Typography>
              </Box>
            )}

            {/* Page Title */}
            {!loading && !error && (
              <Box
                sx={{
                  background:
                    'linear-gradient(135deg, #c10007 0%, #8b0005 100%)',
                  borderRadius: 3,
                  p: { xs: 2, md: 3 },
                  mb: { xs: 2.5, sm: 3 },
                  boxShadow: '0 4px 12px rgba(193, 0, 7, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flex: 1,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      p: { xs: 1.5, md: 2 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <HiMiniTruck
                      style={{
                        fontSize: '2rem',
                        color: '#fff',
                      }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="h4"
                      component="h1"
                      sx={{
                        fontWeight: 700,
                        color: '#fff',
                        fontSize: {
                          xs: '1.25rem',
                          sm: '1.5rem',
                          md: '1.75rem',
                        },
                        mb: 0.5,
                      }}
                    >
                      J and A Cars
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: { xs: '0.875rem', md: '1rem' },
                      }}
                    >
                      {
                        filteredCars.filter(
                          (car) => car.car_status?.toLowerCase() === 'available'
                        ).length
                      }{' '}
                      car
                      {filteredCars.filter(
                        (car) => car.car_status?.toLowerCase() === 'available'
                      ).length !== 1
                        ? 's'
                        : ''}{' '}
                      available and ready for rental
                    </Typography>
                  </Box>
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
                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                    Filter
                  </Box>
                </Button>
              </Box>
            )}

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

            {/* Cars Results */}
            {error ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            ) : (
              !loading && (
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
                              onClick={() => handleCarClick(car)}
                            >
                              <Box
                                sx={{
                                  width: '100%',
                                  height: 200,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#f9f9f9',
                                  borderTopLeftRadius: 12,
                                  borderTopRightRadius: 12,
                                  overflow: 'hidden',
                                }}
                              >
                                <CardMedia
                                  component="img"
                                  image={car.car_img_url}
                                  alt={`${car.make} ${car.model}`}
                                  sx={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    objectFit: 'contain',
                                  }}
                                />
                              </Box>

                              <CardContent
                                sx={{
                                  height: 250,
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
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
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
                                    {car.year} • {car.no_of_seat} seats •{' '}
                                    {car.isManual ? 'Manual' : 'Automatic'}
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

                                <Box>
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
                                    ₱{car.rent_price?.toLocaleString() || '0'}
                                    /day
                                  </Typography>

                                  {/* Book Now Button */}
                                  <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCarClick(car);
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
                                    {car.car_status
                                      ?.toLowerCase()
                                      .includes('maint')
                                      ? 'Under Maintenance'
                                      : car.car_status
                                            ?.toLowerCase()
                                            .includes('rent')
                                        ? 'Book Now (View Availability)'
                                        : 'Book Now'}
                                  </Button>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </>
              )
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
