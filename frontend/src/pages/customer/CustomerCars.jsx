import React, { useState, useEffect } from 'react';
import CustomerSideBar from '../../ui/components/CustomerSideBar';
import Header from '../../ui/components/Header';
import BookingModal from '../../ui/components/modal/BookingModal';
import BookingSuccessModal from '../../ui/components/modal/BookingSuccessModal';
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
  Collapse
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
  
  // Filter states
  const [seatFilter, setSeatFilter] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [showFilters, setShowFilters] = useState(false);
  
  const { logout } = useAuth();
  
  // Create stable references
  const API_BASE = getApiBase();
  const authenticatedFetch = React.useMemo(() => createAuthenticatedFetch(logout), [logout]);


  const fetchWaitlistEntries = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/api/customers/me/waitlist`);
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
    fetchWaitlistEntries();
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
        body: JSON.stringify(requestData)
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
        alert(`Error submitting booking: ${errorData.error || errorData.details || 'Please try again.'}`);
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
        
        {/* Page Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <Typography
            variant="h4"
            component="h1"
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
            <HiMiniTruck style={{ verticalAlign: '-3px', marginRight: '8px' }} />
            AVAILABLE CARS
          </Typography>
          
          {/* Filter Button and Collapsible Filters */}
          <Box sx={{ position: 'relative' }}>
            <Button
              variant="outlined"
              onClick={() => setShowFilters(!showFilters)}
              startIcon={<HiAdjustmentsHorizontal />}
              sx={{
                borderColor: '#c10007',
                color: '#c10007',
                fontWeight: 'bold',
                '&:hover': {
                  borderColor: '#a50006',
                  backgroundColor: 'rgba(193, 0, 7, 0.04)',
                },
              }}
            >
              Filters
            </Button>
            
            {/* Filter Dropdown */}
            <Collapse in={showFilters}>
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  mt: 1,
                  width: { xs: '300px', sm: '350px', md: '400px' },
                  p: 3, 
                  backgroundColor: '#fff', 
                  borderRadius: 2, 
                  boxShadow: 3,
                  border: '1px solid #e0e0e0',
                  zIndex: 1000,
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#c10007' }}>
                  🎛️ Filter Options
                </Typography>
                
                {/* Price Range Filter */}
                <Box sx={{ mb: 3 }}>
                  <Typography gutterBottom sx={{ fontWeight: 'medium', fontSize: '0.9rem' }}>
                    Price Range: ₱{priceRange[0].toLocaleString()} - ₱{priceRange[1].toLocaleString()}
                  </Typography>
                  <Box sx={{ px: 1 }}>
                    <Slider
                      value={priceRange}
                      onChange={handlePriceRangeChange}
                      valueLabelDisplay="auto"
                      min={0}
                      max={10000}
                      step={100}
                      sx={{
                        color: '#c10007',
                        height: 6,
                        '& .MuiSlider-thumb': {
                          backgroundColor: '#c10007',
                          height: 18,
                          width: 18,
                          '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                            boxShadow: '0px 0px 0px 8px rgba(193, 0, 7, 0.16)',
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
                  <FormControl fullWidth size="small">
                    <InputLabel id="seat-filter-label">Seating Capacity</InputLabel>
                    <Select
                      labelId="seat-filter-label"
                      value={seatFilter}
                      label="Seating Capacity"
                      onChange={handleSeatFilterChange}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: '#c10007',
                          },
                        },
                      }}
                    >
                      <MenuItem value="all">All Cars</MenuItem>
                      <MenuItem value="5">5-Seater Cars</MenuItem>
                      <MenuItem value="7">7-Seater Cars</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Collapse>
          </Box>
        </Box>

        {/* Waitlist Information */}
        {waitlistEntries.length > 0 && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: '#fff5f5', borderRadius: 2, border: '2px solid #ff9800' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#c10007', mb: 1 }}>
              📋 Your Waitlist Entries ({waitlistEntries.length})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You are on the waitlist for {waitlistEntries.length} car{waitlistEntries.length !== 1 ? 's' : ''}. You'll be notified when they become available.
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
                  <Box key={entry.waitlist_id} sx={{ mb: 2, p: 2, backgroundColor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {entry.car.make} {entry.car.model} ({entry.car.year})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Position #{entry.position} • Requested: {new Date(entry.requested_start_date).toLocaleDateString()} - {new Date(entry.requested_end_date).toLocaleDateString()}
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
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
              {filteredCars.length} car{filteredCars.length !== 1 ? 's' : ''} available
            </Typography>
            
            {filteredCars.length === 0 ? (
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  py: 8, 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: 2 
                }}
              >
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                  No cars found
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Try adjusting your filter criteria
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3} sx={{ justifyContent: { xs: 'flex-start', sm: 'flex-start' } }}>
                {filteredCars.map((car) => {
                  const statusInfo = getStatusInfo(car.car_status);
                  return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={car.car_id}>
                    <Card 
                      sx={{ 
                        maxWidth: { xs: '100%', sm: 320 },
                        width: '100%',
                        mx: { xs: 0, sm: 'auto' },
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        },
                        cursor: 'pointer'
                      }}
                      onClick={() => handleBookNow(car)}
                    >
                      <CardMedia
                        component="img"
                        height="160"
                        image="/carImage.png"
                        alt={`${car.make} ${car.model}`}
                        sx={{ 
                          objectFit: 'cover',
                          backgroundColor: '#f5f5f5'
                        }}
                      />
                      
                      <CardContent sx={{ flexGrow: 1, p: 2 }}>
                        {/* Car Title */}
                        <Typography variant="h6" sx={{ 
                          fontWeight: 'bold', 
                          mb: 1,
                          fontSize: '1.1rem'
                        }}>
                          {car.make} {car.model}
                        </Typography>

                        {/* Car Details */}
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {car.year} • {car.no_of_seat} seats
                        </Typography>
                        
                        {/* Plate Number */}
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Plate: {car.license_plate}
                        </Typography>

                        {/* Status Badge */}
                        <Chip
                          label={statusInfo.label}
                          size="small"
                          sx={{
                            backgroundColor: statusInfo.color,
                            color: statusInfo.textColor || 'white',
                            fontWeight: 'bold',
                            mb: 2,
                            fontSize: '0.75rem'
                          }}
                        />

                        {/* Price */}
                        <Typography variant="h6" sx={{ 
                          fontWeight: 'bold', 
                          color: '#c10007',
                          fontSize: '1.2rem',
                          mb: 2
                        }}>
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
                          disabled={car.car_status?.toLowerCase().includes('maint')}
                          sx={{
                            backgroundColor: car.car_status?.toLowerCase().includes('rent') ? '#ff9800' : '#c10007',
                            color: 'white',
                            fontWeight: 'bold',
                            py: 1,
                            '&:hover': {
                              backgroundColor: car.car_status?.toLowerCase().includes('rent') ? '#f57c00' : '#a50006',
                            },
                            '&:disabled': {
                              backgroundColor: '#ccc',
                              color: '#666',
                            },
                          }}
                        >
                          {car.car_status?.toLowerCase().includes('maint') ? 'Under Maintenance' :
                           car.car_status?.toLowerCase().includes('rent') ? 'Join Waitlist' :
                           'Book Now'}
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
    </Box>
  );
}

export default CustomerCars;
