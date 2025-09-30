import React, { useState, useEffect } from 'react';
import CustomerSideBar from '../../ui/components/CustomerSideBar';
import Header from '../../ui/components/Header';
import BookingModal from '../../ui/components/modal/BookingModal';
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
  Paper,
  Divider
} from '@mui/material';
import { HiMiniTruck } from 'react-icons/hi2';
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
  
  // Filter states
  const [seatFilter, setSeatFilter] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  
  const { logout } = useAuth();
  
  // Create stable references
  const API_BASE = getApiBase();
  const authenticatedFetch = React.useMemo(() => createAuthenticatedFetch(logout), [logout]);

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
          const activeCars = data.filter(car => car.car_status !== 'Deleted' && car.car_status !== 'Inactive');
          setCars(activeCars || []);
          setFilteredCars(activeCars || []);
          
          // Set max price for slider
          if (activeCars.length > 0) {
            const maxCarPrice = Math.max(...activeCars.map(car => car.rent_price || 0));
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
  }, []); // Remove dependencies that cause re-renders

  // Filter cars based on selected filters
  useEffect(() => {
    let filtered = [...cars];

    // Filter by seat count
    if (seatFilter) {
      filtered = filtered.filter(car => {
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
    filtered = filtered.filter(car => {
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

  // Handle booking button click
  const handleBookNow = (car) => {
    setSelectedCar(car);
    setShowBookingModal(true);
  };

  // Handle booking modal close
  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setSelectedCar(null);
  };

  // Handle booking submission
  const handleBookingSubmit = async (bookingData) => {
    try {
      console.log('Submitting booking:', bookingData);
      
      // Get current user from auth context or localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const customerId = userData.customer_id || userData.id;
      
      if (!customerId) {
        alert('Please log in to make a booking.');
        return;
      }

      const response = await authenticatedFetch(`${API_BASE}/bookings/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car_id: bookingData.car_id,
          customer_id: customerId,
          booking_date: new Date().toISOString(),
          purpose: bookingData.purpose,
          start_date: bookingData.startDate,
          end_date: bookingData.endDate,
          pickup_time: bookingData.startDate,
          pickup_loc: bookingData.bookingType === 'pickup' ? bookingData.pickupLocation : bookingData.deliveryLocation,
          dropoff_loc: bookingData.dropoffLocation,
          isSelfDriver: bookingData.isSelfDrive,
          drivers_id: bookingData.isSelfDrive ? null : bookingData.selectedDriver,
          booking_type: bookingData.bookingType,
          delivery_location: bookingData.deliveryLocation,
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Booking submitted successfully:', result);
        handleCloseBookingModal();
        alert('Booking request submitted successfully! You can track the status in your booking history.');
      } else {
        const errorData = await response.json();
        console.error('Booking submission failed:', errorData);
        alert(`Error submitting booking: ${errorData.error || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Error submitting booking. Please try again.');
    }
  };

  // Get status color and text
  const getStatusInfo = (status) => {
    const normalizedStatus = String(status || '').toLowerCase();
    
    if (normalizedStatus.includes('available') || normalizedStatus === 'available') {
      return { color: 'success', text: 'Available', canBook: true };
    } else if (normalizedStatus.includes('maint') || normalizedStatus.includes('maintenance')) {
      return { color: 'warning', text: 'Maintenance', canBook: false };
    } else if (normalizedStatus.includes('rent') || normalizedStatus === 'rented') {
      return { color: 'error', text: 'Rented', canBook: true }; // Can still book but will be queued
    } else {
      return { color: 'default', text: status || 'Unknown', canBook: false };
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <title>Available Cars</title>
        <Header onMenuClick={() => setMobileOpen(true)} isMenuOpen={mobileOpen} />
        <CustomerSideBar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
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
        <Header onMenuClick={() => setMobileOpen(true)} isMenuOpen={mobileOpen} />
        <CustomerSideBar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
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
          <Typography variant="h6" color="error">{error}</Typography>
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
            {/* Page Header with Filters */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography
                    variant="h4"
                    component="h1"
                    gutterBottom
                    sx={{
                      fontSize: '1.8rem',
                      color: '#000',
                      '@media (max-width: 1024px)': {
                        fontSize: '1.5rem',
                      },
                    }}
                  >
                    <HiMiniTruck
                      style={{ verticalAlign: '-3px', marginRight: '5px' }}
                    />
                    CARS
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Browse and book from our fleet of available vehicles
                  </Typography>
                </Box>
                
                {/* Compact Filters with Divider */}
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'flex-start',
                  '@media (max-width: 768px)': { 
                    flexDirection: 'column',
                    alignItems: 'flex-end'
                  }
                }}>
                  {/* Vertical Divider Line */}
                  <Divider 
                    orientation="vertical" 
                    flexItem 
                    sx={{ 
                      mr: 3,
                      backgroundColor: '#e0e0e0',
                      width: '1px',
                      '@media (max-width: 768px)': { 
                        display: 'none'
                      }
                    }} 
                  />
                  
                  {/* Filters Container */}
                  <Box sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    minWidth: 200,
                    '@media (max-width: 768px)': { 
                      minWidth: 180,
                      gap: 1
                    }
                  }}>
                    
                    {/* Price Range Filter */}
                    <Box>
                      <Typography variant="caption" sx={{ 
                        display: 'block', 
                        mb: 0.5, 
                        color: '#666',
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }}>
                        Price Range: ₱{priceRange[0].toLocaleString()} - ₱{priceRange[1].toLocaleString()}
                      </Typography>
                      <Slider
                        value={priceRange}
                        onChange={handlePriceRangeChange}
                        valueLabelDisplay="auto"
                        min={0}
                        max={maxPrice}
                        step={100}
                        size="small"
                        sx={{
                          color: '#c10007',
                          height: 4,
                          '& .MuiSlider-thumb': {
                            backgroundColor: '#c10007',
                            width: 16,
                            height: 16,
                          },
                          '& .MuiSlider-track': {
                            backgroundColor: '#c10007',
                          },
                          '& .MuiSlider-rail': {
                            backgroundColor: '#ddd',
                          },
                        }}
                      />
                    </Box>
                    
                    {/* Seat Filter Below Price Slider */}
                    <FormControl size="small" fullWidth>
                      <InputLabel sx={{ fontSize: '0.875rem' }}>Number of Seats</InputLabel>
                      <Select
                        value={seatFilter}
                        label="Number of Seats"
                        onChange={handleSeatFilterChange}
                        sx={{ fontSize: '0.875rem' }}
                        MenuProps={{
                          disableScrollLock: true,
                          PaperProps: {
                            sx: {
                              maxHeight: 200,
                              '& .MuiMenuItem-root': {
                                fontSize: '0.875rem'
                              }
                            }
                          }
                        }}
                      >
                        <MenuItem value="" sx={{ fontSize: '0.875rem' }}>All Seats</MenuItem>
                        <MenuItem value="5" sx={{ fontSize: '0.875rem' }}>5 Seats</MenuItem>
                        <MenuItem value="7" sx={{ fontSize: '0.875rem' }}>7 Seats</MenuItem>
                      </Select>
                    </FormControl>
                    
                  </Box>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Cars Content */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto',
              }}
            >

              {/* Cars Grid */}
              {filteredCars.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 8,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                  height: '50vh'
                }}>
                  <Typography variant="h6" color="text.secondary">
                    {cars.length === 0 ? 'No cars available at the moment.' : 'No cars match your filter criteria.'}
                  </Typography>
                  {cars.length > 0 && filteredCars.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Try adjusting your filters to see more results.
                    </Typography>
                  )}
                </Box>
              ) : (
                <Grid container spacing={3} sx={{ maxWidth: '1200px', mx: 'auto' }}>
                  {filteredCars.map((car) => {
                    const statusInfo = getStatusInfo(car.car_status);
                    return (
                      <Grid item xs={12} sm={6} md={4} key={car.car_id}>
                        <Card 
                          sx={{ 
                            height: '420px',
                            maxWidth: '350px',
                            mx: 'auto',
                            display: 'flex', 
                            flexDirection: 'column',
                            transition: 'box-shadow 0.2s ease',
                            border: '1px solid #e0e0e0',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              border: '1px solid #c10007',
                            }
                          }}
                        >
                          {/* Car Image */}
                          <CardMedia
                            component="img"
                            height="180"
                            image={car.car_img_url || '/carImage.png'}
                            alt={`${car.make} ${car.model}`}
                            sx={{ 
                              objectFit: 'cover',
                              backgroundColor: '#f8f9fa',
                              borderBottom: '1px solid #e9ecef',
                            }}
                            onError={(e) => {
                              // If image fails to load, use placeholder
                              e.target.src = '/carImage.png';
                            }}
                          />
                          
                          <CardContent sx={{ 
                            flexGrow: 1, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            p: 2,
                            '&:last-child': { pb: 2 }
                          }}>
                            {/* Car Title */}
                            <Typography variant="h6" component="h2" sx={{ 
                              fontWeight: 'bold', 
                              mb: 1.5,
                              fontSize: '1.1rem',
                              color: '#333',
                              lineHeight: 1.2
                            }}>
                              {car.make} {car.model}
                            </Typography>
                            
                            {/* Car Details */}
                            <Box sx={{ mb: 1.5, flexGrow: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.4, fontSize: '0.85rem' }}>
                                <strong>Year:</strong> {car.year || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.4, fontSize: '0.85rem' }}>
                                <strong>Seats:</strong> {car.no_of_seat || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.4, fontSize: '0.85rem' }}>
                                <strong>Plate:</strong> {car.license_plate || 'N/A'}
                              </Typography>
                            </Box>

                            {/* Status and Price */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Chip 
                                label={statusInfo.text} 
                                color={statusInfo.color} 
                                size="small" 
                                variant="filled"
                                sx={{ fontSize: '0.75rem', height: '26px' }}
                              />
                              <Typography variant="h6" sx={{ 
                                fontWeight: 'bold', 
                                color: '#c10007',
                                fontSize: '1rem'
                              }}>
                                ₱{car.rent_price ? car.rent_price.toLocaleString() : 'N/A'}/day
                              </Typography>
                            </Box>

                            {/* Book Now Button */}
                            <Button
                              variant="contained"
                              fullWidth
                              disabled={!statusInfo.canBook}
                              onClick={() => handleBookNow(car)}
                              sx={{
                                mt: 'auto',
                                py: 1,
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                backgroundColor: statusInfo.canBook ? '#c10007' : undefined,
                                '&:hover': {
                                  backgroundColor: statusInfo.canBook ? '#a00006' : undefined,
                                },
                                '&:disabled': {
                                  backgroundColor: '#e0e0e0',
                                  color: '#9e9e9e'
                                }
                              }}
                            >
                              {statusInfo.text === 'Maintenance' ? 'Under Maintenance' : 
                               statusInfo.text === 'Rented' ? 'Join Waitlist' : 'Book Now'}
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Booking Modal */}
      {showBookingModal && selectedCar && (
        <BookingModal
          open={showBookingModal}
          onClose={handleCloseBookingModal}
          car={selectedCar}
          onSubmit={handleBookingSubmit}
        />
      )}
    </Box>
  );
}

export default CustomerCars;
