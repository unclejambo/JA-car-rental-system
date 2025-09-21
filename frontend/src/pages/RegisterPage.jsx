import React, { useState, useRef } from 'react';
import { FaUpload } from 'react-icons/fa';
import Header from '../ui/components/Header';
import carImage from '/carImage.png';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Grid,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

// Philippine phone number formatting function
const formatPhoneNumber = (value) => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');

  // Handle different input scenarios
  if (numbers.length === 0) return '';

  // If starts with 63, format as +63 9XX XXX XXXX
  if (numbers.startsWith('63')) {
    const withoutCountryCode = numbers.slice(2);
    if (withoutCountryCode.length <= 3) {
      return `+63 ${withoutCountryCode}`;
    } else if (withoutCountryCode.length <= 6) {
      return `+63 ${withoutCountryCode.slice(0, 3)} ${withoutCountryCode.slice(3)}`;
    } else {
      return `+63 ${withoutCountryCode.slice(0, 3)} ${withoutCountryCode.slice(3, 6)} ${withoutCountryCode.slice(6, 10)}`;
    }
  }

  // If starts with 9 (mobile number), format as +63 9XX XXX XXXX
  if (numbers.startsWith('9')) {
    if (numbers.length <= 3) {
      return `+63 ${numbers}`;
    } else if (numbers.length <= 6) {
      return `+63 ${numbers.slice(0, 3)} ${numbers.slice(3)}`;
    } else {
      return `+63 ${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 10)}`;
    }
  }

  // For other numbers, just format with +63 prefix
  if (numbers.length <= 3) {
    return `+63 ${numbers}`;
  } else if (numbers.length <= 6) {
    return `+63 ${numbers.slice(0, 3)} ${numbers.slice(3)}`;
  } else {
    return `+63 ${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 10)}`;
  }
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    address: '',
    contactNumber: '',
    licenseNumber: '',
    licenseExpiry: '',
    restrictions: '',
    licenseFile: null,
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [showTerms, setShowTerms] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = type === 'checkbox' ? checked : value;

    // Apply phone number formatting for contactNumber field
    if (name === 'contactNumber' && type !== 'checkbox') {
      processedValue = formatPhoneNumber(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setFormData((p) => ({ ...p, licenseFile: null }));
      setPreviewUrl(null);
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

    // create an object URL for preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFormData((prev) => ({ ...prev, licenseFile: file }));
    setErrors((prev) => ({ ...prev, licenseFile: undefined }));
  };

  const removeFile = () => {
    setFormData((p) => ({ ...p, licenseFile: null }));
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (data) => {
    const errs = {};
    if (!data.email) errs.email = 'Email is required.';
    else {
      // simple email regex
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(data.email)) errs.email = 'Invalid email address.';
    }
    if (!data.username) errs.username = 'Username is required.';
    if (!data.password) errs.password = 'Password is required.';
    if (data.password && data.password.length < 6)
      errs.password = 'Password must be at least 6 characters.';
    if (data.password !== data.confirmPassword)
      errs.confirmPassword = 'Passwords do not match.';
    if (!data.firstName) errs.firstName = 'First name is required.';
    if (!data.lastName) errs.lastName = 'Last name is required.';
    if (!data.address) errs.address = 'Address is required.';
    if (!data.contactNumber) errs.contactNumber = 'Contact number is required.';
    else {
      const phoneRe = /^[0-9+\-\s()]{7,20}$/;
      if (!phoneRe.test(data.contactNumber))
        errs.contactNumber = 'Invalid contact number.';
    }
    if (!data.licenseNumber) errs.licenseNumber = 'License number is required.';
    if (!data.licenseExpiry) errs.licenseExpiry = 'Expiry date is required.';
    else {
      const expiry = new Date(data.licenseExpiry);
      const now = new Date();
      if (expiry <= now)
        errs.licenseExpiry = 'Expiry date must be in the future.';
    }
    if (!data.licenseFile) errs.licenseFile = 'License image is required.';
    if (!data.agreeTerms) errs.agreeTerms = 'You must accept the terms.';
    return errs;
  };

  const prepareFormData = (data) => {
    const fd = new FormData();
    fd.append('email', data.email);
    fd.append('username', data.username);
    fd.append('password', data.password);
    fd.append('firstName', data.firstName);
    fd.append('lastName', data.lastName);
    fd.append('address', data.address);
    fd.append('contactNumber', data.contactNumber);
    fd.append('licenseNumber', data.licenseNumber);
    fd.append('licenseExpiry', data.licenseExpiry);
    fd.append('restrictions', data.restrictions);
    // rename file to make unique: license_<licenseNumber>_<timestamp>.<ext>
    if (data.licenseFile) {
      const original = data.licenseFile;
      const ext = original.name.split('.').pop();
      const safeLicense = data.licenseNumber.replace(/[^a-z0-9_-]/gi, '_');
      const newName = `license_${safeLicense}_${Date.now()}.${ext}`;
      const renamedFile = new File([original], newName, {
        type: original.type,
      });
      fd.append('licenseFile', renamedFile);
    }
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    const validation = validateForm(formData);
    if (Object.keys(validation).length) {
      setErrors(validation);
      // focus first error field could be added
      return;
    }

    setLoading(true);
    try {
      const fd = prepareFormData(formData);
      // Replace with your production endpoint
      const res = await fetch('/api/register', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || 'Server error during registration.');
      }

      // success
      // optionally read response for details
      alert('Account created. Please log in.');
      navigate('/login');
    } catch (err) {
      setServerError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundImage: `url(${carImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          pt: 12,
          pb: { xs: 2, md: 1, lg: 1 },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.4)',
          }}
        />
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <Paper elevation={4} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
            <Typography
              variant="h5"
              align="center"
              sx={{ fontWeight: 700, mb: 2 }}
            >
              CREATE A NEW ACCOUNT
            </Typography>
            <Box component="form" noValidate onSubmit={handleSubmit}>
              <Grid container spacing={1.5} sx={{ width: '100%' }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={onChange}
                    placeholder="Enter your email address"
                    error={!!errors.email}
                    helperText={errors.email}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={onChange}
                    placeholder="Enter your username"
                    error={!!errors.username}
                    helperText={errors.username}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={onChange}
                    placeholder="Enter a strong password"
                    error={!!errors.password}
                    helperText={errors.password}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={onChange}
                    placeholder="Confirm your password"
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={onChange}
                    placeholder="First name"
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={onChange}
                    placeholder="Last name"
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={onChange}
                    placeholder="Enter your address"
                    error={!!errors.address}
                    helperText={errors.address}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contact number"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={onChange}
                    placeholder="Enter your contact number (e.g., 09XX XXX XXXX)"
                    error={!!errors.contactNumber}
                    helperText={errors.contactNumber}
                    inputMode="numeric"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Driver's license number"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={onChange}
                    placeholder="License number"
                    error={!!errors.licenseNumber}
                    helperText={errors.licenseNumber}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="License expiry date"
                    name="licenseExpiry"
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={onChange}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.licenseExpiry}
                    helperText={errors.licenseExpiry}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Restrictions (optional)"
                    name="restrictions"
                    value={formData.restrictions}
                    onChange={onChange}
                    placeholder="CODE (optional)"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 0.5, fontWeight: 600 }}
                  >
                    License image
                  </Typography>
                  <Button variant="outlined" component="label" sx={{ mr: 1 }}>
                    <FaUpload style={{ marginRight: 6 }} />
                    {formData.licenseFile ? 'Change file' : 'Upload License ID'}
                    <input
                      ref={fileInputRef}
                      id="licenseUpload"
                      name="licenseFile"
                      type="file"
                      accept={ALLOWED_FILE_TYPES.join(',')}
                      hidden
                      onChange={handleFileChange}
                    />
                  </Button>
                  {formData.licenseFile && (
                    <>
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{ mr: 1 }}
                      >
                        {formData.licenseFile.name} (
                        {(formData.licenseFile.size / 1024).toFixed(0)} KB)
                      </Typography>
                      <Button size="small" color="error" onClick={removeFile}>
                        Remove
                      </Button>
                    </>
                  )}
                  {previewUrl && (
                    <Box sx={{ mt: 1 }}>
                      <Box
                        component="img"
                        src={previewUrl}
                        alt="License preview"
                        sx={{
                          width: 128,
                          height: 80,
                          objectFit: 'contain',
                          borderRadius: 1,
                          border: '1px solid #e5e7eb',
                        }}
                      />
                    </Box>
                  )}
                  {errors.licenseFile && (
                    <Typography
                      variant="caption"
                      color="error"
                      display="block"
                      sx={{ mt: 0.5 }}
                    >
                      {errors.licenseFile}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={onChange}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I agree to the{' '}
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => setShowTerms(true)}
                          sx={{ p: 0, minWidth: 0 }}
                        >
                          Terms and Conditions
                        </Button>
                      </Typography>
                    }
                  />
                  {errors.agreeTerms && (
                    <Typography variant="caption" color="error" display="block">
                      {errors.agreeTerms}
                    </Typography>
                  )}
                </Grid>

                {serverError && (
                  <Grid item xs={12}>
                    <Typography color="error" variant="body2">
                      {serverError}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12} sm={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="success"
                    fullWidth
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      mt: 1,
                    }}
                  >
                    {loading ? 'Registering...' : 'Register'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Container>
      </Box>

      <Dialog
        open={showTerms}
        onClose={() => setShowTerms(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Terms and Conditions</DialogTitle>
        <DialogContent dividers>
          <Typography paragraph variant="subtitle1" sx={{ fontWeight: 600 }}>
            Cancellation Policy
          </Typography>
          <Typography paragraph variant="body2">
            For any Cancellation or No-Show, the following fees apply:
            <br />• 1 month or more ahead of rental: FREE
            <br />• 30 – 10 days ahead of rental: 1-day rental fee*
            <br />• 9 – 3 days ahead of rental: 50% of the total rental fee*
            <br />• 3 days or less & no show: 100% of rental fee*
            <br />
            Minimum cancellation fee is 1,000 pesos for any rule, and in any
            case, if the calculated cancellation fee is below 1,000 PHP.
          </Typography>
          <Typography paragraph variant="subtitle1" sx={{ fontWeight: 600 }}>
            Identification of the Rental Vehicle & Vehicle Classes
          </Typography>
          <Typography paragraph variant="body2">
            The customer has the right to reserve and book any class of car,
            confirmed by Butuan Car Rental, but no right on a specific make,
            model, car, or color. The right is limited to the booked class of
            vehicle. BCR can switch between cars of the same class or upgrade
            the customer to the next higher class as follows:
            <br />• Compact Manual (KIA RIO)
            <br />• Compact Automatic (MIRAGE G4)
            <br />• Pick-up 5-seater Manual (NISSAN NAVARA)
            <br />• SUV 7-Seater Automatic (NISSAN TERRA)
            <br />• SUV 7-Seater Automatic (TOYOTA AVANZA)
          </Typography>
          <Typography paragraph variant="subtitle1" sx={{ fontWeight: 600 }}>
            Rental Term
          </Typography>
          <Typography paragraph variant="body2">
            The term of this Car Rental Agreement runs from the date and hour of
            vehicle pickup as indicated in the individual Car Rental Agreement
            until the return of the vehicle to Owner and completion of all terms
            of this Car Rental Agreement by both Parties. The Parties may
            shorten or extend the estimated term of rental by mutual consent. A
            refund for early return is not applicable. In case of delayed return
            without prior notice of at least 6 hours ahead of the scheduled
            return time according to this agreement, the owner is eligible to
            consider the car as stolen. Furthermore, a fee of 250 PHP per hour
            will be imposed starting from the minute of the latest agreed return
            time. If the return delay exceeds more than 2 hours, a full daily
            rate as well as possible compensation for the loss of a following
            booking, at exactly the value of the lost booking, will be charged.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTerms(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setFormData((p) => ({ ...p, agreeTerms: true }));
              setShowTerms(false);
            }}
          >
            I Agree
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
