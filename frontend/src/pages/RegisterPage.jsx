import React, { useState, useRef, useEffect } from 'react';
import { FaUpload } from 'react-icons/fa';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Header from '../ui/components/Header';
import carImage from '/carImage.png';
import { useNavigate } from 'react-router-dom';
import '../styles/register.css';
import SuccessModal from '../ui/components/modal/SuccessModal.jsx';
import RegisterTermsAndConditionsModal from '../ui/modals/RegisterTermsAndConditionsModal.jsx';
import PhoneVerificationModal from '../components/PhoneVerificationModal.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { formatPhilippineLicense, validatePhilippineLicense } from '../utils/licenseFormatter';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

const RegisterPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { isAuthenticated, userRole } = useAuth();

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

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    address: '',
    contactNumber: '',
    fb_link: '',
    hasDriverLicense: '', // 'yes' or 'no'
    licenseNumber: '',
    licenseExpiry: '',
    restrictions: '',
    licenseFile: null,
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Phone verification states
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [pendingRegistrationData, setPendingRegistrationData] = useState(null);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let processedValue = type === 'checkbox' ? checked : value;
    
    // Convert date values to yyyy-MM-dd format for HTML date inputs
    if (type === 'date' && value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        // Format as yyyy-MM-dd
        processedValue = date.toISOString().split('T')[0];
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleLicenseChange = (e) => {
    const formatted = formatPhilippineLicense(e.target.value);
    setFormData((prev) => ({
      ...prev,
      licenseNumber: formatted,
    }));
    // Validate the format and set error if invalid
    if (formatted && !validatePhilippineLicense(formatted)) {
      setErrors((prev) => ({ ...prev, licenseNumber: 'Invalid license format. Expected: NXX-YY-ZZZZZZ (e.g., N01-23-456789)' }));
    } else {
      setErrors((prev) => ({ ...prev, licenseNumber: undefined }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setFormData((p) => ({ ...p, licenseFile: null }));
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, licenseFile: 'Unsupported file type.' }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({
        ...prev,
        licenseFile: 'File exceeds 5MB limit.',
      }));
      return;
    }

    // Only store the File object — do not create an object URL or show an image preview.
    setFormData((prev) => ({ ...prev, licenseFile: file }));
    setErrors((prev) => ({ ...prev, licenseFile: undefined }));
  };

  const removeFile = () => {
    setFormData((p) => ({ ...p, licenseFile: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    navigate('/login');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    try {
      const {
        email,
        username,
        password,
        confirmPassword,
        firstName,
        lastName,
        address,
        contactNumber,
        fb_link,
        hasDriverLicense,
        licenseNumber,
        licenseExpiry,
        restrictions,
        licenseFile,
        agreeTerms,
      } = formData;

      // Basic validation
      if (
        !email?.trim() ||
        !username?.trim() ||
        !password ||
        !confirmPassword ||
        !firstName?.trim() ||
        !lastName?.trim() ||
        !address?.trim() ||
        !contactNumber?.trim() ||
        !fb_link?.trim() ||
        !hasDriverLicense ||
        !agreeTerms
      ) {
        throw new Error('All required fields must be provided');
      }

      // Validate license fields only if user has a license
      if (hasDriverLicense === 'yes') {
        if (!licenseNumber?.trim() || !licenseExpiry?.trim() || !licenseFile) {
          throw new Error('Please provide driver license number, expiry date, and image');
        }
        // Validate license format
        if (!validatePhilippineLicense(licenseNumber.trim())) {
          throw new Error('Invalid license format. Expected: NXX-YY-ZZZZZZ (e.g., N01-23-456789)');
        }
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      setLoading(true);

      const BASE = (
        import.meta.env.VITE_API_URL || import.meta.env.VITE_LOCAL
      ).replace(/\/+$/, '');

      // 1) Upload license image only if user has a license
      let dl_img_url = null;
      
      if (hasDriverLicense === 'yes') {
        const uploadUrl = new URL('/api/storage/licenses', BASE).toString();
        const uploadFd = new FormData();
        uploadFd.append('file', licenseFile);
        uploadFd.append('licenseNumber', licenseNumber.trim());
        uploadFd.append('username', username.trim());


        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          body: uploadFd,
        });

        const uploadJson = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(
            uploadJson?.message || uploadJson?.error || 'File upload failed'
          );
        }

        // Extract the URL from response
        dl_img_url =
          uploadJson.filePath ||
          uploadJson.path ||
          uploadJson.url ||
          uploadJson.publicUrl;

        if (!dl_img_url) {
          throw new Error('File upload succeeded but no URL returned');
        }
      }

      // 2) Send OTP to phone number for verification
      const otpUrl = new URL(
        '/api/phone-verification/send-otp',
        BASE
      ).toString();
      const otpRes = await fetch(otpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: contactNumber.trim(),
          purpose: 'registration',
        }),
      });

      const otpJson = await otpRes.json();

      if (!otpRes.ok) {
        throw new Error(otpJson?.message || 'Failed to send verification code');
      }

      // Store pending registration data
      setPendingRegistrationData({
        email: email.trim(),
        username: username.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address: address.trim(),
        contactNumber: contactNumber.trim(),
        fb_link: fb_link.trim(),
        hasDriverLicense: hasDriverLicense,
        licenseNumber: hasDriverLicense === 'yes' ? licenseNumber.trim() : null,
        // Ensure date is in yyyy-MM-dd format (not ISO string with time)
        licenseExpiry: hasDriverLicense === 'yes' && licenseExpiry ? 
          new Date(licenseExpiry).toISOString().split('T')[0] : null,
        restrictions: hasDriverLicense === 'yes' ? (restrictions?.trim() || '') : null,
        dl_img_url: dl_img_url,
        agreeTerms: true,
      });

      // Show phone verification modal
      setLoading(false);
      setShowPhoneVerification(true);
    } catch (err) {
      setServerError(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  // Handle successful phone verification
  const handlePhoneVerificationSuccess = async (_verificationData) => {
    try {
      setLoading(true);
      setShowPhoneVerification(false);

      const BASE = (
        import.meta.env.VITE_API_URL || import.meta.env.VITE_LOCAL
      ).replace(/\/+$/, '');

      // Complete registration with verified phone
      const regUrl = new URL('/api/auth/register', BASE).toString();
      const regRes = await fetch(regUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingRegistrationData),
      });

      const regJson = await regRes.json();

      if (!regRes.ok) {
        throw new Error(
          regJson?.message || regJson?.error || 'Registration failed'
        );
      }

      setSuccessMessage(
        regJson?.message ||
          'Registration successful! Your phone number has been verified.'
      );
      setShowSuccess(true);
      setPendingRegistrationData(null);
    } catch (err) {
      setServerError(err.message || 'Registration failed');
      setPendingRegistrationData(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle phone verification error
  const handlePhoneVerificationError = (error) => {
    setServerError('Phone verification failed. Please try again.');
    setPendingRegistrationData(null);
  };

  const handleShowTerms = () => {
    setShowTerms(true);
  };

  const handleAgreeTerms = () => {
    setShowTerms(false);
    setFormData((prev) => ({ ...prev, agreeTerms: true }));
    // Remove focus from any previously focused element
    if (document.activeElement) {
      document.activeElement.blur();
    }
  };

  return (
    <>
      <Header />
      <div
        className="min-h-screen bg-cover bg-center flex justify-center items-center p-4 relative"
        style={{ backgroundImage: `url(${carImage})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div
          className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-md p-6 register-card"
          style={{ backgroundImage: `url(${carImage})` }}
        >
          {/* Back to Login (MUI) - Sticky */}
          <Box
            sx={{
              zIndex: 10,
              backgroundColor: 'transparent',
              mb: 1,
            }}
          >
            <Button
              variant="text"
              color="primary"
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/login')}
              aria-label="Back to login"
              sx={{
                '&:hover': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              Back to Login
            </Button>
          </Box>

          {/* add `register-card` class so custom CSS can target the card */}
          <form
            className="register-form flex flex-col space-y-3"
            id="regForm"
            onSubmit={handleRegisterSubmit}
            noValidate
            encType="multipart/form-data"
          >
            {/* Email */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <TextField
                id="email"
                name="email"
                label="EMAIL ADDRESS"
                value={formData.email}
                onChange={onChange}
                type="email"
                placeholder="Enter your email address"
                fullWidth
                variant="outlined"
                size="medium"
                required
                error={!!errors.email}
                helperText={errors.email}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(229, 231, 235, 0.8)',
                    '& fieldset': {
                      borderColor: 'rgba(156, 163, 175, 0.5)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(156, 163, 175, 0.8)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.875rem',
                    fontWeight: '600',
                  },
                }}
              />
            </Box>

            {/* Username */}
            <Box sx={{ mb: 2 }}>
              <TextField
                id="username"
                name="username"
                label="USERNAME"
                value={formData.username}
                onChange={onChange}
                type="text"
                placeholder="Enter your username"
                fullWidth
                variant="outlined"
                size="medium"
                required
                error={!!errors.username}
                helperText={errors.username}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(229, 231, 235, 0.8)',
                    '& fieldset': {
                      borderColor: 'rgba(156, 163, 175, 0.5)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(156, 163, 175, 0.8)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.875rem',
                    fontWeight: '600',
                  },
                }}
              />
            </Box>

            {/* Password */}
            <Box sx={{ mb: 2 }}>
              <TextField
                id="password"
                name="password"
                label="PASSWORD"
                value={formData.password}
                onChange={onChange}
                type="password"
                placeholder="Enter a strong password"
                fullWidth
                variant="outlined"
                size="medium"
                required
                error={!!errors.password}
                helperText={errors.password}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(229, 231, 235, 0.8)',
                    '& fieldset': {
                      borderColor: 'rgba(156, 163, 175, 0.5)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(156, 163, 175, 0.8)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.875rem',
                    fontWeight: '600',
                  },
                }}
              />
            </Box>

            {/* Confirm Password */}
            <Box sx={{ mb: 2 }}>
              <TextField
                id="confirmPassword"
                name="confirmPassword"
                label="CONFIRM PASSWORD"
                value={formData.confirmPassword}
                onChange={onChange}
                type="password"
                placeholder="Confirm your password"
                fullWidth
                variant="outlined"
                size="medium"
                required
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(229, 231, 235, 0.8)',
                    '& fieldset': {
                      borderColor: 'rgba(156, 163, 175, 0.5)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(156, 163, 175, 0.8)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.875rem',
                    fontWeight: '600',
                  },
                }}
              />
            </Box>

            {/* Name */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                sx={{ fontSize: '0.875rem', fontWeight: '600', mb: 1 }}
              >
                Personal Details
              </Typography>
              <Box className="two-col flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                <TextField
                  id="firstName"
                  name="firstName"
                  label="FIRST NAME"
                  value={formData.firstName}
                  onChange={onChange}
                  type="text"
                  placeholder="First name"
                  fullWidth
                  variant="outlined"
                  size="medium"
                  required
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(229, 231, 235, 0.8)',
                      '& fieldset': {
                        borderColor: 'rgba(156, 163, 175, 0.5)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(156, 163, 175, 0.8)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.875rem',
                      fontWeight: '600',
                    },
                  }}
                />
                <TextField
                  id="lastName"
                  name="lastName"
                  label="LAST NAME"
                  value={formData.lastName}
                  onChange={onChange}
                  type="text"
                  placeholder="Last name"
                  fullWidth
                  variant="outlined"
                  size="medium"
                  required
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(229, 231, 235, 0.8)',
                      '& fieldset': {
                        borderColor: 'rgba(156, 163, 175, 0.5)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(156, 163, 175, 0.8)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.875rem',
                      fontWeight: '600',
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Address */}
            <Box sx={{ mb: 2 }}>
              <TextField
                id="address"
                name="address"
                label="ADDRESS"
                value={formData.address}
                onChange={onChange}
                type="text"
                placeholder="Enter your address"
                fullWidth
                variant="outlined"
                size="medium"
                required
                error={!!errors.address}
                helperText={errors.address}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(229, 231, 235, 0.8)',
                    '& fieldset': {
                      borderColor: 'rgba(156, 163, 175, 0.5)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(156, 163, 175, 0.8)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.875rem',
                    fontWeight: '600',
                  },
                }}
              />
            </Box>

            {/* Contact Number */}
            <Box sx={{ mb: 2 }}>
              <TextField
                id="contactNumber"
                name="contactNumber"
                label="CONTACT NUMBER"
                value={formData.contactNumber}
                onChange={onChange}
                type="text"
                placeholder="Enter your contact number"
                fullWidth
                variant="outlined"
                size="medium"
                required
                error={!!errors.contactNumber}
                helperText={errors.contactNumber}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(229, 231, 235, 0.8)',
                    '& fieldset': {
                      borderColor: 'rgba(156, 163, 175, 0.5)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(156, 163, 175, 0.8)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.875rem',
                    fontWeight: '600',
                  },
                }}
              />
            </Box>

            {/* Facebook Link */}
            <Box sx={{ mb: 2 }}>
              <TextField
                id="fb_link"
                name="fb_link"
                label="FACEBOOK LINK"
                value={formData.fb_link}
                onChange={onChange}
                type="text"
                placeholder="Enter your Facebook profile link"
                fullWidth
                variant="outlined"
                size="medium"
                required
                error={!!errors.fb_link}
                helperText={errors.fb_link}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(229, 231, 235, 0.8)',
                    '& fieldset': {
                      borderColor: 'rgba(156, 163, 175, 0.5)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(156, 163, 175, 0.8)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.875rem',
                    fontWeight: '600',
                  },
                }}
              />
            </Box>

            {/* Driver's License Question */}
            <Box sx={{ mb: 3 }}>
              <FormControl component="fieldset" required error={!!errors.hasDriverLicense}>
                <FormLabel 
                  component="legend"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'rgba(55, 65, 81, 1)',
                    mb: 1,
                    '&.Mui-focused': {
                      color: 'rgba(55, 65, 81, 1)',
                    },
                  }}
                >
                  DO YOU HAVE AN ACTIVE DRIVER'S LICENSE? *
                </FormLabel>
                <RadioGroup
                  aria-label="has-driver-license"
                  name="hasDriverLicense"
                  value={formData.hasDriverLicense}
                  onChange={onChange}
                  row
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.95rem',
                      fontWeight: '500',
                    },
                  }}
                >
                  <FormControlLabel
                    value="yes"
                    control={
                      <Radio
                        sx={{
                          color: 'rgba(156, 163, 175, 0.8)',
                          '&.Mui-checked': {
                            color: '#2563eb',
                          },
                        }}
                      />
                    }
                    label="Yes, I have a license"
                    sx={{ mr: 3 }}
                  />
                  <FormControlLabel
                    value="no"
                    control={
                      <Radio
                        sx={{
                          color: 'rgba(156, 163, 175, 0.8)',
                          '&.Mui-checked': {
                            color: '#2563eb',
                          },
                        }}
                      />
                    }
                    label="No, I don't have a license"
                  />
                </RadioGroup>
                {errors.hasDriverLicense && (
                  <Typography
                    variant="caption"
                    sx={{ color: '#DC2626', fontSize: '0.75rem', mt: 0.5 }}
                  >
                    {errors.hasDriverLicense}
                  </Typography>
                )}
              </FormControl>
            </Box>

            {/* Driver's License Number - Conditional */}
            {formData.hasDriverLicense === 'yes' && (
              <Box sx={{ mb: 2 }}>
                <TextField
                  id="licenseNumber"
                  name="licenseNumber"
                  label="DRIVER'S LICENSE NUMBER"
                  value={formData.licenseNumber}
                  onChange={handleLicenseChange}
                  type="text"
                  placeholder="N01-23-456789"
                  fullWidth
                  variant="outlined"
                  size="medium"
                  required
                  error={!!errors.licenseNumber}
                  helperText={errors.licenseNumber || 'Format: NXX-YY-ZZZZZZ (e.g., N01-23-456789)'}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(229, 231, 235, 0.8)',
                      '& fieldset': {
                        borderColor: 'rgba(156, 163, 175, 0.5)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(156, 163, 175, 0.8)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.875rem',
                      fontWeight: '600',
                    },
                  }}
                />
              </Box>
            )}

            {/* Driver's License Expiry Date - Conditional */}
            {formData.hasDriverLicense === 'yes' && (
              <Box sx={{ mb: 2 }}>
                <TextField
                  id="licenseExpiry"
                  name="licenseExpiry"
                  label="DRIVER'S LICENSE EXPIRY DATE"
                  value={formData.licenseExpiry}
                  onChange={onChange}
                  type="date"
                  fullWidth
                  variant="outlined"
                  size="medium"
                  required
                  error={!!errors.licenseExpiry}
                  helperText={errors.licenseExpiry}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(229, 231, 235, 0.8)',
                      '& fieldset': {
                        borderColor: 'rgba(156, 163, 175, 0.5)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(156, 163, 175, 0.8)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.875rem',
                      fontWeight: '600',
                    },
                  }}
                />
              </Box>
            )}

            {/* Restrictions - Conditional */}
            {formData.hasDriverLicense === 'yes' && (
              <Box sx={{ mb: 2 }}>
                <TextField
                  id="restrictions"
                  name="restrictions"
                  label="RESTRICTIONS"
                  value={formData.restrictions}
                  onChange={onChange}
                  type="text"
                  placeholder="CODE (optional)"
                  fullWidth
                  variant="outlined"
                  size="medium"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(229, 231, 235, 0.8)',
                      '& fieldset': {
                        borderColor: 'rgba(156, 163, 175, 0.5)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(156, 163, 175, 0.8)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.875rem',
                      fontWeight: '600',
                    },
                  }}
                />
              </Box>
            )}

            {/* License Image Upload - Conditional */}
            {formData.hasDriverLicense === 'yes' && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.875rem', fontWeight: '600', mb: 1 }}
                >
                  LICENSE IMAGE
                </Typography>
                <Box>
                  <input
                    ref={fileInputRef}
                    id="licenseUpload"
                    name="file"
                    type="file"
                    onChange={handleFileChange}
                    accept={ALLOWED_FILE_TYPES.join(',')}
                    style={{ display: 'none' }}
                  />
                  <Button
                    variant="outlined"
                    component="label"
                    htmlFor="licenseUpload"
                    startIcon={<FaUpload />}
                    size="medium"
                    sx={{
                      backgroundColor: 'rgba(229, 231, 235, 0.8)',
                      borderColor: 'rgba(156, 163, 175, 0.5)',
                      color: 'rgba(75, 85, 99, 1)',
                      '&:hover': {
                        backgroundColor: 'rgba(209, 213, 219, 0.8)',
                        borderColor: 'rgba(156, 163, 175, 0.8)',
                      },
                    }}
                  >
                    {formData.licenseFile ? 'Change file' : 'Upload License ID'}

                  {formData.licenseFile && (
                    <Box
                      sx={{
                        mt: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.875rem',
                          color: 'rgba(75, 85, 99, 1)',
                          flex: 1,
                        }}
                      >
                        {formData.licenseFile.name}
                      </Typography>
                      <Button
                        type="button"
                        onClick={removeFile}
                        variant="text"
                        color="error"
                        size="small"
                        sx={{
                          fontSize: '0.875rem',
                          textDecoration: 'underline',
                          minWidth: 'auto',
                        }}
                      >
                        Remove
                      </Button>
                    </Box>
                  )}
                </Button>
              </Box>
              {errors.licenseFile && (
                <Typography
                  variant="body2"
                  color="error"
                  sx={{ fontSize: '0.75rem', mt: 1 }}
                >
                  {errors.licenseFile}
                </Typography>
              )}
              </Box>
            )}

            {/* Terms and Conditions */}
            <Box
              sx={{
                mb: 3,
                p: 1,
                backgroundColor: 'rgba(229, 231, 235, 0.3)',
                borderRadius: 2,
                border: '2px solid',
                borderColor: formData.agreeTerms
                  ? '#2563eb'
                  : 'rgba(156, 163, 175, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: formData.agreeTerms
                    ? '#1d4ed8'
                    : 'rgba(156, 163, 175, 0.5)',
                  backgroundColor: 'rgba(229, 231, 235, 0.4)',
                },
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    id="agreeTerms"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={onChange}
                    sx={{
                      color: 'rgba(156, 163, 175, 0.8)',
                      '&.Mui-checked': {
                        color: '#2563eb',
                      },
                      '& .MuiSvgIcon-root': {
                        fontSize: 28,
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ ml: 0.5 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        color: '#374151',
                        mb: 0.5,
                      }}
                    >
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={handleShowTerms}
                        style={{
                          color: '#2563eb',
                          textDecoration: 'underline',
                          fontWeight: 600,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          transition: 'color 0.2s ease',
                        }}
                        onMouseEnter={(e) => (e.target.style.color = '#1d4ed8')}
                        onMouseLeave={(e) => (e.target.style.color = '#2563eb')}
                        disabled={showTerms}
                        tabIndex={showTerms ? -1 : 0}
                      >
                        Terms and Conditions
                      </button>
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        display: 'block',
                        lineHeight: 1.4,
                      }}
                    >
                      📋 Please read and accept our terms to create your
                      account. This includes rental policies, payment terms, and
                      usage guidelines.
                    </Typography>
                  </Box>
                }
                sx={{
                  alignItems: 'flex-start',
                  m: 0,
                  width: '100%',
                }}
              />
            </Box>
            {errors.agreeTerms && (
              <Typography
                variant="caption"
                sx={{
                  color: '#DC2626',
                  fontSize: '0.75rem',
                  mt: -2,
                  mb: 2,
                  display: 'block',
                  ml: 1,
                }}
              >
                ⚠️ {errors.agreeTerms}
              </Typography>
            )}

            {/* Server error */}
            {serverError && (
              <Box
                sx={{
                  fontSize: '0.875rem',
                  color: '#DC2626',
                  backgroundColor: '#FEF2F2',
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid #FECACA',
                  mb: 2,
                }}
              >
                {serverError}
              </Box>
            )}

            {/* Submit Button */}
            <Box className="flex justify-center" sx={{ pt: 1 }}>
              <Button
                type="submit"
                disabled={loading}
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  mt: 2,
                  py: 1.5,
                  backgroundColor: loading ? '#9CA3AF' : '#16A34A',
                  '&:hover': {
                    backgroundColor: loading ? '#9CA3AF' : '#15803D',
                  },
                  '&:disabled': {
                    backgroundColor: '#9CA3AF',
                    cursor: 'not-allowed',
                  },
                  color: 'white',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Registering...
                  </Box>
                ) : (
                  'REGISTER'
                )}
              </Button>
            </Box>
          </form>
        </div>
      </div>

      <RegisterTermsAndConditionsModal
        open={showTerms}
        onClose={() => setShowTerms(false)}
        onAgree={handleAgreeTerms}
      />

      <PhoneVerificationModal
        open={showPhoneVerification}
        onClose={() => {
          setShowPhoneVerification(false);
          setPendingRegistrationData(null);
          setLoading(false);
        }}
        phoneNumber={formData.contactNumber}
        purpose="registration"
        onVerificationSuccess={handlePhoneVerificationSuccess}
        onVerificationError={handlePhoneVerificationError}
      />

      <SuccessModal
        open={showSuccess}
        message={successMessage}
        onNavigate={handleCloseSuccess}
        buttonText="Back to Login"
      />
    </>
  );
};

export default RegisterPage;
