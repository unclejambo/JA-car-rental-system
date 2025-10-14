import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  DirectionsCar,
  Speed,
  Security,
  Support,
  ArrowForward,
} from '@mui/icons-material';
import Header from '../ui/components/Header';
import LoginButton from '../ui/components/LoginButton';
import carImage from '/carImage.png';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useAuth();

  // Redirect authenticated users to their respective dashboard
  useEffect(() => {
    if (isAuthenticated && userRole) {
      switch (userRole) {
        case 'admin':
        case 'staff':
          navigate('/admin-dashboard', { replace: true });
          break;
        case 'customer':
          navigate('/customer-dashboard', { replace: true });
          break;
        case 'driver':
          navigate('/driver-dashboard', { replace: true });
          break;
        default:
          // If role is unknown, stay on home page
          break;
      }
    }
  }, [isAuthenticated, userRole, navigate]);

  const features = [
    {
      icon: <DirectionsCar sx={{ fontSize: 40, color: '#F13F3F' }} />,
      title: 'Wide Selection',
      description: 'Choose from our diverse fleet of well-maintained vehicles',
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: '#F13F3F' }} />,
      title: 'Quick Booking',
      description: 'Book your car in minutes with our streamlined process',
    },
    {
      icon: <Security sx={{ fontSize: 40, color: '#F13F3F' }} />,
      title: 'Secure & Safe',
      description: 'All vehicles are inspected and insured for your safety',
    },
  ];

  return (
    <>
      <Header />
      <LoginButton />

      {/* Hero Section */}
      <Box
        sx={{
          minHeight: '100vh',
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${carImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          paddingTop: '70px',
        }}
      >
        <Container maxWidth="lg">
          <Box
            textAlign="center"
            color="white"
            sx={{
              animation: 'fadeInUp 1s ease-out',
              '@keyframes fadeInUp': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(30px)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
            <Typography
              variant={isMobile ? 'h3' : 'h1'}
              component="h1"
              fontFamily="Merriweather, serif"
              fontWeight="bold"
              sx={{
                mb: 2,
                textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
              }}
            >
              Welcome to
            </Typography>
            <Typography
              variant={isMobile ? 'h2' : 'h1'}
              component="h1"
              fontFamily="Merriweather, serif"
              fontWeight="bold"
              sx={{
                color: '#F13F3F',
                fontStyle: 'italic',
                textShadow: '2px 2px 4px rgba(255,255,255,0.8)',
                mb: 4,
                fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
              }}
            >
              J&A Car Rental
            </Typography>
            <Box
              sx={{
                animation: 'slideInUp 1.5s ease-out 0.5s both',
                '@keyframes slideInUp': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(50px)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              <Typography
                variant={isMobile ? 'h5' : 'h4'}
                sx={{
                  mb: 4,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                  fontWeight: 300,
                  maxWidth: '600px',
                  mx: 'auto',
                }}
              >
                Let's get you on the ROAD with premium car rental services
              </Typography>
              <Button
                component={Link}
                to="/login"
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{
                  backgroundColor: '#F13F3F',
                  color: 'white',
                  fontSize: '1.2rem',
                  fontFamily: '"Pathway Gothic One", sans-serif',
                  px: 4,
                  py: 1.5,
                  borderRadius: '25px',
                  textTransform: 'none',
                  boxShadow: '0 4px 15px rgba(241, 63, 63, 0.4)',
                  '&:hover': {
                    backgroundColor: '#d32f2f',
                    boxShadow: '0 6px 20px rgba(241, 63, 63, 0.6)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Book Now
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8, backgroundColor: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            fontFamily="Merriweather, serif"
            fontWeight="bold"
            sx={{
              mb: 6,
              color: '#333',
              animation: 'fadeIn 1s ease-out',
              '@keyframes fadeIn': {
                '0%': { opacity: 0 },
                '100%': { opacity: 1 },
              },
            }}
          >
            Why Choose J&A Car Rental?
          </Typography>
          <Grid container spacing={4} sx={{ justifyContent: 'center' }}>
            {features.map((feature, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 2,
                    borderRadius: '15px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    animation: `slideInUp 0.6s ease-out ${0.2 + index * 0.1}s both`,
                    '@keyframes slideInUp': {
                      '0%': {
                        opacity: 0,
                        transform: 'translateY(30px)',
                      },
                      '100%': {
                        opacity: 1,
                        transform: 'translateY(0)',
                      },
                    },
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                    <Typography
                      variant="h6"
                      component="h3"
                      fontFamily="Merriweather, serif"
                      fontWeight="bold"
                      sx={{ mb: 1, color: '#333' }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.6 }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Call to Action Section */}
      <Box
        sx={{
          py: 8,
          backgroundColor: '#000',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              animation: 'fadeInUp 1s ease-out',
              '@keyframes fadeInUp': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(30px)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
            <Typography
              variant="h4"
              component="h2"
              fontFamily="Merriweather, serif"
              fontWeight="bold"
              sx={{ mb: 2 }}
            >
              Ready to Hit the Road?
            </Typography>
            <Typography
              variant="h6"
              sx={{ mb: 4, fontWeight: 300, opacity: 0.9 }}
            >
              Join hundreds of satisfied customers who trust J&A Car Rental
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Button
                component={Link}
                to="/register"
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: '#F13F3F',
                  color: 'white',
                  fontSize: '1.1rem',
                  fontFamily: '"Pathway Gothic One", sans-serif',
                  px: 3,
                  py: 1.5,
                  borderRadius: '25px',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#d32f2f',
                  },
                }}
              >
                Create Account
              </Button>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  fontSize: '1.1rem',
                  fontFamily: '"Pathway Gothic One", sans-serif',
                  px: 3,
                  py: 1.5,
                  borderRadius: '25px',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#F13F3F',
                    backgroundColor: 'rgba(241, 63, 63, 0.1)',
                  },
                }}
              >
                Sign In
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}
