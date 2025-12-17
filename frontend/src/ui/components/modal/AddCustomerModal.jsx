import React, { useState } from 'react';
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
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
} from '@mui/material';
import { HiUserPlus } from 'react-icons/hi2';
import { createAuthenticatedFetch, getApiBase } from '../../../utils/api';
import { useAuth } from '../../../hooks/useAuth';

const customerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    address: z.string().min(1, 'Address is required'),
    phone: z
      .string()
      .min(7, 'Enter a valid phone number')
      .max(15, 'Enter a valid phone number')
      .regex(/^\d+$/, 'Digits only'),
    email: z.string().email('Enter a valid email'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    licenseStatus: z.enum(['has', 'none']),
    driverLicenseNo: z.string().optional(),
    fbLink: z.string().optional(),
    status: z.enum(['Active', 'Inactive']),
  })
  .refine(
    (data) =>
      data.licenseStatus === 'none' ||
      (data.driverLicenseNo && String(data.driverLicenseNo).trim().length > 0),
    {
      path: ['driverLicenseNo'],
      message: "Driver's license number is required",
    }
  );

export default function AddCustomerModal({ show, onClose, onSuccess }) {
  const { logout } = useAuth();
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    phone: '',
    email: '',
    username: '',
    password: '',
    licenseStatus: 'has',
    driverLicenseNo: '',
    fbLink: '',
    status: 'Active',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = (data) => {
    const res = customerSchema.safeParse(data);
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
    const next = { ...formData, phone: digits };
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
    if (!isWalkIn && !validate(formData)) return;

    setLoading(true);
    setApiError('');

    try {
      const authenticatedFetch = createAuthenticatedFetch(logout);
      const API_BASE = getApiBase();

      let payload;
      let endpoint;

      if (isWalkIn) {
        // Walk-in customer - simplified payload
        payload = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          contact_no: formData.phone,
          email: formData.email || null,
          driver_license_no: formData.licenseStatus === 'has' ? formData.driverLicenseNo : null,
        };
        endpoint = `${API_BASE}/api/customers/walk-in`;
      } else {
        // Regular customer - full payload
        payload = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address: formData.address,
          contact_no: formData.phone,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          driver_license_no:
            formData.licenseStatus === 'has' ? formData.driverLicenseNo : null,
          fb_link: formData.fbLink || null,
          status: formData.status === 'Active',
        };
        endpoint = `${API_BASE}/api/customers`;
      }

      console.log(`Submitting ${isWalkIn ? 'walk-in' : 'regular'} customer data:`, payload);

      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.error || 'Failed to create customer'
        );
      }

      const result = await response.json();
      console.log('Customer created successfully:', result);

      // Show temporary password for walk-in customers
      if (isWalkIn && result.tempPassword) {
        alert(
          `✅ Walk-in customer created!\n\nTemporary Password: ${result.tempPassword}\n\n⚠️ Please save this password and provide it to the customer.`
        );
      }

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        address: '',
        phone: '',
        email: '',
        username: '',
        password: '',
        licenseStatus: 'has',
        driverLicenseNo: '',
        fbLink: '',
        status: 'Active',
      });
      setIsWalkIn(false);

      // Call success callback to refresh the list
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onClose?.();

      // Show success message for regular customers
      if (!isWalkIn) {
        alert('✅ Customer created successfully!');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      setApiError(
        error.message || 'Failed to create customer. Please try again.'
      );
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
      <DialogTitle>Add Customer</DialogTitle>
      <DialogContent dividers>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}
        
        {/* Walk-in Quick Registration Toggle */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isWalkIn}
                disabled
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ opacity: 0.7 }}>
                  Walk-in Customer (Quick Registration)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>
                  Simplified form for walk-in customers. Auto-generates username and password.
                </Typography>
              </Box>
            }
            sx={{ opacity: 0.8 }}
          />
        </Box>

        {isWalkIn && (
          <Alert severity="info" icon={<HiUserPlus />} sx={{ mb: 2 }}>
            Walk-in mode: Only name, phone, and optional email/license required. 
            System will auto-generate credentials.
          </Alert>
        )}

        <form id="addCustomerForm" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              error={!!errors.firstName}
              helperText={errors.firstName}
              fullWidth
            />
            <TextField
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              error={!!errors.lastName}
              helperText={errors.lastName}
              fullWidth
            />
            
            {/* Conditional fields - hidden for walk-in */}
            {!isWalkIn && (
              <>
                <TextField
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  error={!!errors.address}
                  helperText={errors.address}
                  fullWidth
                />
              </>
            )}
            
            <TextField
              label="Phone"
              name="phone"
              type="text"
              inputMode="numeric"
              value={formData.phone}
              onChange={handlePhoneChange}
              onKeyDown={blockNonNumericKeys}
              required
              error={!!errors.phone}
              helperText={errors.phone}
              fullWidth
              inputProps={{ pattern: '[0-9]*' }}
            />
            <TextField
              label={isWalkIn ? "Email (Optional)" : "Email"}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required={!isWalkIn}
              error={!!errors.email}
              helperText={errors.email || (isWalkIn ? "Leave blank to auto-generate" : "")}
              fullWidth
            />
            
            {/* Credentials - hidden for walk-in */}
            {!isWalkIn && (
              <>
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
              </>
            )}
            
            <TextField
              select
              label="Driver's License"
              name="licenseStatus"
              value={formData.licenseStatus}
              onChange={handleInputChange}
              required
              fullWidth
              helperText={
                formData.licenseStatus === 'has'
                  ? "Select if the customer has a license and enter the driver's license number"
                  : "Select if the customer doesn't have a license"
              }
            >
              <MenuItem value="has">Has A Driver's License</MenuItem>
              <MenuItem value="none">Doesn't have a Driver's License</MenuItem>
            </TextField>
            {formData.licenseStatus === 'has' && (
              <TextField
                label="Driver License Number"
                name="driverLicenseNo"
                value={formData.driverLicenseNo}
                onChange={handleInputChange}
                required
                error={!!errors.driverLicenseNo}
                helperText={errors.driverLicenseNo}
                fullWidth
              />
            )}
            
            {/* Optional fields - hidden for walk-in */}
            {!isWalkIn && (
              <>
                <TextField
                  label="Facebook Link (Optional)"
                  name="fbLink"
                  value={formData.fbLink}
                  onChange={handleInputChange}
                  error={!!errors.fbLink}
                  helperText={errors.fbLink}
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
              </>
            )}
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
            form="addCustomerForm"
            variant="contained"
            color="success"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} color="inherit" /> : null
            }
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
