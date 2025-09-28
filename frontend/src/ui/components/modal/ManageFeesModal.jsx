import React, { useState } from 'react';
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
} from '@mui/material';

// Single source of truth for default amounts (also used as placeholders)
const defaultFees = {
  overDueFee: '100',
  damageFee: '10000',
  equipmentLossFee: '1000',
  gasLevelFee: '300',
  cleaningFee: '200',
};

// Zod schema for positive integer fees
const feesSchema = z.object({
  overDueFee: z.coerce.number().int().gt(0, 'Must be a positive integer'),
  damageFee: z.coerce.number().int().gt(0, 'Must be a positive integer'),
  equipmentLossFee: z.coerce.number().int().gt(0, 'Must be a positive integer'),
  gasLevelFee: z.coerce.number().int().gt(0, 'Must be a positive integer'),
  cleaningFee: z.coerce.number().int().gt(0, 'Must be a positive integer'),
});

const formatPeso = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return '₱ 0';
  return `₱ ${n.toLocaleString('en-PH')}`;
};

export default function ManageFeesModal({ show, onClose }) {
  // Saved (view) values: initialize with defaults
  const [savedData, setSavedData] = useState({ ...defaultFees });

  // Editing state
  const [isEditing, setIsEditing] = useState(false);

  // In-form editing values: initialize with defaults
  const [formData, setFormData] = useState({ ...defaultFees });

  const [errors, setErrors] = useState({});

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate(formData)) return;
    setSavedData({ ...formData });
    setIsEditing(false);
  };

  const items = [
    {
      label: 'Overdue Fee',
      key: 'overDueFee',
      placeholder: defaultFees.overDueFee,
    },
    {
      label: 'Damage Fee',
      key: 'damageFee',
      placeholder: defaultFees.damageFee,
    },
    {
      label: 'Equipment Loss Fee',
      key: 'equipmentLossFee',
      placeholder: defaultFees.equipmentLossFee,
    },
    {
      label: 'Gas Level Fee',
      key: 'gasLevelFee',
      placeholder: defaultFees.gasLevelFee,
    },
    {
      label: 'Cleaning Fee',
      key: 'cleaningFee',
      placeholder: defaultFees.cleaningFee,
    },
  ];

  return (
    <Dialog
      open={!!show}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      disableScrollLock // prevent scrollbar removal => no width jump
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Manage Fees</DialogTitle>
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

      <DialogContent dividers>
        {!isEditing && (
          <Stack spacing={1.25}>
            {items.map((it) => (
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
                  {formatPeso(savedData[it.key])}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}

        {isEditing && (
          <form id="manageFeesForm" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {items.map((it) => (
                <TextField
                  key={it.key}
                  label={it.label}
                  name={it.key}
                  type="text"
                  inputMode="numeric"
                  value={formData[it.key]}
                  onChange={handleAmountChange}
                  onKeyDown={blockNonNumericKeys}
                  placeholder={it.placeholder}
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
            >
              Save
            </Button>
            <Button
              onClick={handleCancelEdit}
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
      )}
    </Dialog>
  );
}
