import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import Header from '../ui/components/Header';
import carImage from '/carImage.png';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getApiBase } from '../utils/api.js';

function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, isAuthenticated, userRole } = useAuth();

  // Redirect authenticated users to their respective dashboard
  useEffect(() => {
    if (isAuthenticated && userRole) {
      switch (userRole) {
        case 'admin':
        case 'staff':
          navigate('/admindashboard', { replace: true });
          break;
        case 'customer':
          navigate('/customer-dashboard', { replace: true });
          break;
        case 'driver':
          navigate('/driver-schedule', { replace: true });
          break;
        default:
          break;
      }
    }
  }, [isAuthenticated, userRole, navigate]);

  const API_BASE = getApiBase();

  // Anti-SQL injection: Sanitize input function
  const sanitizeInput = (input) => {
    if (!input || typeof input !== 'string') return '';

    // Remove or escape potentially dangerous characters and patterns
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/'/g, "''") // Escape single quotes
      .replace(/;/g, '') // Remove semicolons
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove /* comments
      .replace(/\*\//g, '') // Remove */ comments
      .replace(/\bUNION\b/gi, '') // Remove UNION statements
      .replace(/\bSELECT\b/gi, '') // Remove SELECT statements
      .replace(/\bINSERT\b/gi, '') // Remove INSERT statements
      .replace(/\bUPDATE\b/gi, '') // Remove UPDATE statements
      .replace(/\bDELETE\b/gi, '') // Remove DELETE statements
      .replace(/\bDROP\b/gi, '') // Remove DROP statements
      .replace(/\bCREATE\b/gi, '') // Remove CREATE statements
      .replace(/\bALTER\b/gi, '') // Remove ALTER statements
      .replace(/\bEXEC\b/gi, '') // Remove EXEC statements
      .replace(/\bEXECUTE\b/gi, ''); // Remove EXECUTE statements
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Sanitize inputs before validation
    const sanitizedIdentifier = sanitizeInput(identifier);
    const sanitizedPassword = sanitizeInput(password);

    if (!sanitizedIdentifier || !sanitizedPassword) {
      setError('Please enter both username/email and password');
      setIsLoading(false);
      return;
    }

    // Additional validation: Check for minimum length and valid characters
    if (sanitizedIdentifier.length < 3) {
      setError('Username/email must be at least 3 characters long');
      setIsLoading(false);
      return;
    }

    if (sanitizedPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: sanitizedIdentifier,
          password: sanitizedPassword,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        // Use auth context login method
        login(data.token, data.role, data.user);

        // Role-based routing
        switch (data.role) {
          case 'admin':
            navigate('/admindashboard');
            break;
          case 'staff':
            navigate('/admindashboard');
            break;
          case 'customer':
            navigate('/customer-dashboard');
            break;
          case 'driver':
            navigate('/driver-schedule');
            break;
          default:
            navigate('/');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading && identifier && password) {
      handleLogin(e);
    }
  };

  return (
    <>
      <title>Login</title>
      <Header />
      <Box
        sx={{
          position: 'relative',
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 0, sm: 2 },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${carImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.6)',
            zIndex: -1,
          },
        }}
      >
        <Paper
          elevation={24}
          sx={{
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(242,242,242,0.98) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: { xs: '15px', sm: '20px' },
            p: { xs: 2.5, sm: 3, md: 3.5 },
            width: '100%',
            maxWidth: { xs: '300px', sm: '340px', md: '360px' },
            minHeight: { xs: 'auto', sm: 400 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            mt: { xs: 0, sm: 10 },
            mb: { xs: 0, sm: 0 },
            overflow: 'visible',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: { xs: 'none', sm: 'translateY(-5px)' },
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            },
          }}
        >
          <Avatar
            src="https://www.gravatar.com/avatar/?d=mp"
            alt="Default Avatar"
            sx={{
              width: { xs: 80, sm: 100, md: 110 },
              height: { xs: 80, sm: 100, md: 110 },
              position: 'absolute',
              top: { xs: -40, sm: -50, md: -55 },
              border: { xs: '4px solid white', sm: '5px solid white' },
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: { xs: 'scale(1.05)', sm: 'scale(1.1) rotate(5deg)' },
              },
            }}
          />

          <Box
            component="form"
            onSubmit={handleLogin}
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pt: { xs: 5, sm: 6, md: 7 },
              px: 0,
              pb: 0,
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontFamily: '"Pathway Gothic One", sans-serif',
                fontSize: { xs: '28px', sm: '32px', md: '36px' },
                fontWeight: 'bold',
                mb: 2.5,
                background: 'linear-gradient(135deg, #3F86F1 0%, #2B6FCF 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '2px',
              }}
            >
              LOGIN
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{
                  width: '100%',
                  mb: 2,
                  borderRadius: '12px',
                  animation: 'shake 0.5s',
                  '@keyframes shake': {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '10%, 30%, 50%, 70%, 90%': {
                      transform: 'translateX(-5px)',
                    },
                    '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
                  },
                }}
              >
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              id="identifier"
              label="Username or Email"
              placeholder="Enter your username or email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              inputProps={{ maxLength: 100 }}
              sx={{
                mb: { xs: 1.5, sm: 2 },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  fontFamily: '"Pathway Gothic One", sans-serif',
                  fontSize: { xs: '15px', sm: '16px' },
                  transition: 'all 0.3s ease',
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: '2px',
                  },
                  '&:hover fieldset': {
                    borderColor: '#3F86F1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3F86F1',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  fontFamily: '"Pathway Gothic One", sans-serif',
                  fontSize: { xs: '13px', sm: '14px' },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#3F86F1',
                },
                '& .MuiInputBase-input': {
                  padding: { xs: '10px', sm: '12px' },
                },
              }}
            />

            <TextField
              fullWidth
              type={showPwd ? 'text' : 'password'}
              id="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              inputProps={{ maxLength: 100 }}
              InputProps={{
                endAdornment: password && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPwd(!showPwd)}
                      edge="end"
                      sx={{
                        color: '#3F86F1',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.2)',
                        },
                      }}
                    >
                      {showPwd ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: { xs: 1.5, sm: 2 },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  fontFamily: '"Pathway Gothic One", sans-serif',
                  fontSize: { xs: '15px', sm: '16px' },
                  transition: 'all 0.3s ease',
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: '2px',
                  },
                  '&:hover fieldset': {
                    borderColor: '#3F86F1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3F86F1',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  fontFamily: '"Pathway Gothic One", sans-serif',
                  fontSize: { xs: '13px', sm: '14px' },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#3F86F1',
                },
                '& .MuiInputBase-input': {
                  padding: { xs: '10px', sm: '12px' },
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              disabled={isLoading}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #3F86F1 0%, #2B6FCF 100%)',
                fontFamily: '"Pathway Gothic One", sans-serif',
                fontSize: { xs: '16px', sm: '18px' },
                fontWeight: 'bold',
                borderRadius: '12px',
                padding: { xs: '10px', sm: '12px' },
                mb: { xs: 1.5, sm: 1.5 },
                textTransform: 'none',
                letterSpacing: '1px',
                boxShadow: '0 4px 15px rgba(63, 134, 241, 0.4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #2B6FCF 0%, #3F86F1 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(63, 134, 241, 0.6)',
                },
                '&.Mui-disabled': {
                  background:
                    'linear-gradient(135deg, rgba(63, 134, 241, 0.5) 0%, rgba(43, 111, 207, 0.5) 100%)',
                  color: 'white',
                },
              }}
            >
              {isLoading ? (
                <>
                  <CircularProgress
                    size={20}
                    sx={{ mr: 1.5, color: 'white' }}
                  />
                  Logging in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <Button
              onClick={() => navigate('/forgot-password')}
              sx={{
                fontFamily: '"Pathway Gothic One", sans-serif',
                textDecoration: 'none',
                color: '#3F86F1',
                textTransform: 'none',
                mb: { xs: 1.5, sm: 1.5 },
                fontSize: { xs: '13px', sm: '14px' },
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: '#2B6FCF',
                  backgroundColor: 'rgba(63, 134, 241, 0.1)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              Forgot your password?
            </Button>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                mb: { xs: 1.5, sm: 1.5 },
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  height: '1px',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                }}
              />
              <Typography
                sx={{
                  fontFamily: '"Pathway Gothic One", sans-serif',
                  color: 'rgb(0 0 0 / .5)',
                  mx: 2,
                  fontSize: { xs: '12px', sm: '14px' },
                }}
              >
                OR
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  height: '1px',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                }}
              />
            </Box>

            <Button
              fullWidth
              onClick={() => navigate('/register')}
              variant="outlined"
              sx={{
                fontFamily: '"Pathway Gothic One", sans-serif',
                fontSize: { xs: '15px', sm: '16px' },
                fontWeight: 'bold',
                borderRadius: '12px',
                padding: { xs: '9px', sm: '10px' },
                mb: { xs: 1, sm: 1 },
                textTransform: 'none',
                letterSpacing: '1px',
                borderWidth: '2px',
                borderColor: '#F13F3F',
                color: '#F13F3F',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderWidth: '2px',
                  borderColor: '#F13F3F',
                  backgroundColor: '#F13F3F',
                  color: 'white',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(241, 63, 63, 0.4)',
                },
              }}
            >
              Create an Account
            </Button>
          </Box>
        </Paper>
      </Box>
    </>
  );
}

export default LoginPage;
