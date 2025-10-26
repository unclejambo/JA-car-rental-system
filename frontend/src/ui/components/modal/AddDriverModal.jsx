import { useState } from 'react';
import { z } from 'zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { createAuthenticatedFetch, getApiBase } from '../../../utils/api';
import { useAuth } from '../../../hooks/useAuth';
import { formatPhilippineLicense, validatePhilippineLicense } from '../../../utils/licenseFormatter';

const driverSchema = z.object({
  driverFirstName: z.string().min(1, 'First name is required'),
  driverLastName: z.string().min(1, 'Last name is required'),
  driverAddress: z.string().min(1, 'Address is required'),
  contactNumber: z
    .string()
    .min(7, 'Enter a valid phone number')
    .max(15, 'Enter a valid phone number')
    .regex(/^\d+$/, 'Digits only'),
  driverEmail: z.string().email('Enter a valid email'),
  driverLicense: z.string().min(1, 'License number is required').refine(
    (val) => validatePhilippineLicense(val),
    { message: 'Invalid license format. Expected: NXX-YY-ZZZZZZ (e.g., N01-23-456789)' }
  ),
  restriction: z
    .string()
    .min(1, 'Restriction is required')
    .regex(/^[0-9,\s]+$/, 'Use numbers and commas only'),
  expirationDate: z.string().min(1, 'Expiration date is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  status: z.enum(['Active', 'Inactive']),
});

export default function AddDriverModal({ show, onClose, onSuccess }) {
  const { logout } = useAuth();
  const [formData, setFormData] = useState({
    driverFirstName: '',
    driverLastName: '',
    driverAddress: '',
    contactNumber: '',
    driverEmail: '',
    driverLicense: '',
    restriction: '',
    expirationDate: '',
    username: '',
    password: '',
    status: 'Active',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = (data) => {
    const res = driverSchema.safeParse(data);
    if (!res.success) {
      const fieldErrors = {};
      for (const issue of res.error.issues) {
        const key = issue.path[0] || 'form';
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const next = { ...formData, [name]: value };
    setFormData(next);
    validate(next);
  };

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    const next = { ...formData, contactNumber: digits };
    setFormData(next);
    validate(next);
  };

  const handleLicenseChange = (e) => {
    const formatted = formatPhilippineLicense(e.target.value);
    const next = { ...formData, driverLicense: formatted };
    setFormData(next);
    validate(next);
  };

  const blockNonNumericKeys = (e) => {
    const allowed = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ];
    if (e.ctrlKey || e.metaKey) return;
    if (!/^\d$/.test(e.key) && !allowed.includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate(formData)) return;

    setLoading(true);
    setApiError('');

    try {
      const authenticatedFetch = createAuthenticatedFetch(logout);
      const API_BASE = getApiBase();

      // Transform formData to match backend expectations
      const payload = {
        first_name: formData.driverFirstName,
        last_name: formData.driverLastName,
        address: formData.driverAddress,
        contact_no: formData.contactNumber,
        email: formData.driverEmail,
        username: formData.username,
        password: formData.password,
        driver_license_no: formData.driverLicense,
        restrictions: formData.restriction,
        expiry_date: formData.expirationDate,
        status: formData.status.toLowerCase(),
      };

      console.log('Submitting driver data:', payload);

      const response = await authenticatedFetch(`${API_BASE}/drivers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to create driver');
      }

      const result = await response.json();
      console.log('Driver created successfully:', result);

      // Reset form
      setFormData({
        driverFirstName: '',
        driverLastName: '',
        driverAddress: '',
        contactNumber: '',
        driverEmail: '',
        driverLicense: '',
        restriction: '',
        expirationDate: '',
        username: '',
        password: '',
        status: 'Active',
      });

      // Call success callback to refresh the list
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onClose?.();

      // Show success message
      alert('✅ Driver created successfully!');
    } catch (error) {
      console.error('Error creating driver:', error);
      setApiError(error.message || 'Failed to create driver. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={!!show}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      disableScrollLock
    >
      <DialogTitle>Add New Driver</DialogTitle>
      <DialogContent dividers>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}
        <form id="addDriverForm" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="First Name"
              name="driverFirstName"
              value={formData.driverFirstName}
              onChange={handleInputChange}
              required
              error={!!errors.driverFirstName}
              helperText={errors.driverFirstName}
              fullWidth
            />
            <TextField
              label="Last Name"
              name="driverLastName"
              value={formData.driverLastName}
              onChange={handleInputChange}
              required
              error={!!errors.driverLastName}
              helperText={errors.driverLastName}
              fullWidth
            />
            <TextField
              label="Address"
              name="driverAddress"
              value={formData.driverAddress}
              onChange={handleInputChange}
              required
              error={!!errors.driverAddress}
              helperText={errors.driverAddress}
              fullWidth
            />
            <TextField
              label="Contact Number"
              name="contactNumber"
              type="text"
              inputMode="numeric"
              value={formData.contactNumber}
              onChange={handlePhoneChange}
              onKeyDown={blockNonNumericKeys}
              required
              error={!!errors.contactNumber}
              helperText={errors.contactNumber}
              fullWidth
              inputProps={{ pattern: '[0-9]*' }}
            />
            <TextField
              label="Email"
              name="driverEmail"
              type="email"
              value={formData.driverEmail}
              onChange={handleInputChange}
              required
              error={!!errors.driverEmail}
              helperText={errors.driverEmail}
              fullWidth
            />
            <TextField
              label="Driver's License"
              name="driverLicense"
              value={formData.driverLicense}
              onChange={handleLicenseChange}
              required
              error={!!errors.driverLicense}
              helperText={errors.driverLicense || 'Format: NXX-YY-ZZZZZZ (e.g., N01-23-456789)'}
              placeholder="N01-23-456789"
              fullWidth
            />
            <TextField
              label="Restriction (e.g., 1,2)"
              name="restriction"
              value={formData.restriction}
              onChange={handleInputChange}
              required
              error={!!errors.restriction}
              helperText={errors.restriction}
              fullWidth
            />
            <TextField
              label="Expiration Date"
              name="expirationDate"
              type="date"
              value={formData.expirationDate}
              onChange={handleInputChange}
              required
              error={!!errors.expirationDate}
              helperText={errors.expirationDate}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              error={!!errors.username}
              helperText={errors.username}
              fullWidth
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              error={!!errors.password}
              helperText={errors.password}
              fullWidth
            />
            <TextField
              select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
              error={!!errors.status}
              helperText={errors.status}
              fullWidth
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Stack>
        </form>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Box
          sx={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1,
          }}
        >
          <Button
            type="submit"
            form="addDriverForm"
            variant="contained"
            color="success"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button
            onClick={onClose}
            color="error"
            variant="outlined"
            sx={{
              '&:hover': { backgroundColor: 'error.main', color: 'white' },
            }}
          >
            Cancel
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
