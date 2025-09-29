import React, { useState } from 'react';
import { useUserStore } from '../../../store/users';
import { getApiBase } from '../../../utils/api';
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
} from '@mui/material';

const staffSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z
    .string()
    .min(7, 'Enter a valid phone number')
    .max(15, 'Enter a valid phone number')
    .regex(/^\d+$/, 'Digits only'),
  email: z.string().email('Enter a valid email'),
  role: z.enum(['staff', 'manager']),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  status: z.enum(['Active', 'Inactive']),
});

export default function AddStaffModal({ show, onClose }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    phone: '',
    email: '',
    role: 'staff',
    username: '',
    password: '',
    status: 'Active',
  });

  const [errors, setErrors] = useState({});

  const validate = (data) => {
    const res = staffSchema.safeParse(data);
    if (!res.success) {
      const fieldErrors = {};
      for (const issue of res.error.issues) {
        const key = issue.path[0] || 'form';
        fieldErrors[key] = issue.message;
      }
      // setErrors(fieldErrors);
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

  const [submitting, setSubmitting] = useState(false);
  const loadAdmins = useUserStore((s) => s.loadAdmins);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate(formData)) return;
    setSubmitting(true);
    try {
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        address: formData.address,
        contact_no: formData.phone,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        user_type: formData.role,
        isActive: formData.status === 'Active',
      };
      const resp = await fetch(`${getApiBase()}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to create admin');
      }
      await loadAdmins();
      onClose?.();
      // reset
      setFormData({
        firstName: '',
        lastName: '',
        address: '',
        phone: '',
        email: '',
        role: 'staff',
        username: '',
        password: '',
        status: 'Active',
      });
    } catch (err) {
      console.error('Create admin failed:', err);
      setErrors((e) => ({ ...e, form: err.message }));
    } finally {
      setSubmitting(false);
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
      <DialogTitle>Add Staff Member</DialogTitle>
      <DialogContent dividers>
        <form id="addStaffForm" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {errors.form && (
              <Box sx={{ color: 'error.main', fontSize: 14 }}>
                {errors.form}
              </Box>
            )}
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
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              error={!!errors.email}
              helperText={errors.email}
              fullWidth
            />
            <TextField
              select
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
              error={!!errors.role}
              helperText={errors.role}
              fullWidth
            >
              <MenuItem value="staff">Staff</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
            </TextField>
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
            form="addStaffForm"
            variant="contained"
            color="success"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save'}
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
