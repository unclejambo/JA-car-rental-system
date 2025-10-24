import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { createAuthenticatedFetch, getApiBase } from '../../../utils/api';

// Zod schema for positive integer fees
const feesSchema = z.object({
  reservation_fee: z.coerce.number().int().gt(0, 'Must be a positive integer'),
  cleaning_fee: z.coerce.number().int().gt(0, 'Must be a positive integer'),
  driver_fee: z.coerce.number().int().gt(0, 'Must be a positive integer'),
  overdue_fee: z.coerce.number().int().gt(0, 'Must be a positive integer'),
  damage_fee: z.coerce.number().int().gt(0, 'Must be a positive integer'),
  equipment_loss_fee: z.coerce
    .number()
    .int()
    .gt(0, 'Must be a positive integer'),
  gas_level_fee: z.coerce.number().int().gt(0, 'Must be a positive integer'),
  stain_removal_fee: z.coerce
    .number()
    .int()
    .gt(0, 'Must be a positive integer'),
  security_deposit_fee: z.coerce
    .number()
    .int()
    .gt(0, 'Must be a positive integer'),
});

const formatPeso = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return '₱ 0';
  return `₱ ${n.toLocaleString('en-PH')}`;
};

// Fee items configuration for UI display
const feeItems = [
  {
    label: 'Reservation Fee',
    key: 'reservation_fee',
  },
  {
    label: 'Cleaning Fee',
    key: 'cleaning_fee',
  },
  {
    label: 'Driver Fee',
    key: 'driver_fee',
  },
  {
    label: 'Overdue Fee',
    key: 'overdue_fee',
  },
  {
    label: 'Damage Fee',
    key: 'damage_fee',
  },
  {
    label: 'Equipment Loss Fee',
    key: 'equipment_loss_fee',
  },
  {
    label: 'Gas Level Fee',
    key: 'gas_level_fee',
  },
  {
    label: 'Stain Removal Fee',
    key: 'stain_removal_fee',
  },
  {
    label: 'Security Deposit Fee',
    key: 'security_deposit_fee',
  },
];

export default function ManageFeesModal({ show, onClose }) {
  // Saved (view) values: initialize empty
  const [savedData, setSavedData] = useState({});

  // Editing state
  const [isEditing, setIsEditing] = useState(false);

  // In-form editing values: initialize empty
  const [formData, setFormData] = useState({});

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch fees from database
  useEffect(() => {
    if (show) {
      fetchFees();
    }
  }, [show]);

  // Handle focus management when modal opens/closes
  useEffect(() => {
    if (show) {
      // Clear any existing focus issues when modal opens
      const focusedElement = document.activeElement;
      if (focusedElement && focusedElement.blur) {
        focusedElement.blur();
      }
    }
  }, [show]);

  const fetchFees = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const authFetch = createAuthenticatedFetch(() => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      });
      const API_BASE = getApiBase().replace(/\/$/, '');
      const response = await authFetch(`${API_BASE}/manage-fees`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const fees = await response.json();

      // Convert numbers to strings for form handling
      const stringifiedFees = {};
      Object.keys(fees).forEach((key) => {
        stringifiedFees[key] = fees[key]?.toString() || '0';
      });

      setSavedData(stringifiedFees);
      setFormData(stringifiedFees);
    } catch (error) {
      setFetchError('Failed to load fees. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validate = (data) => {
    const res = feesSchema.safeParse(data);
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

  // Only allow digits while typing; keep empty string while editing
  const handleAmountChange = (e) => {
    const { name, value } = e.target;
    const digits = value.replace(/\D/g, '');
    const next = { ...formData, [name]: digits };
    setFormData(next);
    validate(next);
  };

  // Block non-numeric keys (prevents e, E, +, -, .)
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
    if (e.ctrlKey || e.metaKey) return; // allow copy/paste/select all
    if (!/^\d$/.test(e.key) && !allowed.includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleStartEdit = () => {
    setFormData({ ...savedData });
    setErrors({});
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormData({ ...savedData });
    setErrors({});
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate(formData)) return;

    setSaving(true);
    try {
      const authFetch = createAuthenticatedFetch(() => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      });
      const API_BASE = getApiBase().replace(/\/$/, '');

      // Convert string values to numbers for API
      const numericData = {};
      Object.keys(formData).forEach((key) => {
        numericData[key] = parseInt(formData[key], 10);
      });

      const response = await authFetch(`${API_BASE}/manage-fees`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(numericData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `HTTP error! status: ${response.status}${errorData.details ? ': ' + errorData.details : ''}`
        );
      }

      const result = await response.json();

      // Update saved data with the response
      const stringifiedFees = {};
      Object.keys(result.fees).forEach((key) => {
        stringifiedFees[key] = result.fees[key]?.toString() || '0';
      });

      setSavedData(stringifiedFees);
      setIsEditing(false);
      setFetchError(null);
    } catch (error) {
      setFetchError('Failed to save fees. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // const items = [
  //   {
  //     label: 'Overdue Fee',
  //     key: 'overDueFee',
  //     placeholder: defaultFees.overDueFee,
  //   },
  //   {
  //     label: 'Damage Fee',
  //     key: 'damageFee',
  //     placeholder: defaultFees.damageFee,
  //   },
  //   {
  //     label: 'Equipment Loss Fee',
  //     key: 'equipmentLossFee',
  //     placeholder: defaultFees.equipmentLossFee,
  //   },
  //   {
  //     label: 'Gas Level Fee',
  //     key: 'gasLevelFee',
  //     placeholder: defaultFees.gasLevelFee,
  //   },
  //   {
  //     label: 'Cleaning Fee',
  //     key: 'cleaningFee',
  //     placeholder: defaultFees.cleaningFee,
  //   },
  // ];

  return (
    <Dialog
      open={!!show}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      disableScrollLock // prevent scrollbar removal => no width jump
      disableEnforceFocus // Prevents focus enforcement issues
      disableAutoFocus // Prevents automatic focus on first element
      aria-labelledby="manage-fees-dialog-title"
      aria-describedby="manage-fees-dialog-description"
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <DialogTitle id="manage-fees-dialog-title" sx={{ pb: 1 }}>
          Manage Fees
        </DialogTitle>
        {!isEditing && (
          <Button
            type="button"
            variant="contained"
            color="primary"
            sx={{ mr: 3 }}
            onClick={handleStartEdit}
          >
            Edit
          </Button>
        )}
      </Box>

      <DialogContent id="manage-fees-dialog-description" dividers>
        {fetchError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {fetchError}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {!isEditing && !loading && (
          <Stack spacing={1.25}>
            {feeItems.map((it) => (
              <Box
                key={it.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <Typography>{it.label}</Typography>
                <Typography fontWeight={600}>
                  {formatPeso(savedData[it.key] || '0')}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}

        {isEditing && !loading && (
          <form id="manageFeesForm" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {feeItems.map((it) => (
                <TextField
                  key={it.key}
                  label={it.label}
                  name={it.key}
                  type="text"
                  inputMode="numeric"
                  value={formData[it.key] || ''}
                  onChange={handleAmountChange}
                  onKeyDown={blockNonNumericKeys}
                  required
                  error={!!errors[it.key]}
                  helperText={errors[it.key]}
                  fullWidth
                  inputProps={{ pattern: '[0-9]*' }}
                />
              ))}
            </Stack>
          </form>
        )}
      </DialogContent>

      {isEditing && (
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
              form="manageFeesForm"
              variant="contained"
              color="success"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : null}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              onClick={handleCancelEdit}
              color="error"
              variant="outlined"
              disabled={saving}
              sx={{
                '&:hover': { backgroundColor: 'error.main', color: 'white' },
              }}
            >
              Cancel
            </Button>
          </Box>
        </DialogActions>
      )}
    </Dialog>
  );
}
