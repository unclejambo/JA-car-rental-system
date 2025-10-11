import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useContext(AuthContext);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    // If user is authenticated, redirect to their appropriate dashboard
    if (isAuthenticated && userRole) {
      switch (userRole) {
        case 'admin':
          navigate('/admindashboard');
          break;
        case 'customer':
          navigate('/customer-dashboard');
          break;
        case 'driver':
          navigate('/driver-schedule');
          break;
        default:
          navigate('/home');
      }
    } else {
      // Not authenticated, go to landing page
      navigate('/home');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: 3,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            textAlign: 'center',
            backgroundColor: 'white',
            borderRadius: 3,
            padding: 5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        >
          <ErrorOutlineIcon
            sx={{
              fontSize: 100,
              color: '#F13F3F',
              mb: 2,
            }}
          />
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: '6rem',
              fontWeight: 'bold',
              color: '#333',
              mb: 2,
            }}
          >
            404
          </Typography>
          <Typography
            variant="h5"
            component="h2"
            sx={{
              mb: 2,
              color: '#555',
              fontWeight: 500,
            }}
          >
            Page Not Found
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mb: 4,
              color: '#666',
            }}
          >
            Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
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
              variant="outlined"
              size="large"
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              sx={{
                borderColor: '#F13F3F',
                color: '#F13F3F',
                '&:hover': {
                  borderColor: '#d32f2f',
                  backgroundColor: 'rgba(241, 63, 63, 0.05)',
                },
              }}
            >
              Go Back
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              sx={{
                backgroundColor: '#F13F3F',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#d32f2f',
                },
              }}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Go to Home'}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
