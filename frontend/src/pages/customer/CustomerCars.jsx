import React, { useState, useEffect } from 'react';
import CustomerSideBar from '../../ui/components/CustomerSideBar';
import Header from '../../ui/components/Header';
import '../../styles/customercss/customerdashboard.css';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { HiTruck } from 'react-icons/hi2';
import { useCarStore } from '../../store/cars';

function CustomerCars() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [seatFilter, setSeatFilter] = useState('all');
  
  const { fetchCars } = useCarStore();

  // Fetch cars on component mount
  useEffect(() => {
    const loadCars = async () => {
      try {
        setLoading(true);
        setError(null);
        const carsData = await fetchCars();
        setCars(carsData || []);
        
        // Set initial price range based on available cars
        if (carsData && carsData.length > 0) {
          const prices = carsData.map(car => car.rent_price || 0);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          setPriceRange([minPrice, maxPrice]);
        }
      } catch (err) {
        console.error('Error loading cars:', err);
        setError('Failed to load cars. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadCars();
  }, [fetchCars]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    let filtered = cars.filter(car => {
      // Price filter
      const carPrice = car.rent_price || 0;
      const withinPriceRange = carPrice >= priceRange[0] && carPrice <= priceRange[1];
      
      // Seat filter
      let withinSeatFilter = true;
      if (seatFilter === '5') {
        withinSeatFilter = car.no_of_seat === 5;
      } else if (seatFilter === '7') {
        withinSeatFilter = car.no_of_seat === 7;
      }
      // 'all' includes all seat counts
      
      return withinPriceRange && withinSeatFilter;
    });

    setFilteredCars(filtered);
  }, [cars, priceRange, seatFilter]);

  // Handle price range change
  const handlePriceRangeChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  // Handle seat filter change
  const handleSeatFilterChange = (event) => {
    setSeatFilter(event.target.value);
  };

  return (
    <>
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
          boxSizing: 'border-box',
        }}
      >
        <title>Cars</title>
        
        {/* Page Header */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontSize: '1.8rem',
              color: '#000',
              fontWeight: 'bold',
              '@media (max-width: 1024px)': {
                fontSize: '1.5rem',
              },
            }}
          >
            <HiTruck style={{ verticalAlign: '-3px', marginRight: '8px' }} />
            AVAILABLE CARS
          </Typography>
        </Box>

        {/* Filter Controls */}
        <Box 
          sx={{ 
            mb: 4, 
            p: 3, 
            backgroundColor: '#fff', 
            borderRadius: 2, 
            boxShadow: 1 
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Filter Options
          </Typography>
          <Grid container spacing={3} alignItems="center">
            {/* Price Range Filter */}
            <Grid item xs={12} md={6}>
              <Typography gutterBottom sx={{ fontWeight: 'medium' }}>
                Price Range (₱{priceRange[0]} - ₱{priceRange[1]})
              </Typography>
              <Slider
                value={priceRange}
                onChange={handlePriceRangeChange}
                valueLabelDisplay="auto"
                min={0}
                max={10000}
                step={100}
                marks={[
                  { value: 0, label: '₱0' },
                  { value: 2500, label: '₱2,500' },
                  { value: 5000, label: '₱5,000' },
                  { value: 7500, label: '₱7,500' },
                  { value: 10000, label: '₱10,000' }
                ]}
                sx={{
                  color: '#c10007',
                  '& .MuiSlider-thumb': {
                    backgroundColor: '#c10007',
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: '#c10007',
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: '#e0e0e0',
                  },
                }}
              />
            </Grid>
            
            {/* Seating Capacity Filter */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
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
            </Grid>
          </Grid>
        </Box>

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
              <Grid container spacing={3}>
                {filteredCars.map((car) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={car.car_id}>
                    <Card 
                      sx={{ 
                        maxWidth: 320,
                        width: '100%',
                        mx: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        },
                        cursor: 'pointer'
                      }}
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
                        {/* Car Status Chip */}
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            label={car.car_status || 'Available'}
                            size="small"
                            color={
                              (car.car_status === 'Available') ? 'success' :
                              (car.car_status === 'Maintenance') ? 'warning' :
                              'default'
                            }
                            sx={{ fontWeight: 'medium' }}
                          />
                        </Box>
                        
                        {/* Car Details */}
                        <Typography 
                          variant="h6" 
                          component="h3" 
                          sx={{ 
                            fontWeight: 'bold', 
                            mb: 1,
                            fontSize: '1.1rem'
                          }}
                        >
                          {car.make} {car.model}
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ mb: 1 }}
                        >
                          {car.year} • {car.no_of_seat} seats
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ mb: 2 }}
                        >
                          Plate: {car.license_plate}
                        </Typography>
                        
                        {/* Price */}
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: '#c10007',
                            fontSize: '1.2rem'
                          }}
                        >
                          ₱{car.rent_price?.toLocaleString() || '0'}/day
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </Box>
    </>
  );
}

export default CustomerCars;
