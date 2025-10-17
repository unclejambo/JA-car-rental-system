import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Header from '../ui/components/Header';
import LoginButton from '../ui/components/LoginButton';
import { getApiBase } from '../utils/api.js';

function ViewCarsPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const API_BASE = getApiBase();

  // Load cars from database
  useEffect(() => {
    const loadCars = async () => {
      try {
        setLoading(true);
        console.log('Fetching cars from:', `${API_BASE}/cars`);
        const response = await fetch(`${API_BASE}/cars`);

        if (response.ok) {
          const data = await response.json();
          console.log('Cars data received:', data);
          // Filter to only show cars that are not deleted/inactive
          const activeCars = data.filter(
            (car) =>
              car.car_status !== 'Deleted' && car.car_status !== 'Inactive'
          );
          setCars(activeCars || []);
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
  }, []);

  // Handle login redirect
  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <>
      <Header />
      <LoginButton />

      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          pt: '80px',
          pb: 4,
        }}
      >
        <Container maxWidth="xl">
          {/* Page Title */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h3"
              component="h1"
              fontFamily="Merriweather, serif"
              fontWeight="bold"
              sx={{
                color: '#333',
                mb: 2,
              }}
            >
              JA Car Rental Fleet
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                fontWeight: 300,
                mb: 3,
              }}
            >
              Browse our selection of premium vehicles and find the perfect ride
              for your next trip.
            </Typography>
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
              {cars.length === 0 ? (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 8,
                    backgroundColor: 'white',
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ color: 'text.secondary', mb: 1 }}
                  >
                    No cars found
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Please check back later
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
                  {cars.map((car) => {
                    const statusInfo = {
                      label: 'Available',
                      color: '#66bb6a',
                      textColor: 'white',
                    };

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
                              transform: 'translateY(-4px)',
                              boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                            },
                            backgroundColor: '#fff',
                          }}
                        >
                          {/* Car Image */}
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

                          {/* Car Info */}
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
                                sx={{ mb: 1 }}
                              >
                                Plate: {car.license_plate}
                              </Typography>

                              <Chip
                                label={statusInfo.label}
                                size="small"
                                sx={{
                                  backgroundColor: statusInfo.color,
                                  color: statusInfo.textColor,
                                  fontWeight: 600,
                                  mb: 2,
                                }}
                              />
                            </Box>

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
                            <Typography
                              variant="body2"
                              color="success.main"
                              sx={{ mb: 1, fontWeight: 500 }}
                            >
                              Automatic Transmission
                            </Typography>

                            <Button
                              variant="contained"
                              fullWidth
                              onClick={handleLoginRedirect}
                              sx={{
                                backgroundColor: '#c10007',
                                color: '#fff',
                                fontWeight: 600,
                                py: 1,
                                borderRadius: 2,
                                textTransform: 'none',
                                '&:hover': {
                                  backgroundColor: '#005fa3',
                                },
                              }}
                            >
                              Book Now!
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
        </Container>
      </Box>
    </>
  );
}

export default ViewCarsPage;
